// Sinal em 3D: um boneco executa o sinal BONITO ao lado da escrita em ELiS.
// A pose é calculada a partir de um único número, o percurso (0 = mão aberta diante do rosto, 1 = mão fechada no queixo).
// Os textos ficam no HTML; este script só troca estados. A página pode ser a do estudo (sinal.html) ou o guia.
// O three.js só é baixado quando o quadro se aproxima da tela.
let THREE;
const T = window.T || (text => text);

const stage = document.querySelector('#sinal-stage');
const canvas = document.querySelector('#sinal-canvas');
const range = document.querySelector('#sinal-progress');
const percent = document.querySelector('#sinal-percent');
const play = document.querySelector('#sinal-play');
const speed = document.querySelector('#sinal-speed');
const reading = document.querySelector('#sinal-leitura');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

const DURATION = 2000; // ms em 1×; o vídeo de referência faz o sinal em cerca de 1 s.
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (x, a, b) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const rad = degrees => degrees * Math.PI / 180;

// ---------- Pose do sinal ----------
// Eixos do mundo: o boneco olha para +Z; a direita dele é -X; +Y é para cima.
// Dedos na ordem: indicador, médio, anelar, mínimo. Fecham do mínimo para o indicador, como no vídeo.
const CURL_WINDOWS = [[0.36, 0.72], [0.27, 0.62], [0.18, 0.52], [0.09, 0.42]];
function signPose(p) {
  const curls = CURL_WINDOWS.map(([a, b]) => smooth(p, a, b));
  const turn = smooth(p, 0.04, 0.62); // a mão gira: dedos para cima → dedos para o lado, polegar para cima
  const down = smooth(p, 0.55, 1); // depois desce do nariz ao queixo
  const angle = rad(lerp(22, 90, turn));
  const fingers = new THREE.Vector3(Math.sin(angle), Math.cos(angle), 0);
  const palm = new THREE.Vector3(0, 0, -1); // palma para trás: voltada para quem sinaliza
  const center = new THREE.Vector3(lerp(-0.045, 0.005, turn), lerp(lerp(1.6, 1.59, turn), 1.43, down), lerp(0.215, 0.2, turn));
  return { curls, thumb: turn, fingers, palm, center };
}
function handState(p) {
  const closed = CURL_WINDOWS.reduce((sum, [a, b]) => sum + smooth(p, a, b), 0) / 4;
  return closed < 0.01 ? 'aberta' : closed > 0.99 ? 'fechada' : 'fechando';
}

// ---------- Controles (funcionam mesmo sem WebGL) ----------
let progress = 0, playing = false, last = 0, dirty = true;
function setProgress(p, fromRange = false) {
  progress = clamp(p, 0, 1);
  const value = Math.round(progress * 100);
  if (range && !fromRange) range.value = String(value);
  if (percent) percent.textContent = `${value}%`;
  range?.setAttribute('aria-valuetext', `${value}%`);
  stage.dataset.mao = handState(progress);
  dirty = true;
}
function setPlaying(on) {
  playing = on;
  last = 0;
  play.setAttribute('aria-pressed', String(on));
  play.textContent = T(on ? play.dataset.pause : play.dataset.play);
}
play.addEventListener('click', () => {
  if (!playing && progress >= 1) setProgress(0);
  setPlaying(!playing);
});
document.querySelector('#sinal-restart')?.addEventListener('click', () => { setPlaying(false); setProgress(0); });
range?.addEventListener('input', () => { setPlaying(false); setProgress(Number(range.value) / 100, true); });
document.addEventListener('visibilitychange', () => { if (document.hidden) setPlaying(false); });

// Na página do estudo, as etapas da escrita são deste script; no guia, são do guide.js.
const tabs = [...document.querySelectorAll('.sinal-tabs button')];
function showStep(n) {
  tabs.forEach(tab => tab.setAttribute('aria-pressed', String(Number(tab.dataset.step) === n)));
  document.querySelectorAll('.sinal-word [data-part]').forEach(part => part.classList.toggle('active', Number(part.dataset.part) === n));
  reading.textContent = tabs[n].dataset.texto;
}
tabs.forEach(tab => tab.addEventListener('click', () => showStep(Number(tab.dataset.step))));
if (tabs.length) showStep(0);
// A etapa Movimento executa o sinal; as outras mostram a mão aberta, que é o que elas descrevem.
const movement = document.querySelector('[data-step="3"]');
if (movement) {
  let wasOn = movement.getAttribute('aria-pressed') === 'true';
  new MutationObserver(() => {
    const on = movement.getAttribute('aria-pressed') === 'true';
    if (on === wasOn) return;
    wasOn = on;
    setPlaying(false);
    if (!on) setProgress(0);
    else if (reducedMotion.matches) setProgress(1);
    else { setProgress(0); setPlaying(true); }
  }).observe(movement, { attributes: true, attributeFilter: ['aria-pressed'] });
}

