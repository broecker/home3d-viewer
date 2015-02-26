
function findOctree(nodes, name) {
	var result = nodes.filter(function(obj) {
		return obj.file == name;
	})[0];

	return result;
}

function loadOctree(node) {
	if (node.loaded)
		return;



}

function drawOctree(tree, shader, matrix) {

	if (matrix == undefined) { 
		matrix = mat4.create();
		mat4.multiply(matrix, projMatrix, viewMatrix);

	}

	


	var clip = clipBox(tree.bbox, matrix);

	if (clip == 0)
		gl.uniform3f(gridShader.colorUniform, 0.7, 0, 0);
	else if (clip == 1)
		gl.uniform3f(gridShader.colorUniform, 0.0, 0.7, 0.0);
	else
		gl.uniform3f(gridShader.colorUniform, 0.7, 0.7, 0.0);

	drawAABB(tree.bbox, shader);

	if (tree.children != null) {
		for (var i = 0; i < tree.children.length; ++i) {
			if (tree.children[i] != null) 
				drawOctree( tree.children[i], shader, matrix );
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

			console.log("Read " + nodes.length + " nodes, relinking tree ... ");

			for (var i = 0; i < nodes.length; ++i) {
				var node = nodes[i];

				// check if it's not a leaf node
				if (node.children != null) {

					// relink all children that are not null to actual nodes
					for (var j = 0; j < 8; ++j) {
						if (node.children[j] != null && typeof node.children[j] == "string") {

							//console.log("looking for child " + j + ": " + node.children[j]);
							var n = findOctree(nodes, node.children[j]);

							console.assert(n != undefined);
							node.children[j] = n;
							n.parent = node;
							
						}

					}	
				}

				// set loaded flag to false
				node.loaded = false;

			}



			// append the full path to all file names
			var basename = jsonUrl.substring(0, jsonUrl.lastIndexOf("/")+1);

			for (i = 0; i < nodes.length; ++i)
				nodes[i].file = basename + nodes[i].file;


			// find the root node
			var root = findOctree(nodes, basename+"node-root");
			console.log("Loaded tree.");



			// global 
			octree = root;

			// always load the root node
			loadOctree(root);
		}
	}

	xmlhttp.open("GET", jsonUrl, true)
	xmlhttp.send();
	
}

