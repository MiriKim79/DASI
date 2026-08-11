// 분야별 테마 데이터.
// 공통 레이아웃 + 이 테마 데이터로 색상/아이콘/소품만 교체한다.
// 새 분야가 추가되면 여기에 항목만 추가하면 된다.
//   - props: 배경에 흩뿌릴 분야 맞춤 소품 이모지(반복 사용됨)
//   - gradient: 배경 그라데이션 [시작색, 끝색] (분야 분위기 연출)
export const categoryTheme = {
  GAME: {
    primaryColor: "#3AA76D",
    backgroundColor: "#E9F7EF",
    accentColor: "#C4EBD3",
    gradient: ["#E9F7EF", "#D5F0E0"],
    icon: "🎮",
    decoration: "🕹️",
    props: ["🎮", "🕹️", "👾", "🏆", "⭐", "💾", "🎯", "🐉", "🔥"],
  },
  DRAMA: {
    primaryColor: "#8E3B46",
    backgroundColor: "#F7ECEE",
    accentColor: "#E7C3CA",
    gradient: ["#F7ECEE", "#F0DCE0"],
    icon: "📺",
    decoration: "🎬",
    props: ["📺", "🎬", "💔", "🌹", "🎞️", "📻", "💐", "🕰️", "😢"],
  },
  MOVIE: {
    primaryColor: "#3B2E66",
    backgroundColor: "#EEEBF7",
    accentColor: "#C9BFE8",
    gradient: ["#EEEBF7", "#E2DCF3"],
    icon: "🎞️",
    decoration: "🍿",
    props: ["🎬", "🍿", "🎞️", "🎟️", "📽️", "⭐", "🎥", "🕶️", "🌟"],
  },
  ANIME_COMIC: {
    primaryColor: "#2E8BC0",
    backgroundColor: "#E9F5FC",
    accentColor: "#BFE3F5",
    gradient: ["#E9F5FC", "#D6EDFA"],
    icon: "📚",
    decoration: "💥",
    props: ["📚", "💥", "⚡", "🦸", "👾", "✨", "💫", "📖", "🌀"],
  },
  STATIONERY_PLAY: {
    primaryColor: "#1F9E82",
    backgroundColor: "#E6F7F2",
    accentColor: "#BEEBDE",
    gradient: ["#E6F7F2", "#D2F0E7"],
    icon: "🪀",
    decoration: "✏️",
    props: ["🪀", "✏️", "🖍️", "🎨", "🪁", "🎲", "🔴", "🧮", "📏"],
  },
  MEME: {
    primaryColor: "#6C5CE7",
    backgroundColor: "#EFEDFB",
    accentColor: "#CFC8F5",
    gradient: ["#EFEDFB", "#E3DFF8"],
    icon: "💬",
    decoration: "🔥",
    props: ["💬", "🔥", "😎", "💯", "🗯️", "👍", "⌨️", "📱", "✌️"],
  },
  FOOD: {
    primaryColor: "#E75A97",
    backgroundColor: "#FDEBF3",
    accentColor: "#F8C6DD",
    gradient: ["#FDEBF3", "#FBDAE9"],
    icon: "🍪",
    decoration: "🍭",
    props: ["🍪", "🍭", "🍬", "🍫", "🍩", "🍡", "🥤", "🍦", "🧁"],
  },
  MUSIC: {
    primaryColor: "#4A6CF7",
    backgroundColor: "#EBEFFD",
    accentColor: "#C4D0FA",
    gradient: ["#EBEFFD", "#DCE3FC"],
    icon: "💿",
    decoration: "📼",
    props: ["📼", "💿", "🎧", "🎵", "📻", "🎤", "🎸", "📀", "🎶"],
  },
};

// 기본 테마 (알 수 없는 분야일 때)
export const defaultTheme = {
  primaryColor: "#8A7BD8",
  backgroundColor: "#FBF7EF",
  accentColor: "#D8CFF0",
  gradient: ["#FBF7EF", "#F1EAFB"],
  icon: "🕹️",
  decoration: "✨",
  props: ["📼", "🕹️", "🎈", "💿", "🍬", "📟", "👾", "✏️", "🎧"],
};

export function getTheme(code) {
  return categoryTheme[code] || defaultTheme;
}
