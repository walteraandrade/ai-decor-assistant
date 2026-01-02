import { StateGraph, START, END, interrupt, Command } from '@langchain/langgraph';
import { MemorySaver } from '@langchain/langgraph';
import { StateAnnotation } from './state';
import { planningAgent } from './agents/planning';
import { editingAgent } from './agents/editing';
import { v4 as uuidv4 } from 'uuid';

const memory = new MemorySaver();

async function planningNode(state: typeof StateAnnotation.State) {
  const result = await planningAgent(state);
  return result;
}

async function confirmNode(state: typeof StateAnnotation.State) {
  interrupt({
    refinedPrompt: state.refinedPrompt,
    action: 'Please confirm or edit the refined prompt',
  });
  return {};
}

async function editingNode(state: typeof StateAnnotation.State) {
  return await editingAgent(state);
}

const workflow = new StateGraph(StateAnnotation)
  .addNode('planning', planningNode)
  .addNode('confirm', confirmNode)
  .addNode('editing', editingNode)
  .addEdge(START, 'planning')
  .addEdge('planning', 'confirm')
  .addEdge('confirm', 'editing')
  .addEdge('editing', END);

export const graph = workflow.compile({ checkpointer: memory });

export async function startWorkflow(image: string, prompt: string, threadId?: string) {
  const id = threadId || uuidv4();
  const config = { configurable: { thread_id: id } };

  const initialState = {
    image,
    prompt,
    refinedPrompt: undefined,
    result: undefined,
    cost: 0,
    threadId: id,
  };

  await graph.invoke(initialState, config);
  const state = await graph.getState(config);
  const interrupted = state.next && state.next.length > 0;

  return { result: state.values, threadId: id, config, interrupted };
}

export async function resumeWorkflow(threadId: string, refinedPrompt?: string) {
  const config = { configurable: { thread_id: threadId } };

  if (refinedPrompt) {
    const command = new Command({ resume: true, update: { refinedPrompt } });
    const result = await graph.invoke(command as any, config);
    return { result, threadId, config };
  }

  const command = new Command({ resume: true });
  const result = await graph.invoke(command as any, config);
  return { result, threadId, config };
}

export async function getWorkflowState(threadId: string) {
  const config = { configurable: { thread_id: threadId } };
  const state = await graph.getState(config);
  return state.values;
}

