#pragma once

#include <vector>
#include <glm/glm.hpp>


struct Point
{
	// position;
	float x, y, z;

	union
	{
		struct
		{
			unsigned char	r, g, b, a;
		};

		unsigned char	_data[4];
		float			_padding;
	};


	
	operator glm::vec3 () const
	{
		return glm::vec3(x, y, z);
	}
	
};

typedef std::vector<Point>	Pointcloud;
