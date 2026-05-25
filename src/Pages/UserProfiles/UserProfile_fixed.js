import React, { useState, useEffect, useContext } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ConfigContext } from '../../Context/ConfigContext';

function Profile() {
  // Fix ESLint error by using the imported hook
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('id');
  const { leadCrmApiURL, staticFilesBaseURL, getCurrentUser, isLeadCrmAuthenticated } = useContext(ConfigContext);
  
  const [userData, setUserData] = useState(null);
  const [userActivities, setUserActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activitiesError, setActivitiesError] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Add state for recent activities
  const [recentActivities, setRecentActivities] = useState([]);
  const [recentActivitiesLoading, setRecentActivitiesLoading] = useState(false);
  const [recentActivitiesError, setRecentActivitiesError] = useState(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Task states for different roles
  const [adminActivities, setAdminActivities] = useState([]);
  const [tlTasks, setTlTasks] = useState([]);
  const [employeeTasks, setEmployeeTasks] = useState([]);
  const [tlAssignedTasks, setTlAssignedTasks] = useState([]);
  
  // Add state for TL task view toggle
  const [tlTaskView, setTlTaskView] = useState('self'); // 'self' or 'assigned'
  
  // Add search state for each task section
  const [tlSelfTaskSearch, setTlSelfTaskSearch] = useState('');
  const [tlAssignedTaskSearch, setTlAssignedTaskSearch] = useState('');
  const [employeeTaskSearch, setEmployeeTaskSearch] = useState('');
  
  // Add filtered task states
  const [filteredTlSelfTasks, setFilteredTlSelfTasks] = useState([]);
  const [filteredTlAssignedTasks, setFilteredTlAssignedTasks] = useState([]);
  const [filteredEmployeeTasks, setFilteredEmployeeTasks] = useState([]);
  
  // Admin management states
  const [allEmployees, setAllEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState(null);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showEditAdminModal, setShowEditAdminModal] = useState(false);
  const [newAdminData, setNewAdminData] = useState({
    name: '',
    email: '',
    role: 'ADMIN',
    mobile: ''
  });
  const [editAdminData, setEditAdminData] = useState({
    id: null,
    name: '',
    email: '',
    mobile: ''
  });
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [isEditingAdmin, setIsEditingAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  const currentUser = getCurrentUser();
  
  // Handle profile image change
  const handleProfileImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      
      // Immediately upload the profile image
      uploadProfileImage(file);
    }
  };
  
  // Upload profile image function
  const uploadProfileImage = async (file) => {
    if (!file || !userData) return;
    
    try {
      setIsUploading(true);
      const token = localStorage.getItem('lead_crm_token');
      
      const formData = new FormData();
      formData.append('profileImage', file);
      
      const response = await fetch(`${leadCrmApiURL}/auth/profile/image`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
        credentials: 'include' // Add credentials for proper authentication
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success('Profile image updated successfully!');
        // Update user data to reflect new profile image
        setUserData(prev => ({
          ...prev,
          profileImage: data.data.profileImage
        }));
        
        // Update in localStorage to ensure persistence
        const currentUser = JSON.parse(localStorage.getItem('lead_crm_user') || '{}');
        if (currentUser && currentUser.id === userData.id) {
          currentUser.profileImage = data.data.profileImage;
          localStorage.setItem('lead_crm_user', JSON.stringify(currentUser));
        }
      } else {
        toast.error(data.message || 'Failed to update profile image');
      }
    } catch (error) {
      console.error('Profile image upload error:', error);
      toast.error('Error uploading profile image');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Determine if we're viewing our own profile or someone else's
  const isOwnProfile = !userId || (currentUser && userId == currentUser.id);
  const targetUserId = isOwnProfile ? (currentUser?.id || null) : userId;
  
  // Check if current user is admin
  const isCurrentUserAdmin = currentUser && currentUser.role === 'ADMIN';
  
  // Only show edit button for own profile or if current user is admin
  const canEditProfile = isOwnProfile || isCurrentUserAdmin;
  
  // Check if we should show admin management section
  const showAdminManagement = isCurrentUserAdmin && isOwnProfile;

  useEffect(() => {
    if (userId && !isOwnProfile) {
      toast.info(`Viewing profile for user: ${userId}`, {
        position: "top-right",
        autoClose: 3000
      });
    }
  }, [userId, isOwnProfile]);
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (!isLeadCrmAuthenticated || !targetUserId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const token = localStorage.getItem('lead_crm_token');
        
        // Use appropriate endpoint based on whether it's own profile or someone else's
        const endpoint = isOwnProfile 
          ? `${leadCrmApiURL}/auth/me`
          : `${leadCrmApiURL}/auth/user/${targetUserId}`;
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include' // Add credentials for proper authentication
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.user) {
            setUserData(data.data.user);
          } else {
            setError('Failed to load user data');
          }
        } else {
          setError('Failed to fetch user profile');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Error loading profile data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [targetUserId, isOwnProfile, leadCrmApiURL, isLeadCrmAuthenticated]);
  
  // Fetch user activities when userData is available
  useEffect(() => {
    const fetchUserActivities = async () => {
      if (!userData || !userData.id) return;
      
      try {
        setActivitiesLoading(true);
        setActivitiesError(null);
        const token = localStorage.getItem('lead_crm_token');
        
        // Headers with authentication
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
        
        // Fetch different data based on user role
        if (userData.role === 'ADMIN') {
          // For admin, fetch their own activities
          const response = await fetch(`${leadCrmApiURL}/user-activities/admin/${userData.id}`, {
            method: 'GET',
            headers: headers,
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              setAdminActivities(data.data.activities || []);
            } else {
              setActivitiesError('Failed to load activity data: ' + (data.message || 'Unknown error'));
            }
          } else {
            const errorData = await response.json().catch(() => ({}));
            setActivitiesError('Failed to fetch user activities: ' + (errorData.message || response.statusText));
          }
        } else if (userData.role === 'TL') {
          // For team leader, fetch their completed/cancelled tasks and assigned tasks
          const [tasksResponse, assignedResponse] = await Promise.all([
            fetch(`${leadCrmApiURL}/user-activities/team-leader/tasks/${userData.id}`, {
              method: 'GET',
              headers: headers,
              credentials: 'include'
            }),
            fetch(`${leadCrmApiURL}/user-activities/team-leader/assigned/${userData.id}`, {
              method: 'GET',
              headers: headers,
              credentials: 'include'
            })
          ]);
          
          if (tasksResponse.ok) {
            const tasksData = await tasksResponse.json();
            if (tasksData.success && tasksData.data) {
              setTlTasks(tasksData.data.tasks || []);
              setFilteredTlSelfTasks(tasksData.data.tasks || []);
            } else {
              setActivitiesError('Failed to load team leader tasks: ' + (tasksData.message || 'Unknown error'));
            }
          } else {
            const errorData = await tasksResponse.json().catch(() => ({}));
            setActivitiesError('Failed to fetch team leader tasks: ' + (errorData.message || tasksResponse.statusText));
          }
          
          if (assignedResponse.ok) {
            const assignedData = await assignedResponse.json();
            if (assignedData.success && assignedData.data) {
              setTlAssignedTasks(assignedData.data.tasks || []);
              setFilteredTlAssignedTasks(assignedData.data.tasks || []);
            } else if (!tasksResponse.ok) { // Only set error if we haven't already set one
              setActivitiesError('Failed to load assigned tasks: ' + (assignedData.message || 'Unknown error'));
            }
          } else if (!tasksResponse.ok) { // Only set error if we haven't already set one
            const errorData = await assignedResponse.json().catch(() => ({}));
            setActivitiesError('Failed to fetch assigned tasks: ' + (errorData.message || assignedResponse.statusText));
          }
        } else {
          // For employee, fetch their completed/cancelled tasks
          const response = await fetch(`${leadCrmApiURL}/user-activities/employee/${userData.id}`, {
            method: 'GET',
            headers: headers,
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              setEmployeeTasks(data.data.tasks || []);
              setFilteredEmployeeTasks(data.data.tasks || []);
            } else {
              setActivitiesError('Failed to load employee tasks: ' + (data.message || 'Unknown error'));
            }
          } else {
            const errorData = await response.json().catch(() => ({}));
            setActivitiesError('Failed to fetch employee tasks: ' + (errorData.message || response.statusText));
          }
        }
      } catch (err) {
        console.error('Error fetching user activities:', err);
        setActivitiesError('Network error: ' + err.message);
      } finally {
        setActivitiesLoading(false);
      }
    };
    
    fetchUserActivities();
  }, [userData, leadCrmApiURL]);
  
  // Fetch recent activities for the overview section
  useEffect(() => {
    const fetchRecentActivities = async () => {
      if (!userData || !userData.id) return;
      
      try {
        setRecentActivitiesLoading(true);
        setRecentActivitiesError(null);
        const token = localStorage.getItem('lead_crm_token');
        
        const response = await fetch(`${leadCrmApiURL}/user-activities/recent/${userData.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setRecentActivities(data.data.activities || []);
          } else {
            setRecentActivitiesError('Failed to load recent activities: ' + (data.message || 'Unknown error'));
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          setRecentActivitiesError('Failed to fetch recent activities: ' + (errorData.message || response.statusText));
        }
      } catch (err) {
        console.error('Error fetching recent activities:', err);
        setRecentActivitiesError('Network error: ' + err.message);
      } finally {
        setRecentActivitiesLoading(false);
      }
    };
    
    fetchRecentActivities();
  }, [userData, leadCrmApiURL]);
  
  // Filter TL self tasks based on search term
  useEffect(() => {
    if (tlSelfTaskSearch) {
      const filtered = tlTasks.filter(task => 
        task.title.toLowerCase().includes(tlSelfTaskSearch.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(tlSelfTaskSearch.toLowerCase())) ||
        (task.created_by_name && task.created_by_name.toLowerCase().includes(tlSelfTaskSearch.toLowerCase())) ||
        task.status.toLowerCase().includes(tlSelfTaskSearch.toLowerCase())
      );
      setFilteredTlSelfTasks(filtered);
    } else {
      setFilteredTlSelfTasks(tlTasks);
    }
  }, [tlSelfTaskSearch, tlTasks]);
  
  // Filter TL assigned tasks based on search term
  useEffect(() => {
    if (tlAssignedTaskSearch) {
      const filtered = tlAssignedTasks.filter(task => 
        task.title.toLowerCase().includes(tlAssignedTaskSearch.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(tlAssignedTaskSearch.toLowerCase())) ||
        (task.assigned_to_name && task.assigned_to_name.toLowerCase().includes(tlAssignedTaskSearch.toLowerCase())) ||
        (task.parent_task_title && task.parent_task_title.toLowerCase().includes(tlAssignedTaskSearch.toLowerCase())) ||
        task.status.toLowerCase().includes(tlAssignedTaskSearch.toLowerCase())
      );
      setFilteredTlAssignedTasks(filtered);
    } else {
      setFilteredTlAssignedTasks(tlAssignedTasks);
    }
  }, [tlAssignedTaskSearch, tlAssignedTasks]);
  
  // Filter employee tasks based on search term
  useEffect(() => {
    if (employeeTaskSearch) {
      const filtered = employeeTasks.filter(task => 
        task.title.toLowerCase().includes(employeeTaskSearch.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(employeeTaskSearch.toLowerCase())) ||
        (task.created_by_name && task.created_by_name.toLowerCase().includes(employeeTaskSearch.toLowerCase())) ||
        (task.parent_task_title && task.parent_task_title.toLowerCase().includes(employeeTaskSearch.toLowerCase())) ||
        task.status.toLowerCase().includes(employeeTaskSearch.toLowerCase())
      );
      setFilteredEmployeeTasks(filtered);
    } else {
      setFilteredEmployeeTasks(employeeTasks);
    }
  }, [employeeTaskSearch, employeeTasks]);
  
  // Fetch all employees for admin management
  const fetchAllEmployees = async () => {
    if (!showAdminManagement) return;
    
    try {
      setEmployeesLoading(true);
      setEmployeesError(null);
      const token = localStorage.getItem('lead_crm_token');
      
      // Fetch only admins instead of all employees
      const response = await fetch(`${leadCrmApiURL}/admin/employees`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok && data.success && data.data) {
        // No need to filter since backend now only returns admins
        setAllEmployees(Array.isArray(data.data) ? data.data : []);
      } else {
        setEmployeesError(data?.message || 'Failed to fetch administrators');
      }
    } catch (err) {
      console.error('Error fetching administrators:', err);
      setEmployeesError('Network error: ' + err.message);
    } finally {
      setEmployeesLoading(false);
    }
  };
  
  // Toggle employee active status
  const toggleEmployeeStatus = async (employeeId, currentStatus) => {
    try {
      const token = localStorage.getItem('lead_crm_token');
      
      console.log('Toggling status for employee:', employeeId, 'Current status:', currentStatus);
      
      // Optimistically update the UI first
      setAllEmployees(prevEmployees => 
        prevEmployees.map(emp => 
          emp.id === employeeId 
            ? { ...emp, isActive: !currentStatus }
            : emp
        )
      );
      
      const response = await fetch(`${leadCrmApiURL}/users/${employeeId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ isActive: !currentStatus })
      });
      
      const data = await response.json();
      console.log('Toggle status response:', response.status, data);
      
      if (response.ok && data.success) {
        toast.success(`Employee ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        // Re-fetch to ensure consistency
        await fetchAllEmployees();
      } else {
        // Revert optimistic update on error
        setAllEmployees(prevEmployees => 
          prevEmployees.map(emp => 
            emp.id === employeeId 
              ? { ...emp, isActive: currentStatus }
              : emp
          )
        );
        console.error('Toggle status error:', data);
        toast.error(data.message || `Failed to ${!currentStatus ? 'activate' : 'deactivate'} employee`);
      }
    } catch (error) {
      // Revert optimistic update on network error
      setAllEmployees(prevEmployees => 
        prevEmployees.map(emp => 
          emp.id === employeeId 
            ? { ...emp, isActive: currentStatus }
            : emp
        )
      );
      console.error('Error updating employee status:', error);
      toast.error('Network error: ' + error.message);
    }
  };
  
  // Delete employee
  const deleteEmployee = async (employeeId, employeeName) => {
    if (!window.confirm(`Are you sure you want to delete ${employeeName}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('lead_crm_token');
      
      console.log('Deleting employee:', employeeId);
      
      // Optimistically remove from UI first
      setAllEmployees(prevEmployees => 
        prevEmployees.filter(emp => emp.id !== employeeId)
      );
      
      const response = await fetch(`${leadCrmApiURL}/users/${employeeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      console.log('Delete employee response:', response.status, data);
      
      if (response.ok && data.success) {
        toast.success(`Employee ${employeeName} deleted successfully`);
        // Re-fetch to ensure consistency
        await fetchAllEmployees();
      } else {
        console.error('Delete employee error:', data);
        toast.error(data.message || 'Failed to delete employee');
        // Re-fetch on error to restore the UI
        await fetchAllEmployees();
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Network error: ' + error.message);
      // Re-fetch on error to restore the UI
      await fetchAllEmployees();
    }
  };
  
  // Add new admin
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    
    if (!newAdminData.name || !newAdminData.email) {
      toast.error('Name and email are required');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newAdminData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    try {
      setIsAddingAdmin(true);
      const token = localStorage.getItem('lead_crm_token');
      
      const response = await fetch(`${leadCrmApiURL}/admin/employees`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          name: newAdminData.name,
          email: newAdminData.email,
          role: newAdminData.role,
          phone: newAdminData.mobile
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Administrator added successfully! They will receive an email to set their password.`);
        setShowAddAdminModal(false);
        setNewAdminData({ name: '', email: '', role: 'ADMIN', mobile: '' });
        // Refresh the list to show the new admin
        await fetchAllEmployees();
      } else {
        toast.error(data.message || 'Failed to add administrator');
      }
    } catch (error) {
      console.error('Error adding administrator:', error);
      toast.error('Error adding administrator');
    } finally {
      setIsAddingAdmin(false);
    }
  };
  
  // Handle edit admin
  const handleEditAdmin = (admin) => {
    setEditAdminData({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      mobile: admin.mobile || ''
    });
    setShowEditAdminModal(true);
  };

  // Update admin information
  const handleUpdateAdmin = async (e) => {
    e.preventDefault();
    
    if (!editAdminData.name || !editAdminData.email) {
      toast.error('Name and email are required');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editAdminData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    try {
      setIsEditingAdmin(true);
      const token = localStorage.getItem('lead_crm_token');
      
      const response = await fetch(`${leadCrmApiURL}/users/${editAdminData.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          name: editAdminData.name,
          email: editAdminData.email,
          mobile: editAdminData.mobile
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Administrator information updated successfully!');
        setShowEditAdminModal(false);
        setEditAdminData({
          id: null,
          name: '',
          email: '',
          mobile: ''
        });
        // Refresh the list
        await fetchAllEmployees();
      } else {
        toast.error(data.message || 'Failed to update administrator');
      }
    } catch (error) {
      console.error('Error updating administrator:', error);
      toast.error('Error updating administrator');
    } finally {
      setIsEditingAdmin(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterStatus('');
  };
  
  // Handle search and filters
  const handleSearch = (value) => {
    setSearchTerm(value);
  };
  
  const handleStatusFilter = (value) => {
    setFilterStatus(value);
  };
  
  useEffect(() => {
    if (showAdminManagement) {
      fetchAllEmployees();
    }
  }, [showAdminManagement]);
  
  // Filter employees based on search and filters (admins only)
  const filteredEmployees = allEmployees.filter(admin => {
    const matchesSearch = !searchTerm || 
      admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === '' || 
      (filterStatus === 'active' && admin.isActive) ||
      (filterStatus === 'inactive' && !admin.isActive);
    
    return matchesSearch && matchesStatus;
  });
  
  // Calculate profile completion percentage
  const calculateProfileCompletion = (user) => {
    if (!user) return 0;
    let completed = 0;
    const total = 6;
    
    if (user.name) completed++;
    if (user.email) completed++;
    if (user.mobile) completed++;
    if (user.role) completed++;
    if (user.isActive !== undefined) completed++;
    if (user.createdAt) completed++;
    
    return Math.round((completed / total) * 100);
  };
  
  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'bg-success';
    if (percentage >= 60) return 'bg-warning';
    return 'bg-danger';
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getRoleDisplayName = (role) => {
    switch(role) {
      case 'ADMIN': return 'Administrator';
      case 'TL': return 'Team Leader';
      case 'EXEC': return 'Employee';
      default: return role || 'User';
    }
  };
  
  const getActivityTypeDisplayName = (activityType) => {
    const activityNames = {
      'FILE_UPLOAD': 'File Upload',
      'FILE_SHARE': 'File Share',
      'TASK_ASSIGN': 'Task Assignment',
      'TASK_START': 'Task Started',
      'TASK_COMPLETE': 'Task Completed',
      'TASK_REVIEW': 'Task Review',
      'STATUS_UPDATE': 'Status Update',
      'COMMENT_ADD': 'Comment Added',
      'DEADLINE_CHANGE': 'Deadline Changed',
      'DEPARTMENT_CREATED': 'Department Created',
      'DEPARTMENT_DELETED': 'Department Deleted',
      'TEAM_LEADER_ASSIGNED': 'Team Leader Assigned',
      'TEAM_LEADER_REMOVED': 'Team Leader Removed',
      'USER_ACTIVATED': 'User Activated',
      'USER_DEACTIVATED': 'User Deactivated'
    };
    
    return activityNames[activityType] || activityType;
  };
  
  const getActivityTypeBadgeClass = (activityType) => {
    const badgeClasses = {
      'FILE_UPLOAD': 'bg-info',
      'FILE_SHARE': 'bg-primary',
      'TASK_ASSIGN': 'bg-warning',
      'TASK_START': 'bg-secondary',
      'TASK_COMPLETE': 'bg-success',
      'TASK_REVIEW': 'bg-info',
      'STATUS_UPDATE': 'bg-primary',
      'COMMENT_ADD': 'bg-secondary',
      'DEADLINE_CHANGE': 'bg-warning',
      'DEPARTMENT_CREATED': 'bg-success',
      'DEPARTMENT_DELETED': 'bg-danger',
      'TEAM_LEADER_ASSIGNED': 'bg-warning',
      'TEAM_LEADER_REMOVED': 'bg-danger',
      'USER_ACTIVATED': 'bg-success',
      'USER_DEACTIVATED': 'bg-danger'
    };
    
    return badgeClasses[activityType] || 'bg-secondary';
  };
  
  // Function to get badge class based on task status
  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      'pending': 'bg-secondary',
      'in-progress': 'bg-primary',
      'completed': 'bg-success',
      'cancelled': 'bg-danger',
      'review': 'bg-info',
      'assigned': 'bg-warning'
    };
    
    return statusClasses[status] || 'bg-secondary';
  };
  
  // Function to get badge class based on priority
  const getPriorityBadgeClass = (priority) => {
    const priorityClasses = {
      'LOW': 'bg-info',
      'MEDIUM': 'bg-warning',
      'HIGH': 'bg-danger',
      'URGENT': 'bg-danger'
    };
    
    return priorityClasses[priority] || 'bg-secondary';
  };
  
  // Pagination functions
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  const getPaginatedData = (data) => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return data.slice(indexOfFirstItem, indexOfLastItem);
  };
  
  const getTotalPages = (data) => {
    return Math.ceil(data.length / itemsPerPage);
  };
  
  // Render pagination controls
  const renderPagination = (data) => {
    const totalPages = getTotalPages(data);
    
    if (totalPages <= 1) return null;
    
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
    
    return (
      <nav aria-label="Page navigation">
        <ul className="pagination justify-content-center">
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => paginate(currentPage - 1)}>
              Previous
            </button>
          </li>
          {pageNumbers.map(number => (
            <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
              <button className="page-link" onClick={() => paginate(number)}>
                {number}
              </button>
            </li>
          ))}
          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => paginate(currentPage + 1)}>
              Next
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{minHeight: '60vh'}}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading profile...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-lg-6">
            <div className="card border-danger">
              <div className="card-body text-center">
                <i className="ri-error-warning-line text-danger" style={{fontSize: '3rem'}}></i>
                <h4 className="card-title text-danger mt-3">Error Loading Profile</h4>
                <p className="text-muted">{error}</p>
                <button 
                  className="btn btn-outline-primary"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!userData) {
    return (
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-lg-6">
            <div className="card">
              <div className="card-body text-center">
                <i className="ri-user-line" style={{fontSize: '3rem'}}></i>
                <h4 className="card-title mt-3">No Profile Data</h4>
                <p className="text-muted">No user data available to display.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const profileCompletion = calculateProfileCompletion(userData);
  
  return (
    <div className="main-content">
      <div className="page-content">
        <div className="container-fluid">
          <div className="profile-foreground position-relative mx-n4 mt-n4">
            <div className="profile-wid-bg">
              <img src="/assets/images/auth-one-bg.jpg" alt="" className="profile-wid-img" />
            </div>
          </div>
          
          <div className="pt-4 mb-4 mb-lg-3 pb-lg-4 profile-wrapper">
            <div className="row g-4">
              <div className="col-auto">
                <div className="avatar-lg">
                  <img 
                    src={userData.profileImage ? `${staticFilesBaseURL}/${userData.profileImage.split('?')[0]}?t=${new Date().getTime()}` : "/assets/ip.png"} 
                    alt="user-img" 
                    className="img-thumbnail rounded-circle"
                    onError={(e) => {
                      console.log("Image failed to load:", e.target.src);
                      e.target.onerror = null;
                      e.target.src = "/assets/ip.png";
                    }}
                  />
                  {isOwnProfile && (
                    <div className="avatar-xs p-0 rounded-circle profile-photo-edit" style={{position: 'absolute', bottom: '0', right: '0'}}>
                      <input 
                        id="profile-img-file-input-header" 
                        type="file" 
                        className="profile-img-file-input" 
                        accept="image/*"
                        onChange={handleProfileImageChange}
                        disabled={isUploading}
                        style={{display: 'none'}}
                      />
                      <label htmlFor="profile-img-file-input-header" className="profile-photo-edit avatar-xs">
                        <span className="avatar-title rounded-circle bg-light text-body">
                          {isUploading ? (
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          ) : (
                            <i className="ri-camera-fill" />
                          )}
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="col">
                <div className="p-2">
                  <h3 className="text-white mb-1">{userData.name || 'User'}</h3>
                  <p className="text-white text-opacity-75">{getRoleDisplayName(userData.role)}</p>
                  <div className="hstack text-white-50 gap-1">
                    <div className="me-2">
                      <i className="ri-mail-line me-1 text-white text-opacity-75 fs-16 align-middle" />
                      {userData.email || 'No email provided'}
                    </div>
                    {userData.mobile && (
                      <div>
                        <i className="ri-phone-line me-1 text-white text-opacity-75 fs-16 align-middle" />
                        {userData.mobile}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="col-12 col-lg-auto order-last order-lg-0">
                <div className="row text text-white-50 text-center">
                  <div className="col-lg-6 col-4">
                    <div className="p-2">
                      <h4 className="text-white mb-1">{profileCompletion}%</h4>
                      <p className="fs-14 mb-0">Profile Complete</p>
                    </div>
                  </div>
                  <div className="col-lg-6 col-4">
                    <div className="p-2">
                      <h4 className="text-white mb-1">
                        <span className={`badge ${userData.isActive ? 'bg-success' : 'bg-danger'}`}>
                          {userData.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </h4>
                      <p className="fs-14 mb-0">Status</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="row">
            <div className="col-lg-12">
              <div>
                <div className="d-flex profile-wrapper">
                  <ul className="nav nav-pills animation-nav profile-nav gap-2 gap-lg-3 flex-grow-1" role="tablist">
                    <li className="nav-item">
                      <a className="nav-link fs-14 active" data-bs-toggle="tab" href="#overview-tab" role="tab">
                        <i className="ri-airplay-fill d-inline-block d-md-none" /> 
                        <span className="d-none d-md-inline-block">Overview</span>
                      </a>
                    </li>
                    <li className="nav-item">
                      <a className="nav-link fs-14" data-bs-toggle="tab" href="#activities" role="tab">
                        <i className="ri-list-unordered d-inline-block d-md-none" /> 
                        <span className="d-none d-md-inline-block">Activities</span>
                      </a>
                    </li>
                    {showAdminManagement && (
                      <li className="nav-item">
                        <a className="nav-link fs-14" data-bs-toggle="tab" href="#admin-management" role="tab">
                          <i className="ri-admin-line d-inline-block d-md-none" /> 
                          <span className="d-none d-md-inline-block">Admin Management</span>
                        </a>
                      </li>
                    )}
                  </ul>
                  
                  {canEditProfile && (
                    <div className="flex-shrink-0">
                      <Link to="/UpdateProfile" className="btn btn-outline-secondary">
                        <i className="ri-edit-box-line align-bottom" /> Edit Profile
                      </Link>
                    </div>
                  )}
                </div>
                
                <div className="tab-content pt-4 text-muted">
                  <div className="tab-pane active" id="overview-tab" role="tabpanel">
                    <div className="row">
                      <div className="col-xxl-3">
                        <div className="card">
                          <div className="card-body">
                            <h5 className="card-title mb-5">Profile Completion</h5>
                            <div className="progress animated-progress custom-progress progress-label">
                              <div 
                                className={`progress-bar ${getProgressColor(profileCompletion)}`} 
                                role="progressbar" 
                                style={{width: `${profileCompletion}%`}} 
                                aria-valuenow={profileCompletion} 
                                aria-valuemin={0} 
                                aria-valuemax={100}
                              >
                                <div className="label">{profileCompletion}%</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="card">
                          <div className="card-body">
                            <h5 className="card-title mb-3">User Information</h5>
                            <div className="table-responsive">
                              <table className="table table-borderless mb-0">
                                <tbody>
                                  <tr>
                                    <th className="ps-0" scope="row">Full Name:</th>
                                    <td className="text-muted">{userData.name || 'Not provided'}</td>
                                  </tr>
                                  <tr>
                                    <th className="ps-0" scope="row">Mobile:</th>
                                    <td className="text-muted">{userData.mobile || 'Not provided'}</td>
                                  </tr>
                                  <tr>
                                    <th className="ps-0" scope="row">E-mail:</th>
                                    <td className="text-muted">{userData.email || 'Not provided'}</td>
                                  </tr>
                                  <tr>
                                    <th className="ps-0" scope="row">Role:</th>
                                    <td className="text-muted">{getRoleDisplayName(userData.role)}</td>
                                  </tr>
                                  <tr>
                                    <th className="ps-0" scope="row">Status:</th>
                                    <td className="text-muted">
                                      <span className={`badge ${userData.isActive ? 'bg-success' : 'bg-danger'}`}>
                                        {userData.isActive ? 'Active' : 'Inactive'}
                                      </span>
                                    </td>
                                  </tr>
                                  <tr>
                                    <th className="ps-0" scope="row">Joined:</th>
                                    <td className="text-muted">{formatDate(userData.createdAt)}</td>
                                  </tr>
                                  {userData.lastLogin && (
                                    <tr>
                                      <th className="ps-0" scope="row">Last Login:</th>
                                      <td className="text-muted">{formatDate(userData.lastLogin)}</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                        
                        <div className="card">
                          <div className="card-body">
                            <h5 className="card-title mb-4">Account Details</h5>
                            <div className="row">
                              <div className="col-12">
                                <div className="mb-3">
                                  <label className="form-label text-muted">User ID</label>
                                  <p className="form-control-plaintext">{userData.id}</p>
                                </div>
                              </div>
                              {userData.uuid && (
                                <div className="col-12">
                                  <div className="mb-3">
                                    <label className="form-label text-muted">UUID</label>
                                    <p className="form-control-plaintext" style={{fontSize: '0.875rem', wordBreak: 'break-all'}}>
                                      {userData.uuid}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-xxl-9">
                        <div className="card">
                          <div className="card-body">
                            <h5 className="card-title mb-3">About {userData.name || 'User'}</h5>
                            <div className="row">
                              <div className="col-md-6">
                                <div className="d-flex mt-4">
                                  <div className="flex-shrink-0 avatar-xs align-self-center me-3">
                                    <div className="avatar-title bg-light rounded-circle fs-16 text-primary">
                                      <i className="ri-user-2-fill" />
                                    </div>
                                  </div>
                                  <div className="flex-grow-1 overflow-hidden">
                                    <p className="mb-1">Role:</p>
                                    <h6 className="text-truncate mb-0">{getRoleDisplayName(userData.role)}</h6>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="col-md-6">
                                <div className="d-flex mt-4">
                                  <div className="flex-shrink-0 avatar-xs align-self-center me-3">
                                    <div className="avatar-title bg-light rounded-circle fs-16 text-primary">
                                      <i className="ri-calendar-line" />
                                    </div>
                                  </div>
                                  <div className="flex-grow-1 overflow-hidden">
                                    <p className="mb-1">Member Since:</p>
                                    <h6 className="text-truncate mb-0">{formatDate(userData.createdAt)}</h6>
                                  </div>
                                </div>
                              </div>
                              
                              {userData.mobile && (
                                <div className="col-md-6">
                                  <div className="d-flex mt-4">
                                    <div className="flex-shrink-0 avatar-xs align-self-center me-3">
                                      <div className="avatar-title bg-light rounded-circle fs-16 text-primary">
                                        <i className="ri-phone-line" />
                                      </div>
                                    </div>
                                    <div className="flex-grow-1 overflow-hidden">
                                      <p className="mb-1">Contact Number:</p>
                                      <h6 className="text-truncate mb-0">{userData.mobile}</h6>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              <div className="col-md-6">
                                <div className="d-flex mt-4">
                                  <div className="flex-shrink-0 avatar-xs align-self-center me-3">
                                    <div className="avatar-title bg-light rounded-circle fs-16 text-primary">
                                      <i className="ri-shield-check-line" />
                                    </div>
                                  </div>
                                  <div className="flex-grow-1 overflow-hidden">
                                    <p className="mb-1">Account Status:</p>
                                    <h6 className="text-truncate mb-0">
                                      <span className={`badge ${userData.isActive ? 'bg-success' : 'bg-danger'}`}>
                                        {userData.isActive ? 'Active Account' : 'Inactive Account'}
                                      </span>
                                    </h6>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Department and Manager Information for Employees and Team Leaders */}
                              {(userData.role === 'EMPL' || userData.role === 'TL') && userData.department && (
                                <div className="col-md-6">
                                  <div className="d-flex mt-4">
                                    <div className="flex-shrink-0 avatar-xs align-self-center me-3">
                                      <div className="avatar-title bg-light rounded-circle fs-16 text-primary">
                                        <i className="ri-building-line" />
                                      </div>
                                    </div>
                                    <div className="flex-grow-1 overflow-hidden">
                                      <p className="mb-1">Department:</p>
                                      <h6 className="text-truncate mb-0">{userData.department.name}</h6>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {userData.role === 'EMPL' && userData.department && userData.department.manager && (
                                <div className="col-md-6">
                                  <div className="d-flex mt-4">
                                    <div className="flex-shrink-0 avatar-xs align-self-center me-3">
                                      <div className="avatar-title bg-light rounded-circle fs-16 text-primary">
                                        <i className="ri-user-star-line" />
                                      </div>
                                    </div>
                                    <div className="flex-grow-1 overflow-hidden">
                                      <p className="mb-1">Department Manager:</p>
                                      <h6 className="text-truncate mb-0">{userData.department.manager.name}</h6>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {userData.role === 'EMPL' && userData.teamLeader && (
                                <div className="col-md-6">
                                  <div className="d-flex mt-4">
                                    <div className="flex-shrink-0 avatar-xs align-self-center me-3">
                                      <div className="avatar-title bg-light rounded-circle fs-16 text-primary">
                                        <i className="ri-user-follow-line" />
                                      </div>
                                    </div>
                                    <div className="flex-grow-1 overflow-hidden">
                                      <p className="mb-1">Assigned Team Leader:</p>
                                      <h6 className="text-truncate mb-0">{userData.teamLeader.name}</h6>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {userData.role === 'TL' && userData.department && userData.department.manager && (
                                <div className="col-md-6">
                                  <div className="d-flex mt-4">
                                    <div className="flex-shrink-0 avatar-xs align-self-center me-3">
                                      <div className="avatar-title bg-light rounded-circle fs-16 text-primary">
                                        <i className="ri-user-star-line" />
                                      </div>
                                    </div>
                                    <div className="flex-grow-1 overflow-hidden">
                                      <p className="mb-1">Department Manager:</p>
                                      <h6 className="text-truncate mb-0">{userData.department.manager.name}</h6>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="card">
                          <div className="card-header align-items-center d-flex">
                            <h4 className="card-title mb-0 me-2">Recent Activity</h4>
                          </div>
                          <div className="card-body">
                            {recentActivitiesLoading ? (
                              <div className="text-center py-4">
                                <div className="spinner-border text-primary" role="status">
                                  <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="mt-2">Loading recent activities...</p>
                              </div>
                            ) : recentActivitiesError ? (
                              <div className="text-center py-4">
                                <i className="ri-error-warning-line text-danger" style={{fontSize: '2rem'}}></i>
                                <p className="text-muted mt-2">{recentActivitiesError}</p>
                              </div>
                            ) : recentActivities.length === 0 ? (
                              <div className="text-center py-4">
                                <i className="ri-time-line text-muted" style={{fontSize: '2rem'}}></i>
                                <p className="text-muted mt-2">No recent activity to display</p>
                              </div>
                            ) : (
                              <div className="table-responsive">
                                <table className="table table-centered table-nowrap mb-0">
                                  <thead className="table-light">
                                    <tr>
                                      <th scope="col">Activity</th>
                                      <th scope="col">Description</th>
                                      <th scope="col">Date & Time</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {recentActivities.slice(0, 5).map((activity, index) => (
                                      <tr key={index}>
                                        <td>
                                          <span className={`badge ${getActivityTypeBadgeClass(activity.activity_type)}`}>
                                            {getActivityTypeDisplayName(activity.activity_type)}
                                          </span>
                                        </td>
                                        <td>
                                          <h6 className="mb-1">{activity.description}</h6>
                                          {activity.user_name && (
                                            <p className="text-muted mb-0">
                                              <i className="ri-user-line align-bottom me-1"></i>
                                              Performed by: {activity.user_name}
                                            </p>
                                          )}
                                        </td>
                                        <td>
                                          {formatDateTime(activity.created_at)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="tab-pane" id="activities" role="tabpanel">
                    <div className="card">
                      <div className="card-header align-items-center d-flex">
                        <h4 className="card-title mb-0 flex-grow-1">
                          {userData.role === 'ADMIN' && 'Admin Activities'}
                          {userData.role === 'TL' && 'Team Leader Tasks'}
                          {userData.role === 'EMPL' && 'Employee Tasks'}
                        </h4>
                      </div>
                      <div className="card-body">
                        {activitiesLoading ? (
                          <div className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2">Loading activities...</p>
                          </div>
                        ) : activitiesError ? (
                          <div className="text-center py-4">
                            <i className="ri-error-warning-line text-danger" style={{fontSize: '3rem'}}></i>
                            <h4 className="mt-3">Error Loading Activities</h4>
                            <p className="text-muted">{activitiesError}</p>
                            <button 
                              className="btn btn-outline-primary"
                              onClick={() => window.location.reload()}
                            >
                              Try Again
                            </button>
                          </div>
                        ) : (
                          <div>
                            {/* Admin Activities Section */}
                            {userData.role === 'ADMIN' && (
                              <div>
                                <h5 className="mb-3">Recent Administrative Activities</h5>
                                {adminActivities.length === 0 ? (
                                  <div className="text-center py-4">
                                    <i className="ri-time-line text-muted" style={{fontSize: '3rem'}}></i>
                                    <h4 className="mt-3">No Activities Found</h4>
                                    <p className="text-muted">No administrative activities available for this admin.</p>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="table-responsive">
                                      <table className="table table-centered table-nowrap mb-0">
                                        <thead className="table-light">
                                          <tr>
                                            <th scope="col">Activity</th>
                                            <th scope="col">Description</th>
                                            <th scope="col">Related To</th>
                                            <th scope="col">Date & Time</th>
                                            <th scope="col">Actions</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {getPaginatedData(adminActivities).map((activity, index) => (
                                            <tr key={index}>
                                              <td>
                                                <span className={`badge ${getActivityTypeBadgeClass(activity.activity_type)}`}>
                                                  {getActivityTypeDisplayName(activity.activity_type)}
                                                </span>
                                              </td>
                                              <td>
                                                <h6 className="mb-1">{activity.description}</h6>
                                                {activity.user_name && (
                                                  <p className="text-muted mb-0">
                                                    <i className="ri-user-line align-bottom me-1"></i>
                                                    Performed by: {activity.user_name}
                                                  </p>
                                                )}
                                              </td>
                                              <td>
                                                {activity.related_entity_type && activity.related_entity_id && (
                                                  <span className="badge bg-secondary">
                                                    {activity.related_entity_type}: {activity.related_entity_id}
                                                  </span>
                                                )}
                                              </td>
                                              <td>
                                                {formatDateTime(activity.created_at)}
                                              </td>
                                              <td>
                                                {activity.related_entity_type === 'TASK' && activity.related_entity_id && (
                                                  <button 
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => window.location.href = `/admin/task_Approvel/${activity.related_entity_id}`}
                                                  >
                                                    <i className="ri-eye-line me-1"></i>
                                                    View
                                                  </button>
                                                )}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                    {renderPagination(adminActivities)}
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Team Leader Tasks Section */}
                            {userData.role === 'TL' && (
                              <div>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                  <h5 className="mb-0">
                                    {tlTaskView === 'self' ? 'My Completed/Cancelled Tasks' : 'Tasks I Assigned to Team Members'}
                                  </h5>
                                  <div className="btn-group" role="group">
                                    <input
                                      type="radio"
                                      className="btn-check"
                                      name="tlTaskView"
                                      id="selfTasks"
                                      checked={tlTaskView === 'self'}
                                      onChange={() => setTlTaskView('self')}
                                    />
                                    <label className="btn btn-outline-primary" htmlFor="selfTasks">
                                      My Tasks
                                    </label>
                                    <input
                                      type="radio"
                                      className="btn-check"
                                      name="tlTaskView"
                                      id="assignedTasks"
                                      checked={tlTaskView === 'assigned'}
                                      onChange={() => setTlTaskView('assigned')}
                                    />
                                    <label className="btn btn-outline-primary" htmlFor="assignedTasks">
                                      Assigned Tasks
                                    </label>
                                  </div>
                                </div>
                                
                                {tlTaskView === 'self' ? (
                                  <div>
                                    {tlTasks.length === 0 ? (
                                      <div className="text-center py-4">
                                        <i className="ri-time-line text-muted" style={{fontSize: '2rem'}}></i>
                                        <h4 className="mt-3">No Tasks Found</h4>
                                        <p className="text-muted">No completed or cancelled tasks available for this team leader.</p>
                                      </div>
                                    ) : (
                                      <div>
                                        {/* Search bar for TL self tasks */}
                                        <div className="row mb-3">
                                          <div className="col-lg-6">
                                            <div className="search-box position-relative">
                                              <input
                                                type="text"
                                                className="form-control ps-5"
                                                placeholder="Search tasks by title, description, assigner, or status..."
                                                value={tlSelfTaskSearch}
                                                onChange={(e) => setTlSelfTaskSearch(e.target.value)}
                                              />
                                              <i className="ri-search-line position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                                            </div>
                                          </div>
                                          <div className="col-lg-6 d-flex align-items-center">
                                            <span className="text-muted">
                                              Showing {getPaginatedData(filteredTlSelfTasks).length} of {filteredTlSelfTasks.length} tasks
                                            </span>
                                          </div>
                                        </div>
                                        
                                        <div className="table-responsive">
                                          <table className="table table-centered table-nowrap mb-0">
                                            <thead className="table-light">
                                              <tr>
                                                <th scope="col">Task ID</th>
                                                <th scope="col">Title</th>
                                                <th scope="col">Description</th>
                                                <th scope="col">Assigned By</th>
                                                <th scope="col">Status</th>
                                                <th scope="col">Priority</th>
                                                <th scope="col">Deadline</th>
                                                <th scope="col">Actions</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {getPaginatedData(filteredTlSelfTasks).map((task) => (
                                                <tr key={task.id}>
                                                  <td>
                                                    <span className="fw-bold">#{task.id}</span>
                                                  </td>
                                                  <td>
                                                    <h6 className="mb-0">{task.title}</h6>
                                                  </td>
                                                  <td>
                                                    {task.description ? task.description.substring(0, 50) + '...' : 'N/A'}
                                                  </td>
                                                  <td>
                                                    {task.created_by_name || 'N/A'}
                                                  </td>
                                                  <td>
                                                    <span className={`badge ${getStatusBadgeClass(task.status)}`}>
                                                      {task.status}
                                                    </span>
                                                  </td>
                                                  <td>
                                                    <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>
                                                      {task.priority}
                                                    </span>
                                                  </td>
                                                  <td>
                                                    {formatDate(task.due_date)}
                                                  </td>
                                                  <td>
                                                    <button 
                                                      className="btn btn-sm btn-outline-primary"
                                                      onClick={() => window.location.href = `/team-leader/task-review/${task.id}`}
                                                    >
                                                      <i className="ri-eye-line me-1"></i>
                                                      View
                                                    </button>
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                        {renderPagination(filteredTlSelfTasks)}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div>
                                    {tlAssignedTasks.length === 0 ? (
                                      <div className="text-center py-4">
                                        <i className="ri-time-line text-muted" style={{fontSize: '2rem'}}></i>
                                        <p className="text-muted mt-2">No assigned tasks found</p>
                                      </div>
                                    ) : (
                                      <div>
                                        {/* Search bar for TL assigned tasks */}
                                        <div className="row mb-3">
                                          <div className="col-lg-6">
                                            <div className="search-box position-relative">
                                              <input
                                                type="text"
                                                className="form-control ps-5"
                                                placeholder="Search tasks by title, description, assignee, main task, or status..."
                                                value={tlAssignedTaskSearch}
                                                onChange={(e) => setTlAssignedTaskSearch(e.target.value)}
                                              />
                                              <i className="ri-search-line position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                                            </div>
                                          </div>
                                          <div className="col-lg-6 d-flex align-items-center">
                                            <span className="text-muted">
                                              Showing {getPaginatedData(filteredTlAssignedTasks).length} of {filteredTlAssignedTasks.length} tasks
                                            </span>
                                          </div>
                                        </div>
                                        
                                        <div className="table-responsive">
                                          <table className="table table-centered table-nowrap mb-0">
                                            <thead className="table-light">
                                              <tr>
                                                <th scope="col">Task ID</th>
                                                <th scope="col">Title</th>
                                                <th scope="col">Main Task</th>
                                                <th scope="col">Assigned To</th>
                                                <th scope="col">Status</th>
                                                <th scope="col">Priority</th>
                                                <th scope="col">Created Date</th>
                                                <th scope="col">Actions</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {getPaginatedData(filteredTlAssignedTasks).map((task) => (
                                                <tr key={task.id}>
                                                  <td>
                                                    <span className="fw-bold">#{task.id}</span>
                                                  </td>
                                                  <td>
                                                    <h6 className="mb-0">{task.title}</h6>
                                                    {task.description && (
                                                      <p className="text-muted mb-0 small">{task.description.substring(0, 50)}...</p>
                                                    )}
                                                  </td>
                                                  <td>
                                                    {task.parent_task_id ? (
                                                      <span>{task.parent_task_title || `Task #${task.parent_task_id}`}</span>
                                                    ) : (
                                                      <span>Main Task</span>
                                                    )}
                                                  </td>
                                                  <td>
                                                    {task.assigned_to_name || 'N/A'}
                                                  </td>
                                                  <td>
                                                    <span className={`badge ${getStatusBadgeClass(task.status)}`}>
                                                      {task.status}
                                                    </span>
                                                  </td>
                                                  <td>
                                                    <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>
                                                      {task.priority}
                                                    </span>
                                                  </td>
                                                  <td>
                                                    {formatDate(task.created_at)}
                                                  </td>
                                                  <td>
                                                    <button 
                                                      className="btn btn-sm btn-outline-primary"
                                                      onClick={() => window.location.href = `/team-leader/task-review/${task.id}`}
                                                    >
                                                      <i className="ri-eye-line me-1"></i>
                                                      View
                                                    </button>
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                        {renderPagination(filteredTlAssignedTasks)}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Employee Tasks Section */}
                            {userData.role === 'EMPL' && (
                              <div>
                                <h5 className="mb-3">Completed/Cancelled Tasks</h5>
                                {employeeTasks.length === 0 ? (
                                  <div className="text-center py-4">
                                    <i className="ri-time-line text-muted" style={{fontSize: '3rem'}}></i>
                                    <h4 className="mt-3">No Tasks Found</h4>
                                    <p className="text-muted">No completed or cancelled tasks available for this employee.</p>
                                  </div>
                                ) : (
                                  <div>
                                    {/* Search bar for employee tasks */}
                                    <div className="row mb-3">
                                      <div className="col-lg-6">
                                        <div className="search-box position-relative">
                                          <input
                                            type="text"
                                            className="form-control ps-5"
                                            placeholder="Search tasks by title, description, assigner, main task, or status..."
                                            value={employeeTaskSearch}
                                            onChange={(e) => setEmployeeTaskSearch(e.target.value)}
                                          />
                                          <i className="ri-search-line position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                                        </div>
                                      </div>
                                      <div className="col-lg-6 d-flex align-items-center">
                                        <span className="text-muted">
                                          Showing {getPaginatedData(filteredEmployeeTasks).length} of {filteredEmployeeTasks.length} tasks
                                        </span>
                                      </div>
                                    </div>
                                    
                                    <div className="table-responsive">
                                      <table className="table table-centered table-nowrap mb-0">
                                        <thead className="table-light">
                                          <tr>
                                            <th scope="col">Task ID</th>
                                            <th scope="col">Title</th>
                                            <th scope="col">Main Task</th>
                                            <th scope="col">Description</th>
                                            <th scope="col">Status</th>
                                            <th scope="col">Priority</th>
                                            <th scope="col">Deadline</th>
                                            <th scope="col">Assigned By</th>
                                            <th scope="col">Actions</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {getPaginatedData(filteredEmployeeTasks).map((task) => (
                                            <tr key={task.id}>
                                              <td>
                                                <span className="fw-bold">#{task.id}</span>
                                              </td>
                                              <td>
                                                <h6 className="mb-0">{task.title}</h6>
                                              </td>
                                              <td>
                                                {task.parent_task_id ? (
                                                  <span>{task.parent_task_title || `Task #${task.parent_task_id}`}</span>
                                                ) : (
                                                  <span>Main Task</span>
                                                )}
                                              </td>
                                              <td>
                                                {task.description ? task.description.substring(0, 30) + '...' : 'N/A'}
                                              </td>
                                              <td>
                                                <span className={`badge ${getStatusBadgeClass(task.status)}`}>
                                                  {task.status}
                                                </span>
                                              </td>
                                              <td>
                                                <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>
                                                  {task.priority}
                                                </span>
                                              </td>
                                              <td>
                                                {formatDate(task.due_date)}
                                              </td>
                                              <td>
                                                {task.created_by_name || 'N/A'}
                                              </td>
                                              <td>
                                                {currentUser?.role === 'ADMIN' ? (
                                                  <button 
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => window.location.href = `/admin/task_Approvel/${task.id}`}
                                                  >
                                                    <i className="ri-eye-line me-1"></i>
                                                    View
                                                  </button>
                                                ) : currentUser?.role === 'TL' ? (
                                                  <button 
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => window.location.href = `/team-leader/task-review/${task.id}`}
                                                  >
                                                    <i className="ri-eye-line me-1"></i>
                                                    View
                                                  </button>
                                                ) : (
                                                  <button 
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => window.location.href = `/employee/task/${task.id}`}
                                                  >
                                                    <i className="ri-eye-line me-1"></i>
                                                    View
                                                  </button>
                                                )}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                    {renderPagination(filteredEmployeeTasks)}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {showAdminManagement && (
                    <div className="tab-pane" id="admin-management" role="tabpanel">
                      <div className="row">
                        <div className="col-lg-12">
                          <div className="card">
                            <div className="card-header align-items-center d-flex">
                              <h4 className="card-title mb-0 flex-grow-1">Administrator Management</h4>
                              <button 
                                className="btn btn-outline-primary"
                                onClick={() => setShowAddAdminModal(true)}
                              >
                                <i className="ri-user-add-line align-bottom me-1"></i>
                                Add New Admin
                              </button>
                            </div>
                            <div className="card-body">
                              <div className="row mb-3">
                                <div className="col-lg-12">
                                  <div className="alert alert-info" role="alert">
                                    <i className="ri-information-line me-2"></i>
                                    <strong>Administrator Management:</strong> Manage system administrators, activate/deactivate accounts, and edit administrator information.
                                  </div>
                                </div>
                              </div>
                              
                              {/* Search Controls */}
                              <div className="row mb-4">
                                <div className="col-lg-6">
                                  <div className="search-box position-relative">
                                    <input
                                      type="text"
                                      className="form-control ps-5"
                                      placeholder="Search administrators by name or email..."
                                      value={searchTerm}
                                      onChange={(e) => handleSearch(e.target.value)}
                                    />
                                    <i className="ri-search-line position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                                  </div>
                                </div>
                                <div className="col-lg-3">
                                  <select
                                    className="form-select"
                                    value={filterStatus}
                                    onChange={(e) => handleStatusFilter(e.target.value)}
                                  >
                                    <option value="">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                  </select>
                                </div>
                                <div className="col-lg-3">
                                  <button
                                    className="btn btn-soft-primary w-100"
                                    onClick={() => fetchAllEmployees()}
                                    disabled={employeesLoading}
                                    title="Refresh administrator list"
                                  >
                                    <i className="ri-refresh-line me-1"></i>
                                    Refresh
                                  </button>
                                </div>
                              </div>
                              
                              {/* Filter Results Summary */}
                              <div className="row mb-3">
                                <div className="col-lg-12">
                                  <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                      <span className="text-muted">
                                        Showing {filteredEmployees.length} of {allEmployees.length} administrators
                                      </span>
                                      {(searchTerm || filterStatus) && (
                                        <span className="ms-2">
                                          <span className="badge bg-light text-dark">
                                            <i className="ri-filter-3-line me-1"></i>
                                            Filtered
                                          </span>
                                        </span>
                                      )}
                                    </div>
                                    {(searchTerm || filterStatus) && (
                                      <button
                                        className="btn btn-sm btn-outline-warning"
                                        onClick={resetFilters}
                                      >
                                        <i className="ri-close-line me-1"></i>
                                        Clear Filters
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {employeesLoading ? (
                                <div className="text-center py-4">
                                  <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                  </div>
                                  <p className="mt-2">Loading administrators...</p>
                                </div>
                              ) : employeesError ? (
                                <div className="text-center py-4">
                                  <i className="ri-error-warning-line text-danger" style={{fontSize: '3rem'}}></i>
                                  <h4 className="mt-3">Error Loading Administrators</h4>
                                  <p className="text-muted">{employeesError}</p>
                                  <button 
                                    className="btn btn-outline-primary"
                                    onClick={() => fetchAllEmployees()}
                                  >
                                    Try Again
                                  </button>
                                </div>
                              ) : (
                                <div className="table-responsive">
                                  <table className="table table-centered table-nowrap mb-0">
                                    <thead className="table-light">
                                      <tr>
                                        <th scope="col">Administrator</th>
                                        <th scope="col">Email</th>
                                        <th scope="col">Mobile</th>
                                        <th scope="col">Status</th>
                                        <th scope="col">Password Set</th>
                                        <th scope="col">Joined</th>
                                        <th scope="col">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {filteredEmployees.length === 0 ? (
                                        <tr>
                                          <td colSpan="7" className="text-center py-4">
                                            <i className="ri-user-line text-muted" style={{fontSize: '2rem'}}></i>
                                            <p className="text-muted mt-2">
                                              {allEmployees.length === 0 ? 'No administrators found' : 'No administrators match the current filters'}
                                            </p>
                                            {allEmployees.length > 0 && (searchTerm || filterStatus) && (
                                              <button className="btn btn-sm btn-outline-primary" onClick={resetFilters}>
                                                <i className="ri-refresh-line me-1"></i>
                                                Clear Filters
                                              </button>
                                            )}
                                          </td>
                                        </tr>
                                      ) : (
                                        filteredEmployees.map((admin) => (
                                          <tr key={admin.id}>
                                            <td>
                                              <div className="d-flex align-items-center">
                                                <div className="avatar-xs me-3">
                                                  <div className="avatar-title rounded-circle bg-light text-primary">
                                                    {admin.name.charAt(0).toUpperCase()}
                                                  </div>
                                                </div>
                                                <div>
                                                  <h6 className="mb-0">{admin.name}</h6>
                                                </div>
                                              </div>
                                            </td>
                                            <td>{admin.email}</td>
                                            <td>{admin.mobile || 'Not provided'}</td>
                                            <td>
                                              <span className={`badge ${admin.isActive ? 'bg-success' : 'bg-danger'}`}>
                                                {admin.isActive ? 'Active' : 'Inactive'}
                                              </span>
                                            </td>
                                            <td>
                                              <span className={`badge ${admin.passwordSet ? 'bg-success' : 'bg-warning'}`}>
                                                {admin.passwordSet ? 'Yes' : 'Pending'}
                                              </span>
                                            </td>
                                            <td>{formatDate(admin.createdAt)}</td>
                                            <td>
                                              <div className="d-flex gap-2">
                                                <button
                                                  className={`btn btn-sm ${admin.isActive ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                                  onClick={() => toggleEmployeeStatus(admin.id, admin.isActive)}
                                                  title={admin.isActive ? 'Deactivate Administrator' : 'Activate Administrator'}
                                                  disabled={employeesLoading}
                                                >
                                                  <i className={`ri-${admin.isActive ? 'pause' : 'play'}-circle-line`}></i>
                                                  {admin.isActive ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button
                                                  className="btn btn-sm btn-outline-info"
                                                  onClick={() => handleEditAdmin(admin)}
                                                  title="Edit Administrator Information"
                                                  disabled={employeesLoading}
                                                >
                                                  <i className="ri-edit-line"></i>
                                                  Edit
                                                </button>
                                                <button
                                                  className="btn btn-sm btn-outline-danger"
                                                  onClick={() => deleteEmployee(admin.id, admin.name)}
                                                  title="Delete Administrator Permanently"
                                                  disabled={employeesLoading}
                                                >
                                                  <i className="ri-delete-bin-line"></i>
                                                  Delete
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                        ))
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add New Admin Modal */}
      {showAddAdminModal && (
        <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}} role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="ri-user-add-line me-2"></i>
                  Add New Administrator
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowAddAdminModal(false)}
                  disabled={isAddingAdmin}
                ></button>
              </div>
              <form onSubmit={handleAddAdmin}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Full Name <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          value={newAdminData.name}
                          onChange={(e) => setNewAdminData({...newAdminData, name: e.target.value})}
                          placeholder="Enter full name"
                          required
                          disabled={isAddingAdmin}
                        />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Email Address <span className="text-danger">*</span></label>
                        <input
                          type="email"
                          className="form-control"
                          value={newAdminData.email}
                          onChange={(e) => setNewAdminData({...newAdminData, email: e.target.value})}
                          placeholder="Enter email address"
                          required
                          disabled={isAddingAdmin}
                        />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Mobile Number</label>
                        <input
                          type="tel"
                          className="form-control"
                          value={newAdminData.mobile}
                          onChange={(e) => setNewAdminData({...newAdminData, mobile: e.target.value})}
                          placeholder="Enter mobile number"
                          disabled={isAddingAdmin}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="alert alert-info" role="alert">
                    <i className="ri-information-line me-2"></i>
                    <strong>Note:</strong> The new administrator will receive an email to set their password through the login page.
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary" 
                    onClick={() => setShowAddAdminModal(false)}
                    disabled={isAddingAdmin}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-outline-primary"
                    disabled={isAddingAdmin}
                  >
                    {isAddingAdmin ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Adding...
                      </>
                    ) : (
                      <>
                        <i className="ri-user-add-line me-1"></i>
                        Add Administrator
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Admin Modal */}
      {showEditAdminModal && (
        <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}} role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="ri-edit-line me-2"></i>
                  Edit Administrator
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowEditAdminModal(false)}
                  disabled={isEditingAdmin}
                ></button>
              </div>
              <form onSubmit={handleUpdateAdmin}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Full Name <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          value={editAdminData.name}
                          onChange={(e) => setEditAdminData({...editAdminData, name: e.target.value})}
                          placeholder="Enter full name"
                          required
                          disabled={isEditingAdmin}
                        />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Email Address <span className="text-danger">*</span></label>
                        <input
                          type="email"
                          className="form-control"
                          value={editAdminData.email}
                          onChange={(e) => setEditAdminData({...editAdminData, email: e.target.value})}
                          placeholder="Enter email address"
                          required
                          disabled={isEditingAdmin}
                        />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Mobile Number</label>
                        <input
                          type="tel"
                          className="form-control"
                          value={editAdminData.mobile}
                          onChange={(e) => setEditAdminData({...editAdminData, mobile: e.target.value})}
                          placeholder="Enter mobile number"
                          disabled={isEditingAdmin}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary" 
                    onClick={() => setShowEditAdminModal(false)}
                    disabled={isEditingAdmin}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-outline-primary"
                    disabled={isEditingAdmin}
                  >
                    {isEditingAdmin ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Updating...
                      </>
                    ) : (
                      <>
                        <i className="ri-save-line me-1"></i>
                        Update Administrator
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;