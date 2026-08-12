import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, getAccessToken } from "../../api/client.js";
import ContentCard from "../../components/ContentCard.jsx";
import AnswerButton from "../../components/AnswerButton.jsx";
import RetroWindow from "../../components/RetroWindow.jsx";

// 랭킹용 통합 도전 화면 (#18/#21, role-2).
// 8개 분야에서 섞은 20문제를 풀어 점수를 내고, 그 점수를 랭킹에 등록한다.
// ※ 랭킹 '등록' API(POST /api/ranking/submit)는 4번(role-4) 담당이라 아직 없다.
//    지금은 점수 계산까지만 하고, 등록 버튼은 규격이 나오면 handleSubmitRanking에 연결한다.
const CHALLENGE_COUNT = 20;
const PRIMARY = "#6c5ce7";

export default function ChallengePage() {
  const navigate = useNavigate();

  const [phase, setPhase] = useState("intro"); // intro | playing | done
  const [quiz, setQuiz] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 답변 상태
  const [selectedId, setSelectedId] = useState(null);
  const [result, setResult] = useState(null); // 객관식 결과
  const [textInput, setTextInput] = useState("");
  const [textResult, setTextResult] = useState(null); // 텍스트형 결과
  const [submitting, setSubmitting] = useState(false);

  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [finalResult, setFinalResult] = useState(null);

  const inputRef = useRef(null);
  const nextBtnRef = useRef(null);

  const current = quiz[index];
  const isLast = index >= quiz.length - 1;
  const isTextQuiz = current && current.content_type === "TEXT_QUIZ";
  const answered = !!result || !!textResult;

  function resetAnswer() {
    setSelectedId(null);
    setResult(null);
    setTextInput("");
    setTextResult(null);
  }

  // 새 텍스트 문제가 뜨면 입력창 자동 포커스
  useEffect(() => {
    if (phase === "playing" && current && isTextQuiz && !answered) {
      inputRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, isTextQuiz, answered, phase]);

  // 답을 제출하면 '다음/결과' 버튼으로 포커스 이동 (Enter 한 번 더로 진행)
  useEffect(() => {
    if (answered) nextBtnRef.current?.focus();
  }, [answered]);

  const startChallenge = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getChallenge(CHALLENGE_COUNT);
      setQuiz(data);
      setIndex(0);
      resetAnswer();
      setStats({ correct: 0, total: 0 });
      setFinalResult(null);
      setPhase("playing");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ----- 객관식 답변 -----
  const handleAnswer = async (option) => {
    if (answered || submitting) return;
    setSubmitting(true);
    setSelectedId(option.id);
    try {
      const res = await api.answer(current.id, option.id);
      setResult(res);
      setStats((s) => ({
        correct: s.correct + (res.is_correct ? 1 : 0),
        total: s.total + 1,
      }));
    } catch (e) {
      setError(e.message);
      setSelectedId(null);
    } finally {
      setSubmitting(false);
    }
  };

  // ----- 텍스트 입력형 답변 -----
  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (answered || submitting || !textInput.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.answerText(current.id, textInput.trim());
      setTextResult(res);
      setStats((s) => ({
        correct: s.correct + (res.is_correct ? 1 : 0),
        total: s.total + 1,
      }));
    } catch (e2) {
      setError(e2.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    resetAnswer();
    setIndex((i) => i + 1);
  };

  const handleShowResult = async () => {
    try {
      const res = await api.getResult(stats.correct, stats.total, "CHALLENGE");
      setFinalResult(res);
      setPhase("done");
    } catch (e) {
      setError(e.message);
    }
  };

  // TODO(#21): 4번 랭킹 제출 API(POST /api/ranking/submit) 규격이 확정되면 여기서 호출한다.
  //   예) await api.submitRanking({ score: finalResult.score, total: stats.total })
  //   - 로그인(access_token) 필요. 아래 버튼은 규격이 나올 때까지 비활성.
  const handleSubmitRanking = () => {
    /* 랭킹 API 준비되면 연결 */
  };

  const buttonState = (option) => {
    if (!result) return "idle";
    if (option.id === selectedId) return result.is_correct ? "correct" : "wrong";
    if (result.correct_option_id && option.id === result.correct_option_id)
      return "reveal";
    return "dim";
  };

  const loggedIn = !!getAccessToken();

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
              점수는 랭킹에 등록할 수 있어요.
            </p>
            {!loggedIn && (
              <p className="state-msg" style={{ fontSize: 13 }}>
                ※ 랭킹 등록은 로그인 후 가능해요.
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
                {loading ? "불러오는 중…" : "도전 시작 →"}
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

            <ContentCard content={current} theme={{ primaryColor: PRIMARY, accentColor: "#efeafd", decoration: "❓" }} />

            {isTextQuiz ? (
              <form className="text-answer" onSubmit={handleTextSubmit}>
                <input
                  ref={inputRef}
                  className="text-answer__input"
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="정답을 입력하세요"
                  disabled={!!textResult || submitting}
                  autoFocus
                  style={{ borderColor: PRIMARY }}
                />
                {!textResult && (
                  <button
                    type="submit"
                    className="primary-btn"
                    style={{ backgroundColor: PRIMARY }}
                    disabled={submitting || !textInput.trim()}
                  >
                    제출
                  </button>
                )}
              </form>
            ) : (
              <div className="answers">
                {current.options.map((opt) => (
                  <AnswerButton
                    key={opt.id}
                    option={opt}
                    state={buttonState(opt)}
                    disabled={answered || submitting}
                    primaryColor={PRIMARY}
                    onClick={handleAnswer}
                  />
                ))}
              </div>
            )}

            {textResult && (
              <p
                className={
                  "result-msg " +
                  (textResult.is_correct ? "result-msg--ok" : "result-msg--no")
                }
              >
                {textResult.message}
              </p>
            )}
            {result && (
              <p className="result-msg" style={{ color: PRIMARY }}>
                {result.message}
              </p>
            )}

            <div className="content-actions">
              {answered && !isLast && (
                <button
                  ref={nextBtnRef}
                  className="primary-btn"
                  style={{ backgroundColor: PRIMARY }}
                  onClick={handleNext}
                >
                  다음 문제 →
                </button>
              )}
              {answered && isLast && (
                <button
                  ref={nextBtnRef}
                  className="primary-btn"
                  style={{ backgroundColor: PRIMARY }}
                  onClick={handleShowResult}
                >
                  🎉 결과 보기
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
              {finalResult.level}
            </h1>
            <p className="progress" style={{ color: PRIMARY, fontSize: 20 }}>
              {stats.correct} / {stats.total} 정답 · {finalResult.score}점
            </p>
            <p className="state-msg">{finalResult.message}</p>

            {/* 랭킹 등록 — 4번 랭킹 API 준비 후 연결 (#21) */}
            <div className="content-actions">
              <button
                className="primary-btn"
                style={{ backgroundColor: PRIMARY, opacity: 0.5 }}
                onClick={handleSubmitRanking}
                disabled
                title="랭킹 기능 준비 중"
              >
                🏆 랭킹 등록 (준비 중)
              </button>
              <button
                className="primary-btn"
                style={{ backgroundColor: PRIMARY }}
                onClick={startChallenge}
              >
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
