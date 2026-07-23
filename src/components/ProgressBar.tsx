interface ProgressBarProps {
  /** Current value. Combined with `max` to derive the fill percentage. */
  value: number;
  /** Value that represents 100%. Default 100 (pass a percentage directly). */
  max?: number;
  /** Track height. sm = h-1.5, md = h-2, lg = h-3. Default md. */
  size?: 'sm' | 'md' | 'lg';
  /** Animate width changes. Default true. */
  animated?: boolean;
  /** Transition duration in ms when animated. Default 500. */
  duration?: 300 | 500;
  /** Fill color class(es). Default bg-true-white. */
  fillClassName?: string;
  /** Track (background) color class(es). Default bg-gray-800. */
  trackClassName?: string;
  /** Extra classes on the outer wrapper (e.g. w-full, flex-1). */
  className?: string;
}

const SIZE_CLASS = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
} as const;

const DURATION_CLASS = {
  300: 'duration-300',
  500: 'duration-500',
} as const;

export function ProgressBar({
  value,
  max = 100,
  size = 'md',
  animated = true,
  duration = 500,
  fillClassName = 'bg-true-white',
  trackClassName = 'bg-gray-800',
  className = '',
}: ProgressBarProps) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`${SIZE_CLASS[size]} rounded-full overflow-hidden ${trackClassName} ${className}`}>
      <div
        className={`h-full rounded-full ${fillClassName} ${
          animated ? `transition-all ${DURATION_CLASS[duration]}` : ''
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
