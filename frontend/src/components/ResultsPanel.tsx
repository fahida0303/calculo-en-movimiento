import React from 'react';
import type { CalculationResults } from '../types';

interface ResultsPanelProps {
  functionExpression: string;
  functionType?: string;
  requirement: number;
  results: CalculationResults | null;
}

const formatNum = (val: any): string => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number') {
    if (Math.abs(val) < 1e-10) return '0';
    const rounded = Math.round(val * 10000) / 10000;
    return String(rounded);
  }
  return String(val);
};

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  functionExpression,
  functionType = 'f(x)',
  requirement,
  results,
}) => {
  if (requirement === 0 || !results) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
        }}
      >
        <div className="eval-stat-card" style={{ opacity: 0.7 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7' }} />
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', fontFamily: 'var(--font-mono)' }}>
              EVALUACIÓN
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
            f(x₀) = —
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Selecciona 1 a 5 dedos</div>
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px', marginTop: '8px', fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
            Estado: En espera
          </div>
        </div>

        <div className="eval-stat-card" style={{ opacity: 0.7 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }} />
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', fontFamily: 'var(--font-mono)' }}>
              PRIMERA DERIVADA
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
            f'(x) = —
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Razón instantánea</div>
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px', marginTop: '8px', fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
            Pendiente: —
          </div>
        </div>

        <div className="eval-stat-card" style={{ opacity: 0.7 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7c3aed' }} />
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', fontFamily: 'var(--font-mono)' }}>
              RECTA TANGENTE
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
            y = —
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Ecuación punto-pendiente</div>
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px', marginTop: '8px', fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
            Pendiente: —
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────── REQUISITO 1: EVALUACIÓN Y TANGENTE ─────────────────── */
  if (requirement === 1) {
    const aVal = formatNum(results.a ?? 2);
    const fAVal = formatNum(results.f_a ?? -1);
    const slopeVal = formatNum(results.slope ?? 0);
    const firstDerivStr = results.first_derivative || results.derivative || '2x - 4';
    const tangentEqStr = results.tangent_equation_simplified || results.tangent_equation || 'y = -1';
    const isHorizontal = Math.abs(results.slope ?? 0) < 1e-4;

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
        }}
      >
        {/* Card 1: EVALUACIÓN */}
        <div className="eval-stat-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7' }} />
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0284c7', fontFamily: 'var(--font-mono)' }}>
                EVALUACIÓN f(x₀)
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
              f({aVal}) = {fAVal}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
              Punto P({aVal}, {fAVal}) sobre curva {functionType.toLowerCase()}
            </div>
          </div>
          <div
            style={{
              borderTop: '1px solid #f1f5f9',
              paddingTop: '6px',
              marginTop: '8px',
              fontSize: '0.68rem',
              color: '#334155',
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>Abscisa:</span>
            <strong style={{ color: '#0284c7' }}>x₀ = {aVal}</strong>
          </div>
        </div>

        {/* Card 2: PRIMERA DERIVADA */}
        <div className="eval-stat-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }} />
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#059669', fontFamily: 'var(--font-mono)' }}>
                PRIMERA DERIVADA f'(x)
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
              f'({aVal}) = {slopeVal}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
              f'(x) = {firstDerivStr}
            </div>
          </div>
          <div
            style={{
              borderTop: '1px solid #f1f5f9',
              paddingTop: '6px',
              marginTop: '8px',
              fontSize: '0.68rem',
              color: '#334155',
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>Tasa de cambio:</span>
            <strong style={{ color: '#059669' }}>m = {slopeVal}</strong>
          </div>
        </div>

        {/* Card 3: RECTA TANGENTE */}
        <div className="eval-stat-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7c3aed' }} />
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#7c3aed', fontFamily: 'var(--font-mono)' }}>
                RECTA TANGENTE
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
              {tangentEqStr}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
              y - f(x₀) = f'(x₀)(x - x₀)
            </div>
          </div>
          <div
            style={{
              borderTop: '1px solid #f1f5f9',
              paddingTop: '6px',
              marginTop: '8px',
              fontSize: '0.68rem',
              color: '#334155',
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>Pendiente:</span>
            <strong style={{ color: '#7c3aed' }}>
              {isHorizontal ? 'Nula (Extremo crítico)' : `m = ${slopeVal}`}
            </strong>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────── REQUISITO 2: SECANTE Y RAZÓN DE CAMBIO ─────────────────── */
  if (requirement === 2) {
    const aVal = formatNum(results.a ?? 1);
    const bVal = formatNum(results.b ?? 3);
    const deltaX = formatNum(results.delta_x ?? 2);
    const avgRate = formatNum(results.rate_of_change ?? results.average_rate_of_change ?? 0);
    const secEq = results.secant_equation_simplified || results.secant_equation || 'y = m·x + b';
    const areaVal = results.area?.geometric_area !== undefined ? formatNum(results.area.geometric_area) : null;

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
        }}
      >
        <div className="eval-stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7' }} />
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0284c7', fontFamily: 'var(--font-mono)' }}>
              INTERVALO [a, b]
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
            [{aVal}, {bVal}] (Δx = {deltaX})
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
            Puntos A({aVal}, {formatNum(results.f_a)}) y B({bVal}, {formatNum(results.f_b)})
          </div>
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px', marginTop: '8px', fontSize: '0.68rem', color: '#334155', fontFamily: 'var(--font-mono)' }}>
            Δy = {formatNum(results.delta_y ?? 0)} {areaVal ? `· Área = ${areaVal}` : ''}
          </div>
        </div>

        <div className="eval-stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }} />
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#059669', fontFamily: 'var(--font-mono)' }}>
              RAZÓN PROMEDIO (Δy / Δx)
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
            m_sec = {avgRate}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
            Cociente incremental [f(b)-f(a)] / [b-a]
          </div>
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px', marginTop: '8px', fontSize: '0.68rem', color: '#059669', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
            Límite Δx → 0 ⇒ m_tangente
          </div>
        </div>

        <div className="eval-stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7c3aed' }} />
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#7c3aed', fontFamily: 'var(--font-mono)' }}>
              RECTA SECANTE
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
            {secEq}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
            Interseca la curva en ambos nodos A y B
          </div>
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px', marginTop: '8px', fontSize: '0.68rem', color: '#334155', fontFamily: 'var(--font-mono)' }}>
            Pendiente secante: {avgRate}
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────── REQUISITO 3: DERIVADAS EN PLANOS 3D ─────────────────── */
  if (requirement === 3) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
        }}
      >
        <div className="eval-stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7' }} />
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0284c7', fontFamily: 'var(--font-mono)' }}>
              CURVA ORIGINAL f(x)
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
            f(x) = {functionExpression}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
            Plano z = 0 (Trazo Cartesiano Principal)
          </div>
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px', marginTop: '8px', fontSize: '0.68rem', color: '#334155', fontFamily: 'var(--font-mono)' }}>
            Tipo: {functionType}
          </div>
        </div>

        <div className="eval-stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }} />
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#059669', fontFamily: 'var(--font-mono)' }}>
              1ª DERIVADA f'(x)
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
            f'(x) = {results.first_derivative || results.derivative}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
            Plano z = 1.5 (Tasa de Variación Instantánea)
          </div>
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px', marginTop: '8px', fontSize: '0.68rem', color: '#059669', fontFamily: 'var(--font-mono)' }}>
            Velocidad de cambio
          </div>
        </div>

        <div className="eval-stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7c3aed' }} />
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#7c3aed', fontFamily: 'var(--font-mono)' }}>
              2ª DERIVADA f''(x)
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
            f''(x) = {results.second_derivative || 'Constante'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
            Plano z = 3.0 (Concavidad & Curvatura)
          </div>
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px', marginTop: '8px', fontSize: '0.68rem', color: '#7c3aed', fontFamily: 'var(--font-mono)' }}>
            Aceleración de curvatura
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────── REQUISITO 4: PUNTOS CRÍTICOS ─────────────────── */
  if (requirement === 4) {
    const cpList = results.critical_points || [];
    const cpCount = cpList.length;

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
        }}
      >
        <div className="eval-stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7' }} />
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0284c7', fontFamily: 'var(--font-mono)' }}>
              CONDICIÓN DE FERMAT
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
            f'(x) = 0 ⇒ {cpCount} Raíz{cpCount !== 1 ? 'ces' : ''}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
            {results.first_derivative || results.derivative} = 0
          </div>
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px', marginTop: '8px', fontSize: '0.68rem', color: '#334155', fontFamily: 'var(--font-mono)' }}>
            Pendientes tangentes horizontales
          </div>
        </div>

        <div className="eval-stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }} />
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#059669', fontFamily: 'var(--font-mono)' }}>
              PUNTOS DETECTADOS
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
            {cpList.length > 0
              ? cpList.map((cp: any) => `x = ${formatNum(cp.x)}`).join(', ')
              : 'Sin puntos reales'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
            {cpList.length > 0
              ? cpList.map((cp: any) => `${cp.classification}: (${formatNum(cp.x)}, ${formatNum(cp.y)})`).join(' · ')
              : 'Función monotónica'}
          </div>
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px', marginTop: '8px', fontSize: '0.68rem', color: '#059669', fontFamily: 'var(--font-mono)' }}>
            Resuelto analíticamente por SymPy
          </div>
        </div>

        <div className="eval-stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7c3aed' }} />
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#7c3aed', fontFamily: 'var(--font-mono)' }}>
              CRITERIO DE LA 2ª DERIVADA
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
            f''(c) {results.second_derivative ? `=${results.second_derivative}` : ''}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
            f''(c) &gt; 0 ⇒ Mínimo | f''(c) &lt; 0 ⇒ Máximo
          </div>
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px', marginTop: '8px', fontSize: '0.68rem', color: '#7c3aed', fontFamily: 'var(--font-mono)' }}>
            Clasificación exacta
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────── REQUISITO 5: RETO CINEMÁTICO ─────────────────── */
  const tVal = formatNum(results.t ?? 0.85);
  const sVal = formatNum(results.s_val ?? results.f_a ?? 0.7513);
  const vVal = formatNum(results.v_val ?? results.slope ?? 0.66);
  const aVal = formatNum(results.a_val ?? results.second_derivative ?? -0.7513);
  const trajStr = results.trajectory_str || functionExpression.replace(/x/g, 't');
  const velStr = results.velocity_str || results.first_derivative || results.derivative || 'v(t)';
  const accStr = results.acceleration_str || results.second_derivative || 'a(t)';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
      }}
    >
      {/* Card 1: Trayectoria / Posición s(t) */}
      <div className="eval-stat-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7' }} />
          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0284c7', fontFamily: 'var(--font-mono)' }}>
            TRAYECTORIA s(t) [m]
          </span>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
          s({tVal}) = {sVal} m
        </div>
        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
          s(t) = {trajStr}
        </div>
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px', marginTop: '8px', fontSize: '0.68rem', color: '#334155', fontFamily: 'var(--font-mono)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Instante:</span>
          <strong style={{ color: '#0284c7' }}>t = {tVal} s</strong>
        </div>
      </div>

      {/* Card 2: Velocidad Instantánea v(t) */}
      <div className="eval-stat-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }} />
          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#059669', fontFamily: 'var(--font-mono)' }}>
            VELOCIDAD v(t) = s'(t) [m/s]
          </span>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
          v({tVal}) = {vVal} m/s
        </div>
        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
          v(t) = {velStr}
        </div>
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px', marginTop: '8px', fontSize: '0.68rem', color: '#059669', fontFamily: 'var(--font-mono)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Tasa de cambio:</span>
          <strong style={{ color: '#059669' }}>v = {vVal} m/s</strong>
        </div>
      </div>

      {/* Card 3: Aceleración Instantánea a(t) */}
      <div className="eval-stat-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7c3aed' }} />
          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#7c3aed', fontFamily: 'var(--font-mono)' }}>
            ACELERACIÓN a(t) = v'(t) [m/s²]
          </span>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
          a({tVal}) = {aVal} m/s²
        </div>
        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
          a(t) = {accStr}
        </div>
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px', marginTop: '8px', fontSize: '0.68rem', color: '#7c3aed', fontFamily: 'var(--font-mono)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Curvatura temporal:</span>
          <strong style={{ color: '#7c3aed' }}>a = {aVal} m/s²</strong>
        </div>
      </div>
    </div>
  );
};
