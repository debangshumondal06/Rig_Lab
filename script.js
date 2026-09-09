/* ---------------------------------------------------------------
   Rig Lab
   A jointed stick figure whose pose is driven entirely by the
   angles in `jointAngles` and the transform in `bodyState`.
   User code never touches the SVG directly — it only calls the
   small API defined near the bottom (setJoints, setBody, wait,
   resetPose).
------------------------------------------------------------------*/

// ---- Skeleton geometry (all lengths in SVG user units) ----------
const RIG = {
  pelvis: { x: 200, y: 300 },
  torsoLen: 90,
  headRadius: 18,
  shoulderWidth: 46,
  hipWidth: 34,
  upperArmLen: 55,
  lowerArmLen: 48,
  upperLegLen: 72,
  lowerLegLen: 64,
};

const JOINT_NAMES = [
  "leftShoulder", "rightShoulder", "leftElbow", "rightElbow",
  "leftHip", "rightHip", "leftKnee", "rightKnee",
];

const REST_JOINTS = Object.fromEntries(JOINT_NAMES.map((n) => [n, 0]));
const REST_BODY = { x: 0, y: 0, rot: 0 };

let jointAngles = { ...REST_JOINTS };
let bodyState = { ...REST_BODY };
let stopRequested = false;
let running = false;

// ---- SVG construction -------------------------------------------
const svg = document.getElementById("stage");
const NS = "http://www.w3.org/2000/svg";

function el(tag, attrs) {
  const node = document.createElementNS(NS, tag);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  return node;
}

// Ground line for visual reference
svg.appendChild(el("line", {
  x1: 40, y1: 452, x2: 360, y2: 452,
  stroke: "#2c343e", "stroke-width": 2,
}));

const rig = el("g", { id: "rig" });
svg.appendChild(rig);

const LIMB_STYLE = { stroke: "#dfe7ec", "stroke-width": 8, "stroke-linecap": "round" };
const JOINT_STYLE = { r: 6, fill: "#f2c94c", stroke: "#171c22", "stroke-width": 2 };

// Limb segments (drawn first, so joints render on top)
const parts = {
  torso: el("line", LIMB_STYLE),
  leftUpperArm: el("line", LIMB_STYLE),
  leftLowerArm: el("line", LIMB_STYLE),
  rightUpperArm: el("line", LIMB_STYLE),
  rightLowerArm: el("line", LIMB_STYLE),
  leftUpperLeg: el("line", LIMB_STYLE),
  leftLowerLeg: el("line", LIMB_STYLE),
  rightUpperLeg: el("line", LIMB_STYLE),
  rightLowerLeg: el("line", LIMB_STYLE),
};
Object.values(parts).forEach((p) => rig.appendChild(p));

const head = el("circle", { r: RIG.headRadius, fill: "#dfe7ec" });
rig.appendChild(head);

const jointDots = {};
["neck", "leftShoulder", "rightShoulder", "leftElbow", "rightElbow",
 "leftHand", "rightHand", "pelvis", "leftHip", "rightHip",
 "leftKnee", "rightKnee", "leftFoot", "rightFoot"].forEach((name) => {
  jointDots[name] = el("circle", JOINT_STYLE);
  rig.appendChild(jointDots[name]);
});

// ---- Forward kinematics -------------------------------------------
function dir(angleDeg) {
  const r = (angleDeg * Math.PI) / 180;
  return { x: Math.sin(r), y: Math.cos(r) }; // 0deg = straight down
}

function add(a, b) { return { x: a.x + b.x, y: a.y + b.y }; }
function scale(v, s) { return { x: v.x * s, y: v.y * s }; }

function computePose() {
  const pelvis = { x: RIG.pelvis.x, y: RIG.pelvis.y };
  const neck = add(pelvis, { x: 0, y: -RIG.torsoLen });

  const lShoulder = add(neck, { x: -RIG.shoulderWidth / 2, y: 0 });
  const rShoulder = add(neck, { x: RIG.shoulderWidth / 2, y: 0 });
  const lElbow = add(lShoulder, scale(dir(jointAngles.leftShoulder), RIG.upperArmLen));
  const rElbow = add(rShoulder, scale(dir(jointAngles.rightShoulder), RIG.upperArmLen));
  const lHand = add(lElbow, scale(dir(jointAngles.leftShoulder + jointAngles.leftElbow), RIG.lowerArmLen));
  const rHand = add(rElbow, scale(dir(jointAngles.rightShoulder + jointAngles.rightElbow), RIG.lowerArmLen));

  const lHip = add(pelvis, { x: -RIG.hipWidth / 2, y: 0 });
  const rHip = add(pelvis, { x: RIG.hipWidth / 2, y: 0 });
  const lKnee = add(lHip, scale(dir(jointAngles.leftHip), RIG.upperLegLen));
  const rKnee = add(rHip, scale(dir(jointAngles.rightHip), RIG.upperLegLen));
  const lFoot = add(lKnee, scale(dir(jointAngles.leftHip + jointAngles.leftKnee), RIG.lowerLegLen));
  const rFoot = add(rKnee, scale(dir(jointAngles.rightHip + jointAngles.rightKnee), RIG.lowerLegLen));

  const headCenter = add(neck, { x: 0, y: -RIG.headRadius - 4 });

  return { pelvis, neck, lShoulder, rShoulder, lElbow, rElbow, lHand, rHand,
            lHip, rHip, lKnee, rKnee, lFoot, rFoot, headCenter };
}

