#빌드
FROM node:24-alpine AS builder
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 런타임
FROM node:24-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production

# 런타임 의존성만 설치
COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /usr/src/app/dist ./dist

# 권한 빼기 전 폴더 미리 만들고 권한 주기
RUN mkdir -p /usr/src/app/public \
 && chown -R node:node /usr/src/app

# 루트권한 안주기(보안)
USER node

# 기본 CMD는 api로. compose에서 poller는 command로 덮어씁니다.
CMD ["npm", "run", "start:prod"]