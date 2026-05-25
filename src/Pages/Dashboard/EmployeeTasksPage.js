import React, { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../Context/ConfigContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { buildApiUrl, getAuthHeaders } from '../../config/api';
import { useNavigate } from 'react-router-dom';
import Snowfall from 'react-snowfall';


const EmployeeTasksPage = () => {
  const { leadCrmUser, leadCrmHeaders, isLeadCrmAuthenticated } = useContext(ConfigContext);
  const navigate = useNavigate();
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalNotes, setModalNotes] = useState('');
  const [modalFiles, setModalFiles] = useState([]); // For attachment files
  const tasksPerPage = 10;

  // Fetch employee tasks with pagination
  const fetchTasks = async (page = 1) => {
    try {
      setLoading(true);
      const config = isLeadCrmAuthenticated ? { 
        headers: leadCrmHeaders, 
        withCredentials: true 
      } : { headers: getAuthHeaders() };
      
      // Add pagination parameters to the API call
      const response = await axios.get(
        buildApiUrl(`/tasks/my-tasks-with-subtasks?limit=${tasksPerPage}&offset=${(page - 1) * tasksPerPage}`),
        config
      );
      
      
      
      if (response.data.success && response.data.data && response.data.data.tasks) {
        const allTasks = response.data.data.tasks || [];
        
        setTasks(allTasks);
        
        // Set pagination data
        setTotalPages(response.data.data.pagination?.total_pages || 1);
        setTotalTasks(response.data.data.pagination?.total || 0);
        setCurrentPage(response.data.data.pagination?.current_page || page);
        
        if (allTasks.length === 0) {
          
          toast.info('No tasks assigned to you at the moment.');
        }
      } else {
        
        setTasks([]);
        if (response.data.message) {
          toast.error(`Failed to load tasks: ${response.data.message}`);
        } else {
          toast.info('No tasks available at the moment.');
        }
      }
    } catch (error) {
      
      setTasks([]);
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to load tasks'}`);
        
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to load tasks'}`);
      } else {
        toast.error('Network error: Failed to load tasks');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks(currentPage);
  }, [currentPage]);

  // Filter tasks based on status
  const filteredTasks = filter === 'all' 
    ? tasks 
    : tasks.filter(task => task.status === filter);

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-warning text-dark';
      case 'IN_PROGRESS': return 'bg-info';
      case 'SUBMITTED': return 'bg-primary';
      case 'COMPLETED': return 'bg-success';
      default: return 'bg-secondary';
    }
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Handle file selection for modal
  const handleModalFileChange = (e) => {
    const files = Array.from(e.target.files);
    setModalFiles(files);
  };

  // Handle task submission
  const handleSubmitTask = async () => {
    try {
      // First upload attachments if any
      if (modalFiles.length > 0) {
        const formData = new FormData();
        
        for (let i = 0; i < modalFiles.length; i++) {
          formData.append('attachment', modalFiles[i]);
        }
        
        try {
          const config = isLeadCrmAuthenticated ? { 
            headers: { ...leadCrmHeaders, 'Content-Type': 'multipart/form-data' },
            withCredentials: true 
          } : { 
            headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' }
          };
          
          await axios.post(
            buildApiUrl(`/tasks/${selectedTask.id}/attachments`),
            formData,
            config
          );
          toast.success('Attachments uploaded successfully');
        } catch (uploadError) {
          
          toast.error('Failed to upload attachments');
          return; // Don't proceed with submission if attachment upload fails
        }
      }
      
      // Then submit task status
      const config = isLeadCrmAuthenticated ? { 
        headers: leadCrmHeaders, 
        withCredentials: true 
      } : { headers: getAuthHeaders() };
      
      // Ensure completion_notes is never empty
      const completionNotes = modalNotes.trim() || 'Task completed';
      
      const payload = {
        status: 'SUBMITTED',
        completion_notes: completionNotes
      };

      const response = await axios.put(
        buildApiUrl(`/tasks/${selectedTask.id}/status`),
        payload,
        config
      );

      if (response.data.success) {
        toast.success('Task submitted to Team Leader for review');
        setShowSubmitModal(false);
        setModalNotes('');
        setModalFiles([]);
        setSelectedTask(null);
        // Refresh the task list
        fetchTasks(currentPage);
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

  // Open submit modal
  const openSubmitModal = (task) => {
    setSelectedTask(task);
    setModalNotes('');
    setModalFiles([]);
    setShowSubmitModal(true);
  };

  // Close submit modal
  const closeSubmitModal = () => {
    setShowSubmitModal(false);
    setSelectedTask(null);
    setModalNotes('');
    setModalFiles([]);
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
            color="rgb(255, 255, 255)" // Light blue/ice color
          />
          <div className="row">
            <div className="col-12">
              {/* Header */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h4 className="mb-0">My Tasks</h4>
                      <p className="text-muted mb-0">View and manage tasks assigned to you</p>
                    </div>
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-outline-secondary rounded-pill"
                        onClick={() => navigate(-1)}
                      >
                        <i className="ri-arrow-left-line me-2"></i>
                        Back
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter Section */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body">
                      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                        <h5 className="card-title mb-0">Task Filter</h5>
                        <div className="d-flex flex-wrap gap-2">
                          <select 
                            className="form-select rounded-pill"
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
                            className="btn btn-outline-primary rounded-pill"
                            onClick={() => fetchTasks(currentPage)}
                          >
                            <i className="ri-refresh-line me-1"></i>
                            Refresh
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
                  <div className="card border-0 shadow-sm">
                    <div className="card-header bg-white border-0 pb-0">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <h5 className="mb-0">Tasks Overview</h5>
                          <p className="text-muted small mb-0">
                            {totalTasks} total tasks • {filteredTasks.length} filtered
                          </p>
                        </div>
                        <span className="badge bg-primary rounded-pill">{filteredTasks.length}</span>
                      </div>
                    </div>
                    <div className="card-body">
                      {filteredTasks.length > 0 ? (
                        <>
                          <div className="table-responsive">
                            <table className="table table-centered table-nowrap mb-0">
                              <thead className="table-light">
                                <tr>
                                  <th className="border-0">Task Title</th>
                                  <th className="border-0">Priority</th>
                                  <th className="border-0">Due Date</th>
                                  <th className="border-0">Assigned Date</th>
                                  <th className="border-0">Assigned By</th>
                                  <th className="border-0">Status</th>
                                  <th className="border-0 text-end">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredTasks.map(task => (
                                  <tr key={task.id} className="align-middle">
                                    <td>
                                      <h6 className="mb-0">
                                        {/* Show only subtask name if it's a subtask */}
                                        {task.is_subtask || task.parent_task_id ? (
                                          task.title.split(' - ').pop()
                                        ) : (
                                          task.title?.substring(0, 60) || 'No title'
                                        )}
                                        {(task.is_subtask || task.parent_task_id) && (
                                          <span className="badge bg-light text-dark ms-2 rounded-pill">Subtask</span>
                                        )}
                                      </h6>
                                    </td>
                                    <td>
                                      <span className={`badge rounded-pill ${
                                        task.priority === 'URGENT' ? 'bg-danger' :
                                        task.priority === 'HIGH' ? 'bg-warning text-dark' : 
                                        task.priority === 'MEDIUM' ? 'bg-info' : 'bg-secondary'
                                      }`}>
                                        {task.priority}
                                      </span>
                                    </td>
                                    <td>
                                      <span className={`${new Date(task.due_date) < new Date() && task.status !== 'COMPLETED' ? 'text-danger' : 'text-muted'}`}>
                                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                                      </span>
                                    </td>
                                    <td>
                                      <span className="text-muted">
                                        {task.assigned_date ? new Date(task.assigned_date).toLocaleDateString() : 'N/A'}
                                      </span>
                                    </td>
                                    <td>
                                      <span className="text-muted">
                                        {task.assigned_by_name || task.created_by_name || 'Unknown'}
                                      </span>
                                    </td>
                                    <td>
                                      <span className={`badge rounded-pill ${getStatusBadgeClass(task.status)}`}>
                                        {task.status.replace('_', ' ')}
                                      </span>
                                    </td>
                                    <td className="text-end">
                                      <div className="d-flex justify-content-end gap-1">
                                        <button 
                                          className="btn btn-sm btn-outline-primary rounded-pill"
                                          onClick={() => navigate(`/employee/task/${task.id}`)}
                                        >
                                          <i className="ri-eye-line me-1"></i>
                                          View
                                        </button>
                                       
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          
                          {/* Pagination */}
                          <div className="row mt-4">
                            <div className="col-12">
                              <nav aria-label="Tasks pagination">
                                <ul className="pagination justify-content-center mb-0">
                                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                    <button 
                                      className="page-link " 
                                      onClick={() => handlePageChange(currentPage - 1)}
                                      disabled={currentPage === 1}
                                    >
                                      Previous
                                    </button>
                                  </li>
                                  
                                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                                      <button 
                                        className="page-link" 
                                        onClick={() => handlePageChange(page)}
                                      >
                                        {page}
                                      </button>
                                    </li>
                                  ))}
                                  
                                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                    <button 
                                      className="page-link " 
                                      onClick={() => handlePageChange(currentPage + 1)}
                                      disabled={currentPage === totalPages}
                                    >
                                      Next
                                    </button>
                                  </li>
                                </ul>
                              </nav>
                              <div className="text-center mt-3">
                                <small className="text-muted">
                                  Showing {Math.min((currentPage - 1) * tasksPerPage + 1, totalTasks)} to {Math.min(currentPage * tasksPerPage, totalTasks)} of {totalTasks} tasks
                                </small>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-5">
                          <div className="avatar-lg bg-light rounded-circle mx-auto mb-3">
                            <i className="ri-task-line ri-2x text-muted"></i>
                          </div>
                          <h5 className="text-muted">No tasks found</h5>
                          <p className="text-muted mb-0">
                            {filter === 'all' 
                              ? 'You have no assigned tasks at the moment.' 
                              : `You have no tasks with status "${filter}"`}
                          </p>
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
      
      {/* Submit Task Modal */}
      {showSubmitModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-0">
                <h5 className="modal-title">Submit Task to Team Leader</h5>
                <button type="button" className="btn-close" onClick={closeSubmitModal}></button>
              </div>
              <div className="modal-body">
                {selectedTask && (
                  <div className="card border-0 shadow-sm mb-4">
                    <div className="card-header bg-white border-0">
                      <h6 className="mb-0">Task Information</h6>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-6">
                          <p className="mb-2"><strong>Title:</strong> {selectedTask.title}</p>
                          <p className="mb-2"><strong>Priority:</strong> 
                            <span className={`badge rounded-pill ms-2 ${
                              selectedTask.priority === 'URGENT' ? 'bg-danger' :
                              selectedTask.priority === 'HIGH' ? 'bg-warning text-dark' : 
                              selectedTask.priority === 'MEDIUM' ? 'bg-info' : 'bg-secondary'
                            }`}>
                              {selectedTask.priority}
                            </span>
                          </p>
                        </div>
                        <div className="col-md-6">
                          <p className="mb-2"><strong>Due Date:</strong> {selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleDateString() : 'No due date'}</p>
                          <p className="mb-2"><strong>Status:</strong> 
                            <span className={`badge rounded-pill ms-2 ${getStatusBadgeClass(selectedTask.status)}`}>
                              {selectedTask.status.replace('_', ' ')}
                            </span>
                          </p>
                        </div>
                      </div>
                      <p className="mb-0"><strong>Description:</strong> {selectedTask.description}</p>
                    </div>
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label fw-medium">Notes to Team Leader</label>
                  <textarea
                    className="form-control rounded-3"
                    rows="4"
                    placeholder="Add notes about the task completion..."
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                  ></textarea>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-medium">Attachments (Optional)</label>
                  <input
                    type="file"
                    className="form-control rounded-3"
                    onChange={handleModalFileChange}
                    multiple
                  />
                  {modalFiles.length > 0 && (
                    <div className="mt-2">
                      <small className="text-muted">
                        Selected files: {modalFiles.map(f => f.name).join(', ')}
                      </small>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer border-0">
                <button type="button" className="btn btn-outline-secondary rounded-pill" onClick={closeSubmitModal}>
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline-success rounded-pill"
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

export default EmployeeTasksPage;