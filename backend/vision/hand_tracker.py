"""
Módulo de Visión Artificial: OpenCV + MediaPipe HandLandmarker.
Implementa detección de mano, conteo de dedos (1..5),
estabilización temporal robusta y máquina de estados.
"""
import os
import cv2
import time
import base64
import threading
from collections import deque
from typing import Dict, Any, Optional, Tuple, List
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# Nombres de requisitos asociados a los dedos
REQUIREMENT_MAP = {
    1: "EVALUACIÓN Y PENDIENTE",
    2: "SECANTE Y RAZÓN DE CAMBIO",
    3: "FUNCIÓN Y DERIVADAS",
    4: "PUNTOS CRÍTICOS",
    5: "DESAFÍO APLICADO"
}

# Estados del sistema de cámara
STATE_CAMERA_OFF = "CAMERA_OFF"
STATE_CAMERA_LOADING = "CAMERA_LOADING"
STATE_CAMERA_ACTIVE = "CAMERA_ACTIVE"
STATE_HAND_NOT_DETECTED = "HAND_NOT_DETECTED"
STATE_HAND_DETECTED = "HAND_DETECTED"
STATE_GESTURE_DETECTED = "GESTURE_DETECTED"
STATE_CAMERA_ERROR = "CAMERA_ERROR"

STATE_MESSAGES = {
    STATE_CAMERA_OFF: "Cámara desactivada.",
    STATE_CAMERA_LOADING: "Inicializando cámara...",
    STATE_CAMERA_ACTIVE: "Cámara activa. Muestra tu mano.",
    STATE_HAND_NOT_DETECTED: "No se detecta ninguna mano.",
    STATE_HAND_DETECTED: "Mano detectada.",
    STATE_GESTURE_DETECTED: "dedos detectados.",
    STATE_CAMERA_ERROR: "ERROR DE CÁMARA. No se encontró una cámara disponible. Puedes utilizar Modo Manual."
}

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "hand_landmarker.task")

