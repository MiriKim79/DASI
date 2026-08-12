import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import HomePage from "./pages/Playground/HomePage.jsx";
import MemoryPlaygroundPage from "./pages/Playground/MemoryPlaygroundPage.jsx";
import MemoryContentPage from "./pages/Playground/MemoryContentPage.jsx";
import PlaceholderPage from "./pages/PlaceholderPage.jsx";
import AgeTestStartPage from "./pages/AgeTest/StartPage.jsx";
import AgeTestQuizPage from "./pages/AgeTest/QuizPage.jsx";
import AgeTestResultPage from "./pages/AgeTest/ResultPage.jsx";
import DockedMori from "./components/Chatbot/DockedMori.jsx";
import { ChatbotProvider } from "./components/Chatbot/ChatbotContext.jsx";
import SignupPage from "./pages/Auth/SignupPage.jsx";
import LoginPage from "./pages/Auth/LoginPage.jsx";
import { isAgeCheckSessionDone } from "./utils/ageCheckStatus.js";

// 전체 앱 라우팅. 공통 Layout(사이드바+상단바) 아래에 각 화면이 들어간다.
// 나이 맞히기 시작 화면(#1)은 #15 정책대로 Layout 밖(사이드바 없이) 단독으로 둔다.
// 추억 놀이터(홈/분야선택/콘텐츠)와 나이 맞히기 시작 화면만 구현됐고, 나머지는 타 팀원 자리표시.
// 챗봇 진입(#22)은 원형 FAB 대신, 홈 화면의 걸어다니는 모리를 클릭하면 우측 하단에
// 도킹되어 말풍선으로 대화가 시작되는 방식이다(DockedMori). Routes 밖에 두고 라우트와
// 무관하게 항상 마운트한다 — 노출 조건(#33)은 DockedMori 내부에서 스스로 판단한다.
//
// 첫 진입 라우팅 정책(팀 확정): 이번 방문 세션에서 나이맞히기를 아직 완료/패스하지
// 않았다면 "/"는 항상 "/age-check"로 보낸다. 로그인 여부와는 무관하다(세션 상태만 확인).
// "/age-check"는 완료 여부와 무관하게 언제든 직접 접근해 재테스트할 수 있다 — 별도
// 가드를 걸지 않는다.
function HomeGate() {
  return isAgeCheckSessionDone() ? <HomePage /> : <Navigate to="/age-check" replace />;
}

export default function App() {
  return (
    <ChatbotProvider>
      <Routes>
        <Route path="/age-check" element={<AgeTestStartPage />} />
        <Route path="/age-check/quiz" element={<AgeTestQuizPage />} />
        <Route path="/age-check/result" element={<AgeTestResultPage />} />

        <Route element={<Layout />}>
          <Route path="/" element={<HomeGate />} />
          <Route path="/playground" element={<MemoryPlaygroundPage />} />
          <Route path="/play/:code" element={<MemoryContentPage />} />

          {/* 타 팀원 담당 (라우트/사이드바 연결용 자리표시) */}
          <Route
            path="/ranking"
            element={<PlaceholderPage title="랭킹" note="랭킹 담당 팀원이 구현할 화면이에요. 🏆" />}
          />
          <Route
            path="/feedback"
            element={<PlaceholderPage title="피드백" note="피드백 담당 팀원이 구현할 화면이에요. ✉️" />}
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <DockedMori />
    </ChatbotProvider>
  );
}
