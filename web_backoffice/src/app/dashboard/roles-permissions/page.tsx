'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertOctagon,
  Crown,
  Building2,
  Headphones,
  Car,
  Users,
  LayoutDashboard,
  MapPin,
  DollarSign,
  TrendingUp,
  UserCog,
  Eye,
  Lock,
  Unlock,
  Radio,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { ALL_NAVIGATION_ITEMS, NavItem } from '@/components/Sidebar';
import { ToastContainer, ToastMessage } from '@/components/Toast';

export interface RolePermissionConfig {
  role: string;
  displayName: string;
  description: string;
  allowedRoutes: string[];
  isSystem: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
}

const AVAILABLE_MODULES: Array<{
  route: string;
  name: string;
  category: string;
  desc: string;
  icon: any;
}> = [
  {
    route: '/dashboard',
    name: 'Dashboard Global & Telemetría',
    category: 'Métricas & Monitoreo',
    desc: 'Vista ejecutiva general, KPIs de facturación y viajes activos.',
    icon: LayoutDashboard,
  },
  {
    route: '/dashboard/vehicles',
    name: 'Expedientes de Vehículos',
    category: 'Gestión de Flota',
    desc: 'Ficha técnica, verificación de documentos PDF/Fotos y asignación vehicular.',
    icon: Car,
  },
  {
    route: '/dashboard/drivers',
    name: 'Choferes & Turnos',
    category: 'Gestión de Personal',
    desc: 'Conductores activos, apertura/cierre de turnos con odómetro y estado de cuenta.',
    icon: Users,
  },
  {
    route: '/dashboard/dispatch',
    name: 'Consola de Despacho & Monitoreo',
    category: 'Operaciones en Vivo',
    desc: 'Telemetría GPS OpenStreetMap, asignación de choferes y protocolo SOS.',
    icon: MapPin,
  },
  {
    route: '/dashboard/financials',
    name: 'Finanzas & Recaudación',
    category: 'Tesorería & Facturación',
    desc: 'Billeteras de choferes, comisiones del 15% y liquidación de servicios.',
    icon: DollarSign,
  },
  {
    route: '/dashboard/exchange-rates',
    name: 'Tasas Oficiales BCV',
    category: 'Paridad Cambiaria',
    desc: 'Fijación de tasa oficial BCV, sincronización y conversión de tarifas.',
    icon: TrendingUp,
  },
  {
    route: '/dashboard/users',
    name: 'Gestión de Usuarios & Perfiles',
    category: 'Administración de Cuentas',
    desc: 'Creación, edición y suspensión de los 5 perfiles del ecosistema.',
    icon: UserCog,
  },
  {
    route: '/dashboard/roles-permissions',
    name: 'Permisos & Menú Dinámico',
    category: 'Seguridad & RBAC',
    desc: 'Configuración de menús visibles y permisos por perfil.',
    icon: ShieldAlert,
  },
];

const ROLES_ORDER = ['SUPER_ADMIN', 'FLEET_ADMIN', 'DISPATCHER', 'DRIVER', 'PASSENGER'];

const ROLE_ICONS: Record<string, any> = {
  SUPER_ADMIN: Crown,
  FLEET_ADMIN: Building2,
  DISPATCHER: Headphones,
  DRIVER: Car,
  PASSENGER: Users,
};

