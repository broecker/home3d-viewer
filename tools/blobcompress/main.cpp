
#include <string>
#include <iostream>
#include <fstream>
#include <vector>
#include <cassert>
#include <cstdint>


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



};

typedef std::vector<Point>	Pointcloud;


static const char* MAGIC = "PCBB";
static const uint32_t MAGIC_NUMBER = *reinterpret_cast<const uint32_t*>(MAGIC);
static unsigned char VERSION = 1;

int main(int argc, char** argv)
{
	if (argc < 2)
	{
		std::cerr << "Error, no filename given. Usage: " << argv[0] << " <filename> <subsample>\n";
		return 1;
	}

	assert(sizeof(Point) == 4 * sizeof(float));
		
	std::ifstream file(argv[1]);
	assert(file.is_open());

	std::cout << "Reading file \"" << argv[1] << "\" ... ";
	Pointcloud points;
		
	while (!file.eof())
	{
		Point p;
		file >> p.x >> p.y >> p.z;
		int r, g, b;
		file >> r >> g >> b;
		p.r = r;
		p.g = g;
		p.b = b;

		points.push_back(p);
	}

	std::cout << "done.\nRead " << points.size() << " points.\n";

	float subsample = 1.0;
	if (argc == 3)
	{
		subsample = atof(argv[2]);
		std::cout << "Subsampling to " << subsample << std::endl;
	}

	if (subsample < 1.f)
	{
		unsigned int sample = (unsigned int)(1.f / subsample);
		std::cout << "Sample: " << sample << std::endl;

		Pointcloud temp = points;
		points.clear();

		for (size_t i = 0; i < temp.size(); ++i)
		{
			if (i%sample == 0)
				points.push_back(temp[i]);
		}
		
	}




	std::string filenameOut = std::string(argv[1]) + "_out.blob";
	std::cout << "Writing " << points.size() << " points to file \"" << filenameOut << "\" ... ";
	std::ofstream ofile(filenameOut.c_str(), std::ios::binary | std::ios::trunc);
	assert(ofile.is_open());
		
	// write the data
	ofile.write(reinterpret_cast<const char*>(&points[0]), sizeof(Point)*points.size());
	
	std::cout << " done.\n";
		
	return 0;
}

