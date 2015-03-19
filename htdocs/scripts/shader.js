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


function loadShaderFile(file, shader) { 
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url);

	if(xhr.overrideMimeType){
		xhr.overrideMimeType("text/plain");
	}


	xhr.onload = function() {

		if (this.status == 200) {
			var str = this.responseText;

			gl.shaderSource(shader, str);
			gl.compileShader(shader);

			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
				alert(gl.getShaderInfoLog(shader));
			}

		}
	}


	xhr.send(null);
}



// loads all shaders in the DOM
function loadShaders(basePath) {

	// load the point cloud shader

	var fragmentShader = getShader("pointVS");
	var vertexShader = getShader("pointFS");

	/*
	var fragmentShader = loadShader(basePath + "/points.vert");
	var vertexShader = loadShader(basePath + "/points.frag");
	*/
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
	pointcloudShader.lodUniform = gl.getUniformLocation(pointcloudShader, "lodLevel");
	pointcloudShader.pointSizeUniform = gl.getUniformLocation(pointcloudShader, "pointSize");
	pointcloudShader.minPointSizeUniform = gl.getUniformLocation(pointcloudShader, "minPointSize");
	shaders.pointcloudShader = pointcloudShader;


	// load the grid shader

	fragmentShader = getShader("gridVS");
	vertexShader = getShader("gridFS");

	/*
	fragmentShader = loadShader(basePath + "/grid.vert");
	vertexShader = loadShader(basePath + "/grid.frag");
	*/
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
	/*/
	fragmentShader = loadShader(basePath + "/object.vert");
	vertexShader = loadShader(basePath + "/object.frag");
	*/

	var objectShader = gl.createProgram();
	gl.attachShader(objectShader, vertexShader);
	gl.attachShader(objectShader, fragmentShader);
	gl.linkProgram(objectShader);

	if (!gl.getProgramParameter(objectShader, gl.LINK_STATUS)) {
		alert("Could not initialize object shader");
	}

	objectShader.vertexPositionAttribute = gl.getAttribLocation(objectShader, "positionIn");
	objectShader.vertexColorAttribute = gl.getAttribLocation(objectShader, "colorIn");
	objectShader.projMatrixUniform = gl.getUniformLocation(objectShader, "projMatrix");
	objectShader.viewMatrixUniform = gl.getUniformLocation(objectShader, "viewMatrix");
	shaders.objectShader = objectShader;



	// load the passthrough/quad shader
	fragmentShader = getShader("quadFS");
	vertexShader = getShader("quadVS");

	var quadShader = gl.createProgram();
	gl.attachShader(quadShader, vertexShader);
	gl.attachShader(quadShader, fragmentShader);
	gl.linkProgram(quadShader);

	if (!gl.getProgramParameter(quadShader, gl.LINK_STATUS)) {
		alert("Could not initialize quad shader");
	}

	quadShader.vertexPositionAttribute = gl.getAttribLocation(quadShader, "positionIn");
	quadShader.colormapUniform = gl.getUniformLocation(quadShader, "colormap");
	shaders.quadShader = quadShader;

}
