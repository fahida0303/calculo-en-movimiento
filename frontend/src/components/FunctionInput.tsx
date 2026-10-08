import React, { useState } from 'react';
import { Play, X, ChevronDown, ChevronUp, BookOpen, Layers } from 'lucide-react';

interface FunctionInputProps {
  value: string;
  onChange: (val: string) => void;
  isValid: boolean;
  functionType: string;
  errorMessage: string | null;
  onSubmit?: () => void;
  onSelectPredefined?: (expr: string) => void;
}

const PREDEFINED_LIST = [
  {
    expr: 'x^2 - 4*x + 3',
    name: 'x² - 4x + 3 (Polinómica / Parábola)',
    continuity: 'C^∞ en ℝ',
    discontinuities: 'Sin discontinuidades',
    domain: 'Dominio: ℝ (Válido)',
  },
  {
    expr: '1/x',
    name: '1/x (Racional / Hipérbola)',
    continuity: 'Discontinua en x = 0',
    discontinuities: 'Asíntota vertical en x = 0',
    domain: 'Dominio: ℝ \\ {0}',
  },
  {
    expr: 'ln(x)',
    name: 'ln(x) (Logarítmica)',
    continuity: 'Continua para x > 0',
    discontinuities: 'Asíntota vertical en x = 0',
    domain: 'Dominio: (0, +∞)',
  },
  {
    expr: 'e^x',
    name: 'e^x (Exponencial)',
    continuity: 'C^∞ en ℝ',
    discontinuities: 'Sin discontinuidades',
    domain: 'Dominio: ℝ (Válido)',
  },
  {
    expr: 'sqrt(x)',
    name: '√x (Radical)',
    continuity: 'Continua para x ≥ 0',
    discontinuities: 'No definida para x < 0',
    domain: 'Dominio: [0, +∞)',
  },
  {
    expr: 'sin(x)',
    name: 'sin(x) (Trigonométrica)',
    continuity: 'C^∞ en ℝ',
    discontinuities: 'Sin discontinuidades',
    domain: 'Dominio: ℝ (Válido)',
  },
];

