import { Cpu } from 'lucide-react';
import type { CameraState, CalculationStatus, GraphStatus } from '../types';

interface SystemStatusProps {
  cameraState: CameraState;
  handDetected: boolean;
  confirmedFingers: number;
  isValidFunction: boolean;
  requirement: number;
  requirementName: string;
  calculationStatus: CalculationStatus;
  graphStatus: GraphStatus;
}

export const SystemStatus: React.FC<SystemStatusProps> = ({
  cameraState,
  handDetected,
  confirmedFingers,
  isValidFunction,
  requirement,
  requirementName,
  calculationStatus,
  graphStatus,
}) => {
  const isCameraActive = cameraState !== 'CAMERA_OFF' && cameraState !== 'CAMERA_ERROR';

  return (
    <div className="glass-panel" style={{ padding: '14px', marginBottom: '16px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '10px',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '6px'
      }}>
        <Cpu size={15} color="var(--accent-cyan)" />
        <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Estado del Sistema
        </h4>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '6px',
        fontSize: '0.72rem',
        fontFamily: 'var(--font-mono)'
      }}>
        <div>
          <span style={{ color: 'var(--text-dim)' }}>Cámara: </span>
          <strong style={{ color: isCameraActive ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
            {isCameraActive ? 'ACTIVA' : 'INACTIVA'}
          </strong>
        </div>

        <div>
          <span style={{ color: 'var(--text-dim)' }}>Mano: </span>
          <strong style={{ color: handDetected ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
            {handDetected ? 'DETECTADA' : 'NO DETECTADA'}
          </strong>
        </div>

        <div>
          <span style={{ color: 'var(--text-dim)' }}>Dedos: </span>
          <strong style={{ color: confirmedFingers > 0 ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
            {confirmedFingers}
          </strong>
        </div>

        <div>
          <span style={{ color: 'var(--text-dim)' }}>Función: </span>
          <strong style={{ color: isValidFunction ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
            {isValidFunction ? 'VÁLIDA' : 'PENDIENTE'}
          </strong>
        </div>

        <div>
          <span style={{ color: 'var(--text-dim)' }}>Requisito: </span>
          <strong style={{ color: requirement > 0 ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
            {requirement > 0 ? `${requirement} — ${requirementName}` : 'NINGUNO'}
          </strong>
        </div>

        <div>
          <span style={{ color: 'var(--text-dim)' }}>Cálculo: </span>
          <strong style={{
            color: calculationStatus === 'COMPLETED' ? 'var(--accent-emerald)' :
                   calculationStatus === 'CALCULATING' ? 'var(--accent-cyan)' :
                   calculationStatus === 'ERROR' ? 'var(--accent-rose)' : 'var(--text-muted)'
          }}>
            {calculationStatus}
          </strong>
        </div>

        <div style={{ gridColumn: 'span 2' }}>
          <span style={{ color: 'var(--text-dim)' }}>Gráfica: </span>
          <strong style={{ color: graphStatus === 'READY' ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
            {graphStatus === 'READY' ? 'LISTA' : 'OCULTA (Esperando Requisito)'}
          </strong>
        </div>
      </div>
    </div>
  );
};
