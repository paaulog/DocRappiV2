/**
 * app.js — Application entry point
 *
 * Bootstraps the router, store, sidebar, and content rendering pipeline.
 * All content is loaded dynamically from JSON files under /content/.
 */

import { store }          from './store.js';
import { initRouter, navigate } from './router.js';
import { loadContent }    from './content-loader.js';
import { initSidebar, renderNavTree } from '../components/sidebar.js';
import { renderPage, showLoading, showError } from '../components/content-view.js';
import { renderBreadcrumb } from '../components/breadcrumb.js';
import { initEditorPanel } from '../components/editor-panel.js';
import { initThemeToggle } from './theme.js';

// ── Bootstrap ─────────────────────────────────────────────
async function bootstrap() {
  initSidebar();
  initRouter();
  initEditorPanel();
  initThemeToggle();

  // React to language or technology changes → reload content JSON
  store.on('language',   () => loadAndRender());
  store.on('technology', () => loadAndRender());
  store.on('page',       () => renderCurrentPage());

  // Initial load
  await loadAndRender();
}

// ── Load content JSON + render current page ───────────────
async function loadAndRender() {
  const lang = store.get('language');
  const tech = store.get('technology');

  showLoading();

  const content = await loadContent(lang, tech);

  store.set('content', content);

  if (!content) {
    showError(`Documentação não disponível para ${lang.toUpperCase()} / ${tech.toUpperCase()}.`);
    renderBreadcrumb(store.getAll(), null);
    return;
  }

  renderNavTree(content);
  renderCurrentPage();
}

// ── Render the current page from loaded content ───────────
function renderCurrentPage() {
  const content = store.get('content');
  const page    = store.get('page');
  const state   = store.getAll();

  if (!content) return;

  const pageData = content.pages?.[page];
  renderPage(pageData);
  renderBreadcrumb(state, content);

  // Update document title
  if (pageData) {
    document.title = `${pageData.title} — API Docs Portal`;
  }
}

// ── Start ─────────────────────────────────────────────────
bootstrap().catch(err => {
  console.error('[app] Bootstrap failed:', err);
  showError('Erro inesperado ao inicializar a aplicação.');
});
