import { useState, useEffect, useCallback } from 'react';
import { newsApi } from '../../api/service';
import { NewsDTO } from '../../api/service';

const LIMIT = 10;

export interface UseNewsDataReturn {
  newsList: NewsDTO[];
  total: number;
  page: number;
  limit: number;
  categoryFilter: string;
  isLoading: boolean;
  error: string | null;
  success: string | null;
  setPage: (p: number) => void;
  setCategoryFilter: (c: string) => void;
  setError: (e: string | null) => void;
  setSuccess: (s: string | null) => void;
  loadNews: () => Promise<void>;
  handleDelete: (id: string, title: string) => Promise<void>;
}

export function useNewsData(): UseNewsDataReturn {
  const [newsList, setNewsList] = useState<NewsDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadNews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await newsApi.getAll(page, LIMIT, categoryFilter);
      setNewsList(res.data || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || '获取活动资讯列表失败');
    } finally {
      setIsLoading(false);
    }
  }, [page, categoryFilter]);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`确定要删除活动资讯 "${title}" 吗？`)) {
      return;
    }

    setError(null);
    setSuccess(null);
    try {
      await newsApi.delete(id);
      setSuccess('删除成功！');
      loadNews();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || '删除资讯失败');
    }
  };

  return {
    newsList,
    total,
    page,
    limit: LIMIT,
    categoryFilter,
    isLoading,
    error,
    success,
    setPage,
    setCategoryFilter,
    setError,
    setSuccess,
    loadNews,
    handleDelete,
  };
}
