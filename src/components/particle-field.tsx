"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRef, useMemo, useState, useEffect, Component, type ReactNode } from "react";

/**
 * PARTICLE FIELD — the neural wave behind everything.
 * 5000 nodes breathing in cyan, additive-blended.
 *
 * Bulletproof by design: if WebGL is unavailable or blocked (sandboxed
 * iframes often do), it silently degrades to a Canvas2D star-wave — the
 * hero NEVER dies because of a graphics context.
 */

/* ---------- error boundary: a graphics failure must not kill the app ---------- */
class WebGLBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    /* the fallback is the message */
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/* ---------- WebGL capability probe ---------- */
function webglAvailable(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl") || c.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

/* ---------- the R3F wave ---------- */
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
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        transparent
        color={color}
        size={0.05}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ---------- Canvas2D fallback — pure 2D, runs everywhere ---------- */
function Canvas2DWave({ color = "#00F0FF" }: { color?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    const N = 220;
    const stars = Array.from({ length: N }, () => ({
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      z: Math.random() * 1.2 + 0.2,
      s: Math.random() * 1.4 + 0.4,
    }));

    const t0 = performance.now();
    const loop = () => {
      const t = (performance.now() - t0) / 1000;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (const st of stars) {
        const depth = 0.5 + 0.5 * Math.sin(t * 0.45 + st.z * 6);
        const px = (st.x * (0.82 + 0.1 * Math.sin(t * 0.4 + st.y * 4)) * 0.5 + 0.5) * w;
        const py = (st.y * (0.82 + 0.1 * Math.cos(t * 0.35 + st.x * 4)) * 0.5 + 0.5) * h;
        const r = st.s * dpr * (0.7 + depth * 1.5);
        const alpha = 0.12 + depth * 0.45;
        const grad = ctx.createRadialGradient(px, py, 0, px, py, r * 3);
        grad.addColorStop(0, color + Math.round(alpha * 255).toString(16).padStart(2, "0"));
        grad.addColorStop(1, color + "00");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, r * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [color]);

  return <canvas ref={canvasRef} className="w-full h-full block" aria-hidden="true" />;
}

export function ParticleField({ className = "", color }: { className?: string; color?: string }) {
  const [webgl, setWebgl] = useState(false);

  useEffect(() => {
    setWebgl(webglAvailable());
  }, []);

  return (
    <div className={`absolute inset-0 z-0 pointer-events-none ${className}`}>
      <WebGLBoundary fallback={<Canvas2DWave color={color} />}>
        {webgl ? (
          <Canvas camera={{ position: [0, 0, 12], fov: 45 }} dpr={[1, 1.75]}>
            <fog attach="fog" args={["#000000", 5, 20]} />
            <ParticleWave color={color} />
          </Canvas>
        ) : (
          <Canvas2DWave color={color} />
        )}
      </WebGLBoundary>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_82%)]" />
    </div>
  );
}
