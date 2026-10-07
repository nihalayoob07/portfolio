// Converts the Bambu Studio .3mf projects listed in models.config.json into
// compact GLBs for the 3D viewer, plus a thumbnail and stats per model.
//
//   node scripts/prepare-models.mjs [--debug]
//
// Each entry picks a layout:
//   "assembly": "bambu"  - parts where Bambu Studio's assembly view puts them
//                          (Metadata/model_settings.config <assemble_item>), with
//                          "place" overrides for parts it has no position for
//   "assembly": "plates" - every print plate as laid out for printing, plates in a grid
// "include" brings in objects left beside the plates; "omit" drops parts.
// Part colours come from each object's filament in the project, unless "colors"
// overrides them. Units stay in millimetres.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { unzipSync, strFromU8 } from "fflate";
import sharp from "sharp";
import * as THREE from "three";
import { mergeVertices, toCreasedNormals } from "three/addons/utils/BufferGeometryUtils.js";
import { Document, NodeIO } from "@gltf-transform/core";
import { EXTMeshoptCompression, KHRMeshQuantization } from "@gltf-transform/extensions";
import { meshopt } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public", "models");
const STATS_FILE = path.join(ROOT, "src", "content", "models.generated.json");
const TRIANGLE_BUDGET = 160_000;
const CREASE_ANGLE = THREE.MathUtils.degToRad(32);
const PLATE_GAP = 18;
const FALLBACK_COLOR = "#e8e5dd";
const DEBUG = process.argv.includes("--debug");

const config = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts", "models.config.json"), "utf8"));
await MeshoptSimplifier.ready;
await MeshoptEncoder.ready;
fs.mkdirSync(OUT_DIR, { recursive: true });

