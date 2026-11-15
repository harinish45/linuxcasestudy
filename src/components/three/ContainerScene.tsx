/* eslint-disable react-hooks/immutability -- three.js/R3F imperative material & camera mutation is the canonical pattern here */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
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

function Scene({ lifecycle, volumeEvent, volumeMode, reduced }: SceneProps) {
  const vmRefs = useRef<(THREE.Group | null)[]>([null, null, null]);
  const ringRefs = useRef<(SVGCircleElement | null)[]>([null, null, null]);
  const vmTimeRef = useRef<HTMLSpanElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);

  const contRefs = useRef<(THREE.Group | null)[]>([]);
  const spawnTimes = useRef<number[]>(new Array(SLOTS).fill(-99));
  const slotCursor = useRef(0);
  const spawnCount = useRef(0);
  const nextSpawn = useRef(0);

  const lifeRef = useRef<THREE.Group>(null);
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

  const CIRC = 2 * Math.PI * 15;

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // ── VM lane: 18s boot loop ──
    const bootT = t % VM_BOOT;
    const bootP = bootT / VM_BOOT;
    vmRefs.current.forEach((g, i) => {
      if (!g) return;
      const stagger = Math.max(0, Math.min(1, (bootP - i * 0.08) / (1 - i * 0.08)));
      const s = 0.25 + 0.75 * stagger;
      g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, s, 6, delta));
      g.rotation.y = reduced ? 0 : Math.sin(t * 0.4 + i) * 0.12;
    });
    ringRefs.current.forEach((c, i) => {
      if (!c) return;
      const stagger = Math.max(0, Math.min(1, (bootP - i * 0.08) / (1 - i * 0.08)));
      c.style.strokeDashoffset = `${CIRC * (1 - stagger)}`;
    });
    if (vmTimeRef.current) vmTimeRef.current.textContent = bootT >= VM_BOOT - 0.05 ? "18.0s" : `${bootT.toFixed(1)}s`;

    // ── Container lane: instant spawn stream ──
    if (t >= nextSpawn.current) {
      nextSpawn.current = t + SPAWN_EVERY;
      spawnTimes.current[slotCursor.current] = t;
      slotCursor.current = (slotCursor.current + 1) % SLOTS;
      spawnCount.current += 1;
      if (countRef.current) countRef.current.textContent = String(spawnCount.current);
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

      <Chip position={[-2.55, 2.35, 0]} accent="#8fa2c9">
        LANE A · VMs · 18s boot
      </Chip>
      <Chip position={[1.7, 2.35, 0]} accent={EMERALD}>
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
          <Html position={[0.75, 0.5, 0.3]} center zIndexRange={[15, 0]} style={{ pointerEvents: "none" }}>
            <svg width="38" height="38" viewBox="0 0 38 38" aria-hidden>
              <circle cx="19" cy="19" r="15" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
              <circle
                ref={(el) => { ringRefs.current[i] = el; }}
                cx="19" cy="19" r="15" fill="none"
                stroke="#94a3b8" strokeWidth="3" strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC}
                transform="rotate(-90 19 19)"
              />
              <text x="19" y="23" textAnchor="middle" fontSize="9" fill="#8fa2c9" fontFamily="monospace">
                VM{i + 1}
              </text>
            </svg>
          </Html>
        </group>
      ))}

      {/* stopwatch panel */}
      <Html position={[2.4, 2.3, 0]} center zIndexRange={[15, 0]} style={{ pointerEvents: "none" }}>
        <div className="glass rounded-lg px-3 py-2 text-center font-mono text-[10px] leading-relaxed">
          <div className="text-[#8fa2c9]">
            VM boot: <span ref={vmTimeRef} className="text-[#e8eefc]">0.0s</span> / 18s
          </div>
          <div className="text-[#8fa2c9]">
            containers up: <span ref={countRef} className="text-[#34d399]">0</span>
          </div>
        </div>
      </Html>

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
      <Chip position={[0, 1.35, 2.2]} accent={EMERALD}>
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