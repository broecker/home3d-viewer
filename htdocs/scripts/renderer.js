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
    init : function() {
        this.enableGrid = true;
        this.enableBboxes = false;
        this.enableFXAA = true;


        this.updateVisibilityFlag = true;

        this.camera = null;

        this.clearColor = [0,0,0,0];
        this.viewport = [0,0,800,600];

        this.visibleList = [];

    },

    // resizes the viewport
    resize : function(vp) {
        this.viewport = vp;
    },

    
    toggleGrid : function() {
        this.enableGrid = !this.enableGrid;
        this.updateVisibilityFlag = true;
    },

    toggleBboxes : function() {
        this.enableBboxes = !this.enableBboxes;
        this.updateVisibilityFlag = true;
    },

    toggleFXAA : function() {
        this.enableFXAA = !this.enableFXAA;
    },


    updateVisibility : function() {


        this.updateVisibilityFlag = false;
    }


}

