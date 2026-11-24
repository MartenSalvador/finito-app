import { useState } from 'react';
import { X, ImagePlus, Trash2, Save } from 'lucide-react';
import CityAutocompleteInput from './CityAutocompleteInput';

export default function EditPuzzleModal({ puzzle, onClose, onSave, t }) {
  const [title, setTitle] = useState(puzzle.title || '');
  const [pieces, setPieces] = useState(puzzle.pieces || 1000);
  const [status, setStatus] = useState(puzzle.status || 'Completo (100% garantizado)');
  const [description, setDescription] = useState(puzzle.description || '');
  const [city, setCity] = useState(puzzle.city || '');
  const [selectedCoords, setSelectedCoords] = useState(null);

  const initialImages =
    Array.isArray(puzzle.images) && puzzle.images.length > 0
      ? puzzle.images
      : puzzle.image
        ? [puzzle.image]
        : [''];

  const [images, setImages] = useState(initialImages);

  const handleImageChange = (index, value) => {
    const updated = [...images];
    updated[index] = value;
    setImages(updated);
  };

  const handleAddImage = () => {
    if (images.length < 3) {
      setImages([...images, '']);
    }
  };

  const handleRemoveImage = (index) => {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated.length > 0 ? updated : ['']);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !images[0]?.trim()) return;

    let lat = puzzle.lat ?? 53.0526;
    let lon = puzzle.lon ?? 8.6293;
    const trimmedCity = city.trim();

    if (selectedCoords) {
      lat = selectedCoords.lat;
      lon = selectedCoords.lon;
    } else if (trimmedCity && trimmedCity !== puzzle.city) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmedCity)}&limit=1`,
          {
            headers: {
              'User-Agent': 'Finito-PuzzleSwapApp (contacto@finito.app)',
            },
          }
        );
        const data = await response.json();
        if (data && data.length > 0) {
          lat = parseFloat(data[0].lat);
          lon = parseFloat(data[0].lon);
        }
      } catch (error) {
        console.error('No se pudo actualizar la geolocalización:', error);
      }
    }

    const validImages = images.map((img) => img.trim()).filter((img) => img !== '');
    if (validImages.length === 0) return;

    onSave({
      ...puzzle,
      title: title.trim(),
      pieces: Number(pieces),
      status,
      description: description.trim(),
      city: trimmedCity,
      lat,
      lon,
      images: validImages,
      image: validImages[0],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#18181B]/45 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white border border-[#E5E0F5] rounded-3xl max-w-lg w-full p-6 relative shadow-2xl my-8 animate-modal-pop">
        <button
          type="button"
          onClick={onClose}
          aria-label={t?.closeModal || 'Cerrar'}
          className="absolute top-4 right-4 text-[#6B7280] hover:text-[#18181B] bg-[#F5F3FF] hover:bg-[#EBE7FF] border border-[#E5E0F5] p-2 rounded-full transition-all duration-200 active:scale-90"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-extrabold text-[#18181B] mb-1">
          {t?.editPuzzleTitle || 'Editar Rompecabezas'}
        </h2>
        <p className="text-xs text-[#6B7280] mb-6">
          {t?.editPuzzleSubtitle || 'Actualizá los datos de tu publicación cuando quieras.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase font-extrabold text-[#6B7280] tracking-wider mb-1.5">
              {t?.titleLabel || 'Título y Marca'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl px-4 py-3 text-sm text-[#18181B] focus:outline-none focus:border-[#5B3DF5] focus:bg-white transition-all duration-200"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-extrabold text-[#6B7280] tracking-wider mb-1.5">
                {t?.piecesLabel || 'Piezas'}
              </label>
              <select
                value={pieces}
                onChange={(e) => setPieces(Number(e.target.value))}
                className="w-full bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl px-4 py-3 text-sm text-[#18181B] focus:outline-none focus:border-[#5B3DF5] focus:bg-white transition-all duration-200 cursor-pointer"
              >
                <option value={500}>500 {t?.pieces || 'piezas'}</option>
                <option value={1000}>1000 {t?.pieces || 'piezas'}</option>
                <option value={1500}>1500 {t?.pieces || 'piezas'}</option>
                <option value={2000}>2000+ {t?.pieces || 'piezas'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase font-extrabold text-[#6B7280] tracking-wider mb-1.5">
                {t?.cityLabel || 'Ciudad'}
              </label>
              <CityAutocompleteInput
                value={city}
                onChangeText={(val) => {
                  setCity(val);
                  setSelectedCoords(null);
                }}
                onSelectCity={({ displayName, lat, lon }) => {
                  setCity(displayName);
                  setSelectedCoords({ lat, lon });
                }}
                placeholder="Ej. Delmenhorst, Bremen..."
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase font-extrabold text-[#6B7280] tracking-wider mb-1.5">
              {t?.statusLabel || 'Estado'}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl px-4 py-3 text-sm text-[#18181B] focus:outline-none focus:border-[#5B3DF5] focus:bg-white transition-all duration-200 cursor-pointer"
            >
              <option value="Completo (100% garantizado)">
                {t?.statusComplete || 'Completo (100% garantizado)'}
              </option>
              <option value="Falta 1 pieza (avisado)">
                {t?.statusMissing || 'Falta 1 pieza (avisado)'}
              </option>
              <option value="Nuevo / Sellado">
                {t?.statusSealed || 'Nuevo / Sellado'}
              </option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs uppercase font-extrabold text-[#6B7280] tracking-wider">
                {t?.puzzlePhotosLabel || 'Fotos (Hasta 3)'}
              </label>
              <span className="text-[11px] font-extrabold bg-[#FFD43B] text-[#18181B] px-2 py-0.5 rounded-full tabular-nums">
                {images.length}/3
              </span>
            </div>
            {images.map((imgUrl, index) => (
              <div key={index} className="flex gap-2 items-center animate-slide-step">
                <input
                  type="url"
                  placeholder={
                    index === 0
                      ? t?.mainPhotoPlaceholder || 'URL Foto Principal https://...'
                      : t?.additionalPhotoPlaceholder
                        ? t.additionalPhotoPlaceholder(index + 1)
                        : `URL Foto ${index + 1} https://...`
                  }
                  value={imgUrl}
                  onChange={(e) => handleImageChange(index, e.target.value)}
                  required={index === 0}
                  className="w-full bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl px-4 py-2.5 text-sm text-[#18181B] placeholder-[#6B7280]/75 focus:outline-none focus:border-[#5B3DF5] focus:bg-white transition-all duration-200"
                />
                {images.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="bg-[#F5F3FF] hover:bg-[#EBE7FF] text-[#5B3DF5] border border-[#E5E0F5] p-2.5 rounded-2xl transition-all duration-200 active:scale-90 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {images.length < 3 && (
              <button
                type="button"
                onClick={handleAddImage}
                className="w-full border border-dashed border-[#E5E0F5] hover:border-[#5B3DF5] bg-[#F5F3FF]/70 hover:bg-[#F5F3FF] text-[#6B7280] hover:text-[#5B3DF5] py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.99]"
              >
                <ImagePlus className="w-4 h-4" /> {t?.addAnotherPhoto || 'Agregar otra foto'}
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs uppercase font-extrabold text-[#6B7280] tracking-wider mb-1.5">
              {t?.descLabel || 'Descripción'}
            </label>
            <textarea
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl px-4 py-3 text-sm text-[#18181B] focus:outline-none focus:border-[#5B3DF5] focus:bg-white transition-all duration-200 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#F5F3FF] hover:bg-[#EBE7FF] text-[#18181B] border border-[#E5E0F5] font-bold py-3 rounded-2xl transition-all duration-200 active:scale-95 text-sm"
            >
              {t?.cancel || 'Cancelar'}
            </button>
            <button
              type="submit"
              className="flex-1 bg-[#5B3DF5] hover:bg-[#482BD9] text-white font-bold py-3 rounded-2xl transition-all duration-200 active:scale-95 shadow-2xs hover:shadow-md text-sm flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" /> {t?.saveChanges || 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}