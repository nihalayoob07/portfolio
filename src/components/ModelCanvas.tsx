"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { Bounds, ContactShadows, Grid, OrbitControls, useBounds, useGLTF, useProgress } from "@react-three/drei";

export type ModelCanvasProps = {
  url: string;
  // Footprint in millimetres, Z-up as exported: [x, y, z].
  size: number[];
  color: string;
  wireframe: boolean;
  zoom: boolean;
  running: boolean;
  resetKey: number;
  // Other models to fetch in the background once this one is showing.
  preload: string[];
};

type Part = { key: string; geometry: THREE.BufferGeometry; position: THREE.Vector3; quaternion: THREE.Quaternion; scale: THREE.Vector3 };

function Model({ url, color, wireframe }: { url: string; color: string; wireframe: boolean }) {
  const { scene } = useGLTF(url, false, true);

  // Re-render each part with our own filament material, keeping its world transform
  // (which carries the dequantisation scale from the meshopt export).
  const parts = useMemo(() => {
    const list: Part[] = [];
    scene.updateMatrixWorld(true);
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const part: Part = {
        key: mesh.uuid,
        geometry: mesh.geometry,
        position: new THREE.Vector3(),
        quaternion: new THREE.Quaternion(),
        scale: new THREE.Vector3(),
      };
      mesh.matrixWorld.decompose(part.position, part.quaternion, part.scale);
      list.push(part);
    });
    return list;
  }, [scene]);

  return (
    <group>
      {parts.map((p) => (
        <mesh key={p.key} geometry={p.geometry} position={p.position} quaternion={p.quaternion} scale={p.scale}>
          <meshStandardMaterial color={color} wireframe={wireframe} roughness={0.58} metalness={0.02} />
        </mesh>
      ))}
    </group>
  );
}

function LoadingBadge() {
  const { active, progress } = useProgress();
  if (!active) return null;
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

export default function ModelCanvas({ url, size, color, wireframe, zoom, running, resetKey, preload }: ModelCanvasProps) {
  const [spinning, setSpinning] = useState(true);
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
            <Model url={url} color={color} wireframe={wireframe} />
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
      <LoadingBadge />
    </>
  );
}
