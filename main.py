import streamlit as st
import streamlit.components.v1 as components
import base64
import os
import logica as l
import importlib
import datetime
import pandas as pd
import io
importlib.reload(l)

# 1. Gestión de Perfiles (Carga Inicial)
pm = l.PerfilManager()

if "perfil_activo" not in st.session_state:
    st.session_state.perfil_activo = pm.listar_perfiles()[0]

perfil_guardado = pm.cargar_perfil(st.session_state.perfil_activo) or {}

st.set_page_config(layout="wide", page_title="Atlas Earth: Tablero Maestro PRO", initial_sidebar_state="expanded")

def obtener_base64(ruta_archivo):
    if os.path.exists(ruta_archivo):
        with open(ruta_archivo, "rb") as archivo:
            return base64.b64encode(archivo.read()).decode()
    return ""

# --- HACK: VIDEO DE FONDO ---
fondo_html = f"""
    <style>
        .stApp, [data-testid="stAppViewContainer"], [data-testid="stSidebar"], [data-testid="stSidebarContent"], [data-testid="stHeader"] {{
            background: transparent !important; background-color: transparent !important;
        }}
        #video-fondo-absoluto {{
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; object-fit: cover; z-index: -999; opacity: 0.40;
        }}
        .block-container {{ padding: 0rem !important; max-width: 100% !important; }}
        iframe {{ border: none !important; width: 100% !important; background: transparent !important; }}
        #MainMenu, footer {{ visibility: hidden; }}
        .stSlider, .stSelectbox, .stNumberInput, label, p, h1, h2, h3, .stCheckbox {{ color: #e2e2e2 !important; text-shadow: 1px 1px 3px rgba(0,0,0,0.8); }}
        input {{ background-color: rgba(31, 31, 31, 0.6) !important; color: #ffffff !important; border: 1px solid rgba(0, 221, 221, 0.3) !important; }}
        div[data-baseweb="select"] > div {{ background-color: rgba(31, 31, 31, 0.6) !important; color: white !important; }}
    </style>
    <video id="video-fondo-absoluto" autoplay loop muted playsinline>
        <source src="Fondo%20Bucle.mp4" type="video/mp4">
    </video>
"""
st.markdown(fondo_html, unsafe_allow_html=True)

# --- 1. CONFIGURACIÓN DE PAÍSES Y TIERS ---
# Base de Datos Completa de Países de Atlas Earth
TIERS = {
    "Estados Unidos": {
        "limites": [150, 220, 290, 365, 435, 545, 730, 1095, 1500],
        "multiplicadores": [30, 20, 15, 12, 10, 8, 6, 4, 3, 2]
    },
    "Canadá": {
        "limites": [60, 110, 160, 210, 280, 400, 600, 900, 1200],
        "multiplicadores": [20, 15, 12, 10, 8, 6, 4, 3, 2, 2]
    },
    "Reino Unido": {
        "limites": [60, 110, 160, 210, 280, 400, 600, 900, 1200],
        "multiplicadores": [20, 15, 12, 10, 8, 6, 4, 3, 2, 2]
    },
    "Australia": {
        "limites": [60, 110, 160, 210, 280, 400, 600, 900, 1200],
        "multiplicadores": [20, 15, 12, 10, 8, 6, 4, 3, 2, 2]
    },
    "Nueva Zelanda": {
        "limites": [60, 110, 160, 210, 280, 400, 600, 900, 1200],
        "multiplicadores": [20, 15, 12, 10, 8, 6, 4, 3, 2, 2]
    },
    "Sudáfrica": {
        "limites": [60, 110, 160, 210, 280, 400, 600, 900, 1200],
        "multiplicadores": [20, 15, 12, 10, 8, 6, 4, 3, 2, 2]
    },
    "Irlanda": {
        "limites": [60, 110, 160, 210, 280, 400, 600, 900, 1200],
        "multiplicadores": [20, 15, 12, 10, 8, 6, 4, 3, 2, 2]
    },
    "México": {
        "limites": [60, 110, 160, 210, 280, 400, 600, 900, 1200],
        "multiplicadores": [20, 15, 12, 10, 8, 6, 4, 3, 2, 2]
    },
    "Internacional (Resto del Mundo)": {
        "limites": [30, 55, 80, 105, 140, 200, 300, 450, 650, 900, 1500],
        "multiplicadores": [20, 15, 12, 10, 8, 6, 4, 3, 2, 2, 2]
    }
}

paises_disponibles = list(TIERS.keys())

# --- NUEVO: GESTOR MULTI-CUENTA ---
st.sidebar.subheader("👥 Gestor de Cuentas")
perfiles_disp = pm.listar_perfiles()
idx_perfil = perfiles_disp.index(st.session_state.perfil_activo) if st.session_state.perfil_activo in perfiles_disp else 0

nuevo_perfil_seleccionado = st.sidebar.selectbox("Cuenta Activa", perfiles_disp, index=idx_perfil)
if nuevo_perfil_seleccionado != st.session_state.perfil_activo:
    st.session_state.perfil_activo = nuevo_perfil_seleccionado
    st.rerun()

with st.sidebar.expander("➕ Crear Nueva Cuenta"):
    nuevo_nombre = st.text_input("Nombre", placeholder="Ej: Secundaria")
    if st.button("Crear"):
        if nuevo_nombre:
            pm.guardar_perfil(nuevo_nombre, {})
            st.session_state.perfil_activo = nuevo_nombre
            st.rerun()

st.sidebar.markdown("---")

# --- NUEVO: SISTEMA DE PAGOS (STRIPE PAYWALL) ---
if "is_pro" not in st.session_state:
    st.session_state.is_pro = False

# Leer la URL para ver si Stripe nos mandó el código de éxito
params = st.query_params
if params.get("pro_unlocked") == "true":
    st.session_state.is_pro = True

st.sidebar.subheader("💎 Estado de Cuenta")
if st.session_state.is_pro:
    st.sidebar.success("✅ Cuenta PRO Activada")
else:
    st.sidebar.warning("🔒 Cuenta Básica (Free)")
    # Link de pago de Stripe (Reemplazar por el tuyo real de $4.99)
    stripe_link = "https://buy.stripe.com/test_XXXXXXXXX" 
    st.sidebar.markdown(f"<a href='{stripe_link}' target='_blank' style='display:block; text-align:center; background:#ffc107; color:black; padding:10px; border-radius:5px; font-weight:bold; text-decoration:none;'>⭐ Desbloquear PRO ($4.99)</a>", unsafe_allow_html=True)

st.sidebar.markdown("---")

# --- 2. PANEL DE CONTROL PRO ---
if st.session_state.is_pro:
    st.sidebar.title("🛠️ Centro de Mando Maestro")
    opciones_pais = paises_disponibles
    max_pasaporte = 5
    bloqueado = False
else:
    st.sidebar.title("⚙️ Consola Básica (Free)")
    opciones_pais = ["Estados Unidos"]
    max_pasaporte = 1
    bloqueado = True

