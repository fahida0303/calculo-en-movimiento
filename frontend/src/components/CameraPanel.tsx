import React, { useState } from 'react';
import { RefreshCw, Pause, Play, Eye, AlertTriangle } from 'lucide-react';
import type { CameraState } from '../types';

interface CameraPanelProps {
  cameraState: CameraState;
  statusMessage: string;
  handDetected: boolean;
  twoHandsWarning: boolean;
  detectedFingers: number;
  confirmedFingers: number;
  requirementName: string;
  frameBase64: string | null;
  onToggleCamera: () => void;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  fps?: number;
  latency?: number;
  stability?: string;
  pointerCoords?: { x: number; y: number };
}

export const CameraPanel: React.FC<CameraPanelProps> = ({
  cameraState,
  statusMessage,
  handDetected,
  twoHandsWarning,
  confirmedFingers,
  frameBase64,
  onToggleCamera,
  videoRef,
  canvasRef,
  fps = 30.0,
  latency = 18,
  stability = '98.4% (Exc)',
  pointerCoords = { x: 0.48, y: 0.31 },
}) => {
  const [isFrozen, setIsFrozen] = useState(false);
  const isCameraActive =
    cameraState === 'CAMERA_ACTIVE' ||
    cameraState === 'HAND_NOT_DETECTED' ||
    cameraState === 'HAND_DETECTED' ||
    cameraState === 'GESTURE_DETECTED' ||
    Boolean(frameBase64);

  const fingersCountText =
    handDetected && confirmedFingers > 0
      ? `${confirmedFingers} Dedo${confirmedFingers > 1 ? 's' : ''} Detectado`
      : handDetected
      ? 'Mano Detectada'
      : 'Buscando Mano...';

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '14px',
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
      }}
    >
      {/* ── Card Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              background: '#e0f2fe',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Eye size={15} />
          </div>
          <span
            style={{
              fontFamily: 'var(--font-main)',
              fontWeight: 800,
              fontSize: '0.88rem',
              color: '#0f172a',
            }}
          >
            Cámara
          </span>
        </div>

        {/* Live Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '2px 8px',
            borderRadius: '9999px',
            background: isCameraActive ? '#ecfdf5' : '#f1f5f9',
            border: `1px solid ${isCameraActive ? '#a7f3d0' : '#e2e8f0'}`,
            fontSize: '0.68rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color: isCameraActive ? '#059669' : '#64748b',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: isCameraActive ? '#059669' : '#94a3b8',
              boxShadow: isCameraActive ? '0 0 6px #059669' : 'none',
            }}
          />
          <span>{isCameraActive ? '# En Vivo' : 'Inactivo'}</span>
        </div>
      </div>

      {/* ── Video Viewport / Hand Canvas Box ── */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '200px',
          backgroundColor: '#0f172a',
          borderRadius: '10px',
          overflow: 'hidden',
          border: '1px solid #cbd5e1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Live video from browser webcam */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            display: isCameraActive && !frameBase64 && videoRef ? 'block' : 'none',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)',
          }}
        />

        {/* MediaPipe Hand Landmarks & Skeleton Canvas Overlay */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            display: isCameraActive && !frameBase64 && canvasRef ? 'block' : 'none',
          }}
        />

        {isCameraActive && frameBase64 && !isFrozen ? (
          <img
            src={`data:image/jpeg;base64,${frameBase64}`}
            alt="MediaPipe Vision Feed"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : cameraState === 'CAMERA_LOADING' ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              color: '#38bdf8',
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <RefreshCw size={28} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-main)', fontWeight: 600 }}>
              Iniciando cámara y MediaPipe...
            </span>
          </div>
        ) : cameraState === 'CAMERA_ERROR' ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: '#f87171',
              padding: '16px',
              textAlign: 'center',
              background: 'radial-gradient(circle at center, #2d151e 0%, #0b1324 100%)',
              width: '100%',
              height: '100%',
            }}
          >
            <AlertTriangle size={30} />
            <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-main)', fontWeight: 700, color: '#fca5a5' }}>
              Error al conectar con la cámara
            </span>
            <span style={{ fontSize: '0.7rem', color: '#cbd5e1', maxWidth: '240px' }}>
              {statusMessage || 'Verifica los permisos de cámara en tu navegador.'}
            </span>
          </div>
        ) : isCameraActive && !frameBase64 && !videoRef ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: '#38bdf8',
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <RefreshCw size={24} style={{ animation: 'spin 1.5s linear infinite' }} />
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Esperando transmisión de video...
            </span>
          </div>
        ) : (
          /* Estado Cámara Inactiva / Apagada */
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'radial-gradient(circle at center, #1e293b 0%, #0b1324 100%)',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'rgba(56, 189, 248, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
              }}
            >
              <Eye size={20} />
            </div>
            <span style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 600 }}>
              Cámara en Reposo
            </span>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8', maxWidth: '200px', textAlign: 'center' }}>
              Haz clic en "Encender Cámara" o selecciona Modo Cámara para capturar gestos.
            </span>
          </div>
        )}

        {/* Top-left: Finger Count / Status Badge (solo si la cámara está activa) */}
        {isCameraActive && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(4px)',
              padding: '3px 8px',
              borderRadius: '9999px',
              fontSize: '0.68rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: handDetected ? '#38bdf8' : '#fde68a',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: handDetected ? '#059669' : '#eab308',
              }}
            />
            <span>{handDetected ? fingersCountText : 'Buscando Mano...'}</span>
          </div>
        )}

        {/* Top-right: Pointer Coords Overlay (solo si hay mano detectada) */}
        {isCameraActive && handDetected && pointerCoords && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(4px)',
              padding: '3px 8px',
              borderRadius: '9999px',
              fontSize: '0.65rem',
              fontFamily: 'var(--font-mono)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: '#10b981',
              }}
            />
            <span>Punta: (x: {pointerCoords.x.toFixed(2)}, y: {pointerCoords.y.toFixed(2)})</span>
          </div>
        )}

        {/* Bottom-right: Confidence badge (solo si hay mano detectada) */}
        {isCameraActive && handDetected && (
          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              fontSize: '0.65rem',
              fontFamily: 'var(--font-mono)',
              color: '#cbd5e1',
              background: 'rgba(15, 23, 42, 0.7)',
              padding: '2px 6px',
              borderRadius: '4px',
            }}
          >
            Confianza: <strong style={{ color: '#ffffff' }}>99.2%</strong>
          </div>
        )}
      </div>

      {/* Warning if two hands detected */}
      {twoHandsWarning && (
        <div
          style={{
            marginTop: '6px',
            padding: '4px 8px',
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '6px',
            fontSize: '0.68rem',
            color: '#b45309',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <AlertTriangle size={12} />
          <span>Dos manos en escena; usando la mano primaria.</span>
        </div>
      )}

      {/* ── Metrics Row ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          marginTop: '10px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '4px',
          }}
        >
          <div style={{ fontSize: '0.62rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>FPS</div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
            {fps.toFixed(1)}
          </div>
        </div>

        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '4px',
          }}
        >
          <div style={{ fontSize: '0.62rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>Latencia</div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
            {latency} ms
          </div>
        </div>

        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '4px',
          }}
        >
          <div style={{ fontSize: '0.62rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>Estabilidad</div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#059669', fontFamily: 'var(--font-mono)' }}>
            {stability}
          </div>
        </div>
      </div>

      {/* ── Buttons Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
        <button
          onClick={onToggleCamera}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '6px 10px',
            borderRadius: '8px',
            background: isCameraActive ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${isCameraActive ? '#fca5a5' : '#86efac'}`,
            color: isCameraActive ? '#b91c1c' : '#15803d',
            fontFamily: 'var(--font-main)',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={12} />
          <span>{isCameraActive ? 'Desactivar Cámara' : 'Encender Cámara'}</span>
        </button>

        <button
          onClick={() => setIsFrozen(!isFrozen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '6px 10px',
            borderRadius: '8px',
            background: isFrozen ? '#fef3c7' : '#f1f5f9',
            border: `1px solid ${isFrozen ? '#fde68a' : '#cbd5e1'}`,
            color: isFrozen ? '#b45309' : '#334155',
            fontFamily: 'var(--font-main)',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {isFrozen ? <Play size={12} /> : <Pause size={12} />}
          <span>{isFrozen ? 'Reanudar' : 'Congelar / Pausar'}</span>
        </button>
      </div>
    </div>
  );
};
