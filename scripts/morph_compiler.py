import os
import json
import requests

def morph_compact_files(files_dict, api_key):
    """
    Usa Morph Compact para reducir el tamaño del contexto.
    Útil para empaquetar archivos .py dentro de index.html 
    (acelerando los tiempos de carga en stlite).
    """
    compacted_files = {}
    for filename, content in files_dict.items():
        print(f"[Morph Compact] Comprimiendo {filename} (Tokens iniciales estimados: {len(content)//4})")
        
        # Simulación del SDK de Morph Compact
        # Real call: morph.compact(text=content, target_ratio=0.5)
        
        payload = {
            "text": content,
            "target_ratio": 0.5
        }
        
        try:
            res = requests.post(
                "https://api.morphllm.com/v1/compact",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json=payload
            )
            if res.ok:
                compacted_files[filename] = res.json().get("compacted_text", content)
                print(f" -> {filename} comprimido con éxito.")
            else:
                compacted_files[filename] = content
        except Exception as e:
            print(f"Error Morph Compact en {filename}: {e}")
            compacted_files[filename] = content
            
    return compacted_files
