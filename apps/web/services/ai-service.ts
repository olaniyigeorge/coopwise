import AuthService from '@/lib/auth-service';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type StoredChatMessage = {
  role: string;
  content: string;
  ts?: string;
};

/**
 * AI features use the backend only (OpenAI key stays server-side).
 */
export class AIService {
  private authHeaders(): Promise<Record<string, string>> {
    return AuthService.getToken().then((token) => {
      if (!token) throw new Error('Authentication required');
      return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
    });
  }

  async fetchChatHistory(): Promise<StoredChatMessage[]> {
    const headers = await this.authHeaders();
    const response = await fetch('/api/v1/insights/ai-chat/history', {
      method: 'GET',
      headers,
    });
    if (!response.ok) {
      return [];
    }
    const data = await response.json().catch(() => ({}));
    return Array.isArray(data.messages) ? data.messages : [];
  }

  async clearChatHistory(): Promise<void> {
    const headers = await this.authHeaders();
    await fetch('/api/v1/insights/ai-chat/history', {
      method: 'DELETE',
      headers,
    });
  }

  async sendMessage(message: string): Promise<string> {
    const token = await AuthService.getToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch('/api/v1/insights/ai-chat', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: message }),
    });

    if (response.ok) {
      return response.text();
    }

    const errorText = await response.text().catch(() => '');
    throw new Error(errorText || `Backend AI chat failed (${response.status})`);
  }

  async resetChat(): Promise<void> {
    await this.clearChatHistory();
  }

  async getInsights() {
    const token = await AuthService.getToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch('/api/v1/insights', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch insights: ${response.status}`);
    }

    return await response.json();
  }

  async generateNewInsight() {
    const token = await AuthService.getToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch('/api/v1/insights/get-ai_insight', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to generate new insight: ${response.status}`);
    }

    return await response.json();
  }
}

export const aiService = new AIService();
