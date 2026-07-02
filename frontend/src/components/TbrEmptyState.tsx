import { Button } from './ui';

interface TbrEmptyStateProps {
  onAddBooks: () => void;
}

export function TbrEmptyState({ onAddBooks }: TbrEmptyStateProps) {
  return (
    <div className="tbr-empty-state">
      <p>Your TBR list is empty. Add books from your library to plan what to read this month.</p>
      <Button type="button" onClick={onAddBooks}>
        Add books
      </Button>
    </div>
  );
}
