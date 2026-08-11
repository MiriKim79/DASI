// 레트로 OS 창 프레임 (타이틀바 + 창 버튼 + 본문).
// 모든 화면이 이 창을 재사용한다. titleColor 로 분야별 색상만 바꾼다.
export default function RetroWindow({ titleColor = "#C7B8E8", children }) {
  return (
    <div className="retro-window">
      <div className="retro-titlebar" style={{ backgroundColor: titleColor }}>
        <span className="retro-titlebar__title">✨ 다시</span>
        <span className="retro-titlebar__buttons" aria-hidden="true">
          <span className="winbtn">–</span>
          <span className="winbtn">□</span>
          <span className="winbtn">✕</span>
        </span>
      </div>
      <div className="retro-window__body">{children}</div>
    </div>
  );
}
