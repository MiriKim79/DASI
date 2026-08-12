import { useNavigate } from "react-router-dom";
import RetroWindow from "../../components/RetroWindow.jsx";
import MoriWanderer from "../../components/MoriWanderer.jsx";
import { useChatbot } from "../../components/Chatbot/ChatbotContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { isAgeCheckDone } from "../../utils/ageCheckStatus.js";

// 메인 화면: 두 개의 큰 진입 카드 (나이 다시 맞히기 / 추억 놀이터 가기)
export default function HomePage() {
  const navigate = useNavigate();
  const { isOpen: chatOpen, open: openChatbot } = useChatbot();
  // 로그인 여부 — 비로그인일 때만 코인 안내 배너를 띄운다.
  const { isAuthenticated, isLoading } = useAuth();
  // 나이맞히기를 완료(또는 패스)하기 전에는 챗봇 진입을 보여주지 않는다(#33).
  const ageCheckDone = isAgeCheckDone();
  return (
    <div className="page page--home">
      {/* 배경을 걸어다니는 마스코트 모리 — 클릭하면 우측 하단에 도킹되어 챗봇이 시작된다.
          도킹된 동안(chatOpen)에는 같은 모리가 두 마리로 보이지 않도록 wanderer는 숨긴다. */}
      {ageCheckDone && !chatOpen && <MoriWanderer onClick={openChatbot} hint="나 잡아봐라 🐾" />}

      <RetroWindow titleColor="#9b7bd4">
        {/* 비로그인 안내: 회원가입하면 코인 지급 (로그인하면 사라짐) */}
        {!isLoading && !isAuthenticated && (
          <button
            type="button"
            className="login-reward-banner"
            onClick={() => navigate("/signup")}
          >
            🎁 회원가입하면 <b>10코인</b>을 드려요!
          </button>
        )}
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
