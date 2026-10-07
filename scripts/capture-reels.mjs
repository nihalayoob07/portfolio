// Records the website reels for the Work section: real screens of each flow plus where the cursor goes.
//   npm run capture:reels [printvault|printledger]   (PrintLedger needs `npm run dev` on port 3100)
// Frames land in public/work/reels/<reel>/, positions in src/content/reels/<reel>.json.
// Print Vault is only read: the cart lives in this headless browser's localStorage and checkout is
// captured empty (the reel types over it), so nothing reaches the store.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import puppeteer from "puppeteer-core";
import sharp from "sharp";

const VIEW = { width: 1440, height: 900 };
const DPR = 1.5;
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function connect(port = 9333) {
  // Edge's launcher hands off to another process and exits, so connect over the debugging port.
  spawn(
    EDGE,
    [
      "--headless=new",
      "--hide-scrollbars",
      "--no-first-run",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${path.join(os.tmpdir(), "edge-reel-profile")}`,
      "about:blank",
    ],
    {
      detached: true,
      stdio: "ignore",
    },
  ).unref();
  for (let i = 0; i < 60; i++) {
    try {
      return await puppeteer.connect({ browserURL: `http://127.0.0.1:${port}`, defaultViewport: null, protocolTimeout: 30000 });
    } catch {
      await sleep(250);
    }
  }
  throw new Error("could not reach Edge");
}

function recorder(page, reel) {
  const dir = path.join("public/work/reels", reel);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const manifest = { viewport: [VIEW.width, VIEW.height], frames: {}, targets: {} };
  return {
    manifest,
    // A screen; `height` captures that much of the page (for frames the reel scrolls through).
    async frame(id, height = VIEW.height) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await sleep(300);
      const png = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: VIEW.width, height }, captureBeyondViewport: true });
      const file = `${id}.webp`;
      await sharp(png).webp({ quality: 80 }).toFile(path.join(dir, file));
      manifest.frames[id] = { src: `/work/reels/${reel}/${file}`, height };
    },
    // Page-space box of an element, for cursor moves and typing overlays.
    async target(name, frame, selector) {
      const box = await page.evaluate((sel) => {
        const el = typeof sel === "string" ? document.querySelector(sel) : null;
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y + scrollY, w: r.width, h: r.height };
      }, selector);
      if (!box) throw new Error(`${reel}: no element for ${name} (${selector})`);
      manifest.targets[name] = { frame, ...Object.fromEntries(Object.entries(box).map(([k, v]) => [k, Math.round(v)])) };
    },
    save() {
      fs.mkdirSync("src/content/reels", { recursive: true });
      fs.writeFileSync(`src/content/reels/${reel}.json`, JSON.stringify(manifest, null, 1) + "\n");
      console.log(`${reel}: ${Object.keys(manifest.frames).length} frames`);
    },
  };
}

// Finds an element by its visible text or aria-label and tags it so `target` can find it.
const tag = (page, name, text, scope = "body") =>
  page.evaluate(
    (name, text, scope) => {
      const el = [...document.querySelector(scope).querySelectorAll("a, button, input, select, textarea, [role=button]")].find((e) =>
        `${e.getAttribute("aria-label") || ""} ${e.innerText || ""}`.includes(text),
      );
      if (el) el.setAttribute("data-reel", name);
      return !!el;
    },
    name,
    text,
    scope,
  );

