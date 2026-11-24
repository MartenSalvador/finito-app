export default function WelcomeBanner({ onOpenAuthModal, t }) {
  return (
    <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 pt-4 animate-collapse-reveal">
      <div className="bg-[#5B3DF5] text-white rounded-3xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#FFD43B]">
            <span>🧩</span>
            <span>{t?.appName || 'Finito'}</span>
          </div>
          <h2 className="text-sm sm:text-base font-extrabold text-white">
            {t?.welcomeBannerTitle || 'Intercambiá rompecabezas cerca tuyo'}
          </h2>
          <p className="text-xs text-white/85 leading-relaxed">
            {t?.welcomeBannerSubtitle ||
              'Explorá publicaciones de tu zona, intercambiá los que ya armaste y compartí tus rompecabezas terminados.'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onOpenAuthModal?.('login')}
            className="px-4 py-2 rounded-full text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-all duration-200 active:scale-95"
          >
            {t?.loginBtn || 'Ingresar'}
          </button>
          <button
            type="button"
            onClick={() => onOpenAuthModal?.('register')}
            className="px-4 py-2 rounded-full text-xs font-extrabold bg-[#FFD43B] hover:bg-[#FCC419] text-[#18181B] transition-all duration-200 shadow-xs hover:shadow active:scale-95"
          >
            {t?.registerBtn || 'Registrarse'}
          </button>
        </div>
      </div>
    </div>
  );
}