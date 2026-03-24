/**
 * sidebar.js — Sidebar: language selector, tech dropdowns, search
 * Navegação por integração abre em dropdown; #nav-tree fica oculto (CSS).
 */

import { store }    from '../js/store.js';
import { navigate } from '../js/router.js';
import {
  TECHNOLOGY_CATEGORIES,
  getTechnologiesByCategory,
  getTechnologyDefaultPage
} from '../js/tech-registry.js';

// ── Language labels ───────────────────────────────────────
const LANG_LABELS = { pt: '🇧🇷 Português', en: '🇺🇸 English', es: '🇪🇸 Español' };

/** Re-render da lista de integrações (filtro / idioma) */
let renderTechArchitecture = () => {};

/** Cache de JSON por idioma/tecnologia para preencher dropdowns sem recarregar a página */
const navCache = new Map();

function cacheKey(lang, tech) {
  return `${lang}/${tech}`;
}

async function loadTechContent(lang, tech) {
  const key = cacheKey(lang, tech);
  if (navCache.has(key)) return navCache.get(key);
  try {
    const url = `content/${lang}/${tech}/data.json`;
    const res = await fetch(url);
    if (!res.ok && lang !== 'en') {
      return loadTechContent('en', tech);
    }
    if (!res.ok) return null;
    const data = await res.json();
    navCache.set(key, data);
    return data;
  } catch {
    return null;
  }
}

/** Usa conteúdo já carregado no store quando for a mesma tech/idioma */
async function getContentForDropdown(lang, tech) {
  if (
    store.get('language') === lang &&
    store.get('technology') === tech &&
    store.get('content')
  ) {
    return store.get('content');
  }
  return loadTechContent(lang, tech);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildDropdownHtml(nav, tech) {
  const groups = nav || [];
  if (!groups.length) {
    return '<div class="tech-nav-empty">Sem itens de navegação.</div>';
  }
  let html = '';
  for (const group of groups) {
    html += `<div class="tech-nav-group">`;
    html += `<div class="tech-nav-group-title">${escapeHtml(group.title)}</div>`;
    for (const item of group.items || []) {
      const method = item.method
        ? `<span class="method-badge ${String(item.method).toLowerCase()}">${escapeHtml(item.method)}</span>`
        : '';
      html += `<button type="button" class="tech-nav-dropdown-item" data-tech="${escapeHtml(tech)}" data-page="${escapeHtml(item.id)}">`;
      html += `${method}<span class="tech-nav-dropdown-label">${escapeHtml(item.title)}</span>`;
      html += `</button>`;
    }
    html += `</div>`;
  }
  return html;
}

function closeAllTechDropdowns() {
  document.querySelectorAll('.tech-row').forEach(row => {
    row.classList.remove('open');
    const dd = row.querySelector('.tech-nav-dropdown');
    const tr = row.querySelector('.tech-row-trigger');
    if (dd) {
      dd.hidden = true;
      dd.setAttribute('aria-hidden', 'true');
    }
    if (tr) {
      tr.setAttribute('aria-expanded', 'false');
    }
  });
}

function syncTechDropdownActiveState() {
  const lang = store.get('language');
  const tech = store.get('technology');
  const page = store.get('page');

  document.querySelectorAll('.tech-row').forEach(row => {
    const rowTech = row.dataset.tech;
    row.classList.toggle('tech-row--current', rowTech === tech);
  });

  document.querySelectorAll('.tech-nav-dropdown-item').forEach(btn => {
    const t = btn.dataset.tech;
    const p = btn.dataset.page;
    btn.classList.toggle('active', t === tech && p === page);
  });

  document.querySelectorAll('.tech-nav-home').forEach(btn => {
    const t = btn.dataset.tech;
    const p = btn.dataset.page;
    btn.classList.toggle('active', t === tech && p === page);
  });

  document.querySelectorAll('.tech-row-trigger').forEach(tr => {
    const row = tr.closest('.tech-row');
    const rowTech = row?.dataset.tech;
    tr.classList.toggle('active', rowTech === tech);
  });
}

// ── Init ──────────────────────────────────────────────────
export function initSidebar() {
  document.body.classList.add('sidebar-dropdown-nav');
  initLanguageSelector();
  initTechDropdowns();
  initSearch();
  initMobileToggle();

  store.on('content', content => {
    const lang = store.get('language');
    const tech = store.get('technology');
    if (content) {
      navCache.set(cacheKey(lang, tech), content);
    }
    syncTechDropdownActiveState();
  });
  store.on('page', () => {
    syncTechDropdownActiveState();
  });

  store.on('language', () => {
    setLangDisplay(store.get('language'));
    navCache.clear();
    renderTechArchitecture();
  });
  store.on('technology', () => {
    syncTechDropdownActiveState();
  });
}

// ── Language selector ─────────────────────────────────────
function initLanguageSelector() {
  const selector  = document.getElementById('lang-selector');
  const btn       = document.getElementById('lang-btn');
  const dropdown  = document.getElementById('lang-dropdown');
  const display   = document.getElementById('lang-display');

  if (!selector || !btn || !dropdown) return;

  btn.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = dropdown.classList.toggle('open');
    selector.classList.toggle('open', isOpen);
  });

  dropdown.querySelectorAll('.select-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const lang = opt.dataset.value;
      dropdown.classList.remove('open');
      selector.classList.remove('open');
      navigate(lang, store.get('technology'), store.get('page'));
    });
  });

  document.addEventListener('click', e => {
    if (!selector.contains(e.target)) {
      dropdown.classList.remove('open');
      selector.classList.remove('open');
    }
  });

  setLangDisplay(store.get('language'));
}

