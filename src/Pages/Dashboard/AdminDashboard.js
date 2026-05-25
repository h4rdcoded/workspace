import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { ConfigContext } from '../../Context/ConfigContext';
import PageTitle from '../../Components/PageTitle';
import Swal from 'sweetalert2';
import ApexCharts from 'react-apexcharts';
import { useNavigate } from 'react-router-dom';
import TaskDetailsModal from '../../Layout/TaskDetailsModal';
import Snowfall from 'react-snowfall';


function AdminDashboard() {
  const { leadCrmApiURL, leadCrmHeaders } = useContext(ConfigContext);
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [employeesWithoutTasks, setEmployeesWithoutTasks] = useState(0); // New state for employees without tasks
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  });
  const [filterApplied, setFilterApplied] = useState(false);
  
  // State for selected department - always call hooks at the top level
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  
  // Refs for chart instances
  const departmentChartRef = useRef(null);

  // Function to handle department chart download
  const downloadDepartmentChart = useCallback(() => {
    if (departmentChartRef.current && departmentChartRef.current.chart) {
      departmentChartRef.current.chart.dataURI().then(({ imgURI }) => {
        const link = document.createElement('a');
        link.download = 'department-task-distribution.png';
        link.href = imgURI;
        link.click();
      });
    }
  }, []);

  // Function to fetch employees without tasks count
  const fetchEmployeesWithoutTasks = useCallback(async () => {
    try {
      const response = await fetch(
        `${leadCrmApiURL}/admin/employees/without-tasks`,
        {
          method: 'GET',
          headers: leadCrmHeaders,
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEmployeesWithoutTasks(data.data.total_count);
        }
      }
    } catch (error) {
      console.error('Error fetching employees without tasks:', error);
    }
  }, [leadCrmApiURL, leadCrmHeaders]);


  const fetchDashboardData = useCallback(async (customDateRange = null) => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams();
      if (customDateRange?.from) queryParams.append('from', customDateRange.from);
      if (customDateRange?.to) queryParams.append('to', customDateRange.to);
      
      // Use the TaskDashboardController endpoint which provides comprehensive data
      console.log('Fetching dashboard data from:', `${leadCrmApiURL}/admin/dashboard?${queryParams.toString()}`);
      
      const response = await fetch(
        `${leadCrmApiURL}/admin/dashboard?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: leadCrmHeaders,
          credentials: 'include'
        }
      );

      console.log('Dashboard API response status:', response.status);
      
      // Check if the response is ok
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Dashboard API response data:', data);
      
      if (data.success) {
        setDashboardData(data.data); // This is the correct data structure
        setFilterApplied(!!(customDateRange?.from || customDateRange?.to));
      } else {
        console.error('Dashboard API error:', data.message);
        Swal.fire('Error', data.message || 'Failed to fetch dashboard data', 'error');
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      Swal.fire('Error', 'Network error while fetching dashboard data: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [leadCrmApiURL, leadCrmHeaders]);

  // Add useEffect to fetch data on component mount - moved after function definition
  useEffect(() => {
    fetchDashboardData();
    fetchEmployeesWithoutTasks(); // Fetch employees without tasks count
  }, [fetchDashboardData, fetchEmployeesWithoutTasks]);

  // Update selected department when department stats change
  useEffect(() => {
    if (dashboardData && dashboardData.department_statistics && dashboardData.department_statistics.length > 0) {
      // If no department is selected or the selected department is not in the new data, select the first one
      if (!selectedDepartment || !dashboardData.department_statistics.find(d => d.id === selectedDepartment.id)) {
        setSelectedDepartment(dashboardData.department_statistics[0]);
      } else {
        // Update the selected department with the new data
        const updatedDepartment = dashboardData.department_statistics.find(d => d.id === selectedDepartment.id);
        setSelectedDepartment(updatedDepartment);
      }
    }
  }, [dashboardData, selectedDepartment]);

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  const applyDateFilter = () => {
    fetchDashboardData(dateRange);
  };

  const clearDateFilter = () => {
    setDateRange({ from: '', to: '' });
    setFilterApplied(false);
    setSelectedDepartment(null); // Reset selected department when clearing filter
    fetchDashboardData();
  };

  // Function to navigate to AssignTaskPage with status filter
  const navigateToAssignTaskPage = (status) => {
    navigate(`/admin/assign-task?status=${status}`);
  };

  // Function to navigate to employees without tasks page
  const navigateToEmployeesWithoutTasks = () => {
    navigate('/admin/employees/without-tasks');
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="page-content">
          <div className="container-fluid">
            <PageTitle title="Admin Dashboard" primary="Task Management" />
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
              <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading dashboard data...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="main-content">
        <div className="page-content">
          <div className="container-fluid">
            <PageTitle title="Admin Dashboard" primary="Task Management" />
            <div className="alert alert-warning" role="alert">
              No dashboard data available
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Log the dashboard data for debugging
  console.log('Dashboard Data:', dashboardData);

  // Prepare data for recent activities (limit to 10)
  const recentActivities = (dashboardData.recent_activities || []).slice(0, 10);

  // Prepare department statistics data
  const departmentStats = dashboardData.department_statistics || [];

  // Format date range for display
  const formatDateRange = () => {
    if (!filterApplied) {
      return "All Time Data";
    }
    if (dateRange.from && dateRange.to) {
      return `${new Date(dateRange.from).toLocaleDateString()} to ${new Date(dateRange.to).toLocaleDateString()}`;
    }
    if (dateRange.from) {
      return `From ${new Date(dateRange.from).toLocaleDateString()}`;
    }
    if (dateRange.to) {
      return `To ${new Date(dateRange.to).toLocaleDateString()}`;
    }
    return "All Time Data";
  };

  return (
    <div className="main-content">
      <style>
        {`
          .text-violet {
            color: #8b5cf6 !important;
          }
          .bg-violet {
            background-color: #8b5cf6 !important;
          }
          .date-filter-card {
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
          }
         
          
          /* Dark theme support */
          [data-bs-theme="dark"] .department-stats-card {
            background:var(--vz-card-bg, var(--vz-secondary-bg, #2d3748)) !important;
           
          
          }
          
          [data-bs-theme="dark"] .department-title {
            color: #e2e8f0;
          }
          
          [data-bs-theme="dark"] .stat-label {
            color: #a0aec0;
          }
          
          [data-bs-theme="dark"] .stat-value {
            color: #e2e8f0;
          }
          
          [data-bs-theme="dark"] .department-header {
            border-bottom: 1px solid rgba(255,255,255,0.1);
          }
          
          .department-header {
            border-bottom: 1px solid rgba(0,0,0,0.05);
            padding-bottom: 8px;
            margin-bottom: 10px;
          }
          
          .department-title {
            font-weight: 600;
            color: #495057;
            font-size: 1.1rem;
          }
          
          .stat-item {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            border-bottom: 1px dashed rgba(0,0,0,0.05);
          }
          
          .stat-item:last-child {
            border-bottom: none;
          }
          
          .stat-label {
            color: #6c757d;
            font-size: 0.85rem;
          }
          
          .stat-value {
            font-weight: 600;
            color: #495057;
          }
          
          .badge-custom {
            padding: 3px 8px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 500;
          }
          
          .bg-primary-light {
            background-color: rgba(59, 130, 246, 0.15);
            color: #3b82f6;
          }
          
          .bg-warning-light {
            background-color: rgba(245, 158, 11, 0.15);
            color: #f59e0b;
          }
          
          .bg-success-light {
            background-color: rgba(16, 185, 129, 0.15);
            color: #10b981;
          }
          
          /* Enhanced Department Stats Styles */
          .department-selector {
            background-color: #fff;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            padding: 6px 10px;
            font-size: 0.85rem;
            color: #495057;
            width: 100%;
            margin-bottom: 10px;
          }
          
          [data-bs-theme="dark"] .department-selector {
            background-color: #2d3748;
            border: 1px solid #4a5568;
            color: #e2e8f0;
          }
          
          .department-selector:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.25);
            outline: 0;
          }
          
          [data-bs-theme="dark"] .department-selector:focus {
            border-color: var(--vz-card-bg, var(--vz-secondary-bg, #2d3748)) !important;
            box-shadow: 0 0 0 0.2rem rgba(99, 102, 241, 0.25);
          }
          
          .stat-card {
            background: #fff;
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 8px;
         
            font-size: 0.9rem;
          }
          
          [data-bs-theme="dark"] .stat-card {
            background: var(--vz-card-bg, var(--vz-secondary-bg, #2d3748)) !important;
           
          }
          
          .stat-label {
            font-size: 0.85rem;
            color: #6c757d;
            font-weight: 500;
          }
          
          .stat-value {
            font-size: 1rem;
            font-weight: 700;
          }
          
          .text-warning {
            color: #f59e0b !important;
          }
          
          .text-success {
            color: #10b981 !important;
          }
          
          .text-violet {
            color: #8b5cf6 !important;
          }
          
          /* Consistent card styling */
          .card {
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            border: 1px solid #e9ecef;
          }
          
          [data-bs-theme="dark"] .card {
            border: 1px solid #4a5568;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
          }
          
          .card-header {
            border-radius: 12px 12px 0 0 !important;
            border-bottom: 1px solid #e9ecef !important;
          }
          
          [data-bs-theme="dark"] .card-header {
            border-bottom: 1px solid #4a5568 !important;
          }
          
          /* Stats card specific styles */
          .stats-card-icon {
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
          }
          
          .stats-card-value {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 0.25rem;
          }
          
          .stats-card-title {
            font-size: 0.875rem;
            color: #6c757d;
            margin-bottom: 0;
          }
          
          [data-bs-theme="dark"] .stats-card-title {
            color: #a0aec0;
          }
          
          /* Make stats cards clickable */
          .clickable-card {
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
          }
          
          .clickable-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 25px rgba(0,0,0,0.15) !important;
          }
        `}
      </style>
      <div className="page-content">
        <div className="container-fluid">
          <PageTitle title="Admin Dashboard" primary="Task Management" />
           <Snowfall
                      style={{
                        position: "fixed",
                        width: "100vw",
                        height: "100vh",
                        top: 0,
                        left: 0,
                        zIndex: -1,
                        pointerEvents: "none"
                      }}
                      snowflakeCount={150}
                      radius={[0.5, 3.0]}
                      speed={[0.5, 1]}
                      wind={[-0.5, 0.5]}
                    color="rgba(105, 239, 251, 0.8)" // Light blue/ice color
                      
                    />
       
          
        
          
          {/* Date Filter Section */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card date-filter-card shadow-sm rounded-3 border-0">
                <div className="card-body">
                  <div className="d-flex flex-wrap align-items-center justify-content-between">
                    <div className="d-flex align-items-center mb-2 mb-md-0">
                      <i className="ri-calendar-line me-2 text-primary"></i>
                      <span className="fw-medium">
                        {formatDateRange()}
                      </span>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      <div className="d-flex align-items-center">
                        <label className="form-label me-2 mb-0">From:</label>
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          name="from"
                          value={dateRange.from}
                          onChange={handleDateRangeChange}
                        />
                      </div>
                      <div className="d-flex align-items-center">
                        <label className="form-label me-2 mb-0">To:</label>
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          name="to"
                          value={dateRange.to}
                          onChange={handleDateRangeChange}
                        />
                      </div>
                      <button 
                        className="btn btn-outline-primary btn-sm rounded-pill"
                        onClick={applyDateFilter}
                      >
                        <i className="ri-filter-line me-1"></i>
                        Apply Filter
                      </button>
                      <button 
                        className="btn btn-outline-secondary btn-sm rounded-pill"
                        onClick={clearDateFilter}
                      >
                        <i className="ri-refresh-line me-1"></i>
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Task Stats Cards */}
          <div className="row mb-4 g-3">
            <div className="col-xl col-md-6 col-sm-6">
              <div className="card border-0 shadow-sm h-100 rounded-3 clickable-card" onClick={() => navigateToAssignTaskPage('')}>
                <div className="card-body p-3">
                  <div className="d-flex align-items-center">
                    <div className="flex-shrink-0 bg-primary bg-opacity-10 rounded-3 p-2">
                      <i className="ri-task-line text-primary fs-5"></i>
                    </div>
                    <div className="flex-grow-1 ms-2">
                      <h6 className="card-title mb-1 text-muted small">Total Tasks</h6>
                      <h4 className="mb-0 text-primary">{dashboardData.task_statistics?.total_tasks || 0}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-xl col-md-6 col-sm-6">
              <div className="card border-0 shadow-sm h-100 rounded-3 clickable-card" onClick={() => navigateToAssignTaskPage('IN_PROGRESS')}>
                <div className="card-body p-3">
                  <div className="d-flex align-items-center">
                    <div className="flex-shrink-0 bg-info bg-opacity-10 rounded-3 p-2">
                      <i className="ri-time-line text-info fs-5"></i>
                    </div>
                    <div className="flex-grow-1 ms-2">
                      <h6 className="card-title mb-1 text-muted small">Pending Tasks</h6>
                      <h4 className="mb-0 text-info">{(parseInt(dashboardData.task_statistics?.pending_tasks)) + (parseInt(dashboardData.task_statistics?.in_progress_tasks))}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-xl col-md-6 col-sm-6">
              <div className="card border-0 shadow-sm h-100 rounded-3 clickable-card" onClick={() => navigateToAssignTaskPage('SUBMITTED')}>
                <div className="card-body p-3">
                  <div className="d-flex align-items-center">
                    <div className="flex-shrink-0 bg-primary bg-opacity-10 rounded-3 p-2">
                      <i className="ri-send-plane-line text-violet fs-5"></i>
                    </div>
                    <div className="flex-grow-1 ms-2">
                      <h6 className="card-title mb-1 text-muted small">Submitted Tasks</h6>
                      <h4 className="mb-0 text-violet">{dashboardData.task_statistics?.submitted_tasks || 0}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-xl col-md-6 col-sm-6">
              <div className="card border-0 shadow-sm h-100 rounded-3 clickable-card" onClick={() => navigateToAssignTaskPage('COMPLETED')}>
                <div className="card-body p-3">
                  <div className="d-flex align-items-center">
                    <div className="flex-shrink-0 bg-success bg-opacity-10 rounded-3 p-2">
                      <i className="ri-check-double-line text-success fs-5"></i>
                    </div>
                    <div className="flex-grow-1 ms-2">
                      <h6 className="card-title mb-1 text-muted small">Completed Tasks</h6>
                      <h4 className="mb-0 text-success">{dashboardData.task_statistics?.completed_tasks || 0}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* New Card for Employees Without Tasks */}
            <div className="col-xl col-md-6 col-sm-6">
              <div className="card border-0 shadow-sm h-100 rounded-3 clickable-card" onClick={navigateToEmployeesWithoutTasks}>
                <div className="card-body p-3">
                  <div className="d-flex align-items-center">
                    <div className="flex-shrink-0 bg-warning bg-opacity-10 rounded-3 p-2">
                      <i className="ri-user-line text-warning fs-5"></i>
                    </div>
                    <div className="flex-grow-1 ms-2">
                      <h6 className="card-title mb-1 text-muted small">Free Employees</h6>
                      <h4 className="mb-0 text-warning">{employeesWithoutTasks}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>





















          {/* Due Tasks Section */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0">
                  <h5 className="card-title mb-0">Overdue Tasks</h5>
                </div>
                <div className="card-body">
                  <div className="d-flex flex-wrap gap-2">
                    <button
                      className="btn btn-outline-warning"
                      onClick={() => navigate('/admin/due-tasks?filter=today')}
                    >
                      <i className="ri-calendar-todo-line me-2"></i>
                      Today's Due Tasks
                    </button>
                    <button
                      className="btn btn-outline-info"
                      onClick={() => navigate('/admin/due-tasks?filter=tomorrow')}
                    >
                      <i className="ri-calendar-check-line me-2"></i>
                      Tomorrow's Due Tasks
                    </button>
                    <button
                      className="btn btn-outline-danger"
                      onClick={() => navigate('/admin/due-tasks?filter=overdue')}
                    >
                      <i className="ri-alarm-warning-line me-2"></i>
                      Overdue Tasks
                    </button>
                    {/* <button
                      className="btn btn-outline-primary"
                      onClick={() => navigate('/admin/due-tasks')}
                    >
                      <i className="ri-task-line me-2"></i>
                      All Due Tasks
                    </button> */}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="row mb-4">
            {/* Department Statistics */}
            <div className="col-xl-4 col-lg-5 col-md-12 mb-4">
              <div className="card shadow rounded-3 border-0 h-100">
                  <div className="card-header bg-white border-0 align-items-center d-flex">
                  <h4 className="card-title mb-0 flex-grow-1 text-primary">Department Statistics</h4>
                  <div className="card-toolbar">
                    {/* Removed download button since there's no chart to download */}
                  </div>
               </div>
                <div className="card-body pt-0">
                  <div className="department-stats-card p-3 h-100">
                    {departmentStats.length > 0 ? (
                      <>
                        {/* Department Selector Dropdown */}
                        <div className="mb-3">
                          <select 
                            className="form-select department-selector"
                            value={selectedDepartment?.id || ''}
                            onChange={(e) => {
                              const deptId = e.target.value;
                              const dept = departmentStats.find(d => d.id == deptId); // Using == for equality since value is string
                              setSelectedDepartment(dept);
                            }}
                          >
                            {departmentStats.map((dept) => (
                              <option key={dept.id} value={dept.id}>
                                {dept.name || 'Unknown Department'}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        {/* Department Stats Display */}
                        {selectedDepartment && (
                          <div className="department-item">
                            <div className="department-header d-flex justify-content-between align-items-center">
                              <h6 className="department-title mb-0">{selectedDepartment.name || 'Unknown Department'}</h6>
                              <span className="badge bg-primary badge-custom">{selectedDepartment.total_tasks || 0} Tasks</span>
                            </div>
                            <div className="department-stats mt-3">
                              <div className="stat-card d-flex justify-content-between align-items-center" style={{cursor: 'pointer'}} onClick={() => navigate(`/admin/tasks?filter=all`)}>
                                <span className="stat-label">Total Tasks</span>
                                <span className="stat-value text-primary">{selectedDepartment.total_tasks || 0}</span>
                              </div>
                              <div className="stat-card d-flex justify-content-between align-items-center" style={{cursor: 'pointer'}} onClick={() => navigate(`/admin/tasks?filter=pending`)}>
                                <span className="stat-label">Pending Tasks</span>
                                <span className="stat-value text-info">{(parseInt(selectedDepartment.pending_tasks)) + (parseInt(selectedDepartment.in_progress_tasks))}</span>
                              </div>
                              <div className="stat-card d-flex justify-content-between align-items-center" style={{cursor: 'pointer'}} onClick={() => navigate(`/admin/tasks?filter=submitted`)}>
                                <span className="stat-label">Submitted Tasks</span>
                                <span className="stat-value text-violet">{selectedDepartment.submitted_tasks || 0}</span>
                              </div>
                              <div className="stat-card d-flex justify-content-between align-items-center" style={{cursor: 'pointer'}} onClick={() => navigate(`/admin/tasks?filter=completed`)}>
                                <span className="stat-label">Completed Tasks</span>
                                <span className="stat-value text-success">{selectedDepartment.completed_tasks || 0}</span>
                              </div>
                              <div className="stat-card d-flex justify-content-between align-items-center" style={{cursor: 'pointer'}} onClick={() => navigate(`/admin/tasks?filter=cancelled`)}>
                                <span className="stat-label">Cancelled Tasks</span>
                                <span className="stat-value text-secondary">{selectedDepartment.cancelled_tasks || 0}</span>
                              </div>
                              <div className="stat-card d-flex justify-content-between align-items-center" style={{cursor: 'pointer'}} onClick={() => navigate(`/admin/tasks?filter=overdue`)}>
                                <span className="stat-label">Overdue Tasks</span>
                                <span className="stat-value text-danger">{selectedDepartment.overdue_tasks || 0}</span>
                              </div>

                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <div className="avatar-md mx-auto mb-3">
                          <div className="avatar-title bg-light text-muted rounded-circle">
                            <i className="ri-building-line ri-2x"></i>
                          </div>
                        </div>
                        <h5 className="mt-3">No Departments</h5>
                        <p className="text-muted">No departments found in the system.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Department-wise Task Distribution Column Chart */}
            <div className="col-xl-8 col-lg-7 col-md-12 mb-4">
              <div className="card shadow rounded-3 border-0 h-100">
                <div className="card-header bg-white border-0 align-items-center d-flex">
                  <h4 className="card-title mb-0 flex-grow-1 text-primary">Department-wise Task Distribution</h4>
                  <div className="card-toolbar">
                    <button className="btn btn-sm btn-outline-primary rounded-pill" onClick={downloadDepartmentChart}>
                      <i className="ri-download-2-line"></i>
                    </button>
                  </div>
                </div>
                <div className="card-body pt-0">
                  {dashboardData.department_statistics && dashboardData.department_statistics.length > 0 ? (
                    <ApexCharts 
                      ref={departmentChartRef}
                      options={{
                        chart: {
                          type: 'bar',
                          height: 350,
                          toolbar: { 
                            show: false
                          },
                          zoom: { enabled: false },
                          animations: {
                            enabled: true,
                            easing: 'easeinout',
                            speed: 800,
                            animateGradually: {
                                enabled: true,
                                delay: 150
                            },
                            dynamicAnimation: {
                                enabled: true,
                                speed: 350
                            }
                          }
                        },
                        plotOptions: {
                          bar: {
                            horizontal: false,
                            columnWidth: '60%',
                            endingShape: 'rounded',
                            distributed: false,
                            colors: {
                              ranges: [{
                                from: 0,
                                to: 0,
                                color: '#e5e7eb'
                              }]
                            }
                          },
                        },
                        dataLabels: {
                          enabled: false
                        },
                        stroke: {
                          show: true,
                          width: 2,
                          colors: ['transparent']
                        },
                        colors: ['#3b82f6', '#0AC7FB', '#8b5cf6', '#10b981'],
                        xaxis: {
                          categories: dashboardData.department_statistics.map(dept => dept.name || 'Unknown'),
                          labels: {
                            style: {
                              colors: '#6b7280',
                              fontSize: '12px'
                            }
                          },
                          axisBorder: {
                            show: true,
                            color: '#e5e7eb',
                            height: 1,
                            width: '100%',
                            offsetX: 0,
                            offsetY: 0
                          },
                          axisTicks: {
                            show: true,
                            borderType: 'solid',
                            color: '#e5e7eb',
                            height: 6,
                            offsetX: 0,
                            offsetY: 0
                          }
                        },
                        yaxis: {
                          title: {
                            text: 'Number of Tasks',
                            style: {
                              color: '#6b7280',
                              fontSize: '14px'
                            }
                          },
                          labels: {
                            style: {
                              colors: '#6b7280'
                            },
                            formatter: function (value) {
                              return value.toFixed(0);
                            }
                          },
                          axisBorder: {
                            show: true,
                            color: '#e5e7eb'
                          },
                          axisTicks: {
                            show: true,
                            borderType: 'solid',
                            color: '#e5e7eb',
                            width: 6
                          }
                        },
                        fill: {
                          opacity: 1,
                          type: 'solid'
                        },
                        tooltip: {
                          enabled: true,
                          fixed: {
                            enabled: true,
                            position: 'topLeft',
                            offsetX: 0,
                            offsetY: 30,
                          },
                          y: {
                            formatter: function (val) {
                              return val + " tasks"
                            }
                          },
                          marker: {
                            show: true,
                          },
                          onDatasetHover: {
                            highlightDataSeries: true,
                          }
                        },
                        grid: {
                          borderColor: '#e5e7eb',
                          strokeDashArray: 4,
                          position: 'back',
                          xaxis: {
                            lines: {
                              show: false
                            }
                          },
                          yaxis: {
                            lines: {
                              show: true
                            }
                          },
                          padding: {
                            top: 0,
                            right: 0,
                            bottom: 0,
                            left: 10
                          }
                        },
                        legend: {
                          position: 'top',
                          horizontalAlign: 'right',
                          fontSize: '14px',
                          labels: {
                            colors: '#6b7280'
                          },
                          markers: {
                            width: 12,
                            height: 12,
                            strokeWidth: 0,
                            strokeColor: '#fff',
                            fillColors: undefined,
                            radius: 12,
                            customHTML: undefined,
                            onClick: undefined,
                            offsetX: 0,
                            offsetY: 0
                          },
                          itemMargin: {
                            horizontal: 5,
                            vertical: 0
                          }
                        },
                        noData: {
                          text: 'No data available',
                          align: 'center',
                          verticalAlign: 'middle',
                          offsetX: 0,
                          offsetY: 0,
                          style: {
                            color: '#6b7280',
                            fontSize: '14px',
                            fontFamily: 'Helvetica, Arial, sans-serif'
                          }
                        },
                        states: {
                          normal: {
                            filter: {
                              type: 'none',
                              value: 0,
                            }
                          },
                          hover: {
                            filter: {
                              type: 'lighten',
                              value: 0.1,
                            }
                          },
                          active: {
                            allowMultipleDataPointsSelection: false,
                            filter: {
                              type: 'darken',
                              value: 0.35,
                            }
                          }
                        },
                        responsive: [{
                          breakpoint: 480,
                          options: {
                            chart: {
                              height: 300
                            },
                            plotOptions: {
                              bar: {
                                horizontal: false
                              }
                            },
                            legend: {
                              position: "bottom"
                            }
                          }
                        }]
                      }}
                      series={[
                        {
                          name: 'Assigned',
                          data: dashboardData.department_statistics.map(dept => dept.total_tasks || 0)
                        },
                        {
                          name: 'Pending ',
                          data: dashboardData.department_statistics.map(dept => (dept.pending_tasks || 0) + (dept.in_progress_tasks || 0))
                        },
                        {
                          name: 'Submitted ',
                          data: dashboardData.department_statistics.map(dept => dept.submitted_tasks || 0)
                        },
                        {
                          name: 'Completed ',
                          data: dashboardData.department_statistics.map(dept => dept.completed_tasks || 0)
                        }
                      ]}
                      type="bar"
                      height={350}
                    />
                  ) : (
                    <div className="text-center py-5">
                      <div className="avatar-md mx-auto mb-3">
                        <div className="avatar-title bg-light text-muted rounded-circle">
                          <i className="ri-bar-chart-line ri-2x"></i>
                        </div>
                      </div>
                      <h5 className="mt-3">No department data</h5>
                      <p className="text-muted">No department task distribution data available.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Task Activities */}
          <div className="row">
            <div className="col-12">
              <div className="card shadow rounded-3 border-0">
                <div className="card-header bg-white border-0 align-items-center d-flex">
                  <h4 className="card-title mb-0 flex-grow-1 text-primary">Recent Task Activities</h4>
                </div>
                <div className="card-body pt-0">
                  {recentActivities.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-centered table-nowrap mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Task Title</th>
                         
                            <th>Status</th>
                            <th>Priority</th>
                            <th>Assigned To</th>
                            <th>Assigned By</th>
                            <th>Last Updated</th>
                            {/* <th>Actions</th> */}
                          </tr>
                        </thead>
                        <tbody>
                          {recentActivities.map((activity, index) => (
                            <tr key={index}>
                              <td>
                                <h6 
                                  className="mb-0 fs-14"
                                  style={{ cursor: 'pointer' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTask(activity);
                                    setShowTaskModal(true);
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.transform = 'scale(1.01)';
                                    e.target.style.boxShadow = '0 3px 5px rgba(13, 110, 253, 0.4)';
                                    e.target.style.borderRadius = '3px';
                                    e.target.style.transition = 'all 0.2s ease';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.transform = 'scale(1)';
                                    e.target.style.boxShadow = 'none';
                                  }}
                                >
                                  {activity.title?.substring(0,70) || 'No title'}
                                </h6>
                              </td>
                          
                              <td>
                                <span className={`badge rounded-pill ${
                                  activity.status === 'COMPLETED' ? 'bg-success' :
                                  activity.status === 'SUBMITTED' ? 'bg-violet' :
                                  activity.status === 'IN_PROGRESS' ? 'bg-primary' :
                                  activity.status === 'ASSIGNED' ? 'bg-warning' : 'bg-secondary'
                                }`}>
                                  {activity.status?.replace('_', ' ')}
                                </span>
                              </td>
                              <td>
                                <span className={`badge rounded-pill ${
                                  activity.priority === 'URGENT' ? 'bg-danger' :
                                  activity.priority === 'HIGH' ? 'bg-warning' :
                                  activity.priority === 'MEDIUM' ? 'bg-info' : 'bg-secondary'
                                }`}>
                                  {activity.priority}
                                </span>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="flex-shrink-0 me-2">
                                    <i className="ri-user-line text-muted"></i>
                                  </div>
                                  <div className="flex-grow-1">
                                    <h6 className="mb-0 fs-14">{activity.assigned_to_name || 'Unassigned'}</h6>
                                     {activity.assigned_department_name && (
                                        <p className="text-muted mb-0 small">
                                           {activity.assigned_department_name}
                                        </p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="flex-shrink-0 me-2">
                                    <i className="ri-user-line text-muted"></i>
                                  </div>
                                  <div className="flex-grow-1">
                                    <h6 className="mb-0 fs-14">{activity.created_by_name || 'N/A'}</h6>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="text-muted">
                                  {activity.updated_at ? new Date(activity.updated_at).toLocaleDateString() : 'N/A'}
                                </span>
                              </td>
                              {/* <td>
                                <button 
                                  className="btn btn-sm btn-outline-primary rounded-pill"
                                  onClick={() => {
                                    // Navigate to the appropriate page based on task type
                                    if (activity.task_type === 'SUBTASK') {
                                      // For subtasks, navigate to admin task review details page
                                      navigate(`/admin/task_Approvel/${activity.id}`);
                                    } else {
                                      // For main tasks, navigate to task details page
                                      navigate(`/admin/task_Approvel/${activity.id}`);
                                    }
                                  }}
                                >
                                  <i className="ri-eye-line me-1"></i>
                                  View
                                </button>
                              </td> */}

                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <div className="avatar-md mx-auto mb-3">
                        <div className="avatar-title bg-light text-muted rounded-circle">
                          <i className="ri-task-line ri-2x"></i>
                        </div>
                      </div>
                      <h5 className="mt-3">No recent activities</h5>
                      <p className="text-muted">No recent task activities available.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Details Modal */}
      <TaskDetailsModal
        task={selectedTask}
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
      />
    </div>
  );
}

export default AdminDashboard;