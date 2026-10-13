import "@testing-library/jest-dom/vitest";

// Neither Node 22's stub `localStorage` (undefined without --localstorage-file)
// nor this jsdom provides a working one — polyfill a minimal Storage.
if (typeof globalThis.localStorage?.getItem !== "function") {
  let store = {};
  const ls = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => {
      store[k] = String(v);
    },
    removeItem: (k) => {
      delete store[k];
    },
    clear: () => {
      store = {};
    },
    key: (i) => Object.keys(store)[i] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
  Object.defineProperty(globalThis, "localStorage", { value: ls, configurable: true });
  if (typeof window !== "undefined") {
    Object.defineProperty(window, "localStorage", { value: ls, configurable: true });
  }
}
