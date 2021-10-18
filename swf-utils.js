/*
 * Utils, part of the Simple Web Framework
 *
 * version: 1.1a
 * license: Apache 2.0
 * author:  François Court
 * date: october 2021
 *
 */
 
"use strict";

export { 
	importsHTML, 
	triggerClickById, 
	triggerClickBySelector, 
	setWidthByClassName,
	getCSSVar,
	setCSSVar,
	_browser,
	format,
	version,
	KEYS,
	dbg
};

function version() {
	return "swf utils v1.1a";
}
function dbg() {
	return "dbg01";
}
const svgns="http://www.w3.org/2000/svg";

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
function importsHTML(tokens=null) {
	// find the first element with the custom attribute data-imp-html
	const nodes = document.querySelectorAll("[data-imp-html]");
	for (let i = 0; i < nodes.length; i++) {
		const elmnt = nodes[i];
		// the data-imp-html attribute value containes the name of the file to load
		const filename = elmnt.getAttribute("data-imp-html");
		if (filename) {
			// send an HTTP request
			const xhttp = new XMLHttpRequest();
			xhttp.onreadystatechange = function() {
				if (this.readyState == 4) {
					if (this.status == 200) {
						let s=this.responseText;
						// if there are tokens passed to the function, loop through and
						// make the substitution (a token is a pair of identifier "{{ident}}" and text value
						// to replace {{ident}} with
						if (tokens != null) {
							tokens.forEach(function(item) {
								// build the regex on the fly
								const reg = new RegExp(item.token, 'g');
								s=s.replace(reg, item.value);
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
			}
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
	document.getElementById(id).dispatchEvent(new Event("click"));
}
// trigger a click on the first element meeting the filter in parameter
function triggerClickBySelector(selfilter) {
	document.querySelector(selfilter).dispatchEvent(new Event("click"));
}

// sets the widht of all elements belonging to the class in parameter
function setWidthByClassName(name, w) {
	const elts=document.getElementsByClassName(name);
	Array.prototype.every.call(elts, function(el){
		el.style.width=w+'px';
		return true;
	});
}

// get the value of a css var
function getCSSVar(sel, cssvar) {
	return String(getComputedStyle(document.querySelector(sel)).getPropertyValue(cssvar));
}
//set the value of a css var
function setCSSVar(sel, cssvar, value) {
	document.querySelector(sel).style.setProperty(cssvar, value);
}

// Browser detection class
class _browser {
	constructor() {
		// Opera 8.0+
		this.bisOpera=(!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
		// Firefox 1.0+
		this.bisFirefox = typeof InstallTrigger !== 'undefined';
		// Safari 3.0+ "[object HTMLElementConstructor]" 
		this.bisSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && window['safari'].pushNotification));
		// Internet Explorer 6-11
		this.bisIE = /*@cc_on!@*/false || !!document.documentMode;
		// Edge 20+
		this.bisEdge = !this.bisIE && !!window.StyleMedia;
		// Chrome 1 - 79
		this.bisChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);
		// Edge (based on chromium) detection
		this.bisEdgeChromium = this.bisChrome && (navigator.userAgent.indexOf("Edg") != -1);
		// Blink engine detection
		this.bisBlink = (this.bisChrome || this.bisOpera) && !!window.CSS;
	}
	isOpera() {return this.bisOpera;}
	isFirefox() {return this.bisFirefox;}
	isSafari() {return this.bisSafari;}
	isIE() {return this.bisIE;}
	isEdge() {return this.bisEdge;}
	isChrome() {return this.bisChrome;}
	isEdgeChromium() {return this.bisEdgeChromium;}
	isBlink() {return this.bisBlink;}
};


// formatting functions
// Lightweight number formatter library 
// https://github.com/Mottie/javascript-number-formatter

const maskRegex = /[0-9\-+#]/;
const notMaskRegex = /[^\d\-+#]/g;

function getIndex(mask) {
	return mask.search(maskRegex);
}

function processMask(mask = "#.##") {
	const maskObj = {};
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
	const valObj = {
		value
	};
	if (value < 0) {
		isNegative = true;
		// Process only abs(), and turn on flag.
		valObj.value = -valObj.value;
	}

	valObj.sign = isNegative ? "-" : "";

	// Fix the decimal first, toFixed will auto fill trailing zero.
	valObj.value = Number(valObj.value).toFixed(maskObj.fraction && maskObj.fraction.length);
	// Convert number to string to trim off *all* trailing decimal zero(es)
	valObj.value = Number(valObj.value).toString();

	// Fill back any trailing zero according to format
	// look for last zero in format
	const posTrailZero = maskObj.fraction && maskObj.fraction.lastIndexOf("0");
	let [valInteger = "0", valFraction = ""] = valObj.value.split(".");
	if (!valFraction || (valFraction && valFraction.length <= posTrailZero)) {
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
		valObj.sign = options && options.enforceMaskSign && !maskObj.maskHasNegativeSign
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

	const posLeadZero = maskInteger && maskInteger.indexOf("0");
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

function format (mask, value, options = {}) {
	if (!mask || isNaN(Number(value))) {
		// Invalid inputs
		return value;
	}

	const maskObj = processMask(mask);
	const valObj = processValue(value, maskObj, options);
	return maskObj.prefix + valObj.sign + valObj.result + maskObj.suffix;
};

