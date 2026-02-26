import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  Heart,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import { getAIInsight } from '../services/geminiService';
import Markdown from 'react-markdown';

export default function Dashboard() {
  const [stats, setStats] = useState({
    tasks: 0,
    habits: 0,
    mood: 'Equilibrado',
    finance: 0
  });
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [recentFinance, setRecentFinance] = useState<any[]>([]);
  const [moodTrend, setMoodTrend] = useState<number[]>([]);
  const [aiInsight, setAiInsight] = useState<string>('Analisando seus dados para gerar insights...');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const email = localStorage.getItem('userEmail') || '';
        const headers = { 'x-user-email': email };
        
        const [tasksRes, habitsRes, financeRes, moodRes] = await Promise.all([
          fetch('/api/tasks', { headers }),
          fetch('/api/habits', { headers }),
          fetch('/api/finance', { headers }),
          fetch('/api/mood', { headers })
        ]);
        
        const tasks = await tasksRes.json();
        const habits = await habitsRes.json();
        const finance = await financeRes.json();
        const moodEntries = await moodRes.json();

        const completedTasks = tasks.filter((t: any) => t.completed).length;
        const totalBalance = finance.reduce((acc: number, curr: any) => 
          curr.type === 'income' ? acc + curr.amount : acc - curr.amount, 0);

        // Mood mapping for trend
        const moodMap: Record<string, number> = { happy: 90, calm: 75, neutral: 50, sad: 30, angry: 20 };
        const trend = moodEntries.slice(0, 7).reverse().map((m: any) => moodMap[m.mood] || 50);

        const moodMapDisplay: Record<string, string> = { 
          happy: 'Ótimo', 
          calm: 'Calmo', 
          neutral: 'Estável', 
          sad: 'Para baixo', 
          angry: 'Irritado' 
        };

        setStats({
          tasks: completedTasks,
          habits: habits.length,
          mood: moodEntries[0] ? (moodMapDisplay[moodEntries[0].mood] || 'Estável') : 'Sem dados',
          finance: totalBalance
        });

        setRecentTasks(tasks.filter((t: any) => !t.completed).slice(0, 3));
        setRecentFinance(finance.slice(0, 2));
        setMoodTrend(trend.length > 0 ? trend : [40, 60, 45, 70, 55, 80, 65]);

        // Get AI Insight
        const insight = await getAIInsight({
          tasks,
          habits,
          mood: moodEntries,
          finance,
          userName: localStorage.getItem('userName') || 'Usuário'
        });
        setAiInsight(insight || '');
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    fetchStats();
  }, []);

  const today = new Date().toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  return (
    <div className="space-y-12">
      <header className="flex justify-between items-end">
        <div>
          <span className="text-brand-purple font-medium uppercase tracking-widest text-xs">
            Bem-vindo de volta
          </span>
          <h2 className="text-5xl font-serif italic text-stone-900 mt-2">
            Bom dia, {localStorage.getItem('userName') || 'Usuário'}
          </h2>
          <p className="text-stone-400 mt-2 font-medium capitalize">
            {today}
          </p>
        </div>
        <div className="flex -space-x-2">
          {[1, 2, 3].map((i) => (
            <div 
              key={i}
              className="w-10 h-10 rounded-full border-2 border-white bg-stone-100 overflow-hidden"
            >
              <img 
                src={`https://picsum.photos/seed/${i + 10}/40/40`} 
                alt="User" 
                referrerPolicy="no-referrer"
              />
            </div>
          ))}
        </div>
      </header>

      {/* AI Insight Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-brand-purple-light p-8 rounded-[2.5rem] border border-brand-purple/10 flex items-start space-x-6 relative overflow-hidden"
      >
        <div className="p-4 bg-brand-purple text-white rounded-2xl shadow-lg">
          <Sparkles size={24} />
        </div>
        <div className="flex-1">
          <h3 className="text-brand-purple font-serif italic text-xl mb-2">Insight do Mentor +Cura</h3>
          <div className="text-brand-purple/80 font-medium leading-relaxed prose prose-stone">
            <Markdown>{aiInsight}</Markdown>
          </div>
        </div>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-brand-purple/5 rounded-full blur-3xl" />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Tarefas Concluídas" 
          value={stats.tasks} 
          icon={CheckCircle2} 
          color="bg-emerald-50 text-emerald-600" 
        />
        <StatCard 
          title="Hábitos Ativos" 
          value={stats.habits} 
          icon={TrendingUp} 
          color="bg-brand-purple-light text-brand-purple" 
        />
        <StatCard 
          title="Estado de Humor" 
          value={stats.mood} 
          icon={Heart} 
          color="bg-rose-50 text-rose-500" 
        />
        <StatCard 
          title="Saldo Financeiro" 
          value={`R$ ${stats.finance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          icon={Calendar} 
          color="bg-blue-50 text-blue-600" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-brand-border shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-serif italic text-stone-900">Foco para hoje</h3>
              <button className="text-brand-purple font-bold text-xs uppercase tracking-widest hover:underline">Ver agenda</button>
            </div>
            <div className="space-y-4">
              {recentTasks.length === 0 ? (
                <div className="p-8 text-center text-stone-400 italic bg-brand-gray/30 rounded-2xl border border-dashed border-brand-border">
                  Nenhuma tarefa pendente para hoje.
                </div>
              ) : (
                recentTasks.map((task) => (
                  <div key={task.id} className="flex items-center p-4 rounded-2xl bg-brand-gray/50 border border-brand-border/50 group hover:bg-white hover:shadow-md transition-all duration-300">
                    <div className="w-6 h-6 rounded-full border-2 border-stone-300 mr-4 group-hover:border-brand-purple transition-colors" />
                    <span className="text-stone-700 font-medium">{task.title}</span>
                    <span className="ml-auto text-xs text-stone-400 font-mono uppercase">{task.category}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-brand-purple p-8 rounded-3xl text-white shadow-2xl shadow-brand-purple/20 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-serif italic mb-4">Tendência de Humor</h3>
              <div className="flex items-end space-x-2 h-24">
                {moodTrend.map((h, i) => (
                  <div 
                    key={i} 
                    className="flex-1 bg-white/10 rounded-t-lg hover:bg-white/30 transition-colors"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <p className="mt-4 text-white/60 text-xs font-medium uppercase tracking-wider">
                {stats.mood === 'Sem dados' ? 'Comece a registrar seu humor!' : 'Seu humor nos últimos dias.'}
              </p>
            </div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
          </div>

          <div className="bg-white p-8 rounded-3xl border border-brand-border shadow-sm">
            <h3 className="text-xl font-serif italic mb-6">Finanças Recentes</h3>
            <div className="space-y-4">
              {recentFinance.length === 0 ? (
                <p className="text-stone-400 italic text-sm text-center py-4">Sem transações recentes.</p>
              ) : (
                recentFinance.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-xl mr-3 ${entry.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                        {entry.type === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      </div>
                      <span className="text-sm font-medium text-stone-700 truncate max-w-[100px]">{entry.description}</span>
                    </div>
                    <span className={`text-sm font-mono ${entry.type === 'income' ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {entry.type === 'income' ? '+' : '-'} R$ {entry.amount.toFixed(0)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm flex flex-col justify-between h-40"
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-stone-400 text-xs font-medium uppercase tracking-widest">{title}</p>
        <h4 className="text-2xl font-serif italic text-stone-900 mt-1">{value}</h4>
      </div>
    </motion.div>
  );
}
