attribute vec3 positionIn;

uniform mat4 viewMatrix;
uniform mat4 projMatrix;
uniform mat4 bboxMatrix;
uniform mat4 registrationMatrix;

void main()
{
	vec3 v = positionIn.xzy * 0.5;
	v *= vec3(1.0, 1.0, -1.0);

	gl_Position = projMatrix * viewMatrix * registrationMatrix * bboxMatrix * vec4(v, 1.0); 
	gl_PointSize = 1.0;

}