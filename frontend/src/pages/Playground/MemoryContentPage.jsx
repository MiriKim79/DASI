import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, getAccessToken } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { getTheme } from "../../theme/categoryTheme.js";
import ContentCard from "../../components/ContentCard.jsx";
import AnswerButton from "../../components/AnswerButton.jsx";
import RetroWindow from "../../components/RetroWindow.jsx";
import MemoryBackdrop from "../../components/MemoryBackdrop.jsx";

// 배열을 무작위로 섞는다(Fisher–Yates).
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 공통 콘텐츠 화면 (모든 분야가 이 컴포넌트 하나를 재사용)
export default function MemoryContentPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const theme = getTheme(code);
  const { refreshUser } = useAuth();

  const [categories, setCategories] = useState([]);
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 문제 수 선택 + 랜덤 출제
  const [quizCount, setQuizCount] = useState(null); // null이면 개수 선택 화면
  const [quiz, setQuiz] = useState([]); // 실제로 풀 문제(랜덤 N개)
  const [index, setIndex] = useState(0);

  // 답변 상태 (객관식)
  const [selectedId, setSelectedId] = useState(null);
  const [result, setResult] = useState(null); // AnswerOut

  // 답변 상태 (텍스트 입력형)
  const [textInput, setTextInput] = useState("");
  const [textResult, setTextResult] = useState(null); // TextAnswerOut
  const [submitting, setSubmitting] = useState(false);

  // 아재력 집계 + 결과 화면
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [finalResult, setFinalResult] = useState(null);

  // 플레이 입장료(50코인) 결제 상태
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(null);

  // 편의: 입력창/다음버튼 포커스 제어
  const inputRef = useRef(null);
  const nextBtnRef = useRef(null);

  const category = useMemo(
    () => categories.find((c) => c.code === code),
    [categories, code]
  );
  const categoryName = category ? category.name : code;

  // 카테고리명 표시용 목록 로드
  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  // 콘텐츠 로드
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    setQuizCount(null);
    setQuiz([]);
    setIndex(0);
    resetAnswer();
    setStats({ correct: 0, total: 0 });
    setFinalResult(null);
    api
      .getContents(code)
      .then((data) => {
        if (alive) setContents(data);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [code]);

  function resetAnswer() {
    setSelectedId(null);
    setResult(null);
    setTextInput("");
    setTextResult(null);
  }

  // 문제 수 선택 → 코인 50개 결제 후 랜덤 N개 뽑아 퀴즈 시작.
  // 결제(코인 차감)는 서버가 판단하므로, 실패하면 퀴즈를 시작하지 않는다.
  const startQuiz = async (count) => {
    if (paying) return;
    setPayError(null);

    if (!getAccessToken()) {
      setPayError("로그인 후 이용할 수 있어요. (플레이 1회 50코인)");
      return;
    }

    setPaying(true);
    try {
      await api.startCategoryPlay(code);
      refreshUser(); // 차감된 잔액을 상단바에 반영
    } catch (e) {
      setPayError(e.message);
      return;
    } finally {
      setPaying(false);
    }

    const n = Math.min(count, contents.length);
    setQuiz(shuffle(contents).slice(0, n));
    setQuizCount(n);
    setIndex(0);
    resetAnswer();
    setStats({ correct: 0, total: 0 });
    setFinalResult(null);
  };

  const current = quiz[index];
  const isLast = index >= quiz.length - 1;
  const isTextQuiz = current && current.content_type === "TEXT_QUIZ";
  const answered = !!result || !!textResult;

  // 새 텍스트 문제가 뜨면 입력창 자동 포커스 (마우스 클릭 불필요)
  useEffect(() => {
    if (current && isTextQuiz && !answered) {
      inputRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, isTextQuiz, answered]);

  // 답을 제출하면 '다음/결과' 버튼에 포커스 → Enter 한 번 더로 다음 문제
  useEffect(() => {
    if (answered) {
      nextBtnRef.current?.focus();
    }
  }, [answered]);

  // ----- 객관식 답변 -----
  const handleAnswer = async (option) => {
    if (answered || submitting) return;
    setSubmitting(true);
    setSelectedId(option.id);
    try {
      const res = await api.answer(current.id, option.id);
      setResult(res);
      if (current.content_type === "QUIZ") {
        setStats((s) => ({
          correct: s.correct + (res.is_correct ? 1 : 0),
          total: s.total + 1,
        }));
      }
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
      const res = await api.getResult(stats.correct, stats.total, code);
      setFinalResult(res);
      // 분야 최초 완료 보상(+5)이 지급됐으면 상단바 코인을 갱신한다.
      if (res.coin_reward > 0) refreshUser();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleRestart = () => {
    // 같은 개수로 다시 랜덤 출제
    setQuiz(shuffle(contents).slice(0, quizCount));
    setIndex(0);
    resetAnswer();
    setStats({ correct: 0, total: 0 });
    setFinalResult(null);
  };

  const handleChangeCount = () => {
    setQuizCount(null);
    setFinalResult(null);
  };

  const buttonState = (option) => {
    if (!result) return "idle";
    if (option.id === selectedId) return result.is_correct ? "correct" : "wrong";
    if (result.correct_option_id && option.id === result.correct_option_id)
      return "reveal";
    return "dim";
  };

  // 문제 수 선택지 계산 (10/20/30 중 가능한 것 + 전체)
  const countOptions = useMemo(() => {
    const available = contents.length;
    const presets = [10, 20, 30].filter((n) => n < available);
    return [...presets, available]; // 마지막은 '전체'
  }, [contents.length]);

  return (
    <div className="page content-page">
      {/* 분야 맞춤 소품 배경 */}
      <MemoryBackdrop items={theme.props} variant="category" />

      <RetroWindow titleColor={theme.primaryColor}>
        <nav className="breadcrumb">
          <button className="link-btn" onClick={() => navigate("/playground")}>
            추억 놀이터
          </button>
          <span className="breadcrumb__sep"> &gt; </span>
          <span style={{ color: theme.primaryColor, fontWeight: 700 }}>
            {theme.icon} {categoryName}
          </span>
        </nav>

        {loading && <p className="state-msg">불러오는 중… ⏳</p>}
        {error && <p className="state-msg state-msg--error">⚠️ {error}</p>}
        {!loading && !error && contents.length === 0 && (
          <p className="state-msg">아직 이 분야의 추억이 없어요. 🥲</p>
        )}

        {/* 문제 수 선택 화면 */}
        {!loading && !error && contents.length > 0 && quizCount === null && (
          <div className="count-choice">
            <h2 className="content-heading" style={{ color: theme.primaryColor }}>
              몇 문제 풀어볼까?
            </h2>
            <p className="count-choice__sub">
              전체 {contents.length}문제 중 랜덤으로 출제돼요 🎲
            </p>
            <p className="count-choice__cost">
              🪙 플레이 1회에 <b>50코인</b>이 필요해요
            </p>
            {payError && (
              <p className="state-msg state-msg--error">⚠️ {payError}</p>
            )}
            <div className="count-grid">
              {countOptions.map((n, i) => (
                <button
                  key={n}
                  className="count-btn"
                  style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}
                  onClick={() => startQuiz(n)}
                  disabled={paying}
                >
                  {paying
                    ? "결제 중…"
                    : i === countOptions.length - 1 && n !== 10 && n !== 20 && n !== 30
                    ? `전체 (${n}문제)`
                    : `${n}문제`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 결과 화면 */}
        {finalResult && (
          <div className="result-screen">
            <p className="result-screen__badge" style={{ color: theme.primaryColor }}>
              아재력 측정 결과
            </p>
            <div
              className="result-screen__score"
              style={{ backgroundColor: theme.accentColor }}
            >
              <span style={{ color: theme.primaryColor }}>{finalResult.score}</span>
              <small>점</small>
            </div>
            <h2 className="result-screen__level">{finalResult.level}</h2>
            <p className="result-screen__msg">{finalResult.message}</p>
            <p className="result-screen__detail">
              맞힌 문제 {finalResult.correct} / {finalResult.total}
            </p>
            {finalResult.coin_reward > 0 && (
              <p className="result-screen__coin">
                🪙 이 분야 첫 완료 보상 <b>+{finalResult.coin_reward}코인</b> 획득!
              </p>
            )}
            <div className="content-actions">
              <button
                className="primary-btn"
                style={{ backgroundColor: theme.primaryColor }}
                onClick={handleRestart}
              >
                다시 도전 ↻
              </button>
              <button className="ghost-btn" onClick={handleChangeCount}>
                문제 수 다시 고르기
              </button>
              <button className="ghost-btn" onClick={() => navigate("/playground")}>
                다른 분야로 돌아가기
              </button>
            </div>
          </div>
        )}

        {/* 콘텐츠 진행 화면 */}
        {!loading && !error && quizCount !== null && current && !finalResult && (
          <div className="content-wrap">
            <p className="progress" style={{ color: theme.primaryColor }}>
              {index + 1} / {quiz.length}
            </p>

            <ContentCard content={current} theme={theme} />

            {/* 텍스트 입력형 (사진/노래 보고 정답 작성) */}
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
                  style={{ borderColor: theme.primaryColor }}
                />
                {!textResult && (
                  <button
                    type="submit"
                    className="primary-btn"
                    style={{ backgroundColor: theme.primaryColor }}
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
                    primaryColor={theme.primaryColor}
                    onClick={handleAnswer}
                  />
                ))}
              </div>
            )}

            {/* 정답/오답 피드백 */}
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
              <p className="result-msg" style={{ color: theme.primaryColor }}>
                {result.message}
              </p>
            )}

            <div className="content-actions">
              {answered && !isLast && (
                <button
                  ref={nextBtnRef}
                  className="primary-btn"
                  style={{ backgroundColor: theme.primaryColor }}
                  onClick={handleNext}
                >
                  다음 추억 →
                </button>
              )}
              {answered && isLast && (
                <button
                  ref={nextBtnRef}
                  className="primary-btn"
                  style={{ backgroundColor: theme.primaryColor }}
                  onClick={handleShowResult}
                >
                  🎉 결과 보기
                </button>
              )}
              <button className="ghost-btn" onClick={() => navigate("/playground")}>
                다른 분야로 돌아가기
              </button>
            </div>
          </div>
        )}
      </RetroWindow>
    </div>
  );
}
