/* Rig Lab — a tiny, code-controlled character playground. */
const RIG = { pelvis: { x: 200, y: 300 }, torsoLen: 90, headRadius: 18, shoulderWidth: 46, hipWidth: 34, upperArmLen: 50, lowerArmLen: 42, handLen: 18, upperLegLen: 68, lowerLegLen: 58, footLen: 18 };
const JOINT_NAMES = ["spine", "leftShoulder", "rightShoulder", "leftElbow", "rightElbow", "leftWrist", "rightWrist", "leftHip", "rightHip", "leftKnee", "rightKnee", "leftAnkle", "rightAnkle"];
const REST_JOINTS = Object.fromEntries(JOINT_NAMES.map((n) => [n, 0])); REST_JOINTS.spine = 180;
const REST_BODY = { x: 0, y: 0, rot: 0 };
let jointAngles = { ...REST_JOINTS }, bodyState = { ...REST_BODY }, stopRequested = false, running = false, animationSpeed = 1;
const physicsState = { enabled: true, gravity: 0.18, bounce: 0.42, stiffness: 0.16, damping: 0.82, velocityY: 0, velocityX: 0, lastTime: performance.now() };
const savedTheme = localStorage.getItem("riglab-theme") || "light"; document.documentElement.dataset.theme = savedTheme;
const svg = document.getElementById("stage"), NS = "http://www.w3.org/2000/svg";
function el(tag, attrs) { const node = document.createElementNS(NS, tag); Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v)); return node; }

const shadow = el("ellipse", { cx: 200, cy: 451, rx: 61, ry: 7, fill: "#050a12", opacity: ".55" }); svg.appendChild(shadow);
const rig = el("g", { id: "rig" }); svg.appendChild(rig);
const limbs = {
  torsoLower: el("line", {}), torsoUpper: el("line", {}), leftUpperArm: el("line", {}), leftLowerArm: el("line", {}), leftHand: el("line", {}),
  rightUpperArm: el("line", {}), rightLowerArm: el("line", {}), rightHand: el("line", {}), leftUpperLeg: el("line", {}),
  leftLowerLeg: el("line", {}), leftFoot: el("line", {}), rightUpperLeg: el("line", {}), rightLowerLeg: el("line", {}), rightFoot: el("line", {})
};
Object.values(limbs).forEach((part) => { part.setAttribute("stroke", "#c8d5df"); part.setAttribute("stroke-width", "13"); part.setAttribute("stroke-linecap", "round"); part.setAttribute("fill", "none"); rig.appendChild(part); });
const accents = {};
Object.keys(limbs).forEach((key) => { accents[key] = el("line", { stroke: key.includes("right") ? "#8e83e8" : "#56d7c6", "stroke-width": "4", "stroke-linecap": "round", opacity: ".92" }); rig.appendChild(accents[key]); });
const torsoCore = el("line", { stroke: "#f0c768", "stroke-width": "5", "stroke-linecap": "round", opacity: ".9" }); rig.appendChild(torsoCore);
const head = el("circle", { r: RIG.headRadius, fill: "#f0c768", stroke: "#0a111d", "stroke-width": "4" }); rig.appendChild(head);
const jointDots = {};
["pelvis", "spine", "neck", "leftShoulder", "rightShoulder", "leftElbow", "rightElbow", "leftWrist", "rightWrist", "leftHand", "rightHand", "leftHip", "rightHip", "leftKnee", "rightKnee", "leftAnkle", "rightAnkle", "leftFoot", "rightFoot"].forEach((name) => { jointDots[name] = el("circle", { r: name.includes("Foot") || name.includes("Hand") ? 5 : 7, fill: "#f8fbfb", stroke: name === "spine" || name.includes("Ankle") || name.includes("Wrist") ? "#d59622" : "#1cae9f", "stroke-width": "3" }); if (JOINT_NAMES.includes(name)) { jointDots[name].dataset.draggable = "true"; jointDots[name].style.cursor = "grab"; } rig.appendChild(jointDots[name]); });

