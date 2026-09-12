/* ═══════════════════════════════════════════════════════════
   SƠN THUỶ — núi, nước, hoa rơi
   Một canvas cho cảnh, một canvas cho cánh hoa phủ cả trang.
   ═══════════════════════════════════════════════════════════ */
window.SONTHUY = (() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* nhiễu giá trị 1 chiều — sống núi gấp khúc tự nhiên hơn tổng các hàm sin */
  function noise1(seed) {
    const n = 256, r = [];
    let s = seed >>> 0;
    const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
    for (let i = 0; i < n; i++) r.push(rnd());
    return x => {
      const i = Math.floor(x), f = x - i;
      const a = r[((i % n) + n) % n], b = r[(((i + 1) % n) + n) % n];
      const u = f * f * (3 - 2 * f);
      return a * (1 - u) + b * u;
    };
  }
  function fbm(seed, octaves) {
    const fns = [];
    for (let o = 0; o < octaves; o++) fns.push(noise1(seed + o * 7919));
    return x => {
      let v = 0, amp = 1, fq = 1, norm = 0;
      for (let o = 0; o < octaves; o++) {
        v += fns[o](x * fq) * amp;
        norm += amp; amp *= 0.5; fq *= 2.15;
      }
      return v / norm;
    };
  }
  const shade = (hex, k) => {
    const n = parseInt(hex.slice(1), 16);
    const f = c => Math.max(0, Math.min(255, Math.round(c + c * k)));
    return `rgb(${f(n >> 16 & 255)},${f(n >> 8 & 255)},${f(n & 255)})`;
  };

  /* ══════════════════ CẢNH: NÚI + NƯỚC ══════════════════ */
  function mountains(cv) {
    let ctx = null;
    try { ctx = cv.getContext && cv.getContext('2d'); } catch (e) { return null; }
    if (!ctx) return null;

    let W = 0, H = 0, dpr = 1, layers = [], t = 0, raf = null, scroll = 0;
    /* ac: phần trên mặt nước. rc: bóng nước, dựng ở nửa độ phân giải rồi phóng to —
       nước vốn đã nhoè nên không ai thấy khác, mà số điểm ảnh giảm bốn lần. */
    const ac = document.createElement('canvas'), acx = ac.getContext('2d');
    const rc = document.createElement('canvas'), rcx = rc.getContext('2d');
    let RSC = 0.5, STEP = 3, slow = 0;

    const HORIZON = 0.615; // mép nước
    const SQUASH  = 0.94;   // bóng nước thấp hơn vật thật một chút

    /* xa → gần: dãy xa nhạt, cao, trôi chậm; dãy gần đậm, thấp, trôi nhanh */
    const SPEC = [
      { seed: 11, oct: 3, base: 0.30, amp: 0.24, freq: 0.55, tone: '#e3d2ae', mist: 1.00, drift: 0.5, par: 0.04 },
      { seed: 29, oct: 4, base: 0.375, amp: 0.27, freq: 0.8, tone: '#d6bf95', mist: 0.80, drift: 0.9, par: 0.09 },
      { seed: 47, oct: 4, base: 0.45, amp: 0.28, freq: 1.05, tone: '#c0a271', mist: 0.58, drift: 1.5, par: 0.16 },
      { seed: 83, oct: 5, base: 0.515, amp: 0.26, freq: 1.4, tone: '#9c7d50', mist: 0.36, drift: 2.3, par: 0.25 },
      { seed: 97, oct: 5, base: 0.575, amp: 0.22, freq: 1.85, tone: '#715636', mist: 0.17, drift: 3.4, par: 0.36 },
      { seed: 131, oct: 5, base: 0.618, amp: 0.15, freq: 2.4, tone: '#4a3823', mist: 0.00, drift: 4.8, par: 0.50 }
    ];

    const build = () => {
      layers = SPEC.map(sp => {
        const f = fbm(sp.seed, sp.oct);
        const ow = Math.ceil(W * 1.3);
        const oh = Math.ceil(H * HORIZON) + 2;
        const off = document.createElement('canvas');
        off.width = Math.max(1, Math.ceil(ow * dpr));
        off.height = Math.max(1, Math.ceil(oh * dpr));
        const c = off.getContext('2d');
        if (!c) return null;
        c.setTransform(dpr, 0, 0, dpr, 0, 0);

        c.beginPath();
        c.moveTo(0, oh);
        for (let x = 0; x <= ow; x += 2) {
          c.lineTo(x, H * (sp.base - f(x / ow * sp.freq * 9) * sp.amp));
        }
        c.lineTo(ow, oh); c.closePath();

        const g = c.createLinearGradient(0, H * (sp.base - sp.amp), 0, oh);
        g.addColorStop(0, sp.tone);
        g.addColorStop(1, shade(sp.tone, -0.3));
        c.fillStyle = g; c.fill();

        // sương đọng dưới chân dãy
        const m = c.createLinearGradient(0, H * (sp.base - sp.amp * 0.2), 0, oh);
        m.addColorStop(0, `rgba(250,240,214,${0.40 * sp.mist})`);
        m.addColorStop(0.6, `rgba(244,230,198,${0.14 * sp.mist})`);
        m.addColorStop(1, 'rgba(250,240,214,0)');
        c.globalCompositeOperation = 'source-atop';
        c.fillStyle = m; c.fillRect(0, 0, ow, oh);
        c.globalCompositeOperation = 'source-over';

        return { off, ow, oh, drift: sp.drift, par: sp.par, base: sp.base, mist: sp.mist };
      }).filter(Boolean);
    };

    const resize = () => {
      const r = cv.getBoundingClientRect();
      const w = Math.round(r.width), h = Math.round(r.height);
      if (!w || !h) return false;
      if (w === W && h === H) return true;
      dpr = Math.min(devicePixelRatio || 1, 1.5);
      W = w; H = h;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const wy = Math.round(H * HORIZON);
      ac.width = Math.round(W * dpr); ac.height = Math.round(wy * dpr);
      acx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rc.width = Math.max(1, Math.round(W * RSC)); rc.height = Math.max(1, Math.round((H - wy) * RSC));
      build();
      return true;
    };

    const paint = () => {
      const waterY = Math.round(H * HORIZON);
      const wh = H - waterY;
      const lift = scroll * H * 0.22;          // cả cảnh dâng nhẹ khi cuộn

      /* ═══ phần trên mặt nước, vẽ vào canvas phụ ═══ */
      const a = acx;
      a.setTransform(dpr, 0, 0, dpr, 0, 0);
      a.clearRect(0, 0, W, waterY);

      const sky = a.createLinearGradient(0, 0, 0, waterY);
      sky.addColorStop(0, '#f8f1df');
      sky.addColorStop(0.32, '#f5e8c6');
      sky.addColorStop(0.62, '#efd9a4');
      sky.addColorStop(0.88, '#e9c988');
      sky.addColorStop(1, '#e4c078');
      a.fillStyle = sky; a.fillRect(0, 0, W, waterY);

      const sx = W * 0.755, sy = H * 0.15 - lift * 0.3, sr = Math.min(W, H) * 0.062;
      const halo = a.createRadialGradient(sx, sy, sr * 0.4, sx, sy, sr * 8);
      halo.addColorStop(0, 'rgba(214,132,32,0.26)');
      halo.addColorStop(0.45, 'rgba(224,168,60,0.08)');
      halo.addColorStop(1, 'rgba(224,168,60,0)');
      a.fillStyle = halo; a.beginPath(); a.arc(sx, sy, sr * 8, 0, 6.2832); a.fill();
      a.fillStyle = 'rgba(199,120,26,0.68)';
      a.beginPath(); a.arc(sx, sy, sr, 0, 6.2832); a.fill();

      layers.forEach((L, i) => {
        const x = -((t * L.drift) % (L.ow - W));
        const y = -lift * L.par;
        a.drawImage(L.off, x, y, L.ow, L.oh);
        if (x + L.ow < W) a.drawImage(L.off, x + L.ow, y, L.ow, L.oh);

        if (i < layers.length - 1) {
          const by = H * L.base + H * 0.015 - y * 0.5;
          const al = 0.10 + 0.06 * Math.sin(t * 0.011 + i * 1.7);
          const band = a.createLinearGradient(0, by - H * 0.05, 0, by + H * 0.07);
          band.addColorStop(0, 'rgba(252,244,224,0)');
          band.addColorStop(0.5, `rgba(252,244,224,${al})`);
          band.addColorStop(1, 'rgba(252,244,224,0)');
          a.fillStyle = band; a.fillRect(0, by - H * 0.05, W, H * 0.12);
        }
      });

      /* ═══ bóng nước, dựng ở nửa độ phân giải ═══ */
      const r = rcx;
      r.setTransform(1, 0, 0, 1, 0, 0);
      r.clearRect(0, 0, rc.width, rc.height);
      for (let i = 0; i < wh; i += STEP) {
        const syy = waterY - i * SQUASH;
        if (syy < 0) break;
        const wob = Math.sin(i * 0.05 + t * 1.5) * (1.4 + i * 0.075)
                  + Math.sin(i * 0.13 - t * 2.1) * (0.7 + i * 0.035);
        r.drawImage(ac,
          0, Math.round(syy * dpr), ac.width, Math.max(1, Math.round(STEP * dpr)),
          wob * RSC, i * RSC, rc.width, Math.max(1, STEP * RSC));
      }

      /* ═══ ghép lên canvas chính ═══ */
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(ac, 0, 0, W, waterY);
      ctx.drawImage(rc, 0, waterY, W, wh);

      /* làm nhạt và ngả vàng mặt nước cho ra chất nước */
      const wt = ctx.createLinearGradient(0, waterY, 0, H);
      wt.addColorStop(0, 'rgba(243,230,198,0.40)');
      wt.addColorStop(0.35, 'rgba(242,229,197,0.66)');
      wt.addColorStop(0.7, 'rgba(245,234,208,0.84)');
      wt.addColorStop(1, 'rgba(247,239,219,0.95)');
      ctx.fillStyle = wt; ctx.fillRect(0, waterY, W, wh);

      /* gợn nước — những vệt sáng nằm ngang trôi chậm */
      for (let i = 0; i < 22; i++) {
        const pr = i / 22;
        const yy = waterY + Math.pow(pr, 1.7) * wh;
        const ph = t * (0.5 + pr * 1.4) + i * 2.1;
        const len = W * (0.1 + 0.34 * ((Math.sin(i * 3.7) + 1) / 2));
        const cx = (W * 0.5) + Math.sin(ph * 0.25 + i) * W * 0.42;
        const al = (0.05 + 0.10 * pr) * (0.5 + 0.5 * Math.sin(ph * 0.5));
        const g2 = ctx.createLinearGradient(cx - len / 2, 0, cx + len / 2, 0);
        g2.addColorStop(0, 'rgba(255,250,236,0)');
        g2.addColorStop(0.5, `rgba(255,250,236,${al})`);
        g2.addColorStop(1, 'rgba(255,250,236,0)');
        ctx.fillStyle = g2;
        ctx.fillRect(cx - len / 2, yy, len, Math.max(1, 1 + pr * 2.4));
      }

      /* sương là là mặt nước — giấu đường cắt giữa núi và bóng nước */
      const fa = 0.5 + 0.12 * Math.sin(t * 0.009);
      const fog = ctx.createLinearGradient(0, waterY - H * 0.13, 0, waterY + H * 0.1);
      fog.addColorStop(0, 'rgba(250,242,222,0)');
      fog.addColorStop(0.42, `rgba(250,242,222,${0.5 * fa})`);
      fog.addColorStop(0.56, `rgba(252,245,228,${0.72 * fa})`);
      fog.addColorStop(0.72, `rgba(250,242,222,${0.4 * fa})`);
      fog.addColorStop(1, 'rgba(250,242,222,0)');
      ctx.fillStyle = fog;
      ctx.fillRect(0, waterY - H * 0.13, W, H * 0.23);

      for (let i = 0; i < 5; i++) {
        const yy = waterY - H * 0.075 + i * H * 0.028;
        const ph = t * (0.18 + i * 0.07) + i * 2.4;
        const cx = (W * 0.5) + Math.sin(ph * 0.3) * W * 0.55;
        const len = W * (0.35 + 0.3 * ((Math.sin(i * 5.1) + 1) / 2));
        const al = 0.10 + 0.07 * Math.sin(ph * 0.6);
        const g3 = ctx.createLinearGradient(cx - len / 2, 0, cx + len / 2, 0);
        g3.addColorStop(0, 'rgba(255,250,235,0)');
        g3.addColorStop(0.5, `rgba(255,250,235,${Math.max(0, al)})`);
        g3.addColorStop(1, 'rgba(255,250,235,0)');
        ctx.fillStyle = g3;
        ctx.fillRect(cx - len / 2, yy, len, H * 0.02);
      }

      const edge = ctx.createLinearGradient(0, waterY - 7, 0, waterY + 9);
      edge.addColorStop(0, 'rgba(255,250,233,0)');
      edge.addColorStop(0.45, 'rgba(255,250,233,0.16)');
      edge.addColorStop(1, 'rgba(255,250,233,0)');
      ctx.fillStyle = edge; ctx.fillRect(0, waterY - 7, W, 16);
    };

    let prev = 0;
    const frame = (now) => {
      if (prev) {
        const dt = now - prev;
        // máy yếu thì thưa lát cắt bóng nước ra, giữ cho cảnh còn trôi mượt
        if (dt > 26) { slow++; if (slow > 30 && STEP < 6) { STEP++; slow = 0; } }
        else if (dt < 17) { slow = Math.max(0, slow - 1); }
      }
      prev = now;
      t += 0.055; paint();
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (!resize()) { requestAnimationFrame(start); return; }
      paint();
      if (!RM && !raf) raf = requestAnimationFrame(frame);
    };

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(start);
    addEventListener('load', start);
    start();

    if (typeof ResizeObserver !== 'undefined')
      new ResizeObserver(() => { if (resize()) paint(); }).observe(cv);
    addEventListener('resize', () => { if (resize()) paint(); }, { passive: true });

    return { setScroll: v => { scroll = v; if (RM) paint(); } };
  }

  /* ══════════════════ HOA RƠI ══════════════════ */
  function petals(cv, opts) {
    let ctx = null;
    try { ctx = cv.getContext && cv.getContext('2d'); } catch (e) { return null; }
    if (!ctx || RM) return null;

    const o = Object.assign({ density: 1, wind: 0.32, alpha: 1 }, opts || {});
    const TINTS = ['#f0d7bf', '#ecc9a6', '#e7bfab', '#f4e3c8', '#e3b48f'];
    let W = 0, H = 0, dpr = 1, ps = [], t = 0, drift = 0;

    const make = (seeded) => ({
      x: Math.random() * W,
      y: seeded ? Math.random() * H : -20 - Math.random() * H * 0.35,
      r: 4 + Math.random() * 7,
      vy: 0.22 + Math.random() * 0.55,
      sway: 0.5 + Math.random() * 1.5,
      phase: Math.random() * 6.2832,
      spin: Math.random() * 6.2832,
      dspin: (Math.random() - 0.5) * 0.026,
      tilt: Math.random() * 6.2832,
      dtilt: 0.008 + Math.random() * 0.026,
      tint: TINTS[(Math.random() * TINTS.length) | 0],
      a: 0.3 + Math.random() * 0.55
    });

    const resize = () => {
      const w = innerWidth, h = innerHeight;
      if (!w || !h) return false;
      const same = (w === W && h === H);
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = w; H = h;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const want = Math.round(Math.min(46, (W * H) / 26000) * o.density);
      if (!same || ps.length !== want) {
        if (ps.length > want) ps.length = want;
        while (ps.length < want) ps.push(make(true));
      }
      return true;
    };

    /* một cánh hoa: hai đường bezier, khuyết nhẹ ở chóp */
    const petal = (r) => {
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.bezierCurveTo(r * 0.92, -r * 0.55, r * 0.62, r * 0.72, r * 0.1, r);
      ctx.quadraticCurveTo(0, r * 0.78, -r * 0.1, r);
      ctx.bezierCurveTo(-r * 0.62, r * 0.72, -r * 0.92, -r * 0.55, 0, -r);
      ctx.closePath();
    };

    const frame = () => {
      t += 0.016;
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = o.alpha;

      for (const p of ps) {
        p.y += p.vy;
        p.phase += 0.012;
        p.x += Math.sin(p.phase) * p.sway * 0.5 + o.wind + drift;
        p.spin += p.dspin;
        p.tilt += p.dtilt;

        if (p.y > H + 30 || p.x > W + 40 || p.x < -40) Object.assign(p, make(false));

        const flip = Math.cos(p.tilt);          // lật cánh — giả 3 chiều
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.spin);
        ctx.scale(Math.max(0.12, Math.abs(flip)), 1);
        ctx.globalAlpha = o.alpha * p.a * (0.45 + 0.55 * Math.abs(flip));
        ctx.fillStyle = p.tint;
        petal(p.r);
        ctx.fill();
        // gân giữa
        ctx.globalAlpha *= 0.35;
        ctx.strokeStyle = shade(p.tint, -0.3);
        ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(0, -p.r * 0.75); ctx.lineTo(0, p.r * 0.8); ctx.stroke();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(frame);
    };

    if (!resize()) return null;
    addEventListener('resize', resize, { passive: true });
    requestAnimationFrame(frame);

    return { gust: v => { drift = v; } };
  }

  /* ══════════════════ SÓNG LAN KHI BẤM ══════════════════ */
  function ripples(cv) {
    let ctx = null;
    try { ctx = cv.getContext && cv.getContext('2d'); } catch (e) { return null; }
    if (!ctx || RM) return null;

    let W = 0, H = 0, dpr = 1, rs = [], running = false;
    const resize = () => {
      W = innerWidth; H = innerHeight;
      dpr = Math.min(devicePixelRatio || 1, 2);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const frame = () => {
      ctx.clearRect(0, 0, W, H);
      rs = rs.filter(r => r.life < 1);
      for (const r of rs) {
        r.life += 0.012;
        const e = 1 - Math.pow(1 - r.life, 3);
        for (let k = 0; k < 3; k++) {
          const rad = e * r.max * (1 - k * 0.22);
          if (rad <= 0) continue;
          ctx.beginPath();
          ctx.arc(r.x, r.y, rad, 0, 6.2832);
          ctx.strokeStyle = `rgba(180,68,31,${(1 - r.life) * (0.3 - k * 0.08)})`;
          ctx.lineWidth = 1.2 - k * 0.3;
          ctx.stroke();
        }
      }
      if (rs.length) requestAnimationFrame(frame); else running = false;
    };
    resize();
    addEventListener('resize', resize, { passive: true });
    addEventListener('pointerdown', e => {
      if (e.target.closest('input,textarea,select')) return;
      rs.push({ x: e.clientX, y: e.clientY, life: 0, max: 90 + Math.random() * 50 });
      if (!running) { running = true; requestAnimationFrame(frame); }
    }, { passive: true });
    return {};
  }

  return { mountains, petals, ripples, fbm, noise1 };
})();
