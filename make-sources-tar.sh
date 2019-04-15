#!/bin/bash

tar -czf dist/sources.tar.gz --exclude="node_modules" --exclude="package-lock.json" --exclude="dist/telechart.min.js" --exclude="dist/sources.tar.gz" * .gitignore
