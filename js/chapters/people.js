// Chapter 5: fireflies and people. Three scenes:
// 1. Light at night: a street lamp beside a meadow. Inside its pool of light, courting pairs stop
//    flashing and fail to meet. Sources: Lewis et al. 2020, "A global perspective on firefly extinction
//    threats", BioScience 70: 157 (experts ranked habitat loss first, then artificial light at night,
//    then pesticides; light ranked first in East Asia and South America; read in press releases and
//    the abstract). Owens & Lewis 2022 (Royal Society Open Science): direct artificial light completely
//    prevented mating in Photinus obscurellus in the lab; field effects varied by species (search summary).
//    The lamp's reach in the picture is a labelled toy.
// 2. ATP hygiene test: a swab of a surface is mixed with luciferin and luciferase. Any ATP left by food
//    or microbes makes light, read as relative light units (RLU). More ATP, more light; a high reading
//    means poor cleaning, not proof of germs, and pass marks vary by kit (Infection Control Today; a 2016
//    ARIC study; search summaries). The light count here is proportional to the dirt slider, in made-up
//    units: no real kit's scale.
// 3. Larva: firefly larvae hunt snails, slugs and worms, follow slime trails, and inject digestive juice
//    through hollow jaws (Wikipedia "Firefly"; Texas A&M extension; search summaries).
import { THREE, M, approach, clamp, box, sphere, beam } from '../kit.js';
import { setNight, Firefly, makeLarva, glowTexture, glowSprite, glowPoints, grassPatch, nightLook, FLY_GREEN, FLY_HEX, board, panel, head, txt, wrap, COL, layoutOf, fitBoard, reelZoom, viewFixer, focuser, TAU } from '../fly.js';

const VIEWS = {
  light: { pos: [1.0, 3.3, 9.6], target: [0.8, 1.9, 0], narrow: { pos: [-0.8, 3.0, 9.0], target: [-0.8, 1.7, 0] } },
  atp: { pos: [1.2, 3.6, 7.6], target: [1.0, 1.8, 0], narrow: { pos: [0.0, 3.6, 8.6], target: [0.0, 1.9, 0] } },
  larva: { pos: [1.0, 2.6, 6.2], target: [0.8, 0.6, 0], narrow: { pos: [0.0, 2.8, 7.4], target: [0.0, 0.8, 0] } },
};
const NP = 30;

