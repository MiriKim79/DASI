import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import RetroWindow from "../../components/RetroWindow.jsx";
import MemoryBackdrop from "../../components/MemoryBackdrop.jsx";
import { ageTestApi } from "../../api/ageTest.js";
import { markAgeCheckDone, markAgeCheckSessionDone } from "../../utils/ageCheckStatus.js";
import "./AgeTest.css";

// #8: 나이 맞히기 결과 화면. #3(QuizPage)이 navigate state로 넘겨준 답변을 받아
// #4(POST /api/age-test/submit)를 호출해 실제 결과를 표시한다. 고정된 fake 결과 없음.
// 사이드바/공통 Layout 없이 단독으로 보여준다(#15).
//
// 로그인 여부 판단: 4번 담당(#38~#40) 로그인 기능이 아직 없어서, FEATURES.md의
// 로그인 응답 필드명(access_token)을 기준으로 localStorage를 직접 확인한다.
// 실제 로그인 기능이 이 키로 토큰을 저장하면 별도 수정 없이 그대로 연동된다.
function hasLoginToken() {
  try {
    return Boolean(localStorage.getItem("access_token"));
  } catch (e) {
    return false;
  }
}

export default function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const answers = location.state?.answers;

  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!answers || answers.length === 0) {
      setStatus("no-data");
      return;
    }
    let cancelled = false;
    ageTestApi
      .submitAnswers(answers)
      .then((data) => {
        if (cancelled) return;
        setResult(data);
        setStatus("ready");
        // 결과를 실제로 받았다 = 나이맞히기 완료 → 챗봇 진입 노출(#33).
        markAgeCheckDone();
        // 이번 방문 세션에서는 "/" 진입 시 다시 나이맞히기로 튕기지 않게 한다.
        markAgeCheckSessionDone();
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "loading") {
    return (
      <div className="page age-start-page">
        <MemoryBackdrop />
        <RetroWindow titleColor="transparent">
          <p className="age-quiz__state">결과를 계산하는 중...</p>
        </RetroWindow>
      </div>
    );
  }

  if (status === "no-data") {
    return (
      <div className="page age-start-page">
        <MemoryBackdrop />
        <RetroWindow titleColor="transparent">
          <p className="age-quiz__state">퀴즈를 먼저 풀어야 결과를 볼 수 있어요.</p>
          <div className="age-result__actions">
            <button
              type="button"
              className="age-start__btn age-start__btn--primary"
              onClick={() => navigate("/age-check/quiz")}
            >
              퀴즈 풀러 가기
            </button>
          </div>
        </RetroWindow>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="page age-start-page">
        <MemoryBackdrop />
        <RetroWindow titleColor="transparent">
          <p className="age-quiz__state age-quiz__state--error">
            결과를 불러오지 못했어요. 잠시 후 다시 시도해주세요.
          </p>
          <div className="age-result__actions">
            <button
              type="button"
              className="age-start__btn age-start__btn--primary"
              onClick={() => navigate("/age-check/quiz")}
            >
              다시하기
            </button>
          </div>
        </RetroWindow>
      </div>
    );
  }

  const loggedIn = hasLoginToken();

  return (
    <div className="page age-start-page">
      <MemoryBackdrop />
      <RetroWindow titleColor="transparent">
        <div className="age-result">
          <p className="age-result__badge">✨ 모리가 예상한 너의 나이 ✨</p>
          <div className="age-result__hero">
            <img src="/mori/mori-06.png" alt="기뻐하는 모리" />
            <p className="age-result__age">
              {result.estimated_age}
              <span>세</span>
            </p>
          </div>

          <div className="age-result__reasons">
            <p className="age-result__reasons-title">모리가 나이를 눈치챈 순간 TOP 3</p>
            <ol>
              {result.top_reasons.map((reason, index) => (
                <li key={reason}>
                  <span className="age-result__reason-number">{String(index + 1).padStart(2, "0")}</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ol>
          </div>

          {!loggedIn && (
            <p className="age-result__login-hint">
              회원가입하면 10코인을 드려요!
              <button
                type="button"
                className="age-result__login-btn"
                onClick={() => navigate("/login")}
              >
                로그인하러 가기
              </button>
            </p>
          )}

          <div className="age-result__actions">
            <button
              type="button"
              className="age-start__btn age-start__btn--primary"
              onClick={() => navigate("/age-check/quiz")}
            >
              다시하기
            </button>
            <button
              type="button"
              className="age-start__btn age-start__btn--ghost"
              onClick={() => navigate("/")}
            >
              메인으로 이동
            </button>
          </div>
        </div>
      </RetroWindow>
    </div>
  );
}
