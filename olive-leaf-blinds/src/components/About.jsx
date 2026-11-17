import { useEffect, useRef } from 'react';
import './About.css';

// Image lives in public/images/about-sec-image.png
const ABOUT_IMAGE = '/images/about-sec-image.png';

const STATS = [
  { to: 300, suffix: '',  label: 'Happy Customers',   sub: 'Homes dressed across the USA' },
  { to: 100, suffix: '',  label: 'Fabrics & Finishes', sub: 'Chosen with you, made to order' },
  { to: 8,   suffix: '',  label: 'Experience Years',  sub: 'Years of craft and care' },
  { to: 70,  suffix: '%', label: 'Returning Clients', sub: 'Come back for the next room' },
];

const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

export default function About() {
  const secRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    const sec = secRef.current;
    if (!sec) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nums = [...sec.querySelectorAll('[data-count]')];

    const setFinal = () => nums.forEach((n) => {
      n.textContent = n.dataset.count + (n.dataset.suffix || '');
    });

    const countUp = () => {
      nums.forEach((n, i) => {
        const to = +n.dataset.count;
        const suffix = n.dataset.suffix || '';
        const dur = 1900;
        const delay = 450 + i * 160;
        let start = 0;
        const step = (now) => {
          if (!start) start = now;
          const t = Math.min(1, Math.max(0, (now - start - delay) / dur));
          n.textContent = Math.round(to * easeOutExpo(t)) + suffix;
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    };

    if (reduce || !('IntersectionObserver' in window)) {
      sec.classList.add('is-in');
      setFinal();
      return;
    }

    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        sec.classList.add('is-in');
        countUp();                      // numbers start at 0 and run up
        io.disconnect();
      }
    }, { threshold: 0.3 });
    io.observe(sec);

    /* gentle parallax on the image while the section is on screen */
    const img = imgRef.current;
    let raf = 0;
    const onScroll = () => {
      if (raf || !img) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = sec.getBoundingClientRect();
        const vh = window.innerHeight;
        const p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / vh));
        img.style.setProperty('--py', `${p * -26}px`);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <section className="ab" id="about" ref={secRef}>
      <div className="ab-wrap">

        <div className="ab-top">
          <figure
            className="ab-photo"
            onClick={(e) => {
              const el = e.currentTarget;
              el.classList.remove('is-clicked');
              void el.offsetWidth;                 // restart the animation on every click
              el.classList.add('is-clicked');
            }}
            onAnimationEnd={(e) => {
              if (e.target === e.currentTarget) e.currentTarget.classList.remove('is-clicked');
            }}
          >
            <div className="ab-photo-in">
              <img ref={imgRef} src={ABOUT_IMAGE} alt="A living room dressed with Olive Leaf blinds" loading="lazy" draggable="false" />
            </div>
          </figure>

          <div className="ab-copy">
            <span className="ab-badge">About Us</span>
            <h2 className="ab-title">
              <span className="ab-line"><span>Discover Olive Leaf</span></span>
            </h2>
            <p className="ab-text">
              Olive Leaf Blinds crafts made-to-measure blinds and drapery designed to bring
              light, comfort and style into every room. With a focus on quality fabrics and
              thoughtful fitting, each piece is made for your window and installed in your
              home by our own team.
            </p>
          </div>
        </div>

        <div className="ab-stats">
          {STATS.map((s, i) => (
            <div className="ab-stat" key={s.label} style={{ '--i': i }}>
              <div className="ab-num">
                <span data-count={s.to} data-suffix={s.suffix}>0{s.suffix}</span>
              </div>
              <h3>{s.label}</h3>
              <p>{s.sub}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}