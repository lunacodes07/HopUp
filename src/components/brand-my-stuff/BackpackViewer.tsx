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
  useGLTF,
} from "@react-three/drei";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { backpackSlotPrice } from "@/lib/brand-objects";

/** Matches the Blender launch film body color. */
export const PACK_BLUE = "#A6C3E2";

const MODEL_URL = "/brandmybackpack/backpack.glb";

/* ------------------------------------------------------------------ */
/* 14 patches placed on the real Blender geometry.                     */
/* Coordinates are in the model's own units (bag is ~0.45 tall);       */
/* everything is scaled together inside the turntable group.           */
/* glTF axes: x = width, y = up, +z = front of the bag.                */
/* ------------------------------------------------------------------ */

type PackSlot = {
  n: number;
  position: [number, number, number];
  rotation: [number, number, number];
  /** patch pad width/height in model units */
  size: [number, number];
  /** Group yaw that turns this patch to the camera. null = keep current. */
  faceYaw: number | null;
};

const HALF = Math.PI / 2;

const PACK_SLOTS: PackSlot[] = [
  // 1 — front hero, where the BRAND panel sits in the film
  { n: 1, position: [0, 0.318, 0.0935], rotation: [0, 0, 0], size: [0.15, 0.09], faceYaw: 0 },
  // 2-3 — front pocket, below its zip
  { n: 2, position: [-0.055, 0.112, 0.1205], rotation: [0, 0, 0], size: [0.085, 0.06], faceYaw: 0 },
  { n: 3, position: [0.055, 0.112, 0.1205], rotation: [0, 0, 0], size: [0.085, 0.06], faceYaw: 0 },
  // 4-6 — left side (bottom one on the side pocket)
  { n: 4, position: [-0.146, 0.375, 0.005], rotation: [0, -HALF, 0], size: [0.075, 0.055], faceYaw: HALF },
  { n: 5, position: [-0.148, 0.282, 0.005], rotation: [0, -HALF, 0], size: [0.075, 0.055], faceYaw: HALF },
  { n: 6, position: [-0.168, 0.115, 0.006], rotation: [0, -HALF, 0], size: [0.075, 0.055], faceYaw: HALF },
  // 7-9 — right side (bottom one on the side pocket)
  { n: 7, position: [0.146, 0.375, 0.005], rotation: [0, HALF, 0], size: [0.075, 0.055], faceYaw: -HALF },
  { n: 8, position: [0.148, 0.282, 0.005], rotation: [0, HALF, 0], size: [0.075, 0.055], faceYaw: -HALF },
  { n: 9, position: [0.168, 0.115, 0.006], rotation: [0, HALF, 0], size: [0.075, 0.055], faceYaw: -HALF },
  // 10 — top, the full area around the handle (sunk into the domed lid)
  { n: 10, position: [0, 0.4425, -0.01], rotation: [-HALF, 0, 0], size: [0.17, 0.095], faceYaw: null },
  // 11-14 — inner back panel, 2x2 between the straps (hidden when worn)
  { n: 11, position: [-0.058, 0.295, -0.0815], rotation: [0, Math.PI, 0], size: [0.075, 0.06], faceYaw: Math.PI },
  { n: 12, position: [0.058, 0.295, -0.0815], rotation: [0, Math.PI, 0], size: [0.075, 0.06], faceYaw: Math.PI },
  { n: 13, position: [-0.058, 0.175, -0.0815], rotation: [0, Math.PI, 0], size: [0.075, 0.06], faceYaw: Math.PI },
  { n: 14, position: [0.058, 0.175, -0.0815], rotation: [0, Math.PI, 0], size: [0.075, 0.06], faceYaw: Math.PI },
];

/* ------------------------------------------------------------------ */
/* Canvas textures — drawn at each pad's aspect so nothing stretches   */
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

