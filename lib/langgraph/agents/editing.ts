import type { GraphState } from '../state';

export async function editingAgent(state: GraphState): Promise<Partial<GraphState>> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  if (!state.refinedPrompt) {
    throw new Error('Refined prompt is required for editing');
  }

  const imageUrl = state.image.startsWith('data:') ? state.image : `data:image/jpeg;base64,${state.image}`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-pro-image-preview',
      modalities: ['image', 'text'],
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageUrl } },
            { type: 'text', text: state.refinedPrompt },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Editing agent failed: ${errorText}`);
  }

  const result = await response.json();
  const choice = result.choices?.[0];
  const message = choice?.message;

  let resultUrl: string | undefined;
  if (Array.isArray(message?.images) && message.images.length > 0) {
    resultUrl = message.images[0].image_url?.url;
  }

  if (!resultUrl) {
    throw new Error('No image result from editing agent');
  }

  const usage = result.usage;
  const cost = usage ? (usage.prompt_tokens * 0.05 + usage.completion_tokens * 0.15) / 1000000 : 0;

  return {
    result: resultUrl,
    cost: state.cost + cost,
  };
}

