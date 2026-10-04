'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  ShieldCheck,
  FileText,
  DollarSign,
  Car,
  Star,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Upload,
  RefreshCw,
  Eye,
  Check,
  Calendar,
  AlertCircle,
  Phone,
  Mail,
  Award,
  CreditCard,
  History,
  Camera,
} from 'lucide-react';
import { api } from '@/lib/api';
import { ModalPortal } from './ModalPortal';

interface DriverProfileModalProps {
  driverId: string | null;
  initialTab?: 'profile' | 'docs' | 'upload_doc' | 'balance' | 'history';
  onClose: () => void;
  onRefresh: () => void;
}

const DOCUMENT_LABELS: Record<string, { title: string; desc: string }> = {
  DRIVER_LICENSE: {
    title: 'Licencia de Conducir Profesional',
    desc: 'Título habilitante para el transporte ejecutivo de personas.',
  },
  MEDICAL_CERTIFICATE: {
    title: 'Certificado Médico Integral',
    desc: 'Evaluación física y psicofísica aprobada para conducción.',
  },
  DRIVING_CERTIFICATE: {
    title: 'Certificado de Manejo Defensivo',
    desc: 'Acreditación de curso de seguridad vial y estándares VIP.',
  },
  CRIMINAL_RECORD: {
    title: 'Certificado de Antecedentes Penales',
    desc: 'Constancia oficial de no poseer antecedentes penales ni policiales.',
  },
  IDENTITY_CARD: {
    title: 'Cédula / Documento de Identidad (DNI)',
    desc: 'Documento nacional de identidad oficial del titular.',
  },
};

const REJECTION_PRESETS = [
  'Documento borroso o ilegible',
  'Licencia de conducir vencida o no vigente',
  'Los nombres no coinciden con el titular',
  'Documento recortado o incompleto',
  'Antecedentes con más de 90 días de emisión',
];

