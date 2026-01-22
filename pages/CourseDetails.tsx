
import React, { useState } from 'react';
import { User, Course, Role } from '../types';

interface CourseDetailsProps {
  user: User;
  course: Course | null;
  onEnroll: (id: string) => void;
  onStartLesson: (courseId: string, lessonId?: string) => void;
}

const CourseDetails: React.FC<CourseDetailsProps> = ({ user, course, onEnroll, onStartLesson }) => {
  const [activeTab, setActiveTab] = useState<'lessons' | 'materials' | 'info'>('lessons');

  if (!course) return null;
  const isProfessor = user.role === Role.PROFESSOR;
  const isEnrolled = user.enrolledCourses.includes(course.id) || isProfessor;

  return (
    <div className="animate-fade-in pb-32 min-h-screen bg-[#02040e]">
      {/* Hero Section */}
      <div className="h-[50vh] relative flex flex-col justify-end p-6 md:p-16 lg:p-24 overflow-hidden">
        <img src={course.thumbnail} className="absolute inset-0 w-full h-full object-cover brightness-[0.2] scale-105" alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#02040e] via-transparent to-transparent"></div>
        <div className="relative z-10 space-y-6 max-w-5xl">
          <h1 className="text-4xl md:text-8xl font-black italic uppercase tracking-tighter leading-none">{course.title}</h1>
          <div className="flex flex-wrap gap-4 items-center">
            {isEnrolled ? (
              <button onClick={() => onStartLesson(course.id)} className="bg-primary text-white px-10 py-4 rounded-full font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:scale-105 transition-all">
                {isProfessor ? 'Visualizar Grade Completa' : 'Continuar Estudando'}
              </button>
            ) : (
              <button onClick={() => onEnroll(course.id)} className="bg-white text-black px-10 py-4 rounded-full font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-primary hover:text-white transition-all">Garantir Vaga • R$ {course.price.toFixed(2)}</button>
            )}
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{course.modules.length} Módulos • {isProfessor ? 'Conteúdo Atribuído' : 'Acesso Vitalício'}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="sticky top-0 z-[60] bg-[#02040e]/95 backdrop-blur-3xl border-b border-white/5 px-6 md:px-12 flex gap-8 md:gap-12 overflow-x-auto hide-scrollbar">
        {[
          { id: 'lessons', label: 'Grade de Aulas' },
          { id: 'materials', label: 'Materiais de Apoio' },
          { id: 'info', label: 'Detalhes Técnicos' }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-8 text-[10px] font-black uppercase tracking-[0.4em] transition-all relative whitespace-nowrap ${activeTab === tab.id ? 'text-white' : 'text-gray-600 hover:text-white/60'}`}
          >
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary shadow-[0_-5px_15px_var(--primary)]"></div>}
          </button>
        ))}
      </div>

      <div className="max-w-6xl mx-auto p-6 md:p-12">
        {activeTab === 'lessons' && (
          <div className="space-y-12 animate-fade-in">
            {course.modules.map(mod => (
              <div key={mod.id}>
                <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.6em] mb-6 px-4">{mod.title}</h3>
                <div className="space-y-3">
                  {mod.lessons.map(l => (
                    <button 
                      key={l.id} 
                      disabled={!isEnrolled}
                      onClick={() => onStartLesson(course.id, l.id)}
                      className={`w-full flex items-center justify-between p-6 md:p-8 bg-white/5 border border-white/5 rounded-[35px] transition-all group ${isEnrolled ? 'hover:bg-white/10 cursor-pointer' : 'opacity-40 grayscale cursor-not-allowed'}`}
                    >
                      <div className="flex items-center gap-6 md:gap-8">
                        <div className="w-12 h-12 bg-black/40 rounded-2xl flex items-center justify-center font-black text-white/20 group-hover:text-primary transition-all">{l.order}</div>
                        <div className="text-left">
                           <span className="text-lg md:text-2xl font-black uppercase italic tracking-tight block">{l.title}</span>
                           <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{l.duration} • {l.type}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                         {isProfessor && <span className="text-[8px] font-black text-primary uppercase border border-primary/20 px-3 py-1 rounded-full">Editor</span>}
                         <svg className="w-6 h-6 text-white/5 group-hover:text-white transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'info' && (
          <div className="animate-fade-in grid md:grid-cols-3 gap-12">
             <div className="md:col-span-2 space-y-8">
                <h3 className="text-3xl font-black italic uppercase tracking-tighter">Diretriz Pedagógica</h3>
                <p className="text-gray-400 text-lg leading-relaxed">{course.description}</p>
             </div>
             <div className="space-y-8">
                <div className="p-8 bg-white/5 border border-white/5 rounded-[40px] space-y-4">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30">Visão do Gestor</h4>
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary font-black">P</div>
                      <p className="font-black italic uppercase tracking-tight">Time Pedagógico</p>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="p-8 bg-white/5 border border-white/10 rounded-[40px] flex items-center justify-between group hover:bg-white/10 transition-all">
                <div className="flex items-center gap-6">
                   <div className="w-14 h-14 bg-black/40 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                   </div>
                   <div>
                      <h4 className="font-black uppercase tracking-tight text-lg mb-0.5">Plano de Estudos</h4>
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">PDF • Gestão Docente</span>
                   </div>
                </div>
                <button className="bg-white text-black px-8 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest">Visualizar</button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetails;
