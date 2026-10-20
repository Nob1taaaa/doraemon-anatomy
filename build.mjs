import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const KIT = "/Users/harshitshah/.claude/skills/anatomy";
const k = await import(pathToFileURL(`${KIT}/kit/iso-kit.mjs`).href);
const G = await import(pathToFileURL(`${KIT}/kit/lathe.mjs`).href);
const { kitScript } = await import(pathToFileURL(`${KIT}/scripts/inline-kit.mjs`).href);

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";
const OUT = join(HERE, theme === "light" ? "doraemon-anatomy-light.html" : "doraemon-anatomy.html");

const WIDTH = 640;
const HEIGHT = 540;

// World units: about 1 px of the real thing. x and y on the floor, z up.
const PLATE = { x: -100, y: -74, w: 200, d: 148, r: 12 };
const H = [0, 0, 172];          // head centre
const HEAD_R = 46;
const TORSO_Z = 44;             // torso floor
const TOP = 118;                // torso top
const TORSO = [[0, 30], [9, 41, 1], [34, 47, 1], [58, 45, 1], [74, 37, 1]]; // s runs up from TORSO_Z
const HATCH_Z = 84;             // pocket centre height (s = 40)
const HATCH_TRAVEL = 16;
const SHOULDER_Z = 98;
const ARM_LIFT = 44;
const LEG_LIFT = 30;
const NECK_LIFT = 30;
const HEAD_LIFT = 62;

const P = k.fitProjection(
  [
    ...k.boxCorners(PLATE, -10, 0),
    [0, 0, H[2] + HEAD_R],
    [-100 - ARM_LIFT, 0, SHOULDER_Z],
    [100 + ARM_LIFT, 0, SHOULDER_Z],
    [0, 0, H[2] + HEAD_R + HEAD_LIFT],
  ],
  WIDTH,
  HEIGHT,
  { pad: 28, azimuth: 42 },
);

const norm = (v) => {
  const l = Math.hypot(...v);
  return v.map((c) => c / l);
};
const at = (c, d, t) => [c[0] + d[0] * t, c[1] + d[1] * t, c[2] + d[2] * t];
const FRONT = k.towardViewer(P);
const F3 = [FRONT[0], FRONT[1], 0];
const SIDE = [-FRONT[1], FRONT[0], 0];
// A unit direction from a centre: el is elevation, lat the angle from the front toward the side.
const dirOn = (el, lat) => [
  (F3[0] * Math.cos(lat) + SIDE[0] * Math.sin(lat)) * Math.cos(el),
  (F3[1] * Math.cos(lat) + SIDE[1] * Math.sin(lat)) * Math.cos(el),
  Math.sin(el),
];

const solid = (paths, opts = {}) => k.solidSvg(paths, opts);
const line = (d, opts = {}) => k.lineSvg(d, opts);
const dots = (points, opts = {}) => k.dotsSvg(points, opts);
const frame = (o, a) => G.frameAlong(o, a);
// Seams on round parts: a little past the limb, so each end meets the silhouette stroke.
const arc = (F, s, r, P, options = {}) => G.arcOf(F, s, r, P, { trim: -1.2, ...options });
const up = (o) => frame(o, [0, 0, 1]);

// ---------- static base ----------

