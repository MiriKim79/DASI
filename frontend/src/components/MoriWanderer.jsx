import { useEffect, useRef } from "react";

// 홈 화면 배경을 '진짜 걸어다니는' 마스코트 '모리'.
// - 이동 방향에 맞는 걷기 프레임 재생(좌우=옆모습(좌우반전), 위=뒷모습, 아래=앞모습).
// - 중앙 창 뒤로 지나갈 수 있고(창 아래 레이어), 창 뒤에 3초 이상 머물면
//   창 가장자리 랜덤 위치에서 '훔쳐보기' 포즈로 빼꼼! 잠깐 뒤 다시 걷는다.
// - 모션 최소화 설정 시 정지. 클릭은 통과.
const SIZE = 180;
const MARGIN = 16;
const SPEED = 46; // px/초
const STRIDE = 26; // 이 거리마다 프레임 1장 전환
const MIN_TRAVEL = 240; // 목적지 최소 이동 거리
const BEHIND_TRIGGER = 3; // 창 뒤 몇 초 이상이면 훔쳐보기
const PEEK_TIME = 1.9; // 훔쳐보기 유지 시간(초)
const PEEK_MAX = 168; // 훔쳐보기 포즈 최대 크기(px)
const PEEK_OVERLAP_PX = 10; // 포즈가 창 테두리에 살짝 겹치는 정도(px) — 모서리에 딱 붙게

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export default function MoriWanderer({ onClick }) {
  const elRef = useRef(null);
  const imgRef = useRef(null);
  const st = useRef({
    x: 0, y: 0, tx: 0, ty: 0,
    dir: "front", flip: 1, frame: 0, walked: 0, paused: 0,
    behind: 0, mode: "walk", peekT: 0, stuck: 0,
  });

  useEffect(() => {
    const el = elRef.current;
    const imgEl = imgRef.current;
    if (!el || !imgEl) return;
    const parent = el.parentElement;
    let raf, alive = true;
    let frames = null;
    const peekMeta = {}; // {left:Image, right:Image, up:[Image,Image]}

    const bounds = () => ({
      w: parent.clientWidth || window.innerWidth,
      h: parent.clientHeight || window.innerHeight,
    });

    // 창(.retro-window) 실제 사각형(부모 기준, 확장 없음)
    const windowBox = () => {
      const win = parent.querySelector(".retro-window");
      if (!win) return null;
      const pr = parent.getBoundingClientRect();
      const wr = win.getBoundingClientRect();
      return {
        x0: wr.left - pr.left, y0: wr.top - pr.top,
        x1: wr.right - pr.left, y1: wr.bottom - pr.top,
      };
    };
    const overlapsWin = (x, y, box) =>
      box && x < box.x1 && x + SIZE > box.x0 && y < box.y1 && y + SIZE > box.y0;

    const pickTarget = () => {
      const { w, h } = bounds();
      const s = st.current;
      const box = windowBox();
      // 가끔(약 1/3) 창 뒤로 숨으러 간다 → 도착 후 오래 머물러 훔쳐보기 유발
      if (box && Math.random() < 0.33) {
        const cx = (box.x0 + box.x1) / 2 - SIZE / 2;
        const cy = (box.y0 + box.y1) / 2 - SIZE / 2;
        s.tx = clamp(cx + (Math.random() * 80 - 40), MARGIN, w - SIZE - MARGIN);
        s.ty = clamp(cy + (Math.random() * 60 - 30), MARGIN, h - SIZE - MARGIN);
        s.hideTarget = true;
        return;
      }
      s.hideTarget = false;
      const maxX = Math.max(1, w - SIZE - MARGIN * 2);
      const maxY = Math.max(1, h - SIZE - MARGIN * 2);
      let best = null, bestD = -1;
      for (let i = 0; i < 24; i++) {
        const tx = MARGIN + Math.random() * maxX;
        const ty = MARGIN + Math.random() * maxY;
        const d = Math.hypot(tx - s.x, ty - s.y);
        if (d >= MIN_TRAVEL) { s.tx = tx; s.ty = ty; return; }
        if (d > bestD) { bestD = d; best = [tx, ty]; }
      }
      if (best) { s.tx = best[0]; s.ty = best[1]; }
    };

    const setDirection = (dx, dy) => {
      const s = st.current;
      const adx = Math.abs(dx), ady = Math.abs(dy);
      if (adx > ady * 1.25) {
        s.dir = "side";
        if (adx > 8) s.flip = dx >= 0 ? -1 : 1; // 원본 왼쪽 봄
      } else if (ady > adx * 1.25) {
        s.dir = dy < 0 ? "back" : "front";
      }
    };

    const renderWalk = () => {
      const s = st.current;
      const set = frames[s.dir] || frames.front;
      const src = set[s.frame % set.length];
      if (imgEl.getAttribute("src") !== src) imgEl.src = src;
      el.style.transform = `translate(${s.x}px, ${s.y}px)`;
      imgEl.style.transform = `scaleX(${s.flip})`;
    };

    // 훔쳐보기 시작: 창 가장자리 랜덤 위치에 빼꼼
    const startPeek = () => {
      const s = st.current;
      const box = windowBox();
      if (!box) { s.behind = 0; return; }
      const edges = ["left", "right", "up"];
      const edge = edges[Math.floor(Math.random() * edges.length)];

      let src, natW, natH;
      if (edge === "up") {
        const arr = frames.peek.up;
        const k = Math.floor(Math.random() * arr.length);
        src = arr[k];
        const m = peekMeta.up[k];
        natW = m.naturalWidth || 794; natH = m.naturalHeight || 648;
      } else {
        src = frames.peek[edge];
        const m = peekMeta[edge];
        natW = m.naturalWidth || 599; natH = m.naturalHeight || 1069;
      }
      const scale = PEEK_MAX / Math.max(natW, natH);
      const cW = Math.round(natW * scale), cH = Math.round(natH * scale);

      // 포즈의 '잡는 쪽'(모서리)이 창 테두리에 딱 맞고, 살짝(PEEK_OVERLAP_PX)만 겹치게 배치.
      let x, y;
      if (edge === "left") {
        x = box.x0 - cW + PEEK_OVERLAP_PX; // 오른쪽 끝(잡는쪽)=창 왼쪽 테두리
        y = box.y0 + Math.random() * Math.max(1, (box.y1 - box.y0) - cH);
      } else if (edge === "right") {
        x = box.x1 - PEEK_OVERLAP_PX; // 왼쪽 끝=창 오른쪽 테두리
        y = box.y0 + Math.random() * Math.max(1, (box.y1 - box.y0) - cH);
      } else {
        y = box.y0 - cH + PEEK_OVERLAP_PX; // 아래 끝=창 위쪽 테두리
        x = box.x0 + Math.random() * Math.max(1, (box.x1 - box.x0) - cW);
      }

      el.style.width = `${cW}px`;
      el.style.height = `${cH}px`;
      el.style.transform = `translate(${x}px, ${y}px)`;
      imgEl.style.transform = "scaleX(1)";
      imgEl.src = src;

      s.mode = "peek";
      s.peekT = PEEK_TIME;
      s.peekEdge = edge;
      s.peekX = x; s.peekY = y; s.peekCW = cW; s.peekCH = cH;
    };

    const endPeek = () => {
      const s = st.current;
      const { w, h } = bounds();
      const box = windowBox();
      // 창 밖 가장자리로 나와서 다시 걷기
      let x = s.peekX, y = s.peekY;
      if (box) {
        if (s.peekEdge === "left") x = box.x0 - SIZE - 2;
        else if (s.peekEdge === "right") x = box.x1 + 2;
        else if (s.peekEdge === "up") y = box.y0 - SIZE - 2;
      }
      s.x = clamp(x, MARGIN, w - SIZE - MARGIN);
      s.y = clamp(y, MARGIN, h - SIZE - MARGIN);
      // 크기 원복(걷기용 180)
      el.style.width = "";
      el.style.height = "";
      s.mode = "walk";
      s.behind = 0;
      s.paused = 0;
      s.frame = 0;
      pickTarget();
      setDirection(s.tx - s.x, s.ty - s.y);
      renderWalk();
    };

    const start = () => {
      const s = st.current;
      pickTarget(); s.x = s.tx; s.y = s.ty;
      pickTarget();
      setDirection(s.tx - s.x, s.ty - s.y);
      renderWalk();
      el.style.opacity = "1";

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return;

      let last = performance.now();
      const tick = (now) => {
        if (!alive) return;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const s = st.current;

        if (s.mode === "peek") {
          s.peekT -= dt;
          if (s.peekT <= 0) endPeek();
          raf = requestAnimationFrame(tick);
          return;
        }

        if (s.paused > 0) {
          s.paused -= dt;
          s.frame = 0;
        } else {
          const dx = s.tx - s.x, dy = s.ty - s.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 3) {
            // 숨으러 온 경우엔 오래 머문다(창 뒤 3초+ → 훔쳐보기)
            s.paused = s.hideTarget ? BEHIND_TRIGGER + 0.8 : 0.5 + Math.random() * 1.3;
            pickTarget();
            setDirection(s.tx - s.x, s.ty - s.y);
          } else {
            const step = Math.min(dist, SPEED * dt);
            s.x += (dx / dist) * step;
            s.y += (dy / dist) * step;
            setDirection(dx, dy);
            s.walked += step;
            if (s.walked >= STRIDE) { s.walked -= STRIDE; s.frame++; }
          }
        }

        // 창 뒤 체류 시간 측정 → 3초 이상이면 훔쳐보기
        const box = windowBox();
        if (overlapsWin(s.x, s.y, box)) s.behind += dt;
        else s.behind = 0;
        if (s.behind >= BEHIND_TRIGGER) { startPeek(); }
        else { renderWalk(); }

        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    fetch("/mori/walk/manifest.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive) return;
        if (data && data.side && data.side.length) {
          const url = (n) => `/mori/walk/${n}`;
          frames = {
            side: data.side.map(url),
            back: (data.back || data.side).map(url),
            front: (data.front || data.side).map(url),
            peek: data.peek
              ? {
                  left: url(data.peek.left),
                  right: url(data.peek.right),
                  up: (data.peek.up || []).map(url),
                }
              : null,
          };
          // 프리로드 + 훔쳐보기 포즈 메타(자연 크기) 확보
          [...frames.side, ...frames.back, ...frames.front].forEach((u) => { const im = new Image(); im.src = u; });
          if (frames.peek) {
            peekMeta.left = new Image(); peekMeta.left.src = frames.peek.left;
            peekMeta.right = new Image(); peekMeta.right.src = frames.peek.right;
            peekMeta.up = frames.peek.up.map((u) => { const im = new Image(); im.src = u; return im; });
          }
          start();
        } else {
          el.style.display = "none";
        }
      })
      .catch(() => { el.style.display = "none"; });

    const onResize = () => pickTarget();
    window.addEventListener("resize", onResize);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      className={`mori-wanderer${onClick ? " mori-wanderer--clickable" : ""}`}
      ref={elRef}
      style={{ opacity: 0 }}
      {...(onClick
        ? {
            role: "button",
            tabIndex: 0,
            "aria-label": "모리와 대화하기",
            onClick,
            onKeyDown: (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onClick()),
          }
        : { "aria-hidden": "true" })}
    >
      <img className="mori-wanderer__img" ref={imgRef} alt="" draggable="false" />
    </div>
  );
}
