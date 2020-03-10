module.exports = {
  apps: [{
    name: 'cenvi-api',
    script: './build/server.js',
    instances: 1,
    watch: ['build'],
    ignore_watch: ['node_modules', 'mnt', 'tmp'],
    env: {
      NODE_ENV: 'production'
    }
  }]
}
