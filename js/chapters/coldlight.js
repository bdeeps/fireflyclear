// Chapter 2: cold light. One luciferase enzyme, hugely magnified, runs the firefly reaction step by
// step: luciferin and Mg-ATP bind, pyrophosphate leaves (luciferyl adenylate), oxygen arrives, a strained
// four-atom ring (dioxetanone) forms and snaps, CO₂ leaves, and oxyluciferin is left in an excited state
// that drops down by giving out one photon (or, in the other cases, just a little heat). Numbers come from
// lightOf() and LAMPS in fly.js; sources are listed there (Ando et al. 2008; ExPASy EC 1.13.12.7;
// Sci Rep 2013 on pH colour; PNNL and DOE on bulbs; RingLightClear's 120 lm/W for LEDs).
// The oxygen slider scales how often the enzyme can finish a cycle: a saturating curve, rate ∝ O₂/(O₂+0.25),
// a labelled illustration (we did not find a measured value for luciferase in the lantern to use).
import { THREE, M, approach, clamp, sphere, beam } from '../kit.js';
import { lightOf, LAMPS, QY_MAX, QY_OLD, LAMBDAS, lambdaRgb, css, hex, bandName, glowTexture, glowSprite, board, panel, head, txt, COL, layoutOf, fitBoard, reelZoom, viewFixer, nightLook } from '../fly.js';

const rateOf = (o2) => (o2 <= 0 ? 0 : (o2 / (o2 + 0.25)) * 1.25);
const C = { y: 0, cx: 0 };

function ring6(r, mat) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.12, 6), mat); m.rotation.x = Math.PI / 2; return m; }
function luciferinMesh(mat) {
  const g = new THREE.Group();
  const a = ring6(0.2, mat); a.position.x = -0.32; const b = ring6(0.2, mat); b.position.x = 0.0;
  const c = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 5), mat); c.rotation.x = Math.PI / 2; c.position.x = 0.36;
  g.add(a, b, c); return g;
}

