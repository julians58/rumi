import { useState, useRef, useCallback, useEffect } from 'react';

interface RangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  minLabel?: string;
  maxLabel?: string;
  formatValue?: (value: number) => string;
  className?: string;
}

export function RangeSlider({
  min,
  max,
  value,
  onChange,
  minLabel,
  maxLabel,
  formatValue = (v) => String(v),
  className = '',
}: RangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'min' | 'max' | null>(null);

  const getPercent = (val: number) => ((val - min) / (max - min)) * 100;

  const getValueFromPosition = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return min;
      const rect = trackRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return Math.round(percent * (max - min) + min);
    },
    [min, max],
  );

  const handleMove = useCallback(
    (clientX: number) => {
      if (!dragging) return;
      const newVal = getValueFromPosition(clientX);
      if (dragging === 'min') {
        onChange([Math.min(newVal, value[1] - 1), value[1]]);
      } else {
        onChange([value[0], Math.max(newVal, value[0] + 1)]);
      }
    },
    [dragging, getValueFromPosition, onChange, value],
  );

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);
    const handleUp = () => setDragging(null);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [dragging, handleMove]);

  const handleTrackClick = (e: React.MouseEvent) => {
    const newVal = getValueFromPosition(e.clientX);
    const distToMin = Math.abs(newVal - value[0]);
    const distToMax = Math.abs(newVal - value[1]);
    if (distToMin <= distToMax) {
      onChange([Math.min(newVal, value[1] - 1), value[1]]);
    } else {
      onChange([value[0], Math.max(newVal, value[0] + 1)]);
    }
  };

  const minPercent = getPercent(value[0]);
  const maxPercent = getPercent(value[1]);

  return (
    <div className={`w-full ${className}`}>
      {/* Labels */}
      <div className="flex justify-between mb-1">
        <span className="text-xs text-rumi-text/50">{minLabel ?? formatValue(min)}</span>
        <span className="text-sm font-semibold text-rumi-text">
          {formatValue(value[0])} — {formatValue(value[1])}
        </span>
        <span className="text-xs text-rumi-text/50">{maxLabel ?? formatValue(max)}</span>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        className="relative h-6 flex items-center cursor-pointer"
        onClick={handleTrackClick}
      >
        {/* Background track */}
        <div className="absolute w-full h-1.5 bg-rumi-primary/15 rounded-full" />

        {/* Active range */}
        <div
          className="absolute h-1.5 bg-rumi-primary rounded-full"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
        />

        {/* Min thumb */}
        <div
          className="absolute w-5 h-5 bg-white border-2 border-rumi-primary rounded-full shadow-md cursor-grab active:cursor-grabbing hover:scale-110 transition-transform z-10"
          style={{ left: `calc(${minPercent}% - 10px)` }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setDragging('min');
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            setDragging('min');
          }}
        />

        {/* Max thumb */}
        <div
          className="absolute w-5 h-5 bg-white border-2 border-rumi-primary rounded-full shadow-md cursor-grab active:cursor-grabbing hover:scale-110 transition-transform z-10"
          style={{ left: `calc(${maxPercent}% - 10px)` }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setDragging('max');
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            setDragging('max');
          }}
        />
      </div>
    </div>
  );
}
