// FireflyClear's shared parts: the light model (spectrum, colour, quantum yield, energy share against
// lamps), the flash-switch model (nerve → nitric oxide → mitochondria → oxygen → light), a coupled-
// oscillator synchrony model, a procedural Photinus-like firefly, glow sprites, and the layout and
// chart-board helpers the chapters use (the same ones as JellyfishClear and ChameleonClear).
//
// Light model, with sources:
//  - Reaction (firefly luciferase, EC 1.13.12.7): luciferin + ATP (with Mg²⁺) → luciferyl adenylate +
//    PPi; luciferyl adenylate + O₂ → dioxetanone → oxyluciferin* + CO₂ + AMP; oxyluciferin* → light.
//    ExPASy ENZYME 1.13.12.7 says the dioxetanone's breakdown releases about 50 kcal/mol, the energy
//    needed to make the excited oxyluciferin. A 560 nm photon carries 1240/560 = 2.21 eV = 51 kcal/mol.
//  - Colour: yellow-green, about 560 nm for Photinus pyralis luciferase; firefly light across species
//    runs about 510–670 nm (Wikipedia "Firefly"). Lower pH, higher temperature and some metal ions turn
//    the light red (Sci Rep 2013, srep02490). In that study a luciferase's peak moved from about 566 nm
//    at pH 8 to 612 nm at pH 6, because the green component (~560 nm) weakens while the red (~610 nm)
//    stays. We draw the spectrum as these two bands mixed by a logistic in pH whose midpoint creeps up
//    with temperature: a labelled toy shaped to match those numbers, not a fit.
//  - Quantum yield: 41.0 ± 7.4% at best (Ando et al. 2008, Nature Photonics 2: 44), revising 88 ± 25%
//    (Seliger & McElroy 1959–60). Ando et al. also saw the yield fall as the light turns red; we let the
//    toy yield fall from 41% (green) towards 15% (red). The 15% is illustrative, not a measured value.
//  - Lamps (computed here from spectra, not copied): a 60 W incandescent bulb gives about 800 lm (PNNL
//    Building America, "high efficacy lighting"); DOE says incandescent bulbs give off about 90% of their
//    energy as heat. White LEDs about 120 lm/W, the figure RingLightClear uses. Share of power leaving
//    as visible light = efficacy ÷ (lumens per visible watt of that lamp's spectrum), with the CIE 1931
//    ȳ curve × 683 lm/W. Bulb: 2,700 K blackbody. LED: 450 nm blue chip + broad yellow phosphor.
import { THREE, M, clamp, smooth, beam } from './kit.js';

export const TAU = Math.PI * 2;

// ---------------------------------------------------------------- spectra and colour (as in ChameleonClear)
const L0 = 380, L1 = 730, DL = 5, NL = (L1 - L0) / DL + 1;
export const LAMBDAS = Array.from({ length: NL }, (_, i) => L0 + i * DL);
const g = (x, mu, s1, s2) => { const t = (x - mu) / (x < mu ? s1 : s2); return Math.exp(-0.5 * t * t); };
// CIE 1931 colour-matching functions, analytic fit of Wyman, Sloan & Shirley 2013 (JCGT 2(2)).
const CMF = LAMBDAS.map((l) => [
  1.056 * g(l, 599.8, 37.9, 31.0) + 0.362 * g(l, 442.0, 16.0, 26.7) - 0.065 * g(l, 501.1, 20.4, 26.2),
  0.821 * g(l, 568.8, 46.9, 40.5) + 0.286 * g(l, 530.9, 16.3, 31.1),
  1.217 * g(l, 437.0, 11.8, 36.0) + 0.681 * g(l, 459.0, 26.0, 13.8),
]);
const gam = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
function xyzRgb([X, Y, Z]) {
  let r = 3.2406 * X - 1.5372 * Y - 0.4986 * Z, gg = -0.9689 * X + 1.8758 * Y + 0.0415 * Z, b = 0.0557 * X - 0.204 * Y + 1.057 * Z;
  const mn = Math.min(r, gg, b); if (mn < 0) { r -= mn; gg -= mn; b -= mn; }
  const mx = Math.max(r, gg, b) || 1;
  return [r, gg, b].map((c) => clamp(gam(c / mx), 0, 1));
}
// The colour of pure light of one wavelength.
export function lambdaRgb(l) { const i = clamp(Math.round((l - L0) / DL), 0, NL - 1); return xyzRgb(CMF[i]); }
// The colour of a light source with spectrum S (an array over LAMBDAS), at full brightness.
export function emitRgb(S) { const xyz = [0, 0, 0]; S.forEach((v, i) => { for (let k = 0; k < 3; k++) xyz[k] += v * CMF[i][k]; }); return xyzRgb(xyz); }
export const css = (rgb, a = 1) => `rgba(${rgb.map((c) => Math.round(c * 255)).join(',')},${a})`;
export const hex = (rgb) => (Math.round(rgb[0] * 255) << 16) | (Math.round(rgb[1] * 255) << 8) | Math.round(rgb[2] * 255);
export const bandName = (l) => (l < 450 ? 'violet' : l < 495 ? 'blue' : l < 545 ? 'green' : l < 570 ? 'yellow-green' : l < 590 ? 'yellow' : l < 620 ? 'orange' : 'red');

