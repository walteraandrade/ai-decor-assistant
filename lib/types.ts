export interface HistoryEntry {
  id: string;
  timestamp: number;
  originalPrompt: string;
  refinedPrompt: string;
  imageUrl: string;
  resultUrl?: string;
  cost: number;
  threadId: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  prompt: string;
  isCustom: boolean;
}

export interface CostStats {
  currentMonth: number;
  totalAllTime: number;
  monthlyBudget: number;
  generationCount: number;
}

export interface WorkflowState {
  image: string;
  prompt: string;
  refinedPrompt?: string;
  result?: string;
  cost: number;
  threadId: string;
  confirmed?: boolean;
}

export interface GenerateRequest {
  image: string;
  prompt: string;
  templateId?: string;
  threadId?: string;
  confirmed?: boolean;
  refinedPrompt?: string;
}

export interface GenerateResponse {
  threadId: string;
  refinedPrompt?: string;
  resultUrl?: string;
  cost: number;
  status: 'planning' | 'confirmed' | 'completed';
  error?: string;
}

