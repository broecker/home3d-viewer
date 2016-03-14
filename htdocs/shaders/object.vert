attribute vec3 positionIn;
//attribute vec3 normalIn;

uniform mat4 transform;
uniform mat4 viewMatrix;
uniform mat4 projMatrix;

void main()
{
	gl_Position = projMatrix * viewMatrix * transform * vec4(positionIn, 1.0);
}