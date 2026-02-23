/**
 * Diba – Learning AI Memory Helper
 * Public API: types, acronym, memory, and Diba class.
 */

export { Diba } from "./Diba.js";
export { getDibaAcronymSummary, DIBA_ACRONYM, DIBA_NAME, DIBA_TAGLINE } from "./acronym.js";
export {
  DIBA_ADVANCED_FEATURES,
  DIBA_FEATURE_SYSTEMS,
  DIBA_SPECIALIZATIONS,
} from "./capabilities.js";
export { DibaMemoryStore } from "./memory.js";
export type {
  DibaCapability,
  DibaContext,
  LearnInput,
  MemoryEntry,
  RecallResult,
} from "./types.js";
export type {
  DibaAdvancedFeature,
  DibaFeatureSystem,
  DibaSpecialization,
} from "./capabilities.js";
