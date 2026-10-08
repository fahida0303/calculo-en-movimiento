import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

interface ParameterSliderProps {
  paramValue: number;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  onChange: (val: number) => void;
  onCommit?: (val: number) => void;
  disabled?: boolean;
}

export const ParameterSlider: React.FC<ParameterSliderProps> = ({
  paramValue,
  min = -5.0,
  max = 5.0,
  step = 0.05,
  label = 'Parámetro x₀',
  onChange,
  onCommit,
  disabled = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const playDirRef = useRef(1); // 1 = increasing, -1 = decreasing
  const animFrameRef = useRef<number | null>(null);
  const currentValRef = useRef(paramValue);

  useEffect(() => {
    currentValRef.current = paramValue;
  }, [paramValue]);

  // Animation loop when Play is pressed
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // Advance by 1.2 units per second
      let next = currentValRef.current + playDirRef.current * 1.2 * dt;
      if (next >= max) {
        next = max;
        playDirRef.current = -1;
      } else if (next <= min) {
        next = min;
        playDirRef.current = 1;
      }

      currentValRef.current = next;
      const rounded = Math.round(next * 100) / 100;
      onChange(rounded);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, min, max, onChange]);

  const handleStep = (direction: number) => {
    const next = Math.max(min, Math.min(max, Math.round((paramValue + direction * 0.1) * 100) / 100));
    onChange(next);
    onCommit?.(next);
  };

  return (
    <div className="param-slider-track">
      {/* Label and current value */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '150px' }}>
        <span
          style={{
            fontFamily: 'var(--font-main)',
            fontWeight: 800,
            fontSize: '0.8rem',
            color: '#0f172a',
          }}
        >
          {label}:
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            fontSize: '0.85rem',
            color: '#0284c7',
            background: '#e0f2fe',
            padding: '2px 8px',
            borderRadius: '6px',
            border: '1px solid #bae6fd',
          }}
        >
          {paramValue.toFixed(2)}
        </span>
      </div>

      {/* Min indicator */}
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          color: '#64748b',
          fontWeight: 600,
        }}
      >
        {min.toFixed(1)}
      </span>

      {/* Slider Range */}
      <input
        id="param-slider-input"
        type="range"
        min={min}
        max={max}
        step={step}
        value={paramValue}
        disabled={disabled}
        onChange={(e) => {
          const val = parseFloat(e.target.value);
          onChange(val);
        }}
        onMouseUp={() => onCommit?.(paramValue)}
        onTouchEnd={() => onCommit?.(paramValue)}
      />

      {/* Max indicator */}
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          color: '#64748b',
          fontWeight: 600,
        }}
      >
        +{max.toFixed(1)}
      </span>

      {/* Step Left [<] */}
      <button
        type="button"
        onClick={() => handleStep(-1)}
        disabled={disabled}
        title="Disminuir parámetro x₀"
        className="slider-step-btn"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Step Right [>] */}
      <button
        type="button"
        onClick={() => handleStep(1)}
        disabled={disabled}
        title="Aumentar parámetro x₀"
        className="slider-step-btn"
      >
        <ChevronRight size={16} />
      </button>

      {/* Play / Pause [▶ / ⏸] */}
      <button
        type="button"
        onClick={() => setIsPlaying(!isPlaying)}
        disabled={disabled}
        title={isPlaying ? 'Pausar animación' : 'Reproducir variación continua'}
        className="slider-step-btn"
        style={{
          background: isPlaying ? '#0284c7' : '#f1f5f9',
          color: isPlaying ? '#ffffff' : '#0284c7',
          borderColor: isPlaying ? '#0284c7' : '#cbd5e1',
        }}
      >
        {isPlaying ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
      </button>
    </div>
  );
};
