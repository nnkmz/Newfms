# UiTM eWorks Facilities SaaS (MVP API)

Dokumen ini menerangkan MVP backend untuk pemodenan sistem e-Aduan/eWorks fasiliti UiTM dengan pendekatan SaaS multi-tenant.

## Matlamat MVP

- Menyokong **aduan fasiliti** (staff, student, external).
- Menyokong **work order** untuk pasukan teknikal.
- Menyediakan **dashboard ringkas** (status aduan, SLA overdue, status work order).
- Menyokong model **multi-tenant** melalui header `x-tenant-id`.

## Struktur Kod

```
src/eworks-saas/
  types.ts      # model domain & jenis input/output
  metadata.ts   # metadata helpdesk kampus UiTM
  store.ts      # in-memory tenant store (MVP)
  service.ts    # logik bisnes, validasi, status transition, SLA
  server.ts     # HTTP API routes
  index.ts      # eksport modul
```

## Cara Jalankan

```bash
npm install
npm run build
npm run start:eworks
```

API akan berjalan di:

`http://localhost:8080`

## Header Wajib

Untuk semua route `/api/v1/*`:

- `x-tenant-id: uitm` (atau mana-mana tenant id lain)

Header pilihan:

- `x-user-role: requestor | helpdesk | technician | admin`
- `x-user-id: <id pengguna>`

## Endpoint Ringkas

### Health

`GET /health`

### Metadata

`GET /api/v1/metadata/helpdesks`

### Aduan

- `GET /api/v1/complaints`
- `POST /api/v1/complaints`
- `GET /api/v1/complaints/:complaintId`
- `PATCH /api/v1/complaints/:complaintId/status` *(role: helpdesk/technician/admin)*
- `POST /api/v1/complaints/:complaintId/feedback`

### Work Order

- `GET /api/v1/work-orders`
- `POST /api/v1/work-orders` *(role: helpdesk/technician/admin)*
- `PATCH /api/v1/work-orders/:workOrderId/status` *(role: helpdesk/technician/admin)*

### Dashboard

- `GET /api/v1/dashboard/summary` *(role: helpdesk/admin)*

## Contoh cURL

### 1) Cipta aduan baru

```bash
curl -X POST "http://localhost:8080/api/v1/complaints" \
  -H "content-type: application/json" \
  -H "x-tenant-id: uitm" \
  -H "x-user-role: requestor" \
  -H "x-user-id: 2000111234" \
  -d '{
    "requestorType": "student",
    "reporter": {
      "identifier": "2000111234",
      "fullName": "Ali UiTM",
      "email": "ali@student.uitm.edu.my",
      "phone": "0123456789"
    },
    "location": {
      "state": "Selangor",
      "campus": "UiTM Shah Alam",
      "building": "Bangunan Akademik A",
      "floor": "Aras 2",
      "room": "Bilik B-2-03",
      "locationDescription": "Penyaman udara tidak sejuk",
      "coordinates": { "lat": 3.0738, "lng": 101.5183 }
    },
    "issue": {
      "section": "MEKANIKAL",
      "element": "PENYAMAN UDARA",
      "problemType": "TIDAK SEJUK"
    },
    "description": "Aircond bilik kuliah tidak sejuk sejak pagi.",
    "priority": "high",
    "channel": "online"
  }'
```

### 2) Cipta work order dari aduan

```bash
curl -X POST "http://localhost:8080/api/v1/work-orders" \
  -H "content-type: application/json" \
  -H "x-tenant-id: uitm" \
  -H "x-user-role: helpdesk" \
  -H "x-user-id: hd-001" \
  -d '{
    "complaintId": "cmp_xxx",
    "title": "Semak unit aircond blok akademik",
    "team": "Pasukan Mekanikal",
    "assigneeId": "tech-101",
    "scheduledAt": "2026-03-02T09:00:00.000Z"
  }'
```

### 3) Kemaskini status work order

```bash
curl -X PATCH "http://localhost:8080/api/v1/work-orders/wo_xxx/status" \
  -H "content-type: application/json" \
  -H "x-tenant-id: uitm" \
  -H "x-user-role: technician" \
  -H "x-user-id: tech-101" \
  -d '{
    "status": "completed",
    "note": "Kompresor dibersihkan dan gas ditambah."
  }'
```

### 4) Lihat dashboard

```bash
curl "http://localhost:8080/api/v1/dashboard/summary" \
  -H "x-tenant-id: uitm" \
  -H "x-user-role: admin"
```

## Risiko MVP & Mitigasi Cadangan

1. **Data tidak kekal (in-memory sahaja)**  
   - Mitigasi: migrasi ke PostgreSQL + ORM (Prisma/Drizzle) pada fasa seterusnya.

2. **Tiada autentikasi sebenar (header-based role sahaja)**  
   - Mitigasi: integrasi SSO UiTM/OAuth2 + JWT + RBAC policy.

3. **Tiada audit trail lengkap enterprise**  
   - Mitigasi: tambah event log append-only untuk setiap transition.

4. **Tiada attachment/gambar kerosakan**  
   - Mitigasi: integrasi object storage (S3 compatible) dan pre-signed upload.

## Fasa Seterusnya (Disyorkan)

1. Multi-tenant DB schema + migration.
2. Frontend portal (requestor + helpdesk + technician).
3. SLA engine + notifikasi (email/WhatsApp/Telegram).
4. Analitik kampus (MTTR, first response time, backlog aging).
5. Integrasi GIS/peta bilik dan aset.
