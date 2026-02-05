module.exports = {
  apps: [{
    name: 'dlnb-backend',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
      PORT: 4002,
      HOST: '0.0.0.0'
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 4000,
      HOST: '127.0.0.1'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    shutdown_with_message: true,
    // Restart on file changes (optional)
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    // Cron restart (optional - restart every day at 3 AM)
    cron_restart: '0 3 * * *',
    // Exponential backoff restart delay
    exp_backoff_restart_delay: 100,
    // Max restarts in 1 minute
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
