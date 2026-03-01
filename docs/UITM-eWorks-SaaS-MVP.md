# UiTM eWorks Facilities SaaS (MVP+)

Dokumen ini menerangkan implementasi semasa untuk backend + auth + portal demo bagi pemodenan sistem e-Aduan/eWorks UiTM.

## Ciri Yang Sudah Dibina

1. **DB schema PostgreSQL**
   - Fail: `database/eworks-postgres-schema.sql`
   - Jadual: `tenants`, `app_users`, `complaints`, `complaint_status_history`, `complaint_feedback`, `work_orders`, `work_order_status_history`
   - Index untuk status/campus/carien JSONB.

2. **Auth JWT + role policy**
   - Endpoint login: `POST /api/v1/auth/login`
   - Semua endpoint `/api/v1/*` (kecuali login) memerlukan:
     - `Authorization: Bearer <token>`
     - `x-tenant-id`
   - Role policy:
     - `helpdesk|technician|admin` untuk operasi status/work order
     - `helpdesk|admin` untuk dashboard.

3. **Frontend portal demo**
   - URL: `GET /portal`
   - Fail static: `public/eworks/`
   - Fungsi: login, create complaint, list complaint, create/update work order, dashboard.

## Struktur Kod

```
database/
  eworks-postgres-schema.sql

public/eworks/
  index.html
  app.js
  styles.css

src/eworks-saas/
  auth.ts      # JWT login/verify + seed user demo
  metadata.ts  # metadata helpdesk kampus UiTM
  postgres.ts  # optional postgres mirror (DATABASE_URL)
  service.ts   # business logic aduan/work order/SLA
  server.ts    # API routes + auth guard + static portal
  store.ts     # in-memory store
  types.ts     # domain types
```

## Cara Jalankan

```bash
npm install
npm run build
npm run start:eworks
```

Server:
- API: `http://localhost:8080`
- Portal: `http://localhost:8080/portal`

## Konfigurasi Environment

- `PORT` (pilihan, default `8080`)
- `EWORKS_JWT_SECRET` (sangat disyorkan untuk production)
- `DATABASE_URL` (pilihan; jika diisi, server akan hydrate + persist ke PostgreSQL)
- `EWORKS_AUTH_USERS_JSON` (pilihan; override akaun demo)

## Setup PostgreSQL

Jalankan migration schema:

```bash
psql "$DATABASE_URL" -f database/eworks-postgres-schema.sql
```

> Nota: tanpa `DATABASE_URL`, server guna in-memory sahaja.

## Akaun Demo (default)

- `admin / admin123!`
- `helpdesk / helpdesk123!`
- `technician / tech123!`
- `requestor / requestor123!`

Tenant default: `uitm`.

## Endpoint Ringkas

### Health
- `GET /health`

### Auth
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

### Metadata
- `GET /api/v1/metadata/helpdesks`

### Aduan
- `GET /api/v1/complaints`
- `POST /api/v1/complaints`
- `GET /api/v1/complaints/:complaintId`
- `PATCH /api/v1/complaints/:complaintId/status` *(helpdesk/technician/admin)*
- `POST /api/v1/complaints/:complaintId/feedback`

### Work Order
- `GET /api/v1/work-orders`
- `POST /api/v1/work-orders` *(helpdesk/technician/admin)*
- `PATCH /api/v1/work-orders/:workOrderId/status` *(helpdesk/technician/admin)*

### Dashboard
- `GET /api/v1/dashboard/summary` *(helpdesk/admin)*

## Contoh cURL (aliran penuh)

### 1) Login dan simpan token

```bash
TOKEN=$(curl -s -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "content-type: application/json" \
  -d '{"tenantId":"uitm","username":"admin","password":"admin123!"}' | jq -r '.accessToken')
```

### 2) Cipta aduan

```bash
curl -X POST "http://localhost:8080/api/v1/complaints" \
  -H "content-type: application/json" \
  -H "x-tenant-id: uitm" \
  -H "authorization: Bearer $TOKEN" \
  -d '{
    "requestorType": "student",
    "reporter": { "identifier": "2000111234", "fullName": "Ali UiTM" },
    "location": {
      "state": "Selangor",
      "campus": "UiTM Shah Alam",
      "building": "Bangunan Akademik A",
      "locationDescription": "Penyaman udara tidak sejuk"
    },
    "issue": {
      "section": "MEKANIKAL",
      "element": "PENYAMAN UDARA",
      "problemType": "TIDAK SEJUK"
    },
    "description": "Aircond bilik kuliah tidak sejuk sejak pagi."
  }'
```

### 3) Dashboard

```bash
curl "http://localhost:8080/api/v1/dashboard/summary" \
  -H "x-tenant-id: uitm" \
  -H "authorization: Bearer $TOKEN"
```

## Risiko Semasa & Mitigasi

1. **JWT secret mungkin default jika env tidak diset**
   - Mitigasi: set `EWORKS_JWT_SECRET` yang panjang/unik.
2. **Mirror Postgres bukan multi-node distributed-safe**
   - Mitigasi: migrasi ke repository DB native (query-first/ORM) pada fasa production.
3. **Portal masih demo (vanilla JS, tanpa design system)**
   - Mitigasi: naik taraf ke SPA production + RBAC UI + testing e2e.
