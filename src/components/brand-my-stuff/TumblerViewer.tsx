"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
  RoundedBox,
} from "@react-three/drei";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { slotPrice } from "@/lib/brand-objects";

/* ------------------------------------------------------------------ */
/* Quencher-style palette (matched to the reference photo)             */
/* ------------------------------------------------------------------ */

export const TUMBLER_PINK = "#F2AFC9";
const PINK_DEEP = "#E79BBA";
const STEEL = "#C9C7C3";
const LID_WHITE = "#F6F3EF";
const STRAW_WHITE = "#FAF7F3";

/* ------------------------------------------------------------------ */
/* Slot layout: 12 curved patches.                                     */
/* - 6 large squares evenly spaced around the wide upper body          */
/* - 6 small squares evenly spaced around the narrow base, staggered   */
/* The ring is phased so no slot collides with the handle.             */
/* ------------------------------------------------------------------ */

const BODY_RADIUS = 0.985;
const HANDLE_THETA = 2.35;

type SlotSpec = {
  n: number;
  y: number;
  centerTheta: number;
  radius: number;
  height: number;
  thetaWidth: number;
};

const RING_STEP = (Math.PI * 2) / 6;
// Phased so the handle (HANDLE_THETA) falls exactly in the gap between two upper slots
const UPPER_PHASE = HANDLE_THETA - 1.5 * RING_STEP;
const LOWER_PHASE = UPPER_PHASE + RING_STEP / 2; // staggered vs the upper ring

const SLOT_SPECS: SlotSpec[] = [
  // Upper ring — 6 large slots covering most of the wide body
  ...Array.from({ length: 6 }, (_, i) => ({
    n: i + 1,
    y: 2.63,
    centerTheta: UPPER_PHASE + i * RING_STEP,
    radius: BODY_RADIUS + 0.045,
    height: 0.84,
    thetaWidth: 0.78,
  })),
  // Lower ring — 6 small slots wrapped tightly around the base
  ...Array.from({ length: 6 }, (_, i) => ({
    n: i + 7,
    y: 0.9,
    centerTheta: LOWER_PHASE + i * RING_STEP,
    radius: 0.70,
    height: 0.58,
    thetaWidth: 0.86,
  })),
];

/* ------------------------------------------------------------------ */
/* Canvas-generated textures for empty slots + selection ring          */
/* ------------------------------------------------------------------ */

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function makeEmptySlotTexture(slotNumber: number, selected: boolean, price: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);

  // Dark plum ink reads well on the pink powder coat
  const ink = selected ? "#8C2D55" : "rgba(90,38,62,0.55)";

  if (selected) {
    roundedRectPath(ctx, 10, 10, size - 20, size - 20, 30);
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.fill();
  }

  ctx.strokeStyle = ink;
  ctx.lineWidth = selected ? 7 : 5;
  ctx.setLineDash(selected ? [] : [16, 12]);
  roundedRectPath(ctx, 10, 10, size - 20, size - 20, 30);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = ink;
  ctx.font = "600 30px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(String(slotNumber), 30, 26);

  ctx.strokeStyle = ink;
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(size / 2 - 24, size / 2 - 6);
  ctx.lineTo(size / 2 + 24, size / 2 - 6);
  ctx.moveTo(size / 2, size / 2 - 30);
  ctx.lineTo(size / 2, size / 2 + 18);
  ctx.stroke();

  ctx.font = "600 34px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(`$${price}`, size / 2, size - 38);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function makeSelectionRingTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = "#8C2D55";
  ctx.lineWidth = 8;
  roundedRectPath(ctx, 6, 6, size - 12, size - 12, 34);
  ctx.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/* ------------------------------------------------------------------ */
/* Scene pieces                                                        */
/* ------------------------------------------------------------------ */

function makeLogoStickerTexture(img: HTMLImageElement): THREE.CanvasTexture {
  const size = 512;
  const pad = 40;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  roundedRectPath(ctx, 10, 10, size - 20, size - 20, 56);
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  ctx.fill();

  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  const scale = Math.min((size - pad * 2) / srcW, (size - pad * 2) / srcH);
  const w = srcW * scale;
  const h = srcH * scale;
  ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function useSlotLogoTexture(logoUrl: string | null) {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    if (!logoUrl) {
      setTexture(null);
      return;
    }

    let cancelled = false;
    const img = new Image();
    if (!logoUrl.startsWith("data:")) img.crossOrigin = "anonymous";

    img.onload = () => {
      if (cancelled) return;
      setTexture(makeLogoStickerTexture(img));
    };
    img.onerror = () => {
      if (!cancelled) setTexture(null);
    };
    img.src = logoUrl;

    return () => {
      cancelled = true;
    };
  }, [logoUrl]);

  useEffect(() => {
    return () => {
      texture?.dispose();
    };
  }, [texture]);

  return texture;
}

