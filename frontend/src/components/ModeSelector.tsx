import React from 'react';
import { Camera, Hand } from 'lucide-react';
import type { AppMode } from '../types';

interface ModeSelectorProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  disabled?: boolean;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  onSelectMode,
  disabled = false,
}) => {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div className="mode-segmented-track">
        {/* IA VISION */}
        <button
          id="btn-modo-camara"
          type="button"
          disabled={disabled}
          onClick={() => onSelectMode('CAMERA')}
          className={`mode-segmented-btn ${currentMode === 'CAMERA' ? 'active' : ''}`}
          style={{
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <Camera size={14} color={currentMode === 'CAMERA' ? '#0284c7' : '#64748b'} />
          <span>{currentMode === 'CAMERA' ? 'Cámara (Activo)' : 'Cámara'}</span>
        </button>

        {/* MANUAL */}
        <button
          id="btn-modo-manual"
          type="button"
          disabled={disabled}
          onClick={() => onSelectMode('MANUAL')}
          className={`mode-segmented-btn ${currentMode === 'MANUAL' ? 'active' : ''}`}
          style={{
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <Hand size={14} color={currentMode === 'MANUAL' ? '#0284c7' : '#64748b'} />
          <span>{currentMode === 'MANUAL' ? 'Manual (Activo)' : 'Manual'}</span>
        </button>
      </div>
    </div>
  );
};
