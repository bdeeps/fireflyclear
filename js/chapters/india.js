// Chapter 4: fireflies of India. A pre-monsoon night at a forest edge in the Western Ghats, where
// fireflies gather in trees, and the visitors who come to see them.
// Facts, with sources:
//  - India's first full checklist: 92 species in 27 genera, 60.86% found only in India, the Western
//    Ghats with the highest share (25.33%); over 50 species not recorded since first described (Parvez,
//    Chakravarthy, Keller, Gupta & Das 2026, Zootaxa 5768(2): 229–249; read in Mongabay India, Mar 2026,
//    and the journal listing). Coauthors include ZSI staff (search summaries only; Mongabay names no ZSI).
//  - Maharashtra firefly festivals before the monsoon at Bhandardara, Purushwadi, Rajmachi, Prabalwadi,
//    Bhimashankar, Harishchandragad, Malshej Ghat; concerns listed by botanist Madhukar Bachulkar: torch,
//    phone and vehicle lights, "crushing of female fireflies while capturing photos and videos", night
//    camping, catching fireflies in bottles, plastic litter; Kolhapur forest department stopped gatherings
//    in the forest after 10 pm; a wildlife warden asked that fireflies be watched from roadsides only,
//    since females are on the ground (Mongabay India, 1 July 2022, read in full).
//  - Anamalai Tiger Reserve, Tamil Nadu: a mass display "for a few days each summer"; species identified
//    by AIWC: Abscondita perplexa, Asymmetricata humeralis and Curtos sp. (Roundglass Sustain photo
//    story, read). Synchrony there reported since 1999 and 2012, genus Abscondita (search summaries of a
//    PetaPixel article we could not open: unverified).
//  - Light: all colours of artificial light tested suppressed courtship in Photinus obscurellus (Owens &
//    Lewis 2021, Insect Conservation and Diversity; search summary). We draw red light as disturbing a
//    smaller patch than white because the US National Park Service asks visitors to use red-covered
//    torches pointed at the ground; the patch sizes are a labelled toy, not measurements.
import { THREE, M, approach, clamp, beam } from '../kit.js';
import { Swarm, glowTexture, glowPoints, grassPatch, tree, nightLook, FLY_GREEN, layoutOf, reelZoom, viewFixer, TAU } from '../fly.js';

const TREES = [[-3.2, -1.5], [-1.0, -2.4], [1.4, -1.8], [3.6, -2.6], [-4.6, 1.2], [4.4, 0.6]];
const NF = 220, NFEM = 40, NV = 12;
const radiusOf = (l) => (l === 'white' ? 1.8 : l === 'red' ? 0.8 : 0);