// ---------------------------------------------------------------- the firefly's light
export const QY_MAX = 0.41, QY_OLD = 0.88, E_RELEASED_EV = 2.17;   // Ando 2008; Seliger & McElroy; ExPASy (~50 kcal/mol)
export const LAMBDA_GREEN = 560, LAMBDA_RED = 612;
export function greenShare(pH = 7.8, T = 25) { const mid = 6.7 + 0.04 * (T - 25); return 1 / (1 + Math.exp(-(pH - mid) / 0.3)); }
export function fireflySpectrum(pH = 7.8, T = 25) {
  const w = greenShare(pH, T);
  return LAMBDAS.map((l) => w * g(l, LAMBDA_GREEN, 22, 27) + (1 - w) * 0.8 * g(l, LAMBDA_RED + 3, 30, 40));
}
export function lightOf(pH = 7.8, T = 25) {
  const S = fireflySpectrum(pH, T), w = greenShare(pH, T);
  let pk = 0, pl = 560; S.forEach((v, i) => { if (v > pk) { pk = v; pl = LAMBDAS[i]; } });
  const qy = QY_MAX * (w + 0.37 * (1 - w));                 // toy: 41% green → about 15% red
  const eV = 1240 / pl;
  return { S, peak: pl, rgb: emitRgb(S), qy, eV, share: qy * Math.min(1, eV / E_RELEASED_EV), green: w };
}

// ---------------------------------------------------------------- lamps compared
const planck = (l, T) => { const x = l * 1e-9; return 1 / (x ** 5 * (Math.exp(1.4388e-2 / (x * T)) - 1)); };
const lmPerVisW = (S) => 683 * S.reduce((a, v, i) => a + v * CMF[i][1], 0) / S.reduce((a, v) => a + v, 0);
export const BULB_SPEC = LAMBDAS.map((l) => planck(l, 2700));
export const LED_SPEC = LAMBDAS.map((l) => 0.55 * g(l, 450, 9, 11) + g(l, 565, 45, 60));
export const LAMPS = (() => {
  const bulbEff = 800 / 60, ledEff = 120;
  return {
    bulb: { name: 'Old filament bulb (60 W)', eff: bulbEff, share: bulbEff / lmPerVisW(BULB_SPEC), rgb: emitRgb(BULB_SPEC) },
    led: { name: 'White LED (120 lm/W)', eff: ledEff, share: ledEff / lmPerVisW(LED_SPEC), rgb: emitRgb(LED_SPEC) },
  };
})();

