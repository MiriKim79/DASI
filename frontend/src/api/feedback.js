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

  return res.json();
}

export const feedbackApi = {
  createFeedback: (content) =>
    request("/api/feedback", {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
};
