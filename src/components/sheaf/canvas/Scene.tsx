import { useEffect, useMemo, useRef, type ComponentRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { kindLabel, levelHex, hexToRgb01, residualColor } from "@/lib/sheaf/palette";
import { LAYER_Z, nodeRadius } from "@/lib/sheaf/layout";
import type { NodeKind, SheafNode, Vec3 } from "@/lib/sheaf/types";
import { useSheaf } from "@/store/sheaf";
import { useVisible } from "../useVisible";

const GOAL = new THREE.Vector3();
const LOOK = new THREE.Vector3();
const SCALE = new THREE.Vector3();

function CameraRig() {
  const { camera } = useThree();
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const flyToId = useSheaf((s) => s.flyToId);
  const positions = useSheaf((s) => s.positions);
  const clearFly = useSheaf((s) => s.flyTo);
  const blend = useRef(0);
  const target = useRef(new THREE.Vector3(0, 7.2, 0));

  useEffect(() => {
    const c = controls.current;
    if (c) c.target.set(0, 7.2, 0);
  }, []);

  useEffect(() => {
    if (!flyToId) return;
    const p = positions[flyToId];
    if (!p) return;
    target.current.set(p.x, p.y, p.z);
    blend.current = 1;
  }, [flyToId, positions]);

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.1);
    const c = controls.current;
    if (blend.current <= 0 || !c) return;
    blend.current = Math.max(0, blend.current - d * 1.1);
    const t = 1 - Math.exp(-d * 3.4);
    LOOK.copy(target.current);
    GOAL.set(LOOK.x + 5.5, LOOK.y + 3.8, LOOK.z + 6.5);
    camera.position.lerp(GOAL, t);
    c.target.lerp(LOOK, t);
    c.update();
    if (blend.current <= 0) clearFly(null);
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.07}
      minDistance={8}
      maxDistance={56}
      minPolarAngle={0.72}
      maxPolarAngle={1.28}
      target={[0, 7.2, 0]}
    />
  );
}

function NodeGeom({ kind, r }: { kind: NodeKind; r: number }) {
  switch (kind) {
    case "paper":
      return <boxGeometry args={[r * 1.65, r * 1.65, r * 1.65]} />;
    case "algorithm":
      return <octahedronGeometry args={[r * 1.35, 0]} />;
    case "theorem":
      return <cylinderGeometry args={[r * 1.05, r * 1.05, r * 1.4, 6]} />;
    case "model":
      return <dodecahedronGeometry args={[r * 1.15, 0]} />;
    case "integrity":
      return <torusGeometry args={[r * 0.9, r * 0.28, 8, 18]} />;
    default:
      return <icosahedronGeometry args={[r, 1]} />;
  }
}

function labelOffset(pos: Vec3, radius: number): [number, number, number] {
  const len = Math.hypot(pos.x, pos.z) || 1;
  const push = 1.9;
  return [(pos.x / len) * push, radius + 0.32, (pos.z / len) * push];
}

function NodeMark({
  node,
  pos,
  radius,
  active,
  dimmed,
  color,
  showLabel,
}: {
  node: SheafNode;
  pos: Vec3;
  radius: number;
  active: boolean;
  dimmed: boolean;
  color: string;
  showLabel: boolean;
}) {
  const select = useSheaf((s) => s.select);
  const hover = useSheaf((s) => s.hover);
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    const m = mesh.current;
    if (!m) return;
    const d = Math.min(delta, 0.1);
    const pulse = active ? 1.08 + Math.sin(performance.now() * 0.004) * 0.04 : 1;
    SCALE.set(pulse, pulse, pulse);
    m.scale.lerp(SCALE, 1 - Math.exp(-d * 8));
  });

  return (
    <group position={[pos.x, pos.y, pos.z]}>
      <mesh
        ref={mesh}
        onClick={(e) => {
          e.stopPropagation();
          select(node.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          hover(node.id);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          hover(null);
          document.body.style.cursor = "";
        }}
      >
        <NodeGeom kind={node.kind} r={radius} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={active ? 0.55 : dimmed ? 0.08 : 0.22}
          roughness={0.42}
          metalness={0.12}
          transparent
          opacity={dimmed ? 0.28 : 0.96}
        />
      </mesh>
      {node.known ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 1.45, radius * 1.62, 24]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.55}
            side={THREE.DoubleSide}
          />
        </mesh>
      ) : null}
      {showLabel ? (
        <Html
          center
          occlude={false}
          position={labelOffset(pos, radius)}
          style={{ pointerEvents: "none" }}
          wrapperClass="sheaf-html-wrap"
          zIndexRange={[10, 0]}
        >
          <div className={active ? "sheaf-label is-active" : "sheaf-label"}>
            <span className="sheaf-label-pip" style={{ background: color }} />
            <span className="sheaf-label-text">
              {node.title}
              {active ? (
                <span className="sheaf-label-meta">
                  {kindLabel(node.kind)} · L{node.level}
                  {node.known ? " · pinned" : ""}
                </span>
              ) : null}
            </span>
          </div>
        </Html>
      ) : null}
    </group>
  );
}

