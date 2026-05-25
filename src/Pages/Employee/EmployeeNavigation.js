import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const EmployeeNavigation = () => {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-header bg-white border-0">
        <h5 className="mb-0">Employee Navigation</h5>
      </div>
      <div className="card-body">
        <div className="d-flex flex-wrap gap-2">
          <Link 
            to="/employee/dashboard" 
            className={`btn ${isActive('/employee/dashboard') ? 'btn-primary' : 'btn-outline-primary'}`}
          >
            <i className="ri-dashboard-line me-1"></i>
            Dashboard
          </Link>
          
          <Link 
            to="/employee/tasks" 
            className={`btn ${isActive('/employee/tasks') && !location.pathname.includes('records') ? 'btn-primary' : 'btn-outline-primary'}`}
          >
            <i className="ri-task-line me-1"></i>
            Assigned Tasks
          </Link>
          
          <Link 
            to="/employee/tasks/records" 
            className={`btn ${isActive('/employee/tasks/records') ? 'btn-primary' : 'btn-outline-primary'}`}
          >
            <i className="ri-file-list-line me-1"></i>
            Task Records
          </Link>
          
          <Link 
            to="/employee/team" 
            className={`btn ${isActive('/employee/team') ? 'btn-primary' : 'btn-outline-primary'}`}
          >
            <i className="ri-group-line me-1"></i>
            My Team
          </Link>
          
          <Link 
            to="/employee/task-perform" 
            className={`btn ${isActive('/employee/task-perform') ? 'btn-primary' : 'btn-outline-primary'}`}
          >
            <i className="ri-play-circle-line me-1"></i>
            Perform Task
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EmployeeNavigation;