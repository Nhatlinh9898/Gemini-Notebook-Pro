
import React, { useState, useEffect, useCallback } from 'react';
import { Notebook, Source, ChatMessage } from './types';
import Sidebar from './components/Sidebar';
import MainChat from './components/MainChat';
import NotebookGuide from './components/NotebookGuide';
import Dashboard from './components/Dashboard';

const STORAGE_KEY = 'gemini_notebook_pro_data';

const App: React.FC = () => {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
  const [showDashboard, setShowDashboard] = useState(true);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setNotebooks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load notebooks", e);
      }
    }
  }, []);

  useEffect(() => {
    if (notebooks.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notebooks));
    }
  }, [notebooks]);

  const activeNotebook = notebooks.find(n => n.id === activeNotebookId);

  const createNotebook = () => {
    const newNb: Notebook = {
      id: Math.random().toString(36).substring(7),
      title: 'Untitled Notebook',
      sources: [],
      history: [],
      updatedAt: Date.now(),
    };
    setNotebooks([newNb, ...notebooks]);
    setActiveNotebookId(newNb.id);
    setShowDashboard(false);
  };

  const deleteNotebook = (id: string) => {
    setNotebooks(notebooks.filter(n => n.id !== id));
    if (activeNotebookId === id) {
      setActiveNotebookId(null);
      setShowDashboard(true);
    }
  };

  const updateNotebook = (id: string, updates: Partial<Notebook>) => {
    setNotebooks(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n));
  };

  const openNotebook = (id: string) => {
    setActiveNotebookId(id);
    setShowDashboard(false);
  };

  if (showDashboard) {
    return (
      <Dashboard 
        notebooks={notebooks} 
        onCreate={createNotebook} 
        onOpen={openNotebook}
        onDelete={deleteNotebook}
      />
    );
  }

  if (!activeNotebook) return null;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Navigation & Sources Sidebar */}
      <Sidebar 
        notebook={activeNotebook} 
        onBack={() => setShowDashboard(true)} 
        onUpdate={(nb) => updateNotebook(nb.id, nb)}
      />

      {/* Main workspace */}
      <div className="flex-1 flex flex-col min-w-0 border-x border-slate-200">
        <header className="h-14 border-b border-slate-200 bg-white flex items-center px-6 justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowDashboard(true)}
              className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <input 
              type="text" 
              value={activeNotebook.title} 
              onChange={(e) => updateNotebook(activeNotebook.id, { title: e.target.value })}
              className="font-google text-lg font-medium text-slate-800 focus:outline-none bg-transparent hover:bg-slate-50 px-2 rounded"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Saved to local storage</span>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Central Chat Area */}
          <MainChat 
            notebook={activeNotebook} 
            onUpdate={(history) => updateNotebook(activeNotebook.id, { history })} 
          />
          
          {/* Right side helper / Notebook Guide */}
          <NotebookGuide 
            notebook={activeNotebook}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
