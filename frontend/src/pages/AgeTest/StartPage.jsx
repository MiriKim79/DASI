import { useNavigate } from "react-router-dom";
import RetroWindow from "../../components/RetroWindow.jsx";
import MemoryBackdrop from "../../components/MemoryBackdrop.jsx";
import { markAgeCheckDone, markAgeCheckSessionDone } from "../../utils/ageCheckStatus.js";
import moriStartImage from "./assets/mori-start.png";
import "./AgeTest.css";

// #1: 나이 맞히기 시작 화면. 사이드바/공통 Layout 없이 단독으로 보여준다(#15, App.jsx에서 처리).
// 시작/패스 외 다른 메뉴는 두지 않는다.
export default function StartPage() {
  const navigate = useNavigate();

  return (
    <div className="page age-start-page">
      <MemoryBackdrop />
      <RetroWindow titleColor="#9b7bd4">
        <div className="age-start-grid">
          <div className="age-start__stage">
            <img
              className="age-start__bot"
              src={moriStartImage}
              alt="손을 흔들며 인사하는 모리"
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
              몇 가지 질문만 답하면,
              <br />
              네가 자라온 시간을 알 수 있어!
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
                onClick={() => {
                  // 패스도 완료로 취급해 챗봇 진입(#33)이 열리게 한다.
                  markAgeCheckDone();
                  // 이번 방문 세션에서는 "/" 진입 시 다시 나이맞히기로 튕기지 않게 한다.
                  markAgeCheckSessionDone();
                  navigate("/");
                }}
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
