/*
 * Editable HTML Tables, part of the Simple Web Framework
 *
 * version: 1.4
 * license: Apache 2.0
 * author:  François Court
 * date: october 2021
 *
 */
 
"use strict";

export { 
	_edtb,
	version
};

function version() {
	return "swf edtb v1.4";
}

// Editable Table class management _edtb
// editable cells (td elements) are identified with the contenteditable attribute at true
// _edtbs keep track of the cell being edited, manages callbacks for cancellation, validation and
// visually identifies a cell being edited (different background/borderradius)

// default values for the object options 
const _def_BGCOLOR="white";
const _def_BORDERRADIUS="5px";
const _def_BORDER="";//"3px solid #808080";
const _def_CURSOR="text";//"3px solid #808080";
const _def_TOUTMAX = 4000;

// keyboard management 
const _edtbKEYS = {
	ENTER: 13,
	ESC: 27,
	TAB: 9
};

type  _edtb_options = {
	backgroundColor: string;
	borderRadius: string;
	border: string;
	cursor: string;
	// mseconds of inactivity in edit mode before reverting to consult
	toutMax: number;
}

class _edtb {
	options:_edtb_options;
	
	elt: HTMLElement|null=null;// element being edited
	background: string='';
	text: string='';
	borderRadius: string='';
	border: string='';
	cursor: string='';
	toutid: number=0; // inactivity timeout
	onUpdate:(elt: HTMLElement) => void;

	// onUpdate: callback called when the input is validated
	// poptions: options for the behavior of the object (border,background color, inactivity timeout)
	constructor(onUpdate:(elt: HTMLElement) => void, poptions: Partial<_edtb_options>={}){
		// options management
		// options management
		this.options = {
			backgroundColor:(poptions.backgroundColor === undefined) ? _def_BGCOLOR : poptions.backgroundColor,
			borderRadius:(poptions.borderRadius === undefined) ? _def_BORDERRADIUS : poptions.borderRadius,
			border:(poptions.border === undefined) ? _def_BORDER : poptions.border,
			cursor:(poptions.cursor === undefined) ? _def_CURSOR : poptions.cursor,
			// mseconds of inactivity in edit mode before reverting to consult
			toutMax:(poptions.toutMax === undefined) ? _def_TOUTMAX : poptions.toutMax
		}
		this.onUpdate=onUpdate;
		// initialization of the editable cells, status at 0
		// save the current object to be used later in the event callbacks click and keydown
		const that=this;
		// go through every editable cell in the table and add the event listeners for click and keydown
		// where most of the logic reside
		[].forEach.call(document.querySelectorAll('[contenteditable]'), function(td: HTMLElement) {
			td.setAttribute("data-edit","0");
			// add the management of the click events
			td.addEventListener('click', function(evt) {
				that.clearTimer();
				// target is the element (tb) where the event happens
				const target=evt.target as HTMLElement;
				if (target && target.getAttribute("data-edit") === "0") {
					// click on inactive cell=>switch to edited status
					if (that.elt != null) {
						// restore the configuration of the previously edited cell
						that.elt.setAttribute("data-edit", "0");
						that.elt.textContent=that.text;
						that.restoreCSS();	
					}
					// keep track of the currently edited cell
					that.goEdit(target);
				}
			});
			td.addEventListener('keydown', function(evt) {
				// and the management of the keydown event
				that.clearTimer();
				let rv=false;
				let stop_edition=false;
				const target=evt.target as HTMLElement;
				if (target && target.getAttribute("data-edit") === "1") {
					if ((evt.which == _edtbKEYS.ESC) || (evt.which == _edtbKEYS.TAB)) {
						// ESC or TAB, cancel edition and revert to saved values
						if (that.elt != null) {
							that.elt.textContent=that.text;
						}
						stop_edition=true;
						rv=true;
					}
					else if (evt.which == _edtbKEYS.ENTER) {
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
					// we type on a non-edited cell: if the key is not in ENTER, ESC, TAB
					// we can go in edit mode
					if ((evt.which != _edtbKEYS.ESC) && (evt.which != _edtbKEYS.ENTER) && (evt.which != _edtbKEYS.TAB)) {
						that.goEdit(target);
						rv=true;
					}
					// if key=ENTER, the function must return false and cancel the input of the ENTER key
					if ((evt.which == _edtbKEYS.ESC) || (evt.which == _edtbKEYS.TAB)) {
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
	goEdit(target: HTMLElement){
		target.setAttribute("data-edit", "1");
		this.elt=target;
		this.saveCSS();
		this.elt.style.backgroundColor = this.options.backgroundColor;
		this.elt.style.borderRadius = this.options.borderRadius;
		this.elt.style.border = this.options.border;
		this.elt.style.cursor = this.options.cursor;
		this.setTimer();		
	}
	saveCSS() {
		if (this.elt != null) {
			this.text=(this.elt.textContent === null) ? "" : this.elt.textContent;
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
		this.options.toutMax);
	}
}
