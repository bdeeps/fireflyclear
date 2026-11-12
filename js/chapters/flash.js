// Chapter 3: the flash switch, flash codes and synchrony. Three scenes:
// 1. Switch: one light cell, magnified, with its air tube, tracheal end cell and nerve. A nerve pulse
//    makes the end cell release nitric oxide (NO), which briefly blocks the mitochondria near the air
//    tube, so oxygen reaches the light-making granules deeper in and the cell flashes. FlashCell in
//    fly.js (labelled toy; Trimmer et al. 2001 Science 292: 2486; Timmins et al. 2001 J Exp Biol 204:
//    2795 for the steady glow in extra oxygen). The NO model is the leading idea, not settled: Ohtsuki et al. 2014 (J Insect Sci 14: 56)
//    found the NO-making gene active in a non-flashing species' lantern and said their data did not support it.
// 2. Codes: Photinus pyralis males flash a J-shaped stroke about every 5.9 s (5.9 ± 0.6 s, Lloyd 1966, as
//    cited); a female answers after a delay of about 2 s at about 21 °C (secondary sources citing Buck
//    and Lloyd). Photuris females copy other species' answers to lure and eat the males (Lloyd 1965,
//    Science 149: 653, "Aggressive mimicry in Photuris: firefly femmes fatales"; about one male in ten
//    caught, as reported in Time). Photinus carolinus: 5 to 8 flashes then about 8 s of darkness (NPS).
// 3. Sync: Kuramoto model (Swarm in fly.js), period 0.56 s after Pteroptyx malaccae (Buck & Buck 1968).
import { THREE, M, approach, clamp, beam, sphere, swarm } from '../kit.js';
import { FlashCell, Swarm, Firefly, glowTexture, glowSprite, glowPoints, grassPatch, tree, nightLook, FLY_GREEN, FLY_HEX, board, panel, head, txt, COL, layoutOf, fitBoard, reelZoom, viewFixer, focuser, inReel, TAU } from '../fly.js';

const VIEWS = {
  switch: { pos: [1.9, 3.5, 11.0], target: [1.5, 2.8, 0], narrow: { pos: [-1.3, 2.8, 9.6], target: [-1.3, 2.1, 0] } },
  codes: { pos: [0.4, 2.4, 7.4], target: [0.2, 1.3, 0], narrow: { pos: [0.0, 2.6, 8.4], target: [0.0, 1.4, 0] } },
  sync: { pos: [1.4, 3.6, 10.5], target: [1.2, 3.0, 0], narrow: { pos: [0.0, 3.4, 11.5], target: [0.0, 3.0, 0] } },
};
const SPECIES = {
  pyralis: { name: 'Photinus pyralis', period: 5.9, delay: 2.0 },
  femme: { name: 'Photuris female copying P. pyralis', period: 5.9, delay: 2.0 },
  carolinus: { name: 'Photinus carolinus', period: 11.5, burst: 6, gap: 0.5 },
};
const LMAX = 0.65;   // FlashCell's peak light for one pulse in normal air, shown as 100%

