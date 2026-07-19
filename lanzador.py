import sys
from streamlit.web import cli as stcli

if __name__ == '__main__':
    # Forzamos la ejecución local del archivo main.py
    sys.argv = ["streamlit", "run", "main.py"]
    sys.exit(stcli.main())