// ---------------------------------------------------------------- the flash switch (labelled toy model)
// After Trimmer et al. 2001 (Science 292: 2486): the nerve releases octopamine onto the tracheal end
// cells, which make nitric oxide (NO). NO briefly blocks respiration in the mitochondria that ring each
// photocyte, so oxygen that they would have used up reaches the luciferase deeper in the cell, and the
// lantern flashes. Bright light reverses NO's block on lantern mitochondria (reported in follow-up work
// by Aprille and colleagues), which helps end the flash. Timmins et al. 2001 (J Exp Biol 204: 2795)
// showed with extra oxygen that the dark lantern is held dark by lack of oxygen. Time constants are
// chosen to give a flash of a few tenths of a second, as P. pyralis males make; they are not measured.
export class FlashCell {
  constructor() { this.nerve = 0; this.no = 0; this.o2 = 0.05; this.ready = 1; this.light = 0; }
  pulse(k = 1) { this.nerve = Math.min(1.5, this.nerve + k); }
  step(dt, { air = 1, noOn = true } = {}) {
    dt = Math.max(0, Math.min(0.05, dt));
    const n = 8;                                  // sub-steps for stability
    for (let i = 0; i < n; i++) {
      const h = dt / n;
      this.nerve += -this.nerve / 0.04 * h;
      const make = noOn ? 30 * this.nerve : 0;
      this.no += (make - this.no / 0.1 - 6 * this.light * this.no) * h;
      this.no = Math.max(0, this.no);
      const block = this.no * this.no / (this.no * this.no + 0.09);            // share of mitochondrial respiration blocked
      // Mitochondria can use up to 0.97 of the normal oxygen supply; whatever they leave reaches the
      // luciferase. Extra oxygen (hyperoxia) overwhelms them, which is why Timmins et al. saw a steady glow.
      const target = Math.max(0.03 * air, air - 0.97 * (1 - block));
      this.o2 += (target - this.o2) / 0.035 * h;
      const burn = this.o2 * this.ready;
      this.light = burn;
      this.ready += ((1 - this.ready) / 0.6 - 1.2 * burn) * h;
      this.ready = clamp(this.ready, 0, 1);
    }
    return this.light;
  }
}

// ---------------------------------------------------------------- synchrony (Kuramoto model)
// dθᵢ/dt = ωᵢ + (K/N) Σⱼ sin(θⱼ − θᵢ). Each firefly flashes when its phase wraps past 2π. Real fireflies
// see neighbours' flashes as pulses (Mirollo & Strogatz 1990 model that); Kuramoto (1975) is the smooth
// textbook version. Natural period 0.56 s after Pteroptyx malaccae at 28 °C (Buck & Buck 1968), with each
// insect a few per cent faster or slower.
export class Swarm {
  constructor(N = 40, seed = 1) { this.reset(N, seed); }
  reset(N, seed = 1) {
    let s = seed * 9301 + 49297; const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    this.N = N; this.th = []; this.w = []; this.fl = []; this.last = [];
    for (let i = 0; i < N; i++) { this.th.push(rnd() * TAU); this.w.push(TAU / 0.56 * (1 + 0.07 * (rnd() * 2 - 1) * 1.7)); this.fl.push(0); this.last.push(-9); }
    this.t = 0; this.r = 0;
  }
  step(dt, K) {
    dt = Math.max(0, Math.min(0.05, dt));
    const n = 4, N = this.N;
    for (let k = 0; k < n; k++) {
      const h = dt / n; let C = 0, S = 0;
      for (let i = 0; i < N; i++) { C += Math.cos(this.th[i]); S += Math.sin(this.th[i]); }
      C /= N; S /= N;
      this.r = Math.hypot(C, S); const psi = Math.atan2(S, C);
      this.t += h;
      for (let i = 0; i < N; i++) {
        const before = this.th[i];
        this.th[i] += (this.w[i] + K * this.r * Math.sin(psi - this.th[i])) * h;
        if (this.th[i] >= TAU) { this.th[i] -= TAU; this.last[i] = this.t; }
        else if (before < 0 && this.th[i] >= 0) this.last[i] = this.t;
      }
    }
    for (let i = 0; i < N; i++) { const a = this.t - this.last[i]; this.fl[i] = 0.08 + 0.92 * (a < 0 ? 0 : Math.exp(-a / 0.09)); }
    return this.r;
  }
}

// ---------------------------------------------------------------- glow sprites
// Each call makes its own texture so the stage can dispose it with the chapter.
export function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const gx = c.getContext('2d'), gr = gx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.18, 'rgba(255,255,255,.75)'); gr.addColorStop(0.45, 'rgba(255,255,255,.18)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  gx.fillStyle = gr; gx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function glowSprite(tex, color = 0xd8ff5a, size = 1) {
  const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  m.scale.setScalar(size); m.renderOrder = 5; return m;
}
// Many glowing dots in one draw call: Points with per-point colour, additive.
export function glowPoints(n, tex, size = 0.35) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const mat = new THREE.PointsMaterial({ size, map: tex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, toneMapped: false });
  const p = new THREE.Points(geo, mat); p.frustumCulled = false; p.renderOrder = 6;
  p.set = (i, x, y, z, rgb, k) => {
    const a = geo.attributes.position.array, c = geo.attributes.color.array;
    a[i * 3] = x; a[i * 3 + 1] = y; a[i * 3 + 2] = z; c[i * 3] = rgb[0] * k; c[i * 3 + 1] = rgb[1] * k; c[i * 3 + 2] = rgb[2] * k;
  };
  p.done = () => { geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true; };
  return p;
}
export const FLY_GREEN = lightOf(7.8, 25).rgb;        // the normal yellow-green, as screen colour
export const FLY_HEX = hex(FLY_GREEN);

