import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, Check, Eye, EyeOff, X } from 'lucide-react';
import CityAutocompleteInput from '../CityAutocompleteInput';

const TOTAL_STEPS = 5;

function calculateAge(birthDateString) {
  if (!birthDateString) return null;
  const parts = birthDateString.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;

  const [year, month, day] = parts;
  const today = new Date();
  let age = today.getFullYear() - year;
  const monthDiff = today.getMonth() + 1 - month;

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) {
    age -= 1;
  }

  return age;
}

export default function RegisterWizard({
  users = [],
  prefillEmail = '',
  prefillPassword = '',
  initialStep = 1,
  onRegisterUser,
  onCompleteAuth,
  t,
}) {
  const [step, setStep] = useState(initialStep);
  const [nameInput, setNameInput] = useState('');
  const [birthDateInput, setBirthDateInput] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [selectedCoords, setSelectedCoords] = useState({
    lat: 53.0494,
    lon: 8.6258,
  });
  const [regEmailInput, setRegEmailInput] = useState(prefillEmail);
  const [regPassInput, setRegPassInput] = useState(prefillPassword);
  const [confirmPassInput, setConfirmPassInput] = useState(prefillPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [legalDocModal, setLegalDocModal] = useState(null); // 'terms' | 'privacy' | null
  const [registerError, setRegisterError] = useState('');

  const nameInputRef = useRef(null);
  const birthDateInputRef = useRef(null);
  const cityWrapperRef = useRef(null);
  const emailInputRef = useRef(null);
  const passInputRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (step === 1) {
        nameInputRef.current?.focus();
      } else if (step === 2) {
        birthDateInputRef.current?.focus();
      } else if (step === 3) {
        const innerInput = cityWrapperRef.current?.querySelector('input');
        innerInput?.focus();
      } else if (step === 4) {
        emailInputRef.current?.focus();
      } else if (step === 5) {
        passInputRef.current?.focus();
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [step]);

  const stepMeta = {
    1: {
      title: t?.stepNameTitle || '¿Cómo te llamás?',
      subtitle: t?.stepNameSubtitle || 'Así te van a ver otros jugadores al intercambiar.',
    },
    2: {
      title: t?.stepAgeTitle || '¿Cuál es tu fecha de nacimiento?',
      subtitle:
        t?.stepAgeSubtitle ||
        'La plataforma es solo para mayores de 18 años por seguridad en chats e intercambios.',
    },
    3: {
      title: t?.stepCityTitle || '¿Dónde estás?',
      subtitle: t?.stepCitySubtitle || 'Usamos tu ciudad para mostrar rompecabezas cerca tuyo.',
    },
    4: {
      title: t?.stepEmailTitle || '¿Cuál es tu correo?',
      subtitle: t?.stepEmailSubtitle || 'Te servirá para ingresar y gestionar tu cuenta.',
    },
    5: {
      title: t?.stepPasswordTitle || 'Creá una contraseña',
      subtitle: t?.stepPasswordSubtitle || 'Al menos 6 caracteres para proteger tu cuenta.',
    },
  };

  const legalContent = {
    terms: {
      title: t?.termsTitle || 'Términos y condiciones',
      points: [
        t?.termsPoint1 ||
          'Debés ser mayor de 18 años para crear una cuenta, usar el chat y coordinar intercambios.',
        t?.termsPoint2 ||
          'Finito es una plataforma gratuita y sin fines de lucro que solo sirve como medio de contacto entre usuarios. Los intercambios y envíos se acuerdan directamente entre las partes y bajo su responsabilidad: si un intercambio falla, llega incompleto o no se cumple un envío, la plataforma no se responsabiliza.',
        t?.termsPoint3 ||
          'Indicá con honestidad el estado del rompecabezas y si faltan piezas. Para encuentros en persona, priorizá lugares públicos, visibles y concurridos, y evitá compartir datos sensibles o de valor.',
        t?.termsPoint4 ||
          'Finito nunca pide dinero, señas, comisiones ni datos bancarios. Si otro usuario te pide dinero o transferencias, no envíes nada y reportá su cuenta.',
      ].filter(Boolean),
    },
    privacy: {
      title: t?.privacyTitle || 'Política de privacidad',
      points: [
        t?.privacyPoint1 ||
          'Usamos tu correo electrónico para gestionar tu cuenta y tu fecha de nacimiento para verificar la edad mínima requerida (+18).',
        t?.privacyPoint2 ||
          'Tu ciudad y coordenadas aproximadas se utilizan para mostrar rompecabezas cercanos y calcular distancias de referencia sin exponer tu domicilio exacto.',
        t?.privacyPoint3 ||
          'No subas ni compartas datos personales de valor (documentos, claves, datos bancarios o direcciones exactas). Podés eliminar tu cuenta y tus datos cuando quieras desde tu perfil.',
      ].filter(Boolean),
    },
  };

  const validateStep = (currentStep) => {
    setRegisterError('');

    if (currentStep === 1) {
      if (!nameInput.trim()) {
        setRegisterError(
          t?.nameRequiredError || 'Ingresá tu nombre para continuar.'
        );
        return false;
      }
      return true;
    }

    if (currentStep === 2) {
      if (!birthDateInput) {
        setRegisterError(
          t?.birthDateRequiredError || 'Ingresá tu fecha de nacimiento para continuar.'
        );
        return false;
      }

      const age = calculateAge(birthDateInput);
      if (age === null || age < 0 || age > 120) {
        setRegisterError(
          t?.invalidBirthDateError || 'Ingresá una fecha de nacimiento válida.'
        );
        return false;
      }

      if (age < 18) {
        setRegisterError(
          t?.underageError ||
            'Debés tener al menos 18 años para registrarte y coordinar intercambios.'
        );
        return false;
      }

      return true;
    }

    if (currentStep === 3) {
      if (!cityInput.trim()) {
        setRegisterError(
          t?.cityRequiredError || 'Elegí o escribí tu ciudad para buscar cerca tuyo.'
        );
        return false;
      }
      return true;
    }

    if (currentStep === 4) {
      const normalizedEmail = regEmailInput.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
        setRegisterError(
          t?.invalidEmailError || 'Ingresá un correo electrónico válido.'
        );
        return false;
      }
      const alreadyExists = users.some(
        (u) => u.email?.trim().toLowerCase() === normalizedEmail
      );
      if (alreadyExists) {
        setRegisterError(
          t?.emailAlreadyExists || 'Ya existe una cuenta registrada con ese correo.'
        );
        return false;
      }
      return true;
    }

    if (currentStep === 5) {
      if (!regPassInput || regPassInput.length < 6) {
        setRegisterError(
          t?.passwordMinLengthError || 'La contraseña debe tener al menos 6 caracteres.'
        );
        return false;
      }
      if (regPassInput !== confirmPassInput) {
        setRegisterError(
          t?.passwordMismatchError || 'Las contraseñas no coinciden.'
        );
        return false;
      }
      if (!acceptedTerms) {
        setRegisterError(
          t?.termsRequiredError ||
            'Tenés que aceptar los términos y condiciones y la política de privacidad para registrarte.'
        );
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNextStep = () => {
    if (!validateStep(step)) return;
    setStep((prev) => Math.min(TOTAL_STEPS, prev + 1));
  };

  const handlePrevStep = () => {
    setRegisterError('');
    setLegalDocModal(null);
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleEnterAdvance = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNextStep();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step < TOTAL_STEPS) {
      handleNextStep();
      return;
    }
    if (!validateStep(2) || !validateStep(5)) return;

    const normalizedEmail = regEmailInput.trim().toLowerCase();
    const cleanCityName =
      (cityInput.split(',')[0] || '').trim() || (t?.defaultCityName || 'Delmenhorst');

    const newUser = {
      id: `u_${Date.now()}`,
      name: nameInput.trim() || (t?.defaultNewUserName || 'Nuevo Puzzler'),
      birthDate: birthDateInput,
      email: normalizedEmail,
      city: cleanCityName,
      cp: '',
      lat: selectedCoords.lat,
      lon: selectedCoords.lon,
      rating: null,
      tradesCount: 0,
      avatar: '',
      acceptedTermsAt: new Date().toISOString(),
    };

    onRegisterUser?.(newUser, regPassInput);
    onCompleteAuth?.(newUser, { isNewRegistration: true });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-[#6B7280]">
          <span className="inline-block bg-[#FFD43B] text-[#18181B] font-extrabold px-2.5 py-0.5 rounded-full tabular-nums">
            {(t?.stepIndicator || 'Paso {step} de {total}')
              .replace('{step}', String(step))
              .replace('{total}', String(TOTAL_STEPS))}
          </span>
          <span className="text-[#5B3DF5] font-extrabold">{stepMeta[step]?.title}</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                s <= step ? 'bg-[#5B3DF5]' : 'bg-[#E5E0F5]'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-[#6B7280]">{stepMeta[step]?.subtitle}</p>
      </div>

      {registerError && (
        <div className="bg-[#F5F3FF] border border-[#5B3DF5]/35 rounded-2xl p-3 text-xs font-bold text-[#18181B] flex items-center gap-2 animate-slide-step">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#FFD43B] text-[#18181B] shrink-0">
            <AlertCircle className="w-3.5 h-3.5" />
          </span>
          <span className="text-[#5B3DF5]">{registerError}</span>
        </div>
      )}

      <div key={step} className="animate-slide-step">
        {step === 1 && (
          <div>
            <label className="block text-xs uppercase font-extrabold text-[#6B7280] tracking-wider mb-1.5">
              {t?.nameLabel || 'Nombre'}
            </label>
            <input
              ref={nameInputRef}
              type="text"
              autoFocus
              autoComplete="name"
              placeholder={t?.namePlaceholder || 'Ej: Martín Salvador'}
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value);
                if (registerError) setRegisterError('');
              }}
              onKeyDown={handleEnterAdvance}
              className="w-full bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl px-4 py-3 text-sm text-[#18181B] placeholder-[#6B7280]/75 focus:outline-none focus:border-[#5B3DF5] focus:bg-white transition-all duration-200"
            />
          </div>
        )}

        {step === 2 && (
          <div>
            <label className="block text-xs uppercase font-extrabold text-[#6B7280] tracking-wider mb-1.5">
              {t?.birthDateLabel || 'Fecha de nacimiento'}
            </label>
            <input
              ref={birthDateInputRef}
              type="date"
              autoComplete="bday"
              value={birthDateInput}
              onChange={(e) => {
                setBirthDateInput(e.target.value);
                if (registerError) setRegisterError('');
              }}
              onKeyDown={handleEnterAdvance}
              className="w-full bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl px-4 py-3 text-sm text-[#18181B] focus:outline-none focus:border-[#5B3DF5] focus:bg-white transition-all duration-200"
            />
          </div>
        )}

        {step === 3 && (
          <div
            ref={cityWrapperRef}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.defaultPrevented) {
                e.preventDefault();
                handleNextStep();
              }
            }}
          >
            <label className="block text-xs uppercase font-extrabold text-[#6B7280] tracking-wider mb-1.5">
              {t?.cityLabel || 'Ciudad'}
            </label>
            <CityAutocompleteInput
              value={cityInput}
              onChangeText={(text) => {
                setCityInput(text);
                if (registerError) setRegisterError('');
              }}
              onSelectCity={(place) => {
                const shortName = (place.displayName.split(',')[0] || '').trim();
                setCityInput(shortName);
                setSelectedCoords({
                  lat: place.lat,
                  lon: place.lon,
                });
                if (registerError) setRegisterError('');
              }}
              placeholder={t?.registrationCityPlaceholder || 'Ej: Delmenhorst'}
            />
          </div>
        )}

        {step === 4 && (
          <div>
            <label className="block text-xs uppercase font-extrabold text-[#6B7280] tracking-wider mb-1.5">
              {t?.emailLabel || 'Correo electrónico'}
            </label>
            <input
              ref={emailInputRef}
              type="email"
              autoFocus
              autoComplete="email"
              placeholder={t?.emailPlaceholder || 'tu@correo.com'}
              value={regEmailInput}
              onChange={(e) => {
                setRegEmailInput(e.target.value);
                if (registerError) setRegisterError('');
              }}
              onKeyDown={handleEnterAdvance}
              className="w-full bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl px-4 py-3 text-sm text-[#18181B] placeholder-[#6B7280]/75 focus:outline-none focus:border-[#5B3DF5] focus:bg-white transition-all duration-200"
            />
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs uppercase font-extrabold text-[#6B7280] tracking-wider mb-1.5">
                {t?.passwordLabel || 'Contraseña'}
              </label>
              <div className="relative">
                <input
                  ref={passInputRef}
                  type={showPassword ? 'text' : 'password'}
                  autoFocus
                  autoComplete="new-password"
                  minLength={6}
                  placeholder={t?.passwordPlaceholder || 'Mínimo 6 caracteres'}
                  value={regPassInput}
                  onChange={(e) => {
                    setRegPassInput(e.target.value);
                    if (registerError) setRegisterError('');
                  }}
                  className="w-full bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl pl-4 pr-11 py-3 text-sm text-[#18181B] placeholder-[#6B7280]/75 focus:outline-none focus:border-[#5B3DF5] focus:bg-white transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword
                      ? t?.hidePasswordAria || 'Ocultar contraseña'
                      : t?.showPasswordAria || 'Ver contraseña'
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-[#6B7280] hover:text-[#5B3DF5] hover:bg-[#EBE7FF]/70 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase font-extrabold text-[#6B7280] tracking-wider mb-1.5">
                {t?.confirmPasswordLabel || 'Repetir contraseña'}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  minLength={6}
                  placeholder={t?.confirmPasswordPlaceholder || 'Repetí tu contraseña'}
                  value={confirmPassInput}
                  onChange={(e) => {
                    setConfirmPassInput(e.target.value);
                    if (registerError) setRegisterError('');
                  }}
                  className="w-full bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl pl-4 pr-11 py-3 text-sm text-[#18181B] placeholder-[#6B7280]/75 focus:outline-none focus:border-[#5B3DF5] focus:bg-white transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword
                      ? t?.hidePasswordAria || 'Ocultar contraseña'
                      : t?.showPasswordAria || 'Ver contraseña'
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-[#6B7280] hover:text-[#5B3DF5] hover:bg-[#EBE7FF]/70 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <label className="flex items-start gap-2.5 bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl p-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => {
                  setAcceptedTerms(e.target.checked);
                  if (registerError) setRegisterError('');
                }}
                className="mt-0.5 h-4 w-4 rounded border-[#E5E0F5] text-[#5B3DF5] focus:ring-[#5B3DF5] shrink-0"
              />
              <span className="text-xs text-[#18181B] leading-relaxed">
                {t?.acceptTermsPrefix || 'Confirmo que soy mayor de 18 años y acepto los '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setLegalDocModal('terms');
                  }}
                  className="font-extrabold text-[#5B3DF5] underline hover:text-[#482BD9]"
                >
                  {t?.termsLinkLabel || 'Términos y condiciones'}
                </button>
                {t?.andConnector || ' y la '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setLegalDocModal('privacy');
                  }}
                  className="font-extrabold text-[#5B3DF5] underline hover:text-[#482BD9]"
                >
                  {t?.privacyLinkLabel || 'Política de privacidad'}
                </button>
                .
              </span>
            </label>
          </div>
        )}
      </div>

      {legalDocModal && legalContent[legalDocModal] && (
        <div className="bg-[#F5F3FF] border border-[#5B3DF5]/30 rounded-2xl p-3.5 space-y-2 animate-slide-step">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#5B3DF5]">
              {legalContent[legalDocModal].title}
            </h4>
            <button
              type="button"
              onClick={() => setLegalDocModal(null)}
              aria-label={t?.closeDocBtn || 'Cerrar'}
              className="p-1 rounded-full hover:bg-[#EBE7FF] text-[#18181B] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <ul className="space-y-1.5 text-xs text-[#18181B]/90 list-disc pl-4">
            {legalContent[legalDocModal].points.map((point, idx) => (
              <li key={idx}>{point}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-2 pt-2">
        {step > 1 && (
          <button
            type="button"
            onClick={handlePrevStep}
            className="px-4 py-3 rounded-2xl border border-[#E5E0F5] bg-[#F5F3FF] hover:bg-[#EBE7FF] text-[#18181B] font-bold text-sm transition-all duration-200 active:scale-95 inline-flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t?.backBtn || 'Atrás'}</span>
          </button>
        )}

        {step < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={handleNextStep}
            className="flex-1 bg-[#5B3DF5] hover:bg-[#482BD9] text-white font-bold py-3 rounded-2xl transition-all duration-200 shadow-2xs hover:shadow-md active:scale-[0.98] text-sm inline-flex items-center justify-center gap-1.5"
          >
            <span>{t?.nextBtn || 'Siguiente'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="submit"
            className="flex-1 bg-[#5B3DF5] hover:bg-[#482BD9] text-white font-bold py-3 rounded-2xl transition-all duration-200 shadow-2xs hover:shadow-md active:scale-[0.98] text-sm inline-flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{t?.registerBtn || 'Registrarse'}</span>
          </button>
        )}
      </div>
    </form>
  );
}