export const dynamic = 'force-dynamic';

import { startWorkflow, resumeWorkflow } from '@/lib/langgraph';
import { addHistoryEntry } from '@/lib/history';
import { v4 as uuidv4 } from 'uuid';

async function imageToBase64(imageFile: File): Promise<string> {
  const bytes = await imageFile.arrayBuffer();
  return Buffer.from(bytes).toString('base64');
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    const prompt = formData.get('prompt') as string;
    const templateId = formData.get('templateId') as string | null;
    const threadId = formData.get('threadId') as string | null;
    const confirmed = formData.get('confirmed') === 'true';
    const refinedPrompt = formData.get('refinedPrompt') as string | null;

    if (!imageFile || !prompt) {
      return Response.json({ error: 'Missing image or prompt' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'OPENROUTER_API_KEY not configured' }, { status: 500 });
    }

    const imageBase64 = await imageToBase64(imageFile);
    const imageUrl = `data:${imageFile.type};base64,${imageBase64}`;

    if (threadId && confirmed) {
      const result = await resumeWorkflow(threadId, refinedPrompt || undefined);
      const state = result.result;

      if (state.result) {
        await addHistoryEntry({
          id: uuidv4(),
          timestamp: Date.now(),
          originalPrompt: prompt,
          refinedPrompt: state.refinedPrompt || prompt,
          imageUrl: imageUrl,
          resultUrl: state.result,
          cost: state.cost,
          threadId: threadId,
        });

        return Response.json({
          threadId,
          resultUrl: state.result,
          cost: state.cost,
          status: 'completed',
        });
      }

      return Response.json({
        threadId,
        refinedPrompt: state.refinedPrompt,
        cost: state.cost,
        status: 'planning',
      });
    }

    const { result, threadId: newThreadId, interrupted } = await startWorkflow(imageUrl, prompt);
    const state = result;

    if (interrupted || (state.refinedPrompt && !state.result)) {
      return Response.json({
        threadId: newThreadId,
        refinedPrompt: state.refinedPrompt,
        cost: state.cost,
        status: 'planning',
      });
    }

    if (state.result) {
      await addHistoryEntry({
        id: uuidv4(),
        timestamp: Date.now(),
        originalPrompt: prompt,
        refinedPrompt: state.refinedPrompt || prompt,
        imageUrl: imageUrl,
        resultUrl: state.result,
        cost: state.cost,
        threadId: newThreadId,
      });

      return Response.json({
        threadId: newThreadId,
        resultUrl: state.result,
        cost: state.cost,
        status: 'completed',
      });
    }

    return Response.json({
      threadId: newThreadId,
      refinedPrompt: state.refinedPrompt,
      cost: state.cost,
      status: 'planning',
    });
  } catch (error) {
    console.error('Generate error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to generate' },
      { status: 500 }
    );
  }
}

