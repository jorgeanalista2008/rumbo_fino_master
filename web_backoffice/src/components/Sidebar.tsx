'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Car,
  Users,
  MapPin,
  DollarSign,
  ShieldCheck,
  Award,
  TrendingUp,
  UserCog,
  ShieldAlert,
  LogOut,
  Crown,
  Building2,
  Headphones,
} from 'lucide-react';
import { usePermissions } from '@/lib/PermissionsContext';

export interface NavItem {
  name: string;
  href: string;
  icon: any;
}

export const ALL_NAVIGATION_ITEMS: NavItem[] = [
  { name: 'Dashboard Global', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Expedientes Vehículos', href: '/dashboard/vehicles', icon: Car },
  { name: 'Choferes y Turnos', href: '/dashboard/drivers', icon: Users },
  { name: 'Monitoreo / Despacho', href: '/dashboard/dispatch', icon: MapPin },
  { name: 'Finanzas y Recaudación', href: '/dashboard/financials', icon: DollarSign },
  { name: 'Tasas Oficiales BCV', href: '/dashboard/exchange-rates', icon: TrendingUp },
  { name: 'Usuarios & Perfiles', href: '/dashboard/users', icon: UserCog },
  { name: 'Permisos & Menú Dinámico', href: '/dashboard/roles-permissions', icon: ShieldAlert },
];

const ROLE_BADGES: Record<string, { label: string; color: string; icon: any }> = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30', icon: Crown },
  FLEET_ADMIN: { label: 'Admin Flota', color: 'bg-luxury-gold/10 text-luxury-gold border-luxury-gold/30', icon: Building2 },
  DISPATCHER: { label: 'Despachador', color: 'bg-sky-500/10 text-sky-400 border-sky-500/30', icon: Headphones },
  DRIVER: { label: 'Chofer VIP', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: Car },
  PASSENGER: { label: 'Cliente VIP', color: 'bg-slate-500/10 text-slate-300 border-slate-500/30', icon: Users },
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, permissions, hasRouteAccess } = usePermissions();

  const handleLogout = () => {
    localStorage.removeItem('rumbo_fino_token');
    localStorage.removeItem('rumbo_fino_user');
    router.push('/login');
  };

  // Filter navigation items by allowed routes
  const visibleNavItems = ALL_NAVIGATION_ITEMS.filter((item) => {
    if (!user || user.role === 'SUPER_ADMIN') return true;
    return hasRouteAccess(item.href);
  });

  const roleKey = user?.role || 'SUPER_ADMIN';
  const roleBadgeInfo = ROLE_BADGES[roleKey] || ROLE_BADGES.SUPER_ADMIN;
  const RoleIcon = roleBadgeInfo.icon;

  return (
    <aside className="w-64 bg-executive-card border-r border-executive-border min-h-screen flex flex-col justify-between p-4 shrink-0">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-3 py-3 border-b border-executive-border">
          <div className="w-10 h-10 rounded-xl bg-luxury-gold flex items-center justify-center text-black font-extrabold text-xl shadow-lg shadow-luxury-gold/20 shrink-0">
            RF
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-white tracking-wide">RUMBO FINO</h1>
            <p className="text-[10px] text-luxury-gold font-semibold uppercase tracking-widest">Executive Fleet</p>
          </div>
        </div>

        {/* Dynamic Navigation Items */}
        <nav className="space-y-1">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-luxury-gold text-black font-black shadow-md shadow-luxury-gold/20'
                    : 'text-gray-400 hover:text-white hover:bg-executive-border/50'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-black' : 'text-gray-400'}`} />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer User Info & Logout */}
      <div className="space-y-3 pt-4 border-t border-executive-border/60">
        <div className="p-3 bg-executive-dark/70 rounded-2xl border border-executive-border/50">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span
              className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1 border ${roleBadgeInfo.color}`}
            >
              <RoleIcon className="w-3 h-3" />
              {roleBadgeInfo.label}
            </span>
            <button
              onClick={handleLogout}
              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              title="Cerrar Sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-xs font-bold text-white truncate">
            {user?.firstName || 'Alexander'} {user?.lastName || 'Vance'}
          </div>
          <div className="text-[10px] text-gray-400 font-mono truncate">
            {user?.email || 'admin@rumbofino.com'}
          </div>
        </div>

        <div className="text-center">
          <p className="text-[9px] text-gray-500">Rumbo Fino VIP Fleet v1.0</p>
        </div>
      </div>
    </aside>
  );
}
