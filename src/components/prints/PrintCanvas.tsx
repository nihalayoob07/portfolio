"use client";

import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, useGLTF } from "@react-three/drei";
import { EffectComposer, N8AO, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import type { ModelEntry } from "@/content/models";

const BG = "#0a0a0c";
const { degToRad: rad, smoothstep } = THREE.MathUtils;
const ease = (p: number, a: number, b: number) => smoothstep(p, a, b);

export type PrintCanvasProps = {
  model: ModelEntry;
  // 0 → 1 as the panel scrolls; read every frame.
  progress: RefObject<number>;
  // performance.now() of the last click on the clicker.
  clickedAt: RefObject<number>;
  running: boolean;
  onReady: () => void;
};

// Camera and moving parts for each print, as a function of scroll progress.
// lift raises the aim point by that many print radii (room for an open lid).
type Pose = { az: number; el: number; dist: number; lid: number; lift?: number };
const POSES: Record<string, (p: number) => Pose> = {
  // The lid swings open on its hinge while the camera rises to look inside.
  medbox: (p) => {
    const open = ease(p, 0.1, 0.62);
    return { az: rad(30 - 45 * p), el: rad(16 + 26 * ease(p, 0.05, 0.7)), dist: 1 + 0.55 * open, lid: rad(-108) * open, lift: 0.62 * open };
  },
  // The cat faces a box corner (-45°); the camera drifts across its face.
  "cat-clicker": (p) => ({ az: rad(-70 + 50 * p), el: rad(12 + 10 * p), dist: 0.98, lid: 0 }),
  // Front on, so the name reads, then round to show the ribs.
  "tissue-box": (p) => ({ az: rad(-6 + 42 * p), el: rad(9 + 22 * p), dist: 0.9 - 0.06 * p, lid: 0 }),
  // One full turn, rising like a helix.
  "z-ring": (p) => ({ az: rad(-90 + 360 * p), el: rad(10 + 62 * p), dist: 0.95, lid: 0 }),
};

// PLA-like plastic with FDM layer lines: 0.2 mm ridges along the print's vertical axis,
// shaded into the normal and faded out wherever a layer would be smaller than a couple of pixels.
function plastic(color: THREE.Color) {
  const m = new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.52,
    metalness: 0,
    clearcoat: 0.12,
    clearcoatRoughness: 0.6,
    sheen: 0.35,
    sheenRoughness: 0.8,
    sheenColor: new THREE.Color("#ffffff"),
  });
  m.onBeforeCompile = (shader) => {
    const vary = "varying vec3 vPrint;\nvarying vec3 vUpView;\n";
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${vary}`)
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvPrint = position;\nvUpView = normalize(normalMatrix * vec3(0.0, 1.0, 0.0));",
      );
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `#include <common>\n${vary}`).replace(
      "#include <normal_fragment_maps>",
      `#include <normal_fragment_maps>
      {
        float layers = vPrint.y / 0.2;
        float amp = 0.2 * (1.0 - smoothstep(0.25, 0.6, fwidth(layers)));
        vec3 along = vUpView - normal * dot(vUpView, normal);
        normal = normalize(normal + along * cos(layers * 6.2831853) * amp);
      }`,
    );
  };
  return m;
}

// Clear resin for the ring's crystal.
function crystal(color: THREE.Color) {
  return new THREE.MeshPhysicalMaterial({
    color: color.clone().lerp(new THREE.Color("#ffffff"), 0.35),
    transmission: 1,
    thickness: 4,
    roughness: 0.06,
    ior: 1.5,
    attenuationColor: color,
    attenuationDistance: 8,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
  });
}

// Quantised GLB attributes -> plain floats with the node transform baked in (millimetres, Y-up).
function bake(mesh: THREE.Mesh) {
  const g = new THREE.BufferGeometry();
  for (const name of ["position", "normal"]) {
    const a = mesh.geometry.getAttribute(name);
    const arr = new Float32Array(a.count * 3);
    for (let i = 0; i < a.count; i++) {
      arr[i * 3] = a.getX(i);
      arr[i * 3 + 1] = a.getY(i);
      arr[i * 3 + 2] = a.getZ(i);
    }
    g.setAttribute(name, new THREE.BufferAttribute(arr, 3));
  }
  g.setIndex(mesh.geometry.index);
  g.applyMatrix4(mesh.matrixWorld);
  return g;
}

type Piece = { key: string; part: string; geometry: THREE.BufferGeometry; material: THREE.Material; top: number };

