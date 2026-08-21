import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Toaster } from 'react-hot-toast';
import { useSettingsStore } from '../../store/settings';
import { useEffect } from 'react';

export function AppShell() {
  const { theme } = useSettingsStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col min-h-screen p-4 md:p-6 lg:p-8 pb-24 md:pb-8 overflow-x-hidden">
        <div className="flex-1 max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
      <BottomNav />
      <Toaster 
        position="bottom-center"
        toastOptions={{
          className: '!bg-card/80 !backdrop-blur-md !text-foreground !border !border-border !shadow-lg !rounded-xl',
          duration: 3000,
        }}
      />
    </div>
  );
}
