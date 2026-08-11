# 다시

여러 세대의 추억과 문화를 다시 꺼내보는 레트로 감성 웹 서비스.

> 기억을 다시. 그 시절을 다시. 그때의 사람과 다시.

브랜드 언어/카피 가이드는 [`docs/FEATURES.md`](docs/FEATURES.md#브랜드-언어) 참고.

## 소개

사이트에 접속하면 먼저 "내가 네 나이 맞혀볼게" 나이맞히기 퀴즈로 시작한다. 완료(또는 패스) 후 메인 화면에서 추억 놀이터, 세대별 AI 챗봇, 랭킹, 피드백 등을 이용할 수 있다.

## 핵심 기능

| 기능 | 설명 | 담당 |
|---|---|---|
| 나이 맞히기 | 세대 경험 기반 질문으로 예상 나이 추정 | 1번 |
| 메인 / 추억 놀이터 | 게임·드라마·영화·애니만화책·문방구·유행어밈·먹거리·음악 분야별 퀴즈 | 2번 |
| 세대별 AI 챗봇 | 우측 하단 FAB로 여는 팝업, 세대 선택 후 그 시대 캐릭터와 대화, 개그 퀴즈 포함 | 3번 |
| 회원 / 랭킹 / 피드백 | 로그인, 분야별 랭킹, 피드백 작성/조회 | 4번 |

기능 상세 스펙은 [`docs/FEATURES.md`](docs/FEATURES.md) 참고.

## 기술 스택

- **Frontend**: React, Vite, JavaScript, CSS, React Router
- **Backend**: Python, FastAPI
- **Database**: MySQL, SQLAlchemy
- **Auth**: JWT
- **AI**: OpenAI API (Responses API)
- **배포**: AWS EC2 (팀원 1명의 EC2에 업로드, 도메인 연결은 옵션)

## 팀 구성

4명이 각자 담당 기능을 Frontend → API → Backend → DB까지 풀스택으로 개발한다. 친구 기능은 개발하지 않는다.

| 역할 | 이름 | 학년 | 담당 페이지 | GitHub |
|---|---|---|---|---|
| 1번 | 김민경 | 경기대 3학년 | 시작 / 나이맞히기 / 결과 | @minkyung3038 |
| 2번 | 김민채 | 경기대 4학년 | 메인 / 사이드바 / 추억 놀이터 | @KIM-M0101 |
| 3번 | 김미리 | 경기대 2학년 | 챗봇 (FAB + 팝업) | @MiriKim79 |
| 4번 | 김정호 | 경기대 4학년 | 로그인 / 회원가입 / 랭킹 / 피드백 | @junghocomputer |

## 폴더 구조

```
frontend/   React + Vite
backend/    FastAPI
docs/       기능 명세 등 문서
```
(초기 스캐폴딩은 [이슈 #48](../../issues/48) 진행 후 채워짐)

## 개발 가이드

- 협업 규칙: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- AI 코딩 어시스턴트(Claude Code 등) 작업 규칙: [`AGENTS.md`](AGENTS.md)

## 로컬 실행 방법

### 사전 요구사항

- Node.js 및 npm
- Python 3.11 이상
- MySQL 8 이상 (팀 표준 DB를 사용할 경우에만 필요)

### 1. 저장소 내려받기

```powershell
git clone https://github.com/MiriKim79/DASI.git
cd DASI
```

### 2. Frontend 실행

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

`frontend/.env`의 `VITE_API_BASE_URL`은 기본적으로 `http://localhost:8000`입니다. 값을 비워 두면 기존 Vite proxy를 통해 `/api` 요청이 backend로 전달됩니다. frontend 기본 주소는 `http://localhost:5173`입니다.

### 3. Backend 실행 (빠른 로컬 SQLite)

새 터미널에서 저장소 루트로 이동한 뒤 실행합니다.

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
# Windows CMD에서는: .venv\Scripts\activate.bat
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python -m uvicorn app.main:app --reload
```

`backend/.env.example`의 기본 `DATABASE_URL`은 별도 설치가 필요 없는 SQLite입니다. backend 기본 주소는 `http://localhost:8000`이며, `http://localhost:8000/api/health`와 `http://localhost:8000/docs`에서 실행 상태와 API 문서를 확인할 수 있습니다.

### 4. MySQL 사용 (팀 표준 DB)

MySQL을 사용하려면 `backend/.env`에서 `DATABASE_URL`을 아래 형식으로 변경하고, 해당 데이터베이스를 준비합니다.

```env
DATABASE_URL=mysql+pymysql://USER:PASSWORD@HOST:PORT/DB_NAME
```

예를 들어 로컬 MySQL은 `mysql+pymysql://root:password@localhost:3306/dasi` 형식을 사용할 수 있습니다. 비밀번호에 URL 예약 문자가 있으면 URL 인코딩해야 합니다.

`OPENAI_API_KEY`, `JWT_SECRET`, DB 비밀번호처럼 민감한 값은 실제 `.env` 파일에만 넣고 커밋하지 않습니다. `.env`는 `.gitignore`에 포함되어 있으며, 공유할 때는 `.env.example`만 사용합니다.

## 진행 관리

- Milestone 대신 🏁 스프린트 이슈로 진행률 추적: MVP1(#52) → MVP2(#53) → MVP3(#54) → Final(#55)
- 라벨: 담당(`role-1~4`, `공통`) / 영역(`frontend` `backend` `database` `ai`) / `MVP`
