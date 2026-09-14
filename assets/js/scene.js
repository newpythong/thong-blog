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
       Bốn vị thay chỗ khối cầu. Huyền Vũ giữ vai chính, hiện từ hồi mở
       đầu; Thanh Long, Chu Tước, Bạch Hổ lần lượt hiện ra theo tiến độ
       cuộn, hai vị kề nhau chỉ chồng mép một quãng ngắn nên không lúc nào
       thấy hai con đè lên nhau. Tất cả vẽ vào canvas trên mặt nước nên
       đều tự có bóng soi.

       Thân dựng bằng "dải ống": tô một lượt tối suốt bề ngang, rồi chồng
       các lượt hẹp dần lệch về phía sáng, cuối cùng một vệt chói mảnh và
       một viền hắt ở mép tối. Bấy nhiêu đủ để một nét phẳng đọc ra khối
       tròn, mà rẻ hơn nhiều so với dựng hình thật. */

    const ha = (h, al) => rgba(hex(h), al);
    const pha = (a, b, u) => rgbHex(mixHex(a, b, clamp(u, 0, 1)));

    const hien = (c, w) => {
      const d = Math.abs(p - c) / w;
      if (d >= 1) return 0;
      const q = 1 - d * d;
      return q * q;
    };

    /* pháp tuyến tại từng điểm trên đường tâm */
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

    /* một dải dọc đường tâm: k phần bề ngang giữ lại, sh độ lệch về phía sáng */
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

    /* thân ống — c = [tối, giữa, sáng, chói, viền hắt] */
    const ong = (a, P, wf, c) => {
      const N = phapTuyen(P);
      a.lineJoin = 'round';
      dai(a, P, N, wf, 1, 0); a.fillStyle = c[0]; a.fill();
      if (c[4]) { dai(a, P, N, wf, .20, -.78); a.fillStyle = c[4]; a.fill(); }
      dai(a, P, N, wf, .80, .19); a.fillStyle = c[1]; a.fill();
      dai(a, P, N, wf, .44, .45); a.fillStyle = c[2]; a.fill();
      if (c[3]) { dai(a, P, N, wf, .13, .64); a.fillStyle = c[3]; a.fill(); }
    };

    /* cung bậc hai: từ A tới B, phình ra bow theo phương vuông góc */
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

    /* quầng nở — ai cũng cần một quầng để tách khỏi nền */
    const quang = (a, x, y, r, c1, a1, c2, a2) => {
      const g = a.createRadialGradient(x, y, r * .16, x, y, r);
      g.addColorStop(0, ha(c1, a1));
      g.addColorStop(.42, ha(c2, a2));
      g.addColorStop(1, ha(c2, 0));
      a.fillStyle = g;
      a.beginPath(); a.arc(x, y, r, 0, 6.2832); a.fill();
    };

    /* ─── HUYỀN VŨ ───
       Rắn quấn quanh mai rùa. Mai là một chỏm cầu chia ô giáp: mỗi ô tự
       nhận sáng theo pháp tuyến riêng của nó, nên khối nổi lên thật chứ
       không phải chỉ một vòng gradient. Rắn vòng ra sau mai rồi trở lại
       trước, ngóc đầu lên trên. */
    const veHuyenVu = (a, s, waterY, k, V) => {
      const hep = W < 760;
      const R = Math.min(W, H) * (hep ? .105 : .148) * (.88 + .12 * k);
      const Rx = R, Ry = R * .80;
      const ox = W * (hep ? .70 : .745);
      const oy = (hep ? H * .24 + R : waterY - R * .72) + Math.sin(t * .15) * H * .008;

      let lx = W * s.sunX - ox, ly = H * s.sunY - oy;
      const l2 = Math.max(1, Math.hypot(lx, ly));
      lx /= l2; ly /= l2;
      const l3 = Math.hypot(1, .78);
      const Lx = lx / l3, Ly = ly / l3, Lz = .78 / l3;

      /* mai ngả lục ngọc, rắn ngả tím — hai sắc phải cách nhau đủ xa thì
         mới đọc ra hai vật, cùng tông thì rắn chỉ còn là cái viền của mai */
      const TOI = '#151310', SANG = '#a07f3a', NGU = '#5d4a30';
      const RAN = [ha('#100e0c', .97), ha('#4c3f2d', .97), ha('#b39a68', .97),
                   ha('#f8ecc8', .9), ha('#d9b871', .5)];

      quang(a, ox, oy, R * 3, '#e6cf96', .2, '#8a6d33', .1);

      /* Đường tâm rắn gồm ba đoạn: chóp đuôi ló ra ở vai trái, vành đai
         quấn ngang mai, rồi cổ ngóc lên trước mai. Vành đai phải dẹt hơn
         mai — dẹt thì nửa trên chui vào trong bóng mai và bị mai che, mới
         ra cái quấn; bằng hoặc to hơn mai thì chỉ còn là cái vòng đeo
         quanh, không ai đọc ra con rắn. */
      const MD = 10, MC = 34, MN = 14, MT = MD + MC + MN;
      const DAI = 1.16, CAO = .55, HA = .25;          // bán trục và độ hạ của đai
      const gOf = u => Math.PI * (1.34 - 1.24 * u);
      const dOf = u => {
        const g = gOf(u), sw = Math.sin(t * .5 + u * 5) * R * .012;
        return [ox + Math.cos(g) * Rx * DAI + sw, oy + (HA + Math.sin(g) * CAO) * Ry + sw * .4];
      };

      const SP = [], SU = [];
      const d0 = dOf(0);
      const duoi = cung(ox - Rx * 1.10, oy - Ry * (.98 + Math.sin(t * .34) * .05),
                        d0[0], d0[1], -R * .30, MD);
      duoi.forEach((q, i) => { SP.push(q); SU.push(i / MT); });
      for (let i = 1; i <= MC; i++) { SP.push(dOf(i / MC)); SU.push((MD + i) / MT); }
      const dn = SP[MD + MC];
      const co = cung(dn[0], dn[1], ox + Rx * .34,
                      oy - Ry * (1.30 + Math.sin(t * .3) * .05), R * .40, MN);
      for (let i = 1; i <= MN; i++) { SP.push(co[i]); SU.push((MD + MC + i) / MT); }

      const swf = u => R * (.006 + .118 * Math.sin(Math.PI * clamp(.02 + u * .84, 0, 1)));
      const khuc = (i0, i1) => ong(a, SP.slice(i0, i1 + 1),
        lu => swf(SU[i0] + lu * (SU[i1] - SU[i0])), RAN);

      /* cắt đúng chỗ đai đi qua mép trái của mai — từ đó trở đi là nửa trước */
      const cat = MD + Math.round(MC * .274);
      khuc(0, cat);                                   // đuôi và nửa khuất sau mai

      /* bốn chân — vẽ trước mai để mai đè lên gốc chân */
      const CHAN = [[-.78, .26, .82], [-.40, .48, .66], [.40, .48, .66], [.78, .26, .82]];
      CHAN.forEach(c => {
        const sg = Math.sign(c[0]);
        const bx0 = ox + c[0] * Rx * .82, by0 = oy + c[1] * Ry;
        const ex0 = bx0 + sg * Rx * .30 * c[2], ey0 = by0 + Ry * .46 * c[2];
        ong(a, cung(bx0, by0, ex0, ey0, Rx * .08 * sg, 10),
            u => Rx * .21 * c[2] * (1 - u * .28),
            [ha('#0c0b0a', .97), ha('#2e2719', .97), ha('#6f5c3a', .97), ha('#c9b283', .5), 0]);
        for (let q = -1; q <= 1; q++) {               // ba móng
          a.beginPath();
          a.moveTo(ex0 + q * Rx * .07 * c[2] + sg * Rx * .05, ey0 + Ry * .06);
          a.quadraticCurveTo(ex0 + q * Rx * .09 * c[2] + sg * Rx * .12, ey0 + Ry * .14,
                             ex0 + q * Rx * .10 * c[2] + sg * Rx * .17, ey0 + Ry * .17);
          a.strokeStyle = ha('#e8d2a0', .9);
          a.lineWidth = Math.max(1.2, Rx * .022); a.lineCap = 'round'; a.stroke();
        }
      });

      /* ── mai rùa ── */
      const pt3 = (u, v) => {
        const f = Math.sin(v * 1.5708);
        return [ox + Math.cos(u) * f * Rx, oy + Math.sin(u) * f * Ry];
      };
      const sacO = (uc, vc) => {
        const ph = vc * 1.5708;
        const nx = Math.cos(uc) * Math.sin(ph), ny = Math.sin(uc) * Math.sin(ph), nz = Math.cos(ph);
        const lam = clamp(nx * Lx + ny * Ly + nz * Lz, 0, 1);
        return [pha(pha(TOI, SANG, Math.pow(lam, 1.3)), NGU, Math.pow(1 - nz, 2.4) * .5), lam];
      };

      a.save();
      a.beginPath(); a.ellipse(ox, oy, Rx, Ry, 0, 0, 6.2832); a.clip();

      const nen = a.createRadialGradient(ox + Lx * Rx * .5, oy + Ly * Ry * .5, R * .05,
                                         ox, oy, R * 1.08);
      nen.addColorStop(0, ha('#6b5528', .98));
      nen.addColorStop(.55, ha('#2b2419', .98));
      nen.addColorStop(1, ha(TOI, .98));
      a.fillStyle = nen; a.fillRect(ox - Rx, oy - Ry, Rx * 2, Ry * 2);

      const K = 8;
      /* v tính ngược từ bán kính trên màn: chia đều theo góc cực thì ô giữa
         phình ra như mâm xe còn vành ngoài mỏng dính */
      const vOf = r => Math.asin(clamp(r, 0, 1)) / 1.5708;

      /* ô đỉnh — sáu cạnh, để cả mai đọc ra hình lục giác */
      const dinh = sacO(0, .10);
      a.beginPath();
      for (let q = 0; q < 6; q++) {
        const P0 = pt3(q / 6 * 6.2832 + .52, vOf(.33));
        q ? a.lineTo(P0[0], P0[1]) : a.moveTo(P0[0], P0[1]);
      }
      a.closePath();
      a.fillStyle = ha(dinh[0], .97); a.fill();

      const VONG = [[vOf(.355), vOf(.70), 6, .5], [vOf(.72), 1, 13, 0]];
      VONG.forEach(v => {
        const v0 = v[0], v1 = v[1], n = v[2], off = v[3];
        const du = 6.2832 / n, iv = (v1 - v0) * .09, iu = du * .07;
        for (let j = 0; j < n; j++) {
          const u0 = (j + off) * du + iu, u1 = (j + 1 + off) * du - iu;
          const a0 = v0 + iv, a1 = v1 - iv;
          const r = sacO((u0 + u1) * .5, (a0 + a1) * .5);
          r[0] = pha(r[0], '#ffffff', (frac(j * 3.7 + v0 * 11) - .5) * .14);
          a.beginPath();
          for (let q = 0; q <= K; q++) { const P0 = pt3(mix(u0, u1, q / K), a0); q ? a.lineTo(P0[0], P0[1]) : a.moveTo(P0[0], P0[1]); }
          for (let q = 1; q <= K; q++) { const P0 = pt3(u1, mix(a0, a1, q / K)); a.lineTo(P0[0], P0[1]); }
          for (let q = K - 1; q >= 0; q--) { const P0 = pt3(mix(u0, u1, q / K), a1); a.lineTo(P0[0], P0[1]); }
          for (let q = K - 1; q >= 1; q--) { const P0 = pt3(u0, mix(a0, a1, q / K)); a.lineTo(P0[0], P0[1]); }
          a.closePath();
          a.fillStyle = ha(r[0], .97); a.fill();
          if (r[1] > .55) {
            a.strokeStyle = rgba(lift(hex(r[0]), .55), (r[1] - .55) * .8);
            a.lineWidth = Math.max(.6, R * .007); a.stroke();
          }
        }
      });

      /* viền hắt sáng ở rìa tối, ánh nước dội lên đáy mai */
      const rim = a.createRadialGradient(ox - Lx * Rx * .7, oy - Ly * Ry * .7, R * .3,
                                         ox - Lx * Rx * .7, oy - Ly * Ry * .7, R * 1.3);
      rim.addColorStop(0, ha(NGU, 0));
      rim.addColorStop(.70, ha(NGU, 0));
      rim.addColorStop(.92, ha('#e8cf8e', .42));
      rim.addColorStop(1, ha(NGU, .22));
      a.fillStyle = rim; a.fillRect(ox - Rx, oy - Ry, Rx * 2, Ry * 2);

      const bx = ox - Lx * Rx * .3, by = oy + Ry * .8;
      const doi = a.createRadialGradient(bx, by, 0, bx, by, R * .95);
      doi.addColorStop(0, rgba(lift(s.water[3], .2), .30));
      doi.addColorStop(1, rgba(s.water[1], 0));
      a.fillStyle = doi; a.fillRect(ox - Rx, oy - Ry, Rx * 2, Ry * 2);
      a.restore();

      /* chấm sáng phản chiếu trên lớp men */
      const hx0 = ox + Lx * Rx * .48, hy0 = oy + Ly * Ry * .48;
      const chm = a.createRadialGradient(hx0, hy0, 0, hx0, hy0, R * .42);
      chm.addColorStop(0, 'rgba(255,250,232,.5)');
      chm.addColorStop(.32, 'rgba(255,246,218,.16)');
      chm.addColorStop(1, 'rgba(255,246,218,0)');
      a.fillStyle = chm;
      a.beginPath(); a.arc(hx0, hy0, R * .42, 0, 6.2832); a.fill();
      a.fillStyle = 'rgba(255,252,240,.55)';
      a.beginPath(); a.ellipse(hx0, hy0, R * .062, R * .04, -.5, 0, 6.2832); a.fill();

      khuc(cat - 1, MT);                              // nửa trước, đè lên mai

      /* đầu rắn */
      const hX = SP[MT][0], hY = SP[MT][1];
      let tx = SP[MT][0] - SP[MT - 2][0], ty = SP[MT][1] - SP[MT - 2][1];
      const td = Math.hypot(tx, ty) || 1; tx /= td; ty /= td;
      const hr = R * .19;
      a.save();
      a.translate(hX + tx * hr * .3, hY + ty * hr * .3);
      a.rotate(Math.atan2(ty, tx));
      a.beginPath();
      a.moveTo(hr * 1.55, 0);
      a.quadraticCurveTo(hr * .5, -hr, -hr * .95, -hr * .6);
      a.quadraticCurveTo(-hr * 1.35, 0, -hr * .95, hr * .6);
      a.quadraticCurveTo(hr * .5, hr, hr * 1.55, 0);
      a.closePath();
      const hg = a.createLinearGradient(0, -hr, 0, hr);
      hg.addColorStop(0, ha('#c3a464', .97));
      hg.addColorStop(.5, ha('#3b3227', .97));
      hg.addColorStop(1, ha('#0c0b0a', .97));
      a.fillStyle = hg; a.fill();
      a.beginPath(); a.arc(hr * .45, -hr * .3, hr * .2, 0, 6.2832);
      a.fillStyle = ha('#ffe4a0', .95); a.fill();
      a.beginPath(); a.arc(hr * .49, -hr * .3, hr * .08, 0, 6.2832);
      a.fillStyle = 'rgba(8,12,22,.92)'; a.fill();
      a.beginPath();
      a.moveTo(hr * 1.5, 0); a.lineTo(hr * 2.5, -hr * .24);
      a.moveTo(hr * 1.5, 0); a.lineTo(hr * 2.5, hr * .26);
      a.strokeStyle = ha('#e0614a', .85);
      a.lineWidth = Math.max(1, hr * .12); a.lineCap = 'round'; a.stroke();
      a.restore();

      /* bóng đổ trên mặt nước */
      if (hep) return;
      const sh = a.createRadialGradient(ox, waterY, 0, ox, waterY, R * 1.7);
      sh.addColorStop(0, ha(TOI, .20));
      sh.addColorStop(1, ha(TOI, 0));
      a.fillStyle = sh;
      a.beginPath(); a.ellipse(ox, waterY, R * 1.7, R * .32, 0, 0, 6.2832); a.fill();
    };

    /* ─── THANH LONG ───
       Thân dài uốn ngang trời, vây chạy dọc sống lưng, vảy hắt sáng, râu
       bay về sau, ngọc châu cháy trước miệng. */
    const veThanhLong = (a, s, waterY, k, V) => {
      /* Thân không đi ngang trời nữa mà lượn quanh vòng: từ mé dưới bên
         trái vòng vòng lên qua đỉnh rồi ngóc đầu ra phương đông. Bán kính
         dập dềnh nên thân lúc lọt vào trong vòng lúc vắt ra ngoài. */
      const S = V.R * 2.15 * (.9 + .1 * k);
      const M = 62, P = [], U = [];
      const A0 = 2.95, SW = 3.16;
      for (let i = 0; i <= M; i++) {
        const u = i / M;
        const b = A0 + SW * u;
        const vuon = Math.pow(clamp((u - .84) / .16, 0, 1), 1.5);
        const rr = V.R * (1.08 + .17 * Math.sin(u * 6.2 + t * .22) - .05 * u + vuon * .42);
        P.push([V.cx + Math.cos(b) * rr, V.cy + Math.sin(b) * rr - vuon * V.R * .1]);
        U.push(u);
      }
      const wf = u => S * (.004 + .038 * Math.sin(Math.PI * clamp(.03 + u * .82, 0, 1)));
      const N = phapTuyen(P);

      const LUC = [ha('#05294a', .96), ha('#14649f', .96), ha('#4fc0ea', .96),
                   ha('#eaf9ff', .82), ha('#f4f0d8', .55)];
      const VANG = [ha('#4a3510', .95), ha('#9c7a2a', .95), ha('#f0d489', .95),
                    ha('#fffbe8', .8), 0];

      a.save();
      a.globalCompositeOperation = 'lighter';
      dai(a, P, N, wf, 3.2, 0); a.fillStyle = ha('#3fd0ff', .05); a.fill();
      dai(a, P, N, wf, 1.8, 0); a.fillStyle = ha('#7fe4ff', .045); a.fill();
      a.restore();

      /* vây lưng */
      a.beginPath();
      for (let i = 2; i < M - 5; i += 2) {
        const w = wf(U[i]), nx = N[i][0], ny = N[i][1];
        const bx = P[i][0] - nx * w * .75, by = P[i][1] - ny * w * .75;
        const hg = w * (1.15 + .3 * Math.sin(i * 1.7));
        a.moveTo(bx - ny * w * .85, by + nx * w * .85);
        a.lineTo(bx - nx * hg, by - ny * hg);
        a.lineTo(bx + ny * w * .85, by - nx * w * .85);
      }
      a.closePath();
      a.fillStyle = ha('#b8452c', .26); a.fill();

      /* vây đuôi */
      const tn = N[0];
      [-1, 1].forEach(sg => {
        a.beginPath();
        a.moveTo(P[2][0], P[2][1]);
        a.quadraticCurveTo(P[0][0] - S * .04 + tn[0] * S * .05 * sg,
                           P[0][1] + tn[1] * S * .05 * sg,
                           P[0][0] - S * .085 + tn[0] * S * .075 * sg,
                           P[0][1] + tn[1] * S * .075 * sg);
        a.quadraticCurveTo(P[0][0] - S * .02, P[0][1], P[2][0], P[2][1]);
        a.closePath();
        a.fillStyle = ha('#6fc8ea', .55); a.fill();
      });

      ong(a, P, wf, LUC);

      /* vảy */
      for (let i = 4; i < M - 4; i += 2) {
        const w = wf(U[i]), nx = N[i][0], ny = N[i][1];
        const r = w * .3;
        const cx = P[i][0] - nx * w * .42, cy = P[i][1] - ny * w * .42;
        a.beginPath();
        a.ellipse(cx, cy, r * 1.5, r * .8, Math.atan2(-nx, ny), 0, 6.2832);
        a.fillStyle = ha('#d8f3ff', .2 + .16 * Math.sin(t * .9 + i)); a.fill();
      }

      /* chân, ba vuốt */
      /* Bốn chân. Thân lượn vòng nên chân phải duỗi theo hướng ra ngoài
         tâm vòng; cứ đổ thẳng xuống thì nửa trên thân mọc chân ngược. */
      const chan = (fu, sgn) => {
        const i = Math.round(fu * M);
        const w = wf(U[i]), nx = N[i][0], ny = N[i][1];
        const bx = P[i][0] + nx * w * .45 * sgn, by2 = P[i][1] + ny * w * .45 * sgn;
        let dx = V.cx - bx, dy = V.cy - by2;
        const dd = Math.hypot(dx, dy) || 1; dx /= dd; dy /= dd;
        const L = S * .085;
        const ex = bx + dx * L, ey = by2 + dy * L;
        ong(a, cung(bx, by2, ex, ey, S * .022 * sgn, 10), u => w * (.68 - u * .34), LUC);
        for (let c = -1; c <= 1; c++) {               // ba móng
          const rx = dx * Math.cos(c * .5) - dy * Math.sin(c * .5);
          const ry = dx * Math.sin(c * .5) + dy * Math.cos(c * .5);
          a.beginPath();
          a.moveTo(ex, ey);
          a.quadraticCurveTo(ex + rx * S * .022, ey + ry * S * .022,
                             ex + rx * S * .034 - ry * S * .012,
                             ey + ry * S * .034 + rx * S * .012);
          a.strokeStyle = ha('#f2dda0', .85);
          a.lineWidth = Math.max(1, S * .006); a.lineCap = 'round'; a.stroke();
        }
      };
      chan(.44, -1); chan(.54, 1); chan(.78, -1); chan(.88, 1);

      /* đầu */
      const hX = P[M][0], hY = P[M][1];
      let tx = P[M][0] - P[M - 2][0], ty = P[M][1] - P[M - 2][1];
      const td = Math.hypot(tx, ty) || 1; tx /= td; ty /= td;
      const hr = S * .058;
      a.save();
      a.translate(hX, hY);
      a.rotate(Math.atan2(ty, tx));

      /* bờm */
      for (let j = 0; j < 4; j++) {
        const u = j / 3;
        ong(a, cung(-hr * .4, -hr * .35 + u * hr * .85,
                    -hr * (1.5 + u * .9), -hr * (1.25 - u * 1.5), hr * .55, 10),
            uu => hr * .17 * (1 - uu * .85), LUC);
      }
      /* sừng */
      [0, 1].forEach(j => ong(a,
        cung(-hr * .25, -hr * (.5 - j * .25), -hr * (1.5 + j * .35), -hr * (1.5 - j * .3), hr * .42, 10),
        u => hr * .13 * (1 - u * .88), VANG));
      /* sọ */
      a.beginPath();
      a.moveTo(hr * 1.85, hr * .14);
      a.quadraticCurveTo(hr * .8, -hr * 1.0, -hr * .9, -hr * .66);
      a.quadraticCurveTo(-hr * 1.45, 0, -hr * .85, hr * .7);
      a.quadraticCurveTo(hr * .4, hr * .95, hr * 1.85, hr * .14);
      a.closePath();
      const hgd = a.createLinearGradient(0, -hr, 0, hr);
      hgd.addColorStop(0, ha('#8fdcf5', .97));
      hgd.addColorStop(.5, ha('#14649f', .97));
      hgd.addColorStop(1, ha('#05294a', .97));
      a.fillStyle = hgd; a.fill();
      /* hàm dưới */
      a.beginPath();
      a.moveTo(hr * 1.8, hr * .2);
      a.quadraticCurveTo(hr * .5, hr * 1.05, -hr * .55, hr * .66);
      a.quadraticCurveTo(hr * .4, hr * .48, hr * 1.8, hr * .2);
      a.closePath();
      a.fillStyle = ha('#031c33', .9); a.fill();
      /* mắt */
      a.beginPath(); a.arc(hr * .48, -hr * .34, hr * .2, 0, 6.2832);
      a.fillStyle = ha('#fff0b0', .96); a.fill();
      a.beginPath(); a.ellipse(hr * .53, -hr * .34, hr * .06, hr * .14, 0, 0, 6.2832);
      a.fillStyle = 'rgba(4,20,18,.95)'; a.fill();
      /* râu */
      [-1, 1].forEach(sg => ong(a,
        cung(hr * 1.6, hr * .12 * sg, -hr * 2.6,
             hr * (1.5 * sg + Math.sin(t * .7 + sg) * .6), hr * .85 * sg, 14),
        u => hr * .085 * (1 - u * .92),
        [ha('#0a2d4a', .75), ha('#2f8fc4', .75), ha('#c8efff', .75), 0, 0]));
      a.restore();

      /* ngọc châu */
      const px = hX + tx * S * .15, py = hY + ty * S * .15 - S * .015;
      const pr = S * .028;
      a.save();
      a.globalCompositeOperation = 'lighter';
      quang(a, px, py, pr * 6, '#fff3c0', .45, '#ffb43a', .16);
      a.restore();
      const pg = a.createRadialGradient(px - pr * .3, py - pr * .35, 0, px, py, pr);
      pg.addColorStop(0, 'rgba(255,255,255,.98)');
      pg.addColorStop(.5, ha('#ffe08a', .95));
      pg.addColorStop(1, ha('#e07a18', .9));
      a.fillStyle = pg;
      a.beginPath(); a.arc(px, py, pr, 0, 6.2832); a.fill();
    };

    /* ─── CHU TƯỚC ───
       Chim lửa nhìn ngang: hai cánh xoè thành quạt lông, đuôi buông dài
       về sau, ngọn đuôi có đốm sáng. Quầng tô bằng phép cộng sáng nên chỗ
       lông chồng nhau cháy lên. */
    const veChuTuoc = (a, s, waterY, k, V) => {
      const hep = W < 760;
      const S = Math.min(W, H) * (hep ? .17 : .205) * (.86 + .14 * k);
      const cx = W * (hep ? .63 : .745);
      const cy = H * (hep ? .25 : .30) + (1 - k) * H * .04;
      const vo = Math.sin(t * .32);

      const sac = u => [
        ha(pha('#3a0505', '#7d0d06', u), .97),
        ha(pha('#b81c07', '#ef4a12', u), .97),
        ha(pha('#ff6e1e', '#ffc250', u), .97),
        ha('#fff3d0', .84), ha('#ff3a0f', .34)];

      a.save();
      a.globalCompositeOperation = 'lighter';
      quang(a, cx, cy, S * 2.4, '#ffb25a', .24, '#e02a08', .1);
      a.restore();

      /* cánh: xa trước, gần sau, để thân nằm giữa */
      const canh = sg => {
        const shx = cx + sg * S * .08, shy = cy - S * .06;
        for (let j = 0; j < 8; j++) {
          const u = j / 7;
          const th = sg * (.26 + u * 1.20 + vo * .14);
          const ln = S * (1.02 - u * .38);
          const ex = shx + Math.sin(th) * ln, ey = shy - Math.cos(th) * ln;
          ong(a, cung(shx, shy, ex, ey, S * (.13 + u * .16) * sg, 14),
              uu => S * (.088 - u * .042) * (1 - uu * .66), sac(u * .8 + .1));
        }
      };

      a.save(); a.globalAlpha *= .62; canh(-1); a.restore();

      /* đuôi — đổ chéo xuống sau, đủ dốc thì mới không nằm bẹp ở mé nước */
      for (let j = 0; j < 6; j++) {
        const u = j / 5;
        const ang = Math.PI * (.06 + u * .13) + Math.sin(t * .22 + j) * .025;
        const ln = S * (1.35 + u * .8);
        const bx = cx - S * .06, by2 = cy + S * .28;
        const ex = bx - Math.cos(ang) * ln, ey = by2 + Math.sin(ang) * ln;
        const Pt = cung(bx, by2, ex, ey, S * (.34 - u * .46), 16);
        ong(a, Pt, uu => S * .05 * (1 - uu * .62) * (1 - u * .2), sac(1 - u * .75));
        const tip = Pt[Pt.length - 1];
        a.save();
        a.globalCompositeOperation = 'lighter';
        quang(a, tip[0], tip[1], S * .26, '#fff0bc', .5, '#ff7a1a', .2);
        a.restore();
        a.beginPath(); a.ellipse(tip[0], tip[1], S * .05, S * .033, ang, 0, 6.2832);
        a.fillStyle = ha('#ffe9a8', .85); a.fill();
      }

      /* thân — gradient lệch về phía sáng, thêm viền hắt ở mé tối */
      const tg = a.createRadialGradient(cx + S * .07, cy - S * .12, S * .02,
                                        cx, cy + S * .04, S * .36);
      tg.addColorStop(0, ha('#fff0b4', .98));
      tg.addColorStop(.3, ha('#ffab2e', .98));
      tg.addColorStop(.66, ha('#d33c12', .98));
      tg.addColorStop(1, ha('#48060c', .98));
      a.save();
      a.beginPath(); a.ellipse(cx, cy + S * .04, S * .19, S * .32, -.22, 0, 6.2832);
      a.clip();
      a.fillStyle = tg; a.fillRect(cx - S * .3, cy - S * .34, S * .6, S * .74);
      const vg = a.createRadialGradient(cx - S * .12, cy + S * .2, S * .04,
                                        cx - S * .12, cy + S * .2, S * .3);
      vg.addColorStop(0, ha('#ff6a12', 0));
      vg.addColorStop(.68, ha('#ff6a12', 0));
      vg.addColorStop(1, ha('#ffb05a', .5));
      a.fillStyle = vg; a.fillRect(cx - S * .3, cy - S * .34, S * .6, S * .74);
      a.restore();

      /* cổ và đầu */
      ong(a, cung(cx + S * .05, cy - S * .16, cx + S * .14, cy - S * .46, S * .05, 12),
          u => S * (.10 - u * .035), sac(.75));
      const hx = cx + S * .15, hy = cy - S * .50;
      for (let j = 0; j < 3; j++)
        ong(a, cung(hx - S * .04, hy - S * .05, hx - S * (.12 + j * .08), hy - S * (.30 - j * .07),
                    S * .05, 10), u => S * .024 * (1 - u * .82), sac(.9));
      const hg = a.createRadialGradient(hx - S * .03, hy - S * .04, 0, hx, hy, S * .12);
      hg.addColorStop(0, 'rgba(255,250,220,.99)');
      hg.addColorStop(.5, ha('#ff9e2c', .97));
      hg.addColorStop(1, ha('#8d1a06', .97));
      a.fillStyle = hg;
      a.beginPath(); a.ellipse(hx, hy, S * .105, S * .088, -.3, 0, 6.2832); a.fill();
      a.beginPath();
      a.moveTo(hx + S * .09, hy - S * .012);
      a.lineTo(hx + S * .235, hy + S * .028);
      a.lineTo(hx + S * .085, hy + S * .05);
      a.closePath();
      a.fillStyle = ha('#ffcf5c', .96); a.fill();
      a.beginPath(); a.arc(hx + S * .038, hy - S * .024, S * .02, 0, 6.2832);
      a.fillStyle = 'rgba(30,6,2,.92)'; a.fill();
      a.beginPath(); a.arc(hx + S * .044, hy - S * .03, S * .0075, 0, 6.2832);
      a.fillStyle = 'rgba(255,245,220,.9)'; a.fill();

      canh(1);

      /* tàn lửa rơi khỏi đuôi */
      a.save();
      a.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 20; i++) {
        const r1 = frac(i * 7.31 + 3.3), r2 = frac(i * 2.19 + 8.7);
        const li = (t * (.07 + r2 * .1) + r1) % 1;
        const x = cx - S * (.3 + r1 * 1.6) + Math.sin(t * .8 + i) * S * .07;
        const y = cy + S * (.5 + r2 * 1.3) + li * S * 1.1;
        const al = (1 - li) * (1 - li) * (.4 + r2 * .4);
        a.beginPath(); a.arc(x, y, S * (.006 + r2 * .013) * (1 - li * .4), 0, 6.2832);
        a.fillStyle = ha('#ffb03a', al); a.fill();
      }
      a.restore();
    };

    /* ─── BẠCH HỔ ───
       Dáng rình: đầu hạ ngang vai, lưng gồ ở vai và ở mông. Đầu vẽ sau
       thân và đè lên ức nên dính liền vào mình — vẽ rời ra thì thành cái
       đầu lơ lửng. Thân là đường bao kín chứ không phải ống đều bề ngang;
       vằn cắt theo đường bao nên uốn đúng khối. */
    const veBachHo = (a, s, waterY, k, V) => {
      const hep = W < 760;
      const S = Math.min(W, H) * (hep ? .17 : .225) * (.88 + .12 * k);
      /* màn hẹp: lùi vào trong, không thì cái đuôi vắt ra ngoài mép phải */
      const cx = W * (hep ? .55 : .73);
      const gy = (hep ? H * .40 : waterY - H * .022) + (1 - k) * H * .03;
      const by = gy - S * .74;                        // đường sống lưng
      const xv = cx - S * .44, xm = cx + S * .54;     // ức → mông

      const TRANG = [ha('#7d6540', .97), ha('#eee4d0', .97), ha('#ffffff', .97),
                     ha('#ffffff', .75), ha('#edcb7e', .55)];
      const VAN = [ha('#100d0a', .94), ha('#1d1813', .94), ha('#3a3026', .82), 0, 0];

      quang(a, cx, by + S * .05, S * 2, '#f4e4bd', .22, '#b8913f', .1);

      /* đuôi */
      ong(a, cung(xm + S * .06, by + S * .10, xm + S * .70,
                  by - S * (.52 + Math.sin(t * .35) * .1), -S * .40, 18),
          u => S * .056 * (1 - u * .74), TRANG);

      const chan = (x0, x1, w0, bow, mo) => {
        a.save(); if (mo) a.globalAlpha *= .7;
        ong(a, cung(x0, by + S * .18, x1, gy - S * .03, bow, 14),
            u => S * w0 * (1 - u * .46), TRANG);
        a.beginPath();
        a.ellipse(x1, gy - S * .015, S * w0 * 1.05, S * .04, 0, 0, 6.2832);
        a.fillStyle = ha('#f6eee0', .96); a.fill();
        for (let c = -1; c <= 1; c++) {               // vuốt
          a.beginPath();
          a.moveTo(x1 + c * S * w0 * .7, gy - S * .02);
          a.quadraticCurveTo(x1 + c * S * w0 * .95, gy + S * .01,
                             x1 + c * S * w0 * 1.15 - S * .02, gy + S * .015);
          a.strokeStyle = ha('#d9bc7e', .8);
          a.lineWidth = Math.max(1, S * .008); a.lineCap = 'round'; a.stroke();
        }
        a.restore();
      };
      chan(xm - S * .20, xm - S * .10, .08, S * .08, 1);      // sau, xa
      chan(xv + S * .20, xv + S * .30, .07, -S * .06, 1);     // trước, xa

      /* khối mông và khối vai: thiếu hai khối này thân chỉ là một cái ống */
      const khoi = (x, y, rx, ry) => {
        const g = a.createRadialGradient(x - rx * .3, y - ry * .45, ry * .05, x, y, rx * 1.2);
        g.addColorStop(0, ha('#ffffff', .99));
        g.addColorStop(.5, ha('#f0e6d2', .99));
        g.addColorStop(1, ha('#7f6c48', .99));
        a.fillStyle = g;
        a.beginPath(); a.ellipse(x, y, rx, ry, 0, 0, 6.2832); a.fill();
      };
      khoi(xm - S * .06, by + S * .1, S * .3, S * .27);

      /* thân */
      const than = () => {
        a.beginPath();
        a.moveTo(xv - S * .04, by + S * .08);
        a.bezierCurveTo(xv + S * .02, by - S * .16, cx - S * .10, by - S * .20,
                        cx + S * .14, by - S * .15);
        a.bezierCurveTo(xm + S * .04, by - S * .12, xm + S * .20, by + S * .08,
                        xm + S * .10, by + S * .28);
        a.bezierCurveTo(xm - S * .06, by + S * .42, cx - S * .08, by + S * .40,
                        xv + S * .02, by + S * .32);
        a.bezierCurveTo(xv - S * .18, by + S * .28, xv - S * .20, by + S * .16,
                        xv - S * .04, by + S * .08);
        a.closePath();
      };
      than();
      const bg = a.createLinearGradient(0, by - S * .22, 0, by + S * .42);
      bg.addColorStop(0, ha('#ffffff', .99));
      bg.addColorStop(.44, ha('#f0e6d2', .99));
      bg.addColorStop(1, ha('#786547', .99));
      a.fillStyle = bg; a.fill();
      khoi(xv + S * .14, by + S * .04, S * .26, S * .24);

      /* vằn vót nhọn từ sống lưng đổ xuống, dài ngắn không đều — vằn chạy
         suốt bề cao và đều tăm tắp thì ra con ngựa vằn */
      a.save();
      than(); a.clip();
      for (let j = 0; j < 9; j++) {
        const u = j / 8;
        const x = mix(xv + S * .06, xm + S * .04, u);
        const ngh = S * (.10 + frac(j * 5.7 + 1.1) * .11);
        const bot = by + S * (.02 + frac(j * 3.1 + 4.2) * .22);
        const Pv = cung(x + ngh, by - S * .24, x - ngh * .35, bot,
                        S * .05 * (j % 2 ? 1 : -1), 10);
        ong(a, Pv, uu => S * (.044 - .039 * uu) * (j % 2 ? 1 : .82), VAN);
      }
      /* viền ngũ sắc: chỉ hắt ở sống lưng và mé bụng, không phủ cả thân */
      const ng = a.createLinearGradient(0, by - S * .24, 0, by - S * .02);
      ng.addColorStop(0, ha('#e8c579', .55));
      ng.addColorStop(1, ha('#e8c579', 0));
      a.fillStyle = ng; a.fillRect(xv - S * .3, by - S * .3, S * 1.7, S * .32);
      const ng2 = a.createLinearGradient(0, by + S * .14, 0, by + S * .42);
      ng2.addColorStop(0, ha('#c9a24a', 0));
      ng2.addColorStop(1, ha('#c9a24a', .45));
      a.fillStyle = ng2; a.fillRect(xv - S * .3, by + S * .1, S * 1.7, S * .36);
      a.restore();

      chan(xm - S * .08, xm + S * .06, .095, S * .09, 0);     // sau, gần
      chan(xv + S * .08, xv + S * .14, .085, -S * .07, 0);    // trước, gần

      /* đầu — hạ ngang vai, đè lên ức */
      const hx = xv - S * .28, hy = by + S * .06, hr = S * .27;
      [-1, 1].forEach(sg => {                                  // tai
        const ex = hx + sg * hr * .58 + hr * .18, ey = hy - hr * .84;
        a.beginPath();
        a.moveTo(ex - hr * .36, ey + hr * .2);
        a.quadraticCurveTo(ex - hr * .2, ey - hr * .78, ex + hr * .36, ey - hr * .26);
        a.quadraticCurveTo(ex + hr * .4, ey + hr * .22, ex - hr * .36, ey + hr * .2);
        a.closePath();
        a.fillStyle = ha('#f4ecdc', .97); a.fill();
        a.beginPath();
        a.moveTo(ex - hr * .2, ey + hr * .12);
        a.quadraticCurveTo(ex - hr * .08, ey - hr * .44, ex + hr * .21, ey - hr * .14);
        a.quadraticCurveTo(ex + hr * .22, ey + hr * .12, ex - hr * .2, ey + hr * .12);
        a.closePath();
        a.fillStyle = ha('#4a3a28', .62); a.fill();
      });
      /* lông má: một hàng túm nhọn chạy vòng mé dưới mặt. Má tròn vành
         vạnh thì ra con mèo, nên phải có chỗ gãy */
      for (let j = 0; j < 6; j++) {
        const ang = 2.05 + j / 5 * 1.85;              // từ dưới-trái vòng xuống dưới-phải
        const r0 = hr * .9, r1 = hr * (1.2 + .12 * Math.sin(j * 2.1));
        a.beginPath();
        a.moveTo(hx + Math.cos(ang - .22) * hr * 1.06, hy + Math.sin(ang - .22) * r0);
        a.lineTo(hx + Math.cos(ang) * hr * 1.32, hy + Math.sin(ang) * r1);
        a.lineTo(hx + Math.cos(ang + .22) * hr * 1.06, hy + Math.sin(ang + .22) * r0);
        a.closePath();
        a.fillStyle = ha('#f7f0e2', .95); a.fill();
      }
      const hgt = a.createRadialGradient(hx - hr * .3, hy - hr * .4, hr * .05, hx, hy, hr * 1.3);
      hgt.addColorStop(0, 'rgba(255,255,255,.99)');
      hgt.addColorStop(.5, ha('#f0e6d2', .99));
      hgt.addColorStop(1, ha('#7f6c48', .99));
      a.fillStyle = hgt;
      a.beginPath(); a.ellipse(hx, hy, hr * 1.14, hr * .92, 0, 0, 6.2832); a.fill();
      /* mõm, mũi */
      a.beginPath(); a.ellipse(hx - hr * .5, hy + hr * .34, hr * .44, hr * .32, -.16, 0, 6.2832);
      a.fillStyle = 'rgba(255,255,255,.97)'; a.fill();
      a.beginPath();
      a.moveTo(hx - hr * .86, hy + hr * .14);
      a.lineTo(hx - hr * .62, hy + hr * .12);
      a.lineTo(hx - hr * .74, hy + hr * .3);
      a.closePath();
      a.fillStyle = ha('#a86a63', .92); a.fill();
      a.beginPath();
      a.moveTo(hx - hr * .74, hy + hr * .3); a.lineTo(hx - hr * .74, hy + hr * .46);
      a.strokeStyle = ha('#3a3026', .5); a.lineWidth = hr * .05; a.stroke();
      /* vằn trán và má */
      a.lineCap = 'round';
      for (let j = -1; j <= 1; j++) {
        a.beginPath();
        a.moveTo(hx + j * hr * .3 - hr * .02, hy - hr * .82);
        a.quadraticCurveTo(hx + j * hr * .34 + hr * .04, hy - hr * .46,
                           hx + j * hr * .22 + hr * .02, hy - hr * .24);
        a.strokeStyle = ha('#1d1813', .8); a.lineWidth = hr * .11; a.stroke();
      }
      [-1, 1].forEach(sg => {
        for (let j = 0; j < 2; j++) {
          a.beginPath();
          a.moveTo(hx + hr * (.5 + j * .18), hy + hr * (sg * .3 + .18));
          a.quadraticCurveTo(hx + hr * (.26 + j * .18), hy + hr * (sg * .44 + .2),
                             hx + hr * (.02 + j * .16), hy + hr * (sg * .4 + .22));
          a.strokeStyle = ha('#1d1813', .5); a.lineWidth = hr * .07; a.stroke();
        }
      });
      /* mắt */
      [-1, 1].forEach(sg => {
        const ex = hx - hr * .14 + sg * hr * .34, ey = hy - hr * .1 + (sg < 0 ? hr * .1 : 0);
        a.save(); a.globalCompositeOperation = 'lighter';
        quang(a, ex, ey, hr * .8, '#ffd884', .32, '#c98a1e', .1);
        a.restore();
        a.save();
        a.translate(ex, ey); a.rotate(-.16);
        a.beginPath();                                  /* mắt hí, đuôi xếch */
        a.moveTo(-hr * .24, hr * .01);
        a.quadraticCurveTo(-hr * .04, -hr * .13, hr * .24, -hr * .05);
        a.quadraticCurveTo(-hr * .02, hr * .12, -hr * .24, hr * .01);
        a.closePath();
        a.fillStyle = ha('#e8a83c', .97); a.fill();
        a.beginPath(); a.ellipse(0, 0, hr * .05, hr * .075, 0, 0, 6.2832);
        a.fillStyle = 'rgba(8,12,24,.96)'; a.fill();
        a.beginPath(); a.arc(-hr * .05, -hr * .04, hr * .028, 0, 6.2832);
        a.fillStyle = 'rgba(255,255,255,.9)'; a.fill();
        a.restore();
        a.beginPath();                                  /* gờ mày */
        a.moveTo(ex - hr * .3, ey - hr * .14);
        a.quadraticCurveTo(ex, ey - hr * .3, ex + hr * .28, ey - hr * .16);
        a.strokeStyle = ha('#1d1813', .62);
        a.lineWidth = hr * .07; a.stroke();
      });

      /* bóng dưới chân */
      const sh = a.createRadialGradient(cx, gy, 0, cx, gy, S * 1.05);
      sh.addColorStop(0, ha('#4a3c24', .26));
      sh.addColorStop(1, ha('#5a4a30', 0));
      a.fillStyle = sh;
      a.beginPath(); a.ellipse(cx, gy, S * 1.05, S * .1, 0, 0, 6.2832); a.fill();
    };

    const LINH = [veHuyenVu, veThanhLong, veChuTuoc, veBachHo];
    const MOC = [[0, .26], [1 / 3, .22], [2 / 3, .22], [1, .26]];

    /* Mỗi hồi một vị, ai cũng được cả khoảng trống quanh mình — xếp cả bốn
       lên bốn phương của vòng thì vị đứng phương bắc bị kẹp giữa thanh trên
       và dòng tiêu đề, chỉ còn bằng nắm tay. Riêng Thanh Long vẫn bám theo
       vòng vì thân nó dài, quấn quanh vòng là vừa vặn nhất.

       Tâm và bán kính vòng đi theo tiến độ: dâng lên và thu lại cùng nhịp
       với đường chân trời, nếu không thì hồi cuối vòng chui xuống nước */
    const vongTT = () => ({
      cx: W * .5,
      cy: H * (.50 - .19 * p),
      R: Math.min(W, H) * (.29 - .105 * p)
    });

    const drawLinhThu = (a, s, waterY) => {
      const g = vongTT();
      for (let i = 0; i < 4; i++) {
        const k = hien(MOC[i][0], MOC[i][1]);
        if (k < .015) continue;
        a.save();
        a.globalAlpha = clamp(k, 0, 1);
        LINH[i](a, s, waterY, k, g);
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