function setLangDisplay(lang) {
  const display = document.getElementById('lang-display');
  if (display) display.textContent = LANG_LABELS[lang] || lang;

  document.querySelectorAll('#lang-dropdown .select-option').forEach(opt => {
    opt.classList.toggle('selected', opt.dataset.value === lang);
  });
}

// ── Technology architecture (dropdowns) ───────────────────
function initTechDropdowns() {
  const pillsWrap = document.getElementById('tech-pills');
  const filterInput = document.getElementById('tech-filter-input');
  if (!pillsWrap) return;

  renderTechArchitecture = () => {
    const query = filterInput?.value || '';
    const lowerQuery = query.toLowerCase().trim();
    const categories = TECHNOLOGY_CATEGORIES.map(category => {
      const technologies = getTechnologiesByCategory(category.id).filter(tech =>
        !lowerQuery ||
        tech.label.toLowerCase().includes(lowerQuery) ||
        tech.id.toLowerCase().includes(lowerQuery) ||
        tech.description.toLowerCase().includes(lowerQuery)
      );
      return { ...category, technologies };
    }).filter(category => category.technologies.length);

    if (!categories.length) {
      pillsWrap.innerHTML = `<div class="tech-empty">Nenhum item para este filtro.</div>`;
      return;
    }

    pillsWrap.innerHTML = categories.map(category => `
      <div class="tech-category">
        <div class="tech-category-title">${escapeHtml(category.label)}</div>
        <div class="tech-category-items">
          ${category.technologies.map(tech => `
            <div class="tech-row" data-tech="${escapeHtml(tech.id)}">
              <button type="button" class="tech-row-trigger" aria-expanded="false" aria-haspopup="true"
                title="${escapeHtml(tech.description)}">
                <span class="tech-pill-title">${escapeHtml(tech.label)}</span>
                <span class="tech-pill-desc">${escapeHtml(tech.description)}</span>
                <svg class="tech-row-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <div class="tech-nav-dropdown" hidden aria-hidden="true" role="menu">
                <div class="tech-nav-dropdown-inner">
                  <div class="tech-nav-loading">Carregando…</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    pillsWrap.querySelectorAll('.tech-row').forEach(row => {
      const tech = row.dataset.tech;
      const trigger = row.querySelector('.tech-row-trigger');
      const dropdown = row.querySelector('.tech-nav-dropdown');
      const inner = row.querySelector('.tech-nav-dropdown-inner');

      trigger.addEventListener('click', async e => {
        e.stopPropagation();
        const isOpen = row.classList.contains('open');
        closeAllTechDropdowns();
        if (isOpen) return;

        row.classList.add('open');
        dropdown.hidden = false;
        dropdown.setAttribute('aria-hidden', 'false');
        trigger.setAttribute('aria-expanded', 'true');

        const lang = store.get('language');
        inner.innerHTML = '<div class="tech-nav-loading">Carregando…</div>';

        const data = await getContentForDropdown(lang, tech);
        if (!data || !data.nav) {
          inner.innerHTML = '<div class="tech-nav-empty">Conteúdo indisponível.</div>';
          return;
        }

        const defaultPage = getTechnologyDefaultPage(tech);
        inner.innerHTML = `
          <button type="button" class="tech-nav-home" data-tech="${escapeHtml(tech)}" data-page="${escapeHtml(defaultPage)}">
            <span class="tech-nav-home-label">Página inicial</span>
            <span class="tech-nav-home-hint">Visão geral da integração</span>
          </button>
          ${buildDropdownHtml(data.nav, tech)}
        `;

        inner.querySelectorAll('.tech-nav-home, .tech-nav-dropdown-item').forEach(btn => {
          btn.addEventListener('click', ev => {
            ev.stopPropagation();
            const t = btn.dataset.tech;
            const p = btn.dataset.page;
            closeAllTechDropdowns();
            navigate(lang, t, p);
          });
        });

        syncTechDropdownActiveState();
      });
    });

    syncTechDropdownActiveState();
  };

  filterInput?.addEventListener('input', () => {
    closeAllTechDropdowns();
    renderTechArchitecture();
  });

  document.addEventListener('click', () => {
    closeAllTechDropdowns();
  });

  pillsWrap.addEventListener('click', e => e.stopPropagation());

  renderTechArchitecture();
}

// ── Nav Tree (mantido para compatibilidade; oculto via CSS) ─
export function renderNavTree(content) {
  const tree = document.getElementById('nav-tree');
  if (!tree || document.body.classList.contains('sidebar-dropdown-nav')) {
    return;
  }
  if (!content) {
    tree.innerHTML = `<div style="padding:16px 18px;font-size:12px;color:#4B5563;">
      Conteúdo não disponível para esta seleção.
    </div>`;
    return;
  }
  tree.innerHTML = '';
  const currentPage = store.get('page');

  for (const group of content.nav || []) {
    const groupEl = document.createElement('div');
    groupEl.className = 'nav-group';
    const hasActive = (group.items || []).some(item => item.id === currentPage);
    if (hasActive || group.expanded) groupEl.classList.add('open');

    groupEl.innerHTML = `
      <div class="nav-group-header">
        ${group.icon ? `<span class="nav-group-icon">${group.icon}</span>` : ''}
        <span>${group.title}</span>
        <svg class="nav-group-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M4 2l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="nav-group-items"></div>`;

    const header = groupEl.querySelector('.nav-group-header');
    const items  = groupEl.querySelector('.nav-group-items');
    header.addEventListener('click', () => groupEl.classList.toggle('open'));

    for (const item of group.items || []) {
      const itemEl = document.createElement('div');
      itemEl.className = 'nav-item' + (item.id === currentPage ? ' active' : '');
      itemEl.dataset.id = item.id;
      const methodHtml = item.method
        ? `<span class="method-badge ${item.method.toLowerCase()}">${item.method}</span>`
        : '';
      itemEl.innerHTML = `<span class="nav-item-label">${item.title}</span>${methodHtml}`;
      itemEl.addEventListener('click', () => {
        navigate(store.get('language'), store.get('technology'), item.id);
      });
      items.appendChild(itemEl);
    }
    tree.appendChild(groupEl);
  }
}

// ── Search ─────────────────────────────────────────────────
function initSearch() {
  const input   = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  const clear   = document.getElementById('search-clear');

  if (!input || !results) return;

  input.addEventListener('input', () => {
    const q = input.value.trim();
    store.set('searchQuery', q);
    if (clear) clear.style.display = q ? 'block' : 'none';
    performSearch(q);
  });

  if (clear) {
    clear.addEventListener('click', () => {
      input.value = '';
      store.set('searchQuery', '');
      clear.style.display = 'none';
      results.innerHTML = '';
    });
  }

  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      input.value = '';
      store.set('searchQuery', '');
      if (clear) clear.style.display = 'none';
      results.innerHTML = '';
      input.blur();
    }
  });
}

