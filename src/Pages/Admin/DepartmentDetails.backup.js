import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { buildApiUrl, getAuthHeaders } from '../../config/api';

const DepartmentDetails = () => {
    const { departmentId } = useParams();
    const navigate = useNavigate();
    
    // State management
    const [department, setDepartment] = useState(null);
    const [teamLeaders, setTeamLeaders] = useState([]);
    const [availableTeamLeaders, setAvailableTeamLeaders] = useState([]);
    const [departmentDesignations, setDepartmentDesignations] = useState([]);
    const [departmentTasks, setDepartmentTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddLeaderModal, setShowAddLeaderModal] = useState(false);
    const [showAssignManagerModal, setShowAssignManagerModal] = useState(false);
    const [showAssignTaskModal, setShowAssignTaskModal] = useState(false);
    const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
    const [showAssignTaskToEmployeeModal, setShowAssignTaskToEmployeeModal] = useState(false);
    const [showMakeTeamLeaderModal, setShowMakeTeamLeaderModal] = useState(false);
    const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showCreateDailyTaskModal, setShowCreateDailyTaskModal] = useState(false);
    
    // Loading states for forms
    const [isAddingTeamLeader, setIsAddingTeamLeader] = useState(false);
    const [isAssigningManager, setIsAssigningManager] = useState(false);
    const [isAssigningTask, setIsAssigningTask] = useState(false);
    const [isAddingEmployee, setIsAddingEmployee] = useState(false);
    const [isAssigningTaskToEmployee, setIsAssigningTaskToEmployee] = useState(false);
    const [isMakingTeamLeader, setIsMakingTeamLeader] = useState(false);
    const [creatingDailyTask, setCreatingDailyTask] = useState(false);
    
    // Section toggle state
    const [activeSection, setActiveSection] = useState('teamLeaders');
    
    // Search states
    const [teamLeaderSearch, setTeamLeaderSearch] = useState('');
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [taskSearch, setTaskSearch] = useState('');
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [tasksPerPage] = useState(10);
    const [employeesPerPage] = useState(10);
    
    // Form states
    const [newTeamLeader, setNewTeamLeader] = useState({
        name: '',
        email: '',
        phone: '',
        designation: ''
    });
    
    const [newEmployee, setNewEmployee] = useState({
        name: '',
        email: '',
        mobile: '',
        employee_code: '',
        designation_id: '',
        joining_date: '',
        employment_type: 'Full-time'
    });
    
    const [assignManagerForm, setAssignManagerForm] = useState({
        managerId: ''
    });
    
    const [assignTaskForm, setAssignTaskForm] = useState({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        assigned_to: '',
        attachment: null
    });
    
    const [assignTaskToEmployeeForm, setAssignTaskToEmployeeForm] = useState({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        assigned_to: '',
        attachment: null
    });
    
    const [makeTeamLeaderForm, setMakeTeamLeaderForm] = useState({
        employeeId: '',
        designation: ''
    });
    
    const [dailyTaskForm, setDailyTaskForm] = useState({
        title: '',
        description: '',
        priority: 'MEDIUM'
    });

    // Fetch department details
    const fetchDepartmentDetails = async () => {
        try {
            const deptResponse = await axios.get(
                buildApiUrl(`/departments/${departmentId}/details`),
                { headers: getAuthHeaders() }
            );
            
            if (deptResponse.data.success) {
                setDepartment({
                    ...deptResponse.data.data.department,
                    employees: deptResponse.data.data.employees || []
                });
            }
            
            const leadersResponse = await axios.get(
                buildApiUrl(`/departments/${departmentId}/team-leaders`),
                { headers: getAuthHeaders() }
            );
            
            if (leadersResponse.data.success) {
                setTeamLeaders(leadersResponse.data.data || []);
            }
            
            const tasksResponse = await axios.get(
                buildApiUrl(`/departments/${departmentId}/tasks?include_cancelled=true`),
                { headers: getAuthHeaders() }
            );
            
            if (tasksResponse.data.success) {
                const departmentTasksOnly = (tasksResponse.data.data || [])
                    .filter(task => task.task_type === 'MAIN_TASK');
                setDepartmentTasks(departmentTasksOnly);
            }
            
            try {
                const designationsResponse = await axios.get(
                    buildApiUrl(`/departments/${departmentId}/designations`),
                    { headers: getAuthHeaders() }
                );
                
                if (designationsResponse.data.success) {
                    setDepartmentDesignations(designationsResponse.data.data || []);
                }
            } catch (designationError) {
                setDepartmentDesignations([]);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Failed to load department details. Please try again.';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };
    
    const fetchAvailableTeamLeaders = async () => {
        try {
            const response = await axios.get(
                buildApiUrl(`/departments/${departmentId}/managers/available`),
                { headers: getAuthHeaders() }
            );
            
            if (response.data.success) {
                setAvailableTeamLeaders(response.data.data || []);
            }
        } catch (error) {
            toast.error('Failed to load available team leaders');
        }
    };

    // Handle form input changes
    const handleNewTeamLeaderChange = (e) => {
        const { name, value } = e.target;
        setNewTeamLeader(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const handleNewEmployeeChange = (e) => {
        const { name, value } = e.target;
        setNewEmployee(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const handleAssignManagerChange = (e) => {
        const { name, value } = e.target;
        setAssignManagerForm(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const handleAssignTaskChange = (e) => {
        const { name, value } = e.target;
        setAssignTaskForm(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const handleAssignTaskToEmployeeChange = (e) => {
        const { name, value } = e.target;
        setAssignTaskToEmployeeForm(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const handleMakeTeamLeaderChange = (e) => {
        const { name, value } = e.target;
        setMakeTeamLeaderForm(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const handleDailyTaskChange = (e) => {
        const { name, value } = e.target;
        setDailyTaskForm(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const handleFileChange = (e) => {
        setAssignTaskForm(prev => ({
            ...prev,
            attachment: e.target.files[0]
        }));
    };
    
    const handleFileChangeForEmployee = (e) => {
        setAssignTaskToEmployeeForm(prev => ({
            ...prev,
            attachment: e.target.files[0]
        }));
    };

    // Handle form submissions
    const handleAddTeamLeader = async (e) => {
        e.preventDefault();
        
        if (!newTeamLeader.name || !newTeamLeader.email) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsAddingTeamLeader(true);

        try {
            const response = await axios.post(
                buildApiUrl(`/departments/${departmentId}/team-leaders`),
                {
                    name: newTeamLeader.name,
                    email: newTeamLeader.email,
                    phone: newTeamLeader.phone,
                    designation: newTeamLeader.designation
                },
                { headers: getAuthHeaders() }
            );
            
            if (response.data.success) {
                toast.success('Team leader added successfully');
                setShowAddLeaderModal(false);
                setNewTeamLeader({
                    name: '',
                    email: '',
                    phone: '',
                    designation: ''
                });
                fetchDepartmentDetails();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add team leader');
        } finally {
            setIsAddingTeamLeader(false);
        }
    };
    
    const handleAddEmployee = async (e) => {
        e.preventDefault();
        
        if (!newEmployee.name || !newEmployee.email) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsAddingEmployee(true);

        try {
            const formData = new FormData();
            formData.append('name', newEmployee.name);
            formData.append('email', newEmployee.email);
            formData.append('mobile', newEmployee.mobile);
            formData.append('employee_code', newEmployee.employee_code);
            formData.append('designation_id', newEmployee.designation_id);
            formData.append('joining_date', newEmployee.joining_date);
            formData.append('employment_type', newEmployee.employment_type);

            const response = await axios.post(
                buildApiUrl(`/departments/${departmentId}/employees`),
                formData,
                { headers: getAuthHeaders() }
            );
            
            if (response.data.success) {
                toast.success('Employee added successfully');
                setShowAddEmployeeModal(false);
                setNewEmployee({
                    name: '',
                    email: '',
                    mobile: '',
                    employee_code: '',
                    designation_id: '',
                    joining_date: '',
                    employment_type: 'Full-time'
                });
                fetchDepartmentDetails();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add employee');
        } finally {
            setIsAddingEmployee(false);
        }
    };

    const handleAssignManager = async (e) => {
        e.preventDefault();
        
        if (!assignManagerForm.managerId) {
            toast.error('Please select a team leader');
            return;
        }

        setIsAssigningManager(true);

        try {
            const response = await axios.put(
                buildApiUrl(`/departments/${departmentId}/manager`),
                { managerId: assignManagerForm.managerId },
                { headers: getAuthHeaders() }
            );
            
            if (response.data.success) {
                toast.success('Department manager assigned successfully');
                setShowAssignManagerModal(false);
                setAssignManagerForm({ managerId: '' });
                fetchDepartmentDetails();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to assign manager');
        } finally {
            setIsAssigningManager(false);
        }
    };

    const handleAssignTask = async (e) => {
        e.preventDefault();
        
        if (!assignTaskForm.title || !assignTaskForm.assigned_to) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsAssigningTask(true);

        try {
            const formData = new FormData();
            formData.append('title', assignTaskForm.title);
            formData.append('description', assignTaskForm.description || '');
            formData.append('priority', assignTaskForm.priority);
            formData.append('due_date', assignTaskForm.due_date || '');
            formData.append('assigned_to', assignTaskForm.assigned_to);
            
            if (assignTaskForm.attachment) {
                formData.append('attachment', assignTaskForm.attachment);
            }

            const response = await axios.post(
                buildApiUrl(`/departments/${departmentId}/tasks`),
                formData,
                { 
                    headers: {
                        ...getAuthHeaders(),
                        'Content-Type': 'multipart/form-data'
                    },
                    timeout: 30000
                }
            );

            if (response.data.success) {
                toast.success('Task assigned to team leader successfully');
                setShowAssignTaskModal(false);
                setAssignTaskForm({
                    title: '',
                    description: '',
                    priority: 'medium',
                    due_date: '',
                    assigned_to: '',
                    attachment: null
                });
                fetchDepartmentDetails();
            }
        } catch (error) {
            if (error.code === 'ECONNABORTED') {
                toast.error('Request timeout. Please try again with a smaller file.');
            } else if (error.response) {
                const errorMessage = error.response.data?.message || 'Failed to assign task';
                toast.error(errorMessage);
            } else if (error.request) {
                toast.error('Network error. Please check your connection and try again.');
            } else {
                toast.error('Failed to assign task. Please try again.');
            }
        } finally {
            setIsAssigningTask(false);
        }
    };
    
    const handleAssignTaskToEmployee = async (e) => {
        e.preventDefault();
        
        if (!assignTaskToEmployeeForm.title || !assignTaskToEmployeeForm.assigned_to) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsAssigningTaskToEmployee(true);

        try {
            const formData = new FormData();
            formData.append('title', assignTaskToEmployeeForm.title);
            formData.append('description', assignTaskToEmployeeForm.description || '');
            formData.append('priority', assignTaskToEmployeeForm.priority);
            formData.append('due_date', assignTaskToEmployeeForm.due_date || '');
            formData.append('assigned_to', assignTaskToEmployeeForm.assigned_to);
            
            if (assignTaskToEmployeeForm.attachment) {
                formData.append('attachment', assignTaskToEmployeeForm.attachment);
            }

            const response = await axios.post(
                buildApiUrl(`/departments/${departmentId}/tasks/assign-to-employee`),
                formData,
                { 
                    headers: {
                        ...getAuthHeaders(),
                        'Content-Type': 'multipart/form-data'
                    },
                    timeout: 30000
                }
            );

            if (response.data.success) {
                toast.success('Task assigned to employee successfully');
                setShowAssignTaskToEmployeeModal(false);
                setAssignTaskToEmployeeForm({
                    title: '',
                    description: '',
                    priority: 'medium',
                    due_date: '',
                    assigned_to: '',
                    attachment: null
                });
                fetchDepartmentDetails();
            }
        } catch (error) {
            if (error.code === 'ECONNABORTED') {
                toast.error('Request timeout. Please try again with a smaller file.');
            } else if (error.response) {
                const errorMessage = error.response.data?.message || 'Failed to assign task to employee';
                toast.error(errorMessage);
            } else if (error.request) {
                toast.error('Network error. Please check your connection and try again.');
            } else {
                toast.error('Failed to assign task to employee. Please try again.');
            }
        } finally {
            setIsAssigningTaskToEmployee(false);
        }
    };
    
    const handleMakeTeamLeader = async (e) => {
        e.preventDefault();
        
        if (!makeTeamLeaderForm.employeeId) {
            toast.error('Please select an employee');
            return;
        }

        setIsMakingTeamLeader(true);

        try {
            const response = await axios.post(
                buildApiUrl(`/departments/${departmentId}/team-leaders/from-employee`),
                {
                    employee_id: makeTeamLeaderForm.employeeId,
                    designation: makeTeamLeaderForm.designation
                },
                { headers: getAuthHeaders() }
            );
            
            if (response.data.success) {
                toast.success('Employee promoted to team leader successfully');
                setShowMakeTeamLeaderModal(false);
                setMakeTeamLeaderForm({
                    employeeId: '',
                    designation: ''
                });
                fetchDepartmentDetails();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to promote employee to team leader');
        } finally {
            setIsMakingTeamLeader(false);
        }
    };

    const handleRemoveTeamLeader = async (teamLeaderId) => {
        if (!window.confirm('Are you sure you want to remove this team leader?')) {
            return;
        }

        try {
            const response = await axios.delete(
                buildApiUrl(`/departments/${departmentId}/team-leaders/${teamLeaderId}`),
                { headers: getAuthHeaders() }
            );
            
            if (response.data.success) {
                toast.success('Team leader removed successfully');
                fetchDepartmentDetails();
            } else {
                toast.error(response.data.message || 'Failed to remove team leader');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to remove team leader');
        }
    };

    const handleRemoveManager = async () => {
        if (!window.confirm('Are you sure you want to remove the department manager?')) {
            return;
        }

        try {
            const response = await axios.delete(
                buildApiUrl(`/departments/${departmentId}/manager`),
                { headers: getAuthHeaders() }
            );
            
            if (response.data.success) {
                toast.success('Department manager removed successfully');
                fetchDepartmentDetails();
            } else {
                toast.error(response.data.message || 'Failed to remove department manager');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to remove department manager');
        }
    };

    const handleRemoveEmployee = async (employeeId) => {
        if (!window.confirm('Are you sure you want to remove this employee from the department?')) {
            return;
        }

        try {
            const response = await axios.delete(
                buildApiUrl(`/departments/${departmentId}/employees/${employeeId}`),
                { headers: getAuthHeaders() }
            );
            
            if (response.data.success) {
                toast.success('Employee removed from department successfully');
                fetchDepartmentDetails();
            } else {
                toast.error(response.data.message || 'Failed to remove employee');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to remove employee');
        }
    };
    
    const handleCancelTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to cancel this task?')) {
            return;
        }

        try {
            const response = await axios.put(
                buildApiUrl(`/tasks/${taskId}/status`),
                { status: 'CANCELLED' },
                { headers: getAuthHeaders() }
            );
            
            if (response.data.success) {
                toast.success('Task cancelled successfully');
                fetchDepartmentDetails();
            } else {
                toast.error(response.data.message || 'Failed to cancel task');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to cancel task');
        }
    };

    const handleDownloadAttachment = (filePath, fileName) => {
        const link = document.createElement('a');
        link.href = `${process.env.REACT_APP_SERVER_URL}${filePath}`;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Handle create daily routine task
    const handleCreateDailyTask = async (e) => {
        e.preventDefault();
        
        if (!dailyTaskForm.title || !dailyTaskForm.description) {
            toast.error('Please fill in all required fields');
            return;
        }
        
        setCreatingDailyTask(true);
        
        try {
            const response = await axios.post(
                buildApiUrl('/daily-routine'),
                {
                    title: dailyTaskForm.title,
                    description: dailyTaskForm.description,
                    department_id: departmentId,
                    priority: dailyTaskForm.priority
                },
                { headers: getAuthHeaders() }
            );
            
            if (response.data.success) {
                toast.success('Daily routine task created successfully');
                setShowCreateDailyTaskModal(false);
                setDailyTaskForm({
                    title: '',
                    description: '',
                    priority: 'MEDIUM'
                });
                fetchDepartmentDetails();
            } else {
                toast.error(response.data.message || 'Failed to create daily routine task');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create daily routine task');
        } finally {
            setCreatingDailyTask(false);
        }
    };

    useEffect(() => {
        if (departmentId) {
            fetchDepartmentDetails();
        }
    }, [departmentId]);
    
    useEffect(() => {
        if (showAssignManagerModal) {
            fetchAvailableTeamLeaders();
        }
    }, [showAssignManagerModal]);

    // Filter functions
    const filteredTeamLeaders = teamLeaders.filter(leader => 
        leader.name.toLowerCase().includes(teamLeaderSearch.toLowerCase()) ||
        leader.email.toLowerCase().includes(teamLeaderSearch.toLowerCase())
    );

    const filteredEmployees = department?.employees?.filter(employee => 
        employee.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        employee.email.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        (employee.designation && employee.designation.toLowerCase().includes(employeeSearch.toLowerCase()))
    ) || [];
    
    const filteredTasks = departmentTasks.filter(task => 
        task.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(taskSearch.toLowerCase())) ||
        (task.assigned_to_name && task.assigned_to_name.toLowerCase().includes(taskSearch.toLowerCase()))
    );

    if (loading) {
        return (
            <>
                <div className="vertical-overlay" />
                <div className="main-content">
                    <div className="page-content">
                        <div className="container-fluid">
                            <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
                                <div className="text-center">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    <p className="mt-3 text-muted">Loading department data...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (!department) {
        return (
            <>
                <div className="vertical-overlay" />
                <div className="main-content">
                    <div className="page-content">
                        <div className="container-fluid">
                            <div className="row justify-content-center">
                                <div className="col-lg-6">
                                    <div className="card border-0 shadow-sm">
                                        <div className="card-body text-center py-5">
                                            <div className="mx-auto mb-4">
                                                <div className="rounded-circle bg-danger bg-opacity-10 d-flex align-items-center justify-content-center mx-auto" style={{ width: '80px', height: '80px' }}>
                                                    <i className="ri-error-warning-line text-danger fs-1"></i>
                                                </div>
                                            </div>
                                            <h3 className="mb-3">Department Not Found</h3>
                                            <p className="text-muted mb-4">
                                                The requested department could not be found or there was an error loading the department data.
                                            </p>
                                            <div className="d-flex justify-content-center gap-2">
                                                <button 
                                                    className="btn btn-outline-primary rounded-pill px-4"
                                                    onClick={() => navigate('/admin/departments')}
                                                >
                                                    <i className="ri-arrow-left-line me-2"></i>
                                                    Back to Departments
                                                </button>
                                                <button 
                                                    className="btn btn-outline-primary rounded-pill px-4"
                                                    onClick={fetchDepartmentDetails}
                                                >
                                                    <i className="ri-refresh-line me-2"></i>
                                                    Retry
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="vertical-overlay" />
            <div className="main-content">
                <div className="page-content">
                    <div className="container-fluid py-4">
                        {/* Header */}
                        <div className="row mb-4">
                            <div className="col-12">
                                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                                    <div>
                                        <h2 className="mb-1">{department.name}</h2>
                                        <p className="text-muted mb-0">{department.description || 'No description provided'}</p>
                                    </div>
                                    <div className="d-flex gap-2">
                                        <button 
                                            className="btn btn-primary rounded-pill px-4"
                                            onClick={() => setShowCreateDailyTaskModal(true)}
                                        >
                                            <i className="ri-add-line me-2"></i>
                                            Create Daily Task
                                        </button>
                                        <button 
                                            className="btn btn-outline-secondary rounded-pill px-4"
                                            onClick={() => navigate('/admin/departments')}
                                        >
                                            <i className="ri-arrow-left-line me-2"></i>
                                            Back to Departments
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Department Info Cards */}
                        <div className="row mb-4 g-4">
                            <div className="col-md-4">
                                <div className="card border-0 shadow-sm h-100">
                                    <div className="card-body">
                                        <div className="d-flex align-items-center mb-3">
                                            <div className="flex-shrink-0 bg-primary bg-opacity-10 rounded-3 p-3">
                                                <i className="ri-building-2-line text-primary fs-4"></i>
                                            </div>
                                            <div className="flex-grow-1 ms-3">
                                                <h5 className="card-title mb-0">Department Information</h5>
                                            </div>
                                        </div>
                                        <div className="mt-3">
                                            <div className="row g-3">
                                                <div className="col-12">
                                                    <label className="form-label text-muted small mb-1">Status</label>
                                                    <p className="mb-0">
                                                        <span className={`badge ${department.is_active ? 'bg-success bg-opacity-10 text-success' : 'bg-secondary bg-opacity-10 text-secondary'} px-3 py-2 rounded-pill`}>
                                                            {department.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </p>
                                                    <label className="form-label text-muted small mb-1">Created</label>
                                                    <p className="mb-0">{new Date(department.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="col-md-4">
                                <div className="card border-0 shadow-sm h-100">
                                    <div className="card-body">
                                        <div className="d-flex align-items-center mb-3">
                                            <div className="flex-shrink-0 bg-info bg-opacity-10 rounded-3 p-3">
                                                <i className="ri-user-line text-info fs-4"></i>
                                            </div>
                                            <div className="flex-grow-1 ms-3">
                                                <h5 className="card-title mb-0">Department Manager</h5>
                                            </div>
                                        </div>
                                        <div className="mt-3">
                                            {department.manager_name ? (
                                                <div>
                                                    <div className="d-flex align-items-center justify-content-between">
                                                        <div className="d-flex align-items-center">
                                                            <div className="avatar-sm">
                                                                <div className="avatar-title rounded-circle bg-primary bg-opacity-10 text-primary fs-5">
                                                                    <i className="ri-user-line"></i>
                                                                </div>
                                                            </div>
                                                            <div className="ms-3">
                                                                <p className="mb-1 fw-medium">{department.manager_name}</p>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={handleRemoveManager}
                                                            title="Remove Manager"
                                                        >
                                                            <i className="ri-close-line"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-3">
                                                    <i className="ri-user-line display-5 text-muted"></i>
                                                    <p className="text-muted mt-2 mb-0">No manager assigned</p>
                                                    <button 
                                                        className="btn btn-sm btn-outline-primary rounded-pill mt-2"
                                                        onClick={() => setShowAssignManagerModal(true)}
                                                    >
                                                        Assign Manager
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="col-md-4">
                                <div className="card border-0 shadow-sm h-100">
                                    <div className="card-body">
                                        <div className="d-flex align-items-center mb-3">
                                            <div className="flex-shrink-0 bg-warning bg-opacity-10 rounded-3 p-3">
                                                <i className="ri-team-line text-warning fs-4"></i>
                                            </div>
                                            <div className="flex-grow-1 ms-3">
                                                <h5 className="card-title mb-0">Department Overview</h5>
                                            </div>
                                        </div>
                                        <div className="mt-3">
                                            <div className="row g-3">
                                                <div className="col-12">
                                                    <div className="d-flex justify-content-between">
                                                        <span className="text-muted">Teams</span>
                                                        <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3">
                                                            {department.team_count || 0}
                                                        </span>
                                                    </div>
                                                    <div className="progress mt-2" style={{ height: '5px' }}>
                                                        <div 
                                                            className="progress-bar bg-success opacity-1" 
                                                            role="progressbar" 
                                                            style={{ width: `${Math.min(100, (department.team_count || 0) / 5 * 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                                <div className="col-12">
                                                    <div className="d-flex justify-content-between">
                                                        <span className="text-muted">Team Leaders</span>
                                                        <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3">
                                                            {teamLeaders.length}
                                                        </span>
                                                    </div>
                                                    <div className="progress mt-2" style={{ height: '5px' }}>
                                                        <div 
                                                            className="progress-bar bg-primary" 
                                                            role="progressbar" 
                                                            style={{ width: `${Math.min(100, (teamLeaders.length / 10) * 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                                <div className="col-12">
                                                    <div className="d-flex justify-content-between">
                                                        <span className="text-muted">Employees</span>
                                                        <span className="badge bg-info bg-opacity-10 text-info rounded-pill px-3">
                                                            {department.employees?.length || 0}
                                                        </span>
                                                    </div>
                                                    <div className="progress mt-2" style={{ height: '5px' }}>
                                                        <div 
                                                            className="progress-bar bg-info" 
                                                            role="progressbar" 
                                                            style={{ width: `${Math.min(100, (department.employees?.length || 0) / 20 * 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Toggle Section Navigation */}
                        <div className="row mb-4">
                            <div className="col-12">
                                <div className="card border-0 shadow-sm">
                                    <div className="card-body p-0">
                                        <ul className="nav nav-tabs nav-tabs-custom nav-justified" role="tablist">
                                            <li className="nav-item">
                                                <a 
                                                    className={`nav-link ${activeSection === 'teamLeaders' ? 'active' : ''}`}
                                                    onClick={() => setActiveSection('teamLeaders')}
                                                    role="tab"
                                                >
                                                    <i className="ri-user-star-line me-2"></i>
                                                    Team Leaders
                                                </a>
                                            </li>
                                            <li className="nav-item">
                                                <a 
                                                    className={`nav-link ${activeSection === 'employees' ? 'active' : ''}`}
                                                    onClick={() => setActiveSection('employees')}
                                                    role="tab"
                                                >
                                                    <i className="ri-user-line me-2"></i>
                                                    Employees
                                                </a>
                                            </li>
                                            <li className="nav-item">
                                                <a 
                                                    className={`nav-link ${activeSection === 'tasks' ? 'active' : ''}`}
                                                    onClick={() => setActiveSection('tasks')}
                                                    role="tab"
                                                >
                                                    <i className="ri-task-line me-2"></i>
                                                    Tasks
                                                </a>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Team Leaders Section */}
                        {activeSection === 'teamLeaders' && (
                            <div className="row">
                                <div className="col-12">
                                    <div className="card border-0 shadow-sm">
                                        <div className="card-header bg-white border-0 py-3">
                                            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                                                <h5 className="mb-0">Team Leaders</h5>
                                                <div className="d-flex gap-2">
                                                    <div className="input-group rounded-pill" style={{ width: '250px' }}>
                                                        <span className="input-group-text border-0 bg-light">
                                                            <i className="ri-search-line"></i>
                                                        </span>
                                                        <input
                                                            type="text"
                                                            className="form-control border-0"
                                                            placeholder="Search team leaders..."
                                                            value={teamLeaderSearch}
                                                            onChange={(e) => setTeamLeaderSearch(e.target.value)}
                                                        />
                                                    </div>
                                                    <button 
                                                        className="btn btn-outline-success rounded-pill px-4"
                                                        onClick={() => setShowAddLeaderModal(true)}
                                                    >
                                                        <i className="ri-user-add-line me-2"></i>
                                                        Add Team Leader
                                                    </button>
                                                    <button 
                                                        className="btn btn-outline-primary rounded-pill px-4"
                                                        onClick={() => setShowAssignManagerModal(true)}
                                                        disabled={teamLeaders.length === 0}
                                                    >
                                                        <i className="ri-user-star-line me-2"></i>
                                                        Assign New Manager
                                                    </button>
                                                    <button 
                                                        className="btn btn-outline-primary rounded-pill px-4"
                                                        onClick={() => setShowAssignTaskModal(true)}
                                                        disabled={teamLeaders.length === 0 || isAssigningTask}
                                                    >
                                                        {isAssigningTask ? (
                                                            <>
                                                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                                Assigning...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="ri-task-line me-2"></i>
                                                                Assign Task
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card-body">
                                            {teamLeaders.length === 0 ? (
                                                <div className="text-center py-5">
                                                    <div className="mb-3">
                                                        <i className="ri-user-line display-4 text-muted"></i>
                                                    </div>
                                                    <h5 className="mb-2">No Team Leaders</h5>
                                                    <p className="text-muted mb-4">Get started by adding your first team leader to this department</p>
                                                    <button 
                                                        className="btn btn-outline-primary rounded-pill px-4"
                                                        onClick={() => setShowAddLeaderModal(true)}
                                                        disabled={isAddingTeamLeader}
                                                    >
                                                        {isAddingTeamLeader ? (
                                                            <>
                                                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                                Adding...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="ri-user-add-line me-2"></i>
                                                                Add First Team Leader
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="table-responsive">
                                                    <table className="table table-hover align-middle">
                                                        <thead className="table-light">
                                                            <tr>
                                                                <th>Name</th>
                                                                <th>Email</th>
                                                                <th>Phone</th>
                                                                <th>Designation</th>
                                                                <th>Assigned Date</th>
                                                                <th>Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {filteredTeamLeaders.map(leader => (
                                                                <tr key={leader.id}>
                                                                    <td>
                                                                        <div className="d-flex align-items-center">
                                                                            <div className="avatar-xs me-2">
                                                                                <div className="avatar-title rounded-circle bg-primary bg-opacity-10 text-primary fs-6">
                                                                                    <i className="ri-user-line"></i>
                                                                                </div>
                                                                            </div>
                                                                            <div>
                                                                                <p className="mb-0 fw-medium">{leader.name}</p>
                                                                                {leader.is_department_manager && (
                                                                                    <span className="badge bg-success bg-opacity-10 text-success ms-2">
                                                                                        Manager
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td>{leader.email}</td>
                                                                    <td>{leader.phone || 'N/A'}</td>
                                                                    <td>{leader.designation || 'N/A'}</td>
                                                                    <td>{new Date(leader.assigned_at).toLocaleDateString()}</td>
                                                                    <td>
                                                                        <div className="dropdown">
                                                                            <button 
                                                                                className="btn btn-sm btn-outline-secondary" 
                                                                                type="button" 
                                                                                data-bs-toggle="dropdown"
                                                                            >
                                                                                <i className="ri-more-2-fill"></i>
                                                                            </button>
                                                                            <ul className="dropdown-menu dropdown-menu-end">
                                                                                <li>
                                                                                    <button 
                                                                                        className="dropdown-item d-flex align-items-center"
                                                                                        onClick={() => {
                                                                                            setAssignTaskForm(prev => ({
                                                                                                ...prev,
                                                                                                assigned_to: leader.id
                                                                                            }));
                                                                                            setShowAssignTaskModal(true);
                                                                                        }}
                                                                                    >
                                                                                        <i className="ri-task-line me-2"></i>
                                                                                        Assign Task
                                                                                    </button>
                                                                                </li>
                                                                                {!leader.is_department_manager && (
                                                                                    <li>
                                                                                        <button 
                                                                                            className="dropdown-item d-flex align-items-center text-danger"
                                                                                            onClick={() => handleRemoveTeamLeader(leader.id)}
                                                                                        >
                                                                                            <i className="ri-delete-bin-line me-2"></i>
                                                                                            Remove
                                                                                        </button>
                                                                                    </li>
                                                                                )}
                                                                            </ul>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Employees Section */}
                        {activeSection === 'employees' && (
                            <div className="row">
                                <div className="col-12">
                                    <div className="card border-0 shadow-sm">
                                        <div className="card-header bg-white border-0 py-3">
                                            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                                                <h5 className="mb-0">Employees</h5>
                                                <div className="d-flex gap-2">
                                                    <div className="input-group rounded-pill" style={{ width: '250px' }}>
                                                        <span className="input-group-text border-0 bg-light">
                                                            <i className="ri-search-line"></i>
                                                        </span>
                                                        <input
                                                            type="text"
                                                            className="form-control border-0"
                                                            placeholder="Search employees..."
                                                            value={employeeSearch}
                                                            onChange={(e) => setEmployeeSearch(e.target.value)}
                                                        />
                                                    </div>
                                                    <button 
                                                        className="btn btn-outline-success rounded-pill px-4"
                                                        onClick={() => setShowAddEmployeeModal(true)}
                                                        disabled={isAddingEmployee}
                                                    >
                                                        {isAddingEmployee ? (
                                                            <>
                                                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                                Adding...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="ri-user-add-line me-2"></i>
                                                                Add Employee
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card-body">
                                            {!department?.employees || department.employees.length === 0 ? (
                                                <div className="text-center py-5">
                                                    <div className="mb-3">
                                                        <i className="ri-user-line display-4 text-muted"></i>
                                                    </div>
                                                    <h5 className="mb-2">No Employees</h5>
                                                    <p className="text-muted mb-4">Get started by adding your first employee to this department</p>
                                                    <button 
                                                        className="btn btn-outline-primary rounded-pill px-4"
                                                        onClick={() => setShowAddEmployeeModal(true)}
                                                        disabled={isAddingEmployee}
                                                    >
                                                        {isAddingEmployee ? (
                                                            <>
                                                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                                Adding...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="ri-user-add-line me-2"></i>
                                                                Add First Employee
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            ) : !filteredEmployees || filteredEmployees.length === 0 ? (
                                                <div className="text-center py-5">
                                                    <div className="mb-3">
                                                        <i className="ri-user-line display-4 text-muted"></i>
                                                    </div>
                                                    <h5 className="mb-2">No Employees Found</h5>
                                                    <p className="text-muted mb-4">
                                                        {employeeSearch ? 'No employees match your search' : 'No employees in this department'}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="table-responsive">
                                                    <table className="table table-hover align-middle">
                                                        <thead className="table-light">
                                                            <tr>
                                                                <th>Name</th>
                                                                <th>Email</th>
                                                                <th>Designation</th>
                                                                <th>Employment Type</th>
                                                                <th>Joining Date</th>
                                                                <th>Team Leader</th>
                                                                <th>Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {filteredEmployees.slice((currentPage - 1) * employeesPerPage, currentPage * employeesPerPage).map(employee => (
                                                                <tr key={employee.id}>
                                                                    <td>
                                                                        <div className="d-flex align-items-center">
                                                                            <div className="avatar-xs me-2">
                                                                                <div className="avatar-title rounded-circle bg-info bg-opacity-10 text-info fs-6">
                                                                                    <i className="ri-user-line"></i>
                                                                                </div>
                                                                            </div>
                                                                            <div>
                                                                                <p className="mb-0 fw-medium">{employee.name}</p>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td>{employee.email}</td>
                                                                    <td>{employee.designation || 'N/A'}</td>
                                                                    <td>
                                                                        <span className="badge bg-secondary bg-opacity-10 text-secondary">
                                                                            {employee.employment_type || 'N/A'}
                                                                        </span>
                                                                    </td>
                                                                    <td>{employee.joining_date ? new Date(employee.joining_date).toLocaleDateString() : 'N/A'}</td>
                                                                    <td>
                                                                        {employee.team_leader_name ? (
                                                                            <span className="badge bg-primary bg-opacity-10 text-primary">
                                                                                {employee.team_leader_name}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="badge bg-secondary bg-opacity-10 text-secondary">
                                                                                No Team Leader
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td>
                                                                        <div className="dropdown">
                                                                            <button 
                                                                                className="btn btn-sm btn-outline-secondary" 
                                                                                type="button" 
                                                                                data-bs-toggle="dropdown"
                                                                            >
                                                                                <i className="ri-more-2-fill"></i>
                                                                            </button>
                                                                            <ul className="dropdown-menu dropdown-menu-end">
                                                                                <li>
                                                                                    <button 
                                                                                        className="dropdown-item d-flex align-items-center"
                                                                                        onClick={() => {
                                                                                            setAssignTaskToEmployeeForm(prev => ({
                                                                                                ...prev,
                                                                                                assigned_to: employee.id
                                                                                            }));
                                                                                            setShowAssignTaskToEmployeeModal(true);
                                                                                        }}
                                                                                    >
                                                                                        <i className="ri-task-line me-2"></i>
                                                                                        Assign Task
                                                                                    </button>
                                                                                </li>
                                                                                <li>
                                                                                    <button 
                                                                                        className="dropdown-item d-flex align-items-center"
                                                                                        onClick={() => {
                                                                                            setMakeTeamLeaderForm(prev => ({
                                                                                                ...prev,
                                                                                                employeeId: employee.id,
                                                                                                designation: employee.designation || ''
                                                                                            }));
                                                                                            setShowMakeTeamLeaderModal(true);
                                                                                        }}
                                                                                    >
                                                                                        <i className="ri-user-star-line me-2"></i>
                                                                                        Make Team Leader
                                                                                    </button>
                                                                                </li>
                                                                                <li>
                                                                                    <button 
                                                                                        className="dropdown-item d-flex align-items-center text-danger"
                                                                                        onClick={() => handleRemoveEmployee(employee.id)}
                                                                                    >
                                                                                        <i className="ri-delete-bin-line me-2"></i>
                                                                                        Remove from Department
                                                                                    </button>
                                                                                </li>
                                                                            </ul>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                    
                                                    {filteredEmployees.length > employeesPerPage && (
                                                        <div className="d-flex justify-content-center mt-4">
                                                            <nav>
                                                                <ul className="pagination">
                                                                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                                                        <button 
                                                                            className="page-link" 
                                                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                                        >
                                                                            Previous
                                                                        </button>
                                                                    </li>
                                                                    {[...Array(Math.ceil(filteredEmployees.length / employeesPerPage))].map((_, i) => (
                                                                        <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                                                                            <button 
                                                                                className="page-link" 
                                                                                onClick={() => setCurrentPage(i + 1)}
                                                                            >
                                                                                {i + 1}
                                                                            </button>
                                                                        </li>
                                                                    ))}
                                                                    <li className={`page-item ${currentPage === Math.ceil(filteredEmployees.length / employeesPerPage) ? 'disabled' : ''}`}>
                                                                        <button 
                                                                            className="page-link" 
                                                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredEmployees.length / employeesPerPage)))}
                                                                        >
                                                                            Next
                                                                        </button>
                                                                    </li>
                                                                </ul>
                                                            </nav>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tasks Section */}
                        {activeSection === 'tasks' && (
                            <div className="row">
                                <div className="col-12">
                                    <div className="card border-0 shadow-sm">
                                        <div className="card-header bg-white border-0 py-3">
                                            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                                                <h5 className="mb-0">Department Tasks</h5>
                                                <div className="d-flex gap-2">
                                                    <div className="input-group rounded-pill" style={{ width: '250px' }}>
                                                        <span className="input-group-text border-0 bg-light">
                                                            <i className="ri-search-line"></i>
                                                        </span>
                                                        <input
                                                            type="text"
                                                            className="form-control border-0"
                                                            placeholder="Search tasks..."
                                                            value={taskSearch}
                                                            onChange={(e) => setTaskSearch(e.target.value)}
                                                        />
                                                    </div>
                                                    <button 
                                                        className="btn btn-outline-primary rounded-pill px-4"
                                                        onClick={() => setShowAssignTaskModal(true)}
                                                        disabled={isAssigningTask}
                                                    >
                                                        {isAssigningTask ? (
                                                            <>
                                                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                                Assigning...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="ri-add-line me-2"></i>
                                                                Assign New Task
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card-body">
                                            {!departmentTasks || departmentTasks.length === 0 ? (
                                                <div className="text-center py-5">
                                                    <div className="mb-3">
                                                        <i className="ri-task-line display-4 text-muted"></i>
                                                    </div>
                                                    <h5 className="mb-2">No Tasks</h5>
                                                    <p className="text-muted mb-4">No tasks have been assigned to this department yet</p>
                                                    <button 
                                                        className="btn btn-outline-primary rounded-pill px-4"
                                                        onClick={() => setShowAssignTaskModal(true)}
                                                    >
                                                        <i className="ri-add-line me-2"></i>
                                                        Assign First Task
                                                    </button>
                                                </div>
                                            ) : !filteredTasks || filteredTasks.length === 0 ? (
                                                <div className="text-center py-5">
                                                    <div className="mb-3">
                                                        <i className="ri-task-line display-4 text-muted"></i>
                                                    </div>
                                                    <h5 className="mb-2">No Tasks Found</h5>
                                                    <p className="text-muted mb-4">
                                                        {taskSearch ? 'No tasks match your search' : 'No tasks in this department'}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="table-responsive">
                                                    <table className="table table-hover align-middle">
                                                        <thead className="table-light">
                                                            <tr>
                                                                <th>Task</th>
                                                                <th>Description</th>
                                                                <th>Assigned To</th>
                                                                <th>Created By</th>
                                                                <th>Created</th>
                                                                <th>Due Date</th>
                                                                <th>Priority</th>
                                                                <th>Status</th>
                                                                <th>Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {filteredTasks.slice((currentPage - 1) * tasksPerPage, currentPage * tasksPerPage).map(task => (
                                                                <tr key={task.id}>
                                                                    <td>
                                                                        <div className="d-flex align-items-center">
                                                                            <div className="avatar-xs me-2">
                                                                                <div className="avatar-title rounded-circle bg-warning bg-opacity-10 text-warning fs-6">
                                                                                    <i className="ri-task-line"></i>
                                                                                </div>
                                                                            </div>
                                                                            <div>
                                                                                <p className="mb-0 fw-medium">{task.title}</p>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td>
                                                                        <p className="mb-0 text-truncate" style={{ maxWidth: '200px' }}>
                                                                            {task.description || 'No description'}
                                                                        </p>
                                                                    </td>
                                                                    <td>
                                                                        <div className="d-flex align-items-center">
                                                                            <div className="avatar-xs me-2">
                                                                                <div className="avatar-title rounded-circle bg-info bg-opacity-10 text-info fs-6">
                                                                                    <i className="ri-user-line"></i>
                                                                                </div>
                                                                            </div>
                                                                            <div>
                                                                                <p className="mb-0">{task.assigned_to_name || 'Unassigned'}</p>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td>{task.created_by_name || 'N/A'}</td>
                                                                    <td>{task.created_at ? new Date(task.created_at).toLocaleDateString() : 'N/A'}</td>
                                                                    <td>{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}</td>
                                                                    <td>
                                                                        <span >
                                                                            {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        <span className={`badge ${
                                                                            task.status === 'COMPLETED' ? 'bg-success bg-opacity-10 text-success' : 
                                                                            task.status === 'IN_PROGRESS' ? 'bg-primary bg-opacity-10 text-primary' : 
                                                                            task.status === 'PENDING' ? 'bg-warning bg-opacity-10 text-warning' : 
                                                                            task.status === 'CANCELLED' ? 'bg-danger bg-opacity-10 text-danger' : 
                                                                            'bg-secondary bg-opacity-10 text-secondary'
                                                                        }`}>
                                                                            {task.status?.replace('_', ' ')}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        <div className="dropdown">
                                                                            <button 
                                                                                className="btn btn-sm btn-outline-secondary" 
                                                                                type="button" 
                                                                                data-bs-toggle="dropdown"
                                                                            >
                                                                                <i className="ri-more-2-fill"></i>
                                                                            </button>
                                                                            <ul className="dropdown-menu dropdown-menu-end">
                                                                                <li>
                                                                                    <button 
                                                                                        className="dropdown-item d-flex align-items-center"
                                                                                        onClick={() => navigate(`/admin/task_approvel/${task.id}`)}
                                                                                    >
                                                                                        <i className="ri-eye-line me-2"></i>
                                                                                        View Details
                                                                                    </button>
                                                                                </li>
                                                                                {task.status !== 'CANCELLED' && (
                                                                                    <li>
                                                                                        <button 
                                                                                            className="dropdown-item d-flex align-items-center text-danger"
                                                                                            onClick={() => handleCancelTask(task.id)}
                                                                                        >
                                                                                            <i className="ri-close-circle-line me-2"></i>
                                                                                            Cancel Task
                                                                                        </button>
                                                                                    </li>
                                                                                )}
                                                                            </ul>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                    
                                                    {filteredTasks.length > 0 && (
                                                        <div className="d-flex justify-content-center mt-4">
                                                            <nav>
                                                                <ul className="pagination">
                                                                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                                                        <button 
                                                                            className="page-link" 
                                                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                                        >
                                                                            Previous
                                                                        </button>
                                                                    </li>
                                                                    
                                                                    {[...Array(Math.ceil(filteredTasks.length / tasksPerPage))].map((_, index) => (
                                                                        <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                                                                            <button 
                                                                                className="page-link" 
                                                                                onClick={() => setCurrentPage(index + 1)}
                                                                            >
                                                                                {index + 1}
                                                                            </button>
                                                                        </li>
                                                                    ))}
                                                                    
                                                                    <li className={`page-item ${currentPage === Math.ceil(filteredTasks.length / tasksPerPage) ? 'disabled' : ''}`}>
                                                                        <button
                                                                            className="page-link" 
                                                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredTasks.length / tasksPerPage)))}
                                                                        >
                                                                            Next
                                                                        </button>
                                                                    </li>
                                                                </ul>
                                                            </nav>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Create Daily Routine Task Modal */}
                        {showCreateDailyTaskModal && (
                            <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                                <div className="modal-dialog modal-dialog-centered">
                                    <div className="modal-content border-0 shadow">
                                        <div className="modal-header border-0 pb-0">
                                            <h5 className="modal-title fw-semibold">Create Daily Routine Task</h5>
                                            <button 
                                                type="button" 
                                                className="btn-close" 
                                                onClick={() => setShowCreateDailyTaskModal(false)}
                                            ></button>
                                        </div>
                                        <form onSubmit={handleCreateDailyTask}>
                                            <div className="modal-body pt-2">
                                                <div className="mb-3">
                                                    <label className="form-label fw-medium">Task Title *</label>
                                                    <input
                                                        type="text"
                                                        className="form-control rounded-3"
                                                        name="title"
                                                        value={dailyTaskForm.title}
                                                        onChange={handleDailyTaskChange}
                                                        placeholder="Enter task title"
                                                        required
                                                    />
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label fw-medium">Description *</label>
                                                    <textarea
                                                        className="form-control rounded-3"
                                                        rows="3"
                                                        name="description"
                                                        value={dailyTaskForm.description}
                                                        onChange={handleDailyTaskChange}
                                                        placeholder="Enter task description"
                                                        required
                                                    ></textarea>
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label fw-medium">Priority</label>
                                                    <select
                                                        className="form-select rounded-3"
                                                        name="priority"
                                                        value={dailyTaskForm.priority}
                                                        onChange={handleDailyTaskChange}
                                                    >
                                                        <option value="LOW">Low</option>
                                                        <option value="MEDIUM">Medium</option>
                                                        <option value="HIGH">High</option>
                                                        <option value="URGENT">Urgent</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="modal-footer border-0 pt-0">
                                                <button 
                                                    type="button" 
                                                    className="btn btn-outline-secondary rounded-pill px-4"
                                                    onClick={() => setShowCreateDailyTaskModal(false)}
                                                >
                                                    Cancel
                                                </button>
                                                <button 
                                                    type="submit" 
                                                    className="btn btn-primary rounded-pill px-4"
                                                    disabled={creatingDailyTask}
                                                >
                                                    {creatingDailyTask ? (
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

                        {/* Add Team Leader Modal */}
                        {showAddLeaderModal && (
                            <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                                <div className="modal-dialog modal-dialog-centered">
                                    <div className="modal-content border-0 shadow">
                                        <div className="modal-header border-0 pb-0">
                                            <h5 className="modal-title fw-semibold">Add Team Leader</h5>
                                            <button 
                                                type="button" 
                                                className="btn-close" 
                                                onClick={() => setShowAddLeaderModal(false)}
                                            ></button>
                                        </div>
                                        <form onSubmit={handleAddTeamLeader}>
                                            <div className="modal-body pt-2">
                                                <div className="mb-3">
                                                    <label className="form-label fw-medium">Name *</label>
                                                    <input
                                                        type="text"
                                                        className="form-control rounded-3"
                                                        name="name"
                                                        value={newTeamLeader.name}
                                                        onChange={handleNewTeamLeaderChange}
                                                        required
                                                    />
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label fw-medium">Email *</label>
                                                    <input
                                                        type="email"
                                                        className="form-control rounded-3"
                                                        name="email"
                                                        value={newTeamLeader.email}
                                                        onChange={handleNewTeamLeaderChange}
                                                        required
                                                    />
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label fw-medium">Phone</label>
                                                    <input
                                                        type="text"
                                                        className="form-control rounded-3"
                                                        name="phone"
                                                        value={newTeamLeader.phone}
                                                        onChange={handleNewTeamLeaderChange}
                                                    />
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label fw-medium">Designation</label>
                                                    {departmentDesignations && departmentDesignations.length > 0 ? (
                                                        <>
                                                            <select
                                                                className="form-control rounded-3 mb-2"
                                                                name="designation"
                                                                value={newTeamLeader.designation}
                                                                onChange={handleNewTeamLeaderChange}
                                                            >
                                                                <option value="">Select Designation</option>
                                                                {departmentDesignations.map(designation => (
                                                                    <option key={designation.id} value={designation.id}>
                                                                        {designation.title}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </>
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            className="form-control rounded-3"
                                                            name="designation"
                                                            value={newTeamLeader.designation}
                                                            onChange={handleNewTeamLeaderChange}
                                                            placeholder="Enter designation"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="modal-footer border-0 pt-0">
                                                <button 
                                                    type="button" 
                                                    className="btn btn-outline-secondary rounded-pill px-4"
                                                    onClick={() => setShowAddLeaderModal(false)}
                                                >
                                                    Cancel
                                                </button>
                                                <button 
                                                    type="submit" 
                                                    className="btn btn-outline-primary rounded-pill px-4"
                                                    disabled={isAddingTeamLeader}
                                                >
                                                    {isAddingTeamLeader ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                            Adding...
                                                        </>
                                                    ) : (
                                                        'Add Team Leader'
                                                    )}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Assign Manager Modal */}
                        {showAssignManagerModal && (
                            <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                                <div className="modal-dialog modal-dialog-centered">
                                    <div className="modal-content border-0 shadow">
                                        <div className="modal-header border-0 pb-0">
                                            <h5 className="modal-title fw-semibold">Assign Department Manager</h5>
                                            <button 
                                                type="button" 
                                                className="btn-close" 
                                                onClick={() => setShowAssignManagerModal(false)}
                                            ></button>
                                        </div>
                                        <form onSubmit={handleAssignManager}>
                                            <div className="modal-body pt-2">
                                                <div className="mb-3">
                                                    <label className="form-label fw-medium">Select Team Leader *</label>
                                                    <select
                                                        className="form-select rounded-3"
                                                        name="managerId"
                                                        value={assignManagerForm.managerId}
                                                        onChange={handleAssignManagerChange}
                                                        required
                                                    >
                                                        <option value="">Choose a team leader</option>
                                                        {availableTeamLeaders && availableTeamLeaders.map(leader => (
                                                            <option key={leader.id} value={leader.id}>
                                                                {leader.name} ({leader.email})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="alert alert-info">
                                                    <i className="ri-information-line me-2"></i>
                                                    Only team leaders can be assigned as department managers.
                                                </div>
                                            </div>
                                            <div className="modal-footer border-0 pt-0">
                                                <button 
                                                    type="button" 
                                                    className="btn btn-outline-secondary rounded-pill px-4"
                                                    onClick={() => setShowAssignManagerModal(false)}
                                                >
                                                    Cancel
                                                </button>
                                                <button 
                                                    type="submit" 
                                                    className="btn btn-outline-primary rounded-pill px-4"
                                                    disabled={isAssigningManager}
                                                >
                                                    {isAssigningManager ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                            Assigning...
                                                        </>
                                                    ) : (
                                                        'Assign Manager'
                                                    )}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Assign Task Modal */}
                        {showAssignTaskModal && (
                            <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                                <div className="modal-dialog modal-dialog-centered">
                                    <div className="modal-content border-0 shadow">
                                        <div className="modal-header border-0 pb-0">
                                            <h5 className="modal-title fw-semibold">Assign Task to Team Leader</h5>
                                            <button 
                                                type="button" 
                                                className="btn-close" 
                                                onClick={() => setShowAssignTaskModal(false)}
                                            ></button>
                                        </div>
                                        <form onSubmit={handleAssignTask}>
                                            <div className="modal-body pt-2">
                                                <div className="mb-3">
                                                    <label className="form-label fw-medium">Task Title *</label>
                                                    <input
                                                        type="text"
                                                        className="form-control rounded-3"
                                                        name="title"
                                                        value={assignTaskForm.title}
                                                        onChange={handleAssignTaskChange}
                                                        placeholder="Enter task title"
                                                        required
                                                    />
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label fw-medium">Description</label>
                                                    <textarea
                                                        className="form-control rounded-3"
                                                        rows="3"
                                                        name="description"
                                                        value={assignTaskForm.description}
                                                        onChange={handleAssignTaskChange}
                                                        placeholder="Enter task description"
                                                    ></textarea>
                                                </div>
                                                <div className="row">
                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label fw-medium">Priority</label>
                                                        <select
                                                            className="form-select rounded-3"
                                                            name="priority"
                                                            value={assignTaskForm.priority}
                                                            onChange={handleAssignTaskChange}
                                                        >
                                                            <option value="low">Low</option>
                                                            <option value="medium">Medium</option>
                                                            <option value="high">High</option>
                                                            <option value="urgent">Urgent</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label fw-medium">Due Date</label>
                                                        <input
                                                            type="date"
                                                            className="form-control rounded-3"
                                                            name="due_date"
                                                            value={assignTaskForm.due_date}
                                                            onChange={handleAssignTaskChange}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label fw-medium">Assign To *</label>
                                                    <select
                                                        className="form-select rounded-3"
                                                        name="assigned_to"
                                                        value={assignTaskForm.assigned_to}
                                                        onChange={handleAssignTaskChange}
                                                        required
                                                    >
                                                        <option value="">Select team leader</option>
                                                        {teamLeaders && teamLeaders.map(leader => (
                                                            <option key={leader.id} value={leader.id}>
                                                                {leader.name} 
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label fw-medium">Attachment</label>
                                                    <input
                                                        type="file"
                                                        className="form-control rounded-3"
                                                        onChange={handleFileChange}
                                                    />
                                                </div>
                                            </div>
                                            <div className="modal-footer border-0 pt-0">
                                                <button 
                                                    type="button" 
                                                    className="btn btn-outline-secondary rounded-pill px-4"
                                                    onClick={() => setShowAssignTaskModal(false)}
                                                >
                                                    Cancel
                                                </button>
                                                <button 
                                                    type="submit" 
                                                    className="btn btn-outline-primary rounded-pill px-4"
                                                    disabled={isAssigningTask}
                                                >
                                                    {isAssigningTask ? (
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

                        {/* Add Employee Modal */}
                        {showAddEmployeeModal && (
                            <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                                <div className="modal-dialog modal-dialog-centered">
                                    <div className="modal-content border-0 shadow">
                                        <div className="modal-header border-0 pb-0">
                                            <h5 className="modal-title fw-semibold">Add Employee</h5>
                                            <button 
                                                type="button" 
                                                className="btn-close" 
                                                onClick={() => setShowAddEmployeeModal(false)}
                                            ></button>
                                        </div>
                                        <form onSubmit={handleAddEmployee}>
                                            <div className="modal-body pt-2">
                                                <div className="mb-3">
                                                    <label className="form-label fw-medium">Name *</label>
                                                    <input
                                                        type="text"
                                                        className="form-control rounded-3"
                                                        name="name"
                                                        value={newEmployee.name}
                                                        onChange={handleNewEmployeeChange}
                                                        required
                                                    />
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label fw-medium">Email *</label>
                                                    <input
                                                        type="email"
                                                        className="form-control rounded-3"
                                                        name="email"
                                                        value={newEmployee.email}
                                                        onChange={handleNewEmployeeChange}
                                                        required
                                                    />
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label fw-medium">Mobile *</label>
                                                    <input
                                                        type="text"
                                                        className="form-control rounded-3"
                                                        name="mobile"
                                                        value={newEmployee.mobile}
                                                        onChange={handleNewEmployeeChange}
                                                        required
                                                    />
                                                </div>
                                              
                                                <div className="mb-3">
                                                    <label className="form-label fw-medium">Designation</label>
                                                    <select
                                                        className="form-select rounded-3"
                                                        name="designation_id"
                                                        value={newEmployee.designation_id}
                                                        onChange={handleNewEmployeeChange}
                                                    >
                                                        <option value="">Select Designation</option>
                                                        {departmentDesignations && departmentDesignations.map(designation => (
                                                            <option key={designation.id} value={designation.id}>
                                                                {designation.title}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="row">
                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label fw-medium">Joining Date</label>
                                                        <input
                                                            type="date"
                                                            className="form-control rounded-3"
                                                            name="joining_date"
                                                            value={newEmployee.joining_date}
                                                            onChange={handleNewEmployeeChange}
                                                        />
                                                    </div>
                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label fw-medium">Employment Type</label>
                                                        <select
                                                            className="form-select rounded-3"
                                                            name="employment_type"
                                                            value={newEmployee.employment_type}
                                                            onChange={handleNewEmployeeChange}
                                                        >
                                                            <option value="Full-time">Full-time</option>
                                                            <option value="Part-time">Part-time</option>
                                                            <option value="Contract">Contract</option>
                                                            <option value="Intern">Intern</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="modal-footer border-0 pt-0">
                                                <button 
                                                    type="button" 
                                                    className="btn btn-outline-secondary rounded-pill px-4"
                                                    onClick={() => setShowAddEmployeeModal(false)}
                                                >
                                                    Cancel
                                                </button>
                                                <button 
                                                    type="submit" 
                                                    className="btn btn-outline-primary rounded-pill px-4"
                                                    disabled={isAddingEmployee}
                                                >
                                                    {isAddingEmployee ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                            Adding...
                                                        </>
                                                    ) : (
                                                        'Add Employee'
                                                    )}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Assign Task to Employee Modal */}
                        {showAssignTaskToEmployeeModal && (
                            <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                                <div className="modal-dialog modal-dialog-centered">
                                    <div className="modal-content border-0 shadow">
                                        <div className="modal-header border-0 pb-0">
                                            <h5 className="modal-title fw-semibold">Assign Task to Employee</h5>
                                            <button 
                                                type="button" 
                                                className="btn-close" 
                                                onClick={() => setShowAssignTaskToEmployeeModal(false)}
                                            ></button>
                                        </div>
                                        <form onSubmit={handleAssignTaskToEmployee}>
                                            <div className="modal-body pt-2">
                                                <div className="mb-3">
                                                    <label className="form-label fw-medium">Task Title *</label>
                                                    <input
                                                        type="text"
                                                        className="form-control rounded-3"
                                                        name="title"
                                                        value={assignTaskToEmployeeForm.title}
                                                        onChange={handleAssignTaskToEmployeeChange}
                                                        placeholder="Enter task title"
                                                        required
                                                    />
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label fw-medium">Description</label>
                                                    <textarea
                                                        className="form-control rounded-3"
                                                        rows="3"
                                                        name="description"
                                                        value={assignTaskToEmployeeForm.description}
                                                        onChange={handleAssignTaskToEmployeeChange}
                                                        placeholder="Enter task description"
                                                    ></textarea>
                                                </div>
                                                <div className="row">
                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label fw-medium">Priority</label>
                                                        <select
                                                            className="form-select rounded-3"
                                                            name="priority"
                                                            value={assignTaskToEmployeeForm.priority}
                                                            onChange={handleAssignTaskToEmployeeChange}
                                                        >
                                                            <option value="low">Low</option>
                                                            <option value="medium">Medium</option>
                                                            <option value="high">High</option>
                                                            <option value="urgent">Urgent</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label fw-medium">Due Date</label>
                                                        <input
                                                            type="date"
                                                            className="form-control rounded-3"
                                                            name="due_date"
                                                            value={assignTaskToEmployeeForm.due_date}
                                                            onChange={handleAssignTaskToEmployeeChange}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label fw-medium">Assign To *</label>
                                                    <select
                                                        className="form-select rounded-3"
                                                        name="assigned_to"
                                                        value={assignTaskToEmployeeForm.assigned_to}
                                                        onChange={handleAssignTaskToEmployeeChange}
                                                        required
                                                    >
                                                        <option value="">Select employee</option>
                                                        {department.employees && department.employees.map(employee => (
                                                            <option key={employee.id} value={employee.id}>
                                                                {employee.name} 
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label fw-medium">Attachment</label>
                                                    <input
                                                        type="file"
                                                        className="form-control rounded-3"
                                                        onChange={handleFileChangeForEmployee}
                                                    />
                                                </div>
                                            </div>
                                            <div className="modal-footer border-0 pt-0">
                                                <button 
                                                    type="button" 
                                                    className="btn btn-outline-secondary rounded-pill px-4"
                                                    onClick={() => setShowAssignTaskToEmployeeModal(false)}
                                                >
                                                    Cancel
                                                </button>
                                                <button 
                                                    type="submit" 
                                                    className="btn btn-outline-primary rounded-pill px-4"
                                                    disabled={isAssigningTaskToEmployee}
                                                >
                                                    {isAssigningTaskToEmployee ? (
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

                        {/* Make Team Leader Modal */}
                        {showMakeTeamLeaderModal && (
                            <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                                <div className="modal-dialog modal-dialog-centered">
