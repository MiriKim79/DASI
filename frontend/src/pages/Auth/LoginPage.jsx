import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import RetroWindow from "../../components/RetroWindow.jsx";
import {
  api,
  clearAccessToken,
  setAccessToken,
} from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import moriTitleImage from "./assets/mori-title.png";
import "./SignupPage.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateLogin({ email, password }) {
  const errors = {};

  if (!email.trim()) {
    errors.email = "이메일을 입력해 주세요.";
  } else if (!EMAIL_PATTERN.test(email.trim())) {
    errors.email = "올바른 이메일 형식을 입력해 주세요.";
  }

  if (!password) {
    errors.password = "비밀번호를 입력해 주세요.";
  }

  return errors;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuthenticatedUser } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setSubmitError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateLogin(form);
    setErrors(nextErrors);
    setSubmitError("");

    if (Object.keys(nextErrors).length > 0) return;

    let tokenStored = false;
    setIsSubmitting(true);
    try {
      const token = await api.login({
        email: form.email.trim(),
        password: form.password,
      });

      if (!token?.access_token || token.token_type !== "bearer") {
        throw new Error("로그인 응답을 확인하지 못했습니다.");
      }

      setAccessToken(token.access_token);
      tokenStored = true;

      const currentUser = await api.getMe();
      if (!currentUser) {
        throw new Error("현재 사용자 정보를 확인하지 못했습니다.");
      }

      setAuthenticatedUser(currentUser);
      navigate("/");
    } catch (error) {
      if (tokenStored) {
        clearAccessToken();
        setSubmitError("로그인 정보를 확인하지 못했습니다. 다시 시도해주세요.");
      } else {
        const message = error instanceof Error ? error.message : "";
        setSubmitError(
          message && message !== "요청에 실패했어요." && message !== "[object Object]"
            ? message
            : "로그인에 실패했어요. 잠시 후 다시 시도해주세요."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page page--centered signup-page">
      <div className="login-page__hero">
        <img className="login-page__mori" src={moriTitleImage} alt="" aria-hidden="true" />
        <RetroWindow titleColor="#9b7bd4">
        <section className="signup-page__content" aria-labelledby="login-title">
          <h1 id="login-title" className="window-heading">
            <span className="sparkle">✨</span>
            로그인
            <span className="sparkle">✨</span>
          </h1>
          <p className="signup-page__intro">추억을 다시 만나러 가볼까요?</p>

          <form className="signup-form" onSubmit={handleSubmit} noValidate>
            <div className="signup-form__field">
              <label htmlFor="login-email">이메일</label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "login-email-error" : undefined}
              />
              {errors.email && (
                <p id="login-email-error" className="signup-form__error">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="signup-form__field">
              <label htmlFor="login-password">비밀번호</label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "login-password-error" : undefined}
              />
              {errors.password && (
                <p id="login-password-error" className="signup-form__error">
                  {errors.password}
                </p>
              )}
            </div>

            {submitError && (
              <p className="signup-form__error signup-form__error--submit" role="alert">
                {submitError}
              </p>
            )}

            <button type="submit" className="signup-form__submit" disabled={isSubmitting}>
              {isSubmitting ? "로그인 중..." : "로그인"}
            </button>
          </form>

          <p className="signup-page__login-link">
            아직 계정이 없나요? <Link to="/signup">회원가입하기</Link>
          </p>
        </section>
        </RetroWindow>
      </div>
    </div>
  );
}
