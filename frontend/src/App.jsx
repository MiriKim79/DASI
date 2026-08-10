import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import HomePage from "./pages/Playground/HomePage.jsx";
import MemoryPlaygroundPage from "./pages/Playground/MemoryPlaygroundPage.jsx";
import MemoryContentPage from "./pages/Playground/MemoryContentPage.jsx";
import PlaceholderPage from "./pages/PlaceholderPage.jsx";

// 전체 앱 라우팅. 공통 Layout(사이드바+상단바) 아래에 각 화면이 들어간다.
// 추억 놀이터(홈/분야선택/콘텐츠)만 우리 담당 구현이고, 나머지는 타 팀원 자리표시.
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/playground" element={<MemoryPlaygroundPage />} />
        <Route path="/play/:code" element={<MemoryContentPage />} />

        {/* 타 팀원 담당 (라우트/사이드바 연결용 자리표시) */}
        <Route
          path="/age-check"
          element={<PlaceholderPage title="나이 맞히기" note="나이 맞히기 알고리즘 담당 팀원이 구현할 화면이에요. ❓" />}
        />
        <Route
          path="/ranking"
          element={<PlaceholderPage title="랭킹" note="랭킹 담당 팀원이 구현할 화면이에요. 🏆" />}
        />
        <Route
          path="/feedback"
          element={<PlaceholderPage title="피드백" note="피드백 담당 팀원이 구현할 화면이에요. ✉️" />}
        />
        <Route
          path="/login"
          element={<PlaceholderPage title="로그인" note="회원/로그인 담당 팀원이 구현할 화면이에요. 🔒" />}
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