function EdgeLines({
  edges,
  positions,
  tOf,
  consistency,
}: {
  edges: { id: string; source: string; target: string; residual: number }[];
  positions: Record<string, Vec3>;
  tOf: (r: number) => number;
  consistency: number;
}) {
  const geom = useMemo(() => {
    const positionsArr: number[] = [];
    const colorsArr: number[] = [];
    for (const e of edges) {
      const a = positions[e.source];
      const b = positions[e.target];
      if (!a || !b) continue;
      positionsArr.push(a.x, a.y, a.z, b.x, b.y, b.z);
      const t = tOf(e.residual);
      const hex = residualColor(t);
      const [r, g, bl] = hexToRgb01(hex);
      const boost = 0.35 + consistency * 0.65;
      colorsArr.push(r * boost, g * boost, bl * boost, r * boost, g * boost, bl * boost);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positionsArr, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(colorsArr, 3));
    return g;
  }, [edges, positions, tOf, consistency]);

  useEffect(() => () => geom.dispose(), [geom]);

  return (
    <lineSegments geometry={geom} raycast={() => {}}>
      <lineBasicMaterial vertexColors transparent opacity={0.55 + consistency * 0.35} />
    </lineSegments>
  );
}

function LevelPlanes() {
  const maxLevel = useSheaf((s) => s.maxLevel);
  const levels = useSheaf((s) => s.levels);
  const select = useSheaf((s) => s.select);
  return (
    <>
      {levels.map((lv) => {
        if (lv.id > maxLevel) return null;
        const hex = levelHex(lv.id);
        const [r, g, b] = hexToRgb01(hex);
        const rad = 8.8 + Math.max(0, 3 - lv.id) * 1.35;
        return (
          <group key={lv.id} position={[0, lv.id * LAYER_Z, 0]}>
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              onClick={(e) => {
                e.stopPropagation();
                select(null);
              }}
            >
              <circleGeometry args={[rad, 64]} />
              <meshBasicMaterial
                color={new THREE.Color(r, g, b)}
                transparent
                opacity={0.13}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
            <Html
              position={[-rad * 0.02, 0.04, rad * 0.88]}
              center
              occlude={false}
              style={{ pointerEvents: "none" }}
              wrapperClass="sheaf-html-wrap"
              zIndexRange={[5, 0]}
            >
              <div className="sheaf-layer-label">
                <span className="sheaf-layer-swatch" style={{ background: hex }} />
                {lv.label}
              </div>
            </Html>
          </group>
        );
      })}
    </>
  );
}

function Lattice() {
  const vis = useVisible();
  const positions = useSheaf((s) => s.positions);
  const stalkScale = useSheaf((s) => s.stalkScale);
  const consistency = useSheaf((s) => s.consistency);
  const showLabels = useSheaf((s) => s.showLabels);
  const maxLevel = useSheaf((s) => s.maxLevel);
  const selectedId = vis.selectedId;
  const hoveredId = vis.hoveredId;
  const select = useSheaf((s) => s.select);

  return (
    <group
      onPointerMissed={() => {
        select(null);
      }}
    >
      <LevelPlanes />
      <EdgeLines
        edges={vis.edges}
        positions={positions}
        tOf={vis.tOf}
        consistency={consistency}
      />
      {vis.nodes.map((n) => {
        const p = positions[n.id];
        if (!p) return null;
        const active = n.id === selectedId || n.id === hoveredId;
        const dimmed = Boolean(selectedId) && n.id !== selectedId && n.id !== hoveredId;
        const onSlice = n.level === maxLevel;
        const showLabel = active || (showLabels && !dimmed && onSlice);
        return (
          <NodeMark
            key={n.id}
            node={n}
            pos={p}
            radius={nodeRadius(n.dim, stalkScale)}
            active={active}
            dimmed={dimmed}
            color={levelHex(n.level)}
            showLabel={showLabel}
          />
        );
      })}
    </group>
  );
}

export function SheafScene() {
  const select = useSheaf((s) => s.select);
  return (
    <Canvas
      camera={{ position: [20, 18, 24], fov: 40, near: 0.1, far: 140 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      onCreated={({ gl, camera }) => {
        gl.setClearColor("#081114", 1);
        camera.lookAt(0, 7.2, 0);
      }}
      onPointerMissed={() => select(null)}
      style={{ touchAction: "none" }}
    >
      <color attach="background" args={["#081114"]} />
      <fog attach="fog" args={["#081114", 24, 72]} />
      <ambientLight intensity={0.42} />
      <directionalLight position={[8, 14, 10]} intensity={1.15} />
      <pointLight position={[-6, 6, 8]} intensity={0.4} color="#4a9a92" />
      <pointLight position={[6, -4, 12]} intensity={0.28} color="#b08978" />
      <Lattice />
      <CameraRig />
    </Canvas>
  );
}
