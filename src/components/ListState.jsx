// Loading and empty states shared by every list page

export function ListSkeleton({ rows = 4 }) {
  return (
    <div className="stack" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="card list-skeleton">
          <div className="shimmer" style={{ height: 14, width: "40%", borderRadius: 4 }} />
          <div className="shimmer" style={{ height: 11, width: "70%", borderRadius: 4 }} />
        </div>
      ))}
    </div>
  );
}

// `query`/`filtered` say why the list is empty so the message can offer a way out
export function ListEmpty({ query, filtered, onClear, children }) {
  if (query || filtered) {
    return (
      <div className="list-empty">
        <p>
          {query ? (
            <>
              No matches for <strong>“{query}”</strong>.
            </>
          ) : (
            "Nothing matches this filter."
          )}
        </p>
        {onClear && (
          <button className="btn btn--ghost btn--sm" onClick={onClear}>
            Clear
          </button>
        )}
      </div>
    );
  }
  return (
    <div className="list-empty">
      <p>{children}</p>
    </div>
  );
}
