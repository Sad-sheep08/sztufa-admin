import React, { useState } from 'react';
import { Upload, Image } from 'lucide-react';
import { TeamFormData } from '../types';

interface TeamFormProps {
  data: TeamFormData;
  onChange: (data: TeamFormData) => void;
}

const TeamForm: React.FC<TeamFormProps> = ({ data, onChange }) => {
  const [preview, setPreview] = useState<{ [key: string]: string }>({});

  const handleFieldChange = (field: keyof TeamFormData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const handleFileChange = async (
    field: 'teamLogo' | 'homeJersey' | 'awayJersey',
    file: File | null
  ) => {
    if (file) {
      const base64 = await fileToBase64(file);
      setPreview((prev) => ({ ...prev, [field]: base64 }));
    } else {
      setPreview((prev) => {
        const newPreview = { ...prev };
        delete newPreview[field];
        return newPreview;
      });
    }
    onChange({ ...data, [field]: file });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const renderImageUpload = (
    label: string,
    field: 'teamLogo' | 'homeJersey' | 'awayJersey'
  ) => (
    <div className="image-upload">
      <label>{label}</label>
      <div className="upload-area">
        {preview[field] ? (
          <img src={preview[field]} alt={label} className="preview-image" />
        ) : (
          <div className="upload-placeholder">
            <Upload size={32} />
            <span>点击上传图片</span>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange(field, e.target.files?.[0] || null)}
          className="file-input"
        />
      </div>
    </div>
  );

  return (
    <div className="team-form">
      <h2 className="form-title">
        <span className="icon">⚽</span> 球队信息
      </h2>

      <div className="form-row">
        <div className="form-group">
          <label>队伍名称 *</label>
          <input
            type="text"
            value={data.teamName}
            onChange={(e) => handleFieldChange('teamName', e.target.value)}
            placeholder="请输入队伍名称"
            maxLength={100}
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>主教练姓名 *</label>
          <input
            type="text"
            value={data.headCoach}
            onChange={(e) => handleFieldChange('headCoach', e.target.value)}
            placeholder="请输入主教练姓名"
            required
          />
        </div>
        <div className="form-group">
          <label>领队姓名 *</label>
          <input
            type="text"
            value={data.teamLeader}
            onChange={(e) => handleFieldChange('teamLeader', e.target.value)}
            placeholder="请输入领队姓名"
            required
          />
        </div>
        <div className="form-group">
          <label>队医姓名 *</label>
          <input
            type="text"
            value={data.teamDoctor}
            onChange={(e) => handleFieldChange('teamDoctor', e.target.value)}
            placeholder="请输入队医姓名"
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>主教练联系方式 *</label>
          <input
            type="tel"
            value={data.coachPhone}
            onChange={(e) => handleFieldChange('coachPhone', e.target.value)}
            placeholder="请输入主教练手机号"
            required
          />
        </div>
        <div className="form-group">
          <label>领队联系方式 *</label>
          <input
            type="tel"
            value={data.leaderPhone}
            onChange={(e) => handleFieldChange('leaderPhone', e.target.value)}
            placeholder="请输入领队手机号"
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>主队球衣颜色 *</label>
          <input
            type="text"
            value={data.homeJerseyColor}
            onChange={(e) => handleFieldChange('homeJerseyColor', e.target.value)}
            placeholder="请输入主队球衣颜色，如：蓝色、红色"
            required
          />
        </div>
        <div className="form-group">
          <label>客队球衣颜色 *</label>
          <input
            type="text"
            value={data.awayJerseyColor}
            onChange={(e) => handleFieldChange('awayJerseyColor', e.target.value)}
            placeholder="请输入客队球衣颜色，如：白色、黑色"
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group image-group">
          {renderImageUpload('队徽', 'teamLogo')}
        </div>
        <div className="form-group image-group">
          {renderImageUpload('主场球衣', 'homeJersey')}
        </div>
        <div className="form-group image-group">
          {renderImageUpload('客场球衣', 'awayJersey')}
        </div>
      </div>
    </div>
  );
};

export default TeamForm;
