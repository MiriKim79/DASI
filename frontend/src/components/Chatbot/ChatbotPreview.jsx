import RetroWindow from "../RetroWindow.jsx";
import GenerationSelect from "./GenerationSelect.jsx";

// 개발 중 미리보기 전용 화면(임시 라우트 /chatbot-preview 로 연결됨).
// FAB(#22)와 팝업 컨테이너가 만들어지면 GenerationSelect를 그 안으로 옮기고
// 이 컴포넌트/라우트는 지운다.
export default function ChatbotPreview() {
  return (
    <div className="page">
      <RetroWindow titleColor="#8A5FE0">
        <h1 className="window-heading">
          <span className="sparkle">✨</span>
          모리와 다시 만나기
          <span className="sparkle">✨</span>
        </h1>
        <GenerationSelect onSelect={(g) => console.log("[chatbot] selected generation:", g)} />
      </RetroWindow>
    </div>
  );
}
