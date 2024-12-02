#!/bin/bash

BLUE_SERVER="app-blue"
GREEN_SERVER="app-green"
NGINX_CONF="./nginx/nginx.conf"
CURRENT_SERVER=$(docker ps --filter "name=$BLUE_SERVER" --format "{{.Names}}")

# Nginx 설정 파일이 없을 때 생성
if [ ! -f "$NGINX_CONF" ]; then
    echo "Creating default Nginx configuration..."
    mkdir -p ./nginx
    cat <<EOL > $NGINX_CONF
events { }

http {
    upstream backend {
        server app-blue:3000;
    }

    server {
        listen 80;

        location / {
            proxy_pass http://backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
    }
}
EOL
fi

# Blue/Green 전환
if [ "$CURRENT_SERVER" == "$BLUE_SERVER" ]; then
    NEW_SERVER=$GREEN_SERVER
else
    NEW_SERVER=$BLUE_SERVER
fi

echo "Switching to $NEW_SERVER..."

# Nginx 설정 파일 업데이트
if [ "$NEW_SERVER" == "$GREEN_SERVER" ]; then
    sed -i 's/server app-blue/server app-green/' $NGINX_CONF
else
    sed -i 's/server app-green/server app-blue/' $NGINX_CONF
fi

# Nginx 리로드
docker exec nginx nginx -s reload

echo "Deployment complete! Current active version: $NEW_SERVER"