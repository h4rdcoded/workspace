import React, { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../Context/ConfigContext';
import PageTitle from '../../Components/PageTitle';
import Swal from 'sweetalert2';

const PermissionManagement = () => {
  const { leadCrmUser } = useContext(ConfigContext);
  const [permissions, setPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [departmentPermissions, setDepartmentPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('permissions');

  useEffect(() => {
    fetchPermissionData();
  }, []);

  const fetchPermissionData = async () => {
    try {
      setLoading(true);
      
      // Fetch permissions
      const permissionsResponse = await fetch(`${process.env.REACT_APP_BASE_URL}api/v1/permissions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${leadCrmUser?.token}`,
          'Content-Type': 'application/json'
        }
      });

      // Fetch roles
      const rolesResponse = await fetch(`${process.env.REACT_APP_BASE_URL}api/v1/roles`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${leadCrmUser?.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (permissionsResponse.ok && rolesResponse.ok) {
        const permissionsData = await permissionsResponse.json();
        const rolesData = await rolesResponse.json();
        
        if (permissionsData.success && rolesData.success) {
          setPermissions(permissionsData.data || []);
          setRolePermissions(rolesData.data || []);
          setDepartmentPermissions([]); // No department permissions for now
        }
      }
    } catch (error) {
      
      Swal.fire({
        title: 'Error',
        text: 'Failed to load permission data',
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePermission = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Create New Permission',
      html: `
        <input id="permission-name" class="swal2-input" placeholder="Permission Name" required>
        <input id="permission-description" class="swal2-input" placeholder="Description">
        <select id="permission-category" class="swal2-select">
          <option value="user">User Management</option>
          <option value="task">Task Management</option>
          <option value="department">Department Management</option>
          <option value="system">System Administration</option>
        </select>
      `,
      focusConfirm: false,
      preConfirm: () => {
        return {
          name: document.getElementById('permission-name').value,
          description: document.getElementById('permission-description').value,
          category: document.getElementById('permission-category').value
        };
      }
    });

    if (formValues && formValues.name) {
      try {
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}api/permissions/create`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${leadCrmUser?.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formValues)
        });

        if (response.ok) {
          Swal.fire('Success', 'Permission created successfully', 'success');
          fetchPermissionData();
        } else {
          throw new Error('Failed to create permission');
        }
      } catch (error) {
        Swal.fire('Error', 'Failed to create permission', 'error');
      }
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="container-fluid">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="container-fluid">
        <PageTitle title="Permission Management" breadcrumbItem="System Settings" />
        
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="card-title mb-0">System Permissions</h4>
                  <button 
                    className="btn btn-primary"
                    onClick={handleCreatePermission}
                  >
                    <i className="ri-add-line me-1"></i>
                    Create Permission
                  </button>
                </div>
              </div>
              <div className="card-body">
                {/* Navigation Tabs */}
                <ul className="nav nav-tabs nav-tabs-custom nav-success" role="tablist">
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'permissions' ? 'active' : ''}`}
                      onClick={() => setActiveTab('permissions')}
                    >
                      <i className="ri-shield-line me-1"></i>
                      All Permissions
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'roles' ? 'active' : ''}`}
                      onClick={() => setActiveTab('roles')}
                    >
                      <i className="ri-user-settings-line me-1"></i>
                      Role Permissions
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'departments' ? 'active' : ''}`}
                      onClick={() => setActiveTab('departments')}
                    >
                      <i className="ri-building-line me-1"></i>
                      Department Permissions
                    </button>
                  </li>
                </ul>

                <div className="tab-content mt-3">
                  {/* All Permissions Tab */}
                  {activeTab === 'permissions' && (
                    <div className="tab-pane active">
                      <div className="table-responsive">
                        <table className="table table-striped table-hover">
                          <thead className="table-light">
                            <tr>
                              <th>Permission Name</th>
                              <th>Description</th>
                              <th>Category</th>
                              <th>Created At</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {permissions.length > 0 ? (
                              permissions.map((permission) => (
                                <tr key={permission.id}>
                                  <td>
                                    <span className="badge bg-primary">{permission.name}</span>
                                  </td>
                                  <td>{permission.description || 'No description'}</td>
                                  <td>
                                    <span className="badge bg-secondary">{permission.category}</span>
                                  </td>
                                  <td>{new Date(permission.created_at).toLocaleDateString()}</td>
                                  <td>
                                    <button className="btn btn-sm btn-outline-primary me-1">
                                      <i className="ri-edit-line"></i>
                                    </button>
                                    <button className="btn btn-sm btn-outline-danger">
                                      <i className="ri-delete-bin-line"></i>
                                    </button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="5" className="text-center text-muted">
                                  No permissions found
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Role Permissions Tab */}
                  {activeTab === 'roles' && (
                    <div className="tab-pane active">
                      <div className="alert alert-info">
                        <i className="ri-information-line me-2"></i>
                        Manage permissions assigned to different user roles.
                      </div>
                      <div className="table-responsive">
                        <table className="table table-striped table-hover">
                          <thead className="table-light">
                            <tr>
                              <th>Role</th>
                              <th>Permissions</th>
                              <th>Last Updated</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rolePermissions.length > 0 ? (
                              rolePermissions.map((rolePermission) => (
                                <tr key={rolePermission.id}>
                                  <td>
                                    <span className="badge bg-success">{rolePermission.role}</span>
                                  </td>
                                  <td>
                                    <span className="text-muted">
                                      {rolePermission.permissions_count || 0} permissions assigned
                                    </span>
                                  </td>
                                  <td>{new Date(rolePermission.updated_at).toLocaleDateString()}</td>
                                  <td>
                                    <button className="btn btn-sm btn-outline-primary">
                                      <i className="ri-settings-line me-1"></i>
                                      Manage
                                    </button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="4" className="text-center text-muted">
                                  No role permissions configured
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Department Permissions Tab */}
                  {activeTab === 'departments' && (
                    <div className="tab-pane active">
                      <div className="alert alert-info">
                        <i className="ri-information-line me-2"></i>
                        Manage permissions assigned to different departments.
                      </div>
                      <div className="table-responsive">
                        <table className="table table-striped table-hover">
                          <thead className="table-light">
                            <tr>
                              <th>Department</th>
                              <th>Permissions</th>
                              <th>Last Updated</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {departmentPermissions.length > 0 ? (
                              departmentPermissions.map((deptPermission) => (
                                <tr key={deptPermission.id}>
                                  <td>
                                    <span className="badge bg-info">{deptPermission.department_name}</span>
                                  </td>
                                  <td>
                                    <span className="text-muted">
                                      {deptPermission.permissions_count || 0} permissions assigned
                                    </span>
                                  </td>
                                  <td>{new Date(deptPermission.updated_at).toLocaleDateString()}</td>
                                  <td>
                                    <button className="btn btn-sm btn-outline-primary">
                                      <i className="ri-settings-line me-1"></i>
                                      Manage
                                    </button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="4" className="text-center text-muted">
                                  No department permissions configured
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
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
  );
};

export default PermissionManagement;