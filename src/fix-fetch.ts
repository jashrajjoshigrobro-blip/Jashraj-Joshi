// Fix for "Cannot set property fetch of #<Window> which has only a getter"
// This happens when libraries like jsPDF try to overwrite window.fetch
const originalFetch = window.fetch;
Object.defineProperty(window, 'fetch', {
  configurable: true,
  writable: true,
  value: function fetchWrapper(...args: Parameters<typeof originalFetch>) {
    return originalFetch.apply(this, args);
  }
});
