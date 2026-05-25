import React, { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../Context/ConfigContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { buildApiUrl, getAuthHeaders } from '../../config/api';
import { useNavigate } from 'react-router-dom';

const QATesterTaskPage = () => {
  const { leadCrmUser } = useContext(ConfigContext);
  const navigate = useNavigate();
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    total_pages: 1
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    department: '',
    taskType: '',
    searchTerm: ''
  });
  
  // Available departments (you can fetch this from API)
  const [departments, setDepartments] = useState([]);
  
  // Filter panel visibility
  const [showFilters, setShowFilters] = useState(true);

  // Fetch tasks assigned to tester
  const fetchTesterTasks = async (page = 1, filterParams = {}) => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...filterParams
      });
      
      const response = await axios.get(
        buildApiUrl(`/tasks/tester-tasks?${params.toString()}`),
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        setTasks(response.data.data.tasks || []);
        setPagination(response.data.data.pagination || {
          current_page: 1,
          per_page: 10,
          total: 0,
          total_pages: 1
        });
      } else {
        toast.error(`Failed to load tasks: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error fetching tester tasks:', error);
      
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to load tasks'}`);
      } else {
        toast.error('Network error: Failed to load tasks');
      }
    } finally {
      setLoading(false);
    }
  };

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
      console.error('Error fetching departments:', error);
    }
  };
  
  useEffect(() => {
    fetchTesterTasks();
    fetchDepartments();
  }, []);
  
  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };
  
  // Apply filters
  const applyFilters = () => {
    const filterParams = {};
    
    if (filters.status) filterParams.status = filters.status;
    if (filters.startDate) filterParams.start_date = filters.startDate;
    if (filters.endDate) filterParams.end_date = filters.endDate;
    if (filters.department) filterParams.department = filters.department;
    if (filters.taskType) filterParams.task_type = filters.taskType;
    if (filters.searchTerm) filterParams.search = filters.searchTerm;
    
    fetchTesterTasks(1, filterParams);
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({
      status: '',
      startDate: '',
      endDate: '',
      department: '',
      taskType: '',
      searchTerm: ''
    });
    
    fetchTesterTasks(1);
  };
  
  // Handle Enter key press in filter inputs
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
  };

  // Handle pagination
  const handlePageChange = (page) => {
    // Preserve current filters when paginating
    const filterParams = {};
    
    if (filters.status) filterParams.status = filters.status;
    if (filters.startDate) filterParams.start_date = filters.startDate;
    if (filters.endDate) filterParams.end_date = filters.endDate;
    if (filters.department) filterParams.department = filters.department;
    if (filters.taskType) filterParams.task_type = filters.taskType;
    if (filters.searchTerm) filterParams.search = filters.searchTerm;
    
    fetchTesterTasks(page, filterParams);
  };

  // Handle navigation to task details
  const goToTaskDetails = (taskId) => {
    navigate(`/qa-tester/task/${taskId}`);
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
                <p className="mt-2 text-muted">Loading tasks assigned for testing...</p>
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
                      <h4 className="mb-0">QA Testing Dashboard</h4>
                      <p className="text-muted mb-0">Review and test assigned tasks</p>
                    </div>
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-outline-secondary"
                        onClick={() => navigate(-1)}
                      >
                        <i className="ri-arrow-left-line me-2"></i>
                        Back
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters Section */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="card border-0 shadow-sm">
                    <div className="card-header bg-white border-0 pb-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">
                          <i className="ri-filter-line me-2"></i>
                          Filter Tasks
                          {Object.values(filters).some(value => value) && (
                            <span className="badge bg-primary ms-2">
                              {Object.values(filters).filter(value => value).length} Active
                            </span>
                          )}
                        </h5>
                        <button 
                          className="btn btn-sm btn-outline-primary d-lg-none"
                          onClick={() => setShowFilters(!showFilters)}
                        >
                          <i className={`ri-${showFilters ? 'eye-off' : 'eye'}-line`}></i>
                          {showFilters ? 'Hide' : 'Show'} Filters
                        </button>
                      </div>
                    </div>
                    <div className={`card-body pt-2 ${!showFilters ? 'd-none d-lg-block' : ''}`}>
                      <div className="row g-3">
                        {/* Search Bar */}
                        <div className="col-12">
                          <label className="form-label">Search Tasks</label>
                          <div className="input-group">
                            <span className="input-group-text">
                              <i className="ri-search-line"></i>
                            </span>
                            <input 
                              type="text" 
                              className="form-control"
                              placeholder="Search by task title, assigned to, or assigned by..." 
                              value={filters.searchTerm}
                              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                              onKeyPress={handleKeyPress}
                            />
                            {filters.searchTerm && (
                              <button 
                                className="btn btn-outline-secondary"
                                type="button"
                                onClick={() => handleFilterChange('searchTerm', '')}
                              >
                                <i className="ri-close-line"></i>
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Status Filter */}
                        <div className="col-md-3 col-sm-6">
                          <label className="form-label">Testing Status</label>
                          <select 
                            className="form-select"
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                          >
                            <option value="">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="IN_TEST">In Testing</option>
                            <option value="TESTED">Tested</option>
                            <option value="REJECTED">Rejected</option>
                          </select>
                        </div>
                        
                        {/* Task Type Filter */}
                        <div className="col-md-3 col-sm-6">
                          <label className="form-label">Task Type</label>
                          <select 
                            className="form-select"
                            value={filters.taskType}
                            onChange={(e) => handleFilterChange('taskType', e.target.value)}
                          >
                            <option value="">All Types</option>
                            <option value="MAIN_TASK">Main Task</option>
                            <option value="SUBTASK">Subtask</option>
                            <option value="DAILY_ROUTINE">Daily Routine</option>
                          </select>
                        </div>
                        
                        {/* Department Filter */}
                        <div className="col-md-3 col-sm-6">
                          <label className="form-label">Department</label>
                          <select 
                            className="form-select"
                            value={filters.department}
                            onChange={(e) => handleFilterChange('department', e.target.value)}
                          >
                            <option value="">All Departments</option>
                            {departments.map(dept => (
                              <option key={dept.id} value={dept.id}>
                                {dept.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        {/* Date Range Filter */}
                        <div className="col-md-3 col-sm-6">
                          <label className="form-label">Date Range</label>
                          <div className="input-group">
                            <input 
                              type="date" 
                              className="form-control"
                              placeholder="Start Date"
                              value={filters.startDate}
                              onChange={(e) => handleFilterChange('startDate', e.target.value)}
                              onKeyPress={handleKeyPress}
                            />
                            <span className="input-group-text">to</span>
                            <input 
                              type="date" 
                              className="form-control"
                              placeholder="End Date"
                              value={filters.endDate}
                              onChange={(e) => handleFilterChange('endDate', e.target.value)}
                              onKeyPress={handleKeyPress}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="row mt-3">
                        <div className="col-12">
                          <div className="d-flex gap-2">
                            <button 
                              className="btn btn-outline-primary"
                              onClick={applyFilters}
                            >
                              <i className="ri-search-line me-2"></i>
                              Apply Filters
                            </button>
                            <button 
                              className="btn btn-outline-secondary"
                              onClick={clearFilters}
                            >
                              <i className="ri-refresh-line me-2"></i>
                              Clear Filters
                            </button>
                          </div>
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
                        <h5 className="mb-0">Tasks for Testing</h5>
                        <span className="badge bg-primary">{tasks.length} Tasks</span>
                      </div>
                    </div>
                    <div className="card-body">
                      {tasks.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-centered table-nowrap mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>#</th>
                                <th>Test Case</th>
                                <th>Task Title</th>
                                {/* <th>Parent Task</th> */}
                                <th>Assigned By</th>
                                <th>Assigned To</th>
                                <th>Assigned Date</th>
                                <th>Task Type</th>
                                <th>Testing Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {tasks.map((task, index) => {
                                // Calculate reverse serial number based on pagination
                                const serialNumber = (pagination.current_page - 1) * pagination.per_page + index + 1;
                                const reverseSerialNumber = (pagination.total || tasks.length) - serialNumber + 1;
                                return (
                                <tr key={task.id}>
                                  <td>{reverseSerialNumber}</td>
                                  <td>
                                    {task.test_cases && task.test_cases.length > 0 ? (
                                      <div className="d-flex flex-wrap gap-1">
                                        {[1, 2, 3].map(num => {
                                          const testCase = task.test_cases.find(tc => tc.test_case_number == num);
                                          if (testCase) {
                                            return (
                                              <span key={num} className="badge" style={{ fontSize: '0.8em' }}>
                                                <span className="text-muted">TC{num}:</span>
                                                <span className={`badge ms-1 ${
                                                  testCase.status === 'NOT_STARTED' ? 'bg-secondary' :
                                                  testCase.status === 'IN_TEST' ? 'bg-info' :
                                                  testCase.status === 'PASSED' ? 'bg-success' :
                                                  testCase.status === 'FAILED' ? 'bg-danger' : 'bg-warning'
                                                }`}>
                                                  {testCase.status === 'NOT_STARTED' ? 'Not Started' :
                                                   testCase.status === 'IN_TEST' ? 'In Test' :
                                                   testCase.status === 'PASSED' ? 'Passed' :
                                                   testCase.status === 'FAILED' ? 'Failed' : 'Blocked'}
                                                </span>
                                              </span>
                                            );
                                          }
                                          return null;
                                        }).filter(Boolean)}
                                      </div>
                                    ) : (
                                      <span className="text-muted small">No test cases</span>
                                    )}
                                  </td>
                                  <td>
                                    <h6 className="mb-0">{task.title?.substring(0,70) || 'No title'}</h6>
                                    <span className={`badge mt-1 ${
                                      task.task_type === 'DAILY_ROUTINE' ? 'bg-success' :
                                      task.task_type === 'MAIN_TASK' ? 'bg-primary' : 'bg-info'
                                    }`}>
                                      {task.task_type === 'DAILY_ROUTINE' ? 'Daily Routine' : 
                                       task.task_type === 'MAIN_TASK' ? 'Main Task' : 'Subtask'}
                                    </span>
                                  </td>
                                  {/* <td>
                                    <span>{task.parent_task_title || 'N/A'}</span>
                                  </td> */}
                                  <td>
                                    <span>{task.created_by_name || 'Unknown'}</span>
                                  </td>
                                  <td>
                                    <span>{task.assigned_to_name || 'Unassigned'}</span>
                                  </td>
                                  <td>
                                    <span>{task.assigned_to_tester_at ? new Date(task.assigned_to_tester_at).toLocaleDateString() : 'N/A'}</span>
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
                                      task.tester_status === 'PENDING' ? 'bg-warning' :
                                      task.tester_status === 'IN_TEST' ? 'bg-info' :
                                      task.tester_status === 'TESTED' ? 'bg-success' : 'bg-danger'
                                    }`}>
                                      {task.tester_status === 'PENDING' ? 'Pending' :
                                       task.tester_status === 'IN_TEST' ? 'In Testing' :
                                       task.tester_status === 'TESTED' ? 'Tested' : 'Rejected'}
                                    </span>
                                  </td>
                                  <td>
                                    <div className="d-flex gap-2">
                                      <button 
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => goToTaskDetails(task.id)}
                                      >
                                        <i className="ri-eye-line me-1"></i>
                                        Test Task
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )})}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-5">
                          <i className="ri-task-line display-4 text-muted"></i>
                          <h5 className="mt-3">No tasks assigned for testing</h5>
                          <p className="text-muted">You don't have any tasks assigned for testing yet.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pagination */}
                  {pagination.total_pages > 1 && (
                    <div className="row mt-4">
                      <div className="col-12">
                        <nav>
                          <ul className="pagination justify-content-center">
                            <li className={`page-item ${pagination.current_page === 1 ? 'disabled' : ''}`}>
                              <button 
                                className="page-link" 
                                onClick={() => handlePageChange(pagination.current_page - 1)}
                                disabled={pagination.current_page === 1}
                              >
                                Previous
                              </button>
                            </li>
                            
                            {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map(pageNum => (
                              <li key={pageNum} className={`page-item ${pagination.current_page === pageNum ? 'active' : ''}`}>
                                <button 
                                  className="page-link" 
                                  onClick={() => handlePageChange(pageNum)}
                                >
                                  {pageNum}
                                </button>
                              </li>
                            ))}
                            
                            <li className={`page-item ${pagination.current_page === pagination.total_pages ? 'disabled' : ''}`}>
                              <button 
                                className="page-link" 
                                onClick={() => handlePageChange(pagination.current_page + 1)}
                                disabled={pagination.current_page === pagination.total_pages}
                              >
                                Next
                              </button>
                            </li>
                          </ul>
                        </nav>
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
  );
};

export default QATesterTaskPage;