import React from 'react';
import { RefreshCw, Minus, Plus } from 'lucide-react';

interface RequirementPanelProps {
  requirement: number;
  paramA: number;
  paramB: number;
  onChangeParamA: (val: number) => void;
  onChangeParamB: (val: number) => void;
  onExecute: () => void;
  disabled?: boolean;
}

export const RequirementPanel: React.FC<RequirementPanelProps> = ({
  requirement,
  paramA,
  paramB,
  onChangeParamA,
  onChangeParamB,
  onExecute,
  disabled = false,
}) => {
  if (requirement === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginBottom: '16px',
        padding: '12px',
        background: 'rgba(5, 8, 17, 0.65)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 'var(--radius-sm)',
      }}
    >
      {/* ── REQ 1: Punto de Tangencia ── */}
      {requirement === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Punto de Tangencia X₀ = a
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(251, 191, 36, 0.15)',
                color: '#fbbf24',
                border: '1px solid rgba(251, 191, 36, 0.3)',
              }}
            >
              Punto Activo
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#ffffff',
              }}
            >
              a = {paramA.toFixed(2)}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                onClick={() => onChangeParamA(parseFloat((paramA - 0.5).toFixed(2)))}
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '4px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Minus size={13} />
              </button>
              <button
                type="button"
                onClick={() => onChangeParamA(parseFloat((paramA + 0.5).toFixed(2)))}
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '4px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Plus size={13} />
              </button>
            </div>
          </div>

          {/* Range slider */}
          <input
            id="param-a-slider"
            type="range"
            min="-6"
            max="6"
            step="0.1"
            value={paramA}
            onChange={(e) => onChangeParamA(parseFloat(e.target.value))}
            style={{
              width: '100%',
              accentColor: '#fbbf24',
              cursor: 'pointer',
            }}
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.65rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-dim)',
            }}
          >
            <span>-6.0</span>
            <span>0.0</span>
            <span style={{ color: '#fbbf24' }}>{paramA.toFixed(1)}</span>
            <span>+6.0</span>
          </div>
        </div>
      )}

      {/* ── REQ 2: Secante Puntos A y B ── */}
      {requirement === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
              }}
            >
              Intervalo Secante [a, b]
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                color: 'var(--accent-rose)',
              }}
            >
              Δx = {(paramB - paramA).toFixed(2)}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <span style={{ fontSize: '0.68rem', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                Punto A: x = {paramA.toFixed(2)}
              </span>
              <input
                type="range"
                min="-6"
                max="6"
                step="0.2"
                value={paramA}
                onChange={(e) => onChangeParamA(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#10b981' }}
              />
            </div>
            <div>
              <span style={{ fontSize: '0.68rem', color: '#f43f5e', fontFamily: 'var(--font-mono)' }}>
                Punto B: x = {paramB.toFixed(2)}
              </span>
              <input
                type="range"
                min="-6"
                max="6"
                step="0.2"
                value={paramB}
                onChange={(e) => onChangeParamB(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#f43f5e' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── REQ 3, 4, 5 Info ── */}
      {requirement >= 3 && (
        <div
          style={{
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            lineHeight: 1.4,
          }}
        >
          {requirement === 3 && 'Análisis global multicurva: f(x) en z=0, f\'(x) en z=1.5, f\'\'(x) en z=3.0.'}
          {requirement === 4 && 'Búsqueda analítica de raíces f\'(x) = 0 y clasificación por criterio de concavidad f\'\'.' }
          {requirement === 5 && 'Problema aplicado de cinemática/optimización contextualizado dinámicamente.'}
        </div>
      )}

      {/* ── Motor Simbólico Telemetry Footer ── */}
      <div
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          paddingTop: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          fontSize: '0.68rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-dim)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Motor Simbólico:</span>
          <span style={{ color: '#ffffff' }}>SymPy 1.13</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Convergencia:</span>
          <span style={{ color: '#10b981' }}>Analítica Exacta</span>
        </div>

        <button
          id="btn-recalcular"
          type="button"
          disabled={disabled}
          onClick={onExecute}
          style={{
            marginTop: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '7px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(6, 182, 212, 0.15)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            color: 'var(--accent-cyan-glow)',
            fontSize: '0.74rem',
            fontWeight: 700,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.4 : 1,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (!disabled) e.currentTarget.style.background = 'rgba(6, 182, 212, 0.25)';
          }}
          onMouseLeave={(e) => {
            if (!disabled) e.currentTarget.style.background = 'rgba(6, 182, 212, 0.15)';
          }}
        >
          <RefreshCw size={13} className={disabled ? 'spin-anim' : ''} />
          <span>Recalcular Análisis</span>
        </button>
      </div>
    </div>
  );
};
