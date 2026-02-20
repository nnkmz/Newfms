# Diba – Learning AI Memory Helper

**Diba** ialah pembantu memori AI yang belajar dan mengingat, direka sebagai AI assistant dengan model kebolehan **DIBA**.

## Akronim DIBA – Kebolehan AI Assistant

| Huruf | Perkataan   | Nama Penuh           | Kebolehan |
|-------|-------------|----------------------|-----------|
| **D** | **D**ynamic | Dynamic Learning     | Belajar dan beradaptasi secara berterusan daripada interaksi dan maklum balas pengguna. |
| **I** | **I**ntelligent | Intelligent Recall | Ingatan sedar konteks, carian pintar, dan penaakulan atas pengetahuan tersimpan. |
| **B** | **B**rain-like | Brain-like Memory  | Menyimpan, merangkaikan, dan mengingat maklumat dalam model memori berstruktur. |
| **A** | **A**daptive | Adaptive Assistant   | Menyesuaikan respons dan tingkah laku mengikut pilihan pengguna dan konteks semasa. |

Ringkas: **D**ynamic Learning · **I**ntelligent Recall · **B**rain-like Memory · **A**daptive Assistant.

---

## Guna Diba dalam semua projek akan datang

Diba direka sebagai **pakej bebas** supaya boleh dipasang dalam mana-mana projek (Node.js / TypeScript).

### Pilihan 1: Pasang dari folder Newfms (lokal)

Dalam projek lain, dari folder akar projek tersebut:

```bash
npm install "file:../Newfms"
```

Atau dengan path penuh ke repo Newfms:

```bash
npm install "file:C:/Users/Administrator/newfms/Newfms"
```

### Pilihan 2: Pasang dari npm (setelah publish)

Apabila pakej sudah diterbitkan ke npm (awam atau scope):

```bash
npm install diba-ai-memory-helper
```

### Dalam projek lain (contoh)

```ts
import { Diba, getDibaAcronymSummary } from "diba-ai-memory-helper";

const diba = new Diba({
  context: { userId: "zuex", locale: "ms-MY" },
  memoryPersistPath: "./data/diba-memory.json",  // pilihan
});

console.log(diba.intro());
await diba.learn({ key: "projek", value: "MyApp", tags: ["current"] });
const result = await diba.recall("projek");
```

Pastikan projek guna **ES modules** (`"type": "module"` dalam `package.json`) atau konfigurasi TypeScript/Node yang menyokong `import`.

Panduan terperinci: [examples/use-in-another-project.md](./examples/use-in-another-project.md).

---

## Pemasangan (dalam repo Newfms ini)

```bash
npm install
npm run build
```

## Penggunaan

### Papar kebolehan DIBA & intro

```ts
import { Diba, getDibaAcronymSummary } from "./diba";

const diba = new Diba({ context: { locale: "ms-MY" } });

console.log(diba.intro());
// Saya Diba – Learning AI Memory Helper.
// DIBA: D - Dynamic Learning, I - Intelligent Recall, ...

const summary = getDibaAcronymSummary();
console.log(summary.acronym);       // "DIBA"
console.log(summary.capabilities);  // array D, I, B, A
```

### Belajar & ingat (learn / recall)

```ts
await diba.learn({
  key: "nama_projek",
  value: "Newfms",
  context: "FMS project",
  tags: ["projek", "fms"],
});

const result = await diba.recall("projek");
console.log(result.entries);
```

### Kekal ke fail (pilihan)

```ts
const diba = new Diba({
  memoryPersistPath: "./data/diba-memory.json",
});
```

## Struktur Projek

```
src/
  diba/
    types.ts    # MemoryEntry, LearnInput, RecallResult, DibaCapability
    acronym.ts  # Definisi DIBA (D, I, B, A) dan getDibaAcronymSummary()
    memory.ts   # DibaMemoryStore: learn, recall, persist
    Diba.ts     # Kelas Diba: capability + memory API
    index.ts    # Public API
  index.ts      # Entry point & export
```

## Skrip

- `npm run build` – kompilasi TypeScript ke `dist/`
- `npm start` – jalankan `dist/index.js`
- `npm run dev` – jalankan dengan ts-node

## Lesen

MIT
