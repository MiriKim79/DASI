# 협업 규칙

## 브랜치 전략

`main`(보호) + 담당자별 feature 브랜치 4개. `develop`은 두지 않는다.

```
main
 ├─ feature/age-test   (1번)
 ├─ feature/playground (2번)
 ├─ feature/chatbot    (3번)
 └─ feature/user       (4번)
```

- 이슈 단위 브랜치는 만들지 않는다. 본인 feature 브랜치에서 이슈들을 순서대로 커밋하고, 의미 있는 단위가 완성되면 PR을 올린다.
- `main`에서 직접 개발하지 않는다. **예외 없음** — 초기 세팅/환경설정 같은 공통 작업도 `chore/xxx` 브랜치(예: `chore/project-setup`)를 만들어 PR로 병합한다.

## 커밋 컨벤션

```
머릿말: 설명 (#이슈번호)
```
머릿말: `Feat` `Fix` `Docs` `Chore` `Style` `Rename` `Refactor`

예: `Feat: 세대 선택 화면 구현 (#23)`

## PR 규칙

- PR 템플릿(`.github/pull_request_template.md`) 그대로 작성
- base 브랜치는 `main`
- `CODEOWNERS`에 따라 관련 담당자가 자동으로 리뷰어로 지정됨 — 리뷰 확인 후 머지
- 이슈 본문의 "완료 조건"을 충족했는지 PR에서 다시 체크

## 이슈 규칙

- Issue 템플릿(기능/버그/스프린트) 사용, 빈 이슈 생성 불가
- 라벨: 담당(`role-1~4`, 공통 작업은 `공통`) + 영역(`frontend`/`backend`/`database`/`ai`) 함께 부착
- 기능 이슈는 가능하면 [`docs/FEATURES.md`](docs/FEATURES.md)의 해당 항목을 참고해 작성

## 협업 원칙

- 다른 담당자가 작성한 기능을 임의로 삭제/대규모 리팩터링하지 않는다
- 공통 파일(사이드바, Layout, CSS 변수, DB 연결 등)을 수정해야 하면 먼저 팀에 공유한다
- 기존 API 응답 형식 / DB 모델을 혼자 변경하지 않는다 — 변경이 필요하면 관련 담당자와 먼저 합의
- merge conflict 해결 시 다른 사람 코드까지 임의로 고치지 않는다
- `.env`는 커밋하지 않는다 (`.env.example`만 커밋). OpenAI API Key, DB 비밀번호 등은 환경변수로 관리
- AI(Claude Code 등)가 작성한 코드는 직접 확인 후 커밋한다
- AI에게 `main` merge나 push를 임의로 맡기지 않는다

## 역할 간 의존성

- 1번 결과 스키마 → 4번 결과-User 연결에 필요 (초반엔 mock으로 병행 가능)
- 2번 사이드바/공통 Layout → 3번/4번 페이지에서 재사용 (초반엔 레이아웃 없이 단독 개발 후 나중에 적용)
- 2번 개그 콘텐츠 API → 3번 챗봇 퀴즈에서 사용
- 4번 인증(JWT) → 1번 결과저장, 3번 대화저장, 4번 랭킹/피드백에 필요 (초반엔 비로그인 상태로 병행 개발)
- 4번 랭킹 점수 제출 API 규격 → 2번, 3번이 각자 점수를 제출할 때 사용

초기엔 전원 mock/비인증 상태로 병렬 개발하고, MVP2~3 단계에서 실제로 연동한다.
