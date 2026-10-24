// src/components/timer-boost.tsx
// Temporizador interactivo para Anuncios de 20 min y Boost de 6 horas
"use client";
import React, { useState, useEffect, useRef } from "react";
import { GlowCard } from "./stat-card";

export default function BoostAndAdTimer() {
  // Timer Anuncio 20 min (1200 seg)
  const [adSeconds, setAdSeconds] = useState<number>(1200);
  const [adRunning, setAdRunning] = useState<boolean>(false);

  // Timer Boost 6h (21600 seg)
  const [boostSeconds, setBoostSeconds] = useState<number>(21600);
  const [boostRunning, setBoostRunning] = useState<boolean>(false);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Reproducir sonido de notificación suave usando Web Audio API
  const playAlertSound = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // Ignorar si el navegador bloquea audio sin interacción
    }
  };

  // Intervalo Anuncios
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (adRunning && adSeconds > 0) {
      interval = setInterval(() => setAdSeconds((prev) => prev - 1), 1000);
    } else if (adSeconds === 0 && adRunning) {
      playAlertSound();
      setAdRunning(false);
    }
    return () => clearInterval(interval);
  }, [adRunning, adSeconds]); // eslint-disable-line react-hooks/exhaustive-deps

  // Intervalo Boost
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (boostRunning && boostSeconds > 0) {
      interval = setInterval(() => setBoostSeconds((prev) => prev - 1), 1000);
    } else if (boostSeconds === 0 && boostRunning) {
      playAlertSound();
      setBoostRunning(false);
    }
    return () => clearInterval(interval);
  }, [boostRunning, boostSeconds]); // eslint-disable-line react-hooks/exhaustive-deps

  // Formato mm:ss
  const formatTime = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) {
      return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
    }
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="p-3 bg-[#0a0f18] rounded-xl border border-cyan-900/30">
      <div className="flex items-center justify-between mb-2.5">
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <span>⏱️</span> Temporizadores Activos
        </div>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
            soundEnabled
              ? "text-cyan-400 border-cyan-500/30 bg-cyan-500/10"
              : "text-gray-500 border-white/5"
          }`}
        >
          {soundEnabled ? "🔊 Sonido ON" : "🔇 Silencio"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Timer Anuncio 20 Min */}
        <div className="p-2.5 bg-black/40 rounded-lg border border-white/5 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-gray-400 flex items-center gap-1">
              <span>📺</span> Anuncio 2 AB (20 min)
            </div>
            <div className={`text-base font-bold font-mono ${adSeconds === 0 ? "text-emerald-400 animate-pulse" : "text-white"}`}>
              {adSeconds === 0 ? "¡Listo para ver!" : formatTime(adSeconds)}
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => {
                if (adSeconds === 0) setAdSeconds(1200);
                setAdRunning(!adRunning);
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                adRunning
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30"
              }`}
            >
              {adRunning ? "Pausa" : "Iniciar"}
            </button>
            <button
              onClick={() => {
                setAdRunning(false);
                setAdSeconds(1200);
              }}
              title="Reiniciar a 20:00"
              className="px-1.5 py-1 text-gray-500 hover:text-white text-xs"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Timer Boost 6 Horas */}
        <div className="p-2.5 bg-black/40 rounded-lg border border-white/5 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-gray-400 flex items-center gap-1">
              <span>⚡</span> Boost Renta (Tope 6h)
            </div>
            <div className={`text-base font-bold font-mono ${boostSeconds === 0 ? "text-red-400 animate-pulse" : "text-white"}`}>
              {boostSeconds === 0 ? "¡Boost agotado!" : formatTime(boostSeconds)}
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => {
                if (boostSeconds === 0) setBoostSeconds(21600);
                setBoostRunning(!boostRunning);
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                boostRunning
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30"
              }`}
            >
              {boostRunning ? "Pausa" : "Iniciar"}
            </button>
            <button
              onClick={() => {
                setBoostRunning(false);
                setBoostSeconds(21600);
              }}
              title="Reiniciar a 6h"
              className="px-1.5 py-1 text-gray-500 hover:text-white text-xs"
            >
              🔄
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
