/*
The MIT License (MIT)

Copyright (c) 2016 Markus Broecker <broecker@wisc.edu>

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


var markers = markers || []


markers.load = function(url) { 
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function () {
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {


			// remove all newline
			var data = xmlhttp.response.replace(/(\r\n|\n|\r)/gm,"");
			
			var nodes = JSON.parse(data);
			
			// nodes is an array of marker entries
			nodes.forEach(function(currentValue, index, array) {

					var m = {}
					m.name = currentValue.name;
					
					m.color = currentValue.color;
					if (m.color === undefined)
						m.color = [0.8, 0.6, 0.2]
									

					m.transform = mat4.create();
					mat4.translate(m.transform, m.transform, currentValue.location);

					var scale = currentValue.scale;
					if (scale === undefined)
						scale = 1.0;

					mat4.scale(m.transform, m.transform, [scale, scale, scale])

					markers.push(m);
			});

			console.log("Loaded the following markers:");
			markers.forEach(function(cv, idx, arr) {
				console.log(cv);

			});

		}
	}

	xmlhttp.open("GET", url, true)
	xmlhttp.send();

}

markers.draw = function() {

	if (Object.keys(geometry.models).length == 0) {
		console.log("No geometry models loaded.");
		return;
	}

	var model = geometry.models['arrow'];
	if (model === undefined) {
		console.log("Arrow model undefined.");
		return;
	}


	
	var shader = shaders.objectShader;
	if (shader === undefined) {
		console.log("Object shader undefined").
		return;
	}

	gl.enable(gl.CULL_FACE);


	gl.useProgram(shader);

	// set the position
	gl.enableVertexAttribArray(shader.vertexPositionAttribute);
	gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
	gl.vertexAttribPointer(shader.vertexPositionAttribute, model.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

	// set the position
	gl.enableVertexAttribArray(shader.vertexNormalAttribute);
	gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
	gl.vertexAttribPointer(shader.vertexNormalAttribute, model.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

	// set the indices
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);


	// set the uniforms
	gl.uniformMatrix4fv(shader.projMatrixUniform, false, global.projMatrix);
	gl.uniformMatrix4fv(shader.viewMatrixUniform, false, global.viewMatrix);
	gl.uniform3f(shader.lightDirectionUniform, 1.0, 5.0, 1.0);


	// draw all models
	markers.forEach(function(currentValue, index, array) {
		gl.uniform3f(shader.colorUniform, currentValue.color[0], currentValue.color[1], currentValue.color[2]);
		gl.uniformMatrix4fv(shader.transformUniform, false, currentValue.transform);
		gl.drawElements(gl.TRIANGLES, model.numTris, gl.UNSIGNED_SHORT, 0);


	});



}