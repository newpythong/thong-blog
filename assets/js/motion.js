/* ═══════════════════════════════════════════════════════════
   TIÊU DAO — cuộn trôi, chữ hiện, con trỏ
   Lenis lo quán tính cuộn, GSAP ScrollTrigger lo nhịp theo cuộn.
   Không có thư viện thì mọi thứ vẫn chạy, chỉ bớt mượt.
   ═══════════════════════════════════════════════════════════ */
(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const S = window.SONTHUY;
  const hasGSAP = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  /* ── màn mở ─────────────────────────────────────────── */
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
        openHero();
      }, 220);
    };
    const tick = () => {
      p += (100 - p) * 0.09 + 0.8;
      if (bar) bar.style.width = Math.min(p, 100) + '%';
      if (p < 99.2) requestAnimationFrame(tick); else finish();
    };
    document.body.classList.add('is-locked');
    addEventListener('load', () => setTimeout(tick, 80));
    setTimeout(tick, 1600);
    setTimeout(finish, 3800);
  }

  /* ── cuộn trôi ──────────────────────────────────────── */
  let lenis = null;
  if (!RM && typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      lerp: 0.075,              // càng nhỏ càng trôi lâu
      wheelMultiplier: 0.85,
      touchMultiplier: 1.4,
      smoothWheel: true
    });
    if (hasGSAP) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(time => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = time => { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const el = document.querySelector(a.getAttribute('href'));
        if (!el) return;
        e.preventDefault();
        lenis.scrollTo(el, { offset: -70, duration: 1.8 });
      });
    });
  }

  /* ── cảnh sơn thuỷ ──────────────────────────────────── */
  let scene = null, petalField = null;
  if (S) {
    const cv = document.querySelector('.hero__canvas');
    if (cv) scene = S.mountains(cv);

    const pc = document.querySelector('.petals');
    if (pc) petalField = S.petals(pc, {
      density: parseFloat(pc.dataset.density || '1'),
      alpha: parseFloat(pc.dataset.alpha || '1')
    });

    const rc = document.querySelector('.ripples');
    if (rc) S.ripples(rc);
  }

  /* ── tách chữ thành từng từ ─────────────────────────── */
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
  });

  /* ── hiện dần khi vào khung nhìn ────────────────────── */
  function reveal(el) {
    el.classList.add('in');
    const words = el.classList.contains('rv') ? el.querySelectorAll('.rv-w > i') : [];
    if (hasGSAP && words.length && !RM) {
      gsap.fromTo(words, { yPercent: 112, y: 0 }, {
        yPercent: 0, y: 0, duration: 1.15, ease: 'expo.out', stagger: 0.045, overwrite: true
      });
    } else {
      words.forEach((i, k) => { i.style.transitionDelay = (k * 45) + 'ms'; });
    }
  }

  const io = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });

  /* Chữ trong sân khấu do dòng thời gian cuộn nắm, không để observer đụng vào —
     hai bên cùng tween một phần tử thì overwrite của bên này giết tween bên kia. */
  const observeAll = (root = document) => {
    root.querySelectorAll('.rise:not(.in), .rv:not(.in)').forEach((el, i) => {
      if (el.closest('.acts') && !document.documentElement.classList.contains('no-stage')) return;
      if (!el.style.transitionDelay && !el.classList.contains('rv'))
        el.style.transitionDelay = (i % 6) * 70 + 'ms';
      io.observe(el);
    });
  };
  observeAll();
  window.__observeAll = observeAll;

  /* phần mở đầu đã nằm trong khung nhìn — cho hiện ngay sau màn mở */
  function openHero() {
    document.querySelectorAll('.act--open .rv, .act--open .rise, .hero .rv, .hero .rise')
      .forEach((el, i) => {
        if (el.classList.contains('in')) return;
        setTimeout(() => reveal(el), i * 90);
      });
  }
  if (!veil) requestAnimationFrame(openHero);

  /* ══ SÂN KHẤU — ghim màn hình, cuộn để chuyển cảnh ══ */
  const stage = document.querySelector('.stage');
  if (stage && scene) {
    const inner = stage.querySelector('.stage__inner');
    const acts = [...stage.querySelectorAll('.act')];
    const cue = stage.querySelector('.scrollcue');
    const N = acts.length;

    if (!hasGSAP || RM) {
      /* không có thư viện hoặc người dùng tắt chuyển động:
         xếp các hồi thành một cột, cảnh dừng ở hồi đầu */
      document.documentElement.classList.add('no-stage');
      acts.forEach(reveal);
      scene.setStage(0);
      if (cue) cue.style.display = 'none';
    } else {
      /* chữ của hồi 2..n bắt đầu ở dưới mặt nạ, chờ tới lượt */
      acts.forEach((el, i) => {
        if (i === 0) return;
        el.classList.add('in');                       // observer bỏ qua hẳn
        gsap.set(el.querySelectorAll('.rv-w > i'), { yPercent: 112, y: 0 });
        const sub = el.querySelector('.act__sub');
        if (sub) gsap.set(sub, { opacity: 0, y: 24 });
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stage,
          start: 'top top',
          end: () => '+=' + (innerHeight * (N - 1) * 1.15),
          pin: inner,
          pinSpacing: true,
          scrub: 1.1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: self => {
            scene.setStage(self.progress);
            if (petalField) petalField.speed(1 + self.progress * 1.1);
          }
        }
      });

      /* mỗi hồi chiếm một đoạn bằng nhau trên dòng thời gian */
      const seg = 1 / (N - 1);
      acts.forEach((el, i) => {
        const words = el.querySelectorAll('.rv-w > i');
        const sub = el.querySelector('.act__sub');
        const meta = el.querySelector('.act__meta');
        const brow = el.querySelector('.eyebrow');
        const at = i * seg;

        if (i > 0) {
          tl.set(el, { visibility: 'visible' }, at - seg * 0.30)
            .fromTo(el, { opacity: 0 }, { opacity: 1, duration: seg * 0.30, ease: 'power2.out' }, at - seg * 0.30)
            .fromTo(brow, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: seg * 0.24, ease: 'power2.out' }, at - seg * 0.26)
            .to(words, { yPercent: 0, y: 0, duration: seg * 0.42, ease: 'expo.out', stagger: seg * 0.045 }, at - seg * 0.28)
            .to(sub, { opacity: 1, y: 0, duration: seg * 0.30, ease: 'power2.out' }, at - seg * 0.14);
        }
        /* hồi trước lùi ra sau, chữ chìm xuống — như một cú cắt cảnh */
        if (i < N - 1) {
          const out = at + seg * 0.62;
          tl.to(words, { yPercent: -110, y: 0, duration: seg * 0.34, ease: 'power3.in', stagger: seg * 0.03 }, out)
            .to([sub, meta, brow].filter(Boolean), { opacity: 0, y: -22, duration: seg * 0.30, ease: 'power2.in' }, out)
            .to(el, { opacity: 0, duration: seg * 0.34, ease: 'power2.in' }, out + seg * 0.04)
            .set(el, { visibility: 'hidden' }, out + seg * 0.38);
        }
      });

      if (cue) tl.to(cue, { opacity: 0, duration: seg * 0.4 }, 0);

      /* cửa sổ đổi cỡ thì đo lại, nếu không điểm ghim lệch */
      addEventListener('resize', () => ScrollTrigger.refresh(), { passive: true });
    }
  } else if (stage) {
    document.documentElement.classList.add('no-stage');
    stage.querySelectorAll('.act').forEach(reveal);
  }

  /* núi chia đoạn trôi ngược chiều cuộn */
  if (hasGSAP && !RM) {
    document.querySelectorAll('[data-px]').forEach(el => {
      gsap.to(el, {
        yPercent: parseFloat(el.dataset.px) * -100, ease: 'none',
        scrollTrigger: { trigger: el.parentElement || el, start: 'top bottom', end: 'bottom top', scrub: 0.8 }
      });
    });
    document.querySelectorAll('.ridge svg path').forEach((pa, i) => {
      gsap.fromTo(pa, { yPercent: 14 - i * 6 }, {
        yPercent: -6 + i * 4, ease: 'none',
        scrollTrigger: { trigger: pa.closest('.ridge'), start: 'top bottom', end: 'bottom top', scrub: 0.9 }
      });
    });
  }

  /* ── thanh nav + tiến độ ────────────────────────────── */
  const nav = document.querySelector('.nav');
  const prog = document.querySelector('.prog');
  let last = 0;
  const onScroll = () => {
    const y = scrollY;
    const dy = y - last;                       // phải lấy hiệu trước khi cập nhật
    if (nav) nav.classList.toggle('hidden', dy > 0 && y > 240);
    last = y;
    if (prog) {
      const h = document.body.scrollHeight - innerHeight;
      prog.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    }
    // cuộn nhanh thì hoa bạt theo, rồi lặng dần
    if (petalField) petalField.gust(Math.max(-1.6, Math.min(1.6, dy * 0.05)));
  };
  if (lenis) lenis.on('scroll', onScroll);
  addEventListener('scroll', onScroll, { passive: true });

  /* ── con trỏ ────────────────────────────────────────── */
  if (!RM && matchMedia('(hover: hover)').matches) {
    const ring = document.createElement('div'); ring.className = 'cursor';
    const dot = document.createElement('div'); dot.className = 'cursor-dot';
    document.body.append(ring, dot);
    ring.style.opacity = dot.style.opacity = '0';
    let mx = -100, my = -100, rx = mx, ry = my, seen = false;
    addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      if (!seen) { seen = true; rx = mx; ry = my; ring.style.opacity = dot.style.opacity = '1'; }
      dot.style.transform = `translate(${mx}px,${my}px)`;
    }, { passive: true });
    (function loop() {
      rx = lerp(rx, mx, 0.14); ry = lerp(ry, my, 0.14);
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

  /* ── nút hút chuột ──────────────────────────────────── */
  if (!RM) document.querySelectorAll('[data-mag]').forEach(el => {
    el.style.transition = 'transform .6s cubic-bezier(.19,1,.22,1)';
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      el.style.transform =
        `translate(${(e.clientX - r.left - r.width / 2) * .22}px,${(e.clientY - r.top - r.height / 2) * .3}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });

  /* nội dung nạp sau (danh sách bài) — báo cho ScrollTrigger đo lại */
  window.__refreshMotion = () => {
    observeAll();
    if (hasGSAP) ScrollTrigger.refresh();
  };
})();
