import React, { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../Context/ConfigContext';
import { toast } from 'react-toastify';

const SimpleTeamAssignment = () => {
  const { leadCrmApiURL, leadCrmUser } = useContext(ConfigContext);
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [selectedTL, setSelectedTL] = useState('');
  const [selectedExecs, setSelectedExecs] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Loading team data...');
      
      // First, test the debug endpoint
      const debugResponse = await fetch(`${leadCrmApiURL}/debug/team-data`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!debugResponse.ok) {
        throw new Error(`Debug endpoint failed: ${debugResponse.status}`);
      }

      const debugData = await debugResponse.json();
      console.log('Debug data:', debugData);

      // Now fetch the actual data
      const [tlRes, execRes, assignRes] = await Promise.all([
        fetch(`${leadCrmApiURL}/employees/role/TL`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }),
        fetch(`${leadCrmApiURL}/employees/role/EMPL`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }),
        fetch(`${leadCrmApiURL}/team-assignments`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        })
      ]);

      const tlData = tlRes.ok ? await tlRes.json() : { data: [] };
      const execData = execRes.ok ? await execRes.json() : { data: [] };
      const assignData = assignRes.ok ? await assignRes.json() : { data: [] };

      console.log('Loaded data:', { tlData, execData, assignData });

      setTeamLeaders(tlData.data || []);
      setEmployees(execData.data || []);
      setAssignments(assignData.data || []);

      if (tlData.data?.length === 0) {
        setError('No team leaders found. Please add team leaders first.');
      }

    } catch (err) {
      console.error('Error loading data:', err);
      setError(`Failed to load data: ${err.message}`);
      toast.error(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedTL || selectedExecs.length === 0) {
      toast.warning('Please select a team leader and at least one employee');
      return;
    }

    // Validate leadCrmUser is properly loaded
    if (!leadCrmUser || !leadCrmUser.id) {
      console.error('Lead CRM user not properly loaded:', leadCrmUser);
      toast.error('User authentication error. Please refresh and try again.');
      return;
    }

    setLoading(true);
    try {
      console.log('=== FRONTEND ASSIGNMENT DEBUG ===');
      console.log('leadCrmUser object:', leadCrmUser);
      console.log('leadCrmUser.id type:', typeof leadCrmUser.id);
      console.log('leadCrmUser.id value:', leadCrmUser.id);
      
      // Check if the user ID is a UUID (contains hyphens) or a number
      const userId = leadCrmUser.id;
      const isUUID = typeof userId === 'string' && userId.includes('-');
      
      if (isUUID) {
        // If it's a UUID, we need to get the current user from the server to get the correct database ID
        console.log('User ID is UUID, fetching current user data from server...');
        const userResponse = await fetch(`${leadCrmApiURL}/auth/me`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!userResponse.ok) {
          throw new Error('Failed to fetch current user data. Please login again.');
        }
        
        const userData = await userResponse.json();
        if (!userData.success || !userData.data || !userData.data.user) {
          throw new Error('Invalid user data received from server.');
        }
        
        // Use the correct database ID from the server response
        const correctUserId = userData.data.user.id;
        console.log('Got correct user ID from server:', correctUserId);
        
        // Update the context with the correct user data (optional, but helps prevent future issues)
        // This would require updating the ConfigContext, but for now we'll just use the correct ID
        
        const assignmentData = {
          teamLeaderId: parseInt(selectedTL),
          executiveIds: selectedExecs.map(id => parseInt(id)),
          assignedBy: parseInt(correctUserId)
        };
        
        console.log('Assignment request data (with corrected ID):', assignmentData);
        
      } else {
        // Ensure user ID is valid number
        const assignedById = parseInt(userId);
        if (isNaN(assignedById)) {
          throw new Error(`Invalid user ID: ${userId}`);
        }
        
        var assignmentData = {
          teamLeaderId: parseInt(selectedTL),
          executiveIds: selectedExecs.map(id => parseInt(id)),
          assignedBy: assignedById
        };
        
        console.log('Assignment request data:', assignmentData);
      }
      
      console.log('=== END FRONTEND ASSIGNMENT DEBUG ===');

      const response = await fetch(`${leadCrmApiURL}/team-assignments`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignmentData)
      });

      const responseData = await response.json();
      console.log('Assignment response:', responseData);

      if (response.ok) {
        toast.success('Team assigned successfully!');
        setSelectedTL('');
        setSelectedExecs([]);
        loadData(); // Reload data
      } else {
        console.error('Assignment failed:', responseData);
        
        // Show detailed error message
        let errorMessage = responseData.message || 'Assignment failed';
        if (responseData.debug) {
          console.error('Debug info:', responseData.debug);
          errorMessage += ` (Debug: ${JSON.stringify(responseData.debug)})`;
        }
        
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error('Assignment error:', err);
      toast.error(`Assignment failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getUnassignedExecs = () => {
    const assignedIds = assignments.map(a => a.executive_id);
    return employees.filter(exec => !assignedIds.includes(exec.id));
  };

  if (loading && teamLeaders.length === 0) {
    return (
      <div className="main-content">
        <div className="page-content">
          <div className="container-fluid">
            <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
              <div className="text-center">
                <div className="spinner-border text-primary mb-3" role="status"></div>
                <p>Loading team data...</p>
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
            <h4 className="mb-sm-0">Team Assignment Management</h4>
            <div className="page-title-right">
              <button className="btn btn-outline-primary btn-sm" onClick={loadData} disabled={loading}>
                <i className="ri-refresh-line me-1"></i>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="row">
          <div className="col-12">
            <div className="alert alert-warning">
              <h6><i className="ri-alert-line me-2"></i>Notice</h6>
              {error}
            </div>
          </div>
        </div>
      )}

      {/* Debug Info - Only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="row">
          <div className="col-12">
            <div className="alert alert-info">
              <h6><i className="ri-information-line me-2"></i>Debug Info</h6>
              <p><strong>Current User:</strong> {leadCrmUser ? JSON.stringify({
                id: leadCrmUser.id,
                name: leadCrmUser.name,
                email: leadCrmUser.email,
                role: leadCrmUser.role,
                idType: typeof leadCrmUser.id
              }) : 'Not loaded'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="row">
        <div className="col-md-3">
          <div className="card card-animate">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Team Leaders</p>
                  <h4 className="fs-22 fw-semibold mb-0">{teamLeaders.length}</h4>
                </div>
                <div className="avatar-sm bg-primary-subtle rounded">
                  <span className="avatar-title bg-primary-subtle text-primary rounded">
                    <i className="ri-user-star-line fs-16"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card card-animate">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Employees</p>
<h4 className="fs-22 fw-semibold mb-0">{employees.length}</h4>
                </div>
                <div className="avatar-sm bg-success-subtle rounded">
                  <span className="avatar-title bg-success-subtle text-success rounded">
                    <i className="ri-user-line fs-16"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card card-animate">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Unassigned</p>
                  <h4 className="fs-22 fw-semibold mb-0">{getUnassignedExecs().length}</h4>
                </div>
                <div className="avatar-sm bg-warning-subtle rounded">
                  <span className="avatar-title bg-warning-subtle text-warning rounded">
                    <i className="ri-user-unfollow-line fs-16"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card card-animate">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Teams</p>
                  <h4 className="fs-22 fw-semibold mb-0">{assignments.length}</h4>
                </div>
                <div className="avatar-sm bg-info-subtle rounded">
                  <span className="avatar-title bg-info-subtle text-info rounded">
                    <i className="ri-team-line fs-16"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Form */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="ri-user-add-line me-2"></i>
                Create Team Assignment
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Team Leader</label>
                  <select 
                    className="form-select"
                    value={selectedTL}
                    onChange={(e) => setSelectedTL(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Select Team Leader</option>
                    {teamLeaders.map(tl => (
                      <option key={tl.id} value={tl.id}>
                        {tl.name} ({tl.email})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Employees</label>
                  <div className="border rounded p-3 bg-light" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                    {getUnassignedExecs().length > 0 ? (
                      getUnassignedExecs().map(exec => (
                        <div key={exec.id} className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`exec-${exec.id}`}
                            checked={selectedExecs.includes(exec.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedExecs([...selectedExecs, exec.id]);
                              } else {
                                setSelectedExecs(selectedExecs.filter(id => id !== exec.id));
                              }
                            }}
                            disabled={loading}
                          />
                          <label className="form-check-label" htmlFor={`exec-${exec.id}`}>
                            {exec.name}
                          </label>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted mb-0 text-center py-2">
                        All employees are assigned
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="col-md-2">
                  <label className="form-label">&nbsp;</label>
                  <button
                    className="btn btn-primary w-100"
                    onClick={handleAssign}
                    disabled={loading || !selectedTL || selectedExecs.length === 0}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Assigning...
                      </>
                    ) : (
                      <>
                        <i className="ri-team-line me-2"></i>
                        Assign
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Assignments */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="ri-organization-chart me-2"></i>
                Current Team Structure
              </h5>
            </div>
            <div className="card-body">
              {teamLeaders.length > 0 ? (
                teamLeaders.map(tl => {
                  const tlAssignments = assignments.filter(a => a.team_leader_id === tl.id);
                  return (
                    <div key={tl.id} className="border rounded p-3 mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0">
                          <i className="ri-user-star-line text-primary me-2"></i>
                          {tl.name}
                        </h6>
                        <span className="badge bg-info">
                          {tlAssignments.length} member{tlAssignments.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      {tlAssignments.length > 0 ? (
                        <div className="row">
                          {tlAssignments.map(assignment => {
                            const exec = employees.find(e => e.id === assignment.executive_id);
                            return (
                              <div key={assignment.id} className="col-md-6 mb-2">
                                <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded">
                                  <span>
                                    <i className="ri-user-line me-2 text-success"></i>
                                    {exec?.name || 'Unknown'}
                                  </span>
                                  <button 
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={async () => {
                                      if (window.confirm('Remove this assignment?')) {
                                        try {
                                          const response = await fetch(`${leadCrmApiURL}/team-assignments/${assignment.id}`, {
                                            method: 'DELETE',
                                            credentials: 'include'
                                          });
                                          if (response.ok) {
                                            toast.success('Assignment removed');
                                            loadData();
                                          }
                                        } catch (err) {
                                          toast.error('Failed to remove assignment');
                                        }
                                      }
                                    }}
                                  >
                                    <i className="ri-close-line"></i>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-muted mb-0">No executives assigned</p>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4">
                  <i className="ri-team-line fs-24 text-muted mb-2 d-block"></i>
                  <p className="text-muted">No team leaders available</p>
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

export default SimpleTeamAssignment;