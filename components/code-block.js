/**
 * code-block.js — Reusable code block with syntax highlight + copy button
 */

/** Minimal syntax highlighter (JSON, Bash/HTTP, JS) */
function highlight(lang, raw) {
  const esc = s => s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  if (lang === 'json') return highlightJSON(raw);
  if (lang === 'bash' || lang === 'shell' || lang === 'http') return highlightHTTP(raw, esc);
  if (lang === 'javascript' || lang === 'js') return highlightJS(raw, esc);
  return esc(raw);
}

function highlightJSON(raw) {
  // Tokenise JSON with a simple regex pass
  return raw
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      match => {
        if (/^"/.test(match)) {
          if (/:$/.test(match)) return `<span class="tk-key">${match}</span>`;
          return `<span class="tk-string">${match}</span>`;
        }
        if (/true|false/.test(match)) return `<span class="tk-bool">${match}</span>`;
        if (/null/.test(match)) return `<span class="tk-null">${match}</span>`;
        return `<span class="tk-number">${match}</span>`;
      }
    );
}

function highlightHTTP(raw, esc) {
  return raw.split('\n').map(line => {
    const escaped = esc(line);
    // HTTP method at line start
    if (/^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s/.test(line)) {
      return escaped.replace(
        /^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)(\s+)(\S+)/,
        (_, m, sp, url) =>
          `<span class="tk-method">${esc(m)}</span>${sp}<span class="tk-url">${esc(url)}</span>`
      );
    }
    // curl command
    if (/^\s*curl/.test(line)) {
      return escaped.replace(/\bcurl\b/, '<span class="tk-keyword">curl</span>');
    }
    // Header: Value
    if (/^[A-Za-z-]+:\s/.test(line)) {
      return escaped.replace(
        /^([A-Za-z-]+)(:)(\s+)(.+)/,
        (_, name, colon, sp, val) =>
          `<span class="tk-hname">${name}</span><span class="tk-punct">${colon}</span>${sp}<span class="tk-hval">${val}</span>`
      );
    }
    // Comments
    if (/^\s*#/.test(line)) return `<span class="tk-comment">${escaped}</span>`;
    return escaped;
  }).join('\n');
}

function highlightJS(raw, esc) {
  const keywords = /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|await|async|new|this|typeof|instanceof)\b/g;
  return esc(raw)
    .replace(/\/\/.+/g, m => `<span class="tk-comment">${m}</span>`)
    .replace(/(".*?"|'.*?'|`.*?`)/gs, m => `<span class="tk-string">${m}</span>`)
    .replace(keywords, m => `<span class="tk-keyword">${m}</span>`);
}

/** Build the code block DOM element */
export function createCodeBlock({ lang = 'bash', title = '', code = '' }) {
  const el = document.createElement('div');
  el.className = 'code-block-wrap';

  const langLabel = lang.toUpperCase();
  const highlighted = highlight(lang, code);

  el.innerHTML = `
    <div class="code-block-header">
      <div class="code-block-meta">
        <span class="code-block-lang">${langLabel}</span>
        ${title ? `<span class="code-block-title">${title}</span>` : ''}
      </div>
      <button class="copy-btn" aria-label="Copiar código">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        Copiar
      </button>
    </div>
    <div class="code-block-body">
      <code>${highlighted}</code>
    </div>
  `;

  // Copy-to-clipboard logic
  const btn = el.querySelector('.copy-btn');
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Fallback for older browsers / non-secure contexts
      const ta = document.createElement('textarea');
      ta.value = code;
      ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    btn.classList.add('copied');
    btn.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      Copiado!
    `;
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        Copiar
      `;
    }, 2000);
  });

  return el;
}
