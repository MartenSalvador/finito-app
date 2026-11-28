import { useEffect, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Images,
  Plus,
  Share2,
  Trash2,
  Upload,
  X,
  Loader2,
} from 'lucide-react';

export default function CompletedGallerySection({
  userId,
  completedPuzzles = [],
  onAddCompletedPuzzle,
  onDeleteCompletedPuzzle,
  onSelectPuzzle,
  allowUpload = true,
  defaultOpen = false,
  t,
}) {
  const myCompletedPuzzles = completedPuzzles.filter((cp) => cp.userId === userId);

  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [form, setForm] = useState({
    title: '',
    pieces: '',
    image: '',
    imageFile: null,
    note: '',
  });

  useEffect(() => {
    return () => {
      if (form.imageFile && form.image.startsWith('blob:')) {
        URL.revokeObjectURL(form.image);
      }
    };
  }, [form.image, form.imageFile]);

  const handleToggleSection = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (!next) setShowUploadForm(false);
      return next;
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubmitError('');
    setForm((prev) => ({
      ...prev,
      image: URL.createObjectURL(file),
      imageFile: file,
    }));
    e.target.value = '';
  };

  const handleShare = async (e, item) => {
    e.stopPropagation();

    const shareUrl = window.location.href;
    const piecesText = item.pieces ? ` (${item.pieces} ${t?.pieces || 'piezas'})` : '';
    const shareText =
      t?.shareCompletedText?.replace('{title}', `${item.title}${piecesText}`) ||
      `¡Mirá este puzzle que armé en Finito: ${item.title}${piecesText}!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title || 'Finito',
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard?.writeText(`${shareText} ${shareUrl}`);
      setCopiedId(item.id);
      setTimeout(() => {
        setCopiedId((prev) => (prev === item.id ? null : prev));
      }, 2000);
    } catch (err) {
      console.error('No se pudo copiar el enlace:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving || !form.title.trim() || !form.image.trim() || !onAddCompletedPuzzle) return;

    setIsSaving(true);
    setSubmitError('');
    try {
      await onAddCompletedPuzzle({
        id: `cp-${Date.now()}`,
        userId,
        title: form.title.trim(),
        pieces: form.pieces ? Number(form.pieces) : undefined,
        image: form.imageFile ? '' : form.image.trim(),
        imageFile: form.imageFile,
        note: form.note.trim(),
        completedAt: new Date().toLocaleDateString(),
      });

      setForm({ title: '', pieces: '', image: '', imageFile: null, note: '' });
      setShowUploadForm(false);
    } catch (error) {
      setSubmitError(
        error?.message || t?.completedSaveError || 'No pudimos guardar el puzzle terminado.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-[#E5E0F5] shadow-2xs rounded-3xl overflow-hidden transition-all duration-300">
      <button
        type="button"
        onClick={handleToggleSection}
        aria-expanded={isOpen}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-[#F5F3FF] transition-colors duration-200"
      >
        <span className="font-extrabold text-xs text-[#18181B] uppercase tracking-wider flex items-center gap-2">
          <Images className="w-4 h-4 text-[#5B3DF5]" />
          <span>{t?.completedGallery || 'Puzzles armados'}</span>
          <span className="bg-[#FFD43B] text-[#18181B] px-2.5 py-0.5 rounded-full text-[11px] font-extrabold tabular-nums">
            {myCompletedPuzzles.length}
          </span>
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-[#6B7280] transition-transform duration-200" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#6B7280] transition-transform duration-200" />
        )}
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-3 border-t border-[#E5E0F5] pt-3 animate-collapse-reveal">
          {allowUpload && onAddCompletedPuzzle && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowUploadForm((prev) => !prev)}
                className={`font-bold text-xs px-3.5 py-2 rounded-2xl transition-all duration-200 active:scale-95 shadow-2xs inline-flex items-center gap-1.5 ${
                  showUploadForm
                    ? 'bg-[#F5F3FF] hover:bg-[#EBE7FF] text-[#18181B] border border-[#E5E0F5]'
                    : 'bg-[#5B3DF5] hover:bg-[#482BD9] text-white'
                }`}
              >
                {showUploadForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>
                  {showUploadForm
                    ? t?.cancelBtn || 'Cancelar'
                    : t?.addCompletedPuzzleTitle || 'Subir puzzle terminado'}
                </span>
              </button>
            </div>
          )}

          {allowUpload && showUploadForm && (
            <form
              onSubmit={handleSubmit}
              className="bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl p-3.5 space-y-2.5 animate-collapse-reveal"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder={t?.completedTitlePlaceholder || 'Ej: Noche Estrellada 1000 piezas'}
                  className="sm:col-span-2 bg-white border border-[#E5E0F5] rounded-2xl px-3 py-2 text-xs text-[#18181B] placeholder-[#6B7280]/75 focus:outline-none focus:border-[#5B3DF5] transition-colors"
                />
                <input
                  type="number"
                  min="1"
                  value={form.pieces}
                  onChange={(e) => setForm((prev) => ({ ...prev, pieces: e.target.value }))}
                  placeholder={t?.completedPiecesPlaceholder || 'Ej: 1000'}
                  className="bg-white border border-[#E5E0F5] rounded-2xl px-3 py-2 text-xs text-[#18181B] placeholder-[#6B7280]/75 focus:outline-none focus:border-[#5B3DF5] transition-colors"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  required
                  value={form.image}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      image: e.target.value,
                      imageFile: null,
                    }))
                  }
                  placeholder={t?.completedPhotoUrlPlaceholder || 'URL de la foto https://...'}
                  className="flex-1 bg-white border border-[#E5E0F5] rounded-2xl px-3 py-2 text-xs text-[#18181B] placeholder-[#6B7280]/75 focus:outline-none focus:border-[#5B3DF5] transition-colors"
                />
                <label className="cursor-pointer bg-white hover:bg-[#EBE7FF] border border-[#E5E0F5] text-[#18181B] px-3 py-2 rounded-2xl text-xs font-bold inline-flex items-center justify-center gap-1.5 shrink-0 transition-all duration-200 active:scale-95">
                  <Upload className="w-3.5 h-3.5 text-[#5B3DF5]" />
                  <span>{t?.completedUploadFile || 'O subir imagen'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {form.image.trim() && (
                <div className="flex items-center gap-2.5 bg-white border border-[#E5E0F5] rounded-2xl p-2 animate-fade-in">
                  <img
                    src={form.image.trim()}
                    alt={form.title || 'Vista previa'}
                    className="w-14 h-14 rounded-xl object-cover shrink-0 bg-[#F5F3FF]"
                  />
                  <span className="text-[11px] text-[#6B7280] truncate flex-1">
                    {t?.imagePreviewReady || 'Vista previa lista para guardar'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, image: '' }))}
                    aria-label={t?.removeImageBtn || 'Quitar imagen'}
                    className="p-1 rounded-full text-[#6B7280] hover:text-[#18181B] hover:bg-[#F5F3FF] transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <input
                type="text"
                value={form.note}
                onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
                placeholder={
                  t?.completedNotePlaceholder ||
                  'Nota opcional (ej: lo armé en 4 días, súper entretenido)...'
                }
                className="w-full bg-white border border-[#E5E0F5] rounded-2xl px-3 py-2 text-xs text-[#18181B] placeholder-[#6B7280]/75 focus:outline-none focus:border-[#5B3DF5] transition-colors"
              />

              <button
                type="submit"
                disabled={isSaving}
                className="bg-[#5B3DF5] hover:bg-[#482BD9] text-white font-bold text-xs px-4 py-2 rounded-2xl transition-all duration-200 active:scale-95 shadow-2xs hover:shadow inline-flex items-center gap-1.5 disabled:opacity-60 disabled:pointer-events-none"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>{t?.addCompletedBtn || 'Guardar en mi galería'}</span>
              </button>
              {submitError && (
                <p role="alert" className="text-xs text-red-700">
                  {submitError}
                </p>
              )}
            </form>
          )}

          {myCompletedPuzzles.length === 0 ? (
            <p className="text-xs text-[#6B7280] bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl p-4 text-center">
              {t?.noCompletedPuzzles ||
                'Aún no hay fotos de rompecabezas terminados en esta galería.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {myCompletedPuzzles.map((item) => {
                const imgSrc = item.image || item.images?.[0];
                const isCopied = copiedId === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectPuzzle && onSelectPuzzle(item)}
                    className="group bg-[#F5F3FF] border border-[#E5E0F5] hover:border-[#5B3DF5]/45 rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <div className="relative h-32 bg-white overflow-hidden">
                      <img
                        src={imgSrc}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {item.pieces && (
                        <span className="absolute bottom-2 left-2 bg-[#FFD43B] px-2.5 py-0.5 rounded-full text-[11px] font-extrabold text-[#18181B] shadow-2xs tabular-nums">
                          {item.pieces} {t?.pieces || 'piezas'}
                        </span>
                      )}
                    </div>
                    <div className="p-3 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-[#18181B] group-hover:text-[#5B3DF5] transition-colors leading-snug">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => handleShare(e, item)}
                            title={isCopied ? t?.linkCopied || 'Enlace copiado' : t?.share || 'Compartir'}
                            className={`p-1 rounded-lg transition-all duration-200 active:scale-90 inline-flex items-center gap-1 text-[10px] font-bold ${
                              isCopied
                                ? 'bg-[#5B3DF5] text-white'
                                : 'text-[#6B7280] hover:text-[#5B3DF5] hover:bg-white'
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>{t?.copied || 'Copiado'}</span>
                              </>
                            ) : (
                              <Share2 className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {onDeleteCompletedPuzzle && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteCompletedPuzzle(item.id);
                              }}
                              title={t?.deleteCompletedBtn || 'Eliminar'}
                              className="p-1 rounded-lg text-[#6B7280] hover:text-[#5B3DF5] hover:bg-white transition-all duration-200 active:scale-90"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      {item.note && (
                        <p className="text-[11px] text-[#6B7280] leading-relaxed line-clamp-2">
                          {item.note}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}