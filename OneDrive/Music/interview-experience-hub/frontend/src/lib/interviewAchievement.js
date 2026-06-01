const SCORE_FIELDS = [
  { key: 'technicalSkills', label: 'Technical Skills' },
  { key: 'communicationSkills', label: 'Communication Skills' },
  { key: 'confidenceLevel', label: 'Confidence Level' },
  { key: 'professionalism', label: 'Professionalism' },
  { key: 'problemSolvingAbility', label: 'Problem Solving Ability' },
  { key: 'leadershipQuality', label: 'Leadership Quality' },
  { key: 'adaptability', label: 'Adaptability' },
  { key: 'resumePresentation', label: 'Resume Presentation' },
  { key: 'behavioralInteraction', label: 'Behavioral Interaction' },
  { key: 'clarityOfThought', label: 'Clarity of Thought' }
];

const LEGACY_MAP = {
  technicalSkills: 'technical',
  communicationSkills: 'communication',
  confidenceLevel: 'confidence',
  professionalism: 'behaviour',
  problemSolvingAbility: 'resumeScore'
};

const BADGE_TIERS = [
  {
    min: 1,
    max: 25,
    name: 'EMERGING TALENT',
    description: 'Shows early potential and willingness to learn. Continued practice and structured preparation will help build stronger interview confidence and technical growth.',
    encouragement: 'Stay consistent. Focused preparation will quickly elevate your confidence.',
    badgeClass: 'text-slate-700 border-slate-300/80 bg-gradient-to-r from-slate-100/90 to-sky-100/80 dark:from-slate-700/60 dark:to-sky-900/30',
    glowShadow: '0 12px 28px rgba(148, 163, 184, 0.22)'
  },
  {
    min: 26,
    max: 50,
    name: 'GROWTH ACHIEVER',
    description: 'Demonstrates improving interview ability with visible strengths in communication and learning mindset. Further refinement can significantly boost overall readiness.',
    encouragement: 'Strong momentum. Keep refining structured responses and interview presence.',
    badgeClass: 'text-indigo-700 border-indigo-300/70 bg-gradient-to-r from-sky-100/90 to-violet-100/80 dark:from-sky-900/30 dark:to-violet-900/30',
    glowShadow: '0 14px 30px rgba(99, 102, 241, 0.2)'
  },
  {
    min: 51,
    max: 75,
    name: 'INDUSTRY READY',
    description: 'Displays solid professional readiness with balanced technical and communication skills suitable for real-world interview environments.',
    encouragement: 'You are interview-ready. Continue polishing for high-impact opportunities.',
    badgeClass: 'text-cyan-800 border-cyan-300/70 bg-gradient-to-r from-cyan-100/90 to-amber-100/70 dark:from-cyan-900/30 dark:to-amber-900/25',
    glowShadow: '0 16px 34px rgba(14, 165, 233, 0.24)'
  },
  {
    min: 76,
    max: 100,
    name: 'PINNACLE CANDIDATE',
    description: 'Represents exceptional interview preparedness, professional confidence, and high-level performance across multiple evaluation categories.',
    encouragement: 'Exceptional performance. Sustain this standard for top-tier roles.',
    badgeClass: 'text-amber-800 border-amber-300/80 bg-gradient-to-r from-amber-100/95 via-rose-100/80 to-sky-100/85 dark:from-amber-900/35 dark:via-rose-900/30 dark:to-sky-900/30',
    glowShadow: '0 18px 36px rgba(251, 191, 36, 0.28)'
  }
];

const clampScore = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(10, n));
};

export const buildInterviewScoreBreakdown = (feedback = {}) => SCORE_FIELDS.map((field) => {
  const direct = feedback[field.key];
  const legacy = LEGACY_MAP[field.key] ? feedback[LEGACY_MAP[field.key]] : undefined;
  return { key: field.key, label: field.label, value: clampScore(direct ?? legacy ?? 0) };
});

export const calculateInterviewAchievement = (feedback = {}) => {
  const breakdown = buildInterviewScoreBreakdown(feedback);
  const totalOutOf100 = Math.round(breakdown.reduce((sum, item) => sum + item.value, 0) * 10) / 10;
  const percentage = Math.round(totalOutOf100);
  const tier = BADGE_TIERS.find((item) => percentage >= item.min && percentage <= item.max) || BADGE_TIERS[0];

  const summary = percentage <= 25
    ? 'Early-stage interview performance with strong growth potential.'
    : percentage <= 50
      ? 'Balanced interview performance with developing professional readiness.'
      : percentage <= 75
        ? 'Strong interview readiness with balanced technical and communication performance.'
        : 'Excellent interview readiness with strong communication and technical presence.';

  const strengths = breakdown.filter((item) => item.value >= 7).map((item) => item.label);
  const improvements = breakdown.filter((item) => item.value < 7).map((item) => item.label);

  return {
    breakdown,
    totalOutOf100,
    percentage,
    tier,
    summary,
    strengths,
    improvements
  };
};
