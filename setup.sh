#!/bin/bash

# Exit on error
set -e

# Function to print messages
echo_info() {
  echo -e "\033[1;32m$1\033[0m"
}

echo_info "Cloning uptime project from GitHub..."
if [ -d "uptime" ]; then
  echo_info "Uptime directory already exists. Removing it..."
  rm -rf uptime
fi

git clone https://github.com/proctor360-inc/uptime.git
cd uptime

echo_info "Checking for Node.js..."
if ! command -v node &> /dev/null; then
  echo_info "Node.js not found. Checking for NVM..."
  if ! command -v nvm &> /dev/null; then
    echo_info "NVM not found. Installing NVM..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  else
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  fi

  echo_info "Installing Node.js 16.20.2..."
  nvm install 16.20.2
  nvm use 16.20.2
else
  echo_info "Node.js found. Current version:"
  node -v
fi

echo_info "Checking for pm2..."
if ! command -v pm2 &> /dev/null; then
  echo_info "pm2 not found. Installing pm2..."
  npm install -g pm2
fi

echo_info "Installing project dependencies..."
npm install

echo_info "Starting server with pm2 (name: alert)..."
pm2 start server.js --name uptime

echo_info "All done! Use 'pm2 logs alert' to view logs and 'pm2 status' to check status." 