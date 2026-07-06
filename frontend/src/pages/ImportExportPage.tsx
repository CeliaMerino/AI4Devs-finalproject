import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useId, useRef, useState, type FormEvent } from 'react';
import { importGoodreadsCsv } from '../api/client';
import { messageFromUnknownError } from '../api/errors';
import type { GoodreadsImportMeta } from '../api/types';
import { Button, Card, PageHeader } from '../components/ui';
import { validateGoodreadsCsvFile } from '../lib/goodreadsImport';
import './ImportExportPage.css';

function formatImportSummary(meta: GoodreadsImportMeta): string {
  const parts = [
    `${meta.imported_count} ${meta.imported_count === 1 ? 'libro importado' : 'libros importados'}`,
  ];

  if (meta.skipped_duplicate_count > 0) {
    parts.push(
      `${meta.skipped_duplicate_count} duplicados omitidos`,
    );
  }

  if (meta.skipped_invalid_count > 0) {
    parts.push(`${meta.skipped_invalid_count} filas descartadas`);
  }

  return `Importación completada: ${parts.join(', ')}.`;
}

export function ImportExportPage() {
  const queryClient = useQueryClient();
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const importMutation = useMutation({
    mutationFn: importGoodreadsCsv,
    onSuccess: (data) => {
      setSuccessMessage(formatImportSummary(data.meta));
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      void queryClient.invalidateQueries({ queryKey: ['books'] });
      void queryClient.invalidateQueries({ queryKey: ['stats'] });
      void queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const fileValidation = validateGoodreadsCsvFile(selectedFile);
  const canSubmit = fileValidation.valid && !importMutation.isPending;

  function handleFileChange(file: File | null) {
    setSuccessMessage(null);
    importMutation.reset();
    setSelectedFile(file);

    if (!file) {
      setValidationError(null);
      return;
    }

    const result = validateGoodreadsCsvFile(file);
    setValidationError(result.valid ? null : result.message);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage(null);

    const result = validateGoodreadsCsvFile(selectedFile);
    if (!result.valid || !selectedFile) {
      setValidationError(result.valid ? 'Selecciona un archivo CSV de Goodreads.' : result.message);
      return;
    }

    importMutation.mutate(selectedFile);
  }

  return (
    <div className="import-export-page">
      <PageHeader
        title="Import / Export"
        subtitle="Importa tu biblioteca desde Goodreads. La exportación a Excel o PDF llegará más adelante."
      />

      <main className="import-export-main" aria-label="Import and export options">
        <Card
          title="Importar desde Goodreads"
          subtitle="Sube el CSV que exportas desde tu cuenta de Goodreads. La importación es directa, sin previsualización."
          className="import-export-card"
        >
          <form
            className="goodreads-import-form"
            onSubmit={handleSubmit}
            aria-busy={importMutation.isPending}
            noValidate
          >
            <div className="ui-field">
              <label className="ui-field__label" htmlFor={fileInputId}>
                Archivo CSV de Goodreads
              </label>
              <input
                ref={fileInputRef}
                id={fileInputId}
                className="ui-input goodreads-import-form__file"
                type="file"
                name="file"
                accept=".csv,text/csv"
                disabled={importMutation.isPending}
                onChange={(event) =>
                  handleFileChange(event.target.files?.[0] ?? null)
                }
              />
              <p className="goodreads-import-form__hint" id={`${fileInputId}-hint`}>
                Formato CSV, máximo 10 MB. Puedes exportarlo desde Goodreads en
                «My Books» → «Import and export».
              </p>
            </div>

            {selectedFile ? (
              <p className="goodreads-import-form__filename" aria-live="polite">
                Archivo seleccionado: <strong>{selectedFile.name}</strong>
              </p>
            ) : null}

            {validationError ? (
              <p className="import-export-alert import-export-alert--error" role="alert">
                {validationError}
              </p>
            ) : null}

            {importMutation.isError ? (
              <p className="import-export-alert import-export-alert--error" role="alert">
                {messageFromUnknownError(importMutation.error)}
              </p>
            ) : null}

            {successMessage ? (
              <p
                className="import-export-alert import-export-alert--success"
                role="status"
              >
                {successMessage}
              </p>
            ) : null}

            <div className="goodreads-import-form__actions">
              <Button type="submit" disabled={!canSubmit}>
                {importMutation.isPending
                  ? 'Importando biblioteca…'
                  : 'Importar biblioteca'}
              </Button>
            </div>
          </form>
        </Card>

        <Card title="Exportar datos" className="import-export-card import-export-card--muted">
          <p className="import-export-card__text">
            La exportación a Excel, CSV, PNG y formatos para redes sociales está
            planificada para una fase posterior.
          </p>
        </Card>
      </main>
    </div>
  );
}
