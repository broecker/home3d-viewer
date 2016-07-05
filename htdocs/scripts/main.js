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


var arrow = null;

// store global variables
var global = global || {};

global.mouse = {button:[false, false, false], lastPosition:[0,0]};
global.touches = null;
global.shiftHeld = false;
global.ctrlHeld = false;

global.stats = null;

global.maxConcurrentLoads = 20;

// store shaders
var shaders = shaders || {};

// store what we want to render
var geometry = geometry || {};
geometry.grid = null;

window.mobilecheck = function() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
}

window.IE11check = function() { 
  return (!(window.ActiveXObject) && "ActiveXObject" in window);
}


function isMobile() {
    if (navigator.userAgent.match(/Android/i)
            || navigator.userAgent.match(/iPhone/i)
            || navigator.userAgent.match(/iPad/i)
            || navigator.userAgent.match(/iPod/i)
            || navigator.userAgent.match(/BlackBerry/i)
            || navigator.userAgent.match(/Windows Phone/i)
            || navigator.userAgent.match(/Opera Mini/i)
            || navigator.userAgent.match(/IEMobile/i)
            ) {
        return true;
    }
}

// initializes the canvas and webgl
function initWebGL(canvas) {  
  try {
    // Try to grab the standard context. If it fails, fallback to experimental.
    gl = canvas.getContext("webgl", {preserveDrawingBuffer : true}) || canvas.getContext("experimental-webgl", {preserveDrawingBuffer : true});
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;


  }
  catch(e) {
    console.error(e);
  }
  
  // If we don't have a GL context, give up now
  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
    gl = null;
  }
  
  return gl;
}

// resizes the canvas to fill the whole window
function resizeCanvas() {
  var width = canvas.clientWidth;
  var height = canvas.clientHeight;
  
  if (canvas.width != width || canvas.height != height) {

    // Change the size of the canvas to match the size being displayed
    canvas.width = width;
    canvas.height = height;

  } 

  gl.viewport(0, 0, width, height);
  renderer.resize([0, 0, width, height])

  //console.log("Resizing canvas to " + width + "x" + height);

}


function tick() {


  var time = new Date().getTime();
  
  if (tick.lastTime !== 0) {
    var dt = (time - tick.lastTime) / 1000.0;

  }
  tick.lastTime = time;
  
}

function loop() {
  global.stats.begin();

  tick();

  renderer.draw();
  renderer.drawRenderTarget(); 
 
  global.stats.end();

  window.requestAnimationFrame(loop, canvas);
  
    
} 


// mouse callback functions follow .... 
function handleMouseDown(event) {
  event.preventDefault();

  global.mouse.button[event.button] = true;
  global.mouse.lastPosition = [event.clientX, event.clientY];

  renderer.startCameraMove();
}

function handleMouseUp(event) {
  global.mouse.button[event.button] = false;
  renderer.stopCameraMove();

}

function handleMouseMotion(event) {
  var mousePosition = [event.clientX, event.clientY];

  var deltaX = (mousePosition[0] - global.mouse.lastPosition[0]) / canvas.clientWidth;
  var deltaY = (mousePosition[1] - global.mouse.lastPosition[1]) / canvas.clientHeight;
 
  // scale to -1..1
 // deltaY *= 180.0 / Math.PI;
  

  if (global.mouse.button[0]) {

    if (global.shiftHeld === true) 
      camera.pan(renderer.camera, deltaX*4.0, -deltaY*4.0);
    else if (global.ctrlHeld === true)
      camera.moveTowardsTarget(renderer.camera, deltaY*10);
    else
      camera.rotateAroundTarget(renderer.camera, deltaY*Math.PI, -deltaX*Math.PI);

    window.renderer.udpateVisibilityFlag = true;
  }

  else if (global.mouse.button[1]) {
    camera.moveTowardsTarget(renderer.camera, deltaY*10);
    window.renderer.udpateVisibilityFlag = true;
  }

  else if (global.mouse.button[2]) {
    camera.pan(renderer.camera, deltaX*4.0, -deltaY*4.0);
    window.renderer.udpateVisibilityFlag = true;
  }




  global.mouse.lastPosition = mousePosition;
}

function handleMouseWheel(event) {
  
  var delta = event.wheelDelta* 0.05;;
  camera.moveTowardsTarget(renderer.camera, delta);

  window.renderer.udpateVisibilityFlag = true;
}


// touch callback functions follow .... 
function handleTouchStart(event) {
  event.preventDefault();

  global.mouse.button[0] = true;
  var touch = event.targetTouches[0];

  global.touches = event.targetTouches;
  global.prevTouchDelta = undefined;
  global.prevTouchCenter = undefined;

  global.mouse.lastPosition = [canvas.clientWidth-touch.pageX, touch.pageY];
  renderer.startCameraMove();
}

function handleTouchEnd(event) {
  global.mouse.button[event.button] = false;

  global.touches = event.targetTouches;
  renderer.stopCameraMove();
    
}

function handleTouchMove(event) {


  // rotation
  if (event.targetTouches.length == 1) {

    var touch = event.targetTouches[0];

    var mousePosition = [canvas.clientWidth-touch.pageX, touch.pageY];

    var deltaX = (mousePosition[0] - global.mouse.lastPosition[0]) / canvas.clientWidth;
    var deltaY = (mousePosition[1] - global.mouse.lastPosition[1]) / canvas.clientHeight;
   
    // scale to -1..1
   // deltaY *= 180.0 / Math.PI;
    
    camera.rotateAroundTarget(renderer.camera, deltaY*Math.PI, deltaX*Math.PI);

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


    var center = [(center.maxx+center.minx)*0.5, (center.maxy+center.miny)*0.5];


    var mode = 'pan';
    if (delta > 100.0)
      mode = 'zoom';

    if (global.prevTouchCenter != undefined && mode === 'pan') {

      var move = [center[0] - global.prevTouchCenter[0], center[1] - global.prevTouchCenter[1]]; 
      move[0] *= 0.01;
      move[1] *= -0.01;


      camera.pan(renderer.camera, move[0], move[1]);


    }

    if (global.prevTouchDelta != undefined && mode === 'zoom') { 

      var factor = global.prevTouchDelta-delta;
      camera.moveTowardsTarget(renderer.camera, factor*0.01);
    }



    global.prevTouchCenter = center;
    global.prevTouchDelta = delta;

    

  }



  global.touches = event.targetTouches;
  global.mouse.lastPosition = mousePosition;
  window.renderer.udpateVisibilityFlag = true;
}


