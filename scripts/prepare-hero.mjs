// Cuts the backlit hero portrait out of its sky and writes public/me.webp.
//
//   node scripts/prepare-hero.mjs <photo> [--preview out.jpg]
//
// The subject is a near-black silhouette against a bright sky, so a luminance
// key is cleaner than a segmentation model: bright pixels connected to the
// image border are sky, everything else is the subject. Edge pixels get a soft
// alpha from their brightness, which keeps individual hair strands, and their
// colour is replaced from just inside the outline so no sky bleeds into the edge.
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [src, flag, previewPath] = process.argv.slice(2);
if (!src) throw new Error("usage: node scripts/prepare-hero.mjs <photo> [--preview out.jpg]");

// Crop (in source pixels) that drops the window frame on the right.
const CROP = { left: 700, top: 420, width: 3150, height: 2776 };
const OUT_WIDTH = 2000;
const SKY = 62; // luminance at or above this, connected to the border, is sky
const SOFT_LO = 30; // below this an edge pixel is fully opaque
const BAND = 5; // pixels inside the outline whose colour is taken from further in
const GAMMA = 0.72; // lifts the shadows enough for the shirt to read without greying the blacks
// Bright pockets the sky fill can't reach: inside this box (fractions of the crop) they're the lenses;
// elsewhere above HEAD_LINE they're gaps between curls; below it, the lit collar.
const LENS = { x0: 0.2, x1: 0.42, y0: 0.28, y1: 0.47 };
const HEAD_LINE = 0.45;
// Above this line (the top of the glasses) dim pixels are sky seen through thin hair, so they fade by brightness too.
const HAIR_LINE = 0.272;
const HAIR_SOFT_LO = 14; // hair itself sits around 5; anything lighter up there is part sky
const GLASS_ALPHA = 60;

const { data, info } = await sharp(src)
  .rotate()
  .extract(CROP)
  .resize({ width: OUT_WIDTH })
  .median(3) // takes the edge off the sensor noise the shadow lift would otherwise amplify
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const N = W * H;

const lum = new Float32Array(N);
for (let i = 0; i < N; i++) lum[i] = 0.2126 * data[i * 3] + 0.7152 * data[i * 3 + 1] + 0.0722 * data[i * 3 + 2];

const neighbours = (i, visit) => {
  const x = i % W;
  if (x > 0) visit(i - 1);
  if (x < W - 1) visit(i + 1);
  if (i >= W) visit(i - W);
  if (i < N - W) visit(i + W);
};

// Flood-fill the sky from the top and side borders (the bottom edge is the subject's body).
const sky = new Uint8Array(N);
const queue = new Int32Array(N);
let head = 0;
let tail = 0;
const seedSky = (i) => {
  if (!sky[i] && lum[i] >= SKY) {
    sky[i] = 1;
    queue[tail++] = i;
  }
};
for (let x = 0; x < W; x++) seedSky(x);
for (let y = 0; y < H; y++) {
  seedSky(y * W);
  seedSky(y * W + W - 1);
}
while (head < tail) neighbours(queue[head++], seedSky);

// Sort the enclosed bright pockets into lens glass, sky between curls, or collar.
const glass = new Uint8Array(N);
const seen = new Uint8Array(N);
for (let start = 0; start < N; start++) {
  if (sky[start] || seen[start] || lum[start] < SKY) continue;
  head = tail = 0;
  queue[tail++] = start;
  seen[start] = 1;
  let xSum = 0;
  let ySum = 0;
  while (head < tail) {
    const i = queue[head++];
    xSum += i % W;
    ySum += (i / W) | 0;
    neighbours(i, (j) => {
      if (!sky[j] && !seen[j] && lum[j] >= SKY) {
        seen[j] = 1;
        queue[tail++] = j;
      }
    });
  }
  const cx = xSum / tail / W;
  const cy = ySum / tail / H;
  const inLens = cx > LENS.x0 && cx < LENS.x1 && cy > LENS.y0 && cy < LENS.y1;
  if (inLens) for (let k = 0; k < tail; k++) glass[queue[k]] = 1;
  else if (cy < HEAD_LINE) for (let k = 0; k < tail; k++) sky[queue[k]] = 1;
}

