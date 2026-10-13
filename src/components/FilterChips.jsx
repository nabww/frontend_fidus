// options: ["paid", ...] or [{ value, label }]; "" is the "All" choice
export default function FilterChips({ options, value, onChange }) {
  return (
    <div className="chip-row">
      {options.map((o) => {
        const { value: v, label } = typeof o === "string" ? { value: o, label: o || "All" } : o;
        return (
          <button
            key={v || "all"}
            type="button"
            className={`chip${value === v ? " chip--active" : ""}`}
            onClick={() => onChange(v)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