// ---------------------------------------------------------------- a procedural Photinus-like firefly
// Body along +X (head forward), back up (+Y). About 3.2 units long for a 12 mm beetle. Parts after the
// common eastern firefly Photinus pyralis: a pale pronotum (head shield) with a dark centre spot and pink
// patches hiding the head, dark wing covers (elytra) with pale edges, folded hind wings, a soft abdomen
// whose last two segments underneath carry the pale lantern.
function ell(rx, ry, rz, mat, seg = 28) { const m = new THREE.Mesh(new THREE.SphereGeometry(1, seg, Math.round(seg * 0.7)), mat); m.scale.set(rx, ry, rz); m.castShadow = true; return m; }
export class Firefly {
  constructor({ glowTex = null, small = false } = {}) {
    const G = (this.group = new THREE.Group());
    const body = (this.body = new THREE.Group()); G.add(body);
    const dark = M.matte(0x2a2420), pale = M.plastic(0xe9c96a), pink = M.plastic(0xd86b6b), seg = M.matte(0x5a4a3a);
    this.parts = {};
    // Abdomen: 7 segments tapering to the tail (−X).
    const abd = new THREE.Group(); body.add(abd); this.parts.abdomen = abd;
    const lanternMat = (this.lanternMat = new THREE.MeshStandardMaterial({ color: 0xf2eec0, emissive: FLY_HEX, emissiveIntensity: 0, roughness: 0.5 }));
    this.lantern = [];
    for (let i = 0; i < 7; i++) {
      const x = -0.15 - i * 0.24, r = 0.42 - i * 0.035 - (i > 4 ? (i - 4) * 0.05 : 0);
      const sgm = ell(0.15, r * 0.62, r, seg, 20); sgm.position.set(x, -0.05, 0); abd.add(sgm);
      if (i >= 4 && i <= 5) {     // the two lantern segments, underneath
        const lan = ell(0.14, r * 0.42, r * 0.92, lanternMat, 20); lan.position.set(x, -0.05 - r * 0.24, 0); abd.add(lan); this.lantern.push(lan);
      }
    }
    // Thorax and pronotum (shield over the head).
    const thx = ell(0.36, 0.3, 0.38, seg); thx.position.set(0.32, 0.02, 0); body.add(thx);
    const pron = new THREE.Group(); body.add(pron); this.parts.pronotum = pron;
    const shield = ell(0.48, 0.16, 0.5, pale); shield.position.set(0.72, 0.16, 0); pron.add(shield);
    const spot = ell(0.2, 0.05, 0.1, M.matte(0x1b1714)); spot.position.set(0.7, 0.29, 0); pron.add(spot);
    for (const z of [-0.18, 0.18]) { const p = ell(0.12, 0.05, 0.1, pink); p.position.set(0.74, 0.26, z); pron.add(p); }
    // Head, eyes, antennae under the shield.
    const headG = new THREE.Group(); body.add(headG); this.parts.head = headG;
    const hd = ell(0.2, 0.18, 0.22, dark); hd.position.set(1.02, -0.04, 0); headG.add(hd);
    for (const z of [-0.16, 0.16]) { const e = ell(0.11, 0.12, 0.1, M.plastic(0x15151a, { roughness: 0.2 })); e.position.set(1.06, -0.04, z); headG.add(e); }
    this.antennae = [];
    for (const zs of [-1, 1]) {
      const pts = []; for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push(new THREE.Vector3(1.15 + u * 0.95, 0.0 + Math.sin(u * 2.2) * 0.32, zs * (0.08 + u * 0.45))); }
      const a = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, 0.025, 6), dark); headG.add(a); this.antennae.push(a);
    }
    // Wing covers (elytra): two shells hinged at the shoulders.
    this.elytra = [];
    const elyGroup = new THREE.Group(); body.add(elyGroup); this.parts.elytra = elyGroup;
    for (const zs of [-1, 1]) {
      const hinge = new THREE.Group(); hinge.position.set(0.3, 0.2, zs * 0.06); elyGroup.add(hinge);
      const geo = new THREE.SphereGeometry(1, 28, 16, zs > 0 ? 0 : Math.PI, Math.PI, 0, Math.PI / 2);
      const sh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x2b2420, roughness: 0.55, side: THREE.DoubleSide }));
      sh.scale.set(1.0, 0.3, 0.42); sh.position.set(-0.72, -0.05, zs * 0.0); sh.castShadow = true; hinge.add(sh);
      const edge = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 6, 40, Math.PI), pale);
      edge.scale.set(1.0, 0.42, 1); edge.rotation.x = Math.PI / 2 * zs; edge.rotation.z = zs > 0 ? 0 : 0; edge.position.set(-0.72, -0.05, 0);
      if (zs < 0) edge.rotation.set(-Math.PI / 2, 0, 0);
      hinge.add(edge);
      this.elytra.push(hinge);
    }
    // Hind wings (membranes), folded under the elytra at rest.
    this.wings = [];
    for (const zs of [-1, 1]) {
      const hinge = new THREE.Group(); hinge.position.set(0.25, 0.14, zs * 0.08); body.add(hinge);
      const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.bezierCurveTo(-0.6, 0.35, -1.5, 0.35, -1.7, 0.05); sh.bezierCurveTo(-1.5, -0.2, -0.6, -0.15, 0, 0);
      const w = new THREE.Mesh(new THREE.ShapeGeometry(sh, 16), M.ghost(0xcfd8e6, 0.35)); w.rotation.x = Math.PI / 2; w.scale.z = zs; hinge.add(w);
      this.wings.push(hinge);
    }
    // Six legs.
    this.legs = new THREE.Group(); body.add(this.legs); this.parts.legs = this.legs;
    for (const x of [0.55, 0.3, 0.05]) for (const zs of [-1, 1]) {
      const a = [x, -0.15, zs * 0.22], b = [x + (x - 0.3) * 0.8, -0.45, zs * 0.62], c = [x + (x - 0.3) * 1.4, -0.82, zs * 0.78];
      this.legs.add(beam(a, b, 0.035, dark, 6), beam(b, c, 0.028, dark, 6));
    }
    if (glowTex) { this.halo = glowSprite(glowTex, FLY_HEX, small ? 2.2 : 3.2); this.halo.position.set(-1.25, -0.35, 0); body.add(this.halo); this.halo.material.opacity = 0; }
    this.k = 0;
    this.setOpen(0);
  }
  // 0 = at rest, 1 = in flight: elytra raised and spread, hind wings out.
  setOpen(k, t = 0) {
    k = clamp(k, 0, 1);
    this.elytra.forEach((h, i) => { const zs = i ? 1 : -1; h.rotation.set(-zs * 0.55 * k, 0, 0.45 * k); });
    this.wings.forEach((h, i) => { const zs = i ? 1 : -1; const flap = k > 0.5 ? Math.sin(t * 60) * 0.5 * k : 0; h.rotation.set(0, zs * (-0.1 + 1.25 * k), flap * zs); h.visible = k > 0.05; });
  }
  setGlow(k, rgb = FLY_GREEN) {
    this.k = k;
    const c = hex(rgb);
    this.lanternMat.emissive.setHex(c); this.lanternMat.emissiveIntensity = 0.15 + 3.5 * k;
    if (this.halo) { this.halo.material.color.setHex(c); this.halo.material.opacity = clamp(k, 0, 1); this.halo.visible = k > 0.01; }
  }
}

