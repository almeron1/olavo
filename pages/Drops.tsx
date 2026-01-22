
import React, { useState, useRef, useEffect } from 'react';
import { Drop, Role } from '../types';

const INITIAL_DROPS_DATA: Drop[] = [
  { 
    id: 'd1', 
    professorName: 'Prof. Danelize', 
    courseName: 'Redação Estratégica', 
    likes: 24500, 
    description: 'A técnica do "Gancho" na introdução. Como prender o corretor nos primeiros 30 segundos! ✍️🔥', 
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-writing-a-letter-on-a-wooden-table-42861-large.mp4' 
  },
  { 
    id: 'd2', 
    professorName: 'Prof. Raul', 
    courseName: 'Física Avançada', 
    likes: 18200, 
    description: 'Entenda a Refração da Luz de um jeito que você nunca mais vai esquecer. O arco-íris explicado! 🌈✨', 
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hand-holding-a-prism-and-creating-a-rainbow-42838-large.mp4' 
  },
];

interface DropsProps {
  userRole?: Role;
  onBack?: () => void;
}

const Drops: React.FC<DropsProps> = ({ userRole, onBack }) => {
  const [drops, setDrops] = useState<Drop[]>(INITIAL_DROPS_DATA);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [step, setStep] = useState<'capture' | 'info'>('capture');
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const [dropTitle, setDropTitle] = useState('');
  const [dropDesc, setDropDesc] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isProfessor = userRole === Role.PROFESSOR;
  const isAdmin = userRole === Role.ADMIN;
  const canCreate = isProfessor || isAdmin;

  const handleScroll = () => {
    if (containerRef.current) {
      const index = Math.round(containerRef.current.scrollTop / window.innerHeight);
      if (index !== activeIndex) setActiveIndex(index);
    }
  };

  const startCamera = async () => {
    try {
      if (streamRef.current) stopCamera();
      // Solicita câmera priorizando resolução vertical
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1080 }, 
          height: { ideal: 1920 }, 
          facingMode: 'user' 
        }, 
        audio: true 
      });
      streamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setRecordedVideoUrl(url);
      stopCamera();
    }
  };

  const handlePublish = () => {
    if (!recordedVideoUrl || !dropTitle) return;
    const newDrop: Drop = {
      id: `d-${Date.now()}`,
      professorName: isProfessor ? 'Prof. Danelize' : 'Administração',
      courseName: dropTitle,
      likes: 0,
      description: dropDesc,
      videoUrl: recordedVideoUrl
    };
    setDrops([newDrop, ...drops]);
    closeCreateModal();
    setTimeout(() => {
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleDeleteDrop = (id: string) => {
    if (confirm('Tem certeza que deseja remover este drop?')) {
      setDrops(prev => prev.filter(d => d.id !== id));
    }
  };

  const closeCreateModal = () => {
    setShowCreate(false);
    setStep('capture');
    setRecordedVideoUrl(null);
    setIsRecording(false);
    setDropTitle('');
    setDropDesc('');
    stopCamera();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (showCreate && step === 'capture' && !recordedVideoUrl) {
      startCamera();
    }
    return () => stopCamera();
  }, [showCreate, step, recordedVideoUrl]);

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden">
      {/* Botão de Fechar (X) para sair do Drops */}
      <button 
        onClick={onBack}
        className="fixed top-8 right-8 z-[110] p-4 bg-black/60 hover:bg-red-600 backdrop-blur-2xl border border-white/10 rounded-full transition-all group shadow-2xl active:scale-90"
        aria-label="Voltar para Home"
      >
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {canCreate && (
        <button 
          onClick={() => setShowCreate(true)}
          className="fixed top-8 left-8 z-50 bg-primary text-white px-8 py-4 rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl flex items-center gap-3 active:scale-95 transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Novo Drop
        </button>
      )}

      {/* FEED DE DROPS */}
      <div ref={containerRef} onScroll={handleScroll} className="h-screen w-full overflow-y-scroll snap-y snap-mandatory hide-scrollbar">
        {drops.map((drop, i) => (
          <section key={drop.id} className="h-screen w-full snap-start relative flex items-center justify-center overflow-hidden">
            <video 
              src={drop.videoUrl} 
              loop 
              muted={i !== activeIndex} 
              autoPlay 
              playsInline 
              className={`h-full w-full object-cover transition-opacity duration-700 ${i === activeIndex ? 'opacity-100' : 'opacity-40'}`} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-black/40"></div>
            
            {/* ADMIN ACTIONS */}
            {isAdmin && (
               <div className="absolute top-24 left-8 z-50">
                  <button onClick={() => handleDeleteDrop(drop.id)} className="bg-red-500/80 hover:bg-red-600 text-white p-3 rounded-full backdrop-blur-md shadow-xl transition-all">
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
               </div>
            )}

            <div className="absolute bottom-24 left-6 right-20 space-y-4 pointer-events-none">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center font-black text-white shadow-xl italic uppercase">{drop.professorName[0]}</div>
                <div>
                  <h4 className="font-black text-lg uppercase italic text-white">{drop.professorName}</h4>
                  <p className="text-[10px] font-black uppercase text-primary tracking-widest">{drop.courseName}</p>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-200 max-w-sm drop-shadow-lg">{drop.description}</p>
            </div>
          </section>
        ))}
      </div>

      {/* MODAL DE CRIAÇÃO */}
      {showCreate && (
        <div className="fixed inset-0 z-[200] bg-black animate-fade-in flex flex-col">
          {step === 'capture' ? (
            <div className="relative flex-1 w-full flex flex-col items-center justify-center overflow-hidden">
              {recordedVideoUrl ? (
                <video src={recordedVideoUrl} autoPlay loop playsInline className="h-full w-full object-cover bg-black" />
              ) : (
                <video 
                  ref={videoPreviewRef} 
                  autoPlay 
                  muted 
                  playsInline 
                  className="h-full w-full object-cover scale-x-[-1] bg-black" 
                />
              )}
              
              <div className="absolute inset-0 flex flex-col justify-between p-6 pb-20 z-10">
                <header className="flex justify-between items-center">
                  <button onClick={closeCreateModal} className="p-4 bg-black/60 rounded-full text-white backdrop-blur-xl border border-white/10 shadow-2xl">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  {recordedVideoUrl && (
                    <button onClick={() => setRecordedVideoUrl(null)} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest text-white border border-white/10 backdrop-blur-xl transition-all">
                      Descartar
                    </button>
                  )}
                </header>
                <div className="flex flex-col items-center gap-6">
                  {!recordedVideoUrl ? (
                    <div className="flex items-center gap-12">
                      <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-2">
                        <div className="w-14 h-14 rounded-2xl border-2 border-white/40 flex items-center justify-center bg-black/40">
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h14a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Galeria</span>
                        <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileUpload} />
                      </button>
                      <button 
                        onClick={() => {
                          if (isRecording) {
                            if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
                            setIsRecording(false);
                            if (timerRef.current) clearInterval(timerRef.current);
                          } else {
                            const chunks: Blob[] = [];
                            const recorder = new MediaRecorder(streamRef.current!);
                            mediaRecorderRef.current = recorder;
                            recorder.ondataavailable = (e) => chunks.push(e.data);
                            recorder.onstop = () => {
                              setRecordedVideoUrl(URL.createObjectURL(new Blob(chunks, { type: 'video/mp4' })));
                              stopCamera();
                            };
                            recorder.start();
                            setIsRecording(true);
                            setRecordingTime(0);
                            timerRef.current = window.setInterval(() => setRecordingTime(p => p + 1), 1000);
                          }
                        }}
                        className={`w-24 h-24 rounded-full border-[6px] flex items-center justify-center transition-all ${isRecording ? 'border-red-600 scale-110' : 'border-white'}`}
                      >
                        <div className={`transition-all ${isRecording ? 'w-10 h-10 bg-red-600 rounded-xl' : 'w-16 h-16 bg-white rounded-full'}`}></div>
                      </button>
                      <div className="w-14"></div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setStep('info')}
                      className="flex items-center gap-4 bg-primary text-white pl-10 pr-8 py-5 rounded-full font-black uppercase text-[12px] tracking-[0.2em] shadow-[0_0_40px_rgba(234,179,8,0.5)] animate-fade-in hover:scale-105 active:scale-95 transition-all"
                    >
                      Próximo Passo
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full w-full flex flex-col md:flex-row bg-[#02040e] overflow-hidden animate-fade-in">
              <div className="flex-[1.2] bg-black relative border-r border-white/5 flex items-center justify-center">
                <video src={recordedVideoUrl!} autoPlay loop playsInline className="h-full w-full object-cover" />
                <div className="absolute top-8 left-8">
                  <button onClick={() => setStep('capture')} className="px-6 py-4 bg-black/60 rounded-full text-white text-[10px] font-black uppercase tracking-widest backdrop-blur-3xl border border-white/10 flex items-center gap-3 hover:bg-black transition-all">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    Voltar à edição
                  </button>
                </div>
              </div>
              <div className="flex-1 p-8 md:p-16 flex flex-col justify-between overflow-y-auto bg-[#050811] shadow-2xl">
                <div className="space-y-12">
                  <header>
                    <p className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-4">Informações do Drop</p>
                    <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">Últimos<br/><span className="text-white/20">Ajustes</span></h2>
                  </header>
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 ml-2">Título do Drop</label>
                      <input 
                        type="text" 
                        value={dropTitle}
                        onChange={(e) => setDropTitle(e.target.value)}
                        placeholder="Ex: Sacada sobre Repertório" 
                        className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl text-white font-bold outline-none focus:border-primary transition-all text-lg placeholder:text-white/10" 
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 ml-2">Descrição Curta</label>
                      <textarea 
                        value={dropDesc}
                        onChange={(e) => setDropDesc(e.target.value)}
                        placeholder="O que os alunos vão aprender?" 
                        className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl text-white font-bold outline-none focus:border-primary transition-all h-40 resize-none placeholder:text-white/10" 
                      />
                    </div>
                  </div>
                </div>
                <div className="pt-12 flex flex-col gap-4">
                  <button 
                    onClick={handlePublish}
                    disabled={!dropTitle}
                    className="w-full bg-primary text-white py-6 rounded-[35px] font-black uppercase text-xs tracking-[0.2em] shadow-[0_20px_40px_rgba(234,179,8,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20 disabled:grayscale"
                  >
                    Publicar Agora na Trilha
                  </button>
                  <button onClick={closeCreateModal} className="w-full py-4 text-white/20 hover:text-white font-black uppercase text-[10px] tracking-widest transition-all">
                    Descartar e Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Drops;
