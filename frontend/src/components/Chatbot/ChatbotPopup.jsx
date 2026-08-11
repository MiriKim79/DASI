import { useState } from "react";
import RetroWindow from "../RetroWindow.jsx";
import GenerationSelect from "./GenerationSelect.jsx";
import ChatWindow from "./ChatWindow.jsx";

// FAB(#22)로 열고 닫는 챗봇 팝업. 세대 선택(#23) ↔ 채팅(#24) 전환은 내부 상태로 처리.
export default function ChatbotPopup({ onClose }) {
  const [generation, setGeneration] = useState(null);

  return (
    <div className="chatbot-popup">
      <RetroWindow titleColor="#8A5FE0" onClose={onClose}>
        {generation ? (
          <ChatWindow generation={generation} onBack={() => setGeneration(null)} />
        ) : (
          <>
            <h1 className="window-heading">
              <span className="sparkle">✨</span>
              모리와 다시 만나기
              <span className="sparkle">✨</span>
            </h1>
            <GenerationSelect onSelect={setGeneration} />
          </>
        )}
      </RetroWindow>
    </div>
  );
}
