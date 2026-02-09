
import React from 'react';
import { Notebook } from '../types';

interface DashboardProps {
  notebooks: Notebook[];
  onCreate: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ notebooks, onCreate, onOpen, onDelete }) => {
  return (
    <div className="min-h-screen bg-slate-50 p-8 md:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
            </div>
            <h1 className="text-2xl font-google font-bold text-slate-800">Gemini Notebook Pro</h1>
          </div>
          <button 
            onClick={onCreate}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
            <span>New Notebook</span>
          </button>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {notebooks.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <div className="mb-4 inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full text-slate-300">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              </div>
              <h3 className="text-xl font-google font-medium text-slate-600 mb-2">No notebooks yet</h3>
              <p className="text-slate-400 max-w-sm mx-auto">Create your first notebook to start research grounded in your own sources.</p>
            </div>
          ) : (
            notebooks.map(nb => (
              <div 
                key={nb.id}
                onClick={() => onOpen(nb.id)}
                className="group relative bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-indigo-100 transition-all cursor-pointer flex flex-col h-48"
              >
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this notebook?')) onDelete(nb.id);
                  }}
                  className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
                <div className="flex-1">
                  <h3 className="text-lg font-google font-bold text-slate-800 mb-2 group-hover:text-indigo-600 line-clamp-2">{nb.title}</h3>
                  <div className="flex items-center space-x-3 text-sm text-slate-400">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                      {nb.sources.length} sources
                    </span>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-50 text-xs text-slate-400">
                  Updated {new Date(nb.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
