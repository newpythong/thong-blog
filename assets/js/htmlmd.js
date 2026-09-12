/* ═══════════════════════════════════════════════════════════
   HTML ⇄ MARKDOWN
   Trình soạn thảo trả về HTML, kho vẫn giữ Markdown cho bài viết
   đọc được và mang đi đâu cũng chạy. Chỉ lo đúng tập thẻ Quill sinh ra.
   ═══════════════════════════════════════════════════════════ */
window.HTMLMD = (() => {

  /* ---------- HTML → Markdown ---------- */
  const esc = s => s.replace(/([*_`[\]])/g, '\\$1');

  function inline(node) {
    let out = '';
    node.childNodes.forEach(n => {
      if (n.nodeType === 3) { out += n.nodeValue.replace(/\s+/g, ' '); return; }
      if (n.nodeType !== 1) return;
      const tag = n.tagName.toLowerCase();
      const inner = inline(n);
      switch (tag) {
        case 'br': out += '\n'; break;
        case 'strong': case 'b': out += inner.trim() ? `**${inner}**` : ''; break;
        case 'em': case 'i': out += inner.trim() ? `*${inner}*` : ''; break;
        case 'u': out += inner; break;                 // Markdown không có gạch chân
        case 's': case 'del': case 'strike': out += inner.trim() ? `~~${inner}~~` : ''; break;
        case 'code': out += inner.trim() ? '`' + inner + '`' : ''; break;
        case 'a': {
          const href = n.getAttribute('href') || '';
          out += href ? `[${inner || href}](${href})` : inner;
          break;
        }
        case 'img': {
          const src = n.getAttribute('src') || '';
          const alt = n.getAttribute('alt') || '';
          if (src) out += `![${alt}](${src})`;
          break;
        }
        default: out += inner;
      }
    });
    return out;
  }

  /* Quill 2 dựng cả hai loại danh sách bằng <ol>, phân biệt bằng data-list */
  const listKind = li => (li.getAttribute('data-list') === 'bullet' ? 'ul' : 'ol');

  function blocks(root) {
    const out = [];
    let listBuf = null;

    const flush = () => {
      if (!listBuf) return;
      out.push(listBuf.items.map((txt, i) =>
        (listBuf.kind === 'ul' ? '- ' : `${i + 1}. `) + txt).join('\n'));
      listBuf = null;
    };

    [...root.children].forEach(el => {
      const tag = el.tagName.toLowerCase();

      if (tag === 'ol' || tag === 'ul') {
        [...el.children].forEach(li => {
          const kind = tag === 'ul' ? 'ul' : listKind(li);
          const txt = inline(li).trim();
          if (!listBuf || listBuf.kind !== kind) { flush(); listBuf = { kind, items: [] }; }
          listBuf.items.push(txt);
        });
        return;
      }
      flush();

      if (/^h[1-6]$/.test(tag)) {
        const lv = Math.min(6, Math.max(2, +tag[1]));   // h1 của bài do ô Tiêu đề lo
        const txt = inline(el).trim();
        if (txt) out.push('#'.repeat(lv) + ' ' + txt);
        return;
      }
      if (tag === 'blockquote') {
        const txt = inline(el).trim();
        if (txt) out.push(txt.split('\n').map(l => '> ' + l).join('\n'));
        return;
      }
      if (tag === 'pre') {
        const lang = (el.getAttribute('data-language') || '').replace(/[^a-z0-9+-]/gi, '');
        out.push('```' + lang + '\n' + (el.textContent || '').replace(/\n+$/, '') + '\n```');
        return;
      }
      if (tag === 'hr') { out.push('---'); return; }

      const txt = inline(el).trim();
      if (txt) out.push(txt);
    });
    flush();

    return out.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  function toMarkdown(html) {
    const d = document.createElement('div');
    d.innerHTML = String(html || '');
    return blocks(d);
  }

  /* ---------- Markdown → HTML (nạp bài cũ vào trình soạn thảo) ---------- */
  function toHTML(md) {
    if (!window.SUMI) return String(md || '');
    let h = window.SUMI.md(md);
    /* Quill chỉ hiểu ol/ul phẳng và pre trơn */
    h = h.replace(/<h1>/g, '<h2>').replace(/<\/h1>/g, '</h2>');
    /* giữ tên ngôn ngữ lại, nếu không khối mã mất nhãn sau mỗi lần sửa */
    h = h.replace(/<pre><code class="lang-([a-z0-9+-]*)">/gi,
                  (m, lang) => lang && lang !== 'txt' ? `<pre data-language="${lang}">` : '<pre>')
         .replace(/<pre><code[^>]*>/g, '<pre>')
         .replace(/<\/code><\/pre>/g, '</pre>');
    h = h.replace(/<br>/g, '<br/>');
    return h;
  }

  return { toMarkdown, toHTML, esc };
})();
