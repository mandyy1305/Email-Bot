#!/bin/bash

# Email Bot Development Startup Script
# This script starts both the API server and the email worker

echo "🚀 Starting Email Bot Backend Development Environment..."

# Check if Redis is running
if ! redis-cli ping > /dev/null 2>&1; then
    echo "❌ Redis is not running. Please start Redis first:"
    echo "   sudo systemctl start redis-server"
    echo "   # or"
    echo "   redis-server"
    exit 1
fi

echo "✅ Redis is running"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create required directories
mkdir -p logs uploads

echo "🌐 Starting API Server and Email Worker..."

# Start both API server and worker using concurrently
npm run start:all