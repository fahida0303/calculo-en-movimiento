import React from 'react';

export interface PredefinedCard {
  id: string;
  category: string;
  expression: string;
  display: string;
}

const PREDEFINED_FUNCTIONS: PredefinedCard[] = [
  { id: 'quad', category: 'CUADRÁTICA', expression: 'x^2 - 4*x + 3', display: 'f(x) = x² - 4x + 3' },
  { id: 'rat', category: 'RACIONAL', expression: '1/x', display: 'f(x) = 1/x' },
  { id: 'log', category: 'LOGARÍTMICA', expression: 'ln(x)', display: 'f(x) = ln(x)' },
  { id: 'exp', category: 'EXPONENCIAL', expression: 'e^x', display: 'f(x) = e^x' },
  { id: 'root', category: 'RAÍZ', expression: 'sqrt(x)', display: 'f(x) = √x' },
  { id: 'trig', category: 'TRIGONOMÉTRICA', expression: 'sin(x)', display: 'f(x) = sin(x)' },
];

interface FunctionSelectorProps {
  selectedExpression: string;
  onSelect: (expression: string) => void;
}

export const FunctionSelector: React.FC<FunctionSelectorProps> = ({
  selectedExpression,
  onSelect,
}) => {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{
        fontSize: '0.8rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--text-muted)',
        display: 'block',
        marginBottom: '8px'
      }}>
        A. Funciones Predefinidas
      </label>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '8px',
      }}>
        {PREDEFINED_FUNCTIONS.map((item) => {
          const isSelected = selectedExpression === item.expression;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.expression)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                background: isSelected ? 'rgba(6, 182, 212, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                boxShadow: isSelected ? '0 0 10px rgba(6, 182, 212, 0.25)' : 'none',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              }}
            >
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: isSelected ? 'var(--accent-cyan-glow)' : 'var(--text-dim)',
                letterSpacing: '0.04em'
              }}>
                [ {item.category} ]
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: isSelected ? '#ffffff' : 'var(--text-main)',
                marginTop: '2px'
              }}>
                {item.display}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
