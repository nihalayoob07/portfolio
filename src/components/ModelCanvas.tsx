"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { Bounds, ContactShadows, Grid, OrbitControls, useBounds, useGLTF, useProgress } from "@react-three/drei";

export type ModelCanvasProps = {
  url: string;
  // Footprint in millimetres, Z-up as exported: [x, y, z].
  size: number[];
  wireframe: boolean;
  // 0 = assembled, 1 = parts pulled apart.
  explode: number;
  zoom: boolean;
  running: boolean;
  resetKey: number;
  // Other models to fetch in the background once this one is showing.
  preload: string[];
};

type Part = {
  key: string;
  geometry: THREE.BufferGeometry;
  color: THREE.Color;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
  // Where this part goes when fully exploded, relative to its assembled position.
  away: THREE.Vector3;
};

function Model({ url, wireframe, explode, onReady }: { url: string; wireframe: boolean; explode: number; onReady: (url: string) => void }) {
  const { scene } = useGLTF(url, false, true);

  // Mounting means Suspense has resolved, so this model is on screen.
  useEffect(() => onReady(url), [onReady, url]);

  // Re-render each part with its filament colour, keeping its world transform
  // (which carries the dequantisation scale from the meshopt export).
  const parts = useMemo(() => {
    const list: Part[] = [];
    const whole = new THREE.Box3();
    // A painted part arrives as one node with a mesh per colour; explode moves the node as a whole.
    const groupOf: THREE.Object3D[] = [];
    const groupBox = new Map<THREE.Object3D, THREE.Box3>();
    scene.updateMatrixWorld(true);
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      let node: THREE.Object3D = mesh;
      while (node.parent && node.parent !== scene) node = node.parent;
      const box = new THREE.Box3().setFromObject(mesh);
      whole.union(box);
      groupOf.push(node);
      groupBox.set(node, (groupBox.get(node) ?? new THREE.Box3()).union(box));
      const part: Part = {
        key: mesh.uuid,
        geometry: mesh.geometry,
        color: (mesh.material as THREE.MeshStandardMaterial).color.clone(),
        position: new THREE.Vector3(),
        quaternion: new THREE.Quaternion(),
        scale: new THREE.Vector3(),
        away: new THREE.Vector3(),
      };
      mesh.matrixWorld.decompose(part.position, part.quaternion, part.scale);
      list.push(part);
    });
    // Exploded view: the biggest part stays put as the base, the rest rise above it in height order,
    // spreading out a little sideways so they don't hide each other.
    const centre = whole.getCenter(new THREE.Vector3());
    const height = whole.max.y - whole.min.y;
    const volume = (b: THREE.Box3) => {
      const v = b.getSize(new THREE.Vector3());
      return v.x * v.y * v.z;
    };
    const groups = [...groupBox.keys()];
    const base = groups.reduce((a, b) => (volume(groupBox.get(b)!) > volume(groupBox.get(a)!) ? b : a));
    const order = groups
      .filter((g) => g !== base)
      .sort((a, b) => groupBox.get(a)!.getCenter(new THREE.Vector3()).y - groupBox.get(b)!.getCenter(new THREE.Vector3()).y);
    const away = new Map<THREE.Object3D, THREE.Vector3>([[base, new THREE.Vector3()]]);
    order.forEach((g, rank) => {
      const c = groupBox.get(g)!.getCenter(new THREE.Vector3());
      away.set(
        g,
        new THREE.Vector3((c.x - centre.x) * 0.5, height * (0.6 + (0.5 * rank) / Math.max(1, order.length - 1)), (c.z - centre.z) * 0.5),
      );
    });
    list.forEach((p, i) => p.away.copy(away.get(groupOf[i])!));
    return list;
  }, [scene]);

  return (
    <group>
      {parts.map((p) => (
        <mesh
          key={p.key}
          geometry={p.geometry}
          position={p.position.clone().addScaledVector(p.away, explode)}
          quaternion={p.quaternion}
          scale={p.scale}
        >
          <meshStandardMaterial color={p.color} wireframe={wireframe} roughness={0.6} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

// Shown only until the selected model is on screen, not while the others preload in the background.
function LoadingBadge({ show }: { show: boolean }) {
  const { progress } = useProgress();
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center">
      <span className="rounded-full border border-line bg-bg/80 px-4 py-2 font-mono text-xs tracking-widest text-ink/70 uppercase">
        Loading model {Math.round(progress)}%
      </span>
    </div>
  );
}

// Refits the camera when the model changes or the reset button is pressed.
function Fit({ url, resetKey }: { url: string; resetKey: number }) {
  const bounds = useBounds();
  useEffect(() => {
    bounds.refresh().clip().fit();
  }, [bounds, url, resetKey]);
  return null;
}

export default function ModelCanvas({ url, size, wireframe, explode, zoom, running, resetKey, preload }: ModelCanvasProps) {
  const [spinning, setSpinning] = useState(true);
  const [readyUrl, setReadyUrl] = useState<string | null>(null);
  const resume = useRef<number | undefined>(undefined);
  const span = Math.max(size[0], size[1]);

  useEffect(() => () => window.clearTimeout(resume.current), []);

  useEffect(() => {
    const id = window.setTimeout(() => preload.forEach((u) => useGLTF.preload(u, false, true)), 2000);
    return () => window.clearTimeout(id);
  }, [preload]);

  return (
    <>
      <Canvas
        dpr={[1, 2]}
        frameloop={running ? "always" : "never"}
        camera={{ fov: 32, near: 1, far: 20000, position: [320, 240, 420] }}
        gl={{ antialias: true }}
      >
        <hemisphereLight args={["#dfe6ff", "#0a0a0c", 0.9]} />
        <directionalLight position={[300, 500, 260]} intensity={2.4} />
        <directionalLight position={[-400, 160, -300]} intensity={1.1} color="#4f7dff" />

        <Suspense fallback={null}>
          <Bounds key={url} fit clip margin={1.18} maxDuration={0.8}>
            <Model url={url} wireframe={wireframe} explode={explode} onReady={setReadyUrl} />
            <Fit url={url} resetKey={resetKey} />
          </Bounds>
          <ContactShadows
            key={`shadow-${url}`}
            position={[0, 0.05, 0]}
            scale={span * 1.6}
            far={Math.max(size[2], 20)}
            blur={2.4}
            opacity={0.55}
            frames={1}
          />
        </Suspense>

        <Grid
          position={[0, -0.05, 0]}
          infiniteGrid
          cellSize={10}
          sectionSize={50}
          cellThickness={0.6}
          sectionThickness={1}
          cellColor="#1f2029"
          sectionColor="#2b3456"
          fadeDistance={Math.max(span * 4, 600)}
          fadeStrength={1.4}
        />

        <OrbitControls
          makeDefault
          enablePan={false}
          enableZoom={zoom}
          enableDamping
          autoRotate={spinning}
          autoRotateSpeed={0.9}
          maxPolarAngle={Math.PI / 2.05}
          onStart={() => {
            window.clearTimeout(resume.current);
            setSpinning(false);
          }}
          onEnd={() => {
            resume.current = window.setTimeout(() => setSpinning(true), 4000);
          }}
        />
      </Canvas>
      <LoadingBadge show={readyUrl !== url} />
    </>
  );
}
