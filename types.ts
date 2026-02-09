
export interface Source {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'link' | 'file';
  active: boolean;
  addedAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  sourcesUsed?: string[];
}

export interface Notebook {
  id: string;
  title: string;
  sources: Source[];
  history: ChatMessage[];
  updatedAt: number;
}

export interface AudioScriptPart {
  speaker: 'Joe' | 'Jane';
  text: string;
}
