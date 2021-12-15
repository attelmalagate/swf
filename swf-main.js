/*
* Simple Web Framework
*	swf-main.html script companion
*	includes the ui management for the main html page of the framework
* version: 1.3
* license: Apache 2.0
* author:  François Court
* date: october 2021
*
*/
import * as utils from './swf-utils.js';
import * as tb from './swf-edtb.js';
import * as jg from './swf-juga.js';
// instanciation of the generic swf ui object  
let ui = new utils._ui({ nav: utils._ui.nav_opt.CLOSE_ON_SEL /*utils._ui.nav_opt.HIDDEN|utils._ui.nav_opt.HOME*/ });
// debug function to add lines in a table 
function fillTable(tbname, nblines, mult) {
	var tb = document.getElementById(tbname).querySelectorAll("tbody")[0];
	for (var i = 0; i < nblines; i++) {
		var tr = document.createElement('tr');
		for (var j = 1; j <= 3; j++) {
			var td = document.createElement('td');
			var att = document.createAttribute("contenteditable");
			att.value = "true";
			td.setAttributeNode(att);
			td.textContent = (i * mult + j).toString();
			tr.append(td);
		}
		tb.append(tr);
	}
}
function fillTables() {
	fillTable("tbpink", 20, 10);
	fillTable("tbgreen", 10, 100);
}
function selectDefault() {
	utils.triggerClickBySelector("[data-idtab='gallery']");
	utils.triggerClickBySelector("[data-idsubtab='inabout-gui']");
	utils.triggerClickBySelector("[data-idsubtab='jugaexample']");
	utils.triggerClickBySelector("[data-idsubtab='inpanel01']");
	if (ui.navOptCloseonsel()) {
		ui.hideNav();
	}
}
// Creation of a justified image gallery in the "jugaexample" tab, with the shiftPressed callback
// the juga object creates all the required elements for the gallery and the lightbox
function isShiftPressed() {
	return ui.keyShiftPressed();
}
let juga = new jg._juga("jugaexample", isShiftPressed, { jugaHeight: 90, checkable: false, lightBox: true });
document.addEventListener("DOMContentLoaded", function () {
	// test of the editable tables
	fillTables();
	//manage HTML imports
	const tokens = [{
			token: "{{name}}",
			value: "Fran&#xE7;ois Court"
		}, {
			token: "{{email}}",
			value: "attel@malagate.com"
		}, {
			token: "{{year}}",
			value: "2021"
		}];
	utils.importsHTML(tokens);
	// resize event, allow the update of the photo gallery and calls the szieElements function
	// to manage additional actions which would be needed (so far, only to manage a size issue on
	// Android mobile/tablet for 100vh)
	window.addEventListener('resize', function () {
		ui.resize();
		juga.resize();
	});
	// create the generic events handlers for the swf framework
	ui.addEvents();
	// select uimode management for the photo gallery
	// edition(checkable images-no lightbox)/consultation(no checkable images-lightbox)
	// get the select element
	const uimodeSelect = document.getElementById("uimode");
	// define the event handler when it changes
	if (uimodeSelect) {
		uimodeSelect.addEventListener('change', function () {
			var value = parseInt(uimodeSelect.options[uimodeSelect.selectedIndex].value);
			if (value == 1) {
				// consultation mode, images are not checkable and the lightox is started when you click on one
				juga.setCheckable(false);
				juga.setLightbox(true);
			}
			else {
				// edition mode, images are checkable, no lightox on click
				juga.setCheckable(true);
				juga.setLightbox(false);
			}
		});
		// default value on page load
		uimodeSelect.selectedIndex = 1;
	}
	else {
		console.warn("uimodeSelect not defined");
	}
	// management of editable tables; everything is managed in the class
	// including the invocation of the listener to click and keydown events
	// only here the application specific callback called when a cell is updated
	function onUpdate(elt) {
		console.log(elt.textContent);
	}
	var tbed = new tb._edtb(onUpdate, { toutMax: 5000 });
	// test ajax
	utils.addEventListenerById('btajax', 'click', function () {
		console.log('test ajax');
		const xhr = new XMLHttpRequest();
		xhr.open('GET', './swf-dbg-ajax.php');
		xhr.onload = function () {
			if (xhr.status === 200) {
				const data = JSON.parse(xhr.responseText);
				console.log(data);
				let text = "<table border='1'>";
				for (let x in data) {
					text += "<tr><td>" + data[x].idvariant + "</td><td>" + data[x].file + "</td><td>" + data[x].preview + "</td></tr>";
				}
				text += "</table>";
				document.getElementById("ajax").innerHTML = text;
			}
			else {
				console.error('ajax request failed, status =', xhr.status);
				console.warn(xhr);
			}
		};
		xhr.send();
	});
	// validation of the default selected tabs and sub-tabs
	selectDefault();
	// check & manager the url query parameters 
	ui.checkQueryParameters();
	// hide nav panel if option HIDDEN is selected
	if (ui.navOptHidden()) {
		ui.hideNav();
	}
	utils.addEventListenerById('btimgsize', 'click', function () {
		juga.sizeImages();
	});
	utils.addEventListenerById('btimgcheck', 'click', function () {
		juga.checkAll();
	});
	utils.addEventListenerById('btimguncheck', 'click', function () {
		juga.uncheckAll();
	});
	ui.resize();
	// hide the blocking div now that the page is loaded
	ui.show();
	// debug
	console.log(utils.version());
	console.log(jg.version());
	console.log(tb.version());
});
