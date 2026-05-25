import React, { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../Context/ConfigContext';
import { toast } from 'react-toastify';
import { useParams, useNavigate } from 'react-router-dom';

const TaskFileDetails = () => {
  const { leadCrmApiURL, leadCrmUser } = useContext(ConfigContext);
  const { fileId } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [assignmentData, setAssignmentData] = useState({
    title: '',
    description: '',
    taskType: 'MAIN_TASK',
    priority: 'MEDIUM',
    dueDate: '',
    assignedTo: '',
    attachment: null
  });
  const [createTaskData, setCreateTaskData] = useState({
    title: '',
    description: '',
    row_index: ''
  });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage] = useState(50);

  // Check if user is department manager or team leader
  const isDepartmentManager = leadCrmUser?.role === 'DEPARTMENT_MANAGER' || leadCrmUser?.role === 'TL';

  useEffect(() => {
    if (isDepartmentManager && fileId) {
      fetchFileDetails();
    }
  }, [isDepartmentManager, fileId]);

  useEffect(() => {
    if (file && file.department_id) {
      fetchDepartmentEmployees();
    }
  }, [file]);

  const fetchFileDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${leadCrmApiURL}/department-manager/task-files/${fileId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setFile(data.data.file);
        setTasks(data.data.tasks || []);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to fetch file details');
      }
    } catch (error) {
      console.error('Error fetching file details:', error);
      toast.error('Error fetching file details');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentEmployees = async () => {
    try {
      // Use the department ID from the file to fetch employees
      if (file && file.department_id) {
        const response = await fetch(`${leadCrmApiURL}/departments/${file.department_id}/manager/employees`, {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setEmployees(data.data || []);
        } else {
          toast.error('Failed to fetch department employees');
        }
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Error fetching employees');
    }
  };

  const handleAssignTask = async (taskData) => {
    setAssigning(true);
    try {
      // Ensure assignedTo is converted to a number if it's a string
      const assignedToId = taskData.assignedTo ? Number(taskData.assignedTo) : null;
      
      if (!assignedToId || isNaN(assignedToId)) {
        toast.error('Please select a valid employee');
        setAssigning(false);
        return;
      }
      
      // Prepare the data object with proper type conversion
      const requestData = {
        title: taskData.title,
        description: taskData.description,
        taskType: taskData.taskType,
        priority: taskData.priority,
        dueDate: taskData.dueDate,
        assignedTo: assignedToId
      };

      // If there's an attachment, we need to send it separately
      let response;
      if (taskData.attachment) {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('title', taskData.title);
        formData.append('description', taskData.description);
        formData.append('taskType', taskData.taskType);
        formData.append('priority', taskData.priority);
        formData.append('dueDate', taskData.dueDate);
        formData.append('assignedTo', assignedToId.toString());
        formData.append('attachment', taskData.attachment);

        response = await fetch(`${leadCrmApiURL}/department-manager/task-files/${fileId}/tasks/${selectedTask.id}/assign`, {
          method: 'POST',
          credentials: 'include',
          body: formData
        });
      } else {
        // Send as JSON for requests without files
        response = await fetch(`${leadCrmApiURL}/department-manager/task-files/${fileId}/tasks/${selectedTask.id}/assign`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        });
      }

      if (response.ok) {
        const data = await response.json();
        toast.success('Task assigned successfully');
        setShowAssignModal(false);
        resetAssignmentForm();
        fetchFileDetails(); // Refresh the task list
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to assign task');
      }
    } catch (error) {
      toast.error('Error assigning task');
    } finally {
      setAssigning(false);
    }
  };

  const openAssignModal = (task) => {
    setSelectedTask(task);
    // Pre-fill description with task data if available
    setAssignmentData({
      title: task.title || '',
      description: task.description || `Task from row ${task.row_index} in ${file?.filename}`,
      taskType: 'MAIN_TASK', // Default to MAIN_TASK
      priority: 'MEDIUM',
      dueDate: '',
      assignedTo: '',
      attachment: null
    });
    setShowAssignModal(true);
  };

  const resetAssignmentForm = () => {
    setAssignmentData({
      title: '',
      description: '',
      taskType: 'MAIN_TASK',
      priority: 'MEDIUM',
      dueDate: '',
      assignedTo: '',
      attachment: null
    });
    setSelectedTask(null);
  };

  const handleAssignmentSubmit = (e) => {
    e.preventDefault();
    if (!assignmentData.title || !assignmentData.description || !assignmentData.assignedTo || 
        !assignmentData.taskType || !assignmentData.priority || !assignmentData.dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    handleAssignTask(assignmentData);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const handleCreateTask = async (taskData) => {
    setCreating(true);
    try {
      const response = await fetch(`${leadCrmApiURL}/department-manager/task-files/${fileId}/tasks`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: taskData.title,
          description: taskData.description,
          row_index: taskData.row_index || 0
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Task created successfully');
        setShowCreateModal(false);
        resetCreateTaskForm();
        // Add the new task to the tasks list
        setTasks(prevTasks => [...prevTasks, data.data.task]);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Error creating task');
    } finally {
      setCreating(false);
    }
  };

  const resetCreateTaskForm = () => {
    setCreateTaskData({
      title: '',
      description: '',
      row_index: ''
    });
  };

  const handleCreateTaskSubmit = (e) => {
    e.preventDefault();
    if (!createTaskData.title || !createTaskData.description) {
      toast.error('Please fill in all required fields');
      return;
    }
      
    handleCreateTask(createTaskData);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    setDeleting(taskId);
    try {
      const response = await fetch(`${leadCrmApiURL}/department-manager/task-files/${fileId}/tasks/${taskId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Task deleted successfully');
        // Instead of refreshing all data, just remove the deleted task from state
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Error deleting task');
    } finally {
      setDeleting(null);
    }
  };
  
  // Get current tasks for pagination
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = tasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(tasks.length / tasksPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (!isDepartmentManager) {
    return (
      <div className="main-content">
        <div className="page-content">
          <div className="container-fluid">
            <div className="row">
              <div className="col-12">
                <div className="card">
                  <div className="card-body">
                    <div className="alert alert-danger">
                      <h4>Access Denied</h4>
                      <p>This page is only accessible to department managers and team leaders.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="main-content">
        <div className="page-content">
          <div className="container-fluid">
            <div className="row">
              <div className="col-12">
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading file details...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="main-content">
        <div className="page-content">
          <div className="container-fluid">
            <div className="row">
              <div className="col-12">
                <div className="card">
                  <div className="card-body">
                    <div className="alert alert-warning">
                      <h4>File Not Found</h4>
                      <p>The requested file could not be found.</p>
                      <button className="btn btn-primary" onClick={() => navigate('/department-manager/task-files')}>
                        <i className="ri-arrow-left-line me-1"></i>
                        Back to Task Files
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
  }

  return (
    <div className="main-content">
      <div className="page-content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                <h4 className="mb-sm-0">Task File Details</h4>
                <div className="page-title-right">
                  <ol className="breadcrumb m-0">
                    <li className="breadcrumb-item">Department Manager</li>
                    <li className="breadcrumb-item">Task Files</li>
                    <li className="breadcrumb-item active">Details</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-4">
                    <div>
                      <h5 className="card-title mb-1">{file.filename}</h5>
                      <p className="text-muted mb-0">Task File Details</p>
                    </div>
                    <button 
                      className="btn btn-outline-secondary"
                      onClick={() => navigate('/department-manager/task-files')}
                    >
                      <i className="ri-arrow-left-line me-1"></i>
                      Back to Files
                    </button>
                  </div>

                  <div className="row">
                    <div className="col-lg-6">
                      <div className="card border">
                        <div className="card-header bg-light">
                          <h6 className="mb-0">File Information</h6>
                        </div>
                        <div className="card-body">
                          <table className="table table-borderless mb-0">
                            <tbody>
                              <tr>
                                <td className="fw-medium">File ID</td>
                                <td>{file.id}</td>
                              </tr>
                              <tr>
                                <td className="fw-medium">Total Rows</td>
                                <td>{file.total_rows || 'N/A'}</td>
                              </tr>
                              <tr>
                                <td className="fw-medium">Total Tasks</td>
                                <td>{tasks.length}</td>
                              </tr>
                              <tr>
                                <td className="fw-medium">Assigned By</td>
                                <td>{file.assigned_by_name || 'N/A'}</td>
                              </tr>
                              <tr>
                                <td className="fw-medium">Assigned At</td>
                                <td>{formatDateTime(file.assigned_at)}</td>
                              </tr>
                              <tr>
                                <td className="fw-medium">Status</td>
                                <td>
                                  <span className={`badge ${
                                    file.status === 'ASSIGNED' ? 'bg-primary' : 
                                    file.status === 'PROCESSING' ? 'bg-warning' : 
                                    file.status === 'COMPLETED' ? 'bg-success' : 
                                    'bg-secondary'
                                  }`}>
                                    {file.status}
                                  </span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <div className="col-lg-6">
                      <div className="card border">
                        <div className="card-header bg-light d-flex justify-content-between align-items-center">
                          <h6 className="mb-0">Assignment Progress</h6>
                          <button 
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => setShowCreateModal(true)}
                          >
                            <i className="ri-add-line me-1"></i>
                            Add Task
                          </button>
                        </div>
                        <div className="card-body">
                          <div className="d-flex align-items-center mb-3">
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between">
                                <span>Assigned Tasks</span>
                                <span>{tasks.filter(t => t.status === 'ASSIGNED').length} of {tasks.length}</span>
                              </div>
                              <div className="progress">
                                <div 
                                  className="progress-bar" 
                                  role="progressbar" 
                                  style={{ width: `${tasks.length ? (tasks.filter(t => t.status === 'ASSIGNED').length / tasks.length) * 100 : 0}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                          <div className="row">
                            <div className="col-6">
                              <div className="text-center p-2 bg-light rounded">
                                <h5 className="mb-0">{tasks.filter(t => t.status === 'PENDING').length}</h5>
                                <small className="text-muted">Pending</small>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="text-center p-2 bg-light rounded">
                                <h5 className="mb-0">{tasks.filter(t => t.status === 'ASSIGNED').length}</h5>
                                <small className="text-muted">Assigned</small>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="row mt-4">
                    <div className="col-12">
                      <div className="card border">
                        <div className="card-header bg-light d-flex justify-content-between align-items-center">
                          <h6 className="mb-0">Tasks in File</h6>
                          <span className="badge bg-primary">{tasks.length} Tasks</span>
                        </div>
                        <div className="card-body">
                          {tasks.length > 0 ? (
                            <>
                              <div className="table-responsive">
                                <table className="table table-striped table-hover">
                                  <thead>
                                    <tr>
                                      <th>Row #</th>
                                      <th>Title</th>
                                     
                                      <th>Status</th>
                                      <th>Assigned To</th>
                                      <th>Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {currentTasks.map((task) => (
                                      <tr key={task.id}>
                                        <td>{task.row_index}</td>
                                        <td>
                                          <div className="text" style={{ maxWidth: '450px' }}>
                                            {task.title || 'N/A'}
                                          </div>
                                        </td>
                                        
                                        <td>
                                          <span className={`badge ${
                                            task.status === 'ASSIGNED' ? 'bg-primary' : 
                                            task.status === 'PENDING' ? 'bg-warning' : 
                                            task.status === 'IN_PROGRESS' ? 'bg-info' : 
                                            task.status === 'COMPLETED' ? 'bg-success' : 
                                            'bg-secondary'
                                          }`}>
                                            {task.status}
                                          </span>
                                        </td>
                                        <td>
                                          {task.assigned_to_name ? (
                                            <>
                                              {task.assigned_to_name}
                                            </>
                                          ) : (
                                            <span className="text-muted">Not assigned</span>
                                          )}
                                        </td>
                                        <td>
                                          {task.status === 'PENDING' ? (
                                            <button 
                                              className="btn btn-sm btn-outline-primary me-1"
                                              onClick={() => openAssignModal(task)}
                                            >
                                              <i className="ri-user-shared-line me-1"></i>
                                              Assign
                                            </button>
                                          ) : (
                                            <button 
                                              className="btn btn-sm btn-outline-secondary me-1"
                                              disabled
                                            >
                                              Assigned
                                            </button>
                                          )}
                                          <button 
                                            className="btn btn-sm btn-outline-danger"
                                            disabled={deleting === task.id}
                                            onClick={() => handleDeleteTask(task.id)}
                                          >
                                            {deleting === task.id ? (
                                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                            ) : (
                                              <i className="ri-delete-bin-line"></i>
                                            )}
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              
                              {/* Pagination */}
                              {totalPages > 1 && (
                                <div className="d-flex justify-content-center mt-4">
                                  <nav aria-label="Page navigation">
                                    <ul className="pagination">
                                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => paginate(currentPage - 1)}>
                                          Previous
                                        </button>
                                      </li>
                                      
                                      {[...Array(totalPages)].map((_, index) => {
                                        const pageNumber = index + 1;
                                        // Show first, last, current, and nearby pages
                                        if (
                                          pageNumber === 1 ||
                                          pageNumber === totalPages ||
                                          (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)
                                        ) {
                                          return (
                                            <li key={pageNumber} className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}>
                                              <button className="page-link" onClick={() => paginate(pageNumber)}>
                                                {pageNumber}
                                              </button>
                                            </li>
                                          );
                                        } else if (
                                          pageNumber === currentPage - 3 ||
                                          pageNumber === currentPage + 3
                                        ) {
                                          return (
                                            <li key={pageNumber} className="page-item disabled">
                                              <span className="page-link">...</span>
                                            </li>
                                          );
                                        }
                                        return null;
                                      })}
                                      
                                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => paginate(currentPage + 1)}>
                                          Next
                                        </button>
                                      </li>
                                    </ul>
                                  </nav>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-center py-4">
                              <p className="mb-0">No tasks found in this file</p>
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
      </div>

      {/* Assign Task Modal */}
      {showAssignModal && selectedTask && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Assign Task - {selectedTask.title || `Row ${selectedTask.row_index}`}</h5>
                <button type="button" className="btn-close" onClick={() => {
                  setShowAssignModal(false);
                  resetAssignmentForm();
                }}></button>
              </div>
              <form onSubmit={handleAssignmentSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Task Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={assignmentData.title || selectedTask.title || ''}
                      onChange={(e) => setAssignmentData({...assignmentData, title: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Task Description *</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={assignmentData.description || selectedTask.description || `Task from row ${selectedTask.row_index} in ${file?.filename}`}
                      onChange={(e) => setAssignmentData({...assignmentData, description: e.target.value})}
                      required
                    ></textarea>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Task Type</label>
                        <select
                          className="form-select"
                          value={assignmentData.taskType}
                          onChange={(e) => setAssignmentData({...assignmentData, taskType: e.target.value})}
                        >
                          <option value="MAIN_TASK">Main Task</option>
                          <option value="SUB_TASK">Sub Task</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Priority</label>
                        <select
                          className="form-select"
                          value={assignmentData.priority}
                          onChange={(e) => setAssignmentData({...assignmentData, priority: e.target.value})}
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="URGENT">Urgent</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Due Date *</label>
                        <input
                          type="date"
                          className="form-control"
                          value={assignmentData.dueDate}
                          onChange={(e) => setAssignmentData({...assignmentData, dueDate: e.target.value})}
                          min={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Assign To *</label>
                        <select
                          className="form-select"
                          value={assignmentData.assignedTo || ''}
                          onChange={(e) => {
                            const selectedValue = e.target.value;
                            setAssignmentData({...assignmentData, assignedTo: selectedValue});
                          }}
                          required
                        >
                          <option value="">Select an employee</option>
                          {employees.map((employee) => {
                            // Use user_id if available, otherwise fall back to id (for manager case)
                            const employeeUserId = employee.user_id || employee.id;
                            return (
                              <option key={employeeUserId} value={String(employeeUserId)}>
                                {employee.name} 
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary" 
                    onClick={() => {
                      setShowAssignModal(false);
                      resetAssignmentForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-outline-primary"
                    disabled={assigning}
                  >
                    {assigning ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        Assigning...
                      </>
                    ) : (
                      'Assign Task'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Task</h5>
                <button type="button" className="btn-close" onClick={() => {
                  setShowCreateModal(false);
                  resetCreateTaskForm();
                }}></button>
              </div>
              <form onSubmit={handleCreateTaskSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Task Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createTaskData.title}
                      onChange={(e) => setCreateTaskData({...createTaskData, title: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Task Description *</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={createTaskData.description}
                      onChange={(e) => setCreateTaskData({...createTaskData, description: e.target.value})}
                      required
                    ></textarea>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Row Number (Optional)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={createTaskData.row_index}
                      onChange={(e) => setCreateTaskData({...createTaskData, row_index: e.target.value})}
                      min="0"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary" 
                    onClick={() => {
                      setShowCreateModal(false);
                      resetCreateTaskForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={creating}
                  >
                    {creating ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        Creating...
                      </>
                    ) : (
                      'Create Task'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskFileDetails;