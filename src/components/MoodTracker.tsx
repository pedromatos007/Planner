import React, { useState, useEffect } from 'react';
import { 
  Smile, 
  Meh, 
  Frown, 
  Heart, 
  Sun, 
  Cloud, 
  CloudRain, 
  Zap,
  Save,
  Trash2
} from 'lucide-react';
import { motion } from 'motion/react';
import { sendNotification } from '../services/notificationService';

const MOODS = [
  { id: 'happy', icon: Smile, label: 'Feliz', color: 'text-emerald-500 bg-emerald-50' },
  { id: 'calm', icon: Sun, label: 'Calmo', color: 'text-blue-500 bg-blue-50' },
  { id: 'neutral', icon: Meh, label: 'Neutro', color: 'text-stone-500 bg-stone-50' },
  { id: 'sad', icon: Frown, label: 'Triste', color: 'text-indigo-500 bg-indigo-50' },
  { id: 'angry', icon: Zap, label: 'Irritado', color: 'text-rose-500 bg-rose-50' },
];

export default function MoodTracker() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchMoodHistory();
  }, []);

  const fetchMoodHistory = async () => {
    try {
      const email = localStorage.getItem('userEmail');
      const res = await fetch('/api/mood', {
        headers: { 'x-user-email': email || '' }
      });
      const data = await res.json();
      setHistory(data);
    } catch (error) {
      console.error('Error fetching mood history:', error);
    }
  };

  const handleSaveMood = async () => {
    if (!selectedMood) return;
    setIsSaving(true);
    try {
      const email = localStorage.getItem('userEmail');
      const newEntry = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        mood: selectedMood,
        note
      };
      const res = await fetch('/api/mood', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': email || ''
        },
        body: JSON.stringify(newEntry)
      });
      if (res.ok) {
        const moodLabel = MOODS.find(m => m.id === selectedMood)?.label;
        setSelectedMood(null);
        setNote('');
        fetchMoodHistory();
        sendNotification(
          'Humor Registrado',
          `Você registrou que está se sentindo "${moodLabel}" agora.`,
          'mood'
        );
      }
    } catch (error) {
      console.error('Error saving mood:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteMoodEntry = async (id: string) => {
    if (!confirm('Excluir este registro de humor?')) return;
    try {
      const email = localStorage.getItem('userEmail');
      const res = await fetch(`/api/mood/${id}`, { 
        method: 'DELETE',
        headers: { 'x-user-email': email || '' }
      });
      if (res.ok) fetchMoodHistory();
    } catch (error) {
      console.error('Error deleting mood entry:', error);
    }
  };

  return (
    <div className="space-y-12 max-w-4xl mx-auto">
      <header className="text-center space-y-4">
        <h2 className="text-5xl font-serif italic text-stone-900">Controle Emocional</h2>
        <p className="text-stone-500 text-lg font-medium">
          Como você está se sentindo neste momento? Respire e observe.
        </p>
      </header>

      <div className="bg-white p-12 rounded-[3rem] border border-brand-border shadow-xl shadow-stone-200/30 space-y-12">
        <div className="space-y-8">
          <h3 className="text-2xl font-serif italic text-center text-stone-800">Check-in Diário</h3>
          <div className="flex justify-center gap-6 flex-wrap">
            {MOODS.map((mood) => {
              const Icon = mood.icon;
              const isSelected = selectedMood === mood.id;
              
              return (
                <button
                  key={mood.id}
                  onClick={() => setSelectedMood(mood.id)}
                  className={`flex flex-col items-center p-6 rounded-3xl transition-all duration-300 group ${
                    isSelected 
                      ? `${mood.color} scale-110 shadow-xl shadow-stone-200/50` 
                      : 'hover:bg-brand-gray text-stone-400'
                  }`}
                >
                  <Icon size={48} strokeWidth={1.2} className={isSelected ? 'animate-bounce' : 'group-hover:scale-110 transition-transform'} />
                  <span className="mt-3 font-bold text-[10px] uppercase tracking-[0.2em]">{mood.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] ml-2">Notas sobre o seu estado</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="O que está influenciando seu humor hoje?"
            className="w-full p-8 rounded-3xl bg-brand-gray border border-brand-border focus:ring-8 focus:ring-brand-purple/5 focus:border-brand-purple/20 transition-all min-h-[160px] text-stone-700 font-medium outline-none placeholder:text-stone-300"
          />
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleSaveMood}
            disabled={!selectedMood || isSaving}
            className="flex items-center space-x-3 px-12 py-5 bg-brand-purple text-white rounded-full font-serif italic text-xl shadow-2xl shadow-brand-purple/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
          >
            <Save size={24} />
            <span>{isSaving ? 'Salvando...' : 'Registrar Momento'}</span>
          </button>
        </div>
      </div>

      <div className="space-y-8">
        <h3 className="text-3xl font-serif italic text-stone-900">Histórico Recente</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {history.length === 0 ? (
            <div className="col-span-full p-12 text-center text-stone-400 italic bg-brand-gray rounded-3xl border border-dashed border-brand-border">
              Nenhum registro emocional ainda. Comece hoje!
            </div>
          ) : (
            history.map((entry) => {
              const moodData = MOODS.find(m => m.id === entry.mood) || MOODS[2];
              const MoodIcon = moodData.icon;
              const date = new Date(entry.date).toLocaleDateString('pt-BR', { 
                day: 'numeric', 
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={entry.id} 
                  className="bg-white p-6 rounded-3xl border border-brand-border shadow-sm flex items-start space-x-4"
                >
                  <div className={`p-4 rounded-2xl ${moodData.color}`}>
                    <MoodIcon size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <span className="font-serif italic text-lg text-stone-800">{moodData.label}</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-[10px] text-stone-400 font-mono uppercase tracking-widest">{date}</span>
                        <button 
                          onClick={() => deleteMoodEntry(entry.id)}
                          className="text-stone-300 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="text-stone-500 text-sm mt-2 line-clamp-2 font-medium italic">
                      "{entry.note || 'Sem notas registradas'}"
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
