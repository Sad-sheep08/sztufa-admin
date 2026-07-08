import React, { useState, useEffect } from 'react';
import { Database, Download, RotateCcw, AlertTriangle, FileCheck, RefreshCw } from 'lucide-react';
import { backupApi } from '../api/service';
import { BackupDTO } from '../api/types';

const SystemSettingsPage: React.FC = () => {
  const [backups, setBackups] = useState<BackupDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await backupApi.list();
      if (response.success) {
        setBackups(response.data || []);
      }
    } catch (err) {
      console.error('加载备份列表失败:', err);
      setError('无法获取云端备份列表，请检查网络或 R2 连接');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await backupApi.create();
      if (response.success) {
        setSuccessMessage('数据库成功备份并上传至 Cloudflare R2！');
        loadBackups();
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err) {
      console.error('创建备份失败:', err);
      setError('创建备份失败，请检查 R2 存储桶配置');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async (key: string) => {
    if (!confirm('【警告】还原数据库将会删除并完全覆盖当前数据库中的所有球队、球员、赛程、进球和事件记录！此操作不可逆！\n\n确定要还原到选中的备份吗？')) {
      return;
    }

    setIsRestoring(key);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await backupApi.restore(key);
      if (response.success) {
        setSuccessMessage('数据库已成功恢复至指定备份状态！');
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (err) {
      console.error('还原备份失败:', err);
      setError('还原失败，备份文件可能损坏或网络连接中断');
    } finally {
      setIsRestoring(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="team-info-page">
      <header className="page-header">
        <div className="header-content">
          <h1>
            <Database className="trophy-icon" />
            系统安全与数据备份
          </h1>
          <p>将全站数据打包为结构化 JSON，手动或每日自动同步上传到高可用 Cloudflare R2 存储桶中</p>
        </div>
      </header>

      <main className="page-content">
        {error && (
          <div className="error-message">
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="save-success" style={{ display: 'flex', marginBottom: '20px' }}>
            <FileCheck size={20} />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="form-section">
          <div className="section-header" style={{ marginBottom: '20px' }}>
            <h2 className="form-title" style={{ margin: 0 }}>
              <span className="icon">💾</span>
              立即触发系统备份
            </h2>
          </div>
          <div style={{ background: '#fcfcfc', border: '1px solid #eee', padding: '20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ maxWidth: '70%' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#333' }}>手动执行全站备份</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#666', lineHeight: '1.4' }}>
                点击后系统将立即导出当前的所有数据表（包含球队、球员、战绩及系统日志），对其进行压缩，然后生成 `.json` 文件并安全推送到 R2 云端。
              </p>
            </div>
            <button
              onClick={handleCreateBackup}
              disabled={isBackingUp || isRestoring !== null}
              className="save-btn"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', height: 'auto', margin: 0 }}
            >
              {isBackingUp ? (
                <>
                  <RefreshCw size={18} className="spinning" />
                  正在备份中...
                </>
              ) : (
                <>
                  <Database size={18} />
                  立即执行备份
                </>
              )}
            </button>
          </div>
        </div>

        <div className="form-section" style={{ marginTop: '30px' }}>
          <div className="section-header" style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="form-title" style={{ margin: 0 }}>
              <span className="icon">☁️</span>
              R2 云端历史备份记录 ({backups.length}个备份)
            </h2>
            <button onClick={loadBackups} className="add-btn refresh-btn" disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', height: 'auto' }}>
              <RefreshCw size={14} className={isLoading ? 'spinning' : ''} />
              刷新列表
            </button>
          </div>

          {isLoading ? (
            <div className="loading-state" style={{ padding: '40px 0', textAlign: 'center', color: '#666' }}>加载列表中...</div>
          ) : backups.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0', textAlign: 'center', color: '#666' }}>
              <Database size={48} style={{ marginBottom: '10px', color: '#ccc' }} />
              <p>暂无任何云端备份记录，请点击上方按钮创建首个备份</p>
            </div>
          ) : (
            <div className="player-table-wrapper">
              <table className="player-table">
                <thead>
                  <tr>
                    <th>备份文件名</th>
                    <th>文件大小</th>
                    <th>创建时间</th>
                    <th style={{ width: '220px', textAlign: 'center' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((bk) => (
                    <tr key={bk.key}>
                      <td style={{ fontWeight: 500, color: '#333' }}>{bk.filename}</td>
                      <td style={{ color: '#666' }}>{formatSize(bk.size)}</td>
                      <td style={{ color: '#666' }}>{formatDate(bk.lastModified)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <a
                            href={bk.downloadUrl}
                            download
                            className="add-btn small btn-secondary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', padding: '5px 10px', height: 'auto' }}
                          >
                            <Download size={12} />
                            下载
                          </a>
                          <button
                            onClick={() => handleRestore(bk.key)}
                            disabled={isRestoring !== null || isBackingUp}
                            className="add-btn small refresh-btn"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', height: 'auto', background: '#ffebeb', color: '#d93838', borderColor: '#ffd1d1' }}
                          >
                            {isRestoring === bk.key ? (
                              <>
                                <RefreshCw size={12} className="spinning" />
                                还原中...
                              </>
                            ) : (
                              <>
                                <RotateCcw size={12} />
                                覆盖还原
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="form-section alert-section" style={{ marginTop: '30px', border: '1px solid #ffe3b3', background: '#fffcf5', padding: '20px', borderRadius: '8px', display: 'flex', gap: '15px' }}>
          <AlertTriangle size={36} style={{ color: '#e69500', flexShrink: 0 }} />
          <div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#b37400' }}>安全操作守则</h3>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#665c40', lineHeight: '1.5' }}>
              <li><strong>备份范围</strong>：备份文件仅包含数据库内容，并不包含图片文件本身（图片将安全保留在 Cloudflare R2 云存储上，不被删除）。</li>
              <li><strong>还原警告</strong>：点击“覆盖还原”将清空本地或 Neon 线上当前的所有赛程比分、球队数据，并完全用备份文件里的老数据覆盖。进行此操作前，建议先创建一个最新的备份！</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SystemSettingsPage;
