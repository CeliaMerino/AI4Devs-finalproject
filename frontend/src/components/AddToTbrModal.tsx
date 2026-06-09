import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  addTbrEntry,
  catalogEditionToCreatePayload,
  createBook,
  listBooks,
  searchCatalog,
} from '../api/client';
import { ApiRequestError, messageFromUnknownError } from '../api/errors';
import type { Book, CatalogEdition } from '../api/types';
import './AddToTbrModal.css';

type Tab = 'library' | 'search';

interface AddToTbrModalProps {
  open: boolean;
  year: number;
  month: number;
  existingBookIds: Set<string>;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddToTbrModal({
  open,
  year,
  month,
  existingBookIds,
  onClose,
  onSuccess,
}: AddToTbrModalProps) {
  const [tab, setTab] = useState<Tab>('library');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CatalogEdition[]>([]);
  const [selectedEdition, setSelectedEdition] = useState<CatalogEdition | null>(
    null,
  );
  const [searchLoading, setSearchLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: books = [], isLoading } = useQuery({
    queryKey: ['books'],
    queryFn: listBooks,
    enabled: open,
  });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!open) {
      setTab('library');
      setSelectedId(null);
      setQuery('');
      setDebouncedQuery('');
      setSearchResults([]);
      setSelectedEdition(null);
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || tab !== 'search' || debouncedQuery.length < 2) {
      if (tab === 'search') setSearchResults([]);
      return;
    }

    let cancelled = false;
    setSearchLoading(true);
    setError(null);

    searchCatalog(debouncedQuery)
      .then((res) => {
        if (!cancelled) {
          setSearchResults(res.items);
          setSelectedEdition(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Could not search the catalog. Check your connection and try again.');
        }
      })
      .finally(() => {
        if (!cancelled) setSearchLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, tab, debouncedQuery]);

  if (!open) {
    return null;
  }

  const pendingBooks = books.filter(
    (b: Book) =>
      (b.reading_status ?? 'pendiente') === 'pendiente' &&
      !existingBookIds.has(b.id),
  );

  const addBookToTbr = async (bookId: string) => {
    await addTbrEntry(year, month, bookId);
    onSuccess();
    onClose();
  };

  const handleLibraryAdd = async () => {
    if (!selectedId) return;
    setSubmitting(true);
    setError(null);
    try {
      await addBookToTbr(selectedId);
    } catch (err) {
      setError(messageFromUnknownError(err));
      setSubmitting(false);
    }
  };

  const bookIdFromDuplicate = (err: ApiRequestError): string | null =>
    err.body.existingBookId ?? null;

  const handleSearchAdd = async () => {
    if (!selectedEdition) return;
    setSubmitting(true);
    setError(null);
    try {
      let bookId: string;
      try {
        const created = await createBook(
          catalogEditionToCreatePayload(selectedEdition),
        );
        bookId = created.book.id;
      } catch (err) {
        if (err instanceof ApiRequestError && err.status === 409) {
          const existingId = bookIdFromDuplicate(err);
          if (!existingId) {
            throw err;
          }
          const library = await listBooks();
          const existing = library.find((b) => b.id === existingId);
          if (existing && (existing.reading_status ?? 'pendiente') !== 'pendiente') {
            setError('Only pending books can be added to TBR.');
            setSubmitting(false);
            return;
          }
          bookId = existingId;
        } else {
          throw err;
        }
      }
      await addBookToTbr(bookId);
    } catch (err) {
      if (err instanceof ApiRequestError && err.body.code === 'TBR_BOOK_NOT_PENDING') {
        setError('Only pending books can be added to TBR.');
      } else {
        setError(messageFromUnknownError(err));
      }
      setSubmitting(false);
    }
  };

  const canConfirm =
    tab === 'library' ? !!selectedId : !!selectedEdition;

  const handleConfirm = () => {
    if (tab === 'library') {
      void handleLibraryAdd();
    } else {
      void handleSearchAdd();
    }
  };

  return (
    <div className="add-tbr-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="add-tbr-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-tbr-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="add-tbr-modal__header">
          <h2 id="add-tbr-title">Add book to TBR</h2>
          <button type="button" className="add-tbr-modal__close" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="add-tbr-modal__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'library'}
            className={tab === 'library' ? 'add-tbr-modal__tab--active' : ''}
            onClick={() => {
              setTab('library');
              setError(null);
            }}
          >
            Library
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'search'}
            className={tab === 'search' ? 'add-tbr-modal__tab--active' : ''}
            onClick={() => {
              setTab('search');
              setError(null);
            }}
          >
            Search
          </button>
        </div>

        {error && (
          <p className="add-tbr-modal__error" role="alert">
            {error}
          </p>
        )}

        {tab === 'library' && (
          <div role="tabpanel">
            {isLoading && <p>Loading library…</p>}
            {!isLoading && pendingBooks.length === 0 && (
              <p className="add-tbr-modal__hint">
                No pending books in your library. Search for a title to add.
              </p>
            )}
            <ul className="add-tbr-modal__list">
              {pendingBooks.map((book) => (
                <li key={book.id}>
                  <label className="add-tbr-modal__option">
                    <input
                      type="radio"
                      name="tbr-book"
                      value={book.id}
                      checked={selectedId === book.id}
                      onChange={() => setSelectedId(book.id)}
                    />
                    <span>
                      {book.title} — {book.authors}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === 'search' && (
          <div role="tabpanel" className="add-tbr-modal__search-panel">
            <input
              type="search"
              className="add-tbr-modal__search-input"
              placeholder="Search by title, author, or ISBN…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              minLength={2}
            />
            {searchLoading && <p>Searching catalog…</p>}
            {!searchLoading && debouncedQuery.length >= 2 && searchResults.length === 0 && (
              <p className="add-tbr-modal__hint">
                No catalog results. Try another query.
              </p>
            )}
            <ul className="add-tbr-modal__list">
              {searchResults.map((edition) => (
                <li key={`${edition.data_source}-${edition.external_provider_id}`}>
                  <label className="add-tbr-modal__option">
                    <input
                      type="radio"
                      name="tbr-edition"
                      checked={
                        selectedEdition?.external_provider_id ===
                          edition.external_provider_id &&
                        selectedEdition?.data_source === edition.data_source
                      }
                      onChange={() => setSelectedEdition(edition)}
                    />
                    <span>
                      {edition.title} — {edition.authors}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

        <footer className="add-tbr-modal__footer">
          <button type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={!canConfirm || submitting}
            onClick={handleConfirm}
          >
            Add to list
          </button>
        </footer>
      </div>
    </div>
  );
}
