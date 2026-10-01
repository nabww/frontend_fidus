// Phone camera shots are often 4–10MB (and HEIC on iPhones), which would blow the
// 5MB upload cap and the server's extension whitelist. Re-encode large or
// non-web images to a JPEG of at most MAX_EDGE px — plenty for product photos.
const MAX_EDGE = 1600;
const QUALITY = 0.85;
const WEB_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const SHRINK_ABOVE = 1.5 * 1024 * 1024;

export default async function shrinkImage(file) {
  if (file.type === "image/gif") return file; // keep animation intact
  if (WEB_TYPES.has(file.type) && file.size <= SHRINK_ABOVE) return file;

  let bitmap;
  try {
    // imageOrientation applies EXIF rotation so portrait phone shots stay upright
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file; // browser can't decode it (e.g. HEIC on desktop) — let validation decide
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", QUALITY));
  if (!blob) return file;
  const name = (file.name || "photo").replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
}
