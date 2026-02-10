/**
 * VietQuest Types
 *
 * TypeScript interfaces for the VietQuest game system.
 * These types define the structure for levels, scenes, nodes, and player state.
 */

// ============================================
// WORLD & LEVEL TYPES
// ============================================

export interface VQWorld {
  id: string;
  slug: string;
  name_vi: string;
  name_en: string;
  description: string | null;
  difficulty: number;
  unlock_requirements: UnlockRequirements | null;
  cover_image_path: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface UnlockRequirements {
  world?: string; // Slug of required world
  level?: number; // Required level number in that world
}

export interface VQLevel {
  id: string;
  world_id: string;
  level_number: number;
  slug: string;
  title_vi: string;
  title_en: string;
  description: string | null;
  level_data: LevelData;
  base_dong_reward: number;
  energy_cost: number;
  version: number;
  status: 'draft' | 'live' | 'archived';
}

// ============================================
// LEVEL DATA STRUCTURE
// ============================================

export interface LevelData {
  scenes: Scene[];
  startScene: string;
  endCondition: EndCondition;
}

export interface Scene {
  id: string;
  type: 'dialogue' | 'choice' | 'challenge' | 'cutscene';
  background?: string;
  music?: string;
  nodes: GameNode[];
}

export interface EndCondition {
  type: 'reach_node';
  nodeId: string;
}

// ============================================
// NODE TYPES (Discriminated Union)
// ============================================

export type GameNode =
  | NarrationNode
  | NpcSaysNode
  | PlayerChoiceNode
  | ResponsePickerNode
  | RewardNode
  | GoToSceneNode;

export type NodeType =
  | 'narration'
  | 'npc_says'
  | 'player_choice'
  | 'response_picker'
  | 'reward'
  | 'go_to_scene';

// Base interface for all nodes
interface BaseNode {
  id: string;
  next: string | null;
}

// Narration: Story text, scene setting
export interface NarrationNode extends BaseNode {
  type: 'narration';
  text_vi: string;
  text_en: string;
}

// NPC Says: Character dialogue with audio
export interface NpcSaysNode extends BaseNode {
  type: 'npc_says';
  npc: string;
  text_vi: string;
  text_en: string;
  audio_path?: string;
  speed: 'slow' | 'normal' | 'fast';
  emotion: NpcEmotion;
}

export type NpcEmotion =
  | 'neutral'
  | 'friendly'
  | 'impatient'
  | 'confused'
  | 'happy'
  | 'sad'
  | 'angry';

// Player Choice: Story branch decisions
export interface PlayerChoiceNode extends Omit<BaseNode, 'next'> {
  type: 'player_choice';
  prompt: string;
  choices: PlayerChoice[];
}

export interface PlayerChoice {
  id: string;
  text_vi: string;
  text_en: string;
  energy_cost?: number;
  dong_cost?: number;
  consequence?: 'positive' | 'neutral' | 'negative';
  result: string; // Next node id
}

// Response Picker: Vietnamese phrase selection (v1 - no speech recognition)
export interface ResponsePickerNode extends Omit<BaseNode, 'next'> {
  type: 'response_picker';
  context_en: string;
  options: ResponseOption[];
  perfect_bonus_dong: number;
  show_translation: boolean;
}

export interface ResponseOption {
  id: string;
  text_vi: string;
  text_en: string;
  audio_path?: string;
  quality: ResponseQuality;
  result: string; // Next node id
}

export type ResponseQuality = 'perfect' | 'good' | 'awkward' | 'wrong';

// Reward: Give đồng, energy, unlocks
export interface RewardNode extends BaseNode {
  type: 'reward';
  dong?: number;
  energy?: number;
  unlock?: string[];
  achievement?: string;
  message_vi: string;
  message_en: string;
}

// Go To Scene: Transition to another scene
export interface GoToSceneNode extends Omit<BaseNode, 'next'> {
  type: 'go_to_scene';
  target_scene: string;
}

// ============================================
// PLAYER STATE TYPES
// ============================================

export interface VQPlayerStats {
  id: string;
  user_id: string;
  total_dong: number;
  current_energy: number;
  max_energy: number;
  levels_completed: number;
  total_conversations: number;
  translator_uses_total: number;
  current_streak: number;
  longest_streak: number;
  current_world_id: string | null;
  energy_last_regen: string;
}

export interface VQProgress {
  id: string;
  user_id: string;
  level_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  checkpoint_data: CheckpointData | null;
  best_score: number;
  dong_earned: number;
  translator_uses: number;
  choices_made: string[];
  started_at: string | null;
  completed_at: string | null;
  last_played_at: string | null;
}

export interface CheckpointData {
  sceneId: string;
  nodeId: string;
  sessionDong: number;
  sessionEnergy: number;
  translatorUsesThisSession: number;
}

// ============================================
// GAME SESSION STATE (for Zustand store)
// ============================================

export interface GameSessionState {
  // Current level being played
  currentLevel: VQLevel | null;
  currentScene: Scene | null;
  currentNode: GameNode | null;