// ---------- Câmera ----------
const VIEWS = {
  frente: { az: 0, el: 0.04, dist: 2.05, target: [-0.03, 1.36, 0] },
  perfil: { az: -1.25, el: 0.04, dist: 2.05, target: [0, 1.4, 0.05] },
  mao: { az: -0.55, el: 0.08, dist: 0.95, target: [-0.03, 1.54, 0.16] },
};
const cam = { az: 0, el: 0.04, dist: 2.05, target: [-0.03, 1.36, 0] };
const goal = { az: 0, el: 0.04, dist: 2.05, target: [-0.03, 1.36, 0] };
const viewButtons = [...document.querySelectorAll('[data-vista-alvo]')];
function markView(name) {
  stage.dataset.vista = name;
  stage.dataset.giro = goal.az.toFixed(2);
  viewButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.vistaAlvo === name)));
  dirty = true;
}
function setView(name) {
  const view = VIEWS[name];
  Object.assign(goal, { az: view.az, el: view.el, dist: view.dist });
  goal.target = [...view.target];
  markView(name);
}
function orbit(az, el, zoom = 1) {
  goal.az += az;
  goal.el = clamp(goal.el + el, -0.5, 1.1);
  goal.dist = clamp(goal.dist * zoom, 0.55, 3.2);
  markView('livre');
}
viewButtons.forEach(button => button.addEventListener('click', () => setView(button.dataset.vistaAlvo)));

let drag = null;
canvas.addEventListener('pointerdown', event => { drag = { x: event.clientX, y: event.clientY }; canvas.setPointerCapture(event.pointerId); });
canvas.addEventListener('pointermove', event => {
  if (!drag) return;
  orbit(-(event.clientX - drag.x) * 0.008, (event.clientY - drag.y) * 0.006);
  drag = { x: event.clientX, y: event.clientY };
});
for (const type of ['pointerup', 'pointercancel']) canvas.addEventListener(type, () => { drag = null; });
canvas.addEventListener('wheel', event => { event.preventDefault(); orbit(0, 0, Math.exp(event.deltaY * 0.0012)); }, { passive: false });
canvas.addEventListener('keydown', event => {
  const moves = { ArrowLeft: [-0.15, 0], ArrowRight: [0.15, 0], ArrowUp: [0, 0.1], ArrowDown: [0, -0.1], '+': [0, 0, 0.88], '=': [0, 0, 0.88], '-': [0, 0, 1.14] };
  const move = moves[event.key];
  if (!move) return;
  event.preventDefault();
  orbit(...move);
});

