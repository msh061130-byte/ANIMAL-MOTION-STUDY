// ANIMAL MOTION STUDY — FROG
// All artwork, rain, fly, and tongue are made from HTML elements and CSS.

const poster = document.getElementById("poster");
const rain = document.getElementById("rain");
const flyElement = document.getElementById("fly");
const tongue = document.getElementById("tongue");
const mouthAnchor = document.getElementById("mouthAnchor");
const frog = document.getElementById("frog");
const hint = document.getElementById("hint");
const impact = document.getElementById("impact");

const DEFAULT_HINT = 'CLICK THE FLY TO CATCH IT <span class="hint-sep">·</span> CLICK ANYWHERE TO SHOOT THE TONGUE';
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// CSS-only raindrop shapes: no images, canvas, or SVG.
for (let i = 0; i < (reduceMotion ? 34 : 105); i++) {
  const drop = document.createElement("i");
  drop.className = "raindrop";
  drop.style.left = `${rand(-10, 110)}%`;
  drop.style.setProperty("--length", `${rand(18, 90).toFixed(1)}px`);
  drop.style.setProperty("--opacity", rand(0.12, 0.5).toFixed(2));
  drop.style.setProperty("--duration", `${rand(0.65, 1.6).toFixed(2)}s`);
  drop.style.setProperty("--delay", `${rand(-3, 0).toFixed(2)}s`);
  rain.appendChild(drop);
}

function dimensions() {
  const r = poster.getBoundingClientRect();
  return { width: r.width, height: r.height, left: r.left, top: r.top };
}

function mouthPosition() {
  const rect = mouthAnchor.getBoundingClientRect();
  const area = poster.getBoundingClientRect();
  return { x: rect.left - area.left + rect.width / 2, y: rect.top - area.top + rect.height / 2 };
}

function randomFlyTarget() {
  const { width, height } = dimensions();
  const narrow = width < 700;
  return {
    x: rand(width * (narrow ? 0.12 : 0.21), width * (narrow ? 0.88 : 0.52)),
    y: rand(height * (narrow ? 0.5 : 0.2), height * (narrow ? 0.78 : 0.65)),
  };
}

const initial = dimensions();
const fly = {
  x: initial.width * (initial.width < 700 ? 0.75 : 0.44),
  y: initial.height * (initial.width < 700 ? 0.6 : 0.3),
  target: null,
  mode: "flying",
  nextTargetTime: 0,
};
fly.target = randomFlyTarget();
let busy = false;
let lastFrame = performance.now();

function positionFly(scale = 1, angle = 0) {
  flyElement.style.left = `${fly.x}px`;
  flyElement.style.top = `${fly.y}px`;
  flyElement.style.transform = `translate(-50%, -50%) scale(${scale}) rotate(${angle}deg)`;
}

function updateFly(now) {
  const dt = clamp(now - lastFrame, 0, 60);
  lastFrame = now;
  if (fly.mode === "flying") {
    if (now > fly.nextTargetTime || Math.hypot(fly.target.x - fly.x, fly.target.y - fly.y) < 28) {
      fly.target = randomFlyTarget();
      fly.nextTargetTime = now + rand(1100, 2600);
    }
    const speed = reduceMotion ? 0.0014 : 0.0022;
    const movement = clamp(dt * speed, 0, 0.15);
    fly.x += (fly.target.x - fly.x) * movement;
    fly.y += (fly.target.y - fly.y) * movement;
    positionFly(1, Math.sin(now * 0.004) * 8);
  }
  requestAnimationFrame(updateFly);
}
requestAnimationFrame(updateFly);

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function tween(ms, fn) {
  return new Promise((resolve) => {
    const start = performance.now();
    function tick(now) {
      const p = clamp((now - start) / ms, 0, 1);
      fn(p);
      if (p < 1) requestAnimationFrame(tick);
      else resolve();
    }
    requestAnimationFrame(tick);
  });
}

function flashPoint(x, y) {
  impact.style.left = `${x}px`;
  impact.style.top = `${y}px`;
  impact.classList.remove("active");
  void impact.offsetWidth;
  impact.classList.add("active");
}

