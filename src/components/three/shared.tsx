/* eslint-disable react-hooks/immutability -- three.js/R3F imperative material & camera mutation is the canonical pattern here */
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

/** Camera parallax rig — eases the camera toward the pointer (±8° feel). */
export function CameraRig({ enabled = true, strength = 0.14, baseZ = 7.5 }: { enabled?: boolean; strength?: number; baseZ?: number }) {
  const { camera } = useThree();
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((state, delta) => {
    const tx = enabled ? pointer.current.x * strength * baseZ * 0.8 : 0;
    const ty = enabled ? pointer.current.y * strength * baseZ * 0.55 : 0;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, tx, 3.2, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, ty + 0.15, 3.2, delta);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

/** Radial-gradient glow sprite texture (client-generated, no assets). */
export function useGlowTexture(inner = "rgba(255,255,255,1)", mid = "rgba(124,92,255,0.35)") {
  return useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, inner);
    g.addColorStop(0.4, mid);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [inner, mid]);
}

/**
 * One-shot particle burst. Re-render with a new `trigger` value to fire.
 * Used for: corrupt-data red glitch, rollback restore, container removal.
 */
export function Burst({
  trigger,
  color = "#f87171",
  count = 130,
  origin = [0, 0, 0] as [number, number, number],
  spread = 1.6,
  gravity = 0.4,
  duration = 1.15,
}: {
  trigger: number;
  color?: string;
  count?: number;
  origin?: [number, number, number];
  spread?: number;
  gravity?: number;
  duration?: number;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);
  const last = useRef(trigger);
  const t = useRef(1);

  const { velocities, geometry } = useMemo(() => {
    const velocities = new Float32Array(count * 3);
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 0.6 + Math.random() * 1.8;
      velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      velocities[i * 3 + 1] = Math.cos(phi) * speed + 0.4;
      velocities[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed * 0.6;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return { velocities, geometry };
  }, [count]);

  useEffect(() => {
    if (trigger !== last.current) {
      last.current = trigger;
      t.current = 0;
    }
  }, [trigger]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, delta) => {
    const pts = pointsRef.current;
    if (!pts) return;
    if (t.current >= 1) {
      pts.visible = false;
      return;
    }
    t.current = Math.min(1, t.current + delta / duration);
    const eased = 1 - Math.pow(1 - t.current, 2);
    const attr = pts.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      const vx = velocities[i * 3];
      const vy = velocities[i * 3 + 1];
      const vz = velocities[i * 3 + 2];
      attr.setXYZ(
        i,
        origin[0] + vx * eased * spread,
        origin[1] + vy * eased * spread - gravity * eased * eased * 1.4,
        origin[2] + vz * eased * spread * 0.5
      );
    }
    attr.needsUpdate = true;
    if (matRef.current) {
      matRef.current.opacity = Math.max(0, 1 - t.current);
    }
    pts.visible = true;
  });

  return (
    <points ref={pointsRef} visible={false} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        ref={matRef}
        color={color}
        size={0.055}
        sizeAttenuation
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/** Small pill label rendered in 3D space (DOM via drei Html).
 *  `visible` toggles CSS display — chips must NEVER unmount, because
 *  conditional drei <Html> unmounts race React's commit (React 19 bug). */
export function Chip({
  position,
  children,
  accent = "#8fa2c9",
  visible = true,
}: {
  position: [number, number, number];
  children: React.ReactNode;
  accent?: string;
  visible?: boolean;
}) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.001, 4, 4]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <HtmlChip accent={accent} visible={visible}>
        {children}
      </HtmlChip>
    </group>
  );
}

function HtmlChip({
  children,
  accent,
  visible,
}: {
  children: React.ReactNode;
  accent: string;
  visible: boolean;
}) {
  return (
    <Html
      center
      zIndexRange={[20, 0]}
      style={{ pointerEvents: "none", display: visible ? "block" : "none" }}
    >
      <span
        className={`whitespace-nowrap rounded-md px-2 py-0.5 font-mono text-[10px] tracking-wide backdrop-blur-sm bg-[#05070f]/70`}
        style={{ color: accent, border: `1px solid ${accent}44` }}
      >
        {children}
      </span>
    </Html>
  );
}