import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../../api/client.js";
import { getTheme, comedySubcategories } from "../../theme/categoryTheme.js";
import ContentCard from "../../components/ContentCard.jsx";
import AnswerButton from "../../components/AnswerButton.jsx";
import RetroWindow from "../../components/RetroWindow.jsx";

// 공통 콘텐츠 화면 (모든 분야가 이 컴포넌트 하나를 재사용)
export default function MemoryContentPage() {
  const { code } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const sub = searchParams.get("sub"); // 개그 하위분류

  const theme = getTheme(code);
  const isComedy = code === "COMEDY";
  const needSubChoice = isComedy && !sub;

  const [categories, setCategories] = useState([]);
  const [contents, setContents] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 답변 상태
  const [selectedId, setSelectedId] = useState(null);
  const [result, setResult] = useState(null); // AnswerOut
  const [submitting, setSubmitting] = useState(false);

  // 아재력 집계 (QUIZ만) + 결과 화면
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [finalResult, setFinalResult] = useState(null); // ResultOut

  const category = useMemo(
    () => categories.find((c) => c.code === code),
    [categories, code]
  );
  const categoryName = category ? category.name : code;

  // 카테고리명 표시용 목록 로드
  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  // 콘텐츠 로드 (하위분류가 필요한 개그는 sub 선택 후 로드)
  useEffect(() => {
    if (needSubChoice) {
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    setIndex(0);
    resetAnswer();
    setStats({ correct: 0, total: 0 });
    setFinalResult(null);
    api
      .getContents(code, sub || undefined)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, sub, needSubChoice]);

  function resetAnswer() {
    setSelectedId(null);
    setResult(null);
  }

  const current = contents[index];
  const isLast = index >= contents.length - 1;

  const handleAnswer = async (option) => {
    if (result || submitting) return;
    setSubmitting(true);
    setSelectedId(option.id);
    try {
      const res = await api.answer(current.id, option.id);
      setResult(res);
      // 정답이 있는 문제(QUIZ)만 아재력 집계
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

  const handleNext = () => {
    resetAnswer();
    setIndex((i) => i + 1);
  };

  const handleShowResult = async () => {
    try {
      const res = await api.getResult(stats.correct, stats.total, code);
      setFinalResult(res);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleRestart = () => {
    setIndex(0);
    resetAnswer();
    setStats({ correct: 0, total: 0 });
    setFinalResult(null);
  };

  const buttonState = (option) => {
    if (!result) return "idle";
    if (option.id === selectedId) return result.is_correct ? "correct" : "wrong";
    if (result.correct_option_id && option.id === result.correct_option_id)
      return "reveal";
    return "dim";
  };

  // ---------- 렌더 ----------
  const pageStyle = { backgroundColor: theme.backgroundColor };

  return (
    <div className="page content-page" style={pageStyle}>
      <RetroWindow titleColor={theme.primaryColor}>
        <nav className="breadcrumb">
          <button className="link-btn" onClick={() => navigate("/playground")}>
            추억 놀이터
          </button>
          <span className="breadcrumb__sep"> &gt; </span>
          <span style={{ color: theme.primaryColor, fontWeight: 700 }}>
            {theme.icon} {categoryName}
          </span>
          {sub && (
            <>
              <span className="breadcrumb__sep"> &gt; </span>
              <span>
                {comedySubcategories.find((s) => s.code === sub)?.name || sub}
              </span>
            </>
          )}
        </nav>

        {/* 개그 하위분류 선택 */}
        {needSubChoice && (
          <div className="sub-choice">
            <h2 className="content-heading" style={{ color: theme.primaryColor }}>
              어떤 개그가 땡겨?
            </h2>
            <div className="sub-grid">
              {comedySubcategories.map((s) => (
                <button
                  key={s.code}
                  className="sub-btn"
                  style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}
                  onClick={() => setSearchParams({ sub: s.code })}
                >
                  <span aria-hidden="true">{s.icon}</span> {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {!needSubChoice && (
          <>
            {loading && <p className="state-msg">불러오는 중… ⏳</p>}
            {error && <p className="state-msg state-msg--error">⚠️ {error}</p>}
            {!loading && !error && contents.length === 0 && (
              <p className="state-msg">아직 이 분야의 추억이 없어요. 🥲</p>
            )}

            {/* 아재력 결과 화면 */}
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
                <div className="content-actions">
                  <button
                    className="primary-btn"
                    style={{ backgroundColor: theme.primaryColor }}
                    onClick={handleRestart}
                  >
                    다시 도전 ↻
                  </button>
                  <button className="ghost-btn" onClick={() => navigate("/playground")}>
                    다른 분야로 돌아가기
                  </button>
                </div>
              </div>
            )}

            {/* 콘텐츠 진행 화면 */}
            {!loading && !error && current && !finalResult && (
              <div className="content-wrap">
                <p className="progress" style={{ color: theme.primaryColor }}>
                  {index + 1} / {contents.length}
                </p>

                <ContentCard content={current} theme={theme} />

                <div className="answers">
                  {current.options.map((opt) => (
                    <AnswerButton
                      key={opt.id}
                      option={opt}
                      state={buttonState(opt)}
                      disabled={!!result || submitting}
                      primaryColor={theme.primaryColor}
                      onClick={handleAnswer}
                    />
                  ))}
                </div>

                {result && (
                  <p className="result-msg" style={{ color: theme.primaryColor }}>
                    {result.message}
                  </p>
                )}

                <div className="content-actions">
                  {result && !isLast && (
                    <button
                      className="primary-btn"
                      style={{ backgroundColor: theme.primaryColor }}
                      onClick={handleNext}
                    >
                      다음 추억 →
                    </button>
                  )}
                  {result && isLast && (
                    <button
                      className="primary-btn"
                      style={{ backgroundColor: theme.primaryColor }}
                      onClick={handleShowResult}
                    >
                      🎉 아재력 결과 보기
                    </button>
                  )}
                  <button className="ghost-btn" onClick={() => navigate("/playground")}>
                    다른 분야로 돌아가기
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </RetroWindow>
    </div>
  );
}
