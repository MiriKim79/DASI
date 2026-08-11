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
            <span className="age-start__deco age-start__deco--envelope" aria-hidden="true">
              <PixelEnvelope />
            </span>
            <span className="age-start__deco age-start__deco--folder" aria-hidden="true">
              <PixelFolder />
            </span>
            <AgeBot />
            <span className="age-start__bubble" aria-hidden="true">
              <PixelHeart />
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
                나이 들키러 가기
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
        {/* 안테나 (끝을 각진 픽셀 블록으로) */}
        <line x1="72" y1="20" x2="55" y2="2" stroke="var(--age-border)" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="128" y1="20" x2="145" y2="2" stroke="var(--age-border)" strokeWidth="3.5" strokeLinecap="round" />
        <rect x="48" y="-5" width="14" height="14" fill="#f4c94f" stroke="var(--age-border)" strokeWidth="2.5" shapeRendering="crispEdges" />
        <rect x="138" y="-5" width="14" height="14" fill="#f4c94f" stroke="var(--age-border)" strokeWidth="2.5" shapeRendering="crispEdges" />

        {/* 모니터 본체 (받침대와 분리된 별도 사각형) */}
        <rect x="26" y="18" width="148" height="118" rx="22" fill="url(#botBody)" stroke="var(--age-border)" strokeWidth="4" />
        <rect x="45" y="35" width="110" height="80" rx="14" fill="#241f38" stroke="var(--age-border)" strokeWidth="3" />

        {/* CRT 스캔라인 */}
        <g opacity="0.16" shapeRendering="crispEdges">
          <rect x="47" y="41" width="106" height="3" fill="#6dffb0" />
          <rect x="47" y="53" width="106" height="3" fill="#6dffb0" />
          <rect x="47" y="65" width="106" height="3" fill="#6dffb0" />
          <rect x="47" y="77" width="106" height="3" fill="#6dffb0" />
          <rect x="47" y="89" width="106" height="3" fill="#6dffb0" />
          <rect x="47" y="101" width="106" height="3" fill="#6dffb0" />
        </g>

        {/* 얼굴 (각진 픽셀 눈/입) */}
        <g shapeRendering="crispEdges">
          <rect x="76" y="64" width="12" height="12" fill="#6dffb0" />
          <rect x="112" y="64" width="12" height="12" fill="#6dffb0" />
          <rect x="80" y="92" width="8" height="6" fill="#6dffb0" />
          <rect x="88" y="98" width="8" height="6" fill="#6dffb0" />
          <rect x="104" y="98" width="8" height="6" fill="#6dffb0" />
          <rect x="112" y="92" width="8" height="6" fill="#6dffb0" />
        </g>

        {/* 받침대 (모니터와 살짝 떨어진 별도 사각형) */}
        <rect x="40" y="150" width="120" height="50" rx="16" fill="url(#botBody)" stroke="var(--age-border)" strokeWidth="4" />
        <rect x="56" y="163" width="46" height="11" rx="5.5" fill="#fff" stroke="var(--age-border)" strokeWidth="2.5" />
        <rect x="60" y="184" width="12" height="12" fill="var(--age-border)" stroke="var(--age-border)" strokeWidth="2.5" shapeRendering="crispEdges" />
        <rect x="79" y="184" width="12" height="12" fill="var(--age-accent)" stroke="var(--age-border)" strokeWidth="2.5" shapeRendering="crispEdges" />
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
        {/* 릴을 각진 픽셀 톱니로 */}
        <g shapeRendering="crispEdges">
          <rect x="21.5" y="19.5" width="6" height="6" fill="#b8324c" />
          <rect x="17.5" y="15.5" width="4" height="4" fill="#b8324c" />
          <rect x="27.5" y="15.5" width="4" height="4" fill="#b8324c" />
          <rect x="17.5" y="25.5" width="4" height="4" fill="#b8324c" />
          <rect x="27.5" y="25.5" width="4" height="4" fill="#b8324c" />
          <rect x="58.5" y="19.5" width="6" height="6" fill="#b8324c" />
          <rect x="54.5" y="15.5" width="4" height="4" fill="#b8324c" />
          <rect x="64.5" y="15.5" width="4" height="4" fill="#b8324c" />
          <rect x="54.5" y="25.5" width="4" height="4" fill="#b8324c" />
          <rect x="64.5" y="25.5" width="4" height="4" fill="#b8324c" />
        </g>
        <rect x="16" y="38" width="54" height="7" rx="3.5" fill="var(--age-cream)" opacity="0.9" />
      </g>
    </svg>
  );
}

// 도트 그리드(문자열 배열)를 픽셀 SVG로 그리는 공용 헬퍼. 시작 화면의 작은 장식 아이콘 전용.
function PixelIcon({ rows, size = 3, color }) {
  const cols = rows[0].length;
  return (
    <svg width={size * cols} height={size * rows.length} viewBox={`0 0 ${cols} ${rows.length}`} shapeRendering="crispEdges" aria-hidden="true">
      {rows.map((row, y) =>
        [...row].map((c, x) =>
          c === "X" ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={color} /> : null
        )
      )}
    </svg>
  );
}

const HEART_ROWS = [".XX.XX.", "XXXXXXX", "XXXXXXX", ".XXXXX.", "..XXX..", "...X..."];
const ENVELOPE_ROWS = ["..XXX..", ".XXXXX.", "XXXXXXX", "X.....X", "X.....X", "X.....X", "XXXXXXX"];
const FOLDER_ROWS = ["XXX.....", "XXXXXXXX", "X......X", "X......X", "X......X", "XXXXXXXX"];

function PixelHeart({ size = 3, color = "#ef5a72" }) {
  return <PixelIcon rows={HEART_ROWS} size={size} color={color} />;
}

function PixelEnvelope({ size = 3, color = "#f0c04a" }) {
  return <PixelIcon rows={ENVELOPE_ROWS} size={size} color={color} />;
}

function PixelFolder({ size = 3, color = "#83d8bd" }) {
  return <PixelIcon rows={FOLDER_ROWS} size={size} color={color} />;
}
