// Cleans up and colour-grades the hero portrait cut-out, and writes public/me.webp.
//
//   node scripts/prepare-hero.mjs <photo.jpg> <cutout.png> [--preview out.jpg]
//
// The cut-out itself comes from a segmentation model (@imgly/background-removal-node, "medium"),
// run outside the repo since the model alone is ~100 MB; its matte is used with the photo's own
// colours (the cut-out drops the backdrop's colour, which this needs). This script then:
//  - drops anything not attached to the subject (the chair at the left edge) and faint haze,
//  - redraws the matte along the hair from its colour, so the gaps between the curl tips are clear,
//  - makes the body solid (the model leaves the black blazer partly see-through),
//  - repaints the soft outline from just inside it, so no backdrop shows through as a halo,
//  - takes the backdrop's blue cast out of the outline and the shadows (black blazer, dark hair),
//  - adds a little contrast, vibrance and sharpness,
//  - tightens the outline, so the hair ends in curls rather than a haze over the page,
//  - fades the arms out where the frame cuts them, and trims the empty space above the head.
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [photo, cutoutPath, flag, previewPath] = process.argv.slice(2);
if (!cutoutPath) throw new Error("usage: node scripts/prepare-hero.mjs <photo.jpg> <cutout.png> [--preview out.jpg]");

const HAZE = 24; // alpha below this is model noise, not hair
const REACH = 8; // soft pixels count only within this many pixels of the solid subject
// Re-keying the hair: how deep into the model's matte to look, how far round to gather the backdrop's
// colour, and the hair zone (down to the ear, then only behind it, minus the glasses and face profile).
const HULL = 60;
const BACKDROP_REACH = 30;
const HAIR_ZONE = (x, y) => (y < 880 || (x < 470 && y < 1000)) && !(x > 860 && y > 590);
const HAIR_MAX_LUMA = 70; // the local hair colour is darker than this
const MIN_SEP = 40; // and at least this far from the backdrop colour (RGB distance)
// Up to KEY_LO of the way from backdrop to hair is backdrop; from KEY_HI it's solid hair (the blue
// light makes the outer curls look partway to the backdrop, but they're hair all the same).
// Only colours close to the line from backdrop to hair are re-keyed (RGB distance off it): brown
// highlights inside the hair and skin are neither, so they keep the model's alpha.
const OFF_LINE = 40;
const KEY_LO = 0.15;
const KEY_HI = 0.65;
const SLIVER = 2; // in the hair, bits of the outline thinner than about twice this are trimmed
const SOLID = 6; // pixels further than this inside the outline are fully opaque
const CORE = 3; // pixels this far inside the outline keep their own colour; the rest are refilled from them
const FILL = 4; // box radius of that refill's averaging
const SHADE_MAX = 1.6; // how much lighter than the hair an outer curl's highlight may stay
const HAIR_FILL = 8; // and in the hair, where it reaches across the rim-lit outer curls
const DARK_BIAS = 12; // how strongly the hair's average prefers the darkest pixels around
// Across the whole outline band only skin (bright and warm: red well above blue), the glasses' metal
// frame (brighter still) and the lens (strongly blue) keep their own colour.
// Everything else there refills from further in: the backdrop rim-lit the outermost curls, so their
// own colour is lighter and bluer than the hair.
const SKIN_LUMA = 100;
const SKIN_WARMTH = 25;
const METAL_LUMA = 140;
const LENS_BLUE = 170;
const EDGE = 14; // the outline band (in pixels) that loses the backdrop's colour cast
// Cool tones up to SHADOW_LO brightness (shadows, and the sheen on the curls) turn fully neutral,
// easing off by SHADOW_HI.
const SHADOW_LO = 95;
const SHADOW_HI = 115; // the lens coating's blue reflection starts just above this
const CONTRAST = 0.22; // blend towards an S-curve
const VIBRANCE = 0.25; // saturation boost, strongest on the least saturated colours
// The model's matte fades the curls out over a wide, faint fringe. Alpha up to CHOKE_LO is dropped and
// from CHOKE_HI up is solid, so loose ends read as hair, with a short ramp left between to stay smooth.
const CHOKE_LO = 70;
const CHOKE_HI = 170;
const SIDE_FADE = 0.07; // of the width: the arms fade out over this much of each side
const TOP_PAD = 0.02; // of the height: room kept above the hair

