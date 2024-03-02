var H5P = H5P || {};
/**
 * Transition contains helper function relevant for transitioning
 */
H5P.Transition = (function ($) {

  /**
   * @class
   * @namespace H5P
   */
  Transition = {};

  /**
   * @private
   */
  Transition.transitionEndEventNames = {
    'WebkitTransition': 'webkitTransitionEnd',
    'transition':       'transitionend',
    'MozTransition':    'transitionend',
    'OTransition':      'oTransitionEnd',
    'msTransition':     'MSTransitionEnd'
  };

  /**
   * @private
   */
  Transition.cache = [];

  /**
   * Get the vendor property name for an event
   *
   * @function H5P.Transition.getVendorPropertyName
   * @static
   * @private
   * @param  {string} prop Generic property name
   * @return {string}      Vendor specific property name
   */
  Transition.getVendorPropertyName = function (prop) {

    if (Transition.cache[prop] !== undefined) {
      return Transition.cache[prop];
    }

    var div = document.createElement('div');

    // Handle unprefixed versions (FF16+, for example)
    if (prop in div.style) {
      Transition.cache[prop] = prop;
    }
    else {
      var prefixes = ['Moz', 'Webkit', 'O', 'ms'];
      var prop_ = prop.charAt(0).toUpperCase() + prop.substr(1);

      if (prop in div.style) {
        Transition.cache[prop] = prop;
      }
      else {
        for (var i = 0; i < prefixes.length; ++i) {
          var vendorProp = prefixes[i] + prop_;
          if (vendorProp in div.style) {
            Transition.cache[prop] = vendorProp;
            break;
          }
        }
      }
    }

    return Transition.cache[prop];
  };

  /**
   * Get the name of the transition end event
   *
   * @static
   * @private
   * @return {string}  description
   */
  Transition.getTransitionEndEventName = function () {
    return Transition.transitionEndEventNames[Transition.getVendorPropertyName('transition')] || undefined;
  };

  /**
   * Helper function for listening on transition end events
   *
   * @function H5P.Transition.onTransitionEnd
   * @static
   * @param  {domElement} $element The element which is transitioned
   * @param  {function} callback The callback to be invoked when transition is finished
   * @param  {number} timeout  Timeout in milliseconds. Fallback if transition event is never fired
   */
  Transition.onTransitionEnd = function ($element, callback, timeout) {
    // Fallback on 1 second if transition event is not supported/triggered
    timeout = timeout || 1000;
    Transition.transitionEndEventName = Transition.transitionEndEventName || Transition.getTransitionEndEventName();
    var callbackCalled = false;

    var doCallback = function () {
      if (callbackCalled) {
        return;
      }
      $element.off(Transition.transitionEndEventName, callback);
      callbackCalled = true;
      clearTimeout(timer);
      callback();
    };

    var timer = setTimeout(function () {
      doCallback();
    }, timeout);

    $element.on(Transition.transitionEndEventName, function () {
      doCallback();
    });
  };

  /**
   * Wait for a transition - when finished, invokes next in line
   *
   * @private
   *
   * @param {Object[]}    transitions             Array of transitions
   * @param {H5P.jQuery}  transitions[].$element  Dom element transition is performed on
   * @param {number=}     transitions[].timeout   Timeout fallback if transition end never is triggered
   * @param {bool=}       transitions[].break     If true, sequence breaks after this transition
   * @param {number}      index                   The index for current transition
   */
  var runSequence = function (transitions, index) {
    if (index >= transitions.length) {
      return;
    }

    var transition = transitions[index];
    H5P.Transition.onTransitionEnd(transition.$element, function () {
      if (transition.end) {
        transition.end();
      }
      if (transition.break !== true) {
        runSequence(transitions, index+1);
      }
    }, transition.timeout || undefined);
  };

  /**
   * Run a sequence of transitions
   *
   * @function H5P.Transition.sequence
   * @static
   * @param {Object[]}    transitions             Array of transitions
   * @param {H5P.jQuery}  transitions[].$element  Dom element transition is performed on
   * @param {number=}     transitions[].timeout   Timeout fallback if transition end never is triggered
   * @param {bool=}       transitions[].break     If true, sequence breaks after this transition
   */
  Transition.sequence = function (transitions) {
    runSequence(transitions, 0);
  };

  return Transition;
})(H5P.jQuery);
;var H5P = H5P || {};

/**
 * Class responsible for creating a help text dialog
 */
H5P.JoubelHelpTextDialog = (function ($) {

  var numInstances = 0;
  /**
   * Display a pop-up containing a message.
   *
   * @param {H5P.jQuery}  $container  The container which message dialog will be appended to
   * @param {string}      message     The message
   * @param {string}      closeButtonTitle The title for the close button
   * @return {H5P.jQuery}
   */
  function JoubelHelpTextDialog(header, message, closeButtonTitle) {
    H5P.EventDispatcher.call(this);

    var self = this;

    numInstances++;
    var headerId = 'joubel-help-text-header-' + numInstances;
    var helpTextId = 'joubel-help-text-body-' + numInstances;

    var $helpTextDialogBox = $('<div>', {
      'class': 'joubel-help-text-dialog-box',
      'role': 'dialog',
      'aria-labelledby': headerId,
      'aria-describedby': helpTextId
    });

    $('<div>', {
      'class': 'joubel-help-text-dialog-background'
    }).appendTo($helpTextDialogBox);

    var $helpTextDialogContainer = $('<div>', {
      'class': 'joubel-help-text-dialog-container'
    }).appendTo($helpTextDialogBox);

    $('<div>', {
      'class': 'joubel-help-text-header',
      'id': headerId,
      'role': 'header',
      'html': header
    }).appendTo($helpTextDialogContainer);

    $('<div>', {
      'class': 'joubel-help-text-body',
      'id': helpTextId,
      'html': message,
      'role': 'document',
      'tabindex': 0
    }).appendTo($helpTextDialogContainer);

    var handleClose = function () {
      $helpTextDialogBox.remove();
      self.trigger('closed');
    };

    var $closeButton = $('<div>', {
      'class': 'joubel-help-text-remove',
      'role': 'button',
      'title': closeButtonTitle,
      'tabindex': 1,
      'click': handleClose,
      'keydown': function (event) {
        // 32 - space, 13 - enter
        if ([32, 13].indexOf(event.which) !== -1) {
          event.preventDefault();
          handleClose();
        }
      }
    }).appendTo($helpTextDialogContainer);

    /**
     * Get the DOM element
     * @return {HTMLElement}
     */
    self.getElement = function () {
      return $helpTextDialogBox;
    };

    self.focus = function () {
      $closeButton.focus();
    };
  }

  JoubelHelpTextDialog.prototype = Object.create(H5P.EventDispatcher.prototype);
  JoubelHelpTextDialog.prototype.constructor = JoubelHelpTextDialog;

  return JoubelHelpTextDialog;
}(H5P.jQuery));
;var H5P = H5P || {};

/**
 * Class responsible for creating auto-disappearing dialogs
 */
H5P.JoubelMessageDialog = (function ($) {

  /**
   * Display a pop-up containing a message.
   *
   * @param {H5P.jQuery} $container The container which message dialog will be appended to
   * @param {string} message The message
   * @return {H5P.jQuery}
   */
  function JoubelMessageDialog ($container, message) {
    var timeout;

    var removeDialog = function () {
      $warning.remove();
      clearTimeout(timeout);
      $container.off('click.messageDialog');
    };

    // Create warning popup:
    var $warning = $('<div/>', {
      'class': 'joubel-message-dialog',
      text: message
    }).appendTo($container);

    // Remove after 3 seconds or if user clicks anywhere in $container:
    timeout = setTimeout(removeDialog, 3000);
    $container.on('click.messageDialog', removeDialog);

    return $warning;
  }

  return JoubelMessageDialog;
})(H5P.jQuery);
;var H5P = H5P || {};

/**
 * Class responsible for creating a circular progress bar
 */

H5P.JoubelProgressCircle = (function ($) {

  /**
   * Constructor for the Progress Circle
   *
   * @param {Number} number The amount of progress to display
   * @param {string} progressColor Color for the progress meter
   * @param {string} backgroundColor Color behind the progress meter
   */
  function ProgressCircle(number, progressColor, fillColor, backgroundColor) {
    progressColor = progressColor || '#1a73d9';
    fillColor = fillColor || '#f0f0f0';
    backgroundColor = backgroundColor || '#ffffff';
    var progressColorRGB = this.hexToRgb(progressColor);

    //Verify number
    try {
      number = Number(number);
      if (number === '') {
        throw 'is empty';
      }
      if (isNaN(number)) {
        throw 'is not a number';
      }
    } catch (e) {
      number = 'err';
    }

    //Draw circle
    if (number > 100) {
      number = 100;
    }

    // We can not use rgba, since they will stack on top of each other.
    // Instead we create the equivalent of the rgba color
    // and applies this to the activeborder and background color.
    var progressColorString = 'rgb(' + parseInt(progressColorRGB.r, 10) +
      ',' + parseInt(progressColorRGB.g, 10) +
      ',' + parseInt(progressColorRGB.b, 10) + ')';

    // Circle wrapper
    var $wrapper = $('<div/>', {
      'class': "joubel-progress-circle-wrapper"
    });

    //Active border indicates progress
    var $activeBorder = $('<div/>', {
      'class': "joubel-progress-circle-active-border"
    }).appendTo($wrapper);

    //Background circle
    var $backgroundCircle = $('<div/>', {
      'class': "joubel-progress-circle-circle"
    }).appendTo($activeBorder);

    //Progress text/number
    $('<span/>', {
      'text': number + '%',
      'class': "joubel-progress-circle-percentage"
    }).appendTo($backgroundCircle);

    var deg = number * 3.6;
    if (deg <= 180) {
      $activeBorder.css('background-image',
        'linear-gradient(' + (90 + deg) + 'deg, transparent 50%, ' + fillColor + ' 50%),' +
        'linear-gradient(90deg, ' + fillColor + ' 50%, transparent 50%)')
        .css('border', '2px solid' + backgroundColor)
        .css('background-color', progressColorString);
    } else {
      $activeBorder.css('background-image',
        'linear-gradient(' + (deg - 90) + 'deg, transparent 50%, ' + progressColorString + ' 50%),' +
        'linear-gradient(90deg, ' + fillColor + ' 50%, transparent 50%)')
        .css('border', '2px solid' + backgroundColor)
        .css('background-color', progressColorString);
    }

    this.$activeBorder = $activeBorder;
    this.$backgroundCircle = $backgroundCircle;
    this.$wrapper = $wrapper;

    this.initResizeFunctionality();

    return $wrapper;
  }

  /**
   * Initializes resize functionality for the progress circle
   */
  ProgressCircle.prototype.initResizeFunctionality = function () {
    var self = this;

    $(window).resize(function () {
      // Queue resize
      setTimeout(function () {
        self.resize();
      });
    });

    // First resize
    setTimeout(function () {
      self.resize();
    }, 0);
  };

  /**
   * Resize function makes progress circle grow or shrink relative to parent container
   */
  ProgressCircle.prototype.resize = function () {
    var $parent = this.$wrapper.parent();

    if ($parent !== undefined && $parent) {

      // Measurements
      var fontSize = parseInt($parent.css('font-size'), 10);

      // Static sizes
      var fontSizeMultiplum = 3.75;
      var progressCircleWidthPx = parseInt((fontSize / 4.5), 10) % 2 === 0 ? parseInt((fontSize / 4.5), 10) + 4 : parseInt((fontSize / 4.5), 10) + 5;
      var progressCircleOffset = progressCircleWidthPx / 2;

      var width = fontSize * fontSizeMultiplum;
      var height = fontSize * fontSizeMultiplum;
      this.$activeBorder.css({
        'width': width,
        'height': height
      });

      this.$backgroundCircle.css({
        'width': width - progressCircleWidthPx,
        'height': height - progressCircleWidthPx,
        'top': progressCircleOffset,
        'left': progressCircleOffset
      });
    }
  };

  /**
   * Hex to RGB conversion
   * @param hex
   * @returns {{r: Number, g: Number, b: Number}}
   */
  ProgressCircle.prototype.hexToRgb = function (hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  return ProgressCircle;

}(H5P.jQuery));
;var H5P = H5P || {};

H5P.SimpleRoundedButton = (function ($) {

  /**
   * Creates a new tip
   */
  function SimpleRoundedButton(text) {

    var $simpleRoundedButton = $('<div>', {
      'class': 'joubel-simple-rounded-button',
      'title': text,
      'role': 'button',
      'tabindex': '0'
    }).keydown(function (e) {
      // 32 - space, 13 - enter
      if ([32, 13].indexOf(e.which) !== -1) {
        $(this).click();
        e.preventDefault();
      }
    });

    $('<span>', {
      'class': 'joubel-simple-rounded-button-text',
      'html': text
    }).appendTo($simpleRoundedButton);

    return $simpleRoundedButton;
  }

  return SimpleRoundedButton;
}(H5P.jQuery));
;var H5P = H5P || {};

/**
 * Class responsible for creating speech bubbles
 */
H5P.JoubelSpeechBubble = (function ($) {

  var $currentSpeechBubble;
  var $currentContainer;  
  var $tail;
  var $innerTail;
  var removeSpeechBubbleTimeout;
  var currentMaxWidth;

  var DEFAULT_MAX_WIDTH = 400;

  var iDevice = navigator.userAgent.match(/iPod|iPhone|iPad/g) ? true : false;

  /**
   * Creates a new speech bubble
   *
   * @param {H5P.jQuery} $container The speaking object
   * @param {string} text The text to display
   * @param {number} maxWidth The maximum width of the bubble
   * @return {H5P.JoubelSpeechBubble}
   */
  function JoubelSpeechBubble($container, text, maxWidth) {
    maxWidth = maxWidth || DEFAULT_MAX_WIDTH;
    currentMaxWidth = maxWidth;
    $currentContainer = $container;

    this.isCurrent = function ($tip) {
      return $tip.is($currentContainer);
    };

    this.remove = function () {
      remove();
    };

    var fadeOutSpeechBubble = function ($speechBubble) {
      if (!$speechBubble) {
        return;
      }

      // Stop removing bubble
      clearTimeout(removeSpeechBubbleTimeout);

      $speechBubble.removeClass('show');
      setTimeout(function () {
        if ($speechBubble) {
          $speechBubble.remove();
          $speechBubble = undefined;
        }
      }, 500);
    };

    if ($currentSpeechBubble !== undefined) {
      remove();
    }

    var $h5pContainer = getH5PContainer($container);

    // Make sure we fade out old speech bubble
    fadeOutSpeechBubble($currentSpeechBubble);

    // Create bubble
    $tail = $('<div class="joubel-speech-bubble-tail"></div>');
    $innerTail = $('<div class="joubel-speech-bubble-inner-tail"></div>');
    var $innerBubble = $(
      '<div class="joubel-speech-bubble-inner">' +
      '<div class="joubel-speech-bubble-text">' + text + '</div>' +
      '</div>'
    ).prepend($innerTail);

    $currentSpeechBubble = $(
      '<div class="joubel-speech-bubble" aria-live="assertive">'
    ).append([$tail, $innerBubble])
      .appendTo($h5pContainer);

    // Show speech bubble with transition
    setTimeout(function () {
      $currentSpeechBubble.addClass('show');
    }, 0);

    position($currentSpeechBubble, $currentContainer, maxWidth, $tail, $innerTail);

    // Handle click to close
    H5P.$body.on('mousedown.speechBubble', handleOutsideClick);

    // Handle window resizing
    H5P.$window.on('resize', '', handleResize);

    // Handle clicks when inside IV which blocks bubbling.
    $container.parents('.h5p-dialog')
      .on('mousedown.speechBubble', handleOutsideClick);

    if (iDevice) {
      H5P.$body.css('cursor', 'pointer');
    }

    return this;
  }

  // Remove speechbubble if it belongs to a dom element that is about to be hidden
  H5P.externalDispatcher.on('domHidden', function (event) {
    if ($currentSpeechBubble !== undefined && event.data.$dom.find($currentContainer).length !== 0) {
      remove();
    }
  });

  /**
   * Returns the closest h5p container for the given DOM element.
   * 
   * @param {object} $container jquery element
   * @return {object} the h5p container (jquery element)
   */
  function getH5PContainer($container) {
    var $h5pContainer = $container.closest('.h5p-frame');

    // Check closest h5p frame first, then check for container in case there is no frame.
    if (!$h5pContainer.length) {
      $h5pContainer = $container.closest('.h5p-container');
    }

    return $h5pContainer;
  }

  /**
   * Event handler that is called when the window is resized.
   */
  function handleResize() {
    position($currentSpeechBubble, $currentContainer, currentMaxWidth, $tail, $innerTail);
  }

  /**
   * Repositions the speech bubble according to the position of the container.
   * 
   * @param {object} $currentSpeechbubble the speech bubble that should be positioned   
   * @param {object} $container the container to which the speech bubble should point 
   * @param {number} maxWidth the maximum width of the speech bubble
   * @param {object} $tail the tail (the triangle that points to the referenced container)
   * @param {object} $innerTail the inner tail (the triangle that points to the referenced container)
   */
  function position($currentSpeechBubble, $container, maxWidth, $tail, $innerTail) {
    var $h5pContainer = getH5PContainer($container);

    // Calculate offset between the button and the h5p frame
    var offset = getOffsetBetween($h5pContainer, $container);

    var direction = (offset.bottom > offset.top ? 'bottom' : 'top');
    var tipWidth = offset.outerWidth * 0.9; // Var needs to be renamed to make sense
    var bubbleWidth = tipWidth > maxWidth ? maxWidth : tipWidth;

    var bubblePosition = getBubblePosition(bubbleWidth, offset);
    var tailPosition = getTailPosition(bubbleWidth, bubblePosition, offset, $container.width());
    // Need to set font-size, since element is appended to body.
    // Using same font-size as parent. In that way it will grow accordingly
    // when resizing
    var fontSize = 16;//parseFloat($parent.css('font-size'));

    // Set width and position of speech bubble
    $currentSpeechBubble.css(bubbleCSS(
      direction,
      bubbleWidth,
      bubblePosition,
      fontSize
    ));

    var preparedTailCSS = tailCSS(direction, tailPosition);
    $tail.css(preparedTailCSS);
    $innerTail.css(preparedTailCSS);
  }

  /**
   * Static function for removing the speechbubble
   */
  var remove = function () {
    H5P.$body.off('mousedown.speechBubble');
    H5P.$window.off('resize', '', handleResize);
    $currentContainer.parents('.h5p-dialog').off('mousedown.speechBubble');
    if (iDevice) {
      H5P.$body.css('cursor', '');
    }
    if ($currentSpeechBubble !== undefined) {
      // Apply transition, then remove speech bubble
      $currentSpeechBubble.removeClass('show');

      // Make sure we remove any old timeout before reassignment
      clearTimeout(removeSpeechBubbleTimeout);
      removeSpeechBubbleTimeout = setTimeout(function () {
        $currentSpeechBubble.remove();
        $currentSpeechBubble = undefined;
      }, 500);
    }
    // Don't return false here. If the user e.g. clicks a button when the bubble is visible,
    // we want the bubble to disapear AND the button to receive the event
  };

  /**
   * Remove the speech bubble and container reference
   */
  function handleOutsideClick(event) {
    if (event.target === $currentContainer[0]) {
      return; // Button clicks are not outside clicks
    }

    remove();
    // There is no current container when a container isn't clicked
    $currentContainer = undefined;
  }

  /**
   * Calculate position for speech bubble
   *
   * @param {number} bubbleWidth The width of the speech bubble
   * @param {object} offset
   * @return {object} Return position for the speech bubble
   */
  function getBubblePosition(bubbleWidth, offset) {
    var bubblePosition = {};

    var tailOffset = 9;
    var widthOffset = bubbleWidth / 2;

    // Calculate top position
    bubblePosition.top = offset.top + offset.innerHeight;

    // Calculate bottom position
    bubblePosition.bottom = offset.bottom + offset.innerHeight + tailOffset;

    // Calculate left position
    if (offset.left < widthOffset) {
      bubblePosition.left = 3;
    }
    else if ((offset.left + widthOffset) > offset.outerWidth) {
      bubblePosition.left = offset.outerWidth - bubbleWidth - 3;
    }
    else {
      bubblePosition.left = offset.left - widthOffset + (offset.innerWidth / 2);
    }

    return bubblePosition;
  }

  /**
   * Calculate position for speech bubble tail
   *
   * @param {number} bubbleWidth The width of the speech bubble
   * @param {object} bubblePosition Speech bubble position
   * @param {object} offset
   * @param {number} iconWidth The width of the tip icon
   * @return {object} Return position for the tail
   */
  function getTailPosition(bubbleWidth, bubblePosition, offset, iconWidth) {
    var tailPosition = {};
    // Magic numbers. Tuned by hand so that the tail fits visually within
    // the bounds of the speech bubble.
    var leftBoundary = 9;
    var rightBoundary = bubbleWidth - 20;

    tailPosition.left = offset.left - bubblePosition.left + (iconWidth / 2) - 6;
    if (tailPosition.left < leftBoundary) {
      tailPosition.left = leftBoundary;
    }
    if (tailPosition.left > rightBoundary) {
      tailPosition.left = rightBoundary;
    }

    tailPosition.top = -6;
    tailPosition.bottom = -6;

    return tailPosition;
  }

  /**
   * Return bubble CSS for the desired growth direction
   *
   * @param {string} direction The direction the speech bubble will grow
   * @param {number} width The width of the speech bubble
   * @param {object} position Speech bubble position
   * @param {number} fontSize The size of the bubbles font
   * @return {object} Return CSS
   */
  function bubbleCSS(direction, width, position, fontSize) {
    if (direction === 'top') {
      return {
        width: width + 'px',
        bottom: position.bottom + 'px',
        left: position.left + 'px',
        fontSize: fontSize + 'px',
        top: ''
      };
    }
    else {
      return {
        width: width + 'px',
        top: position.top + 'px',
        left: position.left + 'px',
        fontSize: fontSize + 'px',
        bottom: ''
      };
    }
  }

  /**
   * Return tail CSS for the desired growth direction
   *
   * @param {string} direction The direction the speech bubble will grow
   * @param {object} position Tail position
   * @return {object} Return CSS
   */
  function tailCSS(direction, position) {
    if (direction === 'top') {
      return {
        bottom: position.bottom + 'px',
        left: position.left + 'px',
        top: ''
      };
    }
    else {
      return {
        top: position.top + 'px',
        left: position.left + 'px',
        bottom: ''
      };
    }
  }

  /**
   * Calculates the offset between an element inside a container and the
   * container. Only works if all the edges of the inner element are inside the
   * outer element.
   * Width/height of the elements is included as a convenience.
   *
   * @param {H5P.jQuery} $outer
   * @param {H5P.jQuery} $inner
   * @return {object} Position offset
   */
  function getOffsetBetween($outer, $inner) {
    var outer = $outer[0].getBoundingClientRect();
    var inner = $inner[0].getBoundingClientRect();

    return {
      top: inner.top - outer.top,
      right: outer.right - inner.right,
      bottom: outer.bottom - inner.bottom,
      left: inner.left - outer.left,
      innerWidth: inner.width,
      innerHeight: inner.height,
      outerWidth: outer.width,
      outerHeight: outer.height
    };
  }

  return JoubelSpeechBubble;
})(H5P.jQuery);
;var H5P = H5P || {};

H5P.JoubelThrobber = (function ($) {

  /**
   * Creates a new tip
   */
  function JoubelThrobber() {

    // h5p-throbber css is described in core
    var $throbber = $('<div/>', {
      'class': 'h5p-throbber'
    });

    return $throbber;
  }

  return JoubelThrobber;
}(H5P.jQuery));
;H5P.JoubelTip = (function ($) {
  var $conv = $('<div/>');

  /**
   * Creates a new tip element.
   *
   * NOTE that this may look like a class but it doesn't behave like one.
   * It returns a jQuery object.
   *
   * @param {string} tipHtml The text to display in the popup
   * @param {Object} [behaviour] Options
   * @param {string} [behaviour.tipLabel] Set to use a custom label for the tip button (you want this for good A11Y)
   * @param {boolean} [behaviour.helpIcon] Set to 'true' to Add help-icon classname to Tip button (changes the icon)
   * @param {boolean} [behaviour.showSpeechBubble] Set to 'false' to disable functionality (you may this in the editor)
   * @param {boolean} [behaviour.tabcontrol] Set to 'true' if you plan on controlling the tabindex in the parent (tabindex="-1")
   * @return {H5P.jQuery|undefined} Tip button jQuery element or 'undefined' if invalid tip
   */
  function JoubelTip(tipHtml, behaviour) {

    // Keep track of the popup that appears when you click the Tip button
    var speechBubble;

    // Parse tip html to determine text
    var tipText = $conv.html(tipHtml).text().trim();
    if (tipText === '') {
      return; // The tip has no textual content, i.e. it's invalid.
    }

    // Set default behaviour
    behaviour = $.extend({
      tipLabel: tipText,
      helpIcon: false,
      showSpeechBubble: true,
      tabcontrol: false
    }, behaviour);

    // Create Tip button
    var $tipButton = $('<div/>', {
      class: 'joubel-tip-container' + (behaviour.showSpeechBubble ? '' : ' be-quiet'),
      'aria-label': behaviour.tipLabel,
      'aria-expanded': false,
      role: 'button',
      tabindex: (behaviour.tabcontrol ? -1 : 0),
      click: function (event) {
        // Toggle show/hide popup
        toggleSpeechBubble();
        event.preventDefault();
      },
      keydown: function (event) {
        if (event.which === 32 || event.which === 13) { // Space & enter key
          // Toggle show/hide popup
          toggleSpeechBubble();
          event.stopPropagation();
          event.preventDefault();
        }
        else { // Any other key
          // Toggle hide popup
          toggleSpeechBubble(false);
        }
      },
      // Add markup to render icon
      html: '<span class="joubel-icon-tip-normal ' + (behaviour.helpIcon ? ' help-icon': '') + '">' +
              '<span class="h5p-icon-shadow"></span>' +
              '<span class="h5p-icon-speech-bubble"></span>' +
              '<span class="h5p-icon-info"></span>' +
            '</span>'
      // IMPORTANT: All of the markup elements must have 'pointer-events: none;'
    });

    const $tipAnnouncer = $('<div>', {
      'class': 'hidden-but-read',
      'aria-live': 'polite',
      appendTo: $tipButton,
    });

    /**
     * Tip button interaction handler.
     * Toggle show or hide the speech bubble popup when interacting with the
     * Tip button.
     *
     * @private
     * @param {boolean} [force] 'true' shows and 'false' hides.
     */
    var toggleSpeechBubble = function (force) {
      if (speechBubble !== undefined && speechBubble.isCurrent($tipButton)) {
        // Hide current popup
        speechBubble.remove();
        speechBubble = undefined;

        $tipButton.attr('aria-expanded', false);
        $tipAnnouncer.html('');
      }
      else if (force !== false && behaviour.showSpeechBubble) {
        // Create and show new popup
        speechBubble = H5P.JoubelSpeechBubble($tipButton, tipHtml);
        $tipButton.attr('aria-expanded', true);
        $tipAnnouncer.html(tipHtml);
      }
    };

    return $tipButton;
  }

  return JoubelTip;
})(H5P.jQuery);
;var H5P = H5P || {};

H5P.JoubelSlider = (function ($) {

  /**
   * Creates a new Slider
   *
   * @param {object} [params] Additional parameters
   */
  function JoubelSlider(params) {
    H5P.EventDispatcher.call(this);

    this.$slider = $('<div>', $.extend({
      'class': 'h5p-joubel-ui-slider'
    }, params));

    this.$slides = [];
    this.currentIndex = 0;
    this.numSlides = 0;
  }
  JoubelSlider.prototype = Object.create(H5P.EventDispatcher.prototype);
  JoubelSlider.prototype.constructor = JoubelSlider;

  JoubelSlider.prototype.addSlide = function ($content) {
    $content.addClass('h5p-joubel-ui-slide').css({
      'left': (this.numSlides*100) + '%'
    });
    this.$slider.append($content);
    this.$slides.push($content);

    this.numSlides++;

    if(this.numSlides === 1) {
      $content.addClass('current');
    }
  };

  JoubelSlider.prototype.attach = function ($container) {
    $container.append(this.$slider);
  };

  JoubelSlider.prototype.move = function (index) {
    var self = this;

    if(index === 0) {
      self.trigger('first-slide');
    }
    if(index+1 === self.numSlides) {
      self.trigger('last-slide');
    }
    self.trigger('move');

    var $previousSlide = self.$slides[this.currentIndex];
    H5P.Transition.onTransitionEnd(this.$slider, function () {
      $previousSlide.removeClass('current');
      self.trigger('moved');
    });
    this.$slides[index].addClass('current');

    var translateX = 'translateX(' + (-index*100) + '%)';
    this.$slider.css({
      '-webkit-transform': translateX,
      '-moz-transform': translateX,
      '-ms-transform': translateX,
      'transform': translateX
    });

    this.currentIndex = index;
  };

  JoubelSlider.prototype.remove = function () {
    this.$slider.remove();
  };

  JoubelSlider.prototype.next = function () {
    if(this.currentIndex+1 >= this.numSlides) {
      return;
    }

    this.move(this.currentIndex+1);
  };

  JoubelSlider.prototype.previous = function () {
    this.move(this.currentIndex-1);
  };

  JoubelSlider.prototype.first = function () {
    this.move(0);
  };

  JoubelSlider.prototype.last = function () {
    this.move(this.numSlides-1);
  };

  return JoubelSlider;
})(H5P.jQuery);
;var H5P = H5P || {};

/**
 * @module
 */
H5P.JoubelScoreBar = (function ($) {

  /* Need to use an id for the star SVG since that is the only way to reference
     SVG filters  */
  var idCounter = 0;

  /**
   * Creates a score bar
   * @class H5P.JoubelScoreBar
   * @param {number} maxScore  Maximum score
   * @param {string} [label] Makes it easier for readspeakers to identify the scorebar
   * @param {string} [helpText] Score explanation
   * @param {string} [scoreExplanationButtonLabel] Label for score explanation button
   */
  function JoubelScoreBar(maxScore, label, helpText, scoreExplanationButtonLabel) {
    var self = this;

    self.maxScore = maxScore;
    self.score = 0;
    idCounter++;

    /**
     * @const {string}
     */
    self.STAR_MARKUP = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 63.77 53.87" aria-hidden="true" focusable="false">' +
        '<title>star</title>' +
        '<filter id="h5p-joubelui-score-bar-star-inner-shadow-' + idCounter + '" x0="-50%" y0="-50%" width="200%" height="200%">' +
          '<feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur"></feGaussianBlur>' +
          '<feOffset dy="2" dx="4"></feOffset>' +
          '<feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowDiff"></feComposite>' +
          '<feFlood flood-color="#ffe95c" flood-opacity="1"></feFlood>' +
          '<feComposite in2="shadowDiff" operator="in"></feComposite>' +
          '<feComposite in2="SourceGraphic" operator="over" result="firstfilter"></feComposite>' +
          '<feGaussianBlur in="firstfilter" stdDeviation="3" result="blur2"></feGaussianBlur>' +
          '<feOffset dy="-2" dx="-4"></feOffset>' +
          '<feComposite in2="firstfilter" operator="arithmetic" k2="-1" k3="1" result="shadowDiff"></feComposite>' +
          '<feFlood flood-color="#ffe95c" flood-opacity="1"></feFlood>' +
          '<feComposite in2="shadowDiff" operator="in"></feComposite>' +
          '<feComposite in2="firstfilter" operator="over"></feComposite>' +
        '</filter>' +
        '<path class="h5p-joubelui-score-bar-star-shadow" d="M35.08,43.41V9.16H20.91v0L9.51,10.85,9,10.93C2.8,12.18,0,17,0,21.25a11.22,11.22,0,0,0,3,7.48l8.73,8.53-1.07,6.16Z"/>' +
        '<g>' +
          '<path class="h5p-joubelui-score-bar-star-border" d="M61.36,22.8,49.72,34.11l2.78,16a2.6,2.6,0,0,1,.05.64c0,.85-.37,1.6-1.33,1.6A2.74,2.74,0,0,1,49.94,52L35.58,44.41,21.22,52a2.93,2.93,0,0,1-1.28.37c-.91,0-1.33-.75-1.33-1.6,0-.21.05-.43.05-.64l2.78-16L9.8,22.8A2.57,2.57,0,0,1,9,21.25c0-1,1-1.33,1.81-1.49l16.07-2.35L34.09,2.83c.27-.59.85-1.33,1.55-1.33s1.28.69,1.55,1.33l7.21,14.57,16.07,2.35c.75.11,1.81.53,1.81,1.49A3.07,3.07,0,0,1,61.36,22.8Z"/>' +
          '<path class="h5p-joubelui-score-bar-star-fill" d="M61.36,22.8,49.72,34.11l2.78,16a2.6,2.6,0,0,1,.05.64c0,.85-.37,1.6-1.33,1.6A2.74,2.74,0,0,1,49.94,52L35.58,44.41,21.22,52a2.93,2.93,0,0,1-1.28.37c-.91,0-1.33-.75-1.33-1.6,0-.21.05-.43.05-.64l2.78-16L9.8,22.8A2.57,2.57,0,0,1,9,21.25c0-1,1-1.33,1.81-1.49l16.07-2.35L34.09,2.83c.27-.59.85-1.33,1.55-1.33s1.28.69,1.55,1.33l7.21,14.57,16.07,2.35c.75.11,1.81.53,1.81,1.49A3.07,3.07,0,0,1,61.36,22.8Z"/>' +
          '<path filter="url(#h5p-joubelui-score-bar-star-inner-shadow-' + idCounter + ')" class="h5p-joubelui-score-bar-star-fill-full-score" d="M61.36,22.8,49.72,34.11l2.78,16a2.6,2.6,0,0,1,.05.64c0,.85-.37,1.6-1.33,1.6A2.74,2.74,0,0,1,49.94,52L35.58,44.41,21.22,52a2.93,2.93,0,0,1-1.28.37c-.91,0-1.33-.75-1.33-1.6,0-.21.05-.43.05-.64l2.78-16L9.8,22.8A2.57,2.57,0,0,1,9,21.25c0-1,1-1.33,1.81-1.49l16.07-2.35L34.09,2.83c.27-.59.85-1.33,1.55-1.33s1.28.69,1.55,1.33l7.21,14.57,16.07,2.35c.75.11,1.81.53,1.81,1.49A3.07,3.07,0,0,1,61.36,22.8Z"/>' +
        '</g>' +
      '</svg>';

    /**
     * @function appendTo
     * @memberOf H5P.JoubelScoreBar#
     * @param {H5P.jQuery}  $wrapper  Dom container
     */
    self.appendTo = function ($wrapper) {
      self.$scoreBar.appendTo($wrapper);
    };

    /**
     * Create the text representation of the scorebar .
     *
     * @private
     * @return {string}
     */
    var createLabel = function (score) {
      if (!label) {
        return '';
      }

      return label.replace(':num', score).replace(':total', self.maxScore);
    };

    /**
     * Creates the html for this widget
     *
     * @method createHtml
     * @private
     */
    var createHtml = function () {
      // Container div
      self.$scoreBar = $('<div>', {
        'class': 'h5p-joubelui-score-bar',
      });

      var $visuals = $('<div>', {
        'class': 'h5p-joubelui-score-bar-visuals',
        appendTo: self.$scoreBar
      });

      // The progress bar wrapper
      self.$progressWrapper = $('<div>', {
        'class': 'h5p-joubelui-score-bar-progress-wrapper',
        appendTo: $visuals
      });

      self.$progress = $('<div>', {
        'class': 'h5p-joubelui-score-bar-progress',
        'html': createLabel(self.score),
        appendTo: self.$progressWrapper
      });

      // The star
      $('<div>', {
        'class': 'h5p-joubelui-score-bar-star',
        html: self.STAR_MARKUP
      }).appendTo($visuals);

      // The score container
      var $numerics = $('<div>', {
        'class': 'h5p-joubelui-score-numeric',
        appendTo: self.$scoreBar,
        'aria-hidden': true
      });

      // The current score
      self.$scoreCounter = $('<span>', {
        'class': 'h5p-joubelui-score-number h5p-joubelui-score-number-counter',
        text: 0,
        appendTo: $numerics
      });

      // The separator
      $('<span>', {
        'class': 'h5p-joubelui-score-number-separator',
        text: '/',
        appendTo: $numerics
      });

      // Max score
      self.$maxScore = $('<span>', {
        'class': 'h5p-joubelui-score-number h5p-joubelui-score-max',
        text: self.maxScore,
        appendTo: $numerics
      });

      if (helpText) {
        H5P.JoubelUI.createTip(helpText, {
          tipLabel: scoreExplanationButtonLabel ? scoreExplanationButtonLabel : helpText,
          helpIcon: true
        }).appendTo(self.$scoreBar);
        self.$scoreBar.addClass('h5p-score-bar-has-help');
      }
    };

    /**
     * Set the current score
     * @method setScore
     * @memberOf H5P.JoubelScoreBar#
     * @param  {number} score
     */
    self.setScore = function (score) {
      // Do nothing if score hasn't changed
      if (score === self.score) {
        return;
      }
      self.score = score > self.maxScore ? self.maxScore : score;
      self.updateVisuals();
    };

    /**
     * Increment score
     * @method incrementScore
     * @memberOf H5P.JoubelScoreBar#
     * @param  {number=}        incrementBy Optional parameter, defaults to 1
     */
    self.incrementScore = function (incrementBy) {
      self.setScore(self.score + (incrementBy || 1));
    };

    /**
     * Set the max score
     * @method setMaxScore
     * @memberOf H5P.JoubelScoreBar#
     * @param  {number}    maxScore The max score
     */
    self.setMaxScore = function (maxScore) {
      self.maxScore = maxScore;
    };

    /**
     * Updates the progressbar visuals
     * @memberOf H5P.JoubelScoreBar#
     * @method updateVisuals
     */
    self.updateVisuals = function () {
      self.$progress.html(createLabel(self.score));
      self.$scoreCounter.text(self.score);
      self.$maxScore.text(self.maxScore);

      setTimeout(function () {
        // Start the progressbar animation
        self.$progress.css({
          width: ((self.score / self.maxScore) * 100) + '%'
        });

        H5P.Transition.onTransitionEnd(self.$progress, function () {
          // If fullscore fill the star and start the animation
          self.$scoreBar.toggleClass('h5p-joubelui-score-bar-full-score', self.score === self.maxScore);
          self.$scoreBar.toggleClass('h5p-joubelui-score-bar-animation-active', self.score === self.maxScore);

          // Only allow the star animation to run once
          self.$scoreBar.one("animationend", function() {
            self.$scoreBar.removeClass("h5p-joubelui-score-bar-animation-active");
          });
        }, 600);
      }, 300);
    };

    /**
     * Removes all classes
     * @method reset
     */
    self.reset = function () {
      self.$scoreBar.removeClass('h5p-joubelui-score-bar-full-score');
    };

    createHtml();
  }

  return JoubelScoreBar;
})(H5P.jQuery);
;var H5P = H5P || {};

H5P.JoubelProgressbar = (function ($) {

  /**
   * Joubel progressbar class
   * @method JoubelProgressbar
   * @constructor
   * @param  {number}          steps Number of steps
   * @param {Object} [options] Additional options
   * @param {boolean} [options.disableAria] Disable readspeaker assistance
   * @param {string} [options.progressText] A progress text for describing
   *  current progress out of total progress for readspeakers.
   *  e.g. "Slide :num of :total"
   */
  function JoubelProgressbar(steps, options) {
    H5P.EventDispatcher.call(this);
    var self = this;
    this.options = $.extend({
      progressText: 'Slide :num of :total'
    }, options);
    this.currentStep = 0;
    this.steps = steps;

    this.$progressbar = $('<div>', {
      'class': 'h5p-joubelui-progressbar'
    });
    this.$background = $('<div>', {
      'class': 'h5p-joubelui-progressbar-background'
    }).appendTo(this.$progressbar);
  }

  JoubelProgressbar.prototype = Object.create(H5P.EventDispatcher.prototype);
  JoubelProgressbar.prototype.constructor = JoubelProgressbar;

  JoubelProgressbar.prototype.updateAria = function () {
    var self = this;
    if (this.options.disableAria) {
      return;
    }

    if (!this.$currentStatus) {
      this.$currentStatus = $('<div>', {
        'class': 'h5p-joubelui-progressbar-slide-status-text',
        'aria-live': 'assertive'
      }).appendTo(this.$progressbar);
    }
    var interpolatedProgressText = self.options.progressText
      .replace(':num', self.currentStep)
      .replace(':total', self.steps);
    this.$currentStatus.html(interpolatedProgressText);
  };

  /**
   * Appends to a container
   * @method appendTo
   * @param  {H5P.jquery} $container
   */
  JoubelProgressbar.prototype.appendTo = function ($container) {
    this.$progressbar.appendTo($container);
  };

  /**
   * Update progress
   * @method setProgress
   * @param  {number}    step
   */
  JoubelProgressbar.prototype.setProgress = function (step) {
    // Check for valid value:
    if (step > this.steps || step < 0) {
      return;
    }
    this.currentStep = step;
    this.$background.css({
      width: ((this.currentStep/this.steps)*100) + '%'
    });

    this.updateAria();
  };

  /**
   * Increment progress with 1
   * @method next
   */
  JoubelProgressbar.prototype.next = function () {
    this.setProgress(this.currentStep+1);
  };

  /**
   * Reset progressbar
   * @method reset
   */
  JoubelProgressbar.prototype.reset = function () {
    this.setProgress(0);
  };

  /**
   * Check if last step is reached
   * @method isLastStep
   * @return {Boolean}
   */
  JoubelProgressbar.prototype.isLastStep = function () {
    return this.steps === this.currentStep;
  };

  return JoubelProgressbar;
})(H5P.jQuery);
;var H5P = H5P || {};

/**
 * H5P Joubel UI library.
 *
 * This is a utility library, which does not implement attach. I.e, it has to bee actively used by
 * other libraries
 * @module
 */
H5P.JoubelUI = (function ($) {

  /**
   * The internal object to return
   * @class H5P.JoubelUI
   * @static
   */
  function JoubelUI() {}

  /* Public static functions */

  /**
   * Create a tip icon
   * @method H5P.JoubelUI.createTip
   * @param  {string}  text   The textual tip
   * @param  {Object}  params Parameters
   * @return {H5P.JoubelTip}
   */
  JoubelUI.createTip = function (text, params) {
    return new H5P.JoubelTip(text, params);
  };

  /**
   * Create message dialog
   * @method H5P.JoubelUI.createMessageDialog
   * @param  {H5P.jQuery}               $container The dom container
   * @param  {string}                   message    The message
   * @return {H5P.JoubelMessageDialog}
   */
  JoubelUI.createMessageDialog = function ($container, message) {
    return new H5P.JoubelMessageDialog($container, message);
  };

  /**
   * Create help text dialog
   * @method H5P.JoubelUI.createHelpTextDialog
   * @param  {string}             header  The textual header
   * @param  {string}             message The textual message
   * @param  {string}             closeButtonTitle The title for the close button
   * @return {H5P.JoubelHelpTextDialog}
   */
  JoubelUI.createHelpTextDialog = function (header, message, closeButtonTitle) {
    return new H5P.JoubelHelpTextDialog(header, message, closeButtonTitle);
  };

  /**
   * Create progress circle
   * @method H5P.JoubelUI.createProgressCircle
   * @param  {number}             number          The progress (0 to 100)
   * @param  {string}             progressColor   The progress color in hex value
   * @param  {string}             fillColor       The fill color in hex value
   * @param  {string}             backgroundColor The background color in hex value
   * @return {H5P.JoubelProgressCircle}
   */
  JoubelUI.createProgressCircle = function (number, progressColor, fillColor, backgroundColor) {
    return new H5P.JoubelProgressCircle(number, progressColor, fillColor, backgroundColor);
  };

  /**
   * Create throbber for loading
   * @method H5P.JoubelUI.createThrobber
   * @return {H5P.JoubelThrobber}
   */
  JoubelUI.createThrobber = function () {
    return new H5P.JoubelThrobber();
  };

  /**
   * Create simple rounded button
   * @method H5P.JoubelUI.createSimpleRoundedButton
   * @param  {string}                  text The button label
   * @return {H5P.SimpleRoundedButton}
   */
  JoubelUI.createSimpleRoundedButton = function (text) {
    return new H5P.SimpleRoundedButton(text);
  };

  /**
   * Create Slider
   * @method H5P.JoubelUI.createSlider
   * @param  {Object} [params] Parameters
   * @return {H5P.JoubelSlider}
   */
  JoubelUI.createSlider = function (params) {
    return new H5P.JoubelSlider(params);
  };

  /**
   * Create Score Bar
   * @method H5P.JoubelUI.createScoreBar
   * @param  {number=}       maxScore The maximum score
   * @param {string} [label] Makes it easier for readspeakers to identify the scorebar
   * @return {H5P.JoubelScoreBar}
   */
  JoubelUI.createScoreBar = function (maxScore, label, helpText, scoreExplanationButtonLabel) {
    return new H5P.JoubelScoreBar(maxScore, label, helpText, scoreExplanationButtonLabel);
  };

  /**
   * Create Progressbar
   * @method H5P.JoubelUI.createProgressbar
   * @param  {number=}       numSteps The total numer of steps
   * @param {Object} [options] Additional options
   * @param {boolean} [options.disableAria] Disable readspeaker assistance
   * @param {string} [options.progressText] A progress text for describing
   *  current progress out of total progress for readspeakers.
   *  e.g. "Slide :num of :total"
   * @return {H5P.JoubelProgressbar}
   */
  JoubelUI.createProgressbar = function (numSteps, options) {
    return new H5P.JoubelProgressbar(numSteps, options);
  };

  /**
   * Create standard Joubel button
   *
   * @method H5P.JoubelUI.createButton
   * @param {object} params
   *  May hold any properties allowed by jQuery. If href is set, an A tag
   *  is used, if not a button tag is used.
   * @return {H5P.jQuery} The jquery element created
   */
  JoubelUI.createButton = function(params) {
    var type = 'button';
    if (params.href) {
      type = 'a';
    }
    else {
      params.type = 'button';
    }
    if (params.class) {
      params.class += ' h5p-joubelui-button';
    }
    else {
      params.class = 'h5p-joubelui-button';
    }
    return $('<' + type + '/>', params);
  };

  /**
   * Fix for iframe scoll bug in IOS. When focusing an element that doesn't have
   * focus support by default the iframe will scroll the parent frame so that
   * the focused element is out of view. This varies dependening on the elements
   * of the parent frame.
   */
  if (H5P.isFramed && !H5P.hasiOSiframeScrollFix &&
      /iPad|iPhone|iPod/.test(navigator.userAgent)) {
    H5P.hasiOSiframeScrollFix = true;

    // Keep track of original focus function
    var focus = HTMLElement.prototype.focus;

    // Override the original focus
    HTMLElement.prototype.focus = function () {
      // Only focus the element if it supports it natively
      if ( (this instanceof HTMLAnchorElement ||
            this instanceof HTMLInputElement ||
            this instanceof HTMLSelectElement ||
            this instanceof HTMLTextAreaElement ||
            this instanceof HTMLButtonElement ||
            this instanceof HTMLIFrameElement ||
            this instanceof HTMLAreaElement) && // HTMLAreaElement isn't supported by Safari yet.
          !this.getAttribute('role')) { // Focus breaks if a different role has been set
          // In theory this.isContentEditable should be able to recieve focus,
          // but it didn't work when tested.

        // Trigger the original focus with the proper context
        focus.call(this);
      }
    };
  }

  return JoubelUI;
})(H5P.jQuery);
;var H5P = H5P || {};
H5P.Flashcards = H5P.Flashcards || {};

/**
 * Flashcards xAPI generator
 *
 * @type {Object}
 */
H5P.Flashcards.xapiGenerator = (function ($) {
  const placeHolder = '__________';

  const getXapiEvent = function (instance) {
    const xAPIEvent = instance.createXAPIEventTemplate('answered');

    const definition = xAPIEvent.getVerifiedStatementValue(['object', 'definition']);
    $.extend(definition, getxAPIDefinition(instance));

    xAPIEvent.setScoredResult(
      instance.getScore(),
      instance.getMaxScore(),
      instance
    );

    xAPIEvent.data.statement.result.response = instance.answers.join('[,]');
    return xAPIEvent;
  };

  const getxAPIDefinition = function (instance) {
    const definition = {};
    definition.description = {
      'en-US': '<p>' + instance.options.description + '</p>'
    };
    definition.type = 'http://adlnet.gov/expapi/activities/cmi.interaction';
    definition.interactionType = 'fill-in';
    definition.correctResponsesPattern = [
      '{case_matters=' + instance.options.caseSensitive + '}'
    ];
    const crpAnswers = instance.options.cards.map(function (card) {
      return card.answer;
    }).join('[,]');

    definition.correctResponsesPattern[0] += crpAnswers;

    const cardDescriptions = instance.options.cards.map(function (card) {
      return '<p>' + card.text + ' ' + placeHolder + '</p>';
    }).join('');

    definition.description['en-US'] += cardDescriptions;
    return definition;
  };

  return {
    getXapiEvent: getXapiEvent,
  };
})(H5P.jQuery);;/**
 * Flashcards module.
 *
 * @param {H5P.jQuery} $
 */
H5P.Flashcards = (function ($, XapiGenerator) {

  C.counter = 0;

  /**
   * Initialize module.
   *
   * @param {Object} options Run parameters
   * @param {Number} id Content identification
   */
  function C(options, id) {
    H5P.EventDispatcher.call(this);
    this.answers = [];
    this.numAnswered = 0;
    this.contentId = this.id = id;
    this.options = $.extend({}, {
      description: "What does the card mean?",
      progressText: "Card @card of @total",
      next: "Next",
      previous: "Previous",
      checkAnswerText: "Check answer",
      showSolutionsRequiresInput: true,
      defaultAnswerText: "Your answer",
      correctAnswerText: "Correct",
      incorrectAnswerText: "Incorrect",
      showSolutionText: "Correct answer",
      answerShortText: "A:",
      informationText: "Information",
      caseSensitive: false,
      results: "Results",
      ofCorrect: "@score of @total correct",
      showResults: "Show results",
      retry : "Retry",
      cardAnnouncement: 'Incorrect answer. Correct answer was @answer',
      pageAnnouncement: 'Page @current of @total',
      correctAnswerAnnouncement: '@answer is correct!',
    }, options);
    this.$images = [];
    this.hasBeenReset = false;

    this.on('resize', this.resize, this);
  }

  C.prototype = Object.create(H5P.EventDispatcher.prototype);
  C.prototype.constructor = C;


  /**
   * Append field to wrapper.
   *
   * @param {H5P.jQuery} $container
   */
  C.prototype.attach = function ($container) {
    var that = this;

    if (this.isRoot()) {
      this.setActivityStarted();
    }

    this.$container = $container
      .addClass('h5p-flashcards')
      .html('<div class="h5p-loading">Loading, please wait...</div>');

    // Load card images. (we need their size before we can create the task)
    var loaded = 0;
    var load = function () {
      loaded++;
      if (loaded === that.options.cards.length) {
        that.cardsLoaded();
      }
    };

    for (var i = 0; i < this.options.cards.length; i++) {
      var card = this.options.cards[i];

      if (card.image !== undefined) {
        const $image = $('<img>', {
          'class': 'h5p-clue',
          src: H5P.getPath(card.image.path, this.id),
        });
        if (card.imageAltText) {
          $image.attr('alt', card.imageAltText);
        }

        if ($image.get().complete) {
          load();
        }
        else {
          $image.on('load', load);
        }

        this.$images[i] = $image;
      }
      else {
        this.$images[i] = $('<div class="h5p-clue"></div>');
        load();
      }
    }

    $('body').on('keydown', function (event) {
      // The user should be able to use the arrow keys when writing his answer
      if (event.target.tagName === 'INPUT') {
        return;
      }

      // Left
      if (event.keyCode === 37) {
        that.previous();
      }

      // Right
      else if (event.keyCode === 39) {
        that.next();
      }
    });
  };

  /**
   * Checks if the user anwer matches an answer on the card
   * @private
   *
   * @param card The card
   * @param userAnswer The user input
   * @return {Boolean} If the answer is found on the card
   */
  function isCorrectAnswer(card, userAnswer, caseSensitive) {
    var answer = C.$converter.html(card.answer || '').text();

    if (!caseSensitive) {
      answer = (answer ? answer.toLowerCase() : answer);
      userAnswer = (userAnswer ? userAnswer.toLowerCase() : userAnswer);
    }

    return answer === userAnswer;
  }

  /**
   * Get Score
   * @return {number}
   */
  C.prototype.getScore = function () {
    var that = this;

    return that.options.cards.reduce(function (sum, card, i) {
      return sum + (isCorrectAnswer(card, that.answers[i], that.options.caseSensitive) ? 1 : 0);
    }, 0);
  };

  /**
   * Get Score
   * @return {number}
   */
  C.prototype.getMaxScore = function () {
    return this.options.cards.length;
  };

  /**
   * Called when all cards has been loaded.
   */
  C.prototype.cardsLoaded = function () {
    var that = this;
    var $inner = this.$container.html(
      '<div class="h5p-description" title="' + this.options.description + '">' + this.options.description + '</div>' +
      '<div class="h5p-progress"></div>' +
      '<div class="h5p-inner" role="list"></div>' +
      '<div class="h5p-navigation">' +
        '<button type="button" class="h5p-button h5p-previous h5p-hidden" tabindex="0" title="' + this.options.previous + '" aria-label="' + this.options.previous + '"></button>' +
        '<button type="button" class="h5p-button h5p-next" tabindex="0" title="' + this.options.next + '" aria-label="' + this.options.next + '"></button>'
    ).children('.h5p-inner');

    // Create visual progress and add accessibility attributes
    this.$visualProgress = $('<div/>', {
      'class': 'h5p-visual-progress',
      'role': 'progressbar',
      'aria-valuemax': '100',
      'aria-valuemin': (100 / this.options.cards.length).toFixed(2)
    }).append($('<div/>', {
      'class': 'h5p-visual-progress-inner'
    })).appendTo(this.$container);

    this.$progress = this.$container.find('.h5p-progress');

    // Add cards
    for (var i = 0; i < this.options.cards.length; i++) {
      this.addCard(i, $inner);
    }

    // Set current:
    this.setCurrent($inner.find('>:first-child'));

    // Find highest image and set task height.
    var height = 0;
    for (i = 0; i < this.$images.length; i++) {
      var $image = this.$images[i];

      if ($image === undefined) {
        continue;
      }

      var imageHeight = $image.height();
      if (imageHeight > height) {
        height = imageHeight;
      }
    }

    // Active buttons
    var $buttonWrapper = $inner.next();
    this.$nextButton = $buttonWrapper.children('.h5p-next').click(function () {
      that.next();
    });
    this.$prevButton = $buttonWrapper.children('.h5p-previous').click(function () {
      that.previous();
    });

    if (this.options.cards.length < 2) {
      this.$nextButton.hide();
    }

    this.$current.next().addClass('h5p-next');

    $inner.initialImageContainerWidth = $inner.find('.h5p-imageholder').outerWidth();

    this.addShowResults($inner);
    this.createResultScreen();

    this.$inner = $inner;
    this.setProgress();
    this.trigger('resize');

    // Attach aria announcer
    this.$ariaAnnouncer = $('<div>', {
      'class': 'hidden-but-read',
      'aria-live': 'assertive',
      appendTo: this.$container,
    });
    this.$pageAnnouncer = $('<div>', {
      'class': 'hidden-but-read',
      'aria-live': 'assertive',
      appendTo: this.$container
    });

    // Announce first page if task was reset
    if (this.hasBeenReset) {
      // Read-speaker needs a small timeout to be able to read the announcement
      setTimeout(function () {
        this.announceCurrentPage();
      }.bind(this), 100);
    }
  };

  /**
   * Add show results
   * @param {H5P.jQuery} $inner
   */
  C.prototype.addShowResults = function ($inner) {
    var that = this;

    var $showResults = $(
      '<div class="h5p-show-results">' +
        '<span class="h5p-show-results-icon"></span>' +
        '<button type="button" class="h5p-show-results-label">' + that.options.showResults + '</button>' +
        '<button type="button" class="h5p-show-results-label-mobile">' + that.options.results + '</button>' +
      '</div>'
    );

    $showResults
      .on('click', function () {
        that.enableResultScreen();
      })
      .appendTo($inner.parent());
  };

  /**
   * Add card
   * @param {number} index
   * @param {H5P.jQuery} $inner
   */
  C.prototype.addCard = function (index, $inner) {
    var that = this;
    var card = this.options.cards[index];
    const cardId = ++C.counter;

    // Generate a new flashcards html and add it to h5p-inner
    var $card = $(
      '<div role="listitem" class="h5p-card h5p-animate' + (index === 0 ? ' h5p-current' : '') + '" aria-hidden="' + (index === 0 ? 'false' : 'true') + '"> ' +
        '<div class="h5p-cardholder">' +
          '<div class="h5p-imageholder">' +
            '<div class="h5p-flashcard-overlay">' +
            '</div>' +
          '</div>' +
          '<div class="h5p-foot">' +
            '<div class="h5p-imagetext" id="h5p-flashcard-card-' + cardId + '">' +
              (card.text !== undefined ? card.text : '') +
            '</div>' +
            '<div class="h5p-answer">' +
              '<div class="h5p-input">' +
                '<input type="text" class="h5p-textinput" tabindex="-1" placeholder="' + this.options.defaultAnswerText + '" aria-describedby="h5p-flashcard-card-' + cardId +'" autocomplete="off" spellcheck="false"/>' +
                '<button type="button" class="h5p-button h5p-check-button" tabindex="-1" title="' + this.options.checkAnswerText + '">' + this.options.checkAnswerText + '</button>' +
                '<button type="button" class="h5p-button h5p-icon-button" tabindex="-1" title="' + this.options.checkAnswerText + '"/>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>')
      .appendTo($inner);

    $card.find('.h5p-imageholder').prepend(this.$images[index]);

    $card.prepend($('<div class="h5p-flashcard-overlay"></div>').on('click', function () {
      if ($(this).parent().hasClass('h5p-previous')) {
        that.previous();
      }
      else {
        that.next();
      }
    }));

    // Add tip
    var $tip = H5P.JoubelUI.createTip(card.tip);
    if ($tip && $tip.length) { // Check for a jQuery object
      $tip.attr({
        tabindex: -1,
        title: this.options.informationText
      });
      $('.h5p-input', $card).append($tip).addClass('has-tip');
    }

    var $input = $card.find('.h5p-textinput');

    var handleClick = function () {
      var card = that.options.cards[index];
      var userAnswer = $input.val().trim();
      var userCorrect = isCorrectAnswer(card, userAnswer, that.options.caseSensitive);
      var done = false;

      if (userAnswer == '') {
        $input.focus();
      }

      if (!that.options.showSolutionsRequiresInput || userAnswer !== '' || userCorrect) {
        that.numAnswered++;
        $input.add(this).attr('disabled', true);

        that.answers[index] = userAnswer;
        that.triggerXAPI('interacted');

        if (userCorrect) {
          $input.parent()
            .addClass('h5p-correct')
            .append('<div class="h5p-feedback-label">' + that.options.correctAnswerText + '!</div>');
          $card.addClass('h5p-correct');

          $('<div class="h5p-solution">' +
            '<span class="solution-icon h5p-rotate-in"></span>' +
          '</div>').appendTo($card.find('.h5p-imageholder'));

          that.$ariaAnnouncer.html(that.options.correctAnswerAnnouncement.replace('@answer', userAnswer));
        }
        else {
          $input.parent()
            .addClass('h5p-wrong')
            .append('<span class="h5p-feedback-label">' + that.options.incorrectAnswerText + '!</span>');
          $card.addClass('h5p-wrong');

          $('<div class="h5p-solution">' +
            '<span class="solution-icon h5p-rotate-in"></span>' +
            '<span class="solution-text">' + (that.options.cards[index].answer ? that.options.showSolutionText + ': <span>' + that.options.cards[index].answer + '</span>' : '') + '</span>' +
          '</div>').appendTo($card.find('.h5p-imageholder'));

          const ariaText = that.options.cardAnnouncement.replace(
            '@answer',
            that.options.cards[index].answer
          );
          that.$ariaAnnouncer.html(ariaText);
        }

        done = (that.numAnswered >= that.options.cards.length);

        if (!done) {
          that.nextTimer = setTimeout(that.next.bind(that), 3500);
        }
        else {
          that.last();
        }
      }

      if (done) {
        that.triggerXAPICompleted(that.getScore(), that.getMaxScore());
        that.trigger('resize');
      }
    };

    $card.find('.h5p-check-button, .h5p-icon-button').click(handleClick);

    $input.keypress(function (event) {

      if (event.keyCode === 13) {
        handleClick();
        return false;
      }
    });

    return $card;
  };

  /**
   * Create result screen
   */
  C.prototype.createResultScreen = function () {
    var that = this;

    // Create the containers needed for the result screen
    this.$resultScreen = $('<div/>', {
      'class': 'h5p-flashcards-results',
    });

    $('<div/>', {
      'class': 'h5p-results-title',
      'text': this.options.results
    }).appendTo(this.$resultScreen);

    $('<div/>', {
      'class': 'h5p-results-score'
    }).appendTo(this.$resultScreen);

    $('<ul/>', {
      'class': 'h5p-results-list'
    }).appendTo(this.$resultScreen);

    this.$retryButton = $('<button/>', {
      'class': 'h5p-results-retry-button h5p-invisible h5p-button',
      'text': this.options.retry
    }).on('click', function () {
      that.resetTask();
    }).appendTo(this.$resultScreen);
  };

  /**
   * Enable result screen
   */
  C.prototype.enableResultScreen = function () {
    this.$inner.addClass('h5p-invisible');
    this.$inner.siblings().addClass('h5p-invisible');
    this.$resultScreen.appendTo(this.$container).addClass('show');

    var ofCorrectText = this.options.ofCorrect
      .replace(/@score/g, '<span>' + this.getScore() + '</span>')
      .replace(/@total/g, '<span>' + this.getMaxScore() + '</span>');

    this.$resultScreen.find('.h5p-results-score').html(ofCorrectText);

    // Create a list representing the cards and populate them
    for (var i = 0; i < this.options.cards.length; i++) {
      var card = this.options.cards[i];
      var $resultsContainer = this.$resultScreen.find('.h5p-results-list');

      var userAnswer = this.answers[i];
      var userCorrect = isCorrectAnswer(card, userAnswer, this.options.caseSensitive);

      var $listItem = $('<li/>', {
        'class': 'h5p-results-list-item' + (!userCorrect ? ' h5p-incorrect' : '')
      }).appendTo($resultsContainer);

      var $imageHolder = $('<div/>', {
        'class': 'h5p-results-image-holder',
      }).appendTo($listItem);

      if (card.image != undefined) {
        $imageHolder.css('background-image', 'url("' + H5P.getPath(card.image.path, this.id) + '")');
      }
      else {
        $imageHolder.addClass('no-image');
      }

      $('<div/>', {
        'class': 'h5p-results-question',
        'html': card.text
      }).appendTo($listItem);

      var $resultsAnswer = $('<div/>', {
        'class': 'h5p-results-answer',
        'text': this.answers[i]
      }).appendTo($listItem);

      $resultsAnswer.prepend('<span>' + this.options.answerShortText + ' </span>');

      if (!userCorrect) {
        $resultsAnswer.append('<span> ' + this.options.showSolutionText + ': </span>');
        $resultsAnswer.append('<span class="h5p-correct">' + card.answer + '</span>');
      }

      $('<div/>', {
        'class': 'h5p-results-box'
      }).appendTo($listItem);
    }
    if (this.getScore() < this.getMaxScore()) {
      this.$retryButton.removeClass('h5p-invisible');
    }
  };

  /**
   * Set Progress
   */
  C.prototype.setProgress = function () {
    var index = this.$current.index();
    this.$progress.text((index + 1) + ' / ' + this.options.cards.length);
    this.$visualProgress
      .attr('aria-valuenow', ((index + 1) / this.options.cards.length * 100).toFixed(2))
      .find('.h5p-visual-progress-inner').width((index + 1) / this.options.cards.length * 100 + '%');
  };

  /**
   * Set card as current card.
   *
   * Adjusts classes and tabindexes for existing current card and new
   * card.
   *
   * @param {H5P.jQuery} $card
   *   Class to add to existing current card.
   */
  C.prototype.setCurrent = function ($card) {
    // Remove from existing card.
    if (this.$current) {
      this.$current.find('.h5p-textinput').attr('tabindex', '-1');
      this.$current.find('.joubel-tip-container').attr('tabindex', '-1');
      this.$current.find('.h5p-check-button').attr('tabindex', '-1');
      this.$current.find('.h5p-icon-button').attr('tabindex', '-1');
    }

    // Set new card
    this.$current = $card;

    /* We can't set focus on anything until the transition is finished.
       If we do, iPad will try to center the focused element while the transition
       is running, and the card will be misplaced */
    $card.one('transitionend', function () {
      if ($card.hasClass('h5p-current') && !$card.find('.h5p-textinput')[0].disabled) {
        $card.find('.h5p-textinput').focus();
      }
      setTimeout(function () {
        this.announceCurrentPage();
      }.bind(this), 500);
    }.bind(this));

    // Update card classes
    $card.removeClass('h5p-previous h5p-next');
    $card.addClass('h5p-current');
    $card.attr('aria-hidden', 'false');

    $card.siblings()
      .removeClass('h5p-current h5p-previous h5p-next left right')
      .attr('aria-hidden', 'true')
      .find('.h5p-rotate-in').removeClass('h5p-rotate-in');

    $card.prev().addClass('h5p-previous');
    $card.next('.h5p-card').addClass('h5p-next');

    $card.prev().prevAll().addClass('left');
    $card.next().nextAll().addClass('right');

    // Update tab indexes
    $card.find('.h5p-textinput').attr('tabindex', '0');
    $card.find('.h5p-check-button').attr('tabindex', '0');
    $card.find('.h5p-icon-button').attr('tabindex', '0');
    $card.find('.joubel-tip-container').attr('tabindex', '0');
  };

  /**
   * Announces current page to assistive technologies
   */
  C.prototype.announceCurrentPage = function () {
    const pageText = this.options.pageAnnouncement
      .replace('@current', this.$current.index() + 1)
      .replace('@total', this.options.cards.length.toString());
    this.$pageAnnouncer.text(pageText);
  };

  /**
   * Display next card.
   */
  C.prototype.next = function () {
    var that = this;
    var $next = this.$current.next();

    clearTimeout(this.prevTimer);
    clearTimeout(this.nextTimer);

    if (!$next.length) {
      return;
    }

    that.setCurrent($next);
    if (!that.$current.next('.h5p-card').length) {
      that.$nextButton.addClass('h5p-hidden');
    }
    that.$prevButton.removeClass('h5p-hidden');
    that.setProgress();

    if ($next.is(':last-child') && that.numAnswered == that.options.cards.length) {
      that.$container.find('.h5p-show-results').show();
    }
  };

  /**
   * Display previous card.
   */
  C.prototype.previous = function () {
    var that = this;
    var $prev = this.$current.prev();

    clearTimeout(this.prevTimer);
    clearTimeout(this.nextTimer);

    if (!$prev.length) {
      return;
    }

    that.setCurrent($prev);
    if (!that.$current.prev().length) {
      that.$prevButton.addClass('h5p-hidden');
    }
    that.$nextButton.removeClass('h5p-hidden');
    that.setProgress();
    that.$container.find('.h5p-show-results').hide();
  };

  /**
   * Display last card.
   */
  C.prototype.last = function () {
    var $last = this.$inner.children().last();
    this.setCurrent($last);
    this.$nextButton.addClass('h5p-hidden');
    if (this.options.cards.length > 1) {
      this.$prevButton.removeClass('h5p-hidden');
    }
    this.setProgress();
    this.$container.find('.h5p-show-results').show();
    this.trigger('resize');
  };

  /**
   * Resets the whole task.
   * Used in contracts with integrated content.
   * @private
   */
  C.prototype.resetTask = function () {
    this.numAnswered = 0;
    this.hasBeenReset = true;
    this.cardsLoaded();
    this.trigger('resize');
  };

  /**
   * Gather copyright information from cards.
   *
   * @returns {H5P.ContentCopyrights}
   */
  C.prototype.getCopyrights = function () {
    var info = new H5P.ContentCopyrights();

    // Go through cards
    for (var i = 0; i < this.options.cards.length; i++) {
      var image = this.options.cards[i].image;
      if (image !== undefined && image.copyright !== undefined) {
        var rights = new H5P.MediaCopyright(image.copyright);
        rights.setThumbnail(new H5P.Thumbnail(H5P.getPath(image.path, this.id), image.width, image.height));
        info.addMedia(rights);
      }
    }

    return info;
  };

  /**
   * Update the dimensions and imagesizes of the task.
   */
  C.prototype.resize = function () {
    var self = this;
    if (self.$inner === undefined) {
      return;
    }
    var maxHeight = 0;
    var maxHeightImage = 0;

    if (this.$inner.width() / parseFloat($("body").css("font-size")) <= 31) {
      self.$container.addClass('h5p-mobile');
    }
    else {
      self.$container.removeClass('h5p-mobile');
    }

    //Find container dimensions needed to encapsule image and text.
    self.$inner.children('.h5p-card').each(function () {
      var cardholderHeight = maxHeightImage + $(this).find('.h5p-foot').outerHeight();
      var $button = $(this).find('.h5p-check-button');
      var $tipIcon = $(this).find('.joubel-tip-container');
      var $textInput = $(this).find('.h5p-textinput');
      maxHeight = cardholderHeight > maxHeight ? cardholderHeight : maxHeight;

      // Handle scaling and positioning of answer button, textfield and info icon, depending on width of answer button.
      if ($button.outerWidth() > $button.parent().width() * 0.4) {
        $button.parent().addClass('h5p-exceeds-width');
        $tipIcon.attr("style", "");
        $textInput.attr("style", "");
      }
      else {
        $button.parent().removeClass('h5p-exceeds-width');
        $tipIcon.css('right', $button.outerWidth());
        var emSize = parseInt($textInput.css('font-size'));
        $textInput.css('padding-right', $button.outerWidth() + ($textInput.parent().hasClass('has-tip') ? emSize * 2.5 : emSize));
      }
    });

    if (this.numAnswered < this.options.cards.length) {
      //Resize cards holder
      var innerHeight = 0;
      this.$inner.children('.h5p-card').each(function () {
        if ($(this).height() > innerHeight) {
          innerHeight = $(this).height();
        }
      });

      this.$inner.height(innerHeight);
    }

    var freeSpaceRight = this.$inner.children('.h5p-card').last().css("marginRight");

    if (parseInt(freeSpaceRight) < 160) {
      this.$container.find('.h5p-show-results')
        .addClass('h5p-mobile')
        .css('width', '');
    }
    else if (freeSpaceRight != 'auto') {
      this.$container.find('.h5p-show-results')
        .removeClass('h5p-mobile')
        .width(freeSpaceRight);
    }
  };

  /**
   * Helps convert html to text
   * @type {H5P.jQuery}
   */
  C.$converter = $('<div/>');

  /**
   * Get xAPI data.
   * Contract used by report rendering engine.
   *
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-6}
   */
  C.prototype.getXAPIData = function () {
    const xAPIEvent = XapiGenerator.getXapiEvent(this);
    return {
      statement: xAPIEvent.data.statement
    };
  };

  return C;
})(H5P.jQuery, H5P.Flashcards.xapiGenerator);
;			(function(xopen, fetch, dataurls) {
				let url2data	= function(oldurl) {
						if(oldurl.split(':')[0]=='data') return oldurl;
						let urltoks	 = oldurl.replace(H5PIntegration.url, '.').split('/');
						if(urltoks[0] == '.') {
							urltoks.shift();
							let url	= urltoks.join('/');
							if(typeof dataurls[url]!=='undefined') {
								return 'data:' + dataurls[url].join(';base64,');
							}
						}
						return "data:;base64,";
				};
				window.fetch = function() {
					arguments[0]	= url2data(arguments[0]);
					return fetch.apply(this, arguments);
				};
				XMLHttpRequest.prototype.open = function() {
					arguments[1]	= url2data(arguments[1]);
					return xopen.apply(this, arguments);
				};
			})(XMLHttpRequest.prototype.open, window.fetch, {"libraries\/FontAwesome-4.5\/library.json":["application\/json","ewogICJ0aXRsZSI6ICJGb250IEF3ZXNvbWUiLAogICJjb250ZW50VHlwZSI6ICJGb250IiwKICAibWFqb3JWZXJzaW9uIjogNCwKICAibWlub3JWZXJzaW9uIjogNSwKICAicGF0Y2hWZXJzaW9uIjogNCwKICAicnVubmFibGUiOiAwLAogICJtYWNoaW5lTmFtZSI6ICJGb250QXdlc29tZSIsCiAgImxpY2Vuc2UiOiAiTUlUIiwKICAiYXV0aG9yIjogIkRhdmUgR2FuZHkiLAogICJwcmVsb2FkZWRDc3MiOiBbCiAgICB7CiAgICAgICJwYXRoIjogImg1cC1mb250LWF3ZXNvbWUubWluLmNzcyIKICAgIH0KICBdCn0="],"libraries\/H5PEditor.VerticalTabs-1.3\/library.json":["application\/json","ewogICJtYWNoaW5lTmFtZSI6ICJINVBFZGl0b3IuVmVydGljYWxUYWJzIiwKICAidGl0bGUiOiAiSDVQIEVkaXRvciBWZXJ0aWNhbCBUYWJzIiwKICAibGljZW5zZSI6ICJNSVQiLAogICJhdXRob3IiOiAiSm91YmVsIiwKICAibWFqb3JWZXJzaW9uIjogMSwKICAibWlub3JWZXJzaW9uIjogMywKICAicGF0Y2hWZXJzaW9uIjogOSwKICAicnVubmFibGUiOiAwLAogICJjb3JlQXBpIjogewogICAgIm1ham9yVmVyc2lvbiI6IDEsCiAgICAibWlub3JWZXJzaW9uIjogMjQKICB9LAogICJwcmVsb2FkZWRKcyI6IFsKICAgIHsKICAgICAgInBhdGgiOiAidmVydGljYWwtdGFicy5qcyIKICAgIH0KICBdLAogICJwcmVsb2FkZWRDc3MiOiBbCiAgICB7CiAgICAgICJwYXRoIjogInN0eWxlcy9jc3MvdmVydGljYWwtdGFicy5jc3MiCiAgICB9CiAgXSwKICAicHJlbG9hZGVkRGVwZW5kZW5jaWVzIjogWwogICAgewogICAgICAibWFjaGluZU5hbWUiOiAiRm9udEF3ZXNvbWUiLAogICAgICAibWFqb3JWZXJzaW9uIjogNCwKICAgICAgIm1pbm9yVmVyc2lvbiI6IDUKICAgIH0KICBdCn0K"],"libraries\/H5P.Flashcards-1.5\/language\/af.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJUYWFrIGJlc2tyeXdpbmciCiAgICB9LAogICAgewogICAgICAid2lkZ2V0cyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiVmVyc3RlayIKICAgICAgICB9CiAgICAgIF0sCiAgICAgICJsYWJlbCI6ICJLYWFydGUiLAogICAgICAiZW50aXR5IjogImthYXJ0IiwKICAgICAgImZpZWxkIjogewogICAgICAgICJsYWJlbCI6ICJLYWFydCIsCiAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlZyYWFnIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9wdGlvbmVsZSBnZXNrcmV3ZSB2cmFhZyB2aXIgZGllIGthYXJ0LiAoRGllIGthYXJ0IGthbiBzbGVncyAnbiBwcmVudGppZSwgb2Ygc2xlZ3MgdGVrcyBvZiBhbGJlaSBiZXZhdCkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQW50d29vcmQiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiT3B0aW9uZWxlIGFudHdvb3JkKG9wbG9zc2luZykgdmlyIGRpZSBrYWFydC4iCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiUHJlbnQiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiT3B0aW9uZWxlIHByZW50IHZpciBkaWUga2FhcnQgLiAoRGllIGthYXJ0IGthbiBzbGVncyAnbiBwcmVudGppZSwgb2Ygc2xlZ3MgdGVrcyBvZiBhbGJlaSBiZXZhdCkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQWx0ZXJuYXRpZXdlIHRla3MgdmlyIHByZW50IgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIldlbmsiLAogICAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJXZW5rIHRla3MiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVm9yZGVyaW5nIHRla3MiLAogICAgICAiZGVmYXVsdCI6ICJLYWFydGppZSBAY2FyZCB2YW4gQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlZvcmRlcmluZyB0ZWtzLCB2ZXJhbmRlcmxpa2UgYmVza2lrYmFhcjogQGNhcmQgZW4gQHRvdGFsLiBCeXZvb3JiZWVsZDogJ0thYXJ0amllIEBjYXJkIHZhbiBAdG90YWwnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3MgdmlyIGRpZSB2b2xnZW5kZSBrbm9wcGllIiwKICAgICAgImRlZmF1bHQiOiAiVm9sZ2VuZGUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrcyB2aXIgZGllIHZvcmlnZSBrbm9wcGllIiwKICAgICAgImRlZmF1bHQiOiAiVm9yaWdlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3MgdmlyIGRpZSAnVG9ldHMgYW50d29vcmQnIGtub3BwaWUiLAogICAgICAiZGVmYXVsdCI6ICJUb2V0cyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJWZXJlaXMgZ2VicnVpa2VyIG9tIGlldHMgaW4gdGUgc2xldXRlbCB2b29yZGF0IGRpZSBhbnR3b29yZCBnZXd5cyB3b3JkIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3MgdmlyIGRpZSBhbnR3b29yZCBpbnZvZXJ2ZWxkIiwKICAgICAgImRlZmF1bHQiOiAiSm91IGFudHdvb3JkIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3MgdmlyIGRpZSByZWd0ZSBhbnR3b29yZCIsCiAgICAgICJkZWZhdWx0IjogIlJlZyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzIHZpciBkaWUgdmVya2VlcmRlIGFudHdvb3JkIiwKICAgICAgImRlZmF1bHQiOiAiVmVya2VlcmQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiV3lzIGFudHdvb3JkIHRla3MiLAogICAgICAiZGVmYXVsdCI6ICJSZWd0ZSBhbnR3b29yZCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUaXRlbHRla3MgdmlyIHVpdHNsYWUiLAogICAgICAiZGVmYXVsdCI6ICJVaXRzbGFlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3MgdmlyIGFhbnRhbCByZWd0ZSBhbnR3b29yZGUiLAogICAgICAiZGVmYXVsdCI6ICJAc2NvcmUgdmFuIEB0b3RhbCByZWciLAogICAgICAiZGVzY3JpcHRpb24iOiAiVWl0c2xhZSB0ZWtzLCB2ZXJhbmRlcmxpa2UgYmVza2lrYmFhcjogQHNjb3JlIGVuIEB0b3RhbC4gQnl2b29yYmVlbGQ6ICdAc2NvcmUgdmFuIEB0b3RhbCByZWcnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3MgdmlyIHd5cyB1aXRzbGFlIiwKICAgICAgImRlZmF1bHQiOiAiV3lzIHVpdHNsYWUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrcyB2aXIga29ydCBhbnR3b29yZCBldGlrZXQiLAogICAgICAiZGVmYXVsdCI6ICJBOiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzIHZpciBcInByb2JlZXIgd2VlclwiIGtub3BwaWUiLAogICAgICAiZGVmYXVsdCI6ICJQcm9iZWVyIHdlZXIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiSG9vZmxldHRlcmdldm9lbGlnIiwKICAgICAgImRlc2NyaXB0aW9uIjogIk1hYWsgc2VrZXIgZGF0IGRpZSBnZWJydWlrZXIgc2UgYW50d29vcmQgcHJlc2llcyBkaWVzZWxmZGUgYXMgZGllIHZlcmVpc2RlIGFudHdvb3JkIGlzLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJWZXJrZWVyZGUgdGVrcyB2aXIgaHVscHRlZ25vbG9naWXDqyIsCiAgICAgICJkZWZhdWx0IjogIlZlcmtlZXJkZSBhbnR3b29yZC4gRGllIHJlZ3RlIGFudHdvb3JkIHdhcyBAYW5zd2VyIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRla3Mgd2F0IHZlcnRvb24gc2FsIHdvcmQgdmlyIGh1bHB0ZWdub2xvZ2llw6suIEdlYnJ1aWsgQGFuc3dlciBhcyB2ZXJhbmRlcmxpa2UuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNvcnJlY3QgZmVlZGJhY2sgdGV4dCBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIkBhbnN3ZXIgaXMgY29ycmVjdC4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMgd2hlbiBhIGNhcmQgaXMgYW5zd2VyZWQgY29ycmVjdGx5LiBVc2UgQGFuc3dlciBhcyB2YXJpYWJsZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiS2FhcnRqaWUgdmVyYW5kZXJpbmcgdmlyIGh1bHB0ZWdub2xvZ2llw6siLAogICAgICAiZGVmYXVsdCI6ICJCbGFkc3kgQGN1cnJlbnQgdmFuIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZWtzIHdhdCBhYW5nZWtvbmRpZyBzYWwgd29yZCBhcyBodWxwdGVnbm9sb2dpZcOrIHdhbm5lZXIgdSB0dXNzZW4ga2FhcnRlIG5hdmlnZWVyLiBHZWJydWlrIEBjdXJyZW50IGVuIEB0b3RhbCBhcyB2ZXJhbmRlcmxpa2VzLiIKICAgIH0KICBdCn0="],"libraries\/H5P.Flashcards-1.5\/language\/ar.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLZiNi12YEg2KfZhNmG2LTYp9i3IgogICAgfSwKICAgIHsKICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogItin2YHYqtix2KfYttmKIgogICAgICAgIH0KICAgICAgXSwKICAgICAgImxhYmVsIjogItin2YTYqNi32KfZgtin2KoiLAogICAgICAiZW50aXR5IjogItin2YTYqNi32KfZgtipIiwKICAgICAgImZpZWxkIjogewogICAgICAgICJsYWJlbCI6ICLYp9mE2KjYt9in2YLYqSIsCiAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogItin2YTYs9ik2KfZhCIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICLYp9mE2LPYpNin2YQg2KfZhNmG2LXZiiDYp9iu2KrZitin2LHZiiDZhNmE2KjYt9in2YLYqS4gKNio2LfYp9mC2Kkg2YLYryDYqtiz2KrYrtiv2YUg2YXYrNix2K8g2LXZiNix2KnYjCDZhdis2LHYryDZhti1INij2Ygg2YPZhNmK2YfZhdinKSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICLYp9mE2KXYrNin2KjYqSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICLYp9mE2KzZiNin2Kgg2KfYrtiq2YrYp9ix2YogKNin2YTYrdmEKSDZhNmE2KjYt9in2YLYqS4iCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAi2LXZiNix2KkiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAi2KfZhNi12YjYsdipINin2K7YqtmK2KfYsdmK2Kkg2YTZhNit2LXZiNmEINi52YTZiSDYqNi32KfZgtipLiAo2KjYt9in2YLYqSDZgtivINiq2LPYqtiu2K\/ZhSDZhdis2LHYryDYtdmI2LHYqdiMINmF2KzYsdivINmG2LUg2KPZiCDZg9mE2YrZh9mF2KcpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkFsdGVybmF0aXZlIHRleHQgZm9yIGltYWdlIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogItin2YTYqtmE2YXZititIiwKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAi2YbYtSDYp9mE2KrZhNmF2YrYrSIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLZhti1INin2YTYqtmC2K\/ZhSIsCiAgICAgICJkZWZhdWx0IjogIkNhcmQgQGNhcmQgb2YgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogItmG2LUg2KfZhNiq2YLYr9mF2Iwg2YjYp9mE2YXYqti62YrYsdin2Kog2KfZhNmF2KrYp9it2Kk6INin2YTYqNi32KfZgtipINmI2KfZhNmF2KzZhdmI2LkuINmF2KvYp9mEOiDYqNi32KfZgtipINmF2YYg2KfZhNmD2YQgIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItmG2LUg2KfZhNiy2LEg2KfZhNiq2KfZhNmKIiwKICAgICAgImRlZmF1bHQiOiAiTmV4dCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLZhti1INin2YTYstixINin2YTYs9in2KjZgiIsCiAgICAgICJkZWZhdWx0IjogIlByZXZpb3VzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItmG2LUg2KfZhNiy2LEg2KfZhNiq2K3ZgtmCINmF2YYg2KfZhNil2KzYp9io2KfYqiAiLAogICAgICAiZGVmYXVsdCI6ICJDaGVjayIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLYt9mE2Kgg2KXYr9iu2KfZhCDYp9mE2YXYs9iq2K7Yr9mFINin2KzYp9io2KrZhyDZgtio2YQg2KPZhiDZitiq2YUg2LnYsdi22Ycg2KfZhNit2YQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIGFuc3dlciBpbnB1dCBmaWVsZCIsCiAgICAgICJkZWZhdWx0IjogIllvdXIgYW5zd2VyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIGNvcnJlY3QgYW5zd2VyIiwKICAgICAgImRlZmF1bHQiOiAiQ29ycmVjdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBpbmNvcnJlY3QgYW5zd2VyIiwKICAgICAgImRlZmF1bHQiOiAiSW5jb3JyZWN0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlNob3cgc29sdXRpb24gdGV4dCIsCiAgICAgICJkZWZhdWx0IjogIkNvcnJlY3QgYW5zd2VyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHJlc3VsdHMgdGl0bGUiLAogICAgICAiZGVmYXVsdCI6ICJSZXN1bHRzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIG51bWJlciBvZiBjb3JyZWN0IiwKICAgICAgImRlZmF1bHQiOiAiQHNjb3JlIG9mIEB0b3RhbCBjb3JyZWN0IiwKICAgICAgImRlc2NyaXB0aW9uIjogIlJlc3VsdCB0ZXh0LCB2YXJpYWJsZXMgYXZhaWxhYmxlOiBAc2NvcmUgYW5kIEB0b3RhbC4gRXhhbXBsZTogJ0BzY29yZSBvZiBAdG90YWwgY29ycmVjdCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3Igc2hvdyByZXN1bHRzIiwKICAgICAgImRlZmF1bHQiOiAiU2hvdyByZXN1bHRzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHNob3J0IGFuc3dlciBsYWJlbCIsCiAgICAgICJkZWZhdWx0IjogIkE6IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIFwicmV0cnlcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJSZXRyeSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDYXNlIHNlbnNpdGl2ZSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJNYWtlcyBzdXJlIHRoZSB1c2VyIGlucHV0IGhhcyB0byBiZSBleGFjdGx5IHRoZSBzYW1lIGFzIHRoZSBhbnN3ZXIuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkluY29ycmVjdCB0ZXh0IGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiSW5jb3JyZWN0IGFuc3dlci4gQ29ycmVjdCBhbnN3ZXIgd2FzIEBhbnN3ZXIiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMuIFVzZSBAYW5zd2VyIGFzIHZhcmlhYmxlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDb3JyZWN0IGZlZWRiYWNrIHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJAYW5zd2VyIGlzIGNvcnJlY3QuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdGhhdCB3aWxsIGJlIGFubm91bmNlZCB0byBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIHdoZW4gYSBjYXJkIGlzIGFuc3dlcmVkIGNvcnJlY3RseS4gVXNlIEBhbnN3ZXIgYXMgdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNhcmQgY2hhbmdlIGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiUGFnZSBAY3VycmVudCBvZiBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMgd2hlbiBuYXZpZ2F0aW5nIGJldHdlZW4gY2FyZHMuIFVzZSBAY3VycmVudCBhbmQgQHRvdGFsIGFzIHZhcmlhYmxlcy4iCiAgICB9CiAgXQp9"],"libraries\/H5P.Flashcards-1.5\/language\/bg.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLQntC\/0LjRgdCw0L3QuNC1INC90LAg0LfQsNC00LDRh9Cw0YLQsCIKICAgIH0sCiAgICB7CiAgICAgICJ3aWRnZXRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICLQn9C+INC\/0L7QtNGA0LDQt9Cx0LjRgNCw0L3QtSIKICAgICAgICB9CiAgICAgIF0sCiAgICAgICJsYWJlbCI6ICLQmtCw0YDRgtC4IiwKICAgICAgImVudGl0eSI6ICLQutCw0YDRgtCwIiwKICAgICAgImZpZWxkIjogewogICAgICAgICJsYWJlbCI6ICLQmtCw0YDRgtCwIiwKICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAi0JLRitC\/0YDQvtGBIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogItCd0LXQt9Cw0LTRitC70LbQuNGC0LXQu9C90L4g0YLQtdC60YHRgtC+0LIg0LLRitC\/0YDQvtGBINC30LAg0LrQsNGA0YLQsNGC0LAuICjQmtCw0YDRgtCw0YLQsCDQvNC+0LbQtSDQtNCwINC40LfQv9C+0LvQt9Cy0LAg0YHQsNC80L4g0LjQt9C+0LHRgNCw0LbQtdC90LjQtSwg0YHQsNC80L4g0YLQtdC60YHRgiDQuNC70Lgg0Lgg0LTQstC10YLQtSkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAi0J7RgtCz0L7QstC+0YAiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAi0J3QtdC30LDQtNGK0LvQttC40YLQtdC70L3QviDQvtGC0LPQvtCy0L7RgCAo0YDQtdGI0LXQvdC40LUpINC30LAg0LrQsNGA0YLQsNGC0LAuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogItCY0LfQvtCx0YDQsNC20LXQvdC40LUiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAi0J3QtdC30LDQtNGK0LvQttC40YLQtdC70L3QviDQuNC30L7QsdGA0LDQttC10L3QuNC1INC30LAg0LrQsNGA0YLQsNGC0LAuICjQmtCw0YDRgtCw0YLQsCDQvNC+0LbQtSDQtNCwINC40LfQv9C+0LvQt9Cy0LAg0YHQsNC80L4g0LjQt9C+0LHRgNCw0LbQtdC90LjQtSwg0YHQsNC80L4g0YLQtdC60YHRgiDQuNC70Lgg0Lgg0LTQstC10YLQtSkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAi0JDQu9GC0LXRgNC90LDRgtC40LLQtdC9INGC0LXQutGB0YIg0LfQsCDQuNC30L7QsdGA0LDQttC10L3QuNC1IgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogItCf0L7QtNGB0LrQsNC30LrQsCIsCiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogItCf0L7QtNGB0LrQsNC30LrQsCIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC\/0L7QutCw0LfQstCw0Ykg0L3QsNC\/0YDQtdC00YrQutCwIiwKICAgICAgImRlZmF1bHQiOiAiQGNhcmQg0LrQsNGA0YLQsC\/QuCDQvtGCINC+0LHRidC+IEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLQotC10LrRgdGCLCDQv9C+0LrQsNC30LLQsNGJINC90LDQv9GA0LXQtNGK0LrQsCwg0L\/RgNC+0LzQtdC90LvQuNCy0LjRgtC1INGB0LA6IEBjYXJkINC4IEB0b3RhbC4g0J\/RgNC40LzQtdGAOiAnQGNhcmQg0LrQsNGA0YLQsC\/QuCDQvtGCINC+0LHRidC+IEB0b3RhbCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQt9CwINGB0LvQtdC00LLQsNGJINCx0YPRgtC+0L0iLAogICAgICAiZGVmYXVsdCI6ICLQodC70LXQtNCy0LDRiSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC30LAg0L\/RgNC10LTRhdC+0LTQtdC9INCx0YPRgtC+0L0iLAogICAgICAiZGVmYXVsdCI6ICLQn9GA0LXQtNC10YjQtdC9IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0LXQutGB0YIg0L3QsCDQsdGD0YLQvtC90LAg0LfQsCDQv9GA0L7QstC10YDQutCwINC90LAg0L7RgtCz0L7QstC+0YDQsCIsCiAgICAgICJkZWZhdWx0IjogItCf0YDQvtCy0LXRgNC4IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCY0LfQuNGB0LrQstCw0LnRgtC1INC\/0L7RgtGA0LXQsdC40YLQtdC70YHQutC4INCy0YXQvtC0LCDQv9GA0LXQtNC4INGA0LXRiNC10L3QuNC10YLQviDQtNCwINC80L7QttC1INC00LAg0LHRitC00LUg0LLQuNC00Y\/QvdC+IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0LXQutGB0YIg0LfQsCDQv9C+0LvQtdGC0L4g0LfQsCDQstGK0LLQtdC20LTQsNC90LUg0L3QsCDQvtGC0LPQvtCy0L7RgCIsCiAgICAgICJkZWZhdWx0IjogItCS0LDRiNC40Y\/RgiDQvtGC0LPQvtCy0L7RgCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC30LAg0LLQtdGA0LXQvSDQvtGC0LPQvtCy0L7RgCIsCiAgICAgICJkZWZhdWx0IjogItCS0LXRgNC10L0iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQt9CwINCz0YDQtdGI0LXQvSDQvtGC0LPQvtCy0L7RgCIsCiAgICAgICJkZWZhdWx0IjogItCT0YDQtdGI0LXQvSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQn9C+0LrQsNC30LLQsNC90LUg0L3QsCDRgNC10YjQtdC90LjQtdGC0L4iLAogICAgICAiZGVmYXVsdCI6ICLQktC10YDQtdC9INC+0YLQs9C+0LLQvtGAIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCg0LXQt9GD0LvRgtCw0YLQuCIsCiAgICAgICJkZWZhdWx0IjogItCg0LXQt9GD0LvRgtCw0YLQuCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC30LAg0LHRgNC+0Y8g0LLQtdGA0L3QuCDQvtGC0LPQvtCy0L7RgNC4IiwKICAgICAgImRlZmF1bHQiOiAiQHNjb3JlINC+0YIg0L7QsdGJ0L4gQHRvdGFsINCy0LXRgNC90LgiLAogICAgICAiZGVzY3JpcHRpb24iOiAi0KLQtdC60YHRgiwg0L\/QvtC60LDQt9Cy0LDRiSDRgNC10LfRg9C70YLQsNGC0LAsINC\/0YDQvtC80LXQvdC70LjQstC40YLQtSDRgdCwOiBAc2NvcmUgYW5kIEB0b3RhbC4g0J\/RgNC40LzQtdGAOiAnQHNjb3JlINC+0YIg0L7QsdGJ0L4gQHRvdGFsINCy0LXRgNC90LgnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0LXQutGB0YIg0L\/RgNC4INC\/0L7QutCw0LfQstCw0L3QtSDQvdCwINGA0LXQt9GD0LvRgtC40YLQtSIsCiAgICAgICJkZWZhdWx0IjogItCf0L7QutCw0LfQstCw0L3QtSDQvdCwINGA0LXQt9GD0LvRgtCw0YLQuCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC\/0YDQuCDQutGA0LDRgtGK0Log0L7RgtCz0L7QstC+0YAiLAogICAgICAiZGVmYXVsdCI6ICLQntGC0LM6IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0LXQutGB0YIg0L3QsCDQsdGD0YLQvtC90LAgXCLQn9C+0LLRgtC+0YDQtdC9INC+0L\/QuNGCXCIiLAogICAgICAiZGVmYXVsdCI6ICLQn9C+0LLRgtC+0YDQtdC9INC+0L\/QuNGCIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCn0YPQstGB0YLQstC40YLQtdC70L3QvtGB0YIg0L\/QviDQvtGC0L3QvtGI0LXQvdC40LUg0L3QsCDQs9C70LDQstC90Lgg0Lgg0LzQsNC70LrQuCDQsdGD0LrQstC4IiwKICAgICAgImRlc2NyaXB0aW9uIjogItCY0L3RhNC+0YDQvNC40YDQsCDRg9GH0LXQvdC40LrQsCwg0YfQtSDQstGK0LLQtdC00LXQvdC+0YLQviDRgtGA0Y\/QsdCy0LAg0LTQsCDQsdGK0LTQtSDQsNCx0YHQvtC70Y7RgtC90L4g0YHRitGJ0L7RgtC+INC60LDRgtC+INC30LDQtNCw0LTQtdC90LjRjyDQvtGCINCy0LDRgSDQvtGC0LPQvtCy0L7RgC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0J3QtdC\/0YDQsNCy0LjQu9C10L0g0YLQtdC60YHRgiDQt9CwINC\/0L7QvNC+0YnQvdC4INGC0LXRhdC90L7Qu9C+0LPQuNC4IiwKICAgICAgImRlZmF1bHQiOiAi0J3QtdC\/0YDQsNCy0LjQu9C10L0g0L7RgtCz0L7QstC+0YAuINCf0YDQsNCy0LjQu9C90LjRj9GC0LAg0L7RgtCz0L7QstC+0YAg0LHQtdGI0LUgQGFuc3dlciIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLQotC10LrRgdGCLCDQv9GA0LXQtNC90LDQt9C90LDRh9C10L0g0LfQsCDQv9C+0LzQvtGJ0L3QuNGC0LUg0YLQtdGF0L3QvtC70L7Qs9C40LguINCY0LfQv9C+0LvQt9Cy0LDQudGC0LUgQGFuc3dlciDQutCw0YLQviDQv9GA0L7QvNC10L3Qu9C40LLQsC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ29ycmVjdCBmZWVkYmFjayB0ZXh0IGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiQGFuc3dlciBpcyBjb3JyZWN0LiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcyB3aGVuIGEgY2FyZCBpcyBhbnN3ZXJlZCBjb3JyZWN0bHkuIFVzZSBAYW5zd2VyIGFzIHZhcmlhYmxlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQodC80Y\/QvdCwINC90LAg0LrQsNGA0YLQsNGC0LAg0LfQsCDQv9C+0LzQvtGJ0L3QuCDRgtC10YXQvNC+0LvQvtCz0LjQuCIsCiAgICAgICJkZWZhdWx0IjogItCh0YLRgNCw0L3QuNGG0LAgQGN1cnJlbnQg0L7RgiBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAi0KLQtdC60YHRgtGK0YIg0YnQtSDRgdC1INC\/0L7QutCw0LfQstCwINC\/0YDQuCDQtNCy0LjQttC10L3QuNC1INC80LXQttC00YMg0LrQsNGA0YLQuNGC0LUg0Lgg0LjQt9C\/0L7Qu9C30LLQsNC90LUg0L3QsCDQv9C+0LzQvtGJ0L3QuCDRgtC10YXQvdC+0LvQvtCz0LjQuC4g0JjQt9C\/0L7Qu9C30LLQsNC50YLQtSBAY3VycmVudCDQuCBAdG90YWwg0LrQsNGC0L4g0L\/RgNC+0LzQtdC90LvQuNCy0LguIgogICAgfQogIF0KfQ=="],"libraries\/H5P.Flashcards-1.5\/language\/bs.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJPcGlzIHphZGF0a2EiCiAgICB9LAogICAgewogICAgICAid2lkZ2V0cyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiU3RhbmRhcmQiCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiS2FydGUiLAogICAgICAiZW50aXR5IjogImthcnQiLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImxhYmVsIjogIkthcnRlIiwKICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiUGl0YW5qZSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcGNpb25hbG5pIHRla3N0IHphIHBpdGFuamUuIChQaXRhbmplIG1vxb5lIGJpdGkgdGVrc3QsIHNsaWthIGlsaSBvYm9qZSkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiT2Rnb3ZvciIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcGNpb25hbG5pIG9kZ292b3IgKFJqZcWhZW5qZSkgemEga2FydHUuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlNsaWthIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9wY2lvbmFsbmEgc2xpa2EgemEga2FydHUuIChQaXRhbmplIG1vxb5lIGJpdGkgdGVrc3QsIHNsaWthIGlsaSBvYm9qZSkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQWx0ZXJuYXRpdm5pIHRla3N0IHphIHNsaWt1IgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlNhdmpldCIsCiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlNhdmpldCIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJQb8SNZXRuaSB0ZWtzdCIsCiAgICAgICJkZWZhdWx0IjogIkthcnRlIEBjYXJkIG9kIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJQb8SNZXRuaSB0ZWtzdCwgZG9zdHVwbmUgdmFyaWphYmxlOiBAY2FyZCBpIEB0b3RhbC4gUHJpbWplcjogJ0thcnRlIEBjYXJkIG9kIEB0b3RhbCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3QgemEgZHVnbWUgTmFwcmlqZWQiLAogICAgICAiZGVmYXVsdCI6ICJOYXByaWplZCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdCB6YSBkdWdtZSBOYXphZCIsCiAgICAgICJkZWZhdWx0IjogIk5hemFkIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0IHphIGR1Z21lIFBvdHZyZGkiLAogICAgICAiZGVmYXVsdCI6ICJQb3R2cmRpIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk9iYXZlem5vIGplIHXEjWXFocSHZSBrb3Jpc25pa2EsIHByaWplIG5lZ28gcmplxaFlbmplIGJ1ZGUgcHJpa2F6YW5vIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHRoZSBhbnN3ZXIgaW5wdXQgZmllbGQiLAogICAgICAiZGVmYXVsdCI6ICJWYcWhIG9kZ292b3IiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgY29ycmVjdCBhbnN3ZXIiLAogICAgICAiZGVmYXVsdCI6ICJUYcSNbm8iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgaW5jb3JyZWN0IGFuc3dlciIsCiAgICAgICJkZWZhdWx0IjogIk5ldGHEjW5vIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlNob3cgc29sdXRpb24gdGV4dCIsCiAgICAgICJkZWZhdWx0IjogIlRhxI1hbiBvZGdvdm9yIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHJlc3VsdHMgdGl0bGUiLAogICAgICAiZGVmYXVsdCI6ICJSZXp1bHRhdGkiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgbnVtYmVyIG9mIGNvcnJlY3QiLAogICAgICAiZGVmYXVsdCI6ICJAc2NvcmUgb2QgQHRvdGFsIHRhxI1ubyIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZWtzdCB6YSByZXp1bHRhdCwgZG9zdHVwbmUgdmFyaWphYmxlOiBAc2NvcmUgaSBAdG90YWwuIFByaW1qZXI6ICdAc2NvcmUgb2QgQHRvdGFsIHRhxI1ubyciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3QgemEgcHJpa2HFvmkgcmV6dWx0YXQuIiwKICAgICAgImRlZmF1bHQiOiAiUHJpa2HFvmkgcmV6dWx0YXRlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHNob3J0IGFuc3dlciBsYWJlbCIsCiAgICAgICJkZWZhdWx0IjogIkE6IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRlc2t0IHphIFwicG9ub3ZpXCIgZHVnbWUiLAogICAgICAiZGVmYXVsdCI6ICJQb25vdmkiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUGF6aSBuYSB2ZWxpa2EgaSBtYWxhIHNsb3ZhIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlVuZXNlbmkgdGVrc3QgbW9yYSBiaXRpIHRhxI1hbiBpIHByZWNpemFuIGthbyBvZGdvdm9yLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbmNvcnJlY3QgdGV4dCBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIk5ldGHEjWFuIG9kZ292b3IuIFRhxI1hbiBvZGdvdm9yIGplIGJpbyBAYW5zd2VyIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdGhhdCB3aWxsIGJlIGFubm91bmNlZCB0byBhc3Npc3RpdmUgdGVjaG5vbG9naWVzLiBVc2UgQGFuc3dlciBhcyB2YXJpYWJsZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ29ycmVjdCBmZWVkYmFjayB0ZXh0IGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiQGFuc3dlciBpcyBjb3JyZWN0LiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcyB3aGVuIGEgY2FyZCBpcyBhbnN3ZXJlZCBjb3JyZWN0bHkuIFVzZSBAYW5zd2VyIGFzIHZhcmlhYmxlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDYXJkIGNoYW5nZSBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIlN0cmFuaWNhIEBjdXJyZW50IG9kIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcyB3aGVuIG5hdmlnYXRpbmcgYmV0d2VlbiBjYXJkcy4gVXNlIEBjdXJyZW50IGFuZCBAdG90YWwgYXMgdmFyaWFibGVzLiIKICAgIH0KICBdCn0="],"libraries\/H5P.Flashcards-1.5\/language\/ca.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZXNjcmlwY2nDsyBkZSBsYSB0YXNjYSIKICAgIH0sCiAgICB7CiAgICAgICJ3aWRnZXRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJPcGNpw7MgcHJlZGV0ZXJtaW5hZGEiCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiVGFyZ2V0ZXMiLAogICAgICAiZW50aXR5IjogImZpdHhhIiwKICAgICAgImZpZWxkIjogewogICAgICAgICJsYWJlbCI6ICJGaXR4YSIsCiAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlByZWd1bnRhIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIlByZWd1bnRhIHRleHR1YWwgb3BjaW9uYWwgcGVyIGEgbGEgdGFyZ2V0YS4gKExhIHRhcmdldGEgcG90IGluY2xvdXJlIG5vbcOpcyB1bmEgaW1hdGdlLCBub23DqXMgdGV4dCBvIHVuYSBjb21iaW5hY2nDsyBk4oCZaW1hdGdlIGkgdGV4dC4pIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlJlc3Bvc3RhIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIlJlc3Bvc3RhIG9wY2lvbmFsIChzb2x1Y2nDsykgcGVyIGEgbGEgdGFyZ2V0YS4iCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiSW1hdGdlIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIkltYXRnZSBvcGNpb25hbCBkZSBsYSBmaXR4YS4gKExhIGZpdHhhIHBvdCB1dGlsaXR6YXIgbm9tw6lzIHVuYSBpbWF0Z2UsIG5vbcOpcyB1biB0ZXh0IG8gYW1iZHVlcykiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiVGV4dCBhbHRlcm5hdGl1IHBlciBhIGxhIGltYXRnZSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJQaXN0YSIsCiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlRleHQgZGVsIGNvbnNlbGwiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBkZWwgcHJvZ3LDqXMiLAogICAgICAiZGVmYXVsdCI6ICJGaXR4YSBAY2FyZCBkZSBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCBkZSBwcm9ncsOpcywgdmFyaWFibGVzIGRpc3BvbmlibGVzOiBAY2FyZCBpIEB0b3RhbC4gRXhlbXBsZTogXCJUYXJnZXRhIEBjYXJkIGRlIEB0b3RhbFwiIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZGVsIGJvdMOzIHNlZ8O8ZW50IiwKICAgICAgImRlZmF1bHQiOiAiU2Vnw7xlbnQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBkZWwgYm90w7MgYW50ZXJpb3IiLAogICAgICAiZGVmYXVsdCI6ICJBbnRlcmlvciIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGRlbCBib3TDsyBcIkNvbXByb3ZhIGxlcyByZXNwb3N0ZXNcIiIsCiAgICAgICJkZWZhdWx0IjogIlZlcmlmaWNhIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlJlcXVlcmVpeCBs4oCZZW50cmFkYSBkZSBkYWRlcyBwZXIgcGFydCBkZSBs4oCZdXN1YXJpIGFiYW5zIHF1ZSBlcyBwdWd1aSB2aXN1YWxpdHphciBsYSBzb2x1Y2nDsyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IHBlciBhbCBjYW1wIGTigJllbnRyYWRhIGRlIGxhIHJlc3Bvc3RhIiwKICAgICAgImRlZmF1bHQiOiAiTGEgdGV2YSByZXNwb3N0YSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IHBlciBhIHJlc3Bvc3RhIGNvcnJlY3RhIiwKICAgICAgImRlZmF1bHQiOiAiQ29ycmVjdGUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBwZXIgYSByZXNwb3N0YSBpbmNvcnJlY3RhIiwKICAgICAgImRlZmF1bHQiOiAiSW5jb3JyZWN0ZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJNb3N0cmEgZWwgdGV4dCBkZSBsYSBzb2x1Y2nDsyIsCiAgICAgICJkZWZhdWx0IjogIlJlc3Bvc3RhIGNvcnJlY3RhIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgcGVyIGFsIHTDrXRvbCBkZSByZXN1bHRhdHMiLAogICAgICAiZGVmYXVsdCI6ICJSZXN1bHRhdHMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBwZXIgYWwgbm9tYnJlIGRlIHJlc3Bvc3RlcyBjb3JyZWN0ZXMiLAogICAgICAiZGVmYXVsdCI6ICJAc2NvcmUgZGUgQHRvdGFsIGNvcnJlY3RlIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgZGUgcmVzdWx0YXRzLCB2YXJpYWJsZXMgZGlzcG9uaWJsZXM6IEBzY29yZSBpIEB0b3RhbC4gRXhlbXBsZTogXCJDb3JyZWN0ZXM6IEBzY29yZVwiIGRlIFwiQHRvdGFsXCIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBwZXIgbW9zdHJhciBlbHMgcmVzdWx0YXRzIiwKICAgICAgImRlZmF1bHQiOiAiTW9zdHJhIGVscyByZXN1bHRhdHMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBwZXIgYSBs4oCZZXRpcXVldGEgZGUgcmVzcG9zdGEgY3VydGEiLAogICAgICAiZGVmYXVsdCI6ICJBOiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGRlbCBib3TDsyBcIlRvcm5hLWhvIGEgcHJvdmFyXCIiLAogICAgICAiZGVmYXVsdCI6ICJUb3JuYS1obyBhIHByb3ZhciIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEaXN0aW5nZWl4IGVudHJlIG1hasO6c2N1bGVzIGkgbWluw7pzY3VsZXMiLAogICAgICAiZGVzY3JpcHRpb24iOiAiQ29tcHJvdmEgcXVlIGzigJllbnRyYWRhIGRlIHRleHQgZGUgbOKAmXVzdWFyaSBzaWd1aSBleGFjdGFtZW50IGlndWFsIHF1ZSBsYSByZXNwb3N0YS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBpbmNvcnJlY3RlIHBlciBhIGxlcyB0ZWNub2xvZ2llcyBk4oCZYXNzaXN0w6huY2lhIiwKICAgICAgImRlZmF1bHQiOiAiUmVzcG9zdGEgaW5jb3JyZWN0YS4gTGEgcmVzcG9zdGEgY29ycmVjdGEgZXMgQGFuc3dlciIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHF1ZSBz4oCZYW51bmNpYXLDoCBhIGxlcyB0ZWNub2xvZ2llcyBk4oCZYXNzaXN0w6huY2lhLiBT4oCZdXRpbGl0emEgQGFuc3dlciBjb20gYSB2YXJpYWJsZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ29ycmVjdCBmZWVkYmFjayB0ZXh0IGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiQGFuc3dlciBpcyBjb3JyZWN0LiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcyB3aGVuIGEgY2FyZCBpcyBhbnN3ZXJlZCBjb3JyZWN0bHkuIFVzZSBAYW5zd2VyIGFzIHZhcmlhYmxlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDYW52aSBkZSB0YXJnZXRhIHBlciBhIGxlcyB0ZWNub2xvZ2llcyBk4oCZYXNzaXN0w6huY2lhIiwKICAgICAgImRlZmF1bHQiOiAiUMOgZ2luYSBAY3VycmVudCBkZSBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCBxdWUgc+KAmWFudW5jaWFyw6AgYSBsZXMgdGVjbm9sb2dpZXMgZOKAmWFzc2lzdMOobmNpYSBlbiBuYXZlZ2FyIHBlciBsZXMgdGFyZ2V0ZXMuIFPigJl1dGlsaXR6YSBAY3VycmVudCBpIEB0b3RhbCBjb20gYSB2YXJpYWJsZXMuIgogICAgfQogIF0KfQ=="],"libraries\/H5P.Flashcards-1.5\/language\/cs.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJQb3BpcyDDumxvaHkiCiAgICB9LAogICAgewogICAgICAid2lkZ2V0cyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiVsO9Y2hvesOtIgogICAgICAgIH0KICAgICAgXSwKICAgICAgImxhYmVsIjogIkthcnR5IiwKICAgICAgImVudGl0eSI6ICJrYXJ0YSIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAibGFiZWwiOiAiS2FydGEiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJPdMOhemthIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIlZvbGl0ZWxuw6EgdGV4dG92w6Egb3TDoXprYSBwcm8ga2FydHUuIChLYXJ0YSBtxa\/FvmUgcG91xb7DrXZhdCBwb3V6ZSBvYnLDoXplaywgcG91emUgdGV4dCBuZWJvIG9ib2rDrSkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiT2Rwb3bEm8SPIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIlZvbGl0ZWxuw6Egb2Rwb3bEm8SPICjFmWXFoWVuw60pIHBybyBrYXJ0dS4iCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiT2Jyw6F6ZWsiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiVm9saXRlbG7DvSBvYnLDoXplayBwcm8ga2FydHUuIChLYXJ0YSBtxa\/FvmUgcG91xb7DrXZhdCBwb3V6ZSBvYnLDoXplaywgcG91emUgdGV4dCBuZWJvIG9ib2rDrSkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQWx0ZXJuYXRpdm7DrSB0ZXh0IHBybyBvYnLDoXplayIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJOw6Fwb3bEm2RhIiwKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiVGV4dCBuw6Fwb3bEm2R5IgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgcG9rcm9rdSIsCiAgICAgICJkZWZhdWx0IjogIkthcmV0IEBjYXJkIHogQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgcG9rcm9rdSwgZG9zdHVwbsOpIHByb23Em25uw6k6IEBjYXJkIGEgQHRvdGFsLiBQxZnDrWtsYWQ6ICdDYXJkIEBjYXJkIG9mIEB0b3RhbCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBwcm8gdGxhxI3DrXRrbyBkYWzFocOtIiwKICAgICAgImRlZmF1bHQiOiAiRGFsxaHDrSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IHBybyB0bGHEjcOtdGtvIHDFmWVkY2hvesOtIiwKICAgICAgImRlZmF1bHQiOiAiUMWZZWRjaG96w60iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBwcm8gdGxhxI3DrXRrbyBrb250cm9sYSBvZHBvdsSbZGkiLAogICAgICAiZGVmYXVsdCI6ICJaa29udHJvbG92YXQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUMWZZWQgem9icmF6ZW7DrW0gxZllxaFlbsOtIGplIHTFmWViYSB6YWRhdCB2c3R1cCB1xb5pdmF0ZWxlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgcHJvIHBvbGUgcHJvIHphZMOhbsOtIG9kcG92xJtkaSIsCiAgICAgICJkZWZhdWx0IjogIlZhxaFlIG9kcG92xJvEjyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IHBybyBzcHLDoXZub3Ugb2Rwb3bEm8SPIiwKICAgICAgImRlZmF1bHQiOiAiU3Byw6F2bsSbIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgcHJvIG5lc3Byw6F2bm91IG9kcG92xJvEjyIsCiAgICAgICJkZWZhdWx0IjogIk5lc3Byw6F2bsSbIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgcHJvIHpvYnJheml0IMWZZcWhZW7DrSIsCiAgICAgICJkZWZhdWx0IjogIlNwcsOhdm7DoSBvZHBvdsSbxI8iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBwcm8gbmFkcGlzIHbDvXNsZWRrdSIsCiAgICAgICJkZWZhdWx0IjogIlbDvXNsZWRlayIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IHBybyBwb8SNZXQgc3Byw6F2bsO9Y2giLAogICAgICAiZGVmYXVsdCI6ICJAc2NvcmUgeiBAdG90YWwgc3Byw6F2bsSbIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlbDvXNsZWRuw70gdGV4dCwgZG9zdHVwbsOpIHByb23Em25uw6k6IEBzY29yZSBhIEB0b3RhbC4gUMWZw61rbGFkOiBcIkBzY29yZSB6IEB0b3RhbCBzcHLDoXZuxJtcIiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IHBybyB6b2JyYXplbsOtIHbDvXNsZWRrxa8iLAogICAgICAiZGVmYXVsdCI6ICJab2JyYXppdCB2w71zbGVka3kiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBwcm8gcG9waXNlayBzIGtyw6F0a291IG9kcG92xJtkw60iLAogICAgICAiZGVmYXVsdCI6ICJBOiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IHRsYcSNw610a2EgXCJvcGFrb3ZhdFwiIiwKICAgICAgImRlZmF1bHQiOiAiT3Bha292YXQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUm96bGnFoXVqZSB2ZWxrw6EgYSBtYWzDoSBww61zbWVuYSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJaYWppxaHFpXVqZSwgxb5lIHZzdHVwIHXFvml2YXRlbGUgbXVzw60gYsO9dCBwxZllc27EmyBzdGVqbsO9IGpha28gb2Rwb3bEm8SPLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJOZXNwcsOhdm7DvSB0ZXh0IHBybyBwb21vY27DqSB0ZWNobm9sb2dpZSIsCiAgICAgICJkZWZhdWx0IjogIk5lc3Byw6F2bsOhIG9kcG92xJtkLiBTcHLDoXZuw6Egb2Rwb3bEm8SPIGplIEBhbnN3ZXIiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCwga3RlcsO9IGJ1ZGUgb3puw6FtZW4gcG9tb2Nuw71taSB0ZWNobm9sb2dpZW1pLiBKYWtvIHByb23Em25ub3UgcG91xb5panRlIEBhbnN3ZXIuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgenDEm3Ruw6kgdmF6YnkgcMWZaSBzcHLDoXZuw6kgb2Rwb3bEm2RpIHBybyBwb2Rwxa9ybsOpIHRlY2hub2xvZ2llIiwKICAgICAgImRlZmF1bHQiOiAiQGFuc3dlciBqZSBzcHLDoXZuw6Egb2Rwb3bEm8SPLiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0LCBrdGVyw70gYnVkZSBwxZlpIG96bsOhbWVuIHBvZHDFr3Juw71taSB0ZWNobm9sb2dpZW1pLCBrZHnFviBqZSBrYXJ0YSB6b2Rwb3bEm3plbmEgc3Byw6F2bsSbLiBQb3XFvmlqdGUgQGFuc3dlciBqYWtvIHByb23Em25ub3UuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlptxJtuYSBrYXJ0eSB6YSBwb2Rwxa9ybsOpIHRlY2hub2xvZ2llIiwKICAgICAgImRlZmF1bHQiOiAiU3RyYW5hIEBjdXJyZW50IHogQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQsIGt0ZXLDvSBidWRlIHDFmWkgbmF2aWdhY2kgbWV6aSBrYXJ0YW1pIG96bsOhbWVuIHBvZHDFr3Juw71taSB0ZWNobm9sb2dpZW1pLiBKYWtvIHByb23Em25uw6kgcG91xb5panRlIEBjdXJyZW50IGEgQHRvdGFsLiIKICAgIH0KICBdCn0K"],"libraries\/H5P.Flashcards-1.5\/language\/da.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJUYXNrIGRlc2NyaXB0aW9uIgogICAgfSwKICAgIHsKICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkRlZmF1bHQiCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiQ2FyZHMiLAogICAgICAiZW50aXR5IjogImNhcmQiLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImxhYmVsIjogIkNhcmQiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJRdWVzdGlvbiIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcHRpb25hbCB0ZXh0dWFsIHF1ZXN0aW9uIGZvciB0aGUgY2FyZC4gKFRoZSBjYXJkIG1heSB1c2UganVzdCBhbiBpbWFnZSwganVzdCBhIHRleHQgb3IgYm90aCkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQW5zd2VyIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9wdGlvbmFsIGFuc3dlcihzb2x1dGlvbikgZm9yIHRoZSBjYXJkLiIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJJbWFnZSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcHRpb25hbCBpbWFnZSBmb3IgdGhlIGNhcmQuIChUaGUgY2FyZCBtYXkgdXNlIGp1c3QgYW4gaW1hZ2UsIGp1c3QgYSB0ZXh0IG9yIGJvdGgpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkFsdGVybmF0aXZlIHRleHQgZm9yIGltYWdlIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlRpcCIsCiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlRpcCB0ZXh0IgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlByb2dyZXNzIHRleHQiLAogICAgICAiZGVmYXVsdCI6ICJLb3J0IEBjYXJkIHVkIGFmIEB0b3RhbCAiLAogICAgICAiZGVzY3JpcHRpb24iOiAiUHJvZ3Jlc3MgdGV4dCwgdmFyaWFibGVzIGF2YWlsYWJsZTogQGNhcmQgYW5kIEB0b3RhbC4gRXhhbXBsZTogJ0NhcmQgQGNhcmQgb2YgQHRvdGFsJyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciB0aGUgbmV4dCBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJOw6ZzdGUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIHByZXZpb3VzIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIkZvcnJpZ2UiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIGNoZWNrIGFuc3dlcnMgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiVGplayIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJSZXF1aXJlIHVzZXIgaW5wdXQgYmVmb3JlIHRoZSBzb2x1dGlvbiBjYW4gYmUgdmlld2VkIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHRoZSBhbnN3ZXIgaW5wdXQgZmllbGQiLAogICAgICAiZGVmYXVsdCI6ICJEaXQgc3ZhciIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBjb3JyZWN0IGFuc3dlciIsCiAgICAgICJkZWZhdWx0IjogIlJpZ3RpZ3QiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgaW5jb3JyZWN0IGFuc3dlciIsCiAgICAgICJkZWZhdWx0IjogIkZvcmtlcnQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiU2hvdyBzb2x1dGlvbiB0ZXh0IiwKICAgICAgImRlZmF1bHQiOiAiUmlndGlndCBzdmFyOiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciByZXN1bHRzIHRpdGxlIiwKICAgICAgImRlZmF1bHQiOiAiUmVzdWx0cyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBudW1iZXIgb2YgY29ycmVjdCIsCiAgICAgICJkZWZhdWx0IjogIkBzY29yZSB1ZCBhZiBAdG90YWwgcmlndGlnZSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJSZXN1bHQgdGV4dCwgdmFyaWFibGVzIGF2YWlsYWJsZTogQHNjb3JlIGFuZCBAdG90YWwuIEV4YW1wbGU6ICdAc2NvcmUgb2YgQHRvdGFsIGNvcnJlY3QnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHNob3cgcmVzdWx0cyIsCiAgICAgICJkZWZhdWx0IjogIlZpcyByZXN1bHRhdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBzaG9ydCBhbnN3ZXIgbGFiZWwiLAogICAgICAiZGVmYXVsdCI6ICJBOiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBcInJldHJ5XCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiUHLDuHYgaWdlbiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDYXNlIHNlbnNpdGl2ZSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJNYWtlcyBzdXJlIHRoZSB1c2VyIGlucHV0IGhhcyB0byBiZSBleGFjdGx5IHRoZSBzYW1lIGFzIHRoZSBhbnN3ZXIuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkluY29ycmVjdCB0ZXh0IGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiRm9ya2VydCBzdmFyLiBEZXQgcmlndGlnZSBzdmFyIHZhciBAYW5zd2VyIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdGhhdCB3aWxsIGJlIGFubm91bmNlZCB0byBhc3Npc3RpdmUgdGVjaG5vbG9naWVzLiBVc2UgQGFuc3dlciBhcyB2YXJpYWJsZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ29ycmVjdCBmZWVkYmFjayB0ZXh0IGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiQGFuc3dlciBlciByaWd0aWd0IiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdGhhdCB3aWxsIGJlIGFubm91bmNlZCB0byBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIHdoZW4gYSBjYXJkIGlzIGFuc3dlcmVkIGNvcnJlY3RseS4gVXNlIEBhbnN3ZXIgYXMgdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNhcmQgY2hhbmdlIGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiU2lkZSBAY3VycmVudCB1ZCBhZiBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMgd2hlbiBuYXZpZ2F0aW5nIGJldHdlZW4gY2FyZHMuIFVzZSBAY3VycmVudCBhbmQgQHRvdGFsIGFzIHZhcmlhYmxlcy4iCiAgICB9CiAgXQp9"],"libraries\/H5P.Flashcards-1.5\/language\/de.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJBdWZnYWJlbmJlc2NocmVpYnVuZyIKICAgIH0sCiAgICB7CiAgICAgICJ3aWRnZXRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJFaW5nYWJlbWFza2UiCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiS2FydGVuIiwKICAgICAgImVudGl0eSI6ICJLYXJ0ZSIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAibGFiZWwiOiAiS2FydGUiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJGcmFnZSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcHRpb25hbGVyIEZyYWdldGV4dCBmw7xyIGRpZSBLYXJ0ZS4gKEVzIGlzdCBudXIgZWluIFRleHQsIG51ciBlaW4gQmlsZCBvZGVyIGJlaWRlcyBtw7ZnbGljaCkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQW50d29ydCIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcHRpb25hbGUgQW50d29ydCAoTMO2c3VuZykgZsO8ciBkaWUgS2FydGUuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkJpbGQiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiT3B0aW9uYWxlcyBCaWxkIGbDvHIgZGllIEthcnRlLiAoRXMgaXN0IG51ciBlaW4gVGV4dCwgbnVyIGVpbiBCaWxkIG9kZXIgYmVpZGVzIG3DtmdsaWNoKSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJBbHRlcm5hdGl2dGV4dCBmw7xyIGRhcyBCaWxkIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlRpcHAiLAogICAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJUaXBwLVRleHQiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBkZXIgRm9ydHNjaHJpdHRzYW56ZWlnZSIsCiAgICAgICJkZWZhdWx0IjogIkthcnRlIEBjYXJkIHZvbiBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVmVyZsO8Z2JhcmUgUGxhdHpoYWx0ZXI6IEBjYXJkIHVuZCBAdG90YWwuIEJlaXNwaWVsOiAnS2FydGUgQGNhcmQgdm9uIEB0b3RhbCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQmVzY2hyaWZ0dW5nIGRlcyBcIldlaXRlclwiLUJ1dHRvbnMiLAogICAgICAiZGVmYXVsdCI6ICJXZWl0ZXIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQmVzY2hyaWZ0dW5nIGRlcyBcIlp1csO8Y2tcIi1CdXR0b25zIiwKICAgICAgImRlZmF1bHQiOiAiWnVyw7xjayIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZXNjaHJpZnR1bmcgZGVzIFwiw5xiZXJwcsO8ZmVuXCItQnV0dG9ucyIsCiAgICAgICJkZWZhdWx0IjogIsOcYmVycHLDvGZlbiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJMw7ZzdW5nIGthbm4gZXJzdCBhbmdlemVpZ3Qgd2VyZGVuLCB3ZW5uIGVpbmUgQW50d29ydCBlaW5nZWdlYmVuIHd1cmRlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlBsYXR6aGFsdGVyIGltIEFudHdvcnQtRWluZ2FiZWZlbGQiLAogICAgICAiZGVmYXVsdCI6ICJEZWluZSBBbnR3b3J0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkJlc2NocmlmdHVuZyBmw7xyIFwiUmljaHRpZ2UgQW50d29ydFwiIiwKICAgICAgImRlZmF1bHQiOiAiUmljaHRpZyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZXNjaHJpZnR1bmcgZsO8ciBcIkZhbHNjaGUgQW50d29ydFwiIiwKICAgICAgImRlZmF1bHQiOiAiRmFsc2NoIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkJlc2NocmlmdHVuZyBkZXIgTMO2c3VuZyIsCiAgICAgICJkZWZhdWx0IjogIlJpY2h0aWdlIEFudHdvcnQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiw5xiZXJzY2hyaWZ0IGRlciBFcmdlYm5pc3NlaXRlIiwKICAgICAgImRlZmF1bHQiOiAiRXJnZWJuaXNzZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0LCBkZXIgYW5naWJ0LCB3aWUgdmllbGUgS2FydGVuIHJpY2h0aWcgd2FyZW4iLAogICAgICAiZGVmYXVsdCI6ICJAc2NvcmUgdm9uIEB0b3RhbCByaWNodGlnIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlZlcmbDvGdiYXJlIFBsYXR6aGFsdGVyOiBAc2NvcmUgdW5kIEB0b3RhbC4gQmVpc3BpZWw6ICdAc2NvcmUgdm9uIEB0b3RhbCByaWNodGlnJyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZXNjaHJpZnR1bmcgZGVzIFwiRXJnZWJuaXNzZSBhbnplaWdlblwiLUJ1dHRvbnMiLAogICAgICAiZGVmYXVsdCI6ICJFcmdlYm5pc3NlIGFuemVpZ2VuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkt1cnpmb3JtIHZvbiBcIkFudHdvcnRcIiIsCiAgICAgICJkZWZhdWx0IjogIkE6IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkJlc2NocmlmdHVuZyBkZXMgXCJXaWVkZXJob2xlblwiLUJ1dHRvbnMiLAogICAgICAiZGVmYXVsdCI6ICJXaWVkZXJob2xlbiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJBdWYgR3Jvw58tL0tsZWluc2NocmVpYnVuZyBhY2h0ZW4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiU3RlbGx0IHNpY2hlciwgZGFzcyBkaWUgTMO2c3VuZyBleGFrdCBkZXIgVm9yZ2FiZSBlbnRzcHJpY2h0LiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZXplaWNobnVuZyBlaW5lciBmYWxzY2hlbiBBbnR3b3J0IGbDvHIgVm9ybGVzZXdlcmt6ZXVnZSIsCiAgICAgICJkZWZhdWx0IjogIkZhbHNjaGUgQW50d29ydC4gRGllIHJpY2h0aWdlIEFudHdvcnQgaXN0IEBhbnN3ZXIiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCwgZGVyIHZvbiBWb3JsZXNld2Vya3pldWdlbiB2b3JnZWxlc2VuIHdpcmQgKEJhcnJpZXJlZnJlaWhlaXQpLiBWZXJ3ZW5kZSBAYW5zd2VyIGFscyBQbGF0emhhbHRlci4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ29ycmVjdCBmZWVkYmFjayB0ZXh0IGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiQGFuc3dlciBpc3QgcmljaHRpZy4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCwgZGVyIGR1cmNoIFZvcmxlc2V3ZXJremV1Z2UgKEJhcnJpZXJlZnJlaWhlaXQpIHZvcmdlbGVzZW4gd2lyZCwgd2VubiBlaW5lIEthcnRlIHJpY2h0aWcgYmVhbnR3b3J0ZXQgd2lyZC4gTnV0emUgQGFuc3dlciBhbHMgUGxhdHpoYWx0ZXIuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgenVtIEthcnRlbndlY2hzZWwgZsO8ciBWb3JsZXNld2Vya3pldWdlIiwKICAgICAgImRlZmF1bHQiOiAiS2FydGUgQGN1cnJlbnQgdm9uIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0LCBkZXIgdm9uIFZvcmxlc2V3ZXJremV1Z2VuIHZvcmdlbGVzZW4gd2lyZCwgd2VubiB6d2lzY2hlbiBLYXJ0ZW4gZ2V3ZWNoc2VsdCB3aXJkIChCYXJyaWVyZWZyZWloZWl0KS4gVmVyd2VuZGUgQGN1cnJlbnQgdW5kIEB0b3RhbCBhbHMgUGxhdHpoYWx0ZXIuIgogICAgfQogIF0KfQo="],"libraries\/H5P.Flashcards-1.5\/language\/el.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLOoM61z4HOuc6zz4HOsc+Gzq4gzqzPg866zrfPg863z4IiCiAgICB9LAogICAgewogICAgICAid2lkZ2V0cyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAizpLOsc+DzrnOus+MIgogICAgICAgIH0KICAgICAgXSwKICAgICAgImxhYmVsIjogIs6azqzPgc+EzrXPgiIsCiAgICAgICJlbnRpdHkiOiAizrrOsc+Bz4TOsc+CIiwKICAgICAgImZpZWxkIjogewogICAgICAgICJsYWJlbCI6ICLOms6sz4HPhM6xIiwKICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAizpXPgc+Oz4TOt8+DzrciLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAizprOtc6vzrzOtc69zr8gzrXPgc+Oz4TOt8+DzrfPgiDOs865zrEgz4TOt869IM66zqzPgc+EzrEuIM6XIM66zqzPgc+EzrEgzrzPgM6\/z4HOtc6vIM69zrEgzq3Ph861zrkgzrzPjM69zr8gzrXOuc66z4zOvc6xLCDOvM+Mzr3OvyDOus61zq\/OvM61zr3OvyDOriDOus6xzrkgz4TOsSDOtM+Nzr8gKM+Az4HOv86xzrnPgc61z4TOuc66z4wpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIs6Rz4DOrM69z4TOt8+DzrciLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAizqDPgc6\/zrHOuc+BzrXPhM65zrrOriIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICLOlc65zrrPjM69zrEiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAizpXOuc66z4zOvc6xIM6zzrnOsSDPhM63zr0gzrrOrM+Bz4TOsS4gzpcgzrrOrM+Bz4TOsSDOvM+Azr\/Pgc61zq8gzr3OsSDOrc+HzrXOuSDOvM+Mzr3OvyDOtc65zrrPjM69zrEsIM68z4zOvc6\/IM66zrXOr868zrXOvc6\/IM6uIM66zrHOuSDPhM6xIM60z43OvyAoz4DPgc6\/zrHOuc+BzrXPhM65zrrPjCkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAizpXOvc6xzrvOu86xzrrPhM65zrrPjCDOus61zq\/OvM61zr3OvyDOs865zrEgz4TOt869IM61zrnOus+Mzr3OsSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICLOlc+AzrXOvs6uzrPOt8+DzrciLAogICAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICLOlc+AzrXOvs63zrPOt868zrHPhM65zrrPjCDOus61zq\/OvM61zr3OvyIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLOms61zq\/OvM61zr3OvyDPgM+Bzr\/PjM60zr\/PhSIsCiAgICAgICJkZWZhdWx0IjogIs6azqzPgc+EzrEgQGNhcmQgzrHPgM+MIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLOms61zq\/OvM61zr3OvyDPgM+Bzr\/PjM60zr\/PhSwgzrTOuc6xzrjOrc+DzrnOvM61z4IgzrzOtc+EzrHOss67zrfPhM6tz4I6IEBjYXJkIM66zrHOuSBAdG90YWwuIM6gzrHPgc6szrTOtc65zrPOvM6xOiAnzprOrM+Bz4TOsSBAY2FyZCDOsc+Az4wgQHRvdGFsJyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLOlc+EzrnOus6tz4TOsSDOus6\/z4XOvM+AzrnOv8+NIM68zrXPhM6szrLOsc+DzrfPgiDPg8+EzrfOvSDOtc+Az4zOvM61zr3OtyDOus6sz4HPhM6xIiwKICAgICAgImRlZmF1bHQiOiAizpXPgM+MzrzOtc69zrciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAizpXPhM65zrrOrc+EzrEgzrrOv8+FzrzPgM65zr\/PjSDOvM61z4TOrM6yzrHPg863z4Igz4PPhM63zr0gz4DPgc6\/zrfOs86\/z43OvM61zr3OtyDOus6sz4HPhM6xIiwKICAgICAgImRlZmF1bHQiOiAizqDPgc6\/zrfOs86\/z43OvM61zr3OtyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLOlc+EzrnOus6tz4TOsSDOus6\/z4XOvM+AzrnOv8+NIM61zrvOrc6zz4fOv8+FIM6xz4DOsc69z4TOrs+DzrXPic69IiwKICAgICAgImRlZmF1bHQiOiAizojOu861zrPPh86\/z4IiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAizpHPgM6xzrnPhM61zq\/PhM6xzrkgzrrOsc+EzrHPh8+Oz4HOuc+DzrcgzrHPgM6szr3PhM63z4POt8+CIM+Az4HOuc69IM+EzrfOvSDOtc68z4bOrM69zrnPg863IM+EzrfPgiDOu8+Nz4POt8+CIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIs6azrXOr868zrXOvc6\/IM6zzrnOsSDPhM6\/IM+AzrXOtM6vzr8gzrXOuc+DzrHOs8+JzrPOrs+CIM6xz4DOrM69z4TOt8+DzrfPgiIsCiAgICAgICJkZWZhdWx0IjogIs6XIM6xz4DOrM69z4TOt8+Dzq4gz4POv8+FIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIs6azrXOr868zrXOvc6\/IM6zzrnOsSDPg8+Jz4PPhM6uIM6xz4DOrM69z4TOt8+DzrciLAogICAgICAiZGVmYXVsdCI6ICLOo8+Jz4PPhM+MIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIs6azrXOr868zrXOvc6\/IM6zzrnOsSDOu86szrjOv8+CIM6xz4DOrM69z4TOt8+DzrciLAogICAgICAiZGVmYXVsdCI6ICLOm86szrjOv8+CIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIs6azrXOr868zrXOvc6\/IM61zrzPhs6szr3Ouc+DzrfPgiDOu8+Nz4POt8+CIiwKICAgICAgImRlZmF1bHQiOiAizqPPic+Dz4TOriDOsc+AzqzOvc+EzrfPg863IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIs6azrXOr868zrXOvc6\/IM+Ezq\/PhM67zr\/PhSDOsc+Azr\/PhM61zrvOtc+DzrzOrM+Ez4nOvSIsCiAgICAgICJkZWZhdWx0IjogIs6Rz4DOv8+EzrXOu86tz4POvM6xz4TOsSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLOms61zq\/OvM61zr3OvyDOs865zrEgzrHPgc65zrjOvM+MIM+Dz4nPg8+Ez47OvSDOsc+AzrHOvc+Ezq7Pg861z4nOvSIsCiAgICAgICJkZWZhdWx0IjogIkBzY29yZSDPg8+Jz4PPhM6sIM6xz4DPjCBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAizprOtc6vzrzOtc69zr8gzrHPgM6\/z4TOtc67zrXPg868zqzPhM+Jzr0sIM60zrnOsc64zq3Pg865zrzOtc+CIM68zrXPhM6xzrLOu863z4TOrc+COiBAc2NvcmUgzrrOsc65IEB0b3RhbC4gzqDOsc+BzqzOtM61zrnOs868zrE6ICdAc2NvcmUgz4PPic+Dz4TOrCDOsc+Az4wgQHRvdGFsJyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLOms61zq\/OvM61zr3OvyDOtc68z4bOrM69zrnPg863z4IgzrHPgM6\/z4TOtc67zrXPg868zqzPhM+Jzr0iLAogICAgICAiZGVmYXVsdCI6ICLOkc+Azr\/PhM61zrvOrc+DzrzOsc+EzrEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAizprOtc6vzrzOtc69zr8gzrXPhM65zrrOrc+EzrHPgiDPg8+Nzr3PhM6\/zrzOt8+CIM6xz4DOrM69z4TOt8+DzrfPgiIsCiAgICAgICJkZWZhdWx0IjogIkE6IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIs6azrXOr868zrXOvc6\/IM69zq3Osc+CIM+Az4HOv8+Dz4DOrM64zrXOuc6xz4IiLAogICAgICAiZGVmYXVsdCI6ICLOlc+AzrHOvc6szrvOt8+IzrciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAizpTOuc6szrrPgc65z4POtyDPgM61zrbPjs69Lc66zrXPhs6xzrvOsc6vz4nOvSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLOpM6\/IM66zrXOr868zrXOvc6\/IM+Azr\/PhSDOtc65z4POrM6zzrXOuSDOvyDPh8+Bzq7Pg8+EzrfPgiDPgM+Bzq3PgM61zrkgzr3OsSDOtc6vzr3Osc65IM6xzrrPgc65zrLPjs+CIM+Ezr8gzq\/OtM65zr8gKM+AzrXOts6sLc66zrXPhs6xzrvOsc6vzrEpIM68zrUgz4TOt869IM6xz4DOrM69z4TOt8+DzrcuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIs6azrXOr868zrXOvc6\/IM67zqzOuM6\/z4IgzrHPgM6szr3PhM63z4POt8+CIM6zzrnOsSDPhc+Azr\/Pg8+EzrfPgc65zrrPhM65zrrOrc+CIM+EzrXPh869zr\/Ou86\/zrPOr861z4IiLAogICAgICAiZGVmYXVsdCI6ICLOm86szrjOv8+CIM6xz4DOrM69z4TOt8+DzrcuIM6jz4nPg8+Ezq4gzrHPgM6szr3PhM63z4POtyDOtyBAYW5zd2VyIiwKICAgICAgImRlc2NyaXB0aW9uIjogIs6azrXOr868zrXOvc6\/IM+Azr\/PhSDOuM6xIM+Hz4HOt8+DzrnOvM6\/z4DOv865zrfOuM61zq8gzrHPgM+MIM+Fz4DOv8+Dz4TOt8+BzrnOus+EzrnOus6tz4Igz4TOtc+Hzr3Ov867zr\/Os86vzrXPgi4gzqfPgc63z4POuc68zr\/PgM6\/zrnOrs+Dz4TOtSDPhM63IM68zrXPhM6xzrLOu863z4TOriBAYW5zd2VyLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLOms61zq\/OvM61zr3OvyDPg8+Jz4PPhM6uz4IgzrHPgM6szr3PhM63z4POt8+CIM6zzrnOsSDPhc+Azr\/Pg8+EzrfPgc65zrrPhM65zrrOrc+CIM+EzrXPh869zr\/Ou86\/zrPOr861z4IiLAogICAgICAiZGVmYXVsdCI6ICLOlyDOsc+AzqzOvc+EzrfPg863IEBhbnN3ZXIgzrXOr869zrHOuSDPg8+Jz4PPhM6uLiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLOms61zq\/OvM61zr3OvyDPgM6\/z4UgzrjOsSDPh8+BzrfPg865zrzOv8+Azr\/Ouc63zrjOtc6vIM6xz4DPjCDPhc+Azr\/Pg8+EzrfPgc65zrrPhM65zrrOrc+CIM+EzrXPh869zr\/Ou86\/zrPOr861z4Igz4zPhM6xzr0gzrzOuc6xIM66zqzPgc+EzrEgzrHPgM6xzr3PhM63zrjOtc6vIM+Dz4nPg8+EzqwuIM6nz4HOt8+DzrnOvM6\/z4DOv865zq7Pg8+EzrUgz4TOtyDOvM61z4TOsc6yzrvOt8+Ezq4gQGFuc3dlci4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAizprOtc6vzrzOtc69zr8gz4TPgc6tz4fOv8+Fz4POsc+CIM66zqzPgc+EzrHPgiDOs865zrEgz4XPgM6\/z4PPhM63z4HOuc66z4TOuc66zq3PgiDPhM61z4fOvc6\/zrvOv86zzq\/Otc+CIiwKICAgICAgImRlZmF1bHQiOiAizprOrM+Bz4TOsSBAY3VycmVudCDOsc+Az4wgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIs6azrXOr868zrXOvc6\/IM+Azr\/PhSDOuM6xIM+Hz4HOt8+DzrnOvM6\/z4DOv865zrfOuM61zq8gzrHPgM+MIM+Fz4DOv8+Dz4TOt8+BzrnOus+EzrnOus6tz4Igz4TOtc+Hzr3Ov867zr\/Os86vzrXPgiDOus6xz4TOrCDPhM63zr0gz4DOu86\/zq7Os863z4POtyDOvM61z4TOsc6+z40gz4TPic69IM66zrHPgc+Ez47OvS4gzqfPgc63z4POuc68zr\/PgM6\/zrnOrs+Dz4TOtSDPhM65z4IgzrzOtc+EzrHOss67zrfPhM6tz4IgQGN1cnJlbnQsIEB0b3RhbC4iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Flashcards-1.5\/language\/es.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZXNjcmlwY2nDs24gZGUgbGEgdGFyZWEiCiAgICB9LAogICAgewogICAgICAid2lkZ2V0cyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiUG9yIGRlZmVjdG8iCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiQ2FydGFzIiwKICAgICAgImVudGl0eSI6ICJjYXJ0YSIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAibGFiZWwiOiAiQ2FydGEiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJQcmVndW50YSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJQcmVndW50YSBvcGNpb25hbCBkZSB0ZXh0byBwYXJhIGxhIGNhcnRhLiAoTGEgY2FydGEgcHVlZGUgdXNhciBzw7NsbyB1bmEgaW1hZ2VuLCBzw7NsbyB1biB0ZXh0byBvIGFtYm9zKSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJSZXNwdWVzdGEiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiUmVzcHVlc3RhIG9wY2lvbmFsIChzb2x1Y2nDs24pIHBhcmEgbGEgY2FydGEuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkltYWdlbiIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJJbWFnZW4gb3BjaW9uYWwgcGFyYSBsYSBjYXJ0YS4gKExhIGNhcnRhIHB1ZWRlIHVzYXIgc8OzbG8gdW5hIGltYWdlbiwgc8OzbG8gdW4gdGV4dG8gbyBhbWJvcykiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiVGV4dG8gYWx0ZXJuYXRpdm8gcGFyYSBsYSBpbWFnZW4iCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiUGlzdGEiLAogICAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJUZXh0byBkZSBwaXN0YSIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBkZSBQcm9ncmVzbyIsCiAgICAgICJkZWZhdWx0IjogIkNhcnRhIEBjYXJkIGRlIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0byBkZSBQcm9ncmVzbywgdmFyaWFibGVzIGRpc3BvbmlibGVzOiBAY2FyZCB5IEB0b3RhbC4gRWplbXBsbzogJ0NhcnRhIEBjYXJkIGRlIEB0b3RhbCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSBlbCBib3TDs24gU2lndWllbnRlIiwKICAgICAgImRlZmF1bHQiOiAiU2lndWllbnRlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgZWwgYm90w7NuIEFudGVyaW9yIiwKICAgICAgImRlZmF1bHQiOiAiQW50ZXJpb3IiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSBlbCBib3TDs24gUmV2aXNhciByZXNwdWVzdGFzIiwKICAgICAgImRlZmF1bHQiOiAiQ29tcHJvYmFyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlJlcXVlcmlyIGVudHJhZGEgZGVsIHVzdWFyaW8gYW50ZXMgZGUgcG9kZXIgdmVyIGxhIHNvbHVjacOzbiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIGVsIGNhbXBvIGRlIGVudHJhZGEgZGUgcmVzcHVlc3RhIiwKICAgICAgImRlZmF1bHQiOiAiVHUgcmVzcHVlc3RhIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgcmVzcHVlc3RhIGNvcnJlY3RhIiwKICAgICAgImRlZmF1bHQiOiAiQ29ycmVjdGEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSByZXNwdWVzdGEgaW5jb3JyZWN0YSIsCiAgICAgICJkZWZhdWx0IjogIkluY29ycmVjdGEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTW9zdHJhciB0ZXh0byBkZSBzb2x1Y2nDs24iLAogICAgICAiZGVmYXVsdCI6ICJSZXNwdWVzdGEgY29ycmVjdGEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gZGUgdMOtdHVsbyBwYXJhIHJlc3VsdGFkb3MiLAogICAgICAiZGVmYXVsdCI6ICJSZXN1bHRhZG9zIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgbsO6bWVybyBkZSBhY2llcnRvcyIsCiAgICAgICJkZWZhdWx0IjogIkBzY29yZSBkZSBAdG90YWwgY29ycmVjdG9zIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHRvIGRlIHJlc3VsdGFkb3MsIHZhcmlhYmxlcyBkaXNwb25pYmxlczogQHNjb3JlIHkgQHRvdGFsLiBFamVtcGxvOiAnQHNjb3JlIGRlIEB0b3RhbCBjb3JyZWN0b3MnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgbW9zdHJhciByZXN1bHRhZG9zIiwKICAgICAgImRlZmF1bHQiOiAiTW9zdHJhciByZXN1bHRhZG9zIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgZXRpcXVldGEgZGUgcmVzcHVlc3RhIGNvcnRhIiwKICAgICAgImRlZmF1bHQiOiAiQToiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSBib3TDs24gXCJpbnRlbnRhciBkZSBudWV2b1wiIiwKICAgICAgImRlZmF1bHQiOiAiSW50ZW50YXIgZGUgbnVldm8iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRGlmZXJlbmNpYXIgZW50cmUgTUFZw5pTQ1VMQVMvbWluw7pzY3VsYXMiLAogICAgICAiZGVzY3JpcHRpb24iOiAiU2UgYXNlZ3VyYSBkZSBxdWUgbGEgZW50cmFkYSBkZWwgdXN1YXJpbyB0ZW5nYSBxdWUgc2VyIGV4YWN0YW1lbnRlIGxhIG1pc21hIHF1ZSBsYSByZXNwdWVzdGEuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIGRlIHJlc3B1ZXN0YSBpbmNvcnJlY3RhIHBhcmEgdGVjbm9sb2fDrWFzIGRlIGFzaXN0ZW5jaWEiLAogICAgICAiZGVmYXVsdCI6ICJSZXNwdWVzdGEgaW5jb3JyZWN0YS4gTGEgcmVzcHVlc3RhIGNvcnJlY3RhIGVyYSBAYW5zd2VyIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHRvIGFudW5jaWFkbyBhIGxhcyB0ZWNub2xvZ8OtYXMgZGUgYXNpc3RlbmNpYS4gVXNhIEBhbnN3ZXIgY29tbyB2YXJpYWJsZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gZGUgcmV0cm9hbGltZW50YWNpw7NuIHBhcmEgY29ycmVjdG8gcGFyYSB0ZWNub2xvZ8OtYXMgZGUgYXNpc3RlbmNpYSIsCiAgICAgICJkZWZhdWx0IjogIkBhbnN3ZXIgZXMgY29ycmVjdGEuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHRvIGFudW5jaWFkbyBhIGxhcyB0ZWNub2xvZ8OtYXMgZGUgYXNpc3RlbmNpYSBjdWFuZG8gc2UgY29udGVzdGEgdW5hIHRhcmpldGEgY29ycmVjdGFtZW50ZS4gVXNhIEBhbnN3ZXIgY29tbyB2YXJpYWJsZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2FtYmlvIGRlIHRhcmpldGEgcGFyYSB0ZWNub2xvZ8OtYXMgZGUgYXNpc3RlbmNpYSIsCiAgICAgICJkZWZhdWx0IjogIlDDoWdpbmEgQGN1cnJlbnQgZGUgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHRvIGFudW5jaWFkbyBhIGxhcyB0ZWNub2xvZ8OtYXMgZGUgYXNpc3RlbmNpYSBhbCBuYXZlZ2FyIGVudHJlIGNhcnRhcy4gVXNhIEBjdXJyZW50IHkgQHRvdGFsIGNvbW8gdmFyaWFibGVzLiIKICAgIH0KICBdCn0K"],"libraries\/H5P.Flashcards-1.5\/language\/es-mx.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZXNjcmlwY2nDs24gZGVsIHRyYWJham8iCiAgICB9LAogICAgewogICAgICAid2lkZ2V0cyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiUHJlZGV0ZXJtaW5hZG8iCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiQ2FydGFzIiwKICAgICAgImVudGl0eSI6ICJjYXJ0YSIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAibGFiZWwiOiAiQ2FydGEiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJQcmVndW50YSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJQcmVndW50YSBvcGNpb25hbCBkZSB0ZXh0byBwYXJhIGxhIGNhcnRhLiAoTGEgY2FydGEgcG9kcsOtYSB1c2FyIHNvbGFtZW50ZSB1bmEgaW1hZ2VuLCBzb2xvIHVuIHRleHRvIG8gYW1ib3MpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlJlc3B1ZXN0YSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJSZXNwdWVzdGEgb3BjaW9uYWwgKHNvbHVjacOzbikgcGFyYSBsYSBjYXJ0YS4iCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiSW1hZ2VuIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIkltYWdlbiBvcGNpb25hbCBwYXJhIGxhIGNhcnRhLiAoTGEgY2FydGEgcG9kcsOtYSB1c2FyIHNvbGFtZW50ZSB1bmEgaW1hZ2VuLCBzb2xvIHVuIHRleHRvIG8gYW1ib3MpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlRleHRvIGFsdGVybmF0aXZvIHBhcmEgbGEgaW1hZ2VuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlBpc3RhIiwKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiVGV4dG8gZGUgcGlzdGEiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSBQcm9ncmVzbyIsCiAgICAgICJkZWZhdWx0IjogIkNhcnRhIEBjYXJkIGRlIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0byBkZWwgUHJvZ3Jlc28sIHZhcmlhYmxlcyBkaXNwb25pYmxlczogQGNhcmQgeSBAdG90YWwuIEVqZW1wbG86ICdDYXJ0YSBAY2FyZCBkZSBAdG90YWwnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgZWwgYm90w7NuIFNpZ3VpZW50ZSIsCiAgICAgICJkZWZhdWx0IjogIlNpZ3VpZW50ZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIGVsIGJvdMOzbiBBbnRlcmlvciIsCiAgICAgICJkZWZhdWx0IjogIkFudGVyaW9yIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgZWwgYm90w7NuIENvbXByb2JhciByZXNwdWVzdGFzIiwKICAgICAgImRlZmF1bHQiOiAiQ29tcHJvYmFyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlJlcXVlcmlyIGVudHJhZGEgZGVsIHVzdWFyaW8gYW50ZXMgcXVlIGxhIHNvbHVjacOzbiBwdWVkYSBzZXIgdmlzdGEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSBlbCBjYW1wbyBkZSBpbmdyZXNvIGRlIHJlc3B1ZXN0YSIsCiAgICAgICJkZWZhdWx0IjogIlN1IHJlc3B1ZXN0YSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIHJlc3B1ZXN0YSBjb3JyZWN0YSIsCiAgICAgICJkZWZhdWx0IjogIkNvcnJlY3RvIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgcmVzcHVlc3RhIGluY29ycmVjdGEiLAogICAgICAiZGVmYXVsdCI6ICJJbmNvcnJlY3RhIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIGRlIE1vc3RyYXIgc29sdWNpw7NuIiwKICAgICAgImRlZmF1bHQiOiAiUmVzcHVlc3RhIGNvcnJlY3RhIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlTDrXR1bG8gcGFyYSB0ZXh0byBkZSBSZXN1bHRhZG9zIiwKICAgICAgImRlZmF1bHQiOiAiUmVzdWx0YWRvcyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIG7Dum1lcm8gZGUgYWNpZXJ0b3MiLAogICAgICAiZGVmYXVsdCI6ICJAc2NvcmUgZGUgQHRvdGFsIGNvcnJlY3RvcyIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0byBkZSBSZXN1bHRhZG9zLCB2YXJpYWJsZXMgZGlzcG9uaWJsZXM6IEBzY29yZSB5IEB0b3RhbC4gRWplbXBsbzogJ0BzY29yZSBkZSBAdG90YWwgY29ycmVjdG9zJyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIG1vc3RyYXIgcmVzdWx0YWRvcyIsCiAgICAgICJkZWZhdWx0IjogIk1vc3RyYXIgcmVzdWx0YWRvcyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIGV0aXF1ZXRhIGRlIHJlc3B1ZXN0YSBjb3J0YSIsCiAgICAgICJkZWZhdWx0IjogIkE6IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgYm90w7NuIFwicmVpbnRlbnRhclwiIiwKICAgICAgImRlZmF1bHQiOiAiUmVpbnRlbnRhciIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJNQVnDmlNDVUxBUy9taW7DunNjdWxhcyBzaSBpbXBvcnRhbiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJBc2VndXJhcnNlIHF1ZSBsYSBlbnRyYWRhIGRlbCB1c3VhcmlvIHRlbmdhIHF1ZSBzZXIgZXhhY3RhbWVudGUgbGEgbWlzbWEgcXVlIGxhIHJlc3B1ZXN0YS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gaW5jb3JyZWN0byBwYXJhIHRlY25vbG9nw61hcyBhc2lzdGl2YXMiLAogICAgICAiZGVmYXVsdCI6ICJSZXNwdWVzdGEgaW5jb3JyZWN0YS4gTGEgcmVzcHVlc3RhIGNvcnJlY3RhIGVyYSBAYW5zd2VyIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHRvIHF1ZSBzZXLDoSBhbnVuY2lhZG8gYSB0ZWNub2xvZ8OtYXMgYXNpc3RpdmFzLiBVc2UgQGFuc3dlciBjb21vIHZhcmlhYmxlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBkZSByZXRyb2FsaW1lbnRhY2nDs24gY29ycmVjdGEgcGFyYSB0ZWNub2xvZ8OtYXMgYXNpc3RpdmFzIiwKICAgICAgImRlZmF1bHQiOiAiQGFuc3dlciBlcyBjb3JyZWN0YS4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dG8gcXVlIHNlcsOhIGFudW5jaWFkbyBhIHRlY25vbG9nw61hcyBhc2lzdGl2YXMgY3VhbmRvIHVuYSB0YXJqZXRhIGVzIGNvbnRlc3RhZGEgY29ycmVjdGFtZW50ZS4gVXNlIEBhbnN3ZXIgY29tbyB2YXJpYWJsZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2FtYmlvIGRlIFRhcmpldGEgcGFyYSB0ZWNub2xvZ8OtYXMgYXNpc3RpdmFzIiwKICAgICAgImRlZmF1bHQiOiAiUMOhZ2luYSBAY3VycmVudCBkZSBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dG8gcXVlIHNlcsOhIGFudW5jaWFkbyBhIHRlY25vbG9nw61hcyBhc2lzdGl2YXMgYWwgbmF2ZWdhciBlbnRyZSBjYXJ0YXMuIFVzZSBAY3VycmVudCB5IEB0b3RhbCBjb21vIHZhcmlhYmxlcy4iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Flashcards-1.5\/language\/et.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLDnGxlc2FuZGUga2lyamVsZHVzIgogICAgfSwKICAgIHsKICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIlZhaWtpbWlzaSIKICAgICAgICB9CiAgICAgIF0sCiAgICAgICJsYWJlbCI6ICJLYWFyZGlkIiwKICAgICAgImVudGl0eSI6ICJrYWFydCIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAibGFiZWwiOiAiS2FhcnQiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJLw7xzaW11cyIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJWYWxpa3VsaW5lIHRla3N0aWvDvHNpbXVzIGthYXJkaWxlLiAoS2FhcnQgdsO1aWIga2FzdXRhZGEgdmFpZCBwaWx0aSwgdmFpZCB0ZWtzdGkgdsO1aSBtw7VsZW1hdCkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiVmFzdHVzIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIlZhbGlrdWxpbmUgdmFzdHVzIChsYWhlbmR1cykga2FhcmRpbGUuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlBpbHQiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiVmFsaWt1bGluZSBwaWx0IGthYXJkaWxlLiAoS2FhcnQgdsO1aWIga2FzdXRhZGEgdmFpZCBwaWx0aSwgdmFpZCB0ZWtzdGkgdsO1aSBtw7VsZW1hdCkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQWx0ZXJuYXRpdmUgdGV4dCBmb3IgaW1hZ2UiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiVmloamUiLAogICAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJWaWhqZSB0ZWtzdCIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFZGFzaWrDtXVkbWlzZSB0ZWtzdCIsCiAgICAgICJkZWZhdWx0IjogIkthYXJ0IEBjYXJkIC8gQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkVkYXNpasO1dWRtaXNlIHRla3N0LCBrYXN1dGF0YXZhZCBtdXV0dWphZCBvbjogQGNhcmQgamEgQHRvdGFsLiBOw6RpdGVrczogJ0thYXJ0IEBjYXJkIC8gQHRvdGFsJyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJKw6RyZ21pbmUgbnVwdSB0ZWtzdCIsCiAgICAgICJkZWZhdWx0IjogIkrDpHJnbWluZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFZWxtaW5lIG51cHUgdGVrc3QiLAogICAgICAiZGVmYXVsdCI6ICJFZWxtaW5lIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlZhc3R1c3RlIGtvbnRyb2xsaSBudXB1IHRla3N0IiwKICAgICAgImRlZmF1bHQiOiAiS29udHJvbGxpIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk7DtXVhIGthc3V0YWphIHNpc2VuZGl0IGVubmUsIGt1aSBsYWhlbmR1c3Qgc2FhYiB2YWFkYXRhIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlZhc3R1c2Ugc2lzZXN0YW1pc3bDpGxqYSB0ZWtzdCIsCiAgICAgICJkZWZhdWx0IjogIlNpbnUgdmFzdHVzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIsOVaWdlIHZhc3R1c2UgdGVrc3QiLAogICAgICAiZGVmYXVsdCI6ICLDlWlnZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJWYWxlIHZhc3R1c2UgdGVrc3QiLAogICAgICAiZGVmYXVsdCI6ICJWYWxlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkxhaGVuZHVzZSBuw6RpdGFtaXNlIHRla3N0IiwKICAgICAgImRlZmF1bHQiOiAiw5VpZ2UgdmFzdHVzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlR1bGVtdXN0ZSBwZWFsa2lyamEgdGVrc3QiLAogICAgICAiZGVmYXVsdCI6ICJUdWxlbXVzZWQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiw5VpZ2V0ZSB2YXN0dXN0ZSBhcnZ1IHRla3N0IiwKICAgICAgImRlZmF1bHQiOiAiQHNjb3JlIC8gQHRvdGFsIMO1aWdldCB2YXN0dXN0IiwKICAgICAgImRlc2NyaXB0aW9uIjogIlR1bGVtdXN0ZSB0ZWtzdCwga2FzdXRhdGF2YWQgbXV1dHVqYWQ6IEBzY29yZSBqYSBAdG90YWwuIE7DpGl0ZWtzOiAnQHNjb3JlIC8gQHRvdGFsIMO1aWdldCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVHVsZW11c3RlIG7DpGl0YW1pc2UgdGVrc3QiLAogICAgICAiZGVmYXVsdCI6ICJOw6RpdGEgdHVsZW11c2kiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTMO8aGlrZXNlIHZhc3R1c2VzaWxkaSB0ZWtzdCIsCiAgICAgICJkZWZhdWx0IjogIkE6IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlwiUHJvb3ZpIHV1ZXN0aVwiIG51cHUgdGVrc3QiLAogICAgICAiZGVmYXVsdCI6ICJQcm9vdmkgdXVlc3RpIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlTDtXN0dXR1bmRsaWsiLAogICAgICAiZGVzY3JpcHRpb24iOiAiS29udHJvbGxpYiwgZXQga2FzdXRhamEgc2lzZW5kIG9sZWtzIHTDpHBzZWx0IHNhbWEsIG1pcyB2YXN0dXMgKHN1dXItL3bDpGlrZXTDpGhlZCkuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkluY29ycmVjdCB0ZXh0IGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiSW5jb3JyZWN0IGFuc3dlci4gQ29ycmVjdCBhbnN3ZXIgd2FzIEBhbnN3ZXIiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMuIFVzZSBAYW5zd2VyIGFzIHZhcmlhYmxlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDb3JyZWN0IGZlZWRiYWNrIHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJAYW5zd2VyIGlzIGNvcnJlY3QuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdGhhdCB3aWxsIGJlIGFubm91bmNlZCB0byBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIHdoZW4gYSBjYXJkIGlzIGFuc3dlcmVkIGNvcnJlY3RseS4gVXNlIEBhbnN3ZXIgYXMgdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNhcmQgY2hhbmdlIGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiUGFnZSBAY3VycmVudCBvZiBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMgd2hlbiBuYXZpZ2F0aW5nIGJldHdlZW4gY2FyZHMuIFVzZSBAY3VycmVudCBhbmQgQHRvdGFsIGFzIHZhcmlhYmxlcy4iCiAgICB9CiAgXQp9"],"libraries\/H5P.Flashcards-1.5\/language\/eu.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJMYW5hcmVuIGRlc2tyaWJhcGVuYSIKICAgIH0sCiAgICB7CiAgICAgICJ3aWRnZXRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJMZWhlbnRzaXRha29hIgogICAgICAgIH0KICAgICAgXSwKICAgICAgImxhYmVsIjogIlR4YXJ0ZWxhayIsCiAgICAgICJlbnRpdHkiOiAidHhhcnRlbGEiLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImxhYmVsIjogIlR4YXJ0ZWxhIiwKICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiR2FsZGVyYSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJUeGFydGVsYXJlbnR6YWtvIGF1a2VyYXprbyB0ZXN0dS1nYWxkZXJhLiAoVHhhcnRlbGFrIHNvaWxpayBpcnVkaWEsIHNvaWxpayB0ZXN0dWEgZWRvIGVyYWJpbGkgZGl0emFrZSkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiRXJhbnR6dW5hIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIkF1a2VyYWtvIGVyYW50enVuYS4iCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiSXJ1ZGlhIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIkF1a2VyYWtvIGlydWRpYSAodHhhcnRlbGFrIGl6YW5nbyBkdSBiYWthcnJpayBpcnVkaWEsIGJha2FycmlrIHRlc3R1YSBlZG8gYmlhaykiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiSXJ1ZGlhcmVuIG9yZGV6a28gdGVzdHVhIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkFyZ2liaWRlYSIsCiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIkFyZ2liaWRlYXJlbiB0ZXN0dWEiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQXVycmVyYXBlbmFyZW4gdGVzdHVhIiwKICAgICAgImRlZmF1bHQiOiAiQGNhcmQgLyBAdG90YWwgdHhhcnRlbGEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiQXVycmVyYXBlbmFyZW4gdGVzdHVhLCBlcmFiaWx0emVuIGRpcmVuIGFsZGFnYWlhazogQGNhcmQgZXRhIEB0b3RhbC4gQWRpYmlkZWE6ICdAY2FyZCAvIEB0b3RhbCB0eGFydGVsYSciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiSHVycmVuZ29hIGJvdG9pYXJlbiB0ZXN0dWEiLAogICAgICAiZGVmYXVsdCI6ICJIdXJyZW5nb2EiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQXVycmVrb2EgYm90b2lhcmVuIHRlc3R1YSIsCiAgICAgICJkZWZhdWx0IjogIkF1cnJla29hIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlwiRWdpYXp0YXR1XCIgYm90b2lhcmVudHpha28gdGVzdHVhIiwKICAgICAgImRlZmF1bHQiOiAiRWdpYXp0YXR1IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFsZGV6IGF1cnJldGlrIGVyYWJpbHR6YWlsZWFrIHNhcnR1IGJlaGFyIGR1IGVyYW50enVuIGJhdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFcmFudHp1bmEgc2FydHpla28gZXJlbXVhcmVuIHRlc3R1YSIsCiAgICAgICJkZWZhdWx0IjogIlp1cmUgZXJhbnR6dW5hIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkVyYW50enVuIHp1emVuZXJha28gdGVzdHVhIiwKICAgICAgImRlZmF1bHQiOiAiRXJhbnR6dW4genV6ZW5hIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkVyYW50enVuIG9rZXJyYXJlbiB0ZXN0dWEiLAogICAgICAiZGVmYXVsdCI6ICJFcmFudHp1biBva2VycmEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRXJha3V0c2kgZXJhbnR6dW4genV6ZW5hIHRlc3R1YSIsCiAgICAgICJkZWZhdWx0IjogIkVyYW50enVuIHp1emVuYSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFbWFpdHplbiB0aXR1bHVhcmVuIHRlc3R1YSIsCiAgICAgICJkZWZhdWx0IjogIkVtYWl0emFrIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkVyYW50enVuIHp1emVuZW4ga29wdXJ1YXJlbiB0ZXN0dWEiLAogICAgICAiZGVmYXVsdCI6ICJAc2NvcmUgLyBAdG90YWwgenV6ZW5hayIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJFcmFudHp1biB6dXplbmVuIHRlc3R1YSwgZXJhYmlsdHplbiBkaXR1ZW4gYWxkYWdhaWFrOiBAc2NvcmUgZXRhIEB0b3RhbC4gQWRpYmlkZWE6ICdAc2NvcmUgLyBAdG90YWwgenV6ZW5hayciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQmlzdGFyYXR1IGVtYWl0emFrIHRlc3R1YSIsCiAgICAgICJkZWZhdWx0IjogIkJpc3RhcmF0dSBlbWFpdHphayIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFcmFudHp1biBsYWJ1cnJhcmVuIGV0aWtldGFyZW4gdGVzdHVhIiwKICAgICAgImRlZmF1bHQiOiAiRXJhbnR6dW5hOiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJcIlNhaWF0dSBiZXJyaXJvXCIgYm90b2lhcmVudHpha28gdGVzdHVhIiwKICAgICAgImRlZmF1bHQiOiAiU2FpYXR1IGJlcnJpcm8iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQmVyZWl6aSBtYWl1c2t1bGFrIGV0YSBtaW51c2t1bGFrIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkV6YXJ0emVuIGR1IGVyYWJpbHR6YWlsZWFyZW4gc2FycmVyYSBpemFuIGJlaGFyIGR1ZWxhIGVyYW50enVuYXJlbiBiZXJkaW5hLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFcmFudHp1biBva2VycmFyZW50emFrbyB0ZXN0dWEgbGFndW50emFyYWtvIHRla25vbG9naWVudHphdCIsCiAgICAgICJkZWZhdWx0IjogIkVyYW50enVuIG9rZXJyYS4gRXJhbnR6dW4genV6ZW5hIEBhbnN3ZXIgemVuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkxhZ3VudHphcmFrbyB0ZWtub2xvZ2lldGFuIGVyYWJpbGlrbyBkZW4gdGVzdHVhLiBFcmFiaWxpIEBhbnN3ZXIgYWxkYWdhaSBnaXNhLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFcmFudHp1biB6dXplbmVyYWtvIGZlZWRiYWNrYXJlbiB0ZXN0dWEgbGFndW50emEgdGVrbm9sb2dpZXRhcmFrbyIsCiAgICAgICJkZWZhdWx0IjogIkBhbnN3ZXIgenV6ZW5hIGRhLiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUeGFydGVsIGJhdGkgbW9kdSB6dXplbmVhbiBlcmFudHp1bmV6IGdlcm8gbGFndW50emEgdGVrbm9sb2dpZW50emFrbyBpcmFnYXJyaWtvIGRlbiB0ZXN0dWEuIEBhbnN3ZXIgYWxkYWdpIGdpc2EgZXJhYmlsaSBkZXpha2V6dS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVHhhcnRlbCBhbGRha2V0YSBsYWd1bnR6YXJha28gdGVrbm9sb2dpZW50emF0IiwKICAgICAgImRlZmF1bHQiOiAiQGN1cnJlbnQuIG9ycmlhLCBAdG90YWwgZ3V6dGlyYSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJMYWd1bnR6YXJha28gdGVrbm9sb2dpZXRhbiB0eGFydGVsIGFydGVhbiBuYWJpZ2F0emVhbiBlcmFiaWxpa28gZGVuIHRlc3R1YS4gRXJhYmlsaSBAY3VycmVudCBldGEgQHRvdGFsIGFsZGFnYWkgZ2lzYS4iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Flashcards-1.5\/language\/fi.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWh0w6R2w6Rua3V2YXVzIgogICAgfSwKICAgIHsKICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIk9sZXR1cyIKICAgICAgICB9CiAgICAgIF0sCiAgICAgICJsYWJlbCI6ICJLb3J0aXQiLAogICAgICAiZW50aXR5IjogImtvcnR0aSIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAibGFiZWwiOiAiS29ydHRpIiwKICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiS3lzeW15cyIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJLb3J0aW4ga3lzeW15c3Rla3N0aSwgZWkgcGFrb2xsaW5lbiBrZW50dMOkLiAoa29ydHRpIHZvaSBzaXPDpGx0w6TDpCBwZWxrw6RuIGt1dmFuLCBwZWxrw6RuIHRla3N0aW4gdGFpIHNpc8OkbHTDpMOkIGt1dmFuIGphIHRla3N0aW4pIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlZhc3RhdXMiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiS29ydGluIHZhc3RhdXMgKGVpIHBha29sbGluZW4ga2VudHTDpCkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiS3V2YSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJLb3J0aW4ga3V2YSAoZWkgcGFrb2xsaW5lbiBrZW50dMOkKSBLb3J0dGkgdm9pIHNpc8OkbHTDpMOkIHBlbGvDpG4ga3V2YW4sIHBlbGvDpG4gdGVrc3RpbiB0YWkgc2lzw6RsdMOkw6Qga3V2YW4gamEgdGVrc3RpbiIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJBbHRlcm5hdGl2ZSB0ZXh0IGZvciBpbWFnZSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJWaWhqZSIsCiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlZpaGpldGVrc3RpIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkV0ZW5lbWlzdGVrc3RpIiwKICAgICAgImRlZmF1bHQiOiAiS29ydHRpIEBjYXJkIC8gQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkV0ZW5lbWlzdGVrc3RpLCBrw6R5dGV0dMOkdmlzc8OkIG9sZXZhdCBtdXV0dHVqYXQgQGNhcmQgamEgQHRvdGFsIEVzaW1lcmtpa3NpOiAnS29ydHRpIEBjYXJkIC8gQHRvdGFsJyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJTZXVyYWF2YS1wYWluaWtrZWVuIHRla3N0aSIsCiAgICAgICJkZWZhdWx0IjogIlNldXJhYXZhIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRha2Fpc2luLXBhaW5pa2tlZW4gdGVrc3RpIiwKICAgICAgImRlZmF1bHQiOiAiVGFrYWlzaW4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGFya2lzdGEgdmFzdGF1a3NldCAtcGFpbmlra2VlbiB0ZWtzdGkiLAogICAgICAiZGVmYXVsdCI6ICJUYXJraXN0YSB2YXN0YXVrc2V0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlZhYWRpIGvDpHl0dMOkasOkbHTDpCB2YXN0YXVzIGVubmVuIGt1aW4gcmF0a2Fpc3UgbsOkeXRldMOkw6RuLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJWYXN0YXVza2VudMOkbiB0ZWtzdGkiLAogICAgICAiZGVmYXVsdCI6ICJWYXN0YXVrc2VzaSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJPaWtlYW4gdmFzdGF1a3NlbiB0ZWtzdGkiLAogICAgICAiZGVmYXVsdCI6ICJPaWtlaW4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVsOkw6Ryw6RuIHZhc3RhdWtzZW4gdGVrc3RpIiwKICAgICAgImRlZmF1bHQiOiAiVsOkw6RyaW4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTsOkeXTDpCB2YXN0YXVrc2V0IHRla3N0aSIsCiAgICAgICJkZWZhdWx0IjogIk9pa2VhIHZhc3RhdXMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVHVsb2tzZXQgb3RzaWtrbyIsCiAgICAgICJkZWZhdWx0IjogIlR1bG9rc2V0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0aSBvaWtlaW4gc2FhZHVpbGxlIHZhc3RhdWtzaWxsZSIsCiAgICAgICJkZWZhdWx0IjogIkBzY29yZSAvIEB0b3RhbCBvaWtlaW4iLAogICAgICAiZGVzY3JpcHRpb24iOiAidHVsb3N0ZWtzdGksIGvDpHl0ZXR0w6R2aXNzw6Qgb2xldmF0IG11dXR0dWphdDogQHNjb3JlIGphIEB0b3RhbC4gRXNpbWVya2tpOiAnQHNjb3JlIC8gQHRvdGFsIG9pa2VpbiciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTsOkeXTDpCB0dWxva3NldCB0ZWtzdGkiLAogICAgICAiZGVmYXVsdCI6ICJOw6R5dMOkIHR1bG9rc2V0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkx5aHllbiB2YXN0YXVrc2VuIHRla3N0aSIsCiAgICAgICJkZWZhdWx0IjogIkE6IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0aSBcInJldHJ5XCIgcGFpbmlra2VlbGxlIiwKICAgICAgImRlZmF1bHQiOiAiWXJpdMOkIHV1ZGVsbGVlbiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJtZXJra2lrb2tvcmlpcHB1dmFpbmVuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIk3DpMOkcml0dMOkw6QgdHVsZWVrbyB2YXN0YXVrc2VuIG9sbGEgaWRlbnR0aW5lbiBtw6TDpHJpdGVsbHluIHZhc3RhdWtzZW4gbXVrYWlzZXN0aSAoZWxpIGlzb3QgamEgcGllbmV0IGtpcmphaW1ldCBodW9taW9pZGFhbiBqbmUuKSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbmNvcnJlY3QgdGV4dCBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIkluY29ycmVjdCBhbnN3ZXIuIENvcnJlY3QgYW5zd2VyIHdhcyBAYW5zd2VyIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdGhhdCB3aWxsIGJlIGFubm91bmNlZCB0byBhc3Npc3RpdmUgdGVjaG5vbG9naWVzLiBVc2UgQGFuc3dlciBhcyB2YXJpYWJsZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ29ycmVjdCBmZWVkYmFjayB0ZXh0IGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiQGFuc3dlciBpcyBjb3JyZWN0LiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcyB3aGVuIGEgY2FyZCBpcyBhbnN3ZXJlZCBjb3JyZWN0bHkuIFVzZSBAYW5zd2VyIGFzIHZhcmlhYmxlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDYXJkIGNoYW5nZSBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIlBhZ2UgQGN1cnJlbnQgb2YgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdGhhdCB3aWxsIGJlIGFubm91bmNlZCB0byBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIHdoZW4gbmF2aWdhdGluZyBiZXR3ZWVuIGNhcmRzLiBVc2UgQGN1cnJlbnQgYW5kIEB0b3RhbCBhcyB2YXJpYWJsZXMuIgogICAgfQogIF0KfQ=="],"libraries\/H5P.Flashcards-1.5\/language\/fr.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJDb25zaWduZSIKICAgIH0sCiAgICB7CiAgICAgICJ3aWRnZXRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJQYXIgZMOpZmF1dCIKICAgICAgICB9CiAgICAgIF0sCiAgICAgICJsYWJlbCI6ICJDYXJ0ZXMiLAogICAgICAiZW50aXR5IjogImNhcnRlIiwKICAgICAgImZpZWxkIjogewogICAgICAgICJsYWJlbCI6ICJDYXJ0ZSIsCiAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlF1ZXN0aW9uIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIlF1ZXN0aW9uIGZhY3VsdGF0aXZlIHBvdXIgbGEgY2FydGUuIChMYSBjYXJ0ZSBwZXV0IGNvbnRlbmlyIHVuZSBpbWFnZSBzZXVsZSwgdW4gdGV4dGUgc2V1bCBvdSBsZXMgZGV1eCBjb21iaW7DqXMpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlLDqXBvbnNlIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIlLDqXBvbnNlIGZhY3VsdGF0aXZlIChjb3JyZWN0aW9uKSBwb3VyIGxhIGNhcnRlLiIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJJbWFnZSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJJbWFnZSBmYWN1bHRhdGl2ZSBwb3VyIGxhIGNhcnRlLiAoTGEgY2FydGUgcGV1dCBjb250ZW5pciB1bmUgaW1hZ2Ugc2V1bGUsIHVuIHRleHRlIHNldWwgb3UgbGVzIGRldXggY29tYmluw6lzKSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJBbHRlcm5hdGl2ZSB0ZXh0IGZvciBpbWFnZSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJJbmRpY2UiLAogICAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJUZXh0ZSBkZSBsJ2luZGljZSIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0ZSBkZSBwcm9ncmVzc2lvbiIsCiAgICAgICJkZWZhdWx0IjogIkNhcnRlIEBjYXJkIHN1ciBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dGUgZGUgcHJvZ3Jlc3Npb24sIHZhcmlhYmxlcyBwb3NzaWJsZXMgOiBAY2FyZCBldCBAdG90YWwuIChFeGVtcGxlOiAnQ2FydGUgQGNhcmQgc3VyIEB0b3RhbCcpIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRlIHBvdXIgbGUgYm91dG9uIFwiU3VpdmFudFwiIiwKICAgICAgImRlZmF1bHQiOiAiU3VpdmFudCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0ZSBwb3VyIGxlIGJvdXRvbiBcIlByw6ljw6lkZW50XCIiLAogICAgICAiZGVmYXVsdCI6ICJQcsOpY8OpZGVudCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0ZSBwb3VyIGxlIGJvdXRvbiBcIlbDqXJpZmllclwiIiwKICAgICAgImRlZmF1bHQiOiAiVsOpcmlmaWVyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk9ibGlnZXIgbCd1dGlsaXNhdGV1ciDDoCBlbnRyZXIgdW5lIHLDqXBvbnNlIGF2YW50IGRlIHBvdXZvaXIgYWZmaWNoZXIgbGEgY29ycmVjdGlvbiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0ZSBwb3VyIGwnZXNwYWNlIGRlIGxhIHLDqXBvbnNlIiwKICAgICAgImRlZmF1bHQiOiAiVm90cmUgcsOpcG9uc2UiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dGUgcG91ciB1bmUgYm9ubmUgcsOpcG9uc2UiLAogICAgICAiZGVmYXVsdCI6ICJSw6lwb25zZSBleGFjdGUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dGUgcG91ciB1bmUgbWF1dmFpc2UgcsOpcG9uc2UiLAogICAgICAiZGVmYXVsdCI6ICJSw6lwb25zZSBpbmV4YWN0ZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0ZSBwb3VyIGFmZmljaGVyIGxhIHLDqXBvbnNlIGV4YWN0ZSIsCiAgICAgICJkZWZhdWx0IjogIlLDqXBvbnNlIGNvcnJlY3RlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRlIHBvdXIgbCdpbnRpdHVsw6kgZGVzIHLDqXN1bHRhdHMiLAogICAgICAiZGVmYXVsdCI6ICJSw6lzdWx0YXRzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRlIHBvdXIgbGUgbm9tYnJlIGRlIGJvbm5lcyByw6lwb25zZXMiLAogICAgICAiZGVmYXVsdCI6ICJAc2NvcmUgcsOpcG9uc2VzIGNvcnJlY3RlcyBzdXIgdW4gdG90YWwgZGUgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHRlIGRlcyByw6lzdWx0YXRzLCB2YXJpYWJsZXMgZGlzcG9uaWJsZXM6IEBzY29yZSBldCBAdG90YWwuIEV4ZW1wbGU6ICdAc2NvcmUgcsOpcG9uc2VzIGNvcnJlY3RlcyBzdXIgdW4gdG90YWwgZGUgQHRvdGFsJyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0ZSBwb3VyIG1vbnRyZXIgbGVzIHLDqXN1bHRhdHMiLAogICAgICAiZGVmYXVsdCI6ICJNb250cmVyIGxlcyByw6lzdWx0YXRzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRlIHBvdXIgbCdpbnRpdHVsw6kgZGUgcsOpcG9uc2UgY291cnRlIiwKICAgICAgImRlZmF1bHQiOiAiUiA6IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRlIHBvdXIgbGUgYm91dG9uIFwiUmVjb21tZW5jZXJcIiIsCiAgICAgICJkZWZhdWx0IjogIlJlY29tbWVuY2VyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlNlbnNpYmxlIMOgIGxhIGNhc3NlIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlMnYXNzdXJlIHF1ZSBsJ2VudHLDqWUgZGUgbCd1dGlsaXNhdGV1ciBkb2l0IMOqdHJlIGV4YWN0ZW1lbnQgbGEgbcOqbWUgcXVlIGxhIHLDqXBvbnNlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbmNvcnJlY3QgdGV4dCBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIkluY29ycmVjdCBhbnN3ZXIuIENvcnJlY3QgYW5zd2VyIHdhcyBAYW5zd2VyIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdGhhdCB3aWxsIGJlIGFubm91bmNlZCB0byBhc3Npc3RpdmUgdGVjaG5vbG9naWVzLiBVc2UgQGFuc3dlciBhcyB2YXJpYWJsZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ29ycmVjdCBmZWVkYmFjayB0ZXh0IGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiQGFuc3dlciBpcyBjb3JyZWN0LiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcyB3aGVuIGEgY2FyZCBpcyBhbnN3ZXJlZCBjb3JyZWN0bHkuIFVzZSBAYW5zd2VyIGFzIHZhcmlhYmxlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDYXJkIGNoYW5nZSBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIlBhZ2UgQGN1cnJlbnQgb2YgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdGhhdCB3aWxsIGJlIGFubm91bmNlZCB0byBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIHdoZW4gbmF2aWdhdGluZyBiZXR3ZWVuIGNhcmRzLiBVc2UgQGN1cnJlbnQgYW5kIEB0b3RhbCBhcyB2YXJpYWJsZXMuIgogICAgfQogIF0KfQ=="],"libraries\/H5P.Flashcards-1.5\/language\/gl.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZXNjcmljacOzbiBkYSB0YXJlZmEiCiAgICB9LAogICAgewogICAgICAid2lkZ2V0cyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiUG9yIGRlZmVjdG8iCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiVGFyeGV0YXMiLAogICAgICAiZW50aXR5IjogInRhcnhldGEiLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImxhYmVsIjogIlRhcnhldGEiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJQcmVndW50YSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJQcmVndW50YSBkZSB0ZXh0byBvcGNpb25hbCBwYXJhIGEgdGFyeGV0YS4gKEEgdGFyeGV0YSBwb2RlIHVzYXIgc8OzIHVuaGEgaW1heGUsIHPDsyB0ZXh0byBvdSBhbWJvcykiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiUmVzcG9zdGEiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiUmVzcG9zdGEgb3BjaW9uYWwgKHNvbHVjacOzbikgcGFyYSBhIHRhcnhldGEuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkltYXhlIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIkltYXhlIG9wY2lvbmFsIHBhcmEgYSB0YXJ4ZXRhLiAoQSB0YXJ4ZXRhIHBvZGUgdXNhciBzw7MgdW5oYSBpbWF4ZSwgc8OzIHRleHRvIG91IGFtYm9zKSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJUZXh0byBhbHRlcm5hdGl2byBwYXJhIGEgaW1heGUiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiUGlzdGEiLAogICAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJUZXh0byBkYSBwaXN0YSIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBkZSBwcm9ncmVzbyIsCiAgICAgICJkZWZhdWx0IjogIlRhcnhldGEgQGNhcmQgZGUgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHRvIGRlIHByb2dyZXNvOyB2YXJpYWJsZXMgZGlzcG\/DsWlibGVzOiBAY2FyZCBlIEB0b3RhbC4gRXhlbXBsbzogJ1RhcnhldGEgQGNhcmQgZGUgQHRvdGFsJyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIG8gYm90w7NuIHNlZ3VpbnRlIiwKICAgICAgImRlZmF1bHQiOiAiU2VndWludGUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSBvIGJvdMOzbiBhbnRlcmlvciIsCiAgICAgICJkZWZhdWx0IjogIkFudGVyaW9yIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgbyBib3TDs24gY29tcHJvYmFyIHJlc3Bvc3RhcyIsCiAgICAgICJkZWZhdWx0IjogIkNvbXByb2JhciIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJSZXF1ZXJpciByZXNwb3N0YSBkbyB1c3VhcmlvIGFudGVzIGRlIHF1ZSBwb2lkYSB2ZXIgYSBzb2x1Y2nDs24iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSBvIGNhbXBvIGRlIHJlc3Bvc3RhIiwKICAgICAgImRlZmF1bHQiOiAiQSB0w7phIHJlc3Bvc3RhIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgcmVzcG9zdGEgY29ycmVjdGEiLAogICAgICAiZGVmYXVsdCI6ICJDb3JyZWN0byIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIHJlc3Bvc3RhIGluY29ycmVjdGEiLAogICAgICAiZGVmYXVsdCI6ICJJbmNvcnJlY3RhIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgYW1vc2FyIGEgc29sdWNpw7NuIiwKICAgICAgImRlZmF1bHQiOiAiUmVzcG9zdGEgY29ycmVjdGEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSBvIHTDrXR1bG8gZG9zIHJlc3VsdGFkb3MiLAogICAgICAiZGVmYXVsdCI6ICJSZXN1bHRhZG9zIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgbsO6bWVybyBkZSByZXNwb3N0YXMgY29ycmVjdGFzIiwKICAgICAgImRlZmF1bHQiOiAiQHNjb3JlIGRlIEB0b3RhbCBzb24gY29ycmVjdGFzIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHRvIHBhcmEgcmVzdWx0YWRvcywgdmFyaWFibGVzIGRpc3Bvw7FpYmxlczogQHNjb3JlIGUgQHRvdGFsLiBFeGVtcGxvOiAnQHNjb3JlIGRlIEB0b3RhbCBzb24gY29ycmVjdGFzJyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIGFtb3NhciByZXN1bHRhZG9zIiwKICAgICAgImRlZmF1bHQiOiAiQW1vc2FyIHJlc3VsdGFkb3MiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSBldGlxdWV0YSBkZSByZXNwb3N0YSBjdXJ0YSIsCiAgICAgICJkZWZhdWx0IjogIlI6IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgbyBib3TDs24gXCJyZWludGVudGFyXCIiLAogICAgICAiZGVmYXVsdCI6ICJSZWludGVudGFyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkRpZmVyZW5jaWEgZW50cmUgbWFpw7pzY3VsYXMgZSBtaW7DunNjdWxhcyIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJGYWkgcXVlIG8gdGV4dG8gaW50cm9kdWNpZG8gcG9sbyB1c3VhcmlvIHRlw7FhIHF1ZSBzZXIgZXhhY3RhbWVudGUgaWd1YWwgcXVlIGEgcmVzcG9zdGEuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIGRlIHJlc3Bvc3RhIGluY29ycmVjdGEgcGFyYSB0ZWNub2xveMOtYXMgZGUgYXNpc3RlbmNpYSIsCiAgICAgICJkZWZhdWx0IjogIlJlc3Bvc3RhIGluY29ycmVjdGEuIEEgcmVzcG9zdGEgY29ycmVjdGEgZXJhIEBhbnN3ZXIiLAogICAgICAiZGVzY3JpcHRpb24iOiAiTyB0ZXh0byBwYXNhcmFzZSDDoXMgdGVjbm9sb3jDrWFzIGRlIGFzaXN0ZW5jaWEuIFVzYSBAYW5zd2VyIGNvbW8gdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIGRlIHJldHJvYWxpbWVudGFjacOzbiBkZSByZXNwb3N0YSBjb3JyZWN0YSBwYXJhIGFzIHRlY25vbG94w61hcyBkZSBhc2lzdGVuY2lhIiwKICAgICAgImRlZmF1bHQiOiAiQGFuc3dlciDDqSBjb3JyZWN0YS4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dG8gcXVlIHNlIGFudW5jaWFyw6Egw6FzIHRlY25vbG94w61hcyBkZSBhc2lzdGVuY2lhIGNhbmRvIG8gdXN1YXJpbyByZXNwb25kZSBhIHVuaGEgdGFyeGV0YSBjb3JyZWN0YW1lbnRlLiBVc2EgQGFuc3dlciBjb21vIHZhcmlhYmxlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDYW1iaW8gZGUgdGFyeGV0YSBwYXJhIGFzIHRlY25vbG94w61hcyBkZSBhc2lzdGVuY2lhIiwKICAgICAgImRlZmF1bHQiOiAiUMOheGluYSBAY3VycmVudCBkZSBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAiTyB0ZXh0byBwYXNhcmFzZSDDoXMgdGVjbm9sb3jDrWFzIGRlIGFzaXN0ZW5jaWEgY2FuZG8gc2UgbmF2ZWd1ZSBlbnRyZSB0YXJ4ZXRhcy4gVXNhIEBjdXJyZW50IGUgQHRvdGFsIGNvbW8gdmFyaWFibGVzLiIKICAgIH0KICBdCn0K"],"libraries\/H5P.Flashcards-1.5\/language\/he.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLXqteZ15DXldeoINee16nXmdee15QiCiAgICB9LAogICAgewogICAgICAid2lkZ2V0cyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiRGVmYXVsdCIKICAgICAgICB9CiAgICAgIF0sCiAgICAgICJsYWJlbCI6ICJDYXJkcyIsCiAgICAgICJlbnRpdHkiOiAiY2FyZCIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAibGFiZWwiOiAiQ2FyZCIsCiAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlF1ZXN0aW9uIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9wdGlvbmFsIHRleHR1YWwgcXVlc3Rpb24gZm9yIHRoZSBjYXJkLiAoVGhlIGNhcmQgbWF5IHVzZSBqdXN0IGFuIGltYWdlLCBqdXN0IGEgdGV4dCBvciBib3RoKSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJBbnN3ZXIiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAi16rXqdeV15HXlCDXkNek16nXqNeZ16ogKNek16rXqNeV158pINec15vXqNeY15nXoS4iCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiSW1hZ2UiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiT3B0aW9uYWwgaW1hZ2UgZm9yIHRoZSBjYXJkLiAoVGhlIGNhcmQgbWF5IHVzZSBqdXN0IGFuIGltYWdlLCBqdXN0IGEgdGV4dCBvciBib3RoKSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJBbHRlcm5hdGl2ZSB0ZXh0IGZvciBpbWFnZSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICLXmNeZ16QiLAogICAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICLXqteV15vXnyDXmNeZ16QiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUHJvZ3Jlc3MgdGV4dCIsCiAgICAgICJkZWZhdWx0IjogIkNhcmQgQGNhcmQgb2YgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlByb2dyZXNzIHRleHQsIHZhcmlhYmxlcyBhdmFpbGFibGU6IEBjYXJkIGFuZCBAdG90YWwuIEV4YW1wbGU6ICdDYXJkIEBjYXJkIG9mIEB0b3RhbCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIG5leHQgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiTmV4dCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciB0aGUgcHJldmlvdXMgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiUHJldmlvdXMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIGNoZWNrIGFuc3dlcnMgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiQ2hlY2siCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUmVxdWlyZSB1c2VyIGlucHV0IGJlZm9yZSB0aGUgc29sdXRpb24gY2FuIGJlIHZpZXdlZCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciB0aGUgYW5zd2VyIGlucHV0IGZpZWxkIiwKICAgICAgImRlZmF1bHQiOiAiWW91ciBhbnN3ZXIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgY29ycmVjdCBhbnN3ZXIiLAogICAgICAiZGVmYXVsdCI6ICJDb3JyZWN0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIGluY29ycmVjdCBhbnN3ZXIiLAogICAgICAiZGVmYXVsdCI6ICJJbmNvcnJlY3QiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiU2hvdyBzb2x1dGlvbiB0ZXh0IiwKICAgICAgImRlZmF1bHQiOiAiQ29ycmVjdCBhbnN3ZXIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgcmVzdWx0cyB0aXRsZSIsCiAgICAgICJkZWZhdWx0IjogIlJlc3VsdHMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgbnVtYmVyIG9mIGNvcnJlY3QiLAogICAgICAiZGVmYXVsdCI6ICJAc2NvcmUgb2YgQHRvdGFsIGNvcnJlY3QiLAogICAgICAiZGVzY3JpcHRpb24iOiAiUmVzdWx0IHRleHQsIHZhcmlhYmxlcyBhdmFpbGFibGU6IEBzY29yZSBhbmQgQHRvdGFsLiBFeGFtcGxlOiAnQHNjb3JlIG9mIEB0b3RhbCBjb3JyZWN0JyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBzaG93IHJlc3VsdHMiLAogICAgICAiZGVmYXVsdCI6ICJTaG93IHJlc3VsdHMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3Igc2hvcnQgYW5zd2VyIGxhYmVsIiwKICAgICAgImRlZmF1bHQiOiAiQToiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJyZXRyeVwiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlJldHJ5IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNhc2Ugc2Vuc2l0aXZlIiwKICAgICAgImRlc2NyaXB0aW9uIjogIk1ha2VzIHN1cmUgdGhlIHVzZXIgaW5wdXQgaGFzIHRvIGJlIGV4YWN0bHkgdGhlIHNhbWUgYXMgdGhlIGFuc3dlci4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi16rXldeb158g15zXkCDXoNeb15XXnyDXoteR15XXqCDXmNeb16DXldec15XXkteZ15XXqiDXnteh15nXmdei15XXqiIsCiAgICAgICJkZWZhdWx0IjogIteq16nXldeR15Qg15zXkCDXoNeb15XXoNeULiDXlNeq16nXldeR15Qg15TXoNeb15XXoNeUINeU15nXmdeq15QgYW53c2VyQCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLXqteV15vXnyDXmdeV16fXqNeQINeR16fXldecINec15jXm9eg15XXnNeV15LXmdeV16og157XodeZ15nXoteV16ouINeU16nXqtee16nXlSDXkS0gYW5zd2VyQCDXm9ee16nXqteg15QuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNvcnJlY3QgZmVlZGJhY2sgdGV4dCBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIkBhbnN3ZXIgaXMgY29ycmVjdC4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMgd2hlbiBhIGNhcmQgaXMgYW5zd2VyZWQgY29ycmVjdGx5LiBVc2UgQGFuc3dlciBhcyB2YXJpYWJsZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi15TXl9ec16TXqiDXm9eo15jXmdehINei15HXldeoINeY15vXoNeV15zXldeS15nXldeqINee16HXmdeZ16LXldeqIiwKICAgICAgImRlZmF1bHQiOiAi15PXoyBjdXJyZW50QCDXnteq15XXmiB0b3RhbEAiLAogICAgICAiZGVzY3JpcHRpb24iOiAi16rXldeb158g16nXmdeV16fXqNeQINec15jXm9eg15XXnNeV15LXmdeV16og157XodeZ15nXoteV16og15HXoteqINeg15nXldeV15gg15HXmdefINeb16jXmNeZ16HXmdedLiDXlNep16rXntep15Ug15EtIGN1cnJlbnRAINeVLSB0b3RhbEAg15vXntep16rXoNeZ150uIgogICAgfQogIF0KfQ=="],"libraries\/H5P.Flashcards-1.5\/language\/hu.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJUYXNrIGRlc2NyaXB0aW9uIgogICAgfSwKICAgIHsKICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkRlZmF1bHQiCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiQ2FyZHMiLAogICAgICAiZW50aXR5IjogImNhcmQiLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImxhYmVsIjogIkNhcmQiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJRdWVzdGlvbiIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcHRpb25hbCB0ZXh0dWFsIHF1ZXN0aW9uIGZvciB0aGUgY2FyZC4gKFRoZSBjYXJkIG1heSB1c2UganVzdCBhbiBpbWFnZSwganVzdCBhIHRleHQgb3IgYm90aCkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQW5zd2VyIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9wdGlvbmFsIGFuc3dlcihzb2x1dGlvbikgZm9yIHRoZSBjYXJkLiIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJJbWFnZSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcHRpb25hbCBpbWFnZSBmb3IgdGhlIGNhcmQuIChUaGUgY2FyZCBtYXkgdXNlIGp1c3QgYW4gaW1hZ2UsIGp1c3QgYSB0ZXh0IG9yIGJvdGgpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkFsdGVybmF0aXZlIHRleHQgZm9yIGltYWdlIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlRpcCIsCiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlRpcCB0ZXh0IgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlByb2dyZXNzIHRleHQiLAogICAgICAiZGVmYXVsdCI6ICJDYXJkIEBjYXJkIG9mIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJQcm9ncmVzcyB0ZXh0LCB2YXJpYWJsZXMgYXZhaWxhYmxlOiBAY2FyZCBhbmQgQHRvdGFsLiBFeGFtcGxlOiAnQ2FyZCBAY2FyZCBvZiBAdG90YWwnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHRoZSBuZXh0IGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIk5leHQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIHByZXZpb3VzIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlByZXZpb3VzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHRoZSBjaGVjayBhbnN3ZXJzIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIkNoZWNrIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlJlcXVpcmUgdXNlciBpbnB1dCBiZWZvcmUgdGhlIHNvbHV0aW9uIGNhbiBiZSB2aWV3ZWQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIGFuc3dlciBpbnB1dCBmaWVsZCIsCiAgICAgICJkZWZhdWx0IjogIllvdXIgYW5zd2VyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIGNvcnJlY3QgYW5zd2VyIiwKICAgICAgImRlZmF1bHQiOiAiQ29ycmVjdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBpbmNvcnJlY3QgYW5zd2VyIiwKICAgICAgImRlZmF1bHQiOiAiSW5jb3JyZWN0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlNob3cgc29sdXRpb24gdGV4dCIsCiAgICAgICJkZWZhdWx0IjogIkNvcnJlY3QgYW5zd2VyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHJlc3VsdHMgdGl0bGUiLAogICAgICAiZGVmYXVsdCI6ICJSZXN1bHRzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIG51bWJlciBvZiBjb3JyZWN0IiwKICAgICAgImRlZmF1bHQiOiAiQHNjb3JlIG9mIEB0b3RhbCBjb3JyZWN0IiwKICAgICAgImRlc2NyaXB0aW9uIjogIlJlc3VsdCB0ZXh0LCB2YXJpYWJsZXMgYXZhaWxhYmxlOiBAc2NvcmUgYW5kIEB0b3RhbC4gRXhhbXBsZTogJ0BzY29yZSBvZiBAdG90YWwgY29ycmVjdCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3Igc2hvdyByZXN1bHRzIiwKICAgICAgImRlZmF1bHQiOiAiU2hvdyByZXN1bHRzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHNob3J0IGFuc3dlciBsYWJlbCIsCiAgICAgICJkZWZhdWx0IjogIkE6IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIFwicmV0cnlcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJSZXRyeSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDYXNlIHNlbnNpdGl2ZSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJNYWtlcyBzdXJlIHRoZSB1c2VyIGlucHV0IGhhcyB0byBiZSBleGFjdGx5IHRoZSBzYW1lIGFzIHRoZSBhbnN3ZXIuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkluY29ycmVjdCB0ZXh0IGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiSW5jb3JyZWN0IGFuc3dlci4gQ29ycmVjdCBhbnN3ZXIgd2FzIEBhbnN3ZXIiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMuIFVzZSBAYW5zd2VyIGFzIHZhcmlhYmxlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDb3JyZWN0IGZlZWRiYWNrIHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJAYW5zd2VyIGlzIGNvcnJlY3QuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdGhhdCB3aWxsIGJlIGFubm91bmNlZCB0byBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIHdoZW4gYSBjYXJkIGlzIGFuc3dlcmVkIGNvcnJlY3RseS4gVXNlIEBhbnN3ZXIgYXMgdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNhcmQgY2hhbmdlIGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiUGFnZSBAY3VycmVudCBvZiBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMgd2hlbiBuYXZpZ2F0aW5nIGJldHdlZW4gY2FyZHMuIFVzZSBAY3VycmVudCBhbmQgQHRvdGFsIGFzIHZhcmlhYmxlcy4iCiAgICB9CiAgXQp9"],"libraries\/H5P.Flashcards-1.5\/language\/it.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZXNjcml6aW9uZSBkZWwgY29tcGl0byIKICAgIH0sCiAgICB7CiAgICAgICJ3aWRnZXRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJQcmVkZWZpbml0byIKICAgICAgICB9CiAgICAgIF0sCiAgICAgICJsYWJlbCI6ICJTY2hlZGUiLAogICAgICAiZW50aXR5IjogInNjaGVkYSIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAibGFiZWwiOiAiU2NoZWRhIiwKICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiRG9tYW5kYSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJEb21hbmRhIHRlc3R1YWxlIGZhY29sdGF0aXZhIHBlciBsYSBzY2hlZGEgKGxhIHNjaGVkYSBwdcOyIHV0aWxpenphcmUgc29sbyB1bidpbW1hZ2luZSwgc29sbyB1biB0ZXN0byBvIGVudHJhbWJpKSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJSaXNwb3N0YSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJSaXNwb3N0YSAoc29sdXppb25lKSBmYWNvbHRhdGl2YSBwZXIgbGEgc2NoZWRhIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkltbWFnaW5lIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIkltbWFnaW5lIGZhY29sdGF0aXZhIHBlciBsYSBzY2hlZGEgKGxhIHNjaGVkYSBwdcOyIHV0aWxpenphcmUgc29sbyB1bidpbW1hZ2luZSwgc29sbyB1biB0ZXN0byBvIGVudHJhbWJpKSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJUZXN0byBhbHRlcm5hdGl2byBwZXIgbCdpbW1hZ2luZSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJTdWdnZXJpbWVudG8iLAogICAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJUZXN0byBkZWwgc3VnZ2VyaW1lbnRvIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRlc3RvIGRpIGF2YW56YW1lbnRvIiwKICAgICAgImRlZmF1bHQiOiAiU2NoZWRhIEBjYXJkIGRpIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXN0byBkaSBhdmFuemFtZW50bywgdmFyaWFiaWxpIGRpc3BvbmliaWxpOiBAY2FyZCBlIEB0b3RhbC4gRXNlbXBpbzogJ1NjaGVkYSBAY2FyZCBkaSBAdG90YWwnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRlc3RvIHBlciBpbCBwdWxzYW50ZSBcIlByb3NzaW1hXCIiLAogICAgICAiZGVmYXVsdCI6ICJQcm9zc2ltYSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXN0byBwZXIgaWwgcHVsc2FudGUgXCJQcmVjZWRlbnRlXCIiLAogICAgICAiZGVmYXVsdCI6ICJQcmVjZWRlbnRlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRlc3RvIHBlciBpbCBwdWxzYW50ZSBcIlZlcmlmaWNhXCIiLAogICAgICAiZGVmYXVsdCI6ICJWZXJpZmljYSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJSaWNoaWVkZXJlIGwnaW1taXNzaW9uZSBkZWkgZGF0aSBhbGwndXRlbnRlIHByaW1hIGNoZSBsYSBzb2x1emlvbmUgc2lhIHZpc3VhbGl6emF0YSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJNZXNzYWdnaW8gZGVsbGEgY2FzZWxsYSBkaSB0ZXN0byBwZXIgbGEgcmlzcG9zdGEiLAogICAgICAiZGVmYXVsdCI6ICJMYSB0dWEgcmlzcG9zdGEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWVzc2FnZ2lvIHBlciByaXNwb3N0YSBnaXVzdGEiLAogICAgICAiZGVmYXVsdCI6ICJHaXVzdG8iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWVzc2FnZ2lvIHBlciByaXNwb3N0YSBzYmFnbGlhdGEiLAogICAgICAiZGVmYXVsdCI6ICJTYmFnbGlhdG8iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTW9zdHJhIGlsIHRlc3RvIGRlbGxhIHNvbHV6aW9uZSIsCiAgICAgICJkZWZhdWx0IjogIlJpc3Bvc3RhIGdpdXN0YSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUaXRvbG8gZGVsIG1lc3NhZ2dpbyBwZXIgaSByaXN1bHRhdGkiLAogICAgICAiZGVmYXVsdCI6ICJSaXN1bHRhdGkiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWVzc2FnZ2lvIHBlciBpbCBudW1lcm8gZGkgcmlzcG9zdGUgZ2l1c3RlIiwKICAgICAgImRlZmF1bHQiOiAiQHNjb3JlIHN1IEB0b3RhbCBnaXVzdGUiLAogICAgICAiZGVzY3JpcHRpb24iOiAiTWVzc2FnZ2lvIGRlbCByaXN1bHRhdG8sIHZhcmlhYmlsaSBkaXNwb25pYmlsaTogQHNjb3JlIGUgQHRvdGFsLiBFc2VtcGlvOiAnQHNjb3JlIHN1IEB0b3RhbCBnaXVzdGUnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk1lc3NhZ2dpbyBwZXIgbW9zdHJhcmUgaSByaXN1bHRhdGkiLAogICAgICAiZGVmYXVsdCI6ICJNb3N0cmEgaSByaXN1bHRhdGkiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVzdG8gcGVyIGwnZXRpY2hldHRhIGRlbGxhIHJpc3Bvc3RhIGJyZXZlIiwKICAgICAgImRlZmF1bHQiOiAiQToiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVzdG8gcGVyIGlsIHB1bHNhbnRlIFwiUmlwcm92YVwiIiwKICAgICAgImRlZmF1bHQiOiAiUmlwcm92YSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUaWVuaSBjb250byBkaSBtYWl1c2NvbGUgZSBtaW51c2NvbGUiLAogICAgICAiZGVzY3JpcHRpb24iOiAiQWNjZXJ0YXRpIGNoZSBpbCB0ZXN0byBpbW1lc3NvIGRhbGwndXRlbnRlIHNpYSBpZGVudGljbyBhbGxhIHJpc3Bvc3RhIGF0dGVzYSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXN0byBzYmFnbGlhdG8gcGVyIGxlIHRlY25vbG9naWUgYXNzaXN0aXZlIiwKICAgICAgImRlZmF1bHQiOiAiUmlzcG9zdGEgc2JhZ2xpYXRhLiBMYSByaXNwb3N0YSBnaXVzdGEgZXJhIEBhbnN3ZXIiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGVzdG8gcGVyIGxlIHRlY25vbG9naWUgYXNzaXN0aXZlLiBVc2EgQGFuc3dlciBjb21lIHZhcmlhYmlsZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDb3JyZWN0IGZlZWRiYWNrIHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJAYW5zd2VyIGlzIGNvcnJlY3QuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdGhhdCB3aWxsIGJlIGFubm91bmNlZCB0byBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIHdoZW4gYSBjYXJkIGlzIGFuc3dlcmVkIGNvcnJlY3RseS4gVXNlIEBhbnN3ZXIgYXMgdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNhbWJpbyBzY2hlZGEgcGVyIGxlIHRlY25vbG9naWUgYXNzaXN0aXZlIiwKICAgICAgImRlZmF1bHQiOiAiUGFnaW5hIEBjdXJyZW50IGRpIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXN0byBwZXIgbGUgdGVjbm9sb2dpZSBhc3Npc3RpdmUgZHVyYW50ZSBsYSBuYXZpZ2F6aW9uZSB0cmEgc2NoZWRlLiBVc2EgQGN1cnJlbnQgZSBAdG90YWwgY29tZSB2YXJpYWJpbGkiCiAgICB9CiAgXQp9"],"libraries\/H5P.Flashcards-1.5\/language\/ja.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJUYXNrIGRlc2NyaXB0aW9uIgogICAgfSwKICAgIHsKICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkRlZmF1bHQiCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiQ2FyZHMiLAogICAgICAiZW50aXR5IjogImNhcmQiLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImxhYmVsIjogIkNhcmQiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJRdWVzdGlvbiIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcHRpb25hbCB0ZXh0dWFsIHF1ZXN0aW9uIGZvciB0aGUgY2FyZC4gKFRoZSBjYXJkIG1heSB1c2UganVzdCBhbiBpbWFnZSwganVzdCBhIHRleHQgb3IgYm90aCkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQW5zd2VyIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9wdGlvbmFsIGFuc3dlcihzb2x1dGlvbikgZm9yIHRoZSBjYXJkLiIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJJbWFnZSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcHRpb25hbCBpbWFnZSBmb3IgdGhlIGNhcmQuIChUaGUgY2FyZCBtYXkgdXNlIGp1c3QgYW4gaW1hZ2UsIGp1c3QgYSB0ZXh0IG9yIGJvdGgpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkFsdGVybmF0aXZlIHRleHQgZm9yIGltYWdlIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlRpcCIsCiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlRpcCB0ZXh0IgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlByb2dyZXNzIHRleHQiLAogICAgICAiZGVmYXVsdCI6ICJDYXJkIEBjYXJkIG9mIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJQcm9ncmVzcyB0ZXh0LCB2YXJpYWJsZXMgYXZhaWxhYmxlOiBAY2FyZCBhbmQgQHRvdGFsLiBFeGFtcGxlOiAnQ2FyZCBAY2FyZCBvZiBAdG90YWwnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHRoZSBuZXh0IGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIk5leHQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIHByZXZpb3VzIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlByZXZpb3VzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHRoZSBjaGVjayBhbnN3ZXJzIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIkNoZWNrIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlJlcXVpcmUgdXNlciBpbnB1dCBiZWZvcmUgdGhlIHNvbHV0aW9uIGNhbiBiZSB2aWV3ZWQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIGFuc3dlciBpbnB1dCBmaWVsZCIsCiAgICAgICJkZWZhdWx0IjogIllvdXIgYW5zd2VyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIGNvcnJlY3QgYW5zd2VyIiwKICAgICAgImRlZmF1bHQiOiAiQ29ycmVjdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBpbmNvcnJlY3QgYW5zd2VyIiwKICAgICAgImRlZmF1bHQiOiAiSW5jb3JyZWN0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlNob3cgc29sdXRpb24gdGV4dCIsCiAgICAgICJkZWZhdWx0IjogIkNvcnJlY3QgYW5zd2VyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHJlc3VsdHMgdGl0bGUiLAogICAgICAiZGVmYXVsdCI6ICJSZXN1bHRzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIG51bWJlciBvZiBjb3JyZWN0IiwKICAgICAgImRlZmF1bHQiOiAiQHNjb3JlIG9mIEB0b3RhbCBjb3JyZWN0IiwKICAgICAgImRlc2NyaXB0aW9uIjogIlJlc3VsdCB0ZXh0LCB2YXJpYWJsZXMgYXZhaWxhYmxlOiBAc2NvcmUgYW5kIEB0b3RhbC4gRXhhbXBsZTogJ0BzY29yZSBvZiBAdG90YWwgY29ycmVjdCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3Igc2hvdyByZXN1bHRzIiwKICAgICAgImRlZmF1bHQiOiAiU2hvdyByZXN1bHRzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHNob3J0IGFuc3dlciBsYWJlbCIsCiAgICAgICJkZWZhdWx0IjogIkE6IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIFwicmV0cnlcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJSZXRyeSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDYXNlIHNlbnNpdGl2ZSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJNYWtlcyBzdXJlIHRoZSB1c2VyIGlucHV0IGhhcyB0byBiZSBleGFjdGx5IHRoZSBzYW1lIGFzIHRoZSBhbnN3ZXIuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkluY29ycmVjdCB0ZXh0IGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiSW5jb3JyZWN0IGFuc3dlci4gQ29ycmVjdCBhbnN3ZXIgd2FzIEBhbnN3ZXIiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMuIFVzZSBAYW5zd2VyIGFzIHZhcmlhYmxlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDb3JyZWN0IGZlZWRiYWNrIHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJAYW5zd2VyIGlzIGNvcnJlY3QuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdGhhdCB3aWxsIGJlIGFubm91bmNlZCB0byBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIHdoZW4gYSBjYXJkIGlzIGFuc3dlcmVkIGNvcnJlY3RseS4gVXNlIEBhbnN3ZXIgYXMgdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNhcmQgY2hhbmdlIGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiUGFnZSBAY3VycmVudCBvZiBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMgd2hlbiBuYXZpZ2F0aW5nIGJldHdlZW4gY2FyZHMuIFVzZSBAY3VycmVudCBhbmQgQHRvdGFsIGFzIHZhcmlhYmxlcy4iCiAgICB9CiAgXQp9"],"libraries\/H5P.Flashcards-1.5\/language\/ka.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLhg5Phg5Dhg5Xhg5Dhg5rhg5Thg5Hhg5jhg6Eg4YOQ4YOm4YOs4YOU4YOg4YOQIgogICAgfSwKICAgIHsKICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIuGDnOGDkOGDkuGDo+GDmuGDmOGDoeGDruGDm+GDlOGDleGDmCIKICAgICAgICB9CiAgICAgIF0sCiAgICAgICJsYWJlbCI6ICLhg5Hhg5Dhg6Dhg5Dhg5fhg5Thg5Hhg5giLAogICAgICAiZW50aXR5IjogIuGDkeGDkOGDoOGDkOGDl+GDmCIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAibGFiZWwiOiAi4YOR4YOQ4YOg4YOQ4YOX4YOYIiwKICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAi4YOZ4YOY4YOX4YOu4YOV4YOQIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIuGDkOGDoOGDkOGDkOGDo+GDquGDmOGDmuGDlOGDkeGDlOGDmuGDmCDhg5nhg5jhg5fhg67hg5Xhg5Ag4YOR4YOQ4YOg4YOQ4YOX4YOY4YOh4YOX4YOV4YOY4YOhLiAo4YOo4YOU4YOY4YOr4YOa4YOU4YOR4YOQIOGDm+GDruGDneGDmuGDneGDkyDhg5Lhg5Dhg5vhg53hg6Hhg5Dhg67hg6Phg5rhg5Thg5Hhg5Ag4YOS4YOQ4YOb4YOd4YOY4YOn4YOU4YOc4YOd4YOXLCDhg5vhg67hg53hg5rhg53hg5Mg4YOi4YOU4YOl4YOh4YOi4YOYIOGDkOGDnCDhg53hg6Dhg5jhg5Xhg5Qg4YOU4YOg4YOX4YOQ4YOTKSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICLhg57hg5Dhg6Hhg6Phg67hg5giLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAi4YOe4YOQ4YOh4YOj4YOu4YOYIOGDkOGDnCDhg5Dhg5vhg53hg67hg6Hhg5zhg5Ag4YOR4YOQ4YOg4YOQ4YOX4YOY4YOh4YOX4YOV4YOY4YOhLiIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICLhg5Lhg5Dhg5vhg53hg6Hhg5Dhg67hg6Phg5rhg5Thg5Hhg5AiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAi4YOQ4YOg4YOQ4YOQ4YOj4YOq4YOY4YOa4YOU4YOR4YOU4YOa4YOYIOGDkuGDkOGDm+GDneGDoeGDkOGDruGDo+GDmuGDlOGDkeGDkCDhg5Hhg5Dhg6Dhg5Dhg5fhg5jhg6Hhg5fhg5Xhg5jhg6EuICjhg6jhg5Thg5jhg6vhg5rhg5Thg5Hhg5Ag4YOb4YOu4YOd4YOa4YOd4YOTIOGDkuGDkOGDm+GDneGDoeGDkOGDruGDo+GDmuGDlOGDkeGDkCDhg5Lhg5Dhg5vhg53hg5jhg6fhg5Thg5zhg53hg5csIOGDm+GDruGDneGDmuGDneGDkyDhg6Lhg5Thg6Xhg6Hhg6Lhg5gg4YOQ4YOcIOGDneGDoOGDmOGDleGDlCDhg5Thg6Dhg5fhg5Dhg5MpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIuGDkOGDmuGDouGDlOGDoOGDnOGDkOGDouGDmOGDo+GDmuGDmCDhg6Lhg5Thg6Xhg6Hhg6Lhg5gg4YOS4YOQ4YOb4YOd4YOh4YOQ4YOu4YOj4YOa4YOU4YOR4YOY4YOh4YOX4YOV4YOY4YOhIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIuGDmeGDkOGDoOGDnOGDkOGDruGDmCIsCiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIuGDmeGDkOGDoOGDnOGDkOGDruGDmOGDoSDhg6Lhg5Thg6Xhg6Hhg6Lhg5giCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4YOe4YOg4YOd4YOS4YOg4YOU4YOh4YOY4YOhIOGDouGDlOGDpeGDoeGDouGDmCIsCiAgICAgICJkZWZhdWx0IjogIkBjYXJkIOGDkeGDkOGDoOGDkOGDl+GDmCBAdG90YWwt4YOT4YOQ4YOcIiwKICAgICAgImRlc2NyaXB0aW9uIjogIuGDnuGDoOGDneGDkuGDoOGDlOGDoeGDmOGDoSDhg6Lhg5Thg6Xhg6Hhg6Lhg5gsIOGDruGDlOGDmuGDm+GDmOGDoeGDkOGDrOGDleGDk+GDneGDm+GDmCDhg6rhg5Xhg5rhg5Dhg5Phg5Thg5Hhg5g6IEBjYXJkIOGDk+GDkCBAdG90YWwuIOGDm+GDkOGDkuGDkOGDmuGDmOGDl+GDmDogJ0BjYXJkIOGDkeGDkOGDoOGDkOGDl+GDmCBAdG90YWwt4YOT4YOQ4YOcJyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLhg6Lhg5Thg6Xhg6Hhg6Lhg5gg4YOm4YOY4YOa4YOQ4YOZ4YOY4YOh4YOX4YOV4YOY4YOhICfhg6jhg5Thg5vhg5Phg5Thg5Lhg5gnIiwKICAgICAgImRlZmF1bHQiOiAi4YOo4YOU4YOb4YOT4YOU4YOS4YOYIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuGDouGDlOGDpeGDoeGDouGDmCDhg6bhg5jhg5rhg5Dhg5nhg5jhg6Hhg5fhg5Xhg5jhg6EgJ+GDo+GDmeGDkOGDnCciLAogICAgICAiZGVmYXVsdCI6ICLhg6Phg5nhg5Dhg5wiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4YOi4YOU4YOl4YOh4YOi4YOYIOGDpuGDmOGDmuGDkOGDmeGDmOGDoeGDl+GDleGDmOGDoSAn4YOo4YOU4YOb4YOd4YOs4YOb4YOU4YOR4YOQJyIsCiAgICAgICJkZWZhdWx0IjogIuGDqOGDlOGDm+GDneGDrOGDm+GDlOGDkeGDkCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLhg5vhg53hg5vhg67hg5vhg5Dhg6Dhg5Thg5Hhg5rhg5jhg6Hhg5Lhg5Dhg5wg4YOe4YOQ4YOh4YOj4YOu4YOY4YOhIOGDm+GDneGDl+GDruGDneGDleGDnOGDkCDhg5vhg5Dhg5zhg5Dhg5ssIOGDoeGDkOGDnOGDkOGDmyDhg5Dhg5vhg53hg67hg6Hhg5zhg5Ag4YOY4YOl4YOc4YOU4YOR4YOQIOGDnOGDkOGDqeGDleGDlOGDnOGDlOGDkeGDmCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLhg6Lhg5Thg6Xhg6Hhg6Lhg5gg4YOe4YOQ4YOh4YOj4YOu4YOY4YOhIOGDleGDlOGDmuGDmOGDoeGDl+GDleGDmOGDoSIsCiAgICAgICJkZWZhdWx0IjogIuGDnuGDkOGDoeGDo+GDruGDmCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLhg6Lhg5Thg6Xhg6Hhg6Lhg5gg4YOh4YOs4YOd4YOg4YOYIOGDnuGDkOGDoeGDo+GDruGDmOGDoeGDl+GDleGDmOGDoSIsCiAgICAgICJkZWZhdWx0IjogIuGDoeGDrOGDneGDoOGDmOGDkCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLhg6Lhg5Thg6Xhg6Hhg6Lhg5gg4YOQ4YOg4YOQ4YOh4YOs4YOd4YOg4YOYIOGDnuGDkOGDoeGDo+GDruGDmOGDoeGDl+GDleGDmOGDoSIsCiAgICAgICJkZWZhdWx0IjogIuGDqOGDlOGDquGDk+GDneGDm+GDkCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLhg5Dhg5vhg53hg67hg6Hhg5zhg5jhg6Eg4YOp4YOV4YOU4YOc4YOU4YOR4YOY4YOhIOGDouGDlOGDpeGDoeGDouGDmCIsCiAgICAgICJkZWZhdWx0IjogIuGDkOGDm+GDneGDruGDoeGDnOGDmOGDoSDhg6nhg5Xhg5Thg5zhg5Thg5Hhg5AiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4YOi4YOU4YOl4YOh4YOi4YOYIOGDqOGDlOGDk+GDlOGDkuGDlOGDkeGDmOGDoeGDl+GDleGDmOGDoSIsCiAgICAgICJkZWZhdWx0IjogIuGDqOGDlOGDk+GDlOGDkuGDmCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLhg6Lhg5Thg6Xhg6Hhg6Lhg5gg4YOh4YOs4YOd4YOg4YOYIOGDnuGDkOGDoeGDo+GDruGDlOGDkeGDmOGDoSDhg6Dhg5Dhg53hg5Phg5Thg5zhg53hg5Hhg5jhg6Hhg5fhg5Xhg5jhg6EiLAogICAgICAiZGVmYXVsdCI6ICJAc2NvcmUg4YOl4YOj4YOa4YOQIEB0b3RhbC3hg5Phg5Dhg5wiLAogICAgICAiZGVzY3JpcHRpb24iOiAi4YOo4YOU4YOT4YOU4YOS4YOU4YOR4YOY4YOhIOGDouGDlOGDpeGDoeGDouGDmCwg4YOu4YOU4YOa4YOb4YOY4YOh4YOQ4YOs4YOV4YOT4YOd4YOb4YOYIOGDquGDleGDmuGDkOGDk+GDlOGDkeGDmDogQHNjb3JlIOGDk+GDkCBAdG90YWwuIOGDm+GDkOGDkuGDkOGDmuGDmOGDl+GDmDogJ0BzY29yZSDhg6Xhg6Phg5rhg5AgQHRvdGFsLeGDk+GDkOGDnCDhg6Hhg6zhg53hg6Dhg5jhg5AnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuGDouGDlOGDpeGDoeGDouGDmCDhg6jhg5Thg5Phg5Thg5Lhg5Thg5Hhg5jhg6Eg4YOp4YOV4YOU4YOc4YOU4YOR4YOY4YOh4YOX4YOV4YOY4YOhIiwKICAgICAgImRlZmF1bHQiOiAi4YOo4YOU4YOT4YOU4YOS4YOY4YOhIOGDqeGDleGDlOGDnOGDlOGDkeGDkCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLhg6Lhg5Thg6Xhg6Hhg6Lhg5gg4YOb4YOd4YOZ4YOa4YOUIOGDnuGDkOGDoeGDo+GDruGDmOGDoeGDl+GDleGDmOGDoSIsCiAgICAgICJkZWZhdWx0IjogIuGDnjoiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4YOi4YOU4YOl4YOh4YOi4YOYIOGDpuGDmOGDmuGDkOGDmeGDmOGDoeGDl+GDleGDmOGDoSBcIuGDkuGDkOGDm+GDlOGDneGDoOGDlOGDkeGDkFwiIiwKICAgICAgImRlZmF1bHQiOiAi4YOS4YOQ4YOb4YOU4YOd4YOg4YOU4YOR4YOQIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuGDoeGDmOGDluGDo+GDoeGDouGDlCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLhg5vhg53hg5vhg67hg5vhg5Dhg6Dhg5Thg5Hhg5rhg5jhg6Hhg5Lhg5Dhg5wg4YOb4YOd4YOY4YOX4YOu4YOd4YOV4YOhLCDhg6Dhg53hg5sg4YOb4YOd4YOb4YOu4YOb4YOQ4YOg4YOU4YOR4YOa4YOY4YOhIOGDnuGDkOGDoeGDo+GDruGDmCDhg5bhg6Phg6Hhg6Lhg5Dhg5Mg4YOU4YOb4YOX4YOu4YOV4YOU4YOd4YOT4YOU4YOhIOGDnuGDkOGDoeGDo+GDruGDoS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4YOQ4YOg4YOQ4YOh4YOs4YOd4YOg4YOYIOGDnuGDkOGDoeGDo+GDruGDmOGDoSDhg6Lhg5Thg6Xhg6Hhg6Lhg5gg4YOT4YOQ4YOb4YOu4YOb4YOQ4YOg4YOUIOGDouGDlOGDpeGDnOGDneGDmuGDneGDkuGDmOGDlOGDkeGDmOGDoeGDl+GDleGDmOGDoSIsCiAgICAgICJkZWZhdWx0IjogIuGDkOGDoOGDkOGDoeGDrOGDneGDoOGDmCDhg57hg5Dhg6Hhg6Phg67hg5guIOGDoeGDrOGDneGDoOGDmCDhg57hg5Dhg6Hhg6Phg67hg5jhg5AgQGFuc3dlciIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLhg6Lhg5Thg6Xhg6Hhg6Lhg5gsIOGDoOGDneGDm+GDlOGDmuGDoeGDkOGDqiDhg5nhg5jhg5fhg67hg6Phg5rhg53hg5Hhg6Eg4YOT4YOQ4YOb4YOu4YOb4YOQ4YOg4YOUIOGDouGDlOGDpeGDnOGDneGDmuGDneGDkuGDmOGDkC4gQGFuc3dlci3hg5jhg6Eg4YOS4YOQ4YOb4YOd4YOn4YOU4YOc4YOU4YOR4YOQIOGDquGDleGDmuGDkOGDk+GDmOGDoSDhg6Hhg5Dhg67hg5jhg5cuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuGDouGDlOGDpeGDoeGDouGDmCDhg6Hhg6zhg53hg6Ag4YOe4YOQ4YOh4YOj4YOu4YOW4YOUIOGDk+GDkOGDm+GDruGDm+GDkOGDoOGDlCDhg6Lhg5Thg6Xhg5zhg53hg5rhg53hg5Lhg5jhg5Thg5Hhg5jhg6Hhg5fhg5Xhg5jhg6EiLAogICAgICAiZGVmYXVsdCI6ICJAYW5zd2VyIOGDoeGDrOGDneGDoOGDmOGDkC4iLAogICAgICAiZGVzY3JpcHRpb24iOiAi4YOi4YOU4YOl4YOh4YOi4YOYLCDhg6Dhg53hg5vhg5Thg5rhg6Hhg5Dhg6og4YOQ4YOb4YOd4YOY4YOZ4YOY4YOX4YOu4YOQ4YOV4YOhIOGDk+GDkOGDm+GDruGDm+GDkOGDoOGDlCDhg6Lhg5Thg6Xhg5zhg53hg5rhg53hg5Lhg5jhg5Thg5Hhg5gsIOGDoOGDneGDk+GDlOGDoeGDkOGDqiDhg6Hhg6zhg53hg6Dhg5gg4YOe4YOQ4YOh4YOj4YOu4YOYIOGDkuGDkOGDmOGDquGDlOGDm+GDkC4g4YOS4YOQ4YOb4YOd4YOY4YOn4YOU4YOc4YOU4YOXIEBhbnN3ZXIg4YOg4YOd4YOS4YOd4YOg4YOqIOGDquGDleGDmuGDkOGDk+GDmC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4YOR4YOQ4YOg4YOQ4YOX4YOY4YOhIOGDqOGDlOGDquGDleGDmuGDkCDhg5Phg5Dhg5vhg67hg5vhg5Dhg6Dhg5Qg4YOi4YOU4YOl4YOc4YOd4YOa4YOd4YOS4YOY4YOY4YOh4YOX4YOV4YOY4YOhIiwKICAgICAgImRlZmF1bHQiOiAiQGN1cnJlbnQg4YOR4YOQ4YOg4YOQ4YOX4YOYIEB0b3RhbC3hg5Phg5Dhg5wiLAogICAgICAiZGVzY3JpcHRpb24iOiAi4YOi4YOU4YOl4YOh4YOi4YOYLCDhg6Dhg53hg5vhg5Thg5rhg6Hhg5Dhg6og4YOZ4YOY4YOX4YOu4YOj4YOa4YOd4YOR4YOhIOGDk+GDkOGDm+GDruGDm+GDkOGDoOGDlCDhg6Lhg5Thg6Xhg5zhg53hg5rhg53hg5Lhg5jhg5Ag4YOR4YOQ4YOg4YOQ4YOX4YOY4YOhIOGDqOGDlOGDquGDleGDmuGDmOGDoeGDkOGDoS4gQGN1cnJlbnQt4YOY4YOh4YOQIOGDk+GDkCBAdG90YWwt4YOY4YOhIOGDkuGDkOGDm+GDneGDp+GDlOGDnOGDlOGDkeGDkCDhg6rhg5Xhg5rhg5Dhg5Phg5Thg5Hhg5jhg6Eg4YOh4YOQ4YOu4YOY4YOXLiIKICAgIH0KICBdCn0K"],"libraries\/H5P.Flashcards-1.5\/language\/km.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJUYXNrIGRlc2NyaXB0aW9uIgogICAgfSwKICAgIHsKICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkRlZmF1bHQiCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiQ2FyZHMiLAogICAgICAiZW50aXR5IjogImNhcmQiLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImxhYmVsIjogIkNhcmQiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJRdWVzdGlvbiIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcHRpb25hbCB0ZXh0dWFsIHF1ZXN0aW9uIGZvciB0aGUgY2FyZC4gKFRoZSBjYXJkIG1heSB1c2UganVzdCBhbiBpbWFnZSwganVzdCBhIHRleHQgb3IgYm90aCkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQW5zd2VyIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9wdGlvbmFsIGFuc3dlciAoc29sdXRpb24pIGZvciB0aGUgY2FyZC4iCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiSW1hZ2UiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiT3B0aW9uYWwgaW1hZ2UgZm9yIHRoZSBjYXJkLiAoVGhlIGNhcmQgbWF5IHVzZSBqdXN0IGFuIGltYWdlLCBqdXN0IGEgdGV4dCBvciBib3RoKSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJBbHRlcm5hdGl2ZSB0ZXh0IGZvciBpbWFnZSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJUaXAiLAogICAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJUaXAgdGV4dCIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJQcm9ncmVzcyB0ZXh0IiwKICAgICAgImRlZmF1bHQiOiAi4Z6A4Z624Z6PIEBjYXJkIOGeheGfhuGejuGfhOGemCBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAiUHJvZ3Jlc3MgdGV4dCwgdmFyaWFibGVzIGF2YWlsYWJsZTogQGNhcmQgYW5kIEB0b3RhbC4gRXhhbXBsZTogJ0NhcmQgQGNhcmQgb2YgQHRvdGFsJyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciB0aGUgbmV4dCBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICLhnpThnpPhn5LhnpHhnrbhnpThn4siCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIHByZXZpb3VzIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIuGemOGeu+GekyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciB0aGUgY2hlY2sgYW5zd2VycyBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICLhnpbhnrfhnpPhnrfhno\/hn5LhnpnhnoXhnpjhn5Lhnpvhnr7hnpkiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUmVxdWlyZSB1c2VyIGlucHV0IGJlZm9yZSB0aGUgc29sdXRpb24gY2FuIGJlIHZpZXdlZCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciB0aGUgYW5zd2VyIGlucHV0IGZpZWxkIiwKICAgICAgImRlZmF1bHQiOiAi4Z6F4Z6Y4Z+S4Z6b4Z6+4Z6Z4oCL4Z6a4Z6U4Z6f4Z+L4oCL4Z6i4Z+S4Z6T4Z6AIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIGNvcnJlY3QgYW5zd2VyIiwKICAgICAgImRlZmF1bHQiOiAi4Z6P4Z+S4Z6a4Z654Z6Y4Z6P4Z+S4Z6a4Z684Z6cIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIGluY29ycmVjdCBhbnN3ZXIiLAogICAgICAiZGVmYXVsdCI6ICLhnpjhnrfhnpPhno\/hn5Lhnprhnrnhnpjhno\/hn5LhnprhnrzhnpwiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiU2hvdyBzb2x1dGlvbiB0ZXh0IiwKICAgICAgImRlZmF1bHQiOiAi4Z6F4Z6Y4Z+S4Z6b4Z6+4Z6Z4oCL4Z6P4Z+S4Z6a4Z654Z6Y4Z6P4Z+S4Z6a4Z684Z6cIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHJlc3VsdHMgdGl0bGUiLAogICAgICAiZGVmYXVsdCI6ICLhnpvhnpHhn5LhnpLhnpXhnpsiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgbnVtYmVyIG9mIGNvcnJlY3QiLAogICAgICAiZGVmYXVsdCI6ICLhnoXhnpjhn5Lhnpvhnr7hnpkgQHNjb3JlIOGeheGfhuGejuGfhOGemCBAdG90YWwg4Z6P4Z+S4Z6a4Z654Z6Y4Z6P4Z+S4Z6a4Z684Z6cIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlJlc3VsdCB0ZXh0LCB2YXJpYWJsZXMgYXZhaWxhYmxlOiBAc2NvcmUgYW5kIEB0b3RhbC4gRXhhbXBsZTogJ0BzY29yZSBvZiBAdG90YWwgY29ycmVjdCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3Igc2hvdyByZXN1bHRzIiwKICAgICAgImRlZmF1bHQiOiAi4Z6U4Z6E4Z+S4Z6g4Z624Z6J4Z6b4Z6R4Z+S4Z6S4Z6V4Z6bIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHNob3J0IGFuc3dlciBsYWJlbCIsCiAgICAgICJkZWZhdWx0IjogIuGehToiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJyZXRyeVwiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIuGen+GetuGegOGemOGfkuGej+GehOGekeGfgOGejyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDYXNlIHNlbnNpdGl2ZSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJNYWtlcyBzdXJlIHRoZSB1c2VyIGlucHV0IGhhcyB0byBiZSBleGFjdGx5IHRoZSBzYW1lIGFzIHRoZSBhbnN3ZXIuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkluY29ycmVjdCB0ZXh0IGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAi4Z6F4Z6Y4Z+S4Z6b4Z6+4Z6Z4Z6Y4Z634Z6T4Z6P4Z+S4Z6a4Z654Z6Y4Z6P4Z+S4Z6a4Z684Z6c4Z+UIOGeheGemOGfkuGem+GevuGemeGej+GfkuGemuGeueGemOGej+GfkuGemuGevOGenOGeguGeuiBAYW5zd2VyIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdGhhdCB3aWxsIGJlIGFubm91bmNlZCB0byBhc3Npc3RpdmUgdGVjaG5vbG9naWVzLiBVc2UgQGFuc3dlciBhcyB2YXJpYWJsZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ29ycmVjdCBmZWVkYmFjayB0ZXh0IGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiQGFuc3dlciBpcyBjb3JyZWN0LiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcyB3aGVuIGEgY2FyZCBpcyBhbnN3ZXJlZCBjb3JyZWN0bHkuIFVzZSBAYW5zd2VyIGFzIHZhcmlhYmxlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDYXJkIGNoYW5nZSBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIuGekeGfhuGeluGfkOGemiBAY3VycmVudCDhnoXhn4bhno7hn4ThnpggQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdGhhdCB3aWxsIGJlIGFubm91bmNlZCB0byBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIHdoZW4gbmF2aWdhdGluZyBiZXR3ZWVuIGNhcmRzLiBVc2UgQGN1cnJlbnQgYW5kIEB0b3RhbCBhcyB2YXJpYWJsZXMuIgogICAgfQogIF0KfQ=="],"libraries\/H5P.Flashcards-1.5\/language\/ko.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLqs7zsoJwg7ISk66qFIgogICAgfSwKICAgIHsKICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIuq4sOuzuCDshKTsoJUiCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAi7Lm065OcIiwKICAgICAgImVudGl0eSI6ICLsubTrk5wiLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImxhYmVsIjogIuy5tOuTnCIsCiAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIuusuOygnCIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICLsubTrk5zsl5Ag64yA7ZWcIOyEoO2DneyggSDthY3siqTtirgg7KeI66y4KOy5tOuTnOuKlCDsnbTrr7jsp4AsIO2FjeyKpO2KuCDrmJDripQg65GYIOuqqOuRkOulvCDsgqzsmqntlaAg7IiYIOyeiOyKteuLiOuLpC4pIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIuuLtSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICLsubTrk5zsl5Ag64yA7ZWcIOyEoO2DneyggSDtlbTri7UuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIuydtOuvuOyngCIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICLsubTrk5zsl5Ag64yA7ZWcIOyEoO2DneyggSDsnbTrr7jsp4Ao7Lm065Oc64qUIOydtOuvuOyngCwg7YWN7Iqk7Yq4IOuYkOuKlCDrkZgg66qo65GQ66W8IOyCrOyaqe2VoCDsiJgg7J6I7Iq164uI64ukLikiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAi7J2066+47KeA7J2YIOuMgOyytCDthY3siqTtirgiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAi7Z6M7Yq4IiwKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAi7Z6M7Yq4IO2FjeyKpO2KuCIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLsp4Ttlokg7YWN7Iqk7Yq4IiwKICAgICAgImRlZmF1bHQiOiAi7LSdIEB0b3RhbCDspJEgQGNhcmQg7Lm065OcIiwKICAgICAgImRlc2NyaXB0aW9uIjogIuynhO2WiSDthY3siqTtirgsIOyCrOyaqSDqsIDriqXtlZwg67OA7IiYOiDstJ0gQHRvdGFsIOykkSBAY2FyZCDsubTrk5wuIOyYiDogJ+y0nSBAdG90YWwg7KSRIEBjYXJkIOy5tOuTnCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi64uk7J2MIOuyhO2KvOydhCDsnITtlZwg7YWN7Iqk7Yq4IiwKICAgICAgImRlZmF1bHQiOiAi64uk7J2MIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuydtOyghCDrsoTtirzsnYQg7JyE7ZWcIO2FjeyKpO2KuCIsCiAgICAgICJkZWZhdWx0IjogIuydtOyghCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLsoJXri7Ug7ZmV7J24IOuyhO2KvCDthY3siqTtirgiLAogICAgICAiZGVmYXVsdCI6ICLsoJXri7Ug7ZmV7J24IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIu2VtOuLtSDrs7TquLAg7KCE7JeQIOyCrOyaqeyekCDsnoXroKUg7ZWE7JqUIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuuLteuzgCDsnoXroKUg7ZWE65Oc7J2YIO2FjeyKpO2KuCIsCiAgICAgICJkZWZhdWx0IjogIuuLteuzgCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLsoJXri7Ug7YWN7Iqk7Yq4IiwKICAgICAgImRlZmF1bHQiOiAi7KCV64u1IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuyYpOuLtSDthY3siqTtirgiLAogICAgICAiZGVmYXVsdCI6ICLsmKTri7UiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi7ZW064u1IOuztOydtOq4sCDthY3siqTtirgiLAogICAgICAiZGVmYXVsdCI6ICLsoJXri7UiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi6rKw6rO8IOygnOuqqSDthY3siqTtirgiLAogICAgICAiZGVmYXVsdCI6ICLqsrDqs7wiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi7KCV64u1IOyImCDthY3siqTtirgiLAogICAgICAiZGVmYXVsdCI6ICLstJ0gQHRvdGFsIOykkSBAc2NvcmUg7KCQIiwKICAgICAgImRlc2NyaXB0aW9uIjogIuqysOqzvCDthY3siqTtirgsIOydtOyaqeqwgOuKpe2VnCDrs4DsiJg6IOy0nSBAdG90YWwg7KSRIEBzY29yZSDsoJAuIOyYiDogJ+y0nSBAdG90YWwg7KSRIEBzY29yZSDsoJAnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuqysOqzvCDrs7TquLAg7YWN7Iqk7Yq4IiwKICAgICAgImRlZmF1bHQiOiAi6rKw6rO8IOuztOq4sCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLri6jri7Ug66CI7J2067iUIO2FjeyKpO2KuCIsCiAgICAgICJkZWZhdWx0IjogIkE6IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuyerOyLnOuPhCDri6jstpQg7YWN7Iqk7Yq4IiwKICAgICAgImRlZmF1bHQiOiAi7J6s7Iuc64+EIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuuMgOyGjOusuOyekCDqtazrtoQiLAogICAgICAiZGVzY3JpcHRpb24iOiAi7IKs7Jqp7J6QIOyeheugpeydtCDri7Xrs4Dqs7wg7KCV7ZmV7Z6IIOuPmeydvO2VtOyVvCDtlanri4jri6QuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuuztOyhsCDquLDsiKDsl5Ag64yA7ZWcIOyYpOuLtSDthY3siqTtirgiLAogICAgICAiZGVmYXVsdCI6ICLsmKTri7XsnoXri4jri6QuIOygleuLteydgCBAYW5zd2VyIOyeheuLiOuLpC4iLAogICAgICAiZGVzY3JpcHRpb24iOiAi67O07KGwIOq4sOyIoOuhnCDrp5DtlbTsp4DripQg7YWN7Iqk7Yq4LiBAYW5zd2VyIOydhCjrpbwpIOuzgOyImOuhnCDsgqzsmqntlZjshLjsmpQuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuuztOyhsOq4sOyIoOydhCDsnITtlZwg7Jis67CU66W4IOuLteyXkCDrjIDtlZwg7ZS865Oc67CxIiwKICAgICAgImRlZmF1bHQiOiAiQGFuc3dlciDsnbQg7Jis67CU66W4IOuLteyeheuLiOuLpC4iLAogICAgICAiZGVzY3JpcHRpb24iOiAi7Lm065Oc6rCAIOyYrOuwlOultOqyjCDri7XsnbQg65CY7JeI7J2EIOuVjCDrs7TsobDquLDsiKDsnYQg7JyE7ZW0IOyCrOyaqeuQoCDthY3siqTtirguIEBhbnN3ZXIg64qUIOuzgOyImOuhnCDsgqzsmqntlZjshLjsmpQuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuuztOyhsCDquLDsiKDsnYQg7JyE7ZWcIOy5tOuTnCDrs4Dqsr0iLAogICAgICAiZGVmYXVsdCI6ICLstJ0gQHRvdGFsIOykkSDtmITsnqwg7Y6Y7J207KeAIEBjdXJyZW50IiwKICAgICAgImRlc2NyaXB0aW9uIjogIuy5tOuTnOqwhCDsnbTrj5nsl5DshJwg67O07KGwIOq4sOyIoOuhnCDrp5DtlbTsp4DripQg7YWN7Iqk7Yq4LiBAY3VycmVudCDsmYAgQHRvdGFsIOulvCDrs4DsiJjroZwg7IKs7Jqp7ZWY7IS47JqULiIKICAgIH0KICBdCn0K"],"libraries\/H5P.Flashcards-1.5\/language\/lv.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJVemRldnVtYSBhcHJha3N0cyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJLYXJ0xKt0ZSIsCiAgICAgICJlbnRpdHkiOiAia2FydMSrdGUiLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImxhYmVsIjogIkthcnTEq3RlIiwKICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiSmF1dMSBanVtcyIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJOZW9ibGlnxIF0cyBrYXJ0xKt0ZXMgdGVrc3RhIGphdXTEgWp1bXMuIChLYXJ0xKt0ZWkgasSBYsWrdCBhdHTEk2xhbSwgdGlrYWkgdGVrc3RhbSB2YWkgYWJpZW0pIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkF0YmlsZGUiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiTmVvYmxpZ8SBdGEga2FydMSrdGVzIGF0YmlsZGUgKHJpc2luxIFqdW1zKS4iCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQXR0xJNscyIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJOZW9ibGlnxIF0cyBrYXJ0xKt0ZXMgYXR0xJNscy4gKEthcnTEq3RlaSBqxIFixat0IGF0dMSTbGFtLCB0aWthaSB0ZWtzdGFtIHZhaSBhYmllbSkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQWx0ZXJuYXTEq3ZzIGF0dMSTbGEgdGVrc3RzIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlBhZG9tcyIsCiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlBhZG9tYSB0ZWtzdHMiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9LAogICAgICAid2lkZ2V0cyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiUMSTYyBub2tsdXPEk2p1bWEiCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUHJvZ3Jlc2EgdGVrc3RzIiwKICAgICAgImRlZmF1bHQiOiAiS2FydMSrdGUgQGNhcmQgbm8gQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlByb2dyZXNhIHRla3N0cywgcGllZWphbWllIG1haW7Eq2dpZTogQGNhcmQgdW4gQHRvdGFsLiBQaWVtxJNyYW06ICdLYXJ0xKt0ZSBAY2FyZCBubyBAdG90YWwnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlBvZ2FzIFwiVMSBbMSBa1wiIHRla3N0cyIsCiAgICAgICJkZWZhdWx0IjogIlTEgWzEgWsiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUG9nYXMgXCJJZXByaWVrxaHEk2pzXCIgdGVrc3RzIiwKICAgICAgImRlZmF1bHQiOiAiSWVwcmlla8WhxJNqcyIKICAgIH0sCiAgICB7CiAgICAgICJkZWZhdWx0IjogIlDEgXJiYXVkxKt0IiwKICAgICAgImxhYmVsIjogIlBvZ2FzIFwiUMSBcmJhdWTEq3RcIiB0ZWtzdHMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUGllcHJhc8SrdCBsaWV0b3TEgWphIGlldmFkaSBwaXJtcyBhdMS8YXV0cyBza2F0xKt0IHJpc2luxIFqdW11IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkF0YmlsZGVzIGlldmFkZXMgbGF1a2EgdGVrc3RzIiwKICAgICAgImRlZmF1bHQiOiAiSsWrc3UgYXRiaWxkZSIKICAgIH0sCiAgICB7CiAgICAgICJkZWZhdWx0IjogIlBhcmVpemkiLAogICAgICAibGFiZWwiOiAiUGFyZWl6YXMgYXRiaWxkZXMgdGVrc3RzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk5lcGFyZWl6YXMgYXRiaWxkZXMgdGVrc3RzIiwKICAgICAgImRlZmF1bHQiOiAiTmVwYXJlaXppIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlLEgWTEq3QgcmlzaW7EgWp1bWEgdGVrc3R1IiwKICAgICAgImRlZmF1bHQiOiAiUGFyZWl6YSBhdGJpbGRlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlJlenVsdMSBdHUgdmlyc3Jha3N0YSB0ZWtzdHMiLAogICAgICAiZGVmYXVsdCI6ICJSZXp1bHTEgXRpIgogICAgfSwKICAgIHsKICAgICAgImRlZmF1bHQiOiAiQHNjb3JlIG5vIEB0b3RhbCBwYXJlaXppIiwKICAgICAgImxhYmVsIjogIlBhcmVpem8gYXRiaWzFvnUgc2thaXRhIHRla3N0cyIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJSZXp1bHTEgXR1IHRla3N0cywgcGllZWphbWkgbWFpbsSrZ2llOiBAc2NvcmUgdW4gQHRvdGFsLiBQaWVtxJNyczogJ0BzY29yZSBubyBAdG90YWwgcGFyZWl6aSciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUmV6dWx0xIF0dSBhdHNwb2d1xLxvxaFhbmFzIHRla3N0cyIsCiAgICAgICJkZWZhdWx0IjogIlLEgWTEq3QgcmV6dWx0xIF0dXMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAixKpzxIFzIGF0YmlsZGVzIGV0acS3ZXRlcyB0ZWtzdHMiLAogICAgICAiZGVmYXVsdCI6ICJBOiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJQb2dhcyBcIk3Ek8SjaW7EgXQgdsSTbHJlaXpcIiB0ZWtzdHMiLAogICAgICAiZGVmYXVsdCI6ICJNxJPEo2luxIF0IHbEk2xyZWl6IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlJlxKNpc3RyanV0xKtncyIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJOb2Ryb8WhaW5hLCBrYSBsaWV0b3TEgWphIGlldmFkZSBpciB0aWXFoWkgdMSBZGEgcGF0aSBrxIEgYXRiaWxkZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTmVwYXJlaXrEgXMgYXRiaWxkZXMgdGVrc3RzIGFzaXN0xKt2YWrEgW0gdGVobm9sb8SjaWrEgW0iLAogICAgICAiZGVmYXVsdCI6ICJOZXBhcmVpemEgYXRiaWxkZS4gUGFyZWl6xIEgYXRiaWxkZSBiaWphIEBhbnN3ZXIiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGVrc3RzLCBrdXJ1IGF0c2thxYZvcyBhc2lzdMSrdsSBcyB0ZWhub2xvxKNpamFzLiBJem1hbnRvamlldCBAYW5zd2VyIGvEgSBtYWluxKtnby4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUGFyZWl6YXMga2FydMSrdGVzIGF0Z3JpZXplbmlza8SBcyBzYWl0ZXMgdGVrc3RzIGFzaXN0xKt2YWrEgW0gdGVobm9sb8SjaWrEgW0iLAogICAgICAiZGVmYXVsdCI6ICJAYW5zd2VyIGlyIHBhcmVpemEuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRla3N0cywga3VydSBhdHNrYcWGb3MgYXNpc3TEq3bEgXMgdGVobm9sb8SjaWphcyBrYWQga2FydMSrdGUgYXRiaWxkxJN0YSBwYXJlaXppLiBJem1hbnRvamlldCBtYWluxKtnbyBAYW5zd2VyLiIKICAgIH0sCiAgICB7CiAgICAgICJkZWZhdWx0IjogIkxhcGEgQGN1cnJlbnQgbm8gQHRvdGFsIiwKICAgICAgImxhYmVsIjogIkthcnTEq3RlcyBtYWnFhmEgYXNpc3TEq3ZhasSBbSB0ZWhub2xvxKNpasSBbSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZWtzdHMsIGt1cnUgYXRza2HFhm9zIGFzaXN0xKt2xIFzIHRlaG5vbG\/Eo2lqYXMga2FkIHDEgXJ2aWV0b3NpZXMgc3RhcnAga2FydMSrdMSTbS4gSXptYW50b2ppZXQgQGN1cnJlbnQgdW4gQHRvdGFsIGvEgSBtYWluxKtnb3MuIgogICAgfQogIF0KfQo="],"libraries\/H5P.Flashcards-1.5\/language\/nb.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJPcHBnYXZlYmVza3JpdmVsc2UiCiAgICB9LAogICAgewogICAgICAid2lkZ2V0cyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiU3RhbmRhcmQiCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiS29ydCIsCiAgICAgICJlbnRpdHkiOiAia29ydCIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAibGFiZWwiOiAiS29ydCIsCiAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlNww7hyc23DpWwiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiVmFsZ2ZyaXR0IHRla3N0bGlnIHNww7hyc23DpWwuIChLb3J0ZXQga2FuIGlubmVob2xkZSBiaWxkZSwgdGVrc3QgZWxsZXIgYmVnZ2UgZGVsZXIpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlN2YXIiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiVmFsZ2ZyaXR0IHN2YXIoZmFzaXQpIGZvciBrb3J0ZXQuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkJpbGRlIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIlZhbGdmcml0dCBiaWxkZS4gKEtvcnRldCBrYW4gaW5uZWhvbGRlIGJpbGRlLCB0ZWtzdCBlbGxlciBiZWdnZSBkZWxlcikiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQWx0ZXJuYXRpdmUgdGV4dCBmb3IgaW1hZ2UiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiVGlwcyIsCiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlRpcHN0ZWtzdCIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdCBmb3IgZnJlbWRyaWZ0IiwKICAgICAgImRlZmF1bHQiOiAiS29ydCBAY2FyZCBhdiBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGVrc3Qgc29tIGFuZ2lyIGh2aWxrZXQga29ydCBlbiBlciBww6UuIFZhcmlhYmxlciB0aWxnamVuZ2VsaWc6IEBjYXJkIG9nIEB0b3RhbC4gRWtzZW1wZWw6ICdLb3J0IEBjYXJkIGF2IEB0b3RhbCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3QgZm9yIFwiTmVzdGVcIiBrbmFwcGVuIiwKICAgICAgImRlZmF1bHQiOiAiTmVzdGUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3QgZm9yIFwiRm9ycmlnZVwiIGtuYXBwZW4iLAogICAgICAiZGVmYXVsdCI6ICJGb3JyaWdlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0IGZvciBcIlNqZWtrIHN2YXJcIiBrbmFwcGVuIiwKICAgICAgImRlZmF1bHQiOiAiU2pla2siCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiS3JldiBpbm5kYXRhIGZyYSBicnVrZXJlbiBmw7hyIGZhc2l0IGdpcy4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3QgZm9yIFwic3ZhclwiIGZlbHRldCIsCiAgICAgICJkZWZhdWx0IjogIkRpdHQgc3ZhciIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdCBmb3IgcmlrdGlnIHN2YXIiLAogICAgICAiZGVmYXVsdCI6ICJSaWt0aWciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3QgZm9yIGZlaWwgc3ZhciIsCiAgICAgICJkZWZhdWx0IjogIkZlaWwiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3QgZm9yIHZpcyBzdmFyLiIsCiAgICAgICJkZWZhdWx0IjogIlJpa3RpZyBzdmFyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0IGZvciB0aXR0ZWwgcMOlIFJlc3VsdGF0c2tqZXJtIiwKICAgICAgImRlZmF1bHQiOiAiUmVzdWx0YXQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3QgZm9yIGFudGFsbCBrb3JyZWt0IiwKICAgICAgImRlZmF1bHQiOiAiQHNjb3JlIGF2IEB0b3RhbCBrb3JyZWt0IiwKICAgICAgImRlc2NyaXB0aW9uIjogIlJlc3VsdGF0dGVrc3QuIFZhcmlhYmxhciB0aWxnamVuZ2VsaWc6IEBzY29yZSBvZyBAdG90YWwuIEVrc2VtcGVsOiAnQHNjb3JlIGF2IEB0b3RhbCBrb3JyZWt0JyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdCBmb3IgXCJ2aXMgcmVzdWx0YXRlclwiIiwKICAgICAgImRlZmF1bHQiOiAiVmlzIHJlc3VsdGF0ZXIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3QgZm9yIGtvcnQgc3ZhcnRla3N0IiwKICAgICAgImRlZmF1bHQiOiAiUzoiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJyZXRyeVwiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlByw7h2IGlnamVuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNhc2Ugc2Vuc2l0aXZlIiwKICAgICAgImRlc2NyaXB0aW9uIjogIk1ha2VzIHN1cmUgdGhlIHVzZXIgaW5wdXQgaGFzIHRvIGJlIGV4YWN0bHkgdGhlIHNhbWUgYXMgdGhlIGFuc3dlci4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiSW5jb3JyZWN0IHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJJbmNvcnJlY3QgYW5zd2VyLiBDb3JyZWN0IGFuc3dlciB3YXMgQGFuc3dlciIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcy4gVXNlIEBhbnN3ZXIgYXMgdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNvcnJlY3QgZmVlZGJhY2sgdGV4dCBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIkBhbnN3ZXIgaXMgY29ycmVjdC4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMgd2hlbiBhIGNhcmQgaXMgYW5zd2VyZWQgY29ycmVjdGx5LiBVc2UgQGFuc3dlciBhcyB2YXJpYWJsZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2FyZCBjaGFuZ2UgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJQYWdlIEBjdXJyZW50IG9mIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcyB3aGVuIG5hdmlnYXRpbmcgYmV0d2VlbiBjYXJkcy4gVXNlIEBjdXJyZW50IGFuZCBAdG90YWwgYXMgdmFyaWFibGVzLiIKICAgIH0KICBdCn0K"],"libraries\/H5P.Flashcards-1.5\/language\/nl.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJUYWFrb21zY2hyaWp2aW5nIgogICAgfSwKICAgIHsKICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIlN0YW5kYWFyZCIKICAgICAgICB9CiAgICAgIF0sCiAgICAgICJsYWJlbCI6ICJLYWFydGVuIiwKICAgICAgImVudGl0eSI6ICJrYWFydCIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAibGFiZWwiOiAiS2FhcnQiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJWcmFhZyIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJEZSBvcHRpb25lbGUgdnJhYWcgdm9vcm9wIGRlIGthYXJ0LiAoRGUga2FhcnQga2FuIHZvb3J6aWVuIHdvcmRlbiB2YW4gZWVuIGFmYmVlbGRpbmcgZW4vb2YgdGVrc3QpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkFudHdvb3JkIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIkhldCBvcHRpb25lbGUgYW50d29vcmQgKG9wbG9zc2luZykgYWNodGVyb3AgZGUga2FhcnQuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkFmYmVlbGRpbmciLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiRGUgb3B0aW9uZWxlIGFmYmVlbGRpbmcgdm9vcm9wIGRlIGthYXJ0LiAoRGUga2FhcnQga2FuIHZvb3J6aWVuIHdvcmRlbiB2YW4gZWVuIGFmYmVlbGRpbmcgZW4vb2YgdGVrc3QpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkFsdGVybmF0aWV2ZSB0ZWtzdCB2b29yIGFmYmVlbGRpbmciCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiVGlwIiwKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiVGVrc3Qgdm9vciB0aXAiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVm9vcnRnYW5nc3Rla3N0IiwKICAgICAgImRlZmF1bHQiOiAiS2FhcnQgQGNhcmQgdmFuIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJWb29ydGdhbmdzdGVrc3QsIGJlc2NoaWtiYXJlIHZhcmlhYmVsZW46IEBjYXJkIGVuIEB0b3RhbC4gVm9vcmJlZWxkOiAnS2FhcnQgQGNhcmQgdmFuIEB0b3RhbCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3Qgdm9vciBcIlZvbGdlbmRlXCIta25vcCIsCiAgICAgICJkZWZhdWx0IjogIlZvbGdlbmRlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0IHZvb3IgXCJWb3JpZ2VcIi1rbm9wIiwKICAgICAgImRlZmF1bHQiOiAiVm9yaWdlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0IHZvb3IgXCJDb250cm9sZWVyXCIta25vcCIsCiAgICAgICJkZWZhdWx0IjogIkNvbnRyb2xlZXIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiR2VicnVpa2Vyc2ludm9lciBpcyB2ZXJlaXN0LCB2b29yZGF0IGRlIG9wbG9zc2luZyBrYW4gd29yZGVuIGJla2VrZW4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3Qgdm9vciBoZXQgYW50d29vcmQgaW52b2VydmVsZCIsCiAgICAgICJkZWZhdWx0IjogIkplIGFudHdvb3JkIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0IHZvb3IganVpc3QgYW50d29vcmQiLAogICAgICAiZGVmYXVsdCI6ICJKdWlzdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdCB2b29yIG9uanVpc3RlIGFudHdvb3JkIiwKICAgICAgImRlZmF1bHQiOiAiT25qdWlzdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUb29uIHRla3N0IG9wbG9zc2luZyIsCiAgICAgICJkZWZhdWx0IjogIkp1aXN0IGFudHdvb3JkIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRpdGVsIHZvb3IgcmVzdWx0YXRlbiIsCiAgICAgICJkZWZhdWx0IjogIlJlc3VsdGF0ZW4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3Qgdm9vciBhYW50YWwganVpc3QiLAogICAgICAiZGVmYXVsdCI6ICJAc2NvcmUgdmFuIEB0b3RhbCBqdWlzdCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJSZXN1bHRhdGVudGVrc3QsIGJlc2NoaWtiYXJlIHZhcmlhYmVsZW46IEBzY29yZSBlbiBAdG90YWwuIFZvb3JiZWVsZDogJ0BzY29yZSB2YW4gQHRvdGFsIGp1aXN0JyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdCB2b29yIGhldCB0b25lbiB2YW4gZGUgcmVzdWx0YXRlbiIsCiAgICAgICJkZWZhdWx0IjogIlRvb24gcmVzdWx0YXRlbiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdGxhYmVsIHZvb3IgZWVuIGtvcnQgYW50d29vcmQiLAogICAgICAiZGVmYXVsdCI6ICJBOiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdCB2b29yIFwiT3BuaWV1d1wiLWtub3AiLAogICAgICAiZGVmYXVsdCI6ICJPcG5pZXV3IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkhvb2ZkbGV0dGVyZ2V2b2VsaWciLAogICAgICAiZGVzY3JpcHRpb24iOiAiRGUgZ2VicnVpa2Vyc2ludm9lciBkaWVudCBleGFjdCBoZXR6ZWxmZGUgdGUgemlqbiBhbHMgaGV0IGFudHdvb3JkLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJPbmp1aXN0IHRla3N0IHZvb3Igb25kZXJzdGV1bmVuZGUgdGVjaG5vbG9naWXDq24iLAogICAgICAiZGVmYXVsdCI6ICJPbmp1aXN0IGFudHdvb3JkLiBKdWlzdCBhbnR3b29yZCB3YXMgQGFuc3dlciIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZWtzdCBkaWUgd29yZHQgZ2VicnVpa3QgZG9vciBvbmRlcnN0ZXVuZW5kZSB0ZWNobm9sb2dpZcOrbi4gR2VicnVpayBAYW5zd2VyIGFscyB2YXJpYWJlbGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkZlZWRiYWNrIHRla3N0IHZvb3IganVpc3RlIGFudHdvb3JkIHZvb3Igb25kZXJzdGV1bmVuZGUgdGVjaG5vbG9naWXDq24iLAogICAgICAiZGVmYXVsdCI6ICJAYW5zd2VyIGlzIGNvcnJlY3QuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRla3N0IGRpZSB3b3JkdCBhYW5nZWdldmVuIGFhbiBvbmRlcnN0ZXVuZW5kZSB0ZWNobm9sb2dpZcOrbiBhbHMgZWVuIGthYXJ0IGp1aXN0IGlzIGJlYW50d29vcmQuIEdlYnJ1aWsgQGFuc3dlciBhbHMgdmFyaWFiZWxlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJLYWFydCB3aWp6aWdlbiB2b29yIG9uZGVyc3RldW5lbmRlIHRlY2hub2xvZ2llw6tuIiwKICAgICAgImRlZmF1bHQiOiAiUGFnaW5hIEBjdXJyZW50IHZhbiBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGVrc3QgZGllIHdvcmR0IGdlYnJ1aWt0IGRvb3Igb25kZXJzdGV1bmVuZGUgdGVjaG5vbG9naWXDq24gYWxzIHZhbiBrYWFydCB3b3JkdCBnZXdpc3NlbGQuIEdlYnJ1aWsgQGN1cnJlbnQgZW4gQHRvdGFsIGFscyB2YXJpYWJlbGVuLiIKICAgIH0KICBdCn0K"],"libraries\/H5P.Flashcards-1.5\/language\/nn.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJPcHBnw6V2ZWJlc2tyaXZpbmciCiAgICB9LAogICAgewogICAgICAid2lkZ2V0cyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiRGVmYXVsdCIKICAgICAgICB9CiAgICAgIF0sCiAgICAgICJsYWJlbCI6ICJLb3J0IiwKICAgICAgImVudGl0eSI6ICJrb3J0IiwKICAgICAgImZpZWxkIjogewogICAgICAgICJsYWJlbCI6ICJLb3J0IiwKICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiU3DDuHJzbcOlbCIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJWYWxmcml0dCB0ZWtzdGxlZyBzcMO4cnNtw6VsLiAoS29ydGV0IGthbiBpbm5laGFsZGUgYmlsZGUsIHRla3N0LCBlbGxlciBiZWdnZSBkZWxlcikiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiU3ZhciIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJWYWxmcml0dCBzdmFyKGZhc2l0KSBmb3Iga29ydGV0LiIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJCaWxkZSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJWYWxmcml0dCB0ZWtzdGxlZyBzcMO4cnNtw6VsLiAoS29ydGV0IGthbiBpbm5laGFsZGUgYmlsZGUsIHRla3N0LCBlbGxlciBiZWdnZSBkZWxlcikiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQWx0ZXJuYXRpdmUgdGV4dCBmb3IgaW1hZ2UiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiVGlwcyIsCiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlRpcHN0ZWtzdCIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdCBmb3IgZnJhbWRyaWZ0IiwKICAgICAgImRlZmF1bHQiOiAiS29ydCBAY2FyZCBhdiBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGVrc3Qgc29tIHZpc2VyIGt2YSBmb3Iga29ydCBlaW4gZXIgcMOlLiBWYXJpYWJsYXIgdGlsZ2plbmdlbGlnOiBAY2FyZCBvZyBAdG90YWwuIEVrc2VtcGVsOiAnS29ydCBAY2FyZCBhdiBAdG90YWwnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0IGZvciBcIk5lc3RlXCIga25hcHBlbiIsCiAgICAgICJkZWZhdWx0IjogIk5lc3RlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0IGZvciBcIkZvcnJpZ2VcIiBrbmFwcGVuIiwKICAgICAgImRlZmF1bHQiOiAiRsO4cnJlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0IGZvciBcIlNqZWtrIHN2YXJcIiBrbmFwcGVuIiwKICAgICAgImRlZmF1bHQiOiAiU2pla2siCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiS3JldiBpbm5kYXRhIGZyw6UgYnJ1a2FyZW4gZsO4ciBmYXNpdCBibGlyIHZpc3QuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0IGZvciBcInN2YXJcIiBmZWx0ZXQiLAogICAgICAiZGVmYXVsdCI6ICJEaXR0IHN2YXIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3QgZm9yIHJpa3RpZyBzdmFyIiwKICAgICAgImRlZmF1bHQiOiAiUmlrdGlnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0IGZvciBmZWlsIHN2YXIiLAogICAgICAiZGVmYXVsdCI6ICJGZWlsIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0IGZvciB2aXMgc3Zhci4iLAogICAgICAiZGVmYXVsdCI6ICJSaWt0aWcgc3ZhciIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdCBmb3IgdGl0dGVsIHDDpSBSZXN1bHRhdHNramVybSIsCiAgICAgICJkZWZhdWx0IjogIlJlc3VsdGF0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0IGZvciBhbnRhbGwga29ycmVrdCIsCiAgICAgICJkZWZhdWx0IjogIkBzY29yZSBhdiBAdG90YWwga29ycmVrdCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJSZXN1bHRhdHRla3N0LiBWYXJpYWJsYXIgdGlsZ2plbmdlbGlnOiBAc2NvcmUgb2cgQHRvdGFsLiBFa3NlbXBlbDogJ0BzY29yZSBhdiBAdG90YWwga29ycmVrdCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3QgZm9yIFwidmlzIHJlc3VsdGF0YXJcIiIsCiAgICAgICJkZWZhdWx0IjogIlZpcyByZXN1bHRhdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdCBmb3Iga29ydCBzdmFydGVrc3QiLAogICAgICAiZGVmYXVsdCI6ICJTOiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBcInJldHJ5XCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiUHLDuHYgaWdqZW4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2FzZSBzZW5zaXRpdmUiLAogICAgICAiZGVzY3JpcHRpb24iOiAiTWFrZXMgc3VyZSB0aGUgdXNlciBpbnB1dCBoYXMgdG8gYmUgZXhhY3RseSB0aGUgc2FtZSBhcyB0aGUgYW5zd2VyLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbmNvcnJlY3QgdGV4dCBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIkZlaWwgc3Zhci4gRGV0IHJldHRlIHN2YXJldCB2YXIgQGFuc3dlciIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcy4gVXNlIEBhbnN3ZXIgYXMgdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNvcnJlY3QgZmVlZGJhY2sgdGV4dCBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIkBhbnN3ZXIgaXMgY29ycmVjdC4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMgd2hlbiBhIGNhcmQgaXMgYW5zd2VyZWQgY29ycmVjdGx5LiBVc2UgQGFuc3dlciBhcyB2YXJpYWJsZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2FyZCBjaGFuZ2UgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJTaWRlIEBjdXJyZW50IGF2IEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcyB3aGVuIG5hdmlnYXRpbmcgYmV0d2VlbiBjYXJkcy4gVXNlIEBjdXJyZW50IGFuZCBAdG90YWwgYXMgdmFyaWFibGVzLiIKICAgIH0KICBdCn0K"],"libraries\/H5P.Flashcards-1.5\/language\/pl.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJUYXNrIGRlc2NyaXB0aW9uIgogICAgfSwKICAgIHsKICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkRlZmF1bHQiCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiQ2FyZHMiLAogICAgICAiZW50aXR5IjogImNhcmQiLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImxhYmVsIjogIkNhcmQiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJRdWVzdGlvbiIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcHRpb25hbCB0ZXh0dWFsIHF1ZXN0aW9uIGZvciB0aGUgY2FyZC4gKFRoZSBjYXJkIG1heSB1c2UganVzdCBhbiBpbWFnZSwganVzdCBhIHRleHQgb3IgYm90aCkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQW5zd2VyIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9wdGlvbmFsIGFuc3dlcihzb2x1dGlvbikgZm9yIHRoZSBjYXJkLiIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJJbWFnZSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcHRpb25hbCBpbWFnZSBmb3IgdGhlIGNhcmQuIChUaGUgY2FyZCBtYXkgdXNlIGp1c3QgYW4gaW1hZ2UsIGp1c3QgYSB0ZXh0IG9yIGJvdGgpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkFsdGVybmF0aXZlIHRleHQgZm9yIGltYWdlIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlBvZHBvd2llZMW6IiwKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiVGVrc3QgcG9kcG93aWVkemkiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUHJvZ3Jlc3MgdGV4dCIsCiAgICAgICJkZWZhdWx0IjogIkNhcmQgQGNhcmQgb2YgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlByb2dyZXNzIHRleHQsIHZhcmlhYmxlcyBhdmFpbGFibGU6IEBjYXJkIGFuZCBAdG90YWwuIEV4YW1wbGU6ICdDYXJkIEBjYXJkIG9mIEB0b3RhbCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIG5leHQgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiTmV4dCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciB0aGUgcHJldmlvdXMgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiUHJldmlvdXMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIGNoZWNrIGFuc3dlcnMgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiQ2hlY2siCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUmVxdWlyZSB1c2VyIGlucHV0IGJlZm9yZSB0aGUgc29sdXRpb24gY2FuIGJlIHZpZXdlZCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciB0aGUgYW5zd2VyIGlucHV0IGZpZWxkIiwKICAgICAgImRlZmF1bHQiOiAiWW91ciBhbnN3ZXIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgY29ycmVjdCBhbnN3ZXIiLAogICAgICAiZGVmYXVsdCI6ICJDb3JyZWN0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIGluY29ycmVjdCBhbnN3ZXIiLAogICAgICAiZGVmYXVsdCI6ICJJbmNvcnJlY3QiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiU2hvdyBzb2x1dGlvbiB0ZXh0IiwKICAgICAgImRlZmF1bHQiOiAiQ29ycmVjdCBhbnN3ZXIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgcmVzdWx0cyB0aXRsZSIsCiAgICAgICJkZWZhdWx0IjogIlJlc3VsdHMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgbnVtYmVyIG9mIGNvcnJlY3QiLAogICAgICAiZGVmYXVsdCI6ICJAc2NvcmUgb2YgQHRvdGFsIGNvcnJlY3QiLAogICAgICAiZGVzY3JpcHRpb24iOiAiUmVzdWx0IHRleHQsIHZhcmlhYmxlcyBhdmFpbGFibGU6IEBzY29yZSBhbmQgQHRvdGFsLiBFeGFtcGxlOiAnQHNjb3JlIG9mIEB0b3RhbCBjb3JyZWN0JyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBzaG93IHJlc3VsdHMiLAogICAgICAiZGVmYXVsdCI6ICJTaG93IHJlc3VsdHMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3Igc2hvcnQgYW5zd2VyIGxhYmVsIiwKICAgICAgImRlZmF1bHQiOiAiQToiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJyZXRyeVwiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlJldHJ5IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNhc2Ugc2Vuc2l0aXZlIiwKICAgICAgImRlc2NyaXB0aW9uIjogIk1ha2VzIHN1cmUgdGhlIHVzZXIgaW5wdXQgaGFzIHRvIGJlIGV4YWN0bHkgdGhlIHNhbWUgYXMgdGhlIGFuc3dlci4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiSW5jb3JyZWN0IHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJOaWVwcmF3aWTFgm93YSBvZHBvd2llZMW6LiBQcmF3aWTFgm93YSBvZHBvd2llZMW6IHRvIEBhbnN3ZXIiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMuIFVzZSBAYW5zd2VyIGFzIHZhcmlhYmxlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDb3JyZWN0IGZlZWRiYWNrIHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJAYW5zd2VyIGlzIGNvcnJlY3QuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdGhhdCB3aWxsIGJlIGFubm91bmNlZCB0byBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIHdoZW4gYSBjYXJkIGlzIGFuc3dlcmVkIGNvcnJlY3RseS4gVXNlIEBhbnN3ZXIgYXMgdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNhcmQgY2hhbmdlIGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiU3Ryb25hIEBjdXJyZW50IHogQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdGhhdCB3aWxsIGJlIGFubm91bmNlZCB0byBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIHdoZW4gbmF2aWdhdGluZyBiZXR3ZWVuIGNhcmRzLiBVc2UgQGN1cnJlbnQgYW5kIEB0b3RhbCBhcyB2YXJpYWJsZXMuIgogICAgfQogIF0KfQ=="],"libraries\/H5P.Flashcards-1.5\/language\/pt-br.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZXNjcmnDp8OjbyBkYSB0YXJlZmEiCiAgICB9LAogICAgewogICAgICAid2lkZ2V0cyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiUGFkcsOjbyIKICAgICAgICB9CiAgICAgIF0sCiAgICAgICJsYWJlbCI6ICJDYXJ0w7VlcyIsCiAgICAgICJlbnRpdHkiOiAiY2FydMOjbyIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAibGFiZWwiOiAiQ2FydMOjbyIsCiAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlF1ZXN0w6NvIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIlF1ZXN0w6NvIHRleHR1YWwgb3BjaW9uYWwgcGFyYSBvIGNhcnTDo28uIChPIGNhcnTDo28gcG9kZSB1c2FyIGFwZW5hcyB1bWEgaW1hZ2VtLCBhcGVuYXMgdW0gdGV4dG8gb3UgYW1ib3MpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlJlc3Bvc3RhIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIlJlc3Bvc3RhIChzb2x1w6fDo28pIG9wY2lvbmFsIHBhcmEgbyBjYXJ0w6NvLiIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJJbWFnZW0iLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiSW1hZ2VtIG9wY2lvbmFsIHBhcmEgbyBjYXJ0w6NvLiAoTyBjYXJ0w6NvIHBvZGUgdXNhciBhcGVuYXMgdW1hIGltYWdlbSwgYXBlbmFzIHVtIHRleHRvIG91IGFtYm9zKSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJUZXh0byBhbHRlcm5hdGl2byBwYXJhIGEgaW1hZ2VtIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkRpY2EiLAogICAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJUZXh0byBkYSBkaWNhIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIGRvIHByb2dyZXNzbyIsCiAgICAgICJkZWZhdWx0IjogIkNhcnTDo28gQGNhcmQgZGUgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHRvIGRlIHByb2dyZXNzbywgdmFyacOhdmVpcyBkaXNwb27DrXZlaXM6IEBjYXJkIGUgQHRvdGFsLiBFeGVtcGxvOiAnQ2FydMOjbyBAY2FyZCBkZSBAdG90YWwnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgbyBib3TDo28gUHLDs3hpbW8iLAogICAgICAiZGVmYXVsdCI6ICJQcsOzeGltbyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIG8gYm90w6NvIEFudGVyaW9yIiwKICAgICAgImRlZmF1bHQiOiAiQW50ZXJpb3IiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSBvIGJvdMOjbyBWZXJpZmljYXIiLAogICAgICAiZGVmYXVsdCI6ICJWZXJpZmljYXIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUmVxdWVyIHJlc3Bvc3RhIGRvIHVzdcOhcmlvIGFudGVzIGRhIHNvbHXDp8OjbyBwb2RlciBzZXIgdmlzdWFsaXphZGEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSBvIGNhbXBvIGRlIGluc2VyaXIgcmVzcG9zdGEiLAogICAgICAiZGVmYXVsdCI6ICJTdWEgcmVzcG9zdGEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSByZXNwb3N0YSBjb3JyZXRhIiwKICAgICAgImRlZmF1bHQiOiAiQ29ycmV0byIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIHJlc3Bvc3RhIGluY29ycmV0YSIsCiAgICAgICJkZWZhdWx0IjogIkluY29ycmV0byIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBkZSBtb3N0cmFyIHNvbHXDp8OjbyIsCiAgICAgICJkZWZhdWx0IjogIlJlc3Bvc3RhIGNvcnJldGEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gZG8gdMOtdHVsbyBkZSByZXN1bHRhZG9zIiwKICAgICAgImRlZmF1bHQiOiAiUmVzdWx0YWRvcyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIG8gbsO6bWVybyBkZSBjb3JyZXRvcyIsCiAgICAgICJkZWZhdWx0IjogIkBzY29yZSBkZSBAdG90YWwgY29ycmV0b3MiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dG8gZGUgcmVzdWx0YWRvLCB2YXJpw6F2ZWlzIGRpc3BvbsOtdmVpczogQHNjb3JlIGUgQHRvdGFsLiBFeGVtcGxvOiAnQHNjb3JlIGRlIEB0b3RhbCBjb3JyZXRvcyciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSBtb3N0cmFyIHJlc3VsdGFkb3MiLAogICAgICAiZGVmYXVsdCI6ICJNb3N0cmFyIHJlc3VsdGFkb3MiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSByw7N0dWxvIGRlIHJlc3Bvc3RhIGN1cnRhIiwKICAgICAgImRlZmF1bHQiOiAiUjoiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSBvIGJvdMOjbyBcIlRlbnRhciBOb3ZhbWVudGVcIiIsCiAgICAgICJkZWZhdWx0IjogIlRlbnRhciBOb3ZhbWVudGUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRGlmZXJlbmNpYXIgbWFpw7pzY3VsYXMgZSBtaW7DunNjdWxhcyIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJBc3NlZ3VyYSBxdWUgbyB1c3XDoXJpbyBkaWdpdGUgYSBwYWxhdnJhL2ZyYXNlIGV4YXRhbWVudGUgaWd1YWwgw6AgcmVzcG9zdGEuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIGluY29ycmV0byBwYXJhIHRlY25vbG9naWFzIGRlIGFzc2lzdMOqbmNpYSIsCiAgICAgICJkZWZhdWx0IjogIlJlc3Bvc3RhIGluY29ycmV0YS4gQSByZXNwb3N0YSBjb3JyZXRhIGZvaSBAYW5zd2VyIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHRvIHF1ZSBzZXLDoSBhbnVuY2lhZG8gcGFyYSBhcyB0ZWNub2xvZ2lhcyBkZSBhc3Npc3TDqm5jaWEuIFVzZSBAYW5zd2VyIGNvbW8gdmFyacOhdmVsLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBkZSBmZWVkYmFjayBjb3JyZXRvIHBhcmEgdGVjbm9sb2dpYXMgZGUgYXNzaXN0w6puY2lhIiwKICAgICAgImRlZmF1bHQiOiAiQGFuc3dlciBlc3TDoSBjb3JyZXRhLiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0byBxdWUgc2Vyw6EgYW51bmNpYWRvIMOgcyB0ZWNub2xvZ2lhcyBkZSBhc3Npc3TDqm5jaWEgcXVhbmRvIHVtIGNhcnTDo28gZm9yIHJlc3BvbmRpZG8gY29ycmV0YW1lbnRlLiBVc2UgQGFuc3dlciBjb21vIHZhcmnDoXZlbC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVHJvY2EgZGUgY2FydMO1ZXMgcGFyYSB0ZWNub2xvZ2lhcyBkZSBhc3Npc3TDqm5jaWEiLAogICAgICAiZGVmYXVsdCI6ICJQw6FnaW5hIEBjdXJyZW50IGRlIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0byBxdWUgc2Vyw6EgYW51bmNpYWRvIHBhcmEgYXMgdGVjbm9sb2dpYXMgZGUgYXNzaXN0w6puY2lhIG5hIG5hdmVnYcOnw6NvIGVudHJlIGNhcnTDtWVzLiBVc2UgQGN1cnJlbnQgZSBAdG90YWwgY29tbyB2YXJpw6F2ZWlzLiIKICAgIH0KICBdCn0K"],"libraries\/H5P.Flashcards-1.5\/language\/pt.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZXNjcmnDp8OjbyBkYSB0YXJlZmEiCiAgICB9LAogICAgewogICAgICAid2lkZ2V0cyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiRGVmYXVsdCIKICAgICAgICB9CiAgICAgIF0sCiAgICAgICJsYWJlbCI6ICJDYXJ0w7VlcyIsCiAgICAgICJlbnRpdHkiOiAiY2FydMOjbyIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAibGFiZWwiOiAiQ2FydMOjbyIsCiAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlF1ZXN0aW9uIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIlBlcmd1bnRhIHRleHR1YWwgb3BjaW9uYWwgcGFyYSBvIGNhcnTDo28uIChPIGNhcnTDo28gcG9kZSB1dGlsaXphciBhcGVuYXMgdW1hIGltYWdlbSwgYXBlbmFzIHVtIHRleHRvIG91IGFtYm9zKSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJSZXNwb3N0YSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcHRpb25hbCBhbnN3ZXIoc29sdXRpb24pIGZvciB0aGUgY2FyZC4iCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiSW1hZ2UiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiSW1hZ2VtIG9wY2lvbmFsIHBhcmEgbyBjYXJ0w6NvLiAoTyBjYXJ0w6NvIHBvZGUgdXRpbGl6YXIgYXBlbmFzIHVtYSBpbWFnZW0sIGFwZW5hcyB1bSB0ZXh0byBvdSBhbWJvcykiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiVGV4dG8gYWx0ZXJuYXRpdm8gcGFyYSBpbWFnZW0iCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiVGlwIiwKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiVGlwIHRleHQiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUHJvZ3Jlc3MgdGV4dCIsCiAgICAgICJkZWZhdWx0IjogIkNhcnTDo28gQGNhcmQgZGUgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHRvIGRlIHByb2dyZXNzbywgdmFyacOhdmVpcyBkaXNwb27DrXZlaXM6IEBjYXJkIGUgQHRvdGFsLiBFeGVtcGxvOiAnQ2FydMOjbyBAY2FyZCBkZSBAdG90YWwnLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIG8gYm90w6NvIHNlZ3VpbnRlIiwKICAgICAgImRlZmF1bHQiOiAiTmV4dCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIG8gYm90w6NvIGFudGVyaW9yIiwKICAgICAgImRlZmF1bHQiOiAiQW50ZXJpb3IiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSBvIGJvdMOjbyBkZSB2ZXJpZmljYcOnw6NvIGRlIHJlc3Bvc3RhcyIsCiAgICAgICJkZWZhdWx0IjogIlZlcmlmaXF1ZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFeGlnaXIgYSBlbnRyYWRhIGRvIHVzdcOhcmlvIGFudGVzIHF1ZSBhIHNvbHXDp8OjbyBwb3NzYSBzZXIgdmlzdWFsaXphZGEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSBvIGNhbXBvIGRlIGVudHJhZGEgZGUgcmVzcG9zdGFzIiwKICAgICAgImRlZmF1bHQiOiAiU3VhIHJlc3Bvc3RhIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgYSByZXNwb3N0YSBjb3JyZXRhIiwKICAgICAgImRlZmF1bHQiOiAiQ29ycmV0byIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIHJlc3Bvc3RhIGluY29ycmV0YSIsCiAgICAgICJkZWZhdWx0IjogIkluY29ycmV0byIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJNb3N0cmFyIHRleHRvIGRhIHNvbHXDp8OjbyIsCiAgICAgICJkZWZhdWx0IjogIlJlc3Bvc3RhIGNvcnJldGEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSB0w610dWxvIGRlIHJlc3VsdGFkb3MiLAogICAgICAiZGVmYXVsdCI6ICJSZXN1bHRhZG9zIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgbyBuw7ptZXJvIGRlIGNvcnJldG9zIiwKICAgICAgImRlZmF1bHQiOiAiQHNjb3JlIGRlIEB0b3RhbCBjb3JyZXRvcyIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0byBkbyByZXN1bHRhZG8sIHZhcmnDoXZlaXMgZGlzcG9uw612ZWlzOiBAc2NvcmUgZSBAdG90YWwuIEV4ZW1wbG86ICdAc2NvcmUgZGUgQHRvdGFsIGNvcnJldG8nLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIG1vc3RyYXIgcmVzdWx0YWRvcyIsCiAgICAgICJkZWZhdWx0IjogIk1vc3RyYXIgcmVzdWx0YWRvcyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIGV0aXF1ZXRhIGRlIHJlc3Bvc3RhIGN1cnRhIiwKICAgICAgImRlZmF1bHQiOiAiQToiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSBib3TDo28gZGUgXCJyZXBldGlyXCIiLAogICAgICAiZGVmYXVsdCI6ICJSZXBldGlyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkRpZmVyZW5jaWFyIG1hacO6c2N1bGFzIGRlIG1pbsO6c2N1bGFzIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkdhcmFudGUgcXVlIG8gdXRpbGl6YWRvciBkaWdpdGEgbyB0ZXh0byBleGF0YW1lbnRlIGlndWFsIMOgIHJlc3Bvc3RhLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBpbmNvcnJldG8gcGFyYSB0ZWNub2xvZ2lhcyBkZSBhc3Npc3TDqm5jaWEiLAogICAgICAiZGVmYXVsdCI6ICJSZXNwb3N0YSBpbmNvcnJldGEuIEEgcmVzcG9zdGEgY29ycmV0YSBmb2kgQGFuc3dlciIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0byBxdWUgc2Vyw6EgYW51bmNpYWRvIHBhcmEgYXMgdGVjbm9sb2dpYXMgZGUgYXNzaXN0w6puY2lhLiBVc2UgQGFuc3dlciBjb21vIHZhcmnDoXZlbC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gZGUgZmVlZGJhY2sgY29ycmV0byBwYXJhIHRlY25vbG9naWFzIGRlIGFzc2lzdMOqbmNpYSIsCiAgICAgICJkZWZhdWx0IjogIkBhbnN3ZXIgZXN0w6EgY29ycmV0YS4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dG8gcXVlIHNlcsOhIGFudW5jaWFkbyDDoHMgdGVjbm9sb2dpYXMgZGUgYXNzaXN0w6puY2lhIHF1YW5kbyB1bSBjYXJ0w6NvIGZvciByZXNwb25kaWRvIGNvcnJldGFtZW50ZS4gVXNlIEBhbnN3ZXIgY29tbyB2YXJpw6F2ZWwuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk11ZGFuw6dhIGRlIGNhcnTDo28gcGFyYSB0ZWNub2xvZ2lhcyBkZSBhc3Npc3TDqm5jaWEiLAogICAgICAiZGVmYXVsdCI6ICJQw6FnaW5hIEBjdXJyZW50IGRlIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0byBxdWUgc2Vyw6EgYW51bmNpYWRvIMOgcyB0ZWNub2xvZ2lhcyBkZSBhc3Npc3TDqm5jaWEgbmEgbmF2ZWdhw6fDo28gZW50cmUgY2FydMO1ZXMuIFV0aWxpemFyIEBjdXJyZW50IGUgQHRvdGFsIGNvbW8gdmFyacOhdmVpcy4iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Flashcards-1.5\/language\/ro.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJUYXNrIGRlc2NyaXB0aW9uIgogICAgfSwKICAgIHsKICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkRlZmF1bHQiCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiQ2FyZHMiLAogICAgICAiZW50aXR5IjogImNhcmQiLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImxhYmVsIjogIkNhcmQiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJRdWVzdGlvbiIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcHRpb25hbCB0ZXh0dWFsIHF1ZXN0aW9uIGZvciB0aGUgY2FyZC4gKFRoZSBjYXJkIG1heSB1c2UganVzdCBhbiBpbWFnZSwganVzdCBhIHRleHQgb3IgYm90aCkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQW5zd2VyIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9wdGlvbmFsIGFuc3dlcihzb2x1dGlvbikgZm9yIHRoZSBjYXJkLiIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJJbWFnZSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcHRpb25hbCBpbWFnZSBmb3IgdGhlIGNhcmQuIChUaGUgY2FyZCBtYXkgdXNlIGp1c3QgYW4gaW1hZ2UsIGp1c3QgYSB0ZXh0IG9yIGJvdGgpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkFsdGVybmF0aXZlIHRleHQgZm9yIGltYWdlIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlRpcCIsCiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlRpcCB0ZXh0IgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlByb2dyZXNzIHRleHQiLAogICAgICAiZGVmYXVsdCI6ICJDYXJkIEBjYXJkIG9mIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJQcm9ncmVzcyB0ZXh0LCB2YXJpYWJsZXMgYXZhaWxhYmxlOiBAY2FyZCBhbmQgQHRvdGFsLiBFeGFtcGxlOiAnQ2FyZCBAY2FyZCBvZiBAdG90YWwnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHRoZSBuZXh0IGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIk5leHQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIHByZXZpb3VzIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlByZXZpb3VzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHRoZSBjaGVjayBhbnN3ZXJzIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIkNoZWNrIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlJlcXVpcmUgdXNlciBpbnB1dCBiZWZvcmUgdGhlIHNvbHV0aW9uIGNhbiBiZSB2aWV3ZWQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIGFuc3dlciBpbnB1dCBmaWVsZCIsCiAgICAgICJkZWZhdWx0IjogIllvdXIgYW5zd2VyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIGNvcnJlY3QgYW5zd2VyIiwKICAgICAgImRlZmF1bHQiOiAiQ29ycmVjdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBpbmNvcnJlY3QgYW5zd2VyIiwKICAgICAgImRlZmF1bHQiOiAiSW5jb3JyZWN0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlNob3cgc29sdXRpb24gdGV4dCIsCiAgICAgICJkZWZhdWx0IjogIkNvcnJlY3QgYW5zd2VyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHJlc3VsdHMgdGl0bGUiLAogICAgICAiZGVmYXVsdCI6ICJSZXN1bHRzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIG51bWJlciBvZiBjb3JyZWN0IiwKICAgICAgImRlZmF1bHQiOiAiQHNjb3JlIG9mIEB0b3RhbCBjb3JyZWN0IiwKICAgICAgImRlc2NyaXB0aW9uIjogIlJlc3VsdCB0ZXh0LCB2YXJpYWJsZXMgYXZhaWxhYmxlOiBAc2NvcmUgYW5kIEB0b3RhbC4gRXhhbXBsZTogJ0BzY29yZSBvZiBAdG90YWwgY29ycmVjdCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3Igc2hvdyByZXN1bHRzIiwKICAgICAgImRlZmF1bHQiOiAiU2hvdyByZXN1bHRzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHNob3J0IGFuc3dlciBsYWJlbCIsCiAgICAgICJkZWZhdWx0IjogIkE6IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIFwicmV0cnlcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJSZXRyeSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDYXNlIHNlbnNpdGl2ZSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJNYWtlcyBzdXJlIHRoZSB1c2VyIGlucHV0IGhhcyB0byBiZSBleGFjdGx5IHRoZSBzYW1lIGFzIHRoZSBhbnN3ZXIuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkluY29ycmVjdCB0ZXh0IGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiSW5jb3JyZWN0IGFuc3dlci4gQ29ycmVjdCBhbnN3ZXIgd2FzIEBhbnN3ZXIiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMuIFVzZSBAYW5zd2VyIGFzIHZhcmlhYmxlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDb3JyZWN0IGZlZWRiYWNrIHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJAYW5zd2VyIGlzIGNvcnJlY3QuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdGhhdCB3aWxsIGJlIGFubm91bmNlZCB0byBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIHdoZW4gYSBjYXJkIGlzIGFuc3dlcmVkIGNvcnJlY3RseS4gVXNlIEBhbnN3ZXIgYXMgdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNhcmQgY2hhbmdlIGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiUGFnZSBAY3VycmVudCBvZiBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMgd2hlbiBuYXZpZ2F0aW5nIGJldHdlZW4gY2FyZHMuIFVzZSBAY3VycmVudCBhbmQgQHRvdGFsIGFzIHZhcmlhYmxlcy4iCiAgICB9CiAgXQp9"],"libraries\/H5P.Flashcards-1.5\/language\/ru.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLQntC\/0LjRgdCw0L3QuNC1INC30LDQtNCw0YfQuCIKICAgIH0sCiAgICB7CiAgICAgICJ3aWRnZXRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICLQn9C+INGD0LzQvtC70YfQsNC90LjRjiIKICAgICAgICB9CiAgICAgIF0sCiAgICAgICJsYWJlbCI6ICLQmtCw0YDRgtC+0YfQutC4IiwKICAgICAgImVudGl0eSI6ICLQutCw0YDRgtC+0YfQutCwIiwKICAgICAgImZpZWxkIjogewogICAgICAgICJsYWJlbCI6ICLQmtCw0YDRgtC+0YfQutCwIiwKICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAi0JLQvtC\/0YDQvtGBIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogItCd0LXQvtCx0Y\/Qt9Cw0YLQtdC70YzQvdGL0Lkg0LLQvtC\/0YDQvtGBINC00LvRjyDQutCw0YDRgtC+0YfQutC4LiAo0JzQvtC20L3QviDQuNGB0L\/QvtC70YzQt9C+0LLQsNGC0Ywg0YLQvtC70YzQutC+INC40LfQvtCx0YDQsNC20LXQvdC40LUsINGC0L7Qu9GM0LrQviDRgtC10LrRgdGCINC40LvQuCDQvtCx0LAg0L7QtNC90L7QstGA0LXQvNC10L3QvdC+KSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICLQntGC0LLQtdGCIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogItCe0YLQstC10YIg0LjQu9C4INGA0LXRiNC10L3QuNC1INC00LvRjyDQutCw0YDRgtC+0YfQutC4LiIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICLQmNC30L7QsdGA0LDQttC10L3QuNC1IiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogItCd0LXQvtCx0Y\/Qt9Cw0YLQtdC70YzQvdC+0LUg0LjQt9C+0LHRgNCw0LbQtdC90LjQtSDQtNC70Y8g0LrQsNGA0YLQvtGH0LrQuC4gKNCc0L7QttC90L4g0LjRgdC\/0L7Qu9GM0LfQvtCy0LDRgtGMINGC0L7Qu9GM0LrQviDQuNC30L7QsdGA0LDQttC10L3QuNC1LCDRgtC+0LvRjNC60L4g0YLQtdC60YHRgiDQuNC70Lgg0L7QsdCwINC+0LTQvdC+0LLRgNC10LzQtdC90L3QvikiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAi0JDQu9GM0YLQtdGA0L3QsNGC0LjQstC90YvQuSDRgtC10LrRgdGCINCy0LzQtdGB0YLQviDQuNC30L7QsdGA0LDQttC10L3QuNGPIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogItCf0L7QtNGB0LrQsNC30LrQsCIsCiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogItCi0LXQutGB0YIg0L\/QvtC00YHQutCw0LfQutC4IgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0LXQutGB0YIg0L\/RgNC+0LPRgNC10YHRgdCwIiwKICAgICAgImRlZmF1bHQiOiAi0JrQsNGA0YLQvtGH0LrQsCBAY2FyZCDQuNGFIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLQotC10LrRgdGCINC\/0YDQvtCz0YDQtdGB0YHQsCwg0LTQvtGB0YLRg9C\/0L3Ri9C1INC\/0LXRgNC10LzQtdC90L3Ri9C1OiBAY2FyZCDQuCBAdG90YWwuINCf0YDQuNC80LXRgDogJ9Ca0LDRgNGC0L7Rh9C60LAgQGNhcmQg0LjQtyBAdG90YWwnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0LXQutGB0YIg0LTQu9GPINC60L3QvtC\/0LrQuCDQlNCw0LvRjNGI0LUiLAogICAgICAiZGVmYXVsdCI6ICLQlNCw0LvRjNGI0LUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQtNC70Y8g0LrQvdC+0L\/QutC4INCd0LDQt9Cw0LQiLAogICAgICAiZGVmYXVsdCI6ICLQndCw0LfQsNC0ICIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC00LvRjyDQutC90L7Qv9C60Lgg0J\/RgNC+0LLQtdGA0LjRgtGMINGA0LXRiNC10L3QuNC1IiwKICAgICAgImRlZmF1bHQiOiAi0J\/RgNC+0LLQtdGA0LjRgtGMIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0YDQtdCx0L7QstCw0YLRjCDQstCy0L7QtCDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y8g0LTQviDRgtC+0LPQviwg0LrQsNC6INGA0LXRiNC10L3QuNC1INC80L7QttC10YIg0LHRi9GC0Ywg0L\/QvtC60LDQt9Cw0L3QviIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC00LvRjyDQv9C+0LvRjyDQvtGC0LLQtdGC0LAiLAogICAgICAiZGVmYXVsdCI6ICLQntGC0LLQtdGCIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0LXQutGB0YIg0LTQu9GPINC\/0YDQsNCy0LjQu9GM0L3QvtCz0L4g0L7RgtCy0LXRgtCwIiwKICAgICAgImRlZmF1bHQiOiAi0J\/RgNCw0LLQuNC70YzQvdC+IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0LXQutGB0YIg0LTQu9GPINC90LXQv9GA0LDQstC40LvRjNC90L7Qs9C+INC+0YLQstC10YLQsCIsCiAgICAgICJkZWZhdWx0IjogItCd0LXQv9GA0LDQstC40LvRjNC90L4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQv9C+0LrQsNC30LDRgtGMINGA0LXRiNC10L3QuNC1IiwKICAgICAgImRlZmF1bHQiOiAi0L\/QvtC60LDQt9Cw0YLRjCDRgNC10YjQtdC90LjQtSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC00LvRjyDQt9Cw0LPQvtC70L7QstC60LAg0YDQtdC30YPQu9GM0YLQsNGC0L7QsiIsCiAgICAgICJkZWZhdWx0IjogItCg0LXQt9GD0LvRjNGC0LDRgiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC00LvRjyDQutC+0LvQuNGH0LXRgdGC0LLQsCDQv9GA0LDQstC40LvRjNC90YvRhSDQvtGC0LLQtdGC0L7QsiIsCiAgICAgICJkZWZhdWx0IjogItCf0YDQsNCy0LjQu9GM0L3QviBAc2NvcmUg0LjQtyBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAi0KLQtdC60YHRgiDRgNC10LfRg9C70YzRgtCw0YLQvtCyLCDQtNC+0YHRgtGD0L\/QvdGL0LUg0L\/QtdGA0LXQvNC10L3QvdGL0LU6IEBzY29yZSDQuCBAdG90YWwuINCf0YDQuNC80LXRgDogJ0BzY29yZSDQuNC3IEB0b3RhbCDQv9GA0LDQstC40LvRjNC90L4nIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0LXQutGB0YIg0LTQu9GPINC+0YLQutGA0YvRgtC40Y8g0YDQtdC30YPQu9GM0YLQsNGC0L7QsiIsCiAgICAgICJkZWZhdWx0IjogItCf0L7QutCw0LfQsNGC0Ywg0YDQtdC30YPQu9GM0YLQsNGCIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0LXQutGB0YIg0LTQu9GPINGP0YDQu9GL0LrQsCDQutGA0LDRgtC60L7Qs9C+INC+0YLQstC10YLQsCIsCiAgICAgICJkZWZhdWx0IjogIkE6IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0LXQutGB0YIg0LTQu9GPINC60L3QvtC\/0LrQuCBcItC\/0L7QstGC0L7RgNC40YLRjFwiICIsCiAgICAgICJkZWZhdWx0IjogItC\/0L7QstGC0L7RgNC40YLRjCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQp9GD0LLRgdGC0LLQuNGC0LXQu9GM0L3QvtGB0YLRjCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLQotGA0LXQsdGD0LXRgiwg0YfRgtC+0LHRiyDQstCy0L7QtCDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y8g0LIg0YLQvtGH0L3QvtGB0YLQuCDRgdC+0LLQv9Cw0LTQsNC7INGBINC+0YLQstC10YLQvtC8LiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC90LXQv9GA0LDQstC40LvRjNC90L7Qs9C+INC+0YLQstC10YLQsCDQtNC70Y8g0LDRgdGB0LjRgdGC0LjRgNGD0Y7RidC40YUg0YLQtdGF0L3QvtC70L7Qs9C40LgiLAogICAgICAiZGVmYXVsdCI6ICLQndC10L\/RgNCw0LLQuNC70YzQvdGL0Lkg0L7RgtCy0LXRgi4g0J\/RgNCw0LLQuNC70YzQvdGL0Lwg0L7RgtCy0LXRgtC+0Lwg0Y\/QstC70Y\/QtdGC0YHRjyBAYW5zd2VyIiwKICAgICAgImRlc2NyaXB0aW9uIjogItCi0LXQutGB0YIsINC+0LHRitGP0LLQu9GP0LXQvNGL0Lkg0LDRgdGB0LjRgdGC0LjRgNGD0Y7RidC40LzQuCDRgtC10YXQvdC+0LvQvtCz0LjRj9C80LguINCY0YHQv9C+0LvRjNC30L7QstCw0YLRjCBAYW5zd2VyINCyINC60LDRh9C10YHRgtCy0LUg0L\/QtdGA0LXQvNC10L3QvdC+0LkuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNvcnJlY3QgZmVlZGJhY2sgdGV4dCBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIkBhbnN3ZXIgaXMgY29ycmVjdC4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMgd2hlbiBhIGNhcmQgaXMgYW5zd2VyZWQgY29ycmVjdGx5LiBVc2UgQGFuc3dlciBhcyB2YXJpYWJsZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KHQvNC10L3QsCDQutCw0YDRgtC+0YfQutC4INC00LvRjyDQsNGB0YHQuNGB0YLQuNGA0YPRjtGJ0LjRhSDRgtC10YXQvdC+0LvQvtCz0LjQuCIsCiAgICAgICJkZWZhdWx0IjogItCa0LDRgNGC0L7Rh9C60LAgQGN1cnJlbnQg0LjQtyBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAi0KLQtdC60YHRgiwg0L7QsdGK0Y\/QstC70Y\/QtdC80YvQuSDQsNGB0YHQuNGB0YLQuNGA0YPRjtGJ0LjQvNC4INGC0LXRhdC90L7Qu9C+0LPQuNGP0LzQuCDQv9GA0Lgg0YHQvNC10L3QtSDQutCw0YDRgtC+0YfQtdC6LiDQmNGB0L\/QvtC70YzQt9C+0LLQsNGC0YwgQGN1cnJlbnQg0LggQHRvdGFsINCyINC60LDRh9C10YHRgtCy0LUg0L\/QtdGA0LXQvNC10L3QvdGL0YUuIgogICAgfQogIF0KfQ=="],"libraries\/H5P.Flashcards-1.5\/language\/sl.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJOYXZvZGlsbyB1ZGVsZcW+ZW5jZW0iCiAgICB9LAogICAgewogICAgICAid2lkZ2V0cyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiUHJpdnpldG8iCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiS2FydGljZSIsCiAgICAgICJlbnRpdHkiOiAia2FydGljYSIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAibGFiZWwiOiAiS2FydGljYSIsCiAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlZwcmHFoWFuamUiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiTmVvYnZlem5vIHZwcmHFoWFuamUgemEga2FydGljby4gTmEga2FydGljaSBqZSBsYWhrbyBzYW1vIHNsaWthLCBzYW1vIGJlc2VkaWxvIGFsaSBvYm9qZS4iCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiT2Rnb3ZvciIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPZGdvdm9yIG5hIHZwcmHFoWFuamUuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlNsaWthIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIk5lb2J2ZXpuYSBzbGlrYSB6YSBrYXJ0aWNvLiBOYSBrYXJ0aWNpIGplIGxhaGtvIHNhbW8gc2xpa2EsIHNhbW8gYmVzZWRpbG8gYWxpIG9ib2plLiIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJOYWRvbWVzdG5vIGJlc2VkaWxvIHphIHNsaWtvIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIk5hbWlnIiwKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiQmVzZWRpbG8gbmFtaWdhIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkJlc2VkaWxvIG5hcHJlZGthIiwKICAgICAgImRlZmF1bHQiOiAiS2FydGljYSBAY2FyZCBvZCBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAiU3ByZW1lbmxqaXZraSB2IGJlc2VkaWx1IG5hcHJlZGthIHN0YSBAY2FyZCBpbiBAdG90YWwuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkJlc2VkaWxvIHphIGd1bWIgXCJOYXByZWpcIiIsCiAgICAgICJkZWZhdWx0IjogIk5hcHJlaiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZXNlZGlsbyB6YSBndW1iIFwiTmF6YWpcIiIsCiAgICAgICJkZWZhdWx0IjogIk5hemFqIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkJlc2VkaWxvIHphIGd1bWIgXCJQcmV2ZXJpXCIiLAogICAgICAiZGVmYXVsdCI6ICJQcmV2ZXJpIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlByZWQgb2dsZWRvbSByZcWhaXR2ZSBqZSBwb3RyZWJubyBwb2RhdGkgdnNlIG9kZ292b3JlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkJlc2VkaWxvIHphIHBvbGplIHphIHZub3Mgb2Rnb3Zvcm92IiwKICAgICAgImRlZmF1bHQiOiAiT2Rnb3ZvciBuYSB2cHJhxaFhbmplIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkJlc2VkaWxvIHphIHByYXZpbGVuIG9kZ292b3IiLAogICAgICAiZGVmYXVsdCI6ICJQcmF2aWxlbiBvZGdvdm9yIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkJlc2VkaWxvIHphIG5lcHJhdmlsZW4gb2Rnb3ZvciIsCiAgICAgICJkZWZhdWx0IjogIk5lcHJhdmlsZW4gb2Rnb3ZvciIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZXNlZGlsbyB6YSBwcmlrYXogcmXFoWl0dmUiLAogICAgICAiZGVmYXVsdCI6ICJQcmlrYcW+aSByZcWhaXRldiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZXNlZGlsbyB6YSBuYXNsb3YgcmV6dWx0YXRvdiIsCiAgICAgICJkZWZhdWx0IjogIlJlenVsdGF0aSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZXNlZGlsbyB6YSDFoXRldmlsbyBwcmF2aWxuaWgiLAogICAgICAiZGVmYXVsdCI6ICJQcmF2aWxuaWggQHNjb3JlIG9kIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJTcHJlbWVubGppdmtpIHN0YSBAc2NvcmUgaW4gQHRvdGFsLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZXNlZGlsbyB6YSBwcmlrYXogcmV6dWx0YXRvdiIsCiAgICAgICJkZWZhdWx0IjogIlByaWtheiByZXp1bHRhdG92IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkJlc2VkaWxvIHphIG96bmFrbyBrcmF0a2VnYSBvZGdvdm9yYSIsCiAgICAgICJkZWZhdWx0IjogIkE6IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkJlc2VkaWxvIHphIGd1bWIgXCJQb3NrdXNpIHBvbm92bm9cIiIsCiAgICAgICJkZWZhdWx0IjogIlBvc2t1c2kgcG9ub3ZubyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJMb8SNaSB2ZWxpa2UvbWFsZSDEjXJrZSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJSYXpsaWt1amUgbWVkIHphcGlzb20gdiB2ZWxpa2loIGFsaSBtYWxpaCB0aXNrYW5paCDEjXJrYWguIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkJlc2VkaWxvIHphIG5lcHJhdmlsZW4gb2Rnb3ZvciB6YSBicmFsbmlrZSB6YXNsb25hIiwKICAgICAgImRlZmF1bHQiOiAiTmVwcmF2aWxlbiBvZGdvdm9yLiBQcmF2aWxlbiBvZGdvdm9yIGJpIGJpbCBAYW5zd2VyIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkBhbnN3ZXIgamUgc3ByZW1lbmxqaXZrYS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQmVzZWRpbG8gemEgcHJhdmlsZW4gb2Rnb3ZvciB6YSBicmFsbmlrZSB6YXNsb25hIiwKICAgICAgImRlZmF1bHQiOiAiQGFuc3dlciBqZSBwcmF2aWxlbiBvZGdvdm9yLiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJAYW5zd2VyIGplIHNwcmVtZW5saml2a2EuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlNwcmVtZW1iYSBzdGF0dXNhIHByaSBvYnJhxI1hbmp1IGthcnRpY2UgemEgYnJhbG5pa2UgemFzbG9uYSIsCiAgICAgICJkZWZhdWx0IjogIlN0cmFuIEBjdXJyZW50IG9kIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJAY3VycmVudCBpbiBAdG90YWwgc3RhIHNwcmVtZW5saml2a2kuIgogICAgfQogIF0KfQo="],"libraries\/H5P.Flashcards-1.5\/language\/sma.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJUYXNrIGRlc2NyaXB0aW9uIgogICAgfSwKICAgIHsKICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkRlZmF1bHQiCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiQ2FyZHMiLAogICAgICAiZW50aXR5IjogImNhcmQiLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImxhYmVsIjogIkNhcmQiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJRdWVzdGlvbiIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcHRpb25hbCB0ZXh0dWFsIHF1ZXN0aW9uIGZvciB0aGUgY2FyZC4gKFRoZSBjYXJkIG1heSB1c2UganVzdCBhbiBpbWFnZSwganVzdCBhIHRleHQgb3IgYm90aCkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQW5zd2VyIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9wdGlvbmFsIGFuc3dlcihzb2x1dGlvbikgZm9yIHRoZSBjYXJkLiIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJJbWFnZSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcHRpb25hbCBpbWFnZSBmb3IgdGhlIGNhcmQuIChUaGUgY2FyZCBtYXkgdXNlIGp1c3QgYW4gaW1hZ2UsIGp1c3QgYSB0ZXh0IG9yIGJvdGgpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkFsdGVybmF0aXZlIHRleHQgZm9yIGltYWdlIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlRpcCIsCiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlRpcCB0ZXh0IgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlByb2dyZXNzIHRleHQiLAogICAgICAiZGVmYXVsdCI6ICJDYXJkIEBjYXJkIG9mIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJQcm9ncmVzcyB0ZXh0LCB2YXJpYWJsZXMgYXZhaWxhYmxlOiBAY2FyZCBhbmQgQHRvdGFsLiBFeGFtcGxlOiAnQ2FyZCBAY2FyZCBvZiBAdG90YWwnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHRoZSBuZXh0IGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIk5leHQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIHByZXZpb3VzIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlByZXZpb3VzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHRoZSBjaGVjayBhbnN3ZXJzIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIkNoZWNrIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlJlcXVpcmUgdXNlciBpbnB1dCBiZWZvcmUgdGhlIHNvbHV0aW9uIGNhbiBiZSB2aWV3ZWQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIGFuc3dlciBpbnB1dCBmaWVsZCIsCiAgICAgICJkZWZhdWx0IjogIllvdXIgYW5zd2VyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIGNvcnJlY3QgYW5zd2VyIiwKICAgICAgImRlZmF1bHQiOiAiQ29ycmVjdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBpbmNvcnJlY3QgYW5zd2VyIiwKICAgICAgImRlZmF1bHQiOiAiSW5jb3JyZWN0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlNob3cgc29sdXRpb24gdGV4dCIsCiAgICAgICJkZWZhdWx0IjogIkNvcnJlY3QgYW5zd2VyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHJlc3VsdHMgdGl0bGUiLAogICAgICAiZGVmYXVsdCI6ICJSZXN1bHRzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIG51bWJlciBvZiBjb3JyZWN0IiwKICAgICAgImRlZmF1bHQiOiAiQHNjb3JlIG9mIEB0b3RhbCBjb3JyZWN0IiwKICAgICAgImRlc2NyaXB0aW9uIjogIlJlc3VsdCB0ZXh0LCB2YXJpYWJsZXMgYXZhaWxhYmxlOiBAc2NvcmUgYW5kIEB0b3RhbC4gRXhhbXBsZTogJ0BzY29yZSBvZiBAdG90YWwgY29ycmVjdCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3Igc2hvdyByZXN1bHRzIiwKICAgICAgImRlZmF1bHQiOiAiU2hvdyByZXN1bHRzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHNob3J0IGFuc3dlciBsYWJlbCIsCiAgICAgICJkZWZhdWx0IjogIkE6IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIFwicmV0cnlcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJSZXRyeSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDYXNlIHNlbnNpdGl2ZSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJNYWtlcyBzdXJlIHRoZSB1c2VyIGlucHV0IGhhcyB0byBiZSBleGFjdGx5IHRoZSBzYW1lIGFzIHRoZSBhbnN3ZXIuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkluY29ycmVjdCB0ZXh0IGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiSW5jb3JyZWN0IGFuc3dlci4gQ29ycmVjdCBhbnN3ZXIgd2FzIEBhbnN3ZXIiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMuIFVzZSBAYW5zd2VyIGFzIHZhcmlhYmxlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDb3JyZWN0IGZlZWRiYWNrIHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJAYW5zd2VyIGlzIGNvcnJlY3QuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdGhhdCB3aWxsIGJlIGFubm91bmNlZCB0byBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIHdoZW4gYSBjYXJkIGlzIGFuc3dlcmVkIGNvcnJlY3RseS4gVXNlIEBhbnN3ZXIgYXMgdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNhcmQgY2hhbmdlIGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiUGFnZSBAY3VycmVudCBvZiBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMgd2hlbiBuYXZpZ2F0aW5nIGJldHdlZW4gY2FyZHMuIFVzZSBAY3VycmVudCBhbmQgQHRvdGFsIGFzIHZhcmlhYmxlcy4iCiAgICB9CiAgXQp9"],"libraries\/H5P.Flashcards-1.5\/language\/sme.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJUYXNrIGRlc2NyaXB0aW9uIgogICAgfSwKICAgIHsKICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkRlZmF1bHQiCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiQ2FyZHMiLAogICAgICAiZW50aXR5IjogImNhcmQiLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImxhYmVsIjogIkNhcmQiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJRdWVzdGlvbiIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcHRpb25hbCB0ZXh0dWFsIHF1ZXN0aW9uIGZvciB0aGUgY2FyZC4gKFRoZSBjYXJkIG1heSB1c2UganVzdCBhbiBpbWFnZSwganVzdCBhIHRleHQgb3IgYm90aCkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQW5zd2VyIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9wdGlvbmFsIGFuc3dlcihzb2x1dGlvbikgZm9yIHRoZSBjYXJkLiIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJJbWFnZSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcHRpb25hbCBpbWFnZSBmb3IgdGhlIGNhcmQuIChUaGUgY2FyZCBtYXkgdXNlIGp1c3QgYW4gaW1hZ2UsIGp1c3QgYSB0ZXh0IG9yIGJvdGgpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkFsdGVybmF0aXZlIHRleHQgZm9yIGltYWdlIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlRpcCIsCiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlRpcCB0ZXh0IgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlByb2dyZXNzIHRleHQiLAogICAgICAiZGVmYXVsdCI6ICJDYXJkIEBjYXJkIG9mIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJQcm9ncmVzcyB0ZXh0LCB2YXJpYWJsZXMgYXZhaWxhYmxlOiBAY2FyZCBhbmQgQHRvdGFsLiBFeGFtcGxlOiAnQ2FyZCBAY2FyZCBvZiBAdG90YWwnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHRoZSBuZXh0IGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIk5leHQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIHByZXZpb3VzIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlByZXZpb3VzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHRoZSBjaGVjayBhbnN3ZXJzIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIkNoZWNrIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlJlcXVpcmUgdXNlciBpbnB1dCBiZWZvcmUgdGhlIHNvbHV0aW9uIGNhbiBiZSB2aWV3ZWQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIGFuc3dlciBpbnB1dCBmaWVsZCIsCiAgICAgICJkZWZhdWx0IjogIllvdXIgYW5zd2VyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIGNvcnJlY3QgYW5zd2VyIiwKICAgICAgImRlZmF1bHQiOiAiQ29ycmVjdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBpbmNvcnJlY3QgYW5zd2VyIiwKICAgICAgImRlZmF1bHQiOiAiSW5jb3JyZWN0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlNob3cgc29sdXRpb24gdGV4dCIsCiAgICAgICJkZWZhdWx0IjogIkNvcnJlY3QgYW5zd2VyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHJlc3VsdHMgdGl0bGUiLAogICAgICAiZGVmYXVsdCI6ICJSZXN1bHRzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIG51bWJlciBvZiBjb3JyZWN0IiwKICAgICAgImRlZmF1bHQiOiAiQHNjb3JlIG9mIEB0b3RhbCBjb3JyZWN0IiwKICAgICAgImRlc2NyaXB0aW9uIjogIlJlc3VsdCB0ZXh0LCB2YXJpYWJsZXMgYXZhaWxhYmxlOiBAc2NvcmUgYW5kIEB0b3RhbC4gRXhhbXBsZTogJ0BzY29yZSBvZiBAdG90YWwgY29ycmVjdCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3Igc2hvdyByZXN1bHRzIiwKICAgICAgImRlZmF1bHQiOiAiU2hvdyByZXN1bHRzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHNob3J0IGFuc3dlciBsYWJlbCIsCiAgICAgICJkZWZhdWx0IjogIkE6IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIFwicmV0cnlcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJSZXRyeSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDYXNlIHNlbnNpdGl2ZSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJNYWtlcyBzdXJlIHRoZSB1c2VyIGlucHV0IGhhcyB0byBiZSBleGFjdGx5IHRoZSBzYW1lIGFzIHRoZSBhbnN3ZXIuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkluY29ycmVjdCB0ZXh0IGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiSW5jb3JyZWN0IGFuc3dlci4gQ29ycmVjdCBhbnN3ZXIgd2FzIEBhbnN3ZXIiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMuIFVzZSBAYW5zd2VyIGFzIHZhcmlhYmxlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDb3JyZWN0IGZlZWRiYWNrIHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJAYW5zd2VyIGlzIGNvcnJlY3QuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdGhhdCB3aWxsIGJlIGFubm91bmNlZCB0byBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIHdoZW4gYSBjYXJkIGlzIGFuc3dlcmVkIGNvcnJlY3RseS4gVXNlIEBhbnN3ZXIgYXMgdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNhcmQgY2hhbmdlIGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiUGFnZSBAY3VycmVudCBvZiBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMgd2hlbiBuYXZpZ2F0aW5nIGJldHdlZW4gY2FyZHMuIFVzZSBAY3VycmVudCBhbmQgQHRvdGFsIGFzIHZhcmlhYmxlcy4iCiAgICB9CiAgXQp9"],"libraries\/H5P.Flashcards-1.5\/language\/smj.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJUYXNrIGRlc2NyaXB0aW9uIgogICAgfSwKICAgIHsKICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkRlZmF1bHQiCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiQ2FyZHMiLAogICAgICAiZW50aXR5IjogImNhcmQiLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImxhYmVsIjogIkNhcmQiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJRdWVzdGlvbiIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcHRpb25hbCB0ZXh0dWFsIHF1ZXN0aW9uIGZvciB0aGUgY2FyZC4gKFRoZSBjYXJkIG1heSB1c2UganVzdCBhbiBpbWFnZSwganVzdCBhIHRleHQgb3IgYm90aCkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQW5zd2VyIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9wdGlvbmFsIGFuc3dlcihzb2x1dGlvbikgZm9yIHRoZSBjYXJkLiIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJJbWFnZSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcHRpb25hbCBpbWFnZSBmb3IgdGhlIGNhcmQuIChUaGUgY2FyZCBtYXkgdXNlIGp1c3QgYW4gaW1hZ2UsIGp1c3QgYSB0ZXh0IG9yIGJvdGgpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkFsdGVybmF0aXZlIHRleHQgZm9yIGltYWdlIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlRpcCIsCiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlRpcCB0ZXh0IgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlByb2dyZXNzIHRleHQiLAogICAgICAiZGVmYXVsdCI6ICJDYXJkIEBjYXJkIG9mIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJQcm9ncmVzcyB0ZXh0LCB2YXJpYWJsZXMgYXZhaWxhYmxlOiBAY2FyZCBhbmQgQHRvdGFsLiBFeGFtcGxlOiAnQ2FyZCBAY2FyZCBvZiBAdG90YWwnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHRoZSBuZXh0IGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIk5leHQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIHByZXZpb3VzIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlByZXZpb3VzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHRoZSBjaGVjayBhbnN3ZXJzIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIkNoZWNrIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlJlcXVpcmUgdXNlciBpbnB1dCBiZWZvcmUgdGhlIHNvbHV0aW9uIGNhbiBiZSB2aWV3ZWQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIGFuc3dlciBpbnB1dCBmaWVsZCIsCiAgICAgICJkZWZhdWx0IjogIllvdXIgYW5zd2VyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIGNvcnJlY3QgYW5zd2VyIiwKICAgICAgImRlZmF1bHQiOiAiQ29ycmVjdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBpbmNvcnJlY3QgYW5zd2VyIiwKICAgICAgImRlZmF1bHQiOiAiSW5jb3JyZWN0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlNob3cgc29sdXRpb24gdGV4dCIsCiAgICAgICJkZWZhdWx0IjogIkNvcnJlY3QgYW5zd2VyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHJlc3VsdHMgdGl0bGUiLAogICAgICAiZGVmYXVsdCI6ICJSZXN1bHRzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIG51bWJlciBvZiBjb3JyZWN0IiwKICAgICAgImRlZmF1bHQiOiAiQHNjb3JlIG9mIEB0b3RhbCBjb3JyZWN0IiwKICAgICAgImRlc2NyaXB0aW9uIjogIlJlc3VsdCB0ZXh0LCB2YXJpYWJsZXMgYXZhaWxhYmxlOiBAc2NvcmUgYW5kIEB0b3RhbC4gRXhhbXBsZTogJ0BzY29yZSBvZiBAdG90YWwgY29ycmVjdCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3Igc2hvdyByZXN1bHRzIiwKICAgICAgImRlZmF1bHQiOiAiU2hvdyByZXN1bHRzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHNob3J0IGFuc3dlciBsYWJlbCIsCiAgICAgICJkZWZhdWx0IjogIkE6IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIFwicmV0cnlcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJSZXRyeSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDYXNlIHNlbnNpdGl2ZSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJNYWtlcyBzdXJlIHRoZSB1c2VyIGlucHV0IGhhcyB0byBiZSBleGFjdGx5IHRoZSBzYW1lIGFzIHRoZSBhbnN3ZXIuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkluY29ycmVjdCB0ZXh0IGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiSW5jb3JyZWN0IGFuc3dlci4gQ29ycmVjdCBhbnN3ZXIgd2FzIEBhbnN3ZXIiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMuIFVzZSBAYW5zd2VyIGFzIHZhcmlhYmxlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDb3JyZWN0IGZlZWRiYWNrIHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJAYW5zd2VyIGlzIGNvcnJlY3QuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdGhhdCB3aWxsIGJlIGFubm91bmNlZCB0byBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIHdoZW4gYSBjYXJkIGlzIGFuc3dlcmVkIGNvcnJlY3RseS4gVXNlIEBhbnN3ZXIgYXMgdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNhcmQgY2hhbmdlIGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiUGFnZSBAY3VycmVudCBvZiBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMgd2hlbiBuYXZpZ2F0aW5nIGJldHdlZW4gY2FyZHMuIFVzZSBAY3VycmVudCBhbmQgQHRvdGFsIGFzIHZhcmlhYmxlcy4iCiAgICB9CiAgXQp9"],"libraries\/H5P.Flashcards-1.5\/language\/sr.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLQntC\/0LjRgSDQt9Cw0LTQsNGC0LrQsCIKICAgIH0sCiAgICB7CiAgICAgICJ3aWRnZXRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICLQo9C+0LHQuNGH0LDRmNC10L3QviIKICAgICAgICB9CiAgICAgIF0sCiAgICAgICJsYWJlbCI6ICLQmtCw0YDRgtC40YbQtSIsCiAgICAgICJlbnRpdHkiOiAiY2FyZCIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAibGFiZWwiOiAi0JrQsNGA0YLQuNGG0LAiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICLQn9C40YLQsNGa0LUiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAi0J3QtdC+0LHQstC10LfQvdC+INGC0LXQutGB0YLRg9Cw0LvQvdC+INC\/0LjRgtCw0ZrQtSDQt9CwINC60LDRgNGC0LjRhtGDLiAo0JrQsNGA0YLQuNGG0LAg0LzQvtC20LUg0LrQvtGA0LjRgdGC0LjRgtC4INGB0LDQvNC+INGB0LvQuNC60YMsINGB0LDQvNC+INGC0LXQutGB0YIg0LjQu9C4INC+0LHQvtGY0LUpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogItCe0LTQs9C+0LLQvtGAIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogItCd0LXQvtCx0LLQtdC30L3QuCDQvtC00LPQvtCy0L7RgCAo0YDQtdGI0LXRmtC1KSDQt9CwINC60LDRgNGC0LjRhtGDLiIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICLQodC70LjQutCwIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogItCd0LXQvtCx0LLQtdC30L3QsCDRgdC70LjQutCwINC30LAg0LrQsNGA0YLQuNGG0YMuICjQmtCw0YDRgtC40YbQsCDQvNC+0LbQtSDQutC+0YDQuNGB0YLQuNGC0Lgg0YHQsNC80L4g0YHQu9C40LrRgywg0YHQsNC80L4g0YLQtdC60YHRgiDQuNC70Lgg0L7QsdC+0ZjQtSkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAi0JDQu9GC0LXRgNC90LDRgtC40LLQvdC4INGC0LXQutGB0YIg0LfQsCDRgdC70LjQutGDIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogItCh0LDQstC10YIiLAogICAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINGB0LDQstC10YLQsCIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINCd0LDQv9GA0LXQtNCw0LoiLAogICAgICAiZGVmYXVsdCI6ICLQmtCw0YDRgtC40YbQsCBAY2FyZCDQvtC0IEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLQotC10LrRgdGCINC90LDQv9GA0LXRgtC60LAsINC00L7RgdGC0YPQv9C90LUg0L\/RgNC+0LzQtdC90ZnQuNCy0LU6IEBjYXJkINC4IEB0b3RhbC4g0J\/RgNC40LzQtdGAOiAn0JrQsNGA0YLQuNGG0LAgQGNhcmQg0L7QtCBAdG90YWwnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0LXQutGB0YIg0LfQsCDQtNGD0LPQvNC1INCh0LvQtdC00LXRm9C1IiwKICAgICAgImRlZmF1bHQiOiAi0KHQu9C10LTQtdGb0LAiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQt9CwINC00YPQs9C80LUg0J\/RgNC10YLRhdC+0LTQvdCwIiwKICAgICAgImRlZmF1bHQiOiAi0J\/RgNC10YLRhdC+0LTQvdCwIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0LXQutGB0YIg0LfQsCDQtNGD0LPQvNC1INCf0YDQvtCy0LXRgNC4IiwKICAgICAgImRlZmF1bHQiOiAi0J\/RgNC+0LLQtdGA0LgiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0JfQsNGF0YLQtdCy0LDRmNGC0LUg0LrQvtGA0LjRgdC90LjRh9C60Lgg0YPQvdC+0YEg0L\/RgNC1INC90LXQs9C+INGI0YLQviDRgdC1INGA0LXRiNC10ZrQtSDQvNC+0LbQtSDQv9C+0LPQu9C10LTQsNGC0LgiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQt9CwINCe0LTQs9C+0LLQvtGA0LUiLAogICAgICAiZGVmYXVsdCI6ICLQktCw0Ygg0L7QtNCz0L7QstC+0YAiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQt9CwINGC0LDRh9Cw0L0g0L7QtNCz0L7QstC+0YAiLAogICAgICAiZGVmYXVsdCI6ICLQotCw0YfQvdC+IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0LXQutGB0YIg0LfQsCDQv9C+0LPRgNC10YjQsNC9INC+0LTQs9C+0LLQvtGAIiwKICAgICAgImRlZmF1bHQiOiAi0J\/QvtCz0YDQtdGI0LDQvSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC30LAg0L\/RgNC40LrQsNC3INGA0LXRiNC10ZrQsCIsCiAgICAgICJkZWZhdWx0IjogItCi0LDRh9Cw0L0g0L7QtNCz0L7QstC+0YAiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQt9CwINCg0LXQt9GD0LvRgtCw0YLQtSIsCiAgICAgICJkZWZhdWx0IjogItCg0LXQt9GD0LvRgtCw0YLQuCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC30LAg0LHRgNC+0Zgg0YLQsNGH0L3QuNGFINC+0LTQs9C+0LLQvtGA0LAiLAogICAgICAiZGVmYXVsdCI6ICJAc2NvcmUg0L7QtCBAdG90YWwg0YLQsNGH0L3QuNGFIiwKICAgICAgImRlc2NyaXB0aW9uIjogItCi0LXQutGB0YIg0YDQtdC30YPQu9GC0LDRgtCwLCDQtNC+0YHRgtGD0L\/QvdC1INC\/0YDQvtC80LXQvdGZ0LjQstC1OiBAc2NvcmUg0LggQHRvdGFsLiDQn9GA0LjQvNC10YA6ICdAc2NvcmUg0L7QtCBAdG90YWwg0YLQsNGH0L3QuNGFJyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC30LAg0L\/RgNC40LrQsNC3INGA0LXQt9GD0LvRgtCw0YLQsCIsCiAgICAgICJkZWZhdWx0IjogItCf0YDQuNC60LDQttC4INGA0LXQt9GD0LvRgtCw0YLQtSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC30LAg0LrRgNCw0YLQsNC6INC+0LTQs9C+0LLQvtGAIiwKICAgICAgImRlZmF1bHQiOiAiQToiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQt9CwIFwi0LLRgNCw0YLQuFwiINC00YPQs9C80LUiLAogICAgICAiZGVmYXVsdCI6ICLQktGA0LDRgtC4IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCS0LXQu9C40LrQsCDQuCDQvNCw0LvQsCDRgdC70L7QstCwIiwKICAgICAgImRlc2NyaXB0aW9uIjogItCj0LLQtdGA0LDQstCwINGB0LUg0LTQsCDQutC+0YDQuNGB0L3QuNGH0LrQuCDRg9C90L7RgSDQvNC+0YDQsCDQsdC40YLQuCDQv9C+0YLQv9GD0L3QviDQuNGB0YLQuCDQutCw0L4g0Lgg0L7QtNCz0L7QstC+0YAuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCd0LXRgtCw0YfQsNC9INGC0LXQutGB0YIg0LfQsCDQv9C+0LzQvtGb0L3QtSDRgtC10YXQvdC+0LvQvtCz0LjRmNC1IiwKICAgICAgImRlZmF1bHQiOiAi0J3QtdGC0LDRh9Cw0L0g0L7QtNCz0L7QstC+0YAuINCi0LDRh9Cw0L0g0L7QtNCz0L7QstC+0YAg0ZjQtSBAYW5zd2VyIiwKICAgICAgImRlc2NyaXB0aW9uIjogItCi0LXQutGB0YIg0LrQvtGY0Lgg0ZvQtSDQsdC40YLQuCDQvdCw0ZjQsNCy0ZnQtdC9INC30LAg0L\/QvtC80L7Rm9C90LUg0YLQtdGF0L3QvtC70L7Qs9C40ZjQtS4g0JrQvtGA0LjRgdGC0LjRgtC1IEBhbnN3ZXIg0LrQsNC+INC\/0YDQvtC80LXQvdGZ0LjQstGDLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDb3JyZWN0IGZlZWRiYWNrIHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJAYW5zd2VyIGlzIGNvcnJlY3QuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdGhhdCB3aWxsIGJlIGFubm91bmNlZCB0byBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIHdoZW4gYSBjYXJkIGlzIGFuc3dlcmVkIGNvcnJlY3RseS4gVXNlIEBhbnN3ZXIgYXMgdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCf0YDQvtC80LXQvdCwINC60LDRgNGC0LjRhtC1INC30LAg0L\/QvtC80L7Rm9C90LUg0YLQtdGF0L3QvtC70L7Qs9C40ZjQtSIsCiAgICAgICJkZWZhdWx0IjogItCh0YLRgNCw0L3QsCBAY3VycmVudCDQvtC0IEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLQotC10LrRgdGCINC60L7RmNC4INGb0LUg0LHQuNGC0Lgg0L3QsNGY0LDQstGZ0LXQvSDQv9C+0LzQvtGb0L3QuNC8INGC0LXRhdC90L7Qu9C+0LPQuNGY0LDQvNCwINC\/0YDQuNC70LjQutC+0Lwg0L3QsNCy0LjQs9Cw0YbQuNGY0LUg0LjQt9C80LXRktGDINC60LDRgNGC0LjRhtCwLiDQmtC+0YDQuNGB0YLQuNGC0LUgQGN1cnJlbnQg0LggQHRvdGFsINC60LDQviDQv9GA0L7QvNC10L3RmdC40LLQtS4iCiAgICB9CiAgXQp9"],"libraries\/H5P.Flashcards-1.5\/language\/sv.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJVcHBnaWZ0c2Jlc2tyaXZuaW5nIgogICAgfSwKICAgIHsKICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIlN0YW5kYXJkIgogICAgICAgIH0KICAgICAgXSwKICAgICAgImxhYmVsIjogIktvcnQiLAogICAgICAiZW50aXR5IjogImtvcnQiLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImxhYmVsIjogIktvcnQiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJGcsOlZ2EiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiVmFsZnJpIHRleHQgZsO2ciBrb3J0ZXQuIChLb3J0ZXQga2FuIGJlc3TDpSBhdiBlbmJhcnQgZW4gYmlsZCwgZW5iYXJ0IGVuIHRleHQsIGVsbGVyIGLDpWRhLikiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiU3ZhciIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJWYWxmcml0dCBzdmFyIChsw7ZzbmluZykgZsO2ciBrb3J0ZXQuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkJpbGQiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiVmFsZnJpIGJpbGQgZsO2ciBrb3J0ZXQuIChLb3J0ZXQga2FuIGJlc3TDpSBhdiBlbmJhcnQgZW4gYmlsZCwgZW5iYXJ0IGVuIHRleHQsIGVsbGVyIGLDpWRhLikiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQWx0ZXJuYXRpdiB0ZXh0IGbDtnIgYmlsZCIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJUaXBzIiwKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiVGlwc3RleHQiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRnJhbXN0ZWdzdGV4dCIsCiAgICAgICJkZWZhdWx0IjogIktvcnQgQGNhcmQgYXYgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkZyYW1zdGVnc3RleHQsIHZhcmlhYmxlciBpbmtsdWRlcmFyIDogQGNhcmQgb2NoIEB0b3RhbC4gRXhlbXBlbDogJ0tvcnQgQGNhcmQgYXYgQHRvdGFsJyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGbDtnIgbsOkc3RhLWtuYXBwZW4iLAogICAgICAiZGVmYXVsdCI6ICJOw6RzdGEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmw7ZyIGbDtnJlZ8OlZW5kZS1rbmFwcGVuIiwKICAgICAgImRlZmF1bHQiOiAiRsO2cmVnw6VlbmRlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZsO2ciBrbmFwcGVuIFwiU3ZhcmFcIiIsCiAgICAgICJkZWZhdWx0IjogIlN2YXJhIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIktyw6R2IGF0dCBhbnbDpG5kYXJlbiBhbmdlciBzdmFyIGlubmFuIGzDtnNuaW5nIGthbiB2aXNhcyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGbDtnIgc3ZhcnNpbm1hdG5pbmdzZsOkbHQiLAogICAgICAiZGVmYXVsdCI6ICJEaXR0IHN2YXIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCB2aWQga29ycmVrdCBzdmFyIiwKICAgICAgImRlZmF1bHQiOiAiUsOkdHQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCB2aWQgZmVsYWt0aWd0IHN2YXIiLAogICAgICAiZGVmYXVsdCI6ICJGZWwiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVmlzYSBsw7ZzbmluZ3N0ZXh0IiwKICAgICAgImRlZmF1bHQiOiAiUsOkdHQgc3ZhciIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJSdWJyaWsgZsO2ciByZXN1bHRhdCIsCiAgICAgICJkZWZhdWx0IjogIlJlc3VsdGF0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZsO2ciBhbnRhbCBrb3JyZWt0YSIsCiAgICAgICJkZWZhdWx0IjogIkBzY29yZSBhdiBAdG90YWwgdmFyIHLDpHR0IiwKICAgICAgImRlc2NyaXB0aW9uIjogIlJlc3VsdGF0dGV4dCwgdmFyaWFibGVyIHNvbSBmaW5ucyDDpHIgOiBAc2NvcmUgb2NoIEB0b3RhbC4gRXhhbXBsZTogJ0BzY29yZSBhdiBAdG90YWwgdmFyIHLDpHR0JyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGbDtnIgdmlzYSByZXN1bHRhdCIsCiAgICAgICJkZWZhdWx0IjogIlZpcyByZXN1bHRhdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGbDtnIga29ydCBzdmFyc2V0aWtldHQiLAogICAgICAiZGVmYXVsdCI6ICJBOiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGbDtnIga25hcHBlbiBcImbDtnJzw7ZrIGlnZW5cIiAiLAogICAgICAiZGVmYXVsdCI6ICJGw7Zyc8O2ayBpZ2VuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlNraWZ0bMOkZ2Vza8OkbnNsaWd0IiwKICAgICAgImRlc2NyaXB0aW9uIjogIktyw6R2IGF0dCBhbnbDpG5kYXJlbnMgc3ZhciDDpHIgZXhha3Qgc2FtbWEgc29tIHN2YXJldC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCB2aWQgZmVsYWt0aWd0IHN2YXIgZsO2ciB0aWxsZ8OkbmdsaWdoZXRzaGrDpGxwbWVkZWwiLAogICAgICAiZGVmYXVsdCI6ICJGZWxha3RpZ3Qgc3Zhci4gUsOkdHQgc3ZhciB2YXIgQGFuc3dlciIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHNvbSBrb21tZXIgYW52w6RuZGFzIGF2IHRpbGxnw6RuZ2xpZ2hldHNoasOkbHBtZWRlbC4gQW52w6RuZCBAYW5zd2VyIHNvbSB2YXJpYWJlbC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ29ycmVjdCBmZWVkYmFjayB0ZXh0IGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiQGFuc3dlciBpcyBjb3JyZWN0LiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcyB3aGVuIGEgY2FyZCBpcyBhbnN3ZXJlZCBjb3JyZWN0bHkuIFVzZSBAYW5zd2VyIGFzIHZhcmlhYmxlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCeXRlIGF2IGtvcnQgdmlkIHRpbGxnw6RuZ2xpZ2hldHNoasOkbHBtZWRlbCIsCiAgICAgICJkZWZhdWx0IjogIlNpZGEgQGN1cnJlbnQgYXYgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgc29tIGtvbW1lciBhbnbDpG5kYXMgYXYgdGlsbGfDpG5nbGlnaGV0c2hqw6RscG1lZGVsIHZpZCBuYXZpZ2VyaW5nIG1lbGxhbiBrb3J0LiBBbnbDpG5kIEBjdXJyZW50IG9jaCBAdG90YWwgc29tIHZhcmlhYmxlci4iCiAgICB9CiAgXQp9"],"libraries\/H5P.Flashcards-1.5\/language\/tr.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJHw7ZyZXYgdGFuxLFtxLEiCiAgICB9LAogICAgewogICAgICAid2lkZ2V0cyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiVmFyc2F5xLFsYW4iCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiS2FydGxhciIsCiAgICAgICJlbnRpdHkiOiAia2FydCIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAibGFiZWwiOiAiS2FydCIsCiAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlNvcnUiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiS2FydHRhIGfDtnLDvG5lY2VrIGlzdGXEn2UgYmHEn2zEsSB5YXrEsWzEsSBzb3J1LiAoS2FydHRhIHNhZGVjZSBiaXIgZ8O2cnNlbCwgc2FkZWNlIG1ldGluIHZleWEgaWtpc2kgZGUgb2xhYmlsaXIpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkNldmFwIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIkthcnQgacOnaW4gaXN0ZcSfZSBiYcSfbMSxIGNldmFwICjDp8O2esO8bSkuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlJlc2ltIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIkthcnR0YSBnw7Zyw7xuZWNlayBpc3RlxJ9lIGJhxJ9sxLEgZ8O2cnNlbC4gKEthcnR0YSBzYWRlY2UgYmlyIGfDtnJzZWwsIHNhZGVjZSBtZXRpbiB2ZXlhIGlraXNpIGRlIG9sYWJpbGlyKSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJSZXNpbSBpw6dpbiBhbHRlcm5hdGlmIG1ldGluIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIsSwcHVjdSIsCiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIsSwcHVjdSBtZXRuaSIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLEsGxlcmxlbWUgbWV0bmkiLAogICAgICAiZGVmYXVsdCI6ICJLYXJ0IHNhecSxc8SxOiBAY2FyZCAvIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLEsGxlcmxlbWUgbWV0bmksIG1ldmN1dCBkZcSfacWfa2VubGVyOiBAY2FyZCB2ZSBAdG90YWwuIMOWcm5lazogJ0thcnQgc2F5xLFzxLE6IEBjYXJkIC8gQHRvdGFsJyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJTb25yYWtpIGTDvMSfbWVzaSBtZXRuaSIsCiAgICAgICJkZWZhdWx0IjogIlNvbnJha2kiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiw5ZuY2VraSBkw7zEn21lc2kgbWV0bmkiLAogICAgICAiZGVmYXVsdCI6ICLDlm5jZWtpIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNldmFwbGFyxLEga29udHJvbCBldCBkw7zEn21lc2kgbWV0bmkiLAogICAgICAiZGVmYXVsdCI6ICJLb250cm9sIEV0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIsOHw7Z6w7xtIGfDtnLDvG50w7xsZW5lbWVkZW4gw7ZuY2Uga3VsbGFuxLFjxLEgZ2lyacWfaSBnZXJla3NpbiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDZXZhcCBnaXJpxZ9pIGFsYW7EsSBtZXRuaSIsCiAgICAgICJkZWZhdWx0IjogIkNldmFixLFuxLF6IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkRvxJ9ydSBjZXZhcCBtZXRuaSIsCiAgICAgICJkZWZhdWx0IjogIkRvxJ9ydSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJZYW5sxLHFnyBjZXZhcCBtZXRuaSIsCiAgICAgICJkZWZhdWx0IjogIllhbmzEscWfIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIsOHw7Z6w7xtw7wgZ8O2c3RlciBtZXRuaSIsCiAgICAgICJkZWZhdWx0IjogIsOHw7Z6w7xtw7wgR8O2c3RlciIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJTb251w6dsYXIgYmHFn2zEscSfxLEgbWV0bmkiLAogICAgICAiZGVmYXVsdCI6ICJTb251w6dsYXIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRG\/En3J1IGNldmFwIHNhecSxc8SxIG1ldG5pIiwKICAgICAgImRlZmF1bHQiOiAiRG\/En3J1IGNldmFwIHNhecSxc8SxOiBAc2NvcmUgLyBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAiU29udcOnIG1ldG5pLCBtZXZjdXQgZGXEn2nFn2tlbmxlcjogQHNjb3JlIHZlIEB0b3RhbC4gw5ZybmVrOiAnRG\/En3J1IGN2ZXZhcCBzYXnEsXPEsTogQHNjb3JlIC8gQHRvdGFsLiciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiU29udcOnbGFyxLEgZ8O2c3RlciBtZXRuaSIsCiAgICAgICJkZWZhdWx0IjogIlNvbnXDp2xhcsSxIEfDtnN0ZXIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiS8Sxc2EgY2V2YXAgZXRpa2V0IG1ldG5pIiwKICAgICAgImRlZmF1bHQiOiAiQToiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiXCJZZW5pZGVuIERlbmVcIiBkw7zEn21lc2kgbWV0bmkiLAogICAgICAiZGVmYXVsdCI6ICJZZW5pZGVuIERlbmUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQsO8ecO8ayBrw7zDp8O8ayBoYXJmIGR1eWFybMSxIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkt1bGxhbsSxY8SxIGNldmFixLFuxLFuLCBheW5lbiBiZWxpcmxlZGnEn2luaXogY2V2YXAgZ2liaSBvbG1hc8SxIGdlcmVrbGlsacSfaW5pIHNhxJ9sYXIuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIllhcmTEsW1jxLEgdGVrbm9sb2ppbGVyIGnDp2luIHlhbmzEscWfIG1ldGluIiwKICAgICAgImRlZmF1bHQiOiAiWWFubMSxxZ8gY2V2YXAuIERvxJ9ydSBjZXZhcCBAYW5zd2VyIiwKICAgICAgImRlc2NyaXB0aW9uIjogIllhcmTEsW1jxLEgdGVrbm9sb2ppbGVyZSBjZXZhYsSxbiB5YW5sxLHFnyBvbGR1xJ91bnUgdmUgZG\/En3J1IGNldmFixLEgZHV5dXJhY2FrIG1ldGluLiBAYW5zd2VyIGlmYWRlc2luaSB5ZXJpbmUgZG\/En3J1IGNldmFixLFuIGdlbG1lc2kgacOnaW4ga3VsbGFuxLFuLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDb3JyZWN0IGZlZWRiYWNrIHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJAYW5zd2VyIGlzIGNvcnJlY3QuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdGhhdCB3aWxsIGJlIGFubm91bmNlZCB0byBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIHdoZW4gYSBjYXJkIGlzIGFuc3dlcmVkIGNvcnJlY3RseS4gVXNlIEBhbnN3ZXIgYXMgdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIllhcmTEsW1jxLEgdGVrbm9sb2ppbGVyIGnDp2luIGthcnQgZGXEn2nFn2lrbGnEn2kiLAogICAgICAiZGVmYXVsdCI6ICJAdG90YWwgc2F5ZmFkYW4gQGN1cnJlbnQuIHNheWZhIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkthcnRsYXIgYXJhc8SxbmRhIGdlemluaXJrZW4geWFyZMSxbWPEsSB0ZWtub2xvamlsZXJlIHRvcGxhbSBzYXlmYSBzYXnEsXPEsW7EsSB2ZSBidWx1bnVsYW4gc2F5ZmF5xLEgZHV5dXJhY2FrIG1ldGluLiBUb3BsYW0gc2F5ZmEgc2F5xLFzxLEgacOnaSBAdG90YWwsIGJ1bHVudWxhbiBzYXlmYSBpw6dpbiBkZSBAY3VycmVudCBrdWxsYW7EsW4uIgogICAgfQogIF0KfQ=="],"libraries\/H5P.Flashcards-1.5\/language\/uk.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLQntC\/0LjRgSDQt9Cw0LLQtNCw0L3QvdGPIgogICAgfSwKICAgIHsKICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogItCf0L4g0YPQvNC+0LLRh9Cw0L3QvdGOIgogICAgICAgIH0KICAgICAgXSwKICAgICAgImxhYmVsIjogItCa0LDRgNGC0LrQuCIsCiAgICAgICJlbnRpdHkiOiAi0LrQsNGA0YLQutCwIiwKICAgICAgImZpZWxkIjogewogICAgICAgICJsYWJlbCI6ICLQmtCw0YDRgtC60LAiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICLQl9Cw0L\/QuNGC0LDQvdC90Y8iLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAi0JTQvtC00LDRgtC60L7QstC+INGC0LXQutGB0YLQvtCy0LUg0LfQsNC\/0LjRgtCw0L3QvdGPINC00LvRjyDQutCw0YDRgtC60LguICjQmtCw0YDRgtC60LAg0LzQvtC20LUg0LLQuNC60L7RgNC40YHRgtC+0LLRg9Cy0LDRgtC4INGC0ZbQu9GM0LrQuCDQt9C+0LHRgNCw0LbQtdC90L3Rjywg0YLRltC70YzQutC4INGC0LXQutGB0YIg0LDQsdC+INGA0LDQt9C+0LwpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogItCS0ZbQtNC\/0L7QstGW0LTRjCIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICLQlNC+0LTQsNC60YLQvtCy0LAg0LLRltC00L\/QvtCy0ZbQtNGMINC00LvRjyDQutCw0YDRgtC60LguIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogItCX0L7QsdGA0LDQttC10L3QvdGPIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogItCU0L7QtNCw0YLQutC+0LLQtSDQt9C+0LHRgNCw0LbQtdC90L3RjyDQtNC70Y8g0LrQsNGA0YLQutC4LiAo0JrQsNGA0YLQutCwINC80L7QttC1INCy0LjQutC+0YDQuNGB0YLQvtCy0YPQstCw0YLQuCDRgtGW0LvRjNC60Lgg0LfQvtCx0YDQsNC20LXQvdC90Y8sINGC0ZbQu9GM0LrQuCDRgtC10LrRgdGCINCw0LHQviDRgNCw0LfQvtC8KSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJBbHRlcm5hdGl2ZSB0ZXh0IGZvciBpbWFnZSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICLQn9C+0YDQsNC00LAiLAogICAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC\/0L7RgNCw0LTQuCIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQn9GA0L7Qs9GA0LXRgSAo0YLQtdC60YHRgikiLAogICAgICAiZGVmYXVsdCI6ICLQmtCw0YDRgtC60LAgQGNhcmQg0LcgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogItCf0YDQvtCz0YDQtdGBICjRgtC10LrRgdGCKSwg0LTQvtGB0YLRg9C\/0L3RliDQt9C80ZbQvdC90ZY6IEBjYXJkINGWIEB0b3RhbC4g0J3QsNC\/0YDQuNC60LvQsNC0OiAn0JrQsNGA0YLQutCwIEBjYXJkINC3IEB0b3RhbCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQutC90L7Qv9C60Lgg0L3QsNGB0YLRg9C\/0L3QsCIsCiAgICAgICJkZWZhdWx0IjogItCd0LDRgdGC0YPQv9C90LAiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQutC90L7Qv9C60Lgg0L\/QvtC\/0LXRgNC10LTQvdGPIiwKICAgICAgImRlZmF1bHQiOiAi0J\/QvtC\/0LXRgNC10LTQvdGPIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0LXQutGB0YIg0LrQvdC+0L\/QutC4INC\/0LXRgNC10LLRltGA0LrQuCDQstGW0LTQv9C+0LLRltC00LXQuSIsCiAgICAgICJkZWZhdWx0IjogItCf0LXRgNC10LLRltGA0LjRgtC4IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCf0L7RgtGA0ZbQsdC90L4g0LLQstC10YHRgtC4INC60L7RgNC40YHRgtGD0LLQsNGH0LAg0L\/QtdGA0LXQtCDRgtC40LwsINGP0Log0LLRltC00L\/QvtCy0ZbQtNGMINC80L7QttC90LAg0LHRg9C00LUg0L\/QtdGA0LXQs9C70Y\/QvdGD0YLQuCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC00LvRjyDQv9C+0LvRjyDQstCy0LXQtNC10L3QvdGPINCy0ZbQtNC\/0L7QstGW0LTRliIsCiAgICAgICJkZWZhdWx0IjogItCi0LLQvtGPINCy0ZbQtNC\/0L7QstGW0LTRjCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC00LvRjyDQv9GA0LDQstC40LvRjNC90L7RlyDQstGW0LTQv9C+0LLRltC00ZYiLAogICAgICAiZGVmYXVsdCI6ICLQn9GA0LDQstC40LvRjNC90L4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YEg0LTQu9GPINC90LXQv9GA0LDQstC40LvRjNC90L4g0LLRltC00L\/QvtCy0ZbQtNGWIiwKICAgICAgImRlZmF1bHQiOiAi0J3QtdC\/0YDQsNCy0LjQu9GM0L3QviIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQn9C+0LrQsNC30LDRgtC4INGC0LXQutGB0YIg0LLRltC00L\/QvtCy0ZbQtNGWIiwKICAgICAgImRlZmF1bHQiOiAi0J\/RgNCw0LLQuNC70YzQvdCwINCy0ZbQtNC\/0L7QstGW0LTRjCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC00LvRjyDQt9Cw0LPQvtC70L7QstC60LAg0YDQtdC30YPQu9GM0YLQsNGC0ZbQsiIsCiAgICAgICJkZWZhdWx0IjogItCg0LXQt9GD0LvRjNGC0LDRgtC4IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0LXQutGB0YIg0LTQu9GPINC60ZbQu9GM0LrQvtGB0YLRliDQv9GA0LDQstC40LvRjNC90LjRhSIsCiAgICAgICJkZWZhdWx0IjogIkBzY29yZSDQtyBAdG90YWwg0L\/RgNCw0LLQuNC70YzQvdC40YUiLAogICAgICAiZGVzY3JpcHRpb24iOiAi0KDQtdC30YPQu9GM0YLQsNGCICjRgtC10LrRgdGCKSwg0LTQvtGB0YLRg9C\/0L3RliDQt9C80ZbQvdC90ZY6IEBzY29yZSDRliBAdG90YWwuINCd0LDQv9GA0LjQutC70LDQtDogJ0BzY29yZSDQtyBAdG90YWwg0LLRltGA0L3QviciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQtNC70Y8g0L\/QvtC60LDQt9GDINGA0LXQt9GD0LvRjNGC0LDRgtGDIiwKICAgICAgImRlZmF1bHQiOiAi0J\/QvtC60LDQt9Cw0YLQuCDRgNC10LfRg9C70YzRgtCw0YIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQtNC70Y8g0LzRltGC0LrQuCDQstGW0LTQv9C+0LLRltC00ZYiLAogICAgICAiZGVmYXVsdCI6ICJBOiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC00LvRjyDQutC90L7Qv9C60Lgg0L\/QvtCy0YLQvtGA0YMiLAogICAgICAiZGVmYXVsdCI6ICLQn9C+0LLRgtC+0YDQuNGC0LgiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0JLRgNCw0YXQvtCy0YPQstCw0YLQuCDRgNC10LPRltGB0YLRgCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLQktCy0LXQtNC10L3QtSDQutC+0YDQuNGB0YLRg9Cy0LDRh9C10Lwg0L\/QvtCy0LjQvdC90L4g0LHRg9GC0Lgg0YLQvtGH0L3QviDRgtCw0LrQuNC8INC20LUsINGP0Log0ZYg0LLRltC00L\/QvtCy0ZbQtNGMLi4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0J3QtdC\/0YDQsNCy0LjQu9GM0L3QuNC5INGC0LXQutGB0YIg0LTQu9GPINC00L7Qv9C+0LzRltC20L3QuNGFINGC0LXRhdC90L7Qu9C+0LPRltC5IiwKICAgICAgImRlZmF1bHQiOiAi0J3QtdC\/0YDQsNCy0LjQu9GM0L3QsCDQstGW0LTQv9C+0LLRltC00YwuINCf0YDQsNCy0LjQu9GM0L3QsCDQstGW0LTQv9C+0LLRltC00Ywg0LHRg9C70LAgQGFuc3dlciIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLQotC10LrRgdGCLCDRj9C60LjQuSDQsdGD0LTQtSDQvtCz0L7Qu9C+0YjQtdC90L4g0LTQvtC\/0L7QvNGW0LbQvdC40LzQuCDRgtC10YXQvdC+0LvQvtCz0ZbRj9C80LguINCS0LjQutC+0YDQuNGB0YLQvtCy0YPQudGC0LUgQGFuc3dlciDRj9C6INC30LzRltC90L3Rgy4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ29ycmVjdCBmZWVkYmFjayB0ZXh0IGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiQGFuc3dlciBpcyBjb3JyZWN0LiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcyB3aGVuIGEgY2FyZCBpcyBhbnN3ZXJlZCBjb3JyZWN0bHkuIFVzZSBAYW5zd2VyIGFzIHZhcmlhYmxlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQl9C80ZbQvdCwINC60LDRgNGC0LrQuCDQtNC70Y8g0LTQvtC\/0L7QvNGW0LbQvdC40YUg0YLQtdGF0L3QvtC70L7Qs9GW0LkiLAogICAgICAiZGVmYXVsdCI6ICLQodGC0L7RgNGW0L3QutCwIEBjdXJyZW50INC3IEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLQotC10LrRgdGCLCDRj9C60LjQuSDQsdGD0LTQtSDQvtCz0L7Qu9C+0YjQtdC90L4g0LTQvtC\/0L7QvNGW0LbQvdC40LzQuCDRgtC10YXQvdC+0LvQvtCz0ZbRj9C80Lgg0L\/RltC0INGH0LDRgSDQvdCw0LLRltCz0LDRhtGW0Zcg0LzRltC2INC60LDRgNGC0LrQsNC80LguINCS0LjQutC+0YDQuNGB0YLQvtCy0YPQuSBAY3VycmVudCDRliBAdG90YWwg0Y\/QuiDQt9C80ZbQvdC90ZYuIgogICAgfQogIF0KfQ=="],"libraries\/H5P.Flashcards-1.5\/language\/vi.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJUYXNrIGRlc2NyaXB0aW9uIgogICAgfSwKICAgIHsKICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkRlZmF1bHQiCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiQ2FyZHMiLAogICAgICAiZW50aXR5IjogImNhcmQiLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImxhYmVsIjogIkNhcmQiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJRdWVzdGlvbiIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcHRpb25hbCB0ZXh0dWFsIHF1ZXN0aW9uIGZvciB0aGUgY2FyZC4gKFRoZSBjYXJkIG1heSB1c2UganVzdCBhbiBpbWFnZSwganVzdCBhIHRleHQgb3IgYm90aCkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQW5zd2VyIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9wdGlvbmFsIGFuc3dlcihzb2x1dGlvbikgZm9yIHRoZSBjYXJkLiIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJJbWFnZSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcHRpb25hbCBpbWFnZSBmb3IgdGhlIGNhcmQuIChUaGUgY2FyZCBtYXkgdXNlIGp1c3QgYW4gaW1hZ2UsIGp1c3QgYSB0ZXh0IG9yIGJvdGgpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkFsdGVybmF0aXZlIHRleHQgZm9yIGltYWdlIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlRpcCIsCiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlRpcCB0ZXh0IgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlByb2dyZXNzIHRleHQiLAogICAgICAiZGVmYXVsdCI6ICJDYXJkIEBjYXJkIG9mIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJQcm9ncmVzcyB0ZXh0LCB2YXJpYWJsZXMgYXZhaWxhYmxlOiBAY2FyZCBhbmQgQHRvdGFsLiBFeGFtcGxlOiAnQ2FyZCBAY2FyZCBvZiBAdG90YWwnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHRoZSBuZXh0IGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIk5leHQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIHByZXZpb3VzIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlByZXZpb3VzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHRoZSBjaGVjayBhbnN3ZXJzIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIkNoZWNrIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlJlcXVpcmUgdXNlciBpbnB1dCBiZWZvcmUgdGhlIHNvbHV0aW9uIGNhbiBiZSB2aWV3ZWQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIGFuc3dlciBpbnB1dCBmaWVsZCIsCiAgICAgICJkZWZhdWx0IjogIllvdXIgYW5zd2VyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIGNvcnJlY3QgYW5zd2VyIiwKICAgICAgImRlZmF1bHQiOiAiQ29ycmVjdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBpbmNvcnJlY3QgYW5zd2VyIiwKICAgICAgImRlZmF1bHQiOiAiSW5jb3JyZWN0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlNob3cgc29sdXRpb24gdGV4dCIsCiAgICAgICJkZWZhdWx0IjogIkNvcnJlY3QgYW5zd2VyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHJlc3VsdHMgdGl0bGUiLAogICAgICAiZGVmYXVsdCI6ICJSZXN1bHRzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIG51bWJlciBvZiBjb3JyZWN0IiwKICAgICAgImRlZmF1bHQiOiAiQHNjb3JlIG9mIEB0b3RhbCBjb3JyZWN0IiwKICAgICAgImRlc2NyaXB0aW9uIjogIlJlc3VsdCB0ZXh0LCB2YXJpYWJsZXMgYXZhaWxhYmxlOiBAc2NvcmUgYW5kIEB0b3RhbC4gRXhhbXBsZTogJ0BzY29yZSBvZiBAdG90YWwgY29ycmVjdCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3Igc2hvdyByZXN1bHRzIiwKICAgICAgImRlZmF1bHQiOiAiU2hvdyByZXN1bHRzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHNob3J0IGFuc3dlciBsYWJlbCIsCiAgICAgICJkZWZhdWx0IjogIkE6IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIFwicmV0cnlcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJSZXRyeSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDYXNlIHNlbnNpdGl2ZSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJNYWtlcyBzdXJlIHRoZSB1c2VyIGlucHV0IGhhcyB0byBiZSBleGFjdGx5IHRoZSBzYW1lIGFzIHRoZSBhbnN3ZXIuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkluY29ycmVjdCB0ZXh0IGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiSW5jb3JyZWN0IGFuc3dlci4gQ29ycmVjdCBhbnN3ZXIgd2FzIEBhbnN3ZXIiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMuIFVzZSBAYW5zd2VyIGFzIHZhcmlhYmxlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDb3JyZWN0IGZlZWRiYWNrIHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJAYW5zd2VyIGlzIGNvcnJlY3QuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdGhhdCB3aWxsIGJlIGFubm91bmNlZCB0byBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIHdoZW4gYSBjYXJkIGlzIGFuc3dlcmVkIGNvcnJlY3RseS4gVXNlIEBhbnN3ZXIgYXMgdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNhcmQgY2hhbmdlIGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiUGFnZSBAY3VycmVudCBvZiBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMgd2hlbiBuYXZpZ2F0aW5nIGJldHdlZW4gY2FyZHMuIFVzZSBAY3VycmVudCBhbmQgQHRvdGFsIGFzIHZhcmlhYmxlcy4iCiAgICB9CiAgXQp9"],"libraries\/H5P.Flashcards-1.5\/language\/zh-hans.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLku7vliqHmj4\/ov7AiCiAgICB9LAogICAgewogICAgICAid2lkZ2V0cyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAi6buY6K6kIgogICAgICAgIH0KICAgICAgXSwKICAgICAgImxhYmVsIjogIuaJgOacieWNoeeJhyIsCiAgICAgICJlbnRpdHkiOiAi5Y2h54mHIiwKICAgICAgImZpZWxkIjogewogICAgICAgICJsYWJlbCI6ICLljaHniYciLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICLpl67popgiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAi5Y2h54mH55qE5Y+v6YCJ5paH5pys6Zeu6aKYICjlj6\/ku6Xkvb\/nlKjlm77lg4\/ljaHvvIzmiJbogIXmloflrZfljaHvvIzkuZ\/lj6\/ku6XmmK\/lm77lg4\/phY3mloflrZfnmoTljaHniYcpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIuetlOahiCIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICLljaHniYfnmoTlj6\/pgInnrZTmoYgo6Kej5Yaz5pa55qGIKSAuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIuWbvuWDjyIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICLljaHniYfnmoTlj6\/pgInlm77lg48uICjlj6\/ku6Xkvb\/nlKjlm77lg4\/ljaHvvIzmiJbogIXmloflrZfljaHvvIzkuZ\/lj6\/ku6XmmK\/lm77lg4\/phY3mloflrZfnmoTljaHniYcpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkFsdGVybmF0aXZlIHRleHQgZm9yIGltYWdlIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIuaPkOekuiIsCiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIuaPkOekuuaWh+acrCIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLov5vluqbmlofmnKwiLAogICAgICAiZGVmYXVsdCI6ICLljaHniYcgQHRvdGFs5Lit55qEQGNhcmQiLAogICAgICAiZGVzY3JpcHRpb24iOiAi6L+b5bqm5paH5pys77yM5Y+v55So5Y+Y6YePOiBAY2FyZCDlkowgQHRvdGFsLiDkvovlpoI6IOWNoeeJhyBAdG90YWzkuK3nmoRAY2FyZCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLkuIvkuIDkuKrmjInpkq7nmoTmlofmnKwiLAogICAgICAiZGVmYXVsdCI6ICLkuIvkuIDkuKoiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi5YmN5LiA5Liq5oyJ6ZKu55qE5paH5pysIiwKICAgICAgImRlZmF1bHQiOiAi5YmN5LiA5LiqIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuajgOafpeetlOahiOaMiemSrueahOaWh+acrCIsCiAgICAgICJkZWZhdWx0IjogIuajgOafpSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLlnKjmn6XnnIvop6PlhrPmlrnmoYjkuYvliY3pnIDopoHnlKjmiLfovpPlhaUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi562U5qGI6L6T5YWl5a2X5q6155qE5paH5pysIiwKICAgICAgImRlZmF1bHQiOiAi5L2g55qE562U5qGIIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuato+ehruetlOahiOeahOaWh+acrCIsCiAgICAgICJkZWZhdWx0IjogIuato+ehriIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLplJnor6\/nrZTmoYjnmoTmlofmnKwiLAogICAgICAiZGVmYXVsdCI6ICLplJnor68iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi5pi+56S66Kej5Yaz5pa55qGI5paH5pysIiwKICAgICAgImRlZmF1bHQiOiAi5q2j56Gu562U5qGIIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuaIkOe7qeagh+mimOeahOaWh+acrCIsCiAgICAgICJkZWZhdWx0IjogIuaIkOe7qSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLmraPnoa7nrZTmoYjmlbDph4\/nmoTmlofmnKwiLAogICAgICAiZGVmYXVsdCI6ICJAdG90YWzkuK3nmoRAc2NvcmUg5q2j56GuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIuaIkOe7qeaWh+acrCwg5Y+Y6YeP5Y+v55SoOiBAc2NvcmUg5ZKMIEB0b3RhbC4g5L6L5aaCOiBAdG90YWzkuK3nmoRAc2NvcmUg5q2j56GuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuaYvuekuuaIkOe7qeeahOaWh+acrCIsCiAgICAgICJkZWZhdWx0IjogIuaYvuekuuaIkOe7qSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLnn63nrZTmoYjmoIfnrb7nmoTmlofmnKwiLAogICAgICAiZGVmYXVsdCI6ICJBOiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLph43or5Ug5oyJ6ZKu55qE5paH5pysIiwKICAgICAgImRlZmF1bHQiOiAi6YeN6K+VIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuWMuuWIhuWkp+Wwj+WGmSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLnoa7orqTnlKjmiLfovpPlhaXlhoXlrrnlv4XpobvkuI7nrZTmoYjlrozlhajnm7jlkIwuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkluY29ycmVjdCB0ZXh0IGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiSW5jb3JyZWN0IGFuc3dlci4gQ29ycmVjdCBhbnN3ZXIgd2FzIEBhbnN3ZXIiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMuIFVzZSBAYW5zd2VyIGFzIHZhcmlhYmxlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDb3JyZWN0IGZlZWRiYWNrIHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJAYW5zd2VyIGlzIGNvcnJlY3QuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdGhhdCB3aWxsIGJlIGFubm91bmNlZCB0byBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIHdoZW4gYSBjYXJkIGlzIGFuc3dlcmVkIGNvcnJlY3RseS4gVXNlIEBhbnN3ZXIgYXMgdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNhcmQgY2hhbmdlIGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiUGFnZSBAY3VycmVudCBvZiBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMgd2hlbiBuYXZpZ2F0aW5nIGJldHdlZW4gY2FyZHMuIFVzZSBAY3VycmVudCBhbmQgQHRvdGFsIGFzIHZhcmlhYmxlcy4iCiAgICB9CiAgXQp9"],"libraries\/H5P.Flashcards-1.5\/library.json":["application\/json","ewogICJ0aXRsZSI6ICJGbGFzaGNhcmRzIiwKICAiZGVzY3JpcHRpb24iOiAiQ3JlYXRlIGNhcmRzIHdoZXJlIHRoZSB1c2VyIGhhcyB0byBndWVzcyB0aGUgYW5zd2VyLiIsCiAgIm1ham9yVmVyc2lvbiI6IDEsCiAgIm1pbm9yVmVyc2lvbiI6IDUsCiAgInBhdGNoVmVyc2lvbiI6IDI0LAogICJydW5uYWJsZSI6IDEsCiAgImVtYmVkVHlwZXMiOiBbCiAgICAiaWZyYW1lIgogIF0sCiAgImF1dGhvciI6ICJKb3ViZWwiLAogICJjb3JlQXBpIjogewogICAgIm1ham9yVmVyc2lvbiI6IDEsCiAgICAibWlub3JWZXJzaW9uIjogNAogIH0sCiAgImxpY2Vuc2UiOiAiTUlUIiwKICAibWFjaGluZU5hbWUiOiAiSDVQLkZsYXNoY2FyZHMiLAogICJwcmVsb2FkZWRDc3MiOiBbCiAgICB7CiAgICAgICJwYXRoIjogImNzcy9mbGFzaGNhcmRzLmNzcyIKICAgIH0KICBdLAogICJwcmVsb2FkZWRKcyI6IFsKICAgIHsKICAgICAgInBhdGgiOiAianMveGFwaS5qcyIKICAgIH0sCiAgICB7CiAgICAgICJwYXRoIjogImpzL2ZsYXNoY2FyZHMuanMiCiAgICB9CiAgXSwKICAicHJlbG9hZGVkRGVwZW5kZW5jaWVzIjogWwogICAgewogICAgICAibWFjaGluZU5hbWUiOiAiRm9udEF3ZXNvbWUiLAogICAgICAibWFqb3JWZXJzaW9uIjogNCwKICAgICAgIm1pbm9yVmVyc2lvbiI6IDUKICAgIH0sCiAgICB7CiAgICAgICJtYWNoaW5lTmFtZSI6ICJINVAuSm91YmVsVUkiLAogICAgICAibWFqb3JWZXJzaW9uIjogMSwKICAgICAgIm1pbm9yVmVyc2lvbiI6IDMKICAgIH0sCiAgICB7CiAgICAgICJtYWNoaW5lTmFtZSI6ICJINVAuRm9udEljb25zIiwKICAgICAgIm1ham9yVmVyc2lvbiI6IDEsCiAgICAgICJtaW5vclZlcnNpb24iOiAwCiAgICB9CiAgXSwKICAiZWRpdG9yRGVwZW5kZW5jaWVzIjogWwogICAgewogICAgICAibWFjaGluZU5hbWUiOiAiSDVQRWRpdG9yLlZlcnRpY2FsVGFicyIsCiAgICAgICJtYWpvclZlcnNpb24iOiAxLAogICAgICAibWlub3JWZXJzaW9uIjogMwogICAgfQogIF0KfQ=="],"libraries\/H5P.Flashcards-1.5\/semantics.json":["application\/json","WwogIHsKICAgICJuYW1lIjogImRlc2NyaXB0aW9uIiwKICAgICJ0eXBlIjogInRleHQiLAogICAgImxhYmVsIjogIlRhc2sgZGVzY3JpcHRpb24iLAogICAgImltcG9ydGFuY2UiOiAiaGlnaCIKICB9LAogIHsKICAgICJuYW1lIjogImNhcmRzIiwKICAgICJ0eXBlIjogImxpc3QiLAogICAgIndpZGdldHMiOiBbCiAgICAgIHsKICAgICAgICAibmFtZSI6ICJWZXJ0aWNhbFRhYnMiLAogICAgICAgICJsYWJlbCI6ICJEZWZhdWx0IgogICAgICB9CiAgICBdLAogICAgImxhYmVsIjogIkNhcmRzIiwKICAgICJlbnRpdHkiOiAiY2FyZCIsCiAgICAiaW1wb3J0YW5jZSI6ICJoaWdoIiwKICAgICJtaW4iOiAxLAogICAgImRlZmF1bHROdW0iOiAxLAogICAgImZpZWxkIjogewogICAgICAibmFtZSI6ICJjYXJkIiwKICAgICAgInR5cGUiOiAiZ3JvdXAiLAogICAgICAibGFiZWwiOiAiQ2FyZCIsCiAgICAgICJpbXBvcnRhbmNlIjogImhpZ2giLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJuYW1lIjogInRleHQiLAogICAgICAgICAgInR5cGUiOiAidGV4dCIsCiAgICAgICAgICAibGFiZWwiOiAiUXVlc3Rpb24iLAogICAgICAgICAgImltcG9ydGFuY2UiOiAiaGlnaCIsCiAgICAgICAgICAib3B0aW9uYWwiOiB0cnVlLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9wdGlvbmFsIHRleHR1YWwgcXVlc3Rpb24gZm9yIHRoZSBjYXJkLiAoVGhlIGNhcmQgbWF5IHVzZSBqdXN0IGFuIGltYWdlLCBqdXN0IGEgdGV4dCBvciBib3RoKSIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJuYW1lIjogImFuc3dlciIsCiAgICAgICAgICAidHlwZSI6ICJ0ZXh0IiwKICAgICAgICAgICJsYWJlbCI6ICJBbnN3ZXIiLAogICAgICAgICAgImltcG9ydGFuY2UiOiAiaGlnaCIsCiAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiQW5zd2VyKHNvbHV0aW9uKSBmb3IgdGhlIGNhcmQuIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgIm5hbWUiOiAiaW1hZ2UiLAogICAgICAgICAgInR5cGUiOiAiaW1hZ2UiLAogICAgICAgICAgImxhYmVsIjogIkltYWdlIiwKICAgICAgICAgICJpbXBvcnRhbmNlIjogImhpZ2giLAogICAgICAgICAgIm9wdGlvbmFsIjogdHJ1ZSwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcHRpb25hbCBpbWFnZSBmb3IgdGhlIGNhcmQuIChUaGUgY2FyZCBtYXkgdXNlIGp1c3QgYW4gaW1hZ2UsIGp1c3QgYSB0ZXh0IG9yIGJvdGgpIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgIm5hbWUiOiAiaW1hZ2VBbHRUZXh0IiwKICAgICAgICAgICJ0eXBlIjogInRleHQiLAogICAgICAgICAgImxhYmVsIjogIkFsdGVybmF0aXZlIHRleHQgZm9yIGltYWdlIiwKICAgICAgICAgICJpbXBvcnRhbmNlIjogImhpZ2giLAogICAgICAgICAgIm9wdGlvbmFsIjogdHJ1ZQogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgIm5hbWUiOiAidGlwIiwKICAgICAgICAgICJ0eXBlIjogImdyb3VwIiwKICAgICAgICAgICJsYWJlbCI6ICJUaXAiLAogICAgICAgICAgImltcG9ydGFuY2UiOiAibG93IiwKICAgICAgICAgICJvcHRpb25hbCI6IHRydWUsCiAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICB7CiAgICAgICAgICAgICAgIm5hbWUiOiAidGlwIiwKICAgICAgICAgICAgICAibGFiZWwiOiAiVGlwIHRleHQiLAogICAgICAgICAgICAgICJpbXBvcnRhbmNlIjogImxvdyIsCiAgICAgICAgICAgICAgInR5cGUiOiAidGV4dCIsCiAgICAgICAgICAgICAgIndpZGdldCI6ICJodG1sIiwKICAgICAgICAgICAgICAidGFncyI6IFsKICAgICAgICAgICAgICAgICJwIiwKICAgICAgICAgICAgICAgICJiciIsCiAgICAgICAgICAgICAgICAic3Ryb25nIiwKICAgICAgICAgICAgICAgICJlbSIsCiAgICAgICAgICAgICAgICAiY29kZSIKICAgICAgICAgICAgICBdLAogICAgICAgICAgICAgICJvcHRpb25hbCI6IHRydWUKICAgICAgICAgICAgfQogICAgICAgICAgXQogICAgICAgIH0KICAgICAgXQogICAgfQogIH0sCiAgewogICAgImxhYmVsIjogIlByb2dyZXNzIHRleHQiLAogICAgIm5hbWUiOiAicHJvZ3Jlc3NUZXh0IiwKICAgICJ0eXBlIjogInRleHQiLAogICAgImRlZmF1bHQiOiAiQ2FyZCBAY2FyZCBvZiBAdG90YWwiLAogICAgImltcG9ydGFuY2UiOiAibG93IiwKICAgICJkZXNjcmlwdGlvbiI6ICJQcm9ncmVzcyB0ZXh0LCB2YXJpYWJsZXMgYXZhaWxhYmxlOiBAY2FyZCBhbmQgQHRvdGFsLiBFeGFtcGxlOiAnQ2FyZCBAY2FyZCBvZiBAdG90YWwnIiwKICAgICJjb21tb24iOiB0cnVlCiAgfSwKICB7CiAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIG5leHQgYnV0dG9uIiwKICAgICJuYW1lIjogIm5leHQiLAogICAgInR5cGUiOiAidGV4dCIsCiAgICAiZGVmYXVsdCI6ICJOZXh0IiwKICAgICJpbXBvcnRhbmNlIjogImxvdyIsCiAgICAiY29tbW9uIjogdHJ1ZQogIH0sCiAgewogICAgImxhYmVsIjogIlRleHQgZm9yIHRoZSBwcmV2aW91cyBidXR0b24iLAogICAgIm5hbWUiOiAicHJldmlvdXMiLAogICAgInR5cGUiOiAidGV4dCIsCiAgICAiZGVmYXVsdCI6ICJQcmV2aW91cyIsCiAgICAiaW1wb3J0YW5jZSI6ICJsb3ciLAogICAgImNvbW1vbiI6IHRydWUKICB9LAogIHsKICAgICJsYWJlbCI6ICJUZXh0IGZvciB0aGUgY2hlY2sgYW5zd2VycyBidXR0b24iLAogICAgIm5hbWUiOiAiY2hlY2tBbnN3ZXJUZXh0IiwKICAgICJ0eXBlIjogInRleHQiLAogICAgImRlZmF1bHQiOiAiQ2hlY2siLAogICAgImltcG9ydGFuY2UiOiAibG93IiwKICAgICJjb21tb24iOiB0cnVlCiAgfSwKICB7CiAgICAibGFiZWwiOiAiUmVxdWlyZSB1c2VyIGlucHV0IGJlZm9yZSB0aGUgc29sdXRpb24gY2FuIGJlIHZpZXdlZCIsCiAgICAibmFtZSI6ICJzaG93U29sdXRpb25zUmVxdWlyZXNJbnB1dCIsCiAgICAidHlwZSI6ICJib29sZWFuIiwKICAgICJkZWZhdWx0IjogdHJ1ZSwKICAgICJpbXBvcnRhbmNlIjogImxvdyIsCiAgICAib3B0aW9uYWwiOiB0cnVlCiAgfSwKICB7CiAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIGFuc3dlciBpbnB1dCBmaWVsZCIsCiAgICAibmFtZSI6ICJkZWZhdWx0QW5zd2VyVGV4dCIsCiAgICAidHlwZSI6ICJ0ZXh0IiwKICAgICJkZWZhdWx0IjogIllvdXIgYW5zd2VyIiwKICAgICJpbXBvcnRhbmNlIjogImxvdyIsCiAgICAiY29tbW9uIjogdHJ1ZQogIH0sCiAgewogICAgImxhYmVsIjogIlRleHQgZm9yIGNvcnJlY3QgYW5zd2VyIiwKICAgICJuYW1lIjogImNvcnJlY3RBbnN3ZXJUZXh0IiwKICAgICJ0eXBlIjogInRleHQiLAogICAgImRlZmF1bHQiOiAiQ29ycmVjdCIsCiAgICAiaW1wb3J0YW5jZSI6ICJsb3ciLAogICAgImNvbW1vbiI6IHRydWUKICB9LAogIHsKICAgICJsYWJlbCI6ICJUZXh0IGZvciBpbmNvcnJlY3QgYW5zd2VyIiwKICAgICJuYW1lIjogImluY29ycmVjdEFuc3dlclRleHQiLAogICAgInR5cGUiOiAidGV4dCIsCiAgICAiZGVmYXVsdCI6ICJJbmNvcnJlY3QiLAogICAgImltcG9ydGFuY2UiOiAibG93IiwKICAgICJjb21tb24iOiB0cnVlCiAgfSwKICB7CiAgICAibGFiZWwiOiAiU2hvdyBzb2x1dGlvbiB0ZXh0IiwKICAgICJuYW1lIjogInNob3dTb2x1dGlvblRleHQiLAogICAgInR5cGUiOiAidGV4dCIsCiAgICAiZGVmYXVsdCI6ICJDb3JyZWN0IGFuc3dlciIsCiAgICAiaW1wb3J0YW5jZSI6ICJsb3ciLAogICAgImNvbW1vbiI6IHRydWUKICB9LAogIHsKICAgICJsYWJlbCI6ICJUZXh0IGZvciByZXN1bHRzIHRpdGxlIiwKICAgICJuYW1lIjogInJlc3VsdHMiLAogICAgInR5cGUiOiAidGV4dCIsCiAgICAiZGVmYXVsdCI6ICJSZXN1bHRzIiwKICAgICJpbXBvcnRhbmNlIjogImxvdyIsCiAgICAiY29tbW9uIjogdHJ1ZQogIH0sCiAgewogICAgImxhYmVsIjogIlRleHQgZm9yIG51bWJlciBvZiBjb3JyZWN0IiwKICAgICJuYW1lIjogIm9mQ29ycmVjdCIsCiAgICAidHlwZSI6ICJ0ZXh0IiwKICAgICJkZWZhdWx0IjogIkBzY29yZSBvZiBAdG90YWwgY29ycmVjdCIsCiAgICAiaW1wb3J0YW5jZSI6ICJsb3ciLAogICAgImRlc2NyaXB0aW9uIjogIlJlc3VsdCB0ZXh0LCB2YXJpYWJsZXMgYXZhaWxhYmxlOiBAc2NvcmUgYW5kIEB0b3RhbC4gRXhhbXBsZTogJ0BzY29yZSBvZiBAdG90YWwgY29ycmVjdCciLAogICAgImNvbW1vbiI6IHRydWUKICB9LAogIHsKICAgICJsYWJlbCI6ICJUZXh0IGZvciBzaG93IHJlc3VsdHMiLAogICAgIm5hbWUiOiAic2hvd1Jlc3VsdHMiLAogICAgInR5cGUiOiAidGV4dCIsCiAgICAiZGVmYXVsdCI6ICJTaG93IHJlc3VsdHMiLAogICAgImltcG9ydGFuY2UiOiAibG93IiwKICAgICJjb21tb24iOiB0cnVlCiAgfSwKICB7CiAgICAibGFiZWwiOiAiVGV4dCBmb3Igc2hvcnQgYW5zd2VyIGxhYmVsIiwKICAgICJuYW1lIjogImFuc3dlclNob3J0VGV4dCIsCiAgICAidHlwZSI6ICJ0ZXh0IiwKICAgICJkZWZhdWx0IjogIkE6IiwKICAgICJpbXBvcnRhbmNlIjogImxvdyIsCiAgICAiY29tbW9uIjogdHJ1ZQogIH0sCiAgewogICAgImxhYmVsIjogIlRleHQgZm9yIFwicmV0cnlcIiBidXR0b24iLAogICAgIm5hbWUiOiAicmV0cnkiLAogICAgInR5cGUiOiAidGV4dCIsCiAgICAiZGVmYXVsdCI6ICJSZXRyeSIsCiAgICAiaW1wb3J0YW5jZSI6ICJsb3ciLAogICAgImNvbW1vbiI6IHRydWUKICB9LAogIHsKICAgICJsYWJlbCI6ICJDYXNlIHNlbnNpdGl2ZSIsCiAgICAibmFtZSI6ICJjYXNlU2Vuc2l0aXZlIiwKICAgICJ0eXBlIjogImJvb2xlYW4iLAogICAgImRlZmF1bHQiOiBmYWxzZSwKICAgICJkZXNjcmlwdGlvbiI6ICJNYWtlcyBzdXJlIHRoZSB1c2VyIGlucHV0IGhhcyB0byBiZSBleGFjdGx5IHRoZSBzYW1lIGFzIHRoZSBhbnN3ZXIuIgogIH0sCiAgewogICAgImxhYmVsIjogIkluY29ycmVjdCB0ZXh0IGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICJuYW1lIjogImNhcmRBbm5vdW5jZW1lbnQiLAogICAgInR5cGUiOiAidGV4dCIsCiAgICAiZGVmYXVsdCI6ICJJbmNvcnJlY3QgYW5zd2VyLiBDb3JyZWN0IGFuc3dlciB3YXMgQGFuc3dlciIsCiAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMuIFVzZSBAYW5zd2VyIGFzIHZhcmlhYmxlLiIsCiAgICAiY29tbW9uIjogdHJ1ZQogIH0sCiAgewogICAgImxhYmVsIjogIkNvcnJlY3QgZmVlZGJhY2sgdGV4dCBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAibmFtZSI6ICJjb3JyZWN0QW5zd2VyQW5ub3VuY2VtZW50IiwKICAgICJ0eXBlIjogInRleHQiLAogICAgImRlZmF1bHQiOiAiQGFuc3dlciBpcyBjb3JyZWN0LiIsCiAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMgd2hlbiBhIGNhcmQgaXMgYW5zd2VyZWQgY29ycmVjdGx5LiBVc2UgQGFuc3dlciBhcyB2YXJpYWJsZS4iLAogICAgImNvbW1vbiI6IHRydWUKICB9LAogIHsKICAgICJsYWJlbCI6ICJDYXJkIGNoYW5nZSBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAibmFtZSI6ICJwYWdlQW5ub3VuY2VtZW50IiwKICAgICJ0eXBlIjogInRleHQiLAogICAgImRlZmF1bHQiOiAiUGFnZSBAY3VycmVudCBvZiBAdG90YWwiLAogICAgImRlc2NyaXB0aW9uIjogIlRleHQgdGhhdCB3aWxsIGJlIGFubm91bmNlZCB0byBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIHdoZW4gbmF2aWdhdGluZyBiZXR3ZWVuIGNhcmRzLiBVc2UgQGN1cnJlbnQgYW5kIEB0b3RhbCBhcyB2YXJpYWJsZXMuIiwKICAgICJjb21tb24iOiB0cnVlCiAgfQpd"],"libraries\/H5P.FontIcons-1.0\/library.json":["application\/json","ewogICJ0aXRsZSI6ICJINVAuRm9udEljb25zIiwKICAibWFqb3JWZXJzaW9uIjogMSwKICAibWlub3JWZXJzaW9uIjogMCwKICAicGF0Y2hWZXJzaW9uIjogNiwKICAicnVubmFibGUiOiAwLAogICJtYWNoaW5lTmFtZSI6ICJINVAuRm9udEljb25zIiwKICAiYXV0aG9yIjogIkpvdWJlbCIsCiAgInByZWxvYWRlZENzcyI6IFsKICAgIHsKICAgICAgInBhdGgiOiAic3R5bGVzL2g1cC1mb250LWljb25zLmNzcyIKICAgIH0KICBdCn0K"],"libraries\/H5P.JoubelUI-1.3\/library.json":["application\/json","ewogICJ0aXRsZSI6ICJKb3ViZWwgVUkiLAogICJjb250ZW50VHlwZSI6ICJVdGlsaXR5IiwKICAiZGVzY3JpcHRpb24iOiAiVUkgdXRpbGl0eSBsaWJyYXJ5IiwKICAibWFqb3JWZXJzaW9uIjogMSwKICAibWlub3JWZXJzaW9uIjogMywKICAicGF0Y2hWZXJzaW9uIjogMTQsCiAgInJ1bm5hYmxlIjogMCwKICAiY29yZUFwaSI6IHsKICAgICJtYWpvclZlcnNpb24iOiAxLAogICAgIm1pbm9yVmVyc2lvbiI6IDMKICB9LAogICJtYWNoaW5lTmFtZSI6ICJINVAuSm91YmVsVUkiLAogICJhdXRob3IiOiAiSm91YmVsIiwKICAicHJlbG9hZGVkSnMiOiBbCiAgICB7CiAgICAgICJwYXRoIjogImpzL2pvdWJlbC1oZWxwLWRpYWxvZy5qcyIKICAgIH0sCiAgICB7CiAgICAgICJwYXRoIjogImpzL2pvdWJlbC1tZXNzYWdlLWRpYWxvZy5qcyIKICAgIH0sCiAgICB7CiAgICAgICJwYXRoIjogImpzL2pvdWJlbC1wcm9ncmVzcy1jaXJjbGUuanMiCiAgICB9LAogICAgewogICAgICAicGF0aCI6ICJqcy9qb3ViZWwtc2ltcGxlLXJvdW5kZWQtYnV0dG9uLmpzIgogICAgfSwKICAgIHsKICAgICAgInBhdGgiOiAianMvam91YmVsLXNwZWVjaC1idWJibGUuanMiCiAgICB9LAogICAgewogICAgICAicGF0aCI6ICJqcy9qb3ViZWwtdGhyb2JiZXIuanMiCiAgICB9LAogICAgewogICAgICAicGF0aCI6ICJqcy9qb3ViZWwtdGlwLmpzIgogICAgfSwKICAgIHsKICAgICAgInBhdGgiOiAianMvam91YmVsLXNsaWRlci5qcyIKICAgIH0sCiAgICB7CiAgICAgICJwYXRoIjogImpzL2pvdWJlbC1zY29yZS1iYXIuanMiCiAgICB9LAogICAgewogICAgICAicGF0aCI6ICJqcy9qb3ViZWwtcHJvZ3Jlc3NiYXIuanMiCiAgICB9LAogICAgewogICAgICAicGF0aCI6ICJqcy9qb3ViZWwtdWkuanMiCiAgICB9CiAgXSwKICAicHJlbG9hZGVkQ3NzIjogWwogICAgewogICAgICAicGF0aCI6ICJjc3Mvam91YmVsLWhlbHAtZGlhbG9nLmNzcyIKICAgIH0sCiAgICB7CiAgICAgICJwYXRoIjogImNzcy9qb3ViZWwtbWVzc2FnZS1kaWFsb2cuY3NzIgogICAgfSwKICAgIHsKICAgICAgInBhdGgiOiAiY3NzL2pvdWJlbC1wcm9ncmVzcy1jaXJjbGUuY3NzIgogICAgfSwKICAgIHsKICAgICAgInBhdGgiOiAiY3NzL2pvdWJlbC1zaW1wbGUtcm91bmRlZC1idXR0b24uY3NzIgogICAgfSwKICAgIHsKICAgICAgInBhdGgiOiAiY3NzL2pvdWJlbC1zcGVlY2gtYnViYmxlLmNzcyIKICAgIH0sCiAgICB7CiAgICAgICJwYXRoIjogImNzcy9qb3ViZWwtdGlwLmNzcyIKICAgIH0sCiAgICB7CiAgICAgICJwYXRoIjogImNzcy9qb3ViZWwtc2xpZGVyLmNzcyIKICAgIH0sCiAgICB7CiAgICAgICJwYXRoIjogImNzcy9qb3ViZWwtc2NvcmUtYmFyLmNzcyIKICAgIH0sCiAgICB7CiAgICAgICJwYXRoIjogImNzcy9qb3ViZWwtcHJvZ3Jlc3NiYXIuY3NzIgogICAgfSwKICAgIHsKICAgICAgInBhdGgiOiAiY3NzL2pvdWJlbC11aS5jc3MiCiAgICB9LAogICAgewogICAgICAicGF0aCI6ICJjc3Mvam91YmVsLWljb24uY3NzIgogICAgfQogIF0sCiAgInByZWxvYWRlZERlcGVuZGVuY2llcyI6IFsKICAgIHsKICAgICAgIm1hY2hpbmVOYW1lIjogIkZvbnRBd2Vzb21lIiwKICAgICAgIm1ham9yVmVyc2lvbiI6IDQsCiAgICAgICJtaW5vclZlcnNpb24iOiA1CiAgICB9LAogICAgewogICAgICAibWFjaGluZU5hbWUiOiAiSDVQLlRyYW5zaXRpb24iLAogICAgICAibWFqb3JWZXJzaW9uIjogMSwKICAgICAgIm1pbm9yVmVyc2lvbiI6IDAKICAgIH0sCiAgICB7CiAgICAgICJtYWNoaW5lTmFtZSI6ICJINVAuRm9udEljb25zIiwKICAgICAgIm1ham9yVmVyc2lvbiI6IDEsCiAgICAgICJtaW5vclZlcnNpb24iOiAwCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Transition-1.0\/library.json":["application\/json","ewogICJtYWNoaW5lTmFtZSI6ICJINVAuVHJhbnNpdGlvbiIsCiAgInRpdGxlIjogIlRyYW5zaXRpb24iLAogICJkZXNjcmlwdGlvbiI6ICJDb250YWlucyBoZWxwZXIgZnVuY3Rpb24gcmVsZXZhbnQgZm9yIHRyYW5zaXRpb25pbmciLAogICJsaWNlbnNlIjogIk1JVCIsCiAgImF1dGhvciI6ICJKb3ViZWwiLAogICJtYWpvclZlcnNpb24iOiAxLAogICJtaW5vclZlcnNpb24iOiAwLAogICJwYXRjaFZlcnNpb24iOiA0LAogICJydW5uYWJsZSI6IDAsCiAgInByZWxvYWRlZEpzIjogWwogICAgewogICAgICAicGF0aCI6ICJ0cmFuc2l0aW9uLmpzIgogICAgfQogIF0KfQ=="]});		H5PIntegration	= (function(x){
			let url	= window.location.href.split('/');
			url.pop();
			x.url	= url.join('/');
			return x;
		})({"baseUrl":"","url":"","siteUrl":"","l10n":{"H5P":{"fullscreen":"Vollbild","disableFullscreen":"Kein Vollbild","download":"Download","copyrights":"Nutzungsrechte","embed":"Einbetten","size":"Size","showAdvanced":"Show advanced","hideAdvanced":"Hide advanced","advancedHelp":"Include this script on your website if you want dynamic sizing of the embedded content:","copyrightInformation":"Nutzungsrechte","close":"Schlie\u00dfen","title":"Titel","author":"Autor","year":"Jahr","source":"Quelle","license":"Lizenz","thumbnail":"Thumbnail","noCopyrights":"Keine Copyright-Informationen vorhanden","reuse":"Wiederverwenden","reuseContent":"Verwende Inhalt","reuseDescription":"Verwende Inhalt.","downloadDescription":"Lade den Inhalt als H5P-Datei herunter.","copyrightsDescription":"Zeige Urheberinformationen an.","embedDescription":"Zeige den Code f\u00fcr die Einbettung an.","h5pDescription":"Visit H5P.org to check out more cool content.","contentChanged":"Dieser Inhalt hat sich seit Ihrer letzten Nutzung ver\u00e4ndert.","startingOver":"Sie beginnen von vorne.","by":"von","showMore":"Zeige mehr","showLess":"Zeige weniger","subLevel":"Sublevel","confirmDialogHeader":"Best\u00e4tige Aktion","confirmDialogBody":"Please confirm that you wish to proceed. This action is not reversible.","cancelLabel":"Abbrechen","confirmLabel":"Best\u00e4tigen","licenseU":"Undisclosed","licenseCCBY":"Attribution","licenseCCBYSA":"Attribution-ShareAlike","licenseCCBYND":"Attribution-NoDerivs","licenseCCBYNC":"Attribution-NonCommercial","licenseCCBYNCSA":"Attribution-NonCommercial-ShareAlike","licenseCCBYNCND":"Attribution-NonCommercial-NoDerivs","licenseCC40":"4.0 International","licenseCC30":"3.0 Unported","licenseCC25":"2.5 Generic","licenseCC20":"2.0 Generic","licenseCC10":"1.0 Generic","licenseGPL":"General Public License","licenseV3":"Version 3","licenseV2":"Version 2","licenseV1":"Version 1","licensePD":"Public Domain","licenseCC010":"CC0 1.0 Universal (CC0 1.0) Public Domain Dedication","licensePDM":"Public Domain Mark","licenseC":"Copyright","contentType":"Inhaltstyp","licenseExtras":"License Extras","changes":"Changelog","contentCopied":"Inhalt wurde ins Clipboard kopiert","connectionLost":"Connection lost. Results will be stored and sent when you regain connection.","connectionReestablished":"Connection reestablished.","resubmitScores":"Attempting to submit stored results.","offlineDialogHeader":"Your connection to the server was lost","offlineDialogBody":"We were unable to send information about your completion of this task. Please check your internet connection.","offlineDialogRetryMessage":"Versuche es wieder in :num....","offlineDialogRetryButtonLabel":"Jetzt nochmal probieren","offlineSuccessfulSubmit":"Erfolgreich Ergebnisse gesendet."}},"hubIsEnabled":false,"reportingIsEnabled":false,"libraryConfig":null,"crossorigin":null,"crossoriginCacheBuster":null,"pluginCacheBuster":"","libraryUrl":".\/libraries\/h5pcore\/js","contents":{"cid-tense-953":{"displayOptions":{"copy":false,"copyright":false,"embed":false,"export":false,"frame":false,"icon":false},"embedCode":"","exportUrl":false,"fullScreen":false,"contentUserData":[],"metadata":{"title":"Tense","license":"U"},"library":"H5P.Flashcards 1.5","jsonContent":"{\"cards\":[{\"image\":{\"path\":\"images\\\/image-60ec19901f3de.jpg\",\"mime\":\"image\\\/jpeg\",\"copyright\":{\"license\":\"U\"},\"width\":852,\"height\":994},\"text\":\"Mother is knitting a sweater for me.\",\"answer\":\"Mother was knitting a sweater for me.\",\"tip\":\"<p><strong>Change into past continuous tense.<\\\/strong><\\\/p>\\n\"},{\"image\":{\"path\":\"images\\\/image-60ec1a7e6da02.jpg\",\"mime\":\"image\\\/jpeg\",\"copyright\":{\"license\":\"U\"},\"width\":994,\"height\":924},\"text\":\"I am continuing to do my homework.\",\"answer\":\"I will be continuing to do my homework.\",\"tip\":\"<p><strong>Change into future continuous.<\\\/strong><\\\/p>\\n\"},{\"image\":{\"path\":\"images\\\/image-60ec1c7c10d00.jpg\",\"mime\":\"image\\\/jpeg\",\"copyright\":{\"license\":\"U\"},\"width\":995,\"height\":711},\"text\":\"I watched that movie yesterday.\",\"answer\":\"I had watched that movie yesterday.\",\"tip\":\"<p><strong>Change into past perfect.<\\\/strong><\\\/p>\\n\"},{\"image\":{\"path\":\"images\\\/image-60ec1ca57801f.jpg\",\"mime\":\"image\\\/jpeg\",\"copyright\":{\"license\":\"U\"},\"width\":994,\"height\":727},\"text\":\"The doctor checks up on the patient.\",\"answer\":\"The doctor is checking up on the patient.\",\"tip\":\"<p><strong>Change into present continuous.<\\\/strong><\\\/p>\\n\"},{\"text\":\"The farmers water their fields in the morning.\",\"image\":{\"path\":\"images\\\/image-60ec1ba876d87.jpg\",\"mime\":\"image\\\/jpeg\",\"copyright\":{\"license\":\"U\"},\"width\":1000,\"height\":696},\"answer\":\"The farmers will be watering their fields in the morning.\",\"tip\":\"<p><strong>Change into future continuous.<\\\/strong><\\\/p>\\n\"},{\"image\":{\"path\":\"images\\\/image-60ec1d144171a.jpg\",\"mime\":\"image\\\/jpeg\",\"copyright\":{\"license\":\"U\"},\"width\":994,\"height\":965},\"text\":\"The girl won the first prize in the competition.\",\"answer\":\"The girl had won the first prize in the competition.\",\"tip\":\"<p><strong>Change into past perfect tense.<\\\/strong><\\\/p>\\n\"},{\"text\":\"My grandfather always goes for a walk in the morning.\",\"image\":{\"path\":\"images\\\/image-60ec1e29df4bd.jpg\",\"mime\":\"image\\\/jpeg\",\"copyright\":{\"license\":\"U\"},\"width\":995,\"height\":692},\"answer\":\"My grandfather always went for a walk in the morning.\",\"tip\":\"<p><strong>Change into simple past tense.<\\\/strong><\\\/p>\\n\"},{\"image\":{\"path\":\"images\\\/image-60ec1eeb25b4d.jpg\",\"mime\":\"image\\\/jpeg\",\"copyright\":{\"license\":\"U\"},\"width\":994,\"height\":790},\"text\":\"Lena displayed a keen interest in the project.\",\"answer\":\"Lena displays a keen interest in the project.\",\"tip\":\"<p><strong>Change into simple present tense.<\\\/strong><\\\/p>\\n\"},{\"image\":{\"path\":\"images\\\/image-60ec1f6e43946.jpg\",\"mime\":\"image\\\/jpeg\",\"copyright\":{\"license\":\"U\"},\"width\":1000,\"height\":687},\"answer\":\"Jae will mop the floor and Jamie will clean the dishes.\",\"tip\":\"<p><strong>Change into simple future tense.<\\\/strong><\\\/p>\\n\",\"text\":\"Jae mopped the floor and Jamie cleaned the dishes.\"},{\"image\":{\"path\":\"images\\\/image-60ec1ffccac02.jpg\",\"mime\":\"image\\\/jpeg\",\"copyright\":{\"license\":\"U\"},\"width\":1000,\"height\":673},\"text\":\"They were playing in the garden.\",\"answer\":\"They are playing in the garden.\",\"tip\":\"<p><strong>Change into present continuous tense.<\\\/strong><\\\/p>\\n\"}],\"progressText\":\"Card @card of @total\",\"next\":\"Next\",\"previous\":\"Previous\",\"checkAnswerText\":\"Check\",\"showSolutionsRequiresInput\":true,\"defaultAnswerText\":\"Your answer\",\"correctAnswerText\":\"Correct\",\"incorrectAnswerText\":\"Incorrect\",\"showSolutionText\":\"Correct answer\",\"results\":\"Results\",\"ofCorrect\":\"@score of @total correct\",\"showResults\":\"Show results\",\"answerShortText\":\"A:\",\"retry\":\"Retry\",\"caseSensitive\":true,\"cardAnnouncement\":\"Incorrect answer. Correct answer was @answer\",\"pageAnnouncement\":\"Page @current of @total\",\"description\":\"Change the tense of the following sentences as instructed.\"}"}}});