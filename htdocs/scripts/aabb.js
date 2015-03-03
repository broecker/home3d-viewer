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

function calculateAABB(pointcloud) {
  
  const HUGE = 5000000;
  const smal = -HUGE;
  
  var minVal = [HUGE, HUGE, HUGE];
  var maxVal = [smal, smal, smal];
  
  
  console.log("Calculating AABB for ", pointcloud.length/3, " points.");
  //console.log("Initial: ", minVal, maxVal);
  
  for (var i = 0; i < pointcloud.length; i += 3) {
    
    var x = pointcloud[i+0];
    var y = pointcloud[i+1];
    var z = pointcloud[i+2];
    
    minVal[0] = Math.min(minVal[0], x);
    maxVal[0] = Math.max(maxVal[0], x);
    
    minVal[1] = Math.min(minVal[1], y);
    maxVal[1] = Math.max(maxVal[1], y);
    
    minVal[2] = Math.min(minVal[2], z);
    maxVal[2] = Math.max(maxVal[2], z);
    
  }
  
  
  //console.log("AABB: ", minVal, " -- ", maxVal);
  
  
  return {min:minVal, max:maxVal}
}

function extractVertices(bbox) {
  /*
  +-------+
  |  o->x |
  |  |    |
  |  vz   |
  +-------+
  
  lower=min, caps=max
  xz Xz
  xZ XZ
  
  */
  
  
  var vertices = [
    bbox.min[0], bbox.min[1], bbox.min[2],
    bbox.min[0], bbox.min[1], bbox.max[2],
    bbox.max[0], bbox.min[1], bbox.max[2],
    bbox.max[0], bbox.min[1], bbox.min[2],
    
    bbox.min[0], bbox.max[1], bbox.min[2],
    bbox.min[0], bbox.max[1], bbox.max[2],
    bbox.max[0], bbox.max[1], bbox.max[2],
    bbox.max[0], bbox.max[1], bbox.min[2]
    ];
  
  
  return vertices;
}

function getCentroid(bbox) {
  return [(bbox.min[0] + bbox.max[0])*0.5,
          (bbox.min[1] + bbox.max[1])*0.5,
          (bbox.min[2] + bbox.max[2])*0.5];  

}

function getSpanLength(bbox) {
  return vec3.length(bbox.max - bbox.min);
  
}


// simple clip-space approach to frustum testing. Fails if _all_ vertices are outside the frustum
function isVisible(bbox, matrix) { 

  var clipVertices = [];
 

  for (var i = 0; i < 8; ++i) {

    var v = vec4.fromValues(vertices[i*3+0], vertices[i*3+1], vertices[i*3+2], 1.0);

    var clipPos = vec4.create();
    vec4.transformMat4(clipPos, v, matrix);

    // homogenous transform
    vec4.scale(clipPos, clipPos, 1.0 / clipPos[3]);
    clipVertices.push(clipPos);
  }
  
  // note: this fails if the bounding box spans the whole fov and the individual
  // points fall outside the frustum! 

  var inside = [false, false, false, false, false, false, false, false];
  for (i = 0; i < 8; ++i) { 

    if (clipVertices[i][0] >= -clipVertices[i][3] && clipVertices[i][0] <= clipVertices[i][3] && 
        clipVertices[i][1] >= -clipVertices[i][3] && clipVertices[i][1] <= clipVertices[i][3] && 
        clipVertices[i][2] >= -clipVertices[i][3] && clipVertices[i][2] <= clipVertices[i][3]) {
          inside[i] = true;
    }
  }

  if (inside.every( function isFalse(element, index, array) { return element == false; }))
    return false;
  else
    return true;
}


// clips the box against the frustum specified by the matrix (proj*modelview)
// returns 0 if box is completely outside, 1 if partially inside, 2 if fully inside 
function clipBox(bbox, matrix) {
  var vertices = extractVertices(bbox);
 

  /* the six planes, based on manually extracting the mvp columns from clip space coordinates, as seen here:
    http://www.lighthouse3d.com/tutorials/view-frustum-culling/clip-space-approach-extracting-the-planes/
    Note that the article's matrix is in row-major format and therefore has to be switched. See also:
    http://www.cs.otago.ac.nz/postgrads/alexis/planeExtraction.pdf
  */

  function row(matrix, i) { 
    return vec4.fromValues(matrix[i+0], matrix[i+4], matrix[i+8], matrix[i+12]);
  }
  
  function neg(vec4) { 
    vec4[0] *= -1;
    vec4[1] *= -1;
    vec4[2] *= -1;
    vec4[3] *= -1;
    return vec4;
  }

  var row3 = row(matrix, 3);
  var planes = [ row(matrix, 0), neg(row(matrix, 0)), row(matrix, 1), neg(row(matrix, 1)), row(matrix, 2), neg(row(matrix, 2)) ];

  var vvertices = []
  
  for (var i = 0; i < 8; ++i) {
    var v = vec4.fromValues(vertices[i*3+0], vertices[i*3+1], vertices[i*3+2], 1.0);
    vvertices.push(v);
  }


  // add the third row
  for (var i = 0; i < planes.length; ++i) { 
    vec4.add(planes[i], planes[i], row3);
  }
  
  for (var i = 0; i < 6; ++i)
  {
    var outside = 0;
    var inside = 0;

    for (var j = 0; j < 8; ++j)
    {
      var d = vec4.dot(planes[i], vvertices[j]);
      
      if (d < 0)
        ++outside;
      else
        ++inside;
    }

    // fully outside
    if (inside == 0)
      return 0;

    // partially inside
    else if (outside > 0)
      return 1;
  }

  // fully inside
  return 2;
}

function drawAABB(bbox, shader) {
  
  // 'pseudo static' -- check if the unchanging variables have been initialized (once)
  if (typeof drawAABB.vertexBuffer == 'undefined') {
    console.log("creating AABB vertex buffers ");
    
    const bboxIndices = [ 0,1,1,2,2,3,3,0,
                          4,5,5,6,6,7,7,4,
                          0,4,1,5,2,6,3,7];
      
    drawAABB.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, drawAABB.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(8*3), gl.STREAM_DRAW);
    
    drawAABB.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, drawAABB.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(bboxIndices), gl.STATIC_DRAW);
    

  }
  
  // update vertex data
  var vertices = extractVertices(bbox);
  gl.bindBuffer(gl.ARRAY_BUFFER, drawAABB.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
  gl.vertexAttribPointer(shader.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
 
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, drawAABB.indexBuffer);
  
  // setup shader
  gl.useProgram(shader);
  gl.enableVertexAttribArray(shader.vertexPositionAttribute);
  
  
  //gl.uniform3f(shader.colorUniform, 0.7, 0.7, 0.2);
  gl.uniformMatrix4fv(shader.projMatrixUniform, false, global.projMatrix);
  gl.uniformMatrix4fv(shader.viewMatrixUniform, false, global.viewMatrix);
  gl.drawElements(gl.LINES, 8*3, gl.UNSIGNED_BYTE, 0);
  
}





