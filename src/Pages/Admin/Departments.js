import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_ENDPOINTS, buildApiUrl, getAuthHeaders } from '../../config/api';
import { ConfigContext } from '../../Context/ConfigContext';
import Snowfall from 'react-snowfall';


const Departments = () => {
    const { hasRole } = useContext(ConfigContext);
    const navigate = useNavigate();
    
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showActionModal, setShowActionModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [actionType, setActionType] = useState(''); // 'deactivate', 'activate', 'delete'
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [viewMode, setViewMode] = useState('card'); // 'card' or 'list'
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name'); // 'name', 'created_at', 'employee_count'
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    
    // Check if user has admin role
    // useEffect(() => {
    //     if (!hasRole(['ADMIN'])) {
    //         toast.error('Access denied. Admin role required.');
    //         navigate('/dashboard'); // Redirect to dashboard if not admin
    //     }
    // }, [hasRole, navigate]);

    // Early return if user doesn't have admin role
    // if (!hasRole(['ADMIN'])) {
    //     return null; // The redirect happens in useEffect
    // }

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const response = await axios.get(buildApiUrl(API_ENDPOINTS.DEPARTMENTS.BASE), {
                headers: getAuthHeaders()
            });
            
            if (response.data.success) {
                console.log('📊 Departments fetched:', response.data.data);
                console.log('Total employee count from backend:', response.data.data.reduce((sum, dept) => sum + (dept.employee_count || 0), 0));
                setDepartments(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching departments:', error);
            toast.error('Failed to fetch departments');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDepartment = async (e) => {
        e.preventDefault();
        
        if (!formData.name) {
            toast.warning('Please fill in the department name');
            return;
        }

        try {
            const response = await axios.post(buildApiUrl(API_ENDPOINTS.DEPARTMENTS.BASE), {
                name: formData.name,
                description: formData.description
            }, {
                headers: getAuthHeaders()
            });
            
            if (response.data.success) {
                toast.success('Department created successfully');
                setShowCreateModal(false);
                setFormData({ name: '', description: '' });
                fetchDepartments();
            }
        } catch (error) {
            
            toast.error(error.response?.data?.message || 'Failed to create department');
        }
    };

    const handleDeleteDepartment = async () => {
        try {
            const response = await axios.delete(
                buildApiUrl(`/departments/${selectedDepartment.id}`),
                { headers: getAuthHeaders() }
            );
            
            if (response.data.success) {
                toast.success('Department deleted successfully');
                setShowDeleteModal(false);
                setSelectedDepartment(null);
                fetchDepartments();
            }
        } catch (error) {
            
            toast.error(error.response?.data?.message || 'Failed to delete department');
        }
    };

    // Add this function for editing department
    const handleEditDepartment = async (e) => {
        e.preventDefault();
        
        if (!formData.name) {
            toast.warning('Please fill in the department name');
            return;
        }

        try {
            const response = await axios.put(
                buildApiUrl(`/departments/${selectedDepartment.id}`),
                {
                    name: formData.name,
                    description: formData.description
                },
                { headers: getAuthHeaders() }
            );
            
            if (response.data.success) {
                toast.success('Department updated successfully');
                setShowEditModal(false);
                setFormData({ name: '', description: '' });
                fetchDepartments();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update department');
        }
    };

    const handleDepartmentAction = async () => {
        try {
            let endpoint = '';
            let successMessage = '';
            
            switch (actionType) {
                case 'deactivate':
                    endpoint = `/departments/${selectedDepartment.id}/deactivate`;
                    successMessage = 'Department deactivated successfully';
                    break;
                case 'activate':
                    endpoint = `/departments/${selectedDepartment.id}/activate`;
                    successMessage = 'Department activated successfully';
                    break;
                case 'delete':
                    endpoint = `/departments/${selectedDepartment.id}/permanent-delete`;
                    successMessage = 'Department permanently deleted';
                    break;
                default:
                    return;
            }

            const response = await axios.delete(
                buildApiUrl(endpoint),
                { headers: getAuthHeaders() }
            );
            
            if (response.data.success) {
                toast.success(successMessage);
                setShowActionModal(false);
                setSelectedDepartment(null);
                setActionType('');
                fetchDepartments();
            }
        } catch (error) {
            
            toast.error(error.response?.data?.message || `Failed to ${actionType} department`);
        }
    };

    const openActionModal = (department, action) => {
        setSelectedDepartment(department);
        setActionType(action);
        setShowActionModal(true);
    };

    const openInfoModal = (department) => {
        setSelectedDepartment(department);
        setShowInfoModal(true);
    };

    const openDeleteModal = (department) => {
        setSelectedDepartment(department);
        setShowDeleteModal(true);
    };

    // Add this function to open edit modal with department data
    const openEditModal = (department) => {
        setSelectedDepartment(department);
        setFormData({
            name: department.name,
            description: department.description || ''
        });
        setShowEditModal(true);
    };

    const handleDepartmentClick = (department) => {
        navigate(`/admin/department/${department.id}`, { state: { department } });
    };

    // Filter and sort departments
    const filteredDepartments = departments
        .filter(dept => 
            dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        .sort((a, b) => {
            let aValue, bValue;
            
            switch (sortBy) {
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'created_at':
                    aValue = new Date(a.created_at);
                    bValue = new Date(b.created_at);
                    break;
                case 'employee_count':
                    aValue = a.employee_count || 0;
                    bValue = b.employee_count || 0;
                    break;
                default:
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
            }
            
            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

    if (loading) {
        return (
            <div className="main-content">
                <div className="page-content">
                    <div className="container-fluid">
                        <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
                            <div className="spinner-border text-muted" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
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
                            color="rgba(105, 239, 251, 0.8)" // Light blue/ice color
                        />
                        {/* Header */}
                        <div className="row mb-4">
                            <div className="col-12">
                                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                                    <div>
                                        <h4 className="mb-1">Departments</h4>
                                        <p className="text-muted mb-0">Manage your organization's departments</p>
                                    </div>
                                    <button 
                                        className="btn btn-outline-primary px-4 py-2 rounded-pill"
                                        onClick={() => setShowCreateModal(true)}
                                    >
                                        <i className="ri-add-line me-2"></i>
                                        Add Department
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="row mb-4">
                            <div className="col-12">
                                <div className="card border-0 shadow-sm">
                                    <div className="card-body">
                                        <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
                                            {/* Search */}
                                            <div style={{ maxWidth: '250px' }}>
                                                <div className="input-group">
                                                    <span className="input-group-text bg-white border-end-0">
                                                        <i className="ri-search-line text-muted"></i>
                                                    </span>
                                                    <input
                                                        type="text"
                                                        className="form-control border-start-0"
                                                        placeholder="Search departments..."
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            
                                            {/* View Mode Toggle */}
                                            <div className="d-flex gap-2">
                                                <div className="btn-group" role="group">
                                                    <button
                                                        type="button"
                                                        className={`btn btn-sm ${viewMode === 'card' ? 'btn-outline-primary' : 'btn-outline-secondary'}`}
                                                        onClick={() => setViewMode('card')}
                                                        title="Card View"
                                                    >
                                                        <i className="ri-grid-line"></i>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`btn btn-sm ${viewMode === 'list' ? 'btn-outline-primary' : 'btn-outline-secondary'}`}
                                                        onClick={() => setViewMode('list')}
                                                        title="List View"
                                                    >
                                                        <i className="ri-list-unordered"></i>
                                                    </button>
                                                </div>
                                                
                                                {/* Sort */}
                                                <select 
                                                    className="form-select form-select-sm"
                                                    value={`${sortBy}-${sortOrder}`}
                                                    onChange={(e) => {
                                                        const [field, order] = e.target.value.split('-');
                                                        setSortBy(field);
                                                        setSortOrder(order);
                                                    }}
                                                >
                                                    <option value="name-asc">Name (A-Z)</option>
                                                    <option value="name-desc">Name (Z-A)</option>
                                                    <option value="created_at-desc">Newest First</option>
                                                    <option value="created_at-asc">Oldest First</option>
                                                    <option value="employee_count-desc">Most Employees</option>
                                                    <option value="employee_count-asc">Fewest Employees</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="row mb-4">
                            <div className="col-md-3 col-6">
                                <div className="card border-0 shadow-sm h-100">
                                    <div className="card-body">
                                        <div className="d-flex align-items-center">
                                            <div className="flex-shrink-0 bg-primary bg-opacity-10 rounded-3 p-3">
                                                <i className="ri-building-2-line text-primary fs-4"></i>
                                            </div>
                                            <div className="flex-grow-1 ms-3">
                                                <h5 className="mb-1">{departments.length}</h5>
                                                <p className="text-muted mb-0 small">Total Departments</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3 col-6">
                                <div className="card border-0 shadow-sm h-100">
                                    <div className="card-body">
                                        <div className="d-flex align-items-center">
                                            <div className="flex-shrink-0 bg-success bg-opacity-10 rounded-3 p-3">
                                                <i className="ri-checkbox-circle-line text-success fs-4"></i>
                                            </div>
                                            <div className="flex-grow-1 ms-3">
                                                <h5 className="mb-1">
                                                    {departments.filter(d => d.is_active).length}
                                                </h5>
                                                <p className="text-muted mb-0 small">Active</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3 col-6">
                                <div className="card border-0 shadow-sm h-100">
                                    <div className="card-body">
                                        <div className="d-flex align-items-center">
                                            <div className="flex-shrink-0 bg-warning bg-opacity-10 rounded-3 p-3">
                                                <i className="ri-pause-circle-line text-warning fs-4"></i>
                                            </div>
                                            <div className="flex-grow-1 ms-3">
                                                <h5 className="mb-1">
                                                    {departments.filter(d => !d.is_active).length}
                                                </h5>
                                                <p className="text-muted mb-0 small">Inactive</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3 col-6">
                                <div className="card border-0 shadow-sm h-100">
                                    <div className="card-body">
                                        <div className="d-flex align-items-center">
                                            <div className="flex-shrink-0 bg-info bg-opacity-10 rounded-3 p-3">
                                                <i className="ri-group-line text-info fs-4"></i>
                                            </div>
                                            <div className="flex-grow-1 ms-3">
                                                <h5 className="mb-1">
                                                    {(() => {
                                                        const totalEmployees = departments.reduce((sum, dept) => {
                                                            const count = parseInt(dept.employee_count) || 0;
                                                            console.log(`Department ${dept.name}: ${count} employees`);
                                                            return sum + count;
                                                        }, 0);
                                                        console.log('📊 Total employees calculated:', totalEmployees);
                                                        return totalEmployees;
                                                    })()}
                                                </h5>
                                                <p className="text-muted mb-0 small">Total Employees</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Departments Content */}
                        <div className="row">
                            <div className="col-12">
                                {/* Removed card container to eliminate background color */}
                                <div>
                                    <div>
                                        {viewMode === 'card' ? (
                                            // Card View
                                            <>
                                                {filteredDepartments.length > 0 ? (
                                                    <div className="row g-4">
                                                        {filteredDepartments.map((dept) => (
                                                            <div key={dept.id} className="col-xl-4 col-lg-6 col-md-6">
                                                                <div 
                                                                    className="card h-100 border-0 shadow-sm department-card"
                                                                    style={{ 
                                                                        cursor: 'pointer',
                                                                        transition: 'all 0.3s ease',
                                                                        backgroundColor: 'var(--vz-card-bg)',
                                                                        color: 'var(--vz-body-color)'
                                                                    }}
                                                                    onClick={() => handleDepartmentClick(dept)}
                                                                >
                                                                    <div className="card-body p-4" style={{ color: 'var(--vz-body-color)' }}>
                                                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                                                            <div className="flex-grow-1">
                                                                                <h5 className="card-title mb-1" style={{ color: 'var(--vz-heading-color)' }}>{dept.name}</h5>
                                                                            </div>
                                                                            <div className="dropdown">
                                                                                <button 
                                                                                    className="btn btn-sm p-0" 
                                                                                    type="button" 
                                                                                    data-bs-toggle="dropdown"
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                    style={{ 
                                                                                        border: 'none',
                                                                                        borderRadius: '50%',
                                                                                        width: '32px',
                                                                                        height: '32px',
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        justifyContent: 'center',
                                                                                        color: 'var(--vz-body-color)',
                                                                                        backgroundColor: 'transparent'
                                                                                    }}
                                                                                >
                                                                                    <i className="ri-more-2-fill"></i>
                                                                                </button>
                                                                                <ul className="dropdown-menu dropdown-menu-end">
                                                                                    <li>
                                                                                        <button 
                                                                                            className="dropdown-item d-flex align-items-center"
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                openInfoModal(dept);
                                                                                            }}
                                                                                        >
                                                                                            <i className="ri-information-line me-2"></i>
                                                                                            View Details
                                                                                        </button>
                                                                                    </li>
                                                                                    <li>
                                                                                        <button 
                                                                                            className="dropdown-item d-flex align-items-center text-primary"
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                openEditModal(dept);
                                                                                            }}
                                                                                        >
                                                                                            <i className="ri-edit-line me-2"></i>
                                                                                            Edit Department
                                                                                        </button>
                                                                                    </li>
                                                                                    <li>
                                                                                        <button 
                                                                                            className={`dropdown-item d-flex align-items-center ${dept.is_active ? 'text-warning' : 'text-success'}`}
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                openActionModal(dept, dept.is_active ? 'deactivate' : 'activate');
                                                                                            }}
                                                                                        >
                                                                                            <i className={`${dept.is_active ? 'ri-pause-circle-line' : 'ri-play-circle-line'} me-2`}></i>
                                                                                            {dept.is_active ? 'Deactivate' : 'Activate'}
                                                                                        </button>
                                                                                    </li>
                                                                                    <li>
                                                                                        <button 
                                                                                            className="dropdown-item d-flex align-items-center text-danger"
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                openActionModal(dept, 'delete');
                                                                                            }}
                                                                                        >
                                                                                            <i className="ri-delete-bin-line me-2"></i>
                                                                                            Permanently Delete
                                                                                        </button>
                                                                                    </li>
                                                                                </ul>
                                                                            </div>
                                                                        </div>

                                                                        {dept.description && (
                                                                            <p className="mb-3 small" style={{ color: 'var(--vz-secondary-color)' }}>{dept.description}</p>
                                                                        )}

                                                                        <div className="row g-3 mb-3">
                                                                            <div className="col-6">
                                                                                <div className="text-center p-3 rounded-3" style={{ 
                                                                                    backgroundColor: 'var(--vz-card-bg-custom, var(--vz-light))', 
                                                                                    border: '1px solid var(--vz-border-color)',
                                                                                    color: 'var(--vz-body-color)'
                                                                                }}>
                                                                                    <h6 className="mb-1" style={{ color: 'var(--vz-heading-color)' }}>{dept.employee_count || 0}</h6>
                                                                                    <p className="mb-0 fs-13" style={{ color: 'var(--vz-secondary-color)' }}> Total Employees</p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="col-6">
                                                                                <div className="text-center p-3 rounded-3" style={{ 
                                                                                    backgroundColor: 'var(--vz-card-bg-custom, var(--vz-light))', 
                                                                                    border: '1px solid var(--vz-border-color)',
                                                                                    color: 'var(--vz-body-color)'
                                                                                }}>
                                                                                    <h6 className="mb-1" style={{ color: 'var(--vz-heading-color)' }}>{dept.team_leaders ? dept.team_leaders.length : 0}</h6>
                                                                                    <p className="mb-0 fs-13" style={{ color: 'var(--vz-secondary-color)' }}>Team Leaders</p>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {dept.manager_name && (
                                                                            <div className="d-flex align-items-center mb-3">
                                                                                <div className="avatar-xs me-2">
                                                                                    <div className="avatar-title rounded-circle bg-primary bg-opacity-10 text-primary fs-16">
                                                                                        <i className="ri-user-line"></i>
                                                                                    </div>
                                                                                </div>
                                                                                <div>
                                                                                    <p className="mb-0 fw-medium fs-14" style={{ color: 'var(--vz-body-color)' }}>{dept.manager_name}</p>
                                                                                    <p className="mb-0 fs-12" style={{ color: 'var(--vz-secondary-color)' }}>Department Manager</p>
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        <div className="d-flex justify-content-between align-items-center fs-13" style={{ color: 'var(--vz-secondary-color)' }}>
                                                                            <span>
                                                                                <i className="ri-calendar-line me-1"></i>
                                                                                {new Date(dept.created_at).toLocaleDateString()}
                                                                            </span>
                                                                            <span className={`badge ${dept.is_active ? 'bg-success' : 'bg-secondary'} bg-opacity-10`} style={{ color: dept.is_active ? 'var(--vz-success)' : 'var(--vz-secondary)' }}>
                                                                                {dept.is_active ? 'Active' : 'Inactive'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-5">
                                                        <div className="mb-3">
                                                            <i className="ri-building-line display-4 text-muted"></i>
                                                        </div>
                                                        <h5 className="mb-3">No Departments Found</h5>
                                                        <p className="text-muted mb-4">
                                                            {searchTerm ? 'No departments match your search criteria' : 'Get started by creating your first department'}
                                                        </p>
                                                        <button 
                                                            className="btn btn-outline-primary px-4 py-2 rounded-pill"
                                                            onClick={() => setShowCreateModal(true)}
                                                        >
                                                            <i className="ri-add-line me-1"></i>
                                                            Create Department
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            // List View
                                            <div className="table-responsive">
                                                {filteredDepartments.length > 0 ? (
                                                    <table className="table table-hover align-middle">
                                                        <thead className="table-light">
                                                            <tr>
                                                                <th>Department</th>
                                                               
                                                                <th>Manager</th>
                                                                <th>Employees</th>
                                                                <th>Status</th>
                                                                <th>Created</th>
                                                                <th>Team Leaders</th>
                                                                <th>Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {filteredDepartments.map((dept) => (
                                                                <tr 
                                                                    key={dept.id} 
                                                                    style={{ cursor: 'pointer' }}
                                                                    onClick={() => handleDepartmentClick(dept)}
                                                                >
                                                                    <td>
                                                                        <div>
                                                                            <h6 className="mb-1">{dept.name}</h6>
                                                                            {dept.description && (
                                                                                <p className="text-muted mb-0 fs-13">{dept.description}</p>
                                                                            )}
                                                                        </div>
                                                                    </td>

                                                                    <td>
                                                                        {dept.manager_name ? (
                                                                            <div className="d-flex align-items-center">
                                                                                <div className="avatar-xs me-2">
                                                                                    <div className="avatar-title rounded-circle bg-primary bg-opacity-10 text-primary fs-16">
                                                                                        <i className="ri-user-line"></i>
                                                                                    </div>
                                                                                </div>
                                                                                <div>
                                                                                    <p className="mb-0 fw-medium fs-14">{dept.manager_name}</p>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-muted">No manager assigned</span>
                                                                        )}
                                                                    </td>
                                                                    <td>
                                                                        <span className="badge bg-info bg-opacity-10 text-info">
                                                                            {dept.employee_count || 0} employees
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        <span className={`badge ${dept.is_active ? 'bg-success' : 'bg-secondary'} bg-opacity-10`}>
                                                                            {dept.is_active ? 'Active' : 'Inactive'}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        <span className="text-muted fs-13">
                                                                            {new Date(dept.created_at).toLocaleDateString()}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        {dept.team_leaders && dept.team_leaders.length > 0 ? (
                                                                            <div className="d-flex flex-wrap gap-1">
                                                                                {dept.team_leaders.slice(0, 2).map((leader, index) => (
                                                                                    <span key={leader.id} className="badge bg-primary bg-opacity-10 text-primary">
                                                                                        {leader.name}
                                                                                    </span>
                                                                                ))}
                                                                                {dept.team_leaders.length > 2 && (
                                                                                    <span className="badge bg-secondary bg-opacity-10 text-secondary">
                                                                                        +{dept.team_leaders.length - 2} more
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-muted">No team leaders</span>
                                                                        )}
                                                                    </td>
                                                                    <td>
                                                                        <div className="dropdown">
                                                                            <button 
                                                                                className="btn btn-sm btn-outline-secondary" 
                                                                                type="button" 
                                                                                data-bs-toggle="dropdown"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            >
                                                                                <i className="ri-more-2-fill"></i>
                                                                            </button>
                                                                            <ul className="dropdown-menu dropdown-menu-end">
                                                                                <li>
                                                                                    <button 
                                                                                        className="dropdown-item d-flex align-items-center"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            openInfoModal(dept);
                                                                                        }}
                                                                                    >
                                                                                        <i className="ri-information-line me-2"></i>
                                                                                        View Details
                                                                                    </button>
                                                                                </li>
                                                                                <li>
                                                                                    <button 
                                                                                        className={`dropdown-item d-flex align-items-center ${dept.is_active ? 'text-warning' : 'text-success'}`}
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            openActionModal(dept, dept.is_active ? 'deactivate' : 'activate');
                                                                                        }}
                                                                                    >
                                                                                        <i className={`${dept.is_active ? 'ri-pause-circle-line' : 'ri-play-circle-line'} me-2`}></i>
                                                                                        {dept.is_active ? 'Deactivate' : 'Activate'}
                                                                                    </button>
                                                                                </li>
                                                                                <li>
                                                                                    <button 
                                                                                        className="dropdown-item d-flex align-items-center text-danger"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            openActionModal(dept, 'delete');
                                                                                        }}
                                                                                    >
                                                                                        <i className="ri-delete-bin-line me-2"></i>
                                                                                        Permanently Delete
                                                                                    </button>
                                                                                </li>
                                                                            </ul>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                ) : (
                                                    <div className="text-center py-5">
                                                        <div className="mb-3">
                                                            <i className="ri-building-line display-4 text-muted"></i>
                                                        </div>
                                                        <h5 className="mb-3">No Departments Found</h5>
                                                        <p className="text-muted mb-4">
                                                            {searchTerm ? 'No departments match your search criteria' : 'Get started by creating your first department'}
                                                        </p>
                                                        <button 
                                                            className="btn btn-outline-primary px-4 py-2 rounded-pill"
                                                            onClick={() => setShowCreateModal(true)}
                                                        >
                                                            <i className="ri-add-line me-1"></i>
                                                            Create Department
                                                        </button>
                                                    </div>
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

            {/* Create Department Modal */}
            {showCreateModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-semibold">Create New Department</h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setShowCreateModal(false)}
                                ></button>
                            </div>
                            <form onSubmit={handleCreateDepartment}>
                                <div className="modal-body pt-2">
                                    <div className="mb-3">
                                        <label className="form-label fw-medium">Department Name *</label>
                                        <input
                                            type="text"
                                            className="form-control rounded-3"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            placeholder="Enter department name"
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-medium">Description</label>
                                        <textarea
                                            className="form-control rounded-3"
                                            rows="3"
                                            value={formData.description}
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                            placeholder="Brief description of the department"
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer border-0 pt-0">
                                    <button 
                                        type="button" 
                                        className="btn btn-light px-4 py-2 rounded-pill"
                                        onClick={() => setShowCreateModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn btn-outline-primary px-4 py-2 rounded-pill"
                                    >
                                        Create Department
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Info Modal */}
            {showInfoModal && selectedDepartment && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-semibold">Department Information</h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setShowInfoModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body pt-2">
                                <div className="row g-3">
                                    <div className="col-12">
                                        <div className="p-3 bg-light rounded-3">
                                            <h6 className="mb-2">{selectedDepartment.name}</h6>
                                        </div>
                                    </div>
                                    {selectedDepartment.description && (
                                        <div className="col-12">
                                            <label className="form-label text-muted small">Description</label>
                                            <p className="mb-0">{selectedDepartment.description}</p>
                                        </div>
                                    )}
                                    <div className="col-6">
                                        <label className="form-label text-muted small">Manager</label>
                                        <p className="mb-0">
                                            {selectedDepartment.manager_name || 'Not assigned'}
                                        </p>
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label text-muted small">Employees</label>
                                        <p className="mb-0">{selectedDepartment.employee_count || 0}</p>
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label text-muted small">Status</label>
                                        <p className="mb-0">
                                            <span className={`badge ${selectedDepartment.is_active ? 'bg-success' : 'bg-secondary'} `}>
                                                {selectedDepartment.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </p>
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label text-muted small">Created</label>
                                        <p className="mb-0">
                                            {new Date(selectedDepartment.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer border-0 pt-0">
                                <button 
                                    type="button" 
                                    className="btn btn-light px-4 py-2 rounded-pill"
                                    onClick={() => setShowInfoModal(false)}
                                >
                                    Close
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-outline-primary px-4 py-2 rounded-pill"
                                    onClick={() => {
                                        setShowInfoModal(false);
                                        handleDepartmentClick(selectedDepartment);
                                    }}
                                >
                                    View Details
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Department Modal */}
            {showEditModal && selectedDepartment && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-semibold">Edit Department</h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setShowEditModal(false)}
                                ></button>
                            </div>
                            <form onSubmit={handleEditDepartment}>
                                <div className="modal-body pt-2">
                                    <div className="mb-3">
                                        <label className="form-label fw-medium">Department Name *</label>
                                        <input
                                            type="text"
                                            className="form-control rounded-3"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            placeholder="Enter department name"
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-medium">Description</label>
                                        <textarea
                                            className="form-control rounded-3"
                                            rows="3"
                                            value={formData.description}
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                            placeholder="Brief description of the department"
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer border-0 pt-0">
                                    <button 
                                        type="button" 
                                        className="btn btn-light px-4 py-2 rounded-pill"
                                        onClick={() => setShowEditModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn btn-outline-primary px-4 py-2 rounded-pill"
                                    >
                                        Update Department
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Confirmation Modal */}
            {showActionModal && selectedDepartment && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-semibold">
                                    Confirm {actionType === 'delete' ? 'Permanent Delete' : actionType === 'deactivate' ? 'Deactivate' : 'Activate'}
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setShowActionModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body pt-2">
                                <div className="text-center">
                                    <div className="mb-3">
                                        <i className={`display-4 ${
                                            actionType === 'delete' ? 'ri-error-warning-line text-danger' :
                                            actionType === 'deactivate' ? 'ri-pause-circle-line text-warning' :
                                            'ri-play-circle-line text-success'
                                        }`}></i>
                                    </div>
                                    <h6 className="mb-2">
                                        {actionType === 'delete' ? 'Permanently Delete Department' : 
                                         actionType === 'deactivate' ? 'Deactivate Department' : 
                                         'Activate Department'}
                                    </h6>
                                    <p className="text-muted mb-0">
                                        {actionType === 'delete' ? 
                                            `Are you sure you want to permanently delete ${selectedDepartment.name}? This action cannot be undone and will remove all associated data.` :
                                         actionType === 'deactivate' ?
                                            `Are you sure you want to deactivate ${selectedDepartment.name}? This will hide the department from active lists.` :
                                            `Are you sure you want to activate ${selectedDepartment.name}? This will make the department visible in active lists.`
                                        }
                                    </p>
                                </div>
                            </div>
                            <div className="modal-footer border-0 pt-0 justify-content-center">
                                <button 
                                    type="button" 
                                    className="btn btn-light px-4 py-2 rounded-pill me-2"
                                    onClick={() => setShowActionModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className={`btn px-4 py-2 rounded-pill ${
                                        actionType === 'delete' ? 'btn-danger' :
                                        actionType === 'deactivate' ? 'btn-warning' :
                                        'btn-success'
                                    }`}
                                    onClick={handleDepartmentAction}
                                >
                                    {actionType === 'delete' ? 'Permanently Delete' : 
                                     actionType === 'deactivate' ? 'Deactivate' : 
                                     'Activate'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                /* Theme-aware styling for consistent dark/light mode */
                .department-card {
                    background-color: var(--vz-card-bg, var(--vz-secondary-bg));
                }
                
                .department-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.08) !important;
                    border-color: var(--vz-border-color) !important;
                    background-color: var(--vz-card-bg, var(--vz-secondary-bg)) !important;
                }
                
                .table tbody tr:hover {
                    background-color: var(--vz-gray-100) !important;
                }
                
                .btn-group .btn {
                    border-radius: 0.5rem;
                }
                
                .btn-group .btn:first-child {
                    border-top-right-radius: 0;
                    border-bottom-right-radius: 0;
                }
                
                .btn-group .btn:last-child {
                    border-top-left-radius: 0;
                    border-bottom-left-radius: 0;
                }
                
                .form-control, .form-select {
                    border-color: var(--vz-border-color);
                }
                
                .form-control:focus, .form-select:focus {
                    border-color: var(--vz-primary);
                    box-shadow: 0 0 0 0.2rem rgba(104, 124, 254, 0.25);
                }
                
                .card {
                    border-radius: 1rem;
                    background-color: var(--vz-card-bg, var(--vz-secondary-bg));
                    border: 1px solid var(--vz-border-color);
                }
                
                .card-header {
                    background-color: var(--vz-card-bg, var(--vz-secondary-bg));
                }
                
                .badge {
                    padding: 0.5em 0.75em;
                }
                
                .rounded-pill {
                    border-radius: 50rem !important;
                }
                
                /* Improved theme consistency */
                .btn-primary {
                    background-color: var(--vz-primary);
                    border-color: var(--vz-primary);
                }
                
                .btn-primary:hover {
                    background-color: var(--vz-primary-darken);
                    border-color: var(--vz-primary-darken);
                }
                
                .table-light {
                    background-color: var(--vz-table-head-bg);
                }
                
                .bg-light {
                    background-color: var(--vz-gray-100) !important;
                }
                
                /* Ensure proper text color in dark mode */
                .card-title {
                    color: var(--vz-heading-color);
                }
                
                .text-muted {
                    color: var(--vz-secondary-color) !important;
                }
                
                /* Theme-aware dropdown menu */
                .dropdown-menu {
                    background-color: var(--vz-dropdown-bg, var(--vz-secondary-bg));
                    border-color: var(--vz-border-color);
                }
                
                .dropdown-item {
                    color: var(--vz-dropdown-link-color, var(--vz-body-color));
                }
                
                .dropdown-item:hover {
                    background-color: var(--vz-dropdown-link-hover-bg, var(--vz-gray-100));
                }
                
                /* Theme-aware table */
                .table {
                    --vz-table-color: var(--vz-body-color);
                    --vz-table-bg: transparent;
                    --vz-table-border-color: var(--vz-border-color);
                    --vz-table-striped-bg: var(--vz-light);
                    --vz-table-striped-color: var(--vz-body-color);
                    --vz-table-active-bg: var(--vz-gray-100);
                    --vz-table-active-color: var(--vz-body-color);
                    --vz-table-hover-bg: var(--vz-gray-100);
                    --vz-table-hover-color: var(--vz-body-color);
                    color: var(--vz-table-color);
                    background-color: var(--vz-table-bg);
                }
                
                .table thead th {
                    background-color: var(--vz-table-head-bg);
                    color: var(--vz-table-head-color);
                    border-color: var(--vz-table-border-color);
                }
                
                .table tbody tr {
                    border-color: var(--vz-table-border-color);
                }
                
                .table-hover tbody tr:hover {
                    background-color: var(--vz-table-hover-bg);
                }
                
                /* Theme-aware form controls */
                .form-control, .form-select {
                    background-color: var(--vz-input-bg, var(--vz-secondary-bg));
                    color: var(--vz-input-color, var(--vz-body-color));
                    border-color: var(--vz-input-border, var(--vz-border-color));
                }
                
                .form-control::placeholder {
                    color: var(--vz-input-placeholder-color, var(--vz-secondary-color));
                }
                
                /* Theme-aware modal */
                .modal-content {
                    background-color: var(--vz-modal-content-bg, var(--vz-secondary-bg));
                    color: var(--vz-body-color);
                }
                
                .modal-header {
                    border-color: var(--vz-border-color);
                }
                
                .modal-footer {
                    border-color: var(--vz-border-color);
                }
                
                /* Fix for search input group */
                .input-group-text {
                    background-color: var(--vz-input-group-addon-bg, var(--vz-secondary-bg)) !important;
                    border-color: var(--vz-input-border, var(--vz-border-color)) !important;
                    color: var(--vz-body-color) !important;
                }
                
                /* Fix for dropdown toggle button */
                .btn-sm.p-0 {
                    background-color: var(--vz-card-bg-custom, var(--vz-light)) !important;
                }
                
                /* Fix for stats cards */
          
                
                /* Fix for card hover effect */
                .department-card:hover {
                    background-color: var(--vz-card-bg, var(--vz-secondary-bg)) !important;
                }
                
                /* Fix for table hover */
                .table-hover tbody tr:hover {
                    background-color: var(--vz-table-hover-bg) !important;
                }
                
                /* Progress bar theme awareness */
                .progress {
                    background-color: var(--vz-progress-bg, var(--vz-gray-200));
                }
                
                /* Avatar theme awareness */
                .avatar-title {
                    background-color: var(--vz-avatar-bg, var(--vz-gray-100));
                    color: var(--vz-avatar-color, var(--vz-body-color));
                }
                
                /* Alert theme awareness */
                .alert-info {
                    background-color: var(--vz-info-bg-subtle);
                    border-color: var(--vz-info-border-subtle);
                    color: var(--vz-info-text-emphasis);
                }
                
                /* Stats card theme awareness */
              
            `}</style>
        </>
    );
};

export default Departments;