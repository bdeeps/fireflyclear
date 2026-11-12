// Chapter 1: inside a firefly. A generic Photinus-like firefly (after the common eastern firefly
// Photinus pyralis), with an explode control, and beside it a magnified slice of the lantern.
// Lantern anatomy, with sources:
//  - Photocytes (light cells) are arranged in rosettes round "cylinders" that carry a tracheal trunk;
//    the trachea branches into tracheoles that run between the photocytes (Smith 1963, J Cell Biol,
//    Photuris pennsylvanica, PMC2106255).
//  - Behind them lies the reflector (dorsal) layer, whose cells are packed with uric-acid granules about
//    700 nm across (Goh et al. 2013, PLoS ONE 8: e56406, in the Taiwanese firefly Luciola cerata, PMC3575340).
//  - The nerves do not end on the photocytes but on the tracheal end cells; synapse-like vesicles sit
//    between tracheal end cells and tracheolar cells (Smith 1963; Ghiradella 1977, J Morphol).
//  - Size: Photinus pyralis is about 1 to 1.4 cm long (widely given; read only in search summaries).
//  - "More than 2,000 species" (NPS Great Smoky Mountains page); Wikipedia gives more than 2,400 described.
import { THREE, M, approach, clamp, beam, sphere } from '../kit.js';
import { toast } from '../ui.js';
import { Firefly, glowTexture, glowSprite, grassPatch, nightLook, FLY_HEX, FLY_GREEN, layoutOf, reelZoom, viewFixer, inReel } from '../fly.js';

const INFO = {
  pronotum: 'The <b>pronotum</b> is a shield over the head. In Photinus it is pale with a dark spot and pink patches.',
  elytra: 'The hard <b>elytra</b> are wing covers, like every beetle’s. Fireflies are beetles, not flies.',
  lantern: 'The <b>lantern</b> is on the underside of the last belly segments. Its cells make light with oxygen.',
  head: 'Big <b>eyes</b> watch for answering flashes. The <b>antennae</b> smell and feel.',
};

// A slice of the lantern, about 1,000 times bigger: cuticle window at the bottom (light goes out
// downwards), photocyte rosettes round tracheal cylinders, reflector layer of urate crystals above.
function lanternSlice(glowTex) {
  const g = new THREE.Group();
  const W = 3.4, D = 1.8;
  const cut = new THREE.Mesh(new THREE.BoxGeometry(W, 0.12, D), M.clear(0xf4f0d0, 0.45)); cut.position.y = 0.06; g.add(cut);
  const refl = new THREE.Group(); g.add(refl);
  const rb = new THREE.Mesh(new THREE.BoxGeometry(W, 0.42, D), M.plastic(0xf3f3ee, { roughness: 0.3 })); rb.position.y = 1.62; refl.add(rb);
  const urate = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), M.plastic(0xffffff, { roughness: 0.15 }), 220); const o = new THREE.Object3D();
  for (let i = 0; i < 220; i++) { o.position.set((Math.random() - 0.5) * W * 0.96, 1.42 + Math.random() * 0.04, (Math.random() - 0.5) * D * 0.96); o.updateMatrix(); urate.setMatrixAt(i, o.matrix); }
  refl.add(urate);
  const photocytes = [], cyl = [], glows = [];
  const pcMat = new THREE.MeshStandardMaterial({ color: 0xe8e2a8, emissive: FLY_HEX, emissiveIntensity: 0.2, roughness: 0.6, transparent: true, opacity: 0.92 });
  for (const [cx, cz] of [[-0.9, 0], [0.9, 0]]) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.3, 18), M.plastic(0x9fc6ff, { transparent: true, opacity: 0.7 })); c.position.set(cx, 0.78, cz); g.add(c); cyl.push(c);
    for (let k = 0; k < 7; k++) {   // a rosette of wedge-shaped photocytes round the cylinder
      const a = (k / 7) * Math.PI * 2;
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.2, 12, 1, false, a + 0.05, Math.PI * 2 / 7 - 0.1), pcMat);
      w.position.set(cx, 0.75, cz); g.add(w); photocytes.push(w);
    }
    const s = glowSprite(glowTex, FLY_HEX, 1.8); s.position.set(cx, 0.5, cz + 0.5); g.add(s); glows.push(s);
    // Tracheoles branching out between the photocytes.
    for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2; g.add(beam([cx, 0.95, cz], [cx + Math.cos(a) * 0.46, 0.5 + (k % 3) * 0.15, cz + Math.sin(a) * 0.46], 0.022, M.glow(0x9fc6ff), 6)); }
  }
  const trachea = beam([-1.7, 1.25, 0], [1.7, 1.25, 0], 0.09, M.plastic(0x9fc6ff), 12); g.add(trachea);
  const nerve = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-1.9, 2.2, 0.4), new THREE.Vector3(-1.4, 1.6, 0.5), new THREE.Vector3(-0.95, 1.3, 0.3)]), 30, 0.035, 6), M.glow(0xffb547)); g.add(nerve);
  const end = sphere(0.09, M.glow(0xffb547)); end.position.set(-0.95, 1.3, 0.25); g.add(end);
  const rays = [];
  for (let i = 0; i < 6; i++) { const r = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.5, 8), M.glow(FLY_HEX, { transparent: true, opacity: 0 })); r.rotation.x = Math.PI; r.position.set(-1.4 + i * 0.56, -0.35, 0.3); g.add(r); rays.push(r); }
  const frame = new THREE.Mesh(new THREE.BoxGeometry(W + 0.05, 1.9, D + 0.05), M.ghost(0x8ef0ff, 0.05)); frame.position.y = 0.95; g.add(frame);
  return { g, pcMat, glows, rays };
}

