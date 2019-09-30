module.exports = {
  apps: [{
    name: 'jobhunt-api',
    script: './build/server.js',
    instances: 1,
    watch: ['build'],
    ignore_watch: ['node_modules', 'mnt']
  }]
}
