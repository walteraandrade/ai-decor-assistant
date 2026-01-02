'use client';

import { useState, useEffect } from 'react';
import { getAllTemplates, getTemplateById, saveCustomTemplate } from '@/lib/templates';
import type { HistoryEntry, CostStats, GenerateResponse } from '@/lib/types';

type Step = 'upload' | 'confirm' | 'result';

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [isGenerating, setIsGenerating] = useState(false);
  const [refinedPrompt, setRefinedPrompt] = useState('');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cost, setCost] = useState(0);
  const [stats, setStats] = useState<CostStats | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCustomTemplateModal, setShowCustomTemplateModal] = useState(false);
  const [customTemplateName, setCustomTemplateName] = useState('');
  const [customTemplatePrompt, setCustomTemplatePrompt] = useState('');
  const [lastGenerateTime, setLastGenerateTime] = useState(0);

  useEffect(() => {
    loadHistory();
    loadStats();
  }, []);

  async function loadHistory() {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      setHistory(data.entries || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  }

  async function loadStats() {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      setStats(data.stats || null);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleTemplateSelect(templateId: string) {
    const template = getTemplateById(templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setPrompt(template.prompt);
      setShowTemplates(false);
    }
  }

  async function handleGenerate() {
    if (!selectedImage || !prompt) return;

    const now = Date.now();
    if (now - lastGenerateTime < 1000) {
      setError('Please wait a moment before generating again');
      return;
    }
    setLastGenerateTime(now);

    setIsGenerating(true);
    setError(null);
    setCurrentStep('upload');

    try {
      const formData = new FormData();
      const blob = await fetch(selectedImage).then(r => r.blob());
      formData.append('image', blob);
      formData.append('prompt', prompt);
      if (selectedTemplate) {
        formData.append('templateId', selectedTemplate);
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate');
      }

      const data: GenerateResponse = await response.json();

      if (data.status === 'planning' && data.refinedPrompt) {
        setRefinedPrompt(data.refinedPrompt);
        setThreadId(data.threadId);
        setCost(data.cost);
        setCurrentStep('confirm');
      } else if (data.status === 'completed' && data.resultUrl) {
        setResultUrl(data.resultUrl);
        setCost(data.cost);
        setCurrentStep('result');
        await handleDownload(data.resultUrl);
        await loadHistory();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleConfirm() {
    if (!threadId) return;

    setIsGenerating(true);
    setError(null);

    try {
      const formData = new FormData();
      const blob = await fetch(selectedImage!).then(r => r.blob());
      formData.append('image', blob);
      formData.append('prompt', prompt);
      formData.append('threadId', threadId);
      formData.append('confirmed', 'true');
      formData.append('refinedPrompt', refinedPrompt);

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate');
      }

      const data: GenerateResponse = await response.json();

      if (data.resultUrl) {
        setResultUrl(data.resultUrl);
        setCost(data.cost);
        setCurrentStep('result');
        await handleDownload(data.resultUrl);
        await loadHistory();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleDownload(url: string) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `decor-edit-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed:', err);
    }
  }

  async function handleExportHTML() {
    try {
      const response = await fetch('/api/history?export=html');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `decor-history-${Date.now()}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Export failed:', err);
    }
  }

  function handleSaveCustomTemplate() {
    if (!customTemplateName || !customTemplatePrompt) return;
    saveCustomTemplate({
      id: `custom-${Date.now()}`,
      name: customTemplateName,
      description: '',
      prompt: customTemplatePrompt,
      isCustom: true,
    });
    setShowCustomTemplateModal(false);
    setCustomTemplateName('');
    setCustomTemplatePrompt('');
  }

  function handleExportTemplates() {
    const customTemplates = getAllTemplates().filter(t => t.isCustom);
    const blob = new Blob([JSON.stringify(customTemplates, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `custom-templates-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleImportTemplates(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        const templates = JSON.parse(reader.result as string);
        if (Array.isArray(templates)) {
          templates.forEach(t => {
            if (t.name && t.prompt) {
              saveCustomTemplate({
                id: t.id || `custom-${Date.now()}-${Math.random()}`,
                name: t.name,
                description: t.description || '',
                prompt: t.prompt,
                isCustom: true,
              });
            }
          });
        }
      } catch (err) {
        setError('Failed to import templates');
      }
    };
    reader.readAsText(file);
  }

  function getBudgetWarning() {
    if (!stats) return null;
    const percentage = (stats.currentMonth / stats.monthlyBudget) * 100;
    if (percentage >= 100) return { level: 'exceeded', message: 'Budget exceeded!' };
    if (percentage >= 80) return { level: 'warning', message: 'Budget warning: 80% used' };
    return null;
  }

  const budgetWarning = getBudgetWarning();

  return (
    <div className="min-h-screen bg-zinc-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-900">
            Office Decor Assistant
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-300"
            >
              Templates
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-300"
            >
              History
            </button>
          </div>
        </div>

        {stats && (
          <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex gap-6">
                <div>
                  <div className="text-sm text-zinc-600">This Month</div>
                  <div className="text-lg font-semibold">${stats.currentMonth.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-zinc-600">Total</div>
                  <div className="text-lg font-semibold">${stats.totalAllTime.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-zinc-600">Generations</div>
                  <div className="text-lg font-semibold">{stats.generationCount}</div>
                </div>
              </div>
              <div className="flex-1 max-w-xs">
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-zinc-600">Budget</span>
                  <span className="text-zinc-600">
                    ${stats.currentMonth.toFixed(2)} / ${stats.monthlyBudget}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
                  <div
                    className="h-full bg-blue-600 transition-all"
                    style={{
                      width: `${Math.min((stats.currentMonth / stats.monthlyBudget) * 100, 100)}%`,
                    }}
                  />
                </div>
                {budgetWarning && (
                  <div
                    className={`mt-1 text-xs font-medium ${
                      budgetWarning.level === 'exceeded' ? 'text-red-600' : 'text-amber-600'
                    }`}
                  >
                    {budgetWarning.message}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showTemplates && (
          <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-semibold">Templates</h2>
              <div className="flex gap-2">
                <label className="cursor-pointer rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-300">
                  Import
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportTemplates}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={handleExportTemplates}
                  className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-300"
                >
                  Export
                </button>
                <button
                  onClick={() => setShowCustomTemplateModal(true)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Create Custom
                </button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {getAllTemplates().map(template => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  className={`rounded-lg border-2 p-4 text-left transition-colors ${
                    selectedTemplate === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="font-semibold">{template.name}</div>
                    {template.isCustom && (
                      <span className="rounded bg-zinc-200 px-2 py-0.5 text-xs">Custom</span>
                    )}
                  </div>
                  <div className="text-sm text-zinc-600">{template.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {showHistory && (
          <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">History</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleExportHTML}
                  className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-300"
                >
                  Export HTML
                </button>
                <button
                  onClick={async () => {
                    await fetch('/api/history', { method: 'DELETE' });
                    await loadHistory();
                  }}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {history.length === 0 ? (
                <p className="text-zinc-600">No history yet</p>
              ) : (
                history.map(entry => (
                  <div key={entry.id} className="border-b border-zinc-200 pb-4">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-zinc-600">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                      <span className="font-medium">${entry.cost.toFixed(4)}</span>
                    </div>
                    <div className="mb-2">
                      <div className="text-sm font-medium">Original:</div>
                      <div className="text-sm text-zinc-600">{entry.originalPrompt}</div>
                    </div>
                    <div className="mb-2">
                      <div className="text-sm font-medium">Refined:</div>
                      <div className="text-sm text-zinc-600">{entry.refinedPrompt}</div>
                    </div>
                    {entry.resultUrl && (
                      <img
                        src={entry.resultUrl}
                        alt="Result"
                        className="mt-2 h-32 w-auto rounded border border-zinc-200"
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center justify-center gap-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                currentStep === 'upload' ? 'bg-blue-600 text-white' : 'bg-zinc-200 text-zinc-600'
              }`}
            >
              1
            </div>
            <div className="h-1 w-16 bg-zinc-200" />
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                currentStep === 'confirm' ? 'bg-blue-600 text-white' : 'bg-zinc-200 text-zinc-600'
              }`}
            >
              2
            </div>
            <div className="h-1 w-16 bg-zinc-200" />
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                currentStep === 'result' ? 'bg-blue-600 text-white' : 'bg-zinc-200 text-zinc-600'
              }`}
            >
              3
            </div>
          </div>
          <div className="mt-2 flex justify-center gap-16 text-sm">
            <span className={currentStep === 'upload' ? 'font-medium' : 'text-zinc-600'}>
              Upload
            </span>
            <span className={currentStep === 'confirm' ? 'font-medium' : 'text-zinc-600'}>
              Confirm
            </span>
            <span className={currentStep === 'result' ? 'font-medium' : 'text-zinc-600'}>
              Result
            </span>
          </div>
        </div>

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

            {currentStep === 'upload' && (
              <>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Describe the change you want..."
                  className="w-full rounded-lg border border-zinc-300 p-4 text-zinc-900 focus:border-blue-500 focus:outline-none"
                  rows={4}
                />

                <button
                  onClick={handleGenerate}
                  disabled={!selectedImage || !prompt || isGenerating}
                  className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
                >
                  {isGenerating ? 'Planning...' : 'Generate'}
                </button>
              </>
            )}

            {currentStep === 'confirm' && (
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">Refined Prompt</label>
                  <textarea
                    value={refinedPrompt}
                    onChange={e => setRefinedPrompt(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 p-4 text-zinc-900 focus:border-blue-500 focus:outline-none"
                    rows={6}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentStep('upload')}
                    className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2 font-medium text-zinc-900 hover:bg-zinc-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={isGenerating}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
                  >
                    {isGenerating ? 'Generating...' : 'Confirm & Generate'}
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'result' && resultUrl && (
              <div className="space-y-4">
                <div className="rounded-lg border border-zinc-200 bg-white p-4">
                  <div className="mb-2 text-sm text-zinc-600">Cost: ${cost.toFixed(4)}</div>
                </div>
                <button
                  onClick={() => {
                    setCurrentStep('upload');
                    setResultUrl(null);
                    setRefinedPrompt('');
                    setThreadId(null);
                  }}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                >
                  Generate Another
                </button>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
                {error}
              </div>
            )}
          </div>

          <div>
            {currentStep === 'result' && resultUrl ? (
              <div>
                <h2 className="mb-4 text-2xl font-semibold text-zinc-900">Result</h2>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resultUrl}
                  alt="Generated result"
                  className="w-full rounded-lg border border-zinc-200"
                />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 p-8 text-center text-zinc-600">
                {currentStep === 'upload' && 'Upload an image and describe changes to get started'}
                {currentStep === 'confirm' && 'Review and edit the refined prompt'}
                {currentStep === 'result' && 'Result will appear here'}
              </div>
            )}
          </div>
        </div>
      </div>

      {showCustomTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold">Create Custom Template</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={customTemplateName}
                  onChange={e => setCustomTemplateName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 p-2 text-zinc-900 focus:border-blue-500 focus:outline-none"
                  placeholder="Template name"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Prompt</label>
                <textarea
                  value={customTemplatePrompt}
                  onChange={e => setCustomTemplatePrompt(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 p-2 text-zinc-900 focus:border-blue-500 focus:outline-none"
                  rows={6}
                  placeholder="Template prompt text"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowCustomTemplateModal(false);
                    setCustomTemplateName('');
                    setCustomTemplatePrompt('');
                  }}
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2 font-medium text-zinc-900 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCustomTemplate}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