pais = st.sidebar.selectbox("País de Residencia", opciones_pais, index=opciones_pais.index(perfil_guardado.get("pais", "Estados Unidos")) if perfil_guardado.get("pais", "Estados Unidos") in opciones_pais else 0)

MAP_MONEDAS = {
    "Estados Unidos": "USD", "Canadá": "CAD", "Reino Unido": "GBP", 
    "Australia": "AUD", "Nueva Zelanda": "NZD", "Sudáfrica": "ZAR", 
    "Irlanda": "EUR", "México": "MXN", "Internacional (Resto del Mundo)": "USD"
}
moneda_por_defecto = MAP_MONEDAS.get(pais, "USD")
if perfil_guardado.get("pais") != pais: 
    moneda_index = ["USD", "MXN", "CAD", "GBP", "AUD", "NZD", "ZAR", "EUR", "BRL"].index(moneda_por_defecto)
else:
    try:
        moneda_index = ["USD", "MXN", "CAD", "GBP", "AUD", "NZD", "ZAR", "EUR", "BRL"].index(perfil_guardado.get("moneda", moneda_por_defecto))
    except:
        moneda_index = 0

moneda = st.sidebar.selectbox("Moneda Local", ["USD", "MXN", "CAD", "GBP", "AUD", "NZD", "ZAR", "EUR", "BRL"], index=moneda_index)

st.sidebar.subheader("🚀 Boost y Eficiencia")
horas_boost = st.sidebar.slider("Horas de Boost al día", 0, 24, perfil_guardado.get("horas_boost", 18))
eficiencia = st.sidebar.slider("Eficiencia Real (%)", 70, 100, perfil_guardado.get("eficiencia", 95))
horas_srb_mes = st.sidebar.slider("Horas SRB (50x) al mes", 0, 100, perfil_guardado.get("horas_srb_mes", 32), help="Atlas Earth lanza eventos 50x (normalmente 32-64 hrs/mes)")

st.sidebar.subheader("🏞️ Inventario")
c_comun = st.sidebar.number_input("🟢 Comunes", value=perfil_guardado.get("c_comun", 134))
c_rara = st.sidebar.number_input("🔵 Raras", value=perfil_guardado.get("c_rara", 104))
c_epica = st.sidebar.number_input("🟣 Épicas", value=perfil_guardado.get("c_epica", 35))
c_legendaria = st.sidebar.number_input("🟡 Legendarias", value=perfil_guardado.get("c_legendaria", 17))
insignias = st.sidebar.number_input("🛂 Insignias (Badges)", min_value=0, value=perfil_guardado.get("insignias", 11), disabled=bloqueado)

# Procesamiento automático de pasaporte
nivel_pasaporte_crudo = l.calcular_nivel_pasaporte(insignias)
nivel_pasaporte = min(nivel_pasaporte_crudo, max_pasaporte)

if not modo_pro:
    st.sidebar.info("🔒 Sube a PRO para desbloquear todas las regiones y hasta el Nivel 5 de Pasaporte.")
st.sidebar.subheader("⏰ Contabilidad Viva")
dia_asistencia = st.sidebar.slider("Día de Asistencia (1-90)", 1, 90, perfil_guardado.get("dia_asistencia", 1))
ab_manuales = st.sidebar.number_input("Atlas Bucks (Actuales)", value=perfil_guardado.get("ab_manuales", 500))
hora_inicio = st.sidebar.time_input("Hora de inicio (Anuncios)", value=datetime.time(8, 0))
hora_fin = st.sidebar.time_input("Hora de fin (Anuncios)", value=datetime.time(22, 0))
eficiencia_anuncios = st.sidebar.slider("Eficiencia Anuncios (%)", 10, 100, perfil_guardado.get("eficiencia_anuncios", 90), help="Qué tan constante eres viendo anuncios en tu periodo activo")
escalera_recompensas = st.sidebar.checkbox("🏆 Completo la Escalera de Recompensas (Arcade)", value=perfil_guardado.get("escalera_recompensas", False), help="Suma +294 AB al mes (Gratis) o +1324 AB (Con Pase).")

st.sidebar.subheader("🎯 Definir Metas (Progreso)")
meta_dolar = st.sidebar.number_input("Meta de Renta (USD)", value=perfil_guardado.get("meta_dolar", 1.00), step=0.01)
meta_periodo = st.sidebar.selectbox("Periodo de Meta de Renta", ["Al Día", "Al Mes", "Al Año"], index=["Al Día", "Al Mes", "Al Año"].index(perfil_guardado.get("meta_periodo", "Al Día")))
meta_parcelas = st.sidebar.number_input("Meta de Parcelas (Opcional)", min_value=0, value=perfil_guardado.get("meta_parcelas", 150), step=1, help="Meta para cuentas nuevas: calcula tiempo/costo para llegar a X parcelas.")

if st.sidebar.button("💾 Guardar Perfil", use_container_width=True):
    perfil_nuevo = {
        "pais": pais, "moneda": moneda,
        "horas_boost": horas_boost, "eficiencia": eficiencia, "horas_srb_mes": horas_srb_mes,
        "c_comun": c_comun, "c_rara": c_rara, "c_epica": c_epica, "c_legendaria": c_legendaria,
        "insignias": insignias, "ab_manuales": ab_manuales, "eficiencia_anuncios": eficiencia_anuncios,
        "escalera_recompensas": escalera_recompensas,
        "meta_dolar": meta_dolar, "meta_periodo": meta_periodo, "meta_parcelas": meta_parcelas, "dia_asistencia": dia_asistencia,
        "modo_pro": modo_pro
    }
    pm.guardar_perfil(st.session_state.perfil_activo, perfil_nuevo)
    st.sidebar.success(f"¡Perfil '{st.session_state.perfil_activo}' Guardado Exitosamente!")
    
if perfil_guardado:
    reporte_df = pd.DataFrame([perfil_guardado])
    csv = reporte_df.to_csv(index=False).encode('utf-8')
    st.sidebar.download_button(
        label="📄 Exportar Reporte (CSV)",
        data=csv,
        file_name='estrategia_atlasearth.csv',
        mime='text/csv',
        use_container_width=True
    )
    
st.sidebar.markdown("---")
with st.sidebar.expander("📖 Glosario y Tips Financieros"):
    st.markdown("""
    **Diccionario para Nuevos Jugadores:**
    - **AB (Atlas Bucks):** La moneda del juego. Se usa para comprar parcelas e insignias.
    - **SRB (Super Rent Boost):** Eventos especiales de Atlas Earth donde tu multiplicador sube a **50x**, sin importar cuántas parcelas tengas. ¡Son la clave de tus ganancias!
    - **ROI Global:** Tiempo que tardarías en recuperar el dinero gastado usando TODAS tus ganancias diarias.
    - **ROI Marginal:** Tiempo que tardarías en recuperar el dinero usando SOLO las ganancias de las parcelas/pasaportes nuevos. Si es mayor a 1 año, ¡No compres con dinero real!
    - **F2P (Free To Play):** Jugar sin meter dinero real, viendo anuncios y recolectando diamantes.
    - **Explorer Club:** Suscripción premium mensual. Matemáticamente, es la única compra en la tienda que vale la pena.
    """)

