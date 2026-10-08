import React from 'react';
import { Check, ArrowRight } from 'lucide-react';

interface ManualGestureSelectorProps {
  selectedRequirement: number;
  onSelectRequirement: (req: number) => void;
  disabled?: boolean;
}

const GESTURE_MODES = [
  {
    fingers: 1,
    title: 'Dedo 1: Tangente',
    subtitle: 'Punto P y recta derivada',
  },
  {
    fingers: 2,
    title: 'Dedo 2: Secante',
    subtitle: 'Límite Δx → 0 (Cociente incremental)',
  },
  {
    fingers: 3,
    title: 'Dedo 3: Derivadas',
    subtitle: 'Curvas f\'(x) y f\'\'(x) en simultáneo',
  },
  {
    fingers: 4,
    title: 'Dedo 4: Extremos',
    subtitle: 'Máximos, mínimos e inflexión',
  },
  {
    fingers: 5,
    title: 'Dedo 5: Reto Cinemático',
    subtitle: 'Trayectoria, velocidad & aceleración',
  },
];

export const ManualGestureSelector: React.FC<ManualGestureSelectorProps> = ({
  selectedRequirement,
  onSelectRequirement,
  disabled = false,
}) => {
  const activeLabel =
    selectedRequirement > 0
      ? `${selectedRequirement} Dedo${selectedRequirement > 1 ? 's' : ''} Activo`
      : 'Sin Selección';

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '14px',
        marginBottom: '12px',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
      }}
    >
      {/* Title & Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '4px',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-main)',
            fontWeight: 800,
            fontSize: '0.88rem',
            color: '#0f172a',
          }}
        >
          Dedos / Modos
        </span>

        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.68rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '9999px',
            background: selectedRequirement > 0 ? '#e0f2fe' : '#f1f5f9',
            color: selectedRequirement > 0 ? '#0284c7' : '#64748b',
            border: `1px solid ${selectedRequirement > 0 ? '#bae6fd' : '#e2e8f0'}`,
          }}
        >
          {activeLabel}
        </span>
      </div>

      <p
        style={{
          fontSize: '0.72rem',
          color: '#64748b',
          marginBottom: '10px',
          lineHeight: 1.3,
        }}
      >
        Selecciona la operación geométrica asociada a cada postura de la mano:
      </p>

      {/* 5 Finger Mode Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {GESTURE_MODES.map((mode) => {
          const isSelected = selectedRequirement === mode.fingers;
          return (
            <button
              key={mode.fingers}
              id={`btn-manual-dedo-${mode.fingers}`}
              type="button"
              disabled={disabled}
              onClick={() => onSelectRequirement(mode.fingers)}
              className={`finger-mode-card ${isSelected ? 'active' : ''}`}
              style={{
                opacity: disabled ? 0.5 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Finger number pill */}
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    background: isSelected ? '#0284c7' : '#f1f5f9',
                    color: isSelected ? '#ffffff' : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {mode.fingers}
                </div>

                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-main)',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      color: isSelected ? '#0369a1' : '#1e293b',
                    }}
                  >
                    {mode.title}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.68rem',
                      color: isSelected ? '#0284c7' : '#64748b',
                    }}
                  >
                    {mode.subtitle}
                  </div>
                </div>
              </div>

              {/* Status indicator icon */}
              <div>
                {isSelected ? (
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#e0f2fe',
                      color: '#0284c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Check size={13} strokeWidth={2.5} />
                  </div>
                ) : (
                  <ArrowRight size={14} color="#94a3b8" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
