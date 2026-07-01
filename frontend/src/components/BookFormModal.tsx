import type { Book } from '../api/types';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import './BookFormModal.css';

export type BookFormMode = 'create' | 'edit';

export type BookFormModalProps = {
  open: boolean;
  mode: BookFormMode;
  book?: Book | null;
  onClose: () => void;
};

export function BookFormModal({ open, mode, book, onClose }: BookFormModalProps) {
  const title =
    mode === 'edit' && book
      ? `Editar libro — ${book.title}`
      : 'Añadir libro manualmente';

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" disabled title="Disponible cuando se implemente el formulario completo (KAN-28)">
            Guardar
          </Button>
        </>
      }
    >
      {mode === 'edit' && book ? (
        <div className="book-form-placeholder">
          <p>
            Formulario completo de edición (título, autora, portada, género, audiencia,
            páginas, saga, estado, fechas y más) en curso de implementación.
          </p>
          <dl className="book-form-preview">
            <div>
              <dt>Título</dt>
              <dd>{book.title}</dd>
            </div>
            <div>
              <dt>Autora</dt>
              <dd>{book.authors}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <p className="book-form-placeholder">
          El formulario de alta manual se conectará en un ticket posterior.
        </p>
      )}
    </Modal>
  );
}
