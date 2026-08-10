# 기능명세서

각 항목이 GitHub 이슈 1개에 대응합니다. 진행 추적: 🏁 MVP1 [#52](../../issues/52) → MVP2 [#53](../../issues/53) → MVP3 [#54](../../issues/54).

⚠️ 표시는 아직 팀 확정 전, 제 제안(초안)입니다. 담당자가 확정하면 표시를 지우고 이 문서를 갱신해주세요.

## 공통 규칙 ⚠️ 제안 — 팀 확인 필요

- API 응답 필드: **snake_case** (FastAPI/Pydantic 기본값)
- 에러 응답: FastAPI 기본 형식 `{ "detail": "메시지" }` 그대로 사용
- API 경로: `/api` 프리픽스 통일
- 인증: `Authorization: Bearer <JWT>` 헤더
- FE: 모든 화면에서 로딩 / 데이터 없음 / API 실패 / 인증 만료(401→로그인 이동) 4가지 상태 구분

---

## F1. 나이 맞히기 / 정신연령 — 1번 (@minkyung3038)

### F1-1. 질문 목록 조회 API — [#2](../../issues/2)
- `GET /api/age-test/questions`
- 응답 예: `[{ "id": 1, "text": "...", "options": [{ "id": 1, "text": "..." }] }]`
- 대표나이(age)/가중치(weight)는 서버 내부용, 응답에는 노출하지 않음
- 완료조건: 10문항(경험형7+앵커3)이 순서대로 반환된다

### F1-2. 답변 제출 & 나이/정신연령 계산 API — [#4](../../issues/4) [#5](../../issues/5) [#6](../../issues/6)
- `POST /api/age-test/submit`
- 요청: `{ "answers": [{ "question_id": 1, "option_id": 2 }, ...] }` (10개)
- 응답: `{ "estimated_age": 27, "mental_age": 24, "top_reasons": ["...", "...", "..."] }`
- 계산식: `정신연령 = Σ(대표 나이 × 가중치) / Σ(가중치)`, 반올림 1세 단위
- 완료조건: 10개 답변 제출 시 나이/정신연령/결정적 답변 TOP3가 반환된다

### F1-3. 검증 — [#7](../../issues/7)
- 10~50대+ 가상 사용자 데이터로 일치율/±2세/±3세/MAE 측정 후 가중치 튜닝
- 완료조건: 검증 리포트 기준 가중치 1차 확정

### F1-4. 결과 저장 API — [#9](../../issues/9)
- `POST /api/age-test/results` (JWT 필요)
- 요청: `{ "estimated_age": 27, "mental_age": 24 }`
- ⚠️ 비로그인 요청 시 401로 막을지, 저장만 skip하고 200을 줄지 확인 필요
- 완료조건: 로그인 사용자만 결과가 DB에 저장된다

### F1-5. 화면 — [#1](../../issues/1) [#3](../../issues/3) [#8](../../issues/8) [#10](../../issues/10)
- 시작 화면(#1, "쫄리면 패스하기") → 퀴즈 진행(#3, 진행률 표시) → 결과 화면(#8, 나이/정신연령/TOP3/다시하기/메인이동) → 패스(#10, 메인 바로 이동)

---

## F2. 메인 / 추억 놀이터 — 2번 (@KIM-M0101)

### F2-1. 공통 레이아웃 — [#12](../../issues/12) [#13](../../issues/13) [#14](../../issues/14) [#15](../../issues/15)
- Router 라우트 정의(#13) → 사이드바(#12: 홈/나이맞히기/추억놀이터/랭킹/피드백 + 우측상단 로그인) → CSS 변수(#14) → 공통 Layout(#15)
- 완료조건: 메인 이후 모든 페이지가 동일한 사이드바/레이아웃을 공유한다

### F2-2. 분야별 퀴즈 API — [#16](../../issues/16) [#17](../../issues/17) [#18](../../issues/18)
- `GET /api/playground/categories` → `[{ "id": 1, "name": "드라마" }, ...]` (개그 제외 7개)
- `GET /api/playground/categories/{id}/quiz` → `{ "category": "드라마", "questions": [{ "id": 1, "text": "...", "options": [...] }] }`
- `POST /api/playground/categories/{id}/submit` → `{ "score": 8, "total": 10 }`
- ⚠️ 정답을 제출 전 프론트로 내려줄지(부정행위 이슈) 확인 필요
- 완료조건: 7개 분야 퀴즈를 풀고 점수를 받을 수 있다

### F2-3. 개그 콘텐츠 API — [#19](../../issues/19)
- `GET /api/playground/gag?type=아재|문과|이과|세대` → `[{ "id": 1, "content": "...", "answer": "..." }]`
- **3번 챗봇이 그대로 호출**해 챗봇 내부에서 퀴즈로 출제 (추억놀이터 화면에는 퀴즈로 안 나옴)
- 완료조건: 3번이 이 API 응답만으로 개그 퀴즈를 구성할 수 있다

### F2-4. 테마/랭킹 연동 — [#20](../../issues/20) [#21](../../issues/21)
- 분야별 포인트 컬러·소품(#20), 분야별 점수 → 4번 랭킹 API 제출(#21, F4-3 참고)

---

## F3. 세대별 AI 챗봇 — 3번 (@MiriKim79, 본인)

### F3-1. 세대 목록 API — [#26](../../issues/26)
- `GET /api/generations`
- 응답: `[{ "id": "2000s", "display_name": "2000년대", "character": "2000s_student" }, { "id": "2010s", ... }, { "id": "2020s", ... }]`

### F3-2. 채팅 API — [#26](../../issues/26) [#27](../../issues/27) [#28](../../issues/28) [#30](../../issues/30)
- `POST /api/chat`
- 요청: `{ "generation": "2000s", "message": "학교 끝나면 뭐 했어?", "history": [{ "role": "user", "content": "..." }, { "role": "assistant", "content": "..." }] }`
- 응답: `{ "generation": "2000s", "character": "2000s_student", "message": "..." }`
- 세대별 persona(#28: 시대/성격/말투/표현/문화/기술/먹거리/방송음악 + 시대 이후 표현 금지 규칙)로 system prompt 구성 → OpenAI Responses API 호출(#27)
- 완료조건: 세대별로 다른 말투·문화가 반영된 응답이 온다

### F3-3. 대화 저장 — [#31](../../issues/31)
- `POST /api/chat` 요청·응답 형식은 F3-2와 동일
- JWT 있으면 서버가 대화를 DB에 저장, 없으면 세션 메모리만 사용(미저장)

### F3-4. 개그 퀴즈 — [#34](../../issues/34) [#35](../../issues/35) [#36](../../issues/36)
- 챗봇 팝업 내 "개그 퀴즈" 모드: `GET /api/playground/gag`(2번, F2-3) 호출 → 문제 출제 → 정답 판정(#35) → `POST /api/ranking/submit`(4번, F4-3)로 점수 제출(#36)

### F3-5. 화면 — [#22](../../issues/22) [#23](../../issues/23) [#24](../../issues/24) [#25](../../issues/25) [#29](../../issues/29) [#32](../../issues/32) [#33](../../issues/33)
- FAB(#22, 우측 하단 원형, 나이맞히기 완료/패스 이후 노출 #33) → 세대 선택(#23) → 채팅 UI(#24, 말풍선/입력창) → typing indicator(#25) → 캐릭터 placeholder(#29, 세대별 이미지 매핑, 이미지 없으면 placeholder만) → 로딩/에러(#32)

---

## F4. 회원 / 랭킹 / 피드백 — 4번 (@junghocomputer)

### F4-1. 인증 API — [#38](../../issues/38) [#39](../../issues/39) [#40](../../issues/40)
- `POST /api/auth/signup` → `{ "email": "...", "password": "..." }` → `201`
- `POST /api/auth/login` → `{ "email": "...", "password": "..." }` → `{ "access_token": "...", "token_type": "bearer" }`
- ⚠️ 로그아웃을 서버 API로 둘지, 클라이언트 토큰 삭제만으로 처리할지 확인 필요
- 완료조건: 회원가입 후 로그인하면 JWT가 발급된다

### F4-2. 인증 의존성 — [#41](../../issues/41)
- FastAPI `Depends(get_current_user)` 형태로 제공, 다른 라우터에서 재사용
- 완료조건: 1번/3번이 이 의존성을 import해서 로그인 여부를 확인할 수 있다

### F4-3. 랭킹 API — [#37](../../issues/37) [#42](../../issues/42) [#43](../../issues/43) [#44](../../issues/44)
- `POST /api/ranking/submit` (JWT) → `{ "category": "age-test|drama|movie|...|chatbot-gag", "score": 8 }`
- `GET /api/ranking?category=drama` → `[{ "rank": 1, "user": "...", "score": 10 }, ...]`
- 완료조건: 분야별로 상위 랭킹이 정확히 집계된다 (나이맞히기/추억놀이터 각 분야/챗봇 개그 퀴즈 포함)

### F4-4. 피드백 API — [#45](../../issues/45) [#46](../../issues/46)
- `POST /api/feedback` (JWT) → `{ "content": "..." }`
- `GET /api/feedback` → `[{ "id": 1, "user": "...", "content": "...", "created_at": "..." }]`

---

## 역할 간 순서 요약

| 단계 | 1번 | 2번 | 3번 | 4번 |
|---|---|---|---|---|
| 착수 (mock 가능) | F1-1~2 | F2-1 | F3-1~2, F3-5 | F4-1 |
| 중반 | F1-3~4 | F2-2~3 | F3-3, F3-4(F2-3 대기) | F4-2~3 |
| 연동 | 결과저장(F4-2 대기) | 랭킹연동(F4-3 대기) | 저장/랭킹연동(F4-2·3 대기) | 전체 연동 |

> F2-3(개그 콘텐츠 API)이 늦어지면 F3-4(챗봇 개그 퀴즈) 착수 불가. F4-3(랭킹 API 규격)이 늦어지면 F2-4·F3-4의 점수 제출이 지연됨.

---

## 미확정 (⚠️ 팀 확인 필요 모음)

- 공통 규칙(에러 응답 형식/필드 케이스) 최종 확정
- F1-4: 비로그인 결과 저장 요청 처리(401 vs 무시하고 200)
- F2-2: 퀴즈 정답 노출 시점(제출 전/후)
- F4-1: 로그아웃 처리 방식(서버 API vs 클라이언트 처리)
