"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import * as THREE from "three";
import { Burst, CameraRig, Chip } from "./shared";

const VIOLET = "#7c5cff";

const smooth = (a: number, b: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

interface SceneProps {
  progressRef: React.MutableRefObject<number>;
  extended: boolean;
  snapshot: boolean;
  corrupt: boolean;
  rollbackCount: number;
  reduced: boolean;
}

function Scene({ progressRef, extended, snapshot, corrupt, rollbackCount, reduced }: SceneProps) {
  const diskRefs = useRef<(THREE.Group | null)[]>([null, null, null]);
  const disk4Ref = useRef<THREE.Group>(null);
  const cubeRef = useRef<THREE.Group>(null);
  const cubeMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const dataRef = useRef<THREE.Group>(null);
  const logsRef = useRef<THREE.Group>(null);
  const dataMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const logsMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const ghostRef = useRef<THREE.Group>(null);
  const ghostMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const [phase, setPhase] = useState(0);
  const phaseRef = useRef(0);
  // burst triggers derived from prop changes (render-time adjustment pattern)
  const [ticks, setTicks] = useState({ corrupt: 0, restore: 0, lastCorrupt: corrupt, lastRb: rollbackCount });
  if (ticks.lastCorrupt !== corrupt || ticks.lastRb !== rollbackCount) {
    setTicks((s) => ({
      corrupt: s.corrupt + (corrupt && s.lastCorrupt !== corrupt ? 1 : 0),
      restore: s.restore + (rollbackCount > s.lastRb ? 1 : 0),
      lastCorrupt: corrupt,
      lastRb: rollbackCount,
    }));
  }
  const rollbackT = useRef(1);
  const ghostStartY = useRef(1.45);
  const prevRb = useRef(rollbackCount);

  const spread: [number, number, number][] = [
    [-3.5, 1.0, 0.5],
    [0, -2.6, -0.4],
    [3.5, 1.3, 0.3],
  ];
  const slots = extended ? [-0.95, -0.32, 0.32] : [-0.64, 0, 0.64];
  const slot4 = 0.95;

  useFrame((state, delta) => {
    const p = THREE.MathUtils.clamp(progressRef.current, 0, 1);
    const t = state.clock.elapsedTime;

    // arm the rollback timer when a new rollback arrives (ref work in useFrame)
    if (prevRb.current !== rollbackCount) {
      prevRb.current = rollbackCount;
      rollbackT.current = 0;
      ghostStartY.current = 1.45;
    }

    const pA = smooth(0.02, 0.36, p);
    const pB = smooth(0.38, 0.6, p);
    const pC = smooth(0.64, 0.9, p);
    const pD = smooth(0.9, 1, p);

    // phase for chips
    const nextPhase = p < 0.38 ? 0 : p < 0.72 ? 1 : 2;
    if (nextPhase !== phaseRef.current) {
      phaseRef.current = nextPhase;
      setPhase(nextPhase);
    }

    // ── disks converge & stack ──
    diskRefs.current.forEach((g, i) => {
      if (!g) return;
      const sx = THREE.MathUtils.lerp(spread[i][0], slots[i], pA);
      const sy = THREE.MathUtils.lerp(spread[i][1], -1.62, pA);
      const sz = THREE.MathUtils.lerp(spread[i][2], 0, pA);
      const bob = reduced ? 0 : Math.sin(t * 1.2 + i * 1.7) * 0.05 * (1 - pA);
      g.position.set(sx, sy + bob, sz);
      g.rotation.z = THREE.MathUtils.lerp(0.35 * (i - 1), 0, pA);
      // sink into the cube as it forms
      const sink = pB;
      g.position.y += sink * 0.75;
      const mat = (g.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial;
      mat.opacity = 1 - sink;
      mat.transparent = true;
      g.visible = pB < 0.999;
    });

    // 4th disk flies in when extended (visible while the pool is still assembling)
    if (disk4Ref.current) {
      const g = disk4Ref.current;
      const inPlay = extended && pA > 0.5 && pB < 0.999;
      const tx = inPlay ? slot4 : 4.8;
      const ty = inPlay ? -1.62 : -0.2;
      g.position.x = THREE.MathUtils.damp(g.position.x, tx, 3.4, delta);
      g.position.y = THREE.MathUtils.damp(g.position.y, ty, 3.4, delta);
      const mat = (g.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial;
      mat.transparent = true;
      mat.opacity = THREE.MathUtils.damp(mat.opacity, inPlay ? 1 : 0, 4, delta);
      g.visible = mat.opacity > 0.02;
    }

    // ── VG cube forms ──
    if (cubeRef.current && cubeMatRef.current) {
      const s = easeOutBack(pB);
      cubeRef.current.scale.setScalar(Math.max(0.001, s));
      cubeMatRef.current.opacity = Math.max(0, 0.18 * pB * (1 - pC));
      cubeRef.current.rotation.y = (reduced ? 0 : Math.sin(t * 0.4) * 0.08) + pC * 0.12;
      cubeRef.current.visible = pB > 0.001 && pC < 0.999;
    }

    // ── slabs split out of the cube ──
    const dataY = 0.62;
    const logsY = -0.52;
    if (dataRef.current) {
      dataRef.current.position.y = THREE.MathUtils.lerp(0.1, dataY, pC);
      dataRef.current.position.x = reduced || !corrupt ? 0 : (Math.random() - 0.5) * 0.035;
      dataRef.current.visible = pC > 0.001;
      const targetScaleX = extended ? 1.45 : 1;
      const cur = dataRef.current.scale.x;
      const ns = THREE.MathUtils.damp(cur, targetScaleX, 5, delta);
      dataRef.current.scale.set(ns, 1, 1);
    }
    if (logsRef.current) {
      logsRef.current.position.y = THREE.MathUtils.lerp(0.1, logsY, pC);
      logsRef.current.visible = pC > 0.001;
    }
    if (dataMatRef.current) {
      const red = new THREE.Color("#f87171");
      const violet = new THREE.Color("#8b6bff");
      dataMatRef.current.color.lerp(corrupt ? red : violet, Math.min(1, delta * 5));
      dataMatRef.current.emissive.lerp(corrupt ? red : violet, Math.min(1, delta * 5));
      dataMatRef.current.emissiveIntensity = corrupt ? 0.7 : 0.32;
    }

    // ── snapshot ghost ──
    if (ghostRef.current && ghostMatRef.current) {
      rollbackT.current = Math.min(1, rollbackT.current + delta / 0.9);
      const rb = rollbackT.current < 1 ? smooth(0, 1, rollbackT.current) : 1;
      const ghostY = snapshot || rollbackT.current < 1 ? THREE.MathUtils.lerp(ghostStartY.current, dataY, rb) : ghostStartY.current;
      ghostRef.current.position.y = ghostY;
      ghostRef.current.position.x = 0;
      const targetOpacity = snapshot && rollbackT.current >= 1 ? 0.2 : rollbackT.current < 1 ? 0.2 * (1 - rb) : 0;
      ghostMatRef.current.opacity = THREE.MathUtils.damp(ghostMatRef.current.opacity, targetOpacity, 6, delta);
      ghostRef.current.visible = ghostMatRef.current.opacity > 0.01;
      const sx = extended ? 1.45 : 1;
      ghostRef.current.scale.set(sx, 1, 1);
    }

    // camera dolly
    if (!reduced) {
      state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, 7.4 - p * 0.9, 2.5, delta);
    }
  });

  return (
    <>
      {/* floating disks */}
      {[0, 1, 2].map((i) => (
        <group key={i} ref={(el) => { diskRefs.current[i] = el; }}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.56, 0.56, 0.16, 48]} />
            <meshStandardMaterial
              color={VIOLET}
              emissive={VIOLET}
              emissiveIntensity={0.4}
              metalness={0.55}
              roughness={0.32}
              transparent
              opacity={1}
            />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.095]}>
            <torusGeometry args={[0.34, 0.022, 10, 40]} />
            <meshStandardMaterial color="#e8eefc" emissive={VIOLET} emissiveIntensity={0.75} transparent opacity={0.85} />
          </mesh>
          <Chip position={[0, 0.78, 0]} accent={VIOLET} visible={phase === 0}>
              /dev/{["sdb", "sdc", "sdd"][i]} · 4G
            </Chip>
        </group>
      ))}

      {/* 4th disk (extend demo) */}
      <group ref={disk4Ref} position={[4.8, -0.2, 0]} visible={false}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.52, 0.52, 0.15, 44]} />
          <meshStandardMaterial
            color={VIOLET}
            emissive={VIOLET}
            emissiveIntensity={0.5}
            metalness={0.6}
            roughness={0.35}
            transparent
            opacity={0}
          />
        </mesh>
        <Chip position={[0, 0.85, 0]} accent="#34d399" visible={extended && phase === 0}>
            /dev/sde · 4G NEW
          </Chip>
      </group>

      {/* volume group cube */}
      <group ref={cubeRef} visible={false}>
        <mesh>
          <boxGeometry args={[2.1, 1.1, 1.35]} />
          <meshStandardMaterial
            ref={cubeMatRef}
            color={VIOLET}
            emissive={VIOLET}
            emissiveIntensity={0.18}
            transparent
            opacity={0.18}
            depthWrite={false}
          />
          <Edges color={VIOLET} />
        </mesh>
        <Chip position={[0, 1.05, 0]} accent={VIOLET} visible={phase === 1}>
            vg_lab · {extended ? "16G" : "12G"} pool
          </Chip>
      </group>

      {/* lv_data slab */}
      <group ref={dataRef} visible={false}>
        <mesh>
          <boxGeometry args={[1.95, 0.46, 1.3]} />
          <meshStandardMaterial
            ref={dataMatRef}
            color="#8b6bff"
            emissive="#8b6bff"
            emissiveIntensity={0.32}
            metalness={0.5}
            roughness={0.4}
            transparent
            opacity={0.92}
          />
          <Edges color="#c4b5fd" />
        </mesh>
        <Chip position={[0, 0.62, 0]} accent={VIOLET} visible={phase === 2}>
            lv_data · XFS · {extended ? "7G" : "5G"}
          </Chip>
      </group>

      {/* lv_logs slab */}
      <group ref={logsRef} visible={false}>
        <mesh>
          <boxGeometry args={[1.95, 0.46, 1.3]} />
          <meshStandardMaterial
            ref={logsMatRef}
            color="#5b46b0"
            emissive="#5b46b0"
            emissiveIntensity={0.25}
            metalness={0.5}
            roughness={0.45}
            transparent
            opacity={0.9}
          />
          <Edges color="#a78bfa" />
        </mesh>
        <Chip position={[0, -0.6, 0]} accent="#a78bfa" visible={phase === 2}>
            lv_logs · ext4 · 2G
          </Chip>
      </group>

      {/* snapshot ghost */}
      <group ref={ghostRef} position={[0, 1.45, 0]} visible={false}>
        <mesh>
          <boxGeometry args={[1.95, 0.46, 1.3]} />
          <meshStandardMaterial
            ref={ghostMatRef}
            color="#e8eefc"
            emissive="#c4b5fd"
            emissiveIntensity={0.4}
            transparent
            opacity={0}
            depthWrite={false}
          />
          <Edges color="#e8eefc" />
        </mesh>
        <Chip position={[0, 0.55, 0]} accent="#e8eefc" visible={snapshot}>
            lv_data_snap · point-in-time
          </Chip>
      </group>

      <Burst trigger={ticks.corrupt} color="#f87171" origin={[0, 0.62, 0]} spread={1.5} gravity={0.7} />
      <Burst trigger={ticks.restore} color="#c4b5fd" origin={[0, 0.9, 0]} spread={1.3} gravity={-0.1} />

      <CameraRig enabled={!reduced} strength={0.07} baseZ={7.6} />
      <ambientLight intensity={0.55} />
      <pointLight position={[4, 4, 6]} intensity={70} color="#cdd7ff" />
      <pointLight position={[-5, -2, 4]} intensity={35} color={VIOLET} />
      <fog attach="fog" args={["#05070f", 9, 18]} />
    </>
  );
}

/** Scroll-scrubbed LVM scene: disks → volume group → lv_data + lv_logs. */
export default function LvmScene(props: SceneProps & { frameloop?: "always" | "demand" }) {
  const { frameloop = "always", ...rest } = props;
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={frameloop}
      camera={{ position: [0, 0.55, 7.4], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <Scene {...rest} />
    </Canvas>
  );
}
