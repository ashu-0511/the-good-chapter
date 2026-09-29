"use client";

import type { ThreeElements } from "@react-three/fiber";
import type { Ref } from "react";
import type * as THREE from "three";
import { Garment } from "./Garment";
import { Gift } from "./Gift";
import type { GarmentColors } from "./garments/painter";
import { isGift, type ProductKind } from "./models";

type Props = ThreeElements["group"] & {
  kind: ProductKind;
  colors: GarmentColors;
  envMap: THREE.Texture | null;
  detail?: number;
  texSize?: number;
  reduced?: boolean;
  ref?: Ref<THREE.Group>;
};

/** One 3D product, garment or gift. */
export function ProductModel({ kind, detail, reduced, ...props }: Props) {
  return isGift(kind) ? <Gift kind={kind} reduced={reduced} {...props} /> : <Garment kind={kind} detail={detail} {...props} />;
}
