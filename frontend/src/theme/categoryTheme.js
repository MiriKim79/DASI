// 분야별 테마 데이터.
// 공통 레이아웃 + 이 테마 데이터로 색상/아이콘/소품만 교체한다.
// 새 분야가 추가되면 여기에 항목만 추가하면 된다.
export const categoryTheme = {
  COMEDY: {
    primaryColor: "#F6A623",
    backgroundColor: "#FFF7E6",
    accentColor: "#FFE0A3",
    icon: "🎤",
    decoration: "😆",
  },
  DRAMA: {
    primaryColor: "#8E3B46",
    backgroundColor: "#F7ECEE",
    accentColor: "#E7C3CA",
    icon: "📺",
    decoration: "🎬",
  },
  MOVIE: {
    primaryColor: "#3B2E66",
    backgroundColor: "#EEEBF7",
    accentColor: "#C9BFE8",
    icon: "🎞️",
    decoration: "🍿",
  },
  ANIME_COMIC: {
    primaryColor: "#2E8BC0",
    backgroundColor: "#E9F5FC",
    accentColor: "#BFE3F5",
    icon: "📚",
    decoration: "💥",
  },
  STATIONERY_PLAY: {
    primaryColor: "#1F9E82",
    backgroundColor: "#E6F7F2",
    accentColor: "#BEEBDE",
    icon: "🪀",
    decoration: "✏️",
  },
  MEME: {
    primaryColor: "#6C5CE7",
    backgroundColor: "#EFEDFB",
    accentColor: "#CFC8F5",
    icon: "💬",
    decoration: "🔥",
  },
  FOOD: {
    primaryColor: "#E75A97",
    backgroundColor: "#FDEBF3",
    accentColor: "#F8C6DD",
    icon: "🍪",
    decoration: "🍭",
  },
  MUSIC: {
    primaryColor: "#4A6CF7",
    backgroundColor: "#EBEFFD",
    accentColor: "#C4D0FA",
    icon: "💿",
    decoration: "📼",
  },
};

// 기본 테마 (알 수 없는 분야일 때)
export const defaultTheme = {
  primaryColor: "#8A7BD8",
  backgroundColor: "#FBF7EF",
  accentColor: "#D8CFF0",
  icon: "🕹️",
  decoration: "✨",
};

export function getTheme(code) {
  return categoryTheme[code] || defaultTheme;
}

// 개그 하위분류 메타데이터
export const comedySubcategories = [
  { code: "DAD", name: "아재개그", icon: "🧓" },
  { code: "HUMANITIES", name: "문과 개그", icon: "📖" },
  { code: "SCIENCE", name: "이과 개그", icon: "🧪" },
  { code: "GENERATION", name: "세대 개그", icon: "🕰️" },
];