// A larva ("glow-worm" stage): a flat, segmented, armoured grub with two small lights near the tail.
export function makeLarva(glowTex) {
  const g = new THREE.Group(), plates = M.matte(0x3a3330), seg = [];
  for (let i = 0; i < 11; i++) { const r = 0.2 - Math.abs(i - 4) * 0.012; const m = ell(0.12, r * 0.55, r, plates, 16); m.position.set(0.95 - i * 0.2, r * 0.5, 0); g.add(m); seg.push(m); }
  const hd = ell(0.09, 0.07, 0.09, M.matte(0x1d1a18), 14); hd.position.set(1.12, 0.06, 0); g.add(hd);
  const spots = [];
  for (const z of [-0.08, 0.08]) { const s = ell(0.05, 0.03, 0.04, M.glow(FLY_HEX), 10); s.position.set(-1.05, 0.04, z); g.add(s); spots.push(s); }
  const halo = glowSprite(glowTex, FLY_HEX, 0.9); halo.position.set(-1.05, 0.05, 0); g.add(halo);
  return { group: g, seg, spots, halo };
}

// ---------------------------------------------------------------- night scenery
// Night: dark sky and fog, and the stage's lights turned down to moonlight (k = share of their normal
// strength). The original strengths are remembered on the stage, so every chapter sets an absolute level.
export function nightLook(stage, col = 0x05080d, near = 18, far = 50, k = 0.3) {
  stage.floor.visible = false;
  stage.lights.children.forEach((l) => { if (l.userData.i0 == null) l.userData.i0 = l.intensity; l.intensity = l.userData.i0 * k; });
  stage.scene.environmentIntensity = 0.8 * k;
  stage.scene.background = new THREE.Color(col);
  stage.scene.fog = new THREE.Fog(col, near, far);
}
export function setNight(stage, k) { stage.lights.children.forEach((l) => { if (l.userData.i0 == null) l.userData.i0 = l.intensity; l.intensity = l.userData.i0 * k; }); stage.scene.environmentIntensity = 0.8 * k; }
export function grassPatch(root, R = 7, n = 260, seed = 3) {
  const ground = new THREE.Mesh(new THREE.CircleGeometry(R, 48), M.matte(0x0d1a10)); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; root.add(ground);
  const blade = new THREE.ConeGeometry(0.04, 0.7, 4); blade.translate(0, 0.35, 0);
  const sw = new THREE.InstancedMesh(blade, M.matte(0x1f3a1f), n); const o = new THREE.Object3D();
  let s = seed; const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < n; i++) { const a = rnd() * TAU, r = Math.sqrt(rnd()) * R * 0.95; o.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); o.rotation.set((rnd() - 0.5) * 0.4, rnd() * 3, (rnd() - 0.5) * 0.4); o.scale.setScalar(0.6 + rnd() * 0.9); o.updateMatrix(); sw.setMatrixAt(i, o.matrix); }
  root.add(sw); return { ground, grass: sw };
}
export function tree(h = 4, r = 1.6, col = 0x173020, trunk = 0x3a2a1e) {
  const g = new THREE.Group();
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, h * 0.6, 10), M.matte(trunk)); t.position.y = h * 0.3; g.add(t);
  const blobs = [];
  for (let i = 0; i < 5; i++) { const a = i * 1.3; const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r * (0.6 + 0.12 * (i % 3)), 1), M.matte(col, { flatShading: true })); b.position.set(Math.cos(a) * r * 0.45, h * 0.62 + (i % 2) * r * 0.3, Math.sin(a) * r * 0.45); g.add(b); blobs.push(b); }
  g.userData = { h, r }; return g;
}

