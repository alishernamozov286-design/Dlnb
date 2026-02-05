#!/bin/bash

# ============================================
# Production Management Helper Script
# ============================================
# Quick commands for managing your production deployment

set -e

PROJECT_NAME=${PROJECT_NAME:-biznes}
COMPOSE_FILE="docker-compose.production.yml"
ENV_FILE=".env.production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Error: $ENV_FILE not found!${NC}"
    echo "Please create it from .env.production.template"
    exit 1
fi

# Load environment
export $(cat $ENV_FILE | grep -v '^#' | xargs)

# Helper function
show_help() {
    echo -e "${BLUE}🚀 Production Management Commands${NC}"
    echo ""
    echo "Usage: ./manage.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start       - Start all services"
    echo "  stop        - Stop all services"
    echo "  restart     - Restart all services"
    echo "  status      - Show service status"
    echo "  logs        - Show logs (all services)"
    echo "  logs-f      - Follow logs (all services)"
    echo "  logs-be     - Show backend logs"
    echo "  logs-fe     - Show frontend logs"
    echo "  logs-db     - Show MongoDB logs"
    echo "  health      - Check backend health"
    echo "  backup      - Backup MongoDB"
    echo "  restore     - Restore MongoDB (requires backup folder name)"
    echo "  stats       - Show container resource usage"
    echo "  clean       - Clean up unused Docker resources"
    echo "  update      - Pull latest code and redeploy"
    echo "  shell-be    - Open shell in backend container"
    echo "  shell-db    - Open MongoDB shell"
    echo "  ports       - Check port availability"
    echo "  help        - Show this help"
    echo ""
}

# Commands
case "$1" in
    start)
        echo -e "${GREEN}🚀 Starting services...${NC}"
        docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d
        echo -e "${GREEN}✅ Services started${NC}"
        ;;
    
    stop)
        echo -e "${YELLOW}🛑 Stopping services...${NC}"
        docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE down
        echo -e "${GREEN}✅ Services stopped${NC}"
        ;;
    
    restart)
        echo -e "${YELLOW}🔄 Restarting services...${NC}"
        docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE restart
        echo -e "${GREEN}✅ Services restarted${NC}"
        ;;
    
    status)
        echo -e "${BLUE}📊 Service Status:${NC}"
        docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE ps
        ;;
    
    logs)
        docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE logs --tail=100
        ;;
    
    logs-f)
        echo -e "${BLUE}📋 Following logs (Ctrl+C to exit)...${NC}"
        docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE logs -f
        ;;
    
    logs-be)
        echo -e "${BLUE}📋 Backend logs:${NC}"
        docker logs ${PROJECT_NAME}-backend --tail=100 -f
        ;;
    
    logs-fe)
        echo -e "${BLUE}📋 Frontend logs:${NC}"
        docker logs ${PROJECT_NAME}-frontend --tail=100 -f
        ;;
    
    logs-db)
        echo -e "${BLUE}📋 MongoDB logs:${NC}"
        docker logs ${PROJECT_NAME}-mongodb --tail=100 -f
        ;;
    
    health)
        echo -e "${BLUE}🏥 Checking backend health...${NC}"
        if curl -f http://localhost:${BACKEND_PORT}/api/health 2>/dev/null; then
            echo -e "${GREEN}✅ Backend is healthy!${NC}"
        else
            echo -e "${RED}❌ Backend health check failed!${NC}"
            exit 1
        fi
        ;;
    
    backup)
        BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
        echo -e "${BLUE}💾 Creating MongoDB backup: $BACKUP_DIR${NC}"
        docker exec ${PROJECT_NAME}-mongodb mongodump \
            --username admin \
            --password ${MONGO_ROOT_PASSWORD} \
            --authenticationDatabase admin \
            --db ${DB_NAME} \
            --out /backup/$BACKUP_DIR
        echo -e "${GREEN}✅ Backup created: ./mongodb-backup/$BACKUP_DIR${NC}"
        ;;
    
    restore)
        if [ -z "$2" ]; then
            echo -e "${RED}❌ Error: Please provide backup folder name${NC}"
            echo "Usage: ./manage.sh restore BACKUP_FOLDER_NAME"
            echo "Available backups:"
            ls -1 ./mongodb-backup/ 2>/dev/null || echo "No backups found"
            exit 1
        fi
        echo -e "${YELLOW}⚠️  Restoring MongoDB from: $2${NC}"
        read -p "This will overwrite current data. Continue? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker exec ${PROJECT_NAME}-mongodb mongorestore \
                --username admin \
                --password ${MONGO_ROOT_PASSWORD} \
                --authenticationDatabase admin \
                --db ${DB_NAME} \
                --drop \
                /backup/$2/${DB_NAME}
            echo -e "${GREEN}✅ Restore completed${NC}"
        else
            echo -e "${YELLOW}Restore cancelled${NC}"
        fi
        ;;
    
    stats)
        echo -e "${BLUE}📊 Container Resource Usage:${NC}"
        docker stats --no-stream ${PROJECT_NAME}-backend ${PROJECT_NAME}-frontend ${PROJECT_NAME}-mongodb
        ;;
    
    clean)
        echo -e "${YELLOW}🧹 Cleaning up Docker resources...${NC}"
        docker system prune -f
        echo -e "${GREEN}✅ Cleanup completed${NC}"
        ;;
    
    update)
        echo -e "${BLUE}🔄 Updating application...${NC}"
        git pull
        echo -e "${BLUE}🏗️  Rebuilding and redeploying...${NC}"
        ./deploy.sh
        ;;
    
    shell-be)
        echo -e "${BLUE}🐚 Opening backend shell...${NC}"
        docker exec -it ${PROJECT_NAME}-backend sh
        ;;
    
    shell-db)
        echo -e "${BLUE}🐚 Opening MongoDB shell...${NC}"
        docker exec -it ${PROJECT_NAME}-mongodb mongosh \
            -u admin \
            -p ${MONGO_ROOT_PASSWORD} \
            --authenticationDatabase admin \
            ${DB_NAME}
        ;;
    
    ports)
        echo -e "${BLUE}🔍 Checking ports...${NC}"
        ./check-ports.sh
        ;;
    
    help|"")
        show_help
        ;;
    
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
