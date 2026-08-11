import { useEffect, useState } from "react";
import { chatApi } from "../../api/chat.js";
import { getGenerationTheme } from "../../theme/generationTheme.js";

// 세대 선택 화면 — F3-1(세대 목록 API) + F3-5(#23 세대 선택 UI).
// 세대를 고르면 onSelect(generation)으로 알려준다. 채팅 API(F3-2)와의 연결은 다음 단계.
export default function GenerationSelect({ onSelect }) {
  const [generations, setGenerations] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    chatApi
      .getGenerations()
      .then((data) => {
        if (cancelled) return;
        setGenerations(data);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return <p className="state-msg">세대 목록을 불러오는 중이에요...</p>;
  }
  if (status === "error") {
    return <p className="state-msg state-msg--error">세대 목록을 불러오지 못했어요. 잠시 후 다시 시도해주세요.</p>;
  }
  if (generations.length === 0) {
    return <p className="state-msg">아직 등록된 세대가 없어요.</p>;
  }

  return (
    <div className="generation-select">
      <p className="generation-select__prompt">어느 시절의 모리를 만나볼래?</p>
      <div className="generation-grid">
        {generations.map((g) => {
          const theme = getGenerationTheme(g.id);
          const isSelected = selectedId === g.id;
          return (
            <button
              key={g.id}
              className={`generation-card${isSelected ? " generation-card--selected" : ""}`}
              style={{
                borderColor: theme.primaryColor,
                backgroundColor: isSelected ? theme.backgroundColor : undefined,
              }}
              onClick={() => {
                setSelectedId(g.id);
                onSelect?.(g);
              }}
            >
              <span
                className="generation-card__icon"
                style={{ backgroundColor: theme.accentColor }}
                aria-hidden="true"
              >
                {theme.icon}
              </span>
              <span className="generation-card__name">{g.display_name}</span>
            </button>
          );
        })}
      </div>
      {selectedId && (
        <p className="generation-select__hint">
          {getGenerationTheme(selectedId).icon} {generations.find((g) => g.id === selectedId)?.display_name}의 모리를
          곧 만나요 — 채팅은 다음 단계에서 연결할게요.
        </p>
      )}
    </div>
  );
}