// ---------------------------------------------------------------- boards (as in JellyfishClear)
export const COL = { hot: '#ffb547', cool: '#8ef0ff', up: '#5ce1a9', down: '#ff7a59', water: '#6cc4ff', red: '#ff5a8a', gold: '#f2c24b', violet: '#c49bff', lime: '#c8f04a', soft: 'rgba(255,255,255,.6)', text: '#e8eef8' };
export function board(root, w, h, pxW, pxH, draw, pos) {
  const c = document.createElement('canvas'); c.width = pxW; c.height = pxH;
  const gx = c.getContext('2d'), tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const redraw = (...a) => { draw(gx, pxW, pxH, ...a); tex.needsUpdate = true; };
  redraw();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, side: THREE.DoubleSide, depthWrite: false, fog: false }));
  m.position.set(...pos); m.renderOrder = 10; root.add(m);
  return { tex, redraw, canvas: c, mesh: m };
}
export function panel(gx, w, h) { gx.clearRect(0, 0, w, h); gx.fillStyle = 'rgba(10,12,18,.9)'; gx.beginPath(); gx.roundRect(0, 0, w, h, 18); gx.fill(); }
export function head(gx, t, sub = '') {
  gx.fillStyle = COL.text; gx.font = 'bold 26px sans-serif'; gx.fillText(t, 22, 38);
  if (sub) { gx.font = '18px sans-serif'; gx.fillStyle = COL.soft; gx.fillText(sub, 22, 64); }
}
export function txt(gx, s, x, y, col = 'rgba(255,255,255,.78)', font = '19px sans-serif') { gx.fillStyle = col; gx.font = font; gx.fillText(s, x, y); }
export function wrap(gx, s, x, y, maxW, lh = 24, col = 'rgba(255,255,255,.78)', font = '19px sans-serif') {
  gx.fillStyle = col; gx.font = font; let line = '', yy = y;
  for (const word of s.split(' ')) { const t = line ? line + ' ' + word : word; if (gx.measureText(t).width > maxW && line) { gx.fillText(line, x, yy); line = word; yy += lh; } else line = t; }
  if (line) gx.fillText(line, x, yy);
  return yy + lh;
}

