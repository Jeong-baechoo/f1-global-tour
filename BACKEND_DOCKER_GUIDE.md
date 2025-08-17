# 🐳 F1 Global Tour Backend Docker 가이드

F1 Global Tour 프로젝트의 백엔드는 Docker로 분리되어 관리됩니다. 이 가이드에 따라 백엔드 환경을 설정하세요.

## 🚀 빠른 시작 (팀원용)

### 1. Docker 이미지 다운로드 및 실행

```bash
# FastF1 백엔드 이미지 다운로드
docker pull your-dockerhub-username/f1-backend:latest

# 백엔드 서버 실행
docker run -d \
  --name f1-backend \
  -p 8000:8000 \
  -v $(pwd)/cache:/app/cache \
  your-dockerhub-username/f1-backend:latest

# 서버 상태 확인
curl http://localhost:8000/health
```

### 2. 프론트엔드 개발 시작

```bash
# 프론트엔드 의존성 설치
npm install

# 개발 서버 시작
npm run dev
```

이제 다음 URL에서 확인할 수 있습니다:
- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:8000

## 🛠️ 개발자용 (Docker 이미지 빌드 및 배포)

### 사전 요구사항
- Docker Desktop 설치
- Docker Hub 계정 (Private Repository 권한)

### 로컬 빌드 및 테스트

```bash
# 1. docker-backend 디렉토리로 이동
cd docker-backend

# 2. Docker 이미지 빌드
docker build -t f1-backend:local .

# 3. 로컬 테스트
docker-compose up

# 4. API 테스트
curl http://localhost:8000/health
curl http://localhost:8000/mapbox/2024/1/1
```

### Docker Hub에 이미지 배포

```bash
# 1. Docker Hub 로그인
docker login

# 2. 이미지 태그 설정
docker tag f1-backend:local your-dockerhub-username/f1-backend:latest

# 3. Private Repository에 푸시
docker push your-dockerhub-username/f1-backend:latest
```

## 📋 Docker 명령어 모음

### 컨테이너 관리
```bash
# 컨테이너 시작
docker start f1-backend

# 컨테이너 중지
docker stop f1-backend

# 컨테이너 재시작
docker restart f1-backend

# 컨테이너 로그 확인
docker logs f1-backend

# 컨테이너 내부 접속
docker exec -it f1-backend bash
```

### 이미지 관리
```bash
# 이미지 목록 확인
docker images | grep f1-backend

# 이미지 삭제
docker rmi your-dockerhub-username/f1-backend:latest

# 최신 이미지 다운로드
docker pull your-dockerhub-username/f1-backend:latest
```

## 🔧 환경 설정

### 캐시 볼륨 설정
FastF1 데이터 캐시를 유지하려면 볼륨을 마운트하세요:

```bash
# 캐시 디렉토리 생성
mkdir -p ./cache

# 볼륨 마운트로 실행
docker run -d \
  --name f1-backend \
  -p 8000:8000 \
  -v $(pwd)/cache:/app/cache \
  your-dockerhub-username/f1-backend:latest
```

### 환경 변수 설정
```bash
# 환경 변수와 함께 실행
docker run -d \
  --name f1-backend \
  -p 8000:8000 \
  -e NODE_ENV=development \
  -e PORT=8000 \
  your-dockerhub-username/f1-backend:latest
```

## 🐛 문제 해결

### 자주 발생하는 문제들

1. **포트 충돌**
   ```bash
   # 다른 포트로 실행
   docker run -p 8001:8000 your-dockerhub-username/f1-backend:latest
   ```

2. **컨테이너가 시작되지 않음**
   ```bash
   # 로그 확인
   docker logs f1-backend
   
   # 컨테이너 상태 확인
   docker ps -a
   ```

3. **이미지 다운로드 실패**
   ```bash
   # Docker Hub 로그인 확인
   docker login
   
   # 권한 확인 (Private Repository)
   ```

4. **FastF1 데이터 로드 실패**
   - 첫 실행 시 데이터 다운로드로 인해 시간이 오래 걸릴 수 있습니다 (5-10분)
   - 인터넷 연결 상태를 확인하세요

### 성능 최적화

1. **메모리 제한 설정**
   ```bash
   docker run -d \
     --name f1-backend \
     --memory=2g \
     --memory-swap=4g \
     -p 8000:8000 \
     your-dockerhub-username/f1-backend:latest
   ```

2. **CPU 제한 설정**
   ```bash
   docker run -d \
     --name f1-backend \
     --cpus=2 \
     -p 8000:8000 \
     your-dockerhub-username/f1-backend:latest
   ```

## 📊 API 엔드포인트

| 엔드포인트 | 설명 | 예시 |
|---|---|---|
| `GET /health` | 서버 상태 확인 | `curl http://localhost:8000/health` |
| `GET /mapbox/{year}/{round}/{driver}` | 텔레메트리 데이터 | `curl http://localhost:8000/mapbox/2024/1/1` |
| `GET /drivers/{year}/{round}` | 드라이버 목록 | `curl http://localhost:8000/drivers/2024/1` |
| `GET /cache/stats` | 캐시 통계 | `curl http://localhost:8000/cache/stats` |
| `DELETE /cache` | 캐시 정리 | `curl -X DELETE http://localhost:8000/cache` |

## 🔄 업데이트 프로세스

### 팀원이 새 버전 사용하기
```bash
# 1. 기존 컨테이너 중지 및 삭제
docker stop f1-backend
docker rm f1-backend

# 2. 새 이미지 다운로드
docker pull your-dockerhub-username/f1-backend:latest

# 3. 새 컨테이너 실행
docker run -d \
  --name f1-backend \
  -p 8000:8000 \
  -v $(pwd)/cache:/app/cache \
  your-dockerhub-username/f1-backend:latest
```

### 개발자가 새 버전 배포하기
```bash
# 1. 변경사항 적용 후 이미지 리빌드
docker build -t your-dockerhub-username/f1-backend:latest .

# 2. 새 버전 푸시
docker push your-dockerhub-username/f1-backend:latest
```

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. Docker가 실행 중인지 확인
2. 포트 8000이 사용 가능한지 확인
3. 인터넷 연결 상태 확인
4. Docker Hub 로그인 및 권한 확인

추가 도움이 필요하면 팀 슬랙 채널에 문의하세요!