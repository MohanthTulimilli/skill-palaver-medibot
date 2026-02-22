import { useEffect, useRef, useState } from 'react';

interface Props {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

const AnimatedCounter: React.FC<Props> = ({ value, duration = 1200, prefix = '', suffix = '', decimals = 0 }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);
  const startTime = useRef<number>(0);

  useEffect(() => {
    const start = ref.current;
    startTime.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = start + (value - start) * eased;
      setDisplay(current);
      ref.current = current;
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <>{prefix}{display.toFixed(decimals)}{suffix}</>;
};

export default AnimatedCounter;
