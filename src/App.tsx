/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MoodTracker from './components/MoodTracker';
import HabitTracker from './components/HabitTracker';
import Agenda from './components/Agenda';
import Finance from './components/Finance';
import Settings from './components/Settings';
import Reports from './components/Reports';
import Notifications from './components/Notifications';
import Login from './components/Login';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userEmail, setUserEmail] = useState<string | null>(localStorage.getItem('userEmail'));

  useEffect(() => {
    const handleStorageChange = () => {
      setUserEmail(localStorage.getItem('userEmail'));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (!userEmail) {
    return <Login onLogin={setUserEmail} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'mood':
        return <MoodTracker />;
      case 'habits':
        return <HabitTracker />;
      case 'agenda':
        return <Agenda />;
      case 'finance':
        return <Finance />;
      case 'reports':
        return <Reports />;
      case 'notifications':
        return <Notifications />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-stone-400 italic">
            Este módulo estará disponível em breve...
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-brand-white overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 overflow-y-auto relative bg-brand-gray/20">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="p-8 max-w-7xl mx-auto w-full min-h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
