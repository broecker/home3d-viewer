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


var octree = octree || {}
octree._loadQueue = [];

// adds a tree to the load queue. It will be loaded concurrently at the next time
octree._loadQueueAdd = function (tree) {

	if (octree._loadQueue.indexOf(tree) > -1) {
		/*
		console.error("Tree  " + tree.file + " already exists in load queue!");
		debugger;
		*/
		return;
	}

	tree.loaded = 'in queue';
	octree._loadQueue.push(tree);
}

// updates the loading queue, removes old items and makes sure new ones get loaded
// Gets automatically called as soon as a node finishes loading.
octree._loadQueueUpdate = function() { 

	/*
	if (global.camera.isMoving === true)
		return;
	*/

	var queue = octree._loadQueue;
	var i;

	// remove all nodes already loaded or not visible anymore
	for (i = queue.length-1; i >= 0; --i) { 
		if (queue[i].loaded === true || queue.visible === 0 || queue[i].depth > global.maxRecursion) { 
			queue.splice(i, 1);
		}

	}


	// start loading all nodes in the queue
	for (i = 0; i < Math.min(global.maxConcurrentLoads, queue.length); ++i) { 
		if (queue[i].loaded == 'in queue') {
			octree.loadBlob(queue[i]);
			NProgress.set(0.5);
			NProgress.inc();
		}
	}


	if (queue.length == 0) { 
		NProgress.done();
	}


}


// loads an octree by putting it onto the loading queue
octree.load = function(tree) {

	if (tree.loaded === false) { 
		octree._loadQueueAdd(tree);
		octree._loadQueueUpdate();	
	}

	/*
	// update
	if (octree.load._updateTimer === undefined) { 
		octree.load._updateTimer = setInterval(octree._loadQueueUpdate, 250);
	}
	*/
}


// loads the blob referenced by a tree node's file attribute and generates
// the vertex buffers.
octree.loadBlob = function(tree) {

	if (tree.loaded == 'ongoing' || tree.loaded === true)
		return;


	tree.loaded = 'ongoing';

	var xhr = new XMLHttpRequest();
	//console.log(xhr);
	



	xhr.onload = function() {

		if (this.status == 200) {

			//console.log('loaded blob ' + tree.file + '.blob');

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

				// deferred loading
				tree.deferredData = {points:points, colors:colors};
				tree.loaded = true;
				octree._loadQueueUpdate();
			}
		

		}

	}


	xhr.open("GET", tree.file + ".blob");
	xhr.responseType = "blob";
	xhr.send();



}


octree.drawNode = function(tree, shader) {
	if (tree.deferredData) { 
		tree.pointBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, tree.pointBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, tree.deferredData.points, gl.STATIC_DRAW);

		tree.colorBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, tree.colorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, tree.deferredData.colors, gl.STATIC_DRAW);

		tree.deferredData = null;
	}




	gl.enableVertexAttribArray(shader.vertexPositionAttribute);
	gl.bindBuffer(gl.ARRAY_BUFFER, tree.pointBuffer);
	gl.vertexAttribPointer(shader.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

	gl.enableVertexAttribArray(shader.vertexColorAttribute);
	gl.bindBuffer(gl.ARRAY_BUFFER, tree.colorBuffer);
	gl.vertexAttribPointer(shader.vertexColorAttribute, 3, gl.UNSIGNED_BYTE, true, 0, 0);


	gl.drawArrays(gl.POINTS, 0, tree.points);
	global.pointsDrawn += tree.points;
}


// draws an octree recursivlely
octree.draw = function(tree, shader, recurse) {

	if (tree.depth > global.octree.maxRecursion)
		return;

	if (global.pointsDrawn > global.maxPointsRendered)
		return;

	// shall we recurse automatically?
	recurse = recurse || true;

	if (tree.visible > 0 && tree.loaded === true) { 
		drawOctreeNode(tree, shader);
	} else if (tree.loaded === false) {

		if (!global.updateVisibility)
			octree.load(tree);
	}

	if (recurse === true && tree.children != null) { 

		for (var i = 0; i < tree.children.length; ++i) { 
			if (tree.children[i].visible > 0)
				octree.draw(tree.children[i], shader);
		}

	}

	
}


// sets a whole tree to be visible
octree.setVisible = function(tree) { 
	tree.visible = 2;
	
	if (tree.children != null) 
		for (var i = 0; i < tree.children.length; ++i)
			octree.setVisible(tree.children[i]);

}

// sets a whole tree to be invisible
octree.setInvisible = function(tree) { 
	tree.visible = 0;

	if (tree.children != null) 
		for (var i = 0; i < tree.children.length; ++i)
			octree.setInvisible(tree.children[i]);
}

