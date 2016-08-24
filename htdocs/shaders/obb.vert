attribute vec3 positionIn;

uniform mat4 viewMatrix;
uniform mat4 projMatrix;
uniform mat4 registrationMatrix;

uniform vec3 axisX;
uniform vec3 axisY;
uniform vec3 axisZ;
uniform vec3 scale;
uniform vec3 position;

void main()
{
	gl_Position = projMatrix * viewMatrix * registrationMatrix * vec4(positionIn.xyz, 1.0); 
	gl_PointSize = 1.0;

}