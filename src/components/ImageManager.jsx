import { useEffect, useRef, useState } from "react";
import { imageUrl } from "../api/client";
import { useToast } from "../context/ToastContext";
import { TrashIcon } from "./Icons";

export const MAX_IMAGES = 8;
const MAX_BYTES = 5 * 1024 * 1024;
let keySeq = 0;

// Entries are { key, kind: "existing", url } or { key, kind: "new", file, preview }.
// The first entry is the cover shown on product cards.
export function existingEntries(urls) {
  return urls.map((url) => ({ key: `e${keySeq++}`, kind: "existing", url }));
}

export default function ImageManager({ value, onChange }) {
  const { toast } = useToast();
  const fileInput = useRef(null);
  const [urlDraft, setUrlDraft] = useState("");
  const remaining = MAX_IMAGES - value.length;

  // Free object URLs for previews when entries go away
  const previews = useRef(new Set());
  useEffect(() => {
    const current = new Set(value.filter((e) => e.kind === "new").map((e) => e.preview));
    for (const p of previews.current) if (!current.has(p)) URL.revokeObjectURL(p);
    previews.current = current;
  }, [value]);
  useEffect(() => () => previews.current.forEach((p) => URL.revokeObjectURL(p)), []);

  function addFiles(fileList) {
    const files = [...fileList];
    const valid = files.filter((f) => f.type.startsWith("image/") && f.size <= MAX_BYTES);
    if (valid.length < files.length) toast("Some files were skipped — images only, up to 5MB each", { type: "error" });
    if (valid.length > remaining) toast(`Only ${MAX_IMAGES} images per product`, { type: "error" });
    const added = valid.slice(0, Math.max(0, remaining)).map((file) => ({
      key: `n${keySeq++}`, kind: "new", file, preview: URL.createObjectURL(file),
    }));
    if (added.length) onChange([...value, ...added]);
  }

  function addUrl() {
    const url = urlDraft.trim();
    if (!/^https?:\/\//i.test(url)) return toast("Image URLs must start with http:// or https://", { type: "error" });
    if (remaining <= 0) return toast(`Only ${MAX_IMAGES} images per product`, { type: "error" });
    onChange([...value, { key: `e${keySeq++}`, kind: "existing", url }]);
    setUrlDraft("");
  }

  const move = (from, to) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };
  const remove = (i) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div className="image-manager">
      {value.length > 0 && (
        <div className="image-manager__grid">
          {value.map((entry, i) => (
            <div key={entry.key} className="image-tile">
              <img src={entry.kind === "new" ? entry.preview : imageUrl(entry.url)} alt={`Image ${i + 1}`} />
              {i === 0 && <span className="image-tile__cover">Cover</span>}
              <div className="image-tile__actions">
                <button type="button" aria-label="Move left" disabled={i === 0} onClick={() => move(i, i - 1)}>‹</button>
                {i !== 0 && (
                  <button type="button" className="image-tile__make-cover" onClick={() => move(i, 0)}>Cover</button>
                )}
                <button type="button" aria-label="Move right" disabled={i === value.length - 1} onClick={() => move(i, i + 1)}>›</button>
                <button type="button" aria-label="Remove image" className="image-tile__remove" onClick={() => remove(i)}>
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        className={`image-drop ${remaining <= 0 ? "is-full" : ""}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); if (remaining > 0) addFiles(e.dataTransfer.files); }}
      >
        <button type="button" className="btn btn--ghost" disabled={remaining <= 0}
          onClick={() => fileInput.current?.click()}>
          {value.length ? "Add more images" : "Add images"}
        </button>
        <span className="muted">
          {remaining > 0 ? `or drop them here · ${remaining} of ${MAX_IMAGES} left · 5MB max each` : `${MAX_IMAGES} image limit reached`}
        </span>
        <input ref={fileInput} type="file" accept="image/*" multiple hidden
          onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
      </div>

      {remaining > 0 && (
        <div className="image-manager__url">
          <input className="input" type="url" placeholder="…or paste an image URL" value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addUrl(); } }} />
          <button type="button" className="btn btn--ghost" onClick={addUrl} disabled={!urlDraft.trim()}>Add</button>
        </div>
      )}
    </div>
  );
}
