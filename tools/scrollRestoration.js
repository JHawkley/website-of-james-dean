import { dew, is } from "tools/common";

export const canScrollRestore = dew(() => {
  // Assume scroll-restoration is available when on the server.
  // This is untrue, and using these features would cause errors on the server,
  // but we want to assume the most likely case during server-side rendering.
  // Users of `canScrollRestore` must guard against this discrepancy.
  if (!process.browser) return true;
  // Otherwise, test the browser's capabilities.
  if (typeof window.sessionStorage === "undefined") return false;
  return window.history.scrollRestoration::is.string();
});