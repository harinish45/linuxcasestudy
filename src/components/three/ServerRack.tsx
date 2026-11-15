"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import { CameraRig, useGlowTexture } from "./shared";
import { ACCENTS, type AccentKey } from "@/lib/store";

const UNITS = 7;
const UNIT_H = 0.42;
const GAP = 0.1;

function RackBody({ accent, reduced }: { accent: AccentKey; reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  const targetColor = useMemo(() => new THREE.Color(ACCENTS[accent].hex), [accent]);

  const bodyMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#1a2244", roughness: 0.42, metalness: 0.7 }),
    []
  );
  const faceMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#232d56", roughness: 0.35, metalness: 0.6 }),
    []
  );
  const bayMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#0a0f22", roughness: 0.8, metalness: 0.2 }),
    []
  );
  const ledA = useMemo(
    () => new THREE.MeshStandardMaterial({ color: ACCENTS.lvm.hex, emissive: ACCENTS.lvm.hex, emissiveIntensity: 2 }),
    []
  );
  const ledB = useMemo(
    () => new THREE.MeshStandardMaterial({ color: ACCENTS.lvm.hex, emissive: ACCENTS.lvm.hex, emissiveIntensity: 2 }),
    []
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    [ledA, ledB].forEach((mat, i) => {
      mat.color.lerp(targetColor, Math.min(1, delta * 4));
      mat.emissive.lerp(targetColor, Math.min(1, delta * 4));
      mat.emissiveIntensity = 1.5 + Math.sin(t * 2.6 + i * 0.9) * 1.1;
    });
    if (group.current && !reduced) group.current.rotation.y = Math.sin(t * 0.24) * 0.07;
  });

  const units: React.ReactNode[] = [];
  for (let i = 0; i < UNITS; i++) {
    const y = (i - (UNITS - 1) / 2) * (UNIT_H + GAP);
    const isBay = i >= 1 && i <= 4;
    units.push(
      <group key={i} position={[0, y, 0]}>
        <mesh material={bodyMat}>
          <boxGeometry args={[2.15, UNIT_H, 1.25]} />
        </mesh>
        <mesh material={faceMat} position={[0, 0, 0.655]}>
          <boxGeometry args={[2.15, UNIT_H, 0.06]} />
        </mesh>
        {isBay && (
          <mesh material={bayMat} position={[-0.35, 0, 0.7]}>
            <boxGeometry args={[1.1, 0.16, 0.03]} />
          </mesh>
        )}
        {[0, 1, 2, 3].map((k) => (
          <mesh
            key={k}
            position={[0.72 + (k % 2) * 0.16, 0.06 - Math.floor(k / 2) * 0.12, 0.7]}
            material={k % 2 === 0 ? ledA : ledB}
          >
            <boxGeometry args={[0.07, 0.05, 0.02]} />
          </mesh>
        ))}
        <mesh position={[0.86, 0, 0.7]} material={ledA}>
          <boxGeometry args={[0.05, 0.05, 0.02]} />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={group}>
      {[-1.18, 1.18].map((x) => (
        <mesh key={x} material={faceMat} position={[x, 0, 0]}>
          <boxGeometry args={[0.14, UNITS * (UNIT_H + GAP) + 0.3, 1.4]} />
        </mesh>
      ))}
      {units}
    </group>
  );
}

/** Hero 3D: stylised floating server rack with pulsing accent LEDs. */
export default function ServerRack({
  accent = "lvm",
  reduced = false,
  frameloop = "always",
  scale = 1,
  y = 0,
  cameraZ = 7.8,
}: {
  accent?: AccentKey;
  reduced?: boolean;
  frameloop?: "always" | "demand";
  /** Overall scene scale — hero uses <1 to keep the rack behind the copy. */
  scale?: number;
  /** Vertical offset of the whole rack (negative = lower in frame). */
  y?: number;
  cameraZ?: number;
}) {
  const glowTex = useGlowTexture("rgba(255,255,255,0.9)", `${ACCENTS[accent].hex}55`);

  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={frameloop}
      camera={{ position: [0, 0.4 + y * 0.35, cameraZ], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <group position={[0, y, 0]} scale={scale}>
        <ambientLight intensity={0.75} />
        <pointLight position={[4, 5, 6]} intensity={150} color="#cdd7ff" />
        <pointLight position={[-5, -3, 4]} intensity={60} color={ACCENTS[accent].hex} />
        <pointLight position={[0, 2.5, 7]} intensity={50} color="#aebbff" />
        <Float speed={1.6} rotationIntensity={reduced ? 0 : 0.25} floatIntensity={reduced ? 0 : 0.7}>
          <RackBody accent={accent} reduced={reduced} />
        </Float>
        <sprite position={[0, 0, -2.4]} scale={[13, 9, 1]}>
          <spriteMaterial map={glowTex} transparent opacity={0.2} depthWrite={false} />
        </sprite>
      </group>
      <CameraRig enabled={!reduced} strength={0.13} baseZ={cameraZ} />
      <fog attach="fog" args={["#05070f", 9, 17]} />
    </Canvas>
  );
}
