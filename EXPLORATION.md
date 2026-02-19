# Penerokaan Laman Web fms.uitm.edu.my

## Gambaran Keseluruhan

Laman web **fms.uitm.edu.my** adalah **Portal Sistem Pengurusan Fasiliti** (Facility Management System Portal) milik Universiti Teknologi MARA (UiTM). Portal ini merupakan pusat akses untuk pelbagai sistem berkaitan pengurusan fasiliti dan infrastruktur UiTM.

---

## Struktur Laman Utama

### Header
- Banner grafik (`Portal_01.jpg`) dengan lebar tetap 1273px

### Bar Kiri
- Imej dekoratif (`Portal_02.png`) lebar 95px

### Kawasan Kandungan Utama
- **Slideshow gambar** dengan 17 slaid:
  - 10 gambar bertema "Jimat Tenaga" (penjimatan tenaga)
  - 7 gambar kampus UiTM
- **Pautan utama**: **e-Aduan Fasiliti** — sistem aduan kerosakan fasiliti
- **Maklumat hubungan**:
  - Jabatan Pembangunan, UiTM
  - 40450 Shah Alam, Selangor Darul Ehsan
  - Tel: 603 5544 2544
  - Fax: 603 5544 2546
  - Email: jpem@uitm.edu.my
  - Website: pembangunan.uitm.edu.my

### Panel Kanan — Aplikasi
Senarai sistem/aplikasi yang boleh diakses:

| Aplikasi | URL |
|---|---|
| e-Majlis | `/emajlis/index.php` |
| e-Ruang | `/eruang/?p=mohon_ruang` |
| e-Projek | `/eprojek/online` |
| MySPB (MyUiTM Access) | `https://myuitmaccess.uitm.edu.my` |
| Fleet Management | `http://fleet.uitm.edu.my` |
| Archibus | `https://fms.uitm.edu.my:8443/archibus/...` |
| KPPP (Soal Selidik) | `/soalselidik` |
| eTenagaKerja | `/eTenagaKerja/` |
| MyUiTMPhone | `http://MyUiTMPhone.uitm.edu.my` |

### Panel Kanan — Login Pentadbir
- Borang login dengan medan: Login ID dan Kata Laluan

### Panel Kanan — Pelawat
- Kaunter pelawat: ~65,327,709

### Footer
- Hak Cipta: BKAF-PPF dan DFMS-PSMB, UiTM Shah Alam (2011)

---

## Sistem e-Aduan Fasiliti (`/eAduan`) — Penerokaan Mendalam

### Gambaran Keseluruhan e-Aduan
Sistem e-Aduan adalah **Sistem Pengurusan Aduan Kerosakan dan Perkhidmatan Pejabat Pengurusan Fasiliti v.2**. Ia membolehkan pengguna UiTM (staf, pelajar, dan pengguna luar) membuat aduan berkaitan kerosakan fasiliti di semua kampus UiTM seluruh Malaysia.

### Struktur Frame (HTML Frameset)
Sistem menggunakan layout **frameset** HTML 4.01 dengan 3 frame:

```
+-----------------------------------------------+
|  Frame Atas (banner3_launch.php)               |
|  - Logo UiTM, banner SSTM, jam masa nyata     |
|  - Bar navigasi dengan tarikh/masa Melayu      |
+----------+------------------------------------+
| Frame    |  Frame Utama (staf_UiTM/staf.php)  |
| Kiri     |  - Borang utama & kandungan dinamik |
| (inci.   |                                    |
|  php)    |                                    |
|          |                                    |
| - INFO   |                                    |
| - PAUTAN |                                    |
+----------+------------------------------------+
```

### Frame Kiri (`inci.php`)
#### Panel INFO (Marquee Vertikal)
- Sistem Pengurusan Aduan Kerosakan dan Perkhidmatan PPF v.2
- Nombor helpdesk mengikut kampus

#### Panel PAUTAN
- Manual Staf UiTM (`staf.pdf`)
- Manual Pelajar UiTM (`student.pdf`)
- Manual Pengguna Luar (`luar.pdf`)

