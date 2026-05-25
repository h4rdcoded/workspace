import React, { useContext, useEffect } from 'react';
import { ConfigContext } from '../../Context/ConfigContext';
import { Navigate, useLocation } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import TLDashboard from './TLDashboard';

import DepartmentManagerDashboard from './DepartmentManagerDashboard';
import TeamLeaderDashboard from './TeamLeaderDashboard';
import EmployeeDashboard from '../Employee/EmployeeDashboard';

const DashboardRouter = () => {
  const { userInfo, token, isLeadCrmAuthenticated, leadCrmUser, userType, userRole } = useContext(ConfigContext);
  const location = useLocation();

  // Check authentication for both legacy and Lead CRM users
  const isAuthenticated = token || isLeadCrmAuthenticated || localStorage.getItem('token') || localStorage.getItem('lead_crm_token');
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/Login" replace />;
  }

  // Check if we're on a department manager route
  const isDepartmentManagerRoute = location.pathname.startsWith('/department-manager');
  
  // If on department manager route, render the department manager dashboard
  if (isDepartmentManagerRoute) {
    return <DepartmentManagerDashboard />;
  }

  // Get current user data (Lead CRM or legacy)
  const currentUser = leadCrmUser || userInfo;
  
  // Debug logging
  console.log('DashboardRouter Debug:', {
    isAuthenticated,
    userType,
    leadCrmUser,
    userInfo,
    currentUser,
    isLeadCrmAuthenticated,
    userRole,
    pathname: location.pathname
  });
  
  // If user info is not loaded yet, show loading
  if (!currentUser || (typeof currentUser === 'object' && Object.keys(currentUser).length === 0)) {
    // Try to get user data from localStorage directly as fallback
    const leadCrmUserFromStorage = localStorage.getItem('lead_crm_user');
    const userInfoFromStorage = localStorage.getItem('user_info');
    
    if (leadCrmUserFromStorage && leadCrmUserFromStorage !== 'null') {
      try {
        const userData = JSON.parse(leadCrmUserFromStorage);
        if (userData && userData.id) {
          // Use the data from localStorage directly
          console.log('Using Lead CRM data from localStorage:', userData);
          return renderDashboardByRole(userData.role);
        }
      } catch (e) {
        console.error('Error parsing lead_crm_user from localStorage:', e);
      }
    }
    
    if (userInfoFromStorage && userInfoFromStorage !== '{}') {
      try {
        const userData = JSON.parse(userInfoFromStorage);
        if (userData && (userData.id || userData.name)) {
          console.log('Using user info from localStorage:', userData);
          return renderDashboardByRole(userData.role);
        }
      } catch (e) {
        console.error('Error parsing user_info from localStorage:', e);
      }
    }
    
    // Final fallback - show loading
    return (
      <div className="page-content">
        <div className="container-fluid">
          <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Loading user data...</p>
              <small className="text-muted">If this persists, please try logging in again.</small>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Helper function to render dashboard by role
  const renderDashboardByRole = (role) => {
    const roleStr = String(role || '').toUpperCase();
    console.log('Rendering dashboard for role:', role, 'normalized:', roleStr);
    
    switch (roleStr) {
      case 'ADMIN':
        return <AdminDashboard />;
      case 'TL':
        // For team leaders, check if they are also department managers
        return <TeamLeaderDashboard />;
      case 'EXEC':
        return <EmployeeDashboard />;
      default:
        // Default to employee dashboard for unknown roles
        return <EmployeeDashboard />;
    }
  };

  // Get dashboard type from user permissions or role
  const getDashboardType = () => {
    // For Lead CRM users, use their role directly
    if (userType === 'lead_crm' && leadCrmUser) {
      const role = leadCrmUser.role;
      switch (role) {
        case 'ADMIN':
          return 'admin';
        case 'TL':
          return 'team_leader';
        case 'EXEC':
          return 'executive';
        default:
          return 'employee';
      }
    }
    
    // For legacy users, check permissions
    if (currentUser.permissions) {
      try {
        const permissions = typeof currentUser.permissions === 'string' 
          ? JSON.parse(currentUser.permissions) 
          : currentUser.permissions;
        return permissions.dashboard || 'employee';
      } catch (error) {
        console.error('Error parsing permissions:', error);
        return 'employee';
      }
    }
    
    // Fallback based on role name
    const role = currentUser.role || currentUser.role_name || '';
    switch (role.toUpperCase()) {
      case 'ADMIN':
        return 'admin';
      case 'TL':
      case 'TEAM LEADER':
        return 'team_leader';
      case 'EXEC':
      case 'EXECUTIVE':
      case 'EMPLOYEE':
      default:
        return 'employee';
    }
  };

  // For Lead CRM users, use their actual role
  if (userType === 'lead_crm' && leadCrmUser && leadCrmUser.role) {
    return renderDashboardByRole(leadCrmUser.role);
  }

  const dashboardType = getDashboardType();
  console.log('Final dashboard type determined:', dashboardType);

  // Render appropriate dashboard based on role
  return renderDashboardByRole(dashboardType);
};

export default DashboardRouter;