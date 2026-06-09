interface StarRatingProps {
  value: number | null | undefined;
  onChange: (rating: number) => void;
  disabled?: boolean;
}

export function StarRating({ value, onChange, disabled }: StarRatingProps) {
  const current = value ?? 0;

  return (
    <div className="star-rating" role="group" aria-label="Puntuación">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star-btn ${star <= current ? 'star-filled' : ''}`}
          disabled={disabled}
          aria-label={`${star} estrellas`}
          aria-pressed={star <= current}
          onClick={() => onChange(star)}
        >
          ★
        </button>
      ))}
    </div>
  );
}
