#!/usr/bin/env python

import sys
import json


vertices = []
normals = []
faces = []


if __name__ == '__main__':
	print(sys.argv);
	
	infile = open(sys.argv[1], 'r')

	# read header first
	magic = infile.readline();
	assert(magic == "ply\n")
	mode = infile.readline()
	assert(mode == "format ascii 1.0\n")


	vertexCount = 0
	faceCount = 0

	line = ""
	while line != "end_header":
		line = infile.readline().strip();

		if "element vertex" in line:
			vertexCount = int(line.split(' ')[-1])

		if "element face" in line:
			faceCount = int(line.split(' ')[-1])

	#print ('reading ' + str(vertexCount) + ' vertices.')
	for i in range(0, vertexCount):
		data = infile.readline().strip().split(' ')

		vertices.append(float(data[0]))
		vertices.append(float(data[1]))
		vertices.append(float(data[2]))

		normals.append(float(data[3]))
		normals.append(float(data[4]))
		normals.append(float(data[5]))

	print('read ' + str(int(len(vertices)/3)) + ' vertices.')
	assert(len(vertices) == len(normals) == vertexCount*3)


	splitCount = 0

	for i in range(0, faceCount):
		data = infile.readline().strip().split(' ')

		if data[0] == '3':
			# this is a triangle -- good
			faces.append(int(data[1]))
			faces.append(int(data[2]))
			faces.append(int(data[3]))

		else:
			if data[0] == '4':
			# split the quad

				faces.append(int(data[1]))
				faces.append(int(data[2]))
				faces.append(int(data[3]))

				faces.append(int(data[3]))
				faces.append(int(data[4]))
				faces.append(int(data[1]))

				splitCount += 1

			else:
				print('read face with ' + data[0] + ' vertices, ignoring.')




	print ('read ' + str(int(len(faces)/3)) + ' faces.')

	if splitCount > 0:
		print ('split ' + str(splitCount) + ' faces.')



	# write a cleaned-up version in json form

	struct = { 'vertexCount': vertexCount, 'faceCount': len(faces), 'vertexData': vertices, 'normalData':normals, 'faceData':faces};


	outfile = sys.argv[1] + '_out.json'
	if len(sys.argv) > 2:
		outfile = sys.argv[2]

	json.dump(struct, open(outfile, 'w'))
