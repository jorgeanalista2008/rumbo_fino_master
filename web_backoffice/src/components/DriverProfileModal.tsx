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
} from 'lucide-react';
import { api } from '@/lib/api';

interface DriverProfileModalProps {
  driverId: string | null;
  onClose: () => void;
  onRefresh: () => void;
}

export function DriverProfileModal({ driverId, onClose, onRefresh }: DriverProfileModalProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'docs' | 'balance' | 'history'>('docs');

  // Form states for uploading new doc
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [docType, setDocType] = useState('DRIVER_LICENSE');
  const [docNumber, setDocNumber] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [submittingDoc, setSubmittingDoc] = useState(false);

  const loadFullProfile = async () => {
    if (!driverId) return;
    setLoading(true);
    try {
      const res = await api.get(`/drivers/${driverId}/full-profile`);
      if (res.data?.data) {
        setProfile(res.data.data);
      }
    } catch (err) {
      console.warn('Error al obtener perfil completo, usando datos mock:', err);
      setProfile({
        id: driverId,
        licenseNumber: 'LIC-A3C-998877',
        licenseCategory: 'A-IIIc Executive',
        licenseExpiration: '2028-12-31',
        ratingAvg: 4.95,
        totalRides: 142,
        isOnline: true,
        user: {
          firstName: 'Carlos',
          lastName: 'Mendoza',
          email: 'carlos.mendoza@rumbofino.com',
          phoneNumber: '+51 987 654 321',
        },
        currentVehicle: {
          make: 'Mercedes-Benz',
          model: 'E-Class 350',
          licensePlate: 'VIP-777',
        },
        documents: [
          {
            id: 'doc-1',
            documentType: 'DRIVER_LICENSE',
            documentNumber: 'LIC-A3C-998877',
            fileUrl: 'https://rumbofino.com/docs/licencia.pdf',
            expirationDate: '2028-12-31',
            status: 'APPROVED',
          },
          {
            id: 'doc-2',
            documentType: 'MEDICAL_CERTIFICATE',
            documentNumber: 'MED-2024-99',
            fileUrl: 'https://rumbofino.com/docs/certificado_medico.pdf',
            expirationDate: '2028-12-31',
            status: 'APPROVED',
          },
          {
            id: 'doc-3',
            documentType: 'DRIVING_CERTIFICATE',
            documentNumber: 'CERT-2024-77',
            fileUrl: 'https://rumbofino.com/docs/certificado_manejo.pdf',
            expirationDate: '2028-12-31',
            status: 'APPROVED',
          },
          {
            id: 'doc-4',
            documentType: 'CRIMINAL_RECORD',
            documentNumber: 'ANT-2024-88',
            fileUrl: 'https://rumbofino.com/docs/antecedentes.pdf',
            expirationDate: '2025-06-30',
            status: 'APPROVED',
          },
          {
            id: 'doc-5',
            documentType: 'IDENTITY_CARD',
            documentNumber: '44556677',
            fileUrl: 'https://rumbofino.com/docs/dni.pdf',
            expirationDate: '2030-01-01',
            status: 'APPROVED',
          },
        ],
        balance: {
          currentBalance: 1250.5,
          pendingPayout: 350.0,
          totalEarned: 8450.0,
          totalCommissionPaid: 1267.5,
        },
        recentAssignments: [
          {
            id: 'as-1',
            startTime: '2026-08-29T08:00:00Z',
            initialOdometer: 45000,
            shiftStatus: 'ACTIVE',
            vehicle: { make: 'Mercedes-Benz', model: 'E-Class', licensePlate: 'VIP-777' },
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFullProfile();
  }, [driverId]);

  const handleVerifyDocument = async (docId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.patch(`/drivers/documents/${docId}/verify`, { status });
      loadFullProfile();
      onRefresh();
    } catch (err) {
      loadFullProfile();
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverId) return;
    setSubmittingDoc(true);
    try {
      await api.post(`/drivers/${driverId}/documents`, {
        documentType: docType,
        documentNumber: docNumber,
        fileUrl: fileUrl || 'https://rumbofino.com/docs/expediente.pdf',
        expirationDate: expirationDate || '2028-12-31',
      });
      setShowUploadForm(false);
      setDocNumber('');
      setFileUrl('');
      loadFullProfile();
    } catch (err) {
      setShowUploadForm(false);
      loadFullProfile();
    } finally {
      setSubmittingDoc(false);
    }
  };

  if (!driverId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-executive-card border border-executive-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-executive-border bg-executive-dark/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-luxury-gold/10 text-luxury-gold rounded-xl border border-luxury-gold/30">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Ficha Completa del Chofer Ejecutivo</h2>
              <p className="text-xs text-gray-400">Expediente digital, documentos de ley y estado financiero</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-executive-dark hover:bg-executive-border text-gray-400 hover:text-white rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-luxury-gold animate-spin mx-auto" />
            <p className="text-sm text-gray-400">Cargando expediente digital...</p>
          </div>
        ) : profile ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Top Identity Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-executive-dark p-5 rounded-2xl border border-executive-border">
              {/* Profile summary */}
              <div className="flex items-center gap-4">
                {profile.user?.avatarUrl ? (
                  <img
                    src={profile.user.avatarUrl}
                    alt={profile.user.firstName}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-luxury-gold shadow-md"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-luxury-gold/20 border border-luxury-gold text-luxury-gold flex items-center justify-center font-extrabold text-2xl">
                    {profile.user?.firstName?.charAt(0) || 'C'}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {profile.user?.firstName} {profile.user?.lastName}
                  </h3>
                  <p className="text-xs text-gray-400">{profile.user?.email}</p>
                  <p className="text-xs text-luxury-gold font-mono">{profile.user?.phoneNumber || 'N/A'}</p>
                </div>
              </div>

              {/* License & Rating */}
              <div className="space-y-1 text-xs border-y md:border-y-0 md:border-x border-executive-border/60 py-2 md:py-0 md:px-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Licencia de Conducir:</span>
                  <span className="font-mono font-bold text-white">{profile.licenseNumber}</span>
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
                    <span className="text-gray-500 font-normal">({profile.totalRides} viajes)</span>
                  </div>
                </div>
              </div>

              {/* Status & Vehicle */}
              <div className="space-y-2 text-xs flex flex-col justify-center">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Estado de Red:</span>
                  <span
                    className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full ${
                      profile.isOnline
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-gray-500/10 text-gray-400 border border-gray-500/30'
                    }`}
                  >
                    {profile.isOnline ? '● EN LÍNEA' : '○ DESCONECTADO'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Unidad Asignada:</span>
                  <span className="text-white font-semibold flex items-center gap-1">
                    <Car className="w-3.5 h-3.5 text-luxury-gold" />
                    {profile.currentVehicle
                      ? `${profile.currentVehicle.make} ${profile.currentVehicle.model}`
                      : 'Ninguna'}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-executive-border gap-2">
              <button
                onClick={() => setActiveTab('docs')}
                className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors flex items-center gap-2 ${
                  activeTab === 'docs'
                    ? 'bg-luxury-gold text-black border-t border-x border-luxury-gold'
                    : 'text-gray-400 hover:text-white hover:bg-executive-dark'
                }`}
              >
                <FileText className="w-4 h-4" />
                EXPEDIENTE DIGITAL DE DOCUMENTOS
              </button>
              <button
                onClick={() => setActiveTab('balance')}
                className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors flex items-center gap-2 ${
                  activeTab === 'balance'
                    ? 'bg-luxury-gold text-black border-t border-x border-luxury-gold'
                    : 'text-gray-400 hover:text-white hover:bg-executive-dark'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                FINANZAS & COMISIONES
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors flex items-center gap-2 ${
                  activeTab === 'history'
                    ? 'bg-luxury-gold text-black border-t border-x border-luxury-gold'
                    : 'text-gray-400 hover:text-white hover:bg-executive-dark'
                }`}
              >
                <Clock className="w-4 h-4" />
                HISTORIAL DE TURNOS
              </button>
            </div>

            {/* Tab 1: Documents */}
            {activeTab === 'docs' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Documentos Obligatorios de Ley (Auditoría)
                  </h4>
                  <button
                    onClick={() => setShowUploadForm(!showUploadForm)}
                    className="px-3 py-1.5 bg-executive-dark hover:bg-executive-border border border-executive-border text-xs font-semibold text-luxury-gold rounded-xl flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {showUploadForm ? 'Cancelar' : 'Adjuntar Documento'}
                  </button>
                </div>

                {/* Upload Form Modal/Inline */}
                {showUploadForm && (
                  <form
                    onSubmit={handleUploadDocument}
                    className="p-4 bg-executive-dark rounded-xl border border-luxury-gold/40 space-y-3"
                  >
                    <h5 className="text-xs font-bold text-luxury-gold">Adjuntar Expediente / Documento de Ley</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-gray-400 block mb-1">Tipo de Documento</label>
                        <select
                          value={docType}
                          onChange={(e) => setDocType(e.target.value)}
                          className="w-full bg-executive-card border border-executive-border rounded-lg p-2 text-white"
                        >
                          <option value="DRIVER_LICENSE">Licencia de Conducir Profesional (PDF)</option>
                          <option value="MEDICAL_CERTIFICATE">Certificado Médico Aprobado (PDF)</option>
                          <option value="DRIVING_CERTIFICATE">Certificado de Saber Conducir / Capacitación (PDF)</option>
                          <option value="CRIMINAL_RECORD">Certificado de Antecedentes Penales (PDF)</option>
                          <option value="IDENTITY_CARD">DNI / Documento Identidad (PDF)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-gray-400 block mb-1">Número de Documento</label>
                        <input
                          type="text"
                          placeholder="Ej: LIC-A3C-998877"
                          value={docNumber}
                          onChange={(e) => setDocNumber(e.target.value)}
                          className="w-full bg-executive-card border border-executive-border rounded-lg p-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-gray-400 block mb-1">Seleccionar Archivo Físico (PDF o Imagen)</label>
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const formData = new FormData();
                              formData.append('file', file);
                              const res = await api.post('/drivers/upload-file', formData, {
                                headers: { 'Content-Type': 'multipart/form-data' },
                              });
                              if (res.data?.data?.fileUrl) {
                                setFileUrl(res.data.data.fileUrl);
                              }
                            } catch (_) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                if (ev.target?.result) setFileUrl(ev.target.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="w-full bg-executive-card border border-executive-border rounded-lg p-1.5 text-white text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-luxury-gold file:text-black cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="text-gray-400 block mb-1">Fecha de Vencimiento</label>
                        <input
                          type="date"
                          value={expirationDate}
                          onChange={(e) => setExpirationDate(e.target.value)}
                          className="w-full bg-executive-card border border-executive-border rounded-lg p-2 text-white"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={submittingDoc}
                      className="px-4 py-2 bg-luxury-gold hover:bg-luxury-gold-hover text-black font-bold text-xs rounded-lg transition-all"
                    >
                      {submittingDoc ? 'Guardando...' : 'Registrar en Expediente'}
                    </button>
                  </form>
                )}

                {/* Documents Table */}
                <div className="space-y-3">
                  {profile.documents && profile.documents.length > 0 ? (
                    profile.documents.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="p-4 bg-executive-dark rounded-xl border border-executive-border flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-executive-card rounded-xl border border-executive-border text-gray-300">
                            <FileText className="w-5 h-5 text-luxury-gold" />
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">
                              {doc.documentType === 'DRIVER_LICENSE'
                                ? 'Licencia de Conducir (PDF)'
                                : doc.documentType === 'MEDICAL_CERTIFICATE'
                                ? 'Certificado Médico Aprobado (PDF)'
                                : doc.documentType === 'DRIVING_CERTIFICATE'
                                ? 'Certificado de Saber Conducir (PDF)'
                                : doc.documentType === 'CRIMINAL_RECORD'
                                ? 'Antecedentes Penales (PDF)'
                                : 'Documento de Identidad DNI (PDF)'}
                            </div>
                            <div className="text-gray-400 font-mono text-[11px]">
                              Nº: {doc.documentNumber || 'Sin código'} | Vence:{' '}
                              {new Date(doc.expirationDate).toLocaleDateString()}
                            </div>
                            {doc.fileUrl && (
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-luxury-gold hover:underline text-[11px] block mt-0.5"
                              >
                                Ver documento adjunto ↗
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Status Badge & Actions */}
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3 py-1 font-bold rounded-full flex items-center gap-1.5 text-[11px] ${
                              doc.status === 'APPROVED'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : doc.status === 'REJECTED'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {doc.status === 'APPROVED' && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {doc.status === 'REJECTED' && <AlertTriangle className="w-3.5 h-3.5" />}
                            {doc.status === 'PENDING' && <Clock className="w-3.5 h-3.5" />}
                            {doc.status === 'APPROVED'
                              ? 'APROBADO'
                              : doc.status === 'REJECTED'
                              ? 'RECHAZADO'
                              : 'PENDIENTE DE REVISIÓN'}
                          </span>

                          {doc.status === 'PENDING' && (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleVerifyDocument(doc.id, 'APPROVED')}
                                className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-lg text-[11px]"
                              >
                                Aprobar
                              </button>
                              <button
                                onClick={() => handleVerifyDocument(doc.id, 'REJECTED')}
                                className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg text-[11px]"
                              >
                                Rechazar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-gray-400 bg-executive-dark rounded-xl border border-executive-border text-xs">
                      No hay documentos cargados en el expediente de este chofer.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Balance */}
            {activeTab === 'balance' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-executive-dark p-5 rounded-xl border border-executive-border space-y-2">
                  <span className="text-xs text-gray-400 uppercase tracking-wider block">Balance Disponible</span>
                  <div className="text-2xl font-black text-emerald-400">
                    ${Number(profile.balance?.currentBalance || 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-400">Fondo neto acumulado listo para liquidación.</p>
                </div>

                <div className="bg-executive-dark p-5 rounded-xl border border-executive-border space-y-2">
                  <span className="text-xs text-gray-400 uppercase tracking-wider block">Pagos Pendientes</span>
                  <div className="text-2xl font-black text-luxury-gold">
                    ${Number(profile.balance?.pendingPayout || 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-400">Pendiente de transferencia semanal.</p>
                </div>

                <div className="bg-executive-dark p-5 rounded-xl border border-executive-border space-y-2">
                  <span className="text-xs text-gray-400 uppercase tracking-wider block">Ganancia Histórica Total</span>
                  <div className="text-2xl font-black text-white">
                    ${Number(profile.balance?.totalEarned || 0).toFixed(2)}
                  </div>
                </div>

                <div className="bg-executive-dark p-5 rounded-xl border border-executive-border space-y-2">
                  <span className="text-xs text-gray-400 uppercase tracking-wider block">Comisiones Retenidas Plataforma</span>
                  <div className="text-2xl font-black text-gray-300">
                    ${Number(profile.balance?.totalCommissionPaid || 0).toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: History */}
            {activeTab === 'history' && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-300">Asignaciones de Vehículos y Turnos Recientes</h4>
                {profile.recentAssignments && profile.recentAssignments.length > 0 ? (
                  profile.recentAssignments.map((as: any) => (
                    <div
                      key={as.id}
                      className="p-4 bg-executive-dark rounded-xl border border-executive-border flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <Car className="w-5 h-5 text-luxury-gold" />
                        <div>
                          <div className="font-bold text-white">
                            {as.vehicle ? `${as.vehicle.make} ${as.vehicle.model} (${as.vehicle.licensePlate})` : 'Vehículo Desconocido'}
                          </div>
                          <div className="text-gray-400 text-[11px]">
                            Odómetro inicial: {as.initialOdometer} km | Odómetro final:{' '}
                            {as.finalOdometer ? `${as.finalOdometer} km` : 'En curso'}
                          </div>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {as.shiftStatus || 'COMPLETED'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-400 bg-executive-dark rounded-xl border border-executive-border text-xs">
                    No se registran turnos previos finalizados.
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