export function DriverProfileModal({
  driverId,
  initialTab = 'profile',
  onClose,
  onRefresh,
}: DriverProfileModalProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'docs' | 'upload_doc' | 'balance' | 'history'>(initialTab);

  // Verification state
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Form states for uploading new doc
  const [uploadDocType, setUploadDocType] = useState('DRIVER_LICENSE');
  const [uploadDocNumber, setUploadDocNumber] = useState('');
  const [uploadDocExpiration, setUploadDocExpiration] = useState('2028-12-31');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Avatar photo update state
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !driverId) return;

    setUpdatingAvatar(true);
    try {
      // 1. Upload file physically
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await api.post('/drivers/upload-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newAvatarUrl = uploadRes.data?.data?.fileUrl;
      if (!newAvatarUrl) {
        throw new Error('No se pudo obtener la URL de la foto');
      }

      // 2. Patch driver user profile
      await api.patch(`/drivers/${driverId}`, {
        avatarUrl: newAvatarUrl,
      });

      // 3. Update local state
      setProfile((prev: any) => ({
        ...prev,
        user: {
          ...prev?.user,
          avatarUrl: newAvatarUrl,
        },
      }));

      showToast('📸 ¡Fotografía del chofer actualizada exitosamente!', 'success');
      onRefresh();
    } catch (err: any) {
      console.error('Error actualizando foto:', err);
      const msg = err.response?.data?.message || 'Error al actualizar la foto del chofer.';
      showToast(Array.isArray(msg) ? msg.join(', ') : msg, 'error');
    } finally {
      setUpdatingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const loadFullProfile = async () => {
    if (!driverId) return;
    setLoading(true);
    try {
      const res = await api.get(`/drivers/${driverId}/full-profile`);
      if (res.data?.data) {
        setProfile(res.data.data);
      }
    } catch (err) {
      console.error('Error al obtener perfil completo:', err);
      showToast('Error al cargar expediente del chofer', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFullProfile();
  }, [driverId]);

  const handleVerifyDocument = async (docId: string, status: 'APPROVED' | 'REJECTED', customReason?: string) => {
    setActionLoading(true);
    try {
      const reason = status === 'REJECTED' ? (customReason || rejectionReason || 'Documento no legible o vencido') : undefined;
      await api.patch(`/drivers/documents/${docId}/verify`, {
        status,
        rejectionReason: reason,
      });

      showToast(
        status === 'APPROVED'
          ? '✅ Documento del chofer aprobado con éxito'
          : '⚠️ Documento rechazado. Se notificó la observación.',
        status === 'APPROVED' ? 'success' : 'error',
      );

      setRejectingDocId(null);
      setRejectionReason('');
      await loadFullProfile();
      onRefresh();
    } catch (err: any) {
      console.error('Error verificando documento:', err);
      const msg = err.response?.data?.message || 'Error al procesar la verificación';
      showToast(Array.isArray(msg) ? msg.join(', ') : msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverId) return;
    if (!uploadFile) {
      showToast('Por favor selecciona un archivo PDF o imagen', 'error');
      return;
    }

    setUploadingDoc(true);
    try {
      // 1. Upload physical file to server
      const formData = new FormData();
      formData.append('file', uploadFile);
      const uploadRes = await api.post('/drivers/upload-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const fileUrl = uploadRes.data?.data?.fileUrl || 'https://rumbofino.com/docs/expediente.pdf';

      // 2. Save document record in dossier
      await api.post(`/drivers/${driverId}/documents`, {
        documentType: uploadDocType,
        documentNumber: uploadDocNumber,
        fileUrl,
        expirationDate: uploadDocExpiration,
      });

      showToast('📄 Documento cargado exitosamente al expediente digital.');
      setUploadFile(null);
      setUploadDocNumber('');
      setActiveTab('docs');
      await loadFullProfile();
      onRefresh();
    } catch (err: any) {
      console.error('Error subiendo documento:', err);
      const msg = err.response?.data?.message || 'Error al subir el documento.';
      showToast(Array.isArray(msg) ? msg.join(', ') : msg, 'error');
    } finally {
      setUploadingDoc(false);
    }
  };

  if (!driverId) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
        <div className="bg-executive-card border border-executive-border rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`fixed top-24 right-8 z-50 font-bold text-xs px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border transition-all animate-bounce ${
              toastMessage.type === 'success'
                ? 'bg-emerald-500 text-black border-emerald-400'
                : 'bg-red-500 text-white border-red-400'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <ShieldCheck className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-executive-border bg-executive-dark/60">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center text-luxury-gold">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                Ficha Técnica & Expediente del Chofer
              </h2>
              <p className="text-xs text-gray-400">
                Auditoría documental, licencias profesionales, balance financiero y turnos.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 bg-executive-dark hover:bg-executive-border text-gray-400 hover:text-white rounded-xl border border-executive-border transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-executive-border bg-executive-card overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-luxury-gold text-black shadow-lg shadow-luxury-gold/20'
                : 'text-gray-400 hover:text-white hover:bg-executive-dark'
            }`}
          >
            <User className="w-4 h-4" /> Perfil & Licencia
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'docs'
                ? 'bg-luxury-gold text-black shadow-lg shadow-luxury-gold/20'
                : 'text-gray-400 hover:text-white hover:bg-executive-dark'
            }`}
          >
            <FileText className="w-4 h-4" /> Expediente Digital ({profile?.documents?.length || 0})
            {profile?.documents?.some((d: any) => d.status === 'PENDING') && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('upload_doc')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'upload_doc'
                ? 'bg-luxury-gold text-black shadow-lg shadow-luxury-gold/20'
                : 'text-gray-400 hover:text-white hover:bg-executive-dark'
            }`}
          >
            <Upload className="w-4 h-4" /> Adjuntar Documento
          </button>

          <button
            onClick={() => setActiveTab('balance')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'balance'
                ? 'bg-luxury-gold text-black shadow-lg shadow-luxury-gold/20'
                : 'text-gray-400 hover:text-white hover:bg-executive-dark'
            }`}
          >
            <DollarSign className="w-4 h-4" /> Finanzas & Billetera
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-luxury-gold text-black shadow-lg shadow-luxury-gold/20'
                : 'text-gray-400 hover:text-white hover:bg-executive-dark'
            }`}
          >
            <History className="w-4 h-4" /> Historial de Turnos
          </button>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <RefreshCw className="w-10 h-10 text-luxury-gold animate-spin mx-auto" />
            <p className="text-sm font-semibold text-gray-300">Cargando expediente digital del chofer...</p>
          </div>
        ) : profile ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Top Identity Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-executive-dark/80 p-5 rounded-2xl border border-executive-border shadow-inner">
              {/* Profile summary with interactive avatar */}
              <div className="flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <div className="relative group shrink-0">
                  {profile.user?.avatarUrl ? (
                    <img
                      src={profile.user.avatarUrl}
                      alt={profile.user.firstName}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-luxury-gold/50 shadow-md transition-all group-hover:brightness-75"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-luxury-gold/10 border border-luxury-gold/30 text-luxury-gold flex items-center justify-center font-black text-2xl shadow-md transition-all group-hover:brightness-75">
                      {profile.user?.firstName?.charAt(0) || 'C'}
                    </div>
                  )}

                  {/* Hover Camera Overlay */}
                  <button
                    type="button"
                    disabled={updatingAvatar}
                    onClick={() => fileInputRef.current?.click()}
                    title="Cambiar fotografía del chofer"
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex flex-col items-center justify-center text-luxury-gold cursor-pointer border border-luxury-gold/60 backdrop-blur-[2px]"
                  >
                    {updatingAvatar ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Camera className="w-5 h-5" />
                        <span className="text-[9px] font-extrabold text-white mt-0.5">CAMBIAR</span>
                      </>
                    )}
                  </button>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">
                      {profile.user?.firstName} {profile.user?.lastName}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3 text-luxury-gold" /> {profile.user?.email}
                  </p>
                  <p className="text-xs text-luxury-gold font-mono font-bold flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" /> {profile.user?.phoneNumber || 'N/A'}
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={updatingAvatar}
                    className="mt-1.5 px-2 py-0.5 bg-luxury-gold/10 hover:bg-luxury-gold/20 text-luxury-gold border border-luxury-gold/30 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                  >
                    {updatingAvatar ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" /> Subiendo...
                      </>
                    ) : (
                      <>
                        <Camera className="w-3 h-3" /> Cambiar Fotografía
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* License & Rating */}
              <div className="space-y-1 text-xs border-y md:border-y-0 md:border-x border-executive-border/60 py-2 md:py-0 md:px-4 flex flex-col justify-center">
                <div className="flex justify-between">
                  <span className="text-gray-400">Licencia de Conducir:</span>
                  <span className="font-mono font-bold text-luxury-gold">{profile.licenseNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Categoría:</span>
                  <span className="text-white font-medium">{profile.licenseCategory}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-gray-400">Reputación VIP:</span>
                  <div className="flex items-center gap-1 font-bold text-luxury-gold">
                    <Star className="w-3.5 h-3.5 fill-luxury-gold" />
                    <span>{Number(profile.ratingAvg || 5).toFixed(2)}</span>
                    <span className="text-gray-500 font-normal">({profile.totalRides || 0} viajes)</span>
                  </div>
                </div>
              </div>

              {/* Status & Vehicle */}
              <div className="space-y-2 text-xs flex flex-col justify-center">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Estado de Red:</span>
                  <span
                    className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                      profile.isOnline
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
                    }`}
                  >
                    {profile.isOnline ? '🟢 EN LÍNEA (GPS Activo)' : '⚪ DESCONECTADO'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Unidad Asignada:</span>
                  <span className="text-white font-semibold flex items-center gap-1">
                    <Car className="w-3.5 h-3.5 text-luxury-gold" />
                    {profile.currentVehicle
                      ? `${profile.currentVehicle.make} ${profile.currentVehicle.model} (${profile.currentVehicle.licensePlate})`
                      : 'Ninguna'}
                  </span>
                </div>
              </div>
            </div>

            {/* TAB 1: PROFILE & LICENSE */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-executive-dark/70 p-5 rounded-2xl border border-executive-border space-y-3 text-xs">
                    <h4 className="text-xs font-bold text-luxury-gold uppercase tracking-wider border-b border-executive-border/60 pb-2 flex items-center gap-2">
                      <Award className="w-4 h-4" /> Datos de Licencia Profesional
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Número de Licencia:</span>
                        <span className="font-mono font-bold text-white">{profile.licenseNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Categoría Oficial:</span>
                        <span className="font-semibold text-gray-200">{profile.licenseCategory}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Vigencia / Vencimiento:</span>
                        <span className="font-semibold text-gray-200">
                          {profile.licenseExpiration ? String(profile.licenseExpiration).split('T')[0] : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-executive-dark/70 p-5 rounded-2xl border border-executive-border space-y-3 text-xs">
                    <h4 className="text-xs font-bold text-luxury-gold uppercase tracking-wider border-b border-executive-border/60 pb-2 flex items-center gap-2">
                      <Car className="w-4 h-4" /> Turno Actual y Estado de Flota
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Vehículo Actual:</span>
                        <span className="font-bold text-white">
                          {profile.currentVehicle
                            ? `${profile.currentVehicle.make} ${profile.currentVehicle.model}`
                            : 'Sin vehículo asignado'}
                        </span>
                      </div>
                      {profile.currentVehicle && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Placa del Vehículo:</span>
                          <span className="font-mono font-bold text-luxury-gold">
                            {profile.currentVehicle.licensePlate}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-400">Viajes Realizados:</span>
                        <span className="font-bold text-white">{profile.totalRides || 0} completados</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: DOCUMENTS AUDIT & VERIFICATION */}
            {activeTab === 'docs' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-luxury-gold" /> Expediente Digital & Pólizas del Chofer
                    </h4>
                    <p className="text-xs text-gray-400">
                      Revisa, certifica o rechaza los documentos reglamentarios del conductor.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('upload_doc')}
                    className="px-3.5 py-1.5 bg-luxury-gold/10 hover:bg-luxury-gold/20 text-luxury-gold text-xs font-bold rounded-xl border border-luxury-gold/30 flex items-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" /> Adjuntar Nuevo
                  </button>
                </div>

                <div className="space-y-3">
                  {profile.documents && profile.documents.length > 0 ? (
                    profile.documents.map((doc: any) => {
                      const meta = DOCUMENT_LABELS[doc.documentType] || {
                        title: doc.documentType,
                        desc: 'Documento legal de soporte',
                      };

                      return (
                        <div
                          key={doc.id}
                          className="p-5 bg-executive-dark border border-executive-border rounded-2xl space-y-3 hover:border-luxury-gold/30 transition-all text-xs"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h5 className="font-bold text-sm text-white">{meta.title}</h5>
                                <span
                                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                                    doc.status === 'APPROVED'
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                      : doc.status === 'REJECTED'
                                      ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                                  }`}
                                >
                                  {doc.status === 'APPROVED'
                                    ? 'Aprobado'
                                    : doc.status === 'REJECTED'
                                    ? 'Rechazado'
                                    : 'Pendiente Revisión'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400">{meta.desc}</p>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 pt-1">
                                {doc.documentNumber && (
                                  <span>
                                    Folio / N°:{' '}
                                    <strong className="text-gray-200 font-mono">{doc.documentNumber}</strong>
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-luxury-gold" /> Vence:{' '}
                                  <strong className="text-gray-200">
                                    {doc.expirationDate ? String(doc.expirationDate).split('T')[0] : 'N/A'}
                                  </strong>
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                              {doc.fileUrl && (
                                <a
                                  href={doc.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3 py-2 bg-executive-card hover:bg-executive-border text-gray-300 hover:text-white rounded-xl text-xs font-bold border border-executive-border flex items-center gap-1.5 transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5 text-luxury-gold" /> Ver Archivo
                                </a>
                              )}

                              {doc.status !== 'APPROVED' && (
                                <button
                                  disabled={actionLoading}
                                  onClick={() => handleVerifyDocument(doc.id, 'APPROVED')}
                                  className="px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                >
                                  <Check className="w-4 h-4" /> Aprobar
                                </button>
                              )}

                              {doc.status !== 'REJECTED' && (
                                <button
                                  disabled={actionLoading}
                                  onClick={() => {
                                    setRejectingDocId(doc.id);
                                    setRejectionReason('');
                                  }}
                                  className="px-3.5 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-xs font-bold border border-red-500/30 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                >
                                  <X className="w-4 h-4" /> Rechazar
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Rejection Note */}
                          {doc.status === 'REJECTED' && doc.rejectionReason && (
                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2 text-xs text-red-400">
                              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">Motivo del rechazo: </span>
                                <span>{doc.rejectionReason}</span>
                              </div>
                            </div>
                          )}

                          {/* Rejection Prompt Box */}
                          {rejectingDocId === doc.id && (
                            <div className="p-4 bg-executive-card border border-red-500/40 rounded-xl space-y-3 animate-fadeIn">
                              <h6 className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4" /> Especificar Motivo de Rechazo:
                              </h6>
                              <div className="flex flex-wrap gap-1.5">
                                {REJECTION_PRESETS.map((preset, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setRejectionReason(preset)}
                                    className="px-2.5 py-1 bg-executive-dark hover:bg-red-500/20 text-gray-300 hover:text-red-300 text-[10px] rounded-lg border border-executive-border transition-colors text-left"
                                  >
                                    {preset}
                                  </button>
                                ))}
                              </div>
                              <input
                                type="text"
                                placeholder="Escribe el motivo detallado de rechazo..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="w-full bg-executive-dark border border-red-500/30 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setRejectingDocId(null)}
                                  className="px-3 py-1.5 bg-executive-dark text-gray-400 text-xs rounded-lg"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  disabled={actionLoading || !rejectionReason.trim()}
                                  onClick={() => handleVerifyDocument(doc.id, 'REJECTED', rejectionReason)}
                                  className="px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-lg disabled:opacity-50"
                                >
                                  Confirmar Rechazo
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-gray-400 bg-executive-dark/50 rounded-2xl border border-executive-border text-xs">
                      No hay documentos cargados en el expediente de este chofer.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: UPLOAD NEW DOCUMENT FORM */}
            {activeTab === 'upload_doc' && (
              <form
                onSubmit={handleUploadDocument}
                className="space-y-4 bg-executive-dark/70 p-6 rounded-2xl border border-executive-border"
              >
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Upload className="w-4 h-4 text-luxury-gold" /> Adjuntar Expediente para {profile.user?.firstName} {profile.user?.lastName}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Carga los certificados obligatorios de ley (PDF o Imagen) para homologar al chofer en la plataforma.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Tipo de Documento</label>
                    <select
                      value={uploadDocType}
                      onChange={(e) => setUploadDocType(e.target.value)}
                      className="w-full bg-executive-dark border border-executive-border rounded-xl p-2.5 text-white focus:outline-none focus:border-luxury-gold"
                    >
                      <option value="DRIVER_LICENSE">Licencia de Conducir Profesional</option>
                      <option value="MEDICAL_CERTIFICATE">Certificado Médico Aprobado</option>
                      <option value="DRIVING_CERTIFICATE">Certificado de Manejo Defensivo</option>
                      <option value="CRIMINAL_RECORD">Certificado de Antecedentes Penales</option>
                      <option value="IDENTITY_CARD">Cédula / Documento de Identidad (DNI)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Número de Folio / Documento</label>
                    <input
                      type="text"
                      placeholder="Ej: LIC-A3C-998877"
                      value={uploadDocNumber}
                      onChange={(e) => setUploadDocNumber(e.target.value)}
                      className="w-full bg-executive-dark border border-executive-border rounded-xl p-2.5 text-white focus:outline-none focus:border-luxury-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Fecha de Vencimiento</label>
                    <input
                      type="date"
                      required
                      value={uploadDocExpiration}
                      onChange={(e) => setUploadDocExpiration(e.target.value)}
                      className="w-full bg-executive-dark border border-executive-border rounded-xl p-2.5 text-white focus:outline-none focus:border-luxury-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Archivo Digital (PDF o Imagen PNG/JPG)</label>
                    <input
                      type="file"
                      required
                      accept=".pdf,image/png,image/jpeg,image/webp"
                      onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                      className="w-full bg-executive-dark border border-executive-border rounded-xl p-2 text-xs text-gray-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-luxury-gold file:text-black hover:file:bg-luxury-gold-hover cursor-pointer"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-executive-border flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('docs')}
                    className="px-4 py-2 bg-executive-border text-gray-300 text-xs font-bold rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingDoc}
                    className="px-6 py-2 bg-luxury-gold hover:bg-luxury-gold-hover text-black font-extrabold text-xs rounded-xl shadow-lg shadow-luxury-gold/20 flex items-center gap-2 disabled:opacity-50 transition-all"
                  >
                    {uploadingDoc ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Subiendo Archivo...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" /> Subir al Expediente
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 4: BALANCE & FINANCIALS */}
            {activeTab === 'balance' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-executive-dark p-5 rounded-2xl border border-executive-border space-y-2">
                  <span className="text-xs text-gray-400 uppercase tracking-wider block flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-400" /> Balance Disponible en Billetera
                  </span>
                  <div className="text-2xl font-black text-emerald-400">
                    ${Number(profile.balance?.currentBalance || 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-400">Fondo neto acumulado listo para liquidación o retiro.</p>
                </div>

                <div className="bg-executive-dark p-5 rounded-2xl border border-executive-border space-y-2">
                  <span className="text-xs text-gray-400 uppercase tracking-wider block flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-luxury-gold" /> Pagos Pendientes por Liquidar
                  </span>
                  <div className="text-2xl font-black text-luxury-gold">
                    ${Number(profile.balance?.pendingPayout || 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-400">Monto retenido pendiente de corte semanal.</p>
                </div>

                <div className="bg-executive-dark p-5 rounded-2xl border border-executive-border space-y-2">
                  <span className="text-xs text-gray-400 uppercase tracking-wider block flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-white" /> Ganancia Histórica Total
                  </span>
                  <div className="text-2xl font-black text-white">
                    ${Number(profile.balance?.totalEarned || 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-400">Recaudación acumulada por servicios completados.</p>
                </div>

                <div className="bg-executive-dark p-5 rounded-2xl border border-executive-border space-y-2">
                  <span className="text-xs text-gray-400 uppercase tracking-wider block flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-luxury-gold" /> Comisiones Pagadas a Rumbo Fino
                  </span>
                  <div className="text-2xl font-black text-gray-300">
                    ${Number(profile.balance?.totalCommissionPaid || 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-400">Total de comisiones retenidas por la plataforma.</p>
                </div>
              </div>
            )}

            {/* TAB 5: SHIFT HISTORY */}
            {activeTab === 'history' && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-300 flex items-center gap-2">
                  <History className="w-4 h-4 text-luxury-gold" /> Asignaciones de Vehículos y Turnos Recientes
                </h4>
                {profile.recentAssignments && profile.recentAssignments.length > 0 ? (
                  profile.recentAssignments.map((as: any) => (
                    <div
                      key={as.id}
                      className="p-4 bg-executive-dark rounded-xl border border-executive-border flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-executive-card rounded-lg border border-executive-border text-luxury-gold">
                          <Car className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-white">
                            {as.vehicle
                              ? `${as.vehicle.make} ${as.vehicle.model} (${as.vehicle.licensePlate})`
                              : 'Vehículo Desconocido'}
                          </div>
                          <div className="text-gray-400 text-[11px] mt-0.5">
                            Odómetro inicial: <strong className="text-gray-200 font-mono">{as.initialOdometer} km</strong> | Final:{' '}
                            <strong className="text-gray-200 font-mono">{as.finalOdometer ? `${as.finalOdometer} km` : 'En curso'}</strong>
                          </div>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                          as.shiftStatus === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 animate-pulse'
                            : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
                        }`}
                      >
                        {as.shiftStatus || 'COMPLETED'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-400 bg-executive-dark/50 rounded-2xl border border-executive-border text-xs">
                    No se registran turnos previos finalizados para este chofer.
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}

        {/* Modal Footer */}
        <div className="p-4 border-t border-executive-border flex items-center justify-between bg-executive-dark/60">
          <span className="text-[11px] text-gray-500 font-mono">ID Chofer: {driverId}</span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-executive-border hover:bg-executive-border/80 text-white font-bold text-xs rounded-xl transition-colors"
          >
            CERRAR FICHA
          </button>
        </div>
      </div>
    </div>
  </ModalPortal>
  );
}
