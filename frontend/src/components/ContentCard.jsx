// 콘텐츠 카드: 이미지 영역 + 제목 + 질문/설명
export default function ContentCard({ content, theme }) {
  return (
    <div className="content-card">
      <div
        className="content-card__image"
        style={{ backgroundColor: theme.accentColor }}
      >
        {content.image_url ? (
          <img src={content.image_url} alt={content.title} />
        ) : (
          <span className="content-card__placeholder" aria-hidden="true">
            {theme.decoration}
          </span>
        )}
      </div>
      <h2 className="content-card__title" style={{ color: theme.primaryColor }}>
        {content.title}
      </h2>
      <p className="content-card__question">{content.question}</p>
    </div>
  );
}
