import React, { useState, useEffect } from 'react';
import TeamLeaderPermissionService from '../../Utils/TeamLeaderPermissionService';
import { toast } from 'react-toastify';
import { buildApiUrl, getAuthHeaders } from '../../config/api';

const ComponentPermissionManagement = () => {
  const [permissions, setPermissions] = useState([]);
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPermission, setEditingPermission] = useState(null);
  const [formData, setFormData] = useState({
    teamLeaderId: '',
    permissionType: 'review_task_button',
    isAllowed: true
  });
  const [filter, setFilter] = useState({
    teamLeaderId: '',
    permissionType: ''
  });

  // Fetch all team leader permissions
  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const data = await TeamLeaderPermissionService.getAllPermissions();
      setPermissions(data);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      if (error.message.includes('403') || error.message.includes('admin')) {
        toast.error('Access denied. Admin privileges required to manage permissions.');
      } else if (error.message.includes('401') || error.message.includes('token') || error.message.includes('authentication')) {
        toast.error('Authentication required. Please log in with an admin account.');
      } else {
        toast.error('Failed to fetch team leader permissions: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch all team leaders for dropdown
  const fetchTeamLeaders = async () => {
    try {
      const response = await fetch(buildApiUrl('/users'), {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
     
      
      if (response.ok) {
        // console.log('Data structure:', typeof data, data);
        // console.log('Data.users:', data.data?.users);
        
        // Check the structure of the response - API returns {success: true, data: {users: [...]}, message: ...}
        const usersData = data.data?.users || [];
        // console.log('Users data to process:', usersData);
        
        // Filter to get only team leaders (role is 'TL' in the database)
        const teamLeadersData = Array.isArray(usersData) ? 
          usersData.filter(user => {
            // console.log('Checking user:', user);
            return user.role === 'TL';
          }) : [];
          
        // console.log('Filtered team leaders:', teamLeadersData);
        setTeamLeaders(teamLeadersData);
      }
    } catch (error) {
      console.error('Error fetching team leaders:', error);
      if (error.message.includes('401') || error.message.includes('403')) {
        toast.error('Authentication required. Please log in.');
      }
    }
  };

  useEffect(() => {
    fetchPermissions();
    fetchTeamLeaders();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await TeamLeaderPermissionService.updatePermission({
        ...formData,
        permissionId: editingPermission?.id
      });
      
      toast.success(editingPermission ? 'Team leader permission updated successfully' : 'Team leader permission created successfully');
      setFormData({
        teamLeaderId: '',
        permissionType: 'review_task_button',
        isAllowed: true
      });
      setEditingPermission(null);
      fetchPermissions(); // Refresh the list
    } catch (error) {
      console.error('Error saving permission:', error);
      if (error.message.includes('403') || error.message.includes('admin')) {
        toast.error('Access denied. Admin privileges required to manage permissions.');
      } else {
        toast.error('Failed to save team leader permission');
      }
    }
  };

  const handleEdit = (permission) => {
    setEditingPermission(permission);
    setFormData({
      teamLeaderId: permission.team_leader_id || '',
      permissionType: permission.permission_type,
      isAllowed: permission.is_allowed
    });
  };

  const handleDelete = async (permissionId) => {
    if (window.confirm('Are you sure you want to delete this team leader permission?')) {
      try {
        await TeamLeaderPermissionService.deletePermission(permissionId);
        toast.success('Team leader permission deleted successfully');
        fetchPermissions(); // Refresh the list
      } catch (error) {
        console.error('Error deleting permission:', error);
        if (error.message.includes('403') || error.message.includes('admin')) {
          toast.error('Access denied. Admin privileges required to manage permissions.');
        } else {
          toast.error('Failed to delete team leader permission');
        }
      }
    }
  };

  const filteredPermissions = permissions.filter(permission => {
    return (
      (!filter.teamLeaderId || permission.team_leader_id == filter.teamLeaderId) &&
      (!filter.permissionType || permission.permission_type === filter.permissionType)
    );
  });

  return (
    <div className="main-content">
      <div className="page-content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                <h4 className="mb-sm-0">Team Leader Permission Management</h4>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Manage Team Leader Permissions</h5>
                </div>
                
                <div className="card-body">
                  {/* Form for adding/editing team leader permissions */}
                  <div className="row mb-4">
                    <div className="col-md-12">
                      <form onSubmit={handleSubmit}>
                        <div className="row">
                          <div className="col-md-4">
                            <label className="form-label">Team Leader *</label>
                            <select
                              className="form-control"
                              name="teamLeaderId"
                              value={formData.teamLeaderId}
                              onChange={handleInputChange}
                              required
                            >
                              <option value="">Select Team Leader</option>
                              {(() => {
                                console.log('Rendering dropdown - teamLeaders:', teamLeaders);
                                console.log('teamLeaders length:', teamLeaders?.length);
                                return teamLeaders && teamLeaders.length > 0 ? (
                                  teamLeaders.map(teamLeader => (
                                    <option key={teamLeader.id} value={teamLeader.id}>
                                      {teamLeader.name} ({teamLeader.role})
                                    </option>
                                  ))
                                ) : (
                                  <option value="" disabled>No team leaders available</option>
                                );
                              })()}
                            </select>
                          </div>
                          
                          <div className="col-md-4">
                            <label className="form-label">Permission Type *</label>
                            <select
                              className="form-control"
                              name="permissionType"
                              value={formData.permissionType}
                              onChange={handleInputChange}
                              required
                            >
                              <option value="review_task_button">Review Task Button</option>
                              <option value="forward_to_tester_button">Forward to Tester Button</option>
                            </select>
                          </div>
                          
                          <div className="col-md-4">
                            <label className="form-label">Allow Access</label>
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                name="isAllowed"
                                checked={formData.isAllowed}
                                onChange={handleInputChange}
                              />
                              <label className="form-check-label">
                                {formData.isAllowed ? 'Yes' : 'No'}
                              </label>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <button type="submit" className="btn btn-primary me-2">
                            {editingPermission ? 'Update' : 'Add'} Team Leader Permission
                          </button>
                          {editingPermission && (
                            <button 
                              type="button" 
                              className="btn btn-secondary"
                              onClick={() => {
                                setEditingPermission(null);
                                setFormData({
                                  teamLeaderId: '',
                                  permissionType: 'review_task_button',
                                  isAllowed: true
                                });
                              }}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Filter Section */}
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Filter by Team Leader</label>
                      <select
                        className="form-control"
                        value={filter.teamLeaderId}
                        onChange={(e) => setFilter({...filter, teamLeaderId: e.target.value})}
                      >
                        <option value="">All Team Leaders</option>
                        {teamLeaders.map(teamLeader => (
                          <option key={teamLeader.id} value={teamLeader.id}>
                            {teamLeader.name} ({teamLeader.role})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label">Filter by Permission Type</label>
                      <select
                        className="form-control"
                        value={filter.permissionType}
                        onChange={(e) => setFilter({...filter, permissionType: e.target.value})}
                      >
                        <option value="">All Types</option>
                        <option value="review_task_button">Review Task Button</option>
                        <option value="forward_to_tester_button">Forward to Tester Button</option>
                      </select>
                    </div>
                  </div>

                  {/* Team Leader Permissions Table */}
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>Team Leader</th>
                            <th>Permission Type</th>
                            <th>Allowed</th>
                            <th>Created</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPermissions.length > 0 ? (
                            filteredPermissions.map(permission => (
                              <tr key={permission.id}>
                                <td>{permission.team_leader_name || 'N/A'}</td>
                                <td>
                                  <span className={`badge ${
                                    permission.permission_type === 'review_task_button' ? 'bg-primary' : 'bg-info'
                                  }`}>
                                    {permission.permission_type === 'review_task_button' ? 'Review Task Button' : 'Forward to Tester Button'}
                                  </span>
                                </td>
                                <td>
                                  <span className={`badge ${permission.is_allowed ? 'bg-success' : 'bg-danger'}`}>
                                    {permission.is_allowed ? 'Yes' : 'No'}
                                  </span>
                                </td>
                                <td>{new Date(permission.created_at).toLocaleDateString()}</td>
                                <td>
                                  <button 
                                    className="btn btn-sm btn-outline-primary me-1"
                                    onClick={() => handleEdit(permission)}
                                  >
                                    <i className="ri-edit-line"></i>
                                  </button>
                                  <button 
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleDelete(permission.id)}
                                  >
                                    <i className="ri-delete-bin-line"></i>
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="5" className="text-center text-muted py-4">
                                No team leader permissions found
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
    </div>
  );
};

export default ComponentPermissionManagement;