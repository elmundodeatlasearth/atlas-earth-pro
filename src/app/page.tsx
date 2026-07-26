"use client";
import { useState, useCallback } from "react";
import { useAtlasState } from "@/hooks/useAtlasState";
import Sidebar from "@/components/sidebar";
import DashboardTab from "@/components/dashboard-tab";
import SimuladorTab from "@/components/simulador-tab";
import AuditoriaTab from "@/components/auditoria-tab";
import IaTab from "@/components/ia-tab";
import HistorialTab from "@/components/historial-tab";
import TabTransition from "@/components/tab-transition";
import { exportHistorialCSV } from "@/utils/export-csv";

const tabs = [
  { id: "dashboard", label: "\ud83d\udcca Dashboard" },
  { id: "simulador", label: "\ud83e\uddee Simulador" },
  { id: "auditoria", label: "\ud83d\udccb Auditor\u00eda" },
  { id: "ia", label: "\ud83e\udd16 IA PRO" },
  { id: "historial", label: "\ud83d\udcc8 Historial" },
];

export default function Home() {
  const S = useAtlasState();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#080808]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ===== SIDEBAR ===== */}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>
        <Sidebar
          parcelasC={S.parcelasC} setParcelasC={S.setParcelasC}
          parcelasR={S.parcelasR} setParcelasR={S.setParcelasR}
          parcelasE={S.parcelasE} setParcelasE={S.setParcelasE}
          parcelasL={S.parcelasL} setParcelasL={S.setParcelasL}
          insignias={S.insignias} setInsignias={S.setInsignias}
          abAhorrados={S.abAhorrados} setAbAhorrados={S.setAbAhorrados}
          horasBoost={S.horasBoost} setHorasBoost={S.setHorasBoost}
          eficiencia={S.eficiencia} setEficiencia={S.setEficiencia}
          pais={S.pais} setPais={S.setPais}
          moneda={S.moneda} setMoneda={S.setMoneda}
          meta={S.meta} setMeta={S.setMeta}
          metaPeriodo={S.metaPeriodo} setMetaPeriodo={S.setMetaPeriodo}
          horasSrb={S.horasSrb} setHorasSrb={S.setHorasSrb}
          tipoPase={S.tipoPase} setTipoPase={S.setTipoPase}
          diaAsistencia={S.diaAsistencia} setDiaAsistencia={S.setDiaAsistencia}
          horaInicio={S.horaInicio} setHoraInicio={S.setHoraInicio}
          horaFin={S.horaFin} setHoraFin={S.setHoraFin}
          eficienciaAnuncios={S.eficienciaAnuncios} setEficienciaAnuncios={S.setEficienciaAnuncios}
          metaParcelas={S.metaParcelas} setMetaParcelas={S.setMetaParcelas}
          user={S.user}
          authEmail={S.authEmail} setAuthEmail={S.setAuthEmail}
          authPass={S.authPass} setAuthPass={S.setAuthPass}
          authLoading={S.authLoading} authMsg={S.authMsg}
          isPro={S.isPro} isUltra={S.isUltra} aiCredits={S.aiCredits}
          handleAuth={S.handleAuth} handleLogout={S.handleLogout}
          profileName={S.profileName} setProfileName={S.setProfileName}
          profileList={S.profileList} setProfileList={S.setProfileList} showSaveMsg={S.showSaveMsg}
          guardarPerfil={S.guardarPerfil} cargarPerfil={S.cargarPerfil}
          guardarPerfilNube={S.guardarPerfilNube}
          totalParcelas={S.motor.total_parcelas}
          multTier={S.multTier} pasaporte={S.pasaporte}
          siguiente_tramo={S.siguiente_tramo} faltantesTier={S.faltantesTier}
          faltantesMeta={S.faltantesMeta} tasa={S.tasa}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* ===== MAIN ===== */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Top Bar */}
        <div className="sticky top-0 z-10 bg-[#080808]/90 backdrop-blur-md border-b border-white/5 px-4 lg:px-8 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger */}
            <button onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-white p-1.5 -ml-1.5 rounded-lg hover:bg-white/10 transition-all"
              aria-label="Abrir menú lateral">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
            <h1 className="text-base lg:text-lg font-black text-white truncate">
              {S.isPro || S.isUltra ? "\ud83d\udcca Atlas Earth PRO" : "\ud83d\udcca Atlas Earth"}
            </h1>
          </div>
          {/* Tabs - scrollable en mobile */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none -mr-3 pr-3 lg:mr-0 lg:pr-0">
            {tabs.map(t => (
              <button key={t.id} onClick={() => S.setActiveTab(t.id)}
                className={`px-3 lg:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  S.activeTab === t.id
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm shadow-cyan-900/30"
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                }`}>
                {t.label}
              </button>
            ))}
            {/* Export CSV */}
            {S.historialData.length > 0 && (
              <button onClick={() => exportHistorialCSV(S.historialData)}
                className="ml-1 text-[10px] text-gray-500 hover:text-green-400 bg-white/5 hover:bg-green-900/20 px-2 py-1.5 rounded-lg transition-all whitespace-nowrap border border-white/10 hover:border-green-500/30 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                CSV
              </button>
            )}
          </div>
        </div>

        <div className="p-4 lg:p-10 space-y-6 lg:space-y-8">
          <TabTransition activeTab={S.activeTab}>
            {S.activeTab === "dashboard" && (
            <DashboardTab
              motor={S.motor} multTier={S.multTier} pais={S.pais}
              tasa={S.tasa} moneda={S.moneda}
              rentaDia={S.rentaDia} rentaSem={S.rentaSem} rentaMes={S.rentaMes} rentaAnio={S.rentaAnio}
              metaUsdDia={S.metaUsdDia} parcelasMeta={S.parcelasMeta} faltantesMeta={S.faltantesMeta}
              tramo_actual={S.tramo_actual} siguiente_tramo={S.siguiente_tramo} faltantesTier={S.faltantesTier}
              desgloseF2p={S.desgloseF2p} desgloseEc={S.desgloseEc}
              veredictoEstrategia={S.veredictoEstrategia}
              totalParcelas={S.motor.total_parcelas}
            />
          )}
          {S.activeTab === "simulador" && (
            <SimuladorTab
              abAhorrados={S.abAhorrados} simExtra={S.simExtra} setSimExtra={S.setSimExtra}
              simDia={S.simDia} simSem={S.simSem} simMes={S.simMes} simAnio={S.simAnio}
              tasa={S.tasa} moneda={S.moneda}
              rentaDia={S.rentaDia} rentaSem={S.rentaSem} rentaMes={S.rentaMes} rentaAnio={S.rentaAnio}
              motor={S.motor} pais={S.pais}
              nivelActualPasaporte={S.nivelActualPasaporte} nivelSiguientePasaporte={S.nivelSiguientePasaporte}
              insigniasFaltantes={S.insigniasFaltantes} costoAbPasaporte={S.costoAbPasaporte}
              parcelasEq={S.parcelasEq} aumentoParcelas={S.aumentoParcelas} aumentoPasaporte={S.aumentoPasaporte}
              optData={S.optData}
              roiGlobalDias={S.roiGlobalDias} roiMarginalDias={S.roiMarginalDias}
              rentaAdicional={S.rentaAdicional} costoMetaAb={S.costoMetaAb} costoTiendaUsd={S.costoTiendaUsd}
              metaRenta={S.metaRenta}
            />
          )}
          {S.activeTab === "auditoria" && (
            <AuditoriaTab
              motor={S.motor}
              parcelasC={S.parcelasC} parcelasR={S.parcelasR} parcelasE={S.parcelasE} parcelasL={S.parcelasL}
              pasaporte={S.pasaporte} abPorDia={S.abPorDia} tipoPase={S.tipoPase}
              metaUsdDia={S.metaUsdDia} parcelasMeta={S.parcelasMeta} faltantesMeta={S.faltantesMeta}
              costoMetaAb={S.costoMetaAb}
              tiempoFree={S.tiempoFree} diasFree={S.diasFree}
              tiempoEc={S.tiempoEc} diasEc2={S.diasEc2}
              tramo_actual={S.tramo_actual} siguiente_tramo={S.siguiente_tramo}
              faltantesTier={S.faltantesTier} faltanNetosAb={S.faltanNetosAb}
              porcentajeEsc={S.porcentajeEsc} colapso={S.colapso}
              nivelActualPasaporte={S.nivelActualPasaporte} nivelSiguientePasaporte={S.nivelSiguientePasaporte}
              insigniasFaltantes={S.insigniasFaltantes} costoAbPasaporte={S.costoAbPasaporte}
              aumentoPasaporte={S.aumentoPasaporte} parcelasEq={S.parcelasEq}
              aumentoParcelas={S.aumentoParcelas} veredictoEstrategia={S.veredictoEstrategia}
              metaRenta={S.metaRenta}
            />
          )}
          {S.activeTab === "ia" && (
            <IaTab
              user={S.user} isUltra={S.isUltra}
              aiCredits={S.aiCredits} aiLoading={S.aiLoading}
              aiAdvice={S.aiAdvice} aiError={S.aiError}
              totalParcelas={S.motor.total_parcelas} pasaporte={S.pasaporte}
              abPorDia={S.abPorDia} metaUsdDia={S.metaUsdDia}
              handleGenerateAI={S.handleGenerateAI}
            />
          )}
          {S.activeTab === "historial" && (
            <HistorialTab
              user={S.user} historialData={S.historialData}
              histFecha={S.histFecha} setHistFecha={S.setHistFecha}
              histAb={S.histAb} setHistAb={S.setHistAb}
              histUsd={S.histUsd} setHistUsd={S.setHistUsd}
              histDiam={S.histDiam} setHistDiam={S.setHistDiam}
              histMsg={S.histMsg} guardarHistorial={S.guardarHistorial}
            />
          )}
            </TabTransition>
        </div>
      </main>
    </div>
  );
}
