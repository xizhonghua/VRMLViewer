#!/bin/bash
mkdir -p build

cd build
ln -s ../src/index.html .
ln -s ../src/js .
ln -s ../src/style .
ln -s ../src/textures .

cd ../