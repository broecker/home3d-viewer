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
  
  const HUGE = 50000;
  const smal = -50000;
  
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

function isVisible(bbox) {
  var vertices = extractVertices(bbox);
  
  clipVertices = new Float32Array(8*3);
  
  for (var i = 0; i < 8; ++i) {
    
    var clipPos = projMatrix * viewMatrix * v;
    
    clipVertices[i*3+0] = clipPos[0] / clipPos[3];
    clipVertices[i*3+1] = clipPos[1] / clipPos[3];
    clipVertices[i*3+2] = clipPos[2] / clipPos[3];
  }
  
  var visible = false;
  for (i = 0; i < 8*3; i += 3) {
    if (clipVertices[i+0] >= -1.0 && clipVertices[i+0] <= 1.0 &&
        clipVertices[i+1] >= -1.0 && clipVertices[i+1] <= 1.0 &&
        clipVertices[i+2] >= -1.0 && clipVertices[i+2] <= 1.0) {
          visible = true;
          break;
        }
    
  }
  
  
  return visible;
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
    gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(8*3), gl.STATIC_DRAW);
    
    drawAABB.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, drawAABB.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(bboxIndices), gl.STATIC_DRAW);
    

  }
  
  // update vertex data
  var vertices = extractVertices(bbox);
  gl.bindBuffer(gl.ARRAY_BUFFER, drawAABB.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.vertexAttribPointer(shader.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
 
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, drawAABB.indexBuffer);
  
  // setup shader
  gl.useProgram(shader);
  gl.enableVertexAttribArray(shader.vertexPositionAttribute);
  
  
  
  
  
  gl.uniform3f(shader.colorUniform, 0.7, 0.7, 0.2);
  gl.uniformMatrix4fv(shader.projMatrixUniform, false, projMatrix);
  gl.uniformMatrix4fv(shader.viewMatrixUniform, false, viewMatrix);
  gl.drawElements(gl.LINES, 8*3, gl.UNSIGNED_BYTE, 0);
  
}
