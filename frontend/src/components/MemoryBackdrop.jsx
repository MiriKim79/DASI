// 화면 공통 배경 레이어.
// 크림 모눈(또는 분야 배경) 위에 추억 소품을 은은하게 흩뿌려 빈 공간을 채운다.
// 콘텐츠 뒤에 깔리며 클릭을 가로채지 않는다(pointer-events: none).
//
// props:
//   - items: 흩뿌릴 소품 이모지 배열. 분야별로 바꿔 넣으면 분야 맞춤 배경이 된다.
//            (생략 시 일반 레트로 소품 세트를 사용)
//   - variant: "default" | "category" — 카테고리 페이지는 소품을 조금 더 진하게.

// 소품이 놓일 자리(위치/회전/크기/애니메이션 지연)는 고정하고,
// 이 자리에 items 배열의 이모지를 순서대로 반복해서 채운다.
const LAYOUT = [
  { top: "6%", left: "5%", rot: -12, size: 46, delay: 0 },
  { top: "9%", left: "20%", rot: 8, size: 40, delay: 1.1 },
  { top: "5%", left: "37%", rot: 6, size: 38, delay: 2.5 },
  { top: "8%", left: "54%", rot: -10, size: 42, delay: 0.7 },
  { top: "6%", left: "70%", rot: 12, size: 36, delay: 3.0 },
  { top: "9%", left: "86%", rot: -8, size: 44, delay: 1.6 },
  { top: "22%", left: "10%", rot: 9, size: 42, delay: 2.2 },
  { top: "24%", left: "28%", rot: -6, size: 34, delay: 0.4 },
  { top: "21%", left: "63%", rot: -12, size: 40, delay: 1.0 },
  { top: "24%", left: "78%", rot: 10, size: 36, delay: 2.7 },
  { top: "23%", left: "92%", rot: -14, size: 40, delay: 0.9 },
  { top: "40%", left: "4%", rot: 14, size: 48, delay: 1.7 },
  { top: "38%", left: "18%", rot: -9, size: 40, delay: 3.2 },
  { top: "45%", left: "88%", rot: 11, size: 42, delay: 0.5 },
  { top: "42%", left: "72%", rot: -7, size: 38, delay: 2.0 },
  { top: "57%", left: "9%", rot: 8, size: 42, delay: 1.3 },
  { top: "60%", left: "24%", rot: -10, size: 40, delay: 2.8 },
  { top: "55%", left: "62%", rot: 12, size: 38, delay: 0.6 },
  { top: "56%", left: "91%", rot: -14, size: 44, delay: 1.9 },
  { top: "58%", left: "78%", rot: 7, size: 42, delay: 3.4 },
  { top: "74%", left: "6%", rot: -9, size: 40, delay: 0.8 },
  { top: "72%", left: "22%", rot: 10, size: 34, delay: 2.4 },
  { top: "76%", left: "40%", rot: -8, size: 36, delay: 1.5 },
  { top: "78%", left: "58%", rot: 9, size: 40, delay: 3.1 },
  { top: "73%", left: "74%", rot: -6, size: 38, delay: 0.3 },
  { top: "75%", left: "90%", rot: 12, size: 40, delay: 2.1 },
  { top: "90%", left: "14%", rot: -11, size: 44, delay: 1.2 },
  { top: "89%", left: "36%", rot: 8, size: 40, delay: 2.9 },
  { top: "91%", left: "54%", rot: -10, size: 38, delay: 0.7 },
  { top: "88%", left: "72%", rot: 11, size: 36, delay: 2.3 },
  { top: "90%", left: "88%", rot: -7, size: 42, delay: 1.6 },
];

const DEFAULT_ITEMS = [
  "📼", "🕹️", "🎈", "💿", "🍬", "📟", "👾", "✏️", "🎧", "🎮", "📷", "🪀", "📺",
];

export default function MemoryBackdrop({ items = DEFAULT_ITEMS, variant = "default" }) {
  const emojis = items && items.length > 0 ? items : DEFAULT_ITEMS;
  return (
    <div
      className={`memory-backdrop memory-backdrop--${variant}`}
      aria-hidden="true"
    >
      {LAYOUT.map((p, i) => (
        <span
          key={i}
          className="memory-prop"
          style={{
            top: p.top,
            left: p.left,
            fontSize: `${p.size}px`,
            "--rot": `${p.rot}deg`,
            animationDelay: `${p.delay}s`,
          }}
        >
          {emojis[i % emojis.length]}
        </span>
      ))}
    </div>
  );
}
