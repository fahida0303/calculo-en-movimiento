import React from 'react';
import { RotateCw, RotateCcw, ZoomIn, ZoomOut, Compass } from 'lucide-react';

interface GraphControlsProps {
  onResetView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onTopView?: () => void;
  onPerspectiveView?: () => void;
  is2DView?: boolean;
  azimuth?: number;
  elevation?: number;
}

export const GraphControls: React.FC<GraphControlsProps> = ({
  onResetView,
  onZoomIn,
  onZoomOut,
  onTopView,
  onPerspectiveView,
  is2DView = false,
  azimuth = 7,
  elevation = 5,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'rgba(9, 14, 26, 0.90)',
        backdropFilter: 'blur(12px)',
        padding: '5px 12px',
        borderRadius: '9999px',
        border: '1px solid rgba(255, 255, 255, 0.10)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* 3D Orbit */}
      {onPerspectiveView && (
        <button
          onClick={onPerspectiveView}
          title="Vista 3D Libre"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            borderRadius: '9999px',
            background: !is2DView ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
            color: !is2DView ? '#38bdf8' : '#94a3b8',
            border: !is2DView ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid transparent',
            fontFamily: 'var(--font-main, sans-serif)',
            fontSize: '0.72rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <RotateCw size={12} />
          <span>Órbita 3D</span>
        </button>
      )}

      {/* Reset */}
      <button
        onClick={onResetView}
        title="Restablecer Encuadre Centrado"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 10px',
          borderRadius: '9999px',
          background: 'rgba(255, 255, 255, 0.05)',
          color: '#cbd5e1',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          fontFamily: 'var(--font-main, sans-serif)',
          fontSize: '0.72rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        <RotateCcw size={12} />
        <span>Centrar</span>
      </button>

      {/* Zoom In */}
      <button
        onClick={onZoomIn}
        title="Acercar (Zoom +)"
        style={{
          width: '26px',
          height: '26px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          color: '#f8fafc',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        <ZoomIn size={13} />
      </button>

      {/* Zoom Out */}
      <button
        onClick={onZoomOut}
        title="Alejar (Zoom -)"
        style={{
          width: '26px',
          height: '26px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          color: '#f8fafc',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        <ZoomOut size={13} />
      </button>

      {/* 2D Plano */}
      {onTopView && (
        <button
          onClick={onTopView}
          title="Vista 2D Frontal Directa"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            borderRadius: '9999px',
            background: is2DView ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
            color: is2DView ? '#38bdf8' : '#94a3b8',
            border: is2DView ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid transparent',
            fontFamily: 'var(--font-main, sans-serif)',
            fontSize: '0.72rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Compass size={12} />
          <span>2D Plano</span>
        </button>
      )}

      <div style={{ width: '1px', height: '16px', background: 'rgba(255, 255, 255, 0.12)', margin: '0 4px' }} />

      {/* Azimuth / Elevation telemetry */}
      <span
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '0.68rem',
          color: '#94a3b8',
          paddingRight: '4px',
        }}
      >
        Az: {azimuth}° | El: {elevation}°
      </span>
    </div>
  );
};
