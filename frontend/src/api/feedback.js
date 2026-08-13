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
    let detail = "피드백 등록에 실패했습니다.";
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch (e) {
      /* ignore */
    }
    throw new Error(detail);
  }

  // 삭제(DELETE)는 204 No Content라 본문이 없다 — json() 파싱을 건너뛴다.
  if (res.status === 204) return null;

  return res.json();
}

export const feedbackApi = {
  getFeedbacks: () => request("/api/feedback"),
  createFeedback: (content) =>
    request("/api/feedback", {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
  // 본인이 작성한 피드백만 삭제할 수 있다(서버가 소유자를 검증).
  deleteFeedback: (id) =>
    request(`/api/feedback/${id}`, { method: "DELETE" }),
  // 좋아요/싫어요 토글. 글 하나당 사용자별 반응은 1개만 남는다(같은 걸 다시 누르면 취소).
  // reaction: "LIKE" | "DISLIKE"
  reactToFeedback: (id, reaction) =>
    request(`/api/feedback/${id}/reaction`, {
      method: "POST",
      body: JSON.stringify({ reaction }),
    }),
};
