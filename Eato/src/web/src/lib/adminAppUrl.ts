/** Base URL of the standalone admin app (`src/admin`). Override in production with `VITE_ADMIN_APP_URL`. */
export function getAdminAppBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_ADMIN_APP_URL as string | undefined;
  if (fromEnv?.trim()) return fromEnv.replace(/\/$/, '');
  if (import.meta.env.DEV) return 'http://localhost:3001';
  return '';
}
