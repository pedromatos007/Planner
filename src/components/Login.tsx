import React, { useState } from 'react';
import { Mail, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onLogin: (email: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      
      if (res.ok) {
        const user = await res.json();
        localStorage.setItem('userEmail', user.email);
        localStorage.setItem('userName', user.name);
        localStorage.setItem('userAvatar', user.avatar_url);
        onLogin(user.email);
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-white flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white p-12 rounded-[3rem] border border-brand-border shadow-2xl shadow-brand-purple/5 text-center"
      >
        <div className="w-20 h-20 bg-brand-purple-light rounded-3xl flex items-center justify-center mx-auto mb-8 text-brand-purple">
          <Sparkles size={40} />
        </div>
        
        <h1 className="text-4xl font-serif italic text-stone-900 mb-2">+Cura</h1>
        <p className="text-stone-400 font-medium mb-10 uppercase tracking-widest text-xs">Seu Planner Pessoal Inteligente</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-left">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] ml-2 mb-2 block">E-mail para Acesso</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={20} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-brand-gray border border-brand-border focus:ring-8 focus:ring-brand-purple/5 focus:border-brand-purple/20 transition-all outline-none font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-5 bg-brand-purple text-white rounded-2xl font-serif italic text-xl shadow-xl shadow-brand-purple/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
          >
            <span>{isLoading ? 'Entrando...' : 'Começar Jornada'}</span>
            {!isLoading && <ArrowRight size={20} />}
          </button>
        </form>

        <p className="mt-8 text-stone-400 text-xs font-medium leading-relaxed">
          Seus dados são salvos automaticamente vinculados ao seu e-mail.
        </p>
      </motion.div>
    </div>
  );
}
