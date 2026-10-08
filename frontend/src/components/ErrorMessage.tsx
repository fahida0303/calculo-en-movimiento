import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorMessageProps {
  message: string | null;
  onDismiss?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="fade-in" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 14px',
      background: 'rgba(244, 63, 94, 0.12)',
      border: '1px solid rgba(244, 63, 94, 0.35)',
      borderRadius: 'var(--radius-sm)',
      color: '#fecdd3',
      fontSize: '0.82rem',
      marginBottom: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <AlertCircle size={16} color="var(--accent-rose)" />
        <span>{message}</span>
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
};
