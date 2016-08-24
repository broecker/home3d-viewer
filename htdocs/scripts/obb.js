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

var obb = obb || {};


// creates an oriented bounding box
// Make sure that the axis vectors are orthonormal
obb.create = function() { 
	var bbox = {
		position : vec3.create(),
		xAxis : vec3.fromValues(1,0,0),
		yAxis : vec3.fromValues(0,1,0),
		zAxis : vec3.fromValues(0,0,1),
		halfBounds : vec3.fromValues(1,1,1)
	};

	return bbox;
}

obb.getMatrix = function(bbox) { 
	var m = mat4.create();

	m[0] = bbox.xAxis[0];
	m[1] = bbox.xAxis[1];
	m[2] = bbox.xAxis[2];
	m[4] = bbox.yAxis[0];
	m[5] = bbox.yAxis[1];
	m[6] = bbox.yAxis[2];
	m[8] = bbox.zAxis[0];
	m[9] = bbox.zAxis[1];
	m[10] = bbox.zAxis[2];
	m[12] = bbox.position[0];
	m[13] = bbox.position[1];
	m[14] = bbox.position[2];

	mat4.scale(m, m, bbox.halfBounds);

	return m;
};


obb.getCentroid = function(bbox) { 
	return bbox.position;
}


obb.extractVertices = function(bbox) { 

	var x = bbox.xAxis;
	var y = bbox.yAxis;
	var z = bbox.zAxis;
	var d = bbox.halfBounds;

	var p = bbox.position;

	// X Y Z
	var bboxVertices = [ 	p[0] -(x[0]+y[0]+z[1])*d[0], p[1]-(x[1]+y[1]+z[1])*d[1], p[2]-(x[2]+y[2]+z[2])*d[2],
							p[0] -(x[0]+y[0]+z[1])*d[0], p[1]-(x[1]+y[1]+z[1])*d[1], p[2]+(x[2]+y[2]+z[2])*d[2],
							p[0] +(x[0]+y[0]+z[1])*d[0], p[1]-(x[1]+y[1]+z[1])*d[1], p[2]+(x[2]+y[2]+z[2])*d[2],
							p[0] +(x[0]+y[0]+z[1])*d[0], p[1]-(x[1]+y[1]+z[1])*d[1], p[2]-(x[2]+y[2]+z[2])*d[2],
							p[0] -(x[0]+y[0]+z[1])*d[0], p[1]+(x[1]+y[1]+z[1])*d[1], p[2]-(x[2]+y[2]+z[2])*d[2],
							p[0] -(x[0]+y[0]+z[1])*d[0], p[1]+(x[1]+y[1]+z[1])*d[1], p[2]+(x[2]+y[2]+z[2])*d[2],
							p[0] +(x[0]+y[0]+z[1])*d[0], p[1]+(x[1]+y[1]+z[1])*d[1], p[2]+(x[2]+y[2]+z[2])*d[2],
							p[0] +(x[0]+y[0]+z[1])*d[0], p[1]+(x[1]+y[1]+z[1])*d[1], p[2]-(x[2]+y[2]+z[2])*d[2] ];


	//debugger;
	console.log(bboxVertices);

	return bboxVertices;

}


obb.draw = function(bbox, shader) { 

	  // 'pseudo static' -- check if the unchanging variables have been initialized (once)
  if (obb.vertexBuffer === undefined) {
    console.log("creating OBB vertex buffers ");
    
    const bboxIndices = [ 0,1,1,2,2,3,3,0,
                          4,5,5,6,6,7,7,4,
                          0,4,1,5,2,6,3,7];
    
    const bboxVertices = [ 	-1, -1, -1,
  							-1, -1,  1,
  						  	 1, -1,  1,
  						  	 1, -1, -1, 
  						  	-1,  1, -1,
						  	-1,  1,  1,
						  	 1,  1,  1,
						  	 1,  1, -1 ];

    obb.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, obb.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bboxVertices), gl.DYNAMIC_DRAW);
    
    obb.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obb.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(bboxIndices), gl.STATIC_DRAW);
    
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, obb.vertexBuffer);
  // update vertices
  var bboxVertices = obb.extractVertices(bbox);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bboxVertices), gl.DYNAMIC_DRAW);

  gl.vertexAttribPointer(shader.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obb.indexBuffer);


  // setup shader
  gl.useProgram(shader);
  gl.enableVertexAttribArray(shader.vertexPositionAttribute);
    
  gl.uniform3f(shader.positionUniform, bbox.position[0], bbox.position[1], bbox.position[2]);
  gl.uniform3f(shader.axisXUniform, bbox.xAxis[0], bbox.xAxis[1], bbox.xAxis[2]);
  gl.uniform3f(shader.axisYUniform, bbox.yAxis[0], bbox.yAxis[1], bbox.yAxis[2]);
  gl.uniform3f(shader.axisZUniform, bbox.zAxis[0], bbox.zAxis[1], bbox.zAxis[2]);
  gl.uniform3f(shader.scaleUniform, bbox.halfBounds[0], bbox.halfBounds[1], bbox.halfBounds[2]);
	
  gl.uniformMatrix4fv(shader.bboxMatrixUniform, false, bbox.matrix);;
  gl.uniformMatrix4fv(shader.registrationMatrixUniform, false, metadata.alignmentMatrix);		

  gl.drawElements(gl.LINES, 8*3, gl.UNSIGNED_BYTE, 0);
  
};


// checks if the given point [vec4] is inside the bbox
obb.isInside = function(bbox, pt) { 

	var m = oob.getMatrix(bbox);
	mat4.invert(m, m);
	var p = vec4.create();
	vec4.transformMat4(p, bbox._inverseTransform, pt);

	return (p.x >= -1 && p.x <= 1 &&
			p.y >= -1 && p.y <= 1 &&
			p.z >= -1 && p.y <= 1);
};