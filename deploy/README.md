# 배포 가이드 (AWS EC2)

README.md 기술 스택에 적힌 대로, 팀원 1명의 EC2에 프론트(정적 빌드)와 백엔드(FastAPI)를 함께 올리는 방식이다.
도메인 연결은 옵션이라, 없으면 EC2 퍼블릭 IP로 접속하면 된다.

## 1. EC2 인스턴스 준비

1. AWS 콘솔 → EC2 → 인스턴스 시작
   - AMI: **Ubuntu Server 22.04 LTS**
   - 인스턴스 유형: **t2.micro** (프리티어)로 충분
   - 키 페어: 새로 생성해서 `.pem` 파일 다운로드(분실 시 재발급 불가하니 잘 보관)
   - 보안 그룹(인바운드 규칙): `SSH(22)`, `HTTP(80)` 허용. HTTPS(443)는 도메인+인증서 붙일 때만 필요.
2. 인스턴스가 뜨면 **퍼블릭 IPv4 주소**를 확인해둔다.

## 2. SSH 접속

```bash
chmod 400 my-key.pem
ssh -i my-key.pem ubuntu@<퍼블릭 IP>
```

## 3. 서버 초기 세팅 (최초 1회)

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git python3.11 python3.11-venv nginx

# Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

git clone https://github.com/MiriKim79/DASI.git
cd DASI
```

## 4. 백엔드 설정

```bash
cd ~/DASI/backend
python3.11 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env
nano .env   # OPENAI_API_KEY, JWT_SECRET, DATABASE_URL, CORS_ORIGINS 채우기
```

`.env`에서 특히 확인할 것:
- `OPENAI_API_KEY=` 뒤에 `=` 빠뜨리지 말 것 (실제로 이 오타로 챗봇이 안 됐던 적 있음)
- `CORS_ORIGINS`에 실제 배포 도메인/IP를 추가 (예: `http://<퍼블릭 IP>`)

초기 데이터 넣기:
```bash
.venv/bin/python -m app.seed --reset
```

서비스로 등록해서 상시 실행:
```bash
sudo cp deploy/dasi-backend.service /etc/systemd/system/dasi-backend.service
sudo systemctl daemon-reload
sudo systemctl enable --now dasi-backend
sudo systemctl status dasi-backend   # active (running) 확인
```

## 5. 프론트 빌드

```bash
cd ~/DASI/frontend
npm install
cp .env.example .env   # 있다면. VITE_API_BASE_URL은 비워두면 상대경로(/api)로 nginx proxy를 탄다
npm run build          # dist/ 생성
```

## 6. nginx로 서빙

```bash
sudo cp ~/DASI/deploy/nginx.conf /etc/nginx/sites-available/dasi
sudo ln -s /etc/nginx/sites-available/dasi /etc/nginx/sites-enabled/dasi
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

이제 브라우저에서 `http://<퍼블릭 IP>` 접속하면 된다.

## 7. (옵션) 도메인 + HTTPS

도메인을 EC2 IP로 연결한 뒤:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 8. 이후 업데이트 배포할 때

```bash
cd ~/DASI
git pull origin main

cd backend
.venv/bin/pip install -r requirements.txt   # 의존성 바뀌었으면
sudo systemctl restart dasi-backend

cd ../frontend
npm install
npm run build
# nginx는 정적 파일을 바로 읽으므로 재시작 불필요
```

## 트러블슈팅

- 챗봇이 "메시지를 보내지 못했어요"로 계속 실패 → `.env`의 `OPENAI_API_KEY` 값/크레딧 확인, `sudo journalctl -u dasi-backend -n 50`로 에러 로그 확인
- 502 Bad Gateway (nginx) → 백엔드가 안 떠 있음. `sudo systemctl status dasi-backend`
- CORS 에러 → 백엔드 `.env`의 `CORS_ORIGINS`에 실제 접속 주소가 빠짐
