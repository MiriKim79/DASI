import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

// 공통 상단 네비게이션 바 (브랜드 + 메뉴 + 로그인).
// 추억 놀이터만 우리 담당이 구현했고, 나머지는 타 팀원이 붙일 자리(placeholder 라우트).
const MENUS = [
  { to: "/", label: "홈", icon: "🏠", end: true },
  { to: "/age-check", label: "나이 맞히기", icon: "❓" },
  { to: "/playground", label: "추억 놀이터", icon: "🎮" },
  { to: "/ranking", label: "랭킹", icon: "🏆" },
  { to: "/feedback", label: "피드백", icon: "✉️" },
];

export default function TopNav() {
  const navigate = useNavigate();
  const { user, logout, refreshUser, setAuthenticatedUser } = useAuth();
  const [charging, setCharging] = useState(false);
  const [chargeError, setChargeError] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // 데모용 가상 충전 — 실제 결제 연동 없이 코인 +100.
  const handleCharge = async () => {
    if (charging) return;
    setCharging(true);
    setChargeError("");
    try {
      const res = await api.chargeCoins();
      // 서버가 돌려준 잔액을 즉시 반영한다(그 뒤 refreshUser로 최종 동기화).
      if (res && typeof res.coin_balance === "number") {
        setAuthenticatedUser((prev) =>
          prev ? { ...prev, coin_balance: res.coin_balance } : prev
        );
      }
      await refreshUser();
    } catch (e) {
      // 실패를 조용히 삼키지 않는다(예: 백엔드가 옛 코드라 엔드포인트가 없을 때).
      setChargeError(e.message || "충전에 실패했어요.");
    } finally {
      setCharging(false);
    }
  };

  return (
    <header className="topnav">
      <div className="topnav__brand">
        <span className="topnav__logo">다시</span>
      </div>
      <nav className="topnav__nav">
        {MENUS.map((m) => (
          <NavLink
            key={m.to}
            to={m.to}
            end={m.end}
            className={({ isActive }) =>
              "topnav__link" + (isActive ? " topnav__link--active" : "")
            }
          >
            <span className="topnav__icon" aria-hidden="true">
              {m.icon}
            </span>
            <span className="topnav__label">{m.label}</span>
          </NavLink>
        ))}
      </nav>
      {user ? (
        <div className="topnav__user">
          <span className="topnav__coin" title="보유 코인">
            🪙 {user.coin_balance}
          </span>
          <button
            className="topnav__charge"
            onClick={handleCharge}
            disabled={charging}
            title={chargeError || "가상 충전 (+100)"}
          >
            {charging ? "충전 중…" : "충전"}
          </button>
          {chargeError && (
            <span className="topnav__charge-error" title={chargeError}>
              ⚠️ 충전 실패
            </span>
          )}
          <span className="topnav__nickname">{user.nickname}</span>
          <button className="login-btn" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      ) : (
        <div className="topnav__guest">
          <span className="topnav__signup-hint">
            회원가입하면 <b>100코인</b>을 드립니다
          </span>
          <button className="login-btn" onClick={() => navigate("/login")}>
            🔒 로그인
          </button>
        </div>
      )}
    </header>
  );
}
