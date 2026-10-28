"use client";

import { useEffect, useMemo, useState } from "react";

const images = [
  {
    src: "/durgacenter/gathering-1.jpeg",
    alt: "Community gatherings at the Townhall Meeting",
  },
  {
    src: "/durgacenter/gathering-2.jpeg",
    alt: "Townhall meeting",
  },
  {
    src: "/durgacenter/gathering-3.jpeg",
    alt: "Community members at Townhall meeting",
  },
] as const;

export function DurgacenterJourneyGallery() {
  const slides = useMemo(() => [...images, ...images, ...images], []);
  const [slideIndex, setSlideIndex] = useState<number>(images.length);
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setSlideIndex((current) => current + 1), 5000);
    return () => window.clearInterval(timer);
  }, [paused]);

  useEffect(() => {
    if (slideIndex === 0 || slideIndex === images.length * 2) {
      const timer = window.setTimeout(() => {
        setAnimate(false);
        setSlideIndex(images.length);
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => setAnimate(true)));
      }, 520);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [slideIndex]);

  const move = (direction: -1 | 1) => {
    setAnimate(true);
    setSlideIndex((current) => current + direction);
  };

  const activeDot = (slideIndex - images.length + images.length) % images.length;

  return (
    <div
      className="durgacenter-gallery-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label="Community gathering photos"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="durgacenter-gallery-viewport">
        <div
          className="durgacenter-gallery-track"
          style={{ transform: `translateX(-${slideIndex * 11.111111}%)`, transition: animate ? "transform 500ms ease" : "none" }}
        >
          {slides.map((image, index) => (
            <div className="durgacenter-gallery-slide" key={`${image.src}-${index}`} role="group" aria-roledescription="slide" aria-label={`${(index % images.length) + 1} of ${images.length}`}>
              <img src={image.src} alt={image.alt} />
            </div>
          ))}
        </div>
      </div>
      <button type="button" className="durgacenter-gallery-arrow durgacenter-gallery-prev" onClick={() => move(-1)} aria-label="Previous image">‹</button>
      <button type="button" className="durgacenter-gallery-arrow durgacenter-gallery-next" onClick={() => move(1)} aria-label="Next image">›</button>
      <div className="durgacenter-gallery-dots" aria-label="Choose image">
        {images.map((image, index) => (
          <button key={image.src} type="button" className={activeDot === index ? "is-active" : ""} onClick={() => { setAnimate(true); setSlideIndex(images.length + index); }} aria-label={`Show image ${index + 1}`} aria-current={activeDot === index ? "true" : undefined} />
        ))}
      </div>
    </div>
  );
}
