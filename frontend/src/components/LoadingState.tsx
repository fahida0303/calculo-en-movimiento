import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Calculando...' }) => {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 12px',
      background: 'rgba(6, 182, 212, 0.15)',
      border: '1px solid rgba(6, 182, 212, 0.3)',
      borderRadius: 'var(--radius-sm)',
      color: 'var(--accent-cyan)',
      fontSize: '0.8rem',
      fontWeight: 600,
    }}>
      <Loader2 size={15} className="pulse-active" style={{ animation: 'spin 1s linear infinite' }} />
      <span>{message}</span>
    </div>
  );
};
