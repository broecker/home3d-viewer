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

var metadata = metadata || {};

metadata.load = function(jsonUrl) {

	metadata.items = [];
	metadata.alignmentMatrix = mat4.create();

	// parse json file here
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function () {
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {

			// remove all newline
			var items = xmlhttp.response.replace(/(\r\n|\n|\r)/gm,"");

			metadata.items = JSON.parse(items);

			//console.log(metadata.items);

			// parse the data
			for (var i in metadata.items) {

				// create oriented bounding boxes
				var bbox = obb.create();
				bbox.position = metadata.items[i].bbox_position;
				bbox.halfBounds = metadata.items[i].bbox_scale;
				bbox.xAxis = metadata.items[i].bbox_axis_x;
				bbox.yAxis = metadata.items[i].bbox_axis_y;
				bbox.zAxis = metadata.items[i].bbox_axis_z;

				
				bbox.matrix = mat4.create();
				for (var k = 0; k < 16; ++k)
					bbox.matrix[k] = metadata.items[i].bbox_matrix[k];

				metadata.items[i].bbox = bbox;

				delete metadata.items[i].bbox_matrix;
				delete metadata.items[i].bbox_position;
				delete metadata.items[i].bbox_scale;
				delete metadata.items[i].bbox_axis_x;
				delete metadata.items[i].bbox_axis_y;
				delete metadata.items[i].bbox_axis_z;

					

				// also append the text to the document

				var container = document.getElementById("metadata-labels");

				var div = document.createElement("div");
				div.className = "floating-div";
				div.id = metadata.items[i].name;

				var textNode = document.createTextNode(metadata.items[i].name);
				div.appendChild(textNode);

				container.appendChild(div);


				metadata.items[i].htmlElement = div;


			}
	
			console.log("Loaded " + metadata.items.length + " metadata entries.");
			console.log(metadata.items);



		}
	}

	xmlhttp.open("GET", jsonUrl, true)
	xmlhttp.send();

}

metadata.loadRegistration = function(jsonUrl) {


	// load registration file
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function () {
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {

			// remove all newline
			var items = xmlhttp.response.replace(/(\r\n|\n|\r)/gm,"");

			items = JSON.parse(items);

			console.log(items);

			// setting the alignment here
			mat4.rotate(metadata.alignmentMatrix, metadata.alignmentMatrix, Math.PI/2, [-1,0,0]);
			mat4.translate(metadata.alignmentMatrix, metadata.alignmentMatrix, items.translation); //[1.4, -1, 2.25]);

		}

	}

	

	xmlhttp.open("GET", jsonUrl, true)
	xmlhttp.send();
}


metadata.draw = function(shader) {

	if (shader === undefined)
		return;


	for (var e in metadata.items) { 
		
		var item = metadata.items[e];
		
		if (item.bbox) {
			
            obb.draw(item.bbox, shader);

		}
	}

}

metadata.drawText = function() { 

	// draw text here

	// create correct transformation matrix
	var m = mat4.create();

	mat4.multiply(m, renderer.modelViewProjection, metadata.alignmentMatrix);


	for (var e in metadata.items) { 
		var item = metadata.items[e];


		var c = item.bbox.position; //aabb.getCentroid(item.bbox);
		var v = vec4.fromValues(c[0], c[1], c[2], 1);

	    //vec4.transformMat4(v, v, renderer.modelViewProjection);
		vec4.transformMat4(v, v, m);
	     
	   
	    // homogenous transform
		vec4.scale(v, v, 1.0 / v[3]);

		var pixelX = (v[0] *  0.5 + 0.5) * gl.canvas.width;
		var pixelY = (v[1] * -0.5 + 0.5) * gl.canvas.height;


	    //console.log(c, pixelX, pixelY);

		item.htmlElement.style.left = Math.floor(pixelX) + "px";
		item.htmlElement.style.top  = Math.floor(pixelY) + "px";
		item.htmlElement.style.alignContent="center";
		item.htmlElement.style.alignSelf="center";
			
	}
}
