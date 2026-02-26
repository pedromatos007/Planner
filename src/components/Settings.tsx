import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Camera, 
  Save, 
  Shield, 
  Bell, 
  LogOut,
  Upload
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Settings() {
  const [name, setName] = useState(localStorage.getItem('userName') || '');
  const [avatarUrl, setAvatarUrl] = useState(localStorage.getItem('userAvatar') || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');
    try {
      const email = localStorage.getItem('userEmail');
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': email || ''
        },
        body: JSON.stringify({ name, avatar_url: avatarUrl })
      });

      if (res.ok) {
        localStorage.setItem('userName', name);
        localStorage.setItem('userAvatar', avatarUrl);
        setMessage('Configurações salvas com sucesso!');
        setTimeout(() => setMessage(''), 3000);
        window.dispatchEvent(new Event('storage')); // Notify other components
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Erro ao salvar configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <header>
        <h2 className="text-5xl font-serif italic text-stone-900">Configurações</h2>
        <p className="text-stone-400 mt-2 font-medium">Personalize sua experiência no +Cura.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-brand-border shadow-sm text-center">
            <div className="relative inline-block group">
              <div className="w-32 h-32 rounded-[2.5rem] bg-brand-gray border-4 border-white shadow-xl overflow-hidden mb-4">
                <img 
                  src={avatarUrl || `https://picsum.photos/seed/${localStorage.getItem('userEmail')}/200`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <button 
                onClick={triggerFileInput}
                className="absolute bottom-2 right-2 p-3 bg-brand-purple text-white rounded-2xl shadow-lg hover:scale-110 transition-transform"
              >
                <Camera size={18} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
            </div>
            <h3 className="text-xl font-serif italic text-stone-900">{name || 'Usuário'}</h3>
            <p className="text-xs text-stone-400 font-medium uppercase tracking-widest mt-1">{localStorage.getItem('userEmail')}</p>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-3 p-6 bg-rose-50 text-rose-500 rounded-[2rem] border border-rose-100 font-bold uppercase tracking-widest text-xs hover:bg-rose-100 transition-colors"
          >
            <LogOut size={18} />
            <span>Sair da Conta</span>
          </button>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-10 rounded-[2.5rem] border border-brand-border shadow-sm space-y-8">
            <div className="space-y-6">
              <h4 className="text-2xl font-serif italic text-stone-900 flex items-center">
                <User className="mr-3 text-brand-purple" size={24} />
                Perfil Público
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Seu Nome</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Como quer ser chamado?"
                    className="w-full p-4 rounded-2xl bg-brand-gray border border-brand-border focus:ring-8 focus:ring-brand-purple/5 focus:border-brand-purple/20 transition-all outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Foto de Perfil</label>
                  <div className="flex space-x-4">
                    <button 
                      onClick={triggerFileInput}
                      className="flex-1 flex items-center justify-center space-x-2 p-4 rounded-2xl bg-brand-gray border border-brand-border hover:bg-stone-200 transition-all font-medium text-stone-600"
                    >
                      <Upload size={18} />
                      <span>Upload da Galeria</span>
                    </button>
                    <div className="flex-[2]">
                      <input
                        type="text"
                        value={avatarUrl.startsWith('data:') ? 'Imagem carregada da galeria' : avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="Ou cole a URL da imagem aqui"
                        className="w-full p-4 rounded-2xl bg-brand-gray border border-brand-border focus:ring-8 focus:ring-brand-purple/5 focus:border-brand-purple/20 transition-all outline-none font-medium"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-stone-400 mt-2 ml-1">Você pode escolher uma foto do seu dispositivo ou usar um link externo.</p>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-brand-border flex items-center justify-between">
              {message && (
                <span className={`text-sm font-medium ${message.includes('Erro') ? 'text-rose-500' : 'text-emerald-600'}`}>
                  {message}
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="ml-auto flex items-center space-x-3 px-10 py-4 bg-brand-purple text-white rounded-full font-serif italic text-xl shadow-2xl shadow-brand-purple/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                <Save size={20} />
                <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
              </button>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] border border-brand-border shadow-sm space-y-6">
            <h4 className="text-2xl font-serif italic text-stone-900 flex items-center">
              <Shield className="mr-3 text-brand-purple" size={24} />
              Privacidade e Segurança
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-brand-gray rounded-2xl">
                <div>
                  <p className="font-bold text-stone-700 text-sm">Backup Automático</p>
                  <p className="text-xs text-stone-400">Seus dados são salvos na nuvem a cada alteração.</p>
                </div>
                <div className="w-12 h-6 bg-emerald-500 rounded-full relative">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
