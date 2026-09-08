/* ═══ 動 MOTION — ink, cursor, scroll, reveal ═══ */
(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ── preloader ─────────────────────────────── */
  const veil = document.querySelector('.veil');
  if (veil) {
    const bar = veil.querySelector('.veil__bar');
    let p = 0;
    const tick = () => {
      p += (100 - p) * 0.09 + 0.6;
      if (bar) bar.style.width = Math.min(p, 100) + '%';
      if (p < 99.2) requestAnimationFrame(tick);
      else {
        if (bar) bar.style.width = '100%';
        setTimeout(() => {
          veil.classList.add('gone');
          document.body.classList.remove('is-locked');
          document.documentElement.classList.add('ready');
        }, 260);
      }
    };
    document.body.classList.add('is-locked');
    addEventListener('load', () => setTimeout(tick, 120));
    setTimeout(tick, 2200); // safety net
  }

  /* ── cursor ────────────────────────────────── */
  if (!RM && matchMedia('(hover: hover)').matches) {
    const ring = document.createElement('div'); ring.className = 'cursor';
    const dot = document.createElement('div'); dot.className = 'cursor-dot';
    document.body.append(ring, dot);
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px,${my}px)`;
    }, { passive: true });
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

  /* ── reveal on scroll ──────────────────────── */
  const io = new IntersectionObserver((es) => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  const observeAll = (root = document) => {
    root.querySelectorAll('.rise:not(.in), .rv:not(.in)').forEach((el, i) => {
      if (!el.dataset.d) el.style.transitionDelay = (i % 7) * 55 + 'ms';
      io.observe(el);
    });
  };

  /* split text into word masks */
  document.querySelectorAll('[data-split]').forEach(el => {
    const walk = (node) => {
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
    el.querySelectorAll('.rv-w > i').forEach((i, k) => {
      i.style.transitionDelay = (k * 42) + 'ms';
    });
  });
  observeAll();
  window.__observeAll = observeAll;

  /* ── nav hide + progress ───────────────────── */
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

  /* ── parallax ──────────────────────────────── */
  const px = [...document.querySelectorAll('[data-px]')];
  if (px.length && !RM) {
    let raf;
    const run = () => {
      const vh = innerHeight;
      px.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const prog = (r.top + r.height / 2 - vh / 2) / vh;
        el.style.transform = `translate3d(0,${(prog * parseFloat(el.dataset.px) * -100).toFixed(2)}px,0)`;
      });
      raf = null;
    };
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(run); }, { passive: true });
    run();
  }

  /* ── enso draw ─────────────────────────────── */
  const enso = document.querySelector('.enso circle');
  if (enso) {
    const L = enso.getTotalLength();
    enso.style.strokeDasharray = `${L * 0.93} ${L}`;
    enso.style.strokeDashoffset = L;
    enso.style.transition = 'stroke-dashoffset 3.4s cubic-bezier(.19,1,.22,1) .7s';
    requestAnimationFrame(() => requestAnimationFrame(() => { enso.style.strokeDashoffset = '0'; }));
  }

  /* ── ink field canvas ──────────────────────── */
  const cv = document.querySelector('.hero__canvas');
  if (cv && !RM) {
    const ctx = cv.getContext && cv.getContext('2d');
    if (!ctx) return;
    let W, H, dpr, nodes = [], t = 0;
    const N = innerWidth < 760 ? 34 : 70;
    const mouse = { x: -999, y: -999 };

    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const seed = () => {
      nodes = Array.from({ length: N }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - .5) * .28, vy: (Math.random() - .5) * .28,
        r: Math.random() * 1.7 + .4,
        a: Math.random() * .5 + .12
      }));
    };
    const draw = () => {
      t += 0.0035;
      ctx.clearRect(0, 0, W, H);

      // ink wash blobs
      for (let i = 0; i < 3; i++) {
        const cx = W * (.22 + .3 * i) + Math.sin(t * (1 + i * .4)) * W * .1;
        const cy = H * (.5 + Math.cos(t * (.8 + i * .3)) * .2);
        const rad = Math.min(W, H) * (.28 + i * .06);
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        const tint = i === 1 ? '216,68,42' : '90,105,125';
        g.addColorStop(0, `rgba(${tint},${i === 1 ? .05 : .045})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, 6.2832); ctx.fill();
      }

      // constellation
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < -20) n.x = W + 20; if (n.x > W + 20) n.x = -20;
        if (n.y < -20) n.y = H + 20; if (n.y > H + 20) n.y = -20;
        const dx = n.x - mouse.x, dy = n.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 26000) { const f = (1 - d2 / 26000) * .9; n.x += dx / Math.sqrt(d2 + 1) * f; n.y += dy / Math.sqrt(d2 + 1) * f; }
      }
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
          if (d < 128) {
            ctx.strokeStyle = `rgba(150,160,175,${(1 - d / 128) * .14})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (const n of nodes) {
        ctx.fillStyle = `rgba(226,220,206,${n.a})`;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, 6.2832); ctx.fill();
      }
      requestAnimationFrame(draw);
    };
    addEventListener('mousemove', e => {
      const r = cv.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    }, { passive: true });
    addEventListener('mouseleave', () => { mouse.x = mouse.y = -999; });
    addEventListener('resize', () => { resize(); seed(); }, { passive: true });
    resize(); seed(); draw();
  }

  /* ── magnetic ──────────────────────────────── */
  if (!RM) document.querySelectorAll('[data-mag]').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px,${(e.clientY - r.top - r.height / 2) * .35}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    el.style.transition = 'transform .6s cubic-bezier(.19,1,.22,1)';
  });
})();
