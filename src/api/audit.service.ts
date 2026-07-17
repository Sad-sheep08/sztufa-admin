import { AuditLogDTO } from './types';
import { BASE_URL, createHeaders, handleResponse } from './http';

export const auditLogApi = {
  getAll: async (page = 1, limit = 20, username = '', action = ''): Promise<{ data: AuditLogDTO[]; total: number; page: number; limit: number }> => {
    let url = `${BASE_URL}/audit-logs?page=${page}&limit=${limit}`;
    if (username) url += `&username=${encodeURIComponent(username)}`;
    if (action) url += `&action=${encodeURIComponent(action)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<{ data: AuditLogDTO[]; total: number; page: number; limit: number }>(response);
  },
};
