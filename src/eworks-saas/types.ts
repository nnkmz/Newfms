/**
 * Domain model for UiTM eWorks Facilities SaaS (MVP).
 * Fokus pada aliran aduan fasiliti, tugasan teknikal, dan metrik operasi.
 */

export const USER_ROLES = ["requestor", "helpdesk", "technician", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const REQUESTOR_TYPES = ["staff", "student", "external"] as const;
export type RequestorType = (typeof REQUESTOR_TYPES)[number];

export const COMPLAINT_CHANNELS = ["online", "phone", "walk_in"] as const;
export type ComplaintChannel = (typeof COMPLAINT_CHANNELS)[number];

export const COMPLAINT_PRIORITIES = ["low", "medium", "high", "critical"] as const;
export type ComplaintPriority = (typeof COMPLAINT_PRIORITIES)[number];

export const COMPLAINT_STATUSES = [
  "new",
  "triaged",
  "assigned",
  "in_progress",
  "on_hold",
  "resolved",
  "rejected",
  "cancelled",
  "closed",
] as const;
export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

export const WORK_ORDER_STATUSES = [
  "open",
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number];

export const FEEDBACK_SATISFACTION = ["satisfied", "unsatisfied"] as const;
export type FeedbackSatisfaction = (typeof FEEDBACK_SATISFACTION)[number];

export interface CoordinatePoint {
  lat: number;
  lng: number;
}

export interface ReporterIdentity {
  /**
   * Mengikut jenis pengguna:
   * - staff/student: nombor staf/pelajar
   * - external: nombor IC/pasport
   */
  identifier: string;
  fullName?: string;
  email?: string;
  phone?: string;
  department?: string;
  jobTitle?: string;
}

export interface ComplaintLocation {
  state: string;
  campus: string;
  building: string;
  block?: string;
  floor?: string;
  room?: string;
  locationDescription: string;
  coordinates?: CoordinatePoint;
}

export interface IssueCategory {
  section: string;
  element: string;
  problemType: string;
}

export interface StatusHistory<TStatus extends string> {
  status: TStatus;
  changedAt: string;
  changedBy: string;
  note?: string;
}

export interface ComplaintFeedback {
  satisfaction: FeedbackSatisfaction;
  comment?: string;
  submittedAt: string;
  submittedBy: string;
}

export interface ComplaintRecord {
  id: string;
  referenceNo: string;
  tenantId: string;
  requestorType: RequestorType;
  reporter: ReporterIdentity;
  location: ComplaintLocation;
  issue: IssueCategory;
  description: string;
  priority: ComplaintPriority;
  channel: ComplaintChannel;
  status: ComplaintStatus;
  slaDueAt: string;
  createdAt: string;
  updatedAt: string;
  statusHistory: StatusHistory<ComplaintStatus>[];
  feedback?: ComplaintFeedback;
}

export interface WorkOrderRecord {
  id: string;
  code: string;
  tenantId: string;
  complaintId: string;
  title: string;
  description?: string;
  team: string;
  assigneeId?: string;
  scheduledAt?: string;
  status: WorkOrderStatus;
  createdAt: string;
  updatedAt: string;
  statusHistory: StatusHistory<WorkOrderStatus>[];
}

export interface CreateComplaintInput {
  requestorType: RequestorType;
  reporter: ReporterIdentity;
  location: ComplaintLocation;
  issue: IssueCategory;
  description: string;
  priority?: ComplaintPriority;
  channel?: ComplaintChannel;
}

export interface ListComplaintFilters {
  status?: ComplaintStatus;
  requestorType?: RequestorType;
  campus?: string;
  search?: string;
  limit?: number;
}

export interface UpdateComplaintStatusInput {
  status: ComplaintStatus;
  note?: string;
}

export interface ComplaintFeedbackInput {
  satisfaction: FeedbackSatisfaction;
  comment?: string;
}

export interface CreateWorkOrderInput {
  complaintId: string;
  title: string;
  description?: string;
  team: string;
  assigneeId?: string;
  scheduledAt?: string;
}

export interface UpdateWorkOrderStatusInput {
  status: WorkOrderStatus;
  note?: string;
}

export interface ListWorkOrderFilters {
  status?: WorkOrderStatus;
  complaintId?: string;
  team?: string;
  assigneeId?: string;
  limit?: number;
}

export interface DashboardSummary {
  tenantId: string;
  totalComplaints: number;
  overdueComplaints: number;
  complaintsByStatus: Record<ComplaintStatus, number>;
  totalWorkOrders: number;
  workOrdersByStatus: Record<WorkOrderStatus, number>;
  averageResolutionHours: number | null;
  generatedAt: string;
}

export interface ApiErrorPayload {
  error: string;
  message: string;
}
