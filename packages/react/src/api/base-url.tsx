interface RelayWindowConfig {
  readonly baseUrl?: string;
  readonly authPassword?: string;
}

declare global {
  interface Window {
    readonly executor?: RelayWindowConfig;
  }
}

const DEFAULT_BASE_URL = "http://127.0.0.1:4000";

const resolveInitialBaseUrl = (): string => {
  if (typeof window === "undefined") {
    return `${DEFAULT_BASE_URL}/api`;
  }
  const electronBaseUrl = window.relay?.baseUrl;
  if (electronBaseUrl) {
    // Electron sidecar exposes the localhost server origin (no /api suffix).
    // Append /api to match the on-disk routing layout.
    return electronBaseUrl.replace(/\/$/, "") + "/api";
  }
  if (typeof window.location?.origin === "string") {
    return `${window.location.origin}/api`;
  }
  return `${DEFAULT_BASE_URL}/api`;
};

let baseUrl = resolveInitialBaseUrl();

export const getBaseUrl = (): string => baseUrl;

export const setBaseUrl = (url: string): void => {
  baseUrl = url;
};

export const getAuthPassword = (): string | null => {
  if (typeof window === "undefined") return null;
  return window.relay?.authPassword ?? null;
};
