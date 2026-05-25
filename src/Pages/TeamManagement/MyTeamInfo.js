import React, { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../Context/ConfigContext';
import { toast } from 'react-toastify';

const MyTeamInfo = () => {
  const { leadCrmApiURL, leadCrmUser } = useContext(ConfigContext);
  const [teamInfo, setTeamInfo] = useState(null);
  const [teamLeader, setTeamLeader] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [myStats, setMyStats] = useState({
    leadsAssigned: 0,
    leadsConverted: 0,
    conversionRate: 0,
    targetProgress: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (leadCrmUser?.role === 'EXEC') {
      fetchMyTeamInfo();
    }
  }, [leadCrmUser]);

  const fetchMyTeamInfo = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${leadCrmApiURL}/team-assignments/my-team-info/${leadCrmUser.id}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setTeamInfo(data.data.teamInfo);
        setTeamLeader(data.data.teamLeader);
        setTeamMembers(data.data.teamMembers || []);
        setMyStats(data.data.myStats || myStats);
      } else {
        console.error('Failed to fetch team info');
      }
    } catch (error) {
      console.error('Error fetching team info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (leadCrmUser?.role !== 'EXEC') {
    return (
      <div className="alert alert-warning">
        <h4>Access Denied</h4>
        <p>This page is only accessible to Employees.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!teamInfo) {
    return (
      <div className="main-content">
      <div className="page-content">
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body text-center py-5">
                <div className="avatar-md mx-auto mb-4">
                  <div className="avatar-title bg-warning-subtle text-warning rounded-circle fs-36">
                    <i className="bx bx-info-circle"></i>
                  </div>
                </div>
                <h5 className="mb-3">Not Assigned to Any Team</h5>
                <p className="text-muted">
                  You haven't been assigned to any team yet. 
                  Please contact your administrator for team assignment.
                </p>
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
      <div className="row">
        <div className="col-12">
          <div className="page-title-box d-sm-flex align-items-center justify-content-between">
            <h4 className="mb-sm-0">My Team Information</h4>
            <div className="page-title-right">
              <ol className="breadcrumb m-0">
                <li className="breadcrumb-item">Dashboard</li>
                <li className="breadcrumb-item active">Team Info</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Team Leader Info */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Team Leader</h5>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar-lg flex-shrink-0 me-4">
                  <div className="avatar-title bg-primary-subtle text-primary rounded-circle fs-22">
                    {teamLeader?.name?.charAt(0)?.toUpperCase() || 'TL'}
                  </div>
                </div>
                <div className="flex-grow-1">
                  <h5 className="mb-1">{teamLeader?.name || 'Team Leader'}</h5>
                  <p className="text-muted mb-2">{teamLeader?.email}</p>
                  <span className="badge bg-primary">Team Leader</span>
                </div>
                <div className="flex-shrink-0">
                  <button className="btn btn-outline-primary btn-sm">
                    <i className="ri-message-2-line me-1"></i>
                    Contact
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* My Performance Stats */}
      <div className="row">
        <div className="col-xl-3 col-md-6">
          <div className="card card-animate">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1 overflow-hidden">
                  <p className="text-uppercase fw-medium text-muted text-truncate mb-0">
                    Leads Assigned
                  </p>
                </div>
              </div>
              <div className="d-flex align-items-end justify-content-between mt-4">
                <div>
                  <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                    <span className="counter-value">{myStats.leadsAssigned}</span>
                  </h4>
                </div>
                <div className="avatar-sm flex-shrink-0">
                  <span className="avatar-title bg-info-subtle rounded fs-3">
                    <i className="bx bx-clipboard text-info"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="card card-animate">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1 overflow-hidden">
                  <p className="text-uppercase fw-medium text-muted text-truncate mb-0">
                    Leads Converted
                  </p>
                </div>
              </div>
              <div className="d-flex align-items-end justify-content-between mt-4">
                <div>
                  <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                    <span className="counter-value">{myStats.leadsConverted}</span>
                  </h4>
                </div>
                <div className="avatar-sm flex-shrink-0">
                  <span className="avatar-title bg-success-subtle rounded fs-3">
                    <i className="bx bx-check-circle text-success"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="card card-animate">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1 overflow-hidden">
                  <p className="text-uppercase fw-medium text-muted text-truncate mb-0">
                    Conversion Rate
                  </p>
                </div>
              </div>
              <div className="d-flex align-items-end justify-content-between mt-4">
                <div>
                  <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                    <span className="counter-value">{myStats.conversionRate}</span>%
                  </h4>
                </div>
                <div className="avatar-sm flex-shrink-0">
                  <span className="avatar-title bg-warning-subtle rounded fs-3">
                    <i className="bx bx-trending-up text-warning"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="card card-animate">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1 overflow-hidden">
                  <p className="text-uppercase fw-medium text-muted text-truncate mb-0">
                    Target Progress
                  </p>
                </div>
              </div>
              <div className="d-flex align-items-end justify-content-between mt-4">
                <div>
                  <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                    <span className="counter-value">{myStats.targetProgress}</span>%
                  </h4>
                </div>
                <div className="avatar-sm flex-shrink-0">
                  <span className="avatar-title bg-primary-subtle rounded fs-3">
                    <i className="bx bx-target-lock text-primary"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">My Team Members</h5>
            </div>
            <div className="card-body">
              <div className="row">
                {teamMembers.filter(member => member.id !== leadCrmUser.id).map(member => (
                  <div key={member.id} className="col-lg-6 col-xl-4 mb-3">
                    <div className="d-flex align-items-center p-3 border rounded">
                      <div className="avatar-sm flex-shrink-0 me-3">
                        <div className="avatar-title bg-soft-success text-success rounded-circle fs-16">
                          {member.name?.charAt(0)?.toUpperCase() || 'E'}
                        </div>
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="mb-1">{member.name}</h6>
                        <p className="text-muted mb-0 fs-13">{member.email}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="badge bg-success-subtle text-success">Executive</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {teamMembers.filter(member => member.id !== leadCrmUser.id).length === 0 && (
                <div className="text-center py-3">
                  <p className="text-muted mb-0">You are the only member in this team.</p>
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

export default MyTeamInfo;