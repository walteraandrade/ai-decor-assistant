export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get('image') as File;
    const prompt = formData.get('prompt') as string;

    if (!image || !prompt) {
      return Response.json({ error: 'Missing image or prompt' }, { status: 400 });
    }

    const bytes = await image.arrayBuffer();
    const base64Image = Buffer.from(bytes).toString('base64');
    const imageUrl = `data:${image.type};base64,${base64Image}`;

    const apiKey = process.env.OPENROUTER_API_KEY;
    console.log('OPENROUTER_API_KEY exists:', !!apiKey);
    if (!apiKey) {
      return Response.json({ error: 'OPENROUTER_API_KEY not configured' }, { status: 500 });
    }

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
              { type: 'text', text: prompt },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return Response.json({ error: errorText }, { status: response.status });
    }

    const result = await response.json();

    const choice = result.choices?.[0];
    const message = choice?.message;
    
    let imageUrls: { url: string }[] = [];

    if (Array.isArray(message?.images)) {
      imageUrls = message.images.map((img: { image_url: { url: string } }) => ({ url: img.image_url.url }));
    }

    return Response.json({ data: imageUrls });
  } catch {
    return Response.json({ error: 'Failed to process image' }, { status: 500 });
  }
}
