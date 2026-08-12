import { NavLink, useNavigate } from "react-router-dom";
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
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="topnav">
      <div className="topnav__brand">
        <span className="topnav__logo">✨ 다시</span>
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
        <div>
          <span>{user.nickname}</span>
          <button className="login-btn" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      ) : (
        <button className="login-btn" onClick={() => navigate("/login")}>
          🔒 로그인
        </button>
      )}
    </header>
  );
}
