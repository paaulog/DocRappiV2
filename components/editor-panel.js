import { store } from '../js/store.js';
import { navigate } from '../js/router.js';
import { getTechnologyLabel } from '../js/tech-registry.js';
import { removeLocalOverride, saveLocalOverride } from '../js/content-loader.js';

const SESSION_KEY = 'docs_editor_authenticated';
const CREDENTIAL_KEY = 'docs_editor_credentials';

function getCredentials() {
  const raw = localStorage.getItem(CREDENTIAL_KEY);
  if (!raw) return { username: 'admin', password: 'rappi123' };
  try {
    const parsed = JSON.parse(raw);
    return {
      username: parsed.username || 'admin',
      password: parsed.password || 'rappi123',
    };
  } catch (_) {
    return { username: 'admin', password: 'rappi123' };
  }
}

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
  const saveBtn = document.getElementById('editor-save-btn');
  const exportBtn = document.getElementById('editor-export-btn');
  const importInput = document.getElementById('editor-import-input');
  const resetBtn = document.getElementById('editor-reset-btn');
  const contentError = document.getElementById('editor-content-error');

  if (!openBtn || !modal || !closeBtn) return;

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

  const setAuthView = () => {
    const isAuthenticated = sessionStorage.getItem(SESSION_KEY) === '1';
    if (loginView) loginView.style.display = isAuthenticated ? 'none' : 'block';
    if (contentView) contentView.style.display = isAuthenticated ? 'block' : 'none';
    if (isAuthenticated && jsonInput) {
      const content = store.get('content');
      jsonInput.value = JSON.stringify(content, null, 2);
    }
  };

  openBtn.addEventListener('click', () => {
    if (loginError) loginError.textContent = '';
    if (contentError) contentError.textContent = '';
    setAuthView();
    openModal();
  });

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', event => {
    if (event.target === modal) closeModal();
  });

  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      const creds = getCredentials();
      const typedUser = userInput?.value.trim();
      const typedPass = passInput?.value;

      if (typedUser === creds.username && typedPass === creds.password) {
        sessionStorage.setItem(SESSION_KEY, '1');
        if (loginError) loginError.textContent = '';
        setAuthView();
      } else if (loginError) {
        loginError.textContent = 'Usuário ou senha inválidos.';
      }
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const lang = store.get('language');
      const tech = store.get('technology');
      try {
        const parsed = JSON.parse(jsonInput?.value || '{}');
        saveLocalOverride(lang, tech, parsed);
        store.set('content', parsed);
        const page = store.get('page');
        if (!parsed.pages?.[page]) {
          navigate(lang, tech, getFirstPageId(parsed));
        }
        if (contentError) contentError.textContent = 'Conteúdo salvo localmente com sucesso.';
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
      if (jsonInput) jsonInput.value = JSON.stringify(data, null, 2);
      if (contentError) contentError.textContent = 'Override local removido.';
    });
  }

  store.on('content', content => {
    if (modal.classList.contains('open') && sessionStorage.getItem(SESSION_KEY) === '1' && jsonInput) {
      jsonInput.value = JSON.stringify(content, null, 2);
    }
  });
}