function aimTongue(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  tongue.style.left = `${from.x}px`;
  tongue.style.top = `${from.y}px`;
  tongue.style.transform = `translateY(-50%) rotate(${angle}deg)`;
  return { dx, dy, length };
}

function showHint(html) {
  hint.innerHTML = html;
}

async function spitFly() {
  const from = mouthPosition();
  const { width, height } = dimensions();
  const to = {
    x: clamp(from.x + rand(width * 0.23, width * 0.43), 48, width - 52),
    y: clamp(from.y - rand(height * 0.11, height * 0.28), 64, height - 72),
  };

  showHint('GULP! <span class="hint-sep">→</span> SPIT! <span class="hint-sep">→</span> FLY AGAIN');
  frog.classList.add("spitting");
  fly.mode = "spitting";
  flyElement.style.opacity = "1";
  await tween(730, (p) => {
    const u = easeOut(p);
    fly.x = from.x + (to.x - from.x) * u;
    fly.y = from.y + (to.y - from.y) * u - Math.sin(p * Math.PI) * Math.min(95, height * 0.12);
    positionFly(0.5 + 0.5 * p, 360 * u);
  });
  frog.classList.remove("spitting");
  fly.target = randomFlyTarget();
  fly.nextTargetTime = performance.now() + 700;
  fly.mode = "flying";
}

async function shootTongue(point) {
  if (busy) return;
  busy = true;

  const originalFly = { x: fly.x, y: fly.y };
  const caught = fly.mode === "flying" && Math.hypot(point.x - fly.x, point.y - fly.y) <= 43;
  const target = caught ? originalFly : point;
  const from = mouthPosition();
  const vector = aimTongue(from, target);
  tongue.style.opacity = "1";
  tongue.style.width = "0px";

  // The fly stops moving briefly when the tongue is about to catch it.
  if (caught) fly.mode = "targeted";
  showHint(
    caught
      ? 'TARGET LOCKED <span class="hint-sep">·</span> CATCHING THE FLY'
      : 'TONGUE EXTENDED <span class="hint-sep">·</span> TRY THE MOVING FLY',
  );

  await tween(265, (p) => {
    tongue.style.width = `${vector.length * easeOut(p)}px`;
  });
  flashPoint(target.x, target.y);
  await wait(95);

  if (caught) {
    fly.mode = "captured";
    showHint('GOT IT! <span class="hint-sep">·</span> THE FLY IS CAUGHT');
  }

  await tween(340, (p) => {
    const fraction = 1 - easeInOut(p);
    tongue.style.width = `${vector.length * fraction}px`;
    if (caught) {
      fly.x = from.x + vector.dx * fraction;
      fly.y = from.y + vector.dy * fraction;
      positionFly(0.68 + 0.32 * fraction);
    }
  });
  tongue.style.opacity = "0";
  tongue.style.width = "0px";

  if (caught) {
    fly.mode = "eaten";
    flyElement.style.opacity = "0";
    frog.classList.add("gulp");
    showHint('GULP! <span class="hint-sep">·</span> THE FROG SWALLOWED THE FLY');
    await wait(650);
    frog.classList.remove("gulp");
    await wait(220);
    await spitFly();
  }

  showHint(DEFAULT_HINT);
  busy = false;
}

// A click anywhere shoots the tongue to that location.
// A hit (within 43px of the moving fly) catches, swallows, spits, and releases it.
poster.addEventListener("pointerdown", (event) => {
  if (event.button !== 0 || busy) return;
  const r = dimensions();
  const point = {
    x: clamp(event.clientX - r.left, 0, r.width),
    y: clamp(event.clientY - r.top, 0, r.height),
  };
  void shootTongue(point);
});

window.addEventListener("resize", () => {
  const { width, height } = dimensions();
  fly.x = clamp(fly.x, 25, width - 25);
  fly.y = clamp(fly.y, 25, height - 25);
  fly.target = randomFlyTarget();
});

// Keyboard access: F / Space catches the visible fly.
document.addEventListener("keydown", (event) => {
  if (busy || (event.key !== "f" && event.code !== "Space")) return;
  event.preventDefault();
  void shootTongue({ x: fly.x, y: fly.y });
});

positionFly();
