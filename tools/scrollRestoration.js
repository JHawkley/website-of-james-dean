import { dew, is } from "tools/common";

export const canScrollRestore = dew(() => {
  // Assume scroll-restoration is available when on the server.
  if (!process.browser) return true;
  // Otherwise, test the browser's capabilities.
  if (typeof window.sessionStorage === "undefined") return false;
  return window.history.scrollRestoration::is.string();
});