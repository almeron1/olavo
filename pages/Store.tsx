
import React from 'react';
import { User, Course } from '../types';

interface StoreProps {
  user: User;
  courses: Course[];
  onEnroll: (id: string) => void;
  onSelectCourse: (id: string) => void;
}

const Store: React.FC<StoreProps> = ({ user, courses, onEnroll, onSelectCourse }) => {
  const shopCourses = courses.filter(c => !user.enrolledCourses.includes(c.id));

  return (
    <div className="p-6 md:p-12 animate-fade-in pb-32">
      <header className="max-w-4xl space-y-6 mb-16">
        <h1 className="text-4xl md:text-8xl font-black italic uppercase tracking-tighter leading-none">Loja<br/><span className="text-white/20">Digital</span></h1>
        <p className="text-gray-400 font-medium text-lg md:text-2xl">Invista no seu futuro com acesso ilimitado aos melhores conteúdos.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {shopCourses.map(course => (
          <div key={course.id} className="group bg-white/5 rounded-[40px] border border-white/5 overflow-hidden flex flex-col h-full shadow-2xl hover:border-white/10 transition-all">
            <div className="aspect-video relative overflow-hidden cursor-pointer" onClick={() => onSelectCourse(course.id)}>
              <img src={course.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all"></div>
            </div>
            <div className="p-8 flex flex-col flex-1 gap-6">
              <h3 className="font-black uppercase italic tracking-tight text-2xl leading-none">{course.title}</h3>
              <p className="text-gray-400 text-sm line-clamp-2 font-medium">{course.description}</p>
              <div className="mt-auto space-y-4">
                 <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Valor do Acesso</span>
                    <span className="text-2xl font-black text-primary italic">R$ {course.price.toFixed(2)}</span>
                 </div>
                 <button onClick={() => onEnroll(course.id)} className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-primary hover:text-white transition-all shadow-xl">Garantir Acesso Imediato</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Store;
