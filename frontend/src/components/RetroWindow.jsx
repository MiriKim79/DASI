// 레트로 OS 창 프레임 (타이틀바 + 창 버튼 + 본문).
// 모든 화면이 이 창을 재사용한다. titleColor 로 분야별 색상만 바꾼다.
export default function RetroWindow({ titleColor = "#C7B8E8", onClose, children }) {
  return (
    <div className="retro-window">
      <div className="retro-titlebar" style={{ backgroundColor: titleColor }}>
        <span className="retro-titlebar__title">✨ DASI</span>
        <span className="retro-titlebar__buttons" aria-hidden={!onClose}>
          <span className="winbtn">–</span>
          <span className="winbtn">□</span>
          <span
            className="winbtn"
            role={onClose ? "button" : undefined}
            tabIndex={onClose ? 0 : undefined}
            onClick={onClose}
            onKeyDown={onClose ? (e) => (e.key === "Enter" || e.key === " ") && onClose() : undefined}
          >
            ✕
          </span>
        </span>
      </div>
      <div className="retro-window__body">{children}</div>
    </div>
  );
}
