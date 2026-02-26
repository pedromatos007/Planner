import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  Heart, 
  Wallet, 
  Calendar, 
  Trash2, 
  Check,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const email = localStorage.getItem('userEmail');
      const res = await fetch('/api/notifications', {
        headers: { 'x-user-email': email || '' }
      });
      const data = await res.json();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const email = localStorage.getItem('userEmail');
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'x-user-email': email || '' }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        window.dispatchEvent(new Event('notification-update'));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const clearAll = async () => {
    if (!confirm('Deseja limpar todas as notificações?')) return;
    try {
      const email = localStorage.getItem('userEmail');
      const res = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'x-user-email': email || '' }
      });
      if (res.ok) {
        setNotifications([]);
        window.dispatchEvent(new Event('notification-update'));
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task': return <CheckCircle2 className="text-emerald-500" size={20} />;
      case 'mood': return <Heart className="text-rose-500" size={20} />;
      case 'finance': return <Wallet className="text-blue-500" size={20} />;
      case 'habit': return <Calendar className="text-brand-purple" size={20} />;
      default: return <Bell className="text-stone-400" size={20} />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-5xl font-serif italic text-stone-900">Notificações</h2>
          <p className="text-stone-400 mt-2 font-medium">Acompanhe as atualizações da sua jornada.</p>
        </div>
        {notifications.length > 0 && (
          <button 
            onClick={clearAll}
            className="flex items-center space-x-2 px-6 py-3 bg-rose-50 text-rose-500 rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-rose-100 transition-colors"
          >
            <Trash2 size={14} />
            <span>Limpar Tudo</span>
          </button>
        )}
      </header>

      <div className="bg-white rounded-[2.5rem] border border-brand-border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-20 text-center text-stone-400 italic">Carregando notificações...</div>
        ) : notifications.length === 0 ? (
          <div className="p-20 text-center space-y-4">
            <div className="w-20 h-20 bg-brand-gray rounded-full flex items-center justify-center mx-auto text-stone-300">
              <Bell size={40} />
            </div>
            <p className="text-stone-400 italic">Você não tem novas notificações no momento.</p>
          </div>
        ) : (
          <div className="divide-y divide-brand-border/50">
            <AnimatePresence mode="popLayout">
              {notifications.map((n) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  key={n.id} 
                  className={`p-8 flex items-start space-x-6 transition-colors ${n.read ? 'bg-white' : 'bg-brand-purple/5'}`}
                >
                  <div className={`p-4 rounded-2xl bg-white border border-brand-border shadow-sm`}>
                    {getTypeIcon(n.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <h4 className={`font-serif italic text-xl ${n.read ? 'text-stone-600' : 'text-stone-900'}`}>{n.title}</h4>
                      <span className="text-[10px] text-stone-400 font-mono uppercase tracking-widest flex items-center">
                        <Clock size={10} className="mr-1" />
                        {new Date(n.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className={`text-sm font-medium ${n.read ? 'text-stone-400' : 'text-stone-600'}`}>{n.message}</p>
                    {!n.read && (
                      <button 
                        onClick={() => markAsRead(n.id)}
                        className="mt-4 flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-brand-purple hover:underline"
                      >
                        <Check size={12} />
                        <span>Marcar como lida</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
