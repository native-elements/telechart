#!/bin/bash

git pull origin master
npm run build
./make-sources-tar.sh