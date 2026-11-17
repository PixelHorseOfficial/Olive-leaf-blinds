import { useLayoutEffect, useRef } from 'react';
import './Collection.css';

/* ------------------------------------------------------------------
   PRODUCT IMAGES
   Put your files in:  public/images/collection/
   `image` = default picture, `hover` = picture shown on hover.
   Change the file names below to match your own files.
------------------------------------------------------------------- */
const PRODUCTS = [
  { id: '01', name: 'Custom Print',  note: 'Your artwork, your view.',
    image: '/images/customized-blinds.png',  hover: '/images/customized-blind-closed.png' },
  { id: '02', name: 'Drapery',       note: 'Soft folds. Quiet luxury.',
    image: '/images/drapery.png',       hover: '/images/drapery-closed.png' },
  { id: '03', name: 'Zebra Blinds',  note: 'Sheer meets solid, in rhythm.',
    image: '/images/zebra-open.png',  hover: '/images/zebra-closed.png' },
  { id: '04', name: 'Roller Blinds', note: 'Clean, simple, effortless.',
    image: '/images/roller-open.png', hover: '/images/roller-closed.png' },
  { id: '05', name: 'Silhouette',    note: 'Gentle light, floating vanes.',
    image: '/images/shilhoute-open.png',    hover: '/images/shilhoute-closed.png' },
  { id: '06', name: 'Roman Blinds',  note: 'Tailored pleats, timeless.',
    image: '/images/roman-open.png',  hover: '/images/roman-closed.png' },
  { id: '07', name: 'Pirouette',     note: 'Vertical vanes that turn with the light.',
    image: '/images/piroutte-open.png',     hover: '/images/piroutte-closed.png' },
];

