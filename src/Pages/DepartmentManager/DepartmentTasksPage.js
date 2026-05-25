import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ConfigContext } from '../../Context/ConfigContext';
import { buildApiUrl, getAuthHeaders } from '../../config/api';
import { toast } from 'react-toastify';
import axios from 'axios';

const DepartmentTasksPage = () => {
  const { leadCrmApiURL, leadCrmHeaders, leadCrmUser } = useContext(ConfigContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filterType = searchParams.get('filter') || 'all'; // all, pending, submitted, completed
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departmentId, setDepartmentId] = useState(null);
  const [departmentName, setDepartmentName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState(''); // Employee filter for task list
  const tasksPerPage = 20;
  
  // Reassign modal state
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [departmentEmployees, setDepartmentEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(''); // For reassignment modal
  const [reassignLoading, setReassignLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState({});

  useEffect(() => {
    fetchDepartmentId();
  }, []);

  // Fetch department employees on mount and when department changes
  useEffect(() => {
    if (departmentId) {
      fetchDepartmentEmployees();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentId]);

  useEffect(() => {
    if (departmentId) {
      setCurrentPage(1); // Reset to first page when filter changes
      fetchTasks(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentId, filterType, selectedEmployeeFilter]);

  // Debounce search to avoid too many API calls
  useEffect(() => {
    if (!departmentId) return;
    
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchTasks(1);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, departmentId, selectedEmployeeFilter]);

  useEffect(() => {
    if (departmentId && currentPage > 1) {
      fetchTasks(currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const fetchDepartmentId = async () => {
    try {
      const response = await fetch(buildApiUrl('/departments'), {
        credentials: 'include',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const userDepartments = data.data.filter(dept => dept.manager_id === leadCrmUser.id);
          if (userDepartments.length > 0) {
            setDepartmentId(userDepartments[0].id);
            setDepartmentName(userDepartments[0].name);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to fetch department information');
    }
  };

  const fetchTasks = async (page = 1) => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams({
        include_cancelled: 'true',
        page: page.toString(),
        limit: tasksPerPage.toString(),
        filter: filterType
      });
      
      // Add search parameter if search term exists
      if (searchTerm && searchTerm.trim() !== '') {
        params.append('search', searchTerm.trim());
      }

      // Add employee filter if employee is selected
      if (selectedEmployeeFilter && selectedEmployeeFilter !== '') {
        params.append('employee_id', selectedEmployeeFilter);
      }

      const response = await fetch(
        `${leadCrmApiURL}/departments/${departmentId}/manager/tasks?${params.toString()}`,
        {
          method: 'GET',
          headers: leadCrmHeaders,
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Tasks are already filtered on the backend
          setTasks(data.data || []);
          
          // Update pagination info
          if (data.pagination) {
            setTotalPages(data.pagination.total_pages || 1);
            setTotalTasks(data.pagination.total || 0);
          }
        } else {
          toast.error(data.message || 'Failed to fetch tasks');
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to fetch tasks');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Error fetching tasks');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getFilterTitle = () => {
    switch (filterType) {
      case 'pending':
        return 'Pending Tasks';
      case 'submitted':
        return 'Submitted Tasks';
      case 'completed':
        return 'Completed Tasks';
      case 'cancelled':
        return 'Cancelled Tasks';
      case 'all':
      default:
        return 'All Tasks';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'CREATED': return 'bg-secondary';
      case 'ASSIGNED': return 'bg-secondary';
      case 'IN_PROGRESS': return 'bg-info';
      case 'SUBMITTED': return 'bg-primary';
      case 'IN_REVIEW': return 'bg-warning';
      case 'RETURNED': return 'bg-danger';
      case 'APPROVED': return 'bg-success';
      case 'COMPLETED': return 'bg-success';
      case 'CANCELLED': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'HIGH':
      case 'URGENT':
        return 'bg-danger';
      case 'MEDIUM':
        return 'bg-warning';
      case 'LOW':
      default:
        return 'bg-info';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTaskTypeBadge = (taskType) => {
    switch (taskType) {
      case 'MAIN_TASK':
        return <span className="badge bg-primary">Main Task</span>;
      case 'SUBTASK':
        return <span className="badge bg-info">Subtask</span>;
      case 'DAILY_ROUTINE':
        return <span className="badge bg-success">Daily Routine</span>;
      default:
        return <span className="badge bg-secondary">{taskType || 'N/A'}</span>;
    }
  };

  // Fetch department employees for reassignment
  const fetchDepartmentEmployees = async () => {
    if (!departmentId) return;
    
    try {
      const response = await fetch(
        buildApiUrl(`/departments/${departmentId}/manager/employees`),
        {
          method: 'GET',
          headers: getAuthHeaders(),
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDepartmentEmployees(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching department employees:', error);
      toast.error('Failed to fetch department employees');
    }
  };

  // Handle cancel task
  const handleCancelTask = async (task) => {
    if (!window.confirm(`Are you sure you want to cancel the task "${task.title}"?`)) {
      return;
    }

    setCancelLoading({ [task.id]: true });
    try {
      const response = await axios.put(
        buildApiUrl(`/tasks/${task.id}/status`),
        { status: 'CANCELLED' },
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        // Add a comment about the cancellation
        try {
          const cancelledBy = leadCrmUser?.name || 'Department Manager';
          const assignedTo = task.assigned_to_name || 'Unassigned';
          const commentText = `Task cancelled by ${cancelledBy}. Task was previously assigned to: ${assignedTo}.`;
          await axios.post(
            buildApiUrl(`/tasks/${task.id}/comments`),
            {
              comment: commentText,
              comment_type: 'UPDATE'
            },
            { headers: getAuthHeaders() }
          );
        } catch (commentError) {
          // Don't fail the cancellation if comment fails, just log it
          console.error('Error adding cancellation comment:', commentError);
        }

        toast.success('Task cancelled successfully');
        fetchTasks(currentPage); // Refresh tasks
      } else {
        toast.error(response.data.message || 'Failed to cancel task');
      }
    } catch (error) {
      console.error('Error cancelling task:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel task');
    } finally {
      setCancelLoading({ [task.id]: false });
    }
  };

  // Handle open reassign modal
  const handleOpenReassignModal = async (task) => {
    setSelectedTask(task);
    setSelectedEmployee('');
    setShowReassignModal(true);
    await fetchDepartmentEmployees();
  };

  // Handle reassign task
  const handleReassignTask = async () => {
    // Prevent double-clicking
    if (reassignLoading) {
      return;
    }

    if (!selectedTask || !selectedEmployee) {
      toast.error('Please select an employee to reassign the task');
      return;
    }

    setReassignLoading(true);
    try {
      // Get the new employee name for the comment
      const newEmployee = departmentEmployees.find(emp => (emp.user_id || emp.id) === parseInt(selectedEmployee));
      const newEmployeeName = newEmployee ? newEmployee.name : 'Unknown';
      const previousAssignee = selectedTask.assigned_to_name || 'Unassigned';
      const reassignedBy = leadCrmUser?.name || 'Department Manager';

      // Reassign the task (backend already sets status to IN_PROGRESS and clears previous assignments)
      const assignResponse = await axios.post(
        buildApiUrl(`/tasks/${selectedTask.id}/assign`),
        {
          assigned_to_type: 'EMPLOYEE',
          assigned_to_id: parseInt(selectedEmployee),
          notes: 'Task reassigned after cancellation'
        },
        { headers: getAuthHeaders() }
      );

      if (!assignResponse.data.success) {
        throw new Error(assignResponse.data.message || 'Failed to reassign task');
      }

      // Add a comment about the reassignment
      try {
        const commentText = `Task reassigned by ${reassignedBy}. Previously assigned to: ${previousAssignee}. Reassigned to: ${newEmployeeName}.`;
        await axios.post(
          buildApiUrl(`/tasks/${selectedTask.id}/comments`),
          {
            comment: commentText,
            comment_type: 'UPDATE'
          },
          { headers: getAuthHeaders() }
        );
      } catch (commentError) {
        // Don't fail the reassignment if comment fails, just log it
        console.error('Error adding reassignment comment:', commentError);
      }

      toast.success('Task reassigned successfully');
      setShowReassignModal(false);
      setSelectedTask(null);
      setSelectedEmployee('');
      fetchTasks(currentPage); // Refresh tasks
    } catch (error) {
      console.error('Error reassigning task:', error);
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to reassign task'}`);
      } else {
        toast.error('Network error: Failed to reassign task');
      }
    } finally {
      setReassignLoading(false);
    }
  };

  return (
    <>
      <div className="vertical-overlay" />
      <div className="main-content">
        <div className="page-content">
          <div className="container-fluid">
            <div className="row">
              <div className="col-12">
                <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                  <h4 className="mb-sm-0">{getFilterTitle()} - {departmentName}</h4>
                  <div className="page-title-right">
                    <ol className="breadcrumb m-0">
                      <li className="breadcrumb-item">
                        <Link to="/department-manager">Dashboard</Link>
                      </li>
                      <li className="breadcrumb-item active">{getFilterTitle()}</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="row mb-3">
              <div className="col-12">
                <div className="card">
                  <div className="card-body">
                    <div className="row align-items-center g-3">
                      <div className="col-md-5">
                        <div className="input-group">
                          <span className="input-group-text">
                            <i className="ri-search-line"></i>
                          </span>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search tasks by title, description, task code, or assigned to..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                setCurrentPage(1);
                                fetchTasks(1);
                              }
                            }}
                          />
                          {searchTerm && (
                            <button
                              className="btn btn-outline-secondary"
                              type="button"
                              onClick={() => {
                                setSearchTerm('');
                                setCurrentPage(1);
                              }}
                            >
                              <i className="ri-close-line"></i>
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="input-group">
                          <span className="input-group-text">
                            <i className="ri-user-line"></i>
                          </span>
                          <select
                            className="form-select"
                            value={selectedEmployeeFilter}
                            onChange={(e) => {
                              setSelectedEmployeeFilter(e.target.value);
                              setCurrentPage(1);
                            }}
                          >
                            <option value="">All Employees</option>
                            {departmentEmployees.map((employee) => (
                              <option key={employee.user_id || employee.id} value={employee.user_id || employee.id}>
                                {employee.name} 
                              </option>
                            ))}
                          </select>
                          {selectedEmployeeFilter && (
                            <button
                              className="btn btn-outline-secondary"
                              type="button"
                              onClick={() => {
                                setSelectedEmployeeFilter('');
                                setCurrentPage(1);
                              }}
                            >
                              <i className="ri-close-line"></i>
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="col-md-3 text-end">
                        <small className="text-muted">
                          {searchTerm && `Searching: "${searchTerm}"`}
                          {selectedEmployeeFilter && (
                            <>
                              {searchTerm && ' | '}
                              {(() => {
                                const emp = departmentEmployees.find(e => (e.user_id || e.id) === parseInt(selectedEmployeeFilter));
                                return `Employee: ${emp ? emp.name : 'Selected'}`;
                              })()}
                            </>
                          )}
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="card">
                  <div className="card-body">
                    <ul className="nav nav-pills nav-justified" role="tablist">
                      <li className="nav-item">
                        <button
                          className={`nav-link ${filterType === 'all' ? 'active' : ''}`}
                          onClick={() => navigate('/department-manager/tasks?filter=all')}
                        >
                          <i className="ri-task-line me-1"></i> All Tasks
                        </button>
                      </li>
                      <li className="nav-item">
                        <button
                          className={`nav-link ${filterType === 'pending' ? 'active' : ''}`}
                          onClick={() => navigate('/department-manager/tasks?filter=pending')}
                        >
                          <i className="ri-time-line me-1"></i> Pending
                        </button>
                      </li>
                      <li className="nav-item">
                        <button
                          className={`nav-link ${filterType === 'submitted' ? 'active' : ''}`}
                          onClick={() => navigate('/department-manager/tasks?filter=submitted')}
                        >
                          <i className="ri-send-plane-line me-1"></i> Submitted
                        </button>
                      </li>
                      <li className="nav-item">
                        <button
                          className={`nav-link ${filterType === 'completed' ? 'active' : ''}`}
                          onClick={() => navigate('/department-manager/tasks?filter=completed')}
                        >
                          <i className="ri-check-double-line me-1"></i> Completed
                        </button>
                      </li>
                      <li className="nav-item">
                        <button
                          className={`nav-link ${filterType === 'cancelled' ? 'active' : ''}`}
                          onClick={() => navigate('/department-manager/tasks?filter=cancelled')}
                        >
                          <i className="ri-close-circle-line me-1"></i> Cancelled
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Tasks Table */}
            <div className="row">
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">{getFilterTitle()} ({tasks.length} of {totalTasks})</h5>
                  </div>
                  <div className="card-body">
                    {loading ? (
                      <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2">Loading tasks...</p>
                      </div>
                    ) : tasks.length === 0 ? (
                      <div className="text-center py-5">
                        <i className="ri-task-line ri-3x text-muted mb-3"></i>
                        <h5>No tasks found</h5>
                        <p className="text-muted">No {getFilterTitle().toLowerCase()} available for this department.</p>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-striped table-hover">
                          <thead>
                            <tr>
                              <th>Task Type</th>
                              <th>Title</th>
                              <th>Priority</th>
                              <th>Status</th>
                              <th>Assigned To</th>
                              <th>Due Date</th>
                              <th>Created Date</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tasks.map(task => (
                              <tr key={task.id}>
                                <td>
                                  {getTaskTypeBadge(task.task_type)}
                                </td>
                                <td>
                                  <strong>{task.title}</strong>
                                  {task.description && (
                                    <p className="text-muted small mb-0 mt-1">{task.description.substring(0, 70)}...</p>
                                  )}
                                </td>
                                <td>
                                  <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>
                                    {task.priority || 'N/A'}
                                  </span>
                                </td>
                                <td>
                                  <span className={`badge ${getStatusBadgeClass(task.status)}`}>
                                    {task.status ? task.status.replace('_', ' ') : 'N/A'}
                                  </span>
                                </td>
                                <td>
                                  {task.assigned_to_name || 'Unassigned'}
                                  
                                </td>
                                <td>{formatDate(task.due_date)}</td>
                                <td>{formatDate(task.created_at)}</td>
                                <td>
                                  <div className="d-flex gap-1">
                                    <Link
                                      to={`/team-leader/task/${task.id}/view`}
                                      className="btn btn-sm btn-info"
                                      title="View Task"
                                    >
                                      <i className="ri-eye-line"></i>
                                    </Link>
                                    {task.status !== 'CANCELLED' && (
                                      <button
                                        className="btn btn-sm btn-danger"
                                        title="Cancel Task"
                                        onClick={() => handleCancelTask(task)}
                                        disabled={cancelLoading[task.id]}
                                      >
                                        {cancelLoading[task.id] ? (
                                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                        ) : (
                                          <i className="ri-close-circle-line"></i>
                                        )}
                                      </button>
                                    )}
                                    {task.status === 'CANCELLED' && (
                                      <button
                                        className="btn btn-sm btn-success"
                                        title="Reassign Task"
                                        onClick={() => handleOpenReassignModal(task)}
                                      >
                                        <i className="ri-user-add-line"></i>
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    
                    {/* Pagination */}
                    {!loading && totalPages > 1 && (
                      <div className="row mt-4">
                        <div className="col-sm-12 col-md-5 d-flex align-items-center justify-content-start">
                          <div className="dataTables_info">
                            Showing page {currentPage} of {totalPages} ({totalTasks} total tasks)
                          </div>
                        </div>
                        <div className="col-sm-12 col-md-7 d-flex align-items-center justify-content-end">
                          <div className="dataTables_paginate paging_simple_numbers">
                            <ul className="pagination">
                              <li className={`paginate_button page-item previous ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button 
                                  className="page-link" 
                                  onClick={() => handlePageChange(currentPage - 1)}
                                  disabled={currentPage === 1}
                                >
                                  Previous
                                </button>
                              </li>
                              
                              {[...Array(totalPages)].map((_, index) => {
                                const page = index + 1;
                                // Show first, last, current, and nearby pages
                                if (page === 1 || page === totalPages || 
                                    (page >= currentPage - 2 && page <= currentPage + 2)) {
                                  return (
                                    <li 
                                      key={page} 
                                      className={`paginate_button page-item ${currentPage === page ? 'active' : ''}`}
                                    >
                                      <button 
                                        className="page-link" 
                                        onClick={() => handlePageChange(page)}
                                      >
                                        {page}
                                      </button>
                                    </li>
                                  );
                                } else if (page === currentPage - 3 || page === currentPage + 3) {
                                  return <li key={page} className="paginate_button page-item disabled"><span className="page-link">...</span></li>;
                                }
                                return null;
                              })}
                              
                              <li className={`paginate_button page-item next ${currentPage === totalPages ? 'disabled' : ''}`}>
                                <button 
                                  className="page-link" 
                                  onClick={() => handlePageChange(currentPage + 1)}
                                  disabled={currentPage === totalPages}
                                >
                                  Next
                                </button>
                              </li>
                            </ul>
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

      {/* Reassign Task Modal */}
      {showReassignModal && selectedTask && (
        <>
          <div 
            className="modal-backdrop fade show" 
            style={{ zIndex: 1040 }}
            onClick={(e) => {
              // Only close if clicking directly on backdrop, not modal content
              if (e.target === e.currentTarget) {
                setShowReassignModal(false);
                setSelectedTask(null);
                setSelectedEmployee('');
              }
            }}
          ></div>
          <div 
            className="modal fade show" 
            style={{ display: 'block', zIndex: 1050 }} 
            tabIndex="-1"
            onClick={(e) => {
              // Prevent clicks inside modal from closing it
              e.stopPropagation();
            }}
          >
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="ri-user-add-line me-2"></i>
                    Reassign Task
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setShowReassignModal(false);
                      setSelectedTask(null);
                      setSelectedEmployee('');
                    }}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  {/* Task Details */}
                  <div className="card mb-3">
                    <div className="card-header bg-light">
                      <h6 className="mb-0">Task Details</h6>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-6 mb-2">
                          <strong>Title:</strong> {selectedTask.title}
                        </div>
                        <div className="col-md-6 mb-2">
                          <strong>Task Type:</strong> {getTaskTypeBadge(selectedTask.task_type)}
                        </div>
                        <div className="col-md-6 mb-2">
                          <strong>Priority:</strong>{' '}
                          <span className={`badge ${getPriorityBadgeClass(selectedTask.priority)}`}>
                            {selectedTask.priority || 'N/A'}
                          </span>
                        </div>
                        <div className="col-md-6 mb-2">
                          <strong>Status:</strong>{' '}
                          <span className={`badge ${getStatusBadgeClass(selectedTask.status)}`}>
                            {selectedTask.status ? selectedTask.status.replace('_', ' ') : 'N/A'}
                          </span>
                        </div>
                        {selectedTask.description && (
                          <div className="col-12 mb-2">
                            <strong>Description:</strong>
                            <p className="text-muted mb-0 mt-1">{selectedTask.description}</p>
                          </div>
                        )}
                        <div className="col-md-6 mb-2">
                          <strong>Due Date:</strong> {formatDate(selectedTask.due_date)}
                        </div>
                        <div className="col-md-6 mb-2">
                          <strong>Created Date:</strong> {formatDate(selectedTask.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Employee Selection */}
                  <div className="mb-3">
                    <label htmlFor="employeeSelect" className="form-label">
                      <strong>Select Employee to Reassign:</strong>
                    </label>
                    <select
                      id="employeeSelect"
                      className="form-select"
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                    >
                      <option value="">-- Select Employee --</option>
                      {departmentEmployees.map((employee) => (
                        <option key={employee.user_id || employee.id} value={employee.user_id || employee.id}>
                          {employee.name} 
                        </option>
                      ))}
                    </select>
                    {departmentEmployees.length === 0 && (
                      <small className="text-muted">No employees available in this department</small>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setShowReassignModal(false);
                      setSelectedTask(null);
                      setSelectedEmployee('');
                    }}
                    disabled={reassignLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={handleReassignTask}
                    disabled={reassignLoading || !selectedEmployee}
                  >
                    {reassignLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Reassigning...
                      </>
                    ) : (
                      <>
                        <i className="ri-user-add-line me-1"></i>
                        Reassign Task
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default DepartmentTasksPage;

