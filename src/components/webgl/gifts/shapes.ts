/**
 * Gift objects.
 *
 * Measurements (scene units, y-up, centred on x = 0) shared by the 3D models
 * and the 2D fallback painter, so both always draw the same object. Sizes sit
 * in the same envelope as the garments (~2.6 units tall) so panels and the
 * hero can treat every product alike.
 */

export const GIFT_KINDS = ["bottle", "diary", "candle", "giftbox"] as const;
export type GiftKind = (typeof GIFT_KINDS)[number];

export const isGift = (kind: string): kind is GiftKind => (GIFT_KINDS as readonly string[]).includes(kind);

/** Insulated steel bottle: straight body, rounded shoulder, screw lid with carry loop. */
export const BOTTLE = {
  r: 0.4,
  bottom: -1.3,
  foot: 0.08, // radius of the rounded base edge; the printed wrap starts above it
  bodyTop: 0.62,
  neckR: 0.29,
  shoulderTop: 0.86,
  lidTop: 1.16,
  loopR: 0.16,
  loopTube: 0.035,
};

/** Hardbound diary with an elastic band and a ribbon marker. */
export const DIARY = { w: 1.62, h: 2.24, d: 0.3, board: 0.04, bandX: 0.54, ribbonX: 0.26, ribbonLen: 0.3 };

/** Glazed ceramic vessel candle with a wrap label. */
export const CANDLE = {
  r: 0.74,
  bottom: -1.0,
  top: 0.34,
  wall: 0.07,
  waxY: 0.2,
  labelY: -0.36,
  labelH: 0.66,
  wickH: 0.13,
  flameH: 0.22,
};

/** Rigid gift box with an overhanging lid, ribbon and bow. */
export const GIFTBOX = { w: 2.1, d: 1.5, bottom: -0.86, baseTop: 0.16, lidH: 0.32, lidOver: 0.035, ribbonW: 0.15, ribbonX: 0.56 };

export type Bounds = { w: number; h: number; bottom: number };

export const giftBounds: Record<GiftKind, Bounds> = {
  bottle: { w: BOTTLE.r * 2, h: BOTTLE.lidTop + BOTTLE.loopR + BOTTLE.loopTube - BOTTLE.bottom, bottom: BOTTLE.bottom },
  diary: { w: DIARY.w, h: DIARY.h, bottom: -DIARY.h / 2 },
  candle: { w: CANDLE.r * 2, h: CANDLE.waxY + CANDLE.wickH + CANDLE.flameH + 0.04 - CANDLE.bottom, bottom: CANDLE.bottom },
  giftbox: { w: GIFTBOX.w, h: 1.62, bottom: GIFTBOX.bottom },
};
