import { Compass, Heart, MessageSquare, Plus, User } from 'lucide-react';

export default function NavbarInferior({
  activeTab,
  setActiveTab,
  proposals = [],
  isLoggedIn = false,
  currentUserId,
  t,
}) {
  const safeProposals = isLoggedIn && Array.isArray(proposals) ? proposals : [];
  const unreadCount = safeProposals.filter((proposal) => {
    if (!proposal) return false;
    if (proposal.hiddenBy?.[currentUserId]) return false;
    if (proposal.readBy && currentUserId) {
      return proposal.readBy[currentUserId] !== true;
    }
    return !proposal.read;
  }).length;

  const badgeText = unreadCount > 99 ? '99+' : unreadCount > 0 ? String(unreadCount) : null;

  const navItems = [
    { id: 'explore', label: t?.explore || 'Explorar', icon: Compass },
    { id: 'favorites', label: t?.favorites || 'Favoritos', icon: Heart },
    { id: 'publish', label: t?.publish || 'Publicar', icon: Plus, isCenter: true },
    {
      id: 'messages',
      label: t?.messages || 'Mensajes',
      icon: MessageSquare,
      badge: badgeText,
    },
    { id: 'profile', label: t?.profile || 'Perfil', icon: User },
  ];

  return (
    <nav
      aria-label={t?.bottomNavLabel || 'Navegación principal'}
      className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xs border-[#E5E0F5] shadow-lg border-t pt-2 pb-2.5 px-2 sm:px-4 z-40 max-w-lg mx-auto sm:rounded-t-3xl transition-colors duration-200"
    >
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (item.isCenter) {
            return (
              <div key={item.id} className="relative flex items-center justify-center px-1">
                <button
                  type="button"
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setActiveTab && setActiveTab(item.id)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md transition-all duration-200 active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B3DF5] focus-visible:ring-offset-2 ${
                    isActive
                      ? 'bg-[#5B3DF5] hover:bg-[#482BD9] scale-105 ring-2 ring-[#FFD43B]'
                      : 'bg-[#18181B] hover:bg-[#5B3DF5]'
                  }`}
                >
                  <Plus className="w-6 h-6 stroke-[2.25]" />
                </button>
              </div>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => setActiveTab && setActiveTab(item.id)}
              className={`relative flex flex-col items-center gap-1 py-1 px-2.5 sm:px-3 rounded-2xl transition-all duration-200 active:scale-90 focus:outline-none ${
                isActive
                  ? 'text-[#5B3DF5] font-bold'
                  : 'text-[#6B7280] font-medium hover:text-[#18181B]'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'stroke-[2.25] scale-105' : 'stroke-[1.75]'
                  }`}
                />

                {/* CONTADOR DE NOTIFICACIÓN */}
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2.5 bg-[#FFD43B] text-[#18181B] border-white font-black text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center border-2 shadow-2xs leading-none animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] tracking-tight truncate max-w-16">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}