# --- 3. LÓGICA MATEMÁTICA CON MOTOR ---
total_parcelas = c_comun + c_rara + c_epica + c_legendaria
if total_parcelas == 0: total_parcelas = 1

def get_mult(total, pais_sel):
    tabla = TIERS[pais_sel]
    for i, limite in enumerate(tabla["limites"]):
        if total <= limite: return tabla["multiplicadores"][i]
    return tabla["multiplicadores"][-1]

mult_tier = get_mult(total_parcelas, pais)

# Usando la nueva clase importada l.MotorAtlasEarth
motor = l.MotorAtlasEarth(c_comun, c_rara, c_epica, c_legendaria, nivel_pasaporte, horas_boost, eficiencia)
renta_diaria_usd = motor.calcular_renta(mult_tier, horas_srb_mes)

# Tasa de cambio real de yfinance o fallbacks
tasa = l.obtener_tasa_cambio(moneda)
renta_local_dia = renta_diaria_usd * tasa
if moneda != 'USD':
    st.sidebar.info(f"💱 **Conversión en Vivo:** 1 USD = {tasa:.4f} {moneda}")

# Cálculo automático de AB por anuncios
inicio_min = hora_inicio.hour * 60 + hora_inicio.minute
fin_min = hora_fin.hour * 60 + hora_fin.minute
if fin_min < inicio_min:
    fin_min += 24 * 60 # cross midnight
minutos_totales = fin_min - inicio_min
max_anuncios = minutos_totales / 20
ab_por_dia = max_anuncios * 2 * (eficiencia_anuncios / 100)
ab_totales_proyectados = ab_manuales + int(ab_por_dia)

# Convertir meta a base diaria para el cálculo del motor
meta_usd_dia = meta_dolar
if meta_periodo == "Al Mes": meta_usd_dia = meta_dolar / 30.0
elif meta_periodo == "Al Año": meta_usd_dia = meta_dolar / 365.0

# --- CÁLCULOS DE PROYECCIONES ---
# 1. META CALCULADA
meta_parc, meta_renta = motor.calcular_meta_automatica(meta_usd_dia, pais, TIERS, horas_srb_mes)
faltan_meta = max(0, meta_parc - total_parcelas)
costo_meta_ab = max(0, (faltan_meta * 100) - ab_manuales)
parc_com_meta = int(faltan_meta * 0.50)
parc_rar_meta = int(faltan_meta * 0.30)
parc_epi_meta = int(faltan_meta * 0.15)
parc_leg_meta = faltan_meta - (parc_com_meta + parc_rar_meta + parc_epi_meta)
costo_tienda_usd = (costo_meta_ab / 2400) * 99.99

tiempo_free = motor.formato_tiempo(costo_meta_ab, ab_por_dia)
ab_ec_diarios = ab_por_dia + 91  # Explorer Club averages 91 extra AB/day
tiempo_ec = motor.formato_tiempo(costo_meta_ab, ab_ec_diarios)

dias_free = costo_meta_ab / ab_por_dia if ab_por_dia > 0 else 0
dias_ec = costo_meta_ab / ab_ec_diarios if ab_ec_diarios > 0 else 0
ahorro_ec = dias_free - dias_ec

# 2. ESCALERA
tramo_actual, siguiente_tramo, faltan_escalera = motor.calcular_escalera(pais, TIERS)
balance_alcanza = ab_manuales // 100
parcelas_comprar = max(0, faltan_escalera - balance_alcanza)
faltan_netos_ab = max(0, (faltan_escalera * 100) - ab_manuales)
porcentaje_esc = min(100, (ab_manuales / (faltan_escalera * 100)) * 100) if faltan_escalera > 0 else 100
tiempo_esc = motor.formato_tiempo(faltan_netos_ab, ab_por_dia)

# 3. EXPLORER CLUB (Movido más abajo)
# Visualización rápida en Streamlit (Al estilo de tu Consolidado Final)
st.title("📊 Tablero de Estrategia PRO")

col1, col2, col3 = st.columns(3)
col1.metric("Activos", f"{total_parcelas} Parcela(s)")
col2.metric("Renta Diaria (USD)", f"${renta_diaria_usd:.6f} USD")
if moneda != "USD":
    col2.caption(f"≈ **${renta_local_dia:.2f} {moneda}**")
col3.metric("Meta ($1 USD)", f"{(1.0/renta_diaria_usd):.1f} días" if renta_diaria_usd > 0 else "Infinito")

st.subheader("💡 Asistente de Estrategia Inteligente")
tier_limit_1 = TIERS[pais]["limites"][0] if pais in TIERS else 150
if total_parcelas < tier_limit_1 - 5:
    st.success(f"ESTRATEGIA: Estás en zona de crecimiento rápido. Compra parcelas hasta acercarte a {tier_limit_1} (Límite máximo del primer Tier en {pais}).")
elif total_parcelas >= tier_limit_1 - 5 and total_parcelas <= tier_limit_1:
    st.warning(f"⚠️ ATENCIÓN: Estás a punto de cruzar el límite de {tier_limit_1} parcelas en {pais}. ¡Frena tus compras! Ahorra suficientes AB para saltar de golpe al siguiente Tier sin perder ingresos.")
else:
    st.info(f"ESTRATEGIA: Has superado el Tier base de {pais}. Calcula tus saltos de parcelas cuidadosamente y empieza a comprar insignias para tu pasaporte.")

st.info("Sistema configurado al 100% - Los cálculos de Boost y Pasaporte son automáticos.")

st.subheader("🧮 Calculadora Inversa (Simular Portafolio)")
portafolio_test = st.number_input("Si yo tuviera esta cantidad de parcelas:", value=total_parcelas, step=50, help="Calcula ingresos basados en la rareza promedio oficial del juego (50% Comunes, 30% Raras, etc).")
if portafolio_test > 0:
    c_t = int(portafolio_test * 0.50)
    r_t = int(portafolio_test * 0.30)
    e_t = int(portafolio_test * 0.15)
    l_t = portafolio_test - c_t - r_t - e_t
    motor_test = l.MotorAtlasEarth(c_t, r_t, e_t, l_t, nivel_pasaporte, horas_boost, eficiencia)
    mult_test = motor_test._get_tier_mult(portafolio_test, pais, TIERS)
    renta_test_usd = motor_test.calcular_renta(mult_test, horas_srb_mes)
    
    colS1, colS2, colS3 = st.columns(3)
    
    colS1.metric("Ingreso Diario (USD)", f"${renta_test_usd:.4f} USD")
    if moneda != 'USD':
        colS1.markdown(f"<div style='color: #00dddd; font-size: 13px; font-weight: 700; margin-top: -15px;'>≈ ${renta_test_usd * tasa:.2f} {moneda}</div>", unsafe_allow_html=True)
        
    colS2.metric("Mensual Estimado (USD)", f"${renta_test_usd * 30:.2f} USD")
    if moneda != 'USD':
        colS2.markdown(f"<div style='color: #00dddd; font-size: 13px; font-weight: 700; margin-top: -15px;'>≈ ${renta_test_usd * 30 * tasa:.2f} {moneda}</div>", unsafe_allow_html=True)
        
    colS3.metric("Anual Estimado (USD)", f"${renta_test_usd * 365:.2f} USD")
    if moneda != 'USD':
        colS3.markdown(f"<div style='color: #00dddd; font-size: 13px; font-weight: 700; margin-top: -15px;'>≈ ${renta_test_usd * 365 * tasa:.2f} {moneda}</div>", unsafe_allow_html=True)

