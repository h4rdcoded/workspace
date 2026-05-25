import React, { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../Context/ConfigContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { buildApiUrl, getAuthHeaders } from '../../config/api';
import { useParams, useNavigate } from 'react-router-dom';

const EmployeeTaskViewPage = () => {
  const { leadCrmUser } = useContext(ConfigContext);
  const { taskId } = useParams();
  const navigate = useNavigate();
  
  const [task, setTask] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState('UPDATE');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ type: '', url: '', name: '' });
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitNotes, setSubmitNotes] = useState('');
  const [submitFiles, setSubmitFiles] = useState([]);
  const [activeTab, setActiveTab] = useState('details'); // details, comments, attachments
  // New states for logs functionality
  const [logs, setLogs] = useState([]);
  const [subtaskLogs, setSubtaskLogs] = useState({}); // Object to store logs for each subtask
  // Pagination states for logs
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(5);

  // Helper function to get file icon based on file type
  const getFileIcon = (fileType) => {
    if (!fileType) return 'unknown';
    
    if (fileType.includes('pdf')) return 'pdf';
    if (fileType.includes('image')) return 'image';
    if (fileType.includes('word')) return 'word';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'excel';
    if (fileType.includes('zip') || fileType.includes('compressed')) return 'zip';
    if (fileType.includes('audio')) return 'music';
    if (fileType.includes('video')) return 'video';
    
    return 'text';
  };

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper function to format time spent
  const formatTimeSpent = (minutes) => {
    if (!minutes) return '0 minutes';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}${mins > 0 ? ` ${mins} minute${mins !== 1 ? 's' : ''}` : ''}`;
    }
    return `${mins} minute${mins !== 1 ? 's' : ''}`;
  };

  // Function to open attachment in modal
  const openAttachment = (attachment) => {
    // Construct full URL for the attachment
    const baseUrl = process.env.REACT_APP_SERVER_URL || 'https://task.ipshopy.com';
    const fullUrl = `${baseUrl}${attachment.file_path}`;
    
    setModalContent({
      type: attachment.file_type,
      url: fullUrl,
      name: attachment.file_name
    });
    setShowModal(true);
  };

  // Function to close modal
  const closeModal = () => {
    setShowModal(false);
    setModalContent({ type: '', url: '', name: '' });
  };

  // Handle file selection for submit modal
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSubmitFiles(files);
  };

  // Fetch task details
  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(
        buildApiUrl(`/tasks/${taskId}`),
        { headers: getAuthHeaders() }
      );
      
      

      if (response.data.success) {
        setTask(response.data.data.task);
        if (response.data.data.subtasks) {
         
          setSubtasks(response.data.data.subtasks);
        } else {
          setSubtasks([]);
        }
        setAttachments(response.data.data.attachments || []);
      } else {
        
        setTask(null);
        setSubtasks([]);
        setAttachments([]);
        
        // Handle "Task not found" error specifically
        toast.error(response.data.message || 'Failed to load task details');
        
        if (response.data.message === "Task not found") {
          
          // Use a shorter timeout for better user experience
          setTimeout(() => {
            navigate('/employee/tasks');
          }, 2000);
        }
      }
    } catch (error) {
      
      setTask(null);
      setSubtasks([]);
      setAttachments([]);
      
      if (error.response && error.response.status === 404) {
        
        toast.error('Task not found. Redirecting to tasks list.');
        setTimeout(() => {
          navigate('/employee/tasks');
        }, 1500);
      } else if (error.response && error.response.data && error.response.data.message === "Task not found") {
        
        toast.error('Task not found. Redirecting to tasks list.');
        setTimeout(() => {
          navigate('/employee/tasks');
        }, 1500);
      } else if (error.response) {
        
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to load task details'}`);
      } else {
        toast.error('Network error: Failed to load task details');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch task comments
  const fetchTaskComments = async () => {
    try {
      const response = await axios.get(
        buildApiUrl(`/tasks/${taskId}/comments`),
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        setComments(response.data.data.comments || []);
      }
    } catch (error) {
      
    }
  };

  // Fetch task logs
  const fetchTaskLogs = async () => {
    try {
      // Fetch logs for the main task
      const mainTaskResponse = await axios.get(
        buildApiUrl(`/tasks/${taskId}/logs`),
        { headers: getAuthHeaders() }
      );

      let allLogs = [];
      let subtaskLogsObj = {};
      
      if (mainTaskResponse.data.success) {
        // Add main task logs with task_type identifier
        allLogs = mainTaskResponse.data.data.logs.map(log => ({
          ...log,
          task_type: 'main',
          task_title: task?.title || 'Main Task',
          task_id: taskId
        })) || [];
      }

      // Fetch logs for each subtask
      for (const subtask of subtasks) {
        try {
          const subtaskResponse = await axios.get(
            buildApiUrl(`/tasks/${subtask.id}/logs`),
            { headers: getAuthHeaders() }
          );
          
          if (subtaskResponse.data.success) {
            // Add subtask logs with task_type identifier
            const subtaskLogs = subtaskResponse.data.data.logs.map(log => ({
              ...log,
              task_type: 'subtask',
              task_title: subtask.title,
              task_id: subtask.id,
              parent_task_id: taskId
            })) || [];
            
            // Store subtask logs in separate object for easy access
            subtaskLogsObj[subtask.id] = subtaskLogs;
            
            // Add subtask logs to all logs array
            allLogs = [...allLogs, ...subtaskLogs];
          }
        } catch (subtaskError) {
          
        }
      }

      // Sort logs by created_at timestamp (newest first)
      allLogs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setLogs(allLogs);
      setSubtaskLogs(subtaskLogsObj);
      setCurrentPage(1); // Reset to first page when logs are fetched
    } catch (error) {
      
    }
  };

  // Handle adding a comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }
    
    try {
      const payload = {
        comment: newComment,
        comment_type: commentType
      };

      const response = await axios.post(
        buildApiUrl(`/tasks/${taskId}/comments`),
        payload,
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        toast.success('Comment added successfully');
        setNewComment('');
        fetchTaskComments(); // Refresh comments
      } else {
        toast.error(`Failed to add comment: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to add comment'}`);
      } else {
        toast.error('Network error: Failed to add comment');
      }
    }
  };

  // Handle task submission
  const handleSubmitTask = async () => {
    try {
      // Check if daily logs are written for ALL tasks (both main tasks and subtasks)
      if (logs.length === 0) {
        toast.error('Please write at least one daily log before submitting the task.');
        return;
      }

      // First upload attachments if any
      if (submitFiles.length > 0) {
        const formData = new FormData();
        
        for (let i = 0; i < submitFiles.length; i++) {
          formData.append('attachment', submitFiles[i]);
        }
        
        try {
          await axios.post(
            buildApiUrl(`/tasks/${taskId}/attachments`),
            formData,
            {
              headers: {
                ...getAuthHeaders(),
                'Content-Type': 'multipart/form-data'
              }
            }
          );
          toast.success('Attachments uploaded successfully');
        } catch (uploadError) {
          
          toast.error('Failed to upload attachments');
          return; // Don't proceed with submission if attachment upload fails
        }
      }
      
      // Ensure completion_notes is never empty
      const completionNotes = submitNotes.trim() || 'Task completed';
      
      const payload = {
        status: 'SUBMITTED',
        completion_notes: completionNotes
      };

      const response = await axios.put(
        buildApiUrl(`/tasks/${taskId}/status`),
        payload,
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        toast.success('Task submitted to Team Leader for review');
        setShowSubmitModal(false);
        setSubmitNotes('');
        setSubmitFiles([]);
        // Refresh task details
        fetchTaskDetails();
        fetchTaskComments(); // Refresh comments
      } else {
        toast.error(`Failed to submit task: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {

      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to submit task'}`);
      } else {
        toast.error('Network error: Failed to submit task');
      }
    }
  };

  // Get current logs for pagination
  const getCurrentLogs = () => {
    const indexOfLastLog = currentPage * logsPerPage;
    const indexOfFirstLog = indexOfLastLog - logsPerPage;
    return logs.slice(indexOfFirstLog, indexOfLastLog);
  };

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Previous page
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Next page
  const nextPage = () => {
    if (currentPage < Math.ceil(logs.length / logsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Get logs for a specific subtask
  const getSubtaskLogs = (subtaskId) => {
    return subtaskLogs[subtaskId] || [];
  };

  useEffect(() => {
    fetchTaskDetails();
    fetchTaskComments();
  }, [taskId]);

  // Fetch logs when task and subtasks are available
  useEffect(() => {
    if (task && subtasks.length >= 0) {
      fetchTaskLogs();
    }
  }, [task, subtasks]);

  if (loading) {
    return (
      <div className="main-content">
        <div className="page-content">
          <div className="container-fluid">
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
              <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted">Loading task details...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error message if task failed to load
  if (!task && !loading) {
    return (
      <div className="main-content">
        <div className="page-content">
          <div className="container-fluid">
            <div className="row">
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white border-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <h4 className="mb-0">Task Not Found</h4>
                      <button 
                        className="btn btn-outline-secondary"
                        onClick={() => navigate(-1)}
                      >
                        <i className="ri-arrow-left-line me-2"></i>
                        Back
                      </button>
                    </div>
                  </div>
                  <div className="card-body text-center py-5">
                    <i className="ri-error-warning-line text-danger display-4"></i>
                    <h5 className="mt-3">Unable to Load Task</h5>
                    <p className="text-muted">
                      The task you're trying to access could not be found or you don't have permission to view it.
                    </p>
                    <button 
                      className="btn btn-outline-primary"
                      onClick={() => navigate('/dashboard')}
                    >
                      Go to Dashboard
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get current logs for display
  const currentLogs = getCurrentLogs();
  const totalPages = Math.ceil(logs.length / logsPerPage);

  return (
    <div className="main-content">
      <div className="page-content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              {/* Header */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h4 className="mb-0">Task Details</h4>
                      <p className="text-muted mb-0">View task information and subtasks</p>
                    </div>
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-outline-secondary"
                        onClick={() => navigate(-1)}
                      >
                        <i className="ri-arrow-left-line me-2"></i>
                        Back
                      </button>
                      {/* Submit button - only show if task is not already submitted or completed */}
                      {task.status !== 'SUBMITTED' && task.status !== 'COMPLETED' && (
                        <button 
                          className="btn btn-success"
                          onClick={() => setShowSubmitModal(true)}
                        >
                          <i className="ri-send-plane-line me-2"></i>
                          Submit to TL
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Task Overview Card */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h2 className="mb-2">{task.title}</h2>
                          <div className="d-flex gap-2 mb-3">
                            <span className={`badge ${
                              task.status === 'COMPLETED' ? 'bg-success' : 
                              task.status === 'IN_PROGRESS' ? 'bg-warning' : 
                              task.status === 'PENDING' ? 'bg-info' : 
                              task.status === 'SUBMITTED' ? 'bg-primary' : 
                              'bg-secondary'
                            }`}>
                              {task.status.replace('_', ' ')}
                            </span>
                            <span className={`badge ${
                              task.priority === 'URGENT' ? 'bg-danger' :
                              task.priority === 'HIGH' ? 'bg-warning' : 
                              task.priority === 'MEDIUM' ? 'bg-info' : 'bg-secondary'
                            }`}>
                              {task.priority}
                            </span>
                            {task.task_type === 'SUBTASK' && (
                              <span className="badge bg-info">Subtask</span>
                            )}
                          </div>
                          <p className="text-muted mb-0">{task.description}</p>
                        </div>
                        <div className="text-end">
                          <p className="mb-1"><small className="text-muted">Due Date</small></p>
                          <h5 className={new Date(task.due_date) < new Date() && task.status !== 'COMPLETED' ? 'text-danger' : ''}>
                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                          </h5>
                          <p className="mb-0 mt-2"><small className="text-muted">Assigned to</small></p>
                          <p className="mb-0">{task.assigned_to_name || 'Unassigned'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body p-0">
                      <ul className="nav nav-tabs nav-tabs-custom nav-justified" role="tablist">
                        <li className="nav-item">
                          <a 
                            className={`nav-link ${activeTab === 'details' ? 'active' : ''}`}
                            onClick={() => setActiveTab('details')}
                            role="tab"
                          >
                            <i className="ri-file-list-line me-2"></i>
                            Task Details
                          </a>
                        </li>
                        <li className="nav-item">
                          <a 
                            className={`nav-link ${activeTab === 'comments' ? 'active' : ''}`}
                            onClick={() => setActiveTab('comments')}
                            role="tab"
                          >
                            <i className="ri-discuss-line me-2"></i>
                            Comments ({comments.length})
                          </a>
                        </li>
                        <li className="nav-item">
                          <a 
                            className={`nav-link ${activeTab === 'logs' ? 'active' : ''}`}
                            onClick={() => setActiveTab('logs')}
                            role="tab"
                          >
                            <i className="ri-time-line me-2"></i>
                            Daily Logs ({logs.length})
                          </a>
                        </li>
                        <li className="nav-item">
                          <a 
                            className={`nav-link ${activeTab === 'attachments' ? 'active' : ''}`}
                            onClick={() => setActiveTab('attachments')}
                            role="tab"
                          >
                            <i className="ri-attachment-line me-2"></i>
                            Attachments ({attachments.length})
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              <div className="row">
                <div className="col-12">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body">
                      {/* Details Tab */}
                      {activeTab === 'details' && (
                        <div className="tab-pane fade show active">
                          <div className="row">
                            <div className="col-lg-8">
                              <div className="mb-4">
                                <h5 className="mb-3">Task Description</h5>
                                <p className="text-muted">{task.description || 'No description provided'}</p>
                              </div>

                              {task.completion_notes && (
                                <div className="mb-4">
                                  <h5 className="mb-3">Completion Notes</h5>
                                  <p className="text-muted">{task.completion_notes}</p>
                                </div>
                              )}

                              <div className="mb-4">
                                <h5 className="mb-3">Task Information</h5>
                                <div className="row">
                                  <div className="col-md-6">
                                    <p className="mb-2"><strong>Created By:</strong> {task.created_by_name || 'Unknown'}</p>
                                    <p className="mb-2"><strong>Assigned By:</strong> {task.assigned_by_name || 'Unknown'}</p>
                                    <p className="mb-2"><strong>Assigned Date:</strong> {task.assigned_date ? new Date(task.assigned_date).toLocaleDateString() : 'N/A'}</p>
                                  </div>
                                  <div className="col-md-6">
                                    <p className="mb-2"><strong>Created At:</strong> {task.created_at ? new Date(task.created_at).toLocaleString() : 'N/A'}</p>
                                    <p className="mb-2"><strong>Updated At:</strong> {task.updated_at ? new Date(task.updated_at).toLocaleString() : 'N/A'}</p>
                                    <p className="mb-2"><strong>Task Type:</strong> {task.task_type || 'N/A'}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Subtasks Section */}
                              {subtasks.length > 0 && (
                                <div className="mb-4">
                                  <h5 className="mb-3">Subtasks</h5>
                                  <div className="table-responsive">
                                    <table className="table table-centered table-nowrap mb-0">
                                      <thead className="table-light">
                                        <tr>
                                          <th>Title</th>
                                          <th>Description</th>
                                          <th>Status</th>
                                          <th>Due Date</th>
                                          <th>Priority</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {subtasks.map(subtask => (
                                          <tr key={subtask.id}>
                                            <td>{subtask.title}</td>
                                            <td>{subtask.description || 'No description'}</td>
                                            <td>
                                              <span className={`badge ${
                                                subtask.status === 'COMPLETED' ? 'bg-success' : 
                                                subtask.status === 'IN_PROGRESS' ? 'bg-warning' : 
                                                subtask.status === 'PENDING' ? 'bg-info' : 
                                                subtask.status === 'SUBMITTED' ? 'bg-primary' : 
                                                'bg-secondary'
                                              }`}>
                                                {subtask.status.replace('_', ' ')}
                                              </span>
                                            </td>
                                            <td>{subtask.due_date ? new Date(subtask.due_date).toLocaleDateString() : 'No due date'}</td>
                                            <td>
                                              <span className={`badge ${
                                                subtask.priority === 'URGENT' ? 'bg-danger' :
                                                subtask.priority === 'HIGH' ? 'bg-warning' : 
                                                subtask.priority === 'MEDIUM' ? 'bg-info' : 'bg-secondary'
                                              }`}>
                                                {subtask.priority}
                                              </span>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Comments Tab */}
                      {activeTab === 'comments' && (
                        <div className="tab-pane fade show active">
                          <div className="row">
                            <div className="col-12">
                              <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                  <h5 className="mb-0">Comments ({comments.length})</h5>
                                  <button 
                                    className="btn btn-outline-primary"
                                    onClick={() => document.getElementById('comment-form').scrollIntoView()}
                                  >
                                    <i className="ri-add-line me-1"></i>
                                    Add Comment
                                  </button>
                                </div>
                                
                                {comments.length > 0 ? (
                                  <div className="list-group">
                                    {comments.map((comment, index) => (
                                      <div key={comment.id} className="card mb-3 border shadow-sm">
                                        <div className="card-body">
                                          <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div className="d-flex align-items-center">
                                              <div className="avatar-xs bg-primary rounded-circle d-flex align-items-center justify-content-center me-2">
                                                <span className="text-white small">
                                                  {(comment.created_by_name || comment.user_name || comment.created_by_user_name || 'U').charAt(0).toUpperCase()}
                                                </span>
                                              </div>
                                              <div>
                                                <h6 className="mb-0">{comment.created_by_name || comment.user_name || comment.created_by_user_name || 'Unknown User'}</h6>
                                                <small className="text-muted">
                                                  {comment.created_at ? new Date(comment.created_at).toLocaleString() : 'Unknown date'}
                                                </small>
                                              </div>
                                            </div>
                                            {comment.comment_type && (
                                              <span className={`badge me-2 ${
                                                comment.comment_type === 'UPDATE' ? 'bg-primary' :
                                                comment.comment_type === 'QUESTION' ? 'bg-warning' :
                                                comment.comment_type === 'NOTE' ? 'bg-info' :
                                                comment.comment_type === 'PROGRESS' ? 'bg-success' : 'bg-secondary'
                                              }`}>
                                                {comment.comment_type}
                                              </span>
                                            )}
                                          </div>
                                          <div className="mt-2">
                                            <p className="mb-0">{comment.comment}</p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-5">
                                    <i className="ri-discuss-line ri-2x text-muted mb-3"></i>
                                    <p className="text-muted mb-0">No comments yet. Be the first to add a comment!</p>
                                  </div>
                                )}
                                
                                {/* Add Comment Form */}
                                <div id="comment-form" className="mt-4">
                                  <h5 className="mb-3">Add Comment</h5>
                                  <form onSubmit={handleAddComment}>
                                    <div className="mb-3">
                                      <label className="form-label">Comment Type</label>
                                      <select 
                                        className="form-select"
                                        value={commentType}
                                        onChange={(e) => setCommentType(e.target.value)}
                                      >
                                        <option value="UPDATE">Update</option>
                                        <option value="QUESTION">Question</option>
                                        <option value="NOTE">Note</option>
                                        <option value="PROGRESS">Progress Update</option>
                                      </select>
                                    </div>
                                    <div className="mb-3">
                                      <label className="form-label">Comment</label>
                                      <textarea
                                        className="form-control"
                                        rows="4"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Enter your comment here..."
                                        required
                                      ></textarea>
                                    </div>
                                    <button type="submit" className="btn btn-outline-primary">
                                      <i className="ri-add-line me-1"></i>
                                      Add Comment
                                    </button>
                                  </form>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Logs Tab */}
                      {activeTab === 'logs' && (
                        <div className="tab-pane fade show active">
                          <div className="row">
                            <div className="col-12">
                              <div className="mb-4">
                                <h5 className="mb-3">Daily Logs</h5>
                                
                                {/* Main Task Logs Section */}
                                <div className="mb-4">
                                  <div className="d-flex align-items-center mb-3">
                                    <h6 className="mb-0 me-2">Main Task: {task.title}</h6>
                                    <span className="badge bg-primary">Main Task</span>
                                  </div>
                                  
                                  {logs.filter(log => log.task_type === 'main').length > 0 ? (
                                    <div className="list-group">
                                      {logs.filter(log => log.task_type === 'main').map((log, index) => (
                                        <div key={log.id} className="card mb-3 border shadow-sm">
                                          <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                              <div className="d-flex align-items-center">
                                                <div className="avatar-xs bg-primary rounded-circle d-flex align-items-center justify-content-center me-2">
                                                  <span className="text-white small">
                                                    {(log.created_by_name || 'U').charAt(0).toUpperCase()}
                                                  </span>
                                                </div>
                                                <div>
                                                  <h6 className="mb-0">{log.created_by_name || 'Unknown User'}</h6>
                                                  <small className="text-muted">
                                                    {log.created_at ? new Date(log.created_at).toLocaleString() : 'Unknown date'}
                                                  </small>
                                                </div>
                                              </div>
                                              {log.time_spent && (
                                                <span className="badge bg-info">
                                                  {formatTimeSpent(log.time_spent)}
                                                </span>
                                              )}
                                            </div>
                                            
                                            <div className="mt-3">
                                              {log.work_done && (
                                                <div className="mb-2">
                                                  <h6 className="text-primary">Work Done</h6>
                                                  <p className="mb-0">{log.work_done}</p>
                                                </div>
                                              )}
                                              
                                              {(log.changes_made || log.file_location) && (
                                                <div className="row mb-2">
                                                  {log.changes_made && (
                                                    <div className="col-md-6">
                                                      <h6 className="text-primary">Changes Made</h6>
                                                      <p className="mb-0">{log.changes_made}</p>
                                                    </div>
                                                  )}
                                                  {log.file_location && (
                                                    <div className="col-md-6">
                                                      <h6 className="text-primary">File Location</h6>
                                                      <p className="mb-0">{log.file_location}</p>
                                                    </div>
                                                  )}
                                                </div>
                                              )}
                                              
                                              {log.challenges && (
                                                <div className="mb-2">
                                                  <h6 className="text-primary">Challenges</h6>
                                                  <p className="mb-0">{log.challenges}</p>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-center py-3 bg-light rounded">
                                      <p className="text-muted mb-0">No daily logs recorded for the main task.</p>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Subtasks Logs Section */}
                                {subtasks.length > 0 && (
                                  <div className="mb-4">
                                    <h6 className="mb-3">Subtasks Logs</h6>
                                    
                                    {subtasks.map(subtask => (
                                      <div key={subtask.id} className="mb-4">
                                        <div className="d-flex align-items-center mb-3">
                                          <h6 className="mb-0 me-2">Subtask: {subtask.title}</h6>
                                          <span className="badge bg-warning">Subtask</span>
                                        </div>
                                        
                                        {getSubtaskLogs(subtask.id).length > 0 ? (
                                          <div className="list-group">
                                            {getSubtaskLogs(subtask.id).map((log, index) => (
                                              <div key={log.id} className="card mb-3 border shadow-sm">
                                                <div className="card-body">
                                                  <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <div className="d-flex align-items-center">
                                                      <div className="avatar-xs bg-primary rounded-circle d-flex align-items-center justify-content-center me-2">
                                                        <span className="text-white small">
                                                          {(log.created_by_name || 'U').charAt(0).toUpperCase()}
                                                        </span>
                                                      </div>
                                                      <div>
                                                        <h6 className="mb-0">{log.created_by_name || 'Unknown User'}</h6>
                                                        <small className="text-muted">
                                                          {log.created_at ? new Date(log.created_at).toLocaleString() : 'Unknown date'}
                                                        </small>
                                                      </div>
                                                    </div>
                                                    {log.time_spent && (
                                                      <span className="badge bg-info">
                                                        {formatTimeSpent(log.time_spent)}
                                                      </span>
                                                    )}
                                                  </div>
                                                  
                                                  <div className="mt-3">
                                                    {log.work_done && (
                                                      <div className="mb-2">
                                                        <h6 className="text-primary">Work Done</h6>
                                                        <p className="mb-0">{log.work_done}</p>
                                                      </div>
                                                    )}
                                                    
                                                    {(log.changes_made || log.file_location) && (
                                                      <div className="row mb-2">
                                                        {log.changes_made && (
                                                          <div className="col-md-6">
                                                            <h6 className="text-primary">Changes Made</h6>
                                                            <p className="mb-0">{log.changes_made}</p>
                                                          </div>
                                                        )}
                                                        {log.file_location && (
                                                          <div className="col-md-6">
                                                            <h6 className="text-primary">File Location</h6>
                                                            <p className="mb-0">{log.file_location}</p>
                                                          </div>
                                                        )}
                                                      </div>
                                                    )}
                                                    
                                                    {log.challenges && (
                                                      <div className="mb-2">
                                                        <h6 className="text-primary">Challenges</h6>
                                                        <p className="mb-0">{log.challenges}</p>
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="text-center py-3 bg-light rounded">
                                            <p className="text-muted mb-0">No daily logs recorded for this subtask.</p>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {logs.length === 0 && subtasks.length === 0 && (
                                  <div className="text-center py-5">
                                    <i className="ri-time-line ri-2x text-muted mb-3"></i>
                                    <p className="text-muted mb-0">No daily logs recorded for this task or its subtasks.</p>
                                    <p className="text-muted small">You can add daily logs to track your progress on this task.</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Attachments Tab */}
                      {activeTab === 'attachments' && (
                        <div className="tab-pane fade show active">
                          <div className="row">
                            <div className="col-12">
                              <div className="mb-4">
                                <h5 className="mb-3">Uploaded Attachments</h5>
                                {attachments.length > 0 ? (
                                  <div className="row">
                                    {attachments.map(attachment => (
                                      <div key={attachment.id} className="col-md-6 col-lg-4 mb-3">
                                        <div className="card border h-100">
                                          <div className="card-body">
                                            <div className="d-flex align-items-center mb-3">
                                              <div className="avatar-sm bg-light rounded me-3">
                                                <i className={`ri-file-${getFileIcon(attachment.file_type)}-line ri-lg text-primary`}></i>
                                              </div>
                                              <div>
                                                <h6 className="mb-0 text-truncate" style={{ maxWidth: '150px' }}>{attachment.file_name}</h6>
                                                <small className="text-muted">{formatFileSize(attachment.file_size)}</small>
                                              </div>
                                            </div>
                                            <div className="d-flex justify-content-between">
                                              <small className="text-muted">
                                                {attachment.uploaded_at ? new Date(attachment.uploaded_at).toLocaleDateString() : 'Unknown date'} by {attachment.uploaded_by_name || 'Unknown'}
                                              </small>
                                              <div>
                                                <button 
                                                  className="btn btn-sm btn-outline-primary me-1"
                                                  onClick={() => openAttachment(attachment)}
                                                >
                                                  <i className="ri-eye-line me-1"></i>
                                                  View
                                                </button>
                                                <button 
                                                  className="btn btn-sm btn-outline-secondary"
                                                  onClick={() => {
                                                    const baseUrl = process.env.REACT_APP_SERVER_URL || 'https://task.ipshopy.com';
                                                    // Force download by using the download endpoint instead of direct file access
                                                    const downloadUrl = `${baseUrl}/api/v1/tasks/attachments/${attachment.id}/download`;
                                                    
                                                    const link = document.createElement('a');
                                                    link.href = downloadUrl;
                                                    link.setAttribute('download', attachment.file_name);
                                                    // Remove target="_blank" to ensure download instead of opening in new tab
                                                    link.target = '_self';
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    document.body.removeChild(link);
                                                  }}
                                                >
                                                  <i className="ri-download-line me-1"></i>
                                                  Download
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-5">
                                    <i className="ri-attachment-line ri-2x text-muted mb-3"></i>
                                    <p className="text-muted mb-0">No attachments uploaded yet.</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
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

      {/* Submit Task Modal */}
      {showSubmitModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Submit Task to Team Leader</h5>
                <button type="button" className="btn-close" onClick={() => setShowSubmitModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Completion Notes</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={submitNotes}
                    onChange={(e) => setSubmitNotes(e.target.value)}
                    placeholder="Add notes about the task completion..."
                  ></textarea>
                </div>
                <div className="mb-3">
                  <label className="form-label">Attachments (Optional)</label>
                  <input
                    type="file"
                    className="form-control"
                    onChange={handleFileChange}
                    multiple
                  />
                  {submitFiles.length > 0 && (
                    <div className="mt-2">
                      <small className="text-muted">
                        Selected files: {submitFiles.map(f => f.name).join(', ')}
                      </small>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowSubmitModal(false)}>
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-success"
                  onClick={handleSubmitTask}
                >
                  <i className="ri-send-plane-line me-1"></i>
                  Submit Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attachment View Modal */}
      {showModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{modalContent.name}</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body text-center">
                {modalContent.type && modalContent.type.includes('image') ? (
                  <img 
                    src={modalContent.url} 
                    alt={modalContent.name} 
                    className="img-fluid"
                    style={{ maxHeight: '70vh' }}
                  />
                ) : modalContent.type && (modalContent.type.includes('pdf') || modalContent.type.includes('text')) ? (
                  <iframe 
                    src={modalContent.url} 
                    title={modalContent.name}
                    className="w-100"
                    style={{ height: '70vh' }}
                  />
                ) : (
                  <div>
                    <i className="ri-file-line ri-3x text-muted mb-3"></i>
                    <p>Preview not available for this file type.</p>
                    <button 
                      type="button" 
                      className="btn btn-outline-primary"
                      onClick={() => {
                        // Find the attachment object to get its ID
                        const attachment = attachments.find(a => a.file_name === modalContent.name);
                        const baseUrl = process.env.REACT_APP_SERVER_URL || 'https://task.ipshopy.com';
                        // Force download by using the download endpoint instead of direct file access
                        const downloadUrl = `${baseUrl}/api/v1/tasks/attachments/${attachment?.id || 'unknown'}/download`;
                        
                        const link = document.createElement('a');
                        link.href = downloadUrl;
                        link.setAttribute('download', modalContent.name);
                        // Remove target="_blank" to ensure download instead of opening in new tab
                        link.target = '_self';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    >
                      <i className="ri-download-line me-1"></i>
                      Download File
                    </button>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-outline-primary"
                  onClick={() => {
                    // Find the attachment object to get its ID
                    const attachment = attachments.find(a => a.file_name === modalContent.name);
                    const baseUrl = process.env.REACT_APP_SERVER_URL || 'https://task.ipshopy.com';
                    // Force download by using the download endpoint instead of direct file access
                    const downloadUrl = `${baseUrl}/api/v1/tasks/attachments/${attachment?.id || 'unknown'}/download`;
                    
                    const link = document.createElement('a');
                    link.href = downloadUrl;
                    link.setAttribute('download', modalContent.name);
                    // Remove target="_blank" to ensure download instead of opening in new tab
                    link.target = '_self';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                >
                  <i className="ri-download-line me-1"></i>
                  Download
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>
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

export default EmployeeTaskViewPage;