  // Player state during session
  dong: number;
  energy: number;
  translatorEnabled: boolean;

  // Session tracking
  sessionDongEarned: number;
  sessionDongSpent: number;
  sessionTranslatorUses: number;
  sessionChoices: SessionChoice[];

  // UI state
  isPlaying: boolean;
  isLoading: boolean;
  showTranslation: boolean;
}

export interface SessionChoice {
  nodeId: string;
  choiceId: string;
  timestamp: number;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface WorldWithLevels extends VQWorld {
  levels: VQLevelSummary[];
  user_progress?: {
    levels_completed: number;
    total_levels: number;
  };
}

export interface VQLevelSummary {
  id: string;
  level_number: number;
  slug: string;
  title_vi: string;
  title_en: string;
  description: string | null;
  status: 'draft' | 'live' | 'archived';
  base_dong_reward: number;
  user_status?: 'not_started' | 'in_progress' | 'completed';
  best_score?: number;
}

// ============================================
// NPC TYPES
// ============================================

export interface NpcProfile {
  id: string;
  name_vi: string;
  name_en: string;
  avatar_path: string;
  default_emotion: NpcEmotion;
}

// Pre-defined NPCs for Level 1
export const NPCS: Record<string, NpcProfile> = {
  taxi_driver: {
    id: 'taxi_driver',
    name_vi: 'Tài xế taxi',
    name_en: 'Taxi Driver',
    avatar_path: '/vietquest/npcs/taxi_driver.png',
    default_emotion: 'neutral',
  },
  hotel_receptionist: {
    id: 'hotel_receptionist',
    name_vi: 'Lễ tân khách sạn',
    name_en: 'Hotel Receptionist',
    avatar_path: '/vietquest/npcs/receptionist.png',
    default_emotion: 'friendly',
  },
  cafe_barista: {
    id: 'cafe_barista',
    name_vi: 'Nhân viên quán cà phê',
    name_en: 'Cafe Barista',
    avatar_path: '/vietquest/npcs/barista.png',
    default_emotion: 'friendly',
  },
};

// ============================================
// REWARD MULTIPLIERS
// ============================================

export const QUALITY_MULTIPLIERS: Record<ResponseQuality, number> = {
  perfect: 1.5,
  good: 1.0,
  awkward: 0.5,
  wrong: 0.0,
};

export const TRANSLATOR_PENALTY = 0.25; // 25% reduction when using translator

// ============================================
// ENERGY COSTS
// ============================================

export const ENERGY_COSTS = {
  TRANSLATOR_USE: 10,
  LEVEL_START: 10,
  RETRY_LEVEL: 5,
} as const;

// ============================================
// TYPE GUARDS
// ============================================

export function isNarrationNode(node: GameNode): node is NarrationNode {
  return node.type === 'narration';
}

export function isNpcSaysNode(node: GameNode): node is NpcSaysNode {
  return node.type === 'npc_says';
}

export function isPlayerChoiceNode(node: GameNode): node is PlayerChoiceNode {
  return node.type === 'player_choice';
}

export function isResponsePickerNode(node: GameNode): node is ResponsePickerNode {
  return node.type === 'response_picker';
}

export function isRewardNode(node: GameNode): node is RewardNode {
  return node.type === 'reward';
}

export function isGoToSceneNode(node: GameNode): node is GoToSceneNode {
  return node.type === 'go_to_scene';
}

// Helper to find a node by ID within a level
export function findNodeById(levelData: LevelData, nodeId: string): GameNode | null {
  for (const scene of levelData.scenes) {
    const node = scene.nodes.find((n) => n.id === nodeId);
    if (node) return node;
  }
  return null;
}

// Helper to find a scene by ID
export function findSceneById(levelData: LevelData, sceneId: string): Scene | null {
  return levelData.scenes.find((s) => s.id === sceneId) ?? null;
}
