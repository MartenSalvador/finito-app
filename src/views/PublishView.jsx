import { useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';

export default function PublishView({ currentUser, addPuzzle, t }) {
  const [newTitle, setNewTitle] = useState('');
  const [newPieces, setNewPieces] = useState(1000);
  const [newStatus, setNewStatus] = useState('Completo (100% garantizado)');
  const [newDesc, setNewDesc] = useState('');

  // Manejo de hasta 3 fotos (la primera es obligatoria)
  const [imageInputs, setImageInputs] = useState(['']);

  const handleAddImageField = () => {
    if (imageInputs.length < 3) {
      setImageInputs([...imageInputs, '']);
    }
  };

  const handleImageChange = (index, value) => {
    const updated = [...imageInputs];
    updated[index] = value;
    setImageInputs(updated);
  };

  const handleRemoveImageField = (index) => {
    const updated = imageInputs.filter((_, i) => i !== index);
    setImageInputs(updated.length > 0 ? updated : ['']);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !imageInputs[0].trim()) return;

    const validImages = imageInputs
      .map((img) => img.trim())
      .filter((img) => img !== '');

    if (validImages.length === 0) return;

    const newPuzzleObj = {
      id: 'p_' + Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      city: currentUser.city,
      lat: currentUser.lat ?? 53.0526,
      lon: currentUser.lon ?? 8.6293,
      distanceKm: 0,
      title: newTitle.trim(),
      pieces: Number(newPieces),
      status: newStatus,
      images: validImages,
      image: validImages[0],
      description: newDesc.trim() || t?.defaultDescription || ''
    };

    addPuzzle(newPuzzleObj);
  };

  return (
    <div className="max-w-lg mx-auto bg-white border border-[#E5E0F5] rounded-3xl p-6 shadow-sm animate-fade-in">
      <h2 className="text-xl font-extrabold mb-1 text-[#18181B]">{t.publishTitle}</h2>
      <p className="text-xs text-[#6B7280] mb-6 leading-relaxed">
        {t.publishSubtitle}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs uppercase font-extrabold text-[#6B7280] tracking-wider mb-1.5">
            {t.titleLabel}
          </label>
          <input
            type="text"
            placeholder={t.titlePlaceholder}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl px-4 py-3 text-sm text-[#18181B] placeholder-[#6B7280]/75 focus:outline-none focus:border-[#5B3DF5] focus:bg-white transition-all duration-200"
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
              onChange={(e) => setNewPieces(Number(e.target.value))}
              className="w-full bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl px-4 py-3 text-sm text-[#18181B] focus:outline-none focus:border-[#5B3DF5] focus:bg-white transition-all duration-200 cursor-pointer"
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
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl px-4 py-3 text-sm text-[#18181B] focus:outline-none focus:border-[#5B3DF5] focus:bg-white transition-all duration-200 cursor-pointer"
            >
              <option value="Completo (100% garantizado)">{t.statusComplete}</option>
              <option value="Falta 1 pieza (avisado)">{t.statusMissing}</option>
              <option value="Nuevo / Sellado">{t.statusSealed}</option>
            </select>
          </div>
        </div>

        {/* Sección Dinámica de Fotos (Hasta 3) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs uppercase font-extrabold text-[#6B7280] tracking-wider">
              {t.puzzlePhotosLabel}
            </label>
            <span className="text-[11px] font-extrabold bg-[#FFD43B] text-[#18181B] px-2 py-0.5 rounded-full tabular-nums">
              {imageInputs.length}/3
            </span>
          </div>

          {imageInputs.map((imgUrl, index) => (
            <div key={index} className="flex gap-2 items-center animate-slide-step">
              <input
                type="url"
                placeholder={index === 0 ? t.mainPhotoPlaceholder : t.additionalPhotoPlaceholder(index + 1)}
                value={imgUrl}
                onChange={(e) => handleImageChange(index, e.target.value)}
                required={index === 0}
                className="w-full bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl px-4 py-2.5 text-sm text-[#18181B] placeholder-[#6B7280]/75 focus:outline-none focus:border-[#5B3DF5] focus:bg-white transition-all duration-200"
              />
              {imageInputs.length > 1 && (
                <button
                  type="button"
                  aria-label={t?.removePhoto || 'Eliminar foto'}
                  onClick={() => handleRemoveImageField(index)}
                  className="bg-[#F5F3FF] hover:bg-[#EBE7FF] text-[#5B3DF5] border border-[#E5E0F5] p-2.5 rounded-2xl transition-all duration-200 active:scale-95 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          {imageInputs.length < 3 && (
            <button
              type="button"
              onClick={handleAddImageField}
              className="w-full mt-1 border border-dashed border-[#E5E0F5] hover:border-[#5B3DF5] bg-[#F5F3FF]/70 hover:bg-[#F5F3FF] text-[#6B7280] hover:text-[#5B3DF5] py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.99]"
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
            onChange={(e) => setNewDesc(e.target.value)}
            className="w-full bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl px-4 py-3 text-sm text-[#18181B] placeholder-[#6B7280]/75 focus:outline-none focus:border-[#5B3DF5] focus:bg-white transition-all duration-200 resize-none"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#5B3DF5] hover:bg-[#482BD9] text-white font-bold py-3 rounded-2xl transition-all duration-200 shadow-xs hover:shadow active:scale-[0.98]"
        >
          {t.publishBtn}
        </button>
      </form>
    </div>
  );
}