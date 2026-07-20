# AWS EC2 Docker 배포 가이드

> CodeTrip 프로젝트 기준 (React + Vite 프론트엔드 / Express 백엔드 / MySQL)

---

## 목차

1. [아키텍처 개요](#1-아키텍처-개요)
2. [EC2 인스턴스 생성](#2-ec2-인스턴스-생성)
3. [보안 그룹 설정](#3-보안-그룹-설정)
4. [서버 초기 설정](#4-서버-초기-설정)
5. [Docker 및 Docker Compose 설치](#5-docker-및-docker-compose-설치)
6. [프로젝트 파일 준비](#6-프로젝트-파일-준비)
7. [Dockerfile 작성](#7-dockerfile-작성)
8. [Nginx 설정](#8-nginx-설정)
9. [docker-compose.yml 작성](#9-docker-composeyml-작성)
10. [환경 변수 설정](#10-환경-변수-설정)
11. [DB 초기화 스크립트 준비](#11-db-초기화-스크립트-준비)
12. [배포 실행](#12-배포-실행)
13. [도메인 및 HTTPS 설정 (선택)](#13-도메인-및-https-설정-선택)
14. [운영 명령어 모음](#14-운영-명령어-모음)

---

## 1. 아키텍처 개요

```
인터넷
  │
  ▼
[EC2 - 80/443]
  │
  ▼
[Nginx 컨테이너]  ── 정적 파일 서빙 (React 빌드 결과)
  │                └─ /api/* 요청을 백엔드로 프록시
  ▼
[Node.js 컨테이너]  ── Express 서버 (포트 8080)
  │
  ▼
[MySQL 컨테이너]  ── 포트 3306 (외부 미노출, Docker 내부 통신)
```

- **Nginx**: 프론트엔드 정적 파일 서빙 + `/api`, `/uploads` 리버스 프록시
- **Node.js**: Express 백엔드 (포트 8080, 외부 미노출)
- **MySQL**: Docker 컨테이너로 EC2 내부에서 운영 (포트 3306 외부 미노출)

---

## 2. EC2 인스턴스 생성

### 2-1. AWS 콘솔 접속

1. [AWS 콘솔](https://console.aws.amazon.com) 로그인
2. **EC2** 서비스 → **인스턴스 시작** 클릭

### 2-2. 인스턴스 설정

| 항목 | 권장값 |
|------|--------|
| AMI | **Ubuntu 22.04 LTS** |
| 인스턴스 유형 | **t3.small** (RAM 2GB) 이상 권장 — Node 서버 캐싱 60,000건으로 인해 t2.micro(1GB)는 부족할 수 있음 |
| 스토리지 | **30GB gp3** 이상 — MySQL 데이터 저장 공간 포함 |
| 키 페어 | 새로 생성 → `.pem` 파일 안전한 곳에 저장 |

### 2-3. 키 페어 권한 설정 (로컬 PC)

```bash
chmod 400 your-key.pem
```

---

## 3. 보안 그룹 설정

인스턴스 생성 시 또는 생성 후 **보안 그룹 인바운드 규칙** 추가:

| 유형 | 프로토콜 | 포트 | 소스 | 용도 |
|------|----------|------|------|------|
| SSH | TCP | 22 | 내 IP | 서버 접속 |
| HTTP | TCP | 80 | 0.0.0.0/0 | 웹 서비스 |
| HTTPS | TCP | 443 | 0.0.0.0/0 | SSL 웹 서비스 |

> **주의**: 8080(Node.js), 3306(MySQL) 포트는 외부에 열지 않습니다. Docker 내부 네트워크로만 통신합니다.

---

## 4. 서버 초기 설정

```bash
# EC2 접속
ssh -i your-key.pem ubuntu@<EC2_퍼블릭_IP>

# 패키지 업데이트
sudo apt-get update && sudo apt-get upgrade -y

# 타임존 설정 (한국)
sudo timedatectl set-timezone Asia/Seoul
```

---

## 5. Docker 및 Docker Compose 설치

```bash
# Docker 설치
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# sudo 없이 docker 명령 사용
sudo usermod -aG docker $USER
newgrp docker

# 설치 확인
docker --version
docker compose version
```

---

## 6. 프로젝트 파일 준비

```bash
# 프로젝트 클론 (GitHub 사용 시)
git clone https://github.com/<your-org>/codetrip.git
cd codetrip
```

GitHub를 사용하지 않는 경우 로컬에서 직접 업로드:

```bash
# 로컬 PC에서 실행
scp -i your-key.pem -r ./2_CodeTrip_Project ubuntu@<EC2_IP>:~/codetrip
```

---

## 7. Dockerfile 작성

### 7-1. 프론트엔드 Dockerfile

프로젝트 루트에 `Dockerfile.frontend` 파일 생성:

```dockerfile
# Dockerfile.frontend

# 1단계: 빌드
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# 빌드 시점에 필요한 환경 변수 (VITE_ 접두사)
ARG VITE_KAKAO_MAP_API_KEY
ENV VITE_KAKAO_MAP_API_KEY=$VITE_KAKAO_MAP_API_KEY

RUN npm run build

# 2단계: Nginx로 서빙
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 7-2. 백엔드 Dockerfile

`server/Dockerfile` 파일 생성:

```dockerfile
# server/Dockerfile

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

# 업로드 파일 저장 디렉토리
RUN mkdir -p uploads

EXPOSE 8080
CMD ["node", "index.js"]
```

---

## 8. Nginx 설정

프로젝트 루트에 `nginx.conf` 파일 생성:

```nginx
server {
    listen 80;
    server_name _;

    # gzip 압축
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

    # 정적 파일 서빙 (React SPA)
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;  # SPA 라우팅 지원
    }

    # API 요청 → Node.js 백엔드로 프록시
    location /api/ {
        proxy_pass http://backend:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 120s;  # 캐시 초기화가 길 수 있으므로 넉넉히
    }

    # 업로드 파일 프록시
    location /uploads/ {
        proxy_pass http://backend:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # 공공데이터 API 프록시 (CORS 우회)
    location /B551011/ {
        proxy_pass https://apis.data.go.kr/B551011/;
        proxy_http_version 1.1;
        proxy_ssl_server_name on;
        proxy_set_header Host apis.data.go.kr;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 9. docker-compose.yml 작성

프로젝트 루트에 `docker-compose.yml` 파일 생성:

```yaml
services:
  db:
    image: mysql:8.0
    container_name: codetrip-db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mysql-data:/var/lib/mysql        # DB 데이터 영속성
      - ./db/init:/docker-entrypoint-initdb.d  # 초기화 SQL 자동 실행
    networks:
      - codetrip-net
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${DB_ROOT_PASSWORD}"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 30s

  backend:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: codetrip-backend
    restart: unless-stopped
    env_file:
      - .env
    volumes:
      - ./server/uploads:/app/uploads   # 업로드 파일 영속성
    depends_on:
      db:
        condition: service_healthy
    networks:
      - codetrip-net
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:8080/api/travel/top-images"]
      interval: 60s
      timeout: 10s
      retries: 3
      start_period: 60s   # 캐시 초기화 대기

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
      args:
        VITE_KAKAO_MAP_API_KEY: ${VITE_KAKAO_MAP_API_KEY}
    container_name: codetrip-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - codetrip-net

networks:
  codetrip-net:
    driver: bridge

volumes:
  mysql-data:   # Docker 관리 볼륨 (docker compose down -v 시 삭제됨)
```

---

## 10. 환경 변수 설정

프로젝트 루트에 `.env` 파일 생성 (`.gitignore`에 반드시 포함):

```bash
# .env

# 데이터베이스 (Docker 서비스명 'db' 사용)
DB_HOST=db
DB_PORT=3306
DB_USER=codetrip
DB_PASSWORD=your_db_password
DB_NAME=codetrip
DB_ROOT_PASSWORD=your_root_password   # MySQL root 계정 비밀번호

# 인증
JWT_SECRET=your_strong_jwt_secret_here

# 공공데이터 API 키 (URL 인코딩된 값)
TRAVEL_INFO_API_KEY=your_encoded_api_key

# 프론트엔드 빌드용 카카오맵 키
VITE_KAKAO_MAP_API_KEY=your_kakao_map_key
```

> **DB_HOST**: RDS 엔드포인트 대신 Docker Compose 서비스명 `db`를 사용합니다. Docker 내부 DNS가 자동으로 MySQL 컨테이너 IP로 해석합니다.

---

## 11. DB 초기화 스크립트 준비

MySQL 컨테이너는 최초 기동 시 `/docker-entrypoint-initdb.d/` 디렉토리의 `.sql` 파일을 자동으로 실행합니다.

```bash
# EC2 서버에서 디렉토리 생성
mkdir -p ~/codetrip/db/init
```

로컬 PC에서 스키마 파일을 업로드하거나 직접 작성합니다:

```bash
# 로컬 PC에서 스키마 파일 업로드
scp -i your-key.pem ./db/init/schema.sql ubuntu@<EC2_IP>:~/codetrip/db/init/schema.sql
```

`db/init/schema.sql` 예시:

```sql
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  profile_image VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 이하 프로젝트 테이블 정의 추가
```

> **주의**: `docker-entrypoint-initdb.d`는 볼륨이 **완전히 비어있을 때만** 실행됩니다. 이미 데이터가 있는 경우 무시됩니다.

---

## 12. 배포 실행

```bash
# EC2 서버에서 프로젝트 루트 디렉토리로 이동
cd ~/codetrip

# .env 파일 작성 (10번 항목 참고)
nano .env

# 이미지 빌드 및 컨테이너 시작 (db → backend → frontend 순서로 기동)
docker compose up -d --build

# DB 초기화 로그 확인
docker compose logs -f db

# 백엔드 로그 확인 (캐시 초기화 완료까지 대기)
docker compose logs -f backend
```

정상 기동 시 백엔드 로그에 아래 메시지가 출력됩니다:

```
✅ 캐시 완료: 총 NNNNN개 항목 (축제: NNN개)
✅ 정렬 캐시 완료 (createdtime/modifiedtime × asc/desc)
⏰ 다음 캐시 갱신: YYYY.MM.DD 03:00:00
```

브라우저에서 `http://<EC2_퍼블릭_IP>` 접속하여 확인합니다.

---

## 13. 도메인 및 HTTPS 설정 (선택)

도메인이 있는 경우 Let's Encrypt로 무료 SSL 인증서를 발급합니다.

```bash
# Certbot 설치
sudo apt-get install -y certbot python3-certbot-nginx

# 인증서 발급 전 Nginx 컨테이너 잠시 중지 (80 포트 확보)
docker compose stop frontend

# 인증서 발급 (standalone 모드)
sudo certbot certonly --standalone -d yourdomain.com

# Nginx 컨테이너 재시작
docker compose start frontend
```

이후 `nginx.conf`에 SSL 설정을 추가하고 `docker compose up -d --build`로 재배포합니다.

---

## 14. 운영 명령어 모음

```bash
# 전체 서비스 상태 확인
docker compose ps

# 실시간 로그 보기
docker compose logs -f
docker compose logs -f backend   # 백엔드만
docker compose logs -f db        # MySQL만

# 서비스 재시작
docker compose restart

# 코드 업데이트 후 재배포 (DB는 유지)
git pull
docker compose up -d --build

# 특정 컨테이너만 재빌드
docker compose up -d --build backend

# MySQL 직접 접속
docker exec -it codetrip-db mysql -u codetrip -p codetrip

# DB 백업
docker exec codetrip-db mysqldump -u root -p<DB_ROOT_PASSWORD> codetrip > backup_$(date +%Y%m%d).sql

# DB 복원
docker exec -i codetrip-db mysql -u root -p<DB_ROOT_PASSWORD> codetrip < backup_YYYYMMDD.sql

# 서비스 중단 (DB 데이터 유지)
docker compose down

# 서비스 중단 + DB 데이터 포함 전체 삭제 (초기화 시)
docker compose down -v

# 미사용 이미지 정리 (디스크 절약)
docker image prune -f
```

---

## 주의사항

- **`.env` 파일은 절대 Git에 커밋하지 않습니다.** `.gitignore`에 `.env` 추가 확인
- **DB 데이터**는 `mysql-data` Docker 볼륨에 저장됩니다. `docker compose down`만으로는 삭제되지 않으나, `docker compose down -v`를 실행하면 **모든 데이터가 영구 삭제**됩니다
- **업로드 파일** (`server/uploads/`)은 호스트 디렉토리 마운트로 처리되어 볼륨 삭제와 무관하게 보존됩니다
- **캐시 초기화**(`initTravelCache`)는 서버 시작 시 60,000건 데이터를 로드하므로 t2.micro(1GB RAM)에서는 OOM이 발생할 수 있습니다. **t3.small 이상** 권장
- **정기 백업**: DB는 EC2 로컬에만 존재하므로 `mysqldump`를 cron으로 주기적으로 실행하고 S3 등 외부에 보관하는 것을 권장합니다
- EC2 재부팅 후 자동 시작: `docker compose` 서비스의 `restart: unless-stopped` 설정으로 자동 재시작됩니다
