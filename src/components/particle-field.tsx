"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useRef, useMemo } from "react";

/**
 * PARTICLE FIELD — the neural wave behind everything.
 * 5000 nodes breathing in shock-pink/cyan, like RESONATE's soul.
 */

function ParticleWave({ color = "#00F0FF" }: { color?: string }) {
  const ref = useRef<THREE.Points>(null);
  const count = 5000;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = THREE.MathUtils.randFloatSpread(360);
      const phi = THREE.MathUtils.randFloatSpread(360);
      const r = Math.random() * 5 + 2;
      arr[i * 3] = r * Math.sin(theta) * Math.cos(phi);
      arr[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
      arr[i * 3 + 2] = r * Math.cos(theta);
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const time = state.clock.getElapsedTime();
    ref.current.rotation.y = time * 0.05;
    ref.current.rotation.x = time * 0.02;

    const pos = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const x = pos[i3], y = pos[i3 + 1], z = pos[i3 + 2];
      const dist = Math.sqrt(x * x + y * y + z * z);
      const wave = Math.sin(dist * 2 - time * 3) * 0.02;
      pos[i3] += x * wave;
      pos[i3 + 1] += y * wave;
      pos[i3 + 2] += z * wave;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={color}
        size={0.05}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

export function ParticleField({ className = "", color }: { className?: string; color?: string }) {
  return (
    <div className={`absolute inset-0 z-0 pointer-events-none ${className}`}>
      <Canvas camera={{ position: [0, 0, 12], fov: 45 }} dpr={[1, 1.75]}>
        <fog attach="fog" args={["#000000", 5, 20]} />
        <ParticleWave color={color} />
      </Canvas>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_82%)]" />
    </div>
  );
}
