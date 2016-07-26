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

	// parse json file here
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function () {
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {

			// remove all newline
			var items = xmlhttp.response.replace(/(\r\n|\n|\r)/gm,"");

			metadata.items = JSON.parse(items);


			// parse the data
			for (var i in metadata.items) {

				// create bounding boxes
				metadata.items[i].bbox = aabb.create(metadata.items[i].bbox_min, metadata.items[i].bbox_max);
				delete metadata.items[i].bbox_min; 
				delete metadata.items[i].bbox_max;
					


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
	

			//console.log("Loaded " + metadata.items.length + " metadata entries.");
			//console.log(metadata.items);
		}
	}

	xmlhttp.open("GET", jsonUrl, true)
	xmlhttp.send();


}


metadata.draw = function(shader) {
	if (!(shader === null)) {

		gl.lineWidth(3);

		gl.useProgram(shader);
		gl.enableVertexAttribArray(shader.vertexPositionAttribute);
		gl.uniform3f(shader.colorUniform, 1, 1, 0);


		for (var e in metadata.items) { 
			
			var item = metadata.items[e];
			
			if (item.bbox) {
				aabb.drawAABB(item.bbox, shader);

				//console.log(item.bbox);

			}
		}

		gl.lineWidth(1.0);

		// draw text here

		for (var e in metadata.items) { 
			var item = metadata.items[e];


			var c = aabb.getCentroid(item.bbox);
			var v = vec4.fromValues(c[0], c[1], c[2], 1);

		    vec4.transformMat4(v, v, renderer.modelViewProjection);
		    
		   
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


}