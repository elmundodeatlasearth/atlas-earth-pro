"use client";
import { useAtlasState } from "@/hooks/useAtlasState";
import Sidebar from "@/components/sidebar";
import DashboardTab from "@/components/dashboard-tab";
import SimuladorTab from "@/components/simulador-tab";
import AuditoriaTab from "@/components/auditoria-tab";
import IaTab from "@/components/ia-tab";
import HistorialTab from "@/components/historial-tab";

// ===== COMPONENTE PRINCIPAL =====
export default function Home() {
  const S = useAtlasState();

  const tabs = [
    { id: "dashboard", label: "📊 Dashboard" },
    { id: "simulador", label: "🧮 Simulador" },
    { id: "auditoria", label: "📋 Auditoría" },
    { id: "ia", label: "🤖 IA PRO" },
    { id: "historial", label: "📈 Historial" },
  ];

  return (
    <div className="min-h-screen flex bg-[#080808]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ===== SIDEBAR ===== */}
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
      />

      {/* ===== MAIN ===== */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <div className="sticky top-0 z-10 bg-[#080808]/90 backdrop-blur-md border-b border-white/5 px-8 py-3 flex items-center justify-between">
          <h1 className="text-lg font-black text-white">
            {S.isPro || S.isUltra ? "📊 Atlas Earth PRO" : "📊 Atlas Earth"}
          </h1>
          <div className="flex gap-1">
            {tabs.map(t => (
              <button key={t.id} onClick={() => S.setActiveTab(t.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  S.activeTab === t.id
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm shadow-cyan-900/30"
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-8 space-y-8 animate-fade-in">
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
              abAhorrados={S.abAhorrados}
              simExtra={S.simExtra} setSimExtra={S.setSimExtra}
              simDia={S.simDia} simSem={S.simSem} simMes={S.simMes} simAnio={S.simAnio}
              tasa={S.tasa} moneda={S.moneda}
              rentaDia={S.rentaDia} rentaSem={S.rentaSem} rentaMes={S.rentaMes} rentaAnio={S.rentaAnio}
              motor={S.motor} pais={S.pais}
              nivelActualPasaporte={S.nivelActualPasaporte} nivelSiguientePasaporte={S.nivelSiguientePasaporte}
              insigniasFaltantes={S.insigniasFaltantes} costoAbPasaporte={S.costoAbPasaporte}
              parcelasEq={S.parcelasEq} aumentoParcelas={S.aumentoParcelas} aumentoPasaporte={S.aumentoPasaporte}
              optData={S.optData}
              roiGlobalDias={S.roiGlobalDias} roiMarginalDias={S.roiMarginalDias}
              rentaAdicional={S.rentaAdicional} costoMetaAb={S.costoMetaAb}
              costoTiendaUsd={S.costoTiendaUsd} metaRenta={S.metaRenta}
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
              user={S.user} isUltra={S.isUltra} aiCredits={S.aiCredits}
              aiLoading={S.aiLoading} aiAdvice={S.aiAdvice} aiError={S.aiError}
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
        </div>
      </main>
    </div>
  );
}
