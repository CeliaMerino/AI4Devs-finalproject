import type { AudienceType } from '../api/types';
import { Select } from './ui';
import './AudienceSelect.css';

export type AudienceSelectProps = {
  value: AudienceType | null | undefined;
  onChange: (value: AudienceType | null) => void;
  disabled?: boolean;
  id?: string;
  label?: string;
  className?: string;
};

export function AudienceSelect({
  value,
  onChange,
  disabled,
  id = 'book-audience',
  label = 'Audience',
  className = '',
}: AudienceSelectProps) {
  return (
    <div className={`audience-select ${className}`.trim()}>
      <Select
      id={id}
      label={label}
      className="audience-select"
      value={value ?? ''}
      disabled={disabled}
      onChange={(event) => {
        const next = event.target.value;
        onChange(next === '' ? null : (next as AudienceType));
      }}
    >
      <option value="">—</option>
      <option value="young_adult">Young Adult</option>
      <option value="new_adult">New Adult</option>
      <option value="adult">Adult</option>
    </Select>
    </div>
  );
}
