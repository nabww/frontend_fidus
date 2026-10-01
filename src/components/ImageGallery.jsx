import { useEffect, useRef, useState } from "react";
import { imageUrl } from "../api/client";

// Product image slider: native swipe (scroll-snap) on touch, arrows + keyboard on
// desktop, thumbnails (desktop) / dots (mobile) to jump between images.
export default function ImageGallery({ images, alt }) {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const count = images.length;
  const imagesKey = images.join("|");

  // Reset when the set of images changes (e.g. navigating to another product)
  useEffect(() => {
    setIndex(0);
    trackRef.current?.scrollTo({ left: 0 });
  }, [imagesKey]);

  function goTo(i) {
    const track = trackRef.current;
    if (!track) return;
    const next = Math.max(0, Math.min(count - 1, i));
    track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
    setIndex(next);
  }

  function onScroll() {
    const track = trackRef.current;
    if (!track?.clientWidth) return;
    setIndex(Math.round(track.scrollLeft / track.clientWidth));
  }

  function onKeyDown(e) {
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(index + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); goTo(index - 1); }
  }

  if (count === 0) return <div className="pd-image">◆</div>;

  return (
    <div className="gallery">
      <div
        className="gallery__viewport"
        tabIndex={count > 1 ? 0 : -1}
        onKeyDown={onKeyDown}
        role="region"
        aria-roledescription="carousel"
        aria-label={`${alt} images`}
      >
        <div className="gallery__track" ref={trackRef} onScroll={onScroll}>
          {images.map((url, i) => (
            <div
              key={url}
              className="gallery__slide"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
            >
              <img src={imageUrl(url)} alt={`${alt} — image ${i + 1}`} loading={i === 0 ? "eager" : "lazy"} draggable="false" />
            </div>
          ))}
        </div>

        {count > 1 && (
          <>
            <button type="button" className="gallery__nav gallery__nav--prev" aria-label="Previous image"
              disabled={index === 0} onClick={() => goTo(index - 1)}>‹</button>
            <button type="button" className="gallery__nav gallery__nav--next" aria-label="Next image"
              disabled={index === count - 1} onClick={() => goTo(index + 1)}>›</button>
            <span className="gallery__counter" aria-live="polite">{index + 1} / {count}</span>
          </>
        )}
      </div>

      {count > 1 && (
        <>
          <div className="gallery__thumbs">
            {images.map((url, i) => (
              <button key={url} type="button" aria-label={`Show image ${i + 1}`}
                className={`gallery__thumb ${i === index ? "is-active" : ""}`} onClick={() => goTo(i)}>
                <img src={imageUrl(url)} alt="" loading="lazy" />
              </button>
            ))}
          </div>
          <div className="gallery__dots" aria-hidden="true">
            {images.map((url, i) => (
              <span key={url} className={`gallery__dot ${i === index ? "is-active" : ""}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
