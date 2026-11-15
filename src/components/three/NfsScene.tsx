/* eslint-disable react-hooks/immutability -- three.js/R3F imperative material & camera mutation is the canonical pattern here */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CameraRig, Chip } from "./shared";

const CYAN = "#22d3ee";
const CENTER = new THREE.Vector3(0, 1.15, 0);
const ORBIT_R = 2.75;

interface SceneProps {
  sync: boolean;
  squash: boolean;
  firewall: boolean;
  mounted: boolean;
  reduced: boolean;
}

function Scene({ sync, squash, firewall, mounted, reduced }: SceneProps) {
  const clientRefs = useRef<(THREE.Group | null)[]>([null, null, null]);
  const packetRefs = useRef<(THREE.Mesh | null)[]>([null, null, null]);
  const ghostRefs = useRef<THREE.Mesh[][]>([[], [], []]);
  const angles = useRef([0.6, 0.6 + (Math.PI * 2) / 3, 0.6 + (4 * Math.PI) / 3]);
  const speedRef = useRef(0.5);
  const tRef = useRef([0, 0.33, 0.66]);
  const pulses = useRef([0, 0, 0]);

  const serverRef = useRef<THREE.Group>(null);
  const avatarRef = useRef<THREE.Group>(null);
  const cableRef = useRef<THREE.Mesh>(null);
  const cableProgress = useRef(0);
  const [cableAngle, setCableAngle] = useState<number | null>(null);
  const lastMounted = useRef(mounted);

  // shared materials (updated imperatively, zero re-renders)
  const serverMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: CYAN, emissive: CYAN, emissiveIntensity: 0.45, metalness: 0.5, roughness: 0.3, transparent: true, opacity: 0.7 }),
    []
  );
  const clientMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: CYAN, emissive: CYAN, emissiveIntensity: 0.22, metalness: 0.5, roughness: 0.4, transparent: true, opacity: 0.85 }),
    []
  );
  const packetMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: CYAN, emissive: CYAN, emissiveIntensity: 2.4, transparent: true }),
    []
  );
  const avatarMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#f59e0b", emissive: "#f59e0b", emissiveIntensity: 0.5 }),
    []
  );

  const grey = useMemo(() => new THREE.Color("#64748b"), []);
  const cyan = useMemo(() => new THREE.Color(CYAN), []);
  const amber = useMemo(() => new THREE.Color("#f59e0b"), []);
  const steel = useMemo(() => new THREE.Color("#94a3b8"), []);

  useEffect(() => {
    if (mounted !== lastMounted.current) {
      lastMounted.current = mounted;
      setCableAngle(mounted ? angles.current[1] : null);
      cableProgress.current = 0;
    }
  }, [mounted]);

  const cableGeo = useMemo(() => {
    if (cableAngle === null) return null;
    const start = new THREE.Vector3(
      CENTER.x + Math.cos(cableAngle) * ORBIT_R,
      CENTER.y - 0.9 + Math.sin(cableAngle) * ORBIT_R * 0.22,
      CENTER.z + Math.sin(cableAngle) * ORBIT_R * 0.8
    );
    const mid = start.clone().lerp(CENTER, 0.5).add(new THREE.Vector3(0, -0.7, 0));
    const curve = new THREE.CatmullRomCurve3([start, mid, CENTER.clone().add(new THREE.Vector3(0, -0.5, 0.55))]);
    return new THREE.TubeGeometry(curve, 40, 0.028, 8, false);
  }, [cableAngle]);

  useEffect(() => () => cableGeo?.dispose(), [cableGeo]);

  const packetCurves = useMemo(
    () =>
      [0, 1, 2].map(
        () =>
          new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(),
            new THREE.Vector3(),
            new THREE.Vector3()
          )
      ),
    []
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    const targetSpeed = firewall ? 0 : mounted ? 0.04 : 0.5;
    speedRef.current = THREE.MathUtils.damp(speedRef.current, targetSpeed, 3, delta);

    clientRefs.current.forEach((g, i) => {
      if (!g) return;
      angles.current[i] += speedRef.current * delta * (i === 0 ? 1 : i === 1 ? 0.9 : 1.1);
      const a = angles.current[i];
      g.position.set(
        CENTER.x + Math.cos(a) * ORBIT_R,
        CENTER.y - 0.9 + Math.sin(a) * ORBIT_R * 0.22,
        CENTER.z + Math.sin(a) * ORBIT_R * 0.8
      );
      g.rotation.y = a * 0.6;
    });

    serverMat.color.lerp(firewall ? grey : cyan, Math.min(1, delta * 4));
    serverMat.emissive.lerp(firewall ? grey : cyan, Math.min(1, delta * 4));
    serverMat.emissiveIntensity = firewall ? 0.1 : 0.45;
    clientMat.color.lerp(firewall ? grey : cyan, Math.min(1, delta * 4));
    clientMat.emissive.lerp(firewall ? grey : cyan, Math.min(1, delta * 4));
    packetMat.color.lerp(firewall ? grey : cyan, Math.min(1, delta * 5));
    packetMat.emissive.lerp(firewall ? grey : cyan, Math.min(1, delta * 5));
    avatarMat.color.lerp(squash ? steel : amber, Math.min(1, delta * 4));
    avatarMat.emissive.lerp(squash ? steel : amber, Math.min(1, delta * 4));

    if (serverRef.current) {
      const alertPulse = squash ? 0 : 1;
      serverRef.current.scale.setScalar(1 + alertPulse * Math.abs(Math.sin(t * 4)) * 0.05);
    }

    // packets travel along bezier arcs
    const packetSpeed = firewall ? 0 : sync ? 0.42 : 0.85;
    clientRefs.current.forEach((g, i) => {
      if (!g || !packetRefs.current[i]) return;
      tRef.current[i] = (tRef.current[i] + packetSpeed * delta) % 1.3;
      const frac = Math.min(1, tRef.current[i]);
      const curve = packetCurves[i];
      curve.v0.copy(CENTER);
      curve.v2.copy(g.position);
      curve.v1.copy(curve.v0.clone().lerp(curve.v2, 0.5)).add(new THREE.Vector3(0, -1.15, 0));

      const mesh = packetRefs.current[i]!;
      const dockHold = sync ? 0.3 : 0.12;
      const travel = Math.min(1, frac / (1 - dockHold));
      const p = curve.getPoint(sync ? THREE.MathUtils.smoothstep(travel, 0, 1) : travel);
      mesh.position.copy(p);
      if (frac >= 1 - dockHold && tRef.current[i] < dockHold + 0.05) pulses.current[i] = 1;
      pulses.current[i] = Math.max(0, pulses.current[i] - delta * 2.2);
      mesh.scale.setScalar(firewall ? 0.55 : 1 + pulses.current[i] * 0.9);
      packetMat.opacity = firewall ? 0.4 : 1;

      ghostRefs.current[i].forEach((c, k) => {
        if (!c) return;
        const show = !sync && !firewall;
        c.visible = show;
        if (show) {
          const behind = Math.max(0, frac - (k + 1) * 0.06);
          c.position.copy(curve.getPoint(behind));
          c.scale.setScalar(1 - (k + 1) * 0.15);
        }
      });
    });

    // root avatar: tries to touch the server file
    if (avatarRef.current && clientRefs.current[0]) {
      const clientPos = clientRefs.current[0].position;
      const home = new THREE.Vector3(clientPos.x, clientPos.y + 0.85, clientPos.z);
      const target = squash ? home : CENTER.clone().add(new THREE.Vector3(0, -0.35, 0.8));
      avatarRef.current.position.lerp(target, Math.min(1, delta * (squash ? 2 : 1.4)));
      if (!squash) avatarRef.current.position.x += Math.sin(t * 14) * 0.012;
      avatarRef.current.rotation.y = t * (squash ? 0.4 : 1.6);
    }

    // mount cable draws in
    if (cableRef.current && cableGeo) {
      cableProgress.current = THREE.MathUtils.damp(cableProgress.current, mounted ? 1 : 0, 2.6, delta);
      const total = cableGeo.index ? cableGeo.index.count : cableGeo.attributes.position.count;
      cableGeo.setDrawRange(0, Math.floor(total * Math.max(0.002, cableProgress.current)));
      cableRef.current.visible = cableProgress.current > 0.01;
    }
  });

  return (
    <>
      {/* server node */}
      <group ref={serverRef} position={CENTER.toArray()}>
        <mesh material={serverMat}>
          <boxGeometry args={[1.12, 1.12, 1.12]} />
        </mesh>
        <mesh>
          <boxGeometry args={[1.15, 1.15, 1.15]} />
          <meshBasicMaterial color={CYAN} wireframe transparent opacity={0.22} />
        </mesh>
        <Chip position={[0, 1.05, 0]} accent={CYAN}>
          n10 · /srv/nfs/shared
        </Chip>
        <Chip position={[0, -1.0, 0]} accent="#34d399" visible={sync}>
          sync · write committed before ACK
        </Chip>
        <Chip position={[0, -1.0, 0]} accent="#f59e0b" visible={!sync}>
          async · phantom writes possible
        </Chip>
        <Chip position={[0, 1.7, 0]} accent="#f87171" visible={!squash}>
          SECURITY ALERT · root writes as root
        </Chip>
        <Chip position={[0, 1.7, 0]} accent="#34d399" visible={squash}>
          PASS · root_squash active
        </Chip>
      </group>

      {/* clients */}
      {[0, 1, 2].map((i) => (
        <group key={i} ref={(el) => { clientRefs.current[i] = el; }}>
          <mesh material={clientMat}>
            <boxGeometry args={[0.55, 0.55, 0.55]} />
          </mesh>
          <Chip position={[0, -0.62, 0]} accent="#8fa2c9">
            client-{i + 1}
          </Chip>
        </group>
      ))}

      {/* packets + async trails (world-space) */}
      {[0, 1, 2].map((i) => (
        <group key={`p-${i}`}>
          <mesh ref={(el) => { packetRefs.current[i] = el; }} material={packetMat}>
            <sphereGeometry args={[0.085, 14, 14]} />
          </mesh>
          {[0, 1, 2, 3].map((k) => (
            <mesh key={k} ref={(el) => { if (el) ghostRefs.current[i][k] = el; }} visible={false}>
              <sphereGeometry args={[0.06, 10, 10]} />
              <meshBasicMaterial color={CYAN} transparent opacity={0.26 - k * 0.055} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
          ))}
        </group>
      ))}

      {/* root avatar */}
      <group ref={avatarRef} position={[2.2, 0.4, 1.4]}>
        <mesh material={avatarMat}>
          <sphereGeometry args={[0.2, 18, 18]} />
        </mesh>
        <Chip position={[0, 0.42, 0]} accent={squash ? "#94a3b8" : "#f59e0b"}>
          {squash ? "nobody (65534)" : "root@client"}
        </Chip>
      </group>

      {/* mount cable */}
      {cableGeo && (
        <mesh ref={cableRef} geometry={cableGeo} visible={false}>
          <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={1.4} transparent opacity={0.85} />
        </mesh>
      )}

      <group position={[-2.4, -0.9, 1.2]}>
        <Chip position={[0, 0, 0]} accent="#f87171" visible={!firewall}>
          mount.nfs: Connection timed out · 2049 blocked
        </Chip>
      </group>

      <CameraRig enabled={!reduced} strength={0.07} baseZ={7.6} />
      <ambientLight intensity={0.5} />
      <pointLight position={[3, 5, 6]} intensity={70} color="#c8f6ff" />
      <pointLight position={[-5, -2, 3]} intensity={30} color={CYAN} />
      <fog attach="fog" args={["#05070f", 9, 19]} />
    </>
  );
}

/** NFS scene: central export + 3 orbiting clients + bezier packet flows. */
export default function NfsScene(props: SceneProps & { frameloop?: "always" | "demand" }) {
  const { frameloop = "always", ...rest } = props;
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={frameloop}
      camera={{ position: [0, 0.7, 7.6], fov: 44 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <Scene {...rest} />
    </Canvas>
  );
}