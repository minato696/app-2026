module.exports = {
  apps: [{
    name: 'radio-exitosa',
    script: 'npm',
    args: 'start',
    cwd: '/home/Radios/APP-WEB-EXITOSA-RADIOS',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 9544
    }
  }]
};
