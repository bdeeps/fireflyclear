// Chapter 6: how people worked out firefly light. Four bench scenes:
// 1. Boyle's air pump: in late 1667 Robert Boyle put glowing ("shining") rotten wood and fish in the
//    receiver of his air pump: as the air was drawn out the light faded, and it came back when air was
//    let in (Royal Society manuscript received 28 Nov 1667; "New experiments concerning the relation
//    between light and air (in shining wood and fish)", Phil Trans 2, 1668; search summaries, the Royal
//    Society page failed TLS). The glow in shining wood comes from fungi: a different luciferin, but it
//    also needs oxygen. We could not confirm Boyle tested fireflies themselves.
// 2. Dubois: Raphaël Dubois (1849–1929) showed with the click beetle Pyrophorus (mid-1880s) and the
//    rock-boring clam Pholas dactylus that a cold-water extract glows and fades, a boiled extract does
//    not glow, and mixing the two brings the light back. He named the heat-stable part luciferin and the
//    heat-sensitive part luciferase; Wikipedia dates the names to his 1887 Pholas paper, other sources to
//    1885 (encyclopedia.com; Wikipedia, read).
// 3. McElroy: William McElroy found that ATP brings the light back in spent firefly lantern extracts
//    ("The energy source for bioluminescence in an isolated system", PNAS 33: 342, Nov 1947; NAS
//    biographical memoir). ATP is needed, but the photon's energy comes from the oxygen reaction.
// 4. The glowing tobacco plant: Ow, de Wet, Helinski, Howell, Wood & DeLuca, "Transient and stable
//    expression of the firefly luciferase gene in plant cells and transgenic plants", Science 234: 856,
//    14 Nov 1986, after de Wet et al. cloned the Photinus pyralis luciferase cDNA (PNAS 82: 7870, 1985).
//    The plants glowed when given luciferin.
import { THREE, M, approach, clamp, box, sphere, beam, latheX } from '../kit.js';
import { glowTexture, glowSprite, FLY_HEX, nightLook, layoutOf, reelZoom, viewFixer, focuser, inReel } from '../fly.js';

const VIEWS = {
  boyle: { pos: [0.8, 3.0, 7.8], target: [0.6, 2.0, 0], narrow: { pos: [0.0, 3.0, 9.2], target: [0.0, 2.0, 0] } },
  dubois: { pos: [0.8, 3.0, 7.2], target: [0.6, 2.0, 0], narrow: { pos: [0.0, 3.0, 8.6], target: [0.0, 2.0, 0] } },
  mcelroy: { pos: [0.8, 3.0, 7.2], target: [0.6, 2.0, 0], narrow: { pos: [0.0, 3.0, 8.6], target: [0.0, 2.0, 0] } },
  tobacco: { pos: [0.8, 3.2, 7.6], target: [0.6, 2.2, 0], narrow: { pos: [0.0, 3.2, 9.0], target: [0.0, 2.2, 0] } },
};
const FOX = 0x9cff7a;   // shining wood (fungal) glow, greenish

function testTube(x, liquidHex = 0xf2efd6) {
  const g = new THREE.Group(); g.position.set(x, 1.0, 0);
  const glass = latheX([[0, 0.0], [0.02, 0.12], [0.12, 0.2], [1.6, 0.2], [1.62, 0.23]], M.clear(0xe6f6ff, 0.3), { seg: 24 }); glass.rotation.z = Math.PI / 2; g.add(glass);
  const lm = new THREE.MeshStandardMaterial({ color: liquidHex, emissive: FLY_HEX, emissiveIntensity: 0, transparent: true, opacity: 0.85 });
  const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.8, 20), lm); liq.position.y = 0.55; g.add(liq);
  return { g, lm, liq };
}

