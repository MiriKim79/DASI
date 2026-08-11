import { useState } from "react";
import { getGenerationTheme } from "../../theme/generationTheme.js";

// 세대별 캐릭터 아바타 — #29.
// /characters/{character}.png 이미지가 있으면 그걸 쓰고, 없으면(404) 세대 테마 아이콘으로
// 자리표시(placeholder)한다. 실제 캐릭터 일러스트가 생기면 해당 경로에 파일만 추가하면 된다.
export default function CharacterAvatar({ generationId, character, size = 36 }) {
  const [imageFailed, setImageFailed] = useState(false);
  const theme = getGenerationTheme(generationId);

  if (!imageFailed) {
    return (
      <img
        className="character-avatar"
        src={`/characters/${character}.png`}
        alt=""
        width={size}
        height={size}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <span
      className="character-avatar character-avatar--placeholder"
      style={{ width: size, height: size, backgroundColor: theme.accentColor }}
      aria-hidden="true"
    >
      {theme.icon}
    </span>
  );
}
