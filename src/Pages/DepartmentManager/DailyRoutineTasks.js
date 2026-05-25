import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import PageTitle from '../../Components/PageTitle';
import { buildLeadCrmUrl, getLeadCrmAuthHeaders, buildApiUrl, getAuthHeaders } from '../../config/api';

const DailyRoutineTasks = () => {
  const { departmentId: urlDepartmentId } = useParams();
  const navigate = useNavigate();
  
  // State variables
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [departmentEmployees, setDepartmentEmployees] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    assignedEmployees: [],
    scheduleTime: '',
    isActive: true
  });
  const [departmentId, setDepartmentId] = useState(urlDepartmentId);

  // API configuration
  const leadCrmApiURL = buildLeadCrmUrl('');
  const leadCrmHeaders = getLeadCrmAuthHeaders();

  // Fetch department ID if not provided in URL
  useEffect(() => {
    if (!urlDepartmentId) {
      const fetchDepartmentId = async () => {
        try {
          const response = await fetch(buildApiUrl('/departments'), {
            credentials: 'include',
            headers: getAuthHeaders()
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              // Find the department where user is manager
              const department = data.data.find(dept => dept.manager_id);
              if (department) {
                setDepartmentId(department.id);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching department ID:', error);
        }
      };
      
      fetchDepartmentId();
    } else {
      setDepartmentId(urlDepartmentId);
    }
  }, [urlDepartmentId]);

  // Fetch daily routine tasks for the department
  const fetchDailyRoutineTasks = useCallback(async () => {
    if (!departmentId) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `${leadCrmApiURL}/departments/${departmentId}/daily-routine-tasks`,
        {
          method: 'GET',
          headers: leadCrmHeaders,
          credentials: 'include'
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setTasks(data.data);
      } else {
        Swal.fire('Error', data.message || 'Failed to fetch daily routine tasks', 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Network error while fetching daily routine tasks: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [departmentId, leadCrmApiURL, leadCrmHeaders]);

  // Fetch department employees
  const fetchDepartmentEmployees = useCallback(async () => {
    if (!departmentId) return;
    
    try {
      const response = await fetch(
        `${leadCrmApiURL}/departments/${departmentId}/manager/employees`,
        {
          method: 'GET',
          headers: leadCrmHeaders,
          credentials: 'include'
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setDepartmentEmployees(data.data);
      } else {
        Swal.fire('Error', data.message || 'Failed to fetch department employees', 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Network error while fetching department employees: ' + error.message, 'error');
    }
  }, [departmentId, leadCrmApiURL, leadCrmHeaders]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox' && name === 'assignedEmployees') {
      const employeeId = parseInt(value);
      setFormData(prev => {
        const assigned = prev.assignedEmployees.includes(employeeId)
          ? prev.assignedEmployees.filter(id => id !== employeeId)
          : [...prev.assignedEmployees, employeeId];
        return { ...prev, assignedEmployees: assigned };
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!departmentId) {
      Swal.fire('Error', 'Department ID not found', 'error');
      return;
    }
    
    try {
      // Map frontend field names to backend field names
      const backendData = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        assigned_employees: formData.assignedEmployees,
        schedule_time: formData.scheduleTime,
        is_active: formData.isActive
      };
      
      const url = isEditing 
        ? `${leadCrmApiURL}/departments/${departmentId}/daily-routine-tasks/${selectedTask.id}`
        : `${leadCrmApiURL}/departments/${departmentId}/daily-routine-tasks`;
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          ...leadCrmHeaders,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(backendData)
      });

      const data = await response.json();
      
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: isEditing ? 'Task Updated!' : 'Task Created!',
          text: data.message || (isEditing ? 'Daily routine task updated successfully' : 'Daily routine task created successfully')
        });
        
        toggleModal();
        fetchDailyRoutineTasks();
      } else {
        Swal.fire('Error', data.message || (isEditing ? 'Failed to update task' : 'Failed to create task'), 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Network error: ' + error.message, 'error');
    }
  };

  // Toggle modal
  const toggleModal = () => {
    setShowModal(!showModal);
    if (!showModal) {
      // Reset form when opening
      setFormData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        assignedEmployees: [],
        scheduleTime: '',
        isActive: true
      });
      setIsEditing(false);
      setSelectedTask(null);
    }
  };

  // Edit task
  const editTask = (task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      priority: task.priority,
      assignedEmployees: (task.assigned_employees || []).map((id) => Number(id)),
      scheduleTime: task.schedule_time || '',
      isActive: task.is_active === 1 || task.is_active === true
    });
    setIsEditing(true);
    setShowModal(true);
  };

  // Toggle task active/inactive status
  const toggleTaskStatus = async (task) => {
    if (!departmentId) {
      Swal.fire('Error', 'Department ID not found', 'error');
      return;
    }
    
    const newStatus = !task.is_active;
    const statusText = newStatus ? 'activate' : 'deactivate';
    
    const result = await Swal.fire({
      title: `Are you sure?`,
      text: `Do you want to ${statusText} this task?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6c757d',
      confirmButtonText: `Yes, ${statusText} it!`,
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(
          `${leadCrmApiURL}/departments/${departmentId}/daily-routine-tasks/${task.id}`,
          {
            method: 'PUT',
            headers: {
              ...leadCrmHeaders,
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
              is_active: newStatus
            })
          }
        );

        const data = await response.json();
        
        if (data.success) {
          Swal.fire('Success!', `Task has been ${statusText}d.`, 'success');
          fetchDailyRoutineTasks();
        } else {
          Swal.fire('Error', data.message || `Failed to ${statusText} task`, 'error');
        }
      } catch (error) {
        Swal.fire('Error', 'Network error: ' + error.message, 'error');
      }
    }
  };

  // Delete task
  const deleteTask = async (taskId) => {
    if (!departmentId) {
      Swal.fire('Error', 'Department ID not found', 'error');
      return;
    }
    
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(
          `${leadCrmApiURL}/departments/${departmentId}/daily-routine-tasks/${taskId}`,
          {
            method: 'DELETE',
            headers: leadCrmHeaders,
            credentials: 'include'
          }
        );

        const data = await response.json();
        
        if (data.success) {
          Swal.fire('Deleted!', 'Daily routine task has been deleted.', 'success');
          fetchDailyRoutineTasks();
        } else {
          Swal.fire('Error', data.message || 'Failed to delete task', 'error');
        }
      } catch (error) {
        Swal.fire('Error', 'Network error: ' + error.message, 'error');
      }
    }
  };

  // Format time for display
  const formatTime = (time) => {
    if (!time) return 'Not scheduled';
    return time.substring(0, 5); // Extract HH:MM
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Get priority badge color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return 'danger';
      case 'URGENT': return 'danger';
      case 'LOW': return 'secondary';
      default: return 'primary';
    }
  };

  // Get status badge
  const getStatusBadge = (isActive) => {
    return isActive ? 
      <span className="badge bg-success">Active</span> : 
      <span className="badge bg-secondary">Inactive</span>;
  };

  // Get employee names from IDs
  const getEmployeeNames = (employeeIds) => {
    if (!employeeIds || employeeIds.length === 0) return 'No employees assigned';
    
    const names = employeeIds.map(id => {
      const employee = departmentEmployees.find(emp => Number(emp.user_id) === id);
      return employee ? employee.name : `Unknown (${id})`;
    });
    
    return names.join(', ');
  };

  // Fetch data on component mount - only once
  useEffect(() => {
    if (departmentId) {
      fetchDailyRoutineTasks();
      fetchDepartmentEmployees();
    }
  }, [departmentId]);

  // Show loading state while fetching department ID
  if (!departmentId) {
    return (
      <div className="main-content">
        <div className="page-content">
          <div className="container-fluid">
            <PageTitle 
              title="Daily Routine Tasks" 
              primary="Department Management" 
            />
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
              <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading department information...</p>
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
          <PageTitle 
            title="Daily Routine Tasks" 
            primary="Department Management" 
          />
          
          <div className="row">
            <div className="col-lg-12">
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Daily Routine Tasks ({tasks.length})</h5>
                  <button className="btn btn-outline-primary" onClick={toggleModal}>
                    <i className="ri-add-line align-bottom me-1"></i>
                    Create New Task
                  </button>
                </div>
                <div className="card-body">
                  {loading ? (
                    <div className="d-flex justify-content-center">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-striped table-nowrap align-middle mb-0">
                        <thead>
                          <tr>
                            <th scope="col">Title</th>
                            <th scope="col">Priority</th>
                            <th scope="col">Schedule Time</th>
                            <th scope="col">Assigned To</th>
                            <th scope="col">Status</th>
                            <th scope="col">Created</th>
                            <th scope="col">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tasks && tasks.length > 0 ? (
                            tasks.map((task) => (
                              <tr key={task.id}>
                                <td>
                                  <h6 className="fs-14 mb-1">{task.title?.substring(0,50)}</h6>
                                  <p className="text-muted mb-0">{task.description?.substring(0,26)}</p>
                                </td>
                                <td>
                                  <span className={`badge bg-${getPriorityColor(task.priority)}`}>
                                    {task.priority}
                                  </span>
                                </td>
                                <td>{formatTime(task.schedule_time)}</td>
                                <td>
                                  <div className="text-truncate" style={{ maxWidth: '200px' }}>
                                    {getEmployeeNames(task.assigned_employees)}
                                  </div>
                                </td>
                                <td>{getStatusBadge(task.is_active)}</td>
                                <td>{formatDate(task.created_at)}</td>
                                <td>
                                  <div className="d-flex gap-2">
                                    <button 
                                      className={`btn btn-sm ${task.is_active ? 'btn-warning' : 'btn-success'}`}
                                      onClick={() => toggleTaskStatus(task)}
                                      title={task.is_active ? 'Deactivate Task' : 'Activate Task'}
                                    >
                                      <i className={task.is_active ? 'ri-pause-circle-line' : 'ri-play-circle-line'}></i>
                                    </button>
                                    <button 
                                      className="btn btn-info btn-sm" 
                                      onClick={() => editTask(task)}
                                      title="Edit Task"
                                    >
                                      <i className="ri-pencil-line"></i>
                                    </button>
                                    <button 
                                      className="btn btn-danger btn-sm" 
                                      onClick={() => deleteTask(task.id)}
                                      title="Delete Task"
                                    >
                                      <i className="ri-delete-bin-line"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="7" className="text-center">
                                No daily routine tasks found. Create your first task!
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Create/Edit Task Modal */}
      {showModal && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {isEditing ? 'Edit Daily Routine Task' : 'Create Daily Routine Task'}
                </h5>
                <button type="button" className="btn-close" onClick={toggleModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">Task Title</label>
                    <input
                      type="text"
                      className="form-control"
                      name="title"
                      id="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      name="description"
                      id="description"
                      rows="3"
                      value={formData.description}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="priority" className="form-label">Priority</label>
                        <select
                          className="form-select"
                          name="priority"
                          id="priority"
                          value={formData.priority}
                          onChange={handleInputChange}
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="URGENT">Urgent</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="scheduleTime" className="form-label">Schedule Time (Optional)</label>
                        <input
                          type="time"
                          className="form-control"
                          name="scheduleTime"
                          id="scheduleTime"
                          value={formData.scheduleTime}
                          onChange={handleInputChange}
                        />
                        <small className="text-muted">Time of day to automatically assign this task</small>
                      </div>
                    </div>
                  </div>
                  
                  {/* <div className="mb-3">
                    <label className="form-label">Status</label>
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        name="isActive"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label" htmlFor="isActive">
                        Active
                      </label>
                    </div>
                  </div> */}
                  
                  <div className="mb-3">
                    <label className="form-label">Assign to Employees</label>
                    <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {departmentEmployees && departmentEmployees.length > 0 ? (
                        departmentEmployees.map((employee) => (
                          <div key={employee.user_id} className="form-check mb-2">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              name="assignedEmployees"
                              id={`employee-${employee.user_id}`}
                              value={employee.user_id}
                              checked={formData.assignedEmployees.includes(Number(employee.user_id))}
                              onChange={handleInputChange}
                            />
                            <label className="form-check-label ms-2" htmlFor={`employee-${employee.user_id}`}>
                              {employee.name} 
                              
                            </label>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted">No employees found in this department</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-danger" onClick={toggleModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-outline-primary">
                    {isEditing ? 'Update Task' : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {showModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};

export default DailyRoutineTasks;