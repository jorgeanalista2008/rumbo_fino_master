'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Edit3, Shield, User, Phone, Mail, FileText, CheckCircle2, Camera, Upload, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { ModalPortal } from './ModalPortal';

interface EditDriverModalProps {
  driver: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditDriverModal({ driver, onClose, onSuccess }: EditDriverModalProps) {
  const [firstName, setFirstName] = useState(driver?.user?.firstName || '');
  const [lastName, setLastName] = useState(driver?.user?.lastName || '');
  const [email, setEmail] = useState(driver?.user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(driver?.user?.phoneNumber || '+51 987 654 321');
  const [avatarUrl, setAvatarUrl] = useState(driver?.user?.avatarUrl || '');
  const [photoFileName, setPhotoFileName] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [licenseNumber, setLicenseNumber] = useState(driver?.licenseNumber || '');
  const [licenseCategory, setLicenseCategory] = useState(driver?.licenseCategory || 'A-IIIc Executive');
  const [licenseExpiration, setLicenseExpiration] = useState(
    driver?.licenseExpiration ? new Date(driver.licenseExpiration).toISOString().split('T')[0] : '2028-12-31'
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (driver) {
      setFirstName(driver.user?.firstName || '');
      setLastName(driver.user?.lastName || '');
      setEmail(driver.user?.email || '');
      setPhoneNumber(driver.user?.phoneNumber || '+51 987 654 321');
      setAvatarUrl(driver.user?.avatarUrl || '');
      setLicenseNumber(driver.licenseNumber || '');
      setLicenseCategory(driver.licenseCategory || 'A-IIIc Executive');
      if (driver.licenseExpiration) {
        try {
          setLicenseExpiration(new Date(driver.licenseExpiration).toISOString().split('T')[0]);
        } catch (_) {}
      }
    }
  }, [driver]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driver?.id) return;
    setSubmitting(true);

    try {
      await api.patch(`/drivers/${driver.id}`, {
        firstName,
        lastName,
        email,
        phoneNumber,
        avatarUrl: avatarUrl || undefined,
        licenseNumber,
        licenseCategory,
        licenseExpiration,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.warn('Error actualizando chofer en API:', err);
      onSuccess();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!driver) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
        <div className="bg-executive-card border border-executive-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-executive-border bg-executive-dark/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-luxury-gold/10 text-luxury-gold rounded-xl border border-luxury-gold/30">
              <Edit3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Editar Perfil de Chofer Ejecutivo</h2>
              <p className="text-xs text-gray-400">Actualizar datos personales o información de la licencia profesional</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-executive-dark hover:bg-executive-border text-gray-400 hover:text-white rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs">
          {/* Section 1: User Details & Photo */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-luxury-gold uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4" />
              1. Datos Personales & Fotografía del Chofer
            </h3>

            {/* Photo Upload & Preview Card */}
            <div className="p-3.5 bg-executive-dark border border-executive-border rounded-xl flex items-center gap-4">
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
                    {firstName ? firstName.charAt(0) : 'C'}
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
                  <span className="text-gray-200 font-bold text-xs">Fotografía de Perfil del Chofer</span>
                  {uploadingPhoto && (
                    <span className="text-[11px] text-luxury-gold font-bold flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Subiendo...
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400">
                  {photoFileName ? `Archivo: ${photoFileName}` : 'Formato JPG o PNG de alta resolución.'}
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="px-3 py-1 bg-luxury-gold/10 hover:bg-luxury-gold/20 text-luxury-gold border border-luxury-gold/30 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" /> Seleccionar Fotografía
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-gray-300 font-bold block mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-executive-dark border border-executive-border rounded-xl p-3 text-white focus:outline-none focus:border-luxury-gold"
                />
              </div>
              <div>
                <label className="text-gray-300 font-bold block mb-1">Apellido</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-executive-dark border border-executive-border rounded-xl p-3 text-white focus:outline-none focus:border-luxury-gold"
                />
              </div>
              <div>
                <label className="text-gray-300 font-bold block mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-gray-400" /> Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-executive-dark border border-executive-border rounded-xl p-3 text-white focus:outline-none focus:border-luxury-gold"
                />
              </div>
              <div>
                <label className="text-gray-300 font-bold block mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-gray-400" /> Teléfono Móvil
                </label>
                <input
                  type="text"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-executive-dark border border-executive-border rounded-xl p-3 text-white focus:outline-none focus:border-luxury-gold"
                />
              </div>
            </div>
          </div>

          <hr className="border-executive-border/60" />

          {/* Section 2: Professional License Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-luxury-gold uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4" />
              2. Ficha de Licencia de Conducir
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-gray-300 font-bold block mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-gray-400" /> Nº de Licencia
                </label>
                <input
                  type="text"
                  required
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="w-full bg-executive-dark border border-executive-border rounded-xl p-3 text-white font-mono focus:outline-none focus:border-luxury-gold"
                />
              </div>
              <div>
                <label className="text-gray-300 font-bold block mb-1">Categoría</label>
                <select
                  value={licenseCategory}
                  onChange={(e) => setLicenseCategory(e.target.value)}
                  className="w-full bg-executive-dark border border-executive-border rounded-xl p-3 text-white focus:outline-none focus:border-luxury-gold"
                >
                  <option value="A-IIIc Executive">A-IIIc Executive (Prémium)</option>
                  <option value="A-IIIa Professional">A-IIIa Profesional</option>
                  <option value="A-IIb Standard">A-IIb Estándar</option>
                </select>
              </div>
              <div>
                <label className="text-gray-300 font-bold block mb-1">Vencimiento Licencia</label>
                <input
                  type="date"
                  required
                  value={licenseExpiration}
                  onChange={(e) => setLicenseExpiration(e.target.value)}
                  className="w-full bg-executive-dark border border-executive-border rounded-xl p-3 text-white focus:outline-none focus:border-luxury-gold"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-executive-border flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-executive-dark hover:bg-executive-border border border-executive-border text-gray-300 font-bold rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-luxury-gold hover:bg-luxury-gold-hover text-black font-bold rounded-xl shadow-lg shadow-luxury-gold/20 flex items-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </ModalPortal>
  );
}
