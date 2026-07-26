// src/hooks/useAtlasInputs.ts
// Hook con todo el estado de entrada (inputs del usuario)
"use client";
import { useState } from "react";

export interface AtlasInputs {
  parcelasC: number; setParcelasC: (v: number) => void;
  parcelasR: number; setParcelasR: (v: number) => void;
  parcelasE: number; setParcelasE: (v: number) => void;
  parcelasL: number; setParcelasL: (v: number) => void;
  insignias: number; setInsignias: (v: number) => void;
  abAhorrados: number; setAbAhorrados: (v: number) => void;
  horasBoost: number; setHorasBoost: (v: number) => void;
  eficiencia: number; setEficiencia: (v: number) => void;
  pais: string; setPais: (v: string) => void;
  moneda: string; setMoneda: (v: string) => void;
  meta: number; setMeta: (v: number) => void;
  metaPeriodo: "day" | "month" | "year"; setMetaPeriodo: (v: "day" | "month" | "year") => void;
  horasSrb: number; setHorasSrb: (v: number) => void;
  simExtra: number; setSimExtra: (v: number) => void;
  tipoPase: string; setTipoPase: (v: string) => void;
  diaAsistencia: number; setDiaAsistencia: (v: number) => void;
  horaInicio: string; setHoraInicio: (v: string) => void;
  horaFin: string; setHoraFin: (v: string) => void;
  eficienciaAnuncios: number; setEficienciaAnuncios: (v: number) => void;
  metaParcelas: number; setMetaParcelas: (v: number) => void;
  activeTab: string; setActiveTab: (v: string) => void;
}

export function useAtlasInputs(): AtlasInputs {
  const [parcelasC, setParcelasC] = useState(150);
  const [parcelasR, setParcelasR] = useState(0);
  const [parcelasE, setParcelasE] = useState(0);
  const [parcelasL, setParcelasL] = useState(0);
  const [insignias, setInsignias] = useState(0);
  const [abAhorrados, setAbAhorrados] = useState(500);
  const [horasBoost, setHorasBoost] = useState(18);
  const [eficiencia, setEficiencia] = useState(95);
  const [pais, setPais] = useState("Estados Unidos");
  const [moneda, setMoneda] = useState("USD");
  const [meta, setMeta] = useState(1.0);
  const [metaPeriodo, setMetaPeriodo] = useState<"day" | "month" | "year">("day");
  const [horasSrb, setHorasSrb] = useState(32);
  const [simExtra, setSimExtra] = useState(0);
  const [tipoPase, setTipoPase] = useState<string>("Ninguno (F2P)");
  const [diaAsistencia, setDiaAsistencia] = useState(1);
  const [horaInicio, setHoraInicio] = useState("08:00");
  const [horaFin, setHoraFin] = useState("22:00");
  const [eficienciaAnuncios, setEficienciaAnuncios] = useState(90);
  const [metaParcelas, setMetaParcelas] = useState(150);
  const [activeTab, setActiveTab] = useState("dashboard");

  return {
    parcelasC, setParcelasC, parcelasR, setParcelasR,
    parcelasE, setParcelasE, parcelasL, setParcelasL,
    insignias, setInsignias, abAhorrados, setAbAhorrados,
    horasBoost, setHorasBoost, eficiencia, setEficiencia,
    pais, setPais, moneda, setMoneda,
    meta, setMeta, metaPeriodo, setMetaPeriodo,
    horasSrb, setHorasSrb, simExtra, setSimExtra,
    tipoPase, setTipoPase, diaAsistencia, setDiaAsistencia,
    horaInicio, setHoraInicio, horaFin, setHoraFin,
    eficienciaAnuncios, setEficienciaAnuncios,
    metaParcelas, setMetaParcelas, activeTab, setActiveTab,
  };
}
