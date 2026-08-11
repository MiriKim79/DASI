// 세대별 테마 데이터 (챗봇 세대 선택 화면용).
// categoryTheme.js와 같은 패턴 — 세대가 늘어나면 여기에 항목만 추가하면 된다.
export const generationTheme = {
  "1990s": {
    primaryColor: "#C97B3D",
    backgroundColor: "#FBEFE2",
    accentColor: "#F3D9BC",
    icon: "📼",
  },
  "2000s": {
    primaryColor: "#4A6CF7",
    backgroundColor: "#EBEFFD",
    accentColor: "#C4D0FA",
    icon: "💾",
  },
  "2010s": {
    primaryColor: "#1F9E82",
    backgroundColor: "#E6F7F2",
    accentColor: "#BEEBDE",
    icon: "📱",
  },
  "2020s": {
    primaryColor: "#8A5FE0",
    backgroundColor: "#F1ECFB",
    accentColor: "#D9CBF5",
    icon: "✨",
  },
};

// 기본 테마 (알 수 없는 세대일 때)
export const defaultGenerationTheme = {
  primaryColor: "#8A7BD8",
  backgroundColor: "#FBF7EF",
  accentColor: "#D8CFF0",
  icon: "🕹️",
};

export function getGenerationTheme(id) {
  return generationTheme[id] || defaultGenerationTheme;
}
