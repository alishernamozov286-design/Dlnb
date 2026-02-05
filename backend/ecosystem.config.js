module.exports = {
  apps: [{
    name: 'mator-life-backend',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 4000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    shutdown_with_message: true
  }]
};
