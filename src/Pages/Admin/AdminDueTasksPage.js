import React, { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../Context/ConfigContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { buildApiUrl, getAuthHeaders } from '../../config/api';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AdminDueTasksPage = () => {
  const { leadCrmUser } = useContext(ConfigContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]); // Store all tasks for counting
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [employeeNames, setEmployeeNames] = useState({}); // Map of user ID to name
  const [selectedDepartment, setSelectedDepartment] = useState(searchParams.get('department') || 'all');
  const [selectedTaskType, setSelectedTaskType] = useState(searchParams.get('taskType') || 'all');
  const [selectedDate, setSelectedDate] = useState(searchParams.get('date') || '');
  const [filterType, setFilterType] = useState(searchParams.get('filter') || 'all'); // 'all', 'today', 'tomorrow', 'overdue', 'custom'
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage] = useState(20);
  
  // Modal states
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const [loadingEmployee, setLoadingEmployee] = useState(false);
  
  const { staticFilesBaseURL } = useContext(ConfigContext);

  // Function to get profile image URL with fallback
  const getProfileImageUrl = (employee) => {
    if (employee && employee.profile_image) {
      const baseUrl = staticFilesBaseURL || process.env.REACT_APP_SERVER_URL || 'https://task.ipshopy.com';
      const imagePath = employee.profile_image.split('?')[0];
      if (staticFilesBaseURL) {
        return `${staticFilesBaseURL}/${imagePath}?t=${new Date().getTime()}`;
      } else {
        return `${baseUrl}${imagePath.startsWith('/') ? imagePath : '/' + imagePath}?t=${new Date().getTime()}`;
      }
    }
    return null;
  };

  // Handle task click - fetch employee details and show modal
  const handleTaskClick = async (task) => {
    if (!task.assigned_to) {
      toast.info('This task is not assigned to any employee');
      return;
    }

    try {
      setLoadingEmployee(true);
      setSelectedTask(task);
      
      // Fetch employee details
      const response = await axios.get(
        buildApiUrl(`/users/${task.assigned_to}`),
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        const employeeData = response.data.data?.user || response.data.data;
        setSelectedEmployee(employeeData);
        setShowTaskModal(true);
      } else {
        toast.error('Failed to load employee details');
      }
    } catch (error) {
      console.error('Error fetching employee details:', error);
      toast.error('Failed to load employee details');
    } finally {
      setLoadingEmployee(false);
    }
  };

  // Close modal with smooth animation
  const handleCloseTaskModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowTaskModal(false);
      setIsClosing(false);
      setSelectedTask(null);
      setSelectedEmployee(null);
    }, 300);
  };

  // Get current page tasks
  const getCurrentPageTasks = () => {
    const indexOfLastTask = currentPage * tasksPerPage;
    const indexOfFirstTask = indexOfLastTask - tasksPerPage;
    return tasks.slice(indexOfFirstTask, indexOfLastTask);
  };

  // Calculate total pages
  const totalPages = Math.ceil(tasks.length / tasksPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDepartment, selectedTaskType, selectedDate, filterType]);

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      const response = await axios.get(
        buildApiUrl('/departments'),
        { headers: getAuthHeaders() }
      );
      if (response.data.success) {
        setDepartments(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  // Fetch employee names for assigned_to IDs
  const fetchEmployeeNames = async (userIds) => {
    if (!userIds || userIds.length === 0) return;
    
    try {
      // Fetch unique user IDs and convert to numbers for comparison
      const uniqueIds = [...new Set(userIds.map(id => parseInt(id)).filter(id => !isNaN(id) && id > 0))];
      
      if (uniqueIds.length === 0) {
        return;
      }

      // Fetch employee names - using admin all employees endpoint
      const nameMap = {};
      
      try {
        const response = await axios.get(
          buildApiUrl('/admin/all-employees'),
          { headers: getAuthHeaders() }
        );
        
        if (response.data.success) {
          const employees = response.data.data || [];
          
          employees.forEach(emp => {
            const empId = parseInt(emp.id);
            if (empId && uniqueIds.includes(empId)) {
              // Store with multiple key formats for flexibility
              nameMap[empId] = emp.name || 'Unknown';
              nameMap[String(empId)] = emp.name || 'Unknown';
              nameMap[Number(empId)] = emp.name || 'Unknown';
            }
          });
        }
      } catch (error) {
        console.error('Failed to fetch all employees:', error);
        console.error('Error details:', error.response?.data || error.message);
      }
      
      if (Object.keys(nameMap).length > 0) {
        setEmployeeNames(prev => ({ ...prev, ...nameMap }));
      }
    } catch (error) {
      console.error('Failed to fetch employee names:', error);
    }
  };

  // Fetch tasks based on filters
  const fetchTasks = async () => {
    try {
      setLoading(true);
      
      // Get all tasks (excluding daily routine) - we'll filter by due date on frontend
      const response = await axios.get(
        buildApiUrl('/tasks'),
        { 
          headers: getAuthHeaders(),
          params: {
            page: 1,
            limit: 1000 // Get a large number to filter on frontend
          }
        }
      );

      if (response.data.success) {
        // Handle different response structures
        let allTasks = response.data.data?.tasks || response.data.data || [];
        
        // Filter out daily routine tasks
        allTasks = allTasks.filter(task => task.task_type !== 'DAILY_ROUTINE');
        
        // Filter by department
        if (selectedDepartment !== 'all') {
          allTasks = allTasks.filter(task => 
            task.assigned_to_department === parseInt(selectedDepartment) ||
            task.department_id === parseInt(selectedDepartment)
          );
        }
        
        // Filter by task type
        if (selectedTaskType !== 'all') {
          allTasks = allTasks.filter(task => task.task_type === selectedTaskType);
        }
        
        // Filter by due date based on filterType
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        let filteredTasks = [];
        
        if (filterType === 'today') {
          filteredTasks = allTasks.filter(task => {
            if (!task.due_date) return false;
            const dueDate = new Date(task.due_date);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate.getTime() === today.getTime();
          });
        } else if (filterType === 'tomorrow') {
          filteredTasks = allTasks.filter(task => {
            if (!task.due_date) return false;
            const dueDate = new Date(task.due_date);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate.getTime() === tomorrow.getTime();
          });
        } else if (filterType === 'overdue') {
          filteredTasks = allTasks.filter(task => {
            if (!task.due_date) return false;
            const dueDate = new Date(task.due_date);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate.getTime() < today.getTime() && task.status !== 'COMPLETED';
          });
        } else if (filterType === 'custom' && selectedDate) {
          const customDate = new Date(selectedDate);
          customDate.setHours(0, 0, 0, 0);
          filteredTasks = allTasks.filter(task => {
            if (!task.due_date) return false;
            const dueDate = new Date(task.due_date);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate.getTime() === customDate.getTime();
          });
        } else {
          // Show all tasks with due dates
          filteredTasks = allTasks.filter(task => task.due_date !== null);
        }
        
        // Sort by due date (overdue first, then by date)
        filteredTasks.sort((a, b) => {
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          const dateA = new Date(a.due_date);
          const dateB = new Date(b.due_date);
          const todayTime = today.getTime();
          
          // Overdue tasks first
          const aIsOverdue = dateA.getTime() < todayTime && a.status !== 'COMPLETED';
          const bIsOverdue = dateB.getTime() < todayTime && b.status !== 'COMPLETED';
          
          if (aIsOverdue && !bIsOverdue) return -1;
          if (!aIsOverdue && bIsOverdue) return 1;
          
          // Then sort by date
          return dateA.getTime() - dateB.getTime();
        });
        
        setTasks(filteredTasks);
        setAllTasks(allTasks); // Store all tasks for counting
        
        // Fetch employee names for assigned_to IDs
        const assignedToIds = allTasks
          .map(task => task.assigned_to)
          .filter(id => id !== null && id !== undefined && id !== '');
        
        if (assignedToIds.length > 0) {
          fetchEmployeeNames(assignedToIds);
        }
      } else {
        toast.error(`Failed to load tasks: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
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
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchTasks();
    // Update URL params
    const params = new URLSearchParams();
    if (selectedDepartment !== 'all') params.set('department', selectedDepartment);
    if (selectedTaskType !== 'all') params.set('taskType', selectedTaskType);
    if (selectedDate) params.set('date', selectedDate);
    if (filterType !== 'all') params.set('filter', filterType);
    setSearchParams(params);
  }, [selectedDepartment, selectedTaskType, selectedDate, filterType]);

  const handleFilterChange = (newFilter) => {
    setFilterType(newFilter);
    if (newFilter === 'custom') {
      // Set today's date as default for custom
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate(today);
    } else {
      setSelectedDate('');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-success';
      case 'IN_PROGRESS':
        return 'bg-warning';
      case 'SUBMITTED':
        return 'bg-primary';
      case 'CANCELLED':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-danger';
      case 'HIGH':
        return 'bg-warning';
      case 'MEDIUM':
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  };

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'COMPLETED') return false;
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due.getTime() < today.getTime();
  };

  // Get task type badge class
  const getTaskTypeBadgeClass = (taskType) => {
    switch (taskType) {
      case 'MAIN_TASK':
        return 'bg-primary';
      case 'SUBTASK':
        return 'bg-info';
      case 'DAILY_ROUTINE':
        return 'bg-warning';
      default:
        return 'bg-secondary';
    }
  };

  // Calculate counts for each filter
  const getFilterCounts = () => {
    if (allTasks.length === 0) {
      return {
        today: 0,
        tomorrow: 0,
        overdue: 0,
        all: 0
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Filter tasks with due dates only
    const tasksWithDueDate = allTasks.filter(task => task.due_date !== null);

    const todayCount = tasksWithDueDate.filter(task => {
      const dueDate = new Date(task.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() === today.getTime();
    }).length;

    const tomorrowCount = tasksWithDueDate.filter(task => {
      const dueDate = new Date(task.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() === tomorrow.getTime();
    }).length;

    const overdueCount = tasksWithDueDate.filter(task => {
      const dueDate = new Date(task.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() < today.getTime() && task.status !== 'COMPLETED';
    }).length;

    return {
      today: todayCount,
      tomorrow: tomorrowCount,
      overdue: overdueCount,
      all: tasksWithDueDate.length
    };
  };

  // Get department name by ID
  const getDepartmentName = (departmentId) => {
    if (!departmentId) return 'N/A';
    const dept = departments.find(d => d.id === departmentId);
    return dept ? dept.name : 'N/A';
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
                <p className="mt-2 text-muted">Loading due tasks...</p>
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
                      <h4 className="mb-0">Due Tasks Management</h4>
                      <p className="text-muted mb-0">View and manage tasks by due date</p>
                    </div>
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-outline-secondary"
                        onClick={() => navigate('/admin/dashboard')}
                      >
                        <i className="ri-arrow-left-line me-2"></i>
                        Back
                      </button>
                      <button 
                        className="btn btn-soft-primary"
                      
                      >
                        <i className="ri-hashtag me-2"></i>
                        <span className="text">{tasks.length} Tasks</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body">
                      <div className="row g-3">
                        {/* Quick Filter Buttons */}
                        <div className="col-12">
                          <label className="form-label fw-semibold">Quick Filters</label>
                          <div className="d-flex flex-wrap gap-2">
                            {/* <button
                              className={`btn ${filterType === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                              onClick={() => handleFilterChange('all')}
                            >
                              All Due Tasks
                            </button> */}
                            <button
                              className={`btn ${filterType === 'today' ? 'btn-soft-warning' : 'btn-outline-warning'}`}
                              onClick={() => handleFilterChange('today')}
                            >
                              Today's Due Tasks
                            </button>
                            <button
                              className={`btn ${filterType === 'tomorrow' ? 'btn-soft-info' : 'btn-outline-info'}`}
                              onClick={() => handleFilterChange('tomorrow')}
                            >
                              Tomorrow's Due Tasks
                            </button>
                            <button
                              className={`btn ${filterType === 'overdue' ? 'btn-soft-danger' : 'btn-outline-danger'}`}
                              onClick={() => handleFilterChange('overdue')}
                            >
                              Overdue Tasks
                            </button>
                            <button
                              className={`btn ${filterType === 'custom' ? 'btn-soft-primary' : 'btn-outline-primary'}`}
                              onClick={() => handleFilterChange('custom')}
                            >
                              Custom Date
                            </button>
                          </div>
                        </div>








                        {/* Task Counts Display */}
                        {/* <div className="col-12">
                          <div className="d-flex flex-wrap gap-3 align-items-center">
                            <div className="d-flex align-items-center gap-2">
                              <span className="badge bg-soft-warning text-warning">
                                Today: {getFilterCounts().today}
                              </span>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                              <span className="badge bg-soft-info text-info">
                                Tomorrow: {getFilterCounts().tomorrow}
                              </span>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                              <span className="badge bg-soft-danger text-danger">
                                Overdue: {getFilterCounts().overdue}
                              </span>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                              <span className="badge bg-soft-primary text-primary">
                                Total: {getFilterCounts().all}
                              </span>
                            </div>
                          </div>
                        </div> */}

                        {/* Custom Date Picker */}
                        {filterType === 'custom' && (
                          <div className="col-md-4">
                            <label className="form-label fw-semibold">Select Date</label>
                            <input
                              type="date"
                              className="form-control"
                              value={selectedDate}
                              onChange={(e) => setSelectedDate(e.target.value)}
                            />
                          </div>
                        )}

                        {/* Department Filter */}
                        <div className="col-md-4">
                          <label className="form-label fw-semibold">Department</label>
                          <select
                            className="form-select"
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

                        {/* Task Type Filter */}
                        <div className="col-md-4">
                          <label className="form-label fw-semibold">Task Type</label>
                          <select
                            className="form-select"
                            value={selectedTaskType}
                            onChange={(e) => setSelectedTaskType(e.target.value)}
                          >
                            <option value="all">All Task Types</option>
                            <option value="MAIN_TASK">Main Task</option>
                            <option value="SUBTASK">Subtask</option>
                          </select>
                        </div>
                      </div>
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
                        <h5 className="mb-0">Due Tasks</h5>
                        <span className="badge bg-primary">
                          {tasks.length} Task{tasks.length !== 1 ? 's' : ''}
                          {tasks.length > tasksPerPage && ` (Page ${currentPage} of ${totalPages})`}
                        </span>
                      </div>
                    </div>
                    <div className="card-body">
                      {tasks.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-centered table-nowrap mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>Task Title</th>
                                <th>Task Type</th>
                                
                                <th>Assigned To</th>
                                <th>Due Date</th>
                                <th>Status</th>
                               
                              </tr>
                            </thead>
                            <tbody>
                              {getCurrentPageTasks().map(task => {
                                const overdue = isOverdue(task.due_date, task.status);
                                return (
                                  <tr 
                                    key={task.id}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleTaskClick(task)}
                                  >
                                    <td>
                                      <h6 className="mb-0">
                                        {overdue 
                                          ? (task.title && task.title.length > 50 
                                              ? `${task.title.substring(0, 80)}...` 
                                              : task.title || 'Untitled Task')
                                          : (task.title || 'Untitled Task')
                                        }
                                      </h6>
                                      {task.description && (
                                        <small className="text-muted d-block">
                                          {task.description.substring(0, 50)}...
                                        </small>
                                      )}
                                    </td>
                                    <td>
                                      <span className={`badge ${getTaskTypeBadgeClass(task.task_type || 'MAIN_TASK')}`}>
                                        {task.task_type || 'MAIN_TASK'}
                                      </span>
                                    </td>
                                    {/* <td>
                                      <span>
                                        {task.department_name || 
                                         getDepartmentName(task.assigned_to_department) || 
                                         'N/A'}
                                      </span>
                                    </td> */}
                                    <td>
                                      <span>
                                        {(() => {
                                          // Priority 1: Get employee name from our fetched map using assigned_to ID
                                          if (task.assigned_to) {
                                            const assignedToId = task.assigned_to;
                                            // Try multiple key formats
                                            const employeeName = employeeNames[assignedToId] || 
                                                                 employeeNames[parseInt(assignedToId)] ||
                                                                 employeeNames[String(assignedToId)] ||
                                                                 employeeNames[Number(assignedToId)];
                                            if (employeeName && employeeName !== 'Unknown') {
                                              return employeeName;
                                            }
                                          }
                                          
                                          // Priority 2: If we have assigned_to but no name yet, show loading
                                          if (task.assigned_to && Object.keys(employeeNames).length === 0) {
                                            return 'Loading...';
                                          }
                                          
                                          // Priority 3: Check if assigned_to_name might be the employee (if assigned_to exists and matches)
                                          // But only if we don't have a team leader assigned (to avoid confusion)
                                          if (task.assigned_to && !task.assigned_to_team_leader && task.assigned_to_name) {
                                            return task.assigned_to_name;
                                          }
                                          
                                          // Priority 4: Last resort - show assigned_to_name or Unassigned
                                          return task.assigned_to_name || 'Unassigned';
                                        })()}
                                      </span>
                                    </td>
                                    <td>
                                      {task.due_date ? (
                                        <div>
                                          <span className={overdue ? 'text-danger fw-bold' : ''}>
                                            {new Date(task.due_date).toLocaleDateString()}
                                          </span>
                                          {overdue && (
                                            <span className="badge bg-danger ms-2">Overdue</span>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-muted">No due date</span>
                                      )}
                                    </td>
                                    <td>
                                      <span className={`badge ${getStatusBadgeClass(task.status)}`}>
                                        {task.status?.replace('_', ' ') || 'N/A'}
                                      </span>
                                    </td>
                                    {/* <td>
                                      <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>
                                        {task.priority || 'MEDIUM'}
                                      </span>
                                    </td>
                                    <td>
                                      <button
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(`/admin/task_Approvel/${task.id}`);
                                        }}
                                      >
                                        <i className="ri-eye-line me-1"></i>
                                        View
                                      </button>
                                    </td> */}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-5">
                          <i className="ri-task-line display-4 text-muted"></i>
                          <h5 className="mt-3">No tasks found</h5>
                          <p className="text-muted">
                            {filterType === 'overdue' 
                              ? 'No overdue tasks found.' 
                              : filterType === 'today'
                              ? 'No tasks due today.'
                              : filterType === 'tomorrow'
                              ? 'No tasks due tomorrow.'
                              : 'No tasks match the selected filters.'}
                          </p>
                        </div>
                      )}
                      
                      {/* Pagination */}
                      {tasks.length > tasksPerPage && (
                        <div className="d-flex justify-content-between align-items-center mt-3">
                          <div>
                            <p className="text-muted mb-0">
                              Showing {((currentPage - 1) * tasksPerPage) + 1} to {Math.min(currentPage * tasksPerPage, tasks.length)} of {tasks.length} tasks
                            </p>
                          </div>
                          <nav aria-label="Task pagination">
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
                              
                              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                  pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                  pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                  pageNum = totalPages - 4 + i;
                                } else {
                                  pageNum = currentPage - 2 + i;
                                }
                                
                                return (
                                  <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                                    <button 
                                      className="page-link" 
                                      onClick={() => setCurrentPage(pageNum)}
                                    >
                                      {pageNum}
                                    </button>
                                  </li>
                                );
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
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Details Modal - Slide in from right */}
      {showTaskModal && selectedTask && selectedEmployee && (
        <>
          {/* Light Backdrop - Semi-transparent */}
          <div 
            onClick={handleCloseTaskModal}
            style={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              zIndex: 1040,
              opacity: isClosing ? 0 : 1,
              transition: 'opacity 0.3s ease-in'
            }}
          ></div>
          
          {/* Modal Container - Fixed on right side */}
          <div 
            className="modal fade show"
            style={{ 
              display: 'block', 
              zIndex: 1050,
              position: 'fixed',
              top: 0,
              right: 0,
              left: 'auto',
              height: '100vh',
              width: '500px',
              maxWidth: '90vw',
              margin: 0,
              padding: 0,
              animation: isClosing ? 'slideOutRight 0.3s ease-in' : 'slideInRight 0.3s ease-out',
              transform: isClosing ? 'translateX(100%)' : 'translateX(0)',
              transition: isClosing ? 'transform 0.3s ease-in, opacity 0.3s ease-in' : 'none'
            }}
            tabIndex="-1"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCloseTaskModal();
              }
            }}
          >
            <div 
              className="modal-dialog modal-dialog-scrollable h-100 m-0"
              style={{ 
                maxWidth: '100%', 
                width: '100%',
                margin: 0,
                position: 'relative',
                right: 0
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content h-100 border-0 rounded-0 shadow-lg">
                {/* Modal Header */}
                <div className="modal-header text-white border-0" >
                  <h5 className="modal-title mb-0">
                    <i className="ri-task-line me-2"></i>
                    Task & Employee Details
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white" 
                    onClick={handleCloseTaskModal}
                    aria-label="Close"
                  ></button>
                </div>

                {/* Modal Body */}
                <div className="modal-body p-4">
                  {/* Employee Profile Section */}
                  <div className="text-center  pb-1 order-1 border-bottom">
                    <div className="avatar-xxl mx-auto position-relative mb-3" style={{ width: '200px', height: '200px' }}>
                      {getProfileImageUrl(selectedEmployee) ? (
                        <>
                          <img
                            src={getProfileImageUrl(selectedEmployee)}
                            alt={selectedEmployee.name}
                            className="rounded-circle border border-3 border-primary"
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover',
                              position: 'absolute',
                              top: 0,
                              left: 0
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const fallback = e.target.parentElement.querySelector('.modal-avatar-fallback');
                              if (fallback) {
                                fallback.style.display = 'flex';
                              }
                            }}
                          />
                          <div 
                            className="avatar-title bg-primary bg-opacity-10 text-primary rounded-circle fs-1 modal-avatar-fallback border border-3 border-primary"
                            style={{ 
                              display: 'none', 
                              width: '100%', 
                              height: '100%',
                              position: 'absolute',
                              top: 0,
                              left: 0
                            }}
                          >
                            {selectedEmployee.name?.charAt(0).toUpperCase() || 'E'}
                          </div>
                        </>
                      ) : (
                        <div 
                          className="avatar-title bg-primary bg-opacity-10 text-primary rounded-circle fs-1 border border-3 border-primary"
                          style={{ width: '100%', height: '100%' }}
                        >
                          {selectedEmployee.name?.charAt(0).toUpperCase() || 'E'}
                        </div>
                      )}
                    </div>
                    <h4 className="mb-1">{selectedEmployee.name || 'Unknown Employee'}</h4>
                    <p className="text-muted mb-2">{selectedEmployee.designation_title || selectedEmployee.designationTitle || 'Not Assigned'}</p>
                    <p className="text-muted mb-0">{selectedEmployee.department_name || selectedEmployee.departmentName || 'No Department'}</p>
                  </div>

                  {/* Task Information Section */}
                  <div className="card border-0 shadow-sm mb-3">
                    <div className="card-header bg-light">
                      <h6 className="mb-0">
                        <i className="ri-task-line me-2"></i>
                        Task Information
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <p className="text-muted mb-1 fs-12 text-uppercase">Task Title</p>
                        <p className="mb-0 fw-medium">{selectedTask.title || 'Untitled Task'}</p>
                      </div>

                      {selectedTask.description && (
                        <div className="mb-3">
                          <p className="text-muted mb-1 fs-12 text-uppercase">Description</p>
                          <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{selectedTask.description}</p>
                        </div>
                      )}

                      <div className="row">
                        <div className="col-6 mb-3">
                          <p className="text-muted mb-1 fs-12 text-uppercase">Task Type</p>
                          <span className={`badge ${getTaskTypeBadgeClass(selectedTask.task_type || 'MAIN_TASK')}`}>
                            {selectedTask.task_type || 'MAIN_TASK'}
                          </span>
                        </div>
                        <div className="col-6 mb-3">
                          <p className="text-muted mb-1 fs-12 text-uppercase">Priority</p>
                          <span className={`badge ${getPriorityBadgeClass(selectedTask.priority)}`}>
                            {selectedTask.priority || 'MEDIUM'}
                          </span>
                        </div>
                        <div className="col-6 mb-3">
                          <p className="text-muted mb-1 fs-12 text-uppercase">Status</p>
                          <span className={`badge ${getStatusBadgeClass(selectedTask.status)}`}>
                            {selectedTask.status?.replace('_', ' ') || 'N/A'}
                          </span>
                        </div>
                        <div className="col-6 mb-3">
                          <p className="text-muted mb-1 fs-12 text-uppercase">Due Date</p>
                          <p className="mb-0 fw-medium">
                            {selectedTask.due_date 
                              ? new Date(selectedTask.due_date).toLocaleDateString()
                              : 'No due date'}
                            {isOverdue(selectedTask.due_date, selectedTask.status) && (
                              <span className="badge bg-danger ms-2">Overdue</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {selectedTask.created_at && (
                        <div className="mb-3">
                          <p className="text-muted mb-1 fs-12 text-uppercase">Assigned Date</p>
                          <p className="mb-0 fw-medium">
                            {new Date(selectedTask.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      )}

                      {selectedTask.created_by_name && (
                        <div className="mb-3">
                          <p className="text-muted mb-1 fs-12 text-uppercase">Assigned By</p>
                          <p className="mb-0 fw-medium">{selectedTask.created_by_name}</p>
                        </div>
                      )}

                      {selectedTask.department_name && (
                        <div className="mb-3">
                          <p className="text-muted mb-1 fs-12 text-uppercase">Department</p>
                          <p className="mb-0 fw-medium">{selectedTask.department_name}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Employee Information Section */}
                  {/* <div className="card border-0 shadow-sm">
                    <div className="card-header bg-light">
                      <h6 className="mb-0">
                        <i className="ri-user-line me-2"></i>
                        Employee Information
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <p className="text-muted mb-1 fs-12 text-uppercase">Email</p>
                        <p className="mb-0 fw-medium">{selectedEmployee.email || 'N/A'}</p>
                      </div>

                      {selectedEmployee.mobile && (
                        <div className="mb-3">
                          <p className="text-muted mb-1 fs-12 text-uppercase">Mobile</p>
                          <p className="mb-0 fw-medium">{selectedEmployee.mobile}</p>
                        </div>
                      )}

                      {selectedEmployee.employee_code && (
                        <div className="mb-3">
                          <p className="text-muted mb-1 fs-12 text-uppercase">Employee Code</p>
                          <p className="mb-0 fw-medium">{selectedEmployee.employee_code}</p>
                        </div>
                      )}

                      <div className="mb-3">
                        <p className="text-muted mb-1 fs-12 text-uppercase">Role</p>
                        <span className={`badge ${getStatusBadgeClass(selectedEmployee.role)}`}>
                          {selectedEmployee.role || 'N/A'}
                        </span>
                      </div>

                      <div className="mb-3">
                        <p className="text-muted mb-1 fs-12 text-uppercase">Status</p>
                        <span className={`badge ${selectedEmployee.is_active || selectedEmployee.isActive ? 'bg-success' : 'bg-danger'}`}>
                          {selectedEmployee.is_active || selectedEmployee.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {selectedEmployee.created_at && (
                        <div className="mb-3">
                          <p className="text-muted mb-1 fs-12 text-uppercase">Joining Date</p>
                          <p className="mb-0 fw-medium">
                            {new Date(selectedEmployee.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div> */}

                  {/* Action Buttons */}
                  <div className="d-flex gap-2 mt-4">
                    <button
                      className="btn btn-outline-primary flex-fill"
                      onClick={() => {
                        handleCloseTaskModal();
                        navigate(`/admin/task_Approvel/${selectedTask.id}`);
                      }}
                    >
                      <i className="ri-eye-line me-2"></i>
                      View Task Details
                    </button>
                    <button
                      className="btn btn-outline-info flex-fill"
                      onClick={() => {
                        handleCloseTaskModal();
                        navigate(`/UserProfile?id=${selectedEmployee.id}`);
                      }}
                    >
                      <i className="ri-user-line me-2"></i>
                      View Employee Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Add CSS animations for slide in and slide out */}
          <style>{`
            @keyframes slideInRight {
              from {
                transform: translateX(100%);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
            @keyframes slideOutRight {
              from {
                transform: translateX(0);
                opacity: 1;
              }
              to {
                transform: translateX(100%);
                opacity: 0;
              }
            }
            @media (max-width: 576px) {
              .modal[style*="width: 500px"] {
                width: 90vw !important;
                maxWidth: 90vw !important;
              }
            }
          `}</style>
        </>
      )}
    </div>
  );
};

export default AdminDueTasksPage;
