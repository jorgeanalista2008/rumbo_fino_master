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
  X,
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

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
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
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0A0A0C] border-r border-[#2C2C32] h-full min-h-screen flex flex-col justify-between p-4 shrink-0 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-3 py-3 border-b border-[#2C2C32]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[6px] bg-white flex items-center justify-center text-[#0A0A0C] font-black text-lg shadow-sm shrink-0">
                RF
              </div>
              <div>
                <h1 className="font-extrabold text-base text-[#F5F5F7] tracking-wider font-mono">RUMBO FINO</h1>
                <p className="text-[9.5px] text-[#8E8E93] font-semibold uppercase tracking-widest">Executive Black</p>
              </div>
            </div>
            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-[#8E8E93] hover:text-white hover:bg-[#141418] rounded-[6px] transition-colors"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
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
                  onClick={() => {
                    if (onClose) onClose();
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-white text-[#0A0A0C] font-bold shadow-sm'
                      : 'text-[#8E8E93] hover:text-[#F5F5F7] hover:bg-[#141418]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#0A0A0C]' : 'text-[#8E8E93]'}`} />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

      {/* Footer User Info & Logout */}
      <div className="space-y-3 pt-4 border-t border-[#2C2C32]">
        <div className="p-3 bg-[#141418] rounded-[6px] border border-[#2C2C32]">
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
    </>
  );
}
