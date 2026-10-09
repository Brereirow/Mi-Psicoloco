import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  User as UserIcon,
  Phone,
  Building,
  CheckCircle2,
  Save,
  Camera,
  Trash2,
  Upload,
  AlertCircle,
  X,
  RefreshCw,
} from 'lucide-react';

export const ProfileSettings: React.FC = () => {
  const { user, profile, institution, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [emergencyName, setEmergencyName] = useState(profile?.emergencyContactName || '');
  const [emergencyPhone, setEmergencyPhone] = useState(profile?.emergencyContactPhone || '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Photo states
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string>('');
  const [previewFileSize, setPreviewFileSize] = useState<string>('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoSuccessMsg, setPhotoSuccessMsg] = useState<string | null>(null);
  const [photoErrorMsg, setPhotoErrorMsg] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || '');
    }
    if (profile) {
      setEmergencyName(profile.emergencyContactName || '');
      setEmergencyPhone(profile.emergencyContactPhone || '');
    }
  }, [user, profile]);

  // Image validation and file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoErrorMsg(null);
    setPhotoSuccessMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input value so same file can be selected again if needed
    e.target.value = '';

    // Validate type (JPEG, PNG, WebP)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setPhotoErrorMsg('Formato de archivo no admitido. Por favor selecciona una imagen JPEG, PNG o WebP.');
      return;
    }

    // Validate size (max 5 MB)
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      setPhotoErrorMsg(
        `El archivo excede el tamaño máximo permitido de 5 MB (tamaño actual: ${(file.size / (1024 * 1024)).toFixed(2)} MB).`
      );
      return;
    }

    const sizeFormatted =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(0)} KB`;

    // Read and preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        // Validate image can be decoded
        const img = new Image();
        img.onload = () => {
          setPreviewDataUrl(result);
          setPreviewFileName(file.name);
          setPreviewFileSize(sizeFormatted);
        };
        img.onerror = () => {
          setPhotoErrorMsg('El archivo seleccionado está dañado o no es una imagen válida.');
        };
        img.src = result;
      }
    };
    reader.onerror = () => {
      setPhotoErrorMsg('Error al leer el archivo desde el dispositivo.');
    };
    reader.readAsDataURL(file);
  };

  const handleCancelPreview = () => {
    setPreviewDataUrl(null);
    setPreviewFileName('');
    setPreviewFileSize('');
    setPhotoErrorMsg(null);
  };

  const handleSavePhoto = async () => {
    if (!previewDataUrl) return;
    setUploadingPhoto(true);
    setPhotoErrorMsg(null);
    setPhotoSuccessMsg(null);

    try {
      const res = await api.uploadAvatar(previewDataUrl);
      if (res.success) {
        setPhotoSuccessMsg('Tu fotografía de perfil ha sido actualizada y guardada correctamente.');
        setPreviewDataUrl(null);
        setPreviewFileName('');
        setImageLoadError(false);
        await refreshUser();
        setTimeout(() => setPhotoSuccessMsg(null), 3500);
      } else {
        setPhotoErrorMsg(res.error || 'No se pudo guardar la fotografía.');
      }
    } catch (err: any) {
      console.error(err);
      setPhotoErrorMsg(err.message || 'Error al subir la fotografía de perfil.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!window.confirm('¿Seguro que deseas eliminar tu fotografía de perfil? Se mostrará el avatar predeterminado con tus iniciales.')) {
      return;
    }

    setUploadingPhoto(true);
    setPhotoErrorMsg(null);
    setPhotoSuccessMsg(null);

    try {
      const res = await api.deleteAvatar();
      if (res.success) {
        setPhotoSuccessMsg('Fotografía de perfil eliminada correctamente.');
        setImageLoadError(false);
        await refreshUser();
        setTimeout(() => setPhotoSuccessMsg(null), 3500);
      } else {
        setPhotoErrorMsg(res.error || 'Error al eliminar la fotografía.');
      }
    } catch (err: any) {
      console.error(err);
      setPhotoErrorMsg(err.message || 'Error al eliminar la fotografía de perfil.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateProfile({
        name,
        phone,
        emergencyContactName: emergencyName,
        emergencyContactPhone: emergencyPhone,
      });
      setSavedSuccess(true);
      await refreshUser();
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const initials = (user?.name || 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const hasPhoto = Boolean(user?.avatar && !imageLoadError);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-bold text-slate-800">Mi Perfil & Configuración</h1>
        <p className="text-xs text-slate-500 mt-1">
          Administra tu fotografía de perfil, datos personales de contacto y los números para emergencias escolares.
        </p>

        {/* SECTION: FOTOGRAFÍA DE PERFIL */}
        <div className="mt-6 p-5 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar display / Preview */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-white flex items-center justify-center">
                {previewDataUrl ? (
                  <img
                    src={previewDataUrl}
                    alt="Vista previa de foto"
                    className="w-full h-full object-cover"
                  />
                ) : hasPhoto ? (
                  <img
                    src={user?.avatar}
                    alt={user?.name}
                    onError={() => setImageLoadError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-teal-600 to-indigo-700 flex flex-col items-center justify-center text-white font-black text-xl">
                    <span>{initials}</span>
                    <span className="text-[9px] uppercase tracking-wider font-semibold opacity-80 mt-0.5">
                      {user?.role}
                    </span>
                  </div>
                )}
              </div>

              {previewDataUrl && (
                <span className="absolute -bottom-2 -right-1 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                  Vista previa
                </span>
              )}
            </div>

            {/* Controls & Description */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Fotografía de Perfil</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Formatos permitidos: JPEG, PNG o WebP. Tamaño máximo de 5 MB. Visible para el personal institucional según permisos.
                </p>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Feedback messages */}
              {photoSuccessMsg && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{photoSuccessMsg}</span>
                </div>
              )}

              {photoErrorMsg && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{photoErrorMsg}</span>
                </div>
              )}

              {/* Buttons Row */}
              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {previewDataUrl ? (
                  <>
                    <button
                      type="button"
                      disabled={uploadingPhoto}
                      onClick={handleSavePhoto}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {uploadingPhoto ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Guardar Foto</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={uploadingPhoto}
                      onClick={handleCancelPreview}
                      className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Cancelar Vista Previa
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={uploadingPhoto}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{hasPhoto ? 'Cambiar Foto' : 'Agregar Foto'}</span>
                    </button>

                    {hasPhoto && (
                      <button
                        type="button"
                        disabled={uploadingPhoto}
                        onClick={handleDeletePhoto}
                        className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar Foto</span>
                      </button>
                    )}
                  </>
                )}
              </div>

              {previewFileName && (
                <p className="text-[11px] text-slate-500">
                  Archivo seleccionado: <strong>{previewFileName}</strong> ({previewFileSize})
                </p>
              )}
            </div>
          </div>
        </div>

        {savedSuccess && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Perfil actualizado exitosamente.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 mt-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nombre completo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico (No editable)</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono Personal</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Student specific fields */}
          {user?.role === 'student' && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-800">Contacto Familiar de Emergencia</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre de contacto</label>
                  <input
                    type="text"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    placeholder="Ej. Mamá o Tutor"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Teléfono de emergencia</label>
                  <input
                    type="text"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="+52 55..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-3 border-t flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Institutional Info Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Building className="w-4 h-4 text-teal-600" />
          <span>Institución Vinculada</span>
        </h3>
        <div className="text-slate-600 space-y-1">
          <div>
            <strong>Nombre:</strong> {institution?.name || 'Instituto Tecnológico Demo'}
          </div>
          <div>
            <strong>Soporte Estudiantil:</strong> {institution?.supportEmail || 'bienestar@institutodemo.edu'}
          </div>
          <div>
            <strong>Línea Institucional:</strong> {institution?.supportPhone || '+52 800 999 4357'} Ext. 104
          </div>
        </div>
      </div>
    </div>
  );
};
