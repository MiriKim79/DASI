// 모든 화면 공통 배경 레이어.
// 크림 모눈 위에 2000~2010년대 추억 소품을 은은하게 흩뿌려 빈 공간을 채운다.
// 콘텐츠 뒤에 깔리며 클릭을 가로채지 않는다(pointer-events: none).
const PROPS = [
  { emoji: "📼", top: "6%", left: "5%", rot: -12, size: 46, delay: 0 },
  { emoji: "🕹️", top: "9%", left: "20%", rot: 8, size: 40, delay: 1.1 },
  { emoji: "🎈", top: "5%", left: "37%", rot: 6, size: 38, delay: 2.5 },
  { emoji: "💿", top: "8%", left: "54%", rot: -10, size: 42, delay: 0.7 },
  { emoji: "🍬", top: "6%", left: "70%", rot: 12, size: 36, delay: 3.0 },
  { emoji: "📟", top: "9%", left: "86%", rot: -8, size: 44, delay: 1.6 },
  { emoji: "👾", top: "22%", left: "10%", rot: 9, size: 42, delay: 2.2 },
  { emoji: "✏️", top: "24%", left: "28%", rot: -6, size: 34, delay: 0.4 },
  { emoji: "🎧", top: "21%", left: "63%", rot: -12, size: 40, delay: 1.0 },
  { emoji: "🧃", top: "24%", left: "78%", rot: 10, size: 36, delay: 2.7 },
  { emoji: "📀", top: "23%", left: "92%", rot: -14, size: 40, delay: 0.9 },
  { emoji: "🎮", top: "40%", left: "4%", rot: 14, size: 48, delay: 1.7 },
  { emoji: "📷", top: "38%", left: "18%", rot: -9, size: 40, delay: 3.2 },
  { emoji: "🕹️", top: "45%", left: "88%", rot: 11, size: 42, delay: 0.5 },
  { emoji: "💾", top: "42%", left: "72%", rot: -7, size: 38, delay: 2.0 },
  { emoji: "📼", top: "57%", left: "9%", rot: 8, size: 42, delay: 1.3 },
  { emoji: "🪀", top: "60%", left: "24%", rot: -10, size: 40, delay: 2.8 },
  { emoji: "🎧", top: "55%", left: "62%", rot: 12, size: 38, delay: 0.6 },
  { emoji: "💿", top: "56%", left: "91%", rot: -14, size: 44, delay: 1.9 },
  { emoji: "📺", top: "58%", left: "78%", rot: 7, size: 42, delay: 3.4 },
  { emoji: "👾", top: "74%", left: "6%", rot: -9, size: 40, delay: 0.8 },
  { emoji: "✏️", top: "72%", left: "22%", rot: 10, size: 34, delay: 2.4 },
  { emoji: "🍭", top: "76%", left: "40%", rot: -8, size: 36, delay: 1.5 },
  { emoji: "📟", top: "78%", left: "58%", rot: 9, size: 40, delay: 3.1 },
  { emoji: "🎈", top: "73%", left: "74%", rot: -6, size: 38, delay: 0.3 },
  { emoji: "💾", top: "75%", left: "90%", rot: 12, size: 40, delay: 2.1 },
  { emoji: "🎮", top: "90%", left: "14%", rot: -11, size: 44, delay: 1.2 },
  { emoji: "🪀", top: "89%", left: "36%", rot: 8, size: 40, delay: 2.9 },
  { emoji: "🎧", top: "91%", left: "54%", rot: -10, size: 38, delay: 0.7 },
  { emoji: "🍬", top: "88%", left: "72%", rot: 11, size: 36, delay: 2.3 },
  { emoji: "📼", top: "90%", left: "88%", rot: -7, size: 42, delay: 1.6 },
];

export default function MemoryBackdrop() {
  return (
    <div className="memory-backdrop" aria-hidden="true">
      {PROPS.map((p, i) => (
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
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
