// src/components/HoneycombBackground.tsx
// Fondo de panal interactivo con iluminación aleatoria — estilo premium
"use client";

import { useEffect, useRef } from "react";

interface HexCell {
  cx: number;
  cy: number;
  size: number;
  glow: number;
  targetGlow: number;
  phase: number;
  hue: number;      // base hue for this cell
}

export default function HoneycombBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cells: HexCell[] = [];
    let animId = 0;
    let mouseX = -1000;
    let mouseY = -1000;

    const HEX_SIZE = 30;
    const ROW_H = HEX_SIZE * 1.8;
    const COL_W = HEX_SIZE * 1.6;
    const BASE_OPACITY = 0.12;
    const GLOW_SPEED = 0.02;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight + 400; // extra for scroll
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.scale(dpr, dpr);
      canvas!.style.width = w + "px";
      canvas!.style.height = h + "px";
      rebuildGrid();
    }

    function rebuildGrid() {
      const w = window.innerWidth;
      const h = window.innerHeight + 400;
      const cols = Math.ceil(w / COL_W) + 3;
      const rows = Math.ceil(h / ROW_H) + 3;
      cells = [];

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const offsetX = row % 2 === 0 ? 0 : COL_W / 2;
          const cx = col * COL_W + offsetX;
          const cy = row * ROW_H;
          // Distribute hues: cyan dominant, some blue, some teal
          const hue = 170 + Math.random() * 60; // 170-230: teal → cyan → blue
          cells.push({
            cx,
            cy,
            size: HEX_SIZE + Math.random() * 4 - 2, // slight size variation
            glow: Math.random() * 0.2,
            targetGlow: 0,
            phase: Math.random() * Math.PI * 2,
            hue,
          });
        }
      }
    }

    function drawHexPath(x: number, y: number, size: number) {
      ctx!.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const px = x + size * Math.cos(angle);
        const py = y + size * Math.sin(angle);
        if (i === 0) ctx!.moveTo(px, py);
        else ctx!.lineTo(px, py);
      }
      ctx!.closePath();
    }

    function drawGlowHex(c: HexCell, intensity: number) {
      const { cx, cy, size, hue } = c;
      const alpha = Math.min(intensity, 1);

      // Outer glow (blur)
      drawHexPath(cx, cy, size * 1.1);
      ctx!.strokeStyle = `hsla(${hue + intensity * 30}, 100%, 60%, ${alpha * 0.15})`;
      ctx!.lineWidth = 4;
      ctx!.shadowColor = `hsla(${hue}, 100%, 60%, ${alpha * 0.5})`;
      ctx!.shadowBlur = alpha * 20;
      ctx!.stroke();
      ctx!.shadowBlur = 0;

      // Inner glow fill
      drawHexPath(cx, cy, size * 0.85);
      const grad = ctx!.createRadialGradient(cx, cy, 0, cx, cy, size);
      grad.addColorStop(0, `hsla(${hue + intensity * 20}, 100%, 70%, ${alpha * 0.25})`);
      grad.addColorStop(0.6, `hsla(${hue + intensity * 10}, 80%, 40%, ${alpha * 0.1})`);
      grad.addColorStop(1, `hsla(${hue}, 60%, 20%, 0)`);
      ctx!.fillStyle = grad;
      ctx!.fill();

      // Bright border
      drawHexPath(cx, cy, size);
      ctx!.strokeStyle = `hsla(${hue + intensity * 20}, 100%, 75%, ${alpha * 0.7})`;
      ctx!.lineWidth = 1.5;
      ctx!.stroke();
    }

    function animate() {
      const w = window.innerWidth;
      const h = window.innerHeight;

      // Semi-transparent clear for subtle trail effect
      ctx!.clearRect(0, 0, w, h + 400);

      // --- Process cells in batches for performance ---
      for (let i = 0; i < cells.length; i++) {
        const c = cells[i];
        const dx = mouseX - c.cx;
        const dy = mouseY - c.cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const mouseInfluence = Math.max(0, 1 - dist / 250);

        // Random glow triggers — more near mouse
        const glowChance = 0.003 + mouseInfluence * 0.02;
        if (Math.random() < glowChance) {
          c.targetGlow = 0.4 + Math.random() * 0.6 + mouseInfluence * 0.4;
        }
        // Random fade
        if (Math.random() < 0.002) {
          c.targetGlow = 0;
        }

        // Smooth interpolation
        c.glow += (c.targetGlow - c.glow) * GLOW_SPEED;
        if (c.glow < 0.005) c.glow = 0;

        // Natural micro-pulse
        const pulse = 0.04 * Math.sin(Date.now() * 0.0008 + c.phase);
        const effectiveGlow = Math.max(0, c.glow + pulse);

        // Check bounds
        const cx = c.cx;
        const cy = c.cy;
        const s = c.size;
        const isVisible = cx > -s && cx < w + s && cy > -s && cy < h + s;

        if (!isVisible) continue;

        // Draw glow (if active)
        if (effectiveGlow > 0.08) {
          drawGlowHex(c, effectiveGlow);
        }

        // Draw base hex outline (always)
        // Subtle variation based on position
        const baseAlpha = BASE_OPACITY + effectiveGlow * 0.1;
        drawHexPath(cx, cy, s);
        ctx!.strokeStyle = `hsla(${c.hue}, 80%, 50%, ${baseAlpha})`;
        ctx!.lineWidth = 0.8;
        ctx!.stroke();
      }

      animId = requestAnimationFrame(animate);
    }

    function onMouseMove(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);

    resize();
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.7 }}
    />
  );
}