export const FunctionInput: React.FC<FunctionInputProps> = ({
  value,
  onChange,
  isValid,
  functionType,
  errorMessage,
  onSubmit,
  onSelectPredefined,
}) => {
  const [predefinedOpen, setPredefinedOpen] = useState(true);
  const [tutorialOpen, setTutorialOpen] = useState(false);

  // Find info about current function
  const currentPredef =
    PREDEFINED_LIST.find((p) => p.expr === value) || {
      expr: value,
      name: value ? `${value} (${functionType || 'Personalizada'})` : 'Sin función',
      continuity: 'Analítica en SymPy',
      discontinuities: isValid ? 'Sin singularidades detectadas' : 'Error sintáctico',
      domain: isValid ? 'Dominio: ℝ (Válido)' : 'Dominio: Restringido',
    };

  // Scientific keypad insertion
  const handleKeypadPress = (symbol: string) => {
    switch (symbol) {
      case 'x':
        onChange(value + 'x');
        break;
      case 'x²':
        onChange(value + '^2');
        break;
      case '√':
        onChange(value + 'sqrt(');
        break;
      case '+':
        onChange(value + ' + ');
        break;
      case 'sin':
        onChange(value + 'sin(');
        break;
      case 'cos':
        onChange(value + 'cos(');
        break;
      case 'ln':
        onChange(value + 'ln(');
        break;
      case '*':
        onChange(value + '*');
        break;
      case 'eˣ':
        onChange(value + 'e^');
        break;
      case 'π':
        onChange(value + 'pi');
        break;
      case 'Lim':
        onChange(value + 'lim(');
        break;
      case '-':
        onChange(value + ' - ');
        break;
      case 'd/dx':
        onChange(value + 'diff(');
        break;
      case '(':
        onChange(value + '(');
        break;
      case ')':
        onChange(value + ')');
        break;
      case '/':
        onChange(value + '/');
        break;
      default:
        onChange(value + symbol);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
      {/* ── Expresión f(x) Card ── */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '14px',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
        }}
      >
        {/* Header: Title and Domain Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-main)',
              fontWeight: 800,
              fontSize: '0.88rem',
              color: '#0f172a',
            }}
          >
            Expresión f(x)
          </span>

          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '9999px',
              background: isValid ? '#ecfdf5' : '#fff1f2',
              color: isValid ? '#059669' : '#e11d48',
              border: `1px solid ${isValid ? '#a7f3d0' : '#fecdd3'}`,
            }}
          >
            {currentPredef.domain}
          </span>
        </div>

        {/* Input Bar with f(x) = and Clear Icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#f8fafc',
            border: errorMessage ? '1px solid #f43f5e' : '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '2px 10px',
            transition: 'border-color 0.2s ease',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: '#0284c7',
              marginRight: '6px',
              userSelect: 'none',
            }}
          >
            f(x) =
          </span>

          <input
            id="input-function"
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && onSubmit) {
                e.preventDefault();
                onSubmit();
              }
            }}
            placeholder="x^2 - 4*x + 3"
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              padding: '8px 4px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.88rem',
              fontWeight: 600,
              color: '#0f172a',
              outline: 'none',
            }}
          />

          {value && (
            <button
              onClick={() => onChange('')}
              title="Borrar expresión"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {errorMessage && (
          <div
            style={{
              fontSize: '0.72rem',
              color: '#e11d48',
              marginTop: '6px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* 4x4 Scientific Keypad Matrix */}
        <div className="keypad-grid">
          <button type="button" onClick={() => handleKeypadPress('x')} className="keypad-btn">x</button>
          <button type="button" onClick={() => handleKeypadPress('x²')} className="keypad-btn">x²</button>
          <button type="button" onClick={() => handleKeypadPress('√')} className="keypad-btn">√</button>
          <button type="button" onClick={() => handleKeypadPress('+')} className="keypad-btn">+</button>

          <button type="button" onClick={() => handleKeypadPress('sin')} className="keypad-btn">sin</button>
          <button type="button" onClick={() => handleKeypadPress('cos')} className="keypad-btn">cos</button>
          <button type="button" onClick={() => handleKeypadPress('ln')} className="keypad-btn">ln</button>
          <button type="button" onClick={() => handleKeypadPress('*')} className="keypad-btn">×</button>

          <button type="button" onClick={() => handleKeypadPress('eˣ')} className="keypad-btn">eˣ</button>
          <button type="button" onClick={() => handleKeypadPress('π')} className="keypad-btn">π</button>
          <button type="button" onClick={() => handleKeypadPress('Lim')} className="keypad-btn">Lim</button>
          <button type="button" onClick={() => handleKeypadPress('-')} className="keypad-btn">−</button>

          <button type="button" onClick={() => handleKeypadPress('d/dx')} className="keypad-btn">d/dx</button>
          <button type="button" onClick={() => handleKeypadPress('(')} className="keypad-btn">(</button>
          <button type="button" onClick={() => handleKeypadPress(')')} className="keypad-btn">)</button>
          <button type="button" onClick={() => handleKeypadPress('/')} className="keypad-btn">÷</button>
        </div>

        {/* Action Button: Evaluar y Graficar */}
        <button
          id="btn-evaluar-graficar"
          type="button"
          onClick={onSubmit}
          className="btn-stitch-primary"
          style={{
            width: '100%',
            padding: '10px 16px',
            fontSize: '0.84rem',
            borderRadius: '8px',
          }}
        >
          <Play size={14} fill="#ffffff" />
          <span>Evaluar y Graficar</span>
        </button>
      </div>

      {/* ── Funciones Predefinidas Accordion ── */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
        }}
      >
        <button
          type="button"
          onClick={() => setPredefinedOpen(!predefinedOpen)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={15} color="#0284c7" />
            <span
              style={{
                fontFamily: 'var(--font-main)',
                fontWeight: 700,
                fontSize: '0.82rem',
                color: '#0f172a',
              }}
            >
              Funciones Predefinidas
            </span>
          </div>
          {predefinedOpen ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
        </button>

        {predefinedOpen && (
          <div style={{ padding: '0 14px 14px 14px' }}>
            {/* Dropdown selector */}
            <select
              value={value}
              onChange={(e) => onSelectPredefined?.(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#0f172a',
                cursor: 'pointer',
                marginBottom: '8px',
              }}
            >
              {PREDEFINED_LIST.map((item) => (
                <option key={item.expr} value={item.expr}>
                  {item.name}
                </option>
              ))}
            </select>

            {/* Sub-properties info */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono)',
                color: '#64748b',
                padding: '6px 8px',
                background: '#f1f5f9',
                borderRadius: '6px',
              }}
            >
              <span>Continuidad: <strong>{currentPredef.continuity}</strong></span>
              <span>{currentPredef.discontinuities}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Tutorial & Guía Rápida Accordion ── */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
        }}
      >
        <button
          type="button"
          onClick={() => setTutorialOpen(!tutorialOpen)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={15} color="#059669" />
            <span
              style={{
                fontFamily: 'var(--font-main)',
                fontWeight: 700,
                fontSize: '0.82rem',
                color: '#0f172a',
              }}
            >
              Tutorial & Guía Rápida
            </span>
          </div>
          {tutorialOpen ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
        </button>

        {tutorialOpen && (
          <div
            style={{
              padding: '0 14px 14px 14px',
              fontSize: '0.72rem',
              color: '#475569',
              lineHeight: 1.4,
            }}
          >
            <p style={{ marginBottom: '6px' }}>
              <strong>1. Selecciona o ingresa una función:</strong> Usa el teclado científico para escribir potencias, raíces o trigonométricas.
            </p>
            <p style={{ marginBottom: '6px' }}>
              <strong>2. Escoge un modo (Dedos / Manual):</strong> Del 1 al 5 dedos para explorar tangente, secante, derivadas, extremos o cinemática.
            </p>
            <p>
              <strong>3. Desliza el parámetro:</strong> Usa el slider interactivo x₀ para observar la variación dinámica en tiempo real.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
