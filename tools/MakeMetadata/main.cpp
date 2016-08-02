
#include <fstream>
#include <cassert>
#include <iostream>
#include <iomanip>
#include <string>
#include <vector>

#include <glm/glm.hpp>
#include <glm/gtc/type_ptr.hpp>

#ifdef _WIN32
#define sscanf sscanf_s
#endif


struct SegmentationRecord
{
	std::string			name;

	std::string			room;

	unsigned int		aat_id;
	std::string			aat_link;

	struct BBox
	{
		glm::mat4		transform;
		glm::vec3		min, max;
	}					bbox;
	
};


std::ostream& operator << (std::ostream& os, const SegmentationRecord& r)
{
	os << "{\n";
	os << "\"name\":\"" << r.name << "\"\n,";
	os << "\"room\":\"" << r.room << "\"\n,";
	os << "\"aat_id\": " << r.aat_id << "\n,"; // 000000000000, \n";
	os << "\"aat_link\": \"" << r.aat_link << "\"\n,";
	os << "\"bbox_min\": [" << r.bbox.min[0] << "," << r.bbox.min[1] << "," << r.bbox.min[2] << "]\n,";
	os << "\"bbox_max\": [" << r.bbox.max[0] << "," << r.bbox.max[1] << "," << r.bbox.max[2] << "]\n";
	os << "}";

	return os;
}


std::vector<std::string> tokenize(std::string input)
{
	using namespace std;
	vector<string> result;
	

	cout << "[Debug] \"" << input << "\": [";

	size_t n = input.find_first_of(" ");
	while (n != std::string::npos)
	{
		result.push_back(input.substr(0, n));
		input = input.substr(n + 1);
	}

	result.push_back(input);


	for (size_t i = 0; i < result.size()-1; ++i)
		cout << result[i] << ", ";
	cout << result.back() << "]\n";


	return move(result);
}


int main(int argc, const char** argv)
{
	using namespace std;

	if (argc == 1)
	{
		std::cerr << "Usage " << argv[0] << " <filename>\n";
		std::cerr << "Note: drag'n'drop works in windows.\n";
		return 2;
	}
		
	vector<SegmentationRecord> records;


	ifstream inFile(argv[1]);
	if (!inFile.is_open())
	{
		cerr << "[Error] Unable to open file \"" << argv[0] << "\"!\n";
		return -1;
	}
	
	while (!inFile.eof())
	{
		SegmentationRecord r;
		inFile >> r.name;
		

		size_t n = r.name.find_first_of("_");
		if (n == string::npos)
			continue;
		else
		{
			r.room = r.name.substr(0, n);
			r.name = r.name.substr(n + 1);
		}
		

		float* mat = glm::value_ptr(r.bbox.transform);
		for (int i = 0; i < 16; ++i)
			inFile >> mat[i];

		r.bbox.min = glm::vec3(r.bbox.transform * glm::vec4(-1, -1, -1, 1));
		r.bbox.max = glm::vec3(r.bbox.transform * glm::vec4(1, 1, 1, 1));

		r.aat_id = 0;
		r.aat_link = "UNDEFINED";


		records.push_back(r);
	
		cout << "[File] Read record \"" << r.name << "\"\n";
		
	}

	cout << "[File] Read " << records.size() << " records.\n";
	
	std::ofstream oFile(string(argv[1]) + ".out.json");
	oFile << "[";

	for (size_t i = 0; i < records.size() - 1; ++i)
		oFile << records[i] << ",";
	oFile << records.back();

	oFile << "]\n";




	system("pause");

	return 0;
}
