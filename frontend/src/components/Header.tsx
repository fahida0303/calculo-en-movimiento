import { Maximize2, Settings, User, RotateCcw } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  onClear: () => void;
  systemReady: boolean;
  activeTab?: 'simulation' | 'tutorials';
  onSelectTab?: (tab: 'simulation' | 'tutorials') => void;
  fps?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onReset,
  systemReady,
  activeTab = 'simulation',
  onSelectTab,
}) => {
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
      {/* ── Main Top Bar ── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 20px',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          boxShadow: '0 2px 12px rgba(15, 23, 42, 0.04)',
        }}
      >
        {/* Left: Brand + Kernel Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Logo fx */}
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
              color: '#ffffff',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              fontSize: '1.15rem',
            }}
          >
            fx
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-main)',
                  fontWeight: 800,
                  fontSize: '1.15rem',
                  color: '#0f172a',
                  letterSpacing: '-0.02em',
                }}
              >
                Cálculo en Movimiento
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: '#e0f2fe',
                  color: '#0284c7',
                  border: '1px solid #bae6fd',
                }}
              >
                v2.4-Lab
              </span>
            </div>
            <p
              style={{
                fontSize: '0.72rem',
                color: '#64748b',
                margin: 0,
                fontFamily: 'var(--font-body)',
              }}
            >
              Laboratorio de Cálculo Diferencial 3D & Visión IA
            </p>
          </div>

          {/* Kernel status pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '9999px',
              background: systemReady ? '#ecfdf5' : '#fffbeb',
              border: `1px solid ${systemReady ? '#a7f3d0' : '#fde68a'}`,
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              marginLeft: '8px',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: systemReady ? '#059669' : '#d97706',
                boxShadow: systemReady ? '0 0 6px #059669' : 'none',
              }}
            />
            <span style={{ color: systemReady ? '#065f46' : '#92400e', fontWeight: 600 }}>
              Kernel SymPy Activo
            </span>
          </div>
        </div>

        {/* Right: Tabs & Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Main Navigation Tabs */}
          <div
            style={{
              display: 'flex',
              background: '#f1f5f9',
              borderRadius: '8px',
              padding: '3px',
              gap: '3px',
            }}
          >
            <button
              onClick={() => onSelectTab?.('simulation')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontFamily: 'var(--font-main)',
                fontWeight: 700,
                background: activeTab === 'simulation' ? '#ffffff' : 'transparent',
                color: activeTab === 'simulation' ? '#0f172a' : '#64748b',
                boxShadow: activeTab === 'simulation' ? '0 1px 4px rgba(15, 23, 42, 0.08)' : 'none',
              }}
            >
              Simulación Principal
            </button>
            <button
              onClick={() => onSelectTab?.('tutorials')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontFamily: 'var(--font-main)',
                fontWeight: 700,
                background: activeTab === 'tutorials' ? '#ffffff' : 'transparent',
                color: activeTab === 'tutorials' ? '#0f172a' : '#64748b',
                boxShadow: activeTab === 'tutorials' ? '0 1px 4px rgba(15, 23, 42, 0.08)' : 'none',
              }}
            >
              Guías & Tutoriales
            </button>
          </div>

          <div style={{ width: '1px', height: '20px', background: '#e2e8f0' }} />

          {/* Action icon buttons */}
          <button
            onClick={toggleFullscreen}
            title="Pantalla Completa"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Maximize2 size={14} />
          </button>

          <button
            onClick={onReset}
            title="Reiniciar Sistema"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RotateCcw size={14} />
          </button>

          <button
            title="Ajustes de Renderizado"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Settings size={14} />
          </button>

          {/* User profile avatar */}
          <div
            title="Observatorio Usuario"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#0f172a',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.2)',
              cursor: 'pointer',
            }}
          >
            <User size={15} />
          </div>
        </div>
      </header>

    </div>
  );
};
