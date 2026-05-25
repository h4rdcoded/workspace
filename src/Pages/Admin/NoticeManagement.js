import React, { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../Context/ConfigContext';
import { toast } from 'react-toastify';
import { buildApiUrl, getAuthHeaders } from '../../config/api';
import axios from 'axios';

const NoticeManagement = () => {
  const { leadCrmApiURL } = useContext(ConfigContext);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [noticeReads, setNoticeReads] = useState([]);
  const [loadingReads, setLoadingReads] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotices, setTotalNotices] = useState(0);
  
  const [noticeData, setNoticeData] = useState({
    title: '',
    content: '',
    notice_type: 'GENERAL',
    priority: 'MEDIUM',
    send_to_all: false,
    recipient_user_ids: [],
    expires_at: ''
  });

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
    { value: 'GENERAL', label: '💬 General', emoji: '💬' },
    { value: 'UPDATES', label: '📰 Updates', emoji: '📰' },
    { value: 'WARNING', label: '⚠️ Warning', emoji: '⚠️' },
    { value: 'ALERT', label: '🚨 Alert', emoji: '🚨' },
    { value: 'ANNOUNCEMENT', label: '📣 Announcement', emoji: '📣' },
    { value: 'TECHNICAL_UPDATE', label: '🔧 Technical Update', emoji: '🔧' },
    { value: 'HR_NOTICE', label: '👥 HR Notice', emoji: '👥' },
    { value: 'PROJECT_UPDATE', label: '📊 Project Update', emoji: '📊' },
    { value: 'POLICY_UPDATE', label: '📋 Policy Update', emoji: '📋' },
    { value: 'GOOD_NEWS', label: '🎉 Good News', emoji: '🎉' },
    { value: 'REMINDER', label: '⏰ Reminder', emoji: '⏰' },
    { value: 'URGENT', label: '🔴 Urgent', emoji: '🔴' }
  ];

  useEffect(() => {
    fetchNotices();
    fetchEmployees();
    fetchDepartments();
  }, [filterStatus, filterType, currentPage]);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 15
      });
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterType !== 'all') params.append('notice_type', filterType);

      const response = await axios.get(
        `${leadCrmApiURL}/notices?${params.toString()}`,
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        setNotices(response.data.data);
        setTotalPages(response.data.pagination.total_pages);
        setTotalNotices(response.data.pagination.total);
      }
    } catch (error) {
      toast.error('Failed to fetch notices');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(
        `${leadCrmApiURL}/admin/all-employees`,
        { headers: getAuthHeaders() }
      );
      if (response.data.success) {
        // Filter only active employees
        const activeEmployees = (response.data.data || []).filter(emp => emp.isActive);
        // Debug: Log employee structure to verify department field
        if (activeEmployees.length > 0) {
          console.log('Sample employee structure:', {
            id: activeEmployees[0].id,
            name: activeEmployees[0].name,
            departmentId: activeEmployees[0].departmentId,
            department_id: activeEmployees[0].department_id,
            departmentName: activeEmployees[0].departmentName,
            department: activeEmployees[0].department
          });
        }
        setEmployees(activeEmployees);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(
        `${leadCrmApiURL}/departments`,
        { headers: getAuthHeaders() }
      );
      if (response.data.success) {
        setDepartments(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  // Get filtered employees based on selected department
  const getFilteredEmployees = () => {
    if (selectedDepartment === 'all') {
      return employees;
    }
    const deptId = parseInt(selectedDepartment);
    
    // Debug logging
    console.log('Filtering employees by department:', deptId);
    console.log('Total employees:', employees.length);
    
    const filtered = employees.filter(emp => {
      // Check multiple possible field names for department ID
      const matches = emp.departmentId === deptId || 
                      emp.department_id === deptId || 
                      (emp.department && typeof emp.department === 'object' && emp.department.id === deptId) ||
                      (emp.department && typeof emp.department === 'number' && emp.department === deptId);
      
      if (matches) {
        console.log('Matched employee:', emp.name, 'deptId:', emp.departmentId || emp.department_id);
      }
      
      return matches;
    });
    
    console.log('Filtered employees count:', filtered.length);
    return filtered;
  };

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    
    // Validate recipient selection
    if (!noticeData.send_to_all && (!noticeData.recipient_user_ids || noticeData.recipient_user_ids.length === 0)) {
      toast.error('Please select at least one employee or enable "Send to All Employees"');
      return;
    }

    try {
      // Ensure recipient_user_ids is always an array
      const dataToSend = {
        ...noticeData,
        recipient_user_ids: noticeData.recipient_user_ids || []
      };
      
      console.log('Sending notice data:', {
        ...dataToSend,
        recipient_user_ids: dataToSend.recipient_user_ids,
        send_to_all: dataToSend.send_to_all
      });

      let response;
      if (selectedNotice && selectedNotice.id) {
        // Update existing notice
        response = await axios.put(
          `${leadCrmApiURL}/notices/${selectedNotice.id}`,
          dataToSend,
          { headers: getAuthHeaders() }
        );
      } else {
        // Create new notice
        response = await axios.post(
          `${leadCrmApiURL}/notices`,
          dataToSend,
          { headers: getAuthHeaders() }
        );
      }

      if (response.data.success) {
        toast.success(selectedNotice ? 'Notice updated successfully' : 'Notice created successfully');
        setShowCreateModal(false);
        setSelectedNotice(null);
        resetForm();
        fetchNotices();
      }
    } catch (error) {
      console.error('Error saving notice:', error);
      toast.error(error.response?.data?.message || (selectedNotice ? 'Failed to update notice' : 'Failed to create notice'));
    }
  };

  const handlePublishNotice = async (noticeId) => {
    if (!window.confirm('Are you sure you want to publish this notice? Notifications will be sent to all recipients.')) {
      return;
    }

    try {
      const response = await axios.post(
        `${leadCrmApiURL}/notices/${noticeId}/publish`,
        {},
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        toast.success('Notice published successfully! Notifications sent to recipients.');
        fetchNotices();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to publish notice');
    }
  };

  const handleArchiveNotice = async (noticeId) => {
    if (!window.confirm('Are you sure you want to archive this notice?')) {
      return;
    }

    try {
      const response = await axios.post(
        `${leadCrmApiURL}/notices/${noticeId}/archive`,
        {},
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        toast.success('Notice archived successfully');
        fetchNotices();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to archive notice');
    }
  };

  const handleDeleteNotice = async (noticeId) => {
    if (!window.confirm('Are you sure you want to delete this notice? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await axios.delete(
        `${leadCrmApiURL}/notices/${noticeId}`,
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        toast.success('Notice deleted successfully');
        fetchNotices();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete notice');
    }
  };

  const handleViewNotice = async (notice) => {
    setSelectedNotice(notice);
    setShowViewModal(true);
    setNoticeReads([]);

    // If notice is published, fetch who has viewed it
    if (notice.status === 'PUBLISHED') {
      setLoadingReads(true);
      try {
        const response = await axios.get(
          `${leadCrmApiURL}/notices/${notice.id}/reads`,
          { headers: getAuthHeaders() }
        );
        if (response.data.success) {
          setNoticeReads(response.data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch notice reads:', error);
        toast.error('Failed to load notice views');
      } finally {
        setLoadingReads(false);
      }
    }
  };

  const handleEditNotice = (notice) => {
    setSelectedNotice(notice);
    // Parse recipient_user_ids if it's a string
    let recipientIds = notice.recipient_user_ids;
    if (typeof recipientIds === 'string') {
      try {
        recipientIds = JSON.parse(recipientIds);
      } catch (e) {
        recipientIds = [];
      }
    }
    // Ensure it's an array
    if (!Array.isArray(recipientIds)) {
      recipientIds = [];
    }

    console.log('Editing notice - Original notice:', {
      id: notice.id,
      send_to_all: notice.send_to_all,
      recipient_user_ids: notice.recipient_user_ids,
      parsed: recipientIds
    });

    setNoticeData({
      title: notice.title,
      content: notice.content,
      notice_type: notice.notice_type,
      priority: notice.priority,
      send_to_all: Boolean(notice.send_to_all),
      recipient_user_ids: recipientIds,
      expires_at: notice.expires_at ? new Date(notice.expires_at).toISOString().slice(0, 16) : ''
    });
    setShowViewModal(false);
    setShowCreateModal(true); // Open create modal for editing
  };

  const resetForm = () => {
    setNoticeData({
      title: '',
      content: '',
      notice_type: 'GENERAL',
      priority: 'MEDIUM',
      send_to_all: false,
      recipient_user_ids: [],
      expires_at: ''
    });
    setSelectedDepartment('all');
  };

  const handleEmployeeToggle = (employeeId) => {
    const currentIds = noticeData.recipient_user_ids || [];
    if (currentIds.includes(employeeId)) {
      setNoticeData({
        ...noticeData,
        recipient_user_ids: currentIds.filter(id => id !== employeeId)
      });
    } else {
      setNoticeData({
        ...noticeData,
        recipient_user_ids: [...currentIds, employeeId]
      });
    }
  };

  const getNoticeTypeInfo = (type) => {
    return noticeTypes.find(t => t.value === type) || noticeTypes[0];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="main-content">
      <div className="page-content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                <h4 className="mb-sm-0">Notice & Announcement Management</h4>
                <div className="page-title-right">
                  <ol className="breadcrumb m-0">
                    <li className="breadcrumb-item">Admin</li>
                    <li className="breadcrumb-item active">Notices</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">All Notices</h5>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setSelectedNotice(null);
                        resetForm();
                        setShowCreateModal(true);
                      }}
                    >
                      <i className="ri-add-line me-1"></i>
                      Create Notice
                    </button>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-4">
                      <label className="form-label">Filter by Status</label>
                      <select
                        className="form-select"
                        value={filterStatus}
                        onChange={(e) => {
                          setFilterStatus(e.target.value);
                          setCurrentPage(1);
                        }}
                      >
                        <option value="all">All Status</option>
                        <option value="DRAFT">Draft</option>
                        <option value="PUBLISHED">Published</option>
                        <option value="ARCHIVED">Archived</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Filter by Type</label>
                      <select
                        className="form-select"
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

                  {loading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : notices.length === 0 ? (
                    <div className="text-center py-5">
                      <p className="text-muted">No notices found</p>
                    </div>
                  ) : (
                    <>
                      <div className="table-responsive">
                        <table className="table table-striped table-hover">
                          <thead>
                            <tr>
                              <th>Title</th>
                              <th>Type</th>
                              <th>Priority</th>
                              <th>Status</th>
                              <th>Recipients</th>
                              <th>Created By</th>
                              <th>Published At</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {notices.map((notice) => {
                              const typeInfo = getNoticeTypeInfo(notice.notice_type);
                              return (
                                <tr key={notice.id}>
                                  <td>
                                    <strong>{notice.title}</strong>
                                    <br />
                                    <small className="text-muted">
                                      {notice.content.substring(0, 50)}...
                                    </small>
                                  </td>
                                  <td>
                                    <span className="text-muted">
                                      {typeInfo.emoji} {typeInfo.label.replace(/^[^\s]+\s/, '')}
                                    </span>
                                  </td>
                                  <td>
                                    <span className={`badge ${
                                      notice.priority === 'URGENT' ? 'bg-danger' :
                                      notice.priority === 'HIGH' ? 'bg-warning' :
                                      notice.priority === 'MEDIUM' ? 'bg-info' : 'bg-secondary'
                                    }`}>
                                      {notice.priority}
                                    </span>
                                  </td>
                                  <td>
                                    <span className={`badge ${
                                      notice.status === 'PUBLISHED' ? 'bg-success' :
                                      notice.status === 'DRAFT' ? 'bg-warning' : 'bg-secondary'
                                    }`}>
                                      {notice.status}
                                    </span>
                                  </td>
                                  <td>
                                    {notice.send_to_all ? (
                                      <span className="badge bg-primary">All Employees</span>
                                    ) : (
                                      <span className="badge bg-secondary">
                                        {notice.recipient_user_ids?.length || 0} Selected
                                      </span>
                                    )}
                                  </td>
                                  <td>{notice.created_by_name}</td>
                                  <td>{formatDate(notice.published_at)}</td>
                                  <td>
                                    <div className="btn-group" role="group">
                                      <button
                                        className="btn btn-sm btn-info me-1"
                                        onClick={() => handleViewNotice(notice)}
                                        title="View Notice"
                                      >
                                        <i className="ri-eye-line"></i>
                                      </button>
                                      {notice.status === 'DRAFT' && (
                                        <button
                                          className="btn btn-sm btn-success me-1"
                                          onClick={() => handlePublishNotice(notice.id)}
                                          title="Publish"
                                        >
                                          <i className="ri-send-plane-line"></i>
                                        </button>
                                      )}
                                      {notice.status === 'PUBLISHED' && (
                                        <button
                                          className="btn btn-sm btn-warning me-1"
                                          onClick={() => handleArchiveNotice(notice.id)}
                                          title="Archive"
                                        >
                                          <i className="ri-archive-line"></i>
                                        </button>
                                      )}
                                      <button
                                        className="btn btn-sm btn-danger"
                                        onClick={() => handleDeleteNotice(notice.id)}
                                        title="Delete"
                                      >
                                        <i className="ri-delete-bin-line"></i>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination - Show only when there are more than 15 notices */}
                      {totalPages > 1 && (
                        <div className="d-flex justify-content-between align-items-center mt-4 mb-3">
                          <div className="text-muted">
                            Showing {(currentPage - 1) * 15 + 1} to {Math.min(currentPage * 15, totalNotices)} of {totalNotices} notices
                          </div>
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
                                if (page === currentPage - 3 || page === currentPage + 3) {
                                  return (
                                    <li key={`ellipsis-${page}`} className="page-item disabled">
                                      <span className="page-link">...</span>
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

      {/* Create Notice Modal */}
      {showCreateModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {selectedNotice ? 'Edit Notice' : 'Create New Notice'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedNotice(null);
                    resetForm();
                  }}
                ></button>
              </div>
              <form onSubmit={handleCreateNotice}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Notice Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={noticeData.title}
                      onChange={(e) => setNoticeData({ ...noticeData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Notice Content *</label>
                    <textarea
                      className="form-control"
                      rows="8"
                      value={noticeData.content}
                      onChange={(e) => setNoticeData({ ...noticeData, content: e.target.value })}
                      required
                      placeholder="Enter notice content. You can use HTML for formatting."
                    ></textarea>
                    <small className="text-muted">You can use HTML tags for formatting</small>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Notice Type *</label>
                      <select
                        className="form-select"
                        value={noticeData.notice_type}
                        onChange={(e) => setNoticeData({ ...noticeData, notice_type: e.target.value })}
                        required
                      >
                        {noticeTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Priority</label>
                      <select
                        className="form-select"
                        value={noticeData.priority}
                        onChange={(e) => setNoticeData({ ...noticeData, priority: e.target.value })}
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="sendToAllSwitch"
                        checked={noticeData.send_to_all}
                        onChange={(e) => {
                          setNoticeData({
                            ...noticeData,
                            send_to_all: e.target.checked,
                            recipient_user_ids: e.target.checked ? [] : noticeData.recipient_user_ids
                          });
                        }}
                      />
                      <label className="form-check-label" htmlFor="sendToAllSwitch">
                        <strong>Send to All Employees</strong>
                        <small className="text-muted d-block">If enabled, notice will be sent to all active employees</small>
                      </label>
                    </div>
                  </div>

                  {!noticeData.send_to_all && (
                    <div className="mb-3">
                      <label className="form-label">
                        Select Recipients 
                        {noticeData.recipient_user_ids.length > 0 && (
                          <span className="badge bg-primary ms-2">
                            {noticeData.recipient_user_ids.length} Selected
                          </span>
                        )}
                      </label>
                      
                      <div className="mb-2">
                        <label className="form-label small">Filter by Department</label>
                        <select
                          className="form-select form-select-sm"
                          value={selectedDepartment}
                          onChange={(e) => setSelectedDepartment(e.target.value)}
                        >
                          <option value="all">All Departments</option>
                          {departments.map(dept => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div 
                        className="border rounded p-3  bg-opacity-10" 
                        style={{ 
                          maxHeight: '300px', 
                          overflowY: 'auto'
                        }}
                      >
                        {getFilteredEmployees().length === 0 ? (
                          <p className="text-muted text-center mb-0">
                            {selectedDepartment === 'all' 
                              ? 'No employees available' 
                              : 'No employees found in this department'}
                          </p>
                        ) : (
                          <div className="row g-2">
                            {getFilteredEmployees().map(emp => (
                              <div key={emp.id} className="col-md-6">
                                <div className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`emp-${emp.id}`}
                                    checked={noticeData.recipient_user_ids.includes(emp.id)}
                                    onChange={() => handleEmployeeToggle(emp.id)}
                                  />
                                  <label 
                                    className="form-check-label" 
                                    htmlFor={`emp-${emp.id}`}
                                    style={{ cursor: 'pointer' }}
                                  >
                                    <strong>{emp.name}</strong>
                                    <br />
                                    <small className="text-muted">
                                      
                                      {(emp.departmentName || emp.department?.name) && (
                                        <span className="ms-1">• {emp.departmentName || emp.department?.name}</span>
                                      )}
                                    </small>
                                  </label>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <small className="text-muted">
                        {noticeData.recipient_user_ids.length === 0 && !noticeData.send_to_all && (
                          <span className="text-danger">Please select at least one employee</span>
                        )}
                        {noticeData.recipient_user_ids.length > 0 && (
                          <span>Select employees to receive this notice</span>
                        )}
                      </small>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label">Expiry Date (Optional)</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={noticeData.expires_at}
                      onChange={(e) => setNoticeData({ ...noticeData, expires_at: e.target.value })}
                    />
                    <small className="text-muted">Notice will automatically expire after this date</small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {selectedNotice ? 'Update Notice' : 'Create Notice'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Notice Modal */}
      {showViewModal && selectedNotice && (
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
                    setShowViewModal(false);
                    setSelectedNotice(null);
                    setNoticeReads([]);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                {/* Notice Type and Priority Badges */}
                <div className="mb-3">
                  <span className={`badge bg-info me-2`}>
                    {getNoticeTypeInfo(selectedNotice.notice_type).label}
                  </span>
                  <span className={`badge ${
                    selectedNotice.priority === 'URGENT' ? 'bg-danger' :
                    selectedNotice.priority === 'HIGH' ? 'bg-warning' :
                    selectedNotice.priority === 'MEDIUM' ? 'bg-info' : 'bg-secondary'
                  }`}>
                    {selectedNotice.priority}
                  </span>
                  <span className={`badge ms-2 ${
                    selectedNotice.status === 'PUBLISHED' ? 'bg-success' :
                    selectedNotice.status === 'DRAFT' ? 'bg-warning' : 'bg-secondary'
                  }`}>
                    {selectedNotice.status}
                  </span>
                </div>

                {/* Notice Content */}
                <div
                  className="notice-content mb-4 p-3 border rounded"
                  style={{ minHeight: '100px'}}
                  dangerouslySetInnerHTML={{ __html: formatNoticeContent(selectedNotice.content) }}
                />

                {/* Notice Details */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <p className="mb-2">
                      <strong>Created By:</strong> {selectedNotice.created_by_name}
                    </p>
                    <p className="mb-2">
                      <strong>Created At:</strong> {formatDate(selectedNotice.created_at)}
                    </p>
                    {selectedNotice.published_at && (
                      <p className="mb-2">
                        <strong>Published At:</strong> {formatDate(selectedNotice.published_at)}
                      </p>
                    )}
                  </div>
                  <div className="col-md-6">
                    <p className="mb-2">
                      <strong>Recipients:</strong>{' '}
                      {selectedNotice.send_to_all ? (
                        <span className="badge bg-primary">All Employees</span>
                      ) : (
                        <span className="badge bg-secondary">
                          {Array.isArray(selectedNotice.recipient_user_ids) 
                            ? selectedNotice.recipient_user_ids.length 
                            : 0} Selected
                        </span>
                      )}
                    </p>
                    {selectedNotice.expires_at && (
                      <p className="mb-2">
                        <strong>Expires At:</strong> {formatDate(selectedNotice.expires_at)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Edit Button for Draft */}
                {/* {selectedNotice.status === 'DRAFT' && (
                  <div className="mb-3">
                    <button
                      className="btn btn-primary"
                      onClick={() => handleEditNotice(selectedNotice)}
                    >
                      <i className="ri-edit-line me-1"></i>
                      Edit Notice
                    </button>
                  </div>
                )} */}

                {/* Notice Views for Published Notices */}
                {selectedNotice.status === 'PUBLISHED' && (
                  <div className="mt-4">
                    <h6 className="mb-3">
                      <i className="ri-eye-line me-2"></i>
                      Notice Views ({noticeReads.length})
                    </h6>
                    {loadingReads ? (
                      <div className="text-center py-3">
                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    ) : noticeReads.length === 0 ? (
                      <div className="alert alert-info">
                        <i className="ri-information-line me-2"></i>
                        No one has viewed this notice yet.
                      </div>
                    ) : (
                      <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <table className="table table-sm table-hover">
                          <thead className="table-light sticky-top">
                            <tr>
                              <th>Name</th>
                              <th>Department</th>
                              <th>Role</th>
                              <th>Viewed At</th>
                            </tr>
                          </thead>
                          <tbody>
                            {noticeReads.map((read) => (
                              <tr key={read.id}>
                                <td>{read.user_name || 'N/A'}</td>
                                <td>
                                  {read.department_name ? (
                                    <span className="text-dark text-light">{read.department_name}</span>
                                  ) : (
                                    <span className="text-muted">Unassigned</span>
                                  )}
                                </td>
                                <td>
                                  <span className="text-dark text-light">
                                    {read.user_role || 'N/A'}
                                  </span>
                                </td>
                                <td>{formatDate(read.read_at)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedNotice(null);
                    setNoticeReads([]);
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

export default NoticeManagement;

