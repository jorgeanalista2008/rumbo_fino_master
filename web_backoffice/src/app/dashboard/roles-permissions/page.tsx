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
  Plus,
  Trash2,
  X,
  Shield,
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

const DEFAULT_ROLE_ICONS: Record<string, any> = {
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

  // New Role Modal State
  const [isNewRoleModalOpen, setIsNewRoleModalOpen] = useState<boolean>(false);
  const [newRoleCode, setNewRoleCode] = useState<string>('');
  const [newRoleDisplayName, setNewRoleDisplayName] = useState<string>('');
  const [newRoleDescription, setNewRoleDescription] = useState<string>('');
  const [creatingRole, setCreatingRole] = useState<boolean>(false);

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

  // Toggle Action Permission (canCreate, canEdit, canDelete, canExport)
  const handleToggleAction = (actionKey: 'canCreate' | 'canEdit' | 'canDelete' | 'canExport') => {
    if (!currentConfig) return;
    setCurrentConfig({
      ...currentConfig,
      [actionKey]: !currentConfig[actionKey],
    });
  };

  // Save Configuration to Backend
  const handleSave = async () => {
    if (!currentConfig) return;
    setSaving(true);
    try {
      const res = await api.put<any>(`/roles-permissions/${currentConfig.role}`, {
        displayName: currentConfig.displayName,
        description: currentConfig.description,
        allowedRoutes: currentConfig.allowedRoutes,
        canCreate: currentConfig.canCreate,
        canEdit: currentConfig.canEdit,
        canDelete: currentConfig.canDelete,
        canExport: currentConfig.canExport,
      });

      const updated = res.data?.data || res.data;
      setRolesConfigs((prev) =>
        prev.map((r) => (r.role === currentConfig.role ? { ...r, ...updated } : r)),
      );

      addToast(
        'success',
        'Permisos y Menú Actualizados',
        `El menú para el perfil "${currentConfig.displayName}" ha sido actualizado y transmitido en vivo.`,
      );
    } catch (err: any) {
      console.error('Error guardando configuración de rol:', err);
      addToast(
        'error',
        'Error al Guardar',
        err.response?.data?.message || 'No se pudieron guardar los cambios.',
      );
    } finally {
      setSaving(false);
    }
  };

  // Create New Role
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleCode.trim() || !newRoleDisplayName.trim()) {
      addToast('error', 'Campos Incompletos', 'Por favor ingresa el código y nombre del nuevo rol.');
      return;
    }

    const formattedRoleCode = newRoleCode.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    setCreatingRole(true);

    try {
      const res = await api.put<any>(`/roles-permissions/${formattedRoleCode}`, {
        displayName: newRoleDisplayName.trim(),
        description: newRoleDescription.trim() || `Perfil personalizado ${newRoleDisplayName.trim()}`,
        allowedRoutes: ['/dashboard'],
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: true,
      });

      const created = res.data?.data || res.data;
      setRolesConfigs((prev) => [...prev, created]);
      setSelectedRole(created.role);
      setCurrentConfig(created);

      setIsNewRoleModalOpen(false);
      setNewRoleCode('');
      setNewRoleDisplayName('');
      setNewRoleDescription('');

      addToast(
        'success',
        'Nuevo Rol Creado',
        `El perfil "${created.displayName}" (${created.role}) fue creado exitosamente. Ahora puedes asignarle rutas y permisos.`,
      );
    } catch (err: any) {
      console.error('Error creando rol:', err);
      addToast('error', 'Error al Crear Rol', err.response?.data?.message || 'No se pudo crear el rol.');
    } finally {
      setCreatingRole(false);
    }
  };

  // Delete Custom Role
  const handleDeleteRole = async (roleKey: string) => {
    if (!confirm(`¿Estás seguro de eliminar permanentemente el perfil de rol personalizado "${roleKey}"?`)) {
      return;
    }

    try {
      await api.delete(`/roles-permissions/${roleKey}`);
      setRolesConfigs((prev) => prev.filter((r) => r.role !== roleKey));
      const nextRole = rolesConfigs.find((r) => r.role !== roleKey)?.role || 'SUPER_ADMIN';
      handleSelectRole(nextRole);
      addToast('info', 'Rol Eliminado', `El perfil "${roleKey}" ha sido eliminado del sistema.`);
    } catch (err: any) {
      console.error('Error eliminando rol:', err);
      addToast('error', 'No se pudo eliminar', err.response?.data?.message || 'Error al eliminar el rol.');
    }
  };

  // Reset System Defaults
  const handleResetDefaults = async () => {
    if (
      !confirm(
        '¿Desea restaurar las configuraciones y menús de todos los perfiles a los valores predeterminados de fábrica?',
      )
    ) {
      return;
    }

    setSaving(true);
    try {
      const res = await api.post<any>('/roles-permissions/reset-defaults');
      const list: RolePermissionConfig[] = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setRolesConfigs(list);
      const active = list.find((r: RolePermissionConfig) => r.role === selectedRole) || list[0];
      if (active) setCurrentConfig(active);
      addToast('info', 'Valores Restaurados', 'Todos los perfiles y menús volvieron a sus valores oficiales de fábrica.');
    } catch (err: any) {
      console.error('Error restaurando valores:', err);
      addToast('error', 'Error al Restaurar', 'No se pudieron restablecer los valores predeterminados.');
    } finally {
      setSaving(false);
    }
  };

  // Simulated Nav Items for current config
  const simulatedNavItems = useMemo(() => {
    if (!currentConfig) return [];
    if (currentConfig.role === 'SUPER_ADMIN') return ALL_NAVIGATION_ITEMS;
    return ALL_NAVIGATION_ITEMS.filter((item) => currentConfig.allowedRoutes.includes(item.href));
  }, [currentConfig]);

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* HEADER COMMAND BAR */}
      <div className="bg-executive-card border border-executive-border p-4 sm:p-6 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center text-luxury-gold shadow-lg shadow-luxury-gold/10 shrink-0">
              <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-black text-white">
                  Constructor Dinámico de Roles (RBAC)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-luxury-gold/15 text-luxury-gold border border-luxury-gold/30">
                  SINCRONIZACIÓN EN VIVO
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Cree nuevos roles o edite perfiles. El menú de navegación se construye dinámicamente según las rutas asignadas.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsNewRoleModalOpen(true)}
              className="px-4 py-2.5 bg-luxury-gold/15 hover:bg-luxury-gold/25 border border-luxury-gold/30 text-luxury-gold font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <Plus className="w-4 h-4 text-luxury-gold" />
              + Crear Nuevo Rol
            </button>

            <button
              onClick={handleResetDefaults}
              disabled={saving}
              className="px-4 py-2.5 bg-executive-dark hover:bg-executive-border border border-executive-border text-gray-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4 text-gray-400" />
              Restaurar Valores
            </button>

            <button
              onClick={handleSave}
              disabled={saving || !currentConfig}
              className="px-6 py-2.5 bg-luxury-gold hover:bg-yellow-500 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-luxury-gold/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </div>
      </div>

      {/* ROLES TABS SELECTOR (Clean No-Scrollbar Touch Carousel) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
        {rolesConfigs.map((r) => {
          const isSelected = r.role === selectedRole;
          const RoleIcon = DEFAULT_ROLE_ICONS[r.role] || Shield;
          return (
            <button
              key={r.role}
              onClick={() => handleSelectRole(r.role)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl font-bold text-xs whitespace-nowrap transition-all border shrink-0 ${
                isSelected
                  ? 'bg-luxury-gold text-black border-luxury-gold shadow-lg shadow-luxury-gold/20'
                  : 'bg-executive-card text-gray-400 hover:text-white border-executive-border hover:bg-executive-border/50'
              }`}
            >
              <RoleIcon className={`w-4 h-4 ${isSelected ? 'text-black' : 'text-luxury-gold'}`} />
              <span>{r.displayName}</span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md ${
                  isSelected ? 'bg-black/20 text-black font-bold' : 'bg-executive-dark text-gray-400 border border-executive-border'
                }`}
              >
                {r.role}
              </span>
              {!r.isSystem && (
                <span className="w-2 h-2 rounded-full bg-emerald-400" title="Rol personalizado" />
              )}
            </button>
          );
        })}
      </div>

      {/* ACTIVE ROLE CONFIGURATION PANEL & LIVE SIMULATOR */}
      {currentConfig ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* LEFT 2 COLS: ROUTE MATRIX & ACTION PERMISSIONS */}
          <div className="xl:col-span-2 space-y-6">
            {/* ROLE HEADER CARD */}
            <div className="bg-executive-card border border-executive-border p-6 rounded-3xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center text-luxury-gold font-black">
                    {currentConfig.role.substring(0, 2)}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      {currentConfig.displayName}
                      <span className="text-xs font-mono text-luxury-gold font-normal">
                        ({currentConfig.role})
                      </span>
                    </h2>
                    <p className="text-xs text-gray-400">{currentConfig.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      currentConfig.isSystem
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {currentConfig.isSystem ? 'Rol Base del Sistema' : 'Rol Personalizado'}
                  </span>

                  {!currentConfig.isSystem && (
                    <button
                      onClick={() => handleDeleteRole(currentConfig.role)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                      title="Eliminar este rol personalizado"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* ACTION PERMISSIONS SWITCHES */}
              <div className="pt-4 border-t border-executive-border grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: 'canCreate', label: 'Crear Registros', desc: 'Permite registrar nuevos datos' },
                  { key: 'canEdit', label: 'Editar Datos', desc: 'Permite modificar información' },
                  { key: 'canDelete', label: 'Eliminar Registros', desc: 'Permite suprimir o desactivar' },
                  { key: 'canExport', label: 'Exportar Reportes', desc: 'Permite descargar CSV/Excel' },
                ].map((act) => {
                  const isChecked = !!(currentConfig as any)[act.key];
                  return (
                    <button
                      key={act.key}
                      onClick={() => handleToggleAction(act.key as any)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        isChecked
                          ? 'bg-luxury-gold/10 border-luxury-gold/40 text-white'
                          : 'bg-executive-dark/50 border-executive-border text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold">{act.label}</span>
                        {isChecked ? (
                          <CheckCircle2 className="w-4 h-4 text-luxury-gold" />
                        ) : (
                          <Lock className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 leading-tight">{act.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ROUTE MATRIX BUILDER */}
            <div className="bg-executive-card border border-executive-border p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-luxury-gold" />
                    Pantallas y Módulos Autorizados para este Rol
                  </h3>
                  <p className="text-xs text-gray-400">
                    Marca las casillas de las pantallas que este perfil podrá ver en su menú de navegación lateral.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSelectAllRoutes}
                    className="text-[11px] font-bold text-luxury-gold hover:underline px-2 py-1 rounded-lg hover:bg-luxury-gold/10 transition-all"
                  >
                    Seleccionar Todas
                  </button>
                  <span className="text-gray-600">|</span>
                  <button
                    onClick={handleDeselectAllRoutes}
                    className="text-[11px] font-bold text-gray-400 hover:text-white px-2 py-1 rounded-lg hover:bg-executive-dark transition-all"
                  >
                    Mínimo
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {AVAILABLE_MODULES.map((mod) => {
                  const isChecked = currentConfig.allowedRoutes.includes(mod.route);
                  const Icon = mod.icon;

                  return (
                    <div
                      key={mod.route}
                      onClick={() => handleToggleRoute(mod.route)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                        isChecked
                          ? 'bg-luxury-gold/5 border-luxury-gold/40 shadow-sm'
                          : 'bg-executive-dark/40 border-executive-border hover:border-gray-600 opacity-60'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          isChecked
                            ? 'bg-luxury-gold text-black border-luxury-gold font-bold shadow-md shadow-luxury-gold/20'
                            : 'bg-executive-dark text-gray-400 border-executive-border'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-xs font-bold truncate ${
                              isChecked ? 'text-white' : 'text-gray-400'
                            }`}
                          >
                            {mod.name}
                          </span>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded border-gray-600 text-luxury-gold focus:ring-luxury-gold w-4 h-4 accent-luxury-gold"
                          />
                        </div>
                        <p className="text-[10px] text-luxury-gold/80 font-mono mt-0.5">{mod.route}</p>
                        <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">{mod.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COL: REAL-TIME SIDEBAR SIMULATOR */}
          <div className="space-y-4">
            <div className="bg-executive-card border border-executive-border p-6 rounded-3xl space-y-4 sticky top-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">
                    Simulador en Vivo del Menú
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/50 text-luxury-gold border border-luxury-gold/30">
                  {simulatedNavItems.length} Rutas Visibles
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Así es exactamente como se verá la barra lateral de navegación para cualquier usuario con el perfil <strong className="text-white">{currentConfig.displayName}</strong>:
              </p>

              {/* SIMULATED SIDEBAR BOX */}
              <div className="bg-black/80 border border-executive-border rounded-2xl p-3.5 space-y-3 shadow-inner">
                <div className="flex items-center gap-2.5 px-2 py-2 border-b border-executive-border/60">
                  <div className="w-7 h-7 rounded-lg bg-luxury-gold flex items-center justify-center text-black font-extrabold text-xs">
                    RF
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-white">RUMBO FINO</div>
                    <div className="text-[8px] text-luxury-gold font-mono uppercase">
                      Perfil: {currentConfig.role}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  {simulatedNavItems.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-xs italic">
                      Sin rutas asignadas. Selecciona al menos una pantalla.
                    </div>
                  ) : (
                    simulatedNavItems.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.href}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all ${
                            idx === 0
                              ? 'bg-luxury-gold text-black font-bold shadow-md shadow-luxury-gold/10'
                              : 'text-gray-400 hover:text-white bg-executive-dark/50'
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${idx === 0 ? 'text-black' : 'text-gray-400'}`} />
                          <span className="truncate">{item.name}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="p-3 bg-executive-dark/60 rounded-xl border border-executive-border/50 text-[11px] text-gray-400 space-y-1">
                <p className="font-semibold text-gray-300">💡 Nota de Control:</p>
                <p>
                  Si un usuario con este rol intenta acceder a una ruta desmarcada por URL directa, el sistema <strong>PermissionGuard</strong> bloqueará la pantalla automáticamente.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-gray-400">Cargando perfiles y permisos...</div>
      )}

      {/* MODAL: CREAR NUEVO PERFIL / ROL PERSONALIZADO */}
      {isNewRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-executive-card border border-executive-border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setIsNewRoleModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-executive-dark transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center text-luxury-gold">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Crear Nuevo Perfil / Rol</h3>
                <p className="text-xs text-gray-400">Define un rol personalizado con su propio menú</p>
              </div>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Código del Rol (Identificador Único) *
                </label>
                <input
                  type="text"
                  placeholder="EJ: AUDITOR, JEFE_TALLER, OPERADOR_NOCHE"
                  value={newRoleCode}
                  onChange={(e) => setNewRoleCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 bg-executive-dark border border-executive-border rounded-xl text-white text-xs font-mono focus:outline-none focus:border-luxury-gold uppercase"
                  required
                />
                <p className="text-[10px] text-gray-500 mt-1">Solo mayúsculas y guiones bajos</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Nombre Visible del Rol *
                </label>
                <input
                  type="text"
                  placeholder="EJ: Auditor Financiero, Supervisor Nocturno"
                  value={newRoleDisplayName}
                  onChange={(e) => setNewRoleDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-executive-dark border border-executive-border rounded-xl text-white text-xs focus:outline-none focus:border-luxury-gold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Descripción del Perfil (Opcional)
                </label>
                <textarea
                  placeholder="Responsabilidades y alcance de este nuevo perfil..."
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-executive-dark border border-executive-border rounded-xl text-white text-xs focus:outline-none focus:border-luxury-gold resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-executive-border">
                <button
                  type="button"
                  onClick={() => setIsNewRoleModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingRole}
                  className="px-5 py-2.5 bg-luxury-gold hover:bg-yellow-500 text-black font-black text-xs rounded-xl shadow-lg shadow-luxury-gold/20 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {creatingRole ? 'Creando Rol...' : 'Crear Perfil & Configurar Menú'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
