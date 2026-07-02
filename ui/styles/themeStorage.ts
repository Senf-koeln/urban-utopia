/**
 * Persists the current base theme color (--action-primary-default value) so
 * components like Switch can read it without depending on DOM/computed style.
 * useThemeColor writes; Switch (and others) read and subscribe for updates.
 */

export const THEME_BASE_COLOR_STORAGE_KEY = "urban-utopia-theme-base-color";

export const THEME_COLOR_UPDATED_EVENT = "urban-utopia-theme-color-updated";

export function getStoredThemeBaseColor(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(THEME_BASE_COLOR_STORAGE_KEY);
}

export function setStoredThemeBaseColor(value: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_BASE_COLOR_STORAGE_KEY, value);
  window.dispatchEvent(new CustomEvent(THEME_COLOR_UPDATED_EVENT));
}
