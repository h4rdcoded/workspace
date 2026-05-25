import React, { useState, useContext, useEffect } from 'react';
import { ConfigContext } from '../Context/ConfigContext';
import { buildApiUrl, getAuthHeaders } from '../config/api';
import axios from 'axios';

const EmployeeProfileModal = ({ 
  employee, 
  isOpen, 
  onClose,
  onEdit,
  onReassign,
  onDelete,
  showActions = true
}) => {
  const { staticFilesBaseURL } = useContext(ConfigContext);
  const [isClosing, setIsClosing] = useState(false);
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch full employee details - always fetch from API if ID is available
  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      if (!isOpen || !employee) {
        setEmployeeData(null);
        setLoading(false);
        return;
      }

      // Always set employee data immediately from props (for quick display)
      setEmployeeData(employee);
      setLoading(false);

      // Always fetch from API if we have an ID to ensure we have complete data
      if (employee.id) {
        try {
          setLoading(true);
          const response = await axios.get(
            buildApiUrl(`/users/${employee.id}`),
            { headers: getAuthHeaders() }
          );

          // Handle different response structures
          let userData = null;
          
          if (response.data && response.data.success) {
            // Try different possible response structures
            userData = response.data.data?.user || 
                      response.data.data || 
                      response.data.user || 
                      response.data;
          } else if (response.data) {
            // Even if success is false, try to extract data
            userData = response.data.data?.user || response.data.data || response.data.user || response.data;
          }

          if (userData && typeof userData === 'object') {
            // Extract nested objects if they exist (for designation and department)
            const designationObj = userData.designation || (userData.designation_id ? { title: userData.designation_title } : null);
            const departmentObj = userData.department || (userData.department_id ? { name: userData.department_name } : null);
            
            // Merge API data with provided employee data (API data takes precedence)
            const mergedData = {
              ...employee,
              ...userData,
              // Preserve critical fields from provided data if API doesn't have them
              id: userData.id || employee.id,
              name: userData.name || employee.name,
              email: userData.email || employee.email,
              mobile: userData.mobile || employee.mobile,
              role: userData.role || employee.role,
              // Map profile image - prioritize API data, check both snake_case and camelCase
              profile_image: userData.profile_image || 
                            userData.profileImage || 
                            employee?.profile_image || 
                            employee?.profileImage || 
                            null,
              // Map designation - check object first, then direct fields, then nested
              designation_title: designationObj?.title || 
                                userData.designation_title || 
                                userData.designation || 
                                userData.designationTitle || 
                                employee.designation_title || 
                                employee.designation || 
                                employee.designationTitle || 
                                null,
              // Map department - check object first, then direct fields, then nested
              department_name: departmentObj?.name || 
                              userData.department_name || 
                              userData.departmentName || 
                              userData.department || 
                              employee.department_name || 
                              employee.departmentName || 
                              employee.department || 
                              null,
              // Map employee code
              employee_code: userData.employee_code || 
                            userData.employeeCode || 
                            employee.employee_code || 
                            employee.employeeCode || 
                            null,
              // Map status - check both snake_case and camelCase
              is_active: userData.is_active !== undefined ? userData.is_active : 
                        (userData.isActive !== undefined ? userData.isActive : 
                        (employee.is_active !== undefined ? employee.is_active : 
                        (employee.isActive !== undefined ? employee.isActive : null))),
              // Map dates - check multiple field names
              created_at: userData.created_at || 
                         userData.createdAt || 
                         userData.joining_date || 
                         userData.joiningDate || 
                         employee.created_at || 
                         employee.createdAt || 
                         null,
            };
            
            setEmployeeData(mergedData);
          }
        } catch (error) {
          // On error, keep the provided employee data (already set above)
          // Don't overwrite with null
        } finally {
          setLoading(false);
        }
      }
    };

    fetchEmployeeDetails();
  }, [isOpen, employee]);

  // Close modal with smooth animation
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setEmployeeData(null);
    }, 300); // Match animation duration
  };

  // Function to get profile image URL with fallback
  const getProfileImageUrl = (emp) => {
    if (!emp) return null;
    
    // Check multiple possible field names
    const profileImage = emp.profile_image || emp.profileImage;
    
    if (!profileImage || profileImage === 'null' || profileImage === 'undefined') {
      return null;
    }
    
    // Remove query parameters if any
    const imagePath = String(profileImage).split('?')[0].trim();
    
    if (!imagePath || imagePath === 'null' || imagePath === 'undefined') {
      return null;
    }
    
    // Check if it's already a full URL
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return `${imagePath}?t=${new Date().getTime()}`;
    }
    
    // Use staticFilesBaseURL if available, otherwise construct from server URL
    const baseUrl = staticFilesBaseURL || process.env.REACT_APP_SERVER_URL || 'https://task.ipshopy.com';
    
    // Handle different path formats
    let cleanPath = imagePath;
    
    // Remove leading slash if present
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }
    
    // Remove 'storage/' prefix if present (common in Laravel)
    if (cleanPath.startsWith('storage/')) {
      cleanPath = cleanPath.substring(8);
    }
    
    // Construct the full URL
    if (staticFilesBaseURL) {
      // staticFilesBaseURL should already have trailing slash or not, handle both cases
      const base = staticFilesBaseURL.endsWith('/') ? staticFilesBaseURL.slice(0, -1) : staticFilesBaseURL;
      // Check if base already includes storage path
      if (cleanPath.startsWith('storage/') || cleanPath.startsWith('public/')) {
        return `${base}/${cleanPath}?t=${new Date().getTime()}`;
      } else {
        return `${base}/storage/${cleanPath}?t=${new Date().getTime()}`;
      }
    } else {
      // Fallback to baseUrl
      if (cleanPath.startsWith('storage/') || cleanPath.startsWith('public/')) {
        return `${baseUrl}/${cleanPath}?t=${new Date().getTime()}`;
      } else {
        return `${baseUrl}/storage/${cleanPath}?t=${new Date().getTime()}`;
      }
    }
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

  // Get assignment status badge
  const getAssignmentStatusBadge = (status) => {
    switch (status) {
      case 'assigned': return 'bg-success';
      case 'unassigned': return 'bg-warning';
      case 'removed': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  // Handle action button clicks
  const handleEditClick = () => {
    handleClose();
    if (onEdit) {
      setTimeout(() => onEdit(employee), 350);
    }
  };

  const handleReassignClick = () => {
    handleClose();
    if (onReassign) {
      setTimeout(() => onReassign(employee), 350);
    }
  };

  const handleDeleteClick = () => {
    handleClose();
    if (onDelete) {
      setTimeout(() => onDelete(employee), 350);
    }
  };

  if (!isOpen) return null;

  // Use fetched employee data or fallback to provided employee
  const displayEmployee = employeeData || employee;
  
  // If no employee data at all, don't render
  if (!displayEmployee && !employee) {
    return null;
  }
  
  // Check if user is admin - check both displayEmployee and employee
  const roleValue = displayEmployee?.role || employee?.role;
  const isAdmin = roleValue === 'ADMIN';
  
  // Get designation - check multiple possible field names and nested objects
  const designation = displayEmployee?.designation_title || 
                      displayEmployee?.designation?.title ||
                      displayEmployee?.designation || 
                      displayEmployee?.designationTitle || 
                      employee?.designation_title ||
                      employee?.designation?.title ||
                      employee?.designation ||
                      employee?.designationTitle ||
                      null;
  
  // Get department - check multiple possible field names and nested objects
  const department = displayEmployee?.department_name || 
                    displayEmployee?.department?.name ||
                    displayEmployee?.departmentName || 
                    displayEmployee?.department || 
                    employee?.department_name ||
                    employee?.department?.name ||
                    employee?.departmentName ||
                    employee?.department ||
                    null;
  
  // Get employee code - check multiple possible field names
  const employeeCode = displayEmployee?.employee_code || 
                      displayEmployee?.employeeCode || 
                      employee?.employee_code || 
                      employee?.employeeCode || 
                      null;
  
  // Get joining date - check multiple possible field names
  const joiningDate = displayEmployee?.joining_date || 
                     displayEmployee?.joiningDate || 
                     displayEmployee?.created_at || 
                     displayEmployee?.createdAt || 
                     employee?.joining_date ||
                     employee?.joiningDate ||
                     employee?.created_at || 
                     employee?.createdAt || 
                     null;
  
  // Get email
  const email = displayEmployee?.email || employee?.email || null;
  
  // Get mobile
  const mobile = displayEmployee?.mobile || employee?.mobile || null;
  
  // Get role
  const role = roleValue || null;
  
  // Get status - check both snake_case and camelCase
  const isActive = displayEmployee?.isActive !== undefined ? displayEmployee.isActive : 
                  (displayEmployee?.is_active !== undefined ? displayEmployee.is_active : 
                  (employee?.isActive !== undefined ? employee.isActive : 
                  (employee?.is_active !== undefined ? employee.is_active : null)));
  
  // Get profile image - check multiple possible field names
  const profileImage = displayEmployee?.profile_image || 
                      displayEmployee?.profileImage || 
                      employee?.profile_image || 
                      employee?.profileImage || 
                      null;

  return (
    <>
      {/* Light Backdrop - Semi-transparent */}
      <div 
        onClick={handleClose}
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
            handleClose();
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
            <div className="modal-header text-white border-0" style={{ backgroundColor: '#4b6cb7' }}>
              <h5 className="modal-title mb-0">
                <i className="ri-user-line me-2"></i>
                Employee Details
              </h5>
              <button 
                type="button" 
                className="btn-close btn-close-white" 
                onClick={handleClose}
                aria-label="Close"
              ></button>
            </div>

            {/* Modal Body */}
            <div className="modal-body p-4">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3 text-muted">Loading employee details...</p>
                </div>
              ) : (
                <>
                  {/* Large Profile Picture */}
                  <div className="text-center mb-3 pb-3 border-bottom">
                    <div className="avatar-xxl mx-auto position-relative mb-3" style={{ width: '200px', height: '200px' }}>
                      {getProfileImageUrl(displayEmployee) ? (
                        <>
                          <img
                            src={getProfileImageUrl(displayEmployee)}
                            alt={displayEmployee?.name || employee?.name || 'Employee'}
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
                            className="avatar-title bg-primary bg-opacity-10 text-primary rounded-circle fs-1 modal-avatar-fallback border border-3 border-primary d-flex align-items-center justify-content-center"
                            style={{ 
                              display: 'none', 
                              width: '100%', 
                              height: '100%',
                              position: 'absolute',
                              top: 0,
                              left: 0
                            }}
                          >
                            {(displayEmployee?.name || employee?.name || 'E').charAt(0).toUpperCase()}
                          </div>
                        </>
                      ) : (
                        <div 
                          className="avatar-title bg-primary bg-opacity-10 text-primary rounded-circle fs-1 border border-3 border-primary d-flex align-items-center justify-content-center"
                          style={{ width: '100%', height: '100%' }}
                        >
                          {(displayEmployee?.name || employee?.name || 'E').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <h4 className="mb-1">{displayEmployee?.name || employee?.name || 'Unknown'}</h4>
                    {isAdmin ? (
                      <p className="text-muted mb-3">
                        <span className={`badge ${getRoleBadgeColor(role)}`}>
                          Administrator
                        </span>
                      </p>
                    ) : (
                      <p className="text-muted mb-3">
                        {designation || 'Not Assigned'}
                      </p>
                    )}
                    
                    {/* Action Buttons - Icon Only */}
                    {showActions && (onEdit || onReassign || onDelete) && (
                      <div className="d-flex justify-content-center gap-2">
                        {onEdit && (
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={handleEditClick}
                            title="Edit Employee"
                          >
                            <i className="ri-edit-line"></i>
                          </button>
                        )}
                        {onReassign && (
                          <button
                            className="btn btn-sm btn-outline-info"
                            onClick={handleReassignClick}
                            title="Reassign Employee"
                          >
                            <i className="ri-refresh-line"></i>
                          </button>
                        )}
                        {onDelete && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={handleDeleteClick}
                            title="Delete Employee"
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Employee Information */}
                  <div className="card border-0 shadow-sm mb-3">
                    <div className="card-body">
                      <h6 className="mb-3 text-primary">
                        <i className="ri-information-line me-2"></i>
                        {isAdmin ? 'Administrator Information' : 'Employee Information'}
                      </h6>
                      <div className="pt-2">
                        {/* Email - Always show */}
                        <div className="mb-3 pb-3 border-bottom">
                          <div className="d-flex align-items-center">
                            <div className="avatar-sm bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                              <i className="ri-mail-line text-primary fs-5"></i>
                            </div>
                            <div className="flex-grow-1">
                              <p className="text-muted mb-0 fs-12 text-uppercase fw-semibold">Email</p>
                              <p className="mb-0 fw-bold">{email || 'Not available'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Mobile - Always show */}
                        <div className="mb-3 pb-3 border-bottom">
                          <div className="d-flex align-items-center">
                            <div className="avatar-sm bg-info bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                              <i className="ri-phone-line text-info fs-5"></i>
                            </div>
                            <div className="flex-grow-1">
                              <p className="text-muted mb-0 fs-12 text-uppercase fw-semibold">Mobile</p>
                              <p className="mb-0 fw-bold">{mobile || 'Not available'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Employee Code - Only show for non-admin employees */}
                        {!isAdmin && employeeCode && (
                          <div className="mb-3 pb-3 border-bottom">
                            <div className="d-flex align-items-center">
                              <div className="avatar-sm bg-secondary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                                <i className="ri-id-card-line text-secondary fs-5"></i>
                              </div>
                              <div className="flex-grow-1">
                                <p className="text-muted mb-0 fs-12 text-uppercase fw-semibold">Employee Code</p>
                                <p className="mb-0 fw-bold">{employeeCode}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Role - Always show */}
                        <div className="mb-3 pb-3 border-bottom">
                          <div className="d-flex align-items-center">
                            <div className="avatar-sm bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                              <i className="ri-shield-user-line text-warning fs-5"></i>
                            </div>
                            <div className="flex-grow-1">
                              <p className="text-muted mb-0 fs-12 text-uppercase fw-semibold">Role</p>
                              <p className="mb-0">
                                {role ? (
                                  <span className={`badge ${getRoleBadgeColor(role)}`}>
                                    {role === 'ADMIN' ? 'Administrator' : 
                                     role === 'TL' ? 'Team Leader' :
                                     role === 'EXEC' ? 'Executive' :
                                     role === 'EMPL' ? 'Employee' :
                                     role}
                                  </span>
                                ) : (
                                  <span className="text-muted">Not available</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Designation - Only show for non-admin employees */}
                        {!isAdmin && (
                          <div className="mb-3 pb-3 border-bottom">
                            <div className="d-flex align-items-center">
                              <div className="avatar-sm bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                                <i className="ri-briefcase-line text-success fs-5"></i>
                              </div>
                              <div className="flex-grow-1">
                                <p className="text-muted mb-0 fs-12 text-uppercase fw-semibold">Designation</p>
                                <p className="mb-0 fw-bold">{designation || 'Not assigned'}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Department - Only show for non-admin employees */}
                        {!isAdmin && (
                          <div className="mb-3 pb-3 border-bottom">
                            <div className="d-flex align-items-center">
                              <div className="avatar-sm bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                                <i className="ri-building-line text-primary fs-5"></i>
                              </div>
                              <div className="flex-grow-1">
                                <p className="text-muted mb-0 fs-12 text-uppercase fw-semibold">Department</p>
                                <p className="mb-0 fw-bold">{department || 'Not assigned'}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Status - Always show */}
                        <div className="mb-3 pb-3 border-bottom">
                          <div className="d-flex align-items-center">
                            <div className="avatar-sm bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                              <i className="ri-checkbox-circle-line text-success fs-5"></i>
                            </div>
                            <div className="flex-grow-1">
                              <p className="text-muted mb-0 fs-12 text-uppercase fw-semibold">Status</p>
                              <p className="mb-0">
                                {isActive !== null && isActive !== undefined ? (
                                  <span className={`badge ${isActive ? 'bg-success' : 'bg-danger'}`}>
                                    {isActive ? 'Active' : 'Inactive'}
                                  </span>
                                ) : (
                                  <span className="text-muted">Not available</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Joining Date / Created Date - Always show */}
                        <div className="mb-3">
                          <div className="d-flex align-items-center">
                            <div className="avatar-sm bg-info bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                              <i className="ri-calendar-check-line text-info fs-5"></i>
                            </div>
                            <div className="flex-grow-1">
                              <p className="text-muted mb-0 fs-12 text-uppercase fw-semibold">
                                {isAdmin ? 'Account Created' : 'Joining Date'}
                              </p>
                              <p className="mb-0 fw-bold">
                                {joiningDate ? (
                                  new Date(joiningDate).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })
                                ) : (
                                  <span className="text-muted">Not available</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
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
  );
};

export default EmployeeProfileModal;

