import React, { useState } from 'react';
import { Plus, Trash2, User, Upload } from 'lucide-react';
import { Player, PlayerFormData } from '../types';
import { uploadApi } from '../api/service';

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

  const handleFileChange = async (file: File | null) => {
    if (file) {
      try {
        const response = await uploadApi.upload(file);
        if (response.data && response.data.url) {
          setPreview(response.data.url);
          setNewPlayer((prev) => ({ ...prev, photo: file }));
        }
      } catch (err) {
        alert('图片上传失败');
      }
    } else {
      setPreview(null);
      setNewPlayer((prev) => ({ ...prev, photo: null }));
    }
  };

  const handleAddPlayer = () => {
    if (newPlayer.name && newPlayer.studentId && newPlayer.jerseyNumber) {
      onAddPlayer({
        name: newPlayer.name,
        studentId: newPlayer.studentId,
        jerseyNumber: newPlayer.jerseyNumber,
        photo: preview,
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

  const handlePlayerPhotoUpload = async (playerId: string, file: File | null) => {
    if (file) {
      try {
        const response = await uploadApi.upload(file);
        if (response.data && response.data.url) {
          onUpdatePlayer(playerId, { photo: response.data.url });
        }
      } catch (err) {
        alert('图片上传失败');
      }
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
        <table className="player-table">
          <thead>
            <tr>
              <th>照片</th>
              <th>姓名</th>
              <th>学号</th>
              <th>球衣号码</th>
              <th>操作</th>
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
                      onChange={(e) => handlePlayerPhotoUpload(player.id, e.target.files?.[0] || null)}
                      className="file-input"
                      title="点击上传照片"
                    />
                  </div>
                </td>
                <td>{player.name}</td>
                <td>{player.studentId}</td>
                <td>{player.jerseyNumber}</td>
                <td>
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
      )}
    </div>
  );
};

export default PlayerList;
