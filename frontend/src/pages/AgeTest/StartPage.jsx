import { useNavigate } from "react-router-dom";
import RetroWindow from "../../components/RetroWindow.jsx";
import ageBotImage from "./assets/age-bot.png";
import "./AgeTest.css";

// #1: 나이 맞히기 시작 화면. 사이드바/공통 Layout 없이 단독으로 보여준다(#15, App.jsx에서 처리).
// 시작/패스 외 다른 메뉴는 두지 않는다.
export default function StartPage() {
  const navigate = useNavigate();

  return (
    <div className="page age-start-page">
      <RetroWindow titleColor="#9b7bd4">
        <div className="age-start-grid">
          <div className="age-start__stage">
            <img
              className="age-start__bot"
              src={ageBotImage}
              alt="웃는 얼굴이 나타난 레트로 컴퓨터와 빨간 카세트테이프"
            />
            <span className="age-start__bubble" aria-hidden="true">
              <PixelHeart />
            </span>
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
                [ 나이 들키러 가기 ]
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

function PixelHeart({ size = 3, color = "#ef5a72" }) {
  return <PixelIcon rows={HEART_ROWS} size={size} color={color} />;
}