const attr = (s, name) => {
  const m = s.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`));
  return m ? m[1] : undefined;
};

// 3MF matrices are row-vector 4x3 ("m00 m01 m02 m10 ... m32"); convert to a column-vector Matrix4.
function matrixFrom(transform) {
  const m = new THREE.Matrix4();
  if (!transform) return m;
  const v = transform.trim().split(/\s+/).map(Number);
  return m.set(v[0], v[3], v[6], v[9], v[1], v[4], v[7], v[10], v[2], v[5], v[8], v[11], 0, 0, 0, 1);
}

function parseModelFile(xml) {
  const objects = new Map();
  for (const [, head, body] of xml.matchAll(/<object\b([^>]*)>([\s\S]*?)<\/object>/g)) {
    const obj = { mesh: null, components: [] };
    if (body.includes("<mesh")) {
      const verts = [];
      for (const [, a] of body.matchAll(/<vertex\b([^>]*)\/>/g)) verts.push(+attr(a, "x"), +attr(a, "y"), +attr(a, "z"));
      const tris = [];
      for (const [, a] of body.matchAll(/<triangle\b([^>]*)\/>/g)) tris.push(+attr(a, "v1"), +attr(a, "v2"), +attr(a, "v3"));
      obj.mesh = { positions: new Float32Array(verts), indices: new Uint32Array(tris) };
    }
    for (const [, a] of body.matchAll(/<component\b([^>]*)\/>/g)) {
      obj.components.push({ objectid: attr(a, "objectid"), path: attr(a, "p:path"), transform: attr(a, "transform") });
    }
    objects.set(attr(head, "id"), obj);
  }
  const items = [...xml.matchAll(/<item\b([^>]*)\/>/g)].map(([, a]) => ({
    objectid: attr(a, "objectid"),
    transform: attr(a, "transform"),
  }));
  return { objects, items };
}

function load3mf(file, include = new Set()) {
  const zip = unzipSync(new Uint8Array(fs.readFileSync(file)));
  const files = new Map();
  for (const [name, data] of Object.entries(zip)) if (name.endsWith(".model")) files.set("/" + name, parseModelFile(strFromU8(data)));
  const main = files.get("/3D/3dmodel.model");
  if (!main) throw new Error(`${file}: no 3D/3dmodel.model`);

  // Names, filament slots, plates and assembly positions from Bambu's settings, when present.
  const meta = new Map();
  const info = (id) => meta.get(id) ?? meta.set(id, { vols: new Map() }).get(id);
  const plateOf = new Map();
  const settings = zip["Metadata/model_settings.config"] ? strFromU8(zip["Metadata/model_settings.config"]) : "";
  for (const [, id, body] of settings.matchAll(/<object id="(\d+)">([\s\S]*?)<\/object>/g)) {
    info(id).name = (body.match(/key="name" value="([^"]*)"/) || [])[1];
    info(id).extruder = +((body.match(/key="extruder" value="(\d+)"/) || [])[1] || 1);
  }
  for (const [, body] of settings.matchAll(/<plate>([\s\S]*?)<\/plate>/g)) {
    const plate = +(body.match(/plater_id" value="(\d+)"/) || [])[1] || 1;
    for (const [, id] of body.matchAll(/object_id" value="(\d+)"/g)) plateOf.set(id, plate);
  }
  for (const [, a] of settings.matchAll(/<assemble_item\b([^>]*)\/>/g)) {
    const o = info(attr(a, "object_id"));
    if (attr(a, "instance_id") === "0") o.instance = matrixFrom(attr(a, "transform"));
    else if (attr(a, "volume_id") !== undefined) o.vols.set(+attr(a, "volume_id"), matrixFrom(attr(a, "transform")));
  }

  let filaments = [];
  try {
    const project = JSON.parse(strFromU8(zip["Metadata/project_settings.config"]));
    filaments = (project.filament_colour || []).map((c) => c.slice(0, 7));
  } catch {
    /* not a Bambu project: parts fall back to the default colour */
  }

  // One entry per build item; geometry is built later once the layout is known.
  const items = main.items
    // Objects left beside the plates aren't printed, unless the entry asks for them by name.
    .filter((item) => !plateOf.size || plateOf.has(item.objectid) || include.has(meta.get(item.objectid)?.name))
    .map((item) => {
      const m = meta.get(item.objectid) ?? { vols: new Map() };
      return {
        id: item.objectid,
        name: m.name || `part_${item.objectid}`,
        plate: plateOf.get(item.objectid) || 1,
        color: filaments[(m.extruder || 1) - 1],
        printMatrix: matrixFrom(item.transform),
        assembly: m.instance ? { instance: m.instance, vols: m.vols } : null,
      };
    });

  // Flattens an object into positions/indices; volumeMatrix(k, componentMatrix) picks each top-level part's transform.
  const geometry = (objectid, root, volumeMatrix) => {
    const positions = [];
    const indices = [];
    const v = new THREE.Vector3();
    const visit = (filePath, id, matrix, depth, k) => {
      const obj = files.get(filePath)?.objects.get(id);
      if (!obj) throw new Error(`${file}: missing object ${filePath}#${id}`);
      if (obj.mesh) {
        const base = positions.length / 3;
        const p = obj.mesh.positions;
        for (let i = 0; i < p.length; i += 3) {
          v.set(p[i], p[i + 1], p[i + 2]).applyMatrix4(matrix);
          positions.push(v.x, v.y, v.z);
        }
        for (const ix of obj.mesh.indices) indices.push(base + ix);
      }
      obj.components.forEach((c, i) => {
        const own = matrixFrom(c.transform);
        const local = depth === 0 ? volumeMatrix(i, own) : own;
        visit(c.path || filePath, c.objectid, matrix.clone().multiply(local), depth + 1, depth === 0 ? i : k);
      });
    };
    visit("/3D/3dmodel.model", objectid, root.clone(), 0, 0);
    return { positions: new Float32Array(positions), indices: new Uint32Array(indices) };
  };

  // Use the most detailed plate render as the thumbnail.
  const thumbKey = Object.keys(zip)
    .filter((k) => /^Metadata\/plate_\d+\.png$/.test(k))
    .sort((a, b) => zip[b].length - zip[a].length)[0];
  return { items, geometry, plates: new Set(items.map((i) => i.plate)).size, thumb: thumbKey ? zip[thumbKey] : null };
}

function bounds(positions) {
  const b = new THREE.Box3();
  const v = new THREE.Vector3();
  for (let i = 0; i < positions.length; i += 3) b.expandByPoint(v.set(positions[i], positions[i + 1], positions[i + 2]));
  return b;
}

