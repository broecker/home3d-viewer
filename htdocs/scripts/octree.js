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

// loads the blob referenced by a tree node's file attribute and generates
// the vertex buffers.
function loadOctree(tree) {

	if (!tree.loaded) { 
		tree.loaded = 'ongoing';

		var xhr = new XMLHttpRequest();
		xhr.responseType = "blob";



		xhr.onload = function() {

			if (this.status == 200) {

				console.log('loaded blob ' + tree.file + '.blob');

				var blob = this.response;

				var reader = new FileReader();
				const littleEndian = true;

				console.assert(blob != undefined);


				const POINT_SIZE = 4*4;

				var pointCount = blob.size / POINT_SIZE;
				
				reader.readAsArrayBuffer(blob);
				reader.onload = function(e) {
				

					var buffer = reader.result;


					var points = new Float32Array(3*pointCount);
					var colors = new Uint8Array(3*pointCount);

					var dataView = new DataView(buffer, 0);

					for (i = 0; i < pointCount; ++i) {

						var index = i*POINT_SIZE;

						var x = dataView.getFloat32(index+0, littleEndian);
						var y = dataView.getFloat32(index+4, littleEndian);
						var z = dataView.getFloat32(index+8, littleEndian);

						var r = dataView.getUint8(index+12, littleEndian);
						var g = dataView.getUint8(index+13, littleEndian);
						var b = dataView.getUint8(index+14, littleEndian);
						var a = dataView.getUint8(index+15, littleEndian);


						points[i*3+0] = x;
						points[i*3+1] = y;
						points[i*3+2] = z;

						colors[i*3+0] = r;
						colors[i*3+1] = g;
						colors[i*3+2] = b;

					}

					tree.loaded = true;
		


					tree.pointBuffer = gl.createBuffer();
					gl.bindBuffer(gl.ARRAY_BUFFER, tree.pointBuffer);
					gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);

					tree.colorBuffer = gl.createBuffer();
					gl.bindBuffer(gl.ARRAY_BUFFER, tree.colorBuffer);
					gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
					tree.loaded = true;
					
				}
			

			}

		}


		xhr.open("GET", tree.file + ".blob");
		xhr.send();
	}


}



