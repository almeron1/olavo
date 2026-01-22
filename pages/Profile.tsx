
import React from 'react';
import { User, Role } from '../types';

interface ProfileProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser, onLogout }) => {
  const isProfessor = user.role === Role.PROFESSOR;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = (e.target as any).name.value;
    const email = (e.target as any).email.value;
    onUpdateUser({ ...user, name, email });
    alert('Informações atualizadas com sucesso!');
  };

  return (
    <div className="p-6 md:p-12 animate-fade-in pb-32 max-w-5xl mx-auto space-y-16">
      <header className="flex flex-col md:flex-row items-center gap-12 border-b border-white/5 pb-16">
        <div className="w-48 h-48 rounded-full border-4 border-primary/20 p-2 relative group">
           <img src={user.avatar} className="w-full h-full object-cover rounded-full shadow-2xl" alt="" />
        </div>
        <div className="text-center md:text-left space-y-4">
           <h1 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter leading-none">{user.name}</h1>
           <div className="flex gap-4 justify-center md:justify-start">
             <span className="bg-primary text-white px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">{user.role}</span>
             <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] pt-1.5">
               {isProfessor ? 'Colaborador Institucional' : `${user.enrolledCourses.length} Trilhas Ativas`}
             </span>
           </div>
        </div>
      </header>

      <div className="grid md:grid-cols-2 gap-16">
        <div className="space-y-10">
          <h3 className="text-xs font-black uppercase tracking-[0.5em] text-white/20 border-b border-white/5 pb-4">Dados Administrativos</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-4">Nome Social/Completo</label>
              <input name="name" type="text" defaultValue={user.name} className="w-full bg-white/5 border border-white/10 p-6 rounded-2xl text-sm font-bold outline-none focus:border-primary transition-all text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-4">Email Corporativo</label>
              <input name="email" type="email" defaultValue={user.email} className="w-full bg-white/5 border border-white/10 p-6 rounded-2xl text-sm font-bold outline-none focus:border-primary transition-all text-white" />
            </div>
            <button type="submit" className="bg-white text-black px-12 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-primary hover:text-white transition-all shadow-xl">Atualizar Cadastro</button>
          </form>
        </div>

        <div className="space-y-10">
          <h3 className="text-xs font-black uppercase tracking-[0.5em] text-white/20 border-b border-white/5 pb-4">Status de Acesso</h3>
          <div className="space-y-4">
            <div className="p-8 bg-white/5 rounded-[40px] border border-white/5 space-y-2">
               <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">{isProfessor ? 'Cargo Atual' : 'Plano Ativo'}</p>
               <p className="text-2xl font-black italic uppercase text-primary">
                 {isProfessor ? 'Professor / Mentor Master' : 'Acesso Premium Elite'}
               </p>
            </div>
            <button onClick={onLogout} className="w-full border-2 border-red-500/20 py-8 rounded-[40px] text-red-500 font-black uppercase text-xs tracking-[0.6em] hover:bg-red-500 hover:text-white transition-all shadow-2xl">Encerrar Sessão Segura</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
