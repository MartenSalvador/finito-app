import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { AlertCircle, Eye, EyeOff, Loader2, UserPlus } from 'lucide-react';
import { auth, db } from '../../firebase/config';

export default function AuthLoginForm({
  users = [],
  onCompleteAuth,
  onSwitchToRegisterWithEmail,
  t,
}) {
  const [emailInput, setEmailInput] = useState('');
  const [passInput, setPassInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [canCreateAccount, setCanCreateAccount] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setLoginError('');
    setCanCreateAccount(false);
    setIsSubmitting(true);

    const normalizedEmail = emailInput.trim().toLowerCase();

    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        passInput
      );
      const firebaseUser = credential.user;

      // Cargamos el perfil desde Firestore; si aún no existe en la colección, armamos fallback
      const userSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
      const existingLocalUser = users.find(
        (u) => u.id === firebaseUser.uid || u.email?.trim().toLowerCase() === normalizedEmail
      );

      const userProfile = userSnap.exists()
        ? { id: firebaseUser.uid, ...userSnap.data() }
        : existingLocalUser || {
            id: firebaseUser.uid,
            email: firebaseUser.email || normalizedEmail,
            name: firebaseUser.displayName || normalizedEmail.split('@')[0],
          };

      onCompleteAuth?.(userProfile);
    } catch (error) {
      const code = error?.code || '';

      if (code === 'auth/user-not-found') {
        setCanCreateAccount(true);
        setLoginError(
          t?.userNotFoundError || 'No encontramos una cuenta con ese correo.'
        );
      } else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        // Firebase unifica user-not-found y wrong-password en invalid-credential por seguridad;
        // ofrecer crear cuenta cubre ambos casos sin frustrar al usuario.
        setCanCreateAccount(true);
        setLoginError(
          t?.invalidCredentialsError ||
            'Correo o contraseña incorrectos. Si aún no tenés cuenta, podés crearla ahora.'
        );
      } else if (code === 'auth/invalid-email') {
        setLoginError(
          t?.invalidEmailError || 'Ingresá un correo electrónico válido.'
        );
      } else if (code === 'auth/too-many-requests') {
        setLoginError(
          t?.tooManyRequestsError ||
            'Demasiados intentos fallidos. Esperá unos minutos e intentá de nuevo.'
        );
      } else {
        setLoginError(
          t?.genericAuthError || 'No pudimos iniciar sesión. Intentá nuevamente.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
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
          {canCreateAccount && (
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
          autoComplete="username"
          placeholder={t?.emailPlaceholder || 'tu@correo.com'}
          value={emailInput}
          disabled={isSubmitting}
          onChange={(e) => {
            setEmailInput(e.target.value);
            if (loginError) {
              setLoginError('');
              setCanCreateAccount(false);
            }
          }}
          className="w-full bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl px-4 py-3 text-sm text-[#18181B] placeholder-[#6B7280]/75 focus:outline-none focus:border-[#5B3DF5] focus:bg-white transition-all duration-200 disabled:opacity-60"
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
            disabled={isSubmitting}
            onChange={(e) => {
              setPassInput(e.target.value);
              if (loginError) {
                setLoginError('');
                setCanCreateAccount(false);
              }
            }}
            className="w-full bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl pl-4 pr-11 py-3 text-sm text-[#18181B] placeholder-[#6B7280]/75 focus:outline-none focus:border-[#5B3DF5] focus:bg-white transition-all duration-200 disabled:opacity-60"
            required
          />
          <button
            type="button"
            onClick={() => setShowLoginPassword((prev) => !prev)}
            disabled={isSubmitting}
            aria-label={
              showLoginPassword
                ? t?.hidePasswordAria || 'Ocultar contraseña'
                : t?.showPasswordAria || 'Ver contraseña'
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-[#6B7280] hover:text-[#5B3DF5] hover:bg-[#EBE7FF]/70 transition-colors disabled:opacity-50"
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
        disabled={isSubmitting}
        className="w-full bg-[#5B3DF5] hover:bg-[#482BD9] text-white font-bold py-3 rounded-2xl transition-all duration-200 shadow-2xs hover:shadow-md active:scale-[0.98] text-sm mt-2 inline-flex items-center justify-center gap-2 disabled:opacity-65 disabled:pointer-events-none"
      >
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
        <span>{t?.loginBtn || 'Ingresar'}</span>
      </button>
    </form>
  );
}