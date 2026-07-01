import { useCallback, type KeyboardEvent } from 'react';
import './StarRating.css';

export interface StarRatingProps {
  value: number | null | undefined;
  onChange: (rating: number) => void;
  disabled?: boolean;
  'aria-label'?: string;
}

export function StarRating({
  value,
  onChange,
  disabled,
  'aria-label': ariaLabel = 'Rating',
}: StarRatingProps) {
  const current = value ?? 0;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, star: number) => {
      if (disabled) return;

      if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
        event.preventDefault();
        onChange(Math.min(5, star + 1));
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
        event.preventDefault();
        onChange(Math.max(1, star - 1));
      } else if (event.key === 'Home') {
        event.preventDefault();
        onChange(1);
      } else if (event.key === 'End') {
        event.preventDefault();
        onChange(5);
      }
    },
    [disabled, onChange],
  );

  return (
    <div className="ui-star-rating" role="group" aria-label={ariaLabel}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`ui-star-rating__star ${star <= current ? 'ui-star-rating__star--filled' : ''}`}
          disabled={disabled}
          aria-label={`${star} of 5 stars`}
          aria-pressed={star <= current}
          onClick={() => onChange(star)}
          onKeyDown={(event) => handleKeyDown(event, star)}
        >
          ★
        </button>
      ))}
    </div>
  );
}
