import { useEffect, useRef, useState } from "react";
import { chatApi } from "../../api/chat.js";
import CharacterAvatar from "./CharacterAvatar.jsx";

// 채팅 화면 — F3-2(채팅 API) + F3-3(대화 맥락) 중 비로그인 경로 + F3-4(개그 퀴즈, 대화형).
// history는 이 컴포넌트(React state)가 들고 있다가 매 호출마다 함께 보낸다.
// 로그인 사용자의 서버 저장(F3-3 로그인 분기)은 4번(F4-2 인증 의존성) 연동 이후 이어서 붙인다.
//
// 개그 퀴즈는 별도 화면이 아니라 이 채팅창 안에서 진행된다(요청사항). 퀴즈 중에는
// OpenAI를 호출하지 않고, 로컬 상태 기계 + 미리 정한 반응 문장 풀로만 응답한다 —
// 기존 페르소나 채팅(OpenAI 호출) 경로는 전혀 건드리지 않는다.

// 퀴즈 반응 문장도 세대 말투가 살짝 묻어나게 세대별 풀을 따로 두고, default는 기존 문구 그대로 둔다.
const CORRECT_REACTIONS = {
  default: ["오, 맞혔는데? 👀", "정답! 이걸 바로 맞히네?", "오~ 감 좀 있는데?", "맞아! 생각보다 잘하는데?"],
  "1990s": ["오, 맞혔네! 그치?", "정답이야, 제법인데?", "오~ 바로 맞히네."],
  "2000s": ["오, 맞혔다 ㅋㅋ", "정답! 촉이 좋은데?", "방가방가~ 바로 맞혔네."],
  "2010s": ["오, 맞혔는데? 완전 대박", "정답! 헐 진짜 잘 맞히네", "레알 감 좋은데?"],
  "2020s": ["오 맞혔다 ㄹㅇ", "정답! 이거 찐이다", "오 이거 실화냐, 바로 맞히네"],
};
const WRONG_REACTIONS = {
  default: ["아쉽다! 한 번만 더 생각해봐.", "거의 왔는데?", "음... 방향을 살짝 바꿔볼까?"],
  "1990s": ["아깝다, 한 번만 더 생각해봐.", "거의 다 왔었는데.", "음... 조금만 다르게 생각해볼까?"],
  "2000s": ["아쉽다 ㅠㅠ 한 번 더!", "거의 왔었는데 안습.", "음... 방향 좀 바꿔볼까?"],
  "2010s": ["헐 아쉽다! 한 번만 더", "거의 왔는데 대박 아깝다", "음... 다르게 생각해볼까?"],
  "2020s": ["아 아쉽다 ㄹㅇ 한 번 더", "거의 왔었는데 킹받네", "음... 다르게 가볼까?"],
};
const REVEAL_LEADINS = {
  default: ["이건 좀 억지였지? ㅋㅋ", "미안... 나도 말하고 조금 부끄럽다.", "아재개그는 원래 이 맛이야."],
  "1990s": ["이거 좀 억지였지?", "나도 말하면서 좀 부끄럽네.", "이런 게 아재개그의 맛이지."],
  "2000s": ["이건 좀 억지였지 ㅋㅋ", "나도 말하고 좀 안습이다.", "아재개그는 원래 이 맛이야."],
  "2010s": ["이거 좀 억지였지 ㅋㅋ 대박", "나도 말하고 좀 부끄럽다 레알.", "아재개그 국룰이지."],
  "2020s": ["이거 좀 억지였다 ㄹㅇ", "나도 말하고 좀 부끄럽다;;", "아재개그 클래식이지."],
};
// 첫 인사 — 정해진 문구라 OpenAI를 호출하지 않고 세대별로 미리 써둔 것 중 하나를 랜덤으로 보여준다.
// (이름=모리/Memory 소개 + 나이 대신 "그 시절 추억을 간직한 모리" 설정 + 세대 말투 0~1개 + 활동 선택 질문)
const GREETING_LINES = {
  "1990s": [
    "안녕! 나는 모리야. Memory, '기억'에서 따온 이름이지. 1990년대 추억을 잔뜩 품고 있는 모리인데, 개그 퀴즈 풀어볼래 아니면 그 시절 얘기 좀 나눠볼래?",
    "하이! 나 모리라고 해. 이름은 Memory('기억')에서 따왔어. 1990년대 추억을 간직하고 있거든 — 개그 퀴즈 풀어볼래, 아니면 옛날 얘기 좀 해볼래?",
    "안녕~ 나는 모리야, Memory('기억')에서 따온 이름이야. 1990년대 그 시절 추억을 품고 있어. 개그 퀴즈 풀래, 아니면 그때 얘기해볼래?",
  ],
  "2000s": [
    "안녕~ 나 모리야! 이름은 Memory, '기억'에서 따왔어 ㅋㅋ 2000년대 추억을 간직한 모리거든. 개그 퀴즈 풀어볼래, 아니면 그 시절 얘기해볼래?",
    "방가방가! 나는 모리, Memory('기억')에서 따온 이름이야. 2000년대 추억을 품고 있는데, 개그 퀴즈 풀어볼래 아니면 그때 얘기 좀 해볼래?",
    "안녕! 나 모리야. 이름은 Memory('기억')에서 따왔어. 2000년대 추억 간직한 모리인데, 개그 퀴즈 풀어볼래 아니면 그때 얘기해볼래? ㅋㅋ",
  ],
  "2010s": [
    "안녕! 나는 모리, 이름은 Memory('기억')에서 따왔어. 2010년대 추억을 품고 있는 모리인데, 완전 개그 퀴즈 풀어볼래 아니면 그때 얘기해볼래?",
    "헐 안녕! 나 모리야, Memory('기억')에서 따온 이름이지. 2010년대 추억 간직한 모리인데, 개그 퀴즈 풀어볼래 아니면 그때 얘기해볼래?",
    "안녕! 나는 모리야. 이름은 Memory('기억')에서 따왔어. 2010년대 추억을 품고 있는데, 레알 개그 퀴즈 풀어볼래 아니면 그때 얘기해볼래?",
  ],
  "2020s": [
    "안녕! 나 모리야, 이름은 Memory('기억')에서 따왔어. 2020년대 추억 간직한 모리인데 ㄹㅇ, 개그 퀴즈 풀어볼래 아니면 그때 얘기해볼래?",
    "안뇽! 나는 모리, Memory('기억')에서 따온 이름이야. 2020년대 추억을 품고 있는 모리인데, 개그 퀴즈 풀어볼래 아니면 그때 얘기 좀 해볼래?",
    "안녕! 나 모리야. 이름은 Memory('기억')에서 따왔어. 2020년대 추억 간직한 모리인데, 갓생 살듯 개그 퀴즈 풀어볼래 아니면 그때 얘기해볼래?",
  ],
  default: [
    "안녕! 나는 모리야. 이름은 Memory, '기억'에서 따온 거야. 그 시절 추억을 간직한 모리인데, 개그 퀴즈 풀어볼래 아니면 그때 얘기해볼래?",
  ],
};

