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


function loadOctree(tree) { 
}


function drawOctree(tree, shader, matrix) { 

	if (matrix == undefined) { 
		matrix = mat4.create();
		mat4.multiply(matrix, global.projMatrix, global.viewMatrix);

	}

	drawAABB(tree.bbox, shader);

	if (tree.children != null) {
		for (var i = 0; i < tree.children.length; ++i) {
			if (tree.children[i] != null) 
				drawOctree( tree.children[i], shader, matrix );
		}
	}

}

function drawAndClipOctree(tree, shader, matrix) {

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
					drawAndClipOctree( tree.children[i], shader, matrix);
				else if (clip == 2)
					drawOctree( tree.children[i], shader, matrix );
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

			// always load the root node
			loadOctree(root);

			return root;
		}
	}

	xmlhttp.open("GET", jsonUrl, true)
	xmlhttp.send();
	
}

