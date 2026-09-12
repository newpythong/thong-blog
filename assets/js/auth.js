/* ═══════════════════════════════════════════════════════════
   ĐĂNG NHẬP

   Trang tĩnh không có máy chủ, nên không thể có "kiểm tra mật khẩu"
   thật sự. Cách làm ở đây: token GitHub được mã hoá bằng chính mật
   khẩu của bạn, gói mã hoá nằm trong kho. Đăng nhập = giải mã được
   gói đó. Sai mật khẩu thì không ra token, không ghi được gì.

   Gói mã hoá nằm trong kho công khai, nên ai cũng tải về được và
   thử mật khẩu ngoại tuyến. Vì vậy dùng PBKDF2 600.000 vòng cho mỗi
   lần thử, và mật khẩu phải đủ mạnh. Token cũng chỉ có quyền ghi nội
   dung đúng kho này, không đụng được gì khác.
   ═══════════════════════════════════════════════════════════ */
window.AUTH = (() => {
  const ITER = 600000;
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

  async function keyFrom(pass, salt, iter) {
    const base = await crypto.subtle.importKey(
      'raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }

  async function seal(token, user, pass) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await keyFrom(pass, salt, ITER);
    const blob = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv }, key, enc.encode(token));
    return {
      v: 1, user, iter: ITER,
      salt: b64(salt), iv: b64(iv), blob: b64(blob)
    };
  }

  async function open(rec, user, pass) {
    if (!rec || rec.v !== 1) throw new Error('Gói đăng nhập không đọc được.');
    if (String(user).trim().toLowerCase() !== String(rec.user).toLowerCase())
      throw new Error('Sai tên đăng nhập hoặc mật khẩu.');
    const key = await keyFrom(pass, unb64(rec.salt), rec.iter || ITER);
    let out;
    try {
      out = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: unb64(rec.iv) }, key, unb64(rec.blob));
    } catch (e) {
      throw new Error('Sai tên đăng nhập hoặc mật khẩu.');
    }
    return dec.decode(out);
  }

  /* mật khẩu mạnh, dễ gõ: bốn nhóm bốn ký tự, bỏ các chữ dễ nhìn nhầm */
  function suggest() {
    const A = 'abcdefghijkmnpqrstuvwxyz23456789';
    const r = crypto.getRandomValues(new Uint8Array(16));
    return [...r].map(v => A[v % A.length]).join('')
      .replace(/(.{4})(?=.)/g, '$1-');
  }

  /* ước lượng rất thô, chỉ để cảnh báo mật khẩu quá yếu */
  function weak(pass) {
    if (!pass || pass.length < 10) return 'Mật khẩu cần ít nhất 10 ký tự.';
    const kinds = [/[a-z]/, /[A-Z0-9]/, /[^a-zA-Z0-9]/].filter(re => re.test(pass)).length;
    if (pass.length < 14 && kinds < 2)
      return 'Mật khẩu hơi yếu — gói mã hoá nằm trong kho công khai, nên hãy dùng mật khẩu dài hơn.';
    return null;
  }

  return { seal, open, suggest, weak, ITER };
})();
