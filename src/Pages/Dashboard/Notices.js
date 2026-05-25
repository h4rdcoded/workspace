import React, { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../Context/ConfigContext';
import { toast } from 'react-toastify';
import { buildApiUrl, getAuthHeaders } from '../../config/api';
import axios from 'axios';

const Notices = () => {
  const { leadCrmApiURL } = useContext(ConfigContext);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Helper function to format notice content with proper HTML
  const formatNoticeContent = (content) => {
    if (!content) return '';
    
    // First, escape HTML to prevent XSS
    let escapedContent = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    
    // Convert markdown-style bullet points to HTML lists
    // Handle both * and - as bullet points
    let formattedContent = escapedContent
      .replace(/^\s*[*\-]\s+(.*)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');
    
    // Handle multiple lists
    formattedContent = formattedContent.replace(/<\/ul>(\s*<ul>)+/g, '</ul><ul>');
    
    // Convert double newlines to paragraphs
    formattedContent = formattedContent
      .split('\n\n')
      .map(paragraph => {
        // If paragraph contains list items, don't wrap in p tags
        if (paragraph.includes('<li>')) {
          return paragraph;
        }
        // Regular paragraph
        return `<p>${paragraph}</p>`;
      })
      .join('');
    
    // Handle single newlines within paragraphs
    formattedContent = formattedContent.replace(/\n/g, '<br>');
    
    // Handle bold text (markdown style)
    formattedContent = formattedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Handle italic text (markdown style)
    formattedContent = formattedContent.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    return formattedContent;
  };

  const noticeTypes = [
    { value: 'GENERAL', label: '💬 General', emoji: '💬', color: 'info' },
    { value: 'UPDATES', label: '📰 Updates', emoji: '📰', color: 'primary' },
    { value: 'WARNING', label: '⚠️ Warning', emoji: '⚠️', color: 'warning' },
    { value: 'ALERT', label: '🚨 Alert', emoji: '🚨', color: 'danger' },
    { value: 'ANNOUNCEMENT', label: '📣 Announcement', emoji: '📣', color: 'success' },
    { value: 'TECHNICAL_UPDATE', label: '🔧 Technical Update', emoji: '🔧', color: 'info' },
    { value: 'HR_NOTICE', label: '👥 HR Notice', emoji: '👥', color: 'primary' },
    { value: 'PROJECT_UPDATE', label: '📊 Project Update', emoji: '📊', color: 'info' },
    { value: 'POLICY_UPDATE', label: '📋 Policy Update', emoji: '📋', color: 'warning' },
    { value: 'GOOD_NEWS', label: '🎉 Good News', emoji: '🎉', color: 'success' },
    { value: 'REMINDER', label: '⏰ Reminder', emoji: '⏰', color: 'warning' },
    { value: 'URGENT', label: '🔴 Urgent', emoji: '🔴', color: 'danger' }
  ];

  useEffect(() => {
    fetchNotices();
  }, [filterType, currentPage]);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20
      });
      if (filterType !== 'all') params.append('notice_type', filterType);

      const response = await axios.get(
        `${leadCrmApiURL}/my-notices?${params.toString()}`,
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        setNotices(response.data.data);
        setTotalPages(response.data.pagination.total_pages);
      }
    } catch (error) {
      toast.error('Failed to fetch notices');
    } finally {
      setLoading(false);
    }
  };

  const handleViewNotice = async (notice) => {
    setSelectedNotice(notice);
    setShowNoticeModal(true);

    // Mark as read
    if (!notice.is_read) {
      try {
        await axios.post(
          `${leadCrmApiURL}/notices/${notice.id}/mark-read`,
          {},
          { headers: getAuthHeaders() }
        );
        // Update local state
        setNotices(prevNotices =>
          prevNotices.map(n =>
            n.id === notice.id ? { ...n, is_read: true } : n
          )
        );
      } catch (error) {
        console.error('Failed to mark notice as read:', error);
      }
    }
  };

  const getNoticeTypeInfo = (type) => {
    return noticeTypes.find(t => t.value === type) || noticeTypes[0];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const unreadCount = notices.filter(n => !n.is_read).length;

  return (
    <div className="main-content">
      <div className="page-content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="page-title-box d-sm-flex align-items-center justify-content-between mb-3">
                <h4 className="mb-sm-0">Notices & Announcements</h4>
                <div className="d-flex align-items-center gap-2">
                  {unreadCount > 0 && (
                    <span className="badge bg-danger">
                      {unreadCount} Unread
                    </span>
                  )}
                  <div className="d-flex align-items-center gap-2">
                    <label className="form-label mb-0 small text-muted">Filter:</label>
                    <select
                      className="form-select form-select-sm"
                      style={{ width: 'auto', minWidth: '180px' }}
                      value={filterType}
                      onChange={(e) => {
                        setFilterType(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="all">All Types</option>
                      {noticeTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-12">
              <div className="card">
                <div className="card-body">

                  {loading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : notices.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="ri-notification-off-line display-1 text-muted"></i>
                      <p className="text-muted mt-3">No notices available</p>
                    </div>
                  ) : (
                    <>
                      <div className="row g-3">
                        {notices.map((notice) => {
                          const typeInfo = getNoticeTypeInfo(notice.notice_type);
                          return (
                            <div key={notice.id} className="col-md-6 col-lg-4">
                              <div
                                className={`card h-100 notice-card ${!notice.is_read ? 'border-primary border-2' : 'border'} ${!notice.is_read ? 'shadow-sm' : ''}`}
                                style={{ 
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease',
                                  borderRadius: '12px'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-4px)';
                                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = '';
                                }}
                                onClick={() => handleViewNotice(notice)}
                              >
                                <div className="card-body">
                                  <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div className="flex-grow-1">
                                      <h5 className="card-title mb-2 fw-semibold">
                                        {!notice.is_read && (
                                          <span className="badge bg-primary me-2">New</span>
                                        )}
                                        {notice.title}
                                      </h5>
                                      <span className={`badge bg-${typeInfo.color} mb-2`}>
                                        {typeInfo.emoji} {typeInfo.label.replace(/^[^\s]+\s/, '')}
                                      </span>
                                    </div>
                                    <span className={`badge ${
                                      notice.priority === 'URGENT' ? 'bg-danger' :
                                      notice.priority === 'HIGH' ? 'bg-warning' :
                                      notice.priority === 'MEDIUM' ? 'bg-info' : 'bg-secondary'
                                    }`}>
                                      {notice.priority}
                                    </span>
                                  </div>
                                  <p className="card-text text-muted mb-3" style={{ 
                                    fontSize: '0.9rem',
                                    lineHeight: '1.5',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                  }}>
                                    {notice.content.replace(/<[^>]*>/g, '').substring(0, 120)}...
                                  </p>
                                  <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                                    <small className="text-muted">
                                      <i className="ri-time-line me-1"></i>
                                      {formatDate(notice.published_at)}
                                    </small>
                                    <small className="text-muted">
                                      <i className="ri-user-line me-1"></i>
                                      {notice.created_by_name}
                                    </small>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {totalPages > 1 && (
                        <div className="d-flex justify-content-center mt-4">
                          <nav>
                            <ul className="pagination mb-0">
                              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button
                                  className="page-link"
                                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                  disabled={currentPage === 1}
                                >
                                  <i className="ri-arrow-left-s-line"></i> Previous
                                </button>
                              </li>
                              {[...Array(totalPages)].map((_, i) => {
                                const page = i + 1;
                                if (
                                  page === 1 ||
                                  page === totalPages ||
                                  (page >= currentPage - 2 && page <= currentPage + 2)
                                ) {
                                  return (
                                    <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                                      <button
                                        className="page-link"
                                        onClick={() => setCurrentPage(page)}
                                      >
                                        {page}
                                      </button>
                                    </li>
                                  );
                                }
                                return null;
                              })}
                              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                <button
                                  className="page-link"
                                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                  disabled={currentPage === totalPages}
                                >
                                  Next <i className="ri-arrow-right-s-line"></i>
                                </button>
                              </li>
                            </ul>
                          </nav>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notice Detail Modal */}
      {showNoticeModal && selectedNotice && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {getNoticeTypeInfo(selectedNotice.notice_type).emoji} {selectedNotice.title}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowNoticeModal(false);
                    setSelectedNotice(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3 d-flex gap-2 flex-wrap">
                  <span className={`badge bg-${getNoticeTypeInfo(selectedNotice.notice_type).color}`}>
                    {getNoticeTypeInfo(selectedNotice.notice_type).label}
                  </span>
                  <span className={`badge ${
                    selectedNotice.priority === 'URGENT' ? 'bg-danger' :
                    selectedNotice.priority === 'HIGH' ? 'bg-warning' :
                    selectedNotice.priority === 'MEDIUM' ? 'bg-info' : 'bg-secondary'
                  }`}>
                    {selectedNotice.priority}
                  </span>
                </div>
                <div
                  className="notice-content mb-4 p-3 border rounded bg-light bg-opacity-50"
                  style={{ minHeight: '100px' }}
                  dangerouslySetInnerHTML={{ __html: formatNoticeContent(selectedNotice.content) }}
                />
                <div className="row text-muted small">
                  <div className="col-md-6">
                    <p className="mb-2">
                      <i className="ri-calendar-line me-2"></i>
                      <strong>Published:</strong> {formatDate(selectedNotice.published_at)}
                    </p>
                    <p className="mb-2">
                      <i className="ri-user-line me-2"></i>
                      <strong>By:</strong> {selectedNotice.created_by_name}
                    </p>
                  </div>
                  {selectedNotice.expires_at && (
                    <div className="col-md-6">
                      <p className="mb-2">
                        <i className="ri-time-line me-2"></i>
                        <strong>Expires:</strong> {formatDate(selectedNotice.expires_at)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowNoticeModal(false);
                    setSelectedNotice(null);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notices;

