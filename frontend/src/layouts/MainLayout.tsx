import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Activity, ShieldCheck, Home, LayoutDashboard, LogIn, LogOut, User, Cpu } from 'lucide-react';
import { fetchHealthStatus } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export const MainLayout: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    let isMounted = true;
    const verifyApi = async () => {
      try {
        const res = await fetchHealthStatus();
        if (isMounted && res.success) {
          setApiStatus('online');
        }
      } catch (err) {
        if (isMounted) {
          setApiStatus('offline');
        }
      }
    };

    verifyApi();
    const interval = setInterval(verifyApi, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20">
                P360
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  PeoplePay360
                </span>
                <span className="ml-2 text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                  Auth Active
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-4">
            <Link
              to="/"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                isActive('/')
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>

            <Link
              to="/dashboard"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                isActive('/dashboard')
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>

            {isAuthenticated && user ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
                <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-slate-800/70 border border-slate-700/60 text-xs">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-medium text-slate-200">{user.firstName} {user.lastName}</span>
                  {user.roles && user.roles.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 font-mono text-[10px] border border-cyan-800">
                      {user.roles[0]}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium text-rose-400 hover:bg-rose-950/40 border border-rose-900/40 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium transition ${
                  isActive('/login')
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            )}
          </nav>

          {/* Health Status Indicator */}
          <div className="hidden lg:flex items-center space-x-2 text-xs font-mono bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full">
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">API:</span>
            {apiStatus === 'checking' && (
              <span className="text-amber-400 animate-pulse">Checking...</span>
            )}
            {apiStatus === 'online' && (
              <span className="text-emerald-400 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block"></span>
                <span>Online</span>
              </span>
            )}
            {apiStatus === 'offline' && (
              <span className="text-rose-400 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-rose-400 inline-block"></span>
                <span>Offline</span>
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>PeoplePay360 — HR & Payroll Operations Platform</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>Auth: SQLite + Prisma + JWT</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
