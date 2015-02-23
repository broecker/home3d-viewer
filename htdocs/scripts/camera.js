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

function deg2rad(angle) {
  //  discuss at: http://phpjs.org/functions/deg2rad/
  // original by: Enrique Gonzalez
  // improved by: Thomas Grainger (http://graingert.co.uk)
  //   example 1: deg2rad(45);
  //   returns 1: 0.7853981633974483

	return angle * .017453292519943295; // (angle / 180) * Math.PI;
}

function rad2deg(angle) {
  //  discuss at: http://phpjs.org/functions/rad2deg/
  // original by: Enrique Gonzalez
  // improved by: Brett Zamir (http://brett-zamir.me)
  //   example 1: rad2deg(3.141592653589793);
  //   returns 1: 180

  return angle * 57.29577951308232; // angle / Math.PI * 180
}

function createCamera() {

	var pos = [5.0, 5.0, 2.0];
	var tgt = [0.0, 0.0, 0.0];
	var up = [0.0, 1.0, 0.0];

	// fovy has to be in radians
	var fov = 60.0 * Math.PI / 180.0;

	camera = {fovy:fov, aspect:1.3, near:0.1, far:100.0, position:pos, target:tgt, up:up, mode:"orbit", velocity:[0,0,0]};
	return camera;
}

// returns the polar coordinates of the camera in relation to its target
function getPolarCoordinates(camera) {
	angles = {theta:0.0, phi:0.0, radius:0.0};

	var delta = vec3.create();
	vec3.sub(delta, camera.position, camera.target);
	
	angles.radius = vec3.length(delta);
	vec3.scale(delta, delta, 1.0/angles.radius);

	angles.phi = Math.atan2(delta[1], delta[0]);
	angles.theta = Math.acos(delta[2]/angles.radius);


	return angles;
}

function clampAngles(sphericalCoords) {
	sphericalCoords.phi = Math.max( sphericalCoords.phi, deg2rad(-85));
	sphericalCoords.phi = Math.min( sphericalCoords.phi, deg2rad( 85));


	if (sphericalCoords.theta < 0)
		sphericalCoords.theta += (2*Math.PI);

	if (sphericalCoords.theta > 2*Math.PI)
		sphericalCoords.theta -= (2*Math.PI);

	return sphericalCoords;

}

/// pans the camera along the current pane
function panCamera(camera, deltaX, deltaY) {
	var forward = vec3.create();
	vec3.sub(forward, camera.position, camera.target);
	vec3.normalize(forward, forward);

	var right = vec3.create();
	vec3.cross(right, forward, camera.up)

	var up = vec3.create();
	vec3.cross(up, forward, right);

	vec3.scale(up, up, deltaY);
	vec3.scale(right, right, deltaX);

	moveCamera(camera, up);
	moveCamera(camera, right);
}

function moveCamera(camera, delta) { 
	vec3.add(camera.position, camera.position, delta);
	vec3.add(camera.target, camera.target, delta);
}


function rotateCameraAroundTarget(camera, deltaTheta, deltaPhi) {
	
	if (typeof camera.angles == 'undefined') {
		camera.angles = getPolarCoordinates(camera);
		console.print("Creating camera angles:" + camera.angles);
	}

	//console.log("pc: " + rad2deg(angles.theta) + " d" + rad2deg(deltaTheta));

	camera.angles.theta -= deltaTheta;
	camera.angles.phi += deltaPhi;
	
	clampAngles(camera.angles);

	//console.log("new theta: " + rad2deg(angles.theta));

	//console.log(angles.phi, deltaPhi);

	// set new coordinates
	var delta = [0,0,0];
	delta[0] = camera.angles.radius * Math.sin(camera.angles.theta)*Math.cos(camera.angles.phi);
	delta[1] = camera.angles.radius * Math.sin(camera.angles.theta)*Math.sin(camera.angles.phi);
	delta[2] = camera.angles.radius * Math.cos(camera.angles.theta);

	vec3.add(camera.position, camera.target, delta);
}


function rotateCamera(camera, deltaTheta, deltaPhi) {
	// rotate target point (== view location) around camera position


	var up = [0,1,0];
	var fwd = vec3.create();
	vec3.sub(fwd, camera.target, camera.position);
	vec3.normalize(fwd, fwd);

	var rgt = vec3.create();
	vec3.cross(rgt, fwd, up);

	vec3.scale(rgt, rgt, deltaTheta);
	vec3.scale(up, up, deltaPhi);

	vec3.add(camera.target, camera.target, up);
	vec3.add(camera.target, camera.target, rgt);

}



function moveCameraToTarget(camera, deltaDistance) {
	const MIN_DISTANCE = 0.1;
	const MAX_DISTANCE = 100.0;

	var delta = vec3.create();
	vec3.sub(delta, camera.position, camera.target);

	var distance = vec3.length(delta);
	vec3.normalize(delta, delta);

	distance += deltaDistance;
	distance = Math.max(distance, MIN_DISTANCE);
	distance = Math.min(distance, MAX_DISTANCE);

	vec3.scale(delta, delta, distance);
	vec3.add(camera.position, delta, camera.target);
}


function setProjectionMatrix(camera, projMatrix) {

  	mat4.identity(projMatrix);
  	mat4.perspective(projMatrix, camera.fovy, camera.aspect, camera.near,camera.far);
}

function setViewMatrix(camera, viewMatrix) {
	mat4.identity(viewMatrix);
	mat4.lookAt(viewMatrix, camera.position, camera.target, camera.up);
	return viewMatrix;
}

function moveForwards(camera, amount) {
	var delta = vec3.create(); 
	vec3.sub(delta, camera.position, camera.target);
	vec3.normalize(delta, delta);
	vec3.scale(delta, delta,  amount);


	moveCamera(camera, delta);
	vec3.add(camera.velocity, camera.velocity, delta);
}

function moveRight(camera, amount) {
	var delta = vec3.create();
	vec3.sub(delta, camera.position, camera.target);
	vec3.normalize(delta, delta);
	
	var up = [0,1,0];
	var right = vec3.create();
	vec3.cross(right, delta, up);

	vec3.scale(right, right,  amount);

	moveCamera(camera, right);
	vec3.add(camera.velocity, camera.velocity, right);
}


function setCameraMode(camera, mode) {
	camera.mode = mode;

	if (mode == "orbit") {
		camera.velocity = [0,0,0];
	}
	else {
		camera.angles = undefined;
	}

	console.log("Set camera mode to " + camera.mode);

}


function updateCamera(camera, dt) {
	if (camera.mode == "orbit")
 		return;


 	const MAX_SPEED = 10.0;


 	var speed = vec3.length(camera.velocity);
 	speed = Math.max(speed, -MAX_SPEED);
 	speed = Math.min(speed,  MAX_SPEED);

 	if (speed < Math.abs(0.1)) {
 		speed = 0;
 		return;
 	}


 	// let speed decay over time
 	speed *= Math.pow(0.075, dt);
 	vec3.normalize(camera.velocity, camera.velocity);
 	vec3.scale(camera.velocity, camera.velocity, speed);

 	var v = vec3.clone(camera.velocity);
 	vec3.scale(v, v, dt);

 	moveCamera(camera, v);

}
