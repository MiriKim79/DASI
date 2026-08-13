import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RetroWindow from "../../components/RetroWindow.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { feedbackApi } from "../../api/feedback.js";
import "./FeedbackPage.css";

const MAX_CONTENT_LENGTH = 500;
// 서버(POPULAR_LIKE_THRESHOLD / PINNED_LIMIT)와 같은 값 — 안내 문구 표시용
const POPULAR_THRESHOLD = 3;
const PINNED_LIMIT = 3;

function formatCreatedAt(createdAt) {
  const [date = "", time = ""] = createdAt.split("T");
  return `${date.replaceAll("-", ".")} ${time.slice(0, 5)}`.trim();
}

export default function FeedbackPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [feedbacks, setFeedbacks] = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(true);
  const [listError, setListError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [reactingId, setReactingId] = useState(null);

  const loadFeedbacks = async () => {
    setLoadingFeedbacks(true);
    setListError("");

    try {
      const items = await feedbackApi.getFeedbacks();
      setFeedbacks(items);
    } catch {
      setListError("피드백을 불러오지 못했습니다.");
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  // 로그인/로그아웃 시에도 다시 불러온다 — is_mine(삭제 버튼 노출)이 로그인 상태에 따라 달라진다.
  useEffect(() => {
    loadFeedbacks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleDelete = async (feedback) => {
    if (deletingId !== null) return;
    if (!window.confirm("이 피드백을 삭제할까요? 되돌릴 수 없어요.")) return;

    setDeletingId(feedback.id);
    setListError("");
    try {
      await feedbackApi.deleteFeedback(feedback.id);
      // 목록을 다시 불러와 서버 상태와 정확히 맞춘다.
      await loadFeedbacks();
    } catch (err) {
      setListError(err.message || "피드백 삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  // 좋아요/싫어요 — 글 하나당 한 사람이 하나만 남길 수 있고, 같은 걸 다시 누르면 취소된다.
  const handleReact = async (feedback, reaction) => {
    if (!isAuthenticated) {
      setListError("좋아요·싫어요를 누르려면 로그인이 필요합니다.");
      return;
    }
    if (reactingId !== null) return;

    setReactingId(feedback.id);
    setListError("");
    try {
      await feedbackApi.reactToFeedback(feedback.id, reaction);
      // 좋아요 수가 바뀌면 상위 3개(인기) 구성·순서가 달라질 수 있어(4위가 3위로 올라가는 등)
      // 서버가 계산한 정렬을 그대로 받도록 목록 전체를 다시 불러온다.
      await loadFeedbacks();
    } catch (err) {
      setListError(err.message || "반응 처리에 실패했습니다.");
    } finally {
      setReactingId(null);
    }
  };

  const handleChange = (event) => {
    setContent(event.target.value);
    setError("");
    setSuccess("");
  };

  // 서버가 이미 [상단 고정 인기글 → 나머지] 순으로 정렬해 내려준다.
  const pinnedFeedbacks = feedbacks.filter((f) => f.is_pinned);
  const restFeedbacks = feedbacks.filter((f) => !f.is_pinned);

  const renderFeedbackItem = (feedback) => (
    <li
      key={feedback.id}
      className={
        "feedback-list__item" +
        (feedback.is_pinned ? " feedback-list__item--popular" : "")
      }
    >
      <div className="feedback-list__meta">
        <span className="feedback-list__nickname" title={feedback.nickname}>
          {feedback.nickname}
        </span>
        {feedback.is_pinned && (
          <span className="feedback-list__badge">🔥 인기</span>
        )}
        <time className="feedback-list__date">
          {formatCreatedAt(feedback.created_at)}
        </time>
        {feedback.is_mine && (
          <button
            type="button"
            className="feedback-list__delete"
            onClick={() => handleDelete(feedback)}
            disabled={deletingId !== null}
            aria-label="내 피드백 삭제"
          >
            {deletingId === feedback.id ? "삭제 중..." : "삭제"}
          </button>
        )}
      </div>
      <p className="feedback-list__content">{feedback.content}</p>
      <div className="feedback-list__reactions">
        <button
          type="button"
          className={
            "feedback-react" +
            (feedback.my_reaction === "LIKE" ? " feedback-react--on" : "")
          }
          onClick={() => handleReact(feedback, "LIKE")}
          disabled={reactingId !== null}
          aria-pressed={feedback.my_reaction === "LIKE"}
          aria-label="좋아요"
        >
          👍 {feedback.like_count}
        </button>
        <button
          type="button"
          className={
            "feedback-react" +
            (feedback.my_reaction === "DISLIKE" ? " feedback-react--on" : "")
          }
          onClick={() => handleReact(feedback, "DISLIKE")}
          disabled={reactingId !== null}
          aria-pressed={feedback.my_reaction === "DISLIKE"}
          aria-label="싫어요"
        >
          👎 {feedback.dislike_count}
        </button>
      </div>
    </li>
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      setError("피드백 내용을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await feedbackApi.createFeedback(content);
      setContent("");
      setSuccess("피드백이 등록되었습니다.");
      await loadFeedbacks();
    } catch (err) {
      if (err.message === "인증 정보를 확인할 수 없습니다.") {
        setError("피드백을 작성하려면 로그인이 필요합니다.");
      } else if (err.message === "부적절한 표현이 포함되어 있습니다.") {
        setError(err.message);
      } else {
        setError("피드백 등록에 실패했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page feedback-page">
      <RetroWindow titleColor="#9b7bd4">
        <section className="feedback-page__content" aria-labelledby="feedback-title">
          <h1 id="feedback-title" className="window-heading">
            <span className="sparkle">✦</span>
            피드백
            <span className="sparkle">✦</span>
          </h1>
          <p className="feedback-page__intro">다시를 더 즐겁게 만들 의견을 들려주세요.</p>

          {isLoading && <p className="state-msg">로그인 상태를 확인하고 있어요...</p>}

          {!isLoading && !isAuthenticated && (
            <div className="feedback-page__login-required">
              <p className="state-msg">피드백을 작성하려면 로그인이 필요합니다.</p>
              <button className="feedback-page__login-btn" onClick={() => navigate("/login")}>
                로그인하기
              </button>
            </div>
          )}

          {!isLoading && isAuthenticated && (
            <form className="feedback-form" onSubmit={handleSubmit}>
              <label className="feedback-form__label" htmlFor="feedback-content">
                피드백 내용
              </label>
              <textarea
                id="feedback-content"
                className="feedback-form__textarea"
                value={content}
                onChange={handleChange}
                maxLength={MAX_CONTENT_LENGTH}
                disabled={submitting}
                placeholder="서비스를 이용하며 느낀 점을 남겨주세요."
              />
              <div className="feedback-form__meta">
                <span>{content.length} / {MAX_CONTENT_LENGTH}</span>
              </div>
              {error && <p className="feedback-form__message feedback-form__message--error">{error}</p>}
              {success && <p className="feedback-form__message feedback-form__message--success">{success}</p>}
              <button className="feedback-form__submit" type="submit" disabled={submitting}>
                {submitting ? "등록 중..." : "피드백 등록"}
              </button>
            </form>
          )}

          <section className="feedback-list" aria-labelledby="feedback-list-title">
            <h2 id="feedback-list-title" className="feedback-list__title">등록된 피드백</h2>
            {loadingFeedbacks && <p className="state-msg">피드백을 불러오는 중...</p>}
            {!loadingFeedbacks && listError && <p className="state-msg state-msg--error">{listError}</p>}
            {!loadingFeedbacks && !listError && feedbacks.length === 0 && (
              <p className="state-msg">아직 등록된 피드백이 없습니다.</p>
            )}
            {!loadingFeedbacks && !listError && feedbacks.length > 0 && (
              <>
                {pinnedFeedbacks.length > 0 && (
                  <>
                    <h3 className="feedback-list__section-title">
                      🔥 인기 피드백
                      <span className="feedback-list__section-note">
                        좋아요 {POPULAR_THRESHOLD}개 이상 · 최대 {PINNED_LIMIT}개
                      </span>
                    </h3>
                    <ul className="feedback-list__items">
                      {pinnedFeedbacks.map(renderFeedbackItem)}
                    </ul>
                  </>
                )}
                {restFeedbacks.length > 0 && (
                  <>
                    {pinnedFeedbacks.length > 0 && (
                      <h3 className="feedback-list__section-title">전체 피드백</h3>
                    )}
                    <ul className="feedback-list__items">
                      {restFeedbacks.map(renderFeedbackItem)}
                    </ul>
                  </>
                )}
              </>
            )}
          </section>
        </section>
      </RetroWindow>
    </div>
  );
}
