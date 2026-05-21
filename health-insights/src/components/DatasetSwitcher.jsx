import "./DatasetSwitcher.css";

export default function DatasetSwitcher({ datasets, active, onChange }) {
  return (
    <div className="dataset-switcher" role="group" aria-label="Choose dataset">
      {Object.entries(datasets).map(([key, { label }]) => (
        <button
          key={key}
          className={`dataset-btn ${active === key ? "dataset-btn--active" : ""}`}
          onClick={() => onChange(key)}
          aria-pressed={active === key}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
