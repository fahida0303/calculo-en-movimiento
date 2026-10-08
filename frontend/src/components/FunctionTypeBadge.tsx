import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface FunctionTypeBadgeProps {
  isValid: boolean;
  functionType: string;
  errorMessage: string | null;
}

export const FunctionTypeBadge: React.FC<FunctionTypeBadgeProps> = ({
  isValid,
  functionType,
  errorMessage,
}) => {
  if (!functionType && !errorMessage) return null;

  if (isValid) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
        <div className="badge badge-valid">
          <CheckCircle2 size={13} />
          <span>✓ Función válida</span>
        </div>
        <div className="badge badge-info">
          <span>Tipo: {functionType || "General"}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
      <div className="badge badge-invalid">
        <AlertCircle size={13} />
        <span>■ Función no válida</span>
      </div>
      {errorMessage && (
        <span style={{ fontSize: '0.78rem', color: 'var(--accent-rose)', marginLeft: '4px' }}>
          {errorMessage}
        </span>
      )}
    </div>
  );
};
