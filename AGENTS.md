# AI 코딩 어시스턴트 작업 규칙

Claude Code 등 AI 에이전트가 이 저장소에서 작업할 때 따르는 규칙. (`CLAUDE.md`는 이 문서와 동일)

## 프로젝트 개요

레트로 감성 웹 서비스. 4명이 각자 기능을 Frontend→API→Backend→DB까지 풀스택으로 담당한다. 상세 스펙은 [`docs/FEATURES.md`](docs/FEATURES.md), 협업 규칙은 [`CONTRIBUTING.md`](CONTRIBUTING.md) 참고.

## 담당 영역 (함부로 넘어가지 말 것)

| 역할 | 경로 |
|---|---|
| 1번 | `frontend/src/pages/AgeTest/`, `backend/**/age_test*` |
| 2번 | `frontend/src/pages/Playground/`, `frontend/src/components/Sidebar,Layout/`, `backend/**/playground*` |
| 3번 | `frontend/src/components/Chatbot/`, `backend/**/chat*` |
| 4번 | `frontend/src/pages/Auth,Ranking,Feedback/`, `backend/**/user*,ranking*,feedback*` |

## 지켜야 할 것

- 다른 담당자의 경로/코드를 요청 없이 수정·삭제·대규모 리팩터링하지 않는다
- 공통 파일(사이드바, 공통 Layout, CSS 변수, DB 연결, 인증 미들웨어 등) 수정이 필요하면 먼저 이유를 설명하고 확인받는다
- 기존 API 요청/응답 형식이나 DB 모델을 임의로 바꾸지 않는다
- 큰 변경(대규모 리팩터링, 새 라이브러리 도입, 폴더 구조 변경) 전에는 먼저 알린다
- 명시적으로 요청받기 전에는 `git push`, `main` merge, 브랜치 삭제를 하지 않는다
- 과도한 구현 금지: WebSocket, Redis, 벡터DB, RAG, 마이크로서비스, Docker 대규모 구성, Redux, 복잡한 Agent 구조 등은 요구사항에 꼭 필요할 때만 제안한다
- 현재 코드 스타일과 폴더 구조를 최대한 따른다
- OpenAI API Key 등 민감정보는 절대 프론트 코드나 커밋에 포함하지 않는다 (`.env`, `.gitignore` 확인)

## 코드 수정 시 설명 방식

무엇을 만드는지 / 왜 이 파일을 수정하는지 / 프론트→API→백엔드 흐름 / 핵심 코드 역할을 짧게 설명한다. 장황한 이론 설명은 지양한다.
