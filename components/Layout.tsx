
import React, { useState, useMemo } from 'react';
import { Role, User, SystemSettings, SystemNotification } from '../types';

interface LayoutProps {
  role: Role;
  currentPage: string;
  onNavigate: (page: string) => void;
  user: User | null;
  onLogout: () => void;
  settings: SystemSettings;
  children: React.ReactNode;
  isInPlayer?: boolean;
  systemNotifications?: SystemNotification[];
}

interface Notification {
  id: string | number;
  text: string;
  time: string;
  type: string;
  isRead: boolean;
  author?: string;
}

const Layout: React.FC<LayoutProps> = ({ role, currentPage, onNavigate, user, onLogout, settings, children, isInPlayer = false, systemNotifications = [] }) => {
  const isLoginPage = !user || currentPage === 'login';
  const isAdmin = role === Role.ADMIN;
  
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Local state to track system notifications interactions (since we don't have a backend for read/deleted status per user)
  const [hiddenSystemIds, setHiddenSystemIds] = useState<string[]>([]);
  const [readSystemIds, setReadSystemIds] = useState<string[]>([]);

  // Local state for "fake" notifications
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([
    { id: 1, text: "Ana Clara comentou em 'Estrutura Diamante'", time: "5 min", type: "comment", isRead: false },
    { id: 2, text: "Nova dúvida no fórum: Enem 2026", time: "12 min", type: "forum", isRead: true },
  ]);

  // Merge System Notifications relevant to the user
  const relevantNotifications = useMemo(() => {
    if (!user) return localNotifications;

    const systemMapped = systemNotifications.filter(n => {
       // Filter by target
       if (n.targetType === 'ALL') return true;
       if (n.targetType === 'SPECIFIC' && n.targetUserId === user.id) return true;
       return false;
    })
    .filter(n => !hiddenSystemIds.includes(n.id)) // Filter out locally deleted ones
    .map(n => ({
       id: n.id,
       text: n.message,
       time: n.sentAt,
       type: 'system',
       isRead: readSystemIds.includes(n.id), // Check local read state
       author: n.author
    }));

    // Combine and sort by "time" (simplified here, putting system first or maintaining order)
    return [...systemMapped, ...localNotifications];
  }, [systemNotifications, localNotifications, user, hiddenSystemIds, readSystemIds]);

  const unreadCount = relevantNotifications.filter(n => !n.isRead).length;

  const clearAllNotifications = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalNotifications([]);
    // For system notifications, we "hide" all current ones
    const currentSystemIds = systemNotifications.map(n => n.id);
    setHiddenSystemIds(prev => [...new Set([...prev, ...currentSystemIds])]);
  };

  const removeNotification = (id: string | number, type: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (type === 'system') {
        setHiddenSystemIds(prev => [...prev, String(id)]);
    } else {
        setLocalNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const markAsRead = (id: string | number, type: string) => {
      if (type === 'system') {
          if (!readSystemIds.includes(String(id))) {
              setReadSystemIds(prev => [...prev, String(id)]);
          }
      } else {
          setLocalNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
  };

  const getNavItems = () => {
    if (role === Role.ADMIN) {
      return {
        mobile: [], 
        desktop: [
          { id: 'admin-dashboard', label: 'Visão Geral', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
          { id: 'admin-courses', label: 'Cursos', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
          { id: 'admin-users', label: 'Base Usuários', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
          { id: 'admin-professors', label: 'Professores', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
          { id: 'admin-students', label: 'Cadastro Alunos', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
          { id: 'admin-cms', label: 'CMS', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
          { id: 'admin-contracts', label: 'Contratos', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
          { id: 'admin-notifications', label: 'Notificações', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
          { id: 'drops', label: 'Drops', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
          { id: 'forums', label: 'Fóruns', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
        ]
      };
    }

    // Default for Student and Professor
    const common = [
      { id: 'home', label: 'Início', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
      { id: 'live', label: 'Ao Vivo', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
      { id: 'drops', label: 'Drops', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
      { id: 'forums', label: 'Fóruns', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    ];
    return { mobile: common, desktop: common };
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen text-white bg-[#02040e]">
      <style>{`
        :root { --primary: ${settings.primaryColor}; }
        .bg-primary { background-color: var(--primary); }
        .text-primary { color: var(--primary); }
        .border-primary { border-color: var(--primary); }
      `}</style>

      {!isLoginPage && !isInPlayer && (
        <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-[80px] sidebar-blur border-r border-white/5 z-[100] items-center py-10">
          <div className="mb-10 text-primary">
             <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 3.45l8.1 14.1H3.9L12 5.45z"/></svg>
          </div>
          <div className="flex-1 flex flex-col justify-center gap-8">
            {navItems.desktop.map(item => (
              <button 
                key={item.id} 
                onClick={() => onNavigate(item.id)}
                className={`p-3.5 rounded-full transition-all group relative flex items-center justify-center ${
                  currentPage === item.id ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'text-gray-500 hover:text-white hover:bg-white/10'
                }`}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                <span className="absolute left-20 bg-white text-black text-[10px] font-black px-3 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-all shadow-2xl z-50 uppercase tracking-widest pointer-events-none whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-6 items-center">
            {/* NOTIFICATIONS - HIDDEN FOR ADMIN */}
            {!isAdmin && (
              <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className={`p-3 transition-all relative ${showNotifications ? 'text-primary' : 'text-gray-500 hover:text-white'}`}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  {unreadCount > 0 && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full border-2 border-[#02040e]"></div>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute bottom-0 left-16 bg-[#0a1024] border border-white/10 rounded-2xl shadow-2xl w-80 animate-fade-in backdrop-blur-3xl z-[200] overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/5 bg-black/40 flex justify-between items-center">
                        <div>
                          <p className="text-[10px] font-black uppercase text-primary tracking-widest leading-none">Notificações</p>
                          <p className="text-[8px] font-bold text-white/30 uppercase tracking-tighter mt-1">{unreadCount} pendentes</p>
                        </div>
                        <button onClick={clearAllNotifications} className="text-[8px] font-black text-white/40 hover:text-red-500 uppercase tracking-widest transition-all">Limpar Tudo</button>
                    </div>
                    <div className="max-h-80 overflow-y-auto hide-scrollbar">
                        {relevantNotifications.length > 0 ? (
                          relevantNotifications.map((n, idx) => (
                            <div 
                              key={idx} 
                              onClick={() => markAsRead(n.id, n.type)}
                              className={`group px-5 py-4 border-b border-white/5 transition-all relative cursor-pointer ${n.isRead ? 'opacity-40 grayscale-[0.3]' : 'bg-white/5 hover:bg-white/10'}`}
                            >
                              <div className="flex justify-between items-start gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        {n.type === 'system' && <span className="bg-primary text-black text-[6px] font-black uppercase px-1 rounded">Admin</span>}
                                        {!n.isRead && <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>}
                                        <p className={`text-[11px] font-medium leading-tight truncate ${n.isRead ? 'text-white/60' : 'text-white'}`}>{n.text}</p>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-[8px] font-black uppercase text-white/20">{n.time}</p>
                                        {n.author && <p className="text-[7px] font-bold uppercase text-white/30">{n.author}</p>}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                      <button 
                                          onClick={(e) => removeNotification(n.id, n.type, e)}
                                          className="p-1.5 hover:bg-red-500/20 rounded-lg text-white/20 hover:text-red-500 transition-all"
                                          title="Excluir"
                                      >
                                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                      </button>
                                  </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-12 px-6 text-center space-y-3">
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/10">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Nada por aqui no momento</p>
                          </div>
                        )}
                    </div>
                    <button onClick={() => setShowNotifications(false)} className="w-full py-4 text-[8px] font-black uppercase text-white/40 hover:text-white transition-all bg-black/20 border-t border-white/5">Fechar Painel</button>
                  </div>
                )}
              </div>
            )}

            <div className="relative">
               <button onClick={() => setShowLogoutMenu(!showLogoutMenu)} className="w-12 h-12 rounded-full border-2 border-white/10 overflow-hidden shadow-lg hover:border-white transition-all">
                  <img src={user?.avatar} className="w-full h-full object-cover" alt="" />
               </button>
               {showLogoutMenu && (
                 <div className="absolute bottom-0 left-16 bg-[#0a1024] border border-white/10 rounded-2xl shadow-2xl py-2 w-48 animate-fade-in backdrop-blur-3xl z-[200]">
                    <div className="px-5 py-3 border-b border-white/5">
                       <p className="text-[10px] font-black uppercase text-primary tracking-widest">{user?.role}</p>
                       <p className="text-[11px] font-bold text-white truncate">{user?.name}</p>
                    </div>
                    <button onClick={() => { onNavigate('profile'); setShowLogoutMenu(false); }} className="w-full text-left px-5 py-3 text-xs font-bold hover:bg-white/5 uppercase tracking-widest transition-all">Meu Perfil</button>
                    <button onClick={onLogout} className="w-full text-left px-5 py-3 text-xs font-black text-red-500 hover:bg-red-500/10 uppercase tracking-widest border-t border-white/5 transition-all">Sair da Conta</button>
                 </div>
               )}
            </div>
          </div>
        </aside>
      )}

      <main className={`${!isLoginPage && !isInPlayer ? 'md:pl-[80px]' : ''} min-h-screen pb-safe`}>
        {children}
      </main>

      {!isLoginPage && !isInPlayer && navItems.mobile.length > 0 && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 sidebar-blur border-t border-white/10 flex justify-around items-center px-4 z-[100] pb-safe">
          {navItems.mobile.map(item => (
            <button key={item.id} onClick={() => onNavigate(item.id)} className={`flex flex-col items-center gap-1 p-2 transition-all active:scale-90 ${currentPage === item.id ? 'text-white' : 'text-gray-500'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={item.icon} /></svg>
              <span className={`text-[8px] font-black uppercase tracking-widest ${currentPage === item.id ? 'opacity-100' : 'opacity-40'}`}>{item.label}</span>
            </button>
          ))}
          <button onClick={() => onNavigate('profile')} className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all active:scale-90 ${currentPage === 'profile' ? 'border-primary' : 'border-white/20'}`}>
             <img src={user?.avatar} className="w-full h-full object-cover" alt="" />
          </button>
        </nav>
      )}
    </div>
  );
};

export default Layout;
