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

export const api = {
  // Stats
  async getStats(): Promise<DashboardStats> {
    const res = await fetch('/api/stats');
    return res.json();
  },

  // Facility Types
  async getFacilityTypes(): Promise<MvcVpiFacilityType[]> {
    const res = await fetch('/api/facility-types');
    return res.json();
  },

  // Facilities
  async getFacilities(params?: { search?: string; type?: string; city?: string }): Promise<MvcVpiFacility[]> {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`/api/facilities${query ? `?${query}` : ''}`);
    return res.json();
  },

  async createFacility(data: Partial<MvcVpiFacility>): Promise<MvcVpiFacility> {
    const res = await fetch('/api/facilities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateFacility(id: number, data: Partial<MvcVpiFacility>): Promise<MvcVpiFacility> {
    const res = await fetch(`/api/facilities/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteFacility(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`/api/facilities/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Staff
  async getStaff(params?: { search?: string; facilityId?: string; degree?: string }): Promise<MvcMstaffData[]> {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`/api/staff${query ? `?${query}` : ''}`);
    return res.json();
  },

  async createStaff(data: Partial<MvcMstaffData>): Promise<MvcMstaffData> {
    const res = await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateStaff(id: number, data: Partial<MvcMstaffData>): Promise<MvcMstaffData> {
    const res = await fetch(`/api/staff/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteStaff(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Articles
  async getArticles(): Promise<MvcPenaltyArtical[]> {
    const res = await fetch('/api/penalty-articles');
    return res.json();
  },

  async createArticle(data: Partial<MvcPenaltyArtical>): Promise<MvcPenaltyArtical> {
    const res = await fetch('/api/penalty-articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateArticle(id: number, data: Partial<MvcPenaltyArtical>): Promise<MvcPenaltyArtical> {
    const res = await fetch(`/api/penalty-articles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteArticle(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`/api/penalty-articles/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Facility Decisions
  async getFacilityDecisions(params?: { search?: string; facilityId?: string; payedStatus?: string }): Promise<FullFacDecision[]> {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`/api/facility-decisions${query ? `?${query}` : ''}`);
    return res.json();
  },

  async getFacilityDecision(id: number): Promise<FullFacDecision> {
    const res = await fetch(`/api/facility-decisions/${id}`);
    return res.json();
  },

  async createFacilityDecision(payload: { decision: any; items: any[]; sendSmsNow?: boolean }): Promise<FullFacDecision> {
    const res = await fetch('/api/facility-decisions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async updateFacilityDecision(id: number, payload: { decision: any; items: any[] }): Promise<FullFacDecision> {
    const res = await fetch(`/api/facility-decisions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async deleteFacilityDecision(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`/api/facility-decisions/${id}`, { method: 'DELETE' });
    return res.json();
  },

  async sendFacilitySms(id: number, payload: { noticeNum: number; customText?: string }): Promise<any> {
    const res = await fetch(`/api/facility-decisions/${id}/send-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async registerFacilityPayment(id: number, payload: any): Promise<any> {
    const res = await fetch(`/api/facility-decisions/${id}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Staff Decisions
  async getStaffDecisions(params?: { search?: string; staffId?: string; payedStatus?: string }): Promise<FullStaffDecision[]> {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`/api/staff-decisions${query ? `?${query}` : ''}`);
    return res.json();
  },

  async getStaffDecision(id: number): Promise<FullStaffDecision> {
    const res = await fetch(`/api/staff-decisions/${id}`);
    return res.json();
  },

  async createStaffDecision(payload: { decision: any; items: any[]; sendSmsNow?: boolean }): Promise<FullStaffDecision> {
    const res = await fetch('/api/staff-decisions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async updateStaffDecision(id: number, payload: { decision: any; items: any[] }): Promise<FullStaffDecision> {
    const res = await fetch(`/api/staff-decisions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async deleteStaffDecision(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`/api/staff-decisions/${id}`, { method: 'DELETE' });
    return res.json();
  },

  async sendStaffSms(id: number, payload: { noticeNum: number; customText?: string }): Promise<any> {
    const res = await fetch(`/api/staff-decisions/${id}/send-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async registerStaffPayment(id: number, payload: any): Promise<any> {
    const res = await fetch(`/api/staff-decisions/${id}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // ERD schema info
  async getErd(): Promise<any> {
    const res = await fetch('/api/erd');
    return res.json();
  },

  // Oracle 19c DDL & Scripts
  async getOracleDdl(): Promise<{ database: string; compatibility: string; ddl: string; nodeConnector: string }> {
    const res = await fetch('/api/oracle/ddl');
    return res.json();
  },

  // Reset DB
  async resetDatabase(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/seed/reset', { method: 'POST' });
    return res.json();
  }
};
