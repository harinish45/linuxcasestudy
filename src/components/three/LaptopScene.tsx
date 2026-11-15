/* eslint-disable react-hooks/immutability -- three.js/R3F imperative material & camera mutation is the canonical pattern here */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Float, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { CameraRig } from "./shared";

/**
 * The 3D laptop: aluminium base, backlit keyboard, trackpad, and a hinged lid
 * whose screen is a live CanvasTexture boot sequence.
 *
 * Timeline (seconds):
 *  0.00–0.80  chassis rises out of the dark, settles
 *  0.55–1.95  lid springs open (easeOutBack, −96° → −6°)
 *  1.70–2.60  screen boot sequence draws (BIOS lines → title → prompt)
 *  2.60       onReady() → overlay chrome shows "Enter the lab"
 */
const T_RISE = [0, 0.8];
const T_LID = [0.55, 1.95];
const T_BOOT = [1.7, 2.6];
const LID_CLOSED = Math.PI / 2; // lying on the base
const LID_OPEN = -0.1; // ~96° open, slight backward lean

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const easeOutBack = (t: number) => {
  const c1 = 1.4;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

/** Draws the boot sequence into an offscreen canvas used as the screen texture. */
function drawScreen(canvas: HTMLCanvasElement, p: number) {
  const ctx = canvas.getContext("2d")!;
  const W = canvas.width;
  const H = canvas.height;
  ctx.fillStyle = "#020409";
  ctx.fillRect(0, 0, W, H);

  const bootP = seg(p, T_BOOT[0], T_BOOT[1]);

  // faint scanline texture
  ctx.fillStyle = "rgba(255,255,255,0.016)";
  for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);

  if (bootP <= 0) {
    // standby dot
    ctx.fillStyle = "#7c5cff";
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 4 + Math.sin(p * 6) * 1.4, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  ctx.font = "500 20px 'JetBrains Mono', monospace";

  // BIOS lines type in during the first half of boot
  const lines = [
    "CLU-BIOS v2.6 — memory check .......... OK",
    "pvcreate /dev/sdb /dev/sdc /dev/sdd ... OK",
    "vgcreate vg_lab ....................... 12G",
    "exportfs /srv/nfs/shared .............. 2049",
    "docker daemon ......................... healthy",
  ];
  const shown = Math.floor(clamp01(bootP / 0.55) * lines.length);
  ctx.fillStyle = "rgba(143,162,201,0.85)";
  ctx.textAlign = "left";
  lines.slice(0, shown).forEach((l, i) => ctx.fillText(l, 70, 92 + i * 30));

  // title fades in during the second half
  const titleP = clamp01((bootP - 0.5) / 0.5);
  if (titleP > 0) {
    ctx.textAlign = "center";
    ctx.globalAlpha = titleP;
    ctx.fillStyle = "#e8eefc";
    ctx.font = "600 54px 'Inter', system-ui, sans-serif";
    ctx.fillText("Comprehensive Linux", W / 2, H / 2 + 6);
    ctx.font = "500 21px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#8fa2c9";
    const sub = "LVM  ·  NFS  ·  CONTAINERS";
    ctx.fillText(sub.slice(0, Math.ceil(sub.length * titleP)), W / 2, H / 2 + 44);
    ctx.fillStyle = "#7c5cff";
    ctx.fillRect(W / 2 - 110 * titleP, H / 2 + 64, 220 * titleP, 3);
    ctx.globalAlpha = 1;

    // prompt line + blinking cursor
    ctx.textAlign = "left";
    ctx.font = "500 24px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#34d399";
    ctx.fillText("$ boot lab --verified", 64, H - 64);
    if (Math.floor(p * 2.2) % 2 === 0) {
      ctx.fillStyle = "#34d399";
      ctx.fillRect(64 + ctx.measureText("$ boot lab --verified").width + 14, H - 84, 13, 26);
    }
  }
}

function LaptopModel({ reduced, onReady, entering }: { reduced: boolean; onReady: () => void; entering: boolean }) {
  const group = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Group>(null);
  const screenLight = useRef<THREE.PointLight>(null);
  const keyMat = useRef<THREE.MeshStandardMaterial>(null);
  const readyFired = useRef(false);

  const screenCanvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 640;
    return c;
  }, []);
  const screenTex = useMemo(() => {
    const t = new THREE.CanvasTexture(screenCanvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [screenCanvas]);
  useEffect(() => () => screenTex.dispose(), [screenTex]);

  const lastDraw = useRef(-1);
  const clock = useRef(0);
  const enterZ = useRef(0);

  const alu = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#0d1428", metalness: 0.72, roughness: 0.34 }),
    []
  );
  const deck = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#111936", metalness: 0.55, roughness: 0.5 }),
    []
  );
  const dark = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#05070f", metalness: 0.3, roughness: 0.7 }),
    []
  );
  const lidEdge = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#1b2542", metalness: 0.8, roughness: 0.3 }),
    []
  );

  // keyboard instancing
  const keys = useMemo(() => {
    const arr: { pos: [number, number, number]; scale: [number, number, number] }[] = [];
    const rows = 4;
    const cols = 14;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const w = r === 3 && c === 4 ? 6.4 : 1; // spacebar-ish
        if (r === 3 && c > 4 && c < 10) continue;
        arr.push({
          pos: [-1.28 + c * 0.197 + (w - 1) * 0.0985, 0.062, 0.1 + r * 0.185],
          scale: [0.155 * w, 0.012, 0.14],
        });
      }
    }
    return arr;
  }, []);
  const keyGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  useFrame((state, delta) => {
    clock.current += delta;
    const t = clock.current;

    // rise + settle
    const rise = easeInOut(seg(t, T_RISE[0], T_RISE[1]));
    if (group.current) {
      group.current.position.y = THREE.MathUtils.lerp(-2.6, 0, rise);
      group.current.rotation.y = THREE.MathUtils.lerp(0.32, reduced ? 0.04 : 0.05, easeOutBack(rise));
      const idle = reduced ? 0 : Math.sin(t * 0.9) * 0.035;
      group.current.rotation.x = reduced ? 0.1 : 0.1 + idle * 0.4;
      if (!reduced) group.current.position.y += idle * 0.6;
    }

    // lid opening
    if (lid.current) {
      const open = easeOutBack(seg(t, T_LID[0], T_LID[1]));
      lid.current.rotation.x = THREE.MathUtils.lerp(LID_CLOSED, LID_OPEN, open);
    }

    // boot texture (~24fps redraw while running)
    const drawKey = Math.floor(t * 24);
    if (drawKey !== lastDraw.current && t > T_BOOT[0] - 0.4) {
      lastDraw.current = drawKey;
      drawScreen(screenCanvas, t);
      screenTex.needsUpdate = true;
      if (!readyFired.current && t >= T_BOOT[1]) {
        readyFired.current = true;
        onReady();
      }
    }

    // screen light + keyboard backlight ramp with boot
    const glow = seg(t, T_BOOT[0], T_BOOT[1]);
    if (screenLight.current) screenLight.current.intensity = glow * (entering ? 26 : 14);
    if (keyMat.current) keyMat.current.emissiveIntensity = 0.08 + glow * 0.85;

    // enter transition: dolly toward the screen
    if (entering) {
      enterZ.current = Math.min(1, enterZ.current + delta / 0.9);
      const e = easeInOut(enterZ.current);
      state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, 3.4, e);
      state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, 1.15, e);
      state.camera.lookAt(0, 1.0, 0);
    }
  });

  return (
    <group ref={group} position={[0, -2.6, 0]}>
      {/* ── base chassis ── */}
      <mesh material={alu} castShadow>
        <boxGeometry args={[3.4, 0.14, 2.3]} />
      </mesh>
      <mesh material={deck} position={[0, 0.075, 0.05]}>
        <boxGeometry args={[3.28, 0.02, 2.14]} />
      </mesh>

      {/* backlit keys */}
      <instancedMesh
        args={[keyGeo, undefined, keys.length]}
        castShadow
        ref={(mesh) => {
          if (!mesh) return;
          const m = new THREE.MeshStandardMaterial({
            color: "#1c2547",
            metalness: 0.35,
            roughness: 0.45,
            emissive: new THREE.Color("#7dd3fc"),
            emissiveIntensity: 0.08,
          });
          keyMat.current = m;
          mesh.material = m;
          const dummy = new THREE.Object3D();
          keys.forEach((k, i) => {
            dummy.position.set(...k.pos);
            dummy.scale.set(...k.scale);
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
          });
          mesh.instanceMatrix.needsUpdate = true;
        }}
      />

      {/* trackpad */}
      <mesh material={dark} position={[0, 0.088, 0.86]}>
        <boxGeometry args={[1.0, 0.008, 0.62]} />
      </mesh>

      {/* hinge bar (laid along X) */}
      <mesh material={lidEdge} position={[0, 0.1, -1.12]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.055, 0.055, 3.24, 18]} />
      </mesh>

      {/* ── lid ── */}
      <group ref={lid} position={[0, 0.1, -1.08]} rotation={[LID_CLOSED, 0, 0]}>
        <mesh material={alu} position={[0, 1.04, 0]} castShadow>
          <boxGeometry args={[3.4, 2.12, 0.075]} />
        </mesh>
        {/* glowing screen */}
        <mesh position={[0, 1.06, 0.041]}>
          <planeGeometry args={[3.14, 1.92]} />
          <meshBasicMaterial map={screenTex} toneMapped={false} />
        </mesh>
        {/* thin emissive rim so the lid reads even when closed */}
        <mesh material={lidEdge} position={[0, 2.1, 0]}>
          <boxGeometry args={[3.36, 0.03, 0.08]} />
        </mesh>
        {/* logo dot on the back of the lid */}
        <mesh position={[0, 1.06, -0.041]} rotation={[0, Math.PI, 0]}>
          <circleGeometry args={[0.09, 24]} />
          <meshBasicMaterial color="#7c5cff" transparent opacity={0.85} />
        </mesh>
      </group>

      {/* light spilling from the screen */}
      <pointLight ref={screenLight} position={[0, 1.15, 1.4]} intensity={0} color="#9db8ff" distance={9} decay={2} />
    </group>
  );
}

export default function LaptopScene({
  reduced,
  onReady,
  entering,
}: {
  reduced: boolean;
  onReady: () => void;
  entering: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 1.65, 8.6], fov: 36 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 7, 5]} intensity={1.15} color="#cdd7ff" />
      <pointLight position={[-4, 2.4, 4]} intensity={26} color="#7c5cff" />
      <pointLight position={[5, -1.4, 3]} intensity={16} color="#22d3ee" />

      <Float speed={reduced ? 0 : 1} rotationIntensity={reduced ? 0 : 0.12} floatIntensity={reduced ? 0 : 0.35}>
        <LaptopModel reduced={reduced} onReady={onReady} entering={entering} />
      </Float>

      <ContactShadows position={[0, -0.5, 0]} opacity={0.5} scale={7.5} blur={2.4} far={3.2} color="#02030a" />

      {!reduced && (
        <Sparkles count={70} scale={[10, 6, 6]} size={1.6} speed={0.24} opacity={0.5} color="#8fa2c9" />
      )}

      <CameraRig enabled={!reduced && !entering} strength={0.045} baseZ={8.6} baseY={0.35} lookAt={[0, 1.0, 0]} />
      <fog attach="fog" args={["#05070f", 11, 20]} />
    </Canvas>
  );
}
