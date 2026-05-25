import React, { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../Context/ConfigContext';

const DepartmentStructure = () => {
  const { leadCrmApiURL } = useContext(ConfigContext);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedDepartments, setExpandedDepartments] = useState(new Set());
  const [expandedTeamLeaders, setExpandedTeamLeaders] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterTeamLeader, setFilterTeamLeader] = useState('');

  // Fetch departments with team leaders
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('lead_crm_token');
      
      const response = await fetch(`${leadCrmApiURL}/departments`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('Departments data:', data);
      
      if (response.ok && data.success) {
        setDepartments(data.data);
      } else {
        setError(data.message || 'Failed to fetch departments');
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch team members for a specific team leader
  const fetchTeamMembers = async (teamLeaderId) => {
    try {
      console.log('Fetching team members for team leader ID:', teamLeaderId);
      const token = localStorage.getItem('lead_crm_token');
      
      // Try the team leader approach first (using team_assignments table)
      const response1 = await fetch(`${leadCrmApiURL}/teams/team/leader/${teamLeaderId}/members`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Team members response status (team leader approach):', response1.status);
      const data1 = await response1.json();
      console.log('Team members response data (team leader approach):', data1);
      
      if (response1.ok && data1.success) {
        // Check if we got members from the team_assignments table
        if (data1.data.members && data1.data.members.length > 0) {
          console.log('Team members fetched successfully (team leader approach):', data1.data.members);
          return data1.data.members;
        }
        
        // If no members from team_assignments, try to get department team members
        // This would require knowing which department team this team leader manages
        // For now, we'll return the result (which may be empty)
        return data1.data.members || [];
      } else {
        console.error('Failed to fetch team members (team leader approach):', data1.message);
        return [];
      }
    } catch (err) {
      console.error('Error fetching team members:', err);
      return [];
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const toggleDepartment = (departmentId) => {
    const newExpanded = new Set(expandedDepartments);
    if (newExpanded.has(departmentId)) {
      newExpanded.delete(departmentId);
    } else {
      newExpanded.add(departmentId);
    }
    setExpandedDepartments(newExpanded);
  };

  const toggleTeamLeader = (teamLeaderId) => {
    console.log('Toggling team leader with ID:', teamLeaderId);
    const newExpanded = new Set(expandedTeamLeaders);
    if (newExpanded.has(teamLeaderId)) {
      newExpanded.delete(teamLeaderId);
    } else {
      newExpanded.add(teamLeaderId);
    }
    setExpandedTeamLeaders(newExpanded);
  };

  // Filter departments based on search term and filters
  const filteredDepartments = departments.filter(department => {
    // Apply search term filter
    if (searchTerm) {
      const matchesDepartment = department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               (department.description && department.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesTeamLeader = department.team_leaders && department.team_leaders.some(tl => 
        tl.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tl.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (!matchesDepartment && !matchesTeamLeader) {
        return false;
      }
    }
    
    // Apply department filter
    if (filterDepartment && department.id.toString() !== filterDepartment) {
      return false;
    }
    
    // Apply team leader filter
    if (filterTeamLeader && department.team_leaders) {
      const hasMatchingTeamLeader = department.team_leaders.some(tl => 
        tl.id.toString() === filterTeamLeader
      );
      if (!hasMatchingTeamLeader) {
        return false;
      }
    }
    
    return true;
  });

  // Get unique team leaders for filter dropdown
  const getAllTeamLeaders = () => {
    const teamLeaders = new Map();
    departments.forEach(department => {
      if (department.team_leaders) {
        department.team_leaders.forEach(tl => {
          teamLeaders.set(tl.id, tl);
        });
      }
    });
    return Array.from(teamLeaders.values());
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterDepartment('');
    setFilterTeamLeader('');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <span className="ms-2">Loading department structure...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <i className="ri-error-warning-line me-2"></i>
        Error: {error}
        <button className="btn btn-sm btn-outline-light ms-3" onClick={fetchDepartments}>
          <i className="ri-refresh-line me-1"></i>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header align-items-center d-flex">
        <h4 className="card-title mb-0 flex-grow-1">Organization Structure</h4>
        <div className="flex-shrink-0 d-flex">
          <div className="search-box me-2">
            <input
              type="text"
              className="form-control"
              placeholder="Search departments, team leaders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="ri-search-line search-icon"></i>
          </div>
          <button 
            className="btn btn-soft-primary btn-sm" 
            onClick={fetchDepartments}
            disabled={loading}
          >
            <i className="ri-refresh-line"></i>
          </button>
        </div>
      </div>
      
      <div className="card-body">
        {/* Filter Controls */}
        <div className="row mb-3">
          <div className="col-md-4">
            <select
              className="form-select"
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <select
              className="form-select"
              value={filterTeamLeader}
              onChange={(e) => setFilterTeamLeader(e.target.value)}
            >
              <option value="">All Team Leaders</option>
              {getAllTeamLeaders().map(tl => (
                <option key={tl.id} value={tl.id}>{tl.name}</option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <button className="btn btn-outline-secondary w-100" onClick={resetFilters}>
              <i className="ri-refresh-line me-1"></i> Reset Filters
            </button>
          </div>
        </div>
        
        {filteredDepartments.length === 0 ? (
          <div className="text-center py-5">
            <i className="ri-building-line" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
            <h5 className="mt-3">No departments found</h5>
            <p className="text-muted">
              {searchTerm || filterDepartment || filterTeamLeader ? 'No departments match your search criteria' : 'No departments have been created yet'}
            </p>
            {(searchTerm || filterDepartment || filterTeamLeader) && (
              <button className="btn btn-outline-primary" onClick={resetFilters}>
                <i className="ri-close-line me-1"></i> Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="department-structure">
            {filteredDepartments.map((department) => (
              <div key={department.id} className="department-card mb-3 border rounded">
                <div 
                  className="department-header p-3 bg-light cursor-pointer d-flex justify-content-between align-items-center"
                  onClick={() => toggleDepartment(department.id)}
                >
                  <div className="d-flex align-items-center">
                    <i className={`ri-building-line fs-18 me-2 ${expandedDepartments.has(department.id) ? 'text-primary' : 'text-muted'}`}></i>
                    <div>
                      <h5 className="mb-1">{department.name}</h5>
                      <p className="mb-0 text-muted small">
                        {department.description || 'No description'}
                      </p>
                    </div>
                  </div>
                  <div className="d-flex align-items-center">
                    <span className="badge bg-primary me-2">
                      {department.team_leaders ? department.team_leaders.length : 0} Team Leaders
                    </span>
                    <i className={`ri-arrow-${expandedDepartments.has(department.id) ? 'up' : 'down'}-s-line fs-20`}></i>
                  </div>
                </div>
                
                {expandedDepartments.has(department.id) && (
                  <div className="department-content p-3 border-top">
                    {(!department.team_leaders || department.team_leaders.length === 0) ? (
                      <div className="text-center py-3">
                        <i className="ri-user-star-line" style={{ fontSize: '2rem', opacity: 0.3 }}></i>
                        <p className="mt-2 mb-0 text-muted">No team leaders assigned to this department</p>
                      </div>
                    ) : (
                      <div className="team-leaders-list">
                        {department.team_leaders.map((teamLeader) => (
                          <div key={teamLeader.id} className="team-leader-card mb-2 border rounded">
                            <div 
                              className="team-leader-header p-3 d-flex justify-content-between align-items-center cursor-pointer"
                              onClick={() => toggleTeamLeader(teamLeader.id)}
                            >
                              <div className="d-flex align-items-center">
                                <div className="avatar-xs me-3">
                                  <div className="avatar-title rounded-circle bg-soft-primary text-primary">
                                    {teamLeader.name.charAt(0).toUpperCase()}
                                  </div>
                                </div>
                                <div>
                                  <h6 className="mb-0">{teamLeader.name}</h6>
                                  <p className="mb-0 text-muted small">{teamLeader.email}</p>
                                </div>
                              </div>
                              <div className="d-flex align-items-center">
                                <span className="badge bg-info me-2">Team Leader</span>
                                <i className={`ri-arrow-${expandedTeamLeaders.has(teamLeader.id) ? 'up' : 'down'}-s-line fs-20`}></i>
                              </div>
                            </div>
                            
                            {expandedTeamLeaders.has(teamLeader.id) && (
                              <div className="team-members-content p-3 border-top bg-light">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                  <h6 className="mb-0">Team Members</h6>
                                  <button 
                                    className="btn btn-sm btn-soft-primary"
                                    onClick={() => {
                                      console.log('Refreshing team members for team leader ID:', teamLeader.id);
                                      fetchTeamMembers(teamLeader.id);
                                    }}
                                  >
                                    <i className="ri-refresh-line me-1"></i> Refresh
                                  </button>
                                </div>
                                
                                <TeamMembersList 
                                  teamLeaderId={teamLeader.id}
                                  fetchTeamMembers={fetchTeamMembers}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Separate component for team members list
const TeamMembersList = ({ teamLeaderId, fetchTeamMembers }) => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTeamMembers = async () => {
      setLoading(true);
      setError(null);
      try {
        const members = await fetchTeamMembers(teamLeaderId);
        setTeamMembers(members);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadTeamMembers();
  }, [teamLeaderId, fetchTeamMembers]);

  if (loading) {
    return (
      <div className="text-center py-3">
        <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
        <span className="ms-2">Loading team members...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-warning" role="alert">
        <i className="ri-error-warning-line me-2"></i>
        Error loading team members: {error}
      </div>
    );
  }

  if (teamMembers.length === 0) {
    return (
      <div className="text-center py-3">
        <i className="ri-user-line" style={{ fontSize: '2rem', opacity: 0.3 }}></i>
        <p className="mt-2 mb-0 text-muted">
          No team members found for this team leader.
        </p>
        <p className="mb-0 text-muted small">
          This could be because:
        </p>
        <ul className="text-muted small text-start" style={{ maxWidth: '400px', margin: '0 auto' }}>
          <li>No employees have been assigned to this team leader yet</li>
          <li>Team assignments need to be configured by an administrator</li>
          <li>Employees may be assigned directly to department teams instead</li>
        </ul>
        <div className="mt-3">
          <button 
            className="btn btn-sm btn-outline-primary me-2"
            onClick={() => fetchTeamMembers(teamLeaderId)}
          >
            <i className="ri-refresh-line me-1"></i> Retry
          </button>
          <button 
            className="btn btn-sm btn-outline-info"
            onClick={() => {
              // Provide guidance on how to assign team members
              alert('To assign team members to this team leader, go to the Department Management section and use the team assignment features.');
            }}
          >
            <i className="ri-information-line me-1"></i> How to Assign
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-centered table-nowrap mb-0">
        <thead className="table-light">
          <tr>
            <th>Employee</th>
            <th>Email</th>
            <th>Employee Code</th>
            <th>Designation</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {teamMembers.map((member) => (
            <tr key={member.id}>
              <td>
                <div className="d-flex align-items-center">
                  <div className="avatar-xs me-2">
                    <div className="avatar-title rounded-circle bg-soft-success text-success">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <span>{member.name}</span>
                </div>
              </td>
              <td>{member.email}</td>
              <td>{member.employeeCode || 'N/A'}</td>
              <td>{member.designation || 'N/A'}</td>
              <td>
                <span className={`badge ${
                  member.role === 'ADMIN' ? 'bg-danger' :
                  member.role === 'TL' ? 'bg-warning' : 'bg-info'
                }`}>
                  {member.role}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DepartmentStructure;