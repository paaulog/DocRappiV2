/**
 * breadcrumb.js — Sticky breadcrumb navigation
 */

import { navigate } from '../js/router.js';
import { getTechnologyLabel } from '../js/tech-registry.js';

/**
 * Render breadcrumb into #breadcrumb element.
 * @param {object} state  - { language, technology, page }
 * @param {object} content - loaded JSON content
 */
export function renderBreadcrumb(state, content) {
  const el = document.getElementById('breadcrumb');
  const itemsEl = document.getElementById('breadcrumb-items');
  if (!el) return;

  const { language, technology, page } = state;

  if (!content) {
    if (itemsEl) itemsEl.innerHTML = '';
    return;
  }

  // Find current group and item labels
  let groupTitle = '';
  let pageTitle  = '';

  for (const group of content.nav || []) {
    for (const item of group.items || []) {
      if (item.id === page) {
        groupTitle = group.title;
        pageTitle  = item.title;
        break;
      }
    }
    if (pageTitle) break;
  }

  // Fallback: look in pages map
  if (!pageTitle && content.pages?.[page]) {
    pageTitle = content.pages[page].title;
  }

  const techLabel = getTechnologyLabel(technology);

  const parts = [];

  parts.push(`<span class="breadcrumb-item" data-nav="overview">Docs</span>`);
  parts.push(`<span class="breadcrumb-sep">›</span>`);
  parts.push(`<span class="breadcrumb-item">${techLabel}</span>`);

  if (groupTitle) {
    parts.push(`<span class="breadcrumb-sep">›</span>`);
    parts.push(`<span class="breadcrumb-item">${groupTitle}</span>`);
  }

  if (pageTitle && pageTitle !== 'Docs') {
    parts.push(`<span class="breadcrumb-sep">›</span>`);
    parts.push(`<span class="breadcrumb-current">${pageTitle}</span>`);
  }

  if (itemsEl) {
    itemsEl.innerHTML = parts.join('');
  } else {
    el.innerHTML = parts.join('');
  }

  // Click to navigate
  (itemsEl || el).querySelectorAll('[data-nav]').forEach(item => {
    item.addEventListener('click', () => {
      navigate(language, technology, item.dataset.nav);
    });
  });
}