function SlotPatch({
  spec,
  logoUrl,
  selected,
  onSelect,
  onHover,
}: {
  spec: SlotSpec;
  logoUrl: string | null;
  selected: boolean;
  onSelect: (n: number) => void;
  onHover?: (n: number | null) => void;
}) {
  const logoTexture = useSlotLogoTexture(logoUrl);
  const emptyTexture = useMemo(
    () => (logoTexture ? null : makeEmptySlotTexture(spec.n, selected, slotPrice(spec.n))),
    [logoTexture, selected, spec.n]
  );

  useEffect(() => {
    return () => {
      emptyTexture?.dispose();
    };
  }, [emptyTexture]);

  const width = spec.thetaWidth * spec.radius;
  const pointer = {
    onClick: (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      onSelect(spec.n);
    },
    onPointerOver: () => {
      document.body.style.cursor = "pointer";
      onHover?.(spec.n);
    },
    onPointerOut: () => {
      document.body.style.cursor = "auto";
      onHover?.(null);
    },
  };

  return (
    <mesh
      position={[
        spec.radius * Math.sin(spec.centerTheta),
        spec.y,
        spec.radius * Math.cos(spec.centerTheta),
      ]}
      rotation={[0, spec.centerTheta, 0]}
      {...pointer}
    >
      <planeGeometry args={[width, spec.height]} />
      {logoTexture ? (
        <meshBasicMaterial
          map={logoTexture}
          transparent
          toneMapped={false}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      ) : (
        <meshStandardMaterial
          map={emptyTexture}
          transparent
          roughness={0.5}
          metalness={0.05}
          side={THREE.DoubleSide}
        />
      )}
    </mesh>
  );
}

/** Powder-coated pink material shared by body, handle and cap. */
function PinkCoat() {
  return (
    <meshPhysicalMaterial
      color={TUMBLER_PINK}
      metalness={0.15}
      roughness={0.36}
      clearcoat={0.7}
      clearcoatRoughness={0.3}
      sheen={0.25}
      sheenColor="#FFD9E8"
      envMapIntensity={1.05}
    />
  );
}

/** The signature squared loop handle, swept as a tube along a curve. */
function Handle() {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(0.82, 3.12, 0),
        new THREE.Vector3(1.42, 3.08, 0),
        new THREE.Vector3(1.62, 2.78, 0),
        new THREE.Vector3(1.62, 2.34, 0),
        new THREE.Vector3(1.44, 2.02, 0),
        new THREE.Vector3(0.78, 1.94, 0),
      ],
      false,
      "catmullrom",
      0.35
    );
    return new THREE.TubeGeometry(curve, 48, 0.105, 14, false);
  }, []);

  return (
    <group rotation={[0, HANDLE_THETA - Math.PI / 2, 0]}>
      <mesh geometry={geometry} castShadow>
        <PinkCoat />
      </mesh>
    </group>
  );
}

function TumblerBody() {
  const profile = useMemo(
    () => [
      new THREE.Vector2(0.0, 0.02),
      new THREE.Vector2(0.34, 0.02),
      new THREE.Vector2(0.55, 0.06),
      new THREE.Vector2(0.62, 0.16),
      new THREE.Vector2(0.645, 0.6),
      new THREE.Vector2(0.65, 1.42),
      new THREE.Vector2(0.72, 1.58),
      new THREE.Vector2(0.86, 1.74),
      new THREE.Vector2(0.96, 1.88),
      new THREE.Vector2(BODY_RADIUS, 2.0),
      new THREE.Vector2(BODY_RADIUS, 3.26),
      new THREE.Vector2(0.965, 3.3),
    ],
    []
  );

  return (
    <group>
      {/* Powder-coated body */}
      <mesh castShadow receiveShadow>
        <latheGeometry args={[profile, 80]} />
        <PinkCoat />
      </mesh>

      {/* Polished steel rim */}
      <mesh position={[0, 3.37, 0]} castShadow>
        <cylinderGeometry args={[0.975, 0.99, 0.16, 72]} />
        <meshStandardMaterial color={STEEL} metalness={1} roughness={0.16} envMapIntensity={1.3} />
      </mesh>

      {/* Frosted white lid */}
      <mesh position={[0, 3.54, 0]} castShadow>
        <cylinderGeometry args={[0.97, 1.0, 0.2, 72]} />
        <meshPhysicalMaterial color={LID_WHITE} roughness={0.55} metalness={0} transmission={0.12} thickness={0.4} />
      </mesh>
      <mesh position={[0, 3.68, 0]}>
        <cylinderGeometry args={[0.86, 0.965, 0.1, 72]} />
        <meshPhysicalMaterial color={LID_WHITE} roughness={0.55} metalness={0} />
      </mesh>

      {/* Pink pill cap */}
      <RoundedBox args={[0.92, 0.16, 0.48]} radius={0.07} smoothness={4} position={[0, 3.78, 0]} castShadow>
        <meshPhysicalMaterial
          color={PINK_DEEP}
          metalness={0.1}
          roughness={0.45}
          clearcoat={0.4}
          clearcoatRoughness={0.4}
        />
      </RoundedBox>

      {/* Straw */}
      <group position={[0.3, 0, 0]} rotation={[0, 0, -0.05]}>
        <mesh position={[0, 4.12, 0]} castShadow>
          <cylinderGeometry args={[0.068, 0.068, 0.9, 24]} />
          <meshPhysicalMaterial color={STRAW_WHITE} roughness={0.4} transmission={0.25} thickness={0.2} />
        </mesh>
        <mesh position={[0, 4.55, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.14, 24]} />
          <meshStandardMaterial color={PINK_DEEP} roughness={0.45} />
        </mesh>
      </group>

      <Handle />
    </group>
  );
}

