const THEME_STORAGE_KEY = 'docs_theme';

function getPreferredTheme() {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function applyTheme(theme) {
  document.body.classList.toggle('theme-dark', theme === 'dark');
}

function setThemeButtonLabel(theme) {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.textContent = `Tema: ${theme === 'dark' ? 'Escuro' : 'Claro'}`;
}

export function initThemeToggle() {
  const theme = getPreferredTheme();
  applyTheme(theme);
  setThemeButtonLabel(theme);

  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const current = document.body.classList.contains('theme-dark') ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_STORAGE_KEY, next);
    applyTheme(next);
    setThemeButtonLabel(next);
  });
}

