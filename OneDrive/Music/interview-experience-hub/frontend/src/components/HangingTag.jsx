import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Bell, ClipboardList, Clock3, Phone } from 'lucide-react';

const ACTION_ICONS = [
  { test: /notify/i, Icon: Bell },
  { test: /call/i, Icon: Phone },
  { test: /details|view/i, Icon: ClipboardList }
];

export default function HangingTag({ title, message, tone = 'info', actions = [] }) {
  const tagFrameRef = useRef(null);
  const holeRef = useRef(null);
  const [ropePath, setRopePath] = useState('M84 28 C126 8, 156 28, 118 94');
  const theme = {
    info: {
      surface: 'bg-[#edf4c8]/90 border-[#d7e7a8]/80 text-[#193f2d]',
      title: 'text-[#245033]',
      accent: 'text-[#709b62]',
      stroke: 'rgba(112, 155, 98, 0.56)',
      Icon: Clock3
    },
    warning: {
      surface: 'bg-[#f5e8c8]/92 border-[#ead39f]/80 text-[#4e3920]',
      title: 'text-[#9a6421]',
      accent: 'text-[#c59c5f]',
      stroke: 'rgba(178, 130, 64, 0.54)',
      Icon: AlertTriangle
    },
    danger: {
      surface: 'bg-[#e8ddfb]/92 border-[#d4c2ef]/80 text-[#332658]',
      title: 'text-[#4b367c]',
      accent: 'text-[#8b73bd]',
      stroke: 'rgba(128, 104, 174, 0.52)',
      Icon: AlertTriangle
    }
  }[tone] || {
    surface: 'bg-[#edf4c8]/90 border-[#d7e7a8]/80 text-[#193f2d]',
    title: 'text-[#245033]',
    accent: 'text-[#709b62]',
    stroke: 'rgba(112, 155, 98, 0.56)',
    Icon: Clock3
  };

  const StateIcon = theme.Icon;
  const getActionIcon = (label) => ACTION_ICONS.find(item => item.test.test(label))?.Icon || ClipboardList;

  useEffect(() => {
    const updateRopePath = () => {
      const frame = tagFrameRef.current;
      const card = frame?.closest('.ieh-request-card');
      const pill = card?.querySelector('.ieh-status-pill');
      const hole = holeRef.current;
      if (!frame || !pill || !hole) return;

      const frameRect = frame.getBoundingClientRect();
      const pillRect = pill.getBoundingClientRect();
      const holeRect = hole.getBoundingClientRect();
      const startX = pillRect.left + (pillRect.width / 2) - frameRect.left;
      const startY = pillRect.bottom - frameRect.top;
      const holeX = holeRect.left + (holeRect.width / 2) - frameRect.left;
      const holeY = holeRect.top + (holeRect.height / 2) - frameRect.top;
      const controlOneX = startX - Math.max(16, Math.abs(startX - holeX) * 0.24);
      const controlOneY = startY + 18;
      const controlTwoX = holeX + Math.max(12, Math.abs(startX - holeX) * 0.22);
      const controlTwoY = holeY - 34;
      const exitX = holeX + 5;
      const exitY = holeY + 22;

      setRopePath(`M${startX.toFixed(1)} ${startY.toFixed(1)} C${controlOneX.toFixed(1)} ${controlOneY.toFixed(1)}, ${controlTwoX.toFixed(1)} ${controlTwoY.toFixed(1)}, ${holeX.toFixed(1)} ${holeY.toFixed(1)} C${holeX.toFixed(1)} ${(holeY + 7).toFixed(1)}, ${exitX.toFixed(1)} ${(holeY + 13).toFixed(1)}, ${exitX.toFixed(1)} ${exitY.toFixed(1)}`);
    };

    updateRopePath();
    window.addEventListener('resize', updateRopePath);
    const frame = tagFrameRef.current;
    const card = frame?.closest('.ieh-request-card');
    const observer = typeof ResizeObserver !== 'undefined' && card ? new ResizeObserver(updateRopePath) : null;
    if (observer) observer.observe(card);
    return () => {
      window.removeEventListener('resize', updateRopePath);
      observer?.disconnect();
    };
  }, [title]);

  return (
    <>
    <style>{`
      @keyframes hanging-tag-swing {
        0% { transform: rotate(4deg) translateY(-2px); }
        45% { transform: rotate(9deg) translateY(1px); }
        100% { transform: rotate(8deg) translateY(0); }
      }
    `}</style>
    <div ref={tagFrameRef} className="ieh-hanging-tag pointer-events-none absolute right-3 top-5 z-30 h-[224px] w-[158px] overflow-visible sm:right-4 sm:top-6 sm:h-[254px] sm:w-[184px] md:right-5 md:top-5 md:h-[306px] md:w-[230px]">
      <svg
        className="absolute inset-0 h-full w-full overflow-visible"
        aria-hidden="true"
      >
        <path
          d={ropePath}
          fill="none"
          stroke="rgba(104, 116, 128, 0.62)"
          strokeWidth="1.8"
          strokeDasharray="4 5"
          strokeLinecap="round"
        />
      </svg>
      <div className={`pointer-events-auto absolute right-0 top-[58px] flex h-[158px] w-[116px] rotate-[8deg] flex-col border px-3 pb-3 pt-11 text-[10px] shadow-[0_18px_34px_rgba(64,88,112,0.20),inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-xl [clip-path:polygon(18%_0,80%_0,100%_16%,100%_90%,88%_100%,12%_100%,0_90%,0_16%)] [animation:hanging-tag-swing_600ms_ease-out_1] sm:top-[66px] sm:h-[176px] sm:w-[128px] sm:px-3.5 sm:pt-12 sm:text-[11px] md:top-[76px] md:h-[220px] md:w-[160px] md:px-4 md:pb-4 md:pt-[62px] md:text-xs ${theme.surface}`}>
        <span ref={holeRef} className="absolute left-[16px] top-[15px] h-[10px] w-[10px] rounded-full border-2 border-white/75 bg-slate-100/75 shadow-[inset_0_1px_4px_rgba(15,23,42,0.22)] md:left-[21px] md:top-[18px] md:h-[14px] md:w-[14px]" />

        <svg className="pointer-events-none absolute right-2 top-12 h-16 w-7 opacity-70 md:right-3 md:top-[70px] md:h-20 md:w-9" viewBox="0 0 36 92" fill="none" aria-hidden="true">
          <path d="M17 89 C16 66 23 45 15 18" stroke={theme.stroke} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M17 29 C9 24 5 18 4 10 C12 12 18 17 17 29Z" fill="currentColor" className={theme.accent} opacity="0.45" />
          <path d="M19 43 C28 38 31 31 31 23 C22 26 17 34 19 43Z" fill="currentColor" className={theme.accent} opacity="0.42" />
          <path d="M17 56 C8 52 4 45 3 37 C12 39 18 47 17 56Z" fill="currentColor" className={theme.accent} opacity="0.38" />
          <path d="M19 71 C27 67 31 60 32 52 C23 54 18 62 19 71Z" fill="currentColor" className={theme.accent} opacity="0.36" />
        </svg>

        <svg className="pointer-events-none absolute right-1 top-4 h-9 w-6 opacity-35 md:right-2 md:top-5 md:h-11 md:w-7" viewBox="0 0 28 46" fill="none" aria-hidden="true">
          <path d="M14 43 C13 30 20 21 17 6" stroke={theme.stroke} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M15 17 C21 13 23 9 24 4 C18 5 14 10 15 17Z" fill="currentColor" className={theme.accent} opacity="0.5" />
          <path d="M13 27 C7 23 5 18 5 13 C11 15 14 20 13 27Z" fill="currentColor" className={theme.accent} opacity="0.42" />
        </svg>

        <div className="relative min-h-0 flex-1 overflow-y-auto pr-3">
          <StateIcon className={`mb-2 h-3.5 w-3.5 md:h-4 md:w-4 ${theme.title}`} strokeWidth={1.9} />
          <p className={`font-bold leading-tight ${theme.title}`}>{title}</p>
          {message && <p className="mt-2 leading-snug text-slate-700/85 dark:text-slate-200/85">{message}</p>}
        </div>
        {actions.length > 0 && (
          <div className="relative mt-3 flex shrink-0 flex-col gap-2">
            {actions.slice(0, 3).map(action => (
              (() => {
                const ActionIcon = getActionIcon(action.label);
                const className = "ieh-compact-action inline-flex items-center gap-1.5 rounded-lg border border-white/55 bg-white/38 px-1.5 py-1 font-medium text-slate-700 transition hover:bg-white/60 focus:outline-none focus:ring-2 focus:ring-sky-300/50 active:scale-[0.98] dark:border-slate-600/35 dark:bg-slate-700/38 dark:text-slate-100";
                return action.href ? (
                  <a key={action.label} href={action.href} className={className} onClick={action.onClick}>
                    <ActionIcon className="h-3 w-3 shrink-0" strokeWidth={1.9} />
                    <span className="truncate">{action.label}</span>
                  </a>
                ) : (
                  <button key={action.label} type="button" onClick={action.onClick} className={className}>
                    <ActionIcon className="h-3 w-3 shrink-0" strokeWidth={1.9} />
                    <span className="truncate">{action.label}</span>
                  </button>
                );
              })()
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
