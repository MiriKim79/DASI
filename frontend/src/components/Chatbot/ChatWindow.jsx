import { useState } from "react";
import { chatApi } from "../../api/chat.js";
import CharacterAvatar from "./CharacterAvatar.jsx";

// 채팅 화면 — F3-2(채팅 API) + F3-3(대화 맥락) 중 비로그인 경로.
// history는 이 컴포넌트(React state)가 들고 있다가 매 호출마다 함께 보낸다.
// 로그인 사용자의 서버 저장(F3-3 로그인 분기)은 4번(F4-2 인증 의존성) 연동 이후 이어서 붙인다.
export default function ChatWindow({ generation, onBack, onOpenGagQuiz }) {
  const [history, setHistory] = useState([]); // [{ role, content }]
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | error

  async function send() {
    const text = input.trim();
    if (!text || status === "sending") return;

    const nextHistory = [...history, { role: "user", content: text }];
    setHistory(nextHistory);
    setInput("");
    setStatus("sending");

    try {
      const res = await chatApi.sendMessage({
        generation: generation.id,
        message: text,
        history, // 방금 보낸 사용자 메시지 이전까지의 히스토리
      });
      setHistory([...nextHistory, { role: "assistant", content: res.message }]);
      setStatus("idle");
    } catch (e) {
      setHistory(nextHistory);
      setStatus("error");
    }
  }

  return (
    <div className="chat-window">
      <div className="chat-window__header">
        <button className="chat-window__back" onClick={onBack} aria-label="세대 다시 선택">
          ‹
        </button>
        <CharacterAvatar generationId={generation.id} character={generation.character} size={28} />
        <span className="chat-window__title">{generation.display_name} 모리</span>
      </div>

      <button className="chat-window__gag-btn" onClick={onOpenGagQuiz}>
        🔤 개그 퀴즈 풀어보기
      </button>

      <div className="chat-window__messages">
        {history.length === 0 && (
          <p className="state-msg">{generation.display_name}의 모리에게 말을 걸어보세요!</p>
        )}
        {history.map((m, i) =>
          m.role === "assistant" ? (
            <div key={i} className="chat-row">
              <CharacterAvatar generationId={generation.id} character={generation.character} size={26} />
              <div className="chat-bubble chat-bubble--assistant">{m.content}</div>
            </div>
          ) : (
            <div key={i} className="chat-bubble chat-bubble--user">
              {m.content}
            </div>
          )
        )}
        {status === "sending" && (
          <div className="chat-row">
            <CharacterAvatar generationId={generation.id} character={generation.character} size={26} />
            <div className="chat-bubble chat-bubble--assistant chat-bubble--typing">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}
        {status === "error" && (
          <p className="state-msg state-msg--error">
            메시지를 보내지 못했어요. 잠시 후 다시 시도해주세요.
          </p>
        )}
      </div>

      <div className="chat-window__input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="메시지를 입력하세요"
          disabled={status === "sending"}
        />
        <button onClick={send} disabled={status === "sending" || !input.trim()}>
          보내기
        </button>
      </div>
    </div>
  );
}
