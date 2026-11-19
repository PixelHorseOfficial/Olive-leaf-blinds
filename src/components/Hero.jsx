import { useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import './Hero.css';

/* ---------- Config: change these if your files differ ---------- */
const FRAME_COUNT = 89; // image00.png … image88.png = 89 files
const FRAME_DIR = '/images/olive leaf seq';
const FRAME_EXT = 'png'; // jpg | png | webp  (files are named image00.ext … image88.ext)
const FIRST_FRAME = 0; // number in the first file name (image00)
const LAST_FRAME = 88; // number in the last file name (image88)
const STEPS = 5; // exactly 5 scrolls: 1-4 move through the hero, the 5th leaves it
const STEP_DURATION = 1.7; // seconds one scroll takes to glide to the next step (higher = slower/smoother)
const SMOOTHING = 0.12; // frame easing per 60fps tick (0–1, higher = snappier, lower = floatier)
const SCROLL_LERP = 0.1; // Lenis smoothness for the rest of the page
const WHEEL_SPEED = 1;
const SWIPE_MIN = 28; // px a touch swipe must travel to count as a scroll
const COOLDOWN_MS = 220; // ignore trackpad/touch momentum right after a step finishes
const MOBILE_ZOOM = 1.1; // portrait screens: 1 = whole frame width visible, >1 = zoom in, <1 = zoom out
const MOBILE_FOCUS_Y = 0.36; // portrait screens: where the frame's centre sits (0 = top, 1 = bottom)
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const START_IDX = FIRST_FRAME; // index of the first frame played
const END_IDX = LAST_FRAME; // index of the last frame played
const TOTAL = END_IDX - START_IDX + 1; // number of frames actually used

// The real extension is auto-detected at load time (tries FRAME_EXT first,
// then jpg / jpeg / png / webp), so a wrong FRAME_EXT no longer breaks loading.
let frameExt = FRAME_EXT;
// index i -> /images/olive leaf seq/image00.png, image01.png, … image88.png
const frameSrc = (i) =>
  encodeURI(`${FRAME_DIR}/image${String(i).padStart(2, '0')}.${frameExt}`);

/* Nav links (used by the desktop bar AND the mobile menu) */
const NAV_LINKS = [
  { href: '#collection', label: 'Collection' },
  { href: '#craft', label: 'Craft' },
  { href: '#process', label: 'Process' },
  { href: '#reach', label: 'Coverage' },
];

/* Text chapters shown over the sequence: chapter n is shown at scroll step n */
const CHAPTERS = [
  {
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
    eyebrow: 'The collection',
    title: (
      <>
        Crafted for <em>every window.</em>
      </>
    ),
    text: 'Roller, Roman, wooden and sheer — in fabrics and finishes chosen to suit your space.',
  },
  {
    eyebrow: 'Free in-home measure',
    title: (
      <>
        Fitted to the <em>millimetre.</em>
      </>
    ),
    text: 'Every blind is made to order from precise measurements taken in your home.',
  },
  {
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
  const [menuOpen, setMenuOpen] = useState(false);

  /* ----- mobile menu: close on Escape, on scroll, and when the screen gets wide ----- */
  useEffect(() => {
    if (!menuOpen) return undefined;
    const close = () => setMenuOpen(false);
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    const onResize = () => {
      if (window.innerWidth > 860) close();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close);
      window.removeEventListener('resize', onResize);
    };
  }, [menuOpen]);

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

    /* ----- step scrolling: one wheel / swipe / key press = one step -----
       Steps 0-4 sit on the hero (progress 0, .25, .5, .75, 1); step 5 is the next
       section. Every gesture glides to the neighbouring step, so the frames play
       smoothly and the same way on desktop, tablet and phone. */
    let unlocked = false; // false while the frames are still loading
    let busy = false;
    let busyTimer = 0;
    const unitH = () => (pinRef.current ? pinRef.current.offsetHeight : window.innerHeight);
    const inHeroZone = (dir) => {
      const end = unitH() * STEPS;
      const y = window.scrollY;
      return y < end - 4 || (dir < 0 && y <= end + 4);
    };
    const goStep = (dir) => {
      if (busy) return;
      const unit = unitH();
      const cur = Math.round(window.scrollY / unit);
      const next = Math.min(STEPS, Math.max(0, cur + dir));
      if (next === cur && Math.abs(window.scrollY - next * unit) < 2) return;
      busy = true;
      const done = () => {
        clearTimeout(busyTimer);
        busyTimer = setTimeout(() => {
          busy = false;
        }, COOLDOWN_MS);
      };
      clearTimeout(busyTimer);
      busyTimer = setTimeout(done, (STEP_DURATION + 0.5) * 1000); // safety net
      lenis.scrollTo(next * unit, {
        duration: reduceMotion ? 0.5 : STEP_DURATION,
        easing: easeInOut,
        force: true,
        onComplete: done,
      });
    };
    const swallow = (e) => {
      if (e.cancelable) e.preventDefault();
      e.stopImmediatePropagation();
    };
    const onWheel = (e) => {
      if (!unlocked) return;
      const dir = Math.sign(e.deltaY);
      if (!dir || e.ctrlKey || !inHeroZone(dir)) return;
      swallow(e);
      if (Math.abs(e.deltaY) > 3) goStep(dir);
    };
    let touchY = null;
    let touchActive = false;
    const onTouchStart = (e) => {
      touchY = e.touches[0].clientY;
      touchActive = unlocked && inHeroZone(0) && inHeroZone(1);
    };
    const onTouchMove = (e) => {
      if (!touchActive || touchY === null) return;
      swallow(e);
      const dy = touchY - e.touches[0].clientY;
      if (Math.abs(dy) > SWIPE_MIN) {
        goStep(Math.sign(dy));
        touchY = e.touches[0].clientY + (dy > 0 ? SWIPE_MIN : -SWIPE_MIN) * 100; // one step per swipe
      }
    };
    const onTouchEnd = () => {
      touchY = null;
      touchActive = false;
    };
    const onKeyStep = (e) => {
      if (!unlocked || e.altKey || e.ctrlKey || e.metaKey) return;
      const tag = (e.target && e.target.tagName) || '';
      if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
      let dir = 0;
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) dir = 1;
      else if (e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) dir = -1;
      if (!dir || !inHeroZone(dir)) return;
      swallow(e);
      goStep(dir);
    };
    window.addEventListener('wheel', onWheel, { passive: false, capture: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true, capture: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true, capture: true });
    window.addEventListener('keydown', onKeyStep, { capture: true });

    /* ----- drawing ----- */
    const nearestLoaded = (idx) => {
      for (let i = idx; i >= 0; i--) if (loadedRef.current[i]) return i;
      for (let i = idx + 1; i < FRAME_COUNT; i++)
        if (loadedRef.current[i]) return i;
      return -1;
    };

    // helper canvases for the portrait layout (blurred backdrop + feathered frame)
    const tiny = document.createElement('canvas');
    const tctx = tiny.getContext('2d');
    const edge = document.createElement('canvas');
    const ectx = edge.getContext('2d');

    const paintFrame = (i, alpha) => {
      const useIdx = nearestLoaded(i);
      if (useIdx < 0) return false;
      const img = imagesRef.current[useIdx];
      const cw = canvas.width;
      const ch = canvas.height;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      if (!iw || !ih) return false;
      const cover = Math.max(cw / iw, ch / ih);
      let scale = cover;
      let x;
      let y;
      if (cw / ch < 0.9) {
        // Portrait (phones / tablets): fit the whole frame width so the logo is fully
        // visible, then FILL the leftover space above/below with a blurred, enlarged
        // copy of the same frame (no empty bands), and feather the frame's top/bottom
        // edges so it melts into that backdrop.
        scale = Math.min(cover, (cw / iw) * MOBILE_ZOOM);
        const w = Math.round(iw * scale);
        const h = Math.round(ih * scale);
        x = Math.round((cw - w) / 2);
        y = Math.round(Math.min(Math.max(ch * MOBILE_FOCUS_Y - h / 2, 0), Math.max(ch - h, 0)));

        if (alpha >= 1) {
          // blurred backdrop: shrink the frame to a tiny canvas, stretch it back up (cover)
          const tw = 36;
          const th = Math.max(8, Math.round((tw * ch) / cw));
          if (tiny.width !== tw || tiny.height !== th) {
            tiny.width = tw;
            tiny.height = th;
          }
          const ts = Math.max(tw / iw, th / ih);
          tctx.imageSmoothingQuality = 'high';
          tctx.drawImage(img, (tw - iw * ts) / 2, (th - ih * ts) / 2, iw * ts, ih * ts);
          ctx.globalAlpha = 1;
          ctx.drawImage(tiny, 0, 0, cw, ch);
          ctx.fillStyle = 'rgba(20, 23, 11, 0.38)'; // keep it calm behind the text
          ctx.fillRect(0, 0, cw, ch);
        }

        // frame with soft top/bottom edges
        if (edge.width !== w || edge.height !== h) {
          edge.width = w;
          edge.height = h;
        }
        ectx.globalCompositeOperation = 'source-over';
        ectx.clearRect(0, 0, w, h);
        ectx.drawImage(img, 0, 0, w, h);
        ectx.globalCompositeOperation = 'destination-in';
        const g = ectx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(0.16, 'rgba(0,0,0,1)');
        g.addColorStop(0.84, 'rgba(0,0,0,1)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ectx.fillStyle = g;
        ectx.fillRect(0, 0, w, h);
        ectx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = alpha;
        ctx.drawImage(edge, x, y);
        ctx.globalAlpha = 1;
        return true;
      }
      x = (cw - iw * scale) / 2;
      y = (ch - ih * scale) / 2;
      const w = iw * scale;
      const h = ih * scale;
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, Math.round(x), Math.round(y), Math.round(w), Math.round(h));
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
      const pin = pinRef.current;
      const unit = pin ? pin.offsetHeight : window.innerHeight; // one scroll = one screen
      // The hero plays while pinned: STEPS screens tall, minus the one on screen.
      const total = (STEPS - 1) * unit;
      /* Pin the hero layer with JS instead of CSS sticky: sticky silently stops
         working when html/body have overflow-x:hidden, which made the hero scroll
         away. top = before the hero, fixed = while it plays, end = after it. */
      if (pin) {
        const mode = rect.top > 0 ? 'top' : rect.bottom < unit ? 'end' : 'fixed';
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

      // chapter n belongs to scroll step n (the last chapter also covers the final step)
      const c = Math.min(CHAPTERS.length - 1, Math.round(progress * (STEPS - 1)));
      if (c !== lastChapter) {
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
        unlocked = true;
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
      clearTimeout(busyTimer);
      window.removeEventListener('wheel', onWheel, { capture: true });
      window.removeEventListener('touchstart', onTouchStart, { capture: true });
      window.removeEventListener('touchmove', onTouchMove, { capture: true });
      window.removeEventListener('touchend', onTouchEnd, { capture: true });
      window.removeEventListener('touchcancel', onTouchEnd, { capture: true });
      window.removeEventListener('keydown', onKeyStep, { capture: true });
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
      style={{ '--seq-steps': STEPS }}
    >
      <div className="seq-sticky" ref={pinRef}>
        <canvas ref={canvasRef} className="seq-canvas" aria-hidden="true" />
        <div className="seq-shade" aria-hidden="true" />

        {/* Nav */}
        <nav className={`seq-nav ${menuOpen ? 'menu-open' : ''}`} aria-label="Main">
          <a className="seq-brand" href="#home" aria-label="Olive Leaf Blinds home">
            <img src="/images/logo2.png" width="46" height="46" alt="Olive Leaf Blinds logo" />
            <span>
              Olive Leaf<small>BLINDS</small>
            </span>
          </a>

          {/* Desktop links */}
          <div className="seq-links">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </div>

          <div className="seq-nav-right">
            <a className="seq-btn gold seq-nav-cta" href="#contact">
              Free home consultation
            </a>

            {/* Mobile hamburger (shown ≤ 860px) */}
            <button
              type="button"
              className={`seq-burger ${menuOpen ? 'is-open' : ''}`}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="seq-mobile-menu"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>

          {/* Mobile dropdown menu */}
          <div
            id="seq-mobile-menu"
            className={`seq-menu ${menuOpen ? 'is-open' : ''}`}
            aria-hidden={!menuOpen}
          >
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>
                {l.label}
              </a>
            ))}
            <a
              className="seq-btn gold seq-menu-cta"
              href="#contact"
              onClick={() => setMenuOpen(false)}
            >
              Free home consultation
            </a>
          </div>
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