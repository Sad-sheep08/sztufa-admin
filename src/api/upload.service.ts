import { ApiResponse, ImportResult } from './types';
import { BASE_URL, handleResponse, createHeaders } from './http';

export const importApi = {
  importFromJson: async (filePath: string): Promise<ApiResponse<{ result: ImportResult }>> => {
    const response = await fetch(`${BASE_URL}/import/json`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ filePath }),
    });
    return handleResponse<ApiResponse<{ result: ImportResult }>>(response);
  },
};

export const uploadApi = {
  upload: async (file: File): Promise<ApiResponse<{ url: string }>> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      headers: createHeaders(true), // multipart = true
      body: formData,
    });
    return handleResponse<ApiResponse<{ url: string }>>(response);
  },
};
