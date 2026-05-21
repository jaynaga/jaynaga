import "./NarrativeCard.css";

export default function NarrativeCard({ narrative }) {
  return (
    <div className="narrative-card glass-card">
      <div className="narrative-icon" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a10 10 0 1 0 10 10" />
          <path d="M12 6v6l4 2" />
        </svg>
      </div>
      <div className="narrative-content">
        <span className="narrative-label">This week</span>
        <p className="narrative-text">{narrative}</p>
      </div>
    </div>
  );
}
