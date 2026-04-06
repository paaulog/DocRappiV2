/**
 * Partner credentials — sessionStorage only.
 * Never persisted to disk, never sent to any server.
 */
(function () {
  const STORAGE_KEY = 'partnerCredentials';

  function getCredentials() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function hasCredentials() {
    const c = getCredentials();
    return !!(c.apiKey || c.webhookUrl || c.merchantId || c.storeId);
  }

  function saveCredentials(data) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data || {}));
    window.dispatchEvent(new CustomEvent('partnerCredentialsChanged', { detail: data }));
  }

  function clearCredentials() {
    sessionStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('partnerCredentialsChanged', { detail: {} }));
  }

  /**
   * Replace placeholders in a string with session values.
   * Supported: {{API_KEY}}, {{WEBHOOK_URL}}, {{MERCHANT_ID}}, {{STORE_ID}}
   */
  function applyPlaceholders(str) {
    if (typeof str !== 'string') return str;
    const c = getCredentials();
    const store = c.storeId || c.merchantId;
    return str
      .replace(/\{\{API_KEY\}\}/g, c.apiKey || '{{API_KEY}}')
      .replace(/\{\{WEBHOOK_URL\}\}/g, c.webhookUrl || '{{WEBHOOK_URL}}')
      .replace(/\{\{MERCHANT_ID\}\}/g, c.merchantId || '{{MERCHANT_ID}}')
      .replace(/\{\{STORE_ID\}\}/g, store || '{{STORE_ID}}');
  }

  window.PartnerCredentials = {
    getCredentials,
    hasCredentials,
    saveCredentials,
    clearCredentials,
    applyPlaceholders,
    STORAGE_KEY,
  };
})();
