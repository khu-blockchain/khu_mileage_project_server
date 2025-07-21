# khu_mileage_project_server
2024-1 기말 대체 프로젝트인 "Klaytn - KIP7을 활용한 경희대학교 SW 마일리지 홈페이지 리뉴얼" 프로젝트 서버 레포입니다.

https://swedu.khu.ac.kr/ 의 sw 마일리지 홈페이지를 리뉴얼해 마일리지 포인트를 KIP7으로 관리하는 프로젝트입니다.

# KHU Mileage Project Server Setup Guide

## 1. 프로젝트 세팅

### 요구사항
- MySQL이 설치되어 있어야 합니다.
- Node.js가 설치되어 있어야 합니다.
- 관리자용 Kaikas 계정이 필요하며, KLAY를 어느정도 보유하고 있어야 합니다.
- AWS S3 버킷과 accessKey, secretKey가 필요합니다.

### 필요한 환경 설정
- [MySQL 설치 가이드](https://dev.mysql.com/doc/refman/8.0/en/installing.html)
- [Node.js 설치 가이드](https://nodejs.org/en/download/package-manager/)
- [Kaikas 지갑 설정 가이드](https://docs.kaikas.io/guide/)
- [AWS S3 버킷 설정 가이드](https://docs.aws.amazon.com/AmazonS3/latest/userguide/create-bucket-overview.html)

## 2. Git 클론
다음 명령어를 사용하여 저장소를 클론합니다:
```sh
git clone https://github.com/PublicKSH/khu_mileage_project_server.git
```

## 3. 의존성 주입
다음 명령어로 의존성을 주입합니다.
```sh
npm install
```

## 4. JWT Key, Admin Password 생성
- JWT Key를 생성해야합니다. 
    ```sh
    node generateJWTKey.js
    ```
    명령어로 생성할 수 있습니다. [주의: env에 넣을때 \n을 작성해야합니다.]

- admin password를 생성해야합니다. 
    ```sh
    node generateMd5Password.js "password"
    ```
    명령어로 생성할 수 있습니다.

## 5. env 세팅
- .env.base 를 참고하여서 .env 파일을 작성합니다

## 6. 서버 실행
다음 명령어로 서버를 실행합니다.
```sh
npm run test
```

## 추가 연락처
추가로 문의하고 싶은 사항이 있을시 wjswp12347@khu.ac.kr로 메일 부탁드립니다.