export default function RolesPermissionsPage() {
  const [rolesConfigs, setRolesConfigs] = useState<RolePermissionConfig[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('FLEET_ADMIN');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Active role config being edited
  const [currentConfig, setCurrentConfig] = useState<RolePermissionConfig | null>(null);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message: `${title}: ${message}` }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load All Role Configurations from Backend
  const loadRoles = async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/roles-permissions');
      const list: RolePermissionConfig[] = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setRolesConfigs(list);

      const active = list.find((r) => r.role === selectedRole) || list[0];
      if (active) {
        setCurrentConfig({ ...active, allowedRoutes: [...active.allowedRoutes] });
        setSelectedRole(active.role);
      }
    } catch (err: any) {
      console.error('Error cargando roles y permisos:', err);
      addToast('error', 'Error al Cargar', 'No se pudieron obtener las configuraciones de permisos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  // When selectedRole changes in tabs, switch currentConfig
  const handleSelectRole = (roleKey: string) => {
    setSelectedRole(roleKey);
    const target = rolesConfigs.find((r) => r.role === roleKey);
    if (target) {
      setCurrentConfig({ ...target, allowedRoutes: [...target.allowedRoutes] });
    }
  };

  // Toggle Route Checkbox
  const handleToggleRoute = (route: string) => {
    if (!currentConfig) return;
    const isCurrentlyAllowed = currentConfig.allowedRoutes.includes(route);
    let updatedRoutes: string[];

    if (isCurrentlyAllowed) {
      updatedRoutes = currentConfig.allowedRoutes.filter((r) => r !== route);
    } else {
      updatedRoutes = [...currentConfig.allowedRoutes, route];
    }

    setCurrentConfig({
      ...currentConfig,
      allowedRoutes: updatedRoutes,
    });
  };

  // Select All Routes
  const handleSelectAllRoutes = () => {
    if (!currentConfig) return;
    setCurrentConfig({
      ...currentConfig,
      allowedRoutes: AVAILABLE_MODULES.map((m) => m.route),
    });
  };

  // Deselect All Routes
  const handleDeselectAllRoutes = () => {
    if (!currentConfig) return;
    setCurrentConfig({
      ...currentConfig,
      allowedRoutes: ['/dashboard'],
    });
  };

  // Save Configuration to Backend
  const handleSaveConfig = async () => {
    if (!currentConfig) return;
    setSaving(true);
    try {
      await api.put(`/roles-permissions/${currentConfig.role}`, {
        role: currentConfig.role,
        displayName: currentConfig.displayName,
        description: currentConfig.description,
        allowedRoutes: currentConfig.allowedRoutes,
        canCreate: currentConfig.canCreate,
        canEdit: currentConfig.canEdit,
        canDelete: currentConfig.canDelete,
        canExport: currentConfig.canExport,
      });

      addToast(
        'success',
        'Menú y Permisos Guardados',
        `Las rutas para '${currentConfig.displayName}' fueron actualizadas y emitidas a la red.`
      );

      // Update local state list
      setRolesConfigs((prev) =>
        prev.map((item) => (item.role === currentConfig.role ? { ...currentConfig } : item))
      );
    } catch (err: any) {
      console.error('Error guardando permisos:', err);
      addToast('error', 'Error al Guardar', err?.response?.data?.message || 'No se pudo guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  // Reset Defaults
  const handleResetDefaults = async () => {
    if (!confirm('¿Desea restaurar todas las configuraciones de menús y permisos a los valores predeterminados?')) {
      return;
    }

    setSaving(true);
    try {
      await api.post('/roles-permissions/reset-defaults', {});
      addToast('info', 'Valores de Fábrica', 'Se restauraron los menús por defecto para todos los perfiles.');
      await loadRoles();
    } catch (err: any) {
      console.error('Error restaurando valores:', err);
      addToast('error', 'Error', 'No se pudieron restaurar los valores.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* HEADER COMMAND BAR */}
      <div className="bg-executive-card border border-executive-border p-6 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center text-luxury-gold shadow-lg shadow-luxury-gold/10">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
                Matriz de Roles, Permisos & Menú Dinámico
                <span className="px-3 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" /> EN VIVO
                </span>
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Configure y personalice exactamente qué módulos y pantallas verá cada uno de los perfiles al iniciar sesión en el Backoffice.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleResetDefaults}
              disabled={saving}
              className="px-4 py-2.5 bg-executive-dark hover:bg-executive-border border border-executive-border text-gray-300 font-bold text-xs rounded-xl flex items-center gap-2 transition-all"
              title="Restaurar presets de fábrica"
            >
              <RotateCcw className="w-4 h-4 text-luxury-gold" />
              Restaurar Valores por Defecto
            </button>

            <button
              onClick={handleSaveConfig}
              disabled={saving || !currentConfig}
              className="px-6 py-2.5 bg-luxury-gold hover:bg-luxury-gold-hover text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-luxury-gold/20 flex items-center gap-2 transition-all transform hover:scale-[1.02] disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar Menú del Perfil 🚀'}
            </button>
          </div>
        </div>
      </div>

      {/* 5 ROLE SELECTOR TABS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {ROLES_ORDER.map((rKey) => {
          const config = rolesConfigs.find((c) => c.role === rKey);
          const isSelected = selectedRole === rKey;
          const RoleIcon = ROLE_ICONS[rKey] || ShieldAlert;
          const routeCount = config ? config.allowedRoutes.length : 0;

          return (
            <button
              key={rKey}
              onClick={() => handleSelectRole(rKey)}
              className={`p-4 rounded-3xl border text-left transition-all relative overflow-hidden ${
                isSelected
                  ? 'bg-executive-card border-luxury-gold shadow-lg shadow-luxury-gold/15 ring-1 ring-luxury-gold'
                  : 'bg-executive-dark/60 border-executive-border hover:bg-executive-card/80'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-xs font-black uppercase ${isSelected ? 'text-luxury-gold' : 'text-gray-300'}`}>
                  {config?.displayName || rKey}
                </span>
                <RoleIcon className={`w-4 h-4 ${isSelected ? 'text-luxury-gold' : 'text-gray-400'}`} />
              </div>
              <div className="text-xl font-black text-white font-mono">
                {routeCount} <span className="text-xs font-medium text-gray-400">módulos</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 truncate">
                {config?.description || 'Perfil del sistema'}
              </p>
            </button>
          );
        })}
      </div>

      {/* SPLIT WORKSPACE: ROUTE MATRIX (LEFT) + LIVE PREVIEW (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL: ROUTE TOGGLES & ACTIONS (7 COLS) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-executive-card border border-executive-border p-6 rounded-3xl shadow-xl space-y-6">
            {/* Active Role Header Details */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-executive-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-black tracking-wider text-gray-400">
                    Configurando Menú para:
                  </span>
                  <span className="px-3 py-1 bg-luxury-gold/15 text-luxury-gold border border-luxury-gold/30 rounded-full text-xs font-black uppercase">
                    {currentConfig?.displayName || selectedRole}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Marque los módulos que estarán visibles en el menú lateral para los usuarios con este perfil.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleSelectAllRoutes}
                  className="px-3 py-1.5 bg-executive-dark hover:bg-executive-border text-gray-300 font-bold rounded-xl border border-executive-border"
                >
                  Marcar Todos
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllRoutes}
                  className="px-3 py-1.5 bg-executive-dark hover:bg-executive-border text-gray-300 font-bold rounded-xl border border-executive-border"
                >
                  Solo Inicio
                </button>
              </div>
            </div>

            {/* MODULES CHECKBOX GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {AVAILABLE_MODULES.map((mod) => {
                const isChecked = currentConfig?.allowedRoutes.includes(mod.route) ?? false;
                const ModIcon = mod.icon;

                return (
                  <div
                    key={mod.route}
                    onClick={() => handleToggleRoute(mod.route)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all select-none flex items-start gap-3.5 ${
                      isChecked
                        ? 'bg-executive-dark border-luxury-gold ring-1 ring-luxury-gold/50 shadow-md'
                        : 'bg-executive-dark/40 border-executive-border/60 hover:border-gray-600 opacity-75'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                        isChecked
                          ? 'bg-luxury-gold text-black font-black shadow-md'
                          : 'bg-executive-card border border-gray-600 text-transparent'
                      }`}
                    >
                      {isChecked && <CheckCircle2 className="w-4 h-4 text-black stroke-[3]" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-black text-xs text-white flex items-center gap-1.5 truncate">
                          <ModIcon className={`w-3.5 h-3.5 ${isChecked ? 'text-luxury-gold' : 'text-gray-500'}`} />
                          {mod.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-luxury-gold/80 block">{mod.route}</span>
                      <p className="text-[10px] text-gray-400 mt-1 leading-tight">{mod.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* GRANULAR ACTION PERMISSION SWITCHES */}
            <div className="pt-4 border-t border-executive-border space-y-3">
              <span className="text-xs uppercase font-black tracking-wider text-gray-300 block">
                Privilegios de Operación en Pantallas
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Can Create */}
                <div
                  onClick={() =>
                    currentConfig &&
                    setCurrentConfig({ ...currentConfig, canCreate: !currentConfig.canCreate })
                  }
                  className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                    currentConfig?.canCreate
                      ? 'bg-executive-dark border-emerald-500/40 text-emerald-400'
                      : 'bg-executive-dark/40 border-executive-border text-gray-500'
                  }`}
                >
                  <span className="text-[11px] font-bold block">Crear (POST)</span>
                  <span className="text-[9px] block text-gray-400">Nuevos registros</span>
                </div>

                {/* Can Edit */}
                <div
                  onClick={() =>
                    currentConfig &&
                    setCurrentConfig({ ...currentConfig, canEdit: !currentConfig.canEdit })
                  }
                  className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                    currentConfig?.canEdit
                      ? 'bg-executive-dark border-emerald-500/40 text-emerald-400'
                      : 'bg-executive-dark/40 border-executive-border text-gray-500'
                  }`}
                >
                  <span className="text-[11px] font-bold block">Editar (PATCH)</span>
                  <span className="text-[9px] block text-gray-400">Modificar expedientes</span>
                </div>

                {/* Can Delete */}
                <div
                  onClick={() =>
                    currentConfig &&
                    setCurrentConfig({ ...currentConfig, canDelete: !currentConfig.canDelete })
                  }
                  className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                    currentConfig?.canDelete
                      ? 'bg-executive-dark border-red-500/40 text-red-400'
                      : 'bg-executive-dark/40 border-executive-border text-gray-500'
                  }`}
                >
                  <span className="text-[11px] font-bold block">Eliminar (DELETE)</span>
                  <span className="text-[9px] block text-gray-400">Baja de registros</span>
                </div>

                {/* Can Export */}
                <div
                  onClick={() =>
                    currentConfig &&
                    setCurrentConfig({ ...currentConfig, canExport: !currentConfig.canExport })
                  }
                  className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                    currentConfig?.canExport
                      ? 'bg-executive-dark border-luxury-gold/40 text-luxury-gold'
                      : 'bg-executive-dark/40 border-executive-border text-gray-500'
                  }`}
                >
                  <span className="text-[11px] font-bold block">Exportar CSV</span>
                  <span className="text-[9px] block text-gray-400">Descarga de reportes</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: LIVE SIDEBAR SIMULATOR (4 COLS) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-executive-card border border-luxury-gold/40 p-5 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-executive-border pb-3">
              <h3 className="text-xs font-black text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-luxury-gold" />
                Simulador del Menú en Vivo
              </h3>
              <span className="text-[9px] font-black uppercase text-luxury-gold bg-luxury-gold/10 px-2 py-0.5 rounded-md">
                Vista de Usuario
              </span>
            </div>

            <p className="text-[11px] text-gray-400">
              Así verá la barra de navegación lateral cualquier usuario que inicie sesión con el rol{' '}
              <strong className="text-white">{currentConfig?.displayName || selectedRole}</strong>:
            </p>

            {/* MOCK SIDEBAR PREVIEW WIDGET */}
            <div className="p-4 bg-executive-dark rounded-2xl border border-executive-border space-y-3">
              <div className="flex items-center gap-2.5 pb-3 border-b border-executive-border/60">
                <div className="w-8 h-8 rounded-lg bg-luxury-gold flex items-center justify-center text-black font-extrabold text-sm">
                  RF
                </div>
                <div>
                  <div className="font-extrabold text-xs text-white">RUMBO FINO</div>
                  <div className="text-[8px] text-luxury-gold uppercase tracking-wider font-bold">
                    {currentConfig?.displayName || selectedRole}
                  </div>
                </div>
              </div>

              {/* Dynamic Nav Items Preview */}
              <div className="space-y-1">
                {AVAILABLE_MODULES.map((mod) => {
                  const isVisible = currentConfig?.allowedRoutes.includes(mod.route);
                  const Icon = mod.icon;

                  if (!isVisible) return null;

                  return (
                    <div
                      key={mod.route}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-executive-card/80 border border-executive-border/60 text-xs font-bold text-gray-200"
                    >
                      <Icon className="w-3.5 h-3.5 text-luxury-gold" />
                      <span className="truncate text-[11px]">{mod.name}</span>
                    </div>
                  );
                })}
              </div>

              {currentConfig?.allowedRoutes.length === 0 && (
                <div className="py-6 text-center text-gray-500 text-xs">
                  Sin módulos asignados a este perfil.
                </div>
              )}
            </div>

            {/* Quick Actions Note */}
            <div className="p-3 bg-executive-dark/50 rounded-2xl border border-executive-border text-[10px] text-gray-400 space-y-1">
              <div className="text-white font-bold flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-luxury-gold" />
                Actualización Inmediata
              </div>
              <p>
                Al hacer clic en <strong className="text-luxury-gold">"Guardar Menú del Perfil"</strong>, la nueva configuración se sincroniza de inmediato vía WebSockets.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