### Nombor Helpdesk Mengikut Kampus
| Kampus | Telefon |
|---|---|
| UiTM Cawangan Selangor, Shah Alam | 03-55444444 |
| UiTM Cawangan Selangor, Puncak Perdana (Fasiliti) | 03-79622255 |
| UiTM Cawangan Selangor, Puncak Perdana (ICT) | 03-79622061 |
| UiTM Cawangan Negeri Sembilan, Kuala Pilah | 06-4832323 |
| UiTM Cawangan Johor, Segamat | 07-9352240/2245/2249 |
| UiTM Cawangan Kedah, Merbok | 04-4562002 |
| UiTM Cawangan Kelantan, Machang | 09-9762054/2111 |
| UiTM Cawangan Perlis, Arau | 04-9882333 |
| UiTM Cawangan Perak, Seri Iskandar | 05-3742626 |

---

### Aliran Kerja Pengguna (User Flow)

#### Langkah 1: Pilih Kategori Pengguna
URL: `/eAduan/staf_UiTM/staf.php`

Pengguna memilih satu daripada 3 kategori:
1. **Staf UiTM** (requestor=1)
2. **Pelajar UiTM** (requestor=2)
3. **Pengguna Luar** (requestor=3)

#### Langkah 2: Masukkan Pengenalan

| Kategori | Medan Input | Contoh | Pengesahan |
|---|---|---|---|
| Staf UiTM | Nombor Staf (`txt_emnumber`) | 123456 | Mestilah nombor, max 10 digit |
| Pelajar UiTM | Nombor Pelajar (`no_stud`) | 2000111234 | Mestilah nombor, max 10 digit |
| Pengguna Luar | Nombor K/P (`no_kp`) | 830110115000 | Mestilah nombor, min 12 digit |

Pengguna memilih tindakan:
- **Lapor Aduan** (lp_sm=0) — Buat aduan baru
- **Semak Aduan** (lp_sm=1) — Semak status aduan sedia ada

#### Langkah 3a: Lapor Aduan Baru
URL: `/eAduan/staf_UiTM/info_staf_baru.php`

**Seksyen 1.0 — Maklumat Pelapor** (dipaparkan automatik):
- Nama Staf / Nama
- Jawatan (untuk staf)
- Jabatan/Bahagian (untuk staf)
- No. Telefon (pejabat & bimbit)
- E-mail
- No. Ruang

**Seksyen 2.0 — Lokasi dan Jenis Kerosakan**:

Pilihan lokasi:
- **Bilik Sendiri** (location=8) — Maklumat lokasi diambil automatik dari profil
- **Lokasi Lain** (location=9) — Pengguna perlu pilih lokasi secara manual

**Medan-medan lokasi (cascading dropdowns)**:
1. Negeri → `idnegeri`
2. Kampus → `idkampus`
3. Bangunan/Kategori Infra → `idbangunan`
4. Blok/Jenis Infra → `idblok`
5. Aras/Zon Infra → `idfloor`
6. Ruang/Ruang Infra → `idrm`
7. Kategori Infra → `idkat_infra`
8. Sub Kategori Infra → `id_subinfra`

**Medan-medan kerosakan (cascading dropdowns)**:
1. Seksyen → `section` (cth: MEKANIKAL, ELEKTRIKAL, dll)
2. Elemen → `prob_group` (cth: PENYAMAN UDARA, PENDAWAIAN, dll)
3. Masalah → `prob_type` (cth: PENYAMAN UDARA TIDAK SEJUK, dll)

**Medan-medan tambahan**:
- Keterangan Lokasi → `loc_desc` (wajib)
- Keterangan Kerosakan → `prob_description` (wajib)
- Peta Interaktif → Leaflet.js (v1.9.2) dengan Google Maps tiles
  - Geolocation automatik
  - Penanda (marker) boleh diseret untuk setkan lokasi tepat
  - Koordinat disimpan dalam `coordinatex`

**Penafian**: "Saya mengaku bahawa segala maklumat aduan yang dikemukakan adalah benar dan saya bertanggungjawab ke atas aduan tersebut."

Borang dihantar ke: `info_aduan.php` (POST)

#### Langkah 3b: Semak Aduan Sedia Ada
URL: `/eAduan/staf_UiTM/semak/page_ppf.php`

Memaparkan jadual senarai aduan dengan lajur:
| Lajur | Keterangan |
|---|---|
| Bil. | Nombor urutan |
| Nombor Aduan | ID aduan unik (boleh diklik untuk laporan terperinci) |
| Tarikh Aduan | Tarikh aduan dibuat (DD-MM-YYYY) |
| Masa Aduan | Masa aduan dibuat (HH:MM:SS) |
| Lokasi Kerosakan | Kod lokasi (cth: B0132A) |
| Jenis Kerosakan | Kod kerosakan (cth: MEC-D3030-D3030001) |
| Medium Aduan | Cara aduan dibuat (Online / Telefon / dll) |
| Status Pembaikan | Status semasa (cth: OPERASI DIBATALKAN, REJ, dll) |
| Maklumbalas | Pautan ke borang maklum balas |