function drawOctree(tree, shader, maxRecursion) {

	if (tree.lodDistance < 10.0 || tree.parent == null) {

		if (tree.loaded == true && tree.points > 0) { 
			
			//debugger;

			gl.enableVertexAttribArray(shader.vertexPositionAttribute);
			gl.bindBuffer(gl.ARRAY_BUFFER, tree.pointBuffer);
			gl.vertexAttribPointer(shader.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

			gl.enableVertexAttribArray(shader.vertexColorAttribute);
			gl.bindBuffer(gl.ARRAY_BUFFER, tree.colorBuffer);
			gl.vertexAttribPointer(shader.vertexColorAttribute, 3, gl.UNSIGNED_BYTE, true, 0, 0);


			gl.drawArrays(gl.POINTS, 0, tree.points);


		} else {
			loadOctree( tree);
		} 
	}


	

	if (maxRecursion > 0) { 
		if (tree.children != null) { 
			for (var i = 0; i < 8; ++i) { 
				if (tree.children[i] != null && tree.children[i].visible > 0)
					drawOctree(tree.children[i], shader, maxRecursion-1);
			}

		}
	
	}
	
	
}


// sets a whole tree to be visible
function setVisible(tree) { 
	tree.visible = 2;
	
	if (tree.children != null) 
		for (var i = 0; i < 8; ++i)
			if (tree.children[i] != null)
				setVisible(tree.children[i]);

}

function updateVisibility(tree, matrix) { 

	tree.visible = clipBox(tree.bbox, matrix);

	if (tree.children != null) {
		for (var i = 0; i < tree.children.length; ++i) {
			if (tree.children[i] != null) {
				if (tree.visible == 1)
					updateVisibility(tree.children[i], matrix);
		
				
				// recursively set everything visible
				if (tree.visible == 2)
					setVisible(tree.children[i]);
				
			}
		}
	}
}

// updates the distance of tree nodes from the camera. 
function updateLOD(tree, cameraPosition) { 

	tree.lodDistance = vec3.distance(getCentroid(tree.bbox), cameraPosition);
	tree.lod = 10.0 / tree.lodDistance;

	if (tree.children != null)
		for (var i = 0; i < 8; ++i) { 
			if (tree.children[i] != null && tree.children[i].visible > 0) { 
				updateLOD(tree.children[i], cameraPosition);
			}
		}
}


// sets a whole tree to be invisible
function resetVisibility(tree) { 
	tree.visible = 0;

	if (tree.children != null) 
		for (var i = 0; i < tree.children.length; ++i)
			if (tree.children[i] != null)
				resetVisibility(tree.children[i]);

	//console.log("Resetting visibility for tree " + tree);
}


function drawBBoxOctree(tree, shader) {


	if (tree.visible == 0)
		gl.uniform3f(shader.colorUniform, 0.7, 0, 0);
	else if (tree.visible == 2)
		gl.uniform3f(shader.colorUniform, 0.0, 0.7, 0.0);
	else
		gl.uniform3f(shader.colorUniform, 0.7, 0.7, 0.0);

	drawAABB(tree.bbox, shader);

	if (tree.children)
		for (var i = 0; i < 8; ++i) 
			if (tree.children[i]) 
				drawBBoxOctree(tree.children[i], shader);

}

function drawOctreeBBoxes(tree, shader, matrix) { 

	if (matrix == undefined) { 
		matrix = mat4.create();
		mat4.multiply(matrix, global.projMatrix, global.viewMatrix);

	}

	drawAABB(tree.bbox, shader);


	if (tree.children != null) {
		for (var i = 0; i < tree.children.length; ++i) {
			if (tree.children[i] != null) 
				drawOctreeBBoxes( tree.children[i], shader, matrix );
		}
	}

}

function drawAndClipOctreeBBoxes(tree, shader, matrix) {

	if (matrix == undefined) { 
		matrix = mat4.create();
		mat4.multiply(matrix, global.projMatrix, global.viewMatrix);

	}

	


	var clip = clipBox(tree.bbox, matrix);

	if (clip == 0)
		gl.uniform3f(shader.colorUniform, 0.7, 0, 0);
	else if (clip == 2)
		gl.uniform3f(shader.colorUniform, 0.0, 0.7, 0.0);
	else
		gl.uniform3f(shader.colorUniform, 0.7, 0.7, 0.0);

	drawAABB(tree.bbox, shader);

	if (tree.children != null) {
		for (var i = 0; i < tree.children.length; ++i) {
			if (tree.children[i] != null) {
				if (clip == 1)
					drawAndClipOctreeBBoxes( tree.children[i], shader, matrix);
				else if (clip == 2)
					drawOctreeBBoxes( tree.children[i], shader, matrix );
			}
		}
	}
}


function parseOctree(jsonUrl) {
	

	var nodes = null;
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function () {
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {


			// remove all newline
			var tree = xmlhttp.response.replace(/(\r\n|\n|\r)/gm,"");
			
			nodes = JSON.parse(tree);
		
			/*
			for (var i = 0; i < nodes.length; ++i) {
				console.log("nodes " + i + ": " + nodes[i].file);
			}
			*/

			var relinkStart = performance.now();
			console.log("Read " + nodes.length + " nodes, relinking tree ... ");


			// create an associative container to speed up searching for nodes
			var nodeDict = {};
			for (var i = 0; i < nodes.length; ++i)
				nodeDict[nodes[i].file] = nodes[i];


			for (var i = 0; i < nodes.length; ++i) {
				var node = nodes[i];

				// check if it's not a leaf node
				if (node.children != null) {

					// relink all children that are not null to actual nodes
					for (var j = 0; j < 8; ++j) {
						if (node.children[j] != null && typeof node.children[j] == "string") {

							var n = nodeDict[node.children[j]];
							console.assert(n != undefined);
							node.children[j] = n;
							n.parent = node;
							
						}

					}	
				}

				// set loaded flag to false
				node.loaded = false;
				node.blob = null;
				node.pointBuffer = null;
				node.colorBuffer = null;

			}

			var relinkEnd = performance.now();
			console.log("Relink time: " + (relinkEnd-relinkStart) + " ms")

			// append the full path to all file names
			var basename = jsonUrl.substring(0, jsonUrl.lastIndexOf("/")+1);

			for (i = 0; i < nodes.length; ++i)
				nodes[i].file = basename + nodes[i].file;


			// find the root node
			var root = nodeDict["node-root"];
			console.log("Loaded tree.");


			// global 
			geometry.octree = root;


			// reset visibility
			resetVisibility(root);

			return root;
		}
	}

	xmlhttp.open("GET", jsonUrl, true)
	xmlhttp.send();
	
}

