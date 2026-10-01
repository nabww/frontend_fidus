export default function SearchBox({ value, onChange, placeholder = "Search", className = "" }) {
  return (
    <div className={`searchbox ${className}`}>
      <svg className="searchbox__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        className="input searchbox__input"
        type="text"
        inputMode="search"
        autoComplete="off"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Escape") onChange(""); }}
      />
      {value && (
        <button type="button" className="searchbox__clear" aria-label="Clear search" onClick={() => onChange("")}>
          ×
        </button>
      )}
    </div>
  );
}
