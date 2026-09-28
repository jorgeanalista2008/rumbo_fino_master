'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User, Bell, Menu } from 'lucide-react';
import { getAuthUser } from '@/lib/api';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const currentUser = getAuthUser();
    setUser(currentUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('rumbo_fino_token');
    localStorage.removeItem('rumbo_fino_user');
    router.push('/login');
  };

  return (
    <header className="h-16 bg-executive-card border-b border-executive-border px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-gray-400 hover:text-white rounded-xl hover:bg-executive-border/50 transition-colors"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 hidden sm:inline">Consola:</span>
          <span className="text-xs font-semibold text-luxury-gold uppercase bg-luxury-gold/10 px-2.5 py-1 rounded-full border border-luxury-gold/20">
            {user?.role || 'SUPER_ADMIN'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications Icon */}
        <button className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-executive-border/50 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-luxury-gold rounded-full animate-ping" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-luxury-gold rounded-full" />
        </button>

        {/* User Info & Avatar */}
        <div className="flex items-center gap-3 border-l border-executive-border pl-4">
          <div className="w-9 h-9 rounded-full bg-executive-border flex items-center justify-center text-luxury-gold font-bold">
            <User className="w-5 h-5" />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-bold text-white leading-none">
              {user ? `${user.firstName} ${user.lastName}` : 'Administrador'}
            </p>
            <p className="text-xs text-gray-400 mt-1">{user?.email || 'admin@rumbofino.com'}</p>
          </div>

          <button
            onClick={handleLogout}
            title="Cerrar Sesión"
            className="ml-2 p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
