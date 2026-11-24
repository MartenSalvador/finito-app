import { useEffect, useRef, useState } from 'react';
import { Award, Camera, Check, Edit3, LogOut, MapPin, X } from 'lucide-react';

const presetAvatars = [
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQnSugLl-WnjdnsjUha_gbYjDoIhut5UpXnZRdkxzTxhA&s=10',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3zbHHjutWRXz9MCzZO1LuRtX8DRgTCW_XeZwCisr0DA&s=10',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSo5PnfPGB8YzdaX_oOmi3V3xH0XrpBAyjvBmzSW2xvkA&s=10',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQYf1pl99_oqw9EzuDKztlM4GUNhopGvN3AgdQeP6SVkA&s=10'
];

export default function ProfileHeaderCard({
  currentUser,
  publishedCount = 0,
  completedCount = 0,
  unlockedBadges = [],
  onUpdateProfile,
  setIsLoggedIn,
  onLogout,
  t,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const debounceTimerRef = useRef(null);
  const abortControllerRef = useRef(null);

  const [form, setForm] = useState({
    name: currentUser.name || '',
    city: currentUser.city || '',
    bio: currentUser.bio || '',
    avatar: currentUser.avatar || presetAvatars[0],
    lat: currentUser.lat,
    lon: currentUser.lon,
  });

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const handleOpenEdit = () => {
    setForm({
      name: currentUser.name || '',
      city: currentUser.city || '',
      bio: currentUser.bio || '',
      avatar: currentUser.avatar || presetAvatars[0],
      lat: currentUser.lat,
      lon: currentUser.lon,
    });
    setIsEditing(true);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, avatar: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleCityInputChange = (e) => {
    const val = e.target.value;
    setForm((prev) => ({
      ...prev,
      city: val,
      lat: undefined,
      lon: undefined,
    }));

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();

    if (val.trim().length >= 3) {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      debounceTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=5`,
            {
              signal: controller.signal,
              headers: {
                'User-Agent': 'Finito-PuzzleSwapApp (contacto@finito.app)',
              },
            }
          );
          const data = await res.json();
          setCitySuggestions(data);
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.error('Error buscando ciudad:', err);
          }
        }
      }, 500);
    } else {
      setCitySuggestions([]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    let lat = form.lat ?? currentUser.lat ?? 53.0526;
    let lon = form.lon ?? currentUser.lon ?? 8.6293;

    if (form.city && form.city.trim() !== '' && form.lat === undefined) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(form.city)}&limit=1`,
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
        console.error('No se pudo obtener la geolocalización de la ciudad:', error);
      }
    }

    if (onUpdateProfile) {
      onUpdateProfile({
        ...form,
        name: form.name.trim(),
        city: form.city.trim(),
        lat,
        lon,
      });
    }

    setCitySuggestions([]);
    setIsEditing(false);
  };

  const handleLogoutClick = () => {
    if (typeof onLogout === 'function') {
      onLogout();
    } else {
      setIsLoggedIn?.(false);
    }
  };

  return (
    <div className="bg-white border border-[#E5E0F5] shadow-2xs rounded-3xl p-5 sm:p-6 text-center space-y-4 relative transition-all duration-300">
      {!isEditing ? (
        <div className="animate-slide-step">
          <img
            src={currentUser.avatar || presetAvatars[0]}
            alt={currentUser.name}
            className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-[#5B3DF5] shadow-sm bg-[#F5F3FF] transition-transform duration-300 hover:scale-105"
          />

          <div className="mt-3">
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-xl font-extrabold text-[#18181B]">{currentUser.name}</h2>
              <button
                type="button"
                onClick={handleOpenEdit}
                className="p-1.5 bg-[#F5F3FF] hover:bg-[#EBE7FF] text-[#5B3DF5] rounded-2xl border border-[#E5E0F5] transition-all duration-200 active:scale-90"
                title={t?.editProfile || 'Editar perfil'}
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-[#6B7280] font-medium flex items-center justify-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 text-[#5B3DF5]" /> {currentUser.city}
            </p>
          </div>

          {currentUser.bio && (
            <p className="text-xs text-[#18181B] bg-[#F5F3FF] p-3.5 rounded-2xl border border-[#E5E0F5] mt-3 italic leading-relaxed">
              "{currentUser.bio}"
            </p>
          )}

          {unlockedBadges.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[#E5E0F5] flex flex-wrap items-center justify-center gap-1.5">
              {unlockedBadges.map((badge) => {
                const badgeTitle =
                  (badge.titleKey && t?.[badge.titleKey]) || badge.title || badge.name || '';
                const badgeDesc =
                  (badge.descKey && t?.[badge.descKey]) || badge.description || badge.desc || '';

                return (
                  <span
                    key={badge.id}
                    title={badgeDesc || badgeTitle}
                    className="bg-[#F5F3FF] border border-[#E5E0F5] hover:border-[#5B3DF5]/40 text-[#18181B] px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 transition-colors duration-200"
                  >
                    <Award className="w-3 h-3 text-[#5B3DF5] shrink-0" />
                    <span>{badgeTitle}</span>
                  </span>
                );
              })}
            </div>
          )}

          <div className="flex justify-center gap-6 sm:gap-8 pt-3 mt-3 border-t border-[#E5E0F5] text-xs">
            <div className="transition-transform duration-200 hover:-translate-y-0.5">
              <span className="block font-extrabold text-[#18181B] text-base tabular-nums">
                {publishedCount}
              </span>
              <span className="text-[#6B7280] font-medium">{t?.publishedCount || 'Publicados'}</span>
            </div>
            <div className="transition-transform duration-200 hover:-translate-y-0.5">
              <span className="inline-block bg-[#FFD43B] text-[#18181B] font-extrabold text-sm px-2.5 py-0.5 rounded-full tabular-nums">
                ★ {currentUser.rating ?? '5.0'}
              </span>
              <span className="block text-[#6B7280] font-medium mt-0.5">
                {t?.reputation || 'Reputación'}
              </span>
            </div>
            <div className="transition-transform duration-200 hover:-translate-y-0.5">
              <span className="block font-extrabold text-[#5B3DF5] text-base tabular-nums">
                {completedCount}
              </span>
              <span className="text-[#6B7280] font-medium">{t?.completedPuzzles || 'Armados'}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogoutClick}
            className="mt-4 inline-flex items-center gap-1.5 bg-[#F5F3FF] hover:bg-[#EBE7FF] text-[#18181B] hover:text-[#5B3DF5] text-xs font-bold px-4 py-2 rounded-2xl border border-[#E5E0F5] transition-all duration-200 active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" /> {t?.logout || 'Cerrar Sesión'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-3 text-left animate-modal-pop">
          <div className="flex items-center justify-between border-b border-[#E5E0F5] pb-2.5">
            <span className="text-xs font-extrabold text-[#18181B] uppercase tracking-wider">
              {t?.editProfile || 'Editar Perfil'}
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setCitySuggestions([]);
                  setIsEditing(false);
                }}
                className="p-1.5 bg-[#F5F3FF] hover:bg-[#EBE7FF] text-[#18181B] rounded-2xl border border-[#E5E0F5] transition-all duration-200 active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                type="submit"
                className="flex items-center gap-1 px-3 py-1.5 bg-[#5B3DF5] hover:bg-[#482BD9] text-white font-bold text-xs rounded-2xl transition-all duration-200 active:scale-95 shadow-2xs"
              >
                <Check className="w-4 h-4" /> {t?.save || 'Guardar'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-extrabold text-[#6B7280] block uppercase tracking-wider">
              {t?.profilePhotoOrAvatar || 'Foto de perfil o Avatar'}
            </label>
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 shrink-0">
                <img
                  src={form.avatar}
                  alt="Avatar actual"
                  className="w-14 h-14 rounded-full object-cover border border-[#E5E0F5]"
                />
                <label
                  className="absolute -bottom-1 -right-1 p-1 bg-[#5B3DF5] text-white rounded-full cursor-pointer hover:bg-[#482BD9] shadow-2xs transition-transform duration-200 active:scale-90"
                  title={t?.uploadOwnPhoto || 'Subir foto propia'}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <div className="flex gap-2 overflow-x-auto py-1">
                {presetAvatars.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, avatar: imgUrl }))}
                    className={`rounded-full p-0.5 shrink-0 transition-all duration-200 active:scale-90 ${
                      form.avatar === imgUrl
                        ? 'ring-2 ring-[#5B3DF5] scale-105'
                        : 'opacity-65 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} alt="Preset" className="w-9 h-9 rounded-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-extrabold text-[#6B7280] block mb-1 uppercase tracking-wider">
              {t?.nameLabel || 'Nombre / Alias'}
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl px-3.5 py-2.5 text-xs text-[#18181B] focus:outline-none focus:border-[#5B3DF5] focus:bg-white transition-colors"
              required
            />
          </div>

          <div className="relative">
            <label className="text-[11px] font-extrabold text-[#6B7280] block mb-1 uppercase tracking-wider">
              {t?.cityLabel || 'Ciudad'}
            </label>
            <input
              type="text"
              value={form.city}
              onChange={handleCityInputChange}
              className="w-full bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl px-3.5 py-2.5 text-xs text-[#18181B] focus:outline-none focus:border-[#5B3DF5] focus:bg-white transition-colors"
              placeholder="Ej. Delmenhorst, Bremen..."
            />

            {citySuggestions.length > 0 && (
              <ul className="absolute z-50 left-0 right-0 bg-white border border-[#E5E0F5] rounded-2xl shadow-lg mt-1 max-h-40 overflow-y-auto text-left animate-slide-step">
                {citySuggestions.map((item, idx) => (
                  <li
                    key={idx}
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        city: item.display_name,
                        lat: parseFloat(item.lat),
                        lon: parseFloat(item.lon),
                      }));
                      setCitySuggestions([]);
                    }}
                    className="px-3.5 py-2 text-xs text-[#18181B] hover:bg-[#F5F3FF] hover:text-[#5B3DF5] cursor-pointer border-b border-[#E5E0F5] last:border-none truncate transition-colors"
                  >
                    <span className="inline-block w-2 h-2 rounded-full bg-[#FFD43B] mr-2 align-middle" />
                    {item.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="text-[11px] font-extrabold text-[#6B7280] block mb-1 uppercase tracking-wider">
              {t?.bioLabel || 'Biografía / Sobre mí'}
            </label>
            <textarea
              rows="2"
              value={form.bio}
              onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
              className="w-full bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl px-3.5 py-2.5 text-xs text-[#18181B] focus:outline-none focus:border-[#5B3DF5] focus:bg-white transition-colors resize-none placeholder-[#6B7280]/75"
              placeholder={t?.bioPlaceholder || 'Contá un poco sobre tus puzzles favoritos...'}
            />
          </div>
        </form>
      )}
    </div>
  );
}