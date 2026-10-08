import React from 'react';

interface FooterProps {
  latency?: string;
  fps?: number;
  precision?: string;
}

export const Footer: React.FC<FooterProps> = ({
  latency = '<15ms',
  fps = 60.0,
  precision = 'Float64',
}) => {
  return (
    <footer
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        marginTop: '16px',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        fontSize: '0.72rem',
        fontFamily: 'var(--font-mono)',
        color: '#64748b',
        boxShadow: '0 1px 6px rgba(15, 23, 42, 0.02)',
      }}
    >
      <div>
        <strong style={{ color: '#0f172a' }}>Cálculo en Movimiento</strong> • Motor Gráfico WebGL & Pipeline MediaPipe
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669' }} />
          <span>Latencia: <strong style={{ color: '#0f172a' }}>{latency}</strong></span>
        </div>
        <span>FPS: <strong style={{ color: '#0f172a' }}>{fps.toFixed(1)}</strong></span>
        <span>Precisión: <strong style={{ color: '#0284c7' }}>{precision}</strong></span>
      </div>
    </footer>
  );
};
