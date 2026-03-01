import type { ComplaintRecord, WorkOrderRecord } from "./types.js";

interface TenantPartition {
  complaints: Map<string, ComplaintRecord>;
  workOrders: Map<string, WorkOrderRecord>;
}

/**
 * In-memory store untuk MVP.
 * Untuk produksi, gantikan kepada repository DB (PostgreSQL/MySQL) tanpa ubah API service.
 */
export class EworksInMemoryStore {
  private readonly partitions = new Map<string, TenantPartition>();

  private ensurePartition(tenantId: string): TenantPartition {
    const existing = this.partitions.get(tenantId);
    if (existing) {
      return existing;
    }

    const created: TenantPartition = {
      complaints: new Map<string, ComplaintRecord>(),
      workOrders: new Map<string, WorkOrderRecord>(),
    };
    this.partitions.set(tenantId, created);
    return created;
  }

  listComplaints(tenantId: string): ComplaintRecord[] {
    const partition = this.ensurePartition(tenantId);
    return [...partition.complaints.values()];
  }

  getComplaint(tenantId: string, complaintId: string): ComplaintRecord | undefined {
    const partition = this.ensurePartition(tenantId);
    return partition.complaints.get(complaintId);
  }

  upsertComplaint(tenantId: string, complaint: ComplaintRecord): void {
    const partition = this.ensurePartition(tenantId);
    partition.complaints.set(complaint.id, complaint);
  }

  listWorkOrders(tenantId: string): WorkOrderRecord[] {
    const partition = this.ensurePartition(tenantId);
    return [...partition.workOrders.values()];
  }

  getWorkOrder(tenantId: string, workOrderId: string): WorkOrderRecord | undefined {
    const partition = this.ensurePartition(tenantId);
    return partition.workOrders.get(workOrderId);
  }

  upsertWorkOrder(tenantId: string, workOrder: WorkOrderRecord): void {
    const partition = this.ensurePartition(tenantId);
    partition.workOrders.set(workOrder.id, workOrder);
  }
}
