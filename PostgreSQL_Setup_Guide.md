# PostgreSQL Docker Compose 설정 가이드

## 1. 사전 준비

### 필요한 디렉토리 생성
```bash
mkdir -p config/postgres/init-scripts
```

### Dockerfile 생성
```dockerfile
# Node.js 18 이미지 사용
FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci --only=production

# 소스 코드 복사
COPY . .

# TypeScript 컴파일
RUN npm run build

# uploads, public 디렉토리 생성
RUN mkdir -p uploads public

# 포트 노출 (backend 서비스용)
EXPOSE 3000

# 기본 명령어 (docker-compose에서 오버라이드됨)
CMD ["node", "dist/main.js"]
```

### 초기화 스크립트 생성
```bash
# pg_hba.conf 적용 스크립트 생성
cat > config/postgres/init-scripts/01-setup-auth.sh << 'EOF'
#!/bin/bash
set -e

echo "Applying custom pg_hba.conf configuration..."

# 프로젝트의 pg_hba.conf 적용
if [ -f /docker-entrypoint-initdb.d/pg_hba.conf.prod ]; then
    cp /docker-entrypoint-initdb.d/pg_hba.conf.prod /var/lib/postgresql/data/pg_hba.conf
    echo "Custom pg_hba.conf applied successfully"
fi
EOF

chmod +x config/postgres/init-scripts/01-setup-auth.sh
```

## 2. Docker Compose 파일 생성

### docker-compose.yml 작성
```yaml
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    command: ["node", "dist/main.js"]
    ports:
      - "${PORT}:${PORT}"
    environment:
      - DB_HOST=postgres
      - DB_USER=${DB_USER}
      - DB_PASS=${DB_PASS}
      - DB_NAME=${DB_NAME}
      - DB_PORT=${DB_PORT}
    volumes:
      - ./public:/app/public
    depends_on:
      - postgres

  polling:
    build:
      context: .
      dockerfile: Dockerfile
    command: ["node", "dist/poller.js"]
    environment:
      - DB_HOST=postgres
      - DB_USER=${DB_USER}
      - DB_PASS=${DB_PASS}
      - DB_NAME=${DB_NAME}
      - DB_PORT=${DB_PORT}
    depends_on:
      - postgres
      - backend

  postgres:
    image: postgres:15-alpine
    ports:
      - ${DB_EXPOSE_PORT}:5432
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASS}
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_INITDB_ARGS: "--auth-host=scram-sha-256"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./config/postgres/pg_hba.conf.prod:/docker-entrypoint-initdb.d/pg_hba.conf.prod:ro
      - ./config/postgres/init-scripts:/docker-entrypoint-initdb.d:ro

volumes:
  postgres_data:
```

## 3. 환경 변수 설정

### .env 파일 생성
```bash
# 기존 MySQL 설정을 PostgreSQL로 변경
PORT=3000

# PostgreSQL 설정
DB_HOST=postgres
DB_PORT=5432
DB_NAME=mileage_db
DB_USER=mileage_user
DB_PASS=your_password_here
DB_EXPOSE_PORT=5432

# PostgreSQL 환경 변수
POSTGRES_USER=mileage_user
POSTGRES_PASSWORD=your_password_here
POSTGRES_DB=mileage_db
```

## 4. 서비스 실행

### .dockerignore 파일 생성 (선택사항)
```bash
# .dockerignore 파일 생성으로 빌드 속도 향상
cat > .dockerignore << 'EOF'
node_modules
dist
.git
.gitignore
README.md
Dockerfile
docker-compose.yml
.env
.env.*
coverage
.nyc_output
.cache
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
EOF
```

### 컨테이너 빌드 및 시작
```bash
# Docker 이미지 빌드 및 서비스 시작
docker-compose up -d --build

# 또는 단계별 실행
# 1. 이미지 빌드
docker-compose build

# 2. 서비스 시작
docker-compose up -d

# 개별 서비스 로그 확인
docker-compose logs backend
docker-compose logs polling
docker-compose logs postgres

# 실시간 로그 모니터링
docker-compose logs -f backend

# 상태 확인
docker-compose ps
```

### 서비스별 설명
- **backend**: `src/main.ts`를 실행하는 웹 서버 (포트 3000)
- **polling**: `src/poller.ts`를 실행하는 백그라운드 작업 서비스 (웹 서버 없음)
- **postgres**: PostgreSQL 데이터베이스 서버

### 데이터베이스 접속 테스트
```bash
# PostgreSQL 접속
docker-compose exec postgres psql -U mileage_user -d mileage_db

# 또는 외부에서 접속
psql -h localhost -p 5432 -U mileage_user -d mileage_db
```

## 5. 기본 관리 명령어

### 서비스 관리
```bash
# 모든 서비스 중지
docker-compose stop

# 개별 서비스 중지/시작
docker-compose stop backend
docker-compose start backend
docker-compose restart polling

# 서비스 재시작
docker-compose restart

# 서비스 완전 종료 (컨테이너 삭제, 볼륨 유지)
docker-compose down

# 볼륨까지 삭제 (데이터 완전 삭제)
docker-compose down -v
```

### 데이터베이스 백업
```bash
# 백업 생성
docker-compose exec postgres pg_dump -U mileage_user -d mileage_db > backup.sql

# 백업 복원
docker-compose exec -T postgres psql -U mileage_user -d mileage_db < backup.sql
```

## 6. 트러블슈팅

### 연결 문제
```bash
# 서비스 상태 확인
docker-compose ps

# 개별 서비스 로그 확인
docker-compose logs backend
docker-compose logs polling
docker-compose logs postgres

# PostgreSQL 준비 상태 확인
docker-compose exec postgres pg_isready -U mileage_user
```

### 애플리케이션 문제
```bash
# backend 서비스 재시작 (웹 서버)
docker-compose restart backend

# polling 서비스 재시작 (백그라운드 작업)
docker-compose restart polling

# 컨테이너 내부 파일 확인
docker-compose exec backend ls -la dist/
docker-compose exec backend ls -la uploads/
docker-compose exec backend ls -la public/

# 컨테이너 내부 접속
docker-compose exec backend sh
docker-compose exec polling sh
```

### 빌드 문제
```bash
# 캐시 없이 새로 빌드
docker-compose build --no-cache

# 특정 서비스만 다시 빌드
docker-compose build backend

# Docker 캐시 정리
docker system prune -f
```

### 설정 확인
```bash
# pg_hba.conf 적용 확인
docker-compose exec postgres cat /var/lib/postgresql/data/pg_hba.conf

# 사용자 및 데이터베이스 확인
docker-compose exec postgres psql -U mileage_user -d mileage_db -c "\l"
docker-compose exec postgres psql -U mileage_user -d mileage_db -c "\du"
```

이 가이드는 기존의 MySQL 기반 Docker Compose 설정을 PostgreSQL로 변경하면서, `main.ts`(웹 서버)와 `poller.ts`(백그라운드 작업)를 독립적인 서비스로 실행하고, 프로젝트의 pg_hba.conf.prod 설정을 적용하는 구성입니다.