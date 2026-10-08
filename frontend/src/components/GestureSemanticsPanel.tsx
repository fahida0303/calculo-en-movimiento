import React from 'react';
import { HelpCircle, Info } from 'lucide-react';

interface GestureSemanticsPanelProps {
  requirement: number;
}

const GESTURE_SEMANTICS_DATA: Record<
  number,
  {
    title: string;
    description: string;
  }
> = {
  1: {
    title: '1 Dedo: Recta Tangente',
    description:
      'Mapea la posición horizontal del dedo índice para deslizar el punto de contacto x₀ y trazar la tangente instantánea.',
  },
  2: {
    title: '2 Dedos: Recta Secante & Límite',
    description:
      'Calcula la pendiente secante promedio en [a, b] y simula la convergencia del cociente incremental cuando Δx → 0.',
  },
  3: {
    title: '3 Dedos: Función y Derivadas',
    description:
      'Renderiza simultáneamente la función original f(x), su primera derivada f\'(x) y segunda derivada f\'\'(x) en planos 3D.',
  },
  4: {
    title: '4 Dedos: Puntos Críticos y Extremos',
    description:
      'Localiza analíticamente las raíces f\'(x) = 0 y clasifica máximos, mínimos locales e inflexión mediante el criterio de concavidad.',
  },
  5: {
    title: '5 Dedos: Reto Cinemático Aplicado',
    description:
      'Modela el movimiento de una partícula unidimensional calculando trayectoria s(t), velocidad v(t) y aceleración a(t).',
  },
};

const REQUIREMENTS_MATRIX = [
  { id: 1, name: '1 Tangente & Derivada en el punto', tag: 'ACTIVO' },
  { id: 2, name: '2 Secante & Límite incremental', tag: 'Δx → 0' },
  { id: 3, name: '3 Derivadas f\'(x) y f\'\'(x)', tag: 'Curvatura' },
  { id: 4, name: '4 Extremos Relativos & Inflexión', tag: 'f\' = 0' },
  { id: 5, name: '5 Reto Cinemático: Partícula', tag: 'v(t) & a(t)' },
];

export const GestureSemanticsPanel: React.FC<GestureSemanticsPanelProps> = ({
  requirement,
}) => {
  const currentReq = requirement > 0 ? requirement : 1;
  const semantics = GESTURE_SEMANTICS_DATA[currentReq] || GESTURE_SEMANTICS_DATA[1];

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
              background: '#f5f3ff',
              color: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <HelpCircle size={15} />
          </div>
          <span
            style={{
              fontFamily: 'var(--font-main)',
              fontWeight: 800,
              fontSize: '0.88rem',
              color: '#0f172a',
            }}
          >
            Semántica del Gesto
          </span>
        </div>

        {/* Badge Requisito */}
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.68rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '9999px',
            background: '#ecfdf5',
            color: '#059669',
            border: '1px solid #a7f3d0',
          }}
        >
          Requisito {currentReq}
        </span>
      </div>

      {/* ── Current Gesture Title & Description ── */}
      <div style={{ marginBottom: '12px' }}>
        <h4
          style={{
            fontFamily: 'var(--font-main)',
            fontSize: '0.85rem',
            fontWeight: 800,
            color: '#0f172a',
            marginBottom: '4px',
          }}
        >
          {semantics.title}
        </h4>
        <p
          style={{
            fontSize: '0.72rem',
            color: '#64748b',
            lineHeight: 1.4,
            fontFamily: 'var(--font-body)',
          }}
        >
          {semantics.description}
        </p>
      </div>

      {/* ── 5 Rows Matrix ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          marginBottom: '12px',
          borderTop: '1px solid #f1f5f9',
          paddingTop: '8px',
        }}
      >
        {REQUIREMENTS_MATRIX.map((item) => {
          const isActive = item.id === requirement;
          return (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '5px 8px',
                borderRadius: '6px',
                background: isActive ? '#f0f9ff' : 'transparent',
                border: `1px solid ${isActive ? '#bae6fd' : 'transparent'}`,
                fontSize: '0.72rem',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-main)',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#0369a1' : '#475569',
                }}
              >
                {item.name}
              </span>

              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '4px',
                  background: isActive ? '#0284c7' : '#f1f5f9',
                  color: isActive ? '#ffffff' : '#64748b',
                  border: `1px solid ${isActive ? '#0284c7' : '#e2e8f0'}`,
                }}
              >
                {isActive ? 'ACTIVO' : item.tag}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Warning Callout Box ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          padding: '8px 10px',
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          fontSize: '0.7rem',
          color: '#1e40af',
          lineHeight: 1.35,
        }}
      >
        <Info size={14} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
        <span>
          <strong>Aviso:</strong> Mantén una sola mano estable en el encuadre con buena iluminación para máxima precisión geométrica.
        </span>
      </div>
    </div>
  );
};
