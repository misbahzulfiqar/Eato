import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getAdminAppBaseUrl } from '../lib/adminAppUrl';

type Props =
  | { path: '/login/admin' }
  | { path: 'current'; /** set via react-router when redirecting under `/admin/*` */ };

export default function AdminPortalRedirect(props: Props) {
  const location = useLocation();
  const [showConfigHint, setShowConfigHint] = useState(false);

  const targetPath =
    props.path === 'current' ? `${location.pathname}${location.search}${location.hash}` : props.path;

  useEffect(() => {
    const base = getAdminAppBaseUrl();
    if (base) {
      window.location.replace(`${base}${targetPath}`);
      return;
    }
    setShowConfigHint(true);
  }, [targetPath]);

  if (showConfigHint) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-stone-50 px-4 text-center text-stone-700">
        <p className="text-lg font-semibold">Admin console URL not configured</p>
        <p className="max-w-md text-sm text-stone-600">
          Set <code className="rounded bg-stone-200 px-1">VITE_ADMIN_APP_URL</code> to the deployed admin app origin (for example{' '}
          <code className="rounded bg-stone-200 px-1">https://admin.example.com</code>), then rebuild the storefront.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 text-stone-600">Opening admin console…</div>
  );
}
