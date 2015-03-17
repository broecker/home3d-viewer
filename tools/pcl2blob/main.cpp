



#include <pcl/io/pcd_io.h>
#include <pcl/point_types.h>
#include <pcl/point_cloud.h>
#include <Eigen/Eigen>


#include <iostream>
#include <fstream>
#include <vector>
#include <cassert>


struct Point 
{
	float x, y, z;
	unsigned char r, g, b, a;
};


int main(int argc, const char** argv)
{


	if (argc == 1)
	{
		std::cerr << "Usage: " << argv[0] << " <infile> [outfile] \n";
		return -2;
	}

	pcl::PointCloud<pcl::PointXYZRGB>::Ptr cloud(new pcl::PointCloud<pcl::PointXYZRGB>);

        if (pcl::io::loadPCDFile(argv[1], *cloud) == -1)
        {
        	std::cerr << "Error, unable to read file \"" << argv[1] << "\"!\n";
		return -1;
	}

	std::vector<Point> points;
        points.reserve(cloud->points.size());

        for (size_t i = 0; i < cloud->points.size(); ++i)
        {
                const pcl::PointXYZRGB& pt = cloud->points[i];
                Point p;
                p.x = pt.x;
                p.y = pt.y;
                p.z = pt.z;
		p.r = pt.r;
		p.g = pt.g;
		p.b = pt.b;
		p.a = 0;

		points.push_back(p);

	}

	
	char fileOut[256];
	if (argc > 2)
		strcpy(fileOut, argv[2]);
	else
		sprintf(fileOut, "%s_out.blob", argv[1]);

	std::cout << "Read " << points.size() << " points, writing to \"" << fileOut << "\" ... "; 

	std::ofstream ofile(fileOut, std::ios::binary|std::ios::trunc);
	ofile.write(reinterpret_cast<const char*>(&points[0]), sizeof(Point)*points.size());
	
	std::cout << "done.\n";
	




	return 0;
}
