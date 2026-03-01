import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { EworksAuthService, type AuthenticatedUser } from "./auth.js";
import { UITM_CAMPUS_HELPDESKS, UITM_TENANT_ID } from "./metadata.js";
import { createPostgresMirrorFromEnv, type EworksPostgresMirror } from "./postgres.js";
import { DomainError, EworksFacilityService } from "./service.js";
import { EworksInMemoryStore } from "./store.js";
import {
  COMPLAINT_STATUSES,
  REQUESTOR_TYPES,
  WORK_ORDER_STATUSES,
  type ApiErrorPayload,
  type ListComplaintFilters,
  type ListWorkOrderFilters,
  type UserRole,
} from "./types.js";

const OPERATION_ROLES = new Set<UserRole>(["helpdesk", "technician", "admin"]);
const DASHBOARD_ROLES = new Set<UserRole>(["helpdesk", "admin"]);
const MAX_BODY_SIZE_BYTES = 1024 * 1024; // 1MB untuk MVP
const PORTAL_ROOT_DIR = join(process.cwd(), "public", "eworks");

interface ServerRuntime {
  service: EworksFacilityService;
  auth: EworksAuthService;
  mirror: EworksPostgresMirror | null;
  portalRootDir: string;
}

interface AuthContext {
  tenantId: string;
  actor: AuthenticatedUser;
}

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(body);
}

