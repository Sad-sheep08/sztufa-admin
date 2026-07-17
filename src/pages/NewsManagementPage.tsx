import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Globe, Calendar, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { NewsDTO } from '../api/service';
import { useNewsData } from './hooks/useNewsData';
import NewsFormModal from './NewsFormModal';

const NewsManagementPage: React.FC = () => {
  const {
    newsList, total, page, limit, categoryFilter, isLoading,
    error, success,
    setPage, setCategoryFilter, setError, setSuccess,
    loadNews, handleDelete,
  } = useNewsData();

  const [isOpenModal, setIsOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [modalInitialData, setModalInitialData] = useState({
    title: '', category: '赛事', description: '', coverImage: null as string | null,
    wechatUrl: '', date: new Date().toISOString().split('T')[0],
  });

  const handleOpenCreateModal = () => {
    setModalInitialData({
      title: '', category: '赛事', description: '', coverImage: null,
      wechatUrl: '', date: new Date().toISOString().split('T')[0],
    });
    setModalMode('create');
    setCurrentId(null);
    setIsOpenModal(true);
  };

  const handleOpenEditModal = (news: NewsDTO) => {
    setModalInitialData({
      title: news.title, category: news.category, description: news.description,
      coverImage: news.coverImage || null, wechatUrl: news.wechatUrl, date: news.date,
    });
    setModalMode('edit');
    setCurrentId(news.id || null);
    setIsOpenModal(true);
  };

  const handleModalSaved = () => {
    setIsOpenModal(false);
    loadNews();
  };

  return (
    <div className="news-container">
      <style>{`
        .news-container { padding: 24px; max-width: 1200px; margin: 0 auto; }
        .news-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; gap: 15px; }
        .news-filter-box { background: #fff; padding: 16px 20px; border-radius: 12px; border: 1px solid #e9ecef; margin-bottom: 20px; display: flex; gap: 15px; align-items: center; flex-wrap: wrap; }
        .news-filter-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
        .news-table-wrapper { background: #fff; border-radius: 12px; border: 1px solid #e9ecef; overflow-x: auto; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
        @media (max-width: 768px) {
          .news-container { padding: 16px; }
          .news-header { flex-direction: column; align-items: flex-start; gap: 12px; }
          .news-header button { width: 100%; justify-content: center; }
          .news-filter-box { flex-direction: column; align-items: flex-start; padding: 12px 16px; gap: 10px; }
        }
      `}</style>

      <header className="news-header">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a1a1a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText color="#3b5bdb" size={28} />
            活动资讯管理
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>发布微信公众号资讯并管理前台展示内容</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#3b5bdb', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', boxShadow: '0 4px 10px rgba(59,91,219,0.2)', transition: 'background 0.2s' }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#2f49b5')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#3b5bdb')}
        >
          <Plus size={18} />
          新建资讯
        </button>
      </header>

      {success && (
        <div style={{ background: '#d3f9d8', border: '1px solid #b2f2bb', color: '#2b8a3e', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '14px' }}>
          <CheckCircle2 size={18} /><span>{success}</span>
        </div>
      )}
      {error && (
        <div style={{ background: '#ffe3e3', border: '1px solid #ffa8a8', color: '#c92a2a', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '14px' }}>
          <AlertCircle size={18} /><span>{error}</span>
        </div>
      )}

      <div className="news-filter-box">
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#495057' }}>📌 按分类筛选:</span>
        <div className="news-filter-buttons">
          {['all', '赛事', '招新', '活动', '资讯', '其他'].map((cat) => (
            <button key={cat} onClick={() => { setCategoryFilter(cat); setPage(1); }}
              style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid', borderColor: categoryFilter === cat ? '#3b5bdb' : '#dee2e6', background: categoryFilter === cat ? '#edf2ff' : '#fff', color: categoryFilter === cat ? '#3b5bdb' : '#495057', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
              {cat === 'all' ? '全部' : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="news-table-wrapper">
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '10px' }}>
            <Loader2 size={32} color="#3b5bdb" style={{ animation: 'spin 1s linear infinite' }} />
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
                    <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, background: item.category === '招新' ? '#ebfbee' : item.category === '赛事' ? '#edf2ff' : '#fff9db', color: item.category === '招新' ? '#2b8a3e' : item.category === '赛事' ? '#3b5bdb' : '#f08c00' }}>
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
                    <a href={item.wechatUrl} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#3b5bdb', textDecoration: 'none', fontSize: '13px', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <Globe size={14} />打开公众号文章
                    </a>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                      <button onClick={() => handleOpenEditModal(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#495057' }} title="编辑">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(item.id!, item.title)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#fa5252' }} title="删除">
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

      {total > limit && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '8px' }}>
          <button disabled={page === 1} onClick={() => setPage(page - 1)}
            style={{ padding: '6px 12px', border: '1px solid #dee2e6', background: '#fff', borderRadius: '6px', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>
            上一页
          </button>
          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 10px', fontSize: '14px', color: '#495057' }}>
            第 {page} / {Math.ceil(total / limit)} 页
          </span>
          <button disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(page + 1)}
            style={{ padding: '6px 12px', border: '1px solid #dee2e6', background: '#fff', borderRadius: '6px', cursor: page >= Math.ceil(total / limit) ? 'not-allowed' : 'pointer', opacity: page >= Math.ceil(total / limit) ? 0.5 : 1 }}>
            下一页
          </button>
        </div>
      )}

      {isOpenModal && (
        <NewsFormModal
          mode={modalMode}
          currentId={currentId}
          initialData={modalInitialData}
          onClose={() => setIsOpenModal(false)}
          onSuccess={(msg) => setSuccess(msg)}
          onError={(msg) => setError(msg)}
          onSaved={handleModalSaved}
        />
      )}
    </div>
  );
};

export default NewsManagementPage;
