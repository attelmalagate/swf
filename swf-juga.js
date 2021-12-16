/*
 * Justified Photo Gallery class, part of the Simple Web Framework
 *
 * version: 1.4
 * license: Apache 2.0
 * author:  François Court
 * date: october 2021
 *
 */
"use strict";
export { _juga, version };
import * as utils from './swf-utils.js';
function version() {
	return "swf juga v1.4";
}
// class storing the definition of an image
class _img {
	constructor(id, height, width) {
		this.ratio = 0;
		this.id = id;
		this.height = height;
		this.width = width;
		if (this.width != 0) {
			this.ratio = this.height / this.width;
		}
	}
}
;
class _imgElement {
	constructor(elt, defHeight) {
		this.width = 0;
		this.height = 0;
		this.ratio = 0;
		this.path = elt.src;
		this.id = elt.id;
		this.defHeight = (defHeight <= 0 ? 90 : defHeight);
		if (elt.complete) {
			this.setDim(elt.naturalHeight, elt.naturalWidth);
			this.loaded = true;
		}
		else {
			this.setDim(0, 0);
			this.loaded = false;
		}
		this.checked = false;
		this.next = null;
		this.prev = null;
		this.elt = elt;
	}
	setDim(height, width) {
		this.height = height;
		this.width = width;
		if ((this.height == 0) || (this.width == 0)) {
			this.height = this.defHeight;
			this.width = this.defHeight;
		}
		this.ratio = this.height / this.width;
	}
}
;
class _juga {
	constructor(parent, cbShiftPressed, poptions = {}) {
		this.targetHeight = 0;
		this.imgOffset = 0;
		this.imgOffsetRange = 5;
		this.nbImg = 0;
		this.nbImgOK = 0;
		this.nbImgFailed = 0;
		this.timeoutId = 0;
		this.imgs = new Map();
		this.images = [];
		this.imgs_first = null;
		this.imgs_last = null;
		this.imglb = null;
		this.imgBorder = (poptions.imgBorder === undefined) ? parseInt(utils.getCSSVar(':root', '--jgimgborder')) : poptions.imgBorder;
		this.jugaHeight = (poptions.jugaHeight === undefined) ? 90 : poptions.jugaHeight;
		this.sizeTimeout = (poptions.sizeTimeout === undefined) ? 100 : poptions.sizeTimeout;
		this.checkable = (poptions.checkable === undefined) ? true : poptions.checkable;
		this.lightBox = (poptions.lightBox === undefined) ? true : poptions.lightBox;
		this.parent = document.getElementById(parent);
		if (this.parent === null) {
			console.error("juga._juga error - parent does not exist for", parent);
		}
		if (cbShiftPressed != null) {
			this.cbShiftPressed = cbShiftPressed;
		}
		else {
			this.cbShiftPressed = function () {
				return false;
			};
		}
		const that = this; // for the two next event handlers
		// listener to the mouse wheel event for the lightbox (to navigate from one image to the other)
		const lbMouseWheel = function (e) {
			if (e.deltaY < 0) {
				that.lbPrev();
			}
			// wheel up, we go to the next image
			else {
				that.lbNext();
			}
		};
		this.lbMouseWheel = lbMouseWheel;
		// listener to the keydown event to navigate the lightbox on right/left/up/down and close on ESC
		const lbCheckKeyboard = function (e) {
			if (e.which == utils.KEYS.ESC) {
				that.lbClose();
			}
			else if (e.which == utils.KEYS.RIGHT) {
				that.lbNext();
			}
			else if (e.which == utils.KEYS.LEFT) {
				that.lbPrev();
			}
			else if (e.which == utils.KEYS.DOWN) {
				that.lbLast();
			}
			else if (e.which == utils.KEYS.UP) {
				that.lbFirst();
			}
		};
		this.lbCheckKeyboard = lbCheckKeyboard;
		// creation of the lightbox infrastructure
		this.lbCreate();
		// creation of the gallery
		this.fillImages();
	}
	// change the checkable option
	// true: images are checkable ; false: they are not
	setCheckable(value) {
		this.checkable = value;
		if (value === false) {
			// deselect all checked images when making the gallery non-checkable
			this.uncheckAll();
		}
	}
	// change the lightbox option
	// true: lightbox started on click; false: no ligthbox
	setLightbox(value) {
		this.lightBox = value;
	}
	// count the number of loaded images and update the imgs map with 
	//  - a loaded status
	//  - the actual dimension of the images (naturalHeight, naturalWidth)
	imagesLoaded() {
		var loaded = 0;
		const itr = this.imgs.values();
		let img = itr.next();
		while (!img.done) {
			if (img.value.elt.complete) {
				img.value.setDim(img.value.elt.naturalHeight, img.value.elt.naturalWidth);
				img.value.loaded = true;
				loaded++;
			}
			img = itr.next();
		}
		if (loaded >= this.nbImg) {
			this.nbImgOK = this.nbImg;
			return true;
		}
		return false;
	}
	// check the loading status of the images; if not all loaded, re-check after 100ms
	checkImagesLoadingStatus() {
		if (!this.imagesLoaded()) {
			const that = this;
			setTimeout(function () {
				that.checkImagesLoadingStatus();
			}, 100);
		}
		else {
			this.resize();
		}
	}
	// creates the images, div and check span
	fillImages() {
		this.nbImg = 0;
		this.nbImgOK = 0;
		this.nbImgFailed = 0;
		this.imgs.clear();
		this.imgs_first = null;
		this.imgs_last = null;
		let imgInserted = null;
		if (this.parent) {
			const that = this;
			this.parent.querySelectorAll("img").forEach(function (elt) {
				const div = document.createElement('div');
				div.classList.add("f1-juga");
				elt.style.height = that.jugaHeight + "px";
				elt.classList.add("f1-juga-img");
				elt.addEventListener('click', function (e) {
					that.imgClicked(e);
				});
				// add span element for the check mark
				const span = document.createElement('span');
				span.classList.add("f1-normal-hide");
				span.classList.add("f1-img-checkmark");
				div.append(span);
				div.append(elt);
				that.parent.insertAdjacentElement('beforeend', div);
				// store the images information in the imgs Map
				const img = new _imgElement(elt, that.jugaHeight);
				img.prev = imgInserted;
				that.imgs.set(elt.id, img);
				if (imgInserted !== null) {
					imgInserted.next = img;
				}
				if (that.imgs_first === null) {
					that.imgs_first = img;
				}
				that.imgs_last = img;
				imgInserted = img;
				that.nbImg++;
			});
		}
		if (this.nbImg > 0) {
			this.checkImagesLoadingStatus();
		}
		/*
		for (let i=11; i<57; i++) {
			const div=document.createElement('div');
			div.classList.add("f1-juga");
			const img=document.createElement('img');
			img.setAttribute("src","./imgjuga/000"+i+".cot");
			img.setAttribute("id","img000"+i+".cot");
			img.style.height=this.jugaHeight +"px";
			img.classList.add("f1-juga-img");
			const that=this;
			img.addEventListener('load', function() {
				that.imgLoaded();
			});
			img.addEventListener('error', function() {
				that.imgFailed();
			});
			if (this.checkable) {
				img.addEventListener('click', function(e) {
					that.imgClicked(e);
				});
				const span=document.createElement('span');
				span.classList.add("f1-normal-hide");
				span.classList.add("f1-img-checkmark");
				div.append(span);
			}
			div.append(img);
			this.parent.append(div);
			this.nbImg++;
		}*/
	}
	isReady() {
		return ((this.parent !== null) && (this.nbImgOK + this.nbImgFailed) == this.nbImg);
	}
	// find a solution for a given container width
	buildRows(w) {
		let nbrows = 0;
		this.images.length = 0;
		// loop to find how many images fit per row given the target width (w)
		const itr = this.imgs.values();
		let img = itr.next();
		while (!img.done) {
			let rowwidth = 0;
			let actualwidth = 0;
			this.images.push(new Array());
			while ((rowwidth <= w) && !img.done) {
				rowwidth = rowwidth + this.targetHeight / img.value.ratio;
				if (rowwidth <= w) {
					actualwidth = rowwidth;
					let newimg = new _img(img.value.id, this.targetHeight, this.targetHeight / img.value.ratio);
					this.images[nbrows].push(newimg);
					img = itr.next();
				}
			}
			if (actualwidth == 0) {
				this.images[nbrows].push(new _img(img.value.id, this.targetHeight, this.targetHeight / img.value.ratio));
				img = itr.next();
			}
			nbrows++;
		}
		//compute the solution height once the set images has been created
		let totalHeight = 0;
		const that = this;
		this.images.forEach(function (row, index) {
			const lastrow = (index == (that.images.length - 1));
			let newH = 0;
			let invr = 0;
			row.forEach(function (image) {
				invr = invr + 1 / image.ratio;
			});
			if (lastrow) {
				newH = that.targetHeight;
			}
			else {
				newH = Math.round(w / invr);
			}
			let rowwidth = 0;
			row.forEach(function (image) {
				image.height = newH;
				image.width = Math.round(newH / image.ratio);
				rowwidth += image.width;
			});
			totalHeight += newH;
		});
		return totalHeight;
	}
	// function to initiate a resize - sizeImages is not supposed to be called directly
	resize() {
		if (this.timeoutId != 0) {
			clearTimeout(this.timeoutId);
		}
		const that = this;
		this.timeoutId = setTimeout(function () {
			that.sizeImages();
		}, this.sizeTimeout);
	}
	// do the actual resizing/positioning of the gallery
	sizeImages() {
		if (!this.isReady()) {
			console.log("juga - loading error");
			return;
		}
		this.targetHeight = this.jugaHeight + this.imgOffset;
		//let iw=this.parent.offsetWidth;
		const thisparent = this.parent;
		let iw = thisparent.clientWidth;
		let height = this.buildRows(iw);
		if ((height >= thisparent.clientHeight) && (iw != thisparent.clientWidth)) {
			iw = thisparent.clientWidth;
			height = this.buildRows(iw);
		}
		const that = this;
		let top = 0;
		// loop to adjust the dimensions of the elements div/img based on the set 'images'
		// the containing div gets the calculated widht/height while the img's are adjusted
		// with the border value
		this.images.forEach(function (row, index) {
			const lastrow = (index == (that.images.length - 1));
			let curiw = 0;
			let imgparent;
			let imgelt;
			let left = 0;
			row.forEach(function (image) {
				imgelt = document.getElementById(image.id);
				imgparent = imgelt.parentElement;
				imgelt.style.height = (image.height - that.imgBorder * 2) + 'px';
				imgelt.style.width = (Math.round(image.height / image.ratio) - that.imgBorder * 2) + "px";
				imgparent.style.height = image.height + 'px';
				;
				imgparent.style.width = Math.round(image.height / image.ratio) + "px";
				imgparent.style.top = top + "px";
				imgparent.style.left = left + "px";
				curiw = curiw + Math.round(image.height / image.ratio);
				left = left + Math.round(image.height / image.ratio);
			});
			// we adjust the width of the last image to make sure the sum of all width in a given row
			// correspond to the target width (rounding from float to int)
			if ((curiw != iw) && !lastrow) {
				let w = parseInt(imgparent.style.width);
				imgelt.style.width = (w - (curiw - iw) - that.imgBorder * 2) + "px";
				imgparent.style.width = (w - (curiw - iw)) + "px";
			}
			top = top + parseInt(imgparent.style.height);
		});
		// if there is more than on row, we check if there is actually a match between the um of the
		// width of images with the container's width: a mismatch can happen due to the vertical
		// scroll bar. In this case, a resize is needed but to avoid an infinite 
		// loop between two solutions, we change the targetHeight by one pixel at each new attempt 
		// (within a limited range)
		if (this.images.length > 1) {
			let w = 0;
			this.images[0].forEach(function (image) {
				const parent = document.getElementById(image.id).parentElement;
				w = w + parseInt(parent.style.width);
			});
			if (w != this.parent.clientWidth) {
				console.log("Attention offset " + this.imgOffset + " with w=" + w + " and panelw=" + this.parent.clientWidth);
				const that = this;
				this.imgOffset++;
				if (this.imgOffset > this.imgOffsetRange) {
					this.imgOffset = -this.imgOffsetRange;
				}
				this.targetHeight = this.targetHeight + this.imgOffset;
				this.resize();
			}
		}
	}
	// Checked/unchecked images management
	shiftPressed() {
		if (this.cbShiftPressed !== null) {
			return this.cbShiftPressed();
		}
		return false;
	}
	// manage click for checkable gallery (with the optional shift key pressed)
	imgClicked(e) {
		const img = this.imgs.get(e.target.id);
		if (img === undefined) {
			return;
		}
		if (this.lightBox) {
			this.lbOpen(img);
		}
		else if (this.checkable) {
			if (img.checked) {
				this.uncheckImg(img);
				// if shift key is pressed, uncheck also all previous adjacent images checked
				if (this.shiftPressed()) {
					let previmg = img.prev;
					while (previmg !== null) {
						if (previmg.checked == true) {
							this.uncheckImg(previmg);
						}
						else {
							break;
						}
						previmg = previmg.prev;
					}
				}
			}
			else {
				this.checkImg(img);
				// if shift key is pressed, check also all previous adjacent images unchecked
				if (this.shiftPressed()) {
					let previmg = img.prev;
					while (previmg !== null) {
						if (previmg.checked == false) {
							this.checkImg(previmg);
						}
						else {
							break;
						}
						previmg = previmg.prev;
					}
				}
			}
		}
	}
	// lightbox functions
	// starting with its creation/initialization
	// - first the html inside a div element of id=lightboxcontainer
	// - then the events handler
	lbCreate() {
		let div_lb = document.createElement('div');
		div_lb.id = 'lightboxcontainer';
		div_lb.classList.add('f1-hide');
		div_lb.classList.add('f1-nopadding');
		const html = '' +
			'<div class="f1-lb-header">' +
			'<svg id="lbclose"  class="f1-icon-circled f1-lb-control f1-padding-10-20">' +
			'<use href="./feather-sprite-circled.svg#x"/>' +
			'</svg>' +
			'</div>' +
			'<div id="lightbox" class="f1-lb-background">' +
			'<img id="lbimg" src="" class="f1-lb-img"></img>' +
			'</div>' +
			'<div id="f1lbleftpanel" class="f1-lb-panel f1-lb-panel-left">' +
			'<svg id="f1lbfirst" class="f1-icon-circled-large f1-lb-control f1-hide f1-padding-0-30">' +
			'<use href="./feather-sprite-circled.svg#chevrons-left"/>' +
			'</svg>' +
			'<svg id="f1lbprev" class="f1-icon-circled-large f1-lb-control f1-hide f1-nopadding">' +
			'<use href="./feather-sprite-circled.svg#chevron-left"/>' +
			'</svg>' +
			'</div>' +
			'<div id="f1lbrightpanel" class="f1-lb-panel f1-lb-panel-right">' +
			'<svg id="f1lbnext" class="f1-icon-circled-large f1-lb-control f1-hide f1-nopadding">' +
			'<use href="./feather-sprite-circled.svg#chevron-right"/>' +
			'</svg>' +
			'<svg id="f1lblast" class="f1-icon-circled-large f1-lb-control f1-hide f1-padding-0-30">' +
			'<use href="./feather-sprite-circled.svg#chevrons-right"/>' +
			'</svg>' +
			'</div>';
		div_lb.innerHTML = html;
		document.body.prepend(div_lb);
		try {
			const that = this;
			document.getElementById("f1lbleftpanel").addEventListener('click', function (e) {
				that.lbPrev();
				e.stopPropagation();
			});
			document.getElementById("f1lbrightpanel").addEventListener('click', function (e) {
				that.lbNext();
				e.stopPropagation();
			});
			document.getElementById("lbimg").addEventListener('click', function (e) {
				e.stopPropagation();
			});
			document.getElementById("f1lbfirst").addEventListener('click', function (e) {
				that.lbFirst();
				e.stopPropagation();
			});
			document.getElementById("f1lbnext").addEventListener('click', function (e) {
				that.lbNext();
				e.stopPropagation();
			});
			document.getElementById("f1lbprev").addEventListener('click', function (e) {
				that.lbPrev();
				e.stopPropagation();
			});
			document.getElementById("f1lblast").addEventListener('click', function (e) {
				that.lbLast();
				e.stopPropagation();
			});
			document.getElementById("lbclose").addEventListener('click', function () {
				that.lbClose();
			});
			[].forEach.call(document.querySelectorAll('.f1-lb-panel'), function (elt) {
				elt.addEventListener('mouseenter', function () {
					document.getElementById("lbclose").classList.add("f1-lb-control-hovered");
				});
				elt.addEventListener('mouseleave', function () {
					document.getElementById("lbclose").classList.remove("f1-lb-control-hovered");
				});
			});
			[].forEach.call(document.querySelectorAll('.f1-lb-background'), function (elt) {
				elt.addEventListener('click', function () {
					that.lbClose();
				});
			});
		}
		catch (error) {
			console.error("_juga.lbCreate handlers creation error", error);
		}
	}
	lbOpen(img) {
		document.getElementById("lbimg").setAttribute("src", img.path);
		document.getElementById("lightboxcontainer").style.display = "block";
		this.imglb = img;
		window.addEventListener("wheel", this.lbMouseWheel);
		window.addEventListener('keydown', this.lbCheckKeyboard);
	}
	lbClose() {
		document.getElementById("lightboxcontainer").style.display = "none";
		window.removeEventListener("wheel", this.lbMouseWheel);
		window.removeEventListener("keydown", this.lbCheckKeyboard);
	}
	lbFirst() {
		if (this.imgs_first !== null) {
			this.imglb = this.imgs_first;
			document.getElementById("lbimg").setAttribute("src", this.imglb.path);
		}
	}
	lbNext() {
		if (this.imglb !== null) {
			if (this.imglb.next !== null) {
				this.imglb = this.imglb.next;
				document.getElementById("lbimg").setAttribute("src", this.imglb.path);
			}
		}
	}
	lbPrev() {
		if (this.imglb !== null) {
			if (this.imglb.prev !== null) {
				this.imglb = this.imglb.prev;
				document.getElementById("lbimg").setAttribute("src", this.imglb.path);
			}
		}
	}
	lbLast() {
		if (this.imgs_last !== null) {
			this.imglb = this.imgs_last;
			document.getElementById("lbimg").setAttribute("src", this.imglb.path);
		}
	}
	// check one image, identified by its id or directly by passing the object
	checkImg(pimg) {
		if (pimg !== undefined) {
			pimg.elt.classList.add('f1-img-grey');
			pimg.elt.previousSibling.classList.remove('f1-normal-hide');
			pimg.checked = true;
		}
	}
	// uncheck one image, identified by its id or directly by passing the object
	uncheckImg(pimg) {
		if (pimg !== undefined) {
			pimg.elt.classList.remove('f1-img-grey');
			pimg.elt.previousSibling.classList.add('f1-normal-hide');
			pimg.checked = false;
		}
	}
	checkAll() {
		const that = this;
		if (this.checkable) {
			this.imgs.forEach(function (value) {
				that.checkImg(value);
			});
		}
	}
	uncheckAll() {
		const that = this;
		this.imgs.forEach(function (value) {
			that.uncheckImg(value);
		});
	}
}
