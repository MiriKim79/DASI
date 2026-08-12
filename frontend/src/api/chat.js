// 세대별 챗봇 API 클라이언트 — 3번 담당.
// client.js(추억놀이터)와 같은 fetch 패턴을 쓰되, 담당 영역을 분리하려고 파일을 따로 둔다.
import { getAccessToken } from "./client.js";

const BASE = import.meta.env.VITE_API_BASE_URL || "";

async function request(path, options) {
  const token = getAccessToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options && options.headers),
      // 로그인 상태면 토큰을 함께 보내 대화가 DB에 저장되게 한다(#31).
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

export const chatApi = {
  // F3-1: 세대 목록 조회
  getGenerations: () => request("/api/generations"),
  // F3-2: 채팅. history는 F3-3 정책대로 호출부(컴포넌트)가 들고 있다가 매번 함께 보낸다.
  sendMessage: ({ generation, message, history }) =>
    request("/api/chat", {
      method: "POST",
      body: JSON.stringify({ generation, message, history }),
    }),
  // F3-4: 개그 콘텐츠 + 채점
  getGagItems: () => request("/api/gag"),
  answerGagItem: (itemId, answer) =>
    request(`/api/gag/${itemId}/answer`, {
      method: "POST",
      body: JSON.stringify({ answer }),
    }),
};
