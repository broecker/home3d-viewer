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


/*global 
    gl,vec3,mat4, window, camera,framebuffer,geometry,shaders,octree,metadata,canvas
*/

// basic webgl renderer harness rewrite

window.renderer = {

    // creates the member variables and initializes them
    init : function() {
        "use strict";

        this.enableGrid = false;
        this.enableBBoxes = false;
        this.enableFXAA = true;
        this.enableMetadata = true;

        this.camera = camera.createOrbitalCamera();
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
        this.updateVisibilityFlag = true;

        this.updateCamera();
    },

    // resizes the viewport
    resize : function(vp) {
        "use strict";
        this.viewport = vp;
    },

    
    toggleGrid : function() {
        "use strict";
        this.enableGrid = !this.enableGrid;
        this.updateVisibilityFlag = true;
    },

    toggleBBoxes : function() {
        "use strict";
        this.enableBBoxes = !this.enableBBoxes;
        this.updateVisibilityFlag = true;
    },

    toggleFXAA : function() {
        "use strict";
        this.enableFXAA = !this.enableFXAA;
    },


    resetCamera : function() {
        "use strict";
        this.camera = camera.createOrbitalCamera();
        this.camera.radius = 20.0;
    },

    startCameraMove : function() {
        "use strict";

        this.camera.isMoving = true;
        this.renderTargetResolution.old = this.renderTargetResolution;
        framebuffer.resize(this.renderTarget, [this.renderTargetResolution[0]/2, this.renderTargetResolution[1]/2]);
    },

    stopCameraMove : function() {
        "use strict";

        this.camera.isMoving = false;
        this.updateVisibilityFlag = true;
        framebuffer.resize(this.renderTarget, this.renderTargetResolution.old);
    },

    updateCamera : function() {
        "use strict";

        this.camera.aspect = this.viewport[2] / this.viewport[3]; //canvas.clientWidth / canvas.clientHeight;

        //  setup the camera matrices
        camera.retrieveProjectionMatrix(this.camera, this.projMatrix);
        camera.retrieveViewMatrix(this.camera, this.viewMatrix);

        mat4.multiply(this.modelViewProjection, this.projMatrix, this.viewMatrix);
        mat4.invert(this.inverseModelViewProjection, this.modelViewProjection);


    },


    updateVisibleList : function() {
        "use strict";
        this.visibleList = [];


        if (geometry.octree) {

            var mat = mat4.create();
            mat4.multiply(mat, this.projMatrix, this.viewMatrix);

            octree.setInvisible(geometry.octree);
            octree.updateVisibility(geometry.octree, mat);
            octree.updateLOD(geometry.octree, window.camera.getPosition(this.camera));
            octree.getVisibleNodes(geometry.octree, this.visibleList);
        }


        if (this.visibleList.length > 0) {

            window.renderer.visibleList.sort(function(a,b) {
               return a.lodDistance*a.depth - b.lodDistance*b.depth;
            });


            if (this.enableDensityCulling) {
                window.renderer.visibleList.forEach(function(node) {
                    octree.updateScreenArea(node, window.renderer.modelViewProjection, [window.renderer.renderTarget.width, window.renderer.renderTarget.height]);
                });


                var oldSize = window.renderer.visibleList.length;
                window.renderer.visibleList = window.renderer.visibleList.filter(function(node) {
                    var density2 = node.points / node.screenArea;
                    return density2 < global.densityTreshold*global.densityTreshold;
                });

                console.log("Removed " + (oldSize-window.renderer.visibleList.length) + " nodes, " + window.renderer.visibleList.length + " remaining");

            }

        }

        //this.updateVisibilityFlag = false;

    },


    // displays the renderer content
    drawRenderTarget : function() {
        "use strict";

        // display the fbo
        gl.disable(gl.DEPTH_TEST);

        var shader = shaders.quadShader;
        if (shader === null) {
            return;
        }

        gl.viewport(this.viewport[0], this.viewport[1], this.viewport[2], this.viewport[3]);

        if (this.enableFXAA && !this.camera.isMoving && !(shaders.fxaaShader === null)) {

            shader = shaders.fxaaShader;

            gl.useProgram(shader);
            gl.activeTexture(gl.TEXTURE0);

            gl.bindTexture(gl.TEXTURE_2D, this.renderTarget.texture);
            gl.uniform1i(shader.colormapUniform, 0);
            gl.uniform2f(shader.resolutionUniform, this.renderTarget.width, this.renderTarget.height);

            geometry.drawFullscreenQuad(shader);

        }
    },


    requestNewFrame : function() {
        "use strict";
        this.updateVisibilityFlag = true;
    },

    draw : function() {
        "use strict";

        if (this.drawCallCounter === undefined) {
            this.drawCallCounter = 0;
        }

        //console.log('draw call ' + this.drawCallCounter++ + ", vl: " + this.visibleList.length);


        if (this.updateVisibilityFlag || this.camera.isMoving) {

            this.updateVisibleList();
            this.updateCamera();
            this.clearFrame();

            if (this.visibleList.length > 0) {
                this.updateVisibilityFlag = false;
            }
        }

        //console.log("visible list (" + this.visibleList.length + "): ", this.visibleList);
        
        if (this.visibleList.length > 0) {
            this.drawSomePoints();
        }
    },

    // the following two functions handle the incremental rendering implemented for this project

    // clears the render target and draws the grid etc and bboxes
    clearFrame : function() {
        "use strict";

        framebuffer.bind(this.renderTarget);

        //console.log('first frame.');

        // also clear the fbo
        gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        gl.clearColor(this.clearColor[0], this.clearColor[1], this.clearColor[2], 1.0);

        // draw the skybox
        if (!(shaders.skyboxShader === null)) {

            gl.depthMask(false);
            gl.disable(gl.DEPTH_TEST);

            gl.useProgram(shaders.skyboxShader);
            gl.uniformMatrix4fv(shaders.skyboxShader.inverseMVPUniform, false, this.inverseModelViewProjection);

            geometry.drawFullscreenQuad(shaders.skyboxShader);

            gl.enable(gl.DEPTH_TEST);
            gl.depthMask(true);
            gl.depthFunc(gl.LEQUAL);
        }



        
        // draw all static elements ...
        if (this.enableBBoxes && geometry.octree && shaders.gridShader) {

            gl.useProgram(shaders.gridShader);
            octree.drawBBoxes(geometry.octree, shaders.gridShader);
        }

        if (this.enableGrid && shaders.gridShader) {
            geometry.drawGrid();
        }

        if (this.enableMetadata && !(shaders.obbShader === null)) {
            metadata.draw(shaders.obbShader);
        } 

        framebuffer.disable(this.renderTarget);
        gl.viewport(0, 0, window.renderer.viewport[2], window.renderer.viewport[3]);
   


    },

    drawSomePoints : function() {
        "use strict";

        framebuffer.bind(this.renderTarget);

        gl.depthMask(true);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);


        //console.log('next frame.');

        

        var shader = shaders.pointsShader;
        if (geometry.octree && shader) {
            // draw the points
            gl.useProgram(shader);

            gl.uniform1f(shader.pointSizeUniform, global.pointSize);
            gl.uniformMatrix4fv(shader.projMatrixUniform, false, this.projMatrix);
            gl.uniformMatrix4fv(shader.viewMatrixUniform, false, this.viewMatrix);

            gl.uniform1f(shader.ceilingUniform, metadata.ceiling);


            var viewportHeight = canvas.height / (2.0 * Math.tan(0.5*Math.PI / 180 * this.camera.fovy));
            viewportHeight = 1.15 * 1024.0;
            gl.uniform1f(shader.viewportHeightUniform, viewportHeight);


            octree.pointsDrawn = 0;
            //console.log('draw points: ' + global.pointsDrawn + "/" + global.maxPointsRendered)

            var i = 0;
            var node = null;

            for (i = 0; i < this.visibleList.length && octree.pointsDrawn < octree.maxPointsRendered; i += 1) {
                node = this.visibleList[i];

                if (node.loaded === true) {
                    octree.drawNode(node, shader);
                    
                    //console.log("visibleList pre render: " + this.visibleList.length)

                    this.visibleList.splice(i, 1);

                    //console.log("visibleList post render: " + this.visibleList.length)



                } else {

                    if (node.loaded === false && node.depth <= octree.maxRecursion) {
                        octree.load(node);
                    }


                }
            }
        }

        if (window.renderer.enableMetadata) {
            // update and draw the text labels 
            metadata.drawText();

        }


        framebuffer.disable(this.renderTarget, this.viewport);
        gl.viewport(0, 0, this.viewport[2], this.viewport[3]);
    }


};

