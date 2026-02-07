#!/bin/bash

# This script prepares the Lambda function for deployment.
# It installs dependencies into a 'package' directory,
# adds the Lambda function code to it, and creates a zip archive.

# Stop on any error
set -e

# Define directory and file names
LAMBDA_DIR="$(dirname "$0")"
FUNCTION_FILE="get_medical_device_details.py"
REQUIREMENTS_FILE="requirements.txt"
OUTPUT_ZIP="get_medical_device_details.zip"
PACKAGE_DIR="package"

# Change to the Lambda directory
cd "$LAMBDA_DIR"

# Clean up previous build artifacts
rm -rf "$PACKAGE_DIR" "$OUTPUT_ZIP"

# Install dependencies into the package directory
pip install --target "./$PACKAGE_DIR" -r "$REQUIREMENTS_FILE"

# Copy the Lambda function code into the package directory
cp "$FUNCTION_FILE" "$PACKAGE_DIR/"

# Go into the package directory and zip its contents
cd "$PACKAGE_DIR"
zip -r "../$OUTPUT_ZIP" .

# Return to the original directory and clean up the package directory
cd ..
rm -rf "$PACKAGE_DIR"

echo "Lambda package created successfully at: $LAMBDA_DIR/$OUTPUT_ZIP"
