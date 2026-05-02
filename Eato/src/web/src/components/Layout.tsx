import { Outlet } from 'react-router-dom';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
import ScrollToTop from './ScrollToTop';

export default function Layout() {
  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden font-sans text-stone-800">
      <ScrollToTop />
      <SiteHeader />
      <main className="w-full min-w-0 flex-1 bg-surface-canvas">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}

