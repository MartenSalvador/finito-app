import { useState } from 'react';
import { Globe } from 'lucide-react';
import AuthLoginForm from '../components/auth/AuthLoginForm';
import RegisterWizard from '../components/auth/RegisterWizard';
import Frase from '../assets/Finito-frase.png';

export default function AuthView({
  users = [],
  onRegisterUser,
  setCurrentUser,
  setIsLoggedIn,
  onAuthSuccess,
  asModal = false,
  initialMode = 'login',
  promptReason = '',
  lang,
  setLang,
  t,
}) {
  const [authMode, setAuthMode] = useState(initialMode);
  const [registerSeed, setRegisterSeed] = useState({
    email: '',
    password: '',
    step: 1,
  });

  const handleSwitchMode = (mode) => {
    setAuthMode(mode);
    if (mode === 'register') {
      setRegisterSeed({ email: '', password: '', step: 1 });
    }
  };

  const handleSwitchToRegisterWithEmail = ({ email, password }) => {
    setRegisterSeed({
      email: email || '',
      password: password || '',
      step: 3,
    });
    setAuthMode('register');
  };

  const handleCompleteAuth = (user, meta = {}) => {
    if (onAuthSuccess) {
      onAuthSuccess(user, meta);
      return;
    }
    setCurrentUser?.(user);
    setIsLoggedIn?.(true);
  };

  const cardContent = (
    <div
      className={`max-w-md w-full bg-white border border-[#E5E0F5] rounded-3xl transition-all duration-300 ${
        asModal ? 'p-6 sm:p-7 shadow-2xl' : 'p-8 shadow-sm animate-modal-pop'
      }`}
    >
      <div className="flex items-center justify-center gap-3 mb-3 pr-6">
        <img
          src={Frase}
          alt={t?.bannerPhrase || t?.appName || 'Finito'}
          className="w-full max-w-lg h-auto max-h-32 object-contain mx-auto transition-transform duration-300 hover:scale-[1.02]"
        />
      </div>

      <p className="text-center text-[#6B7280] mb-4 text-xs sm:text-sm font-medium">
        {t?.loginSubtitle || 'Intercambiá rompecabezas cerca tuyo'}
      </p>

      {promptReason && (
        <div className="mb-4 bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl px-3.5 py-2.5 text-xs font-bold text-[#18181B] text-center animate-slide-step">
          {promptReason}
        </div>
      )}

      <div className="flex bg-[#F5F3FF] p-1 rounded-full mb-5 border border-[#E5E0F5]">
        <button
          type="button"
          onClick={() => handleSwitchMode('login')}
          className={`flex-1 py-2 text-xs font-bold rounded-full transition-all duration-200 active:scale-95 ${
            authMode === 'login'
              ? 'bg-[#5B3DF5] text-white shadow-2xs'
              : 'text-[#6B7280] hover:text-[#18181B]'
          }`}
        >
          {t?.loginBtn || 'Ingresar'}
        </button>
        <button
          type="button"
          onClick={() => handleSwitchMode('register')}
          className={`flex-1 py-2 text-xs font-bold rounded-full transition-all duration-200 active:scale-95 ${
            authMode === 'register'
              ? 'bg-[#5B3DF5] text-white shadow-2xs'
              : 'text-[#6B7280] hover:text-[#18181B]'
          }`}
        >
          {t?.registerBtn || 'Registrarse'}
        </button>
      </div>

      <div key={authMode} className="animate-slide-step">
        {authMode === 'login' ? (
          <AuthLoginForm
            users={users}
            onCompleteAuth={handleCompleteAuth}
            onSwitchToRegisterWithEmail={handleSwitchToRegisterWithEmail}
            t={t}
          />
        ) : (
          <RegisterWizard
            users={users}
            prefillEmail={registerSeed.email}
            prefillPassword={registerSeed.password}
            initialStep={registerSeed.step}
            onRegisterUser={onRegisterUser}
            onCompleteAuth={handleCompleteAuth}
            t={t}
          />
        )}
      </div>
    </div>
  );

  if (asModal) {
    return cardContent;
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#18181B] flex flex-col justify-center items-center p-4 relative transition-colors duration-300">
      {setLang && (
        <div className="absolute top-4 right-4 flex items-center bg-[#F5F3FF] hover:bg-[#EBE7FF] border border-[#E5E0F5] rounded-full px-3 py-1.5 shadow-2xs transition-colors duration-200">
          <Globe className="w-4 h-4 text-[#5B3DF5] mr-1.5" />
          <select
            aria-label={t?.languageLabel || 'Seleccionar idioma'}
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="bg-transparent text-xs text-[#18181B] font-bold focus:outline-none cursor-pointer"
          >
            <option value="es" className="bg-white text-[#18181B]">ES</option>
            <option value="de" className="bg-white text-[#18181B]">DE</option>
            <option value="en" className="bg-white text-[#18181B]">EN</option>
          </select>
        </div>
      )}

      {cardContent}
    </div>
  );
}