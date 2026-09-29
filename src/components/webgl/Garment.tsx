"use client";

import { useEffect, useMemo, type Ref } from "react";
import * as THREE from "three";
import type { ThreeElements } from "@react-three/fiber";
import { buildGarmentMesh } from "./garments/buildGeometry";
import { getShadowTexture, makeFabricMaterial, makeSurface } from "./garments/material";
import { fullColors, luminance, shade, type GarmentColors } from "./garments/painter";
import type { GarmentKind } from "./garments/shapes";

type Props = ThreeElements["group"] & {
  kind: GarmentKind;
  colors: GarmentColors;
  envMap: THREE.Texture | null;
  detail?: number;
  texSize?: number;
  ref?: Ref<THREE.Group>;
};

const stringCache = new Map<string, THREE.TubeGeometry[]>();

/** Hoodie drawstrings seated on the inflated surface. */
function useDrawstrings(kind: GarmentKind, detail: number) {
  return useMemo(() => {
    if (kind !== "hoodie") return null;
    const key = `${kind}:${detail}`;
    let geos = stringCache.get(key);
    if (!geos) {
      const { heightAt } = buildGarmentMesh(kind, detail);
      geos = [-1, 1].map((s) => {
        const pts = [
          [0.09, 0.8],
          [0.1, 0.62],
          [0.115, 0.42],
          [0.105, 0.2],
        ].map(([x, y], i) => new THREE.Vector3(x * s, y, heightAt(x * s, y) + 0.012 + i * 0.006));
        return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.011, 8, false);
      });
      stringCache.set(key, geos);
    }
    return geos;
  }, [kind, detail]);
}

export function Garment({ kind, colors, envMap, detail = 1, texSize = 1024, ref, ...group }: Props) {
  const { geometry } = useMemo(() => buildGarmentMesh(kind, detail), [kind, detail]);
  const colorKey = `${colors.body}|${colors.trim}|${colors.accent}`;
  const material = useMemo(
    () => makeFabricMaterial(kind, colors, { size: texSize, envMap }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kind, colorKey, texSize, envMap],
  );
  useEffect(() => () => material.dispose(), [material]);

  const strings = useDrawstrings(kind, detail);
  const c = fullColors(colors);
  const cordColor = luminance(c.body) < 0.1 ? "#e9e3d6" : shade(c.body, -0.35);
  // same shared program as the fabric (see makeSurface)
  const trims = useMemo(
    () =>
      strings && {
        cord: makeSurface({ color: cordColor, roughness: 0.75, envMap, envMapIntensity: 0.6 }),
        aglet: makeSurface({ color: c.accent, roughness: 0.35, metalness: 0.2, envMap }),
      },
    [strings, cordColor, c.accent, envMap],
  );
  useEffect(() => () => void (trims && (trims.cord.dispose(), trims.aglet.dispose())), [trims]);

  return (
    <group ref={ref} {...group}>
      <mesh geometry={geometry} material={material} />
      {strings?.map((g, i) => (
        <group key={i}>
          <mesh geometry={g} material={trims!.cord} />
          <mesh position={[(i ? 1 : -1) * 0.105, 0.17, g.parameters.path.getPoint(1).z]} material={trims!.aglet}>
            <cylinderGeometry args={[0.016, 0.014, 0.075, 12]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Soft contact shadow on an invisible floor below a floating garment. */
export function BlobShadow({ opacity = 0.5, ...props }: ThreeElements["mesh"] & { opacity?: number }) {
  const map = useMemo(() => getShadowTexture(), []);
  return (
    <mesh rotation-x={-Math.PI / 2} renderOrder={-1} {...props}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={map} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
