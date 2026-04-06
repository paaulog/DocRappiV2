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

  /** ----- Landing: SVG arrows over HTML flex flowchart ----- */
  const ns = 'http://www.w3.org/2000/svg';

  function edge(el, side, wrap) {
    const r = el.getBoundingClientRect();
    const w = wrap.getBoundingClientRect();
    const left = r.left - w.left;
    const top = r.top - w.top;
    switch (side) {
      case 'right':
        return { x: left + r.width, y: top + r.height / 2 };
      case 'left':
        return { x: left, y: top + r.height / 2 };
      case 'bottom':
        return { x: left + r.width / 2, y: top + r.height };
      case 'top':
        return { x: left + r.width / 2, y: top };
      default:
        return { x: left + r.width / 2, y: top + r.height / 2 };
    }
  }

  function linePath(x1, y1, x2, y2) {
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }

  function alignOpenCatalog() {
    const inventory = document.getElementById('card-inventory');
    const openCatalog = document.getElementById('card-open-catalog');
    if (!inventory || !openCatalog) return;
    const invRect = inventory.getBoundingClientRect();
    const catRect = openCatalog.getBoundingClientRect();
    const diff = invRect.top + invRect.height / 2 - (catRect.top + catRect.height / 2);
    const current = parseFloat(openCatalog.style.marginTop) || 0;
    openCatalog.style.marginTop = current + diff + 'px';
  }

  function drawArrows(opts) {
    const skipAlignAfter = opts && opts.skipAlignAfter;
    const wrap = document.getElementById('diagram-wrap');
    const svg = document.getElementById('dependency-svg');
    if (!wrap || !svg) return;

    const cat = document.getElementById('card-open-catalog');
    const inv = document.getElementById('card-inventory');
    const comp = document.getElementById('card-complex-discounts');
    const exclusiveGroup = document.getElementById('exclusive-group-box');
    const loy = document.getElementById('card-loyalty');

    const rect = wrap.getBoundingClientRect();
    if (rect.width < 10) return;

    svg.setAttribute('width', String(rect.width));
    svg.setAttribute('height', String(rect.height));
    svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
    svg.innerHTML = '';

    const FLOW = '#E8521A';

    const defs = document.createElementNS(ns, 'defs');
    const marker = document.createElementNS(ns, 'marker');
    marker.setAttribute('id', 'arrowhead');
    marker.setAttribute('markerWidth', '18');
    marker.setAttribute('markerHeight', '14');
    marker.setAttribute('refX', '16');
    marker.setAttribute('refY', '7');
    marker.setAttribute('markerUnits', 'userSpaceOnUse');
    marker.setAttribute('orient', 'auto');
    const poly = document.createElementNS(ns, 'polygon');
    poly.setAttribute('points', '0 0, 18 7, 0 14');
    poly.setAttribute('fill', FLOW);
    marker.appendChild(poly);
    defs.appendChild(marker);
    svg.appendChild(defs);

    function addFlowPath(d, opts) {
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', opts && opts.muted ? '#8b8e97' : FLOW);
      path.setAttribute('stroke-width', opts && opts.thin ? '2.25' : '3.5');
      path.setAttribute('marker-end', opts && opts.noArrow ? 'none' : 'url(#arrowhead)');
      path.setAttribute('class', 'flowchart-path flowchart-path--animate flowchart-path--pulse');
      svg.appendChild(path);
      const len = path.getTotalLength();
      path.style.strokeDasharray = String(len);
      path.style.strokeDashoffset = String(len);
      requestAnimationFrame(() => {
        path.style.transition = 'stroke-dashoffset 1.05s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        path.style.strokeDashoffset = '0';
      });
    }

    const yMain = inv ? edge(inv, 'right', wrap).y : 0;

    if (cat && inv) {
      const x1 = edge(cat, 'right', wrap).x;
      const x2 = edge(inv, 'left', wrap).x;
      addFlowPath(linePath(x1, yMain, x2, yMain));
    }
    if (inv && exclusiveGroup) {
      const x1 = edge(inv, 'right', wrap).x;
      const x2 = edge(exclusiveGroup, 'left', wrap).x;
      addFlowPath(linePath(x1, yMain, x2, yMain));
    }
    if (inv && comp) {
      const a = edge(inv, 'bottom', wrap);
      const b = edge(comp, 'top', wrap);
      addFlowPath(linePath(a.x, a.y, b.x, b.y));
    }
    if (exclusiveGroup && loy) {
      const a = edge(exclusiveGroup, 'right', wrap);
      const x2 = edge(loy, 'left', wrap).x;
      const y = a.y;
      addFlowPath(linePath(a.x, y, x2, y));
    }

    if (!skipAlignAfter) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          alignOpenCatalog();
          drawArrows({ skipAlignAfter: true });
        }, 60);
      });
    }
  }

  function scheduleDrawArrows() {
    requestAnimationFrame(() => {
      setTimeout(() => {
        drawArrows();
      }, 50);
    });
  }

  window.drawArrows = drawArrows;
  window.drawDependencyLines = drawArrows;

  function initLandingDiagram() {
    if (!document.getElementById('diagram-wrap')) return;
    scheduleDrawArrows();
    let t;
    window.addEventListener('resize', () => {
      clearTimeout(t);
      t = setTimeout(scheduleDrawArrows, 120);
    });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => scheduleDrawArrows());
    }
  }

  function toggleTheme() {
    const next = getTheme() === 'dark' ? 'light' : 'dark';
    setTheme(next);
    scheduleDrawArrows();
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
    root.querySelectorAll('pre code.language-json').forEach((el) => {
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

    const reqs = (doc.basicRequirements || [])
      .map((r) => `<li>${escapeHtml(window.PartnerCredentials ? PartnerCredentials.applyPlaceholders(r) : r)}</li>`)
      .join('');

    const endpoints = (doc.endpoints || []).map((ep, i) => renderEndpoint(ep, i, doc)).join('');

    const overviewParas = doc.overviewParagraphs || (doc.overview ? [doc.overview] : []);
    const overviewHtml = overviewParas
      .map((p) => `<p>${escapeHtml(window.PartnerCredentials ? PartnerCredentials.applyPlaceholders(p) : p)}</p>`)
      .join('');

    const leadText =
      doc.lead ||
      (doc.overview && doc.overview.split('.')[0] ? doc.overview.split('.')[0] + '.' : doc.title);

    const extraSections = (doc.additionalSections || []).map(renderAdditionalSection).join('');

    const sec = (doc.labels && doc.labels.sections) || {};

    root.innerHTML = `
      <header class="api-main__header">
        <h1>${escapeHtml(doc.title)}</h1>
        <p class="lead">${escapeHtml(window.PartnerCredentials ? PartnerCredentials.applyPlaceholders(leadText) : leadText)}</p>
      </header>

      <section class="section-anchor" id="section-basic-requirements" aria-labelledby="h-basic">
        <h2 id="h-basic">${escapeHtml(sec.basicRequirements || 'Basic Requirements')}</h2>
        <ul>${reqs}</ul>
      </section>

      <section class="section-anchor" id="section-overview" aria-labelledby="h-overview">
        <h2 id="h-overview">${escapeHtml(sec.overview || 'Overview')}</h2>
        ${overviewHtml}
      </section>

      ${extraSections}

      <section class="section-anchor" id="section-endpoints" aria-labelledby="h-endpoints">
        <h2 id="h-endpoints">${escapeHtml(sec.endpoints || 'Endpoints')}</h2>
        ${endpoints}
      </section>
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
    initLandingDiagram();
    renderApiPage();
    initCredentialsModal();
    updateCredentialsBadge();
  });
})();
