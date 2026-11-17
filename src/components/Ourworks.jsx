import { useCallback, useEffect, useRef, useState } from "react";
import "./OurWorks.css";

/* ------------------------------------------------------------------
   IMAGES — put your files in:  public/images/
   Expected names (change the `src` paths below if yours differ):
     our-works-1.png  ...  our-works-7.png

   Portrait photos (roughly 2:3) fit the panels best.
   To add or remove a panel, add or remove a line in the list below.
------------------------------------------------------------------- */
const WORKS = [
  { id: 1, alt: "Work 1", src: "/images/ourworks-sec-image1.png" },
  { id: 2, alt: "Work 2", src: "/images/ourworks-sec-image2.png" },
  { id: 3, alt: "Work 3", src: "/images/ourworks-sec-image3.png" },
  { id: 4, alt: "Work 4", src: "/images/ourworks-sec-image4.png" },
  { id: 5, alt: "Work 5", src: "/images/ourworks-sec-image5.png" },
  { id: 6, alt: "Work 6", src: "/images/ourworks-sec-image6.png" },
  { id: 7, alt: "Work 7", src: "/images/ourworks-sec-image7.png" },
];

const SPEED = 40; // pixels per second, left -> right (raise to go faster)

export default function OurWorks() {
  const trackRef = useRef(null);
  const setRef = useRef(null);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);
  const rafRef = useRef(0);
  const lastRef = useRef(0);

  const [active, setActive] = useState(null); // { src, alt, rect }
  const [expanded, setExpanded] = useState(false);

  /* ---------- slow left -> right scrolling ---------- */
  const tick = useCallback((now) => {
    const track = trackRef.current;
    const setEl = setRef.current;
    if (track && setEl) {
      const dt = lastRef.current ? (now - lastRef.current) / 1000 : 0;
      lastRef.current = now;

      if (!pausedRef.current) {
        const setWidth = setEl.offsetWidth;
        let next = offsetRef.current + SPEED * dt;
        // seamless loop: once one full set has passed, jump back
        if (next >= 0) next -= setWidth;
        offsetRef.current = next;
        track.style.transform = `translate3d(${next}px,0,0)`;
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (setRef.current) offsetRef.current = -setRef.current.offsetWidth;
    if (!reduce) rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  /* ---------- click: pause + zoom in ---------- */
  const openImage = (e, work) => {
    if (active) return;
    const rect = e.currentTarget.getBoundingClientRect();
    pausedRef.current = true;
    setActive({ src: work.src, alt: work.alt, rect });
    // next frame: grow from the clicked panel's position to full screen
    requestAnimationFrame(() => requestAnimationFrame(() => setExpanded(true)));
  };

  /* ---------- click again / Esc: zoom out + resume scrolling ---------- */
  const closeImage = useCallback(() => {
    setExpanded(false);
  }, []);

  const onZoomEnd = (e) => {
    if (e.propertyName !== "width") return;
    if (!expanded) {
      setActive(null);
      lastRef.current = 0; // avoid a time jump when scrolling restarts
      pausedRef.current = false;
    }
  };

  useEffect(() => {
    if (!active) return;
    const onKey = (e) => e.key === "Escape" && closeImage();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, closeImage]);

  const renderSet = (setIndex) =>
    WORKS.map((w) => (
      <button
        type="button"
        key={`${setIndex}-${w.id}`}
        className="works__item"
        onClick={(e) => openImage(e, w)}
        aria-label={`Open ${w.alt}`}
        tabIndex={setIndex === 0 ? 0 : -1}
        aria-hidden={setIndex === 1}
      >
        <img src={w.src} alt={setIndex === 0 ? w.alt : ""} draggable={false} />
      </button>
    ));

  return (
    <section className="works" id="our-works" aria-label="Our works">
      <h2 className="works__title">Our Works</h2>

      <div className="works__viewport">
        <div className="works__track" ref={trackRef}>
          <div className="works__set" ref={setRef}>{renderSet(0)}</div>
          <div className="works__set">{renderSet(1)}</div>
        </div>
      </div>

      {active && (
        <div
          className={`works__zoom ${expanded ? "is-open" : ""}`}
          style={
            expanded
              ? undefined
              : {
                  top: active.rect.top,
                  left: active.rect.left,
                  width: active.rect.width,
                  height: active.rect.height,
                }
          }
          onClick={closeImage}
          onTransitionEnd={onZoomEnd}
          role="dialog"
          aria-label={`${active.alt}, enlarged. Click to close.`}
        >
          <img src={active.src} alt={active.alt} draggable={false} />
        </div>
      )}
    </section>
  );
}