import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  MessageSquarePlus,
  Send,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';

const DELETE_CONFIRM_WORD = 'ELIMINAR';
const MIN_FEEDBACK_LENGTH = 10;

export default function ProfileAccountSection({
  currentUser,
  onDeleteAccount,
  onSendFeedback,
  t,
}) {
  const [isSectionExpanded, setIsSectionExpanded] = useState(false);
  const [activePanel, setActivePanel] = useState(null); // 'terms' | 'privacy' | 'feedback' | null
  const [confirmingDeleteAccount, setConfirmingDeleteAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Estado del formulario de sugerencias o consultas
  const [feedbackType, setFeedbackType] = useState('suggestion');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackError, setFeedbackError] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);

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

  const feedbackOptions = [
    { id: 'suggestion', label: t?.feedbackTypeSuggestion || 'Sugerencia' },
    { id: 'question', label: t?.feedbackTypeQuestion || 'Consulta' },
    { id: 'bug', label: t?.feedbackTypeBug || 'Problema técnico' },
  ];

  const handleToggleSection = () => {
    setIsSectionExpanded((prev) => {
      const next = !prev;
      if (!next) {
        setActivePanel(null);
        setConfirmingDeleteAccount(false);
        setDeleteConfirmText('');
        setFeedbackError('');
      }
      return next;
    });
  };

  const handleTogglePanel = (panelKey) => {
    setFeedbackError('');
    setConfirmingDeleteAccount(false);
    setDeleteConfirmText('');
    setActivePanel((prev) => (prev === panelKey ? null : panelKey));
  };

  const handleOpenDeleteConfirm = () => {
    setActivePanel(null);
    setFeedbackError('');
    setDeleteConfirmText('');
    setDeletePassword('');
    setDeleteError('');
    setConfirmingDeleteAccount(true);
  };

  const handleCancelDeleteConfirm = () => {
    setConfirmingDeleteAccount(false);
    setDeleteConfirmText('');
    setDeletePassword('');
    setDeleteError('');
  };

  const handleConfirmDeleteAccount = async (e) => {
    e.preventDefault();
    if (deleteConfirmText.trim().toUpperCase() !== DELETE_CONFIRM_WORD) return;

    setDeleteError('');
    setIsDeletingAccount(true);
    try {
      await onDeleteAccount?.(deletePassword);
    } catch (error) {
      setDeleteError(
        error?.code === 'auth/wrong-password' ||
          error?.code === 'auth/invalid-credential'
          ? t?.deleteAccountWrongPassword ||
              'La contraseña no es correcta. Verificala e intentá de nuevo.'
          : error?.code === 'auth/requires-recent-login'
            ? t?.deleteAccountRecentLogin ||
                'Volvé a iniciar sesión y luego intentá eliminar la cuenta nuevamente.'
            : t?.deleteAccountError ||
                'No se pudo completar la eliminación. Tus datos no se eliminaron por completo; intentá otra vez.'
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    const trimmed = feedbackMessage.trim();

    if (trimmed.length < MIN_FEEDBACK_LENGTH) {
      setFeedbackError(
        (
          t?.feedbackMinLengthError ||
          'Escribí un mensaje de al menos {min} caracteres.'
        ).replace('{min}', String(MIN_FEEDBACK_LENGTH))
      );
      return;
    }

    if (typeof onSendFeedback !== 'function') {
      setFeedbackError(
        t?.feedbackUnavailableError ||
          'El envío de sugerencias no está disponible en esta versión.'
      );
      return;
    }

    setFeedbackError('');
    setIsSendingFeedback(true);

    try {
      await onSendFeedback({
        type: feedbackType,
        message: trimmed,
        userId: currentUser?.id || null,
        userEmail: currentUser?.email || null,
        createdAt: new Date().toISOString(),
      });
      setFeedbackMessage('');
      setFeedbackSent(true);
    } catch {
      setFeedbackError(
        t?.feedbackSendError ||
          'No se pudo enviar el mensaje. Intentá nuevamente en unos minutos.'
      );
    } finally {
      setIsSendingFeedback(false);
    }
  };

  const isDeleteWordMatched =
    deleteConfirmText.trim().toUpperCase() === DELETE_CONFIRM_WORD;

  return (
    <div className="bg-white border border-[#E5E0F5] rounded-3xl p-4 space-y-3.5 shadow-2xs">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#6B7280]">
            {t?.accountPrivacyTitle || 'Cuenta y datos'}
          </h3>
          <p className="text-xs text-[#6B7280] mt-0.5">
            {t?.accountSectionHint ||
              'Consultá los textos legales, enviá sugerencias o eliminá tu cuenta de forma permanente.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleToggleSection}
          aria-expanded={isSectionExpanded}
          className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-2xl border transition-all duration-200 active:scale-95 shrink-0 ${
            isSectionExpanded
              ? 'bg-[#5B3DF5] text-white border-[#5B3DF5]'
              : 'bg-[#F5F3FF] hover:bg-[#EBE7FF] text-[#18181B] border-[#E5E0F5]'
          }`}
        >
          <span>
            {isSectionExpanded
              ? t?.hideAccountOptionsBtn || 'Ocultar'
              : t?.openAccountOptionsBtn || 'Ver opciones'}
          </span>
          {isSectionExpanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-[#5B3DF5]" />
          )}
        </button>
      </div>

      {isSectionExpanded && (
        <div className="space-y-3 pt-1 border-t border-[#E5E0F5]/70 animate-slide-step">
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleTogglePanel('terms')}
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-2xl border transition-all duration-200 ${
                activePanel === 'terms'
                  ? 'bg-[#5B3DF5] text-white border-[#5B3DF5]'
                  : 'bg-[#F5F3FF] hover:bg-[#EBE7FF] text-[#18181B] border-[#E5E0F5]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{t?.termsLinkLabel || 'Términos y condiciones'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleTogglePanel('privacy')}
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-2xl border transition-all duration-200 ${
                activePanel === 'privacy'
                  ? 'bg-[#5B3DF5] text-white border-[#5B3DF5]'
                  : 'bg-[#F5F3FF] hover:bg-[#EBE7FF] text-[#18181B] border-[#E5E0F5]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t?.privacyLinkLabel || 'Política de privacidad'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleTogglePanel('feedback')}
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-2xl border transition-all duration-200 ${
                activePanel === 'feedback'
                  ? 'bg-[#5B3DF5] text-white border-[#5B3DF5]'
                  : 'bg-[#F5F3FF] hover:bg-[#EBE7FF] text-[#18181B] border-[#E5E0F5]'
              }`}
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              <span>{t?.feedbackBtn || 'Sugerencias o consultas'}</span>
            </button>

            {!confirmingDeleteAccount && (
              <button
                type="button"
                onClick={handleOpenDeleteConfirm}
                className="inline-flex items-center gap-1.5 bg-[#F5F3FF] hover:bg-[#EBE7FF] text-[#18181B] border border-[#E5E0F5] text-xs font-bold px-3 py-1.5 rounded-2xl transition-all duration-200 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5 text-[#5B3DF5]" />
                <span>{t?.deleteAccountBtn || 'Eliminar cuenta'}</span>
              </button>
            )}
          </div>

          {(activePanel === 'terms' || activePanel === 'privacy') &&
            legalContent[activePanel] && (
              <div className="bg-[#F5F3FF] border border-[#5B3DF5]/25 rounded-2xl p-3.5 space-y-2 animate-slide-step">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#5B3DF5]">
                    {legalContent[activePanel].title}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setActivePanel(null)}
                    aria-label={t?.closeDocBtn || 'Cerrar'}
                    className="p-1 rounded-full hover:bg-[#EBE7FF] text-[#18181B] transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <ul className="space-y-1.5 text-xs text-[#18181B]/90 list-disc pl-4">
                  {legalContent[activePanel].points.map((point, idx) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ul>
              </div>
            )}

          {activePanel === 'feedback' && (
            <div className="bg-[#F5F3FF] border border-[#5B3DF5]/25 rounded-2xl p-3.5 space-y-3 animate-slide-step">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#5B3DF5]">
                    {t?.feedbackTitle || 'Sugerencias o consultas'}
                  </h4>
                  <p className="text-[11px] text-[#6B7280]">
                    {t?.feedbackSubtitle ||
                      'Contanos qué mejorarías, hacé una consulta o avisá si notaste algún fallo.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePanel(null)}
                  aria-label={t?.closeDocBtn || 'Cerrar'}
                  className="p-1 rounded-full hover:bg-[#EBE7FF] text-[#18181B] transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {feedbackSent ? (
                <div className="bg-white border border-[#E5E0F5] rounded-2xl p-3 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2 font-bold text-[#18181B]">
                    <CheckCircle2 className="w-4 h-4 text-[#5B3DF5] shrink-0" />
                    <span>
                      {t?.feedbackSentSuccess ||
                        '¡Gracias! Recibimos tu mensaje.'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFeedbackSent(false)}
                    className="text-xs font-bold text-[#5B3DF5] underline hover:text-[#482BD9]"
                  >
                    {t?.sendAnotherFeedbackBtn || 'Enviar otro mensaje'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    {feedbackOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setFeedbackType(option.id);
                          if (feedbackError) setFeedbackError('');
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                          feedbackType === option.id
                            ? 'bg-[#FFD43B] text-[#18181B]'
                            : 'bg-white text-[#6B7280] border border-[#E5E0F5] hover:text-[#18181B]'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={3}
                    value={feedbackMessage}
                    onChange={(e) => {
                      setFeedbackMessage(e.target.value);
                      if (feedbackError) setFeedbackError('');
                    }}
                    placeholder={
                      t?.feedbackPlaceholder ||
                      'Escribí tu idea, duda o detalle del problema...'
                    }
                    className="w-full bg-white border border-[#E5E0F5] rounded-2xl px-3.5 py-2.5 text-xs text-[#18181B] placeholder-[#6B7280]/75 focus:outline-none focus:border-[#5B3DF5] transition-all resize-none"
                  />

                  {feedbackError && (
                    <p className="text-[11px] font-bold text-[#5B3DF5]">
                      {feedbackError}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#6B7280]">
                      {t?.feedbackPrivacyNote ||
                        'No compartas contraseñas ni datos bancarios.'}
                    </span>
                    <button
                      type="submit"
                      disabled={isSendingFeedback}
                      className="inline-flex items-center gap-1.5 bg-[#5B3DF5] hover:bg-[#482BD9] disabled:opacity-60 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all active:scale-95 shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>
                        {isSendingFeedback
                          ? t?.sendingBtn || 'Enviando...'
                          : t?.sendFeedbackBtn || 'Enviar'}
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {confirmingDeleteAccount && (
            <form
              onSubmit={handleConfirmDeleteAccount}
              className="bg-[#F5F3FF] border border-[#E5E0F5] rounded-2xl p-3.5 space-y-3 animate-slide-step"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#5B3DF5] shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <p className="font-extrabold text-[#18181B]">
                      {t?.deleteAccountTitle || '¿Eliminar tu cuenta y todos tus datos?'}
                    </p>
                    <p className="text-[11px] text-[#6B7280] leading-relaxed">
                      {t?.deleteAccountWarning ||
                        'Esta acción no se puede deshacer: se borrarán tu perfil, publicaciones, favoritos, intercambios y mensajes.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCancelDeleteConfirm}
                  aria-label={t?.cancelBtn || 'Cancelar'}
                  className="text-[#6B7280] hover:text-[#18181B] p-1 rounded-full shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[#18181B]">
                  {(
                    t?.typeWordToConfirm ||
                    'Escribí {word} para confirmar:'
                  ).replace('{word}', DELETE_CONFIRM_WORD)}
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={DELETE_CONFIRM_WORD}
                  className="w-full bg-white border border-[#E5E0F5] rounded-xl px-3 py-2 text-xs text-[#18181B] font-bold tracking-wider focus:outline-none focus:border-[#5B3DF5]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[#18181B]">
                  {t?.deleteAccountPasswordLabel || 'Contraseña actual'}
                </label>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full bg-white border border-[#E5E0F5] rounded-xl px-3 py-2 text-xs text-[#18181B] focus:outline-none focus:border-[#5B3DF5]"
                />
              </div>

              {deleteError && (
                <p role="alert" className="text-[11px] font-bold text-red-700">
                  {deleteError}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCancelDeleteConfirm}
                  disabled={isDeletingAccount}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-[#E5E0F5] text-[#18181B] transition-all active:scale-95"
                >
                  {t?.cancelBtn || 'Cancelar'}
                </button>
                <button
                  type="submit"
                  disabled={!isDeleteWordMatched || !deletePassword || isDeletingAccount}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#18181B] hover:bg-[#27272A] disabled:bg-[#E5E0F5] disabled:text-[#6B7280]/60 text-white transition-all active:scale-95"
                >
                  {isDeletingAccount
                    ? t?.deletingAccountBtn || 'Eliminando...'
                    : t?.confirmDeleteAccountBtn || 'Eliminar definitivamente'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}