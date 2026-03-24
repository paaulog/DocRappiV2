/**
 * router.js — Hash-based SPA router
 * URL format: #/{lang}/{technology}/{pageId}
 * e.g.: #/pt/rest/list-orders
 */

import { store } from './store.js';

const DEFAULTS = { lang: 'pt', tech: 'foundations', page: 'overview' };

/** Rotas antigas (REST/GraphQL/Webhook como “tecnologia”) redirecionam para Fundamentos */
const LEGACY_TECH_REDIRECT = {
  rest: 'foundations',
  graphql: 'foundations',
  webhook: 'foundations',
};

function parseHash() {
  const raw = window.location.hash.slice(1) || '';
  const parts = raw.split('/').filter(Boolean);
  let lang = parts[0] || DEFAULTS.lang;
  let tech = parts[1] || DEFAULTS.tech;
  let page = parts[2] || DEFAULTS.page;
  if (LEGACY_TECH_REDIRECT[tech]) {
    tech = LEGACY_TECH_REDIRECT[tech];
    page = 'overview';
  }
  return { lang, tech, page };
}

function needsLegacyRedirect() {
  const raw = window.location.hash.slice(1) || '';
  const parts = raw.split('/').filter(Boolean);
  return parts[1] && LEGACY_TECH_REDIRECT[parts[1]];
}

function applyHash({ lang, tech, page }) {
  store.set('language',   lang);
  store.set('technology', tech);
  store.set('page',       page);
}

export function navigate(lang, tech, page) {
  const newHash = `#/${lang}/${tech}/${page}`;
  if (window.location.hash !== newHash) {
    window.location.hash = newHash;
  } else {
    applyHash({ lang, tech, page });
  }
}

export function initRouter() {
  window.addEventListener('hashchange', () => applyHash(parseHash()));
  if (needsLegacyRedirect()) {
    const p = parseHash();
    window.history.replaceState(null, '', `#/${p.lang}/${p.tech}/${p.page}`);
  }
  applyHash(parseHash());
}
