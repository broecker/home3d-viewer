precision mediump float;

varying vec3 color;

uniform float lodLevel = 0;

void main()
{

	vec3 red = vec3(0.8, 0.0, 0.0);
	vec3 grn = vec3(0.0, 0.7, 0.0);

	vec3 color2 = mix(grn, red, lodLevel);

	gl_FragColor = vec4(red, 1.0);
}