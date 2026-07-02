import { useEffect, useRef } from 'react';
import { View } from 'react-native';

// Low-res offscreen buffer, scaled up with bilinear smoothing — the blur that
// gives the mist its softness comes from the upscale, not from blurring the
// noise field itself. Keeps the per-frame JS cost tiny.
const BUF_W = 96;
const BUF_H = 40;
// Mist tint, matches palette.mountainMist (#C9D7E0) in MistOverlay.native.tsx.
const MIST_R = 201;
const MIST_G = 215;
const MIST_B = 224;
// Recompute the noise field at ~12fps; the drift is slow enough (see
// u_time coefficients below) that this reads as smooth, and it keeps a
// software noise loop cheap on lower-end laptops/tablets.
const FRAME_INTERVAL_MS = 83;

function hash(x: number, y: number) {
  const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return v - Math.floor(v);
}

function noise(x: number, y: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(x: number, y: number) {
  let v = 0;
  let amp = 0.5;
  let px = x;
  let py = y;
  for (let i = 0; i < 4; i++) {
    v += amp * noise(px, py);
    px *= 2.1;
    py *= 2.1;
    amp *= 0.5;
  }
  return v;
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Web port of the native Skia fbm shader (MistOverlay.native.tsx) — same
 * noise field and density formula, evaluated in JS onto a low-res canvas
 * buffer instead of a GPU fragment shader, so web doesn't pay for Skia's
 * CanvasKit WASM just for this effect.
 */
export function MistOverlay({ height = 200 }: { height?: number }) {
  const containerRef = useRef<View>(null);

  useEffect(() => {
    // react-native-web forwards the ref to the underlying DOM node.
    const container = containerRef.current as unknown as HTMLElement | null;
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const buffer = document.createElement('canvas');
    buffer.width = BUF_W;
    buffer.height = BUF_H;
    const bctx = buffer.getContext('2d');
    if (!ctx || !bctx) return undefined;

    const imageData = bctx.createImageData(BUF_W, BUF_H);
    const start = performance.now();
    let rafId = 0;
    let lastFrame = 0;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width));
      canvas.height = Math.max(1, Math.round(rect.height));
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    const draw = (now: number) => {
      rafId = requestAnimationFrame(draw);
      if (now - lastFrame < FRAME_INTERVAL_MS) return;
      lastFrame = now;

      const t = ((now - start) / 1000) % 600;
      for (let py = 0; py < BUF_H; py++) {
        const uvY = py / BUF_H;
        for (let px = 0; px < BUF_W; px++) {
          const uvX = px / BUF_W;
          const near = fbm(uvX * 3.0 + t * 0.045, uvY * 2.2 + 7.0);
          const far = fbm(uvX * 5.0 - t * 0.025, uvY * 3.5 + 2.0);
          let density = smoothstep(0.38, 0.85, near * 0.65 + far * 0.35);
          density *= smoothstep(0.05, 0.75, uvY);
          const a = density * 0.4;
          const idx = (py * BUF_W + px) * 4;
          imageData.data[idx] = MIST_R;
          imageData.data[idx + 1] = MIST_G;
          imageData.data[idx + 2] = MIST_B;
          imageData.data[idx + 3] = Math.round(a * 255);
        }
      }
      bctx.putImageData(imageData, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(buffer, 0, 0, BUF_W, BUF_H, 0, 0, canvas.width, canvas.height);
    };
    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      container.removeChild(canvas);
    };
  }, [height]);

  return (
    <View ref={containerRef} pointerEvents="none" style={{ height, width: '100%' }} />
  );
}

export default MistOverlay;