# --- NUEVO: SIMULADOR AVANZADO ---
st.subheader("🤖 Simulador Avanzado a 30 Días (F2P vs Explorer Club)")
ab_escalera_f2p = 294 if escalera_recompensas else 0
ab_escalera_ec = 1324 if escalera_recompensas else 0 # 294 + 1030

sim = l.SimuladorDiario(dia_asistencia, max_anuncios)
desglose_f2p = sim.simular_mes_desglosado(modo_ec=False, ab_minijuegos_mes=ab_escalera_f2p)
desglose_ec = sim.simular_mes_desglosado(modo_ec=True, ab_minijuegos_mes=ab_escalera_ec)

colA, colB = st.columns(2)
colA.metric("AB Proyectados (Modo Gratis)", f"+{desglose_f2p['total_mes']:.0f} AB / mes", help=f"Ruleta: {desglose_f2p['ruleta_diaria']}/día | Anuncios: {desglose_f2p['anuncios_diarios']}/día | Escalera: {ab_escalera_f2p}")
colA.caption(f"🌱 **Generas un promedio de {desglose_f2p['promedio_diario']:.1f} AB al día.**")

colB.metric("AB Proyectados (Explorer Club)", f"+{desglose_ec['total_mes']:.0f} AB / mes", help=f"Ruleta: {desglose_ec['ruleta_diaria']}/día | Anuncios: {desglose_ec['anuncios_diarios']}/día | Escalera: {ab_escalera_ec}")
colB.caption(f"🔥 **Generas un promedio de {desglose_ec['promedio_diario']:.1f} AB al día.**")

if escalera_recompensas:
    st.info("🏆 **Modo Arcade Activo:** Estás sumando tu Escalera de Recompensas al flujo mensual de AB, lo que acelerará drásticamente tu tiempo meta.")

opt_data = l.optimizador_explorer_club(dia_asistencia)
st.info(f"""🧠 **Inteligencia de Inversión (Masterclass):** 
Matemáticamente, el **Día {opt_data['optimo']['dia_inicio']}** es el momento absoluto más rentable para comprar tu Pase Explorer de 30 días.
- 📆 **Si compras Hoy (Día {dia_asistencia})**: Tu ventana atrapará recompensas estándar, generando una rentabilidad subóptima.
- 🏆 **Si compras el Día {opt_data['optimo']['dia_inicio']}**: Tu ventana de 30 días atrapará estratégicamente los bonos del Día 90, Día 7 y Día 14. ¡Exprimirás **{opt_data['optimo']['ab_pase']:,} AB** totales por tus mismos $50 USD! Es la recomendación definitiva.""")

st.subheader("📋 Análisis de Salto (Tier Jump Analyzer) y Tablas de Comparación")
def generar_tabla_tiers(pais_key, parcelas_actuales):
    limites = TIERS[pais_key]["limites"].copy()
    mults = TIERS[pais_key]["multiplicadores"].copy()
    if len(mults) > len(limites): limites.append(f"{limites[-1]+1}+")
    df = pd.DataFrame({"Parcelas Límite": limites, "Multiplicador": [f"{m}x" for m in mults]})
    
    idx_resaltar = 0
    for i, lim in enumerate(TIERS[pais_key]["limites"]):
        if parcelas_actuales <= lim:
            idx_resaltar = i
            break
    else:
        idx_resaltar = len(TIERS[pais_key]["limites"])
        
    def highlight_row(row):
        return ['background-color: rgba(0, 221, 221, 0.25); color: #00fbfb;' if row.name == idx_resaltar else '' for _ in row]

    return df.style.apply(highlight_row, axis=1)
if siguiente_tramo > total_parcelas and siguiente_tramo <= TIERS[pais]["limites"][-1]:
    renta_actual_usd = motor.calcular_renta_generica(total_parcelas, pais, TIERS, horas_srb_mes)
    renta_siguiente_usd = motor.calcular_renta_generica(siguiente_tramo, pais, TIERS, horas_srb_mes)
    diff_usd = renta_siguiente_usd - renta_actual_usd
    
    mult_actual = motor._get_tier_mult(total_parcelas, pais, TIERS)
    mult_siguiente = motor._get_tier_mult(siguiente_tramo, pais, TIERS)
    
    colA, colB, colC = st.columns(3)
    
    with colA:
        moneda_txt = f"\n\n≈ **${renta_actual_usd * tasa:.2f} {moneda}**" if moneda != 'USD' else ""
        st.info(f"**📍 Estado Actual**\n\n**Parcelas:** {total_parcelas}\n\n**Multiplicador:** {mult_actual}x\n\n**Renta:** ${renta_actual_usd:.4f} USD/día{moneda_txt}")
        
    with colB:
        moneda_txt_sig = f"\n\n≈ **${renta_siguiente_usd * tasa:.2f} {moneda}**" if moneda != 'USD' else ""
        st.warning(f"**🎯 Próximo Límite Recomendado**\n\n**Parcelas:** {siguiente_tramo}\n\n**Multiplicador Caerá a:** {mult_siguiente}x\n\n**Nueva Renta:** ${renta_siguiente_usd:.4f} USD/día{moneda_txt_sig}")
        
    with colC:
        moneda_txt_diff = f"\n\n≈ **+${diff_usd * tasa:.2f} {moneda}**" if moneda != 'USD' else ""
        st.success(f"**📈 Proyección de Ganancia**\n\nAl completar el ahorro y comprar estas parcelas de golpe, tu renta neta subirá:\n\n### +${diff_usd:.4f} USD/día\n{moneda_txt_diff}")
else:
    st.info("Estás en el Tier máximo. Cada parcela que compres sumará a tu renta directamente al multiplicador base.")

colT1, colT2 = st.columns(2)
with colT1:
    st.markdown("**🇺🇸 Escalera de Estados Unidos**")
    st.dataframe(generar_tabla_tiers("Estados Unidos", total_parcelas), use_container_width=True)
