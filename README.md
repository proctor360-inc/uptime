# Uptime Monitoring Server

A lightweight Node.js server built with Fastify that provides real-time system monitoring endpoints for disk space, memory usage, CPU usage, and thread count.

## Features

- **Disk Space Monitoring**: Check root filesystem usage with threshold-based alerts
- **Temporary Storage Monitoring**: Monitor `/tmp` directory usage
- **Memory Usage Tracking**: Real-time memory consumption monitoring
- **CPU Usage Monitoring**: Current CPU utilization tracking
- **Thread Count Monitoring**: File descriptor count for port 8888 processes
- **Threshold-based Alerts**: Different HTTP status codes based on usage levels

## Prerequisites

- Node.js (v14 or higher)
- Linux-based system (for system monitoring commands)
- Access to system monitoring tools (`df`, `free`, `top`, `lsof`)

## Installation

### Option 1: Manual Setup

1. Clone the project:
   ```bash
   git clone https://github.com/proctor360-inc/uptime.git
   cd uptime
   ```

2. Check for Node.js:
   ```bash
   node -v
   ```

3. If Node.js is not installed, install NVM and Node.js:
   ```bash
   # Install NVM
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
   export NVM_DIR="$HOME/.nvm"
   [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
   
   # Install Node.js 16.20.2
   nvm install 16.20.2
   nvm use 16.20.2
   ```

4. Install PM2 globally (if not already installed):
   ```bash
   npm install -g pm2
   ```

5. Install project dependencies:
   ```bash
   npm install
   ```

6. Start the server with PM2:
   ```bash
   pm2 start server.js --name uptime
   ```

### Option 2: Automated Setup

Download and run the setup script:
```bash
wget https://github.com/proctor360-inc/uptime/blob/main/setup.sh
chmod +x setup.sh
./setup.sh
```

### PM2 Management Commands

- View logs: `pm2 logs uptime`
- Check status: `pm2 status`
- Restart server: `pm2 restart uptime`
- Stop server: `pm2 stop uptime`
- Delete server: `pm2 delete uptime`

## Usage

### Starting the Server

```bash
node server.js
```

The server will start on port 6600 and listen on all interfaces (`0.0.0.0`).

### API Endpoints

#### 1. Server Status
**GET** `/`

Returns basic server status information including uptime and available endpoints.

**Response:**
```json
{
  "status": "Server is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": "2h 15m 30s",
  "uptimeSeconds": 8130,
  "port": 6600,
  "endpoints": {
    "/": "Server status",
    "/space": "Disk space usage",
    "/tmp": "Tmp storage usage",
    "/memory": "Memory usage",
    "/cpu": "CPU usage",
    "/threads": "Thread count"
  }
}
```

#### 2. Disk Space Check
**GET** `/space`

Returns disk usage information for the root filesystem (`/dev/root`).

**Response Examples:**
- **200 OK**: Usage < 70%
- **429 Too Many Requests**: Usage 70-90%
- **500 Internal Server Error**: Usage > 90%

```json
{
  "message": "Disk usage is within safe limits.",
  "details": {
    "filesystem": "/dev/root",
    "size": "20G",
    "used": "8.2G",
    "available": "11G",
    "usePercentage": "43%"
  }
}
```

#### 3. Temporary Storage Check
**GET** `/tmp`

Returns usage information for the `/tmp` directory.

**Response Examples:**
- **200 OK**: Usage < 70%
- **429 Too Many Requests**: Usage 70-90%
- **500 Internal Server Error**: Usage > 90%

```json
{
  "message": "Tmp storage usage is within safe limits.",
  "details": {
    "filesystem": "/dev/sda1",
    "size": "20G",
    "used": "1.2G",
    "available": "18G",
    "usePercentage": "6%"
  }
}
```

#### 4. Memory Usage Check
**GET** `/memory`

Returns current memory usage statistics.

**Response Examples:**
- **200 OK**: Usage < 70%
- **429 Too Many Requests**: Usage 70-90%
- **500 Internal Server Error**: Usage > 90%

```json
{
  "message": "Memory usage is within safe limits.",
  "details": {
    "total": 8192,
    "used": 4096,
    "free": 4096,
    "usage": 50
  }
}
```

#### 5. CPU Usage Check
**GET** `/cpu`

Returns current CPU utilization percentage.

**Response Examples:**
- **200 OK**: Usage < 70%
- **429 Too Many Requests**: Usage 70-90%
- **500 Internal Server Error**: Usage > 90%

```json
{
  "message": "CPU usage is within safe limits.",
  "details": {
    "usage": 25.5
  }
}
```

#### 6. Thread Count Check
**GET** `/threads`

Returns the number of file descriptors for processes using port 8888.

**Response Examples:**
- **200 OK**: Thread count < 4000
- **429 Too Many Requests**: Thread count 4000-5000
- **500 Internal Server Error**: Thread count > 5000

```json
{
  "message": "Thread count is within safe limits.",
  "details": {
    "threadCount": 1250
  }
}
```

## Thresholds

| Metric | Safe (< 70%) | Warning (70-90%) | Critical (> 90%) |
|--------|--------------|------------------|------------------|
| Disk Space | 200 OK | 429 Too Many Requests | 500 Internal Server Error |
| Tmp Storage | 200 OK | 429 Too Many Requests | 500 Internal Server Error |
| Memory Usage | 200 OK | 429 Too Many Requests | 500 Internal Server Error |
| CPU Usage | 200 OK | 429 Too Many Requests | 500 Internal Server Error |
| Thread Count | < 4000 | 4000-5000 | > 5000 |

## Error Handling

All endpoints return appropriate HTTP status codes and error messages when:
- System commands fail to execute
- Unexpected output formats are encountered
- System resources are critically high

## Dependencies

- **fastify**: High-performance web framework
- **child_process**: Node.js built-in module for executing system commands

## System Requirements

This server is designed for Linux systems and requires the following commands to be available:
- `df` - Disk space information
- `free` - Memory usage information
- `top` - CPU usage information
- `lsof` - Process and file descriptor information

## Security Considerations

- The server listens on all interfaces (`0.0.0.0`) - consider firewall rules
- System commands are executed with the same privileges as the Node.js process
- No authentication is implemented - consider adding authentication for production use

## Monitoring Integration

This server can be easily integrated with monitoring systems like:
- Prometheus
- Grafana
- Nagios
- Zabbix
- Custom monitoring dashboards

## License

This project is open source and available under the MIT License. 