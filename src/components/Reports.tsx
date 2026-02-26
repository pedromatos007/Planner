import React, { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import { TrendingUp, Wallet, Heart, Calendar } from 'lucide-react';

const COLORS = ['#2e1065', '#4c1d95', '#6d28d9', '#8b5cf6', '#a78bfa', '#c4b5fd'];

export default function Reports() {
  const [financeData, setFinanceData] = useState<any[]>([]);
  const [moodData, setMoodData] = useState<any[]>([]);
  const [habitData, setHabitData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const email = localStorage.getItem('userEmail');
        const headers = { 'x-user-email': email || '' };
        
        const [financeRes, moodRes, habitsRes] = await Promise.all([
          fetch('/api/finance', { headers }),
          fetch('/api/mood', { headers }),
          fetch('/api/habits', { headers })
        ]);
        
        const finance = await financeRes.json();
        const mood = await moodRes.json();
        const habits = await habitsRes.json();

        // Process Finance for Pie Chart
        const categoryTotals = finance.reduce((acc: any, curr: any) => {
          if (curr.type === 'expense') {
            acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
          }
          return acc;
        }, {});
        
        const pieData = Object.keys(categoryTotals).map(cat => ({
          name: cat.charAt(0).toUpperCase() + cat.slice(1),
          value: categoryTotals[cat]
        }));

        // Process Mood for Line Chart
        const moodMap: Record<string, number> = { happy: 5, calm: 4, neutral: 3, sad: 2, angry: 1 };
        const lineData = mood.slice(0, 10).reverse().map((m: any) => ({
          date: new Date(m.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
          nivel: moodMap[m.mood] || 3
        }));

        // Process Habits for Bar Chart
        const barData = habits.map((h: any) => ({
          name: h.name,
          completions: h.completedDates.length
        }));

        setFinanceData(pieData);
        setMoodData(lineData);
        setHabitData(barData);
      } catch (error) {
        console.error('Error fetching report data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-12">
      <header>
        <h2 className="text-5xl font-serif italic text-stone-900">Relatórios Analíticos</h2>
        <p className="text-stone-400 mt-2 font-medium">
          Visualize seu progresso e identifique padrões para uma vida mais equilibrada.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Finance Pie Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-brand-border shadow-sm">
          <h3 className="text-2xl font-serif italic text-stone-900 mb-8 flex items-center">
            <Wallet className="mr-3 text-brand-purple" size={24} />
            Gastos por Categoria
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={financeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {financeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {financeData.map((entry, index) => (
              <div key={entry.name} className="flex items-center text-xs text-stone-500">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="font-medium">{entry.name}: R$ {entry.value.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mood Evolution Line Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-brand-border shadow-sm">
          <h3 className="text-2xl font-serif italic text-stone-900 mb-8 flex items-center">
            <Heart className="mr-3 text-rose-500" size={24} />
            Evolução do Humor
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={moodData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a8a29e' }} />
                <YAxis hide domain={[0, 6]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="nivel" 
                  stroke="#2e1065" 
                  strokeWidth={3} 
                  dot={{ r: 6, fill: '#2e1065', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-4">
            Escala: 1 (Irritado) a 5 (Feliz)
          </p>
        </div>

        {/* Habit Completion Bar Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-brand-border shadow-sm lg:col-span-2">
          <h3 className="text-2xl font-serif italic text-stone-900 mb-8 flex items-center">
            <TrendingUp className="mr-3 text-emerald-500" size={24} />
            Desempenho de Hábitos
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={habitData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a8a29e' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a8a29e' }} />
                <Tooltip 
                  cursor={{ fill: '#f5f5f4' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="completions" fill="#2e1065" radius={[10, 10, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