function usePieces(url: string) {
  const { scene } = useGLTF(url, false, true);
  return useMemo(() => {
    scene.updateMatrixWorld(true);
    const pieces: Piece[] = [];
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      let node: THREE.Object3D = mesh;
      while (node.parent && node.parent !== scene) node = node.parent;
      const src = (mesh.material as THREE.MeshStandardMaterial).color;
      // Real white plastic reflects ~85%, not 100%.
      const color = src.clone().multiplyScalar(0.86);
      const material = /crystal/i.test(node.name) ? crystal(color) : plastic(color);
      const geometry = bake(mesh);
      geometry.computeBoundingBox();
      pieces.push({ key: mesh.uuid, part: node.name, geometry, material, top: geometry.boundingBox!.max.y });
    });
    const box = new THREE.Box3();
    for (const p of pieces) box.union(p.geometry.boundingBox!);
    return { pieces, box };
  }, [scene]);
}

function Print({ model, progress, clickedAt, onReady }: Omit<PrintCanvasProps, "running">) {
  const { pieces, box } = usePieces(model.glb);
  const lid = useRef<THREE.Group>(null);
  const pressed = useRef<THREE.Group>(null);
  const stem = useRef<THREE.Group>(null);
  const camera = useThree((s) => s.camera as THREE.PerspectiveCamera);
  const size = useThree((s) => s.size);
  const pose = POSES[model.slug] ?? POSES["tissue-box"];
  const hinge = model.hinge;
  const lidParts = new Set(hinge?.parts ?? []);
  // The cat's head and everything set into it go down when it's clicked, along with the switch stem.
  const isPressed = (p: Piece) => model.slug === "cat-clicker" && p.part !== "box" && p.part !== "switch";
  // The switch's stem is its tallest piece.
  const stemTop = Math.max(...pieces.filter((p) => p.part === "switch").map((p) => p.top));
  const isStem = (p: Piece) => p.part === "switch" && p.top === stemTop;

  const centre = useMemo(() => box.getCenter(new THREE.Vector3()), [box]);
  const radius = useMemo(() => box.getSize(new THREE.Vector3()).length() / 2, [box]);
  const look = useRef({ az: 0, el: 0, dist: 0, lid: 0, lift: 0, ready: false });

  useEffect(() => onReady(), [onReady]);

  useFrame((state, dt) => {
    const target = pose(progress.current ?? 0);
    const s = look.current;
    // Ease towards the scroll pose so scrubbing feels smooth, and follow the pointer a touch.
    const k = s.ready ? 1 - Math.exp(-dt * 6) : 1;
    s.ready = true;
    s.az += (target.az + state.pointer.x * rad(5) - s.az) * k;
    s.el += (target.el + state.pointer.y * rad(3) - s.el) * k;
    s.dist += (target.dist - s.dist) * k;
    s.lid += (target.lid - s.lid) * k;
    s.lift += ((target.lift ?? 0) - s.lift) * k;

    // On desktop the captions take the right 38%, so the print is framed in the left 62%:
    // the view is shifted right (the print appears left) and fitted to that narrower width.
    const wide = size.width >= 1024;
    const room = wide ? 0.62 : 1;
    if (wide) camera.setViewOffset(size.width, size.height, (size.width * (1 - room)) / 2, 0, size.width, size.height);
    else camera.clearViewOffset();
    // Fit the bounding sphere to the narrower field of view (portrait screens are narrow).
    const vfov = rad(camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * ((size.width * room) / size.height));
    const d = (radius / Math.sin(Math.min(vfov, hfov) / 2)) * s.dist;
    const aim = centre.clone().setY(centre.y * 0.92 + radius * s.lift);
    camera.position.set(
      aim.x + d * Math.cos(s.el) * Math.sin(s.az),
      aim.y + d * Math.sin(s.el),
      aim.z + d * Math.cos(s.el) * Math.cos(s.az),
    );
    camera.near = d / 50;
    camera.far = d * 20;
    camera.updateProjectionMatrix();
    camera.lookAt(aim);
    // Fog starts behind the print, so only the set fades into the page.
    const fog = state.scene.fog as THREE.Fog;
    fog.near = d + radius;
    fog.far = d + radius * 9;

    if (lid.current && hinge) lid.current.quaternion.setFromAxisAngle(new THREE.Vector3().fromArray(hinge.axis), s.lid);
    if (pressed.current && stem.current) {
      // Keycap travel: 2.5 mm down fast, then springs back.
      const t = (performance.now() - (clickedAt.current ?? -1e9)) / 1000;
      const dip = t < 0.05 ? t / 0.05 : Math.max(0, 1 - (t - 0.05) / 0.18);
      pressed.current.position.y = -2.5 * dip;
      stem.current.position.y = -2.5 * dip;
    }
  });

  const mesh = (p: Piece) => <mesh key={p.key} geometry={p.geometry} material={p.material} castShadow receiveShadow />;
  const pivot = hinge ? new THREE.Vector3().fromArray(hinge.point) : null;

  return (
    <group>
      {pieces.filter((p) => !lidParts.has(p.part) && !isPressed(p) && !isStem(p)).map(mesh)}
      {pivot && (
        <group ref={lid} position={pivot}>
          <group position={pivot.clone().negate()}>{pieces.filter((p) => lidParts.has(p.part)).map(mesh)}</group>
        </group>
      )}
      <group ref={pressed}>{pieces.filter(isPressed).map(mesh)}</group>
      <group ref={stem}>{pieces.filter(isStem).map(mesh)}</group>
      <Studio radius={radius} centre={centre} orbit={model.slug === "z-ring"} />
    </group>
  );
}

