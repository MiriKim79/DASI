import RetroWindow from "../components/RetroWindow.jsx";

// 타 팀원 담당 기능 자리표시 페이지 (라우팅/사이드바 연결 확인용).
export default function PlaceholderPage({ title, note }) {
  return (
    <div className="page page--centered">
      <RetroWindow titleColor="#9b7bd4">
        <h1 className="window-heading">
          <span className="sparkle">✨</span>
          {title}
          <span className="sparkle">✨</span>
        </h1>
        <p className="state-msg">{note || "이 기능은 준비 중이에요. 🛠️"}</p>
      </RetroWindow>
    </div>
  );
}
