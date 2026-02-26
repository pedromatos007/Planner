import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  PieChart, 
  TrendingUp,
  Filter,
  MoreHorizontal,
  Trash2,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sendNotification } from '../services/notificationService';

const CATEGORIES = [
  { id: 'food', label: 'Alimentação', icon: '🍎' },
  { id: 'transport', label: 'Transporte', icon: '🚗' },
  { id: 'leisure', label: 'Lazer', icon: '🎬' },
  { id: 'bills', label: 'Contas', icon: '📄' },
  { id: 'salary', label: 'Salário', icon: '💰' },
  { id: 'other', label: 'Outros', icon: '✨' },
];

export default function Finance() {
  const [entries, setEntries] = useState<any[]>([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('other');
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchFinance();
  }, []);

  const fetchFinance = async () => {
    try {
      const email = localStorage.getItem('userEmail');
      const res = await fetch('/api/finance', {
        headers: { 'x-user-email': email || '' }
      });
      const data = await res.json();
      setEntries(data);
    } catch (error) {
      console.error('Error fetching finance:', error);
    }
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const email = localStorage.getItem('userEmail');
      const newEntry = {
        id: crypto.randomUUID(),
        description: description.trim(),
        amount: parseFloat(amount),
        type,
        date: new Date().toISOString(),
        category
      };

      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': email || ''
        },
        body: JSON.stringify(newEntry)
      });

      if (res.ok) {
        setDescription('');
        setAmount('');
        setCategory('other');
        await fetchFinance();
        sendNotification(
          type === 'income' ? 'Nova Receita' : 'Nova Despesa',
          `Registro de R$ ${parseFloat(amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}: "${description}"`,
          'finance'
        );
      }
    } catch (error) {
      console.error('Error adding finance entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('Excluir esta transação?')) return;
    try {
      const email = localStorage.getItem('userEmail');
      const res = await fetch(`/api/finance/${id}`, { 
        method: 'DELETE',
        headers: { 'x-user-email': email || '' }
      });
      if (res.ok) fetchFinance();
    } catch (error) {
      console.error('Error deleting finance entry:', error);
    }
  };

  const exportToCSV = () => {
    const headers = ['Data', 'Descrição', 'Tipo', 'Categoria', 'Valor'];
    const rows = entries.map(e => [
      new Date(e.date).toLocaleDateString('pt-BR'),
      e.description,
      e.type === 'income' ? 'Receita' : 'Despesa',
      e.category,
      e.amount.toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `financeiro_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredEntries = entries.filter(e => {
    if (filter === 'all') return true;
    return e.type === filter;
  });

  const totalIncome = entries
    .filter(e => e.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);
  
  const totalExpense = entries
    .filter(e => e.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);
  
  const balance = totalIncome - totalExpense;

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-5xl font-serif italic text-stone-900">Gestão Financeira</h2>
          <p className="text-stone-400 mt-2 font-medium">
            Mantenha suas finanças em equilíbrio para uma vida mais tranquila.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-brand-gray p-1 rounded-2xl border border-brand-border">
            {['all', 'income', 'expense'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                  filter === f 
                    ? 'bg-white text-stone-900 shadow-sm border border-brand-border' 
                    : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                {f === 'all' ? 'Tudo' : f === 'income' ? 'Receitas' : 'Despesas'}
              </button>
            ))}
          </div>
          <button 
            onClick={exportToCSV}
            className="flex items-center space-x-2 px-6 py-3 bg-white border border-brand-border rounded-2xl text-[10px] font-bold uppercase tracking-widest text-stone-500 hover:text-brand-purple hover:border-brand-purple transition-all"
          >
            <Download size={16} />
            <span>Exportar CSV</span>
          </button>
          <div className="bg-white px-6 py-3 rounded-2xl border border-brand-border shadow-sm">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] block mb-1">Saldo Total</span>
            <span className={`text-2xl font-serif italic ${balance >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
              R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-brand-border shadow-xl shadow-stone-200/20">
            <h3 className="text-2xl font-serif italic text-stone-900 mb-8">Novo Registro</h3>
            <form onSubmit={handleAddEntry} className="space-y-6">
              <div className="flex bg-brand-gray p-1.5 rounded-2xl border border-brand-border">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                    type === 'expense' 
                      ? 'bg-rose-500 text-white shadow-md' 
                      : 'text-stone-400 hover:text-stone-600'
                  }`}
                >
                  Despesa
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                    type === 'income' 
                      ? 'bg-emerald-500 text-white shadow-md' 
                      : 'text-stone-400 hover:text-stone-600'
                  }`}
                >
                  Receita
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] ml-1">Descrição</label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Aluguel, Supermercado..."
                    className="w-full p-4 rounded-2xl bg-brand-gray border border-brand-border focus:ring-8 focus:ring-brand-purple/5 focus:border-brand-purple/20 transition-all outline-none font-medium placeholder:text-stone-300"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] ml-1">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full p-4 rounded-2xl bg-brand-gray border border-brand-border focus:ring-8 focus:ring-brand-purple/5 focus:border-brand-purple/20 transition-all outline-none font-mono font-bold text-lg"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] ml-1">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-brand-gray border border-brand-border focus:ring-8 focus:ring-brand-purple/5 focus:border-brand-purple/20 transition-all outline-none font-medium appearance-none"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-5 rounded-2xl font-serif italic text-xl text-white shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 ${
                  type === 'income' ? 'bg-emerald-500 shadow-emerald-200' : 'bg-rose-500 shadow-rose-200'
                }`}
              >
                {isSubmitting ? 'Salvando...' : `Adicionar ${type === 'income' ? 'Receita' : 'Despesa'}`}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-white rounded-2xl text-emerald-600 shadow-sm">
                  <ArrowUpRight size={24} />
                </div>
                <span className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest">Saldo Atual</span>
              </div>
              <div className="mt-6">
                <p className="text-emerald-600/80 text-sm font-medium">Receita Disponível</p>
                <h4 className="text-3xl font-serif italic text-emerald-700 mt-1">R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
              </div>
            </div>
            <div className="bg-rose-50 p-8 rounded-[2.5rem] border border-rose-100">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-white rounded-2xl text-rose-500 shadow-sm">
                  <ArrowDownRight size={24} />
                </div>
                <span className="text-[10px] font-bold text-rose-500/60 uppercase tracking-widest">Total Acumulado</span>
              </div>
              <div className="mt-6">
                <p className="text-rose-500/80 text-sm font-medium">Despesas</p>
                <h4 className="text-3xl font-serif italic text-rose-700 mt-1">R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] border border-brand-border shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-serif italic text-stone-900">Histórico de Transações</h3>
              <div className="p-2 text-stone-400 bg-brand-gray rounded-xl">
                <Filter size={20} />
              </div>
            </div>

            <div className="space-y-4">
              {filteredEntries.length === 0 ? (
                <div className="p-20 text-center text-stone-400 italic bg-brand-gray rounded-3xl border border-dashed border-brand-border">
                  Nenhuma transação encontrada para este filtro.
                </div>
              ) : (
                filteredEntries.map((entry) => {
                  const cat = CATEGORIES.find(c => c.id === entry.category) || CATEGORIES[5];
                  return (
                    <div key={entry.id} className="flex items-center p-5 rounded-3xl hover:bg-brand-gray transition-colors group">
                      <div className="w-14 h-14 rounded-2xl bg-brand-gray flex items-center justify-center text-2xl mr-5 border border-brand-border">
                        {cat.icon}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-stone-800">{entry.description}</h5>
                        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-[0.2em] mt-0.5">{cat.label}</p>
                      </div>
                      <div className="text-right mr-6">
                        <span className={`text-lg font-mono font-bold ${entry.type === 'income' ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {entry.type === 'income' ? '+' : '-'} R$ {entry.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">
                          {new Date(entry.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </p>
                      </div>
                      <button 
                        onClick={() => deleteEntry(entry.id)}
                        className="p-2 text-stone-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
