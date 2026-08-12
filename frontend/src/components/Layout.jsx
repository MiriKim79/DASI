import { Outlet, useLocation } from "react-router-dom";
import TopNav from "./TopNav.jsx";
import MemoryBackdrop from "./MemoryBackdrop.jsx";
import MoriWanderer from "./MoriWanderer.jsx";
import { getTheme } from "../theme/categoryTheme.js";

// 공통 레이아웃: 상단 네비게이션 바 + 본문.
// 각 페이지는 <Outlet /> 자리에 렌더된다.
export default function Layout() {
  const location = useLocation();
  // 아래 화면들은 상단바까지 포함한 전체 영역에 배경 이미지를 깐다.
  // (분야 콘텐츠 /play/:code 는 자체 테마 배경이 있어 제외)
  const bgRoutes = ["/", "/age-check", "/playground", "/ranking", "/feedback"];
  const hasBg = bgRoutes.includes(location.pathname);

  // 마스코트 모리가 돌아다니는 화면: 홈 · 추억놀이터 · 랭킹 · 피드백
  const moriRoutes = ["/", "/playground", "/ranking", "/feedback"];
  const showMori = moriRoutes.includes(location.pathname);

  // 분야 콘텐츠 화면(/play/:code)은 상단바까지 분야 테마 배경으로 채운다.
  const playMatch = location.pathname.match(/^\/play\/([^/]+)/);
  const catTheme = playMatch ? getTheme(playMatch[1]) : null;
  const mainStyle = catTheme
    ? {
        backgroundColor: catTheme.backgroundColor,
        backgroundImage: catTheme.gradient
          ? `linear-gradient(160deg, ${catTheme.gradient[0]}, ${catTheme.gradient[1]})`
          : undefined,
      }
    : undefined;

  return (
    <div className="layout">
      <TopNav />
      <div
        className={`layout__main${hasBg ? " layout__main--bg" : ""}${
          catTheme ? " layout__main--category" : ""
        }`}
        style={mainStyle}
      >
        <main className="layout__content">
          <MemoryBackdrop />
          {showMori && <MoriWanderer />}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