function performSearch(query) {
  const results = document.getElementById('search-results');
  if (!results) return;

  if (!query) {
    results.innerHTML = '';
    return;
  }

  const content = store.get('content');
  if (!content) {
    results.innerHTML = `<div class="search-empty">Nenhum conteúdo carregado.</div>`;
    return;
  }

  const q = query.toLowerCase();
  const hits = [];

  for (const group of content.nav || []) {
    for (const item of group.items || []) {
      if (
        item.title.toLowerCase().includes(q) ||
        (item.id && item.id.toLowerCase().includes(q))
      ) {
        hits.push({ ...item, group: group.title });
      }
    }
  }

  if (!hits.length) {
    results.innerHTML = `<div class="search-empty">Nenhum resultado para "<strong>${query}</strong>"</div>`;
    return;
  }

  const methodBadge = m => m
    ? `<span class="search-result-method method-badge ${m.toLowerCase()}">${m}</span>`
    : '';

  results.innerHTML = hits.slice(0, 8).map(hit => `
    <div class="search-result" data-id="${hit.id}" role="listitem">
      <div class="search-result-title">
        ${methodBadge(hit.method)}${hit.title}
      </div>
      <div class="search-result-cat">${hit.group}</div>
    </div>`).join('');

  results.querySelectorAll('.search-result').forEach(el => {
    el.addEventListener('click', () => {
      navigate(store.get('language'), store.get('technology'), el.dataset.id);
      const input = document.getElementById('search-input');
      const clear = document.getElementById('search-clear');
      if (input) input.value = '';
      if (clear) clear.style.display = 'none';
      results.innerHTML = '';
    });
  });
}

// ── Mobile toggle ─────────────────────────────────────────
function initMobileToggle() {
  const toggle   = document.getElementById('sidebar-toggle');
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebar-overlay');

  if (!toggle || !sidebar) return;

  toggle.addEventListener('click', () => {
    const open = sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active', open);
  });

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }

  store.on('page', () => {
    if (window.innerWidth <= 900) {
      sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('active');
    }
  });
}
