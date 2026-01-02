import { Annotation } from '@langchain/langgraph';

export interface GraphState {
  image: string;
  prompt: string;
  refinedPrompt?: string;
  result?: string;
  cost: number;
  threadId: string;
}

export const StateAnnotation = Annotation.Root({
  image: Annotation<string>,
  prompt: Annotation<string>,
  refinedPrompt: Annotation<string | undefined>,
  result: Annotation<string | undefined>,
  cost: Annotation<number>,
  threadId: Annotation<string>,
});

