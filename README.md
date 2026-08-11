# DASI (다시)

여러 세대의 추억과 문화를 다시 꺼내보는 레트로 감성 웹 서비스.

## 소개

사이트에 접속하면 먼저 "내가 네 나이 맞혀볼게" 나이맞히기 퀴즈로 시작한다. 완료(또는 패스) 후 메인 화면에서 추억 놀이터, 세대별 AI 챗봇, 랭킹, 피드백 등을 이용할 수 있다.

## 핵심 기능

| 기능 | 설명 | 담당 |
|---|---|---|
| 나이 맞히기 / 정신연령 | 세대 경험 기반 질문으로 예상 나이·정신연령 추정 | 1번 |
| 메인 / 추억 놀이터 | 개그·드라마·영화·애니만화책·문방구·유행어밈·먹거리·음악 분야별 퀴즈 | 2번 |
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

| 역할 | 담당 페이지 | GitHub |
|---|---|---|
| 1번 | 시작 / 나이맞히기 / 결과 | @minkyung3038 |
| 2번 | 메인 / 사이드바 / 추억 놀이터 | @KIM-M0101 |
| 3번 | 챗봇 (FAB + 팝업) | @MiriKim79 |
| 4번 | 로그인 / 회원가입 / 랭킹 / 피드백 | @junghocomputer |

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
- 실행 방법: 초기 세팅([이슈 #49](../../issues/49)) 완료 후 이 섹션에 추가 예정

## 진행 관리

- Milestone 대신 🏁 스프린트 이슈로 진행률 추적: MVP1(#52) → MVP2(#53) → MVP3(#54) → Final(#55)
- 라벨: 담당(`role-1~4`, `공통`) / 영역(`frontend` `backend` `database` `ai`) / `MVP`
