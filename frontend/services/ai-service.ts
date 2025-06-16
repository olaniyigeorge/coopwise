import { GoogleGenerativeAI } from '@google/generative-ai';

// Get API key from environment variables or use the provided key
const getApiKey = (): string => {
  // Use the provided API key
  return 'AIzaSyAEIjFXIIHWBWFPGF2agdLvgC9sbkbM4CQ';
};

// Initialize the Gemini API client with the API key
const createGenAI = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('Warning: No Gemini API key found. AI features will not work properly.');
    // Return a dummy API that will throw errors when used
    return {
      getGenerativeModel: () => ({
        startChat: () => ({
          sendMessage: async () => {
            throw new Error('No API key provided. Please configure the Gemini API key in environment variables.');
          }
        })
      })
    } as GoogleGenerativeAI;
  }
  
  return new GoogleGenerativeAI(apiKey);
};

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export class AIService {
  private genAI = createGenAI();
  private model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  private chat = this.model.startChat({
    history: [
      {
        role: 'user',
        parts: [{ text: 'You are a financial advisor assistant for CoopWise, a platform that helps people save money through cooperative savings groups. Provide helpful, concise financial advice focused on savings, budgeting, and financial planning. Keep responses under 300 words and focused on practical advice. IMPORTANT: Format your responses using proper markdown syntax with headers (##), bullet points (*), numbered lists (1.), bold (**text**), and italics (*text*) where appropriate to improve readability.' }],
      },
      {
        role: 'model',
        parts: [{ text: 'I understand my role as a financial advisor assistant for CoopWise. I\'ll provide concise, practical financial advice focused on savings, budgeting, and financial planning, keeping my responses under 300 words. I\'ll format my responses with proper markdown to improve readability. How can I help you with your financial goals today?' }],
      },
    ],
    generationConfig: {
      maxOutputTokens: 800,
      temperature: 0.6,
    },
  });

  async sendMessage(message: string): Promise<string> {
    try {
      // Check if API key is available
      if (!getApiKey()) {
        throw new Error('No API key provided. Please configure the Gemini API key in environment variables.');
      }
      
      const result = await this.chat.sendMessage(message);
      const response = result.response;
      return response.text();
    } catch (error: any) {
      console.error('Error sending message to Gemini API:', error);
      
      // Provide more specific error messages
      if (error.message?.includes('API key')) {
        throw new Error('Missing API key. Please configure the Gemini API key in environment variables.');
      } else if (error.message?.includes('quota')) {
        throw new Error('API quota exceeded. Please try again later or check your API usage limits.');
      } else {
        throw new Error('Failed to get response from AI assistant. Please try again later.');
      }
    }
  }

  async resetChat(): Promise<void> {
    // Refresh the genAI instance to get any updated API key
    this.genAI = createGenAI();
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    this.chat = this.model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: 'You are a financial advisor assistant for CoopWise, a platform that helps people save money through cooperative savings groups. Provide helpful, concise financial advice focused on savings, budgeting, and financial planning. Keep responses under 300 words and focused on practical advice. IMPORTANT: Format your responses using proper markdown syntax with headers (##), bullet points (*), numbered lists (1.), bold (**text**), and italics (*text*) where appropriate to improve readability.' }],
        },
        {
          role: 'model',
          parts: [{ text: 'I understand my role as a financial advisor assistant for CoopWise. I\'ll provide concise, practical financial advice focused on savings, budgeting, and financial planning, keeping my responses under 300 words. I\'ll format my responses with proper markdown to improve readability. How can I help you with your financial goals today?' }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 800,
        temperature: 0.6,
      },
    });
    
    return Promise.resolve();
  }
}

// Export a singleton instance
export const aiService = new AIService(); 