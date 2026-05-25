// Helper function to get the base URL based on environment
const getBaseUrl = () => {
  // Check if we're in development and not on localhost
  if (process.env.NODE_ENV === 'development') {
    // If the app is accessed via a network IP, use that IP for API calls too
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname;
      // If accessing via network IP (not localhost), use the same IP for API
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return `http://${hostname}:3188/api/v1`;
      }
    }
  }
  
  // Default to localhost or environment variable
  return process.env.REACT_APP_API_URL || 'https://task.ipshopy.com/api/v1';
};

const getLeadCrmUrl = () => {
  // Check if we're in development and not on localhost
  if (process.env.NODE_ENV === 'development') {
    // If the app is accessed via a network IP, use that IP for API calls too
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname;
      // If accessing via network IP (not localhost), use the same IP for API
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return `http://${hostname}:3188/api`;
      }
    }
  }
  
  // Default to localhost or environment variable
  return process.env.REACT_APP_LEAD_CRM_API_URL || 'https://task.ipshopy.com/api';
};

// API Configuration
const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  LEAD_CRM_URL: getLeadCrmUrl(),
  TIMEOUT: 10000, // 10 seconds
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
  },
  
  // Departments
  DEPARTMENTS: {
    BASE: '/departments',
    CREATE: '/departments',
    UPDATE: (id) => `/departments/${id}`,
    DELETE: (id) => `/departments/${id}`,
    DETAILS: (id) => `/departments/${id}/details`,
    MANAGERS_AVAILABLE: '/departments/managers/available',
    ASSIGN_MANAGER: (id) => `/departments/${id}/manager`,
    GET_AVAILABLE_EMPLOYEES: (id) => `/departments/${id}/available-employees`,
    GET_TEAM_LEADERS: (id) => `/departments/${id}/team-leaders`,
    TEAM_LEADERS: (id) => `/departments/${id}/team-leaders`,
    ADD_TEAM_LEADER: (id) => `/departments/${id}/team-leaders`,
    REMOVE_TEAM_LEADER: (id, leaderId) => `/departments/${id}/team-leaders/${leaderId}`,
    CREATE_TEAM: (id) => `/departments/${id}/teams`,
    ASSIGN_TASK: (id) => `/departments/${id}/tasks`,
    ASSIGN_TASK_TO_EMPLOYEE: (id) => `/departments/${id}/tasks/assign-to-employee`,
    STATS: '/departments/stats',
  },
  
  // Users
  USERS: {
    BASE: '/users',
    BY_ROLE: (role) => `/users?role=${role}`,
    PROFILE: (id) => `/users/${id}`,
    UPDATE: (id) => `/users/${id}`,
    DELETE: (id) => `/users/${id}`,
  },
  
  // Employees
  EMPLOYEES: {
    BASE: '/employees',
    CREATE: '/employees',
    UPDATE: (id) => `/employees/${id}`,
    DELETE: (id) => `/employees/${id}`,
    BY_DEPARTMENT: (deptId) => `/employees?department=${deptId}`,
  },
  
  // Teams
  TEAMS: {
    BASE: '/teams',
    CREATE: '/teams',
    UPDATE: (id) => `/teams/${id}`,
    DELETE: (id) => `/teams/${id}`,
    ASSIGN_TO_DEPARTMENT: '/teams/assign-to-department',
  },
  
  // Admin
  ADMIN: {
    ROLES: '/admin/roles',
    PERMISSIONS: '/admin/permissions',
    USER_PERMISSIONS: (userId) => `/admin/users/${userId}/permissions`,
  },
  
  // Dashboard
  DASHBOARD: {
    ADMIN: '/dashboard/admin',
    EMPLOYEE: '/dashboard/employee',
    STATS: '/dashboard/stats',
  },
  
  // Permissions
  PERMISSIONS: {
    BASE: '/permissions',
    USER: (userId) => `/permissions/user/${userId}`,
    ROLES: '/permissions/roles',
  },
  
  // Tasks
  TASKS: {
    BASE: '/tasks',
    CREATE: '/tasks',
    UPDATE: (id) => `/tasks/${id}`,
    DELETE: (id) => `/tasks/${id}`,
    ASSIGN: (id) => `/tasks/${id}/assign`,
    BREAKDOWN: (id) => `/tasks/${id}/breakdown`,
    GET_BY_ID: (id) => `/tasks/${id}`,
    GET_BY_STATUS: (status) => `/tasks/status/${status}`,
    GET_USER_TASKS: (userId) => `/tasks/user/${userId}`,
    GET_USER_TASKS_WITH_SUBTASKS: (userId) => `/tasks/user/${userId}/with-subtasks`,
    GET_MY_TASKS_WITH_SUBTASKS: '/tasks/my-tasks-with-subtasks', // New endpoint
    GET_STATISTICS: '/tasks/statistics',
    
    // Task Status
    UPDATE_STATUS: (id) => `/tasks/${id}/status`,
    REVIEW: (id) => `/tasks/${id}/review`,
    GET_STATUS_HISTORY: (id) => `/tasks/${id}/status-history`,
    BULK_STATUS_UPDATE: '/tasks/bulk-status-update',
    GET_PENDING_REVIEWS: '/tasks/pending-reviews',
    
    // Task Comments
    ADD_COMMENT: (id) => `/tasks/${id}/comments`,
    GET_COMMENTS: (id) => `/tasks/${id}/comments`,
    
    // Task Attachments
    UPLOAD_ATTACHMENT: (id) => `/tasks/${id}/attachments`,
    DOWNLOAD_ATTACHMENT: (id) => `/tasks/attachments/${id}/download`,
    DELETE_ATTACHMENT: (id) => `/tasks/attachments/${id}`,
    GET_ATTACHMENTS: (id) => `/tasks/${id}/attachments`,
  },
};

// Helper function to build full URL
export const buildApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to build Lead CRM URL
export const buildLeadCrmUrl = (endpoint) => {
  return `${API_CONFIG.LEAD_CRM_URL}${endpoint}`;
};

// Get auth headers
export const getAuthHeaders = () => {
  // Check for both legacy token and Lead CRM token
  const legacyToken = localStorage.getItem('token');
  const leadCrmToken = localStorage.getItem('lead_crm_token');
  
  // Use whichever token is available, prioritize lead_crm_token
  const token = leadCrmToken || legacyToken;
  
  // Validate token before returning

  
 
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

// Get Lead CRM auth headers
export const getLeadCrmAuthHeaders = () => {
  const token = localStorage.getItem('lead_crm_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

export default API_CONFIG;