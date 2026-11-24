import { useState } from 'react';
import { Award, ChevronDown } from 'lucide-react';

export default function UserBadgesSection({
  unlockedBadges = [],
  totalBadgesCount = 0,
  defaultOpen = false,
  compact = true,
  t,
}) {
  const [isOpen, setIsOpen] = useState(Boolean(defaultOpen));

  const safeBadges = Array.isArray(unlockedBadges) ? unlockedBadges : [];
  const totalDisplay = totalBadgesCount || safeBadges.length;

  return (
    <section
      aria-label={t?.badges || 'Medallas'}
      className="bg-white border border-[#E5E0F5] rounded-2xl px-4 py-3 shadow-2xs transition-all duration-300 animate-fade-in"
    >
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2 text-left group"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Award className="w-4 h-4 text-[#5B3DF5] shrink-0" />
          <span className="text-xs font-extrabold text-[#18181B] group-hover:text-[#5B3DF5] transition-colors truncate">
            {t?.badges || 'Medallas'}
          </span>
          <span className="bg-[#FFD43B] text-[#18181B] px-2 py-0.5 rounded-full text-[11px] font-extrabold tabular-nums shrink-0">
            {safeBadges.length} / {totalDisplay}
          </span>
        </div>

        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6B7280] group-hover:text-[#5B3DF5] transition-colors shrink-0">
          <span className="hidden sm:inline">
            {isOpen ? t?.hide || 'Ocultar' : t?.show || 'Ver'}
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#5B3DF5]' : ''
            }`}
          />
        </span>
      </button>

      {isOpen && (
        <div className="mt-3 pt-3 border-t border-[#E5E0F5] animate-slide-step">
          {safeBadges.length === 0 ? (
            <p className="text-xs text-[#6B7280] bg-[#F5F3FF] border border-[#E5E0F5] rounded-xl px-3 py-2.5 text-center">
              {t?.noBadgesYet || 'Todavía no hay medallas desbloqueadas en este perfil.'}
            </p>
          ) : compact ? (
            <div className="flex flex-wrap gap-1.5">
              {safeBadges.map((badge) => {
                const badgeTitle =
                  (badge.titleKey && t?.[badge.titleKey]) || badge.title || badge.name || '';
                const badgeDesc =
                  (badge.descKey && t?.[badge.descKey]) || badge.description || badge.desc || '';

                return (
                  <span
                    key={badge.id}
                    title={badgeDesc || badgeTitle}
                    className="bg-[#F5F3FF] hover:bg-[#EBE7FF] border border-[#E5E0F5] hover:border-[#5B3DF5]/40 text-[#18181B] px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 transition-colors duration-200 cursor-default"
                  >
                    <Award className="w-3 h-3 text-[#5B3DF5] shrink-0" />
                    <span className="truncate max-w-45">{badgeTitle}</span>
                  </span>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {safeBadges.map((badge) => {
                const badgeTitle =
                  (badge.titleKey && t?.[badge.titleKey]) || badge.title || badge.name || '';
                const badgeDesc =
                  (badge.descKey && t?.[badge.descKey]) || badge.description || badge.desc || '';

                return (
                  <div
                    key={badge.id}
                    className="bg-[#F5F3FF] border border-[#E5E0F5] rounded-xl p-2.5 flex items-center gap-2.5"
                  >
                    <div className="w-7 h-7 rounded-lg bg-white border border-[#E5E0F5] text-[#5B3DF5] flex items-center justify-center shrink-0">
                      <Award className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#18181B] truncate">{badgeTitle}</p>
                      {badgeDesc && (
                        <p className="text-[10px] text-[#6B7280] leading-tight truncate">
                          {badgeDesc}
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
    </section>
  );
}