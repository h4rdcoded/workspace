import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { ConfigContext } from '../../Context/ConfigContext';
import PageTitle from '../../Components/PageTitle';
import Swal from 'sweetalert2';
import ApexCharts from 'react-apexcharts';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { buildApiUrl, getAuthHeaders } from '../../config/api';

const EmployeeDashboard = () => {
  const { leadCrmApiURL, leadCrmHeaders, leadCrmUser } = useContext(ConfigContext);
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [taskDistributionChart, setTaskDistributionChart] = useState(null);
  const [taskTrendChart, setTaskTrendChart] = useState(null);
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  });
  const [filterApplied, setFilterApplied] = useState(false);
  
  // Refs for chart instances
  const taskDistributionChartRef = useRef(null);
  const taskTrendChartRef = useRef(null);

  // Function to handle chart downloads
  const downloadTaskDistributionChart = useCallback(() => {
    if (taskDistributionChartRef.current && taskDistributionChartRef.current.chart) {
      taskDistributionChartRef.current.chart.dataURI().then(({ imgURI }) => {
        const link = document.createElement('a');
        link.download = 'task-distribution.png';
        link.href = imgURI;
        link.click();
      });
    }
  }, []);

  const downloadTaskTrendChart = useCallback(() => {
    if (taskTrendChartRef.current && taskTrendChartRef.current.chart) {
      taskTrendChartRef.current.chart.dataURI().then(({ imgURI }) => {
        const link = document.createElement('a');
        link.download = 'task-trend.png';
        link.href = imgURI;
        link.click();
      });
    }
  }, []);

  const fetchEmployeeDashboardData = useCallback(async (customDateRange = null) => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams();
      if (customDateRange?.from) queryParams.append('from', customDateRange.from);
      if (customDateRange?.to) queryParams.append('to', customDateRange.to);
      
      const response = await axios.get(
        buildApiUrl(`/employee/dashboard?${queryParams.toString()}`),
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        setDashboardData(response.data.data);
        setFilterApplied(!!(customDateRange?.from || customDateRange?.to));
        
        // Process task distribution data for charts
        const statusCounts = {};
        (response.data.data.recent_tasks || []).forEach(task => {
          statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
        });
        
        const statusLabels = Object.keys(statusCounts).map(status => 
          status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
        );
        const statusValues = Object.values(statusCounts);
        
        // Task Distribution Chart
        setTaskDistributionChart({
          options: {
            chart: {
              type: 'donut',
              height: 350
            },
            labels: statusLabels,
            colors: ['#28c76f', '#ff9f43', '#ea5455', '#00cfe8', '#7367f0'],
            legend: {
              position: 'bottom'
            },
            plotOptions: {
              pie: {
                donut: {
                  size: '65%'
                }
              }
            },
            responsive: [{
              breakpoint: 480,
              options: {
                chart: {
                  width: 200
                },
                legend: {
                  position: 'bottom'
                }
              }
            }]
          },
          series: statusValues
        });
        
        // Process task trend data (using dummy data for now)
        const dates = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const completedTasks = [3, 5, 2, 4, 6, 3, 5];
        const pendingTasks = [2, 1, 3, 2, 1, 2, 1];
        const inProgressTasks = [1, 2, 1, 3, 2, 1, 2];
        
        // Task Trend Chart
        setTaskTrendChart({
          options: {
            chart: {
              type: 'area',
              height: 350,
              toolbar: { show: false }
            },
            dataLabels: {
              enabled: false
            },
            stroke: {
              curve: 'smooth',
              width: 2
            },
            colors: ['#28c76f', '#ff9f43', '#00cfe8'],
            xaxis: {
              categories: dates,
            },
            tooltip: {
              y: {
                formatter: function (val) {
                  return val + " tasks"
                }
              }
            }
          },
          series: [
            {
              name: 'Completed',
              data: completedTasks
            },
            {
              name: 'In Progress',
              data: inProgressTasks
            },
            {
              name: 'Pending',
              data: pendingTasks
            }
          ]
        });
      } else {
        console.error('Dashboard API error:', response.data.message);
        Swal.fire('Error', response.data.message || 'Failed to fetch dashboard data', 'error');
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      Swal.fire('Error', 'Network error while fetching dashboard data: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployeeDashboardData();
  }, [fetchEmployeeDashboardData]);

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  const applyDateFilter = () => {
    fetchEmployeeDashboardData(dateRange);
  };

  const clearDateFilter = () => {
    setDateRange({ from: '', to: '' });
    setFilterApplied(false);
    fetchEmployeeDashboardData();
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="page-content">
          <div className="container-fluid">
            <PageTitle title="Employee Dashboard" primary="Task Management" />
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
            <PageTitle title="Employee Dashboard" primary="Task Management" />
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
  const recentActivities = (dashboardData.recent_tasks || []).slice(0, 10);

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

  // Calculate task statistics
  const totalTasks = dashboardData?.task_statistics?.total_tasks || 0;
  const completedTasks = dashboardData?.task_statistics?.completed_tasks || 0;
  const pendingTasks = dashboardData?.task_statistics?.pending_tasks || 0;
  const inProgressTasks = dashboardData?.task_statistics?.in_progress_tasks || 0;
  const overdueTasks = dashboardData?.task_statistics?.overdue_tasks || 0;
  const submittedTasks = dashboardData?.task_statistics?.submitted_tasks || 0;

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
            color: #0AC7FB;
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
            border-color: #0AC7FB;
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
        `}
      </style>
      <div className="page-content">
        <div className="container-fluid">
          <PageTitle title="Employee Dashboard" primary="Task Management" />
          
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
          <div className="row mb-4 g-4">
            <div className="col-xl-3 col-md-6">
              <div className="card border-0 shadow-sm h-100 rounded-3">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="flex-shrink-0 bg-primary bg-opacity-10 rounded-3 p-3">
                      <i className="ri-task-line text-primary fs-4"></i>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <h6 className="card-title mb-1 text-muted">Total Tasks</h6>
                      <h3 className="mb-0 text-primary">{totalTasks}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-xl-3 col-md-6">
              <div className="card border-0 shadow-sm h-100 rounded-3">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="flex-shrink-0 bg-secondary bg-opacity-10 rounded-3 p-3">
                      <i className="ri-time-line text-warning fs-4"></i>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <h6 className="card-title mb-1 text-muted">Pending Tasks</h6>
                      <h3 className="mb-0 text-warning">{pendingTasks}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-xl-3 col-md-6">
              <div className="card border-0 shadow-sm h-100 rounded-3">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="flex-shrink-0 bg-primary bg-opacity-10 rounded-3 p-3">
                      <i className="ri-loader-line text-info fs-4"></i>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <h6 className="card-title mb-1 text-muted">In Progress</h6>
                      <h3 className="mb-0 text-info">{inProgressTasks}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-xl-3 col-md-6">
              <div className="card border-0 shadow-sm h-100 rounded-3">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="flex-shrink-0 bg-success bg-opacity-10 rounded-3 p-3">
                      <i className="ri-check-double-line text-success fs-4"></i>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <h6 className="card-title mb-1 text-muted">Completed Tasks</h6>
                      <h3 className="mb-0 text-success">{completedTasks}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="row mb-4 g-4">
            {/* Task Distribution Chart */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm rounded-3">
                <div className="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Task Distribution by Status</h5>
                  <button className="btn btn-sm btn-outline-primary rounded-pill" onClick={downloadTaskDistributionChart}>
                    <i className="ri-download-2-line"></i>
                  </button>
                </div>
                <div className="card-body">
                  {taskDistributionChart ? (
                    <ApexCharts 
                      ref={taskDistributionChartRef}
                      options={taskDistributionChart.options}
                      series={taskDistributionChart.series}
                      type="donut"
                      height={350}
                    />
                  ) : (
                    <div className="text-center py-5">
                      <p className="text-muted">No task distribution data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Task Trend Chart */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm rounded-3">
                <div className="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Task Trend</h5>
                  <button className="btn btn-sm btn-outline-primary rounded-pill" onClick={downloadTaskTrendChart}>
                    <i className="ri-download-2-line"></i>
                  </button>
                </div>
                <div className="card-body">
                  {taskTrendChart ? (
                    <ApexCharts 
                      ref={taskTrendChartRef}
                      options={taskTrendChart.options}
                      series={taskTrendChart.series}
                      type="area"
                      height={350}
                    />
                  ) : (
                    <div className="text-center py-5">
                      <p className="text-muted">No task trend data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="row">
            <div className="col-12">
              <div className="card border-0 shadow-sm rounded-3">
                <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center">
                  <h4 className="card-title mb-0">Recent Tasks</h4>
                  <button 
                    className="btn btn-outline-primary btn-sm rounded-pill"
                    onClick={() => navigate('/employee/tasks')}
                  >
                    <i className="ri-eye-line me-1"></i>
                    View All Tasks
                  </button>
                </div>
                <div className="card-body">
                  {recentActivities?.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-centered table-nowrap mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Task Title</th>
                            <th>Task Type</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Due Date</th>
                            <th>Assigned By</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentActivities.map((task, index) => (
                            <tr key={index}>
                              <td>
                                <h6 className="mb-0">{task.title}</h6>
                              </td>
                              <td>
                                <span className="badge rounded-pill bg-info">
                                  {task.task_type === 'SUBTASK' ? 'Subtask' : 'Main Task'}
                                </span>
                              </td>
                              <td>
                                <span className={`badge ${
                                  task.priority === 'HIGH' ? 'bg-danger' : 
                                  task.priority === 'MEDIUM' ? 'bg-warning' : 
                                  'bg-info'
                                }`}>
                                  {task.priority}
                                </span>
                              </td>
                              <td>
                                <span className={`badge rounded-pill ${
                                  task.status === 'COMPLETED' ? 'bg-success' : 
                                  task.status === 'IN_PROGRESS' ? 'bg-primary' : 
                                  task.status === 'DRAFT' ? 'bg-warning' : 
                                  'bg-secondary'
                                }`}>
                                  {task.status.replace('_', ' ')}
                                </span>
                              </td>
                              <td>{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="flex-shrink-0 me-2">
                                    <i className="ri-user-line text-muted"></i>
                                  </div>
                                  <div className="flex-grow-1">
                                    <h6 className="mb-0 fs-14">{task.created_by_name || 'N/A'}</h6>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <button 
                                  className="btn btn-sm btn-outline-primary rounded-pill"
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
                      <div className="avatar-md mx-auto mb-3">
                        <div className="avatar-title bg-light text-muted rounded-circle">
                          <i className="ri-task-line ri-2x"></i>
                        </div>
                      </div>
                      <h5 className="mt-3">No tasks found</h5>
                      <p className="text-muted">You have no assigned tasks at the moment.</p>
                      <button 
                        className="btn btn-primary rounded-pill"
                        onClick={() => navigate('/employee/tasks')}
                      >
                        <i className="ri-task-line me-1"></i>
                        View All Tasks
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="row">
            <div className="col-12">
              <div className="card rounded-3 shadow-sm">
                <div className="card-header bg-transparent border-0">
                  <h5 className="card-title mb-0">Quick Actions</h5>
                </div>
                <div className="card-body">
                  <div className="d-flex flex-wrap gap-2">
                    <button 
                      className="btn btn-primary rounded-pill"
                      onClick={() => navigate('/employee/tasks')}
                    >
                      <i className="ri-task-line me-2"></i>
                      View All Tasks
                    </button>
                    <button 
                      className="btn btn-outline-warning rounded-pill"
                      onClick={() => navigate('/employee/tasks?status=DRAFT')}
                    >
                      <i className="ri-time-line me-2"></i>
                      Pending Tasks
                    </button>
                    <button 
                      className="btn btn-outline-info rounded-pill"
                      onClick={() => navigate('/employee/tasks?status=IN_PROGRESS')}
                    >
                      <i className="ri-loader-line me-2"></i>
                      In Progress Tasks
                    </button>
                    <button 
                      className="btn btn-outline-success rounded-pill"
                      onClick={() => navigate('/employee/tasks?status=COMPLETED')}
                    >
                      <i className="ri-checkbox-circle-line me-2"></i>
                      Completed Tasks
                    </button>
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

export default EmployeeDashboard;