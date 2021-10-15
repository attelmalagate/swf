/*
 * Justified Photo Gallery class, part of the Simple Web Framework
 *
 * version: 1.1
 * license: Apache 2.0
 * author:  François Court
 * date: october 2021
 *
 */
 
"use strict";
export { 
	_juga,
	version
};

import * as utils from './swf-utils.js';

function version() {
	return "swf juga v1.1";	
}

// class storing the definition of an image
class _img {
	constructor(id, height, width) {
		this.id = id;
		this.height = height;
		this.width = width;
		this.ratio = 0;
		if (this.width !=0) {
			this.ratio=this.height/this.width;
		}
	}
};

class _imgElement {
	constructor(elt, defHeight) {
		this.path = elt.src;
		this.id = elt.id;
		this.defHeight=(defHeight<=0 ? 90: defHeight);
		if (elt.complete) {
			this.setDim(elt.naturalHeight, elt.naturalWidth);
			this.loaded=true;
		}
		else {
			this.setDim(0, 0);
			this.loaded=false;
		}
		this.checked=false;
		this.next=null;
		this.prev=null;
		this.elt=elt;
	}
	setDim(height, width) {
		this.height=height;
		this.width=width;
		if ((this.height == 0) || (this.width == 0)) {
			this.height=this.defHeight;
			this.width=this.defHeight;
		}
		this.ratio=this.height/this.width;
	}
};

// added to manage the mousewheel callback (and preserve the ability to remove it as event listener)
var that;

// Class to nmanage the justification of a collection of images in a container
// Parameters:
// - id of the container (a div)
// - border around the images in px
// - the target height for the justification in px
// - a timeout in ms to limit multiple resize actions
// The principle is as follows:
// 1. given the target height, you evaluate how many images fit per row given the width of the container
// 2. you adjust the height (different for each row) so that the widht of each row matches the width of the container
//     for each row, adjustedHeight=targetHeight/(Sum of ratios of the images in the row)
// 3. you position the images (each in a div, absolute position) 
// 4. there is no adjustment needed for the last row 
// There are two data sets: 
//   imgs, just a list of all the images with src and original dimensions, established just once at loading
//   images, representing the justified images, per row, with their justified dimensions 
class _juga {
	constructor(parent, cbShiftPressed, poptions){	
		const options = poptions || {};
		this.imgBorder = (options.imgBorder === undefined) ? parseInt(utils.getCSSVar(':root', '--jgimgborder')) : options.imgBorder;
		this.jugaHeight = options.jugaHeight || 90;
		this.sizeTimeout=options.sizeTimeout || 200;
		this.checkable = (options.checkable === undefined) ? true : options.checkable;
		this.lightBox = (options.checkable === undefined) ? true : options.lightBox;
		this.targetHeight = 0;
		this.imgOffset=0;
		this.imgOffsetRange=5;
		this.nbImg=0;
		this.nbImgOK=0;
		this.nbImgFailed=0;
		this.timeoutId=0;
		this.imgs = new Map();
		this.images =[];
		this.parent=document.getElementById(parent);
		if (cbShiftPressed!= null) {
			this.cbShiftPressed=cbShiftPressed;
		}
		that=this;
		// creation of the lightbox infrastructure
		this.lbCreate();
		// creation of the gallery
		this.fillImages();
	}
	
	// change the checkable option
	// true: images are checkable ; false: they are not
	setCheckable(value) {
		this.checkable=value;
		if (value === false) {
			// deselect all checked images when making the gallery non-checkable
			this.uncheckAll();
		}
	}
	// change the lightbox option
	// true: lightbox started on click; false: no ligthbox
	setLightbox(value) {
		this.lightBox=value;
	}
	
