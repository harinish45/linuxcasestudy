/* eslint-disable react-hooks/immutability -- three.js/R3F imperative material & camera mutation is the canonical pattern here */
"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/** Camera parallax rig — eases the camera toward the pointer (±8° feel). */
export function CameraRig({
  enabled = true,
  strength = 0.14,
  baseZ = 7.5,
  baseY = 0.15,
  lookAt = [0, 0, 0] as [number, number, number],
}: {
  enabled?: boolean;
  strength?: number;
  baseZ?: number;
  baseY?: number;
  lookAt?: [number, number, number];
}) {
  const { camera } = useThree();
  const pointer = useRef({ x: 0, y: 0 });
  const target = useMemo(() => new THREE.Vector3(...lookAt), [lookAt]);

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
    camera.position.y = THREE.MathUtils.damp(camera.position.y, target.y + baseY + ty, 3.2, delta);
    camera.lookAt(target);
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

/** Small pill label rendered in 3D space as a CanvasTexture sprite.
 *  Pure WebGL — deliberately NOT drei <Html>: Html spawns a React root per
 *  label and its unmount races React 19's committer (removeChild crash). */
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
  const sprite = useRef<THREE.Sprite>(null);
  const canvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 640;
    c.height = 96;
    return c;
  }, []);
  const tex = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [canvas]);
  useEffect(() => () => tex.dispose(), [tex]);

  const text = Array.isArray(children) ? children.join("") : String(children ?? "");

  useLayoutEffect(() => {
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "500 30px 'JetBrains Mono', ui-monospace, monospace";
    const w = Math.min(600, ctx.measureText(text).width + 44);
    const x0 = (canvas.width - w) / 2;
    // pill
    ctx.fillStyle = "rgba(5, 7, 15, 0.78)";
    ctx.strokeStyle = `${accent}55`;
    ctx.lineWidth = 2;
    roundRect(ctx, x0, 22, w, 52, 12);
    ctx.fill();
    ctx.stroke();
    // text
    ctx.fillStyle = accent;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, canvas.width / 2, 49, w - 32);
    tex.needsUpdate = true;
    // rescale sprite to the pill's aspect
    if (sprite.current) {
      const aspect = w / 96;
      sprite.current.scale.set(1.5 * aspect, 1.5 * (96 / 96), 1);
    }
  }, [text, accent, canvas, tex]);

  // redraw once webfonts arrive (crisper mono)
  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => {
      if (alive) tex.needsUpdate = true;
    });
    return () => {
      alive = false;
    };
  }, [tex]);

  return (
    <sprite ref={sprite} position={position} visible={visible} renderOrder={10}>
      <spriteMaterial map={tex} transparent depthWrite={false} depthTest={false} toneMapped={false} />
    </sprite>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Multi-line readout panel as a sprite (used for the containers stopwatch).
 * `lines` is a list of [label, value, valueColor]; redraws at ~10Hz via `dirtyRef`.
 */
export function TextPanel({
  position,
  lines,
  visible = true,
  width = 2.2,
}: {
  position: [number, number, number];
  lines: [string, string, string][];
  visible?: boolean;
  width?: number;
}) {
  const canvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 560;
    c.height = 64 + lines.length * 64;
    return c;
  }, [lines.length]);
  const tex = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [canvas]);
  useEffect(() => () => tex.dispose(), [tex]);
  const dirty = useRef(true);
  const acc = useRef(0);

  useEffect(() => {
    dirty.current = true;
  }, [lines]);

  useFrame((_, delta) => {
    acc.current += delta;
    if (acc.current < 0.1 || !dirty.current) return;
    acc.current = 0;
    dirty.current = false;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(5, 7, 15, 0.8)";
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 2;
    roundRect(ctx, 4, 4, canvas.width - 8, canvas.height - 8, 16);
    ctx.fill();
    ctx.stroke();
    ctx.textBaseline = "middle";
    ctx.font = "500 30px 'JetBrains Mono', ui-monospace, monospace";
    lines.forEach(([label, value, color], i) => {
      const y = 56 + i * 64;
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(143,162,201,0.95)";
      ctx.fillText(label, 36, y);
      ctx.textAlign = "right";
      ctx.fillStyle = color;
      ctx.fillText(value, canvas.width - 36, y);
    });
    tex.needsUpdate = true;
  });

  const h = width * (canvas.height / canvas.width);
  return (
    <sprite position={position} visible={visible} scale={[width, h, 1]} renderOrder={10}>
      <spriteMaterial map={tex} transparent depthWrite={false} depthTest={false} toneMapped={false} />
    </sprite>
  );
}