import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, ChevronLeft, ChevronRight, Calendar, User, Activity } from 'lucide-react';
import { auditLogApi } from '../../api/service';
import { AuditLogDTO } from '../../api/types';

const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filterUsername, setFilterUsername] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadLogs();
  }, [page, filterUsername, filterAction]);

  const loadLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await auditLogApi.getAll(page, limit, filterUsername, filterAction);
      setLogs(response.data || []);
      setTotal(response.total || 0);
    } catch (err) {
      console.error('加载审计日志失败:', err);
      setError(err instanceof Error ? err.message : '无法连接服务器，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '暂无时间';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '无效时间';
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    } catch {
      return '时间格式错误';
    }
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
      case 'CREATE_TEAM': return '创建球队';
      case 'UPDATE_TEAM': return '更新球队';
      case 'DELETE_TEAM': return '删除球队';
      case 'USER_REGISTER': return '用户注册';
      case 'UPDATE_USER_ROLE': return '权限管理';
      case 'DELETE_USER': return '删除账号';
      case 'RESET_USER_PASSWORD': return '重置密码';
      case 'CREATE_BACKUP': return '创建备份';
      case 'RESTORE_BACKUP': return '还原数据库';
      case 'ARCHIVE_SEASON': return '归档赛季';
      case 'USER_LOGIN': return '用户登录';
      default: return action;
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedLogs(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const renderDetails = (log: AuditLogDTO) => {
    const details = log.details || '';
    const isExpanded = !!expandedLogs[log.id];

    if (log.subLogs && log.subLogs.length > 0) {
      const allAttrs: string[] = [];
      log.subLogs.forEach(sub => {
        const subDetails = sub.details || '';
        const subSplit = subDetails.indexOf(' 的信息: ');
        const subSplit2 = subDetails.indexOf(' 的权限设置: ');
        const subSplit3 = subDetails.indexOf(' 比分/信息: ');
        let diffText = '';
        if (subSplit !== -1) diffText = subDetails.substring(subSplit + 8);
        else if (subSplit2 !== -1) diffText = subDetails.substring(subSplit2 + 10);
        else if (subSplit3 !== -1) diffText = subDetails.substring(subSplit3 + 11);

        if (diffText) {
          diffText.split(', ').forEach(pair => {
            const attrName = pair.split(':')[0].trim();
            if (attrName && !allAttrs.includes(attrName)) {
              allAttrs.push(attrName);
            }
          });
        }
      });

      const attrsSuffix = allAttrs.length > 0 ? ` (修改了: ${allAttrs.join(', ')})` : '';

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div>
            <span style={{ fontWeight: 500, color: '#2d3748' }}>{details}{attrsSuffix}</span>
            <button
              onClick={() => toggleExpand(log.id)}
              className="text-btn"
              style={{
                background: 'none',
                border: 'none',
                color: '#3182ce',
                cursor: 'pointer',
                padding: '0 6px',
                fontSize: '12px',
                fontWeight: 500,
                textDecoration: 'underline'
              }}
            >
              {isExpanded ? '收起明细 ▴' : '展开合并的全部明细 ▾'}
            </button>
          </div>
          {isExpanded && (
            <div style={{ marginTop: '4px', padding: '8px 12px', background: '#f7fafc', borderRadius: '6px', borderLeft: '3px solid #3182ce', fontSize: '13px', color: '#4a5568', lineHeight: '1.5' }}>
              {log.subLogs.map((sub, idx) => {
                const subDetails = sub.details || '';
                const subSplit = subDetails.indexOf(' 的信息: ');
                const subSplit2 = subDetails.indexOf(' 的权限设置: ');
                const subSplit3 = subDetails.indexOf(' 比分/信息: ');

                let mainText = subDetails;
                let diffText = '';

                if (subSplit !== -1) {
                  mainText = subDetails.substring(0, subSplit + 5);
                  diffText = subDetails.substring(subSplit + 8);
                } else if (subSplit2 !== -1) {
                  mainText = subDetails.substring(0, subSplit2 + 7);
                  diffText = subDetails.substring(subSplit2 + 10);
                } else if (subSplit3 !== -1) {
                  mainText = subDetails.substring(0, subSplit3 + 8);
                  diffText = subDetails.substring(subSplit3 + 11);
                }

                return (
                  <div key={sub.id || idx} style={{ borderBottom: idx < (log.subLogs?.length || 0) - 1 ? '1px dashed #e2e8f0' : 'none', padding: '6px 0' }}>
                    <div style={{ fontSize: '11px', color: '#a0aec0', marginBottom: '2px' }}>
                      ⏱️ {new Date(sub.createdAt).toLocaleTimeString()}
                    </div>
                    <div>
                      <span style={{ fontWeight: 500 }}>{mainText}</span>
                      {diffText && (
                        <span style={{ color: '#718096', fontSize: '12px', marginLeft: '5px' }}>
                          ({diffText})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    const splitIndex = details.indexOf(' 的信息: ');
    const splitIndex2 = details.indexOf(' 的权限设置: ');
    const splitIndex3 = details.indexOf(' 比分/信息: ');
    
    let summary = details;
    let diff = '';
    
    if (splitIndex !== -1) {
      summary = details.substring(0, splitIndex + 5);
      diff = details.substring(splitIndex + 8);
    } else if (splitIndex2 !== -1) {
      summary = details.substring(0, splitIndex2 + 7);
      diff = details.substring(splitIndex2 + 10);
    } else if (splitIndex3 !== -1) {
      summary = details.substring(0, splitIndex3 + 8);
      diff = details.substring(splitIndex3 + 11);
    }
    
    if (!diff) {
      return <span>{details}</span>;
    }
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontWeight: 500, color: '#2d3748' }}>{summary}</span>
        <div style={{ fontSize: '12px', color: '#718096', paddingLeft: '8px', borderLeft: '2px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {diff.split(', ').map((item, idx) => (
            <span key={idx} style={{ display: 'inline-block' }}>
              🔹 {item}
            </span>
          ))}
        </div>
      </div>
    );
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
          <div className="section-header" style={{ marginBottom: '15px', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="form-title" style={{ margin: 0 }}>
              <span className="icon">📝</span>
              系统操作日志表 ({total}条记录)
            </h2>
            <button onClick={() => loadLogs()} className="add-btn refresh-btn" disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', height: 'auto', margin: 0 }}>
              <RefreshCw size={14} className={isLoading ? 'spinning' : ''} />
              刷新日志
            </button>
          </div>

          {/* 筛选过滤工具条 */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', background: '#f8f9fa', padding: '12px 16px', borderRadius: '6px', marginBottom: '16px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: '#4a5568', fontWeight: 600 }}>操作人:</span>
              <input
                type="text"
                placeholder="输入用户名搜索..."
                value={filterUsername}
                onChange={(e) => { setFilterUsername(e.target.value); setPage(1); }}
                className="form-input inline"
                style={{ width: '150px', padding: '5px 10px', height: '32px', margin: 0, fontSize: '13px' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: '#4a5568', fontWeight: 600 }}>操作类型:</span>
              <select
                value={filterAction}
                onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
                className="form-select inline"
                style={{ width: '185px', padding: '5px 10px', height: '32px', margin: 0, fontSize: '13px' }}
              >
                <option value="all">🔍 全部操作类型</option>
                <option value="MATCH_ACTIONS">⚽ 比赛管理 (比分/录入)</option>
                <option value="PLAYER_ACTIONS">🏃‍♂️ 球员管理</option>
                <option value="TEAM_ACTIONS">👚 球队管理</option>
                <option value="USER_ACTIONS">👥 用户权限与账号</option>
                <option value="BACKUP_ACTIONS">💾 备份还原</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="loading-state" style={{ padding: '40px 0', textAlign: 'center', color: '#666' }}>加载中...</div>
          ) : logs.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0', textAlign: 'center', color: '#666' }}>
              <Activity size={48} style={{ marginBottom: '10px', color: '#ccc' }} />
              <p>暂无符合筛选条件的日志记录</p>
            </div>
          ) : (
            <>
              {/* 桌面端表格 */}
              <div className="player-table-wrapper desktop-audit-view">
                <table className="player-table audit-logs-table">
                  <thead>
                    <tr>
                      <th style={{ width: '160px', whiteSpace: 'nowrap' }}>操作时间</th>
                      <th style={{ width: '110px', whiteSpace: 'nowrap' }}>操作人员</th>
                      <th style={{ width: '110px', whiteSpace: 'nowrap' }}>操作类型</th>
                      <th>具体行为描述</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td style={{ color: '#666', fontSize: '13px', whiteSpace: 'nowrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Calendar size={12} />
                            {formatDate(log.createdAt)}
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 500 }}>
                            <User size={12} />
                            {log.username}
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span className={`badge ${getActionTagClass(log.action)}`} style={{ whiteSpace: 'nowrap', display: 'inline-block' }}>
                            {getActionLabel(log.action)}
                          </span>
                        </td>
                        <td style={{ fontSize: '14px', lineHeight: '1.4', color: '#333' }}>
                          {renderDetails(log)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 移动端卡片列表 */}
              <div className="mobile-audit-view">
                {logs.map((log) => (
                  <div key={log.id} className="mobile-audit-card">
                    <div className="mobile-audit-card-header">
                      <div className="mobile-audit-user-tag">
                        <User size={12} />
                        <span>{log.username}</span>
                      </div>
                      <span className={`badge ${getActionTagClass(log.action)}`} style={{ whiteSpace: 'nowrap' }}>
                        {getActionLabel(log.action)}
                      </span>
                    </div>
                    <div className="mobile-audit-time">
                      <Calendar size={12} />
                      <span>{formatDate(log.createdAt)}</span>
                    </div>
                    <div className="mobile-audit-body">
                      {renderDetails(log)}
                    </div>
                  </div>
                ))}
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

      <style>{`
        .desktop-audit-view {
          display: block;
        }
        .mobile-audit-view {
          display: none;
        }
        .audit-logs-table td {
          vertical-align: top;
          padding: 12px 14px;
        }
        .audit-logs-table .badge {
          white-space: nowrap !important;
          display: inline-block;
        }
        @media (max-width: 768px) {
          .desktop-audit-view {
            display: none;
          }
          .mobile-audit-view {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .mobile-audit-card {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.03);
          }
          .mobile-audit-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
          }
          .mobile-audit-user-tag {
            display: flex;
            align-items: center;
            gap: 4px;
            font-weight: 600;
            font-size: 13px;
            color: #2d3748;
          }
          .mobile-audit-time {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            color: #718096;
            margin-bottom: 8px;
          }
          .mobile-audit-body {
            font-size: 13px;
            color: #2d3748;
            background: #f7fafc;
            padding: 8px 10px;
            border-radius: 6px;
          }
        }
      `}</style>
    </div>
  );
};

export default AuditLogPage;
