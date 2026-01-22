
import React, { useMemo, useState } from 'react';
import { User, Course, Role, SystemNotification, NotificationInteraction } from '../types';

interface DashboardProfessorProps {
  user: User;
  courses: Course[];
  onSelectCourse: (courseId: string, lessonId?: string) => void;
  onNavigate: (page: string) => void;
  notifications?: SystemNotification[];
  onInteractNotification?: (id: string, interaction: NotificationInteraction) => void;
}

const DashboardProfessor: React.FC<DashboardProfessorProps> = ({ user, courses, onSelectCourse, onNavigate, notifications = [], onInteractNotification }) => {
  const [replyText, setReplyText] = useState<{[key: string]: string}>({});
  const [showReplyInput, setShowReplyInput] = useState<{[key: string]: boolean}>({});

  const myCourses = courses.filter(c => c.professorId.toLowerCase() === user.name.split(' ')[1].toLowerCase() || courses.indexOf(c) < 5);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  const recentComments = [
    { id: 'c1', student: 'Ana Clara', lesson: 'Estrutura Diamante', text: 'Não entendi a parte da tese...', time: '5m atrás', lessonId: 'l-c1-1', courseId: 'c1' },
    { id: 'c2', student: 'Mateus Lima', lesson: 'Coesão e Coerência', text: 'Excelente aula, professor!', time: '12m atrás', lessonId: 'l-r2-2', courseId: 'r2' }
  ];

  // Filter notifications relevant to this user
  const myNotifications = notifications.filter(n => {
      if (n.targetType === 'ALL') return true;
      if (n.targetType === 'PROFESSORS') return true;
      if (n.targetType === 'SPECIFIC' && n.targetUserId === user.id) return true;
      return false;
  }).filter(n => {
      // Filter out deleted by this user locally? Or keep distinct?
      // Assuming "Delete" hides it from view:
      const hasDeleted = n.interactions.some(i => i.userId === user.id && i.action === 'DELETE');
      return !hasDeleted;
  });

  const handleAction = (notifId: string, action: 'ACKNOWLEDGE' | 'PIN' | 'DELETE' | 'REPLY') => {
      if (action === 'REPLY') {
          // Toggle reply input
          setShowReplyInput(prev => ({...prev, [notifId]: !prev[notifId]}));
          return;
      }

      if (onInteractNotification) {
          const interaction: NotificationInteraction = {
              userId: user.id,
              userName: user.name,
              userRole: user.role,
              action: action,
              timestamp: new Date().toLocaleString()
          };
          onInteractNotification(notifId, interaction);
      }
  };

  const submitReply = (notifId: string) => {
      if (!replyText[notifId] || !onInteractNotification) return;
      
      const interaction: NotificationInteraction = {
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          action: 'REPLY',
          content: replyText[notifId],
          timestamp: new Date().toLocaleString()
      };
      onInteractNotification(notifId, interaction);
      setReplyText(prev => ({...prev, [notifId]: ''}));
      setShowReplyInput(prev => ({...prev, [notifId]: false}));
      alert("Resposta enviada à coordenação.");
  };

  return (
    <div className="p-6 md:p-12 animate-fade-in pb-32 space-y-12 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <p className="text-primary text-[10px] font-black uppercase tracking-[0.4em]">Plataforma Docente</p>
          <h1 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.85]">
            {greeting},<br/><span className="text-white/20">{user.name.split(' ')[1]}</span>
          </h1>
        </div>
        <div className="flex gap-4">
           <button 
            onClick={() => onNavigate('forums')}
            className="group bg-white/5 border border-white/10 p-6 rounded-[35px] text-center min-w-[140px] hover:border-primary transition-all active:scale-95 shadow-xl"
           >
              <p className="text-[28px] font-black text-primary italic leading-none">12</p>
              <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mt-2 group-hover:text-white">Dúvidas Fórum</p>
           </button>
           <div className="bg-white/5 border border-white/10 p-6 rounded-[35px] text-center min-w-[140px]">
              <p className="text-[28px] font-black text-white italic leading-none">1.2k</p>
              <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mt-2">Seus Alunos</p>
           </div>
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-12">
          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 flex items-center gap-4">
              Disciplinas sob sua Gestão
              <div className="flex-1 h-px bg-white/5"></div>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myCourses.map(course => (
                <div 
                  key={course.id} 
                  onClick={() => onSelectCourse(course.id)}
                  className="group p-5 bg-white/5 border border-white/5 rounded-[30px] flex items-center gap-5 hover:bg-white/10 transition-all cursor-pointer border-l-4 border-l-transparent hover:border-l-primary"
                >
                  <img src={course.thumbnail} className="w-16 h-16 object-cover rounded-2xl border border-white/10" alt="" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black uppercase italic text-sm group-hover:text-primary transition-colors truncate">{course.title}</h4>
                    <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-1">Grade Curricular</p>
                  </div>
                  <svg className="w-4 h-4 text-white/10 group-hover:text-white transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 flex items-center gap-4">
              Interações nas suas aulas
              <div className="flex-1 h-px bg-white/5"></div>
            </h3>
            <div className="space-y-3">
               {recentComments.map(comment => (
                 <div 
                    key={comment.id}
                    className="p-6 bg-white/5 border border-white/5 rounded-[30px] flex items-start gap-4 group hover:bg-white/10 transition-all cursor-pointer"
                    onClick={() => onSelectCourse(comment.courseId, comment.lessonId)}
                 >
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-black text-primary text-[10px] uppercase">{comment.student[0]}</div>
                    <div className="flex-1">
                       <div className="flex justify-between items-start mb-1">
                          <p className="text-[11px] font-black uppercase italic">{comment.student}</p>
                          <span className="text-[8px] font-bold text-white/20 uppercase">{comment.time}</span>
                       </div>
                       <p className="text-xs text-white/60 font-medium line-clamp-1 mb-2">"{comment.text}"</p>
                       <p className="text-[8px] font-black uppercase text-primary tracking-widest">Ir para Aula: {comment.lesson}</p>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">Área Criativa</h3>
            <button onClick={() => onNavigate('drops')} className="w-full group p-8 bg-primary text-black rounded-[35px] font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl hover:scale-[1.02] transition-all flex flex-col items-center gap-4">
               <div className="p-3 bg-black/10 rounded-full group-hover:bg-black/20 transition-all">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
               </div>
               Criar Novo Drop Educativo
            </button>
            <button onClick={() => onNavigate('forums')} className="w-full p-8 bg-white/5 border border-white/10 text-white rounded-[35px] font-black uppercase text-[11px] tracking-[0.2em] hover:bg-white/10 transition-all flex flex-col items-center gap-4">
               <div className="p-3 bg-white/5 rounded-full">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
               </div>
               Meus Grupos de Apoio
            </button>
          </div>

          <div className="bg-black/40 border border-white/5 rounded-[40px] overflow-hidden relative group flex flex-col">
             <div className="p-8 pb-4">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-all pointer-events-none">
                    <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 3.45l8.1 14.1H3.9L12 5.45z"/></svg>
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 mb-6">
                    <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                    Quadro de Avisos ({myNotifications.length})
                </h4>
                
                {myNotifications.length === 0 && (
                    <p className="text-xs text-white/20 font-medium italic text-center py-4">Nenhum aviso pendente.</p>
                )}
             </div>

             <div className="flex-1 overflow-y-auto max-h-[400px] px-8 pb-8 space-y-6 custom-scrollbar">
                {myNotifications.map(notif => {
                    const isPinned = notif.interactions.some(i => i.userId === user.id && i.action === 'PIN');
                    const isAck = notif.interactions.some(i => i.userId === user.id && i.action === 'ACKNOWLEDGE');

                    return (
                        <div key={notif.id} className={`space-y-3 transition-all ${isPinned ? 'order-first' : ''} ${isAck ? 'opacity-50' : ''}`}>
                            <p className="text-xs text-gray-400 font-medium leading-relaxed italic border-l-2 border-primary/20 pl-4">
                                "{notif.message}"
                            </p>
                            <div className="flex justify-between items-center pl-4">
                                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">— {notif.author}</p>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleAction(notif.id, 'ACKNOWLEDGE')} 
                                        title="Ciente"
                                        className={`p-1.5 rounded-lg transition-all ${isAck ? 'bg-green-500 text-white' : 'bg-white/5 text-white/30 hover:bg-green-500/20 hover:text-green-500'}`}
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    </button>
                                    <button 
                                        onClick={() => handleAction(notif.id, 'PIN')} 
                                        title="Fixar"
                                        className={`p-1.5 rounded-lg transition-all ${isPinned ? 'bg-yellow-500 text-white' : 'bg-white/5 text-white/30 hover:bg-yellow-500/20 hover:text-yellow-500'}`}
                                    >
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                                    </button>
                                    <button 
                                        onClick={() => handleAction(notif.id, 'REPLY')} 
                                        title="Responder"
                                        className="p-1.5 bg-white/5 rounded-lg text-white/30 hover:bg-blue-500/20 hover:text-blue-500 transition-all"
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                    </button>
                                    <button 
                                        onClick={() => handleAction(notif.id, 'DELETE')} 
                                        title="Excluir"
                                        className="p-1.5 bg-white/5 rounded-lg text-white/30 hover:bg-red-500/20 hover:text-red-500 transition-all"
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            </div>
                            
                            {showReplyInput[notif.id] && (
                                <div className="pl-4 mt-2 flex gap-2">
                                    <input 
                                        type="text" 
                                        value={replyText[notif.id] || ''} 
                                        onChange={(e) => setReplyText(prev => ({...prev, [notif.id]: e.target.value}))}
                                        placeholder="Sua resposta..." 
                                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-[10px] text-white focus:border-primary outline-none"
                                    />
                                    <button onClick={() => submitReply(notif.id)} className="bg-primary text-black px-3 py-1 rounded-lg text-[9px] font-black uppercase">Envar</button>
                                </div>
                            )}
                        </div>
                    );
                })}
             </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardProfessor;
