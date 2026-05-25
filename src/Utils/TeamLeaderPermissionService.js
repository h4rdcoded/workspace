import { buildApiUrl, getAuthHeaders } from '../config/api';

// Service to handle team leader permission operations specifically
const TeamLeaderPermissionService = {
  // Check multiple permissions at once (optimized - single API call)
  checkMultiplePermissions: async (permissionTypes = ['review_task_button', 'forward_to_tester_button']) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      };
      
      console.log('🔍 Checking multiple permissions:', permissionTypes);
      
      const response = await fetch(buildApiUrl('/permissions/check-multiple'), {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          permissionTypes
        })
      });

      console.log('📥 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Multiple permission check failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData.message || 'Unknown error'
        });
        // Return all false on error
        const result = {};
        permissionTypes.forEach(type => {
          result[type] = false;
        });
        return result;
      }

      const data = await response.json();
      console.log('✅ Multiple permission check response:', data);
      
      return data.permissions || {};
    } catch (error) {
      console.error('❌ Error checking multiple permissions:', error);
      // Return all false on error
      const result = {};
      permissionTypes.forEach(type => {
        result[type] = false;
      });
      return result;
    }
  },

  // Check if team leader has permission for a specific button
  checkPermission: async (permissionType) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      };
      
      console.log('🔍 Checking permission:', permissionType);
      console.log('📤 Request headers:', headers);
      
      const response = await fetch(buildApiUrl('/permissions/check'), {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          permissionType
        })
      });

      console.log('📥 Response status:', response.status, response.statusText);

      // Check if the response status indicates success
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Permission check failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData.message || 'Unknown error',
          errorData
        });
        return false;
      }

      const data = await response.json();
      console.log('✅ Permission check response:', data);
      console.log('🔐 Has permission:', data.hasPermission);
      
      // Check both hasPermission and success fields
      const hasPermission = data.hasPermission === true || data.hasPermission === 1;
      console.log('🎯 Final permission result:', hasPermission);
      
      return hasPermission;
    } catch (error) {
      console.error('❌ Error checking permission:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      return false;
    }
  },

  // Get all team leader permissions (admin only)
  getAllPermissions: async () => {
    try {
      const response = await fetch(buildApiUrl('/permissions/all'), {
        method: 'GET',
        headers: {
          ...getAuthHeaders()
        }
      });

      if (!response.ok) {
        // Handle different status codes
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in with an admin account.');
        } else if (response.status === 403) {
          throw new Error('Access denied. Admin privileges required.');
        } else {
          // Try to get error message from response
          let errorData;
          try {
            errorData = await response.json();
          } catch (parseError) {
            // If response is not JSON, create a generic error
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          throw new Error(errorData.message || 'Failed to fetch permissions');
        }
      }

      const data = await response.json();
      return data.permissions || [];
    } catch (error) {
      console.error('Error fetching permissions:', error);
      // If it's a network error or similar, throw it as is
      if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      throw error;
    }
  },

  // Update or create team leader permission
  updatePermission: async (permissionData) => {
    try {
      const response = await fetch(buildApiUrl('/permissions/update'), {
        method: 'POST',
        headers: {
          ...getAuthHeaders()
        },
        body: JSON.stringify(permissionData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 403) {
          throw new Error('Access denied. Admin privileges required.');
        }
        throw new Error(errorData.message || 'Failed to update permission');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating permission:', error);
      throw error;
    }
  },

  // Delete team leader permission
  deletePermission: async (permissionId) => {
    try {
      const response = await fetch(buildApiUrl(`/permissions/delete/${permissionId}`), {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders()
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 403) {
          throw new Error('Access denied. Admin privileges required.');
        }
        throw new Error(errorData.message || 'Failed to delete permission');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting permission:', error);
      throw error;
    }
  },
  
  // Get team leader permissions
  getTeamLeaderPermissions: async (teamLeaderId) => {
    try {
      const response = await fetch(buildApiUrl(`/permissions/team-leader/${teamLeaderId}`), {
        method: 'GET',
        headers: {
          ...getAuthHeaders()
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 403) {
          throw new Error('Access denied. Admin privileges required.');
        }
        throw new Error(errorData.message || 'Failed to fetch team leader permissions');
      }

      const data = await response.json();
      return data.permissions || [];
    } catch (error) {
      console.error('Error fetching team leader permissions:', error);
      throw error;
    }
  },
  
  // Bulk update team leader permissions
  updateTeamLeaderPermissions: async (teamLeaderId, permissions) => {
    try {
      const response = await fetch(buildApiUrl('/permissions/team-leader/update'), {
        method: 'POST',
        headers: {
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          teamLeaderId,
          permissions
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 403) {
          throw new Error('Access denied. Admin privileges required.');
        }
        throw new Error(errorData.message || 'Failed to update team leader permissions');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating team leader permissions:', error);
      throw error;
    }
  }
};

export default TeamLeaderPermissionService;