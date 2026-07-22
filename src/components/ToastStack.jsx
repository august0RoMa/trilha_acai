export default function ToastStack({ toasts }) {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((t) => (
        <div className={`toast ${t.type === 'error' ? 'error' : ''}`} key={t.id}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
