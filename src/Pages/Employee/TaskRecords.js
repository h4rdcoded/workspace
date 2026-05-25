import React, { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../Context/ConfigContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { buildApiUrl } from '../../config/api';
import { useNavigate, useLocation } from 'react-router-dom';
import EmployeeNavigation from './EmployeeNavigation';
import Snowfall from 'react-snowfall';

const TaskRecords = () => {
  const { leadCrmUser, isLeadCrmAuthenticated, leadCrmHeaders } = useContext(ConfigContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage] = useState(10);

  // Parse filter from URL query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const filterParam = searchParams.get('filter');
    if (filterParam) {
      setFilter(filterParam);
    }
  }, [location.search]);

  // Fetch all employee tasks (records)
  const fetchTaskRecords = async () => {
    try {
      
      if (!leadCrmUser || !leadCrmUser.id) {
        toast.error('User not authenticated');
        setLoading(false);
        return;
      }

      // Always use the authenticated user's tasks endpoint
      const endpoint = buildApiUrl('/tasks/my-tasks-with-subtasks') + '?limit=500';
      
      // Use the correct authentication method based on user type
      const config = isLeadCrmAuthenticated ? { 
        headers: leadCrmHeaders, 
        withCredentials: true 
      } : { 
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
        }
      };

      setLoading(true);
      
      const response = await axios.get(endpoint, config);

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
        
        // Set tasks, ensuring we have an array
        setTasks(uniqueTasks);
      } else {
        toast.error(`Failed to load task records: ${response.data.message || 'Unknown error'}`);
        setTasks([]); // Ensure tasks is an empty array on error
      }
    } catch (error) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to load task records'}`);
      } else {
        toast.error('Network error: Failed to load task records');
      }
      setTasks([]); // Ensure tasks is an empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskRecords();
  }, []);

  // Filter tasks based on status
  const filteredTasks = tasks.filter(task => {
    // Handle special filter cases
    if (filter === 'all') return true;
    
    // Handle combined filters (comma-separated)
    if (filter.includes(',')) {
      const statuses = filter.split(',');
      return statuses.includes(task.status);
    }
    
    // Handle overdue filter
    if (filter === 'OVERDUE') {
      const dueDate = task.due_date ? new Date(task.due_date) : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return dueDate && dueDate < today && task.status !== 'COMPLETED' && task.status !== 'CANCELLED';
    }
    
    // Handle regular status filter
    return task.status === filter;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortOrder === 'asc') {
      return new Date(a[sortBy]) - new Date(b[sortBy]);
    } else {
      return new Date(b[sortBy]) - new Date(a[sortBy]);
    }
  });

  // Get current tasks for pagination
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = sortedTasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(sortedTasks.length / tasksPerPage);

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
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Refresh task records
  const handleRefresh = () => {
    fetchTaskRecords();
    setCurrentPage(1); // Reset to first page on refresh
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Status badge styling without vibrant colors
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'ASSIGNED':
        return 'bg-light text-dark';
      case 'IN_PROGRESS':
        return 'bg-light text-primary';
      case 'SUBMITTED':
        return 'bg-light text-info';
      case 'COMPLETED':
        return 'bg-light text-success';
      case 'CANCELLED':
        return 'bg-light text-secondary';
      default:
        return 'bg-light text-dark';
    }
  };

  // Priority badge styling without vibrant colors
  const getPriorityBadgeClass = (priority) => {
    switch(priority) {
      case 'URGENT':
        return 'bg-light text-danger';
      case 'HIGH':
        return 'bg-light text-warning';
      case 'MEDIUM':
        return 'bg-light text-info';
      case 'LOW':
        return 'bg-light text-secondary';
      default:
        return 'bg-light text-muted';
    }
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
                <p className="mt-2 text-muted">Loading your task records...</p>
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
         <Snowfall
            style={{ position: 'fixed', width: '100vw', height: '100vh', top: 0, left: 0, zIndex: -1, pointerEvents: 'none' }}
            snowflakeCount={150}
            radius={[0.5, 3.0]}
            speed={[0.5, 1]}
            wind={[-0.5, 0.5]}
            color="rgba(105, 239, 251, 0.8)"
          />
          
          {/* Page title */}
          <div className="row">
            <div className="col-12">
              <div className="page-title-box d-flex align-items-center justify-content-between">
                <h4 className="mb-0">My Task Records</h4>
                <div className="page-title-right">
                  <ol className="breadcrumb m-0">
                    <li className="breadcrumb-item">Employee</li>
                    <li className="breadcrumb-item active">Task Records</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* Filter and sort controls */}
          <div className="row">
            <div className="col-12">
              <div className="card shadow-sm border-0 rounded-3">
                <div className="card-body">
                  <div className="d-flex flex-wrap gap-3 align-items-center">
                    <div className="me-2">
                      <label className="form-label me-2 fw-medium">Filter:</label>
                      <select 
                        className="form-select form-select-sm rounded-pill"
                        value={filter}
                        onChange={(e) => {
                          setFilter(e.target.value);
                          setCurrentPage(1); // Reset to first page when filter changes
                          
                          // Update URL with new filter
                          const searchParams = new URLSearchParams(location.search);
                          searchParams.set('filter', e.target.value);
                          navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
                        }}
                      >
                        <option value="all">All Tasks</option>
                        <option value="ASSIGNED">Assigned</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="SUBMITTED">Submitted</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="OVERDUE">Overdue</option>
                      </select>
                    </div>
                    
                    <div className="me-2">
                      <label className="form-label me-2 fw-medium">Sort by:</label>
                      <select 
                        className="form-select form-select-sm rounded-pill"
                        value={sortBy}
                        onChange={(e) => {
                          setSortBy(e.target.value);
                          setCurrentPage(1); // Reset to first page when sort changes
                        }}
                      >
                        <option value="created_at">Created Date</option>
                        <option value="due_date">Due Date</option>
                        <option value="completed_at">Completion Date</option>
                        <option value="title">Title</option>
                      </select>
                    </div>
                    
                    <div className="me-2">
                      <label className="form-label me-2 fw-medium">Order:</label>
                      <select 
                        className="form-select form-select-sm rounded-pill"
                        value={sortOrder}
                        onChange={(e) => {
                          setSortOrder(e.target.value);
                          setCurrentPage(1); // Reset to first page when sort order changes
                        }}
                      >
                        <option value="desc">Descending</option>
                        <option value="asc">Ascending</option>
                      </select>
                    </div>
                    
                    <button 
                      className="btn btn-outline-secondary rounded-pill ms-auto"
                      onClick={handleRefresh}
                    >
                      <i className="ri-refresh-line me-1"></i>
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Task records table */}
          <div className="row mt-4">
            <div className="col-12">
              <div className="card shadow-sm border-0 rounded-3">
                <div className="card-header bg-white border-0 pb-0">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="card-title mb-3">Task Records</h5>
                    <div className="small text-muted">
                      Showing {indexOfFirstTask + 1}-{Math.min(indexOfLastTask, sortedTasks.length)} of {sortedTasks.length} tasks
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  {currentTasks && currentTasks.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-centered table-nowrap mb-0">
                        <thead className="table-light">
                          <tr>
                            <th scope="col" className="rounded-start">Task</th>
                            <th scope="col">Type</th>
                            <th scope="col">Priority</th>
                            <th scope="col">Status</th>
                            <th scope="col">Assigned At</th>
                            <th scope="col">Due Date</th>
                            <th scope="col">Last Updated</th>
                            <th scope="col" className="rounded-end">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentTasks.map(task => (
                            <tr key={task.id} className="align-middle">
                              <td>
                                <h6 className="mb-1 fw-medium">
                                  {task.title?.substring(0,70) || 'No title'} 
                                </h6>
                                <p className="mb-0 text-muted small">
                                  {task.description ? task.description.substring(0, 50) + (task.description.length > 50 ? '...' : '') : 'No description'}
                                </p>
                              </td>
                              <td>
                                {task.task_type === 'DAILY_ROUTINE' ? (
                                  <span className="badge bg-light text-success px-2 py-1">Daily Routine</span>
                                ) : task.is_subtask ? (
                                  <span className="badge bg-light text-info px-2 py-1">Subtask</span>
                                ) : (
                                  <span className="badge bg-light text-primary px-2 py-1">Maintask</span>
                                )}
                              </td>
                              <td>
                                <span className={`badge ${getPriorityBadgeClass(task.priority)} px-2 py-1`}>
                                  {task.priority || 'MEDIUM'}
                                </span>
                              </td>
                              <td>
                                <span className={`badge ${getStatusBadgeClass(task.status)}  px-2 py-1`}>
                                  {task.status ? task.status.replace('_', ' ') : 'UNKNOWN'}
                                </span>
                              </td>
                              <td className="text-muted">{formatDate(task.created_at)}</td>
                              <td className={task.due_date && new Date(task.due_date) < new Date() && task.status !== 'COMPLETED' ? 'text-danger fw-medium' : 'text-muted'}>
                                {formatDate(task.due_date)}
                              </td>
                              <td className="text-muted">{task.updated_at ? new Date(task.updated_at).toLocaleDateString() : 'N/A'}</td>
                              <td>
                                <button 
                                  className="btn btn-sm btn-outline-primary rounded-pill px-3"
                                  onClick={() => navigate(`/employee/task/${task.id}`)}
                                >
                                  <i className="ri-eye-line me-1"></i>
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <i className="ri-file-list-line display-4 text-muted"></i>
                      <h5 className="mt-3">No task records found</h5>
                      <p className="text-muted">You don't have any task records at the moment.</p>
                      <button className="btn btn-primary rounded-pill px-4" onClick={handleRefresh}>
                        <i className="ri-refresh-line me-1"></i>
                        Refresh
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Pagination */}
          {sortedTasks.length > 0 && (
            <div className="row mt-4">
              <div className="col-12">
                <div className="card shadow-sm border-0 rounded-3">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="text-muted">
                        Showing {indexOfFirstTask + 1}-{Math.min(indexOfLastTask, sortedTasks.length)} of {sortedTasks.length} tasks
                      </div>
                      <nav>
                        <ul className="pagination mb-0">
                          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={prevPage}>
                              <i className="ri-arrow-left-line"></i>
                            </button>
                          </li>
                          
                          {/* First page */}
                          {currentPage > 3 && (
                            <>
                              <li className="page-item">
                                <button className="page-link" onClick={() => paginate(1)}>1</button>
                              </li>
                              {currentPage > 4 && (
                                <li className="page-item disabled">
                                  <span className="page-link">...</span>
                                </li>
                              )}
                            </>
                          )}
                          
                          {/* Previous page */}
                          {currentPage > 2 && (
                            <li className="page-item">
                              <button className="page-link" onClick={() => paginate(currentPage - 1)}>
                                {currentPage - 1}
                              </button>
                            </li>
                          )}
                          
                          {/* Current page */}
                          <li className="page-item active">
                            <span className="page-link bg-primary border-primary">
                              {currentPage}
                            </span>
                          </li>
                          
                          {/* Next page */}
                          {currentPage < totalPages - 1 && (
                            <li className="page-item">
                              <button className="page-link" onClick={() => paginate(currentPage + 1)}>
                                {currentPage + 1}
                              </button>
                            </li>
                          )}
                          
                          {/* Last page */}
                          {currentPage < totalPages - 2 && (
                            <>
                              {currentPage < totalPages - 3 && (
                                <li className="page-item disabled">
                                  <span className="page-link">...</span>
                                </li>
                              )}
                              <li className="page-item">
                                <button className="page-link " onClick={() => paginate(totalPages)}>
                                  {totalPages}
                                </button>
                              </li>
                            </>
                          )}
                          
                          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                            <button className="page-link " onClick={nextPage}>
                              <i className="ri-arrow-right-line"></i>
                            </button>
                          </li>
                        </ul>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskRecords;