import { useEffect, useRef } from 'react';

export default function SpringMotion({ children, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let position = 0.92;
    let velocity = 0;
    const target = 1;
    const mass = 1;
    const stiffness = 120;
    const damping = 14;
    let raf;

    const tick = () => {
      const force = -stiffness * (position - target);
      const dampingForce = -damping * velocity;
      const accel = (force + dampingForce) / mass;
      velocity += accel * 0.016;
      position += velocity * 0.016;
      if (Math.abs(target - position) < 0.001 && Math.abs(velocity) < 0.001) {
        position = target;
      }
      el.style.transform = `translateZ(0) scale(${position})`;
      if (position !== target) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <div ref={ref} className={className}>{children}</div>;
}
