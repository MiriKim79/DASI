import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useChatbot } from "./ChatbotContext.jsx";
import GenerationSelect from "./GenerationSelect.jsx";
import ChatWindow from "./ChatWindow.jsx";

// 세대별 의상 이미지가 있으면 그걸 쓰고, 없으면(로드 실패) 기본 모리로 폴백.
// character가 없으면(세대 선택 전) 처음부터 기본 모리를 보여준다.
// CharacterAvatar와 같은 폴백 패턴 — key={character}로 세대가 바뀔 때마다
// 폴백 상태를 초기화해서 새 세대 이미지를 다시 시도하게 한다.
function DockedFigure({ character }) {
  const [failed, setFailed] = useState(false);
  if (!character || failed) {
    return <img className="docked-mori__figure" src="/mori/mori-13.png" alt="모리" />;
  }
  return (
    <img
      className="docked-mori__figure"
      src={`/characters/${character}.png`}
      alt="모리"
      onError={() => setFailed(true)}
    />
  );
}

// 세대별 채팅 UI 테마 — 기능/구조는 그대로 두고 CSS 클래스만 바꿔서 시대 감성을 입힌다.
const THEME_CLASS_BY_GENERATION = {
  "1990s": "theme-90s",
  "2000s": "theme-00s",
  "2010s": "theme-10s",
  "2020s": "theme-20s",
};

// 우측 하단에 서 있는 모리 + 말풍선 챗봇(#22 대체).
// 홈 화면의 걸어다니는 모리(MoriWanderer)를 클릭하면 여기로 "도착"한 것처럼 보이도록,
// 같은 순간에 wanderer는 숨고 이 도킹된 모리가 나타난다(HomePage에서 처리).
// 나이맞히기 화면(/age-check 이하)에서는 기존 FAB와 동일하게 숨긴다(#33).
// 세대를 선택하면 우측 하단 모리도 그 세대 의상으로 바뀐다. 세대 선택 전에는 기본 모리(mori-13)를 쓴다.
// 개그 퀴즈(F3-4)는 별도 화면이 아니라 ChatWindow 안에서 대화형으로 진행된다.
export default function DockedMori() {
  const location = useLocation();
  const { isOpen, close } = useChatbot();
  const [generation, setGeneration] = useState(null);

  // isOpen이 false여도 이 컴포넌트 자체는 계속 마운트된 채로 null만 렌더한다
  // (App.jsx에 <DockedMori />가 항상 있음) — 그래서 state가 저절로 안 사라진다.
  // 닫힐 때마다 명시적으로 초기화해서, 다음에 열 때 항상 세대 선택부터 시작하게 한다.
  useEffect(() => {
    if (!isOpen) {
      setGeneration(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;
  if (location.pathname.startsWith("/age-check")) return null;

  const character = generation?.character ?? null;
  const themeClass = generation ? THEME_CLASS_BY_GENERATION[generation.id] : "";

  return (
    <div className="docked-mori">
      <div className={`docked-mori__bubble${themeClass ? ` ${themeClass}` : ""}`}>
        <button className="docked-mori__close" onClick={close} aria-label="챗봇 닫기">
          ✕
        </button>
        {!generation && (
          <div className="docked-mori__select-panel">
            <h1 className="window-heading docked-mori__heading">
              <span className="sparkle">✨</span>
              모리와 다시 만나기
              <span className="sparkle">✨</span>
            </h1>
            <GenerationSelect onSelect={setGeneration} />
          </div>
        )}
        {generation && <ChatWindow generation={generation} onBack={() => setGeneration(null)} />}
      </div>
      <DockedFigure character={character} key={character} />
    </div>
  );
}