function setLine(node, a, b) {
  node.setAttribute("x1", a.x); node.setAttribute("y1", a.y);
  node.setAttribute("x2", b.x); node.setAttribute("y2", b.y);
}
function setDot(node, p) {
  node.setAttribute("cx", p.x); node.setAttribute("cy", p.y);
}

function render() {
  const p = computePose();

  setLine(parts.torso, p.pelvis, p.neck);
  setLine(parts.leftUpperArm, p.lShoulder, p.lElbow);
  setLine(parts.leftLowerArm, p.lElbow, p.lHand);
  setLine(parts.rightUpperArm, p.rShoulder, p.rElbow);
  setLine(parts.rightLowerArm, p.rElbow, p.rHand);
  setLine(parts.leftUpperLeg, p.lHip, p.lKnee);
  setLine(parts.leftLowerLeg, p.lKnee, p.lFoot);
  setLine(parts.rightUpperLeg, p.rHip, p.rKnee);
  setLine(parts.rightLowerLeg, p.rKnee, p.rFoot);

  setDot(head, p.headCenter);
  setDot(jointDots.neck, p.neck);
  setDot(jointDots.leftShoulder, p.lShoulder);
  setDot(jointDots.rightShoulder, p.rShoulder);
  setDot(jointDots.leftElbow, p.lElbow);
  setDot(jointDots.rightElbow, p.rElbow);
  setDot(jointDots.leftHand, p.lHand);
  setDot(jointDots.rightHand, p.rHand);
  setDot(jointDots.pelvis, p.pelvis);
  setDot(jointDots.leftHip, p.lHip);
  setDot(jointDots.rightHip, p.rHip);
  setDot(jointDots.leftKnee, p.lKnee);
  setDot(jointDots.rightKnee, p.rKnee);
  setDot(jointDots.leftFoot, p.lFoot);
  setDot(jointDots.rightFoot, p.rFoot);

  rig.setAttribute(
    "transform",
    `translate(${bodyState.x} ${bodyState.y}) rotate(${bodyState.rot} ${RIG.pelvis.x} ${RIG.pelvis.y})`
  );
}
render();

// ---- Tween engine ---------------------------------------------
function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function tween(fromValues, toValues, duration, onUpdate) {
  return new Promise((resolve, reject) => {
    if (duration <= 0) {
      onUpdate(toValues);
      resolve();
      return;
    }
    const start = performance.now();
    function frame(now) {
      if (stopRequested) { reject(new Error("Stopped")); return; }
      const t = Math.min(1, (now - start) / duration);
      const eased = easeInOutQuad(t);
      const current = {};
      for (const k in toValues) {
        current[k] = fromValues[k] + (toValues[k] - fromValues[k]) * eased;
      }
      onUpdate(current);
      if (t >= 1) { resolve(); } else { requestAnimationFrame(frame); }
    }
    requestAnimationFrame(frame);
  });
}

function wait(ms) {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    function tick(now) {
      if (stopRequested) { reject(new Error("Stopped")); return; }
      if (now - start >= ms) { resolve(); } else { requestAnimationFrame(tick); }
    }
    requestAnimationFrame(tick);
  });
}

// ---- Public movement API (exposed to user code) -----------------
function setJoints(target, duration = 400) {
  const from = { ...jointAngles };
  const to = { ...jointAngles, ...target };
  return tween(from, to, duration, (vals) => {
    jointAngles = { ...jointAngles, ...vals };
    render();
  });
}

function setBody(target, duration = 400) {
  const from = { ...bodyState };
  const to = { ...bodyState, ...target };
  return tween(from, to, duration, (vals) => {
    bodyState = { ...bodyState, ...vals };
    render();
  });
}

function resetPose(duration = 300) {
  return Promise.all([
    setJoints({ ...REST_JOINTS }, duration),
    setBody({ ...REST_BODY }, duration),
  ]);
}

// ---- Console log --------------------------------------------------
const consoleEl = document.getElementById("console");
function log(msg, cls = "") {
  const line = document.createElement("p");
  line.className = "line" + (cls ? " " + cls : "");
  line.textContent = msg;
  consoleEl.appendChild(line);
  consoleEl.scrollTop = consoleEl.scrollHeight;
}
function clearLog() { consoleEl.innerHTML = ""; }

// ---- Run / Stop / Reset wiring -------------------------------------
const runBtn = document.getElementById("runBtn");
const stopBtn = document.getElementById("stopBtn");
const resetBtn = document.getElementById("resetBtn");
const codeInput = document.getElementById("codeInput");