Jumlah aduan dipaparkan di bawah jadual.

#### Langkah 4: Lihat Laporan Aduan Terperinci
URL: `/eAduan/staf_UiTM/semak/laporan.php?wrequested={nombor_aduan}`

Laporan mengandungi 3 seksyen:

**1.0 BUTIRAN PELAPOR**
- Nama, Jawatan, No. Telefon, E-mail, Jabatan/Bahagian, Nama/No. Ruang

**2.0 LOKASI DAN JENIS KEROSAKAN**
- Lokasi: Negeri, Kampus, Blok, Aras, Ruang, Kategori Infra, Sub Kategori Infra
- Kerosakan: Seksyen, Elemen, Masalah, Keterangan
- Koordinat lokasi & peta interaktif Leaflet.js (paparan sahaja, tidak boleh diseret)
- Keterangan lokasi

**3.0 LAIN-LAIN BUTIRAN**
- Nombor Aduan
- Aduan Melalui (Online/Telefon)
- Tarikh & Masa Aduan
- Status Pembaikan
- Sebab Penolakan/Pembatalan/Diberhentikan (jika ada)
- Tarikh Siap
- Pegawai Bertanggungjawab & No. Telefon

#### Langkah 5: Maklum Balas Pengguna
URL: `/eAduan/staf_UiTM/semak/maklumbalas2.php?id={nombor_aduan}`
(Dibuka sebagai popup 850x350)

Borang maklum balas:
- **Tahap Kepuasan**: Memuaskan / Tidak Memuaskan (radio button)
- **Komen/Cadangan**: Textarea (wajib jika "Tidak Memuaskan")
- Butang: Simpan / Reset
- Pengesahan: Dialog confirm sebelum hantar

---

### Status-Status Aduan
Berdasarkan data yang ditemui:
- **OPERASI DIBATALKAN** — Aduan telah dibatalkan
- **REJ** — Aduan ditolak (rejected)
- *(Status lain yang mungkin ada tetapi tidak ditemui semasa penerokaan)*

### Kod Jenis Kerosakan
Format kod: `{SEKSYEN}-{ELEMEN}-{MASALAH}`

Contoh:
- `MEC-D3030-D3030001` = Mekanikal - Penyaman Udara - Penyaman Udara Tidak Sejuk
- `TEL-D5032-D5032002` = Telekomunikasi - (elemen) - (masalah)

### Pengendalian Khas
- **Pelajar tidak wujud**: Mesej "Tiada data! Sila hubungi pihak HEP untuk maklumat pelajar."
- **Pengguna Luar**: Pilihan "Bilik Sendiri" tidak ditunjukkan (tersembunyi), hanya "Lokasi Lain"
- **Staf & Pelajar**: Kedua-dua pilihan lokasi tersedia
- **Enter key disekat**: Fungsi `bar()` menghalang submit borang dengan menekan Enter

---

### Peta Fail Sistem e-Aduan

```
/eAduan/
├── index.php                          # Laman utama frameset
├── banner3_launch.php                 # Frame atas (banner + jam)
├── inci.php                           # Frame kiri (info + pautan)
├── staf.pdf                           # Manual Staf UiTM
├── student.pdf                        # Manual Pelajar UiTM
├── luar.pdf                           # Manual Pengguna Luar
├── js/
│   └── disable_key.js                 # Skrip menghalang kekunci tertentu
├── images/
│   ├── logo_uitm1.jpg                 # Logo UiTM
│   ├── SSTM_lnch1.gif                # Banner SSTM
│   ├── bannner4.gif                   # Banner kanan
│   ├── ayat1.gif                      # Teks ayat
│   ├── arrow2.jpg                     # Ikon anak panah
│   ├── line_bg.gif                    # Latar belakang garisan
│   └── line_purple.gif               # Garisan ungu
├── media/
│   ├── indentbg.gif                   # Latar belakang menu
│   └── indentbg2.gif                 # Latar belakang menu (hover)
└── staf_UiTM/
    ├── staf.php                       # Borang login/pilih kategori
    ├── check_staf.php                 # Penghalaan selepas login
    ├── info_staf_baru.php             # Borang aduan kerosakan
    ├── info_aduan.php                 # Pemprosesan aduan (POST)
    ├── list_section.php               # Senarai seksyen (popup)
    ├── list_prob_group.php            # Senarai elemen (popup)
    ├── list_prob_type.php             # Senarai masalah (popup)
    └── semak/
        ├── page_ppf.php               # Senarai aduan
        ├── laporan.php                # Laporan aduan terperinci
        └── maklumbalas2.php           # Borang maklum balas (popup)
```

