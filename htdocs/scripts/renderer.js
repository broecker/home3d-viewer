/** 
    The MIT License (MIT)
    Copyright (c) 2016 Markus Broecker

    Permission is hereby granted, free of charge, to any person obtaining a 
    copy of this software and associated documentation files (the "Software"), 
    to deal in the Software without restriction, including without limitation 
    the rights to use, copy, modify, merge, publish, distribute, sublicense, 
    and/or sell copies of the Software, and to permit persons to whom the 
    Software is furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in 
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
    FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
    DEALINGS IN THE SOFTWARE.
*/


// basic webgl renderer harness rewrite

window.renderer = {

    // creates the member variables and initializes them
    init : function(gl) {
        this.enableGrid = true;
        this.enableBBoxes = false;
        this.enableFXAA = true;


        this.updateVisibilityFlag = true;

        this.camera = createOrbitalCamera();
        this.camera.radius = 20.0;

        this.clearColor = [0,0,0,0];
        this.viewport = [0,0,800,600];

        this.visibleList = [];
        this.enableDensityCulling = false;

        this.viewMatrix = mat4.create();
        this.projMatrix = mat4.create();
        this.modelViewProjection = mat4.create();
        this.inverseModelViewProjection = mat4.create();

        this.renderTargetResolution = [1024, 1024];
        this.renderTarget = framebuffer.create(this.renderTargetResolution[0], this.renderTargetResolution[1]);

    },

    // resizes the viewport
    resize : function(vp) {
        this.viewport = vp;
    },

    
    toggleGrid : function() {
        this.enableGrid = !this.enableGrid;
        this.updateVisibilityFlag = true;
    },

    toggleBBoxes : function() {
        this.enableBBoxes = !this.enableBBoxes;
        this.updateVisibilityFlag = true;
    },

    toggleFXAA : function() {
        this.enableFXAA = !this.enableFXAA;
    },


    resetCamera : function() {
      
      this.updateVisibility = true;

      this.camera = createOrbitalCamera();
      this.camera.radius = 20.0;
    },

    startCameraMove : function() {
      this.camera.isMoving = true;
      this.renderTargetResolution.old = this.renderTargetResolution;
      framebuffer.resize(this.renderTarget, [this.renderTargetResolution[0]/2, this.renderTargetResolution[1]/2]);

      this.updateVisibility = true;

    },

    stopCameraMove : function() {
      this.camera.isMoving = false;
      framebuffer.resize(this.renderTarget, this.renderTargetResolution.old);

      this.updateVisibility = true;
    },


    updateVisibilityList : function() {
        this.visibleList = [];


        if (geometry.octree) {

            var mat = mat4.create();
            mat4.multiply(mat, this.projMatrix, this.viewMatrix);

            octree.setInvisible(geometry.octree);
            octree.updateVisibility(geometry.octree, mat);
            octree.updateLOD(geometry.octree, getPosition(this.camera));
            octree.getVisibleNodes(geometry.octree, this.visibleList);
        }


        if (this.visibleList.length > 0) {

            renderer.visibleList.sort(function(a,b) {
               return a.lodDistance*a.depth - b.lodDistance*b.depth;
            });


            if (this.enableDensityCulling) {
                renderer.visibleList.forEach(function(node) {
                    octree.updateScreenArea(node, renderer.modelViewProjection, [renderer.renderTarget.width, renderer.renderTarget.height]);
                });


                var oldSize = renderer.visibleList.length;
                renderer.visibleList = renderer.visibleList.filter(function(node) {
                    var density2 = node.points / node.screenArea;
                    return density2 < global.densityTreshold*global.densityTreshold;
                });

                console.log("Removed " + (oldSize-renderer.visibleList.length) + " nodes, " + renderer.visibleList.length + " remaining");

            }

        }


        this.updateVisibilityFlag = false;
    },


    drawRenderTarget : function(gl) {
        // display the fbo 
        gl.disable(gl.DEPTH_TEST);

        shader = shaders.quadShader;
        if (shader === null)
            return;


        if (this.enableFXAA && !this.camera.isMoving && !(shaders.fxaaShader === null))
        shader = shaders.fxaaShader;

        gl.useProgram(shader);
        gl.activeTexture(gl.TEXTURE0);

        gl.bindTexture(gl.TEXTURE_2D, this.renderTarget.texture);
        gl.uniform1i(shader.colormapUniform, 0);
        gl.uniform2f(shader.resolutionUniform, this.renderTarget.width, this.renderTarget.height);

        geometry.drawFullscreenQuad(shader);

    }





}