export default {
  id: 'anatomy',
  short: 'Inside a firefly',
  title: 'Inside a firefly',
  subtitle: 'A beetle with a lamp in its tail: light cells, air tubes, a mirror and nerves.',
  view: { pos: [1.4, 2.5, 8.0], target: [1.2, 1.75, 0], narrow: { pos: [1.0, 2.3, 6.6], target: [1.0, 1.8, 0] } },
  learn: `<p>A firefly is not a fly at all. It is a <b>beetle</b>, with hard wing covers (<b>elytra</b>) over a pair of thin flying wings, like a ladybird. There are more than <b>2,000 kinds</b> worldwide. This one is modelled on the common eastern firefly <i>Photinus pyralis</i>, a little over a centimetre long. A pale shield called the <b>pronotum</b> hides its head, and big eyes watch for flashes.</p>
    <p>The light comes from the <b>lantern</b>, on the underside of the last belly segments. Seen under a microscope, the lantern is packed with light cells, the <b>photocytes</b>. They sit in rosettes, like slices of a cake, around air tubes called <b>tracheae</b>. Insects breathe through these tubes, and fine branches, the <b>tracheoles</b>, carry oxygen between the light cells. Oxygen is the key to the switch, as you will see.</p>
    <p>Behind the light cells lies a white <b>reflector</b> layer, packed with tiny crystals of <b>uric acid</b> about 0.7 thousandths of a millimetre across. Like the white paint inside a torch, it bounces light back out through the clear skin below.</p>
    <p><b>Nerves</b> run into the lantern, but oddly they do not touch the light cells. They end on the cells of the air tubes. So how does a nerve signal switch the light on? That puzzle is chapter 3.</p>
    <p class="tip"><b>Try it:</b> take the firefly apart, then open the lantern slice and send light out. Tap a part to hear what it does.</p>`,
  terms: [
    { t: 'Beetle', d: 'An insect whose front wings are hard covers (elytra) over the flying wings. Fireflies are beetles.' },
    { t: 'Pronotum', d: 'The shield-like plate over a beetle’s front end; in fireflies it hides the head.' },
    { t: 'Lantern', d: 'The light organ on the underside of a firefly’s last belly segments.' },
    { t: 'Photocyte', d: 'A light-making cell in the lantern.' },
    { t: 'Trachea', d: 'An air tube. Insects breathe through a branching network of them, ending in fine tracheoles.' },
    { t: 'Reflector layer', d: 'A white layer of uric-acid crystals behind the light cells that bounces light outwards.' },
  ],
  defaults: { explode: 0, slice: true, glow: 0.8, fly: false },
  controls: [
    { key: 'explode', type: 'range', label: 'Take it apart', min: 0, max: 1, step: 0.01, ends: ['together', 'apart'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'slice', type: 'toggle', label: 'Show a slice of the lantern', hint: 'Magnified about 1,000 times.' },
    { key: 'glow', type: 'range', label: 'Lantern brightness', min: 0, max: 1, step: 0.01, fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'fly', type: 'toggle', label: 'Open the wings (flying)' },
  ],
  quiz: [
    { q: 'What kind of animal is a firefly?', options: ['A fly', 'A beetle', 'A moth', 'A wasp'], answer: 1, why: 'Fireflies have hard wing covers (elytra) over their flying wings, like every beetle.' },
    { q: 'Where is the lantern?', options: ['On the head', 'Under the last belly segments', 'On the wing covers', 'In the antennae'], answer: 1, why: 'The light organ is on the underside of the tail end of the abdomen.' },
    { q: 'What does the white reflector layer do?', options: ['Makes the light', 'Stores oxygen', 'Bounces the light back out through the skin', 'Cools the lantern'], answer: 2, why: 'Its uric-acid crystals scatter light, like the white inside of a torch, so more of it leaves the belly.' },
  ],
  reel: [
    { ms: 5200, caption: 'A firefly is a beetle, with a lamp built into the underside of its tail.', set: { slice: false, fly: true, explode: 0 }, anim: { glow: [0.1, 1] }, view: { pos: [0.4, 1.4, 7.4], target: [0.2, 2.3, 0] }, spin: 0.35 },
  ],

  build({ stage }) {
    nightLook(stage, 0x070b12, 20, 55, 0.45);
    const root = new THREE.Group(); stage.root.add(root);
    const gt = glowTexture();
    const { ground } = grassPatch(root, 9, 200);
    const fly = new Firefly({ glowTex: gt }); fly.group.position.set(-0.6, 2.5, 0); fly.group.rotation.set(0.0, 0.25, 0.18); fly.group.scale.setScalar(1.15); root.add(fly.group);
    const light = new THREE.PointLight(FLY_HEX, 0, 6, 1.6); light.position.set(-2.0, 1.6, 0.3); root.add(light);
    const slice = lanternSlice(gt); slice.g.position.set(2.7, 0.5, 0); slice.g.rotation.y = -0.3; root.add(slice.g);
    // Exploded parts: each moves outward from the body.
    const P = fly.parts, homes = {};
    for (const k in P) homes[k] = P[k].position.clone();
    const OFF = { pronotum: [0.6, 0.7, 0], head: [1.2, 0, 0], elytra: [0, 1.1, 0], abdomen: [-0.9, -0.15, 0], legs: [0, -0.7, 0] };
    const L = (h, p, par = root, c = '') => stage.label(h, p, par, c);
    const tags = {
      lantern: L('Lantern (light organ)', [0, 0, 0], root, 'hot'), elytra: L('Wing covers (elytra)', [0, 0, 0]), pron: L('Head shield (pronotum)', [0, 0, 0]),
      eyes: L('Eyes and antennae', [0, 0, 0]), wings: L('Flying wings', [0, 0, 0]),
      sl: L('Lantern slice, about 1,000×', [0, 0, 0], root, 'hot'), refl: L('Reflector: uric-acid crystals', [0, 0, 0]), pc: L('Photocytes in rosettes', [0, 0, 0], root, 'hot'),
      tr: L('Air tube (trachea)', [0, 0, 0]), nv: L('Nerve ends on air-tube cells', [0, 0, 0]), out: L('Light out through the clear skin', [0, 0, 0]),
    };
    const pick = new Map();
    fly.group.traverse((o) => { if (o.isMesh) stage.pickables.push(o); });
    fly.lantern.forEach((m) => pick.set(m, 'lantern'));
    P.pronotum.traverse((o) => pick.set(o, 'pronotum')); P.elytra.traverse((o) => pick.set(o, 'elytra')); P.head.traverse((o) => pick.set(o, 'head'));
    const fixView = viewFixer(stage, this.view);
    let ex = 0, op = 0, gl = 0, t = 0, sl = 1;
    const _w = new THREE.Vector3();
    const at = (obj, dx = 0, dy = 0, dz = 0) => { obj.getWorldPosition(_w); return [_w.x + dx, _w.y + dy, _w.z + dz]; };
    return {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        reelZoom(stage, 1.45); fixView();
        ex = approach(ex, s.explode, 6, dt); op = approach(op, s.fly ? 1 : 0, 4, dt); sl = approach(sl, s.slice ? 1 : 0, 6, dt);
        const pulse = 0.82 + 0.18 * Math.sin(t * 2.2);
        gl = approach(gl, s.glow * pulse, 10, dt);
        for (const k in P) P[k].position.copy(homes[k]).add(new THREE.Vector3(...(OFF[k] || [0, 0, 0])).multiplyScalar(ex));
        fly.setOpen(Math.max(op, ex * 0.6), t);
        fly.setGlow(gl);
        fly.group.position.y = 2.5 + (s.fly ? Math.sin(t * 1.3) * 0.12 : 0);
        light.intensity = gl * 6;
        slice.g.visible = sl > 0.02; slice.g.scale.setScalar(Math.max(0.01, sl * 0.85));
        slice.pcMat.emissiveIntensity = 0.2 + 2.6 * gl;
        slice.glows.forEach((g2) => { g2.material.opacity = gl; });
        slice.rays.forEach((r, i) => { r.material.opacity = gl * (0.6 + 0.4 * Math.sin(t * 4 + i)); r.position.y = -0.3 - ((t * 0.8 + i * 0.17) % 1) * 0.6; });
        const narrow = layoutOf(stage) === 'narrow';
        tags.lantern.position.set(...at(fly.lantern[0], -0.2, -0.75, 0.3));
        tags.elytra.position.set(...at(fly.elytra[1], -1.5, 0.45, 0.2));
        tags.pron.position.set(...at(P.pronotum, 0.5, 0.75, 0));
        tags.eyes.position.set(...at(P.head, 1.6, -0.55, 0));
        tags.wings.visible = op > 0.5 && !narrow; tags.wings.position.set(...at(fly.wings[1], -1.4, 0.2, 1.2));
        tags.eyes.visible = !narrow;
        const sv = sl > 0.5;
        const sp = slice.g.position;
        tags.sl.visible = sv; tags.sl.position.set(sp.x, sp.y + 2.35, 0);
        tags.refl.visible = sv && !narrow; tags.refl.position.set(sp.x + 0.3, sp.y + 1.95, 0.9);
        tags.pc.visible = sv; tags.pc.position.set(sp.x + 0.6, sp.y + 0.75, 1.1);
        tags.tr.visible = sv && !narrow; tags.tr.position.set(sp.x + 1.2, sp.y + 1.2, 1.0);
        tags.nv.visible = sv && !narrow; tags.nv.position.set(sp.x - 1.5, sp.y + 0.05, 0.9);
        tags.out.visible = sv && !narrow && gl > 0.2; tags.out.position.set(sp.x + 0.2, sp.y - 0.8, 0.5);
        if (narrow) { tags.elytra.visible = ex > 0.3; tags.pron.visible = false; }
        else { tags.elytra.visible = true; tags.pron.visible = true; }
      },
      readout: (s) => `<div class="big">A beetle with a lamp</div>
        <div class="row"><span>Body length (Photinus pyralis)</span><b>about 1 to 1.4 cm</b></div>
        <div class="row"><span>Kinds of firefly worldwide</span><b>more than 2,000</b></div>
        <div class="row"><span>Lantern</span><b>last two belly segments</b></div>
        <div class="row"><span>Reflector crystals</span><b>uric acid, about 700 nm</b></div>
        <div class="row"><span>Lantern now</span><b>${s.glow < 0.05 ? 'dark' : Math.round(s.glow * 100) + '% bright'}</b></div>
        <small>Anatomy after Smith 1963 and Goh et al. 2013. A generic model, not one exact species.</small>`,
      pick(o) { const k = pick.get(o); if (k && INFO[k]) toast(INFO[k]); },
    };
  },
};
