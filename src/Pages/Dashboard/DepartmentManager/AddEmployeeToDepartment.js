import React, { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../../Context/ConfigContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { buildApiUrl, getAuthHeaders } from '../../../config/api';
import { useNavigate } from 'react-router-dom';

const AddEmployeeToDepartment = () => {
    const { leadCrmUser, staticFilesBaseURL } = useContext(ConfigContext);
    const navigate = useNavigate();
    const [departments, setDepartments] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isDepartmentManager, setIsDepartmentManager] = useState(false);
    const [designations, setDesignations] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [isClosing, setIsClosing] = useState(false);
    
    // Employee data
    const [newEmployeeData, setNewEmployeeData] = useState({
        name: '',
        email: '',
        mobile: '',
        // Removed employee_code
        designation: '', // Changed to text input instead of dropdown
        joining_date: '',
        employment_type: 'Full-time',
        role: 'EMPL' // Default role set to EMPL (Employee)
    });
    
    const [editingEmployee, setEditingEmployee] = useState(null);

    // Form validation state
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Helper function to check if employee is active
    const isEmployeeActive = (employee) => {
        if (!employee) return false;
        return employee.is_active === true || 
               employee.is_active === 1 || 
               employee.is_active === '1';
    };

    // Function to get profile image URL with fallback
    const getProfileImageUrl = (employee) => {
        if (!employee) return null;
        
        // Check multiple possible field names for profile image
        const profileImage = employee.profile_image || 
                            employee.profileImage || 
                            employee.avatar || 
                            employee.avatar_url ||
                            null;
        
        if (profileImage) {
            const baseUrl = staticFilesBaseURL || process.env.REACT_APP_SERVER_URL || 'https://task.ipshopy.com';
            // Remove query parameters if any
            let imagePath = profileImage.split('?')[0];
            
            // If image path already contains http/https, return as is
            if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
                return `${imagePath}?t=${new Date().getTime()}`;
            }
            
            // Construct URL based on staticFilesBaseURL
            if (staticFilesBaseURL) {
                // Remove leading slash if present to avoid double slashes
                const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
                return `${staticFilesBaseURL}/${cleanPath}?t=${new Date().getTime()}`;
            } else {
                // Use baseUrl with proper path handling
                // If imagePath doesn't start with /uploads, add it
                if (!imagePath.startsWith('/uploads') && !imagePath.startsWith('uploads')) {
                    imagePath = imagePath.startsWith('/') ? `/uploads${imagePath}` : `/uploads/${imagePath}`;
                }
                const cleanPath = imagePath.startsWith('/') ? imagePath : '/' + imagePath;
                return `${baseUrl}${cleanPath}?t=${new Date().getTime()}`;
            }
        }
        return null;
    };

    // Handle employee card click
    const handleEmployeeClick = (employee) => {
        setSelectedEmployee(employee);
        setShowEmployeeModal(true);
    };

    // Close modal with smooth animation
    const handleCloseEmployeeModal = () => {
        setIsClosing(true);
        setTimeout(() => {
            setShowEmployeeModal(false);
            setIsClosing(false);
        }, 300);
    };

    // Get role badge color
    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'ADMIN': return 'bg-danger';
            case 'TL': return 'bg-primary';
            case 'EXEC': return 'bg-info';
            case 'EMPL': return 'bg-secondary';
            default: return 'bg-secondary';
        }
    };

    // Fetch departments where user is a team leader
    const fetchTeamLeaderDepartments = async () => {
        try {
            console.log('Fetching team leader departments for user:', leadCrmUser);
            const response = await axios.get(
                buildApiUrl('/departments'),
                { headers: getAuthHeaders() }
            );
            console.log('Departments response:', response);

            if (response.data.success) {
                // Filter departments where user is a team leader
                const userDepartments = response.data.data.filter(dept => {
                    return dept.team_leaders && dept.team_leaders.some(tl => tl.id === leadCrmUser.id);
                });
                console.log('User departments:', userDepartments);
                setDepartments(userDepartments);
                
                // If there's only one department, select it by default
                if (userDepartments.length === 1) {
                    console.log('Auto-selecting single department');
                    handleDepartmentSelect(userDepartments[0]);
                }
            }
        } catch (error) {
            console.error('Error fetching departments:', error);
            showToast('Failed to load departments', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Fetch designations for the department
    const fetchDesignations = async (departmentId) => {
        try {
            console.log('Fetching designations for department:', departmentId);
            const response = await axios.get(
                buildApiUrl(`/departments/${departmentId}/designations`),
                { headers: getAuthHeaders() }
            );
            console.log('Designations response:', response);

            if (response.data.success) {
                console.log('Designations fetched:', response.data.data);
                setDesignations(response.data.data);
            } else {
                console.log('Failed to fetch designations:', response.data.message);
            }
        } catch (error) {
            console.error('Error fetching designations:', error);
            console.error('Error response:', error.response);
            showToast('Failed to load designations', 'error');
        }
    };

    // Fetch employees for the department
    const fetchEmployees = async (departmentId) => {
        try {
            const response = await axios.get(
                buildApiUrl(`/departments/${departmentId}/employees`),
                { headers: getAuthHeaders() }
            );

            if (response.data.success) {
                // Log employee data to debug profile_image
                if (response.data.data && response.data.data.length > 0) {
                    console.log('Employee data sample:', {
                        name: response.data.data[0].name,
                        profile_image: response.data.data[0].profile_image,
                        allFields: Object.keys(response.data.data[0])
                    });
                }
                setEmployees(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
            showToast('Failed to load employees', 'error');
        }
    };

    // Handle department selection
    const handleDepartmentSelect = (department) => {
        console.log('Department selected:', department);
        setSelectedDepartment(department);
        
        // Check if user is department manager for this department
        const isManager = department.manager_id === leadCrmUser.id;
        setIsDepartmentManager(isManager);
        
        if (!isManager) {
            showToast('You do not have permission to access this page', 'error');
            navigate('/dashboard');
        } else {
            // Fetch designations and employees for the selected department
            console.log('Fetching data for department:', department.id);
            fetchDesignations(department.id);
            fetchEmployees(department.id);
        }
    };

    // Show toast notification
    const showToast = (message, type = 'success') => {
        if (type === 'error') {
            toast.error(message);
        } else {
            toast.success(message);
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};
        
        if (!newEmployeeData.name.trim()) {
            newErrors.name = 'Name is required';
        }
        
        if (!newEmployeeData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(newEmployeeData.email)) {
            newErrors.email = 'Email is invalid';
        }
        
        if (!newEmployeeData.mobile.trim()) {
            newErrors.mobile = 'Mobile number is required';
        } else {
            // Accept international format (+91XXXXXXXXXX) or 10-digit Indian number
            const mobileRegex = /^(\+91[6-9]\d{9}|[6-9]\d{9})$/;
            const cleanedMobile = newEmployeeData.mobile.trim().replace(/[\s\-\(\)]/g, '');
            if (!mobileRegex.test(cleanedMobile)) {
                newErrors.mobile = 'Mobile number must be 10 digits (e.g., 9876543210) or international format (e.g., +919876543210)';
            }
        }
        
        // Validate role
        if (!newEmployeeData.role) {
            newErrors.role = 'Role is required';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle input change
    const handleInputChange = (field, value) => {
        setNewEmployeeData({ ...newEmployeeData, [field]: value });
        
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors({ ...errors, [field]: '' });
        }
    };

    // Handle edit input change
    const handleEditInputChange = (field, value) => {
        setEditingEmployee({ ...editingEmployee, [field]: value });
    };

    // Add employee to department (Department Manager only)
    const handleAddEmployee = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            showToast('Please fix the errors in the form', 'error');
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            const response = await axios.post(
                buildApiUrl(`/departments/${selectedDepartment.id}/manager/employees`),
                newEmployeeData,
                { headers: getAuthHeaders() }
            );

            if (response.data.success) {
                showToast('Employee added successfully');
                // Reset form
                setNewEmployeeData({
                    name: '',
                    email: '',
                    mobile: '',
                    // Removed employee_code
                    designation: '', // Changed to text input instead of dropdown
                    joining_date: '',
                    employment_type: 'Full-time',
                    role: 'EMPL' // Default role set to EMPL (Employee)
                });
                // Close modal
                setShowAddModal(false);
                // Refresh employee list
                fetchEmployees(selectedDepartment.id);
            }
        } catch (error) {
            console.error('Error adding employee:', error);
            showToast(error.response?.data?.message || 'Failed to add employee', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Update employee
    const handleUpdateEmployee = async (e) => {
        e.preventDefault();
        
        setIsSubmitting(true);
        
        try {
            const response = await axios.put(
                buildApiUrl(`/departments/${selectedDepartment.id}/manager/employees/${editingEmployee.user_id}`),
                editingEmployee,
                { headers: getAuthHeaders() }
            );

            if (response.data.success) {
                showToast('Employee updated successfully');
                // Close modal
                setShowEditModal(false);
                // Refresh employee list
                fetchEmployees(selectedDepartment.id);
            }
        } catch (error) {
            console.error('Error updating employee:', error);
            showToast(error.response?.data?.message || 'Failed to update employee', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Remove employee from department
    const handleRemoveEmployee = async (employeeId) => {
        if (!window.confirm('Are you sure you want to remove this employee from the department?')) {
            return;
        }
        
        try {
            const response = await axios.delete(
                buildApiUrl(`/departments/${selectedDepartment.id}/manager/employees/${employeeId}`),
                { headers: getAuthHeaders() }
            );

            if (response.data.success) {
                showToast('Employee removed successfully');
                // Refresh employee list
                fetchEmployees(selectedDepartment.id);
            }
        } catch (error) {
            console.error('Error removing employee:', error);
            showToast(error.response?.data?.message || 'Failed to remove employee', 'error');
        }
    };

    // Deactivate employee
    const handleDeactivateEmployee = async (employeeId) => {
        if (!window.confirm('Are you sure you want to deactivate this employee?')) {
            return;
        }
        
        try {
            const response = await axios.put(
                buildApiUrl(`/departments/${selectedDepartment.id}/manager/employees/${employeeId}/deactivate`),
                {},
                { headers: getAuthHeaders() }
            );

            if (response.data.success) {
                showToast('Employee deactivated successfully');
                // Refresh employee list
                fetchEmployees(selectedDepartment.id);
            }
        } catch (error) {
            console.error('Error deactivating employee:', error);
            showToast(error.response?.data?.message || 'Failed to deactivate employee', 'error');
        }
    };

    // Activate employee
    const handleActivateEmployee = async (employeeId) => {
        try {
            const response = await axios.put(
                buildApiUrl(`/departments/${selectedDepartment.id}/manager/employees/${employeeId}/activate`),
                {},
                { headers: getAuthHeaders() }
            );

            if (response.data.success) {
                showToast('Employee activated successfully');
                // Refresh employee list
                fetchEmployees(selectedDepartment.id);
            }
        } catch (error) {
            console.error('Error activating employee:', error);
            showToast(error.response?.data?.message || 'Failed to activate employee', 'error');
        }
    };

    // Reset employee password
    const handleResetPassword = async (employeeId) => {
        if (!window.confirm('Are you sure you want to reset this employee\'s password? They will need to set a new password on their next login.')) {
            return;
        }
        
        try {
            const response = await axios.put(
                buildApiUrl(`/departments/${selectedDepartment.id}/manager/employees/${employeeId}/reset-password`),
                {},
                { headers: getAuthHeaders() }
            );

            if (response.data.success) {
                showToast('Employee password reset successfully');
                // Refresh employee list to show updated status
                fetchEmployees(selectedDepartment.id);
            }
        } catch (error) {
            console.error('Error resetting employee password:', error);
            showToast(error.response?.data?.message || 'Failed to reset employee password', 'error');
        }
    };

    // Handle reset password from modal
    const handleResetPasswordClick = (employee) => {
        handleCloseEmployeeModal();
        handleResetPassword(employee.user_id || employee.id);
    };

    // Filter employees based on search term
    const getFilteredEmployees = () => {
        if (!searchTerm.trim()) {
            return employees;
        }
        
        const term = searchTerm.toLowerCase().trim();
        return employees.filter(employee => 
            employee.name?.toLowerCase().includes(term) ||
            employee.email?.toLowerCase().includes(term) ||
            employee.mobile?.includes(term) ||
            employee.designation?.toLowerCase().includes(term) ||
            employee.role?.toLowerCase().includes(term)
        );
    };

    // Open edit modal
    const openEditModal = async (employee) => {
        try {
            // Fetch the latest employee details
            const response = await axios.get(
                buildApiUrl(`/departments/${selectedDepartment.id}/manager/employees/${employee.user_id}`),
                { headers: getAuthHeaders() }
            );

            if (response.data.success) {
                setEditingEmployee({ 
                    ...response.data.data,
                    // Ensure we have the right field names for the form
                    name: response.data.data.name,
                    email: response.data.data.email,
                    mobile: response.data.data.mobile,
                    designation: response.data.data.designation || '',
                    joining_date: response.data.data.joining_date || '',
                    employment_type: response.data.data.employment_type || 'Full-time',
                    role: response.data.data.role || 'EMPL'
                });
                setShowEditModal(true);
            }
        } catch (error) {
            console.error('Error fetching employee details:', error);
            showToast(error.response?.data?.message || 'Failed to load employee details', 'error');
        }
    };

    // Handle edit from modal
    const handleEditClick = (employee) => {
        handleCloseEmployeeModal();
        openEditModal(employee);
    };

    // Handle reassign (placeholder - can be implemented later)
    const handleReassignClick = (employee) => {
        handleCloseEmployeeModal();
        showToast('Reassign functionality coming soon', 'error');
    };

    // Handle deactivate/activate from modal
    const handleDeactivateClick = (employee) => {
        handleCloseEmployeeModal();
        if (isEmployeeActive(employee)) {
            handleDeactivateEmployee(employee.user_id);
        } else {
            handleActivateEmployee(employee.user_id);
        }
    };

    useEffect(() => {
        fetchTeamLeaderDepartments();
    }, []);

    if (loading) {
        return (
            <div className="main-content">
                <div className="page-content">
                    <div className="container-fluid">
                        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <h6 className="ms-3">Loading departments...</h6>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!isDepartmentManager) {
        return (
            <div className="main-content">
                <div className="page-content">
                    <div className="container-fluid">
                        <div className="row justify-content-center">
                            <div className="col-12 col-md-8 col-lg-6">
                                <div className="card">
                                    <div className="card-body text-center py-5">
                                        <i className="mdi mdi-alert-circle-outline text-warning" style={{ fontSize: '60px' }}></i>
                                        <h5 className="mt-3">Access Denied</h5>
                                        <p className="text-muted mb-4">
                                            You do not have permission to access this page.
                                        </p>
                                        <button 
                                            className="btn btn-outline-primary rounded-pill"
                                            onClick={() => navigate('/dashboard')}
                                        >
                                            <i className="mdi mdi-arrow-left me-1"></i>
                                            Return to Dashboard
                                        </button>
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
                    {/* Header */}
                    <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <div>
                                <h4 className="mb-1">
                                    <i className="mdi mdi-account-multiple me-1"></i>
                                    Department Employees
                                </h4>
                                <p className="text-muted">
                                    Manage employees in {selectedDepartment?.name}
                                </p>
                            </div>
                            <span className="badge bg-success">
                                <i className="mdi mdi-office-building me-1"></i>
                                Department Manager: {leadCrmUser?.name}
                            </span>
                        </div>
                    </div>

                    {/* Department Selection */}
                    {departments.length > 1 && (
                        <div className="card mb-4">
                            <div className="card-header">
                                <h5 className="mb-0">
                                    <i className="mdi mdi-office-building me-1"></i>
                                    Select Department
                                </h5>
                            </div>
                            <div className="card-body">
                                <div className="d-flex flex-wrap gap-2">
                                    {departments.map(dept => (
                                        <button
                                            key={dept.id}
                                            type="button"
                                            className={`btn ${selectedDepartment?.id === dept.id ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => handleDepartmentSelect(dept)}
                                        >
                                            <i className="mdi mdi-office-building me-1"></i>
                                            {dept.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedDepartment && (
                        <div className="card">
                            <div className="card-header">
                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                    <h5 className="mb-0">
                                        <i className="mdi mdi-account-multiple me-1"></i>
                                        Employees in {selectedDepartment.name}
                                    </h5>
                                    <div className="d-flex gap-2 align-items-center">
                                        <div className="input-group" style={{ width: '300px', maxWidth: '100%' }}>
                                            <span className="input-group-text">
                                                <i className="mdi mdi-magnify"></i>
                                            </span>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Search employees..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                            {searchTerm && (
                                                <button
                                                    className="btn btn-outline-secondary"
                                                    type="button"
                                                    onClick={() => setSearchTerm('')}
                                                    title="Clear search"
                                                >
                                                    <i className="mdi mdi-close"></i>
                                                </button>
                                            )}
                                        </div>
                                        <button 
                                            className="btn btn-outline-primary rounded-pill"
                                            onClick={() => setShowAddModal(true)}
                                        >
                                            <i className="mdi mdi-plus me-1"></i>
                                            Add Employee
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="card-body">
                                {employees.length === 0 ? (
                                    <div className="text-center py-5">
                                        <i className="mdi mdi-account-multiple-outline mdi-48px text-muted"></i>
                                        <h5 className="mt-3">No employees found</h5>
                                        <p className="text-muted">
                                            Add employees to your department to get started
                                        </p>
                                        <button 
                                            className="btn btn-outline-primary rounded-pill"
                                            onClick={() => setShowAddModal(true)}
                                        >
                                            <i className="mdi mdi-plus me-1"></i>
                                            Add First Employee
                                        </button>
                                    </div>
                                ) : getFilteredEmployees().length === 0 ? (
                                    <div className="text-center py-5">
                                        <i className="mdi mdi-magnify mdi-48px text-muted"></i>
                                        <h5 className="mt-3">No employees found</h5>
                                        <p className="text-muted">
                                            No employees match your search criteria
                                        </p>
                                        <button 
                                            className="btn btn-outline-secondary rounded-pill"
                                            onClick={() => setSearchTerm('')}
                                        >
                                            <i className="mdi mdi-close me-1"></i>
                                            Clear Search
                                        </button>
                                    </div>
                                ) : (
                                    <div className="row g-3">
                                        {getFilteredEmployees().map((employee) => (
                                            <div key={employee.user_id} className="col-xl-3 col-md-4 col-sm-6">
                                                <div 
                                                    className="card border shadow-sm h-100 position-relative"
                                                    style={{ 
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s ease',
                                                        borderRadius: '12px'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = '';
                                                    }}
                                                    onClick={() => handleEmployeeClick(employee)}
                                                >
                                                    {/* Status Dot - Top Right Corner */}
                                                    <div 
                                                        className="position-absolute"
                                                        style={{
                                                            top: '10px',
                                                            left: '10px',
                                                            width: '15px',
                                                            height: '15px',
                                                            borderRadius: '50%',
                                                            backgroundColor: isEmployeeActive(employee) ? '#28a745' : '#dc3545',
                                                            border: '2px solid white',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                                            zIndex: 10
                                                        }}
                                                        title={isEmployeeActive(employee) ? 'Active' : 'Inactive'}
                                                    ></div>
                                                    
                                                    <div className="card-body text-center">
                                                        <div className="mb-3">
                                                            <div className="avatar-lg mx-auto position-relative" style={{ width: '120px', height: '120px' }}>
                                                                {getProfileImageUrl(employee) ? (
                                                                    <>
                                                                        <img
                                                                            src={getProfileImageUrl(employee)}
                                                                            alt={employee.name}
                                                                            className="rounded-circle card-avatar-image"
                                                                            style={{ 
                                                                                width: '100%', 
                                                                                height: '100%', 
                                                                                objectFit: 'cover',
                                                                                position: 'absolute',
                                                                                top: 0,
                                                                                left: 0,
                                                                                zIndex: 1
                                                                            }}
                                                                            onError={(e) => {
                                                                                e.target.style.display = 'none';
                                                                                const fallback = e.target.parentElement.querySelector('.card-avatar-fallback');
                                                                                if (fallback) {
                                                                                    fallback.style.display = 'flex';
                                                                                }
                                                                            }}
                                                                        />
                                                                        <div 
                                                                            className="avatar-title rounded-circle bg-primary bg-opacity-10 text-primary fs-3 card-avatar-fallback d-flex align-items-center justify-content-center"
                                                                            style={{ 
                                                                                display: 'none', 
                                                                                width: '100%', 
                                                                                height: '100%',
                                                                                position: 'absolute',
                                                                                top: 0,
                                                                                left: 0,
                                                                                zIndex: 0
                                                                            }}
                                                                        >
                                                                            {employee.name.charAt(0).toUpperCase()}
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <div 
                                                                        className="avatar-title rounded-circle bg-primary bg-opacity-10 text-primary fs-3 d-flex align-items-center justify-content-center" 
                                                                        style={{ 
                                                                            width: '100%', 
                                                                            height: '100%',
                                                                            position: 'absolute',
                                                                            top: 0,
                                                                            left: 0
                                                                        }}
                                                                    >
                                                                        {employee.name.charAt(0).toUpperCase()}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <h5 className="mb-2">{employee.name}</h5>
                                                        {/* <div className="mb-2">
                                                            <small className="text-muted d-block">
                                                                {employee.designation || 'Not Assigned'}
                                                            </small>
                                                        </div> */}
                                                        <div className="mb-2">
                                                            <span className={`badge ${getRoleBadgeColor(employee.role)}`}>
                                                                {employee.role === 'ADMIN' ? 'Admin' : 
                                                                 employee.role === 'TL' ? 'Team Leader' : 
                                                                 employee.role === 'EMPL' ? 'Employee' : employee.role}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Employee Modal */}
            <div className={`modal fade ${showAddModal ? 'show' : ''}`} 
                style={{ display: showAddModal ? 'block' : 'none' }} 
                id="addEmployeeModal" 
                tabIndex="-1"
                aria-labelledby="addEmployeeModalLabel"
                aria-hidden={!showAddModal}>
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="addEmployeeModalLabel">
                                <i className="mdi mdi-account-plus me-1"></i>
                                Add New Employee
                            </h5>
                            <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
                        </div>
                        <form onSubmit={handleAddEmployee}>
                            <div className="modal-body">
                                <div className="row">
                                    <div className="col-12 col-md-6 mb-3">
                                        <label className="form-label">Full Name *</label>
                                        <div className="input-group">
                                            <span className="input-group-text">
                                                <i className="mdi mdi-account"></i>
                                            </span>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                                value={newEmployeeData.name}
                                                onChange={(e) => handleInputChange('name', e.target.value)}
                                                placeholder="Enter full name"
                                            />
                                            {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                                        </div>
                                    </div>
                                    
                                    <div className="col-12 col-md-6 mb-3">
                                        <label className="form-label">Email Address *</label>
                                        <div className="input-group">
                                            <span className="input-group-text">
                                                <i className="mdi mdi-email"></i>
                                            </span>
                                            <input
                                                type="email"
                                                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                                value={newEmployeeData.email}
                                                onChange={(e) => handleInputChange('email', e.target.value)}
                                                placeholder="Enter email address"
                                            />
                                            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                                        </div>
                                    </div>
                                    
                                    <div className="col-12 col-md-6 mb-3">
                                        <label className="form-label">Mobile Number *</label>
                                        <div className="input-group">
                                            <span className="input-group-text">
                                                <i className="mdi mdi-cellphone"></i>
                                            </span>
                                            <input
                                                type="tel"
                                                className={`form-control ${errors.mobile ? 'is-invalid' : ''}`}
                                                value={newEmployeeData.mobile}
                                                onChange={(e) => handleInputChange('mobile', e.target.value)}
                                                placeholder="Enter mobile number (e.g., 9876543210 or +919876543210)"
                                                maxLength="15"
                                            />
                                            {errors.mobile && <div className="invalid-feedback">{errors.mobile}</div>}
                                        </div>
                                    </div>
                                    
                                    {/* Removed Employee Code field */}
                                    
                                    <div className="col-12 col-md-6 mb-3">
                                        <label className="form-label">Designation</label>
                                        <div className="input-group">
                                            <span className="input-group-text">
                                                <i className="mdi mdi-briefcase"></i>
                                            </span>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={newEmployeeData.designation}
                                                onChange={(e) => handleInputChange('designation', e.target.value)}
                                                placeholder="Enter or select designation"
                                                list="designation-options"
                                            />
                                        </div>
                                        {designations.length > 0 && (
                                            <div className="mt-2">
                                                <select 
                                                    className="form-select"
                                                    onChange={(e) => handleInputChange('designation', e.target.value)}
                                                    value={newEmployeeData.designation}
                                                >
                                                    <option value="">Select a designation</option>
                                                    {designations.map((designation) => (
                                                        <option key={designation.id} value={designation.title}>
                                                            {designation.title}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                        {designations.length === 0 && (
                                            <div className="mt-2">
                                                <small className="text-muted">No designations available for this department</small>
                                            </div>
                                        )}
                                        <div className="mt-1">
                                            <small className="text-muted">Available designations: {designations.length}</small>
                                        </div>
                                    </div>
                                    
                                    <div className="col-12 col-md-6 mb-3">
                                        <label className="form-label">Joining Date</label>
                                        <div className="input-group">
                                            <span className="input-group-text">
                                                <i className="mdi mdi-calendar"></i>
                                            </span>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={newEmployeeData.joining_date}
                                                onChange={(e) => handleInputChange('joining_date', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="col-12 col-md-6 mb-3">
                                        <label className="form-label">Employment Type</label>
                                        <div className="input-group">
                                            <span className="input-group-text">
                                                <i className="mdi mdi-account-card-details"></i>
                                            </span>
                                            <select
                                                className="form-select"
                                                value={newEmployeeData.employment_type}
                                                onChange={(e) => handleInputChange('employment_type', e.target.value)}
                                            >
                                                <option value="Full-time">Full-time</option>
                                                <option value="Part-time">Part-time</option>
                                                <option value="Contract">Contract</option>
                                                <option value="Intern">Intern</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div className="col-12 col-md-6 mb-3">
                                        <label className="form-label">Role</label>
                                        <div className="input-group">
                                            <span className="input-group-text">
                                                <i className="mdi mdi-account-key"></i>
                                            </span>
                                            <select
                                                className={`form-select ${errors.role ? 'is-invalid' : ''}`}
                                                value={newEmployeeData.role}
                                                onChange={(e) => handleInputChange('role', e.target.value)}
                                            >
                                                <option value="EMPL">Employee</option>
                                                <option value="QA_TESTER">QA Tester</option>
                                            </select>
                                            {errors.role && <div className="invalid-feedback">{errors.role}</div>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline-secondary rounded-pill" onClick={() => setShowAddModal(false)}>
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-outline-primary rounded-pill"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <i className="mdi mdi-content-save me-1"></i>
                                            Add Employee
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Edit Employee Modal */}
            <div className={`modal fade ${showEditModal ? 'show' : ''}`} 
                style={{ display: showEditModal ? 'block' : 'none' }} 
                id="editEmployeeModal" 
                tabIndex="-1"
                aria-labelledby="editEmployeeModalLabel"
                aria-hidden={!showEditModal}>
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="editEmployeeModalLabel">
                                <i className="mdi mdi-account-edit me-1"></i>
                                Edit Employee
                            </h5>
                            <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
                        </div>
                        {editingEmployee && (
                            <form onSubmit={handleUpdateEmployee}>
                                <div className="modal-body">
                                    <div className="row">
                                        <div className="col-12 col-md-6 mb-3">
                                            <label className="form-label">Full Name</label>
                                            <div className="input-group">
                                                <span className="input-group-text">
                                                    <i className="mdi mdi-account"></i>
                                                </span>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={editingEmployee.name || ''}
                                                    onChange={(e) => handleEditInputChange('name', e.target.value)}
                                                    placeholder="Enter full name"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="col-12 col-md-6 mb-3">
                                            <label className="form-label">Email Address</label>
                                            <div className="input-group">
                                                <span className="input-group-text">
                                                    <i className="mdi mdi-email"></i>
                                                </span>
                                                <input
                                                    type="email"
                                                    className="form-control"
                                                    value={editingEmployee.email || ''}
                                                    onChange={(e) => handleEditInputChange('email', e.target.value)}
                                                    placeholder="Enter email address"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="col-12 col-md-6 mb-3">
                                            <label className="form-label">Mobile Number</label>
                                            <div className="input-group">
                                                <span className="input-group-text">
                                                    <i className="mdi mdi-cellphone"></i>
                                                </span>
                                                <input
                                                    type="tel"
                                                    className="form-control"
                                                    value={editingEmployee.mobile || ''}
                                                    onChange={(e) => handleEditInputChange('mobile', e.target.value)}
                                                    placeholder="Enter mobile number (e.g., 9876543210 or +919876543210)"
                                                    maxLength="15"
                                                />
                                            </div>
                                        </div>
                                        
                                        {/* Removed Employee Code field */}
                                        
                                        <div className="col-12 col-md-6 mb-3">
                                            <label className="form-label">Designation</label>
                                            <div className="input-group">
                                                <span className="input-group-text">
                                                    <i className="mdi mdi-briefcase"></i>
                                                </span>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={editingEmployee.designation || ''}
                                                    onChange={(e) => handleEditInputChange('designation', e.target.value)}
                                                    placeholder="Enter or select designation"
                                                />
                                            </div>
                                            {designations.length > 0 && (
                                                <div className="mt-2">
                                                    <select 
                                                        className="form-select"
                                                        onChange={(e) => handleEditInputChange('designation', e.target.value)}
                                                        value={editingEmployee.designation || ''}
                                                    >
                                                        <option value="">Select a designation</option>
                                                        {designations.map((designation) => (
                                                            <option key={designation.id} value={designation.title}>
                                                                {designation.title}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                            {designations.length === 0 && (
                                                <div className="mt-2">
                                                    <small className="text-muted">No designations available for this department</small>
                                                </div>
                                            )}
                                            <div className="mt-1">
                                                <small className="text-muted">Available designations: {designations.length}</small>
                                            </div>
                                        </div>
                                        
                                        <div className="col-12 col-md-6 mb-3">
                                            <label className="form-label">Joining Date</label>
                                            <div className="input-group">
                                                <span className="input-group-text">
                                                    <i className="mdi mdi-calendar"></i>
                                                </span>
                                                <input
                                                    type="date"
                                                    className="form-control"
                                                    value={editingEmployee.joining_date || ''}
                                                    onChange={(e) => handleEditInputChange('joining_date', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="col-12 col-md-6 mb-3">
                                            <label className="form-label">Employment Type</label>
                                            <div className="input-group">
                                                <span className="input-group-text">
                                                    <i className="mdi mdi-account-card-details"></i>
                                                </span>
                                                <select
                                                    className="form-select"
                                                    value={editingEmployee.employment_type || 'Full-time'}
                                                    onChange={(e) => handleEditInputChange('employment_type', e.target.value)}
                                                >
                                                    <option value="Full-time">Full-time</option>
                                                    <option value="Part-time">Part-time</option>
                                                    <option value="Contract">Contract</option>
                                                    <option value="Intern">Intern</option>
                                                </select>
                                            </div>
                                        </div>
                                          <div className="col-12 col-md-6 mb-3">
                                            <label className="form-label">Role</label>
                                            <div className="input-group">
                                                <span className="input-group-text">
                                                    <i className="mdi mdi-account-key"></i>
                                                </span>
                                                <select
                                                    className="form-select"
                                                    value={editingEmployee.role || 'EMPL'}
                                                    onChange={(e) => handleEditInputChange('role', e.target.value)}
                                                >
                                                    <option value="EMPL">Employee</option>
                                                    <option value="QA_TESTER">QA Tester</option>
                                                </select>
                                            </div>
                                        </div>
                                      
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-outline-secondary rounded-pill" onClick={() => setShowEditModal(false)}>
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn btn-outline-primary rounded-pill"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <i className="mdi mdi-content-save me-1"></i>
                                                Update Employee
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal backdrop */}
            {(showAddModal || showEditModal) && (
                <div className="modal-backdrop fade show"></div>
            )}

            {/* Employee Detail Side Modal */}
            {showEmployeeModal && selectedEmployee && (
                <>
                    {/* Light Backdrop - Semi-transparent */}
                    <div 
                        onClick={handleCloseEmployeeModal}
                        style={{ 
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.1)',
                            zIndex: 1040,
                            opacity: isClosing ? 0 : 1,
                            transition: 'opacity 0.3s ease-in'
                        }}
                    ></div>
                    
                    {/* Modal Container - Fixed on right side */}
                    <div 
                        className="modal fade show"
                        style={{ 
                            display: 'block', 
                            zIndex: 1050,
                            position: 'fixed',
                            top: 0,
                            right: 0,
                            left: 'auto',
                            height: '100vh',
                            width: '500px',
                            maxWidth: '90vw',
                            margin: 0,
                            padding: 0,
                            animation: isClosing ? 'slideOutRight 0.3s ease-in' : 'slideInRight 0.3s ease-out',
                            transform: isClosing ? 'translateX(100%)' : 'translateX(0)',
                            transition: isClosing ? 'transform 0.3s ease-in, opacity 0.3s ease-in' : 'none'
                        }}
                        tabIndex="-1"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                handleCloseEmployeeModal();
                            }
                        }}
                    >
                        <div 
                            className="modal-dialog modal-dialog-scrollable h-100 m-0"
                            style={{ 
                                maxWidth: '100%', 
                                width: '100%',
                                margin: 0,
                                position: 'relative',
                                right: 0
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-content h-100 border-0 rounded-0 shadow-lg">
                                {/* Modal Header */}
                                <div className="modal-header text-white border-0" >
                                    <h5 className="modal-title mb-0">
                                        <i className="ri-user-line me-2"></i>
                                        Employee Details
                                    </h5>
                                    <button 
                                        type="button" 
                                        className="btn-close btn-close-white" 
                                        onClick={handleCloseEmployeeModal}
                                        aria-label="Close"
                                    ></button>
                                </div>

                                {/* Modal Body */}
                                <div className="modal-body p-4">
                                    {/* Large Profile Picture */}
                                    <div className="text-center mb-3 pb-3 border-bottom">
                                        <div className="avatar-xxl mx-auto position-relative mb-3" style={{ width: '200px', height: '200px' }}>
                                            {getProfileImageUrl(selectedEmployee) ? (
                                                <>
                                                    <img
                                                        src={getProfileImageUrl(selectedEmployee)}
                                                        alt={selectedEmployee.name}
                                                        className="rounded-circle border border-3 border-primary modal-avatar-image"
                                                        style={{ 
                                                            width: '100%', 
                                                            height: '100%', 
                                                            objectFit: 'cover',
                                                            position: 'absolute',
                                                            top: 0,
                                                            left: 0,
                                                            zIndex: 1
                                                        }}
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            const fallback = e.target.parentElement.querySelector('.modal-avatar-fallback');
                                                            if (fallback) {
                                                                fallback.style.display = 'flex';
                                                            }
                                                        }}
                                                    />
                                                    <div 
                                                        className="avatar-title bg-primary bg-opacity-10 text-primary rounded-circle fs-1 modal-avatar-fallback border border-3 border-primary d-flex align-items-center justify-content-center"
                                                        style={{ 
                                                            display: 'none', 
                                                            width: '100%', 
                                                            height: '100%',
                                                            position: 'absolute',
                                                            top: 0,
                                                            left: 0,
                                                            zIndex: 0
                                                        }}
                                                    >
                                                        {selectedEmployee.name.charAt(0).toUpperCase()}
                                                    </div>
                                                </>
                                            ) : (
                                                <div 
                                                    className="avatar-title bg-primary bg-opacity-10 text-primary rounded-circle fs-1 border border-3 border-primary d-flex align-items-center justify-content-center"
                                                    style={{ 
                                                        width: '100%', 
                                                        height: '100%',
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0
                                                    }}
                                                >
                                                    {selectedEmployee.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <h4 className="mb-1"style={{ color: isEmployeeActive(selectedEmployee) ? '' : '#dc3545' }}
                                        >{selectedEmployee.name}</h4>
                                        <p className="text-muted mb-3">{selectedEmployee.designation || 'Not Assigned'}</p>
                                        
                                        {/* Action Buttons - Icon Only */}
                                        <div className="d-flex justify-content-center gap-2 flex-wrap">
                                            <button
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => handleEditClick(selectedEmployee)}
                                                title="Edit Employee"
                                            >
                                                <i className="ri-edit-line"></i>
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-info"
                                                onClick={() => handleReassignClick(selectedEmployee)}
                                                title="Reassign Employee"
                                            >
                                                <i className="ri-refresh-line"></i>
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={() => {
                                                    handleCloseEmployeeModal();
                                                    navigate(`/admin/employee-tasks?departmentId=${selectedEmployee.departmentId || selectedDepartment?.id}&employeeId=${selectedEmployee.user_id || selectedEmployee.id}&userId=${selectedEmployee.user_id || selectedEmployee.id}`);
                                                }}
                                                title="View Employee Tasks"
                                            >
                                                <i className="ri-task-line"></i>
                                            </button>
                                          
                                            <button
                                                className={`btn btn-sm ${isEmployeeActive(selectedEmployee) ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                                onClick={() => handleDeactivateClick(selectedEmployee)}
                                                title={isEmployeeActive(selectedEmployee) ? 'Deactivate Employee' : 'Activate Employee'}
                                            >
                                                <i className={isEmployeeActive(selectedEmployee) ? 'ri-user-unfollow-line' : 'ri-user-follow-line'}></i>
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => {
                                                    handleCloseEmployeeModal();
                                                    navigate(`/UserProfile?id=${selectedEmployee.user_id || selectedEmployee.id}`);
                                                }}
                                                title="View Employee Profile"
                                            >
                                                <i className="ri-eye-line"></i>
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-info"
                                                onClick={() => handleResetPasswordClick(selectedEmployee)}
                                                title="Reset Password"
                                            >
                                                <i className="ri-lock-password-line"></i>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Employee Information */}
                                    <div className="card border-0 shadow-sm mb-3">
                                        <div className="card-body">
                                            <div className="pt-3">
                                                <div className="mb-3">
                                                    <div className="d-flex align-items-center mb-2">
                                                        <i className="ri-mail-line text-primary me-2 fs-5"></i>
                                                        <div>
                                                            <p className="text-muted mb-0 fs-12 text-uppercase">Email</p>
                                                            <p className="mb-0 fw-medium">{selectedEmployee.email}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {selectedEmployee.mobile && (
                                                    <div className="mb-3">
                                                        <div className="d-flex align-items-center mb-2">
                                                            <i className="ri-phone-line text-primary me-2 fs-5"></i>
                                                            <div>
                                                                <p className="text-muted mb-0 fs-12 text-uppercase">Mobile</p>
                                                                <p className="mb-0 fw-medium">{selectedEmployee.mobile}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="mb-3">
                                                    <div className="d-flex align-items-center mb-2">
                                                        <i className="ri-shield-user-line text-primary me-2 fs-5"></i>
                                                        <div>
                                                            <p className="text-muted mb-0 fs-12 text-uppercase">Role</p>
                                                            <p className="mb-0">
                                                                <span className={`badge ${getRoleBadgeColor(selectedEmployee.role)}`}>
                                                                    {selectedEmployee.role === 'ADMIN' ? 'Admin' : 
                                                                     selectedEmployee.role === 'TL' ? 'Team Leader' : 
                                                                     selectedEmployee.role === 'EMPL' ? 'Employee' : selectedEmployee.role}
                                                                </span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mb-3">
                                                    <div className="d-flex align-items-center mb-2">
                                                        <i className="ri-building-line text-primary me-2 fs-5"></i>
                                                        <div>
                                                            <p className="text-muted mb-0 fs-12 text-uppercase">Department</p>
                                                            <p className="mb-0">
                                                                <span className="badge bg-primary">
                                                                    {selectedDepartment?.name || 'Unassigned'}
                                                                </span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mb-3">
                                                    <div className="d-flex align-items-center mb-2">
                                                        <i className="ri-checkbox-circle-line text-primary me-2 fs-5"></i>
                                                        <div>
                                                            <p className="text-muted mb-0 fs-12 text-uppercase">Status</p>
                                                            <p className="mb-0">
                                                                <span className={`badge ${isEmployeeActive(selectedEmployee) ? 'bg-success' : 'bg-secondary'}`}>
                                                                    {isEmployeeActive(selectedEmployee) ? 'Active' : 'Inactive'}
                                                                </span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {selectedEmployee.joining_date && (
                                                    <div className="mb-3">
                                                        <div className="d-flex align-items-center mb-2">
                                                            <i className="ri-calendar-check-line text-primary me-2 fs-5"></i>
                                                            <div>
                                                                <p className="text-muted mb-0 fs-12 text-uppercase">Joining Date</p>
                                                                <p className="mb-0 fw-medium">
                                                                    {new Date(selectedEmployee.joining_date).toLocaleDateString('en-US', {
                                                                        year: 'numeric',
                                                                        month: 'long',
                                                                        day: 'numeric'
                                                                    })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedEmployee.employment_type && (
                                                    <div className="mb-3">
                                                        <div className="d-flex align-items-center mb-2">
                                                            <i className="ri-briefcase-line text-primary me-2 fs-5"></i>
                                                            <div>
                                                                <p className="text-muted mb-0 fs-12 text-uppercase">Employment Type</p>
                                                                <p className="mb-0 fw-medium">{selectedEmployee.employment_type}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Add CSS animations for slide in and slide out */}
                    <style>{`
                        @keyframes slideInRight {
                            from {
                                transform: translateX(100%);
                                opacity: 0;
                            }
                            to {
                                transform: translateX(0);
                                opacity: 1;
                            }
                        }
                        @keyframes slideOutRight {
                            from {
                                transform: translateX(0);
                                opacity: 1;
                            }
                            to {
                                transform: translateX(100%);
                                opacity: 0;
                            }
                        }
                        @media (max-width: 576px) {
                            .modal[style*="width: 500px"] {
                                width: 90vw !important;
                                max-width: 90vw !important;
                            }
                        }
                    `}</style>
                </>
            )}
        </div>
    );
};

export default AddEmployeeToDepartment;