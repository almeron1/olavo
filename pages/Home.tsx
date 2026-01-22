
import React, { useRef } from 'react';
import { User, Course } from '../types';

interface HomeProps {
  user: User;
  courses: Course[];
  onSelectCourse: (id: string) => void;
}

const CourseRow: React.FC<{ title: string; items: Course[]; onSelect: (id: string) => void }> = ({ title, items, onSelect }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (items.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-4 mb-12 md:mb-16 group/row relative">
      <h3 className="px-6 md:px-16 text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-white/40">{title}</h3>
      
      <button 
        onClick={() => scroll('left')}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-black/60 p-4 rounded-full border border-white/10 text-white opacity-0 group-hover/row:opacity-100 transition-all hover:bg-primary hover:text-black hidden md:block"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
      </button>

      <button 
        onClick={() => scroll('right')}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-black/60 p-4 rounded-full border border-white/10 text-white opacity-0 group-hover/row:opacity-100 transition-all hover:bg-primary hover:text-black hidden md:block"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
      </button>

      <div 
        ref={scrollRef}
        className="flex gap-4 md:gap-5 overflow-x-auto hide-scrollbar snap-x px-6 md:px-16 pb-6"
      >
        {items.map(c => (
          <div 
            key={c.id} 
            onClick={() => onSelect(c.id)}
            className="min-w-[200px] md:min-w-[320px] aspect-video rounded-xl overflow-hidden group cursor-pointer relative shadow-2xl border border-white/5 snap-start bg-white/5 transition-all duration-500 hover:scale-110 hover:z-20 hover:border-primary/50"
          >
            <img src={c.thumbnail} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={c.title} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/10 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform">
              <h4 className="font-black text-[10px] md:text-[13px] uppercase italic tracking-tighter leading-tight drop-shadow-xl line-clamp-2 text-white/90 group-hover:text-white transition-colors">
                {c.title}
              </h4>
              <div className="w-0 group-hover:w-16 h-1 bg-primary mt-3 transition-all duration-500"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Home: React.FC<HomeProps> = ({ user, courses, onSelectCourse }) => {
  // Check if there are no courses (empty DB state)
  if (!courses || courses.length === 0) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/5">
           <svg className="w-10 h-10 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
        </div>
        <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter mb-4">Bem-vindo ao Olavo Digital</h2>
        <p className="text-white/40 font-medium max-w-md">O catálogo de cursos ainda está vazio. Se você é administrador, acesse o painel para cadastrar novos conteúdos.</p>
        
        {user.role === 'ADMIN' && (
           <p className="mt-8 text-primary text-[10px] font-black uppercase tracking-widest animate-pulse">Vá para o menu lateral para iniciar</p>
        )}
      </div>
    );
  }

  const destaques = courses.slice(0, 10);
  const redacao = courses.filter(c => c.title.includes('Redação')).slice(0, 10);
  const linguagens = courses.filter(c => c.title.includes('Português')).slice(0, 10);
  const humanas = courses.filter(c => ['História', 'Sociologia', 'Geografia'].some(cat => c.title.includes(cat))).slice(0, 10);
  const exatas = courses.filter(c => ['Física', 'Matemática'].some(cat => c.title.includes(cat))).slice(0, 10);
  const natureza = courses.filter(c => ['Biologia', 'Química'].some(cat => c.title.includes(cat))).slice(0, 10);
  
  const spotlight = courses[0];

  return (
    <div className="animate-fade-in pb-24 md:pb-40">
      <section className="relative h-[75vh] md:h-[95vh] w-full mb-12 md:mb-20 overflow-hidden">
        <img src={spotlight.thumbnail} className="absolute inset-0 w-full h-full object-cover scale-110 brightness-[0.4]" alt="" />
        <div className="absolute inset-0 hero-gradient"></div>
        <div className="absolute inset-0 bottom-gradient"></div>

        <div className="relative h-full flex flex-col justify-end pb-20 px-6 md:px-24 max-w-7xl space-y-6 md:space-y-10">
          <div className="flex items-center gap-4 mb-2">
             <div className="bg-primary px-4 py-1.5 rounded-sm flex items-center gap-2 shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                <div className="w-1.5 h-1.5 bg-black/60 rounded-full animate-pulse"></div>
                <span className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.2em] text-black">Live em Destaque</span>
             </div>
             <span className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.3em] text-white/50 border-l border-white/20 pl-4">ENEM 2026 • Premium Elite</span>
          </div>
          
          <h1 className="text-6xl md:text-[10rem] font-black uppercase italic tracking-tighter leading-[0.75] drop-shadow-2xl">
            {spotlight.title.split(':')[0]} <br/>
            <span className="text-primary italic drop-shadow-[0_0_15px_rgba(234,179,8,0.2)]">{spotlight.title.split(':')[1] || ''}</span>
          </h1>
          
          <p className="text-gray-300 font-medium text-sm md:text-2xl max-w-4xl drop-shadow-md leading-relaxed line-clamp-3 opacity-80">
            Aulas cinematográficas com os professores mais renomados do país. Domine a prova mais concorrida do Brasil com a estratégia dos aprovados.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5 pt-6">
             <button 
                onClick={() => onSelectCourse(spotlight.id)}
                className="group flex items-center justify-center gap-4 bg-white text-black px-12 md:px-16 py-5 md:py-7 rounded-sm font-black uppercase text-xs md:text-sm tracking-widest hover:bg-primary transition-all shadow-2xl active:scale-95"
             >
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                Começar Assistir
             </button>
             <button className="flex items-center justify-center gap-4 bg-white/5 backdrop-blur-3xl text-white border border-white/10 px-12 md:px-16 py-5 md:py-7 rounded-sm font-black uppercase text-xs md:text-sm tracking-widest hover:bg-white/10 transition-all active:scale-95">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Saiba Mais
             </button>
          </div>
        </div>
      </section>

      <div className="space-y-4 md:space-y-6 overflow-hidden">
        <CourseRow title="Destaques da Semana" items={destaques} onSelect={onSelectCourse} />
        <CourseRow title="Redação Nota 1000" items={redacao} onSelect={onSelectCourse} />
        <CourseRow title="Linguagens e Códigos" items={linguagens} onSelect={onSelectCourse} />
        <CourseRow title="Ciências Humanas" items={humanas} onSelect={onSelectCourse} />
        <CourseRow title="Ciências Exatas" items={exatas} onSelect={onSelectCourse} />
        <CourseRow title="Ciências da Natureza" items={natureza} onSelect={onSelectCourse} />
      </div>
    </div>
  );
};

export default Home;
