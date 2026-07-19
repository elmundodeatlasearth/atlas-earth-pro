# logica.py - Motor Maestro de Atlas Earth
import math

import json
import os

class PerfilManager:
    def __init__(self, dir_perfiles="perfiles"):
        self.dir_perfiles = dir_perfiles
        if not os.path.exists(self.dir_perfiles):
            os.makedirs(self.dir_perfiles)
            
    def listar_perfiles(self):
        perfiles = []
        if os.path.exists(self.dir_perfiles):
            for filename in os.listdir(self.dir_perfiles):
                if filename.startswith("perfil_") and filename.endswith(".json"):
                    nombre = filename.replace("perfil_", "").replace(".json", "")
                    perfiles.append(nombre)
        if not perfiles:
            perfiles = ["Principal"]
        return perfiles
        
    def _obtener_ruta(self, nombre_perfil):
        # Sanitizar nombre
        nombre_limpio = "".join(x for x in nombre_perfil if x.isalnum() or x in " _-")
        if not nombre_limpio: nombre_limpio = "Principal"
        return os.path.join(self.dir_perfiles, f"perfil_{nombre_limpio}.json")

    def cargar_perfil(self, nombre_perfil="Principal"):
        ruta = self._obtener_ruta(nombre_perfil)
        if os.path.exists(ruta):
            try:
                with open(ruta, "r", encoding="utf-8") as f:
                    return json.load(f)
            except:
                pass
        # Fallback migración (cargar el viejo si existe y es la cuenta principal)
        if nombre_perfil == "Principal" and os.path.exists("perfil_atlas.json"):
             try:
                 with open("perfil_atlas.json", "r", encoding="utf-8") as f:
                     return json.load(f)
             except:
                 pass
        return None
        
    def guardar_perfil(self, nombre_perfil, datos):
        ruta = self._obtener_ruta(nombre_perfil)
        with open(ruta, "w", encoding="utf-8") as f:
            json.dump(datos, f, indent=4)
            
    def eliminar_perfil(self, nombre_perfil):
        ruta = self._obtener_ruta(nombre_perfil)
        if os.path.exists(ruta):
            os.remove(ruta)
            return True
        return False

def obtener_tasa_cambio(moneda_destino="MXN"):
    if moneda_destino == "USD":
        return 1.0
    try:
        import yfinance as yf
        ticker = f"USD{moneda_destino}=X"
        data = yf.Ticker(ticker)
        # yfinance fast_info access for latest price
        precio_actual = data.fast_info['lastPrice']
        return float(precio_actual)
    except:
        # Fallbacks (actualizados aprox)
        fallbacks = {"MXN": 17.54, "CAD": 1.35, "GBP": 0.78, "AUD": 1.50, "NZD": 1.65, "ZAR": 18.5, "EUR": 0.92, "BRL": 5.4}
        return fallbacks.get(moneda_destino, 1.0)

def obtener_tasas_divisas():
    """Devuelve un diccionario con las tasas de cambio base para el Dashboard JS."""
    fallbacks = {"USD": 1.0, "MXN": 17.54, "CAD": 1.35, "GBP": 0.78, "AUD": 1.50, "NZD": 1.65, "ZAR": 18.5, "EUR": 0.92, "BRL": 5.4}
    try:
        # Podríamos hacer fetch múltiple, pero para UI fluida JS enviamos la base y la tasa actual.
        import yfinance as yf
        return fallbacks
    except:
        return fallbacks

