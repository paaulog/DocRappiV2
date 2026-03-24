import { store } from '../js/store.js';
import { navigate } from '../js/router.js';
import { getTechnologyLabel } from '../js/tech-registry.js';
import { removeLocalOverride, saveLocalOverride } from '../js/content-loader.js';
import {
  getCurrentSessionUser,
  isSupabaseConfigured,
  saveRemoteContent,
  signInWithEmailPassword,
} from '../js/supabase-client.js';

function getFirstPageId(content) {
  for (const group of content?.nav || []) {
    for (const item of group.items || []) {
      if (item.id) return item.id;
    }
  }
  return 'overview';
}

export function initEditorPanel() {
  const openBtn = document.getElementById('edit-content-btn');
  const modal = document.getElementById('editor-modal');
  const closeBtn = document.getElementById('editor-close-btn');
  const loginView = document.getElementById('editor-login-view');
  const contentView = document.getElementById('editor-content-view');
  const userInput = document.getElementById('editor-username');
  const passInput = document.getElementById('editor-password');
  const loginBtn = document.getElementById('editor-login-btn');
  const loginError = document.getElementById('editor-login-error');
  const title = document.getElementById('editor-title');
  const jsonInput = document.getElementById('editor-json-input');
  const pageSelect = document.getElementById('editor-page-select');
  const pageTitleInput = document.getElementById('editor-page-title');
  const pageDescriptionInput = document.getElementById('editor-page-description');
  const sectionsForm = document.getElementById('editor-sections-form');
  const saveBtn = document.getElementById('editor-save-btn');
  const exportBtn = document.getElementById('editor-export-btn');
  const importInput = document.getElementById('editor-import-input');
  const resetBtn = document.getElementById('editor-reset-btn');
  const contentError = document.getElementById('editor-content-error');

  if (!openBtn || !modal || !closeBtn) return;

  let draftContent = null;

  const getCurrentPageData = () => {
    const pageId = pageSelect?.value || store.get('page');
    return {
      pageId,
      pageData: draftContent?.pages?.[pageId] || null,
    };
  };

  const syncJsonPreview = () => {
    if (jsonInput) {
      jsonInput.value = JSON.stringify(draftContent || {}, null, 2);
    }
  };

  const renderSectionsForm = () => {
    if (!sectionsForm) return;
    const { pageData } = getCurrentPageData();
    if (!pageData) {
      sectionsForm.innerHTML = `<div class="editor-help">Página sem conteúdo carregado.</div>`;
      return;
    }

    const sections = pageData.sections || [];
    if (!sections.length) {
      sectionsForm.innerHTML = `<div class="editor-help">Esta página não possui seções.</div>`;
      return;
    }

    sectionsForm.innerHTML = sections.map((section, index) => `
      <div class="editor-section-card">
        <div class="editor-section-card-title">Seção ${index + 1} · ${section.type}</div>
        ${section.title !== undefined ? `
          <label>Título da seção
            <input type="text" data-section-index="${index}" data-field="title" value="${escapeHtml(section.title || '')}">
          </label>
        ` : ''}
        ${section.content !== undefined ? `
          <label>Conteúdo
            <textarea rows="5" data-section-index="${index}" data-field="content">${escapeHtml(section.content || '')}</textarea>
          </label>
        ` : ''}
        ${section.code !== undefined ? `
          <label>Exemplo de código
            <textarea rows="8" data-section-index="${index}" data-field="code">${escapeHtml(section.code || '')}</textarea>
          </label>
        ` : ''}
        ${section.description !== undefined ? `
          <label>Descrição
            <textarea rows="4" data-section-index="${index}" data-field="description">${escapeHtml(section.description || '')}</textarea>
          </label>
        ` : ''}
      </div>
    `).join('');

    sectionsForm.querySelectorAll('input, textarea').forEach(field => {
      field.addEventListener('input', () => {
        const sectionIndex = Number(field.dataset.sectionIndex);
        const fieldName = field.dataset.field;
        const value = field.value;
        const { pageId } = getCurrentPageData();
        if (!draftContent?.pages?.[pageId]?.sections?.[sectionIndex]) return;
        draftContent.pages[pageId].sections[sectionIndex][fieldName] = value;
        syncJsonPreview();
      });
    });
  };

  const renderPageForm = () => {
    if (!pageSelect || !pageTitleInput || !pageDescriptionInput) return;
    if (!draftContent) return;

    const pageEntries = Object.entries(draftContent.pages || {});
    pageSelect.innerHTML = pageEntries.map(([id, page]) => `
      <option value="${id}">${page.title || id}</option>
    `).join('');

    const currentPage = store.get('page');
    if (draftContent.pages?.[currentPage]) {
      pageSelect.value = currentPage;
    }

    const syncPageFields = () => {
      const { pageData } = getCurrentPageData();
      pageTitleInput.value = pageData?.title || '';
      pageDescriptionInput.value = pageData?.description || '';
      renderSectionsForm();
    };

    pageSelect.onchange = syncPageFields;
    pageTitleInput.oninput = () => {
      const { pageId } = getCurrentPageData();
      if (!draftContent?.pages?.[pageId]) return;
      draftContent.pages[pageId].title = pageTitleInput.value;
      syncJsonPreview();
      const currentText = pageSelect.options[pageSelect.selectedIndex]?.textContent;
      if (currentText !== pageTitleInput.value) {
        pageSelect.options[pageSelect.selectedIndex].textContent = pageTitleInput.value || pageId;
      }
    };
    pageDescriptionInput.oninput = () => {
      const { pageId } = getCurrentPageData();
      if (!draftContent?.pages?.[pageId]) return;
      draftContent.pages[pageId].description = pageDescriptionInput.value;
      syncJsonPreview();
    };

    syncPageFields();
  };

  const hydrateDraft = content => {
    draftContent = structuredClone(content || {});
    renderPageForm();
    syncJsonPreview();
  };

  const setTitle = () => {
    const lang = store.get('language');
    const tech = store.get('technology');
    if (title) title.textContent = `Editor de Conteúdo — ${getTechnologyLabel(tech)} (${lang.toUpperCase()})`;
  };

  const openModal = () => {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    setTitle();
  };

  const closeModal = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  };

  const setAuthView = async () => {
    const apply = isAuthenticated => {
      if (loginView) loginView.style.display = isAuthenticated ? 'none' : 'block';
      if (contentView) contentView.style.display = isAuthenticated ? 'block' : 'none';
      if (isAuthenticated) hydrateDraft(store.get('content'));
    };

    if (!isSupabaseConfigured()) {
      apply(true);
      if (loginError) {
        loginError.textContent = 'Supabase não configurado. Modo local habilitado.';
      }
      return;
    }

    const user = await getCurrentSessionUser();
    apply(Boolean(user));
  };

  openBtn.addEventListener('click', async () => {
    if (loginError) loginError.textContent = '';
    if (contentError) contentError.textContent = '';
    await setAuthView();
    openModal();
  });

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', event => {
    if (event.target === modal) closeModal();
  });

  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      const typedUser = userInput?.value.trim();
      const typedPass = passInput?.value;

      if (!typedUser || !typedPass) {
        if (loginError) loginError.textContent = 'Informe email e senha.';
        return;
      }

      if (!isSupabaseConfigured()) {
        if (loginError) loginError.textContent = '';
        if (loginView) loginView.style.display = 'none';
        if (contentView) contentView.style.display = 'block';
        hydrateDraft(store.get('content'));
        return;
      }

      const result = await signInWithEmailPassword(typedUser, typedPass);
      if (!result.ok) {
        if (loginError) loginError.textContent = `Falha no login: ${result.message}`;
        return;
      }
      if (loginError) loginError.textContent = '';
      if (loginView) loginView.style.display = 'none';
      if (contentView) contentView.style.display = 'block';
      hydrateDraft(store.get('content'));
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const lang = store.get('language');
      const tech = store.get('technology');
      try {
        const parsed = draftContent || JSON.parse(jsonInput?.value || '{}');

        // Keep local copy for resilience/offline behavior.
        saveLocalOverride(lang, tech, parsed);

        if (isSupabaseConfigured()) {
          const user = await getCurrentSessionUser();
          if (!user) {
            if (contentError) contentError.textContent = 'Sessão expirada. Faça login novamente.';
            return;
          }
          const remoteResult = await saveRemoteContent(lang, tech, parsed, user.email);
          if (!remoteResult.ok) {
            if (contentError) contentError.textContent = `Erro ao salvar no Supabase: ${remoteResult.message}`;
            return;
          }
        }

        store.set('content', parsed);
        const page = store.get('page');
        if (!parsed.pages?.[page]) navigate(lang, tech, getFirstPageId(parsed));
        if (contentError) {
          contentError.textContent = isSupabaseConfigured()
            ? 'Conteúdo salvo com sucesso para todos os usuários.'
            : 'Conteúdo salvo localmente (Supabase não configurado).';
        }
      } catch (err) {
        if (contentError) contentError.textContent = `JSON inválido: ${err.message}`;
      }
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const lang = store.get('language');
      const tech = store.get('technology');
      const blob = new Blob([jsonInput?.value || ''], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tech}-${lang}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  if (importInput) {
    importInput.addEventListener('change', async () => {
      const file = importInput.files?.[0];
      if (!file) return;
      const text = await file.text();
      if (jsonInput) jsonInput.value = text;
      importInput.value = '';
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      const lang = store.get('language');
      const tech = store.get('technology');
      removeLocalOverride(lang, tech);
      const url = `content/${lang}/${tech}/data.json`;
      const res = await fetch(url);
      const data = await res.json();
      store.set('content', data);
      hydrateDraft(data);
      if (contentError) contentError.textContent = 'Override local removido.';
    });
  }

  if (jsonInput) {
    jsonInput.addEventListener('input', () => {
      try {
        const parsed = JSON.parse(jsonInput.value || '{}');
        draftContent = parsed;
        renderPageForm();
      } catch (_) {
        // Keep draft untouched while JSON is invalid
      }
    });
  }

  store.on('content', content => {
    if (modal.classList.contains('open')) {
      hydrateDraft(content);
    }
  });
}

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
