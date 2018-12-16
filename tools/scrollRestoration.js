import { dew } from "tools/common";
import { is } from "tools/extensions/common";

export const canScrollRestore = dew(() => {
  if (typeof window === "undefined") return false;
  if (typeof window.sessionStorage === "undefined") return false;
  return window.history.scrollRestoration::is.string();
});