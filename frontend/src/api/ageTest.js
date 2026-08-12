// 나이 맞히기(Age Test) API 클라이언트 — 1번 담당.
// client.js(추억놀이터)/chat.js(챗봇)와 같은 fetch 패턴을 쓰되, 담당 영역을 분리하려고 파일을 따로 둔다.
import { getAccessToken } from "./client.js";

const BASE = import.meta.env.VITE_API_BASE_URL || "";

async function request(path, options) {
  const token = getAccessToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options && options.headers),
      // 로그인 상태면 토큰을 함께 보내 결과가 DB에 저장되게 한다(#9).
      // 비로그인이면 토큰이 없으니 서버는 저장하지 않는다.
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    let detail = "요청에 실패했어요.";
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch (e) {
      /* ignore */
    }
    throw new Error(detail);
  }
  return res.json();
}

export const ageTestApi = {
  // F1-1(#2): 질문 목록 조회. representative_age/weight는 서버가 응답에 내려주지 않는다.
  getQuestions: () => request("/api/age-test/questions"),
  // F1-2(#4): 답변 제출. 로그인 상태면 서버가 결과를 저장한다(#9).
  submitAnswers: (answers) =>
    request("/api/age-test/submit", {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),
};