export default {
  id: 'coldlight',
  short: 'Cold light',
  title: 'Light without heat',
  subtitle: 'Luciferin, oxygen, ATP and the enzyme luciferase make a photon, not a hot filament.',
  view: { pos: [1.7, 3.1, 8.6], target: [1.5, 2.65, 0], narrow: { pos: [-0.9, 2.8, 7.2], target: [-0.9, 2.4, 0] } },
  learn: `<p>A bulb makes light by getting a wire white-hot. A firefly makes light with <b>chemistry</b>, at the temperature of a summer night. That is <b>bioluminescence</b>, light made by a living thing.</p>
    <p>Four things meet inside each light cell. <b>Luciferin</b> is the fuel. <b>Luciferase</b> is the enzyme, a protein machine that holds everything in the right place. <b>ATP</b>, the energy currency of every cell, with a <b>magnesium</b> ion, first “switches on” the luciferin by sticking part of itself to it. Then <b>oxygen</b> joins in. It makes a tiny, strained ring of four atoms that snaps apart, throwing off carbon dioxide.</p>
    <p>That snap leaves the product, <b>oxyluciferin</b>, in an <b>excited state</b>: it holds extra energy, about 50 kilocalories per mole, which is just the energy of one <b>yellow-green photon</b>. When it settles down it gives that energy out as light, peaking near <b>560 nanometres</b>. ATP does not power the light itself; the energy comes from the oxygen reaction.</p>
    <p>How good is it? In 1959–60 scientists measured that nearly every molecule made a photon, about <b>88%</b>. In 2008 a Japanese team (Ando and colleagues) measured it again much more carefully and found <b>41%</b>. That is still superb. An old filament bulb sends only about 7% of its power out as visible light; the rest is heat. A good white <b>LED</b> manages about 30%. (Lamps and LEDs are explained in <a href="/lightingclear/">LightingClear</a> and <a href="/ringlightclear/">RingLightClear</a>; how heat moves is in <a href="/heatclear/">HeatClear</a>.)</p>
    <p>The colour can change. In a test tube, make the mix more <b>acidic</b> or <b>warmer</b> and the light turns orange-red. Different species also have slightly different luciferases, so their light ranges from green to orange. A firefly is a <b>light maker</b>, unlike a chameleon or an octopus, whose colours are reflected sunlight (<a href="/chameleonclear/">ChameleonClear</a>, <a href="/octopusclear/">OctopusClear</a>). Jellyfish and many squid make their own light with different chemistry (<a href="/jellyfishclear/">JellyfishClear</a>, <a href="/squidclear/">SquidClear</a>).</p>
    <p class="tip"><b>Try it:</b> turn the oxygen down and watch the enzyme stall. Then lower the pH and watch the colour slide to red on the spectrum.</p>`,
  terms: [
    { t: 'Bioluminescence', d: 'Light made by a living thing through a chemical reaction.' },
    { t: 'Luciferin', d: 'The fuel molecule that is oxidised to make the light.' },
    { t: 'Luciferase', d: 'The enzyme that holds luciferin, ATP and oxygen together and speeds up the reaction.' },
    { t: 'ATP', d: 'Adenosine triphosphate, the energy currency of cells. In fireflies it primes the luciferin.' },
    { t: 'Excited state', d: 'A molecule holding extra energy, which it can give out as a photon.' },
    { t: 'Quantum yield', d: 'Out of every 100 molecules that react, how many make a photon. For fireflies, about 41.' },
    { t: 'Cold light', d: 'Light made without a hot source, so very little energy is wasted as heat.' },
  ],
  defaults: { o2: 1, pH: 8, T: 25, slow: 1 },
  controls: [
    { key: 'o2', type: 'range', label: 'Oxygen reaching the light cell', min: 0, max: 1, step: 0.01, fmt: (v) => Math.round(v * 100) + '%', hint: 'The lantern’s light is limited by oxygen. That is how the flash switch works (next chapter).' },
    { key: 'pH', type: 'range', label: 'pH of the mix (test tube)', min: 6, max: 8.5, step: 0.05, ends: ['acidic', 'alkaline'], fmt: (v) => v.toFixed(1) },
    { key: 'T', type: 'range', label: 'Temperature', min: 10, max: 40, step: 0.5, fmt: (v) => v.toFixed(0) + ' °C' },
    { key: 'slow', type: 'range', label: 'Slow motion', min: 0.3, max: 2, step: 0.05, fmt: (v) => v.toFixed(2) + '×', hint: 'One real enzyme turns over in well under a second; here each cycle takes a few seconds.' },
  ],
  quiz: [
    { q: 'Where does the energy for the firefly’s photon come from?', options: ['Heat from the body', 'Breaking ATP alone', 'Oxygen reacting with luciferin, snapping a strained ring', 'Sunlight stored in the day'], answer: 2, why: 'ATP primes the luciferin, but the energy of the photon comes from the oxygen reaction and the breaking four-atom ring.' },
    { q: 'What did Ando and colleagues find in 2008?', options: ['Fireflies make no heat at all', 'About 41 of every 100 reacting molecules make a photon, not 88', 'Firefly light is ultraviolet', 'Luciferase needs no oxygen'], answer: 1, why: 'Their careful photon counts gave 41.0%, revising the older figure of about 88%.' },
    { q: 'What turns firefly light from yellow-green towards red in a test tube?', options: ['More oxygen', 'A more acidic mix or a higher temperature', 'Less ATP', 'Darkness'], answer: 1, why: 'Lower pH and warmer mixtures weaken the green part of the light, leaving the red.' },
  ],
  reel: [
    { ms: 5600, caption: 'Luciferin, ATP and oxygen meet inside the enzyme luciferase.', set: { pH: 8, T: 25, o2: 1, slow: 1.4 }, anim: {}, view: { pos: [-0.7, 3.4, 6.6], target: [-0.9, 3.4, 0] }, spin: 0.25 },
    { ms: 4800, caption: 'Make the mix acidic and the same reaction glows orange-red.', set: { o2: 1, slow: 1.6, T: 25 }, anim: { pH: [8, 6.2] }, view: { pos: [-0.7, 3.6, 7.4], target: [-0.9, 3.6, 0] }, spin: 0 },
  ],

  build({ stage }) {
    nightLook(stage, 0x06090f, 22, 60, 0.6);
    const root = new THREE.Group(); root.position.x = -0.9; stage.root.add(root);
    const gt = glowTexture();
    const Y = 2.4;
    // Luciferase: a big translucent protein with a pocket on top, plus a small lid domain.
    const enz = new THREE.Group(); enz.position.set(0, Y, 0); root.add(enz);
    const bodyM = M.clear(0x7fb8ff, 0.22, { emissive: 0x0a1e3a });
    const big = new THREE.Mesh(new THREE.SphereGeometry(1.35, 40, 28, 0, Math.PI * 2, 0.55, Math.PI - 0.55), bodyM); enz.add(big);
    const lid = new THREE.Mesh(new THREE.SphereGeometry(0.62, 28, 20), M.clear(0x9fd2ff, 0.28)); lid.position.set(1.15, 0.85, -0.3); enz.add(lid);
    const pocketGlow = glowSprite(gt, 0xffffff, 2.2); pocketGlow.position.set(0, 0.5, 0.2); enz.add(pocketGlow);
    // Molecules.
    const lucM = M.plastic(0xf2d36b, { emissive: 0x3a2c00 }), oxyM = new THREE.MeshStandardMaterial({ color: 0xf6f0b8, emissive: 0xc8f04a, emissiveIntensity: 0 });
    const luc = luciferinMesh(lucM); root.add(luc);
    const oxy = luciferinMesh(oxyM); root.add(oxy);
    const aden = sphere(0.24, M.plastic(0xc49bff)); root.add(aden);
    const P = [0, 1, 2].map(() => { const p = sphere(0.12, M.plastic(0xffa040)); root.add(p); return p; });
    const mg = sphere(0.09, M.plastic(0x5ce1a9)); root.add(mg);
    const O2 = [0, 1].map(() => { const o = sphere(0.13, M.plastic(0xff5a5a)); root.add(o); return o; });
    const co2 = new THREE.Group(); co2.add(sphere(0.12, M.matte(0x333333))); for (const d of [-0.22, 0.22]) { const o = sphere(0.11, M.plastic(0xff5a5a)); o.position.x = d; co2.add(o); } root.add(co2);
    const ringM = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.035, 6, 4), M.glow(0xffffff)); root.add(ringM);
    const photon = glowSprite(gt, 0xc8f04a, 0.9); root.add(photon);
    const heat = glowSprite(gt, 0xff5a3a, 0.7); root.add(heat);
    const exc = glowSprite(gt, 0xc8f04a, 1.8); root.add(exc);
    const photons = []; for (let i = 0; i < 14; i++) { const p = glowSprite(gt, 0xc8f04a, 0.5); p.visible = false; root.add(p); photons.push(p); }
    const L = (h, p, c = '') => stage.label(h, p, root, c);
    const tag = { enz: L('Luciferase (enzyme)', [-1.5, Y - 1.2, 0.6]), step: L('', [0, Y - 1.9, 0.6], 'hot'), luc: L('Luciferin', [0, 0, 0]), atp: L('Mg-ATP', [0, 0, 0]), o2: L('O₂', [0, 0, 0]), co2: L('CO₂', [0, 0, 0]), ph: L('Photon', [0, 0, 0], 'hot') };

    // Board: the spectrum (top) and the energy share against lamps (bottom).
    const cur = { pH: 7.8, T: 25 };
    const chart = board(root, 4.6, 4.2, 760, 700, (gx, w, h) => {
      panel(gx, w, h);
      const lo = lightOf(cur.pH, cur.T);
      head(gx, 'The colour of the light', `pH ${cur.pH.toFixed(1)}, ${cur.T.toFixed(0)} °C: peak ${lo.peak} nm, ${bandName(lo.peak)}`);
      const x0 = 60, x1 = w - 30, yb = 300, yt = 95, X = (l) => x0 + (x1 - x0) * (l - 380) / 350;
      for (let l = 380; l <= 730; l += 2) { gx.fillStyle = css(lambdaRgb(l), 0.85); gx.fillRect(X(l), yb + 6, (x1 - x0) / 175 + 1, 16); }
      gx.beginPath(); gx.moveTo(X(380), yb);
      const mx = Math.max(...lo.S);
      LAMBDAS.forEach((l, i) => gx.lineTo(X(l), yb - (yb - yt) * lo.S[i] / mx));
      gx.lineTo(X(730), yb); gx.closePath(); gx.fillStyle = css(lo.rgb, 0.45); gx.fill(); gx.strokeStyle = css(lo.rgb); gx.lineWidth = 4; gx.stroke();
      txt(gx, '400', X(400) - 16, yb + 46, COL.soft, '16px sans-serif'); txt(gx, '500', X(500) - 16, yb + 46, COL.soft, '16px sans-serif'); txt(gx, '600', X(600) - 16, yb + 46, COL.soft, '16px sans-serif'); txt(gx, '700 nm', X(700) - 16, yb + 46, COL.soft, '16px sans-serif');
      gx.fillStyle = css(lo.rgb); gx.beginPath(); gx.roundRect(w - 120, 82, 90, 50, 10); gx.fill();
      // Energy share bars.
      const by = 400;
      txt(gx, 'Share of the energy that leaves as visible light', 22, by, COL.text, 'bold 22px sans-serif');
      const rows = [['Firefly (2008 value)', lo.share, css(lo.rgb)], ['Firefly (old 88% value)', QY_OLD, 'rgba(200,240,74,.35)'], ['White LED', LAMPS.led.share, css(LAMPS.led.rgb)], ['Filament bulb', LAMPS.bulb.share, css(LAMPS.bulb.rgb)]];
      rows.forEach(([n, v, c], i) => {
        const y = by + 34 + i * 62, bx = 270, bw = w - bx - 90;
        txt(gx, n, 22, y + 26, COL.text, '19px sans-serif');
        gx.fillStyle = 'rgba(255,255,255,.08)'; gx.fillRect(bx, y + 6, bw, 28);
        gx.fillStyle = c; gx.fillRect(bx, y + 6, bw * v, 28);
        txt(gx, Math.round(v * 100) + '%', bx + bw + 10, y + 28, COL.text, 'bold 20px sans-serif');
      });
    }, [5.2, 2.6, -1]);
    let drawn = '';

    const fixView = viewFixer(stage, this.view);
    let ph = 0, cyc = 0, acc = 0, emitThis = true, t = 0, pi = 0, glowK = 0;
    const lerp3 = (o, a, b, k) => o.position.set(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k);
    const sm = (a, b, x) => clamp((x - a) / (b - a), 0, 1);
    const POCKET = [0, Y + 0.45, 0.25];
    const inst = {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        reelZoom(stage, 1.35); fixView();
        const lay = layoutOf(stage);
        fitBoard(stage, chart.mesh, lay === 'tall' ? [0, 6.0, -1] : [5.0, 2.7, -1.2], lay === 'tall' ? 0.95 : 1);
        const lo = lightOf(s.pH, s.T), r = rateOf(s.o2);
        const col = hex(lo.rgb);
        // Phase of the cycle. The oxygen step (0.35–0.5) waits for oxygen; with none, the cycle stops there.
        const base = 0.28 * s.slow;
        const inO2 = ph >= 0.35 && ph < 0.5;
        ph += dt * base * (inO2 ? r : 1);
        if (ph >= 1) {
          ph -= 1; cyc++;
          acc += lo.qy; emitThis = acc >= 1; if (emitThis) acc -= 1;
        }
        const p = ph;
        // 1. Luciferin and Mg-ATP drift in.
        const k1 = sm(0.0, 0.2, p);
        luc.visible = p < 0.6; lerp3(luc, [-3.2, Y + 0.6, 0.6], [POCKET[0] - 0.2, POCKET[1], POCKET[2]], k1); luc.rotation.z = (1 - k1) * 1.5;
        const atpFrom = [-2.6, Y - 1.6, 0.8], atpTo = [POCKET[0] + 0.45, POCKET[1] - 0.15, POCKET[2]];
        lerp3(aden, atpFrom, atpTo, k1);
        const leave = sm(0.2, 0.35, p);           // pyrophosphate (2 phosphates) leaves
        P.forEach((q, i) => {
          const home = [aden.position.x + 0.3 + i * 0.22, aden.position.y + 0.08, aden.position.z];
          if (i === 0) q.position.set(aden.position.x - 0.28, aden.position.y + 0.05, aden.position.z);   // stays: luciferyl-AMP
          else q.position.set(home[0] + leave * (1.6 + i * 0.2), home[1] - leave * 1.6, home[2] + leave * 0.6);
          q.visible = p < 0.95 && !(i > 0 && leave >= 1);
        });
        mg.position.set(aden.position.x + 0.15, aden.position.y - 0.25 - leave * 1.4, aden.position.z + 0.2); mg.visible = leave < 1;
        // 2. Oxygen arrives from above.
        const k2 = sm(0.35, 0.5, p);
        O2.forEach((o, i) => { o.position.set(POCKET[0] + 0.1 + i * 0.24, POCKET[1] + 2.4 * (1 - k2) + 0.25, POCKET[2] + 0.1); o.visible = p >= 0.3 && p < 0.55; o.material.opacity = 1; });
        // 3. Dioxetanone ring forms and snaps; CO₂ leaves.
        ringM.visible = p >= 0.5 && p < 0.58; ringM.position.set(POCKET[0] + 0.2, POCKET[1] + 0.2, POCKET[2] + 0.15); ringM.rotation.z = Math.PI / 4; ringM.scale.setScalar(1 + 0.4 * Math.sin(t * 40));
        const k3 = sm(0.55, 0.75, p);
        co2.visible = p >= 0.55 && p < 0.8; co2.position.set(POCKET[0] + 0.3 + k3 * 2.6, POCKET[1] + 0.3 + k3 * 1.4, POCKET[2] + 0.2);
        // 4. Excited oxyluciferin, then photon (or heat).
        oxy.visible = p >= 0.58;
        const k4 = sm(0.82, 1.0, p);
        lerp3(oxy, [POCKET[0] - 0.2, POCKET[1], POCKET[2]], [3.0, Y + 0.3, 0.6], k4);
        const excited = p >= 0.58 && p < 0.66;
        glowK = approach(glowK, excited ? 1 : 0, 25, dt);
        oxyM.emissive.setHex(col); oxyM.emissiveIntensity = glowK * 3;
        exc.material.color.setHex(col); exc.position.copy(oxy.position); exc.material.opacity = glowK; exc.visible = glowK > 0.02;
        const k5 = sm(0.64, 0.9, p);
        photon.visible = emitThis && p >= 0.64 && p < 0.9; photon.material.color.setHex(col);
        photon.position.set(POCKET[0] - 0.2 - k5 * 2.2, POCKET[1] + k5 * 3.0, POCKET[2] + 0.4 + k5 * 1.2); photon.scale.setScalar(0.9 + 0.3 * Math.sin(t * 30));
        heat.visible = !emitThis && p >= 0.64 && p < 0.85; heat.material.opacity = 0.5 * (1 - sm(0.64, 0.85, p)); heat.position.set(POCKET[0] - 0.2, POCKET[1] + 0.2 + sm(0.64, 0.85, p) * 0.8, POCKET[2] + 0.4);
        aden.visible = p < 0.95; if (p > 0.6) lerp3(aden, atpTo, [2.6, Y - 1.4, 0.8], sm(0.8, 0.95, p));
        if (p > 0.6) { P[0].position.set(aden.position.x - 0.28, aden.position.y + 0.05, aden.position.z); }
        pocketGlow.material.color.setHex(col); pocketGlow.material.opacity = 0.15 + glowK * 0.6;
        // Background photons from many other enzymes, at the brightness the oxygen allows.
        if (Math.random() < dt * 9 * r * lo.qy / 0.41) { const q = photons[pi++ % photons.length]; q.visible = true; q.userData = { a: Math.random() * Math.PI * 2, b: Math.random() * 0.8 - 0.4, age: 0 }; q.material.color.setHex(col); }
        photons.forEach((q) => { if (!q.visible) return; const u = q.userData; u.age += dt; const d = 1.6 + u.age * 3; q.position.set(Math.cos(u.a) * d, Y + Math.sin(u.a) * d * 0.8 + u.b, 0.4 + Math.sin(u.a * 3) * 0.6); q.material.opacity = Math.max(0, 1 - u.age / 1.2); if (u.age > 1.2) q.visible = false; });
        // Labels.
        const narrow = lay === 'narrow';
        tag.step.element.textContent = p < 0.2 ? '1. Luciferin and Mg-ATP bind' : p < 0.35 ? '2. ATP primes luciferin; PPi leaves' : p < 0.5 ? (r < 0.02 ? '3. Waiting for oxygen…' : '3. Oxygen joins') : p < 0.58 ? '4. A strained ring snaps; CO₂ leaves' : p < 0.82 ? (emitThis ? '5. Excited oxyluciferin gives out a photon' : '5. This time: no photon, a little heat') : '6. AMP and oxyluciferin leave';
        tag.luc.visible = p < 0.2 && !narrow; tag.luc.position.set(luc.position.x, luc.position.y + 0.45, luc.position.z);
        tag.atp.visible = p < 0.2 && !narrow; tag.atp.position.set(aden.position.x, aden.position.y - 0.45, aden.position.z);
        tag.o2.visible = p >= 0.33 && p < 0.5; tag.o2.position.set(O2[1].position.x + 0.35, O2[1].position.y, O2[1].position.z);
        tag.co2.visible = co2.visible && !narrow; tag.co2.position.set(co2.position.x + 0.3, co2.position.y + 0.3, co2.position.z);
        tag.ph.visible = photon.visible && k5 < 0.45; tag.ph.position.set(photon.position.x - 0.5, photon.position.y + 0.3, photon.position.z);
        tag.enz.visible = !narrow;
        cur.pH = s.pH; cur.T = s.T;
        const key = s.pH.toFixed(2) + s.T.toFixed(1);
        if (key !== drawn) { chart.redraw(); drawn = key; }
      },
      readout: (s) => {
        const lo = lightOf(s.pH, s.T), r = rateOf(s.o2);
        return `<div class="big">${lo.peak} nm, ${bandName(lo.peak)}</div>
          <div class="row"><span>Photon energy</span><b>${lo.eV.toFixed(2)} eV</b></div>
          <div class="row"><span>Photons per 100 reactions</span><b>${Math.round(lo.qy * 100)}</b></div>
          <div class="row"><span>Brightness (oxygen-limited)</span><b>${Math.round(r / rateOf(1) * 100)}%</b></div>
          <div class="row"><span>As light: firefly · LED · bulb</span><b>${Math.round(lo.share * 100)}% · ${Math.round(LAMPS.led.share * 100)}% · ${Math.round(LAMPS.bulb.share * 100)}%</b></div>
          <small>Quantum yield: Ando et al. 2008. pH shift and oxygen curve: labelled toys. Lamp shares computed from spectra; the firefly’s counts only the light step.</small>`;
      },
    };
    return inst;
  },
};
