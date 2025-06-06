declare module '@google/generative-ai' {
  export class GoogleGenerativeAI {
    constructor(apiKey: string);
    getGenerativeModel(options: { model: string | 'gemini-2.0-flash' | 'gemini-1.5-flash' | 'gemini-1.5-pro' | 'gemini-pro' }): GenerativeModel;
  }

  export interface GenerativeModel {
    startChat(options?: {
      history?: Array<{
        role: 'user' | 'model';
        parts: Array<{ text: string }>;
      }>;
      generationConfig?: {
        maxOutputTokens?: number;
        temperature?: number;
      };
    }): ChatSession;
  }

  export interface ChatSession {
    sendMessage(message: string): Promise<{
      response: {
        text(): string;
      };
    }>;
  }
} 