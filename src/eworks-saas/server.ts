import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { fileURLToPath } from "node:url";
import { UITM_CAMPUS_HELPDESKS, UITM_TENANT_ID } from "./metadata.js";
import { DomainError, EworksFacilityService } from "./service.js";
import {
  COMPLAINT_STATUSES,
  REQUESTOR_TYPES,
  USER_ROLES,
  WORK_ORDER_STATUSES,
  type ApiErrorPayload,
  type ListComplaintFilters,
  type ListWorkOrderFilters,
  type UserRole,
} from "./types.js";

const OPERATION_ROLES = new Set<UserRole>(["helpdesk", "technician", "admin"]);
const DASHBOARD_ROLES = new Set<UserRole>(["helpdesk", "admin"]);
const MAX_BODY_SIZE_BYTES = 1024 * 1024; // 1MB untuk MVP

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(body);
}

function sendError(res: ServerResponse, statusCode: number, error: string, message: string): void {
  const payload: ApiErrorPayload = { error, message };
  sendJson(res, statusCode, payload);
}

function readHeader(req: IncomingMessage, headerName: string): string | undefined {
  const raw = req.headers[headerName];
  if (typeof raw === "string") {
    return raw;
  }
  if (Array.isArray(raw)) {
    return raw[0];
  }
  return undefined;
}

function resolveTenantId(req: IncomingMessage): string {
  const raw = readHeader(req, "x-tenant-id");
  if (!raw || raw.trim().length === 0) {
    throw new DomainError(400, "TENANT_REQUIRED", "Header 'x-tenant-id' diperlukan.");
  }
  return raw.trim();
}

function resolveRole(req: IncomingMessage): UserRole {
  const raw = readHeader(req, "x-user-role");
  if (!raw || raw.trim().length === 0) {
    return "requestor";
  }
  const normalized = raw.trim();
  if ((USER_ROLES as readonly string[]).includes(normalized)) {
    return normalized as UserRole;
  }
  throw new DomainError(
    400,
    "INVALID_ROLE",
    `Header 'x-user-role' tidak sah. Dibenarkan: ${USER_ROLES.join(", ")}.`,
  );
}

function resolveActorId(req: IncomingMessage, role: UserRole): string {
  const raw = readHeader(req, "x-user-id");
  if (!raw || raw.trim().length === 0) {
    return `role:${role}`;
  }
  return raw.trim();
}

function ensureRole(role: UserRole, allowed: ReadonlySet<UserRole>, operationLabel: string): void {
  if (!allowed.has(role)) {
    throw new DomainError(403, "FORBIDDEN", `Peranan '${role}' tidak dibenarkan untuk ${operationLabel}.`);
  }
}

async function parseJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let currentSize = 0;

  for await (const chunk of req) {
    const bufferChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    currentSize += bufferChunk.byteLength;
    if (currentSize > MAX_BODY_SIZE_BYTES) {
      throw new DomainError(413, "PAYLOAD_TOO_LARGE", "Saiz payload melebihi had 1MB.");
    }
    chunks.push(bufferChunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const rawBody = Buffer.concat(chunks).toString("utf8").trim();
  if (rawBody.length === 0) {
    return {};
  }

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    throw new DomainError(400, "INVALID_JSON", "Body request mesti JSON yang sah.");
  }
}

function parsePositiveIntQuery(value: string | null, fieldName: string): number | undefined {
  if (!value || value.trim().length === 0) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new DomainError(400, "VALIDATION_ERROR", `Query '${fieldName}' mesti nombor bulat positif.`);
  }
  return parsed;
}

function parseEnumQuery<T extends readonly string[]>(
  value: string | null,
  fieldName: string,
  allowedValues: T,
): T[number] | undefined {
  if (!value || value.trim().length === 0) {
    return undefined;
  }
  if (!(allowedValues as readonly string[]).includes(value)) {
    throw new DomainError(
      400,
      "VALIDATION_ERROR",
      `Query '${fieldName}' tidak sah. Dibenarkan: ${allowedValues.join(", ")}.`,
    );
  }
  return value as T[number];
}

function decodePathSegment(segment: string, fieldName: string): string {
  try {
    const decoded = decodeURIComponent(segment);
    if (decoded.trim().length === 0) {
      throw new Error("empty");
    }
    return decoded;
  } catch {
    throw new DomainError(400, "VALIDATION_ERROR", `Nilai laluan '${fieldName}' tidak sah.`);
  }
}

