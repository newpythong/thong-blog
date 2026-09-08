/* MOTION — núi, con trỏ, cuộn, hiện chữ */
(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ── màn mở ────────────────────────────────── */
  const veil = document.querySelector('.veil');
  if (veil) {
    const bar = veil.querySelector('.veil__bar');
    let p = 0, done = false;
    const finish = () => {
      if (done) return; done = true;
      if (bar) bar.style.width = '100%';
      setTimeout(() => {
        veil.classList.add('gone');
        document.body.classList.remove('is-locked');
        document.documentElement.classList.add('ready');
      }, 240);
    };
    const tick = () => {
      p += (100 - p) * 0.09 + 0.7;
      if (bar) bar.style.width = Math.min(p, 100) + '%';
      if (p < 99.2) requestAnimationFrame(tick); else finish();
    };
    document.body.classList.add('is-locked');
    addEventListener('load', () => setTimeout(tick, 100));
    setTimeout(tick, 1800);
    setTimeout(finish, 4000);
  }

  /* ── con trỏ ───────────────────────────────── */
  if (!RM && matchMedia('(hover: hover)').matches) {
    const ring = document.createElement('div'); ring.className = 'cursor';
    const dot = document.createElement('div'); dot.className = 'cursor-dot';
    document.body.append(ring, dot);
    let mx = -100, my = -100, rx = mx, ry = my, seen = false;
    addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      if (!seen) { seen = true; rx = mx; ry = my; ring.style.opacity = dot.style.opacity = '1'; }
      dot.style.transform = `translate(${mx}px,${my}px)`;
    }, { passive: true });
    ring.style.opacity = dot.style.opacity = '0';
    (function loop() {
      rx = lerp(rx, mx, 0.16); ry = lerp(ry, my, 0.16);
      ring.style.transform = `translate(${rx}px,${ry}px)`;
      requestAnimationFrame(loop);
    })();
    const hot = 'a,button,.post-row,input,textarea,select,[data-hot]';
    addEventListener('mouseover', e => {
      if (e.target.closest(hot)) ring.classList.add('is-hot');
    }, { passive: true });
    addEventListener('mouseout', e => {
      if (e.target.closest(hot)) ring.classList.remove('is-hot');
    }, { passive: true });
  }

  /* ── hiện dần khi cuộn ─────────────────────── */
  const io = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });

  const observeAll = (root = document) => {
    root.querySelectorAll('.rise:not(.in), .rv:not(.in)').forEach((el, i) => {
      if (!el.style.transitionDelay) el.style.transitionDelay = (i % 6) * 60 + 'ms';
      io.observe(el);
    });
  };

  /* tách chữ thành từng từ để trượt lên khỏi mặt nạ */
  document.querySelectorAll('[data-split]').forEach(el => {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(tok => {
            if (!tok.trim()) { frag.appendChild(document.createTextNode(tok)); return; }
            const w = document.createElement('span'); w.className = 'rv-w';
            const i = document.createElement('i'); i.textContent = tok;
            w.appendChild(i); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains('rv-w')) walk(n);
      });
    };
    walk(el);
    el.classList.add('rv');
    el.querySelectorAll('.rv-w > i').forEach((i, k) => { i.style.transitionDelay = (k * 45) + 'ms'; });
  });
  observeAll();
  window.__observeAll = observeAll;

  /* the hero is on screen at load — reveal it without waiting for a scroll */
  requestAnimationFrame(() => {
    document.querySelectorAll('.hero .rv, .hero .rise').forEach(el => el.classList.add('in'));
  });

  /* ── thanh nav + tiến độ ───────────────────── */
  const nav = document.querySelector('.nav');
  const prog = document.querySelector('.prog');
  let last = 0;
  addEventListener('scroll', () => {
    const y = scrollY;
    if (nav) nav.classList.toggle('hidden', y > last && y > 220);
    last = y;
    if (prog) {
      const h = document.body.scrollHeight - innerHeight;
      prog.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    }
  }, { passive: true });

  /* ── vòng tròn thiền vẽ dần ────────────────── */
  const enso = document.querySelector('.enso circle');
  if (enso && enso.getTotalLength) {
    const L = enso.getTotalLength();
    enso.style.strokeDasharray = `${L * 0.9} ${L}`;
    enso.style.strokeDashoffset = L;
    enso.style.transition = 'stroke-dashoffset 3.2s cubic-bezier(.19,1,.22,1) .5s';
    requestAnimationFrame(() => requestAnimationFrame(() => { enso.style.strokeDashoffset = '0'; }));
  }

  /* ══ NÚI — sơn thuỷ, mực loang trên nền tối ══ */
  const cv = document.querySelector('.hero__canvas');
  if (cv) {
    let ctx = null;
    try { ctx = cv.getContext && cv.getContext('2d'); } catch (e) { /* không có canvas */ }
    if (ctx) buildMountains(cv, ctx);
  }

  function buildMountains(cv, ctx) {
    let W = 0, H = 0, dpr = 1, layers = [], t = 0, raf = null;

    /* nhiễu giá trị 1 chiều — sống núi gấp khúc tự nhiên hơn tổng các hàm sin */
    const noise1 = (seed) => {
      const n = 256, r = [];
      let s = seed;
      const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
      for (let i = 0; i < n; i++) r.push(rnd());
      return x => {
        const i = Math.floor(x), f = x - i;
        const a = r[((i % n) + n) % n], b = r[(((i + 1) % n) + n) % n];
        const u = f * f * (3 - 2 * f);           // làm mượt
        return a * (1 - u) + b * u;
      };
    };

    const ridge = (seed, octaves) => {
      const fns = [];
      for (let o = 0; o < octaves; o++) fns.push(noise1(seed + o * 7919));
      return x => {
        let v = 0, amp = 1, freq = 1, norm = 0;
        for (let o = 0; o < octaves; o++) {
          v += fns[o](x * freq) * amp;
          norm += amp; amp *= 0.5; freq *= 2.15;
        }
        return v / norm;
      };
    };

    /* xa → gần: dãy ở xa nhạt và cao, dãy gần đậm và thấp */
    const SPEC = [
      { seed: 11, oct: 4, base: 0.46, amp: 0.19, freq: 0.9,  tone: '#d9c49a', mist: 0.90, drift: 0.9 },
      { seed: 29, oct: 4, base: 0.57, amp: 0.23, freq: 1.3,  tone: '#c2a675', mist: 0.66, drift: 1.5 },
      { seed: 47, oct: 5, base: 0.68, amp: 0.25, freq: 1.9,  tone: '#9d7c4c', mist: 0.42, drift: 2.4 },
      { seed: 83, oct: 5, base: 0.80, amp: 0.23, freq: 2.6,  tone: '#71542f', mist: 0.22, drift: 3.6 },
      { seed: 97, oct: 6, base: 0.95, amp: 0.19, freq: 3.4,  tone: '#4a3722', mist: 0.00, drift: 5.2 }
    ];

    const build = () => {
      layers = SPEC.map(sp => {
        const f = ridge(sp.seed, sp.oct);
        const off = document.createElement('canvas');
        const ow = Math.ceil(W * 1.25);           // thừa bề ngang để trôi ngang
        off.width = Math.max(1, Math.ceil(ow * dpr));
        off.height = Math.max(1, Math.ceil(H * dpr));
        const c = off.getContext('2d');
        if (!c) return null;
        c.setTransform(dpr, 0, 0, dpr, 0, 0);

        // thân núi
        c.beginPath();
        c.moveTo(0, H);
        for (let x = 0; x <= ow; x += 2) {
          const n = f(x / ow * sp.freq * 9);
          c.lineTo(x, H * (sp.base - n * sp.amp));
        }
        c.lineTo(ow, H); c.closePath();

        const g = c.createLinearGradient(0, H * (sp.base - sp.amp), 0, H);
        g.addColorStop(0, sp.tone);
        g.addColorStop(1, shade(sp.tone, -0.35));
        c.fillStyle = g; c.fill();

        // sương đọng dưới chân dãy — hơi nước giữa các lớp
        const m = c.createLinearGradient(0, H * sp.base, 0, H);
        m.addColorStop(0, `rgba(250,238,208,${0.34 * sp.mist})`);
        m.addColorStop(0.55, `rgba(240,224,186,${0.12 * sp.mist})`);
        m.addColorStop(1, 'rgba(0,0,0,0)');
        c.globalCompositeOperation = 'source-atop';
        c.fillStyle = m; c.fillRect(0, 0, ow, H);
        c.globalCompositeOperation = 'source-over';

        return { off, ow, drift: sp.drift, base: sp.base };
      }).filter(Boolean);
    };

    function shade(hex, k) {
      const n = parseInt(hex.slice(1), 16);
      const f = c => Math.max(0, Math.min(255, Math.round(c + c * k)));
      return `rgb(${f(n >> 16 & 255)},${f(n >> 8 & 255)},${f(n & 255)})`;
    }

    const resize = () => {
      const r = cv.getBoundingClientRect();
      const w = Math.round(r.width), h = Math.round(r.height);
      if (!w || !h) return false;
      if (w === W && h === H) return true;
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = w; H = h;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
      return true;
    };

    const paint = () => {
      ctx.clearRect(0, 0, W, H);

      // trời — sáng dần về phía chân núi
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#f7efdb');
      sky.addColorStop(0.34, '#f4e6c2');
      sky.addColorStop(0.62, '#eed69f');
      sky.addColorStop(0.84, '#e8c684');
      sky.addColorStop(1, '#f7efdb');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

      // vầng dương
      const mx = W * 0.74, my = H * 0.3, mr = Math.min(W, H) * 0.075;
      const halo = ctx.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 7);
      halo.addColorStop(0, 'rgba(214,132,32,0.22)');
      halo.addColorStop(0.5, 'rgba(224,168,60,0.07)');
      halo.addColorStop(1, 'rgba(224,168,60,0)');
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(mx, my, mr * 7, 0, 6.2832); ctx.fill();
      ctx.fillStyle = 'rgba(197,118,26,0.72)';
      ctx.beginPath(); ctx.arc(mx, my, mr, 0, 6.2832); ctx.fill();

      // các dãy núi, lớp xa trôi chậm hơn lớp gần
      layers.forEach((L, i) => {
        const x = -((t * L.drift) % (L.ow - W));
        ctx.drawImage(L.off, x, 0, L.ow, H);
        if (x + L.ow < W) ctx.drawImage(L.off, x + L.ow, 0, L.ow, H);

        // dải sương trôi ngang giữa hai lớp
        if (i < layers.length - 1) {
          const y = H * L.base + H * 0.02;
          const band = ctx.createLinearGradient(0, y - H * 0.05, 0, y + H * 0.07);
          const a = 0.05 + 0.03 * Math.sin(t * 0.012 + i * 1.7);
          band.addColorStop(0, 'rgba(252,243,220,0)');
          band.addColorStop(0.5, `rgba(252,243,220,${a * 2.4})`);
          band.addColorStop(1, 'rgba(252,243,220,0)');
          ctx.fillStyle = band;
          ctx.fillRect(0, y - H * 0.05, W, H * 0.12);
        }
      });
    };

    const frame = () => {
      t += 0.06;
      paint();
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (!resize()) { requestAnimationFrame(start); return; }
      paint();
      if (!RM) { if (raf) cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }
    };

    /* chờ web font + bố cục ổn định rồi mới đo, nếu không canvas bị đo hụt */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(start);
    else addEventListener('load', start);
    start();

    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => {
      if (resize()) paint();
    }).observe(cv);
    addEventListener('resize', () => { if (resize()) paint(); }, { passive: true });
  }

  /* ── trôi theo cuộn ────────────────────────── */
  const px = [...document.querySelectorAll('[data-px]')];
  if (px.length && !RM) {
    let raf;
    const run = () => {
      const vh = innerHeight;
      px.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const p = (r.top + r.height / 2 - vh / 2) / vh;
        el.style.transform = `translate3d(0,${(p * parseFloat(el.dataset.px) * -100).toFixed(2)}px,0)`;
      });
      raf = null;
    };
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(run); }, { passive: true });
    run();
  }

  /* ── nút hút chuột ─────────────────────────── */
  if (!RM) document.querySelectorAll('[data-mag]').forEach(el => {
    el.style.transition = 'transform .6s cubic-bezier(.19,1,.22,1)';
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .22}px,${(e.clientY - r.top - r.height / 2) * .3}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
})();