// ---------------------------------------------------------------- layout helpers (as in JellyfishClear)
export const inReel = () => document.body.classList.contains('gb-reel');
export function layoutOf(stage) {
  const w = stage.host.clientWidth, h = stage.host.clientHeight || 1;
  if (inReel() && w / h < 0.8) return 'tall';
  return w < 560 ? 'narrow' : 'wide';
}
export function viewFor(stage, v) { const lay = layoutOf(stage); return v[lay] || v; }
export function viewFixer(stage, view) {
  let done = false;
  return () => {
    if (done) return; done = true;
    const lay = layoutOf(stage);
    if (lay !== 'wide' && view[lay] && !inReel()) stage.setView(view[lay].pos, view[lay].target, 0.01);
  };
}
export function focuser(stage, groups, views) {
  let cur = '';
  return (f, force = false) => {
    if (f === cur && !force) return false;
    cur = f;
    for (const k in groups) groups[k].visible = k === f;
    if (!inReel()) { const v = viewFor(stage, views[f]); stage.setView(v.pos, v.target, 1.0); }
    return true;
  };
}
const _v = new THREE.Vector3(), _r = new THREE.Vector3(), _u = new THREE.Vector3();
export function fitBoard(stage, mesh, base, scale = 1) {
  const cam = stage.camera;
  mesh.visible = layoutOf(stage) !== 'narrow';
  if (!mesh.visible) return;
  mesh.position.set(...base); mesh.scale.setScalar(scale); mesh.quaternion.copy(cam.quaternion); mesh.updateMatrixWorld(true);
  const p = mesh.geometry.parameters, hw = p.width / 2, hh = p.height / 2;
  cam.updateMatrixWorld(); _r.setFromMatrixColumn(cam.matrixWorld, 0); _u.setFromMatrixColumn(cam.matrixWorld, 1);
  for (let it = 0; it < 8; it++) {
    let x0 = 9, x1 = -9, y0 = 9, y1 = -9;
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      _v.set(sx * hw, sy * hh, 0).applyMatrix4(mesh.matrixWorld).project(cam);
      x0 = Math.min(x0, _v.x); x1 = Math.max(x1, _v.x); y0 = Math.min(y0, _v.y); y1 = Math.max(y1, _v.y);
    }
    const wN = x1 - x0, hN = y1 - y0;
    if (wN > 1.25 || hN > 0.9) { const k = Math.min(1.25 / wN, 0.9 / hN); mesh.scale.multiplyScalar(k); mesh.updateMatrixWorld(true); continue; }
    let dx = 0, dy = 0;
    if (x1 > 0.97) dx = 0.97 - x1; if (x0 + dx < -0.97) dx = -0.97 - x0;
    if (y1 > 0.86) dy = 0.86 - y1;
    if (y0 + dy < -0.97) dy = -0.97 - y0;
    if (layoutOf(stage) !== 'tall' && x0 + dx < 0.2 && y1 + dy > 0.3 && y0 + dy < 0.98) {
      if (wN > 0.77) { mesh.scale.multiplyScalar(0.77 / wN); mesh.updateMatrixWorld(true); continue; }
      dx = 0.2 - x0;
    }
    if (!dx && !dy) break;
    const d = mesh.position.distanceTo(cam.position), th = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * d;
    mesh.position.addScaledVector(_r, dx * th * cam.aspect).addScaledVector(_u, dy * th);
    mesh.updateMatrixWorld(true);
  }
}
export function reelZoom(stage, z) {
  const lay = layoutOf(stage), want = lay === 'tall' ? z : 1;
  if (stage.camera.zoom !== want) { stage.camera.zoom = want; stage.camera.updateProjectionMatrix(); }
  const [x, y] = lay === 'narrow' ? [0, -0.24] : lay === 'wide' ? [0.08, -0.1] : [0, 0];
  if (!stage.shift || stage.shift[0] !== x || stage.shift[1] !== y) stage.setShift(x, y);
}
export { smooth };
