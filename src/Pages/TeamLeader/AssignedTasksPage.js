import React, { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../Context/ConfigContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { buildApiUrl, getAuthHeaders } from '../../config/api';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const AssignedTasksPage = () => {
  const { leadCrmUser } = useContext(ConfigContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState(''); // Added search term state
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 15, // Changed from 10 to 15
    total: 0,
    total_pages: 1
  });
  
  // State for storing all tasks for accurate stats
  const [allTasks, setAllTasks] = useState([]);
  
  // Fetch assigned tasks
  const fetchTasks = async (page = 1, limit = 15) => { // Changed default limit to 15
    try {
      setLoading(true);
      
      // Fetch tasks assigned to the team leader (this endpoint now returns tasks regardless of department)
      // We'll use the first department for the API call, but the server will return all tasks for this team leader
      const deptResponse = await axios.get(
        buildApiUrl('/departments'),
        { headers: getAuthHeaders() }
      );

      if (deptResponse.data.success && deptResponse.data.data.length > 0) {
        // Use the first department for the API call
        const departmentId = deptResponse.data.data[0].id;
        
        // First fetch all tasks (without pagination) for accurate stats
        const allTasksResponse = await axios.get(
          buildApiUrl(`/departments/${departmentId}/tasks/assigned?limit=1000`),
          { headers: getAuthHeaders() }
      );

        if (allTasksResponse.data.success) {
          if (allTasksResponse.data.data.tasks) {
            setAllTasks(allTasksResponse.data.data.tasks);
          } else if (Array.isArray(allTasksResponse.data.data)) {
            setAllTasks(allTasksResponse.data.data);
          }
        }
        
        // Fetch paginated tasks for display
        const response = await axios.get(
          buildApiUrl(`/departments/${departmentId}/tasks/assigned?page=${page}&limit=${limit}`),
          { headers: getAuthHeaders() }
        );

        if (response.data.success) {
          // Handle paginated response
          if (response.data.data.tasks) {
            setTasks(response.data.data.tasks);
            setPagination({
              ...response.data.data.pagination,
              // Ensure we have the correct total count
              total: allTasksResponse.data.data.pagination?.total || response.data.data.pagination.total,
              total_pages: Math.ceil((allTasksResponse.data.data.pagination?.total || response.data.data.pagination.total) / limit)
            });
          } else if (Array.isArray(response.data.data)) {
            setTasks(response.data.data);
            // Calculate pagination for array response
            setPagination({
              current_page: page,
              per_page: limit,
              total: allTasks.length,
              total_pages: Math.ceil(allTasks.length / limit)
            });
          } else {
            setTasks(response.data.data || []);
            setPagination({
              current_page: page,
              per_page: limit,
              total: allTasks.length,
              total_pages: Math.ceil(allTasks.length / limit)
            });
          }
        } else {
          toast.error('Failed to load tasks');
        }
      } else {
        toast.error('No department found for user');
      }
    } catch (error) {
      
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // Take task for self
  const takeTaskForSelf = async (taskId) => {
    try {
      const response = await axios.post(
        buildApiUrl(`/tasks/${taskId}/take`),
        {},
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        toast.success('Task taken for self successfully!');
      
        // Immediately update the UI to hide the buttons
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === taskId ? { ...task, assigned_to: leadCrmUser?.id } : task
          )
        );
      
        // Also update allTasks
        setAllTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === taskId ? { ...task, assigned_to: leadCrmUser?.id } : task
          )
        );
      } else {
        toast.error(response.data.message || 'Failed to take task for self');
      }
    } catch (error) {
      
      toast.error('Failed to take task for self');
    }
  };

  // Set active tab based on URL parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['all', 'completed', 'pending', 'submitted', 'overdue'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  useEffect(() => {
    fetchTasks(pagination.current_page, pagination.per_page);
  }, [pagination.current_page, pagination.per_page]);

  // Filter tasks based on active tab and search term
  const filteredTasks = tasks.filter(task => {
    // First apply tab filter
    let tabFilterPassed = false;
    switch (activeTab) {
      case 'completed':
        tabFilterPassed = task.status === 'COMPLETED';
        break;
      case 'pending':
        tabFilterPassed = task.status !== 'COMPLETED';
        break;
      case 'overdue':
        tabFilterPassed = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'COMPLETED';
        break;
      case 'submitted': // Added submitted filter
        tabFilterPassed = task.status === 'SUBMITTED';
        break;
      default:
        tabFilterPassed = true;
    }
    
    // Then apply search filter
    if (!searchTerm) return tabFilterPassed;
    
    const searchLower = searchTerm.toLowerCase();
    const taskTitleMatch = task.title && task.title.toLowerCase().includes(searchLower);
    const assignedToMatch = task.assigned_to_name && task.assigned_to_name.toLowerCase().includes(searchLower);
    const createdByMatch = task.created_by_name && task.created_by_name.toLowerCase().includes(searchLower);
    
    return tabFilterPassed && (taskTitleMatch || assignedToMatch || createdByMatch);
  });

  // Calculate statistics using allTasks for accurate counts
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(t => t.status === 'COMPLETED').length;
  const pendingTasks = allTasks.filter(t => t.status !== 'COMPLETED').length;
  const overdueTasks = allTasks.filter(t => 
    t.due_date && new Date(t.due_date) < new Date() && t.status !== 'COMPLETED'
  ).length;
  // Added submitted tasks count
  const submittedTasks = allTasks.filter(t => t.status === 'SUBMITTED').length;

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Format assigned date
  const formatAssignedDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Helper function to determine if a task is taken for self
  const isTaskTakenForSelf = (task) => {
    if (!leadCrmUser) return false;
    return task.assigned_to === leadCrmUser.id;
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
          <div className="row">
            <div className="col-12">
              {/* Header */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h4 className="mb-0">Assigned Tasks</h4>
                      <p className="text-muted mb-0">View and manage tasks assigned by admin to you</p>
                    </div>
                
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="row mb-4 g-4">
                <div className="col-md-3">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <div className="d-flex align-items-center">
                        <div className="flex-shrink-0 bg-info bg-opacity-10 rounded-3 p-3">
                          <i className="ri-task-line text-info fs-4"></i>
                        </div>
                        <div className="flex-grow-1 ms-3">
                          <h5 className="card-title mb-0">Total Tasks</h5>
                          <h3 className="mb-0">{totalTasks}</h3>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-3">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <div className="d-flex align-items-center">
                        <div className="flex-shrink-0 bg-success bg-opacity-10 rounded-3 p-3">
                          <i className="ri-checkbox-circle-line text-success fs-4"></i>
                        </div>
                        <div className="flex-grow-1 ms-3">
                          <h5 className="card-title mb-0">Completed</h5>
                          <h3 className="mb-0">{completedTasks}</h3>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-3">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <div className="d-flex align-items-center">
                        <div className="flex-shrink-0 bg-warning bg-opacity-10 rounded-3 p-3">
                          <i className="ri-time-line text-warning fs-4"></i>
                        </div>
                        <div className="flex-grow-1 ms-3">
                          <h5 className="card-title mb-0">Pending</h5>
                          <h3 className="mb-0">{pendingTasks}</h3>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-3">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <div className="d-flex align-items-center">
                        <div className="flex-shrink-0 bg-danger bg-opacity-10 rounded-3 p-3">
                          <i className="ri-alert-line text-danger fs-4"></i>
                        </div>
                        <div className="flex-grow-1 ms-3">
                          <h5 className="card-title mb-0">Overdue</h5>
                          <h3 className="mb-0">{overdueTasks}</h3>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Bar and Tabs */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="d-flex justify-content-between align-items-center flex-wrap">
                    
                    {/* Tabs */}
                    <div className="mt-2 mt-md-0">
                      <ul className="nav nav-tabs">
                        <li className="nav-item">
                          <button 
                            className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
                            onClick={() => setActiveTab('all')}
                          >
                            All ({totalTasks})
                          </button>
                        </li>
                        <li className="nav-item">
                          <button 
                            className={`nav-link ${activeTab === 'completed' ? 'active' : ''}`}
                            onClick={() => setActiveTab('completed')}
                          >
                            Completed ({completedTasks})
                          </button>
                        </li>
                        <li className="nav-item">
                          <button 
                            className={`nav-link ${activeTab === 'pending' ? 'active' : ''}`}
                            onClick={() => setActiveTab('pending')}
                          >
                            Pending ({pendingTasks})
                          </button>
                        </li>
                        <li className="nav-item">
                          <button 
                            className={`nav-link ${activeTab === 'submitted' ? 'active' : ''}`} // Added submitted tab
                            onClick={() => setActiveTab('submitted')}
                          >
                            Submitted ({submittedTasks})
                          </button>
                        </li>
                        <li className="nav-item">
                          <button 
                            className={`nav-link ${activeTab === 'overdue' ? 'active' : ''}`}
                            onClick={() => setActiveTab('overdue')}
                          >
                            Overdue ({overdueTasks})
                          </button>
                        </li>
                      </ul>
                    </div>

                    {/* Search Bar */}
                    
                    <div className="search-box position-relative mb-2 mb-md-0" style={{ flex: '1', maxWidth: '450px' }}>
                      <input
                        type="text"
                        className="form-control ps-5"
                        placeholder="Search tasks by title, assigned to, or assigned by..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <i className="ri-search-line position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                    </div>
                  </div>
                </div>
              </div>

              {/* Task List */}
              <div className="row">
                <div className="col-12">
                  <div className="card border-0 shadow-sm">
                    <div className="card-header bg-white border-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Tasks Overview</h5>
                        <span className="badge bg-primary">{filteredTasks.length} Tasks</span>
                      </div>
                    </div>
                    <div className="card-body">
                      {filteredTasks.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-centered table-nowrap mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>Task Title</th>
                                <th>Assigned By</th>
                                <th>Assigned To</th>
                                <th>Due Date</th>
                                <th>Assigned Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredTasks.map(task => (
                                <tr key={task.id}>
                                  <td>
                                    <h6 className="mb-0">{task.title?.substring(0,80)}</h6>
                                  </td>
                                  <td>
                                    <p className="mb-0 text-muted small"> {task.created_by_name}</p>
                                  </td>
                                  <td>
                                    <p className="mb-0 text-muted small">{task.assigned_to_name || 'Unassigned'}</p>
                                  </td>
                                  <td>
                                    <span >
                                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                                    </span>
                                  </td>
                                  <td>
                                    <span >
                                      {task.assigned_at ? new Date(task.assigned_at).toLocaleDateString() : 'N/A'}
                                    </span>
                                  </td>
                                  <td>
                                    <span className={`badge ${
                                      task.status === 'COMPLETED' ? 'bg-success' : 
                                      task.status === 'IN_PROGRESS' ? 'bg-warning' : 
                                      task.status === 'SUBMITTED' ? 'bg-primary' : 
                                      'bg-secondary'
                                    }`}>
                                      {task.status.replace('_', ' ')}
                                    </span>
                                  </td>
                                  <td>
                                    <div className="dropdown">
                                      <button 
                                        className="btn btn-sm btn-outline-secondary" 
                                        type="button" 
                                        data-bs-toggle="dropdown"
                                      >
                                        <i className="ri-more-2-fill"></i>
                                      </button>
                                      <ul className="dropdown-menu dropdown-menu-end">
                                        {!isTaskTakenForSelf(task) && (
                                          <li>
                                            <Link 
                                              to={`/team-leader/task/${task.id}/breakdown`}
                                              className="dropdown-item d-flex align-items-center"
                                            >
                                              <i className="ri-task-line me-2"></i>
                                              Assign Task
                                            </Link>
                                          </li>
                                        )}
                                        {task.subtask_count === 0 && !isTaskTakenForSelf(task) && (
                                          <li>
                                            <button 
                                              onClick={() => takeTaskForSelf(task.id)}
                                              className="dropdown-item d-flex align-items-center"
                                            >
                                              <i className="ri-user-line me-2"></i>
                                              Take for Self
                                            </button>
                                          </li>
                                        )}
                                        <li>
                                          <Link 
                                            to={`/team-leader/task/${task.id}/view`}
                                            className="dropdown-item d-flex align-items-center"
                                          >
                                            <i className="ri-eye-line me-2"></i>
                                            View Details
                                          </Link>
                                        </li>
                                      </ul>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <i className="ri-task-line display-4 text-muted"></i>
                          <h5 className="mt-3">No tasks found</h5>
                          <p className="text-muted">There are no tasks matching the current filter.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Pagination - Always visible */}
              <div className="row mt-4">
                <div className="col-12">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <span className="text-muted">Showing {Math.min(pagination.per_page, filteredTasks.length)} of {allTasks.length} tasks</span>
                        </div>
                        <div>
                          <select 
                            className="form-select form-select-sm" 
                            value={pagination.per_page}
                            onChange={(e) => setPagination({...pagination, per_page: parseInt(e.target.value), current_page: 1})}
                          >
                            <option value="15">15 per page</option>
                            <option value="25">25 per page</option>
                            <option value="50">50 per page</option>
                            <option value="100">100 per page</option>
                          </select>
                        </div>
                      </div>
                  
                      <nav aria-label="Task pagination">
                        <ul className="pagination justify-content-center mb-0">
                          <li className={`page-item ${pagination.current_page === 1 ? 'disabled' : ''}`}>
                            <button 
                              className="page-link" 
                              onClick={() => setPagination({...pagination, current_page: Math.max(1, pagination.current_page - 1)})}
                              disabled={pagination.current_page === 1}
                            >
                              <i className="ri-arrow-left-s-line"></i>
                            </button>
                          </li>
                          
                          {/* First page */}
                          {pagination.current_page > 3 && (
                            <>
                              <li className="page-item">
                                <button 
                                  className="page-link" 
                                  onClick={() => setPagination({...pagination, current_page: 1})}
                                >
                                  1
                                </button>
                              </li>
                              {pagination.current_page > 4 && (
                                <li className="page-item disabled">
                                  <span className="page-link">...</span>
                                </li>
                              )}
                            </>
                          )}
                          
                          {/* Pages around current */}
                          {Array.from({ length: Math.min(5, Math.max(1, pagination.total_pages)) }, (_, i) => {
                            const start = Math.max(1, Math.min(pagination.current_page - 2, pagination.total_pages - 4));
                            const page = start + i;
                            if (page <= pagination.total_pages) {
                              return (
                                <li key={page} className={`page-item ${pagination.current_page === page ? 'active' : ''}`}>
                                  <button 
                                    className="page-link" 
                                    onClick={() => setPagination({...pagination, current_page: page})}
                                  >
                                    {page}
                                  </button>
                                </li>
                              );
                            }
                            return null;
                          })}
                          
                          {/* Last page */}
                          {pagination.current_page < pagination.total_pages - 2 && (
                            <>
                              {pagination.current_page < pagination.total_pages - 3 && (
                                <li className="page-item disabled">
                                  <span className="page-link">...</span>
                                </li>
                              )}
                              <li className="page-item">
                                <button 
                                  className="page-link" 
                                  onClick={() => setPagination({...pagination, current_page: pagination.total_pages})}
                                >
                                  {pagination.total_pages}
                                </button>
                              </li>
                            </>
                          )}
                          
                          <li className={`page-item ${pagination.current_page === pagination.total_pages ? 'disabled' : ''}`}>
                            <button 
                              className="page-link" 
                              onClick={() => setPagination({...pagination, current_page: Math.min(pagination.total_pages, pagination.current_page + 1)})}
                              disabled={pagination.current_page === pagination.total_pages}
                            >
                              <i className="ri-arrow-right-s-line"></i>
                            </button>
                          </li>
                        </ul>
                      </nav>
                        
                     
                      </div>
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

export default AssignedTasksPage;