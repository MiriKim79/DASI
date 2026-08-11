import { useState } from "react";
import { useLocation } from "react-router-dom";
import ChatbotPopup from "./ChatbotPopup.jsx";

// 우측 하단 FAB(#22, 어디서든 접근) — 나이맞히기 완료/패스 이후에만 노출(#33).
// 나이맞히기(/age-check 이하)는 아직 Layout 밖 별도 흐름(#15)이라 그 경로에서는 숨긴다.
// 1번이 결과 화면까지 완성하면 이 조건은 그대로 유효 — /age-check 하위 경로를 벗어나야 보인다.
export default function ChatbotFab() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  if (location.pathname.startsWith("/age-check")) return null;

  return (
    <>
      {open && <ChatbotPopup onClose={() => setOpen(false)} />}
      <button
        className="chatbot-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "챗봇 닫기" : "모리와 대화하기"}
      >
        {open ? "✕" : "💬"}
      </button>
    </>
  );
}
