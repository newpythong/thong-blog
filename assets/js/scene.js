/* ═══════════════════════════════════════════════════════════
   SƠN THUỶ — cảnh chuyển theo cuộn
   Một tiến độ 0→1 kéo cả cảnh qua bốn hồi: bình minh trên núi,
   nước dâng, chiều tà, rồi lặng. Núi không đi đâu, chỉ trời nước đổi.
   ═══════════════════════════════════════════════════════════ */
window.SONTHUY = (() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const mix = (a, b, t) => a + (b - a) * t;

  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mixHex = (a, b, t) => {
    const A = hex(a), B = hex(b);
    return [Math.round(mix(A[0], B[0], t)), Math.round(mix(A[1], B[1], t)), Math.round(mix(A[2], B[2], t))];
  };
  const rgb = c => `rgb(${c[0]},${c[1]},${c[2]})`;
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const lift = (c, k) => c.map(v => clamp(Math.round(v + (255 - v) * k), 0, 255));
  const shade = (h, k) => {
    const c = hex(h), f = v => clamp(Math.round(v + v * k), 0, 255);
    return `rgb(${f(c[0])},${f(c[1])},${f(c[2])})`;
  };

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

  /* ══════════════ CẢNH ══════════════ */
  function mountains(cv) {
    let ctx = null;
    try { ctx = cv.getContext && cv.getContext('2d'); } catch (e) { return null; }
    if (!ctx) return null;

    /* mép nước chạy trong khoảng này — canvas phụ phải đủ chỗ cho cả hai đầu */
    const HMAX = 0.66, HMIN = 0.38;

    /* bốn hồi, cảnh nội suy liên tục giữa các mốc */
    const ACTS = [
      { /* 0 · bình minh trên núi */
        sky: ['#f8f1df', '#f5e8c6', '#efd9a4', '#e9c988', '#e4c078'],
        sunX: .755, sunY: .15, sunR: .062, sunCore: '#c7781a', sunA: .68, haloA: .26,
        horizon: .615, dolly: 0, fog: .55, mist: 1, grade: '#ffffff', gradeA: 0,
        water: ['#f3e6c6', '#f2e5c5', '#f5ead0', '#f7efdb'], waterA: [.40, .66, .84, .95]
      },
      { /* 1 · nước dâng, sương lên */
        sky: ['#fbf6ea', '#f7ecd4', '#f2dfb4', '#ecd29b', '#e6c689'],
        sunX: .70, sunY: .27, sunR: .072, sunCore: '#cd8420', sunA: .60, haloA: .34,
        horizon: .50, dolly: .45, fog: .95, mist: 1.25, grade: '#f6e6c0', gradeA: .10,
        water: ['#f0e0bd', '#efdfbe', '#f3e7cb', '#f7efdb'], waterA: [.34, .60, .80, .94]
      },
      { /* 2 · chiều tà, non nước mở ra */
        sky: ['#fbeedd', '#f6dfc2', '#eec79c', '#e0a877', '#cf8c5c'],
        sunX: .62, sunY: .44, sunR: .086, sunCore: '#c2551f', sunA: .72, haloA: .40,
        horizon: .43, dolly: .8, fog: .7, mist: .9, grade: '#e8a85f', gradeA: .16,
        water: ['#e6c9a0', '#e3c39c', '#eddab6', '#f7efdb'], waterA: [.30, .56, .78, .93]
      },
      { /* 3 · lặng */
        sky: ['#faf3e4', '#f5e9d1', '#eedcb8', '#e6cfa4', '#dcc094'],
        sunX: .56, sunY: .56, sunR: .05, sunCore: '#b4441f', sunA: .34, haloA: .18,
        horizon: .40, dolly: 1, fog: .38, mist: .55, grade: '#f2dfba', gradeA: .08,
        water: ['#eee0c0', '#ece0c4', '#f2e8d2', '#f7efdb'], waterA: [.28, .52, .76, .92]
      }
    ];

    let W = 0, H = 0, dpr = 1, layers = [], t = 0, raf = null, p = 0;
    let STEP = 3, slow = 0;
    const RSC = 0.5;
    const ac = document.createElement('canvas'), acx = ac.getContext('2d');
    const rc = document.createElement('canvas'), rcx = rc.getContext('2d');

    const SPEC = [
      { seed: 11, oct: 3, base: .30, amp: .24, freq: .55, tone: '#e3d2ae', mist: 1.00, drift: .5, par: .04, zoom: .04 },
      { seed: 29, oct: 4, base: .375, amp: .27, freq: .80, tone: '#d6bf95', mist: .80, drift: .9, par: .09, zoom: .09 },
      { seed: 47, oct: 4, base: .45, amp: .28, freq: 1.05, tone: '#c0a271', mist: .58, drift: 1.5, par: .16, zoom: .16 },
      { seed: 83, oct: 5, base: .515, amp: .26, freq: 1.40, tone: '#9c7d50', mist: .36, drift: 2.3, par: .25, zoom: .26 },
      { seed: 97, oct: 5, base: .575, amp: .22, freq: 1.85, tone: '#715636', mist: .17, drift: 3.4, par: .36, zoom: .40 },
      { seed: 131, oct: 5, base: .618, amp: .15, freq: 2.40, tone: '#4a3823', mist: 0, drift: 4.8, par: .50, zoom: .58 }
    ];

    const stage = () => {
      const n = ACTS.length - 1;
      const f = clamp(p, 0, 1) * n;
      const i = Math.min(n - 1, Math.floor(f));
      const raw = f - i;
      const k = raw * raw * (3 - 2 * raw);      // mượt hai đầu mỗi hồi
      const A = ACTS[i], B = ACTS[i + 1];
      return {
        sky: A.sky.map((c, j) => rgb(mixHex(c, B.sky[j], k))),
        sunX: mix(A.sunX, B.sunX, k), sunY: mix(A.sunY, B.sunY, k), sunR: mix(A.sunR, B.sunR, k),
        sun: mixHex(A.sunCore, B.sunCore, k),
        sunA: mix(A.sunA, B.sunA, k), haloA: mix(A.haloA, B.haloA, k),
        horizon: mix(A.horizon, B.horizon, k),
        dolly: mix(A.dolly, B.dolly, k),
        fog: mix(A.fog, B.fog, k), mist: mix(A.mist, B.mist, k),
        grade: rgb(mixHex(A.grade, B.grade, k)), gradeA: mix(A.gradeA, B.gradeA, k),
        water: A.water.map((c, j) => mixHex(c, B.water[j], k)),
        waterA: A.waterA.map((v, j) => mix(v, B.waterA[j], k))
      };
    };

    const build = () => {
      const oh = Math.ceil(H * HMAX) + 2;
      layers = SPEC.map(sp => {
        const f = fbm(sp.seed, sp.oct);
        const ow = Math.ceil(W * 1.3);
        const off = document.createElement('canvas');
        off.width = Math.max(1, Math.ceil(ow * dpr));
        off.height = Math.max(1, Math.ceil(oh * dpr));
        const c = off.getContext('2d');
        if (!c) return null;
        c.setTransform(dpr, 0, 0, dpr, 0, 0);

        c.beginPath();
        c.moveTo(0, oh);
        for (let x = 0; x <= ow; x += 2) c.lineTo(x, H * (sp.base - f(x / ow * sp.freq * 9) * sp.amp));
        c.lineTo(ow, oh); c.closePath();

        const g = c.createLinearGradient(0, H * (sp.base - sp.amp), 0, oh);
        g.addColorStop(0, sp.tone);
        g.addColorStop(1, shade(sp.tone, -.3));
        c.fillStyle = g; c.fill();

        const m = c.createLinearGradient(0, H * (sp.base - sp.amp * .2), 0, oh);
        m.addColorStop(0, `rgba(250,240,214,${.40 * sp.mist})`);
        m.addColorStop(.6, `rgba(244,230,198,${.14 * sp.mist})`);
        m.addColorStop(1, 'rgba(250,240,214,0)');
        c.globalCompositeOperation = 'source-atop';
        c.fillStyle = m; c.fillRect(0, 0, ow, oh);
        c.globalCompositeOperation = 'source-over';

        return Object.assign({ off, ow, oh }, sp);
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

      ac.width = Math.round(W * dpr); ac.height = Math.round(H * HMAX * dpr) + 4;
      acx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rc.width = Math.max(1, Math.round(W * RSC));
      rc.height = Math.max(1, Math.round(H * (1 - HMIN) * RSC));
      build();
      return true;
    };

    const paint = () => {
      const s = stage();
      const waterY = Math.round(H * s.horizon);
      const wh = H - waterY;
      const acH = H * HMAX + 2;

      /* ═══ trên mặt nước ═══ */
      const a = acx;
      a.setTransform(dpr, 0, 0, dpr, 0, 0);
      a.clearRect(0, 0, W, acH);

      const sky = a.createLinearGradient(0, 0, 0, waterY);
      [0, .32, .62, .88, 1].forEach((st, i) => sky.addColorStop(st, s.sky[i]));
      a.fillStyle = sky; a.fillRect(0, 0, W, acH);

      const sx = W * s.sunX, sy = H * s.sunY, sr = Math.min(W, H) * s.sunR;
      const halo = a.createRadialGradient(sx, sy, sr * .4, sx, sy, sr * 8);
      halo.addColorStop(0, rgba(lift(s.sun, .25), s.haloA));
      halo.addColorStop(.45, rgba(lift(s.sun, .5), s.haloA * .3));
      halo.addColorStop(1, rgba(lift(s.sun, .6), 0));
      a.fillStyle = halo; a.beginPath(); a.arc(sx, sy, sr * 8, 0, 6.2832); a.fill();
      a.fillStyle = rgba(s.sun, s.sunA);
      a.beginPath(); a.arc(sx, sy, sr, 0, 6.2832); a.fill();

      /* núi — càng gần càng phóng to và dâng nhiều, thành ra như ống kính tiến vào */
      layers.forEach((L, i) => {
        const z = 1 + s.dolly * L.zoom;
        const ow = L.ow * z, oh = L.oh * z;
        const x = -((t * L.drift) % (L.ow - W)) - (ow - L.ow) * .5;
        const y = s.dolly * H * L.par * .55 - (oh - L.oh) * .35;
        a.drawImage(L.off, x, y, ow, oh);
        if (x + ow < W) a.drawImage(L.off, x + ow, y, ow, oh);

        if (i < layers.length - 1) {
          const by = H * L.base * z + y + H * .015;
          const al = (.10 + .06 * Math.sin(t * .011 + i * 1.7)) * s.mist;
          const band = a.createLinearGradient(0, by - H * .05, 0, by + H * .07);
          band.addColorStop(0, 'rgba(252,244,224,0)');
          band.addColorStop(.5, `rgba(252,244,224,${al})`);
          band.addColorStop(1, 'rgba(252,244,224,0)');
          a.fillStyle = band; a.fillRect(0, by - H * .05, W, H * .12);
        }
      });

      /* chỉnh màu cả khuôn hình theo hồi — như grade một thước phim */
      if (s.gradeA > .002) {
        a.globalCompositeOperation = 'multiply';
        a.globalAlpha = s.gradeA;
        a.fillStyle = s.grade;
        a.fillRect(0, 0, W, acH);
        a.globalAlpha = 1;
        a.globalCompositeOperation = 'source-over';
      }

      /* ═══ bóng nước ═══ */
      const r = rcx;
      r.setTransform(1, 0, 0, 1, 0, 0);
      r.clearRect(0, 0, rc.width, rc.height);
      for (let i = 0; i < wh; i += STEP) {
        const syy = waterY - i * .94;
        if (syy < 0) break;
        const wob = Math.sin(i * .05 + t * 1.5) * (1.4 + i * .075)
                  + Math.sin(i * .13 - t * 2.1) * (.7 + i * .035);
        r.drawImage(ac,
          0, Math.round(syy * dpr), ac.width, Math.max(1, Math.round(STEP * dpr)),
          wob * RSC, i * RSC, rc.width, Math.max(1, STEP * RSC));
      }

      /* ═══ ghép ═══ */
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(ac, 0, 0, W, acH);
      ctx.drawImage(rc, 0, 0, rc.width, Math.max(1, Math.ceil(wh * RSC)), 0, waterY, W, wh);

      const wt = ctx.createLinearGradient(0, waterY, 0, H);
      [0, .35, .7, 1].forEach((st, i) => wt.addColorStop(st, rgba(s.water[i], s.waterA[i])));
      ctx.fillStyle = wt; ctx.fillRect(0, waterY, W, wh);

      for (let i = 0; i < 22; i++) {
        const pr = i / 22;
        const yy = waterY + Math.pow(pr, 1.7) * wh;
        const ph = t * (.5 + pr * 1.4) + i * 2.1;
        const len = W * (.1 + .34 * ((Math.sin(i * 3.7) + 1) / 2));
        const cx = W * .5 + Math.sin(ph * .25 + i) * W * .42;
        const al = (.05 + .10 * pr) * (.5 + .5 * Math.sin(ph * .5));
        const g2 = ctx.createLinearGradient(cx - len / 2, 0, cx + len / 2, 0);
        g2.addColorStop(0, 'rgba(255,250,236,0)');
        g2.addColorStop(.5, `rgba(255,250,236,${al})`);
        g2.addColorStop(1, 'rgba(255,250,236,0)');
        ctx.fillStyle = g2;
        ctx.fillRect(cx - len / 2, yy, len, Math.max(1, 1 + pr * 2.4));
      }

      const fa = (.5 + .12 * Math.sin(t * .009)) * s.fog;
      const fog = ctx.createLinearGradient(0, waterY - H * .13, 0, waterY + H * .1);
      fog.addColorStop(0, 'rgba(250,242,222,0)');
      fog.addColorStop(.42, `rgba(250,242,222,${.5 * fa})`);
      fog.addColorStop(.56, `rgba(252,245,228,${.72 * fa})`);
      fog.addColorStop(.72, `rgba(250,242,222,${.4 * fa})`);
      fog.addColorStop(1, 'rgba(250,242,222,0)');
      ctx.fillStyle = fog; ctx.fillRect(0, waterY - H * .13, W, H * .23);

      for (let i = 0; i < 5; i++) {
        const yy = waterY - H * .075 + i * H * .028;
        const ph = t * (.18 + i * .07) + i * 2.4;
        const cx = W * .5 + Math.sin(ph * .3) * W * .55;
        const len = W * (.35 + .3 * ((Math.sin(i * 5.1) + 1) / 2));
        const al = (.10 + .07 * Math.sin(ph * .6)) * s.fog;
        const g3 = ctx.createLinearGradient(cx - len / 2, 0, cx + len / 2, 0);
        g3.addColorStop(0, 'rgba(255,250,235,0)');
        g3.addColorStop(.5, `rgba(255,250,235,${Math.max(0, al)})`);
        g3.addColorStop(1, 'rgba(255,250,235,0)');
        ctx.fillStyle = g3; ctx.fillRect(cx - len / 2, yy, len, H * .02);
      }

      const edge = ctx.createLinearGradient(0, waterY - 7, 0, waterY + 9);
      edge.addColorStop(0, 'rgba(255,250,233,0)');
      edge.addColorStop(.45, 'rgba(255,250,233,0.16)');
      edge.addColorStop(1, 'rgba(255,250,233,0)');
      ctx.fillStyle = edge; ctx.fillRect(0, waterY - 7, W, 16);
    };

    let prev = 0;
    const frame = now => {
      if (prev) {
        const dt = now - prev;
        if (dt > 26) { slow++; if (slow > 30 && STEP < 6) { STEP++; slow = 0; } }
        else if (dt < 17) slow = Math.max(0, slow - 1);
      }
      prev = now;
      t += .055; paint();
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

    return { setStage: v => { p = clamp(v, 0, 1); if (RM) paint(); }, acts: ACTS.length };
  }

  /* ══════════════ HOA RƠI ══════════════ */
  function petals(cv, opts) {
    let ctx = null;
    try { ctx = cv.getContext && cv.getContext('2d'); } catch (e) { return null; }
    if (!ctx || RM) return null;

    const o = Object.assign({ density: 1, wind: .32, alpha: 1 }, opts || {});
    const TINTS = ['#f0d7bf', '#ecc9a6', '#e7bfab', '#f4e3c8', '#e3b48f'];
    let W = 0, H = 0, dpr = 1, ps = [], drift = 0, boost = 1;

    const make = seeded => ({
      x: Math.random() * W,
      y: seeded ? Math.random() * H : -20 - Math.random() * H * .35,
      r: 4 + Math.random() * 7,
      vy: .22 + Math.random() * .55,
      sway: .5 + Math.random() * 1.5,
      phase: Math.random() * 6.2832,
      spin: Math.random() * 6.2832,
      dspin: (Math.random() - .5) * .026,
      tilt: Math.random() * 6.2832,
      dtilt: .008 + Math.random() * .026,
      tint: TINTS[(Math.random() * TINTS.length) | 0],
      a: .3 + Math.random() * .55
    });

    const resize = () => {
      const w = innerWidth, h = innerHeight;
      if (!w || !h) return false;
      const same = w === W && h === H;
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

    const petal = r => {
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.bezierCurveTo(r * .92, -r * .55, r * .62, r * .72, r * .1, r);
      ctx.quadraticCurveTo(0, r * .78, -r * .1, r);
      ctx.bezierCurveTo(-r * .62, r * .72, -r * .92, -r * .55, 0, -r);
      ctx.closePath();
    };

    const frame = () => {
      ctx.clearRect(0, 0, W, H);
      for (const q of ps) {
        q.y += q.vy * boost;
        q.phase += .012;
        q.x += Math.sin(q.phase) * q.sway * .5 + o.wind + drift;
        q.spin += q.dspin;
        q.tilt += q.dtilt;
        if (q.y > H + 30 || q.x > W + 40 || q.x < -40) Object.assign(q, make(false));

        const flip = Math.cos(q.tilt);
        ctx.save();
        ctx.translate(q.x, q.y);
        ctx.rotate(q.spin);
        ctx.scale(Math.max(.12, Math.abs(flip)), 1);
        ctx.globalAlpha = o.alpha * q.a * (.45 + .55 * Math.abs(flip));
        ctx.fillStyle = q.tint;
        petal(q.r); ctx.fill();
        ctx.globalAlpha *= .35;
        ctx.strokeStyle = shade(q.tint, -.3);
        ctx.lineWidth = .6;
        ctx.beginPath(); ctx.moveTo(0, -q.r * .75); ctx.lineTo(0, q.r * .8); ctx.stroke();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(frame);
    };

    if (!resize()) return null;
    addEventListener('resize', resize, { passive: true });
    requestAnimationFrame(frame);

    return { gust: v => { drift = v; }, speed: v => { boost = clamp(v, .3, 3); } };
  }

  /* ══════════════ SÓNG LAN KHI BẤM ══════════════ */
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
        r.life += .012;
        const e = 1 - Math.pow(1 - r.life, 3);
        for (let k = 0; k < 3; k++) {
          const rad = e * r.max * (1 - k * .22);
          if (rad <= 0) continue;
          ctx.beginPath();
          ctx.arc(r.x, r.y, rad, 0, 6.2832);
          ctx.strokeStyle = `rgba(180,68,31,${(1 - r.life) * (.3 - k * .08)})`;
          ctx.lineWidth = 1.2 - k * .3;
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
