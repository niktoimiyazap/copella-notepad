/**
 * PM2 конфигурация для WebSocket серверов
 */

module.exports = {
  apps: [
    {
      name: 'copella-yjs',
      script: './server/start-yjs-websocket.ts',
      interpreter: 'node',
      interpreterArgs: '--import tsx',
      instances: 1,
      exec_mode: 'fork',
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
    },
    {
      name: 'copella-notifications',
      script: './server/start-notifications.ts',
      interpreter: 'node',
      interpreterArgs: '--import tsx',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        NOTIFICATIONS_PORT: 3001
      },
      error_file: './logs/notifications-error.log',
      out_file: './logs/notifications-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