export default {
  id: 'india',
  short: 'Fireflies of India',
  title: 'Fireflies of India',
  subtitle: 'Glowing trees of the Western Ghats, a synchronous show in Anamalai, and too many torches.',
  view: { pos: [0.8, 4.4, 12.5], target: [0.6, 2.2, 0], narrow: { pos: [0.0, 4.0, 10.5], target: [0.0, 2.2, 0] } },
  learn: `<p>India has at least <b>92 kinds</b> of firefly. That count comes from the country’s first full checklist, published in 2026, and about <b>six in ten</b> of them live nowhere else on Earth. The <b>Western Ghats</b> has the most, and more than 50 species have not been seen again since they were first described. Scientists say proper surveys are still missing.</p>
    <p>Just before the <b>monsoon</b>, usually around May and June, fireflies gather in their thousands in the hills of Maharashtra, at places like <b>Bhandardara</b>, <b>Purushwadi</b>, Rajmachi, Bhimashankar and Malshej Ghat. Whole trees twinkle. Villages run <b>firefly festivals</b>, which bring welcome money, and people come from Mumbai and Pune by the busload.</p>
    <p>That success is a problem. Botanists and forest officers list the harm: <b>torches, phone screens and headlights</b> drown out the flashes the fireflies use to find mates; people walking off the path <b>crush the females</b>, which often sit low on the ground; some camp in the forest at night or catch fireflies in bottles. The Kolhapur forest department stopped gatherings in the forest after <b>10 pm</b>, and a wildlife warden asked people to watch from the roadside.</p>
    <p>In the <b>Anamalai Tiger Reserve</b> in Tamil Nadu, scientists have reported a huge display for a few days each summer, with fireflies of the genus <i>Abscondita</i> and others. Some reports describe the trees flashing <b>in step</b>, like the synchronous fireflies of Southeast Asia. India’s mangroves, such as the <b>Sundarbans</b>, have firefly trees too, but we could not find a published study of synchrony there yet.</p>
    <p class="tip"><b>Try it:</b> add visitors with white torches and watch the dark patches spread. Switch to red light, then send people off the path and count the females.</p>`,
  terms: [
    { t: 'Endemic', d: 'Found naturally in one place and nowhere else.' },
    { t: 'Western Ghats', d: 'The long range of forested hills along India’s west coast, one of the world’s biodiversity hotspots.' },
    { t: 'Congregation', d: 'Fireflies gathering in large numbers in the same trees or bushes to display.' },
    { t: 'Light pollution', d: 'Artificial light where it is not needed, which can hide or confuse natural light signals.' },
    { t: 'Eco-tourism', d: 'Travel to see nature that is meant to protect it and help local people.' },
  ],
  defaults: { site: 'ghats', lights: 'white', visitors: 6, offpath: false },
  controls: [
    { key: 'site', type: 'seg', label: 'Place', options: [{ v: 'ghats', label: 'Bhandardara (Maharashtra)' }, { v: 'anamalai', label: 'Anamalai (Tamil Nadu)' }] },
    { key: 'visitors', type: 'range', label: 'Visitors on the trail', min: 0, max: 12, step: 1, fmt: (v) => String(v) },
    { key: 'lights', type: 'seg', label: 'Their lights', options: [{ v: 'none', label: 'Lights off' }, { v: 'red', label: 'Red, pointed down' }, { v: 'white', label: 'White torches and phones' }] },
    { key: 'offpath', type: 'toggle', label: 'Wander off the path', hint: 'Females often sit low in the grass and leaf litter.' },
  ],
  quiz: [
    { q: 'About how many kinds of firefly does India’s 2026 checklist list?', options: ['About 10', 'About 92', 'About 900', 'Over 2,000'], answer: 1, why: 'The checklist counts 92 species, around 60% of them found only in India.' },
    { q: 'Why are torches and phone screens a problem at firefly festivals?', options: ['They are noisy', 'Their light drowns out the flashes fireflies use to find mates', 'Fireflies are attracted and burned', 'They scare the trees'], answer: 1, why: 'Fireflies talk in light. Studies find artificial light suppresses their courtship flashing.' },
    { q: 'Why should visitors stay on the path?', options: ['To avoid snakes only', 'Females often sit low on the ground and are easily crushed', 'The fireflies follow the path', 'Paths are brighter'], answer: 1, why: 'Many females wait in the grass and leaf litter. Stepping off the path can kill the very insects people came to see.' },
  ],
  reel: [
    { ms: 5200, caption: 'Torches and phones drown out the flashes fireflies use to find a mate.', set: { site: 'ghats', lights: 'white', offpath: false }, anim: { visitors: [1, 12] }, view: { pos: [0.4, 5.6, 9.5], target: [0, 2.8, -1] }, spin: 0 },
  ],

  build({ stage }) {
    nightLook(stage, 0x04070c, 20, 48, 0.2);
    const root = new THREE.Group(); stage.root.add(root);
    const gt = glowTexture();
    grassPatch(root, 11, 360, 7);
    const path = new THREE.Mesh(new THREE.PlaneGeometry(22, 1.4), M.matte(0x2a2418)); path.rotation.x = -Math.PI / 2; path.position.set(0, 0.015, 2.2); root.add(path);
    const trees = TREES.map(([x, z], i) => { const t = tree(4.2 + (i % 3) * 0.6, 1.5 + (i % 2) * 0.3, 0x10241a); t.position.set(x, 0, z); root.add(t); return t; });
    // Fireflies in the trees (males displaying) and females low on the ground.
    const spots = [];
    for (let i = 0; i < NF; i++) { const t = trees[i % trees.length], u = t.userData, a = i * 2.39996, r = Math.sqrt((i * 0.618) % 1) * u.r * 1.15; spots.push([t.position.x + Math.cos(a) * r, u.h * 0.62 + ((i * 0.37) % 1 - 0.35) * u.r * 1.2, t.position.z + Math.sin(a) * r]); }
    const fem = []; for (let i = 0; i < NFEM; i++) { const a = i * 2.4, r = 2 + (i * 0.37 % 1) * 6; const x = Math.cos(a) * r, z = Math.sin(a) * r * 0.6 - 0.5; if (Math.abs(z - 2.2) < 0.9) continue; fem.push({ p: [x, 0.08, z], alive: true }); }
    const pts = glowPoints(NF + NFEM, gt, 0.6); pts.material.depthTest = false; root.add(pts);
    const SW = new Swarm(NF, 4);
    const ph = Array.from({ length: NF }, (_, i) => ({ t: (i * 0.7317) % 1 * 3, per: 0.8 + (i * 0.413 % 1) * 0.9 }));
    // Visitors: simple figures with a torch beam.
    const people = [];
    for (let i = 0; i < NV; i++) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.75, 4, 10), M.matte(0x2b3140)); body.position.y = 0.6; g.add(body);
      const hd = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8), M.matte(0x5a4636)); hd.position.y = 1.2; g.add(hd);
      const beamM = new THREE.MeshBasicMaterial({ color: 0xfff3d0, transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.9, 3.2, 20, 1, true), beamM); cone.position.set(0, 0.9, -1.4); cone.rotation.x = -Math.PI / 2 + 0.5; g.add(cone);
      const pool = new THREE.Mesh(new THREE.CircleGeometry(1, 28), new THREE.MeshBasicMaterial({ color: 0xfff3d0, transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending })); pool.rotation.x = -Math.PI / 2; pool.position.y = 0.03; root.add(pool);
      root.add(g); people.push({ g, cone, beamM, pool, x: -6 + i * 1.05, dir: i % 2 ? 1 : -1, off: 0 });
    }
    const L = (h, p, c = '') => stage.label(h, p, root, c);
    const tag = { trees: L('Males displaying in the trees', [3.0, 5.2, -2.4], 'hot'), path: L('Trail', [-5.5, 0.4, 2.2]), fem: L('Females low in the grass', [3.6, 0.5, -0.2]), dark: L('Dark where the light falls', [0, 0, 0], 'hot') };
    const fixView = viewFixer(stage, this.view);
    let t = 0, crushed = 0, shown = 1, lastSite = '';
    return {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        reelZoom(stage, 1.5); fixView();
        const narrow = layoutOf(stage) === 'narrow';
        if (s.site !== lastSite) { lastSite = s.site; SW.reset(NF, 4); crushed = 0; fem.forEach((f) => { f.alive = true; }); }
        const nv = Math.round(s.visitors), R = radiusOf(s.lights);
        const lit = [];
        people.forEach((p, i) => {
          const on = i < nv; p.g.visible = on; p.pool.visible = on && R > 0;
          if (!on) return;
          p.x += p.dir * dt * 0.35; if (p.x > 6.5) p.dir = -1; if (p.x < -6.5) p.dir = 1;
          p.off = approach(p.off, s.offpath ? -2.2 - (i % 3) * 1.2 : 0, 0.8, dt);
          p.g.position.set(p.x, 0, 2.2 + p.off); p.g.rotation.y = p.dir > 0 ? -0.5 : 0.5;
          p.cone.visible = R > 0; p.beamM.color.setHex(s.lights === 'red' ? 0xff3a2a : 0xfff3d0); p.beamM.opacity = s.lights === 'red' ? 0.07 : 0.1;
          const sweep = Math.sin(t * 0.6 + i) * 1.2;
          const hx = p.x + sweep, hz = p.g.position.z - (s.lights === 'red' ? 1.0 : 2.6), hy = s.lights === 'red' ? 0 : 2.2;
          p.pool.position.set(hx, 0.03, hz); p.pool.scale.setScalar(R * 0.8); p.pool.material.color.setHex(s.lights === 'red' ? 0xff3a2a : 0xfff3d0);
          if (R > 0) lit.push([hx, hy, hz]);
          if (s.offpath) fem.forEach((f) => { if (f.alive && Math.hypot(f.p[0] - p.g.position.x, f.p[2] - p.g.position.z) < 0.35) { f.alive = false; crushed++; } });
        });
        // Display: Ghats trees twinkle each on its own rhythm; Anamalai trees flash in step.
        let r = 0;
        if (s.site === 'anamalai') r = SW.step(dt, 7);
        let disp = 0;
        for (let i = 0; i < NF; i++) {
          const p = spots[i];
          let k;
          if (s.site === 'anamalai') k = SW.fl[i];
          else { const q = ph[i]; q.t += dt; if (q.t > q.per) q.t -= q.per; k = q.t < 0.3 ? Math.sin(Math.PI * q.t / 0.3) : 0; k = 0.06 + 0.94 * k; }
          let dark = false;
          for (const [x, y, z] of lit) { if (Math.hypot(p[0] - x, (p[1] - y) * 0.6, p[2] - z) < R * 1.4) { dark = true; break; } }
          if (dark) k *= 0.05; else disp++;
          pts.set(i, p[0], p[1], p[2], FLY_GREEN, k);
        }
        fem.forEach((f, i) => { const k = f.alive ? 0.35 + 0.25 * Math.sin(t * 1.3 + i) : 0; pts.set(NF + i, f.p[0], f.p[1], f.p[2], FLY_GREEN, k); });
        for (let i = NF + fem.length; i < NF + NFEM; i++) pts.set(i, 0, -50, 0, FLY_GREEN, 0);
        pts.done();
        shown = approach(shown, disp / NF, 4, dt);
        tag.dark.visible = lit.length > 0 && !narrow; if (lit.length) tag.dark.position.set(lit[0][0], lit[0][1] + 1.2, lit[0][2]);
        tag.fem.visible = !narrow; tag.path.visible = !narrow; tag.trees.visible = !narrow;
        tag.trees.element.textContent = s.site === 'anamalai' ? 'Trees flashing in step (Anamalai)' : 'Males displaying in the trees';
      },
      readout: (s) => `<div class="big">${Math.round(shown * 100)}% of the display still visible</div>
        <div class="row"><span>Females stepped on</span><b>${crushed}</b></div>
        <div class="row"><span>Species in India</span><b>92 (61% only here)</b></div>
        <div class="row"><span>Region with the most</span><b>Western Ghats</b></div>
        <div class="row"><span>Kolhapur forest rule</span><b>out by 10 pm</b></div>
        <small>Display share and crushed females are a labelled toy picture, not measurements. Checklist: Zootaxa 2026. Festival concerns: Mongabay India 2022.</small>`,
    };
  },
};
