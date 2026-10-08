# CÁLCULO EN MOVIMIENTO
### Aplicación Interactiva de Cálculo + Visión Artificial + Visualización 3D

**Cálculo en Movimiento** es una aplicación educativa e interactiva de vanguardia que integra cálculo diferencial matemático analítico, visión artificial en tiempo real (MediaPipe + OpenCV), detección de gestos y dedos, y visualización tridimensional fluida con Three.js en un dashboard de alto impacto estético.

---

## 1. Principio Fundamental de la Aplicación

La aplicación sigue estrictamente la siguiente regla arquitectónica:

> **PROHIBIDO:** "Seleccionar una función y mostrar inmediatamente la gráfica matemática."

### Flujo en 9 Pasos:
1. **PASO 1:** Seleccionar o escribir una función matemática (`f(x)`).
2. **PASO 2:** Validar la función matemática mediante el parser seguro en SymPy.
3. **PASO 3:** Mostrar la función seleccionada y su tipo, **sin** mostrar todavía la gráfica matemática final.
4. **PASO 4:** Elegir **MODO CÁMARA** o **MODO MANUAL**.
5. **PASO 5:** Determinar una cantidad de dedos del 1 al 5 (por reconocimiento de mano o botones manuales).
6. **PASO 6:** La cantidad de dedos confirmados activa el requisito matemático correspondiente.
7. **PASO 7:** Ejecutar el cálculo matemático en el motor analítico seguro.
8. **PASO 8:** **AHORA Y SOLO AHORA** mostrar la visualización matemática.
9. **PASO 9:** Mostrar la gráfica 3D interactiva, resultados analíticos, coordenadas (X, Y, Z con 3 decimales) y líneas auxiliares.

---

## 2. Mapeo de Gestos y Requisitos

| Gesto (Dedos) | Requisito Matemático | Elementos Visuales y Analíticos |
| :--- | :--- | :--- |
| **1 Dedo** | **Evaluación y Pendiente** | Punto $(a, f(a))$, pendiente $f'(a)$, recta tangente visualizada en 3D. |
| **2 Dedos** | **Secante y Razón de Cambio** | Puntos $A$ y $B$, recta secante, razón promedio $\frac{f(b)-f(a)}{b-a}$. |
| **3 Dedos** | **Función y Derivadas** | Curva original $f(x)$, primera derivada $f'(x)$ y segunda derivada $f''(x)$ en planos 3D. |
| **4 Dedos** | **Puntos Críticos** | Búsqueda de $f'(x)=0$, clasificación analítica (máximos y mínimos locales) con anillos HUD. |
| **5 Dedos** | **Desafío Aplicado** | Planteamiento contextualizado a la función, variable física, cálculo y resultado numérico. |

*Nota: 0 dedos indica "Sin gesto confirmado". Si se detectan dos manos, el sistema utiliza la mano principal y emite una advertencia en pantalla.*

---

## 3. Arquitectura del Sistema

```
proyecto prima/
├── backend/
│   ├── api/
│   │   ├── __init__.py
│   │   └── main.py              # Endpoints FastAPI y WebSocket de streaming
│   ├── math/
│   │   ├── __init__.py
│   │   ├── parser.py            # Parser seguro SymPy (sin eval inseguro)
│   │   └── engine.py            # Motor analítico, dominios y generación de datos 3D
│   └── vision/
│       ├── __init__.py
│       ├── hand_tracker.py      # Rastreo OpenCV + MediaPipe HandLandmarker + Estabilización
│       └── models/
│           └── hand_landmarker.task
├── frontend/
│   ├── src/
│   │   ├── components/          # Componentes modulares React
│   │   │   ├── Header.tsx
│   │   │   ├── FunctionSelector.tsx
│   │   │   ├── FunctionInput.tsx
│   │   │   ├── FunctionTypeBadge.tsx
│   │   │   ├── ModeSelector.tsx
│   │   │   ├── ManualGestureSelector.tsx
│   │   │   ├── GestureStatus.tsx
│   │   │   ├── CameraPanel.tsx
│   │   │   ├── Graph3D.tsx
│   │   │   ├── GraphControls.tsx
│   │   │   ├── RequirementPanel.tsx
│   │   │   ├── ResultsPanel.tsx
│   │   │   ├── SystemStatus.tsx
│   │   │   ├── InstructionPanel.tsx
│   │   │   ├── HistoryPanel.tsx
│   │   │   ├── ErrorMessage.tsx
│   │   │   └── LoadingState.tsx
│   │   ├── types.ts             # Tipos TypeScript estrictos
│   │   ├── App.tsx              # Orquestador del estado y ciclo de vida
│   │   └── index.css            # Sistema de diseño futurista dark/neon
│   └── package.json
└── tests/
    ├── test_math.py             # Pruebas analíticas, dominios y casos extremos
    ├── test_vision.py           # Pruebas de estabilización y máquina de estados
    └── test_api.py              # Pruebas de integración FastAPI
```

---

## 4. Instalación y Ejecución

### Prerrequisitos:
- Python 3.10+
- Node.js 18+

### 4.1 Backend (Python)
Desde la raíz del proyecto:
```bash
# Ejecutar pruebas unitarias completas
python -m pytest

# Iniciar servidor backend FastAPI
python -m uvicorn backend.api.main:app --host 0.0.0.0 --port 8000 --reload
```

El servidor estará activo en `http://localhost:8000` con documentación interactiva en `http://localhost:8000/docs`.

### 4.2 Frontend (React + Vite + Three.js)
En una terminal separada, navegar a `frontend`:
```bash
cd frontend

# Validar compilación de producción y tipos
npm run build

# Iniciar servidor de desarrollo Vite
npm run dev
```

La aplicación abrirá en `http://localhost:5173`.

---

## 5. Pruebas y Validación

La suite de pruebas automatizadas cubre:
- Validación y clasificación de funciones matemáticas (cuadráticas, trigonométricas, exponenciales, racionales, raíces).
- Respeto a dominios matemáticos ($\ln(x)$ para $x>0$, $\frac{1}{x}$ sin conectar discontinuidades, $\sqrt{x}$ para $x \ge 0$).
- Evaluación y derivada exacta de $f(x) = x^2$ ($f(2)=4$, $f'(2)=4$, $f''(x)=2$).
- Razón de cambio secante y validación ante $b = a$.
- Puntos críticos y clasificación con el criterio de la segunda derivada.
- Estabilización temporal del reconocedor de gestos (ventana deslizante que evita cambios bruscos).
- Resistencia ante errores de cámara o permisos sin bloquear la interfaz.
