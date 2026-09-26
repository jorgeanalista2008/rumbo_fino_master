'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Lock,
  Shield,
  CheckCircle2,
  Crown,
  Building2,
  Headphones,
  Car,
  Users,
  Camera,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';

export type UserRole = 'SUPER_ADMIN' | 'FLEET_ADMIN' | 'DISPATCHER' | 'DRIVER' | 'PASSENGER';
export type UserStatus = 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED' | 'INACTIVE';

export interface UserItem {
  id: string;
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UserModalProps {
  user?: UserItem | null; // If null, mode is CREATE, else EDIT
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedUser: UserItem, isNew: boolean) => void;
  onToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

const ROLES_INFO: Record<
  UserRole,
  { name: string; icon: any; color: string; badgeBg: string; border: string; desc: string }
> = {
  SUPER_ADMIN: {
    name: 'Super Admin',
    icon: Crown,
    color: 'text-purple-400',
    badgeBg: 'bg-purple-500/10 text-purple-400',
    border: 'border-purple-500/30',
    desc: 'Control total de plataforma, finanzas, parámetros globales y auditoría.',
  },
  FLEET_ADMIN: {
    name: 'Administrador de Flota',
    icon: Building2,
    color: 'text-luxury-gold',
    badgeBg: 'bg-luxury-gold/10 text-luxury-gold',
    border: 'border-luxury-gold/30',
    desc: 'Gestión de vehículos, aprobación de documentos y asignación de unidades.',
  },
  DISPATCHER: {
    name: 'Despachador Central',
    icon: Headphones,
    color: 'text-sky-400',
    badgeBg: 'bg-sky-500/10 text-sky-400',
    border: 'border-sky-500/30',
    desc: 'Monitoreo en vivo, asignación de viajes, telemetría y protocolo SOS.',
  },
  DRIVER: {
    name: 'Chofer VIP',
    icon: Car,
    color: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10 text-emerald-400',
    border: 'border-emerald-500/30',
    desc: 'Conductor activo en ruta, recepción de solicitudes y cobro de carreras.',
  },
  PASSENGER: {
    name: 'Cliente / Pasajero',
    icon: Users,
    color: 'text-slate-300',
    badgeBg: 'bg-slate-500/10 text-slate-300',
    border: 'border-slate-500/30',
    desc: 'Usuario solicitante de traslados ejecutivos y métodos de pago.',
  },
};

export function UserModal({ user, isOpen, onClose, onSuccess, onToast }: UserModalProps) {
  const isEdit = Boolean(user?.id);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('PASSENGER');
  const [status, setStatus] = useState<UserStatus>('ACTIVE');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
      setPhoneNumber(user.phoneNumber || '');
      setRole(user.role || 'PASSENGER');
      setStatus(user.status || 'ACTIVE');
      setAvatarUrl(user.avatarUrl || '');
      setPassword('');
    } else {
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhoneNumber('+58 ');
      setRole('PASSENGER');
      setStatus('ACTIVE');
      setAvatarUrl('');
      setPassword('');
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phoneNumber.trim()) {
      onToast('error', 'Campos Requeridos', 'Por favor complete todos los datos obligatorios.');
      return;
    }

    if (!isEdit && (!password || password.length < 6)) {
      onToast('error', 'Contraseña Obligatoria', 'La contraseña debe contener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      if (isEdit && user) {
        const payload: any = {
          firstName,
          lastName,
          email,
          phoneNumber,
          role,
          status,
          avatarUrl: avatarUrl || undefined,
        };
        if (password && password.trim().length >= 6) {
          payload.password = password.trim();
        }

        const res = await api.patch<any>(`/users/${user.id}`, payload);
        const updated = res.data?.data || res.data;
        onToast('success', 'Perfil Actualizado', `El usuario ${firstName} ${lastName} fue actualizado.`);
        onSuccess(updated, false);
      } else {
        const payload = {
          firstName,
          lastName,
          email,
          phoneNumber,
          password,
          role,
          status,
          avatarUrl: avatarUrl || undefined,
        };

        const res = await api.post<any>('/users', payload);
        const created = res.data?.data || res.data;
        onToast('success', 'Usuario Creado', `Nuevo perfil (${ROLES_INFO[role].name}) registrado exitosamente.`);
        onSuccess(created, true);
      }
      onClose();
    } catch (err: any) {
      console.error('Error guardando usuario:', err);
      const msg = err?.response?.data?.message || 'No se pudo guardar el usuario.';
      onToast('error', 'Error al Guardar', Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-executive-card border border-luxury-gold/40 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-executive-border bg-executive-dark/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center text-luxury-gold">
              {isEdit ? <Shield className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                {isEdit ? 'Editar Perfil de Usuario' : 'Crear Nuevo Usuario VIP'}
              </h2>
              <p className="text-xs text-gray-400">
                {isEdit
                  ? `Modificando expediente de ${user?.firstName} ${user?.lastName}`
                  : 'Asigne credenciales y perfil entre los 5 roles del ecosistema'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white bg-executive-card hover:bg-executive-border rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs">
          {/* ROLE SELECTOR (5 PROFILES) */}
          <div className="space-y-2">
            <label className="text-gray-300 font-bold block uppercase tracking-wider text-[11px]">
              Seleccionar Perfil & Nivel de Acceso <span className="text-luxury-gold">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {(Object.keys(ROLES_INFO) as UserRole[]).map((rKey) => {
                const info = ROLES_INFO[rKey];
                const isSelected = role === rKey;
                const IconComponent = info.icon;
                return (
                  <button
                    type="button"
                    key={rKey}
                    onClick={() => setRole(rKey)}
                    className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? `bg-executive-dark border-luxury-gold ring-1 ring-luxury-gold shadow-lg shadow-luxury-gold/10`
                        : 'bg-executive-dark/50 border-executive-border hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`flex items-center gap-1.5 font-black text-xs ${info.color}`}>
                        <IconComponent className="w-4 h-4" />
                        {info.name}
                      </span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-luxury-gold animate-ping" />
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 leading-tight">{info.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PERSONAL INFO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-300 font-bold block mb-1">
                Nombre <span className="text-luxury-gold">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ej: Alexander"
                  className="w-full pl-9 pr-3 py-2.5 bg-executive-dark border border-executive-border focus:border-luxury-gold rounded-xl text-white font-medium outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-gray-300 font-bold block mb-1">
                Apellido <span className="text-luxury-gold">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Ej: Vance"
                  className="w-full pl-9 pr-3 py-2.5 bg-executive-dark border border-executive-border focus:border-luxury-gold rounded-xl text-white font-medium outline-none"
                />
              </div>
            </div>
          </div>

          {/* CONTACT INFO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-300 font-bold block mb-1">
                Correo Electrónico <span className="text-luxury-gold">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@rumbofino.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-executive-dark border border-executive-border focus:border-luxury-gold rounded-xl text-white font-medium outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-gray-300 font-bold block mb-1">
                Teléfono Móvil (Venezuela) <span className="text-luxury-gold">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+58 412 1234567"
                  className="w-full pl-9 pr-3 py-2.5 bg-executive-dark border border-executive-border focus:border-luxury-gold rounded-xl text-white font-mono font-medium outline-none"
                />
              </div>
            </div>
          </div>

          {/* PASSWORD & STATUS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-300 font-bold block mb-1">
                {isEdit ? 'Contraseña (Dejar en blanco para no cambiar)' : 'Contraseña de Acceso'}
                {!isEdit && <span className="text-luxury-gold"> *</span>}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required={!isEdit}
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isEdit ? '••••••••' : 'Mínimo 6 caracteres'}
                  className="w-full pl-9 pr-10 py-2.5 bg-executive-dark border border-executive-border focus:border-luxury-gold rounded-xl text-white font-medium outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-gray-300 font-bold block mb-1">Estado de la Cuenta</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as UserStatus)}
                className="w-full p-2.5 bg-executive-dark border border-executive-border focus:border-luxury-gold rounded-xl text-white font-bold outline-none"
              >
                <option value="ACTIVE">🟢 ACTIVO (Acceso Total)</option>
                <option value="PENDING_APPROVAL">🟡 PENDIENTE DE APROBACIÓN</option>
                <option value="SUSPENDED">🔴 SUSPENDIDO (Acceso Bloqueado)</option>
                <option value="INACTIVE">⚪ INACTIVO</option>
              </select>
            </div>
          </div>

          {/* AVATAR URL & PREVIEW */}
          <div>
            <label className="text-gray-300 font-bold block mb-1">Foto de Perfil / Avatar (URL)</label>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-executive-dark border border-executive-border flex items-center justify-center overflow-hidden shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-4 h-4 text-gray-500" />
                )}
              </div>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://ejemplo.com/avatar.jpg"
                className="w-full p-2.5 bg-executive-dark border border-executive-border focus:border-luxury-gold rounded-xl text-white font-medium outline-none"
              />
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-executive-border">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-executive-dark hover:bg-executive-border text-gray-300 font-bold rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-luxury-gold hover:bg-luxury-gold-hover text-black font-black uppercase tracking-wider rounded-xl shadow-lg shadow-luxury-gold/20 flex items-center gap-2 transition-all transform hover:scale-[1.01] disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {loading ? 'Guardando...' : isEdit ? 'Actualizar Perfil' : 'Crear Usuario VIP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
