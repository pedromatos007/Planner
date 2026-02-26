import React from 'react';
import { 
  LayoutDashboard, 
  Heart, 
  CheckCircle2, 
  Calendar, 
  Wallet,
  Settings,
  LogOut,
  BarChart3,
  Bell,
  Sun,
  Moon
} from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const [isDark, setIsDark] = React.useState(document.documentElement.classList.contains('dark'));
  const [userName, setUserName] = React.useState(localStorage.getItem('userName') || 'Usuário');
  const [userAvatar, setUserAvatar] = React.useState(localStorage.getItem('userAvatar') || '');
  const [unreadCount, setUnreadCount] = React.useState(0);

  const fetchUnreadCount = async () => {
    try {
      const email = localStorage.getItem('userEmail');
      if (!email) return;
      const res = await fetch('/api/notifications', {
        headers: { 'x-user-email': email }
      });
      const data = await res.json();
      setUnreadCount(data.filter((n: any) => !n.read).length);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  React.useEffect(() => {
    fetchUnreadCount();
    const handleStorage = () => {
      setUserName(localStorage.getItem('userName') || 'Usuário');
      setUserAvatar(localStorage.getItem('userAvatar') || '');
      fetchUnreadCount();
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('notification-update', fetchUnreadCount);
    
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30s
    
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('notification-update', fetchUnreadCount);
      clearInterval(interval);
    };
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'mood', label: 'Humor', icon: Heart },
    { id: 'habits', label: 'Hábitos', icon: CheckCircle2 },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'finance', label: 'Finanças', icon: Wallet },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-brand-gray border-r border-brand-border flex flex-col h-full transition-colors duration-300">
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-serif italic text-brand-purple tracking-tight">
              +Cura
            </h1>
            <p className="text-[10px] text-stone-400 mt-1 uppercase tracking-[0.2em] font-bold">
              Planner Pessoal
            </p>
          </div>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`p-2 transition-colors relative ${activeTab === 'notifications' ? 'text-brand-purple' : 'text-stone-400 hover:text-brand-purple'}`}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full border-2 border-brand-gray">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center space-x-3 p-3 bg-white rounded-2xl border border-brand-border shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-brand-purple-light overflow-hidden">
            <img 
              src={userAvatar || `https://picsum.photos/seed/${localStorage.getItem('userEmail')}/100`} 
              alt="Avatar" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-stone-900 truncate">{userName}</p>
            <p className="text-[10px] text-stone-400 truncate">{localStorage.getItem('userEmail')}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                isActive 
                  ? 'bg-brand-purple text-white shadow-xl shadow-brand-purple/10' 
                  : 'text-stone-500 hover:bg-stone-200/50'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-brand-border space-y-2">
        <button 
          onClick={toggleTheme}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-stone-400 hover:text-stone-600 transition-colors"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
          <span className="font-medium">{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
        </button>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-stone-400 hover:text-red-500 transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </aside>
  );
}
