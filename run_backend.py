"""
Script de inicio para el backend de 'CÁLCULO EN MOVIMIENTO'.
Permite arrancar el servidor FastAPI con Uvicorn de forma directa.
"""
import sys
from pathlib import Path
import uvicorn

# Garantizar que la raíz del proyecto esté en sys.path
ROOT_DIR = Path(__file__).resolve().parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

if __name__ == "__main__":
    print("=" * 60)
    print("Iniciando CÁLCULO EN MOVIMIENTO - Servidor Backend API")
    print("URL: http://localhost:8000")
    print("Documentación: http://localhost:8000/docs")
    print("=" * 60)
    uvicorn.run("backend.api.main:app", host="0.0.0.0", port=8000, reload=True, app_dir=str(ROOT_DIR))
