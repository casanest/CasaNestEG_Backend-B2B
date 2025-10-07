#!/bin/bash

# Post-build script to copy admin files to the correct location
echo "Copying admin build files to public directory..."

# Create public directory if it doesn't exist
mkdir -p public

# Copy admin build files
if [ -d ".medusa/server/public/admin" ]; then
  cp -r .medusa/server/public/admin public/
  echo "✓ Admin files copied successfully to public/admin/"
else
  echo "⚠ Warning: Admin build not found at .medusa/server/public/admin"
fi

