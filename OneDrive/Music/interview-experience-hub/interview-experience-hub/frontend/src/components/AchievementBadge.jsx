import bronzeBadge from '../../badges/bronze badge.png';
import silverBadge from '../../badges/silver badge.png';
import goldBadge from '../../badges/gold badge.png';
import diamondBadge from '../../badges/diamond badge.png';

const BADGES = {
  bronze: { src: bronzeBadge, label: 'Bronze achievement badge' },
  silver: { src: silverBadge, label: 'Silver achievement badge' },
  gold: { src: goldBadge, label: 'Gold achievement badge' },
  diamond: { src: diamondBadge, label: 'Diamond achievement badge' }
};

function getBadgeForScore(score) {
  const percentage = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
  if (percentage >= 90) return BADGES.diamond;
  if (percentage >= 75) return BADGES.gold;
  if (percentage >= 60) return BADGES.silver;
  return BADGES.bronze;
}

export default function AchievementBadge({ achievement }) {
  const badge = getBadgeForScore(achievement?.percentage);

  return (
    <div className="pointer-events-none absolute -right-[18px] -top-[63px] z-20 translate-x-0 translate-y-0 sm:-top-[72px] md:-right-[45px] md:-top-[113px] md:translate-x-0 md:translate-y-0 lg:-top-[120px]">
      <div className="relative w-[146.88px] sm:w-[179.52px] md:w-60 lg:w-64">
      <div className="absolute inset-4 rounded-full bg-sky-300/10 blur-2xl" />
      <img
        src={badge.src}
        alt={badge.label}
        className={`relative block h-auto w-full object-contain drop-shadow-[0_14px_22px_rgba(15,23,42,0.24)] ${badge === BADGES.diamond ? 'md:contrast-[1.08] md:saturate-[1.03] md:brightness-[0.98]' : ''}`}
        draggable="false"
      />
      </div>
    </div>
  );
}
