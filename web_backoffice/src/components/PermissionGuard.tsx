'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft, LogOut, Lock } from 'lucide-react';
import { usePermissions } from '@/lib/PermissionsContext';

interface PermissionGuardProps {
  children: React.ReactNode;
}

export default function PermissionGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, permissions, loading, hasRouteAccess } = usePermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-luxury-gold/20 border-t-luxury-gold rounded-full animate-spin" />
          <p className="text-xs text-gray-400 uppercase tracking-widest font-mono">Verificando credenciales...</p>
        </div>
      </div>
    );
  }

  // Super admin always has full access
  if (user?.role === 'SUPER_ADMIN') {
    return <>{children}</>;
  }

  const isAllowed = hasRouteAccess(pathname);

  if (!isAllowed) {
    const firstAllowedRoute = permissions?.allowedRoutes?.[0] || '/dashboard';

    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-executive-card border border-red-500/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-luxury-gold/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col items-center text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shadow-lg shadow-red-500/10 animate-pulse">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
                <ShieldAlert className="w-3.5 h-3.5" />
                Acceso Restringido por Perfil
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Módulo No Autorizado
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed max-w-sm mx-auto">
                Tu perfil actual <span className="text-luxury-gold font-bold">({permissions?.displayName || user?.role || 'Usuario'})</span> no tiene asignados los permisos necesarios para interactuar con la pantalla <code className="px-2 py-0.5 rounded bg-black/60 text-white font-mono text-[11px] border border-executive-border">{pathname}</code>.
              </p>
            </div>

            <div className="w-full bg-executive-dark/70 rounded-2xl p-4 border border-executive-border/60 text-left space-y-2">
              <p className="text-[11px] font-semibold text-gray-300">
                🛡️ ¿Por qué veo esta pantalla?
              </p>
              <p className="text-[11px] text-gray-400">
                El sistema de control de acceso por roles (RBAC) de Rumbo Fino restringe la visualización de rutas según las directrices asignadas por la administración central.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
              <button
                onClick={() => router.push(firstAllowedRoute)}
                className="w-full sm:flex-1 py-3 px-4 bg-luxury-gold hover:bg-yellow-500 text-black font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-luxury-gold/20"
              >
                <ArrowLeft className="w-4 h-4" />
                Ir a mi Módulo Principal
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('rumbo_fino_token');
                  localStorage.removeItem('rumbo_fino_user');
                  router.push('/login');
                }}
                className="w-full sm:w-auto py-3 px-4 bg-executive-border/50 hover:bg-red-500/20 hover:text-red-400 text-gray-300 font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                title="Cambiar de cuenta"
              >
                <LogOut className="w-4 h-4" />
                Cambiar Cuenta
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
