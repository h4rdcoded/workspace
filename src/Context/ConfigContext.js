import React, { createContext, useEffect, useState } from "react";

export const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
  
  const [apiURL, setAPIURL] = useState(process.env.REACT_APP_SERVER_URL );
  const [leadCrmApiURL, setLeadCrmApiURL] = useState(process.env.REACT_APP_LEAD_CRM_API_URL);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem("refreshToken"));
  const [companyId, setCompanyId] = useState(localStorage.getItem("company_id"));
  const [userId, setUserId] = useState(localStorage.getItem("user_id"));
  const [adminId, setAdminId] = useState(localStorage.getItem("admin_id"));
  const [userRole, setUserRole] = useState(localStorage.getItem("user_role"));
  const [permissions, setPermissions] = useState(JSON.parse(localStorage.getItem("permissions") || '{}'));
  const [userType, setUserType] = useState(localStorage.getItem("user_type") || 'legacy'); // 'admin', 'lead_crm', or 'legacy'
  const [userInfo, setUserInfo] = useState(() => {
    const stored = localStorage.getItem("user_info");
    return stored && stored !== '{}' ? JSON.parse(stored) : null;
  });
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Add a state trigger to force re-renders when auth state changes
  const [authStateVersion, setAuthStateVersion] = useState(0);
  
  // Lead CRM specific state
  const [leadCrmUser, setLeadCrmUser] = useState(() => {
    const stored = localStorage.getItem("lead_crm_user");
    return stored && stored !== 'null' ? JSON.parse(stored) : null;
  });
  const [isLeadCrmAuthenticated, setIsLeadCrmAuthenticated] = useState(() => {
    const token = localStorage.getItem("lead_crm_token");
    const user = localStorage.getItem("lead_crm_user");
    // Check for valid token and user data
    return !!(token && token !== 'authenticated' && token !== 'null' && user && user !== 'null');
  });
  
  const [apiHeaderJSON, setHeaderJSON] = useState({
    token: `${token}`,
    "Content-Type": "application/json",
    company_id: companyId,
    user_id: userId,
    admin_id: adminId
  });
  
  const [apiHeaderFile, setHeaderFile] = useState({
    token: `${token}`, 
    "Content-Type": "multipart/form-data", 
    company_id: companyId, 
    user_id: userId,
    admin_id: adminId
  });
  
  // Lead CRM API headers - cookies are used for authentication, not Bearer tokens
  const [leadCrmHeaders, setLeadCrmHeaders] = useState({
    "Content-Type": "application/json"
  });

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
    }
    
    // Clean up invalid lead_crm_token if it exists
    const leadCrmToken = localStorage.getItem("lead_crm_token");
    if (leadCrmToken && (leadCrmToken === 'authenticated' || leadCrmToken === 'null')) {
      localStorage.removeItem("lead_crm_token");
      setIsLeadCrmAuthenticated(false);
    }
    
    // Lead CRM uses cookies for authentication, not Bearer tokens in headers
    // Headers are kept simple for Lead CRM API calls
    setLeadCrmHeaders({
      "Content-Type": "application/json"
    });
    
    // Mark as initialized immediately after initial setup
    setIsInitialized(true);
  }, []); // Empty dependency array - run only once on mount

  // Separate effect for checking and refreshing user data
  useEffect(() => {
    const checkAndRefreshUserData = async () => {
      if (isLeadCrmAuthenticated && leadCrmUser && leadCrmUser.id) {
        const isUUID = typeof leadCrmUser.id === 'string' && leadCrmUser.id.includes('-');
        if (isUUID) {
          try {
            const response = await fetch(`${leadCrmApiURL}/auth/me`, {
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
              const userData = await response.json();
              if (userData.success && userData.data && userData.data.user) {
                const correctedUser = {
                  id: userData.data.user.id, // This should now be the database ID
                  uuid: userData.data.user.uuid,
                  name: userData.data.user.name,
                  email: userData.data.user.email,
                  role: userData.data.user.role
                };
                
                setLeadCrmUser(correctedUser);
                localStorage.setItem("lead_crm_user", JSON.stringify(correctedUser));
              }
            }
          } catch (error) {
            console.error('Failed to refresh user data:', error);
          }
        }
      }
    };
    
    if (isInitialized) {
      checkAndRefreshUserData();
    }
  }, [leadCrmApiURL, isLeadCrmAuthenticated, leadCrmUser, isInitialized]);

  // Check if user has specific permission
  const hasPermission = (permission) => {
    // Admin users have all permissions
    if (userRole === 'ADMIN' || leadCrmUser?.role === 'ADMIN') {
      return true;
    }
    
    // Check if permission exists in permissions object
    return permissions[permission] === true;
  };

  // Check if user has any of the specified roles (Enhanced role checking)
  const hasRole = (roles) => {
    // Handle both single role string and array of roles
    const rolesToCheck = Array.isArray(roles) ? roles : [roles];
    
    // For Lead CRM users, check their actual role
    if (isLeadCrmAuthenticated && leadCrmUser) {
      return rolesToCheck.includes(leadCrmUser.role) || leadCrmUser.role === 'ADMIN';
    }
    
    // For legacy users
    if (userType === 'admin' && userRole) {
      return rolesToCheck.includes(userRole) || userRole === 'ADMIN';
    }
    
    return false;
  };

  // Handle Lead CRM login
  const handleLeadCrmLogin = (userData, token, redirectTo) => {
    const user = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role  // Store actual role from server
    };
    
    // Update state immediately to trigger re-render
    setLeadCrmUser(user);
    setIsLeadCrmAuthenticated(true);
    setUserType('lead_crm');
    setUserRole(user.role); // Set the actual role
    setUserInfo(user); // Also set userInfo for DashboardRouter compatibility
    
    // Store in localStorage
    localStorage.setItem("lead_crm_user", JSON.stringify(user));
    localStorage.setItem("user_type", "lead_crm");
    localStorage.setItem("user_role", user.role); // Store actual role
    
    // Store the actual JWT token, not 'authenticated'
    if (token && token !== 'authenticated') {
      localStorage.setItem("lead_crm_token", token);
    }
    
    localStorage.setItem("user_info", JSON.stringify(user)); // For DashboardRouter
    
    // Update headers with the auth cookie (handled by browser)
    setLeadCrmHeaders({
      "Content-Type": "application/json"
    });
    
    console.log('✅ Lead CRM login completed successfully');
    
    // Trigger auth state change to force App component re-render
    setAuthStateVersion(prev => prev + 1);
    
    // Force a small delay to ensure state has updated before navigation
    setTimeout(() => {
      console.log('🔄 State should be updated, authentication status:', isLeadCrmAuthenticated);
    }, 100);
    
    return redirectTo;
  };

  // Handle admin login
  const handleUpdateLogin = (data) => {
    if (data.adminId) {
      // Admin login
      setToken(data.token);
      setRefreshToken(data.refreshToken);
      setAdminId(data.adminId);
      setUserRole(data.role);
      setPermissions(data.permissions || {});
      setUserType('admin');
      setUserInfo({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        username: data.username,
        phone: data.phone
      });
      
      localStorage.setItem("token", data.token);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("admin_id", data.adminId);
      localStorage.setItem("user_role", data.role);
      localStorage.setItem("permissions", JSON.stringify(data.permissions || {}));
      localStorage.setItem("user_type", "admin");
      localStorage.setItem("user_info", JSON.stringify({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        username: data.username,
        phone: data.phone
      }));
    } else {
      // Legacy login
      setToken(data.token);
      setCompanyId(data.company_id);
      setUserId(data.company_user_id);
      setUserType('legacy');
      
      localStorage.setItem("token", data.token);
      localStorage.setItem("company_id", data.company_id);
      localStorage.setItem("user_id", data.company_user_id);
      localStorage.setItem("user_type", "legacy");
    }
  };

  // Handle logout
  const handleLogout = async () => {
    // If Lead CRM user, call logout endpoint
    if (isLeadCrmAuthenticated) {
      try {
        await fetch(`${leadCrmApiURL}/auth/logout`, {
          method: 'POST',
          credentials: 'include'
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    // Clear all state
    setToken(null);
    setRefreshToken(null);
    setCompanyId(null);
    setUserId(null);
    setAdminId(null);
    setUserRole(null);
    setPermissions({});
    setUserType('legacy');
    setUserInfo({});
    setLeadCrmUser(null);
    setIsLeadCrmAuthenticated(false);
    
    // Clear role from localStorage
    localStorage.removeItem("user_role");
    
    // Trigger auth state change to force App component re-render
    setAuthStateVersion(prev => prev + 1);
    
    // Clear localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("company_id");
    localStorage.removeItem("user_id");
    localStorage.removeItem("admin_id");
    localStorage.removeItem("user_role");
    localStorage.removeItem("permissions");
    localStorage.removeItem("user_type");
    localStorage.removeItem("user_info");
    localStorage.removeItem("lead_crm_user");
    localStorage.removeItem("lead_crm_token");
    
    // Reset headers
    setLeadCrmHeaders({
      "Content-Type": "application/json"
    });
  };

  // Get current user based on authentication type
  const getCurrentUser = () => {
    if (isLeadCrmAuthenticated && leadCrmUser) {
      return leadCrmUser;
    }
    if (userType === 'admin' && userInfo) {
      return {
        name: `${userInfo.firstName} ${userInfo.lastName}`,
        email: userInfo.email,
        role: userRole
      };
    }
    return null;
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return isLeadCrmAuthenticated || !!token;
  };

  const placeHolderImageURL = `${process.env.REACT_APP_SERVER_URL}/public/placeholder_category.jpeg`;
  const staticFilesBaseURL = leadCrmApiURL.replace('/api/v1', ''); 

  var vals = {
    apiURL,
    setAPIURL,
    leadCrmApiURL,
    setLeadCrmApiURL,
    token,
    setToken,
    refreshToken,
    setRefreshToken,
    companyId,
    userId,
    adminId,
    userRole,
    permissions,
    userType,
    userInfo,
    leadCrmUser,
    isLeadCrmAuthenticated,
    isInitialized,
    authStateVersion, // Add this to trigger re-renders
    handleUpdateLogin,
    handleLeadCrmLogin,
    handleLogout,
    hasPermission,
    hasRole,
    getCurrentUser,
    isAuthenticated,
    placeHolderImageURL,
    staticFilesBaseURL, // Add this line
    apiHeaderJSON,
    apiHeaderFile,
    leadCrmHeaders,
  };
  
  return (
    <ConfigContext.Provider value={vals}>
      {children}
    </ConfigContext.Provider>
  );
};