const { data, info } = await sharp(photo).rotate().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const N = W * H;
const alpha = await sharp(cutoutPath).extractChannel(3).raw().toBuffer();
if (alpha.length !== N) throw new Error("the cut-out must be the same size as the photo");
const lumaAt = (i) => 0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2];
// Skin, the glasses' metal frame and the lens: never recoloured from their surroundings or keyed out.
const keepsOwn = (i) => {
  const [r, b, luma] = [data[i * 4], data[i * 4 + 2], lumaAt(i)];
  return (luma >= SKIN_LUMA && r - b > SKIN_WARMTH) || luma >= METAL_LUMA || b >= LENS_BLUE;
};

const neighbours = (i, visit) => {
  const x = i % W;
  if (x > 0) visit(i - 1);
  if (x < W - 1) visit(i + 1);
  if (i >= W) visit(i - W);
  if (i < N - W) visit(i + W);
};
const queue = new Int32Array(N);

// Three box passes each way approximate a Gaussian (sigma ~ radius). Reuses `src` as scratch.
const blur = (src, radius) => {
  let a = src;
  let b = new Float32Array(N);
  for (let pass = 0; pass < 6; pass++) {
    const horizontal = pass % 2 === 0;
    const [len, lines, step, stride] = horizontal ? [W, H, 1, W] : [H, W, W, 1];
    for (let line = 0; line < lines; line++) {
      const base = line * stride;
      let sum = 0;
      for (let k = -radius; k <= radius; k++) sum += a[base + Math.min(len - 1, Math.max(0, k)) * step];
      for (let k = 0; k < len; k++) {
        b[base + k * step] = sum / (2 * radius + 1);
        sum += a[base + Math.min(len - 1, k + radius + 1) * step] - a[base + Math.max(0, k - radius) * step];
      }
    }
    [a, b] = [b, a];
  }
  return a;
};

// The subject is the largest solid region; everything else solid is the chair or the backdrop.
const label = new Int32Array(N);
let best = 0;
let bestSize = 0;
for (let start = 0, id = 0; start < N; start++) {
  if (label[start] || alpha[start] < 128) continue;
  let head = 0;
  let tail = 0;
  label[start] = ++id;
  queue[tail++] = start;
  while (head < tail)
    neighbours(queue[head++], (j) => {
      if (!label[j] && alpha[j] >= 128) {
        label[j] = id;
        queue[tail++] = j;
      }
    });
  if (tail > bestSize) [best, bestSize] = [id, tail];
}

// Distance from the solid subject outwards (soft hair keeps its alpha within REACH) and from the
// background inwards (the outline band that picked up the backdrop's blue).
const bfs = (isSeed, cap) => {
  const dist = new Uint8Array(N).fill(255);
  let head = 0;
  let tail = 0;
  for (let i = 0; i < N; i++)
    if (isSeed(i)) {
      dist[i] = 0;
      queue[tail++] = i;
    }
  while (head < tail) {
    const i = queue[head++];
    if (dist[i] >= cap) continue;
    neighbours(i, (j) => {
      if (dist[j] === 255) {
        dist[j] = dist[i] + 1;
        queue[tail++] = j;
      }
    });
  }
  return dist;
};
const fromSubject = bfs((i) => label[i] === best, REACH);
for (let i = 0; i < N; i++) if (fromSubject[i] > REACH || alpha[i] < HAZE) alpha[i] = 0;

