import { useEffect, useMemo, useRef, type ComponentRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Billboard, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { levelHex, hexToRgb01, residualColor } from "@/lib/sheaf/palette";
import { LAYER_Z, nodeRadius, layerRadius } from "@/lib/sheaf/layout";
import { canEnterRoom } from "@/lib/sheaf/room";
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
  const target = useRef(new THREE.Vector3(0, 10.2, 0));

  useEffect(() => {
    const c = controls.current;
    if (c) c.target.set(0, 10.2, 0);
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
      maxDistance={120}
      minPolarAngle={0.22}
      maxPolarAngle={1.42}
      target={[0, 10.2, 0]}
    />
  );
}

function NodeGeom({ kind, r }: { kind: NodeKind; r: number }) {
  switch (kind) {
    case "paper":
      return <boxGeometry args={[r * 1.65, r * 1.65, r * 1.65]} />;
    case "algorithm":
    case "subsystem":
      return <octahedronGeometry args={[r * 1.35, 0]} />;
    case "theorem":
    case "surface":
      return <cylinderGeometry args={[r * 1.05, r * 1.05, r * 1.4, 6]} />;
    case "model":
    case "adapter":
      return <dodecahedronGeometry args={[r * 1.15, 0]} />;
    case "integrity":
      return <torusGeometry args={[r * 0.9, r * 0.28, 8, 18]} />;
    case "runtime":
      return <icosahedronGeometry args={[r * 1.12, 1]} />;
    default:
      return <icosahedronGeometry args={[r, 1]} />;
  }
}

function shortTitle(node: SheafNode): string {
  return node.title
    .replace(/^langchain-/, "")
    .replace(/^langchain\//, "")
    .replace(/\s+\*$/, "*");
}

const texCache = new Map<string, THREE.CanvasTexture>();

function labelTexture(text: string, pip: string, active: boolean): THREE.CanvasTexture {
  const key = `${text}|${pip}|${active ? "1" : "0"}`;
  const hit = texCache.get(key);
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = active ? 128 : 80;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const w = Math.min(740, 48 + text.length * 22);
  const h = active ? 112 : 68;
  ctx.fillStyle = active ? "rgba(244,239,230,0.98)" : "rgba(244,239,230,0.94)";
  ctx.beginPath();
  ctx.roundRect(4, 4, w, h, 14);
  ctx.fill();
  ctx.fillStyle = pip;
  ctx.beginPath();
  ctx.arc(28, h / 2 + 2, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1c1916";
  ctx.font = `${active ? 600 : 650} ${active ? 36 : 32}px "IBM Plex Sans", system-ui, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.fillText(text, 48, h / 2 + 2, w - 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  texCache.set(key, tex);
  return tex;
}

function LayerCaption({ text, color }: { text: string; color: string }) {
  const tex = useMemo(() => labelTexture(text, color, false), [text, color]);
  const w = Math.min(7.2, 1.4 + text.length * 0.16);
  return (
    <mesh renderOrder={12}>
      <planeGeometry args={[w, 0.5]} />
      <meshBasicMaterial map={tex} transparent depthTest={false} toneMapped={false} />
    </mesh>
  );
}

function NodeLabel({
  title,
  color,
  active,
  radius,
}: {
  title: string;
  color: string;
  active: boolean;
  radius: number;
}) {
  const tex = useMemo(() => labelTexture(title, color, active), [title, color, active]);
  const w = Math.min(5.6, 1.1 + title.length * 0.19);
  const h = active ? 0.72 : 0.48;
  return (
    <Billboard position={[0, radius + 0.55, 0]} follow>
      <mesh renderOrder={20}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={tex} transparent depthTest={false} toneMapped={false} />
      </mesh>
    </Billboard>
  );
}

function NodeMark({
  node,
  pos,
  radius,
  active,
  dimmed,
  color,
  showLabel,
  enterable,
}: {
  node: SheafNode;
  pos: Vec3;
  radius: number;
  active: boolean;
  dimmed: boolean;
  color: string;
  showLabel: boolean;
  enterable: boolean;
}) {
  const select = useSheaf((s) => s.select);
  const hover = useSheaf((s) => s.hover);
  const enterRoom = useSheaf((s) => s.enterRoom);
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
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (enterable) enterRoom(node.id);
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
      {enterable ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 1.85, radius * 2.02, 6]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={active ? 0.7 : 0.38}
            side={THREE.DoubleSide}
          />
        </mesh>
      ) : null}
      {showLabel ? (
        <NodeLabel title={shortTitle(node)} color={color} active={active} radius={radius} />
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
  const nodes = useSheaf((s) => s.nodes);
  const select = useSheaf((s) => s.select);
  const counts = useMemo(() => {
    const m = new Map<number, number>();
    for (const n of nodes) m.set(n.level, (m.get(n.level) ?? 0) + 1);
    return m;
  }, [nodes]);
  return (
    <>
      {levels.map((lv) => {
        if (lv.id > maxLevel) return null;
        const hex = levelHex(lv.id);
        const [r, g, b] = hexToRgb01(hex);
        const n = counts.get(lv.id) ?? 0;
        const rad = layerRadius(lv.id, n);
        return (
          <group key={lv.id} position={[0, lv.id * LAYER_Z, 0]}>
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              onClick={(e) => {
                e.stopPropagation();
                select(null);
              }}
            >
              <circleGeometry args={[rad, 72]} />
              <meshBasicMaterial
                color={new THREE.Color(r, g, b)}
                transparent
                opacity={0.16}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
            <Billboard position={[0, 0.35, rad * 0.78]} follow>
              <LayerCaption text={`L${lv.id}  ${lv.label}  ·  ${n}`} color={hex} />
            </Billboard>
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
  const selectedId = vis.selectedId;
  const hoveredId = vis.hoveredId;
  const select = useSheaf((s) => s.select);
  const rooms = useSheaf((s) => s.rooms);
  const edges = useSheaf((s) => s.edges);

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
        const dense = vis.nodes.length > 24;
        const top = vis.nodes.reduce((m, x) => Math.max(m, x.level), 0);
        const essence = n.known || n.level === top;
        const showLabel = active || (showLabels && !dimmed && (!dense || essence));
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
            enterable={canEnterRoom(n, edges, rooms)}
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
      camera={{ position: [6, 36, 38], fov: 42, near: 0.1, far: 220 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      onCreated={({ gl, camera }) => {
        gl.setClearColor("#081114", 1);
        camera.lookAt(0, 10.2, 0);
      }}
      onPointerMissed={() => select(null)}
      style={{ touchAction: "none" }}
    >
      <color attach="background" args={["#081114"]} />
      <fog attach="fog" args={["#081114", 48, 140]} />
      <ambientLight intensity={0.42} />
      <directionalLight position={[8, 14, 10]} intensity={1.15} />
      <pointLight position={[-6, 6, 8]} intensity={0.4} color="#4a9a92" />
      <pointLight position={[6, -4, 12]} intensity={0.28} color="#b08978" />
      <Lattice />
      <CameraRig />
    </Canvas>
  );
}
