import { create } from 'zustand';
import type {
  VQLevel,
  VQPlayerStats,
  Scene,
  GameNode,
  SessionChoice,
  ResponseQuality,
  QUALITY_MULTIPLIERS,
  TRANSLATOR_PENALTY,
  ENERGY_COSTS,
} from '@/lib/vietquest/types';
import { findSceneById, findNodeById } from '@/lib/vietquest/types';

// ============================================
// TYPES
// ============================================

export type GamePhase =
  | 'loading' // Loading level data
  | 'playing' // Active gameplay
  | 'paused' // Game paused
  | 'completed' // Level finished
  | 'failed'; // Game over (out of energy, etc.)

// Translation result from translatePhrase action
interface TranslationResult {
  success: boolean;
  cost: number;
  cached: boolean;
}

// localStorage key for tutorial tracking
const INTRO_SEEN_KEY = 'vietquest_intro_seen';

interface VietQuestState {
  // Game phase
  phase: GamePhase;
  error: string | null;

  // Tutorial intro tracking
  hasSeenIntro: boolean;
  isInIntroScene: boolean;

  // Current level being played
  currentLevel: VQLevel | null;
  currentScene: Scene | null;
  currentNode: GameNode | null;
  currentNodeIndex: number;

  // Player state during session
  dong: number;
  energy: number;
  translatorEnabled: boolean;

  // Translation cache - tracks phrases translated this session
  // Only pay energy for NEW translations, re-accessing cached ones is free
  translatedPhrases: Set<string>;

  // Session tracking
  sessionDongEarned: number;
  sessionDongSpent: number;
  sessionTranslatorUses: number;
  sessionChoices: SessionChoice[];

  // Level completion stats
  levelStartTime: number | null;
  completionData: LevelCompletionData | null;

  // Actions - Level lifecycle
  loadLevel: (level: VQLevel, playerStats: VQPlayerStats) => void;
  startLevel: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  completeLevel: () => void;
  exitLevel: () => void;
  resetSession: () => void;

  // Actions - Tutorial intro
  markIntroSeen: () => void;
  skipIntro: () => void;
  checkIntroStatus: () => boolean;

  // Actions - Game navigation
  advanceToNode: (nodeId: string) => void;
  goToScene: (sceneId: string) => void;
  makeChoice: (choiceId: string, result: string) => void;
  selectResponse: (optionId: string, quality: ResponseQuality, result: string) => void;

  // Actions - Player state
  useTranslator: () => boolean;
  toggleTranslator: () => void;
  translatePhrase: (phraseVi: string) => TranslationResult;
  isPhraseTranslated: (phraseVi: string) => boolean;
  earnDong: (amount: number, bonus?: number) => void;
  spendDong: (amount: number) => boolean;
  spendEnergy: (amount: number) => boolean;

  // Computed getters
  canUseTranslator: () => boolean;
  getCurrentProgress: () => number; // 0-100 percentage
}

