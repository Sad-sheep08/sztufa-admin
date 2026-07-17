import React, { useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { newsApi, uploadApi } from '../api/service';
import { NewsDTO } from '../api/service';

interface NewsFormModalProps {
  mode: 'create' | 'edit';
  currentId: string | null;
  initialData: {
    title: string;
    category: string;
    description: string;
    coverImage: string | null;
    wechatUrl: string;
    date: string;
  };
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  onSaved: () => void;
}

const NewsFormModal: React.FC<NewsFormModalProps> = ({
  mode,
  currentId,
  initialData,
  onClose,
  onSuccess,
  onError,
  onSaved,
}) => {
  const [formData, setFormData] = useState(initialData);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData.coverImage);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onError('');
    onSuccess('');

    if (!formData.title.trim()) { onError('请输入资讯标题'); return; }
    if (!formData.description.trim()) { onError('请输入新闻简介'); return; }
    if (!formData.wechatUrl.trim() || !formData.wechatUrl.startsWith('http')) {
      onError('请输入有效的微信公众号文章链接(必须以 http 或 https 开头)');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalCoverImage = formData.coverImage;
      if (imageFile) {
        const uploadRes = await uploadApi.upload(imageFile);
        if (uploadRes.data && uploadRes.data.url) {
          finalCoverImage = uploadRes.data.url;
        } else {
          throw new Error('封面图上传失败');
        }
      }

      const payload: NewsDTO = {
        title: formData.title.trim(),
        category: formData.category,
        description: formData.description.trim(),
        coverImage: finalCoverImage,
        wechatUrl: formData.wechatUrl.trim(),
        date: formData.date,
      };

      if (mode === 'create') {
        await newsApi.create(payload);
        onSuccess('活动资讯新建成功！');
      } else if (mode === 'edit' && currentId) {
        await newsApi.update(currentId, payload);
        onSuccess('活动资讯修改成功！');
      }

      onSaved();
      setTimeout(() => onSuccess(''), 3000);
    } catch (err: any) {
      console.error(err);
      onError(err?.message || '保存资讯失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        .news-modal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        @media (max-width: 768px) {
          .news-modal-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }
      `}</style>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', width: '90%', maxWidth: '600px', padding: '24px', boxShadow: '0 8px 28px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a1a', marginTop: 0, marginBottom: '20px' }}>
            {mode === 'create' ? '新建活动资讯' : '编辑活动资讯'}
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#495057' }}>资讯标题 *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="请输入资讯标题"
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div className="news-modal-grid">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#495057' }}>分类 *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '14px', outline: 'none', background: '#fff' }}
                  >
                    {['赛事', '招新', '活动', '资讯', '其他'].map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#495057' }}>发布日期 *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#495057' }}>微信公众号文章链接 *</label>
                <input
                  type="url"
                  required
                  value={formData.wechatUrl}
                  onChange={(e) => setFormData({ ...formData, wechatUrl: e.target.value })}
                  placeholder="https://mp.weixin.qq.com/s/..."
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#495057' }}>资讯简介 *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="请输入简短的内容导读/简介，在展示端前台卡片内呈现..."
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#495057' }}>封面图片</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '4px' }}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="预览" style={{ width: '90px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #dee2e6' }} />
                  ) : (
                    <div style={{ width: '90px', height: '60px', background: '#f8f9fa', border: '1px dashed #ced4da', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#868e96' }}>
                      <Upload size={16} style={{ marginBottom: '2px' }} />
                      暂无图片
                    </div>
                  )}
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', border: '1px solid #ced4da', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, background: '#f8f9fa', transition: 'background 0.2s' }}>
                    选择文件
                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f1f3f5' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                style={{ padding: '8px 16px', border: '1px solid #ced4da', background: '#fff', color: '#495057', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  background: '#3b5bdb',
                  color: '#fff',
                  borderRadius: '6px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {isSubmitting && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                {mode === 'create' ? '保存新建' : '保存修改'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default NewsFormModal;
