FROM node:latest
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npm install -g pm2
COPY . .
EXPOSE 1987
CMD ["pm2-runtime", "index.js"]
