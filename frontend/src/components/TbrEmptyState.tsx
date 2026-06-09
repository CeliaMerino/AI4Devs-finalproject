interface TbrEmptyStateProps {
  onAddBooks: () => void;
}

export function TbrEmptyState({ onAddBooks }: TbrEmptyStateProps) {
  return (
    <div className="tbr-empty-state">
      <p>Your TBR list is empty. Add books from your library to plan what to read this month.</p>
      <button type="button" className="btn-primary" onClick={onAddBooks}>
        Add books
      </button>
    </div>
  );
}
