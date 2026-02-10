'use client';

import { useState, useRef, useEffect } from 'react';
import { translateEnToVi, translateViToEn } from '@/lib/dictionary';

type Mode = 'en-to-vi' | 'vi-to-en';

export default function Home() {
  const [mode, setMode] = useState<Mode>('en-to-vi');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [sourceText, setSourceText] = useState('');
  const [targetText, setTargetText] = useState('');
  const [autoFill, setAutoFill] = useState(true);
  const [manuallyEdited, setManuallyEdited] = useState(false);
  const [notFoundMessage, setNotFoundMessage] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  // Reset when mode changes
  useEffect(() => {
    setSourceText('');
    setTargetText('');
    setManuallyEdited(false);
    setNotFoundMessage('');
  }, [mode]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSourceChange = (value: string) => {
    setSourceText(value);
    setNotFoundMessage('');

    // Auto-fill if enabled and not manually edited
    if (autoFill && !manuallyEdited && value.trim()) {
      const translation = mode === 'en-to-vi'
        ? translateEnToVi(value)
        : translateViToEn(value);

      if (translation) {
        setTargetText(translation);
        setNotFoundMessage('');
      } else {
        setTargetText('');
        setNotFoundMessage('Not found in dictionary');
      }
    }
  };

  const handleTargetChange = (value: string) => {
    setTargetText(value);
    // Mark as manually edited once user types in target field
    setManuallyEdited(true);
  };

  const handleAutoFillToggle = (checked: boolean) => {
    setAutoFill(checked);
    if (!checked) {
      setManuallyEdited(false);
    }
  };

  const handleGenerate = async () => {
    const vietnamese = mode === 'en-to-vi' ? targetText : sourceText;
    const english = mode === 'en-to-vi' ? sourceText : targetText;

    if (!imageFile || !vietnamese || !english) {
      alert('Please provide an image, source text, and target text');
      return;
    }

    setIsGenerating(true);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('vi', vietnamese);
      formData.append('en', english);

      const response = await fetch('/api/render', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate flashcard');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setGeneratedImage(url);
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate flashcard');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedImage && downloadLinkRef.current) {
      downloadLinkRef.current.href = generatedImage;
      downloadLinkRef.current.download = `flashcard-${sourceText.slice(0, 20)}.png`;
      downloadLinkRef.current.click();
    }
  };

  const sourceLabel = mode === 'en-to-vi' ? 'English Word' : 'Vietnamese Word';
  const targetLabel = mode === 'en-to-vi' ? 'Vietnamese Translation' : 'English Translation';
  const sourcePlaceholder = mode === 'en-to-vi' ? 'e.g., orange' : 'e.g., TRÁI ĐU ĐỦ';
  const targetPlaceholder = mode === 'en-to-vi' ? 'e.g., trái cam' : 'e.g., papaya';

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 text-center bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            Vietnamese Flashcard Generator
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Create 2048×2048 flashcards with perfect Vietnamese diacritics
          </p>

          {/* Mode Toggle */}
          <div className="mb-8 bg-gray-50 rounded-xl p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Translation Direction
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setMode('en-to-vi')}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${mode === 'en-to-vi'
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-emerald-300'
                  }`}
              >
                English → Vietnamese
              </button>
              <button
                onClick={() => setMode('vi-to-en')}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${mode === 'vi-to-en'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300'
                  }`}
              >
                Vietnamese → English
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Upload Photo
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageUpload}
                className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
              />
              {imagePreview && (
                <div className="mt-4 flex justify-center">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-xs rounded-lg shadow-md"
                  />
                </div>
              )}
            </div>

            {/* Source Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {sourceLabel}
              </label>
              <input
                type="text"
                value={sourceText}
                onChange={(e) => handleSourceChange(e.target.value)}
                placeholder={sourcePlaceholder}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg text-gray-900"
              />
            </div>

            {/* Auto-fill Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="autoFill"
                checked={autoFill}
                onChange={(e) => handleAutoFillToggle(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <label htmlFor="autoFill" className="text-sm font-medium text-gray-700">
                Auto-fill from dictionary
              </label>
              {notFoundMessage && (
                <span className="text-sm text-amber-600 ml-2">
                  ⚠️ {notFoundMessage}
                </span>
              )}
            </div>

            {/* Target Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {targetLabel}
                {manuallyEdited && (
                  <span className="ml-2 text-xs text-blue-600 font-normal">
                    (manually edited)
                  </span>
                )}
              </label>
              <input
                type="text"
                value={targetText}
                onChange={(e) => handleTargetChange(e.target.value)}
                placeholder={targetPlaceholder}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-gray-900"
              />
              {manuallyEdited && (
                <p className="mt-1 text-xs text-gray-500">
                  Clear this field to re-enable auto-fill
                </p>
              )}
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!imageFile || !sourceText || !targetText || isGenerating}
              className={`w-full font-bold py-4 px-6 rounded-lg transition-all duration-200 text-lg shadow-lg ${mode === 'en-to-vi'
                ? 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400'
                : 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400'
                } text-white`}
            >
              {isGenerating ? 'Generating...' : 'Generate Flashcard'}
            </button>
          </div>

          {/* Preview Section */}
          {generatedImage && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Preview</h2>
              <div className="flex justify-center mb-4">
                <img
                  src={generatedImage}
                  alt="Generated Flashcard"
                  className="max-w-md rounded-lg shadow-xl border-4 border-emerald-200"
                />
              </div>
              <button
                onClick={handleDownload}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition-colors duration-200 text-lg shadow-lg"
              >
                Download PNG (2048×2048)
              </button>
              <a ref={downloadLinkRef} className="hidden" />
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-3">How to Use</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Choose your translation direction (EN→VI or VI→EN)</li>
            <li>Upload a photo (ideally on white background)</li>
            <li>Type the source word - target auto-fills from dictionary</li>
            <li>Edit either field if needed (auto-fill pauses after manual edits)</li>
            <li>Click Generate to create your flashcard</li>
            <li>Download the 2048×2048 PNG for your language learning book</li>
          </ol>
          <div className="mt-4 p-4 bg-emerald-50 rounded-lg">
            <p className="text-sm text-emerald-900">
              <strong>Note:</strong> To add more words to the dictionary, edit{' '}
              <code className="bg-emerald-100 px-2 py-1 rounded">data/concepts.json</code>
            </p>
            <p className="text-sm text-emerald-800 mt-2">
              The dictionary includes 15 fruits and 3 animals. Each entry supports multiple Vietnamese variants.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
