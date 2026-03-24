/**
 * content-view.js — Renders a page's content from JSON data
 */

import { createCodeBlock } from './code-block.js';

/**
 * Render a full page into #content-view.
 * @param {object} pageData - The page object from content JSON
 */
export function renderPage(pageData) {
  const el = document.getElementById('content-view');
  if (!el) return;

  if (!pageData) {
    el.innerHTML = `
      <div class="error-state">
        <h3>Página não encontrada</h3>
        <p>O endpoint solicitado não existe nesta documentação.</p>
      </div>`;
    return;
  }

  const frag = document.createDocumentFragment();

  // ── Page header ──────────────────────────────────────────
  const header = document.createElement('div');
  header.className = 'page-header';

  let headerTop = '';
  if (pageData.method) {
    headerTop += `<span class="method-pill ${pageData.method.toLowerCase()}">${pageData.method}</span>`;
  }
  if (pageData.endpoint) {
    headerTop += `<code class="endpoint-url">${pageData.endpoint}</code>`;
  }

  header.innerHTML = `
    ${headerTop ? `<div class="page-header-top">${headerTop}</div>` : ''}
    <h1 class="page-title">${pageData.title}</h1>
    ${pageData.description ? `<p class="page-description">${pageData.description}</p>` : ''}
  `;
  frag.appendChild(header);

  // ── Sections ─────────────────────────────────────────────
  for (const section of pageData.sections || []) {
    const secEl = renderSection(section);
    if (secEl) frag.appendChild(secEl);
  }

  el.innerHTML = '';
  el.appendChild(frag);
  el.scrollTop = 0;
  window.scrollTo(0, 0);
}

