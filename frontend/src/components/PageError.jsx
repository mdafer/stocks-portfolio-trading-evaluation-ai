export default function PageError({ message, onRetry }) {
  return (
    <div className="page-error">
      <div className="page-error-icon">⚠</div>
      <p>{message || 'Something went wrong'}</p>
      {onRetry && <button className="btn btn-sm" onClick={onRetry}>Try again</button>}
    </div>
  );
}
