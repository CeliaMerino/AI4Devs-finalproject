import { useEffect, useState } from 'react';
import type { ReadFormat, ReadingRecordResource } from '../api/types';
import { READ_FORMAT_OPTIONS } from './readingStatus';
import { StarRating } from './StarRating';
import './CompletionModal.css';

interface CompletionModalProps {
  open: boolean;
  reading: ReadingRecordResource | null;
  saving: boolean;
  onClose: () => void;
  onSave: (payload: {
    finished_on: string;
    read_format?: ReadFormat;
    rating?: number;
  }) => void;
}

export function CompletionModal({
  open,
  reading,
  saving,
  onClose,
  onSave,
}: CompletionModalProps) {
  const [finishedOn, setFinishedOn] = useState('');
  const [readFormat, setReadFormat] = useState<ReadFormat | ''>('');
  const [rating, setRating] = useState<number | null>(null);

  useEffect(() => {
    if (reading) {
      setFinishedOn(reading.finished_on ?? new Date().toISOString().slice(0, 10));
      setReadFormat(reading.read_format ?? '');
      setRating(reading.rating);
    }
  }, [reading]);

  if (!open || !reading) {
    return null;
  }

  return (
    <div className="completion-overlay" role="presentation" onClick={onClose}>
      <div
        className="completion-modal"
        role="dialog"
        aria-labelledby="completion-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="completion-title">Finalizar lectura</h2>
        <label className="completion-field">
          Fecha de fin
          <input
            type="date"
            value={finishedOn}
            onChange={(e) => setFinishedOn(e.target.value)}
          />
        </label>
        <label className="completion-field">
          Formato
          <select
            value={readFormat}
            onChange={(e) =>
              setReadFormat(e.target.value as ReadFormat | '')
            }
          >
            <option value="">—</option>
            {READ_FORMAT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <div className="completion-field">
          <span>Puntuación</span>
          <StarRating
            value={rating}
            onChange={(r) => setRating(r)}
            disabled={saving}
          />
        </div>
        <div className="completion-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cerrar
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={saving || !finishedOn}
            onClick={() =>
              onSave({
                finished_on: finishedOn,
                ...(readFormat ? { read_format: readFormat } : {}),
                ...(rating ? { rating } : {}),
              })
            }
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
