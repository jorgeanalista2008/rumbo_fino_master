'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { PermissionsProvider } from '@/lib/PermissionsContext';
import PermissionGuard from '@/components/PermissionGuard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [isRestrictedRole, setIsRestrictedRole] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('rumbo_fino_token');
    const userStr = localStorage.getItem('rumbo_fino_user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      const role = (user.role || '').toUpperCase();
      if (role === 'PASSENGER' || role === 'DRIVER') {
        setIsRestrictedRole(true);
        setAuthorized(false);
        return;
      }
    } catch (_) {}

    setAuthorized(true);
  }, [router]);

  if (isRestrictedRole) {
    return (
      <div className="min-h-screen bg-executive-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-executive-card border border-red-500/30 rounded-3xl p-8 shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto shadow-lg shadow-red-500/10">
            <span className="text-3xl">🚫</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Acceso Restringido</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Esta consola web está destinada exclusivamente al personal administrativo (Super Admin, Flota, Despacho y Auditoría).
            </p>
            <p className="text-xs text-luxury-gold font-semibold pt-1">
              Los Pasajeros y Choferes deben utilizar la aplicación móvil Rumbo Fino.
            </p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('rumbo_fino_token');
              localStorage.removeItem('rumbo_fino_user');
              router.push('/login');
            }}
            className="w-full py-3 px-4 bg-luxury-gold hover:bg-luxury-gold-hover text-black font-extrabold text-xs rounded-xl shadow-lg shadow-luxury-gold/20 transition-all"
          >
            Cerrar Sesión e Ir al Login
          </button>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-executive-dark flex items-center justify-center">
        <p className="text-gray-400 text-sm">Verificando sesión...</p>
      </div>
    );
  }

  return (
    <PermissionsProvider>
      <div className="flex min-h-screen bg-executive-dark overflow-x-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
          <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
          <main className="flex-1 p-3.5 sm:p-5 md:p-6 overflow-y-auto w-full max-w-full">
            <PermissionGuard>{children}</PermissionGuard>
          </main>
        </div>
      </div>
    </PermissionsProvider>
  );
}
