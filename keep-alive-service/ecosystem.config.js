// PM2 Ecosystem Configuration for CoopWise Keep-Alive Service
module.exports = {
  apps: [
    {
      name: 'coopwise-keep-alive',
      script: 'keepAlive.js',
      cwd: '/path/to/keep-alive-service', // Update this path
      instances: 1,
      exec_mode: 'fork',
      
      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        LOG_LEVEL: 'info'
      },
      
      // Restart policy
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      restart_delay: 5000,
      
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Advanced settings
      kill_timeout: 5000,
      listen_timeout: 10000,
      
      // Health monitoring
      health_check_interval: 30000,
      
      // Environment-specific configurations
      env_development: {
        NODE_ENV: 'development',
        LOG_LEVEL: 'info',
        PING_INTERVAL_MINUTES: 14
      },
      
      env_staging: {
        NODE_ENV: 'staging',
        LOG_LEVEL: 'warn',
        PING_INTERVAL_MINUTES: 14
      },
      
      env_production: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'error',
        PING_INTERVAL_MINUTES: 14
      }
    }
  ],
  
  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-org/coopwise.git',
      path: '/var/www/coopwise-keep-alive',
      'post-deploy': 'cd keep-alive-service && npm install && pm2 startOrRestart ecosystem.config.js --env production',
      'pre-setup': 'mkdir -p /var/www/coopwise-keep-alive/keep-alive-service/logs',
      env: {
        NODE_ENV: 'production'
      }
    }
  }
}; 