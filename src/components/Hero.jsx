import { useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import './Hero.css';

/* ---------- Config: change these if your files differ ---------- */
const FRAME_COUNT = 68; // image00.png … image67.png = 68 files
const FRAME_DIR = '/images/olive leaf seq';
const FRAME_EXT = 'png'; // jpg | png | webp  (files are named image00.ext … image67.ext)
const FIRST_FRAME = 0; // number in the first file name (image00)
const LAST_FRAME = 68; // number in the last file name (image67)
const STEPS = 5; // hero is 5 screens tall: the frames play continuously over the first 4, the 5th leaves it
const SMOOTHING = 0.2; // frame easing per 60fps tick (0–1, higher = snappier, lower = floatier)
const SCROLL_LERP = 0.1; // Lenis smoothness for the rest of the page
const WHEEL_SPEED = 1;
const MOBILE_ZOOM = 1.1; // portrait screens: 1 = whole frame width visible, >1 = zoom in, <1 = zoom out
const MOBILE_FOCUS_Y = 0.36; // portrait screens: where the frame's centre sits (0 = top, 1 = bottom)
const START_IDX = FIRST_FRAME; // index of the first frame played
const END_IDX = LAST_FRAME; // index of the last frame played
const TOTAL = END_IDX - START_IDX + 1; // number of frames actually used

// The real extension is auto-detected at load time (tries FRAME_EXT first,
// then jpg / jpeg / png / webp), so a wrong FRAME_EXT no longer breaks loading.
let frameExt = FRAME_EXT;
// index i -> /images/olive leaf seq/image00.png, image01.png, … image67.png
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
    let attempts = 0; // frames finished loading OR failing (missing files count too)
    // The playable range. Starts as the configured range, then shrinks to the first / last
    // frame file that actually exists once every file has been tried. So removing frames
    // from the folder never leaves the hero on an empty first frame.
    let lo = START_IDX;
    let hi = END_IDX;
    // Once every file has been tried, `slots` lists the frame files that really exist, in
    // order. Playback then runs over those slots, so a gap in the file numbers (removed
    // frames) never causes a pause or a hold: the neighbours of every position are always
    // two real, existing frames.
    let slots = null;
    const frameAt = (s) => (slots ? slots[Math.max(0, Math.min(slots.length - 1, s))] : s);
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
    const coarse = window.matchMedia('(pointer: coarse)').matches; // phones/tablets

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
      syncTouch: false, // phones keep their native, momentum-based swipe scrolling
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

    /* ----- continuous scrolling -----
       No step locking and no gesture blocking: every wheel tick, swipe or key press
       moves the page freely (Lenis only smooths it), so the hero never pauses between
       frames. The scroll position drives the frame directly (see readScroll). */
    let unlocked = false; // false while the frames are still loading
    const onLenisScroll = () => readScroll();

    /* ----- drawing ----- */
    const nearestLoaded = (idx) => {
      for (let i = idx; i >= 0; i--) if (loadedRef.current[i]) return i;
      for (let i = idx + 1; i < FRAME_COUNT; i++)
        if (loadedRef.current[i]) return i;
      return -1;
    };

    // --- portrait (phone) layout helpers ---------------------------------------
    // 1) the backdrop is a plain colour gradient rendered ONCE (static), so it can never
    //    flicker or show frame changes while scrolling
    // 2) every frame is pre-rendered ONCE at its final size with the soft top/bottom
    //    edge already applied, so each scroll tick is just two cheap drawImage calls
    const tiny = document.createElement('canvas');
    const tctx = tiny.getContext('2d');
    const backdrop = document.createElement('canvas');
    let backdropOK = false;
    const frameCache = new Array(FRAME_COUNT);

    const isPortrait = () => canvas.width / canvas.height < 0.9;

    const portraitBox = (img) => {
      const cw = canvas.width;
      const ch = canvas.height;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const cover = Math.max(cw / iw, ch / ih);
      const scale = Math.min(cover, (cw / iw) * MOBILE_ZOOM);
      const w = Math.round(iw * scale);
      const h = Math.round(ih * scale);
      const x = Math.round((cw - w) / 2);
      const y = Math.round(Math.min(Math.max(ch * MOBILE_FOCUS_Y - h / 2, 0), Math.max(ch - h, 0)));
      return { w, h, x, y };
    };

    // Each frame is cached once at its exact on-screen size (no edge fade baked in).
    const plain = (i, img, w, h) => {
      let c = frameCache[i];
      // exact size only: cached frames are blitted 1:1, never rescaled while scrolling
      if (c && c.width === w && c.height === h) return c;
      if (!c) c = frameCache[i] = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const cx = c.getContext('2d');
      cx.imageSmoothingQuality = 'high';
      cx.drawImage(img, 0, 0, w, h);
      return c;
    };

    // The soft top/bottom edge is ONE shared mask, applied AFTER two frames are blended.
    // (Fading two separately-feathered frames over each other is what made the edges and
    // curtains look like they were shattering.)
    let mask = null;
    let blend = null;
    let bctx2 = null;
    const ensureMask = (w, h) => {
      if (mask && mask.width === w && mask.height === h) return;
      mask = document.createElement('canvas');
      mask.width = w;
      mask.height = h;
      const mx = mask.getContext('2d');
      const g = mx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(0.08, 'rgba(0,0,0,0.35)');
      g.addColorStop(0.2, 'rgba(0,0,0,1)');
      g.addColorStop(0.58, 'rgba(0,0,0,1)');
      g.addColorStop(0.72, 'rgba(0,0,0,0.6)');
      g.addColorStop(0.86, 'rgba(0,0,0,0.2)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      mx.fillStyle = g;
      mx.fillRect(0, 0, w, h);
      blend = document.createElement('canvas');
      blend.width = w;
      blend.height = h;
      bctx2 = blend.getContext('2d');
    };

    const prefill = (i) => {
      const img = imagesRef.current[i];
      if (!img || !img.naturalWidth || !isPortrait()) return;
      const { w, h } = portraitBox(img);
      plain(i, img, w, h);
    };

    const ensureBackdrop = () => {
      if (backdropOK) return true;
      const bi = nearestLoaded(frameAt(Math.round((lo + hi) / 2)));
      if (bi < 0) return false;
      const img = imagesRef.current[bi];
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      if (!iw || !ih) return false;
      const cw = canvas.width;
      const ch = canvas.height;
      backdrop.width = cw;
      backdrop.height = ch;
      const bctx = backdrop.getContext('2d');
      // Sample the average colour of the frame's top and bottom strips (1x1 px each),
      // then paint a plain vertical gradient. It has NO image detail, so it looks the
      // same behind every frame and nothing moves in the soft edge area while scrolling.
      tiny.width = 1;
      tiny.height = 1;
      tctx.imageSmoothingQuality = 'high';
      const avg = (sy, sh) => {
        tctx.clearRect(0, 0, 1, 1);
        tctx.drawImage(img, 0, sy, iw, sh, 0, 0, 1, 1);
        const d = tctx.getImageData(0, 0, 1, 1).data;
        return [d[0], d[1], d[2]];
      };
      let top;
      let bottom;
      try {
        top = avg(0, ih * 0.2);
        bottom = avg(ih * 0.8, ih * 0.2);
      } catch (e) {
        top = [40, 44, 22];
        bottom = [30, 34, 16];
      }
      const mix = (c, k) => `rgb(${Math.round(c[0] * k + 20 * (1 - k))}, ${Math.round(c[1] * k + 23 * (1 - k))}, ${Math.round(c[2] * k + 11 * (1 - k))})`;
      const g = bctx.createLinearGradient(0, 0, 0, ch);
      g.addColorStop(0, mix(top, 0.55));
      g.addColorStop(0.45, mix(bottom, 0.4));
      g.addColorStop(1, 'rgb(20, 23, 11)'); // matches .seq background + text shade
      bctx.fillStyle = g;
      bctx.fillRect(0, 0, cw, ch);
      backdropOK = true;
      return true;
    };

    // PHONE: blend frame A with frame B (fraction f) off-screen, apply the edge mask once,
    // then draw backdrop + result. Everything is 1:1 and opaque, one atomic update per tick.
    const paintPortrait = (ia, ib, f) => {
      const ua = nearestLoaded(ia);
      if (ua < 0) return false;
      const imgA = imagesRef.current[ua];
      if (!imgA.naturalWidth) return false;
      const { w, h, x, y } = portraitBox(imgA);
      ensureMask(w, h);
      bctx2.globalCompositeOperation = 'source-over';
      bctx2.globalAlpha = 1;
      bctx2.clearRect(0, 0, w, h);
      bctx2.drawImage(plain(ua, imgA, w, h), 0, 0);
      if (f > 0 && ib != null) {
        const ub = nearestLoaded(ib);
        const imgB = ub >= 0 ? imagesRef.current[ub] : null;
        if (imgB && ub !== ua && imgB.naturalWidth) {
          bctx2.globalAlpha = f;
          bctx2.drawImage(plain(ub, imgB, w, h), 0, 0);
          bctx2.globalAlpha = 1;
        }
      }
      bctx2.globalCompositeOperation = 'destination-in';
      bctx2.drawImage(mask, 0, 0);
      bctx2.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      if (ensureBackdrop()) {
        ctx.drawImage(backdrop, 0, 0);
      } else {
        ctx.fillStyle = '#14170b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(blend, x, y);
      return true;
    };

    // DESKTOP (unchanged behaviour)
    const paintFrame = (i, alpha) => {
      const useIdx = nearestLoaded(i);
      if (useIdx < 0) return false;
      const img = imagesRef.current[useIdx];
      const cw = canvas.width;
      const ch = canvas.height;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      if (!iw || !ih) return false;
      const scale = Math.max(cw / iw, ch / ih);
      const w = iw * scale;
      const h = ih * scale;
      const x = (cw - w) / 2;
      const y = (ch - h) / 2;
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
    let shown = -1; // portrait: key of what is on screen, so identical frames aren't repainted
    const draw = (pos, settled = false) => {
      const p = Math.min(hi, Math.max(lo, pos));
      const a = Math.floor(p);
      let f = a >= hi ? 0 : p - a;
      if (isPortrait()) {
        // PHONE: always cross-fade the two neighbouring real frames by the fractional
        // position (no snapping between blended and sharp, so nothing pops). When the
        // scroll stops, tick() eases the position onto a whole frame, so it rests sharp.
        if (f < 0.01) f = 0;
        const key = a + ':' + Math.round(f * 50);
        if (key !== shown) {
          if (!paintPortrait(frameAt(a), f > 0 ? frameAt(a + 1) : null, f)) return;
          shown = key;
        }
        lastDrawn = pos;
        return;
      }
      if (settled) {
        paintFrame(frameAt(Math.round(p)), 1);
        lastDrawn = pos;
        return;
      }
      if (!paintFrame(frameAt(a), 1)) return;
      if (f > 0.04 && a < hi) paintFrame(frameAt(a + 1), f);
      lastDrawn = pos;
    };

    // After a size change every cached frame is stale. Rebuild them a few at a time in
    // the background instead of lazily in the middle of a scroll (that caused hitches).
    let rebuildTimer = 0;
    const rebuildCache = () => {
      clearTimeout(rebuildTimer);
      if (!isPortrait()) return;
      let i = lo;
      const step = () => {
        if (cancelled) return;
        for (let n = 0; n < 3 && i <= hi; n++, i++) prefill(frameAt(i));
        if (i <= hi) rebuildTimer = setTimeout(step, 16);
      };
      step();
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2);
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      measure();
      // Phone browsers fire "resize" whenever the address bar slides. Re-assigning
      // canvas.width clears it (a visible flash/shake), so do nothing if size is unchanged.
      if (w === canvas.width && h === canvas.height) return;
      canvas.width = w;
      canvas.height = h;
      // changing the size resets the context, so set the quality again
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      backdropOK = false;
      lastDrawn = -1;
      shown = -1;
      draw(current);
      rebuildCache();
    };

    /* ----- scroll → progress ----- */
    // Layout is measured only on resize (never inside the scroll handler),
    // so scrolling does not force the browser to recalculate layout.
    let pinH = window.innerHeight;
    let trackTop = 0;
    let trackH = 0;
    let pinMode = '';
    const measure = () => {
      const track = trackRef.current;
      const pin = pinRef.current;
      if (!track) return;
      pinH = pin ? pin.offsetHeight : window.innerHeight; // one scroll = one screen
      trackTop = track.getBoundingClientRect().top + window.scrollY;
      trackH = track.offsetHeight;
    };
    const readScroll = () => {
      const track = trackRef.current;
      if (!track) return;
      if (!trackH) measure();
      const pin = pinRef.current;
      const top = trackTop - window.scrollY; // hero top relative to the viewport
      const bottom = top + trackH;
      // The hero plays while pinned: STEPS screens tall, minus the one on screen.
      const total = (STEPS - 1) * pinH;
      /* Pin the hero layer with JS instead of CSS sticky: sticky silently stops
         working when html/body have overflow-x:hidden, which made the hero scroll
         away. top = before the hero, fixed = while it plays, end = after it. */
      if (pin) {
        const mode = top > 0 ? 'top' : bottom < pinH ? 'end' : 'fixed';
        if (mode !== pinMode) {
          pinMode = mode;
          pin.classList.toggle('is-fixed', mode === 'fixed');
          pin.classList.toggle('is-end', mode === 'end');
        }
      }
      let p = total > 0 ? -top / total : 0;
      if (!Number.isFinite(p)) p = 0;
      // Stay on frame 1 until the visitor actually scrolls (wheel / touch / keys / scrollbar)
      if (!armed && unlocked && window.scrollY > 2) armed = true;
      progress = armed ? Math.min(1, Math.max(0, p)) : 0;
      target = lo + progress * (hi - lo); // the whole sequence always spans the full scroll

      if (debugRef.current) {
        debugRef.current.textContent =
          `scrollY ${Math.round(window.scrollY)} | track ${trackH}px | ` +
          `viewport ${window.innerHeight}px | top ${Math.round(top)} | ` +
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
    let prevTarget = -1;
    let lastMove = 0;
    const tick = (time) => {
      if (cancelled) return;
      lenis.raf(time);
      const dt = lastTime ? Math.min(64, time - lastTime) : 16.7;
      lastTime = time;
      if (target !== prevTarget) {
        prevTarget = target;
        lastMove = time;
      }
      // phones: once the scroll has been still for a moment, glide onto the nearest whole
      // frame, so the image comes to rest on one sharp frame without any sudden pop
      const goal = !reduceMotion && isPortrait() && time - lastMove > 150 ? Math.round(target) : target;
      if (reduceMotion) {
        current = target;
      } else {
        // frame-rate independent easing toward the goal
        current += (goal - current) * (1 - Math.pow(1 - SMOOTHING, dt / 16.7));
      }
      const gap = Math.abs(goal - current);
      if (gap < 0.005) current = goal;
      // settled = motion is over -> a single sharp frame. Kept tight so slow, continuous
      // scrolling never flips between blended and single-frame drawing (that read as a stutter)
      const settled = gap < 0.01;
      if (current !== lastDrawn || (settled && !wasSettled)) draw(current, settled);
      wasSettled = settled;
      raf = requestAnimationFrame(tick);
    };

    /* ----- preload frames ----- */
    const unlockNow = () => {
      if (unlocked) return;
      setReady(true);
      unlocked = true;
      // reset to the very top, then unlock scrolling
      window.scrollTo(0, 0);
      lenis.scrollTo(0, { immediate: true, force: true });
      target = lo;
      current = lo;
      lastDrawn = -1;
      draw(lo);
      measure();
      readScroll();
      lenis.start();
    };
    // Called after EVERY attempt (loaded or missing). When all files have been tried,
    // fit the playable range to the files that exist, then unlock scrolling.
    const settle = () => {
      attempts++;
      setLoadedPct(Math.round((attempts / TOTAL) * 100));
      if (attempts < TOTAL) return;
      let a = -1;
      let b = -1;
      for (let k = START_IDX; k <= END_IDX; k++) {
        if (loadedRef.current[k]) {
          if (a < 0) a = k;
          b = k;
        }
      }
      if (a >= 0) {
        const list = [];
        for (let k = a; k <= b; k++) if (loadedRef.current[k]) list.push(k);
        slots = list; // only frames that exist, in order
        lo = 0;
        hi = list.length - 1;
      }
      shown = -1;
      lastDrawn = -1;
      if (unlocked) {
        measure();
        readScroll();
        current = target;
        rebuildCache();
      } else if (a >= 0) {
        unlockNow();
      }
    };
    const onFrameLoaded = (i) => {
      loadedRef.current[i] = true;
      loadedCount++;
      shown = -1; // repaint if the frame that just arrived is the one on screen
      lastDrawn = -1;
      // desktop starts after a handful of frames; phones wait until every file was tried
      if (!(coarse || window.innerWidth <= 860) && loadedCount >= 6) unlockNow();
      settle();
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
        // decode off the main thread, then pre-render the frame, so scrolling never
        // has to decode a big image
        const finish = () => {
          if (!cancelled) {
            prefill(i);
            onFrameLoaded(i);
          }
          loadNext();
        };
        if (img.decode) img.decode().then(finish, finish);
        else finish();
      };
      img.onerror = () => {
        console.warn('Missing frame:', frameSrc(i));
        settle();
        loadNext();
      };
      img.src = frameSrc(i);
      imagesRef.current[i] = img;
    };
    // Find the correct file extension by probing the first frame, then start the queue.
    const exts = [...new Set([frameExt, 'jpg', 'jpeg', 'png', 'webp'])];
    // probe a few different frame numbers: the first file may have been removed
    const cands = [...new Set([START_IDX, END_IDX, Math.round((START_IDX + END_IDX) / 2), START_IDX + 1, END_IDX - 1])];
    const combos = [];
    exts.forEach((e) => cands.forEach((c) => combos.push([e, c])));
    const probe = (n) => {
      if (cancelled) return;
      if (n >= combos.length) {
        lenis.start(); // never leave the page scroll-locked if the frames are missing
        setError(
          `Could not find any frames in ${FRAME_DIR}/ (image${String(START_IDX).padStart(2, '0')} … image${String(END_IDX).padStart(2, '0')}, jpg|jpeg|png|webp). ` +
            'Check the folder is public/images/olive leaf seq and the files are named image00, image01 …'
        );
        return;
      }
      const [ext, idx] = combos[n];
      const test = new Image();
      test.onload = () => {
        if (cancelled) return;
        frameExt = ext;
        for (let k = 0; k < CONCURRENCY; k++) loadNext();
      };
      test.onerror = () => probe(n + 1);
      const prevExt = frameExt;
      frameExt = ext;
      test.src = frameSrc(idx);
      frameExt = prevExt;
    };
    probe(0);
    // safety net: on a slow connection don't keep the page locked behind the loader
    const unlockTimer = setTimeout(() => {
      if (!unlocked && loadedCount > 0) unlockNow();
    }, coarse || window.innerWidth <= 860 ? 25000 : 10000);

    resize();
    readScroll();
    raf = requestAnimationFrame(tick);

    lenis.on('scroll', onLenisScroll);
    let resizeRaf = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        resize();
        readScroll();
      });
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      document.removeEventListener('click', onAnchorClick);
      clearTimeout(unlockTimer);
      clearTimeout(rebuildTimer);
      cancelAnimationFrame(resizeRaf);
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