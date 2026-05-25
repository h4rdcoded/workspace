import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_ENDPOINTS, buildApiUrl, getAuthHeaders } from '../../config/api';

const AdminSettings = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [userPermissions, setUserPermissions] = useState([]);
    
    const [newRole, setNewRole] = useState({
        name: '',
        description: '',
        permissions: []
    });

    useEffect(() => {
        fetchUsers();
        fetchRoles();
        fetchPermissions();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get(buildApiUrl(API_ENDPOINTS.USERS.BASE), {
                headers: getAuthHeaders()
            });
            
            if (response.data.success) {
                setUsers(response.data.data.users || []);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to fetch users');
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await axios.get(buildApiUrl(API_ENDPOINTS.ADMIN.ROLES), {
                headers: getAuthHeaders()
            });
            
            if (response.data.success) {
                setRoles(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    };

    const fetchPermissions = async () => {
        try {
            const response = await axios.get(buildApiUrl(API_ENDPOINTS.ADMIN.PERMISSIONS), {
                headers: getAuthHeaders()
            });
            
            if (response.data.success) {
                setPermissions(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching permissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserPermissions = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/api/admin/users/${userId}/permissions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                setUserPermissions(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching user permissions:', error);
        }
    };

    const updateUserRole = async (userId, roleId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/admin/users/${userId}/role`, {
                roleId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            toast.success('User role updated successfully');
            fetchUsers();
        } catch (error) {
            console.error('Error updating user role:', error);
            toast.error('Failed to update user role');
        }
    };

    const updateUserPermissions = async (userId, permissionIds) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/admin/users/${userId}/permissions`, {
                permissions: permissionIds
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            toast.success('User permissions updated successfully');
            setShowPermissionModal(false);
            fetchUsers();
        } catch (error) {
            console.error('Error updating user permissions:', error);
            toast.error('Failed to update user permissions');
        }
    };

    const createRole = async (e) => {
        e.preventDefault();
        
        if (!newRole.name) {
            toast.warning('Please enter role name');
            return;
        }

        try {
            await axios.post(buildApiUrl(API_ENDPOINTS.ADMIN.ROLES), newRole, {
                headers: getAuthHeaders()
            });
            
            toast.success('Role created successfully');
            setShowRoleModal(false);
            setNewRole({ name: '', description: '', permissions: [] });
            fetchRoles();
        } catch (error) {
            console.error('Error creating role:', error);
            toast.error('Failed to create role');
        }
    };

    const openPermissionModal = (user) => {
        setSelectedUser(user);
        fetchUserPermissions(user.id);
        setShowPermissionModal(true);
    };

    const handlePermissionToggle = (permissionId) => {
        setUserPermissions(prev => 
            prev.includes(permissionId)
                ? prev.filter(id => id !== permissionId)
                : [...prev, permissionId]
        );
    };

    const handleRolePermissionToggle = (permissionId) => {
        setNewRole(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permissionId)
                ? prev.permissions.filter(id => id !== permissionId)
                : [...prev.permissions, permissionId]
        }));
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{height: '400px'}}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="mb-0">Admin Settings</h4>
                            <button 
                                className="btn btn-primary"
                                onClick={() => setShowRoleModal(true)}
                            >
                                <i className="fas fa-plus me-2"></i>Create Role
                            </button>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                {/* Users Management */}
                                <div className="col-md-8">
                                    <h5>User Management</h5>
                                    <div className="table-responsive">
                                        <table className="table table-striped">
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Email</th>
                                                    <th>Current Role</th>
                                                    <th>Department</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users.map(user => (
                                                    <tr key={user.id}>
                                                        <td>{user.first_name} {user.last_name}</td>
                                                        <td>{user.email}</td>
                                                        <td>
                                                            <select 
                                                                className="form-select form-select-sm"
                                                                value={user.role || ''}
                                                                onChange={(e) => updateUserRole(user.id, e.target.value)}
                                                            >
                                                                <option value="">Select Role</option>
                                                                {roles.map(role => (
                                                                    <option key={role.id} value={role.name}>
                                                                        {role.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td>{user.department_name || 'Not assigned'}</td>
                                                        <td>
                                                            <button 
                                                                className="btn btn-sm btn-outline-primary me-2"
                                                                onClick={() => openPermissionModal(user)}
                                                                title="Manage Permissions"
                                                            >
                                                                <i className="fas fa-key"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Roles & Permissions Overview */}
                                <div className="col-md-4">
                                    <h5>Roles Overview</h5>
                                    <div className="list-group">
                                        {roles.map(role => (
                                            <div key={role.id} className="list-group-item">
                                                <div className="d-flex w-100 justify-content-between">
                                                    <h6 className="mb-1">{role.name}</h6>
                                                    <small>{role.user_count || 0} users</small>
                                                </div>
                                                <p className="mb-1">{role.description}</p>
                                                <small>Permissions: {role.permission_count || 0}</small>
                                            </div>
                                        ))}
                                    </div>

                                    <h5 className="mt-4">System Permissions</h5>
                                    <div className="list-group">
                                        {permissions.map(permission => (
                                            <div key={permission.id} className="list-group-item">
                                                <strong>{permission.name}</strong>
                                                <br />
                                                <small className="text-muted">{permission.description}</small>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Permission Management Modal */}
            {showPermissionModal && (
                <div className="modal fade show" style={{display: 'block'}} tabIndex="-1">
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    Manage Permissions - {selectedUser?.first_name} {selectedUser?.last_name}
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setShowPermissionModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="row">
                                    {permissions.map(permission => (
                                        <div key={permission.id} className="col-md-6 mb-3">
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id={`permission-${permission.id}`}
                                                    checked={userPermissions.includes(permission.id)}
                                                    onChange={() => handlePermissionToggle(permission.id)}
                                                />
                                                <label className="form-check-label" htmlFor={`permission-${permission.id}`}>
                                                    <strong>{permission.name}</strong>
                                                    <br />
                                                    <small className="text-muted">{permission.description}</small>
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={() => setShowPermissionModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-primary"
                                    onClick={() => updateUserPermissions(selectedUser.id, userPermissions)}
                                >
                                    Save Permissions
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Role Modal */}
            {showRoleModal && (
                <div className="modal fade show" style={{display: 'block'}} tabIndex="-1">
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Create New Role</h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setShowRoleModal(false)}
                                ></button>
                            </div>
                            <form onSubmit={createRole}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">Role Name *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={newRole.name}
                                            onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                                            placeholder="Enter role name"
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Description</label>
                                        <textarea
                                            className="form-control"
                                            rows="3"
                                            value={newRole.description}
                                            onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                                            placeholder="Enter role description"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Permissions</label>
                                        <div className="row">
                                            {permissions.map(permission => (
                                                <div key={permission.id} className="col-md-6 mb-2">
                                                    <div className="form-check">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            id={`role-permission-${permission.id}`}
                                                            checked={newRole.permissions.includes(permission.id)}
                                                            onChange={() => handleRolePermissionToggle(permission.id)}
                                                        />
                                                        <label className="form-check-label" htmlFor={`role-permission-${permission.id}`}>
                                                            <strong>{permission.name}</strong>
                                                            <br />
                                                            <small className="text-muted">{permission.description}</small>
                                                        </label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary" 
                                        onClick={() => setShowRoleModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Create Role
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

export default AdminSettings;