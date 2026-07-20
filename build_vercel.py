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

    with open('db_supabase.py', 'r', encoding='utf-8') as f:
        db_py = f.read()

    files = {
        "main.py": main_py,
        "logica.py": logica_py,
        "dashboard.html": dashboard_html,
        "perfil_atlas.json": perfil_json,
        "db_supabase.py": db_py
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
          requirements: ["requests"],
          entrypoint: "main.py",
          files: {json_files},
          streamlitConfig: {{
            "theme.base": "dark",
            "theme.primaryColor": "#4ade80",
            "theme.backgroundColor": "#0a0a0a",
            "theme.secondaryBackgroundColor": "#1f1f1f",
            "theme.textColor": "#ffffff"
          }}
        }},
        document.getElementById("root")
      );
    </script>
  </body>
</html>"""

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
        
    print("Build complete! index.html generated with Dark Mode via streamlitConfig.")

if __name__ == '__main__':
    build()
