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
};
