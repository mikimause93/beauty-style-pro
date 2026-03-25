// src/ai/core/StellaContext.ts
import type { StellaContextData } from '../types/stella.types';

let _currentPage = '/';
const _recentActions: string[] = [];

export function setCurrentPage(page: string): void {
  _currentPage = page;
}

export function recordRecentAction(action: string): void {
  _recentActions.unshift(action);
  if (_recentActions.length > 5) _recentActions.pop();
}

export function getContext(opts?: {
  userId?: string;
  userName?: string;
  userRole?: string;
}): StellaContextData {
  return {
    currentPage: _currentPage,
    userId: opts?.userId,
    userName: opts?.userName,
    userRole: opts?.userRole,
    recentActions: [..._recentActions],
    timestamp: new Date().toISOString(),
  };
}
