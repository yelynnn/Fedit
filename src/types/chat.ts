export interface AiProduct {
  id: string;
  name: string;
  image?: string;
  price?: string;
  metric?: string;
}

export interface AiResponse {
  type: 'product_recommend' | 'trend' | 'comparison' | 'analysis' | 'text';
  message: {
    summary: string;
    points?: string[];
    detail?: string;
  };
  products?: AiProduct[];
  chips?: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  parsed?: AiResponse;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}
