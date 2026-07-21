import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Team } from '../../../types';
import { uploadImageFile } from '../../../utils/imageUpload';

interface TeamDetailPanelProps {
  selectedTeam: Team;
  isEditing: boolean;
  isSaved: boolean;
  isLoading: boolean;
  editData: Team | null;
  activeSeasonName: string;
  allMatches: any[];
  userRole?: string;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onFieldChange: (field: keyof Team, value: string) => void;
}

const getTeamStats = (teamId: string, allMatches: any[]) => {
  const teamMatches = allMatches
    .filter(m => (m.homeTeamId === teamId || m.awayTeamId === teamId) && m.status === 'finished')
    .sort((a, b) => new Date(a.matchDate || '').getTime() - new Date(b.matchDate || '').getTime());

  let cleanSheets = 0;
  teamMatches.forEach(m => {
    if (m.homeTeamId === teamId && m.awayScore === 0) cleanSheets++;
    else if (m.awayTeamId === teamId && m.homeScore === 0) cleanSheets++;
  });

  const recentMatches = teamMatches.slice(-5);
  const form = recentMatches.map(m => {
    const isHome = m.homeTeamId === teamId;
    const teamScore = isHome ? m.homeScore : m.awayScore;
    const opponentScore = isHome ? m.awayScore : m.homeScore;
    if (teamScore > opponentScore) return 'W';
    if (teamScore === opponentScore) return 'D';
    return 'L';
  });

  return { cleanSheets, form };
};

const ImageUploadField: React.FC<{
  label: string;
  value: string | null | undefined;
  isEditing: boolean;
  onUpload: (url: string) => void;
  alt: string;
}> = ({ label, value, isEditing, onUpload, alt }) => (
  <div className="form-group" style={{ flex: 1 }}>
    <label>{label}</label>
    {isEditing ? (
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '5px' }}>
        {value ? (
          <img src={value} alt={alt} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'contain', border: '1px solid #e9ecef', padding: '4px', background: '#fff' }} />
        ) : (
          <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: '#f1f3f5', border: '1px dashed #ced4da', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#868e96' }}>无</div>
        )}
        <label className="add-btn small" style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 12px', background: '#3b5bdb', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', border: 'none', fontWeight: 500 }}>
          上传{label}
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                try {
                  onUpload(await uploadImageFile(file, label));
                } catch (err: any) {
                  alert(err?.message || String(err));
                }
              }
            }}
            style={{ display: 'none' }}
          />
        </label>
      </div>
    ) : (
      <div style={{ marginTop: '5px' }}>
        {value ? (
          <img src={value} alt={alt} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'contain', border: '1px solid #e9ecef', padding: '4px', background: '#fff' }} />
        ) : (
          <div className="form-value">未上传{label}</div>
        )}
      </div>
    )}
  </div>
);

export const TeamDetailPanel: React.FC<TeamDetailPanelProps> = ({
  selectedTeam, isEditing, isSaved, isLoading,
  editData, activeSeasonName, allMatches, userRole,
  onSaveEdit, onCancelEdit, onFieldChange,
}) => {
  const stats = getTeamStats(selectedTeam.id, allMatches);

  const renderField = (label: string, field: keyof Team, viewValue?: string) => (
    <div className="form-group">
      <label>{label}</label>
      {isEditing ? (
        <input
          type="text"
          value={(editData?.[field] as string) || ''}
          onChange={(e) => onFieldChange(field, e.target.value)}
          className="form-input"
          disabled={field === 'teamName' && userRole !== 'super_admin'}
          title={field === 'teamName' && userRole !== 'super_admin' ? '仅超级管理员可修改球队名称' : ''}
        />
      ) : (
        <div className="form-value">{viewValue ?? (selectedTeam[field] as string)}</div>
      )}
    </div>
  );

  return (
    <div className="form-section">
      <div className="section-header">
        <h2 className="form-title">
          <span className="icon">📋</span>
          {isEditing ? '编辑球队信息' : `${selectedTeam.teamName} - 详细信息`}
        </h2>
        {isEditing && (
          <div className="form-actions">
            {isSaved && (
              <div className="save-success inline">
                <CheckCircle size={18} />
                保存成功
              </div>
            )}
            <button onClick={onSaveEdit} className="save-btn small" disabled={isLoading}>
              <CheckCircle size={16} />
              保存
            </button>
            <button onClick={onCancelEdit} className="cancel-btn">取消</button>
          </div>
        )}
      </div>

      <div className="form-row">
        {renderField('球队名称', 'teamName')}
        <div className="form-group">
          <label>球队组别</label>
          {isEditing ? (
            <select
              value={editData?.gender || 'MALE'}
              onChange={(e) => onFieldChange('gender', e.target.value)}
              style={{ width: '100%', height: '42px', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: '#fff' }}
            >
              <option value="MALE">男子组 (Men's)</option>
              <option value="FEMALE">女子组 (Women's)</option>
            </select>
          ) : (
            <div className="form-value">{selectedTeam.gender === 'FEMALE' ? '女子组' : '男子组'}</div>
          )}
        </div>
        {renderField('主教练', 'headCoach')}
        {renderField('主教练电话', 'coachPhone')}
        {renderField('领队', 'teamLeader')}
        {renderField('领队电话', 'leaderPhone')}
        {renderField('队医', 'teamDoctor')}
        {renderField('主场球衣颜色', 'homeJerseyColor')}
        {renderField('客场球衣颜色', 'awayJerseyColor')}

        <div className="form-row" style={{ gridColumn: 'span 3', display: 'flex', gap: '20px', marginTop: '15px' }}>
          <ImageUploadField
            label="队徽"
            value={isEditing ? editData?.teamLogo : selectedTeam.teamLogo}
            isEditing={isEditing}
            onUpload={(url) => onFieldChange('teamLogo', url)}
            alt="队徽"
          />
          <ImageUploadField
            label="主场球衣"
            value={isEditing ? editData?.homeJersey : selectedTeam.homeJersey}
            isEditing={isEditing}
            onUpload={(url) => onFieldChange('homeJersey', url)}
            alt="主场球衣"
          />
          <ImageUploadField
            label="客场球衣"
            value={isEditing ? editData?.awayJersey : selectedTeam.awayJersey}
            isEditing={isEditing}
            onUpload={(url) => onFieldChange('awayJersey', url)}
            alt="客场球衣"
          />
        </div>

        {!isEditing && (
          <div className="form-group" style={{ gridColumn: 'span 3', marginTop: '10px' }}>
            <label>赛季数据与战绩走势{activeSeasonName ? `（${activeSeasonName}）` : ''}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '8px' }}>
              <div style={{ background: '#f8f9fa', border: '1px solid #e9ecef', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', color: '#495057' }}>
                零封场次: <strong style={{ color: '#2b8a3e', fontSize: '16px' }}>{stats.cleanSheets}</strong> 场
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', color: '#495057' }}>最近战绩:</span>
                {stats.form.length === 0 ? (
                  <span style={{ fontSize: '13px', color: '#868e96', fontStyle: 'italic' }}>暂无已结束比赛</span>
                ) : (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {stats.form.map((result, idx) => {
                      const color = result === 'W' ? '#2b8a3e' : result === 'L' ? '#fa5252' : '#868e96';
                      const label = result === 'W' ? '胜' : result === 'L' ? '负' : '平';
                      return (
                        <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: color, color: '#fff', fontSize: '11px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} title={result === 'W' ? '胜利' : result === 'L' ? '失败' : '平局'}>
                          {label}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
