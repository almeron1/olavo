
import React, { useState, useMemo, useRef } from 'react';
import { User, Course, Role, Material, Lesson } from '../types';

interface PlayerProps {
  user: User;
  course: Course | null;
  activeLessonId: string | null;
  onSelectLesson: (id: string) => void;
  onBack: () => void;
}

interface QuizQuestion {
  id: string;
  type: 'CHOICE' | 'TEXT';
  question: string;
  options?: string[];
  correctAnswer?: number;
  expectedAnswer?: string;
}

const Player: React.FC<PlayerProps> = ({ user, course: initialCourse, activeLessonId, onSelectLesson, onBack }) => {
  const [activeTab, setActiveTab] = useState<'desc' | 'mat' | 'quiz'>('desc');
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [showQuizEditor, setShowQuizEditor] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
  
  const [localMaterials, setLocalMaterials] = useState<Record<string, Material[]>>({});
  const [localQuizzes, setLocalQuizzes] = useState<Record<string, QuizQuestion[]>>({});

  // Form states para Material
  const [newMatTitle, setNewMatTitle] = useState('');
  const [newMatType, setNewMatType] = useState<'PDF' | 'LINK' | 'SLIDE'>('PDF');
  const [newMatLink, setNewMatLink] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Form states para Quiz
  const [currentQuizQuestions, setCurrentQuizQuestions] = useState<QuizQuestion[]>([]);
  const [newQuestionType, setNewQuestionType] = useState<'CHOICE' | 'TEXT'>('CHOICE');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newOptions, setNewOptions] = useState(['', '']); // Começa com 2 mínimas
  const [correctOption, setCorrectOption] = useState(0);
  const [newExpectedAnswer, setNewExpectedAnswer] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isProfessor = user.role === Role.PROFESSOR;

  const activeLesson = useMemo(() => {
    if (!initialCourse) return null;
    const all = initialCourse.modules.flatMap(m => m.lessons);
    return all.find(l => l.id === activeLessonId) || all[0];
  }, [initialCourse, activeLessonId]);

  const materialsList = useMemo(() => {
    if (!activeLesson) return [];
    const saved = localMaterials[activeLesson.id] || [];
    return [...activeLesson.materials, ...saved];
  }, [activeLesson, localMaterials]);

  const quizList = useMemo(() => {
    if (!activeLesson) return [];
    return localQuizzes[activeLesson.id] || [];
  }, [activeLesson, localQuizzes]);

  const handleAddMaterial = async () => {
    if (!activeLesson || !newMatTitle) return;
    if (newMatType === 'LINK' && !newMatLink) return;
    if (newMatType !== 'LINK' && !selectedFile) return;

    setIsUploading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const fileUrl = newMatType === 'LINK' ? newMatLink : URL.createObjectURL(selectedFile!);

    const newMat: Material = {
      id: `mat-${Date.now()}`,
      title: newMatTitle,
      type: newMatType,
      url: fileUrl
    };

    setLocalMaterials(prev => ({
      ...prev,
      [activeLesson.id]: [...(prev[activeLesson.id] || []), newMat]
    }));

    setNewMatTitle('');
    setNewMatLink('');
    setSelectedFile(null);
    setIsUploading(false);
    setShowAddMaterial(false);
  };

  const handleAddQuestionToDraft = () => {
    if (!newQuestionText) return;

    const q: QuizQuestion = {
      id: `q-${Date.now()}`,
      type: newQuestionType,
      question: newQuestionText,
    };

    if (newQuestionType === 'CHOICE') {
      const validOptions = newOptions.filter(opt => opt.trim() !== '');
      if (validOptions.length < 2) {
        alert("Adicione pelo menos 2 alternativas preenchidas.");
        return;
      }
      q.options = validOptions;
      q.correctAnswer = correctOption;
    } else {
      q.expectedAnswer = newExpectedAnswer;
    }

    setCurrentQuizQuestions([...currentQuizQuestions, q]);
    
    // Reset individual question form
    setNewQuestionText('');
    setNewOptions(['', '']);
    setCorrectOption(0);
    setNewExpectedAnswer('');
  };

  const handleSaveQuizToLesson = () => {
    if (!activeLesson || currentQuizQuestions.length === 0) return;
    setLocalQuizzes(prev => ({
      ...prev,
      [activeLesson.id]: currentQuizQuestions
    }));
    setShowQuizEditor(false);
  };

  if (!initialCourse || !activeLesson) return null;

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-black overflow-hidden animate-fade-in">
      <div className="flex-1 flex flex-col h-full overflow-y-auto hide-scrollbar relative bg-[#02040e]">
        <header className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-50 bg-gradient-to-b from-black/80 to-transparent">
          <button onClick={onBack} className="p-3 hover:bg-white/10 rounded-full transition-all border border-white/5 backdrop-blur-md">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div className="text-center">
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/30 mb-1">{initialCourse.title}</p>
            <h3 className="text-xs font-black uppercase italic tracking-tighter text-white/80">{activeLesson.title}</h3>
          </div>
          <div className="w-12"></div>
        </header>

        <div className="w-full aspect-video bg-black flex items-center justify-center shadow-2xl relative">
          <video key={activeLesson.id} src="https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4" controls className="w-full h-full object-contain" />
          {isProfessor && (
            <div className="absolute bottom-12 right-6 bg-primary/90 text-black text-[8px] font-black px-4 py-2 rounded-full uppercase tracking-widest pointer-events-none shadow-2xl">Modo Editor Docente</div>
          )}
        </div>

        <div className="bg-[#050811] border-b border-white/5">
          <div className="max-w-5xl mx-auto px-6 md:px-12 py-8 space-y-4">
            <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">{activeLesson.title}</h1>
          </div>
          <div className="flex max-w-5xl mx-auto px-6 md:px-12">
            {[
              { id: 'desc', label: 'Sobre' },
              { id: 'mat', label: `Materiais (${materialsList.length})` },
              { id: 'quiz', label: `Quiz (${quizList.length})` }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)} 
                className={`py-6 pr-10 text-[10px] font-black uppercase tracking-[0.3em] relative transition-colors ${activeTab === tab.id ? 'text-white' : 'text-gray-600 hover:text-white/40'}`}
              >
                {tab.label}
                {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-8 h-1 bg-primary shadow-[0_0_10px_var(--primary)]"></div>}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto w-full p-6 md:p-12 pb-40">
          {activeTab === 'desc' && <p className="text-gray-400 text-base md:text-xl font-medium leading-relaxed italic">{activeLesson.description}</p>}

          {activeTab === 'mat' && (
            <div className="space-y-8">
              {isProfessor && (
                <button 
                  onClick={() => setShowAddMaterial(true)}
                  className="w-full p-10 border-2 border-dashed border-white/10 rounded-[40px] text-white/40 font-black uppercase text-[10px] tracking-widest hover:border-primary hover:text-primary transition-all group flex items-center justify-center gap-4"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  Anexar Novo Recurso Pedagógico
                </button>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {materialsList.map(mat => (
                  <div key={mat.id} className="p-8 bg-white/5 border border-white/10 rounded-[40px] flex items-center justify-between group hover:bg-white/10 transition-all shadow-xl">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-black/40 rounded-2xl flex items-center justify-center text-primary border border-white/5">
                        {mat.type === 'PDF' && <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/></svg>}
                        {mat.type === 'LINK' && <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>}
                        {mat.type === 'SLIDE' && <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h10V7H7v3zm0 4h10v-3H7v3zm0 3h7v-3H7v3z"/></svg>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-black uppercase tracking-tight text-lg truncate">{mat.title}</h4>
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{mat.type} • Disponível</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                       <button onClick={() => setPreviewMaterial(mat)} className="bg-white text-black px-5 py-3 rounded-xl font-black uppercase text-[8px] tracking-widest hover:bg-primary hover:text-white transition-all">Abrir</button>
                       <a href={mat.url} download={mat.title} className="bg-white/5 text-white/40 p-3 rounded-xl hover:text-white hover:bg-white/10 transition-all">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                       </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'quiz' && (
            <div className="space-y-6">
              {quizList.length === 0 ? (
                isProfessor ? (
                  <div className="p-16 bg-white/5 border border-white/5 rounded-[50px] text-center space-y-8">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                       <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <div className="space-y-3">
                       <h3 className="text-3xl font-black uppercase italic tracking-tighter">Avaliação Pendente</h3>
                       <p className="text-gray-500 text-sm max-w-sm mx-auto font-medium">Esta aula ainda não possui um quiz. Crie questões para medir o progresso da turma.</p>
                    </div>
                    <button onClick={() => { setShowQuizEditor(true); setCurrentQuizQuestions([]); }} className="bg-primary text-white px-12 py-5 rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl hover:scale-105 transition-all">Iniciar Editor Híbrido</button>
                  </div>
                ) : (
                  <div className="p-16 text-center opacity-20">
                     <p className="text-xl font-black uppercase tracking-widest italic">Nenhum quiz disponível.</p>
                  </div>
                )
              ) : (
                <div className="space-y-8 animate-fade-in">
                   <header className="flex justify-between items-end border-b border-white/5 pb-6">
                      <div>
                        <h3 className="text-3xl font-black italic uppercase tracking-tighter">Desafio da Aula</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-2">{quizList.length} questões cadastradas</p>
                      </div>
                      {isProfessor && <button onClick={() => { setShowQuizEditor(true); setCurrentQuizQuestions(quizList); }} className="text-primary text-[10px] font-black uppercase underline tracking-widest">Acessar Gerenciador</button>}
                   </header>
                   <div className="space-y-10">
                      {quizList.map((q, idx) => (
                        <div key={q.id} className="p-10 bg-white/5 border border-white/5 rounded-[40px] space-y-8">
                           <div className="flex items-center justify-between">
                              <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Questão {idx + 1}</p>
                              <span className="bg-white/5 text-white/40 text-[8px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">{q.type === 'CHOICE' ? 'Múltipla Escolha' : 'Dissertativa'}</span>
                           </div>
                           <h4 className="text-2xl font-black italic uppercase leading-tight">{q.question}</h4>
                           
                           {q.type === 'CHOICE' ? (
                             <div className="grid gap-3">
                                {q.options?.map((opt, oIdx) => (
                                  <button key={oIdx} className="w-full text-left p-6 bg-white/5 border border-white/5 rounded-2xl hover:border-primary transition-all text-sm font-medium flex items-center gap-4 group">
                                     <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center font-black group-hover:text-primary transition-all">{String.fromCharCode(65 + oIdx)}</div>
                                     {opt}
                                  </button>
                                ))}
                             </div>
                           ) : (
                             <div className="space-y-4">
                                <textarea placeholder="Digite sua resposta aqui..." className="w-full bg-black/40 border border-white/10 p-6 rounded-3xl text-sm font-medium outline-none focus:border-primary h-32 resize-none text-white/80" />
                                <p className="text-[9px] font-black uppercase text-white/20 tracking-widest">Sua resposta será avaliada pelo professor.</p>
                             </div>
                           )}
                        </div>
                      ))}
                   </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <aside className="hidden lg:flex w-[400px] bg-[#02040e] border-l border-white/5 flex-col h-screen sticky top-0 shadow-2xl z-50">
        <div className="p-10 border-b border-white/5">
          <h4 className="text-[10px] font-black uppercase tracking-[0.6em] text-white/20 mb-4">Grade da Disciplina</h4>
          <p className="text-sm font-black uppercase italic text-white/90 truncate">{initialCourse.title}</p>
        </div>
        <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-4">
          {initialCourse.modules.flatMap(m => m.lessons).map(l => (
            <button key={l.id} onClick={() => onSelectLesson(l.id)} className={`w-full p-5 rounded-[30px] text-left transition-all flex items-center gap-5 border ${activeLessonId === l.id ? 'bg-white text-black border-transparent shadow-2xl scale-[1.02]' : 'bg-transparent border-transparent hover:bg-white/5'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] shrink-0 ${activeLessonId === l.id ? 'bg-black text-white' : 'bg-white/5 text-white/20'}`}>{l.order}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-[11px] font-black uppercase tracking-tight italic truncate ${activeLessonId === l.id ? 'text-black' : 'text-white/80'}`}>{l.title}</p>
                <span className={`text-[7px] font-black uppercase tracking-widest ${activeLessonId === l.id ? 'opacity-60' : 'text-white/20'}`}>{l.duration}</span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* LIGHTBOX PREVIEW MATERIAL */}
      {previewMaterial && (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-2xl flex flex-col animate-fade-in">
           <header className="p-6 flex justify-between items-center bg-black/40 border-b border-white/10">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                 </div>
                 <div>
                    <h4 className="text-sm font-black uppercase italic tracking-tight">{previewMaterial.title}</h4>
                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Visualização Segura • {previewMaterial.type}</p>
                 </div>
              </div>
              <button onClick={() => setPreviewMaterial(null)} className="p-3 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
           </header>
           <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
              {previewMaterial.type === 'LINK' ? (
                <div className="text-center space-y-8 p-12 max-w-xl bg-white/5 rounded-[50px] border border-white/5">
                   <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                   </div>
                   <h3 className="text-2xl font-black italic uppercase tracking-tighter">Link Externo Seguro</h3>
                   <p className="text-gray-400 font-medium">Este material aponta para um recurso fora da plataforma.</p>
                   <a href={previewMaterial.url} target="_blank" rel="noreferrer" className="inline-block bg-primary text-white px-12 py-5 rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl">Acessar Recurso</a>
                </div>
              ) : (
                <iframe src={previewMaterial.url} className="w-full h-full border-none bg-white" title="Preview" />
              )}
           </div>
        </div>
      )}

      {/* MODAL ADICIONAR MATERIAL */}
      {showAddMaterial && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl animate-fade-in">
           <div className="bg-[#0a1024] w-full max-w-xl rounded-[50px] p-10 md:p-12 border border-white/10 space-y-10 shadow-2xl">
              <header>
                <p className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-4">Upload Docente</p>
                <h2 className="text-4xl font-black italic uppercase tracking-tighter">Novo Material</h2>
              </header>
              <div className="space-y-8">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-4">Formato</label>
                   <div className="grid grid-cols-3 gap-3">
                      {(['PDF', 'LINK', 'SLIDE'] as const).map(t => (
                        <button key={t} onClick={() => setNewMatType(t)} className={`py-4 rounded-2xl text-[10px] font-black tracking-widest transition-all ${newMatType === t ? 'bg-primary text-white shadow-lg' : 'bg-white/5 text-white/30 border border-white/5'}`}>{t}</button>
                      ))}
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-4">Título</label>
                   <input type="text" value={newMatTitle} onChange={(e) => setNewMatTitle(e.target.value)} placeholder="Ex: Apostila de Revisão" className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl outline-none focus:border-primary text-white font-bold" />
                </div>
                {newMatType === 'LINK' ? (
                  <div className="space-y-2 animate-fade-in">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-4">URL</label>
                    <input type="url" value={newMatLink} onChange={(e) => setNewMatLink(e.target.value)} placeholder="https://..." className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl outline-none focus:border-primary text-white font-bold" />
                  </div>
                ) : (
                  <div onClick={() => fileInputRef.current?.click()} className={`h-40 border-2 border-dashed rounded-[35px] flex flex-col items-center justify-center gap-4 transition-all cursor-pointer ${selectedFile ? 'border-primary bg-primary/5' : 'border-white/10 bg-white/5'}`}>
                       <input ref={fileInputRef} type="file" className="hidden" accept={newMatType === 'PDF' ? '.pdf' : '*'} onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                       <p className="text-[10px] font-black text-white/20 uppercase tracking-widest text-center px-6">{selectedFile ? selectedFile.name : 'Selecionar Arquivo'}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setShowAddMaterial(false)} className="flex-1 bg-white/5 text-white/40 py-6 rounded-3xl font-black uppercase text-[10px] tracking-widest">Cancelar</button>
                 <button onClick={handleAddMaterial} disabled={isUploading} className="flex-1 bg-primary text-white py-6 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl">{isUploading ? 'Processando...' : 'Publicar'}</button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL EDITOR DE QUIZ (HÍBRIDO E DINÂMICO) */}
      {showQuizEditor && (
        <div className="fixed inset-0 z-[400] bg-black/98 backdrop-blur-3xl overflow-y-auto animate-fade-in">
           <div className="max-w-4xl mx-auto w-full p-8 md:p-16 space-y-16">
              <header className="flex justify-between items-center">
                 <div>
                    <p className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-4">Gerenciador de Atividades</p>
                    <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none">Editor de Quiz</h2>
                 </div>
                 <button onClick={() => setShowQuizEditor(false)} className="p-6 bg-white/5 rounded-full hover:bg-red-600 transition-all border border-white/10 text-white/40 hover:text-white">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </header>

              {/* Lista de Questões no Draft */}
              <div className="space-y-6">
                 <h3 className="text-[10px] font-black text-white/20 uppercase tracking-widest">Estrutura do Quiz ({currentQuizQuestions.length} questões)</h3>
                 {currentQuizQuestions.length === 0 ? (
                   <div className="p-12 border-2 border-dashed border-white/5 rounded-[40px] text-center opacity-20 font-black uppercase text-[10px] tracking-widest">Nenhuma questão adicionada ao rascunho.</div>
                 ) : (
                   <div className="space-y-4">
                      {currentQuizQuestions.map((q, idx) => (
                        <div key={q.id} className="p-8 bg-white/5 border border-white/5 rounded-[30px] flex justify-between items-center group">
                           <div className="flex items-center gap-6">
                              <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center font-black text-primary text-[10px]">{idx + 1}</div>
                              <div>
                                 <p className="text-sm font-black italic uppercase truncate max-w-md">{q.question}</p>
                                 <p className="text-[8px] font-black text-white/30 uppercase mt-1">Tipo: {q.type === 'CHOICE' ? `Múltipla Escolha (${q.options?.length} itens)` : 'Texto Dissertativo'}</p>
                              </div>
                           </div>
                           <button onClick={() => setCurrentQuizQuestions(currentQuizQuestions.filter(item => item.id !== q.id))} className="text-red-500 opacity-0 group-hover:opacity-100 transition-all font-black text-[9px] uppercase tracking-widest">Remover</button>
                        </div>
                      ))}
                   </div>
                 )}
              </div>

              {/* Seletor de Tipo e Criador de Questão */}
              <div className="p-10 md:p-14 bg-[#0a1024] border border-white/10 rounded-[60px] space-y-12">
                 <div className="flex flex-col md:flex-row gap-6 items-center justify-between border-b border-white/5 pb-10">
                    <h4 className="text-xl font-black italic uppercase tracking-tighter">Nova Questão</h4>
                    <div className="flex gap-2">
                       <button onClick={() => setNewQuestionType('CHOICE')} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${newQuestionType === 'CHOICE' ? 'bg-primary text-white' : 'bg-white/5 text-white/20 border border-white/5'}`}>Múltipla Escolha</button>
                       <button onClick={() => setNewQuestionType('TEXT')} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${newQuestionType === 'TEXT' ? 'bg-primary text-white' : 'bg-white/5 text-white/20 border border-white/5'}`}>Dissertativa</button>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary">Enunciado</label>
                    <textarea 
                      value={newQuestionText} 
                      onChange={(e) => setNewQuestionText(e.target.value)} 
                      placeholder="Digite o enunciado da questão..." 
                      className="w-full bg-white/5 border border-white/10 p-8 rounded-3xl text-xl font-bold outline-none focus:border-primary text-white h-32 resize-none placeholder:text-white/5" 
                    />
                 </div>

                 {newQuestionType === 'CHOICE' ? (
                   <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/20">Alternativas (Apenas preencha as necessárias)</label>
                        <button onClick={() => setNewOptions([...newOptions, ''])} className="text-primary text-[9px] font-black uppercase tracking-widest">+ Adicionar Opção</button>
                      </div>
                      <div className="grid gap-4">
                        {newOptions.map((opt, i) => (
                          <div key={i} className="flex gap-4">
                             <button 
                                onClick={() => setCorrectOption(i)} 
                                className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black transition-all ${correctOption === i ? 'bg-green-500 text-white shadow-lg' : 'bg-white/5 text-white/20 hover:text-white'}`}
                             >
                                {String.fromCharCode(65 + i)}
                             </button>
                             <input 
                                type="text" 
                                value={opt} 
                                onChange={(e) => {
                                  const copy = [...newOptions];
                                  copy[i] = e.target.value;
                                  setNewOptions(copy);
                                }} 
                                placeholder={`Descreva a alternativa ${String.fromCharCode(65 + i)}...`} 
                                className="flex-1 bg-white/5 border border-white/10 p-4 rounded-2xl text-sm font-bold outline-none focus:border-primary text-white" 
                             />
                             {newOptions.length > 2 && (
                               <button onClick={() => setNewOptions(newOptions.filter((_, idx) => idx !== i))} className="text-red-500/30 hover:text-red-500 p-2">✕</button>
                             )}
                          </div>
                        ))}
                      </div>
                   </div>
                 ) : (
                   <div className="space-y-4 animate-fade-in">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/20">Resposta Esperada / Guia de Correção</label>
                      <textarea 
                        value={newExpectedAnswer} 
                        onChange={(e) => setNewExpectedAnswer(e.target.value)} 
                        placeholder="O que o aluno deve abordar nesta resposta?" 
                        className="w-full bg-white/5 border border-white/10 p-8 rounded-3xl text-sm font-bold outline-none focus:border-primary text-white h-32 resize-none placeholder:text-white/5" 
                      />
                   </div>
                 )}

                 <button onClick={handleAddQuestionToDraft} className="w-full py-6 bg-white text-black hover:bg-primary hover:text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] transition-all shadow-xl">
                    Adicionar Questão à Lista
                 </button>
              </div>

              <div className="flex flex-col items-center gap-6 pt-10">
                 <button 
                  onClick={handleSaveQuizToLesson} 
                  disabled={currentQuizQuestions.length === 0} 
                  className="bg-primary text-white px-20 py-8 rounded-full font-black uppercase text-xs tracking-[0.3em] shadow-[0_20px_60px_rgba(234,179,8,0.4)] hover:scale-105 active:scale-95 transition-all disabled:opacity-10"
                >
                    Finalizar e Publicar Quiz na Aula
                 </button>
                 <p className="text-[9px] font-black uppercase text-white/20 tracking-widest italic">O progresso será salvo apenas para esta aula.</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Player;
