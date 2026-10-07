// Cuts the backlit hero portrait out of its sky and writes public/me.webp.
//
//   node scripts/prepare-hero.mjs <photo> [--preview out.jpg]
//
// The subject is a near-black silhouette against a bright sky, so a luminance
// key is cleaner than a segmentation model: bright pixels connected to the
// image border are sky, everything else is the subject. Edge pixels get a soft
// alpha from their brightness, which keeps individual hair strands.
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [src, flag, previewPath] = process.argv.slice(2);
if (!src) throw new Error("usage: node scripts/prepare-hero.mjs <photo> [--preview out.jpg]");

// Crop (in source pixels) that drops the window frame on the right.
const CROP = { left: 700, top: 420, width: 3150, height: 2776 };
const OUT_WIDTH = 1400;
const SKY = 62; // luminance at or above this, connected to the border, is sky
const SOFT_LO = 34; // below this an edge pixel is fully opaque
const GAMMA = 0.62; // lifts the shadows so the shirt and hair read on a dark page

const { data, info } = await sharp(src)
  .rotate()
  .extract(CROP)
  .resize({ width: OUT_WIDTH })
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const N = W * H;

const lum = new Float32Array(N);
for (let i = 0; i < N; i++) lum[i] = 0.2126 * data[i * 3] + 0.7152 * data[i * 3 + 1] + 0.0722 * data[i * 3 + 2];

// Flood-fill the sky from the top and side borders (the bottom edge is the subject's body).
const sky = new Uint8Array(N);
const stack = [];
const seed = (x, y) => {
  const i = y * W + x;
  if (!sky[i] && lum[i] >= SKY) {
    sky[i] = 1;
    stack.push(i);
  }
};
for (let x = 0; x < W; x++) seed(x, 0);
for (let y = 0; y < H; y++) {
  seed(0, y);
  seed(W - 1, y);
}
while (stack.length) {
  const i = stack.pop();
  const x = i % W;
  const y = (i / W) | 0;
  if (x > 0) seed(x - 1, y);
  if (x < W - 1) seed(x + 1, y);
  if (y > 0) seed(x, y - 1);
  if (y < H - 1) seed(x, y + 1);
}

// Alpha: sky is clear, the subject is solid, and pixels touching the sky fade by brightness.
const alpha = new Uint8Array(N);
for (let i = 0; i < N; i++) {
  if (sky[i]) continue;
  const x = i % W;
  const y = (i / W) | 0;
  const nearSky = (x > 0 && sky[i - 1]) || (x < W - 1 && sky[i + 1]) || (y > 0 && sky[i - W]) || (y < H - 1 && sky[i + W]);
  if (!nearSky) {
    alpha[i] = 255;
    continue;
  }
  const t = Math.min(1, Math.max(0, (SKY - lum[i]) / (SKY - SOFT_LO)));
  alpha[i] = Math.round(t * 255);
}

const rgba = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  for (let c = 0; c < 3; c++) rgba[i * 4 + c] = Math.round(255 * Math.pow(data[i * 3 + c] / 255, GAMMA));
  rgba[i * 4 + 3] = alpha[i];
}

// A one-pixel blur on the alpha alone smooths the stair-stepping along the edge.
const raw = { raw: { width: W, height: H, channels: 4 } };
const softAlpha = await sharp(Buffer.from(alpha), { raw: { width: W, height: H, channels: 1 } })
  .blur(0.6)
  .extractChannel(0)
  .raw()
  .toBuffer();
for (let i = 0; i < N; i++) rgba[i * 4 + 3] = softAlpha[i];

const out = path.join(ROOT, "public", "me.webp");
const meta = await sharp(rgba, raw).webp({ quality: 86, alphaQuality: 90 }).toFile(out);
console.log(`me.webp ${W}x${H}, ${Math.round(meta.size / 1024)} KB`);

if (flag === "--preview" && previewPath) {
  // The cut-out over the site's background and glow, for a quick visual check.
  const glow = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><radialGradient id="g" cx="50%" cy="60%" r="55%"><stop offset="0" stop-color="#4f7dff" stop-opacity="0.45"/><stop offset="0.45" stop-color="#4f7dff" stop-opacity="0.08"/><stop offset="1" stop-color="#4f7dff" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="#0a0a0c"/><rect width="100%" height="100%" fill="url(#g)"/></svg>`,
  );
  await sharp(glow)
    .composite([{ input: out }])
    .jpeg({ quality: 85 })
    .toFile(previewPath);
  console.log(`preview ${previewPath}`);
}
