import React, { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../../Context/ConfigContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { buildApiUrl, getAuthHeaders } from '../../../config/api';

const AssignTaskToTeamLeader = () => {
  const { leadCrmUser } = useContext(ConfigContext);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [departmentEmployees, setDepartmentEmployees] = useState([]); // New state for all department employees
  const [isAssigningTask, setIsAssigningTask] = useState(false);
  
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    assigned_to: '',
    attachment: null,
    task_type: 'main' // Added task type field
  });

  // State for multiple tasks
  const [tasks, setTasks] = useState([
    { 
      title: '', 
      description: '', 
      priority: 'medium', 
      due_date: '', 
      assigned_to: '', 
      attachment: null,
      task_type: 'main'
    }
  ]);

  // Fetch departments where user is manager
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(
        buildApiUrl('/departments'),
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        // Filter departments where user is manager
        const managerDepartments = response.data.data.filter(dept => 
          dept.manager_id === leadCrmUser.id
        );
        
        setDepartments(managerDepartments);
        
        // If there's only one department, select it automatically
        if (managerDepartments.length === 1) {
          setSelectedDepartment(managerDepartments[0]);
        }
      }
    } catch (error) {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  // Fetch team leaders for selected department
  const fetchTeamLeaders = async (departmentId) => {
    try {
      const response = await axios.get(
        buildApiUrl(`/departments/${departmentId}/team-leaders`),
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        setTeamLeaders(response.data.data || []);
      }
    } catch (error) {
      toast.error('Failed to load team leaders');
    }
  };

  // Fetch all employees for selected department
  const fetchDepartmentEmployees = async (departmentId) => {
    try {
      const response = await axios.get(
        buildApiUrl(`/departments/${departmentId}/employees`),
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        // Format employees data
        const employees = response.data.data.map(employee => ({
          id: employee.user_id,
          name: `${employee.name}`,
          email: employee.email,
          employee_code: employee.employee_code,
          designation: employee.designation,
          role: employee.role
        }));
        
        // Add department manager to the list
        const deptManager = {
          id: leadCrmUser.id,
          name: `${leadCrmUser.name} (Department Manager)`,
          email: leadCrmUser.email,
          employee_code: 'DM',
          designation: 'Department Manager',
          role: 'TL'
        };
        
        setDepartmentEmployees([deptManager, ...employees]);
      }
    } catch (error) {
      toast.error('Failed to load department employees');
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      fetchTeamLeaders(selectedDepartment.id);
      fetchDepartmentEmployees(selectedDepartment.id);
    }
  }, [selectedDepartment]);

  const handleDepartmentChange = (e) => {
    const deptId = e.target.value;
    const department = departments.find(d => d.id == deptId);
    setSelectedDepartment(department);
    setTeamLeaders([]); // Clear team leaders when department changes
  };

  const handleFormChange = (index, field, value) => {
    const newTasks = [...tasks];
    newTasks[index][field] = value;
    setTasks(newTasks);
  };

  const handleFileChange = (index, e) => {
    const newTasks = [...tasks];
    newTasks[index].attachment = e.target.files[0];
    setTasks(newTasks);
  };

  // Add a new task form
  const addTask = () => {
    setTasks([
      ...tasks,
      { 
        title: '', 
        description: '', 
        priority: 'medium', 
        due_date: '', 
        assigned_to: '', 
        attachment: null,
        task_type: 'main'
      }
    ]);
  };

  // Remove a task form
  const removeTask = (index) => {
    if (tasks.length > 1) {
      const newTasks = [...tasks];
      newTasks.splice(index, 1);
      setTasks(newTasks);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all tasks
    const invalidTasks = tasks.filter(task => 
      !task.title || !task.assigned_to
    );
    
    if (invalidTasks.length > 0) {
      toast.error('Please fill in all required fields for all tasks');
      return;
    }

    setIsAssigningTask(true);

    try {
      // Submit all tasks
      for (const task of tasks) {
        const formData = new FormData();
        formData.append('title', task.title);
        formData.append('description', task.description || '');
        formData.append('priority', task.priority);
        formData.append('due_date', task.due_date || '');
        formData.append('assigned_to', task.assigned_to);
        formData.append('task_type', task.task_type); // Add task type to form data
        
        if (task.attachment) {
          formData.append('attachment', task.attachment);
        }

        const response = await axios.post(
          buildApiUrl(`/departments/${selectedDepartment.id}/tasks/assign`),
          formData,
          { 
            headers: {
              ...getAuthHeaders(),
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to assign task');
        }
      }

      toast.success(`${tasks.length} task(s) assigned successfully`);
      // Reset form
      setTasks([
        { 
          title: '', 
          description: '', 
          priority: 'medium', 
          due_date: '', 
          assigned_to: '', 
          attachment: null,
          task_type: 'main'
        }
      ]);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to assign tasks';
      toast.error(errorMessage);
    } finally {
      setIsAssigningTask(false);
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
                <p className="mt-2 text-muted">Loading departments...</p>
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
          {/* Header */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-0">Assign new task</h4>
                  <p className="text-muted mb-0">Assign tasks to Employees in your department</p>
                </div>
                <button 
                  className="btn btn-outline-secondary rounded-pill"
                  onClick={() => navigate('/department-manager')}
                >
                  <i className="ri-arrow-left-line me-1"></i>
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0">
                  <h5 className="mb-0">Task Assignment Form</h5>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    {/* Department Selection */}
                    {departments.length > 1 && (
                      <div className="mb-4">
                        <label className="form-label fw-medium">Department *</label>
                        <select
                          className="form-select rounded-3"
                          value={selectedDepartment?.id || ''}
                          onChange={handleDepartmentChange}
                          required
                        >
                          <option value="">Select Department</option>
                          {departments.map(dept => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Department Info */}
                    {selectedDepartment && (
                      <div className="alert alert-info mb-4">
                        <i className="ri-building-line me-2"></i>
                        Assigning task to Employees in <strong>{selectedDepartment.name}</strong>
                      </div>
                    )}

                    {/* Task Form */}
                    {selectedDepartment ? (
                      <>
                        {tasks.map((task, index) => (
                          <div key={index} className="border rounded-3 p-4 mb-4 bg-light-subtle">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <h6 className="mb-0 text-primary">Task #{index + 1}</h6>
                              {tasks.length > 1 && (
                                <button 
                                  type="button" 
                                  className="btn btn-sm btn-outline-danger rounded-pill"
                                  onClick={() => removeTask(index)}
                                >
                                  <i className="ri-delete-bin-line me-1"></i>
                                  Remove
                                </button>
                              )}
                            </div>
                            
                            <div className="row">
                              <div className="col-md-6 mb-3">
                                <label className="form-label fw-medium">Task Title *</label>
                                <input
                                  type="text"
                                  className="form-control rounded-3"
                                  value={task.title}
                                  onChange={(e) => handleFormChange(index, 'title', e.target.value)}
                                  placeholder="Enter task title"
                                  required
                                />
                              </div>
                              
                              <div className="col-md-6 mb-3">
                                <label className="form-label fw-medium">Task Type *</label>
                                <select
                                  className="form-select rounded-3"
                                  value={task.task_type}
                                  onChange={(e) => handleFormChange(index, 'task_type', e.target.value)}
                                  required
                                >
                                  <option value="main">Main Task</option>
                                  <option value="subtask">Subtask</option>
                                </select>
                              </div>
                              
                              <div className="col-md-6 mb-3">
                                <label className="form-label fw-medium">Assign To *</label>
                                <select
                                  className="form-select rounded-3"
                                  value={task.assigned_to}
                                  onChange={(e) => handleFormChange(index, 'assigned_to', e.target.value)}
                                  required
                                >
                                  <option value="">Select Assignee</option>
                                  {/* Show all department employees for both main tasks and subtasks */}
                                  {departmentEmployees.map(employee => (
                                    <option key={employee.id} value={employee.id}>
                                      {employee.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              
                              <div className="col-md-6 mb-3">
                                <label className="form-label fw-medium">Priority</label>
                                <select
                                  className="form-select rounded-3"
                                  value={task.priority}
                                  onChange={(e) => handleFormChange(index, 'priority', e.target.value)}
                                >
                                  <option value="low">Low</option>
                                  <option value="medium">Medium</option>
                                  <option value="high">High</option>
                                </select>
                              </div>
                              
                              <div className="col-md-6 mb-3">
                                <label className="form-label fw-medium">Due Date *</label>
                                <input
                                  type="date"
                                  className="form-control rounded-3"
                                  value={task.due_date}
                                  onChange={(e) => handleFormChange(index, 'due_date', e.target.value)}
                                  min={new Date().toISOString().split('T')[0]} required
                                />
                              </div>
                              
                              <div className="col-12 mb-3">
                                <label className="form-label fw-medium">Description</label>
                                <textarea
                                  className="form-control rounded-3"
                                  rows="4"
                                  value={task.description}
                                  onChange={(e) => handleFormChange(index, 'description', e.target.value)}
                                  placeholder="Enter task description"
                                ></textarea>
                              </div>
                              
                              <div className="col-12 mb-3">
                                <label className="form-label fw-medium">Attachment</label>
                                <input
                                  type="file"
                                  className="form-control rounded-3"
                                  onChange={(e) => handleFileChange(index, e)}
                                />
                                <small className="text-muted">Optional: Upload a file related to this task</small>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        <div className="d-flex justify-content-between align-items-center mb-4">
                          <button 
                            type="button" 
                            className="btn btn-outline-primary rounded-pill"
                            onClick={addTask}
                          >
                            <i className="ri-add-line me-1"></i>
                            Add Another Task
                          </button>
                          
                          <div className="text-muted">
                            {tasks.length} task{tasks.length !== 1 ? 's' : ''} to be created
                          </div>
                        </div>
                        
                        <div className="d-flex justify-content-between pt-3">
                          <button 
                            type="button" 
                            className="btn btn-light rounded-pill"
                            onClick={() => navigate('/department-manager')}
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit" 
                            className="btn btn-outline-primary rounded-pill"
                            disabled={isAssigningTask}
                          >
                            {isAssigningTask ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                Assigning Task(s)...
                              </>
                            ) : (
                              <>
                                <i className="ri-send-plane-line me-1"></i>
                                Assign {tasks.length} Task(s)
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-5">
                        <i className="ri-building-line display-4 text-muted"></i>
                        <h5 className="mt-3">No Department Selected</h5>
                        <p className="text-muted">
                          {departments.length > 0 
                            ? "Please select a department to assign tasks" 
                            : "You are not assigned as a manager to any departments"}
                        </p>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignTaskToTeamLeader;