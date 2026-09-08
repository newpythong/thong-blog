/* CORE — config, markdown, store */
window.SUMI = (() => {

  /* Owner + repo of this GitHub Pages site. */
  const CFG = {
    owner:  'newpythong',
    repo:   'thong-blog',
    branch: 'main',
    index:  'content/posts.json',
    dir:    'content/posts'
  };

  const base = (() => {
    const p = location.pathname;
    return p.slice(0, p.lastIndexOf('/') + 1);
  })();

  /* ---- markdown ---- */
  const SC = String.fromCharCode(0xE000), SE = String.fromCharCode(0xE001);
  const RE_CODE = new RegExp('^' + SC + 'C\\d+' + SE + '$');
  const RE_IC   = new RegExp(SC + 'I(\\d+)' + SE, 'g');
  const RE_CB   = new RegExp('(?:<p>)?' + SC + 'C(\\d+)' + SE + '(?:</p>)?', 'g');
  const esc = s => s.replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function inline(s) {
    return s
      .replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
        (m, a, u) => '<img src="' + u + '" alt="' + a + '" loading="lazy">')
      .replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
        (m, t, u) => '<a href="' + u + '"' +
          (/^https?:/.test(u) ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + t + '</a>')
      .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
      .replace(/(^|\s)_([^_\n]+)_/g, '$1<em>$2</em>')
      .replace(/~~([^~]+)~~/g, '<del>$1</del>');
  }

  function md(src) {
    if (!src) return '';
    const codes = [];
    let s = String(src).replace(/\r\n?/g, '\n')
      .replace(/```([a-zA-Z0-9+-]*)\n([\s\S]*?)```/g, (m, lang, body) => {
        codes.push('<pre><code class="lang-' + (lang || 'txt') + '">' +
          esc(body.replace(/\n$/, '')) + '</code></pre>');
        return SC + 'C' + (codes.length - 1) + SE;
      });
    s = esc(s);

    const ics = [];
    s = s.replace(/`([^`\n]+)`/g, (m, c) => {
      ics.push('<code>' + c + '</code>');
      return SC + 'I' + (ics.length - 1) + SE;
    });

    const out = [];
    for (let b of s.split(/\n{2,}/)) {
      b = b.replace(/^\n+|\n+$/g, '');
      if (!b.trim()) continue;
      if (RE_CODE.test(b.trim())) { out.push(b.trim()); continue; }
      let m;
      if (!b.includes('\n') && (m = b.match(/^(#{1,6})\s+(.*)$/))) {
        out.push('<h' + m[1].length + '>' + inline(m[2]) + '</h' + m[1].length + '>');
        continue;
      }
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(b.trim())) { out.push('<hr>'); continue; }
      if (/^&gt;\s?/.test(b)) {
        out.push('<blockquote>' + inline(b.split('\n')
          .map(l => l.replace(/^&gt;\s?/, '')).join('<br>')) + '</blockquote>');
        continue;
      }
      if (/^[-*+]\s+/.test(b)) {
        out.push('<ul>' + b.split('\n')
          .map(l => '<li>' + inline(l.replace(/^\s*[-*+]\s+/, '')) + '</li>').join('') + '</ul>');
        continue;
      }
      if (/^\d+[.)]\s+/.test(b)) {
        out.push('<ol>' + b.split('\n')
          .map(l => '<li>' + inline(l.replace(/^\s*\d+[.)]\s+/, '')) + '</li>').join('') + '</ol>');
        continue;
      }
      out.push('<p>' + inline(b.replace(/\n/g, '<br>')) + '</p>');
    }
    return out.join('\n')
      .replace(RE_IC, (m, i) => ics[+i])
      .replace(RE_CB, (m, i) => codes[+i]);
  }

  /* ---- helpers ---- */
  const slugify = s => (s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, 70) || 'bai-viet';

  const fmtDate = iso => {
    try {
      return new Date(iso).toLocaleDateString('vi-VN',
        { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) { return iso; }
  };

  const readTime = txt =>
    Math.max(1, Math.round(String(txt || '').trim().split(/\s+/).length / 200));

  async function loadIndex() {
    try {
      const r = await fetch(base + 'content/posts.json?v=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) return [];
      const j = await r.json();
      const arr = Array.isArray(j) ? j : (j.posts || []);
      return arr.filter(p => p && p.slug && !p.draft)
                .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    } catch (e) { return []; }
  }

  async function loadPost(slug) {
    const r = await fetch(base + 'content/posts/' + slug + '.md?v=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw new Error('not found');
    return r.text();
  }

  return { CFG, base, md, esc, slugify, fmtDate, readTime, loadIndex, loadPost };
})();