export function createEworksServer(service = new EworksFacilityService()): Server {
  return createServer(async (req, res) => {
    const method = req.method ?? "GET";
    const requestUrl = new URL(req.url ?? "/", "http://localhost");
    const pathname = requestUrl.pathname;

    try {
      if (method === "GET" && pathname === "/health") {
        sendJson(res, 200, {
          status: "ok",
          service: "uitm-eworks-saas-mvp",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (!pathname.startsWith("/api/v1/")) {
        sendError(res, 404, "NOT_FOUND", "Laluan API tidak ditemui.");
        return;
      }

      const tenantId = resolveTenantId(req);
      const role = resolveRole(req);
      const actorId = resolveActorId(req, role);

      if (method === "GET" && pathname === "/api/v1/metadata/helpdesks") {
        sendJson(res, 200, {
          tenantId,
          defaultTenantId: UITM_TENANT_ID,
          items: UITM_CAMPUS_HELPDESKS,
        });
        return;
      }

      if (method === "GET" && pathname === "/api/v1/complaints") {
        const filters: ListComplaintFilters = {
          status: parseEnumQuery(requestUrl.searchParams.get("status"), "status", COMPLAINT_STATUSES),
          requestorType: parseEnumQuery(
            requestUrl.searchParams.get("requestorType"),
            "requestorType",
            REQUESTOR_TYPES,
          ),
          campus: requestUrl.searchParams.get("campus") ?? undefined,
          search: requestUrl.searchParams.get("search") ?? undefined,
          limit: parsePositiveIntQuery(requestUrl.searchParams.get("limit"), "limit"),
        };

        const complaints = service.listComplaints(tenantId, filters);
        sendJson(res, 200, { items: complaints, count: complaints.length });
        return;
      }

      if (method === "POST" && pathname === "/api/v1/complaints") {
        const payload = await parseJsonBody(req);
        const complaint = service.createComplaint(tenantId, payload, actorId);
        sendJson(res, 201, complaint);
        return;
      }

      const complaintStatusMatch = pathname.match(/^\/api\/v1\/complaints\/([^/]+)\/status$/);
      if (method === "PATCH" && complaintStatusMatch) {
        ensureRole(role, OPERATION_ROLES, "kemas kini status aduan");
        const complaintId = decodePathSegment(complaintStatusMatch[1], "complaintId");
        const payload = await parseJsonBody(req);
        const complaint = service.updateComplaintStatus(tenantId, complaintId, payload, actorId);
        sendJson(res, 200, complaint);
        return;
      }

      const complaintFeedbackMatch = pathname.match(/^\/api\/v1\/complaints\/([^/]+)\/feedback$/);
      if (method === "POST" && complaintFeedbackMatch) {
        const complaintId = decodePathSegment(complaintFeedbackMatch[1], "complaintId");
        const payload = await parseJsonBody(req);
        const complaint = service.addFeedback(tenantId, complaintId, payload, actorId);
        sendJson(res, 200, complaint);
        return;
      }

      const complaintByIdMatch = pathname.match(/^\/api\/v1\/complaints\/([^/]+)$/);
      if (method === "GET" && complaintByIdMatch) {
        const complaintId = decodePathSegment(complaintByIdMatch[1], "complaintId");
        const complaint = service.getComplaint(tenantId, complaintId);
        sendJson(res, 200, complaint);
        return;
      }

      if (method === "GET" && pathname === "/api/v1/work-orders") {
        const filters: ListWorkOrderFilters = {
          status: parseEnumQuery(requestUrl.searchParams.get("status"), "status", WORK_ORDER_STATUSES),
          complaintId: requestUrl.searchParams.get("complaintId") ?? undefined,
          team: requestUrl.searchParams.get("team") ?? undefined,
          assigneeId: requestUrl.searchParams.get("assigneeId") ?? undefined,
          limit: parsePositiveIntQuery(requestUrl.searchParams.get("limit"), "limit"),
        };
        const workOrders = service.listWorkOrders(tenantId, filters);
        sendJson(res, 200, { items: workOrders, count: workOrders.length });
        return;
      }

      if (method === "POST" && pathname === "/api/v1/work-orders") {
        ensureRole(role, OPERATION_ROLES, "cipta work order");
        const payload = await parseJsonBody(req);
        const workOrder = service.createWorkOrder(tenantId, payload, actorId);
        sendJson(res, 201, workOrder);
        return;
      }

      const workOrderStatusMatch = pathname.match(/^\/api\/v1\/work-orders\/([^/]+)\/status$/);
      if (method === "PATCH" && workOrderStatusMatch) {
        ensureRole(role, OPERATION_ROLES, "kemas kini status work order");
        const workOrderId = decodePathSegment(workOrderStatusMatch[1], "workOrderId");
        const payload = await parseJsonBody(req);
        const workOrder = service.updateWorkOrderStatus(tenantId, workOrderId, payload, actorId);
        sendJson(res, 200, workOrder);
        return;
      }

      if (method === "GET" && pathname === "/api/v1/dashboard/summary") {
        ensureRole(role, DASHBOARD_ROLES, "akses dashboard");
        const summary = service.getDashboardSummary(tenantId);
        sendJson(res, 200, summary);
        return;
      }

      sendError(res, 404, "NOT_FOUND", "Laluan API tidak ditemui.");
    } catch (error) {
      if (error instanceof DomainError) {
        sendError(res, error.statusCode, error.errorCode, error.message);
        return;
      }

      sendError(res, 500, "INTERNAL_ERROR", "Ralat dalaman pelayan.");
    }
  });
}

export function startEworksServer(port?: number): Server {
  const parsedPort =
    port ??
    (() => {
      const fromEnv = process.env.PORT ?? "8080";
      const asNumber = Number.parseInt(fromEnv, 10);
      return Number.isInteger(asNumber) && asNumber > 0 ? asNumber : 8080;
    })();

  const server = createEworksServer();
  server.listen(parsedPort, () => {
    console.log(`[eWorks SaaS] API berjalan pada http://localhost:${parsedPort}`);
    console.log(`[eWorks SaaS] Gunakan header x-tenant-id: ${UITM_TENANT_ID}`);
  });
  return server;
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectRun) {
  startEworksServer();
}