function transform(positions, matrix) {
  const v = new THREE.Vector3();
  for (let i = 0; i < positions.length; i += 3) {
    v.set(positions[i], positions[i + 1], positions[i + 2]).applyMatrix4(matrix);
    positions[i] = v.x;
    positions[i + 1] = v.y;
    positions[i + 2] = v.z;
  }
}

// Plates keep their internal layout; plates themselves go into a grid.
function layoutPlates(parts) {
  const plates = [...new Set(parts.map((p) => p.plate))].sort((a, b) => a - b);
  const cols = Math.ceil(Math.sqrt(plates.length));
  const boxes = plates.map((plate) => {
    const box = new THREE.Box3();
    for (const p of parts.filter((x) => x.plate === plate)) box.union(bounds(p.positions));
    return box;
  });
  const colWidth = Math.max(...boxes.map((b) => b.max.x - b.min.x));
  const rowDepth = Math.max(...boxes.map((b) => b.max.y - b.min.y));
  plates.forEach((plate, i) => {
    const box = boxes[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    // Centre each plate inside its grid cell, resting on z = 0.
    const dx = col * (colWidth + PLATE_GAP) + (colWidth - (box.max.x - box.min.x)) / 2 - box.min.x;
    const dy = -row * (rowDepth + PLATE_GAP) - (rowDepth - (box.max.y - box.min.y)) / 2 - box.max.y;
    for (const p of parts.filter((x) => x.plate === plate)) transform(p.positions, new THREE.Matrix4().makeTranslation(dx, dy, -box.min.z));
  });
}

// Puts a part from its print position to a hand-placed one: rotate about its own centre, then move that centre.
function place(positions, { rotate = [0, 0, 0], center }) {
  const c = bounds(positions).getCenter(new THREE.Vector3());
  const r = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...rotate.map(THREE.MathUtils.degToRad), "XYZ"));
  const to = center ? new THREE.Vector3(...center) : c;
  transform(
    positions,
    new THREE.Matrix4()
      .makeTranslation(to.x, to.y, to.z)
      .multiply(r)
      .multiply(new THREE.Matrix4().makeTranslation(-c.x, -c.y, -c.z)),
  );
}

function simplify(part, ratio) {
  const target = Math.max(3, Math.floor((part.indices.length * ratio) / 3) * 3);
  // Error is relative to the part's size; 1% keeps the silhouette intact.
  const [indices] = MeshoptSimplifier.simplify(part.indices, part.positions, 3, target, 0.01);
  return indices;
}

