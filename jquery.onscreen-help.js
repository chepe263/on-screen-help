;
(function ($, window, undefined) {
	"use strict";
	
	/* utility functions */
	function paddingLeft($elem) {
		return parseInt($elem.css("padding-left"), 10);
	}
	
	function paddingTop($elem) {
		return parseInt($elem.css("padding-top"), 10);
	}
	
	function capitaliseFirstLetter(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}
	
	/* A step is an internally used tutorial step */
	var Step = function () {
		
		// selector: Element to highlight
		// margin:   Space around element
		// addPadding: true or false
		// title: the objects name
		// $zone -> clickable zone
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
		
		/* Initializes the calculator and sets the sizeInfo results for the 4 fading blocks */
		self.fadingBlocks = function ($target, addPadding) {
			
			var offset = $target.offset();
			var width = $target.width();
			var height = $target.height();
			var docWidth = $(document).width();
			var docHeight = $(document).height();
			
			// calc coords 1
			var y1 = offset.top;
			var x1 = offset.left;
			
			//add padding if necessary
			if (addPadding) {
				y1 += paddingTop($target);
				x1 += paddingLeft($target);
			}
			
			//calc coords 2
			var x2 = x1 + width + 4; // + 2 because of border
			var y2 = y1 + height;
			
			// return the calc size info objects
			return {
				b1 : new SizeInfo(0, 0, "100%", y1),
				b2 : new SizeInfo(x2, y1, docWidth - x2, height),
				b3 : new SizeInfo(0, y1 + height, "100%", docHeight - y2),
				b4 : new SizeInfo(0, y1, x1, height)
			};
		};
		
		/* Calculates the position info for the description speech bubble bottom side */
		self.descriptionBottom = function ($target, $descriptionOuter) {
			
			var descrWidthAdd = $descriptionOuter.width() / 2;
			var offset = $target.offset();
			return {
				x : offset.left + ($target.width() / 2) - descrWidthAdd + paddingLeft($target),
				y : offset.top + $target.height() + paddingTop($target)
			};
		};
		
		/* Calculates the position info for the description speech bubble left side */
		self.descriptionLeft = function ($target, $descriptionOuter) {
			
			var descrHeightHalf = $descriptionOuter.height() / 2;
			var offset = $target.offset();
			return {
				x : (offset.left + paddingLeft($target)) - $descriptionOuter.width(),
				y : (offset.top + paddingTop($target)) + ($target.height() / 2) - descrHeightHalf
			};
		};
		
		/* Calculates the position info for the description speech bubble top side */
		self.descriptionTop = function ($target, $descriptionOuter) {
			
			var descrWidthHalf = $descriptionOuter.width() / 2;
			var offset = $target.offset();
			return {
				x : (offset.left + paddingLeft($target)) + ($target.width() / 2) - descrWidthHalf,
				y : offset.top + paddingTop($target) - $descriptionOuter.height()
			};
		};
		
		/* Calculates the position info for the description speech bubble left side */
		self.descriptionRight = function ($target, $descriptionOuter) {
			
			var descrHeightHalf = $descriptionOuter.height() / 2;
			var offset = $target.offset();
			return {
				x : (offset.left + paddingLeft($target)) + $target.width(),
				y : (offset.top + paddingTop($target)) + ($target.height() / 2) - descrHeightHalf
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
		self.highlight = function (sel, addPadding, margin) {
			
			//check that element is existing
			var $target = $(sel);
			if ($target.length === 0) {
				throw "selector " + sel + " is not existing.";
			}
			
			// calculate block size and positions
			var result = new Calculator().fadingBlocks($target, addPadding);
			
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
				self.$descriptionBubble = $("<div class='osh_arrow_box' />");
				self.$descriptionOuter = $("<div class='osh_arrow_box_outer'></div>").append(self.$descriptionBubble);
				
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
			self.$descriptionBubble.text(step.description);
			
			// calculate the position for the description box
			var position = "description" + capitaliseFirstLetter(step.position);
			var result = new Calculator()[position](step.$elem, self.$descriptionOuter);
			
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
		
		/* Calculates the position and sets its css properties for a clickable zone*/
		function _positionClickableZone($zone, step) {
			
			var $elem = step.$elem;
			var offset = $elem.offset();
			$zone.css({
				"top" : offset.top + paddingTop($elem),
				"left" : offset.left + paddingLeft($elem),
				"width" : $elem.width(),
				"height" : $elem.height()
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
				var $zone = $("<div class='osh_marked_zone' />").appendTo("body");
				_positionClickableZone($zone, step);
				
				$("<div/>").append($("<p />").text(step.title)).appendTo($zone);
				
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
		
		/* Creates the toolbar including the left and right navigation buttons */
		self.createToolbarBasic = function (prevNextStepCallback) {
			
			//creates the toolbar, its background and the left and right buttons
			$("<div class='osh_toolbar_background' />").appendTo("body"); // toolbar background
			self.$buttons = $("<ul class='osh_button_list' />");
			var $btnLeft = $("<a class='left osh_button' href='#'>&lt;</a>");
			var $btnRight = $("<a href='#' class='right osh_button' >&gt;</a>");
			var $toolbar = $("<div class='osh_toolbar'></div>").append([$btnLeft, $btnRight, self.$buttons]);
			
			// bind step changer function to the left and right button
			$btnLeft.click(function (e) {
				e.preventDefault();
				prevNextStepCallback.call(self, -1);
			});
			$btnRight.click(function (e) {
				e.preventDefault();
				prevNextStepCallback.call(self, 1);
			});
			
			$("body").append($toolbar);
		};
		
		/* Creates the toolbar buttons for jumping directly to a tutorial step */
		self.createToolbarButtons = function (steps, stepActivationCallback) {
			
			// create a button for each step
			$.each(steps, function (index, step) {
				
				//create link element and store it to the step
				var $link = $("<a href='#' class='osh_nav_link' />").text(step.title);
				var $li = $("<li />").append($link);
				step.$link = $link;
				
				//switch to the wanted step when user clicks a navigation button
				$link.click(function (e) {
					e.preventDefault();
					
					// activates the clicked link and the tutorial step
					stepActivationCallback.call(self, step);
				});
				
				// append tutorial navigation buttons to toolbar
				self.$buttons.append($li);
			});
			
		};
	};
	
	/* Handles the tutorial steps and reacts on user events */
	var TutorialController = function () {
		var self = this;
		
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
		
		// currently active tutorial step
		var _currStep;
		
		// all tutorial steps as indexed array
		var _stepsIndexed = [];
		
		// UI manipulation methods
		this.highlightCallback = undefined;
		this.showDescriptionCallback = undefined;
		
		/* Scrolls the view port to the defined tutorial step */
		function _scrollToStep(step){
			var yScroll;
			if(!step.position || step.position.toLowerCase() === "top"){
				yScroll = step.$zone.offset().top;
			}else{
			 yScroll =	(step.$elem.offset().top + paddingTop(step.$elem) - 50);
			}
			
			$('body,html').animate({
				scrollTop : yScroll
			}, 1000);
		
		}
		
		/* Takes all raw tutorial steps and initializes the indexed array */
		self.initialize = function (rawSteps) {
			
			var i = 0;
			$.each(rawSteps, function (index, step) {
				
				// store index as title property
				step.title = index;
				
				//store the index as reference in the tutorial step
				step.index = i;
				step.$elem = $(step.selector);
				i++;
				
				//check if the element is contained in a parent step's element
				step.parent = tryGetParent(rawSteps, step.$elem);
				
				// add to indexed array
				_stepsIndexed.push(step);
				
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
			
			// highlight and scroll there
			self.highlightCallback.call(self, newStep.selector, newStep.addPadding);
			self.showDescriptionCallback.call(self, newStep);
			
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
			_scrollToStep(newStep);
			
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
		
		/* Reacts on browser resize and updates the UI elements */
		self.browserResize = function () {
			
			if (_currStep) {
				self.highlightCallback.call(self, _currStep.selector, _currStep.addPadding);
			}
		};
	};
	
	/* --------------- jQuery Plugin Code --------------- */
	// Create the defaults once
	var onScreenHelp = 'onScreenHelp',
	document = window.document,
	defaults = {
		propertyName : "value"
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
		// jQuery elem toolbar navigation buttons
		this.$buttons = undefined;
		
		// The highlighter object instance
		this.highlighter = new Highlighter();
		
		//the tutorial controller -> init callbacks for UI manipulation
		this.tutorialController = new TutorialController();
		
		var indexedSteps = this.tutorialController.initialize(this.steps);
		this.tutorialController.highlightCallback = this.highlighter.highlight;
		this.tutorialController.showDescriptionCallback = this.highlighter.showDescription;
		
		//create the marked clicable zones over the black fading boxes
		this.highlighter.buildClickableZones(indexedSteps, this.tutorialController.activateStep);
		
		// The Toolbar creator -> build it
		this.toolbarCreator = new ToolbarCreator();
		this.toolbarCreator.createToolbarBasic(this.tutorialController.nextPrevStep);
		this.toolbarCreator.createToolbarButtons(indexedSteps, this.tutorialController.activateStep);
		
		// react on window resize event
		$(window).resize(function () {
			self.tutorialController.browserResize();
			self.highlighter.reposClickableZones(indexedSteps);
		});
		
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
