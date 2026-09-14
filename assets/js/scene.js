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
  const rgbHex = c => '#' + c.map(v => clamp(v, 0, 255).toString(16).padStart(2, '0')).join('');
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
    /* Bốn hồi, mỗi hồi một yếu tố cầm trịch: SƠN → PHONG → HOẢ → THUỶ.
       Màu và trọng số yếu tố đều nội suy liên tục, nên cảnh luân chuyển
       chứ không nhảy cóc. Trời luôn giữ đỉnh ấm để nền kem của trang
       còn đọc được xuyên suốt; chỉ dải dưới mới ngả sang màu của hồi. */
    const ACTS = [
      { /* 0 · SƠN — bình minh trên núi, vàng kim */
        sky: ['#fbf4e2', '#f7ead0', '#f1d9a8', '#ebc684', '#e4b56b'],
        sunX: .755, sunY: .15, sunR: .062, sunCore: '#c7781a', sunA: .68, haloA: .26,
        horizon: .615, dolly: 0, fog: .55, mist: 1, grade: '#ffffff', gradeA: 0,
        water: ['#f3e6c6', '#f2e5c5', '#f5ead0', '#f7efdb'], waterA: [.40, .66, .84, .95],
        ink: '#6b4a22', ember: '#d98a2c',
        son: 1, phong: .22, hoa: .10, thuy: .18
      },
      { /* 1 · PHONG — gió lùa, sương ngả ngọc bích */
        sky: ['#f8f6ea', '#ecf1dd', '#dae7d3', '#c5d9cd', '#b0cac4'],
        sunX: .70, sunY: .27, sunR: .075, sunCore: '#bb9a38', sunA: .48, haloA: .36,
        horizon: .50, dolly: .45, fog: .95, mist: 1.25, grade: '#dce9cf', gradeA: .13,
        water: ['#e0e8d6', '#dee6d8', '#e9efdf', '#f5f2e2'], waterA: [.34, .60, .80, .94],
        ink: '#415a49', ember: '#9fb26a',
        son: .45, phong: 1, hoa: .08, thuy: .35
      },
      { /* 2 · HOẢ — chiều lửa, non nước mở ra */
        sky: ['#fdeedb', '#f8cfa4', '#ef9f63', '#dd6a33', '#c04a1e'],
        sunX: .62, sunY: .44, sunR: .092, sunCore: '#a8300f', sunA: .80, haloA: .52,
        horizon: .43, dolly: .8, fog: .60, mist: .85, grade: '#e07a2c', gradeA: .20,
        water: ['#e6a87a', '#e09a6c', '#eec39a', '#f7e3c8'], waterA: [.30, .56, .78, .93],
        ink: '#7d2f13', ember: '#ef8a33',
        son: .35, phong: .55, hoa: 1, thuy: .55
      },
      { /* 3 · THUỶ — nước lặng, chiều ngả xanh */
        sky: ['#f7f2e3', '#eae8dc', '#d3dad8', '#b6c5c9', '#96b0b8'],
        sunX: .56, sunY: .56, sunR: .05, sunCore: '#9d5a3a', sunA: .34, haloA: .22,
        horizon: .40, dolly: 1, fog: .42, mist: .60, grade: '#cddbdd', gradeA: .13,
        water: ['#cfdadb', '#cfd9dc', '#e0e6e2', '#f2efe2'], waterA: [.30, .55, .78, .93],
        ink: '#33505c', ember: '#7fa3ad',
        son: .30, phong: .35, hoa: .12, thuy: 1
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
        waterA: A.waterA.map((v, j) => mix(v, B.waterA[j], k)),
        ink: mixHex(A.ink, B.ink, k),
        ember: mixHex(A.ember, B.ember, k),
        son: mix(A.son, B.son, k), phong: mix(A.phong, B.phong, k),
        hoa: mix(A.hoa, B.hoa, k), thuy: mix(A.thuy, B.thuy, k)
      };
    };

    /* số giả ngẫu nhiên ổn định theo chỉ số — cùng hạt cho ra cùng hình,
       nên không cần giữ mảng trạng thái nào cho các hạt bay */
    const frac = n => { const v = Math.sin(n) * 43758.5453; return v - Math.floor(v); };

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

    /* ══ PHONG — gió ══
       Dải lụa dài vắt ngang trời, trôi và uốn. Vẽ vào canvas trên mặt nước
       nên soi xuống nước luôn, không phải vẽ hai lần. */
    const drawPhong = (a, s) => {
      const k = s.phong;
      if (k < .02) return;
      a.lineCap = 'round';
      for (let i = 0; i < 8; i++) {
        const r1 = frac(i * 12.9898), r2 = frac(i * 78.233);
        const len = W * (.45 + r2 * .5);
        const y = H * (.07 + r1 * .40) + Math.sin(t * .22 + i * 1.7) * H * .016;
        const x = ((t * (14 + r2 * 26) + r1 * 3000) % (W + len * 2)) - len;
        const amp = H * (.010 + r2 * .026);
        const al = k * (.07 + r1 * .10) * (.55 + .45 * Math.sin(t * .5 + i * 2.1));
        if (al < .004) continue;
        const g = a.createLinearGradient(x, 0, x + len, 0);
        g.addColorStop(0, rgba(s.ink, 0));
        g.addColorStop(.42, rgba(s.ink, al));
        g.addColorStop(.62, rgba(s.ink, al * .8));
        g.addColorStop(1, rgba(s.ink, 0));
        a.strokeStyle = g;
        a.lineWidth = .7 + (i % 3) * .7;
        a.beginPath();
        a.moveTo(x, y);
        a.bezierCurveTo(x + len * .28, y - amp, x + len * .66, y + amp, x + len, y);
        a.stroke();
      }
    };

    /* ══ SƠN — mảnh mực ══
       Những nhát bút gãy góc trôi chậm trên tầng núi, nhắc lại dáng sống núi
       mà không vẽ thêm núi. */
    const drawSon = (a, s) => {
      const k = s.son;
      if (k < .02) return;
      for (let i = 0; i < 10; i++) {
        const r1 = frac(i * 3.71 + 1.3), r2 = frac(i * 9.17 + 4.6);
        const w = W * (.028 + r2 * .075);
        const x = ((t * (3 + r2 * 7) + r1 * 4200) % (W + w * 3)) - w * 1.5;
        const y = H * (.06 + r1 * .36) + Math.sin(t * .3 + i * 2.3) * H * .01;
        const h = w * (.16 + r1 * .3);
        const al = k * (.05 + r2 * .085);
        if (al < .004) continue;
        a.save();
        a.translate(x, y);
        a.rotate((r1 - .5) * .42);
        a.beginPath();
        a.moveTo(-w * .5, h * .5);
        a.lineTo(-w * .16, -h * .5);
        a.lineTo(w * .1, h * .04);
        a.lineTo(w * .34, -h * .28);
        a.lineTo(w * .5, h * .5);
        a.closePath();
        a.fillStyle = rgba(s.ink, al);
        a.fill();
        a.restore();
      }
    };

    /* ══ HOẢ — tàn lửa ══
       Đốm sáng bốc lên từ mé nước. Vị trí tính thẳng từ t và hạt giống,
       nên không cần nuôi mảng hạt qua từng khung hình. */
    const drawHoa = (a, s, waterY) => {
      const k = s.hoa;
      if (k < .02) return;

      /* quầng ấm hắt lên từ chân trời */
      const gh = a.createRadialGradient(W * s.sunX, waterY, 0, W * s.sunX, waterY, W * .6);
      gh.addColorStop(0, rgba(s.ember, .16 * k));
      gh.addColorStop(.5, rgba(s.ember, .05 * k));
      gh.addColorStop(1, rgba(s.ember, 0));
      a.fillStyle = gh;
      a.fillRect(0, waterY - H * .34, W, H * .36);

      for (let i = 0; i < 52; i++) {
        const r1 = frac(i * 12.9898 + .7), r2 = frac(i * 78.233 + 2.1), r3 = frac(i * 5.31 + 9.4);
        const life = (t * (.055 + r2 * .10) + r1) % 1;
        const rise = H * (.22 + r2 * .34);
        const y = waterY + H * .015 - life * rise;
        const x = W * r1 + Math.sin(t * (.4 + r3) + i * 1.3) * W * (.02 + r3 * .03);
        const fade = (1 - life) * (1 - life);
        const al = k * fade * (.35 + r3 * .5);
        if (al < .006) continue;
        const rr = (.8 + r3 * 2.1) * (1 - life * .45);
        a.beginPath();
        a.arc(x, y, rr, 0, 6.2832);
        a.fillStyle = rgba(s.ember, al);
        a.fill();
        if (r3 > .72) {                       /* vài đốm có lõi sáng hơn */
          a.beginPath();
          a.arc(x, y, rr * .45, 0, 6.2832);
          a.fillStyle = rgba(lift(s.ember, .55), al * .9);
          a.fill();
        }
      }
    };

    /* ══ THUỶ — vòng sóng ══
       Vẽ thẳng lên canvas chính, dưới đường chân trời: sóng trên mặt nước
       thì không có bóng để soi. Ép dẹt theo phương nhìn. */
    const drawThuy = (c, s, waterY, wh) => {
      const k = s.thuy;
      if (k < .02 || wh <= 0) return;
      c.lineWidth = 1;
      for (let i = 0; i < 7; i++) {
        const r1 = frac(i * 4.13 + 2.7), r2 = frac(i * 8.91 + 6.2);
        const life = (t * (.055 + r2 * .045) + r1) % 1;
        const cx = W * (.12 + r1 * .76);
        const cy = waterY + wh * (.14 + r2 * .72);
        const rad = life * Math.min(W, H) * (.14 + r2 * .18);
        const al = k * (1 - life) * (1 - life) * .30;
        if (al < .006 || rad < 2) continue;
        c.strokeStyle = rgba(s.ink, al);
        for (let j = 0; j < 2; j++) {
          const rr = rad * (1 - j * .34);
          if (rr < 2) continue;
          c.beginPath();
          c.ellipse(cx, cy, rr, rr * .20, 0, 0, 6.2832);
          c.globalAlpha = 1 - j * .45;
          c.stroke();
        }
        c.globalAlpha = 1;
      }
    };

    /* ══ LINH THÚ ══
       Bút pháp tranh tứ linh: mảng màu phẳng, viền mực dày, vân lửa cuộn
       ở các khớp. Bản trước tô bằng gradient giả khối tròn — cách đó cho
       ra đồ nhựa, không ra tranh. Mảng phẳng và viền đậm mạnh hơn nhiều,
       lại đọc rõ ở cỡ nhỏ.

       Mỗi vị vẽ trong hệ toạ độ riêng cỡ chừng [-1,1], rồi mới dời và
       phóng ra màn hình — dựng dáng bằng số đo tuyệt đối thì mỗi lần
       chỉnh cỡ là phải tính lại cả con. */

    const ha = (h, al) => rgba(hex(h), al);
    const MUC = '#241f1a';                      // màu viền chung

    const hien = (c, w) => {
      const d = Math.abs(p - c) / w;
      if (d >= 1) return 0;
      const q = 1 - d * d;
      return q * q;
    };

    const dat = (a, x, y, s, fn) => { a.save(); a.translate(x, y); a.scale(s, s); fn(); a.restore(); };

    /* tô mảng rồi viền — gần như mọi hình ở đây đều đi qua đây */
    const to = (a, mau, lw) => {
      if (mau) { a.fillStyle = mau; a.fill(); }
      if (lw) { a.lineWidth = lw; a.strokeStyle = MUC; a.lineJoin = 'round'; a.stroke(); }
    };

    /* đường cong trơn đi qua các điểm mốc */
    const spl = (K, n) => {
      const P = [], pt = i => K[clamp(i, 0, K.length - 1)];
      for (let s = 0; s < K.length - 1; s++) {
        const A = pt(s - 1), B = pt(s), C = pt(s + 1), D = pt(s + 2);
        for (let i = 0; i < n; i++) {
          const u = i / n, u2 = u * u, u3 = u2 * u;
          P.push([
            .5 * (2 * B[0] + (C[0] - A[0]) * u + (2 * A[0] - 5 * B[0] + 4 * C[0] - D[0]) * u2
                 + (3 * B[0] - A[0] - 3 * C[0] + D[0]) * u3),
            .5 * (2 * B[1] + (C[1] - A[1]) * u + (2 * A[1] - 5 * B[1] + 4 * C[1] - D[1]) * u2
                 + (3 * B[1] - A[1] - 3 * C[1] + D[1]) * u3)]);
        }
      }
      P.push(K[K.length - 1]);
      return P;
    };

    const phapTuyen = P => {
      const n = P.length, N = [];
      for (let i = 0; i < n; i++) {
        const A = P[Math.max(0, i - 1)], B = P[Math.min(n - 1, i + 1)];
        const tx = B[0] - A[0], ty = B[1] - A[1];
        const d = Math.hypot(tx, ty) || 1;
        N.push([-ty / d, tx / d]);
      }
      return N;
    };

    const dai = (a, P, N, wf, k, sh) => {
      const n = P.length, A = [], B = [];
      for (let i = 0; i < n; i++) {
        const w = wf(i / (n - 1)), nx = N[i][0], ny = N[i][1];
        const cx = P[i][0] - nx * sh * w, cy = P[i][1] - ny * sh * w;
        A.push([cx + nx * w * k, cy + ny * w * k]);
        B.push([cx - nx * w * k, cy - ny * w * k]);
      }
      a.beginPath();
      A.forEach((q, i) => i ? a.lineTo(q[0], q[1]) : a.moveTo(q[0], q[1]));
      for (let i = n - 1; i >= 0; i--) a.lineTo(B[i][0], B[i][1]);
      a.closePath();
    };

    /* dải phẳng dọc một đường tâm */
    const net = (a, P, wf, mau, lw, sh) => {
      dai(a, P, phapTuyen(P), wf, 1, sh || 0);
      to(a, mau, lw);
    };

    const cung = (ax, ay, bx, by, bow, n) => {
      const mx = (ax + bx) / 2, my = (ay + by) / 2;
      const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 1;
      const cx = mx - dy / d * bow, cy = my + dx / d * bow, P = [];
      for (let i = 0; i <= n; i++) {
        const u = i / n, v = 1 - u;
        P.push([v * v * ax + 2 * v * u * cx + u * u * bx,
                v * v * ay + 2 * v * u * cy + u * u * by]);
      }
      return P;
    };

    /* ── vân lửa ──
       Một dải vót nhọn, càng về ngọn càng cuộn. Đỏ ngoài, vàng trong.
       Đây mới là thứ làm con vật thành linh thú chứ không phải con thú. */
    const DO = '#c62a18', CAM = '#ef9c1e', VANG = '#f3c84a';
    const lua = (a, x, y, ang, len, w, curl, lw) => {
      const N = 16, P = [];
      let px = x, py = y, g = ang;
      for (let i = 0; i <= N; i++) {
        P.push([px, py]);
        px += Math.cos(g) * len / N; py += Math.sin(g) * len / N;
        g += curl / N * (.3 + 1.8 * i / N);
      }
      const wf = u => w * Math.pow(1 - u, .8) * (.5 + .5 * Math.sin(Math.PI * Math.min(1, u * 3.2)));
      net(a, P, wf, DO, lw);
      net(a, P.slice(0, N - 2), u => wf(u * .82) * .5, CAM, 0, .42);
    };
    const chumLua = (a, x, y, ang, len, w, lw, n, mo) => {
      for (let i = 0; i < n; i++) {
        const u = n > 1 ? i / (n - 1) - .5 : 0;
        const dg = Math.sin(t * .5 + i * 1.7 + (mo || 0)) * .1;
        lua(a, x, y, ang + u * .95 + dg, len * (1 - Math.abs(u) * .4), w, 2.1 + u * .7, lw);
      }
    };

    /* ─── THANH LONG ───
       Mình xanh cuộn chữ S, bụng ngà, bờm và sừng vàng, bốn chân năm
       vuốt, vân lửa bốc ở mỗi khớp. */
    const LAM = '#1e42a6', LAM2 = '#2f63cf', NGA = '#f4ead4', KIM = '#e2a521';
    const veThanhLong = (a, s, waterY, k) => {
      const hep = W < 760;
      const S = Math.min(W, H) * (hep ? .135 : .175) * (.88 + .12 * k);
      const cx = W * (hep ? .58 : .695), cy = H * (hep ? .26 : .30) + (1 - k) * H * .05;
      const lw = .026;

      dat(a, cx, cy, S, () => {
        const song = Math.sin(t * .35) * .02;
        /* dáng chữ S: mốc nào cũng phải đi tới, không được vòng lại cắt
           qua khúc trước — cắt qua thì cả con rối thành một búi */
        const P = spl([[1.05, .52], [.62, .74], [.22, .54], [-.06, .18 + song],
                       [-.22, -.22], [-.54, -.44], [-.96, -.50]], 9);
        const wf = u => .008 + .076 * Math.sin(Math.PI * clamp(.06 + u * .82, 0, 1));
        const N = phapTuyen(P);
        const M = P.length - 1;
        const diem = f => P[Math.round(f * M)];
        const tt = f => N[Math.round(f * M)];

        /* vân lửa sau thân */
        [[.20, 1], [.42, -1], [.62, 1], [.80, -1]].forEach(q => {
          const d = diem(q[0]), nn = tt(q[0]);
          chumLua(a, d[0] + nn[0] * .1 * q[1], d[1] + nn[1] * .1 * q[1],
                  Math.atan2(nn[1] * q[1], nn[0] * q[1]), .40, .07, lw * .8, 3, q[0] * 5);
        });

        /* đuôi xoè */
        const dd = diem(0), dn = tt(0);
        for (let i = -1; i <= 1; i++)
          net(a, cung(dd[0], dd[1], dd[0] + .30 + i * .04, dd[1] - .10 + i * .22,
                      .06 * i, 10), u => .05 * (1 - u * .85), NGA, lw);

        net(a, P, wf, LAM, lw);                       // thân
        net(a, P, u => wf(u) * .42, NGA, lw * .7, .5); // bụng
        for (let i = 6; i < M - 8; i += 5) {           // đốt bụng
          const q = P[i], nn = N[i], w = wf(i / M);
          a.beginPath();
          a.moveTo(q[0] + nn[0] * w * .1, q[1] + nn[1] * w * .1);
          a.lineTo(q[0] + nn[0] * w * .92, q[1] + nn[1] * w * .92);
          a.lineWidth = lw * .6; a.strokeStyle = MUC; a.stroke();
        }
        a.beginPath();                                 // vây lưng
        for (let i = 4; i < M - 10; i += 4) {
          const q = P[i], nn = N[i], w = wf(i / M);
          const bx = q[0] - nn[0] * w * .8, by = q[1] - nn[1] * w * .8;
          const h = w * (1.5 + .4 * Math.sin(i));
          a.moveTo(bx - nn[1] * w * .7, by + nn[0] * w * .7);
          a.lineTo(bx - nn[0] * h, by - nn[1] * h);
          a.lineTo(bx + nn[1] * w * .7, by - nn[0] * w * .7);
        }
        a.closePath(); to(a, NGA, lw * .8);

        /* bốn chân, mỗi chân bốn vuốt */
        const chan = (f, sg, dai2) => {
          const d = diem(f), nn = tt(f), w = wf(f);
          const bx = d[0] + nn[0] * w * .6 * sg, by = d[1] + nn[1] * w * .6 * sg;
          const g0 = Math.atan2(nn[1] * sg, nn[0] * sg) + .5 * sg;
          const kx = bx + Math.cos(g0) * dai2, ky = by + Math.sin(g0) * dai2;
          const ex = kx + Math.cos(g0 + .9 * sg) * dai2 * .8,
                ey = ky + Math.sin(g0 + .9 * sg) * dai2 * .8;
          net(a, spl([[bx, by], [kx, ky], [ex, ey]], 8),
              u => w * (.62 - u * .30), LAM, lw);
          for (let c = -1.5; c <= 1.5; c++) {
            const g2 = g0 + .9 * sg + c * .42;
            a.beginPath();
            a.moveTo(ex, ey);
            a.quadraticCurveTo(ex + Math.cos(g2) * dai2 * .30, ey + Math.sin(g2) * dai2 * .30,
                               ex + Math.cos(g2 + .5 * sg) * dai2 * .44,
                               ey + Math.sin(g2 + .5 * sg) * dai2 * .44);
            a.lineWidth = lw * 1.5; a.strokeStyle = MUC; a.lineCap = 'round'; a.stroke();
            a.lineWidth = lw * .7; a.strokeStyle = KIM; a.stroke();
          }
          chumLua(a, bx, by, g0 - 2.2 * sg, .30, .05, lw * .7, 2, f * 9);
        };
        chan(.30, 1, .24); chan(.40, -1, .22); chan(.72, 1, .26); chan(.83, -1, .23);

        /* đầu */
        const hd = diem(1), hn = tt(1);
        const gh = Math.atan2(hd[1] - diem(.94)[1], hd[0] - diem(.94)[0]);
        a.save(); a.translate(hd[0], hd[1]); a.rotate(gh);
        const r = .17;
        for (let i = 0; i < 4; i++) {                  // bờm
          const u = i / 3;
          net(a, cung(-r * .3, -r * .1 + u * r * .8, -r * (1.5 + u * .8),
                      -r * (1.4 - u * 2.1), r * .55, 10),
              uu => r * .22 * (1 - uu * .8), DO, lw * .6);
        }
        [0, 1].forEach(i =>                            // sừng
          net(a, cung(-r * .1, -r * (.5 - i * .3), -r * (1.5 + i * .4), -r * (1.5 - i * .35),
                      r * .4, 10), u => r * .17 * (1 - u * .8), KIM, lw * .6));
        a.beginPath();                                 // sọ
        a.moveTo(r * 1.9, r * .1);
        a.quadraticCurveTo(r * .7, -r * 1.05, -r * .9, -r * .7);
        a.quadraticCurveTo(-r * 1.5, 0, -r * .85, r * .72);
        a.quadraticCurveTo(r * .4, r * .95, r * 1.9, r * .1);
        a.closePath(); to(a, LAM, lw);
        a.beginPath();                                 // hàm dưới
        a.moveTo(r * 1.8, r * .22);
        a.quadraticCurveTo(r * .5, r * 1.15, -r * .55, r * .68);
        a.quadraticCurveTo(r * .4, r * .5, r * 1.8, r * .22);
        a.closePath(); to(a, NGA, lw);
        for (let i = 0; i < 3; i++) {                  // răng
          a.beginPath();
          a.moveTo(r * (1.26 - i * .30), r * .12);
          a.lineTo(r * (1.18 - i * .30), r * .30);
          a.lineTo(r * (1.10 - i * .30), r * .12);
          a.closePath(); to(a, NGA, lw * .5);
        }
        a.beginPath(); a.arc(r * .45, -r * .32, r * .22, 0, 6.2832);
        to(a, VANG, lw * .8);
        a.beginPath(); a.ellipse(r * .5, -r * .32, r * .07, r * .16, 0, 0, 6.2832);
        to(a, MUC, 0);
        [-1, 1].forEach(sg => net(a,                   // râu
          cung(r * 1.5, r * .1 * sg, -r * 1.5, r * (1.5 * sg + Math.sin(t * .7 + sg) * .4),
               r * .6 * sg, 12), u => r * .08 * (1 - u * .9), NGA, lw * .6));
        a.restore();

        /* ngọc châu */
        const px = hd[0] + Math.cos(gh) * .52, py = hd[1] + Math.sin(gh) * .52;
        chumLua(a, px, py, gh - 2.6, .26, .05, lw * .7, 5, 3);
        a.beginPath(); a.arc(px, py, .085, 0, 6.2832); to(a, VANG, lw);
        a.beginPath(); a.arc(px - .028, py - .028, .03, 0, 6.2832); to(a, '#fff8e0', 0);
      });
    };

    /* ─── BẠCH HỔ ───
       Chồm tới, đầu ngoái lại, vằn mực, vân lửa ở bốn khớp. */
    const NGAT = '#fbf6ea', NGAT2 = '#e6dcc6';
    const veBachHo = (a, s, waterY, k) => {
      const hep = W < 760;
      const S = Math.min(W, H) * (hep ? .125 : .165) * (.88 + .12 * k);
      const cx = W * (hep ? .60 : .73);
      const cy = (hep ? H * .28 : waterY - S * 1.02) + (1 - k) * H * .04;
      const lw = .028;

      dat(a, cx, cy, S, () => {
        const th = Math.sin(t * .4) * .015;
        const SP = spl([[.96, .30], [.62, -.02], [.10, -.20 + th], [-.42, -.06], [-.72, .10]], 9);
        const wfb = u => .10 + .20 * Math.sin(Math.PI * clamp(.14 + u * .74, 0, 1));
        const M = SP.length - 1;
        const diem = f => SP[Math.round(f * M)];

        /* vân lửa sau mình */
        [[.16, -.6], [.34, 1.9], [.66, 1.2], [.86, 2.5]].forEach((q, i) =>
          chumLua(a, diem(q[0])[0], diem(q[0])[1] + .2, q[1], .58, .10, lw * .6, 3, i * 4));

        /* đuôi */
        net(a, spl([[.92, .26], [1.22, -.06], [1.16, -.52], [.86, -.72]], 8),
            u => .075 * (1 - u * .6), NGAT, lw);

        const chan = (K, w0) => { net(a, spl(K, 8), u => w0 * (1 - u * .42), NGAT, lw);
          const e = K[K.length - 1];
          a.beginPath(); a.ellipse(e[0], e[1], w0 * 1.15, w0 * .62, 0, 0, 6.2832); to(a, NGAT, lw);
          for (let c = -1; c <= 1; c++) {
            a.beginPath();
            a.moveTo(e[0] + c * w0 * .6, e[1] + w0 * .3);
            a.quadraticCurveTo(e[0] + c * w0 * .9, e[1] + w0 * .75,
                               e[0] + c * w0 * 1.1 - w0 * .2, e[1] + w0 * .85);
            a.lineWidth = lw * 1.4; a.strokeStyle = MUC; a.lineCap = 'round'; a.stroke();
            a.lineWidth = lw * .6; a.strokeStyle = KIM; a.stroke();
          }
        };
        chan([[.76, .18], [.92, .52], [.72, .84]], .085);       // sau, xa
        chan([[-.34, .06], [-.16, .44], [-.38, .76]], .075);    // trước, xa

        dai(a, SP, phapTuyen(SP), wfb, 1, 0);                   // mình
        to(a, NGAT, lw);

        a.save();                                               // vằn
        dai(a, SP, phapTuyen(SP), wfb, 1, 0); a.clip();
        for (let j = 0; j < 9; j++) {
          const u = .06 + j * .105, d = diem(u), w = wfb(u);
          const ngh = (frac(j * 5.7 + 1.1) - .5) * .30;
          net(a, cung(d[0] + ngh, d[1] - w * 1.4, d[0] - ngh * .4,
                      d[1] + w * (.3 + frac(j * 3.1) * .9), .06 * (j % 2 ? 1 : -1), 10),
              uu => (.05 - .046 * uu) * (j % 2 ? 1 : .8), MUC, 0);
        }
        a.restore();

        chan([[.66, .22], [.86, .60], [.62, .92]], .10);        // sau, gần
        chan([[-.26, .10], [-.06, .50], [-.30, .86]], .09);     // trước, gần

        /* đầu ngoái lại */
        a.save(); a.translate(-.72, .04); a.rotate(-.22);
        const r = .32;
        [-1, 1].forEach(sg => {                                 // tai
          a.beginPath();
          a.moveTo(sg * r * .46 - r * .12, -r * .62);
          a.quadraticCurveTo(sg * r * .72 - r * .2, -r * 1.26, sg * r * .86 + r * .04, -r * .52);
          a.closePath(); to(a, NGAT, lw);
        });
        for (let j = 0; j < 7; j++) {                           // lông má
          const g = 2.0 + j / 6 * 2.1;
          a.beginPath();
          a.moveTo(Math.cos(g - .2) * r * .92, Math.sin(g - .2) * r * .82);
          a.lineTo(Math.cos(g) * r * 1.28, Math.sin(g) * r * 1.12);
          a.lineTo(Math.cos(g + .2) * r * .92, Math.sin(g + .2) * r * .82);
          a.closePath(); to(a, NGAT, lw * .7);
        }
        a.beginPath(); a.ellipse(0, 0, r, r * .88, 0, 0, 6.2832); to(a, NGAT, lw);
        a.beginPath(); a.ellipse(-r * .1, r * .34, r * .5, r * .3, 0, 0, 6.2832);
        to(a, NGAT2, lw * .7);
        for (let j = -1; j <= 1; j++) {                         // vằn trán
          a.beginPath();
          a.moveTo(j * r * .3, -r * .82);
          a.quadraticCurveTo(j * r * .34 + r * .04, -r * .44, j * r * .2, -r * .2);
          a.strokeStyle = MUC; a.lineWidth = r * .12; a.lineCap = 'round'; a.stroke();
        }
        [-1, 1].forEach(sg => {                                 // mắt
          a.save(); a.translate(sg * r * .34, -r * .1); a.rotate(sg * .12);
          a.beginPath();
          a.moveTo(-r * .24, 0);
          a.quadraticCurveTo(0, -r * .17, r * .24, -r * .04);
          a.quadraticCurveTo(0, r * .14, -r * .24, 0);
          a.closePath(); to(a, VANG, lw * .7);
          a.beginPath(); a.ellipse(0, 0, r * .06, r * .1, 0, 0, 6.2832); to(a, MUC, 0);
          a.restore();
        });
        a.beginPath();                                          // mũi
        a.moveTo(-r * .16, r * .18); a.lineTo(r * .16, r * .18); a.lineTo(0, r * .36);
        a.closePath(); to(a, DO, lw * .7);
        a.beginPath();                                          // mõm
        a.moveTo(0, r * .36); a.lineTo(0, r * .52);
        a.moveTo(0, r * .52); a.quadraticCurveTo(-r * .22, r * .66, -r * .34, r * .5);
        a.moveTo(0, r * .52); a.quadraticCurveTo(r * .22, r * .66, r * .34, r * .5);
        a.strokeStyle = MUC; a.lineWidth = lw * 1.1; a.stroke();
        a.restore();
      });
    };

    /* ─── CHU TƯỚC ───
       Cánh giương, đuôi buông năm dải, lông ngọn cháy vàng. */
    const veChuTuoc = (a, s, waterY, k) => {
      const hep = W < 760;
      const S = Math.min(W, H) * (hep ? .13 : .175) * (.88 + .12 * k);
      const cx = W * (hep ? .62 : .765), cy = H * (hep ? .25 : .275) + (1 - k) * H * .05;
      const lw = .026;

      dat(a, cx, cy, S, () => {
        const vo = Math.sin(t * .33);

        for (let j = 0; j < 5; j++) {                  // đuôi
          const u = j / 4;
          const g = 2.62 + u * .62 + Math.sin(t * .24 + j) * .04;
          const L = 1.25 + u * .45;
          const ex = Math.cos(g) * L, ey = .30 + Math.sin(g) * L * .72;
          const Pt = cung(-.1, .34, ex, ey, .42 - u * .5, 14);
          net(a, Pt, uu => .075 * (1 - uu * .55), j % 2 ? DO : CAM, lw);
          const T = Pt[Pt.length - 1];
          a.beginPath(); a.ellipse(T[0], T[1], .13, .085, g, 0, 6.2832);
          to(a, VANG, lw);
          a.beginPath(); a.arc(T[0], T[1], .04, 0, 6.2832); to(a, DO, 0);
        }

        const canh = sg => {                           // cánh
          for (let j = 0; j < 7; j++) {
            const u = j / 6;
            const th = sg * (.22 + u * 1.22 + vo * .13);
            const L = 1.12 - u * .42;
            net(a, cung(sg * .12, -.06, sg * .12 + Math.sin(th) * L, -.06 - Math.cos(th) * L,
                        (.14 + u * .18) * sg, 12),
                uu => (.11 - u * .034) * (1 - uu * .62),
                j % 2 ? DO : CAM, lw);
          }
        };
        a.save(); a.globalAlpha *= .8; canh(-1); a.restore();

        a.beginPath();                                 // thân
        a.ellipse(0, .06, .26, .42, -.2, 0, 6.2832); to(a, DO, lw);
        net(a, cung(.06, -.22, .20, -.64, .07, 10), u => .13 - u * .05, DO, lw);

        const hx = .22, hy = -.70;                     // đầu và mào
        for (let j = 0; j < 3; j++)
          net(a, cung(hx - .05, hy - .07, hx - (.16 + j * .1), hy - (.42 - j * .09), .07, 10),
              u => .034 * (1 - u * .8), j % 2 ? CAM : VANG, lw * .8);
        a.beginPath(); a.ellipse(hx, hy, .145, .12, -.3, 0, 6.2832); to(a, DO, lw);
        a.beginPath();
        a.moveTo(hx + .12, hy - .02); a.lineTo(hx + .34, hy + .04); a.lineTo(hx + .11, hy + .07);
        a.closePath(); to(a, KIM, lw);
        a.beginPath(); a.arc(hx + .05, hy - .035, .028, 0, 6.2832); to(a, VANG, lw * .7);
        a.beginPath(); a.arc(hx + .055, hy - .035, .011, 0, 6.2832); to(a, MUC, 0);

        net(a, spl([[-.02, .44], [.04, .70], [-.06, .92]], 8), u => .035 - u * .012, KIM, lw * .8);
        for (let c = -1; c <= 1; c++) {                // vuốt
          a.beginPath();
          a.moveTo(-.06, .92);
          a.quadraticCurveTo(-.06 + c * .11, 1.0, -.10 + c * .17, 1.04);
          a.strokeStyle = MUC; a.lineWidth = lw * 1.3; a.lineCap = 'round'; a.stroke();
          a.lineWidth = lw * .55; a.strokeStyle = KIM; a.stroke();
        }
        canh(1);
      });
    };

    /* ─── HUYỀN VŨ ───
       Rùa mai lục giác, rắn cuộn một vòng lớn qua trên lưng, hai đầu
       ngoái lại nhìn nhau. */
    const MAI = '#3d4034', MAI2 = '#7a7a54', DA = '#565744', RANT = '#2b2c26';
    const veHuyenVu = (a, s, waterY, k) => {
      const hep = W < 760;
      const S = Math.min(W, H) * (hep ? .125 : .165) * (.88 + .12 * k);
      const cx = W * (hep ? .62 : .745);
      const cy = (hep ? H * .26 : waterY - S * .78) + Math.sin(t * .15) * H * .006;
      const lw = .028;

      dat(a, cx, cy, S, () => {
        /* rắn: vòng lớn vắt qua trên mai, đầu chúc xuống bên trái */
        const RS = spl([[.72, .18], [.94, -.24], [.56, -.58], [.00, -.66],
                        [-.50, -.54], [-.76, -.34], [-.70, -.06]], 10);
        const rwf = u => .014 + .070 * Math.sin(Math.PI * clamp(.06 + u * .8, 0, 1));
        net(a, RS, rwf, RANT, lw);
        net(a, RS, u => rwf(u) * .34, NGA, lw * .5, -.5);
        const H1 = RS[RS.length - 1], H0 = RS[RS.length - 3];
        const gh = Math.atan2(H1[1] - H0[1], H1[0] - H0[0]);
        a.save(); a.translate(H1[0], H1[1]); a.rotate(gh);
        const rr = .11;
        a.beginPath();
        a.moveTo(rr * 1.6, 0);
        a.quadraticCurveTo(rr * .5, -rr, -rr * .9, -rr * .6);
        a.quadraticCurveTo(-rr * 1.3, 0, -rr * .9, rr * .6);
        a.quadraticCurveTo(rr * .5, rr, rr * 1.6, 0);
        a.closePath(); to(a, RANT, lw);
        a.beginPath(); a.arc(rr * .4, -rr * .3, rr * .22, 0, 6.2832); to(a, VANG, lw * .7);
        a.beginPath(); a.arc(rr * .44, -rr * .3, rr * .09, 0, 6.2832); to(a, MUC, 0);
        a.beginPath();
        a.moveTo(rr * 1.55, 0); a.lineTo(rr * 2.6, -rr * .3);
        a.moveTo(rr * 1.55, 0); a.lineTo(rr * 2.6, rr * .3);
        a.strokeStyle = DO; a.lineWidth = lw * .9; a.lineCap = 'round'; a.stroke();
        a.restore();

        /* bốn chân */
        [[-.62, .26, -1], [-.26, .40, -1], [.26, .40, 1], [.62, .26, 1]].forEach(c => {
          net(a, spl([[c[0], c[1]], [c[0] + c[2] * .20, c[1] + .26],
                      [c[0] + c[2] * .34, c[1] + .44]], 8),
              u => .11 * (1 - u * .32), DA, lw);
          for (let q = -1; q <= 1; q++) {
            a.beginPath();
            a.moveTo(c[0] + c[2] * .32 + q * .05, c[1] + .46);
            a.quadraticCurveTo(c[0] + c[2] * .40 + q * .07, c[1] + .58,
                               c[0] + c[2] * .48 + q * .08, c[1] + .60);
            a.strokeStyle = MUC; a.lineWidth = lw * 1.4; a.lineCap = 'round'; a.stroke();
            a.lineWidth = lw * .55; a.strokeStyle = NGA; a.stroke();
          }
        });

        /* đầu rùa */
        a.save(); a.translate(-.88, .16); a.rotate(-.3);
        net(a, spl([[.42, .04], [.12, -.02], [-.20, -.10]], 8), u => .12 - u * .03, DA, lw);
        a.beginPath(); a.ellipse(-.26, -.12, .18, .14, -.2, 0, 6.2832); to(a, DA, lw);
        a.beginPath(); a.arc(-.30, -.16, .045, 0, 6.2832); to(a, VANG, lw * .6);
        a.beginPath(); a.arc(-.31, -.16, .018, 0, 6.2832); to(a, MUC, 0);
        a.restore();

        /* mai */
        a.beginPath(); a.ellipse(0, 0, .78, .50, 0, 0, 6.2832); to(a, MAI, lw * 1.3);
        a.save();
        a.beginPath(); a.ellipse(0, 0, .78, .50, 0, 0, 6.2832); a.clip();
        const hr = .19;
        for (let r0 = -3; r0 <= 3; r0++) for (let c0 = -5; c0 <= 5; c0++) {
          const ox2 = c0 * hr * 1.5, oy2 = r0 * hr * 1.732 + (Math.abs(c0 % 2) ? hr * .866 : 0);
          a.beginPath();
          for (let i = 0; i < 6; i++) {
            const g = i / 6 * 6.2832;
            const x2 = ox2 + Math.cos(g) * hr * .88, y2 = oy2 + Math.sin(g) * hr * .88 * .72;
            i ? a.lineTo(x2, y2) : a.moveTo(x2, y2);
          }
          a.closePath();
          to(a, (r0 + c0) % 2 ? MAI2 : '#5e5f42', lw * .8);
        }
        a.restore();
        a.beginPath(); a.ellipse(0, 0, .78, .50, 0, 0, 6.2832); to(a, 0, lw * 1.3);
        a.beginPath(); a.ellipse(0, .30, .80, .26, 0, 0, Math.PI);   // yếm
        to(a, DA, lw);
      });
    };

    const LINH = [veHuyenVu, veThanhLong, veChuTuoc, veBachHo];
    const MOC = [[0, .26], [1 / 3, .22], [2 / 3, .22], [1, .26]];

    const vongTT = () => ({
      cx: W * .5,
      cy: H * (.50 - .19 * p),
      R: Math.min(W, H) * (.29 - .105 * p)
    });

    const drawLinhThu = (a, s, waterY) => {
      for (let i = 0; i < 4; i++) {
        const k = hien(MOC[i][0], MOC[i][1]);
        if (k < .015) continue;
        a.save();
        a.globalAlpha = clamp(k, 0, 1);
        a.lineCap = 'round';
        LINH[i](a, s, waterY, k);
        a.restore();
      }
    };

    /* ══ VÒNG TỨ TƯỢNG ══
       Vòng tròn lớn giữa cảnh, bốn linh thú đứng bốn phương quanh nó. Gồm
       một quầng mờ cho tách khỏi núi, hai vòng mảnh ngoài cùng, vành vạch
       chia và tám quẻ quay rất chậm, rồi trong cùng là vòng bút lông.

       Vòng bút lông: một dải khép kín rồi tô, không phải nhiều đoạn stroke
       nối nhau — nối kiểu đó đầu tròn chồng lên nhau thành từng đốt. Bề
       rộng phình ở đầu nét rồi vót dần về đuôi, bán kính rung nhẹ theo
       nhiễu nên vòng không tròn vành vạnh. Vẽ dần một lần lúc mới vào rồi
       đứng yên, và ở lại suốt bốn hồi chứ không tắt đi như trước. */
    const nhieuVong = fbm(613, 3);
    /* tám quẻ tiên thiên: bit 1 là hào liền, bit 0 là hào đứt */
    const QUE = [0b111, 0b110, 0b101, 0b100, 0b011, 0b010, 0b001, 0b000];
    let veTu = -1;
    const drawVong = (a, s) => {
      const g = vongTT();
      const cx = g.cx, cy = g.cy, R = g.R;
      const mo = 1;

      const qg = a.createRadialGradient(cx, cy, R * .2, cx, cy, R * 1.34);
      qg.addColorStop(0, rgba(lift(s.ink, .94), .30));
      qg.addColorStop(.72, rgba(lift(s.ink, .94), .20));
      qg.addColorStop(.94, rgba(lift(s.ink, .94), .07));
      qg.addColorStop(1, rgba(lift(s.ink, .94), 0));
      a.fillStyle = qg;
      a.beginPath(); a.arc(cx, cy, R * 1.34, 0, 6.2832); a.fill();

      a.save();
      a.lineCap = 'butt';
      a.lineWidth = Math.max(1, R * .005);
      const quay = t * .0055;

      [1.10, 1.22].forEach(f => {
        a.strokeStyle = rgba(s.ink, f > 1.15 ? .24 : .34);
        a.beginPath(); a.arc(cx, cy, R * f, 0, 6.2832); a.stroke();
      });
      for (let i = 0; i < 48; i++) {                 // vành vạch chia
        const b = i / 48 * 6.2832 + quay;
        const l = i % 4 === 0 ? .05 : .026;
        a.strokeStyle = rgba(s.ink, i % 4 === 0 ? .38 : .2);
        a.beginPath();
        a.moveTo(cx + Math.cos(b) * R * 1.10, cy + Math.sin(b) * R * 1.10);
        a.lineTo(cx + Math.cos(b) * R * (1.10 + l), cy + Math.sin(b) * R * (1.10 + l));
        a.stroke();
      }
      for (let i = 0; i < 8; i++) {                  // tám quẻ
        const b = i / 8 * 6.2832 - quay * 1.6;
        const q = QUE[i], len = R * .085;
        const ux = Math.cos(b), uy = Math.sin(b), px = -uy, py = ux;
        a.strokeStyle = rgba(s.ink, .42);
        a.lineWidth = Math.max(1, R * .0085);
        for (let j = 0; j < 3; j++) {
          const r = R * (1.125 + j * .028);
          const mx = cx + ux * r, my = cy + uy * r;
          if (q >> (2 - j) & 1) {
            a.beginPath();
            a.moveTo(mx - px * len, my - py * len);
            a.lineTo(mx + px * len, my + py * len);
            a.stroke();
          } else {
            [[-1, -.28], [.28, 1]].forEach(seg => {
              a.beginPath();
              a.moveTo(mx + px * len * seg[0], my + py * len * seg[0]);
              a.lineTo(mx + px * len * seg[1], my + py * len * seg[1]);
              a.stroke();
            });
          }
        }
      }
      a.restore();

      if (veTu < 0) veTu = t;
      const tien = clamp((t - veTu - .4) / 7, 0, 1);    // t tăng .055 mỗi khung
      if (tien <= 0) return;
      const ease = 1 - Math.pow(1 - tien, 3);

      const A0 = -Math.PI * .62, SWEEP = Math.PI * 2 * .90;
      const N = 130, het = Math.max(2, Math.round(N * ease));

      const ban = u => R * (1 + (nhieuVong(u * 4.5) - .5) * .05);
      /* đầu nét nhấn xuống, giữa giữ đều, đuôi vót nhọn */
      const rong = u => R * (.012 + .052 * Math.sin(Math.PI * Math.min(1, .12 + u * .9))
                                  + .014 * nhieuVong(u * 8 + 2))
                          * (1 - Math.pow(clamp((u - .55) / .45, 0, 1), 1.6) * .92);

      const ngoai = [], trong = [];
      for (let i = 0; i <= het; i++) {
        const u = i / N;
        const g = A0 + SWEEP * u, r = ban(u), w = Math.max(.4, rong(u));
        const c = Math.cos(g), si = Math.sin(g);
        ngoai.push([cx + c * (r + w), cy + si * (r + w)]);
        trong.push([cx + c * (r - w), cy + si * (r - w)]);
      }

      const dai = () => {
        a.beginPath();
        ngoai.forEach((q, i) => i ? a.lineTo(q[0], q[1]) : a.moveTo(q[0], q[1]));
        for (let i = trong.length - 1; i >= 0; i--) a.lineTo(trong[i][0], trong[i][1]);
        a.closePath();
      };

      /* hai lượt: một lượt loang nhạt cho mực thấm, một lượt đậm ở giữa */
      a.save();
      a.lineJoin = 'round';
      dai();
      a.fillStyle = rgba(s.ink, .10 * mo);
      a.strokeStyle = rgba(s.ink, .07 * mo);
      a.lineWidth = R * .045;
      a.stroke();
      a.fill();
      dai();
      a.fillStyle = rgba(s.ink, .26 * mo);
      a.fill();
      a.restore();
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

      /* các yếu tố xếp theo chiều sâu: mảnh mực lẫn trong tầng núi, gió vắt
         ngang trước núi, linh thú đứng trước cùng, tàn lửa bốc lên trên hết */
      drawVong(a, s);
      drawSon(a, s);
      drawPhong(a, s);
      drawLinhThu(a, s, waterY);
      drawHoa(a, s, waterY);

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

      drawThuy(ctx, s, waterY, wh);

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
