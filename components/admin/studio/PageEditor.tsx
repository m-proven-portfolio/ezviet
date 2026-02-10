'use client';

import type { StudioPage } from '@/lib/studio/types';
import { IntroPageEditor } from './editors/IntroPageEditor';
import { VocabularyGridEditor } from './editors/VocabularyGridEditor';
import { ConversationEditor } from './editors/ConversationEditor';
import { CulturalTipsEditor } from './editors/CulturalTipsEditor';
import { RevisionQuizEditor } from './editors/RevisionQuizEditor';
import { LexicsEditor } from './editors/LexicsEditor';
import { FreeFormEditor } from './editors/FreeFormEditor';
import { ImageLabelingEditor } from './editors/ImageLabelingEditor';
import { LessonPageEditor } from './editors/LessonPageEditor';

interface PageEditorProps {
  page: StudioPage;
  stylePrompt: string;
  onUpdate: (page: StudioPage) => void;
  onStylePromptSave?: (newStylePrompt: string) => void;
}

export function PageEditor({ page, stylePrompt, onUpdate, onStylePromptSave }: PageEditorProps) {
  switch (page.type) {
    case 'intro':
      return (
        <IntroPageEditor
          page={page}
          stylePrompt={stylePrompt}
          onUpdate={onUpdate}
          onStylePromptSave={onStylePromptSave}
        />
      );
    case 'vocabulary-grid':
      return (
        <VocabularyGridEditor
          page={page}
          stylePrompt={stylePrompt}
          onUpdate={onUpdate}
          onStylePromptSave={onStylePromptSave}
        />
      );
    case 'conversation':
      return (
        <ConversationEditor
          page={page}
          stylePrompt={stylePrompt}
          onUpdate={onUpdate}
          onStylePromptSave={onStylePromptSave}
        />
      );
    case 'cultural-tips':
      return (
        <CulturalTipsEditor
          page={page}
          stylePrompt={stylePrompt}
          onUpdate={onUpdate}
          onStylePromptSave={onStylePromptSave}
        />
      );
    case 'revision':
      return (
        <RevisionQuizEditor
          page={page}
          stylePrompt={stylePrompt}
          onUpdate={onUpdate}
          onStylePromptSave={onStylePromptSave}
        />
      );
    case 'lexics':
      return (
        <LexicsEditor
          page={page}
          stylePrompt={stylePrompt}
          onUpdate={onUpdate}
          onStylePromptSave={onStylePromptSave}
        />
      );
    case 'free-form':
      return (
        <FreeFormEditor
          page={page}
          stylePrompt={stylePrompt}
          onUpdate={onUpdate}
          onStylePromptSave={onStylePromptSave}
        />
      );
    case 'image-labeling':
      return (
        <ImageLabelingEditor
          page={page}
          stylePrompt={stylePrompt}
          onUpdate={onUpdate}
          onStylePromptSave={onStylePromptSave}
        />
      );
    case 'lesson':
      return (
        <LessonPageEditor
          page={page}
          stylePrompt={stylePrompt}
          onUpdate={onUpdate}
          onStylePromptSave={onStylePromptSave}
        />
      );
    default:
      return (
        <div className="rounded-lg bg-white p-6 text-center text-gray-500">
          Unknown page type
        </div>
      );
  }
}
