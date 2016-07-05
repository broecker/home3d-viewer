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


var camera = camera || {};

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

camera.drawFocus = function(camera, shader, projMatrix, viewMatrix) {
	var i, a, x, z;

	if (camera.drawFocus.centerWidget === undefined) {
		var centerColors = [];
		var centerVertices = []

		for (i = 0; i <= 36; ++i) {
			a = deg2rad(i*10);
			x = Math.sin(a);
			z = Math.cos(a);

			centerVertices.push(x, 0, z);
			centerColors.push(0, 255, 0);
		}

		var circleBuffer0 = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, circleBuffer0);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(centerVertices), gl.STATIC_DRAW);
		circleBuffer0.itemSize = 3;
		circleBuffer0.numItems = 37;

		var colorBuffer0 = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer0);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(centerColors), gl.STATIC_DRAW);
		colorBuffer0.itemSize = 3;
		colorBuffer0.numItems = 37;


		centerVertices = [];
		centerColors = [];

		for (i = 0; i <= 36; ++i) {
			a = deg2rad(i*10);
			x = Math.sin(a);
			y = Math.cos(a);

			centerVertices.push(x, y, 0);
			centerColors.push(0, 0, 255);
		}

		var circleBuffer1 = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, circleBuffer1);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(centerVertices), gl.STATIC_DRAW);
		circleBuffer1.itemSize = 3;
		circleBuffer1.numItems = 37;

		var colorBuffer1 = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer1);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(centerColors), gl.STATIC_DRAW);
		colorBuffer1.itemSize = 3;
		colorBuffer1.numItems = 37;


		centerVertices = [];
		centerColors = [];

		for (i = 0; i <= 36; ++i) {
			a = deg2rad(i*10);
			y = Math.sin(a);
			z = Math.cos(a);

			centerVertices.push(0, y, z);
			centerColors.push(255, 0, 0);
		}

		var circleBuffer2 = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, circleBuffer2);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(centerVertices), gl.STATIC_DRAW);
		circleBuffer2.itemSize = 3;
		circleBuffer2.numItems = 37;

		var colorBuffer2 = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer2);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(centerColors), gl.STATIC_DRAW);
		colorBuffer2.itemSize = 3;
		colorBuffer2.numItems = 37;


		camera.drawFocus.centerWidget = { vertexBuffer: [circleBuffer0, circleBuffer1, circleBuffer2], colorBuffer: [colorBuffer0, colorBuffer1, colorBuffer2], primType:gl.LINES };
		console.log("Created new camera widget, " + camera.drawFocus.centerWidget);
	}


	var modelViewMatrix = mat4.create();
	mat4.translate(modelViewMatrix, modelViewMatrix, camera.target);
	mat4.multiply(modelViewMatrix, viewMatrix, modelViewMatrix);


  	gl.useProgram(shader);
	gl.uniformMatrix4fv(shader.projMatrixUniform, false, projMatrix);
  	gl.uniformMatrix4fv(shader.viewMatrixUniform, false, modelViewMatrix);

  	gl.enableVertexAttribArray(shader.vertexPositionAttribute);
  	gl.enableVertexAttribArray(shader.vertexColorAttribute);

  	for (i = 0; i < 3; ++i) {
	  	gl.bindBuffer(gl.ARRAY_BUFFER, camera.drawFocus.centerWidget.vertexBuffer[i]);
	  	gl.vertexAttribPointer(shader.vertexPositionAttribute, camera.drawFocus.centerWidget.vertexBuffer[i].itemSize, gl.FLOAT, false, 0, 0);
	  	gl.bindBuffer(gl.ARRAY_BUFFER, camera.drawFocus.centerWidget.colorBuffer[i]);
	  	gl.vertexAttribPointer(shader.vertexColorAttribute, camera.drawFocus.centerWidget.colorBuffer[i].itemSize, gl.FLOAT, false, 0, 0);
	  	gl.drawArrays(gl.LINE_LOOP, 0, camera.drawFocus.centerWidget.vertexBuffer[i].numItems);
	}
  	
}


camera.createOrbitalCamera = function() {
	var tgt = [0.0, 0.0, 0.0];
	var up = [0.0, 1.0, 0.0];
	var fov = 60.0 * Math.PI / 180.0;

	var theta = deg2rad(22)
	var phi = deg2rad(10);
	var radius = 5.0;

	return {fovy:fov, aspect:1.3, near:0.1, far:100.0, target:tgt, up:up, theta:theta, phi:phi, radius:radius};
}

// calculates the camera's position from its angles and target
camera.getPosition = function(camera) { 
	var pos = vec3.create();
	pos[0] = camera.target[0] + camera.radius * Math.sin(camera.theta)*Math.sin(camera.phi);
	pos[2] = camera.target[2] + camera.radius * Math.sin(camera.theta)*Math.cos(camera.phi);
	pos[1] = camera.target[1] + camera.radius * Math.cos(camera.theta);

	return pos;
}


function clampAngles(sphericalCoords) {
	sphericalCoords.theta = Math.max( sphericalCoords.theta, deg2rad(1));
	sphericalCoords.theta = Math.min( sphericalCoords.theta, deg2rad(179));

	return sphericalCoords;

}

/// pans the camera along the current pane
camera.pan = function(cam, deltaX, deltaY, deltaZ) {
	var forward = vec3.create();
	vec3.sub(forward, camera.getPosition(cam), cam.target);
	vec3.normalize(forward, forward);

	var right = vec3.create();
	vec3.cross(right, forward, cam.up)
	vec3.normalize(right, right);

	var up = vec3.create();
	vec3.cross(up, forward, right);

	vec3.scale(up, up, deltaY );
	vec3.scale(right, right, deltaX );

	vec3.add(cam.target, cam.target, up);
	vec3.add(cam.target, cam.target, right); 

	if (deltaZ != undefined) { 
		vec3.scale(forward, forward, deltaZ);
		vec3.add(cam.target, cam.target, forward);
	}

}


camera.rotateAroundTarget = function(camera, deltaTheta, deltaPhi) {

	camera.theta -= deltaTheta;
	camera.phi += deltaPhi;
	
	clampAngles(camera);
}

camera.moveTowardsTarget = function(camera, delta) { 
	camera.radius += delta;

	camera.radius = Math.max(0.2, camera.radius);
	camera.radius = Math.min(100, camera.radius);

	//console.log("camera.radius:" + camera.radius);

}

camera.retrieveProjectionMatrix = function(cam, projMatrix) {
  	mat4.identity(projMatrix);
  	mat4.perspective(projMatrix, cam.fovy, cam.aspect, cam.near,cam.far);
}

camera.retrieveViewMatrix = function(cam, viewMatrix) {
	mat4.identity(viewMatrix);
	mat4.lookAt(viewMatrix, camera.getPosition(cam), cam.target, cam.up);
}
