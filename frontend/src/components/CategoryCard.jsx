import { getTheme } from "../theme/categoryTheme.js";

// 분야 선택 버튼 (아이콘 칩 + 라벨의 가로 알약형)
export default function CategoryCard({ category, onClick }) {
  const theme = getTheme(category.code);
  return (
    <button
      className="category-card"
      onClick={() => onClick(category)}
      style={{ borderColor: theme.primaryColor }}
    >
      <span
        className="category-card__icon"
        style={{ backgroundColor: theme.accentColor }}
        aria-hidden="true"
      >
        {theme.icon}
      </span>
      <span className="category-card__name">{category.name}</span>
    </button>
  );
}
