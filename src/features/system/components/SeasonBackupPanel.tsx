import React, { useState } from 'react';
import { Plus, RefreshCw, Database, Download, RotateCcw, AlertTriangle, Pencil, Trash2, Check, X } from 'lucide-react';
import { BackupDTO } from '../../../api/types';

interface SeasonBackupPanelProps {
  seasons: any[];
  activeSeason: any;
  backups: BackupDTO[];
  newSeasonName: string;
  newSeasonType: string;
  isArchivingSeason: boolean;
  isLoading: boolean;
  isBackingUp: boolean;
  isRestoring: string | null;
  isUpdatingStatusId: string | null;
  isRenamingSeasonId: string | null;
  isDeletingSeasonId: string | null;
  onNewSeasonNameChange: (val: string) => void;
  onNewSeasonTypeChange: (val: string) => void;
  onCreateSeason: (e: React.FormEvent) => void;
  onUpdateSeasonStatus: (id: string, currentStatus: string) => void;
  onRenameSeason: (id: string, currentName: string, newName: string) => Promise<void>;
  onDeleteSeason: (id: string, name: string) => void;
  onCreateBackup: () => void;
  onRestoreBackup: (key: string) => void;
  onLoadBackups: () => void;
}

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

export const SeasonBackupPanel: React.FC<SeasonBackupPanelProps> = ({
  seasons,
  backups,
  newSeasonName,
  newSeasonType,
  isArchivingSeason,
  isLoading,
  isBackingUp,
  isRestoring,
  isUpdatingStatusId,
  isRenamingSeasonId,
  isDeletingSeasonId,
  onNewSeasonNameChange,
  onNewSeasonTypeChange,
  onCreateSeason,
  onUpdateSeasonStatus,
  onRenameSeason,
  onDeleteSeason,
  onCreateBackup,
  onRestoreBackup,
  onLoadBackups,
}) => {
  const [editingSeasonId, setEditingSeasonId] = useState<string | null>(null);
  const [editingSeasonName, setEditingSeasonName] = useState('');
  const [pendingDeleteSeasonId, setPendingDeleteSeasonId] = useState<string | null>(null);

  const startRenaming = (id: string, name: string) => {
    setEditingSeasonId(id);
    setEditingSeasonName(name);
  };

  const cancelRenaming = () => {
    setEditingSeasonId(null);
    setEditingSeasonName('');
  };

  const saveSeasonName = async (id: string, currentName: string) => {
    const newName = editingSeasonName.trim();
    if (!newName || newName === currentName) {
      cancelRenaming();
      return;
    }
    await onRenameSeason(id, currentName, newName);
    cancelRenaming();
  };

  return (
    <>
      {/* 赛季重置与归档管理 */}
      <div className="form-section" style={{ marginBottom: '30px' }}>
        <div className="section-header" style={{ marginBottom: '20px' }}>
          <h2 className="form-title" style={{ margin: 0 }}>
            <span className="icon">⚡</span>
            创建新赛季
          </h2>
        </div>
        <div className="season-card">
          <form onSubmit={onCreateSeason} className="season-form">
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#495057', marginBottom: '8px' }}>
                新赛季名称：
              </label>
              <input
                type="text"
                placeholder="例如：2026秋季杯赛"
                value={newSeasonName}
                onChange={(e) => onNewSeasonNameChange(e.target.value)}
                disabled={isArchivingSeason}
                className="season-input-field"
              />
            </div>
            <div style={{ width: '220px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#495057', marginBottom: '8px' }}>
                赛制类型：
              </label>
              <select
                value={newSeasonType}
                onChange={(e) => onNewSeasonTypeChange(e.target.value)}
                disabled={isArchivingSeason}
                className="season-input-field"
              >
                <option value="LEAGUE">单循环联赛 (League)</option>
                <option value="CUP">杯赛 (Cup - 小组+淘汰赛)</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isArchivingSeason || !newSeasonName.trim()}
              className="save-btn"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', height: '40px', margin: 0 }}
            >
              {isArchivingSeason ? (
                <>
                  <RefreshCw size={18} className="spinning" />
                  正在创建中...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  创建新赛季
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="form-section" style={{ marginBottom: '30px' }}>
        <div className="section-header" style={{ marginBottom: '20px' }}>
          <h2 className="form-title" style={{ margin: 0 }}>
            <span className="icon">📅</span>
            赛季状态管理
          </h2>
        </div>
        <div className="season-card">
          <div className="season-table-wrapper">
            <table className="season-table">
              <thead>
                <tr>
                  <th>赛季名称</th>
                  <th>类型</th>
                  <th>状态</th>
                  <th style={{ textAlign: 'center', width: '300px' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {seasons.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: '500', color: '#333' }}>
                      {editingSeasonId === s.id ? (
                        <input
                          type="text"
                          value={editingSeasonName}
                          onChange={(event) => setEditingSeasonName(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') void saveSeasonName(s.id, s.name);
                            if (event.key === 'Escape') cancelRenaming();
                          }}
                          disabled={isRenamingSeasonId === s.id}
                          className="season-input-field"
                          style={{ minWidth: '180px' }}
                          autoFocus
                        />
                      ) : s.name}
                    </td>
                    <td style={{ color: '#666' }}>
                      {s.type === 'CUP' ? (
                        <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>🏆 杯赛</span>
                      ) : (
                        <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>⚽ 联赛</span>
                      )}
                    </td>
                    <td>
                      {s.status === 'active' ? (
                        <span style={{ background: '#e6fffa', color: '#00a389', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #b2f5ea' }}>活跃中</span>
                      ) : (
                        <span style={{ background: '#f7fafc', color: '#718096', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', border: '1px solid #e2e8f0' }}>已归档</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => onUpdateSeasonStatus(s.id, s.status)}
                        disabled={isUpdatingStatusId === s.id}
                        className="add-btn small"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 12px',
                          height: 'auto',
                          cursor: 'pointer',
                          background: s.status === 'active' ? '#fff0f0' : '#00a389',
                          color: s.status === 'active' ? '#d93838' : '#ffffff',
                          borderColor: s.status === 'active' ? '#ffd1d1' : '#00a389',
                          borderStyle: 'solid',
                          borderWidth: '1px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      >
                        {isUpdatingStatusId === s.id ? (
                          <>
                            <RefreshCw size={12} className="spinning" />
                            处理中...
                          </>
                        ) : s.status === 'active' ? (
                          <>归档赛季</>
                        ) : (
                          <>重新激活</>
                        )}
                      </button>
                      {editingSeasonId === s.id ? (
                        <>
                          <button
                            onClick={() => void saveSeasonName(s.id, s.name)}
                            disabled={isRenamingSeasonId === s.id || !editingSeasonName.trim()}
                            className="add-btn small"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 12px', height: 'auto', background: '#00a389', color: '#fff' }}
                          >
                            {isRenamingSeasonId === s.id ? <RefreshCw size={12} className="spinning" /> : <Check size={12} />}
                            保存
                          </button>
                          <button
                            onClick={cancelRenaming}
                            disabled={isRenamingSeasonId === s.id}
                            className="add-btn small"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 12px', height: 'auto' }}
                          >
                            <X size={12} />
                            取消
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => startRenaming(s.id, s.name)}
                          disabled={editingSeasonId !== null || isDeletingSeasonId === s.id}
                          className="add-btn small"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 12px', height: 'auto' }}
                        >
                          <Pencil size={12} />
                          修改名称
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (pendingDeleteSeasonId === s.id) {
                            onDeleteSeason(s.id, s.name);
                            setPendingDeleteSeasonId(null);
                          } else {
                            setPendingDeleteSeasonId(s.id);
                          }
                        }}
                        disabled={isDeletingSeasonId === s.id || isRenamingSeasonId === s.id}
                        className="add-btn small"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 12px', height: 'auto', background: '#d93838', color: '#fff', borderColor: '#d93838' }}
                      >
                        {isDeletingSeasonId === s.id ? <RefreshCw size={12} className="spinning" /> : <Trash2 size={12} />}
                        {pendingDeleteSeasonId === s.id ? '确认永久删除' : '删除赛季'}
                      </button>
                      {pendingDeleteSeasonId === s.id && (
                        <button
                          onClick={() => setPendingDeleteSeasonId(null)}
                          className="add-btn small"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 12px', height: 'auto' }}
                        >
                          <X size={12} />
                          取消删除
                        </button>
                      )}
                      </div>
                      {pendingDeleteSeasonId === s.id && (
                        <div style={{ marginTop: '8px', color: '#d93838', fontSize: '12px' }}>
                          将同时删除该赛季的比赛、阵容、进球、事件、名单和分组；球队、球员及其他赛季不受影响。
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {seasons.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#999' }}>暂无赛季数据</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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
            onClick={onCreateBackup}
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
          <button onClick={onLoadBackups} className="add-btn refresh-btn" disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', height: 'auto' }}>
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
                          onClick={() => onRestoreBackup(bk.key)}
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
            <li><strong>备份范围</strong>：备份 file 仅包含数据库内容，并不包含图片文件本身（图片将安全保留在 Cloudflare R2 云存储上，不被删除）。</li>
            <li><strong>还原警告</strong>：点击“覆盖还原”将清空本地或 Neon 线上当前的所有赛程比分、球队数据，并完全用备份文件里的老数据覆盖。进行此操作前，建议先创建一个最新的备份！</li>
          </ul>
        </div>
      </div>
    </>
  );
};
