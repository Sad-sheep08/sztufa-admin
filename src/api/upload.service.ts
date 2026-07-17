import { ApiResponse, ImportResult } from './types';
import { BASE_URL, handleResponse } from './http';

export const importApi = {
  importFromJson: async (filePath: string): Promise<ApiResponse<{ result: ImportResult }>> => {
    const headers = new Headers();
    const token = localStorage.getItem('token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${BASE_URL}/import/json`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ filePath }),
    });
    return handleResponse<ApiResponse<{ result: ImportResult }>>(response);
  },
};

export const uploadApi = {
  upload: async (file: File): Promise<ApiResponse<{ url: string }>> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const headers = new Headers();
    const token = localStorage.getItem('token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return handleResponse<ApiResponse<{ url: string }>>(response);
  },
};
