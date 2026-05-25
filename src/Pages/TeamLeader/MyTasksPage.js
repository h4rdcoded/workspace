import React, { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../Context/ConfigContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { buildApiUrl, getAuthHeaders } from '../../config/api';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const MyTasksPage = () => {
  const { leadCrmUser } = useContext(ConfigContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitNotes, setSubmitNotes] = useState('');
  const [actualHours, setActualHours] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const tasksPerPage = 10;

  // Parse tab parameter from URL query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // Fetch self-assigned tasks
  const fetchSelfAssignedTasks = async () => {
    try {
      setLoading(true);
      
      // Fetch tasks that are self-assigned to the team leader
      // This includes both tasks taken for self and subtasks taken for self
      const response = await axios.get(
        buildApiUrl('/tasks/my-tasks-with-subtasks?self_assigned=true&include_subtasks=true'),
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        // Remove duplicates by task ID - prefer the version marked as subtask if both exist
        const uniqueTasksMap = new Map();
        (response.data.data.tasks || []).forEach(task => {
          const existingTask = uniqueTasksMap.get(task.id);
          // If task doesn't exist or current task is explicitly marked as subtask, use it
          if (!existingTask || task.is_subtask === true) {
            uniqueTasksMap.set(task.id, task);
          }
        });
        
        // Convert map back to array
        const uniqueTasks = Array.from(uniqueTasksMap.values());
        
        // Sort tasks by assigned_date (newest first)
        const sortedTasks = uniqueTasks.sort((a, b) => {
          const dateA = new Date(a.assigned_date || a.created_at);
          const dateB = new Date(b.assigned_date || b.created_at);
          return dateB - dateA;
        });
        
        setTasks(sortedTasks);
        setTotalPages(Math.ceil(sortedTasks.length / tasksPerPage));
      } else {
        toast.error(`Failed to load tasks: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      
      if (error.response) {
        
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to load tasks'}`);
      } else {
        toast.error('Network error: Failed to load tasks');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSelfAssignedTasks();
  }, []);

  // Get current tasks for pagination
  const getCurrentTasks = () => {
    const filtered = tasks.filter(task => {
      switch (activeTab) {
        case 'completed':
          return task.status === 'COMPLETED';
        case 'in_progress':
          return task.status === 'IN_PROGRESS' || task.status === 'PENDING';
        case 'submitted':
          return task.status === 'SUBMITTED' || task.status === 'SUBMITTED_TO_ADMIN';
        case 'overdue':
          const dueDate = task.due_date ? new Date(task.due_date) : null;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return dueDate && dueDate < today && task.status !== 'COMPLETED' && task.status !== 'CANCELLED';
        default:
          return true;
      }
    });
    
    const indexOfLastTask = currentPage * tasksPerPage;
    const indexOfFirstTask = indexOfLastTask - tasksPerPage;
    return filtered.slice(indexOfFirstTask, indexOfLastTask);
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    
    // Update URL with new tab
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('tab', tab);
    navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
  };

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Handle task submission
  const handleSubmitTask = async () => {
    try {
      // First, check if daily logs are written for this task
      try {
        const logsResponse = await axios.get(
          buildApiUrl(`/tasks/${selectedTask.id}/logs`),
          { headers: getAuthHeaders() }
        );
        
        if (logsResponse.data.success) {
          const logs = logsResponse.data.data.logs || [];
          if (logs.length === 0) {
            toast.error('You had not written any daily logs.');
            return;
          }
        }
      } catch (logsError) {
        
        // Even if we can't fetch logs, we should still allow submission
        // This prevents blocking users if there's a logs API issue
      }

      // For subtasks taken by the team leader, mark as COMPLETED directly
      const isSelfAssignedSubtask = selectedTask.is_subtask && selectedTask.assigned_to === leadCrmUser.id;
      // Ensure completion_notes is never empty to pass backend validation
      const completionNotes = submitNotes.trim() || 'Task completed';
      
      const status = isSelfAssignedSubtask ? 'COMPLETED' : 'SUBMITTED';
      
      const payload = {
        status: status,
        completion_notes: completionNotes,
        actual_hours: actualHours ? parseFloat(actualHours) : undefined
      };

      const response = await axios.put(
        buildApiUrl(`/tasks/${selectedTask.id}/status`),
        payload,
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        const successMessage = isSelfAssignedSubtask 
          ? 'Subtask completed successfully' 
          : 'Task submitted successfully';
        toast.success(successMessage);
        setShowSubmitModal(false);
        setSubmitNotes('');
        setActualHours('');
        setSelectedTask(null);
        
        // Update the task status in the local state immediately
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === selectedTask.id 
              ? { ...task, status: status } 
              : task
          )
        );
        
        // Also refresh the task list from the server after a short delay
        // to ensure the server has processed the update
        setTimeout(() => {
          fetchSelfAssignedTasks();
        }, 1000);
      } else {
        // Show the actual error message from the backend
        const errorMessage = response.data.errors ? response.data.errors.join(', ') : response.data.message || 'Failed to submit task';
        toast.error(`Error: ${errorMessage}`);
      }
    } catch (error) {
      
      if (error.response) {
        // Show the actual validation error from the backend
        const errorMessage = error.response.data.errors ? error.response.data.errors.join(', ') : error.response.data.message || error.response.statusText || 'Failed to submit task';
        toast.error(`Error: ${errorMessage}`);
      } else {
        toast.error('Network error: Failed to submit task');
      }
    }
  };

  // Open submit modal
  const openSubmitModal = (task) => {
    setSelectedTask(task);
    setShowSubmitModal(true);
  };

  // Close submit modal
  const closeSubmitModal = () => {
    setShowSubmitModal(false);
    setSelectedTask(null);
    setSubmitNotes('');
    setActualHours('');
  };

  // Get filtered tasks count for tabs
  const getFilteredTasksCount = (status) => {
    return tasks.filter(task => {
      switch (status) {
        case 'completed':
          return task.status === 'COMPLETED';
        case 'in_progress':
          return task.status === 'IN_PROGRESS' || task.status === 'PENDING';
        case 'submitted':
          return task.status === 'SUBMITTED' || task.status === 'SUBMITTED_TO_ADMIN';
        case 'overdue':
          const dueDate = task.due_date ? new Date(task.due_date) : null;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return dueDate && dueDate < today && task.status !== 'COMPLETED' && task.status !== 'CANCELLED';
        default:
          return true;
      }
    }).length;
  };

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
                <p className="mt-2 text-muted">Loading your tasks...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentTasks = getCurrentTasks();
  const filteredTasksCount = tasks.filter(task => {
    switch (activeTab) {
      case 'completed':
        return task.status === 'COMPLETED';
      case 'in_progress':
        return task.status === 'IN_PROGRESS' || task.status === 'PENDING';
      case 'submitted':
        return task.status === 'SUBMITTED' || task.status === 'SUBMITTED_TO_ADMIN';
      case 'overdue':
        const dueDate = task.due_date ? new Date(task.due_date) : null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return dueDate && dueDate < today && task.status !== 'COMPLETED' && task.status !== 'CANCELLED';
      default:
        return true;
    }
  }).length;

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
                      <h4 className="mb-0">My Tasks</h4>
                      <p className="text-muted mb-0">View and manage tasks you've taken for yourself (including subtasks)</p>
                    </div>
                    <div className="d-flex align-items-center">
                      <i className="ri-task-line me-2"></i>
                      <span>{leadCrmUser?.name}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="row mb-4">
                <div className="col-12">
                  <ul className="nav nav-tabs">
                    <li className="nav-item">
                      <button 
                        className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => handleTabChange('all')}
                      >
                        All Tasks ({tasks.length})
                      </button>
                    </li>
                    <li className="nav-item">
                      <button 
                        className={`nav-link ${activeTab === 'in_progress' ? 'active' : ''}`}
                        onClick={() => handleTabChange('in_progress')}
                      >
                        In Progress ({getFilteredTasksCount('in_progress')})
                      </button>
                    </li>
                    <li className="nav-item">
                      <button 
                        className={`nav-link ${activeTab === 'submitted' ? 'active' : ''}`}
                        onClick={() => handleTabChange('submitted')}
                      >
                        Submitted ({getFilteredTasksCount('submitted')})
                      </button>
                    </li>
                    <li className="nav-item">
                      <button 
                        className={`nav-link ${activeTab === 'completed' ? 'active' : ''}`}
                        onClick={() => handleTabChange('completed')}
                      >
                        Completed ({getFilteredTasksCount('completed')})
                      </button>
                    </li>
                    <li className="nav-item">
                      <button 
                        className={`nav-link ${activeTab === 'overdue' ? 'active' : ''}`}
                        onClick={() => handleTabChange('overdue')}
                      >
                        Overdue ({getFilteredTasksCount('overdue')})
                      </button>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Task List */}
              <div className="row">
                <div className="col-12">
                  <div className="card border-0 shadow-sm">
                    <div className="card-header bg-white border-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Self-Assigned Tasks & Subtasks</h5>
                        <span className="badge bg-primary">{filteredTasksCount} Tasks</span>
                      </div>
                    </div>
                    <div className="card-body">
                      {currentTasks.length > 0 ? (
                        <>
                          <div className="table-responsive">
                            <table className="table table-centered table-nowrap mb-0">
                              <thead className="table-light">
                                <tr>
                                  <th>Task Title</th>
                                  <th>Main Task</th>
                                 
                                  <th>Due Date</th>
                                  <th>Priority</th>
                                  <th>Status</th>
                                  <th>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {currentTasks.map(task => (
                                  <tr key={task.id}>
                                    <td>
                                      <h6 className="mb-0">{task.title?.substring(0,50)}</h6>
                                      {task.is_subtask && (
                                        <span className="badge bg-info mt-1">Subtask</span>
                                      )}
                                    </td>
                                    <td>
                                      {task.is_subtask ? (
                                        <span className="text-muted">{task.parent_task_title?.substring(0,20) || 'Unknown Parent Task'}</span>
                                      ) : (
                                        <span className="text-muted">-</span>
                                      )}
                                    </td>
    
                                    <td>
                                      <span className={`badge ${new Date(task.due_date) < new Date() && task.status !== 'COMPLETED' ? 'bg-danger' : 'bg-secondary'}`}>
                                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                                      </span>
                                    </td>
                                    <td>
                                      <span className={`badge ${
                                        task.priority === 'URGENT' ? 'bg-danger' :
                                        task.priority === 'HIGH' ? 'bg-warning' : 
                                        task.priority === 'MEDIUM' ? 'bg-info' : 'bg-secondary'
                                      }`}>
                                        {task.priority}
                                      </span>
                                    </td>
                                    <td>
                                      <span className={`badge ${
                                        task.status === 'COMPLETED' ? 'bg-success' : 
                                        task.status === 'IN_PROGRESS' ? 'bg-warning' : 
                                        task.status === 'SUBMITTED' ? 'bg-primary' : 
                                        task.status === 'SUBMITTED_TO_ADMIN' ? 'bg-primary' : 
                                        task.status === 'PENDING' ? 'bg-info' :
                                        'bg-secondary'
                                      }`}>
                                        {task.status.replace('_', ' ')}
                                      </span>
                                    </td>
                                    <td>
                                      <div className="d-flex gap-2">
                                        <Link 
                                          to={`/team-leader/my-task/${task.id}`}
                                          className="btn btn-sm btn-outline-primary"
                                        >
                                          <i className="ri-eye-line me-1"></i>
                                          View
                                        </Link>
                                      
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {/* Pagination */}
                          {totalPages > 1 && (
                            <div className="row mt-4">
                              <div className="col-12">
                                <nav aria-label="Tasks pagination">
                                  <ul className="pagination justify-content-center mb-0">
                                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                      <button 
                                        className="page-link" 
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                      >
                                        Previous
                                      </button>
                                    </li>
                                    {[...Array(totalPages)].map((_, index) => (
                                      <li key={index + 1} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                                        <button 
                                          className="page-link" 
                                          onClick={() => handlePageChange(index + 1)}
                                        >
                                          {index + 1}
                                        </button>
                                      </li>
                                    ))}
                                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                      <button 
                                        className="page-link" 
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                      >
                                        Next
                                      </button>
                                    </li>
                                  </ul>
                                </nav>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-4">
                          <i className="ri-task-line display-4 text-muted"></i>
                          <h5 className="mt-3">No tasks found</h5>
                          <p className="text-muted">You haven't taken any tasks for yourself yet.</p>
                          <Link to="/team-leader/assigned-tasks" className="btn btn-outline-primary">
                            <i className="ri-task-line me-1"></i>
                            View Available Tasks
                          </Link>
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
      {showSubmitModal && selectedTask && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Submit Task for Review</h5>
                <button type="button" className="btn-close" onClick={closeSubmitModal}></button>
              </div>
              <div className="modal-body">
                <div className="card mb-3">
                  <div className="card-header">
                    <h6 className="mb-0">Task Information</h6>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <p><strong>Title:</strong> {selectedTask.title}</p>
                        <p><strong>Priority:</strong> 
                          <span className={`badge ms-2 ${
                            selectedTask.priority === 'URGENT' ? 'bg-danger' :
                            selectedTask.priority === 'HIGH' ? 'bg-warning' : 
                            selectedTask.priority === 'MEDIUM' ? 'bg-info' : 'bg-secondary'
                          }`}>
                            {selectedTask.priority}
                          </span>
                        </p>
                      </div>
                      <div className="col-md-6">
                        <p><strong>Due Date:</strong> {selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleDateString() : 'No due date'}</p>
                        <p><strong>Status:</strong> 
                          <span className={`badge ms-2 ${
                            selectedTask.status === 'COMPLETED' ? 'bg-success' : 
                            selectedTask.status === 'IN_PROGRESS' ? 'bg-warning' : 
                            selectedTask.status === 'PENDING' ? 'bg-info' : 
                            selectedTask.status === 'SUBMITTED' ? 'bg-primary' : 
                            selectedTask.status === 'SUBMITTED_TO_ADMIN' ? 'bg-primary' :
                            'bg-secondary'
                          }`}>
                            {selectedTask.status.replace('_', ' ')}
                          </span>
                        </p>
                      </div>
                    </div>
                    <p><strong>Description:</strong> {selectedTask.description}</p>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    placeholder="Add notes about task completion..."
                    value={submitNotes}
                    onChange={(e) => setSubmitNotes(e.target.value)}
                  ></textarea>
                </div>

              
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeSubmitModal}>
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-success"
                  onClick={handleSubmitTask}
                >
                  <i className="ri-send-plane-line me-1"></i>
                  {selectedTask.is_subtask && selectedTask.assigned_to === leadCrmUser.id 
                    ? 'Complete Subtask' 
                    : 'Submit Task'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTasksPage;