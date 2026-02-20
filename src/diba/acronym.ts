/**
 * DIBA Acronym – Definisi kebolehan AI Assistant
 *
 * Setiap huruf mewakili satu dimensi kebolehan Diba sebagai
 * Learning AI Memory Helper yang profesional.
 */

import type { DibaCapability } from "./types.js";

/** Nama rasmi pembantu */
export const DIBA_NAME = "Diba" as const;

/** Tagline ringkas */
export const DIBA_TAGLINE = "Learning AI Memory Helper" as const;

/**
 * Akronim DIBA – kebolehan utama sebagai AI Assistant
 *
 * D - Dynamic Learning   : Belajar dan adaptasi berterusan daripada interaksi
 * I - Intelligent Recall : Ingatan konteks, carian pintar, dan reasoning
 * B - Brain-like Memory  : Simpan, rangkai, dan recall maklumat seperti memori
 * A - Adaptive Assistant : Menyesuaikan respons mengikut pengguna dan konteks
 */
export const DIBA_ACRONYM: readonly DibaCapability[] = [
  {
    letter: "D",
    word: "Dynamic",
    fullName: "Dynamic Learning",
    description: "Continuously learns and adapts from user interactions and feedback.",
    descriptionMs: "Belajar dan beradaptasi secara berterusan daripada interaksi dan maklum balas pengguna.",
  },
  {
    letter: "I",
    word: "Intelligent",
    fullName: "Intelligent Recall",
    description: "Context-aware memory search, smart retrieval, and reasoning over stored knowledge.",
    descriptionMs: "Ingatan sedar konteks, carian pintar, dan penaakulan atas pengetahuan tersimpan.",
  },
  {
    letter: "B",
    word: "Brain-like",
    fullName: "Brain-like Memory",
    description: "Stores, associates, and recalls information in a structured, linkable memory model.",
    descriptionMs: "Menyimpan, merangkaikan, dan mengingat maklumat dalam model memori berstruktur.",
  },
  {
    letter: "A",
    word: "Adaptive",
    fullName: "Adaptive Assistant",
    description: "Adapts responses and behaviour to user preferences and current context.",
    descriptionMs: "Menyesuaikan respons dan tingkah laku mengikut pilihan pengguna dan konteks semasa.",
  },
] as const;

/** Return full acronym summary for display or API */
export function getDibaAcronymSummary(): {
  name: string;
  tagline: string;
  acronym: string;
  capabilities: readonly DibaCapability[];
  summaryMs: string;
} {
  return {
    name: DIBA_NAME,
    tagline: DIBA_TAGLINE,
    acronym: "DIBA",
    capabilities: DIBA_ACRONYM,
    summaryMs:
      "Diba ialah Pembantu Memori AI Pembelajaran: Dynamic Learning, Intelligent Recall, Brain-like Memory, Adaptive Assistant.",
  };
}
