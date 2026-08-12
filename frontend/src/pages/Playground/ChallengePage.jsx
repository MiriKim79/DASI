import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, getAccessToken } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import ContentCard from "../../components/ContentCard.jsx";
import RetroWindow from "../../components/RetroWindow.jsx";

// 랭킹용 통합 도전 화면 (#18/#21, role-2).
// [2026-08-13 갱신] 4번(@junghocomputer)이 만든 실제 랭킹 API(POST /api/ranking/challenge,
// POST /api/ranking/challenge/submit)에 연결했다. 이전에는 존재하지 않는
// /api/contents/challenge를 불러서 항상 422 에러가 났었다(README/FEATURES.md F4-3 참고).
//
// 랭킹 문제 풀은 전부 TEXT_QUIZ(사진/음성 보고 답 입력)라 객관식 분기는 없앴고,
// 문항별 즉시 채점도 없다 — 20문제를 다 푼 뒤 한 번에 제출하면 서버가 한꺼번에 채점한다
// (RankingSubmitIn이 20개 답을 한 번에 받는 구조라서).
const CHALLENGE_COUNT = 20;
const PRIMARY = "#6c5ce7";

export default function ChallengePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, setAuthenticatedUser } = useAuth();

  const [phase, setPhase] = useState("intro"); // intro | playing | done
  const [challengeId, setChallengeId] = useState(null);
  const [quiz, setQuiz] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [content_id]: 입력한 답 }
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [textInput, setTextInput] = useState("");
  const [finalResult, setFinalResult] = useState(null);

  const inputRef = useRef(null);
  const nextBtnRef = useRef(null);

  const current = quiz[index];
  const isLast = index >= quiz.length - 1;

  // 새 문제가 뜨면 입력창 자동 포커스
  useEffect(() => {
    if (phase === "playing" && current) {
      setTextInput(answers[current.content_id] || "");
      inputRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, phase]);

  const startChallenge = async () => {
    if (!getAccessToken()) {
      navigate("/login");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.startRankingChallenge();
      setChallengeId(data.challenge_id);
      setQuiz(data.questions);
      setIndex(0);
      setAnswers({});
      setFinalResult(null);
      setPhase("playing");
      // 코인 차감이 바로 반영되도록 상단바 잔액도 같이 갱신
      if (user) setAuthenticatedUser({ ...user, coin_balance: data.remaining_coin });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const goNext = () => {
    if (!current) return;
    setAnswers((prev) => ({ ...prev, [current.content_id]: textInput.trim() }));
    if (!isLast) {
      setIndex((i) => i + 1);
    }
  };

  const handleSubmitChallenge = async () => {
    if (!current || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const finalAnswers = { ...answers, [current.content_id]: textInput.trim() };
      const payload = quiz.map((q) => ({ content_id: q.content_id, answer: finalAnswers[q.content_id] || "" }));
      const res = await api.submitRankingChallenge(challengeId, payload);
      setFinalResult(res);
      setPhase("done");
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (isLast) handleSubmitChallenge();
    else goNext();
  };

  return (
    <div className="page page--centered">
      <RetroWindow titleColor={PRIMARY}>
        {/* ---------- 시작 안내 ---------- */}
        {phase === "intro" && (
          <div className="content-wrap">
            <h1 className="window-heading" style={{ color: PRIMARY }}>
              🏆 추억 챌린지
            </h1>
            <p className="state-msg">
              8개 분야에서 섞은 <b>{CHALLENGE_COUNT}문제</b>에 도전하세요!
              <br />
              정답률로 랭킹이 매겨지고, 도전에는 코인 10개가 필요해요.
            </p>
            {!isAuthenticated && (
              <p className="state-msg" style={{ fontSize: 13 }}>
                ※ 랭킹 도전은 로그인 후 이용할 수 있어요.
              </p>
            )}
            {isAuthenticated && (
              <p className="state-msg" style={{ fontSize: 13 }}>
                내 코인: 🪙 {user?.coin_balance ?? 0}
              </p>
            )}
            {error && <p className="state-msg state-msg--error">⚠️ {error}</p>}
            <div className="content-actions">
              <button
                className="primary-btn"
                style={{ backgroundColor: PRIMARY }}
                onClick={startChallenge}
                disabled={loading}
              >
                {loading ? "불러오는 중…" : "코인 10개로 도전 시작 →"}
              </button>
              <button className="ghost-btn" onClick={() => navigate("/playground")}>
                분야별로 즐기기
              </button>
            </div>
          </div>
        )}

        {/* ---------- 문제 진행 ---------- */}
        {phase === "playing" && current && (
          <div className="content-wrap">
            <p className="progress" style={{ color: PRIMARY }}>
              {index + 1} / {quiz.length}
            </p>

            <ContentCard
              content={{ image_url: current.image_url, question: current.question }}
              theme={{ primaryColor: PRIMARY, accentColor: "#efeafd", decoration: "❓" }}
            />

            <form
              className="text-answer"
              onSubmit={(e) => {
                e.preventDefault();
                if (isLast) handleSubmitChallenge();
                else goNext();
              }}
            >
              <input
                ref={inputRef}
                className="text-answer__input"
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="정답을 입력하세요"
                disabled={submitting}
                style={{ borderColor: PRIMARY }}
              />
            </form>
            <p className="state-msg" style={{ fontSize: 12 }}>
              정답 여부는 20문제를 모두 제출한 뒤 한 번에 확인돼요.
            </p>
            {error && <p className="state-msg state-msg--error">⚠️ {error}</p>}

            <div className="content-actions">
              {!isLast && (
                <button
                  ref={nextBtnRef}
                  className="primary-btn"
                  style={{ backgroundColor: PRIMARY }}
                  onClick={goNext}
                >
                  다음 문제 →
                </button>
              )}
              {isLast && (
                <button
                  ref={nextBtnRef}
                  className="primary-btn"
                  style={{ backgroundColor: PRIMARY }}
                  onClick={handleSubmitChallenge}
                  disabled={submitting}
                >
                  {submitting ? "채점 중…" : "🎉 제출하고 결과 보기"}
                </button>
              )}
              <button className="ghost-btn" onClick={() => navigate("/playground")}>
                그만두기
              </button>
            </div>
          </div>
        )}

        {/* ---------- 결과 ---------- */}
        {phase === "done" && finalResult && (
          <div className="content-wrap">
            <h1 className="window-heading" style={{ color: PRIMARY }}>
              {Math.round(finalResult.accuracy * 100)}점
            </h1>
            <p className="progress" style={{ color: PRIMARY, fontSize: 20 }}>
              {finalResult.correct_count} / {finalResult.total_count} 정답 · 정답률{" "}
              {Math.round(finalResult.accuracy * 100)}%
            </p>
            <p className="state-msg">
              {finalResult.official_recorded
                ? "오늘의 공식 랭킹에 반영됐어요! 🏆"
                : "오늘은 이미 공식 기록이 있어서, 이번 결과는 연습으로만 남아요."}
            </p>

            <div className="content-actions">
              <button className="primary-btn" style={{ backgroundColor: PRIMARY }} onClick={() => navigate("/ranking")}>
                🏆 랭킹 보러 가기
              </button>
              <button className="primary-btn" style={{ backgroundColor: PRIMARY }} onClick={startChallenge}>
                다시 도전 ↻
              </button>
              <button className="ghost-btn" onClick={() => navigate("/playground")}>
                놀이터로 돌아가기
              </button>
            </div>
          </div>
        )}
      </RetroWindow>
    </div>
  );
}