const Arrow = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export default function Collection() {
  const secRef = useRef(null);   // tall scroll-distance wrapper
  const trackRef = useRef(null); // horizontally translated strip
  const barRef = useRef(null);   // progress line
  const stageRef = useRef(null); // pinned panel that slides over the hero

  /* ---------- hero stays fixed -> collection slides over it -> cards scroll ->
     next section scrolls up. Works on every screen size (phones and tablets included).
     Uses position:fixed (not sticky) so it still works when body/html have
     overflow-x:hidden. ---------- */
  useLayoutEffect(() => {
    /* Always start on the hero after a refresh: stop the browser restoring an old
       scroll position (this section is very tall, so it would land inside it). */
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    if (!window.location.hash) window.scrollTo(0, 0);
    const toTop = () => { if (!window.location.hash) window.scrollTo(0, 0); };
    window.addEventListener('beforeunload', toTop);   // so the saved position is the top
    window.addEventListener('pagehide', toTop);

    const sec = secRef.current;
    const stage = stageRef.current;
    const track = trackRef.current;
    const bar = barRef.current;
    const cards = track ? Array.from(track.querySelectorAll('.col-card')) : [];
    if (!sec || !stage || !track || !bar) return;

    const hero = document.querySelector('header.hero') || document.getElementById('home');
    const heroStyle = hero ? hero.getAttribute('style') : null;   // restore on cleanup
    const coarse = window.matchMedia('(hover: none)');   // touch screens: no hover, so we highlight the centred card
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

    let entry = 0, max = 0, total = 0, cur = 0, target = 0, raf = 0;
    let touched = [];                                   // siblings raised above the hero

    const clean = () => {
      if (hero) {
        if (heroStyle === null) hero.removeAttribute('style'); else hero.setAttribute('style', heroStyle);
      }
      touched.forEach((n) => { n.style.position = ''; n.style.zIndex = ''; });
      touched = [];
      sec.style.height = '';
      sec.style.marginTop = '';
      stage.classList.remove('is-after');
      ['transform', 'visibility', 'boxShadow'].forEach((k) => { stage.style[k] = ''; });
      track.style.transform = ''; bar.style.transform = '';
    };

    const ease = (t) => 1 - Math.pow(1 - t, 3);

    const paint = () => {
      const e = entry ? Math.min(1, cur / entry) : 1;      // 0..1  slide-in over hero
      const h = max ? Math.min(1, Math.max(0, (cur - entry) / max)) : 0;  // 0..1 cards
      // once the panel fully covers the screen, switch the hero off completely
      // (opacity, because .seq-chapter.is-active overrides inherited visibility)
      if (hero) hero.style.opacity = e >= 1 ? '0' : '';
      stage.style.visibility = e <= 0 ? 'hidden' : 'visible';
      stage.style.transform = `translate3d(${(1 - ease(e)) * 100}%,0,0)`;
      stage.style.boxShadow = e < 1 ? '-30px 0 60px rgba(0,0,0,.28)' : 'none';
      track.style.transform = `translate3d(${-h * max}px,0,0)`;
      bar.style.transform = `scaleX(${h})`;
      if (e > 0.45) sec.classList.add('is-in');
      if (coarse.matches) {                                // no hover on touch: the card nearest the centre shows its 2nd picture
        const mid = window.innerWidth / 2;
        let best = null, bestD = Infinity;
        cards.forEach((c) => {
          const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - h * max - mid);
          if (d < bestD) { bestD = d; best = c; }
        });
        cards.forEach((c) => c.classList.toggle('is-active', c === best && e >= 1));
      }
    };

    const tick = () => {
      cur += (target - cur) * 0.14;
      if (reduce.matches || Math.abs(target - cur) < 0.3) cur = target;
      paint();
      raf = cur !== target ? requestAnimationFrame(tick) : 0;
    };

    const update = () => {
      const p = -sec.getBoundingClientRect().top;          // px scrolled into the section
      target = Math.min(total, Math.max(0, p));
      stage.classList.toggle('is-after', p >= total);      // release the panel -> scrolls away
      if (hero) hero.style.visibility = p >= total ? 'hidden' : '';
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const measure = () => {
      clean();
      const vh = window.innerHeight;
      entry = vh * 0.9;                                    // scroll distance of the slide-in
      max = Math.max(0, track.scrollWidth - window.innerWidth); // scroll distance of the cards
      total = entry + max;

      if (hero) {
        /* Keep the hero IN FLOW (its own sticky pin plays the image sequence).
           Add a tail equal to the slide-in distance so the hero stays pinned while
           the collection covers it, then pull the collection up by (vh + entry) so
           its runway starts exactly when the sequence has finished (progress = 1). */
        hero.style.height = `${hero.offsetHeight + entry}px`;
        sec.style.marginTop = `${-(vh + entry)}px`;
      }
      sec.style.height = `${total + vh}px`;                // scroll runway
      sec.style.setProperty('--col-after', `${total}px`);

      // everything after the collection must paint above the fixed hero
      for (let n = sec.nextElementSibling; n; n = n.nextElementSibling) {
        if (getComputedStyle(n).position === 'static') n.style.position = 'relative';
        n.style.zIndex = '3';
        touched.push(n);
      }
      update(); cur = target; paint();
    };

    // nav links to #collection land where the panel is fully open
    const onClick = (ev) => {
      const a = ev.target.closest && ev.target.closest('a[href="#collection"]');
      if (!a) return;
      ev.preventDefault();
      window.scrollTo({ top: sec.getBoundingClientRect().top + window.scrollY + entry, behavior: 'smooth' });
    };

    measure();
    window.addEventListener('scroll', update, { passive: true });
    let lastW = window.innerWidth;
    const onResize = () => {
      // mobile browsers fire resize when the address bar shows/hides (height only):
      // don't rebuild the whole layout for that, it makes the page jump
      const w = window.innerWidth;
      if (w === lastW && coarse.matches) return;
      lastW = w;
      measure();
    };
    window.addEventListener('resize', onResize);
    document.addEventListener('click', onClick);
    const t = setTimeout(measure, 500);                    // after fonts/images settle

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('click', onClick);
      window.removeEventListener('beforeunload', toTop);
      window.removeEventListener('pagehide', toTop);
      clean();
    };
  }, []);

  return (
    <section className="col" id="collection" ref={secRef}>
      <div className="col-stage" ref={stageRef}>
        <div className="col-track" ref={trackRef}>

          {/* intro column */}
          <div className="col-intro">
            <span className="col-eyebrow">The collection</span>
            <h2 className="col-title">
              <span className="col-line"><span>Seven</span></span>
              <span className="col-line"><span>ways to</span></span>
              <span className="col-line"><span>dress a</span></span>
              <span className="col-line"><span>window.</span></span>
            </h2>
            <p className="col-lead">
              Every piece made to your measurements and fitted by our team —
              crafted to last, finished by hand.
            </p>
          </div>

          {/* product cards */}
          {PRODUCTS.map((p, i) => (
            <a
              key={p.id}
              className="col-card"
              href="#contact"
              style={{ '--d': `${0.25 + i * 0.09}s` }}
              aria-label={`Enquire about ${p.name}`}
            >
              <div className="col-img">
                <img className="col-img-a" src={p.image} alt={p.name} loading="lazy" draggable="false" />
                <img className="col-img-b" src={p.hover} alt="" aria-hidden="true" loading="lazy" draggable="false" />
              </div>

              <div className="col-row">
                <span className="col-btn"><Arrow /></span>
                <span className="col-name">
                  <strong>{p.name}</strong>
                  <small>{p.id}</small>
                </span>
                <span className="col-view">View products</span>
              </div>

              <p className="col-note">{p.note}</p>
            </a>
          ))}

          <span className="col-end" aria-hidden="true" />
        </div>

        <div className="col-progress" aria-hidden="true"><i ref={barRef} /></div>
      </div>
    </section>
  );
}