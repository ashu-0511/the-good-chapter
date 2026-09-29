import type { GarmentKind } from "./garments/shapes";
import { giftBounds, isGift, type Bounds, type GiftKind } from "./gifts/shapes";

/** Everything the range can render: sewn garments and hard-goods gifts. */
export type ProductKind = GarmentKind | GiftKind;

/** Reference height every model is scaled against (a garment, hood to hem). */
export const GARMENT_H = 2.62;

/** Garments are centred so their visual middle sits on y = 0. */
const GARMENT_BOUNDS: Bounds = { w: 2.8, h: GARMENT_H, bottom: -GARMENT_H / 2 };

export function modelBounds(kind: ProductKind): Bounds & { cy: number } {
  const b = isGift(kind) ? giftBounds[kind] : GARMENT_BOUNDS;
  return { ...b, cy: b.bottom + b.h / 2 };
}

export { isGift };
