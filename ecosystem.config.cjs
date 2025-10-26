module.exports = {
  apps: [
    {
      name: 'copella-websocket',
      script: 'server/start-websocket.ts',
      interpreter: 'node',
      interpreter_args: '--import tsx',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '~/.pm2/logs/copella-websocket-error.log',
      out_file: '~/.pm2/logs/copella-websocket-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'copella-signaling',
      script: 'server/start-signaling.ts',
      interpreter: 'node',
      interpreter_args: '--import tsx',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '~/.pm2/logs/copella-signaling-error.log',
      out_file: '~/.pm2/logs/copella-signaling-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};

