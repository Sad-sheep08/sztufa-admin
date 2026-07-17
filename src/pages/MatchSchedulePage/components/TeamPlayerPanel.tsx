import React from 'react';
import { Trash2, Plus, Users, Download } from 'lucide-react';
import ExcelImporter from '../../../components/ExcelImporter';
import { Team, Player } from '../../../types';
import { uploadApi } from '../../../api/service';

interface TeamPlayerPanelProps {
  selectedTeam: Team;
  isEditing: boolean;
  editData: Team | null;
  showImporter: boolean;
  onToggleImporter: () => void;
  onAddPlayerRow: () => void;
  onDeletePlayerRow: (index: number) => void;
  onPlayerFieldChange: (index: number, field: keyof Player, value: any) => void;
  onExcelImport: (players: Omit<Player, 'id'>[]) => void;
  onExportPlayers: () => void;
}

export const TeamPlayerPanel: React.FC<TeamPlayerPanelProps> = ({
  selectedTeam, isEditing, editData,
  showImporter, onToggleImporter,
  onAddPlayerRow, onDeletePlayerRow, onPlayerFieldChange,
  onExcelImport, onExportPlayers,
}) => {
  const players = isEditing ? (editData?.players || []) : (selectedTeam.players || []);
  const count = players.length;

  if (!isEditing && count === 0) return null;

  return (
    <div className="form-section">
      <div className="section-header" style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="form-title" style={{ margin: 0 }}>
          <span className="icon">👥</span>
          球员名单 ({count}人)
        </h2>
        {!isEditing && (
          <button onClick={onExportPlayers} className="add-btn small refresh-btn" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', height: 'auto' }}>
            <Download size={14} />
            导出名单
          </button>
        )}
      </div>

      <div className="player-table-wrapper">
        <table className="player-table">
          <thead>
            <tr>
              <th style={{ width: '120px', minWidth: '120px' }}>姓名</th>
              <th style={{ width: '120px', minWidth: '120px' }}>照片</th>
              <th style={{ width: '160px', minWidth: '160px' }}>学号</th>
              <th style={{ width: '100px', minWidth: '100px' }}>球衣号码</th>
              <th style={{ width: '90px', minWidth: '90px' }}>黄牌数</th>
              <th style={{ width: '90px', minWidth: '90px' }}>红牌数</th>
              <th style={{ width: '120px', minWidth: '120px' }}>可用状态</th>
              {isEditing && <th style={{ width: '60px', minWidth: '60px' }}>操作</th>}
            </tr>
          </thead>
          <tbody>
            {isEditing ? (
              (editData?.players || []).map((player, index) => (
                <tr key={player.id || index} style={player.status === 'suspended' ? { background: '#fff5f5' } : undefined}>
                  <td>
                    <input type="text" value={player.name} onChange={(e) => onPlayerFieldChange(index, 'name', e.target.value)} className="form-input" placeholder="姓名" style={{ margin: 0, padding: '4px 8px', fontSize: '14px', height: '32px', width: '100%', boxSizing: 'border-box' }} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {player.photo ? (
                        <img src={player.photo} alt="头像" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#666' }}>无</div>
                      )}
                      <label style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 6px', background: '#e9ecef', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', border: '1px solid #ced4da' }}>
                        上传
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const res = await uploadApi.upload(file);
                                if (res.data?.url) onPlayerFieldChange(index, 'photo', res.data.url);
                                else alert('上传失败');
                              } catch (err: any) {
                                alert('上传出错: ' + (err?.message || String(err)));
                              }
                            }
                          }}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                  </td>
                  <td>
                    <input type="text" value={player.studentId} onChange={(e) => onPlayerFieldChange(index, 'studentId', e.target.value)} className="form-input" placeholder="学号" style={{ margin: 0, padding: '4px 8px', fontSize: '14px', height: '32px', width: '100%', boxSizing: 'border-box' }} />
                  </td>
                  <td>
                    <input type="text" value={player.jerseyNumber} onChange={(e) => onPlayerFieldChange(index, 'jerseyNumber', e.target.value)} className="form-input" placeholder="号码" style={{ margin: 0, padding: '4px 8px', fontSize: '14px', height: '32px', width: '100%', boxSizing: 'border-box' }} />
                  </td>
                  <td>
                    <input type="number" min="0" value={player.yellowCards || 0} onChange={(e) => onPlayerFieldChange(index, 'yellowCards', parseInt(e.target.value) || 0)} className="form-input" style={{ margin: 0, padding: '4px 8px', fontSize: '14px', height: '32px', width: '100%', boxSizing: 'border-box' }} />
                  </td>
                  <td>
                    <input type="number" min="0" value={player.redCards || 0} onChange={(e) => onPlayerFieldChange(index, 'redCards', parseInt(e.target.value) || 0)} className="form-input" style={{ margin: 0, padding: '4px 8px', fontSize: '14px', height: '32px', width: '100%', boxSizing: 'border-box' }} />
                  </td>
                  <td>
                    <select value={player.status || 'active'} onChange={(e) => onPlayerFieldChange(index, 'status', e.target.value)} className="form-input" style={{ margin: 0, padding: '4px 8px', fontSize: '14px', height: '32px', width: '100%', boxSizing: 'border-box' }}>
                      <option value="active">🟢 可用</option>
                      <option value="suspended">🔴 停赛</option>
                    </select>
                  </td>
                  <td>
                    <button onClick={() => onDeletePlayerRow(index)} className="delete-btn small" title="删除" style={{ padding: '6px 10px', height: '32px' }}>
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              (selectedTeam.players || []).map((player) => (
                <tr key={player.id} style={player.status === 'suspended' ? { background: '#fff5f5' } : undefined}>
                  <td style={{ fontWeight: player.status === 'suspended' ? 600 : undefined }}>
                    {player.name}
                    {player.status === 'suspended' && (
                      <span style={{ marginLeft: '8px', color: '#fa5252', fontSize: '11px', fontWeight: 'normal', background: '#ffe3e3', padding: '2px 6px', borderRadius: '4px' }}>
                        🛑 停赛
                      </span>
                    )}
                  </td>
                  <td>
                    {player.photo ? (
                      <img src={player.photo} alt="头像" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#666' }}>无</div>
                    )}
                  </td>
                  <td>{player.studentId}</td>
                  <td>{player.jerseyNumber}</td>
                  <td>🟨 {player.yellowCards || 0}</td>
                  <td>🟥 {player.redCards || 0}</td>
                  <td>{player.status === 'suspended' ? <span style={{ color: '#fa5252', fontWeight: 600 }}>停赛中</span> : <span style={{ color: '#2b8a3e' }}>可用</span>}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isEditing && (
        <>
          <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
            <button onClick={onAddPlayerRow} className="add-btn small" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', height: 'auto' }}>
              <Plus size={14} />
              添加单个球员
            </button>
            <button onClick={onToggleImporter} className="add-btn small refresh-btn" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', height: 'auto' }}>
              <Users size={14} />
              {showImporter ? '隐藏批量导入' : 'Excel 批量追加'}
            </button>
          </div>

          {showImporter && (
            <div style={{ marginTop: '20px', padding: '20px', border: '1px dashed #ddd', borderRadius: '8px', background: '#fcfcfc' }}>
              <ExcelImporter onImport={onExcelImport} />
            </div>
          )}
        </>
      )}
    </div>
  );
};
