


function createFBO(width, height) { 


	var fbo = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

	fbo.width = width;
	fbo.height = height;

	// create color texture
	fbo.texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, fbo.texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, fbo.width, fbo.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	gl.generateMipmap(gl.TEXTURE_2D);



	// create depth renderbuffer
	fbo.renderbuffer = gl.createRenderbuffer();
	gl.bindRenderbuffer(gl.RENDERBUFFER, fbo.renderbuffer);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, fbo.width, fbo.height);

	// bind texture and buffer to fbo
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fbo.texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, fbo.renderbuffer);

    // unbind all
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);


   
	return fbo;
}


function bindFBO(fbo) {

	gl.viewport(0,0, fbo.width, fbo.height);
   	gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

   	//debugger;
}

function disableFBO(fbo) { 

	gl.viewport(global.viewport[0], global.viewport[1], global.viewport[2], global.viewport[3] );
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}
