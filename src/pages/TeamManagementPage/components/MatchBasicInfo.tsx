import React from 'react';
import { MatchFormData } from '../../../types';

interface MatchBasicInfoProps {
  formData: MatchFormData;
  activeSeasons: any[];
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleSeasonSelect: (seasonId: string) => void;
}

const MatchBasicInfo: React.FC<MatchBasicInfoProps> = ({
  formData,
  activeSeasons,
  handleChange,
  handleSeasonSelect,
}) => {
  return (
    <div className="form-section">
      <h2 className="form-title">
        <span className="icon">⚽</span>
        基本信息
      </h2>
      <div className="form-row">
        {activeSeasons.length > 0 && (
          <div className="form-group">
            <label>归属赛季</label>
            <select
              name="seasonId"
              value={formData.seasonId || ''}
              onChange={(e) => handleSeasonSelect(e.target.value)}
              className="form-select"
              required
            >
              <option value="">请选择赛季</option>
              {activeSeasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.type === 'CUP' ? '杯赛' : '单循环'})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label>比赛名称</label>
          <select
            name="matchName"
            value={formData.matchName}
            onChange={handleChange}
            className="form-select"
            required
          >
            <option value="">请选择比赛名称</option>
            <option value="小组赛第一轮">小组赛第一轮</option>
            <option value="小组赛第二轮">小组赛第二轮</option>
            <option value="小组赛第三轮">小组赛第三轮</option>
            <option value="八分之一决赛">八分之一决赛</option>
            <option value="四分之一决赛">四分之一决赛</option>
            <option value="半决赛">半决赛</option>
            <option value="季军赛">季军赛</option>
            <option value="决赛">决赛</option>
          </select>
        </div>

        <div className="form-group">
          <label>比赛时间</label>
          <input
            type="datetime-local"
            name="matchTime"
            value={formData.matchTime}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label>比赛地点</label>
          <select
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="form-input"
            required
          >
            <option value="">请选择比赛地点</option>
            <option value="五人场">五人场</option>
            <option value="北区">北区</option>
            <option value="南区">南区</option>
            {formData.location && !['五人场', '北区', '南区'].includes(formData.location) && (
              <option value={formData.location}>{formData.location}</option>
            )}
          </select>
        </div>

        <div className="form-group">
          <label>比赛状态</label>
          <select
            name="status"
            value={formData.status || 'finished'}
            onChange={handleChange}
            className="form-input"
            required
          >
            <option value="scheduled">即将开始</option>
            <option value="ongoing">进行中</option>
            <option value="finished">已结束</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default MatchBasicInfo;
