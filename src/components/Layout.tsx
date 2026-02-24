import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  HelpCircle,
  Calendar,
  Settings,
  Clock,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  MoreHorizontal,
  Timer as TimerIcon,
} from 'lucide-react';
import { useStore } from '@/store';
import { formatTime } from '@/utils/helpers';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Matérias', href: '/subjects', icon: BookOpen },
  { name: 'Anotações', href: '/notes', icon: FileText },
  { name: 'Questões', href: '/questions', icon: HelpCircle },
  { name: 'Revisões', href: '/reviews', icon: Calendar },
  { name: 'Sessões', href: '/study', icon: Clock },
  { name: 'Temporizador', href: '/timer', icon: Clock },
  { name: 'Configurações', href: '/settings', icon: Settings },
];

interface LayoutProps {
  children: React.ReactNode;
}

type MobileNavItem =
  | { name: string; href: string; icon: LucideIcon; isMore?: false }
  | { name: string; icon: LucideIcon; isMore: true };

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const {
    timerSeconds,
    timerIsRunning,
    startTimer,
    pauseTimer,
    profiles,
    activeProfileId,
    loadProfiles,
    setActiveProfile,
  } = useStore();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const stored = window.localStorage.getItem('focus.sidebar.collapsed');
      return stored === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    window.localStorage.setItem('focus.sidebar.collapsed', String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    setIsMoreOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  useEffect(() => {
    if (!timerIsRunning) return;
    const interval = setInterval(() => {
      useStore.getState().tickTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [timerIsRunning]);

  const mobilePrimaryRoutes = new Set(['/', '/subjects', '/study', '/timer']);
  const mobileNavigation: MobileNavItem[] = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Matérias', href: '/subjects', icon: BookOpen },
    { name: 'Sessões', href: '/study', icon: Clock },
    { name: 'Temporizador', href: '/timer', icon: TimerIcon },
    { name: 'Mais', icon: MoreHorizontal, isMore: true },
  ];
  const overflowNavigation = navigation.filter(
    (item) => !mobilePrimaryRoutes.has(item.href)
  );
  const isOverflowActive = overflowNavigation.some(
    (item) => item.href === location.pathname
  );

  return (
    <div className="min-h-screen bg-true-black text-true-white flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside
        className={`hidden md:flex md:sticky md:top-0 h-screen border-r border-gray-800 flex-col transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          {!isCollapsed ? (
            <div>
              <h1 className="text-2xl font-bold tracking-tight">FOCUS</h1>
              <p className="text-sm text-gray-400 mt-1">Estude. Revise. Evolua.</p>
            </div>
          ) : (
            <span className="text-xl font-bold">F</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${
                    isActive
                      ? 'bg-true-white text-true-black'
                      : 'text-gray-400 hover:text-true-white hover:bg-gray-900'
                  }
                `}
              >
                <Icon size={20} />
                {!isCollapsed && <span className="font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 pb-4">
          <button
            type="button"
            aria-label={isCollapsed ? 'Expandir menu' : 'Minimizar menu'}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:text-true-white hover:bg-gray-900 transition-colors ${
              isCollapsed ? 'mt-2' : ''
            }`}
            onClick={() => setIsCollapsed((prev) => !prev)}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!isCollapsed && <span className="text-sm font-medium">Recolher menu</span>}
          </button>
        </div>

        {/* Timer Widget */}
        <div className="px-4 pb-4">
          <div
            className={`bg-gray-900 border border-gray-800 rounded-lg px-3 py-3 flex ${
              isCollapsed ? 'flex-col items-center gap-2' : 'items-center justify-between'
            }`}
          >
            <div className="text-xs text-gray-400 text-center">
              {!isCollapsed && <span className="block">Temporizador</span>}
              <span className="text-base font-semibold text-true-white">
                {formatTime(timerSeconds)}
              </span>
            </div>
            <button
              type="button"
              aria-label={timerIsRunning ? 'Pausar temporizador' : 'Iniciar temporizador'}
              className="p-2 rounded-md text-gray-400 hover:text-true-white hover:bg-gray-800 transition-colors"
              onClick={() => (timerIsRunning ? pauseTimer() : startTimer())}
            >
              {timerIsRunning ? <Pause size={16} /> : <Play size={16} />}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 text-xs text-gray-500">
          {isCollapsed ? (
            <p>v1.0</p>
          ) : (
            <>
              <p>FOCUS v1.0.0</p>
              <p className="mt-1">Offline-first study platform</p>
            </>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-mobile-nav md:pb-0">
        <div className="sticky top-0 z-40 bg-true-black border-b border-gray-800">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="text-sm text-gray-400">FOCUS</div>
            <div className="flex items-center gap-2">
              {profiles.length > 0 && (
                <select
                  value={activeProfileId || ''}
                  onChange={(event) => setActiveProfile(event.target.value)}
                  className="px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-true-white"
                >
                  <option value="" disabled>
                    Selecionar perfil
                  </option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.avatar ? `${profile.avatar} ` : ''}{profile.name}
                    </option>
                  ))}
                </select>
              )}
              <Link to="/profiles" className="text-xs text-gray-400 hover:text-true-white">
                Gerenciar perfis
              </Link>
            </div>
          </div>
        </div>
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-gray-800 bg-true-black/95 backdrop-blur z-50">
        {isMoreOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-2 px-3">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-2 grid gap-1 shadow-lg">
              {overflowNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMoreOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-true-white text-true-black'
                        : 'text-gray-300 hover:text-true-white hover:bg-gray-800'
                    }`}
                  >
                    <Icon size={16} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-around px-2 py-2 pb-safe">
          {mobileNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = item.isMore
              ? isOverflowActive
              : location.pathname === item.href;
            const baseClasses =
              'flex flex-col items-center justify-center gap-1 text-xs font-medium px-2 py-1 rounded-md transition-colors';
            const stateClasses = isActive
              ? 'bg-true-white text-true-black'
              : 'text-gray-400 hover:text-true-white hover:bg-gray-900';

            if (item.isMore) {
              return (
                <button
                  key={item.name}
                  type="button"
                  aria-label="Abrir menu adicional"
                  aria-expanded={isMoreOpen}
                  onClick={() => setIsMoreOpen((prev) => !prev)}
                  className={`${baseClasses} ${stateClasses}`}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.name}
                to={item.href}
                className={`${baseClasses} ${stateClasses}`}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
