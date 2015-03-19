
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

	plane = {vertexBuffer:planeVertexBuffer, normalBuffer:planeNormalBuffer, colorBuffer:planeColorBuffer, texcoordBuffer:planeTexCoords, primType:gl.TRIANGLE_STRIP};

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



function drawFullscreenQuad(shader) {
	if (drawFullscreenQuad.vbo === undefined) {
		var vertices = [0,1, 0,0, 1,1, 1,0 ];

		drawFullscreenQuad.vbo = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, drawFullscreenQuad.vbo);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, drawFullscreenQuad.vbo);
	gl.vertexAttribPointer(shader.vertexPositionAttribute, 2, gl.FLOAT, false, 0, 0);

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

}