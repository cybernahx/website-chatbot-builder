#!/bin/bash

# AI Real Estate Chatbot Builder - Quick Start Script
# This script helps you get started quickly

echo "🤖 AI Chatbot Builder - Quick Start"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✅ Node.js found: $(node -v)${NC}"

# Check if MongoDB is running
if ! pgrep -x mongod > /dev/null; then
    echo -e "${YELLOW}⚠️  MongoDB is not running${NC}"
    echo "Starting MongoDB..."
    mongod --fork --logpath /var/log/mongodb.log 2>/dev/null || {
        echo -e "${RED}❌ Failed to start MongoDB${NC}"
        echo "Please start MongoDB manually with: mongod"
    }
else
    echo -e "${GREEN}✅ MongoDB is running${NC}"
fi

# Navigate to backend
cd backend || exit

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env file${NC}"
    echo -e "${YELLOW}⚠️  Please edit .env and add your API keys:${NC}"
    echo "   - OPENAI_API_KEY (required)"
    echo "   - TWILIO_ACCOUNT_SID (optional)"
    echo "   - TWILIO_AUTH_TOKEN (optional)"
    echo ""
    read -p "Press Enter after updating .env to continue..."
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Dependencies installed${NC}"
    else
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

# Start the server
echo ""
echo "🚀 Starting server..."
echo ""
npm start
