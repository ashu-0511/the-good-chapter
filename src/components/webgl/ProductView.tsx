"use client";

import { View } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { tierConfig, type Tier } from "@/lib/capabilities";
import type { Product } from "@/content/products";
import { BlobShadow } from "./Garment";
import { getStudioEnv } from "./garments/material";
import { GARMENT_H, isGift, modelBounds } from "./models";
import { ProductModel } from "./ProductModel";
import { useCompiledReveal } from "./useCompiledReveal";

export type PanelPointer = { x: number; y: number; hover: number };

const TAN = Math.tan(THREE.MathUtils.degToRad(13));

function Scene({
  product,
  pointer,
  tier,
  reduced,
  index,
}: {
  product: Product;
  pointer: RefObject<PanelPointer>;
  tier: Exclude<Tier, "none">;
  reduced: boolean;
  index: number;
}) {
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const env = useMemo(() => getStudioEnv(gl), [gl]);
  const group = useRef<THREE.Group>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const s = useRef({ x: 0, y: 0, h: 0, appear: 0 });
  const cfg = tierConfig[tier];
  const ready = useCompiledReveal(group);

  const aspect = size.width / Math.max(1, size.height);
  const visH = 2 * 9 * TAN;
  const b = modelBounds(product.kind);
  // gifts fill a little less of the frame than garments, which read airier
  const scale = isGift(product.kind)
    ? Math.min((0.62 * visH) / b.h, (0.6 * visH * aspect) / b.w)
    : Math.min((0.7 * visH) / GARMENT_H, (0.74 * visH * aspect) / b.w);
  const baseYaw = index % 2 ? -0.28 : 0.26;

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const p = pointer.current;
    const k = Math.min(1, dt * 4);
    s.current.x += (p.x - s.current.x) * k;
    s.current.y += (p.y - s.current.y) * k;
    s.current.h += (p.hover - s.current.h) * Math.min(1, dt * 5);
    s.current.appear = reduced ? (ready ? 1 : 0) : THREE.MathUtils.damp(s.current.appear, ready ? 1 : 0, 4, dt);
    const { x, y, h, appear } = s.current;
    const t = state.clock.elapsedTime + index * 1.3;
    const idle = reduced ? 0 : 1;
    g.rotation.set(
      -y * 0.2 * h + Math.sin(t * 0.5) * 0.03 * idle,
      baseYaw * (1 - h * 0.6) + x * 0.5 * h + Math.sin(t * 0.3) * 0.12 * idle,
      Math.sin(t * 0.4) * 0.02 * idle,
    );
    const bob = Math.sin(t * 0.7) * 0.05 * idle;
    g.position.set(0, 0.06 + bob + h * 0.1 - b.cy * scale - (1 - appear) * 0.35, h * 0.4);
    g.scale.setScalar(scale * (1 + h * 0.03) * (0.9 + 0.1 * appear));
    if (shadow.current) {
      const w = scale * Math.max(1.3, b.w * 0.8) * (1 - bob - h * 0.12);
      shadow.current.scale.set(w, w * 0.8, 1);
      shadow.current.position.set(0, (b.bottom - b.cy - 0.19) * scale, -0.4);
      (shadow.current.material as THREE.MeshBasicMaterial).opacity = (0.34 - h * 0.1 - bob) * appear;
    }
  });

  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[-4, 6, 6]} intensity={1.25} color="#fff1e0" />
      <directionalLight position={[6, 1, -5]} intensity={0.7} color="#e8edf2" />
      <pointLight position={[2.5, 2, 4.5]} intensity={7} color="#ffe2c9" decay={2} />
      <ProductModel
        ref={group}
        kind={product.kind}
        colors={product.colors}
        envMap={env}
        detail={cfg.detail}
        texSize={cfg.tex}
        reduced={reduced}
      />
      <BlobShadow ref={shadow} />
    </>
  );
}

export default function ProductView(props: {
  product: Product;
  pointer: RefObject<PanelPointer>;
  tier: Exclude<Tier, "none">;
  reduced: boolean;
  index: number;
}) {
  return (
    <View className="absolute inset-0">
      <Scene {...props} />
    </View>
  );
}
