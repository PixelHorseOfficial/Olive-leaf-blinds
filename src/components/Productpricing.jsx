import React, { useState, useEffect, useRef } from "react";
import "./Productpricing.css";

/*
  Images are hotlinked from Unsplash (free to use).
  Format: https://unsplash.com/photos/<photo-id>/download?force=true&w=1400
  Swap any `image` value for your own product photo when you have one.
*/
const unsplash = (id) =>
  `https://unsplash.com/photos/${id}/download?force=true&w=1400`;

const CURRENCY = "₹";

// Auto-highlight settings
const AUTOPLAY = true;
const AUTOPLAY_INTERVAL = 3500; // ms each model stays highlighted

const PRODUCTS = [
  {
    id: 1,
    name: "Classic Roller Blind",
    price: 3200,
    room: "Living Room",
    details: "Custom width · Light-filtering fabric",
    image: unsplash("Ztf7inpO-0s"),
  },
  {
    id: 2,
    name: "Aluminium Venetian",
    price: 2400,
    room: "Office",
    details: "25 mm slats · Cord tilt control",
    image: unsplash("NzTfWq_thaA"),
  },
  {
    id: 3,
    name: "Sheer Day & Night",
    price: 4800,
    room: "Bedroom",
    details: "Dual fabric · Soft diffused light",
    image: unsplash("ninCiZ_k6jI"),
  },
  {
    id: 4,
    name: "Timber Venetian",
    price: 6900,
    room: "Bedroom",
    details: "50 mm slats · Real wood finish",
    image: unsplash("V-6bv_-LzOo"),
  },
  {
    id: 5,
    name: "Framed Slat Blind",
    price: 5400,
    room: "Dining",
    details: "Wide slats · Inside-recess fit",
    image: unsplash("QzRbTq-8tuY"),
  },
  {
    id: 6,
    name: "Slimline Blackout",
    price: 7600,
    room: "Nursery",
    details: "100% blackout · Cordless lift",
    image: unsplash("79YLZcD19PM"),
  },
];

const formatPrice = (value) => `${CURRENCY}${value.toLocaleString("en-IN")}`;

const pad = (n) => String(n).padStart(2, "0");

const ProductPricing = () => {
  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState(null);

  const [inView, setInView] = useState(true);
  const sectionRef = useRef(null);

  // Hover previews a product; click locks it in.
  const activeIndex = hovered !== null ? hovered : selected;
  const active = PRODUCTS[activeIndex];

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Auto-advance only while the visitor is idle and the section is on screen.
  const isPlaying = AUTOPLAY && !reducedMotion && hovered === null && inView;

  // Track whether the section is visible so it doesn't cycle off-screen.
  useEffect(() => {
    const node = sectionRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.3 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Move to the next model after the interval. A click or hover changes the
  // dependencies, which resets the timer, so autoplay resumes from there.
  useEffect(() => {
    if (!isPlaying) return undefined;
    const timer = setTimeout(() => {
      setSelected((current) => (current + 1) % PRODUCTS.length);
    }, AUTOPLAY_INTERVAL);
    return () => clearTimeout(timer);
  }, [isPlaying, selected]);

  return (
    <section
      className="pp-section"
      aria-labelledby="pp-heading"
      ref={sectionRef}
      style={{ "--pp-interval": `${AUTOPLAY_INTERVAL}ms` }}
    >
      <div className="pp-container">
        {/* ---------- Left: model list ---------- */}
        <div className="pp-left">
          <p className="pp-eyebrow">
            Made-to-measure collection · {PRODUCTS.length} models
          </p>
          <h2 id="pp-heading" className="pp-sr-only">
            Product pricing
          </h2>

          <ul className="pp-list" onMouseLeave={() => setHovered(null)}>
            {PRODUCTS.map((product, index) => {
              const isActive = index === activeIndex;
              const isSelected = index === selected;
              return (
                <li key={product.id}>
                  <button
                    type="button"
                    className={`pp-row ${isActive ? "is-active" : ""}`}
                    onMouseEnter={() => setHovered(index)}
                    onFocus={() => setHovered(index)}
                    onBlur={() => setHovered(null)}
                    onClick={() => setSelected(index)}
                    aria-pressed={isSelected}
                  >
                    <span className="pp-index">{pad(index + 1)}</span>
                    <span className="pp-name">{product.name}</span>
                    <span className="pp-price">
                      {formatPrice(product.price)}
                    </span>
                    {isPlaying && isSelected && (
                      <span className="pp-progress" aria-hidden="true" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="pp-footer">
            <a href="#shop" className="pp-btn-dark">
              Shop all blinds
            </a>
            <span className="pp-note">
              Free measuring &amp; installation visit
            </span>
          </div>
        </div>

        {/* ---------- Right: product showcase ---------- */}
        <div className="pp-right">
          <div className="pp-frame">
            {PRODUCTS.map((product, index) => (
              <img
                key={product.id}
                src={product.image}
                alt={`${product.name} - ${product.room}`}
                className={`pp-image ${index === activeIndex ? "is-visible" : ""}`}
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
              />
            ))}

            <div className="pp-caption">
              <p className="pp-caption-text" aria-live="polite">
                <strong>{active.room}</strong>
                <span className="pp-dot" aria-hidden="true" />
                {active.details}
              </p>
              <a href="#product" className="pp-btn-light">
                View blind
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductPricing;