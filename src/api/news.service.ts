import { BASE_URL, createHeaders, handleResponse } from './http';

export interface NewsDTO {
  id?: string;
  title: string;
  category: string;
  description: string;
  coverImage?: string | null;
  wechatUrl: string;
  date: string;
}

export const newsApi = {
  create: async (newsData: NewsDTO): Promise<NewsDTO> => {
    const response = await fetch(`${BASE_URL}/news`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(newsData),
    });
    return handleResponse<NewsDTO>(response);
  },

  getAll: async (page = 1, limit = 10, category = 'all'): Promise<{ data: NewsDTO[]; total: number; page: number; limit: number }> => {
    let url = `${BASE_URL}/news?page=${page}&limit=${limit}`;
    if (category && category !== 'all') {
      url += `&category=${encodeURIComponent(category)}`;
    }
    const response = await fetch(url, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<{ data: NewsDTO[]; total: number; page: number; limit: number }>(response);
  },

  getById: async (id: string): Promise<NewsDTO> => {
    const response = await fetch(`${BASE_URL}/news/${id}`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<NewsDTO>(response);
  },

  update: async (id: string, newsData: Partial<NewsDTO>): Promise<NewsDTO> => {
    const response = await fetch(`${BASE_URL}/news/${id}`, {
      method: 'PATCH',
      headers: createHeaders(),
      body: JSON.stringify(newsData),
    });
    return handleResponse<NewsDTO>(response);
  },

  delete: async (id: string): Promise<NewsDTO> => {
    const response = await fetch(`${BASE_URL}/news/${id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
    return handleResponse<NewsDTO>(response);
  },
};
