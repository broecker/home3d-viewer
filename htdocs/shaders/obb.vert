attribute vec3 positionIn;

uniform mat4 viewMatrix;
uniform mat4 projMatrix;

// oriented bounding box -- could/should be replaced by a mat4
uniform vec3 position;
uniform vec3 axisX;
uniform vec3 axisY;
uniform vec3 axisZ;
uniform vec3 scale;


void main()
{
	mat4 modelMatrix = mat4(1.0);
	modelMatrix[3].x = position.x;
	modelMatrix[3].y = position.y;
	modelMatrix[3].z = position.z;
	modelMatrix[0].xyz = axisX;
	modelMatrix[1].xyz = axisY;
	modelMatrix[2].xyz = axisZ;
	
	gl_Position = projMatrix * viewMatrix * modelMatrix * vec4(positionIn * (scale.xzy * 0.5), 1.0);
	gl_PointSize = 1.0;

}