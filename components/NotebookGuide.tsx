
import React, { useState } from 'react';
import { Notebook } from '../types';
import { generateNotebookBriefing, generateAudioOverview, decodeAudio } from '../services/geminiService';

interface NotebookGuideProps {
  notebook: Notebook;
}

const NotebookGuide: React.FC<NotebookGuideProps> = ({ notebook }) => {
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loadingBriefing, setLoadingBriefing] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const activeSources = notebook.sources.filter(s => s.active);

  const handleGenerateBriefing = async () => {
    setLoadingBriefing(true);
    try {
      const text = await generateNotebookBriefing(notebook.sources);
      setBriefing(text || "No briefing generated.");
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBriefing(false);
    }
  };

  const handleGenerateAudio = async () => {
    setLoadingAudio(true);
    try {
      const base64Audio = await generateAudioOverview(notebook.sources);
      if (base64Audio) {
        const buffer = await decodeAudio(base64Audio);
        // In a real app we'd play directly or convert to blob for <audio>
        // Here we'll create a simple Blob URL for a quick player
        const offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
        const source = offlineCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(offlineCtx.destination);
        source.start();
        const renderedBuffer = await offlineCtx.startRendering();
        
        // Convert AudioBuffer to Wav Blob (minimal impl)
        const blob = bufferToWave(renderedBuffer, renderedBuffer.length);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAudio(false);
    }
  };

  // Helper to convert AudioBuffer to Blob
  function bufferToWave(abuffer: AudioBuffer, len: number) {
    const numOfChan = abuffer.numberOfChannels;
    const length = len * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];
    let i;
    let sample;
    let offset = 0;
    let pos = 0;

    function setUint16(data: number) { view.setUint16(pos, data, true); pos += 2; }
    function setUint32(data: number) { view.setUint32(pos, data, true); pos += 4; }

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit (hardcoded)
    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

    for (i = 0; i < abuffer.numberOfChannels; i++) channels.push(abuffer.getChannelData(i));
    while (pos < length) {
      for (i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        view.setInt16(pos, sample, true); pos += 2;
      }
      offset++;
    }
    return new Blob([buffer], { type: "audio/wav" });
  }

  return (
    <div className="w-96 bg-slate-50 flex flex-col h-full border-l border-slate-200 overflow-y-auto custom-scrollbar">
      <div className="p-6 space-y-8">
        <div>
          <h2 className="text-xl font-google font-bold text-slate-800 mb-2">Notebook Guide</h2>
          <p className="text-sm text-slate-500">Get a high-level view of your combined sources.</p>
        </div>

        {/* Audio Deep Dive */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
            </div>
            <div>
              <h3 className="font-google font-bold text-slate-800">Audio Overview</h3>
              <p className="text-xs text-slate-400">Deep dive conversation</p>
            </div>
          </div>
          
          {audioUrl ? (
            <div className="space-y-3">
              <audio src={audioUrl} controls className="w-full h-10" />
              <button 
                onClick={() => setAudioUrl(null)}
                className="text-xs text-slate-400 hover:text-slate-600 underline"
              >
                Regenerate
              </button>
            </div>
          ) : (
            <button 
              onClick={handleGenerateAudio}
              disabled={loadingAudio || activeSources.length === 0}
              className="w-full py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all flex items-center justify-center space-x-2"
            >
              {loadingAudio ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Generating Script...</span>
                </>
              ) : (
                <span>Generate Overview</span>
              )}
            </button>
          )}
        </div>

        {/* Automated Briefing */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-google font-bold text-slate-800">Notebook Briefing</h3>
            <button 
              onClick={handleGenerateBriefing}
              disabled={loadingBriefing || activeSources.length === 0}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:text-slate-300"
            >
              {briefing ? 'Refresh' : 'Generate'}
            </button>
          </div>

          {loadingBriefing ? (
            <div className="space-y-3">
              <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded w-5/6 animate-pulse"></div>
            </div>
          ) : briefing ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 prose prose-slate prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-slate-600">
                {briefing}
              </div>
            </div>
          ) : (
            <div className="py-12 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center p-6">
              <svg className="w-10 h-10 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <p className="text-sm text-slate-400">Generate a comprehensive briefing from your {activeSources.length} active sources.</p>
            </div>
          )}
        </div>

        {/* Suggested Questions */}
        <div className="space-y-4">
          <h3 className="font-google font-bold text-slate-800">Suggested Questions</h3>
          <div className="space-y-2">
            {[
              "What are the main arguments?",
              "Summarize the conclusion.",
              "Explain the methodology used.",
            ].map(q => (
              <button 
                key={q}
                className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-indigo-200 hover:bg-white text-sm text-slate-600 transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotebookGuide;