function dir(angleDeg) { const r = angleDeg * Math.PI / 180; return { x: Math.sin(r), y: Math.cos(r) }; }
function side(angleDeg) { const r = angleDeg * Math.PI / 180; return { x: Math.cos(r), y: -Math.sin(r) }; }
function add(a, b) { return { x: a.x + b.x, y: a.y + b.y }; }
function scale(v, s) { return { x: v.x * s, y: v.y * s }; }
function computePose() {
  const pelvis = { ...RIG.pelvis }, spineMid = add(pelvis, scale(dir(jointAngles.spine), RIG.torsoLen / 2)), neck = add(spineMid, scale(dir(jointAngles.spine), RIG.torsoLen / 2));
  const shoulderSide = side(jointAngles.spine), lShoulder = add(neck, scale(shoulderSide, RIG.shoulderWidth / 2)), rShoulder = add(neck, scale(shoulderSide, -RIG.shoulderWidth / 2));
  const lElbow = add(lShoulder, scale(dir(jointAngles.leftShoulder), RIG.upperArmLen)), rElbow = add(rShoulder, scale(dir(jointAngles.rightShoulder), RIG.upperArmLen));
  const lWrist = add(lElbow, scale(dir(jointAngles.leftShoulder + jointAngles.leftElbow), RIG.lowerArmLen)), rWrist = add(rElbow, scale(dir(jointAngles.rightShoulder + jointAngles.rightElbow), RIG.lowerArmLen));
  const lHand = add(lWrist, scale(dir(jointAngles.leftShoulder + jointAngles.leftElbow + jointAngles.leftWrist), RIG.handLen)), rHand = add(rWrist, scale(dir(jointAngles.rightShoulder + jointAngles.rightElbow + jointAngles.rightWrist), RIG.handLen));
  const lHip = add(pelvis, { x: -RIG.hipWidth / 2, y: 0 }), rHip = add(pelvis, { x: RIG.hipWidth / 2, y: 0 });
  const lKnee = add(lHip, scale(dir(jointAngles.leftHip), RIG.upperLegLen)), rKnee = add(rHip, scale(dir(jointAngles.rightHip), RIG.upperLegLen));
  const lAnkle = add(lKnee, scale(dir(jointAngles.leftHip + jointAngles.leftKnee), RIG.lowerLegLen)), rAnkle = add(rKnee, scale(dir(jointAngles.rightHip + jointAngles.rightKnee), RIG.lowerLegLen));
  const lFoot = add(lAnkle, scale(dir(jointAngles.leftHip + jointAngles.leftKnee + jointAngles.leftAnkle), RIG.footLen)), rFoot = add(rAnkle, scale(dir(jointAngles.rightHip + jointAngles.rightKnee + jointAngles.rightAnkle), RIG.footLen));
  return { pelvis, spineMid, neck, lShoulder, rShoulder, lElbow, rElbow, lWrist, rWrist, lHand, rHand, lHip, rHip, lKnee, rKnee, lAnkle, rAnkle, lFoot, rFoot, headCenter: add(neck, scale(dir(jointAngles.spine), RIG.headRadius + 4)) };
}
function setLine(node, a, b) { node.setAttribute("x1", a.x); node.setAttribute("y1", a.y); node.setAttribute("x2", b.x); node.setAttribute("y2", b.y); }
function setDot(node, p) { node.setAttribute("cx", p.x); node.setAttribute("cy", p.y); }
function render() {
  const p = computePose(), pairs = {
    torsoLower: [p.pelvis, p.spineMid], torsoUpper: [p.spineMid, p.neck], leftUpperArm: [p.lShoulder, p.lElbow], leftLowerArm: [p.lElbow, p.lWrist], leftHand: [p.lWrist, p.lHand],
    rightUpperArm: [p.rShoulder, p.rElbow], rightLowerArm: [p.rElbow, p.rWrist], rightHand: [p.rWrist, p.rHand], leftUpperLeg: [p.lHip, p.lKnee],
    leftLowerLeg: [p.lKnee, p.lAnkle], leftFoot: [p.lAnkle, p.lFoot], rightUpperLeg: [p.rHip, p.rKnee], rightLowerLeg: [p.rKnee, p.rAnkle], rightFoot: [p.rAnkle, p.rFoot]
  };
  Object.entries(pairs).forEach(([key, [a, b]]) => { setLine(limbs[key], a, b); setLine(accents[key], a, b); });
  setLine(torsoCore, p.pelvis, p.neck); setDot(head, p.headCenter);
  const dots = { spine: p.spineMid, neck: p.neck, leftShoulder: p.lShoulder, rightShoulder: p.rShoulder, leftElbow: p.lElbow, rightElbow: p.rElbow, leftWrist: p.lWrist, rightWrist: p.rWrist, leftHand: p.lHand, rightHand: p.rHand, pelvis: p.pelvis, leftHip: p.lHip, rightHip: p.rHip, leftKnee: p.lKnee, rightKnee: p.rKnee, leftAnkle: p.lAnkle, rightAnkle: p.rAnkle, leftFoot: p.lFoot, rightFoot: p.rFoot };
  Object.entries(dots).forEach(([key, point]) => setDot(jointDots[key], point));
  const footCorrection = bodyState.y > -2 ? Math.max(-24, Math.min(24, 452 - Math.max(p.lFoot.y, p.rFoot.y))) : 0, renderY = bodyState.y + footCorrection;
  rig.setAttribute("transform", `translate(${bodyState.x} ${renderY}) rotate(${bodyState.rot} ${RIG.pelvis.x} ${RIG.pelvis.y})`);
  shadow.setAttribute("transform", `translate(${bodyState.x} ${renderY})`); shadow.setAttribute("rx", Math.max(28, 61 - Math.abs(bodyState.y) * .2)); shadow.setAttribute("opacity", Math.max(.18, .55 - Math.abs(bodyState.y) * .003));
  document.getElementById("xReadout").textContent = Math.round(bodyState.x); document.getElementById("yReadout").textContent = Math.round(bodyState.y); document.getElementById("rotReadout").textContent = `${Math.round(bodyState.rot)}°`;
}
render();
const dragState = { active: null, pending: null, frame: 0 };
const jointParents = { spine: "pelvis", leftShoulder: "neck", rightShoulder: "neck", leftElbow: "lShoulder", rightElbow: "rShoulder", leftWrist: "lElbow", rightWrist: "rElbow", leftHip: "pelvis", rightHip: "pelvis", leftKnee: "lHip", rightKnee: "rHip", leftAnkle: "lKnee", rightAnkle: "rKnee" };
function pointerToSvg(event) { const point = svg.createSVGPoint(); point.x = event.clientX; point.y = event.clientY; return point.matrixTransform(svg.getScreenCTM().inverse()); }
function parentPoint(pose, key) { return pose[key] || pose[{ lShoulder: "lShoulder", rShoulder: "rShoulder", lElbow: "lElbow", rElbow: "rElbow", lHip: "lHip", rHip: "rHip", lKnee: "lKnee", rKnee: "rKnee" }[key]]; }
function queueDragAngle(event) { if (!dragState.active) return; const pose = computePose(), point = pointerToSvg(event), parent = parentPoint(pose, jointParents[dragState.active]); if (!parent) return; const absolute = Math.atan2(point.x - parent.x, point.y - parent.y) * 180 / Math.PI; const offsets = { spine: 0, leftShoulder: 0, rightShoulder: 0, leftElbow: jointAngles.leftShoulder, rightElbow: jointAngles.rightShoulder, leftWrist: jointAngles.leftShoulder + jointAngles.leftElbow, rightWrist: jointAngles.rightShoulder + jointAngles.rightElbow, leftHip: 0, rightHip: 0, leftKnee: jointAngles.leftHip, rightKnee: jointAngles.rightHip, leftAnkle: jointAngles.leftHip + jointAngles.leftKnee, rightAnkle: jointAngles.rightHip + jointAngles.rightKnee }; dragState.pending = { [dragState.active]: dragState.active === "spine" ? Math.max(140, Math.min(220, absolute)) : Math.max(-170, Math.min(170, absolute - offsets[dragState.active])) }; if (!dragState.frame) dragState.frame = requestAnimationFrame(() => { setJoints(dragState.pending, 0); dragState.pending = null; dragState.frame = 0; }); }
Object.entries(jointDots).forEach(([name, node]) => { if (!JOINT_NAMES.includes(name)) return; node.addEventListener("pointerdown", (event) => { event.preventDefault(); dragState.active = name; node.setPointerCapture?.(event.pointerId); node.style.cursor = "grabbing"; document.getElementById("poseHint").style.opacity = "1"; }); node.addEventListener("pointermove", queueDragAngle); node.addEventListener("pointerup", () => { dragState.active = null; node.style.cursor = "grab"; }); node.addEventListener("pointercancel", () => { dragState.active = null; node.style.cursor = "grab"; }); });
function physics(config = {}) { Object.assign(physicsState, config); if (typeof config.enabled === "boolean") physicsState.enabled = config.enabled; return physicsState; }
function impulse({ x = 0, y = 0 } = {}) { physicsState.velocityX += x; physicsState.velocityY += y; }
function physicsTick(now) {
  const dt = Math.min(0.034, Math.max(0.001, (now - physicsState.lastTime) / 1000)); physicsState.lastTime = now;
  if (physicsState.enabled) {
    physicsState.velocityY += physicsState.gravity * dt * 60;
    physicsState.velocityX *= Math.pow(physicsState.damping, dt * 60);
    physicsState.velocityY *= Math.pow(physicsState.damping, dt * 60);
    bodyState.x += physicsState.velocityX * dt * 60;
    if (bodyState.y < 0 || physicsState.velocityY < 0) bodyState.y += physicsState.velocityY * dt * 60;
    if (bodyState.y >= 0 && physicsState.velocityY > 0) { bodyState.y = 0; physicsState.velocityY = -physicsState.velocityY * physicsState.bounce; if (Math.abs(physicsState.velocityY) < 0.25) physicsState.velocityY = 0; }
    render();
  }
  requestAnimationFrame(physicsTick);
}
requestAnimationFrame(physicsTick);
function easeInOutQuad(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
function tween(fromValues, toValues, duration, onUpdate) { return new Promise((resolve, reject) => { if (duration <= 0) { onUpdate(toValues); resolve(); return; } const start = performance.now(), adjustedDuration = duration / animationSpeed; function frame(now) { if (stopRequested) { reject(new Error("Stopped")); return; } const t = Math.min(1, (now - start) / adjustedDuration), eased = easeInOutQuad(t), current = {}; Object.keys(toValues).forEach((k) => current[k] = fromValues[k] + (toValues[k] - fromValues[k]) * eased); onUpdate(current); t >= 1 ? resolve() : requestAnimationFrame(frame); } requestAnimationFrame(frame); }); }
function wait(ms) { return new Promise((resolve, reject) => { const start = performance.now(), adjustedMs = ms / animationSpeed; function tick(now) { if (stopRequested) return reject(new Error("Stopped")); now - start >= adjustedMs ? resolve() : requestAnimationFrame(tick); } requestAnimationFrame(tick); }); }
function setJoints(target, duration = 400) { const from = { ...jointAngles }, to = { ...jointAngles, ...target }; return tween(from, to, duration, (vals) => { jointAngles = { ...jointAngles, ...vals }; render(); }); }
function setBody(target, duration = 400) { const from = { ...bodyState }, to = { ...bodyState, ...target }; if (typeof target.y === "number") physicsState.velocityY = 0; return tween(from, to, duration, (vals) => { bodyState = { ...bodyState, ...vals }; render(); }); }
function resetPose(duration = 300) { physicsState.velocityY = 0; physicsState.velocityX = 0; return Promise.all([setJoints({ ...REST_JOINTS }, duration), setBody({ ...REST_BODY }, duration)]); }
let keyframes = [];
const timelineTrack = document.getElementById("timelineTrack"), keyframeCount = document.getElementById("keyframeCount");
function updateTimeline() { keyframeCount.textContent = `${keyframes.length} keyframe${keyframes.length === 1 ? "" : "s"}`; timelineTrack.innerHTML = keyframes.length ? keyframes.map((_, index) => `<button class="keyframe-marker" data-keyframe="${index}" aria-label="Go to pose ${index + 1}">${index + 1}</button>`).join("") : `<span class="timeline-empty">Add poses from the stage to build a sequence.</span>`; timelineTrack.querySelectorAll("[data-keyframe]").forEach((marker) => marker.addEventListener("click", () => { const frame = keyframes[Number(marker.dataset.keyframe)]; jointAngles = { ...frame.joints }; bodyState = { ...frame.body }; physicsState.velocityY = 0; physicsState.velocityX = 0; render(); })); }
function addKeyframe() { keyframes.push({ joints: { ...jointAngles }, body: { ...bodyState } }); updateTimeline(); log(`Pose ${keyframes.length} captured.`, "ok"); }
async function playTimeline() { if (keyframes.length < 2 || running) return; running = true; setStatus("Timeline", "running"); try { for (let i = 1; i < keyframes.length; i++) { const frame = keyframes[i]; await Promise.all([setJoints(frame.joints, 420), setBody(frame.body, 420)]); } setStatus("Done", "done"); log("Timeline complete.", "ok"); } finally { running = false; } }
document.getElementById("addKeyframeBtn").addEventListener("click", addKeyframe); document.getElementById("playTimelineBtn").addEventListener("click", playTimeline); document.getElementById("clearTimelineBtn").addEventListener("click", () => { keyframes = []; updateTimeline(); log("Timeline cleared."); }); updateTimeline();

const consoleEl = document.getElementById("console"), logCount = document.getElementById("logCount"), statusPill = document.getElementById("statusPill"), statusText = document.getElementById("statusText"); let eventCount = 0;
function setStatus(label, state = "") { statusText.textContent = label; statusPill.className = `status-pill ${state}`; }
function log(msg, cls = "") { const line = document.createElement("p"); line.className = `line ${cls}`; line.textContent = msg; consoleEl.appendChild(line); consoleEl.scrollTop = consoleEl.scrollHeight; eventCount++; logCount.textContent = `${eventCount} event${eventCount === 1 ? "" : "s"}`; }
function clearLog() { consoleEl.innerHTML = ""; eventCount = 0; logCount.textContent = "0 events"; }
const runBtn = document.getElementById("runBtn"), stopBtn = document.getElementById("stopBtn"), resetBtn = document.getElementById("resetBtn"), codeInput = document.getElementById("codeInput"), languageSelect = document.getElementById("languageSelect");
const themeToggle = document.getElementById("themeToggle"), themeLabel = document.getElementById("themeLabel"), themeIcon = themeToggle.querySelector(".theme-icon");
function syncThemeControl() { const dark = document.documentElement.dataset.theme === "dark"; themeLabel.textContent = dark ? "Light mode" : "Dark mode"; themeIcon.textContent = dark ? "☀" : "☾"; themeToggle.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme"); }
themeToggle.addEventListener("click", () => { const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; document.documentElement.dataset.theme = next; localStorage.setItem("riglab-theme", next); syncThemeControl(); }); syncThemeControl();
const physicsToggle = document.getElementById("physicsToggle"), speedInput = document.getElementById("speedInput"), speedValue = document.getElementById("speedValue");
physicsToggle.addEventListener("change", () => { physicsState.enabled = physicsToggle.checked; if (!physicsToggle.checked) { physicsState.velocityY = 0; physicsState.velocityX = 0; } log(`Physics ${physicsToggle.checked ? "enabled" : "paused"}.`); });
speedInput.addEventListener("input", () => { animationSpeed = Number(speedInput.value); speedValue.textContent = `${animationSpeed.toFixed(1).replace(".0", "")}×`; });
function pythonToJavaScript(source) { return source.split("\n").map((line) => { const trimmed = line.trim(); if (!trimmed || trimmed.startsWith("#")) return trimmed.replace(/^#/, "//"); return trimmed.replace(/set_joints\s*\(/g, "await setJoints(").replace(/set_body\s*\(/g, "await setBody(").replace(/reset_pose\s*\(/g, "await resetPose(").replace(/sleep\s*\(/g, "await wait(").replace(/wait\s*\(/g, "await wait(").replace(/physics\s*\(/g, "physics(").replace(/impulse\s*\(/g, "impulse("); }).join("\n"); }
async function runUserCode() { if (running) return; stopRequested = false; running = true; runBtn.disabled = true; setStatus("Running", "running"); clearLog(); const source = languageSelect.value === "python" ? pythonToJavaScript(codeInput.value) : codeInput.value; log(`Executing ${languageSelect.value === "python" ? "Python" : "JavaScript"} controller…`); try { const factory = new Function("setJoints", "setBody", "wait", "resetPose", "physics", "impulse", `return (async () => {\n${source}\n})();`); await factory(setJoints, setBody, wait, resetPose, physics, impulse); log("Sequence complete.", "ok"); setStatus("Done", "done"); } catch (err) { if (err?.message === "Stopped") { log("Sequence stopped."); setStatus("Ready"); } else { log(`Error: ${err?.message || err}`, "error"); setStatus("Script error"); } } finally { running = false; runBtn.disabled = false; } }
runBtn.addEventListener("click", runUserCode); stopBtn.addEventListener("click", () => { if (running) { stopRequested = true; setStatus("Stopping", "running"); } }); resetBtn.addEventListener("click", () => { stopRequested = true; setTimeout(() => { stopRequested = false; resetPose(250); setStatus("Ready"); log("Pose reset.", "ok"); }, 0); });
codeInput.addEventListener("keydown", (event) => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") { event.preventDefault(); runUserCode(); } if (event.key === "Tab") { event.preventDefault(); const start = codeInput.selectionStart; codeInput.value = codeInput.value.slice(0, start) + "  " + codeInput.value.slice(codeInput.selectionEnd); codeInput.selectionStart = codeInput.selectionEnd = start + 2; } });
function autoGrowGutter() { const count = Math.max(16, codeInput.value.split("\n").length); document.querySelector(".editor-gutter").innerHTML = Array.from({ length: count }, (_, i) => `<span>${String(i + 1).padStart(2, "0")}</span>`).join(""); }
codeInput.addEventListener("input", autoGrowGutter);
const PRESETS = {
  wave: `// WAVE HELLO — now with a wrist flick\nawait setJoints({rightShoulder: 150,leftShoulder:-40,leftWrist:30, leftElbow:40, rightElbow: 40, rightWrist: -20 }, 400);\nfor (let i = 0; i < 3; i++) {\n  await setJoints({ rightElbow: 10, rightWrist: 30 }, 220);\n  await setJoints({ rightElbow: 50, rightWrist: -30 }, 220);\n}\nawait resetPose(400);`,
  walk: `// WALK CYCLE\nfor (let step = 0; step < 4; step++) {\n  await setJoints({ leftShoulder: -30, rightShoulder: 30,leftElbow:-40, rightElbow:-40, leftHip: 35, rightHip: -35, leftKnee: 10, rightKnee: 45, leftAnkle: -12, rightAnkle: 12 }, 480);\n  await setJoints({ leftShoulder: 30, rightShoulder: -30, leftHip: -35, rightHip: 35, leftKnee: 45, rightKnee: 10, leftAnkle: 12, rightAnkle: -12 }, 280);\n}\nawait resetPose(300);`,
  run: `// RUN CYCLE\nfor (let step = 0; step < 6; step++) {\n  await Promise.all([setJoints({ leftShoulder: -55, rightShoulder: 55, leftElbow: 70, rightElbow: 70, leftHip: 55, rightHip: -35, leftKnee: 15, rightKnee: 95, leftAnkle: -25, rightAnkle: 25 }, 160), setBody({ y: -14 }, 160)]);\n  await Promise.all([setJoints({ leftShoulder: 55, rightShoulder: -55, leftElbow: 70, rightElbow: 70, leftHip: -35, rightHip: 55, leftKnee: 95, rightKnee: 15, leftAnkle: 25, rightAnkle: -25 }, 160), setBody({ y: 0 }, 160)]);\n}\nawait resetPose(300);`,
  jump: `// JUMP — springy body + ground bounce\nphysics({ gravity: 0.16, bounce: 0.48, damping: 0.88 });\nawait setJoints({ leftKnee: 60, rightKnee: 60, leftAnkle: -20, rightAnkle: 20, leftShoulder: -20, rightShoulder: -20 }, 220);\nawait setBody({ y: 20 }, 220);\nawait impulse({ y: -3.5 });\nawait Promise.all([setJoints({ leftKnee: 0, rightKnee: 0, leftAnkle: 0, rightAnkle: 0, leftShoulder: -140, rightShoulder: -140 }, 260), setBody({ y: -90 }, 260)]);\nawait wait(220);\nawait resetPose(300);`,
  backflip: `// BACKFLIP — tuck the spine, then extend\nawait setJoints({ spine: 165, leftKnee: 60, rightKnee: 60, leftWrist: -30, rightWrist: 30 }, 200);\nawait setBody({ y: 20 }, 200);\nawait Promise.all([setBody({ y: -60, rot: -360 }, 620), setJoints({ spine: 205, leftKnee: 120, rightKnee: 120, leftHip: -30, rightHip: -30, leftShoulder: -60, rightShoulder: 60, leftElbow: 90, rightElbow: -90, leftAnkle: -30, rightAnkle: 30 }, 620)]);\nawait setJoints({ spine: 180, leftKnee: 30, rightKnee: 30 }, 200);\nawait setBody({ y: 0, rot: -360 }, 200);\nawait setBody({ rot: 0 }, 0);\nawait resetPose(300);`
};
const presetSelect = document.getElementById("presetSelect"); document.getElementById("loadPresetBtn").addEventListener("click", () => { const key = presetSelect.value; if (PRESETS[key]) { codeInput.value = PRESETS[key]; autoGrowGutter(); codeInput.focus(); log(`${presetSelect.options[presetSelect.selectedIndex].text} loaded.`); } });
const PYTHON_SAMPLE = `# WAVE HELLO — Python command mode\nset_joints({"rightShoulder": 150,"leftShoulder":-40,"leftWrist":30, "leftElbow":40, "rightElbow": 40, "rightWrist": -20}, 400)\nset_joints({"rightElbow": 10, "rightWrist": 30}, 220)\nset_joints({"rightElbow": 50, "rightWrist": -30}, 220)\nset_joints({"rightElbow": 10, "rightWrist": 30}, 220)\nset_joints({"rightElbow": 50, "rightWrist": -30}, 220)\nreset_pose(400)`;
languageSelect.addEventListener("change", () => { codeInput.value = languageSelect.value === "python" ? PYTHON_SAMPLE : PRESETS.wave; autoGrowGutter(); log(`${languageSelect.options[languageSelect.selectedIndex].text} mode selected.`); });
document.querySelectorAll(".insert-chip").forEach((chip) => chip.addEventListener("click", () => { const snippet = chip.dataset.snippet; const start = codeInput.selectionStart; codeInput.value = codeInput.value.slice(0, start) + snippet + codeInput.value.slice(codeInput.selectionEnd); codeInput.selectionStart = codeInput.selectionEnd = start + snippet.length; autoGrowGutter(); codeInput.focus(); }));
codeInput.value = PRESETS.wave; autoGrowGutter(); log("Ready. Load a sample or write your own.");
