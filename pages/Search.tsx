
import React, { useState, useMemo } from 'react';
import { User, Course } from '../types';

interface SearchProps {
  user: User;
  courses: Course[];
  onSelectCourse: (id: string) => void;
}

const Search: React.FC<SearchProps> = ({ user, courses, onSelectCourse }) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return courses.filter(c => 
      c.title.toLowerCase().includes(q) || 
      c.description.toLowerCase().includes(q)
    );
  }, [query, courses]);

  return (
    <div className="p-6 md:p-12 animate-fade-in pb-32">
      <div className="max-w-5xl mx-auto space-y-12">
        <header>
          <h2 className="text-4xl md:text-8xl font-black italic uppercase tracking-tighter mb-4">Buscar</h2>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.4em]">O que você quer aprender hoje?</p>
        </header>

        <div className="relative group">
          <input 
            type="text" 
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Eletrodinâmica, Redação, Física..." 
            className="w-full bg-transparent border-b-2 border-white/10 p-8 text-2xl md:text-5xl font-black italic tracking-tighter text-white focus:outline-none focus:border-primary transition-all placeholder:text-white/5" 
          />
          <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 group-focus-within:text-primary transition-all">
             <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>

        {query && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in pt-12">
            {filtered.map(course => (
              <div key={course.id} onClick={() => onSelectCourse(course.id)} className="flex items-center gap-6 p-6 bg-white/5 border border-white/5 rounded-[40px] cursor-pointer hover:bg-white/10 transition-all group">
                <img src={course.thumbnail} className="w-24 h-24 object-cover rounded-3xl" alt="" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-black uppercase italic tracking-tight text-xl group-hover:text-primary transition-colors truncate">{course.title}</h4>
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-1">
                    {user.enrolledCourses.includes(course.id) ? 'Em sua biblioteca' : 'Disponível para compra'}
                  </p>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-20 text-center opacity-20">
                 <p className="text-2xl font-black uppercase tracking-[0.4em]">Nenhum resultado</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
