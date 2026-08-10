// 답변 버튼.
// state: "idle" | "correct" | "wrong" | "reveal"(정답 표시) | "dim"(선택 안 한 항목)
export default function AnswerButton({ option, state, disabled, primaryColor, onClick }) {
  const classNames = ["answer-button", `answer-button--${state}`].join(" ");
  const style =
    state === "idle"
      ? { borderColor: primaryColor, color: primaryColor }
      : undefined;
  return (
    <button
      className={classNames}
      style={style}
      disabled={disabled}
      onClick={() => onClick(option)}
    >
      {option.option_text}
      {state === "correct" && " ✅"}
      {state === "wrong" && " ❌"}
      {state === "reveal" && " ✅"}
    </button>
  );
}
