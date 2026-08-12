import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import RetroWindow from "../../components/RetroWindow.jsx";
import { api } from "../../api/client.js";
import "./SignupPage.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateSignup({ email, password, nickname }) {
  const errors = {};

  if (!email.trim()) {
    errors.email = "이메일을 입력해 주세요.";
  } else if (!EMAIL_PATTERN.test(email.trim())) {
    errors.email = "올바른 이메일 형식을 입력해 주세요.";
  }

  if (!password) {
    errors.password = "비밀번호를 입력해 주세요.";
  } else if (password.length < 8) {
    errors.password = "비밀번호는 최소 8자 이상이어야 합니다.";
  }

  if (!nickname.trim()) {
    errors.nickname = "닉네임을 입력해 주세요.";
  } else if (nickname.trim().length > 50) {
    errors.nickname = "닉네임은 최대 50자까지 입력할 수 있습니다.";
  }

  return errors;
}

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", nickname: "" });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setSubmitError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateSignup(form);
    setErrors(nextErrors);
    setSubmitError("");

    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await api.signup({
        email: form.email.trim(),
        password: form.password,
        nickname: form.nickname.trim(),
      });
      setIsSuccess(true);
      window.setTimeout(() => navigate("/login"), 900);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message && message !== "요청에 실패했어요." && message !== "[object Object]") {
        setSubmitError(message);
      } else if (message === "[object Object]") {
        setSubmitError("입력 내용을 다시 확인해 주세요.");
      } else {
        setSubmitError("회원가입에 실패했어요. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page page--centered signup-page">
      <RetroWindow titleColor="#9b7bd4">
        <section className="signup-page__content" aria-labelledby="signup-title">
          <h1 id="signup-title" className="window-heading">
            <span className="sparkle">✨</span>
            회원가입
            <span className="sparkle">✨</span>
          </h1>
          <p className="signup-page__intro">추억을 다시 꺼내볼 준비가 되었나요?</p>

          {isSuccess ? (
            <p className="signup-page__success" role="status">
              회원가입이 완료됐어요. 로그인 화면으로 이동합니다.
            </p>
          ) : (
            <form className="signup-form" onSubmit={handleSubmit} noValidate>
              <div className="signup-form__field">
                <label htmlFor="signup-email">이메일</label>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "signup-email-error" : undefined}
                />
                {errors.email && (
                  <p id="signup-email-error" className="signup-form__error">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="signup-form__field">
                <label htmlFor="signup-password">비밀번호</label>
                <input
                  id="signup-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "signup-password-error" : undefined}
                />
                {errors.password && (
                  <p id="signup-password-error" className="signup-form__error">
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="signup-form__field">
                <label htmlFor="signup-nickname">닉네임</label>
                <input
                  id="signup-nickname"
                  name="nickname"
                  type="text"
                  autoComplete="nickname"
                  value={form.nickname}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.nickname)}
                  aria-describedby={errors.nickname ? "signup-nickname-error" : undefined}
                />
                {errors.nickname && (
                  <p id="signup-nickname-error" className="signup-form__error">
                    {errors.nickname}
                  </p>
                )}
              </div>

              {submitError && (
                <p className="signup-form__error signup-form__error--submit" role="alert">
                  {submitError}
                </p>
              )}

              <button type="submit" className="signup-form__submit" disabled={isSubmitting}>
                {isSubmitting ? "회원가입 중..." : "회원가입"}
              </button>
            </form>
          )}

          <p className="signup-page__login-link">
            이미 계정이 있나요? <Link to="/login">로그인하기</Link>
          </p>
        </section>
      </RetroWindow>
    </div>
  );
}
