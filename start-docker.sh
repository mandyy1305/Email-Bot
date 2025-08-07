#!/bin/bash

echo "🚀 Starting Email Bot Application with Docker"
echo "============================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    echo "❌ Error: Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

# Check if .env file exists
if [ ! -f "docker.env" ]; then
    echo "⚠️  Warning: docker.env file not found. Creating from example..."
    if [ -f "docker.env.example" ]; then
        cp docker.env.example docker.env
        echo "📝 Please edit docker.env file with your email configuration:"
        echo "   - SMTP_USER: Your email address"
        echo "   - SMTP_PASSWORD: Your email app password"
        echo "   - EMAIL_FROM: Your sender email"
        echo "   - EMAIL_SENDER_NAME: Your name"
        echo ""
        echo "Press Enter after updating docker.env file, or Ctrl+C to exit..."
        read -r
    else
        echo "❌ Error: docker.env.example not found. Please create docker.env file manually."
        exit 1
    fi
fi

echo "🏗️  Building and starting services..."

# Start the application
if [ "$1" = "dev" ]; then
    echo "🔧 Starting in development mode with admin tools..."
    docker-compose --profile dev up -d --build
else
    echo "🚀 Starting in production mode..."
    docker-compose up -d --build
fi

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🩺 Checking service health..."
echo ""

services=("email-bot-mongodb" "email-bot-redis" "email-bot-backend" "email-bot-worker" "email-bot-frontend")
all_healthy=true

for service in "${services[@]}"; do
    if docker ps --filter "name=$service" --filter "status=running" | grep -q $service; then
        health=$(docker inspect --format='{{.State.Health.Status}}' $service 2>/dev/null || echo "no-healthcheck")
        if [ "$health" = "healthy" ] || [ "$health" = "no-healthcheck" ]; then
            echo "✅ $service: Running"
        else
            echo "⚠️  $service: $health"
            all_healthy=false
        fi
    else
        echo "❌ $service: Not running"
        all_healthy=false
    fi
done

echo ""

if [ "$all_healthy" = true ]; then
    echo "🎉 All services are running successfully!"
    echo ""
    echo "📱 Access your application:"
    echo "   Frontend:     http://localhost:3000"
    echo "   Backend API:  http://localhost:3001"
    echo "   Health Check: http://localhost:3001/health"
    
    if [ "$1" = "dev" ]; then
        echo ""
        echo "🔧 Development tools:"
        echo "   MongoDB Express: http://localhost:8081 (admin/admin123)"
        echo "   Redis Commander: http://localhost:8082"
    fi
    
    echo ""
    echo "📊 Useful commands:"
    echo "   View logs:        docker-compose logs -f"
    echo "   Stop services:    docker-compose down"
    echo "   Restart:          docker-compose restart"
    echo "   View status:      docker-compose ps"
else
    echo "⚠️  Some services are not healthy. Check the logs:"
    echo "   docker-compose logs"
    exit 1
fi