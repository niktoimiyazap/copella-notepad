/**
 * PM2 конфигурация для запуска серверов на VPS
 */

module.exports = {
  apps: [
    {
      name: 'copella-websocket',
      script: './server/start-websocket.ts',
      interpreter: 'node',
      interpreterArgs: '--import tsx',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        WS_PORT: 3001
      },
      error_file: './logs/websocket-error.log',
      out_file: './logs/websocket-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'copella-yjs',
      script: './server/start-yjs-websocket.ts',
      interpreter: 'node',
      interpreterArgs: '--import tsx',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        YJS_WS_PORT: 1234
      },
      error_file: './logs/yjs-error.log',
      out_file: './logs/yjs-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
