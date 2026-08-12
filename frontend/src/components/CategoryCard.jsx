import { getTheme } from "../theme/categoryTheme.js";

// 분야 선택 버튼 (아이콘 칩 + 라벨 + 입장료의 가로 알약형)
// 플레이 1회당 코인 50개가 필요하므로 카드에 가격을 함께 보여준다.
export default function CategoryCard({ category, onClick, cost = 50 }) {
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
      <span className="category-card__cost" title={`플레이 1회 ${cost}코인`}>
        🪙 {cost}
      </span>
    </button>
  );
}
