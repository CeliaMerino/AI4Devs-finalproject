import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { createAudience, deleteAudience, listAudiences } from '../../api/client';
import { messageFromUnknownError } from '../../api/errors';
import { Button, Card, Input } from '../ui';
import './AudienceSettingsSection.css';

export function AudienceSettingsSection() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { data: audiences = [], isLoading, error } = useQuery({
    queryKey: ['audiences'],
    queryFn: listAudiences,
  });

  const createMutation = useMutation({
    mutationFn: (audienceName: string) => createAudience(audienceName),
    onSuccess: () => {
      setName('');
      setFormError(null);
      void queryClient.invalidateQueries({ queryKey: ['audiences'] });
    },
    onError: (err) => {
      setFormError(messageFromUnknownError(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (audienceId: string) => deleteAudience(audienceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['audiences'] });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError('Introduce un nombre para el elemento.');
      return;
    }
    setFormError(null);
    createMutation.mutate(trimmed);
  }

  return (
    <Card title="Público objetivo" className="audience-settings">
      <p className="audience-settings__intro">
        Personaliza las etiquetas de público objetivo para clasificar tus libros
        (infantil, juvenil, adulto, etc.).
      </p>

      {isLoading ? (
        <p className="audience-settings__status">Cargando elementos…</p>
      ) : null}
      {error ? (
        <p className="audience-settings__error" role="alert">
          No se pudieron cargar los elementos.
        </p>
      ) : null}

      <ul className="audience-settings__list" aria-label="Público objetivo configurado">
        {audiences.map((audience) => (
          <li key={audience.id} className="audience-settings__item">
            <span className="audience-settings__name">
              {audience.name}
              {audience.is_default ? (
                <span className="audience-settings__badge">Predeterminada</span>
              ) : null}
            </span>
            <Button
              type="button"
              variant="ghost"
              className="audience-settings__delete"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(audience.id)}
            >
              Eliminar
            </Button>
          </li>
        ))}
      </ul>

      <form className="audience-settings__form" onSubmit={handleSubmit}>
        <Input
          label="Nuevo elemento"
          value={name}
          maxLength={100}
          placeholder="Ej. Young Adult"
          onChange={(event) => setName(event.target.value)}
        />
        {formError ? (
          <p className="audience-settings__error" role="alert">
            {formError}
          </p>
        ) : null}
        <Button type="submit" disabled={createMutation.isPending}>
          Añadir elemento
        </Button>
      </form>
    </Card>
  );
}
