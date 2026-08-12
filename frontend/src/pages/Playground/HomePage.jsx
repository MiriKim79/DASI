import { useNavigate } from "react-router-dom";
import RetroWindow from "../../components/RetroWindow.jsx";

// 메인 화면: 두 개의 큰 진입 카드 (나이 다시 맞히기 / 추억 놀이터 가기)
// 마스코트 모리는 공통 Layout에서 렌더된다(홈·추억놀이터·랭킹·피드백).
// 클릭하면 챗봇이 열리는 연동도 Layout이 담당한다.
export default function HomePage() {
  const navigate = useNavigate();
  return (
    <div className="page page--home">
      <RetroWindow>
        <h1 className="window-heading">
          <span className="sparkle">✨</span>
          오늘은 어떤 추억을 꺼내볼래?
          <span className="sparkle">✨</span>
        </h1>

        <div className="home-cards">
          <button
            className="home-card"
            onClick={() => navigate("/age-check")}
          >
            <span className="home-card__icon" aria-hidden="true">
              📺
            </span>
            <span className="home-card__text">
              나이 다시 맞히기
              <small>몇 가지 질문으로 세대 추측!</small>
            </span>
            <span className="home-card__arrow" aria-hidden="true">
              ›
            </span>
          </button>

          <button
            className="home-card home-card--accent"
            onClick={() => navigate("/playground")}
          >
            <span className="home-card__icon" aria-hidden="true">
              🎮
            </span>
            <span className="home-card__text">
              추억 놀이터 가기
              <small>8개 분야의 추억 콘텐츠로 아재력 측정!</small>
            </span>
            <span className="home-card__arrow" aria-hidden="true">
              ›
            </span>
          </button>
        </div>
      </RetroWindow>

      <p className="page-footer">
        1990~2020년대 우리의 추억을 소환하는 시간 여행! 💜
      </p>
    </div>
  );
}
