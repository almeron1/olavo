
import React, { useState, useRef, useEffect } from 'react';
import { Role } from '../types';

interface ForumsProps {
  onBack: () => void;
  userRole?: Role;
}

interface ExtendedMessage {
  id: string;
  userId: string;
  userName: string;
  userRole: Role;
  text: string;
  timestamp: string;
  type?: 'text' | 'image' | 'audio' | 'file';
  mediaUrl?: string;
  status?: 'sending' | 'delivered' | 'read';
  isEdited?: boolean;
  sentAtDate: number;
}

const CUSTOM_GROUPS = [
  { id: 'g1', title: 'Enem 2026', thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=200', unread: 2 },
  { id: 'g2', title: 'Dicas da Paty Má', thumbnail: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=200', unread: 0 },
  { id: 'g3', title: 'Intensivão Redação Prof. Danelize', thumbnail: 'https://images.unsplash.com/photo-1491841573634-28140fc7ced7?auto=format&fit=crop&q=80&w=200', unread: 5 }
];

const Forums: React.FC<ForumsProps> = ({ onBack, userRole }) => {
  const [selectedGroupId, setSelectedGroupId] = useState(CUSTOM_GROUPS[0].id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const activeAudio = useRef<HTMLAudioElement | null>(null);
  const isCanceledRef = useRef<boolean>(false);

  const isAdmin = userRole === Role.ADMIN;
  const selectedGroup = CUSTOM_GROUPS.find(c => c.id === selectedGroupId) || CUSTOM_GROUPS[0];

  const [messages, setMessages] = useState<ExtendedMessage[]>([
    { id: '1', userId: 'p1', userName: 'Prof. Danelize', userRole: Role.PROFESSOR, text: 'Pessoal, já viram o novo drop sobre coesão?', timestamp: '09:00', type: 'text', status: 'read', sentAtDate: Date.now() - 5000000 },
    { id: '2', userId: 'p2', userName: 'Prof. Raul', userRole: Role.PROFESSOR, text: 'Mandei uma lista de exercícios de física no material de apoio!', timestamp: '09:15', type: 'text', status: 'read', sentAtDate: Date.now() - 4000000 },
  ]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedGroupId]);

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    const newMessage: ExtendedMessage = {
      id: Date.now().toString(),
      userId: isAdmin ? 'admin' : 'u3',
      userName: isAdmin ? 'Administrador' : 'Lucas Estudante',
      userRole: isAdmin ? Role.ADMIN : Role.STUDENT,
      text: messageText,
      type: 'text',
      status: 'read',
      sentAtDate: Date.now(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMessage]);
    setMessageText('');
  };

  const handleDeleteMessage = (id: string) => {
    if (confirm('Admin: Apagar mensagem?')) {
       setMessages(prev => prev.filter(m => m.id !== id));
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      isCanceledRef.current = false;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        if (!isCanceledRef.current && audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(audioBlob);
          setMessages(prev => [...prev, { 
            id: Date.now().toString(), userId: isAdmin ? 'admin' : 'u3', userName: isAdmin ? 'Administrador' : 'Lucas', userRole: isAdmin ? Role.ADMIN : Role.STUDENT, 
            text: 'Mensagem de Voz', type: 'audio', mediaUrl: audioUrl, status: 'read', sentAtDate: Date.now(), 
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
          }]);
        }
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => setRecordingTime(p => p + 1), 1000);
    } catch (err) { alert('Erro ao acessar microfone'); }
  };

  const cancelRecording = () => {
    isCanceledRef.current = true;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const stopAndSendRecording = () => {
    isCanceledRef.current = false;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const toggleAudio = (id: string, url: string) => {
    if (currentlyPlaying === id) {
      activeAudio.current?.pause();
      setCurrentlyPlaying(null);
    } else {
      activeAudio.current?.pause();
      const audio = new Audio(url);
      activeAudio.current = audio;
      audio.onended = () => setCurrentlyPlaying(null);
      audio.play();
      setCurrentlyPlaying(id);
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#050811] md:bg-black/20">
      <header className="p-8 border-b border-white/5 flex items-center justify-between">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter">Canais</h2>
        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-white/40">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </header>
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {CUSTOM_GROUPS.map(group => (
          <button 
            key={group.id} 
            onClick={() => {
              setSelectedGroupId(group.id);
              setIsSidebarOpen(false);
            }} 
            className={`w-full p-6 flex items-center gap-4 border-b border-white/5 transition-all ${selectedGroupId === group.id ? 'bg-primary/10 border-r-4 border-r-primary' : 'hover:bg-white/5'}`}
          >
            <div className="relative">
              <img src={group.thumbnail} className="w-12 h-12 rounded-2xl object-cover border border-white/10" alt="" />
              {group.unread > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-[8px] font-black text-white px-1.5 py-0.5 rounded-full ring-2 ring-[#050811]">
                  {group.unread}
                </span>
              )}
            </div>
            <div className="flex-1 text-left">
              <h4 className="font-black uppercase italic text-[11px] leading-tight line-clamp-2">{group.title}</h4>
              <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest mt-1">Ativo agora</p>
            </div>
          </button>
        ))}
        {isAdmin && (
           <button className="w-full p-6 flex items-center justify-center gap-2 border-b border-white/5 text-primary hover:bg-white/5 transition-all">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              <span className="text-[10px] font-black uppercase tracking-widest">Novo Grupo</span>
           </button>
        )}
      </div>
      <div className="p-6 border-t border-white/5 mt-auto">
        <button className="w-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Ver todos os grupos</button>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex overflow-hidden bg-[#02040e] animate-fade-in relative">
      
      {/* Overlay e Sidebar Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      <aside className={`fixed inset-y-0 left-0 w-[280px] z-[210] transform transition-transform duration-500 ease-in-out md:relative md:translate-x-0 md:flex md:w-[350px] lg:w-[400px] border-r border-white/5 flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>

      {/* Área do Chat */}
      <section className="flex-1 flex flex-col relative bg-[#02040e]">
        <header className="relative z-10 p-4 md:p-5 pr-14 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Botão de Menu para Mobile */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" /></svg>
            </button>
            
            <img src={selectedGroup.thumbnail} className="w-10 h-10 rounded-xl object-cover border border-white/10" alt="" />
            <div>
              <h3 className="font-black italic uppercase text-xs md:text-sm leading-none truncate max-w-[150px] md:max-w-none">{selectedGroup.title}</h3>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
                <span className="text-[8px] text-primary font-bold uppercase tracking-widest">Chat Online</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pr-10 md:pr-12">
            <button className="hidden md:flex p-2.5 text-white/30 hover:text-white transition-all">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
            </button>
          </div>
        </header>
        
        {/* Botão de Sair (X) - Estilo Live */}
        <button 
          onClick={onBack}
          className="absolute top-4 right-4 z-[110] p-2 bg-black/60 hover:bg-red-600 backdrop-blur-xl border border-white/10 rounded-full transition-all group shadow-2xl active:scale-90"
        >
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Feed de Mensagens */}
        <div className="relative z-10 flex-1 overflow-y-auto p-4 md:p-8 space-y-6 hide-scrollbar flex flex-col bg-gradient-to-b from-transparent to-black/20">
          {messages.map((msg) => {
             const isMe = msg.userId === 'u3' || (isAdmin && msg.userId === 'admin');
             return (
              <div key={msg.id} className={`flex flex-col group/msg ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`relative max-w-[85%] md:max-w-[70%] p-4 rounded-2xl shadow-xl transition-all ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-white/5 text-white rounded-tl-none border border-white/5'}`}>
                  {isAdmin && (
                    <button onClick={() => handleDeleteMessage(msg.id)} className="absolute -top-3 -right-3 p-1 bg-red-500 rounded-full opacity-0 group-hover/msg:opacity-100 transition-opacity">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                  {!isMe && <p className="text-[8px] font-black uppercase tracking-widest text-primary mb-2">{msg.userName}</p>}
                  {msg.type === 'text' && <p className="text-sm font-medium leading-relaxed">{msg.text}</p>}
                  {msg.type === 'image' && <img src={msg.mediaUrl} className="max-w-full rounded-lg border border-white/10" alt="" />}
                  {msg.type === 'audio' && (
                    <div className="flex items-center gap-4 min-w-[180px]">
                      <button onClick={() => toggleAudio(msg.id, msg.mediaUrl!)} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-all">
                        {currentlyPlaying === msg.id ? <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
                      </button>
                      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                         <div className={`h-full bg-white transition-all duration-300 ${currentlyPlaying === msg.id ? 'w-1/2' : 'w-0'}`}></div>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end mt-1"><span className="text-[8px] font-bold opacity-40">{msg.timestamp}</span></div>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Footer com Input */}
        <footer className="relative z-20 p-4 md:p-6 bg-black/60 backdrop-blur-3xl border-t border-white/5 pb-safe">
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            {!isRecording ? (
              <>
                <button onClick={() => setShowCamera(true)} className="p-2.5 text-white/30 hover:text-white transition-all rounded-full hover:bg-white/5 shrink-0">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                </button>
                
                <input 
                  type="text" value={messageText} onChange={(e) => setMessageText(e.target.value)} 
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Mensagem..."
                  className="flex-1 bg-white/5 border border-white/10 p-3.5 rounded-2xl text-[13px] font-bold outline-none focus:border-primary transition-all" 
                />
                
                {messageText ? (
                  <button onClick={handleSendMessage} className="bg-primary p-3.5 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                  </button>
                ) : (
                  <button onClick={startRecording} className="bg-white/5 p-3.5 rounded-2xl text-white/40 hover:bg-primary hover:text-white transition-all shrink-0">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                  </button>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-between bg-primary/10 border border-primary/20 p-2 rounded-2xl animate-fade-in">
                <div className="flex items-center gap-3 ml-4">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Gravando {recordingTime}s</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={cancelRecording} className="p-3 text-white/40 hover:text-red-500 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg></button>
                  <button onClick={stopAndSendRecording} className="bg-primary text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg">Enviar</button>
                </div>
              </div>
            )}
          </div>
        </footer>
      </section>

      {/* Overlay de Câmera */}
      {showCamera && (
        <div className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center p-4">
           <video ref={videoRef} autoPlay playsInline className="w-full max-w-lg rounded-3xl border border-white/10" />
           <div className="flex gap-8 mt-12">
              <button onClick={() => setShowCamera(false)} className="bg-white/10 p-5 rounded-full text-white">X</button>
              <button onClick={() => {
                const canvas = document.createElement('canvas');
                canvas.width = videoRef.current!.videoWidth;
                canvas.height = videoRef.current!.videoHeight;
                canvas.getContext('2d')?.drawImage(videoRef.current!, 0, 0);
                setMessages(prev => [...prev, { id: Date.now().toString(), userId: isAdmin ? 'admin' : 'u3', userName: isAdmin ? 'Administrador' : 'Lucas', userRole: isAdmin ? Role.ADMIN : Role.STUDENT, text: 'Foto', type: 'image', mediaUrl: canvas.toDataURL(), status: 'read', sentAtDate: Date.now(), timestamp: 'Agora' }]);
                setShowCamera(false);
              }} className="bg-white p-8 rounded-full shadow-2xl"><div className="w-6 h-6 border-4 border-primary rounded-full"></div></button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Forums;