/** Render a single section based on its type */
function renderSection(section) {
  const wrap = document.createElement('div');
  wrap.className = 'page-section';

  switch (section.type) {

    case 'text': {
      if (section.title) wrap.appendChild(sectionTitle(section.title));
      const prose = document.createElement('div');
      prose.className = 'prose';
      prose.innerHTML = mdToHtml(section.content || '');
      wrap.appendChild(prose);
      break;
    }

    case 'callout': {
      const icons = { info: 'ℹ️', warning: '⚠️', danger: '🚨', success: '✅' };
      const variant = section.variant || 'info';
      const box = document.createElement('div');
      box.className = `callout ${variant}`;
      box.innerHTML = `
        <div class="callout-icon">${icons[variant] || 'ℹ️'}</div>
        <div class="callout-body">
          ${section.title ? `<div class="callout-title">${section.title}</div>` : ''}
          <div class="callout-content">${mdToHtml(section.content || '')}</div>
        </div>`;
      wrap.appendChild(box);
      break;
    }

    case 'code': {
      if (section.title) wrap.appendChild(sectionTitle(section.title));
      wrap.appendChild(createCodeBlock({
        lang:  section.lang  || 'bash',
        title: section.label || '',
        code:  section.code  || '',
      }));
      break;
    }

    case 'cards': {
      if (section.title) wrap.appendChild(sectionTitle(section.title));
      const grid = document.createElement('div');
      grid.className = 'cards-grid';
      for (const card of section.items || []) {
        const c = document.createElement('div');
        c.className = 'feature-card';
        c.innerHTML = `
          <div class="feature-card-icon">${card.icon || '📄'}</div>
          <div class="feature-card-title">${card.title}</div>
          <div class="feature-card-text">${card.text}</div>`;
        grid.appendChild(c);
      }
      wrap.appendChild(grid);
      break;
    }

    case 'params': {
      wrap.appendChild(sectionTitle(section.title || 'Parâmetros'));
      const table = document.createElement('table');
      table.className = 'params-table';
      table.innerHTML = `
        <thead>
          <tr>
            <th>Nome</th><th>Tipo</th><th>Obrigatório</th><th>Descrição</th>
          </tr>
        </thead>
        <tbody>
          ${(section.rows || []).map(row => `
            <tr>
              <td><span class="param-name">${row.name}</span></td>
              <td><span class="param-type">${row.type}</span></td>
              <td><span class="${row.required ? 'badge-req' : 'badge-opt'}">${row.required ? 'Sim' : 'Não'}</span></td>
              <td>${row.description}</td>
            </tr>`).join('')}
        </tbody>`;
      wrap.appendChild(table);
      break;
    }

    case 'errors': {
      wrap.appendChild(sectionTitle(section.title || 'Erros Possíveis'));
      const table = document.createElement('table');
      table.className = 'errors-table';
      table.innerHTML = `
        <thead>
          <tr><th>Código</th><th>Status</th><th>Descrição</th></tr>
        </thead>
        <tbody>
          ${(section.rows || []).map(row => {
            const cls = String(row.code).startsWith('5') ? 'err-5xx' : 'err-4xx';
            return `<tr>
              <td><span class="err-code ${cls}">${row.code}</span></td>
              <td class="err-status">${row.status}</td>
              <td>${row.description}</td>
            </tr>`;
          }).join('')}
        </tbody>`;
      wrap.appendChild(table);
      break;
    }

    case 'steps': {
      if (section.title) wrap.appendChild(sectionTitle(section.title));
      const stepsEl = document.createElement('div');
      stepsEl.className = 'steps';
      (section.items || []).forEach((step, i) => {
        const s = document.createElement('div');
        s.className = 'step';
        s.innerHTML = `
          <div class="step-num">${i + 1}</div>
          <div class="step-body">
            <div class="step-title">${step.title}</div>
            <div class="step-text">${mdToHtml(step.text || '')}</div>
          </div>`;
        stepsEl.appendChild(s);
      });
      wrap.appendChild(stepsEl);
      break;
    }

    case 'kv': {
      if (section.title) wrap.appendChild(sectionTitle(section.title));
      const list = document.createElement('div');
      list.className = 'kv-list';
      for (const item of section.items || []) {
        const row = document.createElement('div');
        row.className = 'kv-item';
        row.innerHTML = `
          <span class="kv-label">${item.label}</span>
          <span class="kv-value">${item.value}</span>`;
        list.appendChild(row);
      }
      wrap.appendChild(list);
      break;
    }

    case 'status-flow': {
      if (section.title) wrap.appendChild(sectionTitle(section.title));
      const flow = document.createElement('div');
      flow.className = 'status-flow';
      (section.states || []).forEach((state, i) => {
        const node = document.createElement('div');
        node.className = 'status-node';
        node.innerHTML = `
          ${i > 0 ? '<span class="status-arrow">→</span>' : ''}
          <span class="status-badge">${state}</span>`;
        flow.appendChild(node);
      });
      wrap.appendChild(flow);
      break;
    }

    default:
      return null;
  }

  return wrap;
}

/** Render a section title element */
function sectionTitle(text) {
  const h2 = document.createElement('h2');
  h2.className = 'section-title';
  h2.textContent = text;
  return h2;
}

/**
 * Minimal Markdown-to-HTML converter.
 * Supports: **bold**, *italic*, `code`, [link](url), line breaks
 */
function mdToHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    // Double newline → paragraph
    .replace(/\n\n/g, '</p><p>')
    // Single newline → <br>
    .replace(/\n/g, '<br>')
    // Wrap in paragraph
    .replace(/^(.+)$/, '<p>$1</p>');
}

/** Show loading state */
export function showLoading() {
  const el = document.getElementById('content-view');
  if (el) {
    el.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Carregando...</p>
      </div>`;
  }
}

/** Show error state */
export function showError(message) {
  const el = document.getElementById('content-view');
  if (el) {
    el.innerHTML = `
      <div class="error-state">
        <h3>Erro ao carregar conteúdo</h3>
        <p>${message || 'Verifique sua conexão e tente novamente.'}</p>
      </div>`;
  }
}
