/* eslint-disable react-hooks/immutability -- three.js/R3F imperative material & camera mutation is the canonical pattern here */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Burst, CameraRig, Chip } from "./shared";

const EMERALD = "#34d399";

export type LifecycleKey = "created" | "running" | "paused" | "stopped" | "removed";

interface SceneProps {
  lifecycle: LifecycleKey;
  volumeEvent: number;
  volumeMode: "idle" | "rm" | "run";
  reduced: boolean;
}

const VM_BOOT = 18;
const SLOTS = 12;
const SPAWN_EVERY = 0.85;

/** Boot-progress ring as a sprite (10Hz canvas redraw, no DOM). */
function VmRing({ index, accent = "#94a3b8" }: { index: number; accent?: string }) {
  const canvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    return c;
  }, []);
  const tex = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [canvas]);
  useEffect(() => () => tex.dispose(), [tex]);
  const acc = useRef(0);

  useFrame((state, delta) => {
    acc.current += delta;
    if (acc.current < 0.1) return;
    acc.current = 0;
    const bootP = (state.clock.elapsedTime % VM_BOOT) / VM_BOOT;
    const stagger = Math.max(0, Math.min(1, (bootP - index * 0.08) / (1 - index * 0.08)));
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, 128, 128);
    ctx.lineWidth = 9;
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.beginPath();
    ctx.arc(64, 64, 48, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = accent;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(64, 64, 48, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * stagger);
    ctx.stroke();
    ctx.fillStyle = "#8fa2c9";
    ctx.font = "500 24px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`VM${index + 1}`, 64, 66);
    tex.needsUpdate = true;
  });

  return (
    <sprite position={[0.95, 0.55, 0.3]} scale={[0.62, 0.62, 1]} renderOrder={9}>
      <spriteMaterial map={tex} transparent depthWrite={false} toneMapped={false} />
    </sprite>
  );
}

/** Live stopwatch panel fed by a shared stats ref (no React re-renders). */
function StatsPanel({
  position,
  statsRef,
}: {
  position: [number, number, number];
  statsRef: React.MutableRefObject<{ boot: number; count: number }>;
}) {
  const canvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 560;
    c.height = 190;
    return c;
  }, []);
  const tex = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [canvas]);
  useEffect(() => () => tex.dispose(), [tex]);
  const acc = useRef(0);

  useFrame((_, delta) => {
    acc.current += delta;
    if (acc.current < 0.1) return;
    acc.current = 0;
    const { boot, count } = statsRef.current;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, 560, 190);
    ctx.fillStyle = "rgba(5, 7, 15, 0.8)";
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 2;
    const r = 16;
    ctx.beginPath();
    ctx.moveTo(4 + r, 4);
    ctx.arcTo(556, 4, 556, 186, r);
    ctx.arcTo(556, 186, 4, 186, r);
    ctx.arcTo(4, 186, 4, 4, r);
    ctx.arcTo(4, 4, 556, 4, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.textBaseline = "middle";
    ctx.font = "500 30px 'JetBrains Mono', monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(143,162,201,0.95)";
    ctx.fillText("VM boot", 36, 58);
    ctx.fillText("containers up", 36, 132);
    ctx.textAlign = "right";
    ctx.fillStyle = "#e8eefc";
    ctx.fillText(`${boot.toFixed(1)}s / 18s`, 524, 58);
    ctx.fillStyle = "#34d399";
    ctx.fillText(String(count), 524, 132);
    tex.needsUpdate = true;
  });

  return (
    <sprite position={position} scale={[2.1, 0.71, 1]} renderOrder={10}>
      <spriteMaterial map={tex} transparent depthWrite={false} depthTest={false} toneMapped={false} />
    </sprite>
  );
}

