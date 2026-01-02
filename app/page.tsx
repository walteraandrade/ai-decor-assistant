'use client';

import { useState } from 'react';

interface GeneratedImage {
  url: string;
  prompt: string;
}

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!selectedImage || !prompt) return;

    setIsGenerating(true);
    setError(null);

    try {
      const formData = new FormData();
      
      const blob = await fetch(selectedImage).then(r => r.blob());
      formData.append('image', blob);
      formData.append('prompt', prompt);
      formData.append('n', '2');
      formData.append('size', '1024x1024');

      const response = await fetch('/api/edit', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate images');
      }

      const data = await response.json();
      
      const newImages: GeneratedImage[] = (data.data || []).map((img: { url?: string; b64_json?: string }) => ({
        url: img.url || img.b64_json,
        prompt,
      }));

      setGeneratedImages(prev => [...newImages, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectGenerated = (image: GeneratedImage) => {
    setSelectedImage(image.url);
    setPrompt('');
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-4xl font-bold text-zinc-900">
          Office Decor Assistant
        </h1>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-dashed border-zinc-300 p-8 text-center">
              {selectedImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedImage}
                  alt="Selected office"
                  className="mx-auto h-64 w-auto rounded-lg object-contain"
                />
              ) : (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer text-zinc-600 hover:text-zinc-900"
                  >
                    Upload office photo
                  </label>
                </div>
              )}
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the change you want (e.g., 'Add a minimalist wooden shelf with plants', 'Change wall color to sage green')"
              className="w-full rounded-lg border border-zinc-300 p-4 text-zinc-900 focus:border-blue-500 focus:outline-none"
              rows={4}
            />

            <button
              onClick={handleGenerate}
              disabled={!selectedImage || !prompt || isGenerating}
              className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
            >
              {isGenerating ? 'Generating...' : 'Generate Variations'}
            </button>

            {error && (
              <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
                {error}
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900">
              Generated Variations
            </h2>
            {generatedImages.length === 0 ? (
              <p className="text-zinc-600">
                Upload an image and describe your desired changes to see variations
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {generatedImages.map((image, index) => (
                  <div
                    key={index}
                    className="cursor-pointer space-y-2 rounded-lg border border-zinc-200 p-4 transition-colors hover:border-blue-500 hover:bg-zinc-100"
                    onClick={() => handleSelectGenerated(image)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.url}
                      alt={`Variation ${index + 1}`}
                      className="h-48 w-full rounded-lg object-cover"
                    />
                    <p className="text-sm text-zinc-600">
                      {image.prompt}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Click to use as new base image
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
