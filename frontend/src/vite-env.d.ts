/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_TIMEOUT: string
  readonly VITE_WS_URL: string
  readonly VITE_WS_RECONNECT_INTERVAL: string
  readonly VITE_WS_MAX_RECONNECT_ATTEMPTS: string
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_VERSION: string
  readonly VITE_ENABLE_WEBSOCKET: string
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_ENABLE_MONITORING: string
  readonly VITE_DEFAULT_PAGE_SIZE: string
  readonly VITE_MAX_PAGE_SIZE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
