import React from 'react';
import { HelpCircle, ChevronRight } from 'lucide-react';
import type { AppMode } from '../types';

interface InstructionPanelProps {
  isValidFunction: boolean;
  mode: AppMode;
  cameraActive: boolean;
  requirement: number;
}

export const InstructionPanel: React.FC<InstructionPanelProps> = ({
  isValidFunction,
  mode,
  cameraActive,
  requirement,
}) => {
  const getActiveInstruction = () => {
    if (!isValidFunction) {
      return 'Selecciona o escribe una función matemática válida.';
    }
    if (requirement === 0) {
      if (mode === 'CAMERA') {
        if (!cameraActive) {
          return 'Activa la cámara para comenzar el reconocimiento de mano.';
        }
        return 'Muestra tu mano frente a la cámara levantando de 1 a 5 dedos.';
      } else {
        return 'Selecciona de 1 a 5 dedos en el modo manual para elegir el requisito.';
      }
    }
    return `${requirement} dedos seleccionados. Requisito ${requirement} activado. Visualización matemática generada.`;
  };

  const steps = [
    { num: 1, label: 'Seleccionar o escribir función', done: isValidFunction },
    { num: 2, label: 'Elegir Modo Cámara o Manual', done: isValidFunction },
    { num: 3, label: 'Determinar cantidad de dedos (1 a 5)', done: requirement > 0 },
    { num: 4, label: 'Ejecutar cálculo y mostrar gráfica 3D', done: requirement > 0 },
  ];

  return (
    <div className="glass-panel" style={{ padding: '14px', marginBottom: '16px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '8px',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '6px'
      }}>
        <HelpCircle size={15} color="var(--accent-cyan)" />
        <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Guía de Interacción
        </h4>
      </div>

      <div style={{
        padding: '8px 10px',
        background: 'rgba(6, 182, 212, 0.08)',
        borderRadius: '6px',
        borderLeft: '3px solid var(--accent-cyan)',
        fontSize: '0.78rem',
        color: '#ffffff',
        marginBottom: '10px'
      }}>
        {getActiveInstruction()}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {steps.map((st) => (
          <div
            key={st.num}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.72rem',
              color: st.done ? 'var(--accent-emerald)' : 'var(--text-dim)',
            }}
          >
            <ChevronRight size={12} color={st.done ? 'var(--accent-emerald)' : 'var(--text-dim)'} />
            <span>Paso {st.num}: {st.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
