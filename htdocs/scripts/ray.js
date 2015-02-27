/*
The MIT License (MIT)

Copyright (c) 2015 Markus Broecker <broecker@wisc.edu>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/



function createRay(origin, direction) { 

	var o = vec3.createFromValues(origin);
	var d = vec3.createFromValues(direction);
	vec3.normalize(d,d);

	var ray = {origin:o, direction:d};
	return ray;
}

// intersect ray and bbox
function intersectRayBBox(ray, bbox) {
	// straight from the horse's mouth: Essential Math for Games, pg 569

	var maxS = 0;
	var minT = 50000;

	// x coordinate test
	var s, t;
	var recipX = 1.0 / ray.direction[0];
	if (recipX > 0) { 
		s = (bbox.min[0] - ray.origin[0])*recipX;
		t = (bbox.max[0] - ray.origin[0])*recipX;
	}
	else {
		s = (bbox.max[0] - ray.origin[0])*recipX;
		t = (bbox.min[0] - ray.origin[0])*recipX;

	}

	maxS = Math.max(maxS, s);
	minT = Math.min(minT, t);

	if (maxS > minT)
		return false;

	// y coordinate test
	var recipY = 1.0 / ray.direction[1];
	if (recipY > 0) { 
		s = (bbox.min[1] - ray.origin[1])*recipY;
		t = (bbox.max[1] - ray.origin[1])*recipY;
	}
	else {
		s = (bbox.max[1] - ray.origin[1])*recipY;
		t = (bbox.min[1] - ray.origin[1])*recipY;

	}

	maxS = Math.max(maxS, s);
	minT = Math.min(minT, t);

	if (maxS > minT)
		return false;


	// z coordinate test
	var recipZ = 1.0 / ray.direction[2];
	if (recipZ > 0) { 
		s = (bbox.min[2] - ray.origin[2])*recipZ;
		t = (bbox.max[2] - ray.origin[2])*recipZ;
	}
	else {
		s = (bbox.max[2] - ray.origin[2])*recipZ;
		t = (bbox.min[2] - ray.origin[2])*recipZ;

	}

	maxS = Math.max(maxS, s);
	minT = Math.min(minT, t);

	if (maxS > minT)
		return false;



	return true;
}

