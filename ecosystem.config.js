module.exports = {
  apps: [
    {
      name: 'lead-frontend',
      script: 'node_modules/.bin/tsx',
      args: 'server.ts',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
