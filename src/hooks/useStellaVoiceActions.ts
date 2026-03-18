/**
 * Thin compatibility wrapper — delegates to the unified StellaContext brain.
 * All logic has been moved to src/contexts/StellaContext.tsx
 */
import { useStellaContext } from '@/contexts/StellaContext';

export function useStellaVoiceActions() {
  const { processCommand } = useStellaContext();
  return { processVoiceCommand: processCommand };
}
