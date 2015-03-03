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
global.enableBBox = true;

global.viewMatrix = mat4.create();
global.projMatrix = mat4.create();

global.camera = null;
global.mouse = {button:[false, false, false], lastPosition:[0,0]};


// store shaders
var shaders = shaders || {};

// store what we want to render
var geometry = geometry || {};
geometry.grid = null;
geometry.pointcloud = null;
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



// loads a shader with the given id from the DOM
function getShader(id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

// loads all shaders in the DOM
function loadShaders() {
  
  // load the point cloud shader
  var fragmentShader = getShader("pointVS");
  var vertexShader = getShader("pointFS");

  var pointcloudShader = gl.createProgram();
  gl.attachShader(pointcloudShader, vertexShader);
  gl.attachShader(pointcloudShader, fragmentShader);
  gl.linkProgram(pointcloudShader);

  if (!gl.getProgramParameter(pointcloudShader, gl.LINK_STATUS)) {
      alert("Could not initialize point cloud shader");
  }
  
  pointcloudShader.vertexPositionAttribute = gl.getAttribLocation(pointcloudShader, "positionIn");
  pointcloudShader.vertexColorAttribute = gl.getAttribLocation(pointcloudShader, "colorIn");
  pointcloudShader.projMatrixUniform = gl.getUniformLocation(pointcloudShader, "projMatrix");
  pointcloudShader.viewMatrixUniform = gl.getUniformLocation(pointcloudShader, "viewMatrix");
  pointcloudShader.modelMatrixUniform = gl.getUniformLocation(pointcloudShader, "modelMatrix");
  shaders.pointcloudShader = pointcloudShader;

  
  // load the grid shader
  fragmentShader = getShader("gridVS");
  vertexShader = getShader("gridFS");
  
  var gridShader = gl.createProgram();
  gl.attachShader(gridShader, vertexShader);
  gl.attachShader(gridShader, fragmentShader);
  gl.linkProgram(gridShader);
  
  if (!gl.getProgramParameter(gridShader, gl.LINK_STATUS)) {
      alert("Could not initialize grid shader");
  }
  
  gridShader.vertexPositionAttribute = gl.getAttribLocation(gridShader, "positionIn");
  gridShader.projMatrixUniform = gl.getUniformLocation(gridShader, "projMatrix");
  gridShader.viewMatrixUniform = gl.getUniformLocation(gridShader, "viewMatrix");
  gridShader.colorUniform = gl.getUniformLocation(gridShader, "color");
  shaders.gridShader = gridShader;
  

  // load the object shader
  fragmentShader = getShader("objectVS");
  vertexShader = getShader("objectFS");

  var objectShader = gl.createProgram();
  gl.attachShader(objectShader, vertexShader);
  gl.attachShader(objectShader, fragmentShader);
  gl.linkProgram(objectShader);
  
  if (!gl.getProgramParameter(objectShader, gl.LINK_STATUS)) {
      alert("Could not initialize grid shader");
  }
  
  objectShader.vertexPositionAttribute = gl.getAttribLocation(objectShader, "positionIn");
  objectShader.vertexColorAttribute = gl.getAttribLocation(objectShader, "colorIn");
  objectShader.projMatrixUniform = gl.getUniformLocation(objectShader, "projMatrix");
  objectShader.viewMatrixUniform = gl.getUniformLocation(objectShader, "viewMatrix");
  shaders.objectShader = objectShader;
}

// creates the geometry of a single plane
function createPlaneBuffer(gl) { 
  var planeVertices = [-20, 0, -20, -20, 0, 20, 20, 0, -20, 20, 0, 20];
  var planeNormals = [0,1,0, 0,1,0, 0,1,0, 0,1,0 ];
  var planeColors = [0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8 ];
  var planeTexCoords = [0,1, 0,0, 1,1, 1,0];

  var planeVertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, planeVertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(planeVertices), gl.STATIC_DRAW);
  planeVertexBuffer.itemSize = 3;
  planeVertexBuffer.numItems = 12;

  var planeNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, planeNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(planeNormals), gl.STATIC_DRAW);
  planeNormalBuffer.itemSize = 3;
  planeNormalBuffer.numItems = 12;

  var planeColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, planeColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(planeColors), gl.STATIC_DRAW);
  planeColorBuffer.itemSize = 3;
  planeColorBuffer.numItems = 12;

  var planeTCBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, planeTCBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(planeTexCoords), gl.STATIC_DRAW);
  planeTCBuffer.itemSize = 2;
  planeTCBuffer.numItems = 8;

  plane =  {vertexBuffer:planeVertexBuffer, normalBuffer:planeNormalBuffer, colorBuffer:planeColorBuffer, texcoordBuffer:planeTexCoords, primType:gl.TRIANGLE_STRIP};

}

