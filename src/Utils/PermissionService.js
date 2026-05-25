import { buildApiUrl } from '../config/api';

// Service to handle team leader permission operations
const PermissionService = {
  // Check if team leader has permission for a specific button
  checkPermission: async (permissionType) => {
    try {
      const response = await fetch(buildApiUrl('/permissions/check'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          permissionType
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to check permission');
      }

      return data.hasPermission;
    } catch (error) {
      console.error('Error checking permission:', error);
      // Default to false if there's an error, to be safe
      return false;
    }
  },

  // Get all team leader permissions (admin only)
  getAllPermissions: async () => {
    try {
      const response = await fetch(buildApiUrl('/permissions/all'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch permissions');
      }

      return data.permissions;
    } catch (error) {
      console.error('Error fetching permissions:', error);
      throw error;
    }
  },

  // Update or create team leader permission
  updatePermission: async (permissionData) => {
    try {
      const response = await fetch(buildApiUrl('/permissions/update'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(permissionData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update permission');
      }

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
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete permission');
      }

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
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch team leader permissions');
      }

      return data.permissions;
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
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          teamLeaderId,
          permissions
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update team leader permissions');
      }

      return data;
    } catch (error) {
      console.error('Error updating team leader permissions:', error);
      throw error;
    }
  }
};

export default PermissionService;