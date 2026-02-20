/**
 * DIBA - Learning AI Memory Helper
 * Type definitions for the Diba AI assistant capability model.
 */

/** Single memory entry stored by Diba */
export interface MemoryEntry {
  id: string;
  key: string;
  value: unknown;
  context?: string;
  tags?: string[];
  createdAt: string; // ISO 8601
  updatedAt: string;
  accessCount: number;
}

/** Input when learning (storing) a new fact */
export interface LearnInput {
  key: string;
  value: unknown;
  context?: string;
  tags?: string[];
}

/** Result of a recall (search/retrieve) operation */
export interface RecallResult {
  entries: MemoryEntry[];
  total: number;
  query: string;
}

/** Session or user context for personalisation */
export interface DibaContext {
  userId?: string;
  sessionId?: string;
  locale?: string;
  preferences?: Record<string, unknown>;
}

/** Capability descriptor for each letter of DIBA */
export interface DibaCapability {
  letter: string;
  word: string;
  fullName: string;
  description: string;
  descriptionMs?: string;
}
