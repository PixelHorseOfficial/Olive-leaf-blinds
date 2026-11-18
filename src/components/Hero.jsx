import { useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import './Hero.css';

/* ---------- Config: change these if your files differ ---------- */
const FRAME_COUNT = 89; // image00.png … image88.png = 89 files
const FRAME_DIR = '/images/olive leaf seq';
const FRAME_EXT = 'png'; // jpg | png | webp  (files are named image00.ext … image88.ext)
const FIRST_FRAME = 0; // number in the first file name (image00)
const LAST_FRAME = 88; // number in the last file name (image88)
const SCROLL_LENGTH_VH = 700; // total scroll distance: ~5-6 scrolls (bigger = more scrolls)
const SMOOTHING = 0.22; // frame easing per 60fps tick (0–1, higher = snappier, lower = floatier)
const SCROLL_LERP = 0.12; // Lenis smoothness (lower = floatier)
const WHEEL_SPEED = 1; // how far one wheel notch scrolls (higher = faster)
const START_IDX = FIRST_FRAME; // index of the first frame played
const END_IDX = LAST_FRAME; // index of the last frame played
const TOTAL = END_IDX - START_IDX + 1; // number of frames actually used

// The real extension is auto-detected at load time (tries FRAME_EXT first,
// then jpg / jpeg / png / webp), so a wrong FRAME_EXT no longer breaks loading.
let frameExt = FRAME_EXT;
// index i -> /images/olive leaf seq/image00.png, image01.png, … image88.png
const frameSrc = (i) =>
  encodeURI(`${FRAME_DIR}/image${String(i).padStart(2, '0')}.${frameExt}`);

/* Text chapters shown over the sequence, by scroll progress (0–1) */
const CHAPTERS = [
  {
    from: 0,
    to: 0.22,
    eyebrow: 'Made to fit · Installed at home',
    title: (
      <>
        Style your home.
        <br />
        Live <em>beautifully.</em>
      </>
    ),
    text: 'Custom window blinds and drapery, crafted for the way you live and fitted in your home, across the USA.',
  },
  {
    from: 0.28,
    to: 0.5,
    eyebrow: 'The collection',
    title: (
      <>
        Crafted for <em>every window.</em>
      </>
    ),
    text: 'Roller, Roman, wooden and sheer — in fabrics and finishes chosen to suit your space.',
  },
  {
    from: 0.56,
    to: 0.78,
    eyebrow: 'Free in-home measure',
    title: (
      <>
        Fitted to the <em>millimetre.</em>
      </>
    ),
    text: 'Every blind is made to order from precise measurements taken in your home.',
  },
  {
    from: 0.84,
    to: 1.01,
    eyebrow: 'Expert installation',
    title: (
      <>
        Ready when <em>you are.</em>
      </>
    ),
    text: 'Book a free home consultation and we will take care of the rest.',
    cta: true,
  },
];

export default function Hero() {
  const trackRef = useRef(null);
  const pinRef = useRef(null);
  const canvasRef = useRef(null);
  const barRef = useRef(null);
  const debugRef = useRef(null);
  const showDebug =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('seqdebug');
  const imagesRef = useRef([]);
  const loadedRef = useRef(new Array(FRAME_COUNT).fill(false));

  const [loadedPct, setLoadedPct] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [chapter, setChapter] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false }); // opaque canvas = faster
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high'; // sharper downscaling of the frames
    let cancelled = false;
    let raf = 0;

    let target = START_IDX; // target frame position (float)
    let current = START_IDX; // smoothed frame position (float)
    let lastDrawn = -1;
    let progress = 0;
    let lastChapter = -1;
    let loadedCount = 0;
    let armed = false;

    const arm = () => {
      armed = true;
    };
    const armEvents = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
    armEvents.forEach((ev) =>
      window.addEventListener(ev, arm, { passive: true, once: true })
    );

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    /* ----- always start at the top; never restore an old scroll position ----- */
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    /* ----- ultra-smooth wheel scrolling (locked until frames are ready) ----- */
    const lenis = new Lenis({
      lerp: SCROLL_LERP,
      smoothWheel: !reduceMotion,
      wheelMultiplier: WHEEL_SPEED,
      touchMultiplier: 0.8,
    });
    lenis.scrollTo(0, { immediate: true, force: true });
    lenis.stop();

    const onAnchorClick = (e) => {
      const a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (href === '#home') {
        e.preventDefault();
        lenis.scrollTo(0);
      } else if (href.length > 1 && document.querySelector(href)) {
        e.preventDefault();
        lenis.scrollTo(href);
      }
    };
    document.addEventListener('click', onAnchorClick);

    /* ----- drawing ----- */
    const nearestLoaded = (idx) => {
      for (let i = idx; i >= 0; i--) if (loadedRef.current[i]) return i;
      for (let i = idx + 1; i < FRAME_COUNT; i++)
        if (loadedRef.current[i]) return i;
      return -1;
    };

    const paintFrame = (i, alpha) => {
      const useIdx = nearestLoaded(i);
      if (useIdx < 0) return false;
      const img = imagesRef.current[useIdx];
      const cw = canvas.width;
      const ch = canvas.height;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      if (!iw || !ih) return false;
      const scale = Math.max(cw / iw, ch / ih); // "cover"
      const w = iw * scale;
      const h = ih * scale;
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, Math.round((cw - w) / 2), Math.round((ch - h) / 2), Math.round(w), Math.round(h));
      ctx.globalAlpha = 1;
      return true;
    };

    // pos is a float: the next frame is cross-faded in by the fractional part,
    // so playback never "steps" between frames.
    // While moving, neighbouring frames are cross-faded for fluid playback.
    // Once the motion settles (scroll stopped / nearly stopped) we draw ONE crisp
    // frame instead — blending two frames at rest is what made the image look blurry.
    const draw = (pos, settled = false) => {
      const p = Math.min(END_IDX, Math.max(START_IDX, pos));
      if (settled) {
        paintFrame(Math.round(p), 1);
        lastDrawn = pos;
        return;
      }
      const a = Math.floor(p);
      const f = p - a;
      if (!paintFrame(a, 1)) return;
      if (f > 0.04 && a < END_IDX) paintFrame(a + 1, f);
      lastDrawn = pos;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      lastDrawn = -1;
      draw(current);
    };

    /* ----- scroll → progress ----- */
    const readScroll = () => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      // Sequence length is fixed by config (the Collection section may add a tail
      // to the hero's height so it stays pinned while the collection covers it).
      const total = (SCROLL_LENGTH_VH / 100) * window.innerHeight - window.innerHeight;
      /* Pin the hero layer with JS instead of CSS sticky: sticky silently stops
         working when html/body have overflow-x:hidden, which made the hero scroll
         away. top = before the hero, fixed = while it plays, end = after it. */
      const pin = pinRef.current;
      if (pin) {
        const mode = rect.top > 0 ? 'top' : rect.bottom < window.innerHeight ? 'end' : 'fixed';
        pin.classList.toggle('is-fixed', mode === 'fixed');
        pin.classList.toggle('is-end', mode === 'end');
      }
      let p = total > 0 ? -rect.top / total : 0;
      if (!Number.isFinite(p)) p = 0;
      // Stay on frame 1 until the visitor actually scrolls (wheel / touch / keys / scrollbar)
      progress = armed ? Math.min(1, Math.max(0, p)) : 0;
      target = START_IDX + progress * (END_IDX - START_IDX);

      if (debugRef.current) {
        debugRef.current.textContent =
          `scrollY ${Math.round(window.scrollY)} | track ${track.offsetHeight}px | ` +
          `viewport ${window.innerHeight}px | rect.top ${Math.round(rect.top)} | ` +
          `progress ${p.toFixed(3)} | armed ${armed}`;
      }

      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${progress})`;
      }

      let c = CHAPTERS.findIndex((ch) => progress >= ch.from && progress < ch.to);
      if (c !== lastChapter && c !== -1) {
        lastChapter = c;
        setChapter(c);
      }
    };

    /* ----- animation loop ----- */
    let lastTime = 0;
    let wasSettled = false;
    const tick = (time) => {
      if (cancelled) return;
      lenis.raf(time);
      const dt = lastTime ? Math.min(64, time - lastTime) : 16.7;
      lastTime = time;
      if (reduceMotion) {
        current = target;
      } else {
        // frame-rate independent easing toward the target frame
        current += (target - current) * (1 - Math.pow(1 - SMOOTHING, dt / 16.7));
      }
      const gap = Math.abs(target - current);
      if (gap < 0.005) current = target;
      // settled = almost no motion left -> snap to a single sharp frame
      const settled = gap < 0.35;
      if (current !== lastDrawn || (settled && !wasSettled)) draw(current, settled);
      wasSettled = settled;
      raf = requestAnimationFrame(tick);
    };

    /* ----- preload frames ----- */
    const onFrameLoaded = (i) => {
      loadedRef.current[i] = true;
      loadedCount++;
      if (i === START_IDX) draw(START_IDX);
      setLoadedPct(Math.round((loadedCount / TOTAL) * 100));
      if (loadedCount === TOTAL || loadedCount >= 6) {
        setReady(true);
        if (lenis.isStopped) {
          // reset to the very top, then unlock scrolling
          window.scrollTo(0, 0);
          lenis.scrollTo(0, { immediate: true, force: true });
          target = START_IDX;
          current = START_IDX;
          lastDrawn = -1;
          draw(START_IDX);
          readScroll();
          lenis.start();
        }
      }
    };

    const order = [START_IDX];
    // only the frames in the playback range are loaded: every 4th first for a
    // quick, scrubbable preview, then the rest
    for (let i = START_IDX + 4; i <= END_IDX; i += 4) order.push(i);
    for (let i = START_IDX + 1; i <= END_IDX; i++) if ((i - START_IDX) % 4 !== 0) order.push(i);

    imagesRef.current = new Array(FRAME_COUNT);

    // Load through a small queue so the first frames arrive fast instead of
    // 143 requests fighting for bandwidth at the same time.
    const CONCURRENCY = 6;
    let next = 0;
    const loadNext = () => {
      if (cancelled || next >= order.length) return;
      const i = order[next++];
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        if (!cancelled) onFrameLoaded(i);
        loadNext();
      };
      img.onerror = () => {
        console.warn('Missing frame:', frameSrc(i));
        loadNext();
      };
      img.src = frameSrc(i);
      imagesRef.current[i] = img;
    };
    // Find the correct file extension by probing the first frame, then start the queue.
    const exts = [...new Set([frameExt, 'jpg', 'jpeg', 'png', 'webp'])];
    const probe = (n) => {
      if (cancelled) return;
      if (n >= exts.length) {
        setError(
          `Could not find ${FRAME_DIR}/image${String(START_IDX).padStart(2, '0')}.(jpg|jpeg|png|webp). ` +
            'Check that the folder is public/images/olive leaf seq and the files are named image00, image01 …'
        );
        return;
      }
      const test = new Image();
      test.onload = () => {
        if (cancelled) return;
        frameExt = exts[n];
        for (let k = 0; k < CONCURRENCY; k++) loadNext();
      };
      test.onerror = () => probe(n + 1);
      const prevExt = frameExt;
      frameExt = exts[n];
      test.src = frameSrc(START_IDX);
      frameExt = prevExt;
    };
    probe(0);

    resize();
    readScroll();
    raf = requestAnimationFrame(tick);

    lenis.on('scroll', readScroll);
    const onResize = () => {
      resize();
      readScroll();
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      document.removeEventListener('click', onAnchorClick);
      armEvents.forEach((ev) => window.removeEventListener(ev, arm));
      lenis.destroy();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <header
      className="seq"
      id="home"
      ref={trackRef}
      style={{ height: `${SCROLL_LENGTH_VH}vh` }}
    >
      <div className="seq-sticky" ref={pinRef}>
        <canvas ref={canvasRef} className="seq-canvas" aria-hidden="true" />
        <div className="seq-shade" aria-hidden="true" />

        {/* Nav */}
        <nav className="seq-nav" aria-label="Main">
          <a className="seq-brand" href="#home" aria-label="Olive Leaf Blinds home">
            <img src="/images/logo2.png" width="46" height="46" alt="Olive Leaf Blinds logo" />
            <span>
              Olive Leaf<small>BLINDS</small>
            </span>
          </a>
          <div className="seq-links">
            <a href="#collection">Collection</a>
            <a href="#craft">Craft</a>
            <a href="#process">Process</a>
            <a href="#reach">Coverage</a>
          </div>
          <a className="seq-btn gold" href="#contact">
            Free home consultation
          </a>
        </nav>

        {/* Frames */}
        <div className="seq-copy">
          {CHAPTERS.map((c, i) => (
            <div
              key={i}
              className={`seq-chapter ${i === chapter ? 'is-active' : ''}`}
              aria-hidden={i !== chapter}
            >
              <span className="seq-eyebrow">{c.eyebrow}</span>
              <h1 className="seq-title">{c.title}</h1>
              <p className="seq-sub">{c.text}</p>
              {(i === 0 || c.cta) && (
                <div className="seq-cta">
                  <a className="seq-btn gold" href="#contact">
                    Book a home visit
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </a>
                  <a className="seq-btn ghost" href="#collection">
                    Explore the collection
                  </a>
                </div>
              )}
              {i === 0 && (
                <div className="seq-chips">
                  <span><i />Free in-home measure</span>
                  <span><i />Ready to order</span>
                  <span><i />Expert installation</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Scroll hint + progress */}
        <div className={`seq-hint ${chapter === 0 ? 'show' : ''}`} aria-hidden="true">
          <span>Scroll</span>
          <i />
        </div>
        <div className="seq-progress" aria-hidden="true">
          <div ref={barRef} className="seq-progress-bar" />
        </div>

        {showDebug && (
          <div
            ref={debugRef}
            style={{
              position: 'absolute', left: 12, top: 90, zIndex: 20,
              background: 'rgba(0,0,0,.75)', color: '#7CFC8A',
              font: '12px monospace', padding: '6px 10px', borderRadius: 6,
            }}
          />
        )}

        {/* Loader */}
        <div className={`seq-loader ${ready ? 'done' : ''}`} role="status" aria-live="polite">
          <img src="/images/logo2.png" width="64" height="64" alt="" />
          <div className="seq-loader-track">
            <div className="seq-loader-fill" style={{ width: `${loadedPct}%` }} />
          </div>
          <span>{loadedPct}%</span>
          {error && <p className="seq-loader-error">{error}</p>}
        </div>
      </div>
    </header>
  );
}