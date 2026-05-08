(function () {
  const THEME_KEY = 'docs-theme';

  function getTheme() {
    return localStorage.getItem(THEME_KEY) || 'light';
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      btn.textContent = theme === 'dark' ? 'Claro' : 'Escuro';
    });
  }

  function initTheme() {
    setTheme(getTheme());
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.addEventListener('click', toggleTheme);
    });
  }

  function toggleTheme() {
    const next = getTheme() === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }

  /** ----- Page enter / leave transitions ----- */
  function initPageShell() {
    const shell = document.getElementById('page-shell');
    if (!shell) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => shell.classList.add('page-shell--visible'));
    });
  }

  function initPageTransitions() {
    document.querySelectorAll('a[data-page-link]').forEach((a) => {
      a.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        const href = a.getAttribute('href');
        if (!href || href.startsWith('#')) return;
        e.preventDefault();
        document.body.classList.add('page-leaving');
        setTimeout(() => {
          window.location.href = a.href;
        }, 220);
      });
    });
  }

  let scrollSpyObserver = null;

  /** ----- Scroll spy for sidebar ----- */
  function initScrollSpy() {
    const nav = document.querySelector('.sidebar__nav');
    if (!nav) return;
    if (scrollSpyObserver) {
      scrollSpyObserver.disconnect();
      scrollSpyObserver = null;
    }
    const links = nav.querySelectorAll('a[href^="#"]');
    const ids = Array.from(links)
      .map((l) => l.getAttribute('href'))
      .filter(Boolean)
      .map((h) => h.slice(1));

    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!sections.length) return;

    scrollSpyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const id = en.target.id;
          links.forEach((l) => {
            l.classList.toggle('is-active', l.getAttribute('href') === `#${id}`);
          });
        });
      },
      { rootMargin: '-38% 0px -42% 0px', threshold: 0 }
    );

    sections.forEach((s) => scrollSpyObserver.observe(s));
  }

  /** ----- API page render ----- */
  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function highlightJsonCode(raw) {
    if (window.Prism && Prism.languages && Prism.languages.json) {
      try {
        return Prism.highlight(raw, Prism.languages.json, 'json');
      } catch {
        /* fall through */
      }
    }
    return escapeHtml(raw);
  }

  function renderCodeBlock(label, code, className, copyLabel) {
    const applied = window.PartnerCredentials ? PartnerCredentials.applyPlaceholders(code) : code;
    const codeHtml = highlightJsonCode(applied);
    const encoded = encodeURIComponent(applied);
    const copyText = copyLabel || 'Copy';
    return `
      <div class="code-block-wrap ${className || ''}">
        <div class="code-block__bar">
          <span>${escapeHtml(label)}</span>
          <button type="button" class="btn btn--ghost copy-btn" data-copy="${encoded}">${escapeHtml(copyText)}</button>
        </div>
        <pre><code class="language-json">${codeHtml}</code></pre>
      </div>`;
  }

  function renderEndpoint(ep, index, doc) {
    const L = doc && doc.labels && doc.labels.endpoint ? doc.labels.endpoint : {};
    const method = ep.method || 'GET';
    const path = ep.path || '';
    const req = ep.requestBody
      ? renderCodeBlock(L.requestBody || 'Request body (JSON)', ep.requestBody, '', L.copy)
      : `<p class="muted">${escapeHtml(L.noRequestBody || 'No request body.')}</p>`;
    const res = renderCodeBlock(L.responseExample || 'Response example (JSON)', ep.responseExample || '{}', '', L.copy);

    return `
      <article class="endpoint-block section-anchor" id="endpoint-${escapeHtml(ep.id || String(index))}">
        <h3><span class="method-badge">${escapeHtml(method)}</span> ${escapeHtml(path)}</h3>
        <p>${escapeHtml(ep.description || '')}</p>
        ${req}
        ${res}
        <div class="try-soon">
          <button type="button" class="btn btn--ghost" disabled title="${escapeHtml(L.trySoonTitle || 'Coming soon')}">${escapeHtml(L.trySoon || 'Try it (coming soon)')}</button>
        </div>
      </article>`;
  }

  function renderAdditionalSection(sec) {
    const paragraphs = Array.isArray(sec.body) ? sec.body : sec.body ? [sec.body] : [];
    const ps = paragraphs
      .filter(Boolean)
      .map((p) => `<p>${escapeHtml(window.PartnerCredentials ? PartnerCredentials.applyPlaceholders(p) : p)}</p>`)
      .join('');
    const links = (sec.links || [])
      .map(
        (l) =>
          `<li><a href="${escapeHtml(l.href)}" rel="noopener noreferrer" target="_blank">${escapeHtml(l.label)}</a></li>`
      )
      .join('');
    const linksBlock = links ? `<ul class="api-doc-links">${links}</ul>` : '';
    return `
      <section class="section-anchor" id="${escapeHtml(sec.id)}" aria-labelledby="h-${escapeHtml(sec.id)}">
        <h2 id="h-${escapeHtml(sec.id)}">${escapeHtml(sec.title)}</h2>
        ${ps}
        ${linksBlock}
      </section>`;
  }

  function ensureCopyButtonDataAttrs(root) {
    if (!root) return;
    root.querySelectorAll('.code-block-wrap .copy-btn').forEach((btn) => {
      if (btn.getAttribute('data-copy')) return;
      const code = btn.closest('.code-block-wrap')?.querySelector('pre code');
      if (code && code.textContent) {
        btn.setAttribute('data-copy', encodeURIComponent(code.textContent.trim()));
      }
    });
  }

  function initStaticApiPage() {
    const root = document.getElementById('api-content-root');
    if (!root) return;
    ensureCopyButtonDataAttrs(root);
    bindCopyButtons(root);
    initScrollSpy();
    root.querySelectorAll('pre code.language-json, pre code.language-bash').forEach((el) => {
      if (window.Prism && typeof Prism.highlightElement === 'function') {
        Prism.highlightElement(el);
      }
    });
  }

  function renderApiPage() {
    if (document.body.hasAttribute('data-static-api')) {
      initStaticApiPage();
      return;
    }

    const slug = document.body.getAttribute('data-api');
    if (!slug || typeof API_DOCS === 'undefined') return;

    const doc = API_DOCS[slug];
    if (!doc) return;

    const root = document.getElementById('api-content-root');
    if (!root) return;

    const applyPh = (s) => (window.PartnerCredentials ? PartnerCredentials.applyPlaceholders(s) : s);

    const reqs = (doc.basicRequirements || [])
      .map((r) => `<li>${escapeHtml(applyPh(r))}</li>`)
      .join('');

    const endpoints = (doc.endpoints || []).map((ep, i) => renderEndpoint(ep, i, doc)).join('');

    const flowsHtml = (doc.relevantFlows || [])
      .map((p) => `<p>${escapeHtml(applyPh(p))}</p>`)
      .join('');

    const guideHtml = (doc.guide || [])
      .map((p) => `<p>${escapeHtml(applyPh(p))}</p>`)
      .join('');

    const leadText = doc.lead || doc.title;

    const sec = (doc.labels && doc.labels.sections) || {};

    const flowsSection = flowsHtml
      ? `
      <section class="section-anchor" id="section-relevant-flows" aria-labelledby="h-flows">
        <h2 id="h-flows">${escapeHtml(sec.relevantFlows || 'Fluxos relevantes')}</h2>
        ${flowsHtml}
      </section>`
      : '';

    const guideSection = guideHtml
      ? `
      <section class="section-anchor" id="section-guide" aria-labelledby="h-guide">
        <h2 id="h-guide">${escapeHtml(sec.guide || 'Guia')}</h2>
        ${guideHtml}
      </section>`
      : '';

    root.innerHTML = `
      <header class="api-main__header">
        <h1>${escapeHtml(doc.title)}</h1>
        <p class="lead">${escapeHtml(applyPh(leadText))}</p>
      </header>

      <section class="section-anchor" id="section-basic-requirements" aria-labelledby="h-basic">
        <h2 id="h-basic">${escapeHtml(sec.basicRequirements || 'Requisitos básicos')}</h2>
        <ul>${reqs}</ul>
      </section>

      <section class="section-anchor" id="section-endpoints" aria-labelledby="h-endpoints">
        <h2 id="h-endpoints">${escapeHtml(sec.endpoints || 'Endpoints')}</h2>
        ${endpoints}
      </section>

      ${flowsSection}

      ${guideSection}
    `;

    bindCopyButtons(root);
    initScrollSpy();
  }

  function bindCopyButtons(container) {
    if (!container) return;
    if (container._copyDelegation) {
      container.removeEventListener('click', container._copyDelegation);
    }
    container._copyDelegation = async function (e) {
      const btn = e.target.closest('.copy-btn');
      if (!btn || !container.contains(btn)) return;
      const raw = btn.getAttribute('data-copy');
      if (!raw) return;
      const text = decodeURIComponent(raw);
      try {
        await navigator.clipboard.writeText(text);
        showCopyToast();
      } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showCopyToast();
      }
    };
    container.addEventListener('click', container._copyDelegation);
  }

  let toastTimer;
  function showCopyToast() {
    const pt =
      document.documentElement.lang && document.documentElement.lang.toLowerCase().startsWith('pt');
    const toastMsg = pt ? 'Copiado!' : 'Copied!';
    let el = document.getElementById('copy-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'copy-toast';
      el.className = 'copy-toast';
      el.textContent = toastMsg;
      document.body.appendChild(el);
    } else {
      el.textContent = toastMsg;
    }
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-visible'), 2000);
  }

  function updateCredentialsBadge() {
    const badge = document.querySelector('[data-credentials-badge]');
    if (!badge || !window.PartnerCredentials) return;
    const has = PartnerCredentials.hasCredentials();
    badge.hidden = !has;
  }

  /** ----- Image lightbox (click to expand) ----- */
  function lightboxAriaLabels() {
    const lang = (document.documentElement.lang || '').toLowerCase();
    if (lang.startsWith('es')) {
      return {
        dialog: 'Imagen ampliada',
        close: 'Cerrar',
      };
    }
    if (lang.startsWith('pt')) {
      return {
        dialog: 'Imagem ampliada',
        close: 'Fechar',
      };
    }
    return {
      dialog: 'Expanded image',
      close: 'Close',
    };
  }

  function shouldExpandImage(img) {
    if (!(img instanceof HTMLImageElement) || !img.src) return false;
    if (img.closest('.sidebar')) return false;
    if (img.closest('.modal')) return false;
    if (img.closest('#credentials-modal')) return false;
    if (img.closest('#docs-image-lightbox')) return false;
    if (img.hasAttribute('data-no-lightbox')) return false;
    return true;
  }

  function initImageLightbox() {
    if (document.getElementById('docs-image-lightbox')) return;

    const labels = lightboxAriaLabels();
    const overlay = document.createElement('div');
    overlay.id = 'docs-image-lightbox';
    overlay.className = 'docs-image-lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', labels.dialog);
    overlay.hidden = true;
    overlay.innerHTML = `
      <div class="docs-image-lightbox__backdrop" data-lightbox-dismiss tabindex="-1"></div>
      <button type="button" class="docs-image-lightbox__close btn btn--ghost" data-lightbox-dismiss aria-label="${labels.close}">×</button>
      <img class="docs-image-lightbox__img" alt="" />
    `;
    document.body.appendChild(overlay);

    const fullImg = overlay.querySelector('.docs-image-lightbox__img');

    function openLightbox(src, alt) {
      fullImg.src = src;
      fullImg.alt = alt || '';
      overlay.hidden = false;
      document.documentElement.classList.add('docs-image-lightbox-open');
      document.body.classList.add('docs-image-lightbox-open');
    }

    function closeLightbox() {
      overlay.hidden = true;
      fullImg.removeAttribute('src');
      fullImg.alt = '';
      document.documentElement.classList.remove('docs-image-lightbox-open');
      document.body.classList.remove('docs-image-lightbox-open');
    }

    document.body.addEventListener('click', (e) => {
      const img = e.target.closest('img');
      if (!img || !shouldExpandImage(img)) return;
      e.preventDefault();
      e.stopPropagation();
      openLightbox(img.currentSrc || img.src, img.alt || '');
    });

    overlay.addEventListener('click', (e) => {
      if (e.target.closest('[data-lightbox-dismiss]')) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !overlay.hidden) closeLightbox();
    });
  }

  /** Credentials modal */
  function initCredentialsModal() {
    const backdrop = document.getElementById('modal-backdrop');
    const modal = document.getElementById('credentials-modal');
    const openBtns = document.querySelectorAll('[data-open-credentials]');
    const closeBtns = document.querySelectorAll('[data-close-credentials]');
    const form = document.getElementById('credentials-form');

    if (!backdrop || !modal) return;

    function open() {
      backdrop.classList.add('is-open');
      modal.classList.add('is-open');
      const c = PartnerCredentials.getCredentials();
      const apiKey = document.getElementById('field-api-key');
      const webhook = document.getElementById('field-webhook');
      const merchant = document.getElementById('field-merchant');
      const store = document.getElementById('field-store-id');
      if (apiKey) apiKey.value = c.apiKey || '';
      if (webhook) webhook.value = c.webhookUrl || '';
      if (merchant) merchant.value = c.merchantId || '';
      if (store) store.value = c.storeId || '';
    }

    function close() {
      backdrop.classList.remove('is-open');
      modal.classList.remove('is-open');
    }

    openBtns.forEach((b) => b.addEventListener('click', open));
    closeBtns.forEach((b) => b.addEventListener('click', close));
    backdrop.addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && backdrop.classList.contains('is-open')) close();
    });

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        PartnerCredentials.saveCredentials({
          apiKey: document.getElementById('field-api-key')?.value?.trim() || '',
          webhookUrl: document.getElementById('field-webhook')?.value?.trim() || '',
          merchantId: document.getElementById('field-merchant')?.value?.trim() || '',
          storeId: document.getElementById('field-store-id')?.value?.trim() || '',
        });
        close();
      });
    }

    const clearBtn = document.getElementById('credentials-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        PartnerCredentials.clearCredentials();
        if (form) form.reset();
      });
    }

    window.addEventListener('partnerCredentialsChanged', () => {
      renderApiPage();
      updateCredentialsBadge();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initPageShell();
    initTheme();
    initPageTransitions();
    initImageLightbox();
    renderApiPage();
    initCredentialsModal();
    updateCredentialsBadge();
  });
})();
