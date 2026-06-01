import { useState } from 'react';

export default function RippleButton({ children, className = '', type = 'button', onClick, ...props }) {
  const [ripples, setRipples] = useState([]);

  const handlePointerDown = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const nextRipple = { id: Date.now() + Math.random(), x, y, size };
    setRipples(prev => [...prev, nextRipple]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== nextRipple.id)), 550);
  };

  return (
    <button
      type={type}
      onClick={onClick}
      onPointerDown={handlePointerDown}
      className={`ripple-button ${className}`}
      {...props}
    >
      {children}
      {ripples.map(r => (
        <span
          key={r.id}
          className="ripple"
          style={{ width: r.size, height: r.size, left: r.x, top: r.y }}
        />
      ))}
    </button>
  );
}
