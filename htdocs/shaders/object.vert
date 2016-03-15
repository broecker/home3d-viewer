attribute vec3 positionIn;
attribute vec3 normalIn;

uniform mat4 transform;
uniform mat4 viewMatrix;
uniform mat4 projMatrix;

varying vec3 worldPosition;
varying vec3 worldNormal;

void main()
{
	gl_Position = projMatrix * viewMatrix * transform * vec4(positionIn, 1.0);

	worldPosition = (transform * vec4(positionIn, 1.0)).xyz;
	
	// note: works as long as there is only _uniform_ scaling involved
	worldNormal = (transform * vec4(normalIn, 0.0)).xyz;
}