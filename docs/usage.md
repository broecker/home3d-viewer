# Under the hood
This document shows how to prepare data for the webviewer and how to hack it.

## Passing parameters
The viewer is started by passing a GET query to the viewer.html with the following parameter: `id=[id_name]`
If this request cannot be fulfilled, the viewer tries to load the dataset in `[data/undefined]`, which will usually fail.

The id passed is usually a single string identifier but can be anything which is allowed to be a folder name. In our example, I used id names such as `son, apartment2, test` etc.


## Folder structure
Internally, the data accessed must be stored relative to the viewer.html in the folder `./data/[id_name]`. 

The complete folder structure underneath `htdocs`looks like this: 
    
    - data/
    - images/
    - scripts/
    - shaders/
    - styles/
    - index.html
    - viewer.html


Place all your created files into a new folder in `data/`. The folder will be used as the identifier for the GET request. For example, let's say we create a new *test* data set. `htdocs/data/` will then look like:

	- data/test/
    -   octree.json
    - 	metadata.json
    - 	registration.json
    - 	node-0111.blob
    - 	node-0102.blob
    - 	node-0103.blob
    - 	....

### Description of Files
`octree.json` is the description of the octree and will reference all the nodes blob files. It is created through the `makeoctree` tool. Apart from renaming it you should not touch the contents at all. The file name must be the folder name. This file is essential and *must* be present.

`metadata.json` is a description of the metadata contents of the scan. For example, in an apartment it contains all the oriented bounding boxes of all the furniture, etc. If the file is not present no metadata will be displayed. Create this file by either copy-pasting and editing an existing one or by running the `createMetadata' tool on an exported VizHome segmentation list. 

`registration.json` is an optional json file that contains a translation offset from the metadata to the point data. Use an existing registration file as a starting point.

## Creating data for the webviewer
The base data is an XYZ point cloud exported from scene. Each line in the file should have 6 values: `X Y Z R G B` describing the original points in absolute world coordinates. Run the `makeOctree` tool (found in the tools folder; must be built) by dragging-dropping an xyz file onto it. The tool should auto-detect the number of input coordinates, but there are also options to specify how to read the file (all found in the source code). Normals are ignored for now. 

One important option is the `-maxPoint <NNNN>` flag which specifies to how many points *in total* this data set should be subsampled to. For example, let's say the initial data set has some 150 million points then the flag `-maxPoints 1500000` will resample the point cloud to 1.5 million points by dropping points evenly. 

The tool will create the octree hierarchy consisting of lots of `node-XXXX` files, each depicting a single octant in the tree. It will also create a json file describing the hierarchy. Make sure the output file is called `octree.json`.

Once all files are created they can be copied to a new folder within the data directory. 

## Creating the metadata
The metadata is build on the export from the VizHome segmentation process. The `createMetadata` tool (in the tools folder, must be built) takes the input file and creates a json file from it. In windows, just drag'n'drop the input file onto it. 

As the segmentation process retains global bounding boxes of the scans, they must be removed from the metadata file. These boxes usually contain the string `_scan_001.` or similar in the name. Also, double-check all Getty AAT terms and manually copy-past the correct links into the fields. This is a good data entry/student job. 

Finally, rename this file `metadata.json` and place it into the same folder as the rest.

# Notes on Display, Rendering and Shaders
Scene creates point clouds in a left-handed coordinate system with **z** pointing upwards, while the webviewer expects a right-handed coordinate system with **y** pointing upwards. `makeOctree` has a flag that flips YZ, but the `createMetadata` tool does not (currently). 

A quick hack is currently involved which swizzles the **Y** and **Z** coordinate in the shaders for both points and metadata bounding box rendering. This leads to correct display but does not provide correct bounding boxes for culling. In most cases it still works acceptably. 

# Changelog and notes
- 8/17/2016 Updated octree.json description
- 8/16/2016 Started working on this documentation
