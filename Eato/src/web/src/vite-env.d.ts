/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend base URL without path (e.g. `https://api.railway.app`). Requests go to `${origin}/api/...`. */
  readonly VITE_API_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Allow importing global CSS files in TS.
declare module '*.css' {
  const content: string;
  export default content;
}

