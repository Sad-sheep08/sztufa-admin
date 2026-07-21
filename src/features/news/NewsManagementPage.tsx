import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Globe, Calendar, FileText, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { NewsDTO } from '../../api/service';
import { useNewsData } from '../../pages/hooks/useNewsData';
import NewsFormModal from './components/NewsFormModal';

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
    <div className="team-info-page">
      <header className="page-header">
        <div className="header-content">
          <h1>
            <FileText className="trophy-icon" />
            活动资讯管理
          </h1>
          <p>发布微信公众号资讯并管理前台展示内容</p>
        </div>
      </header>

      <main className="page-content">
        {success && (
          <div className="save-success inline" style={{ marginBottom: '20px' }}>
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="error-message" style={{ marginBottom: '20px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="form-section">
          <div className="section-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <h2 className="form-title">
              <span className="icon">📰</span>
              资讯列表 ({total}条)
            </h2>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button onClick={() => loadNews()} className="add-btn refresh-btn" disabled={isLoading}>
                <RefreshCw size={16} className={isLoading ? 'spinning' : ''} />
                刷新
              </button>
              <button onClick={handleOpenCreateModal} className="add-btn">
                <Plus size={16} />
                新建资讯
              </button>
            </div>
          </div>

          {/* 分类筛选条 */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', padding: '12px 16px', background: '#f8f9fa', borderRadius: '8px', marginBottom: '20px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#495057' }}>📌 按分类筛选:</span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['all', '赛事', '招新', '活动', '资讯', '其他'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setCategoryFilter(cat); setPage(1); }}
                  style={{
                    padding: '5px 14px',
                    borderRadius: '20px',
                    border: '1px solid',
                    borderColor: categoryFilter === cat ? '#3b5bdb' : '#dee2e6',
                    background: categoryFilter === cat ? '#3b5bdb' : '#fff',
                    color: categoryFilter === cat ? '#fff' : '#495057',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                    transition: 'all 0.2s'
                  }}
                >
                  {cat === 'all' ? '全部' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* 列表 / 表格内容 */}
          {isLoading ? (
            <div className="loading-state" style={{ padding: '60px 0', textAlign: 'center' }}>
              <Loader2 size={32} className="loader" style={{ margin: '0 auto 10px' }} />
              <p>正在加载资讯数据...</p>
            </div>
          ) : newsList.length === 0 ? (
            <div className="empty-state" style={{ padding: '60px 0', textAlign: 'center' }}>
              <FileText size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p>暂无相关活动资讯数据，点击上方“新建资讯”添加</p>
            </div>
          ) : (
            <>
              {/* 桌面端表格 */}
              <div className="player-table-wrapper desktop-news-view">
                <table className="player-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>封面图</th>
                      <th>标题与简介</th>
                      <th style={{ width: '90px' }}>分类</th>
                      <th style={{ width: '110px' }}>发布日期</th>
                      <th style={{ width: '150px' }}>公众号链接</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newsList.map((item) => (
                      <tr key={item.id}>
                        <td>
                          {item.coverImage ? (
                            <img src={item.coverImage} alt="封面" style={{ width: '56px', height: '38px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #eee' }} />
                          ) : (
                            <div style={{ width: '56px', height: '38px', background: '#f1f3f5', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#adb5bd' }}>无封面</div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#212529', marginBottom: '4px' }}>{item.title}</div>
                          <div style={{ fontSize: '12px', color: '#868e96', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {item.description}
                          </div>
                        </td>
                        <td>
                          <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, background: item.category === '招新' ? '#ebfbee' : item.category === '赛事' ? '#edf2ff' : '#fff9db', color: item.category === '招新' ? '#2b8a3e' : item.category === '赛事' ? '#3b5bdb' : '#f08c00' }}>
                            {item.category}
                          </span>
                        </td>
                        <td style={{ color: '#495057', fontSize: '13px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} color="#adb5bd" />
                            {item.date}
                          </span>
                        </td>
                        <td>
                          <a href={item.wechatUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#3b5bdb', textDecoration: 'none', fontSize: '13px' }}>
                            <Globe size={13} />打开文章
                          </a>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button onClick={() => handleOpenEditModal(item)} className="action-btn edit-btn" title="编辑">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDelete(item.id!, item.title)} className="delete-btn small" title="删除">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 移动端卡片列表 (展示美化) */}
              <div className="mobile-news-view">
                {newsList.map((item) => (
                  <div key={item.id} className="mobile-news-card">
                    <div className="mobile-news-card-header">
                      {item.coverImage ? (
                        <img src={item.coverImage} alt="封面" className="mobile-news-cover" />
                      ) : (
                        <div className="mobile-news-cover-placeholder">无封面</div>
                      )}
                      <div className="mobile-news-card-title-area">
                        <div className="mobile-news-title">{item.title}</div>
                        <div className="mobile-news-meta">
                          <span className="mobile-news-category" style={{ background: item.category === '招新' ? '#ebfbee' : item.category === '赛事' ? '#edf2ff' : '#fff9db', color: item.category === '招新' ? '#2b8a3e' : item.category === '赛事' ? '#3b5bdb' : '#f08c00' }}>
                            {item.category}
                          </span>
                          <span className="mobile-news-date">📅 {item.date}</span>
                        </div>
                      </div>
                    </div>
                    {item.description && (
                      <div className="mobile-news-desc">{item.description}</div>
                    )}
                    <div className="mobile-news-card-actions">
                      <a href={item.wechatUrl} target="_blank" rel="noopener noreferrer" className="mobile-news-link">
                        <Globe size={14} />查看微信推文
                      </a>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleOpenEditModal(item)} className="action-btn edit-btn" title="编辑">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(item.id!, item.title)} className="delete-btn small" title="删除">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* 分页控制 */}
          {total > limit && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '8px' }}>
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="add-btn small btn-secondary"
                style={{ padding: '6px 12px', height: 'auto' }}
              >
                上一页
              </button>
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 10px', fontSize: '13px', color: '#495057' }}>
                第 {page} / {Math.ceil(total / limit)} 页
              </span>
              <button
                disabled={page >= Math.ceil(total / limit)}
                onClick={() => setPage(page + 1)}
                className="add-btn small btn-secondary"
                style={{ padding: '6px 12px', height: 'auto' }}
              >
                下一页
              </button>
            </div>
          )}
        </div>
      </main>

      <style>{`
        .desktop-news-view {
          display: block;
        }
        .mobile-news-view {
          display: none;
        }
        @media (max-width: 768px) {
          .desktop-news-view {
            display: none;
          }
          .mobile-news-view {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .mobile-news-card {
            background: #fff;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          }
          .mobile-news-card-header {
            display: flex;
            gap: 12px;
            align-items: flex-start;
          }
          .mobile-news-cover {
            width: 70px;
            height: 50px;
            object-fit: cover;
            border-radius: 6px;
            flex-shrink: 0;
          }
          .mobile-news-cover-placeholder {
            width: 70px;
            height: 50px;
            background: #f1f3f5;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            color: #adb5bd;
            flex-shrink: 0;
          }
          .mobile-news-card-title-area {
            flex: 1;
            min-width: 0;
          }
          .mobile-news-title {
            font-size: 14px;
            font-weight: 600;
            color: #212529;
            margin-bottom: 4px;
            line-height: 1.3;
          }
          .mobile-news-meta {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 11px;
            color: #868e96;
          }
          .mobile-news-category {
            padding: 2px 6px;
            border-radius: 10px;
            font-weight: 600;
          }
          .mobile-news-desc {
            font-size: 12px;
            color: #666;
            margin-top: 8px;
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            background: #f8f9fa;
            padding: 6px 8px;
            border-radius: 4px;
          }
          .mobile-news-card-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 10px;
            padding-top: 8px;
            border-top: 1px dashed #f1f3f5;
          }
          .mobile-news-link {
            font-size: 12px;
            color: #3b5bdb;
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 4px;
            font-weight: 500;
          }
        }
      `}</style>

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