class MotorAtlasEarth:
    def __init__(self, c, r, e, l, pasaporte, horas_boost, eficiencia):
        self.parcelas = {"c": c, "r": r, "e": e, "l": l}
        self.total_parcelas = c + r + e + l
        if self.total_parcelas == 0: self.total_parcelas = 1
        self.pasaporte_mult = 1 + (pasaporte * 0.05)
        self.horas_boost = horas_boost
        self.eficiencia = eficiencia / 100
        self.renta_base = (c * 0.0000000011 + r * 0.0000000016 + e * 0.0000000022 + l * 0.0000000044)
        self.renta_promedio_sec = 0.00000000158 # Distribución 50/30/15/5

    def _get_tier_mult(self, parcelas, pais, tiers_dict):
        tabla = tiers_dict.get(pais, tiers_dict["Estados Unidos"])
        for i, limite in enumerate(tabla["limites"]):
            if parcelas <= limite: return tabla["multiplicadores"][i]
        return tabla["multiplicadores"][-1]

    def calcular_renta(self, boost_tier, horas_srb_mes=0):
        # Promedio mensual (30 días = 720 horas)
        horas_mes = 720
        horas_normales_mes = horas_mes - horas_srb_mes
        
        porcentaje_boost = self.horas_boost / 24.0
        horas_con_boost = horas_normales_mes * porcentaje_boost * self.eficiencia
        horas_sin_boost = horas_normales_mes - horas_con_boost
        
        ingreso_srb = self.renta_base * 3600 * horas_srb_mes * 50
        ingreso_boost = self.renta_base * 3600 * horas_con_boost * boost_tier
        ingreso_sin_boost = self.renta_base * 3600 * horas_sin_boost * 1
        
        renta_mensual = (ingreso_srb + ingreso_boost + ingreso_sin_boost) * self.pasaporte_mult
        return renta_mensual / 30.0

    def calcular_renta_generica(self, num_parcelas, pais, tiers_dict, horas_srb_mes=0):
        boost_tier = self._get_tier_mult(num_parcelas, pais, tiers_dict)
        base_rent = num_parcelas * self.renta_promedio_sec
        
        horas_mes = 720
        horas_normales_mes = horas_mes - horas_srb_mes
        
        porcentaje_boost = self.horas_boost / 24.0
        horas_con_boost = horas_normales_mes * porcentaje_boost * self.eficiencia
        horas_sin_boost = horas_normales_mes - horas_con_boost
        
        ingreso_srb = base_rent * 3600 * horas_srb_mes * 50
        ingreso_boost = base_rent * 3600 * horas_con_boost * boost_tier
        ingreso_sin_boost = base_rent * 3600 * horas_sin_boost * 1
        
        renta_mensual = (ingreso_srb + ingreso_boost + ingreso_sin_boost) * self.pasaporte_mult
        return renta_mensual / 30.0

    def calcular_meta_automatica(self, meta_usd_dia, pais, tiers_dict, horas_srb_mes):
        """Busca cuántas parcelas se necesitan para llegar a la meta diaria promedio en USD (incluyendo SRB)."""
        if meta_usd_dia <= 0: return self.total_parcelas, 0
        p_test = self.total_parcelas
        while p_test < 500000:
            renta_test = self.calcular_renta_generica(p_test, pais, tiers_dict, horas_srb_mes)
            if renta_test >= meta_usd_dia:
                break
            p_test += 1
        renta_test = self.calcular_renta_generica(p_test, pais, tiers_dict, horas_srb_mes)
        return p_test, renta_test
        
    def calcular_escalera(self, pais, tiers_dict):
        tabla = tiers_dict.get(pais, tiers_dict["Estados Unidos"])
        limites = tabla["limites"]
        tramo_actual = limites[-1]
        siguiente_tramo = limites[-1]
        for lim in limites:
            if self.total_parcelas <= lim:
                tramo_actual = lim
                idx = limites.index(lim)
                if idx + 1 < len(limites):
                    siguiente_tramo = limites[idx + 1]
                else:
                    siguiente_tramo = lim
                break
        faltantes = siguiente_tramo - self.total_parcelas if siguiente_tramo > self.total_parcelas else 0
        return tramo_actual, siguiente_tramo, faltantes

    def formato_tiempo_exacto(self, dias_totales):
        if dias_totales <= 0: return "Meta alcanzada"
        if dias_totales == float('inf'): return "Infinito"
        
        anios = int(dias_totales // 365.25)
        dias_rest = dias_totales % 365.25
        meses = int(dias_rest // 30.43)
        dias_final = int(dias_rest % 30.43)
        
        partes = []
        if anios == 1: partes.append("1 Año")
        elif anios > 1: partes.append(f"{anios} Años")
        if meses == 1: partes.append("1 Mes")
        elif meses > 1: partes.append(f"{meses} Meses")
        if dias_final == 1: partes.append("1 Día")
        elif dias_final > 1 or len(partes) == 0: partes.append(f"{dias_final} Días")
        
        return ", ".join(partes)

    def formato_tiempo(self, ab_faltantes, ab_diarios):
        if ab_faltantes <= 0: return "Meta alcanzada"
        if ab_diarios <= 0: return "Infinito"
        dias_totales = ab_faltantes / ab_diarios
        return self.formato_tiempo_exacto(dias_totales)

    def dias_para_meta(self, meta, renta_diaria):
        return meta / renta_diaria if renta_diaria > 0 else 999

# --- NUEVO: SIMULADOR EXACTO F2P VS EXPLORER CLUB ---
def generar_calendario_ae():
    """Genera el arreglo de 90 días de recompensas exactas F2P y EC de Atlas Earth."""
    calendario_f2p = [1] * 90
    calendario_ec = [90] * 90
    
    # Hitos oficiales según datos del usuario
    hitos_dias = [7, 14, 30, 60, 90]
    bonos_f2p = [8, 25, 50, 80, 200]
    bonos_ec = [180, 325, 500, 650, 1200]
    
    for i, dia in enumerate(hitos_dias):
        idx = dia - 1
        calendario_f2p[idx] = bonos_f2p[i]
        calendario_ec[idx] = bonos_ec[i]
        
    return calendario_f2p, calendario_ec

def optimizador_explorer_club(dia_actual):
    """Devuelve los 4 escenarios de compra de Explorer Club: Mes 1, Mes 2, Mes 3 y Combinado (Óptimo)."""
    f2p, ec = generar_calendario_ae()
    import datetime
    hoy = datetime.date.today()
    
    def calcular_ventana(inicio):
        ab_pase = 0
        ab_gratis = 0
        for i in range(30):
            dia_check = ((inicio - 1 + i) % 90)
            ab_pase += ec[dia_check] + f2p[dia_check]
            ab_gratis += f2p[dia_check]
            
        dia_fin = (inicio + 29) % 90
        if dia_fin == 0: dia_fin = 90
        
        # Calcular fecha real y cuenta regresiva
        # ¿Cuántos días faltan para llegar al 'inicio' desde 'dia_actual'?
        if inicio >= dia_actual:
            dias_espera = inicio - dia_actual
        else:
            dias_espera = (90 - dia_actual) + inicio
            
        fecha_compra = hoy + datetime.timedelta(days=dias_espera)
            
        return {
            "dia_inicio": inicio,
            "dia_fin": dia_fin,
            "ab_pase": ab_pase,
            "ab_gratis": ab_gratis,
            "neto_ab": ab_pase - ab_gratis,
            "dias_espera": dias_espera,
            "fecha_compra": fecha_compra.strftime("%d de %b, %Y")
        }

    # Escenarios
    mes1 = calcular_ventana(1)
    mes2 = calcular_ventana(31)
    mes3 = calcular_ventana(61)
    
    # Encontrar el Óptimo
    resultados = []
    for inicio in range(1, 91):
        resultados.append(calcular_ventana(inicio))
    
    # En caso de empate en neto_ab, priorizar el dia_inicio más alto (Ej. Día 90 sobre Día 75)
    resultados.sort(key=lambda x: (x["neto_ab"], x["dia_inicio"]), reverse=True)
    optimo = resultados[0]
            
    return {
        "mes1": mes1,
        "mes2": mes2,
        "mes3": mes3,
        "optimo": optimo
    }

class SimuladorDiario:
    def __init__(self, dia_actual, max_anuncios):
        self.dia_actual = dia_actual
        self.max_anuncios = max_anuncios
        self.f2p_cal, self.ec_cal = generar_calendario_ae()
        
    def simular_mes(self, modo_ec=False, ab_minijuegos_mes=0):
        """Proyecta 30 días de ingresos de AB basados en las mecánicas exactas (Ruleta 5 vs 7)."""
        return self.simular_mes_desglosado(modo_ec, ab_minijuegos_mes)["total_mes"]
        
    def simular_mes_desglosado(self, modo_ec=False, ab_minijuegos_mes=0):
        total_ruleta = (7 if modo_ec else 5) * 1.7 * 30
        total_anuncios = (self.max_anuncios * 2) * 30
        total_asistencia = 0
        
        for i in range(30):
            dia_check = ((self.dia_actual - 1 + i) % 90)
            ab_asistencia = self.f2p_cal[dia_check]
            if modo_ec:
                ab_asistencia += self.ec_cal[dia_check]
            total_asistencia += ab_asistencia
            
        gran_total = total_ruleta + total_anuncios + total_asistencia + ab_minijuegos_mes
        return {
            "total_mes": gran_total,
            "promedio_diario": gran_total / 30.0,
            "ruleta_diaria": (7 if modo_ec else 5) * 1.7,
            "anuncios_diarios": self.max_anuncios * 2,
            "asistencia_mes": total_asistencia,
            "minijuegos_mes": ab_minijuegos_mes
        }

def calcular_nivel_pasaporte(insignias):
    """Inferencia automática del nivel de pasaporte basado en insignias de Atlas Earth."""
    if insignias >= 101: return 5
    if insignias >= 61: return 4
    if insignias >= 31: return 3
    if insignias >= 11: return 2
    if insignias >= 1: return 1
    return 0

class EstrategiaPro:
    def analizar_compra(self, parcelas_actuales, meta_parcelas):
        if parcelas_actuales < 150:
            return "Prioridad: Comprar parcelas hasta el Tier de 150 (Multiplicador Máximo)."
        else:
            return "Prioridad: Comprar pasaportes para maximizar renta o acumular AB para el siguiente salto de Tier."
