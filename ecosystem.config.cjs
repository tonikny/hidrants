module.exports = {
  apps: [
    {
      name: 'api',
      cwd: './back',
      script: './dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      env: {
        NODE_ENV: 'production',
        PORT: 3033,
      },
    },
  ],
};
