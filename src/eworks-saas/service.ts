import { randomUUID } from "node:crypto";
import { UITM_TENANT_ID } from "./metadata.js";
import { EworksInMemoryStore } from "./store.js";
import {
  COMPLAINT_CHANNELS,
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUSES,
  FEEDBACK_SATISFACTION,
  REQUESTOR_TYPES,
  WORK_ORDER_STATUSES,
  type ComplaintChannel,
  type ComplaintFeedbackInput,
  type ComplaintPriority,
  type ComplaintRecord,
  type ComplaintStatus,
  type CreateComplaintInput,
  type CreateWorkOrderInput,
  type DashboardSummary,
  type FeedbackSatisfaction,
  type IssueCategory,
  type ListComplaintFilters,
  type ListWorkOrderFilters,
  type ReporterIdentity,
  type RequestorType,
  type UpdateComplaintStatusInput,
  type UpdateWorkOrderStatusInput,
  type WorkOrderRecord,
  type WorkOrderStatus,
} from "./types.js";

const COMPLAINT_SLA_HOURS: Record<ComplaintPriority, number> = {
  low: 72,
  medium: 24,
  high: 8,
  critical: 4,
};

const COMPLAINT_STATUS_TRANSITIONS: Record<ComplaintStatus, readonly ComplaintStatus[]> = {
  new: ["triaged", "assigned", "rejected", "cancelled"],
  triaged: ["assigned", "rejected", "cancelled"],
  assigned: ["in_progress", "on_hold", "resolved", "cancelled"],
  in_progress: ["on_hold", "resolved", "cancelled"],
  on_hold: ["in_progress", "resolved", "cancelled"],
  resolved: ["closed", "in_progress"],
  rejected: [],
  cancelled: [],
  closed: [],
};

const WORK_ORDER_STATUS_TRANSITIONS: Record<WorkOrderStatus, readonly WorkOrderStatus[]> = {
  open: ["scheduled", "in_progress", "cancelled"],
  scheduled: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

const OPEN_COMPLAINT_STATUSES: ReadonlySet<ComplaintStatus> = new Set([
  "new",
  "triaged",
  "assigned",
  "in_progress",
  "on_hold",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new DomainError(400, "VALIDATION_ERROR", `Medan '${fieldName}' mesti teks dan tidak kosong.`);
  }
  return value.trim();
}

function asOptionalString(value: unknown, fieldName: string): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new DomainError(400, "VALIDATION_ERROR", `Medan '${fieldName}' mesti teks.`);
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

function asEnumValue<T extends readonly string[]>(value: unknown, allowed: T, fieldName: string): T[number] {
  const raw = asNonEmptyString(value, fieldName);
  if (!(allowed as readonly string[]).includes(raw)) {
    throw new DomainError(
      400,
      "VALIDATION_ERROR",
      `Nilai '${fieldName}' tidak sah. Dibenarkan: ${allowed.join(", ")}.`,
    );
  }
  return raw as T[number];
}

function parseIsoDate(value: string, fieldName: string): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    throw new DomainError(400, "VALIDATION_ERROR", `Medan '${fieldName}' mesti tarikh/masa ISO yang sah.`);
  }
  return new Date(parsed).toISOString();
}

function buildCountMap<T extends readonly string[]>(keys: T): Record<T[number], number> {
  const map = {} as Record<T[number], number>;
  for (const key of keys as readonly T[number][]) {
    map[key] = 0;
  }
  return map;
}

function calcResolutionHours(startIso: string, endIso: string): number | null {
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return null;
  }
  const rawHours = (end - start) / (1000 * 60 * 60);
  return Number(rawHours.toFixed(2));
}

