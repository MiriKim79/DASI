import { useNavigate } from "react-router-dom";
import RetroWindow from "../../components/RetroWindow.jsx";
import "./AgeTest.css";

// #1: 나이 맞히기 시작 화면. 사이드바/공통 Layout 없이 단독으로 보여준다(#15, App.jsx에서 처리).
// 시작/패스 외 다른 메뉴는 두지 않는다.
export default function StartPage() {
  const navigate = useNavigate();

  return (
    <div className="page age-start-page">
      <RetroWindow titleColor="transparent">
        <div className="age-start-grid">
          <div className="age-start__stage">
            <span className="age-start__spark age-start__spark--1">✦</span>
            <span className="age-start__spark age-start__spark--2">✦</span>
            <AgeBot />
            <span className="age-start__bubble" aria-hidden="true">
              ❤️
            </span>
            <Cassette />
          </div>

          <div className="age-start__copy">
            <h1 className="age-start__headline">
              내가 네 나이
              <br />
              <span className="age-start__accent">맞혀볼게!</span>
            </h1>
            <p className="age-start__subtext">
              몇 가지 질문만 답해봐.
              <br />
              설마 이것도 무서운 건 아니지?
            </p>

            <div className="age-start__actions">
              <button
                type="button"
                className="age-start__btn age-start__btn--primary"
                onClick={() => navigate("/age-check/quiz")}
              >
                시작하기
              </button>
              <button
                type="button"
                className="age-start__btn age-start__btn--ghost"
                onClick={() => navigate("/")}
              >
                쫄리면 패스하기 →
              </button>
            </div>
          </div>
        </div>
      </RetroWindow>
    </div>
  );
}

function AgeBot() {
  return (
    <svg className="age-start__bot" viewBox="0 -12 200 222" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="botBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fffdf6" />
          <stop offset="100%" stopColor="var(--age-cream)" />
        </linearGradient>
        <filter id="botShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#5a4a8a" floodOpacity="0.22" />
        </filter>
      </defs>

      <g filter="url(#botShadow)">
        {/* 안테나 */}
        <line x1="72" y1="20" x2="55" y2="2" stroke="var(--age-border)" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="128" y1="20" x2="145" y2="2" stroke="var(--age-border)" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="55" cy="2" r="7" fill="#f4c94f" stroke="var(--age-border)" strokeWidth="2.5" />
        <circle cx="145" cy="2" r="7" fill="#f4c94f" stroke="var(--age-border)" strokeWidth="2.5" />

        {/* 모니터 본체 (받침대와 분리된 별도 사각형) */}
        <rect x="26" y="18" width="148" height="118" rx="22" fill="url(#botBody)" stroke="var(--age-border)" strokeWidth="4" />
        <rect x="45" y="35" width="110" height="80" rx="14" fill="#241f38" stroke="var(--age-border)" strokeWidth="3" />

        {/* 얼굴 (초록 픽셀) */}
        <circle cx="82" cy="70" r="6.5" fill="#6dffb0" />
        <circle cx="118" cy="70" r="6.5" fill="#6dffb0" />
        <path d="M80 91 Q100 105 120 91" fill="none" stroke="#6dffb0" strokeWidth="4.5" strokeLinecap="round" />

        {/* 받침대 (모니터와 살짝 떨어진 별도 사각형) */}
        <rect x="40" y="150" width="120" height="50" rx="16" fill="url(#botBody)" stroke="var(--age-border)" strokeWidth="4" />
        <rect x="56" y="163" width="46" height="11" rx="5.5" fill="#fff" stroke="var(--age-border)" strokeWidth="2.5" />
        <circle cx="66" cy="188" r="6" fill="var(--age-border)" stroke="var(--age-border)" strokeWidth="2.5" />
        <circle cx="85" cy="188" r="6" fill="var(--age-accent)" stroke="var(--age-border)" strokeWidth="2.5" />
        <rect x="112" y="180" width="32" height="14" rx="4" fill="#fff" stroke="var(--age-border)" strokeWidth="2.5" />
      </g>
    </svg>
  );
}

function Cassette() {
  return (
    <svg className="age-start__cassette" viewBox="0 0 86 56" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="tapeShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#5a4a8a" floodOpacity="0.22" />
        </filter>
      </defs>
      <g filter="url(#tapeShadow)">
        <rect x="1" y="1" width="84" height="54" rx="12" fill="#ef5a72" stroke="var(--age-border)" strokeWidth="3" />
        <rect x="12" y="13" width="25" height="19" rx="9.5" fill="var(--age-cream)" stroke="var(--age-border)" strokeWidth="3" />
        <rect x="49" y="13" width="25" height="19" rx="9.5" fill="var(--age-cream)" stroke="var(--age-border)" strokeWidth="3" />
        <circle cx="24.5" cy="22.5" r="4" fill="#b8324c" />
        <circle cx="61.5" cy="22.5" r="4" fill="#b8324c" />
        <rect x="16" y="38" width="54" height="7" rx="3.5" fill="var(--age-cream)" opacity="0.9" />
      </g>
    </svg>
  );
}
