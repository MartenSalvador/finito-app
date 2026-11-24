import { useState } from 'react';
import { AlertCircle, Eye, EyeOff, UserPlus } from 'lucide-react';

export default function AuthLoginForm({
  users = [],
  onCompleteAuth,
  onSwitchToRegisterWithEmail,
  t,
}) {
  const [emailInput, setEmailInput] = useState('marti@puzzle.com');
  const [passInput, setPassInput] = useState('123456');
  const [loginError, setLoginError] = useState('');
  const [userNotFound, setUserNotFound] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoginError('');
    setUserNotFound(false);

    const normalizedEmail = emailInput.trim().toLowerCase();
    const foundUser = users.find(
      (u) => u.email?.trim().toLowerCase() === normalizedEmail
    );

    if (!foundUser) {
      setUserNotFound(true);
      setLoginError(
        t?.userNotFoundError || 'No encontramos una cuenta con ese correo.'
      );
      return;
    }

    if (foundUser.password && foundUser.password !== passInput) {
      setLoginError(t?.wrongPasswordError || 'Contraseña incorrecta.');
      return;
    }

    onCompleteAuth?.(foundUser);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
      {loginError && (
        <div className="bg-[#F5F3FF] border border-[#5B3DF5]/35 rounded-2xl p-3.5 text-xs text-[#18181B] space-y-2.5 animate-slide-step">
          <div className="flex items-center gap-2 font-extrabold text-[#5B3DF5]">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#FFD43B] text-[#18181B] shrink-0">
              <AlertCircle className="w-3.5 h-3.5" />
            </span>
            <span>{loginError}</span>
          </div>
          {userNotFound && (
            <button
              type="button"
              onClick={() =>
                onSwitchToRegisterWithEmail?.({
                  email: emailInput.trim(),
                  password: passInput,
                })
              }
              className="w-full bg-white hover:bg-[#EBE7FF] border border-[#E5E0F5] hover:border-[#5B3DF5]/40 text-[#18181B] font-bold py-2.5 px-3 rounded-2xl transition-all duration-200 active:scale-[0.98] inline-flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#5B3DF5]" />
              <span>{t?.createAccountNow || 'Crear cuenta con este correo'}</span>
            </button>
          )}
        </div>
      )}

      <div>
        <label className="block text-xs uppercase font-extrabold text-[#6B7280] tracking-wider mb-1.5">
          {t?.emailLabel || 'Correo electrónico'}
        </label>
        <input
          type="email"
          autoComplete="email"
          value={emailInput}
          onChange={(e) => {
            setEmailInput(e.target.value);
            if (loginError) {
              setLoginError('');
              setUserNotFound(false);
            }
          }}
          className="w-full bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl px-4 py-3 text-sm text-[#18181B] placeholder-[#6B7280]/75 focus:outline-none focus:border-[#5B3DF5] focus:bg-white transition-all duration-200"
          required
        />
      </div>

      <div>
        <label className="block text-xs uppercase font-extrabold text-[#6B7280] tracking-wider mb-1.5">
          {t?.passwordLabel || 'Contraseña'}
        </label>
        <div className="relative">
          <input
            type={showLoginPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder={t?.passwordPlaceholder || 'Tu contraseña'}
            value={passInput}
            onChange={(e) => {
              setPassInput(e.target.value);
              if (loginError) {
                setLoginError('');
                setUserNotFound(false);
              }
            }}
            className="w-full bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl pl-4 pr-11 py-3 text-sm text-[#18181B] placeholder-[#6B7280]/75 focus:outline-none focus:border-[#5B3DF5] focus:bg-white transition-all duration-200"
            required
          />
          <button
            type="button"
            onClick={() => setShowLoginPassword((prev) => !prev)}
            aria-label={
              showLoginPassword
                ? t?.hidePasswordAria || 'Ocultar contraseña'
                : t?.showPasswordAria || 'Ver contraseña'
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-[#6B7280] hover:text-[#5B3DF5] hover:bg-[#EBE7FF]/70 transition-colors"
          >
            {showLoginPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-[#5B3DF5] hover:bg-[#482BD9] text-white font-bold py-3 rounded-2xl transition-all duration-200 shadow-2xs hover:shadow-md active:scale-[0.98] text-sm mt-2"
      >
        {t?.loginBtn || 'Ingresar'}
      </button>
    </form>
  );
}