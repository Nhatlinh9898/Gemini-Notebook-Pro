
import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";
import { Source, AudioScriptPart } from "../types";

const API_KEY = process.env.API_KEY || "";

export const getGeminiClient = () => {
  if (!API_KEY) {
    throw new Error("API Key is missing. Please ensure process.env.API_KEY is set.");
  }
  return new GoogleGenAI({ apiKey: API_KEY });
};

export const generateGroundedChat = async (
  prompt: string,
  sources: Source[],
  history: { role: string; text: string }[]
) => {
  const ai = getGeminiClient();
  const activeSources = sources.filter(s => s.active);
  
  const sourceContext = activeSources.length > 0 
    ? `You are an expert research assistant. You have access to the following source documents:\n\n${activeSources.map(s => `--- SOURCE: ${s.title} ---\n${s.content}`).join('\n\n')}\n\nStrictly answer questions based ONLY on the provided sources. If the answer is not in the sources, say you don't know based on the available information. Quote source titles when citing.`
    : "You are a helpful assistant. Currently, no sources are loaded, so provide general information but encourage the user to add sources for grounded research.";

  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: sourceContext,
    },
  });

  // Reconstruct history
  // Note: Standard Gemini chat doesn't support systemInstruction as part of the history array easily in this SDK wrapper, 
  // so we rely on the create config and then send the current message.
  
  const result = await chat.sendMessage({ message: prompt });
  return result;
};

export const generateNotebookBriefing = async (sources: Source[]) => {
  const ai = getGeminiClient();
  const activeSources = sources.filter(s => s.active);
  if (activeSources.length === 0) return "Please add and select sources to generate a briefing.";

  const prompt = `Analyze these sources and create a structured briefing doc:
  1. Summary of key themes
  2. Important facts and figures
  3. Suggested questions to explore further
  
  SOURCES:
  ${activeSources.map(s => `Title: ${s.title}\nContent: ${s.content}`).join('\n\n')}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });

  return response.text;
};

export const generateAudioOverview = async (sources: Source[]) => {
  const ai = getGeminiClient();
  const activeSources = sources.filter(s => s.active);
  
  // Step 1: Generate a script for Joe and Jane
  const scriptPrompt = `You are a podcast script writer. Create a natural, engaging conversation between two hosts, Joe (male, analytical) and Jane (female, inquisitive), who are diving deep into the following documents. They should summarize key points and debate interesting aspects. Keep it under 2 minutes of speech.
  
  SOURCES:
  ${activeSources.map(s => `Title: ${s.title}\nContent: ${s.content}`).join('\n\n')}
  
  Output ONLY a JSON array of objects with "speaker" (Joe or Jane) and "text" fields.`;

  const scriptResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: scriptPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            speaker: { type: Type.STRING },
            text: { type: Type.STRING },
          },
          required: ["speaker", "text"],
        }
      }
    }
  });

  const script: AudioScriptPart[] = JSON.parse(scriptResponse.text || "[]");

  // Step 2: Generate TTS for the entire script
  // Note: For simplicity in this demo, we use the multi-speaker example logic
  const ttsPrompt = `TTS the following conversation between Joe and Jane:
  ${script.map(p => `${p.speaker}: ${p.text}`).join('\n')}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: ttsPrompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            { speaker: 'Joe', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
            { speaker: 'Jane', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } }
          ]
        }
      }
    },
  });

  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

// Audio decoding helper
export const decodeAudio = async (base64: string): Promise<AudioBuffer> => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const dataInt16 = new Int16Array(bytes.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
};
