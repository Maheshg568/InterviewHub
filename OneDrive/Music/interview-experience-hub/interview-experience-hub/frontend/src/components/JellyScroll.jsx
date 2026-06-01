import { useEffect, useRef } from 'react';

export default function JellyScroll({ children }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let lastScrollY = window.scrollY;
    let targetVelocity = 0;
    let velocity = 0;
    let raf;

    const onScroll = () => {
      const currentY = window.scrollY;
      targetVelocity = currentY - lastScrollY;
      lastScrollY = currentY;
    };

    const loop = () => {
      velocity = velocity + (targetVelocity - velocity) * 0.1;
      targetVelocity *= 0.92;
      const clamped = Math.max(-12, Math.min(12, velocity));
      const skew = clamped * 0.04;
      const scaleY = 1 + Math.abs(clamped) * 0.002;
      el.style.transform = `translateZ(0) skewY(${skew}deg) scaleY(${scaleY})`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}
