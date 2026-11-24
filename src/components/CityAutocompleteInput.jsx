import { useEffect, useRef, useState } from 'react';

const CITY_PLACE_TYPES = new Set([
  'city',
  'town',
  'village',
  'municipality',
  'administrative',
]);

function roundCoord(value) {
  const num = parseFloat(value);
  return Number.isFinite(num) ? Number(num.toFixed(2)) : null;
}

function filterCitySuggestions(data) {
  if (!Array.isArray(data)) return [];
  const localities = data.filter((item) => {
    const category = item?.category || item?.class;
    const type = item?.type;
    const addrType = item?.addresstype;
    return (
      CITY_PLACE_TYPES.has(type) ||
      CITY_PLACE_TYPES.has(addrType) ||
      (category === 'boundary' && type === 'administrative')
    );
  });
  return localities.length > 0 ? localities : data;
}

export default function CityAutocompleteInput({
  value,
  onChangeText,
  onSelectCity,
  placeholder = 'Ej. Delmenhorst, Bremen...',
  required = false,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setSuggestions([]);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const handleChooseSuggestion = (item) => {
    if (!item) return;
    onSelectCity({
      displayName: item.display_name,
      lat: roundCoord(item.lat),
      lon: roundCoord(item.lon),
    });
    setSuggestions([]);
    setActiveIndex(-1);
  };

  const handleInput = (e) => {
    const val = e.target.value;
    onChangeText(val);
    setActiveIndex(-1);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();

    if (val.trim().length >= 3) {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      debounceTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(val)}&limit=6`,
            {
              signal: controller.signal,
            }
          );
          const data = await res.json();
          const filtered = filterCitySuggestions(data).slice(0, 5);
          setSuggestions(filtered);
          setActiveIndex(filtered.length > 0 ? 0 : -1);
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.error('Error buscando ciudad:', err);
          }
        }
      }, 500);
    } else {
      setSuggestions([]);
      setActiveIndex(-1);
    }
  };

  const handleKeyDown = (e) => {
    if (suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      const chosen = suggestions[activeIndex >= 0 ? activeIndex : 0];
      handleChooseSuggestion(chosen);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setSuggestions([]);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        className="w-full bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl px-4 py-3 text-sm text-[#18181B] placeholder-[#6B7280]/75 focus:outline-none focus:border-[#5B3DF5] focus:bg-white transition-all duration-200"
        placeholder={placeholder}
        required={required}
      />

      {suggestions.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 bg-white border border-[#E5E0F5] rounded-2xl shadow-lg mt-1.5 max-h-44 overflow-y-auto text-left animate-slide-step">
          {suggestions.map((item, idx) => {
            const isHighlighted = idx === activeIndex;
            return (
              <li
                key={item.place_id || idx}
                className="border-b border-[#E5E0F5] last:border-none"
              >
                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => handleChooseSuggestion(item)}
                  className={`w-full text-left px-3.5 py-2.5 text-xs font-medium cursor-pointer truncate transition-colors duration-150 block ${
                    isHighlighted
                      ? 'bg-[#F5F3FF] text-[#5B3DF5]'
                      : 'text-[#18181B] hover:bg-[#F5F3FF] hover:text-[#5B3DF5]'
                  }`}
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-[#FFD43B] mr-2 align-middle" />
                  {item.display_name}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}