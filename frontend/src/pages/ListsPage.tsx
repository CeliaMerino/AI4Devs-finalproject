import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { getMonthlyTbr, removeTbrEntry } from '../api/client';
import { messageFromUnknownError } from '../api/errors';
import { AddToTbrModal } from '../components/AddToTbrModal';
import { TbrEmptyState } from '../components/TbrEmptyState';
import { TbrEntryRow } from '../components/TbrEntryRow';
import './ListsPage.css';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function currentYearMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}

export function ListsPage() {
  const queryClient = useQueryClient();
  const [yearMonth, setYearMonth] = useState(currentYearMonth);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const { year, month } = yearMonth;

  const { data, isLoading, error } = useQuery({
    queryKey: ['tbr', year, month],
    queryFn: () => getMonthlyTbr(year, month),
  });

  const invalidateAfterAdd = () => {
    queryClient.invalidateQueries({ queryKey: ['tbr', year, month] });
    queryClient.invalidateQueries({ queryKey: ['books'] });
  };

  const removeMutation = useMutation({
    mutationFn: (entryId: string) => removeTbrEntry(year, month, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tbr', year, month] });
    },
  });

  const existingBookIds = useMemo(
    () => new Set(data?.entries.map((e) => e.book_id) ?? []),
    [data?.entries],
  );

  const shiftMonth = (delta: number) => {
    const d = new Date(Date.UTC(year, month - 1 + delta, 1));
    setYearMonth({
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
    });
  };

  const title = `TBR ${MONTH_NAMES[month - 1]} ${year}`;

  return (
    <div className="lists-page">
      <header className="lists-header">
        <h1>{title}</h1>
        <div className="lists-month-nav">
          <button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month">
            ←
          </button>
          <span>
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month">
            →
          </button>
        </div>
        {data && data.entries.length > 0 && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => setAddModalOpen(true)}
          >
            Add books
          </button>
        )}
      </header>

      {isLoading && <p>Loading TBR…</p>}
      {error && (
        <p className="lists-error" role="alert">
          Could not load TBR list.
        </p>
      )}
      {removeMutation.isError && (
        <p className="lists-error" role="alert">
          {messageFromUnknownError(removeMutation.error)}
        </p>
      )}

      {data && data.entries.length === 0 && (
        <TbrEmptyState onAddBooks={() => setAddModalOpen(true)} />
      )}

      {data && data.entries.length > 0 && (
        <ul className="tbr-checklist">
          {data.entries.map((entry) => (
            <TbrEntryRow
              key={entry.id}
              entry={entry}
              onRemove={(id) => removeMutation.mutate(id)}
              removing={removeMutation.isPending}
            />
          ))}
        </ul>
      )}

      <AddToTbrModal
        open={addModalOpen}
        year={year}
        month={month}
        existingBookIds={existingBookIds}
        onClose={() => setAddModalOpen(false)}
        onSuccess={() => {
          setAddModalOpen(false);
          invalidateAfterAdd();
        }}
      />
    </div>
  );
}
