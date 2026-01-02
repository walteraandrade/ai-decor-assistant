import type { GraphState } from '../state';

const PLANNING_SYSTEM_PROMPT = `You are an expert interior design assistant. Your task is to analyze a room photo and refine the user's decoration request into a detailed, actionable prompt for an image generation model.

Analyze the current space in the image and the user's request. Create a refined prompt that:
1. Describes the current room elements that should be preserved
2. Clearly specifies the changes requested
3. Includes specific design details (colors, materials, styles, furniture)
4. Ensures the output will be visually coherent and realistic

Keep the refined prompt concise but specific. Return only the refined prompt text, no additional commentary.`;

export async function planningAgent(state: GraphState): Promise<Partial<GraphState>> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  const imageUrl = state.image.startsWith('data:') ? state.image : `data:image/jpeg;base64,${state.image}`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-4.1-mini',
      messages: [
        { role: 'system', content: PLANNING_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageUrl } },
            { type: 'text', text: `User request: ${state.prompt}\n\nPlease refine this into a detailed prompt for image generation.` },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Planning agent failed: ${errorText}`);
  }

  const result = await response.json();
  const refinedPrompt = result.choices?.[0]?.message?.content?.trim() || state.prompt;

  const usage = result.usage;
  const cost = usage ? (usage.prompt_tokens * 0.15 + usage.completion_tokens * 0.6) / 1000000 : 0;

  return {
    refinedPrompt,
    cost: state.cost + cost,
  };
}

