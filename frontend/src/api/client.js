// 추억 놀이터 API 클라이언트
// 개발 시 vite proxy 를 통해 /api -> http://localhost:8000 로 전달된다.
// 배포 시 VITE_API_BASE_URL로 백엔드 주소를 지정할 수 있다.
const BASE = import.meta.env.VITE_API_BASE_URL || "";
const ACCESS_TOKEN_KEY = "access_token";

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

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

export const api = {
  signup: ({ email, password, nickname }) =>
    request("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, nickname }),
    }),
  login: ({ email, password }) =>
    request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  getMe: () => request("/api/me"),
  getCategories: () => request("/api/categories"),
  getCategory: (id) => request(`/api/categories/${id}`),
  getContents: (category, subcategory) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (subcategory) params.set("subcategory", subcategory);
    return request(`/api/contents?${params.toString()}`);
  },
  getRandomContent: (category, subcategory) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (subcategory) params.set("subcategory", subcategory);
    return request(`/api/contents/random?${params.toString()}`);
  },
  getContent: (id) => request(`/api/contents/${id}`),
  // 랭킹용 통합 도전: 8개 분야에서 섞은 20문제 (정답 미포함)
  getChallenge: (count = 20) =>
    request(`/api/contents/challenge?count=${count}`),
  answer: (contentId, optionId) =>
    request(`/api/contents/${contentId}/answer`, {
      method: "POST",
      body: JSON.stringify({ option_id: optionId }),
    }),
  answerText: (contentId, text) =>
    request(`/api/contents/${contentId}/answer-text`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
  getResult: (correct, total, category) =>
    request("/api/playground/result", {
      method: "POST",
      body: JSON.stringify({ correct, total, category }),
    }),
};