class HandTracker:
    def __init__(self, camera_index: int = 1, history_length: int = 5, min_confirm_count: int = 3):
        self.camera_index = camera_index
        self.history_length = history_length
        self.min_confirm_count = min_confirm_count
        
        self.cap: Optional[cv2.VideoCapture] = None
        self.detector = None
        self.is_running = False
        self.thread: Optional[threading.Thread] = None
        self.lock = threading.Lock()
        
        # Buffer de estabilización temporal de dedos
        self.finger_history = deque(maxlen=history_length)
        
        # Estados actuales
        self.current_state = STATE_CAMERA_OFF
        self.status_message = STATE_MESSAGES[STATE_CAMERA_OFF]
        self.hand_detected = False
        self.two_hands_warning = False
        self.detected_fingers = 0
        self.confirmed_fingers = 0
        self.active_requirement = 0
        self.latest_frame_base64: Optional[str] = None
        self.last_detection_landmarks: List[Dict[str, float]] = []
        self.is_black_frame: bool = False
        self.black_frame_count: int = 0

    def _init_detector(self):
        """Inicializa el modelo HandLandmarker de MediaPipe."""
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"No se encontró el modelo de MediaPipe en {MODEL_PATH}")
        
        base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
        options = vision.HandLandmarkerOptions(
            base_options=base_options,
            num_hands=2,
            min_hand_detection_confidence=0.5,
            min_hand_presence_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.detector = vision.HandLandmarker.create_from_options(options)

    def start(self) -> Dict[str, Any]:
        """Inicia la captura de cámara en un hilo independiente (solo cuando se selecciona MODO CÁMARA)."""
        with self.lock:
            if self.is_running and self.cap and self.cap.isOpened():
                return {"success": True, "message": "La cámara ya está activa."}
            
            self.current_state = STATE_CAMERA_LOADING
            self.status_message = STATE_MESSAGES[STATE_CAMERA_LOADING]

        try:
            if self.cap:
                try:
                    self.cap.release()
                except Exception:
                    pass
                self.cap = None

            if self.detector is None:
                self._init_detector()

            # Buscar la cámara disponible preferida (priorizando la que tenga señal real > 10 mean)
            best_cap = None
            best_idx = 1
            candidates = [
                (1, cv2.CAP_DSHOW),
                (1, cv2.CAP_ANY),
                (0, cv2.CAP_DSHOW),
                (0, cv2.CAP_ANY),
                (2, cv2.CAP_DSHOW),
                (2, cv2.CAP_ANY)
            ]
            for idx, backend in candidates:
                try:
                    temp_cap = cv2.VideoCapture(idx, backend)
                    if temp_cap.isOpened():
                        ret, test_frame = temp_cap.read()
                        if ret and test_frame is not None:
                            mean_val = float(test_frame.mean())
                            if mean_val > 10.0:
                                best_cap = temp_cap
                                best_idx = idx
                                break
                            elif best_cap is None:
                                best_cap = temp_cap
                                best_idx = idx
                                continue
                    temp_cap.release()
                except Exception:
                    pass

            if best_cap is None or not best_cap.isOpened():
                with self.lock:
                    self.current_state = STATE_CAMERA_ERROR
                    self.status_message = STATE_MESSAGES[STATE_CAMERA_ERROR]
                    self.is_running = False
                return {
                    "success": False,
                    "error": STATE_MESSAGES[STATE_CAMERA_ERROR],
                    "state": STATE_CAMERA_ERROR
                }

            self.cap = best_cap
            self.camera_index = best_idx

            # Configuración de resolución ágil
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

            self.is_running = True
            self.finger_history.clear()
            self.confirmed_fingers = 0
            self.active_requirement = 0

            with self.lock:
                self.current_state = STATE_CAMERA_ACTIVE
                self.status_message = STATE_MESSAGES[STATE_CAMERA_ACTIVE]

            self.thread = threading.Thread(target=self._capture_loop, daemon=True)
            self.thread.start()

            return {"success": True, "state": STATE_CAMERA_ACTIVE}

        except Exception as e:
            with self.lock:
                self.current_state = STATE_CAMERA_ERROR
                self.status_message = f"Error al iniciar cámara: {str(e)}"
                self.is_running = False
            return {
                "success": False,
                "error": self.status_message,
                "state": STATE_CAMERA_ERROR
            }

    def stop(self):
        """Detiene y libera la cámara de inmediato."""
        self.is_running = False
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=1.0)
        
        with self.lock:
            if self.cap:
                self.cap.release()
                self.cap = None
            self.finger_history.clear()
            self.hand_detected = False
            self.detected_fingers = 0
            self.confirmed_fingers = 0
            self.active_requirement = 0
            self.latest_frame_base64 = None
            self.last_detection_landmarks = []
            self.is_black_frame = False
            self.black_frame_count = 0
            self.current_state = STATE_CAMERA_OFF
            self.status_message = STATE_MESSAGES[STATE_CAMERA_OFF]

    def _count_fingers(self, landmarks, handedness: str) -> int:
        """
        Cuenta de dedos levantados (1..5) según los landmarks de MediaPipe.
        """
        # Índices de puntas y articulaciones
        # Pulgar: 4 vs 3 (o 2)
        # Índice: 8 vs 6
        # Medio: 12 vs 10
        # Anular: 16 vs 14
        # Meñique: 20 vs 18
        fingers = 0

        # Pulgar: comparación horizontal según lateralidad
        thumb_tip = landmarks[4]
        thumb_ip = landmarks[3]
        thumb_mcp = landmarks[2]

        # Consideramos si la mano está de frente o de dorso
        # Una heurística robusta para el pulgar es la distancia relativa respecto a la muñeca o al índice
        wrist = landmarks[0]
        index_mcp = landmarks[5]
        pinky_mcp = landmarks[17]

        # Para los 4 dedos largos (comparación vertical y: 0 arriba, 1 abajo)
        tips_pips = [(8, 6), (12, 10), (16, 14), (20, 18)]
        for tip_idx, pip_idx in tips_pips:
            if landmarks[tip_idx].y < landmarks[pip_idx].y:
                fingers += 1

        # Detección del pulgar extendido:
        # La punta del pulgar debe estar más alejada del centro de la palma (promedio de muñeca y base de dedos)
        palm_center_x = (wrist.x + index_mcp.x + pinky_mcp.x) / 3.0
        palm_dist_tip = abs(thumb_tip.x - palm_center_x)
        palm_dist_ip = abs(thumb_ip.x - palm_center_x)
        
        # También comprobamos si el pulgar no está doblado hacia adentro
        if palm_dist_tip > palm_dist_ip + 0.02 and thumb_tip.y < landmarks[2].y + 0.1:
            fingers += 1

        return min(5, max(0, fingers))

    def _stabilize_gesture(self, instantaneous_fingers: int) -> int:
        """
        Algoritmo de estabilización temporal:
        Mantiene una ventana deslizante de frames recientes.
        Solo confirma cambio cuando una cuenta domina consistentemente la ventana.
        Ejemplo: 3, 3, 3, 3 -> confirma 3.
                 3, 2, 3, 2 -> mantiene la confirmada anterior.
        """
        self.finger_history.append(instantaneous_fingers)
        if len(self.finger_history) < self.history_length:
            return self.confirmed_fingers

        # Frecuencia en la ventana
        counts = {}
        for f in self.finger_history:
            counts[f] = counts.get(f, 0) + 1

        dominant_fingers, max_freq = max(counts.items(), key=lambda item: item[1])

        if max_freq >= self.min_confirm_count:
            return dominant_fingers

        return self.confirmed_fingers

    def _draw_overlay(self, frame, landmarks_list, fingers: int, confirmed: int):
        """Dibuja landmarks, líneas auxiliares e información en el frame para visualización científica."""
        h, w, _ = frame.shape
        
        # Conexiones estándar de la mano
        HAND_CONNECTIONS = [
            (0, 1), (1, 2), (2, 3), (3, 4),
            (0, 5), (5, 6), (6, 7), (7, 8),
            (5, 9), (9, 10), (10, 11), (11, 12),
            (9, 13), (13, 14), (14, 15), (15, 16),
            (13, 17), (17, 18), (18, 19), (19, 20),
            (0, 17)
        ]

        # Dibujar esqueleto de landmarks con estética cian/esmeralda tecnológica
        for p1, p2 in HAND_CONNECTIONS:
            pt1 = (int(landmarks_list[p1].x * w), int(landmarks_list[p1].y * h))
            pt2 = (int(landmarks_list[p2].x * w), int(landmarks_list[p2].y * h))
            cv2.line(frame, pt1, pt2, (255, 200, 0), 2)  # Líneas cian suave

        for idx, lm in enumerate(landmarks_list):
            cx, cy = int(lm.x * w), int(lm.y * h)
            # Puntas de los dedos resaltadas en verde esmeralda
            if idx in [4, 8, 12, 16, 20]:
                cv2.circle(frame, (cx, cy), 7, (0, 255, 128), -1)
                cv2.circle(frame, (cx, cy), 9, (255, 255, 255), 1)
            else:
                cv2.circle(frame, (cx, cy), 4, (0, 200, 255), -1)

        # Header HUD en la parte superior del frame
        req_name = REQUIREMENT_MAP.get(confirmed, "Sin gesto confirmado")
        cv2.rectangle(frame, (10, 10), (w - 10, 65), (20, 24, 33), -1)
        cv2.rectangle(frame, (10, 10), (w - 10, 65), (0, 220, 180), 1)

        status_text = f"DEDOS: {confirmed} | REQUISITO: {req_name}"
        cv2.putText(frame, status_text, (20, 42), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 255, 200), 2)

        if self.two_hands_warning:
            cv2.putText(frame, "AVISO: 2 manos detectadas (usando principal)", (20, 90),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 165, 255), 2)

    def _capture_loop(self):
        """Bucle principal de captura y procesamiento en tiempo real."""
        while self.is_running and self.cap and self.cap.isOpened():
            ret, frame = self.cap.read()
            if not ret or frame is None:
                time.sleep(0.02)
                continue

            # Espejar para interacción natural tipo espejo
            frame = cv2.flip(frame, 1)

            # Detectar si el frame capturado está completamente negro/oscuro (por ejemplo, tapa cerrada o driver colgado)
            is_black = int(frame.max()) <= 8
            with self.lock:
                if is_black:
                    self.black_frame_count += 1
                    if self.black_frame_count >= 10:
                        self.is_black_frame = True
                else:
                    self.black_frame_count = 0
                    self.is_black_frame = False

            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

            # Detección de mano con MediaPipe HandLandmarker
            try:
                detection_result = self.detector.detect(mp_image)
            except Exception:
                detection_result = None

            with self.lock:
                if detection_result and detection_result.hand_landmarks:
                    num_detected = len(detection_result.hand_landmarks)
                    self.hand_detected = True
                    self.two_hands_warning = (num_detected > 1)
                    
                    # Usamos la primera mano detectada (mano principal)
                    primary_hand_landmarks = detection_result.hand_landmarks[0]
                    handedness = "Right"
                    if detection_result.handedness and len(detection_result.handedness) > 0:
                        handedness = detection_result.handedness[0][0].category_name

                    raw_fingers = self._count_fingers(primary_hand_landmarks, handedness)
                    self.detected_fingers = raw_fingers

                    # Estabilización temporal
                    confirmed = self._stabilize_gesture(raw_fingers)
                    self.confirmed_fingers = confirmed

                    if confirmed in REQUIREMENT_MAP:
                        self.active_requirement = confirmed
                        self.current_state = STATE_GESTURE_DETECTED
                        self.status_message = f"{confirmed} dedos detectados."
                    elif confirmed == 0:
                        self.active_requirement = 0
                        self.current_state = STATE_HAND_DETECTED
                        self.status_message = "Mano detectada. Sin gesto confirmado."

                    # Guardar landmarks serializables
                    self.last_detection_landmarks = [
                        {"x": round(lm.x, 3), "y": round(lm.y, 3), "z": round(lm.z, 3)}
                        for lm in primary_hand_landmarks
                    ]

                    # Dibujar overlay tecnológico
                    self._draw_overlay(frame, primary_hand_landmarks, raw_fingers, confirmed)

                else:
                    self.hand_detected = False
                    self.two_hands_warning = False
                    self.detected_fingers = 0
                    self.finger_history.append(0)
                    self.confirmed_fingers = self._stabilize_gesture(0)
                    self.last_detection_landmarks = []
                    self.current_state = STATE_HAND_NOT_DETECTED
                    self.status_message = STATE_MESSAGES[STATE_HAND_NOT_DETECTED]

                # Codificar frame en JPEG base64 para el dashboard
                _, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 65])
                self.latest_frame_base64 = base64.b64encode(buffer).decode('utf-8')

            time.sleep(0.03)  # ~30 FPS

    def get_status(self) -> Dict[str, Any]:
        """Retorna el estado actual de la visión artificial."""
        with self.lock:
            return {
                "camera_state": self.current_state,
                "status_message": self.status_message,
                "camera_active": self.is_running,
                "hand_detected": self.hand_detected,
                "two_hands_warning": self.two_hands_warning,
                "detected_fingers": self.detected_fingers,
                "confirmed_fingers": self.confirmed_fingers,
                "active_requirement": self.active_requirement,
                "has_frame": self.latest_frame_base64 is not None,
                "is_black_frame": self.is_black_frame,
                "landmarks_count": len(self.last_detection_landmarks)
            }

    def get_latest_frame(self) -> Optional[str]:
        """Retorna el último frame procesado en formato base64 JPEG."""
        with self.lock:
            return self.latest_frame_base64

# Instancia global del rastreador
hand_tracker = HandTracker()
