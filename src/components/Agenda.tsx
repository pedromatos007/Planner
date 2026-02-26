import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Check, 
  Trash2, 
  Calendar, 
  Clock, 
  Tag,
  Search,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sendNotification } from '../services/notificationService';

const CATEGORIES = [
  { id: 'work', label: 'Trabalho', color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { id: 'personal', label: 'Pessoal', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  { id: 'health', label: 'Saúde', color: 'bg-rose-50 text-rose-600 border-rose-100' },
  { id: 'study', label: 'Estudo', color: 'bg-amber-50 text-amber-600 border-amber-100' },
];

export default function Agenda() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('personal');
  const [filter, setFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'tomorrow' | 'all'>('today');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const email = localStorage.getItem('userEmail');
      const res = await fetch('/api/tasks', {
        headers: { 'x-user-email': email || '' }
      });
      const data = await res.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const targetDate = new Date();
    if (dateFilter === 'tomorrow') targetDate.setDate(targetDate.getDate() + 1);
    
    try {
      const email = localStorage.getItem('userEmail');
      const newTask = {
        id: crypto.randomUUID(),
        title: newTaskTitle,
        completed: false,
        date: targetDate.toISOString(),
        category: selectedCategory
      };

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': email || ''
        },
        body: JSON.stringify(newTask)
      });

      if (res.ok) {
        setNewTaskTitle('');
        fetchTasks();
        sendNotification(
          'Nova Tarefa',
          `Você adicionou a tarefa: "${newTaskTitle}"`,
          'task'
        );
      }
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const toggleTask = async (id: string, completed: boolean) => {
    try {
      const email = localStorage.getItem('userEmail');
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': email || ''
        },
        body: JSON.stringify({ completed: !completed })
      });
      if (res.ok) {
        fetchTasks();
        if (!completed) {
          const task = tasks.find(t => t.id === id);
          sendNotification(
            'Tarefa Concluída',
            `Parabéns! Você concluiu: "${task?.title}"`,
            'task'
          );
        }
      }
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const email = localStorage.getItem('userEmail');
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-email': email || '' }
      });
      if (res.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const statusMatch = filter === 'all' ? true : filter === 'completed' ? task.completed : !task.completed;
    
    if (dateFilter === 'all') return statusMatch;
    
    const taskDate = new Date(task.date).toDateString();
    const today = new Date().toDateString();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toDateString();

    if (dateFilter === 'today') return statusMatch && taskDate === today;
    if (dateFilter === 'tomorrow') return statusMatch && taskDate === tomorrowStr;
    
    return statusMatch;
  });

  return (
    <div className="space-y-12 max-w-5xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-5xl font-serif italic text-stone-900">Agenda Diária</h2>
          <div className="flex items-center space-x-4 mt-4">
            {['today', 'tomorrow', 'all'].map((df) => (
              <button
                key={df}
                onClick={() => setDateFilter(df as any)}
                className={`text-[10px] font-bold uppercase tracking-widest transition-all ${
                  dateFilter === df ? 'text-brand-purple underline underline-offset-8' : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                {df === 'today' ? 'Hoje' : df === 'tomorrow' ? 'Amanhã' : 'Tudo'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex bg-brand-gray p-1.5 rounded-2xl border border-brand-border">
          {['all', 'pending', 'completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                filter === f 
                  ? 'bg-white text-stone-900 shadow-sm border border-brand-border' 
                  : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendentes' : 'Concluídas'}
            </button>
          ))}
        </div>
      </header>

      <div className="bg-white p-10 rounded-[3rem] border border-brand-border shadow-xl shadow-stone-200/20 space-y-10">
        <form onSubmit={handleAddTask} className="flex space-x-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="O que precisa ser feito hoje?"
              className="w-full pl-14 pr-6 py-5 rounded-3xl bg-brand-gray border border-brand-border focus:ring-8 focus:ring-brand-purple/5 focus:border-brand-purple/20 transition-all outline-none font-medium text-lg placeholder:text-stone-300"
            />
            <Plus className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-400" size={24} />
          </div>
          <div className="flex bg-brand-gray p-1.5 rounded-3xl border border-brand-border">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                  selectedCategory === cat.id 
                    ? `${cat.color} shadow-sm border` 
                    : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <button
            type="submit"
            className="px-8 py-5 bg-brand-purple text-white rounded-3xl font-serif italic text-xl shadow-xl shadow-brand-purple/20 hover:scale-105 active:scale-95 transition-all"
          >
            Adicionar
          </button>
        </form>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredTasks.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-20 text-center text-stone-400 italic bg-brand-gray rounded-3xl border border-dashed border-brand-border"
              >
                Nenhuma tarefa encontrada.
              </motion.div>
            ) : (
              filteredTasks.map((task) => {
                const category = CATEGORIES.find(c => c.id === task.category) || CATEGORIES[1];
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={task.id}
                    className={`group flex items-center p-6 rounded-3xl border transition-all duration-300 ${
                      task.completed 
                        ? 'bg-brand-gray/50 border-brand-border opacity-60' 
                        : 'bg-white border-brand-border hover:shadow-md hover:border-brand-purple/20'
                    }`}
                  >
                    <button
                      onClick={() => toggleTask(task.id, task.completed)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all ${
                        task.completed 
                          ? 'bg-brand-purple border-brand-purple text-white' 
                          : 'border-stone-200 text-transparent hover:border-brand-purple'
                      }`}
                    >
                      <Check size={18} strokeWidth={3} />
                    </button>
                    
                    <div className="ml-6 flex-1">
                      <div className="flex items-center space-x-3">
                        <span className={`text-lg font-medium transition-all ${task.completed ? 'line-through text-stone-400' : 'text-stone-700'}`}>
                          {task.title}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${category.color}`}>
                          {category.label}
                        </span>
                      </div>
                      <div className="flex items-center mt-1 space-x-4 text-xs text-stone-400 font-medium">
                        <div className="flex items-center">
                          <Clock size={12} className="mr-1" />
                          <span>Hoje</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-3 text-stone-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={20} />
                    </button>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
