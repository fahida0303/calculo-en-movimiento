"""
Pruebas de la lógica de visión, conteo y estabilización temporal.
"""
import pytest
from backend.vision.hand_tracker import (
    HandTracker,
    STATE_CAMERA_OFF,
    STATE_CAMERA_ACTIVE,
    STATE_GESTURE_DETECTED
)

def test_stabilization_logic():
    tracker = HandTracker(history_length=5, min_confirm_count=4)
    # Secuencia inestable: 3, 2, 3, 2 -> no debe confirmar 3 inmediatamente
    assert tracker._stabilize_gesture(3) == 0
    assert tracker._stabilize_gesture(2) == 0
    assert tracker._stabilize_gesture(3) == 0
    assert tracker._stabilize_gesture(2) == 0
    assert tracker._stabilize_gesture(3) == 0  # 3 de 5 no alcanza umbral de 4

    # Secuencia consistente: 3, 3, 3, 3 -> confirma 3
    tracker._stabilize_gesture(3)
    tracker._stabilize_gesture(3)
    tracker._stabilize_gesture(3)
    confirmed = tracker._stabilize_gesture(3)
    assert confirmed == 3

    # Fluctuación esporádica no cambia el requisito de golpe
    res = tracker._stabilize_gesture(2)
    assert res == 3

def test_initial_state():
    tracker = HandTracker()
    status = tracker.get_status()
    assert status["camera_active"] is False
    assert status["camera_state"] == STATE_CAMERA_OFF
    assert status["hand_detected"] is False
    assert status["confirmed_fingers"] == 0