function Scene({ lifecycle, volumeEvent, volumeMode, reduced }: SceneProps) {
  const vmRefs = useRef<(THREE.Group | null)[]>([null, null, null]);

  const contRefs = useRef<(THREE.Group | null)[]>([]);
  const spawnTimes = useRef<number[]>(new Array(SLOTS).fill(-99));
  const slotCursor = useRef(0);
  const spawnCount = useRef(0);
  const nextSpawn = useRef(0);

  const lifeRef = useRef<THREE.Group>(null);
  const statsRef = useRef({ boot: 0, count: 0 });
  const lifeMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: EMERALD, emissive: EMERALD, emissiveIntensity: 0.35, metalness: 0.5, roughness: 0.35, transparent: true, opacity: 0.92 }),
    []
  );
  const lifeWire = useMemo(
    () => new THREE.MeshBasicMaterial({ color: EMERALD, wireframe: true, transparent: true, opacity: 0.5 }),
    []
  );
  const spin = useRef(0);
  const lastLifecycle = useRef(lifecycle);
  const [removeTick, setRemoveTick] = useState(0);
  const [rmTick, setRmTick] = useState(0);

  const volOrb = useRef<THREE.Mesh>(null);
  const volCyl = useRef<THREE.Mesh>(null);
  const miniRef = useRef<THREE.Group>(null);
  const miniScale = useRef(0);
  const lastVolEvent = useRef(volumeEvent);

  useEffect(() => {
    if (lifecycle !== lastLifecycle.current) {
      lastLifecycle.current = lifecycle;
      if (lifecycle === "removed") setRemoveTick((n) => n + 1);
    }
  }, [lifecycle]);

  useEffect(() => {
    if (volumeEvent !== lastVolEvent.current) {
      lastVolEvent.current = volumeEvent;
      if (volumeEvent > 0 && volumeMode === "rm") setRmTick((n) => n + 1);
    }
  }, [volumeEvent, volumeMode]);

  const greyVM = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#5b6478", emissive: "#3b4256", emissiveIntensity: 0.15, metalness: 0.45, roughness: 0.55 }),
    []
  );
  const neonMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: EMERALD, emissive: EMERALD, emissiveIntensity: 0.7, metalness: 0.4, roughness: 0.3, transparent: true }),
    []
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // ── VM lane: 18s boot loop ──
    const bootT = t % VM_BOOT;
    const bootP = bootT / VM_BOOT;
    statsRef.current.boot = bootT;
    vmRefs.current.forEach((g, i) => {
      if (!g) return;
      const stagger = Math.max(0, Math.min(1, (bootP - i * 0.08) / (1 - i * 0.08)));
      const s = 0.25 + 0.75 * stagger;
      g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, s, 6, delta));
      g.rotation.y = reduced ? 0 : Math.sin(t * 0.4 + i) * 0.12;
    });

    // ── Container lane: instant spawn stream ──
    if (t >= nextSpawn.current) {
      nextSpawn.current = t + SPAWN_EVERY;
      spawnTimes.current[slotCursor.current] = t;
      slotCursor.current = (slotCursor.current + 1) % SLOTS;
      spawnCount.current += 1;
      statsRef.current.count = spawnCount.current;
    }
    contRefs.current.forEach((g, i) => {
      if (!g) return;
      const born = spawnTimes.current[i];
      const age = t - born;
      if (age < 0 || age > SPAWN_EVERY * SLOTS) {
        g.visible = false;
        return;
      }
      g.visible = true;
      const bounce = 1 + 0.5 * Math.exp(-6 * age) * Math.sin(18 * age);
      g.scale.setScalar(bounce);
      const fade = age > SPAWN_EVERY * (SLOTS - 1) ? Math.max(0, 1 - (age - SPAWN_EVERY * (SLOTS - 1)) / SPAWN_EVERY) : 1;
      neonMat.opacity = 0.9 * fade;
    });

    // ── lifecycle cube ──
    if (lifeRef.current) {
      const cfg: Record<LifecycleKey, { scale: number; wire: boolean; emissive: number }> = {
        created: { scale: 1, wire: true, emissive: 0.18 },
        running: { scale: 1, wire: false, emissive: 0.35 + Math.sin(t * 3) * 0.12 },
        paused: { scale: 1, wire: false, emissive: 0.06 },
        stopped: { scale: 0.92, wire: false, emissive: 0.02 },
        removed: { scale: 0.001, wire: false, emissive: 0 },
      };
      const c = cfg[lifecycle];
      lifeRef.current.scale.setScalar(THREE.MathUtils.damp(lifeRef.current.scale.x, c.scale, 6, delta));
      lifeRef.current.visible = lifeRef.current.scale.x > 0.01;
      lifeWire.opacity = THREE.MathUtils.damp(lifeWire.opacity, c.wire ? 0.5 : 0, 6, delta);
      lifeMat.emissiveIntensity = THREE.MathUtils.damp(lifeMat.emissiveIntensity, c.emissive, 6, delta);
      lifeMat.opacity = lifecycle === "paused" ? 0.45 : 0.92;
      if (lifecycle === "running" && !reduced) spin.current += delta * 0.8;
      lifeRef.current.rotation.y = spin.current;
    }

    // ── volume demo ──
    if (volOrb.current) {
      volOrb.current.rotation.y = t * 0.8;
      volOrb.current.position.y = -1.7 + Math.sin(t * 1.6) * 0.05;
    }
    if (miniRef.current) {
      const target = volumeMode === "rm" ? 0 : 1;
      miniScale.current = THREE.MathUtils.damp(miniScale.current, target, 5, delta);
      const overshoot = 1 + 0.25 * Math.max(0, miniScale.current) * Math.sin(miniScale.current * Math.PI);
      miniRef.current.scale.setScalar(Math.max(0.001, miniScale.current * overshoot));
      miniRef.current.visible = miniScale.current > 0.02;
      miniRef.current.rotation.y = t * (volumeMode === "rm" ? 0.5 : 1.2);
    }
    if (volCyl.current) {
      (volCyl.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.25 + Math.sin(t * 2) * 0.08;
    }
  });

  // container lane slot grid
  const slotPos = (i: number): [number, number, number] => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    return [0.55 + col * 0.78, 1.35 - row * 0.85, 1.2];
  };

  return (
    <>
      {/* lane divider */}
      <mesh position={[-0.85, 0.2, 0]}>
        <boxGeometry args={[0.012, 5.4, 0.012]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.12} />
      </mesh>

      <Chip position={[-3.2, 2.7, 0]} accent="#8fa2c9">
        LANE A · VMs · 18s boot
      </Chip>
      <Chip position={[2.4, 2.7, 0]} accent={EMERALD}>
        LANE B · Containers · 0.2s
      </Chip>

      {/* VM cubes */}
      {[0, 1, 2].map((i) => (
        <group key={`vm-${i}`} ref={(el) => { vmRefs.current[i] = el; }} position={[-2.9, 1.15 - i * 1.5, 0]} scale={0.25}>
          <mesh material={greyVM}>
            <boxGeometry args={[1.05, 1.05, 1.05]} />
          </mesh>
          <mesh position={[0, 0, 0.54]}>
            <boxGeometry args={[0.7, 0.08, 0.02]} />
            <meshBasicMaterial color="#94a3b8" />
          </mesh>
          <VmRing index={i} />
        </group>
      ))}

      {/* stopwatch panel */}
      <StatsPanel position={[2.6, 2.2, 0]} statsRef={statsRef} />

      {/* container cubes */}
      {Array.from({ length: SLOTS }).map((_, i) => (
        <group
          key={`c-${i}`}
          ref={(el) => { contRefs.current[i] = el; }}
          position={slotPos(i)}
          visible={false}
        >
          <mesh material={neonMat}>
            <boxGeometry args={[0.42, 0.42, 0.42]} />
          </mesh>
        </group>
      ))}

      {/* lifecycle stage */}
      <Chip position={[0, -1.25, 2.2]} accent={EMERALD}>
        lifecycle: {lifecycle}
      </Chip>
      <group ref={lifeRef} position={[0, -0.1, 2.2]}>
        <mesh material={lifeMat}>
          <boxGeometry args={[0.85, 0.85, 0.85]} />
        </mesh>
        <mesh material={lifeWire}>
          <boxGeometry args={[0.88, 0.88, 0.88]} />
        </mesh>
      </group>

      {/* volume persistence demo */}
      <Chip position={[2.45, -0.85, 1.6]} accent="#a7f3d0">
        named volume · lab_data
      </Chip>
      <mesh ref={volCyl} position={[2.45, -1.7, 1.6]}>
        <cylinderGeometry args={[0.5, 0.5, 0.72, 28, 1, true]} />
        <meshStandardMaterial color={EMERALD} emissive={EMERALD} emissiveIntensity={0.25} transparent opacity={0.35} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh ref={volOrb} position={[2.45, -1.7, 1.6]}>
        <icosahedronGeometry args={[0.2, 1]} />
        <meshStandardMaterial color="#ffffff" emissive="#a7f3d0" emissiveIntensity={1.6} />
      </mesh>
      <group ref={miniRef} position={[2.45, -1.02, 1.6]}>
        <mesh material={neonMat}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
        </mesh>
      </group>

      <Burst trigger={removeTick} color={EMERALD} origin={[0, -0.1, 2.2]} spread={1.7} gravity={0.2} />
      <Burst trigger={rmTick} color={EMERALD} origin={[2.45, -1.02, 1.6]} spread={1.2} gravity={0.5} />

      <CameraRig enabled={!reduced} strength={0.06} baseZ={7.8} />
      <ambientLight intensity={0.5} />
      <pointLight position={[3, 5, 6]} intensity={70} color="#d8ffee" />
      <pointLight position={[-5, -2, 3]} intensity={30} color={EMERALD} />
      <fog attach="fog" args={["#05070f", 9.5, 19]} />
    </>
  );
}

/** Containers scene: VM lane vs container lane + lifecycle + volume demo. */
export default function ContainerScene(
  props: SceneProps & { frameloop?: "always" | "demand" }
) {
  const { frameloop = "always", ...rest } = props;
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={frameloop}
      camera={{ position: [0, 0.4, 7.9], fov: 44 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <Scene {...rest} />
    </Canvas>
  );
}