import { createContext, useContext, useMemo, useState } from "react";

const ChatbotContext = createContext(null);

// 챗봇 팝업의 열림 상태를 앱 전역에서 공유한다.
// FAB(#22)뿐 아니라 홈 화면의 걸어다니는 모리(MoriWanderer) 클릭으로도
// 같은 팝업을 열 수 있게 하기 위한 공용 상태.
export function ChatbotProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo(
    () => ({
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen((v) => !v),
    }),
    [isOpen]
  );

  return <ChatbotContext.Provider value={value}>{children}</ChatbotContext.Provider>;
}

export function useChatbot() {
  const ctx = useContext(ChatbotContext);
  if (!ctx) {
    throw new Error("useChatbot은 <ChatbotProvider> 안에서만 사용할 수 있어요.");
  }
  return ctx;
}