// A seamless curved backdrop (floor sweeping up into a wall), Z = towards the camera.
function cyclorama(width: number, front: number, back: number, r: number, height: number) {
  const profile: [number, number][] = [
    [front, 0],
    [-back, 0],
  ];
  for (let i = 1; i <= 24; i++) {
    const a = (i / 24) * (Math.PI / 2);
    profile.push([-back - Math.sin(a) * r, r - Math.cos(a) * r]);
  }
  profile.push([-back - r, height]);
  const pos: number[] = [];
  const idx: number[] = [];
  profile.forEach(([z, y], i) => {
    pos.push(-width / 2, y, z, width / 2, y, z);
    if (i > 0) {
      const a = (i - 1) * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// Studio set: dark sweep that melts into the page, soft key from above-left, cool fill,
// a cobalt rim from behind, and a pool of light on the backdrop.
function Studio({ radius, centre, orbit }: { radius: number; centre: THREE.Vector3; orbit: boolean }) {
  const r = radius;
  const sweep = useMemo(() => cyclorama(r * 30, r * 14, r * 2.6, r * 2.2, r * 14), [r]);
  const key = useRef<THREE.DirectionalLight>(null);
  const pool = useRef<THREE.SpotLight>(null);
  useEffect(() => {
    key.current!.target.position.copy(centre);
    key.current!.target.updateMatrixWorld();
    pool.current!.target.position.set(0, r * 1.2, -r * 3.5);
    pool.current!.target.updateMatrixWorld();
  }, [centre, r]);

  return (
    <>
      {orbit ? (
        <mesh rotation-x={-Math.PI / 2} receiveShadow>
          <circleGeometry args={[r * 40, 64]} />
          <meshStandardMaterial color="#111114" roughness={0.92} />
        </mesh>
      ) : (
        <mesh geometry={sweep} receiveShadow>
          <meshStandardMaterial color="#111114" roughness={0.92} side={THREE.DoubleSide} />
        </mesh>
      )}
      <directionalLight
        ref={key}
        castShadow
        position={[centre.x - r * 2.2, centre.y + r * 4, centre.z + r * 2.4]}
        intensity={2.3}
        color="#fff6ea"
        shadow-mapSize={[2048, 2048]}
        shadow-radius={6}
        shadow-blurSamples={16}
        shadow-bias={-0.0002}
        shadow-normalBias={r * 0.004}
        shadow-camera-left={-r * 1.8}
        shadow-camera-right={r * 1.8}
        shadow-camera-top={r * 1.8}
        shadow-camera-bottom={-r * 1.8}
        shadow-camera-near={r * 0.5}
        shadow-camera-far={r * 12}
      />
      <directionalLight position={[r * 3, r * 1.5, r * 2]} intensity={0.5} color="#dfe6ff" />
      <directionalLight position={[r * 1.5, r * 2.5, -r * 4]} intensity={1} color="#4f7dff" />
      {orbit && <directionalLight position={[0, r * 6, 0]} intensity={1.2} color="#ffffff" />}
      <spotLight ref={pool} position={[0, r * 5, r * 2]} angle={0.5} penumbra={1} decay={0} intensity={orbit ? 0 : 1.4} color="#e4e2f0" />
      <Environment resolution={256} environmentIntensity={orbit ? 1.1 : 0.75}>
        <Lightformer form="rect" intensity={3} position={[-2, 4, 3]} scale={[5, 3, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.2} position={[4, 1, 2]} scale={[2, 4, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={2} color="#4f7dff" position={[2, 2, -4]} scale={[3, 2, 1]} target={[0, 0, 0]} />
        <Lightformer form="ring" intensity={0.6} position={[0, 6, 0]} scale={4} target={[0, 0, 0]} />
      </Environment>
    </>
  );
}

export default function PrintCanvas({ model, progress, clickedAt, running, onReady }: PrintCanvasProps) {
  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.75]}
      frameloop={running ? "always" : "never"}
      camera={{ fov: 30, position: [0, 100, 400] }}
      gl={{ antialias: false, powerPreference: "high-performance" }}
    >
      <color attach="background" args={[BG]} />
      <fog attach="fog" args={[BG, 1000, 4000]} />
      <Suspense fallback={null}>
        <Print model={model} progress={progress} clickedAt={clickedAt} onReady={onReady} />
      </Suspense>
      <EffectComposer multisampling={4}>
        <N8AO aoRadius={Math.max(...model.size) * 0.08} distanceFalloff={1} intensity={2.4} quality="medium" halfRes />
        <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      </EffectComposer>
    </Canvas>
  );
}
