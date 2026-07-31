#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Output folder and files
OUTPUT_DIR="dev/bundle"
UNZIP_DIR="$OUTPUT_DIR/click-to-chat-files"
ZIP_FILE="$OUTPUT_DIR/click-to-chat-files.zip"

# Clean up existing files
rm -rf "$UNZIP_DIR" "$ZIP_FILE"

echo "Creating unzipped folder and zip file..."

# Create unzipped folder
mkdir -p "$UNZIP_DIR"

rsync -a --exclude=".*" --exclude="*/.*" --exclude="_*" --exclude="*/_*" click-to-chat-files.php readme.txt index.php admin admin2 inc tools "$UNZIP_DIR/"

# Remove any lingering hidden files or folders starting with . or _
find "$UNZIP_DIR" -name ".*" -exec rm -rf {} +
find "$UNZIP_DIR" -name "_*" -exec rm -rf {} +

# Create ZIP file from the valid unzipped folder
cd "$UNZIP_DIR"
zip -r "../click-to-chat-files.zip" .  -x "*/.*" -x ".*" -x "*/_*" -x "_*"

echo "✅ Unzipped folder created: $UNZIP_DIR"
echo "✅ ZIP file created: $ZIP_FILE"
