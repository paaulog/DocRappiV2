/**
 * store.js — Minimal reactive state store (pub/sub pattern)
 */

class Store {
  constructor(initial) {
    this._state = { ...initial };
    this._listeners = {};
  }

  get(key) {
    return this._state[key];
  }

  set(key, value) {
    if (this._state[key] === value) return;
    this._state[key] = value;
    this._notify(key, value);
  }

  getAll() {
    return { ...this._state };
  }

  /** Subscribe to a specific key change. Returns unsubscribe function. */
  on(key, callback) {
    if (!this._listeners[key]) this._listeners[key] = new Set();
    this._listeners[key].add(callback);
    return () => this._listeners[key].delete(callback);
  }

  /** Subscribe to any change. */
  onChange(callback) {
    return this.on('*', callback);
  }

  _notify(key, value) {
    (this._listeners[key] || new Set()).forEach(cb => cb(value));
    (this._listeners['*'] || new Set()).forEach(cb => cb(key, value));
  }
}

export const store = new Store({
  language:   'pt',
  technology: 'foundations',
  page:       'overview',
  content:    null,     // loaded JSON for current lang+tech
  loading:    false,
  error:      null,
  searchQuery: '',
});
