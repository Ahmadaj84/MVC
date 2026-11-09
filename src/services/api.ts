import {
  MvcVpiFacility,
  MvcVpiFacilityType,
  MvcMstaffData,
  MvcPenaltyArtical,
  FullFacDecision,
  FullStaffDecision
} from '../types/database';

export interface DashboardStats {
  totalFines: number;
  totalPaid: number;
  totalRemaining: number;
  facilitiesCount: number;
  staffCount: number;
  facDecisionsCount: number;
  staffDecisionsCount: number;
  articlesCount: number;
  uncollectedDecisionsCount: number;
  totalSmsSent: number;
  paymentRate: number;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// Throws on non-2xx responses so callers' catch blocks actually run,
// carrying the server's error message when it sent one.
async function handle<T = any>(res: Response): Promise<T> {
  const text = await res.text();
  let body: any = undefined;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    body = undefined;
  }
  if (!res.ok) {
    throw new ApiError(body?.error || `Request failed (${res.status})`, res.status);
  }
  return body as T;
}

export const api = {
  // Stats
  async getStats(): Promise<DashboardStats> {
    const res = await fetch('/api/stats');
    return handle(res);
  },

  // Facility Types
  async getFacilityTypes(): Promise<MvcVpiFacilityType[]> {
    const res = await fetch('/api/facility-types');
    return handle(res);
  },

  // Facilities
  async getFacilities(params?: { search?: string; type?: string; city?: string }): Promise<MvcVpiFacility[]> {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`/api/facilities${query ? `?${query}` : ''}`);
    return handle(res);
  },

  async createFacility(data: Partial<MvcVpiFacility>): Promise<MvcVpiFacility> {
    const res = await fetch('/api/facilities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handle(res);
  },

  async updateFacility(id: number, data: Partial<MvcVpiFacility>): Promise<MvcVpiFacility> {
    const res = await fetch(`/api/facilities/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handle(res);
  },

  async deleteFacility(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`/api/facilities/${id}`, { method: 'DELETE' });
    return handle(res);
  },

  // Staff
  async getStaff(params?: { search?: string; facilityId?: string; degree?: string }): Promise<MvcMstaffData[]> {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`/api/staff${query ? `?${query}` : ''}`);
    return handle(res);
  },

  async createStaff(data: Partial<MvcMstaffData>): Promise<MvcMstaffData> {
    const res = await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handle(res);
  },

  async updateStaff(id: number, data: Partial<MvcMstaffData>): Promise<MvcMstaffData> {
    const res = await fetch(`/api/staff/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handle(res);
  },

  async deleteStaff(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' });
    return handle(res);
  },

  // Articles
  async getArticles(): Promise<MvcPenaltyArtical[]> {
    const res = await fetch('/api/penalty-articles');
    return handle(res);
  },

  async createArticle(data: Partial<MvcPenaltyArtical>): Promise<MvcPenaltyArtical> {
    const res = await fetch('/api/penalty-articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handle(res);
  },

  async updateArticle(id: number, data: Partial<MvcPenaltyArtical>): Promise<MvcPenaltyArtical> {
    const res = await fetch(`/api/penalty-articles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handle(res);
  },

  async deleteArticle(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`/api/penalty-articles/${id}`, { method: 'DELETE' });
    return handle(res);
  },

  // Facility Decisions
  async getFacilityDecisions(params?: { search?: string; facilityId?: string; payedStatus?: string }): Promise<FullFacDecision[]> {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`/api/facility-decisions${query ? `?${query}` : ''}`);
    return handle(res);
  },

  async getFacilityDecision(id: number): Promise<FullFacDecision> {
    const res = await fetch(`/api/facility-decisions/${id}`);
    return handle(res);
  },

  async createFacilityDecision(payload: { decision: any; items: any[]; sendSmsNow?: boolean }): Promise<FullFacDecision> {
    const res = await fetch('/api/facility-decisions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handle(res);
  },

  async updateFacilityDecision(id: number, payload: { decision: any; items: any[] }): Promise<FullFacDecision> {
    const res = await fetch(`/api/facility-decisions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handle(res);
  },

  async deleteFacilityDecision(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`/api/facility-decisions/${id}`, { method: 'DELETE' });
    return handle(res);
  },

  async sendFacilitySms(id: number, payload: { noticeNum: number; customText?: string }): Promise<any> {
    const res = await fetch(`/api/facility-decisions/${id}/send-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handle(res);
  },

  async registerFacilityPayment(id: number, payload: any): Promise<any> {
    const res = await fetch(`/api/facility-decisions/${id}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handle(res);
  },

  // Staff Decisions
  async getStaffDecisions(params?: { search?: string; staffId?: string; payedStatus?: string }): Promise<FullStaffDecision[]> {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`/api/staff-decisions${query ? `?${query}` : ''}`);
    return handle(res);
  },

  async getStaffDecision(id: number): Promise<FullStaffDecision> {
    const res = await fetch(`/api/staff-decisions/${id}`);
    return handle(res);
  },

  async createStaffDecision(payload: { decision: any; items: any[]; sendSmsNow?: boolean }): Promise<FullStaffDecision> {
    const res = await fetch('/api/staff-decisions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handle(res);
  },

  async updateStaffDecision(id: number, payload: { decision: any; items: any[] }): Promise<FullStaffDecision> {
    const res = await fetch(`/api/staff-decisions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handle(res);
  },

  async deleteStaffDecision(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`/api/staff-decisions/${id}`, { method: 'DELETE' });
    return handle(res);
  },

  async sendStaffSms(id: number, payload: { noticeNum: number; customText?: string }): Promise<any> {
    const res = await fetch(`/api/staff-decisions/${id}/send-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handle(res);
  },

  async registerStaffPayment(id: number, payload: any): Promise<any> {
    const res = await fetch(`/api/staff-decisions/${id}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handle(res);
  },

  // ERD schema info
  async getErd(): Promise<any> {
    const res = await fetch('/api/erd');
    return handle(res);
  },

  // Oracle 19c DDL & Scripts
  async getOracleDdl(): Promise<{ database: string; compatibility: string; ddl: string; nodeConnector: string }> {
    const res = await fetch('/api/oracle/ddl');
    return handle(res);
  },

  // Reset DB
  async resetDatabase(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/seed/reset', { method: 'POST' });
    return handle(res);
  }
};
