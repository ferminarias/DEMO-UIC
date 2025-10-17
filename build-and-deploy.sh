#!/bin/bash

# Build and Deploy Script for DEMO-UIC with Vite
echo "🚀 Building DEMO-UIC with Vite..."

# Build the project
echo "📦 Building project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Copy built files to public directory for Vercel
    echo "📁 Copying built files..."
    cp -r dist/* public/
    
    echo "🎉 Ready for deployment!"
    echo "Run: npm run deploy"
else
    echo "❌ Build failed!"
    exit 1
fi
