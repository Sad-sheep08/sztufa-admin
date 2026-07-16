import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Globe, Calendar, FileText, CheckCircle2, AlertCircle, Loader2, Upload } from 'lucide-react';
import { newsApi, uploadApi } from '../api/service';
import { NewsDTO } from '../api/service';

const NewsManagementPage: React.FC = () => {
  const [newsList, setNewsList] = useState<NewsDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 弹窗状态
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentId, setCurrentId] = useState<string | null>(null);

  // 表单状态
  const [formData, setFormData] = useState<{
    title: string;
    category: string;
    description: string;
    coverImage: string | null;
    wechatUrl: string;
    date: string;
  }>({
    title: '',
    category: '赛事',
    description: '',
    coverImage: null,
    wechatUrl: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    loadNews();
  }, [page, categoryFilter]);

  const loadNews = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await newsApi.getAll(page, limit, categoryFilter);
      setNewsList(res.data || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || '获取活动资讯列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setFormData({
      title: '',
      category: '赛事',
      description: '',
      coverImage: null,
      wechatUrl: '',
      date: new Date().toISOString().split('T')[0],
    });
    setImageFile(null);
    setImagePreview(null);
    setModalMode('create');
    setCurrentId(null);
    setIsOpenModal(true);
  };

  const handleOpenEditModal = (news: NewsDTO) => {
    setFormData({
      title: news.title,
      category: news.category,
      description: news.description,
      coverImage: news.coverImage || null,
      wechatUrl: news.wechatUrl,
      date: news.date,
    });
    setImageFile(null);
    setImagePreview(news.coverImage || null);
    setModalMode('edit');
    setCurrentId(news.id || null);
    setIsOpenModal(true);
  };

  const handleCloseModal = () => {
    setIsOpenModal(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.title.trim()) {
      setError('请输入资讯标题');
      return;
    }
    if (!formData.description.trim()) {
      setError('请输入新闻简介');
      return;
    }
    if (!formData.wechatUrl.trim() || !formData.wechatUrl.startsWith('http')) {
      setError('请输入有效的微信公众号文章链接(必须以 http 或 https 开头)');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalCoverImage = formData.coverImage;

      // 如果有新选择的文件，先上传
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

      if (modalMode === 'create') {
        await newsApi.create(payload);
        setSuccess('活动资讯新建成功！');
      } else if (modalMode === 'edit' && currentId) {
        await newsApi.update(currentId, payload);
        setSuccess('活动资讯修改成功！');
      }

      setIsOpenModal(false);
      loadNews();

      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || '保存资讯失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`确定要删除活动资讯 "${title}" 吗？`)) {
      return;
    }

    setError(null);
    setSuccess(null);
    try {
      await newsApi.delete(id);
      setSuccess('删除成功！');
      loadNews();
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || '删除资讯失败');
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a1a1a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText color="#3b5bdb" size={28} />
            活动资讯管理
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>发布微信公众号资讯并管理前台展示内容</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#3b5bdb',
            color: '#fff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '14px',
            boxShadow: '0 4px 10px rgba(59,91,219,0.2)',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#2f49b5')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#3b5bdb')}
        >
          <Plus size={18} />
          新建资讯
        </button>
      </header>

      {/* 提示栏 */}
      {success && (
        <div style={{ background: '#d3f9d8', border: '1px solid #b2f2bb', color: '#2b8a3e', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '14px' }}>
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div style={{ background: '#ffe3e3', border: '1px solid #ffa8a8', color: '#c92a2a', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '14px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* 过滤器 */}
      <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e9ecef', marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#495057' }}>📌 按分类筛选:</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', '赛事', '招新', '活动', '资讯', '其他'].map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategoryFilter(cat); setPage(1); }}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: categoryFilter === cat ? '#3b5bdb' : '#dee2e6',
                background: categoryFilter === cat ? '#edf2ff' : '#fff',
                color: categoryFilter === cat ? '#3b5bdb' : '#495057',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500
              }}
            >
              {cat === 'all' ? '全部' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* 列表表格 */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e9ecef', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '10px' }}>
            <Loader2 className="loader" size={32} color="#3b5bdb" style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ color: '#868e96', fontSize: '14px' }}>正在加载数据...</span>
          </div>
        ) : newsList.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#868e96' }}>
            <FileText size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p style={{ margin: 0, fontSize: '14px' }}>暂无相关活动资讯数据</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
                <th style={{ padding: '16px 20px', fontWeight: 600, color: '#495057', width: '80px' }}>封面图</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, color: '#495057' }}>标题</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, color: '#495057', width: '100px' }}>分类</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, color: '#495057', width: '120px' }}>发布日期</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, color: '#495057', width: '300px' }}>公众号链接</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, color: '#495057', width: '120px', textAlign: 'center' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {newsList.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                  <td style={{ padding: '14px 20px' }}>
                    {item.coverImage ? (
                      <img src={item.coverImage} alt="封面" style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #eee' }} />
                    ) : (
                      <div style={{ width: '60px', height: '40px', background: '#f1f3f5', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#adb5bd' }}>无封面</div>
                    )}
                  </td>
                  <td style={{ padding: '14px 20px', fontWeight: 600, color: '#212529' }}>
                    <div>{item.title}</div>
                    <div style={{ fontSize: '12px', fontWeight: 'normal', color: '#868e96', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {item.description}
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: item.category === '招新' ? '#ebfbee' : item.category === '赛事' ? '#edf2ff' : '#fff9db',
                      color: item.category === '招新' ? '#2b8a3e' : item.category === '赛事' ? '#3b5bdb' : '#f08c00',
                    }}>
                      {item.category}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', color: '#495057' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={14} color="#adb5bd" />
                      {item.date}
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <a
                      href={item.wechatUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#3b5bdb',
                        textDecoration: 'none',
                        fontSize: '13px',
                        maxWidth: '280px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      <Globe size={14} />
                      打开公众号文章
                    </a>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#495057' }}
                        title="编辑"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id!, item.title)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#fa5252' }}
                        title="删除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 分页 */}
      {total > limit && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '8px' }}>
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            style={{ padding: '6px 12px', border: '1px solid #dee2e6', background: '#fff', borderRadius: '6px', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
          >
            上一页
          </button>
          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 10px', fontSize: '14px', color: '#495057' }}>
            第 {page} / {Math.ceil(total / limit)} 页
          </span>
          <button
            disabled={page >= Math.ceil(total / limit)}
            onClick={() => setPage(page + 1)}
            style={{ padding: '6px 12px', border: '1px solid #dee2e6', background: '#fff', borderRadius: '6px', cursor: page >= Math.ceil(total / limit) ? 'not-allowed' : 'pointer', opacity: page >= Math.ceil(total / limit) ? 0.5 : 1 }}
          >
            下一页
          </button>
        </div>
      )}

      {/* 编辑/新建弹窗 */}
      {isOpenModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '90%', maxWidth: '600px', padding: '24px', boxShadow: '0 8px 28px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a1a', marginTop: 0, marginBottom: '20px' }}>
              {modalMode === 'create' ? '新建活动资讯' : '编辑活动资讯'}
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
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
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>

              </div>

              {/* 弹窗底部操作 */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f1f3f5' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
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
                    gap: '6px'
                  }}
                >
                  {isSubmitting && <Loader2 size={16} className="loader" style={{ animation: 'spin 1s linear infinite' }} />}
                  {modalMode === 'create' ? '保存新建' : '保存修改'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsManagementPage;
