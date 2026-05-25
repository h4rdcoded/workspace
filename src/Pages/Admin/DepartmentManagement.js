import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Add useNavigate
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_ENDPOINTS, buildApiUrl, getAuthHeaders } from '../../config/api';

const DepartmentManagement = () => {
    const navigate = useNavigate(); // Add navigate hook
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);

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
            
            toast.error('Failed to fetch departments');
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
            <>
                {/* Vertical Overlay*/}
                <div className="vertical-overlay" />
                {/* ============================================================== */}
                {/* Start right Content here */}
                {/* ============================================================== */}
                <div className="main-content">
                    <div className="page-content">
                        <div className="container-fluid">
                            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
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

                        <div className="row">
                            <div className="col-12">
                                <div className="card">
                                    <div className="card-header d-flex justify-content-between align-items-center">
                                        <h4 className="card-title mb-0">Departments List</h4>
                                        {/* Removed Create Department button */}
                                    </div>
                                    <div className="card-body">
                                        <div className="table-responsive">
                                            <table className="table table-striped">
                                                <thead>
                                                    <tr>
                                                        <th>Department</th>
                                                        <th>Manager</th>
                                                        <th>Employees</th>
                                                        <th>Created</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {departments.map(dept => (
                                                        <tr key={dept.id}>
                                                            <td>
                                                                <div>
                                                                    <strong>{dept.name}</strong>
                                                                    {dept.description && (
                                                                        <div className="text-muted small">
                                                                            {dept.description}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                {dept.manager_name ? (
                                                                    <div>
                                                                        <strong>{dept.manager_name}</strong>
                                                                        <div className="text-muted small">
                                                                            {dept.manager_email}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-muted">No manager assigned</span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <span className="badge bg-info">
                                                                    {dept.employee_count} employees
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {new Date(dept.created_at).toLocaleDateString()}
                                                            </td>
                                                            <td>
                                                                <button 
                                                                    className="btn btn-outline-secondary btn-sm"
                                                                    onClick={() => handleDepartmentClick(dept)}
                                                                    title="View Details"
                                                                >
                                                                    <i className="fas fa-eye"></i> View Details
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
            </div>
        </>
    );
};

export default DepartmentManagement;