interface LevelCompletionData {
  dongEarned: number;
  dongSpent: number;
  netDong: number;
  translatorUses: number;
  timeSpentSeconds: number;
  perfectResponses: number;
  totalResponses: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateGrade(completionData: Omit<LevelCompletionData, 'grade'>): LevelCompletionData['grade'] {
  const { perfectResponses, totalResponses, translatorUses } = completionData;

  // Calculate accuracy percentage
  const accuracy = totalResponses > 0 ? (perfectResponses / totalResponses) * 100 : 0;

  // Penalty for translator uses
  const translatorPenalty = translatorUses * 10;

  // Final score
  const score = Math.max(0, accuracy - translatorPenalty);

  if (score >= 90) return 'S';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

// ============================================
// STORE
// ============================================

// Helper to check localStorage (safe for SSR)
const getIntroSeenFromStorage = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(INTRO_SEEN_KEY) === 'true';
};

export const useVietQuestStore = create<VietQuestState>((set, get) => ({
  // Initial state
  phase: 'loading',
  error: null,

  // Tutorial tracking
  hasSeenIntro: getIntroSeenFromStorage(),
  isInIntroScene: false,

  currentLevel: null,
  currentScene: null,
  currentNode: null,
  currentNodeIndex: 0,

  dong: 0,
  energy: 100,
  translatorEnabled: false,
  translatedPhrases: new Set<string>(),

  sessionDongEarned: 0,
  sessionDongSpent: 0,
  sessionTranslatorUses: 0,
  sessionChoices: [],

  levelStartTime: null,
  completionData: null,

  // ==========================================
  // Level Lifecycle Actions
  // ==========================================

  loadLevel: (level, playerStats) => {
    const { level_data } = level;
    const startScene = findSceneById(level_data, level_data.startScene);

    if (!startScene) {
      set({
        phase: 'loading',
        error: `Start scene "${level_data.startScene}" not found`,
      });
      return;
    }

    const firstNode = startScene.nodes[0] ?? null;

    // Check if starting in an intro scene
    const isStartingInIntro = startScene.id.startsWith('intro_');

    // If user has already seen intro, skip to first non-intro scene
    const hasSeenIntro = getIntroSeenFromStorage();
    let actualStartScene = startScene;
    let actualFirstNode = firstNode;
    let actualIsInIntro = isStartingInIntro;

    if (hasSeenIntro && isStartingInIntro) {
      // Find first non-intro scene
      const mainScene = level_data.scenes.find((scene) => !scene.id.startsWith('intro_'));
      if (mainScene) {
        actualStartScene = mainScene;
        actualFirstNode = mainScene.nodes[0] ?? null;
        actualIsInIntro = false;
      }
    }

    set({
      phase: 'loading',
      error: null,
      currentLevel: level,
      currentScene: actualStartScene,
      currentNode: actualFirstNode,
      currentNodeIndex: 0,
      dong: playerStats.total_dong,
      energy: playerStats.current_energy,
      translatorEnabled: false,
      translatedPhrases: new Set<string>(), // Reset cache on new level
      sessionDongEarned: 0,
      sessionDongSpent: 0,
      sessionTranslatorUses: 0,
      sessionChoices: [],
      levelStartTime: null,
      completionData: null,
      hasSeenIntro,
      isInIntroScene: actualIsInIntro,
    });
  },

  startLevel: () => {
    const state = get();
    const energyCost = state.currentLevel?.energy_cost ?? 10;

    // Check if player has enough energy
    if (state.energy < energyCost) {
      set({
        phase: 'failed',
        error: 'Not enough energy to start this level',
      });
      return;
    }

    set({
      phase: 'playing',
      energy: state.energy - energyCost,
      levelStartTime: Date.now(),
    });
  },

  pauseGame: () => {
    set({ phase: 'paused' });
  },

  resumeGame: () => {
    set({ phase: 'playing' });
  },

  completeLevel: () => {
    const state = get();
    const timeSpentSeconds = state.levelStartTime
      ? Math.floor((Date.now() - state.levelStartTime) / 1000)
      : 0;

    // Count perfect responses
    const perfectResponses = state.sessionChoices.filter(
      (c) => c.choiceId.includes('perfect')
    ).length;

    const totalResponses = state.sessionChoices.filter(
      (c) => c.nodeId.includes('response') || c.nodeId.includes('picker')
    ).length;

    const baseData = {
      dongEarned: state.sessionDongEarned,
      dongSpent: state.sessionDongSpent,
      netDong: state.sessionDongEarned - state.sessionDongSpent,
      translatorUses: state.sessionTranslatorUses,
      timeSpentSeconds,
      perfectResponses,
      totalResponses,
    };

    const completionData: LevelCompletionData = {
      ...baseData,
      grade: calculateGrade(baseData),
    };

    set({
      phase: 'completed',
      completionData,
    });
  },

  exitLevel: () => {
    set({
      phase: 'loading',
      currentLevel: null,
      currentScene: null,
      currentNode: null,
      currentNodeIndex: 0,
      error: null,
      completionData: null,
    });
  },

  resetSession: () => {
    set({
      phase: 'loading',
      error: null,
      currentLevel: null,
      currentScene: null,
      currentNode: null,
      currentNodeIndex: 0,
      dong: 0,
      energy: 100,
      translatorEnabled: false,
      translatedPhrases: new Set<string>(),
      sessionDongEarned: 0,
      sessionDongSpent: 0,
      sessionTranslatorUses: 0,
      sessionChoices: [],
      levelStartTime: null,
      completionData: null,
    });
  },

  // ==========================================
  // Tutorial Intro Actions
  // ==========================================

  markIntroSeen: () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(INTRO_SEEN_KEY, 'true');
    }
    set({ hasSeenIntro: true, isInIntroScene: false });
  },

  skipIntro: () => {
    const state = get();
    if (!state.currentLevel) return;

    // Mark intro as seen
    get().markIntroSeen();

    // Find first non-intro scene (scenes not starting with "intro_")
    const mainScene = state.currentLevel.level_data.scenes.find(
      (scene) => !scene.id.startsWith('intro_')
    );

    if (mainScene) {
      const firstNode = mainScene.nodes[0] ?? null;
      set({
        currentScene: mainScene,
        currentNode: firstNode,
        currentNodeIndex: 0,
        isInIntroScene: false,
      });
    }
  },

  checkIntroStatus: () => {
    return get().hasSeenIntro;
  },

  // ==========================================
  // Game Navigation Actions
  // ==========================================

  advanceToNode: (nodeId) => {
    const state = get();
    if (!state.currentLevel) return;

    // First, try to find as a node ID
    const node = findNodeById(state.currentLevel.level_data, nodeId);
    if (node) {
      // Check if this is the end node
      const endCondition = state.currentLevel.level_data.endCondition;
      if (endCondition.type === 'reach_node' && endCondition.nodeId === nodeId) {
        get().completeLevel();
        return;
      }

      // Find which scene this node belongs to
      for (const scene of state.currentLevel.level_data.scenes) {
        const nodeIndex = scene.nodes.findIndex((n) => n.id === nodeId);
        if (nodeIndex !== -1) {
          // Check if we're leaving an intro scene
          const wasInIntro = state.isInIntroScene;
          const nowInIntro = scene.id.startsWith('intro_');

          // If transitioning from intro to non-intro, mark intro as seen
          if (wasInIntro && !nowInIntro) {
            get().markIntroSeen();
          }

          set({
            currentScene: scene,
            currentNode: node,
            currentNodeIndex: nodeIndex,
            isInIntroScene: nowInIntro,
          });
          return;
        }
      }
    }

    // If not found as a node, try as a scene ID (for scene transitions)
    const scene = findSceneById(state.currentLevel.level_data, nodeId);
    if (scene) {
      const firstNode = scene.nodes[0] ?? null;

      // Check if we're leaving an intro scene
      const wasInIntro = state.isInIntroScene;
      const nowInIntro = scene.id.startsWith('intro_');

      // If transitioning from intro to non-intro, mark intro as seen
      if (wasInIntro && !nowInIntro) {
        get().markIntroSeen();
      }

      set({
        currentScene: scene,
        currentNode: firstNode,
        currentNodeIndex: 0,
        isInIntroScene: nowInIntro,
      });
      return;
    }

    // Neither node nor scene found
    console.error(`Node or scene "${nodeId}" not found`);
  },

  goToScene: (sceneId) => {
    const state = get();
    if (!state.currentLevel) return;

    const scene = findSceneById(state.currentLevel.level_data, sceneId);
    if (!scene) {
      console.error(`Scene "${sceneId}" not found`);
      return;
    }

    const firstNode = scene.nodes[0] ?? null;
    set({
      currentScene: scene,
      currentNode: firstNode,
      currentNodeIndex: 0,
    });
  },

  makeChoice: (choiceId, result) => {
    const state = get();
    if (!state.currentNode) return;

    // Record the choice
    set({
      sessionChoices: [
        ...state.sessionChoices,
        {
          nodeId: state.currentNode.id,
          choiceId,
          timestamp: Date.now(),
        },
      ],
    });

    // Navigate to result node
    get().advanceToNode(result);
  },

  selectResponse: (optionId, quality, result) => {
    const state = get();
    if (!state.currentNode || !state.currentLevel) return;

    // Calculate reward based on quality
    const baseReward = state.currentLevel.base_dong_reward;
    const qualityMultipliers = { perfect: 1.5, good: 1.0, awkward: 0.5, wrong: 0.0 };
    const multiplier = qualityMultipliers[quality];
    const translatorPenalty = state.translatorEnabled ? 0.75 : 1.0;
    const reward = Math.floor(baseReward * multiplier * translatorPenalty * 0.1); // 10% of base per response

    // Record the choice and earn dong
    set({
      sessionChoices: [
        ...state.sessionChoices,
        {
          nodeId: state.currentNode.id,
          choiceId: optionId,
          timestamp: Date.now(),
        },
      ],
      sessionDongEarned: state.sessionDongEarned + reward,
      dong: state.dong + reward,
    });

    // Navigate to result node
    get().advanceToNode(result);
  },

  // ==========================================
  // Player State Actions
  // ==========================================

  useTranslator: () => {
    const state = get();
    const energyCost = 10; // ENERGY_COSTS.TRANSLATOR_USE

    if (state.energy < energyCost) {
      return false;
    }

    set({
      translatorEnabled: true,
      energy: state.energy - energyCost,
      sessionTranslatorUses: state.sessionTranslatorUses + 1,
    });

    return true;
  },

  toggleTranslator: () => {
    const state = get();

    if (state.translatorEnabled) {
      // Turning off is free
      set({ translatorEnabled: false });
    } else {
      // Turning on costs energy
      get().useTranslator();
    }
  },

  // Translate a specific phrase - only charges for NEW translations
  translatePhrase: (phraseVi: string): TranslationResult => {
    const state = get();

    // Already translated this phrase? Free re-access!
    if (state.translatedPhrases.has(phraseVi)) {
      return { success: true, cost: 0, cached: true };
    }

    // New phrase - costs 10 energy
    const energyCost = 10;
    if (state.energy < energyCost) {
      return { success: false, cost: energyCost, cached: false };
    }

    // Deduct energy and add to cache
    const newCache = new Set(state.translatedPhrases);
    newCache.add(phraseVi);

    set({
      energy: state.energy - energyCost,
      sessionTranslatorUses: state.sessionTranslatorUses + 1,
      translatedPhrases: newCache,
    });

    return { success: true, cost: energyCost, cached: false };
  },

  // Check if a phrase has already been translated (free to view)
  isPhraseTranslated: (phraseVi: string): boolean => {
    return get().translatedPhrases.has(phraseVi);
  },

  earnDong: (amount, bonus = 0) => {
    set((state) => ({
      dong: state.dong + amount + bonus,
      sessionDongEarned: state.sessionDongEarned + amount + bonus,
    }));
  },

  spendDong: (amount) => {
    const state = get();
    if (state.dong < amount) return false;

    set({
      dong: state.dong - amount,
      sessionDongSpent: state.sessionDongSpent + amount,
    });
    return true;
  },

  spendEnergy: (amount) => {
    const state = get();
    if (state.energy < amount) return false;

    set({ energy: state.energy - amount });
    return true;
  },

  // ==========================================
  // Computed Getters
  // ==========================================

  canUseTranslator: () => {
    const state = get();
    return state.energy >= 10; // ENERGY_COSTS.TRANSLATOR_USE
  },

  getCurrentProgress: () => {
    const state = get();
    if (!state.currentLevel) return 0;

    const totalNodes = state.currentLevel.level_data.scenes.reduce(
      (sum, scene) => sum + scene.nodes.length,
      0
    );

    const visitedNodes = new Set(state.sessionChoices.map((c) => c.nodeId)).size;

    return Math.min(100, Math.floor((visitedNodes / totalNodes) * 100));
  },
}));

// ============================================
// SELECTORS (for performance optimization)
// ============================================

export const selectGamePhase = (state: VietQuestState) => state.phase;
export const selectCurrentNode = (state: VietQuestState) => state.currentNode;
export const selectCurrentScene = (state: VietQuestState) => state.currentScene;
export const selectWallet = (state: VietQuestState) => ({
  dong: state.dong,
  energy: state.energy,
});
export const selectTranslatorEnabled = (state: VietQuestState) => state.translatorEnabled;
export const selectCompletionData = (state: VietQuestState) => state.completionData;