// Around the curls the model's matte is a smooth hull: it counts the backdrop between the curl tips as
// hair, which shows up as a flat, hazy ring round the head. Near the hair's outline alpha is worked
// out again from the colour: how far each pixel sits from the local backdrop colour towards the local
// hair colour (both blurred estimates, the hair's biased to its darkest pixels). It can only take
// alpha away. The glasses and the face profile are left out, since the lens is as blue as the backdrop.
{
  const nearEdge = bfs((i) => alpha[i] < 128, HULL);
  const hairWeight = new Float32Array(N);
  const hair = [0, 1, 2].map(() => new Float32Array(N));
  const backdropWeight = new Float32Array(N);
  const backdrop = [0, 1, 2].map(() => new Float32Array(N));
  for (let i = 0; i < N; i++)
    if (alpha[i] >= 250) {
      hairWeight[i] = (1 - lumaAt(i) / 255) ** DARK_BIAS;
      for (let c = 0; c < 3; c++) hair[c][i] = data[i * 4 + c] * hairWeight[i];
    } else if (!alpha[i]) {
      backdropWeight[i] = 1;
      for (let c = 0; c < 3; c++) backdrop[c][i] = data[i * 4 + c];
    }
  const hw = blur(hairWeight, HAIR_FILL);
  const hc = hair.map((c) => blur(c, HAIR_FILL));
  const bw = blur(backdropWeight, BACKDROP_REACH);
  const bc = backdrop.map((c) => blur(c, BACKDROP_REACH));
  for (let i = 0; i < N; i++) {
    const x = i % W;
    const y = (i / W) | 0;
    if (!alpha[i] || nearEdge[i] > HULL || !HAIR_ZONE(x, y) || keepsOwn(i) || hw[i] < 1e-4 || bw[i] < 0.01) continue;
    const f = hc.map((c) => c[i] / hw[i]);
    const b = bc.map((c) => c[i] / bw[i]);
    if (0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2] > HAIR_MAX_LUMA) continue;
    let sep = 0;
    let along = 0;
    let away = 0;
    for (let c = 0; c < 3; c++) {
      sep += (f[c] - b[c]) ** 2;
      along += (data[i * 4 + c] - b[c]) * (f[c] - b[c]);
      away += (data[i * 4 + c] - b[c]) ** 2;
    }
    if (sep < MIN_SEP ** 2) continue; // hair and backdrop too alike here (the dark folds) to tell apart
    if (away - (along * along) / sep > OFF_LINE ** 2) continue;
    const hairness = (along / sep - KEY_LO) / (KEY_HI - KEY_LO);
    alpha[i] = Math.min(alpha[i], Math.round(255 * Math.min(1, Math.max(0, hairness))));
  }
}
// Slivers a few pixels thin left along the hair's outline (where the forehead runs into a stray
// strand) read as scratches on a dark page. A round opening takes them off: blurred, a sliver never
// gets near full strength, so it drops out of the threshold, and blurring what's left grows the
// solid shapes back to where they were.
{
  const solid = new Float32Array(N);
  for (let i = 0; i < N; i++) solid[i] = alpha[i] / 255;
  const core = blur(solid, SLIVER);
  for (let i = 0; i < N; i++) core[i] = core[i] > 0.75 ? 1 : 0;
  const grown = blur(core, SLIVER);
  for (let i = 0; i < N; i++) if (HAIR_ZONE(i % W, (i / W) | 0) && grown[i] < 0.2) alpha[i] = Math.round(alpha[i] * (grown[i] / 0.2));
}
const fromOutside = bfs((i) => alpha[i] < 128, EDGE);
// The black blazer is close to the dark cloth behind it, and the model leaves it partly see-through.
// Only the outline is soft for real: anything further in is solid.
for (let i = 0; i < N; i++) if (fromOutside[i] > SOLID) alpha[i] = 255;

