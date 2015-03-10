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



// Fisher-Yates shuffle
// see: http://bost.ocks.org/mike/shuffle/
function shuffle(array) {
	var m = array.length, t, i;

	// While there remain elements to shuffle…
	while (m) {

		// Pick a remaining element…
		i = Math.floor(Math.random() * m--);

		// And swap it with the current element.
		t = array[m];
		array[m] = array[i];
		array[i] = t;
	}

	return array;
}


// adds a tree to the load queue. It will be loaded concurrently at the next time
function loadQueueAdd(tree) {
	loadQueueAdd.queue = loadQueueAdd.queue || [];

	if (loadQueueAdd.queue.indexOf(tree) > -1) {
		/*
		console.error("Tree  " + tree.file + " already exists in load queue!");
		debugger;
		*/
		return;
	}

	tree.loaded = 'in queue';
	loadQueueAdd.queue.push(tree);
}

// updates the loading queue, removes old items and makes sure new ones get loaded
// Gets automatically called as soon as a node finishes loading.
function loadQueueUpdate() { 
	var queue = loadQueueAdd.queue;
	var i;

	// remove all nodes already loaded or not visible anymore
	for (i = queue.length-1; i >= 0; --i) { 
		if (queue[i].loaded === true || queue.visible === 0) { 
			queue.splice(i, 1);
		}

	}

	const MAX_CONCURRENT_LOADS = 15;

	// start loading all nodes in the queue
	for (i = 0; i < Math.min(MAX_CONCURRENT_LOADS, queue.length); ++i) { 
		if (queue[i].loaded == 'in queue') {
			loadOctreeBlob(queue[i]);
		}
	}


}


// loads an octree by putting it onto the loading queue
function loadOctree(tree) { 
	loadQueueAdd(tree);
	loadQueueUpdate();
}


// loads the blob referenced by a tree node's file attribute and generates
// the vertex buffers.
function loadOctreeBlob(tree) {

	if (tree.loaded == 'ongoing' || tree.loaded === true)
		return;


	tree.loaded = 'ongoing';

	var xhr = new XMLHttpRequest();
	//console.log(xhr);
	



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

				tree.pointBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, tree.pointBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);

				tree.colorBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, tree.colorBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
				tree.loaded = true;


				loadQueueUpdate();
				
			}
		

		}

	}


	xhr.open("GET", tree.file + ".blob");
	xhr.responseType = "blob";
	xhr.send();



}


function drawOctree(tree, shader, recurse) {

	if (tree.depth > global.octree.maxRecursion)
		return;

	if (global.pointsDrawn > global.maxPointsRendered)
		return;

	// shall we recurse automatically?
	recurse = recurse || true;

	if (tree.visible > 0 && tree.loaded === true) { 
		gl.enableVertexAttribArray(shader.vertexPositionAttribute);
		gl.bindBuffer(gl.ARRAY_BUFFER, tree.pointBuffer);
		gl.vertexAttribPointer(shader.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

		gl.enableVertexAttribArray(shader.vertexColorAttribute);
		gl.bindBuffer(gl.ARRAY_BUFFER, tree.colorBuffer);
		gl.vertexAttribPointer(shader.vertexColorAttribute, 3, gl.UNSIGNED_BYTE, true, 0, 0);


		gl.drawArrays(gl.POINTS, 0, tree.points);
		global.pointsDrawn += tree.points;

	} else if (tree.loaded === false) {

		if (!global.updateVisibility)
			loadOctree(tree);
	}

	if (recurse === true && tree.children != null) { 

		for (var i = 0; i < tree.children.length; ++i) { 
			if (tree.children[i].visible > 0)
				drawOctree(tree.children[i], shader);
		}

	}

	
}


// sets a whole tree to be visible
function setVisible(tree) { 
	tree.visible = 2;
	
	if (tree.children != null) 
		for (var i = 0; i < tree.children.length; ++i)
			setVisible(tree.children[i]);

}

// sets a whole tree to be invisible
function setInvisible(tree) { 
	tree.visible = 0;

	if (tree.children != null) 
		for (var i = 0; i < tree.children.length; ++i)
			setInvisible(tree.children[i]);
}

// performs view-frustum culling recursively on the tre
function updateVisibility(tree, matrix) { 

	setInvisible(tree);

	tree.visible = clipBox(tree.bbox, matrix);

	if (tree.children != null && tree.depth < global.octree.maxRecursion) {

		for (var i = 0; i < tree.children.length; ++i) {
			// clipping -- test children individually
			if (tree.visible == 1)
				updateVisibility(tree.children[i], matrix);
	
			
			// recursively set everything visible
			if (tree.visible == 2)
				setVisible(tree.children[i]);
			
		}

	}
}

// returns a list of all visible nodes. Must be run after updateVisibility
function getVisibleNodes(tree, list) { 

	if (tree.visible > 0) {
		list.push(tree);

		if (tree.children != null) { 
			for (var i = 0; i < tree.children.length; ++i) { 
				getVisibleNodes(tree.children[i], list);
			}

		}

	}
}

// updates the distance of tree nodes from the camera. 
function updateLOD(tree, cameraPosition) { 

	tree.lodDistance = vec3.distance(getCentroid(tree.bbox), cameraPosition);
	const MAX_LOD_DISTANCE = 50000;

	if (tree.children != null)
		for (var i = 0; i < tree.children.length; ++i) { 
			if (tree.children[i].visible > 0) { 
				updateLOD(tree.children[i], cameraPosition);
			}
			else
				tree.children[i].lodDistance = MAX_LOD_DISTANCE;

			// sort the children based on their lod distance
			tree.children.sort(function(a, b) { 
				return a.lodDistance - b.lodDistance;
			});

		}
}



function drawBBoxOctree(tree, shader) {


	if (tree.visible == 0)
		gl.uniform3f(shader.colorUniform, 0.7, 0, 0);
	else if (tree.visible == 2)
		gl.uniform3f(shader.colorUniform, 0.0, 0.7, 0.0);
	else
		gl.uniform3f(shader.colorUniform, 0.7, 0.7, 0.0);

	drawAABB(tree.bbox, shader);

	if (tree.children && tree.depth < global.octree.maxRecursion)
		for (var i = 0; i < tree.children.length; ++i) 
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
			drawOctreeBBoxes( tree.children[i], shader, matrix );
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


					// remove all empty children
					for (var j = 7; j >= 0; --j) { 
						if (node.children[j] === null)
							node.children.splice(j, 1);
					}

					// randomize the child order
					shuffle(node.children);


				}

				// set loaded flag to false
				node.loaded = false;
				node.blob = null;
				node.pointBuffer = null;
				node.colorBuffer = null;
				node.depth = getDepth(node);

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

			root.numNodes = nodes.length;

			// load the root node
			loadOctree(root);

			// global 
			geometry.octree = root;

			// reset visibility
			setInvisible(root);

			return root;
		}
	}

	xmlhttp.open("GET", jsonUrl, true)
	xmlhttp.send();
	
}

function getDepth(tree) { 
	if (tree.parent === null)
		return 0;
	else 
		return 1 + getDepth(tree.parent);
}
