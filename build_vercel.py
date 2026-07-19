import json
import base64

def build():
    with open('main.py', 'r', encoding='utf-8') as f:
        main_py = f.read()
    with open('logica.py', 'r', encoding='utf-8') as f:
        logica_py = f.read()
    with open('dashboard.html', 'r', encoding='utf-8') as f:
        dashboard_html = f.read()
    with open('perfil_atlas.json', 'r', encoding='utf-8') as f:
        perfil_json = f.read()
        
    # Agregamos la configuración de tema oscuro nativo de Streamlit
    config_toml = """[theme]
base="dark"
primaryColor="#4ade80"
backgroundColor="#0a0a0a"
secondaryBackgroundColor="#1f1f1f"
textColor="#ffffff"
"""

    files = {
        "main.py": main_py,
        "logica.py": logica_py,
        "dashboard.html": dashboard_html,
        "perfil_atlas.json": perfil_json,
        ".streamlit/config.toml": config_toml
    }

    # Serializamos a JSON
    json_files = json.dumps(files)
    json_files = json_files.replace("</script>", "<\\/script>")

    html = f"""<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <title>Atlas Earth - PRO</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@stlite/mountable@0.49.1/build/stlite.css" />
    <style>
      body {{ background-color: #0a0a0a; color: white; }}
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script src="https://cdn.jsdelivr.net/npm/@stlite/mountable@0.49.1/build/stlite.js"></script>
    <script>
      stlite.mount(
        {{
          requirements: [],
          entrypoint: "main.py",
          files: {json_files}
        }},
        document.getElementById("root")
      );
    </script>
  </body>
</html>"""

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
        
    print("Build complete! index.html generated with Dark Mode.")

if __name__ == '__main__':
    build()
