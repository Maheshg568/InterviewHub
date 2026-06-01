export default function StarRating({ value, onChange, readOnly = false }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          className={`text-2xl leading-none ${star <= value ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'} ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
