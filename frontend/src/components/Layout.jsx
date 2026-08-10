import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import MemoryBackdrop from "./MemoryBackdrop.jsx";

// 공통 레이아웃: 사이드바 + 상단바(로그인) + 본문.
// 각 페이지는 <Outlet /> 자리에 렌더된다.
export default function Layout() {
  const navigate = useNavigate();
  return (
    <div className="layout">
      <Sidebar />
      <div className="layout__main">
        <header className="topbar">
          <button className="login-btn" onClick={() => navigate("/login")}>
            🔒 로그인
          </button>
        </header>
        <main className="layout__content">
          <MemoryBackdrop />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
