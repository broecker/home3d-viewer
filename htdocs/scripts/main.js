/*
The MIT License (MIT)

Copyright (c) 2015 Markus Broecker <broecker@wisc.edu>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/


var canvas;
var gl = null; // A global variable for the WebGL context


// store global variables
var global = global || {};
global.enableGrid = true;
global.enableBBox = false;

global.viewMatrix = mat4.create();
global.projMatrix = mat4.create();
global.updateVisibility = false;

global.camera = null;
global.mouse = {button:[false, false, false], lastPosition:[0,0]};
global.touches = null;


global.stats = null;


global.clearColor = [150, 150, 180];


global.octree = {}
global.octree.maxRecursion = 2;
global.maxPointsRendered = 750000;
global.pointsDrawn = 0;
global.pointSize = 2.0;
global.visibleList = [];

// store shaders
var shaders = shaders || {};

// store what we want to render
var geometry = geometry || {};
geometry.grid = null;
geometry.octree = null;


// initializes the canvas and webgl
function initWebGL(canvas) {  
  try {
    // Try to grab the standard context. If it fails, fallback to experimental.
    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
  }
  catch(e) {}
  
  // If we don't have a GL context, give up now
  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
    gl = null;
  }
  
  return gl;
}

// resizes the canvas to fill the whole window
function resizeCanvas(canvas) {
  // only change the size of the canvas if the size it's being displayed
  // has changed.
  var width = canvas.clientWidth;
  var height = canvas.clientHeight;
  
  if (canvas.width != width || canvas.height != height) {

    // Change the size of the canvas to match the size it's being displayed
    canvas.width = width;
    canvas.height = height;
  }  
}


// main render function 
function render() {
  
  // update the canvas, viewport and camera
  resizeCanvas(canvas);
  gl.viewport(0, 0, canvas.width, canvas.height);
  camera.aspect = canvas.clientWidth / canvas.clientHeight;


  gl.clearColor(global.clearColor[0]/255, global.clearColor[1]/255, global.clearColor[2]/255, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

  //  setup the camera matrices
  setProjectionMatrix(camera, global.projMatrix);
  setViewMatrix(camera, global.viewMatrix);
 

  // if needed, updated view-frustum culling and LOD information
  if (global.updateVisibility && geometry.octree) { 

    var mat = mat4.create();
    mat4.multiply(mat, global.projMatrix, global.viewMatrix);
  
    updateVisibility(geometry.octree, mat);
    updateLOD(geometry.octree, getPosition(global.camera));

 

    // build a new visible set
    global.visibleList.length = 0;
    getVisibleNodes(geometry.octree, global.visibleList);

    // sort by lod distance
    global.visibleList.sort(function(a,b){
      return a.lodDistance - b.lodDistance;
    });

    global.updateVisibility = false;
  }


  if (global.enableGrid)
    drawGrid();
  
  
  if (global.mouse.button[0] || global.mouse.button[2])
    drawCameraFocus(gl, shaders.objectShader, global.projMatrix, global.viewMatrix, camera);
  
  if (geometry.octree) { 

    if (global.enableBBox) {
      gl.useProgram(shaders.gridShader);
      gl.enableVertexAttribArray(shaders.gridShader.vertexPositionAttribute);

      gl.uniform3f(shaders.gridShader.colorUniform, 0.7, 0.7, 0.0);
      gl.uniformMatrix4fv(shaders.gridShader.projMatrixUniform, false, global.projMatrix);
      gl.uniformMatrix4fv(shaders.gridShader.viewMatrixUniform, false, global.viewMatrix);

      drawBBoxOctree(geometry.octree, shaders.gridShader);
    }

    // draw the points
    gl.useProgram(shaders.pointcloudShader);


    gl.uniform1f(shaders.pointcloudShader.pointSizeUniform, global.pointSize);
    
    gl.uniformMatrix4fv(shaders.pointcloudShader.projMatrixUniform, false, global.projMatrix);
    gl.uniformMatrix4fv(shaders.pointcloudShader.viewMatrixUniform, false, global.viewMatrix);


    global.pointsDrawn = 0;
    
    if (global.visibleList.length > 0) { 
      for (var i = 0; i < global.visibleList.length; ++i) { 
        drawOctree(global.visibleList[i], shaders.pointcloudShader, false);
      }
    }
    else
      drawOctree(geometry.octree, shaders.pointcloudShader);

  }

}


var lastTime = 0;

function tick() {
  var time = new Date().getTime();
  
  if (lastTime !== 0) {
    var dt = (time - lastTime) / 1000.0;

  }
  lastTime = time;
  
}

function loop() {
  global.stats.begin();

  tick();
  render();
 
  global.stats.end();

  window.requestAnimationFrame(loop);
    
} 


// mouse callback functions follow .... 
function handleMouseDown(event) {
  event.preventDefault();

  global.mouse.button[event.button] = true;
  global.mouse.lastPosition = [event.clientX, event.clientY];

}

function handleMouseUp(event) {
  global.mouse.button[event.button] = false;
}

function handleMouseMotion(event) {
  var mousePosition = [event.clientX, event.clientY];

  var deltaX = (mousePosition[0] - global.mouse.lastPosition[0]) / canvas.clientWidth;
  var deltaY = (mousePosition[1] - global.mouse.lastPosition[1]) / canvas.clientHeight;
 
  // scale to -1..1
 // deltaY *= 180.0 / Math.PI;
  

  if (global.mouse.button[0]) {
      rotateCameraAroundTarget(global.camera, deltaY*Math.PI, deltaX*Math.PI);
  }

  else if (global.mouse.button[1]) {
    moveCameraTowardsTarget(global.camera, deltaY*10);
  }

  else if (global.mouse.button[2]) {
    panCamera(global.camera, deltaX*4.0, -deltaY*4.0);


  }

  global.mouse.lastPosition = mousePosition;
  global.updateVisibility = true;
}

function handleMouseWheel(event) {
  
  var delta = event.wheelDelta* 0.05;;
  moveCameraTowardsTarget(global.camera, delta);

  global.updateVisibility = true;
}


// touch callback functions follow .... 
function handleTouchStart(event) {
  event.preventDefault();

  global.mouse.button[0] = true;
  var touch = event.targetTouches[0];

  global.touches = event.targetTouches;
  global.prevTouchDelta = undefined;

  global.mouse.lastPosition = [canvas.clientWidth-touch.pageX, touch.pageY];
 
}

function handleTouchEnd(event) {
  global.mouse.button[event.button] = false;

  global.touches = event.targetTouches;

  global.updateVisibility = true;
  
}

function handleTouchMove(event) {


  // panning
  if (event.targetTouches.length == 1) {

    var touch = event.targetTouches[0];


    var mousePosition = [canvas.clientWidth-touch.pageX, touch.pageY];


    var deltaX = (mousePosition[0] - global.mouse.lastPosition[0]) / canvas.clientWidth;
    var deltaY = (mousePosition[1] - global.mouse.lastPosition[1]) / canvas.clientHeight;
   
    // scale to -1..1
   // deltaY *= 180.0 / Math.PI;
    

    if (global.mouse.button[0]) {
        rotateCameraAroundTarget(global.camera, deltaY*Math.PI, deltaX*Math.PI);
    }

    else if (global.mouse.button[1]) {
      moveCameraTowardsTarget(global.camera, deltaY*10);
    }

    else if (global.mouse.button[2]) {
      panCamera(global.camera, deltaX*4.0, -deltaY*4.0);


    }
  } else {

    var center =  {minx:event.targetTouches[0].pageX, maxx:event.targetTouches[0].pageX, miny:event.targetTouches[0].pageY, maxy:event.targetTouches[0].pageY};
    for (var i = 1; i < event.targetTouches.length; ++i) {
      
      center.minx = Math.min(center.minx, event.targetTouches[i].pageX);
      center.maxx = Math.max(center.maxx, event.targetTouches[i].pageX);
      center.miny = Math.min(center.miny, event.targetTouches[i].pageY);
      center.maxy = Math.max(center.maxy, event.targetTouches[i].pageY);
    }

    var delta = [center.maxx-center.minx, center.maxy-center.miny];
    delta = Math.sqrt(delta[0]*delta[0] + delta[1]*delta[1]);


    if (global.prevTouchDelta != undefined) { 

      var factor = global.prevTouchDelta-delta;
      moveCameraTowardsTarget(global.camera, factor*0.01);


    }


    global.prevTouchDelta = delta;

    

  }





  global.touches = event.targetTouches;
  global.mouse.lastPosition = mousePosition;
  global.updateVisibility = true;
}



function handleKeydown(event) { 

  // 'g'
  if (event.keyCode == 71)
    global.enableGrid = !global.enableGrid;

  // up
  if (event.keyCode == 38)
    panCamera(global.camera, 0, 0, -2.0);

  // down
  if (event.keyCode == 40) 
    panCamera(global.camera, 0, 0, 2.0);

  // left
  if (event.keyCode == 37)
    panCamera(global.camera, 2.0, 0, 0);

  // right
  if (event.keyCode == 39)
    panCamera(global.camera, -2, 0, 0);

  // page down
  if (event.keyCode == 34)
    panCamera(global.camera, 0, -2, 0);
  //page up
  if (event.keyCode == 33)
    panCamera(global.camera, 0, 2, 0);

  // 'c' - center camera
  if (event.keyCode == 67) {
    camera.target = vec3.fromValues(0,0,0);

  }
  // b
  if (event.keyCode == 66)
    global.enableBBox = !global.enableBBox;

  global.updateVisibility = true;
}

function handleKeyup(event) {
}

function handlePan(event) { 
}


function init(basepath) {
  
    
  canvas = document.getElementById("canvas");
  gl = initWebGL(canvas);      // Initialize the GL context
  resizeCanvas(canvas);

  // register mouse functions
  canvas.onmousedown = handleMouseDown;
  document.onmouseup = handleMouseUp;
  document.onmousemove = handleMouseMotion;
  document.onmousewheel = handleMouseWheel;
  document.addEventListener("keydown", handleKeydown, false);
  document.addEventListener("keyup", handleKeyup, false);

  /*
  document.addEventListener("touchstart", handleTouchStart, false);
  document.addEventListener("touchmove", handleTouchMove, false);
  document.addEventListener("touchend", handleTouchEnd, false);
  */

  // disables the right-click menu
  document.oncontextmenu = function() {
    return false;
  }

  global.camera = createOrbitalCamera();
  global.camera.radius = 20.0;

  loadShaders(basepath + "shaders/");
  createGridBuffer();


  
  // create FPS meter
  global.stats = new Stats();
  global.stats.setMode(0);
  global.stats.domElement.style.position = 'absolute';
  global.stats.domElement.style.right = '5px';
  global.stats.domElement.style.bottom = '5px';
  document.body.appendChild(global.stats.domElement);
  

  global.updateVisibility = true;

  /*
  global.hammertime = new Hammer(myElement, myOptions);
  global.hammertime.on('pan', handlePan);
  
  */
  // create gui
  global.gui = new dat.GUI();  
  global.gui.add(global.octree, 'maxRecursion', 1.0).max(6).step(1);
  global.gui.add(global, 'pointSize', 1.0, 6.0);
  global.gui.add(global, 'maxPointsRendered', 0, 10000000);
  global.gui.add(global, 'pointsDrawn').listen();

 
}

function toggleGrid() { 
  global.enableGrid = !global.enableGrid;
}

function toggleBBox() { 
  global.enableBBox = !global.enableBBox;
}


function getBasePath(address) { 
  var basepath = address.substring(0, address.lastIndexOf("/"));
  basepath = basepath.substring(0, basepath.lastIndexOf("/")+1);

  return basepath;
}


function main(treeJson) {
  var basepath = getBasePath(treeJson);

  init(basepath);

  geometry.octree = parseOctree(treeJson);

  loop();
}