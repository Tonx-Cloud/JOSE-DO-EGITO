
export type AppView = 'onboarding' | 'recording' | 'review' | 'edit' | 'interpreting' | 'result';
export type Gender = 'masculino' | 'feminino';

export interface UserState {
  name: string;
  gender: Gender;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
