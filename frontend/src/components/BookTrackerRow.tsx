import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { patchBook, patchReadingRecord } from '../api/client';
import { messageFromUnknownError } from '../api/errors';
import type {
  AudienceType,
  Book,
  ReadingRecordPatchedResponse,
  ReadingRecordResource,
} from '../api/types';
import type { ReadingRecordUpdateContext } from '../lib/goalsCacheInvalidation';
import { InlineDateField } from './InlineDateField';
import { AudienceSelect } from './AudienceSelect';
import { ReadingStatusSelect } from './ReadingStatusSelect';
import { StarRating } from './StarRating';

interface BookTrackerRowProps {
  book: Book;
  onOpenCompletionModal: (
    bookId: string,
    reading: ReadingRecordResource,
  ) => void;
  onUpdated: (
    ctx: ReadingRecordUpdateContext & { tbrAutoCompleted?: boolean },
  ) => void;
  onBookUpdated: () => void;
}

export function BookTrackerRow({
  book,
  onOpenCompletionModal,
  onUpdated,
  onBookUpdated,
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
      onUpdated({
        tbrAutoCompleted: data.meta?.tbrAutoCompleted,
        previousStatus: status,
        newStatus: data.reading.status,
        previousFinishedOn: book.finished_on,
        finishedOn: data.reading.finished_on,
      });
    },
    onError: (err) => {
      setFieldError(messageFromUnknownError(err));
    },
  });

  const bookMutation = useMutation({
    mutationFn: (audience: AudienceType | null) =>
      patchBook(book.id, { audience }),
    onSuccess: () => {
      setFieldError(null);
      onBookUpdated();
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
      <td className="audience-cell">
        <AudienceSelect
          id={`audience-${book.id}`}
          label={`Audience for ${book.title}`}
      className="audience-select--inline"
          value={book.audience}
          disabled={mutation.isPending || bookMutation.isPending}
          onChange={(next) => bookMutation.mutate(next)}
        />
      </td>
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
