import React, { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../Context/ConfigContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { buildApiUrl, getAuthHeaders } from '../../config/api';
import { useNavigate, Link } from 'react-router-dom';

const AdminTaskReviewPage = () => {
  const { leadCrmUser } = useContext(ConfigContext);
  const navigate = useNavigate();
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch tasks submitted to admin for review
  const fetchSubmittedTasks = async () => {
    try {
      setLoading(true);
      
      // Get main tasks in SUBMITTED status for admin to review
      const response = await axios.get(
        buildApiUrl('/tasks/status/SUBMITTED'),
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        // Filter only main tasks (not subtasks)
        const mainTasks = response.data.data.tasks.filter(task => 
          task.task_type === 'MAIN_TASK' || !task.parent_task_id
        );
        setTasks(mainTasks);
      } else {
        toast.error(`Failed to load tasks: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      
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
    fetchSubmittedTasks();
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
                <p className="mt-2 text-muted">Loading submitted tasks for review...</p>
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
                      <h4 className="mb-0">Admin Task Review</h4>
                      <p className="text-muted mb-0">Review and approve tasks submitted by team leaders</p>
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

              {/* Task List */}
              <div className="row">
                <div className="col-12">
                  <div className="card border-0 shadow-sm">
                    <div className="card-header bg-white border-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Submitted Main Tasks</h5>
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
                                <th>Task Title</th>
                                
                                <th>Submitted By</th>
                                <th>Department</th>
                                <th>Assigned Date</th>
                                <th>Submitted Date</th>
                                <th>Priority</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {tasks.map((task, index) => (
                                <tr key={task.id}>
                                  <td>
                                    {tasks.length - index}
                                  </td>
                                  <td>
                                    <h6 className="mb-0">{task.title?.substring(0, 50)}...</h6>
                                  </td>
                                                                    
                                  <td>
                                    <span className="mb-0">{task.team_leader_name || task.created_by_name || 'Unassigned'}</span>
                                  </td>
                                  <td>
                                    <span className="mb-0">{task.department_name || 'N/A'}</span>
                                  </td>
                                  <td>
                                    <span className="mb-0">{task.created_at ? new Date(task.created_at).toLocaleDateString() : 'N/A'}</span>
                                  </td>
                                  <td>
                                    <span className="badge bg-warning">{task.updated_at ? new Date(task.updated_at).toLocaleDateString() : 'N/A'}</span>
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
                                    <div className="d-flex gap-2">
                                      <Link 
                                                                        
                                        to={`/admin/task_Approvel/${task.id}`}
                                        className="btn btn-sm btn-outline-primary"
                                      >
                                        <i className="ri-eye-line me-1"></i>
                                        Review
                                      </Link>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-5">
                          <i className="ri-task-line display-4 text-muted"></i>
                          <h5 className="mt-3">No tasks submitted for review</h5>
                          <p className="text-muted">There are no main tasks currently submitted by team leaders for your review.</p>
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
    </div>
  );
};

export default AdminTaskReviewPage;