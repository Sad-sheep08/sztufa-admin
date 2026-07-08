import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, ChevronLeft, ChevronRight, Calendar, User, Activity } from 'lucide-react';
import { auditLogApi } from '../api/service';
import { AuditLogDTO } from '../api/types';

const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, [page]);

  const loadLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await auditLogApi.getAll(page, limit);
      setLogs(response.data || []);
      setTotal(response.total || 0);
    } catch (err) {
      console.error('加载审计日志失败:', err);
      setError('无法连接服务器，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  };

  const getActionTagClass = (action: string) => {
    if (action.includes('DELETE')) return 'tag-danger';
    if (action.includes('CREATE')) return 'tag-success';
    if (action.includes('UPDATE')) return 'tag-warning';
    return 'tag-info';
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'CREATE_MATCH': return '录入比赛';
      case 'UPDATE_MATCH': return '更新比赛';
      case 'DELETE_MATCH': return '删除比赛';
      case 'CREATE_PLAYER': return '新增球员';
      case 'UPDATE_PLAYER': return '更新球员';
      case 'DELETE_PLAYER': return '删除球员';
      case 'CREATE_BACKUP': return '创建备份';
      case 'RESTORE_BACKUP': return '还原数据库';
      default: return action;
    }
  };

  return (
    <div className="team-info-page">
      <header className="page-header">
        <div className="header-content">
          <h1>
            <ShieldAlert className="trophy-icon" />
            系统操作审计日志
          </h1>
          <p>记录管理员在后台录入比分、添加球队及管理数据的完整轨迹，确保数据透明安全</p>
        </div>
      </header>

      <main className="page-content">
        {error && (
          <div className="error-message">
            <span>{error}</span>
          </div>
        )}

        <div className="form-section">
          <div className="section-header" style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="form-title" style={{ margin: 0 }}>
              <span className="icon">📝</span>
              系统操作日志表 ({total}条记录)
            </h2>
            <button onClick={loadLogs} className="add-btn refresh-btn" disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', height: 'auto' }}>
              <RefreshCw size={14} className={isLoading ? 'spinning' : ''} />
              刷新日志
            </button>
          </div>

          {isLoading ? (
            <div className="loading-state" style={{ padding: '40px 0', textAlign: 'center', color: '#666' }}>加载中...</div>
          ) : logs.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0', textAlign: 'center', color: '#666' }}>
              <Activity size={48} style={{ marginBottom: '10px', color: '#ccc' }} />
              <p>暂无任何操作日志记录</p>
            </div>
          ) : (
            <>
              <div className="player-table-wrapper">
                <table className="player-table">
                  <thead>
                    <tr>
                      <th style={{ width: '180px' }}>操作时间</th>
                      <th style={{ width: '120px' }}>操作人员</th>
                      <th style={{ width: '140px' }}>操作类型</th>
                      <th>具体行为描述</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td style={{ color: '#666', fontSize: '13px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Calendar size={12} />
                            {formatDate(log.createdAt)}
                          </span>
                        </td>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 500 }}>
                            <User size={12} />
                            {log.username}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getActionTagClass(log.action)}`}>
                            {getActionLabel(log.action)}
                          </span>
                        </td>
                        <td style={{ fontSize: '14px', lineHeight: '1.4', color: '#333' }}>
                          {log.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 分页控制 */}
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#666' }}>
                  第 {page} 页 / 共 {totalPages} 页
                </span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="add-btn small btn-secondary"
                    style={{ padding: '6px 12px', height: 'auto', display: 'flex', alignItems: 'center', gap: '2px' }}
                  >
                    <ChevronLeft size={14} />
                    上一页
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="add-btn small btn-secondary"
                    style={{ padding: '6px 12px', height: 'auto', display: 'flex', alignItems: 'center', gap: '2px' }}
                  >
                    下一页
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AuditLogPage;
