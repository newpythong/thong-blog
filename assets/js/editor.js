/* ═══════════════════════════════════════════════════════════
   TRANG VIẾT BÀI
   Đăng nhập bằng tài khoản → mở khoá token → soạn thảo trực quan →
   commit thẳng vào kho. Bài lưu dạng Markdown, ảnh lưu trong kho.
   ═══════════════════════════════════════════════════════════ */
(() => {
  const S = window.SUMI, C = S.CFG, A = window.AUTH, HM = window.HTMLMD;
  const $ = id => document.getElementById(id);
  const API = 'https://api.github.com';
  const AUTH_PATH = 'content/auth.json';
  const SESSION = 'muc.session';

  let token = null, sha = {}, editing = null, quill = null, me = '';

  $('repoName').textContent = C.owner + '/' + C.repo;

  /* ── thông báo ───────────────────────────── */
  const say = (el, txt, kind) => {
    el.textContent = txt;
    el.className = 'msg on msg--' + (kind || 'ok');
    if (kind === 'ok') setTimeout(() => { el.className = 'msg'; }, 7000);
  };
  const clear = el => { el.className = 'msg'; };

  /* ── GitHub ──────────────────────────────── */
  const b64 = str => {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    bytes.forEach(b => bin += String.fromCharCode(b));
    return btoa(bin);
  };
  const unb64 = s => new TextDecoder().decode(
    Uint8Array.from(atob(s.replace(/\s/g, '')), c => c.charCodeAt(0)));

  async function gh(path, opts = {}, tok) {
    const r = await fetch(API + path, {
      ...opts,
      headers: {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Authorization': 'Bearer ' + (tok || token),
        ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
        ...(opts.headers || {})
      }
    });
    if (r.status === 204) return null;
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      const e = new Error(j.message || ('HTTP ' + r.status));
      e.status = r.status;
      throw e;
    }
    return j;
  }
  const cpath = p => '/repos/' + C.owner + '/' + C.repo + '/contents/' + p;

  async function getFile(path, tok) {
    try {
      const j = await gh(cpath(path) + '?ref=' + C.branch, {}, tok);
      sha[path] = j.sha;
      return unb64(j.content || '');
    } catch (e) {
      if (e.status === 404) { delete sha[path]; return null; }
      throw e;
    }
  }
  async function putFile(path, text, message, tok, rawB64) {
    const body = {
      message, content: rawB64 || b64(text), branch: C.branch,
      ...(sha[path] ? { sha: sha[path] } : {})
    };
    const j = await gh(cpath(path), { method: 'PUT', body: JSON.stringify(body) }, tok);
    sha[path] = j.content.sha;
    return j;
  }
  async function delFile(path, message) {
    if (!sha[path]) await getFile(path);
    if (!sha[path]) return;
    await gh(cpath(path), {
      method: 'DELETE',
      body: JSON.stringify({ message, sha: sha[path], branch: C.branch })
    });
    delete sha[path];
  }

  /* ── gói đăng nhập trong kho ─────────────── */
  async function fetchAuthRecord() {
    try {
      const r = await fetch(S.base + AUTH_PATH + '?v=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) return null;
      return await r.json();
    } catch (e) { return null; }
  }

  /* ══════════ MÀN HÌNH ══════════ */
  function show(which) {
    ['gate', 'setup', 'ed'].forEach(id => { $(id).hidden = (id !== which); });
    $('logout').hidden = (which !== 'ed');
  }

  /* ══════════ ĐĂNG NHẬP ══════════ */
  $('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = $('loginBtn');
    btn.disabled = true; clear($('loginMsg'));
    say($('loginMsg'), 'Đang mở khoá…', 'ok');
    try {
      const rec = await fetchAuthRecord();
      if (!rec) throw new Error('Chưa có tài khoản nào. Tải lại trang để cài đặt lần đầu.');
      const tok = await A.open(rec, $('lu').value, $('lp').value);
      await enter(tok, rec.user);
      if ($('lr').checked) localStorage.setItem(SESSION, tok);
      else sessionStorage.setItem(SESSION, tok);
    } catch (err) {
      say($('loginMsg'), err.message, 'err');
    } finally { btn.disabled = false; }
  });

  $('logout').addEventListener('click', e => {
    e.preventDefault();
    localStorage.removeItem(SESSION); sessionStorage.removeItem(SESSION);
    location.reload();
  });

  /* ══════════ CÀI ĐẶT LẦN ĐẦU ══════════ */
  $('genPass').addEventListener('click', () => { $('sp').value = A.suggest(); });

  $('setupForm').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = $('setupBtn');
    const tok = $('st').value.trim();
    const user = $('su').value.trim();
    const pass = $('sp').value;

    if (!/^[a-zA-Z0-9._-]{2,32}$/.test(user))
      return say($('setupMsg'), 'Tên đăng nhập chỉ gồm chữ, số, dấu chấm, gạch — từ 2 đến 32 ký tự.', 'err');
    const w = A.weak(pass);
    if (w) return say($('setupMsg'), w, 'err');

    btn.disabled = true;
    say($('setupMsg'), 'Đang kiểm tra token và tạo tài khoản…', 'ok');
    try {
      /* Chỉ thử đúng thao tác mình cần. Fine-grained token chỉ có quyền
         Contents trên một kho thì không vào được /user hay /repos/{o}/{r},
         gọi vào đó sẽ báo "Resource not accessible by personal access token". */
      await checkToken(tok);

      const rec = await A.seal(tok, user, pass);
      await getFile(AUTH_PATH, tok);                       // lấy sha nếu đã có
      await putFile(AUTH_PATH, JSON.stringify(rec, null, 2) + '\n',
        'muc: tạo tài khoản ' + user, tok);

      say($('setupMsg'), 'Xong. Đang vào…', 'ok');
      await enter(tok, user);
      localStorage.setItem(SESSION, tok);
    } catch (err) {
      const R = C.owner + '/' + C.repo;
      say($('setupMsg'),
        err.status === 401
          ? 'Token không hợp lệ hoặc đã hết hạn. Tạo token mới rồi dán lại.'
        : (err.status === 403 || err.status === 404)
          ? 'Token chưa đủ quyền cho kho ' + R + '. Mở lại trang token trên GitHub và kiểm tra hai chỗ: '
            + '(1) Repository access phải là "Only select repositories" và có chọn ' + R + '; '
            + '(2) Permissions → Repository permissions → Contents phải là "Read and write". '
            + 'Sửa xong bấm Update token rồi dán lại token cũ — không cần tạo token mới.'
        : 'Lỗi: ' + err.message, 'err');
    } finally { btn.disabled = false; }
  });

  /* Đọc thử mục lục: cần đúng quyền Contents mà ta yêu cầu, không hơn. */
  async function checkToken(tok) {
    const r = await fetch(API + cpath(C.index) + '?ref=' + C.branch, {
      headers: {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Authorization': 'Bearer ' + tok
      }
    });
    if (r.ok || r.status === 404) return;        // 404 = kho chưa có mục lục, vẫn hợp lệ
    const j = await r.json().catch(() => ({}));
    const e = new Error(j.message || 'HTTP ' + r.status);
    e.status = r.status;
    throw e;
  }

  /* ══════════ VÀO SOẠN THẢO ══════════ */
  async function enter(tok, user) {
    await checkToken(tok);          // token cũ hết hạn thì chặn ngay ở cửa
    token = tok;
    me = user || 'bạn';
    $('who').textContent = me;
    document.title = 'Viết bài — ' + me;
    show('ed');
    buildEditor();
    blank();
    await refreshList();
  }

  /* ══════════ QUILL ══════════ */
  function buildEditor() {
    if (quill) return;
    quill = new Quill('#editor', {
      theme: 'snow',
      placeholder: 'Viết ở đây…',
      modules: {
        toolbar: {
          container: [
            [{ header: [2, 3, false] }],
            ['bold', 'italic', 'strike'],
            ['blockquote', 'code-block'],
            [{ list: 'bullet' }, { list: 'ordered' }],
            ['link', 'image'],
            ['clean']
          ],
          handlers: { image: () => $('imgPick').click() }
        }
      }
    });
    quill.on('text-change', () => {
      const n = quill.getText().trim().split(/\s+/).filter(Boolean).length;
      $('wc').textContent = n + ' chữ';
    });
  }

  /* ── ảnh: tải lên kho rồi chèn đường dẫn, không nhúng base64 vào bài ── */
  $('imgPick').addEventListener('change', async e => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024)
      return say($('edMsg'), 'Ảnh nặng quá 5 MB. Nén bớt rồi thử lại.', 'err');

    say($('edMsg'), 'Đang tải ảnh lên…', 'ok');
    try {
      const buf = await file.arrayBuffer();
      let bin = '';
      new Uint8Array(buf).forEach(b => bin += String.fromCharCode(b));
      const ext = (file.name.match(/\.(jpe?g|png|gif|webp|avif|svg)$/i) || ['.jpg'])[0].toLowerCase();
      const name = S.slugify(file.name.replace(/\.[^.]+$/, '')) + '-' +
                   Date.now().toString(36).slice(-5) + ext;
      const path = 'content/images/' + name;
      await putFile(path, null, 'muc: thêm ảnh ' + name, null, btoa(bin));

      const url = S.base + path;
      const r = quill.getSelection(true);
      quill.insertEmbed(r ? r.index : quill.getLength(), 'image', url, 'user');
      quill.setSelection((r ? r.index : quill.getLength()) + 1);
      say($('edMsg'), 'Đã chèn ảnh.', 'ok');
    } catch (err) {
      say($('edMsg'), 'Không tải được ảnh: ' + err.message, 'err');
    }
  });

  /* ══════════ BIỂU MẪU ══════════ */
  const F = {
    title: $('f-title'), slug: $('f-slug'), tag: $('f-tag'),
    date: $('f-date'), excerpt: $('f-excerpt'), draft: $('f-draft')
  };
  let slugTouched = false;
  F.slug.addEventListener('input', () => { slugTouched = true; });
  F.title.addEventListener('input', () => {
    if (!slugTouched && !editing) F.slug.value = S.slugify(F.title.value);
  });

  function blank() {
    editing = null; slugTouched = false;
    F.title.value = ''; F.slug.value = ''; F.tag.value = '';
    F.excerpt.value = ''; F.draft.checked = false;
    F.date.value = new Date().toISOString().slice(0, 10);
    if (quill) quill.setContents([]);
    $('mode').textContent = 'Bài mới';
    $('wc').textContent = '0 chữ';
    scrollTo({ top: 0, behavior: 'smooth' });
  }
  $('newBtn').addEventListener('click', blank);
  $('listBtn').addEventListener('click', () => {
    const pane = $('listPane');
    pane.hidden = !pane.hidden;
    if (!pane.hidden) pane.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* ══════════ MỤC LỤC ══════════ */
  async function readIndex() {
    const txt = await getFile(C.index);
    if (!txt) return [];
    try { const j = JSON.parse(txt); return Array.isArray(j) ? j : (j.posts || []); }
    catch (e) { return []; }
  }

  async function refreshList() { renderList(await readIndex()); }

  /* Dựng từ mảng truyền vào, không đọc lại kho: GitHub đôi khi còn trả bản cũ
     ngay sau khi ghi, khiến bài vừa đăng chưa hiện trong danh sách. */
  function renderList(posts) {
    const box = $('mine');
    if (!posts.length) {
      box.innerHTML = '<div class="mine__i" style="justify-content:center;color:var(--fg-faint)">Chưa có bài nào</div>';
      return;
    }
    posts.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    box.innerHTML = posts.map(p => `
      <div class="mine__i">
        <div>
          <div>${S.esc(p.title || p.slug)}${p.draft ? ' <small style="color:var(--dat)">nháp</small>' : ''}</div>
          <small>${S.esc(S.fmtDate(p.date))} · ${S.esc(p.slug)}</small>
        </div>
        <div class="mine__act">
          <a class="lnk" href="#" data-edit="${S.esc(p.slug)}">Sửa</a>
          <a class="lnk" href="post.html?p=${encodeURIComponent(p.slug)}" target="_blank">Xem</a>
          <a class="lnk" href="#" data-del="${S.esc(p.slug)}" style="color:var(--son)">Xoá</a>
        </div>
      </div>`).join('');

    box.querySelectorAll('[data-edit]').forEach(a =>
      a.addEventListener('click', async e => { e.preventDefault(); await load(a.dataset.edit, posts); }));
    box.querySelectorAll('[data-del]').forEach(a =>
      a.addEventListener('click', async e => {
        e.preventDefault();
        const slug = a.dataset.del;
        if (!confirm('Xoá vĩnh viễn bài "' + slug + '"?')) return;
        try {
          await delFile(C.dir + '/' + slug + '.md', 'muc: xoá ' + slug);
          const idx = posts.filter(x => x.slug !== slug);
          await putFile(C.index, JSON.stringify(idx, null, 2) + '\n', 'muc: cập nhật mục lục');
          if (editing === slug) blank();
          renderList(idx);
          say($('edMsg'), 'Đã xoá.', 'ok');
        } catch (err) { say($('edMsg'), 'Lỗi xoá: ' + err.message, 'err'); }
      }));
  }

  async function load(slug, posts) {
    try {
      const meta = posts.find(x => x.slug === slug) || {};
      const txt = await getFile(C.dir + '/' + slug + '.md');
      editing = slug; slugTouched = true;
      F.title.value = meta.title || '';
      F.slug.value = slug;
      F.tag.value = meta.tag || '';
      F.excerpt.value = meta.excerpt || '';
      F.date.value = (meta.date || '').slice(0, 10);
      F.draft.checked = !!meta.draft;

      const body = (txt || '').replace(/^\s*#\s+.*\n+/, '');
      quill.clipboard.dangerouslyPasteHTML(HM.toHTML(body), 'silent');
      $('mode').textContent = 'Đang sửa: ' + slug;
      $('listPane').hidden = true;
      scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) { say($('edMsg'), 'Không mở được: ' + err.message, 'err'); }
  }

  /* ══════════ ĐĂNG ══════════ */
  $('pubBtn').addEventListener('click', publish);
  addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's' && !$('ed').hidden) {
      e.preventDefault(); publish();
    }
  });

  async function publish() {
    const title = F.title.value.trim();
    const body = HM.toMarkdown(quill.root.innerHTML).trim();
    if (!title) return say($('edMsg'), 'Cần một tiêu đề.', 'err');
    if (!body) return say($('edMsg'), 'Bài đang trống.', 'err');

    let slug = S.slugify(F.slug.value.trim() || title);
    F.slug.value = slug;

    $('pubBtn').classList.add('busy');
    say($('edMsg'), 'Đang đăng…', 'ok');
    try {
      const idx = await readIndex();
      if (!editing && idx.some(p => p.slug === slug)) {
        slug = slug + '-' + Date.now().toString(36).slice(-4);
        F.slug.value = slug;
      }
      if (editing && editing !== slug)
        await delFile(C.dir + '/' + editing + '.md', 'muc: đổi tên ' + editing);

      const path = C.dir + '/' + slug + '.md';
      if (!(path in sha)) await getFile(path);
      await putFile(path, '# ' + title + '\n\n' + body + '\n',
        'muc: ' + (editing ? 'sửa' : 'viết') + ' "' + title + '"');

      const entry = {
        slug, title,
        date: F.date.value || new Date().toISOString().slice(0, 10),
        tag: F.tag.value.trim(),
        excerpt: F.excerpt.value.trim() ||
                 quill.getText().trim().replace(/\s+/g, ' ').slice(0, 150),
        draft: F.draft.checked
      };
      const next = idx.filter(p => p.slug !== slug && p.slug !== editing);
      next.push(entry);
      next.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
      await putFile(C.index, JSON.stringify(next, null, 2) + '\n', 'muc: cập nhật mục lục');

      editing = slug;
      $('mode').textContent = 'Đang sửa: ' + slug;
      renderList(next);
      say($('edMsg'), 'Đã đăng. Chờ khoảng 30–60 giây rồi tải lại trang chủ là thấy bài.', 'ok');
    } catch (err) {
      say($('edMsg'),
        err.status === 409 ? 'Xung đột phiên bản — bấm Đăng bài lần nữa.' : 'Lỗi: ' + err.message, 'err');
    } finally {
      $('pubBtn').classList.remove('busy');
    }
  }

  /* ══════════ KHỞI ĐỘNG ══════════ */
  (async () => {
    const saved = localStorage.getItem(SESSION) || sessionStorage.getItem(SESSION);
    const rec = await fetchAuthRecord();

    if (!rec) {
      $('su').value = 'thong';
      $('sp').value = A.suggest();
      show('setup');
      return;
    }
    $('gateNote').innerHTML =
      'Quên mật khẩu thì không khôi phục được — phải xoá tệp <b>' + AUTH_PATH +
      '</b> trong kho rồi cài lại từ đầu.';
    $('lu').value = rec.user || '';

    if (saved) {
      try { await enter(saved, rec.user); return; }
      catch (e) {
        localStorage.removeItem(SESSION); sessionStorage.removeItem(SESSION);
      }
    }
    show('gate');
    ($('lu').value ? $('lp') : $('lu')).focus();
  })();
})();
