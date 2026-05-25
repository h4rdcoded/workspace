import React, { useState, useEffect, useContext, useCallback } from 'react';
import { ConfigContext } from '../../../Context/ConfigContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { buildApiUrl, getAuthHeaders } from '../../../config/api';
import { useNavigate } from 'react-router-dom';

const AssignEmployeesToTeamLeaders = () => {
    const { leadCrmUser } = useContext(ConfigContext);
    const navigate = useNavigate();
    const [departments, setDepartments] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isDepartmentManager, setIsDepartmentManager] = useState(false);
    const [allDepartmentEmployees, setAllDepartmentEmployees] = useState([]);
    const [allDepartmentTeamLeaders, setAllDepartmentTeamLeaders] = useState([]);
    const [teamLeaderTeams, setTeamLeaderTeams] = useState({});
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedTeamLeader, setSelectedTeamLeader] = useState(null);
    const [unassignedEmployees, setUnassignedEmployees] = useState([]);

    // Fetch departments where user is a team leader
    const fetchTeamLeaderDepartments = async () => {
        try {
            const response = await axios.get(
                buildApiUrl('/departments'),
                { headers: getAuthHeaders() }
            );

            if (response.data.success) {
                // Filter departments where user is a team leader
                const userDepartments = response.data.data.filter(dept => {
                    return dept.team_leaders && dept.team_leaders.some(tl => tl.id === leadCrmUser.id);
                });
                setDepartments(userDepartments);
                
                // If there's only one department, select it by default
                if (userDepartments.length === 1) {
                    handleDepartmentSelect(userDepartments[0]);
                }
            }
        } catch (error) {
            console.error('Error fetching departments:', error);
            toast.error('Failed to load departments');
        } finally {
            setLoading(false);
        }
    };

    // Fetch all employees in department (Department Manager only)
    const fetchAllDepartmentEmployees = async (departmentId) => {
        try {
            const response = await axios.get(
                buildApiUrl(`/departments/${departmentId}/employees`),
                { headers: getAuthHeaders() }
            );

            if (response.data.success) {
                setAllDepartmentEmployees(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching department employees:', error);
            toast.error('Failed to load department employees');
        }
    };

    // Fetch all team leaders in department (Department Manager only)
    const fetchAllDepartmentTeamLeaders = async (departmentId) => {
        try {
            const response = await axios.get(
                buildApiUrl(`/departments/${departmentId}/team-leaders`),
                { headers: getAuthHeaders() }
            );

            if (response.data.success) {
                setAllDepartmentTeamLeaders(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching department team leaders:', error);
            toast.error('Failed to load department team leaders');
        }
    };

    // Fetch team leader's team (Department Manager only)
    const fetchTeamLeaderTeam = async (departmentId, teamLeaderId) => {
        try {
            const response = await axios.get(
                buildApiUrl(`/departments/${departmentId}/manager/teams/${teamLeaderId}`),
                { headers: getAuthHeaders() }
            );

            if (response.data.success) {
                setTeamLeaderTeams(prev => ({
                    ...prev,
                    [teamLeaderId]: response.data.data
                }));
            }
        } catch (error) {
            console.error('Error fetching team leader team:', error);
            toast.error('Failed to load team leader team');
        }
    };

    // Fetch all team assignments for the department
    const fetchAllTeamAssignments = useCallback(async (departmentId) => {
        if (!departmentId || !allDepartmentTeamLeaders.length) return;

        // Fetch team for each team leader
        const teamPromises = allDepartmentTeamLeaders.map(teamLeader => 
            fetchTeamLeaderTeam(departmentId, teamLeader.id)
        );
        
        await Promise.all(teamPromises);
    }, [allDepartmentTeamLeaders]);

    // Handle department selection
    const handleDepartmentSelect = (department) => {
        setSelectedDepartment(department);
        
        // Check if user is department manager for this department
        const isManager = department.manager_id === leadCrmUser.id;
        setIsDepartmentManager(isManager);
        
        if (!isManager) {
            toast.error('You do not have permission to access this page');
            navigate('/dashboard');
        } else {
            // Fetch data for department manager
            fetchAllDepartmentEmployees(department.id);
            fetchAllDepartmentTeamLeaders(department.id);
        }
    };

    // Assign employee to team leader (Department Manager only)
    const handleAssignEmployee = async (employeeId, teamLeaderId) => {
        // Validate that the employee is not a team leader
        const isTeamLeader = allDepartmentTeamLeaders.some(tl => tl.id === employeeId);
        if (isTeamLeader) {
            toast.error('Team leaders cannot be assigned to other team leaders');
            return;
        }
        
        try {
            const response = await axios.post(
                buildApiUrl(`/departments/${selectedDepartment.id}/manager/assignments`),
                {
                    employeeId: employeeId,
                    teamLeaderId: teamLeaderId
                },
                { headers: getAuthHeaders() }
            );

            if (response.data.success) {
                toast.success('Employee assigned to team leader successfully');
                setShowAssignModal(false);
                setSelectedTeamLeader(null);
                // Refresh team assignments
                fetchAllTeamAssignments(selectedDepartment.id);
            }
        } catch (error) {
            console.error('Error assigning employee:', error);
            toast.error(error.response?.data?.message || 'Failed to assign employee');
        }
    };

    // Remove employee from team leader (Department Manager only)
    const handleRemoveEmployeeFromTeamLeader = async (employeeId, teamLeaderId, employeeName) => {
        if (!window.confirm(`Are you sure you want to remove ${employeeName} from this team?`)) {
            return;
        }

        try {
            const response = await axios.delete(
                buildApiUrl(`/departments/${selectedDepartment.id}/manager/assignments`),
                { 
                    headers: getAuthHeaders(),
                    data: {
                        employeeId,
                        teamLeaderId
                    }
                }
            );

            if (response.data.success) {
                toast.success('Employee removed from team leader successfully');
                fetchAllTeamAssignments(selectedDepartment.id);
            }
        } catch (error) {
            console.error('Error removing employee from team leader:', error);
            toast.error(error.response?.data?.message || 'Failed to remove employee from team leader');
        }
    };

    // Open assign modal for a specific team leader
    const openAssignModal = (teamLeader) => {
        setSelectedTeamLeader(teamLeader);
        setShowAssignModal(true);
    };

    // Filter unassigned employees (exclude team leaders)
    const getUnassignedEmployees = () => {
        if (!allDepartmentEmployees.length || !teamLeaderTeams) return [];
        
        // Get all assigned employee IDs
        const assignedEmployeeIds = new Set();
        Object.values(teamLeaderTeams).forEach(team => {
            team.forEach(member => assignedEmployeeIds.add(member.user_id));
        });
        
        // Filter unassigned employees and exclude team leaders
        const unassigned = allDepartmentEmployees.filter(
            employee => !assignedEmployeeIds.has(employee.user_id) && 
                       !allDepartmentTeamLeaders.some(tl => tl.id === employee.user_id)
        );
        
        return unassigned;
    };

    // Get unassigned employees
    useEffect(() => {
        const unassigned = getUnassignedEmployees();
        setUnassignedEmployees(unassigned);
    }, [allDepartmentEmployees, teamLeaderTeams, allDepartmentTeamLeaders]);

    // Fetch team assignments when team leaders change
    useEffect(() => {
        if (selectedDepartment && allDepartmentTeamLeaders.length > 0) {
            fetchAllTeamAssignments(selectedDepartment.id);
        }
    }, [selectedDepartment, allDepartmentTeamLeaders, fetchAllTeamAssignments]);

    useEffect(() => {
        fetchTeamLeaderDepartments();
    }, []);

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
                                <p className="mt-2 text-muted">Loading...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!isDepartmentManager) {
        return (
            <div className="main-content">
                <div className="page-content">
                    <div className="container-fluid">
                        <div className="row">
                            <div className="col-12">
                                <div className="card">
                                    <div className="card-body text-center py-5">
                                        <i className="ri-error-warning-line display-4 text-warning"></i>
                                        <h5 className="mt-3">Access Denied</h5>
                                        <p className="text-muted">You do not have permission to access this page.</p>
                                        <button 
                                            className="btn btn-primary rounded-pill"
                                            onClick={() => navigate('/dashboard')}
                                        >
                                            Return to Dashboard
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
                    {/* Header */}
                    <div className="row mb-4">
                        <div className="col-12">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h4 className="mb-0">Assign Employees to Team Leaders</h4>
                                    <p className="text-muted mb-0">Manage employee assignments to team leaders in your department</p>
                                </div>
                              
                            </div>
                        </div>
                    </div>

                    {/* Department Selection */}
                    {departments.length > 1 && (
                        <div className="row mb-4">
                            <div className="col-12">
                                <div className="card">
                                    <div className="card-body">
                                        <h5 className="card-title mb-3">Select Department</h5>
                                        <div className="d-flex flex-wrap gap-2">
                                            {departments.map(dept => (
                                                <button
                                                    key={dept.id}
                                                    className={`btn ${selectedDepartment?.id === dept.id ? 'btn-primary' : 'btn-outline-primary'} rounded-pill px-4`}
                                                    onClick={() => handleDepartmentSelect(dept)}
                                                >
                                                    {dept.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedDepartment && (
                        <>
                            {/* Team Leaders and Their Teams */}
                            <div className="row mb-4">
                                <div className="col-12">
                                    <div className="card">
                                        <div className="card-header">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <h5 className="mb-0">Team Leaders</h5>
                                                <span className="badge bg-primary rounded-pill">
                                                    {allDepartmentTeamLeaders.length} team leaders
                                                </span>
                                            </div>
                                            <p className="text-muted mb-0 small">Click "Add Employee" to assign employees to team leaders</p>
                                        </div>
                                        <div className="card-body">
                                            {allDepartmentTeamLeaders.length > 0 ? (
                                                <div className="row g-4">
                                                    {allDepartmentTeamLeaders.map(teamLeader => (
                                                        <div key={teamLeader.id} className="col-md-6 col-lg-4">
                                                            <div className="card h-100 team-leader-card">
                                                                <div className="card-header  text-white ">
                                                                    <div className="d-flex justify-content-between align-items-center">
                                                                        <h6 className="mb-0">{teamLeader.name}</h6>
                                                                        {teamLeader.is_department_manager && (
                                                                            <span className="badge bg-light text-primary">Manager</span>
                                                                        )}
                                                                    </div>
                                                                    
                                                                </div>
                                                                <div className="card-body">
                                                                 
                                                                    
                                                                    <div className="mt-2">
                                                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                                                            
                                                                            <button 
                                                                                className="btn btn-sm btn-outline-primary rounded-pill"
                                                                                onClick={() => openAssignModal(teamLeader)}
                                                                            >
                                                                                <i className="ri-user-add-line me-1"></i>
                                                                                Add Employee
                                                                            </button>
                                                                        </div>
                                                                        {(teamLeaderTeams[teamLeader.id] || []).length > 0 ? (
                                                                            <div className="d-flex flex-column gap-2">
                                                                                {(teamLeaderTeams[teamLeader.id] || []).map(member => (
                                                                                    <div 
                                                                                        key={member.user_id} 
                                                                                        className="d-flex justify-content-between align-items-center border rounded p-3"
                                                                                    >
                                                                                        <div>
                                                                                            <div className="fw-medium">{member.name}</div>
                                                                                          
                                                                                            {member.designation && (
                                                                                                <div className="small text-primary">{member.designation}</div>
                                                                                            )}
                                                                                        </div>
                                                                                        <button 
                                                                                            className="btn btn-sm btn-outline-danger"
                                                                                            onClick={() => handleRemoveEmployeeFromTeamLeader(member.user_id, teamLeader.id, member.name)}
                                                                                            title="Remove from team"
                                                                                        >
                                                                                            <i className="ri-close-line"></i>
                                                                                        </button>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        ) : (
                                                                            <div className="text-center py-4 border rounded border-dashed">
                                                                                <i className="ri-user-add-line display-6 text-muted"></i>
                                                                                <p className="text-muted small mb-0 mt-2">No team members yet</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="card-footer">
                                                                    <div className="d-flex justify-content-between">
                                                                        <span className="text-muted small">Total Members:</span>
                                                                        <span className="fw-bold">
                                                                            {(teamLeaderTeams[teamLeader.id] || []).length}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-5">
                                                    <div className="rounded-circle bg-warning bg-opacity-10 p-3 d-inline-block mb-3">
                                                        <i className="ri-team-line display-4 text-warning"></i>
                                                    </div>
                                                    <h5 className="mt-3">No team leaders found</h5>
                                                    <p className="text-muted">There are no team leaders assigned to this department yet.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Unassigned Employees Table */}
                            <div className="row">
                                <div className="col-12">
                                    <div className="card">
                                        <div className="card-header">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <h5 className="mb-0">Unassigned Employees</h5>
                                                <span className="badge bg-secondary rounded-pill">
                                                    {unassignedEmployees.length} employees
                                                </span>
                                            </div>
                                            <p className="text-muted mb-0 small">Employees not yet assigned to any team leader</p>
                                        </div>
                                        <div className="card-body">
                                            {unassignedEmployees.length > 0 ? (
                                                <div className="table-responsive">
                                                    <table className="table table-centered table-nowrap mb-0">
                                                        <thead className="table-light">
                                                            <tr>
                                                                <th>Employee</th>
                                                                <th>Contact</th>
                                                                <th>Details</th>
                                                                <th>Status</th>
                                                                <th>Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {unassignedEmployees.map((employee) => (
                                                                <tr key={employee.user_id}>
                                                                    <td>
                                                                        <div className="d-flex align-items-center">
                                                                            <div className="flex-grow-1 ms-2">
                                                                                <h6 className="mb-0">{employee.name}</h6>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td>
                                                                        <div>
                                                                            <div className="text-muted">
                                                                                <i className="ri-mail-line align-middle me-1"></i>
                                                                                {employee.email}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td>
                                                                        {employee.designation ? (
                                                                            <span className="badge bg-light text-dark">
                                                                                {employee.designation}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-muted">-</span>
                                                                        )}
                                                                    </td>
                                                                    <td>
                                                                        <span className={`badge ${employee.is_active ? 'bg-success' : 'bg-danger'}`}>
                                                                            {employee.is_active ? 'Active' : 'Inactive'}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        <div className="dropdown">
                                                                            <button 
                                                                                className="btn btn-sm btn-outline-primary rounded-pill dropdown-toggle" 
                                                                                type="button" 
                                                                                data-bs-toggle="dropdown"
                                                                            >
                                                                                Assign To
                                                                            </button>
                                                                            <ul className="dropdown-menu">
                                                                                {allDepartmentTeamLeaders.map(teamLeader => (
                                                                                    <li key={teamLeader.id}>
                                                                                        <button 
                                                                                            className="dropdown-item"
                                                                                            onClick={() => handleAssignEmployee(employee.user_id, teamLeader.id)}
                                                                                        >
                                                                                            {teamLeader.name}
                                                                                        </button>
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="text-center py-5">
                                                    <div className="rounded-circle bg-success bg-opacity-10 p-3 d-inline-block mb-3">
                                                        <i className="ri-checkbox-circle-line display-4 text-success"></i>
                                                    </div>
                                                    <h5 className="mt-3">All employees are assigned!</h5>
                                                    <p className="text-muted">There are no unassigned employees in this department.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
            
            {/* Assign Employee Modal */}
            {showAssignModal && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-quaternary text-white">
                                <h5 className="modal-title">Assign Employee to {selectedTeamLeader?.name}</h5>
                                <button 
                                    type="button" 
                                    className="btn-close btn-outline-close-white" 
                                    onClick={() => {
                                        setShowAssignModal(false);
                                        setSelectedTeamLeader(null);
                                    }}
                                ></button>
                            </div>
                            <div className="modal-body">
                                {unassignedEmployees.length > 0 ? (
                                    <div className="table-responsive">
                                        <table className="table table-centered table-nowrap mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Employee</th>
                                                    <th>Contact</th>
                                                    <th>Details</th>
                                                    <th>Status</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {unassignedEmployees.map((employee) => (
                                                    <tr key={employee.user_id}>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <div className="flex-grow-1 ms-2">
                                                                    <h6 className="mb-0">{employee.name}</h6>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div>
                                                                <div className="text-muted">
                                                                    <i className="ri-mail-line align-middle me-1"></i>
                                                                    {employee.email}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            {employee.designation ? (
                                                                <span className="badge bg-light text-dark">
                                                                    {employee.designation}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted">-</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${employee.is_active ? 'bg-success' : 'bg-danger'}`}>
                                                                {employee.is_active ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <button 
                                                                className="btn btn-sm btn-outline-primary rounded-pill"
                                                                onClick={() => handleAssignEmployee(employee.user_id, selectedTeamLeader.id)}
                                                            >
                                                                <i className="ri-user-add-line me-1"></i>
                                                                Assign
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <div className="rounded-circle bg-info bg-opacity-10 p-3 d-inline-block mb-3">
                                            <i className="ri-user-add-line display-4 text-info"></i>
                                        </div>
                                        <h5 className="mt-3">No unassigned employees</h5>
                                        <p className="text-muted">All employees in this department are already assigned to team leaders.</p>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-outline-secondary rounded-pill" 
                                    onClick={() => {
                                        setShowAssignModal(false);
                                        setSelectedTeamLeader(null);
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssignEmployeesToTeamLeaders;