/**
 * Thin compatibility wrapper — delegates to the unified StellaContext brain.
 * All scheduling logic has been moved to src/contexts/StellaContext.tsx
 */
import { useStellaContext } from '@/contexts/StellaContext';

export { parseItalianTime, formatDelay } from '@/lib/stella/parser';
export type { ScheduledAction } from '@/lib/stella/types';

export function useStellaScheduler(_executor?: unknown) {
  const { scheduledActions, scheduleAction, cancelScheduled } = useStellaContext();
  const pendingActions = scheduledActions.filter(a => a.status === 'pending');
  return {
    scheduledActions,
    pendingActions,
    scheduleAction,
    cancelAction: cancelScheduled,
    clearDone: () => { /* handled by context */ },
  };
}
