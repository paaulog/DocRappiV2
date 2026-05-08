/**
 * Locale switcher: swaps first path segment pt-br | en | es while keeping the rest (+ search + hash).
 */
(function () {
  var LOCALES = [
    { code: 'pt-br', label: 'PT-BR' },
    { code: 'en', label: 'EN' },
    { code: 'es', label: 'ES' },
  ];

  function isLocale(seg) {
    for (var j = 0; j < LOCALES.length; j++) {
      if (LOCALES[j].code === seg) return true;
    }
    return false;
  }

  function localeIndex(parts) {
    for (var i = 0; i < parts.length; i++) {
      if (isLocale(parts[i])) return i;
    }
    return -1;
  }

  /** Path segments decodificadas (pathname normalizado com / inicial). */
  function pathParts(loc) {
    var path = loc && typeof loc.pathname === 'string' ? loc.pathname.replace(/\\/g, '/') : '';
    if (!path.length) path = '/';
    if (path.charAt(0) !== '/') path = '/' + path;
    return path.split('/').filter(Boolean);
  }

  function pathnameForLocale(targetLocale, loc) {
    var parts = pathParts(loc);
    var ix = localeIndex(parts);
    var search = loc && typeof loc.search === 'string' ? loc.search : '';
    var hash = loc && typeof loc.hash === 'string' ? loc.hash : '';
    if (ix !== -1) {
      parts[ix] = targetLocale;
      return '/' + parts.join('/') + search + hash;
    }
    return '/' + targetLocale + '/index.html' + search + hash;
  }

  function currentLocale(loc) {
    var parts = pathParts(loc);
    var ix = localeIndex(parts);
    return ix !== -1 ? parts[ix] : null;
  }

  function render(holder, loc) {
    loc = loc || window.location;
    var cur = currentLocale(loc);
    holder.innerHTML = '';
    LOCALES.forEach(function (meta) {
      var a = document.createElement('a');
      a.href = pathnameForLocale(meta.code, loc);
      a.textContent = meta.label;
      a.setAttribute('hreflang', meta.code === 'pt-br' ? 'pt-BR' : meta.code);
      if (cur && meta.code === cur) {
        a.classList.add('is-active');
        a.setAttribute('aria-current', 'true');
      }
      holder.appendChild(a);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-docs-lang-switch]').forEach(function (el) {
      render(el, window.location);
    });
  });
})();