export default {
  id: 'people',
  short: 'Fireflies and people',
  title: 'Fireflies and people',
  subtitle: 'Why fireflies are vanishing, how their enzyme checks hospital surfaces, and what the babies eat.',
  view: VIEWS.light,
  learn: `<p>In many places people say there are fewer fireflies than when they were children. Proper counts are rare, but in 2020 a team led by <b>Sara Lewis</b> asked firefly experts around the world what threatens them most. Their answer: first <b>habitat loss</b>, as meadows, wetlands and mangroves are built over; second <b>light at night</b>; third <b>pesticides</b>. In East Asia and South America, light pollution came first.</p>
    <p>Light matters because fireflies talk in light. A street lamp, a shop sign or a phone screen makes the night too bright for the flashes to stand out, and in experiments, artificial light stopped some fireflies mating altogether. Turning off lights you do not need, and pointing outdoor lights down, helps. Larvae also live for months or even two years in soil, leaf litter or water, so pesticides on lawns and fields reach them.</p>
    <p>Fireflies have also helped people. Because the reaction needs <b>ATP</b>, and every living cell has ATP, luciferase is a quick test for leftover life. Food factories and hospitals wipe a <b>swab</b> over a surface, mix it with luciferin and luciferase, and measure the glow. A bright glow means the surface was not properly cleaned. In biology labs the <b>luciferase gene</b> is joined to other genes as a <b>reporter</b>, so a cell lights up when that gene switches on.</p>
    <p>Baby fireflies are fierce. The <b>larvae</b>, often called glow-worms (see <a href="/glowwormclear/">GlowwormClear</a>), hunt <b>snails</b>, slugs and worms. They follow a slime trail, bite with hollow, sickle-shaped jaws, and inject juices that turn the prey to soup, which they drink. Most larvae glow too, probably as a warning: fireflies taste bad.</p>
    <p class="tip"><b>Try it:</b> turn the street lamp up and count the couples that fail. Then swab a dirty kitchen counter, and set a larva on a snail’s trail.</p>`,
  terms: [
    { t: 'Habitat loss', d: 'When the places an animal needs to live are destroyed or changed.' },
    { t: 'Artificial light at night', d: 'Light from lamps, signs and screens that makes nights brighter than nature does.' },
    { t: 'ATP test', d: 'A hygiene check that uses luciferase to make light from any ATP left on a surface.' },
    { t: 'Reporter gene', d: 'A gene, such as luciferase, joined to another so you can see when that gene is switched on.' },
    { t: 'Larva', d: 'The young stage of an insect. Firefly larvae are predators that often glow.' },
  ],
  defaults: { focus: 'light', lamp: 0.7, dirt: 0.6, hunt: true },
  onChange(s, key) { if (key === 'lamp') s.focus = 'light'; if (key === 'dirt' || key === 'action') s.focus = 'atp'; if (key === 'hunt') s.focus = 'larva'; },
  controls: [
    { key: 'focus', type: 'seg', label: 'Look at', options: [{ v: 'light', label: 'Light at night' }, { v: 'atp', label: 'ATP test' }, { v: 'larva', label: 'Larva' }] },
    { key: 'lamp', type: 'range', label: 'Street lamp brightness', min: 0, max: 1, step: 0.01, fmt: (v) => (v < 0.02 ? 'off' : Math.round(v * 100) + '%') },
    { key: 'dirt', type: 'range', label: 'How dirty the counter is', min: 0, max: 1, step: 0.01, ends: ['just cleaned', 'after cooking'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'swabBtn', type: 'buttons', label: 'ATP test', items: [{ label: 'Swab and read', act: (s, inst) => inst.swab?.() }] },
    { key: 'hunt', type: 'toggle', label: 'Larva follows the slime trail' },
  ],
  quiz: [
    { q: 'What did firefly experts rank as the biggest threat overall in 2020?', options: ['Climate change', 'Habitat loss', 'Bird predators', 'Tourism'], answer: 1, why: 'Lewis and colleagues found habitat loss first, then light at night, then pesticides.' },
    { q: 'How does an ATP hygiene test use the firefly reaction?', options: ['It counts fireflies', 'Luciferase makes light from any ATP left by food or microbes on a surface', 'It heats the surface', 'It kills germs with light'], answer: 1, why: 'All living cells contain ATP, so leftover dirt or microbes make the swab glow.' },
    { q: 'What do most firefly larvae eat?', options: ['Nectar', 'Leaves', 'Snails, slugs and worms', 'Other adults'], answer: 2, why: 'They are predators that inject digestive juices into soft prey and drink the result.' },
  ],
  reel: [
    { ms: 5000, caption: 'Habitat loss, light at night and pesticides are the biggest threats to fireflies.', set: { focus: 'light' }, anim: { lamp: [0, 1] }, view: { pos: [0.4, 4.2, 12.0], target: [0, 2.2, 0] }, spin: 0 },
  ],

  build({ stage }) {
    nightLook(stage, 0x05080d, 22, 60);
    const root = new THREE.Group(); stage.root.add(root);
    const gt = glowTexture();
    const G = { light: new THREE.Group(), atp: new THREE.Group(), larva: new THREE.Group() };
    for (const k in G) root.add(G[k]);
    const L = (h, p, par, c = '') => stage.label(h, p, par, c);

    // ---------------------------------------------------------------- 1. light at night
    grassPatch(G.light, 10, 300, 11);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(20, 2.2), M.matte(0x1c1e22)); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.012, 3.6); G.light.add(road);
    const pole = beam([-2.4, 0, 2.8], [-2.4, 4.6, 2.8], 0.07, M.metal(0x5a5f68), 10); G.light.add(pole);
    const arm = beam([-2.4, 4.6, 2.8], [-1.6, 4.6, 2.2], 0.05, M.metal(0x5a5f68), 8); G.light.add(arm);
    const bulbM = M.glow(0xffd9a0); const bulb = sphere(0.16, bulbM); bulb.position.set(-1.6, 4.5, 2.2); G.light.add(bulb);
    const halo = glowSprite(gt, 0xffd9a0, 3); halo.position.copy(bulb.position); G.light.add(halo);
    const coneM = new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    const cone = new THREE.Mesh(new THREE.ConeGeometry(4.2, 4.5, 32, 1, true), coneM); cone.position.set(-1.6, 2.25, 2.2); G.light.add(cone);
    const lampLight = new THREE.PointLight(0xffd9a0, 0, 16, 1.2); lampLight.position.copy(bulb.position); G.light.add(lampLight);
    const pairs = Array.from({ length: NP }, (_, i) => { const a = i * 2.39996, r = 1 + Math.sqrt((i * 0.618) % 1) * 7.5; return { x: -1.6 + Math.cos(a) * r, z: Math.sin(a) * r * 0.7 - 0.4, ph: (i * 0.73) % 1 * 5.9, met: 0 }; }).filter((p) => p.z < 2.3);
    const pp = glowPoints(pairs.length * 2, gt, 0.75); G.light.add(pp);
    const lampR = (k) => 1.0 + 4.2 * Math.sqrt(k);
    const ll = { lamp: L('Street lamp', [-2.4, 5.1, 2.8], G.light), dark: L('No answers in the light', [0, 0, 0], G.light, 'hot'), ok: L('Couples still talking in the dark', [2.6, 0.5, -1.0], G.light) };
    const thb = board(G.light, 4.0, 2.6, 680, 440, (gx, w, h) => {
      panel(gx, w, h); head(gx, 'Biggest threats, as ranked by experts', 'Lewis et al. 2020, BioScience');
      [['1', 'Habitat loss', COL.down], ['2', 'Light at night (first in East Asia and South America)', COL.gold], ['3', 'Pesticides', COL.violet]].forEach(([n, s, c], i) => {
        const y = 120 + i * 92; gx.fillStyle = c; gx.beginPath(); gx.arc(46, y, 24, 0, TAU); gx.fill(); txt(gx, n, 38, y + 8, '#111', 'bold 24px sans-serif');
        wrap(gx, s, 88, y + 7, w - 110, 26, COL.text, '21px sans-serif');
      });
      txt(gx, 'Other threats included climate change and tourism.', 22, h - 26, COL.soft, '17px sans-serif');
    }, [5.2, 2.6, -1]);

    // ---------------------------------------------------------------- 2. ATP test
    const counter = box(5.2, 0.25, 2.6, M.plastic(0xd9dde3)); counter.position.set(-0.6, 0.9, 0); G.atp.add(counter);
    const legs = [[-3, -1.1], [1.8, -1.1], [-3, 1.1], [1.8, 1.1]].map(([x, z]) => { const l = box(0.15, 0.8, 0.15, M.metal(0x8c939c)); l.position.set(x, 0.4, z); G.atp.add(l); return l; });
    const crumbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.035, 6, 4), M.matte(0xb08850), 160); const o = new THREE.Object3D();
    for (let i = 0; i < 160; i++) { o.position.set(-2.6 + (i * 0.618 % 1) * 3.6, 1.04, -1 + (i * 0.377 % 1) * 2); o.updateMatrix(); crumbs.setMatrixAt(i, o.matrix); }
    G.atp.add(crumbs);
    const swab = new THREE.Group(); const stick = beam([0, 0, 0], [0, 1.4, 0], 0.03, M.plastic(0xf2f2f2), 8); const tip = sphere(0.08, M.matte(0xf6f0e0)); swab.add(stick, tip); G.atp.add(swab);
    const tubeM = M.clear(0xe6f6ff, 0.35); const tubeG = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.2, 20, 1, true), tubeM); tubeG.position.set(2.6, 2.0, 0.4); G.atp.add(tubeG);
    const liquidM = new THREE.MeshStandardMaterial({ color: 0xf0f4d0, emissive: FLY_HEX, emissiveIntensity: 0, transparent: true, opacity: 0.85 });
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.5, 20), liquidM); liquid.position.set(2.6, 1.65, 0.4); G.atp.add(liquid);
    const tubeGlow = glowSprite(gt, FLY_HEX, 1.6); tubeGlow.position.set(2.6, 1.7, 0.6); G.atp.add(tubeGlow);
    const meter = box(1.0, 1.6, 0.5, M.plastic(0x2b3140)); meter.position.set(2.6, 1.85, -0.25); G.atp.add(meter);
    const screen = board(G.atp, 0.8, 0.5, 320, 200, (gx, w, h, v) => { gx.fillStyle = '#0d1a12'; gx.fillRect(0, 0, w, h); txt(gx, 'light count', 18, 44, '#7fd99a', '26px monospace'); txt(gx, v == null ? '----' : String(v), 18, 140, '#b8ffcc', 'bold 70px monospace'); }, [2.6, 2.3, 0.01]);
    const al = { counter: L('Kitchen counter', [-2.6, 1.4, 1.4], G.atp), swab: L('Swab', [0, 0, 0], G.atp), tube: L('Swab + luciferin + luciferase', [2.6, 3.0, 0.4], G.atp, 'hot') };
    let swabT = -1, reading = null;

    // ---------------------------------------------------------------- 3. larva and snail
    const leafy = new THREE.Mesh(new THREE.CircleGeometry(5, 40), M.matte(0x22301c)); leafy.rotation.x = -Math.PI / 2; G.larva.add(leafy);
    const larva = makeLarva(gt); larva.group.scale.setScalar(0.8); G.larva.add(larva.group);
    const snail = new THREE.Group(); G.larva.add(snail);
    const foot = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 1.2, 6, 14), M.plastic(0xa08a70)); foot.rotation.z = Math.PI / 2; foot.scale.set(1, 1, 0.7); foot.position.y = 0.18; snail.add(foot);
    const shellPts = []; for (let i = 0; i <= 120; i++) { const u = i / 120, a = u * 3.2 * TAU, r = 0.08 + 0.42 * u; shellPts.push(new THREE.Vector3(Math.cos(a) * r, 0.75 + Math.sin(a) * r, (1 - u) * 0.25)); }
    const shell = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(shellPts), 240, 0.12, 10), M.plastic(0x8a5a30)); shell.position.x = -0.1; snail.add(shell);
    const horns = [-0.12, 0.12].map((z) => { const h = beam([0.75, 0.3, z], [1.0, 0.65, z * 1.6], 0.025, M.plastic(0xa08a70), 6); snail.add(h); return h; });
    const slime = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.35), new THREE.MeshBasicMaterial({ color: 0x9fc6d8, transparent: true, opacity: 0.25, depthWrite: false })); slime.rotation.x = -Math.PI / 2; slime.position.set(-1.0, 0.01, 0); G.larva.add(slime);
    const lvl = { larva: L('Firefly larva', [0, 0, 0], G.larva, 'hot'), snail: L('Snail', [0, 0, 0], G.larva), trail: L('Slime trail', [-3.2, 0.25, 0.4], G.larva) };
    let lx = -3.4, bite = 0;

    const focus = focuser(stage, G, VIEWS);
    const fixView = viewFixer(stage, this.view);
    let t = 0, fails = 0, total = 0, shownFail = 0;
    const inst = {
      swab() { swabT = 0; reading = null; },
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        reelZoom(stage, 1.4); fixView();
        focus(s.focus);
        setNight(stage, s.focus === 'atp' ? 0.75 : s.focus === 'larva' ? 0.55 : 0.22);
        const lay = layoutOf(stage), narrow = lay === 'narrow';
        if (s.focus === 'light') {
          fitBoard(stage, thb.mesh, lay === 'tall' ? [0.6, 7.0, -1] : [6.0, 3.0, -1.6], lay === 'tall' ? 0.9 : 1);
          const k = s.lamp, R = k > 0.02 ? lampR(k) : 0;
          bulbM.color.setHex(k > 0.02 ? 0xffd9a0 : 0x333333); halo.visible = cone.visible = k > 0.02; halo.material.opacity = k; coneM.opacity = 0.03 + 0.1 * k; cone.scale.set(R / 4.2 || 0.01, 1, R / 4.2 || 0.01);
          lampLight.intensity = k * 30;
          fails = 0; total = pairs.length;
          pairs.forEach((p, i) => {
            const inLight = Math.hypot(p.x + 1.6, p.z - 2.2) < R;
            if (inLight) fails++;
            p.ph += dt; if (p.ph > 5.9) p.ph -= 5.9;
            const m = p.ph < 0.5 ? Math.sin(Math.PI * p.ph / 0.5) : 0;
            const fd = p.ph - 2.0, f = fd > 0 && fd < 0.35 ? Math.sin(Math.PI * fd / 0.35) : 0;
            pp.set(2 * i, p.x, 1.1 + Math.sin(t * 0.5 + i) * 0.2, p.z, FLY_GREEN, 0.1 + (inLight ? m * 0.25 : m));
            pp.set(2 * i + 1, p.x + 0.4, 0.15, p.z + 0.2, FLY_GREEN, 0.08 + (inLight ? 0 : f));
          });
          pp.done();
          shownFail = approach(shownFail, total ? fails / total : 0, 5, dt);
          ll.dark.visible = R > 0 && !narrow; ll.dark.position.set(-1.6, 0.6, 2.2 - Math.min(R, 3) * 0.6);
          ll.ok.visible = !narrow;
        } else if (s.focus === 'atp') {
          // Swab path: down to the counter, wipe, up and into the tube; then read.
          if (swabT >= 0) swabT += dt;
          const st = swabT < 0 ? -1 : swabT;
          let x = -1.2, y = 1.9, z = 0.6, glow = 0;
          if (st >= 0 && st < 0.8) { y = 1.9 - 0.85 * (st / 0.8); }
          else if (st >= 0.8 && st < 2.0) { y = 1.05; x = -1.2 - 1.2 * Math.sin((st - 0.8) * 5); }
          else if (st >= 2.0 && st < 3.2) { const k = (st - 2.0) / 1.2; x = -1.2 + 3.8 * k; y = 1.05 + 1.6 * Math.sin(Math.PI * k * 0.8) + k * 0.55; z = 0.6 - 0.2 * k; }
          else if (st >= 3.2) { x = 2.6; y = 1.75; z = 0.4; glow = clamp((st - 3.2) / 0.6, 0, 1); if (reading == null && st > 3.6) reading = Math.round(20 + 4000 * s.dirt * s.dirt + 600 * s.dirt); }
          swab.position.set(x, y - 0.05, z);
          const lum = glow * (0.05 + s.dirt);
          liquidM.emissiveIntensity = lum * 3; tubeGlow.material.opacity = clamp(lum, 0, 1); tubeGlow.visible = lum > 0.02;
          crumbs.count = Math.round(160 * s.dirt);
          screen.redraw(reading);
          al.swab.position.set(x - 0.4, y + 1.5, z); al.swab.visible = !narrow;
        } else {
          // Larva follows the trail towards the snail, bites, the snail pulls in its horns.
          if (s.hunt) lx = Math.min(-0.25, lx + dt * 0.45); else lx = approach(lx, -3.4, 1, dt);
          const near = lx > -0.4;
          bite = approach(bite, near ? 1 : 0, 2, dt);
          larva.group.position.set(lx - 0.9, 0, Math.sin(t * 2) * 0.03);
          larva.seg.forEach((m, i) => { m.position.y = m.scale.y * 0.5 + Math.sin(t * 6 - i * 0.7) * 0.015 * (s.hunt && !near ? 1 : 0); });
          const k = 0.4 + 0.3 * Math.sin(t * 1.7);
          larva.halo.material.opacity = k; larva.spots.forEach((m) => { m.material.color.setHex(FLY_HEX); });
          snail.position.set(0.85, 0, 0); snail.rotation.y = Math.PI;
          horns.forEach((h) => { h.scale.setScalar(Math.max(0.05, 1 - bite)); });
          foot.scale.set(1, 1 - 0.25 * bite, 0.7);
          lvl.larva.position.set(lx - 0.9, 0.7, 0.3); lvl.snail.position.set(0.85, 1.6, 0);
          lvl.larva.element.textContent = near ? 'Larva bites and injects digestive juice' : 'Larva following the slime trail';
          lvl.trail.visible = !narrow;
        }
      },
      readout: (s) => {
        if (s.focus === 'light') return `<div class="big">${Math.round(shownFail * 100)}% of couples can’t find each other</div>
          <div class="row"><span>Street lamp</span><b>${s.lamp < 0.02 ? 'off' : Math.round(s.lamp * 100) + '%'}</b></div>
          <div class="row"><span>Top threats (2020)</span><b>habitat, light, pesticides</b></div>
          <div class="row"><span>Lab test (one Photinus)</span><b>light stopped mating</b></div>
          <small>The lamp’s reach is a labelled toy picture. Threat ranking: Lewis et al. 2020. Lab result: Owens &amp; Lewis 2022.</small>`;
        if (s.focus === 'atp') return `<div class="big">${reading == null ? 'Press “Swab and read”' : reading + ' light units'}</div>
          <div class="row"><span>What makes the light</span><b>ATP from food or microbes</b></div>
          <div class="row"><span>Brighter means</span><b>dirtier surface</b></div>
          <div class="row"><span>Proves germs?</span><b>no: it shows leftover life</b></div>
          <small>Units here are made up and grow with the dirt slider. Real kits use relative light units (RLU) and set their own pass marks.</small>`;
        return `<div class="big">${bite > 0.5 ? 'Dinner' : 'On the trail'}</div>
          <div class="row"><span>Larval prey</span><b>snails, slugs, worms</b></div>
          <div class="row"><span>How it eats</span><b>hollow jaws inject digestive juice</b></div>
          <div class="row"><span>Why larvae glow</span><b>probably a warning: “I taste bad”</b></div>
          <small>Larvae of many species live for months to two years before they become adults.</small>`;
      },
    };
    return inst;
  },
};