// Soft outline pixels are part backdrop, which shows up as a pale halo on a dark page. They take the
// average colour of the solid pixels around them instead (alpha still decides how much of it shows):
// a blur of the solid pixels' colour divided by a blur of where they are. In the hair darker pixels
// count for far more (nearly a local minimum), and where no hair is close enough (thin strands at the
// fringe) the colour falls back to the hair's overall colour rather than the nearest skin. The
// backdrop also rim-lit the outermost curls there, so across the outline band they keep their own
// shading but take on the hair's colour, more so towards the edge. Every
// pixel outside the solid subject is recoloured, transparent ones too, so no backdrop colour is left
// to bleed back in through sharpening or compression.
{
  const inZone = (i) => HAIR_ZONE(i % W, (i / W) | 0);
  const core = (i) => alpha[i] >= 250 && fromOutside[i] >= CORE && (!inZone(i) || fromOutside[i] > EDGE || keepsOwn(i));
  const plainWeight = new Float32Array(N);
  const plain = [0, 1, 2].map(() => new Float32Array(N));
  const darkWeight = new Float32Array(N);
  const dark = [0, 1, 2].map(() => new Float32Array(N));
  const hairColour = [0, 0, 0];
  let hairWeight = 0;
  const own = Uint8Array.from(data);
  const filled = new Uint8Array(N);
  let head = 0;
  let tail = 0;
  for (let i = 0; i < N; i++)
    if (core(i)) {
      const k = (1 - lumaAt(i) / 255) ** DARK_BIAS;
      plainWeight[i] = 1;
      darkWeight[i] = k;
      for (let c = 0; c < 3; c++) {
        plain[c][i] = data[i * 4 + c];
        dark[c][i] = data[i * 4 + c] * k;
        if (inZone(i)) hairColour[c] += data[i * 4 + c] * k;
      }
      if (inZone(i)) hairWeight += k;
      filled[i] = 1;
      queue[tail++] = i;
    }
  // Anything out of reach of both blurs takes the nearest solid pixel's colour.
  while (head < tail) {
    const i = queue[head++];
    neighbours(i, (j) => {
      if (!filled[j]) {
        filled[j] = 1;
        for (let c = 0; c < 3; c++) data[j * 4 + c] = data[i * 4 + c];
        queue[tail++] = j;
      }
    });
  }
  const pw = blur(plainWeight, FILL);
  const pc = plain.map((c) => blur(c, FILL));
  const dw = blur(darkWeight, HAIR_FILL);
  const dc = dark.map((c) => blur(c, HAIR_FILL));
  const PRIOR = 1e-3; // how much the hair's overall colour counts against the local estimate
  const hairLuma = (0.2126 * hairColour[0] + 0.7152 * hairColour[1] + 0.0722 * hairColour[2]) / hairWeight;
  for (let i = 0; i < N; i++) {
    if (core(i)) continue;
    if (inZone(i)) {
      // The hair's colour here, never lighter than the hair overall.
      const local = dc.map((c, k) => (c[i] + (hairColour[k] / hairWeight) * PRIOR) / (dw[i] + PRIOR));
      const lift = (0.2126 * local[0] + 0.7152 * local[1] + 0.0722 * local[2]) / hairLuma;
      const hair = local.map((v) => v / Math.max(1, lift));
      if (alpha[i] < 250 || fromOutside[i] < CORE) {
        for (let c = 0; c < 3; c++) data[i * 4 + c] = hair[c];
        continue;
      }
      // A solid outer curl: its own shading (pressed down) on the hair's colour, fading in to the edge.
      const ownLuma = 0.2126 * own[i * 4] + 0.7152 * own[i * 4 + 1] + 0.0722 * own[i * 4 + 2];
      const hairL = 0.2126 * hair[0] + 0.7152 * hair[1] + 0.0722 * hair[2];
      const shade = Math.min(SHADE_MAX, Math.sqrt(ownLuma / Math.max(1, hairL)));
      const t = 1 - (fromOutside[i] - CORE) / (EDGE - CORE + 1);
      const s = t * t * (3 - 2 * t);
      for (let c = 0; c < 3; c++) data[i * 4 + c] = own[i * 4 + c] + (hair[c] * shade - own[i * 4 + c]) * s;
    } else if (pw[i] > 0.002) for (let c = 0; c < 3; c++) data[i * 4 + c] = pc[c][i] / pw[i];
  }
}