function sendText(res: ServerResponse, statusCode: number, payload: string, contentType: string): void {
  res.statusCode = statusCode;
  res.setHeader("content-type", contentType);
  res.end(payload);
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

function resolveBearerToken(req: IncomingMessage): string {
  const rawAuth = readHeader(req, "authorization");
  if (!rawAuth || rawAuth.trim().length === 0) {
    throw new DomainError(401, "AUTH_REQUIRED", "Header Authorization diperlukan.");
  }
  const [scheme, token] = rawAuth.trim().split(/\s+/, 2);
  if (scheme !== "Bearer" || !token) {
    throw new DomainError(401, "AUTH_REQUIRED", "Format Authorization mesti: Bearer <token>.");
  }
  return token;
}

function ensureRole(role: UserRole, allowed: ReadonlySet<UserRole>, operationLabel: string): void {
  if (!allowed.has(role)) {
    throw new DomainError(403, "FORBIDDEN", `Peranan '${role}' tidak dibenarkan untuk ${operationLabel}.`);
  }
}

function resolveAuthContext(req: IncomingMessage, authService: EworksAuthService): AuthContext {
  const tenantId = resolveTenantId(req);
  const token = resolveBearerToken(req);
  const actor = authService.verifyAccessToken(token);
  if (actor.tenantId !== tenantId) {
    throw new DomainError(403, "TENANT_MISMATCH", "Token pengguna tidak sepadan dengan x-tenant-id.");
  }
  return { tenantId, actor };
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

function getStaticContentType(path: string): string {
  const extension = extname(path).toLowerCase();
  if (extension === ".html") {
    return "text/html; charset=utf-8";
  }
  if (extension === ".js") {
    return "text/javascript; charset=utf-8";
  }
  if (extension === ".css") {
    return "text/css; charset=utf-8";
  }
  if (extension === ".json") {
    return "application/json; charset=utf-8";
  }
  if (extension === ".svg") {
    return "image/svg+xml";
  }
  return "application/octet-stream";
}

function resolvePortalFilePath(portalRootDir: string, pathname: string): string {
  if (pathname === "/portal" || pathname === "/portal/") {
    return join(portalRootDir, "index.html");
  }

  const relativePath = pathname.replace(/^\/portal\//, "");
  const safePath = normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, "");
  const resolvedRoot = resolve(portalRootDir);
  const resolvedFile = resolve(portalRootDir, safePath);
  if (!resolvedFile.startsWith(resolvedRoot)) {
    return join(portalRootDir, "index.html");
  }
  return resolvedFile;
}

async function maybeServePortal(pathname: string, runtime: ServerRuntime, res: ServerResponse): Promise<boolean> {
  if (!pathname.startsWith("/portal")) {
    return false;
  }

  const filePath = resolvePortalFilePath(runtime.portalRootDir, pathname);
  try {
    const data = await readFile(filePath);
    const contentType = getStaticContentType(filePath);
    res.statusCode = 200;
    res.setHeader("content-type", contentType);
    res.end(data);
    return true;
  } catch {
    sendText(res, 404, "Portal file not found.", "text/plain; charset=utf-8");
    return true;
  }
}

async function persistComplaintIfNeeded(
  mirror: EworksPostgresMirror | null,
  complaint: ReturnType<EworksFacilityService["getComplaint"]>,
): Promise<void> {
  if (!mirror) {
    return;
  }
  await mirror.persistComplaint(complaint);
}

async function persistWorkOrderIfNeeded(
  mirror: EworksPostgresMirror | null,
  workOrder: ReturnType<EworksFacilityService["getWorkOrder"]>,
): Promise<void> {
  if (!mirror) {
    return;
  }
  await mirror.persistWorkOrder(workOrder);
}

export function createEworksServer(runtime?: Partial<ServerRuntime>): Server {
  const store = new EworksInMemoryStore();
  const resolvedRuntime: ServerRuntime = {
    service: runtime?.service ?? new EworksFacilityService(store),
    auth: runtime?.auth ?? new EworksAuthService(),
    mirror: runtime?.mirror ?? null,
    portalRootDir: runtime?.portalRootDir ?? PORTAL_ROOT_DIR,
  };

  return createServer(async (req, res) => {
    const method = req.method ?? "GET";
    const requestUrl = new URL(req.url ?? "/", "http://localhost");
    const pathname = requestUrl.pathname;

    try {
      if (method === "GET" && pathname === "/health") {
        sendJson(res, 200, {
          status: "ok",
          service: "uitm-eworks-saas",
          timestamp: new Date().toISOString(),
          persistence: resolvedRuntime.mirror ? "postgres+memory" : "memory",
        });
        return;
      }

      if (method === "GET" && (pathname === "/portal" || pathname.startsWith("/portal/"))) {
        const served = await maybeServePortal(pathname, resolvedRuntime, res);
        if (served) {
          return;
        }
      }

      if (!pathname.startsWith("/api/v1/")) {
        sendError(res, 404, "NOT_FOUND", "Laluan API tidak ditemui.");
        return;
      }

      if (method === "POST" && pathname === "/api/v1/auth/login") {
        const payload = await parseJsonBody(req);
        const result = resolvedRuntime.auth.login(payload);
        sendJson(res, 200, result);
        return;
      }

      const authContext = resolveAuthContext(req, resolvedRuntime.auth);
      const tenantId = authContext.tenantId;
      const actor = authContext.actor;

      if (method === "GET" && pathname === "/api/v1/auth/me") {
        sendJson(res, 200, { user: actor });
        return;
      }

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

        const complaints = resolvedRuntime.service.listComplaints(tenantId, filters);
        sendJson(res, 200, { items: complaints, count: complaints.length });
        return;
      }

      if (method === "POST" && pathname === "/api/v1/complaints") {
        const payload = await parseJsonBody(req);
        const complaint = resolvedRuntime.service.createComplaint(tenantId, payload, actor.userId);
        await persistComplaintIfNeeded(resolvedRuntime.mirror, complaint);
        sendJson(res, 201, complaint);
        return;
      }

      const complaintStatusMatch = pathname.match(/^\/api\/v1\/complaints\/([^/]+)\/status$/);
      if (method === "PATCH" && complaintStatusMatch) {
        ensureRole(actor.role, OPERATION_ROLES, "kemas kini status aduan");
        const complaintId = decodePathSegment(complaintStatusMatch[1], "complaintId");
        const payload = await parseJsonBody(req);
        const complaint = resolvedRuntime.service.updateComplaintStatus(tenantId, complaintId, payload, actor.userId);
        await persistComplaintIfNeeded(resolvedRuntime.mirror, complaint);
        sendJson(res, 200, complaint);
        return;
      }

      const complaintFeedbackMatch = pathname.match(/^\/api\/v1\/complaints\/([^/]+)\/feedback$/);
      if (method === "POST" && complaintFeedbackMatch) {
        const complaintId = decodePathSegment(complaintFeedbackMatch[1], "complaintId");
        const payload = await parseJsonBody(req);
        const complaint = resolvedRuntime.service.addFeedback(tenantId, complaintId, payload, actor.userId);
        await persistComplaintIfNeeded(resolvedRuntime.mirror, complaint);
        sendJson(res, 200, complaint);
        return;
      }

      const complaintByIdMatch = pathname.match(/^\/api\/v1\/complaints\/([^/]+)$/);
      if (method === "GET" && complaintByIdMatch) {
        const complaintId = decodePathSegment(complaintByIdMatch[1], "complaintId");
        const complaint = resolvedRuntime.service.getComplaint(tenantId, complaintId);
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
        const workOrders = resolvedRuntime.service.listWorkOrders(tenantId, filters);
        sendJson(res, 200, { items: workOrders, count: workOrders.length });
        return;
      }

      if (method === "POST" && pathname === "/api/v1/work-orders") {
        ensureRole(actor.role, OPERATION_ROLES, "cipta work order");
        const payload = await parseJsonBody(req);
        const workOrder = resolvedRuntime.service.createWorkOrder(tenantId, payload, actor.userId);
        const complaint = resolvedRuntime.service.getComplaint(tenantId, workOrder.complaintId);
        await persistWorkOrderIfNeeded(resolvedRuntime.mirror, workOrder);
        await persistComplaintIfNeeded(resolvedRuntime.mirror, complaint);
        sendJson(res, 201, workOrder);
        return;
      }

      const workOrderStatusMatch = pathname.match(/^\/api\/v1\/work-orders\/([^/]+)\/status$/);
      if (method === "PATCH" && workOrderStatusMatch) {
        ensureRole(actor.role, OPERATION_ROLES, "kemas kini status work order");
        const workOrderId = decodePathSegment(workOrderStatusMatch[1], "workOrderId");
        const payload = await parseJsonBody(req);
        const workOrder = resolvedRuntime.service.updateWorkOrderStatus(tenantId, workOrderId, payload, actor.userId);
        const complaint = resolvedRuntime.service.getComplaint(tenantId, workOrder.complaintId);
        await persistWorkOrderIfNeeded(resolvedRuntime.mirror, workOrder);
        await persistComplaintIfNeeded(resolvedRuntime.mirror, complaint);
        sendJson(res, 200, workOrder);
        return;
      }

      if (method === "GET" && pathname === "/api/v1/dashboard/summary") {
        ensureRole(actor.role, DASHBOARD_ROLES, "akses dashboard");
        const summary = resolvedRuntime.service.getDashboardSummary(tenantId);
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

async function resolveRuntimeFromEnv(): Promise<ServerRuntime> {
  const store = new EworksInMemoryStore();
  const service = new EworksFacilityService(store);
  const auth = new EworksAuthService();
  const mirror = await createPostgresMirrorFromEnv(store);
  return {
    service,
    auth,
    mirror,
    portalRootDir: PORTAL_ROOT_DIR,
  };
}

export async function startEworksServer(port?: number): Promise<Server> {
  const parsedPort =
    port ??
    (() => {
      const fromEnv = process.env.PORT ?? "8080";
      const asNumber = Number.parseInt(fromEnv, 10);
      return Number.isInteger(asNumber) && asNumber > 0 ? asNumber : 8080;
    })();

  const runtime = await resolveRuntimeFromEnv();
  const server = createEworksServer(runtime);
  server.listen(parsedPort, () => {
    console.log(`[eWorks SaaS] API berjalan pada http://localhost:${parsedPort}`);
    console.log(`[eWorks SaaS] Portal demo: http://localhost:${parsedPort}/portal`);
    console.log(`[eWorks SaaS] Persistence: ${runtime.mirror ? "postgres+memory" : "memory"}`);
    console.log(`[eWorks SaaS] Tenant default: ${UITM_TENANT_ID}`);
  });
  return server;
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectRun) {
  void startEworksServer().catch((error) => {
    console.error("[eWorks SaaS] Gagal memulakan server:", error);
    process.exitCode = 1;
  });
}
