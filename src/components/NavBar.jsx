import { User, Globe, Inbox } from 'lucide-react';
import Logo from '../assets/Finito-logo.png';

export default function Navbar({
  currentUser,
  isLoggedIn = false,
  onOpenAuthModal,
  setActiveTab,
  lang,
  setLang,
  activeTab,
  tradesCount = 0,
  t,
}) {
  return (
    <header className="bg-white/95 backdrop-blur-xs border-b border-[#E5E0F5] shadow-2xs sticky top-0 z-30 px-3 sm:px-4 py-3 flex items-center justify-between gap-2 transition-colors duration-200">
      {/* Logo */}
      <button
        type="button"
        onClick={() => setActiveTab && setActiveTab('explore')}
        className="flex items-center gap-2 cursor-pointer shrink-0 text-left focus:outline-none group active:scale-95 transition-transform duration-200"
      >
        <div className="bg-[#F5F3FF] p-2 rounded-2xl border border-[#E5E0F5] group-hover:border-[#5B3DF5]/45 group-hover:bg-[#EBE7FF] transition-all duration-200">
          <img
            src={Logo}
            alt={t?.logoAlt || 'Finito'}
            className="h-8 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
          />
        </div>
      </button>

      {/* Controles derechos */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <div className="flex items-center bg-[#F5F3FF] hover:bg-[#EBE7FF] border border-[#E5E0F5] rounded-full px-2.5 py-1 shrink-0 transition-colors duration-200">
          <Globe className="w-3.5 h-3.5 text-[#5B3DF5] mr-1 shrink-0" />
          <select
            aria-label={t?.languageLabel || 'Seleccionar idioma'}
            value={lang}
            onChange={(e) => setLang && setLang(e.target.value)}
            className="bg-transparent text-xs text-[#18181B] font-bold focus:outline-none cursor-pointer"
          >
            <option value="es" className="bg-white text-[#18181B]">ES</option>
            <option value="de" className="bg-white text-[#18181B]">DE</option>
            <option value="en" className="bg-white text-[#18181B]">EN</option>
          </select>
        </div>

        {isLoggedIn ? (
          <>
            <button
              type="button"
              onClick={() => setActiveTab && setActiveTab('trades')}
              className={`px-3 py-2 rounded-full text-xs font-bold transition-all duration-200 active:scale-95 flex items-center gap-1.5 shrink-0 ${
                activeTab === 'trades'
                  ? 'bg-[#5B3DF5] text-white shadow-2xs'
                  : 'bg-[#F5F3FF] text-[#18181B] hover:bg-[#EBE7FF] border border-[#E5E0F5]'
              }`}
            >
              <Inbox className="w-3.5 h-3.5 shrink-0" />
              <span>{t?.tradesTab || 'Propuestas'}</span>
              {tradesCount > 0 && (
                <span className="bg-[#FFD43B] text-[#18181B] rounded-full px-1.5 py-0.5 text-[10px] font-extrabold leading-none tabular-nums animate-pulse">
                  {tradesCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab && setActiveTab('profile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-200 active:scale-95 text-xs font-bold shrink-0 ${
                activeTab === 'profile'
                  ? 'bg-[#5B3DF5] text-white border-[#5B3DF5] shadow-2xs'
                  : 'bg-[#F5F3FF] hover:bg-[#EBE7FF] text-[#18181B] border-[#E5E0F5]'
              }`}
            >
              <User className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline max-w-28 truncate">
                {currentUser?.name || t?.profileTab || 'Perfil'}
              </span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onOpenAuthModal && onOpenAuthModal('login')}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#F5F3FF] hover:bg-[#EBE7FF] text-[#5B3DF5] border border-[#E5E0F5] transition-all duration-200 active:scale-95 shrink-0"
            >
              {t?.loginBtn || 'Ingresar'}
            </button>
            <button
              type="button"
              onClick={() => onOpenAuthModal && onOpenAuthModal('register')}
              className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-[#FFD43B] hover:bg-[#FCC419] text-[#18181B] transition-all duration-200 shadow-2xs hover:shadow active:scale-95 shrink-0"
            >
              {t?.registerBtn || 'Registrarse'}
            </button>
          </>
        )}
      </div>
    </header>
  );
}