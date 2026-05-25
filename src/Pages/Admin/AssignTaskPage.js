import React, { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../Context/ConfigContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { buildApiUrl, getAuthHeaders } from '../../config/api';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AssignTaskPage = () => {
  const { leadCrmUser } = useContext(ConfigContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [departments, setDepartments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage] = useState(20);
  const [filteredTasks, setFilteredTasks] = useState([]);

  // Fetch all departments
  const fetchDepartments = async () => {
    try {
      const response = await axios.get(
        buildApiUrl('/departments'),
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        setDepartments(response.data.data);
      }
    } catch (error) {
      
      toast.error('Failed to load departments');
    }
  };

  // Fetch tasks assigned to team leaders
  const fetchTeamLeaderTasks = async () => {
    try {
      const response = await axios.get(
        buildApiUrl('/admin/tasks/team-leader'),
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        setTasks(response.data.data);
        setFilteredTasks(response.data.data);
      }
    } catch (error) {
      
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // Handle department selection
  const handleDepartmentSelect = (department) => {
    setShowDepartmentModal(false);
    // Navigate to department details page
    navigate(`/admin/department/${department.id}`);
  };

  // Handle task cancellation
  const handleCancelTask = async (taskId) => {
    // Find the task to check its current status
    const task = tasks.find(t => t.id === taskId);
    
    // If task is already cancelled, show a message and return
    if (task && task.status === 'CANCELLED') {
      toast.info('This task is already cancelled');
      return;
    }

    if (!window.confirm('Are you sure you want to cancel this task? This action cannot be undone.')) {
      return;
    }

    try {
      // First, cancel the main task
      const response = await axios.put(
        buildApiUrl(`/tasks/${taskId}/status`),
        { status: 'CANCELLED' },
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        // If the task is a main task, also cancel its subtasks
        if (!task.parent_task_id) { // This is a main task
          try {
            // Fetch subtasks for this main task
            const subtasksResponse = await axios.get(
              buildApiUrl(`/tasks/${taskId}/subtasks`),
              { headers: getAuthHeaders() }
            );
            
            if (subtasksResponse.data.success && subtasksResponse.data.data.subtasks.length > 0) {
              // Cancel each subtask
              const subtasks = subtasksResponse.data.data.subtasks;
              const cancelPromises = subtasks
                .filter(subtask => subtask.status !== 'CANCELLED') // Only cancel non-cancelled subtasks
                .map(subtask => 
                  axios.put(
                    buildApiUrl(`/tasks/${subtask.id}/status`),
                    { status: 'CANCELLED' },
                    { headers: getAuthHeaders() }
                  )
                );
              
              // Execute all cancellation requests
              if (cancelPromises.length > 0) {
                await Promise.all(cancelPromises);
                toast.success(`Main task and ${cancelPromises.length} subtask(s) cancelled successfully`);
              } else {
                toast.success('Task cancelled successfully');
              }
            } else {
              toast.success('Task cancelled successfully');
            }
          } catch (subtaskError) {
            
            // Still show success for main task cancellation
            toast.success('Task cancelled successfully (subtasks may not have been updated)');
          }
        } else {
          toast.success('Task cancelled successfully');
        }
        
        // Refresh the task list
        fetchTeamLeaderTasks();
      } else {
        toast.error(`Failed to cancel task: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to cancel task'}`);
      } else {
        toast.error('Network error: Failed to cancel task');
      }
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-warning';
      case 'IN_PROGRESS': return 'bg-info';
      case 'SUBMITTED': return 'bg-primary';
      case 'COMPLETED': return 'bg-success';
      case 'CANCELLED': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  // Get priority badge class
  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'URGENT': return 'bg-danger';
      case 'HIGH': return 'bg-warning';
      case 'MEDIUM': return 'bg-info';
      case 'LOW': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  };

  // Filter tasks based on search term and status
  useEffect(() => {
    let filtered = tasks;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.department_name && task.department_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (task.assigned_to_team_leader_name && task.assigned_to_team_leader_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        task.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.priority.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(task => task.status === statusFilter);
    }
    
    setFilteredTasks(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, statusFilter, tasks]);

  // Pagination logic
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Initialize filters from URL parameters
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      setStatusFilter(statusParam);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchDepartments();
    fetchTeamLeaderTasks();
  }, []);

  // Update URL when filters change
  useEffect(() => {
    const params = {};
    if (searchTerm) params.search = searchTerm;
    if (statusFilter) params.status = statusFilter;
    
    setSearchParams(params);
  }, [searchTerm, statusFilter, setSearchParams]);

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
                <p className="mt-2 text-muted">Loading tasks...</p>
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
          {/* Page Header */}
          <div className="row">
            <div className="col-12">
              <div className="page-title-box d-flex align-items-center justify-content-between">
                <h4 className="mb-0">Assign Task</h4>
                <div className="page-title-right">
                  <ol className="breadcrumb m-0">
                    <li className="breadcrumb-item">Admin</li>
                    <li className="breadcrumb-item active">Assign Task</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* Assign Task Button and Filters */}
          <div className="row mb-3">
            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <button 
                  className="btn btn-outline-primary rounded-pill px-4"
                  onClick={() => setShowDepartmentModal(true)}
                >
                  <i className="ri-add-line me-1"></i>
                  Assign New Task
                </button>
                
                <div className="d-flex flex-wrap gap-2">
                  <div className="d-flex" style={{ width: '200px' }}>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="ri-search-line"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search tasks..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ height: '38px' }}
                      />
                      {searchTerm && (
                        <button 
                          className="btn btn-outline-secondary" 
                          type="button"
                          onClick={() => setSearchTerm('')}
                          style={{ height: '38px' }}
                        >
                          <i className="ri-close-line"></i>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="d-flex" style={{ width: '150px' }}>
                    <select
                      className="form-select"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      style={{ height: '38px' }}
                    >
                      <option value="">All Status</option>
                      <option value="PENDING">Pending</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="SUBMITTED">Submitted</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tasks Assigned to Team Leaders */}
          <div className="row">
            <div className="col-12">
              <div className="card border-0 shadow-sm rounded-3">
                <div className="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Tasks Assigned to Employees</h5>
                  <button 
                    className="btn btn-sm btn-outline-primary rounded-pill"
                    onClick={fetchTeamLeaderTasks}
                  >
                    <i className="ri-refresh-line me-1"></i>
                    Refresh
                  </button>
                </div>
                <div className="card-body">
                  {currentTasks.length > 0 ? (
                    <>
                      <div className="table-responsive">
                        <table className="table table-centered table-nowrap mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Task Title</th>
                              <th>Department</th>
                              <th>Assigned to</th>
                              <th>Priority</th>
                              <th>Status</th>
                              <th>Assigned date</th>
                              <th>Due Date</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentTasks.map(task => (
                              <tr key={task.id}>
                                <td>
                                  <h6 className="mb-0">{task.title?.substring(0,30)}</h6>
                                  <p className="mb-0 text-muted small">{task.description?.substring(0, 30)}...</p>
                                </td>
                                <td>
                                  <span className="mb-0">
                                    {task.department_name || 'N/A'}
                                  </span>
                                </td>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <i className="ri-user-line me-2 text-primary"></i>
                                    <span>{task.assigned_to_team_leader_name || 'Unassigned'}</span>
                                  </div>
                                </td>
                                <td>
                                  <span className={`badge ${getPriorityClass(task.priority)}`}>
                                    {task.priority}
                                  </span>
                                </td>
                                <td>
                                  <span className={`badge rounded-pill ${getStatusBadgeClass(task.status)}`}>
                                    {task.status.replace('_', ' ')}
                                  </span>
                                </td>
                                <td>
                                  <span>
                                    {task.created_at ? new Date(task.created_at).toLocaleDateString() : 'No assigned date'}
                                  </span>
                                </td>
                                <td>
                                  <span>
                                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                                  </span>
                                </td>
                                <td>
                                  <div className="d-flex gap-1">
                                    <button 
                                      className="btn btn-sm btn-outline-primary rounded-pill"
                                      onClick={() => navigate(`/admin/task_Approvel/${task.id}`)}
                                    >
                                      <i className="ri-eye-line me-1"></i>
                                      View
                                    </button>
                                    {task.status !== 'CANCELLED' && (
                                      <button 
                                        className="btn btn-sm btn-outline-danger rounded-pill"
                                        onClick={() => handleCancelTask(task.id)}
                                      >
                                        <i className="ri-close-line me-1"></i>
                                        Cancel
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="d-flex justify-content-between align-items-center mt-4 mb-3">
                          <div className="text-muted">
                            Showing {(currentPage - 1) * tasksPerPage + 1} to {Math.min(currentPage * tasksPerPage, filteredTasks.length)} of {filteredTasks.length} tasks
                          </div>
                          <nav aria-label="Tasks pagination">
                            <ul className="pagination mb-0">
                              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button 
                                  className="page-link" 
                                  onClick={() => paginate(currentPage - 1)}
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
                                        onClick={() => paginate(page)}
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
                                  onClick={() => paginate(currentPage + 1)}
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
                  ) : (
                    <div className="text-center py-5">
                      <div className="avatar-md mx-auto mb-3">
                        <div className="avatar-title bg-light text-muted rounded-circle">
                          <i className="ri-task-line ri-2x"></i>
                        </div>
                      </div>
                      <h5 className="mt-3">
                        {searchTerm || statusFilter ? 'No tasks found' : 'No tasks assigned'}
                      </h5>
                      <p className="text-muted">
                        {searchTerm || statusFilter 
                          ? `No tasks match your filters.` 
                          : 'There are no tasks currently assigned to team leaders.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Department Selection Modal */}
      {showDepartmentModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header  text-white">
                <h5 className="modal-title">Select Department</h5>
                <button 
                  type="button" 
                  className="btn-close btn-outline-close-white" 
                  onClick={() => setShowDepartmentModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="list-group">
                  {departments.map(department => (
                    <button
                      key={department.id}
                      type="button"
                      className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                      onClick={() => handleDepartmentSelect(department)}
                    >
                      <div>
                        <h6 className="mb-0">{department.name}</h6>
                        <p className="mb-0 text-muted small">{department.description}</p>
                      </div>
                      <i className="ri-arrow-right-line"></i>
                    </button>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-outline-secondary rounded-pill"
                  onClick={() => setShowDepartmentModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignTaskPage;