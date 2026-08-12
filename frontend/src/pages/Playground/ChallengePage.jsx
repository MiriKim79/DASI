import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAccessToken } from "../../api/client.js";
import { rankingApi } from "../../api/ranking.js";
import { useAuth } from "../../context/AuthContext.jsx";
import ContentCard from "../../components/ContentCard.jsx";
import RetroWindow from "../../components/RetroWindow.jsx";

// 랭킹용 통합 도전 화면 (#18/#21).
// 8개 분야에서 섞은 20문제(전부 사진·노래 정답 입력형)에 도전한다.
// 로그인한 상태에서 도전하면(코인 10개 소모) 제출 결과가 공식 랭킹에 등록된다.
//   - POST /api/ranking/challenge        → 도전 시작(코인 차감·문제 20개)
//   - POST /api/ranking/challenge/submit → 20문제 답 일괄 제출·채점·랭킹 등록
// 부정 방지를 위해 문제별 정답은 내려오지 않는다. 답은 로컬에 모아 마지막에 한 번에 제출하고,
// 채점은 제출 시점에만 이루어진다(문제 푸는 중에는 정답/오답 표시가 없다).
const CHALLENGE_COUNT = 20;
const PRIMARY = "#6c5ce7";

export default function ChallengePage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [phase, setPhase] = useState("intro"); // intro | playing | done
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // 도전 진행 상태
  const [challengeId, setChallengeId] = useState(null);
  const [questions, setQuestions] = useState([]); // [{ content_id, position, question, image_url, content_type }]
  const [answers, setAnswers] = useState({}); // content_id -> 입력한 답
  const [index, setIndex] = useState(0);
  const [textInput, setTextInput] = useState("");
  const [finalResult, setFinalResult] = useState(null);

  const inputRef = useRef(null);

  const current = questions[index];
  const isLast = index >= questions.length - 1;
  const loggedIn = !!getAccessToken();

  // 새 문제가 뜨면 입력창에 자동 포커스 + 이전에 입력해둔 답 복원
  useEffect(() => {
    if (phase !== "playing" || !current) return;
    setTextInput(answers[current.content_id] ?? "");
    inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, phase]);

  const startChallenge = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await rankingApi.startChallenge();
      setChallengeId(data.challenge_id);
      setQuestions(data.questions);
      setAnswers({});
      setIndex(0);
      setTextInput("");
      setFinalResult(null);
      setPhase("playing");
      // 도전 시작으로 코인 10개가 차감됐으니 상단바를 갱신한다.
      refreshUser();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // 현재 문제의 답을 저장하고 다음 단계로 이동한다.
  const commitAnswer = () => {
    const next = { ...answers, [current.content_id]: textInput.trim() };
    setAnswers(next);
    return next;
  };

  const handleNext = () => {
    commitAnswer();
    setIndex((i) => i + 1);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    const collected = commitAnswer();
    setSubmitting(true);
    setError(null);
    try {
      const payload = questions.map((q) => ({
        content_id: q.content_id,
        answer: collected[q.content_id] ?? "",
      }));
      const res = await rankingApi.submitChallenge(challengeId, payload);
      setFinalResult(res);
      setPhase("done");
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (isLast) handleSubmit();
    else handleNext();
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
              결과는 <b>통합 랭킹</b>에 등록돼요.
            </p>

            {loggedIn ? (
              <p className="state-msg" style={{ fontSize: 13 }}>
                ※ 도전 1회에 <b>코인 10개</b>가 소모돼요. (하루 첫 도전만 공식 랭킹에 반영)
              </p>
            ) : (
              <p className="state-msg" style={{ fontSize: 13 }}>
                ※ 랭킹 도전은 <b>로그인 후</b> 가능해요.
              </p>
            )}

            {error && <p className="state-msg state-msg--error">⚠️ {error}</p>}

            <div className="content-actions">
              {loggedIn ? (
                <button
                  className="primary-btn"
                  style={{ backgroundColor: PRIMARY }}
                  onClick={startChallenge}
                  disabled={loading}
                >
                  {loading ? "불러오는 중…" : "도전 시작 →"}
                </button>
              ) : (
                <button
                  className="primary-btn"
                  style={{ backgroundColor: PRIMARY }}
                  onClick={() => navigate("/login")}
                >
                  로그인하러 가기 →
                </button>
              )}
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
              {index + 1} / {questions.length}
            </p>

            <ContentCard
              content={current}
              theme={{ primaryColor: PRIMARY, accentColor: "#efeafd", decoration: "❓" }}
            />

            <form className="text-answer" onSubmit={handleFormSubmit}>
              <input
                ref={inputRef}
                className="text-answer__input"
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="정답을 입력하세요"
                disabled={submitting}
                autoFocus
                style={{ borderColor: PRIMARY }}
              />
            </form>

            {error && <p className="state-msg state-msg--error">⚠️ {error}</p>}

            <div className="content-actions">
              {!isLast ? (
                <button
                  className="primary-btn"
                  style={{ backgroundColor: PRIMARY }}
                  onClick={handleNext}
                >
                  다음 문제 →
                </button>
              ) : (
                <button
                  className="primary-btn"
                  style={{ backgroundColor: PRIMARY }}
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? "제출 중…" : "🎉 제출하고 랭킹 등록"}
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
              {finalResult.official_recorded ? "🏆 랭킹 등록 완료!" : "채점 완료"}
            </h1>
            <p className="progress" style={{ color: PRIMARY, fontSize: 20 }}>
              {finalResult.correct_count} / {finalResult.total_count} 정답 ·{" "}
              {Math.round(finalResult.accuracy * 100)}% · {finalResult.elapsed_seconds}초
            </p>
            <p className="state-msg">
              {finalResult.official_recorded
                ? "오늘의 공식 기록으로 통합 랭킹에 등록되었어요!"
                : "오늘은 이미 공식 기록이 있어 이번 도전은 랭킹에 반영되지 않았어요. (내일 다시 도전!)"}
            </p>

            <div className="content-actions">
              <button
                className="primary-btn"
                style={{ backgroundColor: PRIMARY }}
                onClick={() => navigate("/ranking")}
              >
                🏆 랭킹 보기
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
