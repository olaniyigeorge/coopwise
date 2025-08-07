# CoopWise Keep-Alive Service

A Node.js service designed to keep your CoopWise backend awake on Render's free tier by pinging it every 14 minutes to prevent the 15-minute idle timeout.

## 🎯 Purpose

Render's free tier puts services to sleep after 15 minutes of inactivity, causing cold starts that can take up to a minute. This service prevents that by sending automated pings to keep your backend active.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd keep-alive-service
npm install
```

### 2. Configure Environment

Copy the example environment file and configure it:

```bash
cp env.example .env
```

Edit `.env` with your settings:

```env
BACKEND_URL=https://your-coopwise-app.onrender.com
KEEP_ALIVE_ENDPOINT=/ping
PING_INTERVAL_MINUTES=14
LOG_LEVEL=info
PORT=3001
```

### 3. Run the Service

#### Development
```bash
npm start
# or
npm run dev
```

#### Production with PM2
```bash
npm run pm2:start
```

#### Production with nohup
```bash
nohup npm start &
```

## 📁 Project Structure

```
keep-alive-service/
├── keepAlive.js       # Main service file
├── package.json       # Dependencies and scripts
├── env.example        # Environment variables template
└── README.md         # This file
```

## ⚙️ Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKEND_URL` | `https://coopwise.onrender.com` | Your CoopWise backend URL |
| `KEEP_ALIVE_ENDPOINT` | `/ping` | Endpoint to ping |
| `PING_INTERVAL_MINUTES` | `14` | How often to ping (should be < 15) |
| `LOG_LEVEL` | `info` | Logging level (info, warn, error) |
| `PORT` | `3001` | Port for health check server |

## 🔍 Monitoring

The service includes a built-in health check server:

- **Health Check**: `GET http://localhost:3001/health`
- **Manual Ping**: `POST http://localhost:3001/ping-now`

### Health Check Response
```json
{
  "status": "healthy",
  "service": "coopwise-keep-alive",
  "uptime": 3600,
  "timestamp": "2025-01-27T10:30:00.000Z",
  "config": {
    "backendUrl": "https://coopwise.onrender.com",
    "pingInterval": "14 minutes",
    "nextPing": "2025-01-27T10:44:00.000Z"
  }
}
```

## 📊 Logging

The service provides detailed logging with timestamps:

```
✅ [2025-01-27T10:30:00.000Z] Backend ping successful (245ms) - Status: 200
⚠️  [2025-01-27T10:44:00.000Z] Backend ping returned unexpected status: 503 (1200ms)
❌ [2025-01-27T10:58:00.000Z] Backend ping failed (30000ms): timeout
```

## 🐳 Deployment Options

### Option 1: Separate Render Service (Recommended)

Deploy this as a separate Node.js service on Render:

1. Create a new Web Service on Render
2. Connect your repository
3. Set build command: `cd keep-alive-service && npm install`
4. Set start command: `cd keep-alive-service && npm start`
5. Add environment variables in Render dashboard

### Option 2: Local/VPS Deployment

Run on a local machine or VPS that stays online:

```bash
# Install PM2 globally
npm install -g pm2

# Start the service
npm run pm2:start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Option 3: GitHub Actions (Advanced)

Create a scheduled GitHub Action that pings your backend:

```yaml
# .github/workflows/keep-alive.yml
name: Keep Backend Alive
on:
  schedule:
    - cron: '*/14 * * * *'  # Every 14 minutes
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Backend
        run: curl -f ${{ secrets.BACKEND_URL }}/ping || exit 1
```

## 🛠️ PM2 Commands

```bash
# Start service
npm run pm2:start

# Stop service
npm run pm2:stop

# Restart service
npm run pm2:restart

# View logs
npm run pm2:logs

# Check status
pm2 status

# Monitor in real-time
pm2 monit
```

## 🔧 Backend Integration

The service expects a `/ping` endpoint on your backend. The CoopWise backend already includes this endpoint in `main.py`:

```python
@app.get("/ping")
async def ping_keep_alive(request: Request):
    """Keep-alive endpoint for preventing Render free tier sleep."""
    from datetime import datetime
    
    logger.info(f"Keep-alive ping received at {datetime.now().isoformat()}")
    return {
        "message": "Pong",
        "status": "alive",
        "timestamp": datetime.now().isoformat(),
        "service": "CoopWise Backend API"
    }
```

## 🚨 Troubleshooting

### Service Won't Start
- Check that all environment variables are set correctly
- Ensure Node.js version is compatible (v14+)
- Verify the backend URL is accessible

### Pings Failing
- Check if the backend is actually running
- Verify the endpoint path is correct
- Check network connectivity
- Look at the service logs for detailed error messages

### High Resource Usage
- The service is designed to be lightweight
- If you notice high CPU/memory usage, check for memory leaks
- Consider adjusting the ping interval if needed

## 📈 Best Practices

1. **Monitoring**: Set up alerts for failed pings
2. **Logging**: Keep logs for debugging and monitoring
3. **Redundancy**: Consider running multiple keep-alive services
4. **Environment**: Use different configurations for dev/staging/prod
5. **Security**: Don't expose sensitive information in logs

## 🤝 Contributing

Feel free to improve this service:
- Add more robust error handling
- Implement retry logic for failed pings
- Add metrics collection
- Improve logging and monitoring

## 📄 License

This service is part of the CoopWise project and follows the same licensing terms. 