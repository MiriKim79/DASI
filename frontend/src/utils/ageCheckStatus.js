// 나이맞히기 완료/패스 여부 — #33.
// 챗봇 진입(도킹된 모리)은 나이맞히기를 완료하거나 패스한 뒤에만 노출한다.
// localStorage에 플래그만 남기는 가벼운 방식(로그인 여부 확인 패턴과 동일, ResultPage.jsx 참고).
const KEY = "age_check_done";

export function isAgeCheckDone() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch (e) {
    return false;
  }
}

export function markAgeCheckDone() {
  try {
    localStorage.setItem(KEY, "1");
  } catch (e) {
    /* localStorage 사용 불가 환경이면 그냥 무시 — 매번 다시 안 보이는 정도의 영향만 있음 */
  }
}

// 첫 진입 라우팅 정책(App.jsx의 `/` 가드) 전용 세션 상태.
// isAgeCheckDone()(localStorage, 영구)과 의도적으로 분리한다 — 저건 모리 노출 등
// "한 번이라도 완료/패스했는가"를 브라우저에 영구히 남기는 용도라 그대로 두고,
// 이건 "이번 방문 세션에서 완료/패스했는가"만 본다(sessionStorage, 탭/브라우저를
// 완전히 닫으면 초기화). 로그인 access_token과도 무관하다.
const SESSION_KEY = "age_check_session_done";

export function isAgeCheckSessionDone() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch (e) {
    return false;
  }
}

export function markAgeCheckSessionDone() {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch (e) {
    /* sessionStorage 사용 불가 환경이면 그냥 무시 — 매 진입마다 다시 물어보는 정도의 영향만 있음 */
  }
}
