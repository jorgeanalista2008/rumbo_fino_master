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
    <header className="h-16 bg-[#0A0A0C] border-b border-[#2C2C32] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-[#8E8E93] hover:text-white rounded-[6px] hover:bg-[#141418] transition-colors"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8E8E93] hidden sm:inline">Consola:</span>
          <span className="text-[11px] font-bold text-[#F5F5F7] uppercase bg-[#141418] px-2.5 py-1 rounded-[6px] border border-[#2C2C32] tracking-wider font-mono">
            {user?.role || 'SUPER_ADMIN'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications Icon */}
        <button className="p-2 text-[#8E8E93] hover:text-white rounded-[6px] hover:bg-[#141418] relative transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-white rounded-full animate-ping" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-white rounded-full" />
        </button>

        {/* User Info & Avatar */}
        <div className="flex items-center gap-3 border-l border-[#2C2C32] pl-4">
          <div className="w-8 h-8 rounded-[6px] bg-[#141418] border border-[#2C2C32] flex items-center justify-center text-[#F5F5F7] font-bold">
            <User className="w-4 h-4" />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold text-[#F5F5F7] leading-none">
              {user ? `${user.firstName} ${user.lastName}` : 'Administrador'}
            </p>
            <p className="text-[10px] text-[#8E8E93] mt-1 font-mono">{user?.email || 'admin@rumbofino.com'}</p>
          </div>

          <button
            onClick={handleLogout}
            title="Cerrar Sesión"
            className="ml-2 p-2 text-[#8E8E93] hover:text-red-400 hover:bg-red-500/10 rounded-[6px] transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
