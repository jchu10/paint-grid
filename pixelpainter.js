/*jshint esversion: 6 */ 
// edited from https://eloquentjavascript.net/19_paint.html

// ART BOX SETTINGS
const PIXEL_SIZE = 40; //px
const NUM_ROWS = 8;
const NUM_COLS = 8;
const BOX_WIDTH = PIXEL_SIZE * NUM_COLS; //px
const BOX_HEIGHT = PIXEL_SIZE * NUM_ROWS; //pxpx

// get ready to draw
let dirtyIndices = [];
let penColour='#000000';
let eraserColor = "#FFFFFF";
let canvasData = new Array(NUM_ROWS*NUM_COLS).fill(eraserColor);

// define the picture class
class Picture {
	// each picture consists of width X height pixels
  constructor(width=NUM_COLS, height=NUM_ROWS, pixels) {
    this.width = width;
    this.height = height;
    this.pixels = pixels;
  }
	// initialize a picture with dimensions and color
  static empty(width=NUM_COLS, height=NUM_ROWS, color) {
    let pixels = new Array(width * height).fill(color);
    return new Picture(width, height, pixels);
  }
  // read pixel at location x,y
  pixel(x, y) {
    return this.pixels[x + y * this.width];
  }
  // draw pixels to locations and return updated picture
  draw(newpixels) {
    let copy = this.pixels.slice();
    for (let {x, y, color} of newpixels) {
      copy[x + y * this.width] = color;
    }
    return new Picture(this.width, this.height, copy);
  }
}

// define the canvas
class PictureCanvas {
  constructor(picture, pointerDown) {
    this.dom = elt("canvas", {
      onmousedown: event => this.mouse(event, pointerDown),
      ontouchstart: event => this.touch(event, pointerDown)
    });
    this.syncState(picture);
  }
  // keeps track of its current picture
  // and does a redraw only when syncState is given a new picture
  syncState(picture) {
    if (this.picture == picture) return;
    this.picture = picture;
    drawPicture(this.picture, this.dom, PIXEL_SIZE);
  }
}

// define tool selector
// class ToolSelect {
//   constructor(state, {tools, dispatch}) {
//     this.select = elt("select", {
//       onchange: () => dispatch({tool: this.select.value})
//     }, ...Object.keys(tools).map(name => elt("option", {
//       selected: name == state.tool
//     }, name)));
//     this.dom = elt("label", null, "Painter Tool: ", this.select);
//   }
//   syncState(state) { this.select.value = state.tool; }
// }

// define more restricted color selector
// define color palette selector
// <div class="ColorSelectPalette">
class ColorSelectPalette {
  constructor(state, {palette, dispatch}) {
    this.select = elt("select", {
      value: state.color,
      onclick: () => dispatch({color: this.input.value})
    });
    this.dom = elt("label", null, "Color: ", this.input);
  }
  syncState(state) { this.input.value = state.color; }
}


// define colorwheel selector
class ColorSelectWheel {
  constructor(state, {dispatch}) {
    this.input = elt("input", {
      type: "color",
      value: state.color,
      onchange: () => dispatch({color: this.input.value})
    });
    this.dom = elt("label", null, "Color: ", this.input);
  }
  syncState(state) { this.input.value = state.color; }
}

// **** KEY FUNCTIONALITIES ***********
// draw a picture by painting squares to canvas
function drawPicture(picture, canvas, PIXEL_SIZE) {
  canvas.width = picture.width * PIXEL_SIZE;
  canvas.height = picture.height * PIXEL_SIZE;
  let cx = canvas.getContext("2d");

  for (let y = 0; y < picture.height; y++) {
    for (let x = 0; x < picture.width; x++) {
      cx.fillStyle = picture.pixel(x, y);
      cx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
    }
  }
}

// draw pixels
function draw(pos, state, dispatch) {
  function drawPixel({x, y}, state) {
    let drawn = {x, y, color: state.color};
    dispatch({picture: state.picture.draw([drawn])});
  }
  drawPixel(pos, state);
  // drag and draw support
  return drawPixel;
}

