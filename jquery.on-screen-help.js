/*!
 * jQuery on-screen-help plugin
 * https://github.com/Epstone/on-screen-help
 *
 * Copyright 2012, Patrick Epstein
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.opensource.org/licenses/GPL-2.0
 */
;
(function ($, window, undefined) {
	"use strict";
	
	var _cs_arr_box = "osh_arrow_box",
	_cs_arr_box_out = "osh_arrow_box_outer",
	_cs_osh_block = "osh_block",
	_cs_toolbar = "osh_toolbar",
	_cs_marked_zone = "osh_marked_zone",
	_cs_toolbar_bg = "osh_toolbar_background",
	_cs_close = "osh_close";
	
	function _paddingHelper($elem, position) {
		return parseInt($elem.css("padding-" + position), 10);
	}
	
	function _capitaliseFirstLetter(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}
	
	function _getJDiv(className) {
		return $("<div class='" + className + "' />");
	}
	
	/* removes all ui elements created by this higlighter
	 * @ classes [string array] classNames without a dot
	 */
	function _removeByClasses(classes) {
		
		$.each(classes, function (index, className) {
			$("." + className).remove();
		});
	}
	
	/* A step is an internally used tutorial step
	/* selector [string] - jQuery selector for tutorial step
	 */
	var Step = function (selector) {
		var self = this;
		
		// [string]
		// element selector to be highlighted
		self.selector = selector;
		
		// [number] NOT IMPLEMENTED YET
		// extra space around element
		// self.margin;
		
		// [string] (optional)
		// padding to be respected. Either a combination of top right left bottom, or none, or all
		self.padding = "none";
		
		// [string] (optional)
		// caption for the bottom navigation button
		// self.navCaption;
		
		// [string] (optional)
		// caption for clickable zone and navigation button
		//self.caption = "";
		
		// jq elem selected by selector
		self.$elem = $(selector);
		
		// highlighted zone
		//self.$zone;
		
		// internally detected parent tutorial step
		// self.parent;
		
		// [string] (optional)
		// position for the description box
		self.position = "bottom";
		
		// [callback function] (optional)
		// this method runs before a step gets activated
		// self.runBefore;
		
		// [callback function] (optional)
		// this method runs when a step gets deactivated
		// self.runAfter;
		
		// [boolean] (optional)
		// set to true to always scroll to this step or false if not, or let the global setting handle it
		self.scrollTo = undefined;
		
		/* calculates the offset from the top respecting the padding setting */
		self.offsetTop = function () {
			return self.$elem.offset().top + addPadding("top");
		};
		
		/* calculates the offset to the bottom of the $elem respecting the padding setting */
		self.offsetBottom = function () {
			return self.$elem.offset().top + paddingHelper("top") + self.$elem.height() + notPadding("bottom");
		};
		
		/* calculates the offset to the left respecting the padding setting */
		self.offsetLeft = function () {
			return self.$elem.offset().left + addPadding("left");
		};
		
		/* calculates the offset to the right respecting the padding setting */
		self.offsetRight = function () {
			return self.$elem.offset().left + paddingHelper("left") + self.$elem.width() + notPadding("right");
		};
		
		// /* returns the padding css setting for the $elem as [number]
		// * @ position [string] top, left, right, none or all
		// */
		// function padding(position) {
		// var excludePos = excludeAll() || exclude(position) && !includeAll();
		// return excludePos ? parseInt(self.$elem.css("padding-" + position), 10) : 0;
		// }
		
		/* Add padding if mentioned in padding string */
		function addPadding(position) {
			var includePos = includeAll() || include(position);
			return includePos ? paddingHelper(position) : 0;
		}
		
		/* Do not add padding if mentioned in padding string */
		function notPadding(position) {
			var includePos = !includeAll() && !include(position);
			return includePos ? paddingHelper(position) : 0;
		}
		
		function paddingHelper(position) {
			return parseInt(self.$elem.css("padding-" + position), 10);
		}
		
		/* returns true if all paddings should be exlcluded */
		function excludeAll() {
			return self.padding.indexOf("none") !== -1;
		}
		
		function includeAll() {
			return self.padding.indexOf("all") !== -1;
		}
		
		/* returns true if the padding should be exluded
		 * @ paddingPos [string] top, left, right, none or all
		 */
		function include(paddingPos) {
			return self.padding.indexOf(paddingPos) !== -1;
		}
		
		/* Returns the full height, respecting the padding settings */
		self.absHeight = function () {
			
			return self.$elem.height() + notPadding("top") + notPadding("bottom");
			
		};
		
		/* Returns the full width, respecting the padding settings */
		self.absWidth = function () {
			
			return self.$elem.width() + notPadding("left") + notPadding("right");
			
		};
	};
	
	/* SizeInfo object for easier size and position user interface updates
	 * x [number] left offset
	 * y [number] top offset
	 * width [string or number] css property for the width
	 * height [string or number] css property for the height
	 */
	var SizeInfo = function (x, y, width, height) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	};
	
	/* Calculates the sizes and position for the UI elements */
	var Calculator = function () {
		var self = this;
		
		/** Initializes the calculator and sets the sizeInfo results for the 4 fading blocks
		 * @param {Step} step The step for which the fading blocks should be calculated.
		 */
		self.fadingBlocks = function (step) {
			
			var docWidth = $(document).width();
			var docHeight = $(document).height();
			
			// calc coords 1
			var x1 = step.offsetLeft();
			var y1 = step.offsetTop();
			var x2 = step.offsetRight() + 4; // + 2 because of border
			var y2 = step.offsetBottom();
			
			var height = step.$elem.height();
			
			// return the calc size info objects
			var result = {
				b1 : new SizeInfo(0, 0, docWidth, y1),
				b2 : new SizeInfo(x2, y1, docWidth - x2, step.absHeight()),
				b3 : new SizeInfo(0, y2, docWidth, docHeight - y2),
				b4 : new SizeInfo(0, y1, x1, step.absHeight())
			};
			
			return result;
		};
		
		/* Calculates the position info for the description speech bubble bottom side */
		self.descriptionBottom = function (step, $descriptionOuter) {
			
			var descrWidthAdd = $descriptionOuter.width() / 2;
			
			return {
				x : step.offsetLeft() + (step.absWidth() / 2) - descrWidthAdd,
				y : step.offsetBottom()
			};
		};
		
		/* Calculates the position info for the description speech bubble left side */
		self.descriptionLeft = function (step, $descriptionOuter) {
			
			var descrHeightHalf = $descriptionOuter.height() / 2;
			
			return {
				x : step.offsetLeft() - $descriptionOuter.width(),
				y : step.offsetTop() + (step.absHeight() / 2) - descrHeightHalf
			};
		};
		
		/* Calculates the position info for the description speech bubble top side */
		self.descriptionTop = function (step, $descriptionOuter) {
			
			var descrWidthHalf = $descriptionOuter.width() / 2;
			
			return {
				x : step.offsetLeft() + (step.absWidth() / 2) - descrWidthHalf,
				y : step.offsetTop() - $descriptionOuter.height()
			};
		};
		
		/* Calculates the position info for the description speech bubble left side */
		self.descriptionRight = function (step, $descriptionOuter) {
			
			var descrHeightHalf = $descriptionOuter.height() / 2;
			
			return {
				x : step.offsetRight(),
				y : step.offsetTop() + (step.absHeight() / 2) - descrHeightHalf
			};
		};
		
	};
	
	/* The Higlighter instance controls the 4 fading divs and changes their position and size */
	var Highlighter = function () {
		var self = this;
		
		// keep a reference to all the fading blocks
		self.$b1 = new Block();
		self.$b2 = new Block();
		self.$b3 = new Block();
		self.$b4 = new Block();
		
		//jq elem for description box container
		self.$descriptionOuter = undefined;
		
		// actual speech bubble div
		self.$descriptionBubble = undefined;
		
		/* Builds 4 div fading blocks around the selected DOM element.
		 * @ sel [string] jQuery selector
		 * @ addPadding [bool] respect padding of element
		 * @ margin [number] space around the element to highlight
		 */
		self.highlight = function (step) {
			
			//check that element is existing
			var $target = step.$elem;
			
			// calculate block size and positions
			var result = new Calculator().fadingBlocks(step);
			
			// update all block sizes and positions
			self.$b1.update(result.b1);
			self.$b2.update(result.b2);
			self.$b3.update(result.b3);
			self.$b4.update(result.b4);
			
		};
		
		/* Creates or updates the jQuery element for the description box */
		function _initDescriptionBox(position) {
			if (!self.$descriptionOuter) {
				//create description speech bubble if not yet existing
				self.$descriptionBubble = _getJDiv(_cs_arr_box);
				self.$descriptionOuter = _getJDiv(_cs_arr_box_out).append(self.$descriptionBubble);
				
				$("body").append(self.$descriptionOuter);
			}
			
			if (!position) {
				position = "bottom";
			}
			// remove old position class and add new
			self.$descriptionBubble.removeClass("top bottom left right");
			self.$descriptionBubble.addClass(position);
			
		}
		
		/* Shows a arrowed description bubble box */
		self.showDescription = function (step) {
			
			// create the description box or update it's arrow position
			_initDescriptionBox(step.position);
			
			// change text
			if (step.html) {
				self.$descriptionBubble.html(step.html);
			} else {
				self.$descriptionBubble.text(step.description);
			}
			
			// calculate the position for the description box
			var position = "description" + _capitaliseFirstLetter(step.position);
			var result = new Calculator()[position](step, self.$descriptionOuter);
			
			self.$descriptionOuter.css({
				"top" : result.y,
				"left" : result.x
			});
			
		};
		
		/* Repositions the clickable zones when user resizes the browser window */
		self.reposClickableZones = function (steps) {
			
			$.each(steps, function (index, step) {
				_positionClickableZone(step.$zone, step);
			});
		};
		
		self.destroy = function () {
			var classes = [_cs_arr_box_out, _cs_osh_block, _cs_marked_zone]
			_removeByClasses(classes);
		}
		
		/* Calculates the position and sets its css properties for a clickable zone*/
		function _positionClickableZone($zone, step) {
			
			var $elem = step.$elem;
			var offset = $elem.offset();
			$zone.css({
				"top" : step.offsetTop(),
				"left" : step.offsetLeft(),
				"width" : step.absWidth(),
				"height" : step.absHeight()
			});
			
			// add child class if this step has a parent step
			if (step.parent) {
				if (!$zone.hasClass("osh_is_child")) {
					$zone.addClass("osh_is_child");
				}
				$zone.css({
					"left" : $zone.offset().left
				});
				$zone.width($zone.width());
			}
			
		}
		
		/* Creates clickable buttons over the targeted step elements */
		self.buildClickableZones = function (steps, stepActivationCallback) {
			
			$.each(steps, function (index, step) {
				
				//create zone and position it
				var $zone = _getJDiv(_cs_marked_zone).appendTo("body");
				_positionClickableZone($zone, step);
				
				$("<div/>").append($("<p />").text(step.caption)).appendTo($zone);
				
				//store a reference in the step for the zone
				step.$zone = $zone;
				
				//bind step activation callback to $zone click event
				step.$zone.click(function (e) {
					stepActivationCallback.call(self, step);
				});
				
			});
			
		};
		
	};
	
	/* A block object is one of the 4 black/gray DIV overlay elements */
	var Block = function () {
		var self = this;
		
		// create jquery element and add it to DOM
		var $elem = $("<div class='osh_block'/>");
		$("body").append($elem);
		
		// object properties
		self.sizeInfo = undefined;
		
		/* update the blocks position and size */
		self.update = function (sizeInfo) {
			
			$elem.css({
				"left" : sizeInfo.x,
				"top" : sizeInfo.y,
				"width" : sizeInfo.width,
				"height" : sizeInfo.height
			});
			
			// keep track of current position and size
			self.sizeInfo = sizeInfo;
		};
	};
	
	/* Builds the toolbar for navigating between the different tutorial steps */
	var ToolbarCreator = function () {
		var self = this;
		
		//store a reference to the tutorial step buttons
		self.$buttons = undefined;
		
		/* Destroys all UI elements created by the toolbar creator */
		self.destroy = function () {
			_removeByClasses([_cs_toolbar, _cs_toolbar_bg, _cs_close]);
		}
		
		/* Creates the toolbar including the left and right navigation buttons */
		self.createToolbarBasic = function (prevNextStepCallback, destroyCallback) {
			
			//creates the toolbar, its background and the left and right buttons
			_getJDiv(_cs_toolbar_bg).appendTo("body"); // toolbar background
			self.$buttons = $("<ul class='osh_button_list' />");
			var $btnLeft = $("<a class='left osh_button' href='#'>&lt;</a>");
			var $btnRight = $("<a href='#' class='right osh_button' >&gt;</a>");
			
			var $toolbar = _getJDiv(_cs_toolbar).append($btnLeft).append($btnRight).append(self.$buttons); // can't use array atm because of a bug in jqTemplates, sry
			
			// bind step changer function to the left and right button
			$btnLeft.click(function (e) {
				prevNextStepCallback.call(self, -1);
				return false;
			});
			$btnRight.click(function (e) {
				prevNextStepCallback.call(self, 1);
				return false;
			});
			
			//create the close button
			var $btnClose = $("<a href='#' class='" + _cs_close + "'>X</a>");
			
			//bind destroy callback
			$btnClose.click(function () {
				destroyCallback.call(self);
				return false;
			});
			
			$("body").append($btnClose);
			
			$("body").append($toolbar);
		};
		
		/* Creates the toolbar buttons for jumping directly to a tutorial step */
		self.createToolbarButtons = function (steps, stepActivationCallback) {
			
			// create a button for each step
			$.each(steps, function (index, step) {
				
				//create link element and store it to the step
				var $link = $("<a href='#' class='osh_nav_link' />").text(step.navCaption || step.caption);
				var $li = $("<li />").append($link);
				step.$link = $link;
				
				//switch to the wanted step when user clicks a navigation button
				$link.click(function (e) {
					// activates the clicked link and the tutorial step
					stepActivationCallback.call(self, step);
					return false;
				});
				
				// append tutorial navigation buttons to toolbar
				self.$buttons.append($li);
			});
			
		};
	};
	
	/* Handles the tutorial steps and reacts on user events */
	var TutorialController = function (scrollAlways) {
		var self = this;
		
		// currently active tutorial step
		var _currStep;
		
		// all tutorial steps as indexed array
		var _stepsIndexed = [];
		
		//default step to start with, user defined
		var _startWithStep;
		
		// always scroll to show the next highlighted zone
		var _scrollAlways = scrollAlways;
		
		/* Searches up the DOM for a tutorial step which would be a parent to the
		 *  given jQuery element and returns the step
		 */
		function tryGetParent(steps, $elem) {
			
			var resultStep;
			$.each(steps, function (j, parStep) {
				if ($elem.parents(parStep.selector).length > 0) {
					resultStep = parStep;
				}
			});
			
			return resultStep;
		}
		
		// UI manipulation instance
		self.highlighter = undefined;
		
		/* Scrolls the view port to the defined tutorial step */
		function _scrollToStep(step) {
			
			var yScroll;
			if (!step.position || step.position.toLowerCase() === "top") {
				
				yScroll = step.offsetTop() - 250;
			} else {
				yScroll = (step.offsetTop() - 50);
			}
			
			$('body, html').animate({
				scrollTop : yScroll
			}, 1000);
			
		}
		
		/* Takes all raw tutorial steps and initializes the indexed array */
		self.initialize = function (rawSteps) {
			
			var i = 0;
			$.each(rawSteps, function (index, step) {
				
				// create a new step object
				var iStep = new Step(step.selector);
				
				//store the index as reference in the tutorial step
				iStep.index = i;
				i++;
				
				//set the index as the steps navCaption if not defined
				iStep.navCaption = step.navCaption || i.toString();
				
				//check if this should be the first step to be activated
				if (step.startWith) {
					_startWithStep = iStep;
				}
				
				// extend iStep with user defined step
				$.extend(iStep, step);
				
				// add to indexed array
				_stepsIndexed.push(iStep);
				
			});
			
			$.each(_stepsIndexed, function (index, step) {
				
				//check if the element is contained in a parent step's element
				step.parent = tryGetParent(_stepsIndexed, step.$elem);
				
			});
			
			return self.getSteps();
		};
		
		/* Returns the indexed tutorial steps array */
		self.getSteps = function () {
			return _stepsIndexed;
		};
		
		/* Activates the wanted step and the link which belongs to it */
		self.activateStep = function (newStep) {
			
			//do nothing if setp equals the previous one
			if (newStep === _currStep) {
				return;
			}
			
			//execute runAfter callback
			if (_currStep && _currStep.runAfter && $.isFunction(_currStep.runAfter)) {
				_currStep.runAfter.apply();
			}
			
			//execute runBefore callback
			if (newStep.runBefore && $.isFunction(newStep.runBefore)) {
				newStep.runBefore.apply();
			}
			
			// highlight and scroll there
			self.highlighter.highlight(newStep);
			self.highlighter.showDescription(newStep);
			
			//remove the active css class from the previous link
			if (_currStep) {
				_currStep.$link.removeClass("active");
				_currStep.$zone.show();
				
				if (_currStep.parent) {
					_currStep.parent.$zone.show();
				}
			}
			
			if (newStep.parent) {
				newStep.parent.$zone.hide();
			}
			
			//add active css class to new $link
			newStep.$zone.hide();
			newStep.$link.addClass("active");
			_currStep = newStep;
			
			// scroll to steps target
			if ((typeof newStep.scrollTo === "undefined" && _scrollAlways) || newStep.scrollTo) {
				_scrollToStep(newStep);
			}
			
		};
		
		/* Shows the next or previous tutorial step
		 *  @ nextOrPrev [number] 1 for next, -1 for prev step
		 */
		self.nextPrevStep = function (nextOrPrev) {
			
			//no step active yet so show the first one
			if (!_currStep) {
				self.activateStep(_stepsIndexed[0]);
			} else {
				
				var nextIndex = _currStep.index + nextOrPrev;
				
				//check upper array bound
				if (nextIndex >= _stepsIndexed.length) {
					nextIndex = 0;
				}
				//check lower array bound
				else if (nextIndex < 0) {
					nextIndex = _stepsIndexed.length - 1;
				}
				
				// activate step
				self.activateStep(_stepsIndexed[nextIndex]);
			}
		};
		
		/* Show the first step if user has defined one */
		self.showFirstStep = function () {
			
			if (_startWithStep) {
				self.activateStep(_startWithStep);
			}
		}
		
		/* Reacts on browser resize and updates the UI elements */
		self.browserResize = function () {
			
			if (_currStep) {
				self.highlighter.highlight(_currStep);
				self.highlighter.showDescription(_currStep);
			}
		};
	};
	
	/* --------------- jQuery Plugin Code --------------- */
	// Create the defaults once
	var onScreenHelp = 'onScreenHelp',
	document = window.document,
	defaults = {
		hideKeyCode : 27,
		allowEventPropagation : true, // esc, left, right arrow key presses will bubble up if true,
		scrollAlways : false
	};
	
	// The actual plugin constructor
	function Plugin(element, steps, options) {
		
		this.element = element;
		
		this.options = $.extend({}, defaults, options);
		
		this.defaults = defaults;
		this.name = onScreenHelp;
		this.steps = steps;
		
		this.init();
		
	}
	
	Plugin.prototype.init = function () {
		// Place initialization logic here
		// You already have access to the DOM element and the options via the instance,
		// e.g., this.element and this.options
		
		var self = this;
		
		// The highlighter object instance
		self.highlighter = new Highlighter();
		
		//the tutorial controller -> init callbacks for UI manipulation
		var tutorialController = new TutorialController(this.options.scrollAlways);
		
		var indexedSteps = tutorialController.initialize(this.steps);
		tutorialController.highlighter = this.highlighter;
		
		//create the marked clickable zones over the black fading boxes
		this.highlighter.buildClickableZones(indexedSteps, tutorialController.activateStep);
		
		// The Toolbar creator -> build it
		this.toolbarCreator = new ToolbarCreator();
		this.toolbarCreator.createToolbarBasic(tutorialController.nextPrevStep, function () {
			self.destroy();
		});
		this.toolbarCreator.createToolbarButtons(indexedSteps, tutorialController.activateStep);
		
		// react on window resize event
		$(window).on("resize.osh", function () {
			tutorialController.browserResize();
			self.highlighter.reposClickableZones(indexedSteps);
		});
		
		// register key binding functions
		$(document).on("keyup.osh", function (e) {
			
			// destroy plugin key binding
			if (e.keyCode === self.options.hideKeyCode) {
				self.destroy();
			}
			
			if (e.keyCode === 37) { //arrow left -> show previous step
				tutorialController.nextPrevStep(-1);
			}
			
			if (e.keyCode === 39) { // arrow right -> show next step
				tutorialController.nextPrevStep(1);
			}
			
			// check if event bubbling should be allowed
			if (!self.options.allowEventPropagation) {
				e.stopPropagation();
			}
		});
		
		// yeah, this does nothing if no starting step is defined, see Step options
		tutorialController.showFirstStep();
		
	};
	
	/* Closes the plugin and removes all ui and eventhandlers */
	Plugin.prototype.destroy = function () {
		
		this.highlighter.destroy();
		this.toolbarCreator.destroy();
		
		$(this.element).removeData('plugin_' + this.name);
		
		// remove event handlers
		$(document).off(".osh");
	}
	
	/* expose classes for testing */
	window.osh_testing = {
		Step : Step
	};
	
	// A really lightweight plugin wrapper around the constructor,
	// preventing against multiple instantiations
	$.fn[onScreenHelp] = function (steps, options) {
		return this.each(function () {
			if (!$.data(this, 'plugin_' + onScreenHelp)) {
				$.data(this, 'plugin_' + onScreenHelp, new Plugin(this, steps, options));
			}
		});
	};
	
}
	(jQuery, window));
