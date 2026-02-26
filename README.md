# Diba – Learning AI Memory Helper

**Diba** ialah pembantu memori AI yang belajar dan mengingat, direka sebagai AI assistant dengan model kebolehan **DIBA**. DIBA boleh digunakan dengan **pelbagai bahasa pengaturcaraan** (contoh: TypeScript, JavaScript, Python, Go, Rust, dan lain-lain) — memori dan bantuan kod tidak terhad kepada satu bahasa sahaja.

## Akronim DIBA – Kebolehan AI Assistant

| Huruf | Perkataan   | Nama Penuh           | Kebolehan |
|-------|-------------|----------------------|-----------|
| **D** | **D**ynamic | Dynamic Learning     | Belajar dan beradaptasi secara berterusan daripada interaksi dan maklum balas pengguna. |
| **I** | **I**ntelligent | Intelligent Recall | Ingatan sedar konteks, carian pintar, dan penaakulan atas pengetahuan tersimpan. |
| **B** | **B**rain-like | Brain-like Memory  | Menyimpan, merangkaikan, dan mengingat maklumat dalam model memori berstruktur. |
| **A** | **A**daptive | Adaptive Assistant   | Menyesuaikan respons dan tingkah laku mengikut pilihan pengguna dan konteks semasa. |

Ringkas: **D**ynamic Learning · **I**ntelligent Recall · **B**rain-like Memory · **A**daptive Assistant.

---

## Pengkhususan DIBA (Specializations)

DIBA boleh mengkhusus dalam domain berikut:

| Bidang | Fokus |
|--------|--------|
| **Professional** | Business analysis, project management, strategic planning |
| **Educational** | Tutoring, study assistance, curriculum development |
| **Creative** | Writing support, brainstorming, artistic collaboration |
| **Personal** | Life coaching, goal tracking, decision support |
| **Technical** | Code review, troubleshooting, system design, code development (pelbagai bahasa), multi-language programming |

## Ciri lanjutan (Advanced Features)

- **Auto-Archive:** Fail diari diarkibkan automatik pada 1k baris.
- **Session RAM:** Memori sementara yang diset semula setiap perbualan.
- **Protocol System:** Cipta tingkah laku dan respons AI tersuai.
- **Self-Update:** AI mengubah suai memori sendiri melalui perbualan.
- **Modular Design:** Tambah atau buang ciri mengikut keperluan.

Dalam kod: `diba.getSpecializations()`, `diba.getAdvancedFeatures()`, `diba.getFeatureSystems()`.

---

## Sistem ciri (Feature systems)

| Sistem | Penerangan | Muat |
|--------|------------|------|
| **Save Diary System** | Dokumentasi sesi harian automatik; satu fail sehari (YYYY-MM-DD.md), append-only; arkib bulanan; recap dalam memori. | `Load save-diary` |
| **Echo Memory Recall** | Carian kata kunci dalam diari; ingat semula dengan naratif; pengawal ketidakpastian; jangan reka konteks lalu. | `Load echo-recall` |

- **Save Diary:** [Feature/Save-Diary-System/](Feature/Save-Diary-System/) — protocol, SKILL, quick setup.
- **Echo Recall:** [Feature/Echo-Memory-Recall/](Feature/Echo-Memory-Recall/) — bergantung pada diari (cth. Save Diary); trigger: "Do you remember...", "When did we...".

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

## Integrasi FPX untuk eRuangNiaga (starter)

Repo ini kini ada modul starter FPX di `src/fpx/` untuk aliran pembayaran:

1. Cipta checkout session (signed payload)
2. Redirect pengguna ke gateway FPX (POST form)
3. Terima callback dan verify signature
4. Kemas kini status order (`paid`, `pending`, `failed`)

### API yang disediakan

- `EruangniagaFpxService`
- `buildAutoPostForm`
- Utility checksum: `signFpxPayload`, `verifyFpxSignature`

### Contoh penggunaan ringkas

```ts
import { EruangniagaFpxService, buildAutoPostForm } from "diba-ai-memory-helper";

const fpx = new EruangniagaFpxService({
  merchantId: "ERUANGNIAGA001",
  gatewayBaseUrl: "https://gateway-anda.example.com",
  checkoutPath: "/checkout",
  callbackUrl: "https://eruangniaga.uitm.edu.my/api/payment/fpx/callback",
  returnUrl: "https://eruangniaga.uitm.edu.my/payment/result",
  checksumSecret: "GANTI_DENGAN_SECRET_SEBENAR",
});

const checkout = fpx.createCheckoutSession({
  orderId: "ERG-2026-000123",
  amount: 120.5,
  description: "Bayaran tempahan ruang seminar",
  payerName: "Ali Bin Abu",
  payerEmail: "ali@example.com",
});

const html = buildAutoPostForm({
  actionUrl: checkout.redirectUrl,
  fields: checkout.formFields,
});
```

