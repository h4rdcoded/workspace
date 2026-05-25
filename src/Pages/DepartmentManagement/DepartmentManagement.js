import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS, buildApiUrl, getAuthHeaders } from '../../config/api';

const DepartmentManagement = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(buildApiUrl(API_ENDPOINTS.DEPARTMENTS.BASE), {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setDepartments(response.data.data);
      }
    } catch (error) {
      setError('Failed to fetch departments');
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle clicking on a department
  const handleDepartmentClick = (department) => {
    // Navigate to the department details page
    navigate(`/admin/department/${department.id}`);
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="page-content">
          <div className="container-fluid">
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
              <h5>Loading departments...</h5>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Vertical Overlay*/}
      <div className="vertical-overlay" />
      {/* ============================================================== */}
      {/* Start right Content here */}
      {/* ============================================================== */}
      <div className="main-content">
        <div className="page-content">
          <div className="container-fluid">
            {/* start page title */}
            <div className="row">
              <div className="col-12">
                <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                  <h4 className="mb-sm-0">Department Management</h4>
                  <div className="page-title-right">
                    <ol className="breadcrumb m-0">
                      <li className="breadcrumb-item"><a href="javascript: void(0);">Admin</a></li>
                      <li className="breadcrumb-item active">Department Management</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
            {/* end page title */}

            <div className="p-0">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="h5 mb-0">Departments List</h2>
                {/* Removed Add Department button */}
              </div>

              {error && <div className="alert alert-danger">{error}</div>}

              {/* Departments Table */}
              <div className="card">
                <div className="card-body">
                  <h6 className="mb-3">Departments List</h6>
                  <div className="table-responsive">
                    <table className="table table-striped table-hover">
                      <thead>
                        <tr>
                          <th>Department</th>
                          <th>Manager</th>
                          <th>Employees</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {departments.map((department) => (
                          <tr key={department.id}>
                            <td>
                              <div>
                                <strong>{department.name}</strong>
                                {department.description && (
                                  <div className="text-muted small">{department.description}</div>
                                )}
                              </div>
                            </td>
                            <td>
                              {department.manager_name || 'Not Assigned'}
                            </td>
                            <td>{department.employee_count || 0}</td>
                            <td>
                              <span className={`badge ${department.is_active ? 'bg-success' : 'bg-secondary'}`}>
                                {department.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              <button 
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleDepartmentClick(department)}
                                title="View Department Details"
                              >
                                <i className="mdi mdi-eye"></i> View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DepartmentManagement;