import re

def convert():
    with open('dashboard.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # Extraer solo el contenido dentro de <main>
    match = re.search(r'<main.*?>(.*?)</main>', html, re.DOTALL | re.IGNORECASE)
    if match:
        html = match.group(0)

    # Reemplazos básicos de React
    html = html.replace('class="', 'className="')
    html = html.replace('<!--', '{/*')
    html = html.replace('-->', '*/}')
    
    # Cerrar tags vacíos (br, img, hr, input)
    html = re.sub(r'<(br|hr|img|input)([^>]*?)(?<!/)>', r'<\1\2/>', html)
    
    placeholders = [
        "TOTAL_PARCELAS_ACTUALES", "TOTAL_AB_ACTUALES", "TOTAL_AB_OBJETIVO",
        "FALTAN_PARCELAS_META", "PARCELAS_OBJETIVO", "TARGET_PARCELAS",
        "SALTO_TIER_MULTx", "FALTAN_TIER", "COSTO_TIER_AB", "COSTO_RESTANTE_META",
        "PARC_COM_META", "PARC_RAR_META", "PARC_EPI_META", "PARC_LEG_META",
        "COSTO_TIENDA_META", "COSTO_TIENDA_GLOBAL", "COSTO_TIENDA_LOCAL",
        "RENTA_OBJETIVO_LOCAL", "RENTA_OBJETIVO", "META_INGRESO_DIARIO",
        "PROGRESO_META_PORCENTAJE", "ROI_GLOBAL_ANIOS", "ROI_MARGINAL_ANIOS",
        "ROI_MARGINAL_BG", "ROI_MARGINAL_BORDER", "ROI_MARGINAL_TEXT", "ROI_MARGINAL_ICON",
        "ROI_MARGINAL_SUBTEXT", "ROI_MARGINAL_DESC", "DIAS_FREE_META", "AB_DIARIOS",
        "TIEMPO_EC_META", "DIAS_EC_META", "AB_EC_DIARIOS", "AHORRO_EC_DIAS",
        "FECHA_F2P_META", "FECHA_EC_META", "DIAS_GENERAR_50", "AB_REINV_DIARIOS",
        "DIAS_REINV_META", "TRAMO_ACTUAL", "TRAMO_SIGUIENTE", "FALTAN_PARCELAS_ESCALERA",
        "PORCENTAJE_ESCALERA", "AB_MANUALES", "AB_ESCALERA_TOTAL", "ALCANZA_PARCELAS",
        "PARCELAS_A_COMPRAR", "FALTAN_NETOS_AB", "TIEMPO_ESCALERA", "ALERTA_COLAPSO_HTML",
        "ESTR_CAJAS_COMPARATIVAS", "ESTR_VEREDICTO", "PAS_NIVEL_ACTUAL", "PAS_NIVEL_SIGUIENTE",
        "PAS_FALTAN_INSIGNIAS", "PAS_IMPACTO_DIARIO", "ACCION_TACTICA_HTML",
        "RENTA_DIARIA_USD", "SRB_AL_MES", "HORAS_BOOST", "EFICIENCIA_PORCENTAJE",
        "META_USD_DIARIA", "PARC_COMUN", "PARC_RARA", "PARC_EPICA", "PARC_LEGENDARIA"
    ]
    
    for p in placeholders:
        camel = "".join(x.capitalize() if i > 0 else x.lower() for i, x in enumerate(p.split('_')))
        if "HTML" in p or "CAJAS" in p:
            html = html.replace(p, f"<div dangerouslySetInnerHTML={{{{ __html: props.{camel} }}}}></div>")
        else:
            html = html.replace(p, f"{{props.{camel}}}")

    # Regex para convertir style="..." a style={{...}} de React
    # Solución cruda para width: {props.progresoMetaPorcentaje}%
    html = re.sub(r'style="([^"]*?)"', r'style={{\1}}', html)
    html = html.replace('width: {props.progresoMetaPorcentaje}%', "width: `${props.progresoMetaPorcentaje}%`")
    
    jsx = f"""import React from 'react';

export default function Dashboard(props) {{
    return (
        <main className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 relative z-10 w-full min-h-screen">
        {html}
        </main>
    );
}}
"""
    with open('atlas-web/src/Dashboard.jsx', 'w', encoding='utf-8') as f:
        f.write(jsx)
        
    print("Dashboard.jsx generated successfully!")

if __name__ == "__main__":
    convert()
