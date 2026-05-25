import React, { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../Context/ConfigContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

const TodaysAssignedTasks = () => {
  const { leadCrmApiURL, leadCrmUser } = useContext(ConfigContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  
  // Get URL parameters for specific highlighting/navigation
  const highlightTaskId = searchParams.get('taskId');
  const highlightLeadId = searchParams.get('leadId');

  useEffect(() => {
    if (leadCrmUser?.role === 'EXEC') {
      fetchTasks();
      
      // Show notification if coming from search results
      if (highlightTaskId) {
        toast.info(`Showing task: ${highlightTaskId}`, {
          position: "top-right",
          autoClose: 3000
        });
      } else if (highlightLeadId) {
        toast.info(`Search results for lead: ${highlightLeadId}`, {
          position: "top-right",
          autoClose: 3000
        });
      }
    }
  }, [leadCrmUser, filter, highlightTaskId, highlightLeadId]);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      let url = `${leadCrmApiURL}/tasks/my?limit=20`;
      if (filter !== 'all') {
        url += `&status=${filter}`;
      }

      const response = await fetch(url, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(data.data.tasks || []);
      } else {
        console.error('Failed to fetch tasks');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskClick = (taskId) => {
    navigate(`/LeadManagement?taskId=${taskId}`);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'PENDING': 'bg-warning',
      'IN_PROGRESS': 'bg-info',
      'SUBMITTED': 'bg-success',
      'COMPLETED': 'bg-success'
    };
    return statusColors[status] || 'bg-secondary';
  };

  const getTaskProgress = (task) => {
    const progress = task.part.totalRows > 0 
      ? Math.round((task.processedCount / task.part.totalRows) * 100) 
      : 0;
    return progress;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (leadCrmUser?.role !== 'EXEC') {
    return (
      <div className="alert alert-warning">
        <h4>Access Denied</h4>
        <p>This page is only accessible to Executives.</p>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="page-content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                <h4 className="mb-sm-0">Today's Assigned Tasks</h4>
                <div className="page-title-right">
                  <ol className="breadcrumb m-0">
                    <li className="breadcrumb-item">Dashboard</li>
                    <li className="breadcrumb-item active">Assigned Tasks</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Section */}
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="card-title mb-0">Task Inbox</h5>
                    <div className="d-flex gap-2">
                      <select 
                        className="form-select"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        style={{ width: 'auto' }}
                      >
                        <option value="all">All Tasks</option>
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="SUBMITTED">Submitted</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                      <button 
                        className="btn btn-primary"
                        onClick={fetchTasks}
                      >
                        <i className="ri-refresh-line"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tasks List */}
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  {isLoading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : tasks.length > 0 ? (
                    <div className="email-wrapper">
                      {tasks.map((task, index) => {
                        const isHighlighted = highlightTaskId && task.id === highlightTaskId;
                        return (
                        <div 
                          key={task.id} 
                          className={`card mb-3 task-card ${
                            task.status === 'PENDING' ? 'border-warning' : ''
                          } ${
                            isHighlighted ? 'border-primary border-3 bg-primary-subtle' : ''
                          }`}
                          style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                          onClick={() => handleTaskClick(task.id)}
                          onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                        >
                          <div className="card-body">
                            <div className="d-flex align-items-start">
                              {/* Task Icon/Avatar */}
                              <div className="flex-shrink-0 me-3">
                                <div className="avatar-sm">
                                  <div className="avatar-title bg-primary-subtle text-primary rounded-circle">
                                    <i className="ri-file-list-3-line fs-16"></i>
                                  </div>
                                </div>
                              </div>

                              {/* Task Content */}
                              <div className="flex-grow-1 overflow-hidden">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <div>
                                    <h6 className="mb-1 text-truncate">
                                      <i className="ri-user-line me-1 text-muted"></i>
                                      From: {task.teamLeader}
                                    </h6>
                                    <p className="text-muted mb-1">
                                      <i className="ri-file-text-line me-1"></i>
                                      {task.batch.filename} - Part {task.part.index}
                                    </p>
                                  </div>
                                  <div className="text-end">
                                    <span className={`badge ${getStatusBadge(task.status)}`}>
                                      {task.status.replace('_', ' ')}
                                    </span>
                                    <div className="text-muted mt-1">
                                      <small>{formatDate(task.assignedAt)}</small>
                                    </div>
                                  </div>
                                </div>

                                {/* Task Details */}
                                <div className="mb-3">
                                  <p className="mb-2">
                                    <strong>Task:</strong> {task.note || `Process leads from rows ${task.part.rowStart} to ${task.part.rowEnd}`}
                                  </p>
                                  <div className="row g-3">
                                    <div className="col-md-3">
                                      <div className="text-center p-2 bg-light rounded">
                                        <div className="fw-semibold text-primary">{task.part.totalRows}</div>
                                        <small className="text-muted">Total Leads</small>
                                      </div>
                                    </div>
                                    <div className="col-md-3">
                                      <div className="text-center p-2 bg-light rounded">
                                        <div className="fw-semibold text-success">{task.processedCount}</div>
                                        <small className="text-muted">Processed</small>
                                      </div>
                                    </div>
                                    <div className="col-md-3">
                                      <div className="text-center p-2 bg-light rounded">
                                        <div className="fw-semibold text-warning">{task.part.totalRows - task.processedCount}</div>
                                        <small className="text-muted">Remaining</small>
                                      </div>
                                    </div>
                                    <div className="col-md-3">
                                      <div className="text-center p-2 bg-light rounded">
                                        <div className="fw-semibold text-info">{getTaskProgress(task)}%</div>
                                        <small className="text-muted">Progress</small>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-2">
                                  <div className="d-flex justify-content-between align-items-center mb-1">
                                    <small className="text-muted">Progress</small>
                                    <small className="text-muted">{getTaskProgress(task)}%</small>
                                  </div>
                                  <div className="progress" style={{ height: '6px' }}>
                                    <div 
                                      className="progress-bar bg-primary" 
                                      role="progressbar" 
                                      style={{ width: `${getTaskProgress(task)}%` }}
                                    ></div>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="d-flex gap-2 mt-3">
                                  <button 
                                    className="btn btn-primary btn-sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTaskClick(task.id);
                                    }}
                                  >
                                    <i className="ri-eye-line me-1"></i>
                                    View & Process
                                  </button>
                                  {task.status === 'PENDING' && (
                                    <span className="badge bg-warning-subtle text-warning">
                                      <i className="ri-time-line me-1"></i>
                                      New Task
                                    </span>
                                  )}
                                  {task.status === 'IN_PROGRESS' && (
                                    <span className="badge bg-info-subtle text-info">
                                      <i className="ri-play-circle-line me-1"></i>
                                      In Progress
                                    </span>
                                  )}
                                  {task.startedAt && (
                                    <small className="text-muted align-self-center">
                                      Started: {formatDate(task.startedAt)}
                                    </small>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          {isHighlighted && (
                            <div className="position-absolute top-0 end-0 m-2">
                              <span className="badge bg-primary">
                                <i className="ri-search-line me-1"></i>
                                Search Result
                              </span>
                            </div>
                          )}
                        </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <div className="avatar-lg mx-auto mb-4">
                        <div className="avatar-title bg-primary-subtle text-primary rounded-circle fs-36">
                          <i className="ri-inbox-line"></i>
                        </div>
                      </div>
                      <h5 className="mb-3">No Tasks Assigned</h5>
                      <p className="text-muted">
                        {filter === 'all' 
                          ? "You don't have any tasks assigned yet. Contact your team leader for task assignments."
                          : `No tasks found with status: ${filter.replace('_', ' ')}`
                        }
                      </p>
                      {filter !== 'all' && (
                        <button 
                          className="btn btn-primary"
                          onClick={() => setFilter('all')}
                        >
                          View All Tasks
                        </button>
                      )}
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

export default TodaysAssignedTasks;