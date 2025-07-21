# 취약점 없는 버전 with node 24.0.1
FROM node:current-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npm install -g pm2
COPY . .
EXPOSE ${PORT}
CMD ["pm2-runtime", "src/index.js"]