with colT2:
    pais_b = st.selectbox("País a Comparar", paises_disponibles, index=paises_disponibles.index(pais))
    st.dataframe(generar_tabla_tiers(pais_b, total_parcelas), use_container_width=True)

st.subheader("📥 Exportar Reporte")
if st.button("Generar Reporte Excel"):
    df_export = pd.DataFrame({
        "Métrica": ["Comunes", "Raras", "Épicas", "Legendarias", "Insignias", "Renta Diaria (USD)", f"Renta Diaria ({moneda})"],
        "Valor": [c_comun, c_rara, c_epica, c_legendaria, insignias, round(renta_diaria_usd, 6), round(renta_local_dia, 2)]
    })
    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
        df_export.to_excel(writer, index=False, sheet_name="Reporte_AE")
    
    st.download_button(
        label="⬇️ Descargar Reporte.xlsx",
        data=buffer.getvalue(),
        file_name="Reporte_Atlas_Earth.xlsx",
        mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

# --- 4. INYECCIÓN EN DASHBOARD HTML (La versión mejorada holográfica) ---
try:
    with open("dashboard.html", "r", encoding="utf-8") as f:
        html = f.read()
    
    logo_b64 = obtener_base64("Logo Oficial.jpeg")
    if logo_b64: html = html.replace('src="Logo Oficial.jpeg"', f'src="data:image/jpeg;base64,{logo_b64}"')

    html = html.replace('$12.45', f'${renta_diaria_usd * 30:.2f} USD')
    html = html.replace('150x', f'{mult_tier}x')
    
    # Inyección de Paywall en el HTML
    html = html.replace('IS_PRO_LOCKED', 'false' if st.session_state.is_pro else 'true')
    
    # Título dinámico
    titulo_html = "Tablero de Estrategia PRO" if st.session_state.is_pro else "Tablero de Estrategia BÁSICA (Free)"
    html = html.replace('TITULO_TABLERO_ESTRATEGIA', titulo_html)
    
    # Bono Pasaporte dinámico
    pasaporte_bonus = 1 + (nivel_pasaporte * 0.05)
    html = html.replace('BONO_PASAPORTE_PORCENTAJE', f'{(pasaporte_bonus - 1) * 100:.0f}%')
    html = html.replace('BADGES_COLECCIONADOS', f'{insignias}')
    
    html = html.replace('AB PROYECTADOS: 500', f'AB PROYECTADOS: {ab_totales_proyectados}')
    
    html = html.replace('>150<', f'>{total_parcelas}<')
    html = html.replace('75 (50%)', f'{c_comun} ({(c_comun/total_parcelas)*100:.1f}%)')
    html = html.replace('45 (30%)', f'{c_rara} ({(c_rara/total_parcelas)*100:.1f}%)')
    html = html.replace('22 (15%)', f'{c_epica} ({(c_epica/total_parcelas)*100:.1f}%)')
    html = html.replace('8 (5%)', f'{c_legendaria} ({(c_legendaria/total_parcelas)*100:.1f}%)')
    html = html.replace('$12.45', f'${(renta_diaria_usd * 30):.2f}')
    html = html.replace('$0.415', f'${renta_diaria_usd:.4f}')

    import json
    html = html.replace('TASAS_INYECCION_JS', json.dumps(l.obtener_tasas_divisas()))
    html = html.replace('VALOR_RAW_DIA', f'{renta_diaria_usd:.6f}')
    html = html.replace('VALOR_RAW_SEM', f'{(renta_diaria_usd * 7):.6f}')
    html = html.replace('VALOR_RAW_MEN', f'{(renta_diaria_usd * 30):.6f}')
    html = html.replace('VALOR_RAW_ANU', f'{(renta_diaria_usd * 365):.6f}')
    html = html.replace('MONEDA_INYECCION_JS', moneda)
    
    html = html.replace('$VAL_SEM_USD', f'${(renta_diaria_usd * 7):.4f}')
    html = html.replace('$VAL_MEN_USD', f'${(renta_diaria_usd * 30):.2f}')
    html = html.replace('$VAL_ANU_USD', f'${(renta_diaria_usd * 365):.2f}')

    # --- INYECCIÓN PROYECCIONES ---
    progreso_meta_porcentaje = min(100, (renta_diaria_usd / meta_usd_dia) * 100) if meta_usd_dia > 0 else 100
    html = html.replace('PROGRESO_META_PORCENTAJE', f'{progreso_meta_porcentaje:.1f}')
    
    html = html.replace('META_USD_DIARIA', f'{meta_usd_dia:.2f}')
    html = html.replace('TOTAL_PARCELAS_ACTUALES', f'{total_parcelas}')
    html = html.replace('TOTAL_AB_ACTUALES', f'{(total_parcelas * 100):,}')
    html = html.replace('TOTAL_AB_OBJETIVO', f'{(meta_parc * 100):,}')
    html = html.replace('FALTAN_PARCELAS_META', f'{faltan_meta}')
    html = html.replace('PARCELAS_OBJETIVO', f'{meta_parc}')
    html = html.replace('TARGET_PARCELAS', f'{meta_parc}')
    
    # Meta de Parcelas Directa (Cuentas nuevas)
    if meta_parcelas > total_parcelas:
        faltan_meta_p = meta_parcelas - total_parcelas
        ab_necesarios_p = (faltan_meta_p * 100) - ab_manuales
        if ab_necesarios_p < 0: ab_necesarios_p = 0
        dias_meta_p = int(ab_necesarios_p / max(1, desglose_f2p['promedio_diario'])) if not st.session_state.is_pro else int(ab_necesarios_p / max(1, desglose_ec['promedio_diario']))
        html = html.replace('META_PARCELAS_UI', f"Tu objetivo secundario: Llegar a {meta_parcelas} parcelas. Faltan {faltan_meta_p} parcelas ({ab_necesarios_p:,} AB). Tardarás aprox {dias_meta_p} días.")
    else:
        html = html.replace('META_PARCELAS_UI', f"¡Felicidades! Ya superaste tu meta de {meta_parcelas} parcelas.")
    
    # Inyecciones de Tier
    html = html.replace('SALTO_TIER_MULTx', f'{mult_tier}x')
    html = html.replace('FALTAN_TIER', f'{parcelas_comprar}')
    html = html.replace('COSTO_TIER_AB', f'{faltan_netos_ab:,}')
    
    tasa = l.obtener_tasa_cambio(moneda)
    renta_local_texto = f'≈ ${(meta_renta * tasa):.2f} {moneda}' if moneda != 'USD' else ''
    html = html.replace('RENTA_OBJETIVO_LOCAL', renta_local_texto)
    html = html.replace('RENTA_OBJETIVO', f'{meta_renta:.6f}')
    html = html.replace('META_INGRESO_DIARIO', f'{meta_renta:.6f}')
    
    html = html.replace('COSTO_RESTANTE_META', f'{costo_meta_ab:,}')
    html = html.replace('PARC_COM_META', f'{parc_com_meta}')
    html = html.replace('PARC_RAR_META', f'{parc_rar_meta}')
    html = html.replace('PARC_EPI_META', f'{int(faltan_meta * 0.15)}')
    html = html.replace('PARC_LEG_META', f'{int(faltan_meta * 0.05)}')
    
    html = html.replace('AB_META_COSTO', f'{costo_meta_ab:,}')
    
    costo_tienda = (costo_meta_ab / 2400) * 99.99
    html = html.replace('COSTO_TIENDA_META', f'{costo_tienda:,.2f}')
    html = html.replace('COSTO_TIENDA_GLOBAL', f'${costo_tienda:,.2f} USD')
    costo_local_texto = f'≈ ${(costo_tienda * tasa):,.2f} {moneda}' if moneda != 'USD' else ''
    html = html.replace('COSTO_TIENDA_LOCAL', costo_local_texto)
    
    # --- CÁLCULO PRECISO DE ROI ---
    boost_tier_meta = motor._get_tier_mult(meta_parc, pais, TIERS)
    horas_mes = 720
    horas_normales_mes = horas_mes - horas_srb_mes
    porcentaje_boost = horas_boost / 24.0
    horas_con_boost = horas_normales_mes * porcentaje_boost * (eficiencia / 100)
    horas_sin_boost = horas_normales_mes - horas_con_boost
    
    base_rent_nueva = motor.renta_base + (faltan_meta * motor.renta_promedio_sec)
    ingreso_srb = base_rent_nueva * 3600 * horas_srb_mes * 50
    ingreso_boost = base_rent_nueva * 3600 * horas_con_boost * boost_tier_meta
    ingreso_sin_boost = base_rent_nueva * 3600 * horas_sin_boost * 1
    meta_renta_precisa = ((ingreso_srb + ingreso_boost + ingreso_sin_boost) * motor.pasaporte_mult) / 30.0
    
    renta_adicional = meta_renta_precisa - renta_diaria_usd
    
    if meta_renta_precisa > 0 and costo_tienda > 0:
        roi_global_dias = (costo_tienda / meta_renta_precisa)
        html = html.replace('ROI_GLOBAL_ANIOS', f'{motor.formato_tiempo_exacto(roi_global_dias)}')
    else:
        html = html.replace('ROI_GLOBAL_ANIOS', 'N/A')
        
    if renta_adicional > 0 and costo_tienda > 0:
        roi_marginal_dias = (costo_tienda / renta_adicional)
        html = html.replace('ROI_MARGINAL_ANIOS', f'{motor.formato_tiempo_exacto(roi_marginal_dias)}')
        
        # Lógica visual y explicativa
        if roi_marginal_dias <= 365:
            bg, border, text, icon = "bg-green-500/10", "border-green-500/20", "text-green-400", "verified"
            subtext = "text-green-400/80"
            desc = f"¡Excelente inversión! Recuperarás tu dinero en menos de 1 año usando SOLO los <strong>+${renta_adicional:.2f} USD/día</strong> extra que ganarás."
        elif roi_marginal_dias <= (365 * 3):
            bg, border, text, icon = "bg-orange-500/10", "border-orange-500/20", "text-orange-400", "troubleshoot"
            subtext = "text-orange-400/80"
            desc = f"Tardarás un tiempo razonable en recuperar tu dinero usando SOLO los <strong>+${renta_adicional:.2f} USD/día</strong> extra de este salto."
        else:
            bg, border, text, icon = "bg-red-900/40", "border-red-500/40", "text-red-400", "warning"
            subtext = "text-red-300/80"
            desc = f"¡CUIDADO! Tardarías demasiado en recuperar tu dinero usando SOLO los <strong>+${renta_adicional:.2f} USD/día</strong> extra. <strong>¡Mala inversión real!</strong>"
            
    elif renta_adicional <= 0 and costo_tienda > 0:
        html = html.replace('ROI_MARGINAL_ANIOS', 'Nunca (Pérdida)')
        bg, border, text, icon = "bg-red-900/50", "border-red-500/60", "text-red-500", "error"
        subtext = "text-red-300/90"
        desc = "¡NO LO HAGAS! Este salto hará que tu renta caiga, por lo que nunca recuperarás el dinero gastado."
    else:
        html = html.replace('ROI_MARGINAL_ANIOS', 'N/A')
        bg, border, text, icon = "bg-gray-800/50", "border-white/10", "text-gray-400", "help"
        subtext = "text-gray-500"
        desc = "No aplicable para este escenario."

    html = html.replace('ROI_MARGINAL_BG', bg)
    html = html.replace('ROI_MARGINAL_BORDER', border)
    html = html.replace('ROI_MARGINAL_TEXT', text)
    html = html.replace('ROI_MARGINAL_ICON', icon)
    html = html.replace('ROI_MARGINAL_SUBTEXT', subtext)
    html = html.replace('ROI_MARGINAL_DESC', desc)
    
    dias_f2p = costo_meta_ab / ab_por_dia if ab_por_dia > 0 else 0
    html = html.replace('DIAS_FREE_META', f'{dias_f2p:,.1f}')
    html = html.replace('AB_DIARIOS', f'{ab_por_dia:.1f}')
    
    html = html.replace('TIEMPO_EC_META', f'{motor.formato_tiempo(costo_meta_ab, desglose_ec["promedio_diario"])}')
    html = html.replace('DIAS_EC_META', f'{dias_ec:,.1f}')
    html = html.replace('AB_EC_DIARIOS', f'{desglose_ec["promedio_diario"]:.1f}')
    html = html.replace('AHORRO_EC_DIAS', f'{(dias_f2p - dias_ec):,.1f}')
    
    # Fechas Calendario F2P y EC
    hoy = datetime.date.today()
    if dias_f2p < 9999:
        fecha_f2p = hoy + datetime.timedelta(days=int(dias_f2p))
        html = html.replace('FECHA_F2P_META', fecha_f2p.strftime("%d de %b, %Y"))
    else:
        html = html.replace('FECHA_F2P_META', 'Nunca')
        
    if dias_ec < 9999:
        fecha_ec = hoy + datetime.timedelta(days=int(dias_ec))
        html = html.replace('FECHA_EC_META', fecha_ec.strftime("%d de %b, %Y"))
    else:
        html = html.replace('FECHA_EC_META', 'Nunca')
        
    # --- CÁLCULO REINVIRTIENDO GANANCIAS ---
    # Tiempo para generar $50 USD
    if renta_diaria_usd > 0:
        dias_generar_50 = 50.0 / renta_diaria_usd
        html = html.replace('DIAS_GENERAR_50', f'{dias_generar_50:,.1f}')
        
        # Calcular velocidad promedio: (dias_generar_50 * ab_f2p + 30 * ab_ec) / (dias_generar_50 + 30)
        ciclo_total_dias = dias_generar_50 + 30
        ab_ciclo_total = (dias_generar_50 * ab_por_dia) + (30 * desglose_ec["promedio_diario"])
        velocidad_reinv = ab_ciclo_total / ciclo_total_dias
        
        html = html.replace('AB_REINV_DIARIOS', f'{velocidad_reinv:.1f}')
        
        dias_reinv = motor.dias_para_meta(faltan_meta * 100, velocidad_reinv)
        html = html.replace('DIAS_REINV_META', f'{dias_reinv:,.1f}')
    else:
        html = html.replace('DIAS_GENERAR_50', 'Infinito')
        html = html.replace('AB_REINV_DIARIOS', f'{ab_por_dia:.1f}')
        html = html.replace('DIAS_REINV_META', 'Nunca')
    
    html = html.replace('TRAMO_ACTUAL', f'{tramo_actual}')
    html = html.replace('TRAMO_SIGUIENTE', f'{siguiente_tramo}')
    html = html.replace('FALTAN_PARCELAS_ESCALERA', f'{faltan_escalera}')
    html = html.replace('PORCENTAJE_ESCALERA', f'{porcentaje_esc:.1f}')
    html = html.replace('AB_MANUALES', f'{ab_manuales:,}')
    html = html.replace('AB_ESCALERA_TOTAL', f'{faltan_escalera * 100:,}')
    html = html.replace('ALCANZA_PARCELAS', f'{balance_alcanza}')
    html = html.replace('PARCELAS_A_COMPRAR', f'{parcelas_comprar}')
    html = html.replace('FALTAN_NETOS_AB', f'{faltan_netos_ab:,}')
    html = html.replace('TIEMPO_ESCALERA', f'{tiempo_esc}')
    
    colapso = True if (total_parcelas + balance_alcanza > tramo_actual) and (faltan_netos_ab > 0) else False
    if colapso:
        alerta_html = f"""<div class="mt-4 p-3 bg-red-900/40 border border-red-500 text-red-400 rounded-lg text-xs font-bold text-center">
            ⚠️ RIESGO DE COLAPSO: Si compras parcelas ahora, tu multiplicador caerá a {motor._get_tier_mult(tramo_actual+1, pais, TIERS)}x perdiendo ingresos. ¡NO LO HAGAS! Ahorra hasta tener los {faltan_escalera * 100:,} AB.
        </div>"""
    else:
        alerta_html = ""
    html = html.replace('ALERTA_COLAPSO_HTML', alerta_html)
    
    # --- FASE 11: INTELIGENCIA ESTRATÉGICA ACCIONABLE ---
    nivel_actual_pasaporte = l.calcular_nivel_pasaporte(insignias)
    niveles_insignias = [0, 1, 11, 31, 61, 101]
    
    costo_ab_pasaporte = 0
    aumento_pasaporte = 0
    aumento_parcelas = 0
    insignias_faltantes = 0
    
    if nivel_actual_pasaporte < 5:
        siguiente_nivel = nivel_actual_pasaporte + 1
        insignias_necesarias = niveles_insignias[siguiente_nivel]
        insignias_faltantes = insignias_necesarias - insignias
        costo_ab_pasaporte = insignias_faltantes * 200
        
        # 1. Ganancia por Pasaporte
        renta_diaria_bruta = renta_diaria_usd / motor.pasaporte_mult
        aumento_pasaporte = renta_diaria_bruta * 0.05
        
        # 2. Ganancia por Parcelas
        parcelas_eq = insignias_faltantes * 2
        tier_parcelas = motor._get_tier_mult(total_parcelas + parcelas_eq, pais, TIERS)
        base_rent_parcelas = motor.renta_base + (parcelas_eq * motor.renta_promedio_sec)
        
        ingr_srb = base_rent_parcelas * 3600 * horas_srb_mes * 50
        ingr_boost = base_rent_parcelas * 3600 * horas_con_boost * tier_parcelas
        ingr_sin_boost = base_rent_parcelas * 3600 * horas_sin_boost * 1
        
        renta_futura_parcelas = ((ingr_srb + ingr_boost + ingr_sin_boost) * motor.pasaporte_mult) / 30.0
        aumento_parcelas = renta_futura_parcelas - renta_diaria_usd
        
        # Veredicto
        if colapso:
            veredicto = f"ESTRATEGIA PERFECTA: Estás en el límite exacto de un Tier ({total_parcelas} parcelas). Comprar parcelas individuales ahora hará que tu multiplicador caiga a {motor._get_tier_mult(total_parcelas+1, pais, TIERS)}x perdiendo ganancias. Por lo tanto, <span class='text-green-400 font-bold'>comprar el Nivel {siguiente_nivel} de Pasaporte</span> es tu única opción segura de inversión inmediata."
        elif aumento_pasaporte > aumento_parcelas:
            veredicto = f"ESTRATEGIA PERFECTA: <span class='text-green-400 font-bold'>Comprar el Nivel {siguiente_nivel} de Pasaporte</span> es matemáticamente superior a comprar {parcelas_eq} parcelas sueltas."
        else:
            veredicto = f"ESTRATEGIA PERFECTA: <span class='text-gold font-bold'>Comprar {parcelas_eq} Parcelas</span> te dará mejor rentabilidad que el Pasaporte por ahora. Sigue comprando parcelas libremente hasta llegar al límite de {siguiente_tramo}."
            
        cajas_comparativas = f"""
        <div class="bg-neutral-900/50 p-3 rounded text-center border border-white/5">
            <div class="text-[10px] text-gray-400 mb-1">Si gastas {costo_ab_pasaporte:,} AB en:</div>
            <div class="text-sm font-bold text-cyan mb-1 flex items-center justify-center gap-1"><span class="material-symbols-outlined text-[14px]">public</span> PASAPORTES</div>
            <div class="text-xs text-green-400 font-bold">+ ${aumento_pasaporte:.5f}/día</div>
        </div>
        <div class="bg-neutral-900/50 p-3 rounded text-center border border-white/5">
            <div class="text-[10px] text-gray-400 mb-1">Si gastas {costo_ab_pasaporte:,} AB en:</div>
            <div class="text-sm font-bold text-green-500 mb-1 flex items-center justify-center gap-1"><span class="material-symbols-outlined text-[14px]">landscape</span> {parcelas_eq} PARCELAS</div>
            <div class="text-xs text-green-400 font-bold">+ ${aumento_parcelas:.5f}/día</div>
        </div>
        """
        html = html.replace('ESTR_CAJAS_COMPARATIVAS', cajas_comparativas)
        html = html.replace('ESTR_VEREDICTO', veredicto)
        
        html = html.replace('PAS_NIVEL_ACTUAL', f'Nivel {nivel_actual_pasaporte} ({(motor.pasaporte_mult - 1) * 100:.0f}%)')
        html = html.replace('PAS_NIVEL_SIGUIENTE', f'Nivel {siguiente_nivel} ({(motor.pasaporte_mult - 1 + 0.05) * 100:.0f}%)')
        html = html.replace('PAS_FALTAN_INSIGNIAS', f'{insignias_faltantes}')
        html = html.replace('PAS_IMPACTO_DIARIO', f'+${aumento_pasaporte:.4f} USD')
    else:
        # Maxed Out
        cajas_comparativas = f"""
        <div class="bg-neutral-900/50 p-3 rounded text-center border border-white/5 col-span-2">
            <div class="text-[10px] text-gray-400 mb-1">Próximo movimiento matemático viable:</div>
            <div class="text-sm font-bold text-gold mb-1 flex items-center justify-center gap-1"><span class="material-symbols-outlined text-[14px]">landscape</span> SALTO DE TIER AL LÍMITE DE {siguiente_tramo} PARCELAS</div>
            <div class="text-xs text-gray-400 font-bold">Ahorro requerido: {(faltan_escalera * 100):,} AB</div>
        </div>
        """
        html = html.replace('ESTR_CAJAS_COMPARATIVAS', cajas_comparativas)
        
        if colapso:
            veredicto_max = f"ESTRATEGIA PERFECTA: Ya tienes el Pasaporte al Máximo (Nivel 5) y estás en el límite de un Tier ({total_parcelas} parcelas). Tu única opción de crecimiento es ahorrar **{faltan_escalera * 100:,} AB** para saltar al límite de **{siguiente_tramo} parcelas** de golpe. <br><span class='text-red-400 font-bold'>¡Paciencia y no compres parcelas sueltas o tu multiplicador caerá!</span>"
        else:
            veredicto_max = f"ESTRATEGIA PERFECTA: Ya tienes el Pasaporte al Máximo (Nivel 5). Puedes comprar las **{faltan_escalera} parcelas** que te faltan una por una con total seguridad hasta llegar al límite de **{siguiente_tramo} parcelas**.<br><span class='text-green-400 font-bold'>¡Sigue comprando libremente!</span>"
            
        html = html.replace('ESTR_VEREDICTO', veredicto_max)
        html = html.replace('PAS_NIVEL_ACTUAL', f'Nivel 5 (25%)')
        html = html.replace('PAS_NIVEL_SIGUIENTE', f'MAX')
        html = html.replace('PAS_FALTAN_INSIGNIAS', f'0')
        html = html.replace('PAS_IMPACTO_DIARIO', f'+$0.00 USD')
        
    # Acción Táctica Inmediata
    if total_parcelas < 40:
        accion = "<div class='text-green-400 font-bold text-lg mb-1'>¡CRECIMIENTO INICIAL! 🌱</div>"
        if ab_manuales >= 100:
            accion += f"<div class='text-white text-sm'>Tienes {ab_manuales:,} AB ahorrados. Te alcanza para comprar {ab_manuales//100} parcelas nuevas.<br><span class='text-gold font-bold'>Recomendación: Compra parcelas de inmediato. No ahorres para insignias hasta llegar a las 40 parcelas.</span></div>"
        else:
            accion += f"<div class='text-white text-sm'>Tu cuenta está en fase de crecimiento temprano. El objetivo matemático es llegar a 40 parcelas antes de comprar tu primer pasaporte. Te faltan {100 - ab_manuales} AB para tu próxima parcela.<br><span class='text-gold font-bold'>Recomendación: Farmea anuncios de 2 AB para comprar tu siguiente parcela.</span></div>"
    elif ab_manuales >= faltan_netos_ab and faltan_netos_ab > 0:
        accion = "<div class='text-green-400 font-bold text-lg mb-1'>¡SALTO DE TIER DISPONIBLE! 🚀</div>"
        accion += f"<div class='text-white text-sm'>Tienes {ab_manuales:,} AB ahorrados. Te alcanza para saltar al Tier de {siguiente_tramo} parcelas. <br><span class='text-gold'>Recomendación: Compra las {faltan_escalera} parcelas HOY mismo.</span></div>"
    elif ab_manuales >= costo_ab_pasaporte and aumento_pasaporte > aumento_parcelas and nivel_actual_pasaporte < 5:
        accion = "<div class='text-blue-400 font-bold text-lg mb-1'>¡PASAPORTE RECOMENDADO! 🛂</div>"
        accion += f"<div class='text-white text-sm'>Tienes {ab_manuales:,} AB ahorrados. Cómprate {insignias_faltantes} insignias para subir a Nivel {nivel_actual_pasaporte + 1}.</div>"
    elif colapso:
        accion = "<div class='text-red-400 font-bold text-lg mb-1'>¡NO COMPRES NADA HOY! 🛑</div>"
        accion += f"<div class='text-white text-sm'>Estás en zona de riesgo (Límite de Tier). Si compras una sola parcela, tu multiplicador caerá. <br><span class='text-gold'>Guarda tus AB hasta llegar a {faltan_escalera * 100:,} AB.</span></div>"
    else:
        accion = "<div class='text-gray-300 font-bold text-lg mb-1'>FASE DE ACUMULACIÓN 🔋</div>"
        accion += f"<div class='text-white text-sm'>Sigue viendo anuncios y farmeando. Te faltan <span class='text-gold font-bold'>{faltan_netos_ab - ab_manuales if faltan_netos_ab > ab_manuales else 0:,} AB</span> para completar el siguiente paso de tu estrategia.</div>"
    
    html = html.replace('ACCION_TACTICA_HTML', accion)
    # ----------------------------------------------------
    
    # INYECTANDO MÓDULO 3: EXPLORER CLUB (FASE 12 v2)
    def inyectar_escenario(html, key_prefix, escenario):
        html = html.replace(f'{key_prefix}_INICIO', f'{escenario["dia_inicio"]}')
        html = html.replace(f'{key_prefix}_FIN', f'{escenario["dia_fin"]}')
        html = html.replace(f'{key_prefix}_AB_PASE', f'{escenario["ab_pase"]:,}')
        html = html.replace(f'{key_prefix}_AB_GRATIS', f'{escenario["ab_gratis"]:,}')
        html = html.replace(f'{key_prefix}_NETO', f'{escenario["neto_ab"]:,}')
        html = html.replace(f'{key_prefix}_PARCELAS', f'{escenario["neto_ab"] // 100:,}')
        html = html.replace(f'{key_prefix}_ESPERA', f'{escenario["dias_espera"]}')
        html = html.replace(f'{key_prefix}_FECHA', f'{escenario["fecha_compra"]}')
        return html
        
    html = inyectar_escenario(html, 'MES1', opt_data['mes1'])
    html = inyectar_escenario(html, 'MES2', opt_data['mes2'])
    html = inyectar_escenario(html, 'MES3', opt_data['mes3'])
    html = inyectar_escenario(html, 'OPTIMO', opt_data['optimo'])

    estrategia = l.EstrategiaPro()
    recomendacion = estrategia.analizar_compra(total_parcelas, 150)
    html = html.replace('MENSAJE_ESTRATEGIA', recomendacion)

    components.html(html, height=1000, scrolling=True)

except FileNotFoundError:
    st.error("❌ No se encontró 'dashboard.html'.")
