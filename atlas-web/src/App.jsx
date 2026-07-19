import { useState } from 'react'
import Dashboard from './Dashboard'
import { SimuladorAtlas, calcularNivelPasaporte, generarCalendarioAE } from './logic'

function App() {
  const [comun, setComun] = useState(150)
  const [rara, setRara] = useState(88)
  const [epica, setEpica] = useState(40)
  const [legendaria, setLegendaria] = useState(12)
  const [insignias, setInsignias] = useState(101)
  const [pais, setPais] = useState('Estados Unidos')
  const [moneda, setMoneda] = useState('USD')
  const [meta, setMeta] = useState(1.0)
  
  const totalParcelasActuales = comun + rara + epica + legendaria;
  const nivelPasaporte = calcularNivelPasaporte(insignias);
  const simulador = new SimuladorAtlas(comun, rara, epica, legendaria, 20, 32, pais, nivelPasaporte);
  
  const rentaDiariaUsd = simulador.calcular_renta_diaria(0);
  
  // Dummy props mapping to avoid crashing the dashboard.
  const props = {
    totalParcelasActuales,
    totalAbActuales: totalParcelasActuales * 100,
    totalAbObjetivo: 36500,
    faltanParcelasMeta: 75,
    parcelasObjetivo: 365,
    targetParcelas: 365,
    saltoTierMultx: "12x",
    faltanTier: 75,
    costoTierAb: 7500,
    costoRestanteMeta: 7500,
    parcComMeta: 37, parcRarMeta: 22, parcEpiMeta: 11, parcLegMeta: 3,
    costoTiendaMeta: "300.00", costoTiendaGlobal: "$300.00 USD", costoTiendaLocal: "",
    rentaObjetivoLocal: "", rentaObjetivo: "1.00", metaIngresoDiario: "1.00",
    progresoMetaPorcentaje: 90.0,
    roiGlobalAnios: "3 Años", roiMarginalAnios: "5 Años",
    roiMarginalBg: "bg-green-500/10", roiMarginalBorder: "border-green-500/20",
    roiMarginalText: "text-green-400", roiMarginalIcon: "verified",
    roiMarginalSubtext: "text-green-400/80", roiMarginalDesc: "¡Excelente inversión!",
    diasFreeMeta: 70.5, abDiarios: 80.5,
    tiempoEcMeta: "30 Días", diasEcMeta: 30.5, abEcDiarios: 212.5, ahorroEcDias: 40,
    fechaF2pMeta: "Dec 2026", fechaEcMeta: "Nov 2026",
    diasGenerar50: 50, abReinvDiarios: 100, diasReinvMeta: 75,
    tramoActual: 290, tramoSiguiente: 365,
    faltanParcelasEscalera: 75, porcentajeEscalera: 50.0,
    abManuales: 100, abEscaleraTotal: 7500, alcanzaParcelas: 1,
    parcelasAComprar: 1, faltanNetosAb: 7400, tiempoEscalera: "90 Días",
    alertaColapsoHtml: "",
    estrCajasComparativas: "", estrVeredicto: "ESTRATEGIA PERFECTA",
    pasNivelActual: "Nivel 5", pasNivelSiguiente: "MAX",
    pasFaltanInsignias: 0, pasImpactoDiario: "$0.00",
    accionTacticaHtml: "Guardar AB",
    rentaDiariaUsd: rentaDiariaUsd.toFixed(5),
    srbAlMes: 32, horasBoost: 20, eficienciaPorcentaje: 95, metaUsdDiaria: 1.0,
    parcComun: comun, parcRara: rara, parcEpica: epica, parcLegendaria: legendaria
  }

  return (
    <div className="flex">
       {/* Dummy Sidebar */}
       <div className="w-80 bg-neutral-900 p-4 border-r border-neutral-800">
          <h2 className="text-white font-bold mb-4">Sidebar Controls</h2>
          <label className="text-white">Parcelas ({totalParcelasActuales})</label>
       </div>
       <Dashboard {...props} />
    </div>
  )
}

export default App
