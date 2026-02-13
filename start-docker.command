#!/bin/bash
# Script to run the Docker environment
echo "🚀 Checking Partes App environment..."

# Ensure we have permissions
chmod +x ./php-backend 2>/dev/null
chmod +x ./start-docker.command 2>/dev/null

# Check current status
RUNNING_COUNT=$(docker compose ps --filter "status=running" -q | wc -l | xargs)
TOTAL_COUNT=$(docker compose ps -a -q | wc -l | xargs)

if [ "$RUNNING_COUNT" -gt 0 ] && [ "$RUNNING_COUNT" -eq "$TOTAL_COUNT" ] && [ "$TOTAL_COUNT" -gt 0 ]; then
    echo "✨ All containers are already running."
else
    if [ "$TOTAL_COUNT" -gt 0 ]; then
        echo "🔄 Starting existing containers..."
    else
        echo "📦 Creating and starting containers..."
    fi
    
    # We use 'up -d' without '--build' to prevent creating <none> (dangling) images.
    # If the images don't exist, Compose will build them automatically.
    docker compose up -d
fi

# Clean up dangling images (those showing as <none>) to keep your disk clean
DANGLING_IMAGES=$(docker images -f "dangling=true" -q)
if [ -n "$DANGLING_IMAGES" ]; then
    echo "🧹 Cleaning up old/unused images..."
    docker image prune -f > /dev/null
fi

echo ""
echo "✅ Environment Ready!"
echo "------------------------------------------------"
echo "🖥️  Frontend: http://localhost:5173"
echo "🔌 API:      http://localhost:8000"
echo "🗄️  Database: port 3306 (user: root, pass: root)"
echo "👀 PHPMyAdmin: http://localhost:8080"
echo "------------------------------------------------"
echo "LOGS (Type Ctrl+C to stop viewing logs, containers will keep running):"
docker compose logs -f --tail=20

