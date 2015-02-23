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
var gl; // A global variable for the WebGL context


// shader stuff
var pointcloudShader, gridShader;
var grid;

var pointcloud = null;

var projMatrix;
var viewMatrix;

var camera = null;

var mouse = {button:[false, false, false], lastPosition:[0,0]};


var enableGrid = true;

function initWebGL(canvas) {
  gl = null;
  
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




function getShader(gl, id) {
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

function loadShaders() {
  
  // load the point cloud shader
  var fragmentShader = getShader(gl, "pointVS");
  var vertexShader = getShader(gl, "pointFS");

  pointcloudShader = gl.createProgram();
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
  
  
  
  // load the grid shader
  fragmentShader = getShader(gl, "gridVS");
  vertexShader = getShader(gl, "gridFS");
  
  gridShader = gl.createProgram();
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
  
  

}

function createGridBuffer(gl){

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

  grid = {buffer:gridVertexPositionBuffer, primType:gl.LINES};
  
}

function drawGrid() {
  
  gl.useProgram(gridShader);
  gl.enableVertexAttribArray(gridShader.vertexPositionAttribute);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, grid.buffer);
  gl.vertexAttribPointer(gridShader.vertexPositionAttribute, grid.buffer.itemSize, gl.FLOAT, false, 0, 0);
  
  gl.uniform3f(gridShader.colorUniform, 0.7, 0.7, 0.7);
  gl.uniformMatrix4fv(gridShader.projMatrixUniform, false, projMatrix);
  gl.uniformMatrix4fv(gridShader.viewMatrixUniform, false, viewMatrix);
  gl.drawArrays(gl.LINES, 0, grid.buffer.numItems);
}


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
  setProjectionMatrix(camera, projMatrix);
  setViewMatrix(camera, viewMatrix);
  

  if (enableGrid)
    drawGrid();
  
  
  if (pointcloud) {

    if (render.prevPointcloud != pointcloud) {
      render.prevPointcloud = pointcloud;

      //console.log(getCentroid(pointcloud.aabb));
      camera.target = getCentroid(pointcloud.aabb);
      vec3.add(camera.position, camera.position, camera.target);


      console.log("Setting camera target to " + camera.target)

    }

    drawPointcloud(gl, pointcloud, pointcloudShader);
    //drawAABB(pointcloud.aabb, gridShader);
  
  }
  
}


var lastTime = 0;

function tick() {
  var time = new Date().getTime();
  
  if (lastTime !== 0) {
    var dt = (time - lastTime) / 1000.0;

    updateCamera(camera, dt);


    if (mouse.down == false ) {

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
function loadBlob(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url);
  xhr.responseType = "blob";
  xhr.onload = function() {

    if (this.status == 200) {
      var myBlob = this.response;
      loadPoints2(gl, myBlob, 0);
    }
  }
  xhr.send(null);
}

// mouse callback functions follow .... 
function handleMouseDown(event) {
  event.preventDefault();

  mouse.button[event.button] = true;
  mouse.lastPosition = [event.clientX, event.clientY];


}

function handleMouseUp(event) {
  mouse.button[event.button] = false;
}

function handleMouseMotion(event) {
  var mousePosition = [event.clientX, event.clientY];

  var deltaX = (mousePosition[0] - mouse.lastPosition[0]) / canvas.clientWidth*Math.PI;
  var deltaY = (mousePosition[1] - mouse.lastPosition[1]) / canvas.clientHeight*Math.PI;
 
  // scale to -1..1
 // deltaY *= 180.0 / Math.PI;
  

  if (mouse.button[0]) {

    if (camera.mode == "orbit")
      rotateCameraAroundTarget(camera, deltaX, deltaY);
    else
      rotateCamera(camera, deltaX*5.0, deltaY*5.0);
  }

  else if (mouse.button[2]) {
    panCamera(camera, deltaX, -deltaY);


  }


  mouse.lastPosition = mousePosition;

}

function handleMouseWheel(event) {
  
  var delta = event.wheelDelta* 0.05;;
  //moveCameraToTarget(camera, delta);  

}


function handleKeydown(event) { 


  if (camera.mode == "fly") {


    // 'w'
    if (event.keyCode == 87)
      moveForwards(camera, -0.5);
    // 's'
    if (event.keyCode == 83)
      moveForwards(camera, 0.5);

    // 'a'
    if (event.keyCode == 65)
      moveRight(camera, 0.5);
    // 'd'
    if (event.keyCode == 68)
      moveRight(camera, -0.5);
  }

  // 'c'
  if (event.keyCode == 67) {
    if (camera.mode == "orbit")
      setCameraMode(camera, "fly");
    else
      setCameraMode(camera, "orbit")
  }

  // 'g'
  if (event.keyCode == 71)
    enableGrid = !enableGrid;
}

function handleKeyup(event) {

if (camera.mode == "fly") {

    // 'w'
    if (event.keyCode == 87 || event.keyCode == 83)
      moveForwards(camera, 0.0);

    // 'a'
    if (event.keyCode == 65 || event.keyCode == 68)
      moveRight(camera, 0.0);
  }


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

  projMatrix = mat4.create();
  viewMatrix = mat4.create();

  camera = createCamera();  
  camera.position[0] += 3.0;
  camera.position[2] += 3.0;

  loadShaders();
  createGridBuffer(gl);
  

  /*  
  var blob = createTestBlob(100);
  pointcloud = loadPoints(gl, blob, 100);
  
  */
  pointcloud = loadBlob('http://10.129.29.215:8000/shell2_medium.blob');

  //pointcloud = loadBlob('https://blogs.discovery.wisc.edu/public/demos/sandwich.webgl/sandwich2.blob');


 //loop();
  

}


function showBlob(blobAddress) {
  init();

  pointcloud = loadBlob(blobAddress);

  loop();
}
