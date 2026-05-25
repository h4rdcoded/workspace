import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import PageTitle from '../../Components/PageTitle';
import { buildApiUrl, getAuthHeaders } from '../../config/api';
import { toast } from 'react-toastify';

const WebJerry = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Form state
  const [taskId, setTaskId] = useState('');
  const [taskData, setTaskData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // Cache all users for validation
  const [activeTab, setActiveTab] = useState('update');
  
  // Update form
  const [updateForm, setUpdateForm] = useState({
    title: '',
    description: '',
    assigned_date: '',
    due_date: '',
    priority: '',
    status: ''
  });
  
  // Log form
  const [logForm, setLogForm] = useState({
    user_id: '',
    manual_user_id: '',
    validated_user_name: '',
    is_user_validated: false,
    work_done: '',
    file_location: '',
    changes_made: '',
    challenges: '',
    time_spent: '',
    log_date: ''
  });
  
  // Comment form
  const [commentForm, setCommentForm] = useState({
    user_id: '',
    manual_user_id: '',
    validated_user_name: '',
    is_user_validated: false,
    comment: '',
    comment_type: 'UPDATE',
    comment_date: ''
  });
  
  const [message, setMessage] = useState({ type: '', text: '' });
  const [validatingUser, setValidatingUser] = useState(false); // Loading state for validation

  // Fetch employees on mount
  useEffect(() => {
    fetchEmployees();
    fetchAllUsers();
    
    // Get current user ID from localStorage (using lead_crm_user key)
    const userData = localStorage.getItem('lead_crm_user');
    console.log('=== INITIAL USER DATA LOAD ===');
    console.log('Raw userData:', userData);
    
    if (userData) {
      try {
        const user = JSON.parse(userData);
        console.log('Parsed user:', user);
        console.log('User ID:', user.id);
        
        // Pre-fill user_id for log and comment forms with current user
        if (user.id) {
          const userIdStr = user.id.toString();
          setLogForm(prev => ({ ...prev, user_id: userIdStr }));
          setCommentForm(prev => ({ ...prev, user_id: userIdStr }));
          console.log('✅ User ID set in forms:', userIdStr);
        } else {
          console.warn('⚠️ User object has no id property');
        }
      } catch (err) {
        console.error('❌ Error parsing user data:', err);
      }
    } else {
      console.warn('⚠️ No user data found in localStorage');
    }
  }, []);

  // Check authentication on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem('webjerry_auth');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === '@Webjerry7757') {
      localStorage.setItem('webjerry_auth', 'true');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Invalid password');
    }
  };

  const logout = () => {
    localStorage.removeItem('webjerry_auth');
    setIsAuthenticated(false);
    setPassword('');
  };

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      console.log('Fetching employees...');
      const response = await axios.get(`${buildApiUrl('/users?role=EMPL')}`, {
        headers: getAuthHeaders()
      });
      console.log('Employee response:', response.data);
      
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        setEmployees(response.data.data);
        console.log('Employees loaded:', response.data.data.length);
      } else {
        console.warn('No employees data in response');
        setEmployees([]);
      }
    } catch (err) {
      console.error('Error fetching employees:', err.response?.data || err.message);
      setEmployees([]);
    }
  };

  // Fetch all users for validation
  const fetchAllUsers = async () => {
    try {
      console.log('Fetching all users...');
      const response = await axios.get(`${buildApiUrl('/users')}`, {
        headers: getAuthHeaders()
      });
      console.log('All users response:', response.data);
      
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        setAllUsers(response.data.data);
        console.log('All users loaded:', response.data.data.length);
      } else {
        console.warn('No users data in response');
        setAllUsers([]);
      }
    } catch (err) {
      console.error('Error fetching all users:', err.response?.data || err.message);
      setAllUsers([]);
    }
  };

  // Validate manual user ID with API call
  const validateManualUserId = async (manualUserId) => {
    try {
      if (!manualUserId || !manualUserId.trim()) {
        return { valid: false, error: 'User ID is required', userName: '' };
      }
      
      const userIdNum = parseInt(manualUserId);
      if (isNaN(userIdNum)) {
        return { valid: false, error: 'Invalid User ID format', userName: '' };
      }
      
      // Make API call to validate user
      console.log('=== VALIDATING USER ===');
      console.log('Validating user ID:', userIdNum);
      const response = await axios.get(`${buildApiUrl(`/users/${userIdNum}`)}`, {
        headers: getAuthHeaders()
      });
      
      console.log('User validation response:', response.data);
      console.log('Response data object:', JSON.stringify(response.data, null, 2));
      
      if (response.data && response.data.data) {
        // Handle both nested {data: {user: {...}}} and flat {data: {...}} structures
        const userData = response.data.data.user || response.data.data;
        const user = userData;
        
        console.log('Extracted user object:', user);
        console.log('User.name:', user.name);
        console.log('User.username:', user.username);
        console.log('User.email:', user.email);
        
        // Try multiple possible name fields
        const actualUserName = user.name || user.username || user.email || `User #${userIdNum}`;
        
        console.log('Using username:', actualUserName);
        
        return { 
          valid: true, 
          userId: userIdNum,
          userName: actualUserName
        };
      } else if (response.data && Array.isArray(response.data)) {
        // Handle case where response is an array
        const user = response.data.find(u => u.id === userIdNum);
        if (user) {
          const actualUserName = user.name || user.username || user.email || `User #${userIdNum}`;
          console.log('Found user in array:', actualUserName);
          return { 
            valid: true, 
            userId: userIdNum,
            userName: actualUserName
          };
        }
      }
      
      return { valid: false, error: 'User not found with this ID', userName: '' };
    } catch (err) {
      console.error('User validation error:', err.response?.data || err.message);
      console.error('Error status:', err.response?.status);
      console.error('Error headers:', err.response?.headers);
      if (err.response?.status === 404) {
        return { valid: false, error: 'User not found with this ID', userName: '' };
      }
      return { valid: false, error: 'Invalid User ID. Please check and try again.', userName: '' };
    }
  };

  // Handle validate button click for Log form
  const handleValidateLogUser = async () => {
    if (!logForm.manual_user_id) {
      toast.warning('Please enter a User ID first');
      return;
    }
    
    setValidatingUser(true);
    const result = await validateManualUserId(logForm.manual_user_id);
    setValidatingUser(false);
    
    if (result.valid) {
      setLogForm(prev => ({
        ...prev,
        validated_user_name: result.userName,
        is_user_validated: true
      }));
      toast.success(`✓ Validated: ${result.userName}`);
    } else {
      setLogForm(prev => ({
        ...prev,
        validated_user_name: '',
        is_user_validated: false
      }));
      toast.error(result.error);
    }
  };

  // Handle validate button click for Comment form
  const handleValidateCommentUser = async () => {
    if (!commentForm.manual_user_id) {
      toast.warning('Please enter a User ID first');
      return;
    }
    
    setValidatingUser(true);
    const result = await validateManualUserId(commentForm.manual_user_id);
    setValidatingUser(false);
    
    if (result.valid) {
      setCommentForm(prev => ({
        ...prev,
        validated_user_name: result.userName,
        is_user_validated: true
      }));
      toast.success(`✓ Validated: ${result.userName}`);
    } else {
      setCommentForm(prev => ({
        ...prev,
        validated_user_name: '',
        is_user_validated: false
      }));
      toast.error(result.error);
    }
  };

  // Fetch task details
  const fetchTaskDetails = async () => {
    if (!taskId) {
      toast.error('Please enter a Task ID first');
      return;
    }
    
    try {
      const response = await axios.get(`${buildApiUrl(`/data/task/${taskId}`)}`, {
        headers: getAuthHeaders()
      });
      setTaskData(response.data.data);
      
      console.log('Task loaded:', response.data.data);
      console.log('Assigned to:', response.data.data.assigned_to);
      
      // Pre-fill update form
      setUpdateForm({
        title: response.data.data.title || '',
        description: response.data.data.description || '',
        assigned_date: response.data.data.created_at ? new Date(response.data.data.created_at).toISOString().slice(0, 16) : '',
        due_date: response.data.data.due_date ? new Date(response.data.data.due_date).toISOString().slice(0, 16) : '',
        priority: response.data.data.priority || '',
        status: response.data.data.status || ''
      });
      
      toast.success('Task loaded successfully');
    } catch (err) {
      console.error('Error fetching task:', err);
      toast.error('Failed to load task details');
    }
  };

  // Silent task update
  const handleSilentUpdate = async (e) => {
    e.preventDefault();
    
    if (!taskId || !taskData) {
      toast.error('Please load a task first before updating');
      return;
    }
    
    try {
      const updateData = {};
      if (updateForm.title) updateData.title = updateForm.title;
      if (updateForm.description) updateData.description = updateForm.description;
      if (updateForm.assigned_date) updateData.assigned_date = updateForm.assigned_date;
      if (updateForm.due_date) updateData.due_date = updateForm.due_date;
      if (updateForm.priority) updateData.priority = updateForm.priority;
      if (updateForm.status) updateData.status = updateForm.status;
      
      const response = await axios.post(`${buildApiUrl(`/data/sync/${taskId}`)}`, updateData, {
        headers: getAuthHeaders()
      });
      
      toast.success('Task updated successfully');
      fetchTaskDetails();
    } catch (err) {
      console.error('Error updating task:', err);
      toast.error(err.response?.data?.message || 'Failed to update task');
    }
  };

  // Add log with custom date
  const handleAddLog = async (e) => {
    e.preventDefault();
    
    if (!taskId || !taskData) {
      toast.error('Please load a task first before adding a log');
      return;
    }
    
    console.log('=== HANDLE ADD LOG ===');
    console.log('taskId:', taskId);
    console.log('logForm.user_id:', logForm.user_id);
    console.log('logForm.manual_user_id:', logForm.manual_user_id);
    console.log('logForm.is_user_validated:', logForm.is_user_validated);
    console.log('Full logForm:', logForm);
    
    // Determine which user ID to use
    let finalUserId = logForm.user_id; // Default to current user
    
    // If manual user ID is provided and validated, use it
    if (logForm.manual_user_id && logForm.manual_user_id.trim() && logForm.is_user_validated) {
      finalUserId = parseInt(logForm.manual_user_id);
      console.log('Using validated manual User ID:', finalUserId);
    } else if (logForm.manual_user_id && logForm.manual_user_id.trim() && !logForm.is_user_validated) {
      toast.error('Please validate the User ID before submitting');
      return;
    }
    
    if (!finalUserId) {
      toast.error('User ID is missing. Please refresh the page.');
      return;
    }
    
    if (!logForm.work_done.trim()) {
      toast.error('Work Done is required');
      return;
    }
    
    try {
      const logData = {
        task_id: parseInt(taskId),
        user_id: parseInt(finalUserId),
        work_done: logForm.work_done,
        file_location: logForm.file_location,
        changes_made: logForm.changes_made,
        challenges: logForm.challenges,
        time_spent: parseFloat(logForm.time_spent) || 0,
        log_date: logForm.log_date || new Date().toISOString()
      };
      
      console.log('Sending payload:', logData);
      
      const response = await axios.post(`${buildApiUrl('/data/log')}`, logData, {
        headers: getAuthHeaders()
      });
      
      toast.success('Log added successfully');
      setLogForm({
        user_id: '',
        manual_user_id: '',
        validated_user_name: '',
        is_user_validated: false,
        work_done: '',
        file_location: '',
        changes_made: '',
        challenges: '',
        time_spent: '',
        log_date: ''
      });
    } catch (err) {
      console.error('Error adding log:', err.response?.data || err);
      toast.error(err.response?.data?.message || 'Failed to add log');
    }
  };

  // Add comment with custom date
  const handleAddComment = async (e) => {
    e.preventDefault();
    
    if (!taskId || !taskData) {
      toast.error('Please load a task first before adding a comment');
      return;
    }
    
    console.log('=== HANDLE ADD COMMENT ===');
    console.log('taskId:', taskId);
    console.log('commentForm.user_id:', commentForm.user_id);
    console.log('commentForm.manual_user_id:', commentForm.manual_user_id);
    console.log('commentForm.is_user_validated:', commentForm.is_user_validated);
    
    // Determine which user ID to use
    let finalUserId = commentForm.user_id; // Default to current user
    
    // If manual user ID is provided and validated, use it
    if (commentForm.manual_user_id && commentForm.manual_user_id.trim() && commentForm.is_user_validated) {
      finalUserId = parseInt(commentForm.manual_user_id);
      console.log('Using validated manual User ID:', finalUserId);
    } else if (commentForm.manual_user_id && commentForm.manual_user_id.trim() && !commentForm.is_user_validated) {
      toast.error('Please validate the User ID before submitting');
      return;
    }
    
    if (!finalUserId) {
      toast.error('User ID is missing. Please refresh the page.');
      return;
    }
    
    if (!commentForm.comment.trim()) {
      toast.error('Comment is required');
      return;
    }
    
    try {
      const commentData = {
        task_id: parseInt(taskId),
        user_id: parseInt(finalUserId),
        comment: commentForm.comment,
        comment_type: commentForm.comment_type,
        comment_date: commentForm.comment_date || new Date().toISOString()
      };
      
      const response = await axios.post(`${buildApiUrl('/data/comment')}`, commentData, {
        headers: getAuthHeaders()
      });
      
      toast.success('Comment added successfully');
      setCommentForm({
        user_id: '',
        manual_user_id: '',
        validated_user_name: '',
        is_user_validated: false,
        comment: '',
        comment_type: 'UPDATE',
        comment_date: ''
      });
    } catch (err) {
      console.error('Error adding comment:', err.response?.data || err);
      toast.error(err.response?.data?.message || 'Failed to add comment');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="authentication-page">
        <div className="container">
          <div className="row justify-content-center align-items-center min-vh-100">
            <div className="col-md-6 col-lg-4">
              <div className="card shadow-lg border-0">
                <div className="card-body p-5">
                  <div className="text-center mb-4">
                    <i className="ri-lock-2-fill display-1 text-primary"></i>
                    <h3 className="mt-3 fw-semibold">Authentication Required</h3>
                    <p className="text-muted">Please enter password to continue</p>
                  </div>
                  <form onSubmit={handlePasswordSubmit}>
                    <div className="mb-3">
                      <label className="form-label">Password</label>
                      <input
                        type="password"
                        className="form-control form-control-lg"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                      />
                    </div>
                    {error && <div className="alert alert-danger">{error}</div>}
                    <button
                      type="submit"
                      className="btn btn-primary w-100 py-2 fw-semibold"
                    >
                      Login
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="page-content">
        <div className="container-fluid">
          <PageTitle title="Task Management" primary="Home" />
          
          {/* Toast notifications will appear here */}
          
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header bg-light">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="card-title mb-0">Task Management Interface</h5>
                    <button
                      onClick={logout}
                      className="btn btn-danger btn-sm"
                    >
                      <i className="ri-logout-box-line me-1"></i>
                      Logout
                    </button>
                  </div>
                </div>
                
                <div className="card-body">
                  {/* Task ID Input */}
                  <div className="card mb-3">
                    <div className="card-body">
                      <div className="row g-3">
                        <div className="col-md-8">
                          <label className="form-label fw-semibold">Task ID</label>
                          <input
                            type="number"
                            className="form-control form-control-lg"
                            value={taskId}
                            onChange={(e) => setTaskId(e.target.value)}
                            placeholder="Enter task ID"
                          />
                        </div>
                        <div className="col-md-4 d-flex align-items-end">
                          <button
                            onClick={fetchTaskDetails}
                            className="btn btn-outline-primary w-100 py-2"
                          >
                            <i className="ri-search-line me-1"></i>
                            Load Task
                          </button>
                        </div>
                      </div>
                      
                      {/* Task Loaded Indicator */}
                      {taskData && (
                        <div className="alert alert-success mt-3 mb-0">
                          <i className="ri-check-line me-2"></i>
                          <strong>Task Loaded:</strong> {taskData.title} (ID: {taskData.id})
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tabs */}
                  <ul className="nav nav-tabs mb-3" role="tablist">
                    <li className="nav-item" role="presentation">
                      <button
                        className={`nav-link ${activeTab === 'update' ? 'active' : ''}`}
                        onClick={() => setActiveTab('update')}
                        type="button"
                      >
                        <i className="ri-edit-line me-1"></i>
                        Update Task
                      </button>
                    </li>
                    <li className="nav-item" role="presentation">
                      <button
                        className={`nav-link ${activeTab === 'log' ? 'active' : ''}`}
                        onClick={() => setActiveTab('log')}
                        type="button"
                      >
                        <i className="ri-file-list-3-line me-1"></i>
                        Add Log
                      </button>
                    </li>
                    <li className="nav-item" role="presentation">
                      <button
                        className={`nav-link ${activeTab === 'comment' ? 'active' : ''}`}
                        onClick={() => setActiveTab('comment')}
                        type="button"
                      >
                        <i className="ri-message-2-line me-1"></i>
                        Add Comment
                      </button>
                    </li>
                  </ul>

                  {/* Tab Content */}
                  <div className="tab-content">
                    {/* Update Tab */}
                    {activeTab === 'update' && (
                      <div className="tab-pane fade show active">
                        <form onSubmit={handleSilentUpdate}>
                          <div className="row g-3">
                            <div className="col-12">
                              <label className="form-label fw-semibold">Title</label>
                              <input
                                type="text"
                                className="form-control"
                                value={updateForm.title}
                                onChange={(e) => setUpdateForm({...updateForm, title: e.target.value})}
                              />
                            </div>
                            
                            <div className="col-12">
                              <label className="form-label fw-semibold">Description</label>
                              <textarea
                                className="form-control"
                                rows={4}
                                value={updateForm.description}
                                onChange={(e) => setUpdateForm({...updateForm, description: e.target.value})}
                              />
                            </div>
                            
                            <div className="col-md-6">
                              <label className="form-label fw-semibold">Assigned Date</label>
                              <input
                                type="datetime-local"
                                className="form-control"
                                value={updateForm.assigned_date}
                                onChange={(e) => setUpdateForm({...updateForm, assigned_date: e.target.value})}
                              />
                            </div>
                            
                            <div className="col-md-6">
                              <label className="form-label fw-semibold">Due Date</label>
                              <input
                                type="datetime-local"
                                className="form-control"
                                value={updateForm.due_date}
                                onChange={(e) => setUpdateForm({...updateForm, due_date: e.target.value})}
                              />
                            </div>
                            
                            <div className="col-md-6">
                              <label className="form-label fw-semibold">Priority</label>
                              <select
                                className="form-select"
                                value={updateForm.priority}
                                onChange={(e) => setUpdateForm({...updateForm, priority: e.target.value})}
                              >
                                <option value="">Select Priority</option>
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="URGENT">Urgent</option>
                              </select>
                            </div>
                            
                            <div className="col-md-4">
                              <label className="form-label fw-semibold">Status</label>
                              <select
                                className="form-select"
                                value={updateForm.status}
                                onChange={(e) => setUpdateForm({...updateForm, status: e.target.value})}
                              >
                                <option value="">Select Status</option>
                                <option value="CREATED">Created</option>
                                <option value="ASSIGNED">Assigned</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="SUBMITTED">Submitted</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="CANCELLED">Cancelled</option>
                              </select>
                            </div>
                            
                            <div className="col-12">
                              <button
                                type="submit"
                                className="btn btn-success"
                              >
                                <i className="ri-check-line me-1"></i>
                                Update Task
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Log Tab */}
                    {activeTab === 'log' && (
                      <div className="tab-pane fade show active">
                        <form onSubmit={handleAddLog}>
                          <div className="row g-3">
                            <div className="col-md-12">
                              <label className="form-label fw-semibold">Work Done *</label>
                              <textarea
                                className="form-control"
                                rows={3}
                                value={logForm.work_done}
                                onChange={(e) => setLogForm({...logForm, work_done: e.target.value})}
                                required
                                placeholder="Describe the work completed..."
                              />
                            </div>
                            
                            <div className="col-md-6">
                              <label className="form-label fw-semibold">
                                User ID (Optional)
                                <span className="text-muted small d-block">Leave empty to use your ID ({logForm.user_id || 'Current User'})</span>
                              </label>
                              <div className="input-group">
                                <input
                                  type="number"
                                  className="form-control"
                                  value={logForm.manual_user_id}
                                  onChange={(e) => {
                                    setLogForm({...logForm, manual_user_id: e.target.value});
                                    // Reset validation when user changes the ID
                                    if (logForm.is_user_validated) {
                                      setLogForm(prev => ({ ...prev, is_user_validated: false, validated_user_name: '' }));
                                    }
                                  }}
                                  placeholder="Enter different User ID (optional)"
                                  disabled={validatingUser}
                                />
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary"
                                  onClick={handleValidateLogUser}
                                  title="Validate User ID"
                                  disabled={validatingUser || !logForm.manual_user_id}
                                >
                                  {validatingUser ? (
                                    <i className="ri-loader-4-line ri-spin"></i>
                                  ) : (
                                    <i className="ri-user-check-line"></i>
                                  )}
                                </button>
                              </div>
                              {logForm.is_user_validated && logForm.validated_user_name && (
                                <div className="text-success mt-1 small">
                                  <i className="ri-check-circle-line"></i> Validated: {logForm.validated_user_name}
                                </div>
                              )}
                            </div>
                            
                            <div className="col-md-6">
                              <label className="form-label fw-semibold">Time Spent (minutes)</label>
                              <input
                                type="number"
                                className="form-control"
                                value={logForm.time_spent}
                                onChange={(e) => setLogForm({...logForm, time_spent: e.target.value})}
                                placeholder="e.g., 60"
                              />
                            </div>
                            
                            <div className="col-md-6">
                              <label className="form-label fw-semibold">Changes Made</label>
                              <textarea
                                className="form-control"
                                rows={2}
                                value={logForm.changes_made}
                                onChange={(e) => setLogForm({...logForm, changes_made: e.target.value})}
                                placeholder="Brief description of changes..."
                              />
                            </div>
                            
                            <div className="col-md-6">
                              <label className="form-label fw-semibold">File Location</label>
                              <input
                                type="text"
                                className="form-control"
                                value={logForm.file_location}
                                onChange={(e) => setLogForm({...logForm, file_location: e.target.value})}
                                placeholder="/path/to/file"
                              />
                            </div>
                            
                            <div className="col-md-6">
                              <label className="form-label fw-semibold">Challenges</label>
                              <textarea
                                className="form-control"
                                rows={2}
                                value={logForm.challenges}
                                onChange={(e) => setLogForm({...logForm, challenges: e.target.value})}
                                placeholder="Any challenges faced..."
                              />
                            </div>
                            
                            <div className="col-md-6">
                              <label className="form-label fw-semibold">Log Date/Time</label>
                              <input
                                type="datetime-local"
                                className="form-control"
                                value={logForm.log_date}
                                onChange={(e) => setLogForm({...logForm, log_date: e.target.value})}
                              />
                            </div>
                            
                            <div className="col-12">
                              <button
                                type="submit"
                                className="btn btn-primary"
                              >
                                <i className="ri-add-line me-1"></i>
                                Add Log Entry
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Comment Tab */}
                    {activeTab === 'comment' && (
                      <div className="tab-pane fade show active">
                        <form onSubmit={handleAddComment}>
                          <div className="row g-3">
                            <div className="col-md-6">
                              <label className="form-label fw-semibold">
                                User ID (Optional)
                                <span className="text-muted small d-block">Leave empty to use your ID ({commentForm.user_id || 'Current User'})</span>
                              </label>
                              <div className="input-group">
                                <input
                                  type="number"
                                  className="form-control"
                                  value={commentForm.manual_user_id}
                                  onChange={(e) => {
                                    setCommentForm({...commentForm, manual_user_id: e.target.value});
                                    // Reset validation when user changes the ID
                                    if (commentForm.is_user_validated) {
                                      setCommentForm(prev => ({ ...prev, is_user_validated: false, validated_user_name: '' }));
                                    }
                                  }}
                                  placeholder="Enter different User ID (optional)"
                                  disabled={validatingUser}
                                />
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary"
                                  onClick={handleValidateCommentUser}
                                  title="Validate User ID"
                                  disabled={validatingUser || !commentForm.manual_user_id}
                                >
                                  {validatingUser ? (
                                    <i className="ri-loader-4-line ri-spin"></i>
                                  ) : (
                                    <i className="ri-user-check-line"></i>
                                  )}
                                </button>
                              </div>
                              {commentForm.is_user_validated && commentForm.validated_user_name && (
                                <div className="text-success mt-1 small">
                                  <i className="ri-check-circle-line"></i> Validated: {commentForm.validated_user_name}
                                </div>
                              )}
                            </div>
                            
                            <div className="col-md-6">
                              <label className="form-label fw-semibold">Comment Type</label>
                              <select
                                className="form-select"
                                value={commentForm.comment_type}
                                onChange={(e) => setCommentForm({...commentForm, comment_type: e.target.value})}
                              >
                                <option value="UPDATE">Update</option>
                                <option value="FEEDBACK">Feedback</option>
                                <option value="QUESTION">Question</option>
                                <option value="APPROVAL">Approval</option>
                              </select>
                            </div>
                            
                            <div className="col-md-6">
                              <label className="form-label fw-semibold">Comment Date/Time</label>
                              <input
                                type="datetime-local"
                                className="form-control"
                                value={commentForm.comment_date}
                                onChange={(e) => setCommentForm({...commentForm, comment_date: e.target.value})}
                              />
                            </div>
                            
                            <div className="col-12">
                              <label className="form-label fw-semibold">Comment *</label>
                              <textarea
                                className="form-control"
                                rows={4}
                                value={commentForm.comment}
                                onChange={(e) => setCommentForm({...commentForm, comment: e.target.value})}
                                required
                                placeholder="Enter your comment..."
                              />
                            </div>
                            
                            <div className="col-12">
                              <button
                                type="submit"
                                className="btn btn-warning"
                              >
                                <i className="ri-chat-add-line me-1"></i>
                                Add Comment
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebJerry;
