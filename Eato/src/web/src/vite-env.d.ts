/// <reference types="vite/client" />

// Allow importing global CSS files in TS.
declare module '*.css' {
  const content: string;
  export default content;
}

