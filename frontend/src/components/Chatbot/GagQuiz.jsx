import { useEffect, useState } from "react";
import { chatApi } from "../../api/chat.js";

// 개그 퀴즈 — F3-4. 모리가 대사 앞부분(prompt)을 던지면 사용자가 뒷부분을 입력하고,
// 서버가 채점해서 정답을 공개한다. 챗봇 팝업 내부 모드로 동작하며, onBack으로 채팅으로 돌아간다.
export default function GagQuiz({ onBack }) {
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("loading"); // loading | ready | checking | revealed | error
  const [result, setResult] = useState(null); // { is_correct, correct_answer }

  useEffect(() => {
    let cancelled = false;
    chatApi
      .getGagItems()
      .then((data) => {
        if (cancelled) return;
        setItems(data);
        setStatus(data.length ? "ready" : "error");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const current = items[index];

  async function submit() {
    const answer = input.trim();
    if (!answer || !current) return;
    setStatus("checking");
    try {
      const res = await chatApi.answerGagItem(current.id, answer);
      setResult(res);
      setStatus("revealed");
    } catch (e) {
      setStatus("error");
    }
  }

  function next() {
    setInput("");
    setResult(null);
    if (index + 1 < items.length) {
      setIndex(index + 1);
      setStatus("ready");
    } else {
      setStatus("done");
    }
  }

  return (
    <div className="chat-window">
      <div className="chat-window__header">
        <button className="chat-window__back" onClick={onBack} aria-label="채팅으로 돌아가기">
          ‹
        </button>
        <span className="chat-window__title">🔤 개그 퀴즈</span>
      </div>

      <div className="gag-quiz">
        {status === "loading" && <p className="state-msg">문제를 불러오는 중이에요...</p>}
        {status === "error" && (
          <p className="state-msg state-msg--error">문제를 불러오지 못했어요. 잠시 후 다시 시도해주세요.</p>
        )}
        {status === "done" && <p className="state-msg">오늘 준비한 개그 퀴즈를 다 풀었어요! 🎉</p>}

        {current && status !== "done" && status !== "error" && (
          <>
            <p className="gag-quiz__progress">
              {index + 1} / {items.length}
            </p>
            <p className="gag-quiz__prompt">{current.prompt} ___</p>

            {status !== "revealed" ? (
              <div className="chat-window__input">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="뒷부분을 입력해보세요"
                  disabled={status === "checking"}
                />
                <button onClick={submit} disabled={status === "checking" || !input.trim()}>
                  정답 확인
                </button>
              </div>
            ) : (
              <div className="gag-quiz__result">
                <p className={result.is_correct ? "gag-quiz__verdict gag-quiz__verdict--correct" : "gag-quiz__verdict"}>
                  {result.is_correct ? "정답이에요! 🎉" : "아쉬워요!"}
                </p>
                <p className="gag-quiz__answer">정답: {result.correct_answer}</p>
                <button className="gag-quiz__next" onClick={next}>
                  다음 문제 →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
