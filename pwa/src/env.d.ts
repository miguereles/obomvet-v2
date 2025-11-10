/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_PUSHER_APP_KEY: string
  readonly VITE_PUSHER_APP_CLUSTER: string
  readonly DEV: boolean
  readonly VITE_PUBLIC_IA_KEY: string // ✅ ADICIONE ESTA LINHA
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}