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


struct Normal8b
{
	char		x, y, z;
		
	operator glm::vec3 () const
	{
		return glm::vec3((float)x / 255.f, (float)y / 255.f, (float)z / 255.f);
	}
};

typedef std::vector<Point>	Pointcloud;
typedef std::vector<Normal8b> Normalcloud;

typedef std::vector<unsigned int> Indexcloud;