import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RetroWindow from "../../components/RetroWindow.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { feedbackApi } from "../../api/feedback.js";
import "./FeedbackPage.css";

const MAX_CONTENT_LENGTH = 500;

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

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const handleChange = (event) => {
    setContent(event.target.value);
    setError("");
    setSuccess("");
  };

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
              <ul className="feedback-list__items">
                {feedbacks.map((feedback) => (
                  <li key={feedback.id} className="feedback-list__item">
                    <div className="feedback-list__meta">
                      <span className="feedback-list__nickname" title={feedback.nickname}>{feedback.nickname}</span>
                      <time className="feedback-list__date">{formatCreatedAt(feedback.created_at)}</time>
                    </div>
                    <p className="feedback-list__content">{feedback.content}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </section>
      </RetroWindow>
    </div>
  );
}
