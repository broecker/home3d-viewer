precision mediump float;


varying vec3 worldNormal;
varying vec3 worldPosition;

uniform vec3 color;
uniform vec3 lightDirection;

void main()
{
	vec3 N = normalize(worldNormal);
	vec3 L = normalize(lightDirection);

	float shade = max(0.1, dot(L, N));



	gl_FragColor = vec4(shade * lightDirection * color, 1.0);
}	