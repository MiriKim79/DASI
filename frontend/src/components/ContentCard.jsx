// 콘텐츠 카드: 사진 / 음성 / 유튜브(노래 듣기) 영역 + 제목 + 질문/설명
import { useEffect, useRef, useState } from "react";

// 음악 분야는 mp3 등 음성 파일이라 <img> 대신 <audio> 로 보여줘야 한다.
const AUDIO_EXTS = [".mp3", ".m4a", ".ogg", ".wav"];

function isAudio(url) {
  if (!url) return false;
  const path = url.split("?")[0].toLowerCase();
  return AUDIO_EXTS.some((ext) => path.endsWith(ext));
}

// image_url 이 "youtube:<영상ID>" 또는 "youtube:<영상ID>:<시작초>" 형식이면
// { id, start } 를 돌려준다(아니면 null). 시작초는 하이라이트(후렴) 지점 재생용.
function parseYouTube(url) {
  if (!url || !url.startsWith("youtube:")) return null;
  const [id, startStr] = url.slice("youtube:".length).split(":");
  const start = startStr ? parseInt(startStr, 10) : 0;
  return { id, start: Number.isFinite(start) && start > 0 ? start : 0 };
}

// 유튜브 IFrame Player API 스크립트를 (한 번만) 로드하고 준비되면 알려준다.
function loadYouTubeApi(onReady) {
  if (window.YT && window.YT.Player) {
    onReady();
    return;
  }
  if (!document.getElementById("yt-iframe-api")) {
    const tag = document.createElement("script");
    tag.id = "yt-iframe-api";
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
  }
  const prev = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    if (typeof prev === "function") prev();
    onReady();
  };
}

// 노래 듣고 맞히기: 유튜브 영상을 화면엔 완전히 감추고 소리만 재생.
// 영상(제목·썸네일=정답)이 절대 보이지 않도록 불투명 버튼으로 완전히 덮는다.
// 재생/정지는 IFrame Player API로 직접 제어 → 버튼 한 번 클릭으로 동작.
function YouTubeAudio({ videoId, start = 0 }) {
  const holderRef = useRef(null);
  const playerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setPlaying(false);

    loadYouTubeApi(() => {
      if (cancelled || !holderRef.current) return;
      playerRef.current = new window.YT.Player(holderRef.current, {
        videoId,
        // start: 하이라이트(후렴) 지점부터 재생
        playerVars: { controls: 0, disablekb: 1, modestbranding: 1, rel: 0, playsinline: 1, start },
        events: {
          onReady: () => {
            if (!cancelled) setReady(true);
          },
          onStateChange: (e) => {
            const YT = window.YT;
            if (e.data === YT.PlayerState.PLAYING) setPlaying(true);
            else if (
              e.data === YT.PlayerState.PAUSED ||
              e.data === YT.PlayerState.ENDED
            )
              setPlaying(false);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId, start]);

  const toggle = () => {
    const p = playerRef.current;
    if (!p || !ready) return;
    if (playing) p.pauseVideo();
    else p.playVideo();
  };

  return (
    <div className="content-card__yt">
      {/* 실제 유튜브 플레이어 — 아래 버튼(불투명)이 완전히 덮어 화면엔 안 보인다 */}
      <div className="content-card__yt-holder" aria-hidden="true">
        <div ref={holderRef} />
      </div>
      <button
        type="button"
        className="content-card__yt-btn"
        onClick={toggle}
        disabled={!ready}
      >
        <span className="content-card__yt-icon" aria-hidden="true">
          {playing ? "⏸" : ready ? "▶" : "⏳"}
        </span>
        <span className="content-card__yt-hint">
          {playing
            ? "재생 중… (다시 누르면 정지)"
            : ready
            ? "노래 듣기"
            : "불러오는 중…"}
        </span>
      </button>
    </div>
  );
}

export default function ContentCard({ content, theme }) {
  const audio = isAudio(content.image_url);
  const yt = parseYouTube(content.image_url);

  return (
    <div className="content-card">
      <div
        className="content-card__image"
        style={{ backgroundColor: theme.accentColor }}
      >
        {content.image_url ? (
          yt ? (
            <YouTubeAudio videoId={yt.id} start={yt.start} />
          ) : audio ? (
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
