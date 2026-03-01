import { Pool } from "pg";
import { EworksInMemoryStore } from "./store.js";
import type { ComplaintRecord, WorkOrderRecord } from "./types.js";

interface ComplaintRow {
  payload: unknown;
}

interface WorkOrderRow {
  payload: unknown;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isComplaintRecord(value: unknown): value is ComplaintRecord {
  if (!isObject(value)) {
    return false;
  }
  return (
    typeof value.id === "string" &&
    typeof value.referenceNo === "string" &&
    typeof value.tenantId === "string" &&
    typeof value.status === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isWorkOrderRecord(value: unknown): value is WorkOrderRecord {
  if (!isObject(value)) {
    return false;
  }
  return (
    typeof value.id === "string" &&
    typeof value.code === "string" &&
    typeof value.tenantId === "string" &&
    typeof value.complaintId === "string" &&
    typeof value.status === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

/**
 * Mirror layer: hydrate data dari PostgreSQL ke memory semasa startup,
 * kemudian setiap write di-sync semula ke PostgreSQL.
 */
export class EworksPostgresMirror {
  constructor(
    private readonly pool: Pool,
    private readonly store: EworksInMemoryStore,
  ) {}

  async hydrate(): Promise<void> {
    const complaintsResult = await this.pool.query<ComplaintRow>("SELECT payload FROM complaints");
    for (const row of complaintsResult.rows) {
      if (isComplaintRecord(row.payload)) {
        this.store.upsertComplaint(row.payload.tenantId, row.payload);
      }
    }

    const workOrdersResult = await this.pool.query<WorkOrderRow>("SELECT payload FROM work_orders");
    for (const row of workOrdersResult.rows) {
      if (isWorkOrderRecord(row.payload)) {
        this.store.upsertWorkOrder(row.payload.tenantId, row.payload);
      }
    }
  }

  async persistComplaint(record: ComplaintRecord): Promise<void> {
    await this.pool.query(
      `
      INSERT INTO complaints (
        id, reference_no, tenant_id, requestor_type, status, priority, channel,
        reporter_identifier, reporter_full_name, campus, sla_due_at, created_at, updated_at, payload
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11::timestamptz, $12::timestamptz, $13::timestamptz, $14::jsonb
      )
      ON CONFLICT (id) DO UPDATE SET
        reference_no = EXCLUDED.reference_no,
        tenant_id = EXCLUDED.tenant_id,
        requestor_type = EXCLUDED.requestor_type,
        status = EXCLUDED.status,
        priority = EXCLUDED.priority,
        channel = EXCLUDED.channel,
        reporter_identifier = EXCLUDED.reporter_identifier,
        reporter_full_name = EXCLUDED.reporter_full_name,
        campus = EXCLUDED.campus,
        sla_due_at = EXCLUDED.sla_due_at,
        updated_at = EXCLUDED.updated_at,
        payload = EXCLUDED.payload
      `,
      [
        record.id,
        record.referenceNo,
        record.tenantId,
        record.requestorType,
        record.status,
        record.priority,
        record.channel,
        record.reporter.identifier,
        record.reporter.fullName ?? null,
        record.location.campus,
        record.slaDueAt,
        record.createdAt,
        record.updatedAt,
        JSON.stringify(record),
      ],
    );

    await this.pool.query("DELETE FROM complaint_status_history WHERE complaint_id = $1", [record.id]);
    for (const item of record.statusHistory) {
      await this.pool.query(
        `
        INSERT INTO complaint_status_history (
          complaint_id, tenant_id, status, changed_at, changed_by, note
        )
        VALUES ($1, $2, $3, $4::timestamptz, $5, $6)
        `,
        [record.id, record.tenantId, item.status, item.changedAt, item.changedBy, item.note ?? null],
      );
    }

    await this.pool.query("DELETE FROM complaint_feedback WHERE complaint_id = $1", [record.id]);
    if (record.feedback) {
      await this.pool.query(
        `
        INSERT INTO complaint_feedback (
          complaint_id, tenant_id, satisfaction, comment, submitted_at, submitted_by
        )
        VALUES ($1, $2, $3, $4, $5::timestamptz, $6)
        `,
        [
          record.id,
          record.tenantId,
          record.feedback.satisfaction,
          record.feedback.comment ?? null,
          record.feedback.submittedAt,
          record.feedback.submittedBy,
        ],
      );
    }
  }

  async persistWorkOrder(record: WorkOrderRecord): Promise<void> {
    await this.pool.query(
      `
      INSERT INTO work_orders (
        id, code, tenant_id, complaint_id, status, team, assignee_id, scheduled_at, created_at, updated_at, payload
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8::timestamptz, $9::timestamptz, $10::timestamptz, $11::jsonb
      )
      ON CONFLICT (id) DO UPDATE SET
        code = EXCLUDED.code,
        tenant_id = EXCLUDED.tenant_id,
        complaint_id = EXCLUDED.complaint_id,
        status = EXCLUDED.status,
        team = EXCLUDED.team,
        assignee_id = EXCLUDED.assignee_id,
        scheduled_at = EXCLUDED.scheduled_at,
        updated_at = EXCLUDED.updated_at,
        payload = EXCLUDED.payload
      `,
      [
        record.id,
        record.code,
        record.tenantId,
        record.complaintId,
        record.status,
        record.team,
        record.assigneeId ?? null,
        record.scheduledAt ?? null,
        record.createdAt,
        record.updatedAt,
        JSON.stringify(record),
      ],
    );

    await this.pool.query("DELETE FROM work_order_status_history WHERE work_order_id = $1", [record.id]);
    for (const item of record.statusHistory) {
      await this.pool.query(
        `
        INSERT INTO work_order_status_history (
          work_order_id, tenant_id, status, changed_at, changed_by, note
        )
        VALUES ($1, $2, $3, $4::timestamptz, $5, $6)
        `,
        [record.id, record.tenantId, item.status, item.changedAt, item.changedBy, item.note ?? null],
      );
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export async function createPostgresMirrorFromEnv(
  store: EworksInMemoryStore,
): Promise<EworksPostgresMirror | null> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || connectionString.trim().length === 0) {
    return null;
  }

  const pool = new Pool({
    connectionString,
  });
  const mirror = new EworksPostgresMirror(pool, store);
  try {
    await mirror.hydrate();
    return mirror;
  } catch (error) {
    await pool.end();
    const message = error instanceof Error ? error.message : "unknown postgres error";
    throw new Error(
      `Gagal inisialisasi PostgreSQL mirror: ${message}. Pastikan schema dijalankan (database/eworks-postgres-schema.sql).`,
    );
  }
}
