#!/bin/bash

# ===================================
# Privylm Deployment Script for Railway
# ===================================
# This script automates the deployment process
# ===================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    local missing=0
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js not found. Please install Node.js 20+"
        missing=1
    else
        local node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$node_version" -lt 20 ]; then
            print_error "Node.js version must be 20 or higher (current: $(node -v))"
            missing=1
        else
            print_success "Node.js $(node -v) installed"
        fi
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm not found"
        missing=1
    else
        print_success "npm $(npm -v) installed"
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        print_error "Git not found"
        missing=1
    else
        print_success "Git $(git --version | cut -d' ' -f3) installed"
    fi
    
    # Check Railway CLI
    if ! command -v railway &> /dev/null; then
        print_warning "Railway CLI not installed. Install with: npm install -g @railway/cli"
    else
        print_success "Railway CLI installed"
    fi
    
    if [ $missing -eq 1 ]; then
        print_error "Please install missing prerequisites and run again"
        exit 1
    fi
}

# Check Git repository
check_git_repo() {
    print_header "Checking Git Repository"
    
    if [ ! -d ".git" ]; then
        print_error "Not a git repository. Initialize with: git init"
        exit 1
    fi
    
    local remote_url=$(git remote get-url origin 2>/dev/null || echo "")
    if [ -z "$remote_url" ]; then
        print_warning "No remote repository configured"
        echo "Add your GitHub repository:"
        echo "  git remote add origin https://github.com/YOUR_USERNAME/privylm.git"
        echo ""
        read -p "Press Enter after adding remote..."
    else
        print_success "Remote repository: $remote_url"
    fi
}

# Install dependencies
install_dependencies() {
    print_header "Installing Dependencies"
    
    echo "Installing client dependencies..."
    cd client
    npm ci
    cd ..
    print_success "Client dependencies installed"
    
    echo "Installing server dependencies..."
    cd server
    npm ci
    cd ..
    print_success "Server dependencies installed"
}

# Generate Prisma client
generate_prisma() {
    print_header "Generating Prisma Client"
    
    cd server
    npx prisma generate
    cd ..
    print_success "Prisma client generated"
}

# Run local tests
run_tests() {
    print_header "Running Tests (Optional)"
    
    read -p "Run local tests before deployment? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Running client lint..."
        cd client
        npm run lint || print_warning "Client lint failed"
        cd ..
        
        echo "Running server lint..."
        cd server
        npm run lint || print_warning "Server lint failed"
        cd ..
        
        print_success "Tests completed"
    fi
}

# Commit and push changes
push_to_github() {
    print_header "Pushing to GitHub"
    
    git status
    
    read -p "Commit and push changes? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Commit message: " commit_msg
        git add .
        git commit -m "$commit_msg"
        git push origin main
        print_success "Changes pushed to GitHub"
    else
        print_warning "Skipping push. Remember to push before deploying!"
    fi
}

# Railway login
railway_login() {
    print_header "Railway Authentication"
    
    if ! command -v railway &> /dev/null; then
        print_error "Railway CLI not installed"
        echo "Install with: npm install -g @railway/cli"
        return
    fi
    
    railway whoami &> /dev/null
    if [ $? -ne 0 ]; then
        echo "Logging in to Railway..."
        railway login
        print_success "Logged in to Railway"
    else
        print_success "Already logged in to Railway"
    fi
}

# Display next steps
display_next_steps() {
    print_header "Deployment Checklist"
    
    echo -e "${GREEN}✓${NC} Code pushed to GitHub"
    echo -e "${YELLOW}○${NC} Create Railway project from GitHub repo"
    echo -e "${YELLOW}○${NC} Add PostgreSQL database in Railway"
    echo -e "${YELLOW}○${NC} Add Redis/Valkey database in Railway"
    echo -e "${YELLOW}○${NC} Add Qdrant service in Railway"
    echo -e "${YELLOW}○${NC} Deploy server service (root: server, Dockerfile: Dockerfile.railway)"
    echo -e "${YELLOW}○${NC} Deploy client service (root: client)"
    echo -e "${YELLOW}○${NC} Configure environment variables (see server/.env.example and client/.env.example)"
    echo -e "${YELLOW}○${NC} Run Prisma migrations on Railway PostgreSQL"
    echo -e "${YELLOW}○${NC} Update Clerk allowed origins with Railway domains"
    echo -e "${YELLOW}○${NC} Update Appwrite allowed origins with Railway domains"
    echo -e "${YELLOW}○${NC} Test deployment"
    echo ""
    print_info "Next steps:"
    echo "1. Go to https://railway.app and create a new project"
    echo "2. Deploy from your GitHub repository"
    echo "3. Add the required services (PostgreSQL, Redis, Qdrant)"
    echo "4. Configure environment variables using the .env.example files as reference"
    echo "5. Monitor deployment in Railway dashboard"
    echo ""
    echo "For detailed instructions, see DEPLOYMENT.md"
}

# Main execution
main() {
    print_header "🚀 Privylm Railway Deployment Script"
    
    echo "This script will help you prepare for deployment to Railway"
    echo ""
    
    check_prerequisites
    check_git_repo
    install_dependencies
    generate_prisma
    run_tests
    push_to_github
    railway_login
    display_next_steps
    
    print_header "Preparation Complete!"
    print_success "Your code is ready for deployment"
}

# Run main function
main
