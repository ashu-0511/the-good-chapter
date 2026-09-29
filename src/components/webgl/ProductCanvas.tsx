"use client";

import { View } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { disableWebGL, tierConfig, type Tier } from "@/lib/capabilities";
import { cn } from "@/lib/cn";

/**
 * One fixed, full-viewport canvas renders every product panel through drei
 * <View> scissoring — a single WebGL context for six live garments. It is
 * only visible (and only renders) while the product section is on screen.
 */
export default function ProductCanvas({ tier, active }: { tier: Exclude<Tier, "none">; active: boolean }) {
  return (
    <div aria-hidden className={cn("pointer-events-none fixed inset-0 z-20", active ? "visible" : "invisible")}>
      <Canvas
        dpr={tierConfig[tier].dpr}
        frameloop={active ? "always" : "never"}
        camera={{ fov: 26, position: [0, 0, 9], near: 0.1, far: 40 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ pointerEvents: "none" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.NeutralToneMapping;
          gl.setClearColor(0x000000, 0);
          gl.domElement.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
            disableWebGL();
          });
        }}
      >
        <View.Port />
      </Canvas>
    </div>
  );
}
