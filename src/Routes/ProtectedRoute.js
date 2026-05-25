import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { ConfigContext } from '../Context/ConfigContext';
import { toast } from 'react-toastify';

const ProtectedRoute = ({ children, requiredPermission, requiredRole, fallbackRoute = '/Login' }) => {
  const { token, hasPermission, hasRole, isLeadCrmAuthenticated, } = useContext(ConfigContext);
  const localStorageToken = localStorage.getItem('token');
  const leadCrmToken = localStorage.getItem('lead_crm_token');
  const leadCrmUserData = localStorage.getItem('lead_crm_user');
  


  // Check if user is authenticated (legacy OR Lead CRM)
  const isAuthenticated = (localStorageToken || token) || 
                         (leadCrmToken && leadCrmUserData && leadCrmUserData !== 'null') ||
                         isLeadCrmAuthenticated;
  
  if (!isAuthenticated) {
    
    return <Navigate to='/Login' />;
  }
  
 

  // If specific permission is required
  if (requiredPermission && !hasPermission(requiredPermission)) {
    toast.error(`Access denied. Required permission: ${requiredPermission}`);
    return <Navigate to={fallbackRoute} />;
  }

  // If specific role is required
  if (requiredRole && !hasRole(requiredRole)) {
    const roleText = Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole;
    toast.error(`Access denied. Required role: ${roleText}`);
    return <Navigate to={fallbackRoute} />;
  }

  return children;
};

// Higher-order component for role-based routes
export const AdminOnlyRoute = ({ children }) => (
  <ProtectedRoute requiredRole={['ADMIN', 'Department Head']}>
    {children}
  </ProtectedRoute>
);

// Higher-order component for permission-based routes
export const PermissionRoute = ({ children, permission }) => (
  <ProtectedRoute requiredPermission={permission}>
    {children}
  </ProtectedRoute>
);

// Higher-order component for system admin only routes
export const SystemAdminRoute = ({ children }) => (
  <ProtectedRoute requiredRole='ADMIN'>
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;