	// count the number of loaded images and update the imgs map with 
	//  - a loaded status
	//  - the actual dimension of the images (naturalHeight, naturalWidth)
	imagesLoaded() {
		var loaded=0;
		const itr=this.imgs.values();
		let img=itr.next();
		while (!img.done) {
			if (img.value.elt.complete) {
				img.value.setDim(img.value.elt.naturalHeight, img.value.elt.naturalWidth);
				img.value.loaded=true;
				loaded++;
			}
			img=itr.next();
		}
		if (loaded >= that.nbImg) {
			that.nbImgOK=that.nbImg;
			return true;		
		}
		return false;
	}
	// check the loading status of the images; if not all loaded, re-check after 100ms
	checkImagesLoadingStatus() {
		if (!that.imagesLoaded()) {
			setTimeout(function() {
				that.checkImagesLoadingStatus();
			}, 100);
		}
		else {
			that.resize();
		}		
	}
	// creates the images, div and check span
	fillImages() {
		this.nbImg=0;
		this.nbImgOK=0;
		this.nbImgFailed=0;
		this.imgs.clear();
		this.imgs_first=null;
		this.imgs_last=null;
		let imgInserted=null;
		this.parent.querySelectorAll("img").forEach(function(elt) {
			const div=document.createElement('div');	 
			div.classList.add("f1-juga");
			elt.style.height=that.jugaHeight +"px";
			elt.classList.add("f1-juga-img");
			elt.addEventListener('click', function(e) {
				that.imgClicked(e);	
			});
			// add span element for the check mark
			const span=document.createElement('span');
			span.classList.add("f1-normal-hide");
			span.classList.add("f1-img-checkmark");
			div.append(span);
			div.append(elt);
			that.parent.insertAdjacentElement('beforeend', div);

			// store the images information in the imgs Map
			const img=new _imgElement(elt, that.jugaHeight);
			img.prev=imgInserted;
			that.imgs.set(elt.id, img);
			if (imgInserted !== null) {
				imgInserted.next=img;
			}
			if (that.imgs_first === null) {
				that.imgs_first=img;
			}
			that.imgs_last=img;
			imgInserted=img;


			that.nbImg++;
		});
		if (this.nbImg>0) {
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
		return ((this.nbImgOK+this.nbImgFailed) == this.nbImg);
	}
	
	
	// find a solution for a given container width
	buildRows(w) {
		let nbrows=0;
		this.images.length=0;
		// loop to find how many images fit per row given the target width (w)
		const itr=this.imgs.values();
		let img=itr.next();
		while (!img.done) {
			let rowwidth=0;
			let actualwidth=0;
			this.images.push(new Array());
			while ((rowwidth<=w) && !img.done) {
				rowwidth=rowwidth+this.targetHeight/img.value.ratio;
				if (rowwidth<=w) {
					actualwidth=rowwidth
					let newimg=new _img(img.value.id, this.targetHeight,this.targetHeight/img.value.ratio);
					this.images[nbrows].push(newimg);
					img=itr.next();
				}
			}
			if (actualwidth == 0) {
				this.images[nbrows].push(new _img(img.value.id, this.targetHeight,this.targetHeight/img.value.ratio));
				img=itr.next();				
			}
			nbrows++;
		}
		//compute the solution height once the set images has been created
		let totalHeight=0;
		const that=this;
		this.images.forEach(function(row, index) {
			const lastrow=(index == (that.images.length-1));
			let newH=0
			let invr=0;
			row.forEach(function(image){
				invr=invr+1/image.ratio;
			});
			if (lastrow) {
				newH=that.targetHeight;
			}
			else {
				newH=Math.round(w/invr);
			}
			let rowwidth=0;
			row.forEach(function(image){
				image.height=newH;
				image.width=Math.round(newH/image.ratio);
				rowwidth+=image.width;
			});
			totalHeight+=newH;
		});
		return totalHeight;
	}
	
	// function to initiate a resize - sizeImages is not supposed to be called directly
	resize() {
		if (this.timeoutId!=0) {
			clearTimeout(this.timeoutId);
		}
		const that=this;
		this.timeoutId=setTimeout( function() { 
			that.sizeImages();
			}, 
		this.imgTimeout);
	}
	
	// do the actual resizing/positioning of the gallery
	sizeImages() {
		if (!this.isReady()) {
			console.log("juga - loading error");
			return;
		}
		this.targetHeight=this.jugaHeight+this.imgOffset;
		//let iw=this.parent.offsetWidth;
		let iw=this.parent.clientWidth;
		let height=this.buildRows(iw);
		if ((height>=this.parent.clientHeight) && (iw!=this.parent.clientWidth)) {
			iw=this.parent.clientWidth;
			height=this.buildRows(iw);
		}
		const that=this;
		let top=0;
		// loop to adjust the dimensions of the elements div/img based on the set 'images'
		// the containing div gets the calculated widht/height while the img's are adjusted
		// with the border value
		this.images.forEach(function(row, index) {
			const lastrow=(index == (that.images.length-1));
			let curiw=0;
			let imgparent;
			let imgelt;
			let left=0;
			row.forEach(function(image){
				imgelt=document.getElementById(image.id);
				imgparent=imgelt.parentElement;
				imgelt.style.height=(image.height-that.imgBorder*2)+'px';
				imgelt.style.width=(Math.round(image.height/image.ratio)-that.imgBorder*2) + "px";
				imgparent.style.height=image.height+'px';;
				imgparent.style.width=Math.round(image.height/image.ratio) + "px";
				imgparent.style.top=top+"px";
				imgparent.style.left=left+"px";
				curiw=curiw+Math.round(image.height/image.ratio);
				left=left+Math.round(image.height/image.ratio);
			});
			// we adjust the width of the last image to make sure the sum of all width in a given row
			// correspond to the target width (rounding from float to int)
			if ((curiw!=iw) && !lastrow) {
				let w=parseInt(imgparent.style.width);
				imgelt.style.width=(w-(curiw-iw)-that.imgBorder*2)+"px";
				imgparent.style.width=(w-(curiw-iw))+"px";
			}
			top=top+parseInt(imgparent.style.height);
		});
		// if there is more than on row, we check if there is actually a match between the um of the
		// width of images with the container's width: a mismatch can happen due to the vertical
		// scroll bar. In this case, a resize is needed but to avoid an infinite 
		// loop between two solutions, we change the targetHeight by one pixel at each new attempt 
		// (within a limited range)
		if (this.images.length>1) {
			let w=0;
			this.images[0].forEach(function(image){
				const parent=document.getElementById(image.id).parentElement;
				w=w+parseInt(parent.style.width);
			});
			if (w!=this.parent.clientWidth) {
				console.log("Attention offset " + this.imgOffset + " with w=" + w + " and panelw=" + this.parent.clientWidth);
				const that=this;
				this.imgOffset++;
				if (this.imgOffset>this.imgOffsetRange) {
					this.imgOffset=-this.imgOffsetRange;
				}
				this.targetHeight=this.targetHeight+this.imgOffset;
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
		const img=this.imgs.get(e.srcElement.id);
		this.img=null;
		if (img === undefined) {
			return;
		}
		if (this.lightBox) {
			this.lbOpen(img);
		}
		else if (this.checkable) {
			if (img.checked) {
				this.uncheckImg(0, img);
				// if shift key is pressed, uncheck also all previous adjacent images checked
				if (this.shiftPressed()) {
					let previmg=img.prev;
					while (previmg !== null) {
						if (previmg.checked==true) {
							this.uncheckImg(0, previmg);
						}
						else {
							break;
						}
						previmg=previmg.prev;
					}
				}
			}
			else {
				this.checkImg(0, img);
				// if shift key is pressed, check also all previous adjacent images unchecked
				if (this.shiftPressed()) {
					let previmg=img.prev;
					while (previmg !== null) {
						if (previmg.checked==false) {
							this.checkImg(0, previmg);
						}
						else {
							break;
						}
						previmg=previmg.prev;
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
		let div_lb=document.createElement('div');
		div_lb.id='lightboxcontainer';
		div_lb.classList.add('f1-hide');
		div_lb.classList.add('f1-nopadding');
		const html=	''+
			'<div class="f1-lb-header">'+
				'<svg id="lbclose"  class="f1-icon-circled f1-lb-control f1-padding-10-20">'+
					'<use href="./feather-sprite-circled.svg#x"/>'+
				'</svg>'+
			'</div>'+
			'<div id="lightbox" class="f1-lb-background">'+
				'<img id="lbimg" src="" class="f1-lb-img"></img>'+
			'</div>'+
			'<div id="f1lbleftpanel" class="f1-lb-panel f1-lb-panel-left">'+
				'<svg id="f1lbfirst" class="f1-icon-circled-large f1-lb-control f1-hide f1-padding-0-30">'+
					'<use href="./feather-sprite-circled.svg#chevrons-left"/>'+
				'</svg>'+
				'<svg id="f1lbprev" class="f1-icon-circled-large f1-lb-control f1-hide f1-nopadding">'+
					'<use href="./feather-sprite-circled.svg#chevron-left"/>'+
				'</svg>'+
			'</div>'+
			'<div id="f1lbrightpanel" class="f1-lb-panel f1-lb-panel-right">'+
				'<svg id="f1lbnext" class="f1-icon-circled-large f1-lb-control f1-hide f1-nopadding">'+
					'<use href="./feather-sprite-circled.svg#chevron-right"/>'+
				'</svg>'+
				'<svg id="f1lblast" class="f1-icon-circled-large f1-lb-control f1-hide f1-padding-0-30">'+
					'<use href="./feather-sprite-circled.svg#chevrons-right"/>'+
				'</svg>'+
			'</div>';
		div_lb.innerHTML=html;
		document.body.prepend(div_lb);

		document.getElementById("f1lbleftpanel").addEventListener('click', function(e) {
			that.lbPrev();
			e.stopPropagation();
		});
		document.getElementById("f1lbrightpanel").addEventListener('click', function(e) {
			that.lbNext();
			e.stopPropagation();
		});
		document.getElementById("lbimg").addEventListener('click', function(e) {
			e.stopPropagation();
		});
		document.getElementById("f1lbfirst").addEventListener('click', function(e) {
			that.lbFirst();
			e.stopPropagation();
		});
		document.getElementById("f1lbnext").addEventListener('click', function(e) {
			that.lbNext();
			e.stopPropagation();
		});
		document.getElementById("f1lbprev").addEventListener('click', function(e) {
			that.lbPrev();
			e.stopPropagation();
		});
		document.getElementById("f1lblast").addEventListener('click', function(e) {
			that.lbLast();
			e.stopPropagation();
		});
		document.getElementById("lbclose").addEventListener('click', function(e) {
			that.lbClose();
		});
		[].forEach.call(document.querySelectorAll('.f1-lb-panel'), function(elt) {
			elt.addEventListener('mouseenter', function(evt) {
				document.getElementById("lbclose").classList.add("f1-lb-control-hovered");	
			});
			elt.addEventListener('mouseleave', function(evt) {
				document.getElementById("lbclose").classList.remove("f1-lb-control-hovered");	
			});
		});
		[].forEach.call(document.querySelectorAll('.f1-lb-background'), function(elt) {
			elt.addEventListener('click', function(evt) {
				that.lbClose();
			});
		});
	}
	lbMouseWheel(e) {
		// wheel up, we go to the previous image
		if (e.deltaY<0) {
			that.lbPrev();
		}
		// wheel up, we go to the next image
		else {
			that.lbNext();			
		}
		// to check that the event is removed in lbClose console.log(e);
	}
	// listener to the keydown event - and close the ligthbox on ESC
	lbCheckKeyboard(e) {
		if (e.which == 27) {
			that.lbClose();
		}
		else if (e.which == 39) {
			that.lbNext();
		}
		else if (e.which == 37) {
			that.lbPrev();			
		}
		else if (e.which == 40) {
			that.lbLast();			
		}
		else if (e.which == 38) {
			that.lbFirst();			
		}
	}
	lbOpen(img) {
		document.getElementById("lbimg").setAttribute("src", img.path);
		document.getElementById("lightboxcontainer").style.display="block";
		this.img=img
		window.addEventListener("wheel", this.lbMouseWheel);
		window.addEventListener('keydown', this.lbCheckKeyboard);
	}
	lbClose() {
		document.getElementById("lightboxcontainer").style.display="none";
		window.removeEventListener("wheel", this.lbMouseWheel);
		window.removeEventListener("keydown", this.lbCheckKeyboard);
	}
	lbFirst() {
		if (this.imgs_first !== null) {
			const elt=document.getElementById("lbimg");
			this.img=this.imgs_first;
			elt.setAttribute("src", this.img.path);
		}
	}
	lbNext() {
		if (this.img !== null) {
			if (this.img.next !== null) {
				const elt=document.getElementById("lbimg");
				this.img=this.img.next;
				elt.setAttribute("src", this.img.path);
			}
		}
	}
	lbPrev() {
		if (this.img !== null) {
			if (this.img.prev !== null) {
				const elt=document.getElementById("lbimg");
				this.img=this.img.prev;
				elt.setAttribute("src", this.img.path);
			}
		}
	}
	lbLast() {
		if (this.imgs_last !== null) {
			const elt=document.getElementById("lbimg");
			this.img=this.imgs_last;
			elt.setAttribute("src", this.img.path);
		}
	}
	// check one image, identified by its id or directly by passing the object
	checkImg(id, pimg=null) {
		let img=pimg;
		if (pimg === null) {
			img=this.imgs.get(id);
		}
		if (img !== undefined) {
			img.elt.classList.add('f1-img-grey');
			img.elt.previousSibling.classList.remove('f1-normal-hide');				
			img.checked=true;			
		}
	}
	// uncheck one image, identified by its id or directly by passing the object
	uncheckImg(id, pimg=null) {
		let img=pimg;
		if (pimg === null) {
			img=this.imgs.get(id);
		}
		if (img !== undefined) {
			img.elt.classList.remove('f1-img-grey');
			img.elt.previousSibling.classList.add('f1-normal-hide');
			img.checked=false;
		}
	}
	checkAll() {
		const that=this;
		if (this.checkable) {
			this.imgs.forEach( function (value){
				that.checkImg(0, value);
			});
		}
	}
	uncheckAll() {
		const that=this;
		this.imgs.forEach( function (value){
			that.uncheckImg(0, value);
		});
	}
}