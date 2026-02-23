/**
 * DIBA specializations and advanced features.
 * Defines what Diba can specialize in and which advanced features it supports.
 */

/** One specialization area with its focus items */
export interface DibaSpecialization {
  area: string;
  focus: readonly string[];
}

/** DIBA can specialize in these areas */
export const DIBA_SPECIALIZATIONS: readonly DibaSpecialization[] = [
  {
    area: "Professional",
    focus: ["Business analysis", "Project management", "Strategic planning"],
  },
  {
    area: "Educational",
    focus: ["Tutoring", "Study assistance", "Curriculum development"],
  },
  {
    area: "Creative",
    focus: ["Writing support", "Brainstorming", "Artistic collaboration"],
  },
  {
    area: "Personal",
    focus: ["Life coaching", "Goal tracking", "Decision support"],
  },
  {
    area: "Technical",
    focus: ["Code review", "Troubleshooting", "System design"],
  },
] as const;

/** One advanced feature with short description */
export interface DibaAdvancedFeature {
  id: string;
  name: string;
  description: string;
  descriptionMs?: string;
}

/** Advanced features DIBA supports */
export const DIBA_ADVANCED_FEATURES: readonly DibaAdvancedFeature[] = [
  {
    id: "auto-archive",
    name: "Auto-Archive",
    description: "Diary files automatically archive at 1k lines.",
    descriptionMs: "Fail diari diarkibkan automatik pada 1k baris.",
  },
  {
    id: "session-ram",
    name: "Session RAM",
    description: "Temporary memory that resets each conversation.",
    descriptionMs: "Memori sementara yang diset semula setiap perbualan.",
  },
  {
    id: "protocol-system",
    name: "Protocol System",
    description: "Create custom AI behaviors and responses.",
    descriptionMs: "Cipta tingkah laku dan respons AI tersuai.",
  },
  {
    id: "self-update",
    name: "Self-Update",
    description: "AI modifies its own memory through conversation.",
    descriptionMs: "AI mengubah suai memori sendiri melalui perbualan.",
  },
  {
    id: "modular-design",
    name: "Modular Design",
    description: "Add or remove features as needed.",
    descriptionMs: "Tambah atau buang ciri mengikut keperluan.",
  },
  {
    id: "save-diary-system",
    name: "Save Diary System",
    description: "Automated daily session documentation; one file per day (YYYY-MM-DD.md), append-only; monthly auto-archival to archived/YYYY-MM/; session recap in memory.",
    descriptionMs: "Dokumentasi sesi harian automatik; satu fail sehari, append-only; arkib bulanan; recap sesi dalam memori.",
  },
  {
    id: "echo-memory-recall",
    name: "Echo Memory Recall",
    description: "Keyword search across diary entries; narrative recall with uncertainty guard and ask-user fallback; never fabricate past context.",
    descriptionMs: "Carian kata kunci dalam diari; ingat semula naratif dengan pengawal ketidakpastian; jangan reka konteks lalu.",
  },
] as const;

/** One feature system with path and description (diary, recall, etc.) */
export interface DibaFeatureSystem {
  id: string;
  name: string;
  path: string;
  description: string;
  descriptionMs?: string;
}

/** DIBA feature systems (Save Diary, Echo Recall) – live in Feature/ */
export const DIBA_FEATURE_SYSTEMS: readonly DibaFeatureSystem[] = [
  {
    id: "save-diary",
    name: "Save Diary System",
    path: "Feature/Save-Diary-System",
    description: "Automated daily session documentation with monthly archival. Load: 'Load save-diary'.",
    descriptionMs: "Dokumentasi sesi harian automatik dengan arkib bulanan. Muat: 'Load save-diary'.",
  },
  {
    id: "echo-recall",
    name: "Echo Memory Recall",
    path: "Feature/Echo-Memory-Recall",
    description: "Search and recall past sessions with narrative context. Load: 'Load echo-recall'.",
    descriptionMs: "Cari dan ingat semula sesi lalu dengan konteks naratif. Muat: 'Load echo-recall'.",
  },
] as const;
