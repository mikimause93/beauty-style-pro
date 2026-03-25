// src/ai/index.ts
// Public exports for Stella AI V3
export { default as StellaV3 } from './StellaV3';

// Core
export { stellaChat } from './core/StellaCore';
export { getMemory, saveMemory, recordService, recordInteraction, clearMemory, setPreference } from './core/StellaMemory';
export { getContext, setCurrentPage, recordRecentAction } from './core/StellaContext';

// Actions
export { runAction } from './actions/StellaActions';

// Voice
export { useStellaVoice } from './voice/StellaVoice';
export { useStellaCommands } from './voice/StellaCommands';

// UI
export { default as StellaFloating } from './ui/StellaFloating';
export { default as StellaModal } from './ui/StellaModal';
export { ListeningRing, SpeakingRing, SlideUpPanel, ScaleInButton, FadeInMessage } from './ui/StellaAnimations';

// Types
export type {
  StellaActionName,
  StellaActionResult,
  StellaAction,
  StellaChatResponse,
  StellaMessage,
  StellaUserMemory,
  StellaContextData,
} from './types/stella.types';
