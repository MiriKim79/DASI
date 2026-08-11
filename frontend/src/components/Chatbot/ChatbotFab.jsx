import { useLocation } from "react-router-dom";
import ChatbotPopup from "./ChatbotPopup.jsx";
import { useChatbot } from "./ChatbotContext.jsx";

// 우측 하단 FAB(#22, 어디서든 접근) — 나이맞히기 완료/패스 이후에만 노출(#33).
// 나이맞히기(/age-check 이하)는 아직 Layout 밖 별도 흐름(#15)이라 그 경로에서는 숨긴다.
// 1번이 결과 화면까지 완성하면 이 조건은 그대로 유효 — /age-check 하위 경로를 벗어나야 보인다.
// 열림 상태는 ChatbotContext로 공유한다 — 홈 화면의 걸어다니는 모리(MoriWanderer)를
// 클릭해도 같은 팝업이 열린다.
export default function ChatbotFab() {
  const location = useLocation();
  const { isOpen, toggle, close } = useChatbot();

  if (location.pathname.startsWith("/age-check")) return null;

  return (
    <>
      {isOpen && <ChatbotPopup onClose={close} />}
      <button
        className="chatbot-fab"
        onClick={toggle}
        aria-label={isOpen ? "챗봇 닫기" : "모리와 대화하기"}
      >
        {isOpen ? "✕" : "💬"}
      </button>
    </>
  );
}