export default {
  id: 'flash',
  short: 'The flash switch',
  title: 'Switching the light on and off',
  subtitle: 'A nerve, a puff of nitric oxide, a gate of oxygen. Then codes, liars and synchrony.',
  view: VIEWS.switch,
  learn: `<p>The reaction from chapter 2 needs <b>oxygen</b>, and the lantern keeps it short of oxygen most of the time. That is why it is dark. Around the edge of every light cell, next to the air tubes, sit <b>mitochondria</b>, the cell’s power stations. They use up the oxygen as it arrives, so almost none gets through to the light-making granules deeper in.</p>
    <p>To flash, the firefly’s brain sends a <b>nerve signal</b> down to the lantern. The nerve ends on the air-tube cells, not on the light cells, and releases a messenger called <b>octopamine</b>. The leading explanation, from a 2001 study by Barry Trimmer and colleagues, is that the air-tube cells then make a puff of <b>nitric oxide</b> gas (NO). NO briefly <b>blocks the mitochondria</b>. For a moment they stop using oxygen, oxygen floods through to the luciferase, and the cell flashes. Light itself helps undo the block, so the flash ends quickly. Not everyone is convinced: a 2014 study in Japan found the nitric-oxide gene busy in the lantern of a species that does not flash at all. But scientists agree that oxygen is the gate. Give a firefly extra oxygen and its lantern glows nonstop.</p>
    <p>Each species has its own <b>flash code</b>. A male common eastern firefly flies low and draws a rising J of light about every <b>6 seconds</b>. A female of his kind, sitting in the grass, answers after about <b>2 seconds</b>. The delay is the password. But <i>Photuris</i> females are <b>femmes fatales</b>: they copy the answer of another species, and when the hopeful male lands, they eat him. James Lloyd discovered this in Florida in 1965.</p>
    <p>Some fireflies flash <b>together</b>. Males of <i>Pteroptyx</i> in Southeast Asian mangroves light up whole trees in time, about twice a second. <i>Photinus carolinus</i> in the Great Smoky Mountains of the USA make bursts of 5 to 8 flashes and then about 8 seconds of dark. Each firefly nudges its own rhythm towards the flashes it sees, like people falling into step. Mathematicians model this with <b>coupled oscillators</b>; the simple one here is the <b>Kuramoto model</b>. How the brain makes rhythms is in <a href="/brainclear/">BrainClear</a>.</p>
    <p class="tip"><b>Try it:</b> send a nerve pulse, then block nitric oxide and try again. Switch to the code and watch the femme fatale. In the synchrony scene, raise the coupling until the tree flashes as one.</p>`,
  terms: [
    { t: 'Mitochondria', d: 'Tiny power stations in cells that use oxygen to make ATP.' },
    { t: 'Octopamine', d: 'A messenger chemical released by insect nerves; in the lantern it triggers the flash.' },
    { t: 'Nitric oxide (NO)', d: 'A small gas molecule cells use as a signal. In the lantern it briefly blocks mitochondria.' },
    { t: 'Flash code', d: 'A species’ own pattern of flashes and answer delays.' },
    { t: 'Aggressive mimicry', d: 'A predator copying another animal’s signal to lure prey, like Photuris females.' },
    { t: 'Synchrony', d: 'Many fireflies flashing at the same moment, again and again.' },
    { t: 'Coupled oscillators', d: 'Repeating rhythms that nudge each other until they keep time together.' },
  ],
  defaults: { focus: 'switch', auto: true, no: true, hyper: false, sp: 'pyralis', K: 4, N: 40 },
  onChange(s, key) {
    if (['auto', 'no', 'hyper', 'action'].includes(key)) s.focus = 'switch';
    if (key === 'sp') s.focus = 'codes';
    if (key === 'K' || key === 'N') s.focus = 'sync';
  },
  controls: [
    { key: 'focus', type: 'seg', label: 'Look at', options: [{ v: 'switch', label: 'The switch' }, { v: 'codes', label: 'Flash codes' }, { v: 'sync', label: 'Synchrony' }] },
    { key: 'pulseBtn', type: 'buttons', label: 'Nerve', items: [{ label: 'Send a nerve pulse', act: (s, inst) => inst.pulse?.() }] },
    { key: 'auto', type: 'toggle', label: 'Flash every 5.9 s by itself' },
    { key: 'no', type: 'toggle', label: 'Nitric oxide can be made', hint: 'Turn off to mimic the experiments that soaked up NO: the flash fails.' },
    { key: 'hyper', type: 'toggle', label: 'Extra oxygen around the firefly' },
    { key: 'sp', type: 'seg', label: 'Code', options: [{ v: 'pyralis', label: 'P. pyralis' }, { v: 'femme', label: 'Femme fatale' }, { v: 'carolinus', label: 'P. carolinus' }] },
    { key: 'K', type: 'range', label: 'Coupling: how strongly each one follows the others', min: 0, max: 8, step: 0.1, fmt: (v) => v.toFixed(1) },
    { key: 'N', type: 'range', label: 'Number of fireflies', min: 5, max: 80, step: 1, fmt: (v) => String(v) },
  ],
  quiz: [
    { q: 'What keeps a firefly’s lantern dark between flashes?', options: ['No luciferin is left', 'Mitochondria use up the oxygen before it reaches the light-making granules', 'A shutter of skin covers it', 'It is too cold'], answer: 1, why: 'Oxygen is the gate. The mitochondria near the air tubes eat it up until nitric oxide blocks them for a moment.' },
    { q: 'How does a Photuris femme fatale catch her prey?', options: ['She chases it in the air', 'She copies the flash answer of another species’ female and eats the male who comes', 'She spins a web', 'She glows brighter than the male'], answer: 1, why: 'James Lloyd showed in 1965 that Photuris females mimic other species’ replies to lure males.' },
    { q: 'In the coupled-oscillator model, what makes the fireflies fall into step?', options: ['A leader tells them when', 'Each one nudges its own rhythm towards the flashes around it', 'They all hatch at the same time', 'The moon'], answer: 1, why: 'With strong enough coupling, small nudges add up until everyone flashes together, with no leader at all.' },
  ],
  reel: [
    { ms: 5600, caption: 'A nerve signal makes a puff of nitric oxide, and oxygen floods in: flash.', set: { focus: 'switch', auto: true, no: true, hyper: false }, anim: {}, act: (s, inst) => inst.pulse?.(), view: { pos: [0.2, 2.8, 7.6], target: [0, 2.4, 0] }, spin: 0 },
    { ms: 5000, caption: 'A Photuris female fakes the answer, and eats the male who believes her.', set: { focus: 'codes', sp: 'femme' }, anim: {}, act: (s, inst) => inst.cue?.(11.5, 'femme'), view: { pos: [0.9, 2.2, 6.2], target: [0.7, 1.9, 0.4] }, spin: 0 },
    { ms: 6000, caption: 'Nudge your rhythm towards your neighbours, and a whole tree flashes as one.', set: { focus: 'sync', N: 60 }, anim: { K: [0, 6] }, act: (s, inst) => inst.resync?.(), view: { pos: [0.2, 3.6, 10.5], target: [0, 3.2, 0] }, spin: 0.2 },
  ],

  build({ stage }) {
    nightLook(stage, 0x05080d, 22, 60, 0.55);
    const root = new THREE.Group(); stage.root.add(root);
    const gt = glowTexture();
    const G = { switch: new THREE.Group(), codes: new THREE.Group(), sync: new THREE.Group() };
    for (const k in G) root.add(G[k]);
    const L = (h, p, par, c = '') => stage.label(h, p, par, c);

    // ---------------------------------------------------------------- 1. the switch
    const SY = 2.3;
    const SWG = new THREE.Group(); SWG.position.x = -1.1; G.switch.add(SWG);
    const cellM = M.clear(0xf3ecc0, 0.3, { emissive: 0x1a1a08 });
    const cell = new THREE.Mesh(new THREE.CapsuleGeometry(1.25, 1.8, 8, 24), cellM); cell.rotation.z = Math.PI / 2; cell.position.set(0.8, SY, 0); SWG.add(cell);
    const tubeM = M.plastic(0x8fb8ff, { transparent: true, opacity: 0.75 });
    const air = beam([-4.2, SY + 2.4, 0], [-1.6, SY + 0.4, 0], 0.22, tubeM, 16); SWG.add(air);
    const tracheole = beam([-1.6, SY + 0.4, 0], [-0.4, SY + 0.1, 0], 0.09, tubeM, 10); SWG.add(tracheole);
    const endCell = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 16), M.clear(0x6cc4ff, 0.45, { emissive: 0x0b2a44 })); endCell.scale.set(1.2, 0.9, 0.9); endCell.position.set(-1.65, SY + 0.45, 0); SWG.add(endCell);
    const nerve = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-4.0, SY - 1.6, 0.3), new THREE.Vector3(-3.0, SY - 0.6, 0.3), new THREE.Vector3(-2.1, SY + 0.2, 0.25)]), 40, 0.06, 8), M.glow(0x8a5a20)); SWG.add(nerve);
    const nerveM = nerve.material;
    const spike = glowSprite(gt, 0xffb547, 0.8); SWG.add(spike);
    // Mitochondria: a ring near the air-tube end of the cell. Granules (luciferase): deeper in.
    const mitoM = M.plastic(0x9a5a3a, { emissive: 0x000000 });
    const mito = []; for (let i = 0; i < 9; i++) { const a = -1.2 + (i / 8) * 2.4; const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.28, 4, 10), mitoM); m.position.set(-0.15 + Math.abs(a) * 0.25, SY + Math.sin(a) * 0.95, Math.cos(a) * 0.5); m.rotation.z = a; SWG.add(m); mito.push(m); }
    const granM = new THREE.MeshStandardMaterial({ color: 0xf2eec0, emissive: FLY_HEX, emissiveIntensity: 0.05, roughness: 0.5 });
    const gran = []; for (let i = 0; i < 26; i++) { const m = sphere(0.1, granM, 10); m.position.set(1.0 + (i % 6) * 0.32, SY + ((i * 7) % 11 / 11 - 0.5) * 1.6, ((i * 5) % 9 / 9 - 0.5) * 1.2); SWG.add(m); gran.push(m); }
    const cellGlow = glowSprite(gt, FLY_HEX, 6); cellGlow.position.set(1.8, SY, 0.6); SWG.add(cellGlow);
    // Particles: oxygen (red) and NO (cyan).
    const NO2 = 70, NNO = 40;
    const o2s = swarm(NO2, new THREE.SphereGeometry(0.05, 6, 4), M.glow(0xff6a5a)); SWG.add(o2s);
    const nos = swarm(NNO, new THREE.SphereGeometry(0.045, 6, 4), M.glow(0x8ef0ff)); SWG.add(nos);
    const op = Array.from({ length: NO2 }, (_, i) => ({ u: i / NO2, life: 0, fate: 0 }));
    const np = Array.from({ length: NNO }, (_, i) => ({ u: 0, on: false, a: 0, z: 0 }));
    const sl = {
      nerve: L('Nerve (octopamine)', [-3.6, SY - 1.9, 0.3], SWG, 'hot'), end: L('Air-tube cell makes NO', [-1.9, SY + 1.25, 0], SWG),
      air: L('Air tube: oxygen in', [-3.6, SY + 2.75, 0], SWG), mito: L('Mitochondria use up oxygen', [-0.2, SY - 1.55, 0.6], SWG),
      gran: L('Luciferase granules', [2.2, SY + 1.55, 0.3], SWG, 'hot'),
    };
    const fc = new FlashCell();
    const trace = []; const TN = 300;   // last 3 s at 100 samples/s
    const tb = board(G.switch, 4.4, 3.4, 720, 560, (gx, w, h) => {
      panel(gx, w, h); head(gx, 'One flash, step by step', 'last 3 seconds');
      const rows = [['Nerve signal', 0, COL.hot, 1.2], ['Nitric oxide', 1, COL.cool, 0.9], ['Oxygen at luciferase', 2, COL.red, 1.1], ['Light', 3, '#c8f04a', LMAX]];
      rows.forEach(([n, k, c, mx], r) => {
        const y0 = 120 + r * 108, hh = 80;
        txt(gx, n, 22, y0 - 8, c, 'bold 18px sans-serif');
        gx.strokeStyle = 'rgba(255,255,255,.12)'; gx.beginPath(); gx.moveTo(22, y0 + hh); gx.lineTo(w - 22, y0 + hh); gx.stroke();
        gx.strokeStyle = c; gx.lineWidth = 3; gx.beginPath();
        trace.forEach((v, i) => { const x = 22 + (w - 44) * i / (TN - 1), y = y0 + hh - hh * clamp(v[k] / mx, 0, 1.1); i ? gx.lineTo(x, y) : gx.moveTo(x, y); });
        gx.stroke();
      });
    }, [5.2, 2.6, -1]);

    // ---------------------------------------------------------------- 2. codes
    grassPatch(G.codes, 8, 220, 5);
    const male = new Firefly({ glowTex: gt, small: true }); male.group.scale.setScalar(0.33); G.codes.add(male.group); male.setOpen(1);
    const fem = new Firefly({ glowTex: gt, small: true }); fem.group.scale.setScalar(0.33); fem.group.position.set(1.6, 0.75, 0.6); fem.group.rotation.z = 0.9; G.codes.add(fem.group);
    const stalk = beam([1.6, 0, 0.6], [1.75, 0.75, 0.6], 0.03, M.matte(0x2a4a24), 6); G.codes.add(stalk);
    const trail = glowPoints(60, gt, 0.35); G.codes.add(trail);
    const trailBuf = [];
    const cl = { male: L('Male: J-shaped flash', [0, 0, 0], G.codes, 'hot'), fem: L('Female answers after ~2 s', [1.6, 0.25, 0.6], G.codes), note: L('', [0, 4.4, 0], G.codes) };
    const flashLog = [];   // [time, who, length]
    const cb = board(G.codes, 4.4, 2.4, 720, 390, (gx, w, h, now) => {
      panel(gx, w, h); head(gx, 'The conversation', 'last 14 seconds');
      const X = (t) => 22 + (w - 44) * (1 - (now - t) / 14);
      txt(gx, 'male', 22, 140, COL.hot, 'bold 18px sans-serif'); txt(gx, 'female', 22, 250, COL.cool, 'bold 18px sans-serif');
      flashLog.forEach(([t, who, d]) => { if (now - t > 14) return; gx.fillStyle = who ? COL.cool : '#c8f04a'; const y = who ? 262 : 152; gx.fillRect(X(t), y, Math.max(4, (w - 44) * d / 14), 34); });
      gx.strokeStyle = 'rgba(255,255,255,.15)'; gx.beginPath(); gx.moveTo(22, 200); gx.lineTo(w - 22, 200); gx.stroke();
      txt(gx, 'now →', w - 90, 350, COL.soft, '16px sans-serif');
    }, [5.0, 2.4, -1]);

    // ---------------------------------------------------------------- 3. synchrony
    const trees = [tree(5, 2.2, 0x10261a), tree(4, 1.6, 0x0f2216)]; trees[0].position.set(-0.5, 0, 0); trees[1].position.set(2.6, 0, -1.2); trees.forEach((t) => G.sync.add(t));
    const water = new THREE.Mesh(new THREE.CircleGeometry(9, 48), M.matte(0x040b10)); water.rotation.x = -Math.PI / 2; water.position.y = 0.01; G.sync.add(water);
    const SW = new Swarm(40, 2), MAXN = 80;
    const pts = glowPoints(MAXN, gt, 0.9); pts.material.depthTest = false; G.sync.add(pts);
    const spots = []; for (let i = 0; i < MAXN; i++) { const t = i % 3 === 2 ? trees[1] : trees[0]; const u = t.userData; const a = i * 2.39996, r = Math.sqrt((i * 0.618) % 1) * u.r * 1.1; spots.push([t.position.x + Math.cos(a) * r, u.h * 0.62 + ((i * 0.37) % 1 - 0.3) * u.r * 1.1, t.position.z + Math.sin(a) * r + 0.3]); }
    const rHist = [];
    const yb = board(G.sync, 4.2, 2.6, 700, 430, (gx, w, h) => {
      panel(gx, w, h); head(gx, 'How in step are they?', 'r = 0: random, r = 1: all together');
      const x0 = 40, x1 = w - 30, y0 = 380, y1 = 100;
      gx.strokeStyle = 'rgba(255,255,255,.15)'; gx.beginPath(); gx.moveTo(x0, y0); gx.lineTo(x1, y0); gx.moveTo(x0, y1); gx.lineTo(x1, y1); gx.stroke();
      txt(gx, '1', 18, y1 + 6, COL.soft, '16px sans-serif'); txt(gx, '0', 18, y0 + 6, COL.soft, '16px sans-serif');
      gx.strokeStyle = '#c8f04a'; gx.lineWidth = 4; gx.beginPath();
      rHist.forEach((r, i) => { const x = x0 + (x1 - x0) * i / 299, y = y0 - (y0 - y1) * r; i ? gx.lineTo(x, y) : gx.moveTo(x, y); }); gx.stroke();
    }, [5.0, 3.0, -1]);
    const yl = { tree: L('Males in a tree, each with its own rhythm', [-0.5, 1.2, 2.2], G.sync, 'hot') };

    const focus = focuser(stage, G, VIEWS);
    const fixView = viewFixer(stage, this.view);
    let t = 0, autoT = 5.0, sampleT = 0, codeT = 0, lastSp = '', caught = 0, lastN = 40, rT = 0, light = 0;
    const inst = {
      pulse() { fc.pulse(1); },
      cue(t0 = 0, sp) { codeT = t0; flashLog.length = 0; caught = 0; trailBuf.length = 0; if (sp) lastSp = sp; },
      resync() { SW.reset(lastN, 2); rHist.length = 0; },
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        reelZoom(stage, s.focus === 'codes' ? 1.9 : 1.35); fixView();
        focus(s.focus);
        const lay = layoutOf(stage), narrow = lay === 'narrow';
        if (s.focus === 'switch') {
          fitBoard(stage, tb.mesh, lay === 'tall' ? [0.6, 6.1, -1] : [5.6, 2.6, -1.2], lay === 'tall' ? 0.95 : 1);
          if (s.auto) { autoT += dt; if (autoT >= 5.9) { autoT = 0; fc.pulse(1); } }
          const airK = s.hyper ? 3 : 1;
          light = fc.step(dt, { air: airK, noOn: s.no });
          sampleT += dt;
          while (sampleT >= 0.01) { sampleT -= 0.01; trace.push([fc.nerve, fc.no, fc.o2, fc.light]); if (trace.length > TN) trace.shift(); }
          tb.redraw();
          const k = clamp(light / LMAX, 0, 1.6);
          granM.emissiveIntensity = 0.05 + 3 * k; cellGlow.material.opacity = clamp(k, 0, 1); cellGlow.visible = k > 0.02;
          nerveM.color.setHex(fc.nerve > 0.05 ? 0xffb547 : 0x8a5a20);
          spike.visible = fc.nerve > 0.05; const sp = clamp(1 - fc.nerve, 0, 1);
          spike.position.set(-4.0 + 1.9 * sp, SY - 1.6 + 1.8 * sp, 0.3);
          const block = fc.no * fc.no / (fc.no * fc.no + 0.09);
          mitoM.emissive.setHex(0x223344); mitoM.emissiveIntensity = block * 2; mitoM.color.setHex(block > 0.4 ? 0x5a6a7a : 0x9a5a3a);
          // Oxygen: flows down the air tube into the cell; most stops at the mitochondria unless blocked.
          op.forEach((p, i) => {
            p.u += dt * 0.45 * airK ** 0.3;
            if (p.u > 1) { p.u -= 1; p.fate = Math.random() < (s.hyper ? 0.7 : block * 0.95 + 0.03) ? 1 : 0; }
            let x, y, z = Math.sin(i * 1.7) * 0.18;
            if (p.u < 0.5) { const k2 = p.u / 0.5; x = -4.2 + 3.8 * k2; y = SY + 2.4 - 2.2 * k2; }
            else if (p.fate === 0) { const k2 = (p.u - 0.5) / 0.5; x = -0.4 + 0.3 * k2; y = SY + 0.2 + Math.sin(i) * 0.8 * k2; if (k2 > 0.5) { o2s.place(i, [0, -50, 0], null, 0.01); return; } }
            else { const k2 = (p.u - 0.5) / 0.5; x = -0.4 + 2.6 * k2; y = SY + 0.2 + Math.sin(i * 2.1) * 0.7 * k2; z += Math.cos(i * 1.3) * 0.5 * k2; }
            o2s.place(i, [x, y, z]);
          });
          o2s.done();
          np.forEach((p, i) => {
            if (!p.on && s.no && Math.random() < fc.nerve * dt * 30) { p.on = true; p.u = 0; p.a = Math.random() * 2.4 - 1.2; p.z = Math.random() - 0.5; }
            if (p.on) { p.u += dt * 1.6; if (p.u > 1) p.on = false; }
            if (!p.on) { nos.place(i, [0, -50, 0], null, 0.01); return; }
            nos.place(i, [-1.65 + 1.5 * p.u + Math.abs(p.a) * 0.25 * p.u, SY + 0.45 + (Math.sin(p.a) * 0.95 - 0.45) * p.u, p.z * 0.5]);
          });
          nos.done();
          sl.end.element.textContent = s.no ? 'Air-tube cell makes NO' : 'NO blocked (scavenger)';
          sl.mito.element.textContent = block > 0.4 ? 'Mitochondria blocked by NO' : 'Mitochondria use up oxygen';
          sl.end.visible = !narrow; sl.air.visible = !narrow;
        } else if (s.focus === 'codes') {
          fitBoard(stage, cb.mesh, lay === 'tall' ? [0.4, 5.8, -1] : [5.2, 2.6, -1.2], lay === 'tall' ? 0.95 : 1);
          if (s.sp !== lastSp) { lastSp = s.sp; inst.cue(); }
          const S = SPECIES[s.sp];
          codeT += dt;
          // Male flies a slow loop over the grass; flashes on a schedule.
          const c = codeT % S.period;
          let on = 0, Jy = 0;
          if (s.sp === 'carolinus') { const i = Math.floor(c / S.gap); if (i < S.burst && c % S.gap < 0.25) on = 1; }
          else if (c < 0.5) { on = Math.sin(Math.PI * c / 0.5); Jy = c / 0.5; }
          const ang = codeT * 0.25;
          const mx = -1.4 + Math.cos(ang) * 1.6, mz = Math.sin(ang) * 1.0;
          let my = 1.6 + Math.sin(codeT * 0.7) * 0.15 + Jy * 0.9;
          // Femme fatale: after a few exchanges the male lands next to her and is caught.
          const landing = s.sp === 'femme' && codeT > S.period * 2 + S.delay + 0.8;
          let pos = [mx, my, mz];
          if (landing) { const k = clamp((codeT - (S.period * 2 + S.delay + 0.8)) / 2.0, 0, 1); pos = [mx + (1.85 - mx) * k, my + (0.85 - my) * k, mz + (0.65 - mz) * k]; on = 0; if (k >= 1) caught = 1; }
          if (caught && codeT > S.period * 2 + S.delay + 6) inst.cue();
          male.group.position.set(...pos); male.group.rotation.set(0, -ang - Math.PI / 2, 0.3);
          male.setOpen(landing && caught ? 0.2 : 1, t); male.setGlow(on);
          if (on > 0.05 && !landing) { trailBuf.push([pos[0] - 0.35, pos[1] - 0.1, pos[2], 1]); if (!flashLog.length || codeT - flashLog[flashLog.length - 1][0] > 0.3 || flashLog[flashLog.length - 1][1]) flashLog.push([codeT, 0, s.sp === 'carolinus' ? 0.25 : 0.5]); }
          trailBuf.forEach((q) => { q[3] -= dt * 1.4; }); while (trailBuf.length && trailBuf[0][3] <= 0) trailBuf.shift(); while (trailBuf.length > 60) trailBuf.shift();
          for (let i = 0; i < 60; i++) { const q = trailBuf[i]; if (q) trail.set(i, q[0], q[1], q[2], FLY_GREEN, q[3] * 0.8); else trail.set(i, 0, -50, 0, FLY_GREEN, 0); }
          trail.done();
          // Female answer.
          let f = 0;
          if (S.delay) { const d = c - S.delay; if (d > 0 && d < 0.35 && !landing) { f = Math.sin(Math.PI * d / 0.35); if (!flashLog.length || !flashLog[flashLog.length - 1][1]) flashLog.push([codeT, 1, 0.35]); } }
          fem.setGlow(s.sp === 'carolinus' ? 0 : f, s.sp === 'femme' ? FLY_GREEN : FLY_GREEN);
          fem.group.visible = s.sp !== 'carolinus';
          stalk.visible = fem.group.visible;
          cl.fem.visible = fem.group.visible; cl.fem.element.textContent = s.sp === 'femme' ? (caught ? 'Photuris female: caught him' : 'Photuris female fakes the answer') : 'Female answers after ~2 s';
          cl.male.position.set(pos[0], pos[1] + 0.55, pos[2]); cl.male.element.textContent = s.sp === 'carolinus' ? 'Male: burst of 6, then dark' : landing ? 'Male lands…' : 'Male: J-shaped flash';
          cl.note.visible = false;
          cb.redraw(codeT);
        } else {
          fitBoard(stage, yb.mesh, lay === 'tall' ? [0.6, 7.6, -1] : [5.6, 3.2, -1.2], lay === 'tall' ? 0.9 : 1);
          const N = Math.round(s.N);
          if (N !== lastN) { lastN = N; SW.reset(N, 2); rHist.length = 0; }
          const r = SW.step(dt, s.K);
          rT += dt; if (rT > 0.05) { rT = 0; rHist.push(r); if (rHist.length > 300) rHist.shift(); yb.redraw(); }
          for (let i = 0; i < MAXN; i++) { const p = spots[i]; if (i < N) pts.set(i, p[0], p[1], p[2], FLY_GREEN, SW.fl[i]); else pts.set(i, 0, -50, 0, FLY_GREEN, 0); }
          pts.done();
          yl.tree.visible = !narrow;
        }
      },
      readout: (s) => {
        if (s.focus === 'switch') {
          const k = clamp(fc.light / LMAX, 0, 9);
          return `<div class="big">${s.hyper ? 'Extra oxygen: steady glow' : !s.no ? 'No nitric oxide: no flash' : k > 0.15 ? 'Flash!' : 'Dark: oxygen held back'}</div>
            <div class="row"><span>Mitochondria blocked by NO</span><b>${Math.round(100 * fc.no * fc.no / (fc.no * fc.no + 0.09))}%</b></div>
            <div class="row"><span>Oxygen reaching luciferase</span><b>${Math.round(fc.o2 * 100)}% of supply</b></div>
            <div class="row"><span>Light</span><b>${Math.round(k * 100)}% of a normal flash</b></div>
            <small>Leading model after Trimmer et al. 2001 (nitric oxide) and Timmins et al. 2001 (oxygen gating). Timings are a labelled toy, tuned to a flash of a few tenths of a second.</small>`;
        }
        if (s.focus === 'codes') {
          const S = SPECIES[s.sp];
          return s.sp === 'carolinus' ? `<div class="big">${S.name}</div>
            <div class="row"><span>Pattern</span><b>5 to 8 flashes, then about 8 s dark</b></div>
            <div class="row"><span>Where</span><b>Great Smoky Mountains, USA</b></div>
            <div class="row"><span>Season</span><b>about 2 to 3 weeks, late May to June</b></div>
            <small>US National Park Service. Shown here as a burst of 6.</small>`
            : `<div class="big">${S.name}</div>
            <div class="row"><span>Male flash</span><b>J-shaped, every 5.9 s</b></div>
            <div class="row"><span>Female answer delay</span><b>about 2 s</b></div>
            <div class="row"><span>${s.sp === 'femme' ? 'Liar' : 'Answer'}</span><b>${s.sp === 'femme' ? 'Photuris copies the reply' : 'a female of his own kind'}</b></div>
            <small>Male interval: Lloyd 1966 (as cited). Delay: about 2 s at 21 °C. Femmes fatales: Lloyd 1965, Science.</small>`;
        }
        return `<div class="big">${SW.r > 0.85 ? 'In step' : SW.r > 0.5 ? 'Falling into step' : 'Out of step'}: r = ${SW.r.toFixed(2)}</div>
          <div class="row"><span>Fireflies</span><b>${Math.round(s.N)}</b></div>
          <div class="row"><span>Coupling K</span><b>${s.K.toFixed(1)}</b></div>
          <div class="row"><span>Natural rhythm</span><b>0.56 s ± 12%</b></div>
          <small>Kuramoto model, a textbook simplification. Rhythm after Pteroptyx malaccae at 28 °C (Buck &amp; Buck 1968). Without coupling they never line up; past a threshold they do.</small>`;
      },
    };
    return inst;
  },
};
