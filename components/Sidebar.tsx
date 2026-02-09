
import React, { useState } from 'react';
import { Notebook, Source } from '../types';

interface SidebarProps {
  notebook: Notebook;
  onBack: () => void;
  onUpdate: (nb: Notebook) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ notebook, onBack, onUpdate }) => {
  const [showAddSource, setShowAddSource] = useState(false);
  const [newSourceTitle, setNewSourceTitle] = useState('');
  const [newSourceContent, setNewSourceContent] = useState('');

  const addSource = () => {
    if (!newSourceTitle || !newSourceContent) return;
    const source: Source = {
      id: Math.random().toString(36).substring(7),
      title: newSourceTitle,
      content: newSourceContent,
      type: 'text',
      active: true,
      addedAt: Date.now(),
    };
    onUpdate({ ...notebook, sources: [source, ...notebook.sources] });
    setNewSourceTitle('');
    setNewSourceContent('');
    setShowAddSource(false);
  };

  const toggleSource = (id: string) => {
    const updated = notebook.sources.map(s => s.id === id ? { ...s, active: !s.active } : s);
    onUpdate({ ...notebook, sources: updated });
  };

  const deleteSource = (id: string) => {
    const updated = notebook.sources.filter(s => s.id !== id);
    onUpdate({ ...notebook, sources: updated });
  };

  return (
    <div className="w-80 bg-white flex flex-col h-full border-r border-slate-200">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-google font-bold text-slate-800">Sources</h2>
          <button 
            onClick={() => setShowAddSource(true)}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
          </button>
        </div>

        {showAddSource ? (
          <div className="bg-slate-50 rounded-xl p-4 space-y-3 mb-4 animate-in fade-in slide-in-from-top-4">
            <input 
              type="text" 
              placeholder="Source Title" 
              value={newSourceTitle}
              onChange={(e) => setNewSourceTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <textarea 
              placeholder="Paste source text here..." 
              value={newSourceContent}
              onChange={(e) => setNewSourceContent(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[100px]"
            />
            <div className="flex space-x-2">
              <button 
                onClick={addSource}
                className="flex-1 bg-indigo-600 text-white text-sm py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Add
              </button>
              <button 
                onClick={() => setShowAddSource(false)}
                className="flex-1 bg-white border border-slate-200 text-slate-600 text-sm py-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
        
        <div className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
          {notebook.sources.length} Documents
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
        {notebook.sources.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-slate-400">Add documents to get started</p>
          </div>
        ) : (
          notebook.sources.map(source => (
            <div 
              key={source.id}
              className={`group relative p-3 rounded-xl border transition-all ${
                source.active 
                  ? 'border-indigo-100 bg-indigo-50/30' 
                  : 'border-transparent bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 truncate">
                  <input 
                    type="checkbox" 
                    checked={source.active}
                    onChange={() => toggleSource(source.id)}
                    className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <div className="truncate">
                    <p className={`text-sm font-medium truncate ${source.active ? 'text-indigo-900' : 'text-slate-600'}`}>
                      {source.title}
                    </p>
                    <p className="text-xs text-slate-400 uppercase">{source.type}</p>
                  </div>
                </div>
                <button 
                  onClick={() => deleteSource(source.id)}
                  className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;