// performs view-frustum culling recursively on the tree
octree.updateVisibility = function(tree, matrix) { 
	tree.visible = clipBox(tree.bbox, matrix);


	if (tree.children != null && tree.depth < global.maxRecursion) {

		for (var i = 0; i < tree.children.length; ++i) {
			// clipping -- test children individually
			if (tree.visible == 1)
				octree.updateVisibility(tree.children[i], matrix);
	
			
			// recursively set everything visible
			if (tree.visible == 2)
				octree.setVisible(tree.children[i]);
			
		}

	}
}

octree.updateScreenArea = function(tree, matrix, resolution) { 
	calculateScreenspaceBounds(tree.bbox, matrix);
    tree.screenArea = calculateScreenspaceArea(tree.bbox, resolution);
}


// returns a list of all visible nodes. Must be run after updateOctreeVisibility
octree.getVisibleNodes = function(tree, list) { 

	if (tree.visible > 0) {
		list.push(tree);

		if (tree.children != null && tree.depth < global.maxRecursion) { 
			for (var i = 0; i < tree.children.length; ++i) { 
				octree.getVisibleNodes(tree.children[i], list);
			}

		}

	}
}

// updates the distance of tree nodes from the camera. 
octree.updateLOD = function(tree, cameraPosition) { 


	tree.lodDistance = vec3.distance(getCentroid(tree.bbox), cameraPosition);
	//tree.lodDistance = vec3.dot(getCentroid(tree.bbox), cameraPosition);
	const MAX_LOD_DISTANCE = 50000;

	if (tree.children != null) {
		for (var i = 0; i < tree.children.length; ++i) { 
			if (tree.children[i].visible > 0) { 
				octree.updateLOD(tree.children[i], cameraPosition);
			}
			else
				tree.children[i].lodDistance = MAX_LOD_DISTANCE;
		}
	}
}


octree.drawBBoxes = function(tree, shader) {


	if (tree.visible == 0)
		gl.uniform3f(shader.colorUniform, 0.7, 0, 0);
	else if (tree.visible == 2)
		gl.uniform3f(shader.colorUniform, 0.0, 0.7, 0.0);
	else
		gl.uniform3f(shader.colorUniform, 0.7, 0.7, 0.0);

	drawAABB(tree.bbox, shader);

	if (tree.children != null && tree.depth < global.maxRecursion)
		for (var i = 0; i < tree.children.length; ++i) 
			octree.drawBBoxes(tree.children[i], shader);

}


// draws the screen-space bounds of the octree
octree.drawBboxBounds = function(tree, shader) { 
	if (tree.visible > 0) {

		if (tree.screenArea)
			gl.uniform1f(shader.areaUniform, tree.screenArea);

		gl.uniform1f(shader.pointsUniform, tree.points);

		drawScreenspaceBounds(tree.bbox, shader);

		if (tree.children != null && tree.depth < global.maxRecursion) { 
			for (var i = 0; i < tree.children.length; ++i)
				octree.drawBboxBounds(tree.children[i], shader);
		}


	}


}

octree.parseJSON = function(jsonUrl) {
	

	var nodes = null;
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function () {
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {


			// remove all newline
			var tree = xmlhttp.response.replace(/(\r\n|\n|\r)/gm,"");
			
			nodes = JSON.parse(tree);
		

			//var relinkStart = 	performance.now();
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



				// calculate the point densities on the x,y and z planes
				var area = calculateAABBAreas(node.bbox);
				node.pointDensity = [0, 0, 0];

				var pointsPerSide = Math.pow(node.points, 0.333);

				node.pointDensity[0] = pointsPerSide / area[0];
				node.pointDensity[1] = pointsPerSide / area[1];
				node.pointDensity[2] = pointsPerSide / area[2];
				

				// set loaded flag to false
				node.loaded = false;
				node.pointBuffer = null;
				node.colorBuffer = null;
				node.depth = octree.getDepth(node);

			}

			/*
			var relinkEnd = performance.now();
			console.log("Relink time: " + (relinkEnd-relinkStart) + " ms")
			*/
			// append the full path to all file names
			var basename = jsonUrl.substring(0, jsonUrl.lastIndexOf("/")+1);

			for (i = 0; i < nodes.length; ++i)
				nodes[i].file = basename + nodes[i].file;


			// find the root node
			var root = nodeDict["node-root"];
			console.log("Loaded tree.");

			root.numNodes = nodes.length;

			// load the root node
			octree.load(root);

			// global 
			geometry.octree = root;

			// reset visibility
			octree.setInvisible(root);

			global.updateVisibility = true;

			return root;
		}
	}

	xmlhttp.open("GET", jsonUrl, true)
	xmlhttp.send();
	
}

// returns the depth of a node in the tree
octree.getDepth = function(tree) { 

	if (tree.depth != undefined)
		return tree.depth;
	else {

		if (tree.parent === null)
			return 0;
		else 
			return 1 + octree.getDepth(tree.parent);
	}
}
