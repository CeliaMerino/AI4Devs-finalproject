import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { listBooks } from '../api/client';
import { AddBookModal } from '../components/AddBookModal';
import './BookTrackerPage.css';

export function BookTrackerPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: books = [], isLoading, error } = useQuery({
    queryKey: ['books'],
    queryFn: listBooks,
  });

  return (
    <div className="book-tracker">
      <header className="tracker-header">
        <h1>Book Tracker</h1>
        <button
          type="button"
          className="btn-add"
          onClick={() => setModalOpen(true)}
        >
          Añadir libro
        </button>
      </header>

      {isLoading && <p>Cargando biblioteca…</p>}
      {error && <p className="tracker-error">No se pudo cargar la biblioteca.</p>}

      {!isLoading && books.length === 0 && (
        <p className="tracker-empty">Aún no tienes libros. Pulsa «Añadir libro» para empezar.</p>
      )}

      <table className="books-table">
        <thead>
          <tr>
            <th>Portada</th>
            <th>Título</th>
            <th>Autora</th>
            <th>Género</th>
            <th>Páginas</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {books.map((book) => (
            <tr key={book.id}>
              <td>
                {book.cover_image_url ? (
                  <img
                    src={book.cover_image_url}
                    alt=""
                    className="table-cover"
                  />
                ) : (
                  <span className="no-cover">—</span>
                )}
              </td>
              <td>{book.title}</td>
              <td>{book.authors}</td>
              <td>{book.genre ?? '—'}</td>
              <td>{book.page_count ?? '—'}</td>
              <td>{book.reading_status ?? 'pendiente'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <AddBookModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['books'] })}
      />
    </div>
  );
}