// creates the geometry and vertex buffer for a grid on the Y=0 plane
function createGridBuffer(){

  var gridVertices = [];
  for (var i = -10; i <= 10; ++i) {
    gridVertices.push(i);
    gridVertices.push(0);
    gridVertices.push(-10);
    
    gridVertices.push(i);
    gridVertices.push(0);
    gridVertices.push(10);
  
    gridVertices.push(-10);
    gridVertices.push(0);
    gridVertices.push(i);
    
    gridVertices.push(10);
    gridVertices.push(0);
    gridVertices.push(i);
  }
  
  var gridVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, gridVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gridVertices), gl.STATIC_DRAW);
  gridVertexPositionBuffer.itemSize = 3;
  gridVertexPositionBuffer.numItems = 84;

  geometry.grid = {buffer:gridVertexPositionBuffer, primType:gl.LINES};
  
}

// draws the grid
function drawGrid() {
  
  gl.useProgram(shaders.gridShader);
  gl.enableVertexAttribArray(shaders.gridShader.vertexPositionAttribute);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, geometry.grid.buffer);
  gl.vertexAttribPointer(shaders.gridShader.vertexPositionAttribute, geometry.grid.buffer.itemSize, gl.FLOAT, false, 0, 0);
  
  gl.uniform3f(shaders.gridShader.colorUniform, 0.7, 0.7, 0.7);
  gl.uniformMatrix4fv(shaders.gridShader.projMatrixUniform, false, global.projMatrix);
  gl.uniformMatrix4fv(shaders.gridShader.viewMatrixUniform, false, global.viewMatrix);
  gl.drawArrays(gl.LINES, 0, geometry.grid.buffer.numItems);
}


// main render function 
function render() {
  
  // update the canvas, viewport and camera
  resizeCanvas(canvas);
  gl.viewport(0, 0, canvas.width, canvas.height);
  camera.aspect = canvas.clientWidth / canvas.clientHeight;


  gl.clearColor(0.0, 0.0, 0.1, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

  //  setup the camera matrices
  setProjectionMatrix(camera, global.projMatrix);
  setViewMatrix(camera, global.viewMatrix);
  

  if (global.enableGrid)
    drawGrid();
  
  
  if (global.mouse.button[0] || global.mouse.button[2])
    drawCameraFocus(gl, shaders.objectShader, global.projMatrix, global.viewMatrix, camera);
  
  if (geometry.pointcloud) {

    drawPointcloud(gl, geometry.pointcloud, shaders.pointcloudShader);

    if (global.enableBBox)
      drawAABB(pointcloud.aabb, shaders.gridShader);
  
  }
  
  if (geometry.octree && global.enableBBox) { 

    gl.useProgram(gridShader);
    gl.enableVertexAttribArray(gridShader.vertexPositionAttribute);

    gl.uniform3f(gridShader.colorUniform, 0.7, 0.7, 0.0);
    gl.uniformMatrix4fv(gridShader.projMatrixUniform, false, projMatrix);
    gl.uniformMatrix4fv(gridShader.viewMatrixUniform, false, viewMatrix);

    drawAndClipOctree(geometry.octree, shaders.gridShader);
  }


}


var lastTime = 0;

function tick() {
  var time = new Date().getTime();
  
  if (lastTime !== 0) {
    var dt = (time - lastTime) / 1000.0;

    if (global.mouse.down == false ) {

      // animate the camera here
      var speed = 0.0;
      //rotateCameraAroundTarget(camera, dt*speed, 0.0);
   

    }

  }
  lastTime = time;
  
}

function loop() {
  
  window.requestAnimationFrame(loop);
  
  tick();
  render();
}


// loads a blob from an address and displays it
function loadBlob(url) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url);
  xhr.responseType = "blob";

  xhr.onload = function() {

    if (this.status == 200) {
      var myBlob = this.response;
      pointcloud = createPointcloudFromBlob(gl, myBlob, 0, 'on ground');
    
      if (pointcloud != undefined)
        camera.target = getCentroid(pointcloud.aabb);
  
    }
  }


  xhr.send(null);
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

}

function handleMouseWheel(event) {
  
  var delta = event.wheelDelta* 0.05;;
  moveCameraTowardsTarget(global.camera, delta);
}


function handleKeydown(event) { 

  // 'g'
  if (event.keyCode == 71)
    global.enableGrid = !global.enableGrid;
}

function handleKeyup(event) {
}



function init() {
  
    
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
  
  // disables the right-click menu
  document.oncontextmenu = function() {
    return false;
  }

  global.camera = createOrbitalCamera();

  loadShaders();
  createGridBuffer();
  

  /*  
  var blob = createTestBlob(100);
  pointcloud = loadPoints(gl, blob, 100);
  
  */
  //pointcloud = loadBlob('http://10.129.29.215:8000/shell2_medium.blob');


 //loop();
  

}

function toggleGrid() { 
  global.enableGrid = !global.enableGrid;
}

function toggleBBox() { 
  global.enableBBox = !global.enableBBox;
}


function showBlob(blobAddress) {
  init();

  geometry.pointcloud = loadBlob(blobAddress);
 

  loop();
}


function showOctree(treeJson) {
  init();

  geometry.octree = parseOctree(treeJson);

  loop();
}