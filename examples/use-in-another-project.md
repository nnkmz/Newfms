# Guna Diba dalam projek lain

Panduan ringkas untuk membawa Diba ke mana-mana projek akan datang.

## 1. Pasang Diba

Dalam folder projek anda (bukan dalam Newfms):

```bash
# Dari folder Newfms (sibling atau path lain)
npm install "file:../Newfms"

# Atau path penuh
npm install "file:C:/Users/Administrator/newfms/Newfms"
```

Selepas itu, `node_modules/diba-ai-memory-helper` akan menunjuk ke build dalam Newfms. Pastikan dalam Newfms sudah dijalankan `npm run build` supaya `dist/` wujud.

## 2. Guna dalam kod

### JavaScript (ESM)

Dalam `package.json` projek anda, tambah `"type": "module"`. Kemudian:

```js
import { Diba, getDibaAcronymSummary } from "diba-ai-memory-helper";

const diba = new Diba({ context: { locale: "ms-MY" } });
console.log(diba.intro());

const summary = getDibaAcronymSummary();
console.log(summary.summaryMs);
```

### TypeScript

Pastikan projek TypeScript boleh resolve modul (moduleResolution: NodeNext atau Node16). Kemudian:

```ts
import { Diba, getDibaAcronymSummary } from "diba-ai-memory-helper";

const diba = new Diba({
  memoryPersistPath: "./data/diba-memory.json",
  context: { userId: "my-user", locale: "ms-MY" },
});

async function main() {
  console.log(diba.intro());
  await diba.learn({ key: "app", value: "MyFutureApp", tags: ["project"] });
  const result = await diba.recall("app");
  console.log(result.entries);
}
main();
```

## 3. Simpan memori antara sesi

Beri `memoryPersistPath` ketika cipta `Diba` supaya memori disimpan ke fail JSON dan boleh digunakan merentas restart/sesi:

```ts
const diba = new Diba({
  memoryPersistPath: "./data/diba-memory.json",
});
```

## 4. Ringkasan

- **Satu repo Diba (Newfms)** → banyak projek boleh pasang melalui `file:../Newfms` atau npm.
- **Build sekali** dalam Newfms (`npm run build`) → semua projek yang bergantung akan guna `dist/` yang sama.
- Diba tiada dependency runtime; sesuai untuk mana-mana projek Node.js ≥18.
