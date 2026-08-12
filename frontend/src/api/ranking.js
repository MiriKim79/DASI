import { getAccessToken } from "./client.js";

const BASE = import.meta.env.VITE_API_BASE_URL || "";

async function request(path, options = {}) {
  const token = getAccessToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
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

export const rankingApi = {
  getRanking: () => request("/api/ranking"),
  // 랭킹 도전 시작: 코인 10개 차감 후 20문제(전부 사진/노래 정답 입력형) 반환.
  // 로그인(access_token) 필요.
  startChallenge: () => request("/api/ranking/challenge", { method: "POST" }),
  // 20문제 답을 한 번에 제출 → 채점 결과 + 공식 랭킹 등록 여부 반환.
  // answers: [{ content_id, answer }]
  submitChallenge: (challengeId, answers) =>
    request("/api/ranking/challenge/submit", {
      method: "POST",
      body: JSON.stringify({ challenge_id: challengeId, answers }),
    }),
};