### Contoh callback verification

```ts
const result = fpx.verifyCallback({
  transaction_id: "FPX-ERG2026000123-ABC123XYZ789",
  order_id: "ERG-2026-000123",
  amount: "120.50",
  status: "00",
  checksum: "signature-dari-gateway",
});

if (result.isSignatureValid && result.status === "paid") {
  // update order kepada PAID dalam DB
}
```

> Nota: Nama field callback/checksum boleh berbeza ikut provider FPX. Modul ini sediakan struktur asas yang boleh dipadankan dengan field sebenar gateway anda.
>
> Contoh aliran backend penuh: [examples/eruangniaga-fpx-integration.md](./examples/eruangniaga-fpx-integration.md).

## Cursor (pro developer)

Dalam repo ini, DIBA ada **skill** dan **rule** untuk Cursor:

- **Skill:** `.cursor/skills/diba-pro-developer/SKILL.md` – piawaian pro developer bila mengedit atau mengembangkan DIBA (TypeScript, API, memori, persist).
- **Rule:** `.cursor/rules/diba-pro-standards.mdc` – dipakai automatik bila fail dalam `src/diba/**/*.ts` dibuka; menguatkuasakan piawaian kod dan import ESM.

Ini memastikan AI dalam Cursor ikut amalan pro bila bekerja dengan kod DIBA.

**DIBA auto bila masuk:** Bila anda buka projek Newfms dalam Cursor, DIBA sudah aktif dalam chat; bila anda buka tab chat dan mulakan perbualan, AI akan menyapa sebagai Diba. Untuk papar intro DIBA di terminal: jalankan task **DIBA** (Terminal → Run Task → DIBA) atau `npm start`.

**DIBA untuk semua projek:** Skill DIBA telah dipasang di **peringkat pengguna** (`~/.cursor/skills/`) supaya DIBA boleh jalan dalam **semua projek** bila anda log masuk Cursor. Untuk rule "bertindak sebagai Diba" merentasi semua projek, salin teks dari `docs/DIBA-USER-RULE-Salin-ke-Cursor.md` ke Cursor → Settings → Rules → User Rules. Tip latihan AI: lihat `docs/Effective-AI-Training-DIBA.md` (Be Specific, Give Examples, Consistent Language, Provide Feedback).

## MCP (Model Context Protocol)

Dalam repo ini sudah disediakan **.cursor/mcp.json** dengan server MCP percuma yang berguna:

| Server | Fungsi |
|--------|--------|
| **filesystem** | Baca, tulis, cari fail dalam projek (direktori dibenarkan: `.` = akar projek) |
| **memory** | Memori berterusan berasaskan knowledge graph untuk AI |

Selepas ubah `mcp.json`, **mulakan semula Cursor** supaya MCP dimuat. Dalam chat, AI boleh guna tools filesystem dan memory bila perlu. Untuk hadkan filesystem ke path lain, tukar argumen `"."` dalam `args` kepada path penuh folder yang dibenarkan.

---

## Struktur Projek

```
src/
  diba/
    types.ts        # MemoryEntry, LearnInput, RecallResult, DibaCapability
    acronym.ts      # Definisi DIBA (D, I, B, A) dan getDibaAcronymSummary()
    capabilities.ts # Pengkhususan & ciri lanjutan (DIBA_SPECIALIZATIONS, DIBA_ADVANCED_FEATURES)
    memory.ts       # DibaMemoryStore: learn, recall, persist
    Diba.ts         # Kelas Diba: capability + memory API
    index.ts        # Public API
  fpx/
    types.ts        # Jenis untuk config, checkout session, callback result
    checksum.ts     # Utility checksum/signature (HMAC SHA256)
    form.ts         # Builder auto-submit HTML form untuk redirect FPX
    EruangniagaFpxService.ts # Servis create checkout + verify callback
    index.ts        # Public API modul FPX
  index.ts          # Entry point & export
```

## Skrip

- `npm run build` – kompilasi TypeScript ke `dist/`
- `npm start` – jalankan `dist/index.js`
- `npm run dev` – jalankan dengan ts-node

## Lesen

MIT
