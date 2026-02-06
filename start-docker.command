#!/bin/bash
# Script to run the Docker environment
echo "🚀 Starting Partes App in Docker (LAMP Stack)..."

# Ensure we have permissions for volumes script
chmod +x ./php-backend
chmod +x ./start-docker.command

# Build and Start
docker compose up --build -d

echo ""
echo "✅ Environment Started!"
echo "------------------------------------------------"
echo "🖥️  Frontend: http://localhost:5173"
echo "🔌 API:      http://localhost:8000"
echo "🗄️  Database: port 3306 (user: root, pass: root)"
echo "👀 PHPMyAdmin: http://localhost:8080"
echo "------------------------------------------------"
echo "LOGS (Frontend & Backend):"
docker compose logs -f
