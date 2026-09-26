'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  UserCog,
  Plus,
  Search,
  RefreshCw,
  FileSpreadsheet,
  Crown,
  Building2,
  Headphones,
  Car,
  Users,
  CheckCircle2,
  AlertOctagon,
  Shield,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Mail,
  Phone,
  Calendar,
  MoreVertical,
  Filter,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';
import { UserModal, UserItem, UserRole, UserStatus } from '@/components/UserModal';
import { ToastContainer, ToastMessage } from '@/components/Toast';

const ROLE_DEFINITIONS: Record<
  UserRole,
  { name: string; icon: any; color: string; badge: string; border: string; desc: string }
> = {
  SUPER_ADMIN: {
    name: 'Super Admin',
    icon: Crown,
    color: 'text-purple-400',
    badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    border: 'border-purple-500/30',
    desc: 'Control Total & Finanzas',
  },
  FLEET_ADMIN: {
    name: 'Admin de Flota',
    icon: Building2,
    color: 'text-luxury-gold',
    badge: 'bg-luxury-gold/10 text-luxury-gold border-luxury-gold/30',
    border: 'border-luxury-gold/30',
    desc: 'Vehículos & Documentos',
  },
  DISPATCHER: {
    name: 'Despachador',
    icon: Headphones,
    color: 'text-sky-400',
    badge: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    border: 'border-sky-500/30',
    desc: 'Telemetría & Servicios',
  },
  DRIVER: {
    name: 'Chofer VIP',
    icon: Car,
    color: 'text-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    border: 'border-emerald-500/30',
    desc: 'Conductores en Red',
  },
  PASSENGER: {
    name: 'Cliente / Pasajero',
    icon: Users,
    color: 'text-slate-300',
    badge: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
    border: 'border-slate-500/30',
    desc: 'Usuarios Solicitantes',
  },
};