function increaseDetail() { 
  ++global.maxRecursion;
  renderer.udpateVisibilityFlag =  true;
}

function decreaseDetail() { 
  -- global.maxRecursion;
  if (global.maxRecursion < 0)
    global.maxRecursion = 0; 

  window.renderer.udpateVisibilityFlag = true;
}


function handleKeydown(event) { 

  // 'g'
  if (event.keyCode == 71)
    renderer.toggleGrid();

  // up
  if (event.keyCode == 38)
    panCamera(renderer.camera, 0, 0, -2.0);

  // down
  if (event.keyCode == 40) 
    panCamera(renderer.camera, 0, 0, 2.0);

  // left
  if (event.keyCode == 37)
    panCamera(renderer.camera, 2.0, 0, 0);

  // right
  if (event.keyCode == 39)
    panCamera(renderer.camera, -2, 0, 0);

  // page down
  if (event.keyCode == 34)
    panCamera(renderer.camera, 0, -2, 0);
  //page up
  if (event.keyCode == 33)
    panCamera(renderer.camera, 0, 2, 0);

  // 'c' - center camera
  if (event.keyCode == 67) {
    renderer.resetCamera();
  }

  // 'a' -- increase recursion level
  if (event.keyCode == 65) {
    increaseDetail();
  }

  // 'z' -- decrease recursion level
  if (event.keyCode == 90) {
    decreaseDetail();
  }

  // 'x' -- enable multisampling
  if (event.keyCode == 88)
    renderer.toggleFXAA();


  // b
  if (event.keyCode == 66)
    renderer.toggleBBoxes();


  // 'shift'
  if (event.keyCode == 16)
    global.shiftHeld = true;

  // 'ctrl'
  if (event.keyCode == 17) 
    global.ctrlHeld = true;
  
  // 'space bar'
  if (event.keyCode == 32)
    toggleAnimation();

  
}

function handleKeyup(event) {
  if (event.keyCode == 16)
    global.shiftHeld = false;

  // 'ctrl'
  if (event.keyCode == 17) 
    global.ctrlHeld = false;

}

function init(datapath, shaderpath) {
  canvas = document.getElementById("canvas");
  
  canvas.addEventListener("webglcontextlost", function(event) {
    event.preventDefault();

    console.error("WebGL context lost!");

  }, false);


  gl = initWebGL(canvas);      // Initialize the GL context
  resizeCanvas();

  // register mouse functions
  canvas.onmousedown = handleMouseDown;
  canvas.onmouseup = handleMouseUp;
  canvas.onmousemove = handleMouseMotion;
  canvas.onmousewheel = handleMouseWheel;
  document.addEventListener("keydown", handleKeydown, false);
  document.addEventListener("keyup", handleKeyup, false);

  
  canvas.addEventListener("touchstart", handleTouchStart, false);
  canvas.addEventListener("touchmove", handleTouchMove, false);
  canvas.addEventListener("touchend", handleTouchEnd, false);
  

  window.addEventListener("resize", resizeCanvas);


  // disables the right-click menu
  document.oncontextmenu = function() {
    return false;
  }

  

  shader.loadAll(shaders, shaderpath);

  geometry.createGridBuffer();

  // create FPS meter
  global.stats = new Stats();
  global.stats.setMode(0);
  global.stats.domElement.style.position = 'absolute';
  global.stats.domElement.style.right = '5px';
  global.stats.domElement.style.bottom = '5px';
  
  // disable the following line to disable drawing
  document.body.appendChild(global.stats.domElement);


  if (isMobile()) {

    global.maxPointsRendered = 50000;
    global.maxRecursion = 1;
    global.maxConcurrentLoads = 2;

  } else { 
    global.maxPointsRendered = 250000;
    global.maxRecursion = 2;
    global.maxConcurrentLoads = 8;

  }


  // initialize octree
  octree.initLoadQueue(global.maxConcurrentLoads);
  geometry.octree = octree.parseJSON(datapath);

  window.setInterval(octree.updateLoadQueue, 200);


  renderer.init();

  resizeCanvas();


  //geometry.loadJsonModel('data/arrow.json', 'arrow');

  // create trickle progress bar
  NProgress.start();

}

/// saves the current opengl canvas in an image and opens it in a new window 
function saveScreenShotInEditor() {
  var image = new Image();
  image.src = canvas.toDataURL("image/png");
   window.open(image.src);  
}


function saveCanvasToFile() {
  var filename = 'home3d_canvas_' + Date.now() + ".png";
  var canvas = document.getElementById('canvas');

  if (window.IE11check())
    window.navigator.msSaveBlob(canvas.msToBlob(), filename);
  else
    ReImg.fromCanvas(canvas).downloadPng(filename);
}

function getBasePath(address) { 
  var basepath = address.substring(0, address.lastIndexOf("/"));
  basepath = basepath.substring(0, basepath.lastIndexOf("/")+1);

  return basepath;
}

function main(datapath, shaderpath) {
  
  init(datapath, shaderpath);
  loop();
}