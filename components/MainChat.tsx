
import React, { useState, useRef, useEffect } from 'react';
import { Notebook, ChatMessage } from '../types';
import { generateGroundedChat } from '../services/geminiService';

interface MainChatProps {
  notebook: Notebook;
  onUpdate: (history: ChatMessage[]) => void;
}

const MainChat: React.FC<MainChatProps> = ({ notebook, onUpdate }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [notebook.history]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now(),
    };

    const newHistory = [...notebook.history, userMsg];
    onUpdate(newHistory);
    setInput('');
    setLoading(true);

    try {
      const response = await generateGroundedChat(
        input, 
        notebook.sources, 
        newHistory.map(h => ({ role: h.role, text: h.text }))
      );

      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text || "I'm sorry, I couldn't generate a response.",
        timestamp: Date.now(),
        sourcesUsed: notebook.sources.filter(s => s.active).map(s => s.title),
      };

      onUpdate([...newHistory, modelMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Error connecting to Gemini. Please check your API key and connection.",
        timestamp: Date.now(),
      };
      onUpdate([...newHistory, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8"
      >
        {notebook.history.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-6">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
            </div>
            <div>
              <h2 className="text-2xl font-google font-bold text-slate-800 mb-2">Ask about your sources</h2>
              <p className="text-slate-500">I'll use the information from your active sources to provide grounded, accurate answers.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full">
              {['Summarize key points', 'Find connections', 'Ask a question', 'Get briefing'].map(s => (
                <button 
                  key={s} 
                  onClick={() => setInput(s)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          notebook.history.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-4 ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                  : 'bg-slate-50 text-slate-800 border border-slate-100'
              }`}>
                <div className="whitespace-pre-wrap leading-relaxed">
                  {msg.text}
                </div>
                {msg.sourcesUsed && msg.sourcesUsed.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200/30 flex flex-wrap gap-2">
                    {msg.sourcesUsed.map(s => (
                      <span key={s} className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-semibold uppercase tracking-wider">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                <div className={`text-[10px] mt-2 opacity-50 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-slate-100">
        <div className="max-w-4xl mx-auto relative">
          <textarea 
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about your research..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-4 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none shadow-sm"
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="absolute right-2.5 top-2.5 p-1.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-3">
          Powered by Gemini 3 Flash. AI responses are grounded in selected sources.
        </p>
      </div>
    </div>
  );
};

export default MainChat;
