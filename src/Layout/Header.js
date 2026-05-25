import React, { useState, useEffect } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { ConfigContext } from "../Context/ConfigContext";
import { buildApiUrl, getAuthHeaders } from "../config/api";

const Header = () => {
  const { leadCrmUser, isLeadCrmAuthenticated, staticFilesBaseURL } = useContext(ConfigContext) || {};
  const navigate = useNavigate();
  
  // Check user role for navigation access - prioritize leadCrmUser.role if available
  const userRole = leadCrmUser?.role || localStorage.getItem("user_role");
  const isAdmin = userRole === 'ADMIN';
  const isTeamLeader = userRole === 'TL';
  const isExecutive = userRole === 'EMPL';
  const isQaTester = userRole === 'QA_TESTER';
  
  // Removed debug logging for performance

  // State for department manager status
  const [isDepartmentManager, setIsDepartmentManager] = useState(false);
  const [departmentId, setDepartmentId] = useState(null);

  // Chat notifications state
  const [chatNotifications, setChatNotifications] = useState([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  
  // Task notifications state
  const [taskNotifications, setTaskNotifications] = useState([]);
  const [unreadTaskCount, setUnreadTaskCount] = useState(0);
  
  // Search functionality state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  
  // Welcome modal state
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [userDepartment, setUserDepartment] = useState(null);
  const [userDesignation, setUserDesignation] = useState(null);
  const [userJoiningDate, setUserJoiningDate] = useState(null);
  
  // Flash message state
  const [flashMessages, setFlashMessages] = useState([]);
  const [showFlashModal, setShowFlashModal] = useState(false);
  const [selectedFlashMessage, setSelectedFlashMessage] = useState(null);
  
  // Check if team leader is also a department manager
  useEffect(() => {
    const checkDepartmentManagerStatus = async () => {
      // Only check for TL users
      if (!isLeadCrmAuthenticated || !leadCrmUser?.id || userRole !== 'TL') {
        setIsDepartmentManager(false);
        setDepartmentId(null);
        return;
      }

      try {
        // Check if user is assigned as a department manager
        const response = await fetch(buildApiUrl('/departments'), {
          credentials: 'include',
          headers: getAuthHeaders()
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            // Check if any department has this user as manager_id
            const department = data.data.find(dept => {
              return dept.manager_id === leadCrmUser.id;
            });
            
            if (department) {
              setIsDepartmentManager(true);
              setDepartmentId(department.id);
            } else {
              setIsDepartmentManager(false);
              setDepartmentId(null);
            }
          } else {
            setIsDepartmentManager(false);
            setDepartmentId(null);
          }
        } else {
          setIsDepartmentManager(false);
          setDepartmentId(null);
        }
      } catch (error) {
        setIsDepartmentManager(false);
        setDepartmentId(null);
      }
    };

    checkDepartmentManagerStatus();
  }, [leadCrmUser?.id, isLeadCrmAuthenticated, userRole]);

  // Fetch user department and designation info when component mounts or user changes
  useEffect(() => {
    // Fetch user department and designation info
    const fetchUserInfo = async () => {
      if (!leadCrmUser?.id) return;
      
      try {
        const response = await fetch(buildApiUrl(`/users/${leadCrmUser.id}`), {
          credentials: 'include',
          headers: getAuthHeaders()
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.user) {
            const user = data.data.user;
            setUserDepartment(user.department_name || 'Not Assigned');
            setUserDesignation(user.designation_title || 'Not Assigned');
            setUserJoiningDate(user.joining_date || user.created_at || null);
          } else {
            // Fallback to defaults
            setUserDepartment('Not Assigned');
            setUserDesignation('Not Assigned');
            setUserJoiningDate(leadCrmUser?.created_at || null);
          }
        } else {
          // Set defaults if fetch fails
          setUserDepartment('Not Assigned');
          setUserDesignation('Not Assigned');
          setUserJoiningDate(leadCrmUser?.created_at || null);
        }
      } catch (error) {
        // Silently handle errors - set defaults if fetch fails
        setUserDepartment('Not Assigned');
        setUserDesignation('Not Assigned');
        setUserJoiningDate(leadCrmUser?.created_at || null);
      }
    };

    if (isLeadCrmAuthenticated && leadCrmUser?.id) {
      fetchUserInfo();
    }
  }, [leadCrmUser?.id, isLeadCrmAuthenticated, leadCrmUser?.created_at]);

  // Helper function to convert hex to rgba
  const hexToRgba = (hex, alpha = 1) => {
    if (!hex) return `rgba(0, 0, 0, ${alpha})`;
    
    // If it's already rgba, return as is
    if (hex.startsWith('rgba') || hex.startsWith('rgb')) {
      return hex;
    }
    
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Handle shorthand hex (e.g., #f00)
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Helper function to format flash message content with proper HTML
  const formatFlashMessageContent = (content) => {
    if (!content) return '';
    
    // First, escape HTML to prevent XSS
    let escapedContent = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    
    // Convert markdown-style bullet points to HTML lists
    // Handle both * and - as bullet points
    let formattedContent = escapedContent
      .replace(/^\s*[*-]\s+(.*)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');
    
    // Handle multiple lists
    formattedContent = formattedContent.replace(/<\/ul>(\s*<ul>)+/g, '</ul><ul>');
    
    // Convert double newlines to paragraphs
    formattedContent = formattedContent
      .split('\n\n')
      .map(paragraph => {
        // If paragraph contains list items, don't wrap in p tags
        if (paragraph.includes('<li>')) {
          return paragraph;
        }
        // Regular paragraph
        return `<p>${paragraph}</p>`;
      })
      .join('');
    
    // Handle single newlines within paragraphs
    formattedContent = formattedContent.replace(/\n/g, '<br>');
    
    // Handle bold text (markdown style)
    formattedContent = formattedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Handle italic text (markdown style)
    formattedContent = formattedContent.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    return formattedContent;
  };
  useEffect(() => {
    const fetchFlashMessages = async () => {
      try {
        const response = await fetch(buildApiUrl('/flash-updates/active'), {
          credentials: 'include',
          headers: getAuthHeaders()
        });
        
        const data = await response.json();
        if (data.success && data.data) {
          // Ensure all customization fields have default values
          const processedData = data.data.map(msg => ({
            ...msg,
            animation_style: msg.animation_style || 'flashGlow',
            text_color: msg.text_color || '#0d6efd',
            background_color: msg.background_color && msg.background_color !== 'null' && msg.background_color !== '' && msg.background_color !== 'undefined' ? msg.background_color : 'transparent',
            font_family: msg.font_family && msg.font_family !== 'null' && msg.font_family !== '' && msg.font_family !== 'undefined' ? msg.font_family : 'inherit',
            font_size: msg.font_size || '0.8rem',
            font_weight: msg.font_weight || '600'
          }));
          setFlashMessages(processedData);
        }
      } catch (error) {
        // Silently handle errors
      }
    };

    if (isLeadCrmAuthenticated) {
      fetchFlashMessages();
      
      // Refresh flash messages every 30 minutes
      const interval = setInterval(fetchFlashMessages, 30 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [isLeadCrmAuthenticated]);

  // Inject keyframe animations for all flash messages
  useEffect(() => {
    const styleId = 'flash-messages-keyframes';
    let styleElement = document.getElementById(styleId);
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    if (flashMessages.length === 0) {
      styleElement.textContent = '';
      return;
    }
    
    const allKeyframes = flashMessages.map((flashMsg) => {
      const textColor = flashMsg.text_color || '#0d6efd';
      const textColorRgba50 = hexToRgba(textColor, 0.5);
      const textColorRgba80 = hexToRgba(textColor, 0.8);
      
      return `
        @keyframes flashGlow-${flashMsg.id} {
          0%, 100% {
            text-shadow: 0 0 5px ${textColorRgba50}, 0 0 10px ${textColorRgba50};
          }
          50% {
            text-shadow: 0 0 10px ${textColorRgba80}, 0 0 20px ${textColorRgba50}, 0 0 30px ${textColorRgba50};
          }
        }
        @keyframes flashBounce-${flashMsg.id} {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes flashShake-${flashMsg.id} {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }
        @keyframes flashFade-${flashMsg.id} {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes flashSlide-${flashMsg.id} {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }
        @keyframes flashScale-${flashMsg.id} {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes flashRotate-${flashMsg.id} {
          0% { transform: rotate(0deg) scale(1); filter: hue-rotate(0deg); }
          50% { transform: rotate(5deg) scale(1.05); filter: hue-rotate(90deg); }
          100% { transform: rotate(0deg) scale(1); filter: hue-rotate(0deg); }
        }
        @keyframes flashNeon-${flashMsg.id} {
          0%, 100% {
            text-shadow: 0 0 5px ${textColor}, 0 0 10px ${textColor}, 0 0 15px ${textColor};
            filter: brightness(1);
          }
          50% {
            text-shadow: 0 0 10px ${textColor}, 0 0 20px ${textColor}, 0 0 30px ${textColor}, 0 0 40px ${textColor};
            filter: brightness(1.5);
          }
        }
        @keyframes flashWave-${flashMsg.id} {
          0%, 100% { transform: translateY(0) scaleY(1); }
          25% { transform: translateY(-3px) scaleY(1.05); }
          50% { transform: translateY(0) scaleY(1); }
          75% { transform: translateY(3px) scaleY(0.95); }
        }
        @keyframes flashRainbow-${flashMsg.id} {
          0% { filter: hue-rotate(0deg); }
          25% { filter: hue-rotate(90deg); }
          50% { filter: hue-rotate(180deg); }
          75% { filter: hue-rotate(270deg); }
          100% { filter: hue-rotate(360deg); }
        }
        @keyframes flashTypewriter-${flashMsg.id} {
          0% { width: 0; }
          100% { width: 100%; }
        }
        @keyframes flashReveal-${flashMsg.id} {
          0% { clip-path: inset(0 100% 0 0); }
          100% { clip-path: inset(0 0 0 0); }
        }
      `;
    }).join('\n');
    
    // Add custom styles for flash message content
    const customStyles = `
      .flash-message-content ul {
        padding-left: 1.25rem;
        margin-bottom: 1rem;
      }
      .flash-message-content li {
        margin-bottom: 0.25rem;
      }
      .flash-message-content p {
        margin-bottom: 1rem;
      }
      .flash-message-content strong {
        font-weight: 600;
      }
    `;
    
    styleElement.textContent = allKeyframes + '\n' + customStyles;
    
    return () => {
      // Don't remove on cleanup, as other messages might still need it
    };
  }, [flashMessages]);

  // Handle flash message click
  const handleFlashMessageClick = (message) => {
    setSelectedFlashMessage(message);
    setShowFlashModal(true);
  };

  // Removed debug logging for performance
  // Theme state management
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    return savedTheme === 'dark';
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Sidebar state management
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const savedState = localStorage.getItem('sidebar-collapsed');
    return savedState === 'true';
  });

  // Add useEffect to handle dropdown arrow rotation
  useEffect(() => {
    const handleDropdownToggle = () => {
      // Get all collapsible menu buttons
      const menuButtons = document.querySelectorAll('.nav-link.menu-link[data-bs-toggle="collapse"]');
      
      menuButtons.forEach(button => {
        const target = button.getAttribute('data-bs-target');
        if (target) {
          const collapseElement = document.querySelector(target);
          if (collapseElement) {
            const arrowIcon = button.querySelector('.ri-arrow-right-s-line');
            
            // Check if the collapse is shown
            const isExpanded = collapseElement.classList.contains('show');
            
            if (arrowIcon) {
              arrowIcon.style.transform = isExpanded ? 'rotate(90deg)' : 'rotate(0deg)';
            }
          }
        }
      });
    };

    // Attach event listener to document
    document.addEventListener('shown.bs.collapse', handleDropdownToggle);
    document.addEventListener('hidden.bs.collapse', handleDropdownToggle);

    // Cleanup event listener on component unmount
    return () => {
      document.removeEventListener('shown.bs.collapse', handleDropdownToggle);
      document.removeEventListener('hidden.bs.collapse', handleDropdownToggle);
    };
  }, []);

  const mobileBreakpoint = 770;
  const isMobileView = () => window.innerWidth < mobileBreakpoint;

  // Sidebar toggle function
  const toggleSidebar = () => {
    const newCollapsedState = !isSidebarCollapsed;
    console.log('Toggle sidebar - new state (collapsed):', newCollapsedState);
    console.log('Window width:', window.innerWidth);
    setIsSidebarCollapsed(newCollapsedState);
    
    // Save state to localStorage
    localStorage.setItem('sidebar-collapsed', newCollapsedState.toString());
    
    // Actually show/hide the sidebar DOM elements
    setTimeout(() => {
      const sidebar = document.querySelector('.app-menu.navbar-menu');
      const overlay = document.querySelector('.vertical-overlay');
      const mainContent = document.querySelector('.main-content');
      
      console.log('Sidebar element found:', !!sidebar);
      console.log('Sidebar classes before:', sidebar?.className);
      
      if (sidebar && mainContent) {
        if (newCollapsedState) {
          // Hide sidebar (collapsed state)
          console.log('Hiding sidebar');
          sidebar.classList.add('sidebar-hidden');
          mainContent.classList.add('sidebar-collapsed');
          document.body.classList.add('sidebar-collapsed');
          if (isMobileView()) {
            document.body.classList.remove('vertical-sidebar-enable');
            document.documentElement.setAttribute('data-sidebar-size', 'lg');
          }
          if (overlay) {
            overlay.classList.remove('show');
          }
        } else {
          // Show sidebar (expanded state)
          console.log('Showing sidebar');
          sidebar.classList.remove('sidebar-hidden');
          mainContent.classList.remove('sidebar-collapsed');
          document.body.classList.remove('sidebar-collapsed');
          
          if (isMobileView()) {
            document.body.classList.add('vertical-sidebar-enable');
            document.documentElement.setAttribute('data-sidebar-size', 'lg');
          }
          
          // On mobile, show the overlay
          if (isMobileView() && overlay) {
            overlay.classList.add('show');
          }
        }
        
        console.log('Sidebar classes after:', sidebar.className);
      }
    }, 50);
  };

  // Close sidebar on mobile when clicking navigation links
  const closeMobileSidebar = () => {
    if (isMobileView() && !isSidebarCollapsed) {
      setIsSidebarCollapsed(true);
      localStorage.setItem('sidebar-collapsed', 'true');

      setTimeout(() => {
        const sidebar = document.querySelector('.app-menu.navbar-menu');
        const overlay = document.querySelector('.vertical-overlay');
        const mainContent = document.querySelector('.main-content');

        if (sidebar && mainContent) {
          sidebar.classList.add('sidebar-hidden');
          mainContent.classList.add('sidebar-collapsed');
          document.body.classList.add('sidebar-collapsed');
          document.body.classList.remove('vertical-sidebar-enable');
          document.documentElement.setAttribute('data-sidebar-size', 'lg');

          if (overlay) {
            overlay.classList.remove('show');
          }
        }
      }, 50);
    }
  };
  
  // Initialize theme from localStorage or default to light
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || sessionStorage.getItem('data-bs-theme') || 'light';
    const isDark = savedTheme === 'dark';
    setIsDarkMode(isDark);
    
    // Apply theme to document
    document.documentElement.setAttribute('data-bs-theme', savedTheme);
    
    // Also update the app-menu element directly for immediate visual feedback
    const appMenu = document.querySelector('.app-menu');
    if (appMenu) {
      appMenu.setAttribute('data-bs-theme', savedTheme);
    }
    
    // Also update sessionStorage for consistency with existing layout.js
    sessionStorage.setItem('data-bs-theme', savedTheme);

    // Listen for fullscreen changes
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);
  

  // Initialize theme and layout attributes on mount
  useEffect(() => {
    
    
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedSidebarTheme = localStorage.getItem('sidebar-theme') || 'light';
    const savedLayout = localStorage.getItem('layout') || 'vertical';
    const savedSidebarState = localStorage.getItem('sidebar-collapsed') === 'true';
    
    
    
    // Set initial theme attributes
    document.documentElement.setAttribute('data-bs-theme', savedTheme);
    document.documentElement.setAttribute('data-sidebar', savedSidebarTheme);
    document.documentElement.setAttribute('data-layout', savedLayout);
    
    // Ensure we're using LTR layout (not RTL)
    document.documentElement.setAttribute('dir', 'ltr');
    
 
    // Ensure sidebar has proper theme attributes
    const appMenu = document.querySelector('.app-menu.navbar-menu');
    if (appMenu) {
      appMenu.setAttribute('data-bs-theme', savedTheme);
      appMenu.setAttribute('data-sidebar', savedSidebarTheme);
      
    } else {
       // Debug log
    }
    
    // Also set data-sidebar on navbar-menu for logo visibility
    const navbarMenu = document.querySelector('.navbar-menu');
    if (navbarMenu) {
      navbarMenu.setAttribute('data-sidebar', savedSidebarTheme);
      
    }
    
    // Force a small delay to ensure DOM is ready
    setTimeout(() => {
      const sidebar = document.querySelector('.app-menu.navbar-menu');
      const mainContent = document.querySelector('.main-content');
      const hamburger = document.querySelector('#topnav-hamburger-icon');
      
      if (sidebar && mainContent) {
        
        
        // Apply saved sidebar state or default mobile behavior
        if (!isMobileView()) {
          // Desktop: respect saved sidebar state
          if (savedSidebarState) {
            sidebar.classList.add('sidebar-hidden');
            document.body.classList.add('sidebar-collapsed');
            mainContent.classList.add('sidebar-collapsed');
            if (hamburger) hamburger.classList.add('open');
            setIsSidebarCollapsed(true);
            
          } else {
            sidebar.classList.remove('sidebar-hidden');
            mainContent.classList.remove('sidebar-collapsed');
            document.body.classList.remove('sidebar-collapsed');
            setIsSidebarCollapsed(false);
            
          }
        } else {
          // Mobile: Always start hidden, but don't override saved state if user has preference
          sidebar.classList.add('sidebar-hidden');
          mainContent.classList.add('sidebar-collapsed');
          document.body.classList.add('sidebar-collapsed');
          document.body.classList.remove('vertical-sidebar-enable');
          // On mobile, start collapsed but allow toggle
          setIsSidebarCollapsed(true);
          
        }
      }
    }, 100);
  }, []);

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const sidebar = document.querySelector('.app-menu.navbar-menu');
      const overlay = document.querySelector('.vertical-overlay');
      const mainContent = document.querySelector('.main-content');
      
      if (!isMobileView()) {
        // Desktop: respect saved sidebar state, hide overlay
        if (overlay) {
          overlay.classList.remove('show');
        }
        document.body.classList.remove('vertical-sidebar-enable');
        // Don't force sidebar state on desktop - respect user preference
      } else {
        // Mobile: Only hide sidebar if it's currently collapsed, don't force hide
        // This allows the hamburger menu to work properly
        if (isSidebarCollapsed) {
          if (sidebar) {
            sidebar.classList.add('sidebar-hidden');
          }
          if (mainContent) {
            mainContent.classList.add('sidebar-collapsed');
          }
          document.body.classList.add('sidebar-collapsed');
          document.body.classList.remove('vertical-sidebar-enable');
          if (overlay) {
            overlay.classList.remove('show');
          }
        }
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Call once on mount to set initial state
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle overlay click to close sidebar
  useEffect(() => {
    const overlay = document.querySelector('.vertical-overlay');
    
    const handleOverlayClick = () => {
      const sidebar = document.querySelector('.app-menu.navbar-menu');
      if (sidebar && !sidebar.classList.contains('sidebar-hidden')) {
        // Update state
        setIsSidebarCollapsed(true);
        localStorage.setItem('sidebar-collapsed', 'true');
        
        // Update DOM
        sidebar.classList.add('sidebar-hidden');
        document.body.classList.add('sidebar-collapsed');
        document.body.classList.remove('vertical-sidebar-enable');
        overlay.classList.remove('show');
        
        // Also toggle main content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
          mainContent.classList.add('sidebar-collapsed');
        }
        
        // Update hamburger icon
        const hamburger = document.querySelector('#topnav-hamburger-icon');
        if (hamburger) {
          hamburger.classList.add('open');
        }
      }
    };

    if (overlay) {
      overlay.addEventListener('click', handleOverlayClick);
    }

    return () => {
      if (overlay) {
        overlay.removeEventListener('click', handleOverlayClick);
      }
    };
  }, []);
  
  // Theme toggle function
  const toggleTheme = () => {
    
    const newTheme = isDarkMode ? 'light' : 'dark';
    const newSidebarTheme = isDarkMode ? 'light' : 'dark';
    
    
    
    setIsDarkMode(!isDarkMode);
    
    // Update document attribute for overall theme
    document.documentElement.setAttribute('data-bs-theme', newTheme);
    
    
    // Update sidebar-specific theme attribute
    document.documentElement.setAttribute('data-sidebar', newSidebarTheme);
     // Debug log
    
    // Also update the app-menu element directly for immediate visual feedback
    const appMenu = document.querySelector('.app-menu.navbar-menu');
    if (appMenu) {
      appMenu.setAttribute('data-bs-theme', newTheme);
      appMenu.setAttribute('data-sidebar', newSidebarTheme);
      // Debug log
    } else {
      
    }
    
    // Also update the navbar-menu element for logo visibility
    const navbarMenu = document.querySelector('.navbar-menu');
    if (navbarMenu) {
      navbarMenu.setAttribute('data-sidebar', newSidebarTheme);
       // Debug log
    }
    
    // Save to both localStorage and sessionStorage
    localStorage.setItem('theme', newTheme);
    localStorage.setItem('sidebar-theme', newSidebarTheme);
    sessionStorage.setItem('data-bs-theme', newTheme);
    sessionStorage.setItem('data-sidebar', newSidebarTheme);
    
  };

  // Fullscreen toggle function with cross-browser support
  const toggleFullscreen = () => {
    const docElm = document.documentElement;
    
    if (!document.fullscreenElement && 
        !document.webkitFullscreenElement && 
        !document.mozFullScreenElement && 
        !document.msFullscreenElement) {
      // Enter fullscreen
      if (docElm.requestFullscreen) {
        docElm.requestFullscreen().catch(err => {
          
        });
      } else if (docElm.webkitRequestFullScreen) {
        docElm.webkitRequestFullScreen();
      } else if (docElm.mozRequestFullScreen) {
        docElm.mozRequestFullScreen();
      } else if (docElm.msRequestFullscreen) {
        docElm.msRequestFullscreen();
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => {
          
        });
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };
  
  // Utility functions for chat notifications
  const markChatNotificationAsRead = (notificationId) => {
    setChatNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: true }
          : notif
      )
    );
    setUnreadChatCount(prev => Math.max(0, prev - 1));
  };
  
  const clearAllChatNotifications = () => {
    setChatNotifications([]);
    setUnreadChatCount(0);
  };
  
  // Utility functions for task notifications
  const markTaskNotificationAsRead = (notificationId) => {
    setTaskNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: true }
          : notif
      )
    );
    setUnreadTaskCount(prev => Math.max(0, prev - 1));
  };
  
  const clearAllTaskNotifications = () => {
    setTaskNotifications([]);
    setUnreadTaskCount(0);
  };
  
  const formatNotificationTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };
  
  const getRoleDisplayName = (role) => {
    switch(role) {
      case 'ADMIN': return 'Admin';
      case 'TL': return 'Team Leader';
      case 'EMPL': return 'Employee';
      default: return 'User';
    }
  };
  
  // Function to handle task notification click
  const handleTaskNotificationClick = (taskId) => {
    // Mark notification as read
    // Note: We'll mark all task notifications as read when clicking any task notification
    // In a more advanced implementation, we could mark individual notifications
    setTaskNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
    setUnreadTaskCount(0);
    
    // Navigate to the task page
    navigate(`/dashboard/task/${taskId}`);
  };
  
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("lead_crm_token");
    localStorage.removeItem("lead_crm_user");
    localStorage.removeItem("user_type");
    localStorage.removeItem("user_info");
    window.location.href = '/Login';
  };
  
  // Function to get priority badge class
  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'URGENT': return 'bg-danger';
      case 'HIGH': return 'bg-warning';
      case 'MEDIUM': return 'bg-info';
      case 'LOW': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  };
  
  // Function to get priority display name
  const getPriorityDisplayName = (priority) => {
    switch (priority) {
      case 'URGENT': return 'Urgent';
      case 'HIGH': return 'High';
      case 'MEDIUM': return 'Medium';
      case 'LOW': return 'Low';
      default: return priority;
    }
  };
  
  // Function to format due date
  const formatDueDate = (dueDate) => {
    if (!dueDate) return 'No due date';
    const date = new Date(dueDate);
    return date.toLocaleDateString();
  };
  
  // Function to check if due date is overdue
  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    const now = new Date();
    const due = new Date(dueDate);
    return due < now;
  };
  
  // Function to get due date badge class
  const getDueDateClass = (dueDate) => {
    if (!dueDate) return 'bg-secondary';
    return isOverdue(dueDate) ? 'bg-danger' : 'bg-success';
  };
  
  // Search functionality - using useMemo to prevent recreating the array on each render
  const searchableItems = React.useMemo(() => [
  
 
   
    // Legacy items (only if not Lead CRM authenticated)
    ...(!isLeadCrmAuthenticated ? [
      { id: 'letter-mgmt', title: 'Letter Management', url: '/CompanyMaster', icon: 'ri-mail-check-line', category: 'Documents', keywords: ['letter', 'management', 'documents', 'mail'] },
      { id: 'new-letter', title: 'New Letter', url: '/NewLetter', icon: 'ri-file-add-line', category: 'Documents', keywords: ['new', 'letter', 'create', 'compose'] },
      { id: 'letter-list', title: 'Letter List', url: '/LetterList', icon: 'ri-file-list-line', category: 'Documents', keywords: ['letter', 'list', 'history', 'archive'] },
      { id: 'attendance', title: 'Attendance', url: '/', icon: 'ri-calendar-check-line', category: 'Time Management', keywords: ['attendance', 'time', 'clock', 'present'] },
      { id: 'departments', title: 'Departments', url: '/Departments', icon: 'ri-building-line', category: 'Masters', keywords: ['department', 'division', 'section'] },
      { id: 'designations', title: 'Designations', url: '/Designation', icon: 'ri-briefcase-line', category: 'Masters', keywords: ['designation', 'position', 'role', 'title'] },
      { id: 'doc-types', title: 'Employee Document Types', url: '/EmployeeDocumentTypes', icon: 'ri-file-text-line', category: 'Masters', keywords: ['document', 'types', 'employee', 'files'] },
      { id: 'grades', title: 'Grades', url: '/Grades', icon: 'ri-award-line', category: 'Masters', keywords: ['grades', 'level', 'rank'] },
      { id: 'locations', title: 'Locations', url: '/Locations', icon: 'ri-map-pin-line', category: 'Masters', keywords: ['location', 'place', 'address', 'office'] },
      { id: 'salary-heads', title: 'Salary Heads', url: '/SalrayHeade', icon: 'ri-money-dollar-circle-line', category: 'Masters', keywords: ['salary', 'heads', 'pay', 'compensation'] },
      { id: 'salary-statutory', title: 'Salary Statutory', url: '/SalrayStatutory', icon: 'ri-government-line', category: 'Masters', keywords: ['salary', 'statutory', 'legal', 'compliance'] },
      { id: 'agencies', title: 'Agencies', url: '/Agencies', icon: 'ri-building-2-line', category: 'Masters', keywords: ['agencies', 'vendor', 'partner'] },
      { id: 'reports', title: 'Reports', url: '/Reports', icon: 'ri-file-text-line', category: 'Reports', keywords: ['reports', 'analytics', 'data', 'statistics'] },
      { id: 'configuration', title: 'Configuration', url: '/Setting', icon: 'ri-settings-line', category: 'Settings', keywords: ['configuration', 'settings', 'setup', 'config'] },
      { id: 'letter-head', title: 'Letter Head', url: '/LetterHead', icon: 'ri-file-paper-line', category: 'Settings', keywords: ['letterhead', 'header', 'template'] },
    ] : [])
  ], [isAdmin, isTeamLeader, isExecutive, isLeadCrmAuthenticated]);
  
  // Enhanced search functionality with database integration
  const performSearch = React.useCallback(async (query) => {
    if (!query || query.trim().length === 0) {
      setSearchResults([]);
      setShowSearchResults(false);
      setIsSearching(false);
      return;
    }

    const searchTerm = query.toLowerCase().trim();
    
    try {
      // First, search database content if user is authenticated
      let databaseResults = [];
      if (isLeadCrmAuthenticated && leadCrmUser) {
        const token = localStorage.getItem('lead_crm_token');
        if (token && token !== 'null') {
          const response = await fetch(buildApiUrl('/admin/search') + `?query=${encodeURIComponent(query)}&limit=15`, {
            method: 'GET',
            headers: getAuthHeaders()
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              // Transform database results to match the expected format
              databaseResults = [];
              
              // Add files for admins
              if (userRole === 'ADMIN' && data.data.files?.length > 0) {
                databaseResults.push(...data.data.files.map(file => ({
                  id: `file-${file.id}`,
                  title: file.display_title,
                  subtitle: file.subtitle,
                  url: `/admin/file/${file.id}`,
                  icon: 'ri-file-line',
                  category: 'Files',
                  type: 'database',
                  data: file,
                  recordId: file.id,
                  recordType: 'file'
                })));
              }
              
              // For executives, only show file-related searches (tasks and leads)
              // Hide employee information for executives
              if (userRole !== 'EMPL') {
                // Add employees - but restrict based on user role
                if (data.data.employees?.length > 0) {
                  // Filter employees based on user role
                  let filteredEmployees = data.data.employees;
                  
                  // For Team Leaders, the backend already filters appropriately based on whether they are
                  // department managers or regular team leaders
                  // No additional filtering needed here as the backend handles it correctly
                  
                  // For Admins, show all employees (no filtering needed)
                  
                  databaseResults.push(...filteredEmployees.map(emp => ({
                    id: `employee-${emp.id}`,
                    title: emp.display_title,
                    subtitle: emp.subtitle, // This will now show department name or email
                    url: `/UserProfile?id=${emp.id}`, // Navigate to specific user profile
                    icon: 'ri-user-line',
                    category: 'Team Members',
                    type: 'database',
                    data: emp,
                    recordId: emp.id,
                    recordType: 'employee'
                  })));
                }
              }

              // Add leads (accessible to TL and EXEC)
              if (data.data.leads?.length > 0 && ['TL', 'EMPL'].includes(userRole)) {
                databaseResults.push(...data.data.leads.map(lead => ({
                  id: `lead-${lead.id}`,
                  title: lead.display_title,
                  subtitle: lead.subtitle,
                  url: userRole === 'TL' ? `/LeadAssignments?leadId=${lead.id}` : `/TodaysAssignedTasks?leadId=${lead.id}`,
                  icon: 'ri-contacts-line',
                  category: 'Leads',
                  type: 'database',
                  data: lead,
                  recordId: lead.id,
                  recordType: 'lead'
                })));
              }
              
              // Add tasks (accessible to all authenticated users)
              if (data.data.tasks?.length > 0 && ['ADMIN', 'TL', 'EMPL'].includes(userRole)) {
                databaseResults.push(...data.data.tasks.map(task => ({
                  id: `task-${task.id}`,
                  title: task.display_title,
                  subtitle: task.subtitle,
                  url: userRole === 'ADMIN' ? `/admin/task_approvel/${task.id}` : 
                         userRole === 'TL' ? `/team-leader/task-review/${task.id}` : 
                         `/employee/task/${task.id}`,
                  icon: 'ri-task-line',
                  category: 'Tasks',
                  type: 'database',
                  data: task,
                  recordId: task.id,
                  recordType: 'task'
                })));
              }
              
              // For admins, add file management option as a fallback
           
            }
          }
        }
      }
      
      // Also search static pages as fallback/supplement
      const pageResults = searchableItems.filter(item => {
        const titleMatch = item.title.toLowerCase().includes(searchTerm);
        const categoryMatch = item.category.toLowerCase().includes(searchTerm);
        const keywordMatch = item.keywords?.some(keyword => 
          keyword.toLowerCase().includes(searchTerm)
        );
        return titleMatch || categoryMatch || keywordMatch;
      }).map(item => ({
        ...item,
        type: 'page'
      }));
      
      // Combine and sort results - prioritize database results
      const allResults = [...databaseResults, ...pageResults];
      
      const sortedResults = allResults.sort((a, b) => {
        // Prioritize database results
        if (a.type === 'database' && b.type === 'page') return -1;
        if (a.type === 'page' && b.type === 'database') return 1;
        
        const aExactMatch = a.title.toLowerCase() === searchTerm;
        const bExactMatch = b.title.toLowerCase() === searchTerm;
        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;
        
        const aTitleStart = a.title.toLowerCase().startsWith(searchTerm);
        const bTitleStart = b.title.toLowerCase().startsWith(searchTerm);
        if (aTitleStart && !bTitleStart) return -1;
        if (!aTitleStart && bTitleStart) return 1;
        
        return a.title.localeCompare(b.title);
      });
      
      setSearchResults(sortedResults.slice(0, 15)); // Limit to 15 results
      setIsSearching(false);
      setShowSearchResults(true);
      
    } catch (error) {
     
      // Fallback to page search only
      const pageResults = searchableItems.filter(item => {
        const titleMatch = item.title.toLowerCase().includes(searchTerm);
        const categoryMatch = item.category.toLowerCase().includes(searchTerm);
        const keywordMatch = item.keywords?.some(keyword => 
          keyword.toLowerCase().includes(searchTerm)
        );
        return titleMatch || categoryMatch || keywordMatch;
      }).map(item => ({
        ...item,
        type: 'page'
      }));
      
      setSearchResults(pageResults.slice(0, 15));
      setIsSearching(false);
      setShowSearchResults(true);
    }
  }, [searchableItems, isLeadCrmAuthenticated, leadCrmUser, userRole]);

  const handleSearchChange = React.useCallback((e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set loading state for immediate feedback
    if (query.trim().length > 0) {
      setIsSearching(true);
      setShowSearchResults(true);
      
      // Debounce search to prevent excessive filtering
      const timeoutId = setTimeout(() => {
        performSearch(query);
      }, 150);
      
      setSearchTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
      setIsSearching(false);
    }
  }, [searchTimeout, performSearch]);
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      // Navigate to first result
      handleSearchResultClick(searchResults[0]);
    }
  };
  
  const handleSearchResultClick = React.useCallback((result) => {
    // Clear search state immediately
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    setIsSearching(false);
    
    // Clear any pending search timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      setSearchTimeout(null);
    }
    
    // Handle different result types
    if (result.type === 'database') {
      // For database results, navigate to appropriate page with specific record ID
      if (result.recordType === 'employee') {
        // Navigate to user profile with employee ID
        // Only allow employees to access other employee profiles if they're not executives
        // Admins can access all employee profiles
        // Team Leaders can access their team members and other TLs
        if (userRole !== 'EMPL') {
          window.location.href = `/UserProfile?id=${result.recordId}`;
        } else {
          // For employees trying to access employee info, show a message or redirect appropriately
          
          // Optionally show a toast message
          // toast.info('You do not have permission to access other employee profiles');
        }
      } else if (result.recordType === 'lead') {
        // Navigate to lead management page with lead ID
        if (userRole === 'TL') {
          window.location.href = `/LeadAssignments?leadId=${result.recordId}`;
        } else {
          window.location.href = `/TodaysAssignedTasks?leadId=${result.recordId}`;
        }
      } else if (result.recordType === 'task') {
        // Navigate to task management page based on user role
        if (userRole === 'ADMIN') {
          window.location.href = `/admin/task_approvel/${result.recordId}`;
        } else if (userRole === 'TL') {
          // Check if the TL is also a department manager
          // For now, we'll redirect department managers to the view route
          // and regular TLs to the review route
          window.location.href = `/team-leader/task/${result.recordId}/view`;
        } else {
          window.location.href = `/employee/task/${result.recordId}`;
        }
      } else if (result.recordType === 'file') {
        // Navigate to file details page
        window.location.href = `/admin/file/${result.recordId}`;
      } else {
        // Fallback navigation
        window.location.href = result.url;
      }
    } else {
      // For page results, navigate normally
      window.location.href = result.url;
    }
  }, [searchTimeout, userRole]);
  
  const clearSearch = React.useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    setIsSearching(false);
    
    // Clear any pending search timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      setSearchTimeout(null);
    }
  }, [searchTimeout]);
  
  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.app-search')) {
        setShowSearchResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Handle sidebar state changes - apply DOM updates when state changes
  useEffect(() => {
    const sidebar = document.querySelector('.app-menu.navbar-menu');
    const mainContent = document.querySelector('.main-content');
    const hamburger = document.querySelector('#topnav-hamburger-icon');
    const overlay = document.querySelector('.vertical-overlay');
    
    
    
    if (sidebar) {
      // Force remove any conflicting classes first
      sidebar.classList.remove('d-none', 'hidden');
      
      if (isSidebarCollapsed) {
        // HIDE sidebar
        sidebar.classList.add('sidebar-hidden');
        sidebar.style.transform = ''; // Remove inline style, let CSS handle it
        
        
        // Desktop specific styles
        if (!isMobileView() && mainContent) {
          document.body.classList.add('sidebar-collapsed');
          mainContent.classList.add('sidebar-collapsed');
        }
        
        // Mobile: hide overlay when sidebar is collapsed
        if (isMobileView()) {
          document.body.classList.remove('vertical-sidebar-enable');
          if (overlay) {
            overlay.classList.remove('show');
          }
        }
        
        if (hamburger) hamburger.classList.add('open');
      } else {
        // SHOW sidebar
        sidebar.classList.remove('sidebar-hidden');
        
        // FORCE show sidebar on mobile with inline style to override CSS
        if (isMobileView()) {
          sidebar.style.transform = 'translateX(0)';
          document.body.classList.add('vertical-sidebar-enable');
          if (overlay) {
            overlay.classList.add('show');
          }
        } else {
          sidebar.style.transform = ''; // Remove inline style on desktop
        }
        
        // Desktop specific styles
        if (!isMobileView() && mainContent) {
          document.body.classList.remove('sidebar-collapsed');
          mainContent.classList.remove('sidebar-collapsed');
        }
        
        if (hamburger) hamburger.classList.remove('open');
      }
      
    
    
      
    }
  }, [isSidebarCollapsed]);

  // Handle page navigation - maintain sidebar state
  useEffect(() => {
    const handlePageLoad = () => {
      const sidebar = document.querySelector('.app-menu.navbar-menu');
      const mainContent = document.querySelector('.main-content');
      const hamburger = document.querySelector('#topnav-hamburger-icon');
      
      if (sidebar && mainContent) {
        // Apply saved sidebar state on page load
        const savedState = localStorage.getItem('sidebar-collapsed') === 'true';
        setIsSidebarCollapsed(savedState); // Update React state to trigger DOM updates
      }
    };

    // Apply state immediately
    handlePageLoad();
    
    // Also listen for navigation events
    window.addEventListener('popstate', handlePageLoad);
    
    return () => {
      window.removeEventListener('popstate', handlePageLoad);
    };
  }, []);

  // Handle tooltip and nested menu positioning for collapsed sidebar
  useEffect(() => {
    if (!isSidebarCollapsed) return;

    let hoverTimeout = null;
    let currentTooltip = null;
    let currentNestedMenu = null;
    let isHoveringNestedMenu = false;

    const cleanup = () => {
      if (currentTooltip) {
        currentTooltip.remove();
        currentTooltip = null;
      }
      if (currentNestedMenu) {
        currentNestedMenu.remove();
        currentNestedMenu = null;
      }
      isHoveringNestedMenu = false;
    };

    const handleMouseEnter = (e) => {
      const navItem = e.currentTarget;
      const navLink = navItem.querySelector('.nav-link, button[data-bs-toggle="collapse"]');
      const nestedMenu = navItem.querySelector('.menu-dropdown');
      
      // Clear any existing timeout and cleanup
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        hoverTimeout = null;
      }
      
      // Clean up any existing elements
      cleanup();
      
      if (navLink) {
        const rect = navLink.getBoundingClientRect();
        
        // Create tooltip for all links
        const tooltipElement = document.createElement('div');
        tooltipElement.className = 'sidebar-tooltip';
        
        // Get tooltip text from data-tooltip attribute or from the span text
        const tooltipText = navLink.getAttribute('data-tooltip') || 
                           navLink.querySelector('span[data-key]')?.textContent?.trim() ||
                           navLink.textContent?.trim() ||
                           'Menu Item';
        
        tooltipElement.textContent = tooltipText;
        tooltipElement.style.cssText = `
          position: fixed;
          left: 90px;
          top: ${rect.top + rect.height / 2}px;
          transform: translateY(-50%);
          background: #495057;
          color: white;
          padding: 6px 10px;
          border-radius: 4px;
          font-size: 11px;
          white-space: nowrap;
          z-index: 10000;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          pointer-events: none;
        `;
        document.body.appendChild(tooltipElement);
        currentTooltip = tooltipElement;
        
        // Position nested menu outside sidebar
        if (nestedMenu) {
          // Clone the menu to avoid Bootstrap collapse conflicts
          const clonedMenu = nestedMenu.cloneNode(true);
          clonedMenu.className = 'sidebar-nested-menu';
          clonedMenu.style.cssText = `
            position: fixed;
            left: 90px;
            top: ${rect.top}px;
            background: #ffffff;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            min-width: 200px;
            z-index: 10000;
            opacity: 1;
            visibility: visible;
            transform: translateX(0);
            padding: 8px 0;
            max-height: 400px;
            overflow-y: auto;
            display: block !important;
            pointer-events: auto;
          `;
          
          // Style the cloned menu items
          const clonedLinks = clonedMenu.querySelectorAll('.nav-link, a, button');
          clonedLinks.forEach(link => {
            link.style.cssText = `
              display: block;
              padding: 8px 16px;
              color: #495057;
              text-decoration: none;
              border: none;
              background: none;
              width: 100%;
              text-align: left;
              font-size: 13px;
              transition: background-color 0.2s ease;
              pointer-events: auto;
            `;
            
            // Add hover effect
            link.addEventListener('mouseenter', () => {
              link.style.backgroundColor = '#f8f9fa';
            });
            link.addEventListener('mouseleave', () => {
              link.style.backgroundColor = 'transparent';
            });
          });
          
          document.body.appendChild(clonedMenu);
          currentNestedMenu = clonedMenu;
          
          // Add hover events to the nested menu to keep it visible
          const handleNestedMenuEnter = () => {
            isHoveringNestedMenu = true;
            if (hoverTimeout) {
              clearTimeout(hoverTimeout);
              hoverTimeout = null;
            }
          };
          
          const handleNestedMenuLeave = () => {
            isHoveringNestedMenu = false;
            hoverTimeout = setTimeout(() => {
              cleanup();
            }, 100);
          };
          
          clonedMenu.addEventListener('mouseenter', handleNestedMenuEnter);
          clonedMenu.addEventListener('mouseleave', handleNestedMenuLeave);
        }
      }
    };

    const handleMouseLeave = (e) => {
      // Add a small delay before hiding to allow moving to nested menu
      hoverTimeout = setTimeout(() => {
        if (!isHoveringNestedMenu) {
          cleanup();
        }
      }, 100);
    };

    // Add event listeners to all nav items
    const navItems = document.querySelectorAll('.app-menu.navbar-menu.sidebar-hidden .navbar-nav .nav-item');
    navItems.forEach(item => {
      item.addEventListener('mouseenter', handleMouseEnter);
      item.addEventListener('mouseleave', handleMouseLeave);
    });

    // Add global mouse leave handler for the entire sidebar area
    const sidebar = document.querySelector('.app-menu.navbar-menu.sidebar-hidden');
    if (sidebar) {
      const handleSidebarLeave = () => {
        hoverTimeout = setTimeout(() => {
          cleanup();
        }, 50);
      };
      
      sidebar.addEventListener('mouseleave', handleSidebarLeave);
      
      return () => {
        // Clear any pending timeouts
        if (hoverTimeout) {
          clearTimeout(hoverTimeout);
        }
        
        navItems.forEach(item => {
          item.removeEventListener('mouseenter', handleMouseEnter);
          item.removeEventListener('mouseleave', handleMouseLeave);
        });
        
        if (sidebar) {
          sidebar.removeEventListener('mouseleave', handleSidebarLeave);
        }
        
        // Clean up any remaining elements
        cleanup();
      };
    }

    return () => {
      // Clear any pending timeouts
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
      
      navItems.forEach(item => {
        item.removeEventListener('mouseenter', handleMouseEnter);
        item.removeEventListener('mouseleave', handleMouseLeave);
      });
      
      // Clean up any remaining elements
      cleanup();
    };
  }, [isSidebarCollapsed]);
  return (
    <div>
      <header id="page-topbar">
        <div className="layout-width">
          <div className="navbar-header">
            <div className="d-flex">
              {/* LOGO */}
              <div className="navbar-brand-box horizontal-logo">
                <NavLink to="/" className={`logo ${isDarkMode ? 'logo-light' : 'logo-dark'}`}>
                  <span className="logo-sm">
                    <img
                      src={`${process.env.REACT_APP_BASE_URL}assets/logo-dark.png`}
                      alt=""
                      height={35}
                    />
                  </span>
                  <span className="logo-lg">
                    <img
                      src={`${process.env.REACT_APP_BASE_URL}assets/ipshopy-logo.png`}
                      alt=""
                      height={35}
                    />
                  </span>
                </NavLink>
              </div>
              <button
                type="button"
                className={`btn btn-sm px-3 fs-16 header-item vertical-menu-btn topnav-hamburger ${isSidebarCollapsed ? 'open' : ''}`}
                id="topnav-hamburger-icon"
                onClick={toggleSidebar}
                aria-label={isSidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
                title={isSidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
              >
                <i className={`ri-${isSidebarCollapsed ? 'menu-line' : 'close-line'} hamburger-icon`} />
              </button>
              {/* App Search*/}
             <form className="app-search d-none d-md-block" onSubmit={handleSearchSubmit}>
              <div className="position-relative">
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Search" 
                  autoComplete="off" 
                  id="search-options" 
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => searchQuery && setShowSearchResults(true)}
                />
                <span className="mdi mdi-magnify search-widget-icon" />
                {searchQuery && (
                  <span 
                    className="mdi mdi-close-circle search-widget-icon search-widget-icon-close" 
                    onClick={clearSearch}
                    style={{ cursor: 'pointer' }}
                  />
                )}
              </div>
              {showSearchResults && (
                <div className="dropdown-menu dropdown-menu-lg show" style={{ position: 'absolute', zIndex: 9999 }}>
                  <div style={{maxHeight: 320, overflowY: 'auto'}}>
                    {isSearching ? (
                      <div className="text-center py-3">
                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                          <span className="visually-hidden">Searching...</span>
                        </div>
                        <p className="text-muted mt-2 mb-0 fs-13">Searching database...</p>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <React.Fragment>
                        <div className="dropdown-header">
                          <h6 className="text-overflow text-muted mb-0 text-uppercase fs-11">Search Results ({searchResults.length})</h6>
                        </div>
                        {searchResults.slice(0, 10).map((item) => (
                          <div 
                            key={item.id}
                            className="dropdown-item notify-item" 
                            onClick={() => handleSearchResultClick(item)}
                            style={{ cursor: 'pointer', padding: '8px 12px' }}
                            onMouseDown={(e) => e.preventDefault()} // Prevent focus issues
                          >
                            <div className="d-flex align-items-center">
                              <i className={`${item.icon} align-middle fs-16 text-muted me-2 flex-shrink-0`} />
                              <div className="flex-grow-1 min-width-0">
                                <div className="fw-medium text-truncate">{item.title}</div>
                                <div className="fs-11 text-muted text-truncate">
                                  {item.subtitle || item.category}
                                
                                  {item.recordType === 'employee' && userRole === 'EMPL' && (
                                    <span className="badge bg-warning-subtle text-warning ms-1 fs-10">Restricted</span>
                                  )}
                                </div>
                              </div>
                              <i className="ri-arrow-right-s-line align-middle text-muted flex-shrink-0"></i>
                            </div>
                          </div>
                        ))}
                        {searchResults.length > 10 && (
                          <div className="dropdown-header border-top mt-1">
                            <small className="text-muted">Showing first 10 of {searchResults.length} results</small>
                          </div>
                        )}
                      </React.Fragment>
                    ) : searchQuery.trim().length > 0 ? (
                      <div className="text-center py-4">
                        <div className="avatar-md mx-auto mb-3">
                          <div className="avatar-title bg-light text-muted rounded-circle fs-24">
                            <i className="bx bx-search" />
                          </div>
                        </div>
                        <h6 className="mb-2">No Results Found</h6>
                        <p className="text-muted fs-12 mb-0 px-3">
                          {isLeadCrmAuthenticated 
                            ? "Try searching for employee names and thier task names" 
                            : "Try searching for: dashboard, chat, profile, employees, or other menu items"
                          }
                        </p>
                      </div>
                    ) : null}
                  </div>
                  {searchResults.length > 0 && (
                    <div className="text-center pt-2 pb-1 border-top bg-light">
                      <small className="text-muted fs-11">Press Enter to go to first result</small>
                    </div>
                  )}
                </div>
              )}
            </form>
            </div>
            <div className="d-flex align-items-center">
              <div className="dropdown d-md-none topbar-head-dropdown header-item">
                <button
                  type="button"
                  className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle"
                  id="page-header-search-dropdown"
                  data-bs-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  <i className="bx bx-search fs-22" />
                </button>
                <div
                  className="dropdown-menu dropdown-menu-lg dropdown-menu-end p-0"
                  aria-labelledby="page-header-search-dropdown"
                >
                  <form className="p-3" onSubmit={handleSearchSubmit}>
                    <div className="form-group m-0">
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search employees, leads, tasks..."
                          aria-label="Search input"
                          value={searchQuery}
                          onChange={handleSearchChange}
                        />
                        <button className="btn btn-primary" type="submit">
                          <i className="mdi mdi-magnify" />
                        </button>
                      </div>
                    </div>
                    {searchResults.length > 0 && (
                      <div className="mt-3">
                        <div className="list-group list-group-flush">
                          {searchResults.slice(0, 5).map((item, index) => (
                            <div 
                              key={index}
                              className="list-group-item list-group-item-action border-0 py-2" 
                              onClick={() => handleSearchResultClick(item)}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="d-flex align-items-center">
                                <i className={`${item.icon} me-2 text-muted`} />
                                <div className="flex-grow-1">
                                  <small className="fw-medium">{item.title}</small>
                                  <div className="text-muted" style={{ fontSize: '0.7rem' }}>{item.category}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </form>
                </div>
              </div>
               
            {/* <div className="dropdown topbar-head-dropdown ms-1 header-item">
              <button type="button" className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <i className="bx bx-category-alt fs-22" />
              </button>
              <div className="dropdown-menu dropdown-menu-lg p-0 dropdown-menu-end">
                <div className="p-3 border-top-0 border-start-0 border-end-0 border-dashed border">
                  <div className="row align-items-center">
                    <div className="col">
                      <h6 className="m-0 fw-semibold fs-15"> Web Apps </h6>
                    </div>
                    <div className="col-auto">
                      <a href="#!" className="btn btn-sm btn-soft-info"> View All Apps
                        <i className="ri-arrow-right-s-line align-middle" /></a>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <div className="row g-0">
                    <div className="col">
                      <a className="dropdown-icon-item" href="#!">
                        <img src="assets/images/brands/github.png" alt="Github" />
                        <span>GitHub</span>
                      </a>
                    </div>
                    <div className="col">
                      <a className="dropdown-icon-item" href="#!">
                        <img src="assets/images/brands/bitbucket.png" alt="bitbucket" />
                        <span>Bitbucket</span>
                      </a>
                    </div>
                    <div className="col">
                      <a className="dropdown-icon-item" href="#!">
                        <img src="assets/images/brands/dribbble.png" alt="dribbble" />
                        <span>Dribbble</span>
                      </a>
                    </div>
                  </div>
                  <div className="row g-0">
                    <div className="col">
                      <a className="dropdown-icon-item" href="#!">
                        <img src="assets/images/brands/dropbox.png" alt="dropbox" />
                        <span>Dropbox</span>
                      </a>
                    </div>
                    <div className="col">
                      <a className="dropdown-icon-item" href="#!">
                        <img src="assets/images/brands/mail_chimp.png" alt="mail_chimp" />
                        <span>Mail Chimp</span>
                      </a>
                    </div>
                    <div className="col">
                      <a className="dropdown-icon-item" href="#!">
                        <img src="assets/images/brands/slack.png" alt="slack" />
                        <span>Slack</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div> */}
            {/* <div className="dropdown topbar-head-dropdown ms-1 header-item">
              <button type="button" className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle" id="page-header-cart-dropdown" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-haspopup="true" aria-expanded="false">
                <i className="bx bx-shopping-bag fs-22" />
                <span className="position-absolute topbar-badge cartitem-badge fs-10 translate-middle badge rounded-pill bg-info">5</span>
              </button>
              <div className="dropdown-menu dropdown-menu-xl dropdown-menu-end p-0 dropdown-menu-cart" aria-labelledby="page-header-cart-dropdown">
                <div className="p-3 border-top-0 border-start-0 border-end-0 border-dashed border">
                  <div className="row align-items-center">
                    <div className="col">
                      <h6 className="m-0 fs-16 fw-semibold"> My Cart</h6>
                    </div>
                    <div className="col-auto">
                      <span className="badge bg-warning-subtle text-warning fs-13"><span className="cartitem-badge">7</span>
                        items</span>
                    </div>
                  </div>
                </div>
                <div data-simplebar style={{maxHeight: 300}}>
                  <div className="p-2">
                    <div className="text-center empty-cart" id="empty-cart">
                      <div className="avatar-md mx-auto my-3">
                        <div className="avatar-title bg-info-subtle text-info fs-36 rounded-circle">
                          <i className="bx bx-cart" />
                        </div>
                      </div>
                      <h5 className="mb-3">Your Cart is Empty!</h5>
                      <a href="apps-ecommerce-products.html" className="btn btn-success w-md mb-3">Shop Now</a>
                    </div>
                    <div className="d-block dropdown-item dropdown-item-cart text-wrap px-3 py-2">
                      <div className="d-flex align-items-center">
                        <img src="assets/images/products/img-1.png" className="me-3 rounded-circle avatar-sm p-2 bg-light" alt="user-pic" />
                        <div className="flex-grow-1">
                          <h6 className="mt-0 mb-1 fs-14">
                            <a href="apps-ecommerce-product-details.html" className="text-reset">Branded
                              T-Shirts</a>
                          </h6>
                          <p className="mb-0 fs-12 text-muted">
                            Quantity: <span>10 x $32</span>
                          </p>
                        </div>
                        <div className="px-2">
                          <h5 className="m-0 fw-normal">$<span className="cart-item-price">320</span></h5>
                        </div>
                        <div className="ps-2">
                          <button type="button" className="btn btn-icon btn-sm btn-ghost-secondary remove-item-btn"><i className="ri-close-fill fs-16" /></button>
                        </div>
                      </div>
                    </div>
                    <div className="d-block dropdown-item dropdown-item-cart text-wrap px-3 py-2">
                      <div className="d-flex align-items-center">
                        <img src="assets/images/products/img-2.png" className="me-3 rounded-circle avatar-sm p-2 bg-light" alt="user-pic" />
                        <div className="flex-grow-1">
                          <h6 className="mt-0 mb-1 fs-14">
                            <a href="apps-ecommerce-product-details.html" className="text-reset">Bentwood Chair</a>
                          </h6>
                          <p className="mb-0 fs-12 text-muted">
                            Quantity: <span>5 x $18</span>
                          </p>
                        </div>
                        <div className="px-2">
                          <h5 className="m-0 fw-normal">$<span className="cart-item-price">89</span></h5>
                        </div>
                        <div className="ps-2">
                          <button type="button" className="btn btn-icon btn-sm btn-ghost-secondary remove-item-btn"><i className="ri-close-fill fs-16" /></button>
                        </div>
                      </div>
                    </div>
                    <div className="d-block dropdown-item dropdown-item-cart text-wrap px-3 py-2">
                      <div className="d-flex align-items-center">
                        <img src="assets/images/products/img-3.png" className="me-3 rounded-circle avatar-sm p-2 bg-light" alt="user-pic" />
                        <div className="flex-grow-1">
                          <h6 className="mt-0 mb-1 fs-14">
                            <a href="apps-ecommerce-product-details.html" className="text-reset">
                              Borosil Paper Cup</a>
                          </h6>
                          <p className="mb-0 fs-12 text-muted">
                            Quantity: <span>3 x $250</span>
                          </p>
                        </div>
                        <div className="px-2">
                          <h5 className="m-0 fw-normal">$<span className="cart-item-price">750</span></h5>
                        </div>
                        <div className="ps-2">
                          <button type="button" className="btn btn-icon btn-sm btn-ghost-secondary remove-item-btn"><i className="ri-close-fill fs-16" /></button>
                        </div>
                      </div>
                    </div>
                    <div className="d-block dropdown-item dropdown-item-cart text-wrap px-3 py-2">
                      <div className="d-flex align-items-center">
                        <img src="assets/images/products/img-6.png" className="me-3 rounded-circle avatar-sm p-2 bg-light" alt="user-pic" />
                        <div className="flex-grow-1">
                          <h6 className="mt-0 mb-1 fs-14">
                            <a href="apps-ecommerce-product-details.html" className="text-reset">Gray
                              Styled T-Shirt</a>
                          </h6>
                          <p className="mb-0 fs-12 text-muted">
                            Quantity: <span>1 x $1250</span>
                          </p>
                        </div>
                        <div className="px-2">
                          <h5 className="m-0 fw-normal">$ <span className="cart-item-price">1250</span></h5>
                        </div>
                        <div className="ps-2">
                          <button type="button" className="btn btn-icon btn-sm btn-ghost-secondary remove-item-btn"><i className="ri-close-fill fs-16" /></button>
                        </div>
                      </div>
                    </div>
                    <div className="d-block dropdown-item dropdown-item-cart text-wrap px-3 py-2">
                      <div className="d-flex align-items-center">
                        <img src="assets/images/products/img-5.png" className="me-3 rounded-circle avatar-sm p-2 bg-light" alt="user-pic" />
                        <div className="flex-grow-1">
                          <h6 className="mt-0 mb-1 fs-14">
                            <a href="apps-ecommerce-product-details.html" className="text-reset">Stillbird Helmet</a>
                          </h6>
                          <p className="mb-0 fs-12 text-muted">
                            Quantity: <span>2 x $495</span>
                          </p>
                        </div>
                        <div className="px-2">
                          <h5 className="m-0 fw-normal">$<span className="cart-item-price">990</span></h5>
                        </div>
                        <div className="ps-2">
                          <button type="button" className="btn btn-icon btn-sm btn-ghost-secondary remove-item-btn"><i className="ri-close-fill fs-16" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-3 border-bottom-0 border-start-0 border-end-0 border-dashed border" id="checkout-elem">
                  <div className="d-flex justify-content-between align-items-center pb-3">
                    <h5 className="m-0 text-muted">Total:</h5>
                    <div className="px-2">
                      <h5 className="m-0" id="cart-item-total">$1258.58</h5>
                    </div>
                  </div>
                  <a href="apps-ecommerce-checkout.html" className="btn btn-success text-center w-100">
                    Checkout
                  </a>
                </div>
              </div>
            </div> */}
            

























            
            {/* Flash Messages */}
            {flashMessages.length > 0 && flashMessages.slice(0, 3).map((flashMsg) => {
              const animationStyle = flashMsg.animation_style || 'flashGlow';
              const textColor = flashMsg.text_color || '#0d6efd';
              const bgColor = flashMsg.background_color && 
                             flashMsg.background_color !== 'transparent' && 
                             flashMsg.background_color !== 'none' && 
                             flashMsg.background_color !== 'null' && 
                             flashMsg.background_color !== 'undefined' && 
                             flashMsg.background_color !== '' 
                             ? flashMsg.background_color 
                             : 'transparent';
              const fontFamily = flashMsg.font_family && 
                                flashMsg.font_family !== 'inherit' && 
                                flashMsg.font_family !== 'null' && 
                                flashMsg.font_family !== 'undefined' && 
                                flashMsg.font_family !== '' 
                                ? flashMsg.font_family 
                                : 'inherit';
              const fontSize = flashMsg.font_size || '0.8rem';
              const fontWeight = flashMsg.font_weight || '600';
              
              // Convert colors to rgba for proper opacity handling
              const textColorRgba50 = hexToRgba(textColor, 0.5);
              const textColorRgba80 = hexToRgba(textColor, 0.8);
              const borderColor = bgColor !== 'transparent' ? hexToRgba(textColor, 0.25) : 'transparent';
              const borderColorHover = bgColor !== 'transparent' ? hexToRgba(textColor, 0.5) : hexToRgba(textColor, 0.3);
              
              // Get animation name based on style
              const getAnimationName = () => {
                switch(animationStyle) {
                  case 'flashGlow': return `flashGlow-${flashMsg.id}`;
                  case 'flashBounce': return `flashBounce-${flashMsg.id}`;
                  case 'flashShake': return `flashShake-${flashMsg.id}`;
                  case 'flashFade': return `flashFade-${flashMsg.id}`;
                  case 'flashSlide': return `flashSlide-${flashMsg.id}`;
                  case 'flashScale': return `flashScale-${flashMsg.id}`;
                  case 'flashRotate': return `flashRotate-${flashMsg.id}`;
                  case 'flashNeon': return `flashNeon-${flashMsg.id}`;
                  case 'flashWave': return `flashWave-${flashMsg.id}`;
                  case 'flashRainbow': return `flashRainbow-${flashMsg.id}`;
                  case 'flashTypewriter': return `flashTypewriter-${flashMsg.id}`;
                  case 'flashReveal': return `flashReveal-${flashMsg.id}`;
                  default: return `flashGlow-${flashMsg.id}`;
                }
              };
              
              const animationName = getAnimationName();
              
              const handleFlashClick = () => {
                handleFlashMessageClick(flashMsg);
              };
              
              return (
                <div 
                  key={flashMsg.id}
                  className="ms-2 header-item d-flex"
                  style={{ 
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1px',
                    cursor: 'pointer'
                  }}
                  onClick={handleFlashClick}
                  title={flashMsg.title}
                >
                  {/* Image - separate from message container, not affected by background */}
                  {flashMsg.image_path && (
                    <img 
                      src={`${buildApiUrl('').replace('/api/v1', '')}${flashMsg.image_path}`}
                      alt={flashMsg.title}
                      style={{ 
                        width: '35px', 
                        height: '35px', 
                        objectFit: 'contain', 
                        borderRadius: '6px',
                        flexShrink: 0,
                        pointerEvents: 'none'
                      }}
                    />
                  )}
                  {/* Message container - only contains the text with background */}
                  <div 
                    style={{
                      cursor: 'pointer',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      background: bgColor !== 'transparent' ? bgColor : 'transparent',
                      border: bgColor !== 'transparent' ? `1px solid ${borderColor}` : 'none',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      maxWidth: '220px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.borderColor = borderColorHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.borderColor = borderColor;
                    }}
                  >
                    <span 
                      style={{
                        color: textColor,
                        fontFamily: fontFamily !== 'inherit' ? fontFamily : 'inherit',
                        fontSize: fontSize,
                        fontWeight: fontWeight,
                        whiteSpace: animationStyle === 'flashTypewriter' ? 'nowrap' : 'normal',
                        overflow: animationStyle === 'flashTypewriter' ? 'hidden' : 'visible',
                        textOverflow: 'ellipsis',
                        display: 'inline-block',
                        animation: `${animationName} 2s ease-in-out infinite`,
                        clipPath: animationStyle === 'flashReveal' ? 'inset(0 100% 0 0)' : 'none'
                      }}
                    >
                      {flashMsg.message}
                    </span>
                  </div>
                </div>
              );
            })}
            
            {/* Welcome Info Button */}
            {/* <div className="ms-1 header-item d-none d-sm-flex">
              <button 
                type="button"
                className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle"
                onClick={handleWelcomeModalOpen}
                title="Welcome Info"
              >
                <img 
                  src="/assets/shopping-cart.gif" 
                  alt="Welcome" 
                  style={{ width: '35px', height: '35px', objectFit: 'contain', borderRadius: '50%' }}
                />
              </button>
            </div> */}
            
            <div className="ms-1 header-item d-none d-sm-flex">
              <button 
                type="button" 
                className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle"
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                <i className={`bx ${isFullscreen ? 'bx-exit-fullscreen' : 'bx-fullscreen'} fs-22`} />
              </button>
            </div>
            <div className="ms-1 header-item d-flex">
              <button 
                type="button" 
                className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle light-dark-mode"
                onClick={toggleTheme}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                <i className={`bx ${isDarkMode ? 'bx-sun' : 'bx-moon'} fs-22`} />
              </button>
            </div>
            <div className="dropdown topbar-head-dropdown ms-1 header-item" id="notificationDropdown">
              <button type="button" className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle" id="page-header-notifications-dropdown" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-haspopup="true" aria-expanded="false">
                <i className="bx bx-bell fs-22" />
                <span className="position-absolute topbar-badge fs-10 translate-middle badge rounded-pill bg-danger">{unreadChatCount + unreadTaskCount > 0 ? unreadChatCount + unreadTaskCount : '0'}<span className="visually-hidden">unread notifications</span></span>
              </button>
              <div className="dropdown-menu dropdown-menu-lg dropdown-menu-end p-0" aria-labelledby="page-header-notifications-dropdown">
                <div className="dropdown-head bg-primary bg-pattern rounded-top">
                  <div className="p-3">
                    <div className="row align-items-center">
                      <div className="col">
                        <h6 className="m-0 fs-16 fw-semibold text-white"> Notifications </h6>
                      </div>
                      <div className="col-auto dropdown-tabs">
                        <span className="badge bg-light-subtle text-body fs-13"> New</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-2 pt-2">
                    <ul className="nav nav-tabs dropdown-tabs nav-tabs-custom" data-dropdown-tabs="true" id="notificationItemsTab" role="tablist">
                      <li className="nav-item waves-effect waves-light">
                        <a className="nav-link active" data-bs-toggle="tab" href="#all-noti-tab" role="tab" aria-selected="true">
                          All ({unreadChatCount + unreadTaskCount})
                        </a>
                      </li>
                      <li className="nav-item waves-effect waves-light">
                        <a className="nav-link" data-bs-toggle="tab" href="#messages-tab" role="tab" aria-selected="false">
                          Messages{unreadChatCount > 0 && ` (${unreadChatCount})`}
                        </a>
                      </li>
                      <li className="nav-item waves-effect waves-light">
                        <a className="nav-link" data-bs-toggle="tab" href="#tasks-tab" role="tab" aria-selected="false">
                          Tasks{unreadTaskCount > 0 && ` (${unreadTaskCount})`}
                        </a>
                      </li>
                      <li className="nav-item waves-effect waves-light">
                        <a className="nav-link" data-bs-toggle="tab" href="#alerts-tab" role="tab" aria-selected="false">
                          Alerts
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="tab-content position-relative" id="notificationItemsTabContent">
                  <div className="tab-pane fade show active py-2 ps-2" id="all-noti-tab" role="tabpanel">
                    <div data-simplebar style={{maxHeight: 300}} className="pe-2">
                      {/* Chat Notifications - Show in All tab too */}
                      {chatNotifications.slice(0, 3).map((notification) => (
                        <div 
                          key={`all-${notification.id}`} 
                          className={`text-reset notification-item d-block dropdown-item position-relative ${notification.isRead ? '' : 'bg-light-subtle'}`}
                          onClick={() => {
                            markChatNotificationAsRead(notification.id);
                            window.location.href = '/Chat';
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="d-flex">
                            <div className="avatar-xs me-3 flex-shrink-0">
                              {notification.roomType === 'direct' ? (
                                <img src="assets/images/users/avatar-2.jpg" className="rounded-circle avatar-xs" alt="user-pic" />
                              ) : (
                                <span className="avatar-title bg-success-subtle text-success rounded-circle fs-16">
                                  <i className="ri-group-line" />
                                </span>
                              )}
                            </div>
                            <div className="flex-grow-1">
                              <a href="#!" className="stretched-link">
                                <h6 className="mt-0 mb-2 lh-base">
                                  <b>{notification.roomType === 'direct' ? notification.senderName : notification.roomName}</b>: {notification.content.substring(0, 50)}{notification.content.length > 50 ? '...' : ''}
                                </h6>
                              </a>
                              <p className="mb-0 fs-11 fw-medium text-uppercase text-muted">
                                <span><i className="mdi mdi-clock-outline" /> {formatNotificationTime(notification.timestamp)}</span>
                              </p>
                            </div>
                            <div className="px-2 fs-15">
                              {!notification.isRead && (
                                <div className="badge bg-primary rounded-pill"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Task Notifications - Show in All tab too */}
                      {taskNotifications.slice(0, 3).map((notification) => (
                        <div 
                          key={`all-task-${notification.id}`} 
                          className={`text-reset notification-item d-block dropdown-item position-relative ${notification.isRead ? '' : 'bg-light-subtle'}`}
                          onClick={() => handleTaskNotificationClick(notification.taskId)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="d-flex">
                            <div className="avatar-xs me-3 flex-shrink-0">
                              <span className="avatar-title bg-info-subtle text-info rounded-circle fs-16">
                                <i className="ri-task-line" />
                              </span>
                            </div>
                            <div className="flex-grow-1">
                              <a href="#!" className="stretched-link">
                                <h6 className="mt-0 mb-1 lh-base">
                                  <b>New Task Assigned</b>
                                </h6>
                                <p className="mb-1 text-truncate" style={{ maxWidth: '200px' }}>
                                  {notification.taskTitle}
                                </p>
                              </a>
                              <div className="d-flex align-items-center">
                                <span className={`badge ${getPriorityClass(notification.priority)} me-2`}>
                                  {getPriorityDisplayName(notification.priority)}
                                </span>
                                <span className={`badge ${getDueDateClass(notification.dueDate)} me-2`}>
                                  {formatDueDate(notification.dueDate)}
                                </span>
                              </div>
                              <p className="mb-0 fs-11 fw-medium text-uppercase text-muted mt-1">
                                <span><i className="mdi mdi-clock-outline" /> {formatNotificationTime(notification.timestamp)}</span>
                                <span className="mx-1">•</span>
                                <span>{getRoleDisplayName(notification.assignedByRole)}: {notification.assignedBy}</span>
                              </p>
                            </div>
                            <div className="px-2 fs-15">
                              {!notification.isRead && (
                                <div className="badge bg-primary rounded-pill"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {(chatNotifications.length === 0 && taskNotifications.length === 0) && (
                        <div className="text-center py-4">
                          <div className="avatar-md mx-auto mb-3">
                            <div className="avatar-title bg-light-subtle text-muted rounded-circle fs-36">
                              <i className="bx bx-bell-off" />
                            </div>
                          </div>
                          <h5 className="mb-2">No New Notifications</h5>
                          <p className="text-muted fs-13">You're all caught up!</p>
                        </div>
                      )}
                     
                      <div className="my-3 text-center view-all">
                        <button type="button" className="btn btn-soft-success waves-effect waves-light">View
                          All Notifications <i className="ri-arrow-right-line align-middle" /></button>
                      </div>
                    </div>
                  </div>
                  <div className="tab-pane fade py-2 ps-2" id="messages-tab" role="tabpanel" aria-labelledby="messages-tab">
                    <div data-simplebar style={{maxHeight: 300}} className="pe-2">
                      {/* Chat Notifications */}
                      {chatNotifications.length > 0 && (
                        <>
                          <div className="px-3 mb-2">
                            <div className="d-flex justify-content-between align-items-center">
                              <h6 className="text-muted text-uppercase mb-0 fs-11">Chat Messages</h6>
                              {unreadChatCount > 0 && (
                                <button 
                                  type="button" 
                                  className="btn btn-link btn-sm text-muted p-0"
                                  onClick={clearAllChatNotifications}
                                  title="Mark all as read"
                                >
                                  <i className="ri-check-double-line me-1"></i>Clear all
                                </button>
                              )}
                            </div>
                          </div>
                          {chatNotifications.slice(0, 5).map((notification) => (
                            <div 
                              key={notification.id} 
                              className={`text-reset notification-item d-block dropdown-item ${notification.isRead ? '' : 'bg-light-subtle'}`}
                              onClick={() => {
                                markChatNotificationAsRead(notification.id);
                                // Navigate to chat with room
                                window.location.href = '/Chat';
                              }}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="d-flex">
                                <div className="avatar-xs me-3 flex-shrink-0">
                                  {notification.roomType === 'direct' ? (
                                    <img src="assets/images/users/avatar-2.jpg" className="rounded-circle avatar-xs" alt="user-pic" />
                                  ) : (
                                    <span className="avatar-title bg-success-subtle text-success rounded-circle fs-16">
                                      <i className="ri-group-line" />
                                    </span>
                                  )}
                                </div>
                                <div className="flex-grow-1">
                                  <div className="d-flex align-items-start justify-content-between">
                                    <div className="flex-grow-1">
                                      <h6 className="mt-0 mb-1 fs-13 fw-semibold">
                                        {notification.roomType === 'direct' ? notification.senderName : notification.roomName}
                                      </h6>
                                      <div className="fs-13 text-muted">
                                        {notification.roomType !== 'direct' && (
                                          <div className="d-flex align-items-center mb-1">
                                            <span className="fw-medium me-1">{notification.senderName}:</span>
                                            <span className="badge bg-info-subtle text-info fs-10 me-1">{getRoleDisplayName(notification.senderRole)}</span>
                                          </div>
                                        )}
                                        <p className="mb-1 text-truncate" style={{ maxWidth: '200px' }}>
                                          {notification.content}
                                        </p>
                                      </div>
                                      <p className="mb-0 fs-11 fw-medium text-uppercase text-muted">
                                        <span><i className="mdi mdi-clock-outline" /> {formatNotificationTime(notification.timestamp)}</span>
                                      </p>
                                    </div>
                                    {!notification.isRead && (
                                      <div className="flex-shrink-0">
                                        <div className="badge bg-primary rounded-pill"></div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          {chatNotifications.length > 5 && (
                            <div className="text-center py-2">
                              <Link to="/Chat" className="text-muted fs-12">
                                View {chatNotifications.length - 5} more messages...
                              </Link>
                            </div>
                          )}
                          <div className="dropdown-divider my-2"></div>
                        </>
                      )}
                      
                      {chatNotifications.length === 0 && (
                        <div className="text-center py-4">
                          <div className="avatar-md mx-auto mb-3">
                            <div className="avatar-title bg-info-subtle text-info rounded-circle fs-36">
                              <i className="bx bx-message" />
                            </div>
                          </div>
                          <h5 className="mb-2">No New Messages</h5>
                          <p className="text-muted fs-13">Start a conversation in the <Link to="/Chat" className="text-decoration-none">Team Chat</Link></p>
                        </div>
                      )}
                      
                      <div className="my-3 text-center view-all">
                        <Link to="/Chat" className="btn btn-soft-success waves-effect waves-light">
                          Open Team Chat <i className="ri-arrow-right-line align-middle" />
                        </Link>
                      </div>
                    </div>
                  </div>
                  <div className="tab-pane fade py-2 ps-2" id="tasks-tab" role="tabpanel" aria-labelledby="tasks-tab">
                    <div data-simplebar style={{maxHeight: 300}} className="pe-2">
                      {/* Task Notifications */}
                      {taskNotifications.length > 0 && (
                        <>
                          <div className="px-3 mb-2">
                            <div className="d-flex justify-content-between align-items-center">
                              <h6 className="text-muted text-uppercase mb-0 fs-11">Assigned Tasks</h6>
                              {unreadTaskCount > 0 && (
                                <button 
                                  type="button" 
                                  className="btn btn-link btn-sm text-muted p-0"
                                  onClick={clearAllTaskNotifications}
                                  title="Mark all as read"
                                >
                                  <i className="ri-check-double-line me-1"></i>Clear all
                                </button>
                              )}
                            </div>
                          </div>
                          {taskNotifications.slice(0, 5).map((notification) => (
                            <div 
                              key={notification.id} 
                              className={`text-reset notification-item d-block dropdown-item ${notification.isRead ? '' : 'bg-light-subtle'}`}
                              onClick={() => handleTaskNotificationClick(notification.taskId)}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="d-flex">
                                <div className="avatar-xs me-3 flex-shrink-0">
                                  <span className="avatar-title bg-info-subtle text-info rounded-circle fs-16">
                                    <i className="ri-task-line" />
                                  </span>
                                </div>
                                <div className="flex-grow-1">
                                  <div className="d-flex align-items-start justify-content-between">
                                    <div className="flex-grow-1">
                                      <h6 className="mt-0 mb-1 fs-13 fw-semibold text-truncate" style={{ maxWidth: '200px' }}>
                                        {notification.taskTitle}
                                      </h6>
                                      <div className="d-flex align-items-center mt-1">
                                        <span className={`badge ${getPriorityClass(notification.priority)} me-2`}>
                                          {getPriorityDisplayName(notification.priority)}
                                        </span>
                                        <span className={`badge ${getDueDateClass(notification.dueDate)}`}>
                                          {formatDueDate(notification.dueDate)}
                                        </span>
                                      </div>
                                      <p className="mb-0 fs-11 fw-medium text-uppercase text-muted mt-2">
                                        <span><i className="mdi mdi-clock-outline" /> {formatNotificationTime(notification.timestamp)}</span>
                                        <span className="mx-1">•</span>
                                        <span>{getRoleDisplayName(notification.assignedByRole)}: {notification.assignedBy}</span>
                                      </p>
                                    </div>
                                    {!notification.isRead && (
                                      <div className="flex-shrink-0">
                                        <div className="badge bg-primary rounded-pill"></div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          {taskNotifications.length > 5 && (
                            <div className="text-center py-2">
                              <button 
                                className="btn btn-link text-muted fs-12"
                                onClick={() => {
                                  // Mark all as read and navigate to tasks page
                                  setTaskNotifications(prev => 
                                    prev.map(notif => ({ ...notif, isRead: true }))
                                  );
                                  setUnreadTaskCount(0);
                                  navigate('/dashboard');
                                }}
                              >
                                View {taskNotifications.length - 5} more tasks...
                              </button>
                            </div>
                          )}
                          <div className="dropdown-divider my-2"></div>
                        </>
                      )}
                      
                      {taskNotifications.length === 0 && (
                        <div className="text-center py-4">
                          <div className="avatar-md mx-auto mb-3">
                            <div className="avatar-title bg-info-subtle text-info rounded-circle fs-36">
                              <i className="ri-task-line" />
                            </div>
                          </div>
                          <h5 className="mb-2">No New Task Assignments</h5>
                          <p className="text-muted fs-13">You have no new task assignments</p>
                        </div>
                      )}
                      
                      <div className="my-3 text-center view-all">
                        <button 
                          className="btn btn-soft-success waves-effect waves-light"
                          onClick={() => {
                            // Mark all task notifications as read and navigate to dashboard
                            setTaskNotifications(prev => 
                              prev.map(notif => ({ ...notif, isRead: true }))
                            );
                            setUnreadTaskCount(0);
                            navigate('/dashboard');
                          }}
                        >
                          View All Tasks <i className="ri-arrow-right-line align-middle" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="tab-pane fade p-4" id="alerts-tab" role="tabpanel" aria-labelledby="alerts-tab" />
                  <div className="notification-actions" id="notification-actions">
                    <div className="d-flex text-muted justify-content-center">
                      Select <div id="select-content" className="text-body fw-semibold px-1">0</div> Result <button type="button" className="btn btn-link link-danger p-0 ms-3" data-bs-toggle="modal" data-bs-target="#removeNotificationModal">Remove</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

              <div className="dropdown ms-sm-3 header-item topbar-user">
                <button
                  type="button"
                  className="btn"
                  id="page-header-user-dropdown"
                  data-bs-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  <span className="d-flex align-items-center">
                     <img 
                    src={leadCrmUser?.profileImage ? `${staticFilesBaseURL}/${leadCrmUser.profileImage.split('?')[0]}?t=${new Date().getTime()}` : `${process.env.REACT_APP_BASE_URL}assets/admin-logo.png`} 
                    alt="Header Avatar" 
                    className="rounded-circle header-profile-user"
                    onError={(e) => {
                      
                      e.target.onerror = null;
                      e.target.src = `${process.env.REACT_APP_BASE_URL}assets/admin-logo.png`;
                    }}
                  />
                    <span className="text-start ms-xl-2">
                      <span className="d-none d-xl-inline-block ms-1 fw-medium user-name-text">
                        {leadCrmUser?.name || 'User'}
                      </span>
                      <span className="d-none d-xl-block ms-1 fs-12 user-name-sub-text">
                        {userRole === 'ADMIN' ? 'System Administrator' : 
                         userDesignation ? userDesignation : 'User'}
                      </span>
                    </span>
                  </span>
                </button>
                <div className="dropdown-menu dropdown-menu-end">
                  {/* item*/}
                  <h6 className="dropdown-header">
                    Hello {userRole === 'ADMIN' ? 'Administrator' : 
                             userRole === 'TL' ? 'Team Leader' : 
                             userRole === 'EXEC' ? 'Executive' : 
                             userRole === 'EMPL' ? 'Employee' : 
                             userRole === 'QA_TESTER' ? 'QA Tester' : 'User'}!
                  </h6>
                  <a className="dropdown-item" href="/UserProfile"><i className="mdi mdi-account-circle text-muted fs-16 align-middle me-1" /> <span className="align-middle">Profile</span></a>
                  {/* <a className="dropdown-item" href="apps-chat.html"><i className="mdi mdi-message-text-outline text-muted fs-16 align-middle me-1" /> <span className="align-middle">Messages</span></a>
                  <a className="dropdown-item" href="apps-tasks-kanban.html"><i className="mdi mdi-calendar-check-outline text-muted fs-16 align-middle me-1" /> <span className="align-middle">Taskboard</span></a>
                  <a className="dropdown-item" href="pages-faqs.html"><i className="mdi mdi-lifebuoy text-muted fs-16 align-middle me-1" /> <span className="align-middle">Help</span></a> */}
                  <div className="dropdown-divider" />
                  {/* <a className="dropdown-item" href="pages-profile.html"><i className="mdi mdi-wallet text-muted fs-16 align-middle me-1" /> <span className="align-middle">Balance : <b>$5971.67</b></span></a> */}
                  {/* <a className="dropdown-item" href="pages-profile-settings.html"><span className="badge bg-success-subtle text-success mt-1 float-end">New</span><i className="mdi mdi-cog-outline text-muted fs-16 align-middle me-1" /> <span className="align-middle">Settings</span></a> */}
                  {/* <a className="dropdown-item" href="auth-lockscreen-basic.html"><i className="mdi mdi-lock text-muted fs-16 align-middle me-1" /> <span className="align-middle">Lock screen</span></a> */}
                  <NavLink
                    className="dropdown-item"
                    to="/Login"
                    onClick={handleLogout}
                  >
                    <i className="mdi mdi-logout text-muted fs-16 align-middle me-1" />
                    <span className="align-middle" data-key="t-logout">
                      Logout
                    </span>
                  </NavLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
     {/* removeNotificationModal */}
    <div id="removeNotificationModal" className="modal fade zoomIn" tabIndex={-1} aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" id="NotificationModalbtn-close" />
          </div>
          <div className="modal-body">
            <div className="mt-2 text-center">
              <lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style={{width: 100, height: 100}} />
              <div className="mt-4 pt-2 fs-15 mx-4 mx-sm-5">
                <h4>Are you sure ?</h4>
                <p className="text-muted mx-4 mb-0">Are you sure you want to remove this Notification ?</p>
              </div>
            </div>
            <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
              <button type="button" className="btn w-sm btn-light" data-bs-dismiss="modal">Close</button>
              <button type="button" className="btn w-sm btn-danger" id="delete-notification">Yes, Delete It!</button>
            </div>
          </div>
        </div>{/* /.modal-content */}
      </div>{/* /.modal-dialog */}
    </div>{/* /.modal */}
      {/* ========== App Menu ========== */}
      <div className={`app-menu navbar-menu ${isSidebarCollapsed ? 'sidebar-hidden' : ''}`} data-sidebar={isDarkMode ? 'dark' : 'light'}>
        {/* LOGO */}
        <div className="navbar-brand-box">
          {/* Conditional Logo based on theme */}
          <a href="index.html" className={`logo ${isDarkMode ? 'logo-light' : 'logo-dark'}`}>
            <span className="logo-sm">
              <img
                src={`${process.env.REACT_APP_BASE_URL}assets/ip.png`}
                alt=""
                height={55}
              />
            </span>
            <span className="logo-lg">
              <img
                src={`${process.env.REACT_APP_BASE_URL}assets/${isDarkMode ? 'ipshopy-wh.png': 'ipshopy-logo.png'}`}
                alt="Ipshopy"
                height={isDarkMode ? 25:25}
              />
            </span>
          </a>
          <button
            type="button"
            className="btn btn-sm p-0 fs-20 header-item float-end btn-vertical-sm-hover"
            id="vertical-hover"
          >
            <i className="ri-record-circle-line" />
          </button>
        </div>
        <div id="scrollbar" className="custom-scrollbar">
          <div className="container-fluid">
            <div id="two-column-menu"></div>
            <ul className="navbar-nav" id="navbar-nav" style={{marginLeft: "-25px"}}>
              <li className="menu-title">
                <span data-key="t-menu">Menu</span>
              </li>
              
              {/* Role-Based Navigation */}
              {isAdmin && (
                <>
                  {/* Admin Dashboard */}
                  <li className="nav-item">
                    <NavLink
                      className="nav-link"
                      to={`/admin/dashboard`}
                      role="button"
                      aria-expanded="false"
                      data-tooltip="Admin Dashboard"
                      onClick={closeMobileSidebar}
                    >
                      <i className="ri-dashboard-line" />
                      <span data-key="Admin Dashboard"> Dashboard</span>
                    </NavLink>
                  </li>
                  
                  <li className="nav-item">
                  <NavLink
                    to="/departments"
                    className="nav-link"
                    style={{whiteSpace: "nowrap"}}
                    data-key="departments"
                    onClick={closeMobileSidebar}
                  >
                    <i className="ri-building-2-line"></i>
                    <span>Departments</span>
                  </NavLink>
                </li>

                    <li className="nav-item">
                  <NavLink
                    to="/admin/task-file-management"
                    className="nav-link"
                    style={{whiteSpace: "nowrap"}}
                    data-key="task-file-management"
                    onClick={closeMobileSidebar}
                  >
                    <i className="ri-file-transfer-line me-2"></i>
                    <span>Upload task sheet</span>
                  </NavLink>
                </li>

                
                    <li className="nav-item">
                  <NavLink
                    to="/admin/notices"
                    className="nav-link"
                    style={{whiteSpace: "nowrap"}}
                    data-key="notices"
                    onClick={closeMobileSidebar}
                  >
                    <i className="ri-notification-3-line me-2"></i>

                    <span>Publish notice</span>
                  </NavLink>
                </li>
                  
                  {/* Admin specific navigation
                  <li className="nav-item">
                    <button
                      className="nav-link menu-link"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target="#sidebarDepartments"
                      role="button"
                      aria-expanded="false"
                      aria-controls="sidebarDepartments"
                      data-tooltip="Departments"
                      style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
                    >
                      <i className="ri-building-2-line" />
                      <span data-key="Departments" style={{whiteSpace: 'nowrap'}}>Departments</span>

                    </button>
                    <div className="collapse menu-dropdown" id="sidebarDepartments">
                      <ul className="nav nav-sm flex-column">
                        <li className="nav-item">
                          <NavLink
                            to="/departments"
                            className="nav-link"
                            style={{whiteSpace: "nowrap"}}
                            data-key="departments-list"
                            onClick={closeMobileSidebar}
                          >
                            <i className="ri-building-line me-2"></i>
                                    Departments Info
                          </NavLink>
                        </li>
                        <li className="nav-item">
                          <NavLink
                            to="/DepartmentManagement"
                            className="nav-link"
                            style={{whiteSpace: "nowrap"}}
                            data-key="department-management"
                            onClick={closeMobileSidebar}
                          >
                            <i className="ri-settings-line me-2"></i>
                            Department list
                          </NavLink>
                        </li>
                      </ul>
                    </div>
                  </li> */}
                    {/* Admin Task Management - New Navigation Section */}
                  <li className="nav-item">
                    <button
                      className="nav-link menu-link"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target="#sidebarTaskManagement"
                      role="button"
                      aria-expanded="false"
                      aria-controls="sidebarTaskManagement"
                      data-tooltip="Task Management"
                      style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
                    >
                      <i className="ri-task-line" />
                      <span data-key="Task Management" style={{whiteSpace: 'nowrap'}}>Task Management</span>
                    </button>
                    <div className="collapse menu-dropdown" id="sidebarTaskManagement">
                      <ul className="nav nav-sm flex-column">
                        <li className="nav-item">
                          <NavLink
                            to="/admin/assign-task"
                            className="nav-link"
                            style={{whiteSpace: "nowrap"}}
                            data-key="assign-task"
                            onClick={closeMobileSidebar}
                          >
                            <i className="ri-add-circle-line me-2"></i>
                            Assign Task
                          </NavLink>
                        </li>
                        <li className="nav-item">
                          <NavLink
                            to="/admin/task_Approvel"
                            className="nav-link"
                            style={{whiteSpace: "nowrap"}}
                            data-key="task-review"
                            onClick={closeMobileSidebar}
                          >
                            <i className="ri-eye-line me-2"></i>
                            Task Review
                          </NavLink>
                        </li>
                        <li className="nav-item">
                          <NavLink
                            to="/admin/dm-approved-tasks"
                            className="nav-link"
                            style={{whiteSpace: "nowrap"}}
                            data-key="dm-approved-tasks"
                            onClick={closeMobileSidebar}
                          >
                            <i className="ri-check-double-line me-2"></i>
                            DM Approved Tasks
                          </NavLink>
                        </li>
                      
                      </ul>
                    </div>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      to="/admin/employee-tasks"
                      className="nav-link"
                      style={{whiteSpace: "nowrap"}}
                      data-key="employee-tasks"
                      onClick={closeMobileSidebar}
                    >
                      <i className="ri-task-line me-2"></i>
                      <span>Employees all tasks</span>
                    </NavLink>
                  </li>
                 <li className="nav-item">
                  <NavLink
                    to="/admin/employee-calendar"
                    className="nav-link"
                    style={{whiteSpace: "nowrap"}}
                    data-key="employee-calendar"
                    onClick={closeMobileSidebar}
                  >
                  <i className="ri-calendar-line me-2"></i>
                    <span>Employee Activity</span>
                  </NavLink>
                </li>
                  <li className="nav-item">
                  <NavLink
                    to="/admin/all-employees"
                    className="nav-link"
                    style={{whiteSpace: "nowrap"}}
                    data-key="all-employees-management"
                    onClick={closeMobileSidebar}
                  >
                     <i className="ri-group-line me-2"></i>
                    <span>All Employees</span>
                  </NavLink>
                </li>
                  <li className="nav-item">
                  <NavLink
                    to="/admin/employees/without-tasks"
                    className="nav-link"
                    style={{whiteSpace: "nowrap"}}
                    data-key="employees-without-tasks"
                    onClick={closeMobileSidebar}
                  >
                     <i className="ri-user-line me-2"></i>
                    <span>Employees without tasks</span>
                  </NavLink>
                </li>
                    
               
                </>
              )}
              
              {/* Department Manager Navigation - Only visible to users who are department managers */}
              {isTeamLeader && isDepartmentManager && (
                <>
                <li className="nav-item">
                  <NavLink
                    to="/department-manager"
                    className="nav-link"
                    style={{whiteSpace: "nowrap"}}
                    data-key="employee-management-dm"
                    onClick={closeMobileSidebar}
                  >
                    <i className="ri-bar-chart-line me-2"></i>
                    <span>Department Dashboard</span>
                  </NavLink>
                </li>
                  {/* Task Files - Moved to be a separate parent link */}
                <li className="nav-item">
                  <NavLink
                    to="/department-manager/task-files"
                    className="nav-link"
                    style={{whiteSpace: "nowrap"}}
                    data-key="task-files-dm"
                    onClick={closeMobileSidebar}
                  >
                    <i className="ri-file-list-line me-2"></i>
                    <span>Task Sheets</span>
                  </NavLink>
                </li>
                 <li className="nav-item">
                  <NavLink
                    to="/department-manager/assign-task"
                    className="nav-link"
                    style={{whiteSpace: "nowrap"}}
                    data-key="Assign Task"
                    onClick={closeMobileSidebar}
                  >
                    <i className="ri-add-circle-line me-2"></i>
                    <span>Assign New Task</span>
                  </NavLink>
                </li>
                {/* <li className="nav-item">
                  <NavLink
                    to="/department-manager/tester-approved-tasks"
                    className="nav-link"
                    style={{whiteSpace: "nowrap"}}
                    data-key="tester-approved-tasks"
                  >
                    <i className="ri-check-double-line me-2"></i>
                    <span>Tester Approved Tasks</span>
                  </NavLink>
                </li> */}
                <li className="nav-item">
                  <button
                    className="nav-link menu-link"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#sidebarDepartmentManager"
                    role="button"
                    aria-expanded="false"
                    aria-controls="sidebarDepartmentManager"
                    data-tooltip="Department Management"
                    style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
                  >
                    <i className="ri-building-4-line" />
                    <span data-key="Department Management" style={{whiteSpace: 'nowrap'}}>Department Tools</span>
                  </button>
                  <div className="collapse menu-dropdown" id="sidebarDepartmentManager">
                    <ul className="nav nav-sm flex-column">
                      {/* <li className="nav-item">
                        <NavLink
                          to="/department-manager"
                          className="nav-link"
                          style={{whiteSpace: "nowrap"}}
                          data-key="employee-management-dm"
                        >
                          <i className="ri-group-line me-2"></i>
                          Department Dashboard
                        </NavLink>
                      </li> */}
                      <li className="nav-item">
                        <NavLink
                          to="/department-manager/add-employee"
                          className="nav-link"
                          style={{whiteSpace: "nowrap"}}
                          data-key="add-employee-dm"
                          onClick={closeMobileSidebar}
                        >
                          <i className="ri-user-add-line me-2"></i>
                          Add Employee
                        </NavLink>
                      </li>
                      <li className="nav-item">
                        <NavLink
                          to="/department-manager/assign-employees"
                          className="nav-link"
                          style={{whiteSpace: "nowrap"}}
                          data-key="assign-employees-dm"
                          onClick={closeMobileSidebar}
                        >
                          <i className="ri-user-shared-line me-2"></i>
                          Assign Employees
                        </NavLink>
                      </li>
                      <li className="nav-item">
                        <NavLink
                          to={departmentId ? `/department-manager/daily-routine-tasks/${departmentId}` : "/department-manager/daily-routine-tasks"}
                          className="nav-link"
                          style={{whiteSpace: "nowrap"}}
                          data-key="daily-routine-tasks-dm"
                          onClick={closeMobileSidebar}
                        >
                          <i className="ri-task-line me-2"></i>
                          Daily Routine Tasks
                        </NavLink>
                      </li>
                      <li className="nav-item">
                        <NavLink
                          to={`/department-manager/calendar`}
                          className="nav-link"
                          style={{whiteSpace: "nowrap"}}
                          data-key="department-calendar"
                          onClick={closeMobileSidebar}
                        >
                           <i className="ri-calendar-line" />
                          Employee Activity
                        </NavLink>
                      </li>

                      {/* <li className="nav-item">
                        <NavLink
                          to="/department-manager/task-files"
                          className="nav-link"
                          style={{whiteSpace: "nowrap"}}
                          data-key="task-files-dm"
                        >
                          <i className="ri-file-list-line me-2"></i>
                          Task Files
                        </NavLink>
                      </li> */}
                    </ul>
                </div>
              </li>
              {/* Department Manager Calendar - Outside the Department Management menu
              <li className="nav-item">
                <NavLink
                  className="nav-link"
                  to={`/department-manager/calendar`}
                  role="button"
                  aria-expanded="false"
                  data-tooltip="Department Calendar"
                >
                  <i className="ri-calendar-line" />
                  <span data-key="Department Calendar">Department Calendar</span>
                </NavLink>
              </li> */}
              </>
              )}
            
              {/* Team Leader specific navigation - Always visible for TL users */}
              {isTeamLeader && (
                <>
                  {/* Team Leader Dashboard */}
                  <li className="nav-item">
                    <NavLink
                      className="nav-link"
                      to={`/tl/dashboard`}
                      role="button"
                      aria-expanded="false"
                      data-tooltip="Team Leader Dashboard"
                      onClick={closeMobileSidebar}
                    >
                      <i className="ri-dashboard-line" />
                      <span data-key="Team Leader Dashboard"> My Dashboard</span>
                    </NavLink>
                  </li>
                 
                  {/* Nested Task Management for Team Leaders */}
                  <li className="nav-item">
                    <button
                      className="nav-link menu-link"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target="#sidebarTeamLeaderTasks"
                      role="button"
                      aria-expanded="false"
                      aria-controls="sidebarTeamLeaderTasks"
                      data-tooltip="Task Management"
                      style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
                    >
                      <i className="ri-task-line" />
                      <span data-key="Task Management">Task Management</span>

                    </button>
                    <div className="collapse menu-dropdown" id="sidebarTeamLeaderTasks">
                      <ul className="nav nav-sm flex-column">
                        <li className="nav-item">
                          <NavLink
                            to="/team-leader/assigned-tasks"
                            className="nav-link"
                            style={{whiteSpace: "nowrap"}}
                            data-key="assigned-tasks"
                            onClick={closeMobileSidebar}
                          >
                            <i className="ri-list-check me-2"></i>
                            Assigned Tasks
                          </NavLink>
                        </li>
                        <li className="nav-item">
                          <NavLink
                            to="/team-leader/my-tasks"
                            className="nav-link"
                            style={{whiteSpace: "nowrap"}}
                            data-key="my-tasks"
                            onClick={closeMobileSidebar}
                          >
                            <i className="ri-user-line me-2"></i>
                            My Tasks
                          </NavLink>
                        </li>
                       
                        <li className="nav-item">
                          <NavLink
                            to="/team-leader/task-review"
                            className="nav-link"
                            style={{whiteSpace: "nowrap"}}
                            data-key="task-review"
                            onClick={closeMobileSidebar}
                          >
                            <i className="ri-eye-line me-2"></i>
                            Task Review
                          </NavLink>
                        </li>
                          {isTeamLeader && isDepartmentManager && <li className="nav-item">
                            <NavLink
                              to="/department-manager/tester-approved-tasks"
                              className="nav-link"
                              style={{whiteSpace: "nowrap"}}
                              data-key="tester-approved-tasks"
                              onClick={closeMobileSidebar}
                            >
                              <i className="ri-check-double-line me-2"></i>
                              Tester Approved Tasks
                            </NavLink>
                          </li>}
                      </ul>
                    </div>
                  </li>
                   <li className="nav-item">
                    <NavLink
                      className="nav-link"
                      to={`/MyTeam`}
                      role="button"
                      aria-expanded="false"
                      data-tooltip="My Team"
                      onClick={closeMobileSidebar}
                    >
                      <i className="ri-team-line" />
                      <span data-key="My Team">My Team</span>
                    </NavLink>
                  </li>
                  {/* Team Leader Calendar - Outside the Task Management menu */}
                  <li className="nav-item">
                    <NavLink
                      className="nav-link"
                      to={`/team-leader/calendar`}
                      role="button"
                      aria-expanded="false"
                      data-tooltip="My Calendar"
                      onClick={closeMobileSidebar}
                    >
                      <i className="ri-calendar-line" />
                      <span data-key="My Calendar">My Activity</span>
                    </NavLink>
                  </li>
                   
                  <li className="nav-item">
                    <NavLink
                      className="nav-link"
                      to={`/team-leader/notices`}
                      role="button"
                      aria-expanded="false"
                      data-tooltip="Notices"
                      onClick={closeMobileSidebar}
                    >
                      <i className="ri-notification-3-line" />
                  
                    <span data-key="Notices">Notices</span>
                      </NavLink>
                  </li>
                </>
              )}

              {/* Employee specific navigation - Always visible for EXEC users */}
              {(isExecutive || userRole === 'EMPL') && (
                <>
                  <li className="nav-item">
                    <NavLink
                      className="nav-link"
                      to={`/employee/dashboard`}
                      role="button"
                      aria-expanded="false"
                      data-tooltip="Employee Dashboard"
                      onClick={closeMobileSidebar}
                    >
                      <i className="ri-dashboard-line" />
                      <span data-key="Employee Dashboard">Dashboard</span>
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      className="nav-link"
                      to={`/employee/tasks`}
                      role="button"
                      aria-expanded="false"
                      data-tooltip="My Tasks"
                      onClick={closeMobileSidebar}
                    >
                      <i className="ri-task-line" />
                      <span data-key="My Tasks">My Tasks</span>
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      className="nav-link"
                      to={`/employee/notices`}
                      role="button"
                      aria-expanded="false"
                      data-tooltip="Notices"
                    >
                      <i className="ri-notification-3-line" />
                      <span data-key="Notices">Notices</span>
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      className="nav-link"
                      to={`/employee/tasks/records`}
                      role="button"
                      aria-expanded="false"
                      data-tooltip="Task Records"
                    >
                      <i className="ri-file-list-line" />
                      <span data-key="Task Records">Task Records</span>
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      className="nav-link"
                      to={`/employee/calendar`}
                      role="button"
                      aria-expanded="false"
                      data-tooltip="My Calendar"
                    >
                      <i className="ri-calendar-line" />
                      <span data-key="My Calendar">My Activity</span>
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      className="nav-link"
                      to={`/employee/team`}
                      role="button"
                      aria-expanded="false"
                      data-tooltip="My Team"
                    >
                      <i className="ri-group-line" />
                      <span data-key="My Team">My Team</span>
                    </NavLink>
                  </li>
                  {/* Add Task Performance link for Employees */}
                
                </>
              )}
              {(isQaTester || userRole ==='QA_TESTER') && (
                <>
                  <li className="nav-item">
                    <NavLink
                      className="nav-link"
                      to={`/employee/dashboard`}
                      role="button"
                      aria-expanded="false"
                      data-tooltip="Employee Dashboard"
                    >
                      <i className="ri-dashboard-line" />
                      <span data-key="Employee Dashboard">Dashboard</span>
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      className="nav-link"
                      to={`/qa-tester/dashboard`}
                      role="button"
                      aria-expanded="false"
                      data-tooltip="QA Tester Dashboard"
                    >
                      <i className="ri-bar-chart-line" />
                      <span data-key="QA Tester Dashboard">QA Dashboard</span>
                    </NavLink>
                  </li>
                   <li className="nav-item">
                    <NavLink
                      className="nav-link"
                      to={`/qa-tester/tasks`}
                      role="button"
                      aria-expanded="false"
                      data-tooltip="Testing Tasks"
                    >
                      <i className="ri-task-line" />
                      <span data-key="My Testing Tasks">Testing Tasks</span>
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      className="nav-link"
                      to={`/employee/tasks`}
                      role="button"
                      aria-expanded="false"
                      data-tooltip="My Tasks"
                    >
                      <i className="ri-task-line" />
                      <span data-key="My Tasks">My Tasks</span>
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      className="nav-link"
                      to={`/employee/notices`}
                      role="button"
                      aria-expanded="false"
                      data-tooltip="Notices"
                    >
                      <i className="ri-notification-3-line" />
                      <span data-key="Notices">Notices</span>
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      className="nav-link"
                      to={`/employee/tasks/records`}
                      role="button"
                      aria-expanded="false"
                      data-tooltip="Task Records"
                    >
                      <i className="ri-file-list-line" />
                      <span data-key="Task Records">Task Records</span>
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      className="nav-link"
                      to={`/employee/calendar`}
                      role="button"
                      aria-expanded="false"
                      data-tooltip="My Calendar"
                    >
                      <i className="ri-calendar-line" />
                      <span data-key="My Calendar">My Activity</span>
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      className="nav-link"
                      to={`/employee/team`}
                      role="button"
                      aria-expanded="false"
                      data-tooltip="My Team"
                    >
                      <i className="ri-group-line" />
                      <span data-key="My Team">My Team</span>
                    </NavLink>
                  </li>
                  {/* Add Task Performance link for Employees */}
                
                </>
              )}
              
              {/* Navigation for QA Testers */}
              {/* {(isQaTester) && (
                <>
                  <li className="nav-item">
                    <NavLink
                      className="nav-link"
                      to={`/qa-tester/tasks`}
                      role="button"
                      aria-expanded="false"
                      data-tooltip="QA Tester Dashboard"
                    >
                      <i className="ri-dashboard-line" />
                      <span data-key="QA Tester Dashboard">Dashboard</span>
                    </NavLink>
                  </li>
                 
                  <li className="nav-item">
                    <NavLink
                      className="nav-link"
                      to={`/notices`}
                      role="button"
                      aria-expanded="false"
                      data-tooltip="Notices"
                    >
                      <i className="ri-notification-3-line" />
                      <span data-key="Notices">Notices</span>
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      className="nav-link"
                      to={`/employee/calendar`}
                      role="button"
                      aria-expanded="false"
                      data-tooltip="My Calendar"
                    >
                      <i className="ri-calendar-line" />
                      <span data-key="My Calendar">My Activity</span>
                    </NavLink>
                  </li>
                </>
              )} */}
            
              {/* Common Navigation for all authenticated users */}
              {/* <li className="nav-item">
                <NavLink
                  className="nav-link"
                  to={`/chat`}
                  role="button"
                  aria-expanded="false"
                  data-tooltip="Team Chat"
                >
                  <i className="ri-message-3-line" />
                  <span data-key="Chat">Team Chat</span>
                </NavLink>
              </li> */}
              
              <li className="nav-item">
                <NavLink
                  className="nav-link"
                  to={`/UserProfile`}
                  role="button"
                  aria-expanded="false"
                  data-tooltip="Profile"
                >
                  <i className="ri-user-settings-line" />
                  <span data-key="Profile">Profile</span>
                </NavLink>
              </li>
              
              {/* Logout button for all roles */}
              <li className="nav-item">
                <NavLink
                  className="nav-link"
                  to={`/Login`}
                  role="button"
                  aria-expanded="false"
                  data-tooltip="Logout"
                  onClick={() => {
                    // Clear user data from localStorage
                    localStorage.removeItem('lead_crm_user');
                    localStorage.removeItem('lead_crm_token');
                    localStorage.removeItem('user_role');
                    // Reload the page to ensure clean state
                    window.location.reload();
                  }}
                >
                  <i className="ri-logout-box-line" />
                  <span data-key="Logout">Logout</span>
                </NavLink>
              </li>

              {/* Hide all legacy navigation items for Lead CRM users */}
              {!isLeadCrmAuthenticated && (
              <>
              <li className="nav-item">
                <button
                  className="nav-link menu-link"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#sidebarLetterManagement"
                  role="button"
                  aria-expanded="false"
                  aria-controls="sidebarLetterManagement"
                  style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
                >
                  <i className="ri-mail-check-line" />
                  <span data-key="t-dashboards" style={{whiteSpace: 'nowrap'}}>Letter management </span>
                </button>
                <div className="collapse menu-dropdown" id="sidebarLetterManagement">
                  <ul className="nav nav-sm flex-column">
                    <li className="nav-item">
                      <Link
                        to={""}
                        className="nav-link"
                        role="button"
                        aria-expanded="false"
                        aria-controls="sidebarComposeLetter"
                        style={{whiteSpace: "nowrap"}}
                        data-key="t-email"
                      >
                        Compose Letter
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link
                        to={""}
                        className="nav-link"
                        role="button"
                        aria-expanded="false"
                        aria-controls="sidebarSentHistory"
                        style={{whiteSpace: "nowrap"}}
                        data-key="t-email"
                      >
                        Sent History
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link
                        to={"/NewLetter"}
                        className="nav-link"
                        role="button"
                        aria-expanded="false"
                        aria-controls="sidebarNewLetter"
                        style={{whiteSpace: "nowrap"}}
                        data-key="t-email"
                      >
                        New letter
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link
                        to={"/LetterList"}
                        className="nav-link"
                        role="button"
                        aria-expanded="false"
                        aria-controls="sidebarLetterList"
                        style={{whiteSpace: "nowrap"}}
                        data-key="t-email"
                      >
                       Letter List
                      </Link>
                    </li>
                  </ul>
                </div>
              </li>
              <li className="nav-item">
                <button
                  className="nav-link menu-link"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#sidebarLeave"
                  role="button"
                  aria-expanded="false"
                  aria-controls="sidebarLeave"
                  style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
                >
                  <i className="ri-share-forward-2-line" />
                  <span data-key="t-dashboards">Leave </span>
                </button>
                <div className="collapse menu-dropdown" id="sidebarLeave">
                  <ul className="nav nav-sm flex-column">
                    <li className="nav-item">
                      <Link
                        to={""}
                        className="nav-link"
                        role="button"
                        aria-expanded="false"
                        aria-controls="sidebarCompanyHoliday"
                        data-key="t-email"
                        style={{
                          display: "inline-block",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Company Holiday Calendar
                      </Link>
                    </li>
                  </ul>
                </div>
              </li>

              <li className="nav-item">
                <NavLink
                  className="nav-link"
                  to={"/"}
                  role="button"
                  aria-expanded="false"
                  aria-controls="sidebarApps"
                >
                  <i className="ri-calendar-check-line" />
                  <span data-key="t-apps">Attendance</span>
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink
                  className="nav-link menu-link"
                  to={`/CompanyMaster`}
                  data-bs-toggle="collapse"
                  role="button"
                  aria-expanded="false"
                  aria-controls="sidebarApps"
                >
                  <i className="ri-apps-2-line" />
                  <span data-key="t-apps">Masters</span>
                </NavLink>
                <div className="collapse menu-dropdown" id="sidebarMasters">
                  <ul className="nav nav-sm flex-column">
                    <li className="nav-item">
                      <a
                        href="#sidebarLeaveMasters"
                        className="nav-link"
                        data-bs-toggle="collapse"
                        role="button"
                        aria-expanded="false"
                        aria-controls="sidebarLeaveMasters"
                        style={{whiteSpace: "nowrap"}}
                        data-key="t-email"
                      >
                        Leave Masters
  
                      </a>
                      <div className="collapse menu-dropdown" id="sidebarLeaveMasters">
                        <ul className="nav nav-sm flex-column">
                          <li className="nav-item">
                            <NavLink
                              to={`LeaveType`}
                              className="nav-link"
                              style={{whiteSpace: "nowrap"}}
                              data-key="t-mailbox"
                            >
                              
                              Leave Type
                            </NavLink>
                          </li>
                          <li className="nav-item">
                            <NavLink
                              to={`LeaveTypeList`}
                              className="nav-link"
                              style={{whiteSpace: "nowrap"}}
                              data-key="t-mailbox"
                            >
                              
                              Leave Type List
                            </NavLink>
                          </li>
                        </ul>
                      </div>
                    </li>
                  </ul>
                </div>
              </li>
              <li className="nav-item">
                <NavLink
                  className="nav-link menu-link"
                  to={`/CompanyMaster`}
                  data-bs-toggle="collapse"
                  role="button"
                  aria-expanded="false"
                  aria-controls="sidebarApps"
                >
                  <i className=" ri-apps-2-line" />
                  <span data-key="t-apps">Masters</span>
                </NavLink>
                <div className="collapse menu-dropdown" id="sidebarMasters">
                  <ul className="nav nav-sm flex-column">
                    <li className="nav-item">
                      <a
                        href="#sidebarLeaveMasters"
                        className="nav-link"
                        data-bs-toggle="collapse"
                        role="button"
                        aria-expanded="false"
                        aria-controls="sidebarLeaveMasters"
                        style={{whiteSpace: "nowrap"}}
                        data-key="t-email"
                      >
                        Leave Masters
                      </a>
                      <div className="collapse menu-dropdown" id="sidebarLeaveMasters">
                        <ul className="nav nav-sm flex-column">
                          <li className="nav-item">
                            <NavLink
                              to={`LeaveType`}
                              className="nav-link"
                              style={{whiteSpace: "nowrap"}}
                              data-key="t-mailbox"
                            >
                              
                              Leave Type
                            </NavLink>
                          </li>
                          <li className="nav-item">
                            <NavLink
                              to={`LeaveTypeList`}
                              className="nav-link"
                              style={{whiteSpace: "nowrap"}}
                              data-key="t-mailbox"
                            >
                              
                              Leave Type List
                            </NavLink>
                          </li>
                        </ul>
                      </div>
                    </li>
                    <li className="nav-item">
                      <a
                        href="#sidebarUserRoles"
                        className="nav-link"
                        data-bs-toggle="collapse"
                        role="button"
                        aria-expanded="false"
                        aria-controls="sidebarUserRoles"
                        style={{whiteSpace: "nowrap"}}
                        data-key="t-email"
                      >
                        User Roles Employee
                      </a>
                      <div className="collapse menu-dropdown" id="sidebarUserRoles">
                        <ul className="nav nav-sm flex-column">
                          <li className="nav-item">
                            <NavLink
                              to={`CompanyMaster`}
                              className="nav-link"
                              style={{whiteSpace: "nowrap"}}
                              data-key="t-mailbox"
                            >
                              Document Types
                            </NavLink>
                          </li>
                          <li className="nav-item">
                            <NavLink
                              to={`CompanyMaster`}
                              className="nav-link"
                              data-key="t-mailbox"
                              style={{ display: 'inline-block', whiteSpace: 'nowrap' }}
                            >
                              Employee Code Master
                            </NavLink>
                          </li>
                        </ul>
                      </div>
                    </li>
                    <li className="nav-item">
                      <a
                        href="#sidebarShiftsLetters"
                        className="nav-link"
                        data-bs-toggle="collapse"
                        role="button"
                        aria-expanded="false"
                        aria-controls="sidebarShiftsLetters"
                        style={{whiteSpace: "nowrap"}}
                        data-key="t-email"
                      >
                        Shifts Letters
                      </a>
                      <div className="collapse menu-dropdown" id="sidebarShiftsLetters">
                        <ul className="nav nav-sm flex-column">
                          <li className="nav-item">
                            <NavLink
                              to={`CompanyMaster`}
                              className="nav-link"
                              style={{whiteSpace: "nowrap"}}
                              data-key="t-mailbox"
                            >
                              Letter Type
                            </NavLink>
                          </li>
                          <li className="nav-item">
                            <NavLink
                              to={`CompanyMaster`}
                              className="nav-link"
                              style={{whiteSpace: "nowrap"}}
                              data-key="t-mailbox"
                            >
                              Letter Heads
                            </NavLink>
                          </li>
                        </ul>
                      </div>
                    </li>
                    <li className="nav-item">
                      <NavLink
                        className="nav-link"
                        to={`/Departments`}
                        role="button"
                        aria-expanded="false"
                        aria-controls="sidebarDashboards"
                      >
                        <span data-key="Departments">Departments</span>
                      </NavLink>
                    </li>
                    <li className="nav-item">
                      <NavLink
                        className="nav-link"
                        to={`/Designation`}
                        role="button"
                        aria-expanded="false"
                        aria-controls="sidebarDashboards"
                      >
                        <span data-key="Designation">Designations</span>
                      </NavLink>
                    </li>
                    <li className="nav-item">
                      <NavLink
                        className="nav-link"
                        to={`/EmployeeDocumentTypes`}
                        role="button"
                        aria-expanded="false"
                        aria-controls="sidebarDashboards"
                        style={{ display: 'inline-block', whiteSpace: 'nowrap' }}
                      >
                        <span data-key="EmployeeDocumentTypes">
                          Employee Document Types
                        </span>
                        
                      </NavLink>
                    </li>
                    <li className="nav-item">
                      <NavLink
                        className="nav-link"
                        to={`/Grades`}
                        role="button"
                        aria-expanded="false"
                        aria-controls="sidebarDashboards"
                      >
                        <span data-key="Grades">Grades</span>
                      </NavLink>
                    </li>
                    <li className="nav-item">
                      <NavLink
                        className="nav-link"
                        to={`/Locations`}
                        role="button"
                        aria-expanded="false"
                        aria-controls="sidebarDashboards"
                      >
                        <span data-key="Locations">Locations</span>
                      </NavLink>
                    </li>
                    <li className="nav-item">
                      <NavLink
                        className="nav-link"
                        to={`/SalrayHeade`}
                        role="button"
                        aria-expanded="false"
                        aria-controls="sidebarDashboards"
                        style={{whiteSpace: "nowrap"}}
                      >
                        <span data-key="SalrayHeade">Salray Heade</span>
                      </NavLink>
                    </li>
                    <li className="nav-item">
                      <NavLink
                        className="nav-link"
                        to={`/SalrayStatutory`}
                        role="button"
                        aria-expanded="false"
                        aria-controls="sidebarDashboards"
                        style={{whiteSpace: "nowrap"}}
                      >
                        <span data-key="SalrayStatutory">Salray Statutory</span>
                      </NavLink>
                    </li>
                    <li className="nav-item">
                      <NavLink
                        className="nav-link"
                        to={`/Agencies`}
                        role="button"
                        aria-expanded="false"
                        aria-controls="sidebarDashboards"
                      >
                        <span data-key="Agencies">Agencies</span>
                      </NavLink>
                    </li>
                  </ul>
                </div>
              </li>
              <li className="nav-item">
                <NavLink
                  className="nav-link menu-link"
                  to={`/Reports`}
                  data-bs-toggle="collapse"
                  role="button"
                  aria-expanded="false"
                  aria-controls="sidebarApps"
                >
                  <i className=" ri-file-text-line" />
                  <span data-key="t-apps">Reports</span>
                </NavLink>
              </li>

              <li className="nav-item">
                <NavLink
                  className="nav-link"
                  to={`/Setting`}
                  role="button"
                  aria-expanded="false"
                  aria-controls="sidebarConfiguration"
                >
                  <i className="mdi mdi-spin mdi-cog-outline fs-22" />
                  <span data-key="t-apps">Configuration</span>
                </NavLink>
                <div className="collapse menu-dropdown" id="sidebarConfiguration">
                  <ul className="nav nav-sm flex-column">
                    <li className="nav-item">
                      <Link
                        to={""}
                        className="nav-link"
                        role="button"
                        aria-expanded="false"
                        aria-controls="sidebarCompanyProfile"
                        style={{whiteSpace: "nowrap"}}
                        data-key="t-email"
                      >
                        Company Profile
                      </Link>
                    </li>

                    <li className="nav-item">
                      <Link
                        to={"/Setting"}
                        className="nav-link"
                        role="button"
                        aria-expanded="false"
                        aria-controls="sidebarMailServer"
                        style={{whiteSpace: "nowrap"}}
                        data-key="t-email"
                      >
                        Mail Server
                      </Link>
                    </li>

                    <li className="nav-item">
                      <NavLink
                        to={"LetterHead"}
                        className="nav-link"
                        role="button"
                        aria-expanded="false"
                        aria-controls="sidebarLetterHead"
                        style={{whiteSpace: "nowrap"}}
                        data-key="t-email"
                      >
                        Letter Head
                      </NavLink>
                    </li>

                    <li className="nav-item">
                      <Link
                        to={""}
                        className="nav-link"
                        role="button"
                        aria-expanded="false"
                        aria-controls="sidebarUsers"
                        data-key="t-email"
                      >
                        Users
                      </Link>
                    </li>
                  </ul>
                </div>
              </li>
              
              {/* Close Legacy Navigation Section */}
              </>
              )}
              
            </ul>
          </div>
          {/* Sidebar */}
        </div>
        <div className="sidebar-background" />
      </div>
      {/* Left Sidebar End */}

      {/* Flash Message Modal */}
      {showFlashModal && selectedFlashMessage && (
        <div 
          className="modal fade show" 
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} 
          tabIndex="-1"
          onClick={() => setShowFlashModal(false)}
        >
          <div 
            className="modal-dialog modal-dialog-centered modal-lg" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header text-dark border-0">
                <h4 className="modal-title mb-0">
                  <i className="ri-flashlight-line me-2"></i>
                  {selectedFlashMessage.title}
                </h4>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setShowFlashModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body p-4">
                {selectedFlashMessage.image_path && (
                  <div className="text-center mb-3">
                    <img 
                      src={`${buildApiUrl('').replace('/api/v1', '')}${selectedFlashMessage.image_path}`}
                      alt={selectedFlashMessage.title}
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '250px', 
                        objectFit: 'contain',
                        borderRadius: '8px'
                      }}
                    />
                  </div>
                )}
                <div className="mb-3">
                  <p className="lead mb-2">{selectedFlashMessage.message}</p>
                </div>
                {selectedFlashMessage.content && (
                  <div className="mt-3">
                    <div 
                      className="text-muted flash-message-content"
                      style={{ lineHeight: '1.6' }}
                      dangerouslySetInnerHTML={{ 
                        __html: formatFlashMessageContent(selectedFlashMessage.content)
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="modal-footer border-0 bg-light">
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => setShowFlashModal(false)}
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Modal */}
      {showWelcomeModal && (
        <div 
          className="modal fade show" 
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} 
          tabIndex="-1"
          onClick={() => setShowWelcomeModal(false)}
        >
          <div 
            className="modal-dialog modal-dialog-centered modal-lg" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header  text-muted border-0">
                <h4 className="modal-title mb-0">
                  <i className="ri-shopping-cart-line me-2"></i>
                  Welcome to ipshopy
                </h4>
                <button 
                  type="button" 
                  className="btn-close btn-close-danger" 
                  onClick={() => setShowWelcomeModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="text-center mb-4">
                  <div className="mb-3">
                    <img 
                      src="/assets/ipshopy-logo.png" 
                      alt="Shopping Cart" 
                      style={{ width: '180px', height: '100px', objectFit: 'contain' }}
                    />
                  </div>
                  <h3 className="text-primary mb-2">
                    Hello, {leadCrmUser?.name || 'User'}! 👋
                  </h3>
                  <p className="text-muted mb-4">
                    You are part of our community now at <strong className="text-primary"><a href="https://ipshopy.com">ipshopy</a></strong>
                  </p>
                </div>
                
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="card border-0 bg-light h-100">
                      <div className="card-body p-3">
                        <div className="d-flex align-items-center">
                          <div className="flex-shrink-0 bg-primary bg-opacity-10 rounded-3 p-2 me-3">
                            <i className="ri-building-line text-primary fs-4"></i>
                          </div>
                          <div>
                            <h6 className="text-muted small mb-1">Department</h6>
                            <h5 className="mb-0 text-dark">{userDepartment || 'Loading...'}</h5>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="card border-0 bg-light h-100">
                      <div className="card-body p-3">
                        <div className="d-flex align-items-center">
                          <div className="flex-shrink-0 bg-success bg-opacity-10 rounded-3 p-2 me-3">
                            <i className="ri-user-star-line text-success fs-4"></i>
                          </div>
                          <div>
                            <h6 className="text-muted small mb-1">Designation</h6>
                            <h5 className="mb-0 text-dark">{userDesignation || 'Loading...'}</h5>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {userJoiningDate && (
                  <div className="alert alert-info border-0 mb-0">
                    <div className="d-flex align-items-center">
                      <i className="ri-calendar-check-line fs-4 me-3"></i>
                      <div>
                        <strong>Community Member Since:</strong>
                        <br />
                        <span className="text-muted">
                          {new Date(userJoiningDate).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mt-4 text-center">
                  <p className="text-muted small mb-0">
                    <strong className="text-primary"> <a href="https://ipshopy.com">ipshopy.com</a> </strong> - India's upcoming e-commerce shopping favourite company
                  </p>
                  <p className="text-muted small mt-2 mb-0">
                    Thank you for being an integral part of our growing community! 🚀
                  </p>
                </div>
              </div>
              <div className="modal-footer border-0 bg-light">
                <button 
                  type="button" 
                  className="btn btn-outline-secondary px-4"
                  onClick={() => setShowWelcomeModal(false)}
                >
                  <i className="ri-check-line me-2"></i>
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vertical Overlay*/}
      <div className="vertical-overlay" />
      
      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        /* Custom Scrollbar for #scrollbar element */
        #scrollbar.custom-scrollbar {
          /* Enable custom scrollbar */
          overflow-y: auto;
          overflow-x: hidden;
        }
        
        /* Webkit browsers (Chrome, Safari, Edge) */
        #scrollbar.custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        
        #scrollbar.custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 10px;
        }
        
        #scrollbar.custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, 
            var(--scrollbar-thumb-start,rgba(104, 124, 254, 0.12)), 
            var(--scrollbar-thumb-end,rgba(90, 111, 216, 0.18)));
          border-radius: 10px;
          border: 1px solid transparent;
          background-clip: content-box;
          transition: all 0.3s ease;
        }
        
        #scrollbar.custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, 
            var(--scrollbar-thumb-hover-start, rgba(130, 147, 234, 0.25)), 
            var(--scrollbar-thumb-hover-end, rgba(108, 129, 237, 0.3)));
          transform: scaleX(1.1);
        }
        
        /* Firefox */
        #scrollbar.custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: var(--scrollbar-thumb-start,rgba(104, 124, 254, 0.42)) var(--scrollbar-thumb-end,rgba(90, 111, 216, 0.42));
        }
        
        /* Light Theme Variables */
        [data-sidebar="light"] #scrollbar.custom-scrollbar::-webkit-scrollbar-thumb {
          --scrollbar-thumb-start: rgba(104, 124, 254, 0.15);
          --scrollbar-thumb-end: rgba(90, 111, 216, 0.22);
          --scrollbar-thumb-hover-start: rgba(80, 96, 176, 0.18);
          --scrollbar-thumb-hover-end: rgba(57, 72, 146, 0.25);
        }
        
        [data-sidebar="light"] #scrollbar.custom-scrollbar {
          scrollbar-color: rgba(104, 124, 254, 0.25) transparent;
        }
        
        /* Dark Theme Variables */
        [data-sidebar="dark"] #scrollbar.custom-scrollbar::-webkit-scrollbar-thumb {
          --scrollbar-thumb-start: rgba(134, 150, 254, 0.18);
          --scrollbar-thumb-end: rgba(104, 124, 254, 0.25);
          --scrollbar-thumb-hover-start: rgba(154, 172, 248, 0.30);
          --scrollbar-thumb-hover-end: rgba(134, 150, 254, 0.38);
        }
        
        [data-sidebar="dark"] #scrollbar.custom-scrollbar {
          scrollbar-color: rgba(134, 150, 254, 0.30) transparent;
        }
        
        /* Smooth scrolling */
        #scrollbar.custom-scrollbar {
          scroll-behavior: smooth;
        }
        
        /* Hide scrollbar when not needed */
        #scrollbar.custom-scrollbar::-webkit-scrollbar-thumb:vertical:only-child {
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
};

export default Header;