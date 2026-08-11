import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RetroWindow from "../../components/RetroWindow.jsx";
import { ageTestApi } from "../../api/ageTest.js";
import "./AgeTest.css";

const SELECT_DELAY_MS = 220; // 선택 상태를 잠깐 보여준 뒤 다음 문항으로 넘어간다

// #3: 나이 맞히기 퀴즈 진행 화면. #2의 GET /api/age-test/questions를 그대로 호출해서 쓴다.
// 하드코딩된 질문 배열은 두지 않는다. 사이드바/공통 Layout 없이 단독으로 보여준다(#15).
export default function QuizPage() {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]); // [{ question_id, option_id }]
  const [selectedOptionId, setSelectedOptionId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    ageTestApi
      .getQuestions()
      .then((data) => {
        if (cancelled) return;
        setQuestions(data);
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
    return (
      <div className="page age-start-page">
        <RetroWindow titleColor="transparent">
          <p className="age-quiz__state">질문을 불러오는 중...</p>
        </RetroWindow>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="page age-start-page">
        <RetroWindow titleColor="transparent">
          <p className="age-quiz__state age-quiz__state--error">
            질문을 불러오지 못했어요. 잠시 후 다시 시도해주세요.
          </p>
        </RetroWindow>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="page age-start-page">
        <RetroWindow titleColor="transparent">
          <p className="age-quiz__state">아직 준비된 질문이 없어요.</p>
        </RetroWindow>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = currentIndex + 1;

  function handleBack() {
    if (currentIndex === 0 || selectedOptionId !== null) return;
    setCurrentIndex((i) => i - 1);
    setAnswers((prev) => prev.slice(0, -1));
  }

  function handleSelect(optionId) {
    if (selectedOptionId !== null) return; // 중복 클릭 방지
    setSelectedOptionId(optionId);

    const nextAnswers = [
      ...answers,
      { question_id: currentQuestion.id, option_id: optionId },
    ];

    setTimeout(() => {
      if (currentIndex + 1 >= questions.length) {
        // #4(제출 API)는 아직 없다. 답변은 결과 화면(#8)에서 이어서 쓸 수 있도록 넘겨만 둔다.
        navigate("/age-check/result", { state: { answers: nextAnswers } });
        return;
      }
      setAnswers(nextAnswers);
      setSelectedOptionId(null);
      setCurrentIndex((i) => i + 1);
    }, SELECT_DELAY_MS);
  }

  return (
    <div className="page age-start-page">
      <RetroWindow titleColor="transparent">
        <div className="age-quiz">
          {currentIndex > 0 && (
            <button
              type="button"
              className="age-quiz__back"
              onClick={handleBack}
              disabled={selectedOptionId !== null}
            >
              ← 이전 질문
            </button>
          )}

          <p className="age-quiz__progress">
            {progress} / {questions.length}
          </p>
          <div className="age-quiz__progress-bar">
            <div
              className="age-quiz__progress-fill"
              style={{ width: `${(progress / questions.length) * 100}%` }}
            />
          </div>

          <h2 className="age-quiz__question">{currentQuestion.text}</h2>
          {currentQuestion.subtitle && (
            <p className="age-quiz__subtitle">{currentQuestion.subtitle}</p>
          )}

          <div className="age-quiz__options">
            {currentQuestion.options.map((option) => (
              <button
                key={option.id}
                type="button"
                className={
                  "age-quiz__option" +
                  (selectedOptionId === option.id ? " age-quiz__option--selected" : "") +
                  (selectedOptionId !== null && selectedOptionId !== option.id
                    ? " age-quiz__option--dim"
                    : "")
                }
                disabled={selectedOptionId !== null}
                onClick={() => handleSelect(option.id)}
              >
                {option.text}
              </button>
            ))}
          </div>
        </div>
      </RetroWindow>
    </div>
  );
}
