import { useEffect, useRef } from 'react';
import './FabricsBand.css';

/* ------------------------------------------------------------------
   IMAGES — put your files in:  public/images/
   Expected names (change the `image` paths below if yours differ):
     fabric-sec-image-1.png  ...  fabric-sec-image-5.png

   Use ONE wide, "full product" photo per card. The card shows it
   zoomed-in (a close-up of the material) and zooms OUT to the full
   photo on hover.

   - zoom:   how far it is zoomed in at rest (1 = no zoom)
   - origin: which part of the photo the close-up focuses on
------------------------------------------------------------------- */
const MATERIALS = [
  { n: '01', name: 'Sheer linen',     desc: 'Woven in soft, open yarns that diffuse daylight without losing the view.',      link: 'Zebra Blinds',   image: '/images/fabric-sec-image.png', zoom: 2.2, origin: '30% 60%' },
  { n: '02', name: 'Blackout weave',  desc: 'A dense, lined cloth that blocks the light and keeps the room quiet.',          link: 'Roller Blinds',  image: '/images/fabric-sec-image2.png', zoom: 2.0, origin: '70% 70%' },
  { n: '03', name: 'Natural bamboo',  desc: 'Hand-woven slats in warm, honest tones. Every piece is a little different.',   link: 'Roman Blinds',   image: '/images/fabric-sec-image3.png', zoom: 2.3, origin: '50% 55%' },
  { n: '04', name: 'Soft velvet',     desc: 'Heavy, rich drape that falls in deep folds and holds its shape for years.',    link: 'Drapery',        image: '/images/fabric-sec-image4.png', zoom: 2.1, origin: '40% 75%' },
  { n: '05', name: 'Printed canvas',  desc: 'Your artwork printed on durable fabric, fitted to your window exactly.',        link: 'Custom Print',   image: '/images/fabric-sec-image5.png', zoom: 2.4, origin: '65% 40%' },
];

export default function FabricsBand() {
  const secRef = useRef(null);

  /* entrance reveal */
  useEffect(() => {
    const el = secRef.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) { el.classList.add('is-in'); return; }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('is-in'); io.disconnect(); } },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* touch screens have no hover: zoom a card out while it's centred on screen */
  useEffect(() => {
    const el = secRef.current;
    if (!el || !window.matchMedia('(hover: none)').matches || !('IntersectionObserver' in window)) return;
    const cards = el.querySelectorAll('.fb-card');
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.classList.toggle('is-open', e.isIntersecting)),
      { rootMargin: '-30% 0px -30% 0px' }
    );
    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, []);

  return (
    <section className="fb" id="craft" ref={secRef}>
      <div className="fb-wrap">

        <div className="fb-head">
          <div>
            <span className="fb-eyebrow">Fabrics &amp; finishes</span>
            <h2 className="fb-title">
              <span className="fb-line"><span>Where light</span></span>
              <span className="fb-line"><span><em>meets</em> living.</span></span>
            </h2>
          </div>
          <div className="fb-side">
            <p>
              Fabrics, finishes and prints, chosen with you and made to suit your
              interior. Five families, each picked to age well and be fitted by hand.
            </p>
            <a className="fb-samples" href="#contact">Request samples <span aria-hidden="true">→</span></a>
          </div>
        </div>

        <div className="fb-grid">
          {MATERIALS.map((m, i) => (
            <article className="fb-card" key={m.n} style={{ '--i': i }}>
              <a className="fb-media" href="#contact" aria-label={`${m.name} — see it on ${m.link}`}>
                <span className="fb-in">
                  <img
                    src={m.image}
                    alt={m.name}
                    loading="lazy"
                    draggable="false"
                    style={{ '--z': m.zoom, '--o': m.origin }}
                  />
                </span>
                <span className="fb-label">
                  <span>See it on the {m.link}</span>
                  <span aria-hidden="true">→</span>
                </span>
              </a>
              <h3 className="fb-name"><small>{m.n}</small>{m.name}</h3>
              <p className="fb-desc">{m.desc}</p>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}