import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { ModeSelector } from './components/ModeSelector';
import { ManualGestureSelector } from './components/ManualGestureSelector';
import { FunctionInput } from './components/FunctionInput';
import { Graph3D } from './components/Graph3D';
import { ParameterSlider } from './components/ParameterSlider';
import { ResultsPanel } from './components/ResultsPanel';
import { MathVerificationPanel } from './components/MathVerificationPanel';
import { CameraPanel } from './components/CameraPanel';
import { GestureSemanticsPanel } from './components/GestureSemanticsPanel';
import { Footer } from './components/Footer';
import { ErrorMessage } from './components/ErrorMessage';
import { LoadingState } from './components/LoadingState';

import type {
  AppMode,
  CameraState,
  CalculationStatus,
  GraphStatus,
  GraphData,
  CalculationResults,
} from './types';

const RAW_API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.trim() || 'http://localhost:8000';
const API_BASE = RAW_API_BASE.replace(/\/+$/, '');
const WS_BASE = (import.meta.env.VITE_WS_BASE as string | undefined)?.trim() || (
  API_BASE.startsWith('https://') 
    ? API_BASE.replace('https://', 'wss://') + '/ws/vision'
    : API_BASE.replace('http://', 'ws://') + '/ws/vision'
);

const REQUIREMENT_NAMES: Record<number, string> = {
  1: 'EVALUACIÓN Y PENDIENTE',
  2: 'SECANTE Y RAZÓN DE CAMBIO',
  3: 'FUNCIÓN Y DERIVADAS',
  4: 'PUNTOS CRÍTICOS',
  5: 'DESAFÍO APLICADO',
};