function makeEmptySlotTexture(
  slotNumber: number,
  selected: boolean,
  price: number,
  aspect: number
): THREE.CanvasTexture {
  const H = 256;
  const W = Math.round(H * aspect);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);

  // White ink on the blue pads, matching the bag's white trim
  const ink = selected ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.78)";

  if (selected) {
    roundedRectPath(ctx, 10, 10, W - 20, H - 20, 26);
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.fill();
  }

  ctx.strokeStyle = ink;
  ctx.lineWidth = selected ? 7 : 5;
  ctx.setLineDash(selected ? [] : [16, 12]);
  roundedRectPath(ctx, 10, 10, W - 20, H - 20, 26);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = ink;
  ctx.font = "600 30px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(String(slotNumber), 28, 24);

  ctx.strokeStyle = ink;
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(W / 2 - 22, H / 2 - 8);
  ctx.lineTo(W / 2 + 22, H / 2 - 8);
  ctx.moveTo(W / 2, H / 2 - 30);
  ctx.lineTo(W / 2, H / 2 + 14);
  ctx.stroke();

  ctx.font = "600 32px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(`$${price}`, W / 2, H - 30);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function makeLogoStickerTexture(img: HTMLImageElement, aspect: number): THREE.CanvasTexture {
  const H = 512;
  const W = Math.round(H * aspect);
  const pad = 42;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  roundedRectPath(ctx, 8, 8, W - 16, H - 16, 52);
  ctx.fillStyle = "rgba(255,255,255,0.97)";
  ctx.fill();

  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  const scale = Math.min((W - pad * 2) / srcW, (H - pad * 2) / srcH);
  const w = srcW * scale;
  const h = srcH * scale;
  ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function useSlotLogoTexture(logoUrl: string | null, aspect: number) {
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
      if (!cancelled) setTexture(makeLogoStickerTexture(img, aspect));
    };
    img.onerror = () => {
      if (!cancelled) setTexture(null);
    };
    img.src = logoUrl;
    return () => {
      cancelled = true;
    };
  }, [logoUrl, aspect]);

  useEffect(() => {
    return () => texture?.dispose();
  }, [texture]);

  return texture;
}

/* ------------------------------------------------------------------ */
/* Scene pieces                                                        */
/* ------------------------------------------------------------------ */

/** The actual bag from the Blender film, exported as GLB. */
function BackpackModel() {
  const { scene } = useGLTF(MODEL_URL);

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        const material = child.material;
        if (material instanceof THREE.MeshStandardMaterial) {
          material.envMapIntensity = 0.85;
        }
      }
    });
  }, [scene]);

  return <primitive object={scene} />;
}

function SlotPatch({
  spec,
  logoUrl,
  selected,
  onSelect,
}: {
  spec: PackSlot;
  logoUrl: string | null;
  selected: boolean;
  onSelect: (n: number) => void;
}) {
  const [w, h] = spec.size;
  const aspect = w / h;
  const logoTexture = useSlotLogoTexture(logoUrl, aspect);
  const emptyTexture = useMemo(
    () => (logoTexture ? null : makeEmptySlotTexture(spec.n, selected, backpackSlotPrice(spec.n), aspect)),
    [logoTexture, selected, spec.n, aspect]
  );

  useEffect(() => {
    return () => emptyTexture?.dispose();
  }, [emptyTexture]);

  const press = useRef<{ x: number; y: number; pointerType: string } | null>(null);

  // Stitched-on pad colors: blue like the film's BRAND panel when empty,
  // white sticker card when a logo is on it.
  const padColor = logoTexture ? "#F5F7FA" : selected ? "#5E82AC" : "#84A3C7";
  const padDepth = 0.011;

  return (
    <group
      position={spec.position}
      rotation={spec.rotation}
      onPointerDown={(e) => {
        press.current = { x: e.clientX, y: e.clientY, pointerType: e.pointerType };
      }}
      onPointerUp={(e) => {
        const start = press.current;
        press.current = null;
        if (!start) return;
        // Fingers scrolling or spinning the bag should not change the slot.
        if (start.pointerType !== "mouse") return;
        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        if (dx * dx + dy * dy > 64) return;
        e.stopPropagation();
        onSelect(spec.n);
      }}
      onPointerOver={(e) => {
        if (e.pointerType !== "mouse") return;
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        if (e.pointerType !== "mouse") return;
        document.body.style.cursor = "auto";
      }}
    >
      {/* Raised fabric pad, half sunk into the surface like a stitched patch */}
      <RoundedBox args={[w, h, padDepth]} radius={Math.min(w, h) * 0.18} smoothness={4} castShadow>
        <meshStandardMaterial color={padColor} roughness={0.62} metalness={0.03} />
      </RoundedBox>
      {/* Sticker face */}
      <mesh position={[0, 0, padDepth / 2 + 0.0008]}>
        <planeGeometry args={[w * 0.96, h * 0.96]} />
        {logoTexture ? (
          <meshBasicMaterial map={logoTexture} transparent toneMapped={false} />
        ) : (
          <meshStandardMaterial map={emptyTexture} transparent roughness={0.55} metalness={0} />
        )}
      </mesh>
    </group>
  );
}

