import React, { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../Context/ConfigContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { buildApiUrl } from '../../config/api';
import { useNavigate } from 'react-router-dom';
import EmployeeNavigation from './EmployeeNavigation';
import Snowfall from 'react-snowfall';

const AssignedTasks = () => {
  const { leadCrmUser, isLeadCrmAuthenticated, leadCrmHeaders } = useContext(ConfigContext);
  const navigate = useNavigate();
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  // New states for task submission modal
  const [selectedTask, setSelectedTask] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitNotes, setSubmitNotes] = useState('');

  // Fetch employee tasks
  const fetchTasks = async () => {
    try {
     
      
      if (!leadCrmUser || !leadCrmUser.id) {
        
        
        toast.error('User not authenticated');
        setLoading(false);
        return;
      }

      // Always use the authenticated user's tasks endpoint
      const endpoint = buildApiUrl('/tasks/my-tasks-with-subtasks') + '?limit=500';
      
      
      // Use credentials: 'include' to send cookies with the request
      const config = {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      
      setLoading(true);
      
      // Add a timeout to see if the request is actually being made
     
      const response = await axios.get(endpoint, config);
     

      if (response.data.success) {
        
        if (response.data.data.tasks && response.data.data.tasks.length > 0) {
          
          response.data.data.tasks.forEach((task, index) => {
            
          });
        } else {
          
          
          
          // Let's check what user ID the backend thinks we are
          
          try {
            const testResponse = await axios.get(buildApiUrl('/auth/me'), config);
            
          } catch (testError) {
            
          }
        }
        
        // Set tasks, ensuring we have an array
        setTasks(response.data.data.tasks || []);
        
      } else {
        
        toast.error(`Failed to load tasks: ${response.data.message || 'Unknown error'}`);
        setTasks([]); // Ensure tasks is an empty array on error
      }
    } catch (error) {
      
      if (error.response) {
        
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to load tasks'}`);
      } else {
        toast.error('Network error: Failed to load tasks');
      }
      setTasks([]); // Ensure tasks is an empty array on error
    } finally {
      setLoading(false);
      
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Filter tasks based on status
  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });
  
  // Navigate to task detail page
  const navigateToTask = (task) => {
    // Add a check to ensure the task ID is valid before navigating
    if (task && task.id) {
      // Determine if this is a subtask and use appropriate route
      if (task.is_subtask || task.parent_task_id) {
        
        navigate(`/employee/subtask/${task.id}`);
      } else {
        
        navigate(`/employee/task/${task.id}`);
      }
    } else {
      toast.error("Invalid task. Cannot view details.");
    }
  };

  // Refresh tasks
  const handleRefresh = () => {
    fetchTasks();
  };

  // Open submit modal
  const openSubmitModal = (task) => {
    setSelectedTask(task);
    setShowSubmitModal(true);
  };

  // Close submit modal
  const closeSubmitModal = () => {
    setShowSubmitModal(false);
    setSelectedTask(null);
    setSubmitNotes('');
  };

  // Handle task submission with daily log validation
  const handleSubmitTask = async () => {
    try {
      // First, check if daily logs are written for this task
      try {
        const config = {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        };
        
        const logsResponse = await axios.get(
          buildApiUrl(`/tasks/${selectedTask.id}/logs`),
          config
        );
        
        if (logsResponse.data.success) {
          const logs = logsResponse.data.data.logs || [];
          if (logs.length === 0) {
            toast.error('Please write at least one daily log before submitting the task.');
            return;
          }
        }
      } catch (logsError) {
        
        // Even if we can't fetch logs, we should still allow submission
        // This prevents blocking users if there's a logs API issue
      }

      // Ensure completion_notes is never empty
      const completionNotes = submitNotes.trim() || 'Task completed';
      
      const payload = {
        status: 'SUBMITTED',
        completion_notes: completionNotes
      };

      const config = {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const response = await axios.put(
        buildApiUrl(`/tasks/${selectedTask.id}/status`),
        payload,
        config
      );

      if (response.data.success) {
        toast.success('Task submitted to Team Leader for review');
        closeSubmitModal();
        
        // Update the task status in the local state immediately
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === selectedTask.id 
              ? { ...task, status: 'SUBMITTED' } 
              : task
          )
        );
      } else {
        toast.error(`Failed to submit task: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to submit task'}`);
      } else {
        toast.error('Network error: Failed to submit task');
      }
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
                <p className="mt-2 text-muted">Loading your assigned tasks...</p>
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
          {/* Employee Navigation */}
          <EmployeeNavigation />
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
          {/* Page title */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-0">My Assigned Tasks</h4>
                  <p className="text-muted mb-0">View and manage your assigned tasks</p>
                </div>
                <button 
                  className="btn btn-outline-primary rounded-pill"
                  onClick={handleRefresh}
                >
                  <i className="ri-refresh-line me-2"></i>
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Filter buttons */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="d-flex flex-wrap gap-2">
                    <button 
                      className={`btn rounded-pill ${filter === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => setFilter('all')}
                    >
                      All Tasks
                    </button>
                    <button 
                      className={`btn rounded-pill ${filter === 'ASSIGNED' ? 'btn-warning' : 'btn-outline-secondary'}`}
                      onClick={() => setFilter('ASSIGNED')}
                    >
                      Assigned
                    </button>
                    <button 
                      className={`btn rounded-pill ${filter === 'IN_PROGRESS' ? 'btn-info' : 'btn-outline-secondary'}`}
                      onClick={() => setFilter('IN_PROGRESS')}
                    >
                      In Progress
                    </button>
                    <button 
                      className={`btn rounded-pill ${filter === 'SUBMITTED' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => setFilter('SUBMITTED')}
                    >
                      Submitted
                    </button>
                    <button 
                      className={`btn rounded-pill ${filter === 'COMPLETED' ? 'btn-success' : 'btn-outline-secondary'}`}
                      onClick={() => setFilter('COMPLETED')}
                    >
                      Completed
                    </button>
                    <button 
                      className={`btn rounded-pill ${filter === 'CANCELLED' ? 'btn-danger' : 'btn-outline-secondary'}`}
                      onClick={() => setFilter('CANCELLED')}
                    >
                      Cancelled
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tasks table */}
          <div className="row">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 pb-0">
                  <h5 className="card-title mb-0">Assigned Tasks</h5>
                  <p className="text-muted small mb-2">
                    {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'} found
                  </p>
                </div>
                <div className="card-body">
                  {filteredTasks && filteredTasks.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-centered table-nowrap mb-0">
                        <thead className="table-light">
                          <tr>
                            <th scope="col" className="border-0">Task</th>
                            <th scope="col" className="border-0">Priority</th>
                            <th scope="col" className="border-0">Status</th>
                            <th scope="col" className="border-0">Due Date</th>
                            <th scope="col" className="border-0">Assigned Date</th>
                            <th scope="col" className="border-0 text-end">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTasks.map(task => (
                            <tr key={task.id} className="align-middle">
                              <td>
                                <div>
                                  <h6 className="mb-1">
                                    {task.title}
                                    {(task.is_subtask || task.parent_task_id) && (
                                      <span className="badge bg-light text-dark ms-2">Subtask</span>
                                    )}
                                  </h6>
                                  <p className="mb-0 text-muted small">
                                    {task.description ? task.description.substring(0, 50) + (task.description.length > 50 ? '...' : '') : 'No description'}
                                  </p>
                                  {(task.parent_task_title || task.parent_task_id) && (
                                    <p className="mb-0 text-muted small">
                                      <i className="ri-subtask-line me-1"></i>
                                      Part of: {task.parent_task_title || `Task #${task.parent_task_id}`}
                                    </p>
                                  )}
                                </div>
                              </td>
                              <td>
                                <span className={`badge rounded-pill ${
                                  task.priority === 'URGENT' ? 'bg-danger' :
                                  task.priority === 'HIGH' ? 'bg-warning' : 
                                  task.priority === 'MEDIUM' ? 'bg-info' : 'bg-secondary'
                                }`}>
                                  {task.priority || 'MEDIUM'}
                                </span>
                              </td>
                              <td>
                                <span className={`badge rounded-pill ${
                                  task.status === 'ASSIGNED' ? 'bg-warning text-dark' :
                                  task.status === 'IN_PROGRESS' ? 'bg-info' :
                                  task.status === 'SUBMITTED' ? 'bg-primary' :
                                  task.status === 'COMPLETED' ? 'bg-success' :
                                  task.status === 'CANCELLED' ? 'bg-danger' : 'bg-secondary'
                                }`}>
                                  {task.status ? task.status.replace('_', ' ') : 'UNKNOWN'}
                                </span>
                              </td>
                              <td>
                                <span className={`${task.due_date && new Date(task.due_date) < new Date() && task.status !== 'COMPLETED' && task.status !== 'CANCELLED' ? 'text-danger' : 'text-muted'}`}>
                                  {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                                </span>
                              </td>
                              <td>
                                <span className="text-muted">
                                  {task.assigned_date ? new Date(task.assigned_date).toLocaleDateString() : 
                                   task.assigned_at ? new Date(task.assigned_at).toLocaleDateString() :
                                   task.created_at ? new Date(task.created_at).toLocaleDateString() : 'N/A'}
                                </span>
                              </td>
                              <td className="text-end">
                                {task.status !== 'SUBMITTED' && task.status !== 'COMPLETED' && task.status !== 'CANCELLED' ? (
                                  <>
                                    <button 
                                      className="btn btn-sm btn-outline-primary rounded-pill me-1"
                                      onClick={() => navigateToTask(task)}
                                    >
                                      <i className="ri-edit-line me-1"></i>
                                      Work On
                                    </button>
                                    <button 
                                      className="btn btn-sm btn-outline-success rounded-pill"
                                      onClick={() => openSubmitModal(task)}
                                    >
                                      <i className="ri-send-plane-line me-1"></i>
                                      Submit
                                    </button>
                                  </>
                                ) : task.status === 'CANCELLED' ? (
                                  <button 
                                    className="btn btn-sm btn-outline-danger rounded-pill"
                                    onClick={() => navigateToTask(task)}
                                  >
                                    <i className="ri-eye-line me-1"></i>
                                    View Details
                                  </button>
                                ) : (
                                  <button 
                                    className="btn btn-sm btn-outline-secondary rounded-pill"
                                    disabled
                                  >
                                    <i className="ri-check-line me-1"></i>
                                    {task.status === 'SUBMITTED' ? 'Submitted' : 'Completed'}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <div className="avatar-lg bg-light rounded-circle mx-auto mb-3">
                        <i className="ri-file-list-2-line ri-2x text-muted"></i>
                      </div>
                      <h5 className="text-muted">No assigned tasks found</h5>
                      <p className="text-muted mb-0">You don't have any tasks assigned to you at the moment.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Task Modal */}
      {showSubmitModal && selectedTask && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Submit Task for Review</h5>
                <button type="button" className="btn-close" onClick={closeSubmitModal}></button>
              </div>
              <div className="modal-body">
                <div className="card mb-3">
                  <div className="card-header">
                    <h6 className="mb-0">Task Information</h6>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <p><strong>Title:</strong> {selectedTask.title}</p>
                        <p><strong>Priority:</strong> 
                          <span className={`badge ms-2 ${
                            selectedTask.priority === 'URGENT' ? 'bg-danger' :
                            selectedTask.priority === 'HIGH' ? 'bg-warning' : 
                            selectedTask.priority === 'MEDIUM' ? 'bg-info' : 'bg-secondary'
                          }`}>
                            {selectedTask.priority}
                          </span>
                        </p>
                      </div>
                      <div className="col-md-6">
                        <p><strong>Due Date:</strong> {selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleDateString() : 'No due date'}</p>
                        <p><strong>Status:</strong> 
                          <span className={`badge ms-2 ${
                            selectedTask.status === 'COMPLETED' ? 'bg-success' : 
                            selectedTask.status === 'IN_PROGRESS' ? 'bg-warning' : 
                            selectedTask.status === 'PENDING' ? 'bg-info' : 
                            selectedTask.status === 'SUBMITTED' ? 'bg-primary' : 
                            selectedTask.status === 'CANCELLED' ? 'bg-danger' :
                            'bg-secondary'
                          }`}>
                            {selectedTask.status.replace('_', ' ')}
                          </span>
                        </p>
                      </div>
                    </div>
                    <p><strong>Description:</strong> {selectedTask.description}</p>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    placeholder="Add notes about task completion..."
                    value={submitNotes}
                    onChange={(e) => setSubmitNotes(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeSubmitModal}>
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-success"
                  onClick={handleSubmitTask}
                >
                  <i className="ri-send-plane-line me-1"></i>
                  Submit Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignedTasks;