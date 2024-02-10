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
    self.STAR_MARKUP = '<svg tabindex="-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 63.77 53.87" aria-hidden="true" focusable="false">' +
        '<title>star</title>' +
        '<filter tabindex="-1" id="h5p-joubelui-score-bar-star-inner-shadow-' + idCounter + '" x0="-50%" y0="-50%" width="200%" height="200%">' +
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
        '<path tabindex="-1" class="h5p-joubelui-score-bar-star-shadow" d="M35.08,43.41V9.16H20.91v0L9.51,10.85,9,10.93C2.8,12.18,0,17,0,21.25a11.22,11.22,0,0,0,3,7.48l8.73,8.53-1.07,6.16Z"/>' +
        '<g tabindex="-1">' +
          '<path tabindex="-1" class="h5p-joubelui-score-bar-star-border" d="M61.36,22.8,49.72,34.11l2.78,16a2.6,2.6,0,0,1,.05.64c0,.85-.37,1.6-1.33,1.6A2.74,2.74,0,0,1,49.94,52L35.58,44.41,21.22,52a2.93,2.93,0,0,1-1.28.37c-.91,0-1.33-.75-1.33-1.6,0-.21.05-.43.05-.64l2.78-16L9.8,22.8A2.57,2.57,0,0,1,9,21.25c0-1,1-1.33,1.81-1.49l16.07-2.35L34.09,2.83c.27-.59.85-1.33,1.55-1.33s1.28.69,1.55,1.33l7.21,14.57,16.07,2.35c.75.11,1.81.53,1.81,1.49A3.07,3.07,0,0,1,61.36,22.8Z"/>' +
          '<path tabindex="-1" class="h5p-joubelui-score-bar-star-fill" d="M61.36,22.8,49.72,34.11l2.78,16a2.6,2.6,0,0,1,.05.64c0,.85-.37,1.6-1.33,1.6A2.74,2.74,0,0,1,49.94,52L35.58,44.41,21.22,52a2.93,2.93,0,0,1-1.28.37c-.91,0-1.33-.75-1.33-1.6,0-.21.05-.43.05-.64l2.78-16L9.8,22.8A2.57,2.57,0,0,1,9,21.25c0-1,1-1.33,1.81-1.49l16.07-2.35L34.09,2.83c.27-.59.85-1.33,1.55-1.33s1.28.69,1.55,1.33l7.21,14.57,16.07,2.35c.75.11,1.81.53,1.81,1.49A3.07,3.07,0,0,1,61.36,22.8Z"/>' +
          '<path tabindex="-1" filter="url(#h5p-joubelui-score-bar-star-inner-shadow-' + idCounter + ')" class="h5p-joubelui-score-bar-star-fill-full-score" d="M61.36,22.8,49.72,34.11l2.78,16a2.6,2.6,0,0,1,.05.64c0,.85-.37,1.6-1.33,1.6A2.74,2.74,0,0,1,49.94,52L35.58,44.41,21.22,52a2.93,2.93,0,0,1-1.28.37c-.91,0-1.33-.75-1.33-1.6,0-.21.05-.43.05-.64l2.78-16L9.8,22.8A2.57,2.57,0,0,1,9,21.25c0-1,1-1.33,1.81-1.49l16.07-2.35L34.09,2.83c.27-.59.85-1.33,1.55-1.33s1.28.69,1.55,1.33l7.21,14.57,16.07,2.35c.75.11,1.81.53,1.81,1.49A3.07,3.07,0,0,1,61.36,22.8Z"/>' +
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

  // Alternative Reporting
  const XAPI_ALTERNATIVE_EXTENSION = 'https://h5p.org/x-api/alternatives';
  const XAPI_CASE_SENSITIVITY = 'https://h5p.org/x-api/case-sensitivity';
  const XAPI_REPORTING_VERSION_EXTENSION = 'https://h5p.org/x-api/h5p-reporting-version';
  const XAPI_REPORTING_VERSION = '1.1.0';

  const getXapiEvent = function (instance) {
    const xAPIEvent = instance.createXAPIEventTemplate('answered');

    const definition = xAPIEvent.getVerifiedStatementValue(['object', 'definition']);
    $.extend(true, definition, getxAPIDefinition(instance));

    if (definition.extensions && definition.extensions[XAPI_ALTERNATIVE_EXTENSION]) {
      const context = xAPIEvent.getVerifiedStatementValue(['context']);
      context.extensions = context.extensions || {};
      context.extensions[XAPI_REPORTING_VERSION_EXTENSION] = XAPI_REPORTING_VERSION;
    }

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

    const solutionsAll = instance.options.cards.map(function (card) {
      return H5P.Flashcards.splitAlternatives(card.answer);
    });

    // Fallback CRP, could cause computational hazard if computed fully
    const crpAnswers = solutionsAll.map(function (solutions) {
      return solutions[0];
    }).join('[,]');

    definition.correctResponsesPattern = [
      '{case_matters=' + instance.options.caseSensitive + '}' + crpAnswers
    ];

    const cardDescriptions = instance.options.cards.map(function (card) {
      return '<p>' + card.text + ' ' + placeHolder + '</p>';
    }).join('');

    definition.description['en-US'] += cardDescriptions;

    /*
     * Add H5P Alternative extension which provides all combinations of
     * different answers. Reporting software will need to support this extension
     * for alternatives to work.
     */
    definition.extensions = definition.extensions || {};
    definition.extensions[XAPI_CASE_SENSITIVITY] = instance.options.caseSensitive;
    definition.extensions[XAPI_ALTERNATIVE_EXTENSION] = solutionsAll;

    return definition;
  };

  return {
    getXapiEvent: getXapiEvent,
  };
})(H5P.jQuery);
;/**
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
      showSolutionText: "Correct answer(s)",
      answerShortText: "A:",
      informationText: "Information",
      caseSensitive: false,
      randomCards: false,
      results: "Results",
      ofCorrect: "@score of @total correct",
      showResults: "Show results",
      retry : "Retry",
      cardAnnouncement: 'Incorrect answer. Correct answer was @answer',
      pageAnnouncement: 'Page @current of @total',
      correctAnswerAnnouncement: '@answer is correct!'
    }, options);
    this.$images = [];
    this.hasBeenReset = false;

    this.on('resize', this.resize, this);

    if (this.options.randomCards === true) {
      this.options.cards = this.shuffle(this.options.cards);
    }
  }

  C.prototype = Object.create(H5P.EventDispatcher.prototype);
  C.prototype.constructor = C;

  /**
   * Process HTML escaped string for use as attribute value,
   * e.g. for alt text or title attributes.
   *
   * @param {string} value
   * @return {string} WARNING! Do NOT use for innerHTML.
   */
  const massageAttributeOutput = value => {
    const dparser = new DOMParser().parseFromString(value, 'text/html');
    const div = document.createElement('div');
    div.innerHTML = dparser.documentElement.textContent;;
    return div.textContent || div.innerText || '';
  };

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
          $image.attr('alt', massageAttributeOutput(card.imageAltText));
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

    return C.splitAlternatives(answer).indexOf(userAnswer, '') !== -1;
  }

  /**
   * Shuffle the cards.
   * @param {object} card Cards.
   */
  C.prototype.shuffle = function (cards) {
    let currentIndex = cards.length;
    let tmp;
    let randomIndex;

    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      tmp = cards[currentIndex];
      cards[currentIndex] = cards[randomIndex];
      cards[randomIndex] = tmp;
    }

    return cards;
  };

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
            '<span class="solution-text">' +
              (that.options.cards[index].answer ?
                that.options.showSolutionText + ': ' + C.splitAlternatives(that.options.cards[index].answer).join(', ') :
                '') + '</span>' +
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
        that.trigger(XapiGenerator.getXapiEvent(that));
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
        $resultsAnswer.append('<span class="h5p-correct">' + C.splitAlternatives(card.answer).join(', ') + '</span>');
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
   * Split text by / while respecting \/ as escaped /.
   * @param {string} text Text to split.
   * @param {string} [delimiter='/'] Delimiter.
   * @param {string} [escaper='\\'] Escape sequence, default: single backslash.
   * @return {string[]} Split text.
   */
  C.splitAlternatives = function (text, delimiter, escaper) {
    text = text || '';
    delimiter = delimiter || '/';
    escaper = escaper || '\\';

    while (text.indexOf(escaper + delimiter) !== -1) {
      text = text.replace(escaper + delimiter, '\u001a');
    }

    return text
      .split(delimiter)
      .map(function (element) {
        return element = element.replace(/\u001a/g, delimiter).trim();
      });
  };

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
			})(XMLHttpRequest.prototype.open, window.fetch, {"libraries\/FontAwesome-4.5\/library.json":["application\/json","ewogICJ0aXRsZSI6ICJGb250IEF3ZXNvbWUiLAogICJjb250ZW50VHlwZSI6ICJGb250IiwKICAibWFqb3JWZXJzaW9uIjogNCwKICAibWlub3JWZXJzaW9uIjogNSwKICAicGF0Y2hWZXJzaW9uIjogNCwKICAicnVubmFibGUiOiAwLAogICJtYWNoaW5lTmFtZSI6ICJGb250QXdlc29tZSIsCiAgImxpY2Vuc2UiOiAiTUlUIiwKICAiYXV0aG9yIjogIkRhdmUgR2FuZHkiLAogICJwcmVsb2FkZWRDc3MiOiBbCiAgICB7CiAgICAgICJwYXRoIjogImg1cC1mb250LWF3ZXNvbWUubWluLmNzcyIKICAgIH0KICBdCn0="],"libraries\/H5PEditor.VerticalTabs-1.3\/library.json":["application\/json","ewogICJtYWNoaW5lTmFtZSI6ICJINVBFZGl0b3IuVmVydGljYWxUYWJzIiwKICAidGl0bGUiOiAiSDVQIEVkaXRvciBWZXJ0aWNhbCBUYWJzIiwKICAibGljZW5zZSI6ICJNSVQiLAogICJhdXRob3IiOiAiSm91YmVsIiwKICAibWFqb3JWZXJzaW9uIjogMSwKICAibWlub3JWZXJzaW9uIjogMywKICAicGF0Y2hWZXJzaW9uIjogOSwKICAicnVubmFibGUiOiAwLAogICJjb3JlQXBpIjogewogICAgIm1ham9yVmVyc2lvbiI6IDEsCiAgICAibWlub3JWZXJzaW9uIjogMjQKICB9LAogICJwcmVsb2FkZWRKcyI6IFsKICAgIHsKICAgICAgInBhdGgiOiAidmVydGljYWwtdGFicy5qcyIKICAgIH0KICBdLAogICJwcmVsb2FkZWRDc3MiOiBbCiAgICB7CiAgICAgICJwYXRoIjogInN0eWxlcy9jc3MvdmVydGljYWwtdGFicy5jc3MiCiAgICB9CiAgXSwKICAicHJlbG9hZGVkRGVwZW5kZW5jaWVzIjogWwogICAgewogICAgICAibWFjaGluZU5hbWUiOiAiRm9udEF3ZXNvbWUiLAogICAgICAibWFqb3JWZXJzaW9uIjogNCwKICAgICAgIm1pbm9yVmVyc2lvbiI6IDUKICAgIH0KICBdCn0K"],"libraries\/H5P.Flashcards-1.7\/language\/af.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJUYWFrIGJlc2tyeXdpbmciCiAgICB9LAogICAgewogICAgICAid2lkZ2V0cyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiVmVyc3RlayIKICAgICAgICB9CiAgICAgIF0sCiAgICAgICJsYWJlbCI6ICJLYWFydGUiLAogICAgICAiZW50aXR5IjogImthYXJ0IiwKICAgICAgImZpZWxkIjogewogICAgICAgICJsYWJlbCI6ICJLYWFydCIsCiAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlZyYWFnIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9wdGlvbmVsZSBnZXNrcmV3ZSB2cmFhZyB2aXIgZGllIGthYXJ0LiAoRGllIGthYXJ0IGthbiBzbGVncyAnbiBwcmVudGppZSwgb2Ygc2xlZ3MgdGVrcyBvZiBhbGJlaSBiZXZhdCkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQW50d29vcmQiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiQW50d29vcmQgKG9wbG9zc2luZykgdmlyIGRpZSBrYWFydC4gVXNlIGEgcGlwZSBzeW1ib2wgfCB0byBzcGxpdCBhbHRlcm5hdGl2ZSBzb2x1dGlvbnMuIFVzZSBcXHwgaWYgYSBzb2x1dGlvbiBzaG91bGQgY29udGFpbiBhIHwuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlByZW50IiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9wdGlvbmVsZSBwcmVudCB2aXIgZGllIGthYXJ0IC4gKERpZSBrYWFydCBrYW4gc2xlZ3MgJ24gcHJlbnRqaWUsIG9mIHNsZWdzIHRla3Mgb2YgYWxiZWkgYmV2YXQpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkFsdGVybmF0aWV3ZSB0ZWtzIHZpciBwcmVudCIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJXZW5rIiwKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiV2VuayB0ZWtzIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlZvcmRlcmluZyB0ZWtzIiwKICAgICAgImRlZmF1bHQiOiAiS2FhcnRqaWUgQGNhcmQgdmFuIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJWb3JkZXJpbmcgdGVrcywgdmVyYW5kZXJsaWtlIGJlc2tpa2JhYXI6IEBjYXJkIGVuIEB0b3RhbC4gQnl2b29yYmVlbGQ6ICdLYWFydGppZSBAY2FyZCB2YW4gQHRvdGFsJyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzIHZpciBkaWUgdm9sZ2VuZGUga25vcHBpZSIsCiAgICAgICJkZWZhdWx0IjogIlZvbGdlbmRlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3MgdmlyIGRpZSB2b3JpZ2Uga25vcHBpZSIsCiAgICAgICJkZWZhdWx0IjogIlZvcmlnZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzIHZpciBkaWUgJ1RvZXRzIGFudHdvb3JkJyBrbm9wcGllIiwKICAgICAgImRlZmF1bHQiOiAiVG9ldHMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVmVyZWlzIGdlYnJ1aWtlciBvbSBpZXRzIGluIHRlIHNsZXV0ZWwgdm9vcmRhdCBkaWUgYW50d29vcmQgZ2V3eXMgd29yZCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzIHZpciBkaWUgYW50d29vcmQgaW52b2VydmVsZCIsCiAgICAgICJkZWZhdWx0IjogIkpvdSBhbnR3b29yZCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzIHZpciBkaWUgcmVndGUgYW50d29vcmQiLAogICAgICAiZGVmYXVsdCI6ICJSZWciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrcyB2aXIgZGllIHZlcmtlZXJkZSBhbnR3b29yZCIsCiAgICAgICJkZWZhdWx0IjogIlZlcmtlZXJkIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIld5cyBhbnR3b29yZCB0ZWtzIiwKICAgICAgImRlZmF1bHQiOiAiUmVndGUgYW50d29vcmQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGl0ZWx0ZWtzIHZpciB1aXRzbGFlIiwKICAgICAgImRlZmF1bHQiOiAiVWl0c2xhZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzIHZpciBhYW50YWwgcmVndGUgYW50d29vcmRlIiwKICAgICAgImRlZmF1bHQiOiAiQHNjb3JlIHZhbiBAdG90YWwgcmVnIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlVpdHNsYWUgdGVrcywgdmVyYW5kZXJsaWtlIGJlc2tpa2JhYXI6IEBzY29yZSBlbiBAdG90YWwuIEJ5dm9vcmJlZWxkOiAnQHNjb3JlIHZhbiBAdG90YWwgcmVnJyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzIHZpciB3eXMgdWl0c2xhZSIsCiAgICAgICJkZWZhdWx0IjogIld5cyB1aXRzbGFlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3MgdmlyIGtvcnQgYW50d29vcmQgZXRpa2V0IiwKICAgICAgImRlZmF1bHQiOiAiQToiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrcyB2aXIgXCJwcm9iZWVyIHdlZXJcIiBrbm9wcGllIiwKICAgICAgImRlZmF1bHQiOiAiUHJvYmVlciB3ZWVyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkhvb2ZsZXR0ZXJnZXZvZWxpZyIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJNYWFrIHNla2VyIGRhdCBkaWUgZ2VicnVpa2VyIHNlIGFudHdvb3JkIHByZXNpZXMgZGllc2VsZmRlIGFzIGRpZSB2ZXJlaXNkZSBhbnR3b29yZCBpcy4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVmVya2VlcmRlIHRla3MgdmlyIGh1bHB0ZWdub2xvZ2llw6siLAogICAgICAiZGVmYXVsdCI6ICJWZXJrZWVyZGUgYW50d29vcmQuIERpZSByZWd0ZSBhbnR3b29yZCB3YXMgQGFuc3dlciIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZWtzIHdhdCB2ZXJ0b29uIHNhbCB3b3JkIHZpciBodWxwdGVnbm9sb2dpZcOrLiBHZWJydWlrIEBhbnN3ZXIgYXMgdmVyYW5kZXJsaWtlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDb3JyZWN0IGZlZWRiYWNrIHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJAYW5zd2VyIGlzIGNvcnJlY3QuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdGhhdCB3aWxsIGJlIGFubm91bmNlZCB0byBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIHdoZW4gYSBjYXJkIGlzIGFuc3dlcmVkIGNvcnJlY3RseS4gVXNlIEBhbnN3ZXIgYXMgdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkthYXJ0amllIHZlcmFuZGVyaW5nIHZpciBodWxwdGVnbm9sb2dpZcOrIiwKICAgICAgImRlZmF1bHQiOiAiQmxhZHN5IEBjdXJyZW50IHZhbiBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGVrcyB3YXQgYWFuZ2Vrb25kaWcgc2FsIHdvcmQgYXMgaHVscHRlZ25vbG9naWXDqyB3YW5uZWVyIHUgdHVzc2VuIGthYXJ0ZSBuYXZpZ2Vlci4gR2VicnVpayBAY3VycmVudCBlbiBAdG90YWwgYXMgdmVyYW5kZXJsaWtlcy4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUmFuZG9taXplIGNhcmRzIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkVuYWJsZSB0byByYW5kb21pemUgdGhlIG9yZGVyIG9mIGNhcmRzIG9uIGRpc3BsYXkuIgogICAgfQogIF0KfQ=="],"libraries\/H5P.Flashcards-1.7\/language\/ar.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLZiNi12YEg2KfZhNmG2LTYp9i3IgogICAgfSwKICAgIHsKICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogItin2YHYqtix2KfYttmKIgogICAgICAgIH0KICAgICAgXSwKICAgICAgImxhYmVsIjogItin2YTYqNi32KfZgtin2KoiLAogICAgICAiZW50aXR5IjogItin2YTYqNi32KfZgtipIiwKICAgICAgImZpZWxkIjogewogICAgICAgICJsYWJlbCI6ICLYp9mE2KjYt9in2YLYqSIsCiAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogItin2YTYs9ik2KfZhCIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICLYp9mE2LPYpNin2YQg2KfZhNmG2LXZiiDYp9iu2KrZitin2LHZiiDZhNmE2KjYt9in2YLYqS4gKNio2LfYp9mC2Kkg2YLYryDYqtiz2KrYrtiv2YUg2YXYrNix2K8g2LXZiNix2KnYjCDZhdis2LHYryDZhti1INij2Ygg2YPZhNmK2YfZhdinKSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICLYp9mE2KXYrNin2KjYqSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJBbnN3ZXIgKHNvbHV0aW9uKSBmb3IgdGhlIGNhcmQuIFVzZSBhIHBpcGUgc3ltYm9sIHwgdG8gc3BsaXQgYWx0ZXJuYXRpdmUgc29sdXRpb25zLiBVc2UgXFx8IGlmIGEgc29sdXRpb24gc2hvdWxkIGNvbnRhaW4gYSB8LiIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICLYtdmI2LHYqSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICLYp9mE2LXZiNix2Kkg2KfYrtiq2YrYp9ix2YrYqSDZhNmE2K3YtdmI2YQg2LnZhNmJINio2LfYp9mC2KkuICjYqNi32KfZgtipINmC2K8g2KrYs9iq2K7Yr9mFINmF2KzYsdivINi12YjYsdip2Iwg2YXYrNix2K8g2YbYtSDYo9mIINmD2YTZitmH2YXYpykiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQWx0ZXJuYXRpdmUgdGV4dCBmb3IgaW1hZ2UiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAi2KfZhNiq2YTZhdmK2K0iLAogICAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICLZhti1INin2YTYqtmE2YXZititIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItmG2LUg2KfZhNiq2YLYr9mFIiwKICAgICAgImRlZmF1bHQiOiAiQ2FyZCBAY2FyZCBvZiBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAi2YbYtSDYp9mE2KrZgtiv2YXYjCDZiNin2YTZhdiq2LrZitix2KfYqiDYp9mE2YXYqtin2K3YqTog2KfZhNio2LfYp9mC2Kkg2YjYp9mE2YXYrNmF2YjYuS4g2YXYq9in2YQ6INio2LfYp9mC2Kkg2YXZhiDYp9mE2YPZhCAiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi2YbYtSDYp9mE2LLYsSDYp9mE2KrYp9mE2YoiLAogICAgICAiZGVmYXVsdCI6ICJOZXh0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItmG2LUg2KfZhNiy2LEg2KfZhNiz2KfYqNmCIiwKICAgICAgImRlZmF1bHQiOiAiUHJldmlvdXMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi2YbYtSDYp9mE2LLYsSDYp9mE2KrYrdmC2YIg2YXZhiDYp9mE2KXYrNin2KjYp9iqICIsCiAgICAgICJkZWZhdWx0IjogIkNoZWNrIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIti32YTYqCDYpdiv2K7Yp9mEINin2YTZhdiz2KrYrtiv2YUg2KfYrNin2KjYqtmHINmC2KjZhCDYo9mGINmK2KrZhSDYudix2LbZhyDYp9mE2K3ZhCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciB0aGUgYW5zd2VyIGlucHV0IGZpZWxkIiwKICAgICAgImRlZmF1bHQiOiAiWW91ciBhbnN3ZXIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgY29ycmVjdCBhbnN3ZXIiLAogICAgICAiZGVmYXVsdCI6ICJDb3JyZWN0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIGluY29ycmVjdCBhbnN3ZXIiLAogICAgICAiZGVmYXVsdCI6ICJJbmNvcnJlY3QiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiU2hvdyBzb2x1dGlvbiB0ZXh0IiwKICAgICAgImRlZmF1bHQiOiAiQ29ycmVjdCBhbnN3ZXIocykiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgcmVzdWx0cyB0aXRsZSIsCiAgICAgICJkZWZhdWx0IjogIlJlc3VsdHMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgbnVtYmVyIG9mIGNvcnJlY3QiLAogICAgICAiZGVmYXVsdCI6ICJAc2NvcmUgb2YgQHRvdGFsIGNvcnJlY3QiLAogICAgICAiZGVzY3JpcHRpb24iOiAi2YbYtSDYp9mE2YbYqtmK2KzYqSDZiNin2YTZhdiq2LrZitix2KfYqiDYp9mE2YXYqtin2K3YqTogQHNjb3JlINmIIEB0b3RhbC4g2YXYq9in2YQ6ICdAc2NvcmUg2YXZhiBAdG90YWwg2KfZhNi12K3ZititJyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBzaG93IHJlc3VsdHMiLAogICAgICAiZGVmYXVsdCI6ICJTaG93IHJlc3VsdHMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3Igc2hvcnQgYW5zd2VyIGxhYmVsIiwKICAgICAgImRlZmF1bHQiOiAiQToiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJyZXRyeVwiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlJldHJ5IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNhc2Ugc2Vuc2l0aXZlIiwKICAgICAgImRlc2NyaXB0aW9uIjogItin2YTYqtij2YPYryDZhdmGINij2YYg2YXYudi32YrYp9iqINin2YTZhdiz2KrYrtiv2YUg2YrYrNioINij2YYg2KrZg9mI2YYg2YXYt9in2KjZgtipINiq2YXYp9mF2KfZiyDZhNmE2KXYrNin2KjYqS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiSW5jb3JyZWN0IHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICLYrNmI2KfYqCDYutmK2LEg2LXYrdmK2K0uINin2YTYpdis2KfYqNipINin2YTYtdit2YrYrdipINmD2KfZhtiqIEBhbnN3ZXIiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMuIFVzZSBAYW5zd2VyIGFzIHZhcmlhYmxlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDb3JyZWN0IGZlZWRiYWNrIHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJAYW5zd2VyIGlzIGNvcnJlY3QuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdGhhdCB3aWxsIGJlIGFubm91bmNlZCB0byBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIHdoZW4gYSBjYXJkIGlzIGFuc3dlcmVkIGNvcnJlY3RseS4gVXNlIEBhbnN3ZXIgYXMgdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNhcmQgY2hhbmdlIGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiUGFnZSBAY3VycmVudCBvZiBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMgd2hlbiBuYXZpZ2F0aW5nIGJldHdlZW4gY2FyZHMuIFVzZSBAY3VycmVudCBhbmQgQHRvdGFsIGFzIHZhcmlhYmxlcy4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUmFuZG9taXplIGNhcmRzIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkVuYWJsZSB0byByYW5kb21pemUgdGhlIG9yZGVyIG9mIGNhcmRzIG9uIGRpc3BsYXkuIgogICAgfQogIF0KfQo="],"libraries\/H5P.Flashcards-1.7\/language\/bg.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLQntC\/0LjRgdCw0L3QuNC1INC90LAg0LfQsNC00LDRh9Cw0YLQsCIKICAgIH0sCiAgICB7CiAgICAgICJ3aWRnZXRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICLQn9C+INC\/0L7QtNGA0LDQt9Cx0LjRgNCw0L3QtSIKICAgICAgICB9CiAgICAgIF0sCiAgICAgICJsYWJlbCI6ICLQmtCw0YDRgtC4IiwKICAgICAgImVudGl0eSI6ICLQutCw0YDRgtCwIiwKICAgICAgImZpZWxkIjogewogICAgICAgICJsYWJlbCI6ICLQmtCw0YDRgtCwIiwKICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAi0JLRitC\/0YDQvtGBIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogItCd0LXQt9Cw0LTRitC70LbQuNGC0LXQu9C90L4g0YLQtdC60YHRgtC+0LIg0LLRitC\/0YDQvtGBINC30LAg0LrQsNGA0YLQsNGC0LAuICjQmtCw0YDRgtCw0YLQsCDQvNC+0LbQtSDQtNCwINC40LfQv9C+0LvQt9Cy0LAg0YHQsNC80L4g0LjQt9C+0LHRgNCw0LbQtdC90LjQtSwg0YHQsNC80L4g0YLQtdC60YHRgiDQuNC70Lgg0Lgg0LTQstC10YLQtSkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAi0J7RgtCz0L7QstC+0YAiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAi0J3QtdC30LDQtNGK0LvQttC40YLQtdC70L3QviDQvtGC0LPQvtCy0L7RgCAo0YDQtdGI0LXQvdC40LUpINC30LAg0LrQsNGA0YLQsNGC0LAuIFVzZSBhIHBpcGUgc3ltYm9sIHwgdG8gc3BsaXQgYWx0ZXJuYXRpdmUgc29sdXRpb25zLiBVc2UgXFx8IGlmIGEgc29sdXRpb24gc2hvdWxkIGNvbnRhaW4gYSB8LiIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICLQmNC30L7QsdGA0LDQttC10L3QuNC1IiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogItCd0LXQt9Cw0LTRitC70LbQuNGC0LXQu9C90L4g0LjQt9C+0LHRgNCw0LbQtdC90LjQtSDQt9CwINC60LDRgNGC0LDRgtCwLiAo0JrQsNGA0YLQsNGC0LAg0LzQvtC20LUg0LTQsCDQuNC30L\/QvtC70LfQstCwINGB0LDQvNC+INC40LfQvtCx0YDQsNC20LXQvdC40LUsINGB0LDQvNC+INGC0LXQutGB0YIg0LjQu9C4INC4INC00LLQtdGC0LUpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogItCQ0LvRgtC10YDQvdCw0YLQuNCy0LXQvSDRgtC10LrRgdGCINC30LAg0LjQt9C+0LHRgNCw0LbQtdC90LjQtSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICLQn9C+0LTRgdC60LDQt9C60LAiLAogICAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICLQn9C+0LTRgdC60LDQt9C60LAiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQv9C+0LrQsNC30LLQsNGJINC90LDQv9GA0LXQtNGK0LrQsCIsCiAgICAgICJkZWZhdWx0IjogIkBjYXJkINC60LDRgNGC0LAv0Lgg0L7RgiDQvtCx0YnQviBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAi0KLQtdC60YHRgiwg0L\/QvtC60LDQt9Cy0LDRiSDQvdCw0L\/RgNC10LTRitC60LAsINC\/0YDQvtC80LXQvdC70LjQstC40YLQtSDRgdCwOiBAY2FyZCDQuCBAdG90YWwuINCf0YDQuNC80LXRgDogJ0BjYXJkINC60LDRgNGC0LAv0Lgg0L7RgiDQvtCx0YnQviBAdG90YWwnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0LXQutGB0YIg0LfQsCDRgdC70LXQtNCy0LDRiSDQsdGD0YLQvtC9IiwKICAgICAgImRlZmF1bHQiOiAi0KHQu9C10LTQstCw0YkiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQt9CwINC\/0YDQtdC00YXQvtC00LXQvSDQsdGD0YLQvtC9IiwKICAgICAgImRlZmF1bHQiOiAi0J\/RgNC10LTQtdGI0LXQvSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC90LAg0LHRg9GC0L7QvdCwINC30LAg0L\/RgNC+0LLQtdGA0LrQsCDQvdCwINC+0YLQs9C+0LLQvtGA0LAiLAogICAgICAiZGVmYXVsdCI6ICLQn9GA0L7QstC10YDQuCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQmNC30LjRgdC60LLQsNC50YLQtSDQv9C+0YLRgNC10LHQuNGC0LXQu9GB0LrQuCDQstGF0L7QtCwg0L\/RgNC10LTQuCDRgNC10YjQtdC90LjQtdGC0L4g0LTQsCDQvNC+0LbQtSDQtNCwINCx0YrQtNC1INCy0LjQtNGP0L3QviIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC30LAg0L\/QvtC70LXRgtC+INC30LAg0LLRitCy0LXQttC00LDQvdC1INC90LAg0L7RgtCz0L7QstC+0YAiLAogICAgICAiZGVmYXVsdCI6ICLQktCw0YjQuNGP0YIg0L7RgtCz0L7QstC+0YAiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQt9CwINCy0LXRgNC10L0g0L7RgtCz0L7QstC+0YAiLAogICAgICAiZGVmYXVsdCI6ICLQktC10YDQtdC9IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0LXQutGB0YIg0LfQsCDQs9GA0LXRiNC10L0g0L7RgtCz0L7QstC+0YAiLAogICAgICAiZGVmYXVsdCI6ICLQk9GA0LXRiNC10L0iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0J\/QvtC60LDQt9Cy0LDQvdC1INC90LAg0YDQtdGI0LXQvdC40LXRgtC+IiwKICAgICAgImRlZmF1bHQiOiAi0JLQtdGA0LXQvSDQvtGC0LPQvtCy0L7RgCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQoNC10LfRg9C70YLQsNGC0LgiLAogICAgICAiZGVmYXVsdCI6ICLQoNC10LfRg9C70YLQsNGC0LgiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQt9CwINCx0YDQvtGPINCy0LXRgNC90Lgg0L7RgtCz0L7QstC+0YDQuCIsCiAgICAgICJkZWZhdWx0IjogIkBzY29yZSDQvtGCINC+0LHRidC+IEB0b3RhbCDQstC10YDQvdC4IiwKICAgICAgImRlc2NyaXB0aW9uIjogItCi0LXQutGB0YIsINC\/0L7QutCw0LfQstCw0Ykg0YDQtdC30YPQu9GC0LDRgtCwLCDQv9GA0L7QvNC10L3Qu9C40LLQuNGC0LUg0YHQsDogQHNjb3JlIGFuZCBAdG90YWwuINCf0YDQuNC80LXRgDogJ0BzY29yZSDQvtGCINC+0LHRidC+IEB0b3RhbCDQstC10YDQvdC4JyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC\/0YDQuCDQv9C+0LrQsNC30LLQsNC90LUg0L3QsCDRgNC10LfRg9C70YLQuNGC0LUiLAogICAgICAiZGVmYXVsdCI6ICLQn9C+0LrQsNC30LLQsNC90LUg0L3QsCDRgNC10LfRg9C70YLQsNGC0LgiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQv9GA0Lgg0LrRgNCw0YLRitC6INC+0YLQs9C+0LLQvtGAIiwKICAgICAgImRlZmF1bHQiOiAi0J7RgtCzOiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC90LAg0LHRg9GC0L7QvdCwIFwi0J\/QvtCy0YLQvtGA0LXQvSDQvtC\/0LjRglwiIiwKICAgICAgImRlZmF1bHQiOiAi0J\/QvtCy0YLQvtGA0LXQvSDQvtC\/0LjRgiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQp9GD0LLRgdGC0LLQuNGC0LXQu9C90L7RgdGCINC\/0L4g0L7RgtC90L7RiNC10L3QuNC1INC90LAg0LPQu9Cw0LLQvdC4INC4INC80LDQu9C60Lgg0LHRg9C60LLQuCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLQmNC90YTQvtGA0LzQuNGA0LAg0YPRh9C10L3QuNC60LAsINGH0LUg0LLRitCy0LXQtNC10L3QvtGC0L4g0YLRgNGP0LHQstCwINC00LAg0LHRitC00LUg0LDQsdGB0L7Qu9GO0YLQvdC+INGB0YrRidC+0YLQviDQutCw0YLQviDQt9Cw0LTQsNC00LXQvdC40Y8g0L7RgiDQstCw0YEg0L7RgtCz0L7QstC+0YAuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCd0LXQv9GA0LDQstC40LvQtdC9INGC0LXQutGB0YIg0LfQsCDQv9C+0LzQvtGJ0L3QuCDRgtC10YXQvdC+0LvQvtCz0LjQuCIsCiAgICAgICJkZWZhdWx0IjogItCd0LXQv9GA0LDQstC40LvQtdC9INC+0YLQs9C+0LLQvtGALiDQn9GA0LDQstC40LvQvdC40Y\/RgtCwINC+0YLQs9C+0LLQvtGAINCx0LXRiNC1IEBhbnN3ZXIiLAogICAgICAiZGVzY3JpcHRpb24iOiAi0KLQtdC60YHRgiwg0L\/RgNC10LTQvdCw0LfQvdCw0YfQtdC9INC30LAg0L\/QvtC80L7RidC90LjRgtC1INGC0LXRhdC90L7Qu9C+0LPQuNC4LiDQmNC30L\/QvtC70LfQstCw0LnRgtC1IEBhbnN3ZXIg0LrQsNGC0L4g0L\/RgNC+0LzQtdC90LvQuNCy0LAuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNvcnJlY3QgZmVlZGJhY2sgdGV4dCBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIkBhbnN3ZXIgaXMgY29ycmVjdC4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMgd2hlbiBhIGNhcmQgaXMgYW5zd2VyZWQgY29ycmVjdGx5LiBVc2UgQGFuc3dlciBhcyB2YXJpYWJsZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KHQvNGP0L3QsCDQvdCwINC60LDRgNGC0LDRgtCwINC30LAg0L\/QvtC80L7RidC90Lgg0YLQtdGF0LzQvtC70L7Qs9C40LgiLAogICAgICAiZGVmYXVsdCI6ICLQodGC0YDQsNC90LjRhtCwIEBjdXJyZW50INC+0YIgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogItCi0LXQutGB0YLRitGCINGJ0LUg0YHQtSDQv9C+0LrQsNC30LLQsCDQv9GA0Lgg0LTQstC40LbQtdC90LjQtSDQvNC10LbQtNGDINC60LDRgNGC0LjRgtC1INC4INC40LfQv9C+0LvQt9Cy0LDQvdC1INC90LAg0L\/QvtC80L7RidC90Lgg0YLQtdGF0L3QvtC70L7Qs9C40LguINCY0LfQv9C+0LvQt9Cy0LDQudGC0LUgQGN1cnJlbnQg0LggQHRvdGFsINC60LDRgtC+INC\/0YDQvtC80LXQvdC70LjQstC4LiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJSYW5kb21pemUgY2FyZHMiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRW5hYmxlIHRvIHJhbmRvbWl6ZSB0aGUgb3JkZXIgb2YgY2FyZHMgb24gZGlzcGxheS4iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Flashcards-1.7\/language\/bs.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJPcGlzIHphZGF0a2EiCiAgICB9LAogICAgewogICAgICAid2lkZ2V0cyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiU3RhbmRhcmQiCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiS2FydGUiLAogICAgICAiZW50aXR5IjogImthcnQiLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImxhYmVsIjogIkthcnRlIiwKICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiUGl0YW5qZSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcGNpb25hbG5pIHRla3N0IHphIHBpdGFuamUuIChQaXRhbmplIG1vxb5lIGJpdGkgdGVrc3QsIHNsaWthIGlsaSBvYm9qZSkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiT2Rnb3ZvciIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPZGdvdm9yIChSamXFoWVuamUpIHphIGthcnR1LiBVc2UgYSBwaXBlIHN5bWJvbCB8IHRvIHNwbGl0IGFsdGVybmF0aXZlIHNvbHV0aW9ucy4gVXNlIFxcfCBpZiBhIHNvbHV0aW9uIHNob3VsZCBjb250YWluIGEgfC4iCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiU2xpa2EiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiT3BjaW9uYWxuYSBzbGlrYSB6YSBrYXJ0dS4gKFBpdGFuamUgbW\/FvmUgYml0aSB0ZWtzdCwgc2xpa2EgaWxpIG9ib2plKSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJBbHRlcm5hdGl2bmkgdGVrc3QgemEgc2xpa3UiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiU2F2amV0IiwKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiU2F2amV0IgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlBvxI1ldG5pIHRla3N0IiwKICAgICAgImRlZmF1bHQiOiAiS2FydGUgQGNhcmQgb2QgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlBvxI1ldG5pIHRla3N0LCBkb3N0dXBuZSB2YXJpamFibGU6IEBjYXJkIGkgQHRvdGFsLiBQcmltamVyOiAnS2FydGUgQGNhcmQgb2QgQHRvdGFsJyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdCB6YSBkdWdtZSBOYXByaWplZCIsCiAgICAgICJkZWZhdWx0IjogIk5hcHJpamVkIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0IHphIGR1Z21lIE5hemFkIiwKICAgICAgImRlZmF1bHQiOiAiTmF6YWQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3QgemEgZHVnbWUgUG90dnJkaSIsCiAgICAgICJkZWZhdWx0IjogIlBvdHZyZGkiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiT2JhdmV6bm8gamUgdcSNZcWhxIdlIGtvcmlzbmlrYSwgcHJpamUgbmVnbyByamXFoWVuamUgYnVkZSBwcmlrYXphbm8iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIGFuc3dlciBpbnB1dCBmaWVsZCIsCiAgICAgICJkZWZhdWx0IjogIlZhxaEgb2Rnb3ZvciIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBjb3JyZWN0IGFuc3dlciIsCiAgICAgICJkZWZhdWx0IjogIlRhxI1ubyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBpbmNvcnJlY3QgYW5zd2VyIiwKICAgICAgImRlZmF1bHQiOiAiTmV0YcSNbm8iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiU2hvdyBzb2x1dGlvbiB0ZXh0IiwKICAgICAgImRlZmF1bHQiOiAiVGHEjWFuIG9kZ292b3IiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgcmVzdWx0cyB0aXRsZSIsCiAgICAgICJkZWZhdWx0IjogIlJlenVsdGF0aSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBudW1iZXIgb2YgY29ycmVjdCIsCiAgICAgICJkZWZhdWx0IjogIkBzY29yZSBvZCBAdG90YWwgdGHEjW5vIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRla3N0IHphIHJlenVsdGF0LCBkb3N0dXBuZSB2YXJpamFibGU6IEBzY29yZSBpIEB0b3RhbC4gUHJpbWplcjogJ0BzY29yZSBvZCBAdG90YWwgdGHEjW5vJyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdCB6YSBwcmlrYcW+aSByZXp1bHRhdC4iLAogICAgICAiZGVmYXVsdCI6ICJQcmlrYcW+aSByZXp1bHRhdGUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3Igc2hvcnQgYW5zd2VyIGxhYmVsIiwKICAgICAgImRlZmF1bHQiOiAiQToiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVza3QgemEgXCJwb25vdmlcIiBkdWdtZSIsCiAgICAgICJkZWZhdWx0IjogIlBvbm92aSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJQYXppIG5hIHZlbGlrYSBpIG1hbGEgc2xvdmEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVW5lc2VuaSB0ZWtzdCBtb3JhIGJpdGkgdGHEjWFuIGkgcHJlY2l6YW4ga2FvIG9kZ292b3IuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkluY29ycmVjdCB0ZXh0IGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiTmV0YcSNYW4gb2Rnb3Zvci4gVGHEjWFuIG9kZ292b3IgamUgYmlvIEBhbnN3ZXIiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMuIFVzZSBAYW5zd2VyIGFzIHZhcmlhYmxlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDb3JyZWN0IGZlZWRiYWNrIHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJAYW5zd2VyIGlzIGNvcnJlY3QuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdGhhdCB3aWxsIGJlIGFubm91bmNlZCB0byBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIHdoZW4gYSBjYXJkIGlzIGFuc3dlcmVkIGNvcnJlY3RseS4gVXNlIEBhbnN3ZXIgYXMgdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNhcmQgY2hhbmdlIGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiU3RyYW5pY2EgQGN1cnJlbnQgb2QgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdGhhdCB3aWxsIGJlIGFubm91bmNlZCB0byBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIHdoZW4gbmF2aWdhdGluZyBiZXR3ZWVuIGNhcmRzLiBVc2UgQGN1cnJlbnQgYW5kIEB0b3RhbCBhcyB2YXJpYWJsZXMuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlJhbmRvbWl6ZSBjYXJkcyIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJFbmFibGUgdG8gcmFuZG9taXplIHRoZSBvcmRlciBvZiBjYXJkcyBvbiBkaXNwbGF5LiIgICAgICAKICAgIH0KICBdCn0="],"libraries\/H5P.Flashcards-1.7\/language\/ca.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZXNjcmlwY2nDsyBkZSBsYSB0YXNjYSIKICAgIH0sCiAgICB7CiAgICAgICJ3aWRnZXRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJPcGNpw7MgcHJlZGV0ZXJtaW5hZGEiCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiVGFyZ2V0ZXMiLAogICAgICAiZW50aXR5IjogImZpdHhhIiwKICAgICAgImZpZWxkIjogewogICAgICAgICJsYWJlbCI6ICJGaXR4YSIsCiAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlByZWd1bnRhIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIlByZWd1bnRhIHRleHR1YWwgb3BjaW9uYWwgcGVyIGEgbGEgdGFyZ2V0YS4gKExhIHRhcmdldGEgcG90IGluY2xvdXJlIG5vbcOpcyB1bmEgaW1hdGdlLCBub23DqXMgdGV4dCBvIHVuYSBjb21iaW5hY2nDsyBk4oCZaW1hdGdlIGkgdGV4dC4pIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlJlc3Bvc3RhIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIlJlc3Bvc3RhIChzb2x1Y2nDsykgcGVyIGEgbGEgdGFyZ2V0YS4gVXNlIGEgcGlwZSBzeW1ib2wgfCB0byBzcGxpdCBhbHRlcm5hdGl2ZSBzb2x1dGlvbnMuIFVzZSBcXHwgaWYgYSBzb2x1dGlvbiBzaG91bGQgY29udGFpbiBhIHwuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkltYXRnZSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJJbWF0Z2Ugb3BjaW9uYWwgZGUgbGEgZml0eGEuIChMYSBmaXR4YSBwb3QgdXRpbGl0emFyIG5vbcOpcyB1bmEgaW1hdGdlLCBub23DqXMgdW4gdGV4dCBvIGFtYmR1ZXMpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlRleHQgYWx0ZXJuYXRpdSBwZXIgYSBsYSBpbWF0Z2UiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiUGlzdGEiLAogICAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJUZXh0IGRlbCBjb25zZWxsIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZGVsIHByb2dyw6lzIiwKICAgICAgImRlZmF1bHQiOiAiRml0eGEgQGNhcmQgZGUgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgZGUgcHJvZ3LDqXMsIHZhcmlhYmxlcyBkaXNwb25pYmxlczogQGNhcmQgaSBAdG90YWwuIEV4ZW1wbGU6IFwiVGFyZ2V0YSBAY2FyZCBkZSBAdG90YWxcIiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGRlbCBib3TDsyBzZWfDvGVudCIsCiAgICAgICJkZWZhdWx0IjogIlNlZ8O8ZW50IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZGVsIGJvdMOzIGFudGVyaW9yIiwKICAgICAgImRlZmF1bHQiOiAiQW50ZXJpb3IiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBkZWwgYm90w7MgXCJDb21wcm92YSBsZXMgcmVzcG9zdGVzXCIiLAogICAgICAiZGVmYXVsdCI6ICJWZXJpZmljYSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJSZXF1ZXJlaXggbOKAmWVudHJhZGEgZGUgZGFkZXMgcGVyIHBhcnQgZGUgbOKAmXVzdWFyaSBhYmFucyBxdWUgZXMgcHVndWkgdmlzdWFsaXR6YXIgbGEgc29sdWNpw7MiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBwZXIgYWwgY2FtcCBk4oCZZW50cmFkYSBkZSBsYSByZXNwb3N0YSIsCiAgICAgICJkZWZhdWx0IjogIkxhIHRldmEgcmVzcG9zdGEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBwZXIgYSByZXNwb3N0YSBjb3JyZWN0YSIsCiAgICAgICJkZWZhdWx0IjogIkNvcnJlY3RlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgcGVyIGEgcmVzcG9zdGEgaW5jb3JyZWN0YSIsCiAgICAgICJkZWZhdWx0IjogIkluY29ycmVjdGUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTW9zdHJhIGVsIHRleHQgZGUgbGEgc29sdWNpw7MiLAogICAgICAiZGVmYXVsdCI6ICJSZXNwb3N0YSBjb3JyZWN0YSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IHBlciBhbCB0w610b2wgZGUgcmVzdWx0YXRzIiwKICAgICAgImRlZmF1bHQiOiAiUmVzdWx0YXRzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgcGVyIGFsIG5vbWJyZSBkZSByZXNwb3N0ZXMgY29ycmVjdGVzIiwKICAgICAgImRlZmF1bHQiOiAiQHNjb3JlIGRlIEB0b3RhbCBjb3JyZWN0ZSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IGRlIHJlc3VsdGF0cywgdmFyaWFibGVzIGRpc3BvbmlibGVzOiBAc2NvcmUgaSBAdG90YWwuIEV4ZW1wbGU6IFwiQ29ycmVjdGVzOiBAc2NvcmVcIiBkZSBcIkB0b3RhbFwiIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgcGVyIG1vc3RyYXIgZWxzIHJlc3VsdGF0cyIsCiAgICAgICJkZWZhdWx0IjogIk1vc3RyYSBlbHMgcmVzdWx0YXRzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgcGVyIGEgbOKAmWV0aXF1ZXRhIGRlIHJlc3Bvc3RhIGN1cnRhIiwKICAgICAgImRlZmF1bHQiOiAiQToiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBkZWwgYm90w7MgXCJUb3JuYS1obyBhIHByb3ZhclwiIiwKICAgICAgImRlZmF1bHQiOiAiVG9ybmEtaG8gYSBwcm92YXIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRGlzdGluZ2VpeCBlbnRyZSBtYWrDunNjdWxlcyBpIG1pbsO6c2N1bGVzIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkNvbXByb3ZhIHF1ZSBs4oCZZW50cmFkYSBkZSB0ZXh0IGRlIGzigJl1c3Vhcmkgc2lndWkgZXhhY3RhbWVudCBpZ3VhbCBxdWUgbGEgcmVzcG9zdGEuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgaW5jb3JyZWN0ZSBwZXIgYSBsZXMgdGVjbm9sb2dpZXMgZOKAmWFzc2lzdMOobmNpYSIsCiAgICAgICJkZWZhdWx0IjogIlJlc3Bvc3RhIGluY29ycmVjdGEuIExhIHJlc3Bvc3RhIGNvcnJlY3RhIGVzIEBhbnN3ZXIiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCBxdWUgc+KAmWFudW5jaWFyw6AgYSBsZXMgdGVjbm9sb2dpZXMgZOKAmWFzc2lzdMOobmNpYS4gU+KAmXV0aWxpdHphIEBhbnN3ZXIgY29tIGEgdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNvcnJlY3QgZmVlZGJhY2sgdGV4dCBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIkBhbnN3ZXIgaXMgY29ycmVjdC4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMgd2hlbiBhIGNhcmQgaXMgYW5zd2VyZWQgY29ycmVjdGx5LiBVc2UgQGFuc3dlciBhcyB2YXJpYWJsZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2FudmkgZGUgdGFyZ2V0YSBwZXIgYSBsZXMgdGVjbm9sb2dpZXMgZOKAmWFzc2lzdMOobmNpYSIsCiAgICAgICJkZWZhdWx0IjogIlDDoGdpbmEgQGN1cnJlbnQgZGUgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgcXVlIHPigJlhbnVuY2lhcsOgIGEgbGVzIHRlY25vbG9naWVzIGTigJlhc3Npc3TDqG5jaWEgZW4gbmF2ZWdhciBwZXIgbGVzIHRhcmdldGVzLiBT4oCZdXRpbGl0emEgQGN1cnJlbnQgaSBAdG90YWwgY29tIGEgdmFyaWFibGVzLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJSYW5kb21pemUgY2FyZHMiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRW5hYmxlIHRvIHJhbmRvbWl6ZSB0aGUgb3JkZXIgb2YgY2FyZHMgb24gZGlzcGxheS4iCiAgICB9CiAgXQp9"],"libraries\/H5P.Flashcards-1.7\/language\/cs.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJQb3BpcyDDumxvaHkiCiAgICB9LAogICAgewogICAgICAid2lkZ2V0cyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiVsO9Y2hvesOtIgogICAgICAgIH0KICAgICAgXSwKICAgICAgImxhYmVsIjogIkthcnR5IiwKICAgICAgImVudGl0eSI6ICJrYXJ0YSIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAibGFiZWwiOiAiS2FydGEiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJPdMOhemthIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIlZvbGl0ZWxuw6EgdGV4dG92w6Egb3TDoXprYSBwcm8ga2FydHUuIChLYXJ0YSBtxa\/FvmUgcG91xb7DrXZhdCBwb3V6ZSBvYnLDoXplaywgcG91emUgdGV4dCBuZWJvIG9ib2rDrSkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiT2Rwb3bEm8SPIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9kcG92xJvEjyAoxZllxaFlbsOtKSBwcm8ga2FydHUuIFBvdcW+aWp0ZSBzeW1ib2wgcG90cnViw60gfCBrIHJvemTEm2xlbsOtIGFsdGVybmF0aXZuw61jaCDFmWXFoWVuw60uIFBvdcW+aWp0ZSBcXHwgcG9rdWQgYnkgbcSbbG8gxZllxaFlbsOtIG9ic2Fob3ZhdCB8LiIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJPYnLDoXplayIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJWb2xpdGVsbsO9IG9icsOhemVrIHBybyBrYXJ0dS4gKEthcnRhIG3Fr8W+ZSBwb3XFvsOtdmF0IHBvdXplIG9icsOhemVrLCBwb3V6ZSB0ZXh0IG5lYm8gb2JvasOtKSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJBbHRlcm5hdGl2bsOtIHRleHQgcHJvIG9icsOhemVrIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIk7DoXBvdsSbZGEiLAogICAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJUZXh0IG7DoXBvdsSbZHkiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBwb2tyb2t1IiwKICAgICAgImRlZmF1bHQiOiAiS2FyZXQgQGNhcmQgeiBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCBwb2tyb2t1LCBkb3N0dXBuw6kgcHJvbcSbbm7DqTogQGNhcmQgYSBAdG90YWwuIFDFmcOta2xhZDogJ0NhcmQgQGNhcmQgb2YgQHRvdGFsJyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IHBybyB0bGHEjcOtdGtvIGRhbMWhw60iLAogICAgICAiZGVmYXVsdCI6ICJEYWzFocOtIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgcHJvIHRsYcSNw610a28gcMWZZWRjaG96w60iLAogICAgICAiZGVmYXVsdCI6ICJQxZllZGNob3rDrSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IHBybyB0bGHEjcOtdGtvIGtvbnRyb2xhIG9kcG92xJtkaSIsCiAgICAgICJkZWZhdWx0IjogIlprb250cm9sb3ZhdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJQxZllZCB6b2JyYXplbsOtbSDFmWXFoWVuw60gamUgdMWZZWJhIHphZGF0IHZzdHVwIHXFvml2YXRlbGUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBwcm8gcG9sZSBwcm8gemFkw6Fuw60gb2Rwb3bEm2RpIiwKICAgICAgImRlZmF1bHQiOiAiVmHFoWUgb2Rwb3bEm8SPIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgcHJvIHNwcsOhdm5vdSBvZHBvdsSbxI8iLAogICAgICAiZGVmYXVsdCI6ICJTcHLDoXZuxJsiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBwcm8gbmVzcHLDoXZub3Ugb2Rwb3bEm8SPIiwKICAgICAgImRlZmF1bHQiOiAiTmVzcHLDoXZuxJsiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBwcm8gem9icmF6aXQgxZllxaFlbsOtIiwKICAgICAgImRlZmF1bHQiOiAiU3Byw6F2bsOhIG9kcG92xJvEjyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IHBybyBuYWRwaXMgdsO9c2xlZGt1IiwKICAgICAgImRlZmF1bHQiOiAiVsO9c2xlZGVrIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgcHJvIHBvxI1ldCBzcHLDoXZuw71jaCIsCiAgICAgICJkZWZhdWx0IjogIkBzY29yZSB6IEB0b3RhbCBzcHLDoXZuxJsiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVsO9c2xlZG7DvSB0ZXh0LCBkb3N0dXBuw6kgcHJvbcSbbm7DqTogQHNjb3JlIGEgQHRvdGFsLiBQxZnDrWtsYWQ6IFwiQHNjb3JlIHogQHRvdGFsIHNwcsOhdm7Em1wiIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgcHJvIHpvYnJhemVuw60gdsO9c2xlZGvFryIsCiAgICAgICJkZWZhdWx0IjogIlpvYnJheml0IHbDvXNsZWRreSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IHBybyBwb3Bpc2VrIHMga3LDoXRrb3Ugb2Rwb3bEm2TDrSIsCiAgICAgICJkZWZhdWx0IjogIkE6IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgdGxhxI3DrXRrYSBcIm9wYWtvdmF0XCIiLAogICAgICAiZGVmYXVsdCI6ICJPcGFrb3ZhdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJSb3psacWhdWplIHZlbGvDoSBhIG1hbMOhIHDDrXNtZW5hIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlphamnFocWldWplLCDFvmUgdnN0dXAgdcW+aXZhdGVsZSBtdXPDrSBiw710IHDFmWVzbsSbIHN0ZWpuw70gamFrbyBvZHBvdsSbxI8uIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk5lc3Byw6F2bsO9IHRleHQgcHJvIHBvZHDFr3Juw6kgdGVjaG5vbG9naWUiLAogICAgICAiZGVmYXVsdCI6ICJOZXNwcsOhdm7DoSBvZHBvdsSbxI8uIFNwcsOhdm7DoSBvZHBvdsSbxI8gamUgQGFuc3dlciIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0LCBrdGVyw70gYnVkZSBvem7DoW1lbiBwb2Rwxa9ybsO9bWkgdGVjaG5vbG9naWVtaS4gSmFrbyBwcm9txJtubm91IHBvdcW+aWp0ZSBAYW5zd2VyLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IHpwxJt0bsOpIHZhemJ5IHDFmWkgc3Byw6F2bsOpIG9kcG92xJtkaSBwcm8gcG9kcMWvcm7DqSB0ZWNobm9sb2dpZSIsCiAgICAgICJkZWZhdWx0IjogIkBhbnN3ZXIgamUgc3Byw6F2bsOhIG9kcG92xJvEjy4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCwga3RlcsO9IGJ1ZGUgcMWZaSBvem7DoW1lbiBwb2Rwxa9ybsO9bWkgdGVjaG5vbG9naWVtaSwga2R5xb4gamUga2FydGEgem9kcG92xJt6ZW5hIHNwcsOhdm7Emy4gUG91xb5panRlIEBhbnN3ZXIgamFrbyBwcm9txJtubm91LiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJabcSbbmEga2FydHkgemEgcG9kcMWvcm7DqSB0ZWNobm9sb2dpZSIsCiAgICAgICJkZWZhdWx0IjogIlN0cmFuYSBAY3VycmVudCB6IEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0LCBrdGVyw70gYnVkZSBwxZlpIG5hdmlnYWNpIG1lemkga2FydGFtaSBvem7DoW1lbiBwb2Rwxa9ybsO9bWkgdGVjaG5vbG9naWVtaS4gSmFrbyBwcm9txJtubsOpIHBvdcW+aWp0ZSBAY3VycmVudCBhIEB0b3RhbC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTsOhaG9kbsOpIGthcnR5IiwKICAgICAgImRlc2NyaXB0aW9uIjogIlBvdm9saXQgbsOhaG9kbsOpIHBvxZlhZMOtIGthcmV0IG5hIGRpc3BsZWppLiIKICAgIH0KICBdCn0K"],"libraries\/H5P.Flashcards-1.7\/language\/da.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJUYXNrIGRlc2NyaXB0aW9uIgogICAgfSwKICAgIHsKICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkRlZmF1bHQiCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiQ2FyZHMiLAogICAgICAiZW50aXR5IjogImNhcmQiLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImxhYmVsIjogIkNhcmQiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJRdWVzdGlvbiIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcHRpb25hbCB0ZXh0dWFsIHF1ZXN0aW9uIGZvciB0aGUgY2FyZC4gKFRoZSBjYXJkIG1heSB1c2UganVzdCBhbiBpbWFnZSwganVzdCBhIHRleHQgb3IgYm90aCkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQW5zd2VyIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIkFuc3dlciAoc29sdXRpb24pIGZvciB0aGUgY2FyZC4gVXNlIGEgcGlwZSBzeW1ib2wgfCB0byBzcGxpdCBhbHRlcm5hdGl2ZSBzb2x1dGlvbnMuIFVzZSBcXHwgaWYgYSBzb2x1dGlvbiBzaG91bGQgY29udGFpbiBhIHwuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkltYWdlIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9wdGlvbmFsIGltYWdlIGZvciB0aGUgY2FyZC4gKFRoZSBjYXJkIG1heSB1c2UganVzdCBhbiBpbWFnZSwganVzdCBhIHRleHQgb3IgYm90aCkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQWx0ZXJuYXRpdmUgdGV4dCBmb3IgaW1hZ2UiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiVGlwIiwKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiVGlwIHRleHQiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUHJvZ3Jlc3MgdGV4dCIsCiAgICAgICJkZWZhdWx0IjogIktvcnQgQGNhcmQgdWQgYWYgQHRvdGFsICIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJQcm9ncmVzcyB0ZXh0LCB2YXJpYWJsZXMgYXZhaWxhYmxlOiBAY2FyZCBhbmQgQHRvdGFsLiBFeGFtcGxlOiAnQ2FyZCBAY2FyZCBvZiBAdG90YWwnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHRoZSBuZXh0IGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIk7DpnN0ZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciB0aGUgcHJldmlvdXMgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiRm9ycmlnZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciB0aGUgY2hlY2sgYW5zd2VycyBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJUamVrIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlJlcXVpcmUgdXNlciBpbnB1dCBiZWZvcmUgdGhlIHNvbHV0aW9uIGNhbiBiZSB2aWV3ZWQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIGFuc3dlciBpbnB1dCBmaWVsZCIsCiAgICAgICJkZWZhdWx0IjogIkRpdCBzdmFyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIGNvcnJlY3QgYW5zd2VyIiwKICAgICAgImRlZmF1bHQiOiAiUmlndGlndCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBpbmNvcnJlY3QgYW5zd2VyIiwKICAgICAgImRlZmF1bHQiOiAiRm9ya2VydCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJTaG93IHNvbHV0aW9uIHRleHQiLAogICAgICAiZGVmYXVsdCI6ICJSaWd0aWd0IHN2YXI6IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHJlc3VsdHMgdGl0bGUiLAogICAgICAiZGVmYXVsdCI6ICJSZXN1bHRzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIG51bWJlciBvZiBjb3JyZWN0IiwKICAgICAgImRlZmF1bHQiOiAiQHNjb3JlIHVkIGFmIEB0b3RhbCByaWd0aWdlIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlJlc3VsdCB0ZXh0LCB2YXJpYWJsZXMgYXZhaWxhYmxlOiBAc2NvcmUgYW5kIEB0b3RhbC4gRXhhbXBsZTogJ0BzY29yZSBvZiBAdG90YWwgY29ycmVjdCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3Igc2hvdyByZXN1bHRzIiwKICAgICAgImRlZmF1bHQiOiAiVmlzIHJlc3VsdGF0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHNob3J0IGFuc3dlciBsYWJlbCIsCiAgICAgICJkZWZhdWx0IjogIkE6IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIFwicmV0cnlcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJQcsO4diBpZ2VuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNhc2Ugc2Vuc2l0aXZlIiwKICAgICAgImRlc2NyaXB0aW9uIjogIk1ha2VzIHN1cmUgdGhlIHVzZXIgaW5wdXQgaGFzIHRvIGJlIGV4YWN0bHkgdGhlIHNhbWUgYXMgdGhlIGFuc3dlci4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiSW5jb3JyZWN0IHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJGb3JrZXJ0IHN2YXIuIERldCByaWd0aWdlIHN2YXIgdmFyIEBhbnN3ZXIiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMuIFVzZSBAYW5zd2VyIGFzIHZhcmlhYmxlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDb3JyZWN0IGZlZWRiYWNrIHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJAYW5zd2VyIGVyIHJpZ3RpZ3QiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMgd2hlbiBhIGNhcmQgaXMgYW5zd2VyZWQgY29ycmVjdGx5LiBVc2UgQGFuc3dlciBhcyB2YXJpYWJsZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2FyZCBjaGFuZ2UgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJTaWRlIEBjdXJyZW50IHVkIGFmIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcyB3aGVuIG5hdmlnYXRpbmcgYmV0d2VlbiBjYXJkcy4gVXNlIEBjdXJyZW50IGFuZCBAdG90YWwgYXMgdmFyaWFibGVzLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCbGFuZCBrb3J0IiwKICAgICAgImRlc2NyaXB0aW9uIjogIkFrdGl2w6lyIGZvciBhdCBmw6UgZW4gdGlsZsOmbGRpZyByw6Zra2Vmw7hsZ2UgaSB2aXNuaW5nZW4gYWYga29ydGVuZS4iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Flashcards-1.7\/language\/de.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJBdWZnYWJlbmJlc2NocmVpYnVuZyIKICAgIH0sCiAgICB7CiAgICAgICJ3aWRnZXRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJFaW5nYWJlbWFza2UiCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiS2FydGVuIiwKICAgICAgImVudGl0eSI6ICJLYXJ0ZSIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAibGFiZWwiOiAiS2FydGUiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJGcmFnZSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcHRpb25hbGVyIEZyYWdldGV4dCBmw7xyIGRpZSBLYXJ0ZS4gKEVzIGlzdCBudXIgZWluIFRleHQsIG51ciBlaW4gQmlsZCBvZGVyIGJlaWRlcyBtw7ZnbGljaCkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQW50d29ydCIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJBbnR3b3J0IChMw7ZzdW5nKSBmw7xyIGRpZSBLYXJ0ZS4gQmVudXR6ZSBlaW4gXCJQaXBlXCItU3ltYm9sIHwsIHVtIGFsdGVybmF0aXZlIEzDtnN1bmdlbiB2b25laW5hbmRlciBhYnp1Z3Jlbnplbi4gQmVudXR6ZSBcXHwsIGZhbGxzIGVpbmUgTMO2c3VuZyBlaW4gfCBlbnRoYWx0ZW4gbXVzcy4iCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQmlsZCIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcHRpb25hbGVzIEJpbGQgZsO8ciBkaWUgS2FydGUuIChFcyBpc3QgbnVyIGVpbiBUZXh0LCBudXIgZWluIEJpbGQgb2RlciBiZWlkZXMgbcO2Z2xpY2gpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkFsdGVybmF0aXZ0ZXh0IGbDvHIgZGFzIEJpbGQiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiVGlwcCIsCiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlRpcHAtVGV4dCIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGRlciBGb3J0c2Nocml0dHNhbnplaWdlIiwKICAgICAgImRlZmF1bHQiOiAiS2FydGUgQGNhcmQgdm9uIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJWZXJmw7xnYmFyZSBQbGF0emhhbHRlcjogQGNhcmQgdW5kIEB0b3RhbC4gQmVpc3BpZWw6ICdLYXJ0ZSBAY2FyZCB2b24gQHRvdGFsJyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZXNjaHJpZnR1bmcgZGVzIFwiV2VpdGVyXCItQnV0dG9ucyIsCiAgICAgICJkZWZhdWx0IjogIldlaXRlciIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZXNjaHJpZnR1bmcgZGVzIFwiWnVyw7xja1wiLUJ1dHRvbnMiLAogICAgICAiZGVmYXVsdCI6ICJadXLDvGNrIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkJlc2NocmlmdHVuZyBkZXMgXCLDnGJlcnByw7xmZW5cIi1CdXR0b25zIiwKICAgICAgImRlZmF1bHQiOiAiw5xiZXJwcsO8ZmVuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkzDtnN1bmcga2FubiBlcnN0IGFuZ2V6ZWlndCB3ZXJkZW4sIHdlbm4gZWluZSBBbnR3b3J0IGVpbmdlZ2ViZW4gd3VyZGUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUGxhdHpoYWx0ZXIgaW0gQW50d29ydC1FaW5nYWJlZmVsZCIsCiAgICAgICJkZWZhdWx0IjogIkRlaW5lIEFudHdvcnQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQmVzY2hyaWZ0dW5nIGbDvHIgXCJSaWNodGlnZSBBbnR3b3J0XCIiLAogICAgICAiZGVmYXVsdCI6ICJSaWNodGlnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkJlc2NocmlmdHVuZyBmw7xyIFwiRmFsc2NoZSBBbnR3b3J0XCIiLAogICAgICAiZGVmYXVsdCI6ICJGYWxzY2giCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQmVzY2hyaWZ0dW5nIGRlciBMw7ZzdW5nIiwKICAgICAgImRlZmF1bHQiOiAiUmljaHRpZ2UgQW50d29ydChlbikiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiw5xiZXJzY2hyaWZ0IGRlciBFcmdlYm5pc3NlaXRlIiwKICAgICAgImRlZmF1bHQiOiAiRXJnZWJuaXNzZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0LCBkZXIgYW5naWJ0LCB3aWUgdmllbGUgS2FydGVuIHJpY2h0aWcgd2FyZW4iLAogICAgICAiZGVmYXVsdCI6ICJAc2NvcmUgdm9uIEB0b3RhbCByaWNodGlnIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlZlcmbDvGdiYXJlIFBsYXR6aGFsdGVyOiBAc2NvcmUgdW5kIEB0b3RhbC4gQmVpc3BpZWw6ICdAc2NvcmUgdm9uIEB0b3RhbCByaWNodGlnJyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZXNjaHJpZnR1bmcgZGVzIFwiRXJnZWJuaXNzZSBhbnplaWdlblwiLUJ1dHRvbnMiLAogICAgICAiZGVmYXVsdCI6ICJFcmdlYm5pc3NlIGFuemVpZ2VuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkt1cnpmb3JtIHZvbiBcIkFudHdvcnRcIiIsCiAgICAgICJkZWZhdWx0IjogIkE6IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkJlc2NocmlmdHVuZyBkZXMgXCJXaWVkZXJob2xlblwiLUJ1dHRvbnMiLAogICAgICAiZGVmYXVsdCI6ICJXaWVkZXJob2xlbiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJBdWYgR3Jvw58tL0tsZWluc2NocmVpYnVuZyBhY2h0ZW4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiU3RlbGx0IHNpY2hlciwgZGFzcyBkaWUgTMO2c3VuZyBleGFrdCBkZXIgVm9yZ2FiZSBlbnRzcHJpY2h0LiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZXplaWNobnVuZyBlaW5lciBmYWxzY2hlbiBBbnR3b3J0IGbDvHIgVm9ybGVzZXdlcmt6ZXVnZSIsCiAgICAgICJkZWZhdWx0IjogIkZhbHNjaGUgQW50d29ydC4gRGllIHJpY2h0aWdlIEFudHdvcnQgaXN0IEBhbnN3ZXIiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCwgZGVyIHZvbiBWb3JsZXNld2Vya3pldWdlbiB2b3JnZWxlc2VuIHdpcmQgKEJhcnJpZXJlZnJlaWhlaXQpLiBWZXJ3ZW5kZSBAYW5zd2VyIGFscyBQbGF0emhhbHRlci4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQmV6ZWljaG51bmcgZWluZXIgcmljaHRpZ2VuIEFudHdvcnQgZsO8ciBWb3JsZXNld2Vya3pldWdlIiwKICAgICAgImRlZmF1bHQiOiAiQGFuc3dlciBpc3QgcmljaHRpZy4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCwgZGVyIGR1cmNoIFZvcmxlc2V3ZXJremV1Z2UgKEJhcnJpZXJlZnJlaWhlaXQpIHZvcmdlbGVzZW4gd2lyZCwgd2VubiBlaW5lIEthcnRlIHJpY2h0aWcgYmVhbnR3b3J0ZXQgd2lyZC4gTnV0emUgQGFuc3dlciBhbHMgUGxhdHpoYWx0ZXIuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgenVtIEthcnRlbndlY2hzZWwgZsO8ciBWb3JsZXNld2Vya3pldWdlIiwKICAgICAgImRlZmF1bHQiOiAiS2FydGUgQGN1cnJlbnQgdm9uIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0LCBkZXIgdm9uIFZvcmxlc2V3ZXJremV1Z2VuIHZvcmdlbGVzZW4gd2lyZCwgd2VubiB6d2lzY2hlbiBLYXJ0ZW4gZ2V3ZWNoc2VsdCB3aXJkIChCYXJyaWVyZWZyZWloZWl0KS4gVmVyd2VuZGUgQGN1cnJlbnQgdW5kIEB0b3RhbCBhbHMgUGxhdHpoYWx0ZXIuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkthcnRlbiBtaXNjaGVuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkFud8OkaGxlbiwgdW0gZGllIEthcnRlbiB6dWbDpGxsaWcgYW56dW9yZG5lbi4iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Flashcards-1.7\/language\/el.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLOoM61z4HOuc6zz4HOsc+Gzq4gzqzPg866zrfPg863z4IiCiAgICB9LAogICAgewogICAgICAid2lkZ2V0cyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAizpLOsc+DzrnOus+MIgogICAgICAgIH0KICAgICAgXSwKICAgICAgImxhYmVsIjogIs6azqzPgc+EzrXPgiIsCiAgICAgICJlbnRpdHkiOiAizrrOsc+Bz4TOsc+CIiwKICAgICAgImZpZWxkIjogewogICAgICAgICJsYWJlbCI6ICLOms6sz4HPhM6xIiwKICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAizpXPgc+Oz4TOt8+DzrciLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAizprOtc6vzrzOtc69zr8gzrXPgc+Oz4TOt8+DzrfPgiDOs865zrEgz4TOt869IM66zqzPgc+EzrEuIM6XIM66zqzPgc+EzrEgzrzPgM6\/z4HOtc6vIM69zrEgzq3Ph861zrkgzrzPjM69zr8gzrXOuc66z4zOvc6xLCDOvM+Mzr3OvyDOus61zq\/OvM61zr3OvyDOriDOus6xzrkgz4TOsSDOtM+Nzr8gKM+Az4HOv86xzrnPgc61z4TOuc66z4wpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIs6Rz4DOrM69z4TOt8+DzrciLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAizqDPgc6\/zrHOuc+BzrXPhM65zrrOri4gVXNlIGEgcGlwZSBzeW1ib2wgfCB0byBzcGxpdCBhbHRlcm5hdGl2ZSBzb2x1dGlvbnMuIFVzZSBcXHwgaWYgYSBzb2x1dGlvbiBzaG91bGQgY29udGFpbiBhIHwuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIs6VzrnOus+Mzr3OsSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICLOlc65zrrPjM69zrEgzrPOuc6xIM+EzrfOvSDOus6sz4HPhM6xLiDOlyDOus6sz4HPhM6xIM68z4DOv8+BzrXOryDOvc6xIM6tz4fOtc65IM68z4zOvc6\/IM61zrnOus+Mzr3OsSwgzrzPjM69zr8gzrrOtc6vzrzOtc69zr8gzq4gzrrOsc65IM+EzrEgzrTPjc6\/ICjPgM+Bzr\/Osc65z4HOtc+EzrnOus+MKSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICLOlc69zrHOu867zrHOus+EzrnOus+MIM66zrXOr868zrXOvc6\/IM6zzrnOsSDPhM63zr0gzrXOuc66z4zOvc6xIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIs6Vz4DOtc6+zq7Os863z4POtyIsCiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIs6Vz4DOtc6+zrfOs863zrzOsc+EzrnOus+MIM66zrXOr868zrXOvc6\/IgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIs6azrXOr868zrXOvc6\/IM+Az4HOv8+MzrTOv8+FIiwKICAgICAgImRlZmF1bHQiOiAizprOrM+Bz4TOsSBAY2FyZCDOsc+Az4wgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIs6azrXOr868zrXOvc6\/IM+Az4HOv8+MzrTOv8+FLCDOtM65zrHOuM6tz4POuc68zrXPgiDOvM61z4TOsc6yzrvOt8+Ezq3PgjogQGNhcmQgzrrOsc65IEB0b3RhbC4gzqDOsc+BzqzOtM61zrnOs868zrE6ICfOms6sz4HPhM6xIEBjYXJkIM6xz4DPjCBAdG90YWwnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIs6Vz4TOuc66zq3PhM6xIM66zr\/Phc68z4DOuc6\/z40gzrzOtc+EzqzOss6xz4POt8+CIM+Dz4TOt869IM61z4DPjM68zrXOvc63IM66zqzPgc+EzrEiLAogICAgICAiZGVmYXVsdCI6ICLOlc+Az4zOvM61zr3OtyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLOlc+EzrnOus6tz4TOsSDOus6\/z4XOvM+AzrnOv8+NIM68zrXPhM6szrLOsc+DzrfPgiDPg8+EzrfOvSDPgM+Bzr\/Ot86zzr\/Pjc68zrXOvc63IM66zqzPgc+EzrEiLAogICAgICAiZGVmYXVsdCI6ICLOoM+Bzr\/Ot86zzr\/Pjc68zrXOvc63IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIs6Vz4TOuc66zq3PhM6xIM66zr\/Phc68z4DOuc6\/z40gzrXOu86tzrPPh86\/z4UgzrHPgM6xzr3PhM6uz4POtc+Jzr0iLAogICAgICAiZGVmYXVsdCI6ICLOiM67zrXOs8+Hzr\/PgiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLOkc+AzrHOuc+EzrXOr8+EzrHOuSDOus6xz4TOsc+Hz47Pgc65z4POtyDOsc+AzqzOvc+EzrfPg863z4Igz4DPgc65zr0gz4TOt869IM61zrzPhs6szr3Ouc+Dzrcgz4TOt8+CIM67z43Pg863z4IiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAizprOtc6vzrzOtc69zr8gzrPOuc6xIM+Ezr8gz4DOtc60zq\/OvyDOtc65z4POsc6zz4nOs86uz4IgzrHPgM6szr3PhM63z4POt8+CIiwKICAgICAgImRlZmF1bHQiOiAizpcgzrHPgM6szr3PhM63z4POriDPg86\/z4UiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAizprOtc6vzrzOtc69zr8gzrPOuc6xIM+Dz4nPg8+Ezq4gzrHPgM6szr3PhM63z4POtyIsCiAgICAgICJkZWZhdWx0IjogIs6jz4nPg8+Ez4wiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAizprOtc6vzrzOtc69zr8gzrPOuc6xIM67zqzOuM6\/z4IgzrHPgM6szr3PhM63z4POtyIsCiAgICAgICJkZWZhdWx0IjogIs6bzqzOuM6\/z4IiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAizprOtc6vzrzOtc69zr8gzrXOvM+GzqzOvc65z4POt8+CIM67z43Pg863z4IiLAogICAgICAiZGVmYXVsdCI6ICLOo8+Jz4PPhM6uIM6xz4DOrM69z4TOt8+DzrciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAizprOtc6vzrzOtc69zr8gz4TOr8+EzrvOv8+FIM6xz4DOv8+EzrXOu861z4POvM6sz4TPic69IiwKICAgICAgImRlZmF1bHQiOiAizpHPgM6\/z4TOtc67zq3Pg868zrHPhM6xIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIs6azrXOr868zrXOvc6\/IM6zzrnOsSDOsc+BzrnOuM68z4wgz4PPic+Dz4TPjs69IM6xz4DOsc69z4TOrs+DzrXPic69IiwKICAgICAgImRlZmF1bHQiOiAiQHNjb3JlIM+Dz4nPg8+EzqwgzrHPgM+MIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLOms61zq\/OvM61zr3OvyDOsc+Azr\/PhM61zrvOtc+DzrzOrM+Ez4nOvSwgzrTOuc6xzrjOrc+DzrnOvM61z4IgzrzOtc+EzrHOss67zrfPhM6tz4I6IEBzY29yZSDOus6xzrkgQHRvdGFsLiDOoM6xz4HOrM60zrXOuc6zzrzOsTogJ0BzY29yZSDPg8+Jz4PPhM6sIM6xz4DPjCBAdG90YWwnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIs6azrXOr868zrXOvc6\/IM61zrzPhs6szr3Ouc+DzrfPgiDOsc+Azr\/PhM61zrvOtc+DzrzOrM+Ez4nOvSIsCiAgICAgICJkZWZhdWx0IjogIs6Rz4DOv8+EzrXOu86tz4POvM6xz4TOsSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLOms61zq\/OvM61zr3OvyDOtc+EzrnOus6tz4TOsc+CIM+Dz43Ovc+Ezr\/OvM63z4IgzrHPgM6szr3PhM63z4POt8+CIiwKICAgICAgImRlZmF1bHQiOiAiQToiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAizprOtc6vzrzOtc69zr8gzr3Orc6xz4Igz4DPgc6\/z4PPgM6szrjOtc65zrHPgiIsCiAgICAgICJkZWZhdWx0IjogIs6Vz4DOsc69zqzOu863z4jOtyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLOlM65zqzOus+BzrnPg863IM+AzrXOts+Ozr0tzrrOtc+GzrHOu86xzq\/Pic69IiwKICAgICAgImRlc2NyaXB0aW9uIjogIs6kzr8gzrrOtc6vzrzOtc69zr8gz4DOv8+FIM61zrnPg86szrPOtc65IM6\/IM+Hz4HOrs+Dz4TOt8+CIM+Az4HOrc+AzrXOuSDOvc6xIM61zq\/Ovc6xzrkgzrHOus+BzrnOss+Oz4Igz4TOvyDOr860zrnOvyAoz4DOtc62zqwtzrrOtc+GzrHOu86xzq\/OsSkgzrzOtSDPhM63zr0gzrHPgM6szr3PhM63z4POty4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAizprOtc6vzrzOtc69zr8gzrvOrM64zr\/PgiDOsc+AzqzOvc+EzrfPg863z4IgzrPOuc6xIM+Fz4DOv8+Dz4TOt8+BzrnOus+EzrnOus6tz4Igz4TOtc+Hzr3Ov867zr\/Os86vzrXPgiIsCiAgICAgICJkZWZhdWx0IjogIs6bzqzOuM6\/z4IgzrHPgM6szr3PhM63z4POty4gzqPPic+Dz4TOriDOsc+AzqzOvc+EzrfPg863IM63IEBhbnN3ZXIiLAogICAgICAiZGVzY3JpcHRpb24iOiAizprOtc6vzrzOtc69zr8gz4DOv8+FIM64zrEgz4fPgc63z4POuc68zr\/PgM6\/zrnOt864zrXOryDOsc+Az4wgz4XPgM6\/z4PPhM63z4HOuc66z4TOuc66zq3PgiDPhM61z4fOvc6\/zrvOv86zzq\/Otc+CLiDOp8+BzrfPg865zrzOv8+Azr\/Ouc6uz4PPhM61IM+EzrcgzrzOtc+EzrHOss67zrfPhM6uIEBhbnN3ZXIuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIs6azrXOr868zrXOvc6\/IM+Dz4nPg8+Ezq7PgiDOsc+AzqzOvc+EzrfPg863z4IgzrPOuc6xIM+Fz4DOv8+Dz4TOt8+BzrnOus+EzrnOus6tz4Igz4TOtc+Hzr3Ov867zr\/Os86vzrXPgiIsCiAgICAgICJkZWZhdWx0IjogIs6XIM6xz4DOrM69z4TOt8+DzrcgQGFuc3dlciDOtc6vzr3Osc65IM+Dz4nPg8+Ezq4uIiwKICAgICAgImRlc2NyaXB0aW9uIjogIs6azrXOr868zrXOvc6\/IM+Azr\/PhSDOuM6xIM+Hz4HOt8+DzrnOvM6\/z4DOv865zrfOuM61zq8gzrHPgM+MIM+Fz4DOv8+Dz4TOt8+BzrnOus+EzrnOus6tz4Igz4TOtc+Hzr3Ov867zr\/Os86vzrXPgiDPjM+EzrHOvSDOvM65zrEgzrrOrM+Bz4TOsSDOsc+AzrHOvc+EzrfOuM61zq8gz4PPic+Dz4TOrC4gzqfPgc63z4POuc68zr\/PgM6\/zrnOrs+Dz4TOtSDPhM63IM68zrXPhM6xzrLOu863z4TOriBAYW5zd2VyLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLOms61zq\/OvM61zr3OvyDPhM+Bzq3Ph86\/z4XPg86xz4IgzrrOrM+Bz4TOsc+CIM6zzrnOsSDPhc+Azr\/Pg8+EzrfPgc65zrrPhM65zrrOrc+CIM+EzrXPh869zr\/Ou86\/zrPOr861z4IiLAogICAgICAiZGVmYXVsdCI6ICLOms6sz4HPhM6xIEBjdXJyZW50IM6xz4DPjCBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAizprOtc6vzrzOtc69zr8gz4DOv8+FIM64zrEgz4fPgc63z4POuc68zr\/PgM6\/zrnOt864zrXOryDOsc+Az4wgz4XPgM6\/z4PPhM63z4HOuc66z4TOuc66zq3PgiDPhM61z4fOvc6\/zrvOv86zzq\/Otc+CIM66zrHPhM6sIM+EzrfOvSDPgM67zr\/Ors6zzrfPg863IM68zrXPhM6xzr7PjSDPhM+Jzr0gzrrOsc+Bz4TPjs69LiDOp8+BzrfPg865zrzOv8+Azr\/Ouc6uz4PPhM61IM+EzrnPgiDOvM61z4TOsc6yzrvOt8+Ezq3PgiBAY3VycmVudCwgQHRvdGFsLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLOpM+Fz4fOsc65zr\/PgM6\/zq\/Ot8+DzrcgzrrOsc+Bz4TPjs69IiwKICAgICAgImRlc2NyaXB0aW9uIjogIs6Vzr3Otc+BzrPOv8+Azr\/Or863z4POtyDOs865zrEgz4TPhc+HzrHOr86xIM+EzrHOvs65zr3PjM68zrfPg863IM+EzrfPgiDPg861zrnPgc6sz4Igz4TPic69IM66zrHPgc+Ez47OvSDPgM6\/z4UgzrXOvM+GzrHOvc6vzrbOv869z4TOsc65LiIKICAgIH0KICBdCn0K"],"libraries\/H5P.Flashcards-1.7\/language\/es.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZXNjcmlwY2nDs24gZGUgbGEgdGFyZWEiCiAgICB9LAogICAgewogICAgICAid2lkZ2V0cyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiUG9yIGRlZmVjdG8iCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiQ2FydGFzIiwKICAgICAgImVudGl0eSI6ICJjYXJ0YSIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAibGFiZWwiOiAiQ2FydGEiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJQcmVndW50YSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJQcmVndW50YSBvcGNpb25hbCBkZSB0ZXh0byBwYXJhIGxhIGNhcnRhLiAoTGEgY2FydGEgcHVlZGUgdXNhciBzw7NsbyB1bmEgaW1hZ2VuLCBzw7NsbyB1biB0ZXh0byBvIGFtYm9zKSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJSZXNwdWVzdGEiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiUmVzcHVlc3RhIChzb2x1Y2nDs24pIHBhcmEgbGEgY2FydGEuIFVzZSB1biBzw61tYm9sbyBkZSBiYXJyYSB2ZXJ0aWNhbCB8IHBhcmEgZGl2aWRpciBzb2x1Y2lvbmVzIGFsdGVybmFzLiBVc2UgXFx8IHNpIHVuYSBzb2x1Y2nDs24gZGViZXLDrWEgZGUgY29udGVuZXIgdW5hIHwuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkltYWdlbiIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJJbWFnZW4gb3BjaW9uYWwgcGFyYSBsYSBjYXJ0YS4gKExhIGNhcnRhIHB1ZWRlIHVzYXIgc8OzbG8gdW5hIGltYWdlbiwgc8OzbG8gdW4gdGV4dG8gbyBhbWJvcykiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiVGV4dG8gYWx0ZXJuYXRpdm8gcGFyYSBsYSBpbWFnZW4iCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiUGlzdGEiLAogICAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJUZXh0byBkZSBwaXN0YSIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBkZSBQcm9ncmVzbyIsCiAgICAgICJkZWZhdWx0IjogIkNhcnRhIEBjYXJkIGRlIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0byBkZSBQcm9ncmVzbywgdmFyaWFibGVzIGRpc3BvbmlibGVzOiBAY2FyZCB5IEB0b3RhbC4gRWplbXBsbzogJ0NhcnRhIEBjYXJkIGRlIEB0b3RhbCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSBlbCBib3TDs24gU2lndWllbnRlIiwKICAgICAgImRlZmF1bHQiOiAiU2lndWllbnRlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgZWwgYm90w7NuIEFudGVyaW9yIiwKICAgICAgImRlZmF1bHQiOiAiQW50ZXJpb3IiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSBlbCBib3TDs24gUmV2aXNhciByZXNwdWVzdGFzIiwKICAgICAgImRlZmF1bHQiOiAiQ29tcHJvYmFyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlJlcXVlcmlyIGVudHJhZGEgZGVsIHVzdWFyaW8gYW50ZXMgZGUgcG9kZXIgdmVyIGxhIHNvbHVjacOzbiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIGVsIGNhbXBvIGRlIGluZ3Jlc28gZGUgcmVzcHVlc3RhIiwKICAgICAgImRlZmF1bHQiOiAiVHUgcmVzcHVlc3RhIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgcmVzcHVlc3RhIGNvcnJlY3RhIiwKICAgICAgImRlZmF1bHQiOiAiQ29ycmVjdGEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSByZXNwdWVzdGEgaW5jb3JyZWN0YSIsCiAgICAgICJkZWZhdWx0IjogIkluY29ycmVjdGEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTW9zdHJhciB0ZXh0byBkZSBzb2x1Y2nDs24iLAogICAgICAiZGVmYXVsdCI6ICJSZXNwdWVzdGEocykgY29ycmVjdGEocykiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gZGUgdMOtdHVsbyBwYXJhIHJlc3VsdGFkb3MiLAogICAgICAiZGVmYXVsdCI6ICJSZXN1bHRhZG9zIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgbsO6bWVybyBkZSBhY2llcnRvcyIsCiAgICAgICJkZWZhdWx0IjogIkBzY29yZSBkZSBAdG90YWwgY29ycmVjdG9zIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHRvIGRlIHJlc3VsdGFkb3MsIHZhcmlhYmxlcyBkaXNwb25pYmxlczogQHNjb3JlIHkgQHRvdGFsLiBFamVtcGxvOiAnQHNjb3JlIGRlIEB0b3RhbCBjb3JyZWN0b3MnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgbW9zdHJhciByZXN1bHRhZG9zIiwKICAgICAgImRlZmF1bHQiOiAiTW9zdHJhciByZXN1bHRhZG9zIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgZXRpcXVldGEgZGUgcmVzcHVlc3RhIGNvcnRhIiwKICAgICAgImRlZmF1bHQiOiAiQToiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSBib3TDs24gXCJpbnRlbnRhciBkZSBudWV2b1wiIiwKICAgICAgImRlZmF1bHQiOiAiSW50ZW50YXIgZGUgbnVldm8iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRGlmZXJlbmNpYXIgZW50cmUgTUFZw5pTQ1VMQVMvbWluw7pzY3VsYXMiLAogICAgICAiZGVzY3JpcHRpb24iOiAiU2UgYXNlZ3VyYSBkZSBxdWUgbGEgZW50cmFkYSBkZWwgdXN1YXJpbyB0ZW5nYSBxdWUgc2VyIGV4YWN0YW1lbnRlIGxhIG1pc21hIHF1ZSBsYSByZXNwdWVzdGEuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIGRlIHJlc3B1ZXN0YSBpbmNvcnJlY3RhIHBhcmEgdGVjbm9sb2fDrWFzIGRlIGFzaXN0ZW5jaWEiLAogICAgICAiZGVmYXVsdCI6ICJSZXNwdWVzdGEgaW5jb3JyZWN0YS4gTGEgcmVzcHVlc3RhIGNvcnJlY3RhIGVyYSBAYW5zd2VyIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHRvIGFudW5jaWFkbyBhIGxhcyB0ZWNub2xvZ8OtYXMgZGUgYXNpc3RlbmNpYS4gVXNhIEBhbnN3ZXIgY29tbyB2YXJpYWJsZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gZGUgcmV0cm9hbGltZW50YWNpw7NuIHBhcmEgY29ycmVjdG8gcGFyYSB0ZWNub2xvZ8OtYXMgZGUgYXNpc3RlbmNpYSIsCiAgICAgICJkZWZhdWx0IjogIkBhbnN3ZXIgZXMgY29ycmVjdGEuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHRvIGFudW5jaWFkbyBhIGxhcyB0ZWNub2xvZ8OtYXMgZGUgYXNpc3RlbmNpYSBjdWFuZG8gc2UgY29udGVzdGEgdW5hIHRhcmpldGEgY29ycmVjdGFtZW50ZS4gVXNhIEBhbnN3ZXIgY29tbyB2YXJpYWJsZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2FtYmlvIGRlIHRhcmpldGEgcGFyYSB0ZWNub2xvZ8OtYXMgZGUgYXNpc3RlbmNpYSIsCiAgICAgICJkZWZhdWx0IjogIlDDoWdpbmEgQGN1cnJlbnQgZGUgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHRvIGFudW5jaWFkbyBhIGxhcyB0ZWNub2xvZ8OtYXMgZGUgYXNpc3RlbmNpYSBhbCBuYXZlZ2FyIGVudHJlIGNhcnRhcy4gVXNhIEBjdXJyZW50IHkgQHRvdGFsIGNvbW8gdmFyaWFibGVzLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCYXJhamFyIGNhcnRhcyIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJIYWJpbGl0YXIgcGFyYSBiYXJhamFyIGVsIG9yZGVuIGRlIHByZWd1bnRhcyBtb3N0cmFkYXMuIgogICAgfQogIF0KfQo="],"libraries\/H5P.Flashcards-1.7\/language\/es-mx.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZXNjcmlwY2nDs24gZGVsIHRyYWJham8iCiAgICB9LAogICAgewogICAgICAid2lkZ2V0cyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiUHJlZGV0ZXJtaW5hZG8iCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiQ2FydGFzIiwKICAgICAgImVudGl0eSI6ICJjYXJ0YSIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAibGFiZWwiOiAiQ2FydGEiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJQcmVndW50YSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJQcmVndW50YSBvcGNpb25hbCBkZSB0ZXh0byBwYXJhIGxhIGNhcnRhLiAoTGEgY2FydGEgcG9kcsOtYSB1c2FyIHNvbGFtZW50ZSB1bmEgaW1hZ2VuLCBzb2xvIHVuIHRleHRvIG8gYW1ib3MpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlJlc3B1ZXN0YSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJSZXNwdWVzdGEgKHNvbHVjacOzbikgcGFyYSBsYSBjYXJ0YS4gVXNlIHVuIHPDrW1ib2xvIGRlIGJhcnJhIHZlcnRpY2FsIHwgcGFyYSBkaXZpZGlyIHNvbHVjaW9uZXMgYWx0ZXJuYXMuIFVzZSBcXHwgc2kgdW5hIHNvbHVjacOzbiBkZWJlcsOtYSBkZSBjb250ZW5lciB1bmEgfC4iCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiSW1hZ2VuIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIkltYWdlbiBvcGNpb25hbCBwYXJhIGxhIGNhcnRhLiAoTGEgY2FydGEgcG9kcsOtYSB1c2FyIHNvbGFtZW50ZSB1bmEgaW1hZ2VuLCBzb2xvIHVuIHRleHRvIG8gYW1ib3MpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlRleHRvIGFsdGVybmF0aXZvIHBhcmEgbGEgaW1hZ2VuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlBpc3RhIiwKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiVGV4dG8gZGUgcGlzdGEiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSBQcm9ncmVzbyIsCiAgICAgICJkZWZhdWx0IjogIkNhcnRhIEBjYXJkIGRlIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0byBkZWwgUHJvZ3Jlc28sIHZhcmlhYmxlcyBkaXNwb25pYmxlczogQGNhcmQgeSBAdG90YWwuIEVqZW1wbG86ICdDYXJ0YSBAY2FyZCBkZSBAdG90YWwnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgZWwgYm90w7NuIFNpZ3VpZW50ZSIsCiAgICAgICJkZWZhdWx0IjogIlNpZ3VpZW50ZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIGVsIGJvdMOzbiBBbnRlcmlvciIsCiAgICAgICJkZWZhdWx0IjogIkFudGVyaW9yIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgZWwgYm90w7NuIENvbXByb2JhciByZXNwdWVzdGFzIiwKICAgICAgImRlZmF1bHQiOiAiQ29tcHJvYmFyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlJlcXVlcmlyIGVudHJhZGEgZGVsIHVzdWFyaW8gYW50ZXMgcXVlIGxhIHNvbHVjacOzbiBwdWVkYSBzZXIgdmlzdGEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSBlbCBjYW1wbyBkZSBpbmdyZXNvIGRlIHJlc3B1ZXN0YSIsCiAgICAgICJkZWZhdWx0IjogIlN1IHJlc3B1ZXN0YSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIHJlc3B1ZXN0YSBjb3JyZWN0YSIsCiAgICAgICJkZWZhdWx0IjogIkNvcnJlY3RvIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgcmVzcHVlc3RhIGluY29ycmVjdGEiLAogICAgICAiZGVmYXVsdCI6ICJJbmNvcnJlY3RhIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIGRlIE1vc3RyYXIgc29sdWNpw7NuIiwKICAgICAgImRlZmF1bHQiOiAiUmVzcHVlc3RhIGNvcnJlY3RhIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlNlcGFyYWRvciBkZSBzb2x1Y2lvbmVzIGFsdGVybmFzIiwKICAgICAgImRlZmF1bHQiOiAibyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIHTDrXR1bG8gZGUgcmVzdWx0YWRvcyIsCiAgICAgICJkZWZhdWx0IjogIlJlc3VsdGFkb3MiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dG8gZGUgUmVzdWx0YWRvcywgdmFyaWFibGVzIGRpc3BvbmlibGVzOiBAc2NvcmUgeSBAdG90YWwuIEVqZW1wbG86ICdAc2NvcmUgZGUgQHRvdGFsIGNvcnJlY3RvcyciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSBuw7ptZXJvIGRlIGFjaWVydG9zIiwKICAgICAgImRlZmF1bHQiOiAiQHNjb3JlIGRlIEB0b3RhbCBjb3JyZWN0b3MiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSBtb3N0cmFyIHJlc3VsdGFkb3MiLAogICAgICAiZGVmYXVsdCI6ICJNb3N0cmFyIHJlc3VsdGFkb3MiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSBldGlxdWV0YSBkZSByZXNwdWVzdGEgY29ydGEiLAogICAgICAiZGVmYXVsdCI6ICJBOiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIGJvdMOzbiBcInJlaW50ZW50YXJcIiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJBc2VndXJhcnNlIHF1ZSBsYSBlbnRyYWRhIGRlbCB1c3VhcmlvIHRlbmdhIHF1ZSBzZXIgZXhhY3RhbWVudGUgbGEgbWlzbWEgcXVlIGxhIHJlc3B1ZXN0YS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTUFZw5pTQ1VMQVMvbWluw7pzY3VsYXMgc2kgaW1wb3J0YW4iLAogICAgICAiZGVmYXVsdCI6ICJSZXNwdWVzdGEgaW5jb3JyZWN0YS4gTGEgcmVzcHVlc3RhIGNvcnJlY3RhIGVyYSBAYW5zd2VyIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkFzZWd1cmFyc2UgcXVlIGxhIGVudHJhZGEgZGVsIHVzdWFyaW8gdGVuZ2EgcXVlIHNlciBleGFjdGFtZW50ZSBsYSBtaXNtYSBxdWUgbGEgcmVzcHVlc3RhLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBkZSByZXNwdWVzdGEgaW5jb3JyZWN0YSBwYXJhIHRlY25vbG9nw61hcyBkZSBhc2lzdGVuY2lhIiwKICAgICAgImRlZmF1bHQiOiAiUmVzcHVlc3RhIGluY29ycmVjdGEuIExhIHJlc3B1ZXN0YSBjb3JyZWN0YSBlcmEgQGFuc3dlciIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0byBxdWUgc2Vyw6EgYW51bmNpYWRvIGEgdGVjbm9sb2fDrWFzIGRlIGFzaXN0ZW5jaWEuIFVzZSBAYW5zd2VyIGNvbW8gdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIGRlIHJldHJvYWxpbWVudGFjacOzbiBwYXJhIGNvcnJlY3RvIHBhcmEgdGVjbm9sb2fDrWFzIGRlIGFzaXN0ZW5jaWEiLAogICAgICAiZGVmYXVsdCI6ICJAYW5zd2VyIGVzIGNvcnJlY3RhLiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0byBhbnVuY2lhZG8gYSBsYXMgdGVjbm9sb2fDrWFzIGRlIGFzaXN0ZW5jaWEgY3VhbmRvIHNlIGNvbnRlc3RhIHVuYSB0YXJqZXRhIGNvcnJlY3RhbWVudGUuIFVzYSBAYW5zd2VyIGNvbW8gdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNhbWJpbyBkZSB0YXJqZXRhIHBhcmEgdGVjbm9sb2fDrWFzIGRlIGFzaXN0ZW5jaWEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dG8gYW51bmNpYWRvIGEgbGFzIHRlY25vbG9nw61hcyBkZSBhc2lzdGVuY2lhIGFsIG5hdmVnYXIgZW50cmUgY2FydGFzLiBVc2EgQGN1cnJlbnQgeSBAdG90YWwgY29tbyB2YXJpYWJsZXMuIgogICAgfQogIF0KfQo="],"libraries\/H5P.Flashcards-1.7\/language\/et.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLDnGxlc2FuZGUga2lyamVsZHVzIgogICAgfSwKICAgIHsKICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIlZhaWtpbWlzaSIKICAgICAgICB9CiAgICAgIF0sCiAgICAgICJsYWJlbCI6ICJLYWFyZGlkIiwKICAgICAgImVudGl0eSI6ICJrYWFydCIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAibGFiZWwiOiAiS2FhcnQiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJLw7xzaW11cyIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJWYWxpa3VsaW5lIHRla3N0aWvDvHNpbXVzIGthYXJkaWxlLiAoS2FhcnQgdsO1aWIga2FzdXRhZGEgdmFpZCBwaWx0aSwgdmFpZCB0ZWtzdGkgdsO1aSBtw7VsZW1hdCkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiVmFzdHVzIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIlZhc3R1cyAobGFoZW5kdXMpIGthYXJkaWxlLiBVc2UgYSBwaXBlIHN5bWJvbCB8IHRvIHNwbGl0IGFsdGVybmF0aXZlIHNvbHV0aW9ucy4gVXNlIFxcfCBpZiBhIHNvbHV0aW9uIHNob3VsZCBjb250YWluIGEgfC4iCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiUGlsdCIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJWYWxpa3VsaW5lIHBpbHQga2FhcmRpbGUuIChLYWFydCB2w7VpYiBrYXN1dGFkYSB2YWlkIHBpbHRpLCB2YWlkIHRla3N0aSB2w7VpIG3DtWxlbWF0KSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJBbHRlcm5hdGl2ZSB0ZXh0IGZvciBpbWFnZSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJWaWhqZSIsCiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlZpaGplIHRla3N0IgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkVkYXNpasO1dWRtaXNlIHRla3N0IiwKICAgICAgImRlZmF1bHQiOiAiS2FhcnQgQGNhcmQgLyBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRWRhc2lqw7V1ZG1pc2UgdGVrc3QsIGthc3V0YXRhdmFkIG11dXR1amFkIG9uOiBAY2FyZCBqYSBAdG90YWwuIE7DpGl0ZWtzOiAnS2FhcnQgQGNhcmQgLyBAdG90YWwnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkrDpHJnbWluZSBudXB1IHRla3N0IiwKICAgICAgImRlZmF1bHQiOiAiSsOkcmdtaW5lIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkVlbG1pbmUgbnVwdSB0ZWtzdCIsCiAgICAgICJkZWZhdWx0IjogIkVlbG1pbmUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVmFzdHVzdGUga29udHJvbGxpIG51cHUgdGVrc3QiLAogICAgICAiZGVmYXVsdCI6ICJLb250cm9sbGkiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTsO1dWEga2FzdXRhamEgc2lzZW5kaXQgZW5uZSwga3VpIGxhaGVuZHVzdCBzYWFiIHZhYWRhdGEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVmFzdHVzZSBzaXNlc3RhbWlzdsOkbGphIHRla3N0IiwKICAgICAgImRlZmF1bHQiOiAiU2ludSB2YXN0dXMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiw5VpZ2UgdmFzdHVzZSB0ZWtzdCIsCiAgICAgICJkZWZhdWx0IjogIsOVaWdlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlZhbGUgdmFzdHVzZSB0ZWtzdCIsCiAgICAgICJkZWZhdWx0IjogIlZhbGUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTGFoZW5kdXNlIG7DpGl0YW1pc2UgdGVrc3QiLAogICAgICAiZGVmYXVsdCI6ICLDlWlnZSB2YXN0dXMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVHVsZW11c3RlIHBlYWxraXJqYSB0ZWtzdCIsCiAgICAgICJkZWZhdWx0IjogIlR1bGVtdXNlZCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLDlWlnZXRlIHZhc3R1c3RlIGFydnUgdGVrc3QiLAogICAgICAiZGVmYXVsdCI6ICJAc2NvcmUgLyBAdG90YWwgw7VpZ2V0IHZhc3R1c3QiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVHVsZW11c3RlIHRla3N0LCBrYXN1dGF0YXZhZCBtdXV0dWphZDogQHNjb3JlIGphIEB0b3RhbC4gTsOkaXRla3M6ICdAc2NvcmUgLyBAdG90YWwgw7VpZ2V0JyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUdWxlbXVzdGUgbsOkaXRhbWlzZSB0ZWtzdCIsCiAgICAgICJkZWZhdWx0IjogIk7DpGl0YSB0dWxlbXVzaSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJMw7xoaWtlc2UgdmFzdHVzZXNpbGRpIHRla3N0IiwKICAgICAgImRlZmF1bHQiOiAiQToiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiXCJQcm9vdmkgdXVlc3RpXCIgbnVwdSB0ZWtzdCIsCiAgICAgICJkZWZhdWx0IjogIlByb292aSB1dWVzdGkiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVMO1c3R1dHVuZGxpayIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJLb250cm9sbGliLCBldCBrYXN1dGFqYSBzaXNlbmQgb2xla3MgdMOkcHNlbHQgc2FtYSwgbWlzIHZhc3R1cyAoc3V1ci0vdsOkaWtldMOkaGVkKS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiSW5jb3JyZWN0IHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJJbmNvcnJlY3QgYW5zd2VyLiBDb3JyZWN0IGFuc3dlciB3YXMgQGFuc3dlciIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcy4gVXNlIEBhbnN3ZXIgYXMgdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNvcnJlY3QgZmVlZGJhY2sgdGV4dCBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIkBhbnN3ZXIgaXMgY29ycmVjdC4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMgd2hlbiBhIGNhcmQgaXMgYW5zd2VyZWQgY29ycmVjdGx5LiBVc2UgQGFuc3dlciBhcyB2YXJpYWJsZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2FyZCBjaGFuZ2UgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJQYWdlIEBjdXJyZW50IG9mIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcyB3aGVuIG5hdmlnYXRpbmcgYmV0d2VlbiBjYXJkcy4gVXNlIEBjdXJyZW50IGFuZCBAdG90YWwgYXMgdmFyaWFibGVzLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJSYW5kb21pemUgY2FyZHMiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRW5hYmxlIHRvIHJhbmRvbWl6ZSB0aGUgb3JkZXIgb2YgY2FyZHMgb24gZGlzcGxheS4iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Flashcards-1.7\/language\/eu.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJMYW5hcmVuIGRlc2tyaWJhcGVuYSIKICAgIH0sCiAgICB7CiAgICAgICJ3aWRnZXRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJMZWhlbnRzaXRha29hIgogICAgICAgIH0KICAgICAgXSwKICAgICAgImxhYmVsIjogIlR4YXJ0ZWxhayIsCiAgICAgICJlbnRpdHkiOiAidHhhcnRlbGEiLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImxhYmVsIjogIlR4YXJ0ZWxhIiwKICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiR2FsZGVyYSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJUeGFydGVsYXJlbnR6YWtvIGF1a2VyYXprbyB0ZXN0dS1nYWxkZXJhLiAoVHhhcnRlbGFrIHNvaWxpayBpcnVkaWEsIHNvaWxpayB0ZXN0dWEgZWRvIGVyYWJpbGkgZGl0emFrZSkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiRXJhbnR6dW5hIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIkVyYW50enVuYS4gVXNlIGEgcGlwZSBzeW1ib2wgfCB0byBzcGxpdCBhbHRlcm5hdGl2ZSBzb2x1dGlvbnMuIFVzZSBcXHwgaWYgYSBzb2x1dGlvbiBzaG91bGQgY29udGFpbiBhIHwuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIklydWRpYSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJBdWtlcmFrbyBpcnVkaWEgKHR4YXJ0ZWxhayBpemFuZ28gZHUgYmFrYXJyaWsgaXJ1ZGlhLCBiYWthcnJpayB0ZXN0dWEgZWRvIGJpYWspIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIklydWRpYXJlbiBvcmRlemtvIHRlc3R1YSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJBcmdpYmlkZWEiLAogICAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJBcmdpYmlkZWFyZW4gdGVzdHVhIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkF1cnJlcmFwZW5hcmVuIHRlc3R1YSIsCiAgICAgICJkZWZhdWx0IjogIkBjYXJkIC8gQHRvdGFsIHR4YXJ0ZWxhIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkF1cnJlcmFwZW5hcmVuIHRlc3R1YSwgZXJhYmlsdHplbiBkaXJlbiBhbGRhZ2FpYWs6IEBjYXJkIGV0YSBAdG90YWwuIEFkaWJpZGVhOiAnQGNhcmQgLyBAdG90YWwgdHhhcnRlbGEnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkh1cnJlbmdvYSBib3RvaWFyZW4gdGVzdHVhIiwKICAgICAgImRlZmF1bHQiOiAiSHVycmVuZ29hIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkF1cnJla29hIGJvdG9pYXJlbiB0ZXN0dWEiLAogICAgICAiZGVmYXVsdCI6ICJBdXJyZWtvYSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJcIkVnaWF6dGF0dVwiIGJvdG9pYXJlbnR6YWtvIHRlc3R1YSIsCiAgICAgICJkZWZhdWx0IjogIkVnaWF6dGF0dSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJBbGRleiBhdXJyZXRpayBlcmFiaWx0emFpbGVhayBzYXJ0dSBiZWhhciBkdSBlcmFudHp1biBiYXQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRXJhbnR6dW5hIHNhcnR6ZWtvIGVyZW11YXJlbiB0ZXN0dWEiLAogICAgICAiZGVmYXVsdCI6ICJadXJlIGVyYW50enVuYSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFcmFudHp1biB6dXplbmVyYWtvIHRlc3R1YSIsCiAgICAgICJkZWZhdWx0IjogIkVyYW50enVuIHp1emVuYSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFcmFudHp1biBva2VycmFyZW4gdGVzdHVhIiwKICAgICAgImRlZmF1bHQiOiAiRXJhbnR6dW4gb2tlcnJhIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkVyYWt1dHNpIGVyYW50enVuIHp1emVuYSB0ZXN0dWEiLAogICAgICAiZGVmYXVsdCI6ICJFcmFudHp1biB6dXplbmEoaykiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRW1haXR6ZW4gdGl0dWx1YXJlbiB0ZXN0dWEiLAogICAgICAiZGVmYXVsdCI6ICJFbWFpdHphayIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFcmFudHp1biB6dXplbmVuIGtvcHVydWFyZW4gdGVzdHVhIiwKICAgICAgImRlZmF1bHQiOiAiQHNjb3JlIC8gQHRvdGFsIHp1emVuYWsiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRXJhbnR6dW4genV6ZW5lbiB0ZXN0dWEsIGVyYWJpbHR6ZW4gZGl0dWVuIGFsZGFnYWlhazogQHNjb3JlIGV0YSBAdG90YWwuIEFkaWJpZGVhOiAnQHNjb3JlIC8gQHRvdGFsIHp1emVuYWsnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkJpc3RhcmF0dSBlbWFpdHphayB0ZXN0dWEiLAogICAgICAiZGVmYXVsdCI6ICJCaXN0YXJhdHUgZW1haXR6YWsiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRXJhbnR6dW4gbGFidXJyYXJlbiBldGlrZXRhcmVuIHRlc3R1YSIsCiAgICAgICJkZWZhdWx0IjogIkVyYW50enVuYToiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiXCJTYWlhdHUgYmVycmlyb1wiIGJvdG9pYXJlbnR6YWtvIHRlc3R1YSIsCiAgICAgICJkZWZhdWx0IjogIlNhaWF0dSBiZXJyaXJvIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkJlcmVpemkgbWFpdXNrdWxhayBldGEgbWludXNrdWxhayIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJFemFydHplbiBkdSBlcmFiaWx0emFpbGVhcmVuIHNhcnJlcmEgaXphbiBiZWhhciBkdWVsYSBlcmFudHp1bmFyZW4gYmVyZGluYS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRXJhbnR6dW4gb2tlcnJhcmVudHpha28gdGVzdHVhIGxhZ3VudHphcmFrbyB0ZWtub2xvZ2llbnR6YXQiLAogICAgICAiZGVmYXVsdCI6ICJFcmFudHp1biBva2VycmEuIEVyYW50enVuIHp1emVuYSBAYW5zd2VyIHplbiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJMYWd1bnR6YXJha28gdGVrbm9sb2dpZXRhbiBlcmFiaWxpa28gZGVuIHRlc3R1YS4gRXJhYmlsaSBAYW5zd2VyIGFsZGFnYWkgZ2lzYS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRXJhbnR6dW4genV6ZW5lcmFrbyBmZWVkYmFja2FyZW4gdGVzdHVhIGxhZ3VudHphIHRla25vbG9naWV0YXJha28iLAogICAgICAiZGVmYXVsdCI6ICJAYW5zd2VyIHp1emVuYSBkYS4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVHhhcnRlbCBiYXRpIG1vZHUgenV6ZW5lYW4gZXJhbnR6dW5leiBnZXJvIGxhZ3VudHphIHRla25vbG9naWVudHpha28gaXJhZ2FycmlrbyBkZW4gdGVzdHVhLiBAYW5zd2VyIGFsZGFnaSBnaXNhIGVyYWJpbGkgZGV6YWtlenUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlR4YXJ0ZWwgYWxkYWtldGEgbGFndW50emFyYWtvIHRla25vbG9naWVudHphdCIsCiAgICAgICJkZWZhdWx0IjogIkBjdXJyZW50LiBvcnJpYSwgQHRvdGFsIGd1enRpcmEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiTGFndW50emFyYWtvIHRla25vbG9naWV0YW4gdHhhcnRlbCBhcnRlYW4gbmFiaWdhdHplYW4gZXJhYmlsaWtvIGRlbiB0ZXN0dWEuIEVyYWJpbGkgQGN1cnJlbnQgZXRhIEB0b3RhbCBhbGRhZ2FpIGdpc2EuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkF1c2F6a28gdHhhcnRlbGFrIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkdhaXR1IHBhbnRhaWxha28gdHhhcnRlbGVuIG9yZGVuYSBhdXNhemtvYSBpemF0ZWEuIgogICAgfQogIF0KfQo="],"libraries\/H5P.Flashcards-1.7\/language\/fi.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWh0w6R2w6Rua3V2YXVzIgogICAgfSwKICAgIHsKICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIk9sZXR1cyIKICAgICAgICB9CiAgICAgIF0sCiAgICAgICJsYWJlbCI6ICJLb3J0aXQiLAogICAgICAiZW50aXR5IjogImtvcnR0aSIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAibGFiZWwiOiAiS29ydHRpIiwKICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiS3lzeW15cyIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJLb3J0aW4ga3lzeW15c3Rla3N0aSwgZWkgcGFrb2xsaW5lbiBrZW50dMOkLiAoa29ydHRpIHZvaSBzaXPDpGx0w6TDpCBwZWxrw6RuIGt1dmFuLCBwZWxrw6RuIHRla3N0aW4gdGFpIHNpc8OkbHTDpMOkIGt1dmFuIGphIHRla3N0aW4pIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlZhc3RhdXMiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiVmFzdGF1cyAoZWkgcGFrb2xsaW5lbiBrZW50dMOkKS4gVXNlIGEgcGlwZSBzeW1ib2wgfCB0byBzcGxpdCBhbHRlcm5hdGl2ZSBzb2x1dGlvbnMuIFVzZSBcXHwgaWYgYSBzb2x1dGlvbiBzaG91bGQgY29udGFpbiBhIHwuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkt1dmEiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiS29ydGluIGt1dmEgKGVpIHBha29sbGluZW4ga2VudHTDpCkgS29ydHRpIHZvaSBzaXPDpGx0w6TDpCBwZWxrw6RuIGt1dmFuLCBwZWxrw6RuIHRla3N0aW4gdGFpIHNpc8OkbHTDpMOkIGt1dmFuIGphIHRla3N0aW4iCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQWx0ZXJuYXRpdmUgdGV4dCBmb3IgaW1hZ2UiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiVmloamUiLAogICAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJWaWhqZXRla3N0aSIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFdGVuZW1pc3Rla3N0aSIsCiAgICAgICJkZWZhdWx0IjogIktvcnR0aSBAY2FyZCAvIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJFdGVuZW1pc3Rla3N0aSwga8OkeXRldHTDpHZpc3PDpCBvbGV2YXQgbXV1dHR1amF0IEBjYXJkIGphIEB0b3RhbCBFc2ltZXJraWtzaTogJ0tvcnR0aSBAY2FyZCAvIEB0b3RhbCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiU2V1cmFhdmEtcGFpbmlra2VlbiB0ZWtzdGkiLAogICAgICAiZGVmYXVsdCI6ICJTZXVyYWF2YSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUYWthaXNpbi1wYWluaWtrZWVuIHRla3N0aSIsCiAgICAgICJkZWZhdWx0IjogIlRha2Fpc2luIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRhcmtpc3RhIHZhc3RhdWtzZXQgLXBhaW5pa2tlZW4gdGVrc3RpIiwKICAgICAgImRlZmF1bHQiOiAiVGFya2lzdGEgdmFzdGF1a3NldCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJWYWFkaSBrw6R5dHTDpGrDpGx0w6QgdmFzdGF1cyBlbm5lbiBrdWluIHJhdGthaXN1IG7DpHl0ZXTDpMOkbi4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVmFzdGF1c2tlbnTDpG4gdGVrc3RpIiwKICAgICAgImRlZmF1bHQiOiAiVmFzdGF1a3Nlc2kiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiT2lrZWFuIHZhc3RhdWtzZW4gdGVrc3RpIiwKICAgICAgImRlZmF1bHQiOiAiT2lrZWluIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlbDpMOkcsOkbiB2YXN0YXVrc2VuIHRla3N0aSIsCiAgICAgICJkZWZhdWx0IjogIlbDpMOkcmluIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk7DpHl0w6QgdmFzdGF1a3NldCB0ZWtzdGkiLAogICAgICAiZGVmYXVsdCI6ICJPaWtlYSB2YXN0YXVzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlR1bG9rc2V0IG90c2lra28iLAogICAgICAiZGVmYXVsdCI6ICJUdWxva3NldCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdGkgb2lrZWluIHNhYWR1aWxsZSB2YXN0YXVrc2lsbGUiLAogICAgICAiZGVmYXVsdCI6ICJAc2NvcmUgLyBAdG90YWwgb2lrZWluIiwKICAgICAgImRlc2NyaXB0aW9uIjogInR1bG9zdGVrc3RpLCBrw6R5dGV0dMOkdmlzc8OkIG9sZXZhdCBtdXV0dHVqYXQ6IEBzY29yZSBqYSBAdG90YWwuIEVzaW1lcmtraTogJ0BzY29yZSAvIEB0b3RhbCBvaWtlaW4nIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk7DpHl0w6QgdHVsb2tzZXQgdGVrc3RpIiwKICAgICAgImRlZmF1bHQiOiAiTsOkeXTDpCB0dWxva3NldCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJMeWh5ZW4gdmFzdGF1a3NlbiB0ZWtzdGkiLAogICAgICAiZGVmYXVsdCI6ICJBOiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdGkgXCJyZXRyeVwiIHBhaW5pa2tlZWxsZSIsCiAgICAgICJkZWZhdWx0IjogIllyaXTDpCB1dWRlbGxlZW4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAibWVya2tpa29rb3JpaXBwdXZhaW5lbiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJNw6TDpHJpdHTDpMOkIHR1bGVla28gdmFzdGF1a3NlbiBvbGxhIGlkZW50dGluZW4gbcOkw6RyaXRlbGx5biB2YXN0YXVrc2VuIG11a2Fpc2VzdGkgKGVsaSBpc290IGphIHBpZW5ldCBraXJqYWltZXQgaHVvbWlvaWRhYW4gam5lLikiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiSW5jb3JyZWN0IHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJJbmNvcnJlY3QgYW5zd2VyLiBDb3JyZWN0IGFuc3dlciB3YXMgQGFuc3dlciIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcy4gVXNlIEBhbnN3ZXIgYXMgdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNvcnJlY3QgZmVlZGJhY2sgdGV4dCBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIkBhbnN3ZXIgaXMgY29ycmVjdC4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMgd2hlbiBhIGNhcmQgaXMgYW5zd2VyZWQgY29ycmVjdGx5LiBVc2UgQGFuc3dlciBhcyB2YXJpYWJsZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2FyZCBjaGFuZ2UgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJQYWdlIEBjdXJyZW50IG9mIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcyB3aGVuIG5hdmlnYXRpbmcgYmV0d2VlbiBjYXJkcy4gVXNlIEBjdXJyZW50IGFuZCBAdG90YWwgYXMgdmFyaWFibGVzLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJTZWtvaXRhIGtvcnRpdCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUw6RsbMOkIHZhbGlubmFsbGEgdm9pdCBzYXR1bm5haXN0YWEga29ydHRpZW4gZXNpaW50eW1pc2rDpHJqZXN0eWtzZW4uIgogICAgfQogIF0KfQo="],"libraries\/H5P.Flashcards-1.7\/language\/fr.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJDb25zaWduZSIKICAgIH0sCiAgICB7CiAgICAgICJ3aWRnZXRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJQYXIgZMOpZmF1dCIKICAgICAgICB9CiAgICAgIF0sCiAgICAgICJsYWJlbCI6ICJDYXJ0ZXMiLAogICAgICAiZW50aXR5IjogImNhcnRlIiwKICAgICAgImZpZWxkIjogewogICAgICAgICJsYWJlbCI6ICJDYXJ0ZSIsCiAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlF1ZXN0aW9uIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIlF1ZXN0aW9uIGZhY3VsdGF0aXZlIHBvdXIgbGEgY2FydGUuIChMYSBjYXJ0ZSBwZXV0IGNvbnRlbmlyIHVuZSBpbWFnZSBzZXVsZSwgdW4gdGV4dGUgc2V1bCBvdSBsZXMgZGV1eCBjb21iaW7DqXMpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlLDqXBvbnNlIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIlLDqXBvbnNlIChzb2x1dGlvbikgcG91ciBsYSBjYXJ0ZS4gVXRpbGlzZXIgdW4gc3ltYm9sZSBwaXBlIHwgcG91ciBzw6lwYXJlciBsZXMgc29sdXRpb25zIGFsdGVybmF0aXZlcy4gVXRpbGlzZXogXFx8IHNpIHVuZSBzb2x1dGlvbiBkb2l0IGNvbnRlbmlyIHVuIHwuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkltYWdlIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIkltYWdlIGZhY3VsdGF0aXZlIHBvdXIgbGEgY2FydGUuIChMYSBjYXJ0ZSBwZXV0IGNvbnRlbmlyIHVuZSBpbWFnZSBzZXVsZSwgdW4gdGV4dGUgc2V1bCBvdSBsZXMgZGV1eCBjb21iaW7DqXMpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlRleHRlIGFsdGVybmF0aWYgcG91ciBsJ2ltYWdlIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkluZGljZSIsCiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlRleHRlIGRlIGwnaW5kaWNlIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRlIGRlIHByb2dyZXNzaW9uIiwKICAgICAgImRlZmF1bHQiOiAiQ2FydGUgQGNhcmQgc3VyIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0ZSBkZSBwcm9ncmVzc2lvbiwgdmFyaWFibGVzIHBvc3NpYmxlc+KArzogQGNhcmQgZXQgQHRvdGFsLiAoRXhlbXBsZeKArzogJ0NhcnRlIEBjYXJkIHN1ciBAdG90YWwnKSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0ZSBwb3VyIGxlIGJvdXRvbiBcIlN1aXZhbnRcIiIsCiAgICAgICJkZWZhdWx0IjogIlN1aXZhbnQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dGUgcG91ciBsZSBib3V0b24gXCJQcsOpY8OpZGVudFwiIiwKICAgICAgImRlZmF1bHQiOiAiUHLDqWPDqWRlbnQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dGUgcG91ciBsZSBib3V0b24gXCJWw6lyaWZpZXJcIiIsCiAgICAgICJkZWZhdWx0IjogIlbDqXJpZmllciIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJPYmxpZ2VyIGwndXRpbGlzYXRldXIgw6AgZW50cmVyIHVuZSByw6lwb25zZSBhdmFudCBkZSBwb3V2b2lyIGFmZmljaGVyIGxhIGNvcnJlY3Rpb24iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dGUgcG91ciBsZSBjaGFtcCBkZSBzYWlzaWUgZGUgbGEgcsOpcG9uc2UiLAogICAgICAiZGVmYXVsdCI6ICJWb3RyZSByw6lwb25zZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0ZSBwb3VyIGxhIGJvbm5lIHLDqXBvbnNlIiwKICAgICAgImRlZmF1bHQiOiAiUsOpcG9uc2UgZXhhY3RlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRlIHBvdXIgdW5lIG1hdXZhaXNlIHLDqXBvbnNlIiwKICAgICAgImRlZmF1bHQiOiAiUsOpcG9uc2UgaW5leGFjdGUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQWZmaWNoZXIgbGUgdGV4dGUgZGUgbGEgc29sdXRpb24iLAogICAgICAiZGVmYXVsdCI6ICJSw6lwb25zZShzKSBjb3JyZWN0ZShzKSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0ZSBwb3VyIGwnaW50aXR1bMOpIGRlcyByw6lzdWx0YXRzIiwKICAgICAgImRlZmF1bHQiOiAiUsOpc3VsdGF0cyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0ZSBwb3VyIGxlIG5vbWJyZSBkZSBib25uZXMgcsOpcG9uc2VzIiwKICAgICAgImRlZmF1bHQiOiAiQHNjb3JlIHLDqXBvbnNlcyBjb3JyZWN0ZXMgc3VyIHVuIHRvdGFsIGRlIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0ZSBkZXMgcsOpc3VsdGF0cywgdmFyaWFibGVzIGRpc3BvbmlibGVzOiBAc2NvcmUgZXQgQHRvdGFsLiBFeGVtcGxlOiAnQHNjb3JlIHLDqXBvbnNlcyBjb3JyZWN0ZXMgc3VyIHVuIHRvdGFsIGRlIEB0b3RhbCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dGUgcG91ciBtb250cmVyIGxlcyByw6lzdWx0YXRzIiwKICAgICAgImRlZmF1bHQiOiAiTW9udHJlciBsZXMgcsOpc3VsdGF0cyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0ZSBwb3VyIGwnaW50aXR1bMOpIGRlIHLDqXBvbnNlIGNvdXJ0ZSIsCiAgICAgICJkZWZhdWx0IjogIlIgOiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0ZSBwb3VyIGxlIGJvdXRvbiBcIlJlY29tbWVuY2VyXCIiLAogICAgICAiZGVmYXVsdCI6ICJSZWNvbW1lbmNlciIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJTZW5zaWJsZSDDoCBsYSBjYXNzZSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJJbXBvc2UgcXVlIGxhIHNhaXNpZSBkZSBsJ3V0aWxpc2F0ZXVyIHNvaXQgc3RyaWN0ZW1lbnQgaWRlbnRpcXVlIMOgIGxhIHLDqXBvbnNlIGF0dGVuZHVlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0ZSBkZSByw6lwb25zZSBpbmNvcnJlY3RlIHBvdXIgbGVzIG91dGlscyBkJ2FjY2Vzc2liaWxpdMOpIiwKICAgICAgImRlZmF1bHQiOiAiUsOpcG9uc2UgaW5jb3JyZWN0ZS4gTGEgcsOpcG9uc2UgY29ycmVjdGUgw6l0YWl0IEBhbnN3ZXIiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dGUgcXVpIHNlcmEgYW5ub25jw6kgYXV4IG91dGlscyBkJ2FjY2Vzc2liaWxpdMOpLiBVdGlsaXNleiBAcsOpcG9uc2UgY29tbWUgdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkZlZWRiYWNrIGRlIHLDqXBvbnNlIGNvcnJlY3RlIHBvdXIgbGVzIG91dGlscyBkJ2FjY2Vzc2liaWxpdMOpIiwKICAgICAgImRlZmF1bHQiOiAiQGFuc3dlciBlc3QgY29ycmVjdC4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dGUgcXVpIHNlcmEgYW5ub25jw6kgYXV4IG91dGlscyBkJ2FjY2Vzc2liaWxpdMOpIGxvcnNxdSd1bmUgcsOpcG9uc2UgY29ycmVjdGUgZXN0IGRvbm7DqWUuIFV0aWxpc2V6IEByw6lwb25zZSBjb21tZSB2YXJpYWJsZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2hhbmdlbWVudCBkZSBjYXJ0ZSBwb3VyIGxlcyBvdXRpbHMgZCdhY2Nlc3NpYmlsaXTDqSIsCiAgICAgICJkZWZhdWx0IjogIlBhZ2UgQGN1cnJlbnQgZGUgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHRlIHF1aSBzZXJhIGFubm9uY8OpIGF1eCBvdXRpbHMgZCdhY2Nlc3NpYmlsaXTDqSBsb3JzIGRlIGxhIG5hdmlnYXRpb24gZW50cmUgbGVzIGNhcnRlcy4gVXRpbGlzZXogQGN1cnJlbnQgZXQgQHRvdGFsIGNvbW1lIHZhcmlhYmxlcy4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTcOpbGFuZ2VyIGxlcyBjYXJ0ZXMiLAogICAgICAiZGVzY3JpcHRpb24iOiAiQWN0aXZlciBsJ2FmZmljaGFnZSBkZXMgcsOpcG9uc2VzIGRhbnMgdW4gb3JkcmUgYWzDqWF0b2lyZS4iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Flashcards-1.7\/language\/gl.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZXNjcmljacOzbiBkYSB0YXJlZmEiCiAgICB9LAogICAgewogICAgICAid2lkZ2V0cyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiUG9yIGRlZmVjdG8iCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiVGFyeGV0YXMiLAogICAgICAiZW50aXR5IjogInRhcnhldGEiLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImxhYmVsIjogIlRhcnhldGEiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJQcmVndW50YSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJQcmVndW50YSBkZSB0ZXh0byBvcGNpb25hbCBwYXJhIGEgdGFyeGV0YS4gKEEgdGFyeGV0YSBwb2RlIHVzYXIgc8OzIHVuaGEgaW1heGUsIHPDsyB0ZXh0byBvdSBhbWJvcykiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiUmVzcG9zdGEiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiUmVzcG9zdGEgKHNvbHVjacOzbikgcGFyYSBhIHRhcnhldGEuIFVzZSBhIHBpcGUgc3ltYm9sIHwgdG8gc3BsaXQgYWx0ZXJuYXRpdmUgc29sdXRpb25zLiBVc2UgXFx8IGlmIGEgc29sdXRpb24gc2hvdWxkIGNvbnRhaW4gYSB8LiIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJJbWF4ZSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJJbWF4ZSBvcGNpb25hbCBwYXJhIGEgdGFyeGV0YS4gKEEgdGFyeGV0YSBwb2RlIHVzYXIgc8OzIHVuaGEgaW1heGUsIHPDsyB0ZXh0byBvdSBhbWJvcykiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiVGV4dG8gYWx0ZXJuYXRpdm8gcGFyYSBhIGltYXhlIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlBpc3RhIiwKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiVGV4dG8gZGEgcGlzdGEiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gZGUgcHJvZ3Jlc28iLAogICAgICAiZGVmYXVsdCI6ICJUYXJ4ZXRhIEBjYXJkIGRlIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0byBkZSBwcm9ncmVzbzsgdmFyaWFibGVzIGRpc3Bvw7FpYmxlczogQGNhcmQgZSBAdG90YWwuIEV4ZW1wbG86ICdUYXJ4ZXRhIEBjYXJkIGRlIEB0b3RhbCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSBvIGJvdMOzbiBzZWd1aW50ZSIsCiAgICAgICJkZWZhdWx0IjogIlNlZ3VpbnRlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgbyBib3TDs24gYW50ZXJpb3IiLAogICAgICAiZGVmYXVsdCI6ICJBbnRlcmlvciIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIG8gYm90w7NuIGNvbXByb2JhciByZXNwb3N0YXMiLAogICAgICAiZGVmYXVsdCI6ICJDb21wcm9iYXIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUmVxdWVyaXIgcmVzcG9zdGEgZG8gdXN1YXJpbyBhbnRlcyBkZSBxdWUgcG9pZGEgdmVyIGEgc29sdWNpw7NuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgbyBjYW1wbyBkZSByZXNwb3N0YSIsCiAgICAgICJkZWZhdWx0IjogIkEgdMO6YSByZXNwb3N0YSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIHJlc3Bvc3RhIGNvcnJlY3RhIiwKICAgICAgImRlZmF1bHQiOiAiQ29ycmVjdG8iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSByZXNwb3N0YSBpbmNvcnJlY3RhIiwKICAgICAgImRlZmF1bHQiOiAiSW5jb3JyZWN0YSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIGFtb3NhciBhIHNvbHVjacOzbiIsCiAgICAgICJkZWZhdWx0IjogIlJlc3Bvc3RhKHMpIGNvcnJlY3RhKHMpIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgbyB0w610dWxvIGRvcyByZXN1bHRhZG9zIiwKICAgICAgImRlZmF1bHQiOiAiUmVzdWx0YWRvcyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIG7Dum1lcm8gZGUgcmVzcG9zdGFzIGNvcnJlY3RhcyIsCiAgICAgICJkZWZhdWx0IjogIkBzY29yZSBkZSBAdG90YWwgc29uIGNvcnJlY3RhcyIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0byBwYXJhIHJlc3VsdGFkb3MsIHZhcmlhYmxlcyBkaXNwb8OxaWJsZXM6IEBzY29yZSBlIEB0b3RhbC4gRXhlbXBsbzogJ0BzY29yZSBkZSBAdG90YWwgc29uIGNvcnJlY3RhcyciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSBhbW9zYXIgcmVzdWx0YWRvcyIsCiAgICAgICJkZWZhdWx0IjogIkFtb3NhciByZXN1bHRhZG9zIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgZXRpcXVldGEgZGUgcmVzcG9zdGEgY3VydGEiLAogICAgICAiZGVmYXVsdCI6ICJSOiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIG8gYm90w7NuIFwicmVpbnRlbnRhclwiIiwKICAgICAgImRlZmF1bHQiOiAiUmVpbnRlbnRhciIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEaWZlcmVuY2lhIGVudHJlIG1hacO6c2N1bGFzIGUgbWluw7pzY3VsYXMiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRmFpIHF1ZSBvIHRleHRvIGludHJvZHVjaWRvIHBvbG8gdXN1YXJpbyB0ZcOxYSBxdWUgc2VyIGV4YWN0YW1lbnRlIGlndWFsIHF1ZSBhIHJlc3Bvc3RhLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBkZSByZXNwb3N0YSBpbmNvcnJlY3RhIHBhcmEgdGVjbm9sb3jDrWFzIGRlIGFzaXN0ZW5jaWEiLAogICAgICAiZGVmYXVsdCI6ICJSZXNwb3N0YSBpbmNvcnJlY3RhLiBBIHJlc3Bvc3RhIGNvcnJlY3RhIGVyYSBAYW5zd2VyIiwKICAgICAgImRlc2NyaXB0aW9uIjogIk8gdGV4dG8gcGFzYXJhc2Ugw6FzIHRlY25vbG94w61hcyBkZSBhc2lzdGVuY2lhLiBVc2EgQGFuc3dlciBjb21vIHZhcmlhYmxlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBkZSByZXRyb2FsaW1lbnRhY2nDs24gZGUgcmVzcG9zdGEgY29ycmVjdGEgcGFyYSBhcyB0ZWNub2xveMOtYXMgZGUgYXNpc3RlbmNpYSIsCiAgICAgICJkZWZhdWx0IjogIkBhbnN3ZXIgw6kgY29ycmVjdGEuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHRvIHF1ZSBzZSBhbnVuY2lhcsOhIMOhcyB0ZWNub2xveMOtYXMgZGUgYXNpc3RlbmNpYSBjYW5kbyBvIHVzdWFyaW8gcmVzcG9uZGUgYSB1bmhhIHRhcnhldGEgY29ycmVjdGFtZW50ZS4gVXNhIEBhbnN3ZXIgY29tbyB2YXJpYWJsZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2FtYmlvIGRlIHRhcnhldGEgcGFyYSBhcyB0ZWNub2xveMOtYXMgZGUgYXNpc3RlbmNpYSIsCiAgICAgICJkZWZhdWx0IjogIlDDoXhpbmEgQGN1cnJlbnQgZGUgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIk8gdGV4dG8gcGFzYXJhc2Ugw6FzIHRlY25vbG94w61hcyBkZSBhc2lzdGVuY2lhIGNhbmRvIHNlIG5hdmVndWUgZW50cmUgdGFyeGV0YXMuIFVzYSBAY3VycmVudCBlIEB0b3RhbCBjb21vIHZhcmlhYmxlcy4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRmFjZXIgYWxlYXRvcmlhcyBhcyB0YXJ4ZXRhcyIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJBY3RpdmFyIHBhcmEgZmFjZXIgYWxlYXRvcmlhIGEgb3JkZSBkYXMgdGFyeGV0YXMgYW1vc2FkYXMuIgogICAgfQogIF0KfQo="],"libraries\/H5P.Flashcards-1.7\/language\/he.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLXqteZ15DXldeoINee16nXmdee15QiCiAgICB9LAogICAgewogICAgICAid2lkZ2V0cyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAi15HXqNeZ16jXqiDXnteX15PXnCIKICAgICAgICB9CiAgICAgIF0sCiAgICAgICJsYWJlbCI6ICLXm9eo15jXmdeh15nXnSIsCiAgICAgICJlbnRpdHkiOiAi15vXqNeY15nXoSIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAibGFiZWwiOiAi15vXqNeY15nXoSIsCiAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogItep15DXnNeUIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogItep15DXnNeUINeY16fXodeY15XXkNec15nXqiDXkNeV16TXpteZ15XXoNec15nXqiDXnNeb16jXmNeZ16EuICjXlNeb16jXmNeZ16Eg16LXqdeV15kg15zXlNep16rXntepINeo16cg15HXqtee15XXoNeULCDXqNenINeR15jXp9eh15gg15DXlSDXkdep16DXmdeU150pIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIteq16nXldeR15QiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAi16rXqdeV15HXlCAo16TXqteo15XXnykg15zXm9eo15jXmdehLiDXlNep16rXntepINeR16HXntecINem15nXoNeV16ggfCDXnNek16bXnCDXpNeq16jXldeg15XXqiDXl9ec15XXpNeZ15nXnS4g15TXqdeq157XqSDXkS1cXHwg15DXnSDXpNeq16jXldefINem16jXmdeaINec15TXm9eZ15wgfC4iCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAi16rXnteV16DXlCIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICLXqtee15XXoNeUINeQ15XXpNem15nXldeg15zXmdeqINec15vXqNeY15nXoS4gKNeU15vXqNeY15nXoSDXotep15XXmSDXnNeU16nXqtee16kg16jXpyDXkdeq157Xldeg15QsINeo16cg15HXmNen16HXmCDXkNeVINeR16nXoNeZ15TXnSkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAi15jXp9eh15gg15fXnNeV16TXmSDXnNeq157Xldeg15QiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAi16LXpteUIiwKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAi16rXldeb158g15TXotem15QiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi15jXp9eh15gg15TXqten15PXnteV16oiLAogICAgICAiZGVmYXVsdCI6ICLXm9eo15jXmdehIEBjYXJkINee16rXldeaIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLXqteV15nXqiDXlNeq16fXk9ee15XXqiwg157Xqdeq16DXmdedINeW157Xmdeg15nXnTogQGNhcmQg15UtQHRvdGFsLiDXk9eV15LXnteUOiAn15vXqNeY15nXoSBAY2FyZCDXqdecIEB0b3RhbCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLXmNen16HXmCDXnNeb16TXqteV16gg15TXkdeQIiwKICAgICAgImRlZmF1bHQiOiAi15TXkdeQIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIteY16fXodeYINec15vXpNeq15XXqCDXlNen15XXk9edIiwKICAgICAgImRlZmF1bHQiOiAi15TXp9eV15PXnSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLXmNen16HXmCDXnNeb16TXqteV16gg15HXk9eZ16fXqiDXlNeq16nXldeR15XXqiIsCiAgICAgICJkZWZhdWx0IjogIteR15PXmden15QiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi15PXqNeV16nXqiDXqteS15XXkdeqINee16nXqtee16kg15zXpNeg15kg16nXoNeZ16rXnyDXmdeU15nXlCDXnNem16TXldeqINeR16TXqteo15XXnyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLXmNen16HXmCDXoteR15XXqCDXqdeT15Qg15TXp9ec15gg16nXnCDXlNeq16nXldeR15QiLAogICAgICAiZGVmYXVsdCI6ICLXqtep15XXkdeq15oiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi15jXp9eh15gg15zXqtep15XXkdeUINeU16DXm9eV16DXlCIsCiAgICAgICJkZWZhdWx0IjogIteg15vXldefIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIteY16fXodeYINec16rXqdeV15HXlCDXnNeQINeg15vXldeg15QiLAogICAgICAiZGVmYXVsdCI6ICLXqdeS15XXmSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLXlNeo15DXlCDXmNen16HXmCDXnNeq16nXldeR15QiLAogICAgICAiZGVmYXVsdCI6ICLXqtep15XXkdeV16og16DXm9eV16DXldeqIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIteY16fXodeYINec15vXldeq16jXqiDXlNeq15XXpteQ15XXqiIsCiAgICAgICJkZWZhdWx0IjogIteq15XXpteQ15XXqiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLXmNen16HXmCDXnNee16HXpNeoINeU16DXm9eV16DXldeqIiwKICAgICAgImRlZmF1bHQiOiAiQHNjb3JlINee16rXldeaIEB0b3RhbCDXoNeb15XXoNeZ150iLAogICAgICAiZGVzY3JpcHRpb24iOiAi15jXp9eh15gg16rXldem15DXlCwg157Xqdeq16DXmdedINeW157Xmdeg15nXnTogQHNjb3JlINeVLUB0b3RhbC4g15PXldeS157XlDogJ0BzY29yZSDXqdecIEB0b3RhbCDXlNeg15vXldeg15XXqiciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi15jXp9eh15gg15zXqteV16bXkNeV16og15TXnteV16TXoiIsCiAgICAgICJkZWZhdWx0IjogIteq16bXldeS16og16rXldem15DXldeqIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIteY16fXodeYINei15HXldeoINeq15XXldeZ16og16rXqdeV15HXldeqINen16bXqNeV16oiLAogICAgICAiZGVmYXVsdCI6ICJBOiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLXmNen16HXmCDXoteR15XXqCDXm9ek16rXldeoIFwi16DXodeUINep15XXkVwiLiIsCiAgICAgICJkZWZhdWx0IjogIteg15nXodeZ15XXnyDXl9eV15bXqCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLXlNeq15DXnteUINec15DXldeq15nXldeqINeS15PXldec15XXqi\/Xp9eg15XXqiDXkdeQ16DXktec15nXqiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLXnteV15XXk9eQINep16rXqdeV15HXqiDXlNee16nXqtee16kg15fXmdeZ15HXqiDXnNeU15nXldeqINeW15TXlCDXkdeT15nXldenINec16rXqdeV15HXlC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi16rXldeb158g15zXkCDXoNeb15XXnyDXoteR15XXqCDXmNeb16DXldec15XXkteZ15XXqiDXnteh15nXmdei15XXqiIsCiAgICAgICJkZWZhdWx0IjogIteq16nXldeR15Qg15zXkCDXoNeb15XXoNeULiDXlNeq16nXldeR15Qg15TXoNeb15XXoNeUINeU15nXmdeq15QgYW53c2VyQCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLXqteV15vXnyDXmdeV16fXqNeQINeR16fXldecINec15jXm9eg15XXnNeV15LXmdeV16og157XodeZ15nXoteV16ouINeU16nXqtee16nXlSDXkS0gYW5zd2VyQCDXm9ee16nXqteg15QuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIteY16fXodeYINee16nXldeRINeg15vXldefINei15HXldeoINeY15vXoNeV15zXldeS15nXldeqINee16HXmdeZ16LXldeqIiwKICAgICAgImRlZmF1bHQiOiAiQGFuc3dlciDXqtep15XXkdeUINeg15vXldeg15QuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIteY16fXodeYINep15nXldeb16jXliDXnNeY15vXoNeV15zXldeS15nXldeqINee16HXmdeZ16LXldeqINeb15DXqdeoINeb16jXmNeZ16Eg15nXoteg15Qg16DXm9eV158uINeU16nXqtee16kg15EtQGFuc3dlciDXm9ee16nXqteg15QuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIteU15fXnNek16og15vXqNeY15nXoSDXoteR15XXqCDXmNeb16DXldec15XXkteZ15XXqiDXnteh15nXmdei15XXqiIsCiAgICAgICJkZWZhdWx0IjogIteT16MgY3VycmVudEAg157XqteV15ogdG90YWxAIiwKICAgICAgImRlc2NyaXB0aW9uIjogIteq15XXm9efINep15nXlden16jXkCDXnNeY15vXoNeV15zXldeS15nXldeqINee16HXmdeZ16LXldeqINeR16LXqiDXoNeZ15XXldeYINeR15nXnyDXm9eo15jXmdeh15nXnS4g15TXqdeq157XqdeVINeRLSBjdXJyZW50QCDXlS0gdG90YWxAINeb157Xqdeq16DXmdedLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLXm9eo15jXmdeh15nXnSDXkNen16jXkNeZ15nXnSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLXkNek16nXqCDXnNeU16TXldeaINeQ16og16HXk9eoINeU16fXnNek15nXnSDXlNee15XXpteS15nXnSDXkdeQ15XXpNefINeQ16fXqNeQ15kuIgogICAgfQogIF0KfQo="],"libraries\/H5P.Flashcards-1.7\/language\/hu.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJUYXNrIGRlc2NyaXB0aW9uIgogICAgfSwKICAgIHsKICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkRlZmF1bHQiCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiQ2FyZHMiLAogICAgICAiZW50aXR5IjogImNhcmQiLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImxhYmVsIjogIkNhcmQiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJRdWVzdGlvbiIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcHRpb25hbCB0ZXh0dWFsIHF1ZXN0aW9uIGZvciB0aGUgY2FyZC4gKFRoZSBjYXJkIG1heSB1c2UganVzdCBhbiBpbWFnZSwganVzdCBhIHRleHQgb3IgYm90aCkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQW5zd2VyIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIkFuc3dlciAoc29sdXRpb24pIGZvciB0aGUgY2FyZC4gVXNlIGEgcGlwZSBzeW1ib2wgfCB0byBzcGxpdCBhbHRlcm5hdGl2ZSBzb2x1dGlvbnMuIFVzZSBcXHwgaWYgYSBzb2x1dGlvbiBzaG91bGQgY29udGFpbiBhIHwuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkltYWdlIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9wdGlvbmFsIGltYWdlIGZvciB0aGUgY2FyZC4gKFRoZSBjYXJkIG1heSB1c2UganVzdCBhbiBpbWFnZSwganVzdCBhIHRleHQgb3IgYm90aCkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQWx0ZXJuYXRpdmUgdGV4dCBmb3IgaW1hZ2UiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiVGlwIiwKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiVGlwIHRleHQiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUHJvZ3Jlc3MgdGV4dCIsCiAgICAgICJkZWZhdWx0IjogIkNhcmQgQGNhcmQgb2YgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlByb2dyZXNzIHRleHQsIHZhcmlhYmxlcyBhdmFpbGFibGU6IEBjYXJkIGFuZCBAdG90YWwuIEV4YW1wbGU6ICdDYXJkIEBjYXJkIG9mIEB0b3RhbCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIG5leHQgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiTmV4dCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciB0aGUgcHJldmlvdXMgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiUHJldmlvdXMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIGNoZWNrIGFuc3dlcnMgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiQ2hlY2siCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUmVxdWlyZSB1c2VyIGlucHV0IGJlZm9yZSB0aGUgc29sdXRpb24gY2FuIGJlIHZpZXdlZCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciB0aGUgYW5zd2VyIGlucHV0IGZpZWxkIiwKICAgICAgImRlZmF1bHQiOiAiWW91ciBhbnN3ZXIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgY29ycmVjdCBhbnN3ZXIiLAogICAgICAiZGVmYXVsdCI6ICJDb3JyZWN0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIGluY29ycmVjdCBhbnN3ZXIiLAogICAgICAiZGVmYXVsdCI6ICJJbmNvcnJlY3QiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiU2hvdyBzb2x1dGlvbiB0ZXh0IiwKICAgICAgImRlZmF1bHQiOiAiQ29ycmVjdCBhbnN3ZXIocykiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgcmVzdWx0cyB0aXRsZSIsCiAgICAgICJkZWZhdWx0IjogIlJlc3VsdHMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgbnVtYmVyIG9mIGNvcnJlY3QiLAogICAgICAiZGVmYXVsdCI6ICJAc2NvcmUgb2YgQHRvdGFsIGNvcnJlY3QiLAogICAgICAiZGVzY3JpcHRpb24iOiAiUmVzdWx0IHRleHQsIHZhcmlhYmxlcyBhdmFpbGFibGU6IEBzY29yZSBhbmQgQHRvdGFsLiBFeGFtcGxlOiAnQHNjb3JlIG9mIEB0b3RhbCBjb3JyZWN0JyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBzaG93IHJlc3VsdHMiLAogICAgICAiZGVmYXVsdCI6ICJTaG93IHJlc3VsdHMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3Igc2hvcnQgYW5zd2VyIGxhYmVsIiwKICAgICAgImRlZmF1bHQiOiAiQToiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJyZXRyeVwiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlJldHJ5IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNhc2Ugc2Vuc2l0aXZlIiwKICAgICAgImRlc2NyaXB0aW9uIjogIk1ha2VzIHN1cmUgdGhlIHVzZXIgaW5wdXQgaGFzIHRvIGJlIGV4YWN0bHkgdGhlIHNhbWUgYXMgdGhlIGFuc3dlci4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiSW5jb3JyZWN0IHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJJbmNvcnJlY3QgYW5zd2VyLiBDb3JyZWN0IGFuc3dlciB3YXMgQGFuc3dlciIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcy4gVXNlIEBhbnN3ZXIgYXMgdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNvcnJlY3QgZmVlZGJhY2sgdGV4dCBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIkBhbnN3ZXIgaXMgY29ycmVjdC4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMgd2hlbiBhIGNhcmQgaXMgYW5zd2VyZWQgY29ycmVjdGx5LiBVc2UgQGFuc3dlciBhcyB2YXJpYWJsZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2FyZCBjaGFuZ2UgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJQYWdlIEBjdXJyZW50IG9mIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcyB3aGVuIG5hdmlnYXRpbmcgYmV0d2VlbiBjYXJkcy4gVXNlIEBjdXJyZW50IGFuZCBAdG90YWwgYXMgdmFyaWFibGVzLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJSYW5kb21pemUgY2FyZHMiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRW5hYmxlIHRvIHJhbmRvbWl6ZSB0aGUgb3JkZXIgb2YgY2FyZHMgb24gZGlzcGxheS4iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Flashcards-1.7\/language\/it.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZXNjcml6aW9uZSBkZWwgY29tcGl0byIKICAgIH0sCiAgICB7CiAgICAgICJ3aWRnZXRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJQcmVkZWZpbml0byIKICAgICAgICB9CiAgICAgIF0sCiAgICAgICJsYWJlbCI6ICJTY2hlZGUiLAogICAgICAiZW50aXR5IjogInNjaGVkYSIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAibGFiZWwiOiAiU2NoZWRhIiwKICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiRG9tYW5kYSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJEb21hbmRhIHRlc3R1YWxlIGZhY29sdGF0aXZhIHBlciBsYSBzY2hlZGEgKGxhIHNjaGVkYSBwdcOyIHV0aWxpenphcmUgc29sbyB1bidpbW1hZ2luZSwgc29sbyB1biB0ZXN0byBvIGVudHJhbWJpKSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJSaXNwb3N0YSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJSaXNwb3N0YSAoc29sdXppb25lKSBmYWNvbHRhdGl2YSBwZXIgbGEgc2NoZWRhIFVzZSBhIHBpcGUgc3ltYm9sIHwgdG8gc3BsaXQgYWx0ZXJuYXRpdmUgc29sdXRpb25zLiBVc2UgXFx8IGlmIGEgc29sdXRpb24gc2hvdWxkIGNvbnRhaW4gYSB8LiIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJJbW1hZ2luZSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJJbW1hZ2luZSBmYWNvbHRhdGl2YSBwZXIgbGEgc2NoZWRhIChsYSBzY2hlZGEgcHXDsiB1dGlsaXp6YXJlIHNvbG8gdW4naW1tYWdpbmUsIHNvbG8gdW4gdGVzdG8gbyBlbnRyYW1iaSkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiVGVzdG8gYWx0ZXJuYXRpdm8gcGVyIGwnaW1tYWdpbmUiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiU3VnZ2VyaW1lbnRvIiwKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiVGVzdG8gZGVsIHN1Z2dlcmltZW50byIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXN0byBkaSBhdmFuemFtZW50byIsCiAgICAgICJkZWZhdWx0IjogIlNjaGVkYSBAY2FyZCBkaSBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGVzdG8gZGkgYXZhbnphbWVudG8sIHZhcmlhYmlsaSBkaXNwb25pYmlsaTogQGNhcmQgZSBAdG90YWwuIEVzZW1waW86ICdTY2hlZGEgQGNhcmQgZGkgQHRvdGFsJyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXN0byBwZXIgaWwgcHVsc2FudGUgXCJQcm9zc2ltYVwiIiwKICAgICAgImRlZmF1bHQiOiAiUHJvc3NpbWEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVzdG8gcGVyIGlsIHB1bHNhbnRlIFwiUHJlY2VkZW50ZVwiIiwKICAgICAgImRlZmF1bHQiOiAiUHJlY2VkZW50ZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXN0byBwZXIgaWwgcHVsc2FudGUgXCJWZXJpZmljYVwiIiwKICAgICAgImRlZmF1bHQiOiAiVmVyaWZpY2EiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUmljaGllZGVyZSBsJ2ltbWlzc2lvbmUgZGVpIGRhdGkgYWxsJ3V0ZW50ZSBwcmltYSBjaGUgbGEgc29sdXppb25lIHNpYSB2aXN1YWxpenphdGEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWVzc2FnZ2lvIGRlbGxhIGNhc2VsbGEgZGkgdGVzdG8gcGVyIGxhIHJpc3Bvc3RhIiwKICAgICAgImRlZmF1bHQiOiAiTGEgdHVhIHJpc3Bvc3RhIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk1lc3NhZ2dpbyBwZXIgcmlzcG9zdGEgZ2l1c3RhIiwKICAgICAgImRlZmF1bHQiOiAiR2l1c3RvIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk1lc3NhZ2dpbyBwZXIgcmlzcG9zdGEgc2JhZ2xpYXRhIiwKICAgICAgImRlZmF1bHQiOiAiU2JhZ2xpYXRvIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk1vc3RyYSBpbCB0ZXN0byBkZWxsYSBzb2x1emlvbmUiLAogICAgICAiZGVmYXVsdCI6ICJSaXNwb3N0YSBnaXVzdGEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGl0b2xvIGRlbCBtZXNzYWdnaW8gcGVyIGkgcmlzdWx0YXRpIiwKICAgICAgImRlZmF1bHQiOiAiUmlzdWx0YXRpIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk1lc3NhZ2dpbyBwZXIgaWwgbnVtZXJvIGRpIHJpc3Bvc3RlIGdpdXN0ZSIsCiAgICAgICJkZWZhdWx0IjogIkBzY29yZSBzdSBAdG90YWwgZ2l1c3RlIiwKICAgICAgImRlc2NyaXB0aW9uIjogIk1lc3NhZ2dpbyBkZWwgcmlzdWx0YXRvLCB2YXJpYWJpbGkgZGlzcG9uaWJpbGk6IEBzY29yZSBlIEB0b3RhbC4gRXNlbXBpbzogJ0BzY29yZSBzdSBAdG90YWwgZ2l1c3RlJyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJNZXNzYWdnaW8gcGVyIG1vc3RyYXJlIGkgcmlzdWx0YXRpIiwKICAgICAgImRlZmF1bHQiOiAiTW9zdHJhIGkgcmlzdWx0YXRpIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRlc3RvIHBlciBsJ2V0aWNoZXR0YSBkZWxsYSByaXNwb3N0YSBicmV2ZSIsCiAgICAgICJkZWZhdWx0IjogIkE6IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRlc3RvIHBlciBpbCBwdWxzYW50ZSBcIlJpcHJvdmFcIiIsCiAgICAgICJkZWZhdWx0IjogIlJpcHJvdmEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGllbmkgY29udG8gZGkgbWFpdXNjb2xlIGUgbWludXNjb2xlIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkFjY2VydGF0aSBjaGUgaWwgdGVzdG8gaW1tZXNzbyBkYWxsJ3V0ZW50ZSBzaWEgaWRlbnRpY28gYWxsYSByaXNwb3N0YSBhdHRlc2EiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVzdG8gc2JhZ2xpYXRvIHBlciBsZSB0ZWNub2xvZ2llIGFzc2lzdGl2ZSIsCiAgICAgICJkZWZhdWx0IjogIlJpc3Bvc3RhIHNiYWdsaWF0YS4gTGEgcmlzcG9zdGEgZ2l1c3RhIGVyYSBAYW5zd2VyIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRlc3RvIHBlciBsZSB0ZWNub2xvZ2llIGFzc2lzdGl2ZS4gVXNhIEBhbnN3ZXIgY29tZSB2YXJpYWJpbGUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ29ycmVjdCBmZWVkYmFjayB0ZXh0IGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiQGFuc3dlciBpcyBjb3JyZWN0LiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcyB3aGVuIGEgY2FyZCBpcyBhbnN3ZXJlZCBjb3JyZWN0bHkuIFVzZSBAYW5zd2VyIGFzIHZhcmlhYmxlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDYW1iaW8gc2NoZWRhIHBlciBsZSB0ZWNub2xvZ2llIGFzc2lzdGl2ZSIsCiAgICAgICJkZWZhdWx0IjogIlBhZ2luYSBAY3VycmVudCBkaSBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGVzdG8gcGVyIGxlIHRlY25vbG9naWUgYXNzaXN0aXZlIGR1cmFudGUgbGEgbmF2aWdhemlvbmUgdHJhIHNjaGVkZS4gVXNhIEBjdXJyZW50IGUgQHRvdGFsIGNvbWUgdmFyaWFiaWxpIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlJhbmRvbWl6ZSBjYXJkcyIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJFbmFibGUgdG8gcmFuZG9taXplIHRoZSBvcmRlciBvZiBjYXJkcyBvbiBkaXNwbGF5LiIKICAgIH0KICBdCn0="],"libraries\/H5P.Flashcards-1.7\/language\/ja.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJUYXNrIGRlc2NyaXB0aW9uIgogICAgfSwKICAgIHsKICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkRlZmF1bHQiCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiQ2FyZHMiLAogICAgICAiZW50aXR5IjogImNhcmQiLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImxhYmVsIjogIkNhcmQiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJRdWVzdGlvbiIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcHRpb25hbCB0ZXh0dWFsIHF1ZXN0aW9uIGZvciB0aGUgY2FyZC4gKFRoZSBjYXJkIG1heSB1c2UganVzdCBhbiBpbWFnZSwganVzdCBhIHRleHQgb3IgYm90aCkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQW5zd2VyIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIkFuc3dlciAoc29sdXRpb24pIGZvciB0aGUgY2FyZC4gVXNlIGEgcGlwZSBzeW1ib2wgfCB0byBzcGxpdCBhbHRlcm5hdGl2ZSBzb2x1dGlvbnMuIFVzZSBcXHwgaWYgYSBzb2x1dGlvbiBzaG91bGQgY29udGFpbiBhIHwuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkltYWdlIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9wdGlvbmFsIGltYWdlIGZvciB0aGUgY2FyZC4gKFRoZSBjYXJkIG1heSB1c2UganVzdCBhbiBpbWFnZSwganVzdCBhIHRleHQgb3IgYm90aCkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQWx0ZXJuYXRpdmUgdGV4dCBmb3IgaW1hZ2UiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiVGlwIiwKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiVGlwIHRleHQiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUHJvZ3Jlc3MgdGV4dCIsCiAgICAgICJkZWZhdWx0IjogIkNhcmQgQGNhcmQgb2YgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlByb2dyZXNzIHRleHQsIHZhcmlhYmxlcyBhdmFpbGFibGU6IEBjYXJkIGFuZCBAdG90YWwuIEV4YW1wbGU6ICdDYXJkIEBjYXJkIG9mIEB0b3RhbCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIG5leHQgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiTmV4dCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciB0aGUgcHJldmlvdXMgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiUHJldmlvdXMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIGNoZWNrIGFuc3dlcnMgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiQ2hlY2siCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUmVxdWlyZSB1c2VyIGlucHV0IGJlZm9yZSB0aGUgc29sdXRpb24gY2FuIGJlIHZpZXdlZCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciB0aGUgYW5zd2VyIGlucHV0IGZpZWxkIiwKICAgICAgImRlZmF1bHQiOiAiWW91ciBhbnN3ZXIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgY29ycmVjdCBhbnN3ZXIiLAogICAgICAiZGVmYXVsdCI6ICJDb3JyZWN0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIGluY29ycmVjdCBhbnN3ZXIiLAogICAgICAiZGVmYXVsdCI6ICJJbmNvcnJlY3QiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiU2hvdyBzb2x1dGlvbiB0ZXh0IiwKICAgICAgImRlZmF1bHQiOiAiQ29ycmVjdCBhbnN3ZXIocykiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgcmVzdWx0cyB0aXRsZSIsCiAgICAgICJkZWZhdWx0IjogIlJlc3VsdHMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgbnVtYmVyIG9mIGNvcnJlY3QiLAogICAgICAiZGVmYXVsdCI6ICJAc2NvcmUgb2YgQHRvdGFsIGNvcnJlY3QiLAogICAgICAiZGVzY3JpcHRpb24iOiAiUmVzdWx0IHRleHQsIHZhcmlhYmxlcyBhdmFpbGFibGU6IEBzY29yZSBhbmQgQHRvdGFsLiBFeGFtcGxlOiAnQHNjb3JlIG9mIEB0b3RhbCBjb3JyZWN0JyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBzaG93IHJlc3VsdHMiLAogICAgICAiZGVmYXVsdCI6ICJTaG93IHJlc3VsdHMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3Igc2hvcnQgYW5zd2VyIGxhYmVsIiwKICAgICAgImRlZmF1bHQiOiAiQToiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJyZXRyeVwiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlJldHJ5IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNhc2Ugc2Vuc2l0aXZlIiwKICAgICAgImRlc2NyaXB0aW9uIjogIk1ha2VzIHN1cmUgdGhlIHVzZXIgaW5wdXQgaGFzIHRvIGJlIGV4YWN0bHkgdGhlIHNhbWUgYXMgdGhlIGFuc3dlci4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiSW5jb3JyZWN0IHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJJbmNvcnJlY3QgYW5zd2VyLiBDb3JyZWN0IGFuc3dlciB3YXMgQGFuc3dlciIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcy4gVXNlIEBhbnN3ZXIgYXMgdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNvcnJlY3QgZmVlZGJhY2sgdGV4dCBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIkBhbnN3ZXIgaXMgY29ycmVjdC4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMgd2hlbiBhIGNhcmQgaXMgYW5zd2VyZWQgY29ycmVjdGx5LiBVc2UgQGFuc3dlciBhcyB2YXJpYWJsZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2FyZCBjaGFuZ2UgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJQYWdlIEBjdXJyZW50IG9mIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcyB3aGVuIG5hdmlnYXRpbmcgYmV0d2VlbiBjYXJkcy4gVXNlIEBjdXJyZW50IGFuZCBAdG90YWwgYXMgdmFyaWFibGVzLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJSYW5kb21pemUgY2FyZHMiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRW5hYmxlIHRvIHJhbmRvbWl6ZSB0aGUgb3JkZXIgb2YgY2FyZHMgb24gZGlzcGxheS4iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Flashcards-1.7\/language\/ka.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLhg5Dhg5vhg53hg6rhg5Dhg5zhg5jhg6Eg4YOQ4YOm4YOs4YOU4YOg4YOQIgogICAgfSwKICAgIHsKICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIuGDoeGDouGDkOGDnOGDk+GDkOGDoOGDouGDo+GDmuGDmCIKICAgICAgICB9CiAgICAgIF0sCiAgICAgICJsYWJlbCI6ICLhg5Hhg5Dhg6Dhg5Dhg5fhg5Thg5Hhg5giLAogICAgICAiZW50aXR5IjogIuGDkeGDkOGDoOGDkOGDl+GDmCIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAibGFiZWwiOiAi4YOR4YOQ4YOg4YOQ4YOX4YOYIiwKICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAi4YOZ4YOY4YOX4YOu4YOV4YOQIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIuGDkOGDoOGDkOGDoeGDkOGDleGDkOGDmuGDk+GDlOGDkeGDo+GDmuGDnSDhg6jhg5Thg5nhg5jhg5fhg67hg5Xhg5Ag4YOR4YOQ4YOg4YOQ4YOX4YOY4YOh4YOX4YOV4YOY4YOhLiAo4YOR4YOQ4YOg4YOQ4YOX4YOYIOGDqOGDlOGDmOGDq+GDmuGDlOGDkeGDkCDhg5jhg6fhg5Thg5zhg5Thg5Hhg5Phg5Thg6Eg4YOb4YOu4YOd4YOa4YOd4YOTIOGDkuGDkOGDm+GDneGDoeGDkOGDruGDo+GDmuGDlOGDkeGDkOGDoSwg4YOb4YOu4YOd4YOa4YOd4YOTIOGDouGDlOGDpeGDoeGDouGDoSDhg5Dhg5wg4YOd4YOg4YOY4YOV4YOU4YOhIOGDlOGDoOGDl+GDkOGDkykiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAi4YOe4YOQ4YOh4YOj4YOu4YOYIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIuGDnuGDkOGDoeGDo+GDruGDmCAo4YOS4YOQ4YOb4YOd4YOh4YOQ4YOV4YOQ4YOa4YOYKSDhg5Hhg5Dhg6Dhg5Dhg5fhg5jhg6Hhg5fhg5Xhg5jhg6EuIOGDkuGDkOGDm+GDneGDmOGDp+GDlOGDnOGDlOGDlyDhg5vhg5jhg5rhg5jhg6Eg4YOh4YOY4YOb4YOR4YOd4YOa4YOdIHwg4YOQ4YOa4YOi4YOU4YOg4YOc4YOQ4YOi4YOY4YOj4YOa4YOYIOGDkuGDkOGDk+GDkOGDrOGDp+GDleGDlOGDouGDmOGDmuGDlOGDkeGDlOGDkeGDmOGDoSDhg5Lhg5Dhg6Hhg5Dhg6fhg53hg6Thg5Dhg5MuIOGDkuGDkOGDm+GDneGDmOGDp+GDlOGDnOGDlOGDlyBcXHwg4YOX4YOjIOGDkOGDm+GDneGDruGDoeGDnOGDkCDhg6Phg5zhg5Phg5Ag4YOo4YOU4YOY4YOq4YOQ4YOV4YOT4YOU4YOhIHwuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIuGDkuGDkOGDm+GDneGDoeGDkOGDruGDo+GDmuGDlOGDkeGDkCIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICLhg5Dhg6Dhg5Dhg6Hhg5Dhg5Xhg5Dhg5rhg5Phg5Thg5Hhg6Phg5rhg50g4YOS4YOQ4YOb4YOd4YOh4YOQ4YOu4YOj4YOa4YOU4YOR4YOQIOGDkeGDkOGDoOGDkOGDl+GDmOGDoeGDl+GDleGDmOGDoS4gKOGDkeGDkOGDoOGDkOGDl+GDqOGDmCDhg6jhg5Thg6Hhg5Dhg6vhg5rhg5Thg5Hhg5Thg5rhg5jhg5Ag4YOb4YOu4YOd4YOa4YOd4YOTIOGDkuGDkOGDm+GDneGDoeGDkOGDruGDo+GDmuGDlOGDkeGDmOGDoSwg4YOb4YOu4YOd4YOa4YOd4YOTIOGDouGDlOGDpeGDoeGDouGDmOGDoSDhg5Dhg5wg4YOd4YOg4YOY4YOV4YOU4YOhIOGDlOGDoOGDl+GDkOGDkyDhg5Lhg5Dhg5vhg53hg6fhg5Thg5zhg5Thg5Hhg5ApIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIuGDkOGDmuGDouGDlOGDoOGDnOGDkOGDouGDmOGDo+GDmuGDmCDhg6Lhg5Thg6Xhg6Hhg6Lhg5gg4YOS4YOQ4YOb4YOd4YOh4YOQ4YOu4YOj4YOa4YOU4YOR4YOY4YOh4YOX4YOV4YOY4YOhIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIuGDm+GDmOGDnOGDmOGDqOGDnOGDlOGDkeGDkCIsCiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIuGDm+GDmOGDnOGDmOGDqOGDnOGDlOGDkeGDmOGDoSDhg6Lhg5Thg6Xhg6Hhg6Lhg5giCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4YOe4YOg4YOd4YOS4YOg4YOU4YOh4YOY4YOhIOGDouGDlOGDpeGDoeGDouGDmCIsCiAgICAgICJkZWZhdWx0IjogIkBjYXJkIOGDkeGDkOGDoOGDkOGDl+GDmCBAdG90YWwt4YOT4YOQ4YOcIiwKICAgICAgImRlc2NyaXB0aW9uIjogIuGDnuGDoOGDneGDkuGDoOGDlOGDoeGDmOGDoSDhg6Lhg5Thg6Xhg6Hhg6Lhg5gsIOGDruGDlOGDmuGDm+GDmOGDoeGDkOGDrOGDleGDk+GDneGDm+GDmCDhg6rhg5Xhg5rhg5Dhg5Phg5Thg5Hhg5g6IEBjYXJkIOGDk+GDkCBAdG90YWwuIOGDm+GDkOGDkuGDkOGDmuGDmOGDl+GDmDogJ0BjYXJkIOGDkeGDkOGDoOGDkOGDl+GDmCBAdG90YWwt4YOT4YOQ4YOcJyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLhg6Lhg5Thg6Xhg6Hhg6Lhg5gg4YOm4YOY4YOa4YOQ4YOZ4YOY4YOh4YOX4YOV4YOY4YOhICfhg6jhg5Thg5vhg5Phg5Thg5Lhg5gnIiwKICAgICAgImRlZmF1bHQiOiAi4YOo4YOU4YOb4YOT4YOU4YOS4YOYIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuGDouGDlOGDpeGDoeGDouGDmCDhg6bhg5jhg5rhg5Dhg5nhg5jhg6Hhg5fhg5Xhg5jhg6EgJ+GDo+GDmeGDkOGDnCciLAogICAgICAiZGVmYXVsdCI6ICLhg6Phg5nhg5Dhg5wiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4YOi4YOU4YOl4YOh4YOi4YOYIOGDpuGDmOGDmuGDkOGDmeGDmOGDoeGDl+GDleGDmOGDoSAn4YOo4YOU4YOb4YOd4YOs4YOb4YOU4YOR4YOQJyIsCiAgICAgICJkZWZhdWx0IjogIuGDqOGDlOGDm+GDneGDrOGDm+GDlOGDkeGDkCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLhg5vhg53hg5vhg67hg5vhg5Dhg6Dhg5Thg5Hhg5rhg5jhg6Hhg5Lhg5Dhg5wg4YOe4YOQ4YOh4YOj4YOu4YOY4YOhIOGDm+GDneGDl+GDruGDneGDleGDnOGDkCDhg5vhg5Dhg5zhg5Dhg5ssIOGDoeGDkOGDnOGDkOGDmyDhg5Dhg5vhg53hg67hg6Hhg5zhg5Ag4YOY4YOl4YOc4YOU4YOR4YOQIOGDnOGDkOGDqeGDleGDlOGDnOGDlOGDkeGDmCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLhg6Lhg5Thg6Xhg6Hhg6Lhg5gg4YOe4YOQ4YOh4YOj4YOu4YOY4YOhIOGDleGDlOGDmuGDmOGDoeGDl+GDleGDmOGDoSIsCiAgICAgICJkZWZhdWx0IjogIuGDnuGDkOGDoeGDo+GDruGDmCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLhg6Lhg5Thg6Xhg6Hhg6Lhg5gg4YOh4YOs4YOd4YOg4YOYIOGDnuGDkOGDoeGDo+GDruGDmOGDoeGDl+GDleGDmOGDoSIsCiAgICAgICJkZWZhdWx0IjogIuGDoeGDrOGDneGDoOGDmOGDkCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLhg6Lhg5Thg6Xhg6Hhg6Lhg5gg4YOQ4YOg4YOQ4YOh4YOs4YOd4YOg4YOYIOGDnuGDkOGDoeGDo+GDruGDmOGDoeGDl+GDleGDmOGDoSIsCiAgICAgICJkZWZhdWx0IjogIuGDqOGDlOGDquGDk+GDneGDm+GDkCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLhg5Dhg5vhg53hg67hg6Hhg5zhg5jhg6Eg4YOp4YOV4YOU4YOc4YOU4YOR4YOY4YOhIOGDouGDlOGDpeGDoeGDouGDmCIsCiAgICAgICJkZWZhdWx0IjogIuGDoeGDrOGDneGDoOGDmCDhg57hg5Dhg6Hhg6Phg64o4YOU4YORKeGDmCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLhg6Lhg5Thg6Xhg6Hhg6Lhg5gg4YOo4YOU4YOT4YOU4YOS4YOU4YOR4YOY4YOh4YOX4YOV4YOY4YOhIiwKICAgICAgImRlZmF1bHQiOiAi4YOo4YOU4YOT4YOU4YOS4YOYIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuGDouGDlOGDpeGDoeGDouGDmCDhg6Hhg6zhg53hg6Dhg5gg4YOe4YOQ4YOh4YOj4YOu4YOU4YOR4YOY4YOhIOGDoOGDkOGDneGDk+GDlOGDnOGDneGDkeGDmOGDoeGDl+GDleGDmOGDoSIsCiAgICAgICJkZWZhdWx0IjogIkBzY29yZSDhg6Xhg6Phg5rhg5AgQHRvdGFsLeGDk+GDkOGDnCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLhg6jhg5Thg5Phg5Thg5Lhg5Thg5Hhg5jhg6Eg4YOi4YOU4YOl4YOh4YOi4YOYLCDhg67hg5Thg5rhg5vhg5jhg6Hhg5Dhg6zhg5Xhg5Phg53hg5vhg5gg4YOq4YOV4YOa4YOQ4YOT4YOU4YOR4YOYOiBAc2NvcmUg4YOT4YOQIEB0b3RhbC4g4YOb4YOQ4YOS4YOQ4YOa4YOY4YOX4YOYOiAnQHNjb3JlIOGDpeGDo+GDmuGDkCBAdG90YWwt4YOT4YOQ4YOcIOGDoeGDrOGDneGDoOGDmOGDkCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4YOi4YOU4YOl4YOh4YOi4YOYIOGDqOGDlOGDk+GDlOGDkuGDlOGDkeGDmOGDoSDhg6nhg5Xhg5Thg5zhg5Thg5Hhg5jhg6Hhg5fhg5Xhg5jhg6EiLAogICAgICAiZGVmYXVsdCI6ICLhg6jhg5Thg5Phg5Thg5Lhg5jhg6Eg4YOp4YOV4YOU4YOc4YOU4YOR4YOQIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuGDouGDlOGDpeGDoeGDouGDmCDhg5vhg53hg5nhg5rhg5Qg4YOe4YOQ4YOh4YOj4YOu4YOY4YOh4YOX4YOV4YOY4YOhIiwKICAgICAgImRlZmF1bHQiOiAi4YOeOiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLhg6Lhg5Thg6Xhg6Hhg6Lhg5gg4YOm4YOY4YOa4YOQ4YOZ4YOY4YOh4YOX4YOV4YOY4YOhIFwi4YOS4YOQ4YOb4YOU4YOd4YOg4YOU4YOR4YOQXCIiLAogICAgICAiZGVmYXVsdCI6ICLhg5Lhg5Dhg5vhg5Thg53hg6Dhg5Thg5Hhg5AiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4YOh4YOY4YOW4YOj4YOh4YOi4YOUIiwKICAgICAgImRlc2NyaXB0aW9uIjogIuGDm+GDneGDm+GDruGDm+GDkOGDoOGDlOGDkeGDmuGDmOGDoeGDkuGDkOGDnCDhg5vhg53hg5jhg5fhg67hg53hg5Xhg6EsIOGDoOGDneGDmyDhg5vhg53hg5vhg67hg5vhg5Dhg6Dhg5Thg5Hhg5rhg5jhg6Eg4YOe4YOQ4YOh4YOj4YOu4YOYIOGDluGDo+GDoeGDouGDkOGDkyDhg5Thg5vhg5fhg67hg5Xhg5Thg53hg5Phg5Thg6Eg4YOe4YOQ4YOh4YOj4YOu4YOhLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLhg5Dhg6Dhg5Dhg6Hhg6zhg53hg6Dhg5gg4YOe4YOQ4YOh4YOj4YOu4YOY4YOhIOGDouGDlOGDpeGDoeGDouGDmCDhg5Phg5Dhg5vhg67hg5vhg5Dhg6Dhg5Qg4YOi4YOU4YOl4YOc4YOd4YOa4YOd4YOS4YOY4YOU4YOR4YOY4YOh4YOX4YOV4YOY4YOhIiwKICAgICAgImRlZmF1bHQiOiAi4YOQ4YOg4YOQ4YOh4YOs4YOd4YOg4YOYIOGDnuGDkOGDoeGDo+GDruGDmC4g4YOh4YOs4YOd4YOg4YOYIOGDnuGDkOGDoeGDo+GDruGDmOGDkCBAYW5zd2VyIiwKICAgICAgImRlc2NyaXB0aW9uIjogIuGDouGDlOGDpeGDoeGDouGDmCwg4YOg4YOd4YOb4YOU4YOa4YOh4YOQ4YOqIOGDmeGDmOGDl+GDruGDo+GDmuGDneGDkeGDoSDhg5Phg5Dhg5vhg67hg5vhg5Dhg6Dhg5Qg4YOi4YOU4YOl4YOc4YOd4YOa4YOd4YOS4YOY4YOQLiBAYW5zd2VyLeGDmOGDoSDhg5Lhg5Dhg5vhg53hg6fhg5Thg5zhg5Thg5Hhg5Ag4YOq4YOV4YOa4YOQ4YOT4YOY4YOhIOGDoeGDkOGDruGDmOGDly4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4YOi4YOU4YOl4YOh4YOi4YOYIOGDoeGDrOGDneGDoCDhg57hg5Dhg6Hhg6Phg67hg5bhg5Qg4YOT4YOQ4YOb4YOu4YOb4YOQ4YOg4YOUIOGDouGDlOGDpeGDnOGDneGDmuGDneGDkuGDmOGDlOGDkeGDmOGDoeGDl+GDleGDmOGDoSIsCiAgICAgICJkZWZhdWx0IjogIkBhbnN3ZXIg4YOh4YOs4YOd4YOg4YOY4YOQLiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLhg6Lhg5Thg6Xhg6Hhg6Lhg5gsIOGDoOGDneGDm+GDlOGDmuGDoeGDkOGDqiDhg5Dhg5vhg53hg5jhg5nhg5jhg5fhg67hg5Dhg5Xhg6Eg4YOT4YOQ4YOb4YOu4YOb4YOQ4YOg4YOUIOGDouGDlOGDpeGDnOGDneGDmuGDneGDkuGDmOGDlOGDkeGDmCwg4YOg4YOd4YOT4YOU4YOh4YOQ4YOqIOGDoeGDrOGDneGDoOGDmCDhg57hg5Dhg6Hhg6Phg67hg5gg4YOS4YOQ4YOY4YOq4YOU4YOb4YOQLiDhg5Lhg5Dhg5vhg53hg5jhg6fhg5Thg5zhg5Thg5cgQGFuc3dlciDhg6Dhg53hg5Lhg53hg6Dhg6og4YOq4YOV4YOa4YOQ4YOT4YOYLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLhg5Hhg5Dhg6Dhg5Dhg5fhg5jhg6Eg4YOo4YOU4YOq4YOV4YOa4YOQIOGDk+GDkOGDm+GDruGDm+GDkOGDoOGDlCDhg6Lhg5Thg6Xhg5zhg53hg5rhg53hg5Lhg5jhg5jhg6Hhg5fhg5Xhg5jhg6EiLAogICAgICAiZGVmYXVsdCI6ICJAY3VycmVudCDhg5Hhg5Dhg6Dhg5Dhg5fhg5ggQHRvdGFsLeGDk+GDkOGDnCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLhg6Lhg5Thg6Xhg6Hhg6Lhg5gsIOGDoOGDneGDm+GDlOGDmuGDoeGDkOGDqiDhg5nhg5jhg5fhg67hg6Phg5rhg53hg5Hhg6Eg4YOT4YOQ4YOb4YOu4YOb4YOQ4YOg4YOUIOGDouGDlOGDpeGDnOGDneGDmuGDneGDkuGDmOGDkCDhg5Hhg5Dhg6Dhg5Dhg5fhg5jhg6Eg4YOo4YOU4YOq4YOV4YOa4YOY4YOh4YOQ4YOhLiBAY3VycmVudC3hg5jhg6Hhg5Ag4YOT4YOQIEB0b3RhbC3hg5jhg6Eg4YOS4YOQ4YOb4YOd4YOn4YOU4YOc4YOU4YOR4YOQIOGDquGDleGDmuGDkOGDk+GDlOGDkeGDmOGDoSDhg6Hhg5Dhg67hg5jhg5cuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuGDkeGDkOGDoOGDkOGDl+GDlOGDkeGDmOGDoSDhg5Dhg6Dhg5Thg5Xhg5AiLAogICAgICAiZGVzY3JpcHRpb24iOiAi4YOR4YOQ4YOg4YOQ4YOX4YOU4YOR4YOY4YOhIOGDqOGDlOGDm+GDl+GDruGDleGDlOGDleGDmOGDl+GDmCDhg5vhg5jhg5vhg5Phg5Thg5Xhg6Dhg53hg5Hhg5jhg6Eg4YOc4YOU4YOR4YOY4YOhIOGDk+GDkOGDoOGDl+GDleGDkC4iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Flashcards-1.7\/language\/km.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJUYXNrIGRlc2NyaXB0aW9uIgogICAgfSwKICAgIHsKICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkRlZmF1bHQiCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiQ2FyZHMiLAogICAgICAiZW50aXR5IjogImNhcmQiLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImxhYmVsIjogIkNhcmQiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJRdWVzdGlvbiIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcHRpb25hbCB0ZXh0dWFsIHF1ZXN0aW9uIGZvciB0aGUgY2FyZC4gKFRoZSBjYXJkIG1heSB1c2UganVzdCBhbiBpbWFnZSwganVzdCBhIHRleHQgb3IgYm90aCkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQW5zd2VyIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIkFuc3dlciAoc29sdXRpb24pIGZvciB0aGUgY2FyZC4gVXNlIGEgcGlwZSBzeW1ib2wgfCB0byBzcGxpdCBhbHRlcm5hdGl2ZSBzb2x1dGlvbnMuIFVzZSBcXHwgaWYgYSBzb2x1dGlvbiBzaG91bGQgY29udGFpbiBhIHwuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkltYWdlIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9wdGlvbmFsIGltYWdlIGZvciB0aGUgY2FyZC4gKFRoZSBjYXJkIG1heSB1c2UganVzdCBhbiBpbWFnZSwganVzdCBhIHRleHQgb3IgYm90aCkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQWx0ZXJuYXRpdmUgdGV4dCBmb3IgaW1hZ2UiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiVGlwIiwKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiVGlwIHRleHQiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUHJvZ3Jlc3MgdGV4dCIsCiAgICAgICJkZWZhdWx0IjogIuGegOGetuGejyBAY2FyZCDhnoXhn4bhno7hn4ThnpggQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlByb2dyZXNzIHRleHQsIHZhcmlhYmxlcyBhdmFpbGFibGU6IEBjYXJkIGFuZCBAdG90YWwuIEV4YW1wbGU6ICdDYXJkIEBjYXJkIG9mIEB0b3RhbCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIG5leHQgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAi4Z6U4Z6T4Z+S4Z6R4Z624Z6U4Z+LIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHRoZSBwcmV2aW91cyBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICLhnpjhnrvhnpMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIGNoZWNrIGFuc3dlcnMgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAi4Z6W4Z634Z6T4Z634Z6P4Z+S4Z6Z4Z6F4Z6Y4Z+S4Z6b4Z6+4Z6ZIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlJlcXVpcmUgdXNlciBpbnB1dCBiZWZvcmUgdGhlIHNvbHV0aW9uIGNhbiBiZSB2aWV3ZWQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIGFuc3dlciBpbnB1dCBmaWVsZCIsCiAgICAgICJkZWZhdWx0IjogIuGeheGemOGfkuGem+GevuGemeKAi+GemuGelOGen+Gfi+KAi+GeouGfkuGek+GegCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBjb3JyZWN0IGFuc3dlciIsCiAgICAgICJkZWZhdWx0IjogIuGej+GfkuGemuGeueGemOGej+GfkuGemuGevOGenCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBpbmNvcnJlY3QgYW5zd2VyIiwKICAgICAgImRlZmF1bHQiOiAi4Z6Y4Z634Z6T4Z6P4Z+S4Z6a4Z654Z6Y4Z6P4Z+S4Z6a4Z684Z6cIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlNob3cgc29sdXRpb24gdGV4dCIsCiAgICAgICJkZWZhdWx0IjogIuGeheGemOGfkuGem+GevuGemeKAi+Gej+GfkuGemuGeueGemOGej+GfkuGemuGevOGenCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciByZXN1bHRzIHRpdGxlIiwKICAgICAgImRlZmF1bHQiOiAi4Z6b4Z6R4Z+S4Z6S4Z6V4Z6bIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIG51bWJlciBvZiBjb3JyZWN0IiwKICAgICAgImRlZmF1bHQiOiAi4Z6F4Z6Y4Z+S4Z6b4Z6+4Z6ZIEBzY29yZSDhnoXhn4bhno7hn4ThnpggQHRvdGFsIOGej+GfkuGemuGeueGemOGej+GfkuGemuGevOGenCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJSZXN1bHQgdGV4dCwgdmFyaWFibGVzIGF2YWlsYWJsZTogQHNjb3JlIGFuZCBAdG90YWwuIEV4YW1wbGU6ICdAc2NvcmUgb2YgQHRvdGFsIGNvcnJlY3QnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHNob3cgcmVzdWx0cyIsCiAgICAgICJkZWZhdWx0IjogIuGelOGehOGfkuGeoOGetuGeieGem+GekeGfkuGekuGeleGemyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBzaG9ydCBhbnN3ZXIgbGFiZWwiLAogICAgICAiZGVmYXVsdCI6ICLhnoU6IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIFwicmV0cnlcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICLhnp\/hnrbhnoDhnpjhn5Lhno\/hnoThnpHhn4Dhno8iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2FzZSBzZW5zaXRpdmUiLAogICAgICAiZGVzY3JpcHRpb24iOiAiTWFrZXMgc3VyZSB0aGUgdXNlciBpbnB1dCBoYXMgdG8gYmUgZXhhY3RseSB0aGUgc2FtZSBhcyB0aGUgYW5zd2VyLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbmNvcnJlY3QgdGV4dCBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIuGeheGemOGfkuGem+GevuGemeGemOGet+Gek+Gej+GfkuGemuGeueGemOGej+GfkuGemuGevOGenOGflCDhnoXhnpjhn5Lhnpvhnr7hnpnhno\/hn5Lhnprhnrnhnpjhno\/hn5LhnprhnrzhnpzhnoLhnrogQGFuc3dlciIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcy4gVXNlIEBhbnN3ZXIgYXMgdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNvcnJlY3QgZmVlZGJhY2sgdGV4dCBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIkBhbnN3ZXIgaXMgY29ycmVjdC4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMgd2hlbiBhIGNhcmQgaXMgYW5zd2VyZWQgY29ycmVjdGx5LiBVc2UgQGFuc3dlciBhcyB2YXJpYWJsZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2FyZCBjaGFuZ2UgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICLhnpHhn4bhnpbhn5DhnpogQGN1cnJlbnQg4Z6F4Z+G4Z6O4Z+E4Z6YIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcyB3aGVuIG5hdmlnYXRpbmcgYmV0d2VlbiBjYXJkcy4gVXNlIEBjdXJyZW50IGFuZCBAdG90YWwgYXMgdmFyaWFibGVzLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJSYW5kb21pemUgY2FyZHMiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRW5hYmxlIHRvIHJhbmRvbWl6ZSB0aGUgb3JkZXIgb2YgY2FyZHMgb24gZGlzcGxheS4iCiAgICB9CiAgXQp9"],"libraries\/H5P.Flashcards-1.7\/language\/ko.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLqs7zsoJwg7ISk66qFIgogICAgfSwKICAgIHsKICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIuq4sOuzuCDshKTsoJUiCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAi7Lm065OcIiwKICAgICAgImVudGl0eSI6ICLsubTrk5wiLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImxhYmVsIjogIuy5tOuTnCIsCiAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIuusuOygnCIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICLsubTrk5zsl5Ag64yA7ZWcIOyEoO2DneyggSDthY3siqTtirgg7KeI66y4KOy5tOuTnOuKlCDsnbTrr7jsp4AsIO2FjeyKpO2KuCDrmJDripQg65GYIOuqqOuRkOulvCDsgqzsmqntlaAg7IiYIOyeiOyKteuLiOuLpC4pIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkFuc3dlciIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICLsubTrk5zsl5Ag64yA7ZWcIOyEoO2DneyggSDtlbTri7UuIFVzZSBhIHBpcGUgc3ltYm9sIHwgdG8gc3BsaXQgYWx0ZXJuYXRpdmUgc29sdXRpb25zLiBVc2UgXFx8IGlmIGEgc29sdXRpb24gc2hvdWxkIGNvbnRhaW4gYSB8LiIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICLsnbTrr7jsp4AiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAi7Lm065Oc7JeQIOuMgO2VnCDshKDtg53soIEg7J2066+47KeAKOy5tOuTnOuKlCDsnbTrr7jsp4AsIO2FjeyKpO2KuCDrmJDripQg65GYIOuqqOuRkOulvCDsgqzsmqntlaAg7IiYIOyeiOyKteuLiOuLpC4pIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIuydtOuvuOyngOydmCDrjIDssrQg7YWN7Iqk7Yq4IgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIu2ejO2KuCIsCiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIu2ejO2KuCDthY3siqTtirgiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi7KeE7ZaJIO2FjeyKpO2KuCIsCiAgICAgICJkZWZhdWx0IjogIuy0nSBAdG90YWwg7KSRIEBjYXJkIOy5tOuTnCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLsp4Ttlokg7YWN7Iqk7Yq4LCDsgqzsmqkg6rCA64ql7ZWcIOuzgOyImDog7LSdIEB0b3RhbCDspJEgQGNhcmQg7Lm065OcLiDsmIg6ICfstJ0gQHRvdGFsIOykkSBAY2FyZCDsubTrk5wnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuuLpOydjCDrsoTtirzsnYQg7JyE7ZWcIO2FjeyKpO2KuCIsCiAgICAgICJkZWZhdWx0IjogIuuLpOydjCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLsnbTsoIQg67KE7Yq87J2EIOychO2VnCDthY3siqTtirgiLAogICAgICAiZGVmYXVsdCI6ICLsnbTsoIQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi7KCV64u1IO2ZleyduCDrsoTtirwg7YWN7Iqk7Yq4IiwKICAgICAgImRlZmF1bHQiOiAi7KCV64u1IO2ZleyduCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLtlbTri7Ug67O06riwIOyghOyXkCDsgqzsmqnsnpAg7J6F66ClIO2VhOyalCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLri7Xrs4Ag7J6F66ClIO2VhOuTnOydmCDthY3siqTtirgiLAogICAgICAiZGVmYXVsdCI6ICLri7Xrs4AiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi7KCV64u1IO2FjeyKpO2KuCIsCiAgICAgICJkZWZhdWx0IjogIuygleuLtSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLsmKTri7Ug7YWN7Iqk7Yq4IiwKICAgICAgImRlZmF1bHQiOiAi7Jik64u1IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIu2VtOuLtSDrs7TsnbTquLAg7YWN7Iqk7Yq4IiwKICAgICAgImRlZmF1bHQiOiAi7KCV64u1IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuqysOqzvCDsoJzrqqkg7YWN7Iqk7Yq4IiwKICAgICAgImRlZmF1bHQiOiAi6rKw6rO8IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuygleuLtSDsiJgg7YWN7Iqk7Yq4IiwKICAgICAgImRlZmF1bHQiOiAi7LSdIEB0b3RhbCDspJEgQHNjb3JlIOygkCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLqsrDqs7wg7YWN7Iqk7Yq4LCDsnbTsmqnqsIDriqXtlZwg67OA7IiYOiDstJ0gQHRvdGFsIOykkSBAc2NvcmUg7KCQLiDsmIg6ICfstJ0gQHRvdGFsIOykkSBAc2NvcmUg7KCQJyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLqsrDqs7wg67O06riwIO2FjeyKpO2KuCIsCiAgICAgICJkZWZhdWx0IjogIuqysOqzvCDrs7TquLAiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi64uo64u1IOugiOydtOu4lCDthY3siqTtirgiLAogICAgICAiZGVmYXVsdCI6ICJBOiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLsnqzsi5zrj4Qg64uo7LaUIO2FjeyKpO2KuCIsCiAgICAgICJkZWZhdWx0IjogIuyerOyLnOuPhCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLrjIDshozrrLjsnpAg6rWs67aEIiwKICAgICAgImRlc2NyaXB0aW9uIjogIuyCrOyaqeyekCDsnoXroKXsnbQg64u167OA6rO8IOygle2Zle2eiCDrj5nsnbztlbTslbwg7ZWp64uI64ukLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLrs7TsobAg6riw7Iig7JeQIOuMgO2VnCDsmKTri7Ug7YWN7Iqk7Yq4IiwKICAgICAgImRlZmF1bHQiOiAi7Jik64u17J6F64uI64ukLiDsoJXri7XsnYAgQGFuc3dlciDsnoXri4jri6QuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIuuztOyhsCDquLDsiKDroZwg66eQ7ZW07KeA64qUIO2FjeyKpO2KuC4gQGFuc3dlciDsnYQo66W8KSDrs4DsiJjroZwg7IKs7Jqp7ZWY7IS47JqULiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLrs7TsobDquLDsiKDsnYQg7JyE7ZWcIOyYrOuwlOuluCDri7Xsl5Ag64yA7ZWcIO2UvOuTnOuwsSIsCiAgICAgICJkZWZhdWx0IjogIkBhbnN3ZXIg7J20IOyYrOuwlOuluCDri7XsnoXri4jri6QuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIuy5tOuTnOqwgCDsmKzrsJTrpbTqsowg64u17J20IOuQmOyXiOydhCDrlYwg67O07KGw6riw7Iig7J2EIOychO2VtCDsgqzsmqnrkKAg7YWN7Iqk7Yq4LiBAYW5zd2VyIOuKlCDrs4DsiJjroZwg7IKs7Jqp7ZWY7IS47JqULiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLrs7TsobAg6riw7Iig7J2EIOychO2VnCDsubTrk5wg67OA6rK9IiwKICAgICAgImRlZmF1bHQiOiAi7LSdIEB0b3RhbCDspJEg7ZiE7J6sIO2OmOydtOyngCBAY3VycmVudCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLsubTrk5zqsIQg7J2064+Z7JeQ7IScIOuztOyhsCDquLDsiKDroZwg66eQ7ZW07KeA64qUIO2FjeyKpO2KuC4gQGN1cnJlbnQg7JmAIEB0b3RhbCDrpbwg67OA7IiY66GcIOyCrOyaqe2VmOyEuOyalC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUmFuZG9taXplIGNhcmRzIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkVuYWJsZSB0byByYW5kb21pemUgdGhlIG9yZGVyIG9mIGNhcmRzIG9uIGRpc3BsYXkuIgogICAgfQogIF0KfQo="],"libraries\/H5P.Flashcards-1.7\/language\/lt.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJVxb5kdW90aWVzIGFwcmHFoXltYXMiCiAgICB9LAogICAgewogICAgICAid2lkZ2V0cyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiTnVtYXR5dGFzaXMiCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiS29ydGVsxJdzIiwKICAgICAgImVudGl0eSI6ICJrb3J0ZWzElyIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAibGFiZWwiOiAiS29ydGVsxJciLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJLbGF1c2ltYXMiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiTmVwcml2YWxvbWFzIHRla3N0aW5pcyBrb3J0ZWzEl3Mga2xhdXNpbWFzLiAoS29ydGVsxJdqZSBnYWxpIGLFq3RpIHRpayB2YWl6ZGFzLCB0aWsgdGVrc3RhcyBhcmJhIGFidSkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQXRzYWt5bWFzIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIkF0c2FreW1hcyAoc3ByZW5kaW1hcykga29ydGVsZWkuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlBhdmVpa3NsxJdsaXMiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiT3B0aW9uYWwgaW1hZ2UgZm9yIHRoZSBjYXJkLiAoVGhlIGNhcmQgbWF5IHVzZSBqdXN0IGFuIGltYWdlLCBqdXN0IGEgdGV4dCBvciBib3RoKSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJBbHRlcm5hdHl2dXMgcGF2ZWlrc2zEl2xpbyB0ZWtzdGFzIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlBhdGFyaW1hcyIsCiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlBhdGFyaW1vIHRla3N0YXMiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUHJvZ3Jlc3MgdGV4dCIsCiAgICAgICJkZWZhdWx0IjogIktvcnRlbMSXIEBjYXJkIGnFoSBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAiUGHFvmFuZ29zIHRla3N0YXMsIGdhbGltaSBraW50YW1pZWppOiBAY2FyZCBpciBAdG90YWwuIFBhdnl6ZHlzOiDigJ5Lb3J0ZWzElyBAY2FyZCBpxaEgQHRvdGFs4oCcIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHRoZSBuZXh0IGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIktpdGFzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHRoZSBwcmV2aW91cyBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJBbmtzdGVzbmlzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIHRoZSBjaGVjayBhbnN3ZXJzIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlRpa3JpbnRpIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlJlcXVpcmUgdXNlciBpbnB1dCBiZWZvcmUgdGhlIHNvbHV0aW9uIGNhbiBiZSB2aWV3ZWQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIGFuc3dlciBpbnB1dCBmaWVsZCIsCiAgICAgICJkZWZhdWx0IjogIkrFq3PFsyBhdHNha3ltYXMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgY29ycmVjdCBhbnN3ZXIiLAogICAgICAiZGVmYXVsdCI6ICJUZWlzaW5nYWkiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3RhcyBuZXRlaXNpbmdhbSBhdHNha3ltdWkiLAogICAgICAiZGVmYXVsdCI6ICJOZXRlaXNpbmdhaSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJSb2R5dGkgc3ByZW5kaW1vIHRla3N0xIUiLAogICAgICAiZGVmYXVsdCI6ICJUZWlzaW5nYXMgKC1pKSBhdHNha3ltYXMgKC1haSkiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgcmVzdWx0cyB0aXRsZSIsCiAgICAgICJkZWZhdWx0IjogIlJlenVsdGF0YWkiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3RhcyB0ZWlzaW5nYW0gbnVtZXJpdWkiLAogICAgICAiZGVmYXVsdCI6ICJAc2NvcmUgacWhIEB0b3RhbCB0ZWlzaW5nYWkiLAogICAgICAiZGVzY3JpcHRpb24iOiAiUmVzdWx0IHRleHQsIHZhcmlhYmxlcyBhdmFpbGFibGU6IEBzY29yZSBhbmQgQHRvdGFsLiBFeGFtcGxlOiAnQHNjb3JlIG9mIEB0b3RhbCBjb3JyZWN0JyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBzaG93IHJlc3VsdHMiLAogICAgICAiZGVmYXVsdCI6ICJSb2R5dGkgcmV6dWx0YXR1cyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBzaG9ydCBhbnN3ZXIgbGFiZWwiLAogICAgICAiZGVmYXVsdCI6ICJBOiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdGFzIG15Z3R1a3VpIOKAnkJhbmR5dGkgZGFyIGthcnTEheKAnCIsCiAgICAgICJkZWZhdWx0IjogIkJhbmR5dGkgZGFyIGthcnTEhSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJTa2lydGkgZGlkxb5pxIVzaWFzIGlyIG1hxb7EhXNpYXMgcmFpZGVzIiwKICAgICAgImRlc2NyaXB0aW9uIjogIk1ha2VzIHN1cmUgdGhlIHVzZXIgaW5wdXQgaGFzIHRvIGJlIGV4YWN0bHkgdGhlIHNhbWUgYXMgdGhlIGFuc3dlci4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiSW5jb3JyZWN0IHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJJbmNvcnJlY3QgYW5zd2VyLiBDb3JyZWN0IGFuc3dlciB3YXMgQGFuc3dlciIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcy4gVXNlIEBhbnN3ZXIgYXMgdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNvcnJlY3QgZmVlZGJhY2sgdGV4dCBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIkBhbnN3ZXIgeXJhIHRlaXNpbmdhcy4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMgd2hlbiBhIGNhcmQgaXMgYW5zd2VyZWQgY29ycmVjdGx5LiBVc2UgQGFuc3dlciBhcyB2YXJpYWJsZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2FyZCBjaGFuZ2UgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJQdXNsYXBpcyBAY3VycmVudCBpxaEgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdGhhdCB3aWxsIGJlIGFubm91bmNlZCB0byBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIHdoZW4gbmF2aWdhdGluZyBiZXR3ZWVuIGNhcmRzLiBVc2UgQGN1cnJlbnQgYW5kIEB0b3RhbCBhcyB2YXJpYWJsZXMuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlJhbmRvbWl6ZSBjYXJkcyIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJFbmFibGUgdG8gcmFuZG9taXplIHRoZSBvcmRlciBvZiBjYXJkcyBvbiBkaXNwbGF5LiIKICAgIH0KICBdCn0K"],"libraries\/H5P.Flashcards-1.7\/language\/lv.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJVemRldnVtYSBhcHJha3N0cyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJLYXJ0xKt0ZSIsCiAgICAgICJlbnRpdHkiOiAia2FydMSrdGUiLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImxhYmVsIjogIkthcnTEq3RlIiwKICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiSmF1dMSBanVtcyIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJOZW9ibGlnxIF0cyBrYXJ0xKt0ZXMgdGVrc3RhIGphdXTEgWp1bXMuIChLYXJ0xKt0ZWkgasSBYsWrdCBhdHTEk2xhbSwgdGlrYWkgdGVrc3RhbSB2YWkgYWJpZW0pIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkF0YmlsZGUiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiTmVvYmxpZ8SBdGEga2FydMSrdGVzIGF0YmlsZGUgKHJpc2luxIFqdW1zKS4gVXNlIGEgcGlwZSBzeW1ib2wgfCB0byBzcGxpdCBhbHRlcm5hdGl2ZSBzb2x1dGlvbnMuIFVzZSBcXHwgaWYgYSBzb2x1dGlvbiBzaG91bGQgY29udGFpbiBhIHwuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkF0dMSTbHMiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiTmVvYmxpZ8SBdHMga2FydMSrdGVzIGF0dMSTbHMuIChLYXJ0xKt0ZWkgasSBYsWrdCBhdHTEk2xhbSwgdGlrYWkgdGVrc3RhbSB2YWkgYWJpZW0pIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkFsdGVybmF0xKt2cyBhdHTEk2xhIHRla3N0cyIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJQYWRvbXMiLAogICAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJQYWRvbWEgdGVrc3RzIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfSwKICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIlDEk2Mgbm9rbHVzxJNqdW1hIgogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlByb2dyZXNhIHRla3N0cyIsCiAgICAgICJkZWZhdWx0IjogIkthcnTEq3RlIEBjYXJkIG5vIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJQcm9ncmVzYSB0ZWtzdHMsIHBpZWVqYW1pZSBtYWluxKtnaWU6IEBjYXJkIHVuIEB0b3RhbC4gUGllbcSTcmFtOiAnS2FydMSrdGUgQGNhcmQgbm8gQHRvdGFsJyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJQb2dhcyBcIlTEgWzEgWtcIiB0ZWtzdHMiLAogICAgICAiZGVmYXVsdCI6ICJUxIFsxIFrIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlBvZ2FzIFwiSWVwcmlla8WhxJNqc1wiIHRla3N0cyIsCiAgICAgICJkZWZhdWx0IjogIkllcHJpZWvFocSTanMiCiAgICB9LAogICAgewogICAgICAiZGVmYXVsdCI6ICJQxIFyYmF1ZMSrdCIsCiAgICAgICJsYWJlbCI6ICJQb2dhcyBcIlDEgXJiYXVkxKt0XCIgdGVrc3RzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlBpZXByYXPEq3QgbGlldG90xIFqYSBpZXZhZGkgcGlybXMgYXTEvGF1dHMgc2thdMSrdCByaXNpbsSBanVtdSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJBdGJpbGRlcyBpZXZhZGVzIGxhdWthIHRla3N0cyIsCiAgICAgICJkZWZhdWx0IjogIkrFq3N1IGF0YmlsZGUiCiAgICB9LAogICAgewogICAgICAiZGVmYXVsdCI6ICJQYXJlaXppIiwKICAgICAgImxhYmVsIjogIlBhcmVpemFzIGF0YmlsZGVzIHRla3N0cyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJOZXBhcmVpemFzIGF0YmlsZGVzIHRla3N0cyIsCiAgICAgICJkZWZhdWx0IjogIk5lcGFyZWl6aSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJSxIFkxKt0IHJpc2luxIFqdW1hIHRla3N0dSIsCiAgICAgICJkZWZhdWx0IjogIlBhcmVpemEgYXRiaWxkZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJSZXp1bHTEgXR1IHZpcnNyYWtzdGEgdGVrc3RzIiwKICAgICAgImRlZmF1bHQiOiAiUmV6dWx0xIF0aSIKICAgIH0sCiAgICB7CiAgICAgICJkZWZhdWx0IjogIkBzY29yZSBubyBAdG90YWwgcGFyZWl6aSIsCiAgICAgICJsYWJlbCI6ICJQYXJlaXpvIGF0Ymlsxb51IHNrYWl0YSB0ZWtzdHMiLAogICAgICAiZGVzY3JpcHRpb24iOiAiUmV6dWx0xIF0dSB0ZWtzdHMsIHBpZWVqYW1pIG1haW7Eq2dpZTogQHNjb3JlIHVuIEB0b3RhbC4gUGllbcSTcnM6ICdAc2NvcmUgbm8gQHRvdGFsIHBhcmVpemknIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlJlenVsdMSBdHUgYXRzcG9ndcS8b8WhYW5hcyB0ZWtzdHMiLAogICAgICAiZGVmYXVsdCI6ICJSxIFkxKt0IHJlenVsdMSBdHVzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIsSqc8SBcyBhdGJpbGRlcyBldGnEt2V0ZXMgdGVrc3RzIiwKICAgICAgImRlZmF1bHQiOiAiQToiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUG9nYXMgXCJNxJPEo2luxIF0IHbEk2xyZWl6XCIgdGVrc3RzIiwKICAgICAgImRlZmF1bHQiOiAiTcSTxKNpbsSBdCB2xJNscmVpeiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJSZcSjaXN0cmp1dMSrZ3MiLAogICAgICAiZGVzY3JpcHRpb24iOiAiTm9kcm\/FoWluYSwga2EgbGlldG90xIFqYSBpZXZhZGUgaXIgdGllxaFpIHTEgWRhIHBhdGkga8SBIGF0YmlsZGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk5lcGFyZWl6xIFzIGF0YmlsZGVzIHRla3N0cyBhc2lzdMSrdmFqxIFtIHRlaG5vbG\/Eo2lqxIFtIiwKICAgICAgImRlZmF1bHQiOiAiTmVwYXJlaXphIGF0YmlsZGUuIFBhcmVpesSBIGF0YmlsZGUgYmlqYSBAYW5zd2VyIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRla3N0cywga3VydSBhdHNrYcWGb3MgYXNpc3TEq3bEgXMgdGVobm9sb8SjaWphcy4gSXptYW50b2ppZXQgQGFuc3dlciBrxIEgbWFpbsSrZ28uIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlBhcmVpemFzIGthcnTEq3RlcyBhdGdyaWV6ZW5pc2vEgXMgc2FpdGVzIHRla3N0cyBhc2lzdMSrdmFqxIFtIHRlaG5vbG\/Eo2lqxIFtIiwKICAgICAgImRlZmF1bHQiOiAiQGFuc3dlciBpciBwYXJlaXphLiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZWtzdHMsIGt1cnUgYXRza2HFhm9zIGFzaXN0xKt2xIFzIHRlaG5vbG\/Eo2lqYXMga2FkIGthcnTEq3RlIGF0YmlsZMSTdGEgcGFyZWl6aS4gSXptYW50b2ppZXQgbWFpbsSrZ28gQGFuc3dlci4iCiAgICB9LAogICAgewogICAgICAiZGVmYXVsdCI6ICJMYXBhIEBjdXJyZW50IG5vIEB0b3RhbCIsCiAgICAgICJsYWJlbCI6ICJLYXJ0xKt0ZXMgbWFpxYZhIGFzaXN0xKt2YWrEgW0gdGVobm9sb8SjaWrEgW0iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGVrc3RzLCBrdXJ1IGF0c2thxYZvcyBhc2lzdMSrdsSBcyB0ZWhub2xvxKNpamFzIGthZCBwxIFydmlldG9zaWVzIHN0YXJwIGthcnTEq3TEk20uIEl6bWFudG9qaWV0IEBjdXJyZW50IHVuIEB0b3RhbCBrxIEgbWFpbsSrZ29zLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJSYW5kb21pemUgY2FyZHMiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRW5hYmxlIHRvIHJhbmRvbWl6ZSB0aGUgb3JkZXIgb2YgY2FyZHMgb24gZGlzcGxheS4iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Flashcards-1.7\/language\/mn.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLQkNC20LvRi9C9INGC0L7QtNC+0YDRhdC+0LnQu9C+0LvRgiIKICAgIH0sCiAgICB7CiAgICAgICJ3aWRnZXRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICLTqNCz06nQs9C00LzTqdC7IgogICAgICAgIH0KICAgICAgXSwKICAgICAgImxhYmVsIjogItCa0LDRgNGC0YPRg9C0IiwKICAgICAgImVudGl0eSI6ICLQutCw0YDRgiIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAibGFiZWwiOiAi0JrQsNGA0YIiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICLQkNGB0YPRg9C70YIiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAi0JrQsNGA0YLRi9C9INC90Y3QvNGN0LvRgiDRgtC10LrRgdGCINCw0YHRg9GD0LvRgi4gKNCa0LDRgNGCINC90Ywg0LfTqdCy0YXTqdC9INC30YPRgNCw0LMsINGC0LXQutGB0YIg0Y3RgdCy0Y3QuyDRhdC+0ZHRg9C70LDQvdCzINC90Ywg0LDRiNC40LPQu9Cw0LYg0LHQvtC70L3QvikiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAi0KXQsNGA0LjRg9C70YIiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAi0JrQsNGA0YLRi9C9INC90Y3QvNGN0LvRgiDRhdCw0YDQuNGD0LvRgiAo0YjQuNC50LTRjdC7KS4iCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAi0JTSr9GA0YEiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAi0JrQsNGA0YLRi9C9INC90Y3QvNGN0LvRgiDQt9GD0YDQsNCzLiAo0JrQsNGA0YIg0L3RjCDQt9Op0LLRhdOp0L0g0LfRg9GA0LDQsywg0YLQtdC60YHRgiDRjdGB0LLRjdC7INGF0L7RkdGD0LvQsNC90LMg0L3RjCDQsNGI0LjQs9C70LDQtiDQsdC+0LvQvdC+KSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICLQl9GD0YDQs9C40LnQvSDTqdOp0YAg0YLQtdC60YHRgiIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICLQl9Op0LLQu9Op0LPTqdOpIiwKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAi0JfTqdCy0LvTqdCz06nTqSDRgtC10LrRgdGCIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCv0LLRhtGL0L0g0YLQtdC60YHRgiIsCiAgICAgICJkZWZhdWx0IjogIkB0b3RhbCDQtNGD0L3QtNCw0LDRgSBAY2FyZCDQutCw0YDRgiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLQr9Cy0YbRi9C9INGC0LXQutGB0YIsINCx0L7Qu9C+0LzQttGC0L7QuSDRhdGD0LLRjNGB0LDQs9GHOiBAY2FyZCDQsdC+0LvQvtC9IEB0b3RhbC4g0JbQuNGI0Y3RjSDQvdGMOiAnQHRvdGFsINC00YPQvdC00LDQsNGBIEBjYXJkINC60LDRgNGCJyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQlNCw0YDQsNCw0LPQuNC50L0g0YLQvtCy0YfQu9GD0YPRgNGL0L0g0YLQtdC60YHRgiIsCiAgICAgICJkZWZhdWx0IjogItCU0LDRgNCw0LDRh9C40LnQvSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLTqNC80L3TqdGFINGC0L7QstGH0LvRg9GD0YDRi9C9INGC0LXQutGB0YIiLAogICAgICAiZGVmYXVsdCI6ICLTqNC80L3TqdGFIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCo0LDQu9Cz0LDRhSDRhdCw0YDQuNGD0LvRgtGL0L0g0YLQvtCy0YfQu9GD0YPRgNGL0L0g0YLQtdC60YHRgiIsCiAgICAgICJkZWZhdWx0IjogItCo0LDQu9Cz0LDRhSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQqNC40LnQtNCy0Y3RgNC40LnQsyDSr9C30Y3RhdC40LnQvSDTqdC80L3TqSDRhdGN0YDRjdCz0LvRjdCz0YfQuNC50L0g0L7RgNGD0YPQu9Cw0YUg0YjQsNCw0YDQtNC70LDQs9Cw0YLQsNC5IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCl0LDRgNC40YPQu9GCINC+0YDRg9GD0LvQsNGFINGC0LDQu9Cx0LDRgNGCINC30L7RgNC40YPQu9GB0LDQvSDRgtC10LrRgdGCIiwKICAgICAgImRlZmF1bHQiOiAi0KLQsNC90Ysg0YXQsNGA0LjRg9C70YIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0JfTqdCyINGF0LDRgNC40YPQu9GC0YvQvSDRgtC10LrRgdGCIiwKICAgICAgImRlZmF1bHQiOiAi0JfTqdCyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCR0YPRgNGD0YMg0YXQsNGA0LjRg9C70YLRi9C9INGC0LXQutGB0YIiLAogICAgICAiZGVmYXVsdCI6ICLQkdGD0YDRg9GDIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCo0LjQudC00LvQuNC50L0g0YLQtdC60YHRgtC40LnQsyDRhdCw0YDRg9GD0LvQsNGFIiwKICAgICAgImRlZmF1bHQiOiAi0JfTqdCyINGF0LDRgNC40YPQu9GCIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItKu0YAg0LTSr9C90LPQuNC50L0g0LPQsNGA0YfQuNCz0YIg0LfQvtGA0LjRg9C70YHQsNC9INGC0LXQutGB0YIiLAogICAgICAiZGVmYXVsdCI6ICLSrtGAINC00q\/QvSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQl9Op0LIg0YLQvtC+INCx0LjRh9C40YUg0YLQtdC60YHRgiIsCiAgICAgICJkZWZhdWx0IjogIkB0b3RhbCDQvtC90L7QvtC90L7QvtGBIEBzY29yZSDQt9Op0LIiLAogICAgICAiZGVzY3JpcHRpb24iOiAi0q7RgCDQtNKv0L3Qs9C40LnQvSDRgtC10LrRgdGCLCDQsdC+0LvQvtC80LbRgtC+0Lkg0YXRg9Cy0YzRgdCw0LPRhzogQHNjb3JlINCx0L7Qu9C+0L0gQHRvdGFsLiDQltC40YjRjdGNINC90Yw6ICdAdG90YWwg0L7QvdC+0L7QvdC+0L7RgSBAc2NvcmUg0L3RjCDQt9Op0LInIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItKu0YAg0LTSr9C90LMg0YXQsNGA0YPRg9C70LDRhSDRgtC10LrRgdGCIiwKICAgICAgImRlZmF1bHQiOiAi0q7RgCDQtNKv0L3QsyDRhdCw0YDRg9GD0LvQsNGFIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCR0L7Qs9C40L3QviDRhdCw0YDQuNGD0LvRgtGL0L0g0YjQvtGI0LPQvtC90LQg0LfQvtGA0LjRg9C70YHQsNC9INGC0LXQutGB0YIiLAogICAgICAiZGVmYXVsdCI6ICJBOiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJcItCU0LDRhdC40L0g0L7RgNC+0LvQtNC+0YVcIiDRgtC+0LLRh9C70YPRg9GA0YvQvSDRgtC10LrRgdGCIiwKICAgICAgImRlZmF1bHQiOiAi0JTQsNGF0LjQvSDQvtGA0L7Qu9C00L7QvdC+INGD0YMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQvtC8INC20LjQttCz0Y3RjdGAINCx0LjRh9GF0Y3RjdGBINGF0LDQvNCw0LDRgNC90LAiLAogICAgICAiZGVzY3JpcHRpb24iOiAi0KXRjdGA0Y3Qs9C70Y3Qs9GH0LjQudC9INC+0YDRg9GD0LvRgdCw0L0g0LzRjdC00Y3RjdC70Y3QuyDRhdCw0YDQuNGD0LvRgtGC0LDQuSDRj9CzINCw0LTQuNC70YXQsNC9INCx0LDQudGFINGR0YHRgtC+0LkuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0YPRgdC70LDRhSDRgtC10YXQvdC+0LvQvtCz0LjQtCDQt9C+0YDQuNGD0LvRgdCw0L0g0LHRg9GA0YPRgyDRgtC10LrRgdGCIiwKICAgICAgImRlc2NyaXB0aW9uIjogItCi0YPRgdC70LDRhSDRgtC10YXQvdC+0LvQvtCz0LjQtCDQt9Cw0YDQu9Cw0YUg0YLQtdC60YHRgi4gQGFuc3dlciAt0YvQsyDRhdGD0LLRjNGB0LDQs9GHINCx0L7Qu9Cz0L7QvSDQsNGI0LjQs9C70LAuIiwKICAgICAgImRlZmF1bHQiOiAi0JHRg9GA0YPRgyDRhdCw0YDQuNGD0LvRgi4g0JfTqdCyINGF0LDRgNC40YPQu9GCINC90YwgQGFuc3dlciDQsdCw0LnRgdCw0L0iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLRg9GB0LvQsNGFINGC0LXRhdC90L7Qu9C+0LPQuNC0INC30L7RgNC40YPQu9GB0LDQvSDQt9Op0LIg0YHQsNC90LDQuyDRhdKv0YHRjdC70YLQuNC50L0g0YLQtdC60YHRgiIsCiAgICAgICJkZWZhdWx0IjogIkBhbnN3ZXIg0L3RjCDQt9Op0LIuIiwKICAgICAgImRlc2NyaXB0aW9uIjogItCa0LDRgNGC0LDQvdC0INC306nQsiDRhdCw0YDQuNGD0LvRgdCw0L0g0YLQvtGF0LjQvtC70LTQvtC70LQg0YLRg9GB0LvQsNGFINGC0LXRhdC90L7Qu9C+0LPQuNC0INC80Y3QtNGN0LPQtNGN0YUg0YLQtdC60YHRgi4gQGFuc3dlciAt0YvQsyDRhdGD0LLRjNGB0LDQs9GHINCx0L7Qu9Cz0L7QvSDQsNGI0LjQs9C70LAuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0YPRgdC70LDRhSDRgtC10YXQvdC+0LvQvtCz0LjQtCDQt9C+0YDQuNGD0LvQtiDQutCw0YDRgiDRgdC+0LvQuNGFIiwKICAgICAgImRlZmF1bHQiOiAi0J3QuNC50YIgQHRvdGFsIC3QsNCw0YEgQGN1cnJlbnQg0YXRg9GD0LTQsNGBIiwKICAgICAgImRlc2NyaXB0aW9uIjogItCa0LDRgNGC0YPRg9C00YvQvSDRhdC+0L7RgNC+0L3QtCDRiNC40LvQttC40YXRjdC0INGC0YPRgdC70LDRhSDRgtC10YXQvdC+0LvQvtCz0LjQtCDQvNGN0LTRjdCz0LTRjdGFINGC0LXQutGB0YIuIEBjdXJyZW50INCx0L7Qu9C+0L0gQHRvdGFsLdCzINGF0YPQstGM0YHQsNCz0Ycg0LHQvtC70LPQvtC9INCw0YjQuNCz0LvQsC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUmFuZG9taXplIGNhcmRzIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkVuYWJsZSB0byByYW5kb21pemUgdGhlIG9yZGVyIG9mIGNhcmRzIG9uIGRpc3BsYXkuIgogICAgfQogIF0KfQo="],"libraries\/H5P.Flashcards-1.7\/language\/nb.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJPcHBnYXZlYmVza3JpdmVsc2UiCiAgICB9LAogICAgewogICAgICAid2lkZ2V0cyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiU3RhbmRhcmQiCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiS29ydCIsCiAgICAgICJlbnRpdHkiOiAia29ydCIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAibGFiZWwiOiAiS29ydCIsCiAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlNww7hyc23DpWwiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiVmFsZ2ZyaXR0IHRla3N0bGlnIHNww7hyc23DpWwuIChLb3J0ZXQga2FuIGlubmVob2xkZSBiaWxkZSwgdGVrc3QgZWxsZXIgYmVnZ2UgZGVsZXIpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlN2YXIiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiU3ZhciAoZmFzaXQpIGZvciBrb3J0ZXQuIFVzZSBhIHBpcGUgc3ltYm9sIHwgdG8gc3BsaXQgYWx0ZXJuYXRpdmUgc29sdXRpb25zLiBVc2UgXFx8IGlmIGEgc29sdXRpb24gc2hvdWxkIGNvbnRhaW4gYSB8LiIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJCaWxkZSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJWYWxnZnJpdHQgYmlsZGUuIChLb3J0ZXQga2FuIGlubmVob2xkZSBiaWxkZSwgdGVrc3QgZWxsZXIgYmVnZ2UgZGVsZXIpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkFsdGVybmF0aXZlIHRleHQgZm9yIGltYWdlIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlRpcHMiLAogICAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJUaXBzdGVrc3QiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3QgZm9yIGZyZW1kcmlmdCIsCiAgICAgICJkZWZhdWx0IjogIktvcnQgQGNhcmQgYXYgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRla3N0IHNvbSBhbmdpciBodmlsa2V0IGtvcnQgZW4gZXIgcMOlLiBWYXJpYWJsZXIgdGlsZ2plbmdlbGlnOiBAY2FyZCBvZyBAdG90YWwuIEVrc2VtcGVsOiAnS29ydCBAY2FyZCBhdiBAdG90YWwnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0IGZvciBcIk5lc3RlXCIga25hcHBlbiIsCiAgICAgICJkZWZhdWx0IjogIk5lc3RlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0IGZvciBcIkZvcnJpZ2VcIiBrbmFwcGVuIiwKICAgICAgImRlZmF1bHQiOiAiRm9ycmlnZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdCBmb3IgXCJTamVrayBzdmFyXCIga25hcHBlbiIsCiAgICAgICJkZWZhdWx0IjogIlNqZWtrIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIktyZXYgaW5uZGF0YSBmcmEgYnJ1a2VyZW4gZsO4ciBmYXNpdCBnaXMuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0IGZvciBcInN2YXJcIiBmZWx0ZXQiLAogICAgICAiZGVmYXVsdCI6ICJEaXR0IHN2YXIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3QgZm9yIHJpa3RpZyBzdmFyIiwKICAgICAgImRlZmF1bHQiOiAiUmlrdGlnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0IGZvciBmZWlsIHN2YXIiLAogICAgICAiZGVmYXVsdCI6ICJGZWlsIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0IGZvciB2aXMgc3Zhci4iLAogICAgICAiZGVmYXVsdCI6ICJSaWt0aWcgc3ZhciIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdCBmb3IgdGl0dGVsIHDDpSBSZXN1bHRhdHNramVybSIsCiAgICAgICJkZWZhdWx0IjogIlJlc3VsdGF0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0IGZvciBhbnRhbGwga29ycmVrdCIsCiAgICAgICJkZWZhdWx0IjogIkBzY29yZSBhdiBAdG90YWwga29ycmVrdCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJSZXN1bHRhdHRla3N0LiBWYXJpYWJsYXIgdGlsZ2plbmdlbGlnOiBAc2NvcmUgb2cgQHRvdGFsLiBFa3NlbXBlbDogJ0BzY29yZSBhdiBAdG90YWwga29ycmVrdCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3QgZm9yIFwidmlzIHJlc3VsdGF0ZXJcIiIsCiAgICAgICJkZWZhdWx0IjogIlZpcyByZXN1bHRhdGVyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0IGZvciBrb3J0IHN2YXJ0ZWtzdCIsCiAgICAgICJkZWZhdWx0IjogIlM6IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIFwicmV0cnlcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJQcsO4diBpZ2plbiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDYXNlIHNlbnNpdGl2ZSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJNYWtlcyBzdXJlIHRoZSB1c2VyIGlucHV0IGhhcyB0byBiZSBleGFjdGx5IHRoZSBzYW1lIGFzIHRoZSBhbnN3ZXIuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkluY29ycmVjdCB0ZXh0IGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiSW5jb3JyZWN0IGFuc3dlci4gQ29ycmVjdCBhbnN3ZXIgd2FzIEBhbnN3ZXIiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMuIFVzZSBAYW5zd2VyIGFzIHZhcmlhYmxlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDb3JyZWN0IGZlZWRiYWNrIHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJAYW5zd2VyIGlzIGNvcnJlY3QuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdGhhdCB3aWxsIGJlIGFubm91bmNlZCB0byBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIHdoZW4gYSBjYXJkIGlzIGFuc3dlcmVkIGNvcnJlY3RseS4gVXNlIEBhbnN3ZXIgYXMgdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNhcmQgY2hhbmdlIGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiUGFnZSBAY3VycmVudCBvZiBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMgd2hlbiBuYXZpZ2F0aW5nIGJldHdlZW4gY2FyZHMuIFVzZSBAY3VycmVudCBhbmQgQHRvdGFsIGFzIHZhcmlhYmxlcy4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUmFuZG9taXplIGNhcmRzIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkVuYWJsZSB0byByYW5kb21pemUgdGhlIG9yZGVyIG9mIGNhcmRzIG9uIGRpc3BsYXkuIgogICAgfQogIF0KfQo="],"libraries\/H5P.Flashcards-1.7\/language\/nl.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJUYWFrb21zY2hyaWp2aW5nIgogICAgfSwKICAgIHsKICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIlN0YW5kYWFyZCIKICAgICAgICB9CiAgICAgIF0sCiAgICAgICJsYWJlbCI6ICJLYWFydGVuIiwKICAgICAgImVudGl0eSI6ICJrYWFydCIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAibGFiZWwiOiAiS2FhcnQiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJWcmFhZyIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJEZSBvcHRpb25lbGUgdnJhYWcgdm9vcm9wIGRlIGthYXJ0LiAoRGUga2FhcnQga2FuIHZvb3J6aWVuIHdvcmRlbiB2YW4gZWVuIGFmYmVlbGRpbmcgZW4vb2YgdGVrc3QpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkFudHdvb3JkIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIkhldCBvcHRpb25lbGUgYW50d29vcmQgKG9wbG9zc2luZykgYWNodGVyb3AgZGUga2FhcnQuIFVzZSBhIHBpcGUgc3ltYm9sIHwgdG8gc3BsaXQgYWx0ZXJuYXRpdmUgc29sdXRpb25zLiBVc2UgXFx8IGlmIGEgc29sdXRpb24gc2hvdWxkIGNvbnRhaW4gYSB8LiIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJBZmJlZWxkaW5nIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIkRlIG9wdGlvbmVsZSBhZmJlZWxkaW5nIHZvb3JvcCBkZSBrYWFydC4gKERlIGthYXJ0IGthbiB2b29yemllbiB3b3JkZW4gdmFuIGVlbiBhZmJlZWxkaW5nIGVuL29mIHRla3N0KSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJBbHRlcm5hdGlldmUgdGVrc3Qgdm9vciBhZmJlZWxkaW5nIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlRpcCIsCiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlRla3N0IHZvb3IgdGlwIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlZvb3J0Z2FuZ3N0ZWtzdCIsCiAgICAgICJkZWZhdWx0IjogIkthYXJ0IEBjYXJkIHZhbiBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVm9vcnRnYW5nc3Rla3N0LCBiZXNjaGlrYmFyZSB2YXJpYWJlbGVuOiBAY2FyZCBlbiBAdG90YWwuIFZvb3JiZWVsZDogJ0thYXJ0IEBjYXJkIHZhbiBAdG90YWwnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0IHZvb3IgXCJWb2xnZW5kZVwiLWtub3AiLAogICAgICAiZGVmYXVsdCI6ICJWb2xnZW5kZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdCB2b29yIFwiVm9yaWdlXCIta25vcCIsCiAgICAgICJkZWZhdWx0IjogIlZvcmlnZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdCB2b29yIFwiQ29udHJvbGVlclwiLWtub3AiLAogICAgICAiZGVmYXVsdCI6ICJDb250cm9sZWVyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkdlYnJ1aWtlcnNpbnZvZXIgaXMgdmVyZWlzdCwgdm9vcmRhdCBkZSBvcGxvc3Npbmcga2FuIHdvcmRlbiBiZWtla2VuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0IHZvb3IgaGV0IGFudHdvb3JkIGludm9lcnZlbGQiLAogICAgICAiZGVmYXVsdCI6ICJKZSBhbnR3b29yZCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdCB2b29yIGp1aXN0IGFudHdvb3JkIiwKICAgICAgImRlZmF1bHQiOiAiSnVpc3QiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3Qgdm9vciBvbmp1aXN0ZSBhbnR3b29yZCIsCiAgICAgICJkZWZhdWx0IjogIk9uanVpc3QiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVG9vbiB0ZWtzdCBvcGxvc3NpbmciLAogICAgICAiZGVmYXVsdCI6ICJKdWlzdCBhbnR3b29yZCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUaXRlbCB2b29yIHJlc3VsdGF0ZW4iLAogICAgICAiZGVmYXVsdCI6ICJSZXN1bHRhdGVuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0IHZvb3IgYWFudGFsIGp1aXN0IiwKICAgICAgImRlZmF1bHQiOiAiQHNjb3JlIHZhbiBAdG90YWwganVpc3QiLAogICAgICAiZGVzY3JpcHRpb24iOiAiUmVzdWx0YXRlbnRla3N0LCBiZXNjaGlrYmFyZSB2YXJpYWJlbGVuOiBAc2NvcmUgZW4gQHRvdGFsLiBWb29yYmVlbGQ6ICdAc2NvcmUgdmFuIEB0b3RhbCBqdWlzdCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3Qgdm9vciBoZXQgdG9uZW4gdmFuIGRlIHJlc3VsdGF0ZW4iLAogICAgICAiZGVmYXVsdCI6ICJUb29uIHJlc3VsdGF0ZW4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3RsYWJlbCB2b29yIGVlbiBrb3J0IGFudHdvb3JkIiwKICAgICAgImRlZmF1bHQiOiAiQToiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3Qgdm9vciBcIk9wbmlldXdcIi1rbm9wIiwKICAgICAgImRlZmF1bHQiOiAiT3BuaWV1dyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJIb29mZGxldHRlcmdldm9lbGlnIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkRlIGdlYnJ1aWtlcnNpbnZvZXIgZGllbnQgZXhhY3QgaGV0emVsZmRlIHRlIHppam4gYWxzIGhldCBhbnR3b29yZC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiT25qdWlzdCB0ZWtzdCB2b29yIG9uZGVyc3RldW5lbmRlIHRlY2hub2xvZ2llw6tuIiwKICAgICAgImRlZmF1bHQiOiAiT25qdWlzdCBhbnR3b29yZC4gSnVpc3QgYW50d29vcmQgd2FzIEBhbnN3ZXIiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGVrc3QgZGllIHdvcmR0IGdlYnJ1aWt0IGRvb3Igb25kZXJzdGV1bmVuZGUgdGVjaG5vbG9naWXDq24uIEdlYnJ1aWsgQGFuc3dlciBhbHMgdmFyaWFiZWxlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJGZWVkYmFjayB0ZWtzdCB2b29yIGp1aXN0ZSBhbnR3b29yZCB2b29yIG9uZGVyc3RldW5lbmRlIHRlY2hub2xvZ2llw6tuIiwKICAgICAgImRlZmF1bHQiOiAiQGFuc3dlciBpcyBjb3JyZWN0LiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZWtzdCBkaWUgd29yZHQgYWFuZ2VnZXZlbiBhYW4gb25kZXJzdGV1bmVuZGUgdGVjaG5vbG9naWXDq24gYWxzIGVlbiBrYWFydCBqdWlzdCBpcyBiZWFudHdvb3JkLiBHZWJydWlrIEBhbnN3ZXIgYWxzIHZhcmlhYmVsZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiS2FhcnQgd2lqemlnZW4gdm9vciBvbmRlcnN0ZXVuZW5kZSB0ZWNobm9sb2dpZcOrbiIsCiAgICAgICJkZWZhdWx0IjogIlBhZ2luYSBAY3VycmVudCB2YW4gQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRla3N0IGRpZSB3b3JkdCBnZWJydWlrdCBkb29yIG9uZGVyc3RldW5lbmRlIHRlY2hub2xvZ2llw6tuIGFscyB2YW4ga2FhcnQgd29yZHQgZ2V3aXNzZWxkLiBHZWJydWlrIEBjdXJyZW50IGVuIEB0b3RhbCBhbHMgdmFyaWFiZWxlbi4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiS2FhcnRlbiBpbiB3aWxsZWtldXJpZ2Ugdm9sZ29yZGUiLAogICAgICAiZGVzY3JpcHRpb24iOiAiU2NoYWtlbCBpbiBvbSBkZSBrYWFydGVuIGluIHdpbGxla2V1cmlnZSB2b2xnb3JkZSB0ZSB0b25lbi4iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Flashcards-1.7\/language\/nn.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJPcHBnw6V2ZWJlc2tyaXZpbmciCiAgICB9LAogICAgewogICAgICAid2lkZ2V0cyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiRGVmYXVsdCIKICAgICAgICB9CiAgICAgIF0sCiAgICAgICJsYWJlbCI6ICJLb3J0IiwKICAgICAgImVudGl0eSI6ICJrb3J0IiwKICAgICAgImZpZWxkIjogewogICAgICAgICJsYWJlbCI6ICJLb3J0IiwKICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiU3DDuHJzbcOlbCIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJWYWxmcml0dCB0ZWtzdGxlZyBzcMO4cnNtw6VsLiAoS29ydGV0IGthbiBpbm5laGFsZGUgYmlsZGUsIHRla3N0LCBlbGxlciBiZWdnZSBkZWxlcikiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiU3ZhciIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJTdmFyIChmYXNpdCkgZm9yIGtvcnRldC4gVXNlIGEgcGlwZSBzeW1ib2wgfCB0byBzcGxpdCBhbHRlcm5hdGl2ZSBzb2x1dGlvbnMuIFVzZSBcXHwgaWYgYSBzb2x1dGlvbiBzaG91bGQgY29udGFpbiBhIHwuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkJpbGRlIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIlZhbGZyaXR0IHRla3N0bGVnIHNww7hyc23DpWwuIChLb3J0ZXQga2FuIGlubmVoYWxkZSBiaWxkZSwgdGVrc3QsIGVsbGVyIGJlZ2dlIGRlbGVyKSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJBbHRlcm5hdGl2ZSB0ZXh0IGZvciBpbWFnZSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJUaXBzIiwKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiVGlwc3Rla3N0IgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0IGZvciBmcmFtZHJpZnQiLAogICAgICAiZGVmYXVsdCI6ICJLb3J0IEBjYXJkIGF2IEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZWtzdCBzb20gdmlzZXIga3ZhIGZvciBrb3J0IGVpbiBlciBww6UuIFZhcmlhYmxhciB0aWxnamVuZ2VsaWc6IEBjYXJkIG9nIEB0b3RhbC4gRWtzZW1wZWw6ICdLb3J0IEBjYXJkIGF2IEB0b3RhbCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3QgZm9yIFwiTmVzdGVcIiBrbmFwcGVuIiwKICAgICAgImRlZmF1bHQiOiAiTmVzdGUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3QgZm9yIFwiRm9ycmlnZVwiIGtuYXBwZW4iLAogICAgICAiZGVmYXVsdCI6ICJGw7hycmUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3QgZm9yIFwiU2pla2sgc3ZhclwiIGtuYXBwZW4iLAogICAgICAiZGVmYXVsdCI6ICJTamVrayIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJLcmV2IGlubmRhdGEgZnLDpSBicnVrYXJlbiBmw7hyIGZhc2l0IGJsaXIgdmlzdC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3QgZm9yIFwic3ZhclwiIGZlbHRldCIsCiAgICAgICJkZWZhdWx0IjogIkRpdHQgc3ZhciIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdCBmb3IgcmlrdGlnIHN2YXIiLAogICAgICAiZGVmYXVsdCI6ICJSaWt0aWciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3QgZm9yIGZlaWwgc3ZhciIsCiAgICAgICJkZWZhdWx0IjogIkZlaWwiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3QgZm9yIHZpcyBzdmFyLiIsCiAgICAgICJkZWZhdWx0IjogIlJpa3RpZyBzdmFyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0IGZvciB0aXR0ZWwgcMOlIFJlc3VsdGF0c2tqZXJtIiwKICAgICAgImRlZmF1bHQiOiAiUmVzdWx0YXQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3QgZm9yIGFudGFsbCBrb3JyZWt0IiwKICAgICAgImRlZmF1bHQiOiAiQHNjb3JlIGF2IEB0b3RhbCBrb3JyZWt0IiwKICAgICAgImRlc2NyaXB0aW9uIjogIlJlc3VsdGF0dGVrc3QuIFZhcmlhYmxhciB0aWxnamVuZ2VsaWc6IEBzY29yZSBvZyBAdG90YWwuIEVrc2VtcGVsOiAnQHNjb3JlIGF2IEB0b3RhbCBrb3JyZWt0JyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdCBmb3IgXCJ2aXMgcmVzdWx0YXRhclwiIiwKICAgICAgImRlZmF1bHQiOiAiVmlzIHJlc3VsdGF0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0IGZvciBrb3J0IHN2YXJ0ZWtzdCIsCiAgICAgICJkZWZhdWx0IjogIlM6IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIFwicmV0cnlcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJQcsO4diBpZ2plbiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDYXNlIHNlbnNpdGl2ZSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJNYWtlcyBzdXJlIHRoZSB1c2VyIGlucHV0IGhhcyB0byBiZSBleGFjdGx5IHRoZSBzYW1lIGFzIHRoZSBhbnN3ZXIuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkluY29ycmVjdCB0ZXh0IGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiRmVpbCBzdmFyLiBEZXQgcmV0dGUgc3ZhcmV0IHZhciBAYW5zd2VyIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdGhhdCB3aWxsIGJlIGFubm91bmNlZCB0byBhc3Npc3RpdmUgdGVjaG5vbG9naWVzLiBVc2UgQGFuc3dlciBhcyB2YXJpYWJsZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ29ycmVjdCBmZWVkYmFjayB0ZXh0IGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiQGFuc3dlciBpcyBjb3JyZWN0LiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcyB3aGVuIGEgY2FyZCBpcyBhbnN3ZXJlZCBjb3JyZWN0bHkuIFVzZSBAYW5zd2VyIGFzIHZhcmlhYmxlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDYXJkIGNoYW5nZSBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIlNpZGUgQGN1cnJlbnQgYXYgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdGhhdCB3aWxsIGJlIGFubm91bmNlZCB0byBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIHdoZW4gbmF2aWdhdGluZyBiZXR3ZWVuIGNhcmRzLiBVc2UgQGN1cnJlbnQgYW5kIEB0b3RhbCBhcyB2YXJpYWJsZXMuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlJhbmRvbWl6ZSBjYXJkcyIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJFbmFibGUgdG8gcmFuZG9taXplIHRoZSBvcmRlciBvZiBjYXJkcyBvbiBkaXNwbGF5LiIKICAgIH0KICBdCn0="],"libraries\/H5P.Flashcards-1.7\/language\/pap-cw.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZXNrcmlwc2hvbiBkaSB0YXJlYSIKICAgIH0sCiAgICB7CiAgICAgICJ3aWRnZXRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJTdGFuZGFydCIKICAgICAgICB9CiAgICAgIF0sCiAgICAgICJsYWJlbCI6ICJLYXJjaGkiLAogICAgICAiZW50aXR5IjogImthcmNoaSIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAibGFiZWwiOiAiS2FyY2hpIiwKICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiUHJlZ3VudGEiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiRSBwcmVndW50YSBvcHNob25hbCByaWJhIGUgcGFydGkgZGlsYW50aSBkaSBlIGthcmNoaS4gKEUga2FyY2hpIHBvciBoYcOxYSB1biBpbcOhZ2VuIGt1L8OyZiB1biB0ZWtzdG8pIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIktvbnRlc3RhIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIkUga29udGVzdGEgb3BzaG9uYWwgKHNvbHVzaG9uKSByaWJhIGUgcGFydGkgcGF0cmFzIGRpIGUga2FyY2hpLiBVc2EgZSBzw61tYnVsbyB8IHBhIGR1bmEgc29sdXNob24gYWx0ZXJuYXRpdm8uIFVzYSBcXHwgc2kgdW4gc29sdXNob24gbWVzdGVyIHRpbiB1biB8LiIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJJbcOhZ2VuIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIkUgaW3DoWdlbiBvcHNob25hbCByaWJhIGUgcGFydGkgZGlsYW50aSBkaSBlIGthcmNoaS4gKEUga2FyY2hpIHBvciBoYcOxYSB1biBpbcOhZ2VuIGt1L8OyZiB1biB0ZWtzdG8pLiIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJUZWtzdG8gYWx0ZXJuYXRpdm8gcGEga3UgZSBpbcOhZ2VuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlRlcCIsCiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlRla3N0byBwYSB0ZXAiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3RvIGRpIHByb2dyZXNvIiwKICAgICAgImRlZmF1bHQiOiAiS2FyY2hpIEBjYXJkIGRpIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZWtzdG8gZGkgcHJvZ3Jlc28sIHZhcmlhYmVsIGRpc3BvbmliZWw6IEBjYXJkIGt1IEB0b3RhbC4gRWjDqG1wZWw6ICdLYXJjaGkgQGNhcmQgZGkgQHRvdGFsJyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdG8gcGEgXCJTaWd1aWVudGVcIi1ib3RvbiIsCiAgICAgICJkZWZhdWx0IjogIlNpZ3VpZW50ZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdG8gcGEgXCJBbnRlcmlvclwiLWJvdG9uIiwKICAgICAgImRlZmF1bHQiOiAiQW50ZXJpb3IiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3RvIHBhIFwiS29udHJvbMOhXCItYm90b24iLAogICAgICAiZGVmYXVsdCI6ICJLb250cm9sw6EiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWVzdGVyIHllbmEgdW4ga29udGVzdGEgcHJvbcOpIGt1IHBvciBhIHdhayBlIHNvbHVzaG9uIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0byBwYSBrdSBlIGtvbnRlc3RhIiwKICAgICAgImRlZmF1bHQiOiAiQm8ga29udGVzdGEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3RvIHBhIGt1IGUga29udGVzdGEga29yZWt0byIsCiAgICAgICJkZWZhdWx0IjogIktvcmVrdG8iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3RvIHBhIGt1IGUga29udGVzdGEgcm9iZXMiLAogICAgICAiZGVmYXVsdCI6ICJSb2JlcyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJNdXN0cmEgZSBzb2x1c2hvbiIsCiAgICAgICJkZWZhdWx0IjogIktvbnRlc3RhIGtvcmVrdG8iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGl0dWxvIHBhIGUgcmVzdWx0YWRvbmFuIiwKICAgICAgImRlZmF1bHQiOiAiUmVzdWx0YWRvIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0byBwYSBlIGthbnRpZGF0IGt1IHRhIGtvcmVrdG8iLAogICAgICAiZGVmYXVsdCI6ICJAc2NvcmUgZGkgQHRvdGFsIGtvcmVrdG8iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGVrc3RvIGRpIHJlc3VsdGFkbywgdmFyaWFiZWwgZGlzcG9uaWJlbDogQHNjb3JlIGt1IEB0b3RhbC4gRWjDqG1wZWw6ICdAc2NvcmUgZGkgQHRvdGFsIGtvcmVrdG8nIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0byBwYSBtdXN0cmEgZSByZXN1bHRhZG8iLAogICAgICAiZGVmYXVsdCI6ICJNdXN0cmEgcmVzdWx0YWRvIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0byBwYSB1biBrb250ZXN0YSBrw7JydGlrdSIsCiAgICAgICJkZWZhdWx0IjogIkE6IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0byBwYSBcIlB1cmJhIGRpIG5vYm9cIi1ib3RvbiIsCiAgICAgICJkZWZhdWx0IjogIlB1cmJhIGRpIG5vYm8iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiSG9vZmRsZXR0ZXJnZXZvZWxpZyIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJFIGtvbnRlc3RhIG1lc3RlciB0YSBla3Nha3RhbWVudGUga29uZm9ybWUgZSBzb2x1c2hvbi4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3RvIHBhIHJvYmVzIiwKICAgICAgImRlZmF1bHQiOiAiS29udGVzdGEgcm9iZXMuIEUga29udGVzdGEga29yZWt0byB0YWJhdGEgQGFuc3dlciIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcy4gVXNlIEBhbnN3ZXIgYXMgdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkZlZWRiYWNrIHRla3N0byIsCiAgICAgICJkZWZhdWx0IjogIkBhbnN3ZXIgdGEga29yZWt0by4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMgd2hlbiBhIGNhcmQgaXMgYW5zd2VyZWQgY29ycmVjdGx5LiBVc2UgQGFuc3dlciBhcyB2YXJpYWJsZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiS2FtYmlhIGthcmNoaSB2b29yIG9uZGVyc3RldW5lbmRlIHRlY2hub2xvZ2llw6tuIiwKICAgICAgImRlZmF1bHQiOiAiUMOhZ2luYSBAY3VycmVudCBkaSBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMgd2hlbiBuYXZpZ2F0aW5nIGJldHdlZW4gY2FyZHMuIFVzZSBAY3VycmVudCBhbmQgQHRvdGFsIGFzIHZhcmlhYmxlcy4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiS2FyY2hpbmFuIGRlbiBzZWt1ZW5zaWEgYWxlYXRvcmlvIiwKICAgICAgImRlc2NyaXB0aW9uIjogIk11c3RyYSBlIGthcmNoaW5hbiBkZW4gc2VrdWVuc2lhIGFsZWF0b3Jpby4iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Flashcards-1.7\/language\/pl.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJPcGlzIHphZGFuaWEiCiAgICB9LAogICAgewogICAgICAid2lkZ2V0cyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiRG9tecWbbG55IgogICAgICAgIH0KICAgICAgXSwKICAgICAgImxhYmVsIjogIkthcnR5IiwKICAgICAgImVudGl0eSI6ICJrYXJ0YSIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAibGFiZWwiOiAiS2FydGEiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJQeXRhbmllIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9wY2pvbmFsbmUgcHl0YW5pZSBrb250ZWtzdG93ZSBkbyBrYXJ0eS4gKEthcnRhIG1vxbxlIHphd2llcmHEhyBzYW0gb2JyYXosIHNhbSB0ZWtzdCBsdWIgamVkbm8gaSBkcnVnaWUpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIk9kcG93aWVkxboiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiT2Rwb3dpZWTFuiAocm96d2nEhXphbmllKSBkbGEga2FydHkuIFXFvHlqIHN5bWJvbHUgfCBhYnkgcG9kemllbGnEhyBhbHRlcm5hdHl3bmUgcm96d2nEhXphbmlhLiBVxbx5aiBcXHwgamXFm2xpIHJvendpxIV6YW5pZSB6YXdpZXJhIHwuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIk9icmF6IiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9wY2pvbmFsbnkgb2JyYXogZGxhIGthcnR5LiAoS2FydGEgbW\/FvGUgemF3aWVyYcSHIHNhbSBvYnJheiwgc2FtIHRla3N0IGx1YiBqZWRubyBpIGRydWdpZSkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiVGVrc3QgYWx0ZXJuYXR5d255IGRvIGdyYWZpa2kiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiUG9kcG93aWVkxboiLAogICAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJUZWtzdCBwb2Rwb3dpZWR6aSIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdCBwb3N0xJlwdSIsCiAgICAgICJkZWZhdWx0IjogIkthcnRhIEBjYXJkIHogQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRla3N0IHBvc3TEmXB1LCBkb3N0xJlwbmUgem1pZW5uZTogQGNhcmQgaSBAdG90YWwuIFByenlrxYJhZDogJ0thcnRhIEBjYXJkIHogQHRvdGFsJyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdCBwcnp5Y2lza3UgRGFsZWoiLAogICAgICAiZGVmYXVsdCI6ICJEYWxlaiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdCBwcnp5Y2lza3UgV3N0ZWN6IiwKICAgICAgImRlZmF1bHQiOiAiV3N0ZWN6IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0IHByenljaXNrdSBTcHJhd2TFuiBvZHBvd2llZHppIiwKICAgICAgImRlZmF1bHQiOiAiU3ByYXdkxboiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiV3ltYWdhaiB3cGlzYW5pYSBvZHBvd2llZHppIHByemV6IHXFvHl0a293bmlrYSBwcnplZCB3ecWbd2lldGxlbmllbSBvZHBvd2llZHppIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0IHBvbGEgd3Bpc3l3YW5pYSBvZHBvd2llZHppIiwKICAgICAgImRlZmF1bHQiOiAiVHdvamEgb2Rwb3dpZWTFuiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdCBkbGEgcHJhd2lkxYJvd2VqIG9kcG93aWVkemkiLAogICAgICAiZGVmYXVsdCI6ICJQcmF3aWTFgm93YSBvZHBvd2llZMW6IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0IGRsYSBuaWVwcmF3aWTFgm93ZWogb2Rwb3dpZWR6aSIsCiAgICAgICJkZWZhdWx0IjogIkLFgsSZZG5hIG9kcG93aWVkxboiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUG9rYcW8IHRla3N0IHJvendpxIV6YW5pYSIsCiAgICAgICJkZWZhdWx0IjogIlByYXdpZMWCb3dhIG9kcG93aWVkxbovIG9kcG93aWVkemkiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3QgdHl0dcWCdSB3eW5pa8OzdyIsCiAgICAgICJkZWZhdWx0IjogIld5bmlraSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdCBsaWN6YnkgcG9wcmF3bnljaCBvZHBvd2llZHppIiwKICAgICAgImRlZmF1bHQiOiAiQHNjb3JlIGEgQHRvdGFsIHByYXdpZMWCb3d5Y2giLAogICAgICAiZGVzY3JpcHRpb24iOiAiV3luaWssIGRvc3TEmXBuZSB6bWllbm5lOiBAc2NvcmUgaSBAdG90YWwuIFByenlrxYJhZDogJ0BzY29yZSB6IEB0b3RhbCBjb3JyZWN0JyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdCBkbyBwb2themFuaWEgd3luaWvDs3ciLAogICAgICAiZGVmYXVsdCI6ICJQb2thxbwgd3luaWtpIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0IGRvIGV0eWtpZXR5IGtyw7N0a2llaiBvZHBvd2llZHppIiwKICAgICAgImRlZmF1bHQiOiAiQToiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3QgcHJ6eWNpc2t1IFwiSmVzemN6ZSByYXpcIiIsCiAgICAgICJkZWZhdWx0IjogIkplc3pjemUgcmF6IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlV3emdsxJlkbmlhIHdpZWxrb8WbxIcgbGl0ZXIiLAogICAgICAiZGVzY3JpcHRpb24iOiAiR3dhcmFudHVqZSwgxbxlIGRhbmUgd3Byb3dhZHpvbmUgcHJ6ZXogdcW8eXRrb3duaWthIHPEhSBkb2vFgmFkbmllIHRha2llIHNhbWUgamFrIG9kcG93aWVkxbouIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0IG5pZXByYXdpZMWCb3d5IGRsYSB0ZWNobm9sb2dpaSB3c3BvbWFnYWrEhWN5Y2giLAogICAgICAiZGVmYXVsdCI6ICJOaWVwcmF3aWTFgm93YSBvZHBvd2llZMW6LiBQcmF3aWTFgm93YSBvZHBvd2llZMW6IHRvIEBhbnN3ZXIiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGVrc3QgZGxhIHRlY2hub2xvZ2lpIHdzcG9tYWdhasSFY3ljaC4gVcW8eWogQGFuc3dlciBqYWtvIHptaWVubmVqLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJQcmF3aWTFgm93YSBpbmZvcm1hY2phIHp3cm90bmEgZGxhIHRlY2hub2xvZ2lpIHdzcG9tYWdhasSFY3ljaCIsCiAgICAgICJkZWZhdWx0IjogIkBhbnN3ZXIgamVzdCBwcmF3aWTFgm93YS4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGVrc3QgZGxhIHRlY2hub2xvZ2lpIHdzcG9tYWdhasSFY3ljaCBraWVkeSBrYXJ0YSBvdHJ6eW1hxYJhIHBvcHJhd27EhSBvZHBvd2llZMW6LiBVxbx5aiBAYW5zd2VyIGpha28gem1pZW5uZWouIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlptaWFuYSBrYXJ0eSBkbGEgdGVjaG5vbG9naWkgd3Nwb21hZ2FqxIVjeWNoIiwKICAgICAgImRlZmF1bHQiOiAiU3Ryb25hIEBjdXJyZW50IHogQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRla3N0IGRsYSB0ZWNobm9sb2dpaSB3c3BvbWFnYWrEhWN5Y2ggcG9kY3phcyBuYXdpZ2FjamkgbWnEmWR6eSBrYXJ0YW1pLiBVxbx5aiBAY3VycmVudCBpIEB0b3RhbCBqYWtvIHptaWVubnljaC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiS2FydHkgdyBwcnp5cGFka293ZWoga29sZWpub8WbY2kiLAogICAgICAiZGVzY3JpcHRpb24iOiAiV8WCxIVjeiBhYnkgd3nFm3dpZXRsYcSHIGthcnR5IHcgcHJ6eXBhZGtvd2VqIGtvbGVqbm\/Fm2NpLiIKICAgIH0KICBdCn0K"],"libraries\/H5P.Flashcards-1.7\/language\/pt-br.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZXNjcmnDp8OjbyBkYSB0YXJlZmEiCiAgICB9LAogICAgewogICAgICAid2lkZ2V0cyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiUGFkcsOjbyIKICAgICAgICB9CiAgICAgIF0sCiAgICAgICJsYWJlbCI6ICJDYXJ0w7VlcyIsCiAgICAgICJlbnRpdHkiOiAiY2FydMOjbyIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAibGFiZWwiOiAiQ2FydMOjbyIsCiAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlF1ZXN0w6NvIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIlF1ZXN0w6NvIHRleHR1YWwgb3BjaW9uYWwgcGFyYSBvIGNhcnTDo28uIChPIGNhcnTDo28gcG9kZSB1c2FyIGFwZW5hcyB1bWEgaW1hZ2VtLCBhcGVuYXMgdW0gdGV4dG8gb3UgYW1ib3MpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlJlc3Bvc3RhIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIlJlc3Bvc3RhIChzb2x1w6fDo28pIG9wY2lvbmFsIHBhcmEgbyBjYXJ0w6NvLiBVc2UgYSBwaXBlIHN5bWJvbCB8IHRvIHNwbGl0IGFsdGVybmF0aXZlIHNvbHV0aW9ucy4gVXNlIFxcfCBpZiBhIHNvbHV0aW9uIHNob3VsZCBjb250YWluIGEgfC4iCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiSW1hZ2VtIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIkltYWdlbSBvcGNpb25hbCBwYXJhIG8gY2FydMOjby4gKE8gY2FydMOjbyBwb2RlIHVzYXIgYXBlbmFzIHVtYSBpbWFnZW0sIGFwZW5hcyB1bSB0ZXh0byBvdSBhbWJvcykiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiVGV4dG8gYWx0ZXJuYXRpdm8gcGFyYSBhIGltYWdlbSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJEaWNhIiwKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiVGV4dG8gZGEgZGljYSIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBkbyBwcm9ncmVzc28iLAogICAgICAiZGVmYXVsdCI6ICJDYXJ0w6NvIEBjYXJkIGRlIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0byBkZSBwcm9ncmVzc28sIHZhcmnDoXZlaXMgZGlzcG9uw612ZWlzOiBAY2FyZCBlIEB0b3RhbC4gRXhlbXBsbzogJ0NhcnTDo28gQGNhcmQgZGUgQHRvdGFsJyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIG8gYm90w6NvIFByw7N4aW1vIiwKICAgICAgImRlZmF1bHQiOiAiUHLDs3hpbW8iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSBvIGJvdMOjbyBBbnRlcmlvciIsCiAgICAgICJkZWZhdWx0IjogIkFudGVyaW9yIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgbyBib3TDo28gVmVyaWZpY2FyIiwKICAgICAgImRlZmF1bHQiOiAiVmVyaWZpY2FyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlJlcXVlciByZXNwb3N0YSBkbyB1c3XDoXJpbyBhbnRlcyBkYSBzb2x1w6fDo28gcG9kZXIgc2VyIHZpc3VhbGl6YWRhIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgbyBjYW1wbyBkZSBpbnNlcmlyIHJlc3Bvc3RhIiwKICAgICAgImRlZmF1bHQiOiAiU3VhIHJlc3Bvc3RhIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgcmVzcG9zdGEgY29ycmV0YSIsCiAgICAgICJkZWZhdWx0IjogIkNvcnJldG8iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSByZXNwb3N0YSBpbmNvcnJldGEiLAogICAgICAiZGVmYXVsdCI6ICJJbmNvcnJldG8iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gZGUgbW9zdHJhciBzb2x1w6fDo28iLAogICAgICAiZGVmYXVsdCI6ICJSZXNwb3N0YSBjb3JyZXRhIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIGRvIHTDrXR1bG8gZGUgcmVzdWx0YWRvcyIsCiAgICAgICJkZWZhdWx0IjogIlJlc3VsdGFkb3MiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSBvIG7Dum1lcm8gZGUgY29ycmV0b3MiLAogICAgICAiZGVmYXVsdCI6ICJAc2NvcmUgZGUgQHRvdGFsIGNvcnJldG9zIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHRvIGRlIHJlc3VsdGFkbywgdmFyacOhdmVpcyBkaXNwb27DrXZlaXM6IEBzY29yZSBlIEB0b3RhbC4gRXhlbXBsbzogJ0BzY29yZSBkZSBAdG90YWwgY29ycmV0b3MnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgbW9zdHJhciByZXN1bHRhZG9zIiwKICAgICAgImRlZmF1bHQiOiAiTW9zdHJhciByZXN1bHRhZG9zIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgcsOzdHVsbyBkZSByZXNwb3N0YSBjdXJ0YSIsCiAgICAgICJkZWZhdWx0IjogIlI6IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgbyBib3TDo28gXCJUZW50YXIgTm92YW1lbnRlXCIiLAogICAgICAiZGVmYXVsdCI6ICJUZW50YXIgTm92YW1lbnRlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkRpZmVyZW5jaWFyIG1hacO6c2N1bGFzIGUgbWluw7pzY3VsYXMiLAogICAgICAiZGVzY3JpcHRpb24iOiAiQXNzZWd1cmEgcXVlIG8gdXN1w6FyaW8gZGlnaXRlIGEgcGFsYXZyYS9mcmFzZSBleGF0YW1lbnRlIGlndWFsIMOgIHJlc3Bvc3RhLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBpbmNvcnJldG8gcGFyYSB0ZWNub2xvZ2lhcyBkZSBhc3Npc3TDqm5jaWEiLAogICAgICAiZGVmYXVsdCI6ICJSZXNwb3N0YSBpbmNvcnJldGEuIEEgcmVzcG9zdGEgY29ycmV0YSBmb2kgQGFuc3dlciIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0byBxdWUgc2Vyw6EgYW51bmNpYWRvIHBhcmEgYXMgdGVjbm9sb2dpYXMgZGUgYXNzaXN0w6puY2lhLiBVc2UgQGFuc3dlciBjb21vIHZhcmnDoXZlbC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gZGUgZmVlZGJhY2sgY29ycmV0byBwYXJhIHRlY25vbG9naWFzIGRlIGFzc2lzdMOqbmNpYSIsCiAgICAgICJkZWZhdWx0IjogIkBhbnN3ZXIgZXN0w6EgY29ycmV0YS4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dG8gcXVlIHNlcsOhIGFudW5jaWFkbyDDoHMgdGVjbm9sb2dpYXMgZGUgYXNzaXN0w6puY2lhIHF1YW5kbyB1bSBjYXJ0w6NvIGZvciByZXNwb25kaWRvIGNvcnJldGFtZW50ZS4gVXNlIEBhbnN3ZXIgY29tbyB2YXJpw6F2ZWwuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRyb2NhIGRlIGNhcnTDtWVzIHBhcmEgdGVjbm9sb2dpYXMgZGUgYXNzaXN0w6puY2lhIiwKICAgICAgImRlZmF1bHQiOiAiUMOhZ2luYSBAY3VycmVudCBkZSBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dG8gcXVlIHNlcsOhIGFudW5jaWFkbyBwYXJhIGFzIHRlY25vbG9naWFzIGRlIGFzc2lzdMOqbmNpYSBuYSBuYXZlZ2HDp8OjbyBlbnRyZSBjYXJ0w7Vlcy4gVXNlIEBjdXJyZW50IGUgQHRvdGFsIGNvbW8gdmFyacOhdmVpcy4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQWxlYXRvcml6YXIgY2FydMO1ZXMiLAogICAgICAiZGVzY3JpcHRpb24iOiAiSGFiaWxpdGUgcGFyYSBhbGVhdG9yaXphciBhIG9yZGVtIGVtIHF1ZSBvcyBjYXJ0w7VlcyBzw6NvIGV4aWJpZG9zLiIKICAgIH0KICBdCn0K"],"libraries\/H5P.Flashcards-1.7\/language\/pt.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZXNjcmnDp8OjbyBkYSB0YXJlZmEiCiAgICB9LAogICAgewogICAgICAid2lkZ2V0cyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiUGFkcsOjbyIKICAgICAgICB9CiAgICAgIF0sCiAgICAgICJsYWJlbCI6ICJDYXJ0w7VlcyIsCiAgICAgICJlbnRpdHkiOiAiY2FydMOjbyIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAibGFiZWwiOiAiQ2FydMOjbyIsCiAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlF1ZXN0aW9uIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIlBlcmd1bnRhIHRleHR1YWwgb3BjaW9uYWwgcGFyYSBvIGNhcnTDo28uIChPIGNhcnTDo28gcG9kZSB1dGlsaXphciBhcGVuYXMgdW1hIGltYWdlbSwgYXBlbmFzIHVtIHRleHRvIG91IGFtYm9zKSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJSZXNwb3N0YSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcHRpb25hbCBhbnN3ZXIoc29sdXRpb24pIGZvciB0aGUgY2FyZC4gVXNlIGEgcGlwZSBzeW1ib2wgfCB0byBzcGxpdCBhbHRlcm5hdGl2ZSBzb2x1dGlvbnMuIFVzZSBcXHwgaWYgYSBzb2x1dGlvbiBzaG91bGQgY29udGFpbiBhIHwuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkltYWdlIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIkltYWdlbSBvcGNpb25hbCBwYXJhIG8gY2FydMOjby4gKE8gY2FydMOjbyBwb2RlIHV0aWxpemFyIGFwZW5hcyB1bWEgaW1hZ2VtLCBhcGVuYXMgdW0gdGV4dG8gb3UgYW1ib3MpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlRleHRvIGFsdGVybmF0aXZvIHBhcmEgaW1hZ2VtIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlRpcCIsCiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlRpcCB0ZXh0IgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlByb2dyZXNzIHRleHQiLAogICAgICAiZGVmYXVsdCI6ICJDYXJ0w6NvIEBjYXJkIGRlIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0byBkZSBwcm9ncmVzc28sIHZhcmnDoXZlaXMgZGlzcG9uw612ZWlzOiBAY2FyZCBlIEB0b3RhbC4gRXhlbXBsbzogJ0NhcnTDo28gQGNhcmQgZGUgQHRvdGFsJy4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSBvIGJvdMOjbyBzZWd1aW50ZSIsCiAgICAgICJkZWZhdWx0IjogIk5leHQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSBvIGJvdMOjbyBhbnRlcmlvciIsCiAgICAgICJkZWZhdWx0IjogIkFudGVyaW9yIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgbyBib3TDo28gZGUgdmVyaWZpY2HDp8OjbyBkZSByZXNwb3N0YXMiLAogICAgICAiZGVmYXVsdCI6ICJWZXJpZmlxdWUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRXhpZ2lyIGEgZW50cmFkYSBkbyB1c3XDoXJpbyBhbnRlcyBxdWUgYSBzb2x1w6fDo28gcG9zc2Egc2VyIHZpc3VhbGl6YWRhIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgbyBjYW1wbyBkZSBlbnRyYWRhIGRlIHJlc3Bvc3RhcyIsCiAgICAgICJkZWZhdWx0IjogIlN1YSByZXNwb3N0YSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIGEgcmVzcG9zdGEgY29ycmV0YSIsCiAgICAgICJkZWZhdWx0IjogIkNvcnJldG8iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSByZXNwb3N0YSBpbmNvcnJldGEiLAogICAgICAiZGVmYXVsdCI6ICJJbmNvcnJldG8iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTW9zdHJhciB0ZXh0byBkYSBzb2x1w6fDo28iLAogICAgICAiZGVmYXVsdCI6ICJSZXNwb3N0YSBjb3JyZWN0YSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIHTDrXR1bG8gZGUgcmVzdWx0YWRvcyIsCiAgICAgICJkZWZhdWx0IjogIlJlc3VsdGFkb3MiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSBvIG7Dum1lcm8gZGUgY29ycmV0b3MiLAogICAgICAiZGVmYXVsdCI6ICJAc2NvcmUgZGUgQHRvdGFsIGNvcnJldG9zIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHRvIGRvIHJlc3VsdGFkbywgdmFyacOhdmVpcyBkaXNwb27DrXZlaXM6IEBzY29yZSBlIEB0b3RhbC4gRXhlbXBsbzogJ0BzY29yZSBkZSBAdG90YWwgY29ycmV0bycuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgbW9zdHJhciByZXN1bHRhZG9zIiwKICAgICAgImRlZmF1bHQiOiAiTW9zdHJhciByZXN1bHRhZG9zIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgZXRpcXVldGEgZGUgcmVzcG9zdGEgY3VydGEiLAogICAgICAiZGVmYXVsdCI6ICJBOiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIGJvdMOjbyBkZSBcInJlcGV0aXJcIiIsCiAgICAgICJkZWZhdWx0IjogIlJlcGV0aXIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRGlmZXJlbmNpYXIgbWFpw7pzY3VsYXMgZGUgbWluw7pzY3VsYXMiLAogICAgICAiZGVzY3JpcHRpb24iOiAiR2FyYW50ZSBxdWUgbyB1dGlsaXphZG9yIGRpZ2l0YSBvIHRleHRvIGV4YXRhbWVudGUgaWd1YWwgw6AgcmVzcG9zdGEuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIGluY29ycmV0byBwYXJhIHRlY25vbG9naWFzIGRlIGFzc2lzdMOqbmNpYSIsCiAgICAgICJkZWZhdWx0IjogIlJlc3Bvc3RhIGluY29ycmV0YS4gQSByZXNwb3N0YSBjb3JyZXRhIGZvaSBAYW5zd2VyIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHRvIHF1ZSBzZXLDoSBhbnVuY2lhZG8gcGFyYSBhcyB0ZWNub2xvZ2lhcyBkZSBhc3Npc3TDqm5jaWEuIFVzZSBAYW5zd2VyIGNvbW8gdmFyacOhdmVsLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBkZSBmZWVkYmFjayBjb3JyZXRvIHBhcmEgdGVjbm9sb2dpYXMgZGUgYXNzaXN0w6puY2lhIiwKICAgICAgImRlZmF1bHQiOiAiQGFuc3dlciBlc3TDoSBjb3JyZXRhLiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0byBxdWUgc2Vyw6EgYW51bmNpYWRvIMOgcyB0ZWNub2xvZ2lhcyBkZSBhc3Npc3TDqm5jaWEgcXVhbmRvIHVtIGNhcnTDo28gZm9yIHJlc3BvbmRpZG8gY29ycmV0YW1lbnRlLiBVc2UgQGFuc3dlciBjb21vIHZhcmnDoXZlbC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTXVkYW7Dp2EgZGUgY2FydMOjbyBwYXJhIHRlY25vbG9naWFzIGRlIGFzc2lzdMOqbmNpYSIsCiAgICAgICJkZWZhdWx0IjogIlDDoWdpbmEgQGN1cnJlbnQgZGUgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHRvIHF1ZSBzZXLDoSBhbnVuY2lhZG8gw6BzIHRlY25vbG9naWFzIGRlIGFzc2lzdMOqbmNpYSBuYSBuYXZlZ2HDp8OjbyBlbnRyZSBjYXJ0w7Vlcy4gVXRpbGl6YXIgQGN1cnJlbnQgZSBAdG90YWwgY29tbyB2YXJpw6F2ZWlzLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJBbGVhdG9yaXphciBjYXJ0w7VlcyIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJIYWJpbGl0ZSBwYXJhIGFsZWF0b3JpemFyIGEgb3JkZW0gZW0gcXVlIG9zIGNhcnTDtWVzIHPDo28gZXhpYmlkb3MuIgogICAgfQogIF0KfQo="],"libraries\/H5P.Flashcards-1.7\/language\/ro.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJUYXNrIGRlc2NyaXB0aW9uIgogICAgfSwKICAgIHsKICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkRlZmF1bHQiCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiQ2FyZHMiLAogICAgICAiZW50aXR5IjogImNhcmQiLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImxhYmVsIjogIkNhcmQiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJRdWVzdGlvbiIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcHRpb25hbCB0ZXh0dWFsIHF1ZXN0aW9uIGZvciB0aGUgY2FyZC4gKFRoZSBjYXJkIG1heSB1c2UganVzdCBhbiBpbWFnZSwganVzdCBhIHRleHQgb3IgYm90aCkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQW5zd2VyIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIkFuc3dlciAoc29sdXRpb24pIGZvciB0aGUgY2FyZC4gVXNlIGEgcGlwZSBzeW1ib2wgfCB0byBzcGxpdCBhbHRlcm5hdGl2ZSBzb2x1dGlvbnMuIFVzZSBcXHwgaWYgYSBzb2x1dGlvbiBzaG91bGQgY29udGFpbiBhIHwuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkltYWdlIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9wdGlvbmFsIGltYWdlIGZvciB0aGUgY2FyZC4gKFRoZSBjYXJkIG1heSB1c2UganVzdCBhbiBpbWFnZSwganVzdCBhIHRleHQgb3IgYm90aCkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQWx0ZXJuYXRpdmUgdGV4dCBmb3IgaW1hZ2UiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiVGlwIiwKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiVGlwIHRleHQiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUHJvZ3Jlc3MgdGV4dCIsCiAgICAgICJkZWZhdWx0IjogIkNhcmQgQGNhcmQgb2YgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlByb2dyZXNzIHRleHQsIHZhcmlhYmxlcyBhdmFpbGFibGU6IEBjYXJkIGFuZCBAdG90YWwuIEV4YW1wbGU6ICdDYXJkIEBjYXJkIG9mIEB0b3RhbCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIG5leHQgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiTmV4dCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciB0aGUgcHJldmlvdXMgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiUHJldmlvdXMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIGNoZWNrIGFuc3dlcnMgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiQ2hlY2siCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUmVxdWlyZSB1c2VyIGlucHV0IGJlZm9yZSB0aGUgc29sdXRpb24gY2FuIGJlIHZpZXdlZCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciB0aGUgYW5zd2VyIGlucHV0IGZpZWxkIiwKICAgICAgImRlZmF1bHQiOiAiWW91ciBhbnN3ZXIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgY29ycmVjdCBhbnN3ZXIiLAogICAgICAiZGVmYXVsdCI6ICJDb3JyZWN0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIGluY29ycmVjdCBhbnN3ZXIiLAogICAgICAiZGVmYXVsdCI6ICJJbmNvcnJlY3QiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiU2hvdyBzb2x1dGlvbiB0ZXh0IiwKICAgICAgImRlZmF1bHQiOiAiQ29ycmVjdCBhbnN3ZXIocykiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgcmVzdWx0cyB0aXRsZSIsCiAgICAgICJkZWZhdWx0IjogIlJlc3VsdHMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgbnVtYmVyIG9mIGNvcnJlY3QiLAogICAgICAiZGVmYXVsdCI6ICJAc2NvcmUgb2YgQHRvdGFsIGNvcnJlY3QiLAogICAgICAiZGVzY3JpcHRpb24iOiAiUmVzdWx0IHRleHQsIHZhcmlhYmxlcyBhdmFpbGFibGU6IEBzY29yZSBhbmQgQHRvdGFsLiBFeGFtcGxlOiAnQHNjb3JlIG9mIEB0b3RhbCBjb3JyZWN0JyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBzaG93IHJlc3VsdHMiLAogICAgICAiZGVmYXVsdCI6ICJTaG93IHJlc3VsdHMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3Igc2hvcnQgYW5zd2VyIGxhYmVsIiwKICAgICAgImRlZmF1bHQiOiAiQToiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJyZXRyeVwiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlJldHJ5IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNhc2Ugc2Vuc2l0aXZlIiwKICAgICAgImRlc2NyaXB0aW9uIjogIk1ha2VzIHN1cmUgdGhlIHVzZXIgaW5wdXQgaGFzIHRvIGJlIGV4YWN0bHkgdGhlIHNhbWUgYXMgdGhlIGFuc3dlci4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiSW5jb3JyZWN0IHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJJbmNvcnJlY3QgYW5zd2VyLiBDb3JyZWN0IGFuc3dlciB3YXMgQGFuc3dlciIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcy4gVXNlIEBhbnN3ZXIgYXMgdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNvcnJlY3QgZmVlZGJhY2sgdGV4dCBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIkBhbnN3ZXIgaXMgY29ycmVjdC4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMgd2hlbiBhIGNhcmQgaXMgYW5zd2VyZWQgY29ycmVjdGx5LiBVc2UgQGFuc3dlciBhcyB2YXJpYWJsZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2FyZCBjaGFuZ2UgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJQYWdlIEBjdXJyZW50IG9mIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcyB3aGVuIG5hdmlnYXRpbmcgYmV0d2VlbiBjYXJkcy4gVXNlIEBjdXJyZW50IGFuZCBAdG90YWwgYXMgdmFyaWFibGVzLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJSYW5kb21pemUgY2FyZHMiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRW5hYmxlIHRvIHJhbmRvbWl6ZSB0aGUgb3JkZXIgb2YgY2FyZHMgb24gZGlzcGxheS4iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Flashcards-1.7\/language\/ru.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLQntC\/0LjRgdCw0L3QuNC1INC30LDQtNCw0YfQuCIKICAgIH0sCiAgICB7CiAgICAgICJ3aWRnZXRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICLQn9C+INGD0LzQvtC70YfQsNC90LjRjiIKICAgICAgICB9CiAgICAgIF0sCiAgICAgICJsYWJlbCI6ICLQmtCw0YDRgtC+0YfQutC4IiwKICAgICAgImVudGl0eSI6ICLQutCw0YDRgtC+0YfQutCwIiwKICAgICAgImZpZWxkIjogewogICAgICAgICJsYWJlbCI6ICLQmtCw0YDRgtC+0YfQutCwIiwKICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAi0JLQvtC\/0YDQvtGBIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogItCd0LXQvtCx0Y\/Qt9Cw0YLQtdC70YzQvdGL0Lkg0LLQvtC\/0YDQvtGBINC00LvRjyDQutCw0YDRgtC+0YfQutC4LiAo0JzQvtC20L3QviDQuNGB0L\/QvtC70YzQt9C+0LLQsNGC0Ywg0YLQvtC70YzQutC+INC40LfQvtCx0YDQsNC20LXQvdC40LUsINGC0L7Qu9GM0LrQviDRgtC10LrRgdGCINC40LvQuCDQvtCx0LAg0L7QtNC90L7QstGA0LXQvNC10L3QvdC+KSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICLQntGC0LLQtdGCIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogItCe0YLQstC10YIg0LjQu9C4INGA0LXRiNC10L3QuNC1INC00LvRjyDQutCw0YDRgtC+0YfQutC4LiBVc2UgYSBwaXBlIHN5bWJvbCB8IHRvIHNwbGl0IGFsdGVybmF0aXZlIHNvbHV0aW9ucy4gVXNlIFxcfCBpZiBhIHNvbHV0aW9uIHNob3VsZCBjb250YWluIGEgfC4iCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAi0JjQt9C+0LHRgNCw0LbQtdC90LjQtSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICLQndC10L7QsdGP0LfQsNGC0LXQu9GM0L3QvtC1INC40LfQvtCx0YDQsNC20LXQvdC40LUg0LTQu9GPINC60LDRgNGC0L7Rh9C60LguICjQnNC+0LbQvdC+INC40YHQv9C+0LvRjNC30L7QstCw0YLRjCDRgtC+0LvRjNC60L4g0LjQt9C+0LHRgNCw0LbQtdC90LjQtSwg0YLQvtC70YzQutC+INGC0LXQutGB0YIg0LjQu9C4INC+0LHQsCDQvtC00L3QvtCy0YDQtdC80LXQvdC90L4pIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogItCQ0LvRjNGC0LXRgNC90LDRgtC40LLQvdGL0Lkg0YLQtdC60YHRgiDQstC80LXRgdGC0L4g0LjQt9C+0LHRgNCw0LbQtdC90LjRjyIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICLQn9C+0LTRgdC60LDQt9C60LAiLAogICAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC\/0L7QtNGB0LrQsNC30LrQuCIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC\/0YDQvtCz0YDQtdGB0YHQsCIsCiAgICAgICJkZWZhdWx0IjogItCa0LDRgNGC0L7Rh9C60LAgQGNhcmQg0LjRhSBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAi0KLQtdC60YHRgiDQv9GA0L7Qs9GA0LXRgdGB0LAsINC00L7RgdGC0YPQv9C90YvQtSDQv9C10YDQtdC80LXQvdC90YvQtTogQGNhcmQg0LggQHRvdGFsLiDQn9GA0LjQvNC10YA6ICfQmtCw0YDRgtC+0YfQutCwIEBjYXJkINC40LcgQHRvdGFsJyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC00LvRjyDQutC90L7Qv9C60Lgg0JTQsNC70YzRiNC1IiwKICAgICAgImRlZmF1bHQiOiAi0JTQsNC70YzRiNC1IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0LXQutGB0YIg0LTQu9GPINC60L3QvtC\/0LrQuCDQndCw0LfQsNC0IiwKICAgICAgImRlZmF1bHQiOiAi0J3QsNC30LDQtCAiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQtNC70Y8g0LrQvdC+0L\/QutC4INCf0YDQvtCy0LXRgNC40YLRjCDRgNC10YjQtdC90LjQtSIsCiAgICAgICJkZWZhdWx0IjogItCf0YDQvtCy0LXRgNC40YLRjCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotGA0LXQsdC+0LLQsNGC0Ywg0LLQstC+0LQg0L\/QvtC70YzQt9C+0LLQsNGC0LXQu9GPINC00L4g0YLQvtCz0L4sINC60LDQuiDRgNC10YjQtdC90LjQtSDQvNC+0LbQtdGCINCx0YvRgtGMINC\/0L7QutCw0LfQsNC90L4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQtNC70Y8g0L\/QvtC70Y8g0L7RgtCy0LXRgtCwIiwKICAgICAgImRlZmF1bHQiOiAi0J7RgtCy0LXRgiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC00LvRjyDQv9GA0LDQstC40LvRjNC90L7Qs9C+INC+0YLQstC10YLQsCIsCiAgICAgICJkZWZhdWx0IjogItCf0YDQsNCy0LjQu9GM0L3QviIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC00LvRjyDQvdC10L\/RgNCw0LLQuNC70YzQvdC+0LPQviDQvtGC0LLQtdGC0LAiLAogICAgICAiZGVmYXVsdCI6ICLQndC10L\/RgNCw0LLQuNC70YzQvdC+IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0LXQutGB0YIg0L\/QvtC60LDQt9Cw0YLRjCDRgNC10YjQtdC90LjQtSIsCiAgICAgICJkZWZhdWx0IjogItC\/0L7QutCw0LfQsNGC0Ywg0YDQtdGI0LXQvdC40LUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQtNC70Y8g0LfQsNCz0L7Qu9C+0LLQutCwINGA0LXQt9GD0LvRjNGC0LDRgtC+0LIiLAogICAgICAiZGVmYXVsdCI6ICLQoNC10LfRg9C70YzRgtCw0YIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQtNC70Y8g0LrQvtC70LjRh9C10YHRgtCy0LAg0L\/RgNCw0LLQuNC70YzQvdGL0YUg0L7RgtCy0LXRgtC+0LIiLAogICAgICAiZGVmYXVsdCI6ICLQn9GA0LDQstC40LvRjNC90L4gQHNjb3JlINC40LcgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogItCi0LXQutGB0YIg0YDQtdC30YPQu9GM0YLQsNGC0L7Qsiwg0LTQvtGB0YLRg9C\/0L3Ri9C1INC\/0LXRgNC10LzQtdC90L3Ri9C1OiBAc2NvcmUg0LggQHRvdGFsLiDQn9GA0LjQvNC10YA6ICdAc2NvcmUg0LjQtyBAdG90YWwg0L\/RgNCw0LLQuNC70YzQvdC+JyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC00LvRjyDQvtGC0LrRgNGL0YLQuNGPINGA0LXQt9GD0LvRjNGC0LDRgtC+0LIiLAogICAgICAiZGVmYXVsdCI6ICLQn9C+0LrQsNC30LDRgtGMINGA0LXQt9GD0LvRjNGC0LDRgiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC00LvRjyDRj9GA0LvRi9C60LAg0LrRgNCw0YLQutC+0LPQviDQvtGC0LLQtdGC0LAiLAogICAgICAiZGVmYXVsdCI6ICJBOiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC00LvRjyDQutC90L7Qv9C60LggXCLQv9C+0LLRgtC+0YDQuNGC0YxcIiAiLAogICAgICAiZGVmYXVsdCI6ICLQv9C+0LLRgtC+0YDQuNGC0YwiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KfRg9Cy0YHRgtCy0LjRgtC10LvRjNC90L7RgdGC0YwiLAogICAgICAiZGVzY3JpcHRpb24iOiAi0KLRgNC10LHRg9C10YIsINGH0YLQvtCx0Ysg0LLQstC+0LQg0L\/QvtC70YzQt9C+0LLQsNGC0LXQu9GPINCyINGC0L7Rh9C90L7RgdGC0Lgg0YHQvtCy0L\/QsNC00LDQuyDRgSDQvtGC0LLQtdGC0L7QvC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQvdC10L\/RgNCw0LLQuNC70YzQvdC+0LPQviDQvtGC0LLQtdGC0LAg0LTQu9GPINCw0YHRgdC40YHRgtC40YDRg9GO0YnQuNGFINGC0LXRhdC90L7Qu9C+0LPQuNC4IiwKICAgICAgImRlZmF1bHQiOiAi0J3QtdC\/0YDQsNCy0LjQu9GM0L3Ri9C5INC+0YLQstC10YIuINCf0YDQsNCy0LjQu9GM0L3Ri9C8INC+0YLQstC10YLQvtC8INGP0LLQu9GP0LXRgtGB0Y8gQGFuc3dlciIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLQotC10LrRgdGCLCDQvtCx0YrRj9Cy0LvRj9C10LzRi9C5INCw0YHRgdC40YHRgtC40YDRg9GO0YnQuNC80Lgg0YLQtdGF0L3QvtC70L7Qs9C40Y\/QvNC4LiDQmNGB0L\/QvtC70YzQt9C+0LLQsNGC0YwgQGFuc3dlciDQsiDQutCw0YfQtdGB0YLQstC1INC\/0LXRgNC10LzQtdC90L3QvtC5LiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDb3JyZWN0IGZlZWRiYWNrIHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJAYW5zd2VyIGlzIGNvcnJlY3QuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdGhhdCB3aWxsIGJlIGFubm91bmNlZCB0byBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIHdoZW4gYSBjYXJkIGlzIGFuc3dlcmVkIGNvcnJlY3RseS4gVXNlIEBhbnN3ZXIgYXMgdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCh0LzQtdC90LAg0LrQsNGA0YLQvtGH0LrQuCDQtNC70Y8g0LDRgdGB0LjRgdGC0LjRgNGD0Y7RidC40YUg0YLQtdGF0L3QvtC70L7Qs9C40LgiLAogICAgICAiZGVmYXVsdCI6ICLQmtCw0YDRgtC+0YfQutCwIEBjdXJyZW50INC40LcgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogItCi0LXQutGB0YIsINC+0LHRitGP0LLQu9GP0LXQvNGL0Lkg0LDRgdGB0LjRgdGC0LjRgNGD0Y7RidC40LzQuCDRgtC10YXQvdC+0LvQvtCz0LjRj9C80Lgg0L\/RgNC4INGB0LzQtdC90LUg0LrQsNGA0YLQvtGH0LXQui4g0JjRgdC\/0L7Qu9GM0LfQvtCy0LDRgtGMIEBjdXJyZW50INC4IEB0b3RhbCDQsiDQutCw0YfQtdGB0YLQstC1INC\/0LXRgNC10LzQtdC90L3Ri9GFLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJSYW5kb21pemUgY2FyZHMiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRW5hYmxlIHRvIHJhbmRvbWl6ZSB0aGUgb3JkZXIgb2YgY2FyZHMgb24gZGlzcGxheS4iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Flashcards-1.7\/language\/sl.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJOYXZvZGlsbyB1ZGVsZcW+ZW5jZW0iCiAgICB9LAogICAgewogICAgICAid2lkZ2V0cyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiUHJpdnpldG8iCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiS2FydGljZSIsCiAgICAgICJlbnRpdHkiOiAia2FydGljYSIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAibGFiZWwiOiAiS2FydGljYSIsCiAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlZwcmHFoWFuamUiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiTmVvYnZlem5vIHZwcmHFoWFuamUgemEga2FydGljby4gTmEga2FydGljaSBqZSBsYWhrbyBzYW1vIHNsaWthLCBzYW1vIGJlc2VkaWxvIGFsaSBvYm9qZS4iCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiT2Rnb3ZvciIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPZGdvdm9yIG5hIHZwcmHFoWFuamUuIFVzZSBhIHBpcGUgc3ltYm9sIHwgdG8gc3BsaXQgYWx0ZXJuYXRpdmUgc29sdXRpb25zLiBVc2UgXFx8IGlmIGEgc29sdXRpb24gc2hvdWxkIGNvbnRhaW4gYSB8LiIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJTbGlrYSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJOZW9idmV6bmEgc2xpa2EgemEga2FydGljby4gTmEga2FydGljaSBqZSBsYWhrbyBzYW1vIHNsaWthLCBzYW1vIGJlc2VkaWxvIGFsaSBvYm9qZS4iCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiTmFkb21lc3RubyBiZXNlZGlsbyB6YSBzbGlrbyIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJOYW1pZyIsCiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIkJlc2VkaWxvIG5hbWlnYSIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZXNlZGlsbyBuYXByZWRrYSIsCiAgICAgICJkZWZhdWx0IjogIkthcnRpY2EgQGNhcmQgb2QgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlNwcmVtZW5saml2a2kgdiBiZXNlZGlsdSBuYXByZWRrYSBzdGEgQGNhcmQgaW4gQHRvdGFsLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZXNlZGlsbyB6YSBndW1iIFwiTmFwcmVqXCIiLAogICAgICAiZGVmYXVsdCI6ICJOYXByZWoiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQmVzZWRpbG8gemEgZ3VtYiBcIk5hemFqXCIiLAogICAgICAiZGVmYXVsdCI6ICJOYXphaiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZXNlZGlsbyB6YSBndW1iIFwiUHJldmVyaVwiIiwKICAgICAgImRlZmF1bHQiOiAiUHJldmVyaSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJQcmVkIG9nbGVkb20gcmXFoWl0dmUgamUgcG90cmVibm8gcG9kYXRpIHZzZSBvZGdvdm9yZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZXNlZGlsbyB6YSBwb2xqZSB6YSB2bm9zIG9kZ292b3JvdiIsCiAgICAgICJkZWZhdWx0IjogIk9kZ292b3IgbmEgdnByYcWhYW5qZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZXNlZGlsbyB6YSBwcmF2aWxlbiBvZGdvdm9yIiwKICAgICAgImRlZmF1bHQiOiAiUHJhdmlsZW4gb2Rnb3ZvciIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZXNlZGlsbyB6YSBuZXByYXZpbGVuIG9kZ292b3IiLAogICAgICAiZGVmYXVsdCI6ICJOZXByYXZpbGVuIG9kZ292b3IiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQmVzZWRpbG8gemEgcHJpa2F6IHJlxaFpdHZlIiwKICAgICAgImRlZmF1bHQiOiAiUHJpa2HFvmkgcmXFoWl0ZXYiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQmVzZWRpbG8gemEgbmFzbG92IHJlenVsdGF0b3YiLAogICAgICAiZGVmYXVsdCI6ICJSZXp1bHRhdGkiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQmVzZWRpbG8gemEgxaF0ZXZpbG8gcHJhdmlsbmloIiwKICAgICAgImRlZmF1bHQiOiAiUHJhdmlsbmloIEBzY29yZSBvZCBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAiU3ByZW1lbmxqaXZraSBzdGEgQHNjb3JlIGluIEB0b3RhbC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQmVzZWRpbG8gemEgcHJpa2F6IHJlenVsdGF0b3YiLAogICAgICAiZGVmYXVsdCI6ICJQcmlrYXogcmV6dWx0YXRvdiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZXNlZGlsbyB6YSBvem5ha28ga3JhdGtlZ2Egb2Rnb3ZvcmEiLAogICAgICAiZGVmYXVsdCI6ICJBOiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZXNlZGlsbyB6YSBndW1iIFwiUG9za3VzaSBwb25vdm5vXCIiLAogICAgICAiZGVmYXVsdCI6ICJQb3NrdXNpIHBvbm92bm8iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTG\/EjWkgdmVsaWtlL21hbGUgxI1ya2UiLAogICAgICAiZGVzY3JpcHRpb24iOiAiUmF6bGlrdWplIG1lZCB6YXBpc29tIHYgdmVsaWtpaCBhbGkgbWFsaWggdGlza2FuaWggxI1ya2FoLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZXNlZGlsbyB6YSBuZXByYXZpbGVuIG9kZ292b3IgemEgYnJhbG5pa2UgemFzbG9uYSIsCiAgICAgICJkZWZhdWx0IjogIk5lcHJhdmlsZW4gb2Rnb3Zvci4gUHJhdmlsZW4gb2Rnb3ZvciBiaSBiaWwgQGFuc3dlciIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJAYW5zd2VyIGplIHNwcmVtZW5saml2a2EuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkJlc2VkaWxvIHphIHByYXZpbGVuIG9kZ292b3IgemEgYnJhbG5pa2UgemFzbG9uYSIsCiAgICAgICJkZWZhdWx0IjogIkBhbnN3ZXIgamUgcHJhdmlsZW4gb2Rnb3Zvci4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiQGFuc3dlciBqZSBzcHJlbWVubGppdmthLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJTcHJlbWVtYmEgc3RhdHVzYSBwcmkgb2JyYcSNYW5qdSBrYXJ0aWNlIHphIGJyYWxuaWtlIHphc2xvbmEiLAogICAgICAiZGVmYXVsdCI6ICJTdHJhbiBAY3VycmVudCBvZCBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAiQGN1cnJlbnQgaW4gQHRvdGFsIHN0YSBzcHJlbWVubGppdmtpLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJSYW5kb21pemUgY2FyZHMiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRW5hYmxlIHRvIHJhbmRvbWl6ZSB0aGUgb3JkZXIgb2YgY2FyZHMgb24gZGlzcGxheS4iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Flashcards-1.7\/language\/sma.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJUYXNrIGRlc2NyaXB0aW9uIgogICAgfSwKICAgIHsKICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkRlZmF1bHQiCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiQ2FyZHMiLAogICAgICAiZW50aXR5IjogImNhcmQiLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImxhYmVsIjogIkNhcmQiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJRdWVzdGlvbiIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcHRpb25hbCB0ZXh0dWFsIHF1ZXN0aW9uIGZvciB0aGUgY2FyZC4gKFRoZSBjYXJkIG1heSB1c2UganVzdCBhbiBpbWFnZSwganVzdCBhIHRleHQgb3IgYm90aCkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQW5zd2VyIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIkFuc3dlciAoc29sdXRpb24pIGZvciB0aGUgY2FyZC4gVXNlIGEgcGlwZSBzeW1ib2wgfCB0byBzcGxpdCBhbHRlcm5hdGl2ZSBzb2x1dGlvbnMuIFVzZSBcXHwgaWYgYSBzb2x1dGlvbiBzaG91bGQgY29udGFpbiBhIHwuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkltYWdlIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9wdGlvbmFsIGltYWdlIGZvciB0aGUgY2FyZC4gKFRoZSBjYXJkIG1heSB1c2UganVzdCBhbiBpbWFnZSwganVzdCBhIHRleHQgb3IgYm90aCkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQWx0ZXJuYXRpdmUgdGV4dCBmb3IgaW1hZ2UiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiVGlwIiwKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiVGlwIHRleHQiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUHJvZ3Jlc3MgdGV4dCIsCiAgICAgICJkZWZhdWx0IjogIkNhcmQgQGNhcmQgb2YgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlByb2dyZXNzIHRleHQsIHZhcmlhYmxlcyBhdmFpbGFibGU6IEBjYXJkIGFuZCBAdG90YWwuIEV4YW1wbGU6ICdDYXJkIEBjYXJkIG9mIEB0b3RhbCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIG5leHQgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiTmV4dCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciB0aGUgcHJldmlvdXMgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiUHJldmlvdXMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIGNoZWNrIGFuc3dlcnMgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiQ2hlY2siCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUmVxdWlyZSB1c2VyIGlucHV0IGJlZm9yZSB0aGUgc29sdXRpb24gY2FuIGJlIHZpZXdlZCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciB0aGUgYW5zd2VyIGlucHV0IGZpZWxkIiwKICAgICAgImRlZmF1bHQiOiAiWW91ciBhbnN3ZXIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgY29ycmVjdCBhbnN3ZXIiLAogICAgICAiZGVmYXVsdCI6ICJDb3JyZWN0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIGluY29ycmVjdCBhbnN3ZXIiLAogICAgICAiZGVmYXVsdCI6ICJJbmNvcnJlY3QiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiU2hvdyBzb2x1dGlvbiB0ZXh0IiwKICAgICAgImRlZmF1bHQiOiAiQ29ycmVjdCBhbnN3ZXIocykiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgcmVzdWx0cyB0aXRsZSIsCiAgICAgICJkZWZhdWx0IjogIlJlc3VsdHMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgbnVtYmVyIG9mIGNvcnJlY3QiLAogICAgICAiZGVmYXVsdCI6ICJAc2NvcmUgb2YgQHRvdGFsIGNvcnJlY3QiLAogICAgICAiZGVzY3JpcHRpb24iOiAiUmVzdWx0IHRleHQsIHZhcmlhYmxlcyBhdmFpbGFibGU6IEBzY29yZSBhbmQgQHRvdGFsLiBFeGFtcGxlOiAnQHNjb3JlIG9mIEB0b3RhbCBjb3JyZWN0JyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBzaG93IHJlc3VsdHMiLAogICAgICAiZGVmYXVsdCI6ICJTaG93IHJlc3VsdHMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3Igc2hvcnQgYW5zd2VyIGxhYmVsIiwKICAgICAgImRlZmF1bHQiOiAiQToiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJyZXRyeVwiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlJldHJ5IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNhc2Ugc2Vuc2l0aXZlIiwKICAgICAgImRlc2NyaXB0aW9uIjogIk1ha2VzIHN1cmUgdGhlIHVzZXIgaW5wdXQgaGFzIHRvIGJlIGV4YWN0bHkgdGhlIHNhbWUgYXMgdGhlIGFuc3dlci4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiSW5jb3JyZWN0IHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJJbmNvcnJlY3QgYW5zd2VyLiBDb3JyZWN0IGFuc3dlciB3YXMgQGFuc3dlciIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcy4gVXNlIEBhbnN3ZXIgYXMgdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNvcnJlY3QgZmVlZGJhY2sgdGV4dCBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIkBhbnN3ZXIgaXMgY29ycmVjdC4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMgd2hlbiBhIGNhcmQgaXMgYW5zd2VyZWQgY29ycmVjdGx5LiBVc2UgQGFuc3dlciBhcyB2YXJpYWJsZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2FyZCBjaGFuZ2UgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJQYWdlIEBjdXJyZW50IG9mIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcyB3aGVuIG5hdmlnYXRpbmcgYmV0d2VlbiBjYXJkcy4gVXNlIEBjdXJyZW50IGFuZCBAdG90YWwgYXMgdmFyaWFibGVzLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJSYW5kb21pemUgY2FyZHMiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRW5hYmxlIHRvIHJhbmRvbWl6ZSB0aGUgb3JkZXIgb2YgY2FyZHMgb24gZGlzcGxheS4iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Flashcards-1.7\/language\/sme.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJUYXNrIGRlc2NyaXB0aW9uIgogICAgfSwKICAgIHsKICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkRlZmF1bHQiCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiQ2FyZHMiLAogICAgICAiZW50aXR5IjogImNhcmQiLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImxhYmVsIjogIkNhcmQiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJRdWVzdGlvbiIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcHRpb25hbCB0ZXh0dWFsIHF1ZXN0aW9uIGZvciB0aGUgY2FyZC4gKFRoZSBjYXJkIG1heSB1c2UganVzdCBhbiBpbWFnZSwganVzdCBhIHRleHQgb3IgYm90aCkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQW5zd2VyIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIkFuc3dlciAoc29sdXRpb24pIGZvciB0aGUgY2FyZC4gVXNlIGEgcGlwZSBzeW1ib2wgfCB0byBzcGxpdCBhbHRlcm5hdGl2ZSBzb2x1dGlvbnMuIFVzZSBcXHwgaWYgYSBzb2x1dGlvbiBzaG91bGQgY29udGFpbiBhIHwuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkltYWdlIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9wdGlvbmFsIGltYWdlIGZvciB0aGUgY2FyZC4gKFRoZSBjYXJkIG1heSB1c2UganVzdCBhbiBpbWFnZSwganVzdCBhIHRleHQgb3IgYm90aCkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQWx0ZXJuYXRpdmUgdGV4dCBmb3IgaW1hZ2UiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiVGlwIiwKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiVGlwIHRleHQiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUHJvZ3Jlc3MgdGV4dCIsCiAgICAgICJkZWZhdWx0IjogIkNhcmQgQGNhcmQgb2YgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlByb2dyZXNzIHRleHQsIHZhcmlhYmxlcyBhdmFpbGFibGU6IEBjYXJkIGFuZCBAdG90YWwuIEV4YW1wbGU6ICdDYXJkIEBjYXJkIG9mIEB0b3RhbCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIG5leHQgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiTmV4dCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciB0aGUgcHJldmlvdXMgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiUHJldmlvdXMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIGNoZWNrIGFuc3dlcnMgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiQ2hlY2siCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUmVxdWlyZSB1c2VyIGlucHV0IGJlZm9yZSB0aGUgc29sdXRpb24gY2FuIGJlIHZpZXdlZCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciB0aGUgYW5zd2VyIGlucHV0IGZpZWxkIiwKICAgICAgImRlZmF1bHQiOiAiWW91ciBhbnN3ZXIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgY29ycmVjdCBhbnN3ZXIiLAogICAgICAiZGVmYXVsdCI6ICJDb3JyZWN0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIGluY29ycmVjdCBhbnN3ZXIiLAogICAgICAiZGVmYXVsdCI6ICJJbmNvcnJlY3QiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiU2hvdyBzb2x1dGlvbiB0ZXh0IiwKICAgICAgImRlZmF1bHQiOiAiQ29ycmVjdCBhbnN3ZXIocykiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgcmVzdWx0cyB0aXRsZSIsCiAgICAgICJkZWZhdWx0IjogIlJlc3VsdHMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgbnVtYmVyIG9mIGNvcnJlY3QiLAogICAgICAiZGVmYXVsdCI6ICJAc2NvcmUgb2YgQHRvdGFsIGNvcnJlY3QiLAogICAgICAiZGVzY3JpcHRpb24iOiAiUmVzdWx0IHRleHQsIHZhcmlhYmxlcyBhdmFpbGFibGU6IEBzY29yZSBhbmQgQHRvdGFsLiBFeGFtcGxlOiAnQHNjb3JlIG9mIEB0b3RhbCBjb3JyZWN0JyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBzaG93IHJlc3VsdHMiLAogICAgICAiZGVmYXVsdCI6ICJTaG93IHJlc3VsdHMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3Igc2hvcnQgYW5zd2VyIGxhYmVsIiwKICAgICAgImRlZmF1bHQiOiAiQToiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJyZXRyeVwiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlJldHJ5IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNhc2Ugc2Vuc2l0aXZlIiwKICAgICAgImRlc2NyaXB0aW9uIjogIk1ha2VzIHN1cmUgdGhlIHVzZXIgaW5wdXQgaGFzIHRvIGJlIGV4YWN0bHkgdGhlIHNhbWUgYXMgdGhlIGFuc3dlci4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiSW5jb3JyZWN0IHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJJbmNvcnJlY3QgYW5zd2VyLiBDb3JyZWN0IGFuc3dlciB3YXMgQGFuc3dlciIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcy4gVXNlIEBhbnN3ZXIgYXMgdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNvcnJlY3QgZmVlZGJhY2sgdGV4dCBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIkBhbnN3ZXIgaXMgY29ycmVjdC4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMgd2hlbiBhIGNhcmQgaXMgYW5zd2VyZWQgY29ycmVjdGx5LiBVc2UgQGFuc3dlciBhcyB2YXJpYWJsZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2FyZCBjaGFuZ2UgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJQYWdlIEBjdXJyZW50IG9mIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcyB3aGVuIG5hdmlnYXRpbmcgYmV0d2VlbiBjYXJkcy4gVXNlIEBjdXJyZW50IGFuZCBAdG90YWwgYXMgdmFyaWFibGVzLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJSYW5kb21pemUgY2FyZHMiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRW5hYmxlIHRvIHJhbmRvbWl6ZSB0aGUgb3JkZXIgb2YgY2FyZHMgb24gZGlzcGxheS4iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Flashcards-1.7\/language\/smj.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJUYXNrIGRlc2NyaXB0aW9uIgogICAgfSwKICAgIHsKICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkRlZmF1bHQiCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiQ2FyZHMiLAogICAgICAiZW50aXR5IjogImNhcmQiLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImxhYmVsIjogIkNhcmQiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJRdWVzdGlvbiIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcHRpb25hbCB0ZXh0dWFsIHF1ZXN0aW9uIGZvciB0aGUgY2FyZC4gKFRoZSBjYXJkIG1heSB1c2UganVzdCBhbiBpbWFnZSwganVzdCBhIHRleHQgb3IgYm90aCkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQW5zd2VyIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIkFuc3dlciAoc29sdXRpb24pIGZvciB0aGUgY2FyZC4gVXNlIGEgcGlwZSBzeW1ib2wgfCB0byBzcGxpdCBhbHRlcm5hdGl2ZSBzb2x1dGlvbnMuIFVzZSBcXHwgaWYgYSBzb2x1dGlvbiBzaG91bGQgY29udGFpbiBhIHwuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkltYWdlIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9wdGlvbmFsIGltYWdlIGZvciB0aGUgY2FyZC4gKFRoZSBjYXJkIG1heSB1c2UganVzdCBhbiBpbWFnZSwganVzdCBhIHRleHQgb3IgYm90aCkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQWx0ZXJuYXRpdmUgdGV4dCBmb3IgaW1hZ2UiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiVGlwIiwKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiVGlwIHRleHQiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUHJvZ3Jlc3MgdGV4dCIsCiAgICAgICJkZWZhdWx0IjogIkNhcmQgQGNhcmQgb2YgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlByb2dyZXNzIHRleHQsIHZhcmlhYmxlcyBhdmFpbGFibGU6IEBjYXJkIGFuZCBAdG90YWwuIEV4YW1wbGU6ICdDYXJkIEBjYXJkIG9mIEB0b3RhbCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIG5leHQgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiTmV4dCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciB0aGUgcHJldmlvdXMgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiUHJldmlvdXMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIGNoZWNrIGFuc3dlcnMgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiQ2hlY2siCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUmVxdWlyZSB1c2VyIGlucHV0IGJlZm9yZSB0aGUgc29sdXRpb24gY2FuIGJlIHZpZXdlZCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciB0aGUgYW5zd2VyIGlucHV0IGZpZWxkIiwKICAgICAgImRlZmF1bHQiOiAiWW91ciBhbnN3ZXIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgY29ycmVjdCBhbnN3ZXIiLAogICAgICAiZGVmYXVsdCI6ICJDb3JyZWN0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIGluY29ycmVjdCBhbnN3ZXIiLAogICAgICAiZGVmYXVsdCI6ICJJbmNvcnJlY3QiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiU2hvdyBzb2x1dGlvbiB0ZXh0IiwKICAgICAgImRlZmF1bHQiOiAiQ29ycmVjdCBhbnN3ZXIocykiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgcmVzdWx0cyB0aXRsZSIsCiAgICAgICJkZWZhdWx0IjogIlJlc3VsdHMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgbnVtYmVyIG9mIGNvcnJlY3QiLAogICAgICAiZGVmYXVsdCI6ICJAc2NvcmUgb2YgQHRvdGFsIGNvcnJlY3QiLAogICAgICAiZGVzY3JpcHRpb24iOiAiUmVzdWx0IHRleHQsIHZhcmlhYmxlcyBhdmFpbGFibGU6IEBzY29yZSBhbmQgQHRvdGFsLiBFeGFtcGxlOiAnQHNjb3JlIG9mIEB0b3RhbCBjb3JyZWN0JyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBzaG93IHJlc3VsdHMiLAogICAgICAiZGVmYXVsdCI6ICJTaG93IHJlc3VsdHMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3Igc2hvcnQgYW5zd2VyIGxhYmVsIiwKICAgICAgImRlZmF1bHQiOiAiQToiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJyZXRyeVwiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlJldHJ5IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNhc2Ugc2Vuc2l0aXZlIiwKICAgICAgImRlc2NyaXB0aW9uIjogIk1ha2VzIHN1cmUgdGhlIHVzZXIgaW5wdXQgaGFzIHRvIGJlIGV4YWN0bHkgdGhlIHNhbWUgYXMgdGhlIGFuc3dlci4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiSW5jb3JyZWN0IHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJJbmNvcnJlY3QgYW5zd2VyLiBDb3JyZWN0IGFuc3dlciB3YXMgQGFuc3dlciIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcy4gVXNlIEBhbnN3ZXIgYXMgdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNvcnJlY3QgZmVlZGJhY2sgdGV4dCBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIkBhbnN3ZXIgaXMgY29ycmVjdC4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMgd2hlbiBhIGNhcmQgaXMgYW5zd2VyZWQgY29ycmVjdGx5LiBVc2UgQGFuc3dlciBhcyB2YXJpYWJsZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2FyZCBjaGFuZ2UgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJQYWdlIEBjdXJyZW50IG9mIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcyB3aGVuIG5hdmlnYXRpbmcgYmV0d2VlbiBjYXJkcy4gVXNlIEBjdXJyZW50IGFuZCBAdG90YWwgYXMgdmFyaWFibGVzLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJSYW5kb21pemUgY2FyZHMiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRW5hYmxlIHRvIHJhbmRvbWl6ZSB0aGUgb3JkZXIgb2YgY2FyZHMgb24gZGlzcGxheS4iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Flashcards-1.7\/language\/sr.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLQntC\/0LjRgSDQt9Cw0LTQsNGC0LrQsCIKICAgIH0sCiAgICB7CiAgICAgICJ3aWRnZXRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICLQo9C+0LHQuNGH0LDRmNC10L3QviIKICAgICAgICB9CiAgICAgIF0sCiAgICAgICJsYWJlbCI6ICLQmtCw0YDRgtC40YbQtSIsCiAgICAgICJlbnRpdHkiOiAiY2FyZCIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAibGFiZWwiOiAi0JrQsNGA0YLQuNGG0LAiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICLQn9C40YLQsNGa0LUiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAi0J3QtdC+0LHQstC10LfQvdC+INGC0LXQutGB0YLRg9Cw0LvQvdC+INC\/0LjRgtCw0ZrQtSDQt9CwINC60LDRgNGC0LjRhtGDLiAo0JrQsNGA0YLQuNGG0LAg0LzQvtC20LUg0LrQvtGA0LjRgdGC0LjRgtC4INGB0LDQvNC+INGB0LvQuNC60YMsINGB0LDQvNC+INGC0LXQutGB0YIg0LjQu9C4INC+0LHQvtGY0LUpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogItCe0LTQs9C+0LLQvtGAIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogItCd0LXQvtCx0LLQtdC30L3QuCDQvtC00LPQvtCy0L7RgCAo0YDQtdGI0LXRmtC1KSDQt9CwINC60LDRgNGC0LjRhtGDLiIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICLQodC70LjQutCwIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogItCd0LXQvtCx0LLQtdC30L3QsCDRgdC70LjQutCwINC30LAg0LrQsNGA0YLQuNGG0YMuICjQmtCw0YDRgtC40YbQsCDQvNC+0LbQtSDQutC+0YDQuNGB0YLQuNGC0Lgg0YHQsNC80L4g0YHQu9C40LrRgywg0YHQsNC80L4g0YLQtdC60YHRgiDQuNC70Lgg0L7QsdC+0ZjQtSkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAi0JDQu9GC0LXRgNC90LDRgtC40LLQvdC4INGC0LXQutGB0YIg0LfQsCDRgdC70LjQutGDIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogItCh0LDQstC10YIiLAogICAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINGB0LDQstC10YLQsCIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINCd0LDQv9GA0LXQtNCw0LoiLAogICAgICAiZGVmYXVsdCI6ICLQmtCw0YDRgtC40YbQsCBAY2FyZCDQvtC0IEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLQotC10LrRgdGCINC90LDQv9GA0LXRgtC60LAsINC00L7RgdGC0YPQv9C90LUg0L\/RgNC+0LzQtdC90ZnQuNCy0LU6IEBjYXJkINC4IEB0b3RhbC4g0J\/RgNC40LzQtdGAOiAn0JrQsNGA0YLQuNGG0LAgQGNhcmQg0L7QtCBAdG90YWwnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0LXQutGB0YIg0LfQsCDQtNGD0LPQvNC1INCh0LvQtdC00LXRm9C1IiwKICAgICAgImRlZmF1bHQiOiAi0KHQu9C10LTQtdGb0LAiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQt9CwINC00YPQs9C80LUg0J\/RgNC10YLRhdC+0LTQvdCwIiwKICAgICAgImRlZmF1bHQiOiAi0J\/RgNC10YLRhdC+0LTQvdCwIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0LXQutGB0YIg0LfQsCDQtNGD0LPQvNC1INCf0YDQvtCy0LXRgNC4IiwKICAgICAgImRlZmF1bHQiOiAi0J\/RgNC+0LLQtdGA0LgiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0JfQsNGF0YLQtdCy0LDRmNGC0LUg0LrQvtGA0LjRgdC90LjRh9C60Lgg0YPQvdC+0YEg0L\/RgNC1INC90LXQs9C+INGI0YLQviDRgdC1INGA0LXRiNC10ZrQtSDQvNC+0LbQtSDQv9C+0LPQu9C10LTQsNGC0LgiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQt9CwINCe0LTQs9C+0LLQvtGA0LUiLAogICAgICAiZGVmYXVsdCI6ICLQktCw0Ygg0L7QtNCz0L7QstC+0YAiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQt9CwINGC0LDRh9Cw0L0g0L7QtNCz0L7QstC+0YAiLAogICAgICAiZGVmYXVsdCI6ICLQotCw0YfQvdC+IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0LXQutGB0YIg0LfQsCDQv9C+0LPRgNC10YjQsNC9INC+0LTQs9C+0LLQvtGAIiwKICAgICAgImRlZmF1bHQiOiAi0J\/QvtCz0YDQtdGI0LDQvSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC30LAg0L\/RgNC40LrQsNC3INGA0LXRiNC10ZrQsCIsCiAgICAgICJkZWZhdWx0IjogItCi0LDRh9Cw0L0g0L7QtNCz0L7QstC+0YAiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQt9CwINCg0LXQt9GD0LvRgtCw0YLQtSIsCiAgICAgICJkZWZhdWx0IjogItCg0LXQt9GD0LvRgtCw0YLQuCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC30LAg0LHRgNC+0Zgg0YLQsNGH0L3QuNGFINC+0LTQs9C+0LLQvtGA0LAiLAogICAgICAiZGVmYXVsdCI6ICJAc2NvcmUg0L7QtCBAdG90YWwg0YLQsNGH0L3QuNGFIiwKICAgICAgImRlc2NyaXB0aW9uIjogItCi0LXQutGB0YIg0YDQtdC30YPQu9GC0LDRgtCwLCDQtNC+0YHRgtGD0L\/QvdC1INC\/0YDQvtC80LXQvdGZ0LjQstC1OiBAc2NvcmUg0LggQHRvdGFsLiDQn9GA0LjQvNC10YA6ICdAc2NvcmUg0L7QtCBAdG90YWwg0YLQsNGH0L3QuNGFJyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC30LAg0L\/RgNC40LrQsNC3INGA0LXQt9GD0LvRgtCw0YLQsCIsCiAgICAgICJkZWZhdWx0IjogItCf0YDQuNC60LDQttC4INGA0LXQt9GD0LvRgtCw0YLQtSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC30LAg0LrRgNCw0YLQsNC6INC+0LTQs9C+0LLQvtGAIiwKICAgICAgImRlZmF1bHQiOiAiQToiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQt9CwIFwi0LLRgNCw0YLQuFwiINC00YPQs9C80LUiLAogICAgICAiZGVmYXVsdCI6ICLQktGA0LDRgtC4IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCS0LXQu9C40LrQsCDQuCDQvNCw0LvQsCDRgdC70L7QstCwIiwKICAgICAgImRlc2NyaXB0aW9uIjogItCj0LLQtdGA0LDQstCwINGB0LUg0LTQsCDQutC+0YDQuNGB0L3QuNGH0LrQuCDRg9C90L7RgSDQvNC+0YDQsCDQsdC40YLQuCDQv9C+0YLQv9GD0L3QviDQuNGB0YLQuCDQutCw0L4g0Lgg0L7QtNCz0L7QstC+0YAuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCd0LXRgtCw0YfQsNC9INGC0LXQutGB0YIg0LfQsCDQv9C+0LzQvtGb0L3QtSDRgtC10YXQvdC+0LvQvtCz0LjRmNC1IiwKICAgICAgImRlZmF1bHQiOiAi0J3QtdGC0LDRh9Cw0L0g0L7QtNCz0L7QstC+0YAuINCi0LDRh9Cw0L0g0L7QtNCz0L7QstC+0YAg0ZjQtSBAYW5zd2VyIiwKICAgICAgImRlc2NyaXB0aW9uIjogItCi0LXQutGB0YIg0LrQvtGY0Lgg0ZvQtSDQsdC40YLQuCDQvdCw0ZjQsNCy0ZnQtdC9INC30LAg0L\/QvtC80L7Rm9C90LUg0YLQtdGF0L3QvtC70L7Qs9C40ZjQtS4g0JrQvtGA0LjRgdGC0LjRgtC1IEBhbnN3ZXIg0LrQsNC+INC\/0YDQvtC80LXQvdGZ0LjQstGDLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDb3JyZWN0IGZlZWRiYWNrIHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJAYW5zd2VyIGlzIGNvcnJlY3QuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdGhhdCB3aWxsIGJlIGFubm91bmNlZCB0byBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIHdoZW4gYSBjYXJkIGlzIGFuc3dlcmVkIGNvcnJlY3RseS4gVXNlIEBhbnN3ZXIgYXMgdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCf0YDQvtC80LXQvdCwINC60LDRgNGC0LjRhtC1INC30LAg0L\/QvtC80L7Rm9C90LUg0YLQtdGF0L3QvtC70L7Qs9C40ZjQtSIsCiAgICAgICJkZWZhdWx0IjogItCh0YLRgNCw0L3QsCBAY3VycmVudCDQvtC0IEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLQotC10LrRgdGCINC60L7RmNC4INGb0LUg0LHQuNGC0Lgg0L3QsNGY0LDQstGZ0LXQvSDQv9C+0LzQvtGb0L3QuNC8INGC0LXRhdC90L7Qu9C+0LPQuNGY0LDQvNCwINC\/0YDQuNC70LjQutC+0Lwg0L3QsNCy0LjQs9Cw0YbQuNGY0LUg0LjQt9C80LXRktGDINC60LDRgNGC0LjRhtCwLiDQmtC+0YDQuNGB0YLQuNGC0LUgQGN1cnJlbnQg0LggQHRvdGFsINC60LDQviDQv9GA0L7QvNC10L3RmdC40LLQtS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUmFuZG9taXplIGNhcmRzIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkVuYWJsZSB0byByYW5kb21pemUgdGhlIG9yZGVyIG9mIGNhcmRzIG9uIGRpc3BsYXkuIgogICAgfQogIF0KfQo="],"libraries\/H5P.Flashcards-1.7\/language\/sv.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJVcHBnaWZ0c2Jlc2tyaXZuaW5nIgogICAgfSwKICAgIHsKICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIlN0YW5kYXJkIgogICAgICAgIH0KICAgICAgXSwKICAgICAgImxhYmVsIjogIktvcnQiLAogICAgICAiZW50aXR5IjogImtvcnQiLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImxhYmVsIjogIktvcnQiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJGcsOlZ2EiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiVmFsZnJpIHRleHQgZsO2ciBrb3J0ZXQuIChLb3J0ZXQga2FuIGJlc3TDpSBhdiBlbmJhcnQgZW4gYmlsZCwgZW5iYXJ0IGVuIHRleHQsIGVsbGVyIGLDpWRhLikiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiU3ZhciIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJTdmFyIChsw7ZzbmluZykgZsO2ciBrb3J0ZXQuIFVzZSBhIHBpcGUgc3ltYm9sIHwgdG8gc3BsaXQgYWx0ZXJuYXRpdmUgc29sdXRpb25zLiBVc2UgXFx8IGlmIGEgc29sdXRpb24gc2hvdWxkIGNvbnRhaW4gYSB8LiIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJCaWxkIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIlZhbGZyaSBiaWxkIGbDtnIga29ydGV0LiAoS29ydGV0IGthbiBiZXN0w6UgYXYgZW5iYXJ0IGVuIGJpbGQsIGVuYmFydCBlbiB0ZXh0LCBlbGxlciBiw6VkYS4pIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkFsdGVybmF0aXYgdGV4dCBmw7ZyIGJpbGQiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiVGlwcyIsCiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlRpcHN0ZXh0IgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkZyYW1zdGVnc3RleHQiLAogICAgICAiZGVmYXVsdCI6ICJLb3J0IEBjYXJkIGF2IEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJGcmFtc3RlZ3N0ZXh0LCB2YXJpYWJsZXIgaW5rbHVkZXJhciA6IEBjYXJkIG9jaCBAdG90YWwuIEV4ZW1wZWw6ICdLb3J0IEBjYXJkIGF2IEB0b3RhbCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmw7ZyIG7DpHN0YS1rbmFwcGVuIiwKICAgICAgImRlZmF1bHQiOiAiTsOkc3RhIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZsO2ciBmw7ZyZWfDpWVuZGUta25hcHBlbiIsCiAgICAgICJkZWZhdWx0IjogIkbDtnJlZ8OlZW5kZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGbDtnIga25hcHBlbiBcIlN2YXJhXCIiLAogICAgICAiZGVmYXVsdCI6ICJTdmFyYSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJLcsOkdiBhdHQgYW52w6RuZGFyZW4gYW5nZXIgc3ZhciBpbm5hbiBsw7ZzbmluZyBrYW4gdmlzYXMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmw7ZyIHN2YXJzaW5tYXRuaW5nc2bDpGx0IiwKICAgICAgImRlZmF1bHQiOiAiRGl0dCBzdmFyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgdmlkIGtvcnJla3Qgc3ZhciIsCiAgICAgICJkZWZhdWx0IjogIlLDpHR0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgdmlkIGZlbGFrdGlndCBzdmFyIiwKICAgICAgImRlZmF1bHQiOiAiRmVsIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlZpc2EgbMO2c25pbmdzdGV4dCIsCiAgICAgICJkZWZhdWx0IjogIlLDpHR0IHN2YXIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUnVicmlrIGbDtnIgcmVzdWx0YXQiLAogICAgICAiZGVmYXVsdCI6ICJSZXN1bHRhdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGbDtnIgYW50YWwga29ycmVrdGEiLAogICAgICAiZGVmYXVsdCI6ICJAc2NvcmUgYXYgQHRvdGFsIHZhciByw6R0dCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJSZXN1bHRhdHRleHQsIHZhcmlhYmxlciBzb20gZmlubnMgw6RyIDogQHNjb3JlIG9jaCBAdG90YWwuIEV4YW1wbGU6ICdAc2NvcmUgYXYgQHRvdGFsIHZhciByw6R0dCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmw7ZyIHZpc2EgcmVzdWx0YXQiLAogICAgICAiZGVmYXVsdCI6ICJWaXMgcmVzdWx0YXQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmw7ZyIGtvcnQgc3ZhcnNldGlrZXR0IiwKICAgICAgImRlZmF1bHQiOiAiQToiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmw7ZyIGtuYXBwZW4gXCJmw7Zyc8O2ayBpZ2VuXCIiLAogICAgICAiZGVmYXVsdCI6ICJGw7Zyc8O2ayBpZ2VuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlNraWZ0bMOkZ2Vza8OkbnNsaWd0IiwKICAgICAgImRlc2NyaXB0aW9uIjogIktyw6R2IGF0dCBhbnbDpG5kYXJlbnMgc3ZhciDDpHIgZXhha3Qgc2FtbWEgc29tIHN2YXJldC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCB2aWQgZmVsYWt0aWd0IHN2YXIgZsO2ciB0aWxsZ8OkbmdsaWdoZXRzaGrDpGxwbWVkZWwiLAogICAgICAiZGVmYXVsdCI6ICJGZWxha3RpZ3Qgc3Zhci4gUsOkdHQgc3ZhciB2YXIgQGFuc3dlciIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHNvbSBrb21tZXIgYW52w6RuZGFzIGF2IHRpbGxnw6RuZ2xpZ2hldHNoasOkbHBtZWRlbC4gQW52w6RuZCBAYW5zd2VyIHNvbSB2YXJpYWJlbC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmw7ZyIGtvcnJla3QgZmVlZGJhY2sgdGV4dCBmw7ZyIHRpbGxnw6RuZ2xpZ2hldHNoasOkbHBtZWRlbCIsCiAgICAgICJkZWZhdWx0IjogIkBhbnN3ZXIgw6RyIGtvcnJla3QiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCBzb20gYmVza3JpdnMgZsO2ciB0aWxsZ8OkbmdsaWdoZXRzaGrDpGxwbWVkZWwgbsOkciBldHQga29ydCDDpHIgYmVzdmFyYXQga29ycmVrdC4gQW52w6RuZCBAYW5zd2VyIHNvbSB2YXJpYWJlbC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQnl0ZSBhdiBrb3J0IHZpZCB0aWxsZ8OkbmdsaWdoZXRzaGrDpGxwbWVkZWwiLAogICAgICAiZGVmYXVsdCI6ICJTaWRhIEBjdXJyZW50IGF2IEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHNvbSBrb21tZXIgYW52w6RuZGFzIGF2IHRpbGxnw6RuZ2xpZ2hldHNoasOkbHBtZWRlbCB2aWQgbmF2aWdlcmluZyBtZWxsYW4ga29ydC4gQW52w6RuZCBAY3VycmVudCBvY2ggQHRvdGFsIHNvbSB2YXJpYWJsZXIuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlNsdW1wYSBrb3J0IiwKICAgICAgImRlc2NyaXB0aW9uIjogIkFrdGl2ZXJhIGbDtnIgYXR0IHNrYXBhIHNsdW1wbcOkc3NpZyBvcmRuaW5nIHDDpSBodXIga29ydGVuIHZpc2FzLiIKICAgIH0KICBdCn0K"],"libraries\/H5P.Flashcards-1.7\/language\/sw.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJNYWVsZXpvIHlhIGthemkiCiAgICB9LAogICAgewogICAgICAid2lkZ2V0cyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiQ2hhZ3VvLW1zaW5naSIKICAgICAgICB9CiAgICAgIF0sCiAgICAgICJsYWJlbCI6ICJLYWRpIiwKICAgICAgImVudGl0eSI6ICJrYWRpIiwKICAgICAgImZpZWxkIjogewogICAgICAgICJsYWJlbCI6ICJLYWRpIiwKICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiU3dhbGkiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiU3dhbGkgbGEga2ltYWFuZGlzaGkgbGEgaGlhcmkga3dhIGthZGkuIChLYWRpIGluYXdlemEga3V0dW1pYSBwaWNoYSB0dSwgbWFhbmRpc2hpIHR1IGF1IHlvdGUgbWF3aWxpKSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJKaWJ1IiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIkppYnUgbGEgaGlhcmkgKHN1bHVoaXNobykgbGEga2FkaS4iCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiUGljaGEiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiUGljaGEgeWEgaGlhcmkgeWEga2FkaS4gKEthZGkgaW5hd2V6YSBrdXR1bWlhIHBpY2hhIHR1LCBtYWFuZGlzaGkgdHUgYXUgeW90ZSBtYXdpbGkpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIk1hYW5kaXNoaSBtYmFkYWxhIHlhIHBpY2hhIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIktpZG9rZXpvIiwKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiTWFhbmRpc2hpIHlhIGtpZG9rZXpvIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk1hYW5kaXNoaSB5YSBtYWVuZGVsZW8iLAogICAgICAiZGVmYXVsdCI6ICJLYWRpIHlhIEBjYXJkIGthdGkgeWEgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIk1hYW5kaXNoaSB5YSBtYWVuZGVsZW8sIHZpZ2V6byB2aW5hdnlvcGF0aWthbmE6IEBjYXJkIG5hIEB0b3RhbC4gTWZhbm86IOKAmEthZGkgeWEgQGNhcmQga2F0aSB5YSBAdG90YWwnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk1hYW5kaXNoaSBrd2Ega2l0dWZlIGtpbmFjaG9mdWF0YSIsCiAgICAgICJkZWZhdWx0IjogIkluYXlvZnVhdGEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWFhbmRpc2hpIGt3YSBraXR1ZmUgY2hhIGF3YWxpIiwKICAgICAgImRlZmF1bHQiOiAiWWEgYXdhbGkiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWFhbmRpc2hpIHlhIGtpdHVmZSBjaGEga3V3ZWthIGFsYW1hIGt3YSBtYWppYnUiLAogICAgICAiZGVmYXVsdCI6ICJXZWthIGFsYW1hIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkhpdGFqaSBpbmdpem8gbGEgbXR1bWlhamkga2FibGEgeWEgc3VsdWhpc2hvIGt1dGF6YW13YSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJNYWFuZGlzaGkga3dhIHNlaGVtdSB5YSBrdWluZ2l6YSBtYWppYnUiLAogICAgICAiZGVmYXVsdCI6ICJKaWJ1IGxha28iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWFhbmRpc2hpIHlhIGppYnUgc2FoaWhpIiwKICAgICAgImRlZmF1bHQiOiAiU2FoaWhpIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk1hYW5kaXNoaSB5YSBqaWJ1IGxpc2lsbyBzYWhpaGkiLAogICAgICAiZGVmYXVsdCI6ICJTaXlvIHNhaGloaSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJPbnllc2hhIG1hYW5kaXNoaSB5ZW55ZSBzdWx1aGlzaG8iLAogICAgICAiZGVmYXVsdCI6ICJKaWJ1IHNhaGloaSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJNYWFuZGlzaGkgeWEgbWFkYSB5YSBtYXRva2VvIiwKICAgICAgImRlZmF1bHQiOiAiTWF0b2tlbyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJNYWFuZGlzaGkga3dhIG5hbWJhcmkgeWEgbWFqaWJ1IHNhaGloaSIsCiAgICAgICJkZWZhdWx0IjogIkBzY29yZSBrYXRpIHlhIEB0b3RhbCBzYWhpaGkiLAogICAgICAiZGVzY3JpcHRpb24iOiAiTWFhbmRpc2hpIHlhIG1hdG9rZW8sIHZpZ2V6byB2aW5hdnlvcGF0aWthbmE6IEBzY29yZSBuYSBAdG90YWwuIE1mYW5vOiDigJhAc2NvcmUga2F0aSB5YSBAdG90YWwgc2FoaWhpJyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJNYWFuZGlzaGkgeWEga3Vvbnllc2hhIG1hdG9rZW8iLAogICAgICAiZGVmYXVsdCI6ICJPbnllc2hhIG1hdG9rZW8iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWFhbmRpc2hpIGt3YSBsZWJvIHlhIG1hamlidSBtYWZ1cGkiLAogICAgICAiZGVmYXVsdCI6ICJBOiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJNYWFuZGlzaGkga3dhIGtpdHVmZSBjaGEgamFyaWJ1IHRlbmEiLAogICAgICAiZGVmYXVsdCI6ICJKYXJpYnUgdGVuYSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJLZXNpIG55ZXRpIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkh1aGFraWtpc2hhIGt1d2EgaW5naXpvIGxhIG10dW1pYWppIGxhemltYSBsaWZhbmFuZSBrYWJpc2EgbmEgamlidS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWFhbmRpc2hpIHlhc2l5byBzYWhpaGkga3dhIHRla25vbG9qaWEgeWEgdXNhaWRpemkiLAogICAgICAiZGVmYXVsdCI6ICJKaWJ1IGxpc2lsbyBzYWhpaGkuIEppYnUgc2FoaWhpIGxpbGlrdXdhIEBhbnN3ZXIiLAogICAgICAiZGVzY3JpcHRpb24iOiAiTWFhbmRpc2hpIHlhdGFrYXlvdGFuZ2F6d2Ega3dhIHRla25vbG9qaWEgeWEgdXNhaWRpemkuIFR1bWlhIEBhbnN3ZXIga2FtYSBraWdlem8uIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk1hYW5kaXNoaSB5YSBtYW9uaSBzYWhpaGkga3dhIHRla25vbG9qaWEgeWEgdXNhaWRpemkiLAogICAgICAiZGVmYXVsdCI6ICJAYW5zd2VyIG5pIHNhaGloaS4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiTWFhbmRpc2hpIHlhdGFrYXlvdGFuZ2F6d2Ega3dhIHRla25vbG9qaWEgc2FpZGl6aSB3YWthdGkga2FkaSBpbWVqaWJpd2Ega3dhIHVzYWhpaGkuIFR1bWlhIEBhbnN3ZXIga2FtYSBraWdlem8uIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk1hYmFkaWxpa28geWEga2FkaSBrd2EgdGVrbm9sb2ppYSB5YSB1c2FpZGl6aSIsCiAgICAgICJkZWZhdWx0IjogIkt1cmFzYSBAY3VycmVudCBrYXRpIHlhIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJNYWFuZGlzaGkgeWF0YWtheW90YW5nYXp3YSBrd2EgdGVrbm9sb2ppYSB5YSB1c2FpZGl6aSB3YWthdGkgd2Ega3Vzb2dlemEga2F0aSB5YSBrYWRpLiBUdW1pYSBAY3VycmVudG5hIEB0b3RhbCBrYW1hIHZpZ2V6by4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUmFuZG9taXplIGNhcmRzIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkVuYWJsZSB0byByYW5kb21pemUgdGhlIG9yZGVyIG9mIGNhcmRzIG9uIGRpc3BsYXkuIgogICAgfQogIF0KfQo="],"libraries\/H5P.Flashcards-1.7\/language\/th.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLguITguLPguK3guJjguLTguJrguLLguKLguIfguLLguJkiCiAgICB9LAogICAgewogICAgICAid2lkZ2V0cyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAi4LiE4LmI4Liy4LmA4Lij4Li04LmI4Lih4LiV4LmJ4LiZIgogICAgICAgIH0KICAgICAgXSwKICAgICAgImxhYmVsIjogIuC4geC4suC4o+C5jOC4lCIsCiAgICAgICJlbnRpdHkiOiAiY2FyZCIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAibGFiZWwiOiAi4LiB4Liy4Lij4LmM4LiUIiwKICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAi4LiE4Liz4LiW4Liy4LihIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIuC4hOC4s+C4luC4suC4oeC4guC5ieC4reC4hOC4p+C4suC4oeC5gOC4nuC4tOC5iOC4oeC5gOC4leC4tOC4oeC4quC4s+C4q+C4o+C4seC4muC4geC4suC4o+C5jOC4lCAo4LiB4Liy4Lij4LmM4LiU4Lit4Liy4LiI4LmD4LiK4LmJ4Lij4Li54Lib4Lig4Liy4Lie4LmA4LiX4LmI4Liy4LiZ4Lix4LmJ4LiZIOC4guC5ieC4reC4hOC4p+C4suC4oeC5gOC4l+C5iOC4suC4meC4seC5ieC4mSDguKvguKPguLfguK3guJfguLHguYnguIfguKPguLnguJvguKDguLLguJ7guYHguKXguLDguILguYnguK3guITguKfguLLguKEpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIuC4hOC4s+C4leC4reC4miIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICLguITguLPguJXguK3guJogKOC4quC4tOC5iOC4h+C4l+C4teC5iOC4luC4ueC4geC4leC5ieC4reC4hykg4Liq4Liz4Lir4Lij4Lix4Lia4LiB4Liy4Lij4LmM4LiUIOC5g+C4iuC5ieC5gOC4hOC4o+C4t+C5iOC4reC4h+C4q+C4oeC4suC4ouC4iOC4uOC4lOC4quC4reC4hyAofCkg4LmA4Lie4Li34LmI4Lit4LmB4Lii4LiB4LiE4Liz4LiV4Lit4Lia4LiX4Liy4LiH4LmA4Lil4Li34Lit4LiBIOC5g+C4iuC5iSBcXHwg4Lir4Liy4LiB4LiE4Liz4LiV4Lit4Lia4LiV4LmJ4Lit4LiH4Lih4Li14LmA4LiE4Lij4Li34LmI4Lit4LiH4Lir4Lih4Liy4LiiIHwiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAi4Lij4Li54Lib4Lig4Liy4LieIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIuC4o+C4ueC4m+C4oOC4suC4nuC5gOC4nuC4tOC5iOC4oeC5gOC4leC4tOC4oeC4quC4s+C4q+C4o+C4seC4muC4geC4suC4o+C5jOC4lCAo4LiB4Liy4Lij4LmM4LiU4Lit4Liy4LiI4LmD4LiK4LmJ4Lij4Li54Lib4Lig4Liy4Lie4LmA4LiX4LmI4Liy4LiZ4Lix4LmJ4LiZIOC4guC5ieC4reC4hOC4p+C4suC4oeC5gOC4l+C5iOC4suC4meC4seC5ieC4mSDguKvguKPguLfguK3guJfguLHguYnguIfguKPguLnguJvguKDguLLguJ7guYHguKXguLDguILguYnguK3guITguKfguLLguKEpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIuC4guC5ieC4reC4hOC4p+C4suC4oeC4quC4s+C4q+C4o+C4seC4muC4o+C4ueC4m+C4oOC4suC4nuC5geC4l+C4meC4l+C4teC5iCIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICLguYDguITguKXguYfguJTguKXguLHguJoiLAogICAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICLguILguYnguK3guITguKfguLLguKHguYDguITguKXguYfguJTguKXguLHguJoiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LiE4Lin4Liy4Lih4LiE4Li34Lia4Lir4LiZ4LmJ4LiyIiwKICAgICAgImRlZmF1bHQiOiAi4LiB4Liy4Lij4LmM4LiU4LiX4Li14LmIIEBjYXJkIOC4iOC4suC4geC4l+C4seC5ieC4h+C4q+C4oeC4lCBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAi4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LiE4Lin4Liy4Lih4LiE4Li34Lia4Lir4LiZ4LmJ4LiyIOC4leC4seC4p+C5geC4m+C4o+C4l+C4teC5iOC4quC4suC4oeC4suC4o+C4luC5g+C4iuC5ieC5hOC4lOC5iTogQGNhcmQg4LmB4Lil4LiwIEB0b3RhbCDguJXguLHguKfguK3guKLguYjguLLguIc6ICfguIHguLLguKPguYzguJTguJfguLXguYggQGNhcmQg4LiI4Liy4LiB4LiX4Lix4LmJ4LiH4Lir4Lih4LiUIEB0b3RhbCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4Liq4Liz4Lir4Lij4Lix4Lia4Lib4Li44LmI4Lih4LiW4Lix4LiU4LmE4LibIiwKICAgICAgImRlZmF1bHQiOiAi4LiW4Lix4LiU4LmE4LibIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuC4guC5ieC4reC4hOC4p+C4suC4oeC4quC4s+C4q+C4o+C4seC4muC4m+C4uOC5iOC4oeC4geC5iOC4reC4meC4q+C4meC5ieC4siIsCiAgICAgICJkZWZhdWx0IjogIuC4geC5iOC4reC4meC4q+C4meC5ieC4siIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLguILguYnguK3guITguKfguLLguKHguKrguLPguKvguKPguLHguJrguJvguLjguYjguKHguJXguKPguKfguIjguKrguK3guJrguITguLPguJXguK3guJoiLAogICAgICAiZGVmYXVsdCI6ICLguJXguKPguKfguIjguKrguK3guJoiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4LiV4LmJ4Lit4LiH4LiB4Liy4Lij4Lib4LmJ4Lit4LiZ4LiC4LmJ4Lit4Lih4Li54Lil4LiI4Liy4LiB4Lic4Li54LmJ4LmD4LiK4LmJ4LiB4LmI4Lit4LiZ4LiX4Li14LmI4LiI4Liw4LiU4Li54LiE4Liz4LiV4Lit4LiaIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuC4guC5ieC4reC4hOC4p+C4suC4oeC4quC4s+C4q+C4o+C4seC4muC4iuC5iOC4reC4h+C4m+C5ieC4reC4meC4hOC4s+C4leC4reC4miIsCiAgICAgICJkZWZhdWx0IjogIuC4hOC4s+C4leC4reC4muC4guC4reC4h+C4hOC4uOC4kyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLguILguYnguK3guITguKfguLLguKHguKrguLPguKvguKPguLHguJrguITguLPguJXguK3guJrguJfguLXguYjguJbguLnguIHguJXguYnguK3guIciLAogICAgICAiZGVmYXVsdCI6ICLguJbguLnguIHguJXguYnguK3guIciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4Liq4Liz4Lir4Lij4Lix4Lia4LiE4Liz4LiV4Lit4Lia4LiX4Li14LmI4LmE4Lih4LmI4LiW4Li54LiB4LiV4LmJ4Lit4LiHIiwKICAgICAgImRlZmF1bHQiOiAi4LmE4Lih4LmI4LiW4Li54LiB4LiV4LmJ4Lit4LiHIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuC4guC5ieC4reC4hOC4p+C4suC4oeC5geC4quC4lOC4h+C4hOC4s+C4leC4reC4muC4l+C4teC5iOC4luC4ueC4geC4leC5ieC4reC4hyIsCiAgICAgICJkZWZhdWx0IjogIuC4hOC4s+C4leC4reC4muC4l+C4teC5iOC4luC4ueC4geC4leC5ieC4reC4hyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLguILguYnguK3guITguKfguLLguKHguKrguLPguKvguKPguLHguJrguKvguLHguKfguILguYnguK3guJzguKXguKXguLHguJ7guJjguYwiLAogICAgICAiZGVmYXVsdCI6ICLguJzguKXguKXguLHguJ7guJjguYwiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4Liq4Liz4Lir4Lij4Lix4Lia4LiI4Liz4LiZ4Lin4LiZ4LiE4Liz4LiV4Lit4Lia4LiX4Li14LmI4LiW4Li54LiB4LiV4LmJ4Lit4LiHIiwKICAgICAgImRlZmF1bHQiOiAiQHNjb3JlIOC4iOC4suC4geC4l+C4seC5ieC4h+C4q+C4oeC4lCBAdG90YWwg4LiE4Liz4LiV4Lit4Lia4LiX4Li14LmI4LiW4Li54LiB4LiV4LmJ4Lit4LiHIiwKICAgICAgImRlc2NyaXB0aW9uIjogIuC4guC5ieC4reC4hOC4p+C4suC4oeC4nOC4peC4peC4seC4nuC4mOC5jCDguJXguLHguKfguYHguJvguKPguJfguLXguYjguKrguLLguKHguLLguKPguJbguYPguIrguYnguYTguJTguYk6IEBzY29yZSDguYHguKXguLAgQHRvdGFsIOC4leC4seC4p+C4reC4ouC5iOC4suC4hzogJ0BzY29yZSDguIjguLLguIHguJfguLHguYnguIfguKvguKHguJQgQHRvdGFsIOC4hOC4s+C4leC4reC4muC4l+C4teC5iOC4luC4ueC4geC4leC5ieC4reC4hyciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4Liq4Liz4Lir4Lij4Lix4Lia4LmB4Liq4LiU4LiH4Lic4Lil4Lil4Lix4Lie4LiY4LmMIiwKICAgICAgImRlZmF1bHQiOiAi4LmB4Liq4LiU4LiH4Lic4Lil4Lil4Lix4Lie4LiY4LmMIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuC4guC5ieC4reC4hOC4p+C4suC4oeC4quC4s+C4q+C4o+C4seC4muC4m+C5ieC4suC4ouC4hOC4s+C4leC4reC4muC4quC4seC5ieC4mSIsCiAgICAgICJkZWZhdWx0IjogIuC4gToiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4Liq4Liz4Lir4Lij4Lix4Lia4Lib4Li44LmI4LihIFwi4Lil4Lit4LiH4LmD4Lir4Lih4LmIXCIiLAogICAgICAiZGVmYXVsdCI6ICLguKXguK3guIfguYPguKvguKHguYgiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4LiV4Lij4Lin4LiI4Liq4Lit4Lia4LiV4Lix4Lin4Lie4Li04Lih4Lie4LmM4LmD4Lir4LiN4LmI4LmA4Lil4LmH4LiBIiwKICAgICAgImRlc2NyaXB0aW9uIjogIuC4l+C4s+C5g+C4q+C5ieC4nOC4ueC5ieC5g+C4iuC5ieC4leC5ieC4reC4h+C4m+C5ieC4reC4meC4guC5ieC4reC4oeC4ueC4peC5g+C4q+C5ieC4leC4o+C4h+C4geC4seC4muC4hOC4s+C4leC4reC4muC5gOC4l+C5iOC4suC4meC4seC5ieC4mSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLguILguYnguK3guITguKfguLLguKHguYTguKHguYjguJbguLnguIHguJXguYnguK3guIfguKrguLPguKvguKPguLHguJrguYDguJfguITguYLguJnguYLguKXguKLguLXguIHguLLguKPguIrguYjguKfguKLguYDguKvguKXguLfguK0iLAogICAgICAiZGVmYXVsdCI6ICLguITguLPguJXguK3guJrguYTguKHguYjguJbguLnguIHguJXguYnguK3guIcg4LiE4Liz4LiV4Lit4Lia4LiX4Li14LmI4LiW4Li54LiB4LiV4LmJ4Lit4LiH4LiE4Li34LitIEBhbnN3ZXIiLAogICAgICAiZGVzY3JpcHRpb24iOiAi4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LiX4Li14LmI4LiI4Liw4LmB4LiI4LmJ4LiH4LmD4Lir4LmJ4LmA4LiX4LiE4LmC4LiZ4LmC4Lil4Lii4Li14LiB4Liy4Lij4LiK4LmI4Lin4Lii4LmA4Lir4Lil4Li34Lit4LiX4Lij4Liy4LiaIOC5g+C4iuC5iSBAYW5zd2VyIOC5gOC4m+C5h+C4meC4leC4seC4p+C5geC4m+C4oyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLguILguYnguK3guITguKfguLLguKHguJXguK3guJrguIHguKXguLHguJrguJfguLXguYjguJbguLnguIHguJXguYnguK3guIfguKrguLPguKvguKPguLHguJrguYDguJfguITguYLguJnguYLguKXguKLguLXguIHguLLguKPguIrguYjguKfguKLguYDguKvguKXguLfguK0iLAogICAgICAiZGVmYXVsdCI6ICJAYW5zd2VyIOC4luC4ueC4geC4leC5ieC4reC4hyIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLguILguYnguK3guITguKfguLLguKHguJfguLXguYjguIjguLDguYHguIjguYnguIfguYPguKvguYnguYDguJfguITguYLguJnguYLguKXguKLguLXguIHguLLguKPguIrguYjguKfguKLguYDguKvguKXguLfguK3guJfguKPguLLguJrguYDguKHguLfguYjguK3guJXguK3guJrguITguLPguJbguLLguKHguJbguLnguIHguJXguYnguK3guIcg4LmD4LiK4LmJIEBhbnN3ZXIg4LmA4Lib4LmH4LiZ4LiV4Lix4Lin4LmB4Lib4LijIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuC4geC4suC4o+C5gOC4m+C4peC4teC5iOC4ouC4meC4geC4suC4o+C5jOC4lOC4quC4s+C4q+C4o+C4seC4muC5gOC4l+C4hOC5guC4meC5guC4peC4ouC4teC4geC4suC4o+C4iuC5iOC4p+C4ouC5gOC4q+C4peC4t+C4rSIsCiAgICAgICJkZWZhdWx0IjogIuC4q+C4meC5ieC4siBAY3VycmVudCDguIjguLLguIHguJfguLHguYnguIfguKvguKHguJQgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIuC4guC5ieC4reC4hOC4p+C4suC4oeC4l+C4teC5iOC4iOC4sOC5geC4iOC5ieC4h+C5g+C4q+C5ieC5gOC4l+C4hOC5guC4meC5guC4peC4ouC4teC4geC4suC4o+C4iuC5iOC4p+C4ouC5gOC4q+C4peC4t+C4reC4l+C4o+C4suC4muC5gOC4oeC4t+C5iOC4reC5gOC4m+C4peC4teC5iOC4ouC4meC4geC4suC4o+C5jOC4lCDguYPguIrguYkgQGN1cnJlbnQg4LmB4Lil4LiwIEB0b3RhbCDguYDguJvguYfguJnguJXguLHguKfguYHguJvguKMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4Liq4Lil4Lix4Lia4Lil4Liz4LiU4Lix4Lia4LiB4Liy4Lij4LmM4LiU4LmB4Lia4Lia4Liq4Li44LmI4LihIiwKICAgICAgImRlc2NyaXB0aW9uIjogIuC5gOC4m+C4tOC4lOC5g+C4iuC5ieC4h+C4suC4meC5gOC4nuC4t+C5iOC4reC4quC4peC4seC4muC4peC4s+C4lOC4seC4muC4geC4suC4o+C5jOC4lOC5g+C4meC4geC4suC4o+C5geC4quC4lOC4hyIKICAgIH0KICBdCn0K"],"libraries\/H5P.Flashcards-1.7\/language\/tr.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJHw7ZyZXYgdGFuxLFtxLEiCiAgICB9LAogICAgewogICAgICAid2lkZ2V0cyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiVmFyc2F5xLFsYW4iCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiS2FydGxhciIsCiAgICAgICJlbnRpdHkiOiAia2FydCIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAibGFiZWwiOiAiS2FydCIsCiAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlNvcnUiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiS2FydHRhIGfDtnLDvG5lY2VrIGlzdGXEn2UgYmHEn2zEsSB5YXrEsWzEsSBzb3J1LiAoS2FydHRhIHNhZGVjZSBiaXIgZ8O2cnNlbCwgc2FkZWNlIG1ldGluIHZleWEgaWtpc2kgZGUgb2xhYmlsaXIpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkNldmFwIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIkthcnQgacOnaW4gaXN0ZcSfZSBiYcSfbMSxIGNldmFwICjDp8O2esO8bSkuIFVzZSBhIHBpcGUgc3ltYm9sIHwgdG8gc3BsaXQgYWx0ZXJuYXRpdmUgc29sdXRpb25zLiBVc2UgXFx8IGlmIGEgc29sdXRpb24gc2hvdWxkIGNvbnRhaW4gYSB8LiIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJSZXNpbSIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJLYXJ0dGEgZ8O2csO8bmVjZWsgaXN0ZcSfZSBiYcSfbMSxIGfDtnJzZWwuIChLYXJ0dGEgc2FkZWNlIGJpciBnw7Zyc2VsLCBzYWRlY2UgbWV0aW4gdmV5YSBpa2lzaSBkZSBvbGFiaWxpcikiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiUmVzaW0gacOnaW4gYWx0ZXJuYXRpZiBtZXRpbiIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICLEsHB1Y3UiLAogICAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICLEsHB1Y3UgbWV0bmkiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAixLBsZXJsZW1lIG1ldG5pIiwKICAgICAgImRlZmF1bHQiOiAiS2FydCBzYXnEsXPEsTogQGNhcmQgLyBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAixLBsZXJsZW1lIG1ldG5pLCBtZXZjdXQgZGXEn2nFn2tlbmxlcjogQGNhcmQgdmUgQHRvdGFsLiDDlnJuZWs6ICdLYXJ0IHNhecSxc8SxOiBAY2FyZCAvIEB0b3RhbCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiU29ucmFraSBkw7zEn21lc2kgbWV0bmkiLAogICAgICAiZGVmYXVsdCI6ICJTb25yYWtpIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIsOWbmNla2kgZMO8xJ9tZXNpIG1ldG5pIiwKICAgICAgImRlZmF1bHQiOiAiw5ZuY2VraSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDZXZhcGxhcsSxIGtvbnRyb2wgZXQgZMO8xJ9tZXNpIG1ldG5pIiwKICAgICAgImRlZmF1bHQiOiAiS29udHJvbCBFdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLDh8O2esO8bSBnw7Zyw7xudMO8bGVuZW1lZGVuIMO2bmNlIGt1bGxhbsSxY8SxIGdpcmnFn2kgZ2VyZWtzaW4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2V2YXAgZ2lyacWfaSBhbGFuxLEgbWV0bmkiLAogICAgICAiZGVmYXVsdCI6ICJDZXZhYsSxbsSxeiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEb8SfcnUgY2V2YXAgbWV0bmkiLAogICAgICAiZGVmYXVsdCI6ICJEb8SfcnUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiWWFubMSxxZ8gY2V2YXAgbWV0bmkiLAogICAgICAiZGVmYXVsdCI6ICJZYW5sxLHFnyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLDh8O2esO8bcO8IGfDtnN0ZXIgbWV0bmkiLAogICAgICAiZGVmYXVsdCI6ICLDh8O2esO8bcO8IEfDtnN0ZXIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiU29udcOnbGFyIGJhxZ9sxLHEn8SxIG1ldG5pIiwKICAgICAgImRlZmF1bHQiOiAiU29udcOnbGFyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkRvxJ9ydSBjZXZhcCBzYXnEsXPEsSBtZXRuaSIsCiAgICAgICJkZWZhdWx0IjogIkRvxJ9ydSBjZXZhcCBzYXnEsXPEsTogQHNjb3JlIC8gQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlNvbnXDpyBtZXRuaSwgbWV2Y3V0IGRlxJ9pxZ9rZW5sZXI6IEBzY29yZSB2ZSBAdG90YWwuIMOWcm5lazogJ0RvxJ9ydSBjdmV2YXAgc2F5xLFzxLE6IEBzY29yZSAvIEB0b3RhbC4nIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlNvbnXDp2xhcsSxIGfDtnN0ZXIgbWV0bmkiLAogICAgICAiZGVmYXVsdCI6ICJTb251w6dsYXLEsSBHw7ZzdGVyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkvEsXNhIGNldmFwIGV0aWtldCBtZXRuaSIsCiAgICAgICJkZWZhdWx0IjogIkE6IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlwiWWVuaWRlbiBEZW5lXCIgZMO8xJ9tZXNpIG1ldG5pIiwKICAgICAgImRlZmF1bHQiOiAiWWVuaWRlbiBEZW5lIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkLDvHnDvGsga8O8w6fDvGsgaGFyZiBkdXlhcmzEsSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJLdWxsYW7EsWPEsSBjZXZhYsSxbsSxbiwgYXluZW4gYmVsaXJsZWRpxJ9pbml6IGNldmFwIGdpYmkgb2xtYXPEsSBnZXJla2xpbGnEn2luaSBzYcSfbGFyLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJZYXJkxLFtY8SxIHRla25vbG9qaWxlciBpw6dpbiB5YW5sxLHFnyBtZXRpbiIsCiAgICAgICJkZWZhdWx0IjogIllhbmzEscWfIGNldmFwLiBEb8SfcnUgY2V2YXAgQGFuc3dlciIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJZYXJkxLFtY8SxIHRla25vbG9qaWxlcmUgY2V2YWLEsW4geWFubMSxxZ8gb2xkdcSfdW51IHZlIGRvxJ9ydSBjZXZhYsSxIGR1eXVyYWNhayBtZXRpbi4gQGFuc3dlciBpZmFkZXNpbmkgeWVyaW5lIGRvxJ9ydSBjZXZhYsSxbiBnZWxtZXNpIGnDp2luIGt1bGxhbsSxbi4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ29ycmVjdCBmZWVkYmFjayB0ZXh0IGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiQGFuc3dlciBpcyBjb3JyZWN0LiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcyB3aGVuIGEgY2FyZCBpcyBhbnN3ZXJlZCBjb3JyZWN0bHkuIFVzZSBAYW5zd2VyIGFzIHZhcmlhYmxlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJZYXJkxLFtY8SxIHRla25vbG9qaWxlciBpw6dpbiBrYXJ0IGRlxJ9pxZ9pa2xpxJ9pIiwKICAgICAgImRlZmF1bHQiOiAiQHRvdGFsIHNheWZhZGFuIEBjdXJyZW50LiBzYXlmYSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJLYXJ0bGFyIGFyYXPEsW5kYSBnZXppbmlya2VuIHlhcmTEsW1jxLEgdGVrbm9sb2ppbGVyZSB0b3BsYW0gc2F5ZmEgc2F5xLFzxLFuxLEgdmUgYnVsdW51bGFuIHNheWZhecSxIGR1eXVyYWNhayBtZXRpbi4gVG9wbGFtIHNheWZhIHNhecSxc8SxIGnDp2kgQHRvdGFsLCBidWx1bnVsYW4gc2F5ZmEgacOnaW4gZGUgQGN1cnJlbnQga3VsbGFuxLFuLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJLYXJ0bGFyxLEga2FyxLHFn3TEsXIiLAogICAgICAiZGVzY3JpcHRpb24iOiAiS2FydGxhcsSxbiBnw7ZzdGVyaWxtZSBzxLFyYXPEsW7EsW4gcmFzZ2VsZSBvbG1hc8SxbsSxIHNhxJ9sYXIuIgogICAgfQogIF0KfQo="],"libraries\/H5P.Flashcards-1.7\/language\/uk.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLQntC\/0LjRgSDQt9Cw0LLQtNCw0L3QvdGPIgogICAgfSwKICAgIHsKICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogItCf0L4g0YPQvNC+0LLRh9Cw0L3QvdGOIgogICAgICAgIH0KICAgICAgXSwKICAgICAgImxhYmVsIjogItCa0LDRgNGC0LrQuCIsCiAgICAgICJlbnRpdHkiOiAi0LrQsNGA0YLQutCwIiwKICAgICAgImZpZWxkIjogewogICAgICAgICJsYWJlbCI6ICLQmtCw0YDRgtC60LAiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICLQl9Cw0L\/QuNGC0LDQvdC90Y8iLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAi0JTQvtC00LDRgtC60L7QstC+INGC0LXQutGB0YLQvtCy0LUg0LfQsNC\/0LjRgtCw0L3QvdGPINC00LvRjyDQutCw0YDRgtC60LguICjQmtCw0YDRgtC60LAg0LzQvtC20LUg0LLQuNC60L7RgNC40YHRgtC+0LLRg9Cy0LDRgtC4INGC0ZbQu9GM0LrQuCDQt9C+0LHRgNCw0LbQtdC90L3Rjywg0YLRltC70YzQutC4INGC0LXQutGB0YIg0LDQsdC+INGA0LDQt9C+0LwpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogItCS0ZbQtNC\/0L7QstGW0LTRjCIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICLQktGW0LTQv9C+0LLRltC00Ywg0LTQu9GPINC60LDRgNGC0LrQuC4gVXNlIGEgcGlwZSBzeW1ib2wgfCB0byBzcGxpdCBhbHRlcm5hdGl2ZSBzb2x1dGlvbnMuIFVzZSBcXHwgaWYgYSBzb2x1dGlvbiBzaG91bGQgY29udGFpbiBhIHwuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogItCX0L7QsdGA0LDQttC10L3QvdGPIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogItCU0L7QtNCw0YLQutC+0LLQtSDQt9C+0LHRgNCw0LbQtdC90L3RjyDQtNC70Y8g0LrQsNGA0YLQutC4LiAo0JrQsNGA0YLQutCwINC80L7QttC1INCy0LjQutC+0YDQuNGB0YLQvtCy0YPQstCw0YLQuCDRgtGW0LvRjNC60Lgg0LfQvtCx0YDQsNC20LXQvdC90Y8sINGC0ZbQu9GM0LrQuCDRgtC10LrRgdGCINCw0LHQviDRgNCw0LfQvtC8KSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICLQkNC70YzRgtC10YDQvdCw0YLQuNCy0L3QuNC5INGC0LXQutGB0YIg0LfQsNC80ZbRgdGC0Ywg0LfQvtCx0YDQsNC20LXQvdC90Y8iCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAi0J\/QvtGA0LDQtNCwIiwKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQv9C+0YDQsNC00LgiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0J\/RgNC+0LPRgNC10YEgKNGC0LXQutGB0YIpIiwKICAgICAgImRlZmF1bHQiOiAi0JrQsNGA0YLQutCwIEBjYXJkINC3IEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLQn9GA0L7Qs9GA0LXRgSAo0YLQtdC60YHRgiksINC00L7RgdGC0YPQv9C90ZYg0LfQvNGW0L3QvdGWOiBAY2FyZCDRliBAdG90YWwuINCd0LDQv9GA0LjQutC70LDQtDogJ9Ca0LDRgNGC0LrQsCBAY2FyZCDQtyBAdG90YWwnIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0LXQutGB0YIg0LrQvdC+0L\/QutC4INC90LDRgdGC0YPQv9C90LAiLAogICAgICAiZGVmYXVsdCI6ICLQndCw0YHRgtGD0L\/QvdCwIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0LXQutGB0YIg0LrQvdC+0L\/QutC4INC\/0L7Qv9C10YDQtdC00L3RjyIsCiAgICAgICJkZWZhdWx0IjogItCf0L7Qv9C10YDQtdC00L3RjyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC60L3QvtC\/0LrQuCDQv9C10YDQtdCy0ZbRgNC60Lgg0LLRltC00L\/QvtCy0ZbQtNC10LkiLAogICAgICAiZGVmYXVsdCI6ICLQn9C10YDQtdCy0ZbRgNC40YLQuCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQn9C+0YLRgNGW0LHQvdC+INCy0LLQtdGB0YLQuCDQutC+0YDQuNGB0YLRg9Cy0LDRh9CwINC\/0LXRgNC10LQg0YLQuNC8LCDRj9C6INCy0ZbQtNC\/0L7QstGW0LTRjCDQvNC+0LbQvdCwINCx0YPQtNC1INC\/0LXRgNC10LPQu9GP0L3Rg9GC0LgiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQtNC70Y8g0L\/QvtC70Y8g0LLQstC10LTQtdC90L3RjyDQstGW0LTQv9C+0LLRltC00ZYiLAogICAgICAiZGVmYXVsdCI6ICLQotCy0L7RjyDQstGW0LTQv9C+0LLRltC00YwiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQtNC70Y8g0L\/RgNCw0LLQuNC70YzQvdC+0Zcg0LLRltC00L\/QvtCy0ZbQtNGWIiwKICAgICAgImRlZmF1bHQiOiAi0J\/RgNCw0LLQuNC70YzQvdC+IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0LXQutGBINC00LvRjyDQvdC10L\/RgNCw0LLQuNC70YzQvdC+INCy0ZbQtNC\/0L7QstGW0LTRliIsCiAgICAgICJkZWZhdWx0IjogItCd0LXQv9GA0LDQstC40LvRjNC90L4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0J\/QvtC60LDQt9Cw0YLQuCDRgtC10LrRgdGCINCy0ZbQtNC\/0L7QstGW0LTRliIsCiAgICAgICJkZWZhdWx0IjogItCf0YDQsNCy0LjQu9GM0L3QsCDQstGW0LTQv9C+0LLRltC00YwiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQtNC70Y8g0LfQsNCz0L7Qu9C+0LLQutCwINGA0LXQt9GD0LvRjNGC0LDRgtGW0LIiLAogICAgICAiZGVmYXVsdCI6ICLQoNC10LfRg9C70YzRgtCw0YLQuCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC00LvRjyDQutGW0LvRjNC60L7RgdGC0ZYg0L\/RgNCw0LLQuNC70YzQvdC40YUiLAogICAgICAiZGVmYXVsdCI6ICJAc2NvcmUg0LcgQHRvdGFsINC\/0YDQsNCy0LjQu9GM0L3QuNGFIiwKICAgICAgImRlc2NyaXB0aW9uIjogItCg0LXQt9GD0LvRjNGC0LDRgiAo0YLQtdC60YHRgiksINC00L7RgdGC0YPQv9C90ZYg0LfQvNGW0L3QvdGWOiBAc2NvcmUg0ZYgQHRvdGFsLiDQndCw0L\/RgNC40LrQu9Cw0LQ6ICdAc2NvcmUg0LcgQHRvdGFsINCy0ZbRgNC90L4nIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0LXQutGB0YIg0LTQu9GPINC\/0L7QutCw0LfRgyDRgNC10LfRg9C70YzRgtCw0YLRgyIsCiAgICAgICJkZWZhdWx0IjogItCf0L7QutCw0LfQsNGC0Lgg0YDQtdC30YPQu9GM0YLQsNGCIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0LXQutGB0YIg0LTQu9GPINC80ZbRgtC60Lgg0LLRltC00L\/QvtCy0ZbQtNGWIiwKICAgICAgImRlZmF1bHQiOiAiQToiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQtNC70Y8g0LrQvdC+0L\/QutC4INC\/0L7QstGC0L7RgNGDIiwKICAgICAgImRlZmF1bHQiOiAi0J\/QvtCy0YLQvtGA0LjRgtC4IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCS0YDQsNGF0L7QstGD0LLQsNGC0Lgg0YDQtdCz0ZbRgdGC0YAiLAogICAgICAiZGVzY3JpcHRpb24iOiAi0JLQstC10LTQtdC90LUg0LrQvtGA0LjRgdGC0YPQstCw0YfQtdC8INC\/0L7QstC40L3QvdC+INCx0YPRgtC4INGC0L7Rh9C90L4g0YLQsNC60LjQvCDQttC1LCDRj9C6INGWINCy0ZbQtNC\/0L7QstGW0LTRjC4uIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCf0YDQsNCy0LjQu9GM0L3QuNC5INGC0LXQutGB0YIg0LLRltC00LPRg9C60YMg0LTQu9GPINC00L7Qv9C+0LzRltC20L3QuNGFINGC0LXRhdC90L7Qu9C+0LPRltC5IiwKICAgICAgImRlZmF1bHQiOiAiQGFuc3dlciDRlCDQv9GA0LDQstC40LvRjNC90L7Rji4iLAogICAgICAiZGVzY3JpcHRpb24iOiAi0KLQtdC60YHRgiDQsdGD0LTQtSDQvtCz0L7Qu9C+0YjQtdC90L4g0LTQvtC\/0L7QvNGW0LbQvdC40Lwg0YLQtdGF0L3QvtC70L7Qs9GW0Y\/QvCwg0LrQvtC70Lgg0L3QsCDQutCw0YDRgtC60YMg0LHRg9C00LUg0L7RgtGA0LjQvNCw0L3QviDQv9GA0LDQstC40LvRjNC90YMg0LLRltC00L\/QvtCy0ZbQtNGMLiDQktC40LrQvtGA0LjRgdGC0L7QstGD0LnRgtC1IEBhbnN3ZXIg0Y\/QuiDQt9C80ZbQvdC90YMuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNvcnJlY3QgZmVlZGJhY2sgdGV4dCBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIkBhbnN3ZXIgaXMgY29ycmVjdC4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMgd2hlbiBhIGNhcmQgaXMgYW5zd2VyZWQgY29ycmVjdGx5LiBVc2UgQGFuc3dlciBhcyB2YXJpYWJsZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0JfQvNGW0L3QsCDQutCw0YDRgtC60Lgg0LTQu9GPINC00L7Qv9C+0LzRltC20L3QuNGFINGC0LXRhdC90L7Qu9C+0LPRltC5IiwKICAgICAgImRlZmF1bHQiOiAi0KHRgtC+0YDRltC90LrQsCBAY3VycmVudCDQtyBAdG90YWwiLAogICAgICAiZGVzY3JpcHRpb24iOiAi0KLQtdC60YHRgiwg0Y\/QutC40Lkg0LHRg9C00LUg0L7Qs9C+0LvQvtGI0LXQvdC+INC00L7Qv9C+0LzRltC20L3QuNC80Lgg0YLQtdGF0L3QvtC70L7Qs9GW0Y\/QvNC4INC\/0ZbQtCDRh9Cw0YEg0L3QsNCy0ZbQs9Cw0YbRltGXINC80ZbQtiDQutCw0YDRgtC60LDQvNC4LiDQktC40LrQvtGA0LjRgdGC0L7QstGD0LkgQGN1cnJlbnQg0ZYgQHRvdGFsINGP0Log0LfQvNGW0L3QvdGWLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJSYW5kb21pemUgY2FyZHMiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRW5hYmxlIHRvIHJhbmRvbWl6ZSB0aGUgb3JkZXIgb2YgY2FyZHMgb24gZGlzcGxheS4iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Flashcards-1.7\/language\/vi.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJUYXNrIGRlc2NyaXB0aW9uIgogICAgfSwKICAgIHsKICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkRlZmF1bHQiCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiQ2FyZHMiLAogICAgICAiZW50aXR5IjogImNhcmQiLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImxhYmVsIjogIkNhcmQiLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJRdWVzdGlvbiIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcHRpb25hbCB0ZXh0dWFsIHF1ZXN0aW9uIGZvciB0aGUgY2FyZC4gKFRoZSBjYXJkIG1heSB1c2UganVzdCBhbiBpbWFnZSwganVzdCBhIHRleHQgb3IgYm90aCkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQW5zd2VyIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIkFuc3dlciAoc29sdXRpb24pIGZvciB0aGUgY2FyZC4gVXNlIGEgcGlwZSBzeW1ib2wgfCB0byBzcGxpdCBhbHRlcm5hdGl2ZSBzb2x1dGlvbnMuIFVzZSBcXHwgaWYgYSBzb2x1dGlvbiBzaG91bGQgY29udGFpbiBhIHwuIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkltYWdlIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9wdGlvbmFsIGltYWdlIGZvciB0aGUgY2FyZC4gKFRoZSBjYXJkIG1heSB1c2UganVzdCBhbiBpbWFnZSwganVzdCBhIHRleHQgb3IgYm90aCkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQWx0ZXJuYXRpdmUgdGV4dCBmb3IgaW1hZ2UiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiVGlwIiwKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiVGlwIHRleHQiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUHJvZ3Jlc3MgdGV4dCIsCiAgICAgICJkZWZhdWx0IjogIkNhcmQgQGNhcmQgb2YgQHRvdGFsIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlByb2dyZXNzIHRleHQsIHZhcmlhYmxlcyBhdmFpbGFibGU6IEBjYXJkIGFuZCBAdG90YWwuIEV4YW1wbGU6ICdDYXJkIEBjYXJkIG9mIEB0b3RhbCciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIG5leHQgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiTmV4dCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciB0aGUgcHJldmlvdXMgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiUHJldmlvdXMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIGNoZWNrIGFuc3dlcnMgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiQ2hlY2siCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUmVxdWlyZSB1c2VyIGlucHV0IGJlZm9yZSB0aGUgc29sdXRpb24gY2FuIGJlIHZpZXdlZCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciB0aGUgYW5zd2VyIGlucHV0IGZpZWxkIiwKICAgICAgImRlZmF1bHQiOiAiWW91ciBhbnN3ZXIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgY29ycmVjdCBhbnN3ZXIiLAogICAgICAiZGVmYXVsdCI6ICJDb3JyZWN0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIGluY29ycmVjdCBhbnN3ZXIiLAogICAgICAiZGVmYXVsdCI6ICJJbmNvcnJlY3QiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiU2hvdyBzb2x1dGlvbiB0ZXh0IiwKICAgICAgImRlZmF1bHQiOiAiQ29ycmVjdCBhbnN3ZXIocykiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgcmVzdWx0cyB0aXRsZSIsCiAgICAgICJkZWZhdWx0IjogIlJlc3VsdHMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgbnVtYmVyIG9mIGNvcnJlY3QiLAogICAgICAiZGVmYXVsdCI6ICJAc2NvcmUgb2YgQHRvdGFsIGNvcnJlY3QiLAogICAgICAiZGVzY3JpcHRpb24iOiAiUmVzdWx0IHRleHQsIHZhcmlhYmxlcyBhdmFpbGFibGU6IEBzY29yZSBhbmQgQHRvdGFsLiBFeGFtcGxlOiAnQHNjb3JlIG9mIEB0b3RhbCBjb3JyZWN0JyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBzaG93IHJlc3VsdHMiLAogICAgICAiZGVmYXVsdCI6ICJTaG93IHJlc3VsdHMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3Igc2hvcnQgYW5zd2VyIGxhYmVsIiwKICAgICAgImRlZmF1bHQiOiAiQToiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJyZXRyeVwiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlJldHJ5IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNhc2Ugc2Vuc2l0aXZlIiwKICAgICAgImRlc2NyaXB0aW9uIjogIk1ha2VzIHN1cmUgdGhlIHVzZXIgaW5wdXQgaGFzIHRvIGJlIGV4YWN0bHkgdGhlIHNhbWUgYXMgdGhlIGFuc3dlci4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiSW5jb3JyZWN0IHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJJbmNvcnJlY3QgYW5zd2VyLiBDb3JyZWN0IGFuc3dlciB3YXMgQGFuc3dlciIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcy4gVXNlIEBhbnN3ZXIgYXMgdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNvcnJlY3QgZmVlZGJhY2sgdGV4dCBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIkBhbnN3ZXIgaXMgY29ycmVjdC4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMgd2hlbiBhIGNhcmQgaXMgYW5zd2VyZWQgY29ycmVjdGx5LiBVc2UgQGFuc3dlciBhcyB2YXJpYWJsZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2FyZCBjaGFuZ2UgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJQYWdlIEBjdXJyZW50IG9mIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcyB3aGVuIG5hdmlnYXRpbmcgYmV0d2VlbiBjYXJkcy4gVXNlIEBjdXJyZW50IGFuZCBAdG90YWwgYXMgdmFyaWFibGVzLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJOZ+G6q3Ugbmhpw6puIGjDs2EgdGjhursiLAogICAgICAiZGVzY3JpcHRpb24iOiAiS8OtY2ggaG\/huqF0IMSR4buDIG5n4bqrdSBuaGnDqm4gaMOzYSB0aOG7qSB04buxIGPDoWMgdGjhursgxJHGsOG7o2MgaGnhu4NuIHRo4buLLiIKICAgIH0KICBdCn0K"],"libraries\/H5P.Flashcards-1.7\/language\/zh-hans.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLku7vliqHmj4\/ov7AiCiAgICB9LAogICAgewogICAgICAid2lkZ2V0cyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAi6buY6K6kIgogICAgICAgIH0KICAgICAgXSwKICAgICAgImxhYmVsIjogIuaJgOacieWNoeeJhyIsCiAgICAgICJlbnRpdHkiOiAi5Y2h54mHIiwKICAgICAgImZpZWxkIjogewogICAgICAgICJsYWJlbCI6ICLljaHniYciLAogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICLpl67popgiLAogICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAi5Y2h54mH55qE5Y+v6YCJ5paH5pys6Zeu6aKYICjlj6\/ku6Xkvb\/nlKjlm77lg4\/ljaHvvIzmiJbogIXmloflrZfljaHvvIzkuZ\/lj6\/ku6XmmK\/lm77lg4\/phY3mloflrZfnmoTljaHniYcpIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIuetlOahiCIsCiAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICLljaHniYfnmoTlj6\/pgInnrZTmoYggKOino+WGs+aWueahiCkgLiBVc2UgYSBwaXBlIHN5bWJvbCB8IHRvIHNwbGl0IGFsdGVybmF0aXZlIHNvbHV0aW9ucy4gVXNlIFxcfCBpZiBhIHNvbHV0aW9uIHNob3VsZCBjb250YWluIGEgfC4iCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAi5Zu+5YOPIiwKICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIuWNoeeJh+eahOWPr+mAieWbvuWDjy4gKOWPr+S7peS9v+eUqOWbvuWDj+WNoe+8jOaIluiAheaWh+Wtl+WNoe+8jOS5n+WPr+S7peaYr+WbvuWDj+mFjeaWh+Wtl+eahOWNoeeJhykiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQWx0ZXJuYXRpdmUgdGV4dCBmb3IgaW1hZ2UiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAi5o+Q56S6IiwKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAi5o+Q56S65paH5pysIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIui\/m+W6puaWh+acrCIsCiAgICAgICJkZWZhdWx0IjogIuWNoeeJhyBAdG90YWzkuK3nmoRAY2FyZCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLov5vluqbmlofmnKzvvIzlj6\/nlKjlj5jph486IEBjYXJkIOWSjCBAdG90YWwuIOS+i+Wmgjog5Y2h54mHIEB0b3RhbOS4reeahEBjYXJkIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuS4i+S4gOS4quaMiemSrueahOaWh+acrCIsCiAgICAgICJkZWZhdWx0IjogIuS4i+S4gOS4qiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLliY3kuIDkuKrmjInpkq7nmoTmlofmnKwiLAogICAgICAiZGVmYXVsdCI6ICLliY3kuIDkuKoiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi5qOA5p+l562U5qGI5oyJ6ZKu55qE5paH5pysIiwKICAgICAgImRlZmF1bHQiOiAi5qOA5p+lIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuWcqOafpeeci+ino+WGs+aWueahiOS5i+WJjemcgOimgeeUqOaIt+i+k+WFpSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLnrZTmoYjovpPlhaXlrZfmrrXnmoTmlofmnKwiLAogICAgICAiZGVmYXVsdCI6ICLkvaDnmoTnrZTmoYgiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi5q2j56Gu562U5qGI55qE5paH5pysIiwKICAgICAgImRlZmF1bHQiOiAi5q2j56GuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIumUmeivr+etlOahiOeahOaWh+acrCIsCiAgICAgICJkZWZhdWx0IjogIumUmeivryIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLmmL7npLrop6PlhrPmlrnmoYjmlofmnKwiLAogICAgICAiZGVmYXVsdCI6ICLmraPnoa7nrZTmoYgiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi5oiQ57up5qCH6aKY55qE5paH5pysIiwKICAgICAgImRlZmF1bHQiOiAi5oiQ57upIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuato+ehruetlOahiOaVsOmHj+eahOaWh+acrCIsCiAgICAgICJkZWZhdWx0IjogIkB0b3RhbOS4reeahEBzY29yZSDmraPnoa4iLAogICAgICAiZGVzY3JpcHRpb24iOiAi5oiQ57up5paH5pysLCDlj5jph4\/lj6\/nlKg6IEBzY29yZSDlkowgQHRvdGFsLiDkvovlpoI6IEB0b3RhbOS4reeahEBzY29yZSDmraPnoa4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi5pi+56S65oiQ57up55qE5paH5pysIiwKICAgICAgImRlZmF1bHQiOiAi5pi+56S65oiQ57upIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuefreetlOahiOagh+etvueahOaWh+acrCIsCiAgICAgICJkZWZhdWx0IjogIkE6IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIumHjeivlSDmjInpkq7nmoTmlofmnKwiLAogICAgICAiZGVmYXVsdCI6ICLph43or5UiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi5Yy65YiG5aSn5bCP5YaZIiwKICAgICAgImRlc2NyaXB0aW9uIjogIuehruiupOeUqOaIt+i+k+WFpeWGheWuueW\/hemhu+S4juetlOahiOWujOWFqOebuOWQjC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiSW5jb3JyZWN0IHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJJbmNvcnJlY3QgYW5zd2VyLiBDb3JyZWN0IGFuc3dlciB3YXMgQGFuc3dlciIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcy4gVXNlIEBhbnN3ZXIgYXMgdmFyaWFibGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNvcnJlY3QgZmVlZGJhY2sgdGV4dCBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIkBhbnN3ZXIgaXMgY29ycmVjdC4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMgd2hlbiBhIGNhcmQgaXMgYW5zd2VyZWQgY29ycmVjdGx5LiBVc2UgQGFuc3dlciBhcyB2YXJpYWJsZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2FyZCBjaGFuZ2UgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJQYWdlIEBjdXJyZW50IG9mIEB0b3RhbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcyB3aGVuIG5hdmlnYXRpbmcgYmV0d2VlbiBjYXJkcy4gVXNlIEBjdXJyZW50IGFuZCBAdG90YWwgYXMgdmFyaWFibGVzLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJSYW5kb21pemUgY2FyZHMiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRW5hYmxlIHRvIHJhbmRvbWl6ZSB0aGUgb3JkZXIgb2YgY2FyZHMgb24gZGlzcGxheS4iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Flashcards-1.7\/library.json":["application\/json","ewogICJ0aXRsZSI6ICJGbGFzaGNhcmRzIiwKICAiZGVzY3JpcHRpb24iOiAiQ3JlYXRlIGNhcmRzIHdoZXJlIHRoZSB1c2VyIGhhcyB0byBndWVzcyB0aGUgYW5zd2VyLiIsCiAgIm1ham9yVmVyc2lvbiI6IDEsCiAgIm1pbm9yVmVyc2lvbiI6IDcsCiAgInBhdGNoVmVyc2lvbiI6IDUsCiAgInJ1bm5hYmxlIjogMSwKICAiZW1iZWRUeXBlcyI6IFsiaWZyYW1lIl0sCiAgImF1dGhvciI6ICJKb3ViZWwiLAogICJjb3JlQXBpIjogewogICAgIm1ham9yVmVyc2lvbiI6IDEsCiAgICAibWlub3JWZXJzaW9uIjogNAogIH0sCiAgImxpY2Vuc2UiOiAiTUlUIiwKICAibWFjaGluZU5hbWUiOiAiSDVQLkZsYXNoY2FyZHMiLAogICJwcmVsb2FkZWRDc3MiOiBbCiAgICB7CiAgICAgICJwYXRoIjogImNzcy9mbGFzaGNhcmRzLmNzcyIKICAgIH0KICBdLAogICJwcmVsb2FkZWRKcyI6IFsKICAgIHsKICAgICAgInBhdGgiOiAianMveGFwaS5qcyIKICAgIH0sCiAgICB7CiAgICAgICJwYXRoIjogImpzL2ZsYXNoY2FyZHMuanMiCiAgICB9CiAgXSwKICAicHJlbG9hZGVkRGVwZW5kZW5jaWVzIjogWwogICAgewogICAgICAibWFjaGluZU5hbWUiOiAiRm9udEF3ZXNvbWUiLAogICAgICAibWFqb3JWZXJzaW9uIjogNCwKICAgICAgIm1pbm9yVmVyc2lvbiI6IDUKICAgIH0sCiAgICB7CiAgICAgICJtYWNoaW5lTmFtZSI6ICJINVAuSm91YmVsVUkiLAogICAgICAibWFqb3JWZXJzaW9uIjogMSwKICAgICAgIm1pbm9yVmVyc2lvbiI6IDMKICAgIH0sCiAgICB7CiAgICAgICJtYWNoaW5lTmFtZSI6ICJINVAuRm9udEljb25zIiwKICAgICAgIm1ham9yVmVyc2lvbiI6IDEsCiAgICAgICJtaW5vclZlcnNpb24iOiAwCiAgICB9CiAgXSwKICAiZWRpdG9yRGVwZW5kZW5jaWVzIjogWwogICAgewogICAgICAibWFjaGluZU5hbWUiOiAiSDVQRWRpdG9yLlZlcnRpY2FsVGFicyIsCiAgICAgICJtYWpvclZlcnNpb24iOiAxLAogICAgICAibWlub3JWZXJzaW9uIjogMwogICAgfQogIF0KfQoK"],"libraries\/H5P.Flashcards-1.7\/semantics.json":["application\/json","WwogIHsKICAgICJuYW1lIjogImRlc2NyaXB0aW9uIiwKICAgICJ0eXBlIjogInRleHQiLAogICAgImxhYmVsIjogIlRhc2sgZGVzY3JpcHRpb24iLAogICAgImltcG9ydGFuY2UiOiAiaGlnaCIKICB9LAogIHsKICAgICJuYW1lIjogImNhcmRzIiwKICAgICJ0eXBlIjogImxpc3QiLAogICAgIndpZGdldHMiOiBbCiAgICAgIHsKICAgICAgICAibmFtZSI6ICJWZXJ0aWNhbFRhYnMiLAogICAgICAgICJsYWJlbCI6ICJEZWZhdWx0IgogICAgICB9CiAgICBdLAogICAgImxhYmVsIjogIkNhcmRzIiwKICAgICJlbnRpdHkiOiAiY2FyZCIsCiAgICAiaW1wb3J0YW5jZSI6ICJoaWdoIiwKICAgICJtaW4iOiAxLAogICAgImRlZmF1bHROdW0iOiAxLAogICAgImZpZWxkIjogewogICAgICAibmFtZSI6ICJjYXJkIiwKICAgICAgInR5cGUiOiAiZ3JvdXAiLAogICAgICAibGFiZWwiOiAiQ2FyZCIsCiAgICAgICJpbXBvcnRhbmNlIjogImhpZ2giLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJuYW1lIjogInRleHQiLAogICAgICAgICAgInR5cGUiOiAidGV4dCIsCiAgICAgICAgICAibGFiZWwiOiAiUXVlc3Rpb24iLAogICAgICAgICAgImltcG9ydGFuY2UiOiAiaGlnaCIsCiAgICAgICAgICAib3B0aW9uYWwiOiB0cnVlLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9wdGlvbmFsIHRleHR1YWwgcXVlc3Rpb24gZm9yIHRoZSBjYXJkLiAoVGhlIGNhcmQgbWF5IHVzZSBqdXN0IGFuIGltYWdlLCBqdXN0IGEgdGV4dCBvciBib3RoKSIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJuYW1lIjogImFuc3dlciIsCiAgICAgICAgICAidHlwZSI6ICJ0ZXh0IiwKICAgICAgICAgICJsYWJlbCI6ICJBbnN3ZXIiLAogICAgICAgICAgImltcG9ydGFuY2UiOiAiaGlnaCIsCiAgICAgICAgICAib3B0aW9uYWwiOiB0cnVlLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIkFuc3dlciAoc29sdXRpb24pIGZvciB0aGUgY2FyZC4gVXNlIGEgZm9yd2FyZCBzbGFzaCAvIHRvIHNwbGl0IGFsdGVybmF0aXZlIHNvbHV0aW9ucy4gVXNlIFxcLyBpZiBhIHNvbHV0aW9uIHNob3VsZCBjb250YWluIGEgLy4iCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibmFtZSI6ICJpbWFnZSIsCiAgICAgICAgICAidHlwZSI6ICJpbWFnZSIsCiAgICAgICAgICAibGFiZWwiOiAiSW1hZ2UiLAogICAgICAgICAgImltcG9ydGFuY2UiOiAiaGlnaCIsCiAgICAgICAgICAib3B0aW9uYWwiOiB0cnVlLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9wdGlvbmFsIGltYWdlIGZvciB0aGUgY2FyZC4gKFRoZSBjYXJkIG1heSB1c2UganVzdCBhbiBpbWFnZSwganVzdCBhIHRleHQgb3IgYm90aCkiCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibmFtZSI6ICJpbWFnZUFsdFRleHQiLAogICAgICAgICAgInR5cGUiOiAidGV4dCIsCiAgICAgICAgICAibGFiZWwiOiAiQWx0ZXJuYXRpdmUgdGV4dCBmb3IgaW1hZ2UiLAogICAgICAgICAgImltcG9ydGFuY2UiOiAiaGlnaCIsCiAgICAgICAgICAib3B0aW9uYWwiOiB0cnVlCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibmFtZSI6ICJ0aXAiLAogICAgICAgICAgInR5cGUiOiAiZ3JvdXAiLAogICAgICAgICAgImxhYmVsIjogIlRpcCIsCiAgICAgICAgICAiaW1wb3J0YW5jZSI6ICJsb3ciLAogICAgICAgICAgIm9wdGlvbmFsIjogdHJ1ZSwKICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgIHsKICAgICAgICAgICAgICAibmFtZSI6ICJ0aXAiLAogICAgICAgICAgICAgICJsYWJlbCI6ICJUaXAgdGV4dCIsCiAgICAgICAgICAgICAgImltcG9ydGFuY2UiOiAibG93IiwKICAgICAgICAgICAgICAidHlwZSI6ICJ0ZXh0IiwKICAgICAgICAgICAgICAid2lkZ2V0IjogImh0bWwiLAogICAgICAgICAgICAgICJ0YWdzIjogWwogICAgICAgICAgICAgICAgInAiLAogICAgICAgICAgICAgICAgImJyIiwKICAgICAgICAgICAgICAgICJzdHJvbmciLAogICAgICAgICAgICAgICAgImVtIiwKICAgICAgICAgICAgICAgICJjb2RlIgogICAgICAgICAgICAgIF0sCiAgICAgICAgICAgICAgIm9wdGlvbmFsIjogdHJ1ZQogICAgICAgICAgICB9CiAgICAgICAgICBdCiAgICAgICAgfQogICAgICBdCiAgICB9CiAgfSwKICB7CiAgICAibGFiZWwiOiAiUHJvZ3Jlc3MgdGV4dCIsCiAgICAibmFtZSI6ICJwcm9ncmVzc1RleHQiLAogICAgInR5cGUiOiAidGV4dCIsCiAgICAiZGVmYXVsdCI6ICJDYXJkIEBjYXJkIG9mIEB0b3RhbCIsCiAgICAiaW1wb3J0YW5jZSI6ICJsb3ciLAogICAgImRlc2NyaXB0aW9uIjogIlByb2dyZXNzIHRleHQsIHZhcmlhYmxlcyBhdmFpbGFibGU6IEBjYXJkIGFuZCBAdG90YWwuIEV4YW1wbGU6ICdDYXJkIEBjYXJkIG9mIEB0b3RhbCciLAogICAgImNvbW1vbiI6IHRydWUKICB9LAogIHsKICAgICJsYWJlbCI6ICJUZXh0IGZvciB0aGUgbmV4dCBidXR0b24iLAogICAgIm5hbWUiOiAibmV4dCIsCiAgICAidHlwZSI6ICJ0ZXh0IiwKICAgICJkZWZhdWx0IjogIk5leHQiLAogICAgImltcG9ydGFuY2UiOiAibG93IiwKICAgICJjb21tb24iOiB0cnVlCiAgfSwKICB7CiAgICAibGFiZWwiOiAiVGV4dCBmb3IgdGhlIHByZXZpb3VzIGJ1dHRvbiIsCiAgICAibmFtZSI6ICJwcmV2aW91cyIsCiAgICAidHlwZSI6ICJ0ZXh0IiwKICAgICJkZWZhdWx0IjogIlByZXZpb3VzIiwKICAgICJpbXBvcnRhbmNlIjogImxvdyIsCiAgICAiY29tbW9uIjogdHJ1ZQogIH0sCiAgewogICAgImxhYmVsIjogIlRleHQgZm9yIHRoZSBjaGVjayBhbnN3ZXJzIGJ1dHRvbiIsCiAgICAibmFtZSI6ICJjaGVja0Fuc3dlclRleHQiLAogICAgInR5cGUiOiAidGV4dCIsCiAgICAiZGVmYXVsdCI6ICJDaGVjayIsCiAgICAiaW1wb3J0YW5jZSI6ICJsb3ciLAogICAgImNvbW1vbiI6IHRydWUKICB9LAogIHsKICAgICJsYWJlbCI6ICJSZXF1aXJlIHVzZXIgaW5wdXQgYmVmb3JlIHRoZSBzb2x1dGlvbiBjYW4gYmUgdmlld2VkIiwKICAgICJuYW1lIjogInNob3dTb2x1dGlvbnNSZXF1aXJlc0lucHV0IiwKICAgICJ0eXBlIjogImJvb2xlYW4iLAogICAgImRlZmF1bHQiOiB0cnVlLAogICAgImltcG9ydGFuY2UiOiAibG93IiwKICAgICJvcHRpb25hbCI6IHRydWUKICB9LAogIHsKICAgICJsYWJlbCI6ICJUZXh0IGZvciB0aGUgYW5zd2VyIGlucHV0IGZpZWxkIiwKICAgICJuYW1lIjogImRlZmF1bHRBbnN3ZXJUZXh0IiwKICAgICJ0eXBlIjogInRleHQiLAogICAgImRlZmF1bHQiOiAiWW91ciBhbnN3ZXIiLAogICAgImltcG9ydGFuY2UiOiAibG93IiwKICAgICJjb21tb24iOiB0cnVlCiAgfSwKICB7CiAgICAibGFiZWwiOiAiVGV4dCBmb3IgY29ycmVjdCBhbnN3ZXIiLAogICAgIm5hbWUiOiAiY29ycmVjdEFuc3dlclRleHQiLAogICAgInR5cGUiOiAidGV4dCIsCiAgICAiZGVmYXVsdCI6ICJDb3JyZWN0IiwKICAgICJpbXBvcnRhbmNlIjogImxvdyIsCiAgICAiY29tbW9uIjogdHJ1ZQogIH0sCiAgewogICAgImxhYmVsIjogIlRleHQgZm9yIGluY29ycmVjdCBhbnN3ZXIiLAogICAgIm5hbWUiOiAiaW5jb3JyZWN0QW5zd2VyVGV4dCIsCiAgICAidHlwZSI6ICJ0ZXh0IiwKICAgICJkZWZhdWx0IjogIkluY29ycmVjdCIsCiAgICAiaW1wb3J0YW5jZSI6ICJsb3ciLAogICAgImNvbW1vbiI6IHRydWUKICB9LAogIHsKICAgICJsYWJlbCI6ICJTaG93IHNvbHV0aW9uIHRleHQiLAogICAgIm5hbWUiOiAic2hvd1NvbHV0aW9uVGV4dCIsCiAgICAidHlwZSI6ICJ0ZXh0IiwKICAgICJkZWZhdWx0IjogIkNvcnJlY3QgYW5zd2VyKHMpIiwKICAgICJpbXBvcnRhbmNlIjogImxvdyIsCiAgICAiY29tbW9uIjogdHJ1ZQogIH0sCiAgewogICAgImxhYmVsIjogIlRleHQgZm9yIHJlc3VsdHMgdGl0bGUiLAogICAgIm5hbWUiOiAicmVzdWx0cyIsCiAgICAidHlwZSI6ICJ0ZXh0IiwKICAgICJkZWZhdWx0IjogIlJlc3VsdHMiLAogICAgImltcG9ydGFuY2UiOiAibG93IiwKICAgICJjb21tb24iOiB0cnVlCiAgfSwKICB7CiAgICAibGFiZWwiOiAiVGV4dCBmb3IgbnVtYmVyIG9mIGNvcnJlY3QiLAogICAgIm5hbWUiOiAib2ZDb3JyZWN0IiwKICAgICJ0eXBlIjogInRleHQiLAogICAgImRlZmF1bHQiOiAiQHNjb3JlIG9mIEB0b3RhbCBjb3JyZWN0IiwKICAgICJpbXBvcnRhbmNlIjogImxvdyIsCiAgICAiZGVzY3JpcHRpb24iOiAiUmVzdWx0IHRleHQsIHZhcmlhYmxlcyBhdmFpbGFibGU6IEBzY29yZSBhbmQgQHRvdGFsLiBFeGFtcGxlOiAnQHNjb3JlIG9mIEB0b3RhbCBjb3JyZWN0JyIsCiAgICAiY29tbW9uIjogdHJ1ZQogIH0sCiAgewogICAgImxhYmVsIjogIlRleHQgZm9yIHNob3cgcmVzdWx0cyIsCiAgICAibmFtZSI6ICJzaG93UmVzdWx0cyIsCiAgICAidHlwZSI6ICJ0ZXh0IiwKICAgICJkZWZhdWx0IjogIlNob3cgcmVzdWx0cyIsCiAgICAiaW1wb3J0YW5jZSI6ICJsb3ciLAogICAgImNvbW1vbiI6IHRydWUKICB9LAogIHsKICAgICJsYWJlbCI6ICJUZXh0IGZvciBzaG9ydCBhbnN3ZXIgbGFiZWwiLAogICAgIm5hbWUiOiAiYW5zd2VyU2hvcnRUZXh0IiwKICAgICJ0eXBlIjogInRleHQiLAogICAgImRlZmF1bHQiOiAiQToiLAogICAgImltcG9ydGFuY2UiOiAibG93IiwKICAgICJjb21tb24iOiB0cnVlCiAgfSwKICB7CiAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJyZXRyeVwiIGJ1dHRvbiIsCiAgICAibmFtZSI6ICJyZXRyeSIsCiAgICAidHlwZSI6ICJ0ZXh0IiwKICAgICJkZWZhdWx0IjogIlJldHJ5IiwKICAgICJpbXBvcnRhbmNlIjogImxvdyIsCiAgICAiY29tbW9uIjogdHJ1ZQogIH0sCiAgewogICAgImxhYmVsIjogIkNhc2Ugc2Vuc2l0aXZlIiwKICAgICJuYW1lIjogImNhc2VTZW5zaXRpdmUiLAogICAgInR5cGUiOiAiYm9vbGVhbiIsCiAgICAiZGVmYXVsdCI6IGZhbHNlLAogICAgImRlc2NyaXB0aW9uIjogIk1ha2VzIHN1cmUgdGhlIHVzZXIgaW5wdXQgaGFzIHRvIGJlIGV4YWN0bHkgdGhlIHNhbWUgYXMgdGhlIGFuc3dlci4iCiAgfSwKICB7CiAgICAibGFiZWwiOiAiSW5jb3JyZWN0IHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgIm5hbWUiOiAiY2FyZEFubm91bmNlbWVudCIsCiAgICAidHlwZSI6ICJ0ZXh0IiwKICAgICJkZWZhdWx0IjogIkluY29ycmVjdCBhbnN3ZXIuIENvcnJlY3QgYW5zd2VyIHdhcyBAYW5zd2VyIiwKICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcy4gVXNlIEBhbnN3ZXIgYXMgdmFyaWFibGUuIiwKICAgICJjb21tb24iOiB0cnVlCiAgfSwKICB7CiAgICAibGFiZWwiOiAiQ29ycmVjdCBmZWVkYmFjayB0ZXh0IGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICJuYW1lIjogImNvcnJlY3RBbnN3ZXJBbm5vdW5jZW1lbnQiLAogICAgInR5cGUiOiAidGV4dCIsCiAgICAiZGVmYXVsdCI6ICJAYW5zd2VyIGlzIGNvcnJlY3QuIiwKICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHRoYXQgd2lsbCBiZSBhbm5vdW5jZWQgdG8gYXNzaXN0aXZlIHRlY2hub2xvZ2llcyB3aGVuIGEgY2FyZCBpcyBhbnN3ZXJlZCBjb3JyZWN0bHkuIFVzZSBAYW5zd2VyIGFzIHZhcmlhYmxlLiIsCiAgICAiY29tbW9uIjogdHJ1ZQogIH0sCiAgewogICAgImxhYmVsIjogIkNhcmQgY2hhbmdlIGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICJuYW1lIjogInBhZ2VBbm5vdW5jZW1lbnQiLAogICAgInR5cGUiOiAidGV4dCIsCiAgICAiZGVmYXVsdCI6ICJQYWdlIEBjdXJyZW50IG9mIEB0b3RhbCIsCiAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB0aGF0IHdpbGwgYmUgYW5ub3VuY2VkIHRvIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMgd2hlbiBuYXZpZ2F0aW5nIGJldHdlZW4gY2FyZHMuIFVzZSBAY3VycmVudCBhbmQgQHRvdGFsIGFzIHZhcmlhYmxlcy4iLAogICAgImNvbW1vbiI6IHRydWUKICB9LAogIHsKICAgICJuYW1lIjogInJhbmRvbUNhcmRzIiwKICAgICJ0eXBlIjogImJvb2xlYW4iLAogICAgImxhYmVsIjogIlJhbmRvbWl6ZSBjYXJkcyIsCiAgICAiaW1wb3J0YW5jZSI6ICJsb3ciLAogICAgImRlc2NyaXB0aW9uIjogIkVuYWJsZSB0byByYW5kb21pemUgdGhlIG9yZGVyIG9mIGNhcmRzIG9uIGRpc3BsYXkuIiwKICAgICJkZWZhdWx0IjogZmFsc2UKICB9Cl0K"],"libraries\/H5P.FontIcons-1.0\/library.json":["application\/json","ewogICJ0aXRsZSI6ICJINVAuRm9udEljb25zIiwKICAibWFqb3JWZXJzaW9uIjogMSwKICAibWlub3JWZXJzaW9uIjogMCwKICAicGF0Y2hWZXJzaW9uIjogNiwKICAicnVubmFibGUiOiAwLAogICJtYWNoaW5lTmFtZSI6ICJINVAuRm9udEljb25zIiwKICAiYXV0aG9yIjogIkpvdWJlbCIsCiAgInByZWxvYWRlZENzcyI6IFsKICAgIHsKICAgICAgInBhdGgiOiAic3R5bGVzL2g1cC1mb250LWljb25zLmNzcyIKICAgIH0KICBdCn0K"],"libraries\/H5P.JoubelUI-1.3\/library.json":["application\/json","ewogICJ0aXRsZSI6ICJKb3ViZWwgVUkiLAogICJjb250ZW50VHlwZSI6ICJVdGlsaXR5IiwKICAiZGVzY3JpcHRpb24iOiAiVUkgdXRpbGl0eSBsaWJyYXJ5IiwKICAibWFqb3JWZXJzaW9uIjogMSwKICAibWlub3JWZXJzaW9uIjogMywKICAicGF0Y2hWZXJzaW9uIjogMTksCiAgInJ1bm5hYmxlIjogMCwKICAiY29yZUFwaSI6IHsKICAgICJtYWpvclZlcnNpb24iOiAxLAogICAgIm1pbm9yVmVyc2lvbiI6IDMKICB9LAogICJtYWNoaW5lTmFtZSI6ICJINVAuSm91YmVsVUkiLAogICJhdXRob3IiOiAiSm91YmVsIiwKICAicHJlbG9hZGVkSnMiOiBbCiAgICB7CiAgICAgICJwYXRoIjogImpzL2pvdWJlbC1oZWxwLWRpYWxvZy5qcyIKICAgIH0sCiAgICB7CiAgICAgICJwYXRoIjogImpzL2pvdWJlbC1tZXNzYWdlLWRpYWxvZy5qcyIKICAgIH0sCiAgICB7CiAgICAgICJwYXRoIjogImpzL2pvdWJlbC1wcm9ncmVzcy1jaXJjbGUuanMiCiAgICB9LAogICAgewogICAgICAicGF0aCI6ICJqcy9qb3ViZWwtc2ltcGxlLXJvdW5kZWQtYnV0dG9uLmpzIgogICAgfSwKICAgIHsKICAgICAgInBhdGgiOiAianMvam91YmVsLXNwZWVjaC1idWJibGUuanMiCiAgICB9LAogICAgewogICAgICAicGF0aCI6ICJqcy9qb3ViZWwtdGhyb2JiZXIuanMiCiAgICB9LAogICAgewogICAgICAicGF0aCI6ICJqcy9qb3ViZWwtdGlwLmpzIgogICAgfSwKICAgIHsKICAgICAgInBhdGgiOiAianMvam91YmVsLXNsaWRlci5qcyIKICAgIH0sCiAgICB7CiAgICAgICJwYXRoIjogImpzL2pvdWJlbC1zY29yZS1iYXIuanMiCiAgICB9LAogICAgewogICAgICAicGF0aCI6ICJqcy9qb3ViZWwtcHJvZ3Jlc3NiYXIuanMiCiAgICB9LAogICAgewogICAgICAicGF0aCI6ICJqcy9qb3ViZWwtdWkuanMiCiAgICB9CiAgXSwKICAicHJlbG9hZGVkQ3NzIjogWwogICAgewogICAgICAicGF0aCI6ICJjc3Mvam91YmVsLWhlbHAtZGlhbG9nLmNzcyIKICAgIH0sCiAgICB7CiAgICAgICJwYXRoIjogImNzcy9qb3ViZWwtbWVzc2FnZS1kaWFsb2cuY3NzIgogICAgfSwKICAgIHsKICAgICAgInBhdGgiOiAiY3NzL2pvdWJlbC1wcm9ncmVzcy1jaXJjbGUuY3NzIgogICAgfSwKICAgIHsKICAgICAgInBhdGgiOiAiY3NzL2pvdWJlbC1zaW1wbGUtcm91bmRlZC1idXR0b24uY3NzIgogICAgfSwKICAgIHsKICAgICAgInBhdGgiOiAiY3NzL2pvdWJlbC1zcGVlY2gtYnViYmxlLmNzcyIKICAgIH0sCiAgICB7CiAgICAgICJwYXRoIjogImNzcy9qb3ViZWwtdGlwLmNzcyIKICAgIH0sCiAgICB7CiAgICAgICJwYXRoIjogImNzcy9qb3ViZWwtc2xpZGVyLmNzcyIKICAgIH0sCiAgICB7CiAgICAgICJwYXRoIjogImNzcy9qb3ViZWwtc2NvcmUtYmFyLmNzcyIKICAgIH0sCiAgICB7CiAgICAgICJwYXRoIjogImNzcy9qb3ViZWwtcHJvZ3Jlc3NiYXIuY3NzIgogICAgfSwKICAgIHsKICAgICAgInBhdGgiOiAiY3NzL2pvdWJlbC11aS5jc3MiCiAgICB9LAogICAgewogICAgICAicGF0aCI6ICJjc3Mvam91YmVsLWljb24uY3NzIgogICAgfQogIF0sCiAgInByZWxvYWRlZERlcGVuZGVuY2llcyI6IFsKICAgIHsKICAgICAgIm1hY2hpbmVOYW1lIjogIkZvbnRBd2Vzb21lIiwKICAgICAgIm1ham9yVmVyc2lvbiI6IDQsCiAgICAgICJtaW5vclZlcnNpb24iOiA1CiAgICB9LAogICAgewogICAgICAibWFjaGluZU5hbWUiOiAiSDVQLlRyYW5zaXRpb24iLAogICAgICAibWFqb3JWZXJzaW9uIjogMSwKICAgICAgIm1pbm9yVmVyc2lvbiI6IDAKICAgIH0sCiAgICB7CiAgICAgICJtYWNoaW5lTmFtZSI6ICJINVAuRm9udEljb25zIiwKICAgICAgIm1ham9yVmVyc2lvbiI6IDEsCiAgICAgICJtaW5vclZlcnNpb24iOiAwCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Transition-1.0\/library.json":["application\/json","ewogICJtYWNoaW5lTmFtZSI6ICJINVAuVHJhbnNpdGlvbiIsCiAgInRpdGxlIjogIlRyYW5zaXRpb24iLAogICJkZXNjcmlwdGlvbiI6ICJDb250YWlucyBoZWxwZXIgZnVuY3Rpb24gcmVsZXZhbnQgZm9yIHRyYW5zaXRpb25pbmciLAogICJsaWNlbnNlIjogIk1JVCIsCiAgImF1dGhvciI6ICJKb3ViZWwiLAogICJtYWpvclZlcnNpb24iOiAxLAogICJtaW5vclZlcnNpb24iOiAwLAogICJwYXRjaFZlcnNpb24iOiA0LAogICJydW5uYWJsZSI6IDAsCiAgInByZWxvYWRlZEpzIjogWwogICAgewogICAgICAicGF0aCI6ICJ0cmFuc2l0aW9uLmpzIgogICAgfQogIF0KfQ=="]});		H5PIntegration	= (function(x){
			let url	= window.location.href.split('/');
			url.pop();
			x.url	= url.join('/');
			return x;
		})({"baseUrl":"","url":"","siteUrl":"","l10n":{"H5P":{"fullscreen":"Vollbild","disableFullscreen":"Kein Vollbild","download":"Download","copyrights":"Nutzungsrechte","embed":"Einbetten","size":"Size","showAdvanced":"Show advanced","hideAdvanced":"Hide advanced","advancedHelp":"Include this script on your website if you want dynamic sizing of the embedded content:","copyrightInformation":"Nutzungsrechte","close":"Schlie\u00dfen","title":"Titel","author":"Autor","year":"Jahr","source":"Quelle","license":"Lizenz","thumbnail":"Thumbnail","noCopyrights":"Keine Copyright-Informationen vorhanden","reuse":"Wiederverwenden","reuseContent":"Verwende Inhalt","reuseDescription":"Verwende Inhalt.","downloadDescription":"Lade den Inhalt als H5P-Datei herunter.","copyrightsDescription":"Zeige Urheberinformationen an.","embedDescription":"Zeige den Code f\u00fcr die Einbettung an.","h5pDescription":"Visit H5P.org to check out more cool content.","contentChanged":"Dieser Inhalt hat sich seit Ihrer letzten Nutzung ver\u00e4ndert.","startingOver":"Sie beginnen von vorne.","by":"von","showMore":"Zeige mehr","showLess":"Zeige weniger","subLevel":"Sublevel","confirmDialogHeader":"Best\u00e4tige Aktion","confirmDialogBody":"Please confirm that you wish to proceed. This action is not reversible.","cancelLabel":"Abbrechen","confirmLabel":"Best\u00e4tigen","licenseU":"Undisclosed","licenseCCBY":"Attribution","licenseCCBYSA":"Attribution-ShareAlike","licenseCCBYND":"Attribution-NoDerivs","licenseCCBYNC":"Attribution-NonCommercial","licenseCCBYNCSA":"Attribution-NonCommercial-ShareAlike","licenseCCBYNCND":"Attribution-NonCommercial-NoDerivs","licenseCC40":"4.0 International","licenseCC30":"3.0 Unported","licenseCC25":"2.5 Generic","licenseCC20":"2.0 Generic","licenseCC10":"1.0 Generic","licenseGPL":"General Public License","licenseV3":"Version 3","licenseV2":"Version 2","licenseV1":"Version 1","licensePD":"Public Domain","licenseCC010":"CC0 1.0 Universal (CC0 1.0) Public Domain Dedication","licensePDM":"Public Domain Mark","licenseC":"Copyright","contentType":"Inhaltstyp","licenseExtras":"License Extras","changes":"Changelog","contentCopied":"Inhalt wurde ins Clipboard kopiert","connectionLost":"Connection lost. Results will be stored and sent when you regain connection.","connectionReestablished":"Connection reestablished.","resubmitScores":"Attempting to submit stored results.","offlineDialogHeader":"Your connection to the server was lost","offlineDialogBody":"We were unable to send information about your completion of this task. Please check your internet connection.","offlineDialogRetryMessage":"Versuche es wieder in :num....","offlineDialogRetryButtonLabel":"Jetzt nochmal probieren","offlineSuccessfulSubmit":"Erfolgreich Ergebnisse gesendet."}},"hubIsEnabled":false,"reportingIsEnabled":false,"libraryConfig":null,"crossorigin":null,"crossoriginCacheBuster":null,"pluginCacheBuster":"","libraryUrl":".\/libraries\/h5pcore\/js","contents":{"cid-do-039-s-and-don-039-t-with-the-computer-688":{"displayOptions":{"copy":false,"copyright":false,"embed":false,"export":false,"frame":false,"icon":false},"embedCode":"","exportUrl":false,"fullScreen":false,"contentUserData":[],"metadata":{"title":"Do's and don'ts with the computer","license":"U"},"library":"H5P.Flashcards 1.7","jsonContent":"{\"cards\":[{\"text\":\"You should not _____ near the computer.\",\"answer\":\"eat\\\/drink\",\"tip\":\"\",\"image\":{\"path\":\"images\\\/image-60e851676e9ae.jpeg\",\"mime\":\"image\\\/jpeg\",\"copyright\":{\"license\":\"U\"},\"width\":612,\"height\":792}},{\"tip\":\"\",\"text\":\"You should press the key of the keyboard ______ .\",\"answer\":\"gently\\\/lightly\\\/softly\",\"image\":{\"path\":\"images\\\/image-60e86c9155578.png\",\"mime\":\"image\\\/png\",\"copyright\":{\"license\":\"U\"},\"width\":727,\"height\":673}},{\"text\":\"Do not ____ the power cables and power socket because it can give you electric shock.\",\"tip\":\"\",\"image\":{\"path\":\"images\\\/image-60e857ee2f088.jpg\",\"mime\":\"image\\\/jpeg\",\"copyright\":{\"license\":\"U\"},\"width\":390,\"height\":326},\"answer\":\"pull\\\/touch\"},{\"text\":\"You need to keep your computer ____ .\",\"tip\":\"\",\"answer\":\"clean\\\/tidy\",\"image\":{\"path\":\"images\\\/image-60e86fa932cdb.png\",\"mime\":\"image\\\/png\",\"copyright\":{\"license\":\"U\"},\"width\":379,\"height\":279}},{\"tip\":\"\",\"image\":{\"path\":\"images\\\/image-60e869ffbce61.png\",\"mime\":\"image\\\/png\",\"copyright\":{\"license\":\"U\"},\"width\":600,\"height\":279},\"text\":\"Choose the image with the correct posture. [A or B]\",\"answer\":\"A\"},{\"text\":\"You should _____ computer after use. [shut down\\\/turn on]\",\"tip\":\"\",\"image\":{\"path\":\"images\\\/image-60e8997e4de68.png\",\"mime\":\"image\\\/png\",\"copyright\":{\"license\":\"U\"},\"width\":237,\"height\":218},\"answer\":\"shut down\"},{\"text\":\"Do not ______ any software or modify or delete any system files on any lab computers. [download\\\/deliver]\",\"tip\":\"\",\"answer\":\"download\",\"image\":{\"path\":\"images\\\/image-60e89f68f3b50.png\",\"mime\":\"image\\\/png\",\"copyright\":{\"license\":\"U\"},\"width\":803,\"height\":750}},{\"text\":\"_____ the computer when it is not in use. [Cover\\\/Uncover]\",\"answer\":\"Cover\",\"image\":{\"path\":\"images\\\/image-60e8a1268a36f.png\",\"mime\":\"image\\\/png\",\"copyright\":{\"license\":\"U\"},\"width\":1246,\"height\":642},\"tip\":\"\"},{\"text\":\"While using a computer, you should sit in a proper _____ . [posture\\\/direction]\",\"answer\":\"posture\",\"image\":{\"path\":\"images\\\/image-60e8a4a028f9e.png\",\"mime\":\"image\\\/png\",\"copyright\":{\"license\":\"U\"},\"width\":1000,\"height\":1033},\"tip\":\"\"},{\"text\":\"You should _____ your computer with your friends. [share\\\/not share]\",\"answer\":\"share\",\"image\":{\"path\":\"images\\\/image-60e8a684ad5a7.png\",\"mime\":\"image\\\/png\",\"copyright\":{\"license\":\"U\"},\"width\":800,\"height\":621},\"tip\":\"\"}],\"progressText\":\"Card @card of @total\",\"next\":\"Next\",\"previous\":\"Previous\",\"checkAnswerText\":\"Check\",\"showSolutionsRequiresInput\":true,\"defaultAnswerText\":\"Your answer\",\"correctAnswerText\":\"Correct\",\"incorrectAnswerText\":\"Incorrect\",\"showSolutionText\":\"Correct answer\",\"results\":\"Results\",\"ofCorrect\":\"@score of @total correct\",\"showResults\":\"Show results\",\"answerShortText\":\"A:\",\"retry\":\"Retry\",\"caseSensitive\":false,\"cardAnnouncement\":\"Incorrect answer. Correct answer was @answer\",\"pageAnnouncement\":\"Page @current of @total\",\"description\":\"Look at the images and questions to answer correctly.\",\"correctAnswerAnnouncement\":\"@answer is correct.\",\"randomCards\":true}"}}});