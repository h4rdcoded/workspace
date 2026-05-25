import React, { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../Context/ConfigContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { buildApiUrl, getAuthHeaders } from '../../config/api';

const MyTeam = () => {
  const { leadCrmUser, isLeadCrmAuthenticated, leadCrmHeaders } = useContext(ConfigContext);
  
  const [teamInfo, setTeamInfo] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamLeader, setTeamLeader] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch employee's team information
  const fetchEmployeeTeamInfo = async () => {
    try {
        
        
        if (!leadCrmUser || !leadCrmUser.id) {
            
            setError('User not authenticated');
            setLoading(false);
            return;
        }

        // Use the correct authentication method based on user type
        const config = isLeadCrmAuthenticated ? { 
            headers: leadCrmHeaders, 
            withCredentials: true 
        } : { headers: getAuthHeaders() };

        setLoading(true);
        setError(null);
        
        // First, get user's specific department
        const deptResponse = await axios.get(
            buildApiUrl('/departments/employee/my-department'),
            config
        );

        

        if (deptResponse.data.success) {
            // Get the employee's department
            const department = deptResponse.data.data;
            
            // Get employee's specific team information
            const teamResponse = await axios.get(
                buildApiUrl(`/departments/${department.id}/employee/my-team`),
                config
            );

          

            if (teamResponse.data.success) {
                const teamData = teamResponse.data.data;
                
                // Set team leader information
                if (teamData.team_leader) {
                    setTeamLeader(teamData.team_leader);
                }
                
                // Set team members
                if (teamData.team_members) {
                    setTeamMembers(teamData.team_members);
                }
                
                // Set department info
                if (teamData.department) {
                    setTeamInfo({
                        id: teamData.department.id,
                        name: teamData.department.name,
                        description: teamData.department.description
                    });
                }
            }
        } else {
            setError('No department found for user');
        }
    } catch (error) {
        
        setError('Failed to load team information');
        if (error.response) {
            
            toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to load team information'}`);
        } else {
            toast.error('Network error: Failed to load team information');
        }
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeTeamInfo();
  }, []);

  // Function to get profile image with fallback
  const getProfileImageSrc = (user) => {
    // Check if user has a profile image URL
    if (user && user.profile_image) {
      return user.profile_image;
    }
    
    // Use a default placeholder image if no profile image is available
    return "/assets/images/users/avatar-1.jpg";
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
                <p className="mt-2 text-muted">Loading team information...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-content">
        <div className="page-content">
          <div className="container-fluid">
            <div className="row">
              <div className="col-12">
                <div className="card">
                  <div className="card-body text-center">
                    <i className="ri-error-warning-line ri-2x text-danger"></i>
                    <h5 className="mt-3">Error Loading Team Information</h5>
                    <p className="text-muted">{error}</p>
                    <button className="btn btn-primary" onClick={fetchEmployeeTeamInfo}>
                      <i className="ri-refresh-line me-1"></i>Retry
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
          {/* Page title */}
          <div className="row">
            <div className="col-12">
              <div className="page-title-box d-flex align-items-center justify-content-between">
                <h4 className="mb-0">My Team</h4>
                <div className="page-title-right">
                  <ol className="breadcrumb m-0">
                    <li className="breadcrumb-item">Dashboard</li>
                    <li className="breadcrumb-item active">My Team</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* Team Info Card */}
          {(teamInfo || teamLeader) && (
            <div className="row">
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">Team Information</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      {teamInfo && (
                        <div className="col-md-6">
                          <p><strong>Department:</strong> {teamInfo.name}</p>
                          <p><strong>Description:</strong> {teamInfo.description || 'No description'}</p>
                        </div>
                      )}
                      <div className="col-md-6">
                        <p><strong>Team Members:</strong> {teamMembers.length}</p>
                        {teamInfo && teamInfo.manager_name && (
                          <p><strong>Department Manager:</strong> {teamInfo.manager_name}</p>
                        )}
                        {teamLeader && (
                          <p><strong>My Team Leader:</strong> {teamLeader.team_leader_name}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Team Members Grid View */}
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">My Team Members</h5>
                </div>
                <div className="card-body">
                  {teamMembers.length > 0 ? (
                    <div className="row">
                      {teamMembers.map(member => (
                        <div className="col-xl-3 col-md-4 col-sm-6" key={member.user_id}>
                          <div className="card border shadow-sm mb-3">
                            <div className="card-body text-center">
                              <div className="mx-auto mb-3">
                                <div className="avatar-lg mx-auto">
                                  <img 
                                    src={getProfileImageSrc(member.user)}
                                    alt=""
                                    className="img-fluid rounded-circle"
                                    style={{ width: '100px', height: '100px' }}
                                    
                                  />
                                </div>
                              </div>
                              <h5 className="font-size-15 mb-1">{member.name}</h5>
                              <p className="text-muted mb-2">{member.email}</p>
                              <div className="mt-2">
                                <span className="badge bg-primary">
                                  Team Member
                                </span>
                              </div>
                              {member.designation && (
                                <p className="text-muted mt-2 mb-0">
                                  <i className="ri-briefcase-line align-middle me-1"></i>
                                  {member.designation}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <i className="ri-group-line display-4 text-muted"></i>
                      <h5 className="mt-3">No team members found</h5>
                      <p className="text-muted">There are no members in your team yet.</p>
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

export default MyTeam;