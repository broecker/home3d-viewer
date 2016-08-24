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

	vec3 delta = (positionIn * scale.xzy * 0.5);
	vec3 v = position;
	v += axisX * delta.x + axisY * delta.y + axisZ * delta.z;

	gl_Position = projMatrix * viewMatrix * registrationMatrix * vec4(v, 1.0); 
	gl_PointSize = 1.0;

}