// Colour, per pixel: cast removal, S-curve, vibrance.
const curve = new Float32Array(256);
for (let v = 0; v < 256; v++) {
  const x = v / 255;
  curve[v] = 255 * (x + CONTRAST * (x * x * (3 - 2 * x) - x));
}
const rgb = Buffer.alloc(N * 3);
for (let i = 0; i < N; i++) {
  let r = data[i * 4];
  let g = data[i * 4 + 1];
  let b = data[i * 4 + 2];
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const clamp = (t) => Math.min(1, Math.max(0, t));
  // A cool colour (green or blue above red) in the shadows or along the outline is the backdrop's
  // light, so it goes to a neutral grey of the same brightness: the blazer reads black, not teal.
  // Warm darks (brown in the hair) keep their colour, and bright blue (the lens coating) is real.
  if (Math.max(g, b) > r) {
    const edge = fromOutside[i] <= EDGE ? 1 - fromOutside[i] / (EDGE + 1) : 0;
    const shadow = clamp((SHADOW_HI - luma) / (SHADOW_HI - SHADOW_LO));
    const share = Math.max(edge * clamp((170 - luma) / 60), shadow);
    r += (luma - r) * share;
    g += (luma - g) * share;
    b += (luma - b) * share;
  }
  r = curve[Math.round(r)];
  g = curve[Math.round(g)];
  b = curve[Math.round(b)];
  const max = Math.max(r, g, b);
  const sat = max ? (max - Math.min(r, g, b)) / max : 0;
  const mean = (r + g + b) / 3;
  const k = 1 + VIBRANCE * (1 - sat);
  rgb[i * 3] = Math.max(0, Math.min(255, mean + (r - mean) * k));
  rgb[i * 3 + 1] = Math.max(0, Math.min(255, mean + (g - mean) * k));
  rgb[i * 3 + 2] = Math.max(0, Math.min(255, mean + (b - mean) * k));
}
const sharpened = await sharp(rgb, { raw: { width: W, height: H, channels: 3 } })
  .sharpen({ sigma: 0.9, m1: 0.4, m2: 1.4 })
  .raw()
  .toBuffer();

// The frame cuts both arms off, so they fade out towards the sides instead of ending in a hard line.
const fadeW = W * SIDE_FADE;
const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
let top = H;
const rgba = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  const x = i % W;
  const tight = 255 * smooth((alpha[i] - CHOKE_LO) / (CHOKE_HI - CHOKE_LO));
  const a = tight * smooth(x / fadeW) * smooth((W - 1 - x) / fadeW);
  if (a > 8) top = Math.min(top, (i / W) | 0);
  rgba[i * 4] = sharpened[i * 3];
  rgba[i * 4 + 1] = sharpened[i * 3 + 1];
  rgba[i * 4 + 2] = sharpened[i * 3 + 2];
  rgba[i * 4 + 3] = Math.round(a);
}
const cropTop = Math.max(0, top - Math.round(H * TOP_PAD));

// Two sizes served straight from the CDN (see site.heroImage), so the hero never waits on image optimisation.
const out = path.join(ROOT, "public", "me.webp");
const cutout = sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).extract({ left: 0, top: cropTop, width: W, height: H - cropTop });
const webp = { quality: 90, alphaQuality: 100, smartSubsample: true };
const meta = await cutout.clone().webp(webp).toFile(out);
const small = await cutout
  .clone()
  .resize({ width: 1000 })
  .webp(webp)
  .toFile(path.join(ROOT, "public", "me-1000.webp"));
console.log(`me.webp ${meta.width}x${meta.height}, ${Math.round(meta.size / 1024)} KB; me-1000.webp ${Math.round(small.size / 1024)} KB`);

if (flag === "--preview" && previewPath) {
  // The cut-out over the site's background and glow, for a quick visual check.
  const { width: w, height: h } = meta;
  const glow = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><radialGradient id="g" cx="50%" cy="60%" r="55%"><stop offset="0" stop-color="#2ee6a6" stop-opacity="0.42"/><stop offset="0.45" stop-color="#2ee6a6" stop-opacity="0.08"/><stop offset="1" stop-color="#2ee6a6" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="#090c0b"/><rect width="100%" height="100%" fill="url(#g)"/></svg>`,
  );
  await sharp(glow)
    .composite([{ input: out }])
    .jpeg({ quality: 90 })
    .toFile(previewPath);
  console.log(`preview ${previewPath}`);
}
