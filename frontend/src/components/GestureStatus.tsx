import React from 'react';
import { Hand, Sparkles } from 'lucide-react';

interface GestureStatusProps {
  detectedFingers: number;
  confirmedFingers: number;
  requirementName: string;
}

export const GestureStatus: React.FC<GestureStatusProps> = ({
  detectedFingers,
  confirmedFingers,
  requirementName,
}) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 12px',
      background: 'rgba(255, 255, 255, 0.03)',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--border-subtle)',
      marginBottom: '12px',
      fontFamily: 'var(--font-mono)',
      fontSize: '0.78rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Hand size={15} color="var(--accent-cyan)" />
        <span style={{ color: 'var(--text-muted)' }}>Mapeo:</span>
        <span style={{ color: '#ffffff', fontWeight: 600 }}>
          {detectedFingers} dedos (confirmados: {confirmedFingers})
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Sparkles size={13} color="var(--accent-emerald)" />
        <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>
          {confirmedFingers > 0 ? requirementName : 'Sin gesto confirmado'}
        </span>
      </div>
    </div>
  );
};
