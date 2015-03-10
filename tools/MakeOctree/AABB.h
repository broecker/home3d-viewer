#ifndef AABB_INCLUDED
#define AABB_INCLUDED

#include <glm/glm.hpp>

struct AABB
{
	glm::vec3	min, max;
	
	enum ClipResult
	{
		OUTSIDE=0,
		INSIDE,
		INTERSECT
	};

	ClipResult isVisible(const glm::mat4& mvp) const;
	void draw() const;

	void reset();
	void extend(const glm::vec3& pt);

	/// checks if the ray, defined by the origin o and vector v intersects this box
	bool isIntersectedByRay(const glm::vec3& o, const glm::vec3& v) const;

	inline glm::vec3 getCentroid() const { return (min + max)*0.5f; }

	inline float getSpanLength() const { return glm::length(max-min); }



};




#endif
