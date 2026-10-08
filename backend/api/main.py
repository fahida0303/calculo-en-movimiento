"""
Servidor FastAPI para 'CÁLCULO EN MOVIMIENTO'.
Expone endpoints REST y WebSocket para validación matemática,
ejecución de requisitos 1 a 5, y streaming de visión artificial en tiempo real.
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel
from typing import Optional, Dict, Any
import asyncio
import json
import sys
from pathlib import Path

# Asegurar que la raíz del proyecto esté en sys.path
_PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

try:
    from backend.math_engine.parser import parse_mathematical_function
    from backend.math_engine.engine import execute_requirement
    from backend.vision.hand_tracker import (
        hand_tracker,
        STATE_CAMERA_OFF,
        STATE_CAMERA_ACTIVE,
        STATE_CAMERA_ERROR
    )
except ImportError:
    from math_engine.parser import parse_mathematical_function
    from math_engine.engine import execute_requirement
    from vision.hand_tracker import (
        hand_tracker,
        STATE_CAMERA_OFF,
        STATE_CAMERA_ACTIVE,
        STATE_CAMERA_ERROR
    )

app = FastAPI(
    title="Cálculo en Movimiento API",
    description="Backend de cálculo matemático interactivo, visión artificial y gestos",
    version="1.0.0"
)

# Habilitar CORS para integración con Vite/React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelos Pydantic para validación y tipos
class ValidateRequest(BaseModel):
    expression: str

class CalculateRequest(BaseModel):
    function: str
    mode: str = "MANUAL"  # "CAMERA" o "MANUAL"
    requirement: int      # 1 a 5
    parameters: Optional[Dict[str, Any]] = None

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "Cálculo en Movimiento"}

@app.post("/api/validate")
def validate_function(req: ValidateRequest):
    """
    PASO 2: Valida la función ingresada por el usuario.
    Retorna si es válida, su tipo clasificado o el error específico.
    PROHIBICIÓN: No calcula ni devuelve la gráfica matemática aún.
    """
    res = parse_mathematical_function(req.expression)
    if not res["is_valid"]:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "is_valid": False,
                "expression": req.expression,
                "error_message": res["error_message"]
            }
        )
    return {
        "success": True,
        "is_valid": True,
        "expression": res["clean_repr"],
        "latex": res["latex"],
        "function_type": res["function_type"]
    }

@app.post("/api/calculate")
def calculate_requirement(req: CalculateRequest):
    """
    PASOS 6, 7, 8 y 9:
    Ejecuta el cálculo correspondiente al requisito seleccionado (1..5).
    La gráfica y resultados matemáticos se generan ÚNICAMENTE aquí.
    """
    calc_res = execute_requirement(
        expr_str=req.function,
        requirement_num=req.requirement,
        params=req.parameters
    )
    if not calc_res.get("success", False):
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "function": req.function,
                "requirement": req.requirement,
                "errors": calc_res.get("error", "Error en el cálculo matemático")
            }
        )
    return calc_res

@app.post("/api/camera/start")
def start_camera():
    """Activa la cámara con OpenCV y MediaPipe ÚNICAMENTE cuando se selecciona MODO CÁMARA."""
    try:
        res = hand_tracker.start()
        if not res.get("success", False):
            return JSONResponse(status_code=400, content=res)
        return res
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": str(e),
                "message": "En servidores en la nube sin cámara física o GPU, utiliza el Modo Manual para explorar todos los requisitos."
            }
        )

@app.post("/api/camera/stop")
def stop_camera():
    """Detiene y libera la cámara de inmediato."""
    hand_tracker.stop()
    return {"success": True, "message": "Cámara detenida y recursos liberados."}

@app.get("/api/camera/status")
def get_camera_status():
    """Retorna el estado de cámara, mano detectada, dedos y requisito activo."""
    return hand_tracker.get_status()

@app.websocket("/ws/vision")
async def vision_websocket_endpoint(websocket: WebSocket):
    """
    WebSocket en tiempo real para streaming de video con landmarks dibujados
    y estado de dedos estabilizados hacia el frontend.
    """
    await websocket.accept()
    try:
        while True:
            status = hand_tracker.get_status()
            frame_b64 = hand_tracker.get_latest_frame()
            payload = {
                **status,
                "frame": frame_b64
            }
            await websocket.send_text(json.dumps(payload))
            await asyncio.sleep(0.04)  # ~25 FPS
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
