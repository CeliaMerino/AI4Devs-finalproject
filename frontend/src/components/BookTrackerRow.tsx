import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { patchReadingRecord } from '../api/client';
import { messageFromUnknownError } from '../api/errors';
import type {
  Book,
  ReadingRecordPatchedResponse,
  ReadingRecordResource,
} from '../api/types';
import { InlineDateField } from './InlineDateField';
import { ReadingStatusSelect } from './ReadingStatusSelect';
import { StarRating } from './StarRating';

interface BookTrackerRowProps {
  book: Book;
  onOpenCompletionModal: (
    bookId: string,
    reading: ReadingRecordResource,
  ) => void;
  onUpdated: (
    tbrAutoCompleted?: boolean,
    finishedOn?: string | null,
    transitionedToLeido?: boolean,
  ) => void;
}

export function BookTrackerRow({
  book,
  onOpenCompletionModal,
  onUpdated,
}: BookTrackerRowProps) {
  const [fieldError, setFieldError] = useState<string | null>(null);

  const status = book.reading_status ?? 'pendiente';
  const showStartDate =
    status === 'leyendo' || status === 'leido' || status === 'dnf';
  const showFinishDate = status === 'leido';
  const showRating = status === 'leido';

  const mutation = useMutation({
    mutationFn: (body: Parameters<typeof patchReadingRecord>[1]) =>
      patchReadingRecord(book.id, body),
    onSuccess: (data: ReadingRecordPatchedResponse) => {
      setFieldError(null);
      if (data.meta?.openCompletionModal) {
        onOpenCompletionModal(book.id, data.reading);
      }
      const transitionedToLeido =
        status !== 'leido' && data.reading.status === 'leido';
      onUpdated(
        data.meta?.tbrAutoCompleted,
        data.reading.finished_on,
        transitionedToLeido,
      );
    },
    onError: (err) => {
      setFieldError(messageFromUnknownError(err));
    },
  });

  const patch = (body: Parameters<typeof patchReadingRecord>[1]) => {
    mutation.mutate(body);
  };

  return (
    <tr>
      <td>
        {book.cover_image_url ? (
          <img src={book.cover_image_url} alt="" className="table-cover" />
        ) : (
          <span className="no-cover">—</span>
        )}
      </td>
      <td>{book.title}</td>
      <td>{book.authors}</td>
      <td>{book.genre ?? '—'}</td>
      <td>{book.page_count ?? '—'}</td>
      <td className="status-cell">
        <ReadingStatusSelect
          value={status}
          disabled={mutation.isPending}
          onChange={(next) => patch({ status: next })}
        />
        {fieldError && (
          <span className="row-error" role="alert">
            {fieldError}
          </span>
        )}
      </td>
      <td>
        {showStartDate ? (
          <InlineDateField
            label="Fecha de inicio"
            value={book.started_on}
            disabled={mutation.isPending}
            onChange={(started_on) => patch({ started_on })}
          />
        ) : (
          '—'
        )}
      </td>
      <td>
        {showFinishDate ? (
          <InlineDateField
            label="Fecha de fin"
            value={book.finished_on}
            disabled={mutation.isPending}
            onChange={(finished_on) => patch({ finished_on })}
          />
        ) : (
          '—'
        )}
      </td>
      <td>
        {showRating ? (
          <StarRating
            value={book.rating}
            disabled={mutation.isPending}
            onChange={(rating) => patch({ rating })}
          />
        ) : (
          '—'
        )}
      </td>
    </tr>
  );
}
