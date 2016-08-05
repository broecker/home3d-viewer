precision mediump float;

varying vec3 color;
varying vec3 worldPos;

uniform float ceiling;

void main()
{

	if (ceiling > 0.0 && worldPos.y > ceiling)
		discard;

	// this enables round point sprites in OpenGL ES2			
	vec2 pt = gl_PointCoord - vec2(0.5);
	if(dot(pt, pt) > 0.25)
		discard;

	gl_FragColor = vec4(color, 1.0);
	//gl_FragColor = vec4(vec3(0.7), 1.0);
}