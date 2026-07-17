import React, { useState } from 'react';
import { Plus, Trash2, User } from 'lucide-react';
import { Player, PlayerFormData } from '../types';
import { validateImageFile } from '../utils/imageUpload';

interface PlayerListProps {
  players: Player[];
  onAddPlayer: (player: Omit<Player, 'id'>) => void;
  onRemovePlayer: (id: string) => void;
  onUpdatePlayer: (id: string, updates: Partial<Player>) => void;
}

const PlayerList: React.FC<PlayerListProps> = ({
  players,
  onAddPlayer,
  onRemovePlayer,
  onUpdatePlayer,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newPlayer, setNewPlayer] = useState<PlayerFormData>({
    name: '',
    studentId: '',
    jerseyNumber: '',
    photo: null,
    teamId: '',
  });
  const [preview, setPreview] = useState<string | null>(null);

  const isValidPhoto = (file: File): boolean => {
    try {
      validateImageFile(file, '球员照片');
      return true;
    } catch (error) {
      alert(error instanceof Error ? error.message : '照片校验失败');
      return false;
    }
  };

  const handleFileChange = (file: File | null) => {
    if (file) {
      if (!isValidPhoto(file)) return;
      setPreview(URL.createObjectURL(file));
      setNewPlayer((prev) => ({ ...prev, photo: file }));
    } else {
      setPreview(null);
      setNewPlayer((prev) => ({ ...prev, photo: null }));
    }
  };

  const handleAddPlayer = () => {
    if (newPlayer.name.trim() && newPlayer.studentId.trim() && newPlayer.jerseyNumber !== '') {
      onAddPlayer({
        name: newPlayer.name.trim(),
        studentId: newPlayer.studentId.trim(),
        jerseyNumber: newPlayer.jerseyNumber,
        photo: preview,
        photoFile: newPlayer.photo instanceof File ? newPlayer.photo : null,
        teamId: '',
      });
      setNewPlayer({ name: '', studentId: '', jerseyNumber: '', photo: null, teamId: '' });
      setPreview(null);
      setIsAdding(false);
    }
  };

  const handleFieldChange = (field: keyof PlayerFormData, value: string) => {
    setNewPlayer((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlayerPhotoChange = (playerId: string, file: File | null) => {
    if (file) {
      if (!isValidPhoto(file)) return;
      onUpdatePlayer(playerId, {
        photo: URL.createObjectURL(file),
        photoFile: file,
      });
    }
  };

  return (
    <div className="player-list">
      <div className="section-header">
        <h2 className="form-title">
          <span className="icon">👥</span> 参赛队员 ({players.length})
        </h2>
        <button onClick={() => setIsAdding(!isAdding)} className="add-btn">
          <Plus size={20} />
          添加球员
        </button>
      </div>

      {isAdding && (
        <div className="add-player-form">
          <h3>添加新球员</h3>
          <div className="form-row">
            <div className="form-group">
              <label>姓名 *</label>
              <input
                type="text"
                value={newPlayer.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="请输入球员姓名"
              />
            </div>
            <div className="form-group">
              <label>学号 *</label>
              <input
                type="text"
                value={newPlayer.studentId}
                onChange={(e) => handleFieldChange('studentId', e.target.value)}
                placeholder="请输入学号"
              />
            </div>
            <div className="form-group">
              <label>球衣号码 *</label>
              <input
                type="number"
                value={newPlayer.jerseyNumber}
                onChange={(e) => handleFieldChange('jerseyNumber', e.target.value)}
                placeholder="请输入球衣号码"
              />
            </div>
            <div className="form-group image-group">
              <label>照片</label>
              <div className="upload-area small">
                {preview ? (
                  <img src={preview} alt="球员照片" className="preview-image" />
                ) : (
                  <div className="upload-placeholder">
                    <User size={24} />
                    <span>上传照片</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  className="file-input"
                />
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button onClick={handleAddPlayer} className="submit-btn">
              确认添加
            </button>
            <button onClick={() => setIsAdding(false)} className="cancel-btn">
              取消
            </button>
          </div>
        </div>
      )}

      {players.length === 0 ? (
        <div className="empty-state">
          <User size={48} />
          <p>暂无球员，请添加球员或通过Excel导入</p>
        </div>
      ) : (
        <div className="player-table-wrapper">
          <table className="player-table">
            <thead>
              <tr>
                <th style={{ width: '80px', minWidth: '80px' }}>照片</th>
                <th style={{ width: '120px', minWidth: '120px' }}>姓名</th>
                <th style={{ width: '160px', minWidth: '160px' }}>学号</th>
                <th style={{ width: '100px', minWidth: '100px' }}>球衣号码</th>
                <th style={{ width: '80px', minWidth: '80px', textAlign: 'center' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.id}>
                  <td>
                    <div className="player-photo-upload">
                      {player.photo ? (
                        <img
                          src={player.photo}
                          alt={player.name}
                          className="player-photo"
                        />
                      ) : (
                        <div className="no-photo">
                          <User size={24} />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePlayerPhotoChange(player.id, e.target.files?.[0] || null)}
                        className="file-input"
                        title="点击上传照片"
                      />
                    </div>
                  </td>
                  <td>{player.name}</td>
                  <td>{player.studentId}</td>
                  <td>{player.jerseyNumber}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => onRemovePlayer(player.id)}
                      className="delete-btn"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PlayerList;