// ---------- Boneco ----------
// Personagem: mulher de cabelo grisalho cacheado, óculos redondos, argolas e blusa preta sem mangas, feita de formas simples.
const SKIN = 0xe9b592, TOP = 0x1d1d20, HAIR = 0xbfbcb9, FRAME = 0x57525e, BROW = 0x7b6a5f;
const material = (color, roughness = 0.72) => new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
// Sorteio com semente fixa: os cachos saem iguais em toda visita.
function seeded(seed) {
  return () => {
    seed = seed + 0x6d2b79f5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function buildFigure(scene) {
  const UP = new THREE.Vector3(0, 1, 0);
  const skin = material(SKIN), shirt = material(TOP, 0.9), hair = material(HAIR, 0.95), frame = material(FRAME, 0.45);
  const add = (geometry, mat, position, scale, parent = scene) => {
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(...position);
    if (scale) mesh.scale.set(...scale);
    parent.add(mesh);
    return mesh;
  };
  const sphere = new THREE.SphereGeometry(1, 40, 28);

  // Tronco: blusa sem mangas, com os ombros e o colo à mostra.
  const profile = [[0, 0.56], [0.165, 0.6], [0.18, 0.8], [0.182, 1], [0.188, 1.14], [0.19, 1.26], [0.178, 1.33], [0.145, 1.375], [0.1, 1.395], [0.05, 1.4], [0, 1.4]];
  add(new THREE.LatheGeometry(new THREE.SplineCurve(profile.map(([r, y]) => new THREE.Vector2(r, y))).getPoints(48), 48), shirt, [0, 0, 0], [1, 1, 0.62]);
  const yoke = add(new THREE.CapsuleGeometry(0.05, 0.27, 8, 24), skin, [0, 1.34, -0.005]);
  yoke.rotation.z = Math.PI / 2;
  add(sphere, skin, [0, 1.385, 0.05], [0.085, 0.045, 0.06]);
  add(new THREE.CylinderGeometry(0.042, 0.05, 0.14, 24), skin, [0, 1.46, 0]);

  // Cabeça
  const head = new THREE.Group();
  head.position.set(0, 1.63, 0);
  scene.add(head);
  add(sphere, skin, [0, 0, 0], [0.105, 0.128, 0.112], head);
  add(sphere, material(0xdfa684), [0, -0.022, 0.111], [0.015, 0.018, 0.017], head);
  const smile = add(new THREE.TorusGeometry(0.03, 0.0034, 8, 24, Math.PI * 0.62), material(0xb4564d, 0.5), [0, -0.05, 0.097], null, head);
  smile.rotation.z = Math.PI + Math.PI * 0.19;
  const ring = new THREE.TorusGeometry(0.0275, 0.003, 10, 40), hoop = new THREE.TorusGeometry(0.014, 0.0026, 8, 28);
  const white = material(0xf6f3ee, 0.4), iris = material(0x4c5fc4, 0.4), pupil = material(0x1b1b22, 0.3), silver = new THREE.MeshStandardMaterial({ color: 0xd8dade, roughness: 0.3, metalness: 0.6 });
  const stick = (a, b, radius, mat) => {
    const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b);
    const mesh = add(new THREE.CapsuleGeometry(radius, from.distanceTo(to), 4, 8), mat, [0, 0, 0], null, head);
    mesh.position.lerpVectors(from, to, 0.5);
    mesh.quaternion.setFromUnitVectors(UP, to.sub(from).normalize());
  };
  for (const side of [-1, 1]) {
    add(sphere, skin, [side * 0.103, -0.012, -0.004], [0.015, 0.028, 0.02], head);
    add(sphere, white, [side * 0.041, 0.012, 0.094], [0.0175, 0.0135, 0.009], head);
    add(sphere, iris, [side * 0.041, 0.012, 0.1], [0.0088, 0.0088, 0.005], head);
    add(sphere, pupil, [side * 0.041, 0.012, 0.1035], [0.0042, 0.0042, 0.003], head);
    stick([side * 0.024, 0.047, 0.103], [side * 0.058, 0.049, 0.096], 0.0034, material(BROW, 0.8));
    add(ring, frame, [side * 0.041, 0.012, 0.11], null, head);
    stick([side * 0.068, 0.016, 0.106], [side * 0.106, 0.012, 0.012], 0.0022, frame);
    const earring = add(hoop, silver, [side * 0.109, -0.058, 0.004], null, head);
    earring.rotation.y = side * 0.9;
  }
  stick([-0.0135, 0.018, 0.111], [0.0135, 0.018, 0.111], 0.0024, frame);

  // Cabelo: uma calota e cachos espalhados até os ombros; o rosto e as argolas ficam livres.
  const cap = add(new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, 1.5), hair, [0, 0.004, -0.012], [0.111, 0.134, 0.12], head);
  cap.rotation.x = -0.42;
  const curl = new THREE.SphereGeometry(1, 14, 10), random = seeded(7);
  const ROWS = 13, COLUMNS = 20;
  for (let row = 0; row < ROWS; row++) {
    for (let column = 0; column < COLUMNS; column++) {
      const y = lerp(0.128, -0.215, (row + random() * 0.8) / ROWS);
      const turn = (column + (row % 2) / 2 + random() * 0.6) / COLUMNS * Math.PI * 2; // 0 = frente
      const front = Math.abs(Math.atan2(Math.sin(turn), Math.cos(turn)));
      if (y < 0.092 && front < rad(y > -0.02 ? 58 : 64)) continue;
      const shell = y > 0 ? 0.108 * Math.sqrt(Math.max(0.05, 1 - (y / 0.14) ** 2)) + 0.006 : lerp(0.114, 0.172, smooth(-y, 0, 0.17));
      const size = lerp(0.024, 0.038, random()) * (y < -0.1 ? 1.1 : y > 0.06 ? 0.72 : 1);
      add(curl, hair, [Math.sin(turn) * shell * 0.97, y, Math.cos(turn) * shell - 0.006], [size, size * lerp(0.85, 1.1, random()), size], head);
    }
  }

  // Braços: o ombro é fixo, o punho segue a pose e o cotovelo sai por cinemática inversa.
  const UPPER = 0.265, FORE = 0.245;
  function buildArm(side) {
    const shoulder = new THREE.Vector3(side * 0.182, 1.335, 0);
    add(sphere, skin, shoulder.toArray(), [0.058, 0.058, 0.058]);
    const upper = add(new THREE.CapsuleGeometry(0.04, UPPER, 6, 16), skin, [0, 0, 0]);
    const fore = add(new THREE.CapsuleGeometry(0.034, FORE, 6, 16), skin, [0, 0, 0]);
    const hand = buildHand(side);
    scene.add(hand.group);
    const between = (mesh, a, b, t = 0.5) => {
      mesh.position.lerpVectors(a, b, t);
      mesh.quaternion.setFromUnitVectors(UP, b.clone().sub(a).normalize());
    };
    const elbow = new THREE.Vector3(), basis = new THREE.Matrix4();
    return {
      hand,
      // wrist: posição do punho; fingers/palm: direções da mão (unitárias e perpendiculares); pole: para onde o cotovelo aponta.
      place(wrist, fingers, palm, pole) {
        const reach = wrist.clone().sub(shoulder);
        const d = clamp(reach.length(), Math.abs(UPPER - FORE) + 0.01, UPPER + FORE - 0.005);
        const dir = reach.normalize();
        const along = (UPPER * UPPER - FORE * FORE + d * d) / (2 * d);
        const out = Math.sqrt(Math.max(0, UPPER * UPPER - along * along));
        const bend = pole.clone().addScaledVector(dir, -pole.dot(dir)).normalize();
        elbow.copy(shoulder).addScaledVector(dir, along).addScaledVector(bend, out);
        const end = shoulder.clone().addScaledVector(dir, d);
        between(upper, shoulder, elbow);
        between(fore, elbow, end);
        hand.group.position.copy(end);
        const across = fingers.clone().cross(palm);
        hand.group.quaternion.setFromRotationMatrix(basis.makeBasis(across, fingers, palm));
      },
    };
  }

  // Mão em eixos próprios: +Y ao longo dos dedos, +Z para fora da palma, +X no lado do polegar (mão direita).
  function buildHand(side) {
    const group = new THREE.Group();
    group.scale.x = -side; // a esquerda é a direita espelhada
    add(new THREE.CapsuleGeometry(0.041, 0.034, 8, 20), skin, [0, 0.056, 0], [1, 1, 0.42], group);
    const chain = (lengths, radius, origin) => {
      const joints = [];
      let parent = group;
      lengths.forEach((length, i) => {
        const joint = new THREE.Group();
        joint.position.set(...(i ? [0, lengths[i - 1], 0] : origin));
        parent.add(joint);
        add(new THREE.CapsuleGeometry(radius * (1 - i * 0.07), length, 4, 12), skin, [0, length / 2, 0], null, joint);
        joints.push(joint);
        parent = joint;
      });
      return joints;
    };
    const fingers = [
      { joints: chain([0.036, 0.023, 0.018], 0.0098, [0.03, 0.098, 0]), splay: -12 },
      { joints: chain([0.04, 0.026, 0.019], 0.01, [0.0105, 0.104, 0]), splay: -3 },
      { joints: chain([0.037, 0.024, 0.018], 0.0096, [-0.0095, 0.1, 0]), splay: 7 },
      { joints: chain([0.029, 0.018, 0.015], 0.0086, [-0.028, 0.09, 0]), splay: 17 },
    ];
    const thumb = chain([0.04, 0.03, 0.025], 0.0148, [0.02, 0.022, 0.007]);
    add(sphere, skin, [0.021, 0.04, 0.009], [0.021, 0.03, 0.017], group); // base do polegar
    return {
      group,
      // curls: 0 = dedo estendido, 1 = dedo fechado; thumb: 0 = polegar aberto para o lado, 1 = polegar "para cima" ao lado do punho fechado.
      pose(curls, thumbTurn, relax = 0) {
        fingers.forEach((finger, i) => {
          const c = Math.max(curls[i], relax);
          finger.joints[0].rotation.set(rad(88) * c, 0, rad(finger.splay) * (1 - c));
          finger.joints[1].rotation.x = rad(104) * c;
          finger.joints[2].rotation.x = rad(72) * c;
        });
        thumb[0].rotation.set(rad(lerp(10, 8, thumbTurn)), 0, rad(lerp(-36, -32, thumbTurn)));
        thumb[1].rotation.set(0, 0, rad(lerp(-16, -50, thumbTurn)));
        thumb[2].rotation.set(0, 0, rad(lerp(4, -7, thumbTurn)));
      },
    };
  }

  const right = buildArm(-1), left = buildArm(1);
  // Braço esquerdo em repouso ao lado do corpo.
  left.place(new THREE.Vector3(0.225, 0.84, 0.04), new THREE.Vector3(0, -1, 0), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0.4, 0, -1));
  left.hand.pose([0, 0, 0, 0], 0.3, 0.22);
  const pole = new THREE.Vector3(-0.55, -1, 0.3);
  return p => {
    const pose = signPose(p);
    const wrist = pose.center.clone().addScaledVector(pose.fingers, -0.056);
    right.place(wrist, pose.fingers, pose.palm, pole);
    right.hand.pose(pose.curls, pose.thumb);
  };
}

