/*
 * Utils, part of the Simple Web Framework
 *
 * version: 1.0
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
	spawnHeader,
	_edtb,
	_browser,
	format,
	version,
	dbg
};

function version() {
	return "swf utils v1.0";
}
function dbg() {
	return "dbg01";
}
const svgns="http://www.w3.org/2000/svg";

// Editable Table class management _edtb
// editable cells (td elements) are identified with the contenteditable attribute at true
// _edtbs keep track of the cell being edited, manages callbacks for cancellation, validation and
// visually identifies a cell being edited (different background/borderradius)
const _edtb_backgroundColor="white";
const _edtb_borderRadius="5px";
const _edtb_border="";//"3px solid #808080";
const _edtb_cursor="text";//"3px solid #808080";
class _edtb {
	// on success is called when the input is validated
	constructor(onUpdate){
		this.elt=null; // element being edited
		this.background="";
		this.text="";
		this.borderRadius="";
		this.border="";
		this.cursor="";
		this.toutid=0; // inactivity timeout
		this.toutmax=4000; //  seconds
		this.onUpdate=onUpdate;
		// initialization of the editable cells, status at 0
		// save the current object to be used later in the event callbacks click and keydown
		const that=this;
		// go through every editable cell in the table and add the event listeners for click and keydown
		// where most of the logic reside
		[].forEach.call(document.querySelectorAll('[contenteditable]'), function(elt) {
			elt.setAttribute("data-edit","0");
			// add the management of the click events
			elt.addEventListener('click', function(evt) {
				that.clearTimer();
				// target is the element (tb) where the event happens
				const target=evt.target;
				if (target.getAttribute("data-edit") === "0") {
					// click on inactive cell=>switch to edited status
					target.setAttribute("data-edit", "1");
					if (that.elt != null) {
						// restoration of the passive configuration of the previously edited cell
						that.elt.setAttribute("data-edit", "0");
						that.elt.textContent=that.text;
						that.restoreCSS();	
					}
					// keep track of the currently edited cell
					that.elt=target;
					that.saveCSS();
					that.elt.style.backgroundColor = _edtb_backgroundColor;
					that.elt.style.borderRadius = _edtb_borderRadius;
					that.elt.style.border = _edtb_border;
					that.elt.style.cursor = _edtb_cursor;
					that.setTimer();
				}
			});
			elt.addEventListener('keydown', function(evt) {
				// and the management of the keydown event
				that.clearTimer();
				let rv=false;
				let stop_edition=false;
				const target=evt.target;
				if (target.getAttribute("data-edit") === "1") {
					if ((evt.which == 27) || (evt.which == 9)) {
						// ESC or TAB, cancel edition and revert to saved values
						if (that.elt != null) {
							that.elt.textContent=that.text;
						}
						stop_edition=true;
						rv=true;
					}
					else if (evt.which == 13) {
						// ENTER, the input is validated, edition mode is stopped and the onUpdate callback is called
						rv=false; // to prevent adding a line break in the cell being edited 
						stop_edition=true;
						that.onUpdate(target);
					}
					else {
						// add here other filters as appropriate
						that.setTimer();
						rv=true;
					}
					if (stop_edition) {
						that.restoreCSS();
						target.setAttribute("data-edit", "0");
						// make sure we lose the focus on the cell being edited when we stop edition
						target.blur();
						that.elt = null;
					}
				}
				else {
					// we type on a non-edited cell: if the key is not in ENTER (13), ESC (27), TAB (9)
					// we can go in edit mode
					if ((evt.which != 27) && (evt.which != 13) && (evt.which != 9)) {
						target.setAttribute("data-edit", "1");
						that.elt=target;
						that.saveCSS();
						that.elt.style.backgroundColor = _edtb_backgroundColor;
						that.elt.style.borderRadius = _edtb_borderRadius;
						that.elt.style.border = _edtb_border;
						that.elt.style.cursor = _edtb_cursor;
						that.setTimer();
						rv=true;
					}
					// if key=ENTER, the function must return false and cancel the input of the ENTER key
					if ((evt.which == 27) || (evt.which == 9)) {
						rv=true;
					}
				}
				if (rv == false) {
					// to return false is not always enough, you need to call preventDefault() 
					// and I added stopPropagation() for good measure
					evt.preventDefault();
					evt.stopPropagation();
				}
				return rv;
			});
		});

	}
	saveCSS() {
		if (this.elt != null) {
			this.text=this.elt.textContent;
			this.background=this.elt.style.backgroundColor;
			this.borderRadius=this.elt.style.borderRadius;
			this.border=this.elt.style.border;
			this.cursor=this.elt.style.cursor;
		}
	}
	restoreCSS() {
		if (this.elt != null) {
			this.elt.style.backgroundColor=this.background;
			this.elt.style.borderRadius=this.borderRadius;
			this.elt.style.border=this.border;
			this.elt.style.cursor=this.cursor;
		}
	}
	clearTimer() {
		if (this.toutid>0) {
			clearTimeout(this.toutid);
			this.toutid=0;
		}
	}
	setTimer() {
		const that=this;
		this.toutid=setTimeout( function() { 
			that.restoreCSS();
			if (that.elt != null) {
				that.elt.textContent=that.text;
				that.elt.setAttribute("data-edit", "0");
			}
			that.elt=null;
		}, 
		this.toutmax);
	}
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

// generation of standard header and footer
function spawnHeader(title, logo) {
	let hdr=document.getElementById("f1ga_header");
	if (hdr) {
		// container
		let div_f1_header=document.createElement('div');	
		div_f1_header.classList.add('f1-header');
		// left part
		let div_left=document.createElement('div');
		let img=document.createElement('img');
		img.src=logo;
		img.classList.add('switchnav');
		img.classList.add('f1-cu-pointer');
		img.id="opener";
		div_left.append(img);
		// center
		let div_center=document.createElement('div');
		div_center.style.fontWeight="bold";
		div_center.style.fontSize="2em";
		div_center.innerText=title;
		// right part
		let div_right=document.createElement('div');
		let svg=document.createElementNS(svgns, "svg");
		svg.classList.add("f1-icon");
		svg.classList.add("menuitem");
		svg.classList.add("f1-menu-show");
		let use=document.createElementNS(svgns, 'use');
		use.setAttribute("href", "./libs/feather-sprite.svg#menu");
		svg.append(use);
		div_right.append(svg);
		// append left, right and center to the container
		div_f1_header.append(div_left);
		div_f1_header.append(div_center);
		div_f1_header.append(div_right);
		hdr.append(div_f1_header);
	}
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