function stand() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -10, 10, P)}"/>`];
  out.push(solid(k.slabOf(PLATE, -10, 10, P, 10, 1.6), { tone: "mid" }));
  out.push(line(k.planOutline(k.insetPlan(PLATE, 6), 0, P, 10), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(line(screws.map(([x, y]) => k.ring(x, y, 2.4, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(dots(screws.map(([x, y]) => k.iso([x, y, 0], P)), { size: 0.5 }));
  const strip = { x: PLATE.x + 14, y: PLATE.y + PLATE.d - 15, w: PLATE.w - 28, d: 6, r: 1 };
  out.push(solid(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [2, 3.6], P);
  out.push(line(ticks.minor, { tone: "lo" }), line(ticks.major, { tone: "mid" }));
  const label = { x: PLATE.x + 14, y: PLATE.y + 14, w: 30, d: 14, r: 1.5 };
  out.push(solid(k.slabOf(label, 0, 0.6, P, 3), { tone: "mid", crease: "none" }));
  out.push(line(k.planOutline(k.insetPlan(label, 2.5), 0.6, P, 3), { tone: "faint" }));
  return out.join("");
}

function torso() {
  const F = up([0, 0, TORSO_Z]);
  const out = [];
  out.push(solid(G.solidOf(TORSO, F, P), {
    tone: "hi",
    inner: [
      line(arc(F, 40, 47, P, { slope: 0 }), { tone: "faint" }),
      line(arc(F, 70, 39, P, { slope: -0.5 }), { tone: "faint" }),
      line(arc(frame([0, 0, HATCH_Z], F3), 46.5, 16.5, P, { slope: 0 }), { tone: "lo" }),
    ].join(""),
  }));
  out.push(dots(G.dotsOf(F, 40, 47, 18, P, { slope: 0 }), { size: 0.45, tone: "lo" }));
  // pocket bezel and cavity floor: fixed in the body, the plug slides out of them
  const HF = frame([0, 0, HATCH_Z], F3);
  out.push(solid(G.ringBand(44, 52, 15, 19.5, HF, P), { tone: "mid" }));
  out.push(solid(G.disc(47, 48, 15, HF, P), { tone: "lo", crease: "none" }));
  out.push(dots(G.dotsOf(HF, 52, 17.2, 8, P, { all: true }), { size: 0.45, tone: "lo" }));
  return out.join("");
}

// ---------- moving assemblies ----------

function leg(sg) {
  const x = sg * 24;
  const y = 6;
  const F0 = up([x, y, 0]); // every s on this frame is a height above the floor
  const out = [];
  out.push(solid(G.disc(0, 9, 17, F0, P), { tone: "lo", crease: "none", inner: line(G.circleOf(F0, 9, 15, P), { tone: "faint" }) }));
  out.push(dots(G.dotsOf(F0, 9, 15, 6, P, { all: true }), { size: 0.4, tone: "lo" }));
  out.push(solid(G.disc(9, 16, 8, F0, P), { tone: "mid" }));
  out.push(solid(G.sphereOf([x, y, 18], 8, P, { steps: 32 }), { tone: "mid" }));
  out.push(solid(G.disc(18, 30, 8, F0, P), { tone: "mid", inner: line(arc(F0, 22, 8, P), { tone: "faint" }) }));
  out.push(solid(G.sphereOf([x, y, 32], 9, P, { steps: 32 }), { tone: "hi" }));
  out.push(solid(G.disc(32, 44, 10.5, F0, P), { tone: "mid" }));
  out.push(solid(G.sphereOf([x, y, 42], 11, P, { steps: 32 }), { tone: "lo" }));
  return out.join("");
}

function arm(sg) {
  const O = [sg * 40, 0, SHOULDER_Z];
  const A = norm([sg, 0, -0.5]);
  const F0 = frame(O, A);
  const hand = at(O, A, 54);
  const out = [];
  out.push(solid(G.sphereOf(O, 11, P, { steps: 32 }), { tone: "mid" }));
  out.push(solid(G.disc(4, 26, 8, F0, P), { tone: "mid", inner: line(arc(F0, 15, 8, P), { tone: "faint" }) }));
  out.push(dots(G.dotsOf(F0, 15, 8, 6, P), { size: 0.4, tone: "lo" }));
  out.push(solid(G.ringBand(22, 29, 8, 10.5, F0, P), { tone: "lo" }));
  out.push(solid(G.disc(29, 44, 7, F0, P), { tone: "mid" }));
  out.push(solid(G.ringBand(42, 46, 7, 8.5, F0, P), { tone: "lo" }));
  out.push(solid(G.sphereOf(hand, 11, P, { steps: 36 }), { tone: "hi", inner: line(arc(frame(hand, A), 0, 11, P), { tone: "faint" }) }));
  return out.join("");
}

function neckAndBell() {
  const N = up([0, 0, TOP - 2]);
  const out = [];
  out.push(solid(G.disc(0, 16, 21, N, P), { tone: "mid" }));
  out.push(solid(G.ringBand(0, 5, 21, 28, N, P), { tone: "lo" }));
  out.push(dots(G.dotsOf(N, 5, 26, 10, P, { all: true }), { size: 0.4, tone: "lo" }));
  // horn bell on the neck collar, mouth forward and under the head
  const O = at([0, 0, 122], F3, 18);
  const B = frame(O, norm([F3[0] * 0.85, F3[1] * 0.85, 0.45]));
  out.push(solid(G.solidOf([[0, 9], [3, 10, 1], [8, 12, 1], [14, 17, 1], [19, 21, 1], [21, 22]], B, P), {
    tone: "hi",
    inner: line(arc(B, 21, 22, P, { slope: 0.9 }), { tone: "faint" }) + line(arc(B, 14, 17, P, { slope: 0.9 }), { tone: "faint" }),
  }));
  return out.join("");
}

function head() {
  const out = [];
  // whiskers: tactile wires that start inside the face and stand out past the limb
  const wires = [];
  const tips = [];
  for (const sg of [-1, 1]) {
    for (const el of [-0.1, -0.24, -0.38]) {
      const a = at(H, dirOn(el, sg * 0.1), 40);
      const b = at(H, dirOn(el, sg * 0.5), 66);
      wires.push(k.segment(a, b, P));
      tips.push(k.iso(b, P));
    }
  }
  out.push(line(wires.join(""), { tone: "lo" }));
  out.push(dots(tips, { size: 0.5, tone: "mid" }));
  out.push(solid(G.sphereOf(H, HEAD_R, P, { steps: 56 }), {
    tone: "hi",
    inner: line(arc(frame(H, [0, 0, 1]), 0, HEAD_R, P, { slope: 0 }), { tone: "faint" }),
  }));
  for (const sg of [-1, 1]) {
    const d = dirOn(0.1, sg * 0.42);
    const C = at(H, d, 40);
    out.push(solid(G.sphereOf(C, 11, P, { steps: 32 }), { tone: "hi", inner: line(arc(frame(C, d), 0, 11, P), { tone: "faint" }) }));
    out.push(solid(G.sphereOf(at(H, d, 50), 4.5, P, { steps: 24 }), { tone: "lo" }));
  }
  const nd = dirOn(-0.2, 0);
  const N = at(H, nd, 43);
  out.push(solid(G.sphereOf(N, 6.5, P, { steps: 28 }), { tone: "mid", inner: line(arc(frame(N, nd), 0, 6.5, P), { tone: "faint" }) }));
  return out.join("");
}

function hatch() {
  const HF = frame([0, 0, HATCH_Z], F3);
  const out = [];
  out.push(solid(G.disc(40, 56, 15, HF, P), { tone: "hi", lit: true, inner: line(arc(HF, 56, 15, P), { tone: "faint" }) }));
  out.push(dots(G.dotsOf(HF, 56, 11.5, 6, P, { all: true }), { size: 0.5, tone: "lo" }));
  out.push(solid(G.disc(56, 62, 4.5, HF, P), { tone: "mid" }));
  out.push(line(G.ribsOf(HF, 56, 62, 4.5, 14, P, { seams: true }), { tone: "lo" }));
  return out.join("");
}

// ---------- assembly ----------

const ASSEMBLIES = [
  { name: "hatch", lift: [F3[0] * HATCH_TRAVEL, F3[1] * HATCH_TRAVEL, 0], lag: 0 },
  { name: "head", lift: [0, 0, HEAD_LIFT], lag: 0.14 },
  { name: "neck", lift: [0, 0, NECK_LIFT], lag: 0.24 },
  { name: "arm-L", lift: [-ARM_LIFT, 0, 0], lag: 0.34 },
  { name: "arm-R", lift: [ARM_LIFT, 0, 0], lag: 0.34 },
  { name: "leg-L", lift: [-LEG_LIFT, 0, 0], lag: 0.34 },
  { name: "leg-R", lift: [LEG_LIFT, 0, 0], lag: 0.34 },
];
const moved = (name, body) => {
  const a = ASSEMBLIES.find((item) => item.name === name);
  return `<g data-part="${name}" transform="${k.translateAlong(P, a.lift.map(() => 0))}">${body}</g>`;
};

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A Doraemon-style service robot, exploded into its parts: a stand plate, two legs with ball and hinge joints and round feet, two arms with shoulder balls and elbow rings, a torso with a pocket bezel, a pocket plug that slides out on its own axis, a neck collar with a horn bell, and a head carrying two camera eyes, a nose touch sensor and whiskers. Each assembly lifts or slides away from the body when opened.",
  body: [
    stand(),
    moved("leg-L", leg(-1)),
    moved("arm-L", arm(-1)),
    torso(),
    moved("leg-R", leg(1)),
    moved("arm-R", arm(1)),
    moved("hatch", hatch()),
    moved("neck", neckAndBell()),
    moved("head", head()),
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const ASSEMBLIES = ${JSON.stringify(ASSEMBLIES)};
const TRAVEL = ${HATCH_TRAVEL};
const TAU = 0.22, TOUR = 4.2;
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const parts = ASSEMBLIES.map((item) => ({ ...item, el: svg.querySelector('[data-part="' + item.name + '"]'), share: 0 }));
let open = false, since = 0, clock = 0, last = 0, frame = 0, visible = false, touring = !still.matches, quiet = 0, toured = 0;
const hatchPart = parts.find((item) => item.name === "hatch");
function draw() {
  for (const part of parts) part.el.setAttribute("transform", translateAlong(P, part.lift.map((c) => c * part.share)));
  const travel = (hatchPart.share * TRAVEL).toFixed(1);
  const text = (open ? "apart" : "assembled") + " \\u00b7 pocket " + travel + " px out";
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuetext", text);
}
function toggle() {
  open = !open;
  since = clock;
  run();
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  clock += dt;
  if (touring && clock - toured > TOUR && clock - since > TOUR) { toured = clock; toggle(); }
  let moving = false;
  for (const part of parts) {
    const goal = clock - since >= part.lag ? (open ? 1 : 0) : (open ? 0 : 1);
    if (still.matches) part.share = goal;
    else part.share += (goal - part.share) * (1 - Math.exp(-dt / TAU));
    if (Math.abs(goal - part.share) < 0.0005) part.share = goal;
    else moving = true;
  }
  draw();
  frame = visible && (moving || touring) ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const pause = () => {
  touring = false;
  clearTimeout(quiet);
  quiet = setTimeout(() => { touring = !still.matches; toured = clock; run(); }, 6000);
};
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
stage.addEventListener("click", () => { pause(); toggle(); });
stage.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") { event.preventDefault(); pause(); toggle(); }
});
draw();
`;

const body = k.plateHtml({
  fig: "Fig 1",
  title: "Doraemon, part by part",
  hint: "Click or press Enter to take it apart",
  readout: "assembled · pocket 0.0 px out",
  keys: [
    { mark: "lit", label: "Four-dimensional pocket: a plug on a bezel, sliding on its own axis" },
    { mark: "raised", label: "Body parts: head, torso, neck and horn bell, arms and legs" },
    { mark: "dotted", label: "Sensors: camera eyes, nose contact and whisker wires" },
  ],
  caption:
    "A service robot taken apart. The pocket plug pulls out of its bezel by 16 px along its own axis; the head, neck, arms and legs lift or slide clear of the torso on staggered springs. Every part is a joint, a shell or a sensor on a real mount.",
  body: `<div class="iso-stage" tabindex="0" role="button" aria-label="Doraemon robot exploded view: press Enter or click to take the parts apart and put them back">${svg}</div>`,
});

writeFileSync(OUT, k.pageHtml({ title: "Doraemon, part by part", theme, body, script: kitScript() + live }));
console.log("wrote", OUT);
