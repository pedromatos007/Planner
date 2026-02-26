import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Check, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sendNotification } from '../services/notificationService';

export default function HabitTracker() {
  const [habits, setHabits] = useState<any[]>([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Get current week dates
  const getWeekDates = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(now.setDate(diff));
    
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().split('T')[0];
    });
  };

  const weekDates = getWeekDates();

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const email = localStorage.getItem('userEmail');
      const res = await fetch('/api/habits', {
        headers: { 'x-user-email': email || '' }
      });
      const data = await res.json();
      setHabits(data);
    } catch (error) {
      console.error('Error fetching habits:', error);
    }
  };

  const handleAddHabit = async () => {
    if (!newHabitName.trim()) return;
    try {
      const email = localStorage.getItem('userEmail');
      const newHabit = {
        id: crypto.randomUUID(),
        name: newHabitName,
        color: 'brand-purple',
        completedDates: []
      };
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': email || ''
        },
        body: JSON.stringify(newHabit)
      });
      if (res.ok) {
        setNewHabitName('');
        setShowAddModal(false);
        fetchHabits();
        sendNotification(
          'Novo Hábito',
          `Você começou o hábito: "${newHabitName}"`,
          'habit'
        );
      }
    } catch (error) {
      console.error('Error adding habit:', error);
    }
  };

  const toggleHabit = async (habitId: string, date: string) => {
    try {
      const email = localStorage.getItem('userEmail');
      const res = await fetch(`/api/habits/${habitId}/toggle`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': email || ''
        },
        body: JSON.stringify({ date })
      });
      if (res.ok) {
        fetchHabits();
        const habit = habits.find(h => h.id === habitId);
        const isNowCompleted = !habit.completedDates.includes(date);
        if (isNowCompleted) {
          sendNotification(
            'Hábito Concluído',
            `Você completou o hábito "${habit?.name}" hoje!`,
            'habit'
          );
        }
      }
    } catch (error) {
      console.error('Error toggling habit:', error);
    }
  };

  const calculateStreak = (completedDates: string[]) => {
    if (!completedDates || completedDates.length === 0) return 0;
    
    const sortedDates = [...completedDates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const lastCompleted = new Date(sortedDates[0]);
    lastCompleted.setHours(0, 0, 0, 0);
    
    const diffTime = currentDate.getTime() - lastCompleted.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 1) return 0;

    for (let i = 0; i < sortedDates.length; i++) {
      const date = new Date(sortedDates[i]);
      date.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(lastCompleted);
      expectedDate.setDate(lastCompleted.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);

      if (date.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const deleteHabit = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este hábito?')) return;
    try {
      const email = localStorage.getItem('userEmail');
      const res = await fetch(`/api/habits/${id}`, { 
        method: 'DELETE',
        headers: { 'x-user-email': email || '' }
      });
      if (res.ok) fetchHabits();
    } catch (error) {
      console.error('Error deleting habit:', error);
    }
  };

  return (
    <div className="space-y-12">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-5xl font-serif italic text-stone-900">Rastreador de Hábitos</h2>
          <p className="text-stone-400 mt-2 font-medium">
            Pequenas ações diárias levam a grandes transformações.
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-brand-purple text-white rounded-full font-medium shadow-lg shadow-brand-purple/20 hover:scale-105 transition-transform"
        >
          <Plus size={20} />
          <span>Novo Hábito</span>
        </button>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-brand-border shadow-sm overflow-hidden">
        <div className="grid grid-cols-[1fr_repeat(7,80px)] border-b border-brand-border">
          <div className="p-8 font-serif italic text-xl text-stone-800">Hábito</div>
          {weekDates.map((date) => {
            const d = new Date(date);
            const isToday = new Date().toISOString().split('T')[0] === date;
            return (
              <div key={date} className={`flex flex-col items-center justify-center p-4 border-l border-brand-border/50 ${isToday ? 'bg-brand-purple-light' : ''}`}>
                <span className="text-[10px] uppercase tracking-widest font-bold text-stone-400">
                  {d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                </span>
                <span className={`text-lg font-serif italic mt-1 ${isToday ? 'text-brand-purple' : 'text-stone-700'}`}>
                  {d.getDate()}
                </span>
              </div>
            );
          })}
        </div>

        <div className="divide-y divide-brand-border/50">
          {habits.length === 0 ? (
            <div className="p-20 text-center text-stone-400 italic">
              Você ainda não cadastrou nenhum hábito. Comece agora!
            </div>
          ) : (
            habits.map((habit) => {
              const streak = calculateStreak(habit.completedDates);
              return (
                <div key={habit.id} className="grid grid-cols-[1fr_repeat(7,80px)] group hover:bg-brand-gray/50 transition-colors">
                  <div className="p-8 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button 
                        onClick={() => deleteHabit(habit.id)}
                        className="text-stone-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                      <span className="font-medium text-stone-700 text-lg">{habit.name}</span>
                    </div>
                    {streak > 0 && (
                      <div className="flex items-center space-x-2 text-orange-500 bg-orange-50 px-3 py-1 rounded-full">
                        <Flame size={14} />
                        <span className="text-xs font-bold">{streak} {streak === 1 ? 'dia' : 'dias'}</span>
                      </div>
                    )}
                  </div>
                  {weekDates.map((date) => {
                    const isCompleted = habit.completedDates.includes(date);
                    return (
                      <div key={date} className="flex items-center justify-center border-l border-brand-border/50 p-4">
                        <button
                          onClick={() => toggleHabit(habit.id, date)}
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                            isCompleted 
                              ? 'bg-brand-purple text-white shadow-xl shadow-brand-purple/20 rotate-0' 
                              : 'bg-brand-gray text-transparent hover:bg-stone-200 rotate-12'
                          }`}
                        >
                          <Check size={20} strokeWidth={3} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl border border-brand-border"
            >
              <h3 className="text-3xl font-serif italic text-stone-900 mb-6">Novo Hábito</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-2 ml-1">Nome do Hábito</label>
                  <input
                    autoFocus
                    type="text"
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    placeholder="Ex: Meditar, Ler 20 min..."
                    className="w-full p-4 rounded-2xl bg-brand-gray border border-brand-border focus:ring-8 focus:ring-brand-purple/5 focus:border-brand-purple/20 transition-all outline-none font-medium"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-4 text-stone-500 font-medium hover:bg-brand-gray rounded-2xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddHabit}
                    className="flex-1 py-4 bg-brand-purple text-white font-medium rounded-2xl shadow-xl shadow-brand-purple/20 hover:scale-105 transition-transform"
                  >
                    Criar Hábito
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
