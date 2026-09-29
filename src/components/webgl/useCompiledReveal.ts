"use client";

import { useThree } from "@react-three/fiber";
import { useLayoutEffect, useState, type RefObject } from "react";
import type * as THREE from "three";

/** A layer no camera renders: models wait here while their shaders compile. */
const STAGING_LAYER = 31;

const setLayer = (obj: THREE.Object3D, layer: number) => obj.traverse((o) => o.layers.set(layer));

/**
 * Keeps an object out of frame until its shader programs are built, compiling
 * them through KHR_parallel_shader_compile (`compileAsync`) so the main thread
 * never blocks on a program link. Returns true once the object is showing.
 * Staged objects are also invisible to raycasts.
 */
export function useCompiledReveal(ref: RefObject<THREE.Object3D | null>) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const obj = ref.current;
    if (!obj) return;
    let alive = true;
    setLayer(obj, STAGING_LAYER);
    gl.compileAsync(obj, camera, scene)
      .catch(() => {})
      .then(() => {
        if (!alive) return;
        setLayer(obj, 0);
        setReady(true);
      });
    return () => {
      alive = false;
      setLayer(obj, 0);
    };
  }, [gl, scene, camera, ref]);

  return ready;
}