async function convert(entry) {
  const { items, geometry, plates, thumb } = load3mf(entry.source.replace(/^~(?=[/\\])/, os.homedir()), new Set(entry.include || []));
  const assembled = entry.assembly === "bambu";
  const omit = new Set(entry.omit || []);

  const parts = [];
  for (const item of items) {
    if (omit.has(item.name)) continue;
    const override = entry.place?.[item.name];
    let g;
    if (!assembled || override) {
      g = geometry(item.id, item.printMatrix, (_k, own) => own);
      if (override) place(g.positions, override);
    } else if (item.assembly) {
      g = geometry(item.id, item.assembly.instance, (k, own) => item.assembly.vols.get(k) ?? own);
    } else {
      console.warn(`  ${entry.slug}: "${item.name}" has no assembly position; add it to "place" or "omit". Skipped.`);
      continue;
    }
    if (!g.indices.length) continue;
    parts.push({ name: item.name, plate: item.plate, color: entry.colors?.[item.name] ?? item.color ?? FALLBACK_COLOR, ...g });
  }
  if (!assembled) layoutPlates(parts);

  if (DEBUG) {
    for (const p of parts) {
      const b = bounds(p.positions);
      const f = (v) => [v.x, v.y, v.z].map((n) => n.toFixed(1)).join(", ");
      console.log(`  ${p.name.padEnd(28)} ${p.color}  min(${f(b.min)})  max(${f(b.max)})`);
    }
  }

  const sourceTriangles = parts.reduce((n, p) => n + p.indices.length / 3, 0);
  // Trim very dense parts down to the shared triangle budget.
  if (sourceTriangles > TRIANGLE_BUDGET) {
    const heavy = parts.filter((p) => p.indices.length / 3 > 20_000);
    const light = sourceTriangles - heavy.reduce((n, p) => n + p.indices.length / 3, 0);
    const ratio = Math.max(0.05, (TRIANGLE_BUDGET - light) / (sourceTriangles - light));
    for (const p of heavy) p.indices = simplify(p, ratio);
  }

  // Z-up millimetres -> Y-up, centred on X/Z, resting on Y = 0.
  const all = new THREE.Box3();
  for (const p of parts) all.union(bounds(p.positions));
  const centre = all.getCenter(new THREE.Vector3());
  const doc = new Document();
  const buffer = doc.createBuffer();
  const scene = doc.createScene(entry.slug);
  const materials = new Map();
  let displayTriangles = 0;
  for (const p of parts) {
    const src = p.positions;
    const yUp = new Float32Array(src.length);
    for (let i = 0; i < src.length; i += 3) {
      yUp[i] = src[i] - centre.x;
      yUp[i + 1] = src[i + 2] - all.min.z;
      yUp[i + 2] = -(src[i + 1] - centre.y);
    }
    let geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(yUp, 3));
    geom.setIndex(new THREE.BufferAttribute(p.indices, 1));
    geom = mergeVertices(toCreasedNormals(geom, CREASE_ANGLE), 1e-4);
    displayTriangles += geom.index.count / 3;

    // glTF colours are linear; THREE.Color converts from the sRGB hex.
    if (!materials.has(p.color)) {
      const c = new THREE.Color(p.color);
      materials.set(
        p.color,
        doc.createMaterial(p.color).setBaseColorFactor([c.r, c.g, c.b, 1]).setRoughnessFactor(0.6).setMetallicFactor(0),
      );
    }
    const prim = doc
      .createPrimitive()
      .setMaterial(materials.get(p.color))
      .setAttribute("POSITION", doc.createAccessor().setType("VEC3").setArray(geom.attributes.position.array).setBuffer(buffer))
      .setAttribute("NORMAL", doc.createAccessor().setType("VEC3").setArray(geom.attributes.normal.array).setBuffer(buffer))
      .setIndices(doc.createAccessor().setType("SCALAR").setArray(new Uint32Array(geom.index.array)).setBuffer(buffer));
    scene.addChild(doc.createNode(p.name).setMesh(doc.createMesh(p.name).addPrimitive(prim)));
  }

  await doc.transform(meshopt({ encoder: MeshoptEncoder, level: "medium" }));
  const io = new NodeIO()
    .registerExtensions([EXTMeshoptCompression, KHRMeshQuantization])
    .registerDependencies({ "meshopt.encoder": MeshoptEncoder });
  const glb = await io.writeBinary(doc);
  fs.writeFileSync(path.join(OUT_DIR, `${entry.slug}.glb`), glb);

  if (thumb)
    await sharp(Buffer.from(thumb))
      .resize(320, 320, { fit: "inside" })
      .webp({ quality: 82 })
      .toFile(path.join(OUT_DIR, `${entry.slug}.webp`));

  const size = all.getSize(new THREE.Vector3());
  const round = (n) => Math.round(n * 10) / 10;
  return {
    slug: entry.slug,
    title: entry.title,
    glb: `/models/${entry.slug}.glb`,
    thumb: thumb ? `/models/${entry.slug}.webp` : null,
    assembled,
    parts: parts.length,
    plates,
    sourceTriangles,
    displayTriangles,
    // Z-up millimetres: width × depth × height of what the viewer shows.
    size: [round(size.x), round(size.y), round(size.z)],
    bytes: glb.byteLength,
  };
}

const stats = [];
for (const entry of config) {
  if (DEBUG) console.log(`${entry.slug}:`);
  const s = await convert(entry);
  stats.push(s);
  console.log(
    `${s.slug}: ${s.assembled ? "assembled" : "print plates"}, ${s.parts} parts, ${s.sourceTriangles} -> ${s.displayTriangles} tris, ${s.size.join(" x ")} mm, ${(s.bytes / 1024).toFixed(0)} KB`,
  );
}
fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2) + "\n");
