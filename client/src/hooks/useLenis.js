import { useEffect } from 'react';
import Lenis from 'lenis';

let lenisInstance = null;

export function useLenis() {
  useEffect(() => {
    // Don't double-init
    if (lenisInstance) return;

    lenisInstance = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    });

    function raf(time) {
      lenisInstance?.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenisInstance?.destroy();
      lenisInstance = null;
    };
  }, []);
}
