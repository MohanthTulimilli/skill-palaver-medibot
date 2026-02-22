import React, { useEffect, useState } from 'react';
import { useInView } from 'framer-motion';

interface CountUpProps {
  /** Target numeric value to animate to */
  value: number;
  /** Prefix (e.g. '₹') */
  prefix?: string;
  /** Suffix (e.g. '%', ' Cr') */
  suffix?: string;
  /** Duration in ms */
  duration?: number;
  /** Decimal places for display */
  decimals?: number;
  /** Add comma separators for thousands */
  useLocale?: boolean;
  /** Ref for the element that triggers in-view */
  ref?: React.RefObject<HTMLElement | null>;
  /** Additional className */
  className?: string;
}

const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);

export const CountUp: React.FC<CountUpProps> = ({
  value,
  prefix = '',
  suffix = '',
  duration = 1500,
  decimals = 0,
  useLocale = false,
  ref: externalRef,
  className = '',
}) => {
  const [display, setDisplay] = useState(0);
  const internalRef = React.useRef<HTMLSpanElement>(null);
  const ref = externalRef ?? internalRef;
  const inView = useInView(ref as React.RefObject<HTMLElement>, { once: true, amount: 0.3 });

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuad(progress);
      const current = eased * value;
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, value, duration]);

  const formatted =
    decimals > 0
      ? display.toFixed(decimals)
      : useLocale
        ? Math.round(display).toLocaleString('en-IN')
        : String(Math.round(display));

  return (
    <span ref={ref as React.RefObject<HTMLSpanElement>} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};
