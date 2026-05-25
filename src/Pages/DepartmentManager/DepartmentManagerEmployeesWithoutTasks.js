import React, { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../Context/ConfigContext';
import PageTitle from '../../Components/PageTitle';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { buildApiUrl, getAuthHeaders } from '../../config/api';

const DepartmentManagerEmployeesWithoutTasks = () => {
  const { leadCrmApiURL, leadCrmHeaders, staticFilesBaseURL, leadCrmUser } = useContext(ConfigContext);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [employeesData, setEmployeesData] = useState(null);
  const [departmentId, setDepartmentId] = useState(null);
  const [departmentName, setDepartmentName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Fetch department ID first
  useEffect(() => {
    const fetchDepartmentId = async () => {
      try {
        const response = await axios.get(
          buildApiUrl('/departments'),
          { headers: getAuthHeaders() }
        );

        if (response.data.success) {
          const userDepartments = response.data.data.filter(dept => {
            return dept.manager_id === leadCrmUser.id;
          });

          if (userDepartments.length > 0) {
            setDepartmentId(userDepartments[0].id);
            setDepartmentName(userDepartments[0].name);
          }
        }
      } catch (error) {
        console.error('Error fetching department:', error);
      }
    };

    if (leadCrmUser && leadCrmUser.id) {
      fetchDepartmentId();
    }
  }, [leadCrmUser]);

  // Fetch employees without tasks
  const fetchEmployeesWithoutTasks = async () => {
    if (!departmentId) return;

    try {
      setLoading(true);
      
      const response = await axios.get(
        buildApiUrl(`/departments/${departmentId}/manager/employees/without-tasks`),
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        setEmployeesData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching employees without tasks:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (departmentId) {
      fetchEmployeesWithoutTasks();
    }
  }, [departmentId]);

  // Sort employees
  const sortEmployees = (employees) => {
    return [...employees].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      // Handle null/undefined values
      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';
      
      // Convert to string for comparison
      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  };

  // Filter employees by search term
  const filterEmployees = (employees) => {
    if (!searchTerm) return employees;
    
    const term = searchTerm.toLowerCase();
    return employees.filter(emp => 
      emp.name.toLowerCase().includes(term) ||
      emp.email.toLowerCase().includes(term) ||
      emp.role.toLowerCase().includes(term)
    );
  };

  // Handle sort change
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
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

  // Handle employee card click
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

  if (loading) {
    return (
      <div className="main-content">
        <div className="page-content">
          <div className="container-fluid">
            <PageTitle title="Free Employees" primary="Task Management" />
            <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
              <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading employees data...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!employeesData) {
    return (
      <div className="main-content">
        <div className="page-content">
          <div className="container-fluid">
            <PageTitle title="Free Employees" primary="Task Management" />
            <div className="alert alert-warning" role="alert">
              No data available
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Prepare data for display
  const departments = Object.values(employeesData.employees_by_department || {});
  
  // Filter and sort departments
  const filteredDepartments = departments.map(dept => {
    const filteredEmployees = filterEmployees(dept.employees);
    const sortedEmployees = sortEmployees(filteredEmployees);
    return {
      ...dept,
      employees: sortedEmployees,
      employeeCount: sortedEmployees.length
    };
  }).filter(dept => dept.employeeCount > 0 || !searchTerm); // Show all departments when not searching

  return (
    <div className="main-content">
      <div className="page-content">
        <div className="container-fluid">
          <PageTitle title="Free Employees" primary="Task Management" />
          
          {/* Header */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-1">Employees Without Assigned Tasks</h4>
                  <p className="text-muted mb-0">
                    {departmentName && (
                      <span>Department: <strong>{departmentName}</strong> • </span>
                    )}
                    Showing {employeesData.total_count} employee{employeesData.total_count !== 1 ? 's' : ''} without active tasks
                  </p>
                </div>
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={() => navigate(-1)}
                  >
                    <i className="ri-arrow-left-line me-1"></i>
                    Back
                  </button>
                  <button 
                    className="btn btn-outline-primary"
                    onClick={fetchEmployeesWithoutTasks}
                  >
                    <i className="ri-refresh-line me-1"></i>
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Search and Filters */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm rounded-3">
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="ri-search-line"></i>
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search employees by name, email, or role..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                          <button 
                            className="btn btn-outline-secondary" 
                            type="button"
                            onClick={() => setSearchTerm('')}
                          >
                            <i className="ri-close-line"></i>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="d-flex gap-2">
                        <select
                          className="form-select"
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                        >
                          <option value="name">Sort by Name</option>
                          <option value="email">Sort by Email</option>
                          <option value="role">Sort by Role</option>
                        </select>
                        <button 
                          className="btn btn-outline-primary"
                          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        >
                          {sortOrder === 'asc' ? (
                            <i className="ri-sort-asc"></i>
                          ) : (
                            <i className="ri-sort-desc"></i>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Department-wise Employee List */}
          {filteredDepartments.length > 0 ? (
            filteredDepartments.map((dept) => (
              <div key={dept.department_id} className="row mb-4">
                <div className="col-12">
                  <div className="card border-0 shadow-sm rounded-3">
                    <div className="card-header bg-white border-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h5 className="mb-0">{dept.department_name || 'Unassigned Department'}</h5>
                          <p className="text-muted mb-0 small">
                            {dept.employeeCount} employee{dept.employeeCount !== 1 ? 's' : ''} without tasks
                          </p>
                        </div>
                        <span className="badge bg-primary rounded-pill">
                          {dept.employeeCount}
                        </span>
                      </div>
                    </div>
                    <div className="card-body">
                      {dept.employees.length > 0 ? (
                        <div className="row g-3">
                          {dept.employees.map((employee) => (
                            <div key={employee.id} className="col-xl-3 col-md-4 col-sm-6">
                              <div 
                                className="card border shadow-sm h-100 card-hover"
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleEmployeeClick(employee)}
                              >
                                <div className="card-body text-center">
                                  <div className="mb-3">
                                    <div className="avatar-lg mx-auto position-relative">
                                      {getProfileImageUrl(employee) ? (
                                        <>
                                          <img
                                            src={getProfileImageUrl(employee)}
                                            alt={employee.name}
                                            className="rounded-circle"
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
                                              const fallback = e.target.parentElement.querySelector('.card-avatar-fallback');
                                              if (fallback) {
                                                fallback.style.display = 'flex';
                                              }
                                            }}
                                          />
                                          <div 
                                            className="avatar-title rounded-circle bg-primary bg-opacity-10 text-primary fs-3 card-avatar-fallback"
                                            style={{ 
                                              display: 'none', 
                                              width: '100%', 
                                              height: '100%',
                                              position: 'absolute',
                                              top: 0,
                                              left: 0
                                            }}
                                          >
                                            {employee.name.charAt(0).toUpperCase()}
                                          </div>
                                        </>
                                      ) : (
                                        <div className="avatar-title rounded-circle bg-primary bg-opacity-10 text-primary fs-3" style={{ width: '100%', height: '100%' }}>
                                          {employee.name.charAt(0).toUpperCase()}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <h5 className="mb-2">{employee.name}</h5>
                                  <div className="mb-2">
                                    <span className={`badge ${
                                      employee.role === 'EXEC' ? 'bg-info' : 
                                      employee.role === 'EMPL' ? 'bg-secondary' : 
                                      employee.role === 'TL' ? 'bg-primary' : 'bg-secondary'
                                    }`}>
                                      {employee.role === 'EXEC' ? 'Executive' : 
                                       employee.role === 'EMPL' ? 'Employee' : 
                                       employee.role === 'TL' ? 'Team Leader' : employee.role}
                                    </span>
                                  </div>
                                  {employee.last_task_completed_date ? (
                                    <div className="mt-2">
                                      <small className="text-muted d-flex align-items-center justify-content-center flex-column">
                                        <div className="d-flex align-items-center">
                                          <i className="ri-checkbox-circle-line text-success me-1"></i>
                                          <span>Last task: {new Date(employee.last_task_completed_date).toLocaleDateString('en-US', { 
                                            month: 'short', 
                                            day: 'numeric', 
                                            year: 'numeric' 
                                          })}</span>
                                        </div>
                                        <div className="mt-1">
                                          <i className="ri-time-line text-muted me-1" style={{ fontSize: '0.75rem' }}></i>
                                          <span style={{ fontSize: '0.75rem' }}>
                                            {new Date(employee.last_task_completed_date).toLocaleTimeString('en-US', { 
                                              hour: '2-digit', 
                                              minute: '2-digit',
                                              hour12: true
                                            })}
                                          </span>
                                        </div>
                                      </small>
                                    </div>
                                  ) : (
                                    <div className="mt-2">
                                      <small className="text-muted d-flex align-items-center justify-content-center">
                                        <i className="ri-information-line text-warning me-1"></i>
                                        <span>No tasks Assigned</span>
                                      </small>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <i className="ri-user-line display-4 text-muted"></i>
                          <h5 className="mt-3">No employees found</h5>
                          <p className="text-muted">
                            {searchTerm 
                              ? `No employees in ${dept.department_name || 'this department'} match your search.` 
                              : `No employees in ${dept.department_name || 'this department'} are without tasks.`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="row">
              <div className="col-12">
                <div className="card border-0 shadow-sm rounded-3">
                  <div className="card-body text-center py-5">
                    <i className="ri-user-line display-4 text-muted"></i>
                    <h5 className="mt-3">
                      {searchTerm ? 'No employees found' : 'No employees without tasks'}
                    </h5>
                    <p className="text-muted">
                      {searchTerm 
                        ? 'No employees match your search criteria.' 
                        : 'All employees in your department have at least one assigned task.'}
                    </p>
                    {!searchTerm && (
                      <button 
                        className="btn btn-primary rounded-pill"
                        onClick={() => setSearchTerm('')}
                      >
                        <i className="ri-refresh-line me-1"></i>
                        Refresh Data
                      </button>
                    )}
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
                    <p className="text-muted mb-3">{selectedEmployee.designation_title || 'Not Assigned'}</p>
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

                        {selectedEmployee.employee_code && (
                          <div className="mb-3">
                            <div className="d-flex align-items-center mb-2">
                              <i className="ri-id-card-line text-primary me-2 fs-5"></i>
                              <div>
                                <p className="text-muted mb-0 fs-12 text-uppercase">Employee Code</p>
                                <p className="mb-0 fw-medium">{selectedEmployee.employee_code}</p>
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
                                  {selectedEmployee.role === 'EXEC' ? 'Executive' : 
                                   selectedEmployee.role === 'EMPL' ? 'Employee' : 
                                   selectedEmployee.role === 'TL' ? 'Team Leader' : selectedEmployee.role}
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
                              <p className="mb-0 fw-medium">{selectedEmployee.department_name || 'Unassigned'}</p>
                            </div>
                          </div>
                        </div>

                        {selectedEmployee.created_at && (
                          <div className="mb-3">
                            <div className="d-flex align-items-center mb-2">
                              <i className="ri-calendar-check-line text-primary me-2 fs-5"></i>
                              <div>
                                <p className="text-muted mb-0 fs-12 text-uppercase">Joined Date</p>
                                <p className="mb-0 fw-medium">
                                  {new Date(selectedEmployee.created_at).toLocaleDateString('en-US', {
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
      </div>
    </div>
  );
};

export default DepartmentManagerEmployeesWithoutTasks;

