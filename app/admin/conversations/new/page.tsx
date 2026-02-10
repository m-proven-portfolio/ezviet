'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import type { Category } from '@/lib/supabase/types';
import type { ConversationAIResponse } from '@/lib/types/conversation';
import { getIconForSelect } from '@/components/CategoryIcon';

// Confetti celebration
function triggerConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#f59e0b', '#d97706', '#fbbf24', '#10b981', '#059669'],
  });
}

// Manual input line structure
interface ManualLine {
  speaker: string;
  vietnamese: string;
}

// Image generation models - extensible for future additions
type ImageModel = 'openai' | 'gemini';

const IMAGE_MODELS: { id: ImageModel; label: string; icon: string }[] = [
  { id: 'openai', label: 'DALL-E 3', icon: '🎨' },
  { id: 'gemini', label: 'Gemini', icon: '✨' },
];

export default function NewConversationPage() {
  const router = useRouter();

  // Input mode: 'ai', 'manual', or 'fullauto'
  const [inputMode, setInputMode] = useState<'ai' | 'manual' | 'fullauto'>('ai');

  // Image source state
  const [imageSource, setImageSource] = useState<'upload' | 'generate'>('upload');
  const [imageModel, setImageModel] = useState<ImageModel>('openai');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Form state (shared)
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [imagePath, setImagePath] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [difficulty, setDifficulty] = useState(1);

  // AI mode state
  const [prompt, setPrompt] = useState('');

  // Manual mode state
  const [manualLines, setManualLines] = useState<ManualLine[]>([
    { speaker: 'A', vietnamese: '' },
    { speaker: 'B', vietnamese: '' },
  ]);
  const [manualTitle, setManualTitle] = useState('');

  // Generated content
  const [generatedContent, setGeneratedContent] = useState<ConversationAIResponse | null>(null);

  // UI state
  const [categories, setCategories] = useState<Category[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'input' | 'preview'>('input');

  // Audio preview state
  const [editedLines, setEditedLines] = useState<Set<number>>(new Set());
  const [previewAudio, setPreviewAudio] = useState<Record<number, string>>({});
  const [regeneratingLine, setRegeneratingLine] = useState<number | null>(null);

  // Fetch categories on mount
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(console.error);
  }, []);

  // Handle image upload
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'cards-images');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      setImagePath(data.path);
      setImagePreviewUrl(data.publicUrl);
    } catch (err) {
      setError('Failed to upload image. Please try again.');
      setImageFile(null);
      setImagePreviewUrl('');
    } finally {
      setIsUploading(false);
    }
  }

  // Generate conversation via AI (scene description mode)
  async function handleGenerate() {
    if (!prompt.trim() || !imagePath) return;

    setIsGenerating(true);
    setError('');

    try {
      const res = await fetch('/api/generate/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), difficulty }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Generation failed');
      }

      const content: ConversationAIResponse = await res.json();
      setGeneratedContent(content);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate conversation');
    } finally {
      setIsGenerating(false);
    }
  }

  // Generate from manual Vietnamese input
  async function handleManualGenerate() {
    const validLines = manualLines.filter(l => l.vietnamese.trim());
    if (validLines.length === 0 || !imagePath) return;

    setIsGenerating(true);
    setError('');

    try {
      const res = await fetch('/api/generate/conversation-lines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines: validLines }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Translation failed');
      }

      const data = await res.json();

      // Build ConversationAIResponse structure
      const title = manualTitle.trim() || 'Conversation';
      const content: ConversationAIResponse = {
        title,
        title_vi: title,
        lines: data.lines,
        meta_description: `Learn Vietnamese through this conversation with audio and translations.`,
        prompt_version: data.prompt_version,
      };

      setGeneratedContent(content);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to translate conversation');
    } finally {
      setIsGenerating(false);
    }
  }

  // Generate image with selected model
  async function handleGenerateImage(promptOverride?: string) {
    const imagePromptToUse = promptOverride || prompt.trim();
    if (!imagePromptToUse) return;

    setIsGeneratingImage(true);
    setError('');

    try {
      const endpoint = imageModel === 'gemini'
        ? '/api/generate/image-gemini'
        : '/api/generate/image';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePromptToUse }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Image generation failed');
      }

      const data = await res.json();
      setImagePath(data.storagePath);
      setImagePreviewUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setIsGeneratingImage(false);
    }
  }

  // Full Auto: Generate everything from a single prompt
  async function handleFullAutoGenerate() {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError('');

    try {
      // Step 1: Generate image prompt from situation
      const promptRes = await fetch('/api/generate/image-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation: prompt.trim() }),
      });

      if (!promptRes.ok) {
        const data = await promptRes.json();
        throw new Error(data.error || 'Failed to generate image prompt');
      }

      const { imagePrompt } = await promptRes.json();

      // Step 2: Generate the image
      const imageEndpoint = imageModel === 'gemini'
        ? '/api/generate/image-gemini'
        : '/api/generate/image';

      const imageRes = await fetch(imageEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt }),
      });

      if (!imageRes.ok) {
        const data = await imageRes.json();
        throw new Error(data.error || 'Image generation failed');
      }

      const imageData = await imageRes.json();
      setImagePath(imageData.storagePath);
      setImagePreviewUrl(imageData.url);

      // Step 3: Generate conversation
      const convRes = await fetch('/api/generate/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), difficulty }),
      });

      if (!convRes.ok) {
        const data = await convRes.json();
        throw new Error(data.error || 'Conversation generation failed');
      }

      const content: ConversationAIResponse = await convRes.json();
      setGeneratedContent(content);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate');
    } finally {
      setIsGenerating(false);
    }
  }

  // Add a new manual line
  function addManualLine() {
    const nextSpeaker = manualLines.length % 2 === 0 ? 'A' : 'B';
    setManualLines([...manualLines, { speaker: nextSpeaker, vietnamese: '' }]);
  }

  // Remove a manual line
  function removeManualLine(index: number) {
    if (manualLines.length <= 1) return;
    setManualLines(manualLines.filter((_, i) => i !== index));
  }

  // Update a manual line
  function updateManualLine(index: number, field: keyof ManualLine, value: string) {
    setManualLines(manualLines.map((line, i) =>
      i === index ? { ...line, [field]: value } : line
    ));
  }

  // Save conversation to database
  async function handleSave() {
    if (!generatedContent || !imagePath) return;

    setIsSaving(true);
    setError('');

    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: generatedContent.title,
          title_vi: generatedContent.title_vi,
          scene_image_path: imagePath,
          category_id: categoryId || null,
          difficulty,
          meta_description: generatedContent.meta_description,
          generated_by_ai: true,
          prompt_used: prompt.trim(),
          prompt_version: generatedContent.prompt_version,
          is_published: true,
          lines: generatedContent.lines,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      const conversation = await res.json();
      triggerConfetti();

      // Redirect to the conversation or admin list
      router.push(`/admin/conversations`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save conversation');
    } finally {
      setIsSaving(false);
    }
  }

  // Edit generated content
  function updateLine(index: number, field: string, value: string) {
    if (!generatedContent) return;

    // Track Vietnamese text edits for audio regeneration
    if (field === 'vietnamese') {
      setEditedLines(prev => new Set(prev).add(index));
    }

    setGeneratedContent({
      ...generatedContent,
      lines: generatedContent.lines.map((line, i) =>
        i === index ? { ...line, [field]: value } : line
      ),
    });
  }

  // Regenerate audio for a specific line
  async function regenerateAudio(index: number) {
    if (!generatedContent) return;

    const line = generatedContent.lines[index];
    if (!line?.vietnamese.trim()) return;

    setRegeneratingLine(index);
    setError('');

    try {
      const res = await fetch('/api/generate/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: line.vietnamese }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Audio generation failed');
      }

      const { audioContent } = await res.json();

      // Create data URL for preview playback
      const audioUrl = `data:audio/mpeg;base64,${audioContent}`;
      setPreviewAudio(prev => ({ ...prev, [index]: audioUrl }));

      // Mark line as no longer dirty
      setEditedLines(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate audio');
    } finally {
      setRegeneratingLine(null);
    }
  }

  // Play preview audio for a line
  function playPreviewAudio(index: number) {
    const audioUrl = previewAudio[index];
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audio.play().catch(console.error);
  }

  // Validation for all modes
  const validManualLines = manualLines.filter(l => l.vietnamese.trim()).length;
  const canGenerateAI = prompt.trim().length > 0 && imagePath && !isUploading;
  const canGenerateManual = validManualLines > 0 && imagePath && !isUploading;
  const canGenerateFullAuto = prompt.trim().length > 0 && !isGeneratingImage;
  const canGenerate = inputMode === 'fullauto'
    ? canGenerateFullAuto
    : inputMode === 'ai'
      ? canGenerateAI
      : canGenerateManual;
  const canSave = generatedContent && !isSaving;

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/cards/new" className="text-gray-600 hover:text-gray-900 text-sm">
            ← Back to Card Types
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4 flex items-center gap-3">
            <span className="text-4xl">💬</span>
            Create Conversation Flashcard
          </h1>
          <p className="text-gray-600 mt-1">
            Generate interactive Vietnamese conversations with AI
          </p>
        </div>

        {step === 'input' ? (
          /* ============ STEP 1: INPUT ============ */
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {/* Progress indicator */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold">
                  1
                </div>
                <span className="font-medium">Create</span>
              </div>
              <div className="flex-1 h-1 bg-gray-200 rounded" />
              <div className="flex items-center gap-2 opacity-40">
                <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-500 flex items-center justify-center font-bold">
                  2
                </div>
                <span>Preview & Publish</span>
              </div>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-8 p-1 bg-gray-100 rounded-xl">
              <button
                type="button"
                onClick={() => setInputMode('ai')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  inputMode === 'ai'
                    ? 'bg-white shadow-sm text-amber-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>✨</span>
                AI Generate
              </button>
              <button
                type="button"
                onClick={() => setInputMode('manual')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  inputMode === 'manual'
                    ? 'bg-white shadow-sm text-amber-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>✏️</span>
                Manual Input
              </button>
              <button
                type="button"
                onClick={() => setInputMode('fullauto')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  inputMode === 'fullauto'
                    ? 'bg-white shadow-sm text-amber-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>🚀</span>
                Full Auto
              </button>
            </div>

            <div className="space-y-8">
              {/* Scene Image Section - Only show for AI and Manual modes */}
              {inputMode !== 'fullauto' && (
                <div>
                  <label className="block text-lg font-semibold text-gray-800 mb-3">
                    Scene Image *
                  </label>

                  {/* Image Source Toggle */}
                  <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-lg w-fit">
                    <button
                      type="button"
                      onClick={() => setImageSource('upload')}
                      className={`py-2 px-4 rounded-md text-sm font-medium transition-all ${
                        imageSource === 'upload'
                          ? 'bg-white shadow-sm text-gray-900'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      📤 Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageSource('generate')}
                      className={`py-2 px-4 rounded-md text-sm font-medium transition-all ${
                        imageSource === 'generate'
                          ? 'bg-white shadow-sm text-gray-900'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      ✨ Generate
                    </button>
                  </div>

                  {imageSource === 'upload' ? (
                    /* Upload Mode */
                    <div className="border-2 border-dashed border-amber-300 rounded-xl p-8 text-center hover:border-amber-500 transition-colors bg-amber-50/50">
                      {imagePreviewUrl ? (
                        <div className="relative inline-block">
                          <img
                            src={imagePreviewUrl}
                            alt="Scene preview"
                            className="max-h-48 rounded-lg shadow-md"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreviewUrl('');
                              setImagePath('');
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 text-lg shadow-md hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={isUploading}
                            className="hidden"
                            id="scene-upload"
                          />
                          <label htmlFor="scene-upload" className="cursor-pointer">
                            {isUploading ? (
                              <div className="text-amber-600">
                                <span className="text-5xl block mb-3 animate-bounce">📸</span>
                                <span>Uploading...</span>
                              </div>
                            ) : (
                              <div className="text-gray-500 hover:text-amber-600 transition-colors">
                                <span className="text-6xl block mb-3">🖼️</span>
                                <span className="text-lg font-medium block mb-1">
                                  Click to upload scene image
                                </span>
                                <span className="text-sm text-gray-400">
                                  This will be shown at the top of the conversation
                                </span>
                              </div>
                            )}
                          </label>
                        </>
                      )}
                    </div>
                  ) : (
                    /* Generate Mode */
                    <div className="border-2 border-amber-300 rounded-xl p-6 bg-amber-50/50">
                      {imagePreviewUrl ? (
                        <div className="text-center">
                          <div className="relative inline-block">
                            <img
                              src={imagePreviewUrl}
                              alt="Generated scene"
                              className="max-h-48 rounded-lg shadow-md"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setImagePreviewUrl('');
                                setImagePath('');
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 text-lg shadow-md hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Model Selector */}
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Image Model
                            </label>
                            <div className="flex gap-2">
                              {IMAGE_MODELS.map((model) => (
                                <button
                                  key={model.id}
                                  type="button"
                                  onClick={() => setImageModel(model.id)}
                                  className={`py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                                    imageModel === model.id
                                      ? 'bg-amber-500 text-white shadow-md'
                                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                  }`}
                                >
                                  <span>{model.icon}</span>
                                  {model.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Generate Button */}
                          <button
                            type="button"
                            onClick={() => handleGenerateImage(prompt.trim() || 'A warm Vietnamese scene')}
                            disabled={isGeneratingImage}
                            className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                              isGeneratingImage
                                ? 'bg-gray-200 text-gray-500 cursor-wait'
                                : 'bg-amber-500 hover:bg-amber-600 text-white'
                            }`}
                          >
                            {isGeneratingImage ? (
                              <>
                                <span className="animate-spin">✨</span>
                                Generating with {IMAGE_MODELS.find(m => m.id === imageModel)?.label}...
                              </>
                            ) : (
                              <>
                                <span>✨</span>
                                Generate Scene Image
                              </>
                            )}
                          </button>
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            Uses your situation description to create a scene image
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Mode-specific input */}
              {inputMode === 'fullauto' ? (
                /* Full Auto Mode: Single prompt generates everything */
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 text-amber-800 font-medium">
                      <span>🚀</span>
                      <span>Full Auto Mode</span>
                    </div>
                    <p className="text-sm text-amber-700 mt-1">
                      One prompt generates the scene image AND conversation automatically
                    </p>
                  </div>

                  <div>
                    <label className="block text-lg font-semibold text-gray-800 mb-3">
                      Describe the Situation *
                    </label>
                    <div className="relative">
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., Asking how much is an item at a souvenir shop"
                        rows={3}
                        className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 text-lg transition-all text-gray-900"
                      />
                      {prompt.trim() && (
                        <div className="absolute right-3 top-3 text-xs text-amber-600 font-medium">
                          🚀 Will generate image + conversation
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="text-xs text-gray-500">Try:</span>
                      {[
                        'Ordering phở at a restaurant',
                        'Buying fruits at the market',
                        'Asking for directions',
                        'Checking into a hotel',
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => setPrompt(suggestion)}
                          className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Image Model Selector for Full Auto */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Image Model
                    </label>
                    <div className="flex gap-2">
                      {IMAGE_MODELS.map((model) => (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => setImageModel(model.id)}
                          className={`py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                            imageModel === model.id
                              ? 'bg-amber-500 text-white shadow-md'
                              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                          }`}
                        >
                          <span>{model.icon}</span>
                          {model.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : inputMode === 'ai' ? (
                /* AI Mode: Describe the situation */
                <div>
                  <label className="block text-lg font-semibold text-gray-800 mb-3">
                    Describe the Situation *
                  </label>
                  <div className="relative">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g., Ordering coffee at a Vietnamese café"
                      rows={3}
                      className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 text-lg transition-all text-gray-900"
                    />
                    {prompt.trim() && (
                      <div className="absolute right-3 top-3 text-xs text-amber-600 font-medium">
                        ✨ AI will generate the conversation
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-xs text-gray-500">Try:</span>
                    {[
                      'Ordering phở at a restaurant',
                      'Buying fruits at the market',
                      'Asking for directions',
                      'Checking into a hotel',
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setPrompt(suggestion)}
                        className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Manual Mode: Type Vietnamese directly */
                <div className="space-y-4">
                  <div>
                    <label className="block text-lg font-semibold text-gray-800 mb-3">
                      Conversation Title
                    </label>
                    <input
                      type="text"
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      placeholder="e.g., Buying bananas at the market"
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-lg font-semibold text-gray-800 mb-3">
                      Vietnamese Dialogue *
                    </label>
                    <p className="text-sm text-gray-500 mb-4">
                      Type your Vietnamese sentences. AI will translate to English and generate pronunciation.
                    </p>

                    <div className="space-y-3">
                      {manualLines.map((line, index) => (
                        <div key={index} className="flex gap-2 items-start">
                          <input
                            type="text"
                            value={line.speaker}
                            onChange={(e) => updateManualLine(index, 'speaker', e.target.value)}
                            className="w-16 px-3 py-3 rounded-lg border border-gray-300 text-center font-medium text-gray-700"
                            placeholder="A"
                          />
                          <input
                            type="text"
                            value={line.vietnamese}
                            onChange={(e) => updateManualLine(index, 'vietnamese', e.target.value)}
                            placeholder="Type Vietnamese sentence..."
                            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 text-gray-900"
                          />
                          <button
                            type="button"
                            onClick={() => removeManualLine(index)}
                            disabled={manualLines.length <= 1}
                            className="px-3 py-3 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={addManualLine}
                      className="mt-3 px-4 py-2 text-amber-600 hover:text-amber-700 font-medium text-sm flex items-center gap-1"
                    >
                      <span>+</span> Add line
                    </button>
                  </div>
                </div>
              )}

              {/* Category & Difficulty - Side by side */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 text-gray-900"
                  >
                    <option value="">Select category...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {getIconForSelect(cat.icon)} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Difficulty
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setDifficulty(level)}
                        className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                          difficulty === level
                            ? 'bg-amber-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Generate Button - Big and prominent */}
              <button
                onClick={
                  inputMode === 'fullauto'
                    ? handleFullAutoGenerate
                    : inputMode === 'ai'
                      ? handleGenerate
                      : handleManualGenerate
                }
                disabled={!canGenerate || isGenerating || isGeneratingImage}
                className={`w-full py-5 rounded-xl font-bold text-xl transition-all ${
                  canGenerate && !isGenerating && !isGeneratingImage
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="animate-spin">✨</span>
                    {inputMode === 'fullauto'
                      ? 'Generating Everything...'
                      : inputMode === 'ai'
                        ? 'Generating Conversation...'
                        : 'Translating...'}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>{inputMode === 'fullauto' ? '🚀' : inputMode === 'ai' ? '✨' : '🔄'}</span>
                    {inputMode === 'fullauto'
                      ? 'Generate Everything'
                      : inputMode === 'ai'
                        ? 'Generate Conversation'
                        : 'Translate & Continue'}
                  </span>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* ============ STEP 2: PREVIEW & PUBLISH ============ */
          <div className="space-y-6">
            {/* Progress indicator */}
            <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
              <div className="flex items-center gap-2 opacity-60">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  ✓
                </div>
                <span>Create</span>
              </div>
              <div className="flex-1 h-1 bg-emerald-500 rounded" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold">
                  2
                </div>
                <span className="font-medium">Preview & Publish</span>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Preview Card */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="relative h-48">
                  <img
                    src={imagePreviewUrl}
                    alt="Scene"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="backdrop-blur-md bg-black/40 rounded-lg px-4 py-3">
                      <input
                        type="text"
                        value={generatedContent?.title || ''}
                        onChange={(e) => setGeneratedContent(prev =>
                          prev ? { ...prev, title: e.target.value } : prev
                        )}
                        className="text-white text-xl font-bold bg-transparent border-b border-white/50 w-full focus:outline-none focus:border-white drop-shadow-sm"
                      />
                      <input
                        type="text"
                        value={generatedContent?.title_vi || ''}
                        onChange={(e) => setGeneratedContent(prev =>
                          prev ? { ...prev, title_vi: e.target.value } : prev
                        )}
                        className="text-white/90 text-sm bg-transparent border-b border-white/30 w-full mt-1 focus:outline-none focus:border-white/60 drop-shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                  {generatedContent?.lines.map((line, index) => (
                    <div
                      key={index}
                      className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                          index % 2 === 0
                            ? 'bg-gray-100 rounded-bl-md'
                            : 'bg-amber-100 rounded-br-md'
                        }`}
                      >
                        <div className="text-xs font-medium text-gray-500 mb-1">
                          {line.speaker}
                        </div>
                        <p className="text-gray-900 font-medium">{line.vietnamese}</p>
                        <p className="text-sm text-gray-500 italic">/{line.romanization}/</p>
                        <p className="text-sm text-gray-600 mt-2 pt-2 border-t border-gray-200">
                          {line.english}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Edit Panel */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="font-bold text-lg mb-4">Edit Dialogue</h3>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {generatedContent?.lines.map((line, index) => (
                    <div key={index} className={`p-4 rounded-lg space-y-2 ${editedLines.has(index) ? 'bg-amber-50 ring-2 ring-amber-200' : 'bg-gray-50'}`}>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={line.speaker}
                          onChange={(e) => updateLine(index, 'speaker', e.target.value)}
                          className="flex-1 px-3 py-1 text-sm rounded border border-gray-300 text-gray-900"
                          placeholder="Speaker"
                        />
                        <input
                          type="text"
                          value={line.speaker_vi}
                          onChange={(e) => updateLine(index, 'speaker_vi', e.target.value)}
                          className="flex-1 px-3 py-1 text-sm rounded border border-gray-300 text-gray-900"
                          placeholder="Speaker (Vietnamese)"
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={line.vietnamese}
                          onChange={(e) => updateLine(index, 'vietnamese', e.target.value)}
                          className={`flex-1 px-3 py-2 rounded border font-medium text-gray-900 ${editedLines.has(index) ? 'border-amber-400 bg-white' : 'border-gray-300'}`}
                          placeholder="Vietnamese"
                        />
                        {/* Audio controls */}
                        <div className="flex gap-1">
                          {previewAudio[index] && (
                            <button
                              type="button"
                              onClick={() => playPreviewAudio(index)}
                              className="px-3 py-2 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                              title="Play preview audio"
                            >
                              ▶
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => regenerateAudio(index)}
                            disabled={regeneratingLine === index}
                            className={`px-3 py-2 rounded transition-colors ${
                              editedLines.has(index)
                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                : 'text-gray-500 hover:bg-gray-100'
                            } disabled:opacity-50`}
                            title={editedLines.has(index) ? 'Regenerate audio for edited text' : 'Preview audio'}
                          >
                            {regeneratingLine === index ? '...' : '🔊'}
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={line.romanization}
                        onChange={(e) => updateLine(index, 'romanization', e.target.value)}
                        className="w-full px-3 py-2 rounded border border-gray-300 text-sm text-gray-600"
                        placeholder="Pronunciation"
                      />
                      <input
                        type="text"
                        value={line.english}
                        onChange={(e) => updateLine(index, 'english', e.target.value)}
                        className="w-full px-3 py-2 rounded border border-gray-300 text-gray-900"
                        placeholder="English"
                      />
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="mt-6 space-y-3">
                  {error && (
                    <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleSave}
                    disabled={!canSave}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                      canSave
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isSaving ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⏳</span>
                        Saving & Generating Audio...
                      </span>
                    ) : (
                      'Publish Conversation 🚀'
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setStep('input');
                      setGeneratedContent(null);
                    }}
                    className="w-full py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    ← Back to Edit Prompt
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