---

### Teknologi e-Aduan

| Komponen | Teknologi |
|---|---|
| Backend | PHP |
| Frontend | HTML 4.01 Frameset, Table-based layout |
| CSS | Inline styles (tiada fail CSS luaran) |
| JavaScript | Vanilla JS |
| Peta | Leaflet.js v1.9.2 + Google Maps tiles |
| UI Pattern | Cascading dropdowns, popup windows |
| Warna Tema | Ungu (#601168, #7C2F8C), Lavender (#F7E6FF, #F1E1FF) |

### Kelemahan Keselamatan & Teknikal e-Aduan
1. **Tiada autentikasi sebenar** — Hanya perlu tahu nombor staf/pelajar/IC untuk akses
2. **Data pengguna terdedah** — Nama, jawatan, email, jabatan boleh dilihat dengan hanya meneka nombor staf
3. **Tiada CSRF token** — Borang tidak mempunyai perlindungan CSRF
4. **Right-click disekat** — `oncontextmenu="return false;"` (keselamatan palsu)
5. **Parameter dalam URL** — Data sensitif dihantar melalui GET parameters
6. **HTML tidak sah** — Multiple `<html>`, `<head>`, `<body>` tags dalam satu fail
7. **Fungsi JavaScript berulang** — `IsNumeric()` diduplikasi 3 kali dalam `staf.php`
8. **Frameset usang** — Teknologi yang sudah ditamatkan (deprecated) dalam HTML5
9. **Mixed content** — Peta menggunakan HTTP (`http://{s}.google.com/...`) dalam laman HTTPS

---

## Analisis Teknikal Keseluruhan

### Teknologi Yang Digunakan
- **HTML**: HTML 4.01 (termasuk Frameset)
- **CSS**: Inline styles dan fail luaran (`style.css`)
- **JavaScript**: Vanilla JS (tiada framework)
- **Backend**: PHP
- **Layout**: Tabel-based dengan kedudukan absolute (fixed width 1273px)
- **Peta**: Leaflet.js v1.9.2

### Isu dan Kelemahan
1. **Tiada reka bentuk responsif** — Lebar tetap 1273px, tidak mesra peranti mudah alih
2. **HTML lama** — Menggunakan frameset, tabel layout, tag `<font>`, atribut inline
3. **Tiada framework moden** — Tiada penggunaan CSS framework atau JavaScript framework
4. **CSS tidak teratur** — Banyak inline styles dan kelas yang tidak bermakna (`.style1`, `.style2`)
5. **JavaScript berulang** — Fungsi `IsNumeric()` diduplikasi 3 kali dalam fail yang sama
6. **Keselamatan** — Tiada autentikasi sebenar, tiada CSRF protection, data terdedah
7. **Aksesibiliti** — Tiada atribut ARIA, alt text pada imej, atau sokongan pembaca skrin
8. **Prestasi** — Imej slideshow dimuatkan sekaligus (tiada lazy loading)

### Struktur Fail CSS (`style.css`)
Layout menggunakan kedudukan absolute dengan dimensi tetap:
- Header: 1273px x 139px
- LeftBar: 95px x 622px
- Content: 886px x 622px (bermula dari kiri 95px, atas 139px)
- PanelRight: 210px x 622px (bermula dari kiri 981px)
- RightBar: 82px x 622px (bermula dari kiri 1191px)
- Footer: 1273px x 84px (bermula dari atas 760px)

---

## Ringkasan

Portal FMS UiTM ini merupakan laman web yang dibina pada era awal 2010-an dengan teknologi web lama. Ia berfungsi sebagai pusat akses untuk pelbagai sistem pengurusan fasiliti UiTM termasuk e-Aduan, e-Majlis, e-Ruang, e-Projek, dan lain-lain. Sistem e-Aduan khususnya merupakan teras utama portal ini yang membolehkan pengguna UiTM melapor dan menyemak aduan kerosakan fasiliti. Laman web ini memerlukan pemodenan yang ketara dari segi reka bentuk responsif, keselamatan, aksesibiliti, dan penggunaan teknologi web terkini.