function slotFaceYaw(n: number): number | null {
  return (PACK_SLOTS.find((s) => s.n === n) ?? PACK_SLOTS[0]).faceYaw;
}

function shortestDelta(from: number, to: number): number {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Entrance spin, then yaws so the selected patch faces the camera. */
function Turntable({ selectedSlot, children }: { selectedSlot: number; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const entered = useRef(false);
  const faceYaw = slotFaceYaw(selectedSlot);

  useFrame((_, delta) => {
    const g = ref.current;
    if (!g) return;

    if (!entered.current) {
      const k = 1 - Math.exp(-4 * delta);
      const s = g.scale.x + (1 - g.scale.x) * k;
      g.scale.setScalar(s);
      if (Math.abs(1 - s) < 0.002) {
        g.scale.setScalar(1);
        entered.current = true;
      }
    }

    if (faceYaw != null) {
      const yaw = shortestDelta(g.rotation.y, faceYaw);
      const spin = 1 - Math.exp(-(entered.current ? 6 : 3.2) * delta);
      g.rotation.y += yaw * spin;
    }
  });

  return (
    <group ref={ref} rotation={[0, -2.6, 0]} scale={0.9}>
      {children}
    </group>
  );
}

/** Tiny trackball in the corner — drag it to orbit without grabbing the scene. */
function SpinGlobe({
  controlsRef,
  onEngage,
}: {
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  onEngage: () => void;
}) {
  const ballRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; id: number } | null>(null);

  useEffect(() => {
    let frame = 0;
    const sync = () => {
      const controls = controlsRef.current;
      const ball = ballRef.current;
      if (controls && ball) {
        const tilt = THREE.MathUtils.radToDeg(controls.getPolarAngle() - Math.PI / 2);
        const yaw = THREE.MathUtils.radToDeg(-controls.getAzimuthalAngle());
        ball.style.transform = `rotateX(${tilt}deg) rotateY(${yaw}deg)`;
      }
      frame = window.requestAnimationFrame(sync);
    };
    frame = window.requestAnimationFrame(sync);
    return () => window.cancelAnimationFrame(frame);
  }, [controlsRef]);

  const orbitBy = (dx: number, dy: number) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const k = 0.01;
    controls.setAzimuthalAngle(controls.getAzimuthalAngle() - dx * k);
    controls.setPolarAngle(
      THREE.MathUtils.clamp(
        controls.getPolarAngle() - dy * k,
        controls.minPolarAngle,
        controls.maxPolarAngle
      )
    );
    controls.update();
  };

  return (
    <div
      aria-label="Rotate backpack"
      title="Drag to rotate"
      className="absolute bottom-3.5 right-3.5 z-10 size-11 touch-none select-none cursor-grab rounded-full active:cursor-grabbing"
      style={{ touchAction: "none" }}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
        onEngage();
      }}
      onPointerMove={(e) => {
        const start = drag.current;
        if (!start || start.id !== e.pointerId) return;
        orbitBy(e.clientX - start.x, e.clientY - start.y);
        start.x = e.clientX;
        start.y = e.clientY;
      }}
      onPointerUp={(e) => {
        if (drag.current?.id === e.pointerId) drag.current = null;
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
    >
      <div
        className="relative size-full rounded-full"
        style={{
          perspective: "90px",
          boxShadow: "0 6px 14px -8px rgba(45,41,38,0.55), inset 0 1px 0 rgba(255,255,255,0.7)",
        }}
      >
        <div ref={ballRef} className="absolute inset-0 will-change-transform" style={{ transformStyle: "preserve-3d" }}>
          <svg viewBox="0 0 44 44" className="size-full" aria-hidden>
            <defs>
              <radialGradient id="pack-globe-fill" cx="32%" cy="28%" r="72%">
                <stop offset="0%" stopColor="#F4F8FC" />
                <stop offset="55%" stopColor="#C7DAEC" />
                <stop offset="100%" stopColor="#8AA9CB" />
              </radialGradient>
            </defs>
            <circle cx="22" cy="22" r="20.5" fill="url(#pack-globe-fill)" />
            <g fill="none" stroke="#33455C" strokeWidth="0.7" strokeOpacity="0.45" strokeLinecap="round">
              <ellipse cx="22" cy="22" rx="20.5" ry="20.5" />
              <ellipse cx="22" cy="22" rx="7" ry="20.5" />
              <ellipse cx="22" cy="22" rx="14" ry="20.5" />
              <ellipse cx="22" cy="22" rx="20.5" ry="7" />
              <ellipse cx="22" cy="22" rx="20.5" ry="14" />
              <line x1="1.5" y1="22" x2="42.5" y2="22" />
              <line x1="22" y1="1.5" x2="22" y2="42.5" />
            </g>
          </svg>
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background:
              "linear-gradient(145deg, rgba(255,255,255,0.45) 0%, transparent 42%, rgba(45,41,38,0.12) 100%)",
          }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Public component                                                    */
/* ------------------------------------------------------------------ */

export type BackpackViewerProps = {
  /** slot number -> square-fit logo data URL or proxied logo */
  slotLogos: Record<number, string>;
  selectedSlot: number;
  onSelectSlot: (n: number) => void;
};

export default function BackpackViewer({ slotLogos, selectedSlot, onSelectSlot }: BackpackViewerProps) {
  const [autoRotate, setAutoRotate] = useState(true);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const skipFirst = useRef(true);

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    setAutoRotate(false);
    const controls = controlsRef.current;
    if (!controls) return;
    controls.setAzimuthalAngle(0);
    controls.update();
  }, [selectedSlot]);

  return (
    <div className="relative h-full w-full">
      <Canvas
        shadows="percentage"
        dpr={[1, 1.8]}
        camera={{ position: [0, 1.5, 6.2], fov: 30 }}
        gl={{ antialias: true, alpha: true }}
        style={{ touchAction: "none" }}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[4, 8, 5]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />

        <Turntable selectedSlot={selectedSlot}>
          {/* The film's bag is ~0.45 units tall — scale it up and rest it on the floor */}
          <group scale={4.5} position={[0, -1.0, 0]}>
            <BackpackModel />
            {PACK_SLOTS.map((spec) => (
              <SlotPatch
                key={spec.n}
                spec={spec}
                logoUrl={slotLogos[spec.n] ?? null}
                selected={selectedSlot === spec.n}
                onSelect={onSelectSlot}
              />
            ))}
          </group>
        </Turntable>

        <ContactShadows position={[0, -1.01, 0]} opacity={0.35} scale={9} blur={2.6} far={4} resolution={512} color="#2D2926" />

        {/* Local environment lighting — soft studio like the film, no network HDRI */}
        <Environment resolution={256}>
          <Lightformer intensity={1.15} position={[0, 5, 7]} scale={[10, 5, 1]} />
          <Lightformer intensity={0.7} position={[-7, 3, -2]} rotation-y={Math.PI / 2} scale={[8, 4, 1]} color="#EAF2FA" />
          <Lightformer intensity={0.55} position={[7, 3.5, 0]} rotation-y={-Math.PI / 2} scale={[8, 4, 1]} />
          <Lightformer intensity={0.4} position={[0, -2, -7]} scale={[9, 3, 1]} color="#F0EDE8" />
        </Environment>

        <OrbitControls
          ref={controlsRef}
          makeDefault
          target={[0, 0.08, 0]}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={4}
          maxDistance={10}
          minPolarAngle={0.45}
          maxPolarAngle={2.15}
          autoRotate={autoRotate}
          autoRotateSpeed={1.1}
          onStart={() => setAutoRotate(false)}
        />
      </Canvas>
      <SpinGlobe controlsRef={controlsRef} onEngage={() => setAutoRotate(false)} />
    </div>
  );
}

useGLTF.preload(MODEL_URL);
