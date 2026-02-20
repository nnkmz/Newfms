/**
 * Diba AI Memory Helper – Entry point
 * Demonstrates DIBA acronym and basic learn/recall.
 */

import { Diba, getDibaAcronymSummary } from "./diba/index.js";

function main(): void {
  const diba = new Diba({
    memoryPersistPath: undefined, // set path to persist to file
    context: { locale: "ms-MY" },
  });

  console.log(diba.intro());
  console.log("\n--- Acronym (API) ---");
  console.log(JSON.stringify(getDibaAcronymSummary(), null, 2));
}

main();

export { Diba, getDibaAcronymSummary } from "./diba/index.js";