// not used - draw rectangle
function rectangle(start, state, dispatch) {
  function drawRectangle(pos) {
    let xStart = Math.min(start.x, pos.x);
    let yStart = Math.min(start.y, pos.y);
    let xEnd = Math.max(start.x, pos.x);
    let yEnd = Math.max(start.y, pos.y);
    let drawn = [];
    for (let y = yStart; y <= yEnd; y++) {
      for (let x = xStart; x <= xEnd; x++) {
        drawn.push({x, y, color: state.color});
      }
    }
    dispatch({picture: state.picture.draw(drawn)});
  }
  drawRectangle(start);
  return drawRectangle;
}

// MOUSE INTERACTIONS
PictureCanvas.prototype.mouse = function(downEvent, onDown) {
  if (downEvent.button != 0) return;
  let pos = pointerPosition(downEvent, this.dom);
  let onMove = onDown(pos); // for mouse drags
  if (!onMove) return;
  let move = moveEvent => {
    if (moveEvent.buttons == 0) {
      this.dom.removeEventListener("mousemove", move);
    } else {
      let newPos = pointerPosition(moveEvent, this.dom);
      if (newPos.x == pos.x && newPos.y == pos.y) return;
      pos = newPos;
      onMove(newPos);
    }
  };
  this.dom.addEventListener("mousemove", move);
};

// TOUCHSCREEN INTERACTIONS
PictureCanvas.prototype.touch = function(startEvent,onDown) {
  let pos = pointerPosition(startEvent.touches[0], this.dom);
  let onMove = onDown(pos);
  startEvent.preventDefault();
  if (!onMove) return;
  let move = moveEvent => {
    let newPos = pointerPosition(moveEvent.touches[0],
                                 this.dom);
    if (newPos.x == pos.x && newPos.y == pos.y) return;
    pos = newPos;
    onMove(newPos);
  };
  let end = () => {
    this.dom.removeEventListener("touchmove", move);
    this.dom.removeEventListener("touchend", end);
  };
  this.dom.addEventListener("touchmove", move);
  this.dom.addEventListener("touchend", end);
};

// THE EDITOR COMPONENT
class PixelPainter {
	// tools (now just a pen, but could add filler)
	// controls for editor
	// available tools, controls, dispatch are provided in a config file
  constructor(state, config) {
    let {tools, palette, controls, dispatch} = config;
    // read application state
    this.state = state;
    // construct canvas, define current tool, and ready for moves if necessary
    this.canvas = new PictureCanvas(state.picture, pos => {
      let tool = tools[this.state.tool];
      let onMove = tool(pos, this.state, dispatch);
      if (onMove) return pos => onMove(pos, this.state);
    });
    // construct tracker for controls
    this.controls = controls.map(
      Control => new Control(state, config));
    this.dom = elt("div", {}, this.canvas.dom, elt("br"),
                   ...this.controls.reduce(
                     (a, c) => a.concat(" ", c.dom), []));
  }
  syncState(state) {
    this.state = state;
    this.canvas.syncState(state.picture);
    for (let ctrl of this.controls) ctrl.syncState(state);
  }
}

// **** HELPER FUNCTIONS ***************

// write properties of action to corresponding properties of state
function updateState(state, action) {
  return Object.assign({}, state, action);
}

// helper function to create DOM objects
function elt(type, props, ...children) {
  let dom = document.createElement(type);
  if (props) Object.assign(dom, props);
  for (let child of children) {
    if (typeof child != "string") dom.appendChild(child);
    else dom.appendChild(document.createTextNode(child));
  }
  return dom;
}

// return pointer position as picture grid coordinates
function pointerPosition(pos, domNode) {
  let rect = domNode.getBoundingClientRect();
  return {x: Math.floor((pos.clientX - rect.left) / scale),
          y: Math.floor((pos.clientY - rect.top) / scale)};
}






// Record artwork as array
function updateArt(artwork){


	return artwork;
}

// Convert current artwork to json file
function convertArtToJson(artwork) {
	console.log(canvasData)
	document.getElementById('ResultsText').value = JSON.stringify(artwork)
}

// Binds listeners to functions
function addListeners() {
    canvas.addEventListener('click', handleClick);
    button.addEventListener('click', convert);
}

// Initialize art editor.
function initEditor() {
    getCanvasAndContext();
    resetCanvas();
    addListeners();
}

// Start the program
window.onload = function() {
    initEditor();
    drawData();
}