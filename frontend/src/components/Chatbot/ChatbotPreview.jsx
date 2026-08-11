import { useState } from "react";
import RetroWindow from "../RetroWindow.jsx";
import GenerationSelect from "./GenerationSelect.jsx";
import ChatWindow from "./ChatWindow.jsx";

// 개발 중 미리보기 전용 화면(임시 라우트 /chatbot-preview 로 연결됨).
// FAB(#22)와 팝업 컨테이너가 만들어지면 이 안의 화면 전환 로직을 그쪽으로 옮기고
// 이 컴포넌트/라우트는 지운다.
export default function ChatbotPreview() {
  const [generation, setGeneration] = useState(null);

  return (
    <div className="page">
      <RetroWindow titleColor="#8A5FE0">
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
