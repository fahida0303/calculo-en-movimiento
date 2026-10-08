import React from 'react';
import { History } from 'lucide-react';
import type { HistoryItem } from '../types';

interface HistoryPanelProps {
  items: HistoryItem[];
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ items }) => {
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
        <History size={15} color="var(--accent-violet)" />
        <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Historial de Eventos
        </h4>
      </div>

      <div style={{
        maxHeight: '130px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        fontSize: '0.72rem',
        fontFamily: 'var(--font-mono)'
      }}>
        {items.length === 0 ? (
          <span style={{ color: 'var(--text-dim)' }}>Sin eventos registrados.</span>
        ) : (
          items.slice(-8).reverse().map((it) => (
            <div key={it.id} style={{ display: 'flex', gap: '8px', color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--text-dim)', flexShrink: 0 }}>{it.time}</span>
              <span style={{ color: it.type === 'error' ? 'var(--accent-rose)' : '#e2e8f0' }}>
                — {it.text}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
