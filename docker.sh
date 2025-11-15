#!/bin/bash
# Docker management script for JANUS AI (Linux/macOS)

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

show_help() {
    cat << EOF
🐋 JANUS AI Docker Management Script

Usage: ./docker.sh <command> [service]

Commands:
  up          Start all services (production mode)
  down        Stop all services
  restart     Restart services
  logs        Show logs (add service name for specific service)
  build       Rebuild images
  status      Show status of all services
  clean       Remove all containers, volumes and images
  dev         Start in development mode

Examples:
  ./docker.sh up              # Start production
  ./docker.sh dev             # Start development
  ./docker.sh logs backend    # Show backend logs
  ./docker.sh restart frontend # Restart frontend only
  ./docker.sh clean           # Clean everything

EOF
}

check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running. Please start Docker.${NC}"
        exit 1
    fi
}

check_env() {
    if [ ! -f .env ]; then
        echo -e "${YELLOW}⚠️  .env file not found!${NC}"
        if [ -f .env.example ]; then
            echo -e "${YELLOW}Creating .env from .env.example...${NC}"
            cp .env.example .env
            echo -e "${GREEN}✅ .env file created. Please edit it with your values.${NC}"
            echo ""
            return 1
        else
            echo -e "${RED}❌ .env.example not found!${NC}"
            return 1
        fi
    fi
    return 0
}

# Check if Docker is running
check_docker

# Check for .env file
if ! check_env; then
    echo -e "${YELLOW}Please configure your .env file before continuing.${NC}"
    exit 1
fi

# Execute commands
case "$1" in
    up)
        echo -e "${GREEN}🚀 Starting JANUS AI in production mode...${NC}"
        docker-compose up -d
        echo ""
        echo -e "${GREEN}✅ Services started!${NC}"
        echo -e "${CYAN}Frontend: http://localhost:3000${NC}"
        echo -e "${CYAN}Backend:  http://localhost:5000${NC}"
        echo ""
        echo -e "${YELLOW}Run './docker.sh logs' to see logs${NC}"
        ;;
    
    dev)
        echo -e "${GREEN}🚀 Starting JANUS AI in development mode...${NC}"
        docker-compose -f docker-compose.dev.yml up -d
        echo ""
        echo -e "${GREEN}✅ Services started!${NC}"
        echo -e "${CYAN}Frontend: http://localhost:5173 (Vite dev server)${NC}"
        echo -e "${CYAN}Backend:  http://localhost:5000 (hot reload)${NC}"
        echo ""
        echo -e "${YELLOW}Run './docker.sh logs' to see logs${NC}"
        ;;
    
    down)
        echo -e "${YELLOW}🛑 Stopping services...${NC}"
        docker-compose down 2>/dev/null || true
        docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
        echo -e "${GREEN}✅ Services stopped${NC}"
        ;;
    
    restart)
        echo -e "${YELLOW}♻️  Restarting services...${NC}"
        if [ -n "$2" ]; then
            docker-compose restart "$2"
        else
            docker-compose restart
        fi
        echo -e "${GREEN}✅ Services restarted${NC}"
        ;;
    
    logs)
        if [ -n "$2" ]; then
            echo -e "${CYAN}📋 Showing logs for $2...${NC}"
            docker-compose logs -f "$2"
        else
            echo -e "${CYAN}📋 Showing all logs...${NC}"
            docker-compose logs -f
        fi
        ;;
    
    build)
        echo -e "${YELLOW}🔨 Building images...${NC}"
        docker-compose build --no-cache
        echo -e "${GREEN}✅ Build complete${NC}"
        ;;
    
    status)
        echo -e "${CYAN}📊 Services status:${NC}"
        echo ""
        docker-compose ps
        echo ""
        echo -e "${CYAN}💾 Disk usage:${NC}"
        docker system df
        ;;
    
    clean)
        echo -e "${RED}⚠️  WARNING: This will remove all containers, volumes and images!${NC}"
        read -p "Are you sure? (yes/no) " -r
        echo
        if [[ $REPLY == "yes" ]]; then
            echo -e "${YELLOW}🧹 Cleaning up...${NC}"
            docker-compose down -v 2>/dev/null || true
            docker-compose -f docker-compose.dev.yml down -v 2>/dev/null || true
            docker system prune -af --volumes
            echo -e "${GREEN}✅ Cleanup complete${NC}"
        else
            echo -e "${YELLOW}Cancelled${NC}"
        fi
        ;;
    
    *)
        show_help
        ;;
esac
