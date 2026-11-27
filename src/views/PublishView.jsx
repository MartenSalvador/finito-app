import { useState, useEffect } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { ImagePlus, Loader2, Trash2, Upload } from 'lucide-react';
import { db, storage } from '../firebase/config';

const MAX_PHOTOS = 3;

function createEmptyPhotoSlot() {
  return {
    mode: 'file', // 'file' | 'url'
    url: '',
    file: null,
    previewUrl: '',
  };
}

export default function PublishView({ currentUser, addPuzzle, t }) {
  const [newTitle, setNewTitle] = useState('');
  const [newPieces, setNewPieces] = useState(1000);
  const [newStatus, setNewStatus] = useState('Completo (100% garantizado)');
  const [newDesc, setNewDesc] = useState('');
  const [photoSlots, setPhotoSlots] = useState([createEmptyPhotoSlot()]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');

  useEffect(() => {
    return () => {
      photoSlots.forEach((slot) => {
        if (slot.previewUrl) {
          URL.revokeObjectURL(slot.previewUrl);
        }
      });
    };
  }, [photoSlots]);

  const handleAddImageField = () => {
    if (photoSlots.length < MAX_PHOTOS) {
      setPhotoSlots((prev) => [...prev, createEmptyPhotoSlot()]);
    }
  };

  const handlePhotoUrlChange = (index, value) => {
    setPublishError('');
    setPhotoSlots((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, url: value } : slot))
    );
  };

  const handlePhotoFileChange = (index, file) => {
    setPublishError('');
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPhotoSlots((prev) =>
      prev.map((slot, i) => {
        if (i !== index) return slot;
        if (slot.previewUrl) {
          URL.revokeObjectURL(slot.previewUrl);
        }
        return {
          ...slot,
          file,
          previewUrl: objectUrl,
        };
      })
    );
  };

  const handleToggleSlotMode = (index, nextMode) => {
    setPublishError('');
    setPhotoSlots((prev) =>
      prev.map((slot, i) => {
        if (i !== index) return slot;
        if (slot.previewUrl) {
          URL.revokeObjectURL(slot.previewUrl);
        }
        return {
          ...createEmptyPhotoSlot(),
          mode: nextMode,
        };
      })
    );
  };

  const handleRemoveImageField = (index) => {
    setPhotoSlots((prev) => {
      const target = prev[index];
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      const remaining = prev.filter((_, i) => i !== index);
      return remaining.length > 0 ? remaining : [createEmptyPhotoSlot()];
    });
  };

  const resolvePhotoUrls = async (ownerId) => {
    const urls = [];

    for (let i = 0; i < photoSlots.length; i += 1) {
      const slot = photoSlots[i];

      if (slot.mode === 'file' && slot.file) {
        const safeName = slot.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storageRef = ref(
          storage,
          `puzzles/${ownerId}/${Date.now()}_${i}_${safeName}`
        );
        const snapshot = await uploadBytes(storageRef, slot.file);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        urls.push(downloadUrl);
      } else if (slot.mode === 'url' && slot.url.trim()) {
        urls.push(slot.url.trim());
      }
    }

    return urls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isPublishing) return;

    const trimmedTitle = newTitle.trim();
    const firstSlot = photoSlots[0];
    const hasFirstPhoto =
      (firstSlot?.mode === 'file' && Boolean(firstSlot?.file)) ||
      (firstSlot?.mode === 'url' && Boolean(firstSlot?.url?.trim()));

    if (!trimmedTitle || !hasFirstPhoto) {
      setPublishError(
        t?.publishMissingRequired ||
          'Completá el título y agregá al menos la foto principal.'
      );
      return;
    }

    setIsPublishing(true);
    setPublishError('');

    try {
      const ownerId = currentUser?.id || 'guest';
      const validImages = await resolvePhotoUrls(ownerId);

      if (validImages.length === 0) {
        setPublishError(
          t?.publishPhotoError || 'No se pudo procesar ninguna imagen.'
        );
        return;
      }

      const puzzlePayload = {
        userId: currentUser.id,
        userName: currentUser.name,
        city: currentUser.city,
        cp: currentUser.cp || '',
        lat: currentUser.lat ?? 53.0526,
        lon: currentUser.lon ?? 8.6293,
        distanceKm: 0,
        title: trimmedTitle,
        pieces: Number(newPieces),
        status: newStatus,
        images: validImages,
        image: validImages[0],
        description: newDesc.trim() || t?.defaultDescription || '',
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'puzzles'), puzzlePayload);

      addPuzzle?.({
        id: docRef.id,
        ...puzzlePayload,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error al publicar el rompecabezas:', error);
      setPublishError(
        t?.publishSubmitError ||
          'No pudimos publicar el rompecabezas. Revisá tu conexión e intentá de nuevo.'
      );
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white border border-[#E5E0F5] rounded-3xl p-6 shadow-sm animate-fade-in">
      <h2 className="text-xl font-extrabold mb-1 text-[#18181B]">{t.publishTitle}</h2>
      <p className="text-xs text-[#6B7280] mb-6 leading-relaxed">
        {t.publishSubtitle}
      </p>

      {publishError && (
        <div className="mb-4 bg-[#F5F3FF] border border-[#5B3DF5]/35 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-[#5B3DF5] animate-slide-step">
          {publishError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs uppercase font-extrabold text-[#6B7280] tracking-wider mb-1.5">
            {t.titleLabel}
          </label>
          <input
            type="text"
            placeholder={t.titlePlaceholder}
            value={newTitle}
            disabled={isPublishing}
            onChange={(e) => {
              setNewTitle(e.target.value);
              if (publishError) setPublishError('');
            }}
            className="w-full bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl px-4 py-3 text-sm text-[#18181B] placeholder-[#6B7280]/75 focus:outline-none focus:border-[#5B3DF5] focus:bg-white transition-all duration-200 disabled:opacity-60"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase font-extrabold text-[#6B7280] tracking-wider mb-1.5">
              {t.piecesLabel}
            </label>
            <select
              value={newPieces}
              disabled={isPublishing}
              onChange={(e) => setNewPieces(Number(e.target.value))}
              className="w-full bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl px-4 py-3 text-sm text-[#18181B] focus:outline-none focus:border-[#5B3DF5] focus:bg-white transition-all duration-200 cursor-pointer disabled:opacity-60"
            >
              <option value={500}>500 {t.pieces}</option>
              <option value={1000}>1000 {t.pieces}</option>
              <option value={1500}>1500 {t.pieces}</option>
              <option value={2000}>2000+ {t.pieces}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase font-extrabold text-[#6B7280] tracking-wider mb-1.5">
              {t.statusLabel}
            </label>
            <select
              value={newStatus}
              disabled={isPublishing}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl px-4 py-3 text-sm text-[#18181B] focus:outline-none focus:border-[#5B3DF5] focus:bg-white transition-all duration-200 cursor-pointer disabled:opacity-60"
            >
              <option value="Completo (100% garantizado)">{t.statusComplete}</option>
              <option value="Falta 1 pieza (avisado)">{t.statusMissing}</option>
              <option value="Nuevo / Sellado">{t.statusSealed}</option>
            </select>
          </div>
        </div>

        {/* Sección Dinámica de Fotos (Hasta 3) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs uppercase font-extrabold text-[#6B7280] tracking-wider">
              {t.puzzlePhotosLabel}
            </label>
            <span className="text-[11px] font-extrabold bg-[#FFD43B] text-[#18181B] px-2 py-0.5 rounded-full tabular-nums">
              {photoSlots.length}/{MAX_PHOTOS}
            </span>
          </div>

          {photoSlots.map((slot, index) => (
            <div
              key={index}
              className="bg-[#F5F3FF]/60 border border-[#E5E0F5] rounded-2xl p-3 space-y-2 animate-slide-step"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex bg-white p-0.5 rounded-full border border-[#E5E0F5] text-[11px] font-bold">
                  <button
                    type="button"
                    disabled={isPublishing}
                    onClick={() => handleToggleSlotMode(index, 'file')}
                    className={`px-2.5 py-1 rounded-full transition-colors ${
                      slot.mode === 'file'
                        ? 'bg-[#5B3DF5] text-white'
                        : 'text-[#6B7280] hover:text-[#18181B]'
                    }`}
                  >
                    {t?.uploadFileLabel || 'Archivo'}
                  </button>
                  <button
                    type="button"
                    disabled={isPublishing}
                    onClick={() => handleToggleSlotMode(index, 'url')}
                    className={`px-2.5 py-1 rounded-full transition-colors ${
                      slot.mode === 'url'
                        ? 'bg-[#5B3DF5] text-white'
                        : 'text-[#6B7280] hover:text-[#18181B]'
                    }`}
                  >
                    URL
                  </button>
                </div>

                {photoSlots.length > 1 && (
                  <button
                    type="button"
                    disabled={isPublishing}
                    aria-label={t?.removePhoto || 'Eliminar foto'}
                    onClick={() => handleRemoveImageField(index)}
                    className="bg-white hover:bg-[#EBE7FF] text-[#5B3DF5] border border-[#E5E0F5] p-1.5 rounded-xl transition-all duration-200 active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {slot.mode === 'file' ? (
                <label className="flex items-center gap-2.5 bg-white hover:bg-[#F5F3FF] border border-dashed border-[#E5E0F5] hover:border-[#5B3DF5] rounded-xl px-3 py-2.5 text-xs font-bold text-[#6B7280] hover:text-[#5B3DF5] cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 shrink-0 text-[#5B3DF5]" />
                  <span className="truncate">
                    {slot.file?.name ||
                      (index === 0
                        ? t.mainPhotoPlaceholder || 'Elegí la foto principal'
                        : t.additionalPhotoPlaceholder?.(index + 1) || `Elegí foto ${index + 1}`)}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isPublishing}
                    onChange={(e) => handlePhotoFileChange(index, e.target.files?.[0])}
                    className="sr-only"
                  />
                </label>
              ) : (
                <input
                  type="url"
                  disabled={isPublishing}
                  placeholder={
                    index === 0
                      ? t.mainPhotoPlaceholder
                      : t.additionalPhotoPlaceholder(index + 1)
                  }
                  value={slot.url}
                  onChange={(e) => handlePhotoUrlChange(index, e.target.value)}
                  className="w-full bg-white border border-[#E5E0F5] rounded-xl px-3.5 py-2 text-sm text-[#18181B] placeholder-[#6B7280]/75 focus:outline-none focus:border-[#5B3DF5] transition-all duration-200 disabled:opacity-60"
                />
              )}

              {(slot.previewUrl || (slot.mode === 'url' && slot.url.trim())) && (
                <div className="pt-1">
                  <img
                    src={slot.previewUrl || slot.url.trim()}
                    alt={`Vista previa ${index + 1}`}
                    className="w-full h-32 object-cover rounded-xl border border-[#E5E0F5]"
                  />
                </div>
              )}
            </div>
          ))}

          {photoSlots.length < MAX_PHOTOS && (
            <button
              type="button"
              disabled={isPublishing}
              onClick={handleAddImageField}
              className="w-full mt-1 border border-dashed border-[#E5E0F5] hover:border-[#5B3DF5] bg-[#F5F3FF]/70 hover:bg-[#F5F3FF] text-[#6B7280] hover:text-[#5B3DF5] py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.99] disabled:opacity-50"
            >
              <ImagePlus className="w-4 h-4" /> {t.addAnotherPhoto}
            </button>
          )}
        </div>

        <div>
          <label className="block text-xs uppercase font-extrabold text-[#6B7280] tracking-wider mb-1.5">
            {t.descLabel}
          </label>
          <textarea
            rows="3"
            placeholder={t.descPlaceholder}
            value={newDesc}
            disabled={isPublishing}
            onChange={(e) => setNewDesc(e.target.value)}
            className="w-full bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl px-4 py-3 text-sm text-[#18181B] placeholder-[#6B7280]/75 focus:outline-none focus:border-[#5B3DF5] focus:bg-white transition-all duration-200 resize-none disabled:opacity-60"
          />
        </div>

        <button
          type="submit"
          disabled={isPublishing}
          className="w-full bg-[#5B3DF5] hover:bg-[#482BD9] text-white font-bold py-3 rounded-2xl transition-all duration-200 shadow-xs hover:shadow active:scale-[0.98] inline-flex items-center justify-center gap-2 disabled:opacity-65 disabled:pointer-events-none"
        >
          {isPublishing && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{t.publishBtn}</span>
        </button>
      </form>
    </div>
  );
}