function withAddedHours(dateIso: string, hours: number): string {
  const date = new Date(dateIso);
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

function makeDateStamp(dateIso: string): string {
  const date = new Date(dateIso);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

export class DomainError extends Error {
  readonly statusCode: number;
  readonly errorCode: string;

  constructor(statusCode: number, errorCode: string, message: string) {
    super(message);
    this.name = "DomainError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

export class EworksFacilityService {
  constructor(
    private readonly store = new EworksInMemoryStore(),
    private readonly now = () => new Date(),
  ) {}

  getDefaultTenantId(): string {
    return UITM_TENANT_ID;
  }

  listComplaints(tenantId: string, filters: ListComplaintFilters = {}): ComplaintRecord[] {
    const normalizedTenantId = asNonEmptyString(tenantId, "tenantId");
    let complaints = this.store.listComplaints(normalizedTenantId);

    if (filters.status) {
      complaints = complaints.filter((item) => item.status === filters.status);
    }
    if (filters.requestorType) {
      complaints = complaints.filter((item) => item.requestorType === filters.requestorType);
    }
    if (filters.campus) {
      const campus = filters.campus.trim().toLowerCase();
      complaints = complaints.filter((item) => item.location.campus.toLowerCase().includes(campus));
    }
    if (filters.search) {
      const keyword = filters.search.trim().toLowerCase();
      if (keyword.length > 0) {
        complaints = complaints.filter((item) => {
          const haystacks = [
            item.referenceNo,
            item.reporter.identifier,
            item.reporter.fullName ?? "",
            item.description,
            item.location.locationDescription,
            item.location.campus,
            item.issue.section,
            item.issue.element,
            item.issue.problemType,
          ];
          return haystacks.some((value) => value.toLowerCase().includes(keyword));
        });
      }
    }

    complaints.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));

    if (filters.limit !== undefined) {
      if (!Number.isInteger(filters.limit) || filters.limit <= 0) {
        throw new DomainError(400, "VALIDATION_ERROR", "Medan 'limit' mesti nombor bulat positif.");
      }
      complaints = complaints.slice(0, filters.limit);
    }

    return complaints;
  }

  getComplaint(tenantId: string, complaintId: string): ComplaintRecord {
    const complaint = this.store.getComplaint(asNonEmptyString(tenantId, "tenantId"), asNonEmptyString(complaintId, "complaintId"));
    if (!complaint) {
      throw new DomainError(404, "NOT_FOUND", "Aduan tidak ditemui.");
    }
    return complaint;
  }

  createComplaint(tenantId: string, rawInput: unknown, actorId: string): ComplaintRecord {
    const normalizedTenantId = asNonEmptyString(tenantId, "tenantId");
    const normalizedActorId = asNonEmptyString(actorId, "actorId");
    const input = this.parseCreateComplaintInput(rawInput);
    const nowIso = this.now().toISOString();
    const complaintId = `cmp_${randomUUID().replaceAll("-", "")}`;
    const referenceNo = `EW-${makeDateStamp(nowIso)}-${randomUUID().slice(0, 8).toUpperCase()}`;

    const complaint: ComplaintRecord = {
      id: complaintId,
      referenceNo,
      tenantId: normalizedTenantId,
      requestorType: input.requestorType,
      reporter: input.reporter,
      location: input.location,
      issue: input.issue,
      description: input.description,
      priority: input.priority ?? "medium",
      channel: input.channel ?? "online",
      status: "new",
      slaDueAt: withAddedHours(nowIso, COMPLAINT_SLA_HOURS[input.priority ?? "medium"]),
      createdAt: nowIso,
      updatedAt: nowIso,
      statusHistory: [
        {
          status: "new",
          changedAt: nowIso,
          changedBy: normalizedActorId,
          note: "Aduan diterima.",
        },
      ],
    };

    this.store.upsertComplaint(normalizedTenantId, complaint);
    return complaint;
  }

  updateComplaintStatus(
    tenantId: string,
    complaintId: string,
    rawInput: unknown,
    actorId: string,
  ): ComplaintRecord {
    const normalizedTenantId = asNonEmptyString(tenantId, "tenantId");
    const normalizedActorId = asNonEmptyString(actorId, "actorId");
    const payload = this.parseUpdateComplaintStatusInput(rawInput);
    const complaint = this.getComplaint(normalizedTenantId, complaintId);

    this.transitionComplaintStatus(
      complaint,
      payload.status,
      normalizedActorId,
      payload.note,
      this.now().toISOString(),
    );

    this.store.upsertComplaint(normalizedTenantId, complaint);
    return complaint;
  }

  addFeedback(
    tenantId: string,
    complaintId: string,
    rawInput: unknown,
    actorId: string,
  ): ComplaintRecord {
    const normalizedTenantId = asNonEmptyString(tenantId, "tenantId");
    const normalizedActorId = asNonEmptyString(actorId, "actorId");
    const payload = this.parseFeedbackInput(rawInput);
    const complaint = this.getComplaint(normalizedTenantId, complaintId);

    if (complaint.status !== "resolved" && complaint.status !== "closed") {
      throw new DomainError(
        409,
        "INVALID_STATE",
        "Maklum balas hanya boleh diberi selepas aduan berstatus resolved atau closed.",
      );
    }

    if (payload.satisfaction === "unsatisfied" && (!payload.comment || payload.comment.trim().length === 0)) {
      throw new DomainError(400, "VALIDATION_ERROR", "Komen wajib diisi apabila kepuasan adalah 'unsatisfied'.");
    }

    const nowIso = this.now().toISOString();
    complaint.feedback = {
      satisfaction: payload.satisfaction,
      comment: payload.comment,
      submittedAt: nowIso,
      submittedBy: normalizedActorId,
    };
    complaint.updatedAt = nowIso;
    this.store.upsertComplaint(normalizedTenantId, complaint);
    return complaint;
  }

  listWorkOrders(tenantId: string, filters: ListWorkOrderFilters = {}): WorkOrderRecord[] {
    const normalizedTenantId = asNonEmptyString(tenantId, "tenantId");
    let workOrders = this.store.listWorkOrders(normalizedTenantId);

    if (filters.status) {
      workOrders = workOrders.filter((item) => item.status === filters.status);
    }
    if (filters.complaintId) {
      const complaintId = filters.complaintId.trim();
      workOrders = workOrders.filter((item) => item.complaintId === complaintId);
    }
    if (filters.team) {
      const team = filters.team.trim().toLowerCase();
      workOrders = workOrders.filter((item) => item.team.toLowerCase().includes(team));
    }
    if (filters.assigneeId) {
      const assigneeId = filters.assigneeId.trim();
      workOrders = workOrders.filter((item) => item.assigneeId === assigneeId);
    }

    workOrders.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));

    if (filters.limit !== undefined) {
      if (!Number.isInteger(filters.limit) || filters.limit <= 0) {
        throw new DomainError(400, "VALIDATION_ERROR", "Medan 'limit' mesti nombor bulat positif.");
      }
      workOrders = workOrders.slice(0, filters.limit);
    }

    return workOrders;
  }

  createWorkOrder(
    tenantId: string,
    rawInput: unknown,
    actorId: string,
  ): WorkOrderRecord {
    const normalizedTenantId = asNonEmptyString(tenantId, "tenantId");
    const normalizedActorId = asNonEmptyString(actorId, "actorId");
    const payload = this.parseCreateWorkOrderInput(rawInput);
    const complaint = this.getComplaint(normalizedTenantId, payload.complaintId);

    if (complaint.status === "rejected" || complaint.status === "cancelled" || complaint.status === "closed") {
      throw new DomainError(409, "INVALID_STATE", "Work order tidak boleh dibuat untuk aduan yang telah ditutup.");
    }

    const hasActiveWorkOrder = this.store
      .listWorkOrders(normalizedTenantId)
      .some(
        (item) =>
          item.complaintId === payload.complaintId &&
          item.status !== "completed" &&
          item.status !== "cancelled",
      );

    if (hasActiveWorkOrder) {
      throw new DomainError(409, "DUPLICATE_ACTIVE_WORK_ORDER", "Aduan ini sudah mempunyai work order aktif.");
    }

    const nowIso = this.now().toISOString();
    const workOrderId = `wo_${randomUUID().replaceAll("-", "")}`;
    const code = `WO-${makeDateStamp(nowIso)}-${randomUUID().slice(0, 6).toUpperCase()}`;

    const workOrder: WorkOrderRecord = {
      id: workOrderId,
      code,
      tenantId: normalizedTenantId,
      complaintId: payload.complaintId,
      title: payload.title,
      description: payload.description,
      team: payload.team,
      assigneeId: payload.assigneeId,
      scheduledAt: payload.scheduledAt,
      status: "open",
      createdAt: nowIso,
      updatedAt: nowIso,
      statusHistory: [
        {
          status: "open",
          changedAt: nowIso,
          changedBy: normalizedActorId,
          note: "Work order diwujudkan.",
        },
      ],
    };

    this.store.upsertWorkOrder(normalizedTenantId, workOrder);

    if (complaint.status === "new" || complaint.status === "triaged") {
      this.transitionComplaintStatus(
        complaint,
        "assigned",
        normalizedActorId,
        `Work order ${code} diwujudkan.`,
        nowIso,
      );
      this.store.upsertComplaint(normalizedTenantId, complaint);
    }

    return workOrder;
  }

  updateWorkOrderStatus(
    tenantId: string,
    workOrderId: string,
    rawInput: unknown,
    actorId: string,
  ): WorkOrderRecord {
    const normalizedTenantId = asNonEmptyString(tenantId, "tenantId");
    const normalizedActorId = asNonEmptyString(actorId, "actorId");
    const payload = this.parseUpdateWorkOrderStatusInput(rawInput);
    const workOrder = this.getWorkOrder(normalizedTenantId, workOrderId);
    const nowIso = this.now().toISOString();

    this.transitionWorkOrderStatus(workOrder, payload.status, normalizedActorId, payload.note, nowIso);
    this.store.upsertWorkOrder(normalizedTenantId, workOrder);

    const complaint = this.getComplaint(normalizedTenantId, workOrder.complaintId);
    if (payload.status === "in_progress") {
      this.syncComplaintToInProgress(complaint, normalizedActorId, nowIso, workOrder.code);
      this.store.upsertComplaint(normalizedTenantId, complaint);
    }
    if (payload.status === "completed") {
      this.syncComplaintToResolved(complaint, normalizedActorId, nowIso, workOrder.code);
      this.store.upsertComplaint(normalizedTenantId, complaint);
    }

    return workOrder;
  }

  getWorkOrder(tenantId: string, workOrderId: string): WorkOrderRecord {
    const workOrder = this.store.getWorkOrder(asNonEmptyString(tenantId, "tenantId"), asNonEmptyString(workOrderId, "workOrderId"));
    if (!workOrder) {
      throw new DomainError(404, "NOT_FOUND", "Work order tidak ditemui.");
    }
    return workOrder;
  }

  getDashboardSummary(tenantId: string): DashboardSummary {
    const normalizedTenantId = asNonEmptyString(tenantId, "tenantId");
    const complaints = this.store.listComplaints(normalizedTenantId);
    const workOrders = this.store.listWorkOrders(normalizedTenantId);
    const nowIso = this.now().toISOString();
    const nowMs = Date.parse(nowIso);

    const complaintsByStatus = buildCountMap(COMPLAINT_STATUSES);
    for (const complaint of complaints) {
      complaintsByStatus[complaint.status] += 1;
    }

    const workOrdersByStatus = buildCountMap(WORK_ORDER_STATUSES);
    for (const workOrder of workOrders) {
      workOrdersByStatus[workOrder.status] += 1;
    }

    const overdueComplaints = complaints.filter((complaint) => {
      if (!OPEN_COMPLAINT_STATUSES.has(complaint.status)) {
        return false;
      }
      const dueMs = Date.parse(complaint.slaDueAt);
      return !Number.isNaN(dueMs) && dueMs < nowMs;
    }).length;

    const resolutionDurations = complaints
      .filter((item) => item.status === "resolved" || item.status === "closed")
      .map((item) => calcResolutionHours(item.createdAt, item.updatedAt))
      .filter((value): value is number => value !== null);

    const averageResolutionHours =
      resolutionDurations.length > 0
        ? Number(
            (
              resolutionDurations.reduce((sum, value) => sum + value, 0) / resolutionDurations.length
            ).toFixed(2),
          )
        : null;

    return {
      tenantId: normalizedTenantId,
      totalComplaints: complaints.length,
      overdueComplaints,
      complaintsByStatus,
      totalWorkOrders: workOrders.length,
      workOrdersByStatus,
      averageResolutionHours,
      generatedAt: nowIso,
    };
  }

  private parseCreateComplaintInput(rawInput: unknown): CreateComplaintInput {
    if (!isRecord(rawInput)) {
      throw new DomainError(400, "VALIDATION_ERROR", "Payload aduan mesti objek JSON.");
    }

    const requestorType = asEnumValue(rawInput.requestorType, REQUESTOR_TYPES, "requestorType");
    const reporter = this.parseReporter(rawInput.reporter, requestorType);
    const location = this.parseLocation(rawInput.location);
    const issue = this.parseIssue(rawInput.issue);
    const description = asNonEmptyString(rawInput.description, "description");
    const priority =
      rawInput.priority === undefined
        ? undefined
        : asEnumValue(rawInput.priority, COMPLAINT_PRIORITIES, "priority");
    const channel =
      rawInput.channel === undefined
        ? undefined
        : asEnumValue(rawInput.channel, COMPLAINT_CHANNELS, "channel");

    return {
      requestorType,
      reporter,
      location,
      issue,
      description,
      priority,
      channel,
    };
  }

  private parseUpdateComplaintStatusInput(rawInput: unknown): UpdateComplaintStatusInput {
    if (!isRecord(rawInput)) {
      throw new DomainError(400, "VALIDATION_ERROR", "Payload status aduan mesti objek JSON.");
    }
    return {
      status: asEnumValue(rawInput.status, COMPLAINT_STATUSES, "status"),
      note: asOptionalString(rawInput.note, "note"),
    };
  }

  private parseFeedbackInput(rawInput: unknown): ComplaintFeedbackInput {
    if (!isRecord(rawInput)) {
      throw new DomainError(400, "VALIDATION_ERROR", "Payload maklum balas mesti objek JSON.");
    }
    const satisfaction = asEnumValue(rawInput.satisfaction, FEEDBACK_SATISFACTION, "satisfaction");
    return {
      satisfaction: satisfaction as FeedbackSatisfaction,
      comment: asOptionalString(rawInput.comment, "comment"),
    };
  }

  private parseCreateWorkOrderInput(rawInput: unknown): CreateWorkOrderInput {
    if (!isRecord(rawInput)) {
      throw new DomainError(400, "VALIDATION_ERROR", "Payload work order mesti objek JSON.");
    }

    const scheduledAtRaw = asOptionalString(rawInput.scheduledAt, "scheduledAt");

    return {
      complaintId: asNonEmptyString(rawInput.complaintId, "complaintId"),
      title: asNonEmptyString(rawInput.title, "title"),
      description: asOptionalString(rawInput.description, "description"),
      team: asNonEmptyString(rawInput.team, "team"),
      assigneeId: asOptionalString(rawInput.assigneeId, "assigneeId"),
      scheduledAt: scheduledAtRaw ? parseIsoDate(scheduledAtRaw, "scheduledAt") : undefined,
    };
  }

  private parseUpdateWorkOrderStatusInput(rawInput: unknown): UpdateWorkOrderStatusInput {
    if (!isRecord(rawInput)) {
      throw new DomainError(400, "VALIDATION_ERROR", "Payload status work order mesti objek JSON.");
    }
    return {
      status: asEnumValue(rawInput.status, WORK_ORDER_STATUSES, "status"),
      note: asOptionalString(rawInput.note, "note"),
    };
  }

  private parseReporter(rawReporter: unknown, requestorType: RequestorType): ReporterIdentity {
    if (!isRecord(rawReporter)) {
      throw new DomainError(400, "VALIDATION_ERROR", "Medan 'reporter' mesti objek JSON.");
    }

    const identifier = asNonEmptyString(rawReporter.identifier, "reporter.identifier");
    this.validateReporterIdentifier(requestorType, identifier);

    return {
      identifier,
      fullName: asOptionalString(rawReporter.fullName, "reporter.fullName"),
      email: asOptionalString(rawReporter.email, "reporter.email"),
      phone: asOptionalString(rawReporter.phone, "reporter.phone"),
      department: asOptionalString(rawReporter.department, "reporter.department"),
      jobTitle: asOptionalString(rawReporter.jobTitle, "reporter.jobTitle"),
    };
  }

  private parseLocation(rawLocation: unknown): CreateComplaintInput["location"] {
    if (!isRecord(rawLocation)) {
      throw new DomainError(400, "VALIDATION_ERROR", "Medan 'location' mesti objek JSON.");
    }

    let coordinates: CreateComplaintInput["location"]["coordinates"];
    if (rawLocation.coordinates !== undefined) {
      if (!isRecord(rawLocation.coordinates)) {
        throw new DomainError(400, "VALIDATION_ERROR", "Medan 'location.coordinates' mesti objek JSON.");
      }
      const lat = Number(rawLocation.coordinates.lat);
      const lng = Number(rawLocation.coordinates.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new DomainError(
          400,
          "VALIDATION_ERROR",
          "Koordinat 'location.coordinates.lat/lng' mesti nombor yang sah.",
        );
      }
      coordinates = { lat, lng };
    }

    return {
      state: asNonEmptyString(rawLocation.state, "location.state"),
      campus: asNonEmptyString(rawLocation.campus, "location.campus"),
      building: asNonEmptyString(rawLocation.building, "location.building"),
      block: asOptionalString(rawLocation.block, "location.block"),
      floor: asOptionalString(rawLocation.floor, "location.floor"),
      room: asOptionalString(rawLocation.room, "location.room"),
      locationDescription: asNonEmptyString(rawLocation.locationDescription, "location.locationDescription"),
      coordinates,
    };
  }

  private parseIssue(rawIssue: unknown): IssueCategory {
    if (!isRecord(rawIssue)) {
      throw new DomainError(400, "VALIDATION_ERROR", "Medan 'issue' mesti objek JSON.");
    }
    return {
      section: asNonEmptyString(rawIssue.section, "issue.section"),
      element: asNonEmptyString(rawIssue.element, "issue.element"),
      problemType: asNonEmptyString(rawIssue.problemType, "issue.problemType"),
    };
  }

  private validateReporterIdentifier(requestorType: RequestorType, identifier: string): void {
    if (!/^\d+$/.test(identifier)) {
      throw new DomainError(400, "VALIDATION_ERROR", "reporter.identifier hanya boleh mengandungi nombor.");
    }

    if ((requestorType === "staff" || requestorType === "student") && identifier.length > 10) {
      throw new DomainError(
        400,
        "VALIDATION_ERROR",
        "Untuk staff/student, reporter.identifier mesti maksimum 10 digit.",
      );
    }

    if (requestorType === "external" && identifier.length < 12) {
      throw new DomainError(
        400,
        "VALIDATION_ERROR",
        "Untuk external, reporter.identifier mesti minimum 12 digit.",
      );
    }
  }

  private transitionComplaintStatus(
    complaint: ComplaintRecord,
    nextStatus: ComplaintStatus,
    actorId: string,
    note: string | undefined,
    changedAt: string,
  ): void {
    if (complaint.status === nextStatus) {
      return;
    }

    const allowedStatuses = COMPLAINT_STATUS_TRANSITIONS[complaint.status];
    if (!allowedStatuses.includes(nextStatus)) {
      throw new DomainError(
        409,
        "INVALID_STATUS_TRANSITION",
        `Peralihan status aduan dari '${complaint.status}' ke '${nextStatus}' tidak dibenarkan.`,
      );
    }

    complaint.status = nextStatus;
    complaint.updatedAt = changedAt;
    complaint.statusHistory.push({
      status: nextStatus,
      changedAt,
      changedBy: actorId,
      note,
    });
  }

  private transitionWorkOrderStatus(
    workOrder: WorkOrderRecord,
    nextStatus: WorkOrderStatus,
    actorId: string,
    note: string | undefined,
    changedAt: string,
  ): void {
    if (workOrder.status === nextStatus) {
      return;
    }

    const allowedStatuses = WORK_ORDER_STATUS_TRANSITIONS[workOrder.status];
    if (!allowedStatuses.includes(nextStatus)) {
      throw new DomainError(
        409,
        "INVALID_STATUS_TRANSITION",
        `Peralihan status work order dari '${workOrder.status}' ke '${nextStatus}' tidak dibenarkan.`,
      );
    }

    workOrder.status = nextStatus;
    workOrder.updatedAt = changedAt;
    workOrder.statusHistory.push({
      status: nextStatus,
      changedAt,
      changedBy: actorId,
      note,
    });
  }

  private syncComplaintToInProgress(
    complaint: ComplaintRecord,
    actorId: string,
    changedAt: string,
    workOrderCode: string,
  ): void {
    if (complaint.status === "in_progress") {
      return;
    }

    if (complaint.status === "new" || complaint.status === "triaged") {
      this.transitionComplaintStatus(
        complaint,
        "assigned",
        actorId,
        `Aduan ditugaskan melalui ${workOrderCode}.`,
        changedAt,
      );
    }

    if (complaint.status === "assigned" || complaint.status === "on_hold") {
      this.transitionComplaintStatus(
        complaint,
        "in_progress",
        actorId,
        `Kerja pembaikan bermula untuk ${workOrderCode}.`,
        changedAt,
      );
    }
  }

  private syncComplaintToResolved(
    complaint: ComplaintRecord,
    actorId: string,
    changedAt: string,
    workOrderCode: string,
  ): void {
    if (
      complaint.status === "resolved" ||
      complaint.status === "closed" ||
      complaint.status === "rejected" ||
      complaint.status === "cancelled"
    ) {
      return;
    }

    if (complaint.status === "new" || complaint.status === "triaged") {
      this.transitionComplaintStatus(
        complaint,
        "assigned",
        actorId,
        `Aduan ditugaskan melalui ${workOrderCode}.`,
        changedAt,
      );
    }

    if (complaint.status === "assigned" || complaint.status === "on_hold") {
      this.transitionComplaintStatus(
        complaint,
        "in_progress",
        actorId,
        `Kerja pembaikan disegerakkan untuk ${workOrderCode}.`,
        changedAt,
      );
    }

    if (complaint.status === "in_progress" || complaint.status === "assigned" || complaint.status === "on_hold") {
      this.transitionComplaintStatus(
        complaint,
        "resolved",
        actorId,
        `Kerja pembaikan selesai melalui ${workOrderCode}.`,
        changedAt,
      );
    }
  }
}