// ---------- Cena ----------
function start() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.05, 20);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8f9aa6, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.9);
  key.position.set(-1.2, 2.6, 2.4);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xdfe8f2, 0.5);
  fill.position.set(2, 1, -1);
  scene.add(fill);
  const applyPose = buildFigure(scene);
  const look = new THREE.Vector3();

  function resize() {
    const { width, height } = stage.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Em telas estreitas a câmera recua para o boneco continuar inteiro no quadro.
    camera.zoom = Math.min(1, camera.aspect / 0.95);
    camera.updateProjectionMatrix();
    dirty = true;
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  function frame(now) {
    requestAnimationFrame(frame);
    if (playing) {
      // Um quadro lento atrasa o sinal em vez de pular um trecho dele.
      const step = last ? Math.min(now - last, 50) : 0;
      last = now;
      setProgress(progress + step / DURATION * Number(speed?.value ?? 1));
      if (progress >= 1) setPlaying(false);
    }
    const k = reducedMotion.matches ? 1 : 0.16;
    const moving = Math.abs(goal.az - cam.az) + Math.abs(goal.el - cam.el) + Math.abs(goal.dist - cam.dist) + Math.hypot(...goal.target.map((v, i) => v - cam.target[i])) > 0.0005;
    if (moving) {
      cam.az = lerp(cam.az, goal.az, k); cam.el = lerp(cam.el, goal.el, k); cam.dist = lerp(cam.dist, goal.dist, k);
      cam.target = cam.target.map((v, i) => lerp(v, goal.target[i], k));
      dirty = true;
    }
    if (!dirty) return;
    dirty = false;
    applyPose(progress);
    camera.position.set(Math.sin(cam.az) * Math.cos(cam.el), Math.sin(cam.el), Math.cos(cam.az) * Math.cos(cam.el)).multiplyScalar(cam.dist).add(look.fromArray(cam.target));
    camera.lookAt(look);
    renderer.render(scene, camera);
    stage.dataset.render = 'webgl';
  }
  requestAnimationFrame(frame);
}

setProgress(0);
function fallback() {
  // Sem WebGL: a leitura da escrita e os controles continuam funcionando.
  stage.dataset.render = 'indisponivel';
  document.querySelector('#sinal-fallback').hidden = false;
  let previous = 0;
  const tick = now => {
    requestAnimationFrame(tick);
    if (!playing) { previous = 0; return; }
    setProgress(progress + (previous ? now - previous : 0) / DURATION * Number(speed?.value ?? 1));
    previous = now;
    if (progress >= 1) setPlaying(false);
  };
  requestAnimationFrame(tick);
}
new IntersectionObserver((entries, observer) => {
  if (!entries.some(entry => entry.isIntersecting)) return;
  observer.disconnect();
  import('./vendor/three.module.min.js').then(module => { THREE = module; start(); }).catch(fallback);
}, { rootMargin: '600px' }).observe(stage);