export default {
  id: 'history',
  short: 'Working it out',
  title: 'How we worked out firefly light',
  subtitle: 'An air pump, a hot and a cold extract, a dash of ATP and a glowing tobacco plant.',
  view: VIEWS.boyle,
  learn: `<p>People have watched fireflies for as long as there have been people. In Japan, summer firefly-watching, <i>hotaru-gari</i>, has been popular for centuries. Explaining the light took much longer.</p>
    <p>In <b>1667</b> the Irish-born scientist <b>Robert Boyle</b> put glowing rotten wood and glowing fish into the glass jar of his new <b>air pump</b>. As he pumped the air out, the glow faded. Let the air back in, and it returned. Living light needs something in the air. We now know it is <b>oxygen</b>.</p>
    <p>In the <b>1880s</b> the French scientist <b>Raphaël Dubois</b> crushed the light organs of a glowing click beetle, and later a glowing clam. One extract in cold water glowed for a while, then went dark. Another, made in boiling water, never glowed. But mix the two and the light came back. Heat had destroyed a fragile part and left a sturdy part. He named the sturdy fuel <b>luciferin</b> and the fragile part <b>luciferase</b>, after Lucifer, “light bringer”.</p>
    <p>In <b>1947</b> <b>William McElroy</b> in the USA found that a spent firefly extract lit up again when he added <b>ATP</b>, the cell’s energy molecule. In 1961 his team and chemists at Johns Hopkins worked out luciferin’s structure and made it in the lab.</p>
    <p>In <b>1985</b> scientists copied the firefly’s <b>luciferase gene</b>, and in <b>1986</b> they put it into <b>tobacco plants</b>. Given luciferin, the plants glowed: a famous photo. Today the gene is one of biology’s favourite tools. The study of firefly <b>synchrony</b> grew too, from John and Elisabeth Buck’s work in Thailand in the 1960s to the mathematics of coupled oscillators.</p>
    <p class="tip"><b>Try it:</b> pump out Boyle’s air, mix Dubois’s two extracts, add McElroy’s ATP, and water the tobacco plant with luciferin.</p>`,
  terms: [
    { t: 'Air pump', d: 'A machine that sucks air out of a glass jar, making a near vacuum.' },
    { t: 'Extract', d: 'A liquid made by crushing tissue in water to dissolve its chemicals.' },
    { t: 'Enzyme', d: 'A protein that speeds up a reaction. Heat usually destroys it.' },
    { t: 'Gene', d: 'A stretch of DNA with the instructions for making one protein, such as luciferase.' },
    { t: 'Transgenic', d: 'A living thing carrying a gene from another species.' },
  ],
  defaults: { focus: 'boyle', air: 1, water: false },
  onChange(s, key) { if (key === 'air') s.focus = 'boyle'; if (key === 'water') s.focus = 'tobacco'; },
  controls: [
    { key: 'focus', type: 'seg', label: 'Look at', options: [{ v: 'boyle', label: 'Boyle 1667' }, { v: 'dubois', label: 'Dubois 1880s' }, { v: 'mcelroy', label: 'McElroy 1947' }, { v: 'tobacco', label: 'Tobacco 1986' }] },
    { key: 'air', type: 'range', label: 'Boyle: air left in the jar', min: 0, max: 1, step: 0.01, fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'benchBtn', type: 'buttons', label: 'Bench', items: [
      { label: 'Dubois: mix the extracts', act: (s, inst) => { s.focus = 'dubois'; inst.mix?.(); } },
      { label: 'McElroy: add ATP', act: (s, inst) => { s.focus = 'mcelroy'; inst.atp?.(); } },
    ] },
    { key: 'water', type: 'toggle', label: 'Water the tobacco plant with luciferin' },
  ],
  quiz: [
    { q: 'What did Boyle find when he pumped the air out of a jar of glowing wood?', options: ['It glowed brighter', 'The glow faded, and came back when air was let in', 'It caught fire', 'Nothing changed'], answer: 1, why: 'Living light needs oxygen from the air.' },
    { q: 'Why did Dubois’s boiled extract not glow on its own?', options: ['Boiling destroyed the luciferin', 'Boiling destroyed the fragile enzyme, luciferase, but left luciferin', 'It had no water', 'It was too hot to see'], answer: 1, why: 'The enzyme is destroyed by heat. Mixed with a cold extract that still had enzyme, the light came back.' },
    { q: 'What made the glowing tobacco plant of 1986 possible?', options: ['Painting the leaves', 'Putting the firefly luciferase gene into the plant', 'Feeding it fireflies', 'Growing it in the dark'], answer: 1, why: 'The plant made firefly luciferase from the added gene, and glowed when given luciferin.' },
  ],
  reel: [
    { ms: 4800, caption: 'In 1986 a tobacco plant carrying the firefly gene glowed in the dark.', set: { focus: 'tobacco' }, anim: { water: [false, true] }, view: { pos: [0.2, 3.0, 7.0], target: [0, 2.2, 0] }, spin: 0.3 },
  ],

  build({ stage }) {
    nightLook(stage, 0x080a10, 20, 50, 0.6);
    const root = new THREE.Group(); stage.root.add(root);
    const gt = glowTexture();
    const bench = box(9, 0.3, 4, M.matte(0x3b2a1e)); bench.position.y = 0.15; root.add(bench);
    const G = { boyle: new THREE.Group(), dubois: new THREE.Group(), mcelroy: new THREE.Group(), tobacco: new THREE.Group() };
    for (const k in G) root.add(G[k]);
    const L = (h, p, par, c = '') => stage.label(h, p, par, c);

    // ---------------------------------------------------------------- Boyle
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.1, 40), M.metal(0x9a8a60)); plate.position.y = 0.35; G.boyle.add(plate);
    const jar = latheX([[0, 0], [0.05, 0.5], [0.35, 1.1], [2.2, 1.2], [2.6, 0.9], [2.85, 0.4], [2.95, 0.12], [3.0, 0]], M.clear(0xe6f6ff, 0.18), { seg: 48 }); jar.rotation.z = Math.PI / 2; jar.position.y = 0.4; G.boyle.add(jar);
    const woodM = new THREE.MeshStandardMaterial({ color: 0x5a4632, emissive: FOX, emissiveIntensity: 1, roughness: 0.9 });
    const wood = box(1.1, 0.35, 0.5, woodM); wood.position.set(0, 0.6, 0); wood.rotation.y = 0.3; G.boyle.add(wood);
    const woodGlow = glowSprite(gt, FOX, 2.4); woodGlow.position.set(0, 0.8, 0.2); G.boyle.add(woodGlow);
    const pipe = beam([1.4, 0.35, 0], [3.2, 0.35, 0], 0.08, M.metal(0x9a8a60), 10); G.boyle.add(pipe);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 2.2, 24), M.metal(0x9a8a60)); barrel.position.set(3.4, 1.4, 0); G.boyle.add(barrel);
    const handle = beam([3.4, 2.5, 0], [3.4, 3.2, 0], 0.05, M.matte(0x3b2a1e), 8); G.boyle.add(handle);
    const air = []; for (let i = 0; i < 40; i++) { const a = sphere(0.04, M.ghost(0xcfe8ff, 0.6), 6); a.userData = { x: (Math.random() - 0.5) * 1.8, y: 0.6 + Math.random() * 2.2, z: (Math.random() - 0.5) * 1.8, p: Math.random() * 7 }; G.boyle.add(a); air.push(a); }
    const bl = { jar: L('Glass jar (receiver)', [-1.4, 3.3, 0], G.boyle), wood: L('Glowing rotten wood', [0, 1.35, 1.1], G.boyle, 'hot'), pump: L('Air pump', [3.4, 3.5, 0], G.boyle) };

    // ---------------------------------------------------------------- Dubois
    const cold = testTube(-1.4), hot = testTube(0.0), mixT = testTube(1.6);
    [cold, hot, mixT].forEach((tt) => G.dubois.add(tt.g));
    const flame = glowSprite(gt, 0xff8a3a, 0.8); flame.position.set(0.0, 0.7, 0.2); G.dubois.add(flame);
    const dl = { cold: L('Cold-water extract: glowed, then faded', [-1.6, 3.05, 0], G.dubois), hot: L('Boiled extract: never glowed', [0.0, 0.55, 0.9], G.dubois), mix: L('Mixed: light again!', [1.8, 3.05, 0], G.dubois, 'hot') };
    let mixT0 = -1;

    // ---------------------------------------------------------------- McElroy
    const spent = testTube(-0.4);
    G.mcelroy.add(spent.g);
    const pip = new THREE.Group(); const pb = beam([0, 0, 0], [0, 1.2, 0], 0.05, M.clear(0xe6f6ff, 0.5), 10); const bulbP = sphere(0.14, M.plastic(0xff6a5a)); bulbP.position.y = 1.3; pip.add(pb, bulbP); G.mcelroy.add(pip);
    const drop = sphere(0.05, M.plastic(0xc49bff)); G.mcelroy.add(drop);
    const flies = []; for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.14, 4, 8), M.matte(0x2a2420)); f.rotation.z = Math.PI / 2; f.position.set(1.6 + (i % 3) * 0.22, 0.38, -0.4 + Math.floor(i / 3) * 0.25); G.mcelroy.add(f); flies.push(f); }
    const ml = { tube: L('Spent lantern extract', [-0.4, 0.55, 0.9], G.mcelroy), atp: L('A drop of ATP', [0.6, 3.6, 0], G.mcelroy, 'hot'), flies: L('Dried firefly lanterns', [1.8, 0.75, -0.2], G.mcelroy) };
    let atpT = -1;

    // ---------------------------------------------------------------- Tobacco
    const pot = latheX([[0, 0.45], [0.05, 0.55], [0.8, 0.7], [0.85, 0.75]], M.matte(0x9a5a3a), { seg: 32 }); pot.rotation.z = Math.PI / 2; pot.position.y = 0.3; G.tobacco.add(pot);
    const stem = beam([0, 1.1, 0], [0, 3.6, 0], 0.06, M.matte(0x3a6a2a), 8); G.tobacco.add(stem);
    const leafM = new THREE.MeshStandardMaterial({ color: 0x3f7a35, emissive: FLY_HEX, emissiveIntensity: 0, side: THREE.DoubleSide, roughness: 0.7 });
    const leaves = [];
    for (let i = 0; i < 8; i++) {
      const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.bezierCurveTo(0.35, 0.25, 0.9, 0.3, 1.3, 0); sh.bezierCurveTo(0.9, -0.3, 0.35, -0.25, 0, 0);
      const lf = new THREE.Mesh(new THREE.ShapeGeometry(sh, 12), leafM); const y = 1.3 + i * 0.3, a = i * 2.4, sc = 1.2 - i * 0.08;
      lf.position.set(0, y, 0); lf.rotation.set(-0.5, a, 0.35); lf.scale.setScalar(sc); G.tobacco.add(lf); leaves.push(lf);
    }
    const plantGlow = glowSprite(gt, FLY_HEX, 4.5); plantGlow.position.set(0, 2.3, 0.3); G.tobacco.add(plantGlow);
    const tl = { plant: L('Tobacco with the firefly luciferase gene', [0, 4.1, 0], G.tobacco, 'hot') };

    const focus = focuser(stage, G, VIEWS);
    const fixView = viewFixer(stage, this.view);
    let t = 0, coldK = 1, mixK = 0, spentK = 0, leafK = 0;
    const inst = {
      mix() { mixT0 = 0; coldK = 1; },
      atp() { atpT = 0; spentK = 0; },
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        reelZoom(stage, 1.5); fixView();
        focus(s.focus);
        const narrow = layoutOf(stage) === 'narrow';
        // Boyle: glow follows the air left.
        const a = clamp(s.air, 0, 1);
        woodM.emissiveIntensity = 0.05 + 1.4 * a; woodGlow.material.opacity = a; woodGlow.visible = a > 0.02;
        air.forEach((p, i) => { p.visible = i < Math.round(40 * a); const u = p.userData; p.position.set(u.x + Math.sin(t + u.p) * 0.1, u.y + Math.cos(t * 1.3 + u.p) * 0.1, u.z); });
        handle.position.y = Math.sin(t * 4) * 0.25 * (a < 0.98 && a > 0.02 ? 1 : 0);
        bl.jar.visible = !narrow;
        // Dubois: the cold extract fades; mixing brings light back.
        coldK = approach(coldK, 0.08, 0.25, dt);
        cold.lm.emissiveIntensity = coldK * 2.5;
        hot.lm.emissiveIntensity = 0;
        if (mixT0 >= 0) mixT0 += dt;
        mixK = mixT0 < 0 ? 0 : mixT0 < 0.6 ? mixT0 / 0.6 : Math.max(0.15, 1 - (mixT0 - 0.6) * 0.08);
        mixT.lm.emissiveIntensity = mixK * 3;
        mixT.liq.scale.y = mixT0 < 0 ? 0.05 : 1; mixT.liq.position.y = mixT0 < 0 ? 0.17 : 0.55;
        flame.material.opacity = 0.6 + 0.3 * Math.sin(t * 20);
        dl.mix.visible = mixT0 > 0.4; dl.hot.visible = !narrow;
        // McElroy: drop ATP, the spent extract lights up.
        if (atpT >= 0) atpT += dt;
        const dk = clamp(atpT / 0.8, 0, 1);
        pip.position.set(-0.4, 2.6 + (atpT < 0 ? 0.3 : 0), 0);
        drop.visible = atpT >= 0 && atpT < 0.8; drop.position.set(-0.4, 2.6 - dk * 1.2, 0);
        spentK = approach(spentK, atpT > 0.8 ? 1 : 0, 6, dt);
        if (atpT > 6) spentK = approach(spentK, 0.2, 0.5, dt);
        spent.lm.emissiveIntensity = 0.04 + spentK * 3;
        ml.atp.visible = atpT < 0 || atpT < 1; ml.flies.visible = !narrow;
        // Tobacco: glows with luciferin.
        leafK = approach(leafK, s.water ? 1 : 0, 1.5, dt);
        leafM.emissiveIntensity = leafK * 0.4; plantGlow.material.opacity = leafK * 0.7; plantGlow.visible = leafK > 0.02;
        leaves.forEach((lf, i) => { lf.rotation.x = -0.5 + Math.sin(t * 0.8 + i) * 0.04; });
      },
      readout: (s) => {
        if (s.focus === 'boyle') return `<div class="big">${s.air < 0.1 ? 'Dark: no air' : s.air > 0.9 ? 'Glowing in air' : 'Fading as air is pumped out'}</div>
          <div class="row"><span>When</span><b>late 1667, Oxford</b></div>
          <div class="row"><span>Who</span><b>Robert Boyle</b></div>
          <div class="row"><span>Found</span><b>living light needs air</b></div>
          <small>Boyle used shining wood and fish (their glow comes from fungi and bacteria). Phil Trans 1668.</small>`;
        if (s.focus === 'dubois') return `<div class="big">Luciferin + luciferase</div>
          <div class="row"><span>Who</span><b>Raphaël Dubois, France</b></div>
          <div class="row"><span>Animals</span><b>a click beetle, then the clam Pholas</b></div>
          <div class="row"><span>Names coined</span><b>1885 to 1887 (sources differ)</b></div>
          <small>Boiling destroys the enzyme (luciferase) but leaves the fuel (luciferin).</small>`;
        if (s.focus === 'mcelroy') return `<div class="big">${spentK > 0.5 ? 'ATP brings the light back' : 'A spent extract: dark'}</div>
          <div class="row"><span>Who</span><b>William McElroy, Johns Hopkins</b></div>
          <div class="row"><span>When</span><b>1947 (PNAS)</b></div>
          <div class="row"><span>Next</span><b>luciferin’s structure, 1961</b></div>
          <small>ATP is needed to prime luciferin; the photon’s energy comes from the oxygen step.</small>`;
        return `<div class="big">${s.water ? 'A glowing plant' : 'A plant with a firefly gene'}</div>
          <div class="row"><span>Gene copied (cloned)</span><b>1985, Photinus pyralis</b></div>
          <div class="row"><span>Glowing tobacco</span><b>Science, 14 Nov 1986</b></div>
          <div class="row"><span>Team</span><b>Ow, de Wet, Wood, DeLuca and others</b></div>
          <small>The plants made luciferase and glowed when given luciferin.</small>`;
      },
    };
    return inst;
  },
};
