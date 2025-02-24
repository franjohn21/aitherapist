export type SessionType = 'therapy' | 'relationship' | 'career' | 'life';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  audioContent?: string;
}
