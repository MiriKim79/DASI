// 콘텐츠 카드: 사진(또는 음성 플레이어) 영역 + 제목 + 질문/설명

// 음악 분야는 mp3 등 음성 파일이라 <img> 대신 <audio> 로 보여줘야 한다.
const AUDIO_EXTS = [".mp3", ".m4a", ".ogg", ".wav"];

function isAudio(url) {
  if (!url) return false;
  const path = url.split("?")[0].toLowerCase();
  return AUDIO_EXTS.some((ext) => path.endsWith(ext));
}

export default function ContentCard({ content, theme }) {
  const audio = isAudio(content.image_url);

  return (
    <div className="content-card">
      <div
        className="content-card__image"
        style={{ backgroundColor: theme.accentColor }}
      >
        {content.image_url ? (
          audio ? (
            // 정답이 보이면 안 되므로 파일명은 노출하지 않는다.
            <div className="content-card__audio">
              <span className="content-card__audio-icon" aria-hidden="true">
                🎵
              </span>
              <audio src={content.image_url} controls preload="none" />
            </div>
          ) : (
            <img src={content.image_url} alt={content.title || "추억의 사진"} />
          )
        ) : (
          <span className="content-card__placeholder" aria-hidden="true">
            {theme.decoration}
          </span>
        )}
      </div>
      {content.title ? (
        <h2 className="content-card__title" style={{ color: theme.primaryColor }}>
          {content.title}
        </h2>
      ) : null}
      <p className="content-card__question">{content.question}</p>
    </div>
  );
}
