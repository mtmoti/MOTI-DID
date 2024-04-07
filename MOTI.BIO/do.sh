#!/bin/bash

# Check if a directory was provided as an argument
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <directory_path>"
    exit 1
fi

# Directory containing the .js files (taken from the first script argument)
DIRECTORY=$1

# Output file
OUTPUT_FILE=./combined.js

# Check if output file already exists and remove it to start fresh
if [ -f "$OUTPUT_FILE" ]; then
    rm "$OUTPUT_FILE"
fi

# Check if the directory exists
if [ ! -d "$DIRECTORY" ]; then
    echo "The specified directory does not exist."
    exit 1
fi

# Find all .js files in the directory, excluding node_modules and build folders
find "$DIRECTORY" -type f -name '*.js' ! -path "*/node_modules/*" ! -path "*/build/*" | while read FILE; do
    # Append a comment with the file name
    echo "/* File: $(basename "$FILE") */" >> "$OUTPUT_FILE"
    # Append the content of the .js file to the output file
    cat "$FILE" >> "$OUTPUT_FILE"
    # Optionally, append a newline for better separation
    echo "" >> "$OUTPUT_FILE"
done

echo "All .js files have been combined into $OUTPUT_FILE."
