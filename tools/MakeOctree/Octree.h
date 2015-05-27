#ifndef OCTREE_INCLUDED
#define OCTREE_INCLUDED

#include "Point.h"
#include "AABB.h"

#include <string>

struct SplitConfig
{
	unsigned int	maxNodeSize;
	unsigned int	minNodeSize;
};

class Octree
{	
public:
	Octree(const Pointcloud& pc, Octree* parent = nullptr);
	virtual ~Octree();


	inline const AABB& getBBox() const { return aabb;  }

	bool hasChildren() const;
		
	void build(const SplitConfig& config, const std::string& basename);

	
private:
	Pointcloud		points;
	
	Octree*			parent;
	Octree*			children[8];

	AABB			aabb;
	
	void split(const SplitConfig& config);

	// randomly shuffles all points in this node
	void shuffle();

	static void recurseSave(const Octree* node);
	static void recurseSplit(Octree* node, const SplitConfig& config);

	static std::string recurseBuildJSON(const Octree* node);

	std::string getNodename() const;
	std::string getJSONEntry() const;

};

#endif

