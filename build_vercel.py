import json

def build():
    with open('main.py', 'r', encoding='utf-8') as f:
        main_py = f.read()
    with open('logica.py', 'r', encoding='utf-8') as f:
        logica_py = f.read()
    with open('dashboard.html', 'r', encoding='utf-8') as f:
        dashboard_html = f.read()
    with open('perfil_atlas.json', 'r', encoding='utf-8') as f:
        perfil_json = f.read()

    files = {
        "main.py": main_py,
        "logica.py": logica_py,
        "dashboard.html": dashboard_html,
        "perfil_atlas.json": perfil_json
    }

    # Serializamos a JSON
    json_files = json.dumps(files)
    # CRÍTICO: Escapar los tags </script> para que no rompan el script de stlite en el index.html
    json_files = json_files.replace("</script>", "<\\/script>")

    html = f"""<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <title>Atlas Earth - Vercel Edition</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@stlite/mountable@0.49.1/build/stlite.css" />
    <style>
      body {{ background-color: #0e1117; color: white; }}
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

    with open('public/index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
        
    print("Vercel build complete! index.html generated.")

if __name__ == '__main__':
    import os
    if not os.path.exists('public'):
        os.makedirs('public')
    build()