// Distance (in pixels) from the sky, capped just past the edge band.
const dist = new Uint8Array(N).fill(255);
head = tail = 0;
for (let i = 0; i < N; i++) {
  if (sky[i]) {
    dist[i] = 0;
    queue[tail++] = i;
  }
}
while (head < tail) {
  const i = queue[head++];
  if (dist[i] > BAND) continue;
  neighbours(i, (j) => {
    if (dist[j] === 255) {
      dist[j] = dist[i] + 1;
      queue[tail++] = j;
    }
  });
}

// Alpha: sky is clear, glass is faint, and pixels touching the sky (or in thin hair) fade by brightness.
const fade = (l, lo = SOFT_LO) => Math.round(255 * Math.min(1, Math.max(0, (SKY - l) / (SKY - lo))));
const alpha = new Uint8Array(N);
for (let i = 0; i < N; i++) {
  if (sky[i]) continue;
  if (glass[i]) alpha[i] = GLASS_ALPHA;
  else if (i < W * Math.floor(H * HAIR_LINE)) alpha[i] = fade(lum[i], HAIR_SOFT_LO);
  else if (dist[i] === 1) alpha[i] = fade(lum[i]);
  else alpha[i] = 255;
}

// Colour: tone-lift the subject, then give the edge band and any see-through hair the colour of the
// nearest solid pixel further in, so outlines stay dark instead of picking up a grey fringe of sky.
// The fill carries on into the sky as well: the alpha blur below gives those pixels a little opacity.
const rgb = new Uint8Array(N * 3);
for (let i = 0; i < N * 3; i++) rgb[i] = Math.round(255 * Math.pow(data[i] / 255, GAMMA));
const filled = new Uint8Array(N);
head = tail = 0;
for (let i = 0; i < N; i++) {
  if (!sky[i] && ((dist[i] > BAND && alpha[i] === 255) || glass[i])) {
    filled[i] = 1;
    queue[tail++] = i;
  }
}
while (head < tail) {
  const i = queue[head++];
  neighbours(i, (j) => {
    if (!filled[j]) {
      filled[j] = 1;
      rgb[j * 3] = rgb[i * 3];
      rgb[j * 3 + 1] = rgb[i * 3 + 1];
      rgb[j * 3 + 2] = rgb[i * 3 + 2];
      queue[tail++] = j;
    }
  });
}

// A light blur on the alpha alone smooths the stair-stepping along the outline.
const softAlpha = await sharp(Buffer.from(alpha), { raw: { width: W, height: H, channels: 1 } })
  .blur(0.7)
  .extractChannel(0)
  .raw()
  .toBuffer();
const rgba = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  rgba[i * 4] = rgb[i * 3];
  rgba[i * 4 + 1] = rgb[i * 3 + 1];
  rgba[i * 4 + 2] = rgb[i * 3 + 2];
  rgba[i * 4 + 3] = softAlpha[i];
}

const out = path.join(ROOT, "public", "me.webp");
const meta = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
  .webp({ quality: 90, alphaQuality: 100, smartSubsample: true })
  .toFile(out);
console.log(`me.webp ${W}x${H}, ${Math.round(meta.size / 1024)} KB`);

if (flag === "--preview" && previewPath) {
  // The cut-out over the site's background and glow, for a quick visual check.
  const glow = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><radialGradient id="g" cx="50%" cy="60%" r="55%"><stop offset="0" stop-color="#4f7dff" stop-opacity="0.45"/><stop offset="0.45" stop-color="#4f7dff" stop-opacity="0.08"/><stop offset="1" stop-color="#4f7dff" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="#0a0a0c"/><rect width="100%" height="100%" fill="url(#g)"/></svg>`,
  );
  await sharp(glow)
    .composite([{ input: out }])
    .jpeg({ quality: 90 })
    .toFile(previewPath);
  console.log(`preview ${previewPath}`);
}