export const App: React.FC = () => {
  // 1. Estado de la función matemática
  const [functionExpression, setFunctionExpression] = useState<string>('x^2 - 4*x + 3');
  const [functionType, setFunctionType] = useState<string>('Cuadrática');
  const [isValidFunction, setIsValidFunction] = useState<boolean>(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  // 2. Modo de interacción
  const [mode, setMode] = useState<AppMode>('MANUAL');

  // 3. Estado de la cámara y visión
  const [cameraState, setCameraState] = useState<CameraState>('CAMERA_OFF');
  const [statusMessage, setStatusMessage] = useState<string>('Cámara desactivada.');
  const [handDetected, setHandDetected] = useState<boolean>(false);
  const [twoHandsWarning, setTwoHandsWarning] = useState<boolean>(false);
  const [detectedFingers, setDetectedFingers] = useState<number>(0);
  const [confirmedFingers, setConfirmedFingers] = useState<number>(1);
  const [cameraFrame, setCameraFrame] = useState<string | null>(null);

  // 4. Requisito seleccionado (1..5) - Default a 1 para mostrar el dashboard activo
  const [requirement, setRequirement] = useState<number>(1);

  // Parámetros de requisito
  const [paramA, setParamA] = useState<number>(2.0);
  const [paramB, setParamB] = useState<number>(4.0);

  // 5. Estado de cálculo y resultados
  const [calculationStatus, setCalculationStatus] = useState<CalculationStatus>('IDLE');
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [coordinates, setCoordinates] = useState<{ X: string; Y: string; Z: string }>({
    X: '2.000',
    Y: '-1.000',
    Z: '0.000',
  });

  // 6. Estado de la gráfica 3D
  const [graphStatus, setGraphStatus] = useState<GraphStatus>('READY');
  const [graphData, setGraphData] = useState<GraphData | null>(null);

  // 7. Errores globales y pestaña activa
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'simulation' | 'tutorials'>('simulation');

  const wsRef = useRef<WebSocket | null>(null);
  const prevConfirmedFingersRef = useRef<number>(0);

  // Refs para evitar problemas de cierres obsoletos (stale closures)
  const functionExprRef = useRef<string>(functionExpression);
  const modeRef = useRef<AppMode>(mode);
  const requirementRef = useRef<number>(requirement);
  const paramARef = useRef<number>(paramA);
  const paramBRef = useRef<number>(paramB);
  const executeCalcRef = useRef<((req: number, expr?: string, aVal?: number, bVal?: number) => Promise<void>) | null>(null);

  useEffect(() => {
    functionExprRef.current = functionExpression;
    modeRef.current = mode;
    requirementRef.current = requirement;
    paramARef.current = paramA;
    paramBRef.current = paramB;
  }, [functionExpression, mode, requirement, paramA, paramB]);

  // Validar función en el backend (PASO 2)
  const validateFunction = useCallback(async (expr: string) => {
    if (!expr || !expr.trim()) {
      setIsValidFunction(false);
      setValidationError('La expresión está vacía.');
      setFunctionType('');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expression: expr }),
      });
      const data = await res.json();
      if (res.ok && data.is_valid) {
        setIsValidFunction(true);
        setValidationError(null);
        setFunctionType(data.function_type);
      } else {
        setIsValidFunction(false);
        setValidationError(data.error_message || 'Función matemática no válida');
        setFunctionType('');
      }
    } catch {
      // Fallback local básico
      setIsValidFunction(true);
      setValidationError(null);
      setFunctionType('General');
    }
  }, []);

  // Ejecutar el cálculo del requisito seleccionado
  const executeRequirementCalculation = useCallback(
    async (reqNum: number, overrideExpr?: string, overrideA?: number, overrideB?: number) => {
      const expr = (overrideExpr !== undefined ? overrideExpr : functionExprRef.current)?.trim();
      const aVal = overrideA !== undefined ? overrideA : paramARef.current;
      const bVal = overrideB !== undefined ? overrideB : paramBRef.current;

      if (reqNum < 1 || reqNum > 5) return;
      if (!expr) {
        setGlobalError('No se puede calcular con una función vacía.');
        return;
      }

      setCalculationStatus('CALCULATING');
      setGlobalError(null);

      try {
        const res = await fetch(`${API_BASE}/api/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            function: expr,
            mode: modeRef.current,
            requirement: reqNum,
            parameters: { a: aVal, b: bVal },
          }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setResults(data.results);
          setGraphData(data.graph_data);
          setCoordinates(data.coordinates || { X: aVal.toFixed(3), Y: '0.000', Z: '0.000' });
          setGraphStatus('READY');
          setCalculationStatus('COMPLETED');
          setRequirement(reqNum);
          setConfirmedFingers(reqNum);
        } else {
          setCalculationStatus('ERROR');
          setGlobalError(data.errors || 'Error en el cálculo matemático');
        }
      } catch (err: any) {
        setCalculationStatus('ERROR');
        setGlobalError(`Error de comunicación con el backend: ${err.message}`);
      }
    },
    []
  );

  useEffect(() => {
    executeCalcRef.current = executeRequirementCalculation;
  }, [executeRequirementCalculation]);

  // Al inicio: calcular requisito 1 automáticamente para poblar el observatorio inicial
  useEffect(() => {
    executeRequirementCalculation(1, 'x^2 - 4*x + 3', 2.0, 4.0);
  }, [executeRequirementCalculation]);

  // Al seleccionar tarjeta predefinida
  const handleSelectPredefined = (expr: string) => {
    setFunctionExpression(expr);
    functionExprRef.current = expr;
    validateFunction(expr);
    const reqToRun = requirementRef.current > 0 ? requirementRef.current : 1;
    executeRequirementCalculation(reqToRun, expr);
  };

  // Al escribir en el input de función
  const handleFunctionInputChange = (val: string) => {
    setFunctionExpression(val);
    functionExprRef.current = val;
    validateFunction(val);
  };

  // Manejo de cambio de modo (Manual vs Cámara)
  const handleSelectMode = (newMode: AppMode) => {
    if (newMode === 'MANUAL') {
      stopCameraBackend();
      setCameraState('CAMERA_OFF');
      setStatusMessage('Cámara desactivada.');
      setHandDetected(false);
      setDetectedFingers(0);
      setCameraFrame(null);
      setMode('MANUAL');
    } else {
      setMode('CAMERA');
      startCameraBackend();
    }
  };

  // Control de cámara en el backend
  const startCameraBackend = async () => {
    setCameraState('CAMERA_LOADING');
    setStatusMessage('Inicializando cámara...');
    try {
      const res = await fetch(`${API_BASE}/api/camera/start`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setCameraState('CAMERA_ACTIVE');
        setStatusMessage('Cámara activa. Muestra tu mano.');
        connectWebSocket();
      } else {
        setCameraState('CAMERA_ERROR');
        setStatusMessage(
          data.error || 'No se encontró una cámara disponible. Puedes utilizar Modo Manual.'
        );
      }
    } catch {
      setCameraState('CAMERA_ERROR');
      setStatusMessage('No se pudo conectar con el servicio de cámara.');
    }
  };

  const stopCameraBackend = async () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    try {
      await fetch(`${API_BASE}/api/camera/stop`, { method: 'POST' });
    } catch {
      // Ignorar errores al cerrar
    }
  };

  // Conexión WebSocket para streaming en tiempo real
  const connectWebSocket = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(WS_BASE);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          setHandDetected(payload.hand_detected);
          setTwoHandsWarning(payload.two_hands_warning || false);
          setDetectedFingers(payload.detected_fingers || 0);

          const confirmed = payload.confirmed_fingers || 0;
          setConfirmedFingers(confirmed > 0 ? confirmed : 1);

          if (payload.frame) {
            setCameraFrame(payload.frame);
          }
          if (payload.camera_state) {
            setCameraState(payload.camera_state);
          }
          if (payload.status_message) {
            setStatusMessage(payload.status_message);
          }

          if (confirmed === 0) {
            prevConfirmedFingersRef.current = 0;
          } else if (confirmed > 0 && confirmed <= 5 && confirmed !== prevConfirmedFingersRef.current) {
            prevConfirmedFingersRef.current = confirmed;
            executeCalcRef.current?.(confirmed);
          }
        } catch {
          // Ignorar frames con error de parse
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
      };
    } catch {
      // Manejar falla silenciosamente
    }
  };

  // Botón [ REINICIAR ]
  const handleReset = () => {
    stopCameraBackend();
    setFunctionExpression('x^2 - 4*x + 3');
    setFunctionType('Cuadrática');
    setIsValidFunction(true);
    setValidationError(null);
    setMode('MANUAL');
    setCameraState('CAMERA_OFF');
    setStatusMessage('Cámara desactivada.');
    setHandDetected(false);
    setTwoHandsWarning(false);
    setDetectedFingers(0);
    setConfirmedFingers(1);
    setCameraFrame(null);
    setRequirement(1);
    setParamA(2.0);
    setParamB(4.0);
    executeRequirementCalculation(1, 'x^2 - 4*x + 3', 2.0, 4.0);
  };

  // Botón [ LIMPIAR ]
  const handleClear = () => {
    setResults(null);
    setGraphData(null);
    setGraphStatus('HIDDEN');
    setRequirement(0);
    setCalculationStatus('IDLE');
    setGlobalError(null);
  };

  // Variación del parámetro x₀
  const handleParamSliderChange = (newVal: number) => {
    setParamA(newVal);
    paramARef.current = newVal;
    const currentReq = requirementRef.current > 0 ? requirementRef.current : 1;
    executeRequirementCalculation(currentReq, functionExprRef.current, newVal, paramBRef.current);
  };

  return (
    <div style={{ maxWidth: '1680px', margin: '0 auto', padding: '12px 18px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── Top Header Bar & Breadcrumb Ribbon (Matching Image 1) ── */}
      <Header
        onReset={handleReset}
        onClear={handleClear}
        systemReady={isValidFunction}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        fps={60}
      />

      <ErrorMessage
        message={globalError}
        onDismiss={() => setGlobalError(null)}
      />

      {/* ── Main 3-Column Dashboard Layout (Exact to Image 1) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '320px minmax(520px, 1fr) 300px',
          gap: '14px',
          alignItems: 'start',
          flex: 1,
        }}
      >
        {/* ================= COLUMNA 1 (IZQUIERDA) ================= */}
        <aside style={{ display: 'flex', flexDirection: 'column' }}>
          {/* 1. Selector de Modo (Cámara IA vs Manual) */}
          <ModeSelector
            currentMode={mode}
            onSelectMode={handleSelectMode}
            disabled={!isValidFunction}
          />

          {/* 2. Tarjeta Dedos / Modos (1 a 5) - Visible ÚNICAMENTE en Modo Manual */}
          {mode === 'MANUAL' ? (
            <ManualGestureSelector
              selectedRequirement={requirement}
              onSelectRequirement={(req) => executeRequirementCalculation(req)}
              disabled={!isValidFunction}
            />
          ) : (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: '10px',
                boxShadow: '0 1px 4px rgba(15, 23, 42, 0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '1rem' }}>📷</span>
                <span style={{ fontWeight: 800, fontSize: '0.84rem', color: '#0f172a' }}>
                  Modo Cámara Activo
                </span>
              </div>
              <p style={{ fontSize: '0.74rem', color: '#64748b', lineHeight: 1.45, margin: '0 0 8px 0' }}>
                El reconocimiento de dedos se realiza automáticamente frente a la cámara.
              </p>
              <div
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  fontSize: '0.72rem',
                  color: '#15803d',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>●</span>
                <span>
                  {requirement > 0
                    ? `Requisito ${requirement}: ${REQUIREMENT_NAMES[requirement]}`
                    : 'Muestra de 1 a 5 dedos'}
                </span>
              </div>
            </div>
          )}

          {/* 3. Expresión f(x) con teclado científico 4x4 y acordiones */}
          <FunctionInput
            value={functionExpression}
            onChange={handleFunctionInputChange}
            isValid={isValidFunction}
            functionType={functionType}
            errorMessage={validationError}
            onSelectPredefined={handleSelectPredefined}
            onSubmit={() => {
              const reqToRun = requirementRef.current > 0 ? requirementRef.current : 1;
              executeRequirementCalculation(reqToRun);
            }}
          />
        </aside>

        {/* ================= COLUMNA 2 (CENTRAL): VISUALIZADOR 3D & EVALUACIÓN ================= */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* 1. Contenedor del Canvas 3D */}
          <div
            style={{
              position: 'relative',
              height: '490px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(15, 23, 42, 0.04)',
            }}
          >
            {calculationStatus === 'CALCULATING' && (
              <div
                style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  zIndex: 25,
                }}
              >
                <LoadingState />
              </div>
            )}

            {graphStatus === 'READY' && graphData ? (
              <Graph3D
                graphData={graphData}
                requirement={requirement}
                coordinates={coordinates}
                functionExpression={functionExpression}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f8fafc',
                  padding: '24px',
                  textAlign: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: '#e0f2fe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #bae6fd',
                  }}
                >
                  <span style={{ fontSize: '1.8rem', color: '#0284c7' }}>∫</span>
                </div>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                    Visualización Matemática en Espera
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', maxWidth: '440px' }}>
                    Selecciona una postura del 1 al 5 en el panel lateral para renderizar la curva analítica tridimensional.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 2. Parámetro x₀ / t Slider (con step buttons y auto-play) */}
          <ParameterSlider
            paramValue={paramA}
            min={-5.0}
            max={5.0}
            step={0.05}
            label={requirement === 5 ? "Instante temporal t" : "Parámetro x₀"}
            onChange={handleParamSliderChange}
            disabled={calculationStatus === 'CALCULATING'}
          />

          {/* 3. Panel de 3 Tarjetas de Evaluación */}
          <ResultsPanel
            functionExpression={functionExpression}
            functionType={functionType}
            requirement={requirement}
            results={results}
          />

          {/* 4. Panel de Verificación Matemática Independiente (FASE 16) */}
          <MathVerificationPanel
            functionExpression={functionExpression}
            requirement={requirement}
            paramA={paramA}
            paramB={paramB}
            results={results}
            isValid={isValidFunction}
          />
        </main>

        {/* ================= COLUMNA 3 (DERECHA): MEDIA PIPE & SEMÁNTICA ================= */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* 1. Visión IA MediaPipe (Video, FPS, Latencia, Estabilidad) */}
          <CameraPanel
            cameraState={cameraState}
            statusMessage={statusMessage}
            handDetected={handDetected}
            twoHandsWarning={twoHandsWarning}
            detectedFingers={detectedFingers}
            confirmedFingers={confirmedFingers}
            requirementName={requirement > 0 ? REQUIREMENT_NAMES[requirement] : 'Sin requisito'}
            frameBase64={cameraFrame}
            onToggleCamera={() => {
              const isRunning =
                cameraState === 'CAMERA_ACTIVE' ||
                cameraState === 'HAND_NOT_DETECTED' ||
                cameraState === 'HAND_DETECTED' ||
                cameraState === 'GESTURE_DETECTED' ||
                Boolean(cameraFrame);

              if (isRunning) {
                stopCameraBackend();
                setCameraState('CAMERA_OFF');
                setMode('MANUAL');
              } else {
                setMode('CAMERA');
                startCameraBackend();
              }
            }}
            fps={30.0}
            latency={18}
            stability="98.4% (Exc)"
            pointerCoords={{ x: 0.48, y: 0.31 }}
          />

          {/* 2. Semántica del Gesto (Requisito activo, descripción, 5 estados, aviso) */}
          <GestureSemanticsPanel requirement={requirement} />
        </aside>
      </div>

      {/* ── Footer Bar (Matching Image 1) ── */}
      <Footer
        latency="<15ms"
        fps={60.0}
        precision="Float64"
      />
    </div>
  );
};

export default App;
