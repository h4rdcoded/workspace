import React from 'react';
import { useNavigate } from 'react-router-dom';

const TestDepartmentManagerPage = () => {
    const navigate = useNavigate();

    return (
        <div className="page-content">
            <div className="container-fluid">
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-0">
                                <h4 className="mb-0">Department Manager Test Page</h4>
                            </div>
                            <div className="card-body">
                                <p>This is a test page to verify that department manager routing is working correctly.</p>
                                <div className="d-flex gap-2">
                                    <button 
                                        className="btn btn-primary"
                                        onClick={() => navigate('/department-manager')}
                                    >
                                        Go to Department Manager Dashboard
                                    </button>
                                    <button 
                                        className="btn btn-outline-primary"
                                        onClick={() => navigate('/dashboard')}
                                    >
                                        Return to Main Dashboard
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestDepartmentManagerPage;