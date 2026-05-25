import React, { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../Context/ConfigContext';
import { toast } from 'react-toastify';
import { buildApiUrl, getAuthHeaders } from '../../config/api';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const MyTeam = () => {
  const { leadCrmUser, staticFilesBaseURL } = useContext(ConfigContext);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamStats, setTeamStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    departmentName: '',
    teamLeaderName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [departmentId, setDepartmentId] = useState(null);
  const navigate = useNavigate();
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Function to get profile image URL with fallback
  const getProfileImageUrl = (member) => {
    if (member && member.profile_image) {
      // Use staticFilesBaseURL if available, otherwise construct from server URL
      const baseUrl = staticFilesBaseURL || process.env.REACT_APP_SERVER_URL || 'https://task.ipshopy.com';
      // Remove query parameters if any and add timestamp for cache busting
      const imagePath = member.profile_image.split('?')[0];
      if (staticFilesBaseURL) {
        return `${staticFilesBaseURL}/${imagePath}?t=${new Date().getTime()}`;
      } else {
        return `${baseUrl}${imagePath.startsWith('/') ? imagePath : '/' + imagePath}?t=${new Date().getTime()}`;
      }
    }
    return null; // Return null to show fallback
  };

  // Handle employee card click
  const handleMemberClick = (member) => {
    setSelectedMember(member);
    setShowMemberModal(true);
  };

  // Close modal with smooth animation
  const handleCloseModal = () => {
    setIsClosing(true);
    // Wait for animation to complete before removing modal
    setTimeout(() => {
      setShowMemberModal(false);
      setSelectedMember(null);
      setIsClosing(false);
    }, 300); // Match animation duration
  };

  useEffect(() => {
    // Check if user is authenticated and has the right role
    if (!leadCrmUser || (leadCrmUser.role !== 'TL' && leadCrmUser.role !== 'ADMIN')) {
      toast.error('Access denied. Only team leaders can access this page.');
      navigate('/dashboard');
      return;
    }

    // Get the department ID for this team leader
    fetchTeamLeaderDepartment();
  }, [leadCrmUser]);

  const fetchTeamLeaderDepartment = async () => {
    setIsLoading(true);
    try {
      // Get team leader's department
      const response = await axios.get(
        buildApiUrl('/team-leader/info'),
        { headers: getAuthHeaders() }
      );

      if (response.data.success && response.data.data.department_info) {
        const deptId = response.data.data.department_info.id;
        const deptName = response.data.data.department_info.name;
        setDepartmentId(deptId);
        setTeamStats(prev => ({
          ...prev,
          departmentName: deptName,
          teamLeaderName: leadCrmUser.name
        }));
        fetchTeamMembers(deptId);
      } else {
        toast.error('Failed to retrieve department information');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching department info:', error);
      toast.error('Error fetching department information');
      setIsLoading(false);
    }
  };

  const fetchTeamMembers = async (deptId) => {
    setIsLoading(true);
    try {
      // Use the actual API endpoint to get team members for department system
      const response = await axios.get(
        buildApiUrl(`/departments/${deptId}/team-leader/my-team`),
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        const members = response.data.data || [];
        setTeamMembers(members);
        setTeamStats(prev => ({
          ...prev,
          totalMembers: members.length,
          activeMembers: members.filter(member => member.status === 'ACTIVE').length
        }));
      } else {
        toast.error(response.data.message || 'Failed to fetch team data');
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
      toast.error('Error fetching team data. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    if (departmentId) {
      fetchTeamMembers(departmentId);
    }
  };

  if (!leadCrmUser || (leadCrmUser.role !== 'TL' && leadCrmUser.role !== 'ADMIN')) {
    return (
      <div className="main-content">
        <div className="page-content">
          <div className="container-fluid">
            <div className="row">
              <div className="col-12">
                <div className="card border-0 shadow-sm rounded-3">
                  <div className="card-body">
                    <div className="text-center py-5">
                      <div className="avatar-md mx-auto mb-4">
                        <div className="avatar-title bg-warning-subtle text-warning rounded-circle fs-24">
                          <i className="ri-error-warning-line"></i>
                        </div>
                      </div>
                      <h4 className="text-danger">Access Denied</h4>
                      <p className="text-muted">
                        This page is only accessible to Team Leaders and Department Managers.
                      </p>
                      <button 
                        className="btn btn-primary mt-3 rounded-pill px-4"
                        onClick={() => navigate('/dashboard')}
                      >
                        Back to Dashboard
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading && teamMembers.length === 0) {
    return (
      <div className="main-content">
        <div className="page-content">
          <div className="container-fluid">
            <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
              <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted">Loading your team members...</p>
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
                  <h4 className="mb-0">My Team</h4>
                  <p className="text-muted mb-0">Manage and view your team members</p>
                </div>
                
              </div>
            </div>
          </div>

          {/* Team Stats */}
          <div className="row">
            <div className="col-xl-3 col-md-6 mb-4">
              <div className="card border-0 shadow-sm rounded-3 h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-3">
                    <div className="flex-grow-1">
                      <p className="text-uppercase fw-medium text-muted mb-0 fs-12">
                        Department
                      </p>
                    </div>
                    <div className="avatar-xs">
                      <span className="avatar-title bg-primary-subtle text-primary rounded-circle">
                        <i className="bx bx-building"></i>
                      </span>
                    </div>
                  </div>
                  <h5 className="card-title mb-0">
                    {teamStats.departmentName || 'N/A'}
                  </h5>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6 mb-4">
              <div className="card border-0 shadow-sm rounded-3 h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-3">
                    <div className="flex-grow-1">
                      <p className="text-uppercase fw-medium text-muted mb-0 fs-12">
                        Team Members
                      </p>
                    </div>
                    <div className="avatar-xs">
                      <span className="avatar-title bg-success-subtle text-success rounded-circle">
                        <i className="bx bx-group"></i>
                      </span>
                    </div>
                  </div>
                  <h4 className="fs-20 fw-semibold mb-0">
                    {teamMembers.length}
                  </h4>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6 mb-4">
              <div className="card border-0 shadow-sm rounded-3 h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-3">
                    <div className="flex-grow-1">
                      <p className="text-uppercase fw-medium text-muted mb-0 fs-12">
                        Inactive Members
                      </p>
                    </div>
                    <div className="avatar-xs">
                      <span className="avatar-title bg-info-subtle text-info rounded-circle">
                        <i className="bx bx-user-check"></i>
                      </span>
                    </div>
                  </div>
                  <h4 className="fs-20 fw-semibold mb-0">
                    {teamStats.inactiveMembers || 0}
                  </h4>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6 mb-4">
              <div className="card border-0 shadow-sm rounded-3 h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-3">
                    <div className="flex-grow-1">
                      <p className="text-uppercase fw-medium text-muted mb-0 fs-12">
                        Team Leader
                      </p>
                    </div>
                    <div className="avatar-xs">
                      <span className="avatar-title bg-warning-subtle text-warning rounded-circle">
                        <i className="bx bx-user"></i>
                      </span>
                    </div>
                  </div>
                  <h5 className="fs-20 fw-semibold mb-0">
                    {teamStats.teamLeaderName || 'N/A'}
                  </h5>
                </div>
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div className="row">
            <div className="col-12">
              <div className="card border-0 shadow-sm rounded-3">
                <div className="card-header bg-white border-0 pb-0">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <h5 className="card-title mb-0">Team Members</h5>
                      <p className="text-muted mb-0 fs-14">
                        {teamMembers.length} {teamMembers.length === 1 ? 'member' : 'members'} in your team
                      </p>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  {teamMembers.length > 0 ? (
                    <div className="row">
                      {teamMembers.map(member => (
                        <div key={member.user_id} className="col-xl-4 col-md-6 mb-4">
                          <div 
                            className="card border shadow-none card-animate rounded-3 h-100"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleMemberClick(member)}
                          >
                            <div className="card-body">
                              <div className="d-flex align-items-center mb-3">
                                <div className="flex-shrink-0 me-3">
                                  <div className="avatar-md position-relative">
                                    {getProfileImageUrl(member) ? (
                                      <>
                                        <img
                                          src={getProfileImageUrl(member)}
                                          alt={member.name}
                                          className="rounded-circle"
                                          style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
                                          onError={(e) => {
                                            // Hide image and show fallback if image fails to load
                                            e.target.style.display = 'none';
                                            const fallback = e.target.parentElement.querySelector('.avatar-fallback');
                                            if (fallback) {
                                              fallback.style.display = 'flex';
                                            }
                                          }}
                                        />
                                        <div 
                                          className="avatar-title bg-primary bg-opacity-10 text-primary rounded-circle fs-4 avatar-fallback"
                                          style={{ display: 'none', width: '100%', height: '100%' }}
                                        >
                                          {member.name.charAt(0).toUpperCase()}
                                        </div>
                                      </>
                                    ) : (
                                      <div className="avatar-title bg-primary bg-opacity-10 text-primary rounded-circle fs-4" style={{ width: '100%', height: '100%' }}>
                                        {member.name.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex-grow-1">
                                  <h5 className="mb-1">{member.name}</h5>
                                  <p className="text-muted mb-1 fs-14">
                                    <i className="ri-mail-line align-middle me-1"></i>
                                    {member.email}
                                  </p>
                                
                                </div>
                              </div>
                              
                              <div className="mt-3 pt-3 border-top">
                                <div className="row">
                                  <div className="col-6">
                                    <div>
                                      <p className="text-muted text-uppercase fs-12 mb-1">Designation</p>
                                      <h6 className="fs-14 mb-0">{member.designation || 'Not Assigned'}</h6>
                                    </div>
                                  </div>
                                  <div className="col-6">
                                    <div>
                                      <p className="text-muted text-uppercase fs-12 mb-1">Assigned Date</p>
                                      <h6 className="fs-14 mb-0">
                                        {member.assigned_at 
                                          ? new Date(member.assigned_at).toLocaleDateString() 
                                          : 'N/A'}
                                      </h6>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                             
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <div className="avatar-md mx-auto mb-4">
                        <div className="avatar-title bg-light text-primary rounded-circle fs-24">
                          <i className="ri-team-line"></i>
                        </div>
                      </div>
                      <h5>No Team Members Found</h5>
                      <p className="text-muted">
                        You don't have any team members assigned yet. 
                        Contact your department manager for assignments.
                      </p>
                     
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Details Modal - Slide in from right */}
      {showMemberModal && selectedMember && (
        <>
          {/* Light Backdrop - Semi-transparent, doesn't make screen black */}
          <div 
            onClick={handleCloseModal}
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
                handleCloseModal();
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
                    onClick={handleCloseModal}
                    aria-label="Close"
                  ></button>
                </div>

                {/* Modal Body */}
                <div className="modal-body p-4">
                  {/* Large Profile Picture */}
                  <div className="text-center mb-4">
                    <div className="avatar-xxl mx-auto position-relative" style={{ width: '200px', height: '200px' }}>
                      {getProfileImageUrl(selectedMember) ? (
                        <>
                          <img
                            src={getProfileImageUrl(selectedMember)}
                            alt={selectedMember.name}
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
                            {selectedMember.name.charAt(0).toUpperCase()}
                          </div>
                        </>
                      ) : (
                        <div 
                          className="avatar-title bg-primary bg-opacity-10 text-primary rounded-circle fs-1 border border-3 border-primary"
                          style={{ width: '100%', height: '100%' }}
                        >
                          {selectedMember.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Employee Information */}
                  <div className="card border-0 shadow-sm">
                    <div className="card-body">
                      <div className="mb-4">
                        <h4 className="mb-1 text-center">{selectedMember.name}</h4>
                        <p className="text-muted text-center mb-0">{selectedMember.designation || 'Not Assigned'}</p>
                      </div>

                      <div className="border-top pt-3">
                        <div className="mb-3">
                          <div className="d-flex align-items-center mb-2">
                            <i className="ri-mail-line text-primary me-2 fs-5"></i>
                            <div>
                              <p className="text-muted mb-0 fs-12 text-uppercase">Email</p>
                              <p className="mb-0 fw-medium">{selectedMember.email}</p>
                            </div>
                          </div>
                        </div>

                        {selectedMember.employee_code && (
                          <div className="mb-3">
                            <div className="d-flex align-items-center mb-2">
                              <i className="ri-id-card-line text-primary me-2 fs-5"></i>
                              <div>
                                <p className="text-muted mb-0 fs-12 text-uppercase">Employee Code</p>
                                <p className="mb-0 fw-medium">{selectedMember.employee_code}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedMember.assigned_at && (
                          <div className="mb-3">
                            <div className="d-flex align-items-center mb-2">
                              <i className="ri-calendar-check-line text-primary me-2 fs-5"></i>
                              <div>
                                <p className="text-muted mb-0 fs-12 text-uppercase">Assigned Date</p>
                                <p className="mb-0 fw-medium">
                                  {new Date(selectedMember.assigned_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="mb-3">
                          <div className="d-flex align-items-center mb-2">
                            <i className="ri-building-line text-primary me-2 fs-5"></i>
                            <div>
                              <p className="text-muted mb-0 fs-12 text-uppercase">Department</p>
                              <p className="mb-0 fw-medium">{teamStats.departmentName || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                {/* <div className="modal-footer border-0 bg-light">
                  <button 
                    type="button" 
                    className="btn btn-primary px-4"
                    onClick={handleCloseModal}
                  >
                    <i className="ri-close-line me-2"></i>
                    Close
                  </button>
                </div> */}
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

export default MyTeam;