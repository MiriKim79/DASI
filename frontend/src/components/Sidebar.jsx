import { NavLink } from "react-router-dom";

// 공통 사이드바 메뉴.
// 추억 놀이터만 우리 담당이 구현했고, 나머지는 타 팀원이 붙일 자리(placeholder 라우트).
const MENUS = [
  { to: "/", label: "홈", icon: "🏠", end: true },
  { to: "/age-check", label: "나이 맞히기", icon: "❓" },
  { to: "/playground", label: "추억 놀이터", icon: "🎮" },
  { to: "/ranking", label: "랭킹", icon: "🏆" },
  { to: "/feedback", label: "피드백", icon: "✉️" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__logo">✨ 다시</span>
      </div>
      <nav className="sidebar__nav">
        {MENUS.map((m) => (
          <NavLink
            key={m.to}
            to={m.to}
            end={m.end}
            className={({ isActive }) =>
              "sidebar__link" + (isActive ? " sidebar__link--active" : "")
            }
          >
            <span className="sidebar__icon" aria-hidden="true">
              {m.icon}
            </span>
            {m.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
