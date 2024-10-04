module.exports = {
  apps: [
      {
          name: 'khu_mileage',
          script: './src/index.js',
          watch: true,
          env: {
              NODE_ENV: 'test',
          },
      },
  ],
};

