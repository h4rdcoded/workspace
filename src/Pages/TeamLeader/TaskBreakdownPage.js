import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ConfigContext } from '../../Context/ConfigContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { buildApiUrl, getAuthHeaders, API_ENDPOINTS } from '../../config/api';
import { Link } from 'react-router-dom';

const TaskBreakdownPage = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { leadCrmUser, userRole } = useContext(ConfigContext);
  
  const [task, setTask] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subtasks, setSubtasks] = useState([
    { title: '', description: '', priority: 'MEDIUM', due_date: '', assigned_to_id: '', attachments: [] }
  ]);
  const [existingSubtasksCount, setExistingSubtasksCount] = useState(0); // New state for existing subtasks count
  const [isDepartmentManager, setIsDepartmentManager] = useState(false); // New state to track if user is department manager

  // Check if current user is a department manager
  const checkDepartmentManagerStatus = async () => {
    try {
      // Only check for TL users
      if (!leadCrmUser?.id || userRole !== 'TL') {
        return false;
      }

      // Check if user is assigned as a department manager
      const response = await axios.get(
        buildApiUrl('/departments'),
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success && response.data.data) {
        // Check if any department has this user as manager_id
        const isManager = response.data.data.some(dept => {
          return dept.manager_id === leadCrmUser.id;
        });
        return isManager;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  // Fetch task details and team members
  const fetchTaskAndTeam = async () => {
    try {
      setLoading(true);
      
      // Check if user is department manager
      const isDeptManager = await checkDepartmentManagerStatus();
      setIsDepartmentManager(isDeptManager);
      
      // Fetch task details (including existing subtasks and attachments)
      const taskResponse = await axios.get(
        buildApiUrl(`/tasks/${taskId}`),
        { headers: getAuthHeaders() }
      );
      
      if (taskResponse.data.success) {
        // The task data is nested in data.task
        const taskData = taskResponse.data.data.task || taskResponse.data.data;
        
        setTask(taskData);
        
        // Set existing subtasks count
        if (taskResponse.data.data.subtasks && Array.isArray(taskResponse.data.data.subtasks)) {
          setExistingSubtasksCount(taskResponse.data.data.subtasks.length);
        }
        
        // Fetch team members based on the task's assigned department
        if (taskData.assigned_to_department) {
          if (isDeptManager) {
            // If department manager, fetch all department employees
            const deptEmployeesResponse = await axios.get(
              buildApiUrl(`/departments/${taskData.assigned_to_department}/employees`),
              { headers: getAuthHeaders() }
            );
            
            if (deptEmployeesResponse.data.success) {
              // Format all department employees for the dropdown
              const allDeptEmployees = deptEmployeesResponse.data.data.map(employee => ({
                id: employee.user_id,
                name: `${employee.name}`,
                email: employee.email,
                employee_code: employee.employee_code,
                designation: employee.designation,
                role: employee.role
              }));
              
              // Add the department manager to the list if not already present
              const deptManagerMember = {
                id: leadCrmUser.id,
                name: `${leadCrmUser.name} (Department Manager)`,
                email: leadCrmUser.email,
                employee_code: 'DM',
                designation: 'Department Manager',
                role: 'TL'
              };
              
              // Check if department manager is already in the list
              const isManagerInList = allDeptEmployees.some(employee => employee.id === leadCrmUser.id);
              
              let allMembers = allDeptEmployees;
              if (!isManagerInList) {
                allMembers = [deptManagerMember, ...allDeptEmployees];
              }
              
              setTeamMembers(allMembers);
            } else {
              toast.error('Failed to load department employees');
            }
          } else {
            // Normal team leader - fetch only team members for task assignment
            const teamResponse = await axios.get(
              buildApiUrl(`/departments/${taskData.assigned_to_department}/members/for-task-assignment`),
              { headers: getAuthHeaders() }
            );
            
            if (teamResponse.data.success) {
              // Add the team leader to the list if not already present
              const teamLeaderMember = {
                id: leadCrmUser.id,
                name: leadCrmUser.name,
                email: leadCrmUser.email,
                employee_code: 'TL',
                designation: 'Team Leader',
                role: 'TL'
              };
              
              // Check if team leader is already in the list
              const isTeamLeaderInList = teamResponse.data.data.some(member => member.id === leadCrmUser.id);
              
              let allMembers = teamResponse.data.data;
              if (!isTeamLeaderInList) {
                allMembers = [teamLeaderMember, ...teamResponse.data.data];
              }
              
              setTeamMembers(allMembers);
            } else {
              toast.error('Failed to load team members');
            }
          }
        } else {
          // Fallback: fetch departments and use the first one (old method)
          const deptResponse = await axios.get(
            buildApiUrl('/departments'),
            { headers: getAuthHeaders() }
          );
          
          if (deptResponse.data.success && deptResponse.data.data.length > 0) {
            // Get the first department for this team leader
            const departmentId = deptResponse.data.data[0].id;
            
            if (isDeptManager) {
              // If department manager, fetch all department employees
              const deptEmployeesResponse = await axios.get(
                buildApiUrl(`/departments/${departmentId}/employees`),
                { headers: getAuthHeaders() }
              );
              
              if (deptEmployeesResponse.data.success) {
                // Format all department employees for the dropdown
                const allDeptEmployees = deptEmployeesResponse.data.data.map(employee => ({
                  id: employee.user_id,
                  name: `${employee.name} (${employee.designation || employee.role})`,
                  email: employee.email,
                  employee_code: employee.employee_code,
                  designation: employee.designation,
                  role: employee.role
                }));
                
                // Add the department manager to the list if not already present
                const deptManagerMember = {
                  id: leadCrmUser.id,
                  name: `${leadCrmUser.name} (Department Manager)`,
                  email: leadCrmUser.email,
                  employee_code: 'DM',
                  designation: 'Department Manager',
                  role: 'TL'
                };
                
                // Check if department manager is already in the list
                const isManagerInList = allDeptEmployees.some(employee => employee.id === leadCrmUser.id);
                
                let allMembers = allDeptEmployees;
                if (!isManagerInList) {
                  allMembers = [deptManagerMember, ...allDeptEmployees];
                }
                
                setTeamMembers(allMembers);
              } else {
                toast.error('Failed to load department employees');
              }
            } else {
              // Normal team leader - fetch only team members for task assignment
              const teamResponse = await axios.get(
                buildApiUrl(`/departments/${departmentId}/members/for-task-assignment`),
                { headers: getAuthHeaders() }
              );
              
              if (teamResponse.data.success) {
                // Add the team leader to the list if not already present
                const teamLeaderMember = {
                  id: leadCrmUser.id,
                  name: leadCrmUser.name,
                  email: leadCrmUser.email,
                  employee_code: 'TL',
                  designation: 'Team Leader',
                  role: 'TL'
                };
                
                // Check if team leader is already in the list
                const isTeamLeaderInList = teamResponse.data.data.some(member => member.id === leadCrmUser.id);
                
                let allMembers = teamResponse.data.data;
                if (!isTeamLeaderInList) {
                  allMembers = [teamLeaderMember, ...teamResponse.data.data];
                }
                
                setTeamMembers(allMembers);
              } else {
                toast.error('Failed to load team members');
              }
            }
          }
        }
      } else {
        toast.error('Failed to load task details');
        navigate('/team-leader/assigned-tasks');
        return;
      }
    } catch (error) {
      toast.error('Failed to load task or team members: ' + (error.response?.data?.message || error.message));
      navigate('/team-leader/assigned-tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskAndTeam();
  }, [taskId, leadCrmUser]);

  // Add a new subtask field
  const addSubtask = () => {
    setSubtasks([
      ...subtasks,
      { title: '', description: '', priority: 'MEDIUM', due_date: '', assigned_to_id: '', attachments: [] }
    ]);
  };

  // Remove a subtask field
  const removeSubtask = (index) => {
    if (subtasks.length > 1) {
      const newSubtasks = [...subtasks];
      newSubtasks.splice(index, 1);
      setSubtasks(newSubtasks);
    }
  };

  // Update subtask field
  const updateSubtask = (index, field, value) => {
    const newSubtasks = [...subtasks];
    if (field === 'attachments') {
      newSubtasks[index][field] = value;
    } else {
      newSubtasks[index][field] = value;
    }
    setSubtasks(newSubtasks);
  };

  // Handle attachment upload for a specific subtask
  const handleAttachmentUpload = (index, files) => {
    const newSubtasks = [...subtasks];
    const attachments = Array.from(files).map(file => ({
      file: file,
      name: file.name,
      size: file.size,
      type: file.type
    }));
    newSubtasks[index].attachments = [...newSubtasks[index].attachments, ...attachments];
    setSubtasks(newSubtasks);
  };

  // Remove attachment from a subtask
  const removeAttachment = (subtaskIndex, attachmentIndex) => {
    const newSubtasks = [...subtasks];
    newSubtasks[subtaskIndex].attachments.splice(attachmentIndex, 1);
    setSubtasks(newSubtasks);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate subtasks
    const invalidSubtasks = subtasks.filter(st => 
      !st.title.trim() || 
      !st.description.trim() || 
      !st.due_date || 
      !st.assigned_to_id
    );
    
    if (invalidSubtasks.length > 0) {
      toast.error('Please fill in all required fields for all subtasks');
      return;
    }
    
    try {
      setSaving(true);
      
      // Prepare subtasks data without attachments for initial creation
      const subtasksWithoutAttachments = subtasks.map(({ attachments, ...subtask }) => subtask);
      
      // Submit subtasks without attachments
      const response = await axios.post(
        buildApiUrl(API_ENDPOINTS.TASKS.BREAKDOWN(taskId)),
        { subtasks: subtasksWithoutAttachments },
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        // Now upload attachments for each created subtask
        const createdSubtasks = response.data.data.subtasks;
        
        // Upload attachments for each subtask
        for (let i = 0; i < subtasks.length; i++) {
          const originalSubtask = subtasks[i];
          const createdSubtask = createdSubtasks[i];
          
          if (originalSubtask.attachments && originalSubtask.attachments.length > 0) {
            try {
              // Upload each attachment for this subtask
              for (const attachment of originalSubtask.attachments) {
                if (attachment.file) {
                  const formData = new FormData();
                  formData.append('attachment', attachment.file);
                  
                  await axios.post(
                    buildApiUrl(`/tasks/${createdSubtask.id}/attachments`),
                    formData,
                    {
                      headers: {
                        ...getAuthHeaders(),
                        'Content-Type': 'multipart/form-data'
                      }
                    }
                  );
                }
              }
            } catch (attachmentError) {
              toast.warn(`Some attachments could not be uploaded for subtask #${i + 1}`);
            }
          }
        }
        
        // Check notification results and show appropriate toasts
        const notificationResults = response.data.notificationResults || [];
        let successCount = 0;
        let skippedCount = 0;
        let failedCount = 0;
        
        notificationResults.forEach((result, index) => {
          const status = result.notificationStatus;
          if (status && status.success) {
            successCount++;
          } else if (status && status.skipped) {
            skippedCount++;
          } else {
            failedCount++;
          }
        });
        
        // Show appropriate toast messages
        if (successCount > 0 && failedCount === 0 && skippedCount === 0) {
          toast.success(`Task broken down successfully! WhatsApp notifications sent to all ${successCount} employee(s).`);
        } else if (successCount > 0) {
          let message = `Task broken down successfully! `;
          if (successCount > 0) message += `${successCount} notification(s) sent. `;
          if (skippedCount > 0) message += `${skippedCount} notification(s) skipped. `;
          if (failedCount > 0) message += `${failedCount} notification(s) failed.`;
          toast.warning(message);
        } else if (skippedCount > 0 || failedCount > 0) {
          let message = `Task broken down successfully, but `;
          if (skippedCount > 0) message += `${skippedCount} notification(s) were skipped. `;
          if (failedCount > 0) message += `${failedCount} notification(s) failed.`;
          toast.warning(message);
        } else {
          toast.success('Task broken down successfully!');
        }
        
        navigate('/team-leader/assigned-tasks');
      } else {
        toast.error(response.data.message || 'Failed to break down task');
      }
    } catch (error) {
      toast.error('Failed to break down task: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  // Take task for self
  const takeTaskForSelf = async () => {
    try {
      const response = await axios.post(
        buildApiUrl(`/tasks/${taskId}/take`),
        {},
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        toast.success('Task taken for self successfully!');
        navigate('/team-leader/assigned-tasks');
      } else {
        toast.error(response.data.message || 'Failed to take task for self');
      }
    } catch (error) {
      toast.error('Failed to take task for self');
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
                <p className="mt-2 text-muted">Loading task details...</p>
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
                  <h4 className="mb-0">Break Down Task</h4>
                  <p className="text-muted mb-0">Divide task into subtasks and assign to team members</p>
                  {/* Show department manager status */}
                  {isDepartmentManager && (
                    <span className="badge bg-success mt-1">Department Manager View</span>
                  )}
                </div>
                <div className="d-flex align-items-center">
                  <Link to="/team-leader/assigned-tasks" className="btn btn-outline-secondary rounded-pill me-2">
                    <i className="ri-arrow-left-line me-1"></i>
                    Back to Tasks
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Task Info Card */}
          {task && (
            <div className="row mb-4">
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white border-0 pb-0">
                    <h5 className="mb-0">Task: {task.title || 'Untitled Task'}</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <p className="mb-2"><strong>Description:</strong></p>
                        <p className="text-muted">{task.description || 'No description provided'}</p>
                        <p className="mb-1"><strong>Priority:</strong> 
                          <span className={`badge ms-2 ${
                            task.priority === 'URGENT' ? 'bg-danger-subtle text-danger' :
                            task.priority === 'HIGH' ? 'bg-warning-subtle text-warning' : 
                            task.priority === 'MEDIUM' ? 'bg-info-subtle text-info' : 'bg-light text-secondary'
                          }`}>
                            {task.priority}
                          </span>
                        </p>
                      </div>
                      <div className="col-md-6">
                        <p className="mb-1"><strong>Due Date:</strong> {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}</p>
                        <p className="mb-1"><strong>Status:</strong> 
                          <span className={`badge ms-2 ${
                            task.status === 'COMPLETED' ? 'bg-success-subtle text-success' : 
                            task.status === 'IN_PROGRESS' ? 'bg-warning-subtle text-warning' : 
                            task.status === 'SUBMITTED' ? 'bg-primary-subtle text-primary' : 
                            'bg-light text-secondary'
                          }`}>
                            {task.status ? task.status.replace('_', ' ') : 'Unknown'}
                          </span>
                        </p>
                        {/* Display existing subtasks count */}
                        <p className="mb-1"><strong>Existing Subtasks:</strong> 
                          <span className="badge bg-light text-dark ms-2">{existingSubtasksCount}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          </div>
        )}

        {/* Subtasks Form */}
        </div>
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center py-3">
                <div>
                  <h5 className="mb-0">Create Subtasks</h5>
                  {/* Display total subtasks count (existing + new) */}
                  <p className="text-muted mb-0 small">
                    Creating {subtasks.length} new subtask{subtasks.length !== 1 ? 's' : ''} 
                    {existingSubtasksCount > 0 && (
                      <span> (Total: {existingSubtasksCount + subtasks.length} subtasks)</span>
                    )}
                  </p>
                  {/* Show assignment scope based on user role */}
                  {isDepartmentManager ? (
                    <p className="text-success mb-0 small">You can assign tasks to any member of your department</p>
                  ) : (
                    <p className="text-primary mb-0 small">You can assign tasks to your team members only</p>
                  )}
                </div>
                <button 
                  type="button" 
                  className="btn btn-outline-primary rounded-pill"
                  onClick={addSubtask}
                >
                  <i className="ri-add-line me-1"></i>
                  Add Subtask
                </button>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  {subtasks.map((subtask, index) => (
                    <div key={index} className="border rounded-3 p-4 mb-4 bg-light-subtle">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="mb-0 text-primary">Subtask #{index + 1}</h6>
                        {subtasks.length > 1 && (
                          <button 
                            type="button" 
                            className="btn btn-sm btn-outline-danger rounded-pill"
                            onClick={() => removeSubtask(index)}
                          >
                            <i className="ri-delete-bin-line me-1"></i>
                            Remove
                          </button>
                        )}
                      </div>
                      
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-medium">Title *</label>
                          <input
                            type="text"
                            className="form-control rounded-pill"
                            placeholder="Enter subtask title"
                            value={subtask.title}
                            onChange={(e) => updateSubtask(index, 'title', e.target.value)}
                            required
                          />
                        </div>
                        
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-medium">Priority</label>
                          <select
                            className="form-select rounded-pill"
                            value={subtask.priority}
                            onChange={(e) => updateSubtask(index, 'priority', e.target.value)}
                          >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="URGENT">Urgent</option>
                          </select>
                        </div>
                        
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-medium">Due Date *</label>
                          <input
                            type="date"
                            className="form-control rounded-pill"
                            value={subtask.due_date}
                            onChange={(e) => updateSubtask(index, 'due_date', e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            required
                          />
                        </div>
                        
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-medium">Assign To *</label>
                          <select
                            className="form-select rounded-pill"
                            value={subtask.assigned_to_id}
                            onChange={(e) => updateSubtask(index, 'assigned_to_id', e.target.value)}
                            required
                          >
                            <option value="">Select team member</option>
                            {teamMembers
                              .filter(member => {
                                // If user is not a department manager (normal team leader), exclude self from assignment options
                                return isDepartmentManager || member.id !== leadCrmUser?.id;
                              })
                              .map(member => (
                                <option key={member.id} value={member.id}>
                                  {member.name || 'Unknown User'} 
                                </option>
                              ))}
                          </select>
                        </div>
                        
                        <div className="col-12 mb-3">
                          <label className="form-label fw-medium">Description *</label>
                          <textarea
                            className="form-control"
                            rows="3"
                            placeholder="Enter subtask description"
                            value={subtask.description}
                            onChange={(e) => updateSubtask(index, 'description', e.target.value)}
                            required
                          ></textarea>
                        </div>
                        
                        {/* Attachment Section */}
                        <div className="col-12 mb-3">
                          <label className="form-label fw-medium">Attachments (Optional)</label>
                          <input
                            type="file"
                            className="form-control rounded-pill"
                            multiple
                            onChange={(e) => handleAttachmentUpload(index, e.target.files)}
                          />
                          <small className="text-muted">You can upload multiple files</small>
                          
                          {/* Uploaded Files List */}
                          {subtask.attachments.length > 0 && (
                            <div className="mt-2">
                              <div className="row g-2">
                                {subtask.attachments.map((attachment, attachIndex) => (
                                  <div key={attachIndex} className="col-md-6">
                                    <div className="d-flex justify-content-between align-items-center border rounded-3 p-2 bg-light">
                                      <div className="d-flex align-items-center">
                                        <i className="ri-file-line me-2 text-muted"></i>
                                        <div>
                                          <div className="small fw-medium text-truncate" style={{maxWidth: '150px'}}>{attachment.name || attachment.file_name}</div>
                                          <div className="small text-muted">{Math.round((attachment.size || attachment.file_size) / 1024)} KB</div>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger rounded-pill"
                                        onClick={() => removeAttachment(index, attachIndex)}
                                      >
                                        <i className="ri-delete-bin-line"></i>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="d-flex justify-content-between pt-3">
                    <Link to="/team-leader/assigned-tasks" className="btn btn-light rounded-pill">
                      Cancel
                    </Link>
                    <div className="d-flex gap-2">
                      <button 
                        type="submit" 
                        className="btn btn-outline-primary rounded-pill"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                            Saving...
                          </>
                        ) : (
                          <>
                            <i className="ri-save-line me-1"></i>
                            Break Down Task
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskBreakdownPage;