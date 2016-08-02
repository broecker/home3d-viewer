
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
	std::string			aat_id;

	struct BBox
	{
		glm::mat4		transform;
		glm::vec3		min, max;
	}					bbox;
};

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
		
		float* mat = glm::value_ptr(r.bbox.transform);
		for (int i = 0; i < 16; ++i)
			inFile >> mat[i];

		r.bbox.min = glm::vec3(r.bbox.transform * glm::vec4(-1, -1, -1, 1));
		r.bbox.max = glm::vec3(r.bbox.transform * glm::vec4(1, 1, 1, 1));

		r.aat_id = "UNDEFINED";


		records.push_back(r);
	
		cout << "[File] Read record \"" << r.name << "\"\n";
		
	}

	cout << "[File] Read " << records.size() << " records.\n";
	
	std::ofstream oFile(string(argv[1]) + ".out.json");
	oFile << "[";

	for (auto r = records.begin(); r != records.end(); ++r)
	{
		oFile << "{\n";
		oFile << "\t\"name\":\"" << r->name << "\",\n";
		oFile << "\t\"aat_id\": 000000000000,\n";
		oFile << "\t\"bbox_min\": [" << r->bbox.min[0] << "," << r->bbox.min[1] << "," << r->bbox.min[2] << "]\n";
		oFile << "\t\"bbox_max\": [" << r->bbox.max[0] << "," << r->bbox.max[1] << "," << r->bbox.max[2] << "]\n";
		oFile << "},\n";
	}


	oFile << "]\n";




	system("pause");

	return 0;
}
