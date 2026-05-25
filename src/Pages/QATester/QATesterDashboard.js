import React, { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../Context/ConfigContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { buildApiUrl, getAuthHeaders } from '../../config/api';
import { useNavigate } from 'react-router-dom';

const QATesterDashboard = () => {
  const { leadCrmUser } = useContext(ConfigContext);
  const navigate = useNavigate();
  
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });

  // Fetch dashboard data
  const fetchDashboardData = async (filters = {}) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);
      
      const url = params.toString() 
        ? `${buildApiUrl('/qa-tester/dashboard')}?${params.toString()}`
        : buildApiUrl('/qa-tester/dashboard');
      
      const response = await axios.get(url, { headers: getAuthHeaders() });
      
      if (response.data.success) {
        setDashboardData(response.data.data);
      } else {
        toast.error(response.data.message || 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (error.response) {
        toast.error(error.response.data.message || 'Failed to load dashboard data');
      } else {
        toast.error('Network error: Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  // Apply date filters
  const applyFilters = () => {
    fetchDashboardData(dateFilter);
  };

  // Clear filters
  const clearFilters = () => {
    setDateFilter({ from: '', to: '' });
    fetchDashboardData();
  };

  // Handle Enter key press in filter inputs
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
                <p className="mt-2 text-muted">Loading QA Tester Dashboard...</p>
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
            <div className="text-center py-5">
              <i className="ri-dashboard-line display-4 text-muted"></i>
              <h5 className="mt-3">No dashboard data available</h5>
              <p className="text-muted">Dashboard data could not be loaded.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const {
    tester_info,
    task_statistics,
    test_case_statistics,
    bug_statistics,
    performance_metrics,
    department_statistics,
    task_type_statistics,
    recent_tasks
  } = dashboardData;

  return (
    <div className="main-content">
      <div className="page-content">
        <div className="container-fluid">
          {/* Header */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-0">QA Tester Dashboard</h4>
                  <p className="text-muted mb-0">Testing performance and task overview</p>
                </div>
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={() => navigate('/qa-tester/tasks')}
                  >
                    <i className="ri-task-line me-2"></i>
                    View Tasks
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Date Filter */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-3">
                      <label className="form-label">From Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={dateFilter.from}
                        onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
                        onKeyPress={handleKeyPress}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">To Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={dateFilter.to}
                        onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
                        onKeyPress={handleKeyPress}
                      />
                    </div>
                    <div className="col-md-3 d-flex align-items-end">
                      <div className="d-flex gap-2">
                        <button className="btn btn-outline-primary" onClick={applyFilters}>
                          <i className="ri-filter-line me-1"></i>
                          Apply Filter
                        </button>
                        <button className="btn btn-outline-secondary" onClick={clearFilters}>
                          <i className="ri-refresh-line me-1"></i>
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className="col-md-3 d-flex align-items-end">
                      {/* <div className="text-muted small">
                        <i className="ri-information-line me-1"></i>
                        Filter applies to all dashboard data
                      </div> */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tester Info */}
          {/* <div className="row mb-4">
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <h5 className="mb-1">{tester_info?.name || 'QA Tester'}</h5>
                      <p className="text-muted mb-0">{tester_info?.email || 'N/A'}</p>
                      <span className={`badge ${
                        tester_info?.is_active ? 'bg-success' : 'bg-danger'
                      }`}>
                        {tester_info?.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="avatar-lg">
                        <div className="avatar-title bg-primary-subtle text-primary rounded-circle">
                          <i className="ri-user-line fs-24"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div> */}

          {/* Statistics Cards */}
          <div className="row mb-4">
            {/* Task Statistics */}
            <div className="col-xl-3 col-md-6">
              <div className="card card-animate">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1 overflow-hidden">
                      <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Total Tasks</p>
                    </div>
                    <div className="flex-shrink-0">
                      <h4 className="fs-22 fw-semibold ff-secondary mb-0">
                        <span className="counter-value" data-target={task_statistics?.total_assigned_tasks || 0}>
                          {task_statistics?.total_assigned_tasks || 0}
                        </span>
                      </h4>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="badge bg-success-subtle text-success">Tested: {task_statistics?.tested_tasks || 0}</span>
                    <span className="badge bg-warning-subtle text-warning ms-1">Pending: {task_statistics?.pending_tasks || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Case Statistics */}
            <div className="col-xl-3 col-md-6">
              <div className="card card-animate">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1 overflow-hidden">
                      <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Test Cases</p>
                    </div>
                    <div className="flex-shrink-0">
                      <h4 className="fs-22 fw-semibold ff-secondary mb-0">
                        <span className="counter-value" data-target={test_case_statistics?.total_test_cases || 0}>
                          {test_case_statistics?.total_test_cases || 0}
                        </span>
                      </h4>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="badge bg-success-subtle text-success">Passed: {test_case_statistics?.passed_test_cases || 0}</span>
                    <span className="badge bg-danger-subtle text-danger ms-1">Failed: {test_case_statistics?.failed_test_cases || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bug Statistics */}
            <div className="col-xl-3 col-md-6">
              <div className="card card-animate">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1 overflow-hidden">
                      <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Bugs Reported</p>
                    </div>
                    <div className="flex-shrink-0">
                      <h4 className="fs-22 fw-semibold ff-secondary mb-0">
                        <span className="counter-value" data-target={bug_statistics?.total_bugs || 0}>
                          {bug_statistics?.total_bugs || 0}
                        </span>
                      </h4>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="badge bg-warning-subtle text-warning">Open: {bug_statistics?.open_bugs || 0}</span>
                    <span className="badge bg-success-subtle text-success ms-1">Resolved: {bug_statistics?.resolved_bugs || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="col-xl-3 col-md-6">
              <div className="card card-animate">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1 overflow-hidden">
                      <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Avg Testing Days</p>
                    </div>
                    <div className="flex-shrink-0">
                      <h4 className="fs-22 fw-semibold ff-secondary mb-0">
                        <span className="counter-value" data-target={Math.round(performance_metrics?.avg_testing_days) || 0}>
                          {Math.round(performance_metrics?.avg_testing_days) || 0}
                        </span>
                      </h4>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-muted">On Time: {performance_metrics?.on_time_completions || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts and Detailed Stats */}
          <div className="row mb-4">
            {/* Department-wise Distribution */}
            <div className="col-xl-6">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">Tasks by Department</h5>
                </div>
                <div className="card-body">
                  {department_statistics && department_statistics.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-bordered table-nowrap mb-0">
                        <thead>
                          <tr>
                            <th>Department</th>
                            <th>Total</th>
                            <th>Tested</th>
                            <th>Pending</th>
                          </tr>
                        </thead>
                        <tbody>
                          {department_statistics.map((dept, index) => (
                            <tr key={index}>
                              <td>{dept.department_name}</td>
                              <td>{dept.total_tasks}</td>
                              <td>
                                <span className="badge bg-success">{dept.tested_tasks}</span>
                              </td>
                              <td>
                                <span className="badge bg-warning">{dept.pending_tasks}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-3">
                      <p className="text-muted mb-0">No department data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Task Type Distribution */}
            <div className="col-xl-6">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">Tasks by Type</h5>
                </div>
                <div className="card-body">
                  {task_type_statistics && task_type_statistics.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-bordered table-nowrap mb-0">
                        <thead>
                          <tr>
                            <th>Task Type</th>
                            <th>Total</th>
                            <th>Tested</th>
                            <th>In Test</th>
                          </tr>
                        </thead>
                        <tbody>
                          {task_type_statistics.map((type, index) => (
                            <tr key={index}>
                              <td>{type.task_type || 'N/A'}</td>
                              <td>{type.total_tasks}</td>
                              <td>
                                <span className="badge bg-success">{type.tested_tasks}</span>
                              </td>
                              <td>
                                <span className="badge bg-info">{type.in_test_tasks}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-3">
                      <p className="text-muted mb-0">No task type data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">Recent Assigned Tasks</h5>
                </div>
                <div className="card-body">
                  {recent_tasks && recent_tasks.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Task Title</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Priority</th>
                            <th>Department</th>
                            <th>Assigned Date</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recent_tasks.map((task) => (
                            <tr key={task.id}>
                              <td>
                                <h6 className="mb-0">{task.title?.substring(0, 50) || 'No title'}</h6>
                              </td>
                              <td>
                                <span className={`badge ${
                                  task.task_type === 'DAILY_ROUTINE' ? 'bg-success' :
                                  task.task_type === 'MAIN_TASK' ? 'bg-primary' : 'bg-info'
                                }`}>
                                  {task.task_type === 'DAILY_ROUTINE' ? 'Daily Routine' : 
                                   task.task_type === 'MAIN_TASK' ? 'Main Task' : 'Subtask'}
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
                                <span className={`badge ${
                                  task.priority === 'URGENT' ? 'bg-danger' :
                                  task.priority === 'HIGH' ? 'bg-warning' : 
                                  task.priority === 'MEDIUM' ? 'bg-info' : 'bg-secondary'
                                }`}>
                                  {task.priority}
                                </span>
                              </td>
                              <td>{task.department_name || 'N/A'}</td>
                              <td>{task.assigned_to_tester_at ? new Date(task.assigned_to_tester_at).toLocaleDateString() : 'N/A'}</td>
                              <td>
                                <button 
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => navigate(`/qa-tester/task/${task.id}`)}
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
                    <div className="text-center py-3">
                      <i className="ri-task-line display-4 text-muted"></i>
                      <h5 className="mt-3">No recent tasks</h5>
                      <p className="text-muted">No tasks have been assigned to you recently.</p>
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

export default QATesterDashboard;