// 자유 대화(OpenAI 연동) 기능은 아직 붙이기 전이라, 실제 API를 호출하는 대신 안내 멘트만 보여준다.
// 나중에 LLM 연동이 끝나면 이 값만 true로 바꾸면 된다(sendChatMessage 참고).
const LLM_CHAT_ENABLED = false;
const LLM_PENDING_LINES = {
  default: [
    "아직 이 기능(자유 대화)은 준비 중이야! 조금만 기다려줘 🙏 그동안 개그 퀴즈 풀어볼래?",
    "미안, 아직 이 대화 기능은 연결이 안 됐어. 개그 퀴즈는 지금도 할 수 있어!",
  ],
};

const START_LINES = ["자, 문제 하나 간다 😏", "좋아, 바로 시작해볼까?", "요것부터 한번 볼까?"];
const NEXT_LINES = ["다음 문제 간다 😏", "자, 다음 문제!", "이어서 하나 더 볼까?"];
const EXIT_LINES = ["그래, 원래 하던 얘기 계속할까?", "오케이, 퀴즈는 여기까지! 편하게 얘기하자."];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 세대별 반응 풀에서 고르고, 없으면 default 풀을 쓴다.
function pickByGeneration(pool, generationId) {
  return pick(pool[generationId] || pool.default);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 메시지 시간 표시(90s/10s 테마 전용) — CSS에서 테마별로 보이거나 숨겨진다.
function formatTime(ts) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

// 아주 단순한 keyword 기반 의도 인식 — 과한 NLP 없이 4일 프로젝트에 맞는 수준.
function detectIntent(text, inQuiz) {
  const t = text.trim();
  if (inQuiz) {
    if (/그만|종료|다른\s*(얘기|이야기)|대화\s*(하자|할래)/.test(t)) return "exit";
    if (/다음\s*(문제|꺼)|다음\s*걸로/.test(t)) return "next";
    if (/정답|포기|답.*(알려|공개|줘)/.test(t)) return "reveal";
    if (/힌트/.test(t)) return "hint";
    if (/모르겠|몰라/.test(t)) return "dontknow";
    return null;
  }
  if (/(퀴즈|아재개그|넌센스).*(내|줘|하자|풀|시작)/.test(t)) return "start_quiz";
  return null;
}

export default function ChatWindow({ generation, onBack }) {
  const [history, setHistory] = useState([]); // [{ role, content }]
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | error
  // quiz: null(퀴즈 아님) | { items, index, hintLevel }
  // hintLevel: 0=힌트 안 줌, 1=hint1 공개, 2=한번더 생각 유도(선택지 제시), 3=hint2 공개, 4+=힌트 소진
  const [quiz, setQuiz] = useState(null);
  // 봇이 메시지를 연달아 보낼 때(퀴즈 진행 등) 한번에 다 뜨지 않고, 타이핑 표시 후
  // 살짝 시간차를 두고 하나씩 나타나게 한다.
  const [botTyping, setBotTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [history, botTyping, status]);

  // 개그 퀴즈 등 진행 중에도 매번 입력창을 다시 클릭하지 않고 바로 타이핑할 수 있게,
  // 봇 응답이 끝날 때마다(그리고 퀴즈 버튼 클릭 등으로 포커스가 빠졌을 때) 입력창에 자동으로 포커스를 되돌려준다.
  useEffect(() => {
    if (status !== "sending" && !botTyping) {
      inputRef.current?.focus();
    }
  }, [status, botTyping, quiz, history.length]);

  async function appendBot(text) {
    setBotTyping(true);
    await sleep(500 + Math.random() * 400);
    setBotTyping(false);
    setHistory((h) => [...h, { role: "assistant", content: text, time: Date.now() }]);
  }
  function appendUser(text) {
    setHistory((h) => [...h, { role: "user", content: text, time: Date.now() }]);
  }

  // 대화창에 처음 들어오면 사용자 메시지를 기다리지 않고 모리가 먼저 인사한다.
  // 정해진 문구라 OpenAI를 호출하지 않고, 세대별로 미리 써둔 문구 중 하나를 그대로 보여준다.
  // (React StrictMode의 개발 모드 mount→cleanup→재mount로 effect가 두 번 실행돼도
  //  인사가 중복으로 뜨지 않도록, 지연 이후 setHistory 직전에 다시 cancelled를 확인한다.)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const text = pickByGeneration(GREETING_LINES, generation.id);
      setBotTyping(true);
      await sleep(500 + Math.random() * 400);
      setBotTyping(false);
      if (cancelled) return;
      setHistory((h) => [...h, { role: "assistant", content: text, time: Date.now() }]);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startQuiz() {
    setStatus("sending");
    try {
      const items = await chatApi.getGagItems();
      setStatus("idle");
      if (!items.length) {
        await appendBot("어, 지금 준비된 문제가 없네. 미안!");
        return;
      }
      setQuiz({ items, index: 0, hintLevel: 0 });
      await appendBot(pick(START_LINES));
      await appendBot(`${items[0].prompt} ___`);
    } catch (e) {
      setStatus("error");
    }
  }

  async function askHint(current) {
    const level = quiz?.hintLevel ?? 0;
    if (level === 0) {
      await appendBot("벌써 포기하는 거야? 힌트 하나 줄게.");
      await appendBot(`💡 ${current.hint1}`);
      setQuiz((q) => (q ? { ...q, hintLevel: 1 } : q));
    } else if (level === 1) {
      await appendBot("한 번만 더 생각해볼래? 아니면 정답 알려줄까?");
      setQuiz((q) => (q ? { ...q, hintLevel: 2 } : q));
    } else if (level === 2) {
      await appendBot(`💡 ${current.hint2}`);
      setQuiz((q) => (q ? { ...q, hintLevel: 3 } : q));
    } else {
      await appendBot("힌트는 다 썼어! '정답'이라고 말해주면 알려줄게.");
    }
  }

  async function revealAnswer(current) {
    setStatus("sending");
    try {
      // 정답 텍스트는 서버만 갖고 있어서, 채점 API로 조회한다(오답 취급되어도
      // correct_answer는 항상 함께 내려오므로 공개용으로 그대로 쓴다).
      const res = await chatApi.answerGagItem(current.id, " __reveal__ ");
      setStatus("idle");
      await appendBot(`정답은 ${res.correct_answer}!`);
      await appendBot(pickByGeneration(REVEAL_LEADINS, generation.id));
      await goToNext();
    } catch (e) {
      setStatus("error");
    }
  }

  async function goToNext() {
    const q = quiz;
    if (!q) return;
    const nextIndex = q.index + 1;
    if (nextIndex >= q.items.length) {
      await appendBot("오늘 준비한 문제는 여기까지야! 재밌었어? 😊");
      setQuiz(null);
      return;
    }
    await appendBot(pick(NEXT_LINES));
    await appendBot(`${q.items[nextIndex].prompt} ___`);
    setQuiz({ items: q.items, index: nextIndex, hintLevel: 0 });
  }

  async function tryAnswer(current, text) {
    setStatus("sending");
    try {
      const res = await chatApi.answerGagItem(current.id, text);
      setStatus("idle");
      if (res.is_correct) {
        await appendBot(pickByGeneration(CORRECT_REACTIONS, generation.id));
        await goToNext();
      } else {
        await appendBot(pickByGeneration(WRONG_REACTIONS, generation.id));
      }
    } catch (e) {
      setStatus("error");
    }
  }

  async function sendChatMessage(text, nextHistory) {
    // 아직 LLM(OpenAI) 연동 전이라, 실제 API를 호출하는 대신 안내 멘트만 보여준다.
    // LLM_CHAT_ENABLED를 true로 바꾸면 원래대로 실제 채팅 API를 호출한다.
    if (!LLM_CHAT_ENABLED) {
      setHistory(nextHistory);
      await appendBot(pickByGeneration(LLM_PENDING_LINES, generation.id));
      return;
    }
    setStatus("sending");
    try {
      const res = await chatApi.sendMessage({ generation: generation.id, message: text, history: history });
      setHistory([...nextHistory, { role: "assistant", content: res.message, time: Date.now() }]);
      setStatus("idle");
    } catch (e) {
      setHistory(nextHistory);
      setStatus("error");
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || status === "sending") return;
    setInput("");

    if (quiz) {
      appendUser(text);
      const current = quiz.items[quiz.index];
      const intent = detectIntent(text, true);
      if (intent === "exit") {
        appendBot(pick(EXIT_LINES));
        setQuiz(null);
      } else if (intent === "next") {
        goToNext();
      } else if (intent === "reveal") {
        await revealAnswer(current);
      } else if (intent === "hint" || intent === "dontknow") {
        askHint(current);
      } else {
        await tryAnswer(current, text);
      }
      return;
    }

    const intent = detectIntent(text, false);
    if (intent === "start_quiz") {
      appendUser(text);
      await startQuiz();
      return;
    }

    // 기존 페르소나 채팅(OpenAI) 경로 — 그대로 유지
    const nextHistory = [...history, { role: "user", content: text, time: Date.now() }];
    setHistory(nextHistory);
    await sendChatMessage(text, nextHistory);
  }

  function clickHint() {
    if (!quiz || status === "sending") return;
    appendUser("힌트 줘");
    askHint(quiz.items[quiz.index]);
  }
  function clickReveal() {
    if (!quiz || status === "sending") return;
    appendUser("정답 알려줘");
    revealAnswer(quiz.items[quiz.index]);
  }
  function clickExitQuiz() {
    if (!quiz) return;
    appendUser("그만할래");
    appendBot(pick(EXIT_LINES));
    setQuiz(null);
  }
  function clickStartQuiz() {
    if (quiz || status === "sending") return;
    appendUser("개그 퀴즈 풀어볼래");
    startQuiz();
  }
  // "그때 그 시절 얘기하기" 버튼 — 기존 자유대화(페르소나 채팅) 경로를 그대로 타되,
  // 사용자가 직접 타이핑하는 대신 정해진 문장으로 대화를 시작해준다.
  // 개그 퀴즈 도중에 눌러도 되게, 그럴 땐 먼저 퀴즈를 조용히 종료하고 이어서 대화를 시작한다.
  async function clickStartTalk() {
    if (status === "sending") return;
    if (quiz) setQuiz(null);
    const text = "그때 그 시절 얘기 좀 들려줘!";
    const nextHistory = [...history, { role: "user", content: text, time: Date.now() }];
    setHistory(nextHistory);
    await sendChatMessage(text, nextHistory);
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

      {!quiz ? (
        <div className="chat-window__activity-actions">
          <button className="chat-window__gag-btn" onClick={clickStartQuiz}>
            🔤 개그 퀴즈 풀어보기
          </button>
          <button className="chat-window__gag-btn" onClick={clickStartTalk} disabled={status === "sending"}>
            🗨️ 그때 그 시절 얘기하기
          </button>
        </div>
      ) : (
        <div className="chat-window__quiz-actions">
          <button onClick={clickHint} disabled={status === "sending"}>
            💡 힌트 보기
          </button>
          <button onClick={clickReveal} disabled={status === "sending"}>
            👀 정답 보기
          </button>
          <button onClick={clickStartTalk} disabled={status === "sending"}>
            🗨️ 그때 얘기하기
          </button>
          <button onClick={clickExitQuiz} className="chat-window__quiz-actions-exit">
            🚪 그만
          </button>
        </div>
      )}

      <div className="chat-window__messages">
        {history.length === 0 && (
          <p className="state-msg">{generation.display_name}의 모리에게 말을 걸어보세요!</p>
        )}
        {history.map((m, i) =>
          m.role === "assistant" ? (
            <div key={i} className="chat-row">
              <CharacterAvatar generationId={generation.id} character={generation.character} size={26} />
              <div className="chat-bubble chat-bubble--assistant">
                {m.content}
                {m.time && <span className="chat-msg-time">{formatTime(m.time)}</span>}
              </div>
            </div>
          ) : (
            <div key={i} className="chat-bubble chat-bubble--user">
              {m.content}
              {m.time && <span className="chat-msg-time">{formatTime(m.time)}</span>}
            </div>
          )
        )}
        {(status === "sending" || botTyping) && (
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
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-window__input">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={quiz ? "답을 입력하거나 힌트/정답/그만 이라고 말해보세요" : "메시지를 입력하세요"}
          disabled={status === "sending"}
        />
        <button onClick={send} disabled={status === "sending" || !input.trim()}>
          보내기
        </button>
      </div>
    </div>
  );
}
