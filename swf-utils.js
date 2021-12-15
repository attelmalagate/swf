/*
 * Utils, part of the Simple Web Framework
 *
 * version: 1.3
 * license: Apache 2.0
 * author:  François Court
 * date: october 2021
 *
 */
"use strict";
export { importsHTML, triggerClickById, triggerClickBySelector, setWidthByClassName, addEventListenerById, eltBySelAppend, eltBySelText, eltBySelAttr, getCSSVar, setCSSVar, format, version, KEYS, _ui, _nodes, dbg };
function version() {
	return "swf utils v1.3";
}
function dbg() {
	return "dbg01";
}
const svgns = "http://www.w3.org/2000/svg";
const KEYS = {
	ENTER: 13,
	ESC: 27,
	TAB: 9,
	UP: 38,
	DOWN: 40,
	LEFT: 37,
	RIGHT: 39
};
// html imports management
// tokens is a list of token/value to use with a regex before inserting the html value 
function importsHTML(tokens = null) {
	// find the first element with the custom attribute data-imp-html
	const nodes = document.querySelectorAll("[data-imp-html]");
	for (let i = 0; i < nodes.length; i++) {
		const elmnt = nodes[i];
		// the data-imp-html attribute value containes the name of the file to load
		const filename = elmnt.getAttribute("data-imp-html");
		if (filename) {
			// send an HTTP request
			const xhttp = new XMLHttpRequest();
			xhttp.onreadystatechange = function () {
				if (this.readyState == 4) {
					if (this.status == 200) {
						let s = this.responseText;
						// if there are tokens passed to the function, loop through and
						// make the substitution (a token is a pair of identifier "{{ident}}" and text value
						// to replace {{ident}} with
						if (tokens != null) {
							tokens.forEach(function (item) {
								// build the regex on the fly
								const reg = new RegExp(item.token, 'g');
								s = s.replace(reg, item.value);
							});
						}
						// udpate the target element
						elmnt.innerHTML = s;
					}
					if (this.status == 404) {
						elmnt.innerHTML = "Page not found.";
					}
					// remove the attribute to stop the loop but restart the process with an
					// iterative call for the next element with the data-imp-html attribute
					// That allows to serialize the http requests
					elmnt.removeAttribute("data-imp-html");
					importsHTML(tokens);
				}
			};
			xhttp.open("GET", filename, true);
			xhttp.send();
			// exit the loop - the next element with html to import is managed in the callback above
			// with the recursive call to importsHTML
			return;
		}
	}
}
// trigger a click on an element selected by id
function triggerClickById(id) {
	try {
		document.getElementById(id).dispatchEvent(new Event("click"));
	}
	catch (error) {
		console.error("triggerClickById error with id", id);
	}
}
// trigger a click on the first element meeting the filter in parameter
function triggerClickBySelector(selfilter) {
	try {
		document.querySelector(selfilter).dispatchEvent(new Event("click"));
	}
	catch (error) {
		console.error("triggerClickBySelector error with filter", selfilter);
	}
}
// sets the widht of all elements belonging to the class in parameter
function setWidthByClassName(name, w) {
	const elts = document.getElementsByClassName(name);
	Array.prototype.every.call(elts, function (el) {
		el.style.width = w + 'px';
		return true;
	});
}
function addEventListenerById(id, event, listener) {
	const elt = document.getElementById(id);
	if (elt !== null) {
		elt.addEventListener(event, listener);
	}
	else {
		console.log("addEventListenerById - element", id, "does not exist");
	}
}
function eltBySelAppend(selector, toappend) {
	[].forEach.call(document.querySelectorAll(selector), function (elt) {
		elt.innerHTML = toappend;
	});
}
function eltBySelText(selector, text) {
	[].forEach.call(document.querySelectorAll(selector), function (elt) {
		elt.textContent = text;
	});
}
function eltBySelAttr(selector, attr, value) {
	[].forEach.call(document.querySelectorAll(selector), function (elt) {
		elt.setAttribute(attr, value);
	});
}
// get the value of a css var
function getCSSVar(sel, cssvar) {
	return String(getComputedStyle(document.querySelector(sel)).getPropertyValue(cssvar));
}
//set the value of a css var
function setCSSVar(sel, cssvar, value) {
	try {
		document.querySelector(sel).style.setProperty(cssvar, value);
	}
	catch (error) {
		console.error("setCSSVar error with selector", sel, "cssvar", cssvar, "value", value);
	}
}
function resizeWindow() {
	window.dispatchEvent(new Event('resize'));
}
class _nodes {
	constructor(selector, origin = document) {
		this.nodes = origin.querySelectorAll(selector);
	}
	text(value) {
		[].forEach.call(this.nodes, function (elt) {
			elt.textContent = value;
		});
		return this;
	}
	attr(attr, value) {
		[].forEach.call(this.nodes, function (elt) {
			elt.setAttribute(attr, value);
		});
		return this;
	}
	each(f) {
		[].forEach.call(this.nodes, function (elt) {
			f(elt);
		});
	}
}
//-- swf UI management --//
class _ui {
	constructor(poptions = {}) {
		// options management
		this.options = {
			nav: ((poptions.nav === undefined) ? 0 : poptions.nav)
		};
		// shifr key management
		this.shiftPressed = false;
		// width of the navigation panel
		this.navW = parseInt(getCSSVar(':root', '--navw'));
		// mouse position
		this.mouseX = 0;
		this.mouseY = 0;
		this.navelt = document.getElementById("f1ga_nav");
		if (!this.navelt) {
			console.error("_ui.constructor error - no navigation element");
		}
		this.blockelt = document.getElementById("block");
		if (!this.blockelt) {
			console.warn("_ui.constructor error - no blocking element");
		}
		console.log(this);
	}
	// setup generic event handlers
	addEvents() {
		// save the current object to be used later in the event callbacks
		const that = this;
		// debug 
		/*
		document.addEventListener("mousemove", function(e) {
			that.mouseX=e.pageX;
			that.mouseY=e.pageY;
			console.log("mouse at x="+ e.pageX + " y=" +e.pageY);
		});
		*/
		// keyup/keydown events to manage the shiftkey throught the shiftPressed variable and callback, used
		//	by the photo gallery (for the bulk selection of pictures)
		window.addEventListener('keydown', function (e) {
			if (e.shiftKey) {
				that.shiftPressed = true;
			}
		});
		window.addEventListener('keyup', function () {
			that.shiftPressed = false;
		});
		// event for the switchNav function, ie management of the click on the left portion of the header
		[].forEach.call(document.querySelectorAll('.switchnav'), function (elt) {
			elt.addEventListener('click', function () {
				that.switchNav(_ui.opt.RESIZE);
			});
		});
		// manages the tab selection menus
		// there are two menus available to select which tab to display
		// inside the main area:
		// - one menu is located in the navigation panel on the side
		// - the other is floating, accessed from the menu icon located in the right portion of the header
		// the two menus are identical and remain synchronized (ie current selection in bold)
		[].forEach.call(document.querySelectorAll('.tabselect'), function (tabselect) {
			tabselect.addEventListener('click', function () {
				const idtab = tabselect.getAttribute("data-idtab");
				const tab = idtab ? document.getElementById(idtab) : null;
				if (tab) {
					[].forEach.call(document.querySelectorAll('.f1-stacked-panel'), function (elt) {
						elt.style.setProperty("visibility", "hidden");
						elt.style.setProperty("z-index", "-1");
					});
					tab.style.setProperty("visibility", "visible");
					tab.style.setProperty("z-index", "2");
					[].forEach.call(document.querySelectorAll('.tabselect'), function (elt) {
						elt.style.setProperty("font-weight", "normal");
						elt.style.setProperty("cursor", "pointer");
					});
					[].forEach.call(document.querySelectorAll("[data-idtab='" + idtab + "']"), function (elt) {
						elt.style.setProperty("font-weight", "bold");
						elt.style.setProperty("cursor", "default");
					});
					// hide navigation panel if option is validated and if the action is initiated by an element
					// located inside the navigation panel
					if (tabselect.closest("#f1ga_nav") && that.navOptCloseonsel()) {
						that.hideNav(_ui.opt.RESIZE);
					}
				}
				else {
					console.error("_ui.addEvents.tabselect.click error", tabselect);
				}
			});
		});
		[].forEach.call(document.querySelectorAll('.f1-linkmenu'), function (elt) {
			elt.addEventListener('click', function () {
				console.log(elt.getAttribute("data-id"));
			});
		});
		// manages the selection of subtabs and related menu (the in-menu)
		// subtabs are tabs inside the main tabs; they are selected through an in-menu at the top of their
		// parent tab
		[].forEach.call(document.querySelectorAll('.subtabselect'), function (tabselect) {
			tabselect.addEventListener('click', function () {
				// select the siblings of the current menu element with the same class and set their style to 
				// not selected (ie font weight normal and cursor pointer)
				[].forEach.call(tabselect.parentElement.querySelectorAll('.subtabselect'), function (sib) {
					sib.style.setProperty("font-weight", "normal");
					sib.style.setProperty("cursor", "pointer");
				});
				//takes more time than the equivqlent syntax above (5-10% more, on a 100000 loop, 180ms total)
				new _nodes('.subtabselect', tabselect.parentElement).each(function (sib) {
					sib.style.setProperty("font-weight", "normal");
					sib.style.setProperty("cursor", "pointer");
				});
				/**/
				// set the current menu element to selected (fontweight bold and cursor normal)
				tabselect.style.setProperty("font-weight", "bold");
				tabselect.style.setProperty("cursor", "default");
				// select the subtab to show it, and hide its siblings (class f1-inpanel)
				const idsubtab = tabselect.getAttribute("data-idsubtab");
				const subtab = idsubtab ? document.getElementById(idsubtab) : null;
				if (subtab) {
					[].forEach.call(subtab.parentElement.querySelectorAll('.f1-inpanel'), function (sib) {
						sib.style.setProperty("visibility", "hidden");
						sib.style.setProperty("z-index", "-1");
					});
					subtab.style.setProperty("visibility", "visible");
					subtab.style.setProperty("z-index", "1");
				}
				else {
					console.error("_ui.addEvents.subtabselect.click error", tabselect);
				}
				// hide/show other related items on the in-menu bar
				[].forEach.call(tabselect.parentElement.querySelectorAll('div[data-id]'), function (sib) {
					sib.style.setProperty("display", "none");
				});
				[].forEach.call(tabselect.parentElement.querySelectorAll("div[data-id='" + idsubtab + "']"), function (sib) {
					sib.style.setProperty("display", "block");
				});
			});
		});
		// modal dialog management
		[].forEach.call(document.querySelectorAll('.f1-menu-show'), function (elt) {
			elt.addEventListener('click', function () {
				that.openModalMenu(elt.getAttribute("data-idmenu"));
			});
		});
		[].forEach.call(document.querySelectorAll('.f1-modal-background'), function (elt) {
			elt.addEventListener('click', function () {
				that.closeModal(elt);
			});
		});
		// When the user clicks on <span> (x), close the modal
		[].forEach.call(document.querySelectorAll('.f1-modal-close'), function (elt) {
			elt.addEventListener('click', function () {
				that.closeModal(elt);
			});
		});
		addEventListenerById('btcancel', 'click', function () {
			that.closeModal();
		});
		addEventListenerById('btupdate', 'click', function () {
			that.closeModal();
		});
	}
	// keyboard management
	keyShiftPressed() {
		return this.shiftPressed;
	}
	// navigation options accessors
	navOptHidden() {
		return this.options.nav & _ui.nav_opt.HIDDEN;
	}
	navOptHome() {
		return this.options.nav & _ui.nav_opt.HOME;
	}
	navOptCloseonsel() {
		return this.options.nav & _ui.nav_opt.CLOSE_ON_SEL;
	}
	// navigation panel management
	hideNav(opt_resize = false) {
		setCSSVar(':root', '--navw', '0px');
		if (this.navelt) {
			this.navelt.style.setProperty("visibility", "hidden");
		}
		setWidthByClassName("f1-navw", this.navW);
		if (opt_resize) {
			resizeWindow();
		}
	}
	showNav(opt_resize = false) {
		setCSSVar(':root', '--navw', this.navW + 'px');
		if (this.navelt) {
			this.navelt.style.setProperty("visibility", "visible");
		}
		if (opt_resize) {
			resizeWindow();
		}
	}
	switchNav(opt_resize = false) {
		if (this.navOptHome()) {
			triggerClickBySelector("[data-idtab='home']");
		}
		if (!this.navOptHidden()) {
			var w = this.navW;
			if (this.navelt) {
				if (this.navelt.style.getPropertyValue('visibility') !== "hidden") {
					w = 0;
					this.navelt.style.setProperty("visibility", "hidden");
					setWidthByClassName("f1-navw", this.navW);
				}
				else {
					this.navelt.style.setProperty("visibility", "visible");
				}
			}
			setCSSVar(':root', '--navw', w + 'px');
			if (opt_resize) {
				resizeWindow();
			}
		}
	}
	// windows resize
	resize() {
		// set body height to window.innerHeight (issue on Android mobile/tablet for 100vh)
		document.body.style.height = window.innerHeight + "px";
	}
	// modal menu management functions
	openModalMenu(id) {
		try {
			document.getElementById(id).style.display = "block";
		}
		catch (error) {
			console.error("openModalMenu on id", id);
		}
	}
	closeModal(elt = null) {
		if (elt) {
			elt.style.display = "none";
		}
	}
	// Query parameters management
	// check for search parameters - tab and stab for the moment, to allow selecting 
	// on which tab and subtab the application will load
	// the value for the parameter tab must correspond to the id of one of the elemenet of the f1-stacked-panel class
	// the value for the parameter stab must correspond to the id of one of the elemenet of the f1-inpanel class
	checkQueryParameters() {
		const url = new URL(window.location.href);
		const tab = url.searchParams.get('tab');
		const stab = url.searchParams.get('stab');
		if (tab !== null) {
			triggerClickBySelector("[data-idtab='" + tab + "']");
		}
		if (stab !== null) {
			triggerClickBySelector("[data-idsubtab='" + stab + "']");
		}
	}
	// Show/hide window
	show() {
		if (this.blockelt) {
			this.blockelt.classList.add('f1-slow-hide');
		}
	}
	hide(duration = 0) {
		if (this.blockelt) {
			this.blockelt.classList.remove('f1-slow-hide');
			const that = this;
			if (duration > 0) {
				setTimeout(function () {
					that.show();
				}, duration);
			}
		}
	}
}
// navigation panel options
_ui.nav_opt = {
	FREE: 1,
	CLICK: 2,
	CLOSE_ON_SEL: 4,
	HIDDEN: 8,
	HOME: 16 //send back to home panel		
};
// general options
_ui.opt = {
	RESIZE: true
};
;
// formatting functions
// Lightweight number formatter library 
// https://github.com/Mottie/javascript-number-formatter
const maskRegex = /[0-9\-+#]/;
const notMaskRegex = /[^\d\-+#]/g;
function getIndex(mask) {
	return mask.search(maskRegex);
}
class _lnf_mask {
	constructor() {
		this.mask = '';
		this.prefix = '';
		this.suffix = '';
		this.maskHasNegativeSign = false;
		this.maskHasPositiveSign = false;
		this.decimal = '';
		this.separator = '';
		this.integer = '';
		this.fraction = '';
	}
}
class _lnf_value {
	constructor(value) {
		this.svalue = '';
		this.sign = '';
		this.result = '';
		this.integer = '';
		this.fraction = '';
		this.value = value;
	}
}
function processMask(mask = "#.##") {
	const maskObj = new _lnf_mask();
	//	{mask: "" string; maskHasNegativeSign: false boolean, maskHasPositiveSign:false boolean};
	const len = mask.length;
	const start = getIndex(mask);
	maskObj.prefix = start > 0 ? mask.substring(0, start) : "";
	// Reverse string: not an ideal method if there are surrogate pairs
	const end = getIndex(mask.split("").reverse().join(""));
	const offset = len - end;
	const substr = mask.substring(offset, offset + 1);
	// Add 1 to offset if mask has a trailing decimal/comma
	const indx = offset + ((substr === "." || (substr === ",")) ? 1 : 0);
	maskObj.suffix = end > 0 ? mask.substring(indx, len) : "";
	maskObj.mask = mask.substring(start, indx);
	maskObj.maskHasNegativeSign = maskObj.mask.charAt(0) === "-";
	maskObj.maskHasPositiveSign = maskObj.mask.charAt(0) === "+";
	// Search for group separator & decimal; anything not digit,
	// not +/- sign, and not #
	let result = maskObj.mask.match(notMaskRegex);
	// Treat the right most symbol as decimal
	maskObj.decimal = (result && result[result.length - 1]) || ".";
	// Treat the left most symbol as group separator
	maskObj.separator = (result && result[1] && result[0]) || ",";
	// Split the decimal for the format string if any
	result = maskObj.mask.split(maskObj.decimal);
	maskObj.integer = result[0];
	maskObj.fraction = result[1];
	return maskObj;
}
function processValue(value, maskObj, options) {
	let isNegative = false;
	const valObj = new _lnf_value(value);
	if (value < 0) {
		isNegative = true;
		// Process only abs(), and turn on flag.
		valObj.value = -valObj.value;
	}
	valObj.sign = isNegative ? "-" : "";
	// Fix the decimal first, toFixed will auto fill trailing zero.
	valObj.svalue = Number(valObj.value).toFixed(maskObj.fraction.length);
	// Convert number to string to trim off *all* trailing decimal zero(es)
	valObj.svalue = Number(valObj.svalue).toString();
	// Fill back any trailing zero according to format
	// look for last zero in format
	const posTrailZero = (maskObj.fraction.length > 0) ? maskObj.fraction.lastIndexOf("0") : -1;
	let [valInteger = "0", valFraction = ""] = valObj.svalue.split(".");
	if (valFraction.length <= posTrailZero) {
		valFraction = posTrailZero < 0
			? ""
			: (Number("0." + valFraction).toFixed(posTrailZero + 1)).replace("0.", "");
	}
	valObj.integer = valInteger;
	valObj.fraction = valFraction;
	addSeparators(valObj, maskObj);
	// Remove negative sign if result is zero
	if (valObj.result === "0" || valObj.result === "") {
		// Remove negative sign if result is zero
		isNegative = false;
		valObj.sign = "";
	}
	if (!isNegative && maskObj.maskHasPositiveSign) {
		valObj.sign = "+";
	}
	else if (isNegative && maskObj.maskHasPositiveSign) {
		valObj.sign = "-";
	}
	else if (isNegative) {
		valObj.sign = options.enforceMaskSign && !maskObj.maskHasNegativeSign
			? ""
			: "-";
	}
	return valObj;
}
function addSeparators(valObj, maskObj) {
	valObj.result = "";
	// Look for separator
	const szSep = maskObj.integer.split(maskObj.separator);
	// Join back without separator for counting the pos of any leading 0
	const maskInteger = szSep.join("");
	const posLeadZero = maskInteger.indexOf("0");
	if (posLeadZero > -1) {
		while (valObj.integer.length < (maskInteger.length - posLeadZero)) {
			valObj.integer = "0" + valObj.integer;
		}
	}
	else if (Number(valObj.integer) === 0) {
		valObj.integer = "";
	}
	// Process the first group separator from decimal (.) only, the rest ignore.
	// get the length of the last slice of split result.
	const posSeparator = (szSep[1] && szSep[szSep.length - 1].length);
	if (posSeparator) {
		const len = valObj.integer.length;
		const offset = len % posSeparator;
		for (let indx = 0; indx < len; indx++) {
			valObj.result += valObj.integer.charAt(indx);
			// -posSeparator so that won't trail separator on full length
			if (!((indx - offset + 1) % posSeparator) && indx < len - posSeparator) {
				valObj.result += maskObj.separator;
			}
		}
	}
	else {
		valObj.result = valObj.integer;
	}
	valObj.result += (maskObj.fraction && valObj.fraction)
		? maskObj.decimal + valObj.fraction
		: "";
	return valObj;
}
function format(mask, value, poptions = {}) {
	if (!mask || isNaN(Number(value))) {
		// Invalid inputs
		return "NaN";
	}
	//const options={enforceMaskSign:false}||poptions;
	const options = {
		enforceMaskSign: ((poptions.enforceMaskSign === undefined) ? false : poptions.enforceMaskSign)
	};
	const maskObj = processMask(mask);
	const valObj = processValue(value, maskObj, options);
	return maskObj.prefix + valObj.sign + valObj.result + maskObj.suffix;
}
