/*jshint esversion: 6 */ 

// The application state consists of:
// * current drawing
// * pen color (default black)
// * eraser color (default white)

// BOARD SETTINGS
const PIXEL_SIZE = 40; // px
const NUM_ROWS = 8;
const NUM_COLS = 8;
const BOARD_WIDTH = PIXEL_SIZE * NUM_COLS; //px
const BOARD_HEIGHT = PIXEL_SIZE * NUM_ROWS; //pxpx
const eraserColor = "#FFFFFF";

// get ready to draw
var penColour='#000000';
var palette_div = null;
var board = null;
var column = null;
var sq = null;
var boardData = Array(BOARD_WIDTH*BOARD_HEIGHT).fill(eraserColor);

// create empty art box canvas
  function setGridSize(gridSize){
    document.documentElement.style
    .setProperty('--grid-size', BOARD_WIDTH);
  }

// update pen color
  function setPenColour(pen)
  {
    penColour = pen;
    console.log("Pen Color: "+penColour);
  }

// update pixel color
  function setPixelColour(pixel, color=null,log=true)
  {
    if (color) {pixel.style.backgroundColor = color;}
      else {pixel.style.backgroundColor = penColour;}
    if (log) {
      console.log("Paint " + pixel.id);
    }
  }

// reset board
function resetBoard(){
  console.log("Resetting board");
  var pixels= board.getElementsByClassName('pixel');
  for (var i=0; i < pixels.length; i++) {
    setPixelColour(pixels[i], eraserColor, log=false);
 }
  console.log("Board is reset. Resetting pen color.");
  setPenColour('#000000');
}



// draw empty art box for painting on
function drawBoard() {
  // create a new div element
  // and give it some content
  board = document.createElement("div");
  board.setAttribute('class', 'board');
  var gridWidthStr = "width: " +PIXEL_SIZE*NUM_COLS +"px";
  board.setAttribute('style', gridWidthStr);
  console.log("set board size");

  var row=0,id;
  var idx= 1;
  for(col=0;col<NUM_COLS;col++) {
    column = document.createElement("div");
    column.setAttribute('id', 'column' + (col+1));  
    column.setAttribute('class', 'column');

    for(row=0; row<NUM_ROWS; row++) {
      sq = document.createElement("div");
      sq.setAttribute('id', "sq" + idx);  
      sq.setAttribute('class', 'pixel');
      // make clickable
      sq.setAttribute('onclick', 'setPixelColour(this)');
      idx++;
      column.appendChild(sq);
    }

    board.appendChild(column);

  }
  // add the newly created element and it's content into the DOM
  palette_div = document.getElementById("palette");
  container.insertBefore(board, palette_div);
  console.log("Board created");
}