export default function UsersManagementPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({
    TOTAL: 0,
    SUPER_ADMIN: 0,
    FLEET_ADMIN: 0,
    DISPATCHER: 0,
    DRIVER: 0,
    PASSENGER: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Filters & Search
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  // Delete Confirmation Modal
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message: `${title}: ${message}` }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load Users and Role Metrics
  const loadUsersData = async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        api.get<any>('/users?limit=200'),
        api.get<any>('/users/stats').catch(() => ({ data: { data: null } })),
      ]);

      const items = usersRes.data?.data?.items || usersRes.data?.data || (Array.isArray(usersRes.data) ? usersRes.data : []);
      setUsers(items);

      if (statsRes.data?.data) {
        setStats(statsRes.data.data);
      } else {
        // Compute stats locally if stats endpoint unavailable
        const computedStats: Record<string, number> = {
          TOTAL: items.length,
          SUPER_ADMIN: items.filter((u: any) => u.role === 'SUPER_ADMIN').length,
          FLEET_ADMIN: items.filter((u: any) => u.role === 'FLEET_ADMIN').length,
          DISPATCHER: items.filter((u: any) => u.role === 'DISPATCHER').length,
          DRIVER: items.filter((u: any) => u.role === 'DRIVER').length,
          PASSENGER: items.filter((u: any) => u.role === 'PASSENGER').length,
        };
        setStats(computedStats);
      }
    } catch (err: any) {
      console.error('Error cargando usuarios:', err);
      addToast('error', 'Error de Carga', 'No se pudieron obtener los expedientes de usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsersData();
  }, []);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role Filter
      if (selectedRoleFilter !== 'ALL' && u.role !== selectedRoleFilter) {
        return false;
      }
      // Status Filter
      if (statusFilter !== 'ALL' && u.status !== statusFilter) {
        return false;
      }
      // Search Filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
        const emailMatch = (u.email || '').toLowerCase().includes(term);
        const phoneMatch = (u.phoneNumber || '').toLowerCase().includes(term);
        return fullName.includes(term) || emailMatch || phoneMatch;
      }
      return true;
    });
  }, [users, selectedRoleFilter, statusFilter, searchTerm]);

  // Handle Quick Status Toggle
  const handleToggleStatus = async (user: UserItem) => {
    const newStatus: UserStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.patch(`/users/${user.id}/status`, { status: newStatus });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
      );
      addToast(
        'success',
        'Estado Actualizado',
        `El usuario ${user.firstName} ahora está ${newStatus === 'ACTIVE' ? 'ACTIVO' : 'SUSPENDIDO'}.`
      );
    } catch (err: any) {
      console.error('Error cambiando estado:', err);
      addToast('error', 'Error al Actualizar', 'No se pudo cambiar el estado del usuario.');
    }
  };

  // Handle Delete User
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/users/${userToDelete.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      addToast('success', 'Usuario Eliminado', `El usuario ${userToDelete.firstName} ${userToDelete.lastName} fue removido.`);
      setUserToDelete(null);
      loadUsersData();
    } catch (err: any) {
      console.error('Error eliminando usuario:', err);
      addToast('error', 'Error al Eliminar', err?.response?.data?.message || 'No se pudo eliminar el usuario.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Export to CSV
  const exportUsersToCSV = () => {
    if (filteredUsers.length === 0) {
      addToast('info', 'Sin Registros', 'No hay usuarios para exportar.');
      return;
    }

    const headers = ['ID', 'Nombre', 'Apellido', 'Email', 'Telefono', 'Rol', 'Estado', 'Fecha Registro'];
    const rows = filteredUsers.map((u) => [
      u.id,
      `"${(u.firstName || '').replace(/"/g, '""')}"`,
      `"${(u.lastName || '').replace(/"/g, '""')}"`,
      u.email,
      u.phoneNumber,
      u.role,
      u.status,
      u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-VE') : 'N/A',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `usuarios_rumbo_fino_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('info', 'Exportación Exitosa', 'El archivo CSV de usuarios ha sido generado.');
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* HEADER COMMAND BAR */}
      <div className="bg-executive-card border border-executive-border p-6 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center text-luxury-gold shadow-lg shadow-luxury-gold/10">
              <UserCog className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
                Gestión Central de Usuarios & Perfiles
                <span className="px-3 py-0.5 rounded-full text-[10px] font-black bg-luxury-gold/15 text-luxury-gold border border-luxury-gold/30">
                  5 ROLES VIP
                </span>
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Administre accesos y privilegios para Super Admins, Administradores de Flota, Despachadores, Choferes y Clientes.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={exportUsersToCSV}
              className="px-4 py-2.5 bg-executive-dark hover:bg-executive-border border border-executive-border text-gray-300 font-bold text-xs rounded-xl flex items-center gap-2 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-luxury-gold" />
              Exportar CSV
            </button>

            <button
              onClick={loadUsersData}
              className="p-2.5 bg-executive-dark hover:bg-executive-border text-gray-400 hover:text-white rounded-xl transition-all"
              title="Recargar usuarios"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-luxury-gold' : ''}`} />
            </button>

            <button
              onClick={() => {
                setEditingUser(null);
                setIsModalOpen(true);
              }}
              className="px-5 py-2.5 bg-luxury-gold hover:bg-luxury-gold-hover text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-luxury-gold/20 flex items-center gap-2 transition-all transform hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              + Crear Nuevo Usuario
            </button>
          </div>
        </div>
      </div>

      {/* 5 ROLE METRIC CARDS & QUICK FILTER TABS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* All Users Tab */}
        <button
          onClick={() => setSelectedRoleFilter('ALL')}
          className={`p-4 rounded-3xl border text-left transition-all ${
            selectedRoleFilter === 'ALL'
              ? 'bg-executive-card border-luxury-gold shadow-lg shadow-luxury-gold/10 ring-1 ring-luxury-gold'
              : 'bg-executive-dark/60 border-executive-border hover:bg-executive-card/80'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-black text-gray-400">Total Red</span>
            <Shield className="w-4 h-4 text-luxury-gold" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{stats.TOTAL || users.length}</div>
          <p className="text-[10px] text-gray-400 mt-1">Todos los perfiles</p>
        </button>

        {/* 5 Specific Roles */}
        {(Object.keys(ROLE_DEFINITIONS) as UserRole[]).map((rKey) => {
          const info = ROLE_DEFINITIONS[rKey];
          const count = stats[rKey] || users.filter((u) => u.role === rKey).length;
          const isSelected = selectedRoleFilter === rKey;
          const IconComponent = info.icon;

          return (
            <button
              key={rKey}
              onClick={() => setSelectedRoleFilter(rKey)}
              className={`p-4 rounded-3xl border text-left transition-all ${
                isSelected
                  ? 'bg-executive-card border-luxury-gold shadow-lg shadow-luxury-gold/10 ring-1 ring-luxury-gold'
                  : 'bg-executive-dark/60 border-executive-border hover:bg-executive-card/80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] uppercase font-black ${info.color}`}>{info.name}</span>
                <IconComponent className={`w-4 h-4 ${info.color}`} />
              </div>
              <div className="text-2xl font-black text-white font-mono">{count}</div>
              <p className="text-[10px] text-gray-400 mt-1 truncate">{info.desc}</p>
            </button>
          );
        })}
      </div>

      {/* SEARCH AND STATUS FILTER BAR */}
      <div className="bg-executive-card border border-executive-border p-4 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, email, teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-executive-dark border border-executive-border focus:border-luxury-gold rounded-xl text-white outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-luxury-gold" />
            <span className="text-gray-400 font-bold">Estado:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2.5 bg-executive-dark border border-executive-border rounded-xl text-white font-bold outline-none"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="ACTIVE">🟢 Activos</option>
            <option value="PENDING_APPROVAL">🟡 Pendientes</option>
            <option value="SUSPENDED">🔴 Suspendidos</option>
            <option value="INACTIVE">⚪ Inactivos</option>
          </select>
        </div>
      </div>

      {/* USERS DOSSIER TABLE */}
      <div className="bg-executive-card border border-executive-border rounded-3xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-executive-border bg-executive-dark/80 text-gray-400 uppercase font-black text-[10px] tracking-wider">
                <th className="py-4 px-4">Usuario VIP</th>
                <th className="py-4 px-4">Contacto & Teléfono</th>
                <th className="py-4 px-4">Perfil / Rol</th>
                <th className="py-4 px-4">Estado</th>
                <th className="py-4 px-4">Registro</th>
                <th className="py-4 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-executive-border/40">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-luxury-gold mb-2" />
                    Cargando expedientes de usuarios...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    No se encontraron usuarios para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((item) => {
                  const roleDef = ROLE_DEFINITIONS[item.role] || ROLE_DEFINITIONS.PASSENGER;
                  const IconComponent = roleDef.icon;

                  return (
                    <tr key={item.id} className="hover:bg-executive-dark/50 transition-colors">
                      {/* USER INFO & AVATAR */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-executive-dark border border-executive-border overflow-hidden flex items-center justify-center shrink-0">
                            {item.avatarUrl ? (
                              <img src={item.avatarUrl} alt={item.firstName} className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-black text-sm text-luxury-gold">
                                {(item.firstName?.[0] || 'U').toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-white text-sm block">
                              {item.firstName} {item.lastName}
                            </span>
                            <span className="text-[11px] text-gray-400 block font-mono">
                              {item.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* CONTACT */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <span className="font-mono text-gray-200 text-xs block flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-luxury-gold" />
                            {item.phoneNumber || 'Sin teléfono'}
                          </span>
                        </div>
                      </td>

                      {/* ROLE BADGE */}
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1.5 border ${roleDef.badge}`}
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                          {roleDef.name}
                        </span>
                      </td>

                      {/* STATUS BADGE */}
                      <td className="py-4 px-4">
                        {item.status === 'ACTIVE' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" /> ACTIVO
                          </span>
                        ) : item.status === 'PENDING_APPROVAL' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/30 w-fit block">
                            PENDIENTE
                          </span>
                        ) : item.status === 'SUSPENDED' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-1 w-fit">
                            <AlertOctagon className="w-3 h-3" /> SUSPENDIDO
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-gray-800 text-gray-400 border border-gray-700 w-fit block">
                            INACTIVO
                          </span>
                        )}
                      </td>

                      {/* REGISTERED DATE */}
                      <td className="py-4 px-4 text-gray-400 text-[11px]">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('es-VE') : 'N/A'}
                      </td>

                      {/* ACTIONS */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingUser(item);
                              setIsModalOpen(true);
                            }}
                            className="p-2 bg-executive-dark hover:bg-executive-border text-gray-300 hover:text-white rounded-xl transition-all"
                            title="Editar Perfil"
                          >
                            <Edit className="w-3.5 h-3.5 text-luxury-gold" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(item)}
                            className={`p-2 rounded-xl transition-all border ${
                              item.status === 'ACTIVE'
                                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            }`}
                            title={item.status === 'ACTIVE' ? 'Suspender Acceso' : 'Activar Acceso'}
                          >
                            {item.status === 'ACTIVE' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => setUserToDelete(item)}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl transition-all"
                            title="Eliminar Usuario"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* USER MODAL (CREATE / EDIT) */}
      <UserModal
        isOpen={isModalOpen}
        user={editingUser}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
        }}
        onSuccess={(savedUser, isNew) => {
          if (isNew) {
            setUsers((prev) => [savedUser, ...prev]);
          } else {
            setUsers((prev) => prev.map((u) => (u.id === savedUser.id ? savedUser : u)));
          }
          loadUsersData();
        }}
        onToast={addToast}
      />

      {/* DELETE CONFIRMATION DIALOG */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-executive-card border border-red-500/40 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">¿Eliminar Usuario Definitivamente?</h3>
                <p className="text-xs text-gray-400">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <p className="text-xs text-gray-300">
              Está a punto de remover el usuario{' '}
              <strong className="text-white">
                {userToDelete.firstName} {userToDelete.lastName} ({userToDelete.email})
              </strong>{' '}
              con perfil{' '}
              <span className="text-luxury-gold font-bold">
                {ROLE_DEFINITIONS[userToDelete.role]?.name || userToDelete.role}
              </span>
              .
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-executive-border">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 bg-executive-dark hover:bg-executive-border text-gray-300 text-xs font-bold rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteUser}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-lg shadow-red-600/20 disabled:opacity-50"
              >
                {isDeleting ? 'Eliminando...' : 'Sí, Eliminar Usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
