import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  total,
  pageSize,
  onPageChange,
}) => {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="table-pagination">
      <span>共 {total} 条，第 {currentPage} / {totalPages} 页</span>
      <div className="table-pagination-actions">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="add-btn small btn-secondary"
        >
          <ChevronLeft size={14} />
          上一页
        </button>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="add-btn small btn-secondary"
        >
          下一页
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};
