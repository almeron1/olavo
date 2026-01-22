
import React, { useState } from 'react';
import { SystemSettings } from '../types';

interface LiveProps {
  settings: SystemSettings;
  onBack: () => void;
}

const Live: React.FC<LiveProps> = ({ settings, onBack }) => {
  const [chatMessage, setChatMessage] = useState('');
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [messages, setMessages] = useState([
    { u: 'Mateus L.', m: 'O Prof. Ricardo é fera demais!', color: '#8E2DE2' },
    { u: 'Ana Clara', m: 'Essa parte cai muito no ENEM né?', color: '#00d2ff' },
    { u: 'Prof. Sandro', m: 'Foco total nessa cronologia, pessoal.', color: '#ff4b2b' },
    { u: 'Lucas E.', m: 'Consigo baixar esse slide dps?', color: '#f9d423' },
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    setMessages([{ u: 'Você', m: chatMessage, color: '#fff' }, ...messages]);
    setChatMessage('');
  };

  const toggleChat = () => setIsChatVisible(!isChatVisible);

  return (
    <div className="h-screen w-full bg-black flex flex-col md:flex-row overflow-hidden animate-fade-in relative">
      
      {/* Botão de Sair (X) - Fixo e Pequeno no Canto Direito Superior do Player */}
      <button 
        onClick={onBack}
        className="absolute top-4 right-4 z-[110] p-2.5 bg-black/60 hover:bg-red-600 backdrop-blur-xl border border-white/10 rounded-full transition-all group shadow-2xl active:scale-90"
        aria-label="Sair da Live"
      >
        <svg className="w-4 h-4 text-white group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Lado Esquerdo: Player de Vídeo */}
      <div className={`relative bg-black group transition-all duration-500 ease-in-out ${isChatVisible ? 'flex-[2] md:flex-[3]' : 'flex-1'}`}>
        <iframe 
          className="w-full h-full" 
          src={`${settings.liveYoutubeUrl}?autoplay=1&mute=0&controls=1&rel=0`} 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen
        ></iframe>

        {/* Overlay de Status (Canto Esquerdo) */}
        <div className="absolute top-4 left-4 flex items-center gap-2 z-20 pointer-events-none">
           <div className="bg-red-600 px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-lg">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
              <span className="text-[8px] font-black uppercase tracking-widest text-white">LIVE</span>
           </div>
           <div className="bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10">
              <span className="text-[8px] font-black uppercase tracking-widest text-white/70">3.8k</span>
           </div>
        </div>

        {/* Botão de Expansão/Toggle Chat (Mobile) */}
        <button 
          onClick={toggleChat}
          className="absolute bottom-6 right-6 z-40 p-3 bg-primary text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all md:hidden"
        >
          {isChatVisible ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          )}
        </button>

        {!isChatVisible && (
          <div className="absolute bottom-6 left-6 z-20 animate-fade-in hidden md:block">
            <h2 className="text-xl font-black uppercase italic tracking-tighter text-white">Revisão de Geopolítica</h2>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Prof. Pedro Ricardo</p>
          </div>
        )}
      </div>

      {/* Lado Direito: Chat */}
      <aside className={`transition-all duration-500 ease-in-out border-l border-white/5 bg-[#02040e] flex flex-col relative z-30 ${
        isChatVisible 
          ? 'h-[45vh] md:h-full md:flex-1' 
          : 'h-0 md:w-0 overflow-hidden border-none'
      }`}>
        <header className="p-6 border-b border-white/5 bg-black/20 hidden md:block">
           <div className="flex justify-between items-start">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">Aula de Hoje</h3>
                <h2 className="text-xl font-black uppercase italic tracking-tighter text-white">Revisão: Geopolítica</h2>
              </div>
              <button onClick={toggleChat} className="p-2 text-white/20 hover:text-white transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
           </div>
        </header>

        {/* Feed de Mensagens */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar flex flex-col-reverse">
           <div className="space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className="animate-fade-in flex gap-3">
                   <div className="w-1 h-6 rounded-full shrink-0" style={{ backgroundColor: msg.color }}></div>
                   <div className="flex-1 min-w-0">
                      <span className="text-[8px] font-black uppercase tracking-widest opacity-40 block mb-0.5">{msg.u}</span>
                      <p className="text-xs font-medium text-gray-200 leading-snug break-words">{msg.m}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Input de Chat */}
        <div className="p-4 md:p-6 bg-black/40 border-t border-white/5 pb-safe">
           <form onSubmit={handleSendMessage} className="relative">
              <input 
                type="text" 
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Comente na live..." 
                className="w-full bg-white/5 border border-white/10 p-3.5 md:p-4 rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all pr-12" 
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-primary p-2 hover:scale-110 transition-transform">
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              </button>
           </form>
        </div>
      </aside>

      {/* Floating Chat Button when chat is hidden (Desktop) */}
      {!isChatVisible && (
        <button 
          onClick={toggleChat}
          className="absolute right-6 bottom-6 z-50 p-4 bg-white/10 backdrop-blur-2xl border border-white/10 rounded-full text-white hover:bg-primary transition-all shadow-2xl hidden md:flex"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default Live;
