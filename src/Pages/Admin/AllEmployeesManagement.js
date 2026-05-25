import React, { useState, useEffect, useContext } from 'react';
import { buildApiUrl, getAuthHeaders } from '../../config/api';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ConfigContext } from '../../Context/ConfigContext';
import { useNavigate } from 'react-router-dom';

const AllEmployeesManagement = () => {
  const { staticFilesBaseURL } = useContext(ConfigContext);
  const navigate = useNavigate();
  
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [employeesPerPage] = useState(20);
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [reassignDepartmentId, setReassignDepartmentId] = useState('');
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    role: '',
    designationId: ''
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Helper function to check if employee is active
  const isEmployeeActive = (employee) => {
    if (!employee) return false;
    // Handle different formats: boolean, number (0/1), or string ('0'/'1')
    return employee.isActive === true || 
           employee.isActive === 1 || 
           employee.isActive === '1';
  };

  // Function to get profile image URL with fallback
  const getProfileImageUrl = (employee) => {
    if (employee && employee.profile_image) {
      // Use staticFilesBaseURL if available, otherwise construct from server URL
      const baseUrl = staticFilesBaseURL || process.env.REACT_APP_SERVER_URL || 'https://task.ipshopy.com';
      // Remove query parameters if any and add timestamp for cache busting
      const imagePath = employee.profile_image.split('?')[0];
      if (staticFilesBaseURL) {
        return `${staticFilesBaseURL}/${imagePath}?t=${new Date().getTime()}`;
      } else {
        return `${baseUrl}${imagePath.startsWith('/') ? imagePath : '/' + imagePath}?t=${new Date().getTime()}`;
      }
    }
    return null; // Return null to show fallback
  };

  // Handle employee row click
  const handleEmployeeClick = (employee) => {
    setSelectedEmployee(employee);
    setShowEmployeeModal(true);
  };

  // Close modal with smooth animation
  const handleCloseEmployeeModal = () => {
    setIsClosing(true);
    // Wait for animation to complete before removing modal
    setTimeout(() => {
      setShowEmployeeModal(false);
      setIsClosing(false);
    }, 300); // Match animation duration
  };

  // Fetch all employees
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const url = selectedDepartment 
        ? buildApiUrl(`/admin/all-employees?departmentId=${selectedDepartment}`)
        : buildApiUrl('/admin/all-employees');
      
      const response = await axios.get(url, {
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (response.data.success) {
        setEmployees(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all departments
  const fetchDepartments = async () => {
    try {
      const response = await axios.get(
        buildApiUrl('/departments'),
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        setDepartments(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  // Fetch all designations
  const fetchDesignations = async () => {
    try {
      const response = await axios.get(
        buildApiUrl('/departments/designations'),
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        setDesignations(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching designations:', error);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
    fetchDesignations();
  }, [selectedDepartment]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDepartment, searchTerm]);

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = !searchTerm || 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.employeeCode && emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);
  const indexOfLastEmployee = currentPage * employeesPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
  const currentEmployees = filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);

  // Pagination handlers
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Handle delete employee
  const handleDeleteClick = (employee) => {
    setSelectedEmployee(employee);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEmployee) return;

    try {
      setActionLoading(true);
      const response = await axios.delete(
        buildApiUrl(`/admin/employees/${selectedEmployee.id}`),
        {
          headers: getAuthHeaders(),
          credentials: 'include'
        }
      );

      if (response.data.success) {
        toast.success('Employee deleted successfully from the system');
        setShowDeleteModal(false);
        setSelectedEmployee(null);
        fetchEmployees();
      } else {
        toast.error(response.data.message || 'Failed to delete employee');
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error(error.response?.data?.message || 'Failed to delete employee');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle reassign employee
  const handleReassignClick = (employee) => {
    setSelectedEmployee(employee);
    setReassignDepartmentId(employee.departmentId || '');
    setShowReassignModal(true);
  };

  const handleReassignConfirm = async () => {
    if (!selectedEmployee) return;

    try {
      setActionLoading(true);
      const response = await axios.put(
        buildApiUrl(`/admin/employees/${selectedEmployee.id}/reassign`),
        { departmentId: reassignDepartmentId || null },
        {
          headers: getAuthHeaders(),
          credentials: 'include'
        }
      );

      if (response.data.success) {
        toast.success(response.data.message || 'Employee reassigned successfully');
        setShowReassignModal(false);
        setSelectedEmployee(null);
        setReassignDepartmentId('');
        fetchEmployees();
      } else {
        toast.error(response.data.message || 'Failed to reassign employee');
      }
    } catch (error) {
      console.error('Error reassigning employee:', error);
      toast.error(error.response?.data?.message || 'Failed to reassign employee');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle edit employee
  const handleEditClick = (employee) => {
    setSelectedEmployee(employee);
    setEditFormData({
      name: employee.name || '',
      email: employee.email || '',
      mobile: employee.mobile || '',
      role: employee.role || '',
      designationId: employee.designationId || ''
    });
    setShowEditModal(true);
  };

  // Handle deactivate/activate employee
  const handleDeactivateClick = (employee) => {
    setSelectedEmployee(employee);
    setShowDeactivateModal(true);
  };

  const handleDeactivateConfirm = async () => {
    if (!selectedEmployee) return;

    const isCurrentlyActive = isEmployeeActive(selectedEmployee);
    const action = isCurrentlyActive ? 'deactivate' : 'activate';
    const endpoint = isCurrentlyActive ? 'deactivate' : 'activate';

    try {
      setActionLoading(true);
      
      // Use the department-specific endpoint
      const departmentId = selectedEmployee.departmentId;
      if (!departmentId) {
        toast.error('Employee department information is missing');
        return;
      }

      const response = await axios.put(
        buildApiUrl(`/departments/${departmentId}/employees/${selectedEmployee.id}/${endpoint}`),
        {},
        {
          headers: getAuthHeaders(),
          credentials: 'include'
        }
      );

      if (response.data.success) {
        toast.success(response.data.message || `Employee ${action}d successfully`);
        setShowDeactivateModal(false);
        setSelectedEmployee(null);
        fetchEmployees();
      } else {
        toast.error(response.data.message || `Failed to ${action} employee`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${action} employee`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditConfirm = async () => {
    if (!selectedEmployee) return;

    try {
      setActionLoading(true);
      const response = await axios.put(
        buildApiUrl(`/admin/employees/${selectedEmployee.id}`),
        editFormData,
        {
          headers: getAuthHeaders(),
          credentials: 'include'
        }
      );

      if (response.data.success) {
        toast.success('Employee information updated successfully');
        setShowEditModal(false);
        setSelectedEmployee(null);
        fetchEmployees();
      } else {
        toast.error(response.data.message || 'Failed to update employee');
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error(error.response?.data?.message || 'Failed to update employee');
    } finally {
      setActionLoading(false);
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN': return 'bg-danger';
      case 'TL': return 'bg-primary';
      case 'EXEC': return 'bg-info';
      case 'EMPL': return 'bg-secondary';
      case 'QA_TESTER': return 'bg-warning';
      default: return 'bg-secondary';
    }
  };

  // Get assignment status badge
  const getAssignmentStatusBadge = (status) => {
    switch (status) {
      case 'assigned': return 'bg-success';
      case 'unassigned': return 'bg-warning';
      case 'removed': return 'bg-danger';
      default: return 'bg-secondary';
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
                <p className="mt-2 text-muted">Loading employees...</p>
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
                  <h4 className="mb-0">All Employees Management</h4>
                  <p className="text-muted mb-0">Manage all employees, departments, and assignments</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label">Search Employees</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search by name, email, or employee code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Filter by Department</label>
                      <select
                        className="form-select"
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                      >
                        <option value="">All Departments</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                        <option value="unassigned">Unassigned Employees</option>
                        <option value="removed">Removed from Department</option>
                      </select>
                    </div>
                    <div className="col-md-4 d-flex align-items-end">
                      <button
                        className="btn btn-outline-secondary w-100"
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedDepartment('');
                        }}
                      >
                        <i className="ri-refresh-line me-2"></i>
                        Clear Filters
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Employees List */}
          <div className="row">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Employees ({filteredEmployees.length})</h5>
                    <span className="text-muted small">
                      Showing {indexOfFirstEmployee + 1}-{Math.min(indexOfLastEmployee, filteredEmployees.length)} of {filteredEmployees.length}
                    </span>
                  </div>
                </div>
                <div className="card-body p-0">
                  {currentEmployees.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-hover table-nowrap mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Employee</th>
                        
                           <th>Designation</th>
                            <th>Department</th>
                            <th>Role</th>
                            <th>Status</th>
                           
                          </tr>
                        </thead>
                        <tbody>
                          {currentEmployees.map(employee => (
                            <tr 
                              key={employee.id}
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleEmployeeClick(employee)}
                            >
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="avatar-xs me-2">
                                    <div className="avatar-title rounded-circle bg-primary bg-opacity-10 text-primary">
                                      {employee.name.charAt(0).toUpperCase()}
                                    </div>
                                  </div>
                                  <div>
                                    <h6 className="mb-0">{employee.name}</h6>
                                    
                                  </div>
                                </div>
                              </td>
                            
                              <td>
                                <span className="text-muted">
                                  {employee.designationTitle}
                                </span>
                              </td>
                              <td>
                                <span className="text-muted">
                                  {employee.departmentName}
                                </span>
                              </td>
                              <td>
                                <span className={`badge ${getRoleBadgeColor(employee.role)}`}>
                                  {employee.role}
                                </span>
                              </td>
                              <td>
                                <span className={`badge ${employee.isActive ? 'bg-success' : 'bg-danger'}`}>
                                  {employee.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              {/* <td>
                                <div className="d-flex gap-2">
                                  <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => handleEditClick(employee)}
                                    title="Edit Employee"
                                  >
                                    <i className="ri-edit-line"></i>
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-info"
                                    onClick={() => handleReassignClick(employee)}
                                    title="Reassign Employee"
                                  >
                                    <i className="ri-refresh-line"></i>
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleDeleteClick(employee)}
                                    title="Delete Employee"
                                  >
                                    <i className="ri-delete-bin-line"></i>
                                  </button>
                                </div>
                              </td> */}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <i className="ri-user-line display-4 text-muted"></i>
                      <h5 className="mt-3">No Employees Found</h5>
                      <p className="text-muted">No employees match your search criteria.</p>
                    </div>
                  )}
                  
                  {/* Pagination */}
                  {filteredEmployees.length > employeesPerPage && (
                    <div className="card-footer bg-white border-top">
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                        <div className="text-muted small">
                          Showing {indexOfFirstEmployee + 1} to {Math.min(indexOfLastEmployee, filteredEmployees.length)} of {filteredEmployees.length} employees
                        </div>
                        <nav aria-label="Employees pagination">
                          <ul className="pagination mb-0">
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                              <button 
                                className="page-link" 
                                onClick={goToFirstPage}
                                disabled={currentPage === 1}
                                title="First Page"
                              >
                                <i className="ri-arrow-left-double-line"></i>
                              </button>
                            </li>
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                              <button 
                                className="page-link" 
                                onClick={goToPreviousPage}
                                disabled={currentPage === 1}
                              >
                                <i className="ri-arrow-left-line"></i> Previous
                              </button>
                            </li>
                            
                            {/* Page Numbers */}
                            {[...Array(totalPages)].map((_, index) => {
                              const pageNumber = index + 1;
                              // Show first page, last page, current page, and pages around current
                              if (
                                pageNumber === 1 ||
                                pageNumber === totalPages ||
                                (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)
                              ) {
                                return (
                                  <li key={pageNumber} className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}>
                                    <button 
                                      className="page-link" 
                                      onClick={() => paginate(pageNumber)}
                                    >
                                      {pageNumber}
                                    </button>
                                  </li>
                                );
                              } else if (
                                pageNumber === currentPage - 3 ||
                                pageNumber === currentPage + 3
                              ) {
                                return (
                                  <li key={pageNumber} className="page-item disabled">
                                    <span className="page-link">...</span>
                                  </li>
                                );
                              }
                              return null;
                            })}
                            
                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                              <button 
                                className="page-link" 
                                onClick={goToNextPage}
                                disabled={currentPage === totalPages}
                              >
                                Next <i className="ri-arrow-right-line"></i>
                              </button>
                            </li>
                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                              <button 
                                className="page-link" 
                                onClick={goToLastPage}
                                disabled={currentPage === totalPages}
                                title="Last Page"
                              >
                                <i className="ri-arrow-right-double-line"></i>
                              </button>
                            </li>
                          </ul>
                        </nav>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedEmployee && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header  text-white">
                <h5 className="modal-title">
                  <i className="ri-delete-bin-line me-2"></i>
                  Delete Employee
                </h5>
                <button type="button" className="btn-close btn-close" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-danger">
                  <i className="ri-error-warning-line me-2"></i>
                  <strong>Warning!</strong> This action cannot be undone.
                </div>
                <p>Are you sure you want to permanently delete <strong>{selectedEmployee.name}</strong> from the system?</p>
                <p className="text-muted small mb-0">
                  This will delete all data related to this employee including:
                  <ul className="mb-0 mt-2">
                    <li>User account from users table</li>
                    <li>Employee profile from employee_profiles table</li>
                    <li>All related assignments and records</li>
                  </ul>
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteConfirm}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <i className="ri-delete-bin-line me-2"></i>
                      Delete Permanently
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate/Activate Employee Modal */}
      {showDeactivateModal && selectedEmployee && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className={`modal-header text-white ${isEmployeeActive(selectedEmployee) ? 'bg-warning' : 'bg-success'}`}>
                <h5 className="modal-title">
                  <i className={`${isEmployeeActive(selectedEmployee) ? 'ri-user-unfollow-line' : 'ri-user-follow-line'} me-2`}></i>
                  {isEmployeeActive(selectedEmployee) ? 'Deactivate Employee' : 'Activate Employee'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowDeactivateModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className={`alert ${isEmployeeActive(selectedEmployee) ? 'alert-warning' : 'alert-success'}`}>
                  <i className={`${isEmployeeActive(selectedEmployee) ? 'ri-information-line' : 'ri-checkbox-circle-line'} me-2`}></i>
                  <strong>{isEmployeeActive(selectedEmployee) ? 'Notice:' : 'Activate Employee'}</strong> {isEmployeeActive(selectedEmployee) ? 'This will temporarily disable the employee account.' : 'This will re-enable the employee account.'}
                </div>
                <p>
                  Are you sure you want to {isEmployeeActive(selectedEmployee) ? 'deactivate' : 'activate'} <strong>{selectedEmployee.name}</strong>?
                </p>
                {isEmployeeActive(selectedEmployee) && (
                  <p className="text-muted small mb-0">
                    When deactivated:
                    <ul className="mb-0 mt-2">
                      <li>Employee will not be able to log in</li>
                      <li>Employee will not receive new task assignments</li>
                      <li>Existing tasks will remain assigned</li>
                      <li>You can reactivate the employee at any time</li>
                    </ul>
                  </p>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDeactivateModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn ${isEmployeeActive(selectedEmployee) ? 'btn-warning' : 'btn-success'}`}
                  onClick={handleDeactivateConfirm}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      {isEmployeeActive(selectedEmployee) ? 'Deactivating...' : 'Activating...'}
                    </>
                  ) : (
                    <>
                      <i className={`${isEmployeeActive(selectedEmployee) ? 'ri-user-unfollow-line' : 'ri-user-follow-line'} me-2`}></i>
                      {isEmployeeActive(selectedEmployee) ? 'Deactivate' : 'Activate'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Employee Modal */}
      {showReassignModal && selectedEmployee && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header  text-white">
                <h5 className="modal-title">
                  <i className="ri-refresh-line me-2"></i>
                  Reassign Employee
                </h5>
                <button type="button" className="btn-close btn-close-primary" onClick={() => setShowReassignModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3 p-3 bg-light rounded">
                  <h6 className="mb-1">{selectedEmployee.name}</h6>
                  <p className="mb-0 text-muted small">
                    Current Department: <strong>{selectedEmployee.departmentName || 'Unassigned'}</strong>
                  </p>
                </div>
                <div className="mb-3">
                  <label className="form-label">Select Department</label>
                  <select
                    className="form-select"
                    value={reassignDepartmentId}
                    onChange={(e) => setReassignDepartmentId(e.target.value)}
                    disabled={actionLoading}
                  >
                    <option value="">Unassigned (Remove from Department)</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  <div className="form-text">
                    Select a department to assign the employee, or leave unassigned to remove from department.
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowReassignModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={handleReassignConfirm}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Reassigning...
                    </>
                  ) : (
                    <>
                      <i className="ri-check-line me-2"></i>
                      Reassign Employee
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && selectedEmployee && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header  text-white">
                <h5 className="modal-title">
                  <i className="ri-edit-line me-2"></i>
                  Edit Employee Information
                </h5>
                <button type="button" className="btn-close btn-close-primary" onClick={() => setShowEditModal(false)}></button>
              </div>
              <div className="modal-body">
               

                {/* Form Fields */}
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email <span className="text-danger">*</span></label>
                    <input
                      type="email"
                      className="form-control"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Mobile</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.mobile}
                      onChange={(e) => setEditFormData({...editFormData, mobile: e.target.value})}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Role <span className="text-danger">*</span></label>
                    <select
                      className="form-select"
                      value={editFormData.role}
                      onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}
                      required
                    >
                      <option value="EMPL">Employee</option>
                      <option value="QA_TESTER">QA Tester</option>
                      <option value="TL">Team Leader</option>
                    </select>
                  </div>
                  
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowEditModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={handleEditConfirm}
                  disabled={actionLoading || !editFormData.name || !editFormData.email || !editFormData.role}
                >
                  {actionLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Updating...
                    </>
                  ) : (
                    <>
                      <i className="ri-save-line me-2"></i>
                      Update Employee
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee Details Modal - Slide in from right */}
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
              // Close if clicking outside modal content
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
                <div className="modal-header text-white border-0">
                  <h5 className="modal-title mb-0">
                    <i className="ri-user-line me-2"></i>
                    Employee Details
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close btn-close-primary" 
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
                            className="rounded-circle border border-3 border-primary"
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover',
                              position: 'absolute',
                              top: 0,
                              left: 0
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
                            className="avatar-title bg-primary bg-opacity-10 text-primary rounded-circle fs-1 modal-avatar-fallback border border-3 border-primary"
                            style={{ 
                              display: 'none', 
                              width: '100%', 
                              height: '100%',
                              position: 'absolute',
                              top: 0,
                              left: 0
                            }}
                          >
                            {selectedEmployee.name.charAt(0).toUpperCase()}
                          </div>
                        </>
                      ) : (
                        <div 
                          className="avatar-title bg-primary bg-opacity-10 text-primary rounded-circle fs-1 border border-3 border-primary"
                          style={{ width: '100%', height: '100%' }}
                        >
                          {selectedEmployee.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <h4 className="mb-1">{selectedEmployee.name}</h4>
                    <p className="text-muted mb-3">{selectedEmployee.designationTitle || 'Not Assigned'}</p>
                    
                    {/* Action Buttons - Icon Only */}
                    <div className="d-flex justify-content-center gap-2 flex-wrap">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => {
                          handleCloseEmployeeModal();
                          handleEditClick(selectedEmployee);
                        }}
                        title="Edit Employee"
                      >
                        <i className="ri-edit-line"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-info"
                        onClick={() => {
                          handleCloseEmployeeModal();
                          handleReassignClick(selectedEmployee);
                        }}
                        title="Reassign Employee"
                      >
                        <i className="ri-refresh-line"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => {
                          handleCloseEmployeeModal();
                          navigate(`/admin/employee-tasks?departmentId=${selectedEmployee.departmentId}&employeeId=${selectedEmployee.id}&userId=${selectedEmployee.id}`);
                        }}
                        title="View Employee Tasks"
                      >
                        <i className="ri-task-line"></i>
                      </button>
                     
                      <button
                        className={`btn btn-sm ${isEmployeeActive(selectedEmployee) ? 'btn-outline-warning' : 'btn-outline-success'}`}
                        onClick={() => {
                          handleCloseEmployeeModal();
                          handleDeactivateClick(selectedEmployee);
                        }}
                        title={isEmployeeActive(selectedEmployee) ? 'Deactivate Employee' : 'Activate Employee'}
                      >
                        <i className={isEmployeeActive(selectedEmployee) ? 'ri-user-unfollow-line' : 'ri-user-follow-line'}></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => {
                          handleCloseEmployeeModal();
                          navigate(`/UserProfile?id=${selectedEmployee.id}`);
                        }}
                        title="View Employee Profile"
                      >
                        <i className="ri-eye-line"></i>
                      </button>
                      {/* <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => {
                          handleCloseEmployeeModal();
                          handleDeleteClick(selectedEmployee);
                        }}
                        title="Delete Employee"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button> */}
                      
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

                        {selectedEmployee.employeeCode && (
                          <div className="mb-3">
                            <div className="d-flex align-items-center mb-2">
                              <i className="ri-id-card-line text-primary me-2 fs-5"></i>
                              <div>
                                <p className="text-muted mb-0 fs-12 text-uppercase">Employee Code</p>
                                <p className="mb-0 fw-medium">{selectedEmployee.employeeCode}</p>
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
                                  {selectedEmployee.role}
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
                                <span className={`badge ${getAssignmentStatusBadge(selectedEmployee.assignmentStatus)}`}>
                                  {selectedEmployee.departmentName || 'Unassigned'}
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
                                <span className={`badge ${selectedEmployee.isActive ? 'bg-success' : 'bg-danger'}`}>
                                  {selectedEmployee.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>

                        {selectedEmployee.createdAt && (
                          <div className="mb-3">
                            <div className="d-flex align-items-center mb-2">
                              <i className="ri-calendar-check-line text-primary me-2 fs-5"></i>
                              <div>
                                <p className="text-muted mb-0 fs-12 text-uppercase">Joining Date</p>
                                <p className="mb-0 fw-medium">
                                  {new Date(selectedEmployee.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
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

export default AllEmployeesManagement;

