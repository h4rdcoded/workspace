import { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../Context/ConfigContext';

// Custom hook for permission management
export const usePermissions = () => {
    const { 
        leadCrmUser, 
        isLeadCrmAuthenticated, 
        leadCrmApiURL, 
        hasPermission: contextHasPermission,
        userRole 
    } = useContext(ConfigContext) || {};
    const [userPermissions, setUserPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDepartmentManager, setIsDepartmentManager] = useState(false);

    // Removed debug logging for performance

    useEffect(() => {
        const fetchUserPermissions = async () => {
            if (!isLeadCrmAuthenticated || !leadCrmUser?.id) {
                setUserPermissions([]);
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${leadCrmApiURL}/permissions/user/${leadCrmUser.id}`, {
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        // The API returns permissions in data.permissions array
                        const permissions = data.data?.permissions || data.data || [];
                        setUserPermissions(permissions);
                    }
                }
            } catch (error) {
                console.error('Error fetching user permissions:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserPermissions();
    }, [leadCrmUser?.id, isLeadCrmAuthenticated, leadCrmApiURL]);

    // Check if user is a department manager
    useEffect(() => {
        const checkDepartmentManagerStatus = async () => {
            // Only check for TL users
            if (!isLeadCrmAuthenticated || !leadCrmUser?.id || (leadCrmUser?.role !== 'TL')) {
                setIsDepartmentManager(false);
                return;
            }

            try {
                // Check if user is assigned as a department manager
                const response = await fetch(`${leadCrmApiURL}/departments`, {
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data) {
                        // Check if any department has this user as manager_id
                        const isManager = data.data.some(dept => dept.manager_id === leadCrmUser.id);
                        setIsDepartmentManager(isManager);
                    }
                }
            } catch (error) {
                console.error('Error checking department manager status:', error);
                setIsDepartmentManager(false);
            }
        };

        checkDepartmentManagerStatus();
    }, [leadCrmUser?.id, isLeadCrmAuthenticated, leadCrmApiURL, leadCrmUser?.role]);

    // Check if user has a specific permission
    const hasPermission = (permission) => {
        // Admin users have all permissions
        if ((leadCrmUser?.role === 'ADMIN' || userRole === 'ADMIN')) {
            return true;
        }
        
        // Team Leaders have manage_team permission by default
        if ((leadCrmUser?.role === 'TL' || userRole === 'TL') && permission === 'manage_team') {
            return true;
        }
        
        // Use the context's hasPermission method if available, otherwise check userPermissions
        if (contextHasPermission) {
            return contextHasPermission(permission);
        }
        
        // Check in userPermissions array - the API returns permissions with 'name' property
        return userPermissions.some(p => p.name === permission);
    };

    const hasAnyPermission = (permissions) => {
        return permissions.some(permission => hasPermission(permission));
    };

    const canAccessNavigation = (navItem) => {
        // Special case for Team Leader Navigation - TL users should have access to their own navigation
        if (navItem.id === 'team-leader-nav' && (leadCrmUser?.role === 'TL' || userRole === 'TL')) {
            return true;
        }
        
        if (!navItem.permissions || navItem.permissions.length === 0) {
            return true; // No permissions required
        }
        return hasAnyPermission(navItem.permissions);
    };

    return {
        userPermissions,
        loading,
        hasPermission,
        hasAnyPermission,
        canAccessNavigation,
        isDepartmentManager, // Export the department manager status
        userRole: leadCrmUser?.role || userRole // Use leadCrmUser.role if available, fallback to context userRole
    };
};

// Navigation configuration with permissions
export const navigationConfig = [
    {
        id: 'dashboard',
        title: 'Dashboard',
        icon: 'ri-dashboard-line',
        path: '/dashboard',
        permissions: [] // No specific permissions required
    },
    {
        id: 'employee-management',
        title: 'Employee Management',
        icon: 'ri-user-2-line',
        permissions: ['manage_employees', 'view_all_users'],
        children: [
            {
                id: 'add-employee',
                title: 'Add TL/Executive',
                icon: 'ri-user-add-line',
                path: '/AddEmployee',
                permissions: ['manage_employees']
            },
            {
                id: 'department-management',
                title: 'Department Management',
                icon: 'ri-building-line',
                path: '/DepartmentManagement',
                permissions: ['manage_departments']
            },
            {
                id: 'team-assignment',
                title: 'Team Assignment',
                icon: 'ri-team-line',
                path: '/TeamAssignment',
                permissions: ['manage_teams']
            },
            {
                id: 'employee-performance',
                title: 'Employee Performance',
                icon: 'ri-bar-chart-line',
                path: '/admin/employee-performance',
                permissions: ['view_employee_performance']
            }
        ]
    },
    {
        id: 'file-management',
        title: 'File Records',
        icon: 'ri-file-list-3-line',
        path: '/admin/file-management',
        permissions: ['manage_files']
    },
    {
        id: 'meta-leads',
        title: 'Meta Ads Leads',
        icon: 'ri-facebook-circle-fill',
        path: '/admin/meta-leads',
        permissions: ['manage_leads']
    },
    {
        id: 'meta-leads-dashboard',
        title: 'Meta Leads Dashboard',
        icon: 'ri-dashboard-line',
        path: '/admin/meta-leads-dashboard',
        permissions: ['view_leads_dashboard']
    },
    {
        id: 'meta-leads-management',
        title: 'Meta Leads Management',
        icon: 'ri-settings-3-line',
        path: '/admin/meta-leads-management',
        permissions: ['manage_leads']
    },
    {
        id: 'team-leader-nav',
        title: 'Team Leader Navigation',
        permissions: ['manage_team'],
        children: [
            {
                id: 'my-team',
                title: 'My Team',
                icon: 'ri-team-line',
                path: '/MyTeam',
                permissions: ['manage_team']
            },
          
            {
                id: 'assigned-tasks',
                title: 'Assigned Tasks',
                icon: 'ri-task-line',
                path: '/team-leader/assigned-tasks',
                permissions: ['view_assigned_tasks']
            },
            {
                id: 'tl-meta-leads',
                title: 'TL Meta Leads',
                icon: 'ri-team-line',
                path: '/tl/meta-leads',
                permissions: ['manage_team_leads']
            }
        ]
    },
    {
        id: 'executive-nav',
        title: 'Executive Navigation',
        permissions: ['view_assigned_tasks'],
        children: [
            {
                id: 'my-team-info',
                title: 'My Team',
                icon: 'ri-team-line',
                path: '/MyTeamInfo',
                permissions: ['view_team_info']
            },
            {
                id: 'assigned-tasks',
                title: 'Assigned Tasks',
                icon: 'ri-contacts-line',
                path: '/TodaysAssignedTasks',
                permissions: ['view_assigned_tasks']
            },
            {
                id: 'exec-meta-leads',
                title: 'Exec Meta Leads',
                icon: 'ri-user-star-line',
                path: '/exec/meta-leads',
                permissions: ['view_assigned_leads']
            }
        ]
    },
    {
        id: 'common-nav',
        title: 'Common Navigation',
        permissions: [], // Available to all authenticated users
        children: [
            {
                id: 'team-chat',
                title: 'Team Chat',
                icon: 'ri-message-3-line',
                path: '/chat',
                permissions: []
            },
            {
                id: 'user-profile',
                title: 'Profile',
                icon: 'ri-user-settings-line',
                path: '/UserProfile',
                permissions: []
            }
        ]
    }
];

export default usePermissions;