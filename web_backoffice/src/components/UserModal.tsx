'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Upload,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';
import { ModalPortal } from './ModalPortal';

export type UserRole = string;
export type UserStatus = 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED' | 'INACTIVE';

export interface UserItem {
  id: string;
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  role: string;
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

const BUILT_IN_ROLES_INFO: Record<
  string,
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
  const [role, setRole] = useState<string>('PASSENGER');
  const [status, setStatus] = useState<UserStatus>('ACTIVE');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [photoFileName, setPhotoFileName] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePhotoUpload = async (file: File) => {
    setUploadingPhoto(true);
    setPhotoFileName(file.name);

    // Instant local preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) setAvatarUrl(e.target.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/drivers/upload-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.data?.fileUrl) {
        setAvatarUrl(res.data.data.fileUrl);
      }
    } catch (err) {
      console.warn('API upload fallback:', err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const [allRolesList, setAllRolesList] = useState<
    Array<{ role: string; name: string; icon: any; color: string; desc: string }>
  >([]);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch dynamic roles list
    const fetchRoles = async () => {
      try {
        const res = await api.get<any>('/roles-permissions');
        const rolesData = res.data?.data || (Array.isArray(res.data) ? res.data : []);
        if (rolesData.length > 0) {
          const mapped = rolesData.map((r: any) => {
            const preset = BUILT_IN_ROLES_INFO[r.role];
            return {
              role: r.role,
              name: r.displayName || preset?.name || r.role,
              icon: preset?.icon || Shield,
              color: preset?.color || 'text-luxury-gold',
              desc: r.description || preset?.desc || 'Perfil del sistema',
            };
          });
          setAllRolesList(mapped);
          return;
        }
      } catch (err) {
        console.warn('Error fetching roles for modal:', err);
      }

      // Fallback
      setAllRolesList(
        Object.entries(BUILT_IN_ROLES_INFO).map(([k, v]) => ({
          role: k,
          name: v.name,
          icon: v.icon,
          color: v.color,
          desc: v.desc,
        })),
      );
    };

    fetchRoles();
  }, [isOpen]);

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
        onToast('success', 'Usuario Creado', `Nuevo usuario registrado con el rol ${role} exitosamente.`);
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
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
        <div className="bg-executive-card border border-luxury-gold/40 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto">
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
                  : 'Asigne credenciales y perfil entre los roles del ecosistema'}
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
          {/* ROLE SELECTOR */}
          <div className="space-y-2">
            <label className="text-gray-300 font-bold block uppercase tracking-wider text-[11px]">
              Seleccionar Perfil & Nivel de Acceso <span className="text-luxury-gold">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {(allRolesList.length > 0
                ? allRolesList
                : Object.entries(BUILT_IN_ROLES_INFO).map(([k, v]) => ({
                    role: k,
                    name: v.name,
                    icon: v.icon,
                    color: v.color,
                    desc: v.desc,
                  }))
              ).map((info) => {
                const isSelected = role === info.role;
                const IconComponent = info.icon;
                return (
                  <button
                    type="button"
                    key={info.role}
                    onClick={() => setRole(info.role)}
                    className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? `bg-executive-dark border-luxury-gold ring-1 ring-luxury-gold shadow-lg shadow-luxury-gold/10`
                        : 'bg-executive-dark/50 border-executive-border hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`flex items-center gap-1.5 font-black text-xs ${info.color}`}>
                        <IconComponent className="w-4 h-4 shrink-0" />
                        <span className="truncate">{info.name}</span>
                      </span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-luxury-gold animate-ping shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 leading-tight line-clamp-2">{info.desc}</p>
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
                  placeholder="admin@rumbofino.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-executive-dark border border-executive-border focus:border-luxury-gold rounded-xl text-white font-medium outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-gray-300 font-bold block mb-1">
                Teléfono de Contacto <span className="text-luxury-gold">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+58 412 1234567"
                  className="w-full pl-9 pr-3 py-2.5 bg-executive-dark border border-executive-border focus:border-luxury-gold rounded-xl text-white font-medium outline-none"
                />
              </div>
            </div>
          </div>

          {/* PASSWORD & STATUS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-300 font-bold block mb-1">
                {isEdit ? 'Nueva Contraseña (Opcional)' : 'Contraseña de Acceso *'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required={!isEdit}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isEdit ? 'Dejar en blanco para mantener' : 'Mínimo 6 caracteres'}
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
              <label className="text-gray-300 font-bold block mb-1">
                Estado de la Cuenta
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as UserStatus)}
                className="w-full px-3 py-2.5 bg-executive-dark border border-executive-border focus:border-luxury-gold rounded-xl text-white font-medium outline-none"
              >
                <option value="ACTIVE">Activo (Acceso Total)</option>
                <option value="PENDING_APPROVAL">Pendiente de Aprobación</option>
                <option value="SUSPENDED">Suspendido</option>
                <option value="INACTIVE">Inactivo</option>
              </select>
            </div>
          </div>

          {/* AVATAR & PHOTO UPLOAD (Same experience as driver photo) */}
          <div className="p-4 bg-executive-dark border border-executive-border rounded-2xl flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handlePhotoUpload(f);
              }}
            />
            <div className="relative group shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Preview"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-luxury-gold/50 shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-luxury-gold/10 border border-luxury-gold/30 text-luxury-gold flex items-center justify-center font-black text-xl shadow-md">
                  {firstName ? firstName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <button
                type="button"
                disabled={uploadingPhoto}
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex flex-col items-center justify-center text-luxury-gold cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span className="text-[8px] font-bold text-white">SUBIR</span>
              </button>
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-gray-200 font-bold text-xs">Fotografía Oficial de Perfil</span>
                {uploadingPhoto && (
                  <span className="text-[11px] text-luxury-gold font-bold flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Subiendo...
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400">
                {photoFileName ? `Archivo: ${photoFileName}` : 'Formato JPG o PNG de alta resolución. Clic para cargar desde tu equipo.'}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="px-3 py-1.5 bg-luxury-gold/10 hover:bg-luxury-gold/20 text-luxury-gold border border-luxury-gold/30 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" /> Seleccionar Fotografía
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarUrl('');
                      setPhotoFileName('');
                    }}
                    className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Quitar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* MODAL FOOTER */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-executive-border">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-gray-400 hover:text-white font-bold transition-all rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-luxury-gold hover:bg-yellow-500 text-black font-extrabold rounded-xl shadow-lg shadow-luxury-gold/20 flex items-center gap-2 transition-all transform hover:scale-[1.02] disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {loading ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Registrar Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </ModalPortal>
  );
}