async function runUserCode() {
  if (running) return;
  stopRequested = false;
  running = true;
  runBtn.disabled = true;
  clearLog();
  log("Running…");

  const code = codeInput.value;
  try {
    // The user's code runs inside an async function, with only the
    // movement API in scope — no access to the page or DOM.
    const factory = new Function(
      "setJoints", "setBody", "wait", "resetPose",
      `return (async () => {\n${code}\n})();`
    );
    await factory(setJoints, setBody, wait, resetPose);
    log("Done.", "ok");
  } catch (err) {
    if (err && err.message === "Stopped") {
      log("Stopped.");
    } else {
      log("Error: " + (err && err.message ? err.message : err), "error");
    }
  } finally {
    running = false;
    runBtn.disabled = false;
  }
}

runBtn.addEventListener("click", runUserCode);
stopBtn.addEventListener("click", () => { stopRequested = true; });
resetBtn.addEventListener("click", () => {
  stopRequested = true;
  setTimeout(() => { stopRequested = false; resetPose(250); }, 0);
});

// ---- Preset sample scripts -----------------------------------------
const PRESETS = {

  wave: `// WAVE HELLO — a good first example.
// Joints are angles in degrees, 0 = hanging straight down.
// setJoints({ joint: angle, ... }, ms) animates and returns a promise.

await setJoints({ rightShoulder: -150, rightElbow: 40 }, 400);

for (let i = 0; i < 3; i++) {
  await setJoints({ rightElbow: 10 }, 220);
  await setJoints({ rightElbow: 50 }, 220);
}

await resetPose(400);
`,

  walk: `// WALK CYCLE
// Arms and legs swing opposite to each other, knees bend a little
// on the forward leg so the foot clears the ground.

for (let step = 0; step < 4; step++) {
  await setJoints({
    leftShoulder: -30, rightShoulder: 30,
    leftHip: 35, rightHip: -35,
    leftKnee: 10, rightKnee: 45,
  }, 280);

  await setJoints({
    leftShoulder: 30, rightShoulder: -30,
    leftHip: -35, rightHip: 35,
    leftKnee: 45, rightKnee: 10,
  }, 280);
}

await resetPose(300);
`,

  run: `// RUN CYCLE
// Same idea as walking, but bigger swings, faster timing, and a
// small vertical bounce from setBody to sell the speed.

for (let step = 0; step < 6; step++) {
  await Promise.all([
    setJoints({
      leftShoulder: -55, rightShoulder: 55,
      leftElbow: 70, rightElbow: 70,
      leftHip: 55, rightHip: -35,
      leftKnee: 15, rightKnee: 95,
    }, 160),
    setBody({ y: -14 }, 160),
  ]);

  await Promise.all([
    setJoints({
      leftShoulder: 55, rightShoulder: -55,
      leftElbow: 70, rightElbow: 70,
      leftHip: -35, rightHip: 55,
      leftKnee: 95, rightKnee: 15,
    }, 160),
    setBody({ y: 0 }, 160),
  ]);
}

await resetPose(300);
`,

  jump: `// JUMP
// Crouch (bend knees, dip body), then push upward, then land back
// into the crouch before returning to rest.

await setJoints({ leftKnee: 60, rightKnee: 60, leftShoulder: -20, rightShoulder: -20 }, 220);
await setBody({ y: 20 }, 220);

await Promise.all([
  setJoints({ leftKnee: 0, rightKnee: 0, leftShoulder: -140, rightShoulder: -140 }, 260),
  setBody({ y: -90 }, 260),
]);

await wait(120);

await Promise.all([
  setJoints({ leftKnee: 55, rightKnee: 55 }, 220),
  setBody({ y: 20 }, 220),
]);

await resetPose(300);
`,

  backflip: `// BACKFLIP
// setBody's "rot" spins the whole rig around the pelvis in degrees.
// Tucking the knees and arms in mid-air sells the rotation.

await setJoints({ leftKnee: 60, rightKnee: 60 }, 200);
await setBody({ y: 20 }, 200);

await Promise.all([
  setBody({ y: -60, rot: -360 }, 620),
  setJoints({
    leftKnee: 120, rightKnee: 120,
    leftHip: -30, rightHip: -30,
    leftShoulder: -60, rightShoulder: 60,
    leftElbow: 90, rightElbow: -90,
  }, 620),
]);

await Promise.all([
  setBody({ y: 0, rot: -360 }, 200),
  setJoints({ leftKnee: 30, rightKnee: 30, leftHip: 0, rightHip: 0 }, 200),
]);

await setBody({ rot: 0 }, 0); // snap the counter back to 0 without spinning
await resetPose(300);
`,
};

const presetSelect = document.getElementById("presetSelect");
const loadPresetBtn = document.getElementById("loadPresetBtn");

loadPresetBtn.addEventListener("click", () => {
  const key = presetSelect.value;
  if (PRESETS[key]) codeInput.value = PRESETS[key];
});

// Start the editor with the simplest example already in place.
codeInput.value = PRESETS.wave;