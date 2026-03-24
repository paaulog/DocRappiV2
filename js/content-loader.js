/**
 * content-loader.js — Fetches and caches JSON content files
 */

const cache = new Map();
const OVERRIDE_PREFIX = 'docs_override_';

function getOverrideKey(language, technology) {
  return `${OVERRIDE_PREFIX}${language}_${technology}`;
}

/**
 * Load content for a given language + technology.
 * Returns null if not found or on error.
 */
export async function loadContent(language, technology) {
  const key = `${language}/${technology}`;

  if (cache.has(key)) return cache.get(key);

  try {
    const localOverride = localStorage.getItem(getOverrideKey(language, technology));
    if (localOverride) {
      const parsedOverride = JSON.parse(localOverride);
      cache.set(key, parsedOverride);
      return parsedOverride;
    }

    const url = `content/${language}/${technology}/data.json`;
    const res = await fetch(url);

    if (!res.ok) {
      // Try fallback to English if requested lang not found
      if (language !== 'en') {
        return loadContent('en', technology);
      }
      throw new Error(`HTTP ${res.status} — ${url}`);
    }

    const data = await res.json();
    cache.set(key, data);
    return data;

  } catch (err) {
    console.warn('[content-loader] Failed to load:', err.message);
    return null;
  }
}

/** Invalidate cache for a key (useful if content might change) */
export function invalidateCache(language, technology) {
  cache.delete(`${language}/${technology}`);
}

export function saveLocalOverride(language, technology, content) {
  localStorage.setItem(getOverrideKey(language, technology), JSON.stringify(content));
  invalidateCache(language, technology);
}

export function removeLocalOverride(language, technology) {
  localStorage.removeItem(getOverrideKey(language, technology));
  invalidateCache(language, technology);
}
