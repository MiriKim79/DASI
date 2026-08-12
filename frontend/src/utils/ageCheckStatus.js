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