function slotTheta(n: number): number {
  return (SLOT_SPECS.find((s) => s.n === n) ?? SLOT_SPECS[0]).centerTheta;
}

function shortestDelta(from: number, to: number): number {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Entrance spin, then yaws so the selected slot always faces the camera. */
function Turntable({
  selectedSlot,
  children,
}: {
  selectedSlot: number;
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  const entered = useRef(false);
  const targetY = -slotTheta(selectedSlot);

  useFrame((_, delta) => {
    const g = ref.current;
    if (!g) return;

    if (!entered.current) {
      const k = 1 - Math.exp(-4 * delta);
      g.position.y += (0 - g.position.y) * k;
      const s = g.scale.x + (1 - g.scale.x) * k;
      g.scale.setScalar(s);
      if (Math.abs(g.position.y) < 0.002 && Math.abs(1 - s) < 0.002) {
        g.position.y = 0;
        g.scale.setScalar(1);
        entered.current = true;
      }
    }

    const yaw = shortestDelta(g.rotation.y, targetY);
    const spin = 1 - Math.exp(-(entered.current ? 6 : 3.2) * delta);
    g.rotation.y += yaw * spin;
  });

  return (
    <group ref={ref} rotation={[0, -2.6, 0]} position={[0, -0.55, 0]} scale={0.88}>
      {children}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Public component                                                    */
/* ------------------------------------------------------------------ */

export type TumblerViewerProps = {
  /** slot number -> square-fit logo data URL or proxied logo */
  slotLogos: Record<number, string>;
  selectedSlot: number;
  onSelectSlot: (n: number) => void;
  onHoverSlot?: (n: number | null) => void;
};

export default function TumblerViewer({
  slotLogos,
  selectedSlot,
  onSelectSlot,
  onHoverSlot,
}: TumblerViewerProps) {
  const [autoRotate, setAutoRotate] = useState(true);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const skipFirstFace = useRef(true);

  const selectedHasLogo = Boolean(slotLogos[selectedSlot]);

  useEffect(() => {
    if (skipFirstFace.current && !selectedHasLogo) {
      skipFirstFace.current = false;
      return;
    }
    skipFirstFace.current = false;
    setAutoRotate(false);
    const controls = controlsRef.current;
    if (!controls) return;
    controls.setAzimuthalAngle(0);
    controls.update();
  }, [selectedSlot, selectedHasLogo]);

  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.8]}
      camera={{ position: [0, 2.6, 9.2], fov: 30 }}
      gl={{ antialias: true, alpha: true }}
      style={{ touchAction: "none" }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[4, 8, 4]}
        intensity={1.25}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      <Turntable selectedSlot={selectedSlot}>
        <TumblerBody />
        {SLOT_SPECS.map((spec) => (
          <SlotPatch
            key={spec.n}
            spec={spec}
            logoUrl={slotLogos[spec.n] ?? null}
            selected={selectedSlot === spec.n}
            onSelect={onSelectSlot}
            onHover={onHoverSlot}
          />
        ))}
      </Turntable>

      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.35}
        scale={10}
        blur={2.6}
        far={4}
        resolution={512}
        color="#2D2926"
      />

      {/* Local environment lighting — no network HDRI fetch */}
      <Environment resolution={256}>
        <Lightformer intensity={1.1} position={[0, 5, 7]} scale={[10, 5, 1]} />
        <Lightformer intensity={0.7} position={[-7, 3, -2]} rotation-y={Math.PI / 2} scale={[8, 4, 1]} color="#FFEDF3" />
        <Lightformer intensity={0.55} position={[7, 3.5, 0]} rotation-y={-Math.PI / 2} scale={[8, 4, 1]} />
        <Lightformer intensity={0.4} position={[0, -2, -7]} scale={[9, 3, 1]} color="#F0EDE8" />
      </Environment>

      <OrbitControls
        ref={controlsRef}
        makeDefault
        target={[0, 2.05, 0]}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={5.5}
        maxDistance={12}
        minPolarAngle={0.7}
        maxPolarAngle={1.85}
        autoRotate={autoRotate}
        autoRotateSpeed={1.1}
        onStart={() => setAutoRotate(false)}
      />
    </Canvas>
  );
}
