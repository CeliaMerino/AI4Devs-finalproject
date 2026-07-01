import type { ReadFormat } from '../api/types';
import { Select } from './ui';
import { READ_FORMAT_OPTIONS } from './readingStatus';
import './ReadFormatSelect.css';

export type ReadFormatSelectProps = {
  value: ReadFormat | null | undefined;
  onChange: (value: ReadFormat | null) => void;
  disabled?: boolean;
  id?: string;
  label?: string;
  className?: string;
};

export function ReadFormatSelect({
  value,
  onChange,
  disabled,
  id = 'book-read-format',
  label = 'Formato',
  className = '',
}: ReadFormatSelectProps) {
  return (
    <div className={`read-format-select ${className}`.trim()}>
      <Select
        id={id}
        label={label}
        value={value ?? ''}
        disabled={disabled}
        onChange={(event) => {
          const next = event.target.value;
          onChange(next === '' ? null : (next as ReadFormat));
        }}
      >
        <option value="">—</option>
        {READ_FORMAT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