async function printvault(page) {
  const rec = recorder(page, "printvault");
  // Still frames: reduced motion stops the hero's rotating word (and other loops) mid-change.
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  const go = async (url) => {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    // Scroll through once so lazy sections and images load, then back to the top.
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
    });
    await sleep(1500);
    // The store suggests signing in after a moment; a guest says "Not now".
    if (await tag(page, "notnow", "Not now")) {
      await page.click('[data-reel="notnow"]');
      await sleep(500);
    }
  };
  // Start from an empty cart, as a first-time visitor.
  await go("https://theprintvault.in/");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await go("https://theprintvault.in/");
  await rec.frame("home", 2700);
  await rec.target("product", "home", 'a[href="/product/kawaii-cat-phone-stand"]');

  await go("https://theprintvault.in/product/kawaii-cat-phone-stand");
  await rec.frame("product");
  await tag(page, "add", "Add to cart");
  await rec.target("add", "product", '[data-reel="add"]');
  await page.click('[data-reel="add"]');
  await sleep(1200);
  // Dismiss the sign-in nudge that follows the first add.
  if (await tag(page, "notnow", "Not now")) await page.click('[data-reel="notnow"]');
  await sleep(600);
  await rec.frame("added");
  await rec.target("cartIcon", "added", 'header a[href="/cart"], header [aria-label^="Cart"]');

  await go("https://theprintvault.in/cart");
  await rec.frame("cart");
  await rec.target("checkout", "cart", 'aside a[href="/checkout"]');

  await go("https://theprintvault.in/checkout");
  await rec.frame("checkout", 1500);
  for (const f of ["customer_name", "email", "phone", "line1", "line2", "city", "pincode", "state"])
    await rec.target(f, "checkout", `[name="${f}"]`);
  await rec.target("pay", "checkout", 'button[type="submit"]');
  // Leave this browser's cart empty again.
  await page.evaluate(() => localStorage.clear());
  rec.save();
}

async function printledger(page) {
  const rec = recorder(page, "printledger");
  await page.goto("http://localhost:3100/demos/printledger.html", { waitUntil: "networkidle2", timeout: 60000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle2" });
  await sleep(1200);
  const type = async (sel, text) => {
    await page.click(sel, { clickCount: 3 });
    await page.type(sel, text, { delay: 20 });
    await page.evaluate(() => document.activeElement.blur());
    await page.mouse.move(2, 2); // no hover spinners in the frame
    await sleep(500);
  };
  await rec.frame("empty");
  for (const [name, sel] of [
    ["weight", "#q-weight"],
    ["time", "#q-time"],
    ["product", "#q-product"],
    ["customer", "#q-customer"],
  ])
    await rec.target(name, "empty", sel);
  await type("#q-weight", "86");
  await rec.frame("weight");
  await type("#q-time", "4.5");
  await rec.frame("time");
  await type("#q-product", "Articulated dragon");
  await type("#q-customer", "Meera");
  await rec.frame("details");
  await tag(page, "log", "Log this sale");
  await rec.target("log", "details", '[data-reel="log"]');
  await page.click('[data-reel="log"]');
  await sleep(1200);
  await rec.frame("logged");
  await tag(page, "ledger", "Open the ledger");
  await rec.target("ledger", "logged", '[data-reel="ledger"]');
  // A few more sales off camera, so the ledger has something to show.
  for (const [what, grams, hours, who] of [
    ["Phone stand", "32", "1.5", "Arjun"],
    ["Self-watering planter", "140", "7", "Sana"],
    ["Keychains ×10", "45", "2.5", "Rahul"],
  ]) {
    await type("#q-weight", grams);
    await type("#q-time", hours);
    await type("#q-product", what);
    await type("#q-customer", who);
    await tag(page, "log", "Log this sale");
    await page.click('[data-reel="log"]');
    await sleep(800);
  }
  await sleep(5000); // let the undo toast clear
  await tag(page, "ledger", "Open the ledger");
  await page.click('[data-reel="ledger"]');
  await sleep(1200);
  await page.mouse.move(2, 2);
  await rec.frame("ledgerView");
  await page.keyboard.press("Escape");
  await sleep(800);
  if (await tag(page, "bills", "Open bills")) {
    await rec.target("bills", "ledgerView", '[data-reel="bills"]');
    await page.click('[data-reel="bills"]');
    await sleep(1200);
    await page.mouse.move(2, 2);
    await rec.frame("bills");
    await page.keyboard.press("Escape");
    await sleep(800);
  }
  await page.evaluate(() => localStorage.clear());
  rec.save();
}

const only = process.argv[2];
const browser = await connect();
try {
  const page = await browser.newPage();
  page.on("dialog", (d) => {
    console.log(`dialog: ${d.message()}`);
    d.dismiss();
  });
  await page.setViewport({ ...VIEW, deviceScaleFactor: DPR });
  if (!only || only === "printvault") await printvault(page);
  if (!only || only === "printledger") await printledger(page);
} finally {
  await browser.close();
}
