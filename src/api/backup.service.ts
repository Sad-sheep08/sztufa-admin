import { BackupDTO } from './types';
import { BASE_URL, createHeaders, handleResponse } from './http';

export const backupApi = {
  create: async (): Promise<{ success: boolean; downloadUrl: string }> => {
    const response = await fetch(`${BASE_URL}/backups/create`, {
      method: 'POST',
      headers: createHeaders(),
    });
    return handleResponse<{ success: boolean; downloadUrl: string }>(response);
  },
  list: async (): Promise<{ success: boolean; data: BackupDTO[] }> => {
    const response = await fetch(`${BASE_URL}/backups/list`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<{ success: boolean; data: BackupDTO[] }>(response);
  },
  restore: async (key: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${BASE_URL}/backups/restore`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ key }),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },
};
