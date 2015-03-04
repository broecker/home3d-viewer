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



function drawPointcloud(pointcloud, shader)  {
  
  if (!pointcloud)
    return;

  if (pointcloud.numPoints == 0)
    return;
  
  gl.useProgram(shader);
  
  gl.enableVertexAttribArray(shader.vertexPositionAttribute);
  gl.bindBuffer(gl.ARRAY_BUFFER, pointcloud.points);
  gl.vertexAttribPointer(shader.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
  
  gl.enableVertexAttribArray(shader.vertexColorAttribute);
  gl.bindBuffer(gl.ARRAY_BUFFER, pointcloud.colors);
  gl.vertexAttribPointer(shader.vertexColorAttribute, 3, gl.UNSIGNED_BYTE, true, 0, 0);
  
  gl.uniformMatrix4fv(shader.projMatrixUniform, false, global.projMatrix);
  gl.uniformMatrix4fv(shader.viewMatrixUniform, false, global.viewMatrix);
  gl.drawArrays(gl.POINTS, 0, pointcloud.numPoints);
  
}

// 3 floats + 4 uint8 = 4*3 + 4 bytes
const POINT_SIZE = 4*4;

function createPointcloudFromBlob(blob, pointCount, placement) {
	var i;

	var reader = new FileReader();
	const littleEndian = true;

	console.assert(blob != undefined);

	var maxPoints = blob.size / POINT_SIZE;
	if (pointCount > maxPoints) { 
		console.log("Warning, expecting only " + maxPoints + " points in file." );
		pointCount = maxPoints;
	}

	if (pointCount <= 0)
		pointCount = maxPoints;

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


    console.assert(points.length = 3*pointCount, "Number of actually loaded points differs from expected point count!");
    console.assert(points.length == colors.length, "Number of points and colors differ!");
    console.log("Loaded " + points.length/3 + " points.");

    var bbox = calculateAABB(points);

    if (placement == "on ground") { 
      // place the object on the ground
      console.log("Placing object on ground plane");

      var c = getCentroid(bbox);

      for (i = 0; i < pointCount; ++i)  {
        points[i*3+0] -= c[0];
        points[i*3+1] -= bbox.max[1];
        points[i*3+2] -= c[2];
      }


      // update bbox
      bbox.min[0] -= c[0];
      bbox.min[2] -= c[2];

      bbox.max[0] -= c[0];
      bbox.max[2] -= c[2];

      bbox.min[1] -= bbox.max[1];
      bbox.max[1] = 0.0;





    }
    else if (placement == "centered") { 
      console.log("Centering point cloud");
      // center the object
      var c = getCentroid(bbox);

      for (i = 0; i < pointCount; ++i)  {
        points[i*3+0] -= c[0];
        points[i*3+1] -= c[1];
        points[i*3+2] -= c[2];
      }

      // update bbox
      bbox.min[0] -= c[0];
      bbox.min[1] -= c[1];
      bbox.min[2] -= c[2];

      bbox.max[0] -= c[0];
      bbox.max[1] -= c[1];
      bbox.max[2] -= c[2];
    }



		var pointsBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);

		var colorBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
	

		var pointcloud = {points:pointsBuffer, colors:colorBuffer, numPoints:pointCount, aabb:bbox, loaded:true};
		console.log(pointcloud);

		return pointcloud;

	}



}

