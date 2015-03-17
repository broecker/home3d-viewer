cmake_minimum_required (VERSION 2.6)


# setup project info
project (pcl2blob)

set (DeltaFrame_VERSION_MIN_VERSION_MAJ 1)
set (DeltaFrame_VERSION_MIN_VERSION_MIN 0)

include_directories("${PROJECT_BINARY_DIR}" "/mnt/ws/home/mbroecker/include")
include_directories("${PROJECT_BINARY_DIR}" ".")
include_directories("${PROJECT_BINARY_DIR}" "/usr/local/include")
link_directories("/mnt/ws/home/mbroecker/lib")

# add boost
set(Boost_USE_MULTITHREAD ON) #set a flag
find_package (Boost)
include_directories(${include_directories} ${Boost_INCLUDE_DIRS})
link_directories(${link_directories} ${Boost_LIBRARY_DIRS})

# add eigen
include_directories(${include_directories} "/mnt/ws/home/mbroecker/include/eigen3")

# add pcl libraries
include_directories(${include_directories} "/mnt/ws/home/mbroecker/include/pcl-1.7")
link_directories(${link_directories} "/mnt/ws/home/mbroecker/lib")

# add glm
include_directories(${include_directories} "/mnt/ws/home/mbroecker/include/glm")

# set no-graphis
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -DNO_GRAPHICS -DENABLE_PCL -DNO_TIMER -Wall -std=c++0x -fopenmp")

# add source file to executable
add_executable(pcl2blob main.cpp)
target_link_libraries (pcl2blob pcl_common pcl_io)


