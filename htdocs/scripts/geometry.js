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

var geometry = geometry || {};


// creates the geometry of a single plane
geometry.createPlaneBuffer = function() { 
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

	var plane = {vertexBuffer:planeVertexBuffer, normalBuffer:planeNormalBuffer, colorBuffer:planeColorBuffer, texcoordBuffer:planeTexCoords, primType:gl.TRIANGLE_STRIP};
	return plane;
}


// creates the geometry and vertex buffer for a grid on the Y=0 plane
geometry.createGridBuffer = function(){

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
geometry.drawGrid = function() {

	gl.useProgram(shaders.gridShader);
	gl.enableVertexAttribArray(shaders.gridShader.vertexPositionAttribute);

	gl.bindBuffer(gl.ARRAY_BUFFER, geometry.grid.buffer);
	gl.vertexAttribPointer(shaders.gridShader.vertexPositionAttribute, geometry.grid.buffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.uniform3f(shaders.gridShader.colorUniform, 0.7, 0.7, 0.7);
	gl.uniformMatrix4fv(shaders.gridShader.projMatrixUniform, false, global.projMatrix);
	gl.uniformMatrix4fv(shaders.gridShader.viewMatrixUniform, false, global.viewMatrix);
	gl.drawArrays(gl.LINES, 0, geometry.grid.buffer.numItems);
}


geometry.createAxisBuffer = function() {

	var axisVertices = [0,0,0, 10,0,0, 0,0,0, 0,10,0, 0,0,0, 0,0,10];
	var axisColors = [1,0,0, 1,0,0, 0,1,0, 0,1,0, 0,0,1, 0,0,1];
	var axisVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, axisVertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(axisVertices), gl.STATIC_DRAW);
	axisVertexPositionBuffer.itemSize = 3;
	axisVertexPositionBuffer.numItems = 18;

	var axisVertexColorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, axisVertexColorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(axisColor), gl.STATIC_DRAW);
	axisVertexColorBuffer.itemSize = 3;
	axisVertexColorBuffer.numItems = 18;

	geometry.axis = {vertexBuffer:axisVertexPositionBuffer, colorBuffer:axisVertexColorBuffer};
}

geometry.drawCoordinateAxis = function() {


}


geometry.drawFullscreenQuad = function(shader) {

	if (geometry.drawFullscreenQuad.vbo === undefined) {
		var vertices = [0,1, 0,0, 1,1, 1,0 ];

		geometry.drawFullscreenQuad.vbo = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, geometry.drawFullscreenQuad.vbo);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, geometry.drawFullscreenQuad.vbo);
	gl.enableVertexAttribArray(shader.vertexPositionAttribute);
	gl.vertexAttribPointer(shader.vertexPositionAttribute, 2, gl.FLOAT, false, 0, 0);

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

}


geometry.loadJsonModel = function(url, name) { 

	geometry.models = geometry.models || {};

	var nodes = null;

	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function () {
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {


			// remove all newline
			var data = xmlhttp.response.replace(/(\r\n|\n|\r)/gm,"");
			
			nodes = JSON.parse(data);
			console.log(nodes)


			var vertexPositionBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(nodes.vertexData), gl.STATIC_DRAW);
			vertexPositionBuffer.itemSize = 3;
			vertexPositionBuffer.numItems = nodes.vertexCount;

			var vertexNormalBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(nodes.normalData), gl.STATIC_DRAW);
			vertexNormalBuffer.itemSize = 3;
			vertexNormalBuffer.numItems = nodes.vertexCount;

			var modelIndexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modelIndexBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(nodes.faceData), gl.STATIC_DRAW);
			modelIndexBuffer.numTris = nodes.faceData.length

			var matrix = mat4.create();

			mat4.translate(matrix, matrix, [3.0, 0.0, 2.0]);

			var model = {transform:matrix, numTris:nodes.faceData.length, vertexBuffer:vertexPositionBuffer, normalBuffer:vertexNormalBuffer, indexBuffer:modelIndexBuffer};
		
			console.log(model);

			geometry.models[name] = model;
		
			console.log("saved model \"" + url + " \" in \"" + name + "\"")

		}
	}

	xmlhttp.open("GET", url, true)
	xmlhttp.send();

}


geometry.drawJsonModel = function(modelName, color) { 

	if (Object.keys(geometry.models).length == 0)
		return;

	var model = geometry.models[modelName];
	//console.log(model);

	if (model === undefined)
		return;


	
	var shader = shaders.objectShader;
	
	gl.useProgram(shader);

	// set the position
	gl.enableVertexAttribArray(shader.vertexPositionAttribute);
	gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
	gl.vertexAttribPointer(shader.vertexPositionAttribute, model.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

	// set the position
	gl.enableVertexAttribArray(shader.vertexNormalAttribute);
	gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
	gl.vertexAttribPointer(shader.vertexNormalAttribute, model.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);



	// set the uniforms
	gl.uniform3f(shader.colorUniform, color[0], color[1], color[2]);
	gl.uniformMatrix4fv(shader.projMatrixUniform, false, global.projMatrix);
	gl.uniformMatrix4fv(shader.viewMatrixUniform, false, global.viewMatrix);
	gl.uniformMatrix4fv(shader.transformUniform, false, model.transform);

	gl.uniform3f(shader.lightDirectionUniform, 2.0, 4.0, 1.0);

	// set the indices
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
	gl.drawElements(gl.TRIANGLES, model.numTris, gl.UNSIGNED_SHORT, 0);
	

}