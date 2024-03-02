H5P.AdvancedText = (function ($, EventDispatcher) {

  /**
   * A simple library for displaying text with advanced styling.
   *
   * @class H5P.AdvancedText
   * @param {Object} parameters
   * @param {Object} [parameters.text='New text']
   * @param {number} id
   */
  function AdvancedText(parameters, id) {
    var self = this;
    EventDispatcher.call(this);

    var html = (parameters.text === undefined ? '<em>New text</em>' : parameters.text);

    /**
     * Wipe container and add text html.
     *
     * @alias H5P.AdvancedText#attach
     * @param {H5P.jQuery} $container
     */
    self.attach = function ($container) {
      $container.addClass('h5p-advanced-text').html(html);
    };
  }

  AdvancedText.prototype = Object.create(EventDispatcher.prototype);
  AdvancedText.prototype.constructor = AdvancedText;

  return AdvancedText;

})(H5P.jQuery, H5P.EventDispatcher);
;H5P.Column = (function (EventDispatcher) {

  /**
   * Column Constructor
   *
   * @class
   * @param {Object} params Describes task behavior
   * @param {number} id Content identifier
   * @param {Object} data User specific data to adapt behavior
   */
  function Column(params, id, data) {
    /** @alias H5P.Column# */
    var self = this;

    // We support events by extending this class
    EventDispatcher.call(self);

    // Add defaults
    params = params || {};
    if (params.useSeparators === undefined) {
      params.useSeparators = true;
    }

    this.contentData = data;

    // Column wrapper element
    var wrapper;

    // H5P content in the column
    var instances = [];
    var instanceContainers = [];

    // Number of tasks among instances
    var numTasks = 0;

    // Number of tasks that has been completed
    var numTasksCompleted = 0;

    // Keep track of result for each task
    var tasksResultEvent = [];

    // Keep track of last content's margin state
    var previousHasMargin;

    /**
     * Calculate score and trigger completed event.
     *
     * @private
     */
    var completed = function () {
      // Sum all scores
      var raw = 0;
      var max = 0;

      for (var i = 0; i < tasksResultEvent.length; i++) {
        var event = tasksResultEvent[i];
        raw += event.getScore();
        max += event.getMaxScore();
      }

      self.triggerXAPIScored(raw, max, 'completed');
    };

    /**
     * Generates an event handler for the given task index.
     *
     * @private
     * @param {number} taskIndex
     * @return {function} xAPI event handler
     */
    var trackScoring = function (taskIndex) {
      return function (event) {
        if (event.getScore() === null) {
          return; // Skip, not relevant
        }

        if (tasksResultEvent[taskIndex] === undefined) {
          // Update number of completed tasks
          numTasksCompleted++;
        }

        // Keep track of latest event with result
        tasksResultEvent[taskIndex] = event;

        // Track progress
        var progressed = self.createXAPIEventTemplate('progressed');
        progressed.data.statement.object.definition.extensions['http://id.tincanapi.com/extension/ending-point'] = taskIndex + 1;
        self.trigger(progressed);

        // Check to see if we're done
        if (numTasksCompleted === numTasks) {
          // Run this after the current event is sent
          setTimeout(function () {
            completed(); // Done
          }, 0);
        }
      };
    };

    /**
     * Creates a new ontent instance from the given content parameters and
     * then attaches it the wrapper. Sets up event listeners.
     *
     * @private
     * @param {Object} content Parameters
     * @param {Object} [contentData] Content Data
     */
    var addRunnable = function (content, contentData) {
      // Create container for content
      var container = document.createElement('div');
      container.classList.add('h5p-column-content');

      // Content overrides
      var library = content.library.split(' ')[0];
      if (library === 'H5P.Video') {
        // Prevent video from growing endlessly since height is unlimited.
        content.params.visuals.fit = false;
      }

      // Create content instance
      var instance = H5P.newRunnable(content, id, undefined, true, contentData);

      // Bubble resize events
      bubbleUp(instance, 'resize', self);

      // Check if instance is a task
      if (Column.isTask(instance)) {
        // Tasks requires completion

        instance.on('xAPI', trackScoring(numTasks));
        numTasks++;
      }

      if (library === 'H5P.Image') {
        // Resize when images are loaded

        instance.on('loaded', function () {
          self.trigger('resize');
        });
      }

      // Keep track of all instances
      instances.push(instance);
      instanceContainers.push({
        hasAttached: false,
        container: container,
        instanceIndex: instances.length - 1,
      });

      // Add to DOM wrapper
      wrapper.appendChild(container);
    };

    /**
     * Help get data for content at given index
     *
     * @private
     * @param {number} index
     * @returns {Object} Data object with previous state
     */
    var grabContentData = function (index) {
      var contentData = {
        parent: self
      };

      if (data.previousState && data.previousState.instances && data.previousState.instances[index]) {
        contentData.previousState = data.previousState.instances[index];
      }

      return contentData;
    };

    /**
     * Adds separator before the next content.
     *
     * @private
     * @param {string} libraryName Name of the next content type
     * @param {string} useSeparator
     */
    var addSeparator = function (libraryName, useSeparator) {
      // Determine separator spacing
      var thisHasMargin = (hasMargins.indexOf(libraryName) !== -1);

      // Only add if previous content exists
      if (previousHasMargin !== undefined) {

        // Create separator element
        var separator = document.createElement('div');
        //separator.classList.add('h5p-column-ruler');

        // If no margins, check for top margin only
        if (!thisHasMargin && (hasTopMargins.indexOf(libraryName) === -1)) {
          if (!previousHasMargin) {
            // None of them have margin

            // Only add separator if forced
            if (useSeparator === 'enabled') {
              // Add ruler
              separator.classList.add('h5p-column-ruler');

              // Add space both before and after the ruler
              separator.classList.add('h5p-column-space-before-n-after');
            }
            else {
              // Default is to separte using a single space, no ruler
              separator.classList.add('h5p-column-space-before');
            }
          }
          else {
            // We don't have any margin but the previous content does

            // Only add separator if forced
            if (useSeparator === 'enabled') {
              // Add ruler
              separator.classList.add('h5p-column-ruler');

              // Add space after the ruler
              separator.classList.add('h5p-column-space-after');
            }
          }
        }
        else if (!previousHasMargin) {
          // We have margin but not the previous content doesn't

          // Only add separator if forced
          if (useSeparator === 'enabled') {
            // Add ruler
            separator.classList.add('h5p-column-ruler');

            // Add space after the ruler
            separator.classList.add('h5p-column-space-before');
          }
        }
        else {
          // Both already have margin

          if (useSeparator !== 'disabled') {
            // Default is to add ruler unless its disabled
            separator.classList.add('h5p-column-ruler');
          }
        }

        // Insert into DOM
        wrapper.appendChild(separator);
      }

      // Keep track of spacing for next separator
      previousHasMargin = thisHasMargin || (hasBottomMargins.indexOf(libraryName) !== -1);
    };

    /**
     * Creates a wrapper and the column content the first time the column
     * is attached to the DOM.
     *
     * @private
     */
    var createHTML = function () {
      // Create wrapper
      wrapper = document.createElement('div');

      // Go though all contents
      for (var i = 0; i < params.content.length; i++) {
        var content = params.content[i];

        // In case the author has created an element without selecting any
        // library
        if (content.content === undefined) {
          continue;
        }

        if (params.useSeparators) { // (check for global override)

          // Add separator between contents
          addSeparator(content.content.library.split(' ')[0], content.useSeparator);
        }

        // Add content
        addRunnable(content.content, grabContentData(i));
      }
    };

    /**
     * Attach the column to the given container
     *
     * @param {H5P.jQuery} $container
     */
    self.attach = function ($container) {
      if (wrapper === undefined) {
        // Create wrapper and content
        createHTML();
      }

      // Attach instances that have not been attached
      instanceContainers.filter(function (container) { return !container.hasAttached })
        .forEach(function (container) {
          instances[container.instanceIndex]
            .attach(H5P.jQuery(container.container));

          // Remove any fullscreen buttons
          disableFullscreen(instances[container.instanceIndex]);
        });


      // Add to DOM
      $container.addClass('h5p-column').html('').append(wrapper);
    };

    /**
     * Create object containing information about the current state
     * of this content.
     *
     * @return {Object}
     */
    self.getCurrentState = function () {
      // Get previous state object or create new state object
      var state = (data.previousState ? data.previousState : {});
      if (!state.instances) {
        state.instances = [];
      }

      // Grab the current state for each instance
      for (var i = 0; i < instances.length; i++) {
        var instance = instances[i];

        if (instance.getCurrentState instanceof Function ||
            typeof instance.getCurrentState === 'function') {

          state.instances[i] = instance.getCurrentState();
        }
      }

      // Done
      return state;
    };

    /**
     * Get xAPI data.
     * Contract used by report rendering engine.
     *
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-6}
     */
    self.getXAPIData = function () {
      var xAPIEvent = self.createXAPIEventTemplate('answered');
      addQuestionToXAPI(xAPIEvent);
      xAPIEvent.setScoredResult(self.getScore(),
        self.getMaxScore(),
        self,
        true,
        self.getScore() === self.getMaxScore()
      );
      return {
        statement: xAPIEvent.data.statement,
        children: getXAPIDataFromChildren(instances)
      };
    };

    /**
     * Get score for all children
     * Contract used for getting the complete score of task.
     *
     * @return {number} Score for questions
     */
    self.getScore = function () {
      return instances.reduce(function (prev, instance) {
        return prev + (instance.getScore ? instance.getScore() : 0);
      }, 0);
    };

    /**
     * Get maximum score possible for all children instances
     * Contract.
     *
     * @return {number} Maximum score for questions
     */
    self.getMaxScore = function () {
      return instances.reduce(function (prev, instance) {
        return prev + (instance.getMaxScore ? instance.getMaxScore() : 0);
      }, 0);
    };

    /**
     * Get answer given
     * Contract.
     *
     * @return {boolean} True, if all answers have been given.
     */
    self.getAnswerGiven = function () {
      return instances.reduce(function (prev, instance) {
        return prev && (instance.getAnswerGiven ? instance.getAnswerGiven() : prev);
      }, true);
    };

    /**
     * Show solutions.
     * Contract.
     */
    self.showSolutions = function () {
      instances.forEach(function (instance) {
        if (instance.toggleReadSpeaker) {
          instance.toggleReadSpeaker(true);
        }
        if (instance.showSolutions) {
          instance.showSolutions();
        }
        if (instance.toggleReadSpeaker) {
          instance.toggleReadSpeaker(false);
        }
      });
    };

    /**
     * Reset task.
     * Contract.
     */
    self.resetTask = function () {
      instances.forEach(function (instance) {
        if (instance.resetTask) {
          instance.resetTask();
        }
      });
    };

    /**
     * Get instances for all children
     * TODO: This is not a good interface, we should provide handling needed
     * handling of the tasks instead of repeating them for each parent...
     *
     * @return {Object[]} array of instances
     */
    self.getInstances = function () {
      return instances;
    };

    /**
     * Get title, e.g. for xAPI when Column is subcontent.
     *
     * @return {string} Title.
     */
    self.getTitle = function () {
      return H5P.createTitle((self.contentData && self.contentData.metadata && self.contentData.metadata.title) ? self.contentData.metadata.title : 'Column');
    };

    /**
     * Add the question itself to the definition part of an xAPIEvent
     */
    var addQuestionToXAPI = function (xAPIEvent) {
      var definition = xAPIEvent.getVerifiedStatementValue(['object', 'definition']);
      H5P.jQuery.extend(definition, getxAPIDefinition());
    };

    /**
     * Generate xAPI object definition used in xAPI statements.
     * @return {Object}
     */
    var getxAPIDefinition = function () {
      var definition = {};

      definition.interactionType = 'compound';
      definition.type = 'http://adlnet.gov/expapi/activities/cmi.interaction';
      definition.description = {
        'en-US': ''
      };

      return definition;
    };

    /**
     * Get xAPI data from sub content types
     *
     * @param {Array} of H5P instances
     * @returns {Array} of xAPI data objects used to build a report
     */
    var getXAPIDataFromChildren = function (children) {
      return children.map(function (child) {
        if (typeof child.getXAPIData == 'function') {
          return child.getXAPIData();
        }
      }).filter(function (data) {
        return !!data;
      });
    };

    // Resize children to fit inside parent
    bubbleDown(self, 'resize', instances);

    if (wrapper === undefined) {
      // Create wrapper and content
      createHTML();
    }

    self.setActivityStarted();
  }

  Column.prototype = Object.create(EventDispatcher.prototype);
  Column.prototype.constructor = Column;

  /**
   * Makes it easy to bubble events from parent to children
   *
   * @private
   * @param {Object} origin Origin of the Event
   * @param {string} eventName Name of the Event
   * @param {Array} targets Targets to trigger event on
   */
  function bubbleDown(origin, eventName, targets) {
    origin.on(eventName, function (event) {
      if (origin.bubblingUpwards) {
        return; // Prevent send event back down.
      }

      for (var i = 0; i < targets.length; i++) {
        targets[i].trigger(eventName, event);
      }
    });
  }

  /**
   * Makes it easy to bubble events from child to parent
   *
   * @private
   * @param {Object} origin Origin of the Event
   * @param {string} eventName Name of the Event
   * @param {Object} target Target to trigger event on
   */
  function bubbleUp(origin, eventName, target) {
    origin.on(eventName, function (event) {
      // Prevent target from sending event back down
      target.bubblingUpwards = true;

      // Trigger event
      target.trigger(eventName, event);

      // Reset
      target.bubblingUpwards = false;
    });
  }

  /**
   * Definition of which content types are tasks
   */
  var isTasks = [
    'H5P.ImageHotspotQuestion',
    'H5P.Blanks',
    'H5P.Essay',
    'H5P.SingleChoiceSet',
    'H5P.MultiChoice',
    'H5P.TrueFalse',
    'H5P.DragQuestion',
    'H5P.Summary',
    'H5P.DragText',
    'H5P.MarkTheWords',
    'H5P.MemoryGame',
    'H5P.QuestionSet',
    'H5P.InteractiveVideo',
    'H5P.CoursePresentation',
    'H5P.DocumentationTool',
    'H5P.MultiMediaChoice'
  ];

  /**
   * Check if the given content instance is a task (will give a score)
   *
   * @param {Object} instance
   * @return {boolean}
   */
  Column.isTask = function (instance) {
    if (instance.isTask !== undefined) {
      return instance.isTask; // Content will determine self if it's a task
    }

    // Go through the valid task names
    for (var i = 0; i < isTasks.length; i++) {
      // Check against library info. (instanceof is broken in H5P.newRunnable)
      if (instance.libraryInfo.machineName === isTasks[i]) {
        return true;
      }
    }

    return false;
  }

  /**
   * Definition of which content type have margins
   */
  var hasMargins = [
    'H5P.AdvancedText',
    'H5P.AudioRecorder',
    'H5P.Essay',
    'H5P.Link',
    'H5P.Accordion',
    'H5P.Table',
    'H5P.GuessTheAnswer',
    'H5P.Blanks',
    'H5P.MultiChoice',
    'H5P.TrueFalse',
    'H5P.DragQuestion',
    'H5P.Summary',
    'H5P.DragText',
    'H5P.MarkTheWords',
    'H5P.ImageHotspotQuestion',
    'H5P.MemoryGame',
    'H5P.Dialogcards',
    'H5P.QuestionSet',
    'H5P.DocumentationTool'
  ];

  /**
   * Definition of which content type have top margins
   */
  var hasTopMargins = [
    'H5P.SingleChoiceSet'
  ];

  /**
   * Definition of which content type have bottom margins
   */
  var hasBottomMargins = [
    'H5P.CoursePresentation',
    'H5P.Dialogcards',
    'H5P.GuessTheAnswer',
    'H5P.ImageSlider'
  ];

  /**
   * Remove custom fullscreen buttons from sub content.
   * (A bit of a hack, there should have been some sort of override…)
   *
   * @param {Object} instance
   */
  function disableFullscreen(instance) {
    switch (instance.libraryInfo.machineName) {
      case 'H5P.CoursePresentation':
        if (instance.$fullScreenButton) {
          instance.$fullScreenButton.remove();
        }
        break;

      case 'H5P.InteractiveVideo':
        instance.on('controls', function () {
          if (instance.controls.$fullscreen) {
            instance.controls.$fullscreen.remove();
          }
        });
        break;
    }
  }

  return Column;
})(H5P.EventDispatcher);
;var H5P = H5P || {};

/**
 * Constructor.
 *
 * @param {Object} params Options for this library.
 * @param {Number} id Content identifier
 * @returns {undefined}
 */
(function ($) {
  H5P.Image = function (params, id, extras) {
    H5P.EventDispatcher.call(this);
    this.extras = extras;

    if (params.file === undefined || !(params.file instanceof Object)) {
      this.placeholder = true;
    }
    else {
      this.source = H5P.getPath(params.file.path, id);
      this.width = params.file.width;
      this.height = params.file.height;
    }

    this.alt = (!params.decorative && params.alt !== undefined) ?
      this.stripHTML(this.htmlDecode(params.alt)) :
      '';

    if (params.title !== undefined) {
      this.title = this.stripHTML(this.htmlDecode(params.title));
    }
  };

  H5P.Image.prototype = Object.create(H5P.EventDispatcher.prototype);
  H5P.Image.prototype.constructor = H5P.Image;

  /**
   * Wipe out the content of the wrapper and put our HTML in it.
   *
   * @param {jQuery} $wrapper
   * @returns {undefined}
   */
  H5P.Image.prototype.attach = function ($wrapper) {
    var self = this;
    var source = this.source;

    if (self.$img === undefined) {
      if(self.placeholder) {
        self.$img = $('<div>', {
          width: '100%',
          height: '100%',
          class: 'h5p-placeholder',
          title: this.title === undefined ? '' : this.title,
          on: {
            load: function () {
              self.trigger('loaded');
            }
          }
        });
      } else {
        self.$img = $('<img>', {
          width: '100%',
          height: '100%',
          src: source,
          alt: this.alt,
          title: this.title === undefined ? '' : this.title,
          on: {
            load: function () {
              self.trigger('loaded');
            }
          }
        });
      }
    }

    $wrapper.addClass('h5p-image').html(self.$img);
  };

  /**
   * Retrieve decoded HTML encoded string.
   *
   * @param {string} input HTML encoded string.
   * @returns {string} Decoded string.
   */
  H5P.Image.prototype.htmlDecode = function (input) {
    const dparser = new DOMParser().parseFromString(input, 'text/html');
    return dparser.documentElement.textContent;
  };

  /**
   * Retrieve string without HTML tags.
   *
   * @param {string} input Input string.
   * @returns {string} Output string.
   */
  H5P.Image.prototype.stripHTML = function (html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  return H5P.Image;
}(H5P.jQuery));
;var H5P = H5P || {};
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
;H5P.Tooltip = H5P.Tooltip || function() {};

H5P.Question = (function ($, EventDispatcher, JoubelUI) {

  /**
   * Extending this class make it alot easier to create tasks for other
   * content types.
   *
   * @class H5P.Question
   * @extends H5P.EventDispatcher
   * @param {string} type
   */
  function Question(type) {
    var self = this;

    // Inheritance
    EventDispatcher.call(self);

    // Register default section order
    self.order = ['video', 'image', 'audio', 'introduction', 'content', 'explanation', 'feedback', 'scorebar', 'buttons', 'read'];

    // Keep track of registered sections
    var sections = {};

    // Buttons
    var buttons = {};
    var buttonOrder = [];

    // Wrapper when attached
    var $wrapper;

    // Click element
    var clickElement;

    // ScoreBar
    var scoreBar;

    // Keep track of the feedback's visual status.
    var showFeedback;

    // Keep track of which buttons are scheduled for hiding.
    var buttonsToHide = [];

    // Keep track of which buttons are scheduled for showing.
    var buttonsToShow = [];

    // Keep track of the hiding and showing of buttons.
    var toggleButtonsTimer;
    var toggleButtonsTransitionTimer;
    var buttonTruncationTimer;

    // Keeps track of initialization of question
    var initialized = false;

    /**
     * @type {Object} behaviour Behaviour of Question
     * @property {Boolean} behaviour.disableFeedback Set to true to disable feedback section
     */
    var behaviour = {
      disableFeedback: false,
      disableReadSpeaker: false
    };

    // Keeps track of thumb state
    var imageThumb = true;

    // Keeps track of image transitions
    var imageTransitionTimer;

    // Keep track of whether sections is transitioning.
    var sectionsIsTransitioning = false;

    // Keep track of auto play state
    var disableAutoPlay = false;

    // Feedback transition timer
    var feedbackTransitionTimer;

    // Used when reading messages to the user
    var $read, readText;

    /**
     * Register section with given content.
     *
     * @private
     * @param {string} section ID of the section
     * @param {(string|H5P.jQuery)} [content]
     */
    var register = function (section, content) {
      sections[section] = {};
      var $e = sections[section].$element = $('<div/>', {
        'class': 'h5p-question-' + section,
      });
      if (content) {
        $e[content instanceof $ ? 'append' : 'html'](content);
      }
    };

    /**
     * Update registered section with content.
     *
     * @private
     * @param {string} section ID of the section
     * @param {(string|H5P.jQuery)} content
     */
    var update = function (section, content) {
      if (content instanceof $) {
        sections[section].$element.html('').append(content);
      }
      else {
        sections[section].$element.html(content);
      }
    };

    /**
     * Insert element with given ID into the DOM.
     *
     * @private
     * @param {array|Array|string[]} order
     * List with ordered element IDs
     * @param {string} id
     * ID of the element to be inserted
     * @param {Object} elements
     * Maps ID to the elements
     * @param {H5P.jQuery} $container
     * Parent container of the elements
     */
    var insert = function (order, id, elements, $container) {
      // Try to find an element id should be after
      for (var i = 0; i < order.length; i++) {
        if (order[i] === id) {
          // Found our pos
          while (i > 0 &&
          (elements[order[i - 1]] === undefined ||
          !elements[order[i - 1]].isVisible)) {
            i--;
          }
          if (i === 0) {
            // We are on top.
            elements[id].$element.prependTo($container);
          }
          else {
            // Add after element
            elements[id].$element.insertAfter(elements[order[i - 1]].$element);
          }
          elements[id].isVisible = true;
          break;
        }
      }
    };

    /**
     * Make feedback into a popup and position relative to click.
     *
     * @private
     * @param {string} [closeText] Text for the close button
     */
    var makeFeedbackPopup = function (closeText) {
      var $element = sections.feedback.$element;
      var $parent = sections.content.$element;
      var $click = (clickElement != null ? clickElement.$element : null);

      $element.appendTo($parent).addClass('h5p-question-popup');

      if (sections.scorebar) {
        sections.scorebar.$element.appendTo($element);
      }

      $parent.addClass('h5p-has-question-popup');

      // Draw the tail
      var $tail = $('<div/>', {
        'class': 'h5p-question-feedback-tail'
      }).hide()
        .appendTo($parent);

      // Draw the close button
      var $close = $('<div/>', {
        'class': 'h5p-question-feedback-close',
        'tabindex': 0,
        'title': closeText,
        on: {
          click: function (event) {
            $element.remove();
            $tail.remove();
            event.preventDefault();
          },
          keydown: function (event) {
            switch (event.which) {
              case 13: // Enter
              case 32: // Space
                $element.remove();
                $tail.remove();
                event.preventDefault();
            }
          }
        }
      }).hide().appendTo($element);

      if ($click != null) {
        if ($click.hasClass('correct')) {
          $element.addClass('h5p-question-feedback-correct');
          $close.show();
          sections.buttons.$element.hide();
        }
        else {
          sections.buttons.$element.appendTo(sections.feedback.$element);
        }
      }

      positionFeedbackPopup($element, $click);
    };

    /**
     * Position the feedback popup.
     *
     * @private
     * @param {H5P.jQuery} $element Feedback div
     * @param {H5P.jQuery} $click Visual click div
     */
    var positionFeedbackPopup = function ($element, $click) {
      var $container = $element.parent();
      var $tail = $element.siblings('.h5p-question-feedback-tail');
      var popupWidth = $element.outerWidth();
      var popupHeight = setElementHeight($element);
      var space = 15;
      var disableTail = false;
      var positionY = $container.height() / 2 - popupHeight / 2;
      var positionX = $container.width() / 2 - popupWidth / 2;
      var tailX = 0;
      var tailY = 0;
      var tailRotation = 0;

      if ($click != null) {
        // Edge detection for click, takes space into account
        var clickNearTop = ($click[0].offsetTop < space);
        var clickNearBottom = ($click[0].offsetTop + $click.height() > $container.height() - space);
        var clickNearLeft = ($click[0].offsetLeft < space);
        var clickNearRight = ($click[0].offsetLeft + $click.width() > $container.width() - space);

        // Click is not in a corner or close to edge, calculate position normally
        positionX = $click[0].offsetLeft - popupWidth / 2  + $click.width() / 2;
        positionY = $click[0].offsetTop - popupHeight - space;
        tailX = positionX + popupWidth / 2 - $tail.width() / 2;
        tailY = positionY + popupHeight - ($tail.height() / 2);
        tailRotation = 225;

        // If popup is outside top edge, position under click instead
        if (popupHeight + space > $click[0].offsetTop) {
          positionY = $click[0].offsetTop + $click.height() + space;
          tailY = positionY - $tail.height() / 2 ;
          tailRotation = 45;
        }

        // If popup is outside left edge, position left
        if (positionX < 0) {
          positionX = 0;
        }

        // If popup is outside right edge, position right
        if (positionX + popupWidth > $container.width()) {
          positionX = $container.width() - popupWidth;
        }

        // Special cases such as corner clicks, or close to an edge, they override X and Y positions if met
        if (clickNearTop && (clickNearLeft || clickNearRight)) {
          positionX = $click[0].offsetLeft + (clickNearLeft ? $click.width() : -popupWidth);
          positionY = $click[0].offsetTop + $click.height();
          disableTail = true;
        }
        else if (clickNearBottom && (clickNearLeft || clickNearRight)) {
          positionX = $click[0].offsetLeft + (clickNearLeft ? $click.width() : -popupWidth);
          positionY = $click[0].offsetTop - popupHeight;
          disableTail = true;
        }
        else if (!clickNearTop && !clickNearBottom) {
          if (clickNearLeft || clickNearRight) {
            positionY = $click[0].offsetTop - popupHeight / 2 + $click.width() / 2;
            positionX = $click[0].offsetLeft + (clickNearLeft ? $click.width() + space : -popupWidth + -space);
            // Make sure this does not position the popup off screen
            if (positionX < 0) {
              positionX = 0;
              disableTail = true;
            }
            else {
              tailX = positionX + (clickNearLeft ? - $tail.width() / 2 : popupWidth - $tail.width() / 2);
              tailY = positionY + popupHeight / 2 - $tail.height() / 2;
              tailRotation = (clickNearLeft ? 315 : 135);
            }
          }
        }

        // Contain popup from overflowing bottom edge
        if (positionY + popupHeight > $container.height()) {
          positionY = $container.height() - popupHeight;

          if (popupHeight > $container.height() - ($click[0].offsetTop + $click.height() + space)) {
            disableTail = true;
          }
        }
      }
      else {
        disableTail = true;
      }

      // Contain popup from ovreflowing top edge
      if (positionY < 0) {
        positionY = 0;
      }

      $element.css({top: positionY, left: positionX});
      $tail.css({top: tailY, left: tailX});

      if (!disableTail) {
        $tail.css({
          'left': tailX,
          'top': tailY,
          'transform': 'rotate(' + tailRotation + 'deg)'
        }).show();
      }
      else {
        $tail.hide();
      }
    };

    /**
     * Set element max height, used for animations.
     *
     * @param {H5P.jQuery} $element
     */
    var setElementHeight = function ($element) {
      if (!$element.is(':visible')) {
        // No animation
        $element.css('max-height', 'none');
        return;
      }

      // If this element is shown in the popup, we can't set width to 100%,
      // since it already has a width set in CSS
      var isFeedbackPopup = $element.hasClass('h5p-question-popup');

      // Get natural element height
      var $tmp = $element.clone()
        .css({
          'position': 'absolute',
          'max-height': 'none',
          'width': isFeedbackPopup ? '' : '100%'
        })
        .appendTo($element.parent());

      // Need to take margins into account when calculating available space
      var sideMargins = parseFloat($element.css('margin-left'))
        + parseFloat($element.css('margin-right'));
      var tmpElWidth = $tmp.css('width') ? $tmp.css('width') : '100%';
      $tmp.css('width', 'calc(' + tmpElWidth + ' - ' + sideMargins + 'px)');

      // Apply height to element
      var h = Math.round($tmp.get(0).getBoundingClientRect().height);
      var fontSize = parseFloat($element.css('fontSize'));
      var relativeH = h / fontSize;
      $element.css('max-height', relativeH + 'em');
      $tmp.remove();

      if (h > 0 && sections.buttons && sections.buttons.$element === $element) {
        // Make sure buttons section is visible
        showSection(sections.buttons);

        // Resize buttons after resizing button section
        setTimeout(resizeButtons, 150);
      }
      return h;
    };

    /**
     * Does the actual job of hiding the buttons scheduled for hiding.
     *
     * @private
     * @param {boolean} [relocateFocus] Find a new button to focus
     */
    var hideButtons = function (relocateFocus) {
      for (var i = 0; i < buttonsToHide.length; i++) {
        hideButton(buttonsToHide[i].id);
      }
      buttonsToHide = [];

      if (relocateFocus) {
        self.focusButton();
      }
    };

    /**
     * Does the actual hiding.
     * @private
     * @param {string} buttonId
     */
    var hideButton = function (buttonId) {
      // Using detach() vs hide() makes it harder to cheat.
      buttons[buttonId].$element.detach();
      buttons[buttonId].isVisible = false;
    };

    /**
     * Shows the buttons on the next tick. This is to avoid buttons flickering
     * If they're both added and removed on the same tick.
     *
     * @private
     */
    var toggleButtons = function () {
      // If no buttons section, return
      if (sections.buttons === undefined) {
        return;
      }

      // Clear transition timer, reevaluate if buttons will be detached
      clearTimeout(toggleButtonsTransitionTimer);

      // Show buttons
      for (var i = 0; i < buttonsToShow.length; i++) {
        insert(buttonOrder, buttonsToShow[i].id, buttons, sections.buttons.$element);
        buttons[buttonsToShow[i].id].isVisible = true;
      }
      buttonsToShow = [];

      // Hide buttons
      var numToHide = 0;
      var relocateFocus = false;
      for (var j = 0; j < buttonsToHide.length; j++) {
        var button = buttons[buttonsToHide[j].id];
        if (button.isVisible) {
          numToHide += 1;
        }
        if (button.$element.is(':focus')) {
          // Move focus to the first visible button.
          relocateFocus = true;
        }
      }

      var animationTimer = 150;
      if (sections.feedback && sections.feedback.$element.hasClass('h5p-question-popup')) {
        animationTimer = 0;
      }

      if (numToHide === sections.buttons.$element.children().length) {
        // All buttons are going to be hidden. Hide container using transition.
        hideSection(sections.buttons);
        // Detach buttons
        hideButtons(relocateFocus);
      }
      else {
        hideButtons(relocateFocus);

        // Show button section
        if (!sections.buttons.$element.is(':empty')) {
          showSection(sections.buttons);
          setElementHeight(sections.buttons.$element);

          // Trigger resize after animation
          toggleButtonsTransitionTimer = setTimeout(function () {
            self.trigger('resize');
          }, animationTimer);
        }

        // Resize buttons to fit container
        resizeButtons();
      }

      toggleButtonsTimer = undefined;
    };

    /**
     * Allows for scaling of the question image.
     */
    var scaleImage = function () {
      var $imgSection = sections.image.$element;
      clearTimeout(imageTransitionTimer);

      // Add this here to avoid initial transition of the image making
      // content overflow. Alternatively we need to trigger a resize.
      $imgSection.addClass('animatable');

      if (imageThumb) {

        // Expand image
        $(this).attr('aria-expanded', true);
        $imgSection.addClass('h5p-question-image-fill-width');
        imageThumb = false;

        imageTransitionTimer = setTimeout(function () {
          self.trigger('resize');
        }, 600);
      }
      else {

        // Scale down image
        $(this).attr('aria-expanded', false);
        $imgSection.removeClass('h5p-question-image-fill-width');
        imageThumb = true;

        imageTransitionTimer = setTimeout(function () {
          self.trigger('resize');
        }, 600);
      }
    };

    /**
     * Get scrollable ancestor of element
     *
     * @private
     * @param {H5P.jQuery} $element
     * @param {Number} [currDepth=0] Current recursive calls to ancestor, stop at maxDepth
     * @param {Number} [maxDepth=5] Maximum depth for finding ancestor.
     * @returns {H5P.jQuery} Parent element that is scrollable
     */
    var findScrollableAncestor = function ($element, currDepth, maxDepth) {
      if (!currDepth) {
        currDepth = 0;
      }
      if (!maxDepth) {
        maxDepth = 5;
      }
      // Check validation of element or if we have reached document root
      if (!$element || !($element instanceof $) || document === $element.get(0) || currDepth >= maxDepth) {
        return;
      }

      if ($element.css('overflow-y') === 'auto') {
        return $element;
      }
      else {
        return findScrollableAncestor($element.parent(), currDepth + 1, maxDepth);
      }
    };

    /**
     * Scroll to bottom of Question.
     *
     * @private
     */
    var scrollToBottom = function () {
      if (!$wrapper || ($wrapper.hasClass('h5p-standalone') && !H5P.isFullscreen)) {
        return; // No scroll
      }

      var scrollableAncestor = findScrollableAncestor($wrapper);

      // Scroll to bottom of scrollable ancestor
      if (scrollableAncestor) {
        scrollableAncestor.animate({
          scrollTop: $wrapper.css('height')
        }, "slow");
      }
    };

    /**
     * Resize buttons to fit container width
     *
     * @private
     */
    var resizeButtons = function () {
      if (!buttons || !sections.buttons) {
        return;
      }

      var go = function () {
        // Don't do anything if button elements are not visible yet
        if (!sections.buttons.$element.is(':visible')) {
          return;
        }

        // Width of all buttons
        var buttonsWidth = {
          max: 0,
          min: 0,
          current: 0
        };

        for (var i in buttons) {
          var button = buttons[i];
          if (button.isVisible) {
            setButtonWidth(buttons[i]);
            buttonsWidth.max += button.width.max;
            buttonsWidth.min += button.width.min;
            buttonsWidth.current += button.isTruncated ? button.width.min : button.width.max;
          }
        }

        var makeButtonsFit = function (availableWidth) {
          if (buttonsWidth.max < availableWidth) {
            // It is room for everyone on the right side of the score bar (without truncating)
            if (buttonsWidth.max !== buttonsWidth.current) {
              // Need to make everyone big
              restoreButtonLabels(buttonsWidth.current, availableWidth);
            }
            return true;
          }
          else if (buttonsWidth.min < availableWidth) {
            // Is it room for everyone on the right side of the score bar with truncating?
            if (buttonsWidth.current > availableWidth) {
              removeButtonLabels(buttonsWidth.current, availableWidth);
            }
            else {
              restoreButtonLabels(buttonsWidth.current, availableWidth);
            }
            return true;
          }
          return false;
        };

        toggleFullWidthScorebar(false);

        var buttonSectionWidth = Math.floor(sections.buttons.$element.width()) - 1;

        if (!makeButtonsFit(buttonSectionWidth)) {
          // If we get here we need to wrap:
          toggleFullWidthScorebar(true);
          buttonSectionWidth = Math.floor(sections.buttons.$element.width()) - 1;
          makeButtonsFit(buttonSectionWidth);
        }
      };

      // If visible, resize right away
      if (sections.buttons.$element.is(':visible')) {
        go();
      }
      else { // If not visible, try on the next tick
        // Clear button truncation timer if within a button truncation function
        if (buttonTruncationTimer) {
          clearTimeout(buttonTruncationTimer);
        }
        buttonTruncationTimer = setTimeout(function () {
          buttonTruncationTimer = undefined;
          go();
        }, 0);
      }
    };

    var toggleFullWidthScorebar = function (enabled) {
      if (sections.scorebar &&
          sections.scorebar.$element &&
          sections.scorebar.$element.hasClass('h5p-question-visible')) {
        sections.buttons.$element.addClass('has-scorebar');
        sections.buttons.$element.toggleClass('wrap', enabled);
        sections.scorebar.$element.toggleClass('full-width', enabled);
      }
      else {
        sections.buttons.$element.removeClass('has-scorebar');
      }
    };

    /**
     * Remove button labels until they use less than max width.
     *
     * @private
     * @param {Number} buttonsWidth Total width of all buttons
     * @param {Number} maxButtonsWidth Max width allowed for buttons
     */
    var removeButtonLabels = function (buttonsWidth, maxButtonsWidth) {
      // Reverse traversal
      for (var i = buttonOrder.length - 1; i >= 0; i--) {
        var buttonId = buttonOrder[i];
        var button = buttons[buttonId];
        if (!button.isTruncated && button.isVisible) {
          var $button = button.$element;
          buttonsWidth -= button.width.max - button.width.min;
          // Set tooltip (needed by H5P.Tooltip)
          let buttonText = $button.text();
          $button.attr('data-tooltip', buttonText);

          // Use button text as aria label if a specific one isn't provided
          if (!button.ariaLabel) {
            $button.attr('aria-label', buttonText);
          }
          // Remove label
          $button.html('').addClass('truncated');
          button.isTruncated = true;
          if (buttonsWidth <= maxButtonsWidth) {
            // Buttons are small enough.
            return;
          }
        }
      }
    };

    /**
     * Restore button labels until it fills maximum possible width without exceeding the max width.
     *
     * @private
     * @param {Number} buttonsWidth Total width of all buttons
     * @param {Number} maxButtonsWidth Max width allowed for buttons
     */
    var restoreButtonLabels = function (buttonsWidth, maxButtonsWidth) {
      for (var i = 0; i < buttonOrder.length; i++) {
        var buttonId = buttonOrder[i];
        var button = buttons[buttonId];
        if (button.isTruncated && button.isVisible) {
          // Calculate new total width of buttons with a static pixel for consistency cross-browser
          buttonsWidth += button.width.max - button.width.min + 1;

          if (buttonsWidth > maxButtonsWidth) {
            return;
          }
          // Restore label
          button.$element.html(button.text);

          // Remove tooltip (used by H5P.Tooltip)
          button.$element.removeAttr('data-tooltip');

          // Remove aria-label if a specific one isn't provided
          if (!button.ariaLabel) {
            button.$element.removeAttr('aria-label');
          }

          button.$element.removeClass('truncated');
          button.isTruncated = false;
        }
      }
    };

    /**
     * Helper function for finding index of keyValue in array
     *
     * @param {String} keyValue Value to be found
     * @param {String} key In key
     * @param {Array} array In array
     * @returns {number}
     */
    var existsInArray = function (keyValue, key, array) {
      var i;
      for (i = 0; i < array.length; i++) {
        if (array[i][key] === keyValue) {
          return i;
        }
      }
      return -1;
    };

    /**
     * Show a section
     * @param {Object} section
     */
    var showSection = function (section) {
      section.$element.addClass('h5p-question-visible');
      section.isVisible = true;
    };

    /**
     * Hide a section
     * @param {Object} section
     */
    var hideSection = function (section) {
      section.$element.css('max-height', '');
      section.isVisible = false;

      setTimeout(function () {
        // Only hide if section hasn't been set to visible in the meantime
        if (!section.isVisible) {
          section.$element.removeClass('h5p-question-visible');
        }
      }, 150);
    };

    /**
     * Set behaviour for question.
     *
     * @param {Object} options An object containing behaviour that will be extended by Question
     */
    self.setBehaviour = function (options) {
      $.extend(behaviour, options);
    };

    /**
     * A video to display above the task.
     *
     * @param {object} params
     */
    self.setVideo = function (params) {
      sections.video = {
        $element: $('<div/>', {
          'class': 'h5p-question-video'
        })
      };

      if (disableAutoPlay && params.params.playback) {
        params.params.playback.autoplay = false;
      }

      // Never fit to wrapper
      if (!params.params.visuals) {
        params.params.visuals = {};
      }
      params.params.visuals.fit = false;
      sections.video.instance = H5P.newRunnable(params, self.contentId, sections.video.$element, true);
      var fromVideo = false; // Hack to avoid never ending loop
      sections.video.instance.on('resize', function () {
        fromVideo = true;
        self.trigger('resize');
        fromVideo = false;
      });
      self.on('resize', function () {
        if (!fromVideo) {
          sections.video.instance.trigger('resize');
        }
      });

      return self;
    };

    /**
     * An audio player to display above the task.
     *
     * @param {object} params
     */
    self.setAudio = function (params) {
      params.params = params.params || {};

      sections.audio = {
        $element: $('<div/>', {
          'class': 'h5p-question-audio',
        })
      };

      if (disableAutoPlay) {
        params.params.autoplay = false;
      }
      else if (params.params.playerMode === 'transparent') {
        params.params.autoplay = true; // false doesn't make sense for transparent audio
      }

      sections.audio.instance = H5P.newRunnable(params, self.contentId, sections.audio.$element, true);
      // The height value that is set by H5P.Audio is counter-productive here.
      if (sections.audio.instance.audio) {
        sections.audio.instance.audio.style.height = '';
      }

      return self;
    };

    /**
     * Will stop any playback going on in the task.
     */
    self.pause = function () {
      if (sections.video && sections.video.isVisible) {
        sections.video.instance.pause();
      }
      if (sections.audio && sections.audio.isVisible) {
        sections.audio.instance.pause();
      }
    };

    /**
     * Start playback of video
     */
    self.play = function () {
      if (sections.video && sections.video.isVisible) {
        sections.video.instance.play();
      }
      if (sections.audio && sections.audio.isVisible) {
        sections.audio.instance.play();
      }
    };

    /**
     * Disable auto play, useful in editors.
     */
    self.disableAutoPlay = function () {
      disableAutoPlay = true;
    };

    /**
     * Process HTML escaped string for use as attribute value,
     * e.g. for alt text or title attributes.
     *
     * @param {string} value
     * @return {string} WARNING! Do NOT use for innerHTML.
     */
    self.massageAttributeOutput = function (value) {
      const dparser = new DOMParser().parseFromString(value, 'text/html');
      const div = document.createElement('div');
      div.innerHTML = dparser.documentElement.textContent;;
      return div.textContent || div.innerText || '';
    };

    /**
     * Add task image.
     *
     * @param {string} path Relative
     * @param {Object} [options] Options object
     * @param {string} [options.alt] Text representation
     * @param {string} [options.title] Hover text
     * @param {Boolean} [options.disableImageZooming] Set as true to disable image zooming
     * @param {string} [options.expandImage] Localization strings
     * @param {string} [options.minimizeImage] Localization string

     */
    self.setImage = function (path, options) {
      options = options ? options : {};
      sections.image = {};
      // Image container
      sections.image.$element = $('<div/>', {
        'class': 'h5p-question-image h5p-question-image-fill-width'
      });

      // Inner wrap
      var $imgWrap = $('<div/>', {
        'class': 'h5p-question-image-wrap',
        appendTo: sections.image.$element
      });

      // Image element
      var $img = $('<img/>', {
        src: H5P.getPath(path, self.contentId),
        alt: (options.alt === undefined ? '' : self.massageAttributeOutput(options.alt)),
        title: (options.title === undefined ? '' : self.massageAttributeOutput(options.title)),
        on: {
          load: function () {
            self.trigger('imageLoaded', this);
            self.trigger('resize');
          }
        },
        appendTo: $imgWrap
      });

      // Disable image zooming
      if (options.disableImageZooming) {
        $img.css('maxHeight', 'none');

        // Make sure we are using the correct amount of width at all times
        var determineImgWidth = function () {

          // Remove margins if natural image width is bigger than section width
          var imageSectionWidth = sections.image.$element.get(0).getBoundingClientRect().width;

          // Do not transition, for instant measurements
          $imgWrap.css({
            '-webkit-transition': 'none',
            'transition': 'none'
          });

          // Margin as translateX on both sides of image.
          var diffX = 2 * ($imgWrap.get(0).getBoundingClientRect().left -
            sections.image.$element.get(0).getBoundingClientRect().left);

          if ($img.get(0).naturalWidth >= imageSectionWidth - diffX) {
            sections.image.$element.addClass('h5p-question-image-fill-width');
          }
          else { // Use margin for small res images
            sections.image.$element.removeClass('h5p-question-image-fill-width');
          }

          // Reset transition rules
          $imgWrap.css({
            '-webkit-transition': '',
            'transition': ''
          });
        };

        // Determine image width
        if ($img.is(':visible')) {
          determineImgWidth();
        }
        else {
          $img.on('load', determineImgWidth);
        }

        // Skip adding zoom functionality
        return;
      }

      const setAriaLabel = () => {
        const ariaLabel = $imgWrap.attr('aria-expanded') === 'true'
          ? options.minimizeImage 
          : options.expandImage;
          
          $imgWrap.attr('aria-label', `${ariaLabel} ${options.alt}`);
        };

      var sizeDetermined = false;
      var determineSize = function () {
        if (sizeDetermined || !$img.is(':visible')) {
          return; // Try again next time.
        }

        $imgWrap.addClass('h5p-question-image-scalable')
          .attr('aria-expanded', false)
          .attr('role', 'button')
          .attr('tabIndex', '0')
          .on('click', function (event) {
            if (event.which === 1) {
              scaleImage.apply(this); // Left mouse button click
              setAriaLabel();
            }
          }).on('keypress', function (event) {
            if (event.which === 32) {
              event.preventDefault(); // Prevent default behaviour; page scroll down
              scaleImage.apply(this); // Space bar pressed
              setAriaLabel();
            }
          });

        setAriaLabel();

        sections.image.$element.removeClass('h5p-question-image-fill-width');

        sizeDetermined  = true; // Prevent any futher events
      };

      self.on('resize', determineSize);

      return self;
    };

    /**
     * Add the introduction section.
     *
     * @param {(string|H5P.jQuery)} content
     */
    self.setIntroduction = function (content) {
      register('introduction', content);

      return self;
    };

    /**
     * Add the content section.
     *
     * @param {(string|H5P.jQuery)} content
     * @param {Object} [options]
     * @param {string} [options.class]
     */
    self.setContent = function (content, options) {
      register('content', content);

      if (options && options.class) {
        sections.content.$element.addClass(options.class);
      }

      return self;
    };

    /**
     * Force readspeaker to read text. Useful when you have to use
     * setTimeout for animations.
     */
    self.read = function (content) {
      if (!$read) {
        return; // Not ready yet
      }

      if (readText) {
        // Combine texts if called multiple times
        readText += (readText.substr(-1, 1) === '.' ? ' ' : '. ') + content;
      }
      else {
        readText = content;
      }

      // Set text
      $read.html(readText);

      setTimeout(function () {
        // Stop combining when done reading
        readText = null;
        $read.html('');
      }, 100);
    };

    /**
     * Read feedback
     */
    self.readFeedback = function () {
      var invalidFeedback =
        behaviour.disableReadSpeaker ||
        !showFeedback ||
        !sections.feedback ||
        !sections.feedback.$element;

      if (invalidFeedback) {
        return;
      }

      var $feedbackText = $('.h5p-question-feedback-content-text', sections.feedback.$element);
      if ($feedbackText && $feedbackText.html() && $feedbackText.html().length) {
        self.read($feedbackText.html());
      }
    };

    /**
     * Remove feedback
     *
     * @return {H5P.Question}
     */
    self.removeFeedback = function () {

      clearTimeout(feedbackTransitionTimer);

      if (sections.feedback && showFeedback) {

        showFeedback = false;

        // Hide feedback & scorebar
        hideSection(sections.scorebar);
        hideSection(sections.feedback);

        sectionsIsTransitioning = true;

        // Detach after transition
        feedbackTransitionTimer = setTimeout(function () {
          // Avoiding Transition.onTransitionEnd since it will register multiple events, and there's no way to cancel it if the transition changes back to "show" while the animation is happening.
          if (!showFeedback) {
            sections.feedback.$element.children().detach();
            sections.scorebar.$element.children().detach();

            // Trigger resize after animation
            self.trigger('resize');
          }
          sectionsIsTransitioning = false;
          scoreBar.setScore(0);
        }, 150);

        if ($wrapper) {
          $wrapper.find('.h5p-question-feedback-tail').remove();
        }
      }

      return self;
    };

    /**
     * Set feedback message.
     *
     * @param {string} [content]
     * @param {number} score The score
     * @param {number} maxScore The maximum score for this question
     * @param {string} [scoreBarLabel] Makes it easier for readspeakers to identify the scorebar
     * @param {string} [helpText] Help text that describes the score inside a tip icon
     * @param {object} [popupSettings] Extra settings for popup feedback
     * @param {boolean} [popupSettings.showAsPopup] Should the feedback display as popup?
     * @param {string} [popupSettings.closeText] Translation for close button text
     * @param {object} [popupSettings.click] Element representing where user clicked on screen
     */
    self.setFeedback = function (content, score, maxScore, scoreBarLabel, helpText, popupSettings, scoreExplanationButtonLabel) {
      // Feedback is disabled
      if (behaviour.disableFeedback) {
        return self;
      }

      // Need to toggle buttons right away to avoid flickering/blinking
      // Note: This means content types should invoke hide/showButton before setFeedback
      toggleButtons();

      clickElement = (popupSettings != null && popupSettings.click != null ? popupSettings.click : null);
      clearTimeout(feedbackTransitionTimer);

      var $feedback = $('<div>', {
        'class': 'h5p-question-feedback-container'
      });

      var $feedbackContent = $('<div>', {
        'class': 'h5p-question-feedback-content'
      }).appendTo($feedback);

      // Feedback text
      $('<div>', {
        'class': 'h5p-question-feedback-content-text',
        'html': content
      }).appendTo($feedbackContent);

      var $scorebar = $('<div>', {
        'class': 'h5p-question-scorebar-container'
      });
      if (scoreBar === undefined) {
        scoreBar = JoubelUI.createScoreBar(maxScore, scoreBarLabel, helpText, scoreExplanationButtonLabel);
      }
      scoreBar.appendTo($scorebar);

      $feedbackContent.toggleClass('has-content', content !== undefined && content.length > 0);

      // Feedback for readspeakers
      if (!behaviour.disableReadSpeaker && scoreBarLabel) {
        self.read(scoreBarLabel.replace(':num', score).replace(':total', maxScore) + '. ' + (content ? content : ''));
      }

      showFeedback = true;
      if (sections.feedback) {
        // Update section
        update('feedback', $feedback);
        update('scorebar', $scorebar);
      }
      else {
        // Create section
        register('feedback', $feedback);
        register('scorebar', $scorebar);
        if (initialized && $wrapper) {
          insert(self.order, 'feedback', sections, $wrapper);
          insert(self.order, 'scorebar', sections, $wrapper);
        }
      }

      showSection(sections.feedback);
      showSection(sections.scorebar);

      resizeButtons();

      if (popupSettings != null && popupSettings.showAsPopup == true) {
        makeFeedbackPopup(popupSettings.closeText);
        scoreBar.setScore(score);
      }
      else {
        // Show feedback section
        feedbackTransitionTimer = setTimeout(function () {
          setElementHeight(sections.feedback.$element);
          setElementHeight(sections.scorebar.$element);
          sectionsIsTransitioning = true;

          // Scroll to bottom after showing feedback
          scrollToBottom();

          // Trigger resize after animation
          feedbackTransitionTimer = setTimeout(function () {
            sectionsIsTransitioning = false;
            self.trigger('resize');
            scoreBar.setScore(score);
          }, 150);
        }, 0);
      }

      return self;
    };

    /**
     * Set feedback content (no animation).
     *
     * @param {string} content
     * @param {boolean} [extendContent] True will extend content, instead of replacing it
     */
    self.updateFeedbackContent = function (content, extendContent) {
      if (sections.feedback && sections.feedback.$element) {

        if (extendContent) {
          content = $('.h5p-question-feedback-content', sections.feedback.$element).html() + ' ' + content;
        }

        // Update feedback content html
        $('.h5p-question-feedback-content', sections.feedback.$element).html(content).addClass('has-content');

        // Make sure the height is correct
        setElementHeight(sections.feedback.$element);

        // Need to trigger resize when feedback has finished transitioning
        setTimeout(self.trigger.bind(self, 'resize'), 150);
      }

      return self;
    };

    /**
     * Set the content of the explanation / feedback panel
     *
     * @param {Object} data
     * @param {string} data.correct
     * @param {string} data.wrong
     * @param {string} data.text
     * @param {string} title Title for explanation panel
     *
     * @return {H5P.Question}
     */
    self.setExplanation = function (data, title) {
      if (data) {
        var explainer = new H5P.Question.Explainer(title, data);

        if (sections.explanation) {
          // Update section
          update('explanation', explainer.getElement());
        }
        else {
          register('explanation', explainer.getElement());

          if (initialized && $wrapper) {
            insert(self.order, 'explanation', sections, $wrapper);
          }
        }
      }
      else if (sections.explanation) {
        // Hide explanation section
        sections.explanation.$element.children().detach();
      }

      return self;
    };

    /**
     * Checks to see if button is registered.
     *
     * @param {string} id
     * @returns {boolean}
     */
    self.hasButton = function (id) {
      return (buttons[id] !== undefined);
    };

    /**
     * @typedef {Object} ConfirmationDialog
     * @property {boolean} [enable] Must be true to show confirmation dialog
     * @property {Object} [instance] Instance that uses confirmation dialog
     * @property {jQuery} [$parentElement] Append to this element.
     * @property {Object} [l10n] Translatable fields
     * @property {string} [l10n.header] Header text
     * @property {string} [l10n.body] Body text
     * @property {string} [l10n.cancelLabel]
     * @property {string} [l10n.confirmLabel]
     */

    /**
     * Register buttons for the task.
     *
     * @param {string} id
     * @param {string} text label
     * @param {function} clicked
     * @param {boolean} [visible=true]
     * @param {Object} [options] Options for button
     * @param {Object} [extras] Extra options
     * @param {ConfirmationDialog} [extras.confirmationDialog] Confirmation dialog
     * @param {Object} [extras.contentData] Content data
     * @params {string} [extras.textIfSubmitting] Text to display if submitting
     */
    self.addButton = function (id, text, clicked, visible, options, extras) {
      if (buttons[id]) {
        return self; // Already registered
      }

      if (sections.buttons === undefined)  {
        // We have buttons, register wrapper
        register('buttons');
        if (initialized) {
          insert(self.order, 'buttons', sections, $wrapper);
        }
      }

      extras = extras || {};
      extras.confirmationDialog = extras.confirmationDialog || {};
      options = options || {};

      var confirmationDialog =
        self.addConfirmationDialogToButton(extras.confirmationDialog, clicked);

      /**
       * Handle button clicks through both mouse and keyboard
       * @private
       */
      var handleButtonClick = function () {
        if (extras.confirmationDialog.enable && confirmationDialog) {
          // Show popups section if used
          if (!extras.confirmationDialog.$parentElement) {
            sections.popups.$element.removeClass('hidden');
          }
          confirmationDialog.show($e.position().top);
        }
        else {
          clicked();
        }
      };

      const isSubmitting = extras.contentData && extras.contentData.standalone
        && (extras.contentData.isScoringEnabled || extras.contentData.isReportingEnabled);

      if (isSubmitting && extras.textIfSubmitting) {
        text = extras.textIfSubmitting;
      }

      buttons[id] = {
        isTruncated: false,
        text: text,
        isVisible: false,
        ariaLabel: options['aria-label']
      };

      // The button might be <button> or <a>
      // (dependent on options.href set or not)
      var isAnchorTag = (options.href !== undefined);
      var $e = buttons[id].$element = JoubelUI.createButton($.extend({
        'class': 'h5p-question-' + id,
        html: text,
        on: {
          click: function (event) {
            handleButtonClick();
            if (isAnchorTag) {
              event.preventDefault();
            }
          }
        }
      }, options));
      buttonOrder.push(id);

      H5P.Tooltip($e.get(0), {tooltipSource: 'data-tooltip'});

      // The button might be <button> or <a>. If <a>, the space key is not
      // triggering the click event, must therefore handle this here:
      if (isAnchorTag) {
        $e.on('keypress', function (event) {
          if (event.which === 32) { // Space
            handleButtonClick();
            event.preventDefault();
          }
        });
      }

      if (visible === undefined || visible) {
        // Button should be visible
        $e.appendTo(sections.buttons.$element);
        buttons[id].isVisible = true;
        showSection(sections.buttons);
      }

      return self;
    };

    var setButtonWidth = function (button) {
      var $button = button.$element;
      var $tmp = $button.clone()
        .css({
          'position': 'absolute',
          'white-space': 'nowrap',
          'max-width': 'none'
        }).removeClass('truncated')
        .html(button.text)
        .appendTo($button.parent());

      // Calculate max width (button including text)
      button.width = {
        max: Math.ceil($tmp.outerWidth() + parseFloat($tmp.css('margin-left')) + parseFloat($tmp.css('margin-right')))
      };

      // Calculate min width (truncated, icon only)
      $tmp.html('').addClass('truncated');
      button.width.min = Math.ceil($tmp.outerWidth() + parseFloat($tmp.css('margin-left')) + parseFloat($tmp.css('margin-right')));
      $tmp.remove();
    };

    /**
     * Add confirmation dialog to button
     * @param {ConfirmationDialog} options
     *  A confirmation dialog that will be shown before click handler of button
     *  is triggered
     * @param {function} clicked
     *  Click handler of button
     * @return {H5P.ConfirmationDialog|undefined}
     *  Confirmation dialog if enabled
     */
    self.addConfirmationDialogToButton = function (options, clicked) {
      options = options || {};

      if (!options.enable) {
        return;
      }

      // Confirmation dialog
      var confirmationDialog = new H5P.ConfirmationDialog({
        instance: options.instance,
        headerText: options.l10n.header,
        dialogText: options.l10n.body,
        cancelText: options.l10n.cancelLabel,
        confirmText: options.l10n.confirmLabel
      });

      // Determine parent element
      if (options.$parentElement) {
        confirmationDialog.appendTo(options.$parentElement.get(0));
      }
      else {

        // Create popup section and append to that
        if (sections.popups === undefined) {
          register('popups');
          if (initialized) {
            insert(self.order, 'popups', sections, $wrapper);
          }
          sections.popups.$element.addClass('hidden');
          self.order.push('popups');
        }
        confirmationDialog.appendTo(sections.popups.$element.get(0));
      }

      // Add event listeners
      confirmationDialog.on('confirmed', function () {
        if (!options.$parentElement) {
          sections.popups.$element.addClass('hidden');
        }
        clicked();

        // Trigger to content type
        self.trigger('confirmed');
      });

      confirmationDialog.on('canceled', function () {
        if (!options.$parentElement) {
          sections.popups.$element.addClass('hidden');
        }
        // Trigger to content type
        self.trigger('canceled');
      });

      return confirmationDialog;
    };

    /**
     * Show registered button with given identifier.
     *
     * @param {string} id
     * @param {Number} [priority]
     */
    self.showButton = function (id, priority) {
      var aboutToBeHidden = existsInArray(id, 'id', buttonsToHide) !== -1;
      if (buttons[id] === undefined || (buttons[id].isVisible === true && !aboutToBeHidden)) {
        return self;
      }

      priority = priority || 0;

      // Skip if already being shown
      var indexToShow = existsInArray(id, 'id', buttonsToShow);
      if (indexToShow !== -1) {

        // Update priority
        if (buttonsToShow[indexToShow].priority < priority) {
          buttonsToShow[indexToShow].priority = priority;
        }

        return self;
      }

      // Check if button is going to be hidden on next tick
      var exists = existsInArray(id, 'id', buttonsToHide);
      if (exists !== -1) {

        // Skip hiding if higher priority
        if (buttonsToHide[exists].priority <= priority) {
          buttonsToHide.splice(exists, 1);
          buttonsToShow.push({id: id, priority: priority});
        }

      } // If button is not shown
      else if (!buttons[id].$element.is(':visible')) {

        // Show button on next tick
        buttonsToShow.push({id: id, priority: priority});
      }

      if (!toggleButtonsTimer) {
        toggleButtonsTimer = setTimeout(toggleButtons, 0);
      }

      return self;
    };

    /**
     * Hide registered button with given identifier.
     *
     * @param {string} id
     * @param {number} [priority]
     */
    self.hideButton = function (id, priority) {
      var aboutToBeShown = existsInArray(id, 'id', buttonsToShow) !== -1;
      if (buttons[id] === undefined || (buttons[id].isVisible === false && !aboutToBeShown)) {
        return self;
      }

      priority = priority || 0;

      // Skip if already being hidden
      var indexToHide = existsInArray(id, 'id', buttonsToHide);
      if (indexToHide !== -1) {

        // Update priority
        if (buttonsToHide[indexToHide].priority < priority) {
          buttonsToHide[indexToHide].priority = priority;
        }

        return self;
      }

      // Check if buttons is going to be shown on next tick
      var exists = existsInArray(id, 'id', buttonsToShow);
      if (exists !== -1) {

        // Skip showing if higher priority
        if (buttonsToShow[exists].priority <= priority) {
          buttonsToShow.splice(exists, 1);
          buttonsToHide.push({id: id, priority: priority});
        }
      }
      else if (!buttons[id].$element.is(':visible')) {

        // Make sure it is detached in case the container is hidden.
        hideButton(id);
      }
      else {

        // Hide button on next tick.
        buttonsToHide.push({id: id, priority: priority});
      }

      if (!toggleButtonsTimer) {
        toggleButtonsTimer = setTimeout(toggleButtons, 0);
      }

      return self;
    };

    /**
     * Set focus to the given button. If no button is given the first visible
     * button gets focused. This is useful if you lose focus.
     *
     * @param {string} [id]
     */
    self.focusButton = function (id) {
      if (id === undefined) {
        // Find first button that is visible.
        for (var i = 0; i < buttonOrder.length; i++) {
          var button = buttons[buttonOrder[i]];
          if (button && button.isVisible) {
            // Give that button focus
            button.$element.focus();
            break;
          }
        }
      }
      else if (buttons[id] && buttons[id].$element.is(':visible')) {
        // Set focus to requested button
        buttons[id].$element.focus();
      }

      return self;
    };

    /**
     * Toggle readspeaker functionality
     * @param {boolean} [disable] True to disable, false to enable.
     */
    self.toggleReadSpeaker = function (disable) {
      behaviour.disableReadSpeaker = disable || !behaviour.disableReadSpeaker;
    };

    /**
     * Set new element for section.
     *
     * @param {String} id
     * @param {H5P.jQuery} $element
     */
    self.insertSectionAtElement = function (id, $element) {
      if (sections[id] === undefined) {
        register(id);
      }
      sections[id].parent = $element;

      // Insert section if question is not initialized
      if (!initialized) {
        insert([id], id, sections, $element);
      }

      return self;
    };

    /**
     * Attach content to given container.
     *
     * @param {H5P.jQuery} $container
     */
    self.attach = function ($container) {
      if (self.isRoot()) {
        self.setActivityStarted();
      }

      // The first time we attach we also create our DOM elements.
      if ($wrapper === undefined) {
        if (self.registerDomElements !== undefined &&
           (self.registerDomElements instanceof Function ||
           typeof self.registerDomElements === 'function')) {

          // Give the question type a chance to register before attaching
          self.registerDomElements();
        }

        // Create section for reading messages
        $read = $('<div/>', {
          'aria-live': 'polite',
          'class': 'h5p-hidden-read'
        });
        register('read', $read);
        self.trigger('registerDomElements');
      }

      // Prepare container
      $wrapper = $container;
      $container.html('')
        .addClass('h5p-question h5p-' + type);

      // Add sections in given order
      var $sections = [];
      for (var i = 0; i < self.order.length; i++) {
        var section = self.order[i];
        if (sections[section]) {
          if (sections[section].parent) {
            // Section has a different parent
            sections[section].$element.appendTo(sections[section].parent);
          }
          else {
            $sections.push(sections[section].$element);
          }
          sections[section].isVisible = true;
        }
      }

      // Only append once to DOM for optimal performance
      $container.append($sections);

      // Let others react to dom changes
      self.trigger('domChanged', {
        '$target': $container,
        'library': self.libraryInfo.machineName,
        'contentId': self.contentId,
        'key': 'newLibrary'
      }, {'bubbles': true, 'external': true});

      // ??
      initialized = true;

      return self;
    };

    /**
     * Detach all sections from their parents
     */
    self.detachSections = function () {
      // Deinit Question
      initialized = false;

      // Detach sections
      for (var section in sections) {
        sections[section].$element.detach();
      }

      return self;
    };

    // Listen for resize
    self.on('resize', function () {
      // Allow elements to attach and set their height before resizing
      if (!sectionsIsTransitioning && sections.feedback && showFeedback) {
        // Resize feedback to fit
        setElementHeight(sections.feedback.$element);
      }

      // Re-position feedback popup if in use
      var $element = sections.feedback;
      var $click = clickElement;

      if ($element != null && $element.$element != null && $click != null && $click.$element != null) {
        setTimeout(function () {
          positionFeedbackPopup($element.$element, $click.$element);
        }, 10);
      }

      resizeButtons();
    });
  }

  // Inheritance
  Question.prototype = Object.create(EventDispatcher.prototype);
  Question.prototype.constructor = Question;

  /**
   * Determine the overall feedback to display for the question.
   * Returns empty string if no matching range is found.
   *
   * @param {Object[]} feedbacks
   * @param {number} scoreRatio
   * @return {string}
   */
  Question.determineOverallFeedback = function (feedbacks, scoreRatio) {
    scoreRatio = Math.floor(scoreRatio * 100);

    for (var i = 0; i < feedbacks.length; i++) {
      var feedback = feedbacks[i];
      var hasFeedback = (feedback.feedback !== undefined && feedback.feedback.trim().length !== 0);

      if (feedback.from <= scoreRatio && feedback.to >= scoreRatio && hasFeedback) {
        return feedback.feedback;
      }
    }

    return '';
  };

  return Question;
})(H5P.jQuery, H5P.EventDispatcher, H5P.JoubelUI);
;H5P.Question.Explainer = (function ($) {
  /**
   * Constructor
   *
   * @class
   * @param {string} title
   * @param {array} explanations
   */
  function Explainer(title, explanations) {
    var self = this;

    /**
     * Create the DOM structure
     */
    var createHTML = function () {
      self.$explanation = $('<div>', {
        'class': 'h5p-question-explanation-container'
      });

      // Add title:
      $('<div>', {
        'class': 'h5p-question-explanation-title',
        role: 'heading',
        html: title,
        appendTo: self.$explanation
      });

      var $explanationList = $('<ul>', {
        'class': 'h5p-question-explanation-list',
        appendTo: self.$explanation
      });

      for (var i = 0; i < explanations.length; i++) {
        var feedback = explanations[i];
        var $explanationItem = $('<li>', {
          'class': 'h5p-question-explanation-item',
          appendTo: $explanationList
        });

        var $content = $('<div>', {
          'class': 'h5p-question-explanation-status'
        });

        if (feedback.correct) {
          $('<span>', {
            'class': 'h5p-question-explanation-correct',
            html: feedback.correct,
            appendTo: $content
          });
        }
        if (feedback.wrong) {
          $('<span>', {
            'class': 'h5p-question-explanation-wrong',
            html: feedback.wrong,
            appendTo: $content
          });
        }
        $content.appendTo($explanationItem);

        if (feedback.text) {
          $('<div>', {
            'class': 'h5p-question-explanation-text',
            html: feedback.text,
            appendTo: $explanationItem
          });
        }
      }
    };

    createHTML();

    /**
     * Return the container HTMLElement
     *
     * @return {HTMLElement}
     */
    self.getElement = function () {
      return self.$explanation;
    };
  }

  return Explainer;

})(H5P.jQuery);
;(function (Question) {

  /**
   * Makes it easy to add animated score points for your question type.
   *
   * @class H5P.Question.ScorePoints
   */
  Question.ScorePoints = function () {
    var self = this;

    var elements = [];
    var showElementsTimer;

    /**
     * Create the element that displays the score point element for questions.
     *
     * @param {boolean} isCorrect
     * @return {HTMLElement}
     */
    self.getElement = function (isCorrect) {
      var element = document.createElement('div');
      element.classList.add(isCorrect ? 'h5p-question-plus-one' : 'h5p-question-minus-one');
      element.classList.add('h5p-question-hidden-one');
      elements.push(element);

      // Schedule display animation of all added elements
      if (showElementsTimer) {
        clearTimeout(showElementsTimer);
      }
      showElementsTimer = setTimeout(showElements, 0);

      return element;
    };

    /**
     * @private
     */
    var showElements = function () {
      // Determine delay between triggering animations
      var delay = 0;
      var increment = 150;
      var maxTime = 1000;

      if (elements.length && elements.length > Math.ceil(maxTime / increment)) {
        // Animations will run for more than ~1 second, reduce it.
        increment = maxTime / elements.length;
      }

      for (var i = 0; i < elements.length; i++) {
        // Use timer to trigger show
        setTimeout(showElement(elements[i]), delay);

        // Increse delay for next element
        delay += increment;
      }
    };

    /**
     * Trigger transition animation for the given element
     *
     * @private
     * @param {HTMLElement} element
     * @return {function}
     */
    var showElement = function (element) {
      return function () {
        element.classList.remove('h5p-question-hidden-one');
      };
    };
  };

})(H5P.Question);
;/**
 * @class
 * @classdesc Keyboard navigation for accessibility support
 * @extends H5P.EventDispatcher
 */
H5P.KeyboardNav = (function (EventDispatcher) {
  /**
   * Construct a new KeyboardNav
   * @constructor
   */
  function KeyboardNav() {
    EventDispatcher.call(this);

    /** @member {boolean} */
    this.selectability = true;

    /** @member {HTMLElement[]|EventTarget[]} */
    this.elements = [];
  }

  KeyboardNav.prototype = Object.create(EventDispatcher.prototype);
  KeyboardNav.prototype.constructor = KeyboardNav;

  /**
   * Adds a new element to navigation
   *
   * @param {HTMLElement} el The element
   * @public
   */
  KeyboardNav.prototype.addElement = function(el){
    const keyDown = this.handleKeyDown.bind(this);
    const onClick = this.onClick.bind(this);
    el.addEventListener('keydown', keyDown);
    el.addEventListener('click', onClick);

    // add to array to navigate over
    this.elements.push({
      el: el,
      keyDown: keyDown,
      onClick: onClick,
    });

    if(this.elements.length === 1){ // if first
      this.setTabbableAt(0);
    }
  };

  /**
   * Select the previous element in the list. Select the last element,
   * if the current element is the first element in the list.
   *
   * @param {Number} index The index of currently selected element
   * @public
   * @fires KeyboardNav#previousOption
   */
  KeyboardNav.prototype.previousOption = function (index) {
    var isFirstElement = index === 0;
    if (isFirstElement) {
      return;
    }

    this.focusOnElementAt(isFirstElement ? (this.elements.length - 1) : (index - 1));

    /**
     * Previous option event
     *
     * @event KeyboardNav#previousOption
     * @type KeyboardNavigationEventData
     */
    this.trigger('previousOption', this.createEventPayload(index));
  };


  /**
   * Select the next element in the list. Select the first element,
   * if the current element is the first element in the list.
   *
   * @param {Number} index The index of the currently selected element
   * @public
   * @fires KeyboardNav#previousOption
   */
  KeyboardNav.prototype.nextOption = function (index) {
    var isLastElement = index === this.elements.length - 1;
    if (isLastElement) {
      return;
    }

    this.focusOnElementAt(isLastElement ? 0 : (index + 1));

    /**
     * Previous option event
     *
     * @event KeyboardNav#nextOption
     * @type KeyboardNavigationEventData
     */
    this.trigger('nextOption', this.createEventPayload(index));
  };

  /**
   * Focus on an element by index
   *
   * @param {Number} index The index of the element to focus on
   * @public
   */
  KeyboardNav.prototype.focusOnElementAt = function (index) {
    this.setTabbableAt(index);
    this.getElements()[index].focus();
  };

  /**
   * Disable possibility to select a word trough click and space or enter
   *
   * @public
   */
  KeyboardNav.prototype.disableSelectability = function () {
    this.elements.forEach(function (el) {
      el.el.removeEventListener('keydown', el.keyDown);
      el.el.removeEventListener('click', el.onClick);
    }.bind(this));
    this.selectability = false;
  };

  /**
   * Enable possibility to select a word trough click and space or enter
   *
   * @public
   */
  KeyboardNav.prototype.enableSelectability = function () {
    this.elements.forEach(function (el) {
      el.el.addEventListener('keydown', el.keyDown);
      el.el.addEventListener('click', el.onClick);
    }.bind(this));
    this.selectability = true;
  };

  /**
   * Sets tabbable on a single element in the list, by index
   * Also removes tabbable from all other elements in the list
   *
   * @param {Number} index The index of the element to set tabbale on
   * @public
   */
  KeyboardNav.prototype.setTabbableAt = function (index) {
    this.removeAllTabbable();
    this.getElements()[index].setAttribute('tabindex', '0');
  };

  /**
   * Remove tabbable from all entries
   *
   * @public
   */
  KeyboardNav.prototype.removeAllTabbable = function () {
    this.elements.forEach(function(el){
      el.el.removeAttribute('tabindex');
    });
  };

  /**
   * Toggles 'aria-selected' on an element, if selectability == true
   *
   * @param {EventTarget|HTMLElement} el The element to select/unselect
   * @private
   * @fires KeyboardNav#select
   */
  KeyboardNav.prototype.toggleSelect = function(el){
    if(this.selectability) {

      // toggle selection
      el.setAttribute('aria-selected', !isElementSelected(el));

      // focus current
      el.setAttribute('tabindex', '0');
      el.focus();

      var index = this.getElements().indexOf(el);

      /**
       * Previous option event
       *
       * @event KeyboardNav#select
       * @type KeyboardNavigationEventData
       */
      this.trigger('select', this.createEventPayload(index));
    }
  };

  /**
   * Handles key down
   *
   * @param {KeyboardEvent} event Keyboard event
   * @private
   */
  KeyboardNav.prototype.handleKeyDown = function(event){
    var index;

    switch (event.which) {
      case 13: // Enter
      case 32: // Space
        // Select
        this.toggleSelect(event.target);
        event.preventDefault();
        break;

      case 37: // Left Arrow
      case 38: // Up Arrow
        // Go to previous Option
        index = this.getElements().indexOf(event.currentTarget);
        this.previousOption(index);
        event.preventDefault();
        break;

      case 39: // Right Arrow
      case 40: // Down Arrow
        // Go to next Option
        index = this.getElements().indexOf(event.currentTarget);
        this.nextOption(index);
        event.preventDefault();
        break;
    }
  };

  /**
   * Get only elements from elements array
   * @returns {Array}
   */
  KeyboardNav.prototype.getElements = function () {
    return this.elements.map(function (el) {
      return el.el;
    });
  };

  /**
   * Handles element click. Toggles 'aria-selected' on element
   *
   * @param {MouseEvent} event Mouse click event
   * @private
   */
  KeyboardNav.prototype.onClick = function(event){
    this.toggleSelect(event.currentTarget);
  };

  /**
   * Creates a paylod for event that is fired
   *
   * @param {Number} index
   * @return {KeyboardNavigationEventData}
   */
  KeyboardNav.prototype.createEventPayload = function(index){
    /**
     * Data that is passed along as the event parameter
     *
     * @typedef {Object} KeyboardNavigationEventData
     * @property {HTMLElement} element
     * @property {number} index
     * @property {boolean} selected
     */
    return {
      element: this.getElements()[index],
      index: index,
      selected: isElementSelected(this.getElements()[index])
    };
  };

  /**
   * Sets aria-selected="true" on an element
   *
   * @param {HTMLElement} el The element to set selected
   * @return {boolean}
   */
  var isElementSelected = function(el){
    return el.getAttribute('aria-selected') === 'true';
  };

  return KeyboardNav;
})(H5P.EventDispatcher);
;H5P.MarkTheWords = H5P.MarkTheWords || {};

/**
 * Mark the words XapiGenerator
 */
H5P.MarkTheWords.XapiGenerator = (function ($) {

  /**
   * Xapi statements Generator
   * @param {H5P.MarkTheWords} markTheWords
   * @constructor
   */
  function XapiGenerator(markTheWords) {

    /**
     * Generate answered event
     * @return {H5P.XAPIEvent}
     */
    this.generateAnsweredEvent = function () {
      var xAPIEvent = markTheWords.createXAPIEventTemplate('answered');

      // Extend definition
      var objectDefinition = createDefinition(markTheWords);
      $.extend(true, xAPIEvent.getVerifiedStatementValue(['object', 'definition']), objectDefinition);

      // Set score
      xAPIEvent.setScoredResult(markTheWords.getScore(),
        markTheWords.getMaxScore(),
        markTheWords,
        true,
        markTheWords.getScore() === markTheWords.getMaxScore()
      );

      // Extend user result
      var userResult = {
        response: getUserSelections(markTheWords)
      };

      $.extend(xAPIEvent.getVerifiedStatementValue(['result']), userResult);

      return xAPIEvent;
    };
  }

  /**
   * Create object definition for question
   *
   * @param {H5P.MarkTheWords} markTheWords
   * @return {Object} Object definition
   */
  function createDefinition(markTheWords) {
    var definition = {};
    definition.description = {
      'en-US': replaceLineBreaks(markTheWords.params.taskDescription)
    };
    definition.type = 'http://adlnet.gov/expapi/activities/cmi.interaction';
    definition.interactionType = 'choice';
    definition.correctResponsesPattern = [getCorrectResponsesPattern(markTheWords)];
    definition.choices = getChoices(markTheWords);
    definition.extensions = {
      'https://h5p.org/x-api/line-breaks': markTheWords.getIndexesOfLineBreaks()
    };
    return definition;
  }

  /**
   * Replace line breaks
   *
   * @param {string} description
   * @return {string}
   */
  function replaceLineBreaks(description) {
    var sanitized = $('<div>' + description + '</div>').text();
    return sanitized.replace(/(\n)+/g, '<br/>');
  }

  /**
   * Get all choices that it is possible to choose between
   *
   * @param {H5P.MarkTheWords} markTheWords
   * @return {Array}
   */
  function getChoices(markTheWords) {
    return markTheWords.selectableWords.map(function (word, index) {
      var text = word.getText();
      if (text.charAt(0) === '*' && text.charAt(text.length - 1) === '*') {
        text = text.substr(1, text.length - 2);
      }

      return {
        id: index.toString(),
        description: {
          'en-US': $('<div>' + text + '</div>').text()
        }
      };
    });
  }

  /**
   * Get selected words as a user response pattern
   *
   * @param {H5P.MarkTheWords} markTheWords
   * @return {string}
   */
  function getUserSelections(markTheWords) {
    return markTheWords.selectableWords
      .reduce(function (prev, word, index) {
        if (word.isSelected()) {
          prev.push(index);
        }
        return prev;
      }, []).join('[,]');
  }

  /**
   * Get correct response pattern from correct words
   *
   * @param {H5P.MarkTheWords} markTheWords
   * @return {string}
   */
  function getCorrectResponsesPattern(markTheWords) {
    return markTheWords.selectableWords
      .reduce(function (prev, word, index) {
        if (word.isAnswer()) {
          prev.push(index);
        }
        return prev;
      }, []).join('[,]');
  }

  return XapiGenerator;
})(H5P.jQuery);
;H5P.MarkTheWords = H5P.MarkTheWords || {};
H5P.MarkTheWords.Word = (function () {
  /**
   * @constant
   *
   * @type {string}
  */
  Word.ID_MARK_MISSED = "h5p-description-missed";
  /**
   * @constant
   *
   * @type {string}
   */
  Word.ID_MARK_CORRECT = "h5p-description-correct";
  /**
   * @constant
   *
   * @type {string}
   */
  Word.ID_MARK_INCORRECT = "h5p-description-incorrect";

  /**
   * Class for keeping track of selectable words.
   *
   * @class
   * @param {jQuery} $word
   */
  function Word($word, params) {
    var self = this;
    self.params = params;
    H5P.EventDispatcher.call(self);

    var input = $word.text();
    var handledInput = input;

    // Check if word is an answer
    var isAnswer = checkForAnswer();

    // Remove single asterisk and escape double asterisks.
    handleAsterisks();

    if (isAnswer) {
      $word.text(handledInput);
    }

    const ariaText = document.createElement('span');
    ariaText.classList.add('hidden-but-read');
    $word[0].appendChild(ariaText);

    /**
     * Checks if the word is an answer by checking the first, second to last and last character of the word.
     *
     * @private
     * @return {Boolean} Returns true if the word is an answer.
     */
    function checkForAnswer() {
      // Check last and next to last character, in case of punctuations.
      var wordString = removeDoubleAsterisks(input);
      if (wordString.charAt(0) === ('*') && wordString.length > 2) {
        if (wordString.charAt(wordString.length - 1) === ('*')) {
          handledInput = input.slice(1, input.length - 1);
          return true;
        }
        // If punctuation, add the punctuation to the end of the word.
        else if(wordString.charAt(wordString.length - 2) === ('*')) {
          handledInput = input.slice(1, input.length - 2);
          return true;
        }
        return false;
      }
      return false;
    }

    /**
     * Removes double asterisks from string, used to handle input.
     *
     * @private
     * @param {String} wordString The string which will be handled.
     * @return {String} Returns a string without double asterisks.
     */
    function removeDoubleAsterisks(wordString) {
      var asteriskIndex = wordString.indexOf('*');
      var slicedWord = wordString;

      while (asteriskIndex !== -1) {
        if (wordString.indexOf('*', asteriskIndex + 1) === asteriskIndex + 1) {
          slicedWord = wordString.slice(0, asteriskIndex) + wordString.slice(asteriskIndex + 2, input.length);
        }
        asteriskIndex = wordString.indexOf('*', asteriskIndex + 1);
      }

      return slicedWord;
    }

    /**
     * Escape double asterisks ** = *, and remove single asterisk.
     *
     * @private
     */
    function handleAsterisks() {
      var asteriskIndex = handledInput.indexOf('*');

      while (asteriskIndex !== -1) {
        handledInput = handledInput.slice(0, asteriskIndex) + handledInput.slice(asteriskIndex + 1, handledInput.length);
        asteriskIndex = handledInput.indexOf('*', asteriskIndex + 1);
      }
    }

    /**
     * Removes any score points added to the marked word.
     */
    self.clearScorePoint = function () {
      const scorePoint = $word[0].querySelector('div');
      if (scorePoint) {
        scorePoint.parentNode.removeChild(scorePoint);
      }
    };

    /**
     * Get Word as a string
     *
     * @return {string} Word as text
     */
    this.getText = function () {
      return input;
    };

    /**
     * Clears all marks from the word.
     *
     * @public
     */
    this.markClear = function () {
      $word
        .attr('aria-selected', false)
        .removeAttr('aria-describedby');

      ariaText.innerHTML = '';
      this.clearScorePoint();
    };

    /**
     * Check if the word is correctly marked and style it accordingly.
     * Reveal result
     *
     * @public
     * @param {H5P.Question.ScorePoints} scorePoints
     */
    this.markCheck = function (scorePoints) {
      if (this.isSelected()) {
        $word.attr('aria-describedby', isAnswer ? Word.ID_MARK_CORRECT : Word.ID_MARK_INCORRECT);
        ariaText.innerHTML = isAnswer
          ? self.params.correctAnswer
          : self.params.incorrectAnswer;

        if (scorePoints) {
          $word[0].appendChild(scorePoints.getElement(isAnswer));
        }
      }
      else if (isAnswer) {
        $word.attr('aria-describedby', Word.ID_MARK_MISSED);
        ariaText.innerHTML = self.params.missedAnswer;
      }
    };

    /**
     * Checks if the word is marked correctly.
     *
     * @public
     * @returns {Boolean} True if the marking is correct.
     */
    this.isCorrect = function () {
      return (isAnswer && this.isSelected());
    };

    /**
     * Checks if the word is marked wrong.
     *
     * @public
     * @returns {Boolean} True if the marking is wrong.
     */
    this.isWrong = function () {
      return (!isAnswer && this.isSelected());
    };

    /**
     * Checks if the word is correct, but has not been marked.
     *
     * @public
     * @returns {Boolean} True if the marking is missed.
     */
    this.isMissed = function () {
      return (isAnswer && !this.isSelected());
    };

    /**
     * Checks if the word is an answer.
     *
     * @public
     * @returns {Boolean} True if the word is an answer.
     */
    this.isAnswer = function () {
      return isAnswer;
    };

    /**
     * Checks if the word is selected.
     *
     * @public
     * @returns {Boolean} True if the word is selected.
     */
    this.isSelected = function () {
      return $word.attr('aria-selected') === 'true';
    };

    /**
     * Sets that the Word is selected
     *
     * @public
     */
    this.setSelected = function () {
      $word.attr('aria-selected', 'true');
    };
  }
  Word.prototype = Object.create(H5P.EventDispatcher.prototype);
  Word.prototype.constructor = Word;

  return Word;
})();
;/*global H5P*/

/**
 * Mark The Words module
 * @external {jQuery} $ H5P.jQuery
 */
H5P.MarkTheWords = (function ($, Question, Word, KeyboardNav, XapiGenerator) {
  /**
   * Initialize module.
   *
   * @class H5P.MarkTheWords
   * @extends H5P.Question
   * @param {Object} params Behavior settings
   * @param {Number} contentId Content identification
   * @param {Object} contentData Object containing task specific content data
   *
   * @returns {Object} MarkTheWords Mark the words instance
   */
  function MarkTheWords(params, contentId, contentData) {
    this.contentId = contentId;
    this.contentData = contentData;
    this.introductionId = 'mark-the-words-introduction-' + contentId;

    Question.call(this, 'mark-the-words');

    // Set default behavior.
    this.params = $.extend(true, {
      media: {},
      taskDescription: "",
      textField: "This is a *nice*, *flexible* content type.",
      overallFeedback: [],
      behaviour: {
        enableRetry: true,
        enableSolutionsButton: true,
        enableCheckButton: true,
        showScorePoints: true
      },
      checkAnswerButton: "Check",
      submitAnswerButton: "Submit",
      tryAgainButton: "Retry",
      showSolutionButton: "Show solution",
      correctAnswer: "Correct!",
      incorrectAnswer: "Incorrect!",
      missedAnswer: "Answer not found!",
      displaySolutionDescription:  "Task is updated to contain the solution.",
      scoreBarLabel: 'You got :num out of :total points',
      a11yFullTextLabel: 'Full readable text',
      a11yClickableTextLabel: 'Full text where words can be marked',
      a11ySolutionModeHeader: 'Solution mode',
      a11yCheckingHeader: 'Checking mode',
      a11yCheck: 'Check the answers. The responses will be marked as correct, incorrect, or unanswered.',
      a11yShowSolution: 'Show the solution. The task will be marked with its correct solution.',
      a11yRetry: 'Retry the task. Reset all responses and start the task over again.',
    }, params);

    this.contentData = contentData;
    if (this.contentData !== undefined && this.contentData.previousState !== undefined) {
      this.previousState = this.contentData.previousState;
    }

    this.keyboardNavigators = [];

    this.initMarkTheWords();
    this.XapiGenerator = new XapiGenerator(this);
  }

  MarkTheWords.prototype = Object.create(H5P.EventDispatcher.prototype);
  MarkTheWords.prototype.constructor = MarkTheWords;

  /**
   * Initialize Mark The Words task
   */
  MarkTheWords.prototype.initMarkTheWords = function () {
    this.$inner = $('<div class="h5p-word-inner"></div>');

    this.addTaskTo(this.$inner);

    // Set user state
    this.setH5PUserState();
  };

  /**
   * Recursive function that creates html for the words
   * @method createHtmlForWords
   * @param  {Array}           nodes Array of dom nodes
   * @return {string}
   */
  MarkTheWords.prototype.createHtmlForWords = function (nodes) {
    var self = this;
    var html = '';
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];

      if (node instanceof Text) {
        var text = $(node).text();
        var selectableStrings = text.replace(/(&nbsp;|\r\n|\n|\r)/g, ' ')
          .match(/ \*[^\* ]+\* |[^\s]+/g);

        if (selectableStrings) {
          selectableStrings.forEach(function (entry) {
            entry = entry.trim();

            // Words
            if (html) {
              // Add space before
              html += ' ';
            }

            // Remove prefix punctuations from word
            var prefix = entry.match(/^[\[\({⟨¿¡“"«„]+/);
            var start = 0;
            if (prefix !== null) {
              start = prefix[0].length;
              html += prefix;
            }

            // Remove suffix punctuations from word
            var suffix = entry.match(/[",….:;?!\]\)}⟩»”]+$/);
            var end = entry.length - start;
            if (suffix !== null) {
              end -= suffix[0].length;
            }

            // Word
            entry = entry.substr(start, end);
            if (entry.length) {
              html += '<span role="option" aria-selected="false">' + self.escapeHTML(entry) + '</span>';
            }

            if (suffix !== null) {
              html += suffix;
            }
          });
        }
        else if ((selectableStrings !== null) && text.length) {
          html += '<span role="option" aria-selected="false">' + this.escapeHTML(text) + '</span>';
        }
      }
      else {
        if (node.nodeName === 'BR') {
          html += '<br/>';
        }
        else {
          var attributes = ' ';
          for (var j = 0; j < node.attributes.length; j++) {
            attributes +=node.attributes[j].name + '="' + node.attributes[j].nodeValue + '" ';
          }
          html += '<' + node.nodeName +  attributes + '>';
          html += self.createHtmlForWords(node.childNodes);
          html += '</' + node.nodeName + '>';
        }
      }
    }

    return html;
  };

  /**
   * Escapes HTML
   *
   * @param html
   * @returns {jQuery}
   */
  MarkTheWords.prototype.escapeHTML = function (html) {
    return $('<div>').text(html).html();
  };

  /**
   * Search for the last children in every paragraph and
   * return their indexes in an array
   *
   * @returns {Array}
   */
  MarkTheWords.prototype.getIndexesOfLineBreaks = function () {

    var indexes = [];
    var selectables = this.$wordContainer.find('span.h5p-word-selectable');

    selectables.each(function (index, selectable) {
      if ($(selectable).next().is('br')) {
        indexes.push(index);
      }

      if ($(selectable).parent('p') && !$(selectable).parent().is(':last-child') && $(selectable).is(':last-child')) {
        indexes.push(index);
      }
    });

    return indexes;
  };

  /**
   * Handle task and add it to container.
   * @param {jQuery} $container The object which our task will attach to.
   */
  MarkTheWords.prototype.addTaskTo = function ($container) {
    var self = this;
    self.selectableWords = [];
    self.answers = 0;

    // Wrapper
    var $wordContainer = $('<div/>', {
      'class': 'h5p-word-selectable-words',
      'aria-labelledby': self.introductionId,
      'aria-multiselectable': 'true',
      'role': 'listbox',
      html: self.createHtmlForWords($.parseHTML(self.params.textField))
    });

    let isNewParagraph = true;
    $wordContainer.find('[role="option"], br').each(function () {
      if ($(this).is('br')) {
        isNewParagraph = true;
        return;
      }

      if (isNewParagraph) {
        // Add keyboard navigation helper
        self.currentKeyboardNavigator = new KeyboardNav();

        // on word clicked
        self.currentKeyboardNavigator.on('select', function () {
          self.isAnswered = true;
          self.triggerXAPI('interacted');
        });

        self.keyboardNavigators.push(self.currentKeyboardNavigator);
        isNewParagraph = false;
      }
      self.currentKeyboardNavigator.addElement(this);

      // Add keyboard navigation to this element
      var selectableWord = new Word($(this), self.params);
      if (selectableWord.isAnswer()) {
        self.isAnswered = true;
        self.answers += 1;
      }
      self.selectableWords.push(selectableWord);
    });

    self.blankIsCorrect = (self.answers === 0);
    if (self.blankIsCorrect) {
      self.answers = 1;
    }

    // A11y full readable text
    const $ariaTextWrapper = $('<div>', {
      'class': 'hidden-but-read',
    }).appendTo($container);
    $('<div>', {
      html: self.params.a11yFullTextLabel,
    }).appendTo($ariaTextWrapper);

    // Add space after each paragraph to read the sentences better
    const ariaText = $('<div>', {
      'html': $wordContainer.html().replace('</p>', ' </p>'),
    }).text();

    $('<div>', {
      text: ariaText,
    }).appendTo($ariaTextWrapper);

    // A11y clickable list label
    this.$a11yClickableTextLabel = $('<div>', {
      'class': 'hidden-but-read',
      html: self.params.a11yClickableTextLabel,
      tabIndex: '-1',
    }).appendTo($container);

    $wordContainer.appendTo($container);
    self.$wordContainer = $wordContainer;
  };

  /**
   * Add check solution and retry buttons.
   */
  MarkTheWords.prototype.addButtons = function () {
    var self = this;
    self.$buttonContainer = $('<div/>', {
      'class': 'h5p-button-bar'
    });

    if (this.params.behaviour.enableCheckButton) {
      this.addButton('check-answer', this.params.checkAnswerButton, function () {
        self.isAnswered = true;
        var answers = self.calculateScore();
        self.feedbackSelectedWords();

        if (!self.showEvaluation(answers)) {
          // Only show if a correct answer was not found.
          if (self.params.behaviour.enableSolutionsButton && (answers.correct < self.answers)) {
            self.showButton('show-solution');
          }
          if (self.params.behaviour.enableRetry) {
            self.showButton('try-again');
          }
        }
        // Set focus to start of text
        self.$a11yClickableTextLabel.html(self.params.a11yCheckingHeader + ' - ' + self.params.a11yClickableTextLabel);
        self.$a11yClickableTextLabel.focus();

        self.hideButton('check-answer');
        self.trigger(self.XapiGenerator.generateAnsweredEvent());
        self.toggleSelectable(true);
      }, true, {
        'aria-label': this.params.a11yCheck,
      }, {
        contentData: this.contentData,
        textIfSubmitting: this.params.submitAnswerButton,
      });
    }

    this.addButton('try-again', this.params.tryAgainButton, this.resetTask.bind(this), false, {
      'aria-label': this.params.a11yRetry,
    });

    this.addButton('show-solution', this.params.showSolutionButton, function () {
      self.setAllMarks();

      self.$a11yClickableTextLabel.html(self.params.a11ySolutionModeHeader + ' - ' + self.params.a11yClickableTextLabel);
      self.$a11yClickableTextLabel.focus();

      if (self.params.behaviour.enableRetry) {
        self.showButton('try-again');
      }
      self.hideButton('check-answer');
      self.hideButton('show-solution');

      self.read(self.params.displaySolutionDescription);
      self.toggleSelectable(true);
    }, false, {
      'aria-label': this.params.a11yShowSolution,
    });
  };

  /**
   * Toggle whether words can be selected
   * @param {Boolean} disable
   */
  MarkTheWords.prototype.toggleSelectable = function (disable) {
    this.keyboardNavigators.forEach(function (navigator) {
      if (disable) {
        navigator.disableSelectability();
        navigator.removeAllTabbable();
      }
      else {
        navigator.enableSelectability();
        navigator.setTabbableAt((0));
      }
    });

    if (disable) {
      this.$wordContainer.removeAttr('aria-multiselectable').removeAttr('role');
    }
    else {
      this.$wordContainer.attr('aria-multiselectable', 'true')
        .attr('role', 'listbox');
    }
  };

  /**
   * Get Xapi Data.
   *
   * @see used in contracts {@link https://h5p.org/documentation/developers/contracts#guides-header-6}
   * @return {Object}
   */
  MarkTheWords.prototype.getXAPIData = function () {
    return {
      statement: this.XapiGenerator.generateAnsweredEvent().data.statement
    };
  };

  /**
   * Mark the words as correct, wrong or missed.
   *
   * @fires MarkTheWords#resize
   */
  MarkTheWords.prototype.setAllMarks = function () {
    this.selectableWords.forEach(function (entry) {
      entry.markCheck();
      entry.clearScorePoint();
    });

    /**
     * Resize event
     *
     * @event MarkTheWords#resize
     */
    this.trigger('resize');
  };

  /**
   * Mark the selected words as correct or wrong.
   *
   * @fires MarkTheWords#resize
   */
  MarkTheWords.prototype.feedbackSelectedWords = function () {
    var self = this;

    var scorePoints;
    if (self.params.behaviour.showScorePoints) {
      scorePoints = new H5P.Question.ScorePoints();
    }

    this.selectableWords.forEach(function (entry) {
      if (entry.isSelected()) {
        entry.markCheck(scorePoints);
      }
    });

    this.$wordContainer.addClass('h5p-disable-hover');
    this.trigger('resize');
  };

  /**
   * Evaluate task and display score text for word markings.
   *
   * @fires MarkTheWords#resize
   * @return {Boolean} Returns true if maxScore was achieved.
   */
  MarkTheWords.prototype.showEvaluation = function (answers) {
    this.hideEvaluation();
    var score = answers.score;

    //replace editor variables with values, uses regexp to replace all instances.
    var scoreText = H5P.Question.determineOverallFeedback(this.params.overallFeedback, score / this.answers).replace(/@score/g, score.toString())
      .replace(/@total/g, this.answers.toString())
      .replace(/@correct/g, answers.correct.toString())
      .replace(/@wrong/g, answers.wrong.toString())
      .replace(/@missed/g, answers.missed.toString());

    this.setFeedback(scoreText, score, this.answers, this.params.scoreBarLabel);

    this.trigger('resize');
    return score === this.answers;
  };

  /**
   * Clear the evaluation text.
   *
   * @fires MarkTheWords#resize
   */
  MarkTheWords.prototype.hideEvaluation = function () {
    this.removeFeedback();
    this.trigger('resize');
  };

  /**
   * Calculate the score.
   *
   * @return {Answers}
   */
  MarkTheWords.prototype.calculateScore = function () {
    var self = this;

    /**
     * @typedef {Object} Answers
     * @property {number} correct The number of correct answers
     * @property {number} wrong The number of wrong answers
     * @property {number} missed The number of answers the user missed
     * @property {number} score The calculated score
     */
    var initial = {
      correct: 0,
      wrong: 0,
      missed: 0,
      score: 0
    };

    // iterate over words, and calculate score
    var answers = self.selectableWords.reduce(function (result, word) {
      if (word.isCorrect()) {
        result.correct++;
      }
      else if (word.isWrong()) {
        result.wrong++;
      }
      else if (word.isMissed()) {
        result.missed++;
      }

      return result;
    }, initial);

    // if no wrong answers, and black is correct
    if (answers.wrong === 0 && self.blankIsCorrect) {
      answers.correct = 1;
    }

    // no negative score
    answers.score = Math.max(answers.correct - answers.wrong, 0);

    return answers;
  };

  /**
   * Clear styling on marked words.
   *
   * @fires MarkTheWords#resize
   */
  MarkTheWords.prototype.clearAllMarks = function () {
    this.selectableWords.forEach(function (entry) {
      entry.markClear();
    });

    this.$wordContainer.removeClass('h5p-disable-hover');
    this.trigger('resize');
  };

  /**
   * Returns true if task is checked or a word has been clicked
   *
   * @see {@link https://h5p.org/documentation/developers/contracts|Needed for contracts.}
   * @returns {Boolean} Always returns true.
   */
  MarkTheWords.prototype.getAnswerGiven = function () {
    return this.blankIsCorrect ? true : this.isAnswered;
  };

  /**
   * Counts the score, which is correct answers subtracted by wrong answers.
   *
   * @see {@link https://h5p.org/documentation/developers/contracts|Needed for contracts.}
   * @returns {Number} score The amount of points achieved.
   */
  MarkTheWords.prototype.getScore = function () {
    return this.calculateScore().score;
  };

  /**
   * Gets max score for this task.
   *
   * @see {@link https://h5p.org/documentation/developers/contracts|Needed for contracts.}
   * @returns {Number} maxScore The maximum amount of points achievable.
   */
  MarkTheWords.prototype.getMaxScore = function () {
    return this.answers;
  };

  /**
   * Get title
   * @returns {string}
   */
  MarkTheWords.prototype.getTitle = function () {
    return H5P.createTitle((this.contentData && this.contentData.metadata && this.contentData.metadata.title) ? this.contentData.metadata.title : 'Mark the Words');
  };

  /**
   * Display the evaluation of the task, with proper markings.
   *
   * @fires MarkTheWords#resize
   * @see {@link https://h5p.org/documentation/developers/contracts|Needed for contracts.}
   */
  MarkTheWords.prototype.showSolutions = function () {
    var answers = this.calculateScore();
    this.showEvaluation(answers);
    this.setAllMarks();
    this.read(this.params.displaySolutionDescription);
    this.hideButton('try-again');
    this.hideButton('show-solution');
    this.hideButton('check-answer');
    this.$a11yClickableTextLabel.html(this.params.a11ySolutionModeHeader + ' - ' + this.params.a11yClickableTextLabel);

    this.toggleSelectable(true);
    this.trigger('resize');
  };

  /**
   * Resets the task back to its' initial state.
   *
   * @fires MarkTheWords#resize
   * @see {@link https://h5p.org/documentation/developers/contracts|Needed for contracts.}
   */
  MarkTheWords.prototype.resetTask = function () {
    this.isAnswered = false;
    this.clearAllMarks();
    this.hideEvaluation();
    this.hideButton('try-again');
    this.hideButton('show-solution');
    this.showButton('check-answer');
    this.$a11yClickableTextLabel.html(this.params.a11yClickableTextLabel);

    this.toggleSelectable(false);
    this.trigger('resize');
  };

  /**
   * Returns an object containing the selected words
   *
   * @public
   * @returns {object} containing indexes of selected words
   */
  MarkTheWords.prototype.getCurrentState = function () {
    var selectedWordsIndexes = [];
    if (this.selectableWords === undefined) {
      return undefined;
    }

    this.selectableWords.forEach(function (selectableWord, swIndex) {
      if (selectableWord.isSelected()) {
        selectedWordsIndexes.push(swIndex);
      }
    });
    return selectedWordsIndexes;
  };

  /**
   * Sets answers to current user state
   */
  MarkTheWords.prototype.setH5PUserState = function () {
    var self = this;

    // Do nothing if user state is undefined
    if (this.previousState === undefined || this.previousState.length === undefined) {
      return;
    }

    // Select words from user state
    this.previousState.forEach(function (answeredWordIndex) {
      if (isNaN(answeredWordIndex) || answeredWordIndex >= self.selectableWords.length || answeredWordIndex < 0) {
        throw new Error('Stored user state is invalid');
      }

      self.isAnswered = true;
      self.selectableWords[answeredWordIndex].setSelected();
    });
  };

  /**
   * Register dom elements
   *
   * @see {@link https://github.com/h5p/h5p-question/blob/1558b6144333a431dd71e61c7021d0126b18e252/scripts/question.js#L1236|Called from H5P.Question}
   */
  MarkTheWords.prototype.registerDomElements = function () {
    // Register optional media
    let media = this.params.media;
    if (media && media.type && media.type.library) {
      media = media.type;
      const type = media.library.split(' ')[0];
      if (type === 'H5P.Image') {
        if (media.params.file) {
          // Register task image
          this.setImage(media.params.file.path, {
            disableImageZooming: this.params.media.disableImageZooming || false,
            alt: media.params.alt,
            title: media.params.title,
            expandImage: media.params.expandImage,
            minimizeImage: media.params.minimizeImage
          });
        }
      }
      else if (type === 'H5P.Video') {
        if (media.params.sources) {
          // Register task video
          this.setVideo(media);
        }
      }
      else if (type === 'H5P.Audio') {
        if (media.params.files) {
          // Register task audio
          this.setAudio(media);
        }
      }
    }

    // wrap introduction in div with id
    var introduction = '<div id="' + this.introductionId + '">' + this.params.taskDescription + '</div>';

    // Register description
    this.setIntroduction(introduction);

    // creates aria descriptions for correct/incorrect/missed
    this.createDescriptionsDom().appendTo(this.$inner);

    // Register content
    this.setContent(this.$inner, {
      'class': 'h5p-word'
    });

    // Register buttons
    this.addButtons();
  };

  /**
   * Creates dom with description to be used with aria-describedby
   * @return {jQuery}
   */
  MarkTheWords.prototype.createDescriptionsDom = function () {
    var self = this;
    var $el = $('<div class="h5p-mark-the-words-descriptions"></div>');

    $('<div id="' + Word.ID_MARK_CORRECT + '">' + self.params.correctAnswer + '</div>').appendTo($el);
    $('<div id="' + Word.ID_MARK_INCORRECT + '">' + self.params.incorrectAnswer + '</div>').appendTo($el);
    $('<div id="' + Word.ID_MARK_MISSED + '">' + self.params.missedAnswer + '</div>').appendTo($el);

    return $el;
  };

  return MarkTheWords;
}(H5P.jQuery, H5P.Question, H5P.MarkTheWords.Word, H5P.KeyboardNav, H5P.MarkTheWords.XapiGenerator));

/**
 * Static utility method for parsing H5P.MarkTheWords content item questions
 * into format useful for generating reports.
 *
 * Example input: "<p lang=\"en\">I like *pizza* and *burgers*.</p>"
 *
 * Produces the following:
 * [
 *   {
 *     type: 'text',
 *     content: 'I like '
 *   },
 *   {
 *     type: 'answer',
 *     correct: 'pizza',
 *   },
 *   {
 *     type: 'text',
 *     content: ' and ',
 *   },
 *   {
 *     type: 'answer',
 *     correct: 'burgers'
 *   },
 *   {
 *     type: 'text',
 *     content: '.'
 *   }
 * ]
 *
 * @param {string} question MarkTheWords textField (html)
 */
H5P.MarkTheWords.parseText = function (question) {

  /**
   * Separate all words surrounded by a space and an asterisk and any other
   * sequence of non-whitespace characters from str into an array.
   *
   * @param {string} str
   * @returns {string[]} array of all words in the given string
   */
  function getWords(str) {
    return str.match(/ \*[^\*]+\* |[^\s]+/g);
  }

  /**
   * Replace each HTML tag in str with the provided value and return the resulting string
   *
   * Regexp expression explained:
   *   <     - first character is '<'
   *   [^>]* - followed by zero or more occurences of any character except '>'
   *   >     - last character is '>'
   **/
  function replaceHtmlTags(str, value) {
    return str.replace(/<[^>]*>/g, value);
  }

  function startsAndEndsWith(char, str) {
    return str.startsWith(char) && str.endsWith(char);
  }

  function removeLeadingPunctuation(str) {
    return str.replace(/^[\[\({⟨¿¡“"«„]+/, '');
  }

  function removeTrailingPunctuation(str) {
    return str.replace(/[",….:;?!\]\)}⟩»”]+$/, '');
  }

  /**
   * Escape double asterisks ** = *, and remove single asterisk.
   * @param {string} str
   */
  function handleAsterisks(str) {
    var asteriskIndex = str.indexOf('*');

    while (asteriskIndex !== -1) {
      str = str.slice(0, asteriskIndex) + str.slice(asteriskIndex + 1, str.length);
      asteriskIndex = str.indexOf('*', asteriskIndex + 1);
    }
    return str;
  }

  /**
   * Decode HTML entities (e.g. &nbsp;) from the given string using the DOM API
   * @param {string} str
   */
  function decodeHtmlEntities(str) {
    const el = document.createElement('textarea');
    el.innerHTML = str;
    return el.value;
  }

  const wordsWithAsterisksNotRemovedYet = getWords(replaceHtmlTags(decodeHtmlEntities(question), ' '))
    .map(function (w) {
      return w.trim();
    })
    .map(function (w) {
      return removeLeadingPunctuation(w);
    })
    .map(function (w) {
      return removeTrailingPunctuation(w);
    });

  const allSelectableWords = wordsWithAsterisksNotRemovedYet.map(function (w) {
    return handleAsterisks(w);
  });

  const correctWordIndexes = [];

  const correctWords = wordsWithAsterisksNotRemovedYet
    .filter(function (w, i) {
      if (startsAndEndsWith('*', w)) {
        correctWordIndexes.push(i);
        return true;
      }
      return false;
    })
    .map(function (w) {
      return handleAsterisks(w);
    });

  const printableQuestion = replaceHtmlTags(decodeHtmlEntities(question), ' ')
    .replace('\xa0', '\x20');

  return {
    alternatives: allSelectableWords,
    correctWords: correctWords,
    correctWordIndexes: correctWordIndexes,
    textWithPlaceholders: printableQuestion.match(/[^\s]+/g)
      .reduce(function (textWithPlaceholders, word, index) {
        word = removeTrailingPunctuation(
          removeLeadingPunctuation(word));

        return textWithPlaceholders.replace(word, '%' + index);
      }, printableQuestion)
  };
};
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
			})(XMLHttpRequest.prototype.open, window.fetch, {"libraries\/FontAwesome-4.5\/library.json":["application\/json","ewogICJ0aXRsZSI6ICJGb250IEF3ZXNvbWUiLAogICJjb250ZW50VHlwZSI6ICJGb250IiwKICAibWFqb3JWZXJzaW9uIjogNCwKICAibWlub3JWZXJzaW9uIjogNSwKICAicGF0Y2hWZXJzaW9uIjogNCwKICAicnVubmFibGUiOiAwLAogICJtYWNoaW5lTmFtZSI6ICJGb250QXdlc29tZSIsCiAgImxpY2Vuc2UiOiAiTUlUIiwKICAiYXV0aG9yIjogIkRhdmUgR2FuZHkiLAogICJwcmVsb2FkZWRDc3MiOiBbCiAgICB7CiAgICAgICJwYXRoIjogImg1cC1mb250LWF3ZXNvbWUubWluLmNzcyIKICAgIH0KICBdCn0="],"libraries\/H5P.AdvancedText-1.1\/language\/af.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzIgogICAgfQogIF0KfQo="],"libraries\/H5P.AdvancedText-1.1\/language\/ar.json":["application\/json","ewogICJzZW1hbnRpY3MiOlsKICAgIHsKICAgICAgImxhYmVsIjoi2KfZhNmG2LUiCiAgICB9CiAgXQp9"],"libraries\/H5P.AdvancedText-1.1\/language\/bg.json":["application\/json","ew0KICAic2VtYW50aWNzIjogWw0KICAgIHsNCiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCIg0KICAgIH0NCiAgXQ0KfQ=="],"libraries\/H5P.AdvancedText-1.1\/language\/ca.json":["application\/json","ewogICJzZW1hbnRpY3MiOlsKICAgIHsKICAgICAgImxhYmVsIjoiVGV4dCIKICAgIH0KICBdCn0="],"libraries\/H5P.AdvancedText-1.1\/language\/cs.json":["application\/json","ewogICJzZW1hbnRpY3MiOlsKICAgIHsKICAgICAgImxhYmVsIjoiVGV4dCIKICAgIH0KICBdCn0="],"libraries\/H5P.AdvancedText-1.1\/language\/da.json":["application\/json","ewogICJzZW1hbnRpY3MiOlsKICAgIHsKICAgICAgImxhYmVsIjoiVGV4dCIKICAgIH0KICBdCn0="],"libraries\/H5P.AdvancedText-1.1\/language\/de.json":["application\/json","ewogICJzZW1hbnRpY3MiOlsKICAgIHsKICAgICAgImxhYmVsIjoiVGV4dCIKICAgIH0KICBdCn0="],"libraries\/H5P.AdvancedText-1.1\/language\/el.json":["application\/json","ewogICJzZW1hbnRpY3MiOlsKICAgIHsKICAgICAgImxhYmVsIjoizprOtc6vzrzOtc69zr8iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.AdvancedText-1.1\/language\/es.json":["application\/json","ewogICJzZW1hbnRpY3MiOlsKICAgIHsKICAgICAgImxhYmVsIjoiVGV4dG8iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.AdvancedText-1.1\/language\/es-mx.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byIKICAgIH0KICBdCn0K"],"libraries\/H5P.AdvancedText-1.1\/language\/et.json":["application\/json","ewogICJzZW1hbnRpY3MiOlsKICAgIHsKICAgICAgImxhYmVsIjoiVGVrc3QiCiAgICB9CiAgXQp9"],"libraries\/H5P.AdvancedText-1.1\/language\/eu.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXN0dWEiCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.AdvancedText-1.1\/language\/fa.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLZhdiq2YYiCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.AdvancedText-1.1\/language\/fi.json":["application\/json","ewogICJzZW1hbnRpY3MiOlsKICAgIHsKICAgICAgImxhYmVsIjoiVGVrc3RpIgogICAgfQogIF0KfQ=="],"libraries\/H5P.AdvancedText-1.1\/language\/fr.json":["application\/json","ewogICJzZW1hbnRpY3MiOlsKICAgIHsKICAgICAgImxhYmVsIjoiVGV4dGUiCiAgICB9CiAgXQp9"],"libraries\/H5P.AdvancedText-1.1\/language\/gl.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byIKICAgIH0KICBdCn0K"],"libraries\/H5P.AdvancedText-1.1\/language\/he.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLXqteV15vXnyIKICAgIH0KICBdCn0K"],"libraries\/H5P.AdvancedText-1.1\/language\/hu.json":["application\/json","ewogICJzZW1hbnRpY3MiOlsKICAgIHsKICAgICAgImxhYmVsIjoiVGV4dCIKICAgIH0KICBdCn0="],"libraries\/H5P.AdvancedText-1.1\/language\/it.json":["application\/json","ewogICJzZW1hbnRpY3MiOlsKICAgIHsKICAgICAgImxhYmVsIjoiVGVzdG8iCiAgICB9CiAgXQp9"],"libraries\/H5P.AdvancedText-1.1\/language\/ja.json":["application\/json","ewogICJzZW1hbnRpY3MiOlsKICAgIHsKICAgICAgImxhYmVsIjoi44OG44Kt44K544OIIgogICAgfQogIF0KfQ=="],"libraries\/H5P.AdvancedText-1.1\/language\/ka.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLhg6Lhg5Thg6Xhg6Hhg6Lhg5giCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.AdvancedText-1.1\/language\/km.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLhnqLhno\/hn5LhnpDhnpThnpEiCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.AdvancedText-1.1\/language\/ko.json":["application\/json","ewogICJzZW1hbnRpY3MiOlsKICAgIHsKICAgICAgImxhYmVsIjoi7YWN7Iqk7Yq4IgogICAgfQogIF0KfQo="],"libraries\/H5P.AdvancedText-1.1\/language\/lt.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdGFzIgogICAgfQogIF0KfQo="],"libraries\/H5P.AdvancedText-1.1\/language\/lv.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdHMiCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.AdvancedText-1.1\/language\/mn.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCIgogICAgfQogIF0KfQo="],"libraries\/H5P.AdvancedText-1.1\/language\/nb.json":["application\/json","ewogICJzZW1hbnRpY3MiOlsKICAgIHsKICAgICAgImxhYmVsIjoiVGVrc3QiCiAgICB9CiAgXQp9"],"libraries\/H5P.AdvancedText-1.1\/language\/nl.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdCIKICAgIH0KICBdCn0K"],"libraries\/H5P.AdvancedText-1.1\/language\/nn.json":["application\/json","ewogICJzZW1hbnRpY3MiOlsKICAgIHsKICAgICAgImxhYmVsIjoiVGV4dCIKICAgIH0KICBdCn0="],"libraries\/H5P.AdvancedText-1.1\/language\/pl.json":["application\/json","ewogICJzZW1hbnRpY3MiOlsKICAgIHsKICAgICAgImxhYmVsIjoiVGV4dCIKICAgIH0KICBdCn0="],"libraries\/H5P.AdvancedText-1.1\/language\/pt-br.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byIKICAgIH0KICBdCn0K"],"libraries\/H5P.AdvancedText-1.1\/language\/pt.json":["application\/json","ewogICJzZW1hbnRpY3MiOlsKICAgIHsKICAgICAgImxhYmVsIjoiVGV4dG8iCiAgICB9CiAgXQp9"],"libraries\/H5P.AdvancedText-1.1\/language\/ro.json":["application\/json","ewogICJzZW1hbnRpY3MiOlsKICAgIHsKICAgICAgImxhYmVsIjoiVGV4dCIKICAgIH0KICBdCn0="],"libraries\/H5P.AdvancedText-1.1\/language\/ru.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCIgogICAgfQogIF0KfQo="],"libraries\/H5P.AdvancedText-1.1\/language\/sl.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZXNlZGlsbyIKICAgIH0KICBdCn0K"],"libraries\/H5P.AdvancedText-1.1\/language\/sma.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IgogICAgfQogIF0KfQo="],"libraries\/H5P.AdvancedText-1.1\/language\/sme.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IgogICAgfQogIF0KfQo="],"libraries\/H5P.AdvancedText-1.1\/language\/smj.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IgogICAgfQogIF0KfQo="],"libraries\/H5P.AdvancedText-1.1\/language\/sr.json":["application\/json","ewogICJzZW1hbnRpY3MiOlsKICAgIHsKICAgICAgImxhYmVsIjoiVGV4dCIKICAgIH0KICBdCn0="],"libraries\/H5P.AdvancedText-1.1\/language\/sv.json":["application\/json","ewogICJzZW1hbnRpY3MiOlsKICAgIHsKICAgICAgImxhYmVsIjoiVGV4dCIKICAgIH0KICBdCn0="],"libraries\/H5P.AdvancedText-1.1\/language\/sw.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJNYWFuZGlzaGkiCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.AdvancedText-1.1\/language\/te.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLgsJ\/gsYbgsJXgsY3gsLjgsY3gsJ\/gsY0iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.AdvancedText-1.1\/language\/th.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLguILguYnguK3guITguKfguLLguKEiCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.AdvancedText-1.1\/language\/tr.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJZYXrEsSIKICAgIH0KICBdCn0K"],"libraries\/H5P.AdvancedText-1.1\/language\/uk.json":["application\/json","ewogICJzZW1hbnRpY3MiOlsKICAgIHsKICAgICAgImxhYmVsIjoi0KLQtdC60YHRgiIKICAgIH0KICBdCn0K"],"libraries\/H5P.AdvancedText-1.1\/language\/vi.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJDaOG7ryIKICAgIH0KICBdCn0K"],"libraries\/H5P.AdvancedText-1.1\/library.json":["application\/json","ewogICJ0aXRsZSI6ICJUZXh0IiwKICAiZGVzY3JpcHRpb24iOiAiQSBzaW1wbGUgbGlicmFyeSB0aGF0IGRpc3BsYXlzIHRleHQgd2l0aCBhbGwga2luZHMgb2Ygc3R5bGluZy4iLAogICJtYWpvclZlcnNpb24iOiAxLAogICJtaW5vclZlcnNpb24iOiAxLAogICJwYXRjaFZlcnNpb24iOiAxNCwKICAicnVubmFibGUiOiAwLAogICJtYWNoaW5lTmFtZSI6ICJINVAuQWR2YW5jZWRUZXh0IiwKICAiYXV0aG9yIjogIkpvdWJlbCIsCiAgInByZWxvYWRlZEpzIjogWwogICAgewogICAgICAicGF0aCI6ICJ0ZXh0LmpzIgogICAgfQogIF0sCiAgInByZWxvYWRlZENzcyI6IFsKICAgIHsKICAgICAgInBhdGgiOiAidGV4dC5jc3MiCiAgICB9CiAgXSwKICAibWV0YWRhdGFTZXR0aW5ncyI6IHsKICAgICJkaXNhYmxlIjogMCwKICAgICJkaXNhYmxlRXh0cmFUaXRsZUZpZWxkIjogMQogIH0KfQ=="],"libraries\/H5P.AdvancedText-1.1\/semantics.json":["application\/json","WwogIHsKICAgICJuYW1lIjogInRleHQiLAogICAgInR5cGUiOiAidGV4dCIsCiAgICAid2lkZ2V0IjogImh0bWwiLAogICAgImxhYmVsIjogIlRleHQiLAogICAgImltcG9ydGFuY2UiOiAiaGlnaCIsCiAgICAiZW50ZXJNb2RlIjogInAiLAogICAgInRhZ3MiOiBbCiAgICAgICJzdHJvbmciLAogICAgICAiZW0iLAogICAgICAiZGVsIiwKICAgICAgImEiLAogICAgICAidWwiLAogICAgICAib2wiLAogICAgICAiaDIiLAogICAgICAiaDMiLAogICAgICAiaHIiLAogICAgICAicHJlIiwKICAgICAgImNvZGUiCiAgICBdLAogICAgImZvbnQiOiB7CiAgICAgICJzaXplIjogdHJ1ZSwKICAgICAgImNvbG9yIjogdHJ1ZSwKICAgICAgImJhY2tncm91bmQiOiB0cnVlCiAgICB9CiAgfQpdCg=="],"libraries\/H5P.Column-1.16\/language\/af.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJMeXMgdmFuIGtvbG9taW5ob3VkIiwKICAgICAgImVudGl0eSI6ICJpbmhvdWQiLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkluaG91ZCIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJTa2VpIGRpZSBpbmhvdWQgbWV0ICduIGhvcmlzb250YWxlIGxpbmlhYWwiLAogICAgICAgICAgICAib3B0aW9ucyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiT3V0b21hdGllcyAodmVyc3RlaykiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiTW9ldCBub29pdCBsaW5pYWFsIGhpZXJibyBnZWJydWlrIG5pZSIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJHZWJydWlrIGFsdHlkIGRpZSBsaW5pYWFsIGhpZXJibyIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0KICBdCn0K"],"libraries\/H5P.Column-1.16\/language\/ar.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLZgtin2KbZhdipINio2YXYrdiq2YjZiSDYp9mE2LnZhdmI2K8iLAogICAgICAiZW50aXR5IjogItin2YTZhdit2KrZiNmJIiwKICAgICAgImZpZWxkIjogewogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICLYp9mE2YXYrdiq2YjZiSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICLZhdit2KrZiNmJINmF2YbZgdi12YQg2YXYuSDZhdiz2LfYsdipINij2YHZgtmK2KkiLAogICAgICAgICAgICAib3B0aW9ucyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAi2KfYqtmI2YXYp9iq2YrZg9mKICgg2KfZgdiq2LHYp9i22YogKSIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICLZhNinINiq2LPYqtiu2K\/ZhSDYp9io2K\/YpyDYp9mE2YXYs9i32LHYqSDYp9i52YTYp9mHIgogICAgICAgICAgICAgIH0sCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogItin2LPYqtiu2K\/ZhSDYr9mI2YXZi9inINin2YTZhdiz2LfYsdipINij2LnZhNin2YciCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Column-1.16\/language\/bg.json":["application\/json","ew0KICAic2VtYW50aWNzIjogWw0KICAgIHsNCiAgICAgICJsYWJlbCI6ICLQodC\/0LjRgdGK0Log0L3QsCDRgdGK0LTRitGA0LbQsNC90LjQtSDQmtC+0LvQvtC90LgiLA0KICAgICAgImVudGl0eSI6ICLRgdGK0LTRitGA0LbQsNC90LjQtSIsDQogICAgICAiZmllbGQiOiB7DQogICAgICAgICJmaWVsZHMiOiBbDQogICAgICAgICAgew0KICAgICAgICAgICAgImxhYmVsIjogItCh0YrQtNGK0YDQttCw0L3QuNC1Ig0KICAgICAgICAgIH0sDQogICAgICAgICAgew0KICAgICAgICAgICAgImxhYmVsIjogItCg0LDQt9C00LXQu9C10YLQtSDRgdGK0LTRitGA0LbQsNC90LjQtdGC0L4g0YEg0YXQvtGA0LjQt9C+0L3RgtCw0LvQtdC9INC70LjQvdC10LDQuyIsDQogICAgICAgICAgICAib3B0aW9ucyI6IFsNCiAgICAgICAgICAgICAgew0KICAgICAgICAgICAgICAgICJsYWJlbCI6ICLQkNCy0YLQvtC80LDRgtC40YfQvdC+ICjQv9C+INC\/0L7QtNGA0LDQt9Cx0LjRgNCw0L3QtSkiDQogICAgICAgICAgICAgIH0sDQogICAgICAgICAgICAgIHsNCiAgICAgICAgICAgICAgICAibGFiZWwiOiAi0J3QuNC60L7Qs9CwINC90LUg0LjQt9C\/0L7Qu9C30LLQsNC50YLQtSDQu9C40L3QtdCw0Lsg0L\/Qvi3Qs9C+0YDQtSINCiAgICAgICAgICAgICAgfSwNCiAgICAgICAgICAgICAgew0KICAgICAgICAgICAgICAgICJsYWJlbCI6ICLQktC40L3QsNCz0Lgg0LjQt9C\/0L7Qu9C30LLQsNC50YLQtSDQu9C40L3QtdCw0Lsg0L\/Qvi3Qs9C+0YDQtSINCiAgICAgICAgICAgICAgfQ0KICAgICAgICAgICAgXQ0KICAgICAgICAgIH0NCiAgICAgICAgXQ0KICAgICAgfQ0KICAgIH0NCiAgXQ0KfQ0K"],"libraries\/H5P.Column-1.16\/language\/bs.json":["application\/json","ewogICJzZW1hbnRpY3MiOlsKICAgIHsKICAgICAgImxhYmVsIjoibGlzdGEgc2FkcsW+YWphIHN0dXBjYSIsCiAgICAgICJlbnRpdHkiOiJzYWRyxb5haiIsCiAgICAgICJmaWVsZCI6ewogICAgICAgICJmaWVsZHMiOlsKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjoiU2FkcsW+YWoiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiJSYXpkdm9qaSBzYWRyxb5hamUgc2EgbGluaWpvbSIsCiAgICAgICAgICAgICJvcHRpb25zIjpbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjoiQXV0b21hdHNraSAoZGVmYXVsdCkiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiJOaWthZCBuZSBrb3Jpc3RpIHJhemR2YWphbmplIGdvcmUiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiJVdmlqZWsga29yaXN0aSByYXpkdmFqYW5qZSBnb3JlIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfQogIF0KfQo="],"libraries\/H5P.Column-1.16\/language\/ca.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJMbGlzdGEgZGVsIGNvbnRpbmd1dCBkZSBsYSBjb2x1bW5hIiwKICAgICAgImVudGl0eSI6ICJjb250aW5ndXQiLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkNvbnRpbmd1dCIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJTZXBhcmEgZWwgY29udGluZ3V0IGFtYiB1biByZWdsZSBob3JpdHpvbnRhbCIsCiAgICAgICAgICAgICJvcHRpb25zIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJBdXRvbcOgdGljIChvcGNpw7MgcHJlZGV0ZXJtaW5hZGEpIgogICAgICAgICAgICAgIH0sCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIk5vIHV0aWxpdHppcyBtYWkgZWwgcmVnbGUgZGUgbGEgcGFydCBzdXBlcmlvciIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJVdGlsaXR6YSBzZW1wcmUgZWwgcmVnbGUgZGUgbGEgcGFydCBzdXBlcmlvciIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0KICBdCn0K"],"libraries\/H5P.Column-1.16\/language\/cs.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJTZXpuYW0gb2JzYWh1IHNsb3VwY8WvIiwKICAgICAgImVudGl0eSI6ICJvYnNhaCIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiT2JzYWgiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiT2RkxJtsaXQgb2JzYWggdm9kb3Jvdm5vdSDEjcOhcm91IiwKICAgICAgICAgICAgIm9wdGlvbnMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIkF1dG9tYXRpY2t5ICh2w71jaG96w60pIgogICAgICAgICAgICAgIH0sCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIk5pa2R5IG5lb2RkxJtsb3ZhdCB2b2Rvcm92bm91IMSNYXJvdSBzaG9yYSIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJWxb5keSBvZGTEm2xvdmF0IHZvZG9yb3Zub3UgxI1hcm91IHNob3JhIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfQogIF0KfQo="],"libraries\/H5P.Column-1.16\/language\/cy.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJSaGVzdHIgbyBHeW5ud3lzIHkgR29sb2ZuIiwKICAgICAgImVudGl0eSI6ICJjeW5ud3lzIiwKICAgICAgImZpZWxkIjogewogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJDeW5ud3lzIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkd3YWhhbndjaCBneW5ud3lzIGd5ZGEgbWVzdXJ5ZGQgbGxvcndlZGRvbCIsCiAgICAgICAgICAgICJvcHRpb25zIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJBd3RvbWF0aWcgKGRpb2Z5bikiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiQnl0aCB5biBkZWZueWRkaW8gbWVzdXJ5ZGQgdXdjaGJlbiIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJXYXN0YWQgeW4gZGVmbnlkZGlvIG1lc3VyeWRkIHV3Y2hiZW4iCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Column-1.16\/language\/da.json":["application\/json","ewogICJzZW1hbnRpY3MiOlsKICAgIHsKICAgICAgImxhYmVsIjoiTGlzdCBvZiBDb2x1bW4gQ29udGVudCIsCiAgICAgICJlbnRpdHkiOiJjb250ZW50IiwKICAgICAgImZpZWxkIjp7CiAgICAgICAgImZpZWxkcyI6WwogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiJDb250ZW50IgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjoiU2VwYXJhdGUgY29udGVudCB3aXRoIGEgaG9yaXpvbnRhbCBydWxlciIsCiAgICAgICAgICAgICJvcHRpb25zIjpbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjoiQXV0b21hdGljIChkZWZhdWx0KSIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6Ik5ldmVyIHVzZSBydWxlciBhYm92ZSIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6IkFsd2F5cyB1c2UgcnVsZXIgYWJvdmUiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Column-1.16\/language\/de.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJMaXN0ZSBkZXIgU3BhbHRlbmluaGFsdGUiLAogICAgICAiZW50aXR5IjogIkluaGFsdCIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiSW5oYWx0IgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlRyZW5uZSBJbmhhbHQgbWl0IGVpbmVyIGhvcml6b250YWxlbiBMaW5pZSIsCiAgICAgICAgICAgICJvcHRpb25zIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJBdXRvbWF0aXNjaCAoVm9yZWluc3RlbGx1bmcpIgogICAgICAgICAgICAgIH0sCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlZvciBkaWVzZW0gSW5oYWx0IG5pZSBlaW5lIFRyZW5ubGluaWUgYW56ZWlnZW4iCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiVm9yIGRpZXNlbSBJbmhhbHQgaW1tZXIgZWluZSBUcmVubmxpbmllIGFuemVpZ2VuIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfQogIF0KfQo="],"libraries\/H5P.Column-1.16\/language\/el.json":["application\/json","ewogICJzZW1hbnRpY3MiOlsKICAgIHsKICAgICAgImxhYmVsIjoizpvOr8+Dz4TOsSDOsc69z4TOuc66zrXOuc68zq3Ovc+Jzr0gz4POtSDPg8+Ezq7Ou861z4IiLAogICAgICAiZW50aXR5IjoizrHOvc+EzrnOus61zrnOvM61zr3Ov8+FIiwKICAgICAgImZpZWxkIjp7CiAgICAgICAgImZpZWxkcyI6WwogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiLOkc69z4TOuc66zrXOr868zrXOvc6\/IgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjoizpTOuc6xz4fPic+BzrnPg868z4zPgiDOsc69z4TOuc66zrXOuc68zq3Ovc+Jzr0gzrzOtSDOv8+BzrnOts+Mzr3PhM65zrEgzrPPgc6xzrzOvM6uIiwKICAgICAgICAgICAgIm9wdGlvbnMiOlsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiLOkc+Fz4TPjM68zrHPhM6\/ICjPgM+Bzr\/Otc+AzrnOu86\/zrPOrikiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiLOoM6\/z4TOrSDOvM61IM60zrnOsc+Hz4nPgc65z4PPhM65zrrPjCIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6Is6gzqzOvc+EzrEgzrzOtSDOtM65zrHPh8+Jz4HOuc+Dz4TOuc66z4wiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Column-1.16\/language\/es.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJMaXN0YSBkZSBDb250ZW5pZG8gZGUgQ29sdW1uYSIsCiAgICAgICJlbnRpdHkiOiAiY29udGVuaWRvIiwKICAgICAgImZpZWxkIjogewogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJDb250ZW5pZG8iCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiU2VwYXJhciBjb250ZW5pZG8gY29uIHVuYSByZWdsYSBob3Jpem9udGFsIiwKICAgICAgICAgICAgIm9wdGlvbnMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIkF1dG9tw6F0aWNvIChwcmVkZXRlcm1pbmFkbykiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiTnVuY2EgdXNhciByZWdsYSBhcnJpYmEiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiU2llbXByZSB1c2FyIHJlZ2xhIGFycmliYSIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0KICBdCn0K"],"libraries\/H5P.Column-1.16\/language\/es-mx.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJMaXN0YSBkZSBDb250ZW5pZG8gZGUgQ29sdW1uYSIsCiAgICAgICJlbnRpdHkiOiAiY29udGVuaWRvIiwKICAgICAgImZpZWxkIjogewogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJDb250ZW5pZG8iCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiU2VwYXJhciBjb250ZW5pZG8gY29uIHVuYSByZWdsYSBob3Jpem9udGFsIiwKICAgICAgICAgICAgIm9wdGlvbnMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIkF1dG9tw6F0aWNvIChwcmVkZXRlcm1pbmFkbykiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiTnVuY2EgdXNhciByZWdsYSBhcnJpYmEiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiU2llbXByZSB1c2FyIHJlZ2xhIGFycmliYSIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0KICBdCn0K"],"libraries\/H5P.Column-1.16\/language\/et.json":["application\/json","ewogICJzZW1hbnRpY3MiOlsKICAgIHsKICAgICAgImxhYmVsIjoiVmVlcnUgc2lzdSBsb2V0ZWx1IiwKICAgICAgImVudGl0eSI6InNpc3UiLAogICAgICAiZmllbGQiOnsKICAgICAgICAiZmllbGRzIjpbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6IlNpc3UiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiJFcmFsZGEgc2lzdSBob3Jpc29udGFhbGpvb25lZ2EiLAogICAgICAgICAgICAib3B0aW9ucyI6WwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6IkF1dG9tYWF0bmUgKHZhaWtpbWlzaSkiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiLDhHJhIGthc3V0YSBlcmFsZGFqYXQga3VuYWdpIgogICAgICAgICAgICAgIH0sCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjoiQWxhdGkga2FzdXRhIGVyYWxkYWphdCIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0KICBdCn0K"],"libraries\/H5P.Column-1.16\/language\/eu.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJadXRhYmVhcmVuIGVkdWtpYXJlbiB6ZXJyZW5kYSIsCiAgICAgICJlbnRpdHkiOiAiZWR1a2lhIiwKICAgICAgImZpZWxkIjogewogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJFZHVraWEiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiRXJyZWdsYSBob3Jpem9udGFsIGJhdGV6IGJhbmF0dXRha28gZWR1a2lhIiwKICAgICAgICAgICAgIm9wdGlvbnMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIkF1dG9tYXRpa29hIChsZWhlbmV0c2lhKSIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJFeiBlcmFiaWxpIGlub2l6IGdvaWtvIGVycmVnZWxhIgogICAgICAgICAgICAgIH0sCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIkVyYWJpbGkgYmV0aSBnb2lrbyBlcnJlZ2VsYSIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0KICBdCn0K"],"libraries\/H5P.Column-1.16\/language\/fa.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLZhNuM2LPYqiDZhdit2KrZiNin24wg2LPYqtmI2YYiLAogICAgICAiZW50aXR5IjogItmF2K3YqtmI2KciLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogItmF2K3YqtmI2KciCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAi2YXYrdiq2YjYp9uMINis2K\/Yp9qv2KfZhtmHINio2Kcg24zaqSDYrti34oCM2qnYtCDYp9mB2YLbjCIsCiAgICAgICAgICAgICJvcHRpb25zIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICLYrtmI2K\/aqdin2LEgKNm+24zYtOKAjNmB2LHYtikiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAi2YfbjNqGINmI2YLYqiDYp9iyINiu2LfigIzaqdi0INio2KfZhNinINin2LPYqtmB2KfYr9mHINmG2qnZhtuM2K8iCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAi2YfZhduM2LTZhyDYp9iyINiu2LfigIzaqdi0INio2KfZhNinINin2LPYqtmB2KfYr9mHINqp2YbbjNivIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfQogIF0KfQo="],"libraries\/H5P.Column-1.16\/language\/fi.json":["application\/json","ewogICJzZW1hbnRpY3MiOlsKICAgIHsKICAgICAgImxhYmVsIjoiT3Npb3QiLAogICAgICAiZW50aXR5Ijoib3NpbyIsCiAgICAgICJmaWVsZCI6ewogICAgICAgICJmaWVsZHMiOlsKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjoiT3Npb24gc2lzw6RsdMO2IgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjoiRXJvdGEgb3NpbyB2YWFrYXZpaXZhbGxhIiwKICAgICAgICAgICAgIm9wdGlvbnMiOlsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiJBdXRvIChvbGV0dXMpIgogICAgICAgICAgICAgIH0sCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjoiw4Rsw6Qga29za2FhbiBrw6R5dMOkIGVyb3RpbnRhIgogICAgICAgICAgICAgIH0sCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjoiS8OkeXTDpCBlcm90aW50YSBhaW5hIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfQogIF0KfQo="],"libraries\/H5P.Column-1.16\/language\/fr.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJMaXN0ZSBkZXMgY29udGVudXMgZW1waWzDqXMiLAogICAgICAiZW50aXR5IjogImNvbnRlbnUiLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkNvbnRlbnUiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiU8OpcGFyZXIgbGUgY29udGVudSBhdmVjIHVuIGTDqWxpbWl0ZXVyIGhvcml6b250YWwiLAogICAgICAgICAgICAib3B0aW9ucyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiQXV0b21hdGlxdWUgKGTDqWZhdXQpIgogICAgICAgICAgICAgIH0sCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIk5lIGphbWFpcyBhZmZpY2hlciBsZSBzw6lwYXJhdGV1ciBhdS1kZXNzdXMiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiVG91am91cnMgYWZmaWNoZXIgbGUgc8OpcGFyYXRldXIgYXUtZGVzc3VzIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfQogIF0KfQo="],"libraries\/H5P.Column-1.16\/language\/gl.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJMaXN0YWRvIGRvIENvbnRpZG8gZGEgQ29sdW1uYSIsCiAgICAgICJlbnRpdHkiOiAiY29udGlkbyIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQ29udGlkbyIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJTZXBhcmFyIG8gY29udGlkbyBjdW5oYSByZWdyYSBob3Jpem9udGFsIiwKICAgICAgICAgICAgIm9wdGlvbnMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIkF1dG9tw6F0aWNvIChwb3IgZGVmZWN0bykiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiTnVuY2EgdXNhciByZWdyYSBlbnJpYmEiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiU2VtcHJlIHVzYXIgcmVnbGEgZW5yaWJhIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfQogIF0KfQo="],"libraries\/H5P.Column-1.16\/language\/he.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLXqNep15nXnteUINep15wg16rXm9eg15nXnSDXkdei157XldeTIiwKICAgICAgImVudGl0eSI6ICLXqteV15vXnyIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAi16rXldeb158iCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAi15TXpNeo15PXqiDXqteb16DXmdedINeR16LXlteo16og16fXlSDXkNeV16TXp9eZIiwKICAgICAgICAgICAgIm9wdGlvbnMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIteQ15XXmNeV157XmNeZICjXkdeo15nXqNeq1r7XnteX15PXnCkiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAi15zXnNeQINeU16TXqNeT15QiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAi15TXpNeo15PXlCDXqtee15nXkyIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0KICBdCn0K"],"libraries\/H5P.Column-1.16\/language\/hu.json":["application\/json","ewogICJzZW1hbnRpY3MiOlsKICAgIHsKICAgICAgImxhYmVsIjoiTGlzdCBvZiBDb2x1bW4gQ29udGVudCIsCiAgICAgICJlbnRpdHkiOiJjb250ZW50IiwKICAgICAgImZpZWxkIjp7CiAgICAgICAgImZpZWxkcyI6WwogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiJDb250ZW50IgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjoiU2VwYXJhdGUgY29udGVudCB3aXRoIGEgaG9yaXpvbnRhbCBydWxlciIsCiAgICAgICAgICAgICJvcHRpb25zIjpbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjoiQXV0b21hdGljIChkZWZhdWx0KSIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6Ik5ldmVyIHVzZSBydWxlciBhYm92ZSIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6IkFsd2F5cyB1c2UgcnVsZXIgYWJvdmUiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Column-1.16\/language\/it.json":["application\/json","ewogICJzZW1hbnRpY3MiOlsKICAgIHsKICAgICAgImxhYmVsIjoiRWxlbmNvIGRlaSBjb250ZW51dGkgZGkgQ29sdW1uIiwKICAgICAgImVudGl0eSI6ImNvbnRlbnV0byIsCiAgICAgICJmaWVsZCI6ewogICAgICAgICJmaWVsZHMiOlsKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjoiQ29udGVudXRvIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjoiU2VwYXJhIGlsIGNvbnRlbnV0byBjb24gdW5hIHJpZ2Egb3JpenpvbnRhbGUiLAogICAgICAgICAgICAib3B0aW9ucyI6WwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6IkF1dG9tYXRpY28gKGltcG9zdGF6aW9uZSBwcmVkZWZpbml0YSkiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiJOb24gdXRpbGl6emFyZSBtYWkgbGEgcmlnYSBkaSBzZXBhcmF6aW9uZSBxdWkgc29wcmEiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiJVc2Egc2VtcHJlIGxhIHJpZ2EgZGkgc2VwYXJhemlvbmUgcXVpIHNvcHJhIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfQogIF0KfQo="],"libraries\/H5P.Column-1.16\/language\/ja.json":["application\/json","ewogICJzZW1hbnRpY3MiOlsKICAgIHsKICAgICAgImxhYmVsIjoi44Kr44Op44Og44Kz44Oz44OG44Oz44OE44Gu44Oq44K544OIIiwKICAgICAgImVudGl0eSI6IuOCs+ODs+ODhuODs+ODhCIsCiAgICAgICJmaWVsZCI6ewogICAgICAgICJmaWVsZHMiOlsKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjoi44Kz44Oz44OG44Oz44OEIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjoi5rC05bmz57ea44Gn44Kz44Oz44OG44Oz44OE44KS5YiG5YmyIiwKICAgICAgICAgICAgIm9wdGlvbnMiOlsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiLoh6rli5XvvIjjg4fjg5Xjgqnjg6vjg4jvvIkiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiLmsLTlubPnt5rjgpLkvb\/jgo\/jgarjgYQiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiLmsLTlubPnt5rjgpLkvb\/jgYYiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Column-1.16\/language\/ka.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLhg6Hhg5Xhg5Thg6Lhg5jhg6Eg4YOo4YOY4YOc4YOQ4YOQ4YOg4YOh4YOY4YOhIOGDqeGDkOGDm+GDneGDnOGDkOGDl+GDleGDkOGDmuGDmCIsCiAgICAgICJlbnRpdHkiOiAi4YOo4YOY4YOc4YOQ4YOQ4YOg4YOh4YOYIiwKICAgICAgImZpZWxkIjogewogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICLhg6jhg5jhg5zhg5Dhg5Dhg6Dhg6Hhg5giCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAi4YOo4YOY4YOc4YOQ4YOQ4YOg4YOh4YOY4YOhIOGDsOGDneGDoOGDmOGDluGDneGDnOGDouGDkOGDmuGDo+GDoOGDmCDhg67hg5Dhg5bhg5jhg5cg4YOS4YOQ4YOn4YOd4YOk4YOQIiwKICAgICAgICAgICAgIm9wdGlvbnMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIuGDkOGDleGDouGDneGDm+GDkOGDouGDo+GDoOGDmCAo4YOh4YOi4YOQ4YOc4YOT4YOQ4YOg4YOi4YOj4YOa4YOYKSIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICLhg5Dhg6Dhg5Dhg6Hhg53hg5Phg5Thg6Eg4YOS4YOQ4YOb4YOd4YOY4YOn4YOU4YOc4YOdIOGDluGDlOGDk+GDkCDhg6Hhg5Dhg67hg5Dhg5bhg5Dhg5Xhg5giCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAi4YOn4YOd4YOV4YOU4YOa4YOX4YOV4YOY4YOhIOGDkuGDkOGDm+GDneGDmOGDp+GDlOGDnOGDlCDhg6Xhg5Xhg5Thg5Phg5Ag4YOh4YOQ4YOu4YOQ4YOW4YOQ4YOV4YOYIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfQogIF0KfQo="],"libraries\/H5P.Column-1.16\/language\/ko.json":["application\/json","ewogICJzZW1hbnRpY3MiOlsKICAgIHsKICAgICAgImxhYmVsIjoi7Je0KGNvbHVtbinroZzrkJwg7L2Y7YWQ7LigIOuqqeuhnSIsCiAgICAgICJlbnRpdHkiOiIg7L2Y7YWQ7LigIiwKICAgICAgImZpZWxkIjp7CiAgICAgICAgImZpZWxkcyI6WwogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiLsvZjthZDsuKAiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiLsiJjtj4kg64iI6riI7J6Q66GcIOuCtOyaqSDqtazrtoQiLAogICAgICAgICAgICAib3B0aW9ucyI6WwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6IuyekOuPmSAo6riw67O46rCSKSIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6IuuIiOq4iOyekCDsgqzsmqkg7JWK6riwZSIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6Iu2VreyDgeuIiOq4iOyekCDsgqzsmqntlZjquLAiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Column-1.16\/language\/lt.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJTdHVscGVsaW8gdHVyaW5pbyBzxIVyYcWhYXMiLAogICAgICAiZW50aXR5IjogInR1cmlueXMiLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlR1cmlueXMiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQXRza2lydGkgdHVyaW7EryBob3Jpem9udGFsaWEgbGluaXVvdGUiLAogICAgICAgICAgICAib3B0aW9ucyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiQXV0b21hdGluaXMgKG51bWF0eXRhc2lzKSIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJOaWVrYWRhIG5lbmF1ZG90aSBsaW5pdW90xJdzIGF1a8WhxI1pYXUiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiVmlzYWRhIG5hdWRvdGkgbGluaXVvdMSZIGF1a8WhxI1pYXUiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Column-1.16\/language\/lv.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJLb2xvbm51IHNhdHVyYSBzYXJha3N0cyIsCiAgICAgICJlbnRpdHkiOiAic2F0dXJzIiwKICAgICAgImZpZWxkIjogewogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJTYXR1cnMiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiQXRkYWzEq3Qgc2F0dXJ1IGFyIGhvcml6b250xIFsdSBsxKtuaWp1IiwKICAgICAgICAgICAgIm9wdGlvbnMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIkF1dG9txIF0aXNrcyAocMSTYyBub2tsdXPEk2p1bWEpIgogICAgICAgICAgICAgIH0sCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIk5la2FkIG5laXptYW50b3QgYXVnxaHEk2pvIGzEq25panUiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiVmllbm3Ek3IgaXptYW50b3QgYXVnxaHEk2pvIGzEq25panUiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Column-1.16\/language\/mn.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLQkdCw0LPQsNC90YvQvSDQsNCz0YPRg9C70LPRi9C9INC20LDQs9GB0LDQsNC70YIiLAogICAgICAiZW50aXR5IjogItCw0LPRg9GD0LvQs9CwIiwKICAgICAgImZpZWxkIjogewogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICLQkNCz0YPRg9C70LPQsCIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICLQkNCz0YPRg9C70LPRi9CzINGF0Y3QstGC0Y3RjSDQt9Cw0YXQuNGA0LDQs9GH0LDQsNGAINGC0YPRgdCz0LDQsNGA0LvQsCIsCiAgICAgICAgICAgICJvcHRpb25zIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICLQkNCy0YLQvtC80LDRgiAo06nQs9Op0LPQtNC806nQuykiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAi0JTRjdGN0YDRhSDQt9Cw0YXQuNGA0LDQs9GH0LjQudCzINGF0Y3Qt9GN0Y0g0Ycg0LHSr9KvINCw0YjQuNCz0LvQsNCw0YDQsNC5IgogICAgICAgICAgICAgIH0sCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogItCU0Y3RjdGA0YUg0LfQsNGF0LjRgNCw0LPRh9C40LnQsyDSr9GA0LPRjdC70LYg0LDRiNC40LPQu9Cw0LDRgNCw0LkiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Column-1.16\/language\/nb.json":["application\/json","ewogICJzZW1hbnRpY3MiOlsKICAgIHsKICAgICAgImxhYmVsIjoiTGlzdGUgbWVkIGtvbG9ubmVpbm5ob2xkIiwKICAgICAgImVudGl0eSI6ImlubmhvbGQiLAogICAgICAiZmllbGQiOnsKICAgICAgICAiZmllbGRzIjpbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6IklubmhvbGQiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiJEZWwgaW5uaG9sZCBtZWQgZW4gaG9yaXNvbnRhbCBsaW5qZSIsCiAgICAgICAgICAgICJvcHRpb25zIjpbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjoiQXV0b21hdGlzayAoc3RhbmRhcmQpIgogICAgICAgICAgICAgIH0sCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjoiQWxkcmkgYnJ1ayBsaW5qZSBvdmVyIgogICAgICAgICAgICAgIH0sCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjoiQWxsdGlkIGJydWsgbGluamUgb3ZlciIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0KICBdCn0K"],"libraries\/H5P.Column-1.16\/language\/nl.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJMaWpzdCBtZXQga29sb21pbmhvdWQiLAogICAgICAiZW50aXR5IjogImluaG91ZCIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiSW5ob3VkIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlNjaGVpZCBkZSBpbmhvdWQgbWV0IGVlbiBob3Jpem9udGFsZSBsaWpuIiwKICAgICAgICAgICAgIm9wdGlvbnMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIkF1dG9tYXRpc2NoIChzdGFuZGFhcmQpIgogICAgICAgICAgICAgIH0sCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIkdlYnJ1aWsgbm9vaXQgZWVuIGxpam4gZXJib3ZlbiIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJHZWJydWlrIGFsdGlqZCBlZW4gbGlqbiBlcmJvdmVuIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfQogIF0KfQo="],"libraries\/H5P.Column-1.16\/language\/nn.json":["application\/json","ewogICJzZW1hbnRpY3MiOlsKICAgIHsKICAgICAgImxhYmVsIjoiTGlzdCBvZiBDb2x1bW4gQ29udGVudCIsCiAgICAgICJlbnRpdHkiOiJjb250ZW50IiwKICAgICAgImZpZWxkIjp7CiAgICAgICAgImZpZWxkcyI6WwogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiJDb250ZW50IgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjoiU2VwYXJhdGUgY29udGVudCB3aXRoIGEgaG9yaXpvbnRhbCBydWxlciIsCiAgICAgICAgICAgICJvcHRpb25zIjpbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjoiQXV0b21hdGljIChkZWZhdWx0KSIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6Ik5ldmVyIHVzZSBydWxlciBhYm92ZSIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6IkFsd2F5cyB1c2UgcnVsZXIgYWJvdmUiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Column-1.16\/language\/pl.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJMaXN0YSB6YXdhcnRvxZtjaSBrb2x1bW55IiwKICAgICAgImVudGl0eSI6ICJ6YXdhcnRvxZvEhyIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiWmF3YXJ0b8WbxIciCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiT2RkemllbCB6YXdhcnRvxZvEhyBwb3ppb23EhSBsaW5pamvEhSIsCiAgICAgICAgICAgICJvcHRpb25zIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJBdXRvbWF0eWN6bmUgKGRvbXnFm2xuaWUpIgogICAgICAgICAgICAgIH0sCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIk5pZ2R5IG5pZSB1xbx5d2FqIGxpbmlqa2kgcG93ecW8ZWoiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiWmF3c3plIHXFvHl3YWogbGluaWpraSBwb3d5xbxlaiIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0KICBdCn0K"],"libraries\/H5P.Column-1.16\/language\/pt-br.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJMaXN0YSBkZSBjb250ZcO6ZG8gZGEgY29sdW5hIiwKICAgICAgImVudGl0eSI6ICJjb250ZcO6ZG8iLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkNvbnRlw7pkbyIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJTZXBhcmFyIG9zIGNvbnRlw7pkb3MgY29tIHVtYSBsaW5oYSBob3Jpem9udGFsIiwKICAgICAgICAgICAgIm9wdGlvbnMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIkF1dG9tw6F0aWNvIChwYWRyw6NvKSIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJOdW5jYSB1dGlsaXphciBsaW5oYSBhY2ltYSIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJTZW1wcmUgdXRpbGl6YXIgbGluaGEgYWNpbWEiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Column-1.16\/language\/pt.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJMaXN0YSBkbyBjb250ZcO6ZG8gZGEgY29sdW5hIiwKICAgICAgImVudGl0eSI6ICJjb250ZcO6ZG8iLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIkNvbnRlw7pkbyIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJTZXBhcmFyIGNvbnRlw7pkb3MgY29tIHVtYSBsaW5oYSBob3Jpem9udGFsIiwKICAgICAgICAgICAgIm9wdGlvbnMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIkF1dG9tw6F0aWNvIChwcmVkZWZpbmnDp8OjbykiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiTnVuY2EgdXNhciBhIHLDqWd1YSBhY2ltYSIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJVdGlsaXphciBzZW1wcmUgYSByw6lndWEgYWNpbWEiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Column-1.16\/language\/ro.json":["application\/json","ewogICJzZW1hbnRpY3MiOlsKICAgIHsKICAgICAgImxhYmVsIjoiTGlzdCBvZiBDb2x1bW4gQ29udGVudCIsCiAgICAgICJlbnRpdHkiOiJjb250ZW50IiwKICAgICAgImZpZWxkIjp7CiAgICAgICAgImZpZWxkcyI6WwogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiJDb250ZW50IgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjoiU2VwYXJhdGUgY29udGVudCB3aXRoIGEgaG9yaXpvbnRhbCBydWxlciIsCiAgICAgICAgICAgICJvcHRpb25zIjpbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjoiQXV0b21hdGljIChkZWZhdWx0KSIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6Ik5ldmVyIHVzZSBydWxlciBhYm92ZSIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6IkFsd2F5cyB1c2UgcnVsZXIgYWJvdmUiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Column-1.16\/language\/ru.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLQodC\/0LjRgdC+0Log0YHQvtC00LXRgNC20LjQvNC+0LPQviDQutC+0L3RgtC10L3RgtCwIiwKICAgICAgImVudGl0eSI6ICLQutC+0L3RgtC10L3RgiIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAi0JrQvtC90YLQtdC90YIiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAi0KDQsNC30LTQtdC70LjRgtGMINC60L7QvdGC0LXQvdGCINCz0L7RgNC40LfQvtC90YLQsNC70YzQvdC+0Lkg0LvQuNC90LjQtdC5IiwKICAgICAgICAgICAgIm9wdGlvbnMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogItCQ0LLRgtC+0LzQsNGC0LjRh9C10YHQutC4ICjQv9C+INGD0LzQvtC70YfQsNC90LjRjikiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAi0J3QuNC60L7Qs9C00LAg0L3QtSDQuNGB0L\/QvtC70YzQt9C+0LLQsNGC0Ywg0LvQuNC90LjRjiDRgdCy0LXRgNGF0YMiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAi0JLRgdC10LPQtNCwINC40YHQv9C+0LvRjNC30L7QstCw0YLRjCDQu9C40L3QuNGOINGB0LLQtdGA0YXRgyIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0KICBdCn0K"],"libraries\/H5P.Column-1.16\/language\/sl.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJTZXpuYW0gdnNlYmluZSBzdG9scGNhIiwKICAgICAgImVudGl0eSI6ICJ2c2ViaW5hIiwKICAgICAgImZpZWxkIjogewogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJWc2ViaW5hIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlZzZWJpbm8gbG\/EjWkgeiB2b2RvcmF2bm8gxI1ydG8iLAogICAgICAgICAgICAib3B0aW9ucyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiU2Ftb2Rlam5vIChwcml2emV0bykiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiTmlrb2xpIG5lIGxvxI1pIHMgxI1ydG8gemdvcmFqIgogICAgICAgICAgICAgIH0sCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlZlZG5vIGxvxI1pIHMgxI1ydG8gemdvcmFqIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfQogIF0KfQo="],"libraries\/H5P.Column-1.16\/language\/sma.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJMaXN0IG9mIENvbHVtbiBDb250ZW50IiwKICAgICAgImVudGl0eSI6ICJjb250ZW50IiwKICAgICAgImZpZWxkIjogewogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJDb250ZW50IgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlNlcGFyYXRlIGNvbnRlbnQgd2l0aCBhIGhvcml6b250YWwgcnVsZXIiLAogICAgICAgICAgICAib3B0aW9ucyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiQXV0b21hdGljIChkZWZhdWx0KSIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJOZXZlciB1c2UgcnVsZXIgYWJvdmUiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiQWx3YXlzIHVzZSBydWxlciBhYm92ZSIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0KICBdCn0K"],"libraries\/H5P.Column-1.16\/language\/sme.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJMaXN0IG9mIENvbHVtbiBDb250ZW50IiwKICAgICAgImVudGl0eSI6ICJjb250ZW50IiwKICAgICAgImZpZWxkIjogewogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJDb250ZW50IgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlNlcGFyYXRlIGNvbnRlbnQgd2l0aCBhIGhvcml6b250YWwgcnVsZXIiLAogICAgICAgICAgICAib3B0aW9ucyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiQXV0b21hdGljIChkZWZhdWx0KSIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJOZXZlciB1c2UgcnVsZXIgYWJvdmUiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiQWx3YXlzIHVzZSBydWxlciBhYm92ZSIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0KICBdCn0K"],"libraries\/H5P.Column-1.16\/language\/smj.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJMaXN0IG9mIENvbHVtbiBDb250ZW50IiwKICAgICAgImVudGl0eSI6ICJjb250ZW50IiwKICAgICAgImZpZWxkIjogewogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJDb250ZW50IgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIlNlcGFyYXRlIGNvbnRlbnQgd2l0aCBhIGhvcml6b250YWwgcnVsZXIiLAogICAgICAgICAgICAib3B0aW9ucyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiQXV0b21hdGljIChkZWZhdWx0KSIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJOZXZlciB1c2UgcnVsZXIgYWJvdmUiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiQWx3YXlzIHVzZSBydWxlciBhYm92ZSIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0KICBdCn0K"],"libraries\/H5P.Column-1.16\/language\/sr.json":["application\/json","ewogICJzZW1hbnRpY3MiOlsKICAgIHsKICAgICAgImxhYmVsIjoi0KHQv9C40YHQsNC6INGB0LDQtNGA0LbQsNGY0LAg0LrQvtC70L7QvdC1IiwKICAgICAgImVudGl0eSI6ImNvbnRlbnQiLAogICAgICAiZmllbGQiOnsKICAgICAgICAiZmllbGRzIjpbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ItCh0LDQtNGA0LbQsNGYIgogICAgICAgICAgfSwKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjoi0J7QtNCy0L7RmNC40YLQtSDRgdCw0LTRgNC20LDRmCDQstC+0LTQvtGA0LDQstC90LjQvCDQu9C10ZrQuNGA0L7QvCIsCiAgICAgICAgICAgICJvcHRpb25zIjpbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjoi0JDRg9GC0L7QvNCw0YLRgdC60LggKGRlZmF1bHQpIgogICAgICAgICAgICAgIH0sCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjoi0J3QuNC60LDQtNCwINC90LUg0LrQvtGA0LjRgdGC0LjRgtC1INC70LXRmtC40YAg0LjQt9C90LDQtCIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ItCj0LLQtdC6INC60L7RgNC40YHRgtC40YLQtSDQu9C10ZrQuNGAINCz0L7RgNC1IgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfQogIF0KfQo="],"libraries\/H5P.Column-1.16\/language\/sv.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJMaXN0YSBtZWQgaW5uZWjDpWxsIGkga29sdW1uIiwKICAgICAgImVudGl0eSI6ICJpbm5laMOlbGwiLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIklubmVow6VsbCIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICJTZXBhcmVyYSBpbm5laMOlbGwgbWVkIGhvcmlzb250ZWxsIGxpbmplIiwKICAgICAgICAgICAgIm9wdGlvbnMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIkF1dG9tYXRpc2sgKHN0YW5kYXJkKSIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJBbnbDpG5kIGFsZHJpZyBsaW5qZSBvdmFuZsO2ciIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJBbnbDpG5kIGFsbHRpZCBsaW5qZSBvdmFuZsO2ciIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0KICBdCn0K"],"libraries\/H5P.Column-1.16\/language\/sw.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJPcm9kaGEgeWEgTWF1ZGh1aSB5YSBTYWZ1IHdpbWEiLAogICAgICAiZW50aXR5IjogIm1hdWRodWkiLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIk1hdWRodWkiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiVGVuZ2FuaXNoYSBtYXVkaHVpIGt3YSBydWxhIG1sYWxvIiwKICAgICAgICAgICAgIm9wdGlvbnMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIk90b21hdGlraSAoY2hhZ3VvLW1zaW5naSkiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiS2Ftd2UgdXNpdHVtaWUgcnVsYSBoYXBvIGp1dSIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJLaWxhIHdha2F0aSB0dW1pYSBydWxhIGhhcG8ganV1IgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfQogIF0KfQo="],"libraries\/H5P.Column-1.16\/language\/te.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLgsJXgsL7gsLLgsK7gsY0g4LCV4LCC4LCf4LGG4LCC4LCf4LGNIOCwnOCwvuCwrOCwv+CwpOCwviIsCiAgICAgICJlbnRpdHkiOiAi4LCV4LCC4LCf4LGG4LCC4LCf4LGNIiwKICAgICAgImZpZWxkIjogewogICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICLgsJXgsILgsJ\/gsYbgsILgsJ\/gsY0iCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAi4LC44LCu4LC+4LCC4LCk4LCwIOCwsOCxguCwsuCwsOCxjeKAjOCwpOCxiyDgsJXgsILgsJ\/gsYbgsILgsJ\/gsY3igIzgsKjgsYEg4LC14LGH4LCw4LGBIOCwmuCxh+Cwr+CwguCwoeCwvyIsCiAgICAgICAgICAgICJvcHRpb25zIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICLgsIbgsJ\/gsYvgsK7gsYfgsJ\/gsL\/gsJXgsY0gKOCwoeCwv+Cwq+CwvuCwsuCxjeCwn+CxjSkiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAi4LCq4LGI4LCoIOCwieCwqOCxjeCwqCDgsLDgsYLgsLLgsLDgsY3igIzgsKjgsL8g4LCO4LCq4LGN4LCq4LGB4LCh4LGCIOCwieCwquCwr+Cxi+Cwl+Cwv+CwguCwmuCwteCwpuCxjeCwpuCxgSIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICLgsI7gsLLgsY3gsLLgsKrgsY3gsKrgsYHgsKHgsYIg4LCq4LGI4LCoIOCwieCwqOCxjeCwqCDgsLDgsYLgsLLgsLDgsY3igIzgsKjgsL8g4LCJ4LCq4LCv4LGL4LCX4LC\/4LCC4LCa4LCC4LCh4LC\/IgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfQogIF0KfQo="],"libraries\/H5P.Column-1.16\/language\/tr.json":["application\/json","ewogICJzZW1hbnRpY3MiOlsKICAgIHsKICAgICAgImxhYmVsIjoiU8O8dHVuIMSww6dlcmlrbGVyIExpc3Rlc2kiLAogICAgICAiZW50aXR5IjoiY29udGVudCIsCiAgICAgICJmaWVsZCI6ewogICAgICAgICJmaWVsZHMiOlsKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjoixLDDp2VyaWsiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiLEsMOnZXJpa2xlcmkgYmlyIGNldHZlbGxlIHlhdGF5IG9sYXJhayBhecSxcsSxbiIsCiAgICAgICAgICAgICJvcHRpb25zIjpbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjoiT3RvbWF0aWsgKHZhcnNhecSxbGFuKSIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6IkFzbGEgeXVrYXLEsWRha2kgY2V0dmVsaSBrdWxsYW5tYSIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6IkhlciB6YW1hbiB5dWthcsSxZGFraSBjZXR2ZWxpIGt1bGxhbiIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICBdCiAgICAgIH0KICAgIH0KICBdCn0K"],"libraries\/H5P.Column-1.16\/language\/uk.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLQodC\/0LjRgdC+0Log0LLQvNGW0YHRgtGDINC60L7Qu9C+0L3QutC4IiwKICAgICAgImVudGl0eSI6ICLQutC+0L3RgtC10L3RgiIsCiAgICAgICJmaWVsZCI6IHsKICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAi0JrQvtC90YLQtdC90YIiCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAi0KDQvtC30LTRltC70LjRgtC4INC60L7QvdGC0LXQvdGCINCz0L7RgNC40LfQvtC90YLQsNC70YzQvdC+0Y4g0LvRltC90ZbRlNGOIiwKICAgICAgICAgICAgIm9wdGlvbnMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogItCQ0LLRgtC+0LzQsNGC0LjRh9C90L4gKNC30LAg0LfQsNC80L7QstGH0YPQstCw0L3QvdGP0LwpIgogICAgICAgICAgICAgIH0sCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogItCd0ZbQutC+0LvQuCDQvdC1INCy0LjQutC+0YDQuNGB0YLQvtCy0YPQstCw0YLQuCDQu9GW0L3RltGOINC30LLQtdGA0YXRgyIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICLQl9Cw0LLQttC00Lgg0LLQuNC60L7RgNC40YHRgtC+0LLRg9Cy0LDRgtC4INC70ZbQvdGW0Y4g0LfQstC10YDRhdGDIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfQogIF0KfQo="],"libraries\/H5P.Column-1.16\/language\/vi.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJEYW5oIHPDoWNoIG7hu5lpIGR1bmcgY+G7p2EgQ+G7mXQiLAogICAgICAiZW50aXR5IjogIm7hu5lpIGR1bmciLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIk7hu5lpIGR1bmciCiAgICAgICAgICB9LAogICAgICAgICAgewogICAgICAgICAgICAibGFiZWwiOiAiUGjDom4gY8OhY2ggbuG7mWkgZHVuZyBi4bqxbmcgbeG7mXQgxJHGsOG7nW5nIHRo4bqzbmcgbmdhbmciLAogICAgICAgICAgICAib3B0aW9ucyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiVOG7sSDEkeG7mW5nICht4bq3YyDEkeG7i25oKSIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJLaMO0bmcgZMO5bmcgxJHGsOG7nW5nIHBow6JuIGPDoWNoIOG7nyB0csOqbiIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJMdcO0biBkw7luZyDEkcaw4budbmcgcGjDom4gY8OhY2gg4bufIHRyw6puIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIF0KICAgICAgfQogICAgfQogIF0KfQo="],"libraries\/H5P.Column-1.16\/language\/zh.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLmrITkvY3lhaflrrkiLAogICAgICAiZW50aXR5IjogImNvbnRlbnQiLAogICAgICAiZmllbGQiOiB7CiAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgIHsKICAgICAgICAgICAgImxhYmVsIjogIuWFp+WuuSIKICAgICAgICAgIH0sCiAgICAgICAgICB7CiAgICAgICAgICAgICJsYWJlbCI6ICLnlKjmsLTlubPnt5rliIbpmpTlhaflrrkiLAogICAgICAgICAgICAib3B0aW9ucyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAi6Ieq5YuV77yI6aCQ6Kit77yJIgogICAgICAgICAgICAgIH0sCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIuawuOS4jeS9v+eUqCIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICLmsLjpgaDkvb\/nlKgiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgXQogICAgICB9CiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Column-1.16\/library.json":["application\/json","ewogICJtYWNoaW5lTmFtZSI6ICJINVAuQ29sdW1uIiwKICAidGl0bGUiOiAiQ29sdW1uIiwKICAiZGVzY3JpcHRpb24iOiAiQ29udGVudCBob2xkZXIgZGlzcGxheWluZyBjb250ZW50IGluIGEgY29sdW1uLiIsCiAgImNvbnRlbnRUeXBlIjogImluc3RydWN0aW9uYWwiLAogICJsaWNlbnNlIjogIk1JVCIsCiAgImF1dGhvciI6ICJKb3ViZWwiLAogICJtYWpvclZlcnNpb24iOiAxLAogICJtaW5vclZlcnNpb24iOiAxNiwKICAicGF0Y2hWZXJzaW9uIjogNSwKICAicnVubmFibGUiOiAxLAogICJmdWxsc2NyZWVuIjogMCwKICAiZW1iZWRUeXBlcyI6IFsKICAgICJpZnJhbWUiCiAgXSwKICAiY29yZUFwaSI6IHsKICAgICJtYWpvclZlcnNpb24iOiAxLAogICAgIm1pbm9yVmVyc2lvbiI6IDE5CiAgfSwKICAicHJlbG9hZGVkSnMiOiBbCiAgICB7CiAgICAgICJwYXRoIjogInNjcmlwdHMvaDVwLWNvbHVtbi5qcyIKICAgIH0KICBdLAogICJwcmVsb2FkZWRDc3MiOiBbCiAgICB7CiAgICAgICJwYXRoIjogInN0eWxlcy9oNXAtY29sdW1uLmNzcyIKICAgIH0KICBdCn0="],"libraries\/H5P.Column-1.16\/semantics.json":["application\/json","WwogIHsKICAgICJuYW1lIjogImNvbnRlbnQiLAogICAgImxhYmVsIjogIkxpc3Qgb2YgQ29sdW1uIENvbnRlbnQiLAogICAgImltcG9ydGFuY2UiOiAiaGlnaCIsCiAgICAidHlwZSI6ICJsaXN0IiwKICAgICJtaW4iOiAxLAogICAgImVudGl0eSI6ICJjb250ZW50IiwKICAgICJmaWVsZCI6IHsKICAgICAgIm5hbWUiOiAiY29udGVudCIsCiAgICAgICJ0eXBlIjogImdyb3VwIiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAibmFtZSI6ICJjb250ZW50IiwKICAgICAgICAgICJ0eXBlIjogImxpYnJhcnkiLAogICAgICAgICAgImltcG9ydGFuY2UiOiAiaGlnaCIsCiAgICAgICAgICAibGFiZWwiOiAiQ29udGVudCIsCiAgICAgICAgICAib3B0aW9ucyI6IFsKICAgICAgICAgICAgIkg1UC5BY2NvcmRpb24gMS4wIiwKICAgICAgICAgICAgIkg1UC5BZ2Ftb3R0byAxLjUiLAogICAgICAgICAgICAiSDVQLkF1ZGlvIDEuNSIsCiAgICAgICAgICAgICJINVAuQXVkaW9SZWNvcmRlciAxLjAiLAogICAgICAgICAgICAiSDVQLkJsYW5rcyAxLjE0IiwKICAgICAgICAgICAgIkg1UC5DaGFydCAxLjIiLAogICAgICAgICAgICAiSDVQLkNvbGxhZ2UgMC4zIiwKICAgICAgICAgICAgIkg1UC5Db3Vyc2VQcmVzZW50YXRpb24gMS4yNSIsCiAgICAgICAgICAgICJINVAuRGlhbG9nY2FyZHMgMS45IiwKICAgICAgICAgICAgIkg1UC5Eb2N1bWVudGF0aW9uVG9vbCAxLjgiLAogICAgICAgICAgICAiSDVQLkRyYWdRdWVzdGlvbiAxLjE0IiwKICAgICAgICAgICAgIkg1UC5EcmFnVGV4dCAxLjEwIiwKICAgICAgICAgICAgIkg1UC5Fc3NheSAxLjUiLAogICAgICAgICAgICAiSDVQLkd1ZXNzVGhlQW5zd2VyIDEuNSIsCiAgICAgICAgICAgICJINVAuVGFibGUgMS4xIiwKICAgICAgICAgICAgIkg1UC5BZHZhbmNlZFRleHQgMS4xIiwKICAgICAgICAgICAgIkg1UC5JRnJhbWVFbWJlZCAxLjAiLAogICAgICAgICAgICAiSDVQLkltYWdlIDEuMSIsCiAgICAgICAgICAgICJINVAuSW1hZ2VIb3RzcG90cyAxLjEwIiwKICAgICAgICAgICAgIkg1UC5JbWFnZUhvdHNwb3RRdWVzdGlvbiAxLjgiLAogICAgICAgICAgICAiSDVQLkltYWdlU2xpZGVyIDEuMSIsCiAgICAgICAgICAgICJINVAuSW50ZXJhY3RpdmVWaWRlbyAxLjI2IiwKICAgICAgICAgICAgIkg1UC5MaW5rIDEuMyIsCiAgICAgICAgICAgICJINVAuTWFya1RoZVdvcmRzIDEuMTEiLAogICAgICAgICAgICAiSDVQLk1lbW9yeUdhbWUgMS4zIiwKICAgICAgICAgICAgIkg1UC5NdWx0aUNob2ljZSAxLjE2IiwKICAgICAgICAgICAgIkg1UC5RdWVzdGlvbm5haXJlIDEuMyIsCiAgICAgICAgICAgICJINVAuUXVlc3Rpb25TZXQgMS4yMCIsCiAgICAgICAgICAgICJINVAuU2luZ2xlQ2hvaWNlU2V0IDEuMTEiLAogICAgICAgICAgICAiSDVQLlN1bW1hcnkgMS4xMCIsCiAgICAgICAgICAgICJINVAuVGltZWxpbmUgMS4xIiwKICAgICAgICAgICAgIkg1UC5UcnVlRmFsc2UgMS44IiwKICAgICAgICAgICAgIkg1UC5WaWRlbyAxLjYiLAogICAgICAgICAgICAiSDVQLk11bHRpTWVkaWFDaG9pY2UgMC4zIgogICAgICAgICAgXQogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgIm5hbWUiOiAidXNlU2VwYXJhdG9yIiwKICAgICAgICAgICJ0eXBlIjogInNlbGVjdCIsCiAgICAgICAgICAiaW1wb3J0YW5jZSI6ICJsb3ciLAogICAgICAgICAgImxhYmVsIjogIlNlcGFyYXRlIGNvbnRlbnQgd2l0aCBhIGhvcml6b250YWwgcnVsZXIiLAogICAgICAgICAgImRlZmF1bHQiOiAiYXV0byIsCiAgICAgICAgICAib3B0aW9ucyI6IFsKICAgICAgICAgICAgewogICAgICAgICAgICAgICJ2YWx1ZSI6ICJhdXRvIiwKICAgICAgICAgICAgICAibGFiZWwiOiAiQXV0b21hdGljIChkZWZhdWx0KSIKICAgICAgICAgICAgfSwKICAgICAgICAgICAgewogICAgICAgICAgICAgICJ2YWx1ZSI6ICJkaXNhYmxlZCIsCiAgICAgICAgICAgICAgImxhYmVsIjogIk5ldmVyIHVzZSBydWxlciBhYm92ZSIKICAgICAgICAgICAgfSwKICAgICAgICAgICAgewogICAgICAgICAgICAgICJ2YWx1ZSI6ICJlbmFibGVkIiwKICAgICAgICAgICAgICAibGFiZWwiOiAiQWx3YXlzIHVzZSBydWxlciBhYm92ZSIKICAgICAgICAgICAgfQogICAgICAgICAgXQogICAgICAgIH0KICAgICAgXQogICAgfQogIH0KXQ=="],"libraries\/H5PEditor.RangeList-1.0\/language\/ar.json":["application\/json","ewogICJsaWJyYXJ5U3RyaW5ncyI6IHsKICAgICJkaXN0cmlidXRlQnV0dG9uTGFiZWwiOiAi2YjYsti5INio2KfZhNiq2LPYp9mI2YoiLAogICAgImRpc3RyaWJ1dGVCdXR0b25XYXJuaW5nIjogItiz2YrYqtmFINiq2LrZitmK2LEg2KfZhNmC2YrZhSDZhNis2YXZiti5INin2YTZhti32KfZgtin2KouINmH2YQg2KrYsdi62Kgg2KjYp9mE2YXYqtin2KjYudip2J8iLAogICAgInJhbmdlT3V0T2ZTZXF1ZW5jZVdhcm5pbmciOiAi2YbYt9in2YLYp9iqINin2YTYudmE2KfZhdipINmE2YrYs9iqINio2KfZhNiq2LPZhNiz2YQiCiAgfQp9Cg=="],"libraries\/H5PEditor.RangeList-1.0\/language\/bg.json":["application\/json","ew0KICAibGlicmFyeVN0cmluZ3MiOiB7DQogICAgImRpc3RyaWJ1dGVCdXR0b25MYWJlbCI6ICLQoNCw0LfQv9GA0LXQtC4g0YDQsNCy0L3QvtC80LXRgNC90L4iLA0KICAgICJkaXN0cmlidXRlQnV0dG9uV2FybmluZyI6ICLQodGC0L7QudC90L7RgdGC0LjRgtC1INGJ0LUg0LHRitC00LDRgiDQv9GA0L7QvNC10L3QtdC90Lgg0LfQsCDQstGB0LjRh9C60Lgg0L7QsdGF0LLQsNGC0LguINCY0YHQutCw0YLQtSDQu9C4INC00LAg0L\/RgNC+0LTRitC70LbQuNGC0LU\/IiwNCiAgICAicmFuZ2VPdXRPZlNlcXVlbmNlV2FybmluZyI6ICLQntCx0YXQstCw0YLQuNGC0LUg0L3QsCDRgNC10LfRg9C70YLQsNGC0LjRgtC1INC90LUg0YHQsCDQv9C+0YHQu9C10LTQvtCy0LDRgtC10LvQvdC4Ig0KICB9DQp9"],"libraries\/H5PEditor.RangeList-1.0\/language\/ca.json":["application\/json","ewogICJsaWJyYXJ5U3RyaW5ncyI6IHsKICAgICJkaXN0cmlidXRlQnV0dG9uTGFiZWwiOiAiRGlzdHJpYnVlaXggZGUgbWFuZXJhIHVuaWZvcm1lIiwKICAgICJkaXN0cmlidXRlQnV0dG9uV2FybmluZyI6ICJFbHMgdmFsb3JzIGRlIHRvdHMgZWxzIHJhbmdzIGNhbnZpYXJhbi4gVm9sZXUgY29udGludWFyPyIsCiAgICAicmFuZ2VPdXRPZlNlcXVlbmNlV2FybmluZyI6ICJFbHMgcmFuZ3MgZGUgcHVudHVhY2nDsyBzw7NuIGZvcmEgZGUgbGEgc2Vxw7zDqG5jaWEiCiAgfQp9Cg=="],"libraries\/H5PEditor.RangeList-1.0\/language\/cs.json":["application\/json","ewogICJsaWJyYXJ5U3RyaW5ncyI6IHsKICAgICJkaXN0cmlidXRlQnV0dG9uTGFiZWwiOiAiUm96bG\/Fvml0IHJvdm5vbcSbcm7EmyIsCiAgICAiZGlzdHJpYnV0ZUJ1dHRvbldhcm5pbmciOiAiSG9kbm90eSBzZSB6bcSbbsOtIHBybyB2xaFlY2hueSByb3pzYWh5LiBQxZllamV0ZSBzaSBwb2tyYcSNb3ZhdD8iLAogICAgInJhbmdlT3V0T2ZTZXF1ZW5jZVdhcm5pbmciOiAiUm96c2FoeSBza8OzcmUganNvdSBtaW1vIHBvc2xvdXBub3N0IgogIH0KfQo="],"libraries\/H5PEditor.RangeList-1.0\/language\/de.json":["application\/json","ewogICJsaWJyYXJ5U3RyaW5ncyI6IHsKICAgICJkaXN0cmlidXRlQnV0dG9uTGFiZWwiOiAiR2xlaWNobcOkw59pZyB2ZXJ0ZWlsZW4iLAogICAgImRpc3RyaWJ1dGVCdXR0b25XYXJuaW5nIjogIkRpZSBXZXJ0ZSBpbiBhbGxlbiBCZXJlaWNoZW4gd2VyZGVuIGdlw6RuZGVydC4gTcO2Y2h0ZXN0IGR1IGZvcnRmYWhyZW4\/IiwKICAgICJyYW5nZU91dE9mU2VxdWVuY2VXYXJuaW5nIjogIkRpZSBQdW5rdGViZXJlaWNoZSBzaW5kIG5pY2h0IGtvcnJla3Qgc29ydGllcnQiCiAgfQp9Cg=="],"libraries\/H5PEditor.RangeList-1.0\/language\/el.json":["application\/json","ewogICJsaWJyYXJ5U3RyaW5ncyI6IHsKICAgICJkaXN0cmlidXRlQnV0dG9uTGFiZWwiOiAizpnPg86\/zrrOsc+EzrHOvc6\/zrzOriIsCiAgICAiZGlzdHJpYnV0ZUJ1dHRvbldhcm5pbmciOiAizpjOsSDOvM61z4TOsc6yzrvOt864zr\/Pjc69IM6\/zrkgz4TOuc68zq3PgiDOs865zrEgz4zOu861z4Igz4TOuc+CIM66zrvOr868zrHOus61z4IuIM6Vzq\/Pg8+EzrUgz4POr86zzr\/Phc+Bzr\/PgiDPjM+EzrkgzrjOrc67zrXPhM61IM69zrEgz4PPhc69zrXPh86vz4POtc+EzrU7IiwKICAgICJyYW5nZU91dE9mU2VxdWVuY2VXYXJuaW5nIjogIs6fzrkgzrrOu86vzrzOsc66zrXPgiDOss6xzrjOvM6\/zrvOv86zzq\/Osc+CIM61zq\/Ovc6xzrkgzrHPg8+Fzr3Otc+HzrXOr8+CIgogIH0KfQo="],"libraries\/H5PEditor.RangeList-1.0\/language\/en.json":["application\/json","ewogICJsaWJyYXJ5U3RyaW5ncyI6IHsKICAgICJkaXN0cmlidXRlQnV0dG9uTGFiZWwiOiAiRGlzdHJpYnV0ZSBFdmVubHkiLAogICAgImRpc3RyaWJ1dGVCdXR0b25XYXJuaW5nIjogIlZhbHVlcyB3aWxsIGJlIGNoYW5nZWQgZm9yIGFsbCBvZiB0aGUgcmFuZ2VzLiBEbyB5b3Ugd2lzaCB0byBwcm9jZWVkPyIsCiAgICAicmFuZ2VPdXRPZlNlcXVlbmNlV2FybmluZyI6ICJUaGUgc2NvcmUgcmFuZ2VzIGFyZSBvdXQgb2Ygc2VxdWVuY2UiCiAgfQp9Cg=="],"libraries\/H5PEditor.RangeList-1.0\/language\/es.json":["application\/json","ewogICJsaWJyYXJ5U3RyaW5ncyI6IHsKICAgICJkaXN0cmlidXRlQnV0dG9uTGFiZWwiOiAiRGlzdHJpYnVpciBVbmlmb3JtZW1lbnRlIiwKICAgICJkaXN0cmlidXRlQnV0dG9uV2FybmluZyI6ICJTZSBjYW1iaWFyw6FuIGxvcyB2YWxvcmVzIHBhcmEgdG9kb3MgbG9zIHJhbmdvcy4gwr9RdWllcmVzIGNvbnRpbnVhcj8iLAogICAgInJhbmdlT3V0T2ZTZXF1ZW5jZVdhcm5pbmciOiAiTG9zIHJhbmdvcyBkZSBwdW50dWFjacOzbiBlc3TDoW4gZnVlcmEgZGUgc2VjdWVuY2lhIgogIH0KfQo="],"libraries\/H5PEditor.RangeList-1.0\/language\/es-mx.json":["application\/json","ewogICJsaWJyYXJ5U3RyaW5ncyI6IHsKICAgICJkaXN0cmlidXRlQnV0dG9uTGFiZWwiOiAiRGlzdHJpYnVpciBVbmlmb3JtZW1lbnRlIiwKICAgICJkaXN0cmlidXRlQnV0dG9uV2FybmluZyI6ICJMb3MgdmFsb3JlcyBzZXLDoW4gY2FtYmlhZG9zIHBhcmEgdG9kb3MgbG9zIHJhbmdvcy4gwr9EZXNlYSBwcm9zZWd1aXI\/IiwKICAgICJyYW5nZU91dE9mU2VxdWVuY2VXYXJuaW5nIjogIkxvcyByYW5nb3MgZGUgcHVudGFqZSBlc3TDoW4gZnVlcmEgZGUgc2VjdWVuY2lhIgogIH0KfQo="],"libraries\/H5PEditor.RangeList-1.0\/language\/et.json":["application\/json","ewogICJsaWJyYXJ5U3RyaW5ncyI6IHsKICAgICJkaXN0cmlidXRlQnV0dG9uTGFiZWwiOiAiSmFvdGEgw7xodGxhc2VsdCIsCiAgICAiZGlzdHJpYnV0ZUJ1dHRvbldhcm5pbmciOiAiS8O1aWdpIHZhaGVtaWtlIHbDpMOkcnR1c2VkIG11dWRldGFrc2UuIEthcyB0YWhhZCBqw6R0a2F0YT8iLAogICAgInJhbmdlT3V0T2ZTZXF1ZW5jZVdhcm5pbmciOiAiUHVua3Rpc3VtbWFkZSB2YWhlbWlrdWQgasOkcmplc3R1c2VzdCB2w6RsamFzIgogIH0KfQo="],"libraries\/H5PEditor.RangeList-1.0\/language\/eu.json":["application\/json","ewogICJsaWJyYXJ5U3RyaW5ncyI6IHsKICAgICJkaXN0cmlidXRlQnV0dG9uTGFiZWwiOiAiQmFuYXR1IHVuaWZvcm1la2kiLAogICAgImRpc3RyaWJ1dGVCdXR0b25XYXJuaW5nIjogIkJhbGlvYWsgdGFydGUgZ3V6dGlldGFuIGFsZGF0dWtvIGRpcmEuIEVraW4gbmFoaSBkaW96dT8iLAogICAgInJhbmdlT3V0T2ZTZXF1ZW5jZVdhcm5pbmciOiAiUHVudHVhemlvIHRhcnRlYWsgc2VrdWVudHppYXoga2FucG8gZGF1ZGUiCiAgfQp9Cg=="],"libraries\/H5PEditor.RangeList-1.0\/language\/fi.json":["application\/json","ewogICJsaWJyYXJ5U3RyaW5ncyI6IHsKICAgICJkaXN0cmlidXRlQnV0dG9uTGFiZWwiOiAiSmFhIHRhc2Fpc2VzdGkiLAogICAgImRpc3RyaWJ1dGVCdXR0b25XYXJuaW5nIjogIkFydm90IG11dXRldGFhbiBrYWlraWxsZSBwaXN0ZXJham9pbGxlLiBPbGV0a28gdmFybWEgZXR0w6QgaGFsdXQgamF0a2FhPyIsCiAgICAicmFuZ2VPdXRPZlNlcXVlbmNlV2FybmluZyI6ICJQaXN0ZXJhamF0IG92YXQgc2VrdmVuc3NpbiB1bGtvcHVvbGVsbGEiCiAgfQp9Cg=="],"libraries\/H5PEditor.RangeList-1.0\/language\/fr.json":["application\/json","ewogICJsaWJyYXJ5U3RyaW5ncyI6IHsKICAgICJkaXN0cmlidXRlQnV0dG9uTGFiZWwiOiAiUsOpcGFydGlyIMOpZ2FsZW1lbnQiLAogICAgImRpc3RyaWJ1dGVCdXR0b25XYXJuaW5nIjogIkxlcyB2YWxldXJzIHNlcm9udCBtb2RpZmnDqWVzIHBvdXIgdG91cyBsZXMgaW50ZXJ2YWxsZXMuIFZvdWxlei12b3VzIGNvbnRpbnVlciA\/IiwKICAgICJyYW5nZU91dE9mU2VxdWVuY2VXYXJuaW5nIjogIkxlcyB2YWxldXJzIGRlcyBpbnRlcnZhbGxlcyBkb2l2ZW50IMOqdHJlIG9yZG9ubsOpZXMgKGRlIDAlIMOgIDEwMCUpLiIKICB9Cn0K"],"libraries\/H5PEditor.RangeList-1.0\/language\/gl.json":["application\/json","ewogICJsaWJyYXJ5U3RyaW5ncyI6IHsKICAgICJkaXN0cmlidXRlQnV0dG9uTGFiZWwiOiAiRGlzdHJpYnXDrXIgVW5pZm9ybWVtZW50ZSIsCiAgICAiZGlzdHJpYnV0ZUJ1dHRvbldhcm5pbmciOiAiQ2FtYmlhcmFuc2Ugb3MgdmFsb3JlcyBwYXJhIHRvZG9zIG9zIHJhbmdvcy4gUXVlcmVzIGNvbnRpbnVhcj8iLAogICAgInJhbmdlT3V0T2ZTZXF1ZW5jZVdhcm5pbmciOiAiT3MgcmFuZ29zIGRlIHB1bnR1YWNpw7NuIGVzdMOhbiBmb3JhIGRhIHNlY3VlbmNpYSIKICB9Cn0K"],"libraries\/H5PEditor.RangeList-1.0\/language\/it.json":["application\/json","ewogICJsaWJyYXJ5U3RyaW5ncyI6IHsKICAgICJkaXN0cmlidXRlQnV0dG9uTGFiZWwiOiAiRGlzdHJpYnVpcmUgdW5pZm9ybWVtZW50ZSIsCiAgICAiZGlzdHJpYnV0ZUJ1dHRvbldhcm5pbmciOiAiSSB2YWxvcmkgc2FyYW5ubyBjYW1iaWF0aSBwZXIgdHV0dGkgZ2xpIGludGVydmFsbGkuIFZ1b2kgcHJvc2VndWlyZT8iLAogICAgInJhbmdlT3V0T2ZTZXF1ZW5jZVdhcm5pbmciOiAiR2xpIGludGVydmFsbGkgZGkgcHVudGVnZ2lvIHNvbm8gYWwgZGkgZnVvcmkgZGVsbGEgc2VxdWVuemEiCiAgfQp9Cg=="],"libraries\/H5PEditor.RangeList-1.0\/language\/ka.json":["application\/json","ewogICJsaWJyYXJ5U3RyaW5ncyI6IHsKICAgICJkaXN0cmlidXRlQnV0dG9uTGFiZWwiOiAi4YOX4YOQ4YOc4YOQ4YOR4YOg4YOQ4YOTIOGDkuGDkOGDnOGDkOGDrOGDmOGDmuGDlOGDkeGDkCIsCiAgICAiZGlzdHJpYnV0ZUJ1dHRvbldhcm5pbmciOiAi4YOb4YOc4YOY4YOo4YOV4YOc4YOU4YOa4YOd4YOR4YOQIOGDp+GDleGDlOGDmuGDkCDhg5Phg5jhg5Dhg57hg5Dhg5bhg53hg5zhg5jhg6Hhg5fhg5Xhg5jhg6Eg4YOo4YOU4YOY4YOq4YOV4YOa4YOU4YOR4YOQLiDhg5Lhg5jhg5zhg5Phg5Dhg5cg4YOS4YOQ4YOQ4YOS4YOg4YOr4YOU4YOa4YOd4YOXPyIsCiAgICAicmFuZ2VPdXRPZlNlcXVlbmNlV2FybmluZyI6ICLhg6Xhg6Phg5rhg5Thg5Hhg5jhg6Eg4YOT4YOY4YOQ4YOe4YOQ4YOW4YOd4YOc4YOYIOGDlOGDoOGDl+GDm+GDkOGDnOGDlOGDl+GDoSDhg5Dhg6Ag4YOU4YOb4YOX4YOu4YOV4YOU4YOV4YOQIgogIH0KfQo="],"libraries\/H5PEditor.RangeList-1.0\/language\/ko.json":["application\/json","ewogICJsaWJyYXJ5U3RyaW5ncyI6IHsKICAgICJkaXN0cmlidXRlQnV0dG9uTGFiZWwiOiAi6reg65Ox7ZWY6rKMIOu2hOuwsCIsCiAgICAiZGlzdHJpYnV0ZUJ1dHRvbldhcm5pbmciOiAi66qo65OgIOuylOychOyXkCDrjIDtlbQg6rCS7J20IOuzgOqyveuQqeuLiOuLpC4g6rOE7IaN7ZWY7Iuc6rKg7Iq164uI6rmMPyIsCiAgICAicmFuZ2VPdXRPZlNlcXVlbmNlV2FybmluZyI6ICLsoJDsiJgg67KU7JyE6rCAIOyLnO2AgOyKpOulvCDrspfslrTrgqgiCiAgfQp9Cg=="],"libraries\/H5PEditor.RangeList-1.0\/language\/lt.json":["application\/json","ewogICJsaWJyYXJ5U3RyaW5ncyI6IHsKICAgICJkaXN0cmlidXRlQnV0dG9uV2FybmluZyI6ICJWaXPFsyBkaWFwYXpvbsWzIHJlaWvFoW3El3MgYnVzIHBha2Vpc3Rvcy4gQXIgbm9yaXRlIHTEmXN0aT8iLAogICAgImRpc3RyaWJ1dGVCdXR0b25MYWJlbCI6ICJQYXNraXJzdHlraXRlIHRvbHlnaWFpIiwKICAgICJyYW5nZU91dE9mU2VxdWVuY2VXYXJuaW5nIjogIlJlenVsdGF0xbMgZGlhcGF6b25haSBuZW51b3Nla2zFq3MiCiAgfQp9Cg=="],"libraries\/H5PEditor.RangeList-1.0\/language\/lv.json":["application\/json","ewogICJsaWJyYXJ5U3RyaW5ncyI6IHsKICAgICJkaXN0cmlidXRlQnV0dG9uTGFiZWwiOiAiU2FkYWzEq3Qgdmllbm3Ek3LEq2dpIiwKICAgICJkaXN0cmlidXRlQnV0dG9uV2FybmluZyI6ICJWxJNydMSrYmFzIHRpa3MgbWFpbsSrdGFzIHZpc2llbSBkaWFwYXpvbmllbS4gVmFpIHbEk2xhdGllcyB0dXJwaW7EgXQ\/IiwKICAgICJyYW5nZU91dE9mU2VxdWVuY2VXYXJuaW5nIjogIlbEk3J0xJNqdW11IGRpYXBhem9uaSBuYXYgc2VjxKtnaSIKICB9Cn0K"],"libraries\/H5PEditor.RangeList-1.0\/language\/mn.json":["application\/json","ewogICJsaWJyYXJ5U3RyaW5ncyI6IHsKICAgICJkaXN0cmlidXRlQnV0dG9uTGFiZWwiOiAi0J3RjdCzINC20LjQs9C0INGC0LDRgNCw0LDQvdCwIiwKICAgICJkaXN0cmlidXRlQnV0dG9uV2FybmluZyI6ICLQkdKv0YUg0YXSr9GA0Y3RjdC90LQg0YPRgtCz0YPRg9C0INOp06nRgNGH0LvTqdCz0LTTqdC906kuINCi0LAg0q\/RgNCz0Y3Qu9C20LvSr9Kv0LvRjdGF0LjQudCzINGF0q\/RgdGHINCx0LDQudC90LAg0YPRgz8iLAogICAgInJhbmdlT3V0T2ZTZXF1ZW5jZVdhcm5pbmciOiAi0J7QvdC+0L7QvdGLINGF0q\/RgNGN0Y3QvdC0INC00LDRgNCw0LDQu9Cw0LvQs9Kv0Lkg0LHQsNC50L3QsCIKICB9Cn0K"],"libraries\/H5PEditor.RangeList-1.0\/language\/nb.json":["application\/json","ewogICJsaWJyYXJ5U3RyaW5ncyI6IHsKICAgICJkaXN0cmlidXRlQnV0dG9uTGFiZWwiOiAiRGlzdHJpYnV0ZSBFdmVubHkiLAogICAgImRpc3RyaWJ1dGVCdXR0b25XYXJuaW5nIjogIlZhbHVlcyB3aWxsIGJlIGNoYW5nZWQgZm9yIGFsbCBvZiB0aGUgcmFuZ2VzLiBEbyB5b3Ugd2lzaCB0byBwcm9jZWVkPyIsCiAgICAicmFuZ2VPdXRPZlNlcXVlbmNlV2FybmluZyI6ICJUaGUgc2NvcmUgcmFuZ2VzIGFyZSBvdXQgb2Ygc2VxdWVuY2UiCiAgfQp9Cg=="],"libraries\/H5PEditor.RangeList-1.0\/language\/nl.json":["application\/json","ewogICJsaWJyYXJ5U3RyaW5ncyI6IHsKICAgICJkaXN0cmlidXRlQnV0dG9uTGFiZWwiOiAiRXZlbnJlZGlnIHZlcmRlbGVuIiwKICAgICJkaXN0cmlidXRlQnV0dG9uV2FybmluZyI6ICJXYWFyZGVuIHdvcmRlbiBnZXdpanppZ2Qgdm9vciBhbGxlIHNjb3JlcmVla3Nlbi4gV2VldCBqZSB6ZWtlciBkYXQgamUgZG9vciB3aWx0IGdhYW4\/IiwKICAgICJyYW5nZU91dE9mU2VxdWVuY2VXYXJuaW5nIjogIkRlIHNjb3JlcmVla3NlbiB6aWpuIG5pZXQgb3Agdm9sZ29yZGUiCiAgfQp9Cg=="],"libraries\/H5PEditor.RangeList-1.0\/language\/nn.json":["application\/json","ewogICJsaWJyYXJ5U3RyaW5ncyI6IHsKICAgICJkaXN0cmlidXRlQnV0dG9uTGFiZWwiOiAiRGlzdHJpYnV0ZSBFdmVubHkiLAogICAgImRpc3RyaWJ1dGVCdXR0b25XYXJuaW5nIjogIlZhbHVlcyB3aWxsIGJlIGNoYW5nZWQgZm9yIGFsbCBvZiB0aGUgcmFuZ2VzLiBEbyB5b3Ugd2lzaCB0byBwcm9jZWVkPyIsCiAgICAicmFuZ2VPdXRPZlNlcXVlbmNlV2FybmluZyI6ICJUaGUgc2NvcmUgcmFuZ2VzIGFyZSBvdXQgb2Ygc2VxdWVuY2UiCiAgfQp9Cg=="],"libraries\/H5PEditor.RangeList-1.0\/language\/pl.json":["application\/json","ewogICJsaWJyYXJ5U3RyaW5ncyI6IHsKICAgICJkaXN0cmlidXRlQnV0dG9uTGFiZWwiOiAiV3lyw7N3bmFqIHByemVkemlhxYJ5IiwKICAgICJkaXN0cmlidXRlQnV0dG9uV2FybmluZyI6ICJEbGEgd3N6eXN0a2ljaCBwcnplZHppYcWCw7N3IHptaWVuacSFIHNpxJkgd2FydG\/Fm2NpIGdyYW5pY3puZS4gS29udHludW93YcSHPyIsCiAgICAicmFuZ2VPdXRPZlNlcXVlbmNlV2FybmluZyI6ICJQcnplZHppYcWCeSBuaWUgc8SFIHVzdGF3aW9uZSB3IGtvbGVqbm\/Fm2NpIgogIH0KfQo="],"libraries\/H5PEditor.RangeList-1.0\/language\/pt-br.json":["application\/json","ewogICJsaWJyYXJ5U3RyaW5ncyI6IHsKICAgICJkaXN0cmlidXRlQnV0dG9uTGFiZWwiOiAiRGlzdHJpYnVpciB1bmlmb3JtZW1lbnRlIiwKICAgICJkaXN0cmlidXRlQnV0dG9uV2FybmluZyI6ICJWYWxvcmVzIHNlcsOjbyBhbHRlcmFkb3MgcGFyYSB0b2RhcyBhcyBmYWl4YXMuIERlc2VqYSBjb250aW51YXI\/IiwKICAgICJyYW5nZU91dE9mU2VxdWVuY2VXYXJuaW5nIjogIkFzIGZhaXhhcyBkZSB2YWxvcmVzIGVzdMOjbyBmb3JhIGRlIHNlcXXDqm5jaWEiCiAgfQp9Cg=="],"libraries\/H5PEditor.RangeList-1.0\/language\/pt.json":["application\/json","ewogICJsaWJyYXJ5U3RyaW5ncyI6IHsKICAgICJkaXN0cmlidXRlQnV0dG9uTGFiZWwiOiAiRGlzdHJpYnVpciB1bmlmb3JtZW1lbnRlIiwKICAgICJkaXN0cmlidXRlQnV0dG9uV2FybmluZyI6ICJWYWxvcmVzIHNlcsOjbyBhbHRlcmFkb3MgcGFyYSB0b2RhcyBhcyBmYWl4YXMuIERlc2VqYSBjb250aW51YXI\/IiwKICAgICJyYW5nZU91dE9mU2VxdWVuY2VXYXJuaW5nIjogIkFzIGZhaXhhcyBkZSB2YWxvcmVzIGVzdMOjbyBmb3JhIGRlIHNlcXXDqm5jaWEiCiAgfQp9Cg=="],"libraries\/H5PEditor.RangeList-1.0\/language\/ru.json":["application\/json","ewogICJsaWJyYXJ5U3RyaW5ncyI6IHsKICAgICAiZGlzdHJpYnV0ZUJ1dHRvbkxhYmVsIjogItCg0LDRgdC\/0YDQtdC00LXQu9GP0YLRjCDRgNCw0LLQvdC+0LzQtdGA0L3QviIsCiAgICAgImRpc3RyaWJ1dGVCdXR0b25XYXJuaW5nIjogItCX0L3QsNGH0LXQvdC40Y8g0LHRg9C00YPRgiDQuNC30LzQtdC90LXQvdGLINC00LvRjyDQstGB0LXRhSDQtNC40LDQv9Cw0LfQvtC90L7Qsi4g0J\/RgNC+0LTQvtC70LbQuNGC0Yw\/IiwKICAgICAicmFuZ2VPdXRPZlNlcXVlbmNlV2FybmluZyI6ICLQlNC40LDQv9Cw0LfQvtC90Ysg0LHQsNC70L7QsiDQvdC1INGB0L7QvtGC0LLQtdGC0YHRgtCy0YPRjtGCINC\/0L7RgNGP0LTQutGDIgogIH0KfQo="],"libraries\/H5PEditor.RangeList-1.0\/language\/sl.json":["application\/json","ewogICJsaWJyYXJ5U3RyaW5ncyI6IHsKICAgICJkaXN0cmlidXRlQnV0dG9uTGFiZWwiOiAiRW5ha29tZXJubyBwb3JhemRlbGkiLAogICAgImRpc3RyaWJ1dGVCdXR0b25XYXJuaW5nIjogIlJlc25pxI1ubyBuYWRhbGp1amVtIHogZW5ha29tZXJubyBwb3JhemRlbGl0dmlqbyB2cmVkbm9zdGk\/IFMgdGVtIGJvZG8gaXpndWJsamVuaSBvYnN0b2plxI1pIHZub3NpLiIsCiAgICAicmFuZ2VPdXRPZlNlcXVlbmNlV2FybmluZyI6ICJWcmVkbm9zdCByYXpwb25hIGplIGl6dmVuIHphcG9yZWRqYSIKICB9Cn0K"],"libraries\/H5PEditor.RangeList-1.0\/language\/sma.json":["application\/json","ewogICJsaWJyYXJ5U3RyaW5ncyI6IHsKICAgICJkaXN0cmlidXRlQnV0dG9uTGFiZWwiOiAiRGlzdHJpYnV0ZSBFdmVubHkiLAogICAgImRpc3RyaWJ1dGVCdXR0b25XYXJuaW5nIjogIlZhbHVlcyB3aWxsIGJlIGNoYW5nZWQgZm9yIGFsbCBvZiB0aGUgcmFuZ2VzLiBEbyB5b3Ugd2lzaCB0byBwcm9jZWVkPyIsCiAgICAicmFuZ2VPdXRPZlNlcXVlbmNlV2FybmluZyI6ICJUaGUgc2NvcmUgcmFuZ2VzIGFyZSBvdXQgb2Ygc2VxdWVuY2UiCiAgfQp9Cg=="],"libraries\/H5PEditor.RangeList-1.0\/language\/sme.json":["application\/json","ewogICJsaWJyYXJ5U3RyaW5ncyI6IHsKICAgICJkaXN0cmlidXRlQnV0dG9uTGFiZWwiOiAiRGlzdHJpYnV0ZSBFdmVubHkiLAogICAgImRpc3RyaWJ1dGVCdXR0b25XYXJuaW5nIjogIlZhbHVlcyB3aWxsIGJlIGNoYW5nZWQgZm9yIGFsbCBvZiB0aGUgcmFuZ2VzLiBEbyB5b3Ugd2lzaCB0byBwcm9jZWVkPyIsCiAgICAicmFuZ2VPdXRPZlNlcXVlbmNlV2FybmluZyI6ICJUaGUgc2NvcmUgcmFuZ2VzIGFyZSBvdXQgb2Ygc2VxdWVuY2UiCiAgfQp9Cg=="],"libraries\/H5PEditor.RangeList-1.0\/language\/smj.json":["application\/json","ewogICJsaWJyYXJ5U3RyaW5ncyI6IHsKICAgICJkaXN0cmlidXRlQnV0dG9uTGFiZWwiOiAiRGlzdHJpYnV0ZSBFdmVubHkiLAogICAgImRpc3RyaWJ1dGVCdXR0b25XYXJuaW5nIjogIlZhbHVlcyB3aWxsIGJlIGNoYW5nZWQgZm9yIGFsbCBvZiB0aGUgcmFuZ2VzLiBEbyB5b3Ugd2lzaCB0byBwcm9jZWVkPyIsCiAgICAicmFuZ2VPdXRPZlNlcXVlbmNlV2FybmluZyI6ICJUaGUgc2NvcmUgcmFuZ2VzIGFyZSBvdXQgb2Ygc2VxdWVuY2UiCiAgfQp9Cg=="],"libraries\/H5PEditor.RangeList-1.0\/language\/sv.json":["application\/json","ewogICJsaWJyYXJ5U3RyaW5ncyI6IHsKICAgICJkaXN0cmlidXRlQnV0dG9uTGFiZWwiOiAiRsO2cmRlbGEgasOkbXQiLAogICAgImRpc3RyaWJ1dGVCdXR0b25XYXJuaW5nIjogIlbDpHJkZW4ga29tbWVyIGF0dCDDpG5kcmFzIGbDtnIgYWxsYSBpbnRlcnZhbGwuIFZpbGwgZHUgZm9ydHPDpHR0YT8iLAogICAgInJhbmdlT3V0T2ZTZXF1ZW5jZVdhcm5pbmciOiAiUG\/DpG5naW50ZXJ2YWxsZW4gw6RyIHV0YW5mw7ZyIHNla3ZlbnNvcmRuaW5nIgogIH0KfQo="],"libraries\/H5PEditor.RangeList-1.0\/language\/sw.json":["application\/json","ewogICJsaWJyYXJ5U3RyaW5ncyI6IHsKICAgICJkaXN0cmlidXRlQnV0dG9uTGFiZWwiOiAiU2FtYmF6YSBWaXp1cmkiLAogICAgImRpc3RyaWJ1dGVCdXR0b25XYXJuaW5nIjogIlRoYW1hbmkgeml0YWJhZGlsaXNod2Ega3dhIHNhZnUgem90ZS4gSmUsIHVuZ2VwZW5kYSBrdWVuZGVsZWE\/IiwKICAgICJyYW5nZU91dE9mU2VxdWVuY2VXYXJuaW5nIjogIlNhZnUgemEgYWxhbWEgemlrbyBuamUgeWEgbWxvbG9uZ28iCiAgfQp9Cg=="],"libraries\/H5PEditor.RangeList-1.0\/language\/uk.json":["application\/json","ewogICJsaWJyYXJ5U3RyaW5ncyI6IHsKICAgICJkaXN0cmlidXRlQnV0dG9uTGFiZWwiOiAi0KDQvtC30L\/QvtC00ZbQu9C40YLQuCDRgNGW0LLQvdC+0LzRltGA0L3QviIsCiAgICAiZGlzdHJpYnV0ZUJ1dHRvbldhcm5pbmciOiAi0JfQvdCw0YfQtdC90L3RjyDQsdGD0LTQtSDQt9C80ZbQvdC10L3QviDQtNC70Y8g0LLRgdGW0YUg0LTRltCw0L\/QsNC30L7QvdGW0LIuINCR0LDQttCw0ZTRgtC1INC\/0YDQvtC00L7QstC20LjRgtC4PyIsCiAgICAicmFuZ2VPdXRPZlNlcXVlbmNlV2FybmluZyI6ICLQlNGW0LDQv9Cw0LfQvtC90Lgg0L7Rh9C+0Log0L3QtSDRlCDQv9C+0YHQu9GW0LTQvtCy0L3QuNC80LgiCiAgfQp9Cg=="],"libraries\/H5PEditor.RangeList-1.0\/library.json":["application\/json","ewogICJtYWNoaW5lTmFtZSI6ICJINVBFZGl0b3IuUmFuZ2VMaXN0IiwKICAidGl0bGUiOiAiSDVQIEVkaXRvciBSYW5nZSBMaXN0IiwKICAibGljZW5zZSI6ICJNSVQiLAogICJhdXRob3IiOiAiSm91YmVsIiwKICAibWFqb3JWZXJzaW9uIjogMSwKICAibWlub3JWZXJzaW9uIjogMCwKICAicGF0Y2hWZXJzaW9uIjogMTMsCiAgInJ1bm5hYmxlIjogMCwKICAiY29yZUFwaSI6IHsKICAgICJtYWpvclZlcnNpb24iOiAxLAogICAgIm1pbm9yVmVyc2lvbiI6IDE0CiAgfSwKICAicHJlbG9hZGVkSnMiOiBbCiAgICB7CiAgICAgICJwYXRoIjogImg1cC1lZGl0b3ItcmFuZ2UtbGlzdC5qcyIKICAgIH0KICBdLAogICJwcmVsb2FkZWRDc3MiOiBbCiAgICB7CiAgICAgICJwYXRoIjogImg1cC1lZGl0b3ItcmFuZ2UtbGlzdC5jc3MiCiAgICB9CiAgXSwKICAicHJlbG9hZGVkRGVwZW5kZW5jaWVzIjogWwogICAgewogICAgICAibWFjaGluZU5hbWUiOiAiSDVQRWRpdG9yLlRhYmxlTGlzdCIsCiAgICAgICJtYWpvclZlcnNpb24iOiAxLAogICAgICAibWlub3JWZXJzaW9uIjogMAogICAgfQogIF0KfQ=="],"libraries\/H5PEditor.ShowWhen-1.0\/library.json":["application\/json","ewogICJtYWNoaW5lTmFtZSI6ICJINVBFZGl0b3IuU2hvd1doZW4iLAogICJ0aXRsZSI6ICJUb2dnbGUgdmlzaWJpbGl0eSBvZiBhIGZpZWxkIGJhc2VkIG9uIHJ1bGVzIiwKICAibGljZW5zZSI6ICJNSVQiLAogICJhdXRob3IiOiAiZm5va3MiLAogICJtYWpvclZlcnNpb24iOiAxLAogICJtaW5vclZlcnNpb24iOiAwLAogICJwYXRjaFZlcnNpb24iOiA5LAogICJydW5uYWJsZSI6IDAsCiAgInByZWxvYWRlZEpzIjogWwogICAgewogICAgICAicGF0aCI6ICJoNXAtc2hvdy13aGVuLmpzIgogICAgfQogIF0sCiAgInByZWxvYWRlZENzcyI6IFsKICAgIHsKICAgICAgInBhdGgiOiAiaDVwLXNob3ctd2hlbi5jc3MiCiAgICB9CiAgXQp9Cg=="],"libraries\/H5PEditor.TableList-1.0\/library.json":["application\/json","ewogICJtYWNoaW5lTmFtZSI6ICJINVBFZGl0b3IuVGFibGVMaXN0IiwKICAidGl0bGUiOiAiSDVQIEVkaXRvciBUYWJsZSBMaXN0IiwKICAibGljZW5zZSI6ICJNSVQiLAogICJhdXRob3IiOiAiSm91YmVsIiwKICAibWFqb3JWZXJzaW9uIjogMSwKICAibWlub3JWZXJzaW9uIjogMCwKICAicGF0Y2hWZXJzaW9uIjogNCwKICAicnVubmFibGUiOiAwLAogICJjb3JlQXBpIjogewogICAgIm1ham9yVmVyc2lvbiI6IDEsCiAgICAibWlub3JWZXJzaW9uIjogMTQKICB9LAogICJwcmVsb2FkZWRKcyI6IFsKICAgIHsKICAgICAgInBhdGgiOiAiaDVwLWVkaXRvci10YWJsZS1saXN0LmpzIgogICAgfQogIF0sCiAgInByZWxvYWRlZENzcyI6IFsKICAgIHsKICAgICAgInBhdGgiOiAiaDVwLWVkaXRvci10YWJsZS1saXN0LmNzcyIKICAgIH0KICBdCn0="],"libraries\/H5P.FontIcons-1.0\/library.json":["application\/json","ewogICJ0aXRsZSI6ICJINVAuRm9udEljb25zIiwKICAibWFqb3JWZXJzaW9uIjogMSwKICAibWlub3JWZXJzaW9uIjogMCwKICAicGF0Y2hWZXJzaW9uIjogNiwKICAicnVubmFibGUiOiAwLAogICJtYWNoaW5lTmFtZSI6ICJINVAuRm9udEljb25zIiwKICAiYXV0aG9yIjogIkpvdWJlbCIsCiAgInByZWxvYWRlZENzcyI6IFsKICAgIHsKICAgICAgInBhdGgiOiAic3R5bGVzL2g1cC1mb250LWljb25zLmNzcyIKICAgIH0KICBdCn0K"],"libraries\/H5P.Image-1.1\/language\/af.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJQcmVudCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZWNvcmF0aXZlIG9ubHkiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRW5hYmxlIHRoaXMgb3B0aW9uIGlmIHRoZSBpbWFnZSBpcyBwdXJlbHkgZGVjb3JhdGl2ZSBhbmQgZG9lcyBub3QgYWRkIGFueSBpbmZvcm1hdGlvbiB0byB0aGUgY29udGVudCBvbiB0aGUgcGFnZS4gSXQgd2lsbCBiZSBpZ25vcmVkIGJ5IHNjcmVlbiByZWFkZXJzIGFuZCBub3QgZ2l2ZW4gYW55IGFsdGVybmF0aXZlIHRleHQuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFsdGVybmF0aWV3ZSB0ZWtzIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlZlcmVpcy4gSW5kaWVuIGRpZSB3ZWJsZXNlciBuaWUgZGllIHByZW50IGthbiBsYWFpIG5pZSwgc2FsIGRpZSB0ZWtzIHZlcnRvb24gd29yZC4gV29yZCBvb2sgZ2VicnVpayB2aXIgXCJ0ZWtzLW5hLXNwcmFha1wiIGxlc2Vycy4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiU3dlZWZ0ZWtzIiwKICAgICAgImRlc2NyaXB0aW9uIjogIk9wc2lvbmVlbC4gSGllcmRpZSB0ZWtzIHdvcmQgdmVydG9vbiB3YW5uZWVyIGRpZSBnZWJydWlrZXIgc3kgd3lzYXBwYXJhYXQgb29yIGRpZSBiZWVsZCBob3UuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlByZW50IGluaG91ZCBuYWFtIiwKICAgICAgImRlZmF1bHQiOiAiUHJlbnQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRXhwYW5kIEltYWdlIiwKICAgICAgImRlZmF1bHQiOiAiRXhwYW5kIEltYWdlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk1pbmltaXplIEltYWdlIiwKICAgICAgImRlZmF1bHQiOiAiTWluaW1pemUgSW1hZ2UiCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Image-1.1\/language\/ar.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLYp9mE2LXZiNix2KkiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRGVjb3JhdGl2ZSBvbmx5IiwKICAgICAgImRlc2NyaXB0aW9uIjogIkVuYWJsZSB0aGlzIG9wdGlvbiBpZiB0aGUgaW1hZ2UgaXMgcHVyZWx5IGRlY29yYXRpdmUgYW5kIGRvZXMgbm90IGFkZCBhbnkgaW5mb3JtYXRpb24gdG8gdGhlIGNvbnRlbnQgb24gdGhlIHBhZ2UuIEl0IHdpbGwgYmUgaWdub3JlZCBieSBzY3JlZW4gcmVhZGVycyBhbmQgbm90IGdpdmVuIGFueSBhbHRlcm5hdGl2ZSB0ZXh0LiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLYp9mE2YbYtSDYp9mE2KjYr9mK2YQiLAogICAgICAiZGVzY3JpcHRpb24iOiAi2YXYt9mE2YjYqNipLiDYpdiw2Kcg2YPYp9mGINin2YTZhdiq2LXZgditINmE2YUg2YrYqtmF2YPZhiDZhdmGINiq2K3ZhdmK2YQg2KfZhNi12YjYsdipINiz2YrYqtmFINi52LHYtiDZh9iw2Kcg2KfZhNmG2LUg2KjYr9mE2Kcg2YXZhiDYsNmE2YMuINiq2LPYqtiu2K\/ZhSDYo9mK2LbYpyDZhdmGINmC2KjZhCDZhdmD2KjYsdin2Kog2KfZhNi12YjYqiDZhNmE2YLYsdin2KHYqSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLZiNi22Lkg2YXYpNi02LEg2KfZhNmB2KPYsdipINmB2YjZgiDYp9mE2LXZiNix2KkiLAogICAgICAiZGVzY3JpcHRpb24iOiAi2KfYrtiq2YrYp9ix2YouINmK2KrZhSDYudix2LYg2YfYsNinINin2YTZhti1INi52YbYr9mF2Kcg2YrZgtmI2YUg2KfZhNmF2LPYqtiu2K\/ZhSDYqNiq2K3ZiNmK2YUg2YXZiNi02LEg2KfZhNmB2KfYsdipINmB2YjZgiDYp9mE2LXZiNix2KkiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi2KfYs9mFINmF2YTZgSDYp9mE2LXZiNix2KkiLAogICAgICAiZGVmYXVsdCI6ICLYp9mE2LXZiNix2KkiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRXhwYW5kIEltYWdlIiwKICAgICAgImRlZmF1bHQiOiAiRXhwYW5kIEltYWdlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk1pbmltaXplIEltYWdlIiwKICAgICAgImRlZmF1bHQiOiAiTWluaW1pemUgSW1hZ2UiCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Image-1.1\/language\/bg.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLQmNC30L7QsdGA0LDQttC10L3QuNC1IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkRlY29yYXRpdmUgb25seSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJFbmFibGUgdGhpcyBvcHRpb24gaWYgdGhlIGltYWdlIGlzIHB1cmVseSBkZWNvcmF0aXZlIGFuZCBkb2VzIG5vdCBhZGQgYW55IGluZm9ybWF0aW9uIHRvIHRoZSBjb250ZW50IG9uIHRoZSBwYWdlLiBJdCB3aWxsIGJlIGlnbm9yZWQgYnkgc2NyZWVuIHJlYWRlcnMgYW5kIG5vdCBnaXZlbiBhbnkgYWx0ZXJuYXRpdmUgdGV4dC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0JDQu9GC0LXRgNC90LDRgtC40LLQtdC9INGC0LXQutGB0YIiLAogICAgICAiZGVzY3JpcHRpb24iOiAi0JfQsNC00YrQu9C20LjRgtC10LvQtdC9LiDQkNC60L4g0LHRgNCw0YPQt9GK0YDRitGCINC90LUg0LzQvtC20LUg0LTQsCDQt9Cw0YDQtdC00Lgg0LjQt9C+0LHRgNCw0LbQtdC90LjQtdGC0L4sINCy0LzQtdGB0YLQviDQvdC10LPQviDRidC1INGB0LUg0L\/QvtC60LDQttC1INGC0L7Qt9C4INGC0LXQutGB0YIuINCY0LfQv9C+0LvQt9Cy0LAg0YHQtSDRgdGK0YnQviDQuCDQvtGCINC10LrRgNCw0L3QvdC40YLQtSDRh9C10YLRhtC4IFwidGV4dC10by1zcGVlY2hcIi4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQv9GA0Lgg0L\/QvtGB0L7Rh9Cy0LDQvdC1IiwKICAgICAgImRlc2NyaXB0aW9uIjogItCd0LUg0LUg0LfQsNC00YrQu9C20LjRgtC10LvQtdC9LiDQotC+0LfQuCDRgtC10LrRgdGCINGB0LUg0L\/QvtC60LDQt9Cy0LAsINC60L7Qs9Cw0YLQviDQv9C+0YLRgNC10LHQuNGC0LXQu9GPINC30LDQtNGK0YDQttC4INC80LjRiNC60LDRgtCwINCy0YrRgNGF0YMg0LjQt9C+0LHRgNCw0LbQtdC90LjQtdGC0L4uIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCY0LzQtSDQvdCwINGC0LjQvyDRgdGK0LTRitGA0LbQsNC90LjQtSDQmNC30L7QsdGA0LDQttC10L3QuNC1IiwKICAgICAgImRlZmF1bHQiOiAi0JjQt9C+0LHRgNCw0LbQtdC90LjQtSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFeHBhbmQgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJFeHBhbmQgSW1hZ2UiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWluaW1pemUgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJNaW5pbWl6ZSBJbWFnZSIKICAgIH0KICBdCn0K"],"libraries\/H5P.Image-1.1\/language\/bs.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJTbGlrYSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZWNvcmF0aXZlIG9ubHkiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRW5hYmxlIHRoaXMgb3B0aW9uIGlmIHRoZSBpbWFnZSBpcyBwdXJlbHkgZGVjb3JhdGl2ZSBhbmQgZG9lcyBub3QgYWRkIGFueSBpbmZvcm1hdGlvbiB0byB0aGUgY29udGVudCBvbiB0aGUgcGFnZS4gSXQgd2lsbCBiZSBpZ25vcmVkIGJ5IHNjcmVlbiByZWFkZXJzIGFuZCBub3QgZ2l2ZW4gYW55IGFsdGVybmF0aXZlIHRleHQuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFsdGVybmF0aXZuaSB0ZWtzdCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJPYmF2ZXpuby4gVSBzbHXEjWFqdSBkYSBzZSBzbGlrYSBuZSBwb2thxb5lIG9uZGEgxIdlIHNlIHBva2F6YXRpIG92YWogdGVrc3QgaWxpIGJpdGkgZWxla3Ryb25za20gZ2xhc29tIHByb8SNaXRhbi4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiSG92ZXIgVGVrc3QiLAogICAgICAiZGVzY3JpcHRpb24iOiAiT3BjaW9uYWxuby4gT3ZhaiB0ZWtzdCDEh2Ugc2UgcG9rYXphdGkga2FkYSBtacWhb20gcHJlbGF6aW1vIHByZWtvIHNsaWtlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJOYXppdiBzbGlrZSIsCiAgICAgICJkZWZhdWx0IjogIkltYWdlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkV4cGFuZCBJbWFnZSIsCiAgICAgICJkZWZhdWx0IjogIkV4cGFuZCBJbWFnZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJNaW5pbWl6ZSBJbWFnZSIsCiAgICAgICJkZWZhdWx0IjogIk1pbmltaXplIEltYWdlIgogICAgfQogIF0KfQo="],"libraries\/H5P.Image-1.1\/language\/ca.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbWF0Z2UiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRGVjb3JhdGl2ZSBvbmx5IiwKICAgICAgImRlc2NyaXB0aW9uIjogIkVuYWJsZSB0aGlzIG9wdGlvbiBpZiB0aGUgaW1hZ2UgaXMgcHVyZWx5IGRlY29yYXRpdmUgYW5kIGRvZXMgbm90IGFkZCBhbnkgaW5mb3JtYXRpb24gdG8gdGhlIGNvbnRlbnQgb24gdGhlIHBhZ2UuIEl0IHdpbGwgYmUgaWdub3JlZCBieSBzY3JlZW4gcmVhZGVycyBhbmQgbm90IGdpdmVuIGFueSBhbHRlcm5hdGl2ZSB0ZXh0LiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGFsdGVybmF0aXUiLAogICAgICAiZGVzY3JpcHRpb24iOiAiUmVxdWVyaXQuIFNpIGVsIG5hdmVnYWRvciBubyBwb3QgY2FycmVnYXIgbGEgaW1hdGdlIGVzIG1vc3RyYXLDoCBhcXVlc3QgdGV4dC4gVGFtYsOpIHPigJl1dGlsaXR6YSBwZXIgYSBsZWN0b3JzIGRlIFwidGV4dCBhIHZldVwiLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IHF1ZSBlcyBtb3N0cmEgZW4gcGFzc2FyIGVsIGN1cnNvciBwZXIgc29icmUiLAogICAgICAiZGVzY3JpcHRpb24iOiAiT3BjaW9uYWwuIEFxdWVzdCB0ZXh0IGVzIG1vc3RyYSBxdWFuIGVscyB1c3VhcmlzIHBhc3NlbiBlbCBkaXNwb3NpdGl1IGTigJlhcHVudGFyIHBlciBzb2JyZSBkZSBsYSBpbWF0Z2UuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk5vbSBkZWwgY29udGluZ3V0IGRlIGxhIGltYXRnZSIsCiAgICAgICJkZWZhdWx0IjogIkltYXRnZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFeHBhbmQgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJFeHBhbmQgSW1hZ2UiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWluaW1pemUgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJNaW5pbWl6ZSBJbWFnZSIKICAgIH0KICBdCn0K"],"libraries\/H5P.Image-1.1\/language\/cs.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJPYnLDoXplayIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJQb3V6ZSBkZWtvcmHEjW7DrSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUdXRvIG1vxb5ub3N0IHp2b2x0ZSwgcG9rdWQgbcOhIGLDvXQgb2Jyw6F6ZWsgxI1pc3TEmyBkZWtvcmHEjW7DrWhvIGNoYXJha3RlcnUgYSBuZWRvZMOhdsOhIG9ic2FodSBzdHLDoW5reSBub3bDqSBpbmZvcm1hY2UuIE9icsOhemVrIGJ1ZGUgb2RlxI3DrXRhxI1pIG9icmF6b3ZreSBpZ25vcm92w6FuIGEgbmVidWRlIGRvcGxuxJtuIGFsdGVybmF0aXZuw61tIHRleHRlbS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQWx0ZXJuYXRpdm7DrSB0ZXh0IiwKICAgICAgImRlc2NyaXB0aW9uIjogIlBvdmlubsOpLiBQb2t1ZCBwcm9obMOtxb5lxI0gbmVtxa\/FvmUgbmHEjcOtc3Qgb2Jyw6F6ZWssIHpvYnJhesOtIHNlIG3DrXN0byB0b2hvIHRlbnRvIHRleHQuIFRha8OpIHNlIHBvdcW+w612w6EgXCJ0ZXh0LXRvLXNwZWVjaFwiIMSNdGXEjWthLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJOYWplxI90ZSBrdXJ6b3JlbSBuYSB0ZXh0IiwKICAgICAgImRlc2NyaXB0aW9uIjogIlZvbGl0ZWxuw6kuIFRlbnRvIHRleHQgc2Ugem9icmF6w60sIGtkecW+IHXFvml2YXRlbMOpIHVtw61zdMOtIHN2w6kgcG9sb2hvdmFjw60gemHFmcOtemVuw60gbmEgb2Jyw6F6ZWsuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk7DoXpldiBvYnNhaHUgb2Jyw6F6a3UiLAogICAgICAiZGVmYXVsdCI6ICJPYnLDoXplayIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJSb3piYWxpdCBvYnLDoXplayIsCiAgICAgICJkZWZhdWx0IjogIlJvemJhbGl0IG9icsOhemVrIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk1pbmltYWxpem92YXQgb2Jyw6F6ZWsiLAogICAgICAiZGVmYXVsdCI6ICJNaW5pbWFsaXpvdmF0IG9icsOhemVrIgogICAgfQogIF0KfQo="],"libraries\/H5P.Image-1.1\/language\/cy.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZWx3ZWRkIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkRlY29yYXRpdmUgb25seSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJFbmFibGUgdGhpcyBvcHRpb24gaWYgdGhlIGltYWdlIGlzIHB1cmVseSBkZWNvcmF0aXZlIGFuZCBkb2VzIG5vdCBhZGQgYW55IGluZm9ybWF0aW9uIHRvIHRoZSBjb250ZW50IG9uIHRoZSBwYWdlLiBJdCB3aWxsIGJlIGlnbm9yZWQgYnkgc2NyZWVuIHJlYWRlcnMgYW5kIG5vdCBnaXZlbiBhbnkgYWx0ZXJuYXRpdmUgdGV4dC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVzdHVuIGFtZ2VuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkFuZ2VucmhlaWRpb2wuIE9zIGR5dydyIHBvcndyIHluIG1ldGh1IGxsd3l0aG8nciBkZGVsd2VkZCwgY2FpZmYgeSB0ZXN0dW4gaHduIGVpIGRkYW5nb3MgeW4gZWkgbGxlLiBDYWlmZiBlaSBkZGVmbnlkZGlvIGdhbiBkZGFybGxlbnd5ciBcImxsZWZhcnUgdGVzdHVuXCIgaGVmeWQuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRlc3R1biB3cnRoIGhvZnJhbiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJPcHNpeW5vbC4gQ2FpZmYgeSB0ZXN0dW4gaHduIGVpIGRkYW5nb3MgcGFuIGZ5ZGQgZGVmbnlkZHd5ciB5biBob2ZybyBkeWZhaXMgYnd5bnRpbywgZmVsIGxseWdvZGVuLCBkcm9zIHkgZGRlbHdlZGQuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkVudyBjeW5ud3lzIHkgZGRlbHdlZGQiLAogICAgICAiZGVmYXVsdCI6ICJEZWx3ZWRkIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkV4cGFuZCBJbWFnZSIsCiAgICAgICJkZWZhdWx0IjogIkV4cGFuZCBJbWFnZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJNaW5pbWl6ZSBJbWFnZSIsCiAgICAgICJkZWZhdWx0IjogIk1pbmltaXplIEltYWdlIgogICAgfQogIF0KfQo="],"libraries\/H5P.Image-1.1\/language\/da.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbWFnZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZWNvcmF0aXZlIG9ubHkiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRW5hYmxlIHRoaXMgb3B0aW9uIGlmIHRoZSBpbWFnZSBpcyBwdXJlbHkgZGVjb3JhdGl2ZSBhbmQgZG9lcyBub3QgYWRkIGFueSBpbmZvcm1hdGlvbiB0byB0aGUgY29udGVudCBvbiB0aGUgcGFnZS4gSXQgd2lsbCBiZSBpZ25vcmVkIGJ5IHNjcmVlbiByZWFkZXJzIGFuZCBub3QgZ2l2ZW4gYW55IGFsdGVybmF0aXZlIHRleHQuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFsdGVybmF0aXZlIHRleHQiLAogICAgICAiZGVzY3JpcHRpb24iOiAiUmVxdWlyZWQuIElmIHRoZSBicm93c2VyIGNhbid0IGxvYWQgdGhlIGltYWdlIHRoaXMgdGV4dCB3aWxsIGJlIGRpc3BsYXllZCBpbnN0ZWFkLiBBbHNvIHVzZWQgYnkgXCJ0ZXh0LXRvLXNwZWVjaFwiIHJlYWRlcnMuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkhvdmVyIHRleHQiLAogICAgICAiZGVzY3JpcHRpb24iOiAiT3B0aW9uYWwuIFRoaXMgdGV4dCBpcyBkaXNwbGF5ZWQgd2hlbiB0aGUgdXNlcnMgaG92ZXIgdGhlaXIgcG9pbnRpbmcgZGV2aWNlIG92ZXIgdGhlIGltYWdlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbWFnZSBjb250ZW50IG5hbWUiLAogICAgICAiZGVmYXVsdCI6ICJJbWFnZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFeHBhbmQgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJFeHBhbmQgSW1hZ2UiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWluaW1pemUgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJNaW5pbWl6ZSBJbWFnZSIKICAgIH0KICBdCn0K"],"libraries\/H5P.Image-1.1\/language\/de.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJCaWxkIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk51ciBkZWtvcmF0aXYiLAogICAgICAiZGVzY3JpcHRpb24iOiAiV8OkaGxlIGRpZXNlIE9wdGlvbiwgd2VubiBkYXMgQmlsZCByZWluIGRla29yYXRpdiBpc3QgdW5kIGtlaW5lIEluZm9ybWF0aW9uZW4genVtIEluaGFsdCBkZXIgU2VpdGUgaGluenVmw7xndC4gRXMgd2lyZCB2b24gVm9ybGVzZXdlcmt6ZXVnZW4gaWdub3JpZXJ0IHVuZCBlcmjDpGx0IGtlaW5lbiBBbHRlcm5hdGl2dGV4dC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQWx0ZXJuYXRpdnRleHQiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRXJmb3JkZXJsaWNoLiBGYWxscyBkYXMgQmlsZCBuaWNodCBnZWxhZGVuIHdlcmRlbiBrYW5uLCB3aXJkIGRpZXNlciBUZXh0IHN0YXR0ZGVzc2VuIGFuZ2V6ZWlndC4gV2lyZCBhdWNoIHp1bSBWb3JsZXNlbiB2b24gQmlsZHNjaGlybXRleHRlbiBnZW51dHp0LiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJNb3VzZW92ZXItVGV4dCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJPcHRpb25hbC4gRGllc2VyIFRleHQgd2lyZCBhbmdlemVpZ3QsIHdlbm4gZGVyIE1hdXN6ZWlnZXIgw7xiZXIgZGVtIEJpbGQgcnVodC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTmFtZSBkZXMgQmlsZGluaGFsdHMiLAogICAgICAiZGVmYXVsdCI6ICJCaWxkIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkJpbGQgdmVyZ3LDtsOfZXJuIiwKICAgICAgImRlZmF1bHQiOiAiQmlsZCB2ZXJncsO2w59lcm4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQmlsZCB2ZXJrbGVpbmVybiIsCiAgICAgICJkZWZhdWx0IjogIkJpbGQgdmVya2xlaW5lcm4iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Image-1.1\/language\/el.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLOlc65zrrPjM69zrEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAizpzPjM69zr8gzrTOuc6xzrrOv8+DzrzOt8+EzrnOus6uIiwKICAgICAgImRlc2NyaXB0aW9uIjogIs6Vzr3Otc+BzrPOv8+Azr\/Ouc6uz4PPhM61IM6xz4XPhM6uzr0gz4TOt869IM61z4DOuc67zr\/Os86uIM61zqzOvSDOtyDOtc65zrrPjM69zrEgzrXOr869zrHOuSDOus6xzrjOsc+BzqwgzrTOuc6xzrrOv8+DzrzOt8+EzrnOus6uIM66zrHOuSDOtM61zr0gz4DPgc6\/z4POuM6tz4TOtc65IM+AzrvOt8+Bzr\/Phs6\/z4HOr861z4Igz4PPhM6\/IM+AzrXPgc65zrXPh8+MzrzOtc69zr8gz4TOt8+CIM+DzrXOu86vzrTOsc+CLiDOmM6xIM6xzrPOvc6\/zrfOuM61zq8gzrHPgM+MIM+Ezr\/Phc+CIM6xzr3Osc6zzr3Pjs+Dz4TOtc+CIM6\/zrjPjM69zrfPgiDOus6xzrkgzrTOtc69IM64zrEgzrTOv864zrXOryDOtc69zrHOu867zrHOus+EzrnOus+MIM66zrXOr868zrXOvc6\/LiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLOlc69zrHOu867zrHOus+EzrnOus+MIM66zrXOr868zrXOvc6\/IiwKICAgICAgImRlc2NyaXB0aW9uIjogIs6Rz4XPhM+MIM+Ezr8gzrrOtc6vzrzOtc69zr8gzrXOvM+GzrHOvc6vzrbOtc+EzrHOuSDPg861IM+AzrXPgc6vz4DPhM+Jz4POtyDPgM6\/z4Ugzr8gz4bPhc67zrvOv868zrXPhM+BzrfPhM6uz4IgzrHOtM+Fzr3Osc+EzrXOryDOvc6xIM+Gzr\/Pgc+Ez47Pg861zrkgz4TOt869IM61zrnOus+Mzr3OsS4gzqfPgc63z4POuc68zr\/PgM6\/zrnOtc6vz4TOsc65IM61z4DOr8+DzrfPgiDOus6xzrkgzrrOsc+Ezqwgz4TOt869IM6xzrrOv8+Fz4PPhM65zrrOriDPhc+Azr\/Oss6\/zq7OuM63z4POty4gKM6xz4DOsc65z4TOtc6vz4TOsc65KSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLOlc+AzrXOvs63zrPOt868zrHPhM65zrrPjCDOus61zq\/OvM61zr3OvyIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLOkc+Fz4TPjCDPhM6\/IM66zrXOr868zrXOvc6\/IM61zrzPhs6xzr3Or862zrXPhM6xzrkgz4zPhM6xzr0gzr8gz4fPgc6uz4PPhM63z4Igz4DOtc+Bzr3OrCDPhM6\/zr0gzrrOrc+Bz4POv8+BzrEgz4DOrM69z4kgzrHPgM+MIM+EzrfOvSDOtc65zrrPjM69zrEuICjPgM+Bzr\/Osc65z4HOtc+EzrnOus6sKSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLOjM69zr\/OvM6xIM+AzrXPgc65zrXPh86\/zrzOrc69zr\/PhSDOtc65zrrPjM69zrHPgiIsCiAgICAgICJkZWZhdWx0IjogIs6VzrnOus+Mzr3OsSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFeHBhbmQgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJFeHBhbmQgSW1hZ2UiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWluaW1pemUgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJNaW5pbWl6ZSBJbWFnZSIKICAgIH0KICBdCn0K"],"libraries\/H5P.Image-1.1\/language\/es.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbWFnZW4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRGVjb3JhdGl2byBzb2xhbWVudGUiLAogICAgICAiZGVzY3JpcHRpb24iOiAiSGFiaWxpdGEgZXN0YSBvcGNpw7NuIHNpIGxhIGltYWdlbiBlcyBwdXJhbWVudGUgZGVjb3JhdGl2YSB5IG5vIGHDsWFkZSBpbmZvcm1hY2nDs24gYWwgY29udGVuaWRvIGRlIGxhIHDDoWdpbmEuIFNlcsOhIGlnbm9yYWRhIHBvciBsb3MgbGVjdG9yZXMgZGUgcGFudGFsbGEgeSBubyBzZSBsZSBkYXLDoSBuaW5nw7puIHRleHRvIGFsdGVybmF0aXZvLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBhbHRlcm5hdGl2byIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJOZWNlc2FyaW8uIFNpIGVsIG5hdmVnYWRvciBubyBwdWVkZSBjYXJnYXIgbGEgaW1hZ2VuLCBzZSBtb3N0cmFyw6EgZXN0ZSB0ZXh0byBlbiBzdSBsdWdhci4gVXNhZG8gdGFtYmnDqW4gcG9yIGxlY3RvcmVzIGRlIHBhbnRhbGxhLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBhbCBwYXNhciBlbCByYXTDs24gcG9yIGVuY2ltYSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJPcGNpb25hbC4gRXN0ZSB0ZXh0byBzZSBtdWVzdHJhIGN1YW5kbyBlbCB1c3VhcmlvIHBhc2EgZWwgcHVudGVybyBkZWwgcmF0w7NuIHBvciBlbmNpbWEgZGUgbGEgaW1hZ2VuLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJOb21icmUgZGVsIGNvbnRlbmlkbyBkZSBsYSBpbWFnZW4iLAogICAgICAiZGVmYXVsdCI6ICJJbWFnZW4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRXhwYW5kaXIgaW1hZ2VuIiwKICAgICAgImRlZmF1bHQiOiAiRXhwYW5kaXIgSW1hZ2VuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk1pbmltaXphciBJbWFnZW4iLAogICAgICAiZGVmYXVsdCI6ICJNaW5pbWl6YXIgSW1hZ2VuIgogICAgfQogIF0KfQo="],"libraries\/H5P.Image-1.1\/language\/es-mx.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbWFnZW4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRGVjb3JhdGl2byBzb2xhbWVudGUiLAogICAgICAiZGVzY3JpcHRpb24iOiAiSGFiaWxpdGUgZXN0YSBvcGNpw7NuIHNpIGxhIGltYWdlbiBlcyBwdXJhbWVudGUgZGVjb3JhdGl2YSB5IG5vIGHDsWFkZSBpbmZvcm1hY2nDs24gYWwgY29udGVuaWRvIGRlIGxhIHDDoWdpbmEuIFNlcsOhIGlnbm9yYWRhIHBvciBsZWN0b3JlcyBkZSBwYW50YWxsYSBlbiB2b3ogYWx0YSB5IG5vIHNlIGxlIGRhcsOhIG5pbmfDum4gdGV4dG8gYWx0ZXJuYXRpdm8uIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIGFsdGVybmF0aXZvIiwKICAgICAgImRlc2NyaXB0aW9uIjogIk5lY2VzYXJpby4gU2kgZWwgbmF2ZWdhZG9yIG5vIHB1ZWRlIGNhcmdhciBsYSBpbWFnZW4gZXN0ZSB0ZXh0byBzZXLDoSBtb3N0cmFkbyBlbiBzdSBsdWdhci4gVGFtYmnDqW4gZXMgdXNhZG8gcG9yIGxlY3RvcmVzIGRlIFwidGV4dG8taGFibGFkb1wiLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBhbCBwYXNhciBlbCByYXTDs24gZW5jaW1hIiwKICAgICAgImRlc2NyaXB0aW9uIjogIk9wY2lvbmFsLiBFc3RlIHRleHRvIGVzIG1vc3RyYWRvIGN1YW5kbyBlbCB1c3VhcmlvIHBhc2EgZWwgcHVudGVybyBkZWwgcmF0w7NuIGVuY2ltYSBkZSBsYSBpbWFnZW4uIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk5vbWJyZSBkZWwgY29udGVuaWRvIGRlIGxhIGltYWdlbiIsCiAgICAgICJkZWZhdWx0IjogIkltYWdlbiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFeHBhbmRpciBJbWFnZW4iLAogICAgICAiZGVmYXVsdCI6ICJFeHBhbmRpciBJbWFnZW4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWluaW1pemFyIEltYWdlbiIsCiAgICAgICJkZWZhdWx0IjogIk1pbmltaXphciBJbWFnZW4iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Image-1.1\/language\/et.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJQaWx0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkRlY29yYXRpdmUgb25seSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJFbmFibGUgdGhpcyBvcHRpb24gaWYgdGhlIGltYWdlIGlzIHB1cmVseSBkZWNvcmF0aXZlIGFuZCBkb2VzIG5vdCBhZGQgYW55IGluZm9ybWF0aW9uIHRvIHRoZSBjb250ZW50IG9uIHRoZSBwYWdlLiBJdCB3aWxsIGJlIGlnbm9yZWQgYnkgc2NyZWVuIHJlYWRlcnMgYW5kIG5vdCBnaXZlbiBhbnkgYWx0ZXJuYXRpdmUgdGV4dC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQWx0ZXJuYXRpaXZ0ZWtzdCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJOw7V1dHVkLiBLdWkgYnJhdXNlciBlaSBzYWEgcGlsdGkgbGFhZGlkYSwgc2lpcyBuw6RpZGF0YWtzZSBzZWRhIHRla3N0aS4gU2FtdXRpIGthc3V0YXRha3NlIFwidGV4dC10by1zcGVlY2hcIiBsdWdlamFpcy4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiSMO1bGp1dmEga3Vyc29yaSB0ZWtzdCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJWYWxpa3VsaW5lLiBTZWRhIHRla3N0aSBuw6RpZGF0YWtzZSwga3VpIGthc3V0YWphIGjDtWxqdXRhYiBrdXJzb3JpdCBwaWxkaSBrb2hhbC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUGlsZGlzaXN1IG5pbWkiLAogICAgICAiZGVmYXVsdCI6ICJQaWx0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkV4cGFuZCBJbWFnZSIsCiAgICAgICJkZWZhdWx0IjogIkV4cGFuZCBJbWFnZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJNaW5pbWl6ZSBJbWFnZSIsCiAgICAgICJkZWZhdWx0IjogIk1pbmltaXplIEltYWdlIgogICAgfQogIF0KfQo="],"libraries\/H5P.Image-1.1\/language\/eu.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJJcnVkaWEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQXBhaW5nYXJyaWEgYmFpbm8gZXoiLAogICAgICAiZGVzY3JpcHRpb24iOiAiQXVrZXJhIGhhdSBnYWl0dSBlemF6dSBpcnVkaWEgYXBhaW5nYXJyaWEgYmFpbm8gZXogYmFkYSBldGEgZXogYmFkaW8gb3JyaWtvIGVkdWtpYXJpIGluZm9ybWF6aW9yaWsgZ2VoaXR6ZW4uIFBhbnRhaWxhIGlyYWt1cmdhaWx1ZWsgZXogZHV0ZSBrb250dWFuIGl6YW5nbyBldGEgZXogZGlvdGUgb3JkZXprbyB0ZXN0dXJpayBlbWFuZ28uIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk9yZGV6a28gdGVzdHVhIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkJlaGFycmV6a29hIGRhLiBOYWJpZ2F0emFpbGVhayBlemluIGJhZHUgaXJ1ZGlhIGthcmdhdHUsIGJlcmUgb3JkZXogdGVzdHUgaGF1IGJpc3RhcmF0dWtvIGRhLiBUZXN0dS1pcmFrdXJsZWVrIGVyZSBlcmFiaWxpYS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRGVzcGxhemFtZW5kdSB0ZXN0dWEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiQXVrZXJha29hLiBUZXN0dSBoYXUgZXJhYmlsdHphaWxlYWsgYmVyZSBnYWlsdSBlcmFrdXNsZWEgaXJ1ZGlhcmVuIGdhaW5ldGlrIHBhc2F0emVhbiBiaXN0YXJhdHVrbyBkYS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiSXJ1ZGlhcmVuIGVkdWtpYXJlbiBpemVuYSIsCiAgICAgICJkZWZhdWx0IjogIklydWRpYSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJaYWJhbGR1IElydWRpYSIsCiAgICAgICJkZWZhdWx0IjogIlphYmFsZHUgSXJ1ZGlhIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk1pbmltaXphdHUgaXJ1ZGlhIiwKICAgICAgImRlZmF1bHQiOiAiTWluaW1pemF0dSBpcnVkaWEiCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Image-1.1\/language\/fa.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLYqti12YjbjNixIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkRlY29yYXRpdmUgb25seSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJFbmFibGUgdGhpcyBvcHRpb24gaWYgdGhlIGltYWdlIGlzIHB1cmVseSBkZWNvcmF0aXZlIGFuZCBkb2VzIG5vdCBhZGQgYW55IGluZm9ybWF0aW9uIHRvIHRoZSBjb250ZW50IG9uIHRoZSBwYWdlLiBJdCB3aWxsIGJlIGlnbm9yZWQgYnkgc2NyZWVuIHJlYWRlcnMgYW5kIG5vdCBnaXZlbiBhbnkgYWx0ZXJuYXRpdmUgdGV4dC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi2YXYqtmGINis2KfbjNqv2LLbjNmGIiwKICAgICAgImRlc2NyaXB0aW9uIjogItin2YTYstin2YXbjC4g2Kfar9ixINmF2LHZiNqv2LEg2YbYqtmI2KfZhtivINiq2LXZiNuM2LEg2LHYpyDYqNin2LHar9uM2LHbjCDaqdmG2K\/YjCDYp9uM2YYg2YXYqtmGINio2Ycg2KzYp9uMINii2YYg2YbZhdin24zYtCDYr9in2K\/ZhyDYrtmI2KfZh9ivINi02K8uINmH2YXahtmG24zZhiDZhdio2K\/ZhCDZhdiq2YYg2KjZhyDar9mB2KrYp9ixINin2LIg2KLZhiDYp9iz2KrZgdin2K\/ZhyDYrtmI2KfZh9ivINqp2LHYry4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi2YXYqtmGINi02YbYp9mI2LEiLAogICAgICAiZGVzY3JpcHRpb24iOiAi2KfYrtiq24zYp9ix24wuINin24zZhiDZhdiq2YYg2YjZgtiq24wg2YbZhdin24zYtCDYr9in2K\/ZhyDZhduM4oCM2LTZiNivINqp2Ycg2qnYp9ix2KjYsSDZhti02KfZhtqv2LEg2YXZiNizINix2Kcg2LHZiNuMINiq2LXZiNuM2LEg2YXbjOKAjNio2LHYry4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi2YbYp9mFINmF2K3YqtmI2KfbjCDYqti12YjbjNixIiwKICAgICAgImRlZmF1bHQiOiAi2KrYtdmI24zYsSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFeHBhbmQgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJFeHBhbmQgSW1hZ2UiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWluaW1pemUgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJNaW5pbWl6ZSBJbWFnZSIKICAgIH0KICBdCn0K"],"libraries\/H5P.Image-1.1\/language\/fi.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJLdXZhIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkRlY29yYXRpdmUgb25seSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJFbmFibGUgdGhpcyBvcHRpb24gaWYgdGhlIGltYWdlIGlzIHB1cmVseSBkZWNvcmF0aXZlIGFuZCBkb2VzIG5vdCBhZGQgYW55IGluZm9ybWF0aW9uIHRvIHRoZSBjb250ZW50IG9uIHRoZSBwYWdlLiBJdCB3aWxsIGJlIGlnbm9yZWQgYnkgc2NyZWVuIHJlYWRlcnMgYW5kIG5vdCBnaXZlbiBhbnkgYWx0ZXJuYXRpdmUgdGV4dC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVmFpaHRvZWh0b2luZW4ga3V2YXVzIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlZhYWRpdGFhbi4gTsOkeXRldMOkw6RuLCBqb3Mgc2VsYWluIGVpIHNhYSBsYWRhdHR1YSBrdXZhYS4gS3V2YXVzdGEga8OkeXR0w6R2w6R0IG15w7ZzIHJ1dWR1bmx1a2lqYXNvdmVsbHVrc2V0LiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJIb3ZlciIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJWYWxpbm5haW5lbi4gTsOkeXRldMOkw6RuLCBrdW4ga8OkeXR0w6Rqw6QgcGl0w6TDpCBrdXJzb3NpYSBrdXZhbiBww6TDpGxsw6QuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlNpc8OkbHTDtnR5eXBpbiBuaW1pIiwKICAgICAgImRlZmF1bHQiOiAiS3V2YSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFeHBhbmQgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJFeHBhbmQgSW1hZ2UiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWluaW1pemUgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJNaW5pbWl6ZSBJbWFnZSIKICAgIH0KICBdCn0K"],"libraries\/H5P.Image-1.1\/language\/fr.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbWFnZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZWNvcmF0aXZlIG9ubHkiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRW5hYmxlIHRoaXMgb3B0aW9uIGlmIHRoZSBpbWFnZSBpcyBwdXJlbHkgZGVjb3JhdGl2ZSBhbmQgZG9lcyBub3QgYWRkIGFueSBpbmZvcm1hdGlvbiB0byB0aGUgY29udGVudCBvbiB0aGUgcGFnZS4gSXQgd2lsbCBiZSBpZ25vcmVkIGJ5IHNjcmVlbiByZWFkZXJzIGFuZCBub3QgZ2l2ZW4gYW55IGFsdGVybmF0aXZlIHRleHQuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRlIGFsdGVybmF0aWYiLAogICAgICAiZGVzY3JpcHRpb24iOiAiT2JsaWdhdG9pcmUuIENlIHRleHRlIHNlcmEgYWZmaWNow6kgc2kgbCdpbWFnZSBuJ2FwcGFyYcOudCBwYXMgZGFucyBsZSBuYXZpZ2F0ZXVyLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0ZSBkZSBzdXJ2b2wiLAogICAgICAiZGVzY3JpcHRpb24iOiAiT3B0aW9ubmVsLiBDZSB0ZXh0ZSBlc3QgYWZmaWNow6kgcXVhbmQgbGEgc291cmlzIHN1cnZvbGUgdW5lIGltYWdlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJMw6lnZW5kZSIsCiAgICAgICJkZWZhdWx0IjogIkltYWdlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkV4cGFuZCBJbWFnZSIsCiAgICAgICJkZWZhdWx0IjogIkV4cGFuZCBJbWFnZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJNaW5pbWl6ZSBJbWFnZSIsCiAgICAgICJkZWZhdWx0IjogIk1pbmltaXplIEltYWdlIgogICAgfQogIF0KfQo="],"libraries\/H5P.Image-1.1\/language\/gl.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbWF4ZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJTw7MgZGVjb3JhdGl2YSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJBY3RpdmEgZXN0YSBvcGNpw7NuIHNlIGEgaW1heGUgZSBwdXJhbWVudGUgZGVjb3JhdGl2YSBlIG5vbiBlbmdhZGUgbmluZ3VuaGEgaW5mb3JtYWNpw7NuIGFvIGNvbnRpZG8gZGEgcMOheGluYS4gU2Vyw6EgaWdub3JhZGEgcG9sb3MgbGVjdG9yZXMgZGUgcGFudGFsbGEgZSBub24gdGVyw6EgdGV4dG8gYWx0ZXJuYXRpdm8uIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIGFsdGVybmF0aXZvIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlJlcXVpcmlkby4gU2UgbyBuYXZlZ2Fkb3Igbm9uIHBvZGUgY2FyZ2FyIGEgaW1heGUsIGFtb3NhcmFzZSBlc3RlIHRleHRvIG5vIHNldSBsdWdhci4gw5pzYXNlIHRhbcOpbiBwYXJhIG9zIGxlY3RvcmVzIGRlIHBhbnRhbGxhLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBhbyBwYXNhciBvIGN1cnNvciBwb3IgcmliYSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJPcGNpb25hbC4gQW3Ds3Nhc2UgZXN0ZSB0ZXh0byBjYW5kbyBvcyB1c3VhcmlvcyBzaXTDumFuIG8gY3Vyc29yIGRvIHNldSBkaXNwb3NpdGl2byBhcHVudGFkb3IgZW5yaWJhIGRhIGltYXhlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJOb21lIGRvIGNvbnRpZG8gZGEgaW1heGUiLAogICAgICAiZGVmYXVsdCI6ICJJbWF4ZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJBbXBsaWFyIEltYXhlIiwKICAgICAgImRlZmF1bHQiOiAiQW1wbGlhciBJbWF4ZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJNaW5pbWl6YXIgYSBpbWF4ZSIsCiAgICAgICJkZWZhdWx0IjogIk1pbmltaXphciBhIGltYXhlIgogICAgfQogIF0KfQo="],"libraries\/H5P.Image-1.1\/language\/he.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLXqtee15XXoNeUIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItec16fXmdep15XXmCDXkdec15HXkyIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLXlNek16LXnNeqINeQ16TXqdeo15XXqiDXlteVINeQ150g15TXqtee15XXoNeUINeU15nXkCDXnNen15nXqdeV15gg15HXnNeR15Mg15XXkNeZ16DXlCDXnteV16HXmdek15Qg157XmdeT16Ig15vXnNep15TXlSDXnNeq15XXm9efINeR16LXnteV15MuINen15XXqNeQ15kg15TXnteh15og15nXqtei15zXnteVINee157XoNeVINeV15zXkCDXmden15HXnCDXmNen16HXmCDXl9ec15XXpNeZLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLXmNen16HXmCDXl9ec15XXpNeZIiwKICAgICAgImRlc2NyaXB0aW9uIjogIteg15fXldelLiDXkNedINeU15PXpNeT16TXnyDXnNeQINeZ15vXldecINec15TXotec15XXqiDXkNeqINeU16rXnteV16DXlCDXmNen16HXmCDXlteUINeZ15XXpteSINeR157Xp9eV150uINeR16nXmdee15XXqSDXktedINei15wg15nXk9eZINen15XXqNeQ15kgXCLXnteY16fXodeYINec15PXmdeR15XXqFwiLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLXqteV15XXmdeqINeU157Xldem15LXqiDXkdee16LXkdeoINeh157XnyDXlNei15vXkdeoIiwKICAgICAgImRlc2NyaXB0aW9uIjogIteQ15XXpNem15nXldeg15zXmS4g15jXp9eh15gg15bXlCDXnteV16bXkiDXm9eQ16nXqCDXlNee16nXqtee16nXmdedINee16LXkdeZ16jXmdedINeQ16og157Xm9ep15nXqCDXlNeU16bXkdei15Qg16nXnNeU150g157XotecINeU16rXnteV16DXlC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi16nXnSDXqteV15vXnyDXqtee15XXoNeUIiwKICAgICAgImRlZmF1bHQiOiAi16rXnteV16DXlCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFeHBhbmQgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJFeHBhbmQgSW1hZ2UiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWluaW1pemUgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJNaW5pbWl6ZSBJbWFnZSIKICAgIH0KICBdCn0K"],"libraries\/H5P.Image-1.1\/language\/hu.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbWFnZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZWNvcmF0aXZlIG9ubHkiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRW5hYmxlIHRoaXMgb3B0aW9uIGlmIHRoZSBpbWFnZSBpcyBwdXJlbHkgZGVjb3JhdGl2ZSBhbmQgZG9lcyBub3QgYWRkIGFueSBpbmZvcm1hdGlvbiB0byB0aGUgY29udGVudCBvbiB0aGUgcGFnZS4gSXQgd2lsbCBiZSBpZ25vcmVkIGJ5IHNjcmVlbiByZWFkZXJzIGFuZCBub3QgZ2l2ZW4gYW55IGFsdGVybmF0aXZlIHRleHQuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFsdGVybmF0aXZlIHRleHQiLAogICAgICAiZGVzY3JpcHRpb24iOiAiUmVxdWlyZWQuIElmIHRoZSBicm93c2VyIGNhbid0IGxvYWQgdGhlIGltYWdlIHRoaXMgdGV4dCB3aWxsIGJlIGRpc3BsYXllZCBpbnN0ZWFkLiBBbHNvIHVzZWQgYnkgXCJ0ZXh0LXRvLXNwZWVjaFwiIHJlYWRlcnMuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkhvdmVyIHRleHQiLAogICAgICAiZGVzY3JpcHRpb24iOiAiT3B0aW9uYWwuIFRoaXMgdGV4dCBpcyBkaXNwbGF5ZWQgd2hlbiB0aGUgdXNlcnMgaG92ZXIgdGhlaXIgcG9pbnRpbmcgZGV2aWNlIG92ZXIgdGhlIGltYWdlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbWFnZSBjb250ZW50IG5hbWUiLAogICAgICAiZGVmYXVsdCI6ICJJbWFnZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFeHBhbmQgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJFeHBhbmQgSW1hZ2UiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWluaW1pemUgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJNaW5pbWl6ZSBJbWFnZSIKICAgIH0KICBdCn0K"],"libraries\/H5P.Image-1.1\/language\/it.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbW1hZ2luZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZWNvcmF0aXZlIG9ubHkiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRW5hYmxlIHRoaXMgb3B0aW9uIGlmIHRoZSBpbWFnZSBpcyBwdXJlbHkgZGVjb3JhdGl2ZSBhbmQgZG9lcyBub3QgYWRkIGFueSBpbmZvcm1hdGlvbiB0byB0aGUgY29udGVudCBvbiB0aGUgcGFnZS4gSXQgd2lsbCBiZSBpZ25vcmVkIGJ5IHNjcmVlbiByZWFkZXJzIGFuZCBub3QgZ2l2ZW4gYW55IGFsdGVybmF0aXZlIHRleHQuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRlc3RvIGFsdGVybmF0aXZvIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlJpY2hpZXN0by4gU2UgaWwgYnJvd3NlciBub24gw6ggaW4gZ3JhZG8gZGkgY2FyaWNhcmUgbCdpbW1hZ2luZSBzYXLDoCB2aXN1YWxpenphdG8gcXVlc3RvIHRlc3RvLiBVc2F0byBhbmNoZSBwZXIgaWwgbGV0dG9yZSB2b2NhbGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRlc3RvIGluIHNvdnJhaW1wcmVzc2lvbmUiLAogICAgICAiZGVzY3JpcHRpb24iOiAiT3B6aW9uYWxlLiBRdWVzdG8gdGVzdG8gdmllbmUgdmlzdWFsaXp6YXRvIHF1YW5kbyBsJ3V0ZW50ZSBwYXNzYSBjb2wgcHVudGF0b3JlIHNvcHJhIGwnaW1tYWdpbmUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk5vbWUgZGVsIGNvbnRlbnV0byBkZWxsJ2ltbWFnaW5lIiwKICAgICAgImRlZmF1bHQiOiAiSW1tYWdpbmUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRXhwYW5kIEltYWdlIiwKICAgICAgImRlZmF1bHQiOiAiRXhwYW5kIEltYWdlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk1pbmltaXplIEltYWdlIiwKICAgICAgImRlZmF1bHQiOiAiTWluaW1pemUgSW1hZ2UiCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Image-1.1\/language\/ja.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLnlLvlg48iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRGVjb3JhdGl2ZSBvbmx5IiwKICAgICAgImRlc2NyaXB0aW9uIjogIkVuYWJsZSB0aGlzIG9wdGlvbiBpZiB0aGUgaW1hZ2UgaXMgcHVyZWx5IGRlY29yYXRpdmUgYW5kIGRvZXMgbm90IGFkZCBhbnkgaW5mb3JtYXRpb24gdG8gdGhlIGNvbnRlbnQgb24gdGhlIHBhZ2UuIEl0IHdpbGwgYmUgaWdub3JlZCBieSBzY3JlZW4gcmVhZGVycyBhbmQgbm90IGdpdmVuIGFueSBhbHRlcm5hdGl2ZSB0ZXh0LiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLku6Pmm7\/jg4bjgq3jgrnjg4giLAogICAgICAiZGVzY3JpcHRpb24iOiAi5b+F6aCI44CC44OW44Op44Km44K244O844GM55S75YOP44KS44Ot44O844OJ44Gn44GN44Gq44GE5aC05ZCI44Gv44CB44GT44Gu44OG44Kt44K544OI44GM5Luj44KP44KK44Gr6KGo56S644GV44KM44G+44GZ44CC44G+44Gf44CBICDjg6rjg7zjg4njgrnjg5Tjg7zjgqvjg7zjgavjgojjgaPjgabkvb\/nlKjjgZXjgozjgb7jgZnjgIIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi44Ob44OQ44O844OG44Kt44K544OIIiwKICAgICAgImRlc2NyaXB0aW9uIjogIuecgeeVpeWPr+iDveOBp+OBmeOAguOBk+OBruODhuOCreOCueODiOOBr+OAgeODpuODvOOCtuODvOOBjOeUu+WDj+OBruS4iuOBq+ODneOCpOODs+ODhuOCo+ODs+OCsCDjg4fjg5DjgqTjgrnjgpLnva7jgYTjgZ\/jgajjgY3jgavooajnpLrjgZXjgozjgb7jgZnjgIIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi55S75YOP44Gu44Kz44Oz44OG44Oz44OE5ZCNIiwKICAgICAgImRlZmF1bHQiOiAi55S75YOPIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkV4cGFuZCBJbWFnZSIsCiAgICAgICJkZWZhdWx0IjogIkV4cGFuZCBJbWFnZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJNaW5pbWl6ZSBJbWFnZSIsCiAgICAgICJkZWZhdWx0IjogIk1pbmltaXplIEltYWdlIgogICAgfQogIF0KfQo="],"libraries\/H5P.Image-1.1\/language\/ka.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLhg5Lhg5Dhg5vhg53hg6Hhg5Dhg67hg6Phg5rhg5Thg5Hhg5AiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4YOb4YOu4YOd4YOa4YOd4YOTIOGDk+GDlOGDmeGDneGDoOGDkOGDouGDmOGDo+GDmuGDmCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLhg5Phg5Dhg6Phg6jhg5Xhg5gg4YOU4YOhIOGDleGDkOGDoOGDmOGDkOGDnOGDouGDmCwg4YOX4YOjIOGDkuGDkOGDm+GDneGDoeGDkOGDruGDo+GDmuGDlOGDkeGDkCDhg6Hhg6Dhg6Phg5rhg5jhg5Dhg5Mg4YOT4YOU4YOZ4YOd4YOg4YOQ4YOi4YOY4YOj4YOa4YOY4YOQIOGDk+GDkCDhg5Dhg6Ag4YOQ4YOb4YOQ4YOi4YOU4YOR4YOhIOGDoOGDkOGDmOGDm+GDlCDhg5jhg5zhg6Thg53hg6Dhg5vhg5Dhg6rhg5jhg5Dhg6Eg4YOS4YOV4YOU4YOg4YOT4YOW4YOUIOGDm+GDneGDquGDlOGDm+GDo+GDmiDhg6jhg5jhg5zhg5Dhg5Dhg6Dhg6Hhg6EuIOGDlOGDmeGDoOGDkOGDnOGDmOGDoSDhg6zhg5Dhg5vhg5nhg5jhg5fhg67hg5Xhg5Thg5rhg5gg4YOb4YOQ4YOhIOGDo+GDkuGDo+GDmuGDlOGDkeGDlOGDmuGDp+GDneGDpOGDoSDhg5Phg5Ag4YOQ4YOgIOGDm+GDmOGDkOGDrOGDleGDk+GDmOGDoSDhg5Dhg5rhg6Lhg5Thg6Dhg5zhg5Dhg6Lhg5jhg6Phg5og4YOi4YOU4YOl4YOh4YOi4YOhLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLhg5Dhg5rhg6Lhg5Thg6Dhg5zhg5Dhg6Lhg5jhg6Phg5rhg5gg4YOi4YOU4YOl4YOh4YOi4YOYIiwKICAgICAgImRlc2NyaXB0aW9uIjogIuGDoeGDkOGDleGDkOGDmuGDk+GDlOGDkeGDo+GDmuGDnS4g4YOX4YOjIOGDkeGDoOGDkOGDo+GDluGDlOGDoOGDmCDhg5Lhg5Dhg5vhg53hg6Hhg5Dhg67hg6Phg5rhg5Thg5Hhg5Dhg6Eg4YOQ4YOgIOGDqeGDkOGDouGDleGDmOGDoOGDl+GDkOGDleGDoSwg4YOU4YOhIOGDouGDlOGDpeGDoeGDouGDmCDhg5vhg5jhg6Eg4YOc4YOQ4YOq4YOV4YOa4YOQ4YOTIOGDkuGDkOGDm+GDneGDqeGDnOGDk+GDlOGDkeGDkC4g4YOQ4YOh4YOU4YOV4YOUIOGDkuGDkOGDm+GDneGDmOGDp+GDlOGDnOGDlOGDkeGDkCBcIuGDouGDlOGDpeGDoeGDouGDmOGDoSDhg5Lhg5Dhg5vhg67hg5vhg53hg5Xhg5Dhg5zhg5Thg5Hhg5rhg5jhg6FcIiDhg5vhg5jhg5Thg6AuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuGDouGDlOGDpeGDoeGDouGDmCDhg5nhg6Phg6Dhg6Hhg53hg6Dhg5jhg6Eg4YOb4YOY4YOi4YOQ4YOc4YOY4YOh4YOQ4YOhIiwKICAgICAgImRlc2NyaXB0aW9uIjogIuGDkOGDoOGDkCDhg6Hhg5Dhg5Xhg5Dhg5rhg5Phg5Thg5Hhg6Phg5rhg50uIOGDlOGDoSDhg6Lhg5Thg6Xhg6Hhg6Lhg5gg4YOS4YOQ4YOb4YOd4YOp4YOc4YOT4YOU4YOR4YOQIOGDm+GDkOGDqOGDmOGDnCwg4YOg4YOd4YOT4YOU4YOh4YOQ4YOqIOGDm+GDneGDm+GDruGDm+GDkOGDoOGDlOGDkeGDlOGDmuGDmCDhg5nhg6Phg6Dhg6Hhg53hg6Dhg6Eg4YOS4YOQ4YOb4YOd4YOh4YOQ4YOu4YOj4YOa4YOU4YOR4YOQ4YOh4YOX4YOQ4YOcIOGDm+GDmOGDmOGDouGDkOGDnOGDoS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4YOS4YOQ4YOb4YOd4YOh4YOQ4YOu4YOj4YOa4YOU4YOR4YOY4YOhIOGDqOGDmOGDnOGDkOGDkOGDoOGDoeGDmOGDoSDhg5Phg5Dhg6Hhg5Dhg67hg5Thg5rhg5Thg5Hhg5AiLAogICAgICAiZGVmYXVsdCI6ICLhg5Lhg5Dhg5vhg53hg6Hhg5Dhg67hg6Phg5rhg5Thg5Hhg5AiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4YOh4YOj4YOg4YOQ4YOX4YOY4YOhIOGDkuGDkOGDpOGDkOGDoOGDl+GDneGDlOGDkeGDkCIsCiAgICAgICJkZWZhdWx0IjogIuGDoeGDo+GDoOGDkOGDl+GDmOGDoSDhg5Lhg5Dhg6Thg5Dhg6Dhg5fhg53hg5Thg5Hhg5AiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4YOh4YOj4YOg4YOQ4YOX4YOY4YOhIOGDm+GDmOGDnOGDmOGDm+GDmOGDluGDkOGDquGDmOGDkCIsCiAgICAgICJkZWZhdWx0IjogIuGDoeGDo+GDoOGDkOGDl+GDmOGDoSDhg5vhg5jhg5zhg5jhg5vhg5jhg5bhg5Dhg6rhg5jhg5AiCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Image-1.1\/language\/km.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLhnprhnrzhnpThnpfhnrbhnpYiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRGVjb3JhdGl2ZSBvbmx5IiwKICAgICAgImRlc2NyaXB0aW9uIjogIkVuYWJsZSB0aGlzIG9wdGlvbiBpZiB0aGUgaW1hZ2UgaXMgcHVyZWx5IGRlY29yYXRpdmUgYW5kIGRvZXMgbm90IGFkZCBhbnkgaW5mb3JtYXRpb24gdG8gdGhlIGNvbnRlbnQgb24gdGhlIHBhZ2UuIEl0IHdpbGwgYmUgaWdub3JlZCBieSBzY3JlZW4gcmVhZGVycyBhbmQgbm90IGdpdmVuIGFueSBhbHRlcm5hdGl2ZSB0ZXh0LiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLhnpbhnrbhnoDhn5Lhnpnhnofhn4bhnpPhnr3hnp8iLAogICAgICAiZGVzY3JpcHRpb24iOiAi4Z6R4Z624Z6Y4Z6R4Z624Z6a4Z+UIOGelOGfkuGemuGen+Get+Gek+GelOGevuGegOGemOGfkuGemOGenOGet+GekuGeuOGelOGevuGegOGenOGet+GelOGen+GetuGemeGemuGelOGen+Gfi+GeouGfkuGek+GegOGemOGet+Gek+GeouGetuGeheGeiuGfhuGejuGevuGemuGegOGetuGemuGemuGevOGelOGel+GetuGeluGek+GfgeGfh+GelOGetuGekyDhnpzhnrbhnpPhnrnhnoThnpThnoThn5LhnqDhnrbhnonhnpbhnrbhnoDhn5Lhnpnhnofhn4bhnpPhnr3hnp\/hnpPhn4Hhn4fhn5Qg4Z6W4Z624Z6A4Z+S4Z6Z4Z6T4Z+B4Z+H4Z6A4Z+P4Z6P4Z+S4Z6a4Z684Z6c4Z6U4Z624Z6T4Z6U4Z+S4Z6a4Z6+4Z6A4Z+S4Z6T4Z674Z6E4Z6A4Z6Y4Z+S4Z6Y4Z6c4Z634Z6S4Z644Z6i4Z624Z6T4Z6i4Z6P4Z+S4Z6Q4Z6U4Z6R4Z6H4Z624Z6f4Z6Y4Z+S4Z6b4Z+B4Z6E4Z6V4Z6E4Z6K4Z+C4Z6a4Z+UIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuGeluGetuGegOGfkuGemeGeluGfgeGem+GeiuGetuGegOGfi+GemOGfieGfheGen+GfjeGem+GeviIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLhnpjhnrfhnpPhnpHhnrbhnpjhnpHhnrbhnprhn5Qg4Z6W4Z624Z6A4Z+S4Z6Z4Z6T4Z+B4Z+H4Z6T4Z654Z6E4Z6U4Z6E4Z+S4Z6g4Z624Z6J4Z6T4Z+F4Z6W4Z+B4Z6b4Z6C4Z+B4Z6K4Z624Z6A4Z+L4Z6Y4Z+J4Z+F4Z6f4Z+N4Z6b4Z6+4Z6a4Z684Z6U4Z6X4Z624Z6W4Z6T4Z+B4Z+H4Z+UIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuGeiOGfkuGemOGfhOGfh+Gen+GemOGfkuGemuGetuGelOGfi+GemOGetuGej+Get+GegOGetiDCq+GemuGevOGelOGel+GetuGelsK7IiwKICAgICAgImRlZmF1bHQiOiAi4Z6a4Z684Z6U4Z6X4Z624Z6WIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkV4cGFuZCBJbWFnZSIsCiAgICAgICJkZWZhdWx0IjogIkV4cGFuZCBJbWFnZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJNaW5pbWl6ZSBJbWFnZSIsCiAgICAgICJkZWZhdWx0IjogIk1pbmltaXplIEltYWdlIgogICAgfQogIF0KfQo="],"libraries\/H5P.Image-1.1\/language\/ko.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLsnbTrr7jsp4AiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRGVjb3JhdGl2ZSBvbmx5IiwKICAgICAgImRlc2NyaXB0aW9uIjogIkVuYWJsZSB0aGlzIG9wdGlvbiBpZiB0aGUgaW1hZ2UgaXMgcHVyZWx5IGRlY29yYXRpdmUgYW5kIGRvZXMgbm90IGFkZCBhbnkgaW5mb3JtYXRpb24gdG8gdGhlIGNvbnRlbnQgb24gdGhlIHBhZ2UuIEl0IHdpbGwgYmUgaWdub3JlZCBieSBzY3JlZW4gcmVhZGVycyBhbmQgbm90IGdpdmVuIGFueSBhbHRlcm5hdGl2ZSB0ZXh0LiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLrjIDslYgg7YWN7Iqk7Yq4IiwKICAgICAgImRlc2NyaXB0aW9uIjogIu2VhOyImC4g67iM65287Jqw7KCA7JeQ7IScIOydtOuvuOyngOulvCDroZzrk5ztlaAg7IiYIOyXhuuKlCDqsr3smrAg7J20IO2FjeyKpO2KuOqwgCDrjIDsi6Ag7ZGc7Iuc65Cc64ukLiDrmJDtlZwgXCJ0ZXh0LXRvLXNwZWVjaFwiICDsnpDrj5kg66y47J6lIOunkO2VmOq4sCDquLDriqUodGV4dC10by1zcGVlY2gp7JeQIOydmO2VtCDsgqzsmqnrkKnri4jri6QuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuuhpOyYpOuyhCDthY3siqTtirgiLAogICAgICAiZGVzY3JpcHRpb24iOiAi7ISg7YOdLiDsnbQg7YWN7Iqk7Yq464qUIOyCrOyaqeyekOqwgCDrp4jsmrDsiqQg7Y+s7J247Yq4IOuTseydhCDsnbTrr7jsp4Ag7JyE7JeQIOyYrOumrOuptCDrlJTsiqTtlIzroIjsnbQg65Cc64ukLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLsnbTrr7jsp4Ag7L2Y7YWQ7LigIOydtOumhCIsCiAgICAgICJkZWZhdWx0IjogIuydtOuvuOyngCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFeHBhbmQgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJFeHBhbmQgSW1hZ2UiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWluaW1pemUgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJNaW5pbWl6ZSBJbWFnZSIKICAgIH0KICBdCn0K"],"libraries\/H5P.Image-1.1\/language\/lt.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJQYXZlaWtzbMSXbGlzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRpayBkZWtvcmF0eXZ1cyIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLErmp1bmtpdGUgxaFpxIUgcGFyaW5rdMSvLCBqZWkgdmFpemRhcyB5cmEgdGlrIGRla29yYXR5dnVzIGlyIG5lcHJpZGVkYSBqb2tpb3MgaW5mb3JtYWNpam9zIHByaWUgcHVzbGFwaW8gdHVyaW5pby4gRWtyYW5vIHNrYWl0eXR1dmFpIGpvIG5lcGFpc3lzIGlyIG5lcGF0ZWlrcyBqb2tpbyBhbHRlcm5hdHl2YXVzIHRla3N0by4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQWx0ZXJuYXR5dnVzIHRla3N0YXMiLAogICAgICAiZGVzY3JpcHRpb24iOiAiQsWrdGluYS4gSmVpIG5hcsWheWtsxJcgbmVnYWxpIMSva2VsdGkgdmFpemRvLCB2aWV0b2ogam8gYnVzIHJvZG9tYXMgxaFpcyB0ZWtzdGFzLiBUYWlwIHBhdCBuYXVkb2phIFwidGVrc3RvIMSvIGthbGLEhVwiIHNrYWl0eXR1dmFpLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJVxb52ZXN0byBwZWzEl3Mgxb55bWVrbGlvIHRla3N0YXMiLAogICAgICAiZGVzY3JpcHRpb24iOiAiTmVwcml2YWxvbWEuIMWgaXMgdGVrc3RhcyByb2RvbWFzLCBrYWkgbmF1ZG90b2phaSB1xb52ZWRhIMW+eW1pa2xpbyDEr3JlbmdpbsSvIHZpcsWhIHBhdmVpa3NsxJdsaW8uIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlBhdmVpa3NsxJdsaW8gdHVyaW5pbyBwYXZhZGluaW1hcyIsCiAgICAgICJkZWZhdWx0IjogIlBhdmVpa3NsxJdsaXMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRXhwYW5kIEltYWdlIiwKICAgICAgImRlZmF1bHQiOiAiRXhwYW5kIEltYWdlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk1pbmltaXplIEltYWdlIiwKICAgICAgImRlZmF1bHQiOiAiTWluaW1pemUgSW1hZ2UiCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Image-1.1\/language\/lv.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJBdHTEk2xzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRpa2FpIGRla29yYXTEq3ZzIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkllc3DEk2pvamlldCDFoW8gb3BjaWp1LCBqYSBhdHTEk2xzIGlyIHRpa2FpIGRla29yYXTEq3ZzIHVuIGxhcGFzIHNhdHVyYW0gbmVwaWV2aWVubyBuZWvEgWR1IGluZm9ybcSBY2lqdS4gRWtyxIFuYSBsYXPEq3TEgWppIHRvIGlnbm9yxJNzLCB1biB0YW0gbmV0aWtzIHBpZcWhxLdpcnRzIGFsdGVybmF0xKt2cyB0ZWtzdHMuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFsdGVybmF0xKt2YWlzIHRla3N0cyIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJPYmxpZ8SBdHMuIEphIHDEgXJsxatrcHJvZ3JhbW1hIG5ldmFyIGllbMSBZMSTdCBhdHTEk2x1LCB0xIEgdmlldMSBIHRpa3MgYXRzcG9ndcS8b3RzIMWhaXMgdGVrc3RzLiBUbyBpem1hbnRvIGFyxKsgYXNpc3TEq3bEgXMgdGVobm9sb8SjaWphcy4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiS3Vyc29yYSBub3ZpZXRvxaFhbmFzIHRla3N0cyIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJOZW9ibGlnxIF0cy4gxaBpcyB0ZWtzdHMgdGlrcyBhdHNwb2d1xLxvdHMsIGthZCBsaWV0b3TEgWpzIHZpcnMgYXR0xJNsYSBub3ZpZXRvcyBwZWxlcyBrdXJzb3J1LiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJBdHTEk2xhIHNhdHVyYSBub3NhdWt1bXMiLAogICAgICAiZGVmYXVsdCI6ICJBdHTEk2xzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkV4cGFuZCBJbWFnZSIsCiAgICAgICJkZWZhdWx0IjogIkV4cGFuZCBJbWFnZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJNaW5pbWl6ZSBJbWFnZSIsCiAgICAgICJkZWZhdWx0IjogIk1pbmltaXplIEltYWdlIgogICAgfQogIF0KfQo="],"libraries\/H5P.Image-1.1\/language\/mn.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLQl9GD0YDQsNCzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCX0LDRgdCw0YUg0LHQvtC70L7QvNC20YLQvtC5IiwKICAgICAgImRlc2NyaXB0aW9uIjogItCt0L3RjdGF0q\/SryDRgdC+0L3Qs9C+0LvRgtGL0LMg0YHQvtC90LPQvtGB0L3QvtC+0YAg0LfRg9GA0LPRi9CzINC30LDRgdCw0YUg0LHQvtC70L7QvNC20YLQvtC5INCx06nQs9Op06nQtCDQvNGN0LTRjdGN0LvRjdC7INC90Y3QvNGN0YUg0LHQvtC70L7QvNC20LPSr9C5INCx0L7Qu9C90L4uINCv0LzQsNGA0LLQsNCwINC90Y3Qs9GN0L0g0YLQtdC60YHRgtGN0L0g0LzRjdC00Y3RjdC70Y3QuyDQvdGMINGF0LDRgNCw0LPQtNCw0YXQs9Kv0Lkg0LHQvtC70L3Qvi4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0J3RjdC80Y3Qu9GCINGC0LXQutGB0YIiLAogICAgICAiZGVzY3JpcHRpb24iOiAi0KjQsNCw0YDQtNC70LDQs9Cw0YLQsNC5LiDQpdGN0YDRjdCyINCx0YDQvtGD0LfQtdGAINC90Ywg0LfRg9GA0LPQuNC50LMg0LTRjdC80LbQuNC2INGH0LDQtNCw0YXQs9Kv0Lkg0YLQvtGF0LjQvtC70LTQvtC70LQg0YLQtdC60YHRgtGN0L0g0LzRjdC00Y3RjdC70Y3QuyDRhdCw0YDQsNCz0LTQsNC90LAuINCc06nQvSDRgtC10LrRgdGC0Y3RjdGBINGP0YDQuNCwINGD0YDRg9GDINGF06nQstGA0q\/Sr9C70Y3RhSDQsdC+0LvQvdC+LiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQpdC+0LLQtdGAINGC0LXQutGB0YIiLAogICAgICAiZGVzY3JpcHRpb24iOiAi0KHQvtC90LPQvtC70YLQvtC+0YAuINCl0Y3RgNGN0LPQu9GN0LPRhyDQt9GD0YDQsNCzINC00Y3RjdGAINGF0YPQu9Cz0LDQvdCw0LAg0YfQuNGA0Ycg0LDQstGH0YDQsNGFINKv0LXQtCDRgtC10LrRgdGCINGF0LDRgNCw0LPQtNCw0YUg0LHQvtC70L3Qvi4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0JfRg9GA0LPQuNC50L0g0L3RjdGAIiwKICAgICAgImRlZmF1bHQiOiAi0JfRg9GA0LDQsyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFeHBhbmQgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJFeHBhbmQgSW1hZ2UiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWluaW1pemUgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJNaW5pbWl6ZSBJbWFnZSIKICAgIH0KICBdCn0K"],"libraries\/H5P.Image-1.1\/language\/nb.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJCaWxkZWZpbCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZWNvcmF0aXZlIG9ubHkiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRW5hYmxlIHRoaXMgb3B0aW9uIGlmIHRoZSBpbWFnZSBpcyBwdXJlbHkgZGVjb3JhdGl2ZSBhbmQgZG9lcyBub3QgYWRkIGFueSBpbmZvcm1hdGlvbiB0byB0aGUgY29udGVudCBvbiB0aGUgcGFnZS4gSXQgd2lsbCBiZSBpZ25vcmVkIGJ5IHNjcmVlbiByZWFkZXJzIGFuZCBub3QgZ2l2ZW4gYW55IGFsdGVybmF0aXZlIHRleHQuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFsdGVybmF0aXYgdGVrc3QiLAogICAgICAiZGVzY3JpcHRpb24iOiAiUMOla3JldmQuIEh2aXMgYmlsZGV0IGlra2Uga2FuIGxhc3RlcyB2aXNlcyBkZW5uZSB0ZWtzdGVuIGlzdGVkZW5mb3IuIERlbm5lIGJsaXIgb2dzw6UgYnJ1a3QgdmVkIHRhbGVzeW50ZXNlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJTdmV2ZS10ZWtzdCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJWYWxnZnJpdHQuIERlbm5lIHRla3N0ZW4gdmlzZXMgbsOlciBicnVrZXJlbiBob2xkZXIgcGVrZWVuaGV0ZW4gb3ZlciBiaWxkZXQuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIklubmhvbGRzbmF2biBmb3IgYmlsZGUiLAogICAgICAiZGVmYXVsdCI6ICJJbWFnZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFeHBhbmQgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJFeHBhbmQgSW1hZ2UiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWluaW1pemUgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJNaW5pbWl6ZSBJbWFnZSIKICAgIH0KICBdCn0K"],"libraries\/H5P.Image-1.1\/language\/nl.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJBZmJlZWxkaW5nIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlNsZWNodHMgZGVjb3JhdGllZiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJTY2hha2VsIGRlemUgb3B0aWUgaW4gYWxzIGRlIGFmYmVlbGRpbmcgcHV1ciBkZWNvcmF0aWVmIGlzIGVuIGdlZW4gaW5mb3JtYXRpZSBhYW4gZGUgaW5ob3VkIHZhbiBkZSBwYWdpbmEgdG9ldm9lZ3QuIFNjaGVybWxlemVycyBuZWdlcmVuIGRlIGFmYmVlbGRpbmcgZGFuIGVuIGdldmVuIG9vayBnZWVuIGFsdGVybmF0aWV2ZSB0ZWtzdC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQWx0ZXJuYXRpZXZlIHRla3N0IiwKICAgICAgImRlc2NyaXB0aW9uIjogIlZlcmVpc3QuIEFscyBkZSBicm93c2VyIGRlemUgYWZiZWVsZGluZyBuaWV0IGthbiBsYWRlbiB3b3JkdCBkZXplIHRla3N0IGdldG9vbmQuIE9vayBnZWJydWlrdCBkb29yIFwidGVrc3QtbmFhci1zcHJhYWtcIiBsZXplcnMuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkhvdmVyIHRla3N0IiwKICAgICAgImRlc2NyaXB0aW9uIjogIk9wdGlvbmVlbC4gRGV6ZSB0ZWtzdCB3b3JkdCBnZXRvb25kIHdhbm5lZXIgZWVuIGdlYnJ1aWtlciB6aWpuIG11aXNhYW53aWp6ZXIgYmV3ZWVndCBvdmVyIGRlIGFmYmVlbGRpbmcuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk5hYW0gYWZiZWVsZGluZ3NpbmhvdWQiLAogICAgICAiZGVmYXVsdCI6ICJBZmJlZWxkaW5nIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkV4cGFuZCBJbWFnZSIsCiAgICAgICJkZWZhdWx0IjogIkV4cGFuZCBJbWFnZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJNaW5pbWl6ZSBJbWFnZSIsCiAgICAgICJkZWZhdWx0IjogIk1pbmltaXplIEltYWdlIgogICAgfQogIF0KfQo="],"libraries\/H5P.Image-1.1\/language\/nn.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbWFnZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZWNvcmF0aXZlIG9ubHkiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRW5hYmxlIHRoaXMgb3B0aW9uIGlmIHRoZSBpbWFnZSBpcyBwdXJlbHkgZGVjb3JhdGl2ZSBhbmQgZG9lcyBub3QgYWRkIGFueSBpbmZvcm1hdGlvbiB0byB0aGUgY29udGVudCBvbiB0aGUgcGFnZS4gSXQgd2lsbCBiZSBpZ25vcmVkIGJ5IHNjcmVlbiByZWFkZXJzIGFuZCBub3QgZ2l2ZW4gYW55IGFsdGVybmF0aXZlIHRleHQuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFsdGVybmF0aXYgdGVrc3QiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVmlzcyBiaWxldGV0IGlra2plIGthbiBsYXN0YXN0LCBibGlyIGRlbm5lIHRla3N0ZW4gdmlzdCBpIGlzdGFkZW5mb3IuIERlbm5lIGJsaXIgb2cgbnl0dGEgdmVkIHRhbGVzeW50ZXNlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJTdmV2ZS10ZWtzdCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJEZW5uZSB0ZWtzdGVuIGJsaXIgdmlzdCBuw6VyIGJydWthcmVuIGhlbGQgcGVpa2VlaW5pbmdhIG92ZXIgYmlsZXRlLiBLYW4gdGlsIGTDuG1lcyBicnVrYXN0IHRpbCDDpSBpbmZvcm1lcmUgb20gb3BwaGF2LiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbm5oYWxkc25hbW4gZm9yIGJpbGV0ZSIsCiAgICAgICJkZWZhdWx0IjogIkJpbGV0ZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFeHBhbmQgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJFeHBhbmQgSW1hZ2UiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWluaW1pemUgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJNaW5pbWl6ZSBJbWFnZSIKICAgIH0KICBdCn0K"],"libraries\/H5P.Image-1.1\/language\/pl.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJPYnJheiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZWNvcmF0aXZlIG9ubHkiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRW5hYmxlIHRoaXMgb3B0aW9uIGlmIHRoZSBpbWFnZSBpcyBwdXJlbHkgZGVjb3JhdGl2ZSBhbmQgZG9lcyBub3QgYWRkIGFueSBpbmZvcm1hdGlvbiB0byB0aGUgY29udGVudCBvbiB0aGUgcGFnZS4gSXQgd2lsbCBiZSBpZ25vcmVkIGJ5IHNjcmVlbiByZWFkZXJzIGFuZCBub3QgZ2l2ZW4gYW55IGFsdGVybmF0aXZlIHRleHQuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0IGFsdGVybmF0eXdueSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJXeW1hZ2FueS4gVGVuIHRla3N0IHpvc3RhbmllIHd5xZt3aWV0bG9ueSwgamXFm2xpIHByemVnbMSFZGFya2EgbmllIHpkb8WCYSB6YcWCYWRvd2HEhyBvYnJhenUuIFBvdHJ6ZWJueSB0YWvFvGUgZGxhIGN6eXRuaWvDs3cgZWtyYW51LiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdCB3IGR5bWt1IiwKICAgICAgImRlc2NyaXB0aW9uIjogIk9wY2pvbmFsbmEuIFRlbiB0ZWtzdCB6b3N0YW5pZSB3ecWbd2lldGxvbnksIGdkeSB1xbx5dGtvd25payBuYWplZHppZSBrdXJzb3JlbSBuYSBvYnJhei4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTmF6d2Egb2JyYXp1IiwKICAgICAgImRlZmF1bHQiOiAiT2JyYXoiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRXhwYW5kIEltYWdlIiwKICAgICAgImRlZmF1bHQiOiAiRXhwYW5kIEltYWdlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk1pbmltaXplIEltYWdlIiwKICAgICAgImRlZmF1bHQiOiAiTWluaW1pemUgSW1hZ2UiCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Image-1.1\/language\/pt-br.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbWFnZW0iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQXBlbmFzIGRlY29yYXRpdm8iLAogICAgICAiZGVzY3JpcHRpb24iOiAiQXRpdmUgZXN0YSBvcMOnw6NvIHNlIGEgaW1hZ2VtIGZvciBwdXJhbWVudGUgZGVjb3JhdGl2YSBlIG7Do28gYWNyZXNjZW50YXIgbmVuaHVtYSBpbmZvcm1hw6fDo28gYW8gY29udGXDumRvIGRhIHDDoWdpbmEuIEVsYSBzZXLDoSBpZ25vcmFkYSBwZWxvcyBsZWl0b3JlcyBkZSB0ZWxhIGUgbsOjbyByZWNlYmVyw6EgbmVuaHVtIHRleHRvIGFsdGVybmF0aXZvLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBhbHRlcm5hdGl2byIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJPYnJpZ2F0w7NyaW8uIFNlIG8gbmF2ZWdhZG9yIG7Do28gZm9yIGNhcGF6IGRlIGV4aWJpciBhIGltYWdlbSwgZXN0ZSB0ZXh0byBzZXLDoSBleGliaWRvLiBUYW1iw6ltIHV0aWxpemFkbyBwb3IgbGVpdG9yZXMgZGUgdGVsYS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gZmx1dHVhbnRlIiwKICAgICAgImRlc2NyaXB0aW9uIjogIk9wY2lvbmFsLiBFc3RlIHRleHRvIHNlcsOhIGV4aWJpZG8gc2UgbyB1c3XDoXJpbyBwYXNzYXIgbyBwb250ZWlybyBkbyBtb3VzZSBzb2JyZSBhIGltYWdlbS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTm9tZSBkbyBjb250ZcO6ZG8gZGUgaW1hZ2VtIiwKICAgICAgImRlZmF1bHQiOiAiSW1hZ2VtIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkV4cGFuZCBJbWFnZSIsCiAgICAgICJkZWZhdWx0IjogIkV4cGFuZCBJbWFnZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJNaW5pbWl6ZSBJbWFnZSIsCiAgICAgICJkZWZhdWx0IjogIk1pbmltaXplIEltYWdlIgogICAgfQogIF0KfQo="],"libraries\/H5P.Image-1.1\/language\/pt.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbWFnZW0iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQXBlbmFzIGRlY29yYXRpdmEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiU2VsZWNpb25hciBlc3RhIG9ww6fDo28gc2UgYSBpbWFnZW0gZm9yIGFwZW5hcyBkZWNvcmF0aXZhIGUgbsOjbyBhY3Jlc2NlbnRhciBxdWFscXVlciBpbmZvcm1hw6fDo28gYW8gY29udGXDumRvIGRhIHDDoWdpbmEuIFNlcsOhIGFzc2ltIGlnbm9yYWRhIHBlbG9zIGxlaXRvcmVzIGRlIGVjcsOjLCBlIG7Do28gbGhlIHNlcsOhIGF0cmlidcOtZG8gdW0gdGV4dG8gYWx0ZXJuYXRpdm8uLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBhbHRlcm5hdGl2byIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJPYnJpZ2F0w7NyaW8uIFNlIG8gbmF2ZWdhZG9yIG7Do28gcHVkZXIgY2FycmVnYXIgYSBpbWFnZW0sIHNlcsOhIG1vc3RyYWRvIGVzdGUgdGV4dG8uIFRhbWLDqW0gw6kgdXNhZG8gcG9yIGxlaXRvcmVzIGRlIFwidGV4dG8gcGFyYSB2b3pcIi4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUGFzc2FyIHJhdG8gcGVsbyB0ZXh0byIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJPcGNpb25hbC4gRXN0ZSB0ZXh0byDDqSBleGliaWRvIHF1YW5kbyBvcyB1dGlsaXphZG9yZXMgcGFzc2FtIG8gcmF0byBzb2JyZSBhIGltYWdlbS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTm9tZSBkbyBjb250ZcO6ZG8gZGEgaW1hZ2VtIiwKICAgICAgImRlZmF1bHQiOiAiSW1hZ2VtIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkV4cGFuZCBJbWFnZSIsCiAgICAgICJkZWZhdWx0IjogIkV4cGFuZCBJbWFnZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJNaW5pbWl6ZSBJbWFnZSIsCiAgICAgICJkZWZhdWx0IjogIk1pbmltaXplIEltYWdlIgogICAgfQogIF0KfQo="],"libraries\/H5P.Image-1.1\/language\/ro.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbWFnZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZWNvcmF0aXZlIG9ubHkiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRW5hYmxlIHRoaXMgb3B0aW9uIGlmIHRoZSBpbWFnZSBpcyBwdXJlbHkgZGVjb3JhdGl2ZSBhbmQgZG9lcyBub3QgYWRkIGFueSBpbmZvcm1hdGlvbiB0byB0aGUgY29udGVudCBvbiB0aGUgcGFnZS4gSXQgd2lsbCBiZSBpZ25vcmVkIGJ5IHNjcmVlbiByZWFkZXJzIGFuZCBub3QgZ2l2ZW4gYW55IGFsdGVybmF0aXZlIHRleHQuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFsdGVybmF0aXZlIHRleHQiLAogICAgICAiZGVzY3JpcHRpb24iOiAiUmVxdWlyZWQuIElmIHRoZSBicm93c2VyIGNhbid0IGxvYWQgdGhlIGltYWdlIHRoaXMgdGV4dCB3aWxsIGJlIGRpc3BsYXllZCBpbnN0ZWFkLiBBbHNvIHVzZWQgYnkgXCJ0ZXh0LXRvLXNwZWVjaFwiIHJlYWRlcnMuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkhvdmVyIHRleHQiLAogICAgICAiZGVzY3JpcHRpb24iOiAiT3B0aW9uYWwuIFRoaXMgdGV4dCBpcyBkaXNwbGF5ZWQgd2hlbiB0aGUgdXNlcnMgaG92ZXIgdGhlaXIgcG9pbnRpbmcgZGV2aWNlIG92ZXIgdGhlIGltYWdlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbWFnZSBjb250ZW50IG5hbWUiLAogICAgICAiZGVmYXVsdCI6ICJJbWFnZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFeHBhbmQgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJFeHBhbmQgSW1hZ2UiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWluaW1pemUgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJNaW5pbWl6ZSBJbWFnZSIKICAgIH0KICBdCn0K"],"libraries\/H5P.Image-1.1\/language\/ru.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLQmNC30L7QsdGA0LDQttC10L3QuNC1IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkRlY29yYXRpdmUgb25seSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJFbmFibGUgdGhpcyBvcHRpb24gaWYgdGhlIGltYWdlIGlzIHB1cmVseSBkZWNvcmF0aXZlIGFuZCBkb2VzIG5vdCBhZGQgYW55IGluZm9ybWF0aW9uIHRvIHRoZSBjb250ZW50IG9uIHRoZSBwYWdlLiBJdCB3aWxsIGJlIGlnbm9yZWQgYnkgc2NyZWVuIHJlYWRlcnMgYW5kIG5vdCBnaXZlbiBhbnkgYWx0ZXJuYXRpdmUgdGV4dC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0JDQu9GM0YLQtdGA0L3QsNGC0LjQstC90YvQuSDRgtC10LrRgdGCIiwKICAgICAgImRlc2NyaXB0aW9uIjogItCe0LHRj9C30LDRgtC10LvRjNC90YvQuS4g0JXRgdC70Lgg0LHRgNCw0YPQt9C10YAg0L3QtSDQvNC+0LbQtdGCINC30LDQs9GA0YPQt9C40YLRjCDQuNC30L7QsdGA0LDQttC10L3QuNC1LCDRjdGC0L7RgiDRgtC10LrRgdGCINCx0YPQtNC10YIg0L7RgtC+0LHRgNCw0LbQsNGC0YzRgdGPINCy0LzQtdGB0YLQviDQvdC10LPQvi4g0KLQsNC60LbQtSDQuNGB0L\/QvtC70YzQt9GD0LXRgtGB0Y8gXCLQvtC30LLRg9GH0LrQvtC5INGC0LXQutGB0YLQsFwiLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC\/0YDQuCDQvdCw0LLQtdC00LXQvdC40LgiLAogICAgICAiZGVzY3JpcHRpb24iOiAi0J\/QviDQttC10LvQsNC90LjRji4g0K3RgtC+0YIg0YLQtdC60YHRgiDQvtGC0L7QsdGA0LDQttCw0LXRgtGB0Y8sINC60L7Qs9C00LAg0L\/QvtC70YzQt9C+0LLQsNGC0LXQu9C4INC90LDQstC+0LTRj9GCINGD0LrQsNC30LDRgtC10LvRjCDQvNGL0YjQuCDQvdCwINC40LfQvtCx0YDQsNC20LXQvdC40LUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCd0LDQt9Cy0LDQvdC40LUg0YHQvtC00LXRgNC20LjQvNC+0LPQviDQuNC30L7QsdGA0LDQttC10L3QuNGPIiwKICAgICAgImRlZmF1bHQiOiAi0JjQt9C+0LHRgNCw0LbQtdC90LjQtSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFeHBhbmQgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJFeHBhbmQgSW1hZ2UiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWluaW1pemUgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJNaW5pbWl6ZSBJbWFnZSIKICAgIH0KICBdCn0K"],"libraries\/H5P.Image-1.1\/language\/sl.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJTbGlrYSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJPem5hxI1pIGtvdCBkZWtvcmF0aXZubyIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJPem5ha2Egb3ByZWRlbGp1amUgc2xpa28ga290IG9rcmFzbm8sIGtpIG5lIGRvZGFqYSB2c2ViaW5za2loIGluZm9ybWFjaWouIEJyYWxuaWsgemFzbG9uYSBqbyBsYWhrbyB6YXRvIHByZXpyZSBpbiBuZSBwb3NyZWR1amVqbyBhbHRlcm5hdGl2bmVnYSBiZXNlZGlsYS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTmFkb21lc3RubyBiZXNlZGlsbyIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJaYWh0ZXZhbm8uIEJlc2VkaWxvIHNlIHByaWthxb5lLCDEjWUgc3BsZXRuaSBicnNrYWxuaWsgbmUgbW9yZSBuYWxvxb5pdGkgc2xpa2UuIEJlc2VkaWxvIHVwb3JhYmxqYWpvIHR1ZGkgXCJzaW50ZXRpemF0b3JqaSBnb3ZvcmFcIiAodGV4dC10by1zcGVlY2ggcmVhZGVycykuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkJlc2VkaWxvIG9iIHByZWxldHUgbWnFoWtlIiwKICAgICAgImRlc2NyaXB0aW9uIjogIk5lb2J2ZXpuby4gQmVzZWRpbG8gc2UgcHJpa2HFvmUsIGtvIHVwb3JhYm5payBzbGlrbyBwcmVsZXRpIHMga2F6YWxjZW0gbWnFoWtlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJOYXNsb3YgdnNlYmluZSBzbGlrZSIsCiAgICAgICJkZWZhdWx0IjogIlNsaWthIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkV4cGFuZCBJbWFnZSIsCiAgICAgICJkZWZhdWx0IjogIkV4cGFuZCBJbWFnZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJNaW5pbWl6ZSBJbWFnZSIsCiAgICAgICJkZWZhdWx0IjogIk1pbmltaXplIEltYWdlIgogICAgfQogIF0KfQo="],"libraries\/H5P.Image-1.1\/language\/sma.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbWFnZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZWNvcmF0aXZlIG9ubHkiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRW5hYmxlIHRoaXMgb3B0aW9uIGlmIHRoZSBpbWFnZSBpcyBwdXJlbHkgZGVjb3JhdGl2ZSBhbmQgZG9lcyBub3QgYWRkIGFueSBpbmZvcm1hdGlvbiB0byB0aGUgY29udGVudCBvbiB0aGUgcGFnZS4gSXQgd2lsbCBiZSBpZ25vcmVkIGJ5IHNjcmVlbiByZWFkZXJzIGFuZCBub3QgZ2l2ZW4gYW55IGFsdGVybmF0aXZlIHRleHQuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFsdGVybmF0aXZlIHRleHQiLAogICAgICAiZGVzY3JpcHRpb24iOiAiUmVxdWlyZWQuIElmIHRoZSBicm93c2VyIGNhbid0IGxvYWQgdGhlIGltYWdlIHRoaXMgdGV4dCB3aWxsIGJlIGRpc3BsYXllZCBpbnN0ZWFkLiBBbHNvIHVzZWQgYnkgXCJ0ZXh0LXRvLXNwZWVjaFwiIHJlYWRlcnMuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkhvdmVyIHRleHQiLAogICAgICAiZGVzY3JpcHRpb24iOiAiT3B0aW9uYWwuIFRoaXMgdGV4dCBpcyBkaXNwbGF5ZWQgd2hlbiB0aGUgdXNlcnMgaG92ZXIgdGhlaXIgcG9pbnRpbmcgZGV2aWNlIG92ZXIgdGhlIGltYWdlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbWFnZSBjb250ZW50IG5hbWUiLAogICAgICAiZGVmYXVsdCI6ICJJbWFnZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFeHBhbmQgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJFeHBhbmQgSW1hZ2UiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWluaW1pemUgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJNaW5pbWl6ZSBJbWFnZSIKICAgIH0KICBdCn0K"],"libraries\/H5P.Image-1.1\/language\/sme.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbWFnZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZWNvcmF0aXZlIG9ubHkiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRW5hYmxlIHRoaXMgb3B0aW9uIGlmIHRoZSBpbWFnZSBpcyBwdXJlbHkgZGVjb3JhdGl2ZSBhbmQgZG9lcyBub3QgYWRkIGFueSBpbmZvcm1hdGlvbiB0byB0aGUgY29udGVudCBvbiB0aGUgcGFnZS4gSXQgd2lsbCBiZSBpZ25vcmVkIGJ5IHNjcmVlbiByZWFkZXJzIGFuZCBub3QgZ2l2ZW4gYW55IGFsdGVybmF0aXZlIHRleHQuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFsdGVybmF0aXZlIHRleHQiLAogICAgICAiZGVzY3JpcHRpb24iOiAiUmVxdWlyZWQuIElmIHRoZSBicm93c2VyIGNhbid0IGxvYWQgdGhlIGltYWdlIHRoaXMgdGV4dCB3aWxsIGJlIGRpc3BsYXllZCBpbnN0ZWFkLiBBbHNvIHVzZWQgYnkgXCJ0ZXh0LXRvLXNwZWVjaFwiIHJlYWRlcnMuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkhvdmVyIHRleHQiLAogICAgICAiZGVzY3JpcHRpb24iOiAiT3B0aW9uYWwuIFRoaXMgdGV4dCBpcyBkaXNwbGF5ZWQgd2hlbiB0aGUgdXNlcnMgaG92ZXIgdGhlaXIgcG9pbnRpbmcgZGV2aWNlIG92ZXIgdGhlIGltYWdlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbWFnZSBjb250ZW50IG5hbWUiLAogICAgICAiZGVmYXVsdCI6ICJJbWFnZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFeHBhbmQgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJFeHBhbmQgSW1hZ2UiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWluaW1pemUgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJNaW5pbWl6ZSBJbWFnZSIKICAgIH0KICBdCn0K"],"libraries\/H5P.Image-1.1\/language\/smj.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbWFnZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZWNvcmF0aXZlIG9ubHkiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRW5hYmxlIHRoaXMgb3B0aW9uIGlmIHRoZSBpbWFnZSBpcyBwdXJlbHkgZGVjb3JhdGl2ZSBhbmQgZG9lcyBub3QgYWRkIGFueSBpbmZvcm1hdGlvbiB0byB0aGUgY29udGVudCBvbiB0aGUgcGFnZS4gSXQgd2lsbCBiZSBpZ25vcmVkIGJ5IHNjcmVlbiByZWFkZXJzIGFuZCBub3QgZ2l2ZW4gYW55IGFsdGVybmF0aXZlIHRleHQuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFsdGVybmF0aXZlIHRleHQiLAogICAgICAiZGVzY3JpcHRpb24iOiAiUmVxdWlyZWQuIElmIHRoZSBicm93c2VyIGNhbid0IGxvYWQgdGhlIGltYWdlIHRoaXMgdGV4dCB3aWxsIGJlIGRpc3BsYXllZCBpbnN0ZWFkLiBBbHNvIHVzZWQgYnkgXCJ0ZXh0LXRvLXNwZWVjaFwiIHJlYWRlcnMuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkhvdmVyIHRleHQiLAogICAgICAiZGVzY3JpcHRpb24iOiAiT3B0aW9uYWwuIFRoaXMgdGV4dCBpcyBkaXNwbGF5ZWQgd2hlbiB0aGUgdXNlcnMgaG92ZXIgdGhlaXIgcG9pbnRpbmcgZGV2aWNlIG92ZXIgdGhlIGltYWdlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbWFnZSBjb250ZW50IG5hbWUiLAogICAgICAiZGVmYXVsdCI6ICJJbWFnZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFeHBhbmQgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJFeHBhbmQgSW1hZ2UiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWluaW1pemUgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJNaW5pbWl6ZSBJbWFnZSIKICAgIH0KICBdCn0K"],"libraries\/H5P.Image-1.1\/language\/sr.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbWFnZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZWNvcmF0aXZlIG9ubHkiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRW5hYmxlIHRoaXMgb3B0aW9uIGlmIHRoZSBpbWFnZSBpcyBwdXJlbHkgZGVjb3JhdGl2ZSBhbmQgZG9lcyBub3QgYWRkIGFueSBpbmZvcm1hdGlvbiB0byB0aGUgY29udGVudCBvbiB0aGUgcGFnZS4gSXQgd2lsbCBiZSBpZ25vcmVkIGJ5IHNjcmVlbiByZWFkZXJzIGFuZCBub3QgZ2l2ZW4gYW55IGFsdGVybmF0aXZlIHRleHQuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFsdGVybmF0aXZlIHRleHQiLAogICAgICAiZGVzY3JpcHRpb24iOiAiUmVxdWlyZWQuIElmIHRoZSBicm93c2VyIGNhbid0IGxvYWQgdGhlIGltYWdlIHRoaXMgdGV4dCB3aWxsIGJlIGRpc3BsYXllZCBpbnN0ZWFkLiBBbHNvIHVzZWQgYnkgXCJ0ZXh0LXRvLXNwZWVjaFwiIHJlYWRlcnMuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkhvdmVyIHRleHQiLAogICAgICAiZGVzY3JpcHRpb24iOiAiT3B0aW9uYWwuIFRoaXMgdGV4dCBpcyBkaXNwbGF5ZWQgd2hlbiB0aGUgdXNlcnMgaG92ZXIgdGhlaXIgcG9pbnRpbmcgZGV2aWNlIG92ZXIgdGhlIGltYWdlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbWFnZSBjb250ZW50IG5hbWUiLAogICAgICAiZGVmYXVsdCI6ICJJbWFnZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFeHBhbmQgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJFeHBhbmQgSW1hZ2UiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWluaW1pemUgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJNaW5pbWl6ZSBJbWFnZSIKICAgIH0KICBdCn0K"],"libraries\/H5P.Image-1.1\/language\/sv.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJCaWxkIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkVuYmFydCBkZWtvcmF0aXYiLAogICAgICAiZGVzY3JpcHRpb24iOiAiQWt0aXZlcmEgZGVubmEgaW5zdMOkbGxuaW5nIG9tIGJpbGRlbiDDpHIgcmVub2RsYXQgZGVrb3JhdGl2LCBvY2ggaW50ZSBpbm5laMOlbGxlciBuw6Vnb24gYmV0eWRlbHNlYsOkcmFuZGUgaW5mb3JtYXRpb24uIEJpbGRlbiBrb21tZXIgZMOlIGF0dCBpZ25vcmVyYXMgYXYgc2vDpHJtbMOkc2FyZSBvY2ggaW50ZSBnZXMgbsOlZ29uIGFsdGVybmF0aXYgdGV4dC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQWx0ZXJuYXRpdiB0ZXh0IiwKICAgICAgImRlc2NyaXB0aW9uIjogIk9ibGlnYXRvcmlzay4gT20gYmlsZGVuIGludGUga2FuIGxhZGRhcyBpIGFudsOkbmRhcmVucyB3ZWJibMOkc2FyZSBzw6Uga29tbWVyIGRlbm5hIHRleHQgdmlzYXMgaXN0w6RsbGV0LiBBbnbDpG5kcyBvY2tzw6UgYXYgXCJza8Okcm1sw6RzYXJlXCIuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgdmlkIGhvdnJpbmciLAogICAgICAiZGVzY3JpcHRpb24iOiAiVmFsZnJpLiBEZW5uYSB0ZXh0IHZpc2FzIG9tIGFudsOkbmRhcmVuIHBsYWNlcmFyIHNpbiBtYXJrw7ZyIChob3ZyYXIpIMO2dmVyIGJpbGRlbi4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTmFtbiBww6UgYmlsZGlubmVow6VsbCIsCiAgICAgICJkZWZhdWx0IjogIkJpbGQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRXhwYW5kZXJhIGJpbGQiLAogICAgICAiZGVmYXVsdCI6ICJFeHBhbmRlcmEgYmlsZCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJNaW5pbWVyYSBiaWxkIiwKICAgICAgImRlZmF1bHQiOiAiTWluaW1lcmEgYmlsZCIKICAgIH0KICBdCn0K"],"libraries\/H5P.Image-1.1\/language\/sw.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJQaWNoYSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJNYXBhbWJvIHR1IiwKICAgICAgImRlc2NyaXB0aW9uIjogIldhc2hhIGNoYWd1byBoaWxpIGlraXdhIHBpY2hhIG5pIHlhIG1hcGFtYm8gdHUgbmEgaGFpb25nZXppIGhhYmFyaSB5b3lvdGUga3dhIG1hdWRodWkga3dlbnllIHVrdXJhc2EuIEl0YXB1dXp3YSBuYSB2aXNvbWEgc2tyaW5pIG5hIGhhaXRhcGV3YSBtYWFuZGlzaGkgeW95b3RlIG1iYWRhbGEuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk1hYW5kaXNoaSBtYmFkYWxhIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkluYWhpdGFqaWthLiBJa2l3YSBraXZpbmphcmkgaGFraXdlemkga3VwYWtpYSBwaWNoYSwgbWFhbmRpc2hpIGhheWEgeWF0YW9ueWVzaHdhIGJhZGFsYSB5YWtlLiBJbmF0dW1pa2EgcGlhIG5hIHZpc29tYWppIOKAnG1hYW5kaXNoaS1rd2EtaG90dWJh4oCdLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJNYWFuZGlzaGkgeWEganV1IiwKICAgICAgImRlc2NyaXB0aW9uIjogIllhIGhpYXJpLiBNYWFuZGlzaGkgaGF5YSB5YW5hb255ZXNod2Egd2FrYXRpIHdhdHVtaWFqaSB3YW5hZWxlYSBraWZhYSBjaGFvIGNoYSBrdWVsZWtlemEganV1IHlhIHBpY2hhLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJKaW5hIGxhIG1hdWRodWkgeWEgcGljaGEiLAogICAgICAiZGVmYXVsdCI6ICJQaWNoYSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFeHBhbmQgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJFeHBhbmQgSW1hZ2UiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWluaW1pemUgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJNaW5pbWl6ZSBJbWFnZSIKICAgIH0KICBdCn0K"],"libraries\/H5P.Image-1.1\/language\/th.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLguKPguLnguJvguKDguLLguJ4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4Liq4Liz4Lir4Lij4Lix4Lia4LiV4LiB4LmB4LiV4LmI4LiH4LmA4LiX4LmI4Liy4LiZ4Lix4LmJ4LiZIiwKICAgICAgImRlc2NyaXB0aW9uIjogIuC5gOC4m+C4tOC4lOC5g+C4iuC5ieC4h+C4suC4meC4leC4seC4p+C5gOC4peC4t+C4reC4geC4meC4teC5ieC4q+C4suC4geC4o+C4ueC4m+C4oOC4suC4nuC4oeC4teC5gOC4nuC4teC4ouC4h+C5gOC4m+C5h+C4meC4geC4suC4o+C4leC4geC5geC4leC5iOC4h+C5gOC4l+C5iOC4suC4meC4seC5ieC4meC5geC4peC4sOC5hOC4oeC5iOC4oeC4teC4guC5ieC4reC4oeC4ueC4peC4l+C4teC5iOC5gOC4nuC4tOC5iOC4oeC5gOC4leC4tOC4oeC5g+C4meC5gOC4meC4t+C5ieC4reC4q+C4suC4muC4meC4q+C4meC5ieC4suC5gOC4p+C5h+C4miDguKHguLHguJnguIjguLDguJbguLnguIHguKXguLDguYDguKXguKLguYLguJTguKLguKrguYjguKfguJnguILguKLguLLguKLguKvguJnguYnguLLguIjguK3guYHguKXguLDguYTguKHguYjguYTguJTguYnguKPguLHguJrguILguYnguK3guITguKfguLLguKHguYDguJvguYfguJnguJXguLHguKfguYDguKXguLfguK3guIHguJfguJTguYHguJfguJnguYPguJQg4LmGIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuC4guC5ieC4reC4hOC4p+C4suC4oeC4l+C4lOC5geC4l+C4mSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLguIjguLPguYDguJvguYfguJnguJXguYnguK3guIfguKPguLDguJrguLgg4LmA4Lih4Li34LmI4Lit4LmA4Lia4Lij4Liy4Lin4LmM4LmA4LiL4Lit4Lij4LmM4LmE4Lih4LmI4Liq4Liy4Lih4Liy4Lij4LiW4LmC4Lir4Lil4LiU4Lij4Li54Lib4Lig4Liy4Lie4LmE4LiU4LmJIOC4guC5ieC4reC4hOC4p+C4suC4oeC4meC4teC5ieC4iOC4sOC4luC4ueC4geC5geC4quC4lOC4h+C5geC4l+C4mSDguJnguK3guIHguIjguLLguIHguJnguLXguYnguKLguLHguIfguYPguIrguYnguIHguLHguJrguK3guYjguLLguJnguILguYnguK3guITguKfguLLguKHguYLguJTguKLguK3guYjguLLguJnguILguYnguK3guITguKfguLLguKHguJXguYjguK3guYDguJnguLfguYjguK3guIciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LmA4Lih4Li34LmI4Lit4Lin4Liy4LiH4LmA4Lih4Liy4Liq4LmMIiwKICAgICAgImRlc2NyaXB0aW9uIjogIuC4leC4seC4p+C5gOC4peC4t+C4reC4geC4l+C4teC5iOC5hOC4oeC5iOC4iOC4s+C5gOC4m+C5h+C4mSDguILguYnguK3guITguKfguLLguKHguJnguLXguYnguIjguLDguJvguKPguLLguIHguI\/guYDguKHguLfguYjguK3guJzguLnguYnguYPguIrguYnguKfguLLguIfguYDguKHguLLguKrguYzguILguK3guIfguJ7guKfguIHguYDguILguLLguYTguJvguJfguLXguYjguKPguLnguJvguKDguLLguJ4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4LiK4Li34LmI4Lit4LmA4LiZ4Li34LmJ4Lit4Lir4Liy4LiC4Lit4LiH4Lij4Li54Lib4Lig4Liy4LieIiwKICAgICAgImRlZmF1bHQiOiAi4Lij4Li54Lib4Lig4Liy4LieIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuC4guC4ouC4suC4ouC4oOC4suC4niIsCiAgICAgICJkZWZhdWx0IjogIuC4guC4ouC4suC4ouC4oOC4suC4niIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLguKLguYjguK3guKDguLLguJ4iLAogICAgICAiZGVmYXVsdCI6ICLguKLguYjguK3guKDguLLguJ4iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Image-1.1\/language\/tr.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJSZXNpbSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZWNvcmF0aXZlIG9ubHkiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRW5hYmxlIHRoaXMgb3B0aW9uIGlmIHRoZSBpbWFnZSBpcyBwdXJlbHkgZGVjb3JhdGl2ZSBhbmQgZG9lcyBub3QgYWRkIGFueSBpbmZvcm1hdGlvbiB0byB0aGUgY29udGVudCBvbiB0aGUgcGFnZS4gSXQgd2lsbCBiZSBpZ25vcmVkIGJ5IHNjcmVlbiByZWFkZXJzIGFuZCBub3QgZ2l2ZW4gYW55IGFsdGVybmF0aXZlIHRleHQuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFsdCBtZXRpbiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJHZXJla2xpIGFsYW4uIFRhcmF5xLFjxLEgcmVzbWkgecO8a2xleWVtZXpzZSwgYnVudW4geWVyaW5lIGJ1IG1ldGluIGfDtnLDvG50w7xsZW5lY2VrdGlyLiBBeXLEsWNhIFwia29udcWfbWEgc2VudGV6bGV5aWNpbGVyXCIgdGFyYWbEsW5kYW4gZGEga3VsbGFuxLFsxLFyLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJGYXJlIGltbGVjaSB0YW7EsXTEsW0gbWV0bmkiLAogICAgICAiZGVzY3JpcHRpb24iOiAixLBzdGXEn2UgYmHEn2zEsSBhbGFuLiBCdSBtZXRpbiwga3VsbGFuxLFjxLFsYXIgZmFyZSBpbWxlY2luaSByZXNtaW4gw7x6ZXJpbmUgZ2V0aXJkacSfaW5kZSBnw7Zyw7xudMO8bGVuaXIuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlJlc2ltIGnDp2VyaWsgYWTEsSIsCiAgICAgICJkZWZhdWx0IjogIlJlc2ltIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkV4cGFuZCBJbWFnZSIsCiAgICAgICJkZWZhdWx0IjogIkV4cGFuZCBJbWFnZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJNaW5pbWl6ZSBJbWFnZSIsCiAgICAgICJkZWZhdWx0IjogIk1pbmltaXplIEltYWdlIgogICAgfQogIF0KfQo="],"libraries\/H5P.Image-1.1\/language\/uk.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLQl9C+0LHRgNCw0LbQtdC90L3RjyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQlNC10LrQvtGA0LDRgtC40LLQvdC1INC30L7QsdGA0LDQttC10L3QvdGPIiwKICAgICAgImRlc2NyaXB0aW9uIjogItCS0LjQsdC10YDRltGC0Ywg0YbQtdC5INC\/0LDRgNCw0LzQtdGC0YAsINGP0LrRidC+INC30L7QsdGA0LDQttC10L3QvdGPINGUINCy0LjQutC70Y7Rh9C90L4g0LTQtdC60L7RgNCw0YLQuNCy0L3QuNC8INGWINC90LUg0LTQvtC00LDRlCDQttC+0LTQvdC+0Zcg0ZbQvdGE0L7RgNC80LDRhtGW0Zcg0LTQviDQstC80ZbRgdGC0YMg0YHRgtC+0YDRltC90LrQuC4g0JLRltC9INGW0LPQvdC+0YDRg9GU0YLRjNGB0Y8g0ZbQvdGB0YLRgNGD0LzQtdC90YLQsNC80Lgg0YfQuNGC0LDQvdC90Y8g0YLQsCDQvdC1INC+0YLRgNC40LzRg9GUINCw0LvRjNGC0LXRgNC90LDRgtC40LLQvdC40Lkg0YLQtdC60YHRgi4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0JDQu9GM0YLQtdGA0L3QsNGC0LjQstC90LjQuSDRgtC10LrRgdGCIiwKICAgICAgImRlc2NyaXB0aW9uIjogItCe0LHQvtCyJ9GP0LfQutC+0LLQuNC5LiDQr9C60YnQviDQsdGA0LDRg9C30LXRgCDQvdC1INC80L7QttC1INC30LDQstCw0L3RgtCw0LbQuNGC0Lgg0LfQvtCx0YDQsNC20LXQvdC90Y8sINGG0LXQuSDRgtC10LrRgdGCINCx0YPQtNC1INCy0ZbQtNC+0LHRgNCw0LbQsNGC0LjRgdGMINC30LDQvNGW0YHRgtGMINC90YzQvtCz0L4uINCi0LDQutC+0LYg0LLQuNC60L7RgNC40YHRgtC+0LLRg9GU0YLRjNGB0Y8g0LTQu9GPIFwi0L7Qt9Cy0YPRh9C10L3QvdGPINGC0LXQutGB0YLRg1wiLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC\/0ZbQtCDRh9Cw0YEg0L3QsNCy0LXQtNC10L3QvdGPIiwKICAgICAgImRlc2NyaXB0aW9uIjogItCX0LAg0LHQsNC20LDQvdC90Y\/QvC4g0KbQtdC5INGC0LXQutGB0YIg0LLRltC00L7QsdGA0LDQttCw0ZTRgtGM0YHRjywg0LrQvtC70Lgg0LrQvtGA0LjRgdGC0YPQstCw0YfRliDQvdCw0LLQvtC00Y\/RgtGMINCy0LrQsNC30ZbQstC90LjQuiDQvdCwINC30L7QsdGA0LDQttC10L3QvdGPLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQndCw0LfQstCwINCy0LzRltGB0YLRgyDQt9C+0LHRgNCw0LbQtdC90L3RjyIsCiAgICAgICJkZWZhdWx0IjogItCX0L7QsdGA0LDQttC10L3QvdGPIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkV4cGFuZCBJbWFnZSIsCiAgICAgICJkZWZhdWx0IjogIkV4cGFuZCBJbWFnZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJNaW5pbWl6ZSBJbWFnZSIsCiAgICAgICJkZWZhdWx0IjogIk1pbmltaXplIEltYWdlIgogICAgfQogIF0KfQo="],"libraries\/H5P.Image-1.1\/language\/vi.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJIw6xuaCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZWNvcmF0aXZlIG9ubHkiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRW5hYmxlIHRoaXMgb3B0aW9uIGlmIHRoZSBpbWFnZSBpcyBwdXJlbHkgZGVjb3JhdGl2ZSBhbmQgZG9lcyBub3QgYWRkIGFueSBpbmZvcm1hdGlvbiB0byB0aGUgY29udGVudCBvbiB0aGUgcGFnZS4gSXQgd2lsbCBiZSBpZ25vcmVkIGJ5IHNjcmVlbiByZWFkZXJzIGFuZCBub3QgZ2l2ZW4gYW55IGFsdGVybmF0aXZlIHRleHQuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFsdGVybmF0aXZlIHRleHQiLAogICAgICAiZGVzY3JpcHRpb24iOiAiUmVxdWlyZWQuIElmIHRoZSBicm93c2VyIGNhbid0IGxvYWQgdGhlIGltYWdlIHRoaXMgdGV4dCB3aWxsIGJlIGRpc3BsYXllZCBpbnN0ZWFkLiBBbHNvIHVzZWQgYnkgXCJ0ZXh0LXRvLXNwZWVjaFwiIHJlYWRlcnMuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkhvdmVyIHRleHQiLAogICAgICAiZGVzY3JpcHRpb24iOiAiT3B0aW9uYWwuIFRoaXMgdGV4dCBpcyBkaXNwbGF5ZWQgd2hlbiB0aGUgdXNlcnMgaG92ZXIgdGhlaXIgcG9pbnRpbmcgZGV2aWNlIG92ZXIgdGhlIGltYWdlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbWFnZSBjb250ZW50IG5hbWUiLAogICAgICAiZGVmYXVsdCI6ICJIw6xuaCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFeHBhbmQgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJFeHBhbmQgSW1hZ2UiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWluaW1pemUgSW1hZ2UiLAogICAgICAiZGVmYXVsdCI6ICJNaW5pbWl6ZSBJbWFnZSIKICAgIH0KICBdCn0K"],"libraries\/H5P.Image-1.1\/language\/zh-hans.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLlm77lg48iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRGVjb3JhdGl2ZSBvbmx5IiwKICAgICAgImRlc2NyaXB0aW9uIjogIkVuYWJsZSB0aGlzIG9wdGlvbiBpZiB0aGUgaW1hZ2UgaXMgcHVyZWx5IGRlY29yYXRpdmUgYW5kIGRvZXMgbm90IGFkZCBhbnkgaW5mb3JtYXRpb24gdG8gdGhlIGNvbnRlbnQgb24gdGhlIHBhZ2UuIEl0IHdpbGwgYmUgaWdub3JlZCBieSBzY3JlZW4gcmVhZGVycyBhbmQgbm90IGdpdmVuIGFueSBhbHRlcm5hdGl2ZSB0ZXh0LiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLmm7\/ku6PmloflrZciLAogICAgICAiZGVzY3JpcHRpb24iOiAi5b+F5aGr77yM5b2T5rWP6KeI5Zmo5peg5rOV6L295YWl5Zu+54mH5pe25Lya5pS55pi+56S65q2k5paH5a2X77yM5ZCM5pe26L+Z5Lmf5L2c5Li66KeG6Zqc6ICF6K+t6Z+z5biu5Yqp44CCIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuaCrOWBnOaXtuaWh+WtlyIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLpnZ7lv4XloavvvIzlvZPkvb\/nlKjogIXmgqzlgZzlnKjlm77lg4\/kuIrml7bpop3lpJbmmL7npLrnmoTmloflrZfjgIIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi5Zu+5YOP5ZCN56ewIiwKICAgICAgImRlZmF1bHQiOiAi5Zu+5YOPIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkV4cGFuZCBJbWFnZSIsCiAgICAgICJkZWZhdWx0IjogIkV4cGFuZCBJbWFnZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJNaW5pbWl6ZSBJbWFnZSIsCiAgICAgICJkZWZhdWx0IjogIk1pbmltaXplIEltYWdlIgogICAgfQogIF0KfQo="],"libraries\/H5P.Image-1.1\/language\/zh-hant.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLlnJblg48iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRGVjb3JhdGl2ZSBvbmx5IiwKICAgICAgImRlc2NyaXB0aW9uIjogIkVuYWJsZSB0aGlzIG9wdGlvbiBpZiB0aGUgaW1hZ2UgaXMgcHVyZWx5IGRlY29yYXRpdmUgYW5kIGRvZXMgbm90IGFkZCBhbnkgaW5mb3JtYXRpb24gdG8gdGhlIGNvbnRlbnQgb24gdGhlIHBhZ2UuIEl0IHdpbGwgYmUgaWdub3JlZCBieSBzY3JlZW4gcmVhZGVycyBhbmQgbm90IGdpdmVuIGFueSBhbHRlcm5hdGl2ZSB0ZXh0LiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLmm7\/ku6PmloflrZciLAogICAgICAiZGVzY3JpcHRpb24iOiAi5b+F5aGr77yM55W254CP6Ka95Zmo54Sh5rOV6LyJ5YWl5ZyW54mH5pmC5pyD5pS56aGv56S65q2k5paH5a2X77yM5ZCM5pmC6YCZ5Lmf5L2c54K66KaW6Zqc6ICF6Kqe6Z+z5bmr5Yqp44CCIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuaHuOWBnOaZguaWh+WtlyIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLpnZ7lv4XloavvvIznlbbkvb\/nlKjogIXmh7jlgZzlnKjlnJblg4\/kuIrmmYLpoY3lpJbpoa\/npLrnmoTmloflrZfjgIIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi5ZyW5YOP5ZCN56ixIiwKICAgICAgImRlZmF1bHQiOiAiSW1hZ2UiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRXhwYW5kIEltYWdlIiwKICAgICAgImRlZmF1bHQiOiAiRXhwYW5kIEltYWdlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk1pbmltaXplIEltYWdlIiwKICAgICAgImRlZmF1bHQiOiAiTWluaW1pemUgSW1hZ2UiCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.Image-1.1\/library.json":["application\/json","ewogICJ0aXRsZSI6ICJJbWFnZSIsCiAgImNvbnRlbnRUeXBlIjogIk1lZGlhIiwKICAiZGVzY3JpcHRpb24iOiAiU2ltcGxlIGxpYnJhcnkgdGhhdCBkaXNwbGF5cyBhbiBpbWFnZS4iLAogICJtYWpvclZlcnNpb24iOiAxLAogICJtaW5vclZlcnNpb24iOiAxLAogICJwYXRjaFZlcnNpb24iOiAyMiwKICAicnVubmFibGUiOiAwLAogICJtYWNoaW5lTmFtZSI6ICJINVAuSW1hZ2UiLAogICJhdXRob3IiOiAiSm91YmVsIiwKICAiY29yZUFwaSI6IHsKICAgICJtYWpvclZlcnNpb24iOiAxLAogICAgIm1pbm9yVmVyc2lvbiI6IDE5CiAgfSwKICAicHJlbG9hZGVkSnMiOiBbCiAgICB7CiAgICAgICJwYXRoIjogImltYWdlLmpzIgogICAgfQogIF0sCiAgInByZWxvYWRlZENzcyI6IFsKICAgIHsKICAgICAgInBhdGgiOiAiaW1hZ2UuY3NzIgogICAgfQogIF0sCiAgIm1ldGFkYXRhU2V0dGluZ3MiOiB7CiAgICAiZGlzYWJsZSI6IDAsCiAgICAiZGlzYWJsZUV4dHJhVGl0bGVGaWVsZCI6IDEKICB9LAogICJlZGl0b3JEZXBlbmRlbmNpZXMiOiBbCiAgICB7CiAgICAgICJtYWNoaW5lTmFtZSI6ICJINVBFZGl0b3IuU2hvd1doZW4iLAogICAgICAibWFqb3JWZXJzaW9uIjogMSwKICAgICAgIm1pbm9yVmVyc2lvbiI6IDAKICAgIH0KICBdCn0="],"libraries\/H5P.Image-1.1\/semantics.json":["application\/json","WwogIHsKICAgICJuYW1lIjogImZpbGUiLAogICAgInR5cGUiOiAiaW1hZ2UiLAogICAgImxhYmVsIjogIkltYWdlIiwKICAgICJpbXBvcnRhbmNlIjogImhpZ2giLAogICAgImRpc2FibGVDb3B5cmlnaHQiOiB0cnVlCiAgfSwKICB7CiAgICAibmFtZSI6ICJkZWNvcmF0aXZlIiwKICAgICJ0eXBlIjogImJvb2xlYW4iLAogICAgImxhYmVsIjogIkRlY29yYXRpdmUgb25seSIsCiAgICAiZGVmYXVsdCI6IGZhbHNlLAogICAgImRlc2NyaXB0aW9uIjogIkVuYWJsZSB0aGlzIG9wdGlvbiBpZiB0aGUgaW1hZ2UgaXMgcHVyZWx5IGRlY29yYXRpdmUgYW5kIGRvZXMgbm90IGFkZCBhbnkgaW5mb3JtYXRpb24gdG8gdGhlIGNvbnRlbnQgb24gdGhlIHBhZ2UuIEl0IHdpbGwgYmUgaWdub3JlZCBieSBzY3JlZW4gcmVhZGVycyBhbmQgbm90IGdpdmVuIGFueSBhbHRlcm5hdGl2ZSB0ZXh0LiIKICB9LAogIHsKICAgICJuYW1lIjogImFsdCIsCiAgICAidHlwZSI6ICJ0ZXh0IiwKICAgICJsYWJlbCI6ICJBbHRlcm5hdGl2ZSB0ZXh0IiwKICAgICJpbXBvcnRhbmNlIjogImhpZ2giLAogICAgImRlc2NyaXB0aW9uIjogIlJlcXVpcmVkLiBJZiB0aGUgYnJvd3NlciBjYW4ndCBsb2FkIHRoZSBpbWFnZSB0aGlzIHRleHQgd2lsbCBiZSBkaXNwbGF5ZWQgaW5zdGVhZC4gQWxzbyB1c2VkIGJ5IFwidGV4dC10by1zcGVlY2hcIiByZWFkZXJzLiIsCiAgICAid2lkZ2V0IjogInNob3dXaGVuIiwKICAgICJzaG93V2hlbiI6IHsKICAgICAgInJ1bGVzIjogWwogICAgICAgIHsKICAgICAgICAgICJmaWVsZCI6ICJkZWNvcmF0aXZlIiwKICAgICAgICAgICJlcXVhbHMiOiBmYWxzZQogICAgICAgIH0KICAgICAgXSwKICAgICAgIm51bGxXaGVuSGlkZGVuIjogdHJ1ZQogICAgfQogIH0sCiAgewogICAgIm5hbWUiOiAidGl0bGUiLAogICAgInR5cGUiOiAidGV4dCIsCiAgICAibGFiZWwiOiAiSG92ZXIgdGV4dCIsCiAgICAiaW1wb3J0YW5jZSI6ICJsb3ciLAogICAgImRlc2NyaXB0aW9uIjogIk9wdGlvbmFsLiBUaGlzIHRleHQgaXMgZGlzcGxheWVkIHdoZW4gdGhlIHVzZXJzIGhvdmVyIHRoZWlyIHBvaW50aW5nIGRldmljZSBvdmVyIHRoZSBpbWFnZS4iLAogICAgIm9wdGlvbmFsIjogdHJ1ZQogIH0sCiAgewogICAgIm5hbWUiOiAiY29udGVudE5hbWUiLAogICAgInR5cGUiOiAidGV4dCIsCiAgICAibGFiZWwiOiAiSW1hZ2UgY29udGVudCBuYW1lIiwKICAgICJpbXBvcnRhbmNlIjogImxvdyIsCiAgICAiY29tbW9uIjogdHJ1ZSwKICAgICJkZWZhdWx0IjogIkltYWdlIgogIH0sCiAgewogICAgIm5hbWUiOiAiZXhwYW5kSW1hZ2UiLAogICAgInR5cGUiOiAidGV4dCIsCiAgICAibGFiZWwiOiAiRXhwYW5kIEltYWdlIiwKICAgICJpbXBvcnRhbmNlIjogImxvdyIsCiAgICAiY29tbW9uIjogdHJ1ZSwKICAgICJkZWZhdWx0IjogIkV4cGFuZCBJbWFnZSIKICB9LAogIHsKICAgICJuYW1lIjogIm1pbmltaXplSW1hZ2UiLAogICAgInR5cGUiOiAidGV4dCIsCiAgICAibGFiZWwiOiAiTWluaW1pemUgSW1hZ2UiLAogICAgImltcG9ydGFuY2UiOiAibG93IiwKICAgICJjb21tb24iOiB0cnVlLAogICAgImRlZmF1bHQiOiAiTWluaW1pemUgSW1hZ2UiCiAgfQpdCg=="],"libraries\/H5P.JoubelUI-1.3\/library.json":["application\/json","ewogICJ0aXRsZSI6ICJKb3ViZWwgVUkiLAogICJjb250ZW50VHlwZSI6ICJVdGlsaXR5IiwKICAiZGVzY3JpcHRpb24iOiAiVUkgdXRpbGl0eSBsaWJyYXJ5IiwKICAibWFqb3JWZXJzaW9uIjogMSwKICAibWlub3JWZXJzaW9uIjogMywKICAicGF0Y2hWZXJzaW9uIjogMTksCiAgInJ1bm5hYmxlIjogMCwKICAiY29yZUFwaSI6IHsKICAgICJtYWpvclZlcnNpb24iOiAxLAogICAgIm1pbm9yVmVyc2lvbiI6IDMKICB9LAogICJtYWNoaW5lTmFtZSI6ICJINVAuSm91YmVsVUkiLAogICJhdXRob3IiOiAiSm91YmVsIiwKICAicHJlbG9hZGVkSnMiOiBbCiAgICB7CiAgICAgICJwYXRoIjogImpzL2pvdWJlbC1oZWxwLWRpYWxvZy5qcyIKICAgIH0sCiAgICB7CiAgICAgICJwYXRoIjogImpzL2pvdWJlbC1tZXNzYWdlLWRpYWxvZy5qcyIKICAgIH0sCiAgICB7CiAgICAgICJwYXRoIjogImpzL2pvdWJlbC1wcm9ncmVzcy1jaXJjbGUuanMiCiAgICB9LAogICAgewogICAgICAicGF0aCI6ICJqcy9qb3ViZWwtc2ltcGxlLXJvdW5kZWQtYnV0dG9uLmpzIgogICAgfSwKICAgIHsKICAgICAgInBhdGgiOiAianMvam91YmVsLXNwZWVjaC1idWJibGUuanMiCiAgICB9LAogICAgewogICAgICAicGF0aCI6ICJqcy9qb3ViZWwtdGhyb2JiZXIuanMiCiAgICB9LAogICAgewogICAgICAicGF0aCI6ICJqcy9qb3ViZWwtdGlwLmpzIgogICAgfSwKICAgIHsKICAgICAgInBhdGgiOiAianMvam91YmVsLXNsaWRlci5qcyIKICAgIH0sCiAgICB7CiAgICAgICJwYXRoIjogImpzL2pvdWJlbC1zY29yZS1iYXIuanMiCiAgICB9LAogICAgewogICAgICAicGF0aCI6ICJqcy9qb3ViZWwtcHJvZ3Jlc3NiYXIuanMiCiAgICB9LAogICAgewogICAgICAicGF0aCI6ICJqcy9qb3ViZWwtdWkuanMiCiAgICB9CiAgXSwKICAicHJlbG9hZGVkQ3NzIjogWwogICAgewogICAgICAicGF0aCI6ICJjc3Mvam91YmVsLWhlbHAtZGlhbG9nLmNzcyIKICAgIH0sCiAgICB7CiAgICAgICJwYXRoIjogImNzcy9qb3ViZWwtbWVzc2FnZS1kaWFsb2cuY3NzIgogICAgfSwKICAgIHsKICAgICAgInBhdGgiOiAiY3NzL2pvdWJlbC1wcm9ncmVzcy1jaXJjbGUuY3NzIgogICAgfSwKICAgIHsKICAgICAgInBhdGgiOiAiY3NzL2pvdWJlbC1zaW1wbGUtcm91bmRlZC1idXR0b24uY3NzIgogICAgfSwKICAgIHsKICAgICAgInBhdGgiOiAiY3NzL2pvdWJlbC1zcGVlY2gtYnViYmxlLmNzcyIKICAgIH0sCiAgICB7CiAgICAgICJwYXRoIjogImNzcy9qb3ViZWwtdGlwLmNzcyIKICAgIH0sCiAgICB7CiAgICAgICJwYXRoIjogImNzcy9qb3ViZWwtc2xpZGVyLmNzcyIKICAgIH0sCiAgICB7CiAgICAgICJwYXRoIjogImNzcy9qb3ViZWwtc2NvcmUtYmFyLmNzcyIKICAgIH0sCiAgICB7CiAgICAgICJwYXRoIjogImNzcy9qb3ViZWwtcHJvZ3Jlc3NiYXIuY3NzIgogICAgfSwKICAgIHsKICAgICAgInBhdGgiOiAiY3NzL2pvdWJlbC11aS5jc3MiCiAgICB9LAogICAgewogICAgICAicGF0aCI6ICJjc3Mvam91YmVsLWljb24uY3NzIgogICAgfQogIF0sCiAgInByZWxvYWRlZERlcGVuZGVuY2llcyI6IFsKICAgIHsKICAgICAgIm1hY2hpbmVOYW1lIjogIkZvbnRBd2Vzb21lIiwKICAgICAgIm1ham9yVmVyc2lvbiI6IDQsCiAgICAgICJtaW5vclZlcnNpb24iOiA1CiAgICB9LAogICAgewogICAgICAibWFjaGluZU5hbWUiOiAiSDVQLlRyYW5zaXRpb24iLAogICAgICAibWFqb3JWZXJzaW9uIjogMSwKICAgICAgIm1pbm9yVmVyc2lvbiI6IDAKICAgIH0sCiAgICB7CiAgICAgICJtYWNoaW5lTmFtZSI6ICJINVAuRm9udEljb25zIiwKICAgICAgIm1ham9yVmVyc2lvbiI6IDEsCiAgICAgICJtaW5vclZlcnNpb24iOiAwCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.MarkTheWords-1.11\/language\/af.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJNZWRpYSIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIlR5cGUiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9wdGlvbmFsIG1lZGlhIHRvIGRpc3BsYXkgYWJvdmUgdGhlIHF1ZXN0aW9uLiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJEaXNhYmxlIGltYWdlIHpvb21pbmciCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGFhayBiZXNrcnl3aW5nIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkJlc2tyeWYgaG9lIGRpZSBnZWJydWlrZXIgZGllIHRhYWsgbW9ldCBvcGxvcy4iLAogICAgICAicGxhY2Vob2xkZXIiOiAiS2xpayBvcCBhbCBkaWUgd2Vya3dvb3JkZSBpbiBkaWUgdGVrcyB3YXQgdm9sZy4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3ZlbGQiLAogICAgICAicGxhY2Vob2xkZXIiOiAiSGllcmRpZSBpcyAnbiBhbnR3b29yZDogKmFuc3dlciouIiwKICAgICAgImltcG9ydGFudCI6IHsKICAgICAgICAiZGVzY3JpcHRpb24iOiAiPHVsPjxsaT5HZW1lcmt0ZSB3b29yZGUgd29yZCBieWdldm9lZyBtZXQgJ24gc3RlcnJldGppZSAoKikuPC9saT48bGk+QXN0ZXJpc2tlIGthbiBieWdldm9lZyB3b3JkIGJpbm5lIHdvb3JkZSBkZXVyIG5vZyAnbiBhc3RlcmlzayBieSB0ZSB2b2VnLCAqY29ycmVjdHdvcmQqKiogPSZndDsgY29ycmVjdHdvcmQqLjwvbGk+PC91bD4iLAogICAgICAgICJleGFtcGxlIjogIlJlZ3RlIHdvb3JkZSB3b3JkIHNvb3MgZGl0IGdlc2tyeWY6ICpjb3JyZWN0d29yZCosICduIGFzdGVyaXNrIHdvcmQgc29vcyBkaXQgZ2Vza3J5ZjogKmNvcnJlY3R3b3JkKioqLiIKICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFsZ2VtZW5lIHRlcnVndm9lciIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgICAgIHsKICAgICAgICAgICAgICAibGFiZWwiOiAiVmVyc3RlayIKICAgICAgICAgICAgfQogICAgICAgICAgXSwKICAgICAgICAgICJsYWJlbCI6ICJCZXBhYWwgdmVyc3Rla3RlcnVndm9lciB2aXIgZW5pZ2UgcmVla3MgdGVsbGluZ3MiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIktsaWVrIG9wIGRpZSBcIlZvZWcgcmVla3MgYnlcIiBrbm9wcGllIG9tIHNvIHZlZWwgYXMgbW9vbnRsaWsgcmVla3NlIGJ5IHRlIHZvZWcuIEJ5dm9vcmJlZWxkOiAwLTIwJSBTd2FrIFB1bnQsIDIxLTkxJSBHZW1pZGRlbGRlIFB1bnQsIDkxLTEwMCUgVWl0c3Rla2VuZGUgUHVudCEiLAogICAgICAgICAgImVudGl0eSI6ICJyZWVrcyIsCiAgICAgICAgICAiZmllbGQiOiB7CiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlRlbGxpbmcgcmVla3MiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7fSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiVGVydWd2b2VyIHZpciBnZWRlZmluaWVlcmRlIHRlbGxpbmcgcmVla3MiLAogICAgICAgICAgICAgICAgInBsYWNlaG9sZGVyIjogIlZ1bCBkaWUgdGVydWd2b2VyIGluIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3MgdmlyIFwiVG9ldHNcIiBrbm9wcGllIiwKICAgICAgImRlZmF1bHQiOiAiVG9ldHMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJTdWJtaXRcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJTdWJtaXQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrcyB2aXIgXCJQcm9iZWVyIHdlZXJcIiBrbm9wcGllIiwKICAgICAgImRlZmF1bHQiOiAiUHJvYmVlciB3ZWVyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3MgdmlyIFwiV3lzIGFudHdvb3JkXCIga25vcHBpZSIsCiAgICAgICJkZWZhdWx0IjogIld5cyBhbnR3b29yZCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJHZWRyYWdzaW5zdGVsbGluZ3MuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkhpZXJkaWUga2V1c2VzIGxhYXQgam91IGJlaGVlciBob2UgZGllIG9uZGVyc2tlaWUgdGFrZSB1aXRnZXZvZXIgbW9ldCB3b3JkLiIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkFrdGl2ZWVyIFwiUHJvYmVlciB3ZWVyXCIiCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiQWt0aXZlZXIgXCJXeXMgYW50d29vcmRcIiBrbm9wcGllIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkFrdGl2ZWVyIFwiVG9ldHNcIiBrbm9wcGllIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIld5cyBwdW50ZXRlbGxpbmciLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIld5cyB2ZXJkaWVuZGUgcHVudGUgdmlyIGVsa2UgYW50d29vcmQuIgogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlJlZ3RlIGFudHdvb3JkdGVrcyIsCiAgICAgICJkZWZhdWx0IjogIlJlZyEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGVrcyBnZWJydWlrIG9tIGFhbiB0ZSBkdWkgZGF0IGRpZSBhbnR3b29yZCByZWcgaXMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVmVya2VlcmRlIGFudHdvb3JkdGVrcyIsCiAgICAgICJkZWZhdWx0IjogIlZlcmtlZXJkISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZWtzIHdhdCBnZWJydWlrIHdvcmQgb20gYWFuIHRlIGR1aSBkYXQgZGllIGFudHdvb3JkIHZlcmtlZXJkIGlzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlZlcm1pc2RlIGFudHdvb3JkdGVrcyIsCiAgICAgICJkZWZhdWx0IjogIkFudHdvb3JkIG5pZSBnZXZpbmQgbmllISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZWtzIGdlYnJ1aWsgb20gYWFuIHRlIGR1aSBkYXQgJ24gYW50d29vcmQgb250YnJlZWsiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQmVza3J5d2luZyB2aXIgV3lzIEFudHdvb3JkIiwKICAgICAgImRlZmF1bHQiOiAiVGFhayBvcGRhdGVlciBvbSBkaWUgYW50d29vcmQgdGUgYmV2YXQuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkhpZXJkaWUgdGVrcyB2ZXJ0ZWwgZGllIGdlYnJ1aWtlciBkYXQgZGllIHRha2Ugb3BkYXRlZXIgaXMgbWV0IGRpZSBhbnR3b29yZC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3R1ZWxlIHRlbnRvb25zdGVsbGluZyB2YW4gZGllIHRlbGthYXJ0IHZpciBkaWVnZW5lIHdhdCAnbiBzcHJlZWtsZXNlciBnZWJydWlrIiwKICAgICAgImRlZmF1bHQiOiAiSnkgaGV0IDpudW0gdWl0IDp0b3RhbCBwdW50ZSBnZWtyeSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFdGlrZXQgdmlyIGRpZSB2b2xsZWRpZyBsZWVzYmFyZSB0ZWtzIHZpciBodWxwdGVnbm9sb2dpZcOrIiwKICAgICAgImRlZmF1bHQiOiAiVm9sbGUgbGVlc2JhcmUgdGVrcyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFdGlrZXQgdmlyIGRpZSB0ZWtzIHdhYXIgZGllIHdvb3JkZSBnZW1lcmsga2FuIHdvcmQgdmlyIGh1bHB0ZWdub2xvZ2llw6siLAogICAgICAiZGVmYXVsdCI6ICJWb2x0ZWtzIHdhYXIgd29vcmRlIGdlbWVyayBrYW4gd29yZCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJBbnR3b29yZG1vZHVzIG9wc2tyaWYgdmlyIGh1bHB0ZWdub2xvZ2llw6siLAogICAgICAiZGVmYXVsdCI6ICJBbnR3b29yZG1vZHVzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRvZXRzbW9kdXNvcHNrcmlmIHZpciBodWxwdGVnbm9sb2dpZcOrIiwKICAgICAgImRlZmF1bHQiOiAiVG9ldHNtb2R1cyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJIdWxwdGVnbm9sb2dpZS1iZXNrcnl3aW5nIHZpciBkaWUgXCJUb2V0c1wiIC1rbm9wcGllIiwKICAgICAgImRlZmF1bHQiOiAiVG9ldHMgZGllIGFudHdvb3JkZS4gRGllIGFudHdvb3JkZSBzYWwgYXMgcmVnIGdlbWVyaywgdmVya2VlcmQgb2Ygb25iZWFudHdvb3JkIGdlbWVyayB3b3JkLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJIdWxwdGVnbm9sb2dpZSBiZXNrcnl3aW5nIHZpciBcIld5cyBPcGxvc3NpbmdcIiBrbm9wcGllIiwKICAgICAgImRlZmF1bHQiOiAiV3lzIGRpZSBhbnR3b29yZC4gSGllcmRpZSB0YWFrIHNhbCBnZW1lcmsgd29yZCBtZXQgZGllIHJlZ3RlIGFudHdvb3JkLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJIdWxwdGVnbm9sb2dpZcOrIGJlc2tyeXdpbmcgdmlyIFwiUHJvYmVlciB3ZWVyXCIga25vcHBpZSIsCiAgICAgICJkZWZhdWx0IjogIlByb2JlZXIgZGllIHRhYWsgd2Vlci4gSGVyc3RlbCBhbGxlIGFudHdvb3JkZSBlbiBiZWdpbiBkaWUgdGFhayB2YW4gbnV1dHMgYWYuIgogICAgfQogIF0KfQ=="],"libraries\/H5P.MarkTheWords-1.11\/language\/ar.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLZiNiz2KfYpti3IiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAi2KfZhNmG2YjYuSIsCiAgICAgICAgICAiZGVzY3JpcHRpb24iOiAi2YjYs9in2KbYtyDYpdi22KfZgdmK2Kkg2KfYrtiq2YrYp9ix2YrYqSDYqtmP2LnYsdi2INij2LnZhNmJINin2YTYs9ik2KfZhC4iCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAi2KXZitmC2KfZgSDZhdmK2LLYqSDYqtmD2KjZitixINin2YTYtdmI2LEiCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi2YjYtdmBINin2YTZhti02KfYtyIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLZiNi12YEg2KfZhNmD2YrZgdmK2Kkg2KfZhNiq2Yog2YrZhtio2LrZiiDZhNmE2YXYs9iq2K7Yr9mFINit2YQg2KfZhNmG2LTYp9i3IiwKICAgICAgInBsYWNlaG9sZGVyIjogIkNsaWNrIG9uIGFsbCB0aGUgdmVyYnMgaW4gdGhlIHRleHQgdGhhdCBmb2xsb3dzLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLYp9mE2K3ZgtmEINin2YTZhti12YoiLAogICAgICAicGxhY2Vob2xkZXIiOiAi2YfYsNmHINil2KzYp9io2Kk6ICrYp9mE2KXYrNin2KjYqSouIiwKICAgICAgImltcG9ydGFudCI6IHsKICAgICAgICAiZGVzY3JpcHRpb24iOiAiPHVsPjxsaT7Yp9mE2YPZhNmF2KfYqiDYp9mE2YXZhdmK2LLYqSDYqti22KfZgSDYqNi52YTYp9mF2Kkg2KfZhNmG2KzZhdipICgqKS48L2xpPjxsaT7ZitmF2YPZhiDYpdi22KfZgdipINin2YTYudmE2KfZhdin2Kog2KfZhNmG2KzZhdmK2Kkg2K\/Yp9iu2YQg2KfZhNmD2YTZhdin2Kog2KfZhNmF2K3Yr9iv2Kkg2LnZhiDYt9ix2YrZgiDYpdi22KfZgdipINi52YTYp9mF2Kkg2YbYrNmF2YrYqSDYo9iu2LHZidiMICrYp9mE2YPZhNmF2Kkg2KfZhNi12K3Zitit2KkqKiogPSZndDsg2KfZhNmD2YTZhdipINin2YTYtdit2YrYrdipKi48L2xpPjwvdWw+IiwKICAgICAgICAiZXhhbXBsZSI6ICLYqtmFINmI2LbYuSDYudmE2KfZhdipINi52YTZiSDYp9mE2YPZhNmF2KfYqiDYp9mE2LXYrdmK2K3YqSDZg9mF2Kcg2YrZhNmKOiAq2KfZhNmD2YXYqSDYp9mE2LXYrdmK2K3YqSrYjCDYqtmFINmD2KrYp9io2Kkg2LnZhNin2YXYqSDYp9mE2YbYrNmF2Kkg2LnZhNmJINin2YTZhtit2Ygg2KfZhNiq2KfZhNmKOiAq2KfZhNmD2YTZhdipINin2YTYtdit2YrYrdipKioqLiIKICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIti02YHYp9mB2YrYqSDYrtmE2YHZitipINin2YTYudmG2KfYtdixIiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAid2lkZ2V0cyI6IFsKICAgICAgICAgICAgewogICAgICAgICAgICAgICJsYWJlbCI6ICLYp9mE2KfZgdiq2LHYp9i22YoiCiAgICAgICAgICAgIH0KICAgICAgICAgIF0sCiAgICAgICAgICAibGFiZWwiOiAi2KrYrdiv2YrYryDYp9mE2YXZhNin2K3YuNin2Kog2KfZhNmF2K7Ytdi12Kkg2YTYo9mKINmG2LfYp9mCINiv2LHYrNipIiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICLYp9mG2YLYsSDYudmE2Ykg2LLYsSBcItil2LbYp9mB2Kkg2YbYt9in2YJcIiDZhNil2LbYp9mB2Kkg2YXYpyDYqtix2LrYqCDYqNmHINmF2YYg2YbYt9in2YLYp9iq2Iwg2YjZhdir2KfZhCDYudmE2Ykg2LDZhNmDOiAwLTIw2aog2YbYqtmK2KzYqSDYs9mK2KbYqdiMIDIxLTkx2aog2YbYqtmK2KzYqSDZhdiq2YjYs9i32KnYjCA5MS0xMDDZqiDZhtiq2YrYrNipINix2KfYpti52KkhIiwKICAgICAgICAgICJlbnRpdHkiOiAi2KfZhNmG2LfYp9mCIiwKICAgICAgICAgICJmaWVsZCI6IHsKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAi2YbYt9in2YIg2KfZhNiv2LHYrNipIgogICAgICAgICAgICAgIH0sCiAgICAgICAgICAgICAge30sCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogItmF2YTYp9it2LjYp9iqINmE2YbYt9in2YIg2K\/Ysdis2Kkg2YXYrdiv2K8iLAogICAgICAgICAgICAgICAgInBsYWNlaG9sZGVyIjogItij2K\/YrtmEINin2YTZhdmE2KfYrdi42KfYqiIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICB9CiAgICAgIF0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLYp9mE2YbYtSDZhCBcItiq2K3ZgtmCIFwiINin2YTYstixIiwKICAgICAgImRlZmF1bHQiOiAiQ2hlY2siCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJTdWJtaXRcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJTdWJtaXQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi2KfZhNmG2LUg2YQgXCLYpdi52KfYr9ipINin2YTZhdit2KfZiNmE2KkgXCIg2KfZhNiy2LEiLAogICAgICAiZGVmYXVsdCI6ICLYpdi52KfYr9ipINin2YTZhdit2KfZiNmE2KkiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi2KfZhNmG2LUgIFwi2YXYtNin2YfYr9ipINin2YTYrdmEIFwiINmE2LLYsSIsCiAgICAgICJkZWZhdWx0IjogItmF2LTYp9mH2K\/YqSDYp9mE2K3ZhCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLYpdi52K\/Yp9iv2Kog2KfZhNmG2LTYp9i3IiwKICAgICAgImRlc2NyaXB0aW9uIjogItmI2YfYsNmHINin2YTYrtmK2KfYsdin2Kog2KrZhdmD2YbZgyDZhdmGINin2YTYqtit2YPZhSDZgdmKINmD2YrZgdmK2Kkg2LPZhNmI2YMg2YfYsNinINin2YTZhti02KfYtyIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogItiq2YXZg9mK2YYgXCLYpdi52KfYr9ipINin2YTZhdit2KfZiNmE2KkgXCIiCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAi2KrZhdmD2YrZhiDYstixIFwi2YXYtNin2YfYr9ipINin2YTYrdmEXCIiCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAi2KrZhdmD2YrZhiDYstixIFwi2KfZhNiq2K3ZgtmCXCIiCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAi2KXYuNmH2KfYsSDZhtmC2KfYtyDYp9mE2LnZhNin2YXYqSIsCiAgICAgICAgICAiZGVzY3JpcHRpb24iOiAi2LnYsdi2INin2YTZhtmC2KfYtyDYp9mE2YXZg9iq2LPYqNipINmE2YPZhCDYpdis2KfYqNipLiIKICAgICAgICB9CiAgICAgIF0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLZhti1INin2YTYrNmI2KfYqCDYp9mE2LXYrdmK2K0iLAogICAgICAiZGVmYXVsdCI6ICLYtdit2YrYrSEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB1c2VkIHRvIGluZGljYXRlIHRoYXQgYW4gYW5zd2VyIGlzIGNvcnJlY3QiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi2YbYtSDYp9mE2KzZiNin2Kgg2LrZitixINi12K3ZititIiwKICAgICAgImRlZmF1bHQiOiAi2LrZitixINi12K3ZititISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHVzZWQgdG8gaW5kaWNhdGUgdGhhdCBhbiBhbnN3ZXIgaXMgaW5jb3JyZWN0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIti62KfYqCDZhti1INin2YTYrNmI2KfYqCIsCiAgICAgICJkZWZhdWx0IjogItin2YHYqtmC2K8hIiwKICAgICAgImRlc2NyaXB0aW9uIjogItin2YTZhti1INin2YTZhdmP2LTZitixINil2YTZiSDYo9mGINin2YTYpdis2KfYqNipINmF2YHZgtmI2K\/YqSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLZiNi12YEg2YTYudix2LYg2KfZhNit2YQiLAogICAgICAiZGVmYXVsdCI6ICLZitiq2YUg2KrYrdiv2YrYqyDZhdmH2YXYqSDZhNin2K3YqtmI2KfYoSDYp9mE2K3ZhC4iLAogICAgICAiZGVzY3JpcHRpb24iOiAi2YrYrtio2LEg2YfYsNinINin2YTZhti1INin2YTZhdiz2KrYrtiv2YUg2KPZhtmHINiq2YUg2KrYrdiv2YrYqyDYp9mE2YXZh9in2YUg2YXYuSDYp9mE2K3ZhC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dHVhbCByZXByZXNlbnRhdGlvbiBvZiB0aGUgc2NvcmUgYmFyIGZvciB0aG9zZSB1c2luZyBhIHJlYWRzcGVha2VyIiwKICAgICAgImRlZmF1bHQiOiAiWW91IGdvdCA6bnVtIG91dCBvZiA6dG90YWwgcG9pbnRzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkxhYmVsIGZvciB0aGUgZnVsbCByZWFkYWJsZSB0ZXh0IGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiRnVsbCByZWFkYWJsZSB0ZXh0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkxhYmVsIGZvciB0aGUgdGV4dCB3aGVyZSB3b3JkcyBjYW4gYmUgbWFya2VkIGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiRnVsbCB0ZXh0IHdoZXJlIHdvcmRzIGNhbiBiZSBtYXJrZWQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiU29sdXRpb24gbW9kZSBoZWFkZXIgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJTb2x1dGlvbiBtb2RlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNoZWNraW5nIG1vZGUgaGVhZGVyIGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiQ2hlY2tpbmcgbW9kZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJBc3Npc3RpdmUgdGVjaG5vbG9neSBkZXNjcmlwdGlvbiBmb3IgXCJDaGVja1wiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIkNoZWNrIHRoZSBhbnN3ZXJzLiBUaGUgcmVzcG9uc2VzIHdpbGwgYmUgbWFya2VkIGFzIGNvcnJlY3QsIGluY29ycmVjdCwgb3IgdW5hbnN3ZXJlZC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi2YjYtdmBINiq2YLZhtmK2Kkg2KfZhNmF2LPYp9i52K\/YqSDZhNiy2LEgXCLYudix2LYg2KfZhNit2YTZiNmEXCIiLAogICAgICAiZGVmYXVsdCI6ICLYp9i52LHYtiDYp9mE2K3ZhC4g2LPZitiq2YUg2KrZhdmK2YrYsiDYp9mE2YXZh9mF2Kkg2KjYp9mE2K3ZhCDYp9mE2LXYrdmK2K0g2KfZhNiu2KfYtSDYqNmH2KcuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItmI2LXZgSDYp9mE2KrZgtmG2YrYqSDYp9mE2YXYs9in2LnYr9ipINmE2LLYsSDYpdi52KfYr9ipINin2YTZhdit2KfZiNmE2KkiLAogICAgICAiZGVmYXVsdCI6ICLYpdi52KfYr9ipINin2YTZhdit2KfZiNmE2Kkg2YTZhNmF2YfZhdipLiDYpdi52KfYr9ipINi22KjYtyDYrNmF2YrYuSDYp9mE2LHYr9mI2K8g2YjYp9mE2KjYr9ihINio2KfZhNmF2YfZhdipINmF2LHYqSDYo9iu2LHZiS4iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.MarkTheWords-1.11\/language\/bg.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLQnNC10LTQuNGPIiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAi0KLQuNC\/IiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICLQndC10LfQsNC00YrQu9C20LjRgtC10LvQvdCwINC80LXQtNC40Y8sINC60L7Rj9GC0L4g0LTQsCDRgdC1INC\/0L7QutCw0LfQstCwINC90LDQtCDQstGK0L\/RgNC+0YHQsC4iCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAi0JTQtdCw0LrRgtC40LLQuNGA0LDQvdC1INC80LDRidCw0LHQuNGA0LDQvdC10YLQviDQvdCwINC40LfQvtCx0YDQsNC20LXQvdC40Y8iCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0J7Qv9C40YHQsNC90LjQtSDQvdCwINC30LDQtNCw0YfQsNGC0LAiLAogICAgICAiZGVzY3JpcHRpb24iOiAi0J7Qv9C40YjQtdGC0LUg0LrQsNC6INC\/0L7RgtGA0LXQsdC40YLQtdC70Y8g0YLRgNGP0LHQstCwINC00LAg0YDQtdGI0Lgg0LfQsNC00LDRh9Cw0YLQsC4iLAogICAgICAicGxhY2Vob2xkZXIiOiAi0KnRgNCw0LrQvdC10YLQtSDRgSDQvNC40YjQutCw0YLQsCDQstGK0YDRhdGDINCy0YHQuNGH0LrQuCDQs9C70LDQs9C+0LvQuCDQsiDRgtC10LrRgdGC0LAsINC60L7QudGC0L4g0YHQu9C10LTQstCwLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGC0L7QstC+INC\/0L7Qu9C1IiwKICAgICAgInBsYWNlaG9sZGVyIjogItCi0L7QstCwINC1INC+0YLQs9C+0LLQvtGA0LA6ICphbnN3ZXIqLiIsCiAgICAgICJpbXBvcnRhbnQiOiB7CiAgICAgICAgImRlc2NyaXB0aW9uIjogIjx1bD48bGk+0JzQsNGA0LrQuNGA0LDQvdC40YLQtSDQtNGD0LzQuCDRgdCwINC00L7QsdCw0LLQtdC90Lgg0YHRitGBINC30LLQtdC30LTQuNGH0LrQsCAoKikuPC9saT48bGk+0JfQstC10LfQtNC40YfQutC4INC80L7Qs9Cw0YIg0LTQsCDQsdGK0LTQsNGCINC00L7QsdCw0LLQtdC90Lgg0LIg0LzQsNGA0LrQuNGA0LDQvdC40YLQtSDQtNGD0LzQuCwg0LrQsNGC0L4g0YHQtSDQtNC+0LHQsNCy0Lgg0LTRgNGD0LPQsCDQt9Cy0LXQt9C00LjRh9C60LAsICpjb3JyZWN0d29yZCoqKiA9Jmd0OyBjb3JyZWN0d29yZCouPC9saT48L3VsPiIsCiAgICAgICAgImV4YW1wbGUiOiAi0J\/RgNCw0LLQuNC70L3QuNGC0LUg0LTRg9C80Lgg0YHQsCDQvNCw0YDQutC40YDQsNC90Lgg0YLQsNC60LA6ICpjb3JyZWN0d29yZCosINC30LLQtdC30LTQuNGH0LrQsNGC0LAg0LUg0L7RgtCx0LXQu9GP0LfQsNC90LAg0YLQsNC60LA6ICpjb3JyZWN0d29yZCoqKi4iCiAgICAgIH0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQntCx0YnQsCDQvtCx0YDQsNGC0L3QsCDQstGA0YrQt9C60LAiLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJ3aWRnZXRzIjogWwogICAgICAgICAgICB7CiAgICAgICAgICAgICAgImxhYmVsIjogItCf0L4g0L\/QvtC00YDQsNC30LHQuNGA0LDQvdC1IgogICAgICAgICAgICB9CiAgICAgICAgICBdLAogICAgICAgICAgImxhYmVsIjogItCf0LXRgNGB0L7QvdCw0LvQvdCwINC+0LHRgNCw0YLQvdCwINCy0YDRitC30LrQsCDQt9CwINCy0YHQtdC60Lgg0LTQuNCw0L\/QsNC30L7QvSDQvtGCINGC0L7Rh9C60LgiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogItCd0LDRgtC40YHQvdC10YLQtSDQsdGD0YLQvtC9IFwi0JTQvtCx0LDQstC4INC00LjQsNC\/0LDQt9C+0L1cIiwg0LfQsCDQtNCwINC00L7QsdCw0LLQuNGC0LUg0L3QtdC+0LHRhdC+0LTQuNC80LjRgtC1INC\/0L7Qu9C10YLQsCDQt9CwINC00LjQsNC\/0LDQt9C+0L3QuC4g0J\/RgNC40LzQtdGAOiAwLTIwJSDQodC70LDQsSDRgNC10LfRg9C70YLQsNGCLCAyMS05MSUg0KHRgNC10LTQtdC9INGA0LXQt9GD0LvRgtCw0YIsIDkxLTEwMCUg0J7RgtC70LjRh9C10L0g0YDQtdC30YPQu9GC0LDRgiEiLAogICAgICAgICAgImVudGl0eSI6ICLQtNC40LDQv9Cw0LfQvtC9IiwKICAgICAgICAgICJmaWVsZCI6IHsKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAi0JTQuNCw0L\/QsNC30L7QvSDQvdCwINGA0LXQt9GD0LvRgtCw0YLQsCIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHt9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICLQntCx0YDQsNGC0L3QsCDQstGA0YrQt9C60LAg0LfQsCDQtNC10YTQuNC90LjRgNCw0L0g0LTQuNCw0L\/QsNC30L7QvSDQvdCwINGA0LXQt9GD0LvRgtCw0YLQsCIsCiAgICAgICAgICAgICAgICAicGxhY2Vob2xkZXIiOiAi0JLRitCy0LXQtNC10YLQtSDQvtCx0YDQsNGC0L3QsCDQstGA0YrQt9C60LAiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQt9CwINCx0YPRgtC+0L0gXCLQn9GA0L7QstC10YDQuFwiICIsCiAgICAgICJkZWZhdWx0IjogItCf0YDQvtCy0LXRgNC4IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIFwiU3VibWl0XCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiU3VibWl0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0LXQutGB0YIg0LfQsCDQsdGD0YLQvtC9IFwi0J7Qv9C40YLQsNC5INC\/0LDQulwiICIsCiAgICAgICJkZWZhdWx0IjogItCe0L\/QuNGC0LDQuSDQv9Cw0LoiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQt9CwINCx0YPRgtC+0L1cItCf0L7QutCw0LbQuCDRgNC10YjQtdC90LjQtVwiICIsCiAgICAgICJkZWZhdWx0IjogItCf0L7QutCw0LbQuCDRgNC10YjQtdC90LjQtSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQndCw0YHRgtGA0L7QudC60Lgg0LfQsCDQv9C+0LLQtdC00LXQvdC40LUiLAogICAgICAiZGVzY3JpcHRpb24iOiAi0KLQtdC30Lgg0L3QsNGB0YLRgNC+0LnQutC4INC\/0L7Qt9Cy0L7Qu9GP0LLQsNGCINC00LAg0LrQvtC90YLRgNC+0LvQuNGA0LDRgtC1INC\/0L7QstC10LTQtdC90LjQtdGC0L4g0L3QsCDQt9Cw0LTQsNGH0LDRgtCwLiIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogItCg0LDQt9GA0LXRiNC4INCx0YPRgtC+0L0gXCLQntC\/0LjRgtCw0Lkg0L\/QsNC6XCIgIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogItCg0LDQt9GA0LXRiNC4INCx0YPRgtC+0L0gXCLQn9C+0LrQsNC20Lgg0YDQtdGI0LXQvdC40LVcIiAiCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAi0KDQsNC30YDQtdGI0Lgg0LHRg9GC0L7QvSBcItCf0YDQvtCy0LXRgNC4XCIgIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogItCf0L7QutCw0LfQstCw0L3QtSDQvdCwINGC0L7Rh9C60LjRgtC1IiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICLQn9C+0LrQsNC30LLQsCDQv9C+0LvRg9GH0LXQvdC40YLQtSDRgtC+0YfQutC4INC30LAg0LLRgdC10LrQuCDQvtGC0LPQvtCy0L7RgC4iCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQt9CwINCy0LXRgNC10L0g0L7RgtCz0L7QstC+0YAiLAogICAgICAiZGVmYXVsdCI6ICLQktGP0YDQvdC+ISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLQotC10LrRgdGC0YrRgiDRidC1INC\/0L7QutCw0LfQstCwLCDRh9C1INC+0YLQs9C+0LLQvtGA0YrRgiDQtSDQstC10YDQtdC9IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0LXQutGB0YIg0LfQsCDQs9GA0LXRiNC10L0g0L7RgtCz0L7QstC+0YAiLAogICAgICAiZGVmYXVsdCI6ICLQk9GA0LXRiNC90L4hIiwKICAgICAgImRlc2NyaXB0aW9uIjogItCi0LXQutGB0YLRitGCINGJ0LUg0L\/QvtC60LDQt9Cy0LAsINGH0LUg0L7RgtCz0L7QstC+0YDRitGCINC1INCz0YDQtdGI0LXQvSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC30LAg0LvQuNC\/0YHQstCw0Ykg0L7RgtCz0L7QstC+0YAiLAogICAgICAiZGVmYXVsdCI6ICLQm9C40L\/RgdCy0LAg0L7RgtCz0L7QstC+0YAhIiwKICAgICAgImRlc2NyaXB0aW9uIjogItCi0LXQutGB0YLRitGCINGJ0LUg0L\/QvtC60LDQt9Cy0LAsINGH0LUg0L7RgtCz0L7QstC+0YDRitGCINC70LjQv9GB0LLQsCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQntC\/0LjRgdCw0L3QuNC1INC30LAg0J\/QvtC60LDQttC4INGA0LXRiNC10L3QuNC1IiwKICAgICAgImRlZmF1bHQiOiAi0JfQsNC00LDRh9Cw0YLQsCDQtSDQvtCx0L3QvtCy0LXQvdCwLCDQt9CwINC00LAg0YHRitC00YrRgNC20LAg0YDQtdGI0LXQvdC40LXRgtC+LiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLQotC+0LfQuCDRgtC10LrRgdGCINC60LDQt9Cy0LAg0L3QsCDRg9GH0LXQvdC40LrQsCwg0YfQtSDQt9Cw0LTQsNGH0LjRgtC1INGB0LAg0L7QsdC90L7QstC10L3QuCwg0LfQsCDQtNCwINGB0LUg0LLQuNC00Lgg0YDQtdGI0LXQvdC40LXRgtC+LiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGC0L7QstC+INC\/0YDQtdC00YHRgtCw0LLRj9C90LUg0L3QsCDQu9C10L3RgtCw0YLQsCDRgSDRgNC10LfRg9C70YLQsNGC0Lgg0LfQsCDRgtC10LfQuCwg0LrQvtC40YLQviDQuNC30L\/QvtC70LfQstCw0YIgcmVhZHNwZWFrZXIiLAogICAgICAiZGVmYXVsdCI6ICLQktC40LUg0LjQvNCw0YLQtSA6bnVtINC+0YIg0L7QsdGJ0L4gOnRvdGFsINGC0L7Rh9C60LgiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTGFiZWwgZm9yIHRoZSBmdWxsIHJlYWRhYmxlIHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJGdWxsIHJlYWRhYmxlIHRleHQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTGFiZWwgZm9yIHRoZSB0ZXh0IHdoZXJlIHdvcmRzIGNhbiBiZSBtYXJrZWQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJGdWxsIHRleHQgd2hlcmUgd29yZHMgY2FuIGJlIG1hcmtlZCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJTb2x1dGlvbiBtb2RlIGhlYWRlciBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIlNvbHV0aW9uIG1vZGUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2hlY2tpbmcgbW9kZSBoZWFkZXIgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJDaGVja2luZyBtb2RlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFzc2lzdGl2ZSB0ZWNobm9sb2d5IGRlc2NyaXB0aW9uIGZvciBcIkNoZWNrXCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiQ2hlY2sgdGhlIGFuc3dlcnMuIFRoZSByZXNwb25zZXMgd2lsbCBiZSBtYXJrZWQgYXMgY29ycmVjdCwgaW5jb3JyZWN0LCBvciB1bmFuc3dlcmVkLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJBc3Npc3RpdmUgdGVjaG5vbG9neSBkZXNjcmlwdGlvbiBmb3IgXCJTaG93IFNvbHV0aW9uXCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiU2hvdyB0aGUgc29sdXRpb24uIFRoZSB0YXNrIHdpbGwgYmUgbWFya2VkIHdpdGggaXRzIGNvcnJlY3Qgc29sdXRpb24uIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFzc2lzdGl2ZSB0ZWNobm9sb2d5IGRlc2NyaXB0aW9uIGZvciBcIlJldHJ5XCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiUmV0cnkgdGhlIHRhc2suIFJlc2V0IGFsbCByZXNwb25zZXMgYW5kIHN0YXJ0IHRoZSB0YXNrIG92ZXIgYWdhaW4uIgogICAgfQogIF0KfQo="],"libraries\/H5P.MarkTheWords-1.11\/language\/bs.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJNZWRpYSIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIlRpcCIsCiAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiT3BjaW9uYWxuaSBtZWRpaiBkYSBzZSBwcmlrYcW+ZSBpem5hZCBwaXRhbmphLiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJPbmVtb2d1xIdpIHp1bWlyYW5qZSBzbGlrZSIKICAgICAgICB9CiAgICAgIF0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJPcGlzIHphZGF0a2EiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRGVzY3JpYmUgaG93IHRoZSB1c2VyIHNob3VsZCBzb2x2ZSB0aGUgdGFzay4iLAogICAgICAicGxhY2Vob2xkZXIiOiAiS2xpa25pIG5hIHN2ZSBnbGFnb2xlIHUgdGVrc3R1IGtvamkgc2xpamVkaS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dGZpZWxkIiwKICAgICAgInBsYWNlaG9sZGVyIjogIk92byBqZSBvZGdvdm9yOiAqYW5zd2VyKi4iLAogICAgICAiaW1wb3J0YW50IjogewogICAgICAgICJkZXNjcmlwdGlvbiI6ICI8dWw+PGxpPiBPem5hxI1lbmUgcmlqZcSNaSBzdSBkYWRhdGUgc2Egem5ha29tICgqKS48L2xpPjxsaT5abmFrb3ZpIG1vZ3UgYml0aSBkb2RhdGkgdW51dGFyIG96bmHEjWVuaWggcmlqZcSNaSBkb2RhdmFuamVtIG5vdm9nIHpuYWthLCAqdGHEjW5hcmlqZcSNKioqID0mZ3Q7IHRhxI1uYXJpamXEjSouPC9saT48L3VsPiIsCiAgICAgICAgImV4YW1wbGUiOiAiVGHEjW5lIHJpamXEjWkgc3Ugb3puYcSNZW5lIG92YWtvOiAqdGHEjW5hcmlqZcSNKiwgem5hayBqZSBuYXBpc2FuIG92YWtvOiAqdGHEjW5hcmlqZcSNKioqLiIKICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlBvemFkaW5za2EgemFtdcSHZW5vc3QgemEgZWxlbWVudGUgemEgdXppbWFuamUiLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJ3aWRnZXRzIjogWwogICAgICAgICAgICB7CiAgICAgICAgICAgICAgImxhYmVsIjogIlN0YW5kYXJkIgogICAgICAgICAgICB9CiAgICAgICAgICBdLAogICAgICAgICAgImxhYmVsIjogIkRlZmluZSBjdXN0b20gZmVlZGJhY2sgZm9yIGFueSBzY29yZSByYW5nZSIsCiAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiS2xpa25pdGUgbmEgZHVnbWUgXCJEb2RhaiByYXNwb25cIiBkYSBkb2RhdGUgb25vbGlrbyByYXNwb25hIGtvbGlrbyB2YW0gamUgcG90cmVibm8uUHJpbWplcjogMC0yMCUgbG\/FoSByZXp1bHRhdCwgMjEtOTElIHNyZWRuamkgcmV6dWx0YXQsIDkxLTEwMCUgU2phamFuIHJlenVsdGF0ISIsCiAgICAgICAgICAiZW50aXR5IjogInJhc3BvbiIsCiAgICAgICAgICAiZmllbGQiOiB7CiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlJhc3BvbiByZXp1bHRhdGEiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7fSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiRmVlZGJhY2sgemEgZGVmaW5pcmFuaSByYXNwb24gcmV6dWx0YXRhIiwKICAgICAgICAgICAgICAgICJwbGFjZWhvbGRlciI6ICJGaWxsIGluIHRoZSBmZWVkYmFjayIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICB9CiAgICAgIF0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJPem5ha2EgemEgZHVnbWUgXCJQcm92amVyaVwiIiwKICAgICAgImRlZmF1bHQiOiAiUHJvdmplcmkiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJTdWJtaXRcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJTdWJtaXQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiT3puYWthIHphIGR1Z21lIFwiUG9ub3ZpXCIiLAogICAgICAiZGVmYXVsdCI6ICJQb25vdmkiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJTaG93IHNvbHV0aW9uXCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiUHJpa2HFvmkgcmplxaFlbmplIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlBvZGXFoWF2YW5qZSBwb25hxaFhbmphLiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJEaWVzZSBPcHRpb25lbiBrb250cm9sbGllcmVuLCB3aWUgc2ljaCBkaWUgQXVmZ2FiZSB2ZXJow6RsdC4iLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJPbW9ndcSHaSBcIlBvbm92aVwiIGR1Z21lIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIk9tb2d1xIdpIFwiUHJpa2HFvmkgcmplxaFlbmplXCIgZHVnbWUiCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiT21vZ3XEh2kgXCJQcm92amVyaVwiIGR1Z21lIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIlByaWthxb5pIHBvZW5lIiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJQcmlrYcW+aSB6YXJhxJFlbmUgcG9lbmUgemEgc3Zha2kgb2Rnb3Zvci4iCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3QgemEgdGHEjWFuIG9kZ292b3IiLAogICAgICAiZGVmYXVsdCI6ICJUYcSNbm8hISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHVzZWQgdG8gaW5kaWNhdGUgdGhhdCBhbiBhbnN3ZXIgaXMgY29ycmVjdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbmNvcnJlY3QgYW5zd2VyIHRleHQiLAogICAgICAiZGVmYXVsdCI6ICJOZXRhxI1ubyEhIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdXNlZCB0byBpbmRpY2F0ZSB0aGF0IGFuIGFuc3dlciBpcyBpbmNvcnJlY3QiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWlzc2VkIGFuc3dlciB0ZXh0IiwKICAgICAgImRlZmF1bHQiOiAiT2Rnb3ZvciBuaWplIHByb25hxJFlbiEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB1c2VkIHRvIGluZGljYXRlIHRoYXQgYW4gYW5zd2VyIGlzIG1pc3NpbmciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRGVzY3JpcHRpb24gZm9yIERpc3BsYXkgU29sdXRpb24iLAogICAgICAiZGVmYXVsdCI6ICJaYWRhdGFrIGplIGHFvnVyaXJhbiBrYWtvIGJpIGltYW8gcmplxaFlbmplLiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUaGlzIHRleHQgdGVsbHMgdGhlIHVzZXIgdGhhdCB0aGUgdGFza3MgaGFzIGJlZW4gdXBkYXRlZCB3aXRoIHRoZSBzb2x1dGlvbi4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dHVhbCByZXByZXNlbnRhdGlvbiBvZiB0aGUgc2NvcmUgYmFyIGZvciB0aG9zZSB1c2luZyBhIHJlYWRzcGVha2VyIiwKICAgICAgImRlZmF1bHQiOiAiT3N2b2ppbGkgc3RlIDpudW0gb2QgOnRvdGFsIHBvZW5hIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkxhYmVsIGZvciB0aGUgZnVsbCByZWFkYWJsZSB0ZXh0IGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiQ2lqZWxpIMSNaXRsaml2IHRla3N0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkxhYmVsIGZvciB0aGUgdGV4dCB3aGVyZSB3b3JkcyBjYW4gYmUgbWFya2VkIGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiQ2lqZWxpIHRlc2t0IGdkamUgc2UgbW9ndSByaWplxI1pIG96bmHEjWl0aS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiU29sdXRpb24gbW9kZSBoZWFkZXIgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJNb2QgemEgcmplxaFlbmplIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNoZWNraW5nIG1vZGUgaGVhZGVyIGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiTW9kIHByb3ZqZXJlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFzc2lzdGl2ZSB0ZWNobm9sb2d5IGRlc2NyaXB0aW9uIGZvciBcIkNoZWNrXCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiQ2hlY2sgdGhlIGFuc3dlcnMuIFRoZSByZXNwb25zZXMgd2lsbCBiZSBtYXJrZWQgYXMgY29ycmVjdCwgaW5jb3JyZWN0LCBvciB1bmFuc3dlcmVkLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJBc3Npc3RpdmUgdGVjaG5vbG9neSBkZXNjcmlwdGlvbiBmb3IgXCJTaG93IFNvbHV0aW9uXCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiU2hvdyB0aGUgc29sdXRpb24uIFRoZSB0YXNrIHdpbGwgYmUgbWFya2VkIHdpdGggaXRzIGNvcnJlY3Qgc29sdXRpb24uIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFzc2lzdGl2ZSB0ZWNobm9sb2d5IGRlc2NyaXB0aW9uIGZvciBcIlJldHJ5XCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiUmV0cnkgdGhlIHRhc2suIFJlc2V0IGFsbCByZXNwb25zZXMgYW5kIHN0YXJ0IHRoZSB0YXNrIG92ZXIgYWdhaW4uIgogICAgfQogIF0KfQo="],"libraries\/H5P.MarkTheWords-1.11\/language\/ca.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJSZWN1cnMiLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJUaXB1cyIsCiAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiUmVjdXJzb3Mgb3BjaW9uYWxzIHBlciBtb3N0cmFyIGFsIGRhbXVudCBkZSBsYSBwcmVndW50YS4iCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiRGVzaGFiaWxpdGEgZWwgem9vbSBkZSBsZXMgaW1hdGdlcyIKICAgICAgICB9CiAgICAgIF0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZXNjcmlwY2nDsyBkZSBsYSB0YXNjYSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJEZXNjcml1IGNvbSBs4oCZdXN1YXJpIGhhIGRlIHJlc29sZHJlIGxhIHRhc2NhLiIsCiAgICAgICJwbGFjZWhvbGRlciI6ICJGZXUgY2xpYyBlbiB0b3RzIGVscyB2ZXJicyBkZWwgdGV4dCBxdWUgZXMgbW9zdHJhIGEgY29udGludWFjacOzLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDYW1wIGRlIHRleHQiLAogICAgICAicGxhY2Vob2xkZXIiOiAiQXF1ZXN0YSDDqXMgdW5hIHJlc3Bvc3RhOiAqcmVzcG9zdGEqLiIsCiAgICAgICJpbXBvcnRhbnQiOiB7CiAgICAgICAgImRlc2NyaXB0aW9uIjogIjx1bD48bGk+TGVzIHBhcmF1bGVzIHF1ZSBz4oCZaGFuIGRlIG1hcmNhciBz4oCZYWZlZ2VpeGVuIGFtYiB1biBhc3RlcmlzYyAoKikuPC9saT48bGk+RXMgcG9kZW4gYWZlZ2lyIGFzdGVyaXNjcyBhIGxlcyBwYXJhdWxlcyBtYXJjYWRlcyBhZmVnaW50IHVuIGFsdHJlIGFzdGVyaXNjLCAqcGFyYXVsYWNvcnJlY3RhKioqID0mZ3Q7IHBhcmF1bGFjb3JyZWN0YSouPC9saT48L3VsPiIsCiAgICAgICAgImV4YW1wbGUiOiAiTGVzIHBhcmF1bGVzIGNvcnJlY3RlcyBlcyBtYXJxdWVuIGFpeMOtOiAqcGFyYXVsYWNvcnJlY3RhKjsgbOKAmWFzdGVyaXNjIHPigJlpbnRyb2R1ZWl4IGFpeMOtOiAqcGFyYXVsYWNvcnJlY3RhKioqLiIKICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlN1Z2dlcmltZW50IGdlbmVyYWwiLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJ3aWRnZXRzIjogWwogICAgICAgICAgICB7CiAgICAgICAgICAgICAgImxhYmVsIjogIk9wY2nDsyBwcmVkZXRlcm1pbmFkYSIKICAgICAgICAgICAgfQogICAgICAgICAgXSwKICAgICAgICAgICJsYWJlbCI6ICJEZWZpbmVpeCB1bmEgdmFsb3JhY2nDsyBwZXIgY2FkYSByYW5nIGRlIHB1bnR1YWNpw7MiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIkZldSBjbGljIGFsIGJvdMOzIFwiQWZlZ2VpeCB1biByYW5nXCIgcGVyIGFmZWdpciB0YW50cyByYW5ncyBjb20gbmVjZXNzaXRldS4gRXhlbXBsZTogMC0yMMKgJSBwZXIgYSBwdW50dWFjacOzIGJhaXhhLCAyMS05McKgJSBwZXIgYSBwdW50dWFjacOzIG1pdGphbmEsIDkxLTEwMMKgJSBwZXIgYSBwdW50dWFjacOzIGV4Y2VswrdsZW50IiwKICAgICAgICAgICJlbnRpdHkiOiAicmFuZyIsCiAgICAgICAgICAiZmllbGQiOiB7CiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlJhbmcgZGUgcHVudHVhY2nDsyIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHt9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJSZXRyb2FjY2nDsyBwZXIgYWwgcmFuZyBkZSBwdW50dWFjacOzIGRlZmluaXQiLAogICAgICAgICAgICAgICAgInBsYWNlaG9sZGVyIjogIkludHJvZHXDr3UgZWwgc3VnZ2VyaW1lbnQiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBwZWwgYm90w7MgXCJWZXJpZmljYXJcIiIsCiAgICAgICJkZWZhdWx0IjogIlZlcmlmaWNhIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIFwiU3VibWl0XCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiU3VibWl0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZGVsIGJvdMOzIFwiVG9ybmEtaG8gYSBwcm92YXJcIiIsCiAgICAgICJkZWZhdWx0IjogIlRvcm5hLWhvIGEgcHJvdmFyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgcGVsIGJvdMOzIFwiTW9zdHJhciBzb2x1Y2nDs1wiIiwKICAgICAgImRlZmF1bHQiOiAiTW9zdHJhIGxhIHNvbHVjacOzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk9wY2lvbnMgZGUgY29tcG9ydGFtZW50IiwKICAgICAgImRlc2NyaXB0aW9uIjogIkFxdWVzdGVzIG9wY2lvbnMgZXQgcGVybWV0cmFuIGNvbnRyb2xhciBjb20gZXMgY29tcG9ydGEgbGEgdGFzY2EuIiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiQWN0aXZhIFwiVG9ybmEtaG8gYSBwcm92YXJcIiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJBY3RpdmEgZWwgYm90w7MgXCJNb3N0cmEgbGEgc29sdWNpw7NcIiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJBY3RpdmEgZWwgYm90w7MgXCJDb21wcm92YVwiIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIk1vc3RyYSBsYSBwdW50dWFjacOzIiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJNb3N0cmEgZWxzIHB1bnRzIG9idGluZ3V0cyBwZXIgYSBjYWRhIHJlc3Bvc3RhLiIKICAgICAgICB9CiAgICAgIF0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGRlIGxhIHJlc3Bvc3RhIGNvcnJlY3RhIiwKICAgICAgImRlZmF1bHQiOiAiQ29ycmVjdGUhIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdXRpbGl0emF0IHBlciBhIGluZGljYXIgcXVlIHVuYSByZXNwb3N0YSDDqXMgY29ycmVjdGEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBkZSByZXNwb3N0YSBpbmNvcnJlY3RhIiwKICAgICAgImRlZmF1bHQiOiAiSW5jb3JyZWN0ZSEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB1dGlsaXR6YXQgcGVyIGEgaW5kaWNhciBxdWUgdW5hIHJlc3Bvc3RhIMOpcyBjb3JyZWN0YSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGRlIHJlc3Bvc3RhIG5vIHByb3BvcmNpb25hZGEiLAogICAgICAiZGVmYXVsdCI6ICJObyBz4oCZaGEgdHJvYmF0IGxhIHJlc3Bvc3RhISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHF1ZSBz4oCZdXRpbGl0emEgcGVyIGluZGljYXIgcXVlIGZhbHRhIHVuYSByZXNwb3N0YSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZXNjcmlwY2nDsyBwZXIgYSBNb3N0cmEgbGEgc29sdWNpw7MiLAogICAgICAiZGVmYXVsdCI6ICJMYSB0YXNjYSBz4oCZaGEgYWN0dWFsaXR6YXQgcGVyIGluY2xvdXJlIGxhIHNvbHVjacOzLiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJBcXVlc3QgdGV4dCBpbmRpY2EgYSBs4oCZdXN1YXJpIHF1ZSBsZXMgdGFzcXVlcyBz4oCZaGFuIGFjdHVhbGl0emF0IGFtYiBsYSBzb2x1Y2nDsy4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUmVwcmVzZW50YWNpw7MgdGV4dHVhbCBkZSBsYSBiYXJyYSBkZSBwdW50dWFjacOzIHBlcmEgYWxzIHF1ZSB1dGlsaXR6ZW4gdW4gYWx0YXZldSBkZSBsZWN0dXJhIiwKICAgICAgImRlZmF1bHQiOiAiSGV1IGZldCA6bnVtIGRlIDp0b3RhbCBwdW50cyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFdGlxdWV0YSBwZXIgYWwgdGV4dCBjb21wbGV0IHF1ZSBwb3QgbGxlZ2lyIHBlciBhIGxlcyB0ZWNub2xvZ2llcyBk4oCZYXNzaXN0w6huY2lhIiwKICAgICAgImRlZmF1bHQiOiAiVGV4dCBjb21wbGV0IHF1ZSBlcyBwb3QgbGxlZ2lyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkV0aXF1ZXRhIHBlciBhbCB0ZXh0IGVuIHF1w6ggZXMgcG9kZW4gbWFyY2FyIHBhcmF1bGVzIHBlciBhIHRlY25vbG9naWVzIGTigJlhc3Npc3TDqG5jaWEiLAogICAgICAiZGVmYXVsdCI6ICJUZXh0IGNvbXBsZXQgZW4gcXXDqCBlcyBwb2RlbiBtYXJjYXIgbGVzIHBhcmF1bGVzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlTDrXRvbCBkZWwgbW9kZSBkZSBzb2x1Y2nDsyBwZXIgYSB0ZWNub2xvZ2llcyBk4oCZYXNzaXN0w6huY2lhIiwKICAgICAgImRlZmF1bHQiOiAiTW9kZSBkZSBzb2x1Y2nDsyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUw610b2wgZGVsIG1vZGUgZGUgY29tcHJvdmFjacOzIHBlciBhIGxlcyB0ZWNub2xvZ2llcyBk4oCZYXNzaXN0w6huY2lhIiwKICAgICAgImRlZmF1bHQiOiAiU+KAmWVzdMOgIGNvbXByb3ZhbnQgZWwgbW9kZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZXNjcmlwY2nDsyBkZSBsYSB0ZWNub2xvZ2lhIGTigJlhc3Npc3TDqG5jaWEgcGVyIGFsIGJvdMOzIFwiQ29tcHJvdmFcIiIsCiAgICAgICJkZWZhdWx0IjogIkNvbXByb3ZhIGxlcyByZXNwb3N0ZXMuIExlcyByZXNwb3N0ZXMgZXMgbWFyY2FyYW4gY29tIGEgY29ycmVjdGVzLCBpbmNvcnJlY3RlcyBvIHNlbnNlIHJlc3Bvc3RhLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZXNjcmlwY2nDsyBkZSBsYSB0ZWNub2xvZ2lhIGTigJlhc3Npc3TDqG5jaWEgcGVyIGFsIGJvdMOzIFwiTW9zdHJhIGxhIHNvbHVjacOzXCIiLAogICAgICAiZGVmYXVsdCI6ICJNb3N0cmEgbGEgc29sdWNpw7MuIExhIHRhc2NhIGVzIG1hcmNhcsOgIGFtYiBsYSBzZXZhIHNvbHVjacOzIGNvcnJlY3RhLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZXNjcmlwY2nDsyBkZSBsYSB0ZWNub2xvZ2lhIGTigJlhc3Npc3TDqG5jaWEgcGVyIGFsIGJvdMOzIFwiVG9ybmEtaG8gYSBwcm92YXJcIiIsCiAgICAgICJkZWZhdWx0IjogIkludGVudGEgZGUgbm91IGxhIHRhc2NhLiBFc2JvcnJhIHRvdGVzIGxlcyByZXNwb3N0ZXMgaSBjb21lbsOnYSBsYSB0YXNjYSBkZSBub3UuIgogICAgfQogIF0KfQo="],"libraries\/H5P.MarkTheWords-1.11\/language\/cs.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJNw6lkaWEiLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJUeXAiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIlZvbGl0ZWxuw6EgbcOpZGlhIHpvYnJhemVuw6EgbmFkIG90w6F6a291LiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJaYWvDoXphdCB6dsSbdMWhZW7DrSBvYnJhenUiCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUG9waXMgw7psb2h5IiwKICAgICAgImRlc2NyaXB0aW9uIjogIlBvcGnFoXRlLCBqYWsgYnkgbcSbbCB1xb5pdmF0ZWwgw7psb2h1IHZ5xZllxaFpdC4iLAogICAgICAicGxhY2Vob2xkZXIiOiAiS2xpa27Em3RlIG5hIHbFoWVjaG5hIHNsb3Zlc2EgdiBuw6FzbGVkdWrDrWPDrW0gdGV4dHUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvdsOpIHBvbGUiLAogICAgICAicGxhY2Vob2xkZXIiOiAiVG8gamUgb2Rwb3bEm8SPOiAqb2Rwb3bEm8SPKi4iLAogICAgICAiaW1wb3J0YW50IjogewogICAgICAgICJkZXNjcmlwdGlvbiI6ICI8dWw+PGxpPk96bmHEjWVuw6Egc2xvdmEganNvdSBwxZlpZMOhbmEgcyBodsSbemRpxI1rb3UgKCopLjwvbGk+PGxpPkh2xJt6ZGnEjWt5IGx6ZSBwxZlpZGF0IGRvIG96bmHEjWVuw71jaCBzbG92IHDFmWlkw6Fuw61tIGRhbMWhw60gaHbEm3pkacSNa3ksICpzcHLDoXZuw6lzbG92byoqKiA9Jmd0OyBzcHLDoXZuw6lzbG92byouPC9saT48L3VsPiIsCiAgICAgICAgImV4YW1wbGUiOiAiU3Byw6F2bsOhIHNsb3ZhIGpzb3UgdGFrdG8gb3puYcSNZW5hOiAqc3Byw6F2bsOpc2xvdm8qLCB0YWt0byBqZSBuYXBzw6FuYSBodsSbemRpxI1rYTogKnNwcsOhdm7DqXNsb3ZvKioqLiIKICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNlbGtvdsOhIHpwxJt0bsOhIHZhemJhIiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAid2lkZ2V0cyI6IFsKICAgICAgICAgICAgewogICAgICAgICAgICAgICJsYWJlbCI6ICJWw71jaG96w60iCiAgICAgICAgICAgIH0KICAgICAgICAgIF0sCiAgICAgICAgICAibGFiZWwiOiAiRGVmaW51anRlIHZsYXN0bsOtIHpwxJt0bm91IHZhemJ1IHBybyBqYWvDvWtvbGkgcm96c2FoIHNrw7NyZSIsCiAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiS2xlcG51dMOtbSBuYSB0bGHEjcOtdGtvIFwiUMWZaWRhdCByb3pzYWhcIiBwxZlpZMOhdGUgbGlib3ZvbG7DvSBwb8SNZXQgcm96c2Foxa8uIFDFmcOta2xhZDogMC0yMCUgxaFwYXRuw6kgc2vDs3JlLCAyMS05MSUgcHLFr23Em3Juw6kgc2vDs3JlLCA5MS0xMDAlIHbDvWJvcm7DqSBza8OzcmUhIiwKICAgICAgICAgICJlbnRpdHkiOiAicm96c2FoIiwKICAgICAgICAgICJmaWVsZCI6IHsKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiUm96c2FoIHNrw7NyZSIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHt9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJacMSbdG7DoSB2YXpiYSBwcm8gZGVmaW5vdmFuw70gcm96c2FoIHNrw7NyZSIsCiAgICAgICAgICAgICAgICAicGxhY2Vob2xkZXIiOiAiVnlwbMWIdGUgenDEm3Rub3UgdmF6YnUiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUG9waXNlayB0bGHEjcOtdGthIFwiWmtvbnRyb2xvdmF0XCIiLAogICAgICAiZGVmYXVsdCI6ICJaa29udHJvbG92YXQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJTdWJtaXRcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJTdWJtaXQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCB0bGHEjcOtdGthIFwiT3Bha292YXRcIiAiLAogICAgICAiZGVmYXVsdCI6ICJPcGFrb3ZhdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IHRsYcSNw610a2EgXCJab2JyYXppdCDFmWXFoWVuw61cIiIsCiAgICAgICJkZWZhdWx0IjogIlpvYnJheml0IMWZZcWhZW7DrSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJOYXN0YXZlbsOtIGNob3bDoW7DrS4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVHl0byBtb8W+bm9zdGkgdsOhbSB1bW\/Fvm7DrSDFmcOtZGl0LCBqYWsgc2UgYnVkZSDDumxvaGEgY2hvdmF0LiIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIlBvdm9saXQgdGxhxI3DrXRrbyBcIk9wYWtvdmF0XCIiCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiUG92b2xpdCB0bGHEjcOtdGtvIFwiWm9icmF6aXQgxZllxaFlbsOtXCIiCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiUG92b2xpdCB0bGHEjcOtdGtvIFwiWmtvbnRyb2xvdmF0XCIiCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiWm9icmF6aXQgYm9keSIsCiAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiWm9icmF6aXQgYm9keSB6w61za2Fuw6kgemEga2HFvmRvdSBvZHBvdsSbxI8uIgogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgc3Byw6F2bsOpIG9kcG92xJtkaSIsCiAgICAgICJkZWZhdWx0IjogIlNwcsOhdm7EmyEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCBwb3XFvsOtdmFuw70gayBvem5hxI1lbsOtIHNwcsOhdm5vc3RpIG9kcG92xJtkaSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IG5lc3Byw6F2bsOpIG9kcG92xJtkaSIsCiAgICAgICJkZWZhdWx0IjogIk5lc3Byw6F2bsSbISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHBvdcW+w612YW7DvSBrIG96bmHEjWVuw60gbmVzcHLDoXZub3N0aSBvZHBvdsSbZGkiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2h5YsSbasOtY8OtIHRleHQgb2Rwb3bEm2RpIiwKICAgICAgImRlZmF1bHQiOiAiT2Rwb3bEm8SPIG5lYnlsYSBuYWxlemVuYSEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCBwb3XFvsOtdmFuw70gayBvem5hxI1lbsOtLCDFvmUgY2h5YsOtIG9kcG92xJvEjyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJQb3BpcyBwcm8gem9icmF6ZW7DrSDFmWXFoWVuw60iLAogICAgICAiZGVmYXVsdCI6ICLDmmxvaGEgamUgYWt0dWFsaXpvdsOhbmEgdGFrLCBhYnkgb2JzYWhvdmFsYSDFmWXFoWVuw60uIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRlbnRvIHRleHQgxZnDrWvDoSB1xb5pdmF0ZWxpLCDFvmUgw7prb2x5IGJ5bHkgxZllxaFlbsOtbSBha3R1YWxpem92w6FueS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG92w6kgem7DoXpvcm7Em27DrSB2w71zbGVka292w6kgbGnFoXR5IHBybyB0eSwga3RlxZnDrSBwb3XFvsOtdmFqw60gxI10ZWPDrSB6YcWZw616ZW7DrSIsCiAgICAgICJkZWZhdWx0IjogIlrDrXNrYWwganN0ZSA6bnVtIHplIDp0b3RhbCBib2TFryIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJQb3Bpc2VrIHBybyBwbG7EmyDEjWl0ZWxuw70gdGV4dCBwcm8gcG9kcMWvcm7DqSB0ZWNobm9sb2dpZSIsCiAgICAgICJkZWZhdWx0IjogIlBsbsSbIMSNaXRlbG7DvSB0ZXh0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlBvcGlzZWsgcHJvIHRleHQsIGtkZSBsemUgb3puYcSNaXQgc2xvdmEgcHJvIHBvbW9jbsOpIHRlY2hub2xvZ2llIiwKICAgICAgImRlZmF1bHQiOiAiQ2Vsw70gdGV4dCwga2RlIHNsb3ZhIGx6ZSBvem5hxI1pdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJaw6FobGF2w60gcmXFvmltdSDFmWXFoWVuw60gcHJvIHBvZHDFr3Juw6kgdGVjaG5vbG9naWUiLAogICAgICAiZGVmYXVsdCI6ICJSZcW+aW0gxZllxaFlbsOtIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlrDoWhsYXbDrSBrb250cm9sbsOtaG8gcmXFvmltdSBwcm8gcG9kcMWvcm7DqSB0ZWNobm9sb2dpZSIsCiAgICAgICJkZWZhdWx0IjogIktvbnRyb2xuw60gcmXFvmltIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlBvcGlzZWsgcG9kcMWvcm7DqSB0ZWNobm9sb2dpZSBwcm8gdGxhxI3DrXRrbyDigJ5aa29udHJvbG92YXTigJwiLAogICAgICAiZGVmYXVsdCI6ICJaa29udHJvbG92YXQgb2Rwb3bEm2RpLiBPZHBvdsSbZGkgYnVkb3Ugb3puYcSNZW55IGpha28gc3Byw6F2bsOpLCBuZXNwcsOhdm7DqSBuZWJvIG5lem9kcG92xJt6ZW7DqS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUG9waXNlayBwb2Rwxa9ybsOpIHRlY2hub2xvZ2llIHBybyB0bGHEjcOtdGtvIOKAnlpvYnJheml0IMWZZcWhZW7DreKAnCIsCiAgICAgICJkZWZhdWx0IjogIlpvYnJheml0IMWZZcWhZW7DrS4gw5prb2wgYnVkZSB6b2JyYXplbiBzZSBzcHLDoXZuw71tIMWZZcWhZW7DrW0uIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlBvcGlzZWsgcG9kcMWvcm7DqSB0ZWNobm9sb2dpZSBwcm8gdGxhxI3DrXRrbyDigJ5PcGFrb3ZhdOKAnCIsCiAgICAgICJkZWZhdWx0IjogIk9wYWtvdmF0IMO6a29sLiBSZXNldG92YXQgdsWhZWNobnkgb2Rwb3bEm2RpIGEgc3B1c3RpdCDDumxvaHUgem5vdnUuIgogICAgfQogIF0KfQo="],"libraries\/H5P.MarkTheWords-1.11\/language\/da.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJNZWRpZSIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIlR5cGUiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIlZpcyB2YWxnZnJpdCBtZWRpZSBvdmVyIHNww7hyZ3Ntw6VsZXQuIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkRlYWt0aXZlciB6b29tIGFmIGJpbGxlZGUiCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGFzayBkZXNjcmlwdGlvbiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJEZXNjcmliZSBob3cgdGhlIHVzZXIgc2hvdWxkIHNvbHZlIHRoZSB0YXNrLiIsCiAgICAgICJwbGFjZWhvbGRlciI6ICJDbGljayBvbiBhbGwgdGhlIHZlcmJzIGluIHRoZSB0ZXh0IHRoYXQgZm9sbG93cy4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dGZpZWxkIiwKICAgICAgInBsYWNlaG9sZGVyIjogIlRoaXMgaXMgYW4gYW5zd2VyOiAqYW5zd2VyKi4iLAogICAgICAiaW1wb3J0YW50IjogewogICAgICAgICJkZXNjcmlwdGlvbiI6ICI8dWw+PGxpPk1hcmtlZCB3b3JkcyBhcmUgYWRkZWQgd2l0aCBhbiBhc3RlcmlzayAoKikuPC9saT48bGk+QXN0ZXJpc2tzIGNhbiBiZSBhZGRlZCB3aXRoaW4gbWFya2VkIHdvcmRzIGJ5IGFkZGluZyBhbm90aGVyIGFzdGVyaXNrLCAqY29ycmVjdHdvcmQqKiogPSZndDsgY29ycmVjdHdvcmQqLjwvbGk+PC91bD4iLAogICAgICAgICJleGFtcGxlIjogIlRoZSBjb3JyZWN0IHdvcmRzIGFyZSBtYXJrZWQgbGlrZSB0aGlzOiAqY29ycmVjdHdvcmQqLCBhbiBhc3RlcmlzayBpcyB3cml0dGVuIGxpa2UgdGhpczogKmNvcnJlY3R3b3JkKioqLiIKICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk92ZXJhbGwgRmVlZGJhY2siLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJ3aWRnZXRzIjogWwogICAgICAgICAgICB7CiAgICAgICAgICAgICAgImxhYmVsIjogIkRlZmF1bHQiCiAgICAgICAgICAgIH0KICAgICAgICAgIF0sCiAgICAgICAgICAibGFiZWwiOiAiRGVmaW5lIGN1c3RvbSBmZWVkYmFjayBmb3IgYW55IHNjb3JlIHJhbmdlIiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJDbGljayB0aGUgXCJBZGQgcmFuZ2VcIiBidXR0b24gdG8gYWRkIGFzIG1hbnkgcmFuZ2VzIGFzIHlvdSBuZWVkLiBFeGFtcGxlOiAwLTIwJSBCYWQgc2NvcmUsIDIxLTkxJSBBdmVyYWdlIFNjb3JlLCA5MS0xMDAlIEdyZWF0IFNjb3JlISIsCiAgICAgICAgICAiZW50aXR5IjogInJhbmdlIiwKICAgICAgICAgICJmaWVsZCI6IHsKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiU2NvcmUgUmFuZ2UiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7fSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiRmVlZGJhY2sgZm9yIGRlZmluZWQgc2NvcmUgcmFuZ2UiLAogICAgICAgICAgICAgICAgInBsYWNlaG9sZGVyIjogIkZpbGwgaW4gdGhlIGZlZWRiYWNrIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIFwiQ2hlY2tcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJDaGVjayIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBcIlN1Ym1pdFwiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlN1Ym1pdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBcIlJldHJ5XCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiUmV0cnkiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJTaG93IHNvbHV0aW9uXCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiU2hvdyBzb2x1dGlvbiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZWhhdmlvdXJhbCBzZXR0aW5ncy4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGhlc2Ugb3B0aW9ucyB3aWxsIGxldCB5b3UgY29udHJvbCBob3cgdGhlIHRhc2sgYmVoYXZlcy4iLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJFbmFibGUgXCJSZXRyeVwiIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkVuYWJsZSBcIlNob3cgc29sdXRpb25cIiBidXR0b24iCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiRW5hYmxlIFwiQ2hlY2tcIiBidXR0b24iCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiU2hvdyBzY29yZSBwb2ludHMiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIlNob3cgcG9pbnRzIGVhcm5lZCBmb3IgZWFjaCBhbnN3ZXIuIgogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNvcnJlY3QgYW5zd2VyIHRleHQiLAogICAgICAiZGVmYXVsdCI6ICJDb3JyZWN0ISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHVzZWQgdG8gaW5kaWNhdGUgdGhhdCBhbiBhbnN3ZXIgaXMgY29ycmVjdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbmNvcnJlY3QgYW5zd2VyIHRleHQiLAogICAgICAiZGVmYXVsdCI6ICJJbmNvcnJlY3QhIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdXNlZCB0byBpbmRpY2F0ZSB0aGF0IGFuIGFuc3dlciBpcyBpbmNvcnJlY3QiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWlzc2VkIGFuc3dlciB0ZXh0IiwKICAgICAgImRlZmF1bHQiOiAiQW5zd2VyIG5vdCBmb3VuZCEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB1c2VkIHRvIGluZGljYXRlIHRoYXQgYW4gYW5zd2VyIGlzIG1pc3NpbmciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRGVzY3JpcHRpb24gZm9yIERpc3BsYXkgU29sdXRpb24iLAogICAgICAiZGVmYXVsdCI6ICJUYXNrIGlzIHVwZGF0ZWQgdG8gY29udGFpbiB0aGUgc29sdXRpb24uIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRoaXMgdGV4dCB0ZWxscyB0aGUgdXNlciB0aGF0IHRoZSB0YXNrcyBoYXMgYmVlbiB1cGRhdGVkIHdpdGggdGhlIHNvbHV0aW9uLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0dWFsIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBzY29yZSBiYXIgZm9yIHRob3NlIHVzaW5nIGEgcmVhZHNwZWFrZXIiLAogICAgICAiZGVmYXVsdCI6ICJZb3UgZ290IDpudW0gb3V0IG9mIDp0b3RhbCBwb2ludHMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTGFiZWwgZm9yIHRoZSBmdWxsIHJlYWRhYmxlIHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJGdWxsIHJlYWRhYmxlIHRleHQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTGFiZWwgZm9yIHRoZSB0ZXh0IHdoZXJlIHdvcmRzIGNhbiBiZSBtYXJrZWQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJGdWxsIHRleHQgd2hlcmUgd29yZHMgY2FuIGJlIG1hcmtlZCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJTb2x1dGlvbiBtb2RlIGhlYWRlciBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIlNvbHV0aW9uIG1vZGUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2hlY2tpbmcgbW9kZSBoZWFkZXIgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJDaGVja2luZyBtb2RlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFzc2lzdGl2ZSB0ZWNobm9sb2d5IGRlc2NyaXB0aW9uIGZvciBcIkNoZWNrXCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiQ2hlY2sgdGhlIGFuc3dlcnMuIFRoZSByZXNwb25zZXMgd2lsbCBiZSBtYXJrZWQgYXMgY29ycmVjdCwgaW5jb3JyZWN0LCBvciB1bmFuc3dlcmVkLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJBc3Npc3RpdmUgdGVjaG5vbG9neSBkZXNjcmlwdGlvbiBmb3IgXCJTaG93IFNvbHV0aW9uXCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiU2hvdyB0aGUgc29sdXRpb24uIFRoZSB0YXNrIHdpbGwgYmUgbWFya2VkIHdpdGggaXRzIGNvcnJlY3Qgc29sdXRpb24uIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFzc2lzdGl2ZSB0ZWNobm9sb2d5IGRlc2NyaXB0aW9uIGZvciBcIlJldHJ5XCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiUmV0cnkgdGhlIHRhc2suIFJlc2V0IGFsbCByZXNwb25zZXMgYW5kIHN0YXJ0IHRoZSB0YXNrIG92ZXIgYWdhaW4uIgogICAgfQogIF0KfQo="],"libraries\/H5P.MarkTheWords-1.11\/language\/de.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJNZWRpZW4iLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJUeXAiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIk1lZGl1bSwgZGFzIHdhaGx3ZWlzZSBvYmVyaGFsYiBkZXIgQXVmZ2FiZSBhbmdlemVpZ3Qgd2lyZC4iCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiQmlsZC1ab29tIGRlYWt0aXZpZXJlbiIKICAgICAgICB9CiAgICAgIF0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJBdWZnYWJlbmJlc2NocmVpYnVuZyIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJCZXNjaHJlaWJ1bmcsIHdpZSBkaWUgTGVybmVuZGVuIGRpZSBBdWZnYWJlIGzDtnNlbiBzb2xsdGVuLiBXaXJkIMO8YmVyIGRlbSBNZWRpdW0gYW5nZXplaWd0LiIsCiAgICAgICJwbGFjZWhvbGRlciI6ICJLbGlja2UgYXVmIGFsbGUgVmVyYmVuIGltIGZvbGdlbmRlbiBUZXh0LiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0ZmVsZCIsCiAgICAgICJwbGFjZWhvbGRlciI6ICJEYXMgaXN0IGVpbmUgQW50d29ydDogKkFudHdvcnQqLiIsCiAgICAgICJpbXBvcnRhbnQiOiB7CiAgICAgICAgImRlc2NyaXB0aW9uIjogIjx1bD48bGk+RGllIHp1IGZpbmRlbmRlbiBXw7ZydGVyIHdlcmRlbiBtaXQgZWluZW0gU3Rlcm5jaGVuICgqKSBtYXJraWVydC48L2xpPjxsaT5Tb2xsIGluIGVpbmVtIHp1IGZpbmRlbmRlbiBXb3J0IGVpbiBTdGVybmNoZW4gdmVyd2VuZGV0IHdlcmRlbiwgZ2lidCBtYW4gKiogZWluLjwvbGk+PC91bD4iLAogICAgICAgICJleGFtcGxlIjogIlJpY2h0aWdlIFfDtnJ0ZXIgd2VyZGVuIHdpZSBmb2xndCBtYXJraWVydDogKnJpY2h0aWdlc3dvcnQqLiBFaW4gU3Rlcm5jaGVuIGluIGVpbmVtIHJpY2h0aWdlbiBXb3J0IGF1ZiBkaWVzZSBXZWlzZTogKnJpY2h0aWdlcyoqV29ydCouIgogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiR2VzYW10csO8Y2ttZWxkdW5nIiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAid2lkZ2V0cyI6IFsKICAgICAgICAgICAgewogICAgICAgICAgICAgICJsYWJlbCI6ICJFaW5nYWJlbWFza2UiCiAgICAgICAgICAgIH0KICAgICAgICAgIF0sCiAgICAgICAgICAibGFiZWwiOiAiTGVnZSBSw7xja21lbGR1bmdlbiBmw7xyIGVpbnplbG5lIFB1bmt0ZWJlcmVpY2hlIGZlc3QiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIktsaWNrZSBhdWYgZGVuIFwiQmVyZWljaCBoaW56dWbDvGdlblwiLUJ1dHRvbiwgdW0gc28gdmllbGUgQmVyZWljaGUgaGluenV6dWbDvGdlbiwgd2llIGR1IGJyYXVjaHN0LiBCZWlzcGllbDogMC0yMCUgU2NobGVjaHRlIFB1bmt0emFobCwgMjEtOTElIER1cmNoc2Nobml0dGxpY2hlIFB1bmt0emFobCwgOTEtMTAwJSBHcm\/Dn2FydGlnZSBQdW5rdHphaGwhIiwKICAgICAgICAgICJlbnRpdHkiOiAiQmVyZWljaCIsCiAgICAgICAgICAiZmllbGQiOiB7CiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlB1bmt0ZWJlcmVpY2giCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7fSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiUsO8Y2ttZWxkdW5nIGbDvHIgamV3ZWlsaWdlbiBQdW5rdGViZXJlaWNoIiwKICAgICAgICAgICAgICAgICJwbGFjZWhvbGRlciI6ICJUcmFnZSBkaWUgUsO8Y2ttZWxkdW5nIGVpbiIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICB9CiAgICAgIF0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZXNjaHJpZnR1bmcgZGVzIFwiw5xiZXJwcsO8ZmVuXCItQnV0dG9ucyIsCiAgICAgICJkZWZhdWx0IjogIsOcYmVycHLDvGZlbiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZXNjaHJpZnR1bmcgZGVzIFwiQWJzZW5kZW5cIi1CdXR0b25zIiwKICAgICAgImRlZmF1bHQiOiAiQWJzZW5kZW4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQmVzY2hyaWZ0dW5nIGRlcyBcIldpZWRlcmhvbGVuXCItQnV0dG9ucyIsCiAgICAgICJkZWZhdWx0IjogIldpZWRlcmhvbGVuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkJlc2NocmlmdHVuZyBkZXMgXCJMw7ZzdW5nIGFuemVpZ2VuXCItQnV0dG9ucyIsCiAgICAgICJkZWZhdWx0IjogIkzDtnN1bmcgYW56ZWlnZW4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVmVyaGFsdGVuc2VpbnN0ZWxsdW5nZW4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiSGllciBrYW5uc3QgRHUgZWluc3RlbGxlbiwgd2llIHNpY2ggZGllIEF1ZmdhYmUgdmVyaMOkbHQuIiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiXCJXaWVkZXJob2xlblwiIGVybGF1YmVuIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIlwiTMO2c3VuZyBhbnplaWdlblwiIGVybcO2Z2xpY2hlbiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJcIsOcYmVycHLDvGZlblwiLUJ1dHRvbiBhbnplaWdlbiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJCZXB1bmt0dW5nc2RldGFpbHMgYW56ZWlnZW4iLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIlplaWd0IGRpZSBmw7xyIGplZGUgQW50d29ydCB2ZXJnZWJlbmVuIFB1bmt0ZSBhbi4iCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmw7xyIHJpY2h0aWdlIEFudHdvcnRlbiIsCiAgICAgICJkZWZhdWx0IjogIlJpY2h0aWchIiwKICAgICAgImRlc2NyaXB0aW9uIjogIk1pdCBkaWVzZW0gVGV4dCB3aXJkIGFuZ2V6ZWlndCwgZGFzcyBkaWUgQW50d29ydCByaWNodGlnIHdhci4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmw7xyIGZhbHNjaGUgQW50d29ydGVuIiwKICAgICAgImRlZmF1bHQiOiAiRmFsc2NoISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJNaXQgZGllc2VtIFRleHQgd2lyZCBhbmdlemVpZ3QsIGRhc3MgZGllIEFudHdvcnQgZmFsc2NoIHdhci4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmw7xyIMO8YmVyZ2FuZ2VuZSBBbnR3b3J0ZW4iLAogICAgICAiZGVmYXVsdCI6ICJOaWNodCBnZWZ1bmRlbiEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiTWl0IGRpZXNlbSBUZXh0IHdpcmQgYW5nZXplaWd0LCBkYXNzIGRhcyBXb3J0IGjDpHR0ZSBhdXNnZXfDpGhsdCB3ZXJkZW4gc29sbGVuLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJOYWNocmljaHQsIHdlbm4gZGllIEzDtnN1bmcgYW5nZXplaWd0IHdpcmQiLAogICAgICAiZGVmYXVsdCI6ICJEaWUgTMO2c3VuZ2VuIHNpbmQgbnVuIGltIFRleHQgbWFya2llcnQuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIk1pdCBkaWVzZW0gVGV4dCB3aXJkIGFuZ2V6ZWlndCwgZGFzcyBudW4gZGllIHJpY2h0aWdlbiBMw7ZzdW5nZW4gYW5nZXplaWd0IHdlcmRlbi4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQW56ZWlnZXRleHQgZsO8ciBWb3JsZXNld2Vya3pldWdlIChCYXJyaWVyZWZyZWloZWl0KS4gOm51bSB3aXJkIGR1cmNoIGRpZSBlcnJlaWNodGVuIFB1bmt0ZSBlcnNldHp0LiA6dG90YWwgd2lyZCBkdXJjaCBkaWUgbWF4aW1hbCBtw7ZnbGljaGUgUHVua3R6YWhsIGVyc2V0enQuIiwKICAgICAgImRlZmF1bHQiOiAiRHUgaGFzdCA6bnVtIHZvbiA6dG90YWwgUHVua3RlbiBlcnJlaWNodC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiSGlud2VpcyBmw7xyIGRlbiBnZXNhbXRlbiBsZXNiYXJlbiBUZXh0IGbDvHIgVm9ybGVzZXdlcmt6ZXVnZSIsCiAgICAgICJkZWZhdWx0IjogIkdlc2FtdGVyIGxlc2JhcmVyIFRleHQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiSGlud2VpcyBhdWYgZGVuIGdlc2FtdGVuIFRleHQsIHdvIFfDtnJ0ZXIgbWFya2llcnQgd2VyZGVuIGvDtm5uZW4gZsO8ciBWb3JsZXNld2Vya3pldWdlIiwKICAgICAgImRlZmF1bHQiOiAiR2VzYW10ZXIgVGV4dCwgd28gV8O2cnRlciBtYXJraWVydCB3ZXJkZW4ga8O2bm5lbiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLDnGJlcnNjaHJpZnQgZGVzIEzDtnN1bmdzbW9kdXMgKEJhcnJpZXJlZnJlaWhlaXQpIiwKICAgICAgImRlZmF1bHQiOiAiTMO2c3VuZ3Ntb2R1cyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLDnGJlcnNjaHJpZnQgZGVzIEFudHdvcnRlbi3DnGJlcnByw7xmZW4tTW9kdXMgKEJhcnJpZXJlZnJlaWhlaXQpIiwKICAgICAgImRlZmF1bHQiOiAiQW50d29ydGVuIMO8YmVycHLDvGZlbi1Nb2R1cyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZXNjaHJlaWJ1bmcgZGVzIFwiw5xiZXJwcsO8ZmVuXCItQnV0dG9ucyAoZsO8ciBIaWxmc21pdHRlbCB6dXIgQmFycmllcmVmcmVpaGVpdCkiLAogICAgICAiZGVmYXVsdCI6ICJEaWUgQW50d29ydGVuIMO8YmVycHLDvGZlbi4gRGllIEF1c3dhaGxlbiB3ZXJkZW4gYWxzIHJpY2h0aWcsIGZhbHNjaCBvZGVyIGZlaGxlbmQgbWFya2llcnQuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkJlc2NocmVpYnVuZyBkZXMgXCJMw7ZzdW5nIGFuemVpZ2VuXCItQnV0dG9ucyAoZsO8ciBIaWxmc21pdHRlbCB6dXIgQmFycmllcmVmcmVpaGVpdCkiLAogICAgICAiZGVmYXVsdCI6ICJEaWUgTMO2c3VuZyBhbnplaWdlbi4gRGllIHJpY2h0aWdlbiBMw7ZzdW5nZW4gd2VyZGVuIGluIGRlciBBdWZnYWJlIGFuZ2V6ZWlndC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQmVzY2hyZWlidW5nIGRlcyBcIldpZWRlcmhvbGVuXCItQnV0dG9ucyAoZsO8ciBIaWxmc21pdHRlbCB6dXIgQmFycmllcmVmcmVpaGVpdCkiLAogICAgICAiZGVmYXVsdCI6ICJEaWUgQXVmZ2FiZSB3aWVkZXJob2xlbi4gQWxsZSBWZXJzdWNoZSB3ZXJkZW4genVyw7xja2dlc2V0enQgdW5kIGRpZSBBdWZnYWJlIHdpcmQgZXJuZXV0IGdlc3RhcnRldC4iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.MarkTheWords-1.11\/language\/el.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLOnM6tz4POvyIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIs6kz43PgM6\/z4IiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIs6gz4HOv8+DzrjOrs66zrcgzrzOrc+Dzr\/PhSDPgM+Bzr\/PgiDOtc68z4bOrM69zrnPg863IM+AzqzOvc+JIM6xz4DPjCDPhM63zr0gzrXPgc+Oz4TOt8+DzrcgKM+Az4HOv86xzrnPgc61z4TOuc66zqwpLiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICLOkc+AzrXOvc61z4HOs86\/z4DOv86vzrfPg863IM+EzrfPgiDOtc+AzrnOu86\/zrPOrs+CIHpvb20gzrPOuc6xIM+EzrfOvSDOtc65zrrPjM69zrEgz4TOt8+CIM61z4HPjs+EzrfPg863z4IiCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAizqDOtc+BzrnOs8+BzrHPhs6uIM6sz4POus63z4POt8+CIiwKICAgICAgImRlc2NyaXB0aW9uIjogIs6gzrXPgc65zrPPgc6sz4jPhM61IM+Az47PgiDOuM6xIM67z43Pg861zrkgzr8gz4fPgc6uz4PPhM63z4Igz4TOt869IM6sz4POus63z4POty4iLAogICAgICAicGxhY2Vob2xkZXIiOiAizprOrM69zrUgzrrOu865zrogz4POtSDPjM67zrEgz4TOsSDPgc6uzrzOsc+EzrEgz4PPhM6\/IM66zrXOr868zrXOvc6\/IM+Azr\/PhSDOsc66zr\/Ou86\/z4XOuM61zq8uIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIs6gzrXOtM6vzr8gzrrOtc65zrzOrc69zr\/PhSIsCiAgICAgICJwbGFjZWhvbGRlciI6ICLOkc+Fz4TOriDOtc6vzr3Osc65IM68zrnOsSDOsc+AzqzOvc+EzrfPg863OiAqYW5zd2VyKi4iLAogICAgICAiaW1wb3J0YW50IjogewogICAgICAgICJkZXNjcmlwdGlvbiI6ICI8dWw+PGxpPs6fzrkgz4POt868zrXOuc+JzrzOrc69zrXPgiDOu86tzr7Otc65z4Igz4DPgc6\/z4PPhM6vzrjOtc69z4TOsc65IM68zrUgzq3Ovc6xzr0gzrHPg8+EzrXPgc6vz4POus6\/LiAoKikuPC9saT48bGk+zpHOvSDPh8+BzrXOuc6szrbOtc+EzrHOuSDOvc6xIM+Hz4HOt8+DzrnOvM6\/z4DOv865zq7Pg861z4TOtSDPhM6\/zr0gzrHPg8+EzrXPgc6vz4POus6\/IM6zzrnOsSDOrM67zrvOvyDOu8+MzrPOvywgzr\/Pgc6vz4PPhM61IM60z43OvyDOsc+Dz4TOtc+Bzq\/Pg866zr\/Phc+CIM+Dz4TOtyDPg861zrnPgc6sLCDOtM63zrvOsc60zq4gKiogPSAqLjwvbGk+PC91bD4iLAogICAgICAgICJleGFtcGxlIjogIs6fzrkgz4PPic+Dz4TOrc+CIM67zq3Ovs61zrnPgiDPg863zrzOtc65z47Ovc6\/zr3PhM6xzrkgzq3PhM+Dzrk6ICrPg8+Jz4PPhM63zrvOrc6+zrcqLCDOrc69zrEgzrHPg8+EzrXPgc6vz4POus6\/z4Igz4DPgc6\/z4PPhM6vzrjOtc+EzrHOuSDPic+CIM61zr7Ors+COiAqz4PPic+Dz4TOt867zq3Ovs63KioqLiIKICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIs6jz4XOvc6\/zrvOuc66zq4gzrHOvc6xz4TPgc6\/z4bOv860z4zPhM63z4POtyIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgICAgIHsKICAgICAgICAgICAgICAibGFiZWwiOiAizpLOsc+DzrnOus+MIgogICAgICAgICAgICB9CiAgICAgICAgICBdLAogICAgICAgICAgImxhYmVsIjogIs6nzrHPgc6xzrrPhM63z4HOuc+DzrzPjM+CIM66zqzOuM61IM66zrvOr868zrHOus6xz4IgzrLOsc64zrzOv867zr\/Os86vzrHPgiIsCiAgICAgICAgICAiZGVzY3JpcHRpb24iOiAizprOrM69z4TOtSDOus67zrnOuiDPg8+Ezr8gzrrOv8+FzrzPgM6vIFwizqDPgc6\/z4POuM6uzrrOtyDOus67zq\/OvM6xzrrOsc+CXCIgzrPOuc6xIM69zrEgz4DPgc6\/z4POuM6tz4POtc+EzrUgz4zPg861z4IgzrrOu86vzrzOsc66zrXPgiDOriDOtM65zrHOss6xzrjOvM6vz4POtc65z4IgzrXPgM65zrjPhc68zrXOr8+EzrUuIM6gzrHPgc6szrTOtc65zrPOvM6xOiAwLTIwJSDOp86xzrzOt867zq4gzrLOsc64zrzOv867zr\/Os86vzrEsIDIxLTkxJSDOnM6tz4TPgc65zrEgzrLOsc64zrzOv867zr\/Os86vzrEsIDkxLTEwMCUgzpXOvs6xzrnPgc61z4TOuc66zq4gzrLOsc64zrzOv867zr\/Os86vzrEhIiwKICAgICAgICAgICJlbnRpdHkiOiAizrrOu865zrzOsc66zrHPgiIsCiAgICAgICAgICAiZmllbGQiOiB7CiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIs6SzrHOuM68zr\/Ou86\/zrPOr86xIgogICAgICAgICAgICAgIH0sCiAgICAgICAgICAgICAge30sCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIs6nzrHPgc6xzrrPhM63z4HOuc+DzrzPjM+CIiwKICAgICAgICAgICAgICAgICJwbGFjZWhvbGRlciI6ICLOo8+FzrzPgM67zrfPgc+Oz4PPhM61IM+Ezr\/OvSDPh86xz4HOsc66z4TOt8+BzrnPg868z4wiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAizpXPhM65zrrOrc+EzrEgzrrOv8+FzrzPgM65zr\/PjSBcIs6IzrvOtc6zz4fOv8+CXCIiLAogICAgICAiZGVmYXVsdCI6ICLOiM67zrXOs8+Hzr\/PgiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLOlc+EzrnOus6tz4TOsSDOus6\/z4XOvM+AzrnOv8+NIFwizqXPgM6\/zrLOv867zq5cIiIsCiAgICAgICJkZWZhdWx0IjogIs6lz4DOv86yzr\/Ou86uIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIs6Vz4TOuc66zq3PhM6xIM66zr\/Phc68z4DOuc6\/z40gXCLOlc+AzrHOvc6szrvOt8+IzrdcIiIsCiAgICAgICJkZWZhdWx0IjogIs6Vz4DOsc69zqzOu863z4jOtyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLOlc+EzrnOus6tz4TOsSDOus6\/z4XOvM+AzrnOv8+NIFwizpvPjc+DzrdcIiIsCiAgICAgICJkZWZhdWx0IjogIs6bz43Pg863IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIs6hz4XOuM68zq\/Pg861zrnPgiDOrM+DzrrOt8+DzrfPgiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLOkc+Fz4TOrc+CIM6\/zrkgz4HPhc64zrzOr8+DzrXOuc+CIM+DzrHPgiDOtc+AzrnPhM+Bzq3PgM6\/z4XOvSDOvc6xIM66zrHOuM6\/z4HOr8+DzrXPhM61IM+Ezr\/OvSDPhM+Bz4zPgM6\/IM67zrXOuc+Ezr\/Phc+BzrPOr86xz4Igz4TOt8+CIM6sz4POus63z4POt8+CLiIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIs6Vzr3Otc+BzrPOv8+Azr\/Or863z4POtyDOus6\/z4XOvM+AzrnOv8+NIFwizpXPgM6xzr3OrM67zrfPiM63XCIiCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAizpXOvc61z4HOs86\/z4DOv86vzrfPg863IM66zr\/Phc68z4DOuc6\/z40gXCLOm8+Nz4POt1wiIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIs6Vzr3Otc+BzrPOv8+Azr\/Or863z4POtyDOus6\/z4XOvM+AzrnOv8+NIFwizojOu861zrPPh86\/z4JcIiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICLOlc68z4bOrM69zrnPg863IM6yzrHOuM68zr\/Ou86\/zrPOr86xz4IiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIs6VzrzPhs6szr3Ouc+DzrcgzrLOsc64zrzPjs69IM+Azr\/PhSDOus61z4HOtM6vzrbOtc65IM6\/IM+Hz4HOrs+Dz4TOt8+CIM6zzrnOsSDOus6szrjOtSDOsc+AzqzOvc+EzrfPg863LiIKICAgICAgICB9CiAgICAgIF0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLOms61zq\/OvM61zr3OvyDOs865zrEgz4PPic+Dz4TOriDOsc+AzqzOvc+EzrfPg863IiwKICAgICAgImRlZmF1bHQiOiAizqPPic+Dz4TPjCEiLAogICAgICAiZGVzY3JpcHRpb24iOiAizprOtc6vzrzOtc69zr8gz4DOv8+FIM+Hz4HOt8+DzrnOvM6\/z4DOv865zrXOr8+EzrHOuSDOs865zrEgzr3OsSDOtM63zrvPjs+DzrXOuSDPjM+EzrkgzrzOuc6xIM6xz4DOrM69z4TOt8+DzrcgzrXOr869zrHOuSDPg8+Jz4PPhM6uIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIs6azrXOr868zrXOvc6\/IM6zzrnOsSDOu86szrjOv8+CIM6xz4DOrM69z4TOt8+DzrciLAogICAgICAiZGVmYXVsdCI6ICLOm86szrjOv8+CISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLOms61zq\/OvM61zr3OvyDPgM6\/z4Ugz4fPgc63z4POuc68zr\/PgM6\/zrnOtc6vz4TOsc65IM6zzrnOsSDOvc6xIM60zrfOu8+Oz4POtc65IM+Mz4TOuSDOvM65zrEgzrHPgM6szr3PhM63z4POtyDOtc6vzr3Osc65IM67zqzOuM6\/z4IiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAizprOtc6vzrzOtc69zr8gzrPOuc6xIM6xz4DOrM69z4TOt8+Dzrcgz4DOv8+FIM67zrXOr8+AzrXOuSIsCiAgICAgICJkZWZhdWx0IjogIs6UzrXOvSDOsc+AzrHOvc+Ezq7OuM63zrrOtSEiLAogICAgICAiZGVzY3JpcHRpb24iOiAizprOtc6vzrzOtc69zr8gz4DOv8+FIM+Hz4HOt8+DzrnOvM6\/z4DOv865zrXOr8+EzrHOuSDOs865zrEgzr3OsSDOtM63zrvPjs+DzrXOuSDPjM+EzrkgzrzOuc6xIM6xz4DOrM69z4TOt8+DzrcgzrvOtc6vz4DOtc65IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIs6gzrXPgc65zrPPgc6xz4bOriDOs865zrEgXCLOlc68z4bOrM69zrnPg863IM6bz43Pg863z4JcIiIsCiAgICAgICJkZWZhdWx0IjogIs6XIM6sz4POus63z4POtyDOtc69zrfOvM61z4HPjs69zrXPhM6xzrkgz47Pg8+EzrUgzr3OsSDPgM61z4HOuc6tz4fOtc65IM+EzrcgzrvPjc+DzrcuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIs6Rz4XPhM+MIM+Ezr8gzrrOtc6vzrzOtc69zr8gzrXOvc63zrzOtc+Bz47Ovc61zrkgz4TOv869IM+Hz4HOrs+Dz4TOtyDPjM+Ezrkgzr\/OuSDOsc+DzrrOrs+DzrXOuc+CIM61zrzPhs6xzr3Or862zr\/Phc69IM+AzrvOrc6\/zr0gzrrOsc65IM+EzrcgzrvPjc+DzrcuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIs6azrXOuc68zrXOvc65zrrOriDOsc+Az4zOtM6\/z4POtyDPhM63z4IgzrzPgM6sz4HOsc+CIM6yzrHOuM68zr\/Ou86\/zrPOr86xz4IgzrPOuc6xIM+Mz4POv8+Fz4Igz4fPgc63z4POuc68zr\/PgM6\/zrnOv8+Nzr0gzrHOus6\/z4XPg8+EzrnOus6uIM+Fz4DOv86yzr\/Ors64zrfPg863IiwKICAgICAgImRlZmF1bHQiOiAizojPh861zrnPgiA6bnVtIM6xz4DPjCA6dG90YWwgzrLOsc64zrzOv8+Nz4IiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAizpXPhM65zrrOrc+EzrEgz4DOu86uz4HPic+CIM6xzr3Osc6zzr3Pjs+DzrnOvM6\/z4UgzrrOtc65zrzOrc69zr\/PhSDOs865zrEgz4XPgM6\/z4PPhM63z4HOuc66z4TOuc66zq3PgiDPhM61z4fOvc6\/zrvOv86zzq\/Otc+CIiwKICAgICAgImRlZmF1bHQiOiAizqDOu86uz4HPic+CIM6xzr3Osc6zzr3Pjs+DzrnOvM6\/IM66zrXOr868zrXOvc6\/IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIs6Vz4TOuc66zq3PhM6xIM66zrXOuc68zq3Ovc6\/z4UgzrzOtSDOu86tzr7Otc65z4Igz4DOv8+FIM68z4DOv8+Bzr\/Pjc69IM69zrEgz4POt868zrXOuc+JzrjOv8+Nzr0gzrPOuc6xIM+Fz4DOv8+Dz4TOt8+BzrnOus+EzrnOus6tz4Igz4TOtc+Hzr3Ov867zr\/Os86vzrXPgiIsCiAgICAgICJkZWZhdWx0IjogIs6gzrvOrs+BzrXPgiDOus61zq\/OvM61zr3OvyDOvM61IM67zq3Ovs61zrnPgiDPgM6\/z4UgzrzPgM6\/z4HOv8+Nzr0gzr3OsSDPg863zrzOtc65z4nOuM6\/z43OvSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLOlc+EzrnOus6tz4TOsSBcIs66zrHPhM6sz4PPhM6xz4POt8+CIM67z43Pg863z4JcIiDOs865zrEgz4XPgM6\/z4PPhM63z4HOuc66z4TOuc66zq3PgiDPhM61z4fOvc6\/zrvOv86zzq\/Otc+CIiwKICAgICAgImRlZmF1bHQiOiAizprOsc+EzqzPg8+EzrHPg863IM67z43Pg863z4IiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAizpXPhM65zrrOrc+EzrEgXCLOus6xz4TOrM+Dz4TOsc+DzrfPgiDOtc67zq3Os8+Hzr\/PhVwiIM6zzrnOsSDPhc+Azr\/Pg8+EzrfPgc65zrrPhM65zrrOrc+CIM+EzrXPh869zr\/Ou86\/zrPOr861z4IiLAogICAgICAiZGVmYXVsdCI6ICLOms6xz4TOrM+Dz4TOsc+DzrcgzrXOu86tzrPPh86\/z4UiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAizqDOtc+BzrnOs8+BzrHPhs6uIM+Fz4DOv8+Dz4TOt8+BzrnOus+EzrnOus+Ozr0gz4TOtc+Hzr3Ov867zr\/Os865z47OvSDOs865zrEgz4TOvyDPgM67zq7Ous+Ez4HOvyBcIs6IzrvOtc6zz4fOv8+CXCIiLAogICAgICAiZGVmYXVsdCI6ICLOiM67zrXOs8+Hzr\/PgiDOsc+AzrHOvc+Ezq7Pg861z4nOvS4gzp\/OuSDOsc+AzrHOvc+Ezq7Pg861zrnPgiDOuM6xIM68zrHPgc66zrHPgc65z4PPhM6\/z43OvSDPic+CIM+Dz4nPg8+Ezq3PgiwgzrvOrM64zr\/PgiDOus6xzrkgzrzOtyDOsc+AzrHOvc+EzrfOvM6tzr3Otc+CLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLOoM61z4HOuc6zz4HOsc+Gzq4gz4XPgM6\/z4PPhM63z4HOuc66z4TOuc66z47OvSDPhM61z4fOvc6\/zrvOv86zzrnPjs69IM6zzrnOsSDPhM6\/IM+AzrvOrs66z4TPgc6\/IFwizpvPjc+DzrdcIiIsCiAgICAgICJkZWZhdWx0IjogIs6gz4HOv86yzr\/Ou86uIM+EzrfPgiDOu8+Nz4POt8+CLiDOlyDOrM+DzrrOt8+DzrcgzrjOsSDOtc+AzrnPg863zrzOsc69zrjOtc6vIM68zrUgz4TOt869IM+Dz4nPg8+Ezq4gzrHPgM6szr3PhM+DzrcuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIs6gzrXPgc65zrPPgc6xz4bOriDPhc+Azr\/Pg8+EzrfPgc65zrrPhM65zrrPjs69IM+EzrXPh869zr\/Ou86\/zrPOuc+Ozr0gzrPOuc6xIM+Ezr8gz4DOu86uzrrPhM+Bzr8gXCLOlc+AzrHOvc6szrvOt8+IzrdcIiIsCiAgICAgICJkZWZhdWx0IjogIs6Vz4DOsc69zqzOu863z4jOtyDPhM63z4IgzrXPgc6zzrHPg86vzrHPgi4gzpXPgM6xzr3Osc+Gzr\/Pgc6sIM+MzrvPic69IM+Ez4nOvSDOsc+AzrHOvc+Ezq7Pg861z4nOvSDOus6xzrkgzq3Ovc6xz4HOvs63IM6xz4DPjCDPhM63zr0gzrHPgc+Hzq4uIgogICAgfQogIF0KfQo="],"libraries\/H5P.MarkTheWords-1.11\/language\/es.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJNZWRpb3MiLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJUaXBvIiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJNZWRpb3Mgb3BjaW9uYWxlcyBtb3N0cmFkb3MgZW5jaW1hIGRlIGxhIHByZWd1bnRhLiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJEZXNoYWJpbGl0YXIgYWNlcmNhbWllbnRvIGRlIGltYWdlbiIKICAgICAgICB9CiAgICAgIF0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZXNjcmlwY2nDs24gZGUgbGEgdGFyZWEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRGVzY3JpYmUgY8OzbW8gZGViZXLDrWEgcmVzb2x2ZXIgbGEgdGFyZWEgZWwgdXN1YXJpby4iLAogICAgICAicGxhY2Vob2xkZXIiOiAiSGF6IGNsaWMgZW4gdG9kb3MgbG9zIHZlcmJvcyBkZWwgc2lndWllbnRlIHRleHRvLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDYW1wbyBkZSB0ZXh0byIsCiAgICAgICJwbGFjZWhvbGRlciI6ICJFc3RhIGVzIHVuYSByZXNwdWVzdGE6ICpyZXNwdWVzdGEqLiIsCiAgICAgICJpbXBvcnRhbnQiOiB7CiAgICAgICAgImRlc2NyaXB0aW9uIjogIjx1bD48bGk+TGFzIHBhbGFicmFzIG1hcmNhZGFzIHNlIGFncmVnYW4gY29uIHVuIGFzdGVyaXNjbyAoKikuPC9saT48bGk+UHVlZGVuIGHDsWFkaXJzZSBhc3RlcmlzY29zIGRlbnRybyBkZSBsYXMgcGFsYWJyYXMgbWFyY2FkYXMgYWHDsWFkaWVuZG8gb3RybyBhc3RlcmlzY28sICpwYWxhYnJhY29ycmVjdGEqKiogPSZndDsgcGFsYWJyYWNvcnJlY3RhKi48L2xpPjwvdWw+IiwKICAgICAgICAiZXhhbXBsZSI6ICJMYXMgcGFsYWJyYXMgY29ycmVjdGFzIHNlIG1hcmNhbiBhc8OtOiAqcGFsYWJyYWNvcnJlY3RhKiwgdW4gYXN0ZXJpc2NvIHNlIG1hcmNhIGFzw606ICpwYWxhYnJhY29ycmVjdGEqKiouIgogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUmV0cm9hbGltZW50YWNpw7NuIEdsb2JhbCIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgICAgIHsKICAgICAgICAgICAgICAibGFiZWwiOiAiUG9yIGRlZmVjdG8iCiAgICAgICAgICAgIH0KICAgICAgICAgIF0sCiAgICAgICAgICAibGFiZWwiOiAiRGVmaW5pciByZXRyb2FsaW1lbnRhY2nDs24gcGVyc29uYWxpemFkYSBwYXJhIGN1YWxxdWllciByYW5nbyBkZSBwdW50dWFjacOzbiIsCiAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiSGF6IGNsaWMgZW4gZWwgYm90w7NuIFwiQcOxYWRpciByYW5nb1wiIHBhcmEgYcOxYWRpciBsb3MgcmFuZ29zIHF1ZSBuZWNlc2l0ZXMuIEVqZW1wbG86IDAtMjAlIE1hbGEgcHVudHVhY2nDs24sIDIxLTkxJSBQdW50dWFjacOzbiBNZWRpYSwgOTEtMTAwJSDCoVB1bnR1YWNpw7NuIEVzdHVwZW5kYSEiLAogICAgICAgICAgImVudGl0eSI6ICJyYW5nbyIsCiAgICAgICAgICAiZmllbGQiOiB7CiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlJhbmdvIGRlIHB1bnR1YWNpw7NuIgogICAgICAgICAgICAgIH0sCiAgICAgICAgICAgICAge30sCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlJldHJvYWxpbWVudGFjacOzbiBwYXJhIHJhbmdvIGRlIHB1bnR1YWNpw7NuIGRlZmluaWRvIiwKICAgICAgICAgICAgICAgICJwbGFjZWhvbGRlciI6ICJFc2NyaWJlIHR1IHJldHJvYWxpbWVudGFjacOzbiIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICB9CiAgICAgIF0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIGJvdMOzbiBcIkNvbXByb2JhclwiIiwKICAgICAgImRlZmF1bHQiOiAiQ29tcHJvYmFyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgYm90w7NuIFwiRW52aWFyXCIiLAogICAgICAiZGVmYXVsdCI6ICJFbnZpYXIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSBlbCBib3TDs24gXCJJbnRlbnRhciBkZSBudWV2b1wiIiwKICAgICAgImRlZmF1bHQiOiAiSW50ZW50YXIgZGUgbnVldm8iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSBib3TDs24gXCJNb3N0cmFyIHNvbHVjacOzblwiIiwKICAgICAgImRlZmF1bHQiOiAiTW9zdHJhciBzb2x1Y2nDs24iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ29uZmlndXJhY2nDs24gZGVsIGNvbXBvcnRhbWllbnRvLiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJFc3RhcyBvcGNpb25lcyB0ZSBwZXJtaXRpcsOhbiBjb250cm9sYXIgY8OzbW8gc2UgY29tcG9ydGEgbGEgdGFyZWEuIiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiSGFiaWxpdGFyIFwiSW50ZW50YXIgZGUgbnVldm9cIiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJIYWJpbGl0YXIgZWwgYm90w7NuIFwiTW9zdHJhciBzb2x1Y2nDs25cIiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJIYWJpbGl0YXIgYm90w7NuIFwiQ29tcHJvYmFyXCIiCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiTW9zdHJhciByZXN1bHRhZG9zIGRlIHB1bnR1YWNpw7NuIiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJNb3N0cmFyIGxvcyBwdW50b3Mgb2J0ZW5pZG9zIHBvciBjYWRhIHJlc3B1ZXN0YS4iCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gZGUgcmVzcHVlc3RhIGNvcnJlY3RhIiwKICAgICAgImRlZmF1bHQiOiAiwqFDb3JyZWN0byEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dG8gdXRpbGl6YWRvIHBhcmEgaW5kaWNhciBxdWUgdW5hIHJlc3B1ZXN0YSBlcyBjb3JyZWN0YSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBkZSByZXNwdWVzdGEgaW5jb3JyZWN0YSIsCiAgICAgICJkZWZhdWx0IjogIsKhSW5jb3JyZWN0byEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dG8gdXRpbGl6YWRvIHBhcmEgaW5kaWNhciBxdWUgdW5hIHJlc3B1ZXN0YSBlcyBpbmNvcnJlY3RhIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIGRlIHJlc3B1ZXN0YSBhdXNlbnRlIiwKICAgICAgImRlZmF1bHQiOiAiwqFSZXNwdWVzdGEgbm8gZW5jb250cmFkYSEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dG8gdXRpbGl6YWRvIHBhcmEgaW5kaWNhciBxdWUgZmFsdGEgdW5hIHJlc3B1ZXN0YSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZXNjcmlwY2nDs24gcGFyYSBNb3N0cmFyIFNvbHVjacOzbiIsCiAgICAgICJkZWZhdWx0IjogIkxhIHRhcmVhIHNlIGhhIGFjdHVhbGl6YWRvIGNvbiBsYSBzb2x1Y2nDs24uIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkVzdGUgdGV4dG8gbGUgZGljZSBhbCB1c3VhcmlvIHF1ZSBsYXMgdGFyZWFzIHNlIGhhbiBhY3R1YWxpemFkbyBjb24gbGEgc29sdWNpw7NuLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJSZXByZXNlbnRhY2nDs24gdGV4dHVhbCBkZSBsYSBiYXJyYSBkZSBwdW50dWFjacOzbiBjdWFuZG8gc2UgdXNhIHVuIGxlY3RvciBkZSBwYW50YWxsYSIsCiAgICAgICJkZWZhdWx0IjogIkhhcyBvYnRlbmlkbyA6bnVtIGRlIHVuIHRvdGFsIGRlIDp0b3RhbCBwdW50b3MiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRXRpcXVldGEgcGFyYSBlbCB0ZXh0byBsZWdpYmxlIGNvbXBsZXRvIHBhcmEgdGVjbm9sb2fDrWFzIGRlIGFzaXN0ZW5jaWEiLAogICAgICAiZGVmYXVsdCI6ICJUZXh0byBjb21wbGV0byBsZWdpYmxlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkV0aXF1ZXRhIHBhcmEgZWwgdGV4dG8gZG9uZGUgc2UgcHVlZGVuIG1hcmNhciBwYWxhYnJhcyBwYXJhIHRlY25vbG9nw61hcyBkZSBhc2lzdGVuY2lhIiwKICAgICAgImRlZmF1bHQiOiAiVGV4dG8gY29tcGxldG8gZG9uZGUgc2UgcHVlZGVuIG1hcmNhciBsYXMgcGFsYWJyYXMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRW5jYWJlemFkbyBkZSBtb2RvIGRlIHNvbHVjacOzbiBwYXJhIHRlY25vbG9nw61hcyBkZSBhc2lzdGVuY2lhIiwKICAgICAgImRlZmF1bHQiOiAiTW9kbyBTb2x1Y2nDs24iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRW5jYWJlemFkbyBkZSBtb2RvIGRlIHZlcmlmaWNhY2nDs24gcGFyYSB0ZWNub2xvZ8OtYXMgZGUgYXNpc3RlbmNpYSIsCiAgICAgICJkZWZhdWx0IjogIk1vZG8gZGUgQ29tcHJvYmFjacOzbiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZXNjcmlwY2nDs24gcGFyYSBsYXMgdGVjbm9sb2fDrWFzIGRlIGFzaXN0ZW5jaWEgZGVsIGJvdMOzbiBcIkNvbXByb2JhclwiIiwKICAgICAgImRlZmF1bHQiOiAiUmV2aXNhIHR1cyByZXNwdWVzdGFzLiBMYXMgcmVzcHVlc3RhcyBzZSBtYXJjYXLDoW4gY29tbyBjb3JyZWN0YSwgaW5jb3JyZWN0YSBvIHNpbiBjb250ZXN0YXIuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkRlc2NyaXBjacOzbiBwYXJhIGxhcyB0ZWNub2xvZ8OtYXMgZGUgYXNpc3RlbmNpYSBkZWwgYm90w7NuIFwiTW9zdHJhciBzb2x1Y2nDs25cIiIsCiAgICAgICJkZWZhdWx0IjogIk1vc3RyYXIgbGEgc29sdWNpw7NuLiBMYSB0YXJlYSBzZSBjYWxpZmljYXLDoSBjb24gc3Ugc29sdWNpw7NuIGNvcnJlY3RhLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZXNjcmlwY2nDs24gcGFyYSBsYXMgdGVjbm9sb2fDrWFzIGRlIGFzaXN0ZW5jaWEgZGVsIGJvdMOzbiBcIkludGVudGFyIGRlIG51ZXZvXCIiLAogICAgICAiZGVmYXVsdCI6ICJWdWVsdmUgYSBpbnRlbnRhciBsYSB0YXJlYS4gQm9ycmEgdG9kYXMgdHVzIHJlc3B1ZXN0YXMgeSBlbXBpZXphIGRlIG51ZXZvLiIKICAgIH0KICBdCn0K"],"libraries\/H5P.MarkTheWords-1.11\/language\/es-mx.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJNZWRpb3MiLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJUaXBvIiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJNZWRpb3Mgb3BjaW9uYWxlcyBtb3N0cmFkb3MgZW5jaW1hIGRlIGxhIHByZWd1bnRhLiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJEZXNoYWJpbGl0YXIgYWNlcmNhbWllbnRvIGRlIGltYWdlbiIKICAgICAgICB9CiAgICAgIF0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZXNjcmlwY2nDs24gZGVsIHRyYWJham8iLAogICAgICAiZGVzY3JpcHRpb24iOiAiRGVzY3JpYmUgY29tbyBlbCB1c3VhcmlvIGRlYmVyw61hIHJlc29sdmVyIGVsIHRyYWJham8uIiwKICAgICAgInBsYWNlaG9sZGVyIjogIkhhZ2EgY2xpYyBlbiB0b2RvcyBsb3MgdmVyYm9zIGVuIGVsIHRleHRvIHF1ZSBzaWd1ZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2FtcG9kZXRleHRvIiwKICAgICAgInBsYWNlaG9sZGVyIjogIkVzdGEgZXMgdW5hIHJlc3B1ZXN0YTogKnJlc3B1ZXN0YSouIiwKICAgICAgImltcG9ydGFudCI6IHsKICAgICAgICAiZGVzY3JpcHRpb24iOiAiPHVsPjxsaT5MYXMgcGFsYWJyYXMgbWFyY2FkYXMgc2UgYWdyZWdhbiBjb24gdW4gYXN0ZXJpc2NvICgqKS48L2xpPjxsaT5Mb3MgYXN0ZXJpc2NvcyBwdWVkZW4gYcOxYWRpcnNlIGRlbnRybyBkZSBsYXMgcGFsYWJyYXMgbWFyY2FkYXMgYWwgYcOxYWRpciBvdHJvIGFzdGVyaXNjbywgbG8gcXVlIHJlc3VsdGEgZW4gKnBhbGFicmFjb3JyZWN0YSoqKiA9Jmd0OyBwYWxhYnJhY29ycmVjdGEqLjwvbGk+PC91bD4iLAogICAgICAgICJleGFtcGxlIjogIkxhcyBwYWxhYnJhcyBjb3JyZWN0YXMgZXN0w6FuIG1hcmNhZGFzIGFzw606ICpwYWxhYnJhY29ycmVjdGEqLCB1biBhc3RlcmlzY28gZXN0w6EgZXNjcml0byBhc8OtOiAqcGFsYWJyYWNvcnJlY3RhKioqLiIKICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlJldHJvYWxpbWVudGFjacOzbiBHbG9iYWwiLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJ3aWRnZXRzIjogWwogICAgICAgICAgICB7CiAgICAgICAgICAgICAgImxhYmVsIjogIlByZWRldGVybWluYWRvIgogICAgICAgICAgICB9CiAgICAgICAgICBdLAogICAgICAgICAgImxhYmVsIjogIkRlZmluaXIgcmV0cm9hbGltZW50YWNpw7NuIHBlcnNvbmFsaXphZGEgcGFyYSBjdWFscXVpZXIgcmFuZ28gZGUgcHVudGFqZSIsCiAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiSGFnYSBjbGljIGVuIGVsIGJvdMOzbiBcIkHDsWFkaXIgcmFuZ29cIiBwYXJhIGHDsWFkaXIgY3VhbnRvcyByYW5nb3MgbmVjZXNpdGUuIEVqZW1wbG86IDAtMjAlIE1hbCBwdW50YWplLCAyMS05MSUgUHVudGFqZSBQcm9tZWRpbywgOTEtMTAwJSDCoU1hZ27DrWZpY28gUHVudGFqZSEiLAogICAgICAgICAgImVudGl0eSI6ICJyYW5nbyIsCiAgICAgICAgICAiZmllbGQiOiB7CiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlJhbmdvIGRlbCBQdW50YWplIgogICAgICAgICAgICAgIH0sCiAgICAgICAgICAgICAge30sCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlJldHJvYWxpbWVudGFjacOzbiBwYXJhIHJhbmdvIGRlIHB1bnRhamUgZGVmaW5pZG8iLAogICAgICAgICAgICAgICAgInBsYWNlaG9sZGVyIjogIkNvbXBsZXRlIGxhIHJldHJvYWxpbWVudGFjacOzbiIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICB9CiAgICAgIF0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIGJvdMOzbiBcIkNvbXByb2JhclwiIiwKICAgICAgImRlZmF1bHQiOiAiQ29tcHJvYmFyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgYm90w7NuIFwiRW52aWFyXCIiLAogICAgICAiZGVmYXVsdCI6ICJFbnZpYXIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSBlbCBib3TDs24gXCJSZWludGVudGFyXCIiLAogICAgICAiZGVmYXVsdCI6ICJSZWludGVudGFyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgYm90w7NuIFwiTW9zdHJhciBzb2x1Y2nDs25cIiIsCiAgICAgICJkZWZhdWx0IjogIk1vc3RyYXIgc29sdWNpw7NuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNvbmZpZ3VyYWNpb25lcyBkZWwgY29tcG9ydGFtaWVudG8uIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkVzdGFzIG9wY2lvbmVzIGxlIHBlcm1pdGlyw6FuIGNvbnRyb2xhciBjb21vIHNlIGNvbXBvcnRhIGVsIHRyYWJham8uIiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiSGFiaWxpdGFyIFwiUmVpbnRlbnRhclwiIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkhhYmlsaXRhciBlbCBib3TDs24gXCJNb3N0cmFyIHNvbHVjacOzblwiIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkhhYmlsaXRhciBib3TDs24gXCJDb21wcm9iYXJcIiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJNb3N0cmFyIGVsIHB1bnRhamUiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIk1vc3RyYXIgbG9zIHB1bnRvcyBvYnRlbmlkb3MgcG9yIGNhZGEgcmVzcHVlc3RhLiIKICAgICAgICB9CiAgICAgIF0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBkZSByZXNwdWVzdGEgY29ycmVjdGEiLAogICAgICAiZGVmYXVsdCI6ICLCoUNvcnJlY3RvISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0byB1dGlsaXphZG8gcGFyYSBpbmRpY2FyIHF1ZSB1bmEgcmVzcHVlc3RhIGVzIGNvcnJlY3RhIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIGRlIHJlc3B1ZXN0YSBpbmNvcnJlY3RhIiwKICAgICAgImRlZmF1bHQiOiAiwqFJbmNvcnJlY3RvISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0byB1dGlsaXphZG8gcGFyYSBpbmRpY2FyIHF1ZSB1bmEgcmVzcHVlc3RhIGVzIGluY29ycmVjdGEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gZGUgcmVzcHVlc3RhIGZhbHRhbnRlIiwKICAgICAgImRlZmF1bHQiOiAiwqFSZXNwdWVzdGEgbm8gZW5jb250cmFkYSEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dG8gdXRpbGl6YWRvIHBhcmEgaW5kaWNhciBxdWUgZmFsdGEgdW5hIHJlc3B1ZXN0YSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZXNjcmlwY2nDs24gcGFyYSBNb3N0cmFyIFNvbHVjacOzbiIsCiAgICAgICJkZWZhdWx0IjogIkVsIHRyYWJham8gZXMgYWN0dWFsaXphZG8gcGFyYSBjb250ZW5lciBsYSBzb2x1Y2nDs24uIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkVzdGUgdGV4dG8gbGUgZGljZSBhbCB1c3VhcmlvIHF1ZSBsb3MgdHJhYmFqb3MgaGFuIHNpZG8gYWN0dWFsaXphZG9zIGNvbiBsYSBzb2x1Y2nDs24uIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlJlcHJlc2VudGFjacOzbiB0ZXh0dWFsIGRlIGxhIGJhcnJhIGRlIHB1bnRhamUgcGFyYSBhcXVlbGxvcyBxdWUgdXNhbiB1biBsZWN0b3IgZGUgdGV4dG8gZW4gdm96IGFsdGEiLAogICAgICAiZGVmYXVsdCI6ICJPYnR1dm8gOm51bSBkZSB1biB0b3RhbCBkZSA6dG90YWwgcHVudG9zIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkV0aXF1ZXRhIHBhcmEgZWwgdGV4dG8gY29tcGxldG8gbGVnaWJsZSBwYXJhIHRlY25vbG9nw61hcyBhc2lzdGlkYXMiLAogICAgICAiZGVmYXVsdCI6ICJUZXh0byBjb21wbGV0byBsZWdpYmxlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkV0aXF1ZXRhIHBhcmEgZWwgdGV4dG8gZG9uZGUgbGFzIHBhbGFicmFzIHB1ZWRlbiBzZXIgbWFyY2FkYXMgcGFyYSB0ZWNub2xvZ8OtYXMgYXNpc3RpdmFzIiwKICAgICAgImRlZmF1bHQiOiAiVGV4dG8gY29tcGxldG8gZG9uZGUgbGFzIHBhbGFicmFzIHB1ZWRlbiBzZXIgbWFyY2FkYXMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRW5jYWJlemFkbyBkZSBtb2RvIHNvbHVjacOzbiBwYXJhIHRlY25vbG9nw61hcyBhc2lzdGl2YXMiLAogICAgICAiZGVmYXVsdCI6ICJNb2RvIFNvbHVjacOzbiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFbmNhYmV6YWRvIGRlIG1vZG8gY29tcHJvYmFjacOzbiBwYXJhIHRlY25vbG9nw61hcyBhc2lzdGl2YXMiLAogICAgICAiZGVmYXVsdCI6ICJNb2RvIGRlIENvbXByb2JhY2nDs24iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRGVzY3JpcGNpw7NuIGRlIHRlY25vbG9nw61hIGFzaXN0aXZhIHBhcmEgYm90w7NuIFwiQ29tcHJvYmFyXCIiLAogICAgICAiZGVmYXVsdCI6ICJSZXZpc2FyIGxhcyByZXNwdWVzdGFzLiBMYXMgcmVzcHVlc3RhcyBzZXLDoW4gbWFyY2FkYXMgY29tbyBjb3JyZWN0YSwgaW5jb3JyZWN0YSBvIHNpbiBjb250ZXN0YXIuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkRlc2NyaXBjacOzbiBkZSB0ZWNub2xvZ8OtYSBhc2lzdGl2YSBwYXJhIGJvdMOzbiBcIk1vc3RyYXIgU29sdWNpw7NuXCIiLAogICAgICAiZGVmYXVsdCI6ICJNb3N0cmFyIGxhIHNvbHVjacOzbi4gRWwgdHJhYmFqbyBzZXLDoSBjYWxpZmljYWRvIGNvbiBzdSBzb2x1Y2nDs24gY29ycmVjdGEuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkRlc2NyaXBjacOzbiBkZSB0ZWNub2xvZ8OtYSBhc2lzdGl2YSBwYXJhIGJvdMOzbiBcIlJlaW50ZW50YXJcIiIsCiAgICAgICJkZWZhdWx0IjogIlJlaW50ZW50YXIgZWwgdHJhYmFqby4gUmVpbmljaWFyIHRvZGFzIGxhcyByZXNwdWVzdGFzIGUgaW5pY2lhciBlbCB0cmFiYWpvIGRlIG51ZXZvLiIKICAgIH0KICBdCn0K"],"libraries\/H5P.MarkTheWords-1.11\/language\/et.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJQaWx0IHbDtWkgdmlkZW8iLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJUw7zDvHAiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIlBpbHQgdsO1aSB2aWRlbywgbWlkYSBrdXZhdGFrc2Uga8O8c2ltdXNlIGp1dXJlcyAobWl0dGVrb2h1c3R1c2xpayBlbGVtZW50KS4iCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiS2VlbGEgcGlsZGkgc3V1cnVzZSBtdXV0bWluZSIKICAgICAgICB9CiAgICAgIF0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLDnGxlc2FuZGUga2lyamVsZHVzIiwKICAgICAgImRlc2NyaXB0aW9uIjogIktpcmplbGRhLCBrdWlkYXMga2FzdXRhamEgcGVha3Mgw7xsZXNhbmRlIGxhaGVuZGFtYS4iLAogICAgICAicGxhY2Vob2xkZXIiOiAiS2xpa2kgasOkcmduZXZhcyB0ZWtzdGlzIGvDtWlnaWxlIHRlZ3Vzw7VuYWRlbGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0aXbDpGxpIiwKICAgICAgInBsYWNlaG9sZGVyIjogIlNlZSBvbiB2YXN0dXM6ICp2YXN0dXMqLiIsCiAgICAgICJpbXBvcnRhbnQiOiB7CiAgICAgICAgImRlc2NyaXB0aW9uIjogIjx1bD48bGk+TcOkcmdpdHVkIHPDtW5hZCBsaXNhdGFrc2UgdMOkcm5pICgqKSBrYXN1dGFkZXMuPC9saT48bGk+VMOkcm5pIGxpc2FtaXNla3Mga2FzdXRhIHRvcGVsdC10w6RybmkgKiogPSAqLjwvbGk+PC91bD4iLAogICAgICAgICJleGFtcGxlIjogIsOVaWdlZCBzw7VuYWQgbcOkcmdpdGFrc2UgbmlpOiAqw7VpZ2Vzw7VuYSosIHTDpHJuIGxpc2F0YWtzZW5paTogKsO1aWdlc8O1bmEqKiouIgogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiw5xsZGluZSB0YWdhc2lzaWRlIiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAid2lkZ2V0cyI6IFsKICAgICAgICAgICAgewogICAgICAgICAgICAgICJsYWJlbCI6ICJWYWlraW1pc2kiCiAgICAgICAgICAgIH0KICAgICAgICAgIF0sCiAgICAgICAgICAibGFiZWwiOiAiTcOkw6RyYXRsZSBrb2hhbmRhdHVkIHRhZ2FzaXNpZGUgaWdhbGUgcHVua3Rpc3VtbWEgdmFoZW1pa3VsZSIsCiAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiS2xpa2kgXCJMaXNhIHZhaGVtaWtcIiBudXB1bGUgdmFqYWxpa2UgdmFoZW1pa2UgbGlzYW1pc2Vrcy4gTsOkaXRla3M6IDAtMjAlIGhhbGIgdHVsZW11cywgMjEtOTElIGtlc2ttaW5lIHR1bGVtdXMsIDkxLTEwMCUgc3V1cmVww6RyYW5lIHR1bGVtdXMhIiwKICAgICAgICAgICJlbnRpdHkiOiAidmFoZW1payIsCiAgICAgICAgICAiZmllbGQiOiB7CiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlB1bmt0aXN1bW1hIHZhaGVtaWsiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7fSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiVGFnYXNpc2lkZSBtw6TDpHJhdGxldHVkIHB1bmt0aXN1bW1hIHZhaGVtaWt1bGUiLAogICAgICAgICAgICAgICAgInBsYWNlaG9sZGVyIjogIlNpc2VzdGEgdGFnYXNpc2lkZSIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICB9CiAgICAgIF0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJcIktvbnRyb2xsaVwiIG51cHUgdGVrc3QiLAogICAgICAiZGVmYXVsdCI6ICJLb250cm9sbGkiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJTdWJtaXRcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJTdWJtaXQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiXCJQcm9vdmkgdXVlc3RpXCIgbnVwdSB0ZWtzdCIsCiAgICAgICJkZWZhdWx0IjogIlByb292aSB1dWVzdGkiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiXCJOw6RpdGEgbGFoZW5kdXN0XCIgbnVwdSB0ZWtzdCIsCiAgICAgICJkZWZhdWx0IjogIk7DpGl0YSBsYWhlbmR1c3QiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiS8OkaXR1bWlzc2VhZGVkLiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJOZW5kZSB2YWxpa3V0ZWdhIHNhYWQgbcOkw6RyYXRhIMO8bGVzYW5kZSBrw6RpdHVtaXNlLiIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkx1YmEgXCJQcm9vdmkgdXVlc3RpXCIgbnVwcCIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJMdWJhIFwiTsOkaXRhIGxhaGVuZHVzdFwiIG51cHAiCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiTHViYSBcIktvbnRyb2xsaVwiIG51cHAiCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiTsOkaXRhIHB1bmt0aXN1bW1hIHR1bGVtdXMiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIklnYSB2YXN0dXNlZ2EgdGVlbml0dWQgcHVua3RpZC4iCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiw5VpZ2UgdmFzdHVzZSB0ZWtzdCIsCiAgICAgICJkZWZhdWx0IjogIsOVaWdlISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLDlWlnZWxlIHZhc3R1c2VsZSBvc3V0YXYgdGVrc3QiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVmFsZSB2YXN0dXNlIHRla3N0IiwKICAgICAgImRlZmF1bHQiOiAiVmFsZSEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVmFsZWxlIHZhc3R1c2VsZSBvc3V0YXYgdGVrc3QiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVMOkaXRtYXRhIHZhc3R1c2UgdGVrc3QiLAogICAgICAiZGVmYXVsdCI6ICJQdXVkdSEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiUHV1ZHV2YWxlIHZhc3R1c2VsZSBvc3V0YXYgdGVrc3QiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTsOkaXRhIGxhaGVuZHVzdCBraXJqZWxkdXMiLAogICAgICAiZGVmYXVsdCI6ICLDnGxlc2FubmUgb24gdXVlbmRhdHVkIGphIHNpc2FsZGFiIG7DvMO8ZCBsYWhlbmR1c3QuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlNlZSB0ZWtzdCB0ZWF0YWIga2FzdXRhamFsZSwgZXQgw7xsZXNhbmRlbGUgb24gbGlzYXR1ZCBsYWhlbmR1cy4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUHVua3Rpc3VtbWEgcmliYSB0ZWtzdGlsaW5lIGVzaXR1cyB0ZWtzdGlsdWdlcmkga2FzdXRhamFpbGUiLAogICAgICAiZGVmYXVsdCI6ICJTYSBzYWlkIDpudW0gcHVua3RpIDp0b3RhbCBwdW5rdGlzdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJMYWJlbCBmb3IgdGhlIGZ1bGwgcmVhZGFibGUgdGV4dCBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIkZ1bGwgcmVhZGFibGUgdGV4dCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJMYWJlbCBmb3IgdGhlIHRleHQgd2hlcmUgd29yZHMgY2FuIGJlIG1hcmtlZCBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIkZ1bGwgdGV4dCB3aGVyZSB3b3JkcyBjYW4gYmUgbWFya2VkIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlNvbHV0aW9uIG1vZGUgaGVhZGVyIGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiU29sdXRpb24gbW9kZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDaGVja2luZyBtb2RlIGhlYWRlciBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIkNoZWNraW5nIG1vZGUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQXNzaXN0aXZlIHRlY2hub2xvZ3kgZGVzY3JpcHRpb24gZm9yIFwiQ2hlY2tcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJDaGVjayB0aGUgYW5zd2Vycy4gVGhlIHJlc3BvbnNlcyB3aWxsIGJlIG1hcmtlZCBhcyBjb3JyZWN0LCBpbmNvcnJlY3QsIG9yIHVuYW5zd2VyZWQuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFzc2lzdGl2ZSB0ZWNobm9sb2d5IGRlc2NyaXB0aW9uIGZvciBcIlNob3cgU29sdXRpb25cIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJTaG93IHRoZSBzb2x1dGlvbi4gVGhlIHRhc2sgd2lsbCBiZSBtYXJrZWQgd2l0aCBpdHMgY29ycmVjdCBzb2x1dGlvbi4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQXNzaXN0aXZlIHRlY2hub2xvZ3kgZGVzY3JpcHRpb24gZm9yIFwiUmV0cnlcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJSZXRyeSB0aGUgdGFzay4gUmVzZXQgYWxsIHJlc3BvbnNlcyBhbmQgc3RhcnQgdGhlIHRhc2sgb3ZlciBhZ2Fpbi4iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.MarkTheWords-1.11\/language\/eu.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJNdWx0aW1lZGlhIiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiTW90YSIsCiAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiR2FsZGVyYXJlbiBnYWluZWFuIGJpc3RhcmF0emVrbyBhdWtlcmFrbyBtdWx0aW1lZGlhLiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJEZXNnYWl0dSBpcnVkaWVuIHpvb21hIgogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkF0YXphcmVuIGRlc2tyaWJhcGVuYSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJEZXNrcmliYXR1IHplcmVnaW5hcmVuIGlydGVuYmlkZWEgYXVya2l0emVrbyBtb2R1YS4iLAogICAgICAicGxhY2Vob2xkZXIiOiAiS2xpayBlZ2luIG9uZG9rbyB0ZXN0dWFyZW4gYWRpdHogZ3V6dGlldGFuLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXN0dSBlcmVtdWEiLAogICAgICAicGxhY2Vob2xkZXIiOiAiSGF1IGVyYW50enVuIGJhdCBkYTogKmVyYW50enVuYSouIiwKICAgICAgImltcG9ydGFudCI6IHsKICAgICAgICAiZGVzY3JpcHRpb24iOiAiPHVsPjxsaT5NYXJrYXR1dGFrbyBoaXR6YWsgaXphcnR4byBiYXRla2luICgqKSBlcmFuc3RlbiBkaXJhLjwvbGk+PGxpPk1hcmthdHV0YWtvIGhpdHpldGFuIGl6YXJ0eG8gYmF0IGVyYW50c2kgbmFoaSBiYWRhIGJpZ2FycmVuIGl6YXJ0eG8gYmF0IGVyYW50c2kgYmVoYXIgZGEsICpjb3JyZWN0d29yZCoqKiA9Jmd0OyBjb3JyZWN0d29yZCouPC9saT48L3VsPiIsCiAgICAgICAgImV4YW1wbGUiOiAiSGl0eiB6dXplbmFrIGhvbmVsYSBtYXJrYXR1IGJlaGFyIGRpcmE6ICpoaXR6LXp1emVuYSosIGl6YXJ0eG8gYmF0IGhvbmVsYSBcIiBiZWhhciBkYTogKmhpdHotenV6ZW5hKioqLiIKICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkZlZWRiYWNrIE9yb2tvcnJhIiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAid2lkZ2V0cyI6IFsKICAgICAgICAgICAgewogICAgICAgICAgICAgICJsYWJlbCI6ICJMZWhlbmV0c2l0YWtvYSIKICAgICAgICAgICAgfQogICAgICAgICAgXSwKICAgICAgICAgICJsYWJlbCI6ICJaZWhhenR1IGV6YXp1IGVkb3plaW4gcHVudHVhemlvLXRhcnRlcmFrbyBmZWVkYmFjayBwZXJ0c29uYWxpemF0dWEiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIkVnaW4ga2xpayBcIkdlaGl0dSB0YXJ0ZWFcIiBib3RvaWFuIGJlaGFyIGRpdHV6dW4gdGFydGUgZ3V6dGlhayBnZWhpdHpla28uIEFkaWJpZGV6OiAwLTIwJSBQdW50dWF6aW8gZXNrYXNhLCAyMS05MSUgQmF0ZXogYmVzdGVrbyBwdW50dWF6aW9hLCA5MS0xMDAlIFB1bnR1YXppbyBiaWthaW5hISIsCiAgICAgICAgICAiZW50aXR5IjogInRhcnRlYSIsCiAgICAgICAgICAiZmllbGQiOiB7CiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlB1bnRhemlvLXRhcnRlYSIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHt9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJaZWhhenR1dGFrbyB0YXJ0ZWFyZW50emFrbyBmZWVkYmFja2EiLAogICAgICAgICAgICAgICAgInBsYWNlaG9sZGVyIjogIklkYXR6aSBlemF6dSBmZWVkYmFja2EiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiXCJFZ2lhenRhdHVcIiBib3RvaWFyZW50emFrbyB0ZXN0dWEiLAogICAgICAiZGVmYXVsdCI6ICJFZ2lhenRhdHUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJTdWJtaXRcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJTdWJtaXQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiXCJFcmFrdXRzaSBlbWFpdHphXCIgYm90b2lhcmVuIHRlc3R1YSIsCiAgICAgICJkZWZhdWx0IjogIlNhaWF0dSBiZXJyaXJvIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlwiRXJha3V0c2kgc29sdXppb2FcIiBib3RvaWFyZW50emFrbyB0ZXN0dWEiLAogICAgICAiZGVmYXVsdCI6ICJFcmFrdXRzaSBlcmFudHp1bmEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUG9ydGFlcmFyZW4gZXphcnBlbmFrLiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJBdWtlcmEgaGF1ZWsgbGFuYXJlbiBwb3J0YWVyYSBrb250cm9sYXR6ZWEgYWhhbGJpZGV0emVuIGRpenV0ZS4iLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJHYWl0dSBcIkJlcnJpeiBzYWlhdHVcIiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJHYWl0dSBcIkVyYWt1dHNpIGVyYW50enVuYVwiIGJvdG9pYSIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJHYWl0dSBcIkVnaWF6dGF0dVwiIGJvdG9pYSIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJFcmFrdXRzaSBwdW50dWF6aW9hIiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJFcmFrdXRzaSBlcmFudHp1biBiYWtvaXR6ZWFuIGxvcnR1dGFrbyBwdW50dWF6aW9hLiIKICAgICAgICB9CiAgICAgIF0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFcmFudHp1biB6dXplbmFyZW4gdGVzdHVhIiwKICAgICAgImRlZmF1bHQiOiAiWnV6ZW5hISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJFcmFudHp1bmEgenV6ZW5hIGRlbGEgYWRpZXJhenRla28gdGVzdHVhIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkVyYW50enVuIG9rZXJyYXJlbiB0ZXN0dWEiLAogICAgICAiZGVmYXVsdCI6ICJFcmFudHp1biBva2VycmEhIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkVyYW50enVuYSBva2VycmEgZGVsYSBhZGllcmF6dGVrbyB0ZXN0dWEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRmFsdGEgZGlyZW4gZXJhbnR6dW5lbnR6YWtvIHRlc3R1YSIsCiAgICAgICJkZWZhdWx0IjogIkZhbHRhIGRhISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJFcmFudHp1bmEgZmFsdGEgZGVsYSBhZGllcmF6dGVrbyB0ZXN0dWEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRXJha3V0c2kgc29sdXppb2FyZW50emFrbyBkZXNrcmliYXBlbmEiLAogICAgICAiZGVmYXVsdCI6ICJaZXJlZ2luYSBlZ3VuZXJhdHplbiBkYSBzb2x1emlvYSBhZGllcmF6dGVrby4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGVzdHUgaG9uZWsgZXJhYmlsdHphaWxlYXJpIGluZm9ybWF0emVuIGRpbyB6ZXJlZ2luYSBlZ3VuZXJhdHUgZGVsYSBzb2x1emlvYSBhZGllcmF6dGVrby4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUHVudHVhemlvIGJhcnJhcmVuIHRlc3R1IGFkaWVyYXpwZW5hIGlyYWt1cmdhaWx1YSBlcmFiaWx0emVuIGR1dGVuZW50emF0IiwKICAgICAgImRlZmF1bHQiOiAiOnRvdGFsIHB1bnR1dGlrIDpudW0gcHVudHUgbG9ydHUgZHV6dSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXN0dSBpcmFrdXJnYXJyaSBvc29yYWtvIGV0aWtldGEgbGFndW50emFyYWtvIHRla25vbG9naWV0YW4iLAogICAgICAiZGVmYXVsdCI6ICJUZXN0dSBpcmFrdXJnYXJyaSBvc29hIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk1hcmthdHUgZGFpdGV6a2VlbiBoaXR6ZW50emFrbyB0ZXN0dXJha28gZXRpa2V0YSBsYWd1bnR6YXJha28gdGVrbm9sb2dpZXRhbiIsCiAgICAgICJkZWZhdWx0IjogIkhpdHphayBtYXJrYXR1IGRhaXRlemtlZW4gdGVzdHUgb3NvYSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFYmF6cGVuLW1vZHVyYWtvIGdvaWJ1cnVhIGxhZ3VudHphcmFrbyB0ZWtub2xvZ2lldGFuIiwKICAgICAgImRlZmF1bHQiOiAiRWJhenBlbi1tb2R1YSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFZ2lhenRhcGVuLW1vZHVyYWtvIGdvaWJ1cnVhIGxhZ3VudHphcmFrbyB0ZWtub2xvZ2lldGFuIiwKICAgICAgImRlZmF1bHQiOiAiRWdpYXp0YXBlbi1tb2R1YSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJcIkVnaWF6dGF0dVwiIGJvdG9pYXJlbiBsYWd1bnR6YS10ZWtub2xvZ2llbnR6YWtvIGV0aWtldGEiLAogICAgICAiZGVmYXVsdCI6ICJFZ2lhenRhdHUgZXJhbnR6dW5hay4gRXJhbnR6dW5hayB6dXplbiwgb2tlciBlZG8gZXJhbnR6dW4gZ2FiZSBnaXNhIG1hcmthdHVrbyBkaXJhLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJcIkVyYWt1dHNpIGVyYW50enVuIHp1emVuYVwiIGJvdG9pYXJlbiBsYWd1bnR6YS10ZWtub2xvZ2llbnR6YWtvIGV0aWtldGEiLAogICAgICAiZGVmYXVsdCI6ICJFcmFrdXRzaSBlcmFudHp1biB6dXplbmEuIFplcmVnaW5hcmVuIGVyYW50enVuIHp1emVuYSBtYXJrYXR1a28gZGEuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlwiQmVycml6IHNhaWF0dVwiIGJvdG9pYXJlbiBsYWd1bnR6YS10ZWtub2xvZ2llbnR6YWtvIGV0aWtldGEiLAogICAgICAiZGVmYXVsdCI6ICJaZXJlZ2luYSBiZXJyaXogZWdpdGVuIHNhaWF0dS4gQmVycmFiaWFyYXppIGVyYW50enVuIGd1enRpYWsgZXRhIGhhc2kgemVyZWdpbmEgYmVycml6LiIKICAgIH0KICBdCn0K"],"libraries\/H5P.MarkTheWords-1.11\/language\/fa.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLYsdiz2KfZhtmHIiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAi2YbZiNi5IiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICLYsdiz2KfZhtmHINin2K7YqtuM2KfYsduMINio2LHYp9uMINmG2YXYp9uM2LQg2K\/YsSDYqNin2YTYp9uMINiz2KTYp9mELiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICLYutuM2LHZgdi52KfZhOKAjNiz2KfYstuMINio2LLYsdqv2YbZhdin24zbjCDYqti12YjbjNixIgogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItiq2YjYtduM2YEg2KraqdmE24zZgSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLYqtmI2LbbjNitINiv2YfbjNivINqp2KfYsdio2LEg2obar9mI2YbZhyDYqNin24zYryDYqtqp2YTbjNmBINix2Kcg2KfZhtis2KfZhSDYr9mH2K8uIiwKICAgICAgInBsYWNlaG9sZGVyIjogItix2YjbjCDZh9mF2Ycg2YHYudmE4oCM2YfYpyDYr9ixINmF2KrZhiDZvtuM2LQg2LHZiCDaqdmE24zaqSDaqdmG24zYry4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi2YHbjNmE2K8g2YXYqtmG24wiLAogICAgICAicGxhY2Vob2xkZXIiOiAi2KfbjNmGINuM2qkg2b7Yp9iz2K4g2KfYs9iqOiAqYW5zd2VyKi4iLAogICAgICAiaW1wb3J0YW50IjogewogICAgICAgICJkZXNjcmlwdGlvbiI6ICI8dWw+PGxpPtqp2YTZhdin2Kog2YbYtNin2YbYr9in2LEg2KjYpyDbjNqpINiz2KrYp9ix2YcgKCopINin2LbYp9mB2Ycg2LTYr9mH4oCM2KfZhtivLjwvbGk+PGxpPtio2Kcg2KfZgdiy2YjYr9mGINuM2qkg2LPYqtin2LHZhyDYr9uM2q\/YsSDZhduM4oCM2KrZiNin2YYg2KjZhyDaqdmE2YXYp9iqINmG2LTYp9mG2K\/Yp9ixINiz2KrYp9ix2Ycg2KfZgdiy2YjYr9iMICpjb3JyZWN0d29yZCoqKiA9Jmd0OyBjb3JyZWN0d29yZCouPC9saT48L3VsPiIsCiAgICAgICAgImV4YW1wbGUiOiAi2qnZhNmF2KfYqiDYtdit24zYrSDYp9uM2Ybar9mI2YbZhyDZhti02KfZhtiv2KfYsSDZhduM4oCM2LTZiNmG2K86ICpjb3JyZWN0d29yZCrYjCDbjNqpINiz2KrYp9ix2Ycg2KjZhyDYp9uM2YYg2LXZiNix2Kog2YbZiNi02KrZhyDZhduM4oCM2LTZiNivOiAqY29ycmVjdHdvcmQqKiouIgogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi2KjYp9iy2K7ZiNix2K8g2qnZhNuMIiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAid2lkZ2V0cyI6IFsKICAgICAgICAgICAgewogICAgICAgICAgICAgICJsYWJlbCI6ICLZvtuM2LTigIzZgdix2LYiCiAgICAgICAgICAgIH0KICAgICAgICAgIF0sCiAgICAgICAgICAibGFiZWwiOiAi2KrYudix24zZgSDYqNin2LLYrtmI2LHYryDYs9mB2KfYsdi024wg2KjYsdin24wg2YfYsSDYqNin2LLZhyDZhtmF2LHZhyIsCiAgICAgICAgICAiZGVzY3JpcHRpb24iOiAi2KjYsdin24wg2KfZgdiy2YjYr9mGINmH2LEg2KrYudiv2KfYryDYqNin2LLZhyDaqdmHINmF24zigIzYrtmI2KfZh9uM2K\/YjCDYsdmIINiv2qnZhdmHIFwi2KfZgdiy2YjYr9mGINio2KfYstmHXCIg2qnZhNuM2qkg2qnZhtuM2K8uINmF2KvYp9mEOiDbsC3bstuw2aog2YbZhdix2Ycg2KjYr9iMINuy27Et27nbsdmqINmG2YXYsdmHINmF2KrZiNiz2LfYjCDbuduxLdux27DbsNmqINmG2YXYsdmHINi52KfZhNuMISIsCiAgICAgICAgICAiZW50aXR5IjogItio2KfYstmHIiwKICAgICAgICAgICJmaWVsZCI6IHsKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAi2KjYp9iy2Ycg2YbZhdix2YciCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7fSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAi2KjYp9iy2K7ZiNix2K8g2KjYp9iy2Ycg2YbZhdix2Ycg2KrYudix24zZgSDYtNiv2YciLAogICAgICAgICAgICAgICAgInBsYWNlaG9sZGVyIjogItio2KfYstiu2YjYsdivINix2Kcg2b7YsSDaqdmG24zYryIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICB9CiAgICAgIF0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLZhdiq2YYg2KjYsdin24wg2K\/aqdmF2Ycg2KjYsdix2LPbjCIsCiAgICAgICJkZWZhdWx0IjogItio2LHYsdiz24wiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJTdWJtaXRcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJTdWJtaXQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi2YXYqtmGINio2LHYp9uMINiv2qnZhdmHINiq2YTYp9i0INmF2KzYr9ivIiwKICAgICAgImRlZmF1bHQiOiAi2KrZhNin2LQg2YXYrNiv2K8iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi2YXYqtmGINio2LHYp9uMINiv2qnZhdmHINmG2YXYp9uM2LQg2b7Yp9iz2K4g2LXYrduM2K0iLAogICAgICAiZGVmYXVsdCI6ICLZhtmF2KfbjNi0INm+2KfYs9iuINi12K3bjNitIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItiq2YbYuNuM2YXYp9iqINi52YXZhNqp2LHYry4iLAogICAgICAiZGVzY3JpcHRpb24iOiAi2KfbjNmGINqv2LLbjNmG2YfigIzZh9inINio2Ycg2LTZhdinINin2KzYp9iy2Ycg2K7ZiNin2YfZhtivINiv2KfYryDahtqv2YjZhtqv24wg2LnZhdmE2qnYsdivINmB2LnYp9mE24zYqiDYsdinINqp2YbYqtix2YQg2qnZhtuM2K8uIiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAi2YHYudin2YTigIzYs9in2LLbjCDYqtmE2KfYtCDZhdis2K\/YryIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICLZgdi52KfZhOKAjNiz2KfYstuMINiv2qnZhdmHINmG2YXYp9uM2LQg2b7Yp9iz2K4g2LXYrduM2K0iCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAi2YHYudin2YTigIzYs9in2LLbjCDYr9qp2YXZhyDYqNix2LHYs9uMIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogItmG2YXYp9uM2LQg2KfZhdiq24zYp9iy2KfYqiIsCiAgICAgICAgICAiZGVzY3JpcHRpb24iOiAi2YbZhdin24zYtCDYp9mF2KrbjNin2LLYp9iqINqp2LPYqCDYtNiv2Ycg2KjYsdin24wg2YfYsSDZvtin2LPYri4iCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi2YXYqtmGINm+2KfYs9iuINi12K3bjNitIiwKICAgICAgImRlZmF1bHQiOiAi2LXYrduM2K0hIiwKICAgICAgImRlc2NyaXB0aW9uIjogItmF2KrZhiDZhdmI2LHYryDYp9iz2KrZgdin2K\/ZhyDYqNix2KfbjCDYp9i02KfYsdmHINqp2LHYr9mGINio2Ycg2KfbjNmG2qnZhyDbjNqpINm+2KfYs9iuINi12K3bjNitINin2LPYqiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLZhdiq2YYg2b7Yp9iz2K4g2LrZhNi3IiwKICAgICAgImRlZmF1bHQiOiAi2LrZhNi3ISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLZhdiq2YYg2YXZiNix2K8g2KfYs9iq2YHYp9iv2Ycg2KjYsdin24wg2KfYtNin2LHZhyDaqdix2K\/ZhiDYqNmHINin24zZhtqp2Ycg24zaqSDZvtin2LPYriDYutmE2Lcg2KfYs9iqIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItmF2KrZhiDZvtin2LPYriDZhtin2YXZiNis2YjYryIsCiAgICAgICJkZWZhdWx0IjogItm+2KfYs9iuINuM2KfZgdiqINmG2LTYryEiLAogICAgICAiZGVzY3JpcHRpb24iOiAi2YXYqtmGINmF2YjYsdivINin2LPYqtmB2KfYr9mHINio2LHYp9uMINin2LTYp9ix2Ycg2KjZhyDYp9uM2YbaqdmHINuM2qkg2b7Yp9iz2K4g2YbYp9mF2YjYrNmI2K8g2KfYs9iqIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItiq2YjYtduM2YEg2KjYsdin24wg2YbZhdin24zYtCDZvtin2LPYriDYtdit24zYrSIsCiAgICAgICJkZWZhdWx0IjogItiq2qnZhNuM2YEg2KjZhyDYsdmI2LIg2LHYs9in2YbbjCDYtNiv2Ycg2KfYs9iqINiq2Kcg2b7Yp9iz2K4g2LHYpyDYtNin2YXZhCDYtNmI2K8uIiwKICAgICAgImRlc2NyaXB0aW9uIjogItin24zZhiDZhdiq2YYg2KjZhyDaqdin2LHYqNixINmF24zigIzar9mI24zYryDaqdmHINiq2qnYp9mE24zZgSDYqNinINm+2KfYs9iuINi12K3bjNitINio2Ycg2LHZiNiyINix2LPYp9mG24wg2LTYr9mG2K8uIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItio2KfYstmG2YXYp9uM24wg2YXYqtmG24wg2YbZiNin2LEg2YbZhdix2Ycg2KjYsdin24wg2KLZhtmH2KfbjNuMINqp2Ycg2KfYsiDZhdio2K\/ZhCDZhdiq2YYg2KjZhyDar9mB2KrYp9ixINin2LPYqtmB2KfYr9mHINmF24zigIzaqdmG2YbYryIsCiAgICAgICJkZWZhdWx0IjogIti02YXYpyDYp9iyIOKAjjp0b3RhbCDYp9mF2KrbjNin2LLYjCDZhtmF2LHZhyDigI46bnVtINix2Kcg2K\/YsduM2KfZgdiqINqp2LHYr9uM2K8iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi2KjYsdqG2LPYqCDYqNix2KfbjCDZhdiq2YYg2qnYp9mF2YTYp9mLINiu2YjYp9mG2Kcg2KjYsdin24wg2YHZhtin2YjYsduM4oCM2YfYp9uMINqp2YXaqduMIiwKICAgICAgImRlZmF1bHQiOiAi2YXYqtmGINqp2KfZhdmE2KfZiyDYrtmI2KfZhtinIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItio2LHahtiz2Kgg2KjYsdin24wg2YXYqtmG24wg2qnZhyDaqdmE2YXYp9iqINii2YYg2LHYpyDZhduM4oCM2KrZiNin2YYg2KjYsdin24wg2YHZhtin2YjYsduM4oCM2YfYp9uMINqp2YXaqduMINmG2LTYp9mG2K\/Yp9ixINqp2LHYryIsCiAgICAgICJkZWZhdWx0IjogItmF2KrZhiDaqdin2YXZhCDaqdmHINqp2YTZhdin2KrYtCDZgtin2KjZhCDZhti02KfZhtiv2KfYsSDYtNiv2YYg2KfYs9iqIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItiz2LHYtdmB2K3ZhyDYrdin2YTYqiDZvtin2LPYriDYtdit24zYrSDYqNix2KfbjCDZgdmG2KfZiNix24zigIzZh9in24wg2qnZhdqp24wiLAogICAgICAiZGVmYXVsdCI6ICLYrdin2YTYqiDZvtin2LPYriDYtdit24zYrSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLYs9ix2LXZgdit2Ycg2K3Yp9mE2Kog2KjYsdix2LPbjCDYqNix2KfbjCDZgdmG2KfZiNix24zigIzZh9in24wg2qnZhdqp24wiLAogICAgICAiZGVmYXVsdCI6ICLYrdin2YTYqiDYqNix2LHYs9uMIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItiq2YjYtduM2YEg2YHZhtin2YjYsduMINqp2YXaqduMINio2LHYp9uMINiv2qnZhdmHINio2LHYsdiz24wiLAogICAgICAiZGVmYXVsdCI6ICLYqNix2LHYs9uMINm+2KfYs9iu4oCM2YfYpy4g2b7Yp9iz2K7igIzZh9inINi12K3bjNit2Iwg2LrZhNi32Iwg24zYpyDYqNuM4oCM2b7Yp9iz2K4g2LnZhNin2YXYquKAjNqv2LDYp9ix24wg2K7ZiNin2YfZhtivINi02K8uIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItiq2YjYtduM2YEg2YHZhtin2YjYsduMINqp2YXaqduMINio2LHYp9uMINiv2qnZhdmHINmG2YXYp9uM2LQg2b7Yp9iz2K4g2LXYrduM2K0iLAogICAgICAiZGVmYXVsdCI6ICLZhtmF2KfbjNi0INm+2KfYs9iuINi12K3bjNitLiDYqtqp2YTbjNmBINio2Kcg2b7Yp9iz2K4g2LXYrduM2K0g2KLZhiDYudmE2KfZhdiq4oCM2q\/YsNin2LHbjCDYrtmI2KfZh9ivINi02K8uIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItiq2YjYtduM2YEg2YHZhtin2YjYsduMINqp2YXaqduMINio2LHYp9uMINiv2qnZhdmHINiq2YTYp9i0INmF2KzYr9ivIiwKICAgICAgImRlZmF1bHQiOiAi2KrZhNin2LQg2YXYrNiv2K8uINio2KfYstmG2LTYp9mG24wg2YfZhdmHINm+2KfYs9iu4oCM2YfYpyDZiCDYtNix2YjYuSDYr9mI2KjYp9ix2Ycg2KraqdmE24zZgS4iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.MarkTheWords-1.11\/language\/fi.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJNZWRpYSIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIlR5eXBwaSIsCiAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiVmFsaW5uYWluZW4ga3V2YSB0YWkgdmlkZW8sIGpva2EgbsOka3l5IGt5c3lteWtzZW4geWzDpHB1b2xlbGxhLiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICLDhGzDpCBzYWxsaSBrdXZhbiBzdXVyZW50YW1pc3RhIgogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRlaHTDpHbDpG4ga3V2YXVzIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkt1dmFpbGUsIG1pdMOkIGvDpHl0dMOkasOkbiBwaXTDpMOkIHRlaGTDpC4iLAogICAgICAicGxhY2Vob2xkZXIiOiAiVmFsaXRzZSBrbGlra2FhbWFsbGEgdmVyYml0IHNldXJhYXZhc3RhIHRla3N0aXN0w6QuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0aWtlbnR0w6QiLAogICAgICAicGxhY2Vob2xkZXIiOiAiVMOkbcOkIG9uIHZhc3RhdXM6ICp2YXN0YXVzKi4iLAogICAgICAiaW1wb3J0YW50IjogewogICAgICAgICJkZXNjcmlwdGlvbiI6ICI8dWw+PGxpPk1lcmtpdHNlIHZhbGl0dGF2YXQgc2FuYXQgdMOkaHRpZW4gKCopIHbDpGxpaW4sIGVzaW1lcmtpa3NpICpzecO2biouPC9saT48bGk+Sm9zIHRhcmtvaXR1a3NlbmEgb24gdmFsaXRhIHNhbmFuIHNpamFhbiBwZWxra8OkICotbWVya2tpLCBuaWluIG1lcmtpdHNlIHNlIG11b2Rvc3NhICoqLjwvbGk+PC91bD4iLAogICAgICAgICJleGFtcGxlIjogIk9pa2VhdCBzYW5hdCBtZXJraXTDpMOkbiBzZXVyYWF2YXN0aTogKm9pa2Vhc2FuYSosIGFzdGVyaXNraXQga2lyam9pdGV0YWFuIG7DpGluOiAqb2lrZWFzYW5hKioqLiIKICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIllsZWluZW4gcGFsYXV0ZSIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgICAgIHsKICAgICAgICAgICAgICAibGFiZWwiOiAiT2xldHVzIgogICAgICAgICAgICB9CiAgICAgICAgICBdLAogICAgICAgICAgImxhYmVsIjogIk3DpMOkcml0w6QgbXVva2F0dHUgcGFsYXV0ZSBwaXN0ZXJham9qZW4gbXVrYWFuLiIsCiAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiS2xpa2thYSBcIkxpc8Okw6QgYWx1ZVwiIHBhaW5pa2V0dGEgbGlzw6R0w6Rrc2VzaSBuaWluIG1vbnRhIHBpc3RlcmFqYWEga3VpbiB0YXJ2aXQuIEVzaW1lcmtpa3NpOiAwLTIwJSBIdW9ubyB0dWxvcywgMjEtOTElIEtlbHBvIHR1bG9zLCA5MS0xMDAlIE1haHRhdmEgdHVsb3MhIiwKICAgICAgICAgICJlbnRpdHkiOiAiYWx1ZSIsCiAgICAgICAgICAiZmllbGQiOiB7CiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlBpc3RlcmFqYSIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHt9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJQYWxhdXRlIG3DpMOkcml0ZWxseWxsZSBwaXN0ZXJhamFsbGUiLAogICAgICAgICAgICAgICAgInBsYWNlaG9sZGVyIjogIktpcmpvaXRhIHBhbGF1dGUiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUGFpbmlra2VlbiBcIlRhcmtpc3RhXCIgbmltaSIsCiAgICAgICJkZWZhdWx0IjogIlRhcmtpc3RhIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIFwiU3VibWl0XCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiU3VibWl0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlBhaW5pa2tlZW4gXCJZcml0w6QgdXVkZWxsZWVuXCIgbmltaSIsCiAgICAgICJkZWZhdWx0IjogIllyaXTDpCB1dWRlbGxlZW4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUGFpbmlra2VlbiBcIkthdHNvIHZhc3RhdXNcIiBuaW1pIiwKICAgICAgImRlZmF1bHQiOiAiS2F0c28gdmFzdGF1cyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJZbGVpc2FzZXR1a3NldCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJOw6RpbGzDpCB2YWxpbm5vaWxsYSB2b2l0IG9oamFpbGxhIHRlaHTDpHbDpG4gdG9pbWludG9qYS4iLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJTYWxsaSBwYWluaWtlIFwiWXJpdMOkIHV1ZGVsbGVlblwiIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIlNhbGxpIHBhaW5pa2UgXCJLYXRzbyB2YXN0YXVzXCIiCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiRW5hYmxlIFwiQ2hlY2tcIiBidXR0b24iCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiTsOkeXTDpCBwaXN0ZWV0IiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJOw6R5dMOkIGFuc2FpdHV0IHBpc3RlZXQgam9rYSB2YXN0YXVrc2VsbGUuIgogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk9pa2VhbiB2YXN0YXVrc2VuIHRla3N0aSIsCiAgICAgICJkZWZhdWx0IjogIk9pa2VpbiEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGVrc3RpIG9pa2VhbGxlIHZhc3RhdWtzZWxsZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJWw6TDpHLDpG4gdmFzdGF1a3NlbiB0ZWtzdGkiLAogICAgICAiZGVmYXVsdCI6ICJWw6TDpHJpbiEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGVrc3RpIHbDpMOkcsOkbGxlIHZhc3RhdWtzZWxsZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJPaGl0ZXR1biB2YXN0YXVrc2VuIHRla3N0aSIsCiAgICAgICJkZWZhdWx0IjogIlZhc3RhdWtzaWEgZWkgbMO2eXR5bnl0ISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZWtzdGkgb2hpdGV0dWxsZS9wdXV0dHV2YWxsZSB2YXN0YXVrc2VsbGUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUGFpbmlra2VlbiBOw6R5dMOkIHZhc3RhdWtzZXQga3V2YXVzIiwKICAgICAgImRlZmF1bHQiOiAiVGVodMOkdsOkIG9uIHDDpGl2aXRldHR5IHZhc3RhdXN0ZW4gbsOkeXR0w6RtaXNla3NpIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlTDpG3DpCB0ZWtzdGkga2VydG9vIHRla2lqw6RsbGUsIGV0dMOkIHRlaHTDpHbDpCBvbiBww6Rpdml0ZXR0eSByYXRrYWlzdWxsYS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3RpbXVvdG9pbmVuIGVzaXR5cyBwaXN0ZXBhbGtpc3RhIG5paWxsZSBqb3RrYSBrw6R5dHTDpHbDpHQgcnV1ZHVubHVraWphc292ZWxsdXN0YSIsCiAgICAgICJkZWZhdWx0IjogIlNhaXQgOm51bSBwaXN0ZXR0w6QgOnRvdGFsIHBpc3RlZXN0w6QiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiT3RzaWtrbyBrb2tvIGF2dXN0YXZhbiB0ZWtub2xvZ2lhbiBsdWV0dGF2YWxsZSB0ZWtzdGlsbGUiLAogICAgICAiZGVmYXVsdCI6ICJLb2tvIGx1ZXR0YXZhIHRla3N0aSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJPdHNpa2tvIHRla3N0aWxsZSBqb3N0YSBzYW5hdCB2b2lkYWFuIG1lcmtpdMOkIGF2dXN0YXZhbGxlIHRla25vbG9naWFsbGUiLAogICAgICAiZGVmYXVsdCI6ICJLb2tvIHRla3N0aSBqb3N0YSBzYW5hdCB2b2lkYWFuIG1lcmtpdMOkIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlJhdGthaXN1dGlsYW4gb3RzaWtrbyBhdnVzdGF2YWxsZSB0ZWtub2xvZ2lhbGxlIiwKICAgICAgImRlZmF1bHQiOiAiUmF0a2Fpc3V0aWxhIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRhcmthc3R1c3RpbGFuIG90c2lra28gYXZ1c3RhdmFsbGUgdGVrbm9sb2dpYWxsZSIsCiAgICAgICJkZWZhdWx0IjogIlRhcmthc3R1c3RpbGEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQXZ1c3RhdmFuIHRla25vbG9naWFuIGt1dmF1cyBcIlRhcmtpc3RhXCIgcGFpbmlra2VlbGxlIiwKICAgICAgImRlZmF1bHQiOiAiVGFya2lzdGEgdmFzdGF1a3NldC4gVmFzdGF1a3NldCBtZXJraXTDpMOkbiBqb2tvIG9pa2VpbiwgdsOkw6RyaW4gdGFpIHZhc3RhYW1hdHRhLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJBdnVzdGF2YW4gdGVrbm9sb2dpYW4ga3V2YXVzIFwiTsOkeXTDpCByYXRrYWlzdVwiIC1wYWluaWtrZWVsbGUiLAogICAgICAiZGVmYXVsdCI6ICJOw6R5dMOkIHJhdGthaXN1LiBUZWh0w6R2w6TDpG4gbWVya2l0w6TDpG4gb2lrZWF0IHZhc3RhdWtzZXQuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkF2dXN0YXZhbiB0ZWtub2xvZ2lvbiBrdXZhdXMgXCJZcml0w6QgdXVkZWxsZWVuXCIgLXBhaW5pa2tlZWxsZSIsCiAgICAgICJkZWZhdWx0IjogIllyaXTDpCB0ZWh0w6R2w6TDpCB1dWRlbGxlZW4uIFR5aGplbm7DpCBrYWlra2kgdmFzdGF1a3NldCBqYSBhbG9pdGEgdGVodMOkdsOkIHV1ZGVsbGVlbiBhbHVzdGEuIgogICAgfQogIF0KfQo="],"libraries\/H5P.MarkTheWords-1.11\/language\/fr.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJNw6lkaWEiLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJUeXBlIiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJNw6lkaWEgw6AgYWZmaWNoZXIgYXUtZGVzc3VzIGRlIGxhIHF1ZXN0aW9uIChmYWN1bHRhdGlmKS4iCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiRMOpc2FjdGl2ZXIgbGUgem9vbSBzdXIgaW1hZ2UgcG91ciBsJ2ltYWdlIGRlIGxhIHF1ZXN0aW9uIgogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkRlc2NyaXB0aW9uIGRlIGxhIHTDomNoZSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJFeHBsaXF1ZXogY2UgcXVlIGRvaXQgZmFpcmUgbCd1dGlsaXNhdGV1ci4iLAogICAgICAicGxhY2Vob2xkZXIiOiAiQ2xpcXVlciBzdXIgdG91cyBsZXMgdmVyYmVzIGRhbnMgbGUgdGV4dGUgY2ktZGVzc291cy4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2hhbXAgZGUgdGV4dGUiLAogICAgICAicGxhY2Vob2xkZXIiOiAiVm9pY2kgdW5lIHLDqXBvbnNlIGV4YWN0ZSA6ICpyw6lwb25zZSouIiwKICAgICAgImltcG9ydGFudCI6IHsKICAgICAgICAiZGVzY3JpcHRpb24iOiAiPHVsPjxsaT5MZXMgbW90cyBjb3JyZWN0cyBzb250IG1hcnF1w6lzIGF2ZWMgdW4gYXN0w6lyaXNxdWUgKCopIGF2YW50IGV0IGFwcsOocyBsZSBtb3QuPC9saT48bGk+TGVzIGFzdMOpcmlzcXVlcyBwZXV2ZW50IMOqdHJlIGFqb3V0w6lzIGRhbnMgbGVzIG1vdHMgbWFycXXDqXMgZW4gYWpvdXRhbnQgdW4gYXV0cmUgYXN0w6lyaXNxdWUsICogbW90IGNvcnJlY3QgKioqID0mZ3Q7IG1vdCBjb3JyZWN0ICouPC9saT48bGk+U2V1bHMgbGVzIG1vdHMgcGV1dmVudCDDqnRyZSBtYXJxdcOpcyBjb21tZSBjb3JyZWN0cy4gUGFzIGxlcyBwaHJhc2VzLjwvbGk+PC91bD4iLAogICAgICAgICJleGFtcGxlIjogIkxlcyBtb3RzIGNvcnJlY3RzIHNvbnQgbWFycXXDqXMgY29tbWUgY2VjaTogKm1vdGNvcnJlY3QgKiwgdW4gYXN0w6lyaXNxdWUgZXN0IMOpY3JpdCBjb21tZSBjZWNpOiAqbW90Y29ycmVjdCoqKi4iCiAgICAgIH0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJGZWVkYmFjayBnw6luw6lyYWwiLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJ3aWRnZXRzIjogWwogICAgICAgICAgICB7CiAgICAgICAgICAgICAgImxhYmVsIjogIlBhciBkw6lmYXV0IgogICAgICAgICAgICB9CiAgICAgICAgICBdLAogICAgICAgICAgImxhYmVsIjogIkTDqWZpbmlzc2V6IGxlIGZlZWRiYWNrIHBvdXIgY2hhcXVlIGludGVydmFsbGUgZGUgc2NvcmUiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIkNsaXF1ZXogc3VyIGxlIGJvdXRvbiBcIkFqb3V0ZXogSW50ZXJ2YWxsZVwiIHBvdXIgYWpvdXRlciBhdXRhbnQgZCdpbnRlcnZhbGxlcyBxdWUgdm91cyBsZSBzb3VoYWl0ZXouIEV4ZW1wbGU6IDAtMjAlIE1hdXZhaXMgc2NvcmUsIDIxLTkxJSBTY29yZSBtb3llbiwgOTEtMTAwJSBTY29yZSBleGNlbGxlbnQgISIsCiAgICAgICAgICAiZW50aXR5IjogImludGVydmFsbGUiLAogICAgICAgICAgImZpZWxkIjogewogICAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJJbnRlcnZhbGxlIGRlIHNjb3JlIgogICAgICAgICAgICAgIH0sCiAgICAgICAgICAgICAge30sCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIkZlZWRiYWNrIHBvdXIgbCdpbnRlcnZhbGxlIGRlIHNjb3JlIGTDqWZpbmkiLAogICAgICAgICAgICAgICAgInBsYWNlaG9sZGVyIjogIlJlbXBsaXIgbGUgZmVlZGJhY2siCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dGUgZHUgYm91dG9uIFwiVsOpcmlmaWVyXCIiLAogICAgICAiZGVmYXVsdCI6ICJWw6lyaWZpZXIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJTdWJtaXRcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJWw6lyaWZpZXIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dGUgZHUgYm91dG9uIFwiUmVjb21tZW5jZXJcIiIsCiAgICAgICJkZWZhdWx0IjogIlJlY29tbWVuY2VyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRlIGR1IGJvdXRvbiBcIlZvaXIgbGEgc29sdXRpb25cIiIsCiAgICAgICJkZWZhdWx0IjogIlZvaXIgbGEgY29ycmVjdGlvbiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJPcHRpb25zIGfDqW7DqXJhbGVzIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkNlcyBvcHRpb25zIHZvdXMgcGVybWV0dGVudCBkZSBjb250csO0bGVyIGxlIGTDqXJvdWxlbWVudCBkZSB2b3MgYWN0aXZpdMOpcy4iLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJBY3RpdmVyIGxlIGJvdXRvbiBcIlJlY29tbWVuY2VyXCIiCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiQWN0aXZlciBsZSBib3V0b24gXCJWb2lyIGxhIHNvbHV0aW9uXCIiCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiQWN0aXZlciBsZSBib3V0b24gXCJWw6lyaWZpZXJcIiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJNb250cmVyIGxlIHNjb3JlIGVuIHBvaW50cyIsCiAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiQWZmaWNoZXIgbGVzIHBvaW50cyBvYnRlbnVzIHBvdXIgY2hhcXVlIHLDqXBvbnNlLiIKICAgICAgICB9CiAgICAgIF0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0ZSBkZSByw6lwb25zZSBjb3JyZWN0ZSIsCiAgICAgICJkZWZhdWx0IjogIlLDqXBvbnNlIGNvcnJlY3RlICEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dGUgcG91ciBpbmRpcXVlciBxdSd1bmUgcsOpcG9uc2UgZXN0IGJvbm5lIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRlIGRlIHLDqXBvbnNlIGluY29ycmVjdGUiLAogICAgICAiZGVmYXVsdCI6ICJSw6lwb25zZSBpbmNvcnJlY3RlICEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dGUgcG91ciBpbmRpcXVlciBxdSd1bmUgcsOpcG9uc2UgZXN0IG1hdXZhaXNlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRlIGRlIHLDqXBvbnNlIG1hbnF1w6llIiwKICAgICAgImRlZmF1bHQiOiAiQWJzZW5jZSBkZSByw6lwb25zZSAhIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHRlIHBvdXIgaW5kaXF1ZXIgcXUndW5lIHLDqXBvbnNlIG1hbnF1ZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZXNjcmlwdGlvbiBwb3VyIGxhIHNvbHV0aW9uIGQnYWZmaWNoYWdlIiwKICAgICAgImRlZmF1bHQiOiAiTCdhY3Rpdml0w6kgYSDDqXTDqSBtaXNlIMOgIGpvdXIgcG91ciBhZmZpY2hlciBsYSBzb2x1dGlvbi4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiQ2UgdGV4dGUgaW5kaXF1ZSDDoCBsJ3V0aWxpc2F0ZXVyIHF1ZSBsJ2FjdGl2aXTDqSBhIMOpdMOpIG1pc2Ugw6Agam91ciBhdmVjIGxhIHNvbHV0aW9uLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJSZXByw6lzZW50YXRpb24gdGV4dHVlbGxlIGR1IHBhbm5lYXUgZHUgc2NvcmUgcG91ciBsZXMgdXRpbGlzYXRldXJzIGRlIGxhIHN5dGjDqHNlIHZvY2FsZSIsCiAgICAgICJkZWZhdWx0IjogIlZvdXMgYXZleiA6bnVtIHBvaW50cyBzdXIgdW4gdG90YWwgZGUgOnRvdGFsIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkxhYmVsIGZvciB0aGUgZnVsbCByZWFkYWJsZSB0ZXh0IGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiRnVsbCByZWFkYWJsZSB0ZXh0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkxhYmVsIGZvciB0aGUgdGV4dCB3aGVyZSB3b3JkcyBjYW4gYmUgbWFya2VkIGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiRnVsbCB0ZXh0IHdoZXJlIHdvcmRzIGNhbiBiZSBtYXJrZWQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiU29sdXRpb24gbW9kZSBoZWFkZXIgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJTb2x1dGlvbiBtb2RlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNoZWNraW5nIG1vZGUgaGVhZGVyIGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiQ2hlY2tpbmcgbW9kZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJBc3Npc3RpdmUgdGVjaG5vbG9neSBkZXNjcmlwdGlvbiBmb3IgXCJDaGVja1wiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIkNoZWNrIHRoZSBhbnN3ZXJzLiBUaGUgcmVzcG9uc2VzIHdpbGwgYmUgbWFya2VkIGFzIGNvcnJlY3QsIGluY29ycmVjdCwgb3IgdW5hbnN3ZXJlZC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRGVzY3JpcHRpb24gZGUgbGEgdGVjaG5vbG9naWUgZm9uY3Rpb25uZWxsZSBwb3VyIGxhIHRvdWNoZSDCqyBBZmZpY2hlciBsYSBzb2x1dGlvbiDCuyIsCiAgICAgICJkZWZhdWx0IjogIkFmZmljaGVyIGxhIHNvbHV0aW9uLiBMYSB0w6JjaGUgc2VyYSBub3TDqWUgYXZlYyBzYSBzb2x1dGlvbiBjb3JyZWN0ZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRGVzY3JpcHRpb24gZGUgbGEgdGVjaG5vbG9naWUgZm9uY3Rpb25uZWxsZSBwb3VyIGxhIHRvdWNoZSDCqyBSw6llc3NheWVyIMK7IiwKICAgICAgImRlZmF1bHQiOiAiUsOpZXNzYXllciBsYSB0w6JjaGUuIFLDqWluaXRpYWxpc2VyIHRvdXRlcyBsZXMgcsOpcG9uc2VzIGV0IHJlY29tbWVuY2VyIGxhIHTDomNoZS4iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.MarkTheWords-1.11\/language\/gl.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJNZWRpb3MiLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJUaXBvIiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJNZWRpb3MgYWRpY2lvbmFpcyBhbW9zYWRvcyBlbnJpYmEgZGEgcHJlZ3VudGEuIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkRlc2FjdGl2YXIgem9vbSBkYSBpbWF4ZSIKICAgICAgICB9CiAgICAgIF0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZXNjcmljacOzbiBkYSB0YXJlZmEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRGVzY3JpYmUgY29tbyBkZWJlcsOtYSByZXNvbHZlciBhIHRhcmVmYSBvIHVzdWFyaW8uIiwKICAgICAgInBsYWNlaG9sZGVyIjogIlByZW1lIGVuIHRvZG9zIG9zIHZlcmJvcyBkbyB0ZXh0by4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2FtcG8gZGUgdGV4dG8iLAogICAgICAicGxhY2Vob2xkZXIiOiAiRXN0YSDDqSB1bmhhIHJlc3Bvc3RhOiAqcmVzcG9zdGEqLiIsCiAgICAgICJpbXBvcnRhbnQiOiB7CiAgICAgICAgImRlc2NyaXB0aW9uIjogIjx1bD48bGk+QXMgcGFsYWJyYXMgbWFyY2FkYXMgZW5nw6FkZW5zZSBjdW4gYXN0ZXLDrXNjbyAoKikuPC9saT48bGk+UMOzZGVuc2UgZW5nYWRpciBhc3RlcsOtc2NvcyBkZW50cm8gZGFzIHBhbGFicmFzIG1hcmNhZGFzIGVuZ2FkaW5kbyBvdXRybyBhc3RlcsOtc2NvLCAqcGFsYWJyYWNvcnJlY3RhKioqID0mZ3Q7IHBhbGFicmFjb3JyZWN0YSouPC9saT48L3VsPiIsCiAgICAgICAgImV4YW1wbGUiOiAiQXMgcGFsYWJyYXMgY29ycmVjdGFzIG3DoXJjYW5zZSBhc8OtOiAqcGFsYWJyYWNvcnJlY3RhKiwgbyBhc3RlcsOtc2NvIGVzY3LDrWJlc2UgYXPDrTogKnBhbGFicmFjb3JyZWN0YSoqKi4iCiAgICAgIH0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJSZXRyb2FsaW1lbnRhY2nDs24geGVyYWwiLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJ3aWRnZXRzIjogWwogICAgICAgICAgICB7CiAgICAgICAgICAgICAgImxhYmVsIjogIlBvciBkZWZlY3RvIgogICAgICAgICAgICB9CiAgICAgICAgICBdLAogICAgICAgICAgImxhYmVsIjogIkRlZmluZSBhIHJldHJvYWxpbWVudGFjacOzbiBwb3IgZGVmZWN0byBwYXJhIGNhbHF1ZXJhIHJhbmdvIGRlIHB1bnR1YWNpw7NuIiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJQcmVtZSBvIGJvdMOzbiBcIkVuZ2FkaXIgcmFuZ29cIiBwYXJhIGVuZ2FkaXIgdGFudG9zIHJhbmdvcyBjb21vIHByZWNpc2VzLiBFeGVtcGxvOiAwLTIwJSBNYWxhIFB1bnR1YWNpw7NuLCAyMS05MSUgUHVudHVhY2nDs24gTWVkaWEsIDkxLTEwMCUgUHVudHVhY2nDs24gWGVuaWFsISIsCiAgICAgICAgICAiZW50aXR5IjogInJhbmdvIiwKICAgICAgICAgICJmaWVsZCI6IHsKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiUmFuZ28gZGUgUHVudHVhY2nDs24iCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7fSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiUmV0cm9hbGltZW50YWNpw7NuIHBhcmEgcmFuZ28gZGUgcHVudHVhY2nDs24gZGVmaW5pZG8iLAogICAgICAgICAgICAgICAgInBsYWNlaG9sZGVyIjogIkVzY3JpYmUgYSByZXRyb2FsaW1lbnRhY2nDs24iCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSBvIGJvdMOzbiBcIkNvbXByb2JhclwiIiwKICAgICAgImRlZmF1bHQiOiAiQ29tcHJvYmFyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgbyBib3TDs24gXCJFbnZpYXJcIiIsCiAgICAgICJkZWZhdWx0IjogIlN1Ym1pdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIG8gYm90w7NuIFwiVGVudGFyIGRlIG5vdm9cIiIsCiAgICAgICJkZWZhdWx0IjogIlRlbnRhciBkZSBub3ZvIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgbyBib3TDs24gXCJBbW9zYXIgc29sdWNpw7NuXCIiLAogICAgICAiZGVmYXVsdCI6ICJBbW9zYXIgc29sdWNpw7NuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNvbmZpZ3VyYWNpw7NuIGRvIGNvbXBvcnRhbWVudG8uIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkVzdGFzIG9wY2nDs25zIHBlcm1pdGVuIGNvbnRyb2xhciBjb21vIHNlIGNvbXBvcnRhIGEgdGFyZWZhLiIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkFjdGl2YXIgXCJSZWludGVudGFyXCIiCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiQWN0aXZhciBib3TDs24gXCJBbW9zYXIgc29sdWNpw7NuXCIiCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiQWN0aXZhciBib3TDs24gXCJDb21wcm9iYXJcIiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJBbW9zYXIgcHVudHVhY2nDs24iLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIkFtb3NhciBvcyBwdW50b3MgZ2HDsWFkb3MgcG9yIGNhZGEgcmVzcG9zdGEuIgogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIGRlIHJlc3Bvc3RhIGNvcnJlY3RhIiwKICAgICAgImRlZmF1bHQiOiAiQ29ycmVjdG8hIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHRvIHVzYWRvIHBhcmEgaW5kaWNhciBxdWUgdW5oYSByZXNwb3N0YSDDqSBjb3JyZWN0YSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBkZSByZXNwb3N0YSBpbmNvcnJlY3RhIiwKICAgICAgImRlZmF1bHQiOiAiSW5jb3JyZWN0byEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dG8gdXNhZG8gcGFyYSBpbmRpY2FyIHF1ZSB1bmhhIHJlc3Bvc3RhIMOpIGluY29ycmVjdGEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gZGUgcmVzcG9zdGEgYXVzZW50ZSIsCiAgICAgICJkZWZhdWx0IjogIk5vbiBzZSBhdG9wb3UgYSByZXNwb3N0YSEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dG8gdXNhZG8gcGFyYSBpbmRpY2FyIHF1ZSBmYWx0YSB1bmhhIHJlc3Bvc3RhIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkRlc2NyaWNpw7NuIHBhcmEgQW1vc2FyIFNvbHVjacOzbiIsCiAgICAgICJkZWZhdWx0IjogIkFjdHVhbGl6b3VzZSBhIHRhcmVmYSBjb2Egc29sdWNpw7NuLiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJFc3RlIHRleHRvIGRpbGxlIGFvIHVzdWFyaW8gcXVlIGFzIHRhcmVmYXMgYWN0dWFsaXrDoXJvbnNlIGNvYXMgc29sdWNpw7Nucy4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUmVwcmVzZW50YWNpw7NuIHRleHR1YWwgZGEgcHVudHVhY2nDs24gY2FuZG8gc2UgZXN0w6EgYSB1c2FyIHVuIGxlY3RvciBkZSBwYW50YWxsYSIsCiAgICAgICJkZWZhdWx0IjogIkNvbnNlZ3VpY2hlcyA6bnVtIGR1biB0b3RhbCBkZSA6dG90YWwgcHVudG9zIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkV0aXF1ZXRhIHBhcmEgdGV4dG8gbGV4aWJsZSBjb21wbGV0byBwYXJhIGFzIHRlY25vbG94w61hcyBkZSBhc2lzdGVuY2lhIiwKICAgICAgImRlZmF1bHQiOiAiVGV4dG8gbGV4aWJsZSBjb21wbGV0byIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFdGlxdWV0YSBwYXJhIG8gdGV4dG8gbm8gcXVlIHNlIHBvZGVuIG1hcmNhciBwYWxhYnJhcyBwYXJhIGFzIHRlY25vbG94w61hcyBkZSBhc2lzdGVuY2lhIiwKICAgICAgImRlZmF1bHQiOiAiVGV4dG8gY29tcGxldG8gbm8gcXVlIHNlIHBvZGVuIG1hcmNhciBwYWxhYnJhcyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDYWJlY2VpcmEgZG8gbW9kbyBzb2x1Y2nDs24gcGFyYSBhcyB0ZWNub2xveMOtYXMgZGUgYXNpc3RlbmNpYSIsCiAgICAgICJkZWZhdWx0IjogIk1vZG8gc29sdWNpw7NuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNhYmVjZWlyYSBkbyBtb2RvIGNvbXByb2JhY2nDs24gcGFyYSBhcyB0ZWNub2xveMOtYXMgZGUgYXNpc3RlbmNpYSIsCiAgICAgICJkZWZhdWx0IjogIk1vZG8gY29tcHJvYmFjacOzbiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZXNjcmljacOzbiBkbyBib3TDs24gXCJDb21wcm9iYXJcIiBwYXJhIGFzIHRlY25vbG94w61hcyBkZSBhc2lzdGVuY2lhIiwKICAgICAgImRlZmF1bHQiOiAiQ29tcHJvYmEgYXMgcmVzcG9zdGFzLiBBcyByZXNwb3N0YXMgbWFyY2FyYW5zZSBjb21vIGNvcnJlY3RhcywgaW5jb3JyZWN0YXMgb3Ugbm9uIGNvbnRlc3RhZGFzLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZXNjcmljacOzbiBkbyBib3TDs24gXCJBbW9zYXIgc29sdWNpw7NuXCIgcGFyYSBhcyB0ZWNub2xveMOtYXMgZGUgYXNpc3RlbmNpYSIsCiAgICAgICJkZWZhdWx0IjogIkFtb3NhciBhIHNvbHVjacOzbi4gQSB0YXJlZmEgbWFyY2FyYXNlIGNvYSBzw7phIHNvbHVjacOzbiBjb3JyZWN0YS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRGVzY3JpY2nDs24gZG8gYm90w7NuIFwiUmVpbnRlbnRhclwiIHBhcmEgYXMgdGVjbm9sb3jDrWFzIGRlIGFzaXN0ZW5jaWEiLAogICAgICAiZGVmYXVsdCI6ICJUZW50YXIgZGUgbm92byBhIHRhcmVmYS4gQm9ycmEgdG9kYXMgYXMgcmVzcG9zdGFzIGUgZW1wZXphIGEgdGFyZWZhIGRlIG5vdm8uIgogICAgfQogIF0KfQo="],"libraries\/H5P.MarkTheWords-1.11\/language\/he.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLXnteT15nXlCIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIteh15XXkiIsCiAgICAgICAgICAiZGVzY3JpcHRpb24iOiAi16DXmdeq158g15zXlNeV16HXmdejINeq157Xldeg15Qg15DXqdeoINeq15XXpteSINee16LXnCDXlNep15DXnNeULiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICLXkdeZ15jXldecINeU15DXpNep16jXldeqINec15TXkteT15zXqiDXqtee15XXoNeUIgogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIteq15nXkNeV16gg157XqdeZ157XlCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLXqteQ16jXlSDXm9eZ16bXkyDXotecINeU157Xqdeq157XqSDXnNek16rXldeoINeQ16og15TXntep15nXnteULiIsCiAgICAgICJwbGFjZWhvbGRlciI6ICLXmdepINec15zXl9eV16Ug16LXnCDXm9ecINeU16TXotec15nXnSDXkden15jXoiDXlNeq15XXm9efINeU15HXkC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi15DXlteV16gg16rXldeb158iLAogICAgICAicGxhY2Vob2xkZXIiOiAi15bXlSDXqtep15XXkdeUOiAqYW5zd2VyKi4iLAogICAgICAiaW1wb3J0YW50IjogewogICAgICAgICJkZXNjcmlwdGlvbiI6ICI8dWw+PGxpPk1hcmtlZCB3b3JkcyBhcmUgYWRkZWQgd2l0aCBhbiBhc3RlcmlzayAoKikuPC9saT48bGk+QXN0ZXJpc2tzIGNhbiBiZSBhZGRlZCB3aXRoaW4gbWFya2VkIHdvcmRzIGJ5IGFkZGluZyBhbm90aGVyIGFzdGVyaXNrLCAqY29ycmVjdHdvcmQqKiogPSZndDsgY29ycmVjdHdvcmQqLjwvbGk+PC91bD4iLAogICAgICAgICJleGFtcGxlIjogIlRoZSBjb3JyZWN0IHdvcmRzIGFyZSBtYXJrZWQgbGlrZSB0aGlzOiAqY29ycmVjdHdvcmQqLCBhbiBhc3RlcmlzayBpcyB3cml0dGVuIGxpa2UgdGhpczogKmNvcnJlY3R3b3JkKioqLiIKICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItee16nXldeRINeb15XXnNecIiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAid2lkZ2V0cyI6IFsKICAgICAgICAgICAgewogICAgICAgICAgICAgICJsYWJlbCI6ICLXkdeo15nXqNeqINee15fXk9ecIgogICAgICAgICAgICB9CiAgICAgICAgICBdLAogICAgICAgICAgImxhYmVsIjogIteU15LXk9eZ16jXlSDXntep15XXkSDXnteV16rXkNedINeQ15nXqdeZ16og15zXm9ecINeY15XXldeXINem15nXldeg15nXnSIsCiAgICAgICAgICAiZGVzY3JpcHRpb24iOiAi15zXl9em15Ug16LXnCDXm9ek16rXldeoIFwi15TXldeh16Mg15jXldeV15dcIiDXm9eT15kg15zXlNeV16HXmdejINeb157XlCDXmNeV15XXl9eZ150g15zXpNeZINeU16bXldeo15ouINeT15XXktee15Q6IDAtMjAlINem15nXldefINeo16IsIDIxLTkxJSDXpteZ15XXnyDXntee15XXpteiLCA5MS0xMDAlINem15nXldefINee16LXldec15QhIiwKICAgICAgICAgICJlbnRpdHkiOiAi15jXldeV15ciLAogICAgICAgICAgImZpZWxkIjogewogICAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICLXmNeV15XXlyDXpteZ15XXoNeZ150iCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7fSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAi157XqdeV15Eg15zXmNeV15XXlyDXpteZ15XXoNeZ150g157XldeS15PXqCIsCiAgICAgICAgICAgICAgICAicGxhY2Vob2xkZXIiOiAi157XnNeQ15Ug15DXqiDXlNee16nXldeRIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIteY16fXodeYINec15vXpNeq15XXqCBcIteR15PXldenXCIiLAogICAgICAiZGVmYXVsdCI6ICLXkdeT15XXpyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBcIlN1Ym1pdFwiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlN1Ym1pdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLXqteV15vXnyDXm9ek16rXldeoIFwi16DXodeUINep15XXkVwiIiwKICAgICAgImRlZmF1bHQiOiAi16DXodeVINep15XXkSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLXqteZ15DXldeoINei15HXldeoINeb16TXqteV16ggXCLXlNem15nXkteVINek16rXqNeV159cIiIsCiAgICAgICJkZWZhdWx0IjogIteU16bXkiDXpNeq16jXldefIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIteU15LXk9eo15XXqiDXkNeV16TXnyDXpNei15XXnNeqINeU16jXm9eZ15EuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIteQ16TXqdeo15XXmdeV16og15DXnNeUINeZ15DXpNep16jXlSDXnNeaINec16nXnNeV15gg15HXkNeV16TXnyDXlNek16LXldec15Qg16nXnCDXlNee16nXmdee15QuIiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAi15TXpNei15zXqiDXm9ek16rXldeoIFwi16DXodeVINeR16nXoNeZ16pcIiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICLXlNek16LXnNeqINeb16TXqteV16ggXCLXlNem15nXkteVINek16rXqNeV159cIiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICLXlNek16LXnNeqINeb16TXqteV16ggXCLXodee159cIiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICLXlNem15nXkteVINeg16fXldeT15XXqiDXoNeZ16fXldeTIiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICLXlNem15nXkteVINeg16fXldeT15XXqiDXqdeU16rXp9eR15zXlSDXoteR15XXqCDXm9ecINeq16nXldeR15QuIgogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIteq15XXm9efINeq16nXldeR15Qg16DXm9eV16DXlCIsCiAgICAgICJkZWZhdWx0IjogIteg15vXldefISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLXqteZ15DXldeoINeU157Xqdee16kg15zXpteZ15XXnyDXqtep15XXkdeUINeg15vXldeg15QiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi16rXldeb158g16rXqdeV15HXlCDXqdeQ15nXoNeUINeg15vXldeg15QiLAogICAgICAiZGVmYXVsdCI6ICLXkNeZ16DXlSDXoNeb15XXnyEiLAogICAgICAiZGVzY3JpcHRpb24iOiAi16rXmdeQ15XXqCDXlNee16nXntepINec16bXmdeV158g16rXqdeV15HXlCDXqdeQ15nXoNeUINeg15vXldeg15QiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi16rXldeb158g16rXqdeV15HXlCDXl9eh16jXlCIsCiAgICAgICJkZWZhdWx0IjogIteq16nXldeR15Qg15zXkCDXoNee16bXkNeUIiwKICAgICAgImRlc2NyaXB0aW9uIjogIteq15nXkNeV16gg15TXntep157XqSDXnNem15nXldefINeq16nXldeR15Qg16nXkNeZ16DXlCDXoNei16DXqteUIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIteq15nXkNeV16gg16LXkdeV16gg16rXpteV15LXqiDXpNeq16jXldefIiwKICAgICAgImRlZmF1bHQiOiAi15TXntep15nXnteUINee16rXoteT15vXoNeqINeb15PXmSDXnNeU15vXmdecINeQ16og15TXpNeq16jXldefLiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLXqteV15vXnyAg15bXlCDXkNeV157XqCDXnNee16nXqtee16kg16nXlNee16nXmdee15XXqiDXoteV15PXm9eg15Ug16LXnSDXlNek16rXqNeV158uIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIteq16bXldeS15Qg157Xmdec15XXnNeZ16og16nXnCDXodeo15LXnCDXlNeg15nXp9eV15Mg16LXkdeV16gg15DXnNeUINeU157Xqdeq157XqdeZ150g15EtIHJlYWRzcGVha2VyIiwKICAgICAgImRlZmF1bHQiOiAi16fXmdeR15zXqtedIDpudW0g157XqteV15ogOnRvdGFsINeg16fXldeT15XXqiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLXqteV15XXmdeqINec15jXp9eh15gg15TXp9eo15DXlCDXntec15Ag16LXkdeV16gg15jXm9eg15XXnNeV15LXmdeV16og157XodeZ15nXoteV16oiLAogICAgICAiZGVmYXVsdCI6ICLXmNen16HXmCDXp9eo15nXkCDXntec15AiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi16rXldeV15nXqiDXnNeq15XXm9efINeR15Ug15DXpNep16gg15zXodee158g15DXqiDXlNee15nXnNeZ150g16LXkdeV16gg15jXm9eg15XXnNeV15LXmdeV16og157XodeZ15nXoteV16oiLAogICAgICAiZGVmYXVsdCI6ICLXmNen16HXmCDXntec15Ag15HXlSDXkNek16nXqCDXnNeh157XnyDXkNeqINeU157Xmdec15nXnSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLXm9eV16rXqNeqINep15TXmdeQINee16bXkSDXpNeq16jXldefINec15jXm9eg15XXnNeV15LXmdeV16og157XodeZ15nXoteV16oiLAogICAgICAiZGVmYXVsdCI6ICLXntem15Eg16TXqteo15XXnyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLXntem15Eg15HXk9eZ16fXqiDXm9eV16rXqNeqINei15HXldeoINeY15vXoNeV15zXldeS15nXldeqINee16HXmdeZ16LXldeqIiwKICAgICAgImRlZmF1bHQiOiAi157XpteRINeR15PXmden15QiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi16rXmdeQ15XXqCDXmNeb16DXldec15XXkteZ15Qg157XodeZ15nXoteqINei15HXldeoINeb16TXqteV16ggXCLXkdeT15nXp9eUXCIiLAogICAgICAiZGVmYXVsdCI6ICLXkdeT16fXlSDXkNeqINeU16rXqdeV15HXldeqLiDXlNee16LXoNeZ150g15nXodeV157XoNeVINeb16DXm9eV16DXmdedLCDXnNeQINeg15vXldeg15nXnSwg15DXlSDXm9eo15nXp9eZ150uIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIteq15nXkNeV16gg15jXm9eg15XXnNeV15LXmdeUINee16HXmdeZ16LXqiDXoteR15XXqCDXm9ek16rXldeoIFwi15TXpteS16og16TXqteo15XXn1wiIiwKICAgICAgImRlZmF1bHQiOiAi15TXpteZ15LXlSDXkNeqINeU16TXqteo15XXny4g15TXntep15nXnteUINeq16HXldee158g16LXnSDXlNek16rXqNeV158g15TXoNeb15XXnyDXqdec15QuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIteq15nXkNeV16gg15jXm9eg15XXnNeV15LXmdeUINee16HXmdeZ16LXqiDXoteR15XXqCDXm9ek16rXldeoIFwi16DXmdeh15nXldefINeX15XXlteoXCIiLAogICAgICAiZGVmYXVsdCI6ICLXoNeh15Ug15DXqiDXlNee16nXmdee15Qg16nXldeRLiDXkNek16HXlSDXkNeqINeb15wg16DXmdeh15nXldeg15XXqiDXlNee16LXoNeUINeV15TXqteX15nXnNeVINeQ16og15TXntep15nXnteUINee15fXk9epLiIKICAgIH0KICBdCn0="],"libraries\/H5P.MarkTheWords-1.11\/language\/hu.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJNw6lkaWEiLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJUw61wdXMiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIkxlaGV0c8OpZ2VzIE3DqWRpYSBhbWkgYSBrw6lyZMOpcyBmZWxldHQgamVsZW5payBtZWcuIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkvDqXAgcsOha8O2emVsw610w6lzIHRpbHTDoXNhIgogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRhc2sgZGVzY3JpcHRpb24iLAogICAgICAiZGVzY3JpcHRpb24iOiAiRGVzY3JpYmUgaG93IHRoZSB1c2VyIHNob3VsZCBzb2x2ZSB0aGUgdGFzay4iLAogICAgICAicGxhY2Vob2xkZXIiOiAiQ2xpY2sgb24gYWxsIHRoZSB2ZXJicyBpbiB0aGUgdGV4dCB0aGF0IGZvbGxvd3MuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRmaWVsZCIsCiAgICAgICJwbGFjZWhvbGRlciI6ICJUaGlzIGlzIGFuIGFuc3dlcjogKmFuc3dlciouIiwKICAgICAgImltcG9ydGFudCI6IHsKICAgICAgICAiZGVzY3JpcHRpb24iOiAiPHVsPjxsaT5NYXJrZWQgd29yZHMgYXJlIGFkZGVkIHdpdGggYW4gYXN0ZXJpc2sgKCopLjwvbGk+PGxpPkFzdGVyaXNrcyBjYW4gYmUgYWRkZWQgd2l0aGluIG1hcmtlZCB3b3JkcyBieSBhZGRpbmcgYW5vdGhlciBhc3RlcmlzaywgKmNvcnJlY3R3b3JkKioqID0mZ3Q7IGNvcnJlY3R3b3JkKi48L2xpPjwvdWw+IiwKICAgICAgICAiZXhhbXBsZSI6ICJUaGUgY29ycmVjdCB3b3JkcyBhcmUgbWFya2VkIGxpa2UgdGhpczogKmNvcnJlY3R3b3JkKiwgYW4gYXN0ZXJpc2sgaXMgd3JpdHRlbiBsaWtlIHRoaXM6ICpjb3JyZWN0d29yZCoqKi4iCiAgICAgIH0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJPdmVyYWxsIEZlZWRiYWNrIiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAid2lkZ2V0cyI6IFsKICAgICAgICAgICAgewogICAgICAgICAgICAgICJsYWJlbCI6ICJEZWZhdWx0IgogICAgICAgICAgICB9CiAgICAgICAgICBdLAogICAgICAgICAgImxhYmVsIjogIkRlZmluZSBjdXN0b20gZmVlZGJhY2sgZm9yIGFueSBzY29yZSByYW5nZSIsCiAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiQ2xpY2sgdGhlIFwiQWRkIHJhbmdlXCIgYnV0dG9uIHRvIGFkZCBhcyBtYW55IHJhbmdlcyBhcyB5b3UgbmVlZC4gRXhhbXBsZTogMC0yMCUgQmFkIHNjb3JlLCAyMS05MSUgQXZlcmFnZSBTY29yZSwgOTEtMTAwJSBHcmVhdCBTY29yZSEiLAogICAgICAgICAgImVudGl0eSI6ICJyYW5nZSIsCiAgICAgICAgICAiZmllbGQiOiB7CiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlNjb3JlIFJhbmdlIgogICAgICAgICAgICAgIH0sCiAgICAgICAgICAgICAge30sCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIkZlZWRiYWNrIGZvciBkZWZpbmVkIHNjb3JlIHJhbmdlIiwKICAgICAgICAgICAgICAgICJwbGFjZWhvbGRlciI6ICJGaWxsIGluIHRoZSBmZWVkYmFjayIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICB9CiAgICAgIF0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBcIkNoZWNrXCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiQ2hlY2siCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJTdWJtaXRcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJTdWJtaXQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJSZXRyeVwiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlJldHJ5IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIFwiU2hvdyBzb2x1dGlvblwiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlNob3cgc29sdXRpb24iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQmVoYXZpb3VyYWwgc2V0dGluZ3MuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRoZXNlIG9wdGlvbnMgd2lsbCBsZXQgeW91IGNvbnRyb2wgaG93IHRoZSB0YXNrIGJlaGF2ZXMuIiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiRW5hYmxlIFwiUmV0cnlcIiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJFbmFibGUgXCJTaG93IHNvbHV0aW9uXCIgYnV0dG9uIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkVuYWJsZSBcIkNoZWNrXCIgYnV0dG9uIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIlNob3cgc2NvcmUgcG9pbnRzIiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJTaG93IHBvaW50cyBlYXJuZWQgZm9yIGVhY2ggYW5zd2VyLiIKICAgICAgICB9CiAgICAgIF0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDb3JyZWN0IGFuc3dlciB0ZXh0IiwKICAgICAgImRlZmF1bHQiOiAiQ29ycmVjdCEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB1c2VkIHRvIGluZGljYXRlIHRoYXQgYW4gYW5zd2VyIGlzIGNvcnJlY3QiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiSW5jb3JyZWN0IGFuc3dlciB0ZXh0IiwKICAgICAgImRlZmF1bHQiOiAiSW5jb3JyZWN0ISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHVzZWQgdG8gaW5kaWNhdGUgdGhhdCBhbiBhbnN3ZXIgaXMgaW5jb3JyZWN0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk1pc3NlZCBhbnN3ZXIgdGV4dCIsCiAgICAgICJkZWZhdWx0IjogIkFuc3dlciBub3QgZm91bmQhIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdXNlZCB0byBpbmRpY2F0ZSB0aGF0IGFuIGFuc3dlciBpcyBtaXNzaW5nIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkRlc2NyaXB0aW9uIGZvciBEaXNwbGF5IFNvbHV0aW9uIiwKICAgICAgImRlZmF1bHQiOiAiVGFzayBpcyB1cGRhdGVkIHRvIGNvbnRhaW4gdGhlIHNvbHV0aW9uLiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUaGlzIHRleHQgdGVsbHMgdGhlIHVzZXIgdGhhdCB0aGUgdGFza3MgaGFzIGJlZW4gdXBkYXRlZCB3aXRoIHRoZSBzb2x1dGlvbi4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dHVhbCByZXByZXNlbnRhdGlvbiBvZiB0aGUgc2NvcmUgYmFyIGZvciB0aG9zZSB1c2luZyBhIHJlYWRzcGVha2VyIiwKICAgICAgImRlZmF1bHQiOiAiWW91IGdvdCA6bnVtIG91dCBvZiA6dG90YWwgcG9pbnRzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkxhYmVsIGZvciB0aGUgZnVsbCByZWFkYWJsZSB0ZXh0IGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiRnVsbCByZWFkYWJsZSB0ZXh0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkxhYmVsIGZvciB0aGUgdGV4dCB3aGVyZSB3b3JkcyBjYW4gYmUgbWFya2VkIGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiRnVsbCB0ZXh0IHdoZXJlIHdvcmRzIGNhbiBiZSBtYXJrZWQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiU29sdXRpb24gbW9kZSBoZWFkZXIgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJTb2x1dGlvbiBtb2RlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNoZWNraW5nIG1vZGUgaGVhZGVyIGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiQ2hlY2tpbmcgbW9kZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJBc3Npc3RpdmUgdGVjaG5vbG9neSBkZXNjcmlwdGlvbiBmb3IgXCJDaGVja1wiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIkNoZWNrIHRoZSBhbnN3ZXJzLiBUaGUgcmVzcG9uc2VzIHdpbGwgYmUgbWFya2VkIGFzIGNvcnJlY3QsIGluY29ycmVjdCwgb3IgdW5hbnN3ZXJlZC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQXNzaXN0aXZlIHRlY2hub2xvZ3kgZGVzY3JpcHRpb24gZm9yIFwiU2hvdyBTb2x1dGlvblwiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlNob3cgdGhlIHNvbHV0aW9uLiBUaGUgdGFzayB3aWxsIGJlIG1hcmtlZCB3aXRoIGl0cyBjb3JyZWN0IHNvbHV0aW9uLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJBc3Npc3RpdmUgdGVjaG5vbG9neSBkZXNjcmlwdGlvbiBmb3IgXCJSZXRyeVwiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlJldHJ5IHRoZSB0YXNrLiBSZXNldCBhbGwgcmVzcG9uc2VzIGFuZCBzdGFydCB0aGUgdGFzayBvdmVyIGFnYWluLiIKICAgIH0KICBdCn0K"],"libraries\/H5P.MarkTheWords-1.11\/language\/it.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJNZWRpYSIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIlRpcG8iLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIk1lZGlhIGZhY29sdGF0aXZvIGRhIG1vc3RyYXJlIHNvcHJhIGxhIGRvbWFuZGEiCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiRGlzYWJpbGl0YSBsbyB6b29tIGRlbGwnaW1tYWdpbmUiCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRGVzY3JpemlvbmUgZGVsIGNvbXBpdG8iLAogICAgICAiZGVzY3JpcHRpb24iOiAiRGVzY3JpdmkgY29tZSBsJ2FwcHJlbmRlbnRlIGRldmUgcmlzb2x2ZXJlIGlsIGNvbXBpdG8iLAogICAgICAicGxhY2Vob2xkZXIiOiAiQ2xpY2NhIHN1IHR1dHRpIGkgdmVyYmkgbmVsIHRlc3RvIGNoZSBzZWd1ZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDYW1wbyBkaSB0ZXN0byIsCiAgICAgICJwbGFjZWhvbGRlciI6ICJRdWVzdGEgw6ggdW5hIHJpc3Bvc3RhOiAqYW5zd2VyKiIsCiAgICAgICJpbXBvcnRhbnQiOiB7CiAgICAgICAgImRlc2NyaXB0aW9uIjogIjx1bD48bGk+TGUgcGFyb2xlIG1hcmNhdGUgdmVuZ29ubyBhZ2dpdW50ZSBtZWRpYW50ZSB1biBhc3RlcmlzY28gKCopLjwvbGk+PGxpPkdsaSBhc3RlcmlzY2hpIHBvc3Nvbm8gZXNzZXJlIGFnZ2l1bnRpIGFsbCdpbnRlcm5vIGRpIHBhcm9sZSBtYXJjYXRlIGF0dHJhdmVyc28gdW4gdWx0ZXJpb3JlIGFzdGVyaXNjby4gRXMuICpwYXJvbGEtY29ycmV0dGEqKiogPSZndDsgcGFyb2xhLWNvcnJldHRhKi48L2xpPjwvdWw+IiwKICAgICAgICAiZXhhbXBsZSI6ICJMZSBwYXJvbGUgY29ycmV0dGUgc29ubyBtYXJjYXRlIGluIHF1ZXN0byBtb2RvOiAqcGFyb2xhLWNvcnJldHRhKi4gVW4gYXN0ZXJpc2NvIMOoIHNjcml0dG8gY29zw6w6ICpwYXJvbGEtY29ycmV0dGEqKioiCiAgICAgIH0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJGZWVkYmFjayBnZW5lcmFsZSIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgICAgIHsKICAgICAgICAgICAgICAibGFiZWwiOiAiUHJlZGVmaW5pdG8iCiAgICAgICAgICAgIH0KICAgICAgICAgIF0sCiAgICAgICAgICAibGFiZWwiOiAiU3BlY2lmaWNhIHVuIGZlZWRiYWNrIHBlciBvZ25pIGludGVydmFsbG8gZGkgcHVudGVnZ2lvIiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJDbGljY2Egc3VsIHB1bHNhbnRlIFwiQWdnaXVuZ2kgaW50ZXJ2YWxsb1wiIHBlciBhZ2dpdW5nZXJlIGdsaSBpbnRlcnZhbGxpIGNoZSB0aSBzZXJ2b25vLiBQZXIgZXNlbXBpbzogMC0yMCUsIFB1bnRlZ2dpbyBzY2Fyc287IDIxLTkwJSwgUHVudGVnZ2lvIG1lZGlvOyA5MS0xMDAlIFB1bnRlZ2dpbyBvdHRpbW8hIiwKICAgICAgICAgICJlbnRpdHkiOiAiaW50ZXJ2YWxsbyIsCiAgICAgICAgICAiZmllbGQiOiB7CiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIkludGVydmFsbG8gZGkgcHVudGVnZ2lvIgogICAgICAgICAgICAgIH0sCiAgICAgICAgICAgICAge30sCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIkZlZWRiYWNrIGZvciBkZWZpbmVkIHNjb3JlIHJhbmdlIiwKICAgICAgICAgICAgICAgICJwbGFjZWhvbGRlciI6ICJGaWxsIGluIHRoZSBmZWVkYmFjayIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICB9CiAgICAgIF0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXN0byBwZXIgaWwgcHVsc2FudGUgXCJWZXJpZmljYVwiIiwKICAgICAgImRlZmF1bHQiOiAiVmVyaWZpY2EiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJTdWJtaXRcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJTdWJtaXQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVzdG8gcGVyIGlsIHB1bHNhbnRlIFwiUmlwcm92YVwiIiwKICAgICAgImRlZmF1bHQiOiAiUmlwcm92YSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXN0byBwZXIgaWwgcHVsc2FudGUgXCJNb3N0cmEgU29sdXppb25lXCIiLAogICAgICAiZGVmYXVsdCI6ICJNb3N0cmEgc29sdXppb25lIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkltcG9zdGF6aW9uaSBkaSBlc2VjdXppb25lIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlF1ZXN0ZSBvcHppb25pIHBlcm1ldHRvbm8gZGkgY29udHJvbGxhcmUgaWwgY29tcG9ydGFtZW50byBkZWwgY29tcGl0byIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkF0dGl2YSBcIlJpcHJvdmFcIiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJBdHRpdmEgaWwgcHVsc2FudGUgXCJNb3N0cmEgc29sdXppb25pXCIiCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiQXR0aXZhIHB1bHNhbnRlIFwiVmVyaWZpY2FcIiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJWaXN1YWxpenphIHB1bnRlZ2dpbyIsCiAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiVmlzdWFsaXp6YSBpIHB1bnRpIGd1YWRhZ25hdGkgcGVyIG9nbmkgcmlzcG9zdGEiCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVzdG8gZGVsbGEgcmlzcG9zdGEgY29ycmV0dGEiLAogICAgICAiZGVmYXVsdCI6ICJHaXVzdG8hIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRlc3RvIHVzYXRvIHBlciBpbmRpY2FyZSBjaGUgdW5hIHJpc3Bvc3RhIMOoIGdpdXN0YSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXN0byBkZWxsYSByaXNwb3N0YSBub24gY29ycmV0dGEiLAogICAgICAiZGVmYXVsdCI6ICJTYmFnbGlhdG8hIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRlc3RvIHVzYXRvIHBlciBpbmRpY2FyZSBjaGUgdW5hIHJpc3Bvc3RhIMOoIHNiYWdsaWF0YSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXN0byBwZXIgcmlzcG9zdGEgbWFuY2FudGUiLAogICAgICAiZGVmYXVsdCI6ICJSaXNwb3N0YSBub24gdHJvdmF0YSEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGVzdG8gdXNhdG8gcGVyIGluZGljYXJlIGNoZSBtYW5jYSBsYSByaXNwb3N0YSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZXNjcml6aW9uZSBkZWxsYSBzY2hlcm1hdGEgZGVsbGUgc29sdXppb25pIiwKICAgICAgImRlZmF1bHQiOiAiTCdhdHRpdml0w6AgdmllbmUgYWdnaW9ybmF0YSBwZXIgY29udGVuZXJlIGxhIHNvbHV6aW9uZSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJRdWVzdG8gbWVzc2FnZ2lvIGRpY2UgYWxsJ2FwcHJlbmRlbnRlIGNoZSBsJ2F0dGl2aXTDoCDDqCBzdGF0YSBhZ2dpb3JuYXRhIGNvbiBsYSBzb2x1emlvbmUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUmFwcHJlc2VudGF6aW9uZSB0ZXN0dWFsZSBzdWxsYSBiYXJyYSBkZWwgcHVudGVnZ2lvIHBlciBjaGkgdXNhIHVuIGxldHRvcmUgdm9jYWxlIiwKICAgICAgImRlZmF1bHQiOiAiSWwgdHVvIHB1bnRlZ2dpbyDDqCA6bnVtIHN1IDp0b3RhbCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFdGljaGV0dGEgcGVyIGlsIHRlc3RvIGNvbXBsZXRvIGxlZ2dpYmlsZSBwZXIgbGUgdGVjbm9sb2dpZSBhc3Npc3RpdmUiLAogICAgICAiZGVmYXVsdCI6ICJUZXN0byBjb21wbGV0byBsZWdnaWJpbGUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRXRpY2hldHRhIHBlciBpbCB0ZXN0byBpbiBjdWkgbGUgcGFyb2xlIHBvc3Nvbm8gZXNzZXJlIG1hcmNhdGUgcGVyIGxlIHRlY25vbG9naWUgYXNzaXN0aXZlIiwKICAgICAgImRlZmF1bHQiOiAiVGVzdG8gY29tcGxldG8gaW4gY3VpIGxlIHBhcm9sZSBwb3Nzb25vIGVzc2VyZSBtYXJjYXRlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkludGVzdGF6aW9uZSBkZWxsYSBtb2RhbGl0w6AgZGkgc29sdXppb25lIHBlciB0ZWNub2xvZ2llIGFzc2lzdGl2ZSIsCiAgICAgICJkZWZhdWx0IjogIk1vZGFsaXTDoCBkaSBzb2x1emlvbmUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiSW50ZXN0YXppb25lIGRlbGxhIG1vZGFsaXTDoCBkaSB2ZXJpZmljYSBwZXIgdGVjbm9sb2dpZSBhc3Npc3RpdmUiLAogICAgICAiZGVmYXVsdCI6ICJNb2RhbGl0w6AgZGkgdmVyaWZpY2EiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRGVzY3JpemlvbmUgZGVsbGUgdGVjbm9sb2dpZSBhc3Npc3RpdmUgcGVyIGlsIHB1bHNhbnRlIFwiVmVyaWZpY2FcIiIsCiAgICAgICJkZWZhdWx0IjogIlZlcmlmaWNhIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkRlc2NyaXppb25lIGRlbGxlIHRlY25vbG9naWUgYXNzaXN0aXZlIHBlciBpbCBwdWxzYW50ZSBcIk1vc3RyYSBzb2x1emlvbmVcIiIsCiAgICAgICJkZWZhdWx0IjogIk1vc3RyYSBzb2x1emlvbmUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRGVzY3JpemlvbmUgZGVsbGUgdGVjbm9sb2dpZSBhc3Npc3RpdmUgcGVyIGlsIHB1bHNhbnRlIFwiUmlwcm92YVwiIiwKICAgICAgImRlZmF1bHQiOiAiUmlwcm92YSIKICAgIH0KICBdCn0K"],"libraries\/H5P.MarkTheWords-1.11\/language\/ja.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLjg6Hjg4fjgqPjgqIiLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICLjgr\/jgqTjg5ciLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIuioreWVj+OBruS4iuOBq+ihqOekuuOBmeOCi+OCquODl+OCt+ODp+ODs+OBruODoeODh+OCo+OCouOAgiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICLnlLvlg4\/jga7jgrrjg7zjg6DmqZ\/og73jgpLnhKHlirnljJYiCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi44K\/44K544Kv44Gu6Kqs5piOIiwKICAgICAgImRlc2NyaXB0aW9uIjogIuODpuODvOOCtuODvOOBjOOCv+OCueOCr+OCkuino+axuuOBmeOCi+aWueazleOBq+OBpOOBhOOBpuiqrOaYjuOBl+OBpuOBj+OBoOOBleOBhOOAgiIsCiAgICAgICJwbGFjZWhvbGRlciI6ICLlvozjgavntprjgY\/jg4bjgq3jgrnjg4jjga7jgZnjgbnjgabjga7li5XoqZ7jgpLjgq\/jg6rjg4Pjgq\/jgZfjgb7jgZnjgIIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi44OG44Kt44K544OI44OV44Kj44O844Or44OJIiwKICAgICAgInBsYWNlaG9sZGVyIjogIuOBk+OCjOOBjOino+etlOOBp+OBmeOAgjogKmFuc3dlcioiLAogICAgICAiaW1wb3J0YW50IjogewogICAgICAgICJkZXNjcmlwdGlvbiI6ICI8dWw+PGxpPuODnuODvOOCr+OBmeOCi+WNmOiqnuOBq+OBr+OCouOCueOCv+ODquOCueOCryAoKikg44KS5Yqg44GI44G+44GZ44CCPC9saT48bGk+44Ki44K544K\/44Oq44K544Kv44Gv5Yil44Gu44Ki44K544K\/44Oq44K544Kv44Gn44Ko44K544Kx44O844OX5Yem55CG44GV44KM44KL44Gu44Gn44CBKiog44GvICog44Go44Gq44KK44G+44GZ44CCPC9saT48L3VsPiIsCiAgICAgICAgImV4YW1wbGUiOiAiVGhlIGNvcnJlY3Qgd29yZHMgYXJlIG1hcmtlZCBsaWtlIHRoaXM6ICpjb3JyZWN0d29yZCosIGFuIGFzdGVyaXNrIGlzIHdyaXR0ZW4gbGlrZSB0aGlzOiAqY29ycmVjdHdvcmQqKiouIgogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi5YWo5L2T44Gu44OV44Kj44O844OJ44OQ44OD44KvIiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAid2lkZ2V0cyI6IFsKICAgICAgICAgICAgewogICAgICAgICAgICAgICJsYWJlbCI6ICLjg4fjg5Xjgqnjg6vjg4giCiAgICAgICAgICAgIH0KICAgICAgICAgIF0sCiAgICAgICAgICAibGFiZWwiOiAi44GC44KL5b6X54K556+E5Zuy44Gr5a++44GX44Gm44CB44Kr44K544K\/44Og44OV44Kj44O844OJ44OQ44OD44Kv44KS5a6a576p44GX44G+44GZ44CCIiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJDbGljayB0aGUgXCJBZGQgcmFuZ2VcIiBidXR0b24gdG8gYWRkIGFzIG1hbnkgcmFuZ2VzIGFzIHlvdSBuZWVkLiBFeGFtcGxlOiAwLTIwJSBCYWQgc2NvcmUsIDIxLTkxJSBBdmVyYWdlIFNjb3JlLCA5MS0xMDAlIEdyZWF0IFNjb3JlISIsCiAgICAgICAgICAiZW50aXR5IjogIuevhOWbsiIsCiAgICAgICAgICAiZmllbGQiOiB7CiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIuW+l+eCueevhOWbsiIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHt9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJGZWVkYmFjayBmb3IgZGVmaW5lZCBzY29yZSByYW5nZSIsCiAgICAgICAgICAgICAgICAicGxhY2Vob2xkZXIiOiAiRmlsbCBpbiB0aGUgZmVlZGJhY2siCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi44CM44OB44Kn44OD44Kv44CN44Oc44K\/44Oz44Gu44OG44Kt44K544OIIiwKICAgICAgImRlZmF1bHQiOiAi44OB44Kn44OD44KvIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIFwiU3VibWl0XCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiU3VibWl0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuOAjOODquODiOODqeOCpOOAjeODnOOCv+ODs+OBruODhuOCreOCueODiCIsCiAgICAgICJkZWZhdWx0IjogIuODquODiOODqeOCpCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLjgIzop6PjgpLooajnpLrjgI3jg5zjgr\/jg7Pjga7jg4bjgq3jgrnjg4giLAogICAgICAiZGVmYXVsdCI6ICLop6PjgpLooajnpLoiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi5YuV5L2c6Kit5a6aIiwKICAgICAgImRlc2NyaXB0aW9uIjogIuOBk+OCjOOCieOBruOCquODl+OCt+ODp+ODs+OBp+OCv+OCueOCr+OBjOOBqeOBruOCiOOBhuOBq+WLleS9nOOBmeOCi+OBi+OCkuWItuW+oeOBp+OBjeOBvuOBmeOAgiIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIuOAjOODquODiOODqeOCpOOAjeOCkuacieWKueWMliIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICLjgIzop6PjgpLooajnpLrjgI3jg5zjgr\/jg7PjgpLmnInlirnljJYiCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiRW5hYmxlIFwiQ2hlY2tcIiBidXR0b24iCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAi5b6X54K544Od44Kk44Oz44OI44KS6KGo56S6IiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICLjgZ3jgozjgZ7jgozjga7op6PnrZTjgaflvpfjgonjgozjgZ\/jg53jgqTjg7Pjg4jjgpLooajnpLoiCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi5q2j6Kej44Gu44OG44Kt44K544OIIiwKICAgICAgImRlZmF1bHQiOiAi5q2j6KejICEiLAogICAgICAiZGVzY3JpcHRpb24iOiAi5q2j6Kej44Gn44GC44KL44GT44Go44KS56S644GZ44Gf44KB44Gr5L2\/55So44GZ44KL44OG44Kt44K544OIIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuS4jeato+ino+OBruODhuOCreOCueODiCIsCiAgICAgICJkZWZhdWx0IjogIuS4jeato+inoyAhIiwKICAgICAgImRlc2NyaXB0aW9uIjogIuS4jeato+ino+OBp+OBguOCi+OBk+OBqOOCkuekuuOBmeOBn+OCgeOBq+S9v+eUqOOBmeOCi+ODhuOCreOCueODiCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLmnKrlm57nrZTjg4bjgq3jgrnjg4giLAogICAgICAiZGVmYXVsdCI6ICLmnKrlm57nrZQgISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLmnKrlm57nrZTjgafjgYLjgovjgZPjgajjgpLnpLrjgZnjgZ\/jgoHjgavkvb\/nlKjjgZnjgovjg4bjgq3jgrnjg4giCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi6Kej44KS6KGo56S644Gu6Kqs5piOIiwKICAgICAgImRlZmF1bHQiOiAi6Kej44GM5ZCr44G+44KM44KL44KI44GG44Gr44K\/44K544Kv44GM5pu05paw44GV44KM44G+44GZ44CCIiwKICAgICAgImRlc2NyaXB0aW9uIjogIuOBk+OBruODhuOCreOCueODiOOBr+OAgeOCv+OCueOCr+OBjOino+OBp+abtOaWsOOBleOCjOOBn+OBk+OBqOOCkuODpuODvOOCtuODvOOBq+S8neOBiOOBvuOBmeOAgiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0dWFsIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBzY29yZSBiYXIgZm9yIHRob3NlIHVzaW5nIGEgcmVhZHNwZWFrZXIiLAogICAgICAiZGVmYXVsdCI6ICJZb3UgZ290IDpudW0gb3V0IG9mIDp0b3RhbCBwb2ludHMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTGFiZWwgZm9yIHRoZSBmdWxsIHJlYWRhYmxlIHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJGdWxsIHJlYWRhYmxlIHRleHQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTGFiZWwgZm9yIHRoZSB0ZXh0IHdoZXJlIHdvcmRzIGNhbiBiZSBtYXJrZWQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJGdWxsIHRleHQgd2hlcmUgd29yZHMgY2FuIGJlIG1hcmtlZCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJTb2x1dGlvbiBtb2RlIGhlYWRlciBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIlNvbHV0aW9uIG1vZGUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2hlY2tpbmcgbW9kZSBoZWFkZXIgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJDaGVja2luZyBtb2RlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFzc2lzdGl2ZSB0ZWNobm9sb2d5IGRlc2NyaXB0aW9uIGZvciBcIkNoZWNrXCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiQ2hlY2sgdGhlIGFuc3dlcnMuIFRoZSByZXNwb25zZXMgd2lsbCBiZSBtYXJrZWQgYXMgY29ycmVjdCwgaW5jb3JyZWN0LCBvciB1bmFuc3dlcmVkLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJBc3Npc3RpdmUgdGVjaG5vbG9neSBkZXNjcmlwdGlvbiBmb3IgXCJTaG93IFNvbHV0aW9uXCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiU2hvdyB0aGUgc29sdXRpb24uIFRoZSB0YXNrIHdpbGwgYmUgbWFya2VkIHdpdGggaXRzIGNvcnJlY3Qgc29sdXRpb24uIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFzc2lzdGl2ZSB0ZWNobm9sb2d5IGRlc2NyaXB0aW9uIGZvciBcIlJldHJ5XCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiUmV0cnkgdGhlIHRhc2suIFJlc2V0IGFsbCByZXNwb25zZXMgYW5kIHN0YXJ0IHRoZSB0YXNrIG92ZXIgYWdhaW4uIgogICAgfQogIF0KfQo="],"libraries\/H5P.MarkTheWords-1.11\/language\/ka.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLhg5vhg5Thg5Phg5jhg5AiLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICLhg6Lhg5jhg57hg5giLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIuGDkOGDoOGDkOGDkOGDo+GDquGDmOGDmuGDlOGDkeGDlOGDmuGDmCDhg5vhg5Thg5Phg5jhg5Dhg5nhg53hg5zhg6Lhg5Thg5zhg6Lhg5gsIOGDoOGDneGDm+GDlOGDmuGDmOGDqiDhg5nhg5jhg5fhg67hg5Xhg5jhg6Eg4YOX4YOQ4YOV4YOW4YOUIOGDkuGDkOGDm+GDneGDqeGDnOGDk+GDlOGDkeGDkC4iCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAi4YOh4YOj4YOg4YOQ4YOX4YOY4YOhIOGDk+GDkOGDluGDo+GDm+GDlOGDkeGDmOGDoSDhg5Lhg5Dhg5vhg53hg6Dhg5fhg5Xhg5AiCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4YOQ4YOb4YOd4YOq4YOQ4YOc4YOY4YOhIOGDkOGDpuGDrOGDlOGDoOGDkCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLhg5Dhg6bhg6zhg5Thg6Dhg5Thg5csIOGDoOGDneGDkuGDneGDoCDhg6Phg5zhg5Phg5Ag4YOQ4YOb4YOd4YOu4YOh4YOc4YOQ4YOhIOGDkOGDm+GDneGDquGDkOGDnOGDkCDhg5vhg53hg5vhg67hg5vhg5Dhg6Dhg5Thg5Hhg5Thg5rhg5vhg5AuIiwKICAgICAgInBsYWNlaG9sZGVyIjogIuGDk+GDkOGDkOGDrOGDmeGDkOGDnuGDo+GDnOGDlOGDlyDhg6fhg5Xhg5Thg5rhg5Ag4YOW4YOb4YOc4YOQ4YOW4YOUIOGDqOGDlOGDm+GDk+GDlOGDkiDhg6Lhg5Thg6Xhg6Hhg6Lhg6jhg5guIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuGDouGDlOGDpeGDoeGDouGDmOGDoSDhg5Xhg5Thg5rhg5giLAogICAgICAicGxhY2Vob2xkZXIiOiAi4YOU4YOhIOGDkOGDoOGDmOGDoSDhg57hg5Dhg6Hhg6Phg67hg5g6ICphbnN3ZXIqLiIsCiAgICAgICJpbXBvcnRhbnQiOiB7CiAgICAgICAgImRlc2NyaXB0aW9uIjogIjx1bD48bGk+4YOb4YOd4YOc4YOY4YOo4YOc4YOj4YOa4YOYIOGDoeGDmOGDouGDp+GDleGDlOGDkeGDmCDhg5Thg5vhg5Dhg6Lhg5Thg5Hhg5Ag4YOV4YOQ4YOg4YOh4YOZ4YOV4YOa4YOQ4YOV4YOY4YOXICgqKS48L2xpPjxsaT7hg5Xhg5Dhg6Dhg6Hhg5nhg5Xhg5rhg5Dhg5Xhg5Thg5Hhg5jhg6Eg4YOT4YOQ4YOb4YOQ4YOi4YOU4YOR4YOQIOGDqOGDlOGDoeGDkOGDq+GDmuGDlOGDkeGDlOGDmuGDmOGDkCDhg5vhg53hg5zhg5jhg6jhg5zhg6Phg5og4YOh4YOY4YOi4YOn4YOV4YOU4YOR4YOo4YOYIOGDoeGDruGDleGDkCDhg5Xhg5Dhg6Dhg6Hhg5nhg5Xhg5rhg5Dhg5Xhg5jhg6Eg4YOT4YOQ4YOb4YOQ4YOi4YOU4YOR4YOY4YOXLCAqY29ycmVjdHdvcmQqKiogPSZndDsgY29ycmVjdHdvcmQqLjwvbGk+IDwvdWw+IiwKICAgICAgICAiZXhhbXBsZSI6ICLhg6Hhg6zhg53hg6Dhg5gg4YOh4YOY4YOi4YOn4YOV4YOU4YOR4YOYIOGDkOGDoeGDlCDhg5jhg6zhg5Thg6Dhg5Thg5Hhg5A6ICpjb3JyZWN0d29yZCosIOGDleGDkOGDoOGDoeGDmeGDleGDmuGDkOGDleGDmCDhg5jhg6zhg5Thg6Dhg5Thg5Hhg5Ag4YOQ4YOh4YOUOiAqY29ycmVjdHdvcmQqKiouIgogICAgICB9CiAgICB9LAogICAgewogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJmaWVsZCI6IHsKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAi4YOl4YOj4YOa4YOU4YOR4YOY4YOhIOGDk+GDmOGDkOGDnuGDkOGDluGDneGDnOGDmCIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHt9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJwbGFjZWhvbGRlciI6ICLhg6Phg5nhg6Phg5nhg5Dhg5Xhg6jhg5jhg6Dhg5jhg6Eg4YOo4YOU4YOV4YOh4YOU4YOR4YOQIiwKICAgICAgICAgICAgICAgICJsYWJlbCI6ICLhg6Phg5nhg6Phg5nhg5Dhg5Xhg6jhg5jhg6Dhg5gg4YOl4YOj4YOa4YOU4YOR4YOY4YOhIOGDkuGDkOGDnOGDoeGDkOGDluGDpuGDleGDoOGDo+GDmuGDmCDhg5Phg5jhg5Dhg57hg5Dhg5bhg53hg5zhg5jhg6Hhg5fhg5Xhg5jhg6EiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9LAogICAgICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgICAgIHsKICAgICAgICAgICAgICAibGFiZWwiOiAi4YOh4YOi4YOQ4YOc4YOT4YOQ4YOg4YOi4YOj4YOa4YOYIgogICAgICAgICAgICB9CiAgICAgICAgICBdLAogICAgICAgICAgImxhYmVsIjogIuGDkuGDkOGDnOGDoeGDkOGDluGDpuGDleGDoOGDlCDhg6Phg5nhg6Phg5nhg5Dhg5Xhg6jhg5jhg6Dhg5gg4YOl4YOj4YOa4YOU4YOR4YOY4YOhIOGDnOGDlOGDkeGDmOGDoeGDm+GDmOGDlOGDoOGDmCDhg5Phg5jhg5Dhg57hg5Dhg5bhg53hg5zhg5jhg6Hhg5fhg5Xhg5jhg6EiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIuGDk+GDkOGDkOGDreGDmOGDoOGDlCBcIuGDk+GDmOGDkOGDnuGDkOGDluGDneGDnOGDmOGDoSDhg5Phg5Dhg5vhg5Dhg6Lhg5Thg5Hhg5jhg6FcIiDhg6bhg5jhg5rhg5Dhg5nhg6Eg4YOg4YOd4YObIOGDk+GDkOGDlOGDm+GDkOGDouGDneGDoSDhg5jhg5vhg5Phg5Thg5zhg5gg4YOT4YOY4YOQ4YOe4YOQ4YOW4YOd4YOc4YOYLCDhg6Dhg5Dhg5vhg5Phg5Thg5zhg5jhg6og4YOS4YOt4YOY4YOg4YOT4YOU4YOR4YOQ4YOXLiDhg5vhg5Dhg5Lhg5Dhg5rhg5jhg5fhg5Dhg5M6IDAtMjAlIOGDquGDo+GDk+GDmCDhg6Xhg6Phg5rhg5AsIDIxLTkxJSDhg6Hhg5Dhg6jhg6Phg5Dhg5rhg50g4YOl4YOj4YOa4YOQLCA5MS0xMDAlIOGDoeGDkOGDo+GDmeGDlOGDl+GDlOGDoeGDnSDhg6Xhg6Phg5rhg5AhIiwKICAgICAgICAgICJlbnRpdHkiOiAi4YOT4YOY4YOQ4YOe4YOQ4YOW4YOd4YOc4YOYIgogICAgICAgIH0KICAgICAgXSwKICAgICAgImxhYmVsIjogIuGDoeGDkOGDlOGDoOGDl+GDnSDhg5Lhg5Dhg5vhg53hg67hg5vhg5Dhg6Phg6Dhg5Thg5Hhg5AiCiAgICB9LAogICAgewogICAgICAiZGVmYXVsdCI6ICLhg6jhg5Thg5vhg53hg6zhg5vhg5Thg5Hhg5AiLAogICAgICAibGFiZWwiOiAi4YOi4YOU4YOl4YOh4YOi4YOYIFwi4YOo4YOU4YOb4YOd4YOs4YOb4YOU4YOR4YOY4YOhXCIg4YOm4YOY4YOa4YOQ4YOZ4YOY4YOh4YOX4YOV4YOY4YOhIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuGDouGDlOGDpeGDoeGDouGDmCBcIuGDrOGDkOGDoOGDk+GDkuGDlOGDnOGDmOGDoVwiIOGDpuGDmOGDmuGDkOGDmeGDmOGDoeGDl+GDleGDmOGDoSIsCiAgICAgICJkZWZhdWx0IjogIuGDrOGDkOGDoOGDk+GDkuGDlOGDnOGDkCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLhg6Lhg5Thg6Xhg6Hhg6Lhg5ggXCLhg5fhg5Dhg5Xhg5jhg5Phg5Dhg5wg4YOq4YOT4YOY4YOhXCIg4YOm4YOY4YOa4YOQ4YOZ4YOY4YOh4YOX4YOV4YOY4YOhIiwKICAgICAgImRlZmF1bHQiOiAi4YOX4YOQ4YOV4YOY4YOT4YOQ4YOcIOGDquGDk+GDkCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLhg6Lhg5Thg6Xhg6Hhg6Lhg5ggXCLhg5Dhg5vhg53hg67hg6Hhg5zhg5jhg6Eg4YOp4YOV4YOU4YOc4YOU4YOR4YOQXCIg4YOm4YOY4YOa4YOQ4YOZ4YOY4YOh4YOX4YOV4YOY4YOhIiwKICAgICAgImRlZmF1bHQiOiAi4YOe4YOQ4YOh4YOj4YOu4YOY4YOhIOGDqeGDleGDlOGDnOGDlOGDkeGDkCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLhg6Xhg6rhg5Thg5Xhg5jhg6Eg4YOe4YOQ4YOg4YOQ4YOb4YOU4YOi4YOg4YOU4YOR4YOYLiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLhg5Thg6Eg4YOe4YOQ4YOg4YOQ4YOb4YOU4YOi4YOg4YOU4YOR4YOYIOGDm+GDneGDkuGDquGDlOGDm+GDlyDhg5Phg5Dhg5Xhg5Dhg5rhg5Thg5Hhg5jhg6Eg4YOl4YOq4YOU4YOV4YOY4YOhIOGDmeGDneGDnOGDouGDoOGDneGDmuGDmOGDoSDhg6Hhg5Dhg6jhg6Phg5Dhg5rhg5Thg5Hhg5Dhg6EuIiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiXCLhg5fhg5Dhg5Xhg5jhg5Phg5Dhg5wg4YOq4YOT4YOY4YOhXCIg4YOT4YOQ4YOo4YOV4YOU4YOR4YOQIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIlwi4YOQ4YOb4YOd4YOu4YOh4YOc4YOY4YOhIOGDqeGDleGDlOGDnOGDlOGDkeGDmOGDoVwiIOGDpuGDmOGDmuGDkOGDmeGDmOGDoSDhg5Lhg5Dhg5Dhg6Xhg6Lhg5jhg6Phg6Dhg5Thg5Hhg5AiCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiXCLhg6jhg5Thg5vhg53hg6zhg5vhg5Thg5Hhg5jhg6FcIiDhg6bhg5jhg5rhg5Dhg5nhg5jhg6Eg4YOS4YOQ4YOQ4YOl4YOi4YOY4YOj4YOg4YOU4YOR4YOQIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIuGDkOGDqeGDleGDlOGDnOGDlCDhg6Xhg6Phg5rhg5Thg5Hhg5giLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIuGDl+GDmOGDl+GDneGDlOGDo+GDmuGDmCDhg57hg5Dhg6Hhg6Phg67hg5jhg6Hhg5fhg5Xhg5jhg6Eg4YOb4YOY4YOm4YOU4YOR4YOj4YOa4YOYIOGDpeGDo+GDmuGDlOGDkeGDmOGDoSDhg6nhg5Xhg5Thg5zhg5Thg5Hhg5AuIgogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuGDoeGDrOGDneGDoOGDmCDhg57hg5Dhg6Hhg6Phg67hg5jhg6Eg4YOi4YOU4YOl4YOh4YOi4YOYIiwKICAgICAgImRlZmF1bHQiOiAi4YOh4YOs4YOd4YOg4YOY4YOQISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLhg6Lhg5Thg6Xhg6Hhg6Lhg5gg4YOS4YOQ4YOb4YOd4YOY4YOn4YOU4YOc4YOU4YOR4YOQIOGDmOGDm+GDkOGDluGDlCDhg5vhg5jhg6Hhg5Dhg5fhg5jhg5fhg5Thg5Hhg5rhg5Dhg5MsIOGDoOGDneGDmyDhg57hg5Dhg6Hhg6Phg67hg5gg4YOh4YOs4YOd4YOg4YOY4YOQIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuGDkOGDoOGDkOGDoeGDrOGDneGDoOGDmCDhg57hg5Dhg6Hhg6Phg67hg5jhg6Eg4YOi4YOU4YOl4YOh4YOi4YOYIiwKICAgICAgImRlZmF1bHQiOiAi4YOQ4YOg4YOQ4YOh4YOs4YOd4YOg4YOY4YOQISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLhg6Lhg5Thg6Xhg6Hhg6Lhg5gsIOGDoOGDneGDm+GDlOGDmuGDmOGDqiDhg5vhg5jhg6Phg5fhg5jhg5fhg5Thg5Hhg6EsIOGDoOGDneGDmyDhg57hg5Dhg6Hhg6Phg67hg5gg4YOQ4YOg4YOQ4YOh4YOs4YOd4YOg4YOY4YOQIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuGDkuGDkOGDm+GDneGDouGDneGDleGDlOGDkeGDo+GDmuGDmCDhg57hg5Dhg6Hhg6Phg67hg5jhg6Eg4YOi4YOU4YOl4YOh4YOi4YOYIiwKICAgICAgImRlZmF1bHQiOiAi4YOe4YOQ4YOh4YOj4YOu4YOYIOGDleGDlOGDoCDhg5vhg53hg5jhg6vhg5Thg5Hhg5zhg5AhIiwKICAgICAgImRlc2NyaXB0aW9uIjogIuGDouGDlOGDpeGDoeGDouGDmCDhg5Lhg5Dhg5vhg53hg5jhg6fhg5Thg5zhg5Thg5Hhg5Ag4YOY4YOb4YOY4YOhIOGDkOGDpuGDoeGDkOGDnOGDmOGDqOGDnOGDkOGDleGDkOGDkywg4YOg4YOd4YObIOGDnuGDkOGDoeGDo+GDruGDmCDhg5Dhg5nhg5rhg5jhg5AiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4YOQ4YOb4YOd4YOu4YOh4YOc4YOY4YOhIOGDqeGDleGDlOGDnOGDlOGDkeGDmOGDoSDhg5Dhg6bhg6zhg5Thg6Dhg5AiLAogICAgICAiZGVmYXVsdCI6ICLhg5Dhg5vhg53hg6rhg5Dhg5zhg5Ag4YOS4YOQ4YOc4YOQ4YOu4YOa4YOU4YOR4YOj4YOa4YOY4YOQLCDhg6Dhg5Dhg5fhg5Ag4YOo4YOU4YOY4YOq4YOQ4YOV4YOT4YOU4YOhIOGDkuGDkOGDm+GDneGDoeGDkOGDleGDkOGDmuGDoS4iLAogICAgICAiZGVzY3JpcHRpb24iOiAi4YOU4YOhIOGDouGDlOGDpeGDoeGDouGDmCDhg5Thg6Phg5Hhg5zhg5Thg5Hhg5Ag4YOb4YOd4YOb4YOu4YOb4YOQ4YOg4YOU4YOR4YOU4YOa4YOhLCDhg6Dhg53hg5sg4YOQ4YOb4YOd4YOq4YOQ4YOc4YOU4YOR4YOYIOGDkuGDkOGDnOGDkOGDruGDmuGDlOGDkeGDo+GDmuGDmOGDkCDhg5Lhg5Dhg5Phg5Dhg6zhg6fhg5Xhg5Thg6Lhg5jhg5rhg5Thg5Hhg5jhg5cuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuGDouGDlOGDpeGDoeGDouGDmOGDoSDhg5Lhg5Dhg5vhg53hg5vhg67hg5vhg53hg5Xhg5Dhg5zhg5Thg5Hhg5rhg5jhg6Eg4YOb4YOd4YOb4YOu4YOb4YOQ4YOg4YOU4YOR4YOa4YOU4YOR4YOY4YOh4YOX4YOV4YOY4YOhIOGDpeGDo+GDmuGDlOGDkeGDmOGDoSDhg5nhg53hg5rhg53hg5zhg5jhg6Eg4YOi4YOU4YOl4YOh4YOi4YOj4YOg4YOYIOGDoOGDlOGDnuGDoOGDlOGDluGDlOGDnOGDouGDkOGDquGDmOGDkCIsCiAgICAgICJkZWZhdWx0IjogIuGDqOGDlOGDnCDhg5vhg5jhg5jhg6bhg5QgOm51bSA6dG90YWwg4YOl4YOj4YOa4YOY4YOT4YOQ4YOcIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuGDrOGDkOGDoOGDrOGDlOGDoOGDkCDhg5Phg5Dhg5vhg67hg5vhg5Dhg6Dhg5Qg4YOi4YOU4YOl4YOc4YOd4YOa4YOd4YOS4YOY4YOU4YOR4YOY4YOh4YOX4YOV4YOY4YOhIOGDoeGDoOGDo+GDmuGDkOGDkyDhg6zhg5Dhg6Hhg5Dhg5nhg5jhg5fhg67hg5gg4YOi4YOU4YOl4YOh4YOi4YOY4YOh4YOX4YOV4YOY4YOhIiwKICAgICAgImRlZmF1bHQiOiAi4YOh4YOg4YOj4YOa4YOQ4YOTIOGDrOGDkOGDoeGDkOGDmeGDmOGDl+GDruGDmCDhg6Lhg5Thg6Xhg6Hhg6Lhg5giCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4YOs4YOQ4YOg4YOs4YOU4YOg4YOQIOGDouGDlOGDpeGDoeGDouGDmOGDoeGDl+GDleGDmOGDoSwg4YOh4YOQ4YOT4YOQ4YOqIOGDoeGDmOGDouGDp+GDleGDlOGDkeGDmOGDoSDhg5vhg53hg5zhg5jhg6jhg5Xhg5zhg5Ag4YOo4YOU4YOh4YOQ4YOr4YOa4YOU4YOR4YOU4YOa4YOY4YOQIOGDk+GDkOGDm+GDruGDm+GDkOGDoOGDlCDhg6Lhg5Thg6Xhg5zhg53hg5rhg53hg5Lhg5jhg5Thg5Hhg5jhg6Hhg5fhg5Xhg5jhg6EiLAogICAgICAiZGVmYXVsdCI6ICLhg6Hhg6Dhg6Phg5rhg5gg4YOi4YOU4YOl4YOh4YOi4YOYLCDhg6Hhg5Dhg5Phg5Dhg6og4YOo4YOU4YOh4YOQ4YOr4YOa4YOU4YOR4YOU4YOa4YOY4YOQIOGDoeGDmOGDouGDp+GDleGDlOGDkeGDmOGDoSDhg5vhg53hg5zhg5jhg6jhg5Xhg5zhg5AiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4YOS4YOQ4YOT4YOQ4YOs4YOn4YOV4YOU4YOi4YOY4YOhIOGDoOGDlOGDn+GDmOGDm+GDmOGDoSDhg6Hhg5Dhg5fhg5Dhg6Phg6Dhg5gg4YOT4YOQ4YOb4YOu4YOb4YOQ4YOg4YOUIOGDouGDlOGDpeGDnOGDneGDmuGDneGDkuGDmOGDlOGDkeGDmOGDoeGDl+GDleGDmOGDoSIsCiAgICAgICJkZWZhdWx0IjogIuGDkOGDm+GDneGDruGDoeGDnOGDmOGDoSDhg6Dhg5Thg5\/hg5jhg5vhg5giCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4YOo4YOU4YOb4YOd4YOs4YOb4YOU4YOR4YOY4YOhIOGDoOGDlOGDn+GDmOGDm+GDmOGDoSDhg6Hhg5Dhg5fhg5Dhg6Phg6Dhg5gg4YOT4YOQ4YOb4YOu4YOb4YOQ4YOg4YOUIOGDouGDlOGDpeGDnOGDneGDmuGDneGDkuGDmOGDlOGDkeGDmOGDoeGDl+GDleGDmOGDoSIsCiAgICAgICJkZWZhdWx0IjogIuGDqOGDlOGDm+GDneGDrOGDm+GDlOGDkeGDmOGDoSDhg6Dhg5Thg5\/hg5jhg5vhg5giCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4YOT4YOQ4YOb4YOu4YOb4YOQ4YOg4YOUIOGDouGDlOGDpeGDnOGDneGDmuGDneGDkuGDmOGDmOGDoSDhg5Dhg6bhg6zhg5Thg6Dhg5AgXCLhg6jhg5Thg5Dhg5vhg53hg6zhg5vhg5RcIiDhg6bhg5jhg5rhg5Dhg5nhg5jhg6Hhg5fhg5Xhg5jhg6EiLAogICAgICAiZGVmYXVsdCI6ICLhg6jhg5Thg5Dhg5vhg53hg6zhg5vhg5Thg5cg4YOe4YOQ4YOh4YOj4YOu4YOU4YOR4YOYLiDhg57hg5Dhg6Hhg6Phg67hg5Thg5Hhg5gg4YOb4YOd4YOY4YOc4YOY4YOo4YOc4YOU4YOR4YOQLCDhg6Dhg53hg5Lhg53hg6Dhg6og4YOh4YOs4YOd4YOg4YOYLCDhg5Dhg6Dhg5Dhg6Hhg6zhg53hg6Dhg5gsIOGDkOGDnCDhg57hg5Dhg6Hhg6Phg67hg5Lhg5Dhg6Phg6rhg5Thg5vhg5Thg5rhg5guIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuGDk+GDkOGDm+GDruGDm+GDkOGDoOGDlCDhg6Lhg5Thg6Xhg5zhg53hg5rhg53hg5Lhg5jhg5jhg6Eg4YOQ4YOm4YOs4YOU4YOg4YOQIFwi4YOQ4YOp4YOV4YOU4YOc4YOUIOGDnuGDkOGDoeGDo+GDruGDmOGDoVwiIOGDpuGDmOGDmuGDkOGDmeGDmOGDoeGDl+GDleGDmOGDoSIsCiAgICAgICJkZWZhdWx0IjogIuGDkOGDqeGDleGDlOGDnOGDlCDhg5Dhg5vhg53hg67hg6Hhg5zhg5AuIOGDk+GDkOGDleGDkOGDmuGDlOGDkeGDkCDhg5vhg53hg5jhg5zhg5jhg6jhg5zhg5Thg5Hhg5Ag4YOh4YOs4YOd4YOg4YOYIOGDnuGDkOGDoeGDo+GDruGDmOGDly4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4YOT4YOQ4YOb4YOu4YOb4YOQ4YOg4YOUIOGDouGDlOGDpeGDnOGDneGDmuGDneGDkuGDmOGDmOGDoSDhg5Dhg6bhg6zhg5Thg6Dhg5AgXCLhg5fhg5Dhg5Xhg5jhg5Phg5Dhg5wg4YOq4YOT4YOY4YOhXCIg4YOm4YOY4YOa4YOQ4YOZ4YOY4YOh4YOX4YOV4YOY4YOhIiwKICAgICAgImRlZmF1bHQiOiAi4YOX4YOQ4YOV4YOY4YOT4YOQ4YOcIOGDoeGDquGDkOGDk+GDlOGDlyDhg5Phg5Dhg5Xhg5Dhg5rhg5Thg5Hhg5AuIOGDrOGDkOGDqOGDkOGDmuGDlCDhg6fhg5Xhg5Thg5rhg5Ag4YOe4YOQ4YOh4YOj4YOu4YOYIOGDk+GDkCDhg5fhg5Dhg5Xhg5jhg5Phg5Dhg5wg4YOh4YOq4YOQ4YOT4YOUIOGDk+GDkOGDleGDkOGDmuGDlOGDkeGDmOGDoSDhg6jhg5Thg6Hhg6Dhg6Phg5rhg5Thg5Hhg5AuIgogICAgfQogIF0KfQo="],"libraries\/H5P.MarkTheWords-1.11\/language\/km.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJNZWRpYSIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIlR5cGUiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9wdGlvbmFsIG1lZGlhIHRvIGRpc3BsYXkgYWJvdmUgdGhlIHF1ZXN0aW9uLiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJEaXNhYmxlIGltYWdlIHpvb21pbmciCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGFzayBkZXNjcmlwdGlvbiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJEZXNjcmliZSBob3cgdGhlIHVzZXIgc2hvdWxkIHNvbHZlIHRoZSB0YXNrLiIsCiAgICAgICJwbGFjZWhvbGRlciI6ICJDbGljayBvbiBhbGwgdGhlIHZlcmJzIGluIHRoZSB0ZXh0IHRoYXQgZm9sbG93cy4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dGZpZWxkIiwKICAgICAgInBsYWNlaG9sZGVyIjogIlRoaXMgaXMgYW4gYW5zd2VyOiAqYW5zd2VyKi4iLAogICAgICAiaW1wb3J0YW50IjogewogICAgICAgICJkZXNjcmlwdGlvbiI6ICI8dWw+PGxpPk1hcmtlZCB3b3JkcyBhcmUgYWRkZWQgd2l0aCBhbiBhc3RlcmlzayAoKikuPC9saT48bGk+QXN0ZXJpc2tzIGNhbiBiZSBhZGRlZCB3aXRoaW4gbWFya2VkIHdvcmRzIGJ5IGFkZGluZyBhbm90aGVyIGFzdGVyaXNrLCAqY29ycmVjdHdvcmQqKiogPSZndDsgY29ycmVjdHdvcmQqLjwvbGk+PC91bD4iLAogICAgICAgICJleGFtcGxlIjogIlRoZSBjb3JyZWN0IHdvcmRzIGFyZSBtYXJrZWQgbGlrZSB0aGlzOiAqY29ycmVjdHdvcmQqLCBhbiBhc3RlcmlzayBpcyB3cml0dGVuIGxpa2UgdGhpczogKmNvcnJlY3R3b3JkKioqLiIKICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk92ZXJhbGwgRmVlZGJhY2siLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJ3aWRnZXRzIjogWwogICAgICAgICAgICB7CiAgICAgICAgICAgICAgImxhYmVsIjogIkRlZmF1bHQiCiAgICAgICAgICAgIH0KICAgICAgICAgIF0sCiAgICAgICAgICAibGFiZWwiOiAiRGVmaW5lIGN1c3RvbSBmZWVkYmFjayBmb3IgYW55IHNjb3JlIHJhbmdlIiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJDbGljayB0aGUgXCJBZGQgcmFuZ2VcIiBidXR0b24gdG8gYWRkIGFzIG1hbnkgcmFuZ2VzIGFzIHlvdSBuZWVkLiBFeGFtcGxlOiAwLTIwJSBCYWQgc2NvcmUsIDIxLTkxJSBBdmVyYWdlIFNjb3JlLCA5MS0xMDAlIEdyZWF0IFNjb3JlISIsCiAgICAgICAgICAiZW50aXR5IjogInJhbmdlIiwKICAgICAgICAgICJmaWVsZCI6IHsKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiU2NvcmUgUmFuZ2UiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7fSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiRmVlZGJhY2sgZm9yIGRlZmluZWQgc2NvcmUgcmFuZ2UiLAogICAgICAgICAgICAgICAgInBsYWNlaG9sZGVyIjogIkZpbGwgaW4gdGhlIGZlZWRiYWNrIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIFwiQ2hlY2tcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICLhnpbhnrfhnpPhnrfhno\/hn5LhnpnhnoXhnpjhn5Lhnpvhnr7hnpkiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJTdWJtaXRcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJTdWJtaXQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJSZXRyeVwiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIuGen+GetuGegOGemOGfkuGej+GehOGekeGfgOGejyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBcIlNob3cgc29sdXRpb25cIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICLhnpThnoThn5LhnqDhnrbhnonhnoXhnpjhn5Lhnpvhnr7hnpnhno\/hn5Lhnprhnrnhnpjhno\/hn5LhnprhnrzhnpwiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQmVoYXZpb3VyYWwgc2V0dGluZ3MuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRoZXNlIG9wdGlvbnMgd2lsbCBsZXQgeW91IGNvbnRyb2wgaG93IHRoZSB0YXNrIGJlaGF2ZXMuIiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiRW5hYmxlIFwiUmV0cnlcIiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJFbmFibGUgXCJTaG93IHNvbHV0aW9uXCIgYnV0dG9uIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkVuYWJsZSBcIkNoZWNrXCIgYnV0dG9uIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIlNob3cgc2NvcmUgcG9pbnRzIiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJTaG93IHBvaW50cyBlYXJuZWQgZm9yIGVhY2ggYW5zd2VyLiIKICAgICAgICB9CiAgICAgIF0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJDb3JyZWN0IGFuc3dlciB0ZXh0IiwKICAgICAgImRlZmF1bHQiOiAi4Z6P4Z+S4Z6a4Z654Z6Y4Z6P4Z+S4Z6a4Z684Z6cISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHVzZWQgdG8gaW5kaWNhdGUgdGhhdCBhbiBhbnN3ZXIgaXMgY29ycmVjdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbmNvcnJlY3QgYW5zd2VyIHRleHQiLAogICAgICAiZGVmYXVsdCI6ICLhnpjhnrfhnpPhno\/hn5Lhnprhnrnhnpjhno\/hn5LhnprhnrzhnpwhIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdXNlZCB0byBpbmRpY2F0ZSB0aGF0IGFuIGFuc3dlciBpcyBpbmNvcnJlY3QiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWlzc2VkIGFuc3dlciB0ZXh0IiwKICAgICAgImRlZmF1bHQiOiAi4Z6Y4Z634Z6T4Z6D4Z6+4Z6J4Z6F4Z6Y4Z+S4Z6b4Z6+4Z6ZISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHVzZWQgdG8gaW5kaWNhdGUgdGhhdCBhbiBhbnN3ZXIgaXMgbWlzc2luZyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZXNjcmlwdGlvbiBmb3IgRGlzcGxheSBTb2x1dGlvbiIsCiAgICAgICJkZWZhdWx0IjogIuGegOGet+GeheGfkuGeheGej+GfkuGemuGevOGenOGelOGetuGek+GekuGfkuGenOGevuGelOGeheGfkuGeheGeu+GelOGfkuGelOGek+GfkuGek+Gel+GetuGeluGeiuGevuGemOGfkuGelOGeuOGeseGfkuGemeGemOGetuGek+GeiuGfhuGejuGfhOGfh+Gen+GfkuGemuGetuGemeGflCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUaGlzIHRleHQgdGVsbHMgdGhlIHVzZXIgdGhhdCB0aGUgdGFza3MgaGFzIGJlZW4gdXBkYXRlZCB3aXRoIHRoZSBzb2x1dGlvbi4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dHVhbCByZXByZXNlbnRhdGlvbiBvZiB0aGUgc2NvcmUgYmFyIGZvciB0aG9zZSB1c2luZyBhIHJlYWRzcGVha2VyIiwKICAgICAgImRlZmF1bHQiOiAi4Z6i4Z+S4Z6T4Z6A4Z6R4Z6R4Z694Z6b4Z6U4Z624Z6T4Z6W4Z634Z6T4Z+S4Z6R4Z67IDpudW0g4Z6b4Z6+IDp0b3RhbCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJMYWJlbCBmb3IgdGhlIGZ1bGwgcmVhZGFibGUgdGV4dCBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIuGeouGej+GfkuGekOGelOGekeGekeGetuGfhuGehOGemOGevOGemyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJMYWJlbCBmb3IgdGhlIHRleHQgd2hlcmUgd29yZHMgY2FuIGJlIG1hcmtlZCBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIuGeouGej+GfkuGekOGelOGekeGekeGetuGfhuGehOGemOGevOGem+GeiuGfguGem+GemOGetuGek+GeluGetuGegOGfkuGemeGeouGetuGeheGeiuGetuGegOGfi+Gen+GemOGfkuGeguGetuGem+Gfi+GelOGetuGekyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJTb2x1dGlvbiBtb2RlIGhlYWRlciBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIuGemOGfieGevOGejyDCq+GeheGemOGfkuGem+GevuGemeGej+GfkuGemuGeueGemOGej+GfkuGemuGevOGenMK7IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNoZWNraW5nIG1vZGUgaGVhZGVyIGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAi4Z6Y4Z+J4Z684Z6PIMKr4Z6W4Z634Z6T4Z634Z6P4Z+S4Z6Z4Z6F4Z6Y4Z+S4Z6b4Z6+4Z6ZwrsiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQXNzaXN0aXZlIHRlY2hub2xvZ3kgZGVzY3JpcHRpb24gZm9yIFwiQ2hlY2tcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJDaGVjayB0aGUgYW5zd2Vycy4gVGhlIHJlc3BvbnNlcyB3aWxsIGJlIG1hcmtlZCBhcyBjb3JyZWN0LCBpbmNvcnJlY3QsIG9yIHVuYW5zd2VyZWQuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFzc2lzdGl2ZSB0ZWNobm9sb2d5IGRlc2NyaXB0aW9uIGZvciBcIlNob3cgU29sdXRpb25cIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJTaG93IHRoZSBzb2x1dGlvbi4gVGhlIHRhc2sgd2lsbCBiZSBtYXJrZWQgd2l0aCBpdHMgY29ycmVjdCBzb2x1dGlvbi4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQXNzaXN0aXZlIHRlY2hub2xvZ3kgZGVzY3JpcHRpb24gZm9yIFwiUmV0cnlcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJSZXRyeSB0aGUgdGFzay4gUmVzZXQgYWxsIHJlc3BvbnNlcyBhbmQgc3RhcnQgdGhlIHRhc2sgb3ZlciBhZ2Fpbi4iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.MarkTheWords-1.11\/language\/ko.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLrr7jrlJTslrQiLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICLsnKDtmJUiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIijshKDtg53sgqztla0pIOusuOygnCDsnITsl5Ag7ZGc7Iuc7ZWgIOuvuOuUlOyWtC4iCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAi7J2066+47KeAIO2ZleuMgCDruYTtmZzshLHtmZQiCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi6rO87KCcIOyEpOuqhSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLsgqzsmqnsnpDqsIAg6rO87KCc66W8IOyWtOuWu+qyjCDtlbTqsrDtlbTslbwg7ZWY64qU7KeAIOyEpOuqhe2VmOyEuOyalC4iLAogICAgICAicGxhY2Vob2xkZXIiOiAiKOyYiOyLnCnri6TsnYwg6riA7JeQ7IScIOuqqOuToCDrj5nsgqzrpbwg7YG066at7ZWY7IS47JqULiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLthY3siqTtirgg7ZWE65OcIiwKICAgICAgInBsYWNlaG9sZGVyIjogIuydtOqyg+ydtCDsoJXri7XsnoXri4jri6Q6ICrsoJXri7UqLiIsCiAgICAgICJpbXBvcnRhbnQiOiB7CiAgICAgICAgImRlc2NyaXB0aW9uIjogIjx1bD48bGk+7KCV64u17Jy866GcIOyytO2BrCjrp4jtgawp65CY7Ja07JW8IOuLqOyWtOuTpOydgCDrs4TtkZwoKinroZwg7LaU6rCA65Cp64uI64ukLjwvbGk+PGxpPuuzhO2RnOuKlCDrp4jtgazrkJjslrTslbztlaAg64uo7Ja07JWI7JeQIOy2lOqwgO2VmOyXrCDtkZzsi5ztlaAg7IiYIOyeiOuLpCAoKmNvcnJlY3R3b3JkKioqID0mZ3Q7IGNvcnJlY3R3b3JkKikuPC9saT48L3VsPiIsCiAgICAgICAgImV4YW1wbGUiOiAi7KCV64u1IO2RnOq4sCDrsKnrspU6ICrsoJXri7Xri6jslrQqLCDrs4TtkZzrpbwg7KCV64u17JeQIO2RnOq4sO2VmOuKlCDrsKnrspU6ICpjb3JyZWN0d29yZCoqKi4iCiAgICAgIH0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLsoITrsJjsoIHsnbgg7ZS865Oc67CxIiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAid2lkZ2V0cyI6IFsKICAgICAgICAgICAgewogICAgICAgICAgICAgICJsYWJlbCI6ICLquLDrs7jqsJIiCiAgICAgICAgICAgIH0KICAgICAgICAgIF0sCiAgICAgICAgICAibGFiZWwiOiAi7KCQ7IiYIOuylOychOyXkCDrlLDrpbgg7KSEIO2UvOuTnOuwsSDshKTsoJUiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIlwiQWRkIHJhbmdlXCIg67KE7Yq87J2EIO2BtOumre2VmOyXrCDtlYTsmpTtlZwg66eM7YG8IOuylOychOulvCDstpTqsIDtlZjsi63si5zsmKQuIOyYiDogMC0yMCUg64W466Cl7J20IO2VhOyalO2VnCDsoJDsiJgsIDIxLTkxJSDtj4nqt6DsoIHsnbgg7KCQ7IiYLCA5MS0xMDAlIO2bjOulre2VnCDsoJDsiJghIiwKICAgICAgICAgICJlbnRpdHkiOiAi67KU7JyEIiwKICAgICAgICAgICJmaWVsZCI6IHsKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAi7KCQ7IiYIOuylOychCIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHt9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICLsoJXsnZjtlZwg7KCQ7IiYIOuylOychOyXkCDrjIDtlZwg7ZS865Oc67CxIiwKICAgICAgICAgICAgICAgICJwbGFjZWhvbGRlciI6ICLtlLzrk5zrsLEg7J6R7ISxIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlwiQ2hlY2tcIiAo7KCV64u1IO2ZleyduCkg67KE7Yq8IO2FjeyKpO2KuCIsCiAgICAgICJkZWZhdWx0IjogIuygleuLtSDtmZXsnbgiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiXCJTdWJtaXRcIiAo7KCc7Lac7ZWY6riwKSDrsoTtirwg7YWN7Iqk7Yq4IiwKICAgICAgImRlZmF1bHQiOiAi7KCc7Lac7ZWY6riwIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlwiUmV0cnlcIiAo7J6s7Iuc64+EKSDrsoTtirwg7YWN7Iqk7Yq4IiwKICAgICAgImRlZmF1bHQiOiAi7J6s7Iuc64+EIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlwiU2hvdyBzb2x1dGlvblwiICjtlbTri7Ug67O06riwKSDrsoTtirwg7YWN7Iqk7Yq4IiwKICAgICAgImRlZmF1bHQiOiAi7ZW064u1IOuztOq4sCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLqs7zsoJzqsIAg7IiY7ZaJ65CY64qUIOuwqeyLnSDshKTsoJUiLAogICAgICAiZGVzY3JpcHRpb24iOiAi7J20IOyYteyFmOydhCDsgqzsmqntlZjrqbQg6rO87KCc6rCAIOyImO2WieuQmOuKlCDrsKnsi53snYQg7KCc7Ja07ZWgIOyImCDsnojri6QuIiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiXCJSZXRyeVwiICjsnqzsi5zrj4QpIOuyhO2KvCDtmZzshLHtmZQiCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiXCJTaG93IHNvbHV0aW9uXCIgKO2VtOuLteuztOydtOq4sCkg67KE7Yq8IO2ZnOyEse2ZlCIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJcIkNoZWNrXCIgKOygleuLtSDtmZXsnbgpIOuyhO2KvCDtmZzshLHtmZQiCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAi7KCQ7IiYIOuztOydtOq4sCIsCiAgICAgICAgICAiZGVzY3JpcHRpb24iOiAi6rCBIOuLteuzgOyXkCDrjIDtlbQg7ZqN65Od7ZWcIOygkOyImOulvCDtkZzsi5ztlZjsi63si5zsmKQuIgogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuygleuLteyXkCDrjIDtlZwg7YWN7Iqk7Yq4IiwKICAgICAgImRlZmF1bHQiOiAi7KCV64u17J6F64uI64ukISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLri7Xrs4DsnbQg7KCV7ZmV7ZWo7J2EIOuCmO2DgOuCtOuKlCDrjbAg7IKs7Jqp65CY64qUIO2FjeyKpO2KuCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLsmKTri7Xsl5Ag64yA7ZWcIO2FjeyKpO2KuCIsCiAgICAgICJkZWZhdWx0IjogIuyYpOuLteyeheuLiOuLpCEiLAogICAgICAiZGVzY3JpcHRpb24iOiAi64u167OA7J20IOyemOuqu+uQmOyXiOydjOydhCDrgpjtg4DrgrTripQg642wIOyCrOyaqeuQmOuKlCDthY3siqTtirgiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi66+464u167OA7JeQIOuMgO2VnCDthY3siqTtirgiLAogICAgICAiZGVmYXVsdCI6ICLri7Xrs4DrkJjsp4Ag7JWK7JWY7Iq164uI64ukISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLri7Xrs4DsnbQg64iE652965CY7JeI7J2M7J2EIOuCmO2DgOuCtOuKlCDrjbAg7IKs7Jqp65CY64qUIO2FjeyKpO2KuCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLtlbTri7Ug7ZGc7Iuc7JeQIOuMgO2VnCDshKTrqoUiLAogICAgICAiZGVmYXVsdCI6ICLqs7zsoJzqsIAg7ZW064u17J2EIO2PrO2VqO2VmOuPhOuhnSDsl4XrjbDsnbTtirjrkKgiLAogICAgICAiZGVzY3JpcHRpb24iOiAi7J20IO2FjeyKpO2KuOuKlCDsgqzsmqnsnpDsl5Dqsowg6rO87KCc6rCAIO2VtOuLteqzvCDtlajqu5gg7JeF642w7J207Yq465CY7JeI7J2M7J2EIOyVjOugpOykgOuLpC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi7J6Q64+ZIOydveyWtOyjvOq4sCDquLDriqXsnYQg7IKs7Jqp7ZWY64qUIOyCrOuejOuTpOydhCDsnITtlZwg7KCQ7IiYIOunieuMgCDtkZzsi5zsnZgg7YWN7Iqk7Yq4IO2RnOq4sCIsCiAgICAgICJkZWZhdWx0IjogIuy0nSA6dG90YWwgcG9pbnRzIOykkeyXkOyEnCA6bnVtIOydhCDtmo3rk53tlZjsmIDsirXri4jri6QuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuuztOyhsCDquLDsiKDsnYQg7JyE7ZWcIOqyg+ycvOuhnCDsoITssrQg66qo65GQ6rCAIOydveq4sCDqsIDriqXtlZwg7YWN7Iqk7Yq47JeQIOuMgO2VnCDroIjsnbTruJQiLAogICAgICAiZGVmYXVsdCI6ICLquIAg7KCE7LK0IOydveyWtOyjvOq4sCDqsIDriqUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi64uo7Ja065Ok7J20IOuztOyhsOq4sOyIoCDsgqzsmqnsnYQg7JyE7ZWcIOuLqOyWtOulvCDtkZzsi5ztlaAg7IiYIOyeiOuKlCDthY3siqTtirgg66CI7J2067iUIiwKICAgICAgImRlZmF1bHQiOiAi64uo7Ja065Ok7J20IOuztOyhsOq4sOyIoCDsgqzsmqnsnYQg7JyE7ZWcIO2RnOq4sCDrkKAg7IiYIOyeiOuKlCDthY3siqTtirgiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi67O07KGwIOq4sOyIoOyaqSDtlbTri7Ug66qo65OcIOygnOuqqSIsCiAgICAgICJkZWZhdWx0IjogIu2VtOuLtSDrqqjrk5wiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi67O07KGwIOq4sOyIoOyaqSDtmZXsnbgg66qo65OcIOygnOuqqXMiLAogICAgICAiZGVmYXVsdCI6ICLtmZXsnbgg66qo65OcIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlwiQ2hlY2tcIiDrsoTtirzsl5Ag64yA7ZWcIOuztOyhsCDquLDsiKAg7ISk66qFIiwKICAgICAgImRlZmF1bHQiOiAi7KCV64u17J2EIOyytO2BrO2VmOyEuOyalC4g64u167OA7J2AIOygleuLtSwg7Jik64u1IO2YueydgCDrr7jri7Xrs4DsnLzroZwg7ZGc6riw65CgIOqyg+yeheuLiOuLpC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiXCJTaG93IFNvbHV0aW9uXCIg67KE7Yq87JeQIOuMgO2VnCDrs7TsobAg6riw7IigIOyEpOuqhSIsCiAgICAgICJkZWZhdWx0IjogIu2VtOuLtSDrs7TsnbTquLAuIOyYrOuwlOuluCDtlbTri7Xqs7wg7ZWo6ruYIO2RnOq4sOuQoCDqsoPsnoXri4jri6QuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlwiUmV0cnlcIiDrsoTtirzsl5Ag64yA7ZWcIOuztOyhsCDquLDsiKAg7ISk66qFIiwKICAgICAgImRlZmF1bHQiOiAi7J6s7Iuc64+E7ZWY7IS47JqULiDrqqjrk6Ag64u167OA7J2EIOy0iOq4sO2ZlO2VmOqzoCDsg4jroZwg7Iuc64+E7ZWY7IS47JqULiIKICAgIH0KICBdCn0K"],"libraries\/H5P.MarkTheWords-1.11\/language\/lt.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIlRpcGFzIiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJNZWTFvmlhZ2Ega2xhdXNpbW8gcGFwaWxkeW11aS4iCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiScWhanVuZ3RpIHZhaXpkbyBkaWRpbmltxIUiCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiTWVkaWphIgogICAgfSwKICAgIHsKICAgICAgImRlc2NyaXB0aW9uIjogIkFwcmHFoXlraXRlIGthaXAgbmF1ZG90b2phcyB0dXLEl3TFsyBpxaFzcHLEmXN0aSB1xb5kdW90xK8uIiwKICAgICAgImxhYmVsIjogIlXFvmR1b3RpZXMgYXByYcWheW1hcyIsCiAgICAgICJwbGFjZWhvbGRlciI6ICJQYXNwYXVza2l0ZSB2aXN1cyB2ZWlrc21hxb5vZMW+aXVzIHBhdGVpa2lhbWFtZSB0ZWtzdGUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0byBsYXVrYXMiLAogICAgICAiaW1wb3J0YW50IjogewogICAgICAgICJkZXNjcmlwdGlvbiI6ICI8dWw+PGxpPk1hcmtlZCB3b3JkcyBhcmUgYWRkZWQgd2l0aCBhbiBhc3RlcmlzayAoKikuPC9saT48bGk+QXN0ZXJpc2tzIGNhbiBiZSBhZGRlZCB3aXRoaW4gbWFya2VkIHdvcmRzIGJ5IGFkZGluZyBhbm90aGVyIGFzdGVyaXNrLCAqY29ycmVjdHdvcmQqKiogPSZndDsgY29ycmVjdHdvcmQqLjwvbGk+PC91bD4iLAogICAgICAgICJleGFtcGxlIjogIlRoZSBjb3JyZWN0IHdvcmRzIGFyZSBtYXJrZWQgbGlrZSB0aGlzOiAqY29ycmVjdHdvcmQqLCBhbiBhc3RlcmlzayBpcyB3cml0dGVuIGxpa2UgdGhpczogKmNvcnJlY3R3b3JkKioqLiIKICAgICAgfSwKICAgICAgInBsYWNlaG9sZGVyIjogIkF0c2FreW1hcyB5cmE6ICphbnN3ZXIqLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZW5kcmFzIGF0c2lsaWVwaW1hcyIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkRlZmluZSBjdXN0b20gZmVlZGJhY2sgZm9yIGFueSBzY29yZSByYW5nZSIsCiAgICAgICAgICAiZW50aXR5IjogImRpYXBhem9uYXMiLAogICAgICAgICAgImZpZWxkIjogewogICAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJTY29yZSBSYW5nZSIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHt9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJBdHNpbGllcGltYWkgYXBpYnLEl8W+dGFtIGJhbMWzIGRpYXBhem9udWkiLAogICAgICAgICAgICAgICAgInBsYWNlaG9sZGVyIjogIlXFvnBpbGR5a2l0ZSBhdHNpbGllcGltxIUiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9LAogICAgICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgICAgIHsKICAgICAgICAgICAgICAibGFiZWwiOiAiTnVtYXR5dGFzaXMiCiAgICAgICAgICAgIH0KICAgICAgICAgIF0sCiAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiU3B1c3RlbMSXa2l0ZSBteWd0dWvEhSDigJ5QcmlkxJd0aSBkaWFwYXpvbsSF4oCcLCBrYWQgcHJpZMSXdHVtxJd0ZSB0aWVrIGRpYXBhem9uxbMsIGtpZWsganVtcyByZWlraWEuIFBhdnl6ZHlzOiAw4oCTMjAgJSBibG9nYXMgYmFsYXMsIDIx4oCTOTEgJSB2aWR1dGluaXMgYmFsYXMsIDkx4oCTMTAwICUgcHVpa3VzIHJlenVsdGF0YXMhIgogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0YXMgbXlndHVrdWkg4oCeVGlrcmludGnigJwuIiwKICAgICAgImRlZmF1bHQiOiAiVGlrcmludGkiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJTdWJtaXRcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJQYXRlaWt0aSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBcIlJldHJ5XCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiUmV0cnkiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJTaG93IHNvbHV0aW9uXCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiU2hvdyBzb2x1dGlvbiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJWZWlrc2Vub3MgbnVzdGF0eW1haS4iLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICLErmdhbGludGkg4oCeQmFuZHl0aSBkYXIga2FydMSF4oCcIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIsSuZ2FsaW50aSBteWd0dWvEhSDigJ5Sb2R5dGkgc3ByZW5kaW3EheKAnC4iCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAixK5nYWxpbnRpIG15Z3R1a8SFIOKAnlRpa3JpbnRp4oCcLiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJTaG93IHBvaW50cyBlYXJuZWQgZm9yIGVhY2ggYW5zd2VyLiIsCiAgICAgICAgICAibGFiZWwiOiAiU2hvdyBzY29yZSBwb2ludHMiCiAgICAgICAgfQogICAgICBdLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGhlc2Ugb3B0aW9ucyB3aWxsIGxldCB5b3UgY29udHJvbCBob3cgdGhlIHRhc2sgYmVoYXZlcy4iCiAgICB9LAogICAgewogICAgICAiZGVmYXVsdCI6ICJDb3JyZWN0ISIsCiAgICAgICJsYWJlbCI6ICJUZWlzaW5nYXMgYXRzYWt5bW8gdGVrc3RhcyIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHVzZWQgdG8gaW5kaWNhdGUgdGhhdCBhbiBhbnN3ZXIgaXMgY29ycmVjdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbmNvcnJlY3QgYW5zd2VyIHRleHQiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB1c2VkIHRvIGluZGljYXRlIHRoYXQgYW4gYW5zd2VyIGlzIGluY29ycmVjdCIsCiAgICAgICJkZWZhdWx0IjogIkluY29ycmVjdCEiCiAgICB9LAogICAgewogICAgICAiZGVmYXVsdCI6ICJBbnN3ZXIgbm90IGZvdW5kISIsCiAgICAgICJsYWJlbCI6ICJNaXNzZWQgYW5zd2VyIHRleHQiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB1c2VkIHRvIGluZGljYXRlIHRoYXQgYW4gYW5zd2VyIGlzIG1pc3NpbmciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRGVzY3JpcHRpb24gZm9yIERpc3BsYXkgU29sdXRpb24iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGhpcyB0ZXh0IHRlbGxzIHRoZSB1c2VyIHRoYXQgdGhlIHRhc2tzIGhhcyBiZWVuIHVwZGF0ZWQgd2l0aCB0aGUgc29sdXRpb24uIiwKICAgICAgImRlZmF1bHQiOiAiVGFzayBpcyB1cGRhdGVkIHRvIGNvbnRhaW4gdGhlIHNvbHV0aW9uLiIKICAgIH0sCiAgICB7CiAgICAgICJkZWZhdWx0IjogIllvdSBnb3QgOm51bSBvdXQgb2YgOnRvdGFsIHBvaW50cyIsCiAgICAgICJsYWJlbCI6ICJUZXh0dWFsIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBzY29yZSBiYXIgZm9yIHRob3NlIHVzaW5nIGEgcmVhZHNwZWFrZXIiCiAgICB9LAogICAgewogICAgICAiZGVmYXVsdCI6ICJGdWxsIHJlYWRhYmxlIHRleHQiLAogICAgICAibGFiZWwiOiAiTGFiZWwgZm9yIHRoZSBmdWxsIHJlYWRhYmxlIHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiCiAgICB9LAogICAgewogICAgICAiZGVmYXVsdCI6ICJGdWxsIHRleHQgd2hlcmUgd29yZHMgY2FuIGJlIG1hcmtlZCIsCiAgICAgICJsYWJlbCI6ICJMYWJlbCBmb3IgdGhlIHRleHQgd2hlcmUgd29yZHMgY2FuIGJlIG1hcmtlZCBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIKICAgIH0sCiAgICB7CiAgICAgICJkZWZhdWx0IjogIlNvbHV0aW9uIG1vZGUiLAogICAgICAibGFiZWwiOiAiU29sdXRpb24gbW9kZSBoZWFkZXIgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiCiAgICB9LAogICAgewogICAgICAiZGVmYXVsdCI6ICJDaGVja2luZyBtb2RlIiwKICAgICAgImxhYmVsIjogIkNoZWNraW5nIG1vZGUgaGVhZGVyIGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIgogICAgfSwKICAgIHsKICAgICAgImRlZmF1bHQiOiAiQ2hlY2sgdGhlIGFuc3dlcnMuIFRoZSByZXNwb25zZXMgd2lsbCBiZSBtYXJrZWQgYXMgY29ycmVjdCwgaW5jb3JyZWN0LCBvciB1bmFuc3dlcmVkLiIsCiAgICAgICJsYWJlbCI6ICJBc3Npc3RpdmUgdGVjaG5vbG9neSBkZXNjcmlwdGlvbiBmb3IgXCJDaGVja1wiIGJ1dHRvbiIKICAgIH0sCiAgICB7CiAgICAgICJkZWZhdWx0IjogIlNob3cgdGhlIHNvbHV0aW9uLiBUaGUgdGFzayB3aWxsIGJlIG1hcmtlZCB3aXRoIGl0cyBjb3JyZWN0IHNvbHV0aW9uLiIsCiAgICAgICJsYWJlbCI6ICJBc3Npc3RpdmUgdGVjaG5vbG9neSBkZXNjcmlwdGlvbiBmb3IgXCJTaG93IFNvbHV0aW9uXCIgYnV0dG9uIgogICAgfSwKICAgIHsKICAgICAgImRlZmF1bHQiOiAiUmV0cnkgdGhlIHRhc2suIFJlc2V0IGFsbCByZXNwb25zZXMgYW5kIHN0YXJ0IHRoZSB0YXNrIG92ZXIgYWdhaW4uIiwKICAgICAgImxhYmVsIjogIkFzc2lzdGl2ZSB0ZWNobm9sb2d5IGRlc2NyaXB0aW9uIGZvciBcIlJldHJ5XCIgYnV0dG9uIgogICAgfQogIF0KfQo="],"libraries\/H5P.MarkTheWords-1.11\/language\/lv.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIlRpcHMiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIlBhcGlsZHUgbXVsdGltZWRpanMsIGt1cnUgYXRzcG9ndcS8b3QgdmlycyBqYXV0xIFqdW1hLiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJBdHNwxJNqb3QgYXR0xJNsYSB0xIFsdW1tYWnFhnUiCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAiTXVsdGl2aWRlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlV6ZGV2dW1hIGFwcmFrc3RzIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkFwcmFrc3RpZXQga8SBIGxpZXRvdMSBamFtIHZhamFkesSTdHUgcmlzaW7EgXQgdXpkZXZ1bXUuIiwKICAgICAgInBsYWNlaG9sZGVyIjogIk5va2xpa8WhxLdpbmlldCB1eiB2aXNpZW0gZGFyYsSrYmFzIHbEgXJkaWVtIG7EgWthbWFqxIEgdGVrc3TEgS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3RhIGxhdWtzIiwKICAgICAgInBsYWNlaG9sZGVyIjogIsWgxKsgaXIgYXRiaWxkZTogKmF0YmlsZGUqLiIsCiAgICAgICJpbXBvcnRhbnQiOiB7CiAgICAgICAgImV4YW1wbGUiOiAiUGFyZWl6aWUgdsSBcmRpIHRpZWsgYXR6xKttxJN0aSDFocSBZGk6ICpwYXJlaXppKiwgenZhaWd6bsSrdGUgaXIgcmFrc3TEq3RhIMWhxIFkaTogKnBhcmVpemkqKiouIiwKICAgICAgICAiZGVzY3JpcHRpb24iOiAiPHVsPjxsaT5BdHrEq23Ek3RpZSB2xIFyZGkgdGllayBwaWV2aWVub3RpIGFyIHp2YWlnem7Eq3RpICgqKS48L2xpPjxsaT5BdHrEq23Ek3Rham9zIHbEgXJkb3MgenZhaWd6bsSrdGVzIHZhciBwaWV2aWVub3QsIHBpZXZpZW5vam90IHbEk2wgdmllbnUgenZhaWd6bsSrdGksICpwYXJlaXppKioqID0mZ3Q7IHBhcmVpemkqLjwvbGk+IDwvdWw+IgogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiS29wxJNqxIEgYXRncmllemVuaXNrxIEgc2FpdGUiLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJ3aWRnZXRzIjogWwogICAgICAgICAgICB7CiAgICAgICAgICAgICAgImxhYmVsIjogIlDEk2Mgbm9rbHVzxJNqdW1hIgogICAgICAgICAgICB9CiAgICAgICAgICBdLAogICAgICAgICAgImxhYmVsIjogIkllc3RhdGlldCBwaWVsxIFnb3R1IGF0Z3JpZXplbmlza28gc2FpdGkga2F0cmFtIHJlenVsdMSBdHUgZGlhcGF6b25hbSIsCiAgICAgICAgICAiZW50aXR5IjogImRpYXBhem9ucyIsCiAgICAgICAgICAiZmllbGQiOiB7CiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlJlenVsdMSBdHUgZGlhcGF6b25zIgogICAgICAgICAgICAgIH0sCiAgICAgICAgICAgICAge30sCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIk5vcsSBZMSrdMSBIGRpYXBhem9uYSBhdGdyaWV6ZW5pc2vEgSBzYWl0ZSIsCiAgICAgICAgICAgICAgICAicGxhY2Vob2xkZXIiOiAiQWl6cGlsZGlldCBhdGdyaWV6ZW5pc2tvIHNhaXRpIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfSwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJLbGlrxaHEt2luaWV0IHBvZ3UgXCJQaWV2aWVub3QgZGlhcGF6b251XCIsIGxhaSBwaWV2aWVub3R1IHRpayBkaWFwYXpvbnVzIGNpayB2xJNsYXRpZXMuIFBpZW3Ek3JhbSwgMC0yMCUgU2xpa3RzIHJlenVsdMSBdHMsIDIxLTkxJSBWaWR1dsSTanMgcmV6dWx0xIF0cywgOTEtMTAwJSBMaWVsaXNrcyByZXp1bHTEgXRzISIKICAgICAgICB9CiAgICAgIF0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJQb2dhcyBcIlDEgXJiYXVkxKt0XCIgdGVrc3RzIiwKICAgICAgImRlZmF1bHQiOiAiUMSBcmJhdWTEq3QiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUG9nYXMgXCJJZXNuaWVndFwiIHRla3N0cyIsCiAgICAgICJkZWZhdWx0IjogIkllc25pZWd0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlBvZ2FzIFwiTcSTxKNpbsSBdCB2xJNscmVpelwiIHRla3N0cyIsCiAgICAgICJkZWZhdWx0IjogIk3Ek8SjaW7EgXQgdsSTbHJlaXoiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUG9nYXMgXCJQYXLEgWTEq3QgcmlzaW7EgWp1bXVcIiB0ZWtzdHMiLAogICAgICAiZGVmYXVsdCI6ICJQYXLEgWTEq3QgcmlzaW7EgWp1bXUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVXp2ZWTEq2JhcyBpZXN0YXTEq2p1bWkuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIsWgaWUgaWVzdGF0xKtqdW1pIMS8YXVzIGp1bXMga29udHJvbMSTdCB1emRldnVtYSB1enZlZMSrYnUuIiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiQXTEvGF1dCBcIk3Ek8SjaW7EgXQgdsSTbHJlaXpcIiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJBdMS8YXV0IHBvZ3UgXCJSxIFkxKt0IHJpc2luxIFqdW11XCIiCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiQXTEvGF1dCBwb2d1IFwiUMSBcmJhdWTEq3RcIiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJSxIFkxKt0IHB1bmt0dXMiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIlBhcsSBZMSrdCBwYXIga2F0cnUgYXRiaWxkaSBub3BlbG7Eq3RvcyBwdW5rdHVzLiIKICAgICAgICB9CiAgICAgIF0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJQYXJlaXrEgXMgYXRiaWxkZXMgdGVrc3RzIiwKICAgICAgImRlZmF1bHQiOiAiUGFyZWl6aSEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGVrc3RzLCBrbyBpem1hbnRvLCBsYWkgbm9yxIFkxKt0dSwga2EgYXRiaWxkZSBpciBwYXJlaXphIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk5lcGFyZWl6xIFzIGF0YmlsZGVzIHRla3N0cyIsCiAgICAgICJkZWZhdWx0IjogIk5lcGFyZWl6aSEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGVrc3RzLCBrbyBpem1hbnRvLCBsYWkgbm9yxIFkxKt0dSwga2EgYXRiaWxkZSBpciBuZXBhcmVpemEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTmVpZXNuaWVndMSBcyBhdGJpbGRlcyB0ZWtzdHMiLAogICAgICAiZGVmYXVsdCI6ICJBdGJpbGRlIG5hdiBhdHJhc3RhISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZWtzdHMsIGtvIGl6bWFudG8sIGxhaSBub3LEgWTEq3R1LCBrYSB0csWra3N0IGF0YmlsZGVzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFwcmFrc3RzIHJpc2luxIFqdW1hIHBhcsSBZMSrxaFhbmFpIiwKICAgICAgImRlZmF1bHQiOiAiVXpkZXZ1bXMgaXIgYXRqYXVuaW7EgXRzLCBsYWkgaWV0dmVydHUgcmlzaW7EgWp1bXUuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIsWgaXMgdGVrc3RzIGluZm9ybcSTIGxpZXRvdMSBanUsIGthIHV6ZGV2dW1pIGlyIGF0amF1bmluxIF0aSBhciByaXNpbsSBanVtdS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUmV6dWx0xIF0dSBza2FsYXMgdGVrc3R1xIFsYWlzIGF0c3BvZ3XEvG9qdW1zIHRpZW0sIGthcyBpem1hbnRvIGFzaXN0xKt2xIFzIHRlaG5vbG\/Eo2lqYXMiLAogICAgICAiZGVmYXVsdCI6ICJUdSBzYcWGxJNtaSA6bnVtIG5vIDp0b3RhbCBwdW5rdGllbSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFdGnEt2V0ZSBwaWxuYW0gbGFzxIFtYW0gdGVrc3RhbSBwcmlla8WhIGFzaXN0xKt2YWrEgW0gdGVobm9sb8SjaWrEgW0iLAogICAgICAiZGVmYXVsdCI6ICJQaWxucyBsYXPEgW1zIHRla3N0cyIKICAgIH0sCiAgICB7CiAgICAgICJkZWZhdWx0IjogIlBpbG5zIHRla3N0cywga3VyxIEgdmFyIGF0esSrbcSTdCB2xIFyZHVzIiwKICAgICAgImxhYmVsIjogIkFzaXN0xKt2byB0ZWhub2xvxKNpanUgZXRpxLdldGUgdGVrc3RhbSwga3VyxIEgdmFyIGF0esSrbcSTdCB2xIFyZHVzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlJpc2luxIFqdW1hIHJlxb7Eq21hIGdhbHZlbmUgYXNpc3TEq3ZhasSBbSB0ZWhub2xvxKNpasSBbSIsCiAgICAgICJkZWZhdWx0IjogIlJpc2luxIFqdW1hIHJlxb7Eq21zIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlDEgXJiYXVkxKvFoWFuYXMgcmXFvsSrbWEgZ2FsdmVuZSBhc2lzdMSrdmFqxIFtIHRlaG5vbG\/Eo2lqxIFtIiwKICAgICAgImRlZmF1bHQiOiAiUMSBcmJhdWTEq8WhYW5hcyByZcW+xKttcyIKICAgIH0sCiAgICB7CiAgICAgICJkZWZhdWx0IjogIlDEgXJiYXVkxKt0IGF0YmlsZGVzLiBBdGJpbGRlcyB0aWtzIGF0esSrbcSTdGFzIGvEgSBwYXJlaXphcywgbmVwYXJlaXphcywgdmFpIG5lYXRiaWxkxJN0YXMuIiwKICAgICAgImxhYmVsIjogIlBvZ2FzIFwiUMSBcmJhdWTEq3RcIiBhcHJha3N0cyBhc2lzdMSrdmFqxIFtIHRlaG5vbG\/Eo2lqxIFtIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFzaXN0xKt2byB0ZWhub2xvxKNpanUgYXByYWtzdHMgcG9nYWkgXCJSxIFkxKt0IHJpc2luxIFqdW11XCIiLAogICAgICAiZGVmYXVsdCI6ICJSxIFkxKt0IHJpc2luxIFqdW11LiBVemRldnVtcyB0aWtzIGF0esSrbcSTdHMgYXIgdMSBIHBhcmVpem8gcmlzaW7EgWp1bXUuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlBvZ2FzIFwiTcSTxKNpbsSBdCB2xJNscmVpelwiIGFwcmFrc3RzIGFzaXN0xKt2YWrEgW0gdGVobm9sb8SjaWrEgW0iLAogICAgICAiZGVmYXVsdCI6ICJNxJPEo2luxIF0IHV6ZGV2dW11IHbEk2xyZWl6LiBEesSTc3QgdmlzYXMgc25pZWd0xIFzIGF0YmlsZGVzIHVuIHPEgWt0IHV6ZGV2dW11IHbEk2xyZWl6LiIKICAgIH0KICBdCn0K"],"libraries\/H5P.MarkTheWords-1.11\/language\/mn.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogItCi06nRgNOp0LsiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogItCQ0YHRg9GD0LvRgtGL0L0g0LTRjdGN0YAg0YXQsNGA0YPRg9C70LDRhSDQvdGN0LzRjdC70YIg0LzQtdC00LjQsC4iCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAi0JfRg9GA0LPQuNC50L0g0YLQvtC80YDRg9GD0LvQsNCz0YfQuNC50LMg0LjQtNGN0LLRhdCz0q\/QuSDQsdC+0LvQs9C+0YUiCiAgICAgICAgfQogICAgICBdLAogICAgICAibGFiZWwiOiAi0JzQtdC00LjQsCIKICAgIH0sCiAgICB7CiAgICAgICJkZXNjcmlwdGlvbiI6ICLQpdGN0YDRjdCz0LvRjdCz0Ycg0LTQsNCw0LvQs9Cw0LLRgNGL0LMg0YXRjdGA0YXRjdC9INGI0LjQudC00LLRjdGA0LvRjdGFINGR0YHRgtC+0LnQsyDRgtCw0LnQu9Cx0LDRgNC70LDQvdCwINGD0YMuIiwKICAgICAgImxhYmVsIjogItCQ0LbQu9GL0L0g0YLQvtC00L7RgNGF0L7QudC70L7Qu9GCIiwKICAgICAgInBsYWNlaG9sZGVyIjogItCU0LDRgNCw0LDRhSDRgtC10LrRgdGC0LjQudC9INCx0q\/RhSDSr9C50Lsg0q\/QsyDQtNGN0Y3RgCDQtNCw0YDQvdCwINGD0YMuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0LXQutGB0YIg0YLQsNC70LHQsNGAIiwKICAgICAgImltcG9ydGFudCI6IHsKICAgICAgICAiZGVzY3JpcHRpb24iOiAiPHVsPjxsaT7QotGN0LzQtNGN0LPQu9GN0LPQtNGB0Y3QvSDSr9Cz0YHQuNC50LMg0L7QtNC+0L7RgCAoKikg0L3RjdC80LTRjdCzLjwvbGk+PGxpPtCi0Y3QvNC00Y3Qs9C70Y3Qs9C00YHRjdC9INKv0LMg0LTQvtGC0L7RgCDTqdOp0YAg0L7QtNC+0L7RgCDQvdGN0LzQtiwgKtC306nQsiDSr9CzKioqID0mZ3Q7INC306nQsiDSr9CzKi48L2xpPjwvdWw+IiwKICAgICAgICAiZXhhbXBsZSI6ICLQl9Op0LIg0q\/Qs9GB0LjQudCzINC00LDRgNCw0LDRhSDQsdCw0LnQtNC70LDQsNGAINGC0Y3QvNC00Y3Qs9C70Y3QsjogKtC306nQsiDSr9CzKiwg0L7QtNGL0LMg0LjQvdCz0Y3QtiDQsdC40YfQvdGNOiAq0LfTqdCyINKv0LMqKiouIgogICAgICB9LAogICAgICAicGxhY2Vob2xkZXIiOiAi0K3QvdGNINCx0L7QuyDRhdCw0YDQuNGD0LvRgiDRjtC8OiAq0YXQsNGA0LjRg9C70YIqLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQldGA06nQvdGF0LjQuSDRgdCw0L3QsNC7INGF0q\/RgdGN0LvRgiIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogItCQ0LvRjCDRhyDQvtC90L7QvtC90Ysg0LzRg9C20LjQtCDQt9Cw0YXQuNCw0LvQs9Cw0YIg0YHQsNC90LDQuyDRhdKv0YHRjdC70YLQuNC50LMg0YLQvtC00L7RgNGF0L7QudC70L7RhSIsCiAgICAgICAgICAiZW50aXR5IjogItGF0q\/RgNGN0Y0iLAogICAgICAgICAgImZpZWxkIjogewogICAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICLQntC90L7QvtC90Ysg0YXSr9GA0Y3RjSIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHt9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICLQotC+0LTQvtGA0YXQvtC50LvQvtCz0LTRgdC+0L0g0L7QvdC+0L7QvdGLINGF0q\/RgNGN0Y3QvdC40Lkg0YHQsNC90LDQuyDRhdKv0YHRjdC70YIiLAogICAgICAgICAgICAgICAgInBsYWNlaG9sZGVyIjogItCh0LDQvdCw0Lsg0YXSr9GB0Y3Qu9GC0LjQudCzINCx06nQs9C706nQvdOpINKv0q8iCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9LAogICAgICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgICAgIHsKICAgICAgICAgICAgICAibGFiZWwiOiAi06jQs9Op0LPQtNC806nQuyIKICAgICAgICAgICAgfQogICAgICAgICAgXSwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJcItCl0q\/RgNGN0Y0g0L3RjdC80Y3RhVwiINGC0L7QstGH0LjQudCzINC00LDRgNC2INGI0LDQsNGA0LTQu9Cw0LPQsNGC0LDQuSDQsdC+0Lsg0L7Qu9C+0L0g0LzRg9C2INC90Y3QvNC90Y0uINCW0LjRiNGN0Y06IDAtMjAlINC80YPRgyDQvtC90L7QviwgMjEtOTElINC00YPQvdC00LDQtiDQvtC90L7QviwgOTEtMTAwJSDRgdCw0LnQvSDQvtC90L7QviEiCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiXCLQqNCw0LvQs9Cw0YVcIiDRgtC+0LLRh9C70YPRg9GA0YvQvSDRgtC10LrRgdGCIiwKICAgICAgImRlZmF1bHQiOiAi0KjQsNC70LPQsNGFIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlwi0JjQu9Cz0Y3RjdGFXCIg0YLQvtCy0YfQu9GD0YPRgNGL0L0g0YLQtdC60YHRgiIsCiAgICAgICJkZWZhdWx0IjogItCY0LvQs9GN0Y3RhSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJcItCU0LDRhdC40L0g0L7RgNC+0LvQtNC+0YVcIiDRgtC+0LLRh9C70YPRg9GA0YvQvSDRgtC10LrRgdGCIiwKICAgICAgImRlZmF1bHQiOiAi0JTQsNGF0LjQvSDQvtGA0L7Qu9C00L7RhSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJcItCo0LjQudC00LLRjdGA0LjQudCzINGF0LDRgNGD0YPQu9Cw0YVcIiDRgtC+0LLRh9C70YPRg9GA0YvQvSDRgtC10LrRgdGCIiwKICAgICAgImRlZmF1bHQiOiAi0KjQuNC50LTQstGN0YDQuNC50LMg0YXQsNGA0YPRg9C70LDRhSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQl9Cw0L0g0q\/QudC70LjQudC9INGC0L7RhdC40YDQs9C+0L4uIiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiXCLQlNCw0YXQuNC9INC+0YDQvtC70LTQvtGFXCIt0YvQsyDQuNC00Y3QstGF0LbSr9Kv0LvRjdGFIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIlwi0KjQuNC50LTQu9C40LnQsyDRhdCw0YDRg9GD0LvQsNGFXCIg0YLQvtCy0YfQuNC50LMg0LjQtNGN0LLRhdC20q\/Sr9C70L3RjSDSr9KvIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIlwi0KjQsNC70LPQsNGFXCIg0YLQvtCy0YfQuNC50LMg0LjQtNGN0LLRhdC20q\/Sr9C70L3RjSDSr9KvIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImRlc2NyaXB0aW9uIjogItCl0LDRgNC40YPQu9GCINCx0q\/RgNGCINGG0YPQs9C70YPRg9C70YHQsNC9INC+0L3QvtC+0LPQvtC+INGF0LDRgNGD0YPQuy4iLAogICAgICAgICAgImxhYmVsIjogItCe0L3QvtC+INGF0LDRgNGD0YPQu9Cw0YUiCiAgICAgICAgfQogICAgICBdLAogICAgICAiZGVzY3JpcHRpb24iOiAi0K3QtNCz0Y3RjdGAINGB0L7QvdCz0L7Qu9GC0YPRg9C0INC90Ywg0LTQsNCw0LvQs9Cw0LLQsNGAINGF0Y3RgNGF0Y3QvSDQsNC20LjQu9C70LDRhdGL0LMg0YXRj9C90LDRhSDQsdC+0LvQvtC80LbQuNC50LMg0YLQsNC90LQg0L7Qu9Cz0L7QvdC+LiIKICAgIH0sCiAgICB7CiAgICAgICJkZWZhdWx0IjogItCX06nQsiEiLAogICAgICAibGFiZWwiOiAi0JfTqdCyINGF0LDRgNC40YPQu9GC0YvQvSDRgtC10LrRgdGCIiwKICAgICAgImRlc2NyaXB0aW9uIjogItCl0LDRgNC40YPQu9GCINC90Ywg0LfTqdCyINCz0Y3QtNCz0LjQudCzINC40LvRgtCz0Y3RhSDRgtC10LrRgdGCIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCR0YPRgNGD0YMg0YXQsNGA0LjRg9C70YLRi9C9INGC0LXQutGB0YIiLAogICAgICAiZGVzY3JpcHRpb24iOiAi0KXQsNGA0LjRg9C70YIg0LHRg9GA0YPRgyDQsdCw0LnQs9Cw0LDQsyDQuNC70YLQs9GN0YUg0YLQtdC60YHRgiIsCiAgICAgICJkZWZhdWx0IjogItCR0YPRgNGD0YMhIgogICAgfSwKICAgIHsKICAgICAgImRlZmF1bHQiOiAi0KXQsNGA0LjRg9C70YIg0L7Qu9C00YHQvtC90LPSr9C5ISIsCiAgICAgICJsYWJlbCI6ICLQkNC70LPQsCDQsdC+0LvRgdC+0L0g0YXQsNGA0LjRg9C70YLRi9C9INGC0LXQutGB0YIiLAogICAgICAiZGVzY3JpcHRpb24iOiAi0KXQsNGA0LjRg9C70YIg0LHQsNC50YXQs9Kv0Lkg0LHQsNC50LPQsNCw0LMg0LjQu9GC0LPRjdGFINGC0LXQutGB0YIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0JTRjdC70LPRjdGG0LjQudC9INGI0LjQudC00LvQuNC50L0g0YLQsNC50LvQsdCw0YAiLAogICAgICAiZGVzY3JpcHRpb24iOiAi0K3QvdGNINGC0LXQutGB0YIg0L3RjCDQtNCw0LDQu9Cz0LDQstGA0YPRg9C0INGI0LjQudC00LvRjdGN0YAg0YjQuNC90Y3Rh9C70Y3Qs9C00YHRjdC90LjQudCzINGF0Y3RgNGN0LPQu9GN0LPRh9C00Y3QtCDRhdGN0LvQtNGN0LMuIiwKICAgICAgImRlZmF1bHQiOiAi0JTQsNCw0LvQs9Cw0LLQsNGAINC90Ywg0YjQuNC50LTQu9C40LnQsyDQsNCz0YPRg9C70YHQsNC9INGI0LjQvdGN0YfQu9GN0LPQtNGB0Y3QvS4iCiAgICB9LAogICAgewogICAgICAiZGVmYXVsdCI6ICLQotCwINC90LjQudGCIDp0b3RhbCDQvtC90L7QvtC90L7QvtGBIDpudW0g0LDQstGB0LDQvSIsCiAgICAgICJsYWJlbCI6ICLQo9C90YjQuNGFINGH0LDQvdCz0LAg0Y\/RgNC40LPRhyDQsNGI0LjQs9C70LDQtNCw0LMg0YXSr9C80q\/Sr9GB0YIg0LfQvtGA0LjRg9C70YHQsNC9INC+0L3QvtC+0L3RiyDRgdCw0LzQsdCw0YDRi9C9INGC0LXQutGB0YLRjdC9INC00q\/RgNGB0LvRjdC7IgogICAgfSwKICAgIHsKICAgICAgImRlZmF1bHQiOiAi0JHSr9GA0Y3QvSDRg9C90YjQuNGFINCx0L7Qu9C+0LzQttGC0L7QuSDRgtC10LrRgdGCIiwKICAgICAgImxhYmVsIjogItCi0YPRgdC70LDRhSDRgtC10YXQvdC+0LvQvtCz0LjQudC9INCx0q\/RgNGN0L0g0YPQvdGI0LjQs9C00LDRhdGD0LnRhiDRgtC10LrRgdGC0LjQudC9INGI0L7RiNCz0L4iCiAgICB9LAogICAgewogICAgICAiZGVmYXVsdCI6ICLSrtCzINGC0Y3QvNC00Y3Qs9C70Y3QtiDQsdC+0LvQvtGFINCx0q\/RgNGN0L0g0YLQtdC60YHRgiIsCiAgICAgICJsYWJlbCI6ICLQotGD0YHQu9Cw0YUg0YLQtdGF0L3QvtC70L7Qs9C40LQg0LfQvtGA0LjRg9C70LYg0q\/QsyDRgtGN0LzQtNGN0LPQu9GN0LYg0LHQvtC70L7RhSDRgtC10LrRgdGC0LjQudC9INGI0L7RiNCz0L4iCiAgICB9LAogICAgewogICAgICAiZGVmYXVsdCI6ICLQqNC40LnQtNC70LjQudC9INCz0L7RgNC40LwiLAogICAgICAibGFiZWwiOiAi0KLRg9GB0LvQsNGFINGC0LXRhdC90L7Qu9C+0LPQuNC0INC30L7RgNC40YPQu9GB0LDQvSDRiNC40LnQtNC70LjQudC9INCz0L7RgNC40LzRi9C9INGC0L7Qu9Cz0L7QuSDRhdGN0YHRjdCzIgogICAgfSwKICAgIHsKICAgICAgImRlZmF1bHQiOiAi0KjQsNC70LPQsNGFINCz0L7RgNC40LwiLAogICAgICAibGFiZWwiOiAi0KLRg9GB0LvQsNGFINGC0LXRhdC90L7Qu9C+0LPQuNC50L0g0LPQvtGA0LjQvNGL0L0g0YLQvtC70LPQvtC5INGF0Y3RgdCz0LjQudCzINGI0LDQu9Cz0LDQtiDQsdCw0LnQvdCwIgogICAgfSwKICAgIHsKICAgICAgImRlZmF1bHQiOiAi0KXQsNGA0LjRg9C70YLRg9GD0LTRi9CzINGI0LDQu9Cz0LDQvdCwINGD0YMuINCl0LDRgNC40YPQu9GC0YPRg9C00YvQsyDQt9Op0LIsINCx0YPRgNGD0YMsINGF0LDRgNC40YPQu9GC0LPSr9C5INCz0Y3QtiDRgtGN0LzQtNGN0LPQu9GN0L3RjS4iLAogICAgICAibGFiZWwiOiAiXCLQqNCw0LvQs9Cw0YVcIiDRgtC+0LLRh9C70YPRg9GA0YvQvSDRgtGD0YHQu9Cw0YUg0YLQtdGF0L3QvtC70L7Qs9C40LnQvSDRgtCw0LnQu9Cx0LDRgCIKICAgIH0sCiAgICB7CiAgICAgICJkZWZhdWx0IjogItCo0LjQudC00LvQuNC50LMg0YXQsNGA0YPRg9C7LiDQlNCw0LDQu9Cz0LDQstGA0YvQsyDQt9Op0LIg0YjQuNC50LTQu9GN0Y3RgCDQvdGMINGC0Y3QvNC00Y3Qs9C70Y3QvdGNLiIsCiAgICAgICJsYWJlbCI6ICJcItCo0LjQudC00Y3QuyDRhdCw0YDRg9GD0LvQsNGFXCIg0YLQvtCy0YfQu9GD0YPRgNGL0L0g0YLRg9GB0LvQsNGFINGC0LXRhdC90L7Qu9C+0LPQuNC50L0g0YLQsNC50LvQsdCw0YAiCiAgICB9LAogICAgewogICAgICAiZGVmYXVsdCI6ICLQlNCw0LDQu9Cz0LDQstGA0YvQsyDQtNCw0YXQuNC9INC+0YDQvtC70LTQvtC90L4g0YPRgy4g0JHSr9GFINGF0LDRgNC40YPQu9GC0YvQsyDQtNCw0YXQuNC9INGC0L7RhdC40YDRg9GD0LvQsNCw0LQg0LTQsNCw0LvQs9Cw0LLRgNGL0LMg0LTQsNGF0LjQvSDRjdGF0LvSr9Kv0LvQvdGNINKv0q8uIiwKICAgICAgImxhYmVsIjogIlwi0JTQsNGF0LjQvSDQvtGA0L7Qu9C00L7RhVwiINGC0L7QstGH0LvRg9GD0YDRi9C9INGC0YPRgdC70LDRhSDRgtC10YXQvdC+0LvQvtCz0LjQudC9INGC0LDQudC70LHQsNGAIgogICAgfQogIF0KfQo="],"libraries\/H5P.MarkTheWords-1.11\/language\/nb.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJNZWRpZWVsZW1lbnQiLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJUeXBlIiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJWYWxnZnJpdHQgbWVkaWVlbGVtZW50LiBFbGVtZW50ZXQgdmlsIGJsaSBwbGFzc2VydCBvdmVyIHNww7hyc23DpWxldC4iCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiRGVha3RpdmVyIHpvb21pbmdmdW5rc2pvbi4iCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiT3BwZ2F2ZWJlc2tyaXZlbHNlIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkZvcmtsYXIgaHZvcmRhbiBicnVrZXJlbiBza2FsIGzDuHNlIG9wcGdhdmVuLiIsCiAgICAgICJwbGFjZWhvbGRlciI6ICJDbGljayBvbiBhbGwgdGhlIHZlcmJzIGluIHRoZSB0ZXh0IHRoYXQgZm9sbG93cy4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3RsaW5qZXIiLAogICAgICAicGxhY2Vob2xkZXIiOiAiT3NsbyBlciBob3ZlZHN0YWRlbiBpICpOb3JnZSoiLAogICAgICAiaW1wb3J0YW50IjogewogICAgICAgICJkZXNjcmlwdGlvbiI6ICI8dWw+PGxpPk1hcmtlZCB3b3JkcyBhcmUgYWRkZWQgd2l0aCBhbiBhc3RlcmlzayAoKikuPC9saT48bGk+QXN0ZXJpc2tzIGNhbiBiZSBhZGRlZCB3aXRoaW4gbWFya2VkIHdvcmRzIGJ5IGFkZGluZyBhbm90aGVyIGFzdGVyaXNrLCAqY29ycmVjdHdvcmQqKiogPSZndDsgY29ycmVjdHdvcmQqLjwvbGk+PC91bD4iLAogICAgICAgICJleGFtcGxlIjogIlRoZSBjb3JyZWN0IHdvcmRzIGFyZSBtYXJrZWQgbGlrZSB0aGlzOiAqY29ycmVjdHdvcmQqLCBhbiBhc3RlcmlzayBpcyB3cml0dGVuIGxpa2UgdGhpczogKmNvcnJlY3R3b3JkKioqLiIKICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRpbGJha2VtZWxkaW5nIHDDpSBoZWxlIG9wcGdhdmEiLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJ3aWRnZXRzIjogWwogICAgICAgICAgICB7CiAgICAgICAgICAgICAgImxhYmVsIjogIkZvcmhhbmRzaW5uc3RpbGxpbmciCiAgICAgICAgICAgIH0KICAgICAgICAgIF0sCiAgICAgICAgICAibGFiZWwiOiAiT3BwcmV0dCBwb2VuZ29tcsOlZGVyIG9nIGxlZ2cgaW5uIHRpbGJha2VtZWxkaW5nZXIuIiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJLbGlrayBww6Uga25hcHBlbiBcIkxlZ2cgdGlsIHBvZW5nb21yw6VkZVwiIG9nIGxlZ2cgdGlsIHPDpSBtYW5nZSBwb2VuZ29tcsOlZGVyIGR1IHRyZW5nZXIuIEVrc2VtcGVsOiAw4oCTNDAgJSBTdmFrdCByZXN1bHRhdCwgNDHigJM4MCAlIEdqZW5ub21zbml0dGxpZyByZXN1bHRhdCwgODHigJMxMDAgJSBGbG90dCByZXN1bHRhdCEiLAogICAgICAgICAgImVudGl0eSI6ICJPbXLDpWRlIiwKICAgICAgICAgICJmaWVsZCI6IHsKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiUG9lbmdvbXLDpWRlIgogICAgICAgICAgICAgIH0sCiAgICAgICAgICAgICAge30sCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlRpbGJha2VtZWxkaW5nIGZvciBkZWZpbmVydCBwb2VuZ29tcsOlZGUiLAogICAgICAgICAgICAgICAgInBsYWNlaG9sZGVyIjogIlNrcml2IGlubiB0aWxiYWtlbWVsZGluZy4iCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRXRpa2V0dCBmb3IgXCJTamVra1wiLWtuYXBwIiwKICAgICAgImRlZmF1bHQiOiAiU2pla2siCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJTdWJtaXRcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJTdWJtaXQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJSZXRyeVwiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlJldHJ5IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkV0aWtldHQgZm9yIFwiRmFzaXRcIi1rbmFwcCIsCiAgICAgICJkZWZhdWx0IjogIkZhc2l0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIklubnN0aWxsaW5nZXIgZm9yIG9wcGdhdmUtb3BwZsO4cnNlbCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJEaXNzZSBpbnN0aWxsaW5nZW5lIGxhciBkZWcgYmVzdGVtbWUgaHZvcmRhbiBvcHBnYXZldHlwZW4gc2thbCBvcHBmw7hyZSBzZWcuIiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiQWt0aXZlciBcIlByw7h2IGlnamVuXCIta25hcHAiCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiQWt0aXZlciBcIkZhc2l0XCIga25hcHAiCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiRW5hYmxlIFwiQ2hlY2tcIiBidXR0b24iCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiU2hvdyBzY29yZSBwb2ludHMiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIlNob3cgcG9pbnRzIGVhcm5lZCBmb3IgZWFjaCBhbnN3ZXIuIgogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlJpa3RpZyBzdmFyIHRla3N0IiwKICAgICAgImRlZmF1bHQiOiAiUmlrdGlnISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHVzZWQgdG8gaW5kaWNhdGUgdGhhdCBhbiBhbnN3ZXIgaXMgY29ycmVjdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJGZWlsIHN2YXIgdGVrc3QiLAogICAgICAiZGVmYXVsdCI6ICJGZWlsISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHVzZWQgdG8gaW5kaWNhdGUgdGhhdCBhbiBhbnN3ZXIgaXMgaW5jb3JyZWN0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk1hbmdsZXIgc3ZhciB0ZWtzdCIsCiAgICAgICJkZWZhdWx0IjogIk1hbmdsZXIhIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdXNlZCB0byBpbmRpY2F0ZSB0aGF0IGFuIGFuc3dlciBpcyBtaXNzaW5nIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkJlc2tyaXZlbHNlIGZvciBWaXMgTMO4c25pbmciLAogICAgICAiZGVmYXVsdCI6ICJPcHBnYXZlbiBlciBvcHBkYXRlcnQgdGlsIMOlIGlubmVob2xkZSBmYXNpdGVuLiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUaGlzIHRleHQgdGVsbHMgdGhlIHVzZXIgdGhhdCB0aGUgdGFza3MgaGFzIGJlZW4gdXBkYXRlZCB3aXRoIHRoZSBzb2x1dGlvbi4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dHVhbCByZXByZXNlbnRhdGlvbiBvZiB0aGUgc2NvcmUgYmFyIGZvciB0aG9zZSB1c2luZyBhIHJlYWRzcGVha2VyIiwKICAgICAgImRlZmF1bHQiOiAiWW91IGdvdCA6bnVtIG91dCBvZiA6dG90YWwgcG9pbnRzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkxhYmVsIGZvciB0aGUgZnVsbCByZWFkYWJsZSB0ZXh0IGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiRnVsbCByZWFkYWJsZSB0ZXh0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkxhYmVsIGZvciB0aGUgdGV4dCB3aGVyZSB3b3JkcyBjYW4gYmUgbWFya2VkIGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiRnVsbCB0ZXh0IHdoZXJlIHdvcmRzIGNhbiBiZSBtYXJrZWQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiU29sdXRpb24gbW9kZSBoZWFkZXIgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJTb2x1dGlvbiBtb2RlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNoZWNraW5nIG1vZGUgaGVhZGVyIGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiQ2hlY2tpbmcgbW9kZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJBc3Npc3RpdmUgdGVjaG5vbG9neSBkZXNjcmlwdGlvbiBmb3IgXCJDaGVja1wiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIkNoZWNrIHRoZSBhbnN3ZXJzLiBUaGUgcmVzcG9uc2VzIHdpbGwgYmUgbWFya2VkIGFzIGNvcnJlY3QsIGluY29ycmVjdCwgb3IgdW5hbnN3ZXJlZC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQXNzaXN0aXZlIHRlY2hub2xvZ3kgZGVzY3JpcHRpb24gZm9yIFwiU2hvdyBTb2x1dGlvblwiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlNob3cgdGhlIHNvbHV0aW9uLiBUaGUgdGFzayB3aWxsIGJlIG1hcmtlZCB3aXRoIGl0cyBjb3JyZWN0IHNvbHV0aW9uLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJBc3Npc3RpdmUgdGVjaG5vbG9neSBkZXNjcmlwdGlvbiBmb3IgXCJSZXRyeVwiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlJldHJ5IHRoZSB0YXNrLiBSZXNldCBhbGwgcmVzcG9uc2VzIGFuZCBzdGFydCB0aGUgdGFzayBvdmVyIGFnYWluLiIKICAgIH0KICBdCn0K"],"libraries\/H5P.MarkTheWords-1.11\/language\/nl.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJNZWRpYSIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIlR5cGUiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9wdGlvbmVsZSBtZWRpYSwgZGllIGJvdmVuIGRlIHZyYWFnIHdvcmR0IGdldG9vbmQuIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkJlZWxkIHpvb21lbiB1aXRzY2hha2VsZW4iCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGFha29tc2NocmlqdmluZyIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJCZXNjaHJpamYgaG9lIGRlIGdlYnJ1aWtlciBkZSB0YWFrIG1vZXQgdWl0dm9lcmVuLiIsCiAgICAgICJwbGFjZWhvbGRlciI6ICJLbGlrIGluIGRlIHZvbGdlbmRlIHRla3N0IG9wIGFsbGUgd2Vya3dvb3JkZW4uIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0dmVsZCIsCiAgICAgICJwbGFjZWhvbGRlciI6ICJEaXQgaXMgZWVuIGFudHdvb3JkOiAqYW50d29vcmQqLiIsCiAgICAgICJpbXBvcnRhbnQiOiB7CiAgICAgICAgImRlc2NyaXB0aW9uIjogIjx1bD48bGk+R2VtYXJrZWVyZGUgd29vcmRlbiB3b3JkZW4gdm9vcnppZW4gdmFuIGVlbiBhc3RlcmlzayAoKikuPC9saT48bGk+RWVuIGFzdGVyaXNrIG1hZyB3b3JkZW4gaW5nZXNsb3RlbiBkb29yIGVlbiBhbmRlcmUgYXN0ZXJpc2ssIGRpdCByZXN1bHRlZXJ0IGluICoqID0gKi48L2xpPjwvdWw+IiwKICAgICAgICAiZXhhbXBsZSI6ICJEZSBqdWlzdGUgd29vcmRlbiB6aWpuIGFscyB2b2xndCBnZW1hcmtlZXJkOiAqanVpc3R3b29yZCosIGVlbiBhc3RlcmlzayB3b3JkdCBnZXNjaHJldmVuIGFscyA6ICpqdWlzdHdvb3JkKioqLiIKICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFsZ2VoZWxlIGZlZWRiYWNrIiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAid2lkZ2V0cyI6IFsKICAgICAgICAgICAgewogICAgICAgICAgICAgICJsYWJlbCI6ICJTdGFuZGFhcmQiCiAgICAgICAgICAgIH0KICAgICAgICAgIF0sCiAgICAgICAgICAibGFiZWwiOiAiRGVmaW5pZWVyIGFhbmdlcGFzdGUgZmVlZGJhY2sgdm9vciBlbGtlIHNjb3JlcmVla3MiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIkRydWsgb3AgZGUgXCJWb2VnIHNjb3JlcmVla3NcIi1rbm9wIG9tIHpvdmVlbCByZWVrc2VuIHRvZSB0ZSB2b2VnZW4gYWxzIG5vZGlnLiBWb29yYmVlbGQ6IDAtMjAlIE9udm9sZG9lbmRlLCAyMS05MSUgR2VtaWRkZWxkZSBzY29yZSwgOTEtMTAwJSBVaXRzdGVrZW5kZSBzY29yZSEiLAogICAgICAgICAgImVudGl0eSI6ICJyZWVrcyIsCiAgICAgICAgICAiZmllbGQiOiB7CiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlNjb3JlcmVla3MiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7fSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiRmVlZGJhY2sgdm9vciBkZSBnZWRlZmluaWVlcmRlIHNjb3JlcmVla3MiLAogICAgICAgICAgICAgICAgInBsYWNlaG9sZGVyIjogIlZ1bCBkZSBmZWVkYmFjayBpbiIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICB9CiAgICAgIF0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdCB2b29yIFwiQ29udHJvbGVlclwiLWtub3AiLAogICAgICAiZGVmYXVsdCI6ICJDb250cm9sZWVyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0IHZvb3IgXCJWZXJ6ZW5kXCIta25vcCIsCiAgICAgICJkZWZhdWx0IjogIlZlcnplbmQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3Qgdm9vciBcIk9wbmlldXdcIi1rbm9wIiwKICAgICAgImRlZmF1bHQiOiAiT3BuaWV1dyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdCB2b29yIFwiVG9vbiBvcGxvc3NpbmdcIi1rbm9wIiwKICAgICAgImRlZmF1bHQiOiAiVG9vbiBvcGxvc3NpbmciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiR2VkcmFnc2luc3RlbGxpbmdlbi4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiTWV0IGRlemUgb3B0aWVzIGt1biBqZSBiZXBhbGVuIGhvZSBkZSB0YWFrIHppY2ggZ2VkcmFhZ3QuIiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiU2NoYWtlbCBcIk9wbmlldXdcIiBpbiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJTY2hha2VsIFwiVG9vbiBvcGxvc3NpbmdcIi1rbm9wIGluIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIlNjaGFrZWwgXCJDb250cm9sZWVyXCIta25vcCBpbiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJUb29uIHNjb3JlcHVudGVuIiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJUb29uIGhldCBhYW50YWwgdmVyZGllbmRlIHB1bnRlbiB2b29yIGVsayBhbnR3b29yZC4iCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3Qgdm9vciBqdWlzdCBhbnR3b29yZCIsCiAgICAgICJkZWZhdWx0IjogIkp1aXN0ISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJEZXplIHRla3N0IHdvcmR0IGdlYnJ1aWt0IG9tIGFhbiB0ZSBnZXZlbiBkYXQgZWVuIGFudHdvb3JkIGp1aXN0IGlzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0IHZvb3Igb25qdWlzdCBhbnR3b29yZCIsCiAgICAgICJkZWZhdWx0IjogIk9uanVpc3QhIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkRlemUgdGVrc3Qgd29yZHQgZ2VicnVpa3Qgb20gYWFuIHRlIGdldmVuIGRhdCBlZW4gYW50d29vcmQgb25qdWlzdCBpcyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdCB2b29yIG9udGJyZWtlbmQgYW50d29vcmQiLAogICAgICAiZGVmYXVsdCI6ICJOaWV0IGdldm9uZGVuISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJEZXplIHRla3N0IHdvcmR0IGdlYnJ1aWt0IG9tIGFhbiB0ZSBnZXZlbiBkYXQgZWVuIGFudHdvb3JkIG9udGJyZWVrdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZXNjaHJpanZpbmcgdm9vciBkZSB3ZWVyZ2F2ZSB2YW4gZGUgb3Bsb3NzaW5nIiwKICAgICAgImRlZmF1bHQiOiAiRGUgdGFhayBpcyBiaWpnZXdlcmt0IGVuIGJldmF0IG51IG9vayBkZSBvcGxvc3NpbmcuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkRlemUgdGVrc3QgdmVydGVsdCBkZSBnZWJydWlrZXIgZGF0IGRlIHRha2VuIHppam4gYmlqZ2V3ZXJrdCBlbiBudSBvb2sgZGUgb3Bsb3NzaW5nIGJldmF0dGVuLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdHVlbGUgd2VlcmdhdmUgdmFuIGRlIHNjb3JlYmFsayB2b29yIGRlZ2VuZSBkaWUgZWVuIHNjaGVybWxlemVyIGdlYnJ1aWtlbiIsCiAgICAgICJkZWZhdWx0IjogIkplIGhlYnQgOm51bSB2YW4gZGUgOnRvdGFsIHB1bnRlbiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJMYWJlbCB2b29yIGRlIHZvbGxlZGlnZSwgbGVlc2JhcmUgdGVrc3Qgdm9vciBvbmRlcnN0ZXVuZW5kZSB0ZWNobm9sb2dpZcOrbiIsCiAgICAgICJkZWZhdWx0IjogIlZvbGxlZGlnIGxlZXNiYXJlIHRla3N0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkxhYmVsIHZvb3IgZGUgdGVrc3Qgd2FhcmluIHdvb3JkZW4ga3VubmVuIHdvcmRlbiBnZW1hcmtlZXJkIHZvb3Igb25kZXJzdGV1bmVuZGUgdGVjaG5vbG9naWXDq24iLAogICAgICAiZGVmYXVsdCI6ICJWb2xsZWRpZ2UgdGVrc3Qgd2FhcmluIHdvb3JkZW4ga3VubmVuIHdvcmRlbiBnZW1hcmtlZXJkIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIktvcHRla3N0IHZvb3Igb3Bsb3NzaW5nc21vZHVzIHZvb3Igb25kZXJzdGV1bmVuZGUgdGVjaG5vbG9naWXDq24iLAogICAgICAiZGVmYXVsdCI6ICJPcGxvc3NpbmdzbW9kdXMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiS29wdGVrc3Qgdm9vciBjb250cm9sZW1vZHVzIHZvb3Igb25kZXJzdGV1bmVuZGUgdGVjaG5vbG9naWXDq24iLAogICAgICAiZGVmYXVsdCI6ICJDb250cm9sZW1vZHVzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk9uZGVyc3RldW5lbmRlIHRlY2hub2xvZ2llIGJlc2NocmlqdmluZyB2b29yIFwiQ29udHJvbGVlclwiLWtub3AiLAogICAgICAiZGVmYXVsdCI6ICJDb250cm9sZWVyIGRlIGFudHdvb3JkZW4uIERlIGFudHdvb3JkZW4gd29yZGVuIGdlbWFya2VlcmQgYWxzIGp1aXN0LCBvbmp1aXN0LCBvZiBuaWV0LWJlYW50d29vcmQuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk9uZGVyc3RldW5lbmRlIHRlY2hub2xvZ2llIGJlc2NocmlqdmluZyB2b29yIFwiVG9vbiBvcGxvc3NpbmdcIi1rbm9wIiwKICAgICAgImRlZmF1bHQiOiAiVG9vbiBkZSBvcGxvc3NpbmcuIERlIHRhYWsgemFsIHdvcmRlbiBnZW1hcmtlZXJkIG1ldCBkZSBqdWlzdGUgb3Bsb3NzaW5nLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJPbmRlcnN0ZXVuZW5kZSB0ZWNobm9sb2dpZSBiZXNjaHJpanZpbmcgdm9vciBcIk9wbmlldXdcIi1rbm9wIiwKICAgICAgImRlZmF1bHQiOiAiUHJvYmVlciBkZSB0YWFrIG9wbmlldXcuIFJlc2V0IGFsbGUgYW50d29vcmRlbiBlbiBzdGFydCBkZSB0YWFrIG9wbmlldXcuIgogICAgfQogIF0KfQo="],"libraries\/H5P.MarkTheWords-1.11\/language\/nn.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJNZWRpZWVsZW1lbnQiLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJUeXBlIiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJWYWxmcml0dCBtZWRpZWVsZW1lbnQuIEVsZW1lbnRldCB2aWwgYmxpIHBsYXNzZXJ0IG92ZXIgc3DDuHJzbcOlbGV0LiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJEZWFrdGl2ZXIgem9vbWluZ2Z1bmtzam9uLiIKICAgICAgICB9CiAgICAgIF0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJPcHBnw6V2ZWJlc2tyaXZpbmciLAogICAgICAiZGVzY3JpcHRpb24iOiAiRm9ya2xhciBodm9yZGFuIGJydWtlcmVuIHNrYWwgbMO4eXNlIG9wcGfDpXZhLiIsCiAgICAgICJwbGFjZWhvbGRlciI6ICJDbGljayBvbiBhbGwgdGhlIHZlcmJzIGluIHRoZSB0ZXh0IHRoYXQgZm9sbG93cy4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3RsaW5lciIsCiAgICAgICJwbGFjZWhvbGRlciI6ICJPc2xvIGVyIGhvdnVkc3RhZGVuIGkgKk5vcmVnKiIsCiAgICAgICJpbXBvcnRhbnQiOiB7CiAgICAgICAgImRlc2NyaXB0aW9uIjogIjx1bD48bGk+TWFya2VkIHdvcmRzIGFyZSBhZGRlZCB3aXRoIGFuIGFzdGVyaXNrICgqKS48L2xpPjxsaT5Bc3Rlcmlza3MgY2FuIGJlIGFkZGVkIHdpdGhpbiBtYXJrZWQgd29yZHMgYnkgYWRkaW5nIGFub3RoZXIgYXN0ZXJpc2ssICpjb3JyZWN0d29yZCoqKiA9Jmd0OyBjb3JyZWN0d29yZCouPC9saT48L3VsPiIsCiAgICAgICAgImV4YW1wbGUiOiAiVGhlIGNvcnJlY3Qgd29yZHMgYXJlIG1hcmtlZCBsaWtlIHRoaXM6ICpjb3JyZWN0d29yZCosIGFuIGFzdGVyaXNrIGlzIHdyaXR0ZW4gbGlrZSB0aGlzOiAqY29ycmVjdHdvcmQqKiouIgogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGlsYmFrZW1lbGRpbmcgcMOlIGhlaWxlIG9wcGfDpXZhIiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAid2lkZ2V0cyI6IFsKICAgICAgICAgICAgewogICAgICAgICAgICAgICJsYWJlbCI6ICJGw7hyZWhhbmRzaW5uc3RpbGxpbmciCiAgICAgICAgICAgIH0KICAgICAgICAgIF0sCiAgICAgICAgICAibGFiZWwiOiAiT3BwcmV0dCBwb2VuZ29tcsOlZGUgb2cgbGVnZyBpbm4gdGlsYmFrZW1lbGRpbmdhci4iLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIktsaWtrIHDDpSBrbmFwcGVuIFwiTGVnZyB0aWwgcG9lbmdvbXLDpWRlXCIgb2cgbGVnZyB0aWwgc8OlIG1hbmdlIHBvZW5nb21yw6VkZSBkdSB0cmVuZy4gRMO4bWU6IDDigJM0MCAlIFN2YWt0IHJlc3VsdGF0LCA0MeKAkzgwICUgR2plbm5vbXNuaXR0bGVnIHJlc3VsdGF0LCA4MeKAkzEwMCAlIEZsb3R0IHJlc3VsdGF0ISIsCiAgICAgICAgICAiZW50aXR5IjogIk9tcsOlZGUiLAogICAgICAgICAgImZpZWxkIjogewogICAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJQb2VuZ29tcsOlZGUiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7fSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiVGlsYmFrZW1lbGRpbmcgZm9yIGRlZmluZXJ0IHBvZW5nb21yw6VkZSIsCiAgICAgICAgICAgICAgICAicGxhY2Vob2xkZXIiOiAiU2tyaXYgaW5uIHRpbGJha2VtZWxkaW5nLiIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICB9CiAgICAgIF0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdCBmb3IgXCJTamVra1wiLWtuYXBwIiwKICAgICAgImRlZmF1bHQiOiAiU2pla2siCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJTdWJtaXRcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJTdWJtaXQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJSZXRyeVwiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlJldHJ5IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0IGZvciBcIkZhc2l0XCIga25hcHAiLAogICAgICAiZGVmYXVsdCI6ICJGYXNpdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbm5zdGlsbGluZ2VyIGZvciBvcHBnYXZlLcOldGZlcmQiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRGlzc2UgaW5zdGlsbGluZ2VuZSBsYXIgZGVnIGJlc3RlbW1lIGh2b3JkYW4gb3BwZ2F2ZXR5cGVuIHNrYWwgb3BwZsO4cmUgc2VnLiIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkFrdGl2ZXIgXCJQcsO4diBpZ2plblwiLWtuYXBwIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkFrdGl2ZXIgXCJGYXNpdFwiIGtuYXBwIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkVuYWJsZSBcIkNoZWNrXCIgYnV0dG9uIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIlNob3cgc2NvcmUgcG9pbnRzIiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJTaG93IHBvaW50cyBlYXJuZWQgZm9yIGVhY2ggYW5zd2VyLiIKICAgICAgICB9CiAgICAgIF0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJSaWt0aWcgc3ZhciB0ZWtzdCIsCiAgICAgICJkZWZhdWx0IjogIlJpa3RpZyEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB1c2VkIHRvIGluZGljYXRlIHRoYXQgYW4gYW5zd2VyIGlzIGNvcnJlY3QiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRmVpbCBzdmFyIHRla3N0IiwKICAgICAgImRlZmF1bHQiOiAiRmVpbCEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB1c2VkIHRvIGluZGljYXRlIHRoYXQgYW4gYW5zd2VyIGlzIGluY29ycmVjdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJNYW5nbGVyIHN2YXIgdGVrc3QiLAogICAgICAiZGVmYXVsdCI6ICJNYW5nbGFyISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHVzZWQgdG8gaW5kaWNhdGUgdGhhdCBhbiBhbnN3ZXIgaXMgbWlzc2luZyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZXNrcml2ZWxzZSBmb3IgVmlzIEzDuHNuaW5nIiwKICAgICAgImRlZmF1bHQiOiAiT3BwZ8OldmEgZXIgb3BwZGF0ZXJ0IHRpbCDDpSBpbm5laGFsZGUgZmFzaXRlbi4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGhpcyB0ZXh0IHRlbGxzIHRoZSB1c2VyIHRoYXQgdGhlIHRhc2tzIGhhcyBiZWVuIHVwZGF0ZWQgd2l0aCB0aGUgc29sdXRpb24uIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHR1YWwgcmVwcmVzZW50YXRpb24gb2YgdGhlIHNjb3JlIGJhciBmb3IgdGhvc2UgdXNpbmcgYSByZWFkc3BlYWtlciIsCiAgICAgICJkZWZhdWx0IjogIllvdSBnb3QgOm51bSBvdXQgb2YgOnRvdGFsIHBvaW50cyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJMYWJlbCBmb3IgdGhlIGZ1bGwgcmVhZGFibGUgdGV4dCBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIkZ1bGxzdGVuZGlnIGxlc2JhciB0ZWtzdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJMYWJlbCBmb3IgdGhlIHRleHQgd2hlcmUgd29yZHMgY2FuIGJlIG1hcmtlZCBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIkZ1bGxzdGVuZGlnIHRla3N0IGRlciBvcmQga2FuIGJsaSBtYXJrZXJ0ZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJTb2x1dGlvbiBtb2RlIGhlYWRlciBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIkzDuHlzaW5nc21vZHVzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNoZWNraW5nIG1vZGUgaGVhZGVyIGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiU2pla2stbW9kdXMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQXNzaXN0aXZlIHRlY2hub2xvZ3kgZGVzY3JpcHRpb24gZm9yIFwiQ2hlY2tcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJDaGVjayB0aGUgYW5zd2Vycy4gVGhlIHJlc3BvbnNlcyB3aWxsIGJlIG1hcmtlZCBhcyBjb3JyZWN0LCBpbmNvcnJlY3QsIG9yIHVuYW5zd2VyZWQuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFzc2lzdGl2ZSB0ZWNobm9sb2d5IGRlc2NyaXB0aW9uIGZvciBcIlNob3cgU29sdXRpb25cIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJTaG93IHRoZSBzb2x1dGlvbi4gVGhlIHRhc2sgd2lsbCBiZSBtYXJrZWQgd2l0aCBpdHMgY29ycmVjdCBzb2x1dGlvbi4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQXNzaXN0aXZlIHRlY2hub2xvZ3kgZGVzY3JpcHRpb24gZm9yIFwiUmV0cnlcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJSZXRyeSB0aGUgdGFzay4gUmVzZXQgYWxsIHJlc3BvbnNlcyBhbmQgc3RhcnQgdGhlIHRhc2sgb3ZlciBhZ2Fpbi4iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.MarkTheWords-1.11\/language\/pl.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJNZWRpYSIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIlR5cCIsCiAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiT3Bjam9uYWxuZSB6ZGrEmWNpZSBsdWIgd2lkZW8gcG9uYWQgdHJlxZtjacSFIHB5dGFuaWEuIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIlphYmxva3VqIG1vxbxsaXdvxZvEhyBwb3dpxJlrc3phbmlhIHpkasSZY2lhIgogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk9waXMgemFkYW5pYSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJPcGlzeiBqYWsgdcW8eXRrb3duaWsgcG93aW5pZW4gcm96d2nEhXphxIcgemFkYW5pZS4iLAogICAgICAicGxhY2Vob2xkZXIiOiAiS2xpa25paiB3c3p5c3RraWUgY3phc293bmlraSB3IHRla8WbY2llLCBrdMOzcnkgem9zdGFuaWUgd3nFm3dpZXRsb255LiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJQb2xlIHRla3N0b3dlIiwKICAgICAgInBsYWNlaG9sZGVyIjogIlRvIGplc3Qgb2Rwb3dpZWTFujogKm9kcG93aWVkxboqLiIsCiAgICAgICJpbXBvcnRhbnQiOiB7CiAgICAgICAgImRlc2NyaXB0aW9uIjogIjx1bD48bGk+WmF6bmFjem9uZSBzxYJvd2Egc8SFIGRvZGF3YW5lIHphIHBvbW9jxIUgZ3dpYXpka2kgKCopLjwvbGk+PGxpPkd3aWF6ZGtpIG1vxbxuYSBkb2Rhd2HEhyB3IHphem5hY3pvbnljaCBzxYJvd2FjaCBwb3ByemV6IGRvZGFuaWUga29sZWpuZWogZ3dpYXpka2ksICpjb3JyZWN0d29yZCoqKiA9Jmd0OyBjb3JyZWN0d29yZCouPC9saT48L3VsPiIsCiAgICAgICAgImV4YW1wbGUiOiAiV8WCYcWbY2l3ZSBzxYJvd2Egc8SFIHphem5hY3pvbmUgdyB0ZW4gc3Bvc8OzYjogKmNvcnJlY3R3b3JkKiwgZ3dpYXpka2EgamVzdCB6YXBpc2FuYSB3IHRlbiBzcG9zw7NiOiAqY29ycmVjdHdvcmQqKiouIgogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiT2fDs2xuYSBpbmZvcm1hY2phIHp3cm90bmEiLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJ3aWRnZXRzIjogWwogICAgICAgICAgICB7CiAgICAgICAgICAgICAgImxhYmVsIjogIkRvbXnFm2xueSIKICAgICAgICAgICAgfQogICAgICAgICAgXSwKICAgICAgICAgICJsYWJlbCI6ICJaZGVmaW5pdWogbmllc3RhbmRhcmRvd2UgaW5mb3JtYWNqZSB6d3JvdG5lIGRsYSBkb3dvbG5lZ28gemFrcmVzdSB3eW5pa8OzdyIsCiAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiS2xpa25paiBwcnp5Y2lzayBcIkRvZGFqIHpha3Jlc1wiIGFieSBkb2RhxIcgdHlsZSB6YWtyZXPDs3csIGlsZSBwb3RyemVidWplc3ouIFByenlrxYJhZDogMC0yMCUgWsWCeSB3eW5paywgMjEtOTElIFByemVjacSZdG55IHd5bmlrLCA5MS0xMDAlIMWad2lldG55IHd5bmlrISIsCiAgICAgICAgICAiZW50aXR5IjogInpha3JlcyIsCiAgICAgICAgICAiZmllbGQiOiB7CiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlpha3JlcyB3eW5pa8OzdyIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHt9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJJbmZvcm1hY2phIHp3cm90bmEgZGxhIHpkZWZpbmlvd2FuZWdvIHpha3Jlc3Ugd3luaWvDs3ciLAogICAgICAgICAgICAgICAgInBsYWNlaG9sZGVyIjogIlV6dXBlxYJuaWogaW5mb3JtYWNqxJkgendyb3RuxIUiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3QgcHJ6eWNpc2t1IFwiU3ByYXdkxbpcIiIsCiAgICAgICJkZWZhdWx0IjogIlNwcmF3ZMW6IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0IHByenljaXNrdSBcIld5xZtsaWpcIiIsCiAgICAgICJkZWZhdWx0IjogIlN1Ym1pdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdCBwcnp5Y2lza3UgXCJTcHLDs2J1aiBwb25vd25pZVwiIiwKICAgICAgImRlZmF1bHQiOiAiU3Byw7NidWogcG9ub3duaWUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3QgcHJ6eWNpc2t1IFwiUG9rYcW8IHJvendpxIV6YW5pZVwiIiwKICAgICAgImRlZmF1bHQiOiAiUG9rYcW8IHJvendpxIV6YW5pZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJVc3Rhd2llbmlhIGRvdHljesSFY2UgemFjaG93YW5pYS4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGUgb3BjamUgcG96d29sxIUgQ2kga29udHJvbG93YcSHIHphY2hvd2FuaWUgemFkYW5pYS4iLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJXxYLEhWN6IG9wY2rEmSBcIlNwcsOzYnVqIHBvbm93bmllXCIiCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiV8WCxIVjeiBwcnp5Y2lzayBcIlBva2HFvCByb3p3acSFemFuaWVcIiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJXxYLEhWN6IHByenljaXNrIFwiU3ByYXdkxbpcIiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJQb2thxbwgemRvYnl0ZSBwdW5rdHkiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIlBva2HFvCBwdW5rdHkgemRvYnl0ZSB6YSBrYcW8ZMSFIG9kcG93aWVkxbouIgogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRla3N0IHByYXdpZMWCb3dlaiBvZHBvd2llZHppIiwKICAgICAgImRlZmF1bHQiOiAiT2Rwb3dpZWTFuiBwcmF3aWTFgm93YSEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGVrc3Qgd3NrYXp1asSFY3kgcG9wcmF3bm\/Fm8SHIG9kcG93aWVkemkiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGVrc3Qgb2Rwb3dpZWR6aSBixYLEmWRuZWoiLAogICAgICAiZGVmYXVsdCI6ICJPZHBvd2llZMW6IG5pZXByYXdpZMWCb3dhISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZWtzdCB3c2thenVqxIVjeSBuaWVwcmF3aWTFgm93b8WbxIcgb2Rwb3dpZWR6aSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdCBicmFrdWrEhWNlaiBvZHBvd2llZHppIiwKICAgICAgImRlZmF1bHQiOiAiT2Rwb3dpZWTFuiBuaWUgem9zdGHFgmEgem5hbGV6aW9uYSEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGVrc3QgdcW8eXR5IGRvIHdza2F6YW5pYSwgxbxlIGJyYWt1amUgb2Rwb3dpZWR6aSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJPcGlzIGRsYSB3ecWbd2lldGxlbmlhIHJvendpxIV6YW5pYSIsCiAgICAgICJkZWZhdWx0IjogIlphZGFuaWUgem9zdGHFgm8gemFrdHVhbGl6b3dhbmUgbyByb3p3acSFemFuaWUuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRlbiB0ZWtzdCBpbmZvcm11amUgdcW8eXRrb3duaWthLCDFvGUgemFkYW5pYSB6b3N0YcWCeSB6YWt0dWFsaXpvd2FuZSBwcnp5IHXFvHljaXUgcm96d2nEhXphbmlhLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZWtzdG93eSBvZHBvd2llZG5payBwdW5rdGFjamkgZGxhIG9zw7NiIHXFvHl3YWrEhWN5Y2ggc3ludGV6YXRvcmEgbW93eSIsCiAgICAgICJkZWZhdWx0IjogIk90cnp5bXVqZXN6IDpudW0geiA6dG90YWwgcHVua3TDs3ciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRXR5a2lldGEgdGVrc3R1IHcgY2HFgm\/Fm2NpIGRvIG9kY3p5dHUgcHJ6ZXogdGVjaG5vbG9naWUgd3Nwb21hZ2FqxIVjZSIsCiAgICAgICJkZWZhdWx0IjogIlcgY2HFgm\/Fm2NpIGRvIG9kY3p5dHUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRXR5a2lldGEgdGVrc3R1IHcga3TDs3J5bSBzxYJvd2EgbW9nxIUgem9zdGHEhyB6YXpuYWN6b25lIHByemV6IHRlY2hub2xvZ2llIHdzcG9tYWdhasSFY2UiLAogICAgICAiZGVmYXVsdCI6ICJLb21wbGV0bnkgdGVrc3QgdyBrdMOzcnltIG1vxbxuYSB6YXpuYWN6ecSHIHPFgm93YSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJOYWfFgsOzd2VrIHRyeWJ1IHJvendpxIV6YW5pYSBkbGEgdGVjaG5vbG9naWkgd3Nwb21hZ2FqxIVjeWNoIiwKICAgICAgImRlZmF1bHQiOiAiVHJ5YiByb3p3acSFemFuaWEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTmFnxYLDs3dlayB0cnlidSBzcHJhd2R6YW5pYSBkbGEgdGVjaG5vbG9naWkgd3Nwb21hZ2FqxIVjeWNoIiwKICAgICAgImRlZmF1bHQiOiAiVHJ5YiBzcHJhd2R6YW5pYSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJPcGlzIHByenljaXNrdSBcIlNwcmF3ZMW6XCIgZGxhIHRlY2hub2xvZ2lpIHdzcG9tYWdhasSFY3ljaCIsCiAgICAgICJkZWZhdWx0IjogIlNwcmF3ZMW6IG9kcG93aWVkemkuIE9kcG93aWVkemkgem9zdGFuxIUgb3puYWN6b25lIGpha28gcHJhd2lkxYJvd2UsIGLFgsSZZG5lIGx1YiBiZXogb2Rwb3dpZWR6aS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiT3BpcyB0ZWNobm9sb2dpaSB3c3BvbWFnYWrEhWNlaiBkbGEgcHJ6eWNpc2t1IFwiUG9rYcW8IHJvendpxIV6YW5pZVwiIiwKICAgICAgImRlZmF1bHQiOiAiUG9rYcW8IHJvendpxIV6YW5pZS4gWmFkYW5pZSB6b3N0YW5pZSBvem5hY3pvbmUgcG9wcmF3bnltIHJvendpxIV6YW5pZW0uIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk9waXMgdGVjaG5vbG9naWkgd3Nwb21hZ2FqxIVjZWogZGxhIHByenljaXNrdSBcIlNwcsOzYnVqIHBvbm93bmllXCIiLAogICAgICAiZGVmYXVsdCI6ICJTcHLDs2J1aiBwb25vd25pZSB3eWtvbmHEhyB6YWRhbmllLiBacmVzZXR1aiB3c3p5c3RraWUgb2Rwb3dpZWR6aSBpIHJvenBvY3puaWogemFkYW5pZSBvZCBub3dhLiIKICAgIH0KICBdCn0K"],"libraries\/H5P.MarkTheWords-1.11\/language\/pt-br.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJNw61kaWEiLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJUaXBvIiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJNw61kaWEgb3BjaW9uYWwgcGFyYSBleGliaXIgYWNpbWEgZGEgcGVyZ3VudGEuIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkRlc2F0aXZhciBvIHpvb20gZGEgaW1hZ2VtIgogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkRlc2NyacOnw6NvIGRhIHRhcmVmYSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJEZXNjcmV2YSBjb21vIG8gdXN1w6FyaW8gZGV2ZSByZXNvbHZlciBhIHRhcmVmYS4iLAogICAgICAicGxhY2Vob2xkZXIiOiAiQ2xpcXVlIGVtIHRvZG9zIG9zIHZlcmJvcyBubyB0ZXh0byBhIHNlZ3Vpci4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2FtcG8gZGUgdGV4dG8iLAogICAgICAicGxhY2Vob2xkZXIiOiAiRXN0YSDDqSB1bWEgcmVzcG9zdGE6ICphbnN3ZXIqLiIsCiAgICAgICJpbXBvcnRhbnQiOiB7CiAgICAgICAgImRlc2NyaXB0aW9uIjogIjx1bD48bGk+UGFsYXZyYXMgbWFyY2FkYXMgc8OjbyBhZGljaW9uYWRhcyBjb20gdW0gYXN0ZXJpc2NvKCopLjwvbGk+PGxpPkFzdGVyaXNjb3MgcG9kZW0gc2VyIGFkaWNpb25hZG9zIGp1bnRvIMOgcyBwYWxhdnJhcyBtYXJjYWRhcyBhZGljaW9uYW5kbyBvdXRybyBhc3RlcmlzY28sICpwYWxhdnJhY29ycmV0YSoqKiA9Jmd0OyBwYWxhdnJhY29ycmV0YSouPC9saT48L3VsPiIsCiAgICAgICAgImV4YW1wbGUiOiAiQXMgcGFsYXZyYXMgY29ycmV0YXMgc8OjbyBtYXJjYWRhcyBkZXN0YSBtYW5laXJhOiAqcGFsYXZyYSBjb3JyZXRhKiwgZSB1bSBhc3RlcmlzY28gcG9kZSBzZXIgZXNjcml0byBkYSBzZWd1aW50ZSBtYW5laXJhOiAqcGFsYXZyYWNvcnJldGEqKiouIgogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRmVlZGJhY2sgR2VyYWwiLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJ3aWRnZXRzIjogWwogICAgICAgICAgICB7CiAgICAgICAgICAgICAgImxhYmVsIjogIlBhZHLDo28iCiAgICAgICAgICAgIH0KICAgICAgICAgIF0sCiAgICAgICAgICAibGFiZWwiOiAiRGVmaW5pciBmZWVkYmFjayBwZXJzb25hbGl6YWRvIHBhcmEgcXVhbHF1ZXIgZmFpeGEgZGUgcG9udHVhw6fDo28iLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIkNsaXF1ZSBubyBib3TDo28gXCJBZGljaW9uYXIgZmFpeGFcIiBwYXJhIGFkaWNpb25hciBxdWFudG9zIGludGVydmFsb3Mgdm9jw6ogcHJlY2lzYXIuIEV4ZW1wbG86IDAtMjAlIFBvbnR1YcOnw6NvIFJ1aW0sIDIxLTkxJSBQb250dWHDp8OjbyBNw6lkaWEsIDkxLTEwMCUgUG9udHVhw6fDo28gw5N0aW1hISIsCiAgICAgICAgICAiZW50aXR5IjogImZhaXhhIiwKICAgICAgICAgICJmaWVsZCI6IHsKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiRmFpeGEgZGUgUG9udHVhw6fDo28iCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7fSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiRmVlZGJhY2sgcGFyYSBhIGZhaXhhIGRlIHBvbnR1YcOnw6NvIGRlZmluaWRhIiwKICAgICAgICAgICAgICAgICJwbGFjZWhvbGRlciI6ICJQcmVlbmNoYSBvIGZlZWRiYWNrIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIGRvIGJvdMOjbyBcIlZlcmlmaWNhciBcIiIsCiAgICAgICJkZWZhdWx0IjogIlZlcmlmaWNhciIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBkbyBib3TDo28gXCJFbnZpYXJcIiIsCiAgICAgICJkZWZhdWx0IjogIkVudmlhciIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIG8gYm90w6NvIFwiVGVudGFyIE5vdmFtZW50ZVwiIiwKICAgICAgImRlZmF1bHQiOiAiVGVudGFyIE5vdmFtZW50ZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIG8gYm90w6NvIFwiTW9zdHJhciBzb2x1w6fDo29cIiIsCiAgICAgICJkZWZhdWx0IjogIk1vc3RyYXIgc29sdcOnw6NvIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNvbmZpZ3VyYcOnw7VlcyBjb21wb3J0YW1lbnRhaXMuIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkVzdGFzIG9ww6fDtWVzIHBlcm1pdGlyw6NvIHF1ZSB2b2PDqiBjb250cm9sZSBjb21vIGEgdGFyZWZhIHNlIGNvbXBvcnRhLiIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkF0aXZhciBvIGJvdMOjbyBcIlRlbnRhciBOb3ZhbWVudGVcIiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJBdGl2YXIgbyBib3TDo28gXCJNb3N0cmFyIHNvbHXDp8Ojb1wiIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkF0aXZhciBvIGJvdMOjbyBcIlZlcmlmaWNhclwiIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIk1vc3RyYXIgcG9udHVhw6fDo28iLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIk1vc3RyYXIgcG9udG9zIGdhbmhvcyBwYXJhIGNhZGEgcmVzcG9zdGEuIgogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgcmVzcG9zdGEgY29ycmV0YSIsCiAgICAgICJkZWZhdWx0IjogIkNvcnJldG8hIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHRvIHVzYWRvIHBhcmEgaW5kaWNhciBxdWUgdW1hIHJlc3Bvc3RhIGVzdMOhIGNvcnJldGEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSByZXNwb3N0YSBpbmNvcnJldGEiLAogICAgICAiZGVmYXVsdCI6ICJJbmNvcnJldG8hIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHRvIHVzYWRvIHBhcmEgaW5kaWNhciBxdWUgdW1hIHJlc3Bvc3RhIGVzdMOhIGluY29ycmV0YSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIHF1ZXN0w6NvIG7Do28gcmVzcG9uZGlkYSIsCiAgICAgICJkZWZhdWx0IjogIlF1ZXN0w6NvIG7Do28gcmVzcG9uZGlkYSEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dG8gdXNhZG8gcGFyYSBpbmRpY2FyIHF1ZSBhIHF1ZXN0w6NvIG7Do28gZm9pIHJlc3BvbmRpZGEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRGVzY3Jpw6fDo28gcGFyYSBTb2x1w6fDo28gZGUgVmlzdWFsaXphw6fDo28iLAogICAgICAiZGVmYXVsdCI6ICJBIHRhcmVmYSBlc3TDoSBhdHVhbGl6YWRhIGNvbSBhIHNvbHXDp8Ojby4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiRXN0ZSB0ZXh0byBpbmZvcm1hIGFvIHVzdcOhcmlvIHF1ZSBhIHRhcmVmYSBmb2kgYXR1YWxpemFkYSBjb20gYSBzb2x1w6fDo28uIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlJlcHJlc2VudGHDp8OjbyB0ZXh0dWFsIGRhIGJhcnJhIGRlIHBvbnR1YcOnw6NvIHBhcmEgYXF1ZWxlcyBxdWUgdXRpbGl6YW0gdW0gbGVpdG9yIGRlIHRlbGEiLAogICAgICAiZGVmYXVsdCI6ICJWb2PDqiBjb25zZWd1aXUgOm51bSBkZSA6dG90YWwgcG9udG9zIHBvc3PDrXZlaXMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUsOzdHVsbyBwYXJhIG8gdGV4dG8gbGVnw612ZWwgY29tcGxldG8gcGFyYSB0ZWNub2xvZ2lhcyBkZSBhc3Npc3TDqm5jaWEiLAogICAgICAiZGVmYXVsdCI6ICJUZXh0byBsZWfDrXZlbCBjb21wbGV0byIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJSw7N0dWxvIGRhcyB0ZWNub2xvZ2lhcyBkZSBhc3Npc3TDqm5jaWEgcGFyYSBvIHRleHRvIG9uZGUgYXMgcGFsYXZyYXMgcG9kZW0gc2VyIG1hcmNhZGFzIiwKICAgICAgImRlZmF1bHQiOiAiVGV4dG8gY29tcGxldG8gb25kZSBhcyBwYWxhdnJhcyBwb2RlbSBzZXIgbWFyY2FkYXMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2FiZcOnYWxobyBkbyBtb2RvIGRlIHNvbHXDp8OjbyBwYXJhIHRlY25vbG9naWFzIGRlIGFzc2lzdMOqbmNpYSIsCiAgICAgICJkZWZhdWx0IjogIk1vZG8gU29sdcOnw6NvIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNhYmXDp2FsaG8gZG8gbW9kbyBkZSB2ZXJpZmljYcOnw6NvIGRlIHRlY25vbG9naWFzIGRlIGFzc2lzdMOqbmNpYSIsCiAgICAgICJkZWZhdWx0IjogIk1vZG8gZGUgdmVyaWZpY2HDp8OjbyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZXNjcmnDp8OjbyBkYSB0ZWNub2xvZ2lhIGRlIGFzc2lzdMOqbmNpYSBwYXJhIG8gYm90w6NvIFwiVmVyaWZpY2FyXCIiLAogICAgICAiZGVmYXVsdCI6ICJWZXJpZmlxdWUgYXMgcmVzcG9zdGFzLiBBcyByZXNwb3N0YXMgc2Vyw6NvIG1hcmNhZGFzIGNvbW8gY29ycmV0YXMsIGluY29ycmV0YXMsIG91IHNlbSByZXNwb3N0YS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRGVzY3Jpw6fDo28gZGEgdGVjbm9sb2dpYSBhc3Npc3RpdmEgcGFyYSBvIGJvdMOjbyBcIk1vc3RyYXIgU29sdcOnw6NvXCIiLAogICAgICAiZGVmYXVsdCI6ICJNb3N0cmFyIGEgc29sdcOnw6NvLiBBIHRhcmVmYSBzZXLDoSBtYXJjYWRhIGNvbSBzdWEgc29sdcOnw6NvIGNvcnJldGEuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkRlc2NyacOnw6NvIGRhIHRlY25vbG9naWEgZGUgYXNzaXN0w6puY2lhIHBhcmEgbyBib3TDo28gXCJUZW50YXIgTm92YW1lbnRlXCIiLAogICAgICAiZGVmYXVsdCI6ICJUZW50ZSByZWFsaXphciBhIHRhcmVmYSBub3ZhbWVudGUuIFJlaW5pY2lhbGl6ZSB0b2RhcyBhcyByZXNwb3N0YXMgZSByZWNvbWVjZS4iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.MarkTheWords-1.11\/language\/pt.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJNw61kaWEiLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJUaXBvIiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJNw61kaWEgb3BjaW9uYWwgcGFyYSBleGliaXIgYWNpbWEgZGEgcGVyZ3VudGEuIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkRlc2FjdGl2YXIgbyB6b29tIGRhIGltYWdlbSIKICAgICAgICB9CiAgICAgIF0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZXNjcmnDp8OjbyBkYSB0YXJlZmEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRGVzY3JldmEgYSBmb3JtYSBjb21vIG8gdXRpbGl6YWRvciBkZXZlIGNvbXBsZXRhciBhIGF0aXZpZGFkZS4iLAogICAgICAicGxhY2Vob2xkZXIiOiAiQ2xpcXVlIGVtIHRvZG9zIG9zIHZlcmJvcyBubyB0ZXh0byBhcHJlc2VudGFkbyBhIHNlZ3Vpci4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2FtcG8gZGUgdGV4dG8iLAogICAgICAicGxhY2Vob2xkZXIiOiAiSXN0byDDqSB1bWEgcmVzcG9zdGE6ICphbnN3ZXIqLiIsCiAgICAgICJpbXBvcnRhbnQiOiB7CiAgICAgICAgImRlc2NyaXB0aW9uIjogIjx1bD48bGk+QXMgcGFsYXZyYXMgYSBhc3NpbmFsYXIgc8OjbyBhZGljaW9uYWRhcyBjb20gdW0gYXN0ZXJpc2NvKCopLjwvbGk+PGxpPk9zIGFzdGVyaXNjb3MgcG9kZW0gc2VyIGFkaWNpb25hZG9zIMOgcyBwYWxhdnJhcyBhIGFzc2luYWxhciBhZGljaW9uYW5kbyBvdXRybyBhc3RlcmlzY28sICpwYWxhdnJhY29ycmV0YSoqKiA9Jmd0OyBwYWxhdnJhY29ycmV0YSouPC9saT48L3VsPiIsCiAgICAgICAgImV4YW1wbGUiOiAiQXMgcGFsYXZyYXMgY29ycmV0YXMgc8OjbyBtYXJjYWRhcyBkZXN0YSBtYW5laXJhOiAqcGFsYXZyYSBjb3JyZXRhKiBlIHVtIGFzdGVyaXNjbyBwb2RlIHNlciBlc2NyaXRvIGRhIHNlZ3VpbnRlIG1hbmVpcmE6ICpwYWxhdnJhY29ycmV0YSoqKi4iCiAgICAgIH0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJGZWVkYmFjayBnbG9iYWwiLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJ3aWRnZXRzIjogWwogICAgICAgICAgICB7CiAgICAgICAgICAgICAgImxhYmVsIjogIlBhZHLDo28iCiAgICAgICAgICAgIH0KICAgICAgICAgIF0sCiAgICAgICAgICAibGFiZWwiOiAiRGVmaW5hIG8gZmVlZGJhY2sgcGVyc29uYWxpemFkbyBwYXJhIHF1YWxxdWVyIGZhaXhhIGRlIHBvbnR1YcOnw6NvIiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJDbGlxdWUgZW0gXCJBZGljaW9uYXIgZmFpeGFcIiBlIGFkaWNpb25lIHF1YW50YXMgZmFpeGFzIGZvcmVtIG5lY2Vzc8Ohcmlhcy4gRXhlbXBsbzogMC0yMCUgSW5zdWZpY2llbnRlLCAyMS05MSUgU3VmaWNpZW50ZSwgOTEtMTAwJSBFeGNlbGVudGUhIiwKICAgICAgICAgICJlbnRpdHkiOiAiZmFpeGEiLAogICAgICAgICAgImZpZWxkIjogewogICAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJGYWl4YSBkZSBwb250dWHDp8OjbyIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHt9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJGZWVkYmFjayBwYXJhIGRldGVybWluYWRhIGZhaXhhIGRlIHBvbnR1YcOnw6NvIiwKICAgICAgICAgICAgICAgICJwbGFjZWhvbGRlciI6ICJQcmVlbmNoYSBvIGZlZWRiYWNrIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRvIHBhcmEgbyBib3TDo28gXCJWZXJpZmljYXIgcmVzcG9zdGFcIiIsCiAgICAgICJkZWZhdWx0IjogIlZlcmlmaWNhciByZXNwb3N0YSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIG8gYm90w6NvIFwiVGVudGFyIG5vdmFtZW50ZVwiIiwKICAgICAgImRlZmF1bHQiOiAiVGVudGFyIG5vdmFtZW50ZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIG8gYm90w6NvIFwiTW9zdHJhciBzb2x1w6fDo29cIiIsCiAgICAgICJkZWZhdWx0IjogIk1vc3RyYXIgc29sdcOnw6NvIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNvbmZpZ3VyYcOnw7VlcyBnZXJhaXMuIiwKICAgICAgImRlZmF1bHQiOiAiTW9zdHJhciBzb2x1w6fDo28iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSByZXNwb3N0YSBjb3JyZXRhIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHRvIHV0aWxpemFkbyBwYXJhIGluZGljYXIgcXVlIGEgcmVzcG9zdGEgZXN0w6EgY29ycmV0YSIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkF0aXZhciBvIGJvdMOjbyBcIlRlbnRhciBub3ZhbWVudGVcIiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJBdGl2YXIgbyBib3TDo28gXCJNb3N0cmFyIHNvbHXDp8Ojb1wiIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkF0aXZhciBvIGJvdMOjbyBcIlZlcmlmaWNhciByZXNwb3N0YVwiIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIk1vc3RyYXIgcG9udHVhw6fDo28iLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIk1vc3RyYSBvcyBwb250b3Mgb2J0aWRvcyBlbSBjYWRhIHBlcmd1bnRhLiIKICAgICAgICB9CiAgICAgIF0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0byBwYXJhIHJlc3Bvc3RhIGluY29ycmV0YSIsCiAgICAgICJkZWZhdWx0IjogIkluY29ycmV0YSEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dG8gdXRpbGl6YWRvIHBhcmEgaW5kaWNhciBxdWUgYSByZXNwb3N0YSBlc3TDoSBpbmNvcnJldGEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dG8gcGFyYSBwZXJndW50YSBuw6NvIHJlc3BvbmRpZGEiLAogICAgICAiZGVmYXVsdCI6ICJQZXJndW50YSBuw6NvIHJlc3BvbmRpZGEhIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHRvIHV0aWxpemFkbyBwYXJhIGluZGljYXIgcXVlIGEgcGVyZ3VudGEgbsOjbyBmb2kgcmVzcG9uZGlkYSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJEZXNjcmnDp8OjbyBwYXJhIE1vc3RyYXIgc29sdcOnw6NvIiwKICAgICAgImRlZmF1bHQiOiAiQSBhdGl2aWRhZGUgZm9pIGF0dWFsaXphZGEgY29tIGEgc29sdcOnw6NvLiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0byB1dGlsaXphZG8gcGFyYSBpbmRpY2FyIHF1ZSBhIGF0aXZpZGFkZSBmb2kgYXR1YWxpemFkYSBjb20gYSBzb2x1w6fDo28uIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlJlcHJlc2VudGHDp8OjbyB0ZXh0dWFsIGRhIGJhcnJhIGRlIHBvbnR1YcOnw6NvIHBhcmEgYXF1ZWxlcyBxdWUgdXNhbSBsZWl0b3JlcyBkZSBlY3LDoyIsCiAgICAgICJkZWZhdWx0IjogIk9idGV2ZSA6bnVtIGRlIDp0b3RhbCBwb250b3MiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dG8gdXRpbGl6YWRvIHBhcmEgaW5kaWNhciBxdWUgYSB0YXJlZmEgZm9pIGF0dWFsaXphZGEgY29tIGEgc29sdcOnw6NvLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFdGlxdWV0YSBwYXJhIG8gdGV4dG8gbGVnw612ZWwgY29tcGxldG8gcGFyYSB0ZWNub2xvZ2lhcyBkZSBhY2Vzc2liaWxpZGFkZSIsCiAgICAgICJkZWZhdWx0IjogIlRleHRvIHRvdGFsbWVudGUgbGVnw612ZWwiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRXRpcXVldGEgcGFyYSBvIHRleHRvIG9uZGUgYXMgcGFsYXZyYXMgcG9kZW0gc2VyIG1hcmNhZGFzIHBhcmEgdGVjbm9sb2dpYXMgYXNzaXN0aXZhcyIsCiAgICAgICJkZWZhdWx0IjogIlRleHRvIGNvbXBsZXRvIG9uZGUgYXMgcGFsYXZyYXMgcG9kZW0gc2VyIG1hcmNhZGFzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNhYmXDp2FsaG8gZG8gbW9kbyBkZSBzb2x1w6fDo28gcGFyYSB0ZWNub2xvZ2lhcyBkZSBhY2Vzc2liaWxpZGFkZSIsCiAgICAgICJkZWZhdWx0IjogIk1vZG8gZGUgc29sdcOnw6NvIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNhYmXDp2FsaG8gZG8gbW9kbyBkZSB2ZXJpZmljYcOnw6NvIHBhcmEgdGVjbm9sb2dpYXMgZGUgYWNlc3NpYmlsaWRhZGUiLAogICAgICAiZGVmYXVsdCI6ICJNb2RvIGRlIHZlcmlmaWNhw6fDo28iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRGVzY3Jpw6fDo28gZGUgdGVjbm9sb2dpYSBhc3Npc3RpdmEgcGFyYSBvIGJvdMOjbyBcIlZlcmlmaWNhclwiIiwKICAgICAgImRlZmF1bHQiOiAiVmVyaWZpcXVlIGFzIHJlc3Bvc3Rhcy4gRXN0YXMgc2Vyw6NvIG1hcmNhZGFzIGNvbW8gY29ycmV0YXMsIGluY29ycmV0YXMsIG91IG7Do28gcmVzcG9uZGlkYXMuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkRlc2NyacOnw6NvIGRlIHRlY25vbG9naWEgYXNzaXN0aWRhIHBhcmEgbyBib3TDo28gXCJNb3N0cmFyIFNvbHXDp8Ojb1wiIiwKICAgICAgImRlZmF1bHQiOiAiTW9zdHJhciBhIHNvbHXDp8Ojby4gQSBhdGl2aWRhZGUgc2Vyw6EgbWFyY2FkYSBjb20gYSByZXNwZXRpdmEgc29sdcOnw6NvIGNvcnJldGEuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkRlc2NyacOnw6NvIGRhIHRlY25vbG9naWEgYXNzaXN0aXZhIHBhcmEgbyBib3TDo28gXCJSZXBldGlyXCIiLAogICAgICAiZGVmYXVsdCI6ICJSZXBldGlyIGEgYXRpdmlkYWRlLiBBcGFnYXIgdG9kYXMgYXMgcmVzcG9zdGFzIGUgcmVpbmljaWFyIGEgYXRpdmlkYWRlLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJBc3Npc3RpdmUgdGVjaG5vbG9neSBkZXNjcmlwdGlvbiBmb3IgXCJSZXRyeVwiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlJldHJ5IHRoZSB0YXNrLiBSZXNldCBhbGwgcmVzcG9uc2VzIGFuZCBzdGFydCB0aGUgdGFzayBvdmVyIGFnYWluLiIKICAgIH0KICBdCn0K"],"libraries\/H5P.MarkTheWords-1.11\/language\/ro.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJNZWRpYSIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIlR5cGUiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9wdGlvbmFsIG1lZGlhIHRvIGRpc3BsYXkgYWJvdmUgdGhlIHF1ZXN0aW9uLiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJEaXNhYmxlIGltYWdlIHpvb21pbmciCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGFzayBkZXNjcmlwdGlvbiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJEZXNjcmliZSBob3cgdGhlIHVzZXIgc2hvdWxkIHNvbHZlIHRoZSB0YXNrLiIsCiAgICAgICJwbGFjZWhvbGRlciI6ICJDbGljayBvbiBhbGwgdGhlIHZlcmJzIGluIHRoZSB0ZXh0IHRoYXQgZm9sbG93cy4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dGZpZWxkIiwKICAgICAgInBsYWNlaG9sZGVyIjogIlRoaXMgaXMgYW4gYW5zd2VyOiAqYW5zd2VyKi4iLAogICAgICAiaW1wb3J0YW50IjogewogICAgICAgICJkZXNjcmlwdGlvbiI6ICI8dWw+PGxpPk1hcmtlZCB3b3JkcyBhcmUgYWRkZWQgd2l0aCBhbiBhc3RlcmlzayAoKikuPC9saT48bGk+QXN0ZXJpc2tzIGNhbiBiZSBhZGRlZCB3aXRoaW4gbWFya2VkIHdvcmRzIGJ5IGFkZGluZyBhbm90aGVyIGFzdGVyaXNrLCAqY29ycmVjdHdvcmQqKiogPSZndDsgY29ycmVjdHdvcmQqLjwvbGk+PC91bD4iLAogICAgICAgICJleGFtcGxlIjogIlRoZSBjb3JyZWN0IHdvcmRzIGFyZSBtYXJrZWQgbGlrZSB0aGlzOiAqY29ycmVjdHdvcmQqLCBhbiBhc3RlcmlzayBpcyB3cml0dGVuIGxpa2UgdGhpczogKmNvcnJlY3R3b3JkKioqLiIKICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk92ZXJhbGwgRmVlZGJhY2siLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJ3aWRnZXRzIjogWwogICAgICAgICAgICB7CiAgICAgICAgICAgICAgImxhYmVsIjogIkRlZmF1bHQiCiAgICAgICAgICAgIH0KICAgICAgICAgIF0sCiAgICAgICAgICAibGFiZWwiOiAiRGVmaW5lIGN1c3RvbSBmZWVkYmFjayBmb3IgYW55IHNjb3JlIHJhbmdlIiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJDbGljayB0aGUgXCJBZGQgcmFuZ2VcIiBidXR0b24gdG8gYWRkIGFzIG1hbnkgcmFuZ2VzIGFzIHlvdSBuZWVkLiBFeGFtcGxlOiAwLTIwJSBCYWQgc2NvcmUsIDIxLTkxJSBBdmVyYWdlIFNjb3JlLCA5MS0xMDAlIEdyZWF0IFNjb3JlISIsCiAgICAgICAgICAiZW50aXR5IjogInJhbmdlIiwKICAgICAgICAgICJmaWVsZCI6IHsKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiU2NvcmUgUmFuZ2UiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7fSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiRmVlZGJhY2sgZm9yIGRlZmluZWQgc2NvcmUgcmFuZ2UiLAogICAgICAgICAgICAgICAgInBsYWNlaG9sZGVyIjogIkZpbGwgaW4gdGhlIGZlZWRiYWNrIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIFwiQ2hlY2tcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJDaGVjayIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBcIlN1Ym1pdFwiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlN1Ym1pdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBcIlJldHJ5XCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiUmV0cnkiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJTaG93IHNvbHV0aW9uXCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiU2hvdyBzb2x1dGlvbiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZWhhdmlvdXJhbCBzZXR0aW5ncy4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGhlc2Ugb3B0aW9ucyB3aWxsIGxldCB5b3UgY29udHJvbCBob3cgdGhlIHRhc2sgYmVoYXZlcy4iLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJFbmFibGUgXCJSZXRyeVwiIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkVuYWJsZSBcIlNob3cgc29sdXRpb25cIiBidXR0b24iCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiRW5hYmxlIFwiQ2hlY2tcIiBidXR0b24iCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiU2hvdyBzY29yZSBwb2ludHMiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIlNob3cgcG9pbnRzIGVhcm5lZCBmb3IgZWFjaCBhbnN3ZXIuIgogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNvcnJlY3QgYW5zd2VyIHRleHQiLAogICAgICAiZGVmYXVsdCI6ICJDb3JyZWN0ISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHVzZWQgdG8gaW5kaWNhdGUgdGhhdCBhbiBhbnN3ZXIgaXMgY29ycmVjdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbmNvcnJlY3QgYW5zd2VyIHRleHQiLAogICAgICAiZGVmYXVsdCI6ICJJbmNvcnJlY3QhIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdXNlZCB0byBpbmRpY2F0ZSB0aGF0IGFuIGFuc3dlciBpcyBpbmNvcnJlY3QiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWlzc2VkIGFuc3dlciB0ZXh0IiwKICAgICAgImRlZmF1bHQiOiAiQW5zd2VyIG5vdCBmb3VuZCEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB1c2VkIHRvIGluZGljYXRlIHRoYXQgYW4gYW5zd2VyIGlzIG1pc3NpbmciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRGVzY3JpcHRpb24gZm9yIERpc3BsYXkgU29sdXRpb24iLAogICAgICAiZGVmYXVsdCI6ICJUYXNrIGlzIHVwZGF0ZWQgdG8gY29udGFpbiB0aGUgc29sdXRpb24uIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRoaXMgdGV4dCB0ZWxscyB0aGUgdXNlciB0aGF0IHRoZSB0YXNrcyBoYXMgYmVlbiB1cGRhdGVkIHdpdGggdGhlIHNvbHV0aW9uLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0dWFsIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBzY29yZSBiYXIgZm9yIHRob3NlIHVzaW5nIGEgcmVhZHNwZWFrZXIiLAogICAgICAiZGVmYXVsdCI6ICJZb3UgZ290IDpudW0gb3V0IG9mIDp0b3RhbCBwb2ludHMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTGFiZWwgZm9yIHRoZSBmdWxsIHJlYWRhYmxlIHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJGdWxsIHJlYWRhYmxlIHRleHQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTGFiZWwgZm9yIHRoZSB0ZXh0IHdoZXJlIHdvcmRzIGNhbiBiZSBtYXJrZWQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJGdWxsIHRleHQgd2hlcmUgd29yZHMgY2FuIGJlIG1hcmtlZCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJTb2x1dGlvbiBtb2RlIGhlYWRlciBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIlNvbHV0aW9uIG1vZGUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2hlY2tpbmcgbW9kZSBoZWFkZXIgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJDaGVja2luZyBtb2RlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFzc2lzdGl2ZSB0ZWNobm9sb2d5IGRlc2NyaXB0aW9uIGZvciBcIkNoZWNrXCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiQ2hlY2sgdGhlIGFuc3dlcnMuIFRoZSByZXNwb25zZXMgd2lsbCBiZSBtYXJrZWQgYXMgY29ycmVjdCwgaW5jb3JyZWN0LCBvciB1bmFuc3dlcmVkLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJBc3Npc3RpdmUgdGVjaG5vbG9neSBkZXNjcmlwdGlvbiBmb3IgXCJTaG93IFNvbHV0aW9uXCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiU2hvdyB0aGUgc29sdXRpb24uIFRoZSB0YXNrIHdpbGwgYmUgbWFya2VkIHdpdGggaXRzIGNvcnJlY3Qgc29sdXRpb24uIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFzc2lzdGl2ZSB0ZWNobm9sb2d5IGRlc2NyaXB0aW9uIGZvciBcIlJldHJ5XCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiUmV0cnkgdGhlIHRhc2suIFJlc2V0IGFsbCByZXNwb25zZXMgYW5kIHN0YXJ0IHRoZSB0YXNrIG92ZXIgYWdhaW4uIgogICAgfQogIF0KfQo="],"libraries\/H5P.MarkTheWords-1.11\/language\/ru.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLQnNC10LTQuNCwIiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAi0KLQuNC\/IiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICLQlNC+0L\/QvtC70L3QuNGC0LXQu9GM0L3QvtC1INC80LXQtNC40LAg0LTQu9GPINC+0YLQvtCx0YDQsNC20LXQvdC40Y8g0L3QsNC0INCy0L7Qv9GA0L7RgdC+0LwuIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogItCe0YLQutC70Y7Rh9C40YLRjCDQvNCw0YHRiNGC0LDQsdC40YDQvtCy0LDQvdC40LUg0LjQt9C+0LHRgNCw0LbQtdC90LjRjyIKICAgICAgICB9CiAgICAgIF0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQntC\/0LjRgdCw0L3QuNC1INC30LDQtNCw0YfQuCIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLQntC\/0LjRiNC40YLQtSwg0LrQsNC6INC\/0L7Qu9GM0LfQvtCy0LDRgtC10LvRjCDQtNC+0LvQttC10L0g0YDQtdGI0LjRgtGMINC30LDQtNCw0YfRgy4iLAogICAgICAicGxhY2Vob2xkZXIiOiAi0J3QsNC20LzQuNGC0LUg0L3QsCDQstGB0LUg0LPQu9Cw0LPQvtC70Ysg0LIg0YHQu9C10LTRg9GO0YnQtdC8INGC0LXQutGB0YLQtS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0J7QsdC70LDRgdGC0Ywg0LLQstC+0LTQsCIsCiAgICAgICJwbGFjZWhvbGRlciI6ICLQntGC0LLQtdGC0L7QvCDRj9Cy0LvRj9C10YLRgdGPOiAq0L7RgtCy0LXRgiouIiwKICAgICAgImltcG9ydGFudCI6IHsKICAgICAgICAiZGVzY3JpcHRpb24iOiAiPHVsPjxsaT7QktGL0LTQtdC70LXQvdC90YvQtSDRgdC70L7QstCwINC90LXQvtCx0YXQvtC00LjQvNC+INC+0LHQvtC30L3QsNGH0LjRgtGMINC30LLRkdC30LTQvtGH0LrQvtC5ICgqKS48L2xpPjxsaT7Ql9Cy0ZHQt9C00L7Rh9C60LAg0LTQvtC70LbQvdCwINCx0YvRgtGMINC00L7QsdCw0LLQu9C10L3QsCDRgSDQtNCy0YPRhSDRgdGC0L7RgNC+0L0sICrQv9GA0LDQstC40LvRjNC90L7QtdGB0LvQvtCy0L4qKiogPSZndDsg0L\/RgNCw0LLQuNC70YzQvdC+0LXRgdC70L7QstC+Ki48L2xpPjwvdWw+IiwKICAgICAgICAiZXhhbXBsZSI6ICLQn9GA0LDQstC40LvRjNC90YvQtSDRgdC70L7QstCwINC+0L\/RgNC10LTQtdC70LXQvdGLINGC0LDQutC40Lwg0L7QsdGA0LDQt9C+0Lw6ICrQv9GA0LDQstC40LvRjNC90L7QtdGB0LvQvtCy0L4qLCDQt9Cy0ZHQt9C00L7Rh9C60LAg0L7QsdC+0LfQvdCw0YfQtdC90LAg0YLQsNC6OiAq0L\/RgNCw0LLQuNC70YzQvdC+0LXRgdC70L7QstC+KioqLiIKICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCe0LHRidC40Lkg0L7RgtC30YvQsiIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgICAgIHsKICAgICAgICAgICAgICAibGFiZWwiOiAi0J\/QviDRg9C80L7Qu9GH0LDQvdC40Y4iCiAgICAgICAgICAgIH0KICAgICAgICAgIF0sCiAgICAgICAgICAibGFiZWwiOiAi0KPRgdGC0LDQvdC+0LLQuNGC0Ywg0L7RgtC30YvQsiDQtNC70Y8g0LvRjtCx0L7Qs9C+INC00LjQsNC\/0LDQt9C+0L3QsCDQsdCw0LvQu9C+0LIiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogItCd0LDQttC80LjRgtC1INC60L3QvtC\/0LrRgyBcItCU0L7QsdCw0LLQuNGC0Ywg0LTQuNCw0L\/QsNC30L7QvVwiINC00LvRjyDQtNC+0LHQsNCy0LvQtdC90LjRjyDQvdC10L7QsdGF0L7QtNC40LzQvtCz0L4g0LrQvtC70LjRh9C10YHRgtCy0LAg0LTQuNCw0L\/QsNC30L7QvdC+0LIuINCf0YDQuNC80LXRgDogMC0yMCUg0J3QuNC30LrQuNC5INGA0LXQt9GD0LvRjNGC0LDRgiwgMjEtOTElINCh0YDQtdC00L3QuNC5INGA0LXQt9GD0LvRjNGC0LDRgiwgOTEtMTAwJSDQntGC0LvQuNGH0L3Ri9C5INGA0LXQt9GD0LvRjNGC0LDRgiEiLAogICAgICAgICAgImVudGl0eSI6ICLQtNC40LDQv9Cw0LfQvtC9IiwKICAgICAgICAgICJmaWVsZCI6IHsKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAi0JTQuNCw0L\/QsNC30L7QvSDQsdCw0LvQu9C+0LIiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7fSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAi0J7RgtC30YvQsiDQtNC70Y8g0L7Qv9GA0LXQtNC10LvRkdC90L3QvtCz0L4g0LTQuNCw0L\/QsNC30L7QvdCwINCx0LDQu9C70L7QsiIsCiAgICAgICAgICAgICAgICAicGxhY2Vob2xkZXIiOiAi0JfQsNC\/0L7Qu9C90LjRgtC1INC+0YLQt9GL0LIiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQtNC70Y8g0LrQvdC+0L\/QutC4IFwi0J\/RgNC+0LLQtdGA0LjRgtGMXCIiLAogICAgICAiZGVmYXVsdCI6ICLQn9GA0L7QstC10YDQuNGC0YwiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQtNC70Y8g0LrQvdC+0L\/QutC4IFwi0J7RgtC\/0YDQsNCy0LjRgtGMXCIiLAogICAgICAiZGVmYXVsdCI6ICLQntGC0L\/RgNCw0LLQuNGC0YwiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQtNC70Y8g0LrQvdC+0L\/QutC4IFwi0J\/QvtCy0YLQvtGA0LjRgtGMXCIiLAogICAgICAiZGVmYXVsdCI6ICLQn9C+0LLRgtC+0YDQuNGC0YwiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQtNC70Y8g0LrQvdC+0L\/QutC4IFwi0J\/QvtC60LDQt9Cw0YLRjCDRgNC10YjQtdC90LjQtVwiIiwKICAgICAgImRlZmF1bHQiOiAi0J\/QvtC60LDQt9Cw0YLRjCDRgNC10YjQtdC90LjQtSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQndCw0YHRgtGA0L7QudC60Lgg0L7QsdGA0LDRgtC90L7QuSDRgdCy0Y\/Qt9C4LiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLQrdGC0Lgg0L3QsNGB0YLRgNC+0LnQutC4INC\/0L7QvNC+0LPRg9GCINCy0LDQvCDRg9C\/0YDQsNCy0LvRj9GC0Ywg0L\/QvtCy0LXQtNC10L3QuNC10Lwg0LfQsNC00LDQvdC40Y8uIiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAi0JLQutC70Y7Rh9C40YLRjCBcItCf0L7QstGC0L7RgNC40YLRjFwiIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogItCS0LrQu9GO0YfQuNGC0Ywg0LrQvdC+0L\/QutGDIFwi0J\/QvtC60LDQt9Cw0YLRjCDRgNC10YjQtdC90LjQtVwiIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogItCS0LrQu9GO0YfQuNGC0Ywg0LrQvdC+0L\/QutGDIFwi0J\/RgNC+0LLQtdGA0LjRgtGMXCIiCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAi0J\/QvtC60LDQt9Cw0YLRjCDRgNC10LfRg9C70YzRgtCw0YIiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogItCf0L7QutCw0LfQsNGC0Ywg0LHQsNC70LvRiyDQt9CwINC+0YLQstC10YLRiy4iCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQv9GA0LDQstC40LvRjNC90L7Qs9C+INC+0YLQstC10YLQsCIsCiAgICAgICJkZWZhdWx0IjogItCS0LXRgNC90L4hIiwKICAgICAgImRlc2NyaXB0aW9uIjogItCi0LXQutGB0YIsINC+0L\/RgNC10LTQtdC70Y\/RjtGJ0LjQuSwg0YfRgtC+INC+0YLQstC10YIg0L\/RgNCw0LLQuNC70YzQvdGL0LkiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQtNC70Y8g0L3QtdC\/0YDQsNCy0LjQu9GM0L3QvtCz0L4g0L7RgtCy0LXRgtCwIiwKICAgICAgImRlZmF1bHQiOiAi0J3QtdCy0LXRgNC90L4hIiwKICAgICAgImRlc2NyaXB0aW9uIjogItCi0LXQutGB0YIsINC+0L\/RgNC10LTQtdC70Y\/RjtGJ0LjQuSwg0YfRgtC+INC+0YLQstC10YIg0L3QtdC\/0YDQsNCy0LjQu9GM0L3Ri9C5IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0LXQutGB0YIg0LTQu9GPINC+0YLRgdGD0YLRgdGC0LLRg9GO0YnQtdCz0L4g0L7RgtCy0LXRgtCwIiwKICAgICAgImRlZmF1bHQiOiAi0J7RgtGB0YPRgtGB0YLQstGD0LXRgiEiLAogICAgICAiZGVzY3JpcHRpb24iOiAi0KLQtdC60YHRgiwg0L7Qv9GA0LXQtNC10LvRj9GO0YnQuNC5LCDRh9GC0L4g0L7RgtCy0LXRgiDQvtGC0YHRg9GC0YHRgtCy0YPQtdGCIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCe0L\/QuNGB0LDQvdC40LUg0LTQu9GPINC\/0YDQtdC00YHRgtCw0LLQu9C10L3QuNGPINGA0LXRiNC10L3QuNGPIiwKICAgICAgImRlZmF1bHQiOiAi0JfQsNC00LDRh9CwINC+0LHQvdC+0LLQu9C10L3QsCDQvdCwINGB0L7QtNC10YDQttCw0L3QuNC1INGA0LXRiNC10L3QuNGPLiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLQotC10LrRgdGCLCDQvtCx0YrRj9GB0L3Rj9GO0YnQuNC5INC\/0L7Qu9GM0LfQvtCy0LDRgtC10LvRjiwg0YfRgtC+INC30LDQtNCw0YfQsCDQvtCx0L3QvtCy0LvQtdC90LAg0YEg0YDQtdGI0LXQvdC40LXQvC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgtC+0LLQvtC1INC\/0YDQtdC00YHRgtCw0LLQu9C10L3QuNC1INGA0LXQt9GD0LvRjNGC0LDRgtC+0LIg0LTQu9GPINC40YHQv9C+0LvRjNC30YPRjtGJ0LjRhSDQsNGB0YHQuNGB0YLQuNGA0YPRjtGJ0LjQtSDRgtC10YXQvdC+0LvQvtCz0LjQuCAo0L7Qt9Cy0YPRh9C40LLQsNC90LjQtSkiLAogICAgICAiZGVmYXVsdCI6ICLQoyDRgtC10LHRjyA6bnVtINC40LcgOnRvdGFsINCx0LDQu9C70L7QsiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQr9GA0LvRi9C6INC00LvRjyDQv9C+0LvQvdC+0LPQviDRh9C40YLQsNC10LzQvtCz0L4g0YLQtdC60YHRgtCwINC00LvRjyDQsNGB0YHQuNGB0YLQuNGA0YPRjtGJ0LjRhSDRgtC10YXQvdC+0LvQvtCz0LjQuCIsCiAgICAgICJkZWZhdWx0IjogItCf0L7Qu9C90YvQuSDRh9C40YLQsNC10LzRi9C5INGC0LXQutGB0YIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0K\/RgNC70YvQuiDRgtC10LrRgdGC0LAg0LTQu9GPINCy0YvQtNC10LvQtdC90L3Ri9GFINGB0LvQvtCyINC00LvRjyDQsNGB0YHQuNGB0YLQuNGA0YPRjtGJ0LjRhSDRgtC10YXQvdC+0LvQvtCz0LjQuCIsCiAgICAgICJkZWZhdWx0IjogItCf0L7Qu9C90YvQuSDRgtC10LrRgdGCINC00LvRjyDQstGL0LTQtdC70LXQvdC90YvRhSDRgdC70L7QsiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQl9Cw0LPQvtC70L7QstC+0Log0YDQtdC20LjQvNCwINGA0LXRiNC10L3QuNGPINC00LvRjyDQstGB0L\/QvtC80L7Qs9Cw0YLQtdC70YzQvdGL0YUg0YLQtdGF0L3QvtC70L7Qs9C40LkiLAogICAgICAiZGVmYXVsdCI6ICLQoNC10LbQuNC8INGA0LXRiNC10L3QuNGPIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCX0LDQs9C+0LvQvtCy0L7QuiDRgNC10LbQuNC80LAg0L\/RgNC+0LLQtdGA0LrQuCDQtNC70Y8g0LLRgdC\/0L7QvNC+0LPQsNGC0LXQu9GM0L3Ri9GFINGC0LXRhdC90L7Qu9C+0LPQuNC5IiwKICAgICAgImRlZmF1bHQiOiAi0KDQtdC20LjQvCDQv9GA0L7QstC10YDQutC4IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCe0L\/QuNGB0LDQvdC40LUg0LLRgdC\/0L7QvNC+0LPQsNGC0LXQu9GM0L3QvtC5INGC0LXRhdC90L7Qu9C+0LPQuNC4INC00LvRjyDQutC90L7Qv9C60LggXCLQn9GA0L7QstC10YDQuNGC0YxcIiIsCiAgICAgICJkZWZhdWx0IjogItCf0YDQvtCy0LXRgNC40YLRjCDQvtGC0LLQtdGC0YsuINCe0YLQstC10YLRiyDQsdGD0LTRg9GCINC\/0L7QvNC10YfQtdC90Ysg0LrQsNC6INC\/0YDQsNCy0LjQu9GM0L3Ri9C1LCDQvdC10L\/RgNCw0LLQuNC70YzQvdGL0LUg0LjQu9C4INC+0YHRgtCw0LLRiNC40LXRgdGPINCx0LXQtyDQvtGC0LLQtdGC0LAuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCe0L\/QuNGB0LDQvdC40LUg0LLRgdC\/0L7QvNC+0LPQsNGC0LXQu9GM0L3QvtC5INGC0LXRhdC90L7Qu9C+0LPQuNC4INC00LvRjyDQutC90L7Qv9C60LggXCLQn9C+0LrQsNC30LDRgtGMINGA0LXRiNC10L3QuNC1XCIiLAogICAgICAiZGVmYXVsdCI6ICLQn9C+0LrQsNC30LDRgtGMINGA0LXRiNC10L3QuNC1LiDQl9Cw0LTQsNGH0LAg0LHRg9C00LXRgiDQvtGC0LzQtdGH0LXQvdCwINC10LUg0L\/RgNCw0LLQuNC70YzQvdGL0Lwg0YDQtdGI0LXQvdC40LXQvC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0J7Qv9C40YHQsNC90LjQtSDQstGB0L\/QvtC80L7Qs9Cw0YLQtdC70YzQvdC+0Lkg0YLQtdGF0L3QvtC70L7Qs9C40Lgg0LTQu9GPINC60L3QvtC\/0LrQuCBcItCf0L7QstGC0L7RgNC40YLRjFwiIiwKICAgICAgICJkZWZhdWx0IjogItCf0L7QstGC0L7RgNC40YLRjCDQv9C+0L\/Ri9GC0LrRgy4g0KHQsdGA0L7RgdC40YLRjCDQstGB0LUg0L7RgtCy0LXRgtGLINC4INC30LDQv9GD0YHRgtC40YLRjCDQt9Cw0LTQsNGH0YMg0LfQsNC90L7QstC+LiIKICAgIH0KICBdCn0="],"libraries\/H5P.MarkTheWords-1.11\/language\/sl.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJNZWRpamkiLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJUaXAiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIk5lb2J2ZXpuYSBuYXN0YXZpdGV2IGRvZGF0bmVnYSBtZWRpamEgemEgcHJpa2F6IG5hZCB2cHJhxaFhbmplbS4iCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiT25lbW9nb8SNaSBwb3ZlxI1hdm8gc2xpa2UiCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTmF2b2RpbG8gdWRlbGXFvmVuY2VtIiwKICAgICAgImRlc2NyaXB0aW9uIjogIk9waXMgcmXFoWV2YW5qYSB6YWRhbmUgbmFsb2dlLiIsCiAgICAgICJwbGFjZWhvbGRlciI6ICJTIGtsaWtvbSBvem5hxI1pIHBvc2FtZXpuZSBiZXNlZGUgdiB6YXBpc3UuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlBvbGplIHphIGJlc2VkaWxvIiwKICAgICAgInBsYWNlaG9sZGVyIjogIlByYXZpbGVuIG9kZ292b3I6ICpwcmF2aWxuYWJlc2VkYSouIiwKICAgICAgImltcG9ydGFudCI6IHsKICAgICAgICAiZGVzY3JpcHRpb24iOiAiPHVsPjxsaT5QcmF2aWxlbiBvZGdvdm9yIHNlIG96bmHEjWkgeiB6dmV6ZGljbyAoKikgcHJlZCBpbiB6YSBiZXNlZG8uPC9saT48bGk+ViBwcmltZXJ1IG9kZ292b3JhIHogenZlemRpY28sIGplIHBvdHJlYm5vIHR1ZGkgenZlemRpY28gb2JkYXRpIHBvIGVuYWtlbSBwcmluY2lwdSAobnByLiAqcHJhdmlsbmFiZXNlZGEqKiogc2UgbmEgemFzbG9udSBpenBpxaFlIGtvdCBwcmF2aWxuYWJlc2VkYSopLjwvbGk+PGxpPktvdCBwcmF2aWxuZSBzZSBsYWhrbyBvem5hxI1pam8gbGUgYmVzZWRlIGluIG5lIGJlc2VkbmUgenZlemUuPC9saT48L3VsPiIsCiAgICAgICAgImV4YW1wbGUiOiAiUHJhdmlsbmkgb2Rnb3Zvcmkgc28gb3puYcSNZW5pIGtvdDogKnByYXZpbG5hYmVzZWRhKi4gWnZlemRpY2Egc2UgbGFoa28gemFwacWhZSBuYSBuYXNsZWRuamkgbmHEjWluOiAqcHJhdmlsbmFiZXNlZGEqKiouIgogICAgICB9CiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiU3Bsb8WhbmEgcG92cmF0bmEgaW5mb3JtYWNpamEiLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJ3aWRnZXRzIjogWwogICAgICAgICAgICB7CiAgICAgICAgICAgICAgImxhYmVsIjogIlByaXZ6ZXRvIgogICAgICAgICAgICB9CiAgICAgICAgICBdLAogICAgICAgICAgImxhYmVsIjogIkRvbG\/EjWkgbG\/EjWVubyBwb3ZyYXRubyBpbmZvcm1hY2lqbyB6YSB2c2FrIHJhenBvbiByZXp1bHRhdG92IiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJLbGlrbml0ZSBndW1iIFwiRG9kYWogcmF6cG9uXCIgemEgZG9kYWphbmplIGRvZGF0bmloIHJhenBvbm92LiBQcmltZXI6IDAtMjAgJSBTbGFiIHJlenVsdGF0LCAyMS05MSAlIFBvdnByZcSNZW4gcmV6dWx0YXQsIDkxLTEwMCAlIE9kbGnEjWVuIHJlenVsdGF0ISIsCiAgICAgICAgICAiZW50aXR5IjogInJhenBvbiIsCiAgICAgICAgICAiZmllbGQiOiB7CiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlJhenBvbiByZXp1bHRhdG92IgogICAgICAgICAgICAgIH0sCiAgICAgICAgICAgICAge30sCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogIlBvdnJhdG5hIGluZm9ybWFjaWphIHphIGRlZmluaXJhbiByYXpwb24gcmV6dWx0YXRvdiIsCiAgICAgICAgICAgICAgICAicGxhY2Vob2xkZXIiOiAiVm5lc2l0ZSBwb3ZyYXRubyBpbmZvcm1hY2lqbyIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICB9CiAgICAgIF0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZXNlZGlsbyB6YSBndW1iIFwiUHJldmVyaVwiIiwKICAgICAgImRlZmF1bHQiOiAiUHJldmVyaSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBcIlN1Ym1pdFwiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlN1Ym1pdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZXNlZGlsbyB6YSBndW1iIFwiUG9za3VzaSBwb25vdm5vXCIiLAogICAgICAiZGVmYXVsdCI6ICJQb3NrdXNpIHBvbm92bm8iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQmVzZWRpbG8gemEgZ3VtYiBcIlByaWthxb5pIHJlxaFpdGV2XCIiLAogICAgICAiZGVmYXVsdCI6ICJQcmlrYcW+aSByZcWhaXRldiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJOYXN0YXZpdHZlIGludGVyYWtjaWplIiwKICAgICAgImRlc2NyaXB0aW9uIjogIk5hc3Rhdml0dmUgb21vZ2\/EjWFqbyBuYWR6b3IgbmFkIGludGVyYWtjaWpvIGFrdGl2bm9zdGkgemEgdWRlbGXFvmVuY2UuIiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiT21vZ2\/EjWkgZ3VtYiBcIlBvc2t1c2kgcG9ub3Zub1wiIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIk9tb2dvxI1pIGd1bWIgXCJQcmlrYcW+aSByZcWhaXRldlwiIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIk9tb2dvxI1pIGd1bWIgXCJQcmV2ZXJpXCIiCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiUHJpa2HFvmkgZG9zZcW+ZW5lIHRvxI1rZSIsCiAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiRG9zZcW+ZW5lIHRvxI1rZSBwcmlrYcW+ZSBwcmkgdnNha2VtIG9kZGFuZW0gb2Rnb3ZvcnUuIgogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkJlc2VkaWxvIHphIHByYXZpbGVuIG9kZ292b3IiLAogICAgICAiZGVmYXVsdCI6ICJQcmF2aWxubyEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiQmVzZWRpbG8gb3puYcSNdWplIHByYXZpbGVuIG9kZ292b3IiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQmVzZWRpbG8gemEgbmVwcmF2aWxlbiBvZGdvdm9yIiwKICAgICAgImRlZmF1bHQiOiAiTmVwcmF2aWxubyEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiQmVzZWRpbG8gb3puYcSNdWplIG5lcHJhdmlsZW4gb2Rnb3ZvciIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZXNlZGlsbyB6YSBtYW5qa2Fqb8SNIG9kZ292b3IiLAogICAgICAiZGVmYXVsdCI6ICJPZGdvdm9yIG1hbmprYSEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiQmVzZWRpbG8gb3puYcSNdWplIG1hbmprYWpvxI0gb2Rnb3ZvciIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZXNlZGlsbyB6YSBvcGlzIHByaWthemEgcmXFoWl0dmUiLAogICAgICAiZGVmYXVsdCI6ICJSZcWhaXRldiBuYWxvZ2UgamUgb2JqYXZsamVuYS4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiQmVzZWRpbG8gb2J2ZXN0aSB1cG9yYWJuaWthIG8gb2JqYXZpIHJlxaFpdHZlIG5hbG9nZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQmVzZWRpbG8sIGtpIGdhIGJyYWxuaWsgemFzbG9uYSB1cG9yYWJpIHphIGl6cmHFvmFuamUgbmFwcmVka2EiLAogICAgICAiZGVmYXVsdCI6ICJOYXByZWRlayA6bnVtIG9kIDp0b3RhbCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJPem5ha2EgemEgY2Vsb3RubyBiZXNlZGlsbyB6YSBicmFsbmlrZSB6YXNsb25hIiwKICAgICAgImRlZmF1bHQiOiAiQ2Vsb3RubyBiZXNlZGlsbyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJPem5ha2EgemEgYmVzZWRpbG8geiBtb8W+bm9zdGpvIG96bmHEjWl0dmUgYmVzZWQgemEgYnJhbG5pa2UgemFzbG9uYSIsCiAgICAgICJkZWZhdWx0IjogIkJlc2VkaWxvIHogbW\/Fvm5vc3RqbyBvem5hxI1pdHZlIGJlc2VkIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk5hc2xvdiB6YSBuYcSNaW4gcmXFoWV2YW5qYSB6YSBicmFsbmlrZSB6YXNsb25hIiwKICAgICAgImRlZmF1bHQiOiAiTmHEjWluIHJlxaFldmFuamEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTmFzbG92IHphIG5hxI1pbiBwcmlrYXphIHJlxaFpdGV2IHphIGJyYWxuaWtlIHphc2xvbmEiLAogICAgICAiZGVmYXVsdCI6ICJOYcSNaW4gcHJpa2F6YSByZcWhaXRldiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJBc3Npc3RpdmUgdGVjaG5vbG9neSBkZXNjcmlwdGlvbiBmb3IgXCJDaGVja1wiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIkNoZWNrIHRoZSBhbnN3ZXJzLiBUaGUgcmVzcG9uc2VzIHdpbGwgYmUgbWFya2VkIGFzIGNvcnJlY3QsIGluY29ycmVjdCwgb3IgdW5hbnN3ZXJlZC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQXNzaXN0aXZlIHRlY2hub2xvZ3kgZGVzY3JpcHRpb24gZm9yIFwiU2hvdyBTb2x1dGlvblwiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlNob3cgdGhlIHNvbHV0aW9uLiBUaGUgdGFzayB3aWxsIGJlIG1hcmtlZCB3aXRoIGl0cyBjb3JyZWN0IHNvbHV0aW9uLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJBc3Npc3RpdmUgdGVjaG5vbG9neSBkZXNjcmlwdGlvbiBmb3IgXCJSZXRyeVwiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlJldHJ5IHRoZSB0YXNrLiBSZXNldCBhbGwgcmVzcG9uc2VzIGFuZCBzdGFydCB0aGUgdGFzayBvdmVyIGFnYWluLiIKICAgIH0KICBdCn0K"],"libraries\/H5P.MarkTheWords-1.11\/language\/sma.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJNZWRpYSIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIlR5cGUiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9wdGlvbmFsIG1lZGlhIHRvIGRpc3BsYXkgYWJvdmUgdGhlIHF1ZXN0aW9uLiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJEaXNhYmxlIGltYWdlIHpvb21pbmciCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGFzayBkZXNjcmlwdGlvbiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJEZXNjcmliZSBob3cgdGhlIHVzZXIgc2hvdWxkIHNvbHZlIHRoZSB0YXNrLiIsCiAgICAgICJwbGFjZWhvbGRlciI6ICJDbGljayBvbiBhbGwgdGhlIHZlcmJzIGluIHRoZSB0ZXh0IHRoYXQgZm9sbG93cy4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dGZpZWxkIiwKICAgICAgInBsYWNlaG9sZGVyIjogIlRoaXMgaXMgYW4gYW5zd2VyOiAqYW5zd2VyKi4iLAogICAgICAiaW1wb3J0YW50IjogewogICAgICAgICJkZXNjcmlwdGlvbiI6ICI8dWw+PGxpPk1hcmtlZCB3b3JkcyBhcmUgYWRkZWQgd2l0aCBhbiBhc3RlcmlzayAoKikuPC9saT48bGk+QXN0ZXJpc2tzIGNhbiBiZSBhZGRlZCB3aXRoaW4gbWFya2VkIHdvcmRzIGJ5IGFkZGluZyBhbm90aGVyIGFzdGVyaXNrLCAqY29ycmVjdHdvcmQqKiogPSZndDsgY29ycmVjdHdvcmQqLjwvbGk+PC91bD4iLAogICAgICAgICJleGFtcGxlIjogIlRoZSBjb3JyZWN0IHdvcmRzIGFyZSBtYXJrZWQgbGlrZSB0aGlzOiAqY29ycmVjdHdvcmQqLCBhbiBhc3RlcmlzayBpcyB3cml0dGVuIGxpa2UgdGhpczogKmNvcnJlY3R3b3JkKioqLiIKICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk92ZXJhbGwgRmVlZGJhY2siLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJ3aWRnZXRzIjogWwogICAgICAgICAgICB7CiAgICAgICAgICAgICAgImxhYmVsIjogIkRlZmF1bHQiCiAgICAgICAgICAgIH0KICAgICAgICAgIF0sCiAgICAgICAgICAibGFiZWwiOiAiRGVmaW5lIGN1c3RvbSBmZWVkYmFjayBmb3IgYW55IHNjb3JlIHJhbmdlIiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJDbGljayB0aGUgXCJBZGQgcmFuZ2VcIiBidXR0b24gdG8gYWRkIGFzIG1hbnkgcmFuZ2VzIGFzIHlvdSBuZWVkLiBFeGFtcGxlOiAwLTIwJSBCYWQgc2NvcmUsIDIxLTkxJSBBdmVyYWdlIFNjb3JlLCA5MS0xMDAlIEdyZWF0IFNjb3JlISIsCiAgICAgICAgICAiZW50aXR5IjogInJhbmdlIiwKICAgICAgICAgICJmaWVsZCI6IHsKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiU2NvcmUgUmFuZ2UiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7fSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiRmVlZGJhY2sgZm9yIGRlZmluZWQgc2NvcmUgcmFuZ2UiLAogICAgICAgICAgICAgICAgInBsYWNlaG9sZGVyIjogIkZpbGwgaW4gdGhlIGZlZWRiYWNrIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIFwiQ2hlY2tcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJDaGVjayIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBcIlN1Ym1pdFwiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlN1Ym1pdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBcIlJldHJ5XCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiUmV0cnkiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJTaG93IHNvbHV0aW9uXCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiU2hvdyBzb2x1dGlvbiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZWhhdmlvdXJhbCBzZXR0aW5ncy4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGhlc2Ugb3B0aW9ucyB3aWxsIGxldCB5b3UgY29udHJvbCBob3cgdGhlIHRhc2sgYmVoYXZlcy4iLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJFbmFibGUgXCJSZXRyeVwiIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkVuYWJsZSBcIlNob3cgc29sdXRpb25cIiBidXR0b24iCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiRW5hYmxlIFwiQ2hlY2tcIiBidXR0b24iCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiU2hvdyBzY29yZSBwb2ludHMiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIlNob3cgcG9pbnRzIGVhcm5lZCBmb3IgZWFjaCBhbnN3ZXIuIgogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNvcnJlY3QgYW5zd2VyIHRleHQiLAogICAgICAiZGVmYXVsdCI6ICJDb3JyZWN0ISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHVzZWQgdG8gaW5kaWNhdGUgdGhhdCBhbiBhbnN3ZXIgaXMgY29ycmVjdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbmNvcnJlY3QgYW5zd2VyIHRleHQiLAogICAgICAiZGVmYXVsdCI6ICJJbmNvcnJlY3QhIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdXNlZCB0byBpbmRpY2F0ZSB0aGF0IGFuIGFuc3dlciBpcyBpbmNvcnJlY3QiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWlzc2VkIGFuc3dlciB0ZXh0IiwKICAgICAgImRlZmF1bHQiOiAiQW5zd2VyIG5vdCBmb3VuZCEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB1c2VkIHRvIGluZGljYXRlIHRoYXQgYW4gYW5zd2VyIGlzIG1pc3NpbmciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRGVzY3JpcHRpb24gZm9yIERpc3BsYXkgU29sdXRpb24iLAogICAgICAiZGVmYXVsdCI6ICJUYXNrIGlzIHVwZGF0ZWQgdG8gY29udGFpbiB0aGUgc29sdXRpb24uIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRoaXMgdGV4dCB0ZWxscyB0aGUgdXNlciB0aGF0IHRoZSB0YXNrcyBoYXMgYmVlbiB1cGRhdGVkIHdpdGggdGhlIHNvbHV0aW9uLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0dWFsIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBzY29yZSBiYXIgZm9yIHRob3NlIHVzaW5nIGEgcmVhZHNwZWFrZXIiLAogICAgICAiZGVmYXVsdCI6ICJZb3UgZ290IDpudW0gb3V0IG9mIDp0b3RhbCBwb2ludHMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTGFiZWwgZm9yIHRoZSBmdWxsIHJlYWRhYmxlIHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJGdWxsIHJlYWRhYmxlIHRleHQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTGFiZWwgZm9yIHRoZSB0ZXh0IHdoZXJlIHdvcmRzIGNhbiBiZSBtYXJrZWQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJGdWxsIHRleHQgd2hlcmUgd29yZHMgY2FuIGJlIG1hcmtlZCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJTb2x1dGlvbiBtb2RlIGhlYWRlciBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIlNvbHV0aW9uIG1vZGUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2hlY2tpbmcgbW9kZSBoZWFkZXIgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJDaGVja2luZyBtb2RlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFzc2lzdGl2ZSB0ZWNobm9sb2d5IGRlc2NyaXB0aW9uIGZvciBcIkNoZWNrXCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiQ2hlY2sgdGhlIGFuc3dlcnMuIFRoZSByZXNwb25zZXMgd2lsbCBiZSBtYXJrZWQgYXMgY29ycmVjdCwgaW5jb3JyZWN0LCBvciB1bmFuc3dlcmVkLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJBc3Npc3RpdmUgdGVjaG5vbG9neSBkZXNjcmlwdGlvbiBmb3IgXCJTaG93IFNvbHV0aW9uXCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiU2hvdyB0aGUgc29sdXRpb24uIFRoZSB0YXNrIHdpbGwgYmUgbWFya2VkIHdpdGggaXRzIGNvcnJlY3Qgc29sdXRpb24uIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFzc2lzdGl2ZSB0ZWNobm9sb2d5IGRlc2NyaXB0aW9uIGZvciBcIlJldHJ5XCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiUmV0cnkgdGhlIHRhc2suIFJlc2V0IGFsbCByZXNwb25zZXMgYW5kIHN0YXJ0IHRoZSB0YXNrIG92ZXIgYWdhaW4uIgogICAgfQogIF0KfQo="],"libraries\/H5P.MarkTheWords-1.11\/language\/sme.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJNZWRpYSIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIlR5cGUiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9wdGlvbmFsIG1lZGlhIHRvIGRpc3BsYXkgYWJvdmUgdGhlIHF1ZXN0aW9uLiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJEaXNhYmxlIGltYWdlIHpvb21pbmciCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGFzayBkZXNjcmlwdGlvbiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJEZXNjcmliZSBob3cgdGhlIHVzZXIgc2hvdWxkIHNvbHZlIHRoZSB0YXNrLiIsCiAgICAgICJwbGFjZWhvbGRlciI6ICJDbGljayBvbiBhbGwgdGhlIHZlcmJzIGluIHRoZSB0ZXh0IHRoYXQgZm9sbG93cy4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dGZpZWxkIiwKICAgICAgInBsYWNlaG9sZGVyIjogIlRoaXMgaXMgYW4gYW5zd2VyOiAqYW5zd2VyKi4iLAogICAgICAiaW1wb3J0YW50IjogewogICAgICAgICJkZXNjcmlwdGlvbiI6ICI8dWw+PGxpPk1hcmtlZCB3b3JkcyBhcmUgYWRkZWQgd2l0aCBhbiBhc3RlcmlzayAoKikuPC9saT48bGk+QXN0ZXJpc2tzIGNhbiBiZSBhZGRlZCB3aXRoaW4gbWFya2VkIHdvcmRzIGJ5IGFkZGluZyBhbm90aGVyIGFzdGVyaXNrLCAqY29ycmVjdHdvcmQqKiogPSZndDsgY29ycmVjdHdvcmQqLjwvbGk+PC91bD4iLAogICAgICAgICJleGFtcGxlIjogIlRoZSBjb3JyZWN0IHdvcmRzIGFyZSBtYXJrZWQgbGlrZSB0aGlzOiAqY29ycmVjdHdvcmQqLCBhbiBhc3RlcmlzayBpcyB3cml0dGVuIGxpa2UgdGhpczogKmNvcnJlY3R3b3JkKioqLiIKICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk92ZXJhbGwgRmVlZGJhY2siLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJ3aWRnZXRzIjogWwogICAgICAgICAgICB7CiAgICAgICAgICAgICAgImxhYmVsIjogIkRlZmF1bHQiCiAgICAgICAgICAgIH0KICAgICAgICAgIF0sCiAgICAgICAgICAibGFiZWwiOiAiRGVmaW5lIGN1c3RvbSBmZWVkYmFjayBmb3IgYW55IHNjb3JlIHJhbmdlIiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJDbGljayB0aGUgXCJBZGQgcmFuZ2VcIiBidXR0b24gdG8gYWRkIGFzIG1hbnkgcmFuZ2VzIGFzIHlvdSBuZWVkLiBFeGFtcGxlOiAwLTIwJSBCYWQgc2NvcmUsIDIxLTkxJSBBdmVyYWdlIFNjb3JlLCA5MS0xMDAlIEdyZWF0IFNjb3JlISIsCiAgICAgICAgICAiZW50aXR5IjogInJhbmdlIiwKICAgICAgICAgICJmaWVsZCI6IHsKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiU2NvcmUgUmFuZ2UiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7fSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiRmVlZGJhY2sgZm9yIGRlZmluZWQgc2NvcmUgcmFuZ2UiLAogICAgICAgICAgICAgICAgInBsYWNlaG9sZGVyIjogIkZpbGwgaW4gdGhlIGZlZWRiYWNrIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIFwiQ2hlY2tcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJDaGVjayIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBcIlN1Ym1pdFwiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlN1Ym1pdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBcIlJldHJ5XCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiUmV0cnkiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJTaG93IHNvbHV0aW9uXCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiU2hvdyBzb2x1dGlvbiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZWhhdmlvdXJhbCBzZXR0aW5ncy4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGhlc2Ugb3B0aW9ucyB3aWxsIGxldCB5b3UgY29udHJvbCBob3cgdGhlIHRhc2sgYmVoYXZlcy4iLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJFbmFibGUgXCJSZXRyeVwiIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkVuYWJsZSBcIlNob3cgc29sdXRpb25cIiBidXR0b24iCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiRW5hYmxlIFwiQ2hlY2tcIiBidXR0b24iCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiU2hvdyBzY29yZSBwb2ludHMiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIlNob3cgcG9pbnRzIGVhcm5lZCBmb3IgZWFjaCBhbnN3ZXIuIgogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNvcnJlY3QgYW5zd2VyIHRleHQiLAogICAgICAiZGVmYXVsdCI6ICJDb3JyZWN0ISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHVzZWQgdG8gaW5kaWNhdGUgdGhhdCBhbiBhbnN3ZXIgaXMgY29ycmVjdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbmNvcnJlY3QgYW5zd2VyIHRleHQiLAogICAgICAiZGVmYXVsdCI6ICJJbmNvcnJlY3QhIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdXNlZCB0byBpbmRpY2F0ZSB0aGF0IGFuIGFuc3dlciBpcyBpbmNvcnJlY3QiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWlzc2VkIGFuc3dlciB0ZXh0IiwKICAgICAgImRlZmF1bHQiOiAiQW5zd2VyIG5vdCBmb3VuZCEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB1c2VkIHRvIGluZGljYXRlIHRoYXQgYW4gYW5zd2VyIGlzIG1pc3NpbmciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRGVzY3JpcHRpb24gZm9yIERpc3BsYXkgU29sdXRpb24iLAogICAgICAiZGVmYXVsdCI6ICJUYXNrIGlzIHVwZGF0ZWQgdG8gY29udGFpbiB0aGUgc29sdXRpb24uIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRoaXMgdGV4dCB0ZWxscyB0aGUgdXNlciB0aGF0IHRoZSB0YXNrcyBoYXMgYmVlbiB1cGRhdGVkIHdpdGggdGhlIHNvbHV0aW9uLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0dWFsIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBzY29yZSBiYXIgZm9yIHRob3NlIHVzaW5nIGEgcmVhZHNwZWFrZXIiLAogICAgICAiZGVmYXVsdCI6ICJZb3UgZ290IDpudW0gb3V0IG9mIDp0b3RhbCBwb2ludHMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTGFiZWwgZm9yIHRoZSBmdWxsIHJlYWRhYmxlIHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJGdWxsIHJlYWRhYmxlIHRleHQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTGFiZWwgZm9yIHRoZSB0ZXh0IHdoZXJlIHdvcmRzIGNhbiBiZSBtYXJrZWQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJGdWxsIHRleHQgd2hlcmUgd29yZHMgY2FuIGJlIG1hcmtlZCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJTb2x1dGlvbiBtb2RlIGhlYWRlciBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIlNvbHV0aW9uIG1vZGUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2hlY2tpbmcgbW9kZSBoZWFkZXIgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJDaGVja2luZyBtb2RlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFzc2lzdGl2ZSB0ZWNobm9sb2d5IGRlc2NyaXB0aW9uIGZvciBcIkNoZWNrXCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiQ2hlY2sgdGhlIGFuc3dlcnMuIFRoZSByZXNwb25zZXMgd2lsbCBiZSBtYXJrZWQgYXMgY29ycmVjdCwgaW5jb3JyZWN0LCBvciB1bmFuc3dlcmVkLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJBc3Npc3RpdmUgdGVjaG5vbG9neSBkZXNjcmlwdGlvbiBmb3IgXCJTaG93IFNvbHV0aW9uXCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiU2hvdyB0aGUgc29sdXRpb24uIFRoZSB0YXNrIHdpbGwgYmUgbWFya2VkIHdpdGggaXRzIGNvcnJlY3Qgc29sdXRpb24uIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFzc2lzdGl2ZSB0ZWNobm9sb2d5IGRlc2NyaXB0aW9uIGZvciBcIlJldHJ5XCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiUmV0cnkgdGhlIHRhc2suIFJlc2V0IGFsbCByZXNwb25zZXMgYW5kIHN0YXJ0IHRoZSB0YXNrIG92ZXIgYWdhaW4uIgogICAgfQogIF0KfQo="],"libraries\/H5P.MarkTheWords-1.11\/language\/smj.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJNZWRpYSIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIlR5cGUiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9wdGlvbmFsIG1lZGlhIHRvIGRpc3BsYXkgYWJvdmUgdGhlIHF1ZXN0aW9uLiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJEaXNhYmxlIGltYWdlIHpvb21pbmciCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGFzayBkZXNjcmlwdGlvbiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJEZXNjcmliZSBob3cgdGhlIHVzZXIgc2hvdWxkIHNvbHZlIHRoZSB0YXNrLiIsCiAgICAgICJwbGFjZWhvbGRlciI6ICJDbGljayBvbiBhbGwgdGhlIHZlcmJzIGluIHRoZSB0ZXh0IHRoYXQgZm9sbG93cy4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dGZpZWxkIiwKICAgICAgInBsYWNlaG9sZGVyIjogIlRoaXMgaXMgYW4gYW5zd2VyOiAqYW5zd2VyKi4iLAogICAgICAiaW1wb3J0YW50IjogewogICAgICAgICJkZXNjcmlwdGlvbiI6ICI8dWw+PGxpPk1hcmtlZCB3b3JkcyBhcmUgYWRkZWQgd2l0aCBhbiBhc3RlcmlzayAoKikuPC9saT48bGk+QXN0ZXJpc2tzIGNhbiBiZSBhZGRlZCB3aXRoaW4gbWFya2VkIHdvcmRzIGJ5IGFkZGluZyBhbm90aGVyIGFzdGVyaXNrLCAqY29ycmVjdHdvcmQqKiogPSZndDsgY29ycmVjdHdvcmQqLjwvbGk+PC91bD4iLAogICAgICAgICJleGFtcGxlIjogIlRoZSBjb3JyZWN0IHdvcmRzIGFyZSBtYXJrZWQgbGlrZSB0aGlzOiAqY29ycmVjdHdvcmQqLCBhbiBhc3RlcmlzayBpcyB3cml0dGVuIGxpa2UgdGhpczogKmNvcnJlY3R3b3JkKioqLiIKICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk92ZXJhbGwgRmVlZGJhY2siLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJ3aWRnZXRzIjogWwogICAgICAgICAgICB7CiAgICAgICAgICAgICAgImxhYmVsIjogIkRlZmF1bHQiCiAgICAgICAgICAgIH0KICAgICAgICAgIF0sCiAgICAgICAgICAibGFiZWwiOiAiRGVmaW5lIGN1c3RvbSBmZWVkYmFjayBmb3IgYW55IHNjb3JlIHJhbmdlIiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJDbGljayB0aGUgXCJBZGQgcmFuZ2VcIiBidXR0b24gdG8gYWRkIGFzIG1hbnkgcmFuZ2VzIGFzIHlvdSBuZWVkLiBFeGFtcGxlOiAwLTIwJSBCYWQgc2NvcmUsIDIxLTkxJSBBdmVyYWdlIFNjb3JlLCA5MS0xMDAlIEdyZWF0IFNjb3JlISIsCiAgICAgICAgICAiZW50aXR5IjogInJhbmdlIiwKICAgICAgICAgICJmaWVsZCI6IHsKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiU2NvcmUgUmFuZ2UiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7fSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiRmVlZGJhY2sgZm9yIGRlZmluZWQgc2NvcmUgcmFuZ2UiLAogICAgICAgICAgICAgICAgInBsYWNlaG9sZGVyIjogIkZpbGwgaW4gdGhlIGZlZWRiYWNrIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIFwiQ2hlY2tcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJDaGVjayIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBcIlN1Ym1pdFwiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlN1Ym1pdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBcIlJldHJ5XCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiUmV0cnkiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJTaG93IHNvbHV0aW9uXCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiU2hvdyBzb2x1dGlvbiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZWhhdmlvdXJhbCBzZXR0aW5ncy4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGhlc2Ugb3B0aW9ucyB3aWxsIGxldCB5b3UgY29udHJvbCBob3cgdGhlIHRhc2sgYmVoYXZlcy4iLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJFbmFibGUgXCJSZXRyeVwiIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkVuYWJsZSBcIlNob3cgc29sdXRpb25cIiBidXR0b24iCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiRW5hYmxlIFwiQ2hlY2tcIiBidXR0b24iCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiU2hvdyBzY29yZSBwb2ludHMiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIlNob3cgcG9pbnRzIGVhcm5lZCBmb3IgZWFjaCBhbnN3ZXIuIgogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNvcnJlY3QgYW5zd2VyIHRleHQiLAogICAgICAiZGVmYXVsdCI6ICJDb3JyZWN0ISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHVzZWQgdG8gaW5kaWNhdGUgdGhhdCBhbiBhbnN3ZXIgaXMgY29ycmVjdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbmNvcnJlY3QgYW5zd2VyIHRleHQiLAogICAgICAiZGVmYXVsdCI6ICJJbmNvcnJlY3QhIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdXNlZCB0byBpbmRpY2F0ZSB0aGF0IGFuIGFuc3dlciBpcyBpbmNvcnJlY3QiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWlzc2VkIGFuc3dlciB0ZXh0IiwKICAgICAgImRlZmF1bHQiOiAiQW5zd2VyIG5vdCBmb3VuZCEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB1c2VkIHRvIGluZGljYXRlIHRoYXQgYW4gYW5zd2VyIGlzIG1pc3NpbmciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRGVzY3JpcHRpb24gZm9yIERpc3BsYXkgU29sdXRpb24iLAogICAgICAiZGVmYXVsdCI6ICJUYXNrIGlzIHVwZGF0ZWQgdG8gY29udGFpbiB0aGUgc29sdXRpb24uIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRoaXMgdGV4dCB0ZWxscyB0aGUgdXNlciB0aGF0IHRoZSB0YXNrcyBoYXMgYmVlbiB1cGRhdGVkIHdpdGggdGhlIHNvbHV0aW9uLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0dWFsIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBzY29yZSBiYXIgZm9yIHRob3NlIHVzaW5nIGEgcmVhZHNwZWFrZXIiLAogICAgICAiZGVmYXVsdCI6ICJZb3UgZ290IDpudW0gb3V0IG9mIDp0b3RhbCBwb2ludHMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTGFiZWwgZm9yIHRoZSBmdWxsIHJlYWRhYmxlIHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJGdWxsIHJlYWRhYmxlIHRleHQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTGFiZWwgZm9yIHRoZSB0ZXh0IHdoZXJlIHdvcmRzIGNhbiBiZSBtYXJrZWQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJGdWxsIHRleHQgd2hlcmUgd29yZHMgY2FuIGJlIG1hcmtlZCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJTb2x1dGlvbiBtb2RlIGhlYWRlciBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIlNvbHV0aW9uIG1vZGUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2hlY2tpbmcgbW9kZSBoZWFkZXIgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJDaGVja2luZyBtb2RlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFzc2lzdGl2ZSB0ZWNobm9sb2d5IGRlc2NyaXB0aW9uIGZvciBcIkNoZWNrXCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiQ2hlY2sgdGhlIGFuc3dlcnMuIFRoZSByZXNwb25zZXMgd2lsbCBiZSBtYXJrZWQgYXMgY29ycmVjdCwgaW5jb3JyZWN0LCBvciB1bmFuc3dlcmVkLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJBc3Npc3RpdmUgdGVjaG5vbG9neSBkZXNjcmlwdGlvbiBmb3IgXCJTaG93IFNvbHV0aW9uXCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiU2hvdyB0aGUgc29sdXRpb24uIFRoZSB0YXNrIHdpbGwgYmUgbWFya2VkIHdpdGggaXRzIGNvcnJlY3Qgc29sdXRpb24uIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFzc2lzdGl2ZSB0ZWNobm9sb2d5IGRlc2NyaXB0aW9uIGZvciBcIlJldHJ5XCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiUmV0cnkgdGhlIHRhc2suIFJlc2V0IGFsbCByZXNwb25zZXMgYW5kIHN0YXJ0IHRoZSB0YXNrIG92ZXIgYWdhaW4uIgogICAgfQogIF0KfQo="],"libraries\/H5P.MarkTheWords-1.11\/language\/sr.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJNZWRpYSIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIlR5cCIsCiAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiVmFsZnJpIG1lZGlhIGF0dCB2aXNhIG92YW5mw7ZyIGZyw6VnYW4uIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkluYWt0aXZlcmEgem9vbW5pbmcgaSBiaWxkIgogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCe0L\/QuNGBINC30LDQtNCw0YLQutCwIiwKICAgICAgImRlc2NyaXB0aW9uIjogItCe0L\/QuNGI0LjRgtC1INC60LDQutC+INC60L7RgNC40YHQvdC40Log0YLRgNC10LHQsCDQtNCwINGA0LXRiNC4INC30LDQtNCw0YLQsNC6LiIsCiAgICAgICJwbGFjZWhvbGRlciI6ICLQmtC70LjQutC90LjRgtC1INC90LAg0YHQstC1INCz0LvQsNCz0L7Qu9C1INGDINGC0LXQutGB0YLRgyDQutC+0ZjQuCDRgdC70LXQtNC4LiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGC0YPQsNC70L3QviDQv9C+0ZnQtSIsCiAgICAgICJwbGFjZWhvbGRlciI6ICLQntCy0L4g0ZjQtSDQvtC00LPQvtCy0L7RgDogKtC+0LTQs9C+0LLQvtGAKi4iLAogICAgICAiaW1wb3J0YW50IjogewogICAgICAgICJkZXNjcmlwdGlvbiI6ICI8dWw+PGxpPtCe0LfQvdCw0YfQtdC90LUg0YDQtdGH0Lgg0LTQvtC00LDRmNGDINGB0LUg0LfQstC10LfQtNC40YbQvtC8ICgqKS48L2xpPjxsaT7Ql9Cy0LXQt9C00LjRhtC1INGB0LUg0LzQvtCz0YMg0LTQvtC00LDRgtC4INGDINC+0LfQvdCw0YfQtdC90LUg0YDQtdGH0Lgg0LTQvtC00LDQstCw0ZrQtdC8INC00YDRg9Cz0LUg0LfQstC10LfQtNC40YbQtSwgKtGC0LDRh9C90LDRgNC10YcqKiogPSZndDsg0YLQsNGH0L3QsNGA0LXRhyouPC9saT48L3VsPiIsCiAgICAgICAgImV4YW1wbGUiOiAi0KLQsNGH0L3QtSDRgNC10YfQuCDRgdGDINC+0LfQvdCw0YfQtdC90LUg0L7QstCw0LrQvjogKtGC0LDRh9C90LDRgNC10YcqLCDQvtCy0LDQutC+INGY0LUg0L3QsNC\/0LjRgdCw0L3QsCDQt9Cy0LXQt9C00LjRhtCwOiAq0YLQsNGH0L3QsNGA0LXRhyoqKi4iCiAgICAgIH0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQn9C+0LLRgNCw0YLQvdC1INC40L3RhNC+0YDQvNCw0YbQuNGY0LUiLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJ3aWRnZXRzIjogWwogICAgICAgICAgICB7CiAgICAgICAgICAgICAgImxhYmVsIjogItCj0L7QsdC40YfQsNGY0LXQvdC+IgogICAgICAgICAgICB9CiAgICAgICAgICBdLAogICAgICAgICAgImxhYmVsIjogItCU0LXRhNC40L3QuNGI0LjRgtC1INC\/0YDQuNC70LDQs9C+0ZLQtdC90LUg0L\/QvtCy0YDQsNGC0L3QtSDQuNC90YTQvtGA0LzQsNGG0LjRmNC1INC30LAg0LHQuNC70L4g0LrQvtGY0Lgg0L7Qv9GB0LXQsyDRgNC10LfRg9C70YLQsNGC0LAiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogItCa0LvQuNC60L3QuNGC0LUg0L3QsCBcItCU0L7QtNCw0Zgg0L7Qv9GB0LXQs1wiINC00YPQs9C80LUg0LfQsCDQtNC+0LTQsNCy0LDRmtC1INC+0L3QvtC70LjQutC+INC+0L\/RgdC10LPQsCDQutC+0LvQuNC60L4g0LLQsNC8INGY0LUg0L\/QvtGC0YDQtdCx0L3Qvi4g0J\/RgNC40LzQtdGAOiAwLTIwJSDQm9C+0Ygg0YDQtdC30YPQu9GC0LDRgiwgMjEtOTElINCf0YDQvtGB0LXRh9Cw0L0g0YDQtdC30YPQu9GC0LDRgiwgOTEtMTAwJSDQntC00LvQuNGH0LDQvSDRgNC10LfRg9C70YLQsNGCISIsCiAgICAgICAgICAiZW50aXR5IjogInJhbmdlIiwKICAgICAgICAgICJmaWVsZCI6IHsKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAi0KDQsNGB0L\/QvtC9INGA0LXQt9GD0LvRgtCw0YLQsCIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHt9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICLQn9C+0LLRgNCw0YLQvdC1INC40L3RhNC+0YDQvNCw0YbQuNGY0LUg0LfQsCDQtNC10YTQuNC90LjRgdCw0L3QuCDQvtC\/0YHQtdCzINGA0LXQt9GD0LvRgtCw0YLQsCIsCiAgICAgICAgICAgICAgICAicGxhY2Vob2xkZXIiOiAi0J\/QvtC\/0YPQvdC40YLQtSDQv9C+0LLRgNCw0YLQvdC1INC40L3RhNC+0YDQvNCw0YbQuNGY0LUiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQt9CwIFwi0J\/RgNC+0LLQtdGA0LhcIiDQtNGD0LPQvNC1IiwKICAgICAgImRlZmF1bHQiOiAi0J\/RgNC+0LLQtdGA0LgiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJTdWJtaXRcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJTdWJtaXQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJSZXRyeVwiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogItCf0L7QutGD0YjQsNGYINC\/0L7QvdC+0LLQviIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC30LAgXCLQn9GA0LjQutCw0LbQuCDRgNC10YjQtdGa0LBcIiDQtNGD0LPQvNC1IiwKICAgICAgImRlZmF1bHQiOiAi0J\/RgNC40LrQsNC20Lgg0YDQtdGI0LXRmtCwIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCf0L7RgdGC0LDQstC60LUg0L\/QvtC90LDRiNCw0ZrQsC4iLAogICAgICAiZGVzY3JpcHRpb24iOiAi0J7QstC1INC+0L\/RhtC40ZjQtSDRm9C1INCy0LDQvCDQvtC80L7Qs9GD0ZvQuNGC0Lgg0LTQsCDQutC+0L3RgtGA0L7Qu9C40YjQtdGC0LUg0L\/QvtC90LDRiNCw0ZrQtSDQt9Cw0LTQsNGC0LrQsC4iLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICLQntC80L7Qs9GD0ZvQuCBcItCS0YDQsNGC0LhcIiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICLQntC80L7Qs9GD0ZvQuCBcItCf0YDQuNC60LDQttC4INGA0LXRiNC10ZrQsFwiINC00YPQs9C80LUiCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAi0J7QvNC+0LPRg9Gb0LggXCLQn9GA0L7QstC10YDQuFwiINC00YPQs9C80LUiCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAi0J\/RgNC40LrQsNC20Lgg0LHQvtC00L7QstC1IiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICLQn9GA0LjQutCw0LbQuNGC0LUg0LHQvtC00L7QstC1INC30LAg0YHQstCw0LrQuCDQvtC00LPQvtCy0L7RgC4iCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQsNGH0LDQvSDQvtC00LPQvtCy0L7RgCDRgtC10LrRgdGCIiwKICAgICAgImRlZmF1bHQiOiAi0KLQsNGH0L3QviEiLAogICAgICAiZGVzY3JpcHRpb24iOiAi0KLQtdC60YHRgiDQutC+0ZjQuNC8INGB0LUg0YPQutCw0LfRg9GY0LUg0L3QsCDRgtCw0YfQvdC+0YHRgiDQvtC00LPQvtCy0L7RgNCwIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCf0L7Qs9GA0LXRiNCw0L0g0L7QtNCz0L7QstC+0YAg0YLQtdC60YHRgiIsCiAgICAgICJkZWZhdWx0IjogItCf0L7Qs9GA0LXRiNC90L4hIiwKICAgICAgImRlc2NyaXB0aW9uIjogItCi0LXQutGB0YIg0LrQvtGY0Lgg0YHQtSDQutC+0YDQuNGB0YLQuCDQtNCwINGD0LrQsNC20LUg0LTQsCDRmNC1INC+0LTQs9C+0LLQvtGAINC90LXRgtCw0YfQsNC9IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0LXQutGB0YIg0L\/RgNC+0L\/Rg9GI0YLQtdC90L7QsyDQvtC00LPQvtCy0L7RgNCwIiwKICAgICAgImRlZmF1bHQiOiAi0J7QtNCz0L7QstC+0YAg0L3QuNGY0LUg0L\/RgNC+0L3QsNGS0LXQvSEiLAogICAgICAiZGVzY3JpcHRpb24iOiAi0KLQtdC60YHRgiDQutC+0ZjQuNC8INGB0LUg0L7Qt9C90LDRh9Cw0LLQsCDQtNCwINC+0LTQs9C+0LLQvtGAINC90LXQtNC+0YHRgtCw0ZjQtSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQntCx0ZjQsNGI0ZrQtdGa0LUg0LfQsCDQn9GA0LjQutCw0LbQuCDRgNC10YjQtdGa0LAiLAogICAgICAiZGVmYXVsdCI6ICLQl9Cw0LTQsNGC0LDQuiDRmNC1INCw0LbRg9GA0LjRgNCw0L0g0YLQsNC60L4g0LTQsCDRgdCw0LTRgNC20Lgg0YDQtdGI0LXRmtC1LiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLQntCy0LDRmCDRgtC10LrRgdGCINCz0L7QstC+0YDQuCDQutC+0YDQuNGB0L3QuNC60YMg0LTQsCDRgdGDINC30LDQtNCw0YbQuCDQsNC20YPRgNC40YDQsNC90Lgg0YDQtdGI0LXRmtC10LwuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0LXQutGB0YLRg9Cw0LvQvdC4INC\/0YDQuNC60LDQtyDQsdC+0LTQvtCy0L3QtSDRgtGA0LDQutC1INC30LAg0L7QvdC1INC60L7RmNC4INC60L7RgNC40YHRgtC1INGH0LjRgtCw0Ycg0LfQstGD0LrQsCIsCiAgICAgICJkZWZhdWx0IjogItCe0YHQstC+0ZjQuNC70Lgg0YHRgtC1IDpudW0g0L7QtCA6dG90YWwg0L\/QvtC10L3QsCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQntC30L3QsNC60LAg0LfQsCDRh9C40YLQsNCyINGC0LXQutGB0YIg0LfQsCDQv9C+0LzQvtGb0L3QtSDRgtC10YXQvdC+0LvQvtCz0LjRmNC1IiwKICAgICAgImRlZmF1bHQiOiAi0KfQuNGC0LDQsiDRgtC10LrRgdGCIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCe0LfQvdCw0LrQsCDQt9CwINGC0LXQutGB0YIg0LPQtNC1INGB0LUg0YDQtdGH0Lgg0LzQvtCz0YMg0L7Qt9C90LDRh9C40YLQuCDQt9CwINC\/0L7QvNC+0ZvQvdC1INGC0LXRhdC90L7Qu9C+0LPQuNGY0LUiLAogICAgICAiZGVmYXVsdCI6ICLQn9GD0L0g0YLQtdC60YHRgiDRgyDQutC+0LzQtSDRgdC1INGA0LXRh9C4INC80L7Qs9GDINC+0LHQtdC70LXQttC40YLQuCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQl9Cw0LPQu9Cw0LLRmdC1INGA0LXQttC40LzQsCDRgNC10YjQtdGa0LAg0LfQsCDQv9C+0LzQvtGb0L3QtSDRgtC10YXQvdC+0LvQvtCz0LjRmNC1IiwKICAgICAgImRlZmF1bHQiOiAi0KDQtdGI0LXRmtCwIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCX0LDQs9C70LDQstGZ0LUg0YDQtdC20LjQvNCwINC\/0YDQvtCy0LXRgNC1INC30LAg0L\/QvtC80L7Rm9C90LUg0YLQtdGF0L3QvtC70L7Qs9C40ZjQtSIsCiAgICAgICJkZWZhdWx0IjogItCg0LXQttC40Lwg0L\/RgNC+0LLQtdGA0LUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0J7Qv9C40YEg0L\/QvtC80L7Rm9C90LUg0YLQtdGF0L3QvtC70L7Qs9C40ZjQtSDQt9CwIFwi0J\/RgNC+0LLQtdGA0LhcIiDQtNGD0LPQvNC1IiwKICAgICAgImRlZmF1bHQiOiAi0J\/RgNC+0LLQtdGA0LjRgtC1INC+0LTQs9C+0LLQvtGA0LUuINCe0LTQs9C+0LLQvtGA0Lgg0ZvQtSDQsdC40YLQuCDQvtC30L3QsNGH0LXQvdC4INC60LDQviDRgtCw0YfQvdC4LCDQvdC10YLQsNGH0L3QuCDQuNC70Lgg0LHQtdC3INC+0LTQs9C+0LLQvtGA0LAuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCe0L\/QuNGBINC\/0L7QvNC+0ZvQvdC1INGC0LXRhdC90L7Qu9C+0LPQuNGY0LUg0LfQsCBcItCf0YDQuNC60LDQttC4INGA0LXRiNC10ZrQsFwiINC00YPQs9C80LUiLAogICAgICAiZGVmYXVsdCI6ICLQn9C+0LrQsNC20LjRgtC1INGA0LXRiNC10ZrQtS4g0JfQsNC00LDRgtCw0Log0ZvQtSDQsdC40YLQuCDQvtC30L3QsNGH0LXQvSDRgdCy0L7RmNC40Lwg0YLQsNGH0L3QuNC8INGA0LXRiNC10ZrQtdC8LiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQntC\/0LjRgSDQv9C+0LzQvtGb0L3QtSDRgtC10YXQvdC+0LvQvtCz0LjRmNC1INC30LAgXCLQktGA0LDRgtC4XCIg0LTRg9Cz0LzQtSIsCiAgICAgICJkZWZhdWx0IjogItCf0L7QutGD0YjQsNGY0YLQtSDQv9C+0L3QvtCy0L4g0YHQsCDQt9Cw0LTQsNGC0LrQvtC8LiDQoNC10YHQtdGC0YPRmNGC0LUg0YHQstC1INC+0LTQs9C+0LLQvtGA0LUg0Lgg0L\/QvtC60YDQtdC90LjRgtC1INC30LDQtNCw0YLQsNC6INC\/0L7QvdC+0LLQvi4iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.MarkTheWords-1.11\/language\/sv.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJNZWRpYSIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIlR5cCIsCiAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiVmFsZnJpIG1lZGlhIGF0dCB2aXNhIG92YW5mw7ZyIGZyw6VnYW4uIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkluYWt0aXZlcmEgem9vbW5pbmcgYXYgYmlsZCIKICAgICAgICB9CiAgICAgIF0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJVcHBnaWZ0c2Jlc2tyaXZuaW5nIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkJlc2tyaXYgaHVyIGFudsOkbmRhcmVuIHNrYSBsw7ZzYSB1cHBnaWZ0ZW4uIiwKICAgICAgInBsYWNlaG9sZGVyIjogIktsaWNrYSBww6UgYWxsYSB2ZXJiIGkgZsO2bGphbmRlIHRleHQuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHRmw6RsdCIsCiAgICAgICJwbGFjZWhvbGRlciI6ICJEZXQgaMOkciDDpHIgZXR0IHN2YXI6ICpzdmFyKi4iLAogICAgICAiaW1wb3J0YW50IjogewogICAgICAgICJkZXNjcmlwdGlvbiI6ICI8dWw+PGxpPk1hcmtlcmFkZSBvcmQgbMOkZ2cgdGlsbCBtZWQgYXN0ZXJpc2sgKCopLjwvbGk+PGxpPkFzdGVyaXNrZXIga2FuIHNrcml2YXMgaW5uZSBpIG1hcmtlcmFkZSBvcmQgZ2Vub20gYXR0IG1hbiBsw6RnZ2VyIHRpbGwgZW4gZXh0cmEgYXN0ZXJpc2ssICpyw6R0dG9yZCoqKiA9Jmd0OyByw6R0dG9yZCouPC9saT48L3VsPiIsCiAgICAgICAgImV4YW1wbGUiOiAiRGUgcsOkdHRhIG9yZGVuIG1hcmtlcmFzIHPDpSBow6RyOiAqcsOkdHRvcmQqLCBlbiBhc3RlcmlzayBza3JpdnMgc8OlIGjDpHI6ICpyw6R0dG9yZCoqKi4iCiAgICAgIH0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJBbGxtw6RuIGZlZWRiYWNrIiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAid2lkZ2V0cyI6IFsKICAgICAgICAgICAgewogICAgICAgICAgICAgICJsYWJlbCI6ICJTdGFuZGFyZCIKICAgICAgICAgICAgfQogICAgICAgICAgXSwKICAgICAgICAgICJsYWJlbCI6ICJEZWZpbmllcmEgYW5wYXNzYWQgZmVlZGJhY2sgZsO2ciB2YXJqZSBwb8OkbmduaXbDpSIsCiAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiS2xpY2thIHDDpSBcIkzDpGdnIHRpbGwgbml2w6VcIiBrbmFwcGVuIGbDtnIgYXR0IGzDpGdnYSB0aWxsIHPDpSBtw6VuZ2Egbml2w6VlciBkdSBiZWjDtnZlci4gRXhlbXBlbDogMC0yMCUgTMOlZyBuaXbDpSwgMjEtOTElIE1lbGxhbm5pdsOlLCA5MS0xMDAlIEjDtmcgbml2w6UhIiwKICAgICAgICAgICJlbnRpdHkiOiAibml2w6UiLAogICAgICAgICAgImZpZWxkIjogewogICAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJQb8OkbmduaXbDpSIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHt9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJGZWVkYmFjayBmw7ZyIGRlZmluaWVyYWQgcG\/DpG5nbml2w6UiLAogICAgICAgICAgICAgICAgInBsYWNlaG9sZGVyIjogIkZ5bGwgaSBmZWVkYmFjayIKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIF0KICAgICAgICAgIH0KICAgICAgICB9CiAgICAgIF0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGbDtnIga25hcHBlbiBcIlN2YXJhXCIiLAogICAgICAiZGVmYXVsdCI6ICJTdmFyYSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBcIlN1Ym1pdFwiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlN1Ym1pdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBcIkbDtnJzw7ZrIGlnZW5cIiBrbmFwcCIsCiAgICAgICJkZWZhdWx0IjogIkbDtnJzw7ZrIGlnZW4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmw7ZyIGtuYXBwZW4gXCJWaXNhIGzDtnNuaW5nXCIiLAogICAgICAiZGVmYXVsdCI6ICJWaXNhIGzDtnNuaW5nIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkJldGVlbmRlLWluc3TDpGxsbmluZ2FyIiwKICAgICAgImRlc2NyaXB0aW9uIjogIkRlIGjDpHIgYWx0ZXJuYXRpdmVuIGzDpXRlciBkaWcgc3R5cmEgaHVyIHVwcGdpZnRlbiBmdW5nZXJhci4iLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJBa3RpdmVyYSBcIkbDtnJzw7ZrIGlnZW5cIiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJBa3RpdmVyYSBrbmFwcGVuIFwiVmlzYSBsw7ZzbmluZ1wiIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkFrdGl2ZXJhIGtuYXBwZW4gXCJTdmFyYVwiIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIlZpc2EgcG\/DpG5nIiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJWaXNhIHBvw6RuZyBwZXIgc3Zhci4iCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCB2aWQgcsOkdHQgc3ZhciIsCiAgICAgICJkZWZhdWx0IjogIlLDpHR0ISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHNvbSB2aXNhciBhdHQgZXR0IHN2YXIgw6RyIHLDpHR0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgdmlkIGZlbCBzdmFyIiwKICAgICAgImRlZmF1bHQiOiAiRmVsISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHNvbSB2aXNhciBhdHQgZXR0IHN2YXIgw6RyIGZlbCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IHZpZCBzYWtuYXQgc3ZhciIsCiAgICAgICJkZWZhdWx0IjogIlN2YXIgc2FrbmFzISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHNvbSB2aXNhciBhdHQgZXR0IHN2YXIgc2FrbmFzIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkJlc2tyaXZuaW5nIGbDtnIgVmlzYSBsw7ZzbmluZyIsCiAgICAgICJkZWZhdWx0IjogIlVwcGdpZnRlbiBoYXIgdXBwZGF0ZXJhdHMgc8OlIGF0dCBsw7ZzbmluZ2VuIGluZ8Olci4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiRGVuIGjDpHIgdGV4dGVuIGJlcsOkdHRhciBmw7ZyIGFudsOkbmRhcmVuIGF0dCB1cHBnaWZ0ZW4gaGFyIHVwcGRhdGVyYXRzIG1lZCBsw7ZzbmluZ2VuLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IHNvbSBhbnbDpG5kcyBmw7ZyIGF0dCBwcmVzZW50ZXJhIHBvw6RuZyBmw7ZyIGFudsOkbmRhcmUgbWVkIHNrw6RybWzDpHNhcmUiLAogICAgICAiZGVmYXVsdCI6ICJEdSBmaWNrIDpudW0gYXYgOnRvdGFsIHBvw6RuZyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFdGlrZXR0IGbDtnIgZGVuIGZ1bGxzdMOkbmRpZ2EgbMOkc2JhcmEgdGV4dGVuIGbDtnIgdGlsbGfDpG5nbGlnaGV0c2hqw6RscG1lZGVsIiwKICAgICAgImRlZmF1bHQiOiAiRnVsbHN0w6RuZGlnIGzDpHNiYXIgdGV4dCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJFdGlrZXR0IGbDtnIgdGV4dGVuIGTDpHIgb3JkIGthbiBtYXJrZXJhcywgZsO2ciB0aWxsZ8OkbmdsaWdoZXRzaGrDpGxwbWVkZWwiLAogICAgICAiZGVmYXVsdCI6ICJGdWxsc3TDpG5kaWcgdGV4dCBkw6RyIG9yZCBrYW4gbWFya2VyYXMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUnVicmlrIGbDtnIgbMO2c25pbmdzbMOkZ2UsIGbDtnIgdGlsbGfDpG5nbGlnaGV0c2hqw6RscG1lZGVsIiwKICAgICAgImRlZmF1bHQiOiAiTMO2c25pbmdzbMOkZ2UiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiUnVicmlrIGbDtnIgcsOkdHRuaW5nc2zDpGdlIGbDtnIgdGlsbGfDpG5nbGlnaGV0c2hqw6RscG1lZGVsIiwKICAgICAgImRlZmF1bHQiOiAiUsOkdHRuaW5nc2zDpGdlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkJlc2tyaXZuaW5nIGF2IGtuYXBwZW4gXCJTdmFyYVwiIGbDtnIgdGlsbGfDpG5nbGlnaGV0c2hqw6RscG1lZGVsIiwKICAgICAgImRlZmF1bHQiOiAiUsOkdHRhIHN2YXJlbi4gU3ZhcmVuIGtvbW1lciBhdHQgbWFya2VyYXMgc29tIGtvcnJla3RhLCBmZWxha3RpZ2EgZWxsZXIgb2Jlc3ZhcmFkZS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQmVza3Jpdm5pbmcgYXYga25hcHBlbiBcIlZpc2EgbMO2c25pbmdcIiBmw7ZyIHRpbGxnw6RuZ2xpZ2hldHNoasOkbHBtZWRlbCIsCiAgICAgICJkZWZhdWx0IjogIlZpc2EgbMO2c25pbmdlbi4gVXBwZ2lmdGVuIGtvbW1lciBhdHQgbWFya2VyYXMgbWVkIGRlc3MgcsOkdHRhIGzDtnNuaW5nLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZXNrcml2bmluZyBhdiBrbmFwcGVuIFwiRsO2cnPDtmsgaWdlblwiIGbDtnIgdGlsbGfDpG5nbGlnaGV0c2hqw6RscG1lZGVsIiwKICAgICAgImRlZmF1bHQiOiAiR8O2ciBldHQgbnl0dCBmw7Zyc8O2ayBww6UgdXBwZ2lmdGVuLiBOb2xsc3TDpGxsZXIgYWxsYSBzdmFyIG9jaCBzdGFydGFyIG9tIHVwcGdpZnRlbi4iCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.MarkTheWords-1.11\/language\/sw.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJWeW9tYm8gdnlhIGhhYmFyaSIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkFpbmEiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIlZ5b21ibyB2eWEgaGFiYXJpIHZ5YSBoaWFyaSB2eWEga3Vvbnllc2hhIGp1dSB5YSBzd2FsaS4iCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiWmltYSB1a3V6YWppIHdhIHBpY2hhIgogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk1hZWxlem8geWEga2F6aSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJFbGV6YSBqaW5zaSBnYW5pIG10dW1pYWppIGFuYXBhc3dhIGt1dGF0dWEga2F6aS4iLAogICAgICAicGxhY2Vob2xkZXIiOiAiQm9meWEga3dlbnllIHZpdGVuemkgdnlvdGUga2F0aWthIG1hYW5kaXNoaSB5YW5heW9mdWF0YS4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRW5lbyBsYSBtYWFuZGlzaGkiLAogICAgICAicGxhY2Vob2xkZXIiOiAiSGlsaSBuaSBqaWJ1OiAqamlidSouIiwKICAgICAgImltcG9ydGFudCI6IHsKICAgICAgICAiZGVzY3JpcHRpb24iOiAiPHVsPjxsaT5NYW5lbm8geWFsaXlvd2Vrd2EgYWxhbWEgaHVvbmdlendhIG5hIG55b3RhICgqKS48L2xpPjxsaT5OeW90YSB6aW5hd2V6YSBrdW9uZ2V6d2EgbmRhbmkgeWEgbWFuZW5vIHlhbGl5b3dla3dhIGFsYW1hIGt3YSBrdW9uZ2V6YSBueW90YSBueWluZ2luZSwgKm5lbm8gc2FoaWhpICoqKiA9Jmd0OyBuZW5vIHNhaGloaSouPC9saT48L3VsPiIsCiAgICAgICAgImV4YW1wbGUiOiAiTWFuZW5vIHNhaGloaSB5YW1ld2Vrd2EgYWxhbWEga2FtYSBoaWk6ICpuZW5vIHNhaGloaSosIG55b3RhIGltZWFuZGlrd2EgaGl2aTogKm5lbm8gc2FoaWhpKioqLiIKICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk1hb25pIHlhIEp1bWxhIiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAid2lkZ2V0cyI6IFsKICAgICAgICAgICAgewogICAgICAgICAgICAgICJsYWJlbCI6ICJDaGFndW8tbXNpbmdpIgogICAgICAgICAgICB9CiAgICAgICAgICBdLAogICAgICAgICAgImxhYmVsIjogIkJhaW5pc2hhIG1hb25pIG1hYWx1bSBrd2EgbWFzYWZhIHlveW90ZSB5YSBhbGFtYSIsCiAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiQm9meWEga2l0dWZlIGNoYSBcIk9uZ2V6YSBtYXNhZmFcIiBpbGkga3VvbmdlemEgbWFzYWZhIG1lbmdpIHVuYXZ5b2hpdGFqaS4gTWZhbm86IDAtMjAlIEFsYW1hIG1iYXlhLCAyMS05MSUgQWxhbWEgeWEgV2FzdGFuaSwgOTEtMTAwJSBBbGFtYSBOenVyaSEiLAogICAgICAgICAgImVudGl0eSI6ICJtYXNhZmEiLAogICAgICAgICAgImZpZWxkIjogewogICAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJNYXNhZmEgeWEgQWxhbWEiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7fSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiTWFvbmkga3dhIG1hc2FmYSB5YSBhbGFtYSB5YWxpeW9mYWZhbnVsaXdhIiwKICAgICAgICAgICAgICAgICJwbGFjZWhvbGRlciI6ICJKYXphIG1hb25pIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk1hYW5kaXNoaSB5YSBraXR1ZmUgY2hhIFwiV2VrYSBhbGFtYVwiIiwKICAgICAgImRlZmF1bHQiOiAiV2VrYSBhbGFtYSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJNYWFuZGlzaGkgeWEga2l0dWZlIGNoYSBcIldhc2lsaXNoYVwiIiwKICAgICAgImRlZmF1bHQiOiAiV2FzaWxpc2hhIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk1hYW5kaXNoaSBrd2Ega2l0dWZlIGNoYSBcIkphcmlidSB0ZW5hXCIiLAogICAgICAiZGVmYXVsdCI6ICJKYXJpYnUgdGVuYSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJNYWFuZGlzaGkga3dhIGtpdHVmZSBjaGEgXCJPbnllc2hhIHN1bHVoaXNob1wiIiwKICAgICAgImRlZmF1bHQiOiAiT255ZXNoYSBzdWx1aGlzaG8iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWlwYW5naWxpbyB5YSB0YWJpYS4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiQ2hhZ3V6aSBoaXppIHppdGFrdXdlemVzaGEga3VkaGliaXRpIGppbnNpIGthemkgaW5hdnlvZmFueWEuIiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiV2V6ZXNoYSBcIkphcmlidSB0ZW5hXCIiCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiV2V6ZXNoYSBraXR1ZmUgY2hhIFwiT255ZXNoYSBzdWx1aGlzaG9cIiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJXZXplc2hhIGtpdHVmZSBjaGEgXCJXZWthIGFsYW1hXCIiCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiT255ZXNoYSBwb2ludGkgemEgYWxhbWEiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9ueWVzaGEgcG9pbnRpIHppbGl6b3BhdGlrYW5hIGt3YSBraWxhIGppYnUuIgogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk1hYW5kaXNoaSB5YSBqaWJ1IHNhaGloaSIsCiAgICAgICJkZWZhdWx0IjogIlNhaGloaSEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiTWFhbmRpc2hpIHlhbmF5b3R1bWlrYSBrdW9ueWVzaGEga3V3YSBqaWJ1IG5pIHNhaGloaSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJNYWFuZGlzaGkgeWEgamlidSBsaXNpbG8gc2FoaWhpIiwKICAgICAgImRlZmF1bHQiOiAiU2l5byBzYWhpaGkhIiwKICAgICAgImRlc2NyaXB0aW9uIjogIk1hYW5kaXNoaSB5YW5heW90dW1pa2Ega3Vvbnllc2hhIGt1d2EgamlidSBzaXlvIHNhaGloaSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJNYWFuZGlzaGkgeWEgamlidSBsaWxpbG9rb3Nla2FuYSIsCiAgICAgICJkZWZhdWx0IjogIkppYnUgaGFsaXBhdGlrYW5pISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJNYWFuZGlzaGkgeWFuYXlvdHVtaWthIGt1b255ZXNoYSBrdXdhIGppYnUgaGFsaXBvIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk1hZWxlem8geWEgU3VsdWhpc2hvIGxhIEt1b255ZXNoYSIsCiAgICAgICJkZWZhdWx0IjogIkthemkgaW1lc2FzaXNod2EgaWxpIGt1d2EgbmEgc3VsdWhpc2hvLiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJLaWZ1bmd1IGhpa2kga2luYW13YW1iaWEgbXR1bWlhamkga3dhbWJhIGthemkgemltZXNhc2lzaHdhIG5hIHN1bHVoaXNobyBoaWxvLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJVd2FraWxpc2hpIHdhIG1hYW5kaXNoaSB3YSB1cGF1IHdhIGFsYW1hIGt3YSB3YWxlIHdhbmFvdHVtaWEga2lzb21hIG1hYW5kaXNoaSIsCiAgICAgICJkZWZhdWx0IjogIlVtZXBhdGEgOm51bSBrYXRpIHlhIGFsYW1hOnRvdGFsIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkxlYm8geWEgbWFhbmRpc2hpIGthbWlsaSB5YW5heW9zb21la2Ega3dhIHRla25vbG9qaWEgemEgdXNhaWRpemkiLAogICAgICAiZGVmYXVsdCI6ICJNYWFuZGlzaGkgeWFuYXlvc29tZWthIGtpa2FtaWxpZnUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTGVibyBrd2EgbWFhbmRpc2hpIGFtYmFwbyBtYW5lbm8geWFuYXdlemEga3V3ZWt3YSBhbGFtYSBrd2EgdGVrbm9sb2ppYSB6YSB1c2FpZGl6aSIsCiAgICAgICJkZWZhdWx0IjogIk1hYW5kaXNoaSBrYW1pbGkgYW1iYXBvIG1hbmVubyB5YW5hd2V6YSBrdXdla3dhIGFsYW1hIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIktpY2h3YSBjaGEgbmppYSB5YSBzdWx1aGlzaG8ga3dhIHRla25vbG9qaWEgemEgdXNhaWRpemkiLAogICAgICAiZGVmYXVsdCI6ICJOamlhIHlhIHN1bHVoaXNobyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJLaWNod2EgY2hhIG5qaWEgeWEga3V3ZWthIGFsYW1hIGt3YSB0ZWtub2xvamlhIHphIHVzYWlkaXppIiwKICAgICAgImRlZmF1bHQiOiAiTmppYSB5YSBrdXdla2EgYWxhbWEiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWFlbGV6byB5YSB0ZWtub2xvamlhIHlhIHVzYWlkaXppIGt3YSBraXR1ZmUgY2hhIFwiV2VrYSBhbGFtYVwiIiwKICAgICAgImRlZmF1bHQiOiAiV2VrYSBhbGFtYSBtYWppYnUuIE1hamlidSB5YXRhdGl3YSBhbGFtYSBrdXdhIHNhaGloaSwgc2l5byBzYWhpaGkgYXUgaGFpamFqaWJpd2EuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk1hZWxlem8geWEgdGVrbm9sb2ppYSB5YSB1c2FpZGl6aSBrd2Ega2l0dWZlIGNoYSBcIk9ueWVzaGEgU3VsdWhpc2hvXCIiLAogICAgICAiZGVmYXVsdCI6ICJPbnllc2hhIHN1bHVoaXNobyBoaWxvLiBLYXppIGhpeW8gaXRhd2Vrd2EgYWxhbWEgbmEgc3VsdWhpc2hvIGxha2Ugc2FoaWhpLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJNYWVsZXpvIHlhIHRla25vbG9qaWEgeWEgdXNhaWRpemkga3dhIGtpdHVmZSBjaGEgXCJKYXJpYnUgdGVuYVwiIiwKICAgICAgImRlZmF1bHQiOiAiSmFyaWJ1IHRlbmEga2F6aSBoaXlvLiBXZWthIHVweWEgbWFqaWJ1IHlvdGUgbmEgdWFuemUga2F6aSB0ZW5hLiIKICAgIH0KICBdCn0K"],"libraries\/H5P.MarkTheWords-1.11\/language\/th.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLguKrguLfguYjguK0iLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICLguJvguKPguLDguYDguKDguJciLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIuC4quC4t+C5iOC4reC4l+C4teC5iOC5gOC4peC4t+C4reC4geC5geC4quC4lOC4h+C5gOC4q+C4meC4t+C4reC4hOC4s+C4luC4suC4oSAo4LmE4Lih4LmI4LiI4Liz4LmA4Lib4LmH4LiZ4LiV4LmJ4Lit4LiH4LmD4Liq4LmIKSIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICLguJvguLTguJTguIvguLnguKHguKPguLnguJvguKDguLLguJ4iCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4LiE4Liz4Lit4LiY4Li04Lia4Liy4Lii4LiH4Liy4LiZIiwKICAgICAgImRlc2NyaXB0aW9uIjogIuC4reC4mOC4tOC4muC4suC4ouC4p+C4tOC4mOC4teC4l+C4teC5iOC4nOC4ueC5ieC5g+C4iuC5ieC4hOC4p+C4o+C5geC4geC5ieC4m+C4seC4jeC4q+C4siIsCiAgICAgICJwbGFjZWhvbGRlciI6ICLguITguKXguLTguIHguJfguLXguYjguITguLPguIHguKPguLTguKLguLLguJfguLHguYnguIfguKvguKHguJTguYPguJnguILguYnguK3guITguKfguLLguKHguJfguLXguYjguJXguLLguKHguKHguLIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4LiK4LmI4Lit4LiH4LiC4LmJ4Lit4LiE4Lin4Liy4LihIiwKICAgICAgInBsYWNlaG9sZGVyIjogIuC4meC4teC5iOC4hOC4t+C4reC4hOC4s+C4leC4reC4mjogKuC4hOC4s+C4leC4reC4miouIiwKICAgICAgImltcG9ydGFudCI6IHsKICAgICAgICAiZGVzY3JpcHRpb24iOiAiPHVsPjxsaT7guITguLPguJfguLXguYjguJbguLnguIHguJfguLPguYDguITguKPguLfguYjguK3guIfguKvguKHguLLguKLguJTguYnguKfguKLguYDguITguKPguLfguYjguK3guIfguKvguKHguLLguKLguJTguK3guIHguIjguLHguJkgKCopPC9saT48bGk+4LiU4Lit4LiB4LiI4Lix4LiZ4Liq4Liy4Lih4Liy4Lij4LiW4LiW4Li54LiB4LmA4Lie4Li04LmI4Lih4LmD4LiZ4LiE4Liz4LiX4Li14LmI4LiW4Li54LiB4LiX4Liz4LmA4LiE4Lij4Li34LmI4Lit4LiH4Lir4Lih4Liy4Lii4LmE4LiU4LmJ4LmC4LiU4Lii4LiB4Liy4Lij4LmA4Lie4Li04LmI4Lih4LiU4Lit4LiB4LiI4Lix4LiZ4Lit4Li14LiB4LiV4Lix4LinIOC5gOC4iuC5iOC4mSAq4LiE4Liz4LiX4Li14LmI4LiW4Li54LiB4LiV4LmJ4Lit4LiHKioqID0mZ3Q7IOC4hOC4s+C4l+C4teC5iOC4luC4ueC4geC4leC5ieC4reC4hyo8L2xpPjwvdWw+IiwKICAgICAgICAiZXhhbXBsZSI6ICLguITguLPguJfguLXguYjguJbguLnguIHguJXguYnguK3guIfguJbguLnguIHguJfguLPguYDguITguKPguLfguYjguK3guIfguKvguKHguLLguKLguJTguYnguKfguKLguJTguK3guIHguIjguLHguJk6ICrguITguLPguJfguLXguYjguJbguLnguIHguJXguYnguK3guIcqIOC4lOC4reC4geC4iOC4seC4meC4luC4ueC4geC5gOC4guC4teC4ouC4meC4lOC5ieC4p+C4ouC4o+C4ueC4m+C5geC4muC4muC4meC4teC5iTogKuC4hOC4s+C4l+C4teC5iOC4luC4ueC4geC4leC5ieC4reC4hyoqKiIKICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuC4guC5ieC4reC5gOC4quC4meC4reC5geC4meC4sOC4l+C4seC5ieC4h+C4q+C4oeC4lCIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgICAgIHsKICAgICAgICAgICAgICAibGFiZWwiOiAi4LiE4LmI4Liy4LmA4Lij4Li04LmI4Lih4LiV4LmJ4LiZIgogICAgICAgICAgICB9CiAgICAgICAgICBdLAogICAgICAgICAgImxhYmVsIjogIuC4geC4s+C4q+C4meC4lOC4guC5ieC4reC5gOC4quC4meC4reC5geC4meC4sOC4quC4s+C4q+C4o+C4seC4muC4iuC5iOC4p+C4h+C4hOC4sOC5geC4meC4meC5g+C4lCDguYYiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIuC4hOC4peC4tOC4geC4l+C4teC5iOC4m+C4uOC5iOC4oSBcIuC5gOC4nuC4tOC5iOC4oeC4iuC5iOC4p+C4h1wiIOC5gOC4nuC4t+C5iOC4reC5gOC4nuC4tOC5iOC4oeC4iuC5iOC4p+C4h+C5hOC4lOC5ieC4leC4suC4oeC4leC5ieC4reC4h+C4geC4suC4oyDguYDguIrguYjguJkgMC0yMCUg4LiE4Liw4LmB4LiZ4LiZ4LiV4LmI4LizLCAyMS05MSUg4LiE4Liw4LmB4LiZ4LiZ4Lib4Liy4LiZ4LiB4Lil4Liy4LiHLCA5MS0xMDAlIOC4hOC4sOC5geC4meC4meC4lOC4teC4oeC4suC4gSEiLAogICAgICAgICAgImVudGl0eSI6ICLguIrguYjguKfguIciLAogICAgICAgICAgImZpZWxkIjogewogICAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICLguIrguYjguKfguIfguITguLDguYHguJnguJkiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7fSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAi4LiC4LmJ4Lit4LmA4Liq4LiZ4Lit4LmB4LiZ4Liw4Liq4Liz4Lir4Lij4Lix4Lia4LiK4LmI4Lin4LiH4LiE4Liw4LmB4LiZ4LiZ4LiX4Li14LmI4LiB4Liz4Lir4LiZ4LiUIiwKICAgICAgICAgICAgICAgICJwbGFjZWhvbGRlciI6ICLguYPguKrguYjguILguYnguK3guYDguKrguJnguK3guYHguJnguLAiCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4Liq4Liz4Lir4Lij4Lix4Lia4Lib4Li44LmI4LihIFwi4LiV4Lij4Lin4LiI4Liq4Lit4LiaXCIiLAogICAgICAiZGVmYXVsdCI6ICLguJXguKPguKfguIjguKrguK3guJoiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4Liq4Liz4Lir4Lij4Lix4Lia4Lib4Li44LmI4LihIFwi4Liq4LmI4LiHXCIiLAogICAgICAiZGVmYXVsdCI6ICLguKrguYjguIciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4Liq4Liz4Lir4Lij4Lix4Lia4Lib4Li44LmI4LihIFwi4Lil4Lit4LiH4LmD4Lir4Lih4LmIXCIiLAogICAgICAiZGVmYXVsdCI6ICLguKXguK3guIfguYPguKvguKHguYgiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4Liq4Liz4Lir4Lij4Lix4Lia4Lib4Li44LmI4LihIFwi4LmB4Liq4LiU4LiH4LiE4Liz4LiV4Lit4LiaXCIiLAogICAgICAiZGVmYXVsdCI6ICLguYHguKrguJTguIfguITguLPguJXguK3guJoiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4LiB4Liy4Lij4LiV4Lix4LmJ4LiH4LiE4LmI4Liy4Lie4Lik4LiV4Li04LiB4Lij4Lij4LihIiwKICAgICAgImRlc2NyaXB0aW9uIjogIuC4leC4seC4p+C5gOC4peC4t+C4reC4geC5gOC4q+C4peC5iOC4suC4meC4teC5ieC4iOC4sOC4iuC5iOC4p+C4ouC4hOC4uOC4k+C4hOC4p+C4muC4hOC4uOC4oeC4nuC4pOC4leC4tOC4geC4o+C4o+C4oeC4guC4reC4h+C4h+C4suC4mSIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIuC5gOC4m+C4tOC4lOC5g+C4iuC5ieC4h+C4suC4mSBcIuC4peC4reC4h+C5g+C4q+C4oeC5iFwiIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIuC5gOC4m+C4tOC4lOC5g+C4iuC5ieC4h+C4suC4meC4m+C4uOC5iOC4oSBcIuC5geC4quC4lOC4h+C4hOC4s+C4leC4reC4mlwiIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIuC5gOC4m+C4tOC4lOC5g+C4iuC5ieC4h+C4suC4meC4m+C4uOC5iOC4oSBcIuC4leC4o+C4p+C4iOC4quC4reC4mlwiIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIuC5geC4quC4lOC4h+C4hOC4sOC5geC4meC4mSIsCiAgICAgICAgICAiZGVzY3JpcHRpb24iOiAi4LmB4Liq4LiU4LiH4LiE4Liw4LmB4LiZ4LiZ4LiX4Li14LmI4LmE4LiU4LmJ4Lij4Lix4Lia4Liq4Liz4Lir4Lij4Lix4Lia4LiE4Liz4LiV4Lit4Lia4LmB4LiV4LmI4Lil4Liw4LiC4LmJ4LitIgogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuC4guC5ieC4reC4hOC4p+C4suC4oeC4hOC4s+C4leC4reC4muC4l+C4teC5iOC4luC4ueC4geC4leC5ieC4reC4hyIsCiAgICAgICJkZWZhdWx0IjogIuC4luC4ueC4geC4leC5ieC4reC4hyEiLAogICAgICAiZGVzY3JpcHRpb24iOiAi4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LiX4Li14LmI4LmD4LiK4LmJ4LmB4Liq4LiU4LiH4Lin4LmI4Liy4LiE4Liz4LiV4Lit4Lia4LiW4Li54LiB4LiV4LmJ4Lit4LiHIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuC4guC5ieC4reC4hOC4p+C4suC4oeC4hOC4s+C4leC4reC4muC4l+C4teC5iOC5hOC4oeC5iOC4luC4ueC4geC4leC5ieC4reC4hyIsCiAgICAgICJkZWZhdWx0IjogIuC5hOC4oeC5iOC4luC4ueC4geC4leC5ieC4reC4hyEiLAogICAgICAiZGVzY3JpcHRpb24iOiAi4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LiX4Li14LmI4LmD4LiK4LmJ4LmB4Liq4LiU4LiH4Lin4LmI4Liy4LiE4Liz4LiV4Lit4Lia4LmE4Lih4LmI4LiW4Li54LiB4LiV4LmJ4Lit4LiHIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuC4guC5ieC4reC4hOC4p+C4suC4oeC4hOC4s+C4leC4reC4muC4l+C4teC5iOC5hOC4oeC5iOC4quC4suC4oeC4suC4o+C4luC4q+C4suC5hOC4lOC5iSIsCiAgICAgICJkZWZhdWx0IjogIuC5hOC4oeC5iOC4nuC4muC4hOC4s+C4leC4reC4miEiLAogICAgICAiZGVzY3JpcHRpb24iOiAi4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LiX4Li14LmI4LmD4LiK4LmJ4LmB4Liq4LiU4LiH4Lin4LmI4Liy4LmE4Lih4LmI4Lie4Lia4LiE4Liz4LiV4Lit4LiaIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuC4hOC4s+C4reC4mOC4tOC4muC4suC4ouC4quC4s+C4q+C4o+C4seC4muC5geC4quC4lOC4h+C4p+C4tOC4mOC4teC4geC4suC4o+C5geC4geC5ieC4m+C4seC4jeC4q+C4siIsCiAgICAgICJkZWZhdWx0IjogIuC4h+C4suC4meC4luC4ueC4geC4reC4seC4m+C5gOC4lOC4leC5gOC4nuC4t+C5iOC4reC4oeC4teC4hOC4s+C4leC4reC4muC5geC4peC5ieC4pyIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLguILguYnguK3guITguKfguLLguKHguJnguLXguYnguYHguIjguYnguIfguYPguKvguYnguJzguLnguYnguYPguIrguYnguJfguKPguLLguJrguKfguYjguLLguIfguLLguJnguYTguJTguYnguKPguLHguJrguIHguLLguKPguK3guLHguJvguYDguJTguJXguJTguYnguKfguKLguITguLPguJXguK3guJoiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4LiB4Liy4Lij4LmB4Liq4LiU4LiH4LiE4Liw4LmB4LiZ4LiZ4LmB4Lia4Lia4LiV4Lix4Lin4Lit4Lix4LiB4Lip4Lij4Liq4Liz4Lir4Lij4Lix4Lia4Lic4Li54LmJ4LmD4LiK4LmJ4LiX4Li14LmI4LmD4LiK4LmJIHJlYWRzcGVha2VyIiwKICAgICAgImRlZmF1bHQiOiAi4LiE4Li44LiT4LmE4LiU4LmJ4LiE4Liw4LmB4LiZ4LiZIDpudW0g4LiI4Liy4LiB4LiX4Lix4LmJ4LiH4Lir4Lih4LiUIDp0b3RhbCDguITguLDguYHguJnguJkiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4Lib4LmJ4Liy4Lii4LiK4Li34LmI4Lit4Liq4Liz4Lir4Lij4Lix4Lia4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LiX4Li14LmI4Lit4LmI4Liy4LiZ4LmE4LiU4LmJ4LmA4LiV4LmH4Lih4Lij4Li54Lib4LmB4Lia4Lia4Liq4Liz4Lir4Lij4Lix4Lia4LmA4LiX4LiE4LmC4LiZ4LmC4Lil4Lii4Li14LiK4LmI4Lin4Lii4LmA4Lir4Lil4Li34LitIiwKICAgICAgImRlZmF1bHQiOiAi4LiC4LmJ4Lit4LiE4Lin4Liy4Lih4LiX4Li14LmI4Lit4LmI4Liy4LiZ4LmE4LiU4LmJ4LmA4LiV4LmH4Lih4Lij4Li54Lib4LmB4Lia4LiaIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuC4m+C5ieC4suC4ouC4iuC4t+C5iOC4reC4quC4s+C4q+C4o+C4seC4muC4guC5ieC4reC4hOC4p+C4suC4oeC4l+C4teC5iOC4quC4suC4oeC4suC4o+C4luC4l+C4s+C5gOC4hOC4o+C4t+C5iOC4reC4h+C4q+C4oeC4suC4ouC4hOC4s+C5hOC4lOC5ieC4quC4s+C4q+C4o+C4seC4muC5gOC4l+C4hOC5guC4meC5guC4peC4ouC4teC4iuC5iOC4p+C4ouC5gOC4q+C4peC4t+C4rSIsCiAgICAgICJkZWZhdWx0IjogIuC4guC5ieC4reC4hOC4p+C4suC4oeC4l+C4seC5ieC4h+C4q+C4oeC4lOC4l+C4teC5iOC4quC4suC4oeC4suC4o+C4luC4l+C4s+C5gOC4hOC4o+C4t+C5iOC4reC4h+C4q+C4oeC4suC4ouC4hOC4s+C5hOC4lOC5iSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLguKvguLHguKfguYDguKPguLfguYjguK3guIfguYLguKvguKHguJTguITguLPguJXguK3guJrguKrguLPguKvguKPguLHguJrguYDguJfguITguYLguJnguYLguKXguKLguLXguIrguYjguKfguKLguYDguKvguKXguLfguK0iLAogICAgICAiZGVmYXVsdCI6ICLguYLguKvguKHguJTguITguLPguJXguK3guJoiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi4Lir4Lix4Lin4LmA4Lij4Li34LmI4Lit4LiH4LmC4Lir4Lih4LiU4LiV4Lij4Lin4LiI4Liq4Lit4Lia4Liq4Liz4Lir4Lij4Lix4Lia4LmA4LiX4LiE4LmC4LiZ4LmC4Lil4Lii4Li14LiK4LmI4Lin4Lii4LmA4Lir4Lil4Li34LitIiwKICAgICAgImRlZmF1bHQiOiAi4LmC4Lir4Lih4LiU4LiV4Lij4Lin4LiI4Liq4Lit4LiaIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuC4hOC4s+C4reC4mOC4tOC4muC4suC4ouC4quC4s+C4q+C4o+C4seC4muC5gOC4l+C4hOC5guC4meC5guC4peC4ouC4teC4iuC5iOC4p+C4ouC5gOC4q+C4peC4t+C4reC4quC4s+C4q+C4o+C4seC4muC4m+C4uOC5iOC4oSBcIuC4leC4o+C4p+C4iOC4quC4reC4mlwiIiwKICAgICAgImRlZmF1bHQiOiAi4LiV4Lij4Lin4LiI4Liq4Lit4Lia4LiE4Liz4LiV4Lit4LiaIOC4geC4suC4o+C4leC4reC4muC4geC4peC4seC4muC4iOC4sOC4luC4ueC4geC4l+C4s+C5gOC4hOC4o+C4t+C5iOC4reC4h+C4q+C4oeC4suC4ouC4p+C5iOC4suC4luC4ueC4geC4leC5ieC4reC4hyDguYTguKHguYjguJbguLnguIHguJXguYnguK3guIcg4Lir4Lij4Li34Lit4LmE4Lih4LmI4LmE4LiU4LmJ4LiV4Lit4LiaIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuC4hOC4s+C4reC4mOC4tOC4muC4suC4ouC4quC4s+C4q+C4o+C4seC4muC5gOC4l+C4hOC5guC4meC5guC4peC4ouC4teC4iuC5iOC4p+C4ouC5gOC4q+C4peC4t+C4reC4quC4s+C4q+C4o+C4seC4muC4m+C4uOC5iOC4oSBcIuC5geC4quC4lOC4h+C4hOC4s+C4leC4reC4mlwiIiwKICAgICAgImRlZmF1bHQiOiAi4LmB4Liq4LiU4LiH4LiE4Liz4LiV4Lit4LiaIOC4h+C4suC4meC4iOC4sOC4luC4ueC4geC4l+C4s+C5gOC4hOC4o+C4t+C5iOC4reC4h+C4q+C4oeC4suC4ouC4lOC5ieC4p+C4ouC4hOC4s+C4leC4reC4muC4l+C4teC5iOC4luC4ueC4geC4leC5ieC4reC4h+C5geC4peC4sOC5hOC4oeC5iOC4luC4ueC4geC4leC5ieC4reC4hyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLguITguLPguK3guJjguLTguJrguLLguKLguKrguLPguKvguKPguLHguJrguYDguJfguITguYLguJnguYLguKXguKLguLXguIrguYjguKfguKLguYDguKvguKXguLfguK3guKrguLPguKvguKPguLHguJrguJvguLjguYjguKEgXCLguKXguK3guIfguYPguKvguKHguYhcIiIsCiAgICAgICJkZWZhdWx0IjogIuC5gOC4o+C4tOC5iOC4oeC4h+C4suC4meC5g+C4q+C4oeC5iCDguITguLPguJXguK3guJrguJfguLXguYjguJbguLnguIHguJXguYnguK3guIfguYHguKXguLDguYTguKHguYjguJbguLnguIHguJXguYnguK3guIfguIjguLDguJbguLnguIHguKXguYnguLLguIfguK3guK3guIEiCiAgICB9CiAgXQp9Cg=="],"libraries\/H5P.MarkTheWords-1.11\/language\/tr.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJNZWR5YSIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIlRpcGkiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIlNvcnUgw7x6ZXJpbmRlIGfDtnLDvG50w7xsZW5lY2VrIGlzdGXEn2UgYmHEn2zEsSBtZWR5YS4iCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiR8O2cnNlbCB5YWvEsW5sYcWfdMSxcm1hIGRldnJlIGTEscWfxLEga2Fsc8SxbiIKICAgICAgICB9CiAgICAgIF0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJHw7ZyZXYgdGFuxLFtxLEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiRGVzY3JpYmUgaG93IHRoZSB1c2VyIHNob3VsZCBzb2x2ZSB0aGUgdGFzay4iLAogICAgICAicGxhY2Vob2xkZXIiOiAiQcWfYcSfxLFkYWtpIG1ldGluZGUgeWVyIGFsYW4gdMO8bSBmaWlsbGVyaSB0xLFrbGF0xLFuLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJNZXRpbiBhbGFuxLEiLAogICAgICAicGxhY2Vob2xkZXIiOiAiQnUgYmlyIGNldmFwdMSxcjogKmNldmFwKiAuIiwKICAgICAgImltcG9ydGFudCI6IHsKICAgICAgICAiZGVzY3JpcHRpb24iOiAiPHVsPjxsaT5NYXJrZWQgd29yZHMgYXJlIGFkZGVkIHdpdGggYW4gYXN0ZXJpc2sgKCopLjwvbGk+PGxpPkFzdGVyaXNrcyBjYW4gYmUgYWRkZWQgd2l0aGluIG1hcmtlZCB3b3JkcyBieSBhZGRpbmcgYW5vdGhlciBhc3RlcmlzaywgKmNvcnJlY3R3b3JkKioqID0mZ3Q7IGNvcnJlY3R3b3JkKi48L2xpPjwvdWw+IiwKICAgICAgICAiZXhhbXBsZSI6ICJUaGUgY29ycmVjdCB3b3JkcyBhcmUgbWFya2VkIGxpa2UgdGhpczogKmNvcnJlY3R3b3JkKiwgYW4gYXN0ZXJpc2sgaXMgd3JpdHRlbiBsaWtlIHRoaXM6ICpjb3JyZWN0d29yZCoqKi4iCiAgICAgIH0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJPdmVyYWxsIEZlZWRiYWNrIiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAid2lkZ2V0cyI6IFsKICAgICAgICAgICAgewogICAgICAgICAgICAgICJsYWJlbCI6ICJWYXJzYXnEsWxhbiIKICAgICAgICAgICAgfQogICAgICAgICAgXSwKICAgICAgICAgICJsYWJlbCI6ICJEZWZpbmUgY3VzdG9tIGZlZWRiYWNrIGZvciBhbnkgc2NvcmUgcmFuZ2UiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIkNsaWNrIHRoZSBcIkFkZCByYW5nZVwiIGJ1dHRvbiB0byBhZGQgYXMgbWFueSByYW5nZXMgYXMgeW91IG5lZWQuIEV4YW1wbGU6IDAtMjAlIEJhZCBzY29yZSwgMjEtOTElIEF2ZXJhZ2UgU2NvcmUsIDkxLTEwMCUgR3JlYXQgU2NvcmUhIiwKICAgICAgICAgICJlbnRpdHkiOiAicmFuZ2UiLAogICAgICAgICAgImZpZWxkIjogewogICAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJTY29yZSBSYW5nZSIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHt9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICJGZWVkYmFjayBmb3IgZGVmaW5lZCBzY29yZSByYW5nZSIsCiAgICAgICAgICAgICAgICAicGxhY2Vob2xkZXIiOiAiRmlsbCBpbiB0aGUgZmVlZGJhY2siCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiXCJLb250cm9sIGV0XCIgYnV0b251IGnDp2luIG1ldGluIiwKICAgICAgImRlZmF1bHQiOiAiS29udHJvbCBldCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBcIlN1Ym1pdFwiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlN1Ym1pdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJcIlllbmlkZW4gZGVuZVwiIGJ1dG9udSBpw6dpbiBtZXRpbiIsCiAgICAgICJkZWZhdWx0IjogIlllbmlkZW4gZGVuZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJcIsOHw7Z6w7xtw7wgZ8O2c3RlclwiIGJ1dG9udW51IGnDp2luIG1ldGluIiwKICAgICAgImRlZmF1bHQiOiAiw4fDtnrDvG3DvCBnw7ZzdGVyIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkJlaGF2aW91cmFsIHNldHRpbmdzLiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJCdSBzZcOnZW5la2xlciBha3Rpdml0ZW5pbiDDp2FsxLHFn21hIMWfZWtsaW5pIGRlbmV0bGVtZW5pemUgaXppbiB2ZXJpci4iLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJFbmFibGUgXCJSZXRyeVwiIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkVuYWJsZSBcIlNob3cgc29sdXRpb25cIiBidXR0b24iCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiRW5hYmxlIFwiQ2hlY2tcIiBidXR0b24iCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiU2hvdyBzY29yZSBwb2ludHMiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIlNob3cgcG9pbnRzIGVhcm5lZCBmb3IgZWFjaCBhbnN3ZXIuIgogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNvcnJlY3QgYW5zd2VyIHRleHQiLAogICAgICAiZGVmYXVsdCI6ICJDb3JyZWN0ISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHVzZWQgdG8gaW5kaWNhdGUgdGhhdCBhbiBhbnN3ZXIgaXMgY29ycmVjdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbmNvcnJlY3QgYW5zd2VyIHRleHQiLAogICAgICAiZGVmYXVsdCI6ICJJbmNvcnJlY3QhIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdXNlZCB0byBpbmRpY2F0ZSB0aGF0IGFuIGFuc3dlciBpcyBpbmNvcnJlY3QiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWlzc2VkIGFuc3dlciB0ZXh0IiwKICAgICAgImRlZmF1bHQiOiAiQW5zd2VyIG5vdCBmb3VuZCEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB1c2VkIHRvIGluZGljYXRlIHRoYXQgYW4gYW5zd2VyIGlzIG1pc3NpbmciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRGVzY3JpcHRpb24gZm9yIERpc3BsYXkgU29sdXRpb24iLAogICAgICAiZGVmYXVsdCI6ICJUYXNrIGlzIHVwZGF0ZWQgdG8gY29udGFpbiB0aGUgc29sdXRpb24uIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRoaXMgdGV4dCB0ZWxscyB0aGUgdXNlciB0aGF0IHRoZSB0YXNrcyBoYXMgYmVlbiB1cGRhdGVkIHdpdGggdGhlIHNvbHV0aW9uLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0dWFsIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBzY29yZSBiYXIgZm9yIHRob3NlIHVzaW5nIGEgcmVhZHNwZWFrZXIiLAogICAgICAiZGVmYXVsdCI6ICJZb3UgZ290IDpudW0gb3V0IG9mIDp0b3RhbCBwb2ludHMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTGFiZWwgZm9yIHRoZSBmdWxsIHJlYWRhYmxlIHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJGdWxsIHJlYWRhYmxlIHRleHQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTGFiZWwgZm9yIHRoZSB0ZXh0IHdoZXJlIHdvcmRzIGNhbiBiZSBtYXJrZWQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJGdWxsIHRleHQgd2hlcmUgd29yZHMgY2FuIGJlIG1hcmtlZCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJTb2x1dGlvbiBtb2RlIGhlYWRlciBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIlNvbHV0aW9uIG1vZGUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2hlY2tpbmcgbW9kZSBoZWFkZXIgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJDaGVja2luZyBtb2RlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFzc2lzdGl2ZSB0ZWNobm9sb2d5IGRlc2NyaXB0aW9uIGZvciBcIkNoZWNrXCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiQ2hlY2sgdGhlIGFuc3dlcnMuIFRoZSByZXNwb25zZXMgd2lsbCBiZSBtYXJrZWQgYXMgY29ycmVjdCwgaW5jb3JyZWN0LCBvciB1bmFuc3dlcmVkLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJBc3Npc3RpdmUgdGVjaG5vbG9neSBkZXNjcmlwdGlvbiBmb3IgXCJTaG93IFNvbHV0aW9uXCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiU2hvdyB0aGUgc29sdXRpb24uIFRoZSB0YXNrIHdpbGwgYmUgbWFya2VkIHdpdGggaXRzIGNvcnJlY3Qgc29sdXRpb24uIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFzc2lzdGl2ZSB0ZWNobm9sb2d5IGRlc2NyaXB0aW9uIGZvciBcIlJldHJ5XCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiUmV0cnkgdGhlIHRhc2suIFJlc2V0IGFsbCByZXNwb25zZXMgYW5kIHN0YXJ0IHRoZSB0YXNrIG92ZXIgYWdhaW4uIgogICAgfQogIF0KfQo="],"libraries\/H5P.MarkTheWords-1.11\/language\/uk.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLQnNC10LTRltCwIiwKICAgICAgImZpZWxkcyI6IFsKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAi0KLQuNC\/IiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICLQlNC+0LTQsNGC0LrQvtCy0LUg0LzQtdC00ZbQsCDQtNC70Y8g0LLRltC00L7QsdGA0LDQttC10L3QvdGPINC90LDQtCDQt9Cw0L\/QuNGC0LDQvdC90Y\/QvC4iCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAi0JLRltC00LrQu9GO0YfQuNGC0Lgg0LzQsNGB0YjRgtCw0LHRg9Cy0LDQvdC90Y8g0LfQvtCx0YDQsNC20LXQvdC90Y8iCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0J7Qv9C40YEg0LfQsNCy0LTQsNC90L3RjyIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLQntC\/0LjRiNGW0YLRjCwg0Y\/QuiDQutC+0YDQuNGB0YLRg9Cy0LDRhyDQv9C+0LLQuNC90LXQvSDQstC40YDRltGI0LjRgtC4INC30LDQstC00LDQvdC90Y8uIiwKICAgICAgInBsYWNlaG9sZGVyIjogItCd0LDRgtC40YHQvdGW0YLRjCDQstGB0ZYg0LTRltGU0YHQu9C+0LLQsCDQsiDQvdCw0YHRgtGD0L\/QvdC+0LzRgyDRgtC10LrRgdGC0ZYuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCe0LHQu9Cw0YHRgtGMINCy0LLQtdC00LXQvdC90Y8iLAogICAgICAicGxhY2Vob2xkZXIiOiAi0JLRltC00L\/QvtCy0ZbQtNC00Y4g0ZQ6ICrQstGW0LTQv9C+0LLRltC00YwqLiIsCiAgICAgICJpbXBvcnRhbnQiOiB7CiAgICAgICAgImRlc2NyaXB0aW9uIjogIjx1bD48bGk+0JLQuNC00ZbQu9C10L3RliDRgdC70L7QstCwINC90LXQvtCx0YXRltC00L3QviDQv9C+0LfQvdCw0YfQuNGC0Lgg0LfRltGA0L7Rh9C60L7RjiAoKikuPC9saT48bGk+0JfRltGA0L7Rh9C60LAg0LzQsNGUINCx0YPRgtC4INC00L7QtNCw0L3QsCDQtyDQtNCy0L7RhSDRgdGC0L7RgNGW0L0sICrQv9GA0LDQstC40LvRjNC90LXRgdC70L7QstC+KioqID0mZ3Q7INC\/0YDQsNCy0LjQu9GM0L3QtdGB0LvQvtCy0L4qLjwvbGk+IDwvdWw+IiwKICAgICAgICAiZXhhbXBsZSI6ICLQn9GA0LDQstC40LvRjNC90ZYg0YHQu9C+0LLQsCDQstC40LfQvdCw0YfQtdC90ZYg0YLQsNC60LjQvCDRh9C40L3QvtC8OiAq0L\/RgNCw0LLQuNC70YzQvdC10YHQu9C+0LLQviosINC30ZbRgNC+0YfQutCwINC\/0L7Qt9C90LDRh9C10L3QsCDRgtCw0Lo6ICrQv9GA0LDQstC40LvRjNC90LXRgdC70L7QstC+KioqLiIKICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCX0LDQs9Cw0LvRjNC90LjQuSDQstGW0LTQs9GD0LoiLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJ3aWRnZXRzIjogWwogICAgICAgICAgICB7CiAgICAgICAgICAgICAgImxhYmVsIjogItCX0LAg0LfQsNC80L7QstGH0YPQstCw0L3QvdGP0LwiCiAgICAgICAgICAgIH0KICAgICAgICAgIF0sCiAgICAgICAgICAibGFiZWwiOiAi0JLRgdGC0LDQvdC+0LLQuNGC0Lgg0LLRltC00LPRg9C6INC00LvRjyDQsdGD0LTRjC3Rj9C60L7Qs9C+INC00ZbQsNC\/0LDQt9C+0L3RgyDQsdCw0LvRltCyIiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICLQndCw0YLQuNGB0L3RltGC0Ywg0LrQvdC+0L\/QutGDIFwi0JTQvtC00LDRgtC4INC00ZbQsNC\/0LDQt9C+0L1cIiDQtNC70Y8g0LTQvtC00LDQstCw0L3QvdGPINC90LXQvtCx0YXRltC00L3QvtGXINC60ZbQu9GM0LrQvtGB0YLRliDQtNGW0LDQv9Cw0LfQvtC90ZbQsi4g0J\/RgNC40LrQu9Cw0LQ6IDAtMjAlINCd0LjQt9GM0LrQuNC5INGA0LXQt9GD0LvRjNGC0LDRgiwgMjEtOTElINCh0LXRgNC10LTQvdGW0Lkg0YDQtdC30YPQu9GM0YLQsNGCLCA5MS0xMDAlINCS0ZbQtNC80ZbQvdC90LjQuSDRgNC10LfRg9C70YzRgtCw0YIhIiwKICAgICAgICAgICJlbnRpdHkiOiAi0LTRltCw0L\/QsNC30L7QvSIsCiAgICAgICAgICAiZmllbGQiOiB7CiAgICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgImxhYmVsIjogItCU0ZbQsNC\/0LDQt9C+0L0g0LHQsNC70ZbQsiIKICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgIHt9LAogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICLQktGW0LTQs9GD0Log0LTQu9GPINC\/0LXQstC90L7Qs9C+INC00ZbQsNC\/0LDQt9C+0L3RgyDQsdCw0LvRltCyIiwKICAgICAgICAgICAgICAgICJwbGFjZWhvbGRlciI6ICLQl9Cw0L\/QvtCy0L3RltGC0Ywg0LLRltC00LPRg9C6IgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0LXQutGB0YIg0LTQu9GPINC60L3QvtC\/0LrQuCBcItCf0LXRgNC10LLRltGA0LjRgtC4XCIiLAogICAgICAiZGVmYXVsdCI6ICLQn9C10YDQtdCy0ZbRgNC40YLQuCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC00LvRjyDQutC90L7Qv9C60LggXCLQndCw0LTRltGB0LvQsNGC0LhcIiIsCiAgICAgICJkZWZhdWx0IjogItCd0LDQtNGW0YHQu9Cw0YLQuCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQotC10LrRgdGCINC00LvRjyDQutC90L7Qv9C60LggXCLQn9C+0LLRgtC+0YDQuNGC0LhcIiAiLAogICAgICAiZGVmYXVsdCI6ICLQn9C+0LLRgtC+0YDQuNGC0LgiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQtNC70Y8g0LrQvdC+0L\/QutC4IFwi0J\/QvtC60LDQt9Cw0YLQuCDRgNGW0YjQtdC90L3Rj1wiIiwKICAgICAgImRlZmF1bHQiOiAi0J\/QvtC60LDQt9Cw0YLQuCDRgNGW0YjQtdC90L3RjyIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQndCw0LvQsNGI0YLRg9Cy0LDQvdC90Y8g0LfQstC+0YDQvtGC0L3QvtCz0L4g0LfQsifRj9C30LrRgy4iLAogICAgICAiZGVzY3JpcHRpb24iOiAi0KbRliDQvdCw0LvQsNGI0YLRg9Cy0LDQvdC90Y8g0LTQvtC\/0L7QvNC+0LbRg9GC0Ywg0LLQsNC8INC60LXRgNGD0LLQsNGC0Lgg0L\/QvtCy0LXQtNGW0L3QutC+0Y4g0LfQsNCy0LTQsNC90L3Rjy4iLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICLQo9Cy0ZbQvNC60L3Rg9GC0LggXCLQn9C+0LLRgtC+0YDQuNGC0LhcIiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICLQktC60LvRjtGH0LjRgtC4INC60L3QvtC\/0LrRgyBcItCf0L7QutCw0LfQsNGC0Lgg0YDRltGI0LXQvdC90Y9cIiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICLQo9Cy0ZbQvNC60L3Rg9GC0Lgg0LrQvdC+0L\/QutGDIFwi0J\/QtdGA0LXQstGW0YDQuNGC0LhcIiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICLQn9C+0LrQsNC30LDRgtC4INGA0LXQt9GD0LvRjNGC0LDRgiIsCiAgICAgICAgICAiZGVzY3JpcHRpb24iOiAi0J\/QvtC60LDQt9Cw0YLQuCDQsdCw0LvQuCDQt9CwINCy0ZbQtNC\/0L7QstGW0LTRli4iCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQv9GA0LDQstC40LvRjNC90L7RlyDQstGW0LTQv9C+0LLRltC00ZYiLAogICAgICAiZGVmYXVsdCI6ICLQktGW0YDQvdC+ISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLQotC10LrRgdGCLCDRj9C60LjQuSDQstC40LfQvdCw0YfQsNGULCDRidC+INCy0ZbQtNC\/0L7QstGW0LTRjCDQv9GA0LDQstC40LvRjNC90LAiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KLQtdC60YHRgiDQtNC70Y8g0L3QtdC\/0YDQsNCy0LjQu9GM0L3QvtGXINCy0ZbQtNC\/0L7QstGW0LTRliIsCiAgICAgICJkZWZhdWx0IjogItCd0LXQstGW0YDQvdC+ISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLQotC10LrRgdGCLCDRj9C60LjQuSDQstC40LfQvdCw0YfQsNGULCDRidC+INCy0ZbQtNC\/0L7QstGW0LTRjCDQvdC10L\/RgNCw0LLQuNC70YzQvdCwIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0LXQutGB0YIg0LTQu9GPINCy0ZbQtNGB0YPRgtC90L7RgdGC0ZYg0LLRltC00L\/QvtCy0ZbQtNGWIiwKICAgICAgImRlZmF1bHQiOiAi0J\/RgNC+0L\/Rg9GJ0LXQvdC+ISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLQotC10LrRgdGCLCDRj9C60LjQuSDQstC40LfQvdCw0YfQsNGULCDRidC+INCy0ZbQtNC\/0L7QstGW0LTRliDQvdC10LzQsNGUIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCe0L\/QuNGBINC00LvRjyDQv9C+0LTQsNC90L3RjyDRgNGW0YjQtdC90L3RjyIsCiAgICAgICJkZWZhdWx0IjogItCX0LDQstC00LDQvdC90Y8g0L7QvdC+0LLQu9GO0ZTRgtGM0YHRjywg0YnQvtCxINC80ZbRgdGC0LjRgtC4INCy0ZbQtNC\/0L7QstGW0LTRli4iLAogICAgICAiZGVzY3JpcHRpb24iOiAi0KLQtdC60YHRgiwg0Y\/QutC40Lkg0L\/QvtGP0YHQvdGO0ZQg0LrQvtGA0LjRgdGC0YPQstCw0YfQtdCy0ZYsINGJ0L4g0LfQsNCy0LTQsNC90L3RjyDQvtC90L7QstC70LXQvdC+INC3INGA0ZbRiNC10L3QvdGP0LwuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCi0LXQutGB0YLQvtCy0LUg0L\/QvtC00LDQvdC90Y8g0YDQtdC30YPQu9GM0YLQsNGC0ZbQsiDQtNC70Y8g0YLQuNGFLCDRhdGC0L4g0LLQuNC60L7RgNC40YHRgtC+0LLRg9GO0YLRjCDQsNGB0LjRgdGC0YPRjtGH0ZYg0YLQtdGF0L3QvtC70L7Qs9GW0ZcgKNC+0LfQstGD0YfRg9Cy0LDQvdC90Y8pIiwKICAgICAgImRlZmF1bHQiOiAi0KMg0YLQtdCx0LUgOm51bSDQtyA6dG90YWwg0LHQsNC70ZbQsiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQn9C+0LfQvdCw0YfQutCwINC00LvRjyDQv9C+0LLQvdC+0LPQviDRh9C40YLQsNCx0LXQu9GM0L3QvtCz0L4g0YLQtdC60YHRgtGDINC00LvRjyDQtNC+0L\/QvtC80ZbQttC90LjRhSDRgtC10YXQvdC+0LvQvtCz0ZbQuSIsCiAgICAgICJkZWZhdWx0IjogItCf0L7QstC90LjQuSDRh9C40YLQsNCx0LXQu9GM0L3QuNC5INGC0LXQutGB0YIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0J\/QvtC30L3QsNGH0LrQsCDQtNC70Y8g0YLQtdC60YHRgtGDLCDQtNC1INC80L7QttC90LAg0L\/QvtC30L3QsNGH0LjRgtC4INGB0LvQvtCy0LAg0LTQu9GPINC00L7Qv9C+0LzRltC20L3QuNGFINGC0LXRhdC90L7Qu9C+0LPRltC5IiwKICAgICAgImRlZmF1bHQiOiAi0J\/QvtCy0L3QuNC5INGC0LXQutGB0YIsINC00LUg0LzQvtC20L3QsCDQv9C+0LfQvdCw0YfQuNGC0Lgg0YHQu9C+0LLQsCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLQl9Cw0LPQvtC70L7QstC+0Log0YDQtdC20LjQvNGDINGA0ZbRiNC10L3QvdGPINC00LvRjyDQtNC+0L\/QvtC80ZbQttC90LjRhSDRgtC10YXQvdC+0LvQvtCz0ZbQuSIsCiAgICAgICJkZWZhdWx0IjogItCg0LXQttC40Lwg0YDRltGI0LXQvdC90Y8iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0KDQtdC20LjQvCDQv9C10YDQtdCy0ZbRgNC60Lgg0LfQsNCz0L7Qu9C+0LLQutCwINC00LvRjyDQtNC+0L\/QvtC80ZbQttC90LjRhSDRgtC10YXQvdC+0LvQvtCz0ZbQuSIsCiAgICAgICJkZWZhdWx0IjogItCg0LXQttC40Lwg0L\/QtdGA0LXQstGW0YDQutC4IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCe0L\/QuNGBINC00L7Qv9C+0LzRltC20L3QvtGXINGC0LXRhdC90L7Qu9C+0LPRltGXINC00LvRjyDQutC90L7Qv9C60LggXCLQn9C10YDQtdCy0ZbRgNC40YLQuFwiIiwKICAgICAgImRlZmF1bHQiOiAi0J\/QtdGA0LXQstGW0YDQuNGC0Lgg0LLRltC00L\/QvtCy0ZbQtNGWLiDQktGW0LTQv9C+0LLRltC00ZYg0LHRg9C00YPRgtGMINC\/0L7Qt9C90LDRh9C10L3RliDRj9C6INC\/0YDQsNCy0LjQu9GM0L3Rliwg0L3QtdC\/0YDQsNCy0LjQu9GM0L3RliDQsNCx0L4g0LHQtdC3INCy0ZbQtNC\/0L7QstGW0LTRli4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi0J7Qv9C40YEg0LTQvtC\/0L7QvNGW0LbQvdC+0Zcg0YLQtdGF0L3QvtC70L7Qs9GW0Zcg0LTQu9GPINC60L3QvtC\/0LrQuCBcItCf0L7QutCw0LfQsNGC0Lgg0YDRltGI0LXQvdC90Y9cIiIsCiAgICAgICJkZWZhdWx0IjogItCf0L7QutCw0LfQsNGC0Lgg0YDRltGI0LXQvdC90Y8uINCX0LDQstC00LDQvdC90Y8g0LHRg9C00LUg0L\/QvtC30L3QsNGH0LXQvdC1INC50L7Qs9C+INC\/0YDQsNCy0LjQu9GM0L3QuNC8INGA0ZbRiNC10L3QvdGP0LwuIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogItCe0L\/QuNGBINC00L7Qv9C+0LzRltC20L3QvtGXINGC0LXRhdC90L7Qu9C+0LPRltGXINC00LvRjyDQutC90L7Qv9C60LggXCLQn9C+0LLRgtC+0YDQuNGC0LhcIiIsCiAgICAgICJkZWZhdWx0IjogItCf0L7QstGC0L7RgNC40YLQuCDRgdC\/0YDQvtCx0YMuINCh0LrQuNC90YPRgtC4INCy0YHRliDQstGW0LTQv9C+0LLRltC00ZYg0YLQsCDQt9Cw0L\/Rg9GB0YLQuNGC0Lgg0LfQsNCy0LTQsNC90L3RjyDQt9C90L7QstGDLiIKICAgIH0KICBdCn0K"],"libraries\/H5P.MarkTheWords-1.11\/language\/vi.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICJNZWRpYSIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIlR5cGUiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9wdGlvbmFsIG1lZGlhIHRvIGRpc3BsYXkgYWJvdmUgdGhlIHF1ZXN0aW9uLiIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJEaXNhYmxlIGltYWdlIHpvb21pbmciCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGFzayBkZXNjcmlwdGlvbiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJEZXNjcmliZSBob3cgdGhlIHVzZXIgc2hvdWxkIHNvbHZlIHRoZSB0YXNrLiIsCiAgICAgICJwbGFjZWhvbGRlciI6ICJDbGljayBvbiBhbGwgdGhlIHZlcmJzIGluIHRoZSB0ZXh0IHRoYXQgZm9sbG93cy4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dGZpZWxkIiwKICAgICAgInBsYWNlaG9sZGVyIjogIlRoaXMgaXMgYW4gYW5zd2VyOiAqYW5zd2VyKi4iLAogICAgICAiaW1wb3J0YW50IjogewogICAgICAgICJkZXNjcmlwdGlvbiI6ICI8dWw+PGxpPk1hcmtlZCB3b3JkcyBhcmUgYWRkZWQgd2l0aCBhbiBhc3RlcmlzayAoKikuPC9saT48bGk+QXN0ZXJpc2tzIGNhbiBiZSBhZGRlZCB3aXRoaW4gbWFya2VkIHdvcmRzIGJ5IGFkZGluZyBhbm90aGVyIGFzdGVyaXNrLCAqY29ycmVjdHdvcmQqKiogPSZndDsgY29ycmVjdHdvcmQqLjwvbGk+PC91bD4iLAogICAgICAgICJleGFtcGxlIjogIlRoZSBjb3JyZWN0IHdvcmRzIGFyZSBtYXJrZWQgbGlrZSB0aGlzOiAqY29ycmVjdHdvcmQqLCBhbiBhc3RlcmlzayBpcyB3cml0dGVuIGxpa2UgdGhpczogKmNvcnJlY3R3b3JkKioqLiIKICAgICAgfQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIk92ZXJhbGwgRmVlZGJhY2siLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJ3aWRnZXRzIjogWwogICAgICAgICAgICB7CiAgICAgICAgICAgICAgImxhYmVsIjogIkRlZmF1bHQiCiAgICAgICAgICAgIH0KICAgICAgICAgIF0sCiAgICAgICAgICAibGFiZWwiOiAiRGVmaW5lIGN1c3RvbSBmZWVkYmFjayBmb3IgYW55IHNjb3JlIHJhbmdlIiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJDbGljayB0aGUgXCJBZGQgcmFuZ2VcIiBidXR0b24gdG8gYWRkIGFzIG1hbnkgcmFuZ2VzIGFzIHlvdSBuZWVkLiBFeGFtcGxlOiAwLTIwJSBCYWQgc2NvcmUsIDIxLTkxJSBBdmVyYWdlIFNjb3JlLCA5MS0xMDAlIEdyZWF0IFNjb3JlISIsCiAgICAgICAgICAiZW50aXR5IjogInJhbmdlIiwKICAgICAgICAgICJmaWVsZCI6IHsKICAgICAgICAgICAgImZpZWxkcyI6IFsKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiU2NvcmUgUmFuZ2UiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7fSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAiRmVlZGJhY2sgZm9yIGRlZmluZWQgc2NvcmUgcmFuZ2UiLAogICAgICAgICAgICAgICAgInBsYWNlaG9sZGVyIjogIkZpbGwgaW4gdGhlIGZlZWRiYWNrIgogICAgICAgICAgICAgIH0KICAgICAgICAgICAgXQogICAgICAgICAgfQogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIFwiQ2hlY2tcIiBidXR0b24iLAogICAgICAiZGVmYXVsdCI6ICJDaGVjayIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBcIlN1Ym1pdFwiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlN1Ym1pdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0IGZvciBcIlJldHJ5XCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiUmV0cnkiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJTaG93IHNvbHV0aW9uXCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiU2hvdyBzb2x1dGlvbiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJCZWhhdmlvdXJhbCBzZXR0aW5ncy4iLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGhlc2Ugb3B0aW9ucyB3aWxsIGxldCB5b3UgY29udHJvbCBob3cgdGhlIHRhc2sgYmVoYXZlcy4iLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICJFbmFibGUgXCJSZXRyeVwiIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIkVuYWJsZSBcIlNob3cgc29sdXRpb25cIiBidXR0b24iCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiRW5hYmxlIFwiQ2hlY2tcIiBidXR0b24iCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAiU2hvdyBzY29yZSBwb2ludHMiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIlNob3cgcG9pbnRzIGVhcm5lZCBmb3IgZWFjaCBhbnN3ZXIuIgogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNvcnJlY3QgYW5zd2VyIHRleHQiLAogICAgICAiZGVmYXVsdCI6ICJDb3JyZWN0ISIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHVzZWQgdG8gaW5kaWNhdGUgdGhhdCBhbiBhbnN3ZXIgaXMgY29ycmVjdCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJJbmNvcnJlY3QgYW5zd2VyIHRleHQiLAogICAgICAiZGVmYXVsdCI6ICJJbmNvcnJlY3QhIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRleHQgdXNlZCB0byBpbmRpY2F0ZSB0aGF0IGFuIGFuc3dlciBpcyBpbmNvcnJlY3QiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTWlzc2VkIGFuc3dlciB0ZXh0IiwKICAgICAgImRlZmF1bHQiOiAiQW5zd2VyIG5vdCBmb3VuZCEiLAogICAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB1c2VkIHRvIGluZGljYXRlIHRoYXQgYW4gYW5zd2VyIGlzIG1pc3NpbmciCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiRGVzY3JpcHRpb24gZm9yIERpc3BsYXkgU29sdXRpb24iLAogICAgICAiZGVmYXVsdCI6ICJUYXNrIGlzIHVwZGF0ZWQgdG8gY29udGFpbiB0aGUgc29sdXRpb24uIiwKICAgICAgImRlc2NyaXB0aW9uIjogIlRoaXMgdGV4dCB0ZWxscyB0aGUgdXNlciB0aGF0IHRoZSB0YXNrcyBoYXMgYmVlbiB1cGRhdGVkIHdpdGggdGhlIHNvbHV0aW9uLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJUZXh0dWFsIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBzY29yZSBiYXIgZm9yIHRob3NlIHVzaW5nIGEgcmVhZHNwZWFrZXIiLAogICAgICAiZGVmYXVsdCI6ICJZb3UgZ290IDpudW0gb3V0IG9mIDp0b3RhbCBwb2ludHMiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTGFiZWwgZm9yIHRoZSBmdWxsIHJlYWRhYmxlIHRleHQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJGdWxsIHJlYWRhYmxlIHRleHQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiTGFiZWwgZm9yIHRoZSB0ZXh0IHdoZXJlIHdvcmRzIGNhbiBiZSBtYXJrZWQgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJGdWxsIHRleHQgd2hlcmUgd29yZHMgY2FuIGJlIG1hcmtlZCIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJTb2x1dGlvbiBtb2RlIGhlYWRlciBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAgICJkZWZhdWx0IjogIlNvbHV0aW9uIG1vZGUiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQ2hlY2tpbmcgbW9kZSBoZWFkZXIgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJDaGVja2luZyBtb2RlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFzc2lzdGl2ZSB0ZWNobm9sb2d5IGRlc2NyaXB0aW9uIGZvciBcIkNoZWNrXCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiQ2hlY2sgdGhlIGFuc3dlcnMuIFRoZSByZXNwb25zZXMgd2lsbCBiZSBtYXJrZWQgYXMgY29ycmVjdCwgaW5jb3JyZWN0LCBvciB1bmFuc3dlcmVkLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJBc3Npc3RpdmUgdGVjaG5vbG9neSBkZXNjcmlwdGlvbiBmb3IgXCJTaG93IFNvbHV0aW9uXCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiU2hvdyB0aGUgc29sdXRpb24uIFRoZSB0YXNrIHdpbGwgYmUgbWFya2VkIHdpdGggaXRzIGNvcnJlY3Qgc29sdXRpb24uIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkFzc2lzdGl2ZSB0ZWNobm9sb2d5IGRlc2NyaXB0aW9uIGZvciBcIlJldHJ5XCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiUmV0cnkgdGhlIHRhc2suIFJlc2V0IGFsbCByZXNwb25zZXMgYW5kIHN0YXJ0IHRoZSB0YXNrIG92ZXIgYWdhaW4uIgogICAgfQogIF0KfQo="],"libraries\/H5P.MarkTheWords-1.11\/language\/zh.json":["application\/json","ewogICJzZW1hbnRpY3MiOiBbCiAgICB7CiAgICAgICJsYWJlbCI6ICLlqpLpq5QiLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICLpoZ7lnosiLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIuWcqOWVj+mhjOS4iuaWuemhr+ekuuWPr+mBuOeahOWqkumrlC4iCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAi6Yed5bCN5ZyW54mH5YGc55So5ZyW54mH57iu5pS+IgogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuS7u+WLmeiqquaYjiIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLoqqrmmI7nlKjmiLbku7vli5nkuK3opoHlgZrkupvku4DpurzjgIIiLAogICAgICAicGxhY2Vob2xkZXIiOiAi5Zyo5Y+l5a2Q5Lit5om+5Yiw5YuV6Kme54S25b6M5ZyI5Ye65L6G44CCIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuaWh+WtlyIsCiAgICAgICJwbGFjZWhvbGRlciI6ICLmiJEg5bi45bi4IOWcqCDlpJzmt7HkurrpnZwg55qE5pmC5YCZICrnv7vora8qIOS4gOS6myDou5\/pq5Qg44CCIiwKICAgICAgImltcG9ydGFudCI6IHsKICAgICAgICAiZGVzY3JpcHRpb24iOiAiPHVsPjxsaT7lnKjpnIDopoHooqvmqJnoqJjnmoTlrZfoqZ7vvIjnrZTmoYjvvInlhanlgbTmt7vliqDmmJ\/omZ8gKCop44CCPC9saT48bGk+5aaC5p6c5a2X6Kme5Lit5YyF5ZCr5pif6Jmf77yM6YKj6bq85Y+v5Lul5YaN5Yqg5LiA5YCL5bCx5pyD6KKr5YyF5ZCr77yM5L6L5aaCICpjb3JyZWN0d29yZCoqKiA9Jmd0OyBjb3JyZWN0d29yZCrjgII8L2xpPjxsaT7oqZ7oiIfoqZ7kuYvplpPopoHku6Xnqbrnmb3nrKbomZ\/liIbpmpTjgILlj6rmnInlrZfoqZ7og73kvb\/nlKjvvIzoi7Hoqp7niYfoqp7kuI3ooYzjgII8L2xpPjwvdWw+IiwKICAgICAgICAiZXhhbXBsZSI6ICJUaGUgY29ycmVjdCB3b3JkcyBhcmUgbWFya2VkIGxpa2UgdGhpczogKmNvcnJlY3R3b3JkKiwgYW4gYXN0ZXJpc2sgaXMgd3JpdHRlbiBsaWtlIHRoaXM6ICpjb3JyZWN0d29yZCoqKi4iCiAgICAgIH0KICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLntZDmnpzlm57ppYsiLAogICAgICAiZmllbGRzIjogWwogICAgICAgIHsKICAgICAgICAgICJ3aWRnZXRzIjogWwogICAgICAgICAgICB7CiAgICAgICAgICAgICAgImxhYmVsIjogIumgkOiorSIKICAgICAgICAgICAgfQogICAgICAgICAgXSwKICAgICAgICAgICJsYWJlbCI6ICLngrrkuI3lkIzliIbmlbjljYDplpPnmoTnlKjmiLbliIbliKXlm57ppYvoqIrmga8iLAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIum7nuaTiuOAjOa3u+WKoOevhOWcjeOAjeaMiemIle+8jOWKoOWFpeS9oOaDs+imgeeahOevhOWcje+8jOS+i+WmgiAwJS01OSUg6KuL5Yqg5rK544CBNjAlLTc5JSDlho3liqrlipvjgIE4MCUtMTAwJSDlpKrmo5LkuobjgIIiLAogICAgICAgICAgImVudGl0eSI6ICLnr4TlnI0iLAogICAgICAgICAgImZpZWxkIjogewogICAgICAgICAgICAiZmllbGRzIjogWwogICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJsYWJlbCI6ICLliIbmlbjljYDplpMiCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICB7fSwKICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAibGFiZWwiOiAi6Ieq6KiC5Y2A6ZaT5Zue6aWL6KiK5oGvIiwKICAgICAgICAgICAgICAgICJwbGFjZWhvbGRlciI6ICLloavlhaXlm57ppYvoqIrmga8iCiAgICAgICAgICAgICAgfQogICAgICAgICAgICBdCiAgICAgICAgICB9CiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi5qC45bCN562U5qGI5oyJ6YiV5paH5a2XIiwKICAgICAgImRlZmF1bHQiOiAi5qC45bCN562U5qGIIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIlRleHQgZm9yIFwiU3VibWl0XCIgYnV0dG9uIiwKICAgICAgImRlZmF1bHQiOiAiU3VibWl0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuWGjeippuS4gOasoeaMiemIleaWh+WtlyIsCiAgICAgICJkZWZhdWx0IjogIuWGjeippuS4gOasoSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLpoa\/npLrmraPop6PmjInpiJXmloflrZciLAogICAgICAiZGVmYXVsdCI6ICLpoa\/npLrmraPop6MiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi6KGM54K66Kit572uIiwKICAgICAgImRlc2NyaXB0aW9uIjogIumAmeS6m+ioreWumuWPr+S7peiuk+S9oOaOp+WItuS7u+WLmeeahOihjOeCuuOAgiIsCiAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIuWVn+eUqOOAjOWGjeippuS4gOasoeOAjeaMiemIlSIKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICJsYWJlbCI6ICLllZ\/nlKjjgIzpoa\/npLrmraPop6PjgI3mjInpiJUiCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAibGFiZWwiOiAi5ZWf55So44CM5qC45bCN562U5qGI44CN5oyJ6YiVIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImxhYmVsIjogIumhr+ekuuioiOWIhueLgOaFiyIsCiAgICAgICAgICAiZGVzY3JpcHRpb24iOiAi5Zyo5q+P5YCL6aCF55uu5peB6aGv56S65Yqg5YiG5oiW5rib5YiG5oOF5b2i44CCIgogICAgICAgIH0KICAgICAgXQogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuetlOWwjeeahOmhr+ekuuaWh+WtlyIsCiAgICAgICJkZWZhdWx0IjogIuetlOWwje+8gSIsCiAgICAgICJkZXNjcmlwdGlvbiI6ICLnlKjmlrzooajnpLrnrZTmoYjmraPnorrnmoTmloflrZfjgIIiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAi562U6Yyv55qE6aGv56S65paH5a2XIiwKICAgICAgImRlZmF1bHQiOiAi562U6Yyv77yBIiwKICAgICAgImRlc2NyaXB0aW9uIjogIueUqOaWvOihqOekuuetlOahiOmMr+iqpOeahOaWh+Wtl+OAgiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLlsJHnrZTnmoTpoa\/npLrmloflrZciLAogICAgICAiZGVmYXVsdCI6ICLnvLrlsJEhIiwKICAgICAgImRlc2NyaXB0aW9uIjogIueUqOaWvOihqOekuuaykuacieS9nOetlOeahOaWh+Wtl+OAgiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICLpoa\/npLrmraPop6PnmoToqqrmmI7mloflrZciLAogICAgICAiZGVmYXVsdCI6ICLpgJnmmK\/mraPnorrnmoTop6PnrZTjgIIiLAogICAgICAiZGVzY3JpcHRpb24iOiAi55So5L6G5ZGK6Ki055So5oi25Lu75YuZ5bey5pu05paw5oiQ5q2j56K66Kej562U44CCIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIuWgseiugOWZqOW+l+WIhuaineaWh+acrCIsCiAgICAgICJkZWZhdWx0IjogIuS9oOW+l+WIsCA6bnVtIOWIhu+8jOe4veWIhiA6dG90YWwg5YiG44CCIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkxhYmVsIGZvciB0aGUgZnVsbCByZWFkYWJsZSB0ZXh0IGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiRnVsbCByZWFkYWJsZSB0ZXh0IgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkxhYmVsIGZvciB0aGUgdGV4dCB3aGVyZSB3b3JkcyBjYW4gYmUgbWFya2VkIGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiRnVsbCB0ZXh0IHdoZXJlIHdvcmRzIGNhbiBiZSBtYXJrZWQiCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiU29sdXRpb24gbW9kZSBoZWFkZXIgZm9yIGFzc2lzdGl2ZSB0ZWNobm9sb2dpZXMiLAogICAgICAiZGVmYXVsdCI6ICJTb2x1dGlvbiBtb2RlIgogICAgfSwKICAgIHsKICAgICAgImxhYmVsIjogIkNoZWNraW5nIG1vZGUgaGVhZGVyIGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICAgImRlZmF1bHQiOiAiQ2hlY2tpbmcgbW9kZSIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJBc3Npc3RpdmUgdGVjaG5vbG9neSBkZXNjcmlwdGlvbiBmb3IgXCJDaGVja1wiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIkNoZWNrIHRoZSBhbnN3ZXJzLiBUaGUgcmVzcG9uc2VzIHdpbGwgYmUgbWFya2VkIGFzIGNvcnJlY3QsIGluY29ycmVjdCwgb3IgdW5hbnN3ZXJlZC4iCiAgICB9LAogICAgewogICAgICAibGFiZWwiOiAiQXNzaXN0aXZlIHRlY2hub2xvZ3kgZGVzY3JpcHRpb24gZm9yIFwiU2hvdyBTb2x1dGlvblwiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlNob3cgdGhlIHNvbHV0aW9uLiBUaGUgdGFzayB3aWxsIGJlIG1hcmtlZCB3aXRoIGl0cyBjb3JyZWN0IHNvbHV0aW9uLiIKICAgIH0sCiAgICB7CiAgICAgICJsYWJlbCI6ICJBc3Npc3RpdmUgdGVjaG5vbG9neSBkZXNjcmlwdGlvbiBmb3IgXCJSZXRyeVwiIGJ1dHRvbiIsCiAgICAgICJkZWZhdWx0IjogIlJldHJ5IHRoZSB0YXNrLiBSZXNldCBhbGwgcmVzcG9uc2VzIGFuZCBzdGFydCB0aGUgdGFzayBvdmVyIGFnYWluLiIKICAgIH0KICBdCn0K"],"libraries\/H5P.MarkTheWords-1.11\/library.json":["application\/json","ewogICJ0aXRsZSI6ICJNYXJrIHRoZSBXb3JkcyIsCiAgImRlc2NyaXB0aW9uIjogIlRlc3QgeW91ciB1c2VycyBieSBtYWtpbmcgdGhlbSBzZWxlY3QgdGhlIGNvcnJlY3Qgd29yZHMgZnJvbSBhIHRleHQuIiwKICAibWFqb3JWZXJzaW9uIjogMSwKICAibWlub3JWZXJzaW9uIjogMTEsCiAgInBhdGNoVmVyc2lvbiI6IDYsCiAgImNvcmVBcGkiOiB7CiAgICAibWFqb3JWZXJzaW9uIjogMSwKICAgICJtaW5vclZlcnNpb24iOiAxOQogIH0sCiAgInJ1bm5hYmxlIjogMSwKICAiZW1iZWRUeXBlcyI6IFsKICAgICJpZnJhbWUiCiAgXSwKICAiYXV0aG9yIjogIkpvdWJlbCIsCiAgImxpY2Vuc2UiOiAiTUlUIiwKICAibWFjaGluZU5hbWUiOiAiSDVQLk1hcmtUaGVXb3JkcyIsCiAgInByZWxvYWRlZENzcyI6IFsKICAgIHsKICAgICAgInBhdGgiOiAic3R5bGVzL21hcmstdGhlLXdvcmRzLmNzcyIKICAgIH0KICBdLAogICJwcmVsb2FkZWRKcyI6IFsKICAgIHsKICAgICAgInBhdGgiOiAic2NyaXB0cy9rZXlib2FyZC1uYXYuanMiCiAgICB9LAogICAgewogICAgICAicGF0aCI6ICJzY3JpcHRzL3hBUEktZ2VuZXJhdG9yLmpzIgogICAgfSwKICAgIHsKICAgICAgInBhdGgiOiAic2NyaXB0cy93b3JkLmpzIgogICAgfSwKICAgIHsKICAgICAgInBhdGgiOiAic2NyaXB0cy9tYXJrLXRoZS13b3Jkcy5qcyIKICAgIH0KICBdLAogICJwcmVsb2FkZWREZXBlbmRlbmNpZXMiOiBbCiAgICB7CiAgICAgICJtYWNoaW5lTmFtZSI6ICJGb250QXdlc29tZSIsCiAgICAgICJtYWpvclZlcnNpb24iOiA0LAogICAgICAibWlub3JWZXJzaW9uIjogNQogICAgfSwKICAgIHsKICAgICAgIm1hY2hpbmVOYW1lIjogIkg1UC5Kb3ViZWxVSSIsCiAgICAgICJtYWpvclZlcnNpb24iOiAxLAogICAgICAibWlub3JWZXJzaW9uIjogMwogICAgfSwKICAgIHsKICAgICAgIm1hY2hpbmVOYW1lIjogIkg1UC5RdWVzdGlvbiIsCiAgICAgICJtYWpvclZlcnNpb24iOiAxLAogICAgICAibWlub3JWZXJzaW9uIjogNQogICAgfQogIF0sCiAgImVkaXRvckRlcGVuZGVuY2llcyI6IFsKICAgIHsKICAgICAgIm1hY2hpbmVOYW1lIjogIkg1UEVkaXRvci5SYW5nZUxpc3QiLAogICAgICAibWFqb3JWZXJzaW9uIjogMSwKICAgICAgIm1pbm9yVmVyc2lvbiI6IDAKICAgIH0sCiAgICB7CiAgICAgICJtYWNoaW5lTmFtZSI6ICJINVBFZGl0b3IuU2hvd1doZW4iLAogICAgICAibWFqb3JWZXJzaW9uIjogMSwKICAgICAgIm1pbm9yVmVyc2lvbiI6IDAKICAgIH0KICBdCn0="],"libraries\/H5P.MarkTheWords-1.11\/semantics.json":["application\/json","WwogIHsKICAgICJuYW1lIjogIm1lZGlhIiwKICAgICJ0eXBlIjogImdyb3VwIiwKICAgICJsYWJlbCI6ICJNZWRpYSIsCiAgICAiaW1wb3J0YW5jZSI6ICJtZWRpdW0iLAogICAgImZpZWxkcyI6IFsKICAgICAgewogICAgICAgICJuYW1lIjogInR5cGUiLAogICAgICAgICJ0eXBlIjogImxpYnJhcnkiLAogICAgICAgICJsYWJlbCI6ICJUeXBlIiwKICAgICAgICAiaW1wb3J0YW5jZSI6ICJtZWRpdW0iLAogICAgICAgICJvcHRpb25zIjogWwogICAgICAgICAgIkg1UC5JbWFnZSAxLjEiLAogICAgICAgICAgIkg1UC5WaWRlbyAxLjYiLAogICAgICAgICAgIkg1UC5BdWRpbyAxLjUiCiAgICAgICAgXSwKICAgICAgICAib3B0aW9uYWwiOiB0cnVlLAogICAgICAgICJkZXNjcmlwdGlvbiI6ICJPcHRpb25hbCBtZWRpYSB0byBkaXNwbGF5IGFib3ZlIHRoZSBxdWVzdGlvbi4iCiAgICAgIH0sCiAgICAgIHsKICAgICAgICAibmFtZSI6ICJkaXNhYmxlSW1hZ2Vab29taW5nIiwKICAgICAgICAidHlwZSI6ICJib29sZWFuIiwKICAgICAgICAibGFiZWwiOiAiRGlzYWJsZSBpbWFnZSB6b29taW5nIiwKICAgICAgICAiaW1wb3J0YW5jZSI6ICJsb3ciLAogICAgICAgICJkZWZhdWx0IjogZmFsc2UsCiAgICAgICAgIm9wdGlvbmFsIjogdHJ1ZSwKICAgICAgICAid2lkZ2V0IjogInNob3dXaGVuIiwKICAgICAgICAic2hvd1doZW4iOiB7CiAgICAgICAgICAicnVsZXMiOiBbCiAgICAgICAgICAgIHsKICAgICAgICAgICAgICAiZmllbGQiOiAidHlwZSIsCiAgICAgICAgICAgICAgImVxdWFscyI6ICJINVAuSW1hZ2UgMS4xIgogICAgICAgICAgICB9CiAgICAgICAgICBdCiAgICAgICAgfQogICAgICB9CiAgICBdCiAgfSwKICB7CiAgICAibGFiZWwiOiAiVGFzayBkZXNjcmlwdGlvbiIsCiAgICAiaW1wb3J0YW5jZSI6ICJoaWdoIiwKICAgICJuYW1lIjogInRhc2tEZXNjcmlwdGlvbiIsCiAgICAidHlwZSI6ICJ0ZXh0IiwKICAgICJ3aWRnZXQiOiAiaHRtbCIsCiAgICAiZGVzY3JpcHRpb24iOiAiRGVzY3JpYmUgaG93IHRoZSB1c2VyIHNob3VsZCBzb2x2ZSB0aGUgdGFzay4iLAogICAgInBsYWNlaG9sZGVyIjogIkNsaWNrIG9uIGFsbCB0aGUgdmVyYnMgaW4gdGhlIHRleHQgdGhhdCBmb2xsb3dzLiIsCiAgICAiZW50ZXJNb2RlIjogInAiLAogICAgInRhZ3MiOiBbCiAgICAgICJzdHJvbmciLAogICAgICAiZW0iLAogICAgICAidSIsCiAgICAgICJhIiwKICAgICAgInVsIiwKICAgICAgIm9sIiwKICAgICAgImgyIiwKICAgICAgImgzIiwKICAgICAgImhyIiwKICAgICAgInByZSIsCiAgICAgICJjb2RlIgogICAgXQogIH0sCiAgewogICAgImxhYmVsIjogIlRleHRmaWVsZCIsCiAgICAiaW1wb3J0YW5jZSI6ICJoaWdoIiwKICAgICJuYW1lIjogInRleHRGaWVsZCIsCiAgICAidHlwZSI6ICJ0ZXh0IiwKICAgICJ3aWRnZXQiOiAiaHRtbCIsCiAgICAidGFncyI6IFsKICAgICAgInAiLAogICAgICAiYnIiLAogICAgICAic3Ryb25nIiwKICAgICAgImVtIiwKICAgICAgImNvZGUiCiAgICBdLAogICAgInBsYWNlaG9sZGVyIjogIlRoaXMgaXMgYW4gYW5zd2VyOiAqYW5zd2VyKi4iLAogICAgImRlc2NyaXB0aW9uIjogIiIsCiAgICAiaW1wb3J0YW50IjogewogICAgICAiZGVzY3JpcHRpb24iOiAiPHVsPjxsaT5Db3JyZWN0IHdvcmRzIGFyZSBtYXJrZWQgd2l0aCBhc3Rlcmlza3MgKCopIGJlZm9yZSBhbmQgYWZ0ZXIgdGhlIHdvcmQuPC9saT48bGk+QXN0ZXJpc2tzIGNhbiBiZSBhZGRlZCB3aXRoaW4gbWFya2VkIHdvcmRzIGJ5IGFkZGluZyBhbm90aGVyIGFzdGVyaXNrLCAqY29ycmVjdHdvcmQqKiogPSZndDsgY29ycmVjdHdvcmQqLjwvbGk+PGxpPk9ubHkgd29yZHMgbWF5IGJlIG1hcmtlZCBhcyBjb3JyZWN0LiBOb3QgcGhyYXNlcy48L2xpPjwvdWw+IiwKICAgICAgImV4YW1wbGUiOiAiVGhlIGNvcnJlY3Qgd29yZHMgYXJlIG1hcmtlZCBsaWtlIHRoaXM6ICpjb3JyZWN0d29yZCosIGFuIGFzdGVyaXNrIGlzIHdyaXR0ZW4gbGlrZSB0aGlzOiAqY29ycmVjdHdvcmQqKiouIgogICAgfQogIH0sCiAgewogICAgIm5hbWUiOiAib3ZlcmFsbEZlZWRiYWNrIiwKICAgICJ0eXBlIjogImdyb3VwIiwKICAgICJsYWJlbCI6ICJPdmVyYWxsIEZlZWRiYWNrIiwKICAgICJpbXBvcnRhbmNlIjogImxvdyIsCiAgICAiZXhwYW5kZWQiOiB0cnVlLAogICAgImZpZWxkcyI6IFsKICAgICAgewogICAgICAgICJuYW1lIjogIm92ZXJhbGxGZWVkYmFjayIsCiAgICAgICAgInR5cGUiOiAibGlzdCIsCiAgICAgICAgIndpZGdldHMiOiBbCiAgICAgICAgICB7CiAgICAgICAgICAgICJuYW1lIjogIlJhbmdlTGlzdCIsCiAgICAgICAgICAgICJsYWJlbCI6ICJEZWZhdWx0IgogICAgICAgICAgfQogICAgICAgIF0sCiAgICAgICAgImltcG9ydGFuY2UiOiAiaGlnaCIsCiAgICAgICAgImxhYmVsIjogIkRlZmluZSBjdXN0b20gZmVlZGJhY2sgZm9yIGFueSBzY29yZSByYW5nZSIsCiAgICAgICAgImRlc2NyaXB0aW9uIjogIkNsaWNrIHRoZSBcIkFkZCByYW5nZVwiIGJ1dHRvbiB0byBhZGQgYXMgbWFueSByYW5nZXMgYXMgeW91IG5lZWQuIEV4YW1wbGU6IDAtMjAlIEJhZCBzY29yZSwgMjEtOTElIEF2ZXJhZ2UgU2NvcmUsIDkxLTEwMCUgR3JlYXQgU2NvcmUhIiwKICAgICAgICAiZW50aXR5IjogInJhbmdlIiwKICAgICAgICAibWluIjogMSwKICAgICAgICAiZGVmYXVsdE51bSI6IDEsCiAgICAgICAgIm9wdGlvbmFsIjogdHJ1ZSwKICAgICAgICAiZmllbGQiOiB7CiAgICAgICAgICAibmFtZSI6ICJvdmVyYWxsRmVlZGJhY2siLAogICAgICAgICAgInR5cGUiOiAiZ3JvdXAiLAogICAgICAgICAgImltcG9ydGFuY2UiOiAibG93IiwKICAgICAgICAgICJmaWVsZHMiOiBbCiAgICAgICAgICAgIHsKICAgICAgICAgICAgICAibmFtZSI6ICJmcm9tIiwKICAgICAgICAgICAgICAidHlwZSI6ICJudW1iZXIiLAogICAgICAgICAgICAgICJsYWJlbCI6ICJTY29yZSBSYW5nZSIsCiAgICAgICAgICAgICAgIm1pbiI6IDAsCiAgICAgICAgICAgICAgIm1heCI6IDEwMCwKICAgICAgICAgICAgICAiZGVmYXVsdCI6IDAsCiAgICAgICAgICAgICAgInVuaXQiOiAiJSIKICAgICAgICAgICAgfSwKICAgICAgICAgICAgewogICAgICAgICAgICAgICJuYW1lIjogInRvIiwKICAgICAgICAgICAgICAidHlwZSI6ICJudW1iZXIiLAogICAgICAgICAgICAgICJtaW4iOiAwLAogICAgICAgICAgICAgICJtYXgiOiAxMDAsCiAgICAgICAgICAgICAgImRlZmF1bHQiOiAxMDAsCiAgICAgICAgICAgICAgInVuaXQiOiAiJSIKICAgICAgICAgICAgfSwKICAgICAgICAgICAgewogICAgICAgICAgICAgICJuYW1lIjogImZlZWRiYWNrIiwKICAgICAgICAgICAgICAidHlwZSI6ICJ0ZXh0IiwKICAgICAgICAgICAgICAibGFiZWwiOiAiRmVlZGJhY2sgZm9yIGRlZmluZWQgc2NvcmUgcmFuZ2UiLAogICAgICAgICAgICAgICJpbXBvcnRhbmNlIjogImxvdyIsCiAgICAgICAgICAgICAgInBsYWNlaG9sZGVyIjogIkZpbGwgaW4gdGhlIGZlZWRiYWNrIiwKICAgICAgICAgICAgICAib3B0aW9uYWwiOiB0cnVlCiAgICAgICAgICAgIH0KICAgICAgICAgIF0KICAgICAgICB9CiAgICAgIH0KICAgIF0KICB9LAogIHsKICAgICJsYWJlbCI6ICJUZXh0IGZvciBcIkNoZWNrXCIgYnV0dG9uIiwKICAgICJpbXBvcnRhbmNlIjogImxvdyIsCiAgICAibmFtZSI6ICJjaGVja0Fuc3dlckJ1dHRvbiIsCiAgICAidHlwZSI6ICJ0ZXh0IiwKICAgICJkZWZhdWx0IjogIkNoZWNrIiwKICAgICJjb21tb24iOiB0cnVlCiAgfSwKICB7CiAgICAibGFiZWwiOiAiVGV4dCBmb3IgXCJTdWJtaXRcIiBidXR0b24iLAogICAgImltcG9ydGFuY2UiOiAibG93IiwKICAgICJuYW1lIjogInN1Ym1pdEFuc3dlckJ1dHRvbiIsCiAgICAidHlwZSI6ICJ0ZXh0IiwKICAgICJkZWZhdWx0IjogIlN1Ym1pdCIsCiAgICAiY29tbW9uIjogdHJ1ZQogIH0sCiAgewogICAgImxhYmVsIjogIlRleHQgZm9yIFwiUmV0cnlcIiBidXR0b24iLAogICAgImltcG9ydGFuY2UiOiAibG93IiwKICAgICJuYW1lIjogInRyeUFnYWluQnV0dG9uIiwKICAgICJ0eXBlIjogInRleHQiLAogICAgImRlZmF1bHQiOiAiUmV0cnkiLAogICAgImNvbW1vbiI6IHRydWUKICB9LAogIHsKICAgICJsYWJlbCI6ICJUZXh0IGZvciBcIlNob3cgc29sdXRpb25cIiBidXR0b24iLAogICAgImltcG9ydGFuY2UiOiAibG93IiwKICAgICJuYW1lIjogInNob3dTb2x1dGlvbkJ1dHRvbiIsCiAgICAidHlwZSI6ICJ0ZXh0IiwKICAgICJkZWZhdWx0IjogIlNob3cgc29sdXRpb24iLAogICAgImNvbW1vbiI6IHRydWUKICB9LAogIHsKICAgICJuYW1lIjogImJlaGF2aW91ciIsCiAgICAiaW1wb3J0YW5jZSI6ICJsb3ciLAogICAgInR5cGUiOiAiZ3JvdXAiLAogICAgImxhYmVsIjogIkJlaGF2aW91cmFsIHNldHRpbmdzLiIsCiAgICAiZGVzY3JpcHRpb24iOiAiVGhlc2Ugb3B0aW9ucyB3aWxsIGxldCB5b3UgY29udHJvbCBob3cgdGhlIHRhc2sgYmVoYXZlcy4iLAogICAgIm9wdGlvbmFsIjogdHJ1ZSwKICAgICJmaWVsZHMiOiBbCiAgICAgIHsKICAgICAgICAibmFtZSI6ICJlbmFibGVSZXRyeSIsCiAgICAgICAgInR5cGUiOiAiYm9vbGVhbiIsCiAgICAgICAgImxhYmVsIjogIkVuYWJsZSBcIlJldHJ5XCIiLAogICAgICAgICJpbXBvcnRhbmNlIjogImxvdyIsCiAgICAgICAgImRlZmF1bHQiOiB0cnVlCiAgICAgIH0sCiAgICAgIHsKICAgICAgICAibmFtZSI6ICJlbmFibGVTb2x1dGlvbnNCdXR0b24iLAogICAgICAgICJ0eXBlIjogImJvb2xlYW4iLAogICAgICAgICJsYWJlbCI6ICJFbmFibGUgXCJTaG93IHNvbHV0aW9uXCIgYnV0dG9uIiwKICAgICAgICAiaW1wb3J0YW5jZSI6ICJsb3ciLAogICAgICAgICJkZWZhdWx0IjogdHJ1ZQogICAgICB9LAogICAgICB7CiAgICAgICAgIm5hbWUiOiAiZW5hYmxlQ2hlY2tCdXR0b24iLAogICAgICAgICJ0eXBlIjogImJvb2xlYW4iLAogICAgICAgICJsYWJlbCI6ICJFbmFibGUgXCJDaGVja1wiIGJ1dHRvbiIsCiAgICAgICAgIndpZGdldCI6ICJub25lIiwKICAgICAgICAiaW1wb3J0YW5jZSI6ICJsb3ciLAogICAgICAgICJkZWZhdWx0IjogdHJ1ZSwKICAgICAgICAib3B0aW9uYWwiOiB0cnVlCiAgICAgIH0sCiAgICAgIHsKICAgICAgICAibmFtZSI6ICJzaG93U2NvcmVQb2ludHMiLAogICAgICAgICJ0eXBlIjogImJvb2xlYW4iLAogICAgICAgICJsYWJlbCI6ICJTaG93IHNjb3JlIHBvaW50cyIsCiAgICAgICAgImRlc2NyaXB0aW9uIjogIlNob3cgcG9pbnRzIGVhcm5lZCBmb3IgZWFjaCBhbnN3ZXIuIiwKICAgICAgICAiaW1wb3J0YW5jZSI6ICJsb3ciLAogICAgICAgICJkZWZhdWx0IjogdHJ1ZQogICAgICB9CiAgICBdCiAgfSwKICB7CiAgICAibGFiZWwiOiAiQ29ycmVjdCBhbnN3ZXIgdGV4dCIsCiAgICAiaW1wb3J0YW5jZSI6ICJsb3ciLAogICAgIm5hbWUiOiAiY29ycmVjdEFuc3dlciIsCiAgICAidHlwZSI6ICJ0ZXh0IiwKICAgICJkZWZhdWx0IjogIkNvcnJlY3QhIiwKICAgICJkZXNjcmlwdGlvbiI6ICJUZXh0IHVzZWQgdG8gaW5kaWNhdGUgdGhhdCBhbiBhbnN3ZXIgaXMgY29ycmVjdCIsCiAgICAiY29tbW9uIjogdHJ1ZQogIH0sCiAgewogICAgImxhYmVsIjogIkluY29ycmVjdCBhbnN3ZXIgdGV4dCIsCiAgICAiaW1wb3J0YW5jZSI6ICJsb3ciLAogICAgIm5hbWUiOiAiaW5jb3JyZWN0QW5zd2VyIiwKICAgICJ0eXBlIjogInRleHQiLAogICAgImRlZmF1bHQiOiAiSW5jb3JyZWN0ISIsCiAgICAiZGVzY3JpcHRpb24iOiAiVGV4dCB1c2VkIHRvIGluZGljYXRlIHRoYXQgYW4gYW5zd2VyIGlzIGluY29ycmVjdCIsCiAgICAiY29tbW9uIjogdHJ1ZQogIH0sCiAgewogICAgImxhYmVsIjogIk1pc3NlZCBhbnN3ZXIgdGV4dCIsCiAgICAiaW1wb3J0YW5jZSI6ICJsb3ciLAogICAgIm5hbWUiOiAibWlzc2VkQW5zd2VyIiwKICAgICJ0eXBlIjogInRleHQiLAogICAgImRlZmF1bHQiOiAiQW5zd2VyIG5vdCBmb3VuZCEiLAogICAgImRlc2NyaXB0aW9uIjogIlRleHQgdXNlZCB0byBpbmRpY2F0ZSB0aGF0IGFuIGFuc3dlciBpcyBtaXNzaW5nIiwKICAgICJjb21tb24iOiB0cnVlCiAgfSwKICB7CiAgICAibGFiZWwiOiAiRGVzY3JpcHRpb24gZm9yIERpc3BsYXkgU29sdXRpb24iLAogICAgImltcG9ydGFuY2UiOiAibG93IiwKICAgICJuYW1lIjogImRpc3BsYXlTb2x1dGlvbkRlc2NyaXB0aW9uIiwKICAgICJ0eXBlIjogInRleHQiLAogICAgImRlZmF1bHQiOiAiVGFzayBpcyB1cGRhdGVkIHRvIGNvbnRhaW4gdGhlIHNvbHV0aW9uLiIsCiAgICAiZGVzY3JpcHRpb24iOiAiVGhpcyB0ZXh0IHRlbGxzIHRoZSB1c2VyIHRoYXQgdGhlIHRhc2tzIGhhcyBiZWVuIHVwZGF0ZWQgd2l0aCB0aGUgc29sdXRpb24uIiwKICAgICJjb21tb24iOiB0cnVlCiAgfSwKICB7CiAgICAibmFtZSI6ICJzY29yZUJhckxhYmVsIiwKICAgICJ0eXBlIjogInRleHQiLAogICAgImxhYmVsIjogIlRleHR1YWwgcmVwcmVzZW50YXRpb24gb2YgdGhlIHNjb3JlIGJhciBmb3IgdGhvc2UgdXNpbmcgYSByZWFkc3BlYWtlciIsCiAgICAiZGVmYXVsdCI6ICJZb3UgZ290IDpudW0gb3V0IG9mIDp0b3RhbCBwb2ludHMiLAogICAgImltcG9ydGFuY2UiOiAibG93IiwKICAgICJjb21tb24iOiB0cnVlCiAgfSwKICB7CiAgICAibmFtZSI6ICJhMTF5RnVsbFRleHRMYWJlbCIsCiAgICAidHlwZSI6ICJ0ZXh0IiwKICAgICJsYWJlbCI6ICJMYWJlbCBmb3IgdGhlIGZ1bGwgcmVhZGFibGUgdGV4dCBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAiZGVmYXVsdCI6ICJGdWxsIHJlYWRhYmxlIHRleHQiLAogICAgImltcG9ydGFuY2UiOiAibG93IiwKICAgICJjb21tb24iOiB0cnVlCiAgfSwKICB7CiAgICAibmFtZSI6ICJhMTF5Q2xpY2thYmxlVGV4dExhYmVsIiwKICAgICJ0eXBlIjogInRleHQiLAogICAgImxhYmVsIjogIkxhYmVsIGZvciB0aGUgdGV4dCB3aGVyZSB3b3JkcyBjYW4gYmUgbWFya2VkIGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICJkZWZhdWx0IjogIkZ1bGwgdGV4dCB3aGVyZSB3b3JkcyBjYW4gYmUgbWFya2VkIiwKICAgICJpbXBvcnRhbmNlIjogImxvdyIsCiAgICAiY29tbW9uIjogdHJ1ZQogIH0sCiAgewogICAgIm5hbWUiOiAiYTExeVNvbHV0aW9uTW9kZUhlYWRlciIsCiAgICAidHlwZSI6ICJ0ZXh0IiwKICAgICJsYWJlbCI6ICJTb2x1dGlvbiBtb2RlIGhlYWRlciBmb3IgYXNzaXN0aXZlIHRlY2hub2xvZ2llcyIsCiAgICAiZGVmYXVsdCI6ICJTb2x1dGlvbiBtb2RlIiwKICAgICJpbXBvcnRhbmNlIjogImxvdyIsCiAgICAiY29tbW9uIjogdHJ1ZQogIH0sCiAgewogICAgIm5hbWUiOiAiYTExeUNoZWNraW5nSGVhZGVyIiwKICAgICJ0eXBlIjogInRleHQiLAogICAgImxhYmVsIjogIkNoZWNraW5nIG1vZGUgaGVhZGVyIGZvciBhc3Npc3RpdmUgdGVjaG5vbG9naWVzIiwKICAgICJkZWZhdWx0IjogIkNoZWNraW5nIG1vZGUiLAogICAgImltcG9ydGFuY2UiOiAibG93IiwKICAgICJjb21tb24iOiB0cnVlCiAgfSwKICB7CiAgICAibmFtZSI6ICJhMTF5Q2hlY2siLAogICAgInR5cGUiOiAidGV4dCIsCiAgICAibGFiZWwiOiAiQXNzaXN0aXZlIHRlY2hub2xvZ3kgZGVzY3JpcHRpb24gZm9yIFwiQ2hlY2tcIiBidXR0b24iLAogICAgImRlZmF1bHQiOiAiQ2hlY2sgdGhlIGFuc3dlcnMuIFRoZSByZXNwb25zZXMgd2lsbCBiZSBtYXJrZWQgYXMgY29ycmVjdCwgaW5jb3JyZWN0LCBvciB1bmFuc3dlcmVkLiIsCiAgICAiaW1wb3J0YW5jZSI6ICJsb3ciLAogICAgImNvbW1vbiI6IHRydWUKICB9LAogIHsKICAgICJuYW1lIjogImExMXlTaG93U29sdXRpb24iLAogICAgInR5cGUiOiAidGV4dCIsCiAgICAibGFiZWwiOiAiQXNzaXN0aXZlIHRlY2hub2xvZ3kgZGVzY3JpcHRpb24gZm9yIFwiU2hvdyBTb2x1dGlvblwiIGJ1dHRvbiIsCiAgICAiZGVmYXVsdCI6ICJTaG93IHRoZSBzb2x1dGlvbi4gVGhlIHRhc2sgd2lsbCBiZSBtYXJrZWQgd2l0aCBpdHMgY29ycmVjdCBzb2x1dGlvbi4iLAogICAgImltcG9ydGFuY2UiOiAibG93IiwKICAgICJjb21tb24iOiB0cnVlCiAgfSwKICB7CiAgICAibmFtZSI6ICJhMTF5UmV0cnkiLAogICAgInR5cGUiOiAidGV4dCIsCiAgICAibGFiZWwiOiAiQXNzaXN0aXZlIHRlY2hub2xvZ3kgZGVzY3JpcHRpb24gZm9yIFwiUmV0cnlcIiBidXR0b24iLAogICAgImRlZmF1bHQiOiAiUmV0cnkgdGhlIHRhc2suIFJlc2V0IGFsbCByZXNwb25zZXMgYW5kIHN0YXJ0IHRoZSB0YXNrIG92ZXIgYWdhaW4uIiwKICAgICJpbXBvcnRhbmNlIjogImxvdyIsCiAgICAiY29tbW9uIjogdHJ1ZQogIH0KXQ=="],"libraries\/H5P.Question-1.5\/library.json":["application\/json","ewogICJ0aXRsZSI6ICJRdWVzdGlvbiIsCiAgIm1hY2hpbmVOYW1lIjogIkg1UC5RdWVzdGlvbiIsCiAgIm1ham9yVmVyc2lvbiI6IDEsCiAgIm1pbm9yVmVyc2lvbiI6IDUsCiAgInBhdGNoVmVyc2lvbiI6IDEzLAogICJydW5uYWJsZSI6IDAsCiAgImxpY2Vuc2UiOiAiTUlUIiwKICAiYXV0aG9yIjogIkpvdWJlbCIsCiAgImNvcmVBcGkiOiB7CiAgICAibWFqb3JWZXJzaW9uIjogMSwKICAgICJtaW5vclZlcnNpb24iOiA3CiAgfSwKICAicHJlbG9hZGVkQ3NzIjogWwogICAgewogICAgICAicGF0aCI6ICJzdHlsZXMvcXVlc3Rpb24uY3NzIgogICAgfSwKICAgIHsKICAgICAgInBhdGgiOiAic3R5bGVzL2V4cGxhaW5lci5jc3MiCiAgICB9CiAgXSwKICAicHJlbG9hZGVkSnMiOiBbCiAgICB7CiAgICAgICJwYXRoIjogInNjcmlwdHMvcXVlc3Rpb24uanMiCiAgICB9LAogICAgewogICAgICAicGF0aCI6ICJzY3JpcHRzL2V4cGxhaW5lci5qcyIKICAgIH0sCiAgICB7CiAgICAgICJwYXRoIjogInNjcmlwdHMvc2NvcmUtcG9pbnRzLmpzIgogICAgfQogIF0sCiAgInByZWxvYWRlZERlcGVuZGVuY2llcyI6IFsKICAgIHsKICAgICAgIm1hY2hpbmVOYW1lIjogIkZvbnRBd2Vzb21lIiwKICAgICAgIm1ham9yVmVyc2lvbiI6IDQsCiAgICAgICJtaW5vclZlcnNpb24iOiA1CiAgICB9LAogICAgewogICAgICAibWFjaGluZU5hbWUiOiAiSDVQLkpvdWJlbFVJIiwKICAgICAgIm1ham9yVmVyc2lvbiI6IDEsCiAgICAgICJtaW5vclZlcnNpb24iOiAzCiAgICB9CiAgXQp9"],"libraries\/H5P.Transition-1.0\/library.json":["application\/json","ewogICJtYWNoaW5lTmFtZSI6ICJINVAuVHJhbnNpdGlvbiIsCiAgInRpdGxlIjogIlRyYW5zaXRpb24iLAogICJkZXNjcmlwdGlvbiI6ICJDb250YWlucyBoZWxwZXIgZnVuY3Rpb24gcmVsZXZhbnQgZm9yIHRyYW5zaXRpb25pbmciLAogICJsaWNlbnNlIjogIk1JVCIsCiAgImF1dGhvciI6ICJKb3ViZWwiLAogICJtYWpvclZlcnNpb24iOiAxLAogICJtaW5vclZlcnNpb24iOiAwLAogICJwYXRjaFZlcnNpb24iOiA0LAogICJydW5uYWJsZSI6IDAsCiAgInByZWxvYWRlZEpzIjogWwogICAgewogICAgICAicGF0aCI6ICJ0cmFuc2l0aW9uLmpzIgogICAgfQogIF0KfQ=="]});		H5PIntegration	= (function(x){
			let url	= window.location.href.split('/');
			url.pop();
			x.url	= url.join('/');
			return x;
		})({"baseUrl":"","url":"","siteUrl":"","l10n":{"H5P":{"fullscreen":"Vollbild","disableFullscreen":"Kein Vollbild","download":"Download","copyrights":"Nutzungsrechte","embed":"Einbetten","size":"Size","showAdvanced":"Show advanced","hideAdvanced":"Hide advanced","advancedHelp":"Include this script on your website if you want dynamic sizing of the embedded content:","copyrightInformation":"Nutzungsrechte","close":"Schlie\u00dfen","title":"Titel","author":"Autor","year":"Jahr","source":"Quelle","license":"Lizenz","thumbnail":"Thumbnail","noCopyrights":"Keine Copyright-Informationen vorhanden","reuse":"Wiederverwenden","reuseContent":"Verwende Inhalt","reuseDescription":"Verwende Inhalt.","downloadDescription":"Lade den Inhalt als H5P-Datei herunter.","copyrightsDescription":"Zeige Urheberinformationen an.","embedDescription":"Zeige den Code f\u00fcr die Einbettung an.","h5pDescription":"Visit H5P.org to check out more cool content.","contentChanged":"Dieser Inhalt hat sich seit Ihrer letzten Nutzung ver\u00e4ndert.","startingOver":"Sie beginnen von vorne.","by":"von","showMore":"Zeige mehr","showLess":"Zeige weniger","subLevel":"Sublevel","confirmDialogHeader":"Best\u00e4tige Aktion","confirmDialogBody":"Please confirm that you wish to proceed. This action is not reversible.","cancelLabel":"Abbrechen","confirmLabel":"Best\u00e4tigen","licenseU":"Undisclosed","licenseCCBY":"Attribution","licenseCCBYSA":"Attribution-ShareAlike","licenseCCBYND":"Attribution-NoDerivs","licenseCCBYNC":"Attribution-NonCommercial","licenseCCBYNCSA":"Attribution-NonCommercial-ShareAlike","licenseCCBYNCND":"Attribution-NonCommercial-NoDerivs","licenseCC40":"4.0 International","licenseCC30":"3.0 Unported","licenseCC25":"2.5 Generic","licenseCC20":"2.0 Generic","licenseCC10":"1.0 Generic","licenseGPL":"General Public License","licenseV3":"Version 3","licenseV2":"Version 2","licenseV1":"Version 1","licensePD":"Public Domain","licenseCC010":"CC0 1.0 Universal (CC0 1.0) Public Domain Dedication","licensePDM":"Public Domain Mark","licenseC":"Copyright","contentType":"Inhaltstyp","licenseExtras":"License Extras","changes":"Changelog","contentCopied":"Inhalt wurde ins Clipboard kopiert","connectionLost":"Connection lost. Results will be stored and sent when you regain connection.","connectionReestablished":"Connection reestablished.","resubmitScores":"Attempting to submit stored results.","offlineDialogHeader":"Your connection to the server was lost","offlineDialogBody":"We were unable to send information about your completion of this task. Please check your internet connection.","offlineDialogRetryMessage":"Versuche es wieder in :num....","offlineDialogRetryButtonLabel":"Jetzt nochmal probieren","offlineSuccessfulSubmit":"Erfolgreich Ergebnisse gesendet."}},"hubIsEnabled":false,"reportingIsEnabled":false,"libraryConfig":null,"crossorigin":null,"crossoriginCacheBuster":null,"pluginCacheBuster":"","libraryUrl":".\/libraries\/h5pcore\/js","contents":{"cid-adjectives-1-651":{"displayOptions":{"copy":false,"copyright":false,"embed":false,"export":false,"frame":false,"icon":false},"embedCode":"","exportUrl":false,"fullScreen":false,"contentUserData":[],"metadata":{"title":"Identify adjectives","license":"U"},"library":"H5P.Column 1.16","jsonContent":"{\"content\":[{\"content\":{\"params\":{\"text\":\"<p><span style=\\\"font-size:1.25em;\\\"><strong>Q1. Select the adjective.<\\\/strong><\\\/span><\\\/p>\\n\"},\"library\":\"H5P.AdvancedText 1.1\",\"metadata\":{\"contentType\":\"Text\",\"license\":\"U\",\"title\":\"Untitled Text\"},\"subContentId\":\"eb445323-7f0b-4780-b880-7e059a760a97\"},\"useSeparator\":\"disabled\"},{\"content\":{\"params\":{\"contentName\":\"Image\",\"file\":{\"path\":\"images\\\/file-63c7c573bbfe9.png\",\"mime\":\"image\\\/png\",\"copyright\":{\"license\":\"U\"},\"width\":1300,\"height\":250},\"decorative\":false,\"alt\":\"Q1 Image\",\"expandImage\":\"Expand Image\",\"minimizeImage\":\"Minimize Image\"},\"library\":\"H5P.Image 1.1\",\"metadata\":{\"contentType\":\"Image\",\"license\":\"U\",\"title\":\"Untitled Image\"},\"subContentId\":\"25822ce3-65d7-42cd-8bf8-bd793720421d\"},\"useSeparator\":\"disabled\"},{\"content\":{\"params\":{\"overallFeedback\":[{\"from\":0,\"to\":50,\"feedback\":\"Sorry, it is incorrect.\"},{\"from\":51,\"to\":100,\"feedback\":\"Good work! It is the correct answer.\"}],\"checkAnswerButton\":\"Check\",\"submitAnswerButton\":\"Submit\",\"tryAgainButton\":\"Retry\",\"showSolutionButton\":\"Show solution\",\"behaviour\":{\"enableRetry\":false,\"enableSolutionsButton\":true,\"enableCheckButton\":true,\"showScorePoints\":true},\"correctAnswer\":\"Correct!\",\"incorrectAnswer\":\"Incorrect!\",\"missedAnswer\":\"Answer not found!\",\"displaySolutionDescription\":\"Task is updated to contain the solution.\",\"scoreBarLabel\":\"You got :num out of :total points\",\"a11yFullTextLabel\":\"Full readable text\",\"a11yClickableTextLabel\":\"Full text where words can be marked\",\"a11ySolutionModeHeader\":\"Solution mode\",\"a11yCheckingHeader\":\"Checking mode\",\"a11yCheck\":\"Check the answers. The responses will be marked as correct, incorrect, or unanswered.\",\"a11yShowSolution\":\"Show the solution. The task will be marked with its correct solution.\",\"a11yRetry\":\"Retry the task. Reset all responses and start the task over again.\",\"textField\":\"<p><strong>The *clean*&nbsp;windows shone in the sunlight.<\\\/strong><br>\\n&nbsp;<\\\/p>\\n\",\"taskDescription\":\"<p>-<\\\/p>\\n\",\"media\":{\"disableImageZooming\":false}},\"library\":\"H5P.MarkTheWords 1.11\",\"metadata\":{\"contentType\":\"Mark the Words\",\"license\":\"U\",\"title\":\"Q1 Select the adjective.\"},\"subContentId\":\"93e65e97-3317-4690-aeef-03930dea6314\"},\"useSeparator\":\"disabled\"},{\"content\":{\"params\":{\"text\":\"<p><span style=\\\"font-size:1.25em;\\\"><strong>Q2. Select the adjective.&nbsp;<\\\/strong><\\\/span><\\\/p>\\n\"},\"library\":\"H5P.AdvancedText 1.1\",\"metadata\":{\"contentType\":\"Text\",\"license\":\"U\",\"title\":\"Untitled Text\"},\"subContentId\":\"40de7f6e-e386-42ce-b044-1be54c15e75d\"},\"useSeparator\":\"enabled\"},{\"content\":{\"params\":{\"contentName\":\"Image\",\"file\":{\"path\":\"images\\\/file-63c7c5a7e9950.png\",\"mime\":\"image\\\/png\",\"copyright\":{\"license\":\"U\"},\"width\":1300,\"height\":250},\"decorative\":false,\"alt\":\"Q2 Image\",\"expandImage\":\"Expand Image\",\"minimizeImage\":\"Minimize Image\"},\"library\":\"H5P.Image 1.1\",\"metadata\":{\"contentType\":\"Image\",\"license\":\"U\",\"title\":\"Untitled Image\"},\"subContentId\":\"8c86d0ab-a7c0-42ca-9654-62f562d7ef8d\"},\"useSeparator\":\"disabled\"},{\"content\":{\"params\":{\"overallFeedback\":[{\"from\":0,\"to\":50,\"feedback\":\"Sorry, it is incorrect.\"},{\"from\":51,\"to\":100,\"feedback\":\"Awesome! It is the correct answer.\"}],\"checkAnswerButton\":\"Check\",\"submitAnswerButton\":\"Submit\",\"tryAgainButton\":\"Retry\",\"showSolutionButton\":\"Show solution\",\"behaviour\":{\"enableRetry\":false,\"enableSolutionsButton\":true,\"enableCheckButton\":true,\"showScorePoints\":true},\"correctAnswer\":\"Correct!\",\"incorrectAnswer\":\"Incorrect!\",\"missedAnswer\":\"Answer not found!\",\"displaySolutionDescription\":\"Task is updated to contain the solution.\",\"scoreBarLabel\":\"You got :num out of :total points\",\"a11yFullTextLabel\":\"Full readable text\",\"a11yClickableTextLabel\":\"Full text where words can be marked\",\"a11ySolutionModeHeader\":\"Solution mode\",\"a11yCheckingHeader\":\"Checking mode\",\"a11yCheck\":\"Check the answers. The responses will be marked as correct, incorrect, or unanswered.\",\"a11yShowSolution\":\"Show the solution. The task will be marked with its correct solution.\",\"a11yRetry\":\"Retry the task. Reset all responses and start the task over again.\",\"textField\":\"<p><strong>Mary put her *blue* pencil in her case.<\\\/strong><\\\/p>\\n\",\"taskDescription\":\"<p>-<\\\/p>\\n\",\"media\":{\"disableImageZooming\":false}},\"library\":\"H5P.MarkTheWords 1.11\",\"metadata\":{\"contentType\":\"Mark the Words\",\"license\":\"U\",\"title\":\"Q2 Select the adjective.\"},\"subContentId\":\"4473c2a3-b31c-48ca-a9db-2655123f318f\"},\"useSeparator\":\"disabled\"},{\"content\":{\"params\":{\"text\":\"<p><span style=\\\"font-size:1.25em;\\\"><strong>Q3. Select the adjective.<\\\/strong><\\\/span><\\\/p>\\n\"},\"library\":\"H5P.AdvancedText 1.1\",\"metadata\":{\"contentType\":\"Text\",\"license\":\"U\",\"title\":\"Untitled Text\"},\"subContentId\":\"cd1fc02f-9b3c-4016-a716-b1a92ae7def0\"},\"useSeparator\":\"enabled\"},{\"content\":{\"params\":{\"contentName\":\"Image\",\"file\":{\"path\":\"images\\\/file-63c7c7e99154c.png\",\"mime\":\"image\\\/png\",\"copyright\":{\"license\":\"U\"},\"width\":1300,\"height\":250},\"decorative\":false,\"alt\":\"Q3 Image\",\"expandImage\":\"Expand Image\",\"minimizeImage\":\"Minimize Image\"},\"library\":\"H5P.Image 1.1\",\"metadata\":{\"contentType\":\"Image\",\"license\":\"U\",\"title\":\"Untitled Image\"},\"subContentId\":\"c861b761-cae3-4b63-9987-8c40cee7773f\"},\"useSeparator\":\"disabled\"},{\"content\":{\"params\":{\"overallFeedback\":[{\"from\":0,\"to\":50,\"feedback\":\"Sorry, it is incorrect.\"},{\"from\":51,\"to\":100,\"feedback\":\"Bravo ! You got it right.\"}],\"checkAnswerButton\":\"Check\",\"submitAnswerButton\":\"Submit\",\"tryAgainButton\":\"Retry\",\"showSolutionButton\":\"Show solution\",\"behaviour\":{\"enableRetry\":false,\"enableSolutionsButton\":true,\"enableCheckButton\":true,\"showScorePoints\":true},\"correctAnswer\":\"Correct!\",\"incorrectAnswer\":\"Incorrect!\",\"missedAnswer\":\"Answer not found!\",\"displaySolutionDescription\":\"Task is updated to contain the solution.\",\"scoreBarLabel\":\"You got :num out of :total points\",\"a11yFullTextLabel\":\"Full readable text\",\"a11yClickableTextLabel\":\"Full text where words can be marked\",\"a11ySolutionModeHeader\":\"Solution mode\",\"a11yCheckingHeader\":\"Checking mode\",\"a11yCheck\":\"Check the answers. The responses will be marked as correct, incorrect, or unanswered.\",\"a11yShowSolution\":\"Show the solution. The task will be marked with its correct solution.\",\"a11yRetry\":\"Retry the task. Reset all responses and start the task over again.\",\"textField\":\"<p><strong>The *green* grass grows under the sunlight.<\\\/strong><\\\/p>\\n\",\"taskDescription\":\"<p>-<\\\/p>\\n\",\"media\":{\"disableImageZooming\":false}},\"library\":\"H5P.MarkTheWords 1.11\",\"metadata\":{\"contentType\":\"Mark the Words\",\"license\":\"U\",\"title\":\"Q3 Select the adjective.\"},\"subContentId\":\"88c892f3-3b90-407c-b2ca-cfcad0261ace\"},\"useSeparator\":\"disabled\"},{\"content\":{\"params\":{\"text\":\"<p><span style=\\\"font-size:1.25em;\\\"><strong>Q4. Select the adjective.<\\\/strong><\\\/span><\\\/p>\\n\"},\"library\":\"H5P.AdvancedText 1.1\",\"metadata\":{\"contentType\":\"Text\",\"license\":\"U\",\"title\":\"Untitled Text\"},\"subContentId\":\"91a044a1-0ed0-46e0-a1df-b2799c350c4a\"},\"useSeparator\":\"enabled\"},{\"content\":{\"params\":{\"contentName\":\"Image\",\"file\":{\"path\":\"images\\\/file-63c7c603436c9.png\",\"mime\":\"image\\\/png\",\"copyright\":{\"license\":\"U\"},\"width\":1300,\"height\":250},\"decorative\":false,\"alt\":\"Q4 Image\",\"expandImage\":\"Expand Image\",\"minimizeImage\":\"Minimize Image\"},\"library\":\"H5P.Image 1.1\",\"metadata\":{\"contentType\":\"Image\",\"license\":\"U\",\"title\":\"Untitled Image\"},\"subContentId\":\"1f41d5ba-92a0-4c00-b584-0b0a6c1b8769\"},\"useSeparator\":\"disabled\"},{\"content\":{\"params\":{\"overallFeedback\":[{\"from\":0,\"to\":50,\"feedback\":\"Sorry, it is incorrect.\"},{\"from\":51,\"to\":100,\"feedback\":\"Fantastic! It is the correct answer.\"}],\"checkAnswerButton\":\"Check\",\"submitAnswerButton\":\"Submit\",\"tryAgainButton\":\"Retry\",\"showSolutionButton\":\"Show solution\",\"behaviour\":{\"enableRetry\":false,\"enableSolutionsButton\":true,\"enableCheckButton\":true,\"showScorePoints\":true},\"correctAnswer\":\"Correct!\",\"incorrectAnswer\":\"Incorrect!\",\"missedAnswer\":\"Answer not found!\",\"displaySolutionDescription\":\"Task is updated to contain the solution.\",\"scoreBarLabel\":\"You got :num out of :total points\",\"a11yFullTextLabel\":\"Full readable text\",\"a11yClickableTextLabel\":\"Full text where words can be marked\",\"a11ySolutionModeHeader\":\"Solution mode\",\"a11yCheckingHeader\":\"Checking mode\",\"a11yCheck\":\"Check the answers. The responses will be marked as correct, incorrect, or unanswered.\",\"a11yShowSolution\":\"Show the solution. The task will be marked with its correct solution.\",\"a11yRetry\":\"Retry the task. Reset all responses and start the task over again.\",\"textField\":\"<p><strong>The *fluffy* pillows covered his bed.<\\\/strong><br>\\n&nbsp;<\\\/p>\\n\",\"taskDescription\":\"<p>-<\\\/p>\\n\",\"media\":{\"disableImageZooming\":false}},\"library\":\"H5P.MarkTheWords 1.11\",\"metadata\":{\"contentType\":\"Mark the Words\",\"license\":\"U\",\"title\":\"Q4 Select the adjective.\"},\"subContentId\":\"6cdd1b14-0b6c-4f6a-973a-eada55f468b1\"},\"useSeparator\":\"disabled\"},{\"content\":{\"params\":{\"text\":\"<p><span style=\\\"font-size:1.25em;\\\"><strong>Q5. Select the adjective.<\\\/strong><\\\/span><\\\/p>\\n\"},\"library\":\"H5P.AdvancedText 1.1\",\"metadata\":{\"contentType\":\"Text\",\"license\":\"U\",\"title\":\"Untitled Text\"},\"subContentId\":\"d7222dc4-16ea-4cbc-bf12-e133eb080330\"},\"useSeparator\":\"enabled\"},{\"content\":{\"params\":{\"contentName\":\"Image\",\"file\":{\"path\":\"images\\\/file-63c7c62c5b31f.png\",\"mime\":\"image\\\/png\",\"copyright\":{\"license\":\"U\"},\"width\":1300,\"height\":250},\"decorative\":false,\"alt\":\"Q5 Image\",\"expandImage\":\"Expand Image\",\"minimizeImage\":\"Minimize Image\"},\"library\":\"H5P.Image 1.1\",\"metadata\":{\"contentType\":\"Image\",\"license\":\"U\",\"title\":\"Untitled Image\"},\"subContentId\":\"33f531c0-7c1c-4f8a-b8b5-605bccbee661\"},\"useSeparator\":\"disabled\"},{\"content\":{\"params\":{\"overallFeedback\":[{\"from\":0,\"to\":50,\"feedback\":\"Sorry, it is incorrect.\"},{\"from\":51,\"to\":100,\"feedback\":\"Awesome ! It is the correct answer.\"}],\"checkAnswerButton\":\"Check\",\"submitAnswerButton\":\"Submit\",\"tryAgainButton\":\"Retry\",\"showSolutionButton\":\"Show solution\",\"behaviour\":{\"enableRetry\":false,\"enableSolutionsButton\":true,\"enableCheckButton\":true,\"showScorePoints\":true},\"correctAnswer\":\"Correct!\",\"incorrectAnswer\":\"Incorrect!\",\"missedAnswer\":\"Answer not found!\",\"displaySolutionDescription\":\"Task is updated to contain the solution.\",\"scoreBarLabel\":\"You got :num out of :total points\",\"a11yFullTextLabel\":\"Full readable text\",\"a11yClickableTextLabel\":\"Full text where words can be marked\",\"a11ySolutionModeHeader\":\"Solution mode\",\"a11yCheckingHeader\":\"Checking mode\",\"a11yCheck\":\"Check the answers. The responses will be marked as correct, incorrect, or unanswered.\",\"a11yShowSolution\":\"Show the solution. The task will be marked with its correct solution.\",\"a11yRetry\":\"Retry the task. Reset all responses and start the task over again.\",\"textField\":\"<p><strong>Teresa tied her *long* hair in a ponytail.<\\\/strong><\\\/p>\\n\",\"taskDescription\":\"<p>-<\\\/p>\\n\",\"media\":{\"disableImageZooming\":false}},\"library\":\"H5P.MarkTheWords 1.11\",\"metadata\":{\"contentType\":\"Mark the Words\",\"license\":\"U\",\"title\":\"Q5 Select the adjective.\"},\"subContentId\":\"d56159ef-e4b5-4bc2-b4f3-85c727e750ed\"},\"useSeparator\":\"disabled\"},{\"content\":{\"params\":{\"text\":\"<p><span style=\\\"font-size:1.25em;\\\"><strong>Q6. Select the adjective.&nbsp;<\\\/strong><\\\/span><\\\/p>\\n\"},\"library\":\"H5P.AdvancedText 1.1\",\"metadata\":{\"contentType\":\"Text\",\"license\":\"U\",\"title\":\"Untitled Text\"},\"subContentId\":\"db89e0a0-2d94-4b22-bccb-5ea133cff9fe\"},\"useSeparator\":\"enabled\"},{\"content\":{\"params\":{\"contentName\":\"Image\",\"file\":{\"path\":\"images\\\/file-63c7c67d85bec.png\",\"mime\":\"image\\\/png\",\"copyright\":{\"license\":\"U\"},\"width\":1300,\"height\":250},\"decorative\":false,\"alt\":\"Q6 Image\",\"expandImage\":\"Expand Image\",\"minimizeImage\":\"Minimize Image\"},\"library\":\"H5P.Image 1.1\",\"metadata\":{\"contentType\":\"Image\",\"license\":\"U\",\"title\":\"Untitled Image\"},\"subContentId\":\"35671f47-751e-4346-8bc9-4672f1f502e9\"},\"useSeparator\":\"disabled\"},{\"content\":{\"params\":{\"overallFeedback\":[{\"from\":0,\"to\":50,\"feedback\":\"Sorry, it is incorrect.\"},{\"from\":51,\"to\":100,\"feedback\":\"Super! It is the correct answer.\"}],\"checkAnswerButton\":\"Check\",\"submitAnswerButton\":\"Submit\",\"tryAgainButton\":\"Retry\",\"showSolutionButton\":\"Show solution\",\"behaviour\":{\"enableRetry\":false,\"enableSolutionsButton\":true,\"enableCheckButton\":true,\"showScorePoints\":true},\"correctAnswer\":\"Correct!\",\"incorrectAnswer\":\"Incorrect!\",\"missedAnswer\":\"Answer not found!\",\"displaySolutionDescription\":\"Task is updated to contain the solution.\",\"scoreBarLabel\":\"You got :num out of :total points\",\"a11yFullTextLabel\":\"Full readable text\",\"a11yClickableTextLabel\":\"Full text where words can be marked\",\"a11ySolutionModeHeader\":\"Solution mode\",\"a11yCheckingHeader\":\"Checking mode\",\"a11yCheck\":\"Check the answers. The responses will be marked as correct, incorrect, or unanswered.\",\"a11yShowSolution\":\"Show the solution. The task will be marked with its correct solution.\",\"a11yRetry\":\"Retry the task. Reset all responses and start the task over again.\",\"textField\":\"<p><strong>The *nervous* cat jumped out of the window.<\\\/strong><\\\/p>\\n\",\"taskDescription\":\"<p>-<\\\/p>\\n\",\"media\":{\"disableImageZooming\":false}},\"library\":\"H5P.MarkTheWords 1.11\",\"metadata\":{\"contentType\":\"Mark the Words\",\"license\":\"U\",\"title\":\"Q6 Select the adjective.\"},\"subContentId\":\"880271ec-6fae-42b9-9f20-00c12b9c6e4d\"},\"useSeparator\":\"disabled\"},{\"content\":{\"params\":{\"text\":\"<p><span style=\\\"font-size:1.25em;\\\"><strong>Q7. Select the adjective.<\\\/strong><\\\/span><\\\/p>\\n\"},\"library\":\"H5P.AdvancedText 1.1\",\"metadata\":{\"contentType\":\"Text\",\"license\":\"U\",\"title\":\"Untitled Text\"},\"subContentId\":\"834b99f0-b190-4825-877e-50989bf61002\"},\"useSeparator\":\"enabled\"},{\"content\":{\"params\":{\"contentName\":\"Image\",\"file\":{\"path\":\"images\\\/file-63c7ca0cd1cb5.png\",\"mime\":\"image\\\/png\",\"copyright\":{\"license\":\"U\"},\"width\":1300,\"height\":250},\"decorative\":false,\"alt\":\"Q7 Image\",\"expandImage\":\"Expand Image\",\"minimizeImage\":\"Minimize Image\"},\"library\":\"H5P.Image 1.1\",\"metadata\":{\"contentType\":\"Image\",\"license\":\"U\",\"title\":\"Untitled Image\"},\"subContentId\":\"bf0dd58f-6be9-4daf-a5e4-4abd6e65ed52\"},\"useSeparator\":\"disabled\"},{\"content\":{\"params\":{\"overallFeedback\":[{\"from\":0,\"to\":50,\"feedback\":\"Sorry, it is incorrect.\"},{\"from\":51,\"to\":100,\"feedback\":\"Fantastic! It is the correct answer.\"}],\"checkAnswerButton\":\"Check\",\"submitAnswerButton\":\"Submit\",\"tryAgainButton\":\"Retry\",\"showSolutionButton\":\"Show solution\",\"behaviour\":{\"enableRetry\":false,\"enableSolutionsButton\":true,\"enableCheckButton\":true,\"showScorePoints\":true},\"correctAnswer\":\"Correct!\",\"incorrectAnswer\":\"Incorrect!\",\"missedAnswer\":\"Answer not found!\",\"displaySolutionDescription\":\"Task is updated to contain the solution.\",\"scoreBarLabel\":\"You got :num out of :total points\",\"a11yFullTextLabel\":\"Full readable text\",\"a11yClickableTextLabel\":\"Full text where words can be marked\",\"a11ySolutionModeHeader\":\"Solution mode\",\"a11yCheckingHeader\":\"Checking mode\",\"a11yCheck\":\"Check the answers. The responses will be marked as correct, incorrect, or unanswered.\",\"a11yShowSolution\":\"Show the solution. The task will be marked with its correct solution.\",\"a11yRetry\":\"Retry the task. Reset all responses and start the task over again.\",\"textField\":\"<p><strong>Mark rode his *black* bicycle to the park.<\\\/strong><\\\/p>\\n\",\"taskDescription\":\"<p>-<\\\/p>\\n\",\"media\":{\"disableImageZooming\":false}},\"library\":\"H5P.MarkTheWords 1.11\",\"metadata\":{\"contentType\":\"Mark the Words\",\"license\":\"U\",\"title\":\"Q7 Select the adjective.\"},\"subContentId\":\"31409252-9551-441f-b2eb-389fa794074e\"},\"useSeparator\":\"disabled\"},{\"content\":{\"params\":{\"text\":\"<p><span style=\\\"font-size:1.25em;\\\"><strong>Q8. Select the adjective.<\\\/strong><\\\/span><\\\/p>\\n\"},\"library\":\"H5P.AdvancedText 1.1\",\"metadata\":{\"contentType\":\"Text\",\"license\":\"U\",\"title\":\"Untitled Text\"},\"subContentId\":\"b5c5ef81-4d08-40b6-b805-4454f52737a3\"},\"useSeparator\":\"enabled\"},{\"content\":{\"params\":{\"contentName\":\"Image\",\"file\":{\"path\":\"images\\\/file-63c7c6a44d251.png\",\"mime\":\"image\\\/png\",\"copyright\":{\"license\":\"U\"},\"width\":1300,\"height\":250},\"decorative\":false,\"alt\":\"Q8 Image\",\"expandImage\":\"Expand Image\",\"minimizeImage\":\"Minimize Image\"},\"library\":\"H5P.Image 1.1\",\"metadata\":{\"contentType\":\"Image\",\"license\":\"U\",\"title\":\"Untitled Image\"},\"subContentId\":\"c83898a8-1732-47ff-b3c6-d9f8af947588\"},\"useSeparator\":\"disabled\"},{\"content\":{\"params\":{\"overallFeedback\":[{\"from\":0,\"to\":50,\"feedback\":\"Sorry, it is incorrect.\"},{\"from\":51,\"to\":100,\"feedback\":\"Impressive ! You got it right.\"}],\"checkAnswerButton\":\"Check\",\"submitAnswerButton\":\"Submit\",\"tryAgainButton\":\"Retry\",\"showSolutionButton\":\"Show solution\",\"behaviour\":{\"enableRetry\":false,\"enableSolutionsButton\":true,\"enableCheckButton\":true,\"showScorePoints\":true},\"correctAnswer\":\"Correct!\",\"incorrectAnswer\":\"Incorrect!\",\"missedAnswer\":\"Answer not found!\",\"displaySolutionDescription\":\"Task is updated to contain the solution.\",\"scoreBarLabel\":\"You got :num out of :total points\",\"a11yFullTextLabel\":\"Full readable text\",\"a11yClickableTextLabel\":\"Full text where words can be marked\",\"a11ySolutionModeHeader\":\"Solution mode\",\"a11yCheckingHeader\":\"Checking mode\",\"a11yCheck\":\"Check the answers. The responses will be marked as correct, incorrect, or unanswered.\",\"a11yShowSolution\":\"Show the solution. The task will be marked with its correct solution.\",\"a11yRetry\":\"Retry the task. Reset all responses and start the task over again.\",\"textField\":\"<p><strong>The children danced to the *groovy* music.<\\\/strong><br>\\n&nbsp;<\\\/p>\\n\",\"taskDescription\":\"<p>-<\\\/p>\\n\",\"media\":{\"disableImageZooming\":false}},\"library\":\"H5P.MarkTheWords 1.11\",\"metadata\":{\"contentType\":\"Mark the Words\",\"license\":\"U\",\"title\":\"Q8 Select the adjective.\"},\"subContentId\":\"4b6b81cc-2347-4d56-baf1-6e30904df36c\"},\"useSeparator\":\"disabled\"},{\"content\":{\"params\":{\"text\":\"<p><span style=\\\"font-size:1.25em;\\\"><strong>Q9. Select the adjective.<\\\/strong><\\\/span><\\\/p>\\n\"},\"library\":\"H5P.AdvancedText 1.1\",\"metadata\":{\"contentType\":\"Text\",\"license\":\"U\",\"title\":\"Untitled Text\"},\"subContentId\":\"d3b47914-d55e-417a-9e21-dd074a369e89\"},\"useSeparator\":\"enabled\"},{\"content\":{\"params\":{\"contentName\":\"Image\",\"file\":{\"path\":\"images\\\/file-63c7c6becead0.png\",\"mime\":\"image\\\/png\",\"copyright\":{\"license\":\"U\"},\"width\":1300,\"height\":250},\"decorative\":false,\"alt\":\"Q9 Image\",\"expandImage\":\"Expand Image\",\"minimizeImage\":\"Minimize Image\"},\"library\":\"H5P.Image 1.1\",\"metadata\":{\"contentType\":\"Image\",\"license\":\"U\",\"title\":\"Untitled Image\"},\"subContentId\":\"94d6979c-857b-46d2-a2bc-2b888f462088\"},\"useSeparator\":\"disabled\"},{\"content\":{\"params\":{\"overallFeedback\":[{\"from\":0,\"to\":50,\"feedback\":\"Sorry, it is incorrect.\"},{\"from\":51,\"to\":100,\"feedback\":\"Brilliant ! It is the correct answer.\"}],\"checkAnswerButton\":\"Check\",\"submitAnswerButton\":\"Submit\",\"tryAgainButton\":\"Retry\",\"showSolutionButton\":\"Show solution\",\"behaviour\":{\"enableRetry\":false,\"enableSolutionsButton\":true,\"enableCheckButton\":true,\"showScorePoints\":true},\"correctAnswer\":\"Correct!\",\"incorrectAnswer\":\"Incorrect!\",\"missedAnswer\":\"Answer not found!\",\"displaySolutionDescription\":\"Task is updated to contain the solution.\",\"scoreBarLabel\":\"You got :num out of :total points\",\"a11yFullTextLabel\":\"Full readable text\",\"a11yClickableTextLabel\":\"Full text where words can be marked\",\"a11ySolutionModeHeader\":\"Solution mode\",\"a11yCheckingHeader\":\"Checking mode\",\"a11yCheck\":\"Check the answers. The responses will be marked as correct, incorrect, or unanswered.\",\"a11yShowSolution\":\"Show the solution. The task will be marked with its correct solution.\",\"a11yRetry\":\"Retry the task. Reset all responses and start the task over again.\",\"textField\":\"<p><strong>Luke organized his *numerous* toys on the shelf.<\\\/strong><br>\\n&nbsp;<\\\/p>\\n\",\"taskDescription\":\"<p>-<\\\/p>\\n\",\"media\":{\"disableImageZooming\":false}},\"library\":\"H5P.MarkTheWords 1.11\",\"metadata\":{\"contentType\":\"Mark the Words\",\"license\":\"U\",\"title\":\"Q9 Select the adjective.\"},\"subContentId\":\"df2ba900-6273-4880-b276-576589610505\"},\"useSeparator\":\"disabled\"},{\"content\":{\"params\":{\"text\":\"<p><span style=\\\"font-size:1.25em;\\\"><strong>Q10. Select the adjective.<\\\/strong><\\\/span><\\\/p>\\n\"},\"library\":\"H5P.AdvancedText 1.1\",\"metadata\":{\"contentType\":\"Text\",\"license\":\"U\",\"title\":\"Untitled Text\"},\"subContentId\":\"31f220b0-2c59-4ce8-bbf3-9753cdb393b5\"},\"useSeparator\":\"enabled\"},{\"content\":{\"params\":{\"contentName\":\"Image\",\"file\":{\"path\":\"images\\\/file-63c7c6e99feaf.png\",\"mime\":\"image\\\/png\",\"copyright\":{\"license\":\"U\"},\"width\":1300,\"height\":250},\"decorative\":false,\"alt\":\"Q10 Image\",\"expandImage\":\"Expand Image\",\"minimizeImage\":\"Minimize Image\"},\"library\":\"H5P.Image 1.1\",\"metadata\":{\"contentType\":\"Image\",\"license\":\"U\",\"title\":\"Untitled Image\"},\"subContentId\":\"75d6973a-2587-468a-9426-df62f1e43ac3\"},\"useSeparator\":\"disabled\"},{\"content\":{\"params\":{\"overallFeedback\":[{\"from\":0,\"to\":50,\"feedback\":\"Sorry, it is incorrect.\"},{\"from\":51,\"to\":100,\"feedback\":\"Excellent ! Keep up the good performance.\"}],\"checkAnswerButton\":\"Check\",\"submitAnswerButton\":\"Submit\",\"tryAgainButton\":\"Retry\",\"showSolutionButton\":\"Show solution\",\"behaviour\":{\"enableRetry\":false,\"enableSolutionsButton\":true,\"enableCheckButton\":true,\"showScorePoints\":true},\"correctAnswer\":\"Correct!\",\"incorrectAnswer\":\"Incorrect!\",\"missedAnswer\":\"Answer not found!\",\"displaySolutionDescription\":\"Task is updated to contain the solution.\",\"scoreBarLabel\":\"You got :num out of :total points\",\"a11yFullTextLabel\":\"Full readable text\",\"a11yClickableTextLabel\":\"Full text where words can be marked\",\"a11ySolutionModeHeader\":\"Solution mode\",\"a11yCheckingHeader\":\"Checking mode\",\"a11yCheck\":\"Check the answers. The responses will be marked as correct, incorrect, or unanswered.\",\"a11yShowSolution\":\"Show the solution. The task will be marked with its correct solution.\",\"a11yRetry\":\"Retry the task. Reset all responses and start the task over again.\",\"textField\":\"<p><strong>The *ambitious* boy chased the butterfly.<\\\/strong><br>\\n&nbsp;<\\\/p>\\n\",\"taskDescription\":\"<p>-<\\\/p>\\n\",\"media\":{\"disableImageZooming\":false}},\"library\":\"H5P.MarkTheWords 1.11\",\"metadata\":{\"contentType\":\"Mark the Words\",\"license\":\"U\",\"title\":\"Q10 Select the adjective.\"},\"subContentId\":\"210eb005-eea7-4733-b1a0-402b905c71a2\"},\"useSeparator\":\"disabled\"}]}"}}});