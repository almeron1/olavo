
import React, { useState } from 'react';
import { User, Role } from '../types';
import { supabase } from '../supabaseClient';

interface LoginProps {
  users: User[];
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    const email = (e.target as any).email.value.trim();
    const password = (e.target as any).password.value;
    const name = (e.target as any).name?.value;
    
    try {
      if (isSignUp) {
        // Create user in custom table
        let role = Role.STUDENT;
        if (email.toLowerCase().includes('admin')) role = Role.ADMIN;
        if (email.toLowerCase().includes('prof')) role = Role.PROFESSOR;

        const { data, error } = await supabase.from('users').insert([{
            email,
            password, // Plain text as requested for prototype
            name,
            role,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
            status: 'active',
            enrolled_courses: []
        }]).select().single();

        if (error) throw error;
        
        if (data) {
            setSuccessMsg('Conta criada com sucesso! Faça login para continuar.');
            setIsSignUp(false);
        }
      } else {
        // Login query against custom table
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .eq('password', password)
          .single();

        if (error || !data) {
            throw new Error('Credenciais inválidas.');
        }

        // Convert DB snake_case to app camelCase if needed, though simple types match mostly
        const user: User = {
            ...data,
            enrolledCourses: data.enrolled_courses || []
        };
        
        onLogin(user);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setErrorMsg(error.message || 'Erro ao processar solicitação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 hbo-bg">
      <div className="w-full max-w-sm text-center animate-fade-in">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase mb-2">OLAVO DIGITAL</h1>
          <p className="text-[10px] font-black text-white/40 tracking-[0.5em] uppercase">The Learning Elite</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
           {isSignUp && (
             <div className="space-y-2 animate-fade-in">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 ml-4">Nome Completo</label>
                <input name="name" type="text" required={isSignUp} placeholder="Seu Nome" className="w-full bg-white/5 border border-white/10 p-6 rounded-2xl text-white outline-none focus:border-primary transition-all font-bold placeholder:text-gray-700" />
             </div>
           )}
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 ml-4">Email de Acesso</label>
              <input name="email" type="email" required placeholder="Email" className="w-full bg-white/5 border border-white/10 p-6 rounded-2xl text-white outline-none focus:border-primary transition-all font-bold placeholder:text-gray-700" />
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 ml-4">Senha</label>
              <input name="password" type="password" required placeholder="Senha" className="w-full bg-white/5 border border-white/10 p-6 rounded-2xl text-white outline-none focus:border-primary transition-all font-bold placeholder:text-gray-700" />
           </div>
           
           {errorMsg && <p className="text-red-500 text-xs font-bold text-center mt-2 px-4">{errorMsg}</p>}
           {successMsg && <p className="text-green-500 text-xs font-bold text-center mt-2 px-4">{successMsg}</p>}
           
           <button type="submit" disabled={loading} className="w-full bg-primary text-white font-black p-6 rounded-2xl hover:brightness-110 transition-all uppercase tracking-widest text-xs mt-6 shadow-2xl disabled:opacity-50">
             {loading ? 'Processando...' : (isSignUp ? 'Criar Conta' : 'Acessar Plataforma')}
           </button>
           
           <div className="text-center pt-4">
             <button type="button" onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(''); setSuccessMsg(''); }} className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-all">
                {isSignUp ? 'Já tem uma conta? Fazer Login' : 'Não tem conta? Cadastre-se'}
             </button>
           </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
