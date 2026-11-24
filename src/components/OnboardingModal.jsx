
export default function OnboardingModal({
  currentUser,
  steps,
  currentStep,
  onSelectStep,
  onPrevStep,
  onNextStep,
  onFinish,
  t,
}) {
  if (!Array.isArray(steps) || steps.length === 0) return null;

  const currentSlide = steps[currentStep] || steps[0];
  const isLastSlide = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-[#18181B]/45 backdrop-blur-[2px] flex items-center justify-center p-4 animate-fade-in">
      <div className="max-w-md w-full bg-white border border-[#E5E0F5] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-modal-pop">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="px-3 py-1 rounded-full bg-[#FFD43B] text-[#18181B] font-extrabold">
            {currentUser?.name
              ? (t?.onboardingWelcomeUser || '¡Hola, {name}!').replace('{name}', currentUser.name)
              : (t?.onboardingTitle || 'Guía rápida')}
          </span>
          <button
            type="button"
            onClick={onFinish}
            className="text-xs font-bold text-[#6B7280] hover:text-[#18181B] transition-colors"
          >
            {t?.skipBtn || 'Saltar'}
          </button>
        </div>

        <div key={currentStep} className="text-center space-y-2.5 py-2 animate-slide-step">
          <div
            className="w-16 h-16 mx-auto rounded-2xl bg-[#F5F3FF] border border-[#E5E0F5] flex items-center justify-center text-3xl shadow-xs animate-gentle-float"
            aria-hidden="true"
          >
            {currentSlide.emoji}
          </div>
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#5B3DF5]">
            {(t?.stepIndicator || 'Paso {step} de {total}')
              .replace('{step}', String(currentStep + 1))
              .replace('{total}', String(steps.length))}
          </div>
          <h3 className="text-lg font-extrabold text-[#18181B]">
            {currentSlide.title}
          </h3>
          <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
            {currentSlide.desc}
          </p>
        </div>

        <div className="flex justify-center gap-1.5">
          {steps.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`${t?.stepLabel || 'Paso'} ${idx + 1}`}
              onClick={() => onSelectStep(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentStep ? 'w-7 bg-[#5B3DF5]' : 'w-2 bg-[#E5E0F5] hover:bg-[#C7BEF2]'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2 pt-1">
          {currentStep > 0 && (
            <button
              type="button"
              onClick={onPrevStep}
              className="px-4 py-2.5 rounded-2xl border border-[#E5E0F5] bg-[#F5F3FF] hover:bg-[#EBE7FF] text-[#18181B] font-bold text-xs sm:text-sm transition-all duration-200 active:scale-95"
            >
              {t?.backBtn || 'Atrás'}
            </button>
          )}

          <button
            type="button"
            onClick={isLastSlide ? onFinish : onNextStep}
            className="flex-1 bg-[#5B3DF5] hover:bg-[#482BD9] text-white font-bold py-2.5 rounded-2xl transition-all duration-200 shadow-sm hover:shadow active:scale-[0.98] text-xs sm:text-sm"
          >
            {isLastSlide
              ? t?.startExploringBtn || 'Empezar a explorar'
              : t?.nextBtn || 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  );
}