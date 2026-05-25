import React, { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../Context/ConfigContext';
import PageTitle from '../../Components/PageTitle';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { buildApiUrl, getAuthHeaders } from '../../config/api';
import TaskDetailsModal from '../../Layout/TaskDetailsModal';
import Snowfall from 'react-snowfall'; // Import snowfall component

// Heatmap Day Component
const HeatmapDay = ({ day, getColorIntensity, formatDate }) => {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  return (
    <div
      className="heatmap-day"
      style={{
        width: '11px',
        height: '11px',
        backgroundColor: getColorIntensity(day.count),
        borderRadius: '2px',
        cursor: 'pointer',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        setTooltipVisible(true);
        const rect = e.target.getBoundingClientRect();
        setTooltipPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10
        });
      }}
      onMouseLeave={() => setTooltipVisible(false)}
    >
      {tooltipVisible && (
        <div
          className="heatmap-tooltip"
          style={{
            position: 'fixed',
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translate(-50%, -100%)',
            backgroundColor: '#000',
            color: '#fff',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            whiteSpace: 'nowrap',
            zIndex: 1000,
            pointerEvents: 'none',
            marginBottom: '5px'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
            {day.count} {day.count === 1 ? 'log' : 'logs'}
          </div>
          <div style={{ fontSize: '10px', opacity: 0.8 }}>
            {formatDate(day.date)}
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: '-4px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '4px solid #000'
            }}
          ></div>
        </div>
      )}
    </div>
  );
};

const EmployeeDashboard = () => {
  const { leadCrmApiURL, leadCrmHeaders, leadCrmUser } = useContext(ConfigContext);
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  });
  const [filterApplied, setFilterApplied] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [monthlyCalendarData, setMonthlyCalendarData] = useState({});
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null); // null = show all, 'green' | 'red' | 'yellow' | 'gray' = filter by color
  
  // Fetch monthly calendar data for heatmap
  const fetchMonthlyCalendarData = async () => {
    setLoadingCalendar(true);
    try {
      const employeeId = leadCrmUser?.id;
      if (!employeeId) {
        setLoadingCalendar(false);
        return;
      }

      const currentDate = new Date();
      const month = currentDate.getMonth();
      const year = currentDate.getFullYear();

      // Fetch tasks and logs similar to EmployeeCalendarTracker
      const tasksResponse = await axios.get(
        buildApiUrl(`/tasks/user/${employeeId}`),
        { headers: getAuthHeaders() }
      );
      
      const logsResponse = await axios.get(
        buildApiUrl(`/tasks/logs/user/${employeeId}`),
        { headers: getAuthHeaders() }
      );
      
      if (tasksResponse.data.success && logsResponse.data.success) {
        const processedData = processMonthlyCalendarData(
          tasksResponse.data.data.tasks || tasksResponse.data.data,
          logsResponse.data.data.logs || logsResponse.data.data,
          month,
          year
        );
        setMonthlyCalendarData(processedData);
      }
    } catch (error) {
      console.error('Error fetching monthly calendar data:', error);
    } finally {
      setLoadingCalendar(false);
    }
  };

  // Process monthly calendar data (similar to EmployeeCalendarTracker)
  const processMonthlyCalendarData = (tasks, logs, month, year) => {
    const data = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get all days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Create a map of logs by date for quick lookup
    const logsByDate = {};
    logs.forEach(log => {
      const logDate = new Date(log.created_at);
      const dateStr = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}-${String(logDate.getDate()).padStart(2, '0')}`;
      if (!logsByDate[dateStr]) {
        logsByDate[dateStr] = [];
      }
      logsByDate[dateStr].push(log);
    });
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const currentDate = new Date(year, month, day);
      currentDate.setHours(0, 0, 0, 0);
      
      // Check if this is a future date
      const isFutureDate = currentDate > today;
      
      if (isFutureDate) {
        // Gray color for future dates
        data[dateStr] = { color: 'gray', tasks: [], logs: [] };
      } else {
        // Filter tasks that are active on this date OR tasks that have logs on this date
        const relevantTasks = tasks.filter(task => {
          const taskCreatedDate = new Date(task.created_at);
          taskCreatedDate.setHours(0, 0, 0, 0);
          const taskCompletedDate = task.completed_at ? new Date(task.completed_at) : null;
          if (taskCompletedDate) {
            taskCompletedDate.setHours(0, 0, 0, 0);
          }
          
          // For daily routine tasks
          if (task.task_type === 'DAILY_ROUTINE') {
            const createdDate = new Date(taskCreatedDate);
            createdDate.setHours(0, 0, 0, 0);
            const currentCompareDate = new Date(currentDate);
            currentCompareDate.setHours(0, 0, 0, 0);
            
            const isCreatedOnThisDate = createdDate.getTime() === currentCompareDate.getTime();
            const isNotCompleted = !taskCompletedDate || new Date(taskCompletedDate) >= currentDate;
            
            const logsForDate = logsByDate[dateStr] || [];
            const taskHasLogsOnThisDate = logsForDate.some(log => log.task_id === task.id);
            
            return (isCreatedOnThisDate && isNotCompleted) || taskHasLogsOnThisDate;
          }
          
          // For regular tasks
          // const isActiveStatus = ['ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'DRAFT'].includes(task.status);
          const isActiveStatus = task.status === 'IN_PROGRESS';
          const isCreatedBeforeOrOnDate = taskCreatedDate <= currentDate;
          const isNotCompletedOrCompletedAfterDate = !taskCompletedDate || taskCompletedDate >= currentDate;
          const isActiveTask = isActiveStatus && isCreatedBeforeOrOnDate && isNotCompletedOrCompletedAfterDate;
          
          const logsForDate = logsByDate[dateStr] || [];
          const taskHasLogsOnThisDate = logsForDate.some(log => log.task_id === task.id);
          
          return isActiveTask || taskHasLogsOnThisDate;
        });
        
        // Get logs for this date
        const logsForDate = logsByDate[dateStr] || [];
        
        // Determine color based on log status
        if (relevantTasks.length > 0) {
          const taskIdsWithLogs = new Set(logsForDate.map(log => log.task_id));
          
          // Check if ALL tasks have logs written
          const allTasksHaveLogs = relevantTasks.every(task => taskIdsWithLogs.has(task.id));
          
          if (allTasksHaveLogs) {
            // Green: All tasks have logs written
            data[dateStr] = { color: 'green', tasks: relevantTasks, logs: logsForDate };
          } else {
            // Red: Not all tasks have logs written
            data[dateStr] = { color: 'red', tasks: relevantTasks, logs: logsForDate };
          }
        } else {
          // Yellow: No tasks assigned
          data[dateStr] = { color: 'yellow', tasks: [], logs: logsForDate };
        }
      }
    }
    
    return data;
  };
  
  const fetchEmployeeDashboardData = async (customDateRange = null) => {
    try {
      setLoading(true);
      
      
      const queryParams = new URLSearchParams();
      if (customDateRange?.from) queryParams.append('from', customDateRange.from);
      if (customDateRange?.to) queryParams.append('to', customDateRange.to);
      
      const url = buildApiUrl(`/employee/dashboard/data?${queryParams.toString()}`);
      
      
      const response = await axios.get(url, { headers: getAuthHeaders() });
      

      if (response.data.success) {
        
        setDashboardData(response.data.data);
        setFilterApplied(!!(customDateRange?.from || customDateRange?.to));
      } else {
        
        Swal.fire('Error', response.data.message || 'Failed to fetch dashboard data', 'error');
      }
    } catch (error) {
      
      Swal.fire('Error', 'Network error while fetching dashboard data: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeDashboardData();
    fetchMonthlyCalendarData();
  }, [leadCrmUser]);

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  const applyDateFilter = () => {
    fetchEmployeeDashboardData(dateRange);
  };

  const clearDateFilter = () => {
    setDateRange({ from: '', to: '' });
    setFilterApplied(false);
    fetchEmployeeDashboardData();
  };

  // Handle task title click to open modal
  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  // Handle modal close
  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="page-content">
          <div className="container-fluid">
            <PageTitle title="Employee Dashboard" primary="Task Management" />
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
              <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading dashboard data...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="main-content">
        <div className="page-content">
          <div className="container-fluid">
            <PageTitle title="Employee Dashboard" primary="Task Management" />
            <div className="alert alert-warning" role="alert">
              No dashboard data available
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Format date range for display
  const formatDateRange = () => {
    if (!filterApplied) {
      return "All Time Data";
    }
    if (dateRange.from && dateRange.to) {
      if (dateRange.from === dateRange.to) {
        return `Data for ${new Date(dateRange.from).toLocaleDateString()}`;
      }
      return `${new Date(dateRange.from).toLocaleDateString()} to ${new Date(dateRange.to).toLocaleDateString()}`;
    }
    if (dateRange.from) {
      return `From ${new Date(dateRange.from).toLocaleDateString()}`;
    }
    if (dateRange.to) {
      return `To ${new Date(dateRange.to).toLocaleDateString()}`;
    }
    return "All Time Data";
  };

  // Calculate task statistics
  const totalTasks = dashboardData?.task_statistics?.total_tasks || 0;
  const completedTasks = dashboardData?.task_statistics?.completed_tasks || 0;
  const pendingTasks = dashboardData?.task_statistics?.pending_tasks || 0;
  const inProgressTasks = dashboardData?.task_statistics?.in_progress_tasks || 0;
  const overdueTasks = dashboardData?.task_statistics?.overdue_tasks || 0;
  const submittedTasksCount = dashboardData?.task_statistics?.submitted_tasks || 0;
  
  // Calculate combined pending tasks (Draft + In Progress)
  const combinedPendingTasks = (pendingTasks) + (inProgressTasks);

  // Today's tasks and submitted tasks
  const todaysTasks = dashboardData?.todays_tasks || [];
  const submittedTasksData = dashboardData?.submitted_tasks || [];
  const recentActivities = dashboardData?.recent_activities || [];
  const logActivityData = dashboardData?.log_activity || [];

  // Process log activity data for heatmap
  const processLogActivityForHeatmap = () => {
    // Create a map of date to log count
    const logMap = {};
    logActivityData.forEach(item => {
      const date = new Date(item.log_date).toISOString().split('T')[0];
      logMap[date] = item.log_count;
    });

    // Generate last 90 days of data
    const days = 90;
    const today = new Date();
    const heatmapData = [];
    
    // Get the maximum log count for color intensity
    const maxLogs = Math.max(...logActivityData.map(item => item.log_count), 1);

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const logCount = logMap[dateStr] || 0;
      
      heatmapData.push({
        date: dateStr,
        count: logCount,
        day: date.getDay(), // 0 = Sunday, 6 = Saturday
        week: Math.floor((days - 1 - i) / 7) // Week number
      });
    }

    // Group by weeks (columns)
    const weeks = [];
    for (let week = 0; week < Math.ceil(days / 7); week++) {
      const weekData = [];
      for (let day = 0; day < 7; day++) {
        const index = week * 7 + day;
        if (index < heatmapData.length) {
          weekData.push(heatmapData[index]);
        }
      }
      if (weekData.length > 0) {
        weeks.push(weekData);
      }
    }

    return { weeks, maxLogs };
  };

  const { weeks, maxLogs } = processLogActivityForHeatmap();

  // Get color intensity based on log count
  const getColorIntensity = (count) => {
    if (count === 0) return '#ebedf0'; // No activity - light gray
    if (maxLogs === 0) return '#ebedf0';
    
    const intensity = count / maxLogs;
    if (intensity <= 0.25) return '#9be9a8'; // Light green
    if (intensity <= 0.5) return '#40c463'; // Medium green
    if (intensity <= 0.75) return '#30a14e'; // Dark green
    return '#216e39'; // Darkest green
  };

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };



  return (
    <div className="main-content">
      <style>
        {`
          .text-violet {
            color: #8b5cf6 !important;
          }
          .bg-violet {
            background-color: #8b5cf6 !important;
          }
          .date-filter-card {
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
          }
          
          /* Monthly Heatmap Styles - Calendar Format */
          .monthly-heatmap-container {
            padding: 10px 0;
          }
          
          .monthly-heatmap-wrapper {
            overflow-x: auto;
            padding: 10px 0;
          }
          
          .monthly-heatmap-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 4px;
            width: 100%;
          }
          
          .monthly-heatmap-row {
            display: contents;
          }
          
          .monthly-heatmap-cell {
            min-height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            padding: 8px;
            transition: all 0.2s ease;
          }
          
          .monthly-heatmap-day-header {
            background-color: #f8f9fa;
            color: #495057;
            font-weight: 600;
            font-size: 11px;
            padding: 10px 5px;
            text-align: center;
          }
          
          [data-bs-theme="dark"] .monthly-heatmap-day-header {
            background-color: #2b3035;
            color: #f8f9fa;
          }
          
          .monthly-heatmap-empty {
            background-color: transparent;
            border: 1px solid transparent;
          }
          
          .monthly-heatmap-day {
            cursor: pointer;
            position: relative;
            border: 1px solid rgba(0, 0, 0, 0.1);
            flex-direction: column;
            min-height: 60px;
          }
          
          [data-bs-theme="dark"] .monthly-heatmap-day {
            border-color: rgba(255, 255, 255, 0.1);
          }
          
          .monthly-heatmap-day:hover {
            transform: translateY(-2px);
            z-index: 10;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          }
          
          .monthly-heatmap-day-number {
            font-size: 14px;
            font-weight: 600;
            color: #212529;
            margin-bottom: 2px;
          }
          
          [data-bs-theme="dark"] .monthly-heatmap-day-number {
            color: #f8f9fa;
          }
          
          /* Color classes for heatmap days - matching calendar colors */
          .monthly-heatmap-day.green-day {
            background-color: rgba(40, 167, 69, 0.6) !important;
          }
          
          [data-bs-theme="dark"] .monthly-heatmap-day.green-day {
            background-color: rgba(40, 167, 69, 0.6) !important;
          }
          
          .monthly-heatmap-day.red-day {
            background-color: rgba(220, 53, 69, 0.7) !important;
          }
          
          [data-bs-theme="dark"] .monthly-heatmap-day.red-day {
            background-color: rgba(220, 53, 69, 0.6) !important;
          }
          
          .monthly-heatmap-day.yellow-day {
            background-color: rgba(255, 193, 7, 0.5) !important;
          }
          
          [data-bs-theme="dark"] .monthly-heatmap-day.yellow-day {
            background-color: rgba(255, 193, 7, 0.5) !important;
          }
          
          .monthly-heatmap-day.gray-day {
            background-color: rgba(220, 220, 220, 0.5) !important;
          }
          
          [data-bs-theme="dark"] .monthly-heatmap-day.gray-day {
            background-color: rgba(108, 117, 125, 0.5) !important;
          }
          
          /* Legend styles */
          .monthly-heatmap-legend-box {
            width: 16px;
            height: 16px;
            border-radius: 3px;
            border: 1px solid rgba(0, 0, 0, 0.1);
          }
          
          [data-bs-theme="dark"] .monthly-heatmap-legend-box {
            border-color: rgba(255, 255, 255, 0.2);
          }
          
          .monthly-heatmap-legend-item.active {
            background-color: rgba(13, 110, 253, 0.1) !important;
            border: 1px solid rgba(13, 110, 253, 0.3);
            font-weight: 600;
          }
          
          [data-bs-theme="dark"] .monthly-heatmap-legend-item.active {
            background-color: rgba(13, 110, 253, 0.2) !important;
            border-color: rgba(13, 110, 253, 0.5);
          }
          
          .monthly-heatmap-legend-item.active .text-muted {
            color: #495057 !important;
            font-weight: 600;
          }
          
          [data-bs-theme="dark"] .monthly-heatmap-legend-item.active .text-muted {
            color: #f8f9fa !important;
          }
          
          /* Responsive monthly heatmap */
          @media (max-width: 768px) {
            .monthly-heatmap-cell {
              min-height: 40px;
              font-size: 10px;
              padding: 5px;
            }
            
            .monthly-heatmap-day {
              min-height: 45px;
            }
            
            .monthly-heatmap-day-number {
              font-size: 12px;
            }
          }
         
          
          /* Dark theme support */
          [data-bs-theme="dark"] .department-stats-card {
            background:var(--vz-card-bg, var(--vz-secondary-bg, #2d3748)) !important;
           
          
          }
          
          [data-bs-theme="dark"] .department-title {
            color: #e2e8f0;
          }
          
          [data-bs-theme="dark"] .stat-label {
            color: #a0aec0;
          }
          
          [data-bs-theme="dark"] .stat-value {
            color: #e2e8f0;
          }
          
          [data-bs-theme="dark"] .department-header {
            border-bottom: 1px solid rgba(255,255,255,0.1);
          }
          
          .department-header {
            border-bottom: 1px solid rgba(0,0,0,0.05);
            padding-bottom: 8px;
            margin-bottom: 10px;
          }
          
          .department-title {
            font-weight: 600;
            color: #495057;
            font-size: 1.1rem;
          }
          
          .stat-item {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            border-bottom: 1px dashed rgba(0,0,0,0.05);
          }
          
          .stat-item:last-child {
            border-bottom: none;
          }
          
          .stat-label {
            color: #6c757d;
            font-size: 0.85rem;
          }
          
          .stat-value {
            font-weight: 600;
            color: #495057;
          }
          
          .badge-custom {
            padding: 3px 8px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 500;
          }
          
          .bg-primary-light {
            background-color: rgba(59, 130, 246, 0.15);
            color: #3b82f6;
          }
          
          .bg-warning-light {
            background-color: rgba(245, 158, 11, 0.15);
            color: #f59e0b;
          }
          
          .bg-success-light {
            background-color: rgba(16, 185, 129, 0.15);
            color: #10b981;
          }
          
          /* Enhanced Department Stats Styles */
          .department-selector {
            background-color: #fff;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            padding: 6px 10px;
            font-size: 0.85rem;
            color: #495057;
            width: 100%;
            margin-bottom: 10px;
          }
          
          [data-bs-theme="dark"] .department-selector {
            background-color: #2d3748;
            border: 1px solid #4a5568;
            color: #e2e8f0;
          }
          
          .department-selector:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.25);
            outline: 0;
          }
          
          [data-bs-theme="dark"] .department-selector:focus {
            border-color: var(--vz-card-bg, var(--vz-secondary-bg, #2d3748)) !important;
            box-shadow: 0 0 0 0.2rem rgba(99, 102, 241, 0.25);
          }
          
          .stat-card {
            background: #fff;
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 8px;
         
            font-size: 0.9rem;
          }
          
          [data-bs-theme="dark"] .stat-card {
            background: var(--vz-card-bg, var(--vz-secondary-bg, #2d3748)) !important;
           
          }
          
          .stat-label {
            font-size: 0.85rem;
            color: #6c757d;
            font-weight: 500;
          }
          
          .stat-value {
            font-size: 1rem;
            font-weight: 700;
          }
          
          .text-warning {
            color: #f59e0b !important;
          }
          
          .text-success {
            color: #10b981 !important;
          }
          
          .text-violet {
            color: #8b5cf6 !important;
          }
          
          /* Consistent card styling */
          .card {
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            border: 1px solid #e9ecef;
          }
          
          [data-bs-theme="dark"] .card {
            border: 1px solid #4a5568;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
          }
          
          .card-header {
            border-radius: 12px 12px 0 0 !important;
            border-bottom: 1px solid #e9ecef !important;
          }
          
          [data-bs-theme="dark"] .card-header {
            border-bottom: 1px solid #4a5568 !important;
          }
          
          /* Stats card specific styles */
          .stats-card-icon {
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
          }
          
          .stats-card-value {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 0.25rem;
          }
          
          .stats-card-title {
            font-size: 0.875rem;
            color: #6c757d;
            margin-bottom: 0;
          }
          
          [data-bs-theme="dark"] .stats-card-title {
            color: #a0aec0;
          }
        `}
      </style>
      <div className="page-content">
        <div className="container-fluid">
          <PageTitle title="Employee Dashboard" primary="Task Management" />
          <Snowfall
            style={{
              position: "fixed",
              width: "100vw",
              height: "100vh",
              top: 0,
              left: 0,
              zIndex: -1,
              pointerEvents: "none"
            }}
            snowflakeCount={150}
            radius={[0.5, 3.0]}
            speed={[0.5, 1]}
            wind={[-0.5, 0.5]}
            color="rgba(105, 239, 251, 0.8)" // Light blue/ice color
          />
          
          {/* Date Filter Section */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card date-filter-card shadow-sm rounded-3 border-0">
                <div className="card-body">
                  <div className="d-flex flex-wrap align-items-center justify-content-between">
                    <div className="d-flex align-items-center mb-2 mb-md-0">
                      <i className="ri-calendar-line me-2 text-primary"></i>
                      <span className="fw-medium">
                        {formatDateRange()}
                      </span>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      <div className="d-flex align-items-center">
                        <label className="form-label me-2 mb-0">From:</label>
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          name="from"
                          value={dateRange.from}
                          onChange={handleDateRangeChange}
                        />
                      </div>
                      <div className="d-flex align-items-center">
                        <label className="form-label me-2 mb-0">To:</label>
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          name="to"
                          value={dateRange.to}
                          onChange={handleDateRangeChange}
                        />
                      </div>
                      <button 
                        className="btn btn-outline-primary btn-sm rounded-pill"
                        onClick={applyDateFilter}
                      >
                        <i className="ri-filter-line me-1"></i>
                        Apply Filter
                      </button>
                      <button 
                        className="btn btn-outline-secondary btn-sm rounded-pill"
                        onClick={clearDateFilter}
                      >
                        <i className="ri-refresh-line me-1"></i>
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Task Stats Cards (4 cards as requested) */}
          <div className="row mb-4 g-3">
            <div className="col-xl col-md-6 col-sm-6">
              <div 
                className="card border-0 shadow-sm h-100 rounded-3 clickable-card"
                onClick={() => navigate('/employee/tasks/records?filter=all')}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-body p-3">
                  <div className="d-flex align-items-center">
                    <div className="flex-shrink-0 bg-primary bg-opacity-10 rounded-3 p-2">
                      <i className="ri-task-line text-primary fs-5"></i>
                    </div>
                    <div className="flex-grow-1 ms-2">
                      <h6 className="card-title mb-1 text-muted small">Total Tasks</h6>
                      <h4 className="mb-0 text-primary">{totalTasks}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-xl col-md-6 col-sm-6">
              <div 
                className="card border-0 shadow-sm h-100 rounded-3 clickable-card"
                onClick={() => navigate('/employee/tasks/records?filter=ASSIGNED,IN_PROGRESS')}
              >
                <div className="card-body p-3">
                  <div className="d-flex align-items-center">
                    <div className="flex-shrink-0 bg-info bg-opacity-10 rounded-3 p-2">
                      <i className="ri-time-line text-info fs-5"></i>
                    </div>
                    <div className="flex-grow-1 ms-2">
                      <h6 className="card-title mb-1 text-muted small">Pending Tasks</h6>
                      <h4 className="mb-0 text-info">{combinedPendingTasks}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-xl col-md-6 col-sm-6">
              <div 
                className="card border-0 shadow-sm h-100 rounded-3 clickable-card"
                onClick={() => navigate('/employee/tasks/records?filter=SUBMITTED')}
              >
                <div className="card-body p-3">
                  <div className="d-flex align-items-center">
                    <div className="flex-shrink-0 bg-primary bg-opacity-10 rounded-3 p-2">
                      <i className="ri-send-plane-line text-violet fs-5"></i>
                    </div>
                    <div className="flex-grow-1 ms-2">
                      <h6 className="card-title mb-1 text-muted small">Submitted Tasks</h6>
                      <h4 className="mb-0 text-violet">{submittedTasksCount}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-xl col-md-6 col-sm-6">
              <div 
                className="card border-0 shadow-sm h-100 rounded-3 clickable-card"
                onClick={() => navigate('/employee/tasks/records?filter=COMPLETED')}
              >
                <div className="card-body p-3">
                  <div className="d-flex align-items-center">
                    <div className="flex-shrink-0 bg-success bg-opacity-10 rounded-3 p-2">
                      <i className="ri-check-double-line text-success fs-5"></i>
                    </div>
                    <div className="flex-grow-1 ms-2">
                      <h6 className="card-title mb-1 text-muted small">Completed Tasks</h6>
                      <h4 className="mb-0 text-success">{completedTasks}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Overdue Tasks Card */}
            <div className="col-xl col-md-6 col-sm-6">
              <div 
                className="card border-0 shadow-sm h-100 rounded-3 clickable-card"
                onClick={() => navigate('/employee/tasks/records?filter=OVERDUE')}
              >
                <div className="card-body p-3">
                  <div className="d-flex align-items-center">
                    <div className="flex-shrink-0 bg-danger bg-opacity-10 rounded-3 p-2">
                      <i className="ri-alert-line text-danger fs-5"></i>
                    </div>
                    <div className="flex-grow-1 ms-2">
                      <h6 className="card-title mb-1 text-muted small">Overdue Tasks</h6>
                      <h4 className="mb-0 text-danger">{overdueTasks}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <style jsx>{`
            .clickable-card {
              transition: all 0.3s ease;
              cursor: pointer;
            }
            
            .clickable-card:hover {
              transform: translateY(-5px);
              box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
            }
            
            .clickable-card .card-body {
              transition: all 0.3s ease;
            }
            
            .clickable-card:hover .card-body {
              transform: scale(1.02);
            }
            
            /* Dark theme support */
            [data-bs-theme="dark"] .clickable-card:hover {
              box-shadow: 0 0.5rem 1rem rgba(255, 255, 255, 0.15) !important;
            }
          `}</style>

          {/* Today's Assigned Tasks and Submitted Tasks Status Update - Same Row */}
          <div className="row mb-4 g-4">
            {/* Today's Assigned Tasks */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm rounded-3 h-100">
                <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center">
                  <h4 className="card-title mb-0">
                    {dateRange.from && dateRange.to && dateRange.from === dateRange.to 
                      ? `Tasks for ${new Date(dateRange.from).toLocaleDateString()}` 
                      : dateRange.from || dateRange.to 
                        ? "Filtered Tasks" 
                        : "Today's Assigned Tasks"}
                  </h4>
                </div>
                <div className="card-body">
                  {todaysTasks?.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-centered table-nowrap mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Task Title</th>
                           
                            {/* <th>Priority</th>
                            <th>Status</th> */}
                            <th>Due Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {todaysTasks.map((task, index) => (
                            <tr key={index}>
                              <td>
                                <h6 
                                  className="mb-0" 
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => handleTaskClick(task)}
                                  onMouseEnter={(e) => {
                                    e.target.style.transform = 'scale(1.01)';
                                    e.target.style.boxShadow = '0 3px 5px rgba(13, 110, 253, 0.4)';
                                    e.target.style.borderRadius = '3px';
                                    e.target.style.transition = 'all 0.2s ease';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.transform = 'scale(1)';
                                    e.target.style.boxShadow = 'none';
                                  }}
                                >
                                  {task.title?.substring(0, 50) || 'No title'}
                                </h6>
                              </td>
                            
                              {/* <td>
                                 <span>
                                  {task.priority}
                                </span>
                              </td>
                              <td>
                                <span >
                                  {task.status.replace('_', ' ')}
                                </span>
                              </td> */}
                              <td>{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <div className="avatar-md mx-auto mb-3">
                        <div className="avatar-title bg-light text-muted rounded-circle">
                          <i className="ri-task-line ri-2x"></i>
                        </div>
                      </div>
                      <h5 className="mt-3">No tasks found</h5>
                      <p className="text-muted">
                        {dateRange.from && dateRange.to && dateRange.from === dateRange.to 
                          ? `No tasks found for ${new Date(dateRange.from).toLocaleDateString()}` 
                          : dateRange.from || dateRange.to 
                            ? "No tasks found for the selected date range" 
                            : "You have no tasks assigned today."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Monthly Log Activity Heatmap */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm rounded-3 h-100">
                <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center">
                  <h4 className="card-title mb-0">
                    {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} - Log Activity
                  </h4>
                  <button 
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => navigate('/employee/calendar')}
                  >
                    <i className="ri-calendar-line me-1"></i>
                    View detailed Activity
                  </button>
                </div>
                <div className="card-body">
                  {loadingCalendar ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2">Loading calendar data...</p>
                    </div>
                  ) : Object.keys(monthlyCalendarData).length > 0 ? (
                    <div className="monthly-heatmap-container">
                      {/* Legend with filter functionality */}
                      <div className="d-flex justify-content-center align-items-center mb-3 flex-wrap gap-3">
                        <div 
                          className={`d-flex align-items-center gap-2 monthly-heatmap-legend-item ${activeFilter === 'green' ? 'active' : ''}`}
                          style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', transition: 'all 0.2s ease' }}
                          onClick={() => setActiveFilter(activeFilter === 'green' ? null : 'green')}
                          onMouseEnter={(e) => {
                            if (activeFilter !== 'green') {
                              e.currentTarget.style.backgroundColor = 'rgba(40, 167, 69, 0.1)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (activeFilter !== 'green') {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          <div className="monthly-heatmap-legend-box" style={{ backgroundColor: '#28a745' }}></div>
                          <span className="text-muted small">Logs</span>
                        </div>
                        <div 
                          className={`d-flex align-items-center gap-2 monthly-heatmap-legend-item ${activeFilter === 'red' ? 'active' : ''}`}
                          style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', transition: 'all 0.2s ease' }}
                          onClick={() => setActiveFilter(activeFilter === 'red' ? null : 'red')}
                          onMouseEnter={(e) => {
                            if (activeFilter !== 'red') {
                              e.currentTarget.style.backgroundColor = 'rgba(220, 53, 69, 0.1)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (activeFilter !== 'red') {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          <div className="monthly-heatmap-legend-box" style={{ backgroundColor: '#dc3545' }}></div>
                          <span className="text-muted small">No Logs</span>
                        </div>
                        <div 
                          className={`d-flex align-items-center gap-2 monthly-heatmap-legend-item ${activeFilter === 'yellow' ? 'active' : ''}`}
                          style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', transition: 'all 0.2s ease' }}
                          onClick={() => setActiveFilter(activeFilter === 'yellow' ? null : 'yellow')}
                          onMouseEnter={(e) => {
                            if (activeFilter !== 'yellow') {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 193, 7, 0.1)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (activeFilter !== 'yellow') {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          <div className="monthly-heatmap-legend-box" style={{ backgroundColor: '#ffc107' }}></div>
                          <span className="text-muted small">No Tasks</span>
                        </div>
                        <div 
                          className={`d-flex align-items-center gap-2 monthly-heatmap-legend-item ${activeFilter === 'gray' ? 'active' : ''}`}
                          style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', transition: 'all 0.2s ease' }}
                          onClick={() => setActiveFilter(activeFilter === 'gray' ? null : 'gray')}
                          onMouseEnter={(e) => {
                            if (activeFilter !== 'gray') {
                              e.currentTarget.style.backgroundColor = 'rgba(108, 117, 125, 0.1)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (activeFilter !== 'gray') {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          <div className="monthly-heatmap-legend-box" style={{ backgroundColor: '#e0e0e0' }}></div>
                          <span className="text-muted small">upcoming</span>
                        </div>
                        {activeFilter && (
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => setActiveFilter(null)}
                            style={{ fontSize: '11px', padding: '2px 8px' }}
                          >
                            Clear Filter
                          </button>
                        )}
                      </div>

                      {/* Monthly Heatmap Grid - Calendar format: Days of week as columns, Weeks as rows */}
                      <div className="monthly-heatmap-wrapper">
                        <div className="monthly-heatmap-grid">
                          {/* Day of week headers */}
                          <div className="monthly-heatmap-row monthly-heatmap-header">
                            <div className="monthly-heatmap-cell monthly-heatmap-day-header">Sun</div>
                            <div className="monthly-heatmap-cell monthly-heatmap-day-header">Mon</div>
                            <div className="monthly-heatmap-cell monthly-heatmap-day-header">Tue</div>
                            <div className="monthly-heatmap-cell monthly-heatmap-day-header">Wed</div>
                            <div className="monthly-heatmap-cell monthly-heatmap-day-header">Thu</div>
                            <div className="monthly-heatmap-cell monthly-heatmap-day-header">Fri</div>
                            <div className="monthly-heatmap-cell monthly-heatmap-day-header">Sat</div>
                          </div>

                          {/* Week rows - Calendar format */}
                          {(() => {
                            const currentDate = new Date();
                            const year = currentDate.getFullYear();
                            const month = currentDate.getMonth();
                            const daysInMonth = new Date(year, month + 1, 0).getDate();
                            const firstDay = new Date(year, month, 1).getDay();
                            
                            // Create calendar grid similar to EmployeeCalendarTracker
                            const calendarDays = [];
                            
                            // Add empty cells for days before the first day of the month
                            for (let i = 0; i < firstDay; i++) {
                              calendarDays.push(null);
                            }
                            
                            // Add cells for each day of the month
                            for (let day = 1; day <= daysInMonth; day++) {
                              calendarDays.push(day);
                            }
                            
                            // Group into weeks (7 days per week)
                            const weeks = [];
                            for (let i = 0; i < calendarDays.length; i += 7) {
                              weeks.push(calendarDays.slice(i, i + 7));
                            }
                            
                            return weeks.map((week, weekIndex) => (
                              <div key={weekIndex} className="monthly-heatmap-row">
                                {week.map((day, dayIndex) => {
                                  if (day === null) {
                                    return (
                                      <div 
                                        key={dayIndex} 
                                        className="monthly-heatmap-cell monthly-heatmap-empty"
                                      ></div>
                                    );
                                  }
                                  
                                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                  const dayData = monthlyCalendarData[dateStr];
                                  const color = dayData?.color || 'yellow';
                                  
                                  // Apply filter: if activeFilter is set, only show matching colors, fade others
                                  const shouldShow = !activeFilter || activeFilter === color;
                                  const opacity = shouldShow ? 1 : 0.2;
                                  
                                  return (
                                    <div
                                      key={dayIndex}
                                      className={`monthly-heatmap-cell monthly-heatmap-day ${color}-day`}
                                      style={{ 
                                        opacity: opacity,
                                        transition: 'opacity 0.3s ease',
                                        pointerEvents: shouldShow ? 'auto' : 'none'
                                      }}
                                      title={`${dateStr}: ${dayData?.tasks?.length || 0} task(s), ${dayData?.logs?.length || 0} log(s)`}
                                    >
                                      <span className="monthly-heatmap-day-number">{day}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <div className="avatar-md mx-auto mb-3">
                        <div className="avatar-title bg-light text-muted rounded-circle">
                          <i className="ri-file-list-3-line ri-2x"></i>
                        </div>
                      </div>
                      <h5 className="mt-3">No calendar data</h5>
                      <p className="text-muted">
                        Start writing logs for your tasks to see your activity heatmap here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="row">
            <div className="col-12">
              <div className="card border-0 shadow-sm rounded-3">
                <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center">
                  <h4 className="card-title mb-0">
                    {dateRange.from && dateRange.to && dateRange.from === dateRange.to 
                      ? `Recent Activity for ${new Date(dateRange.from).toLocaleDateString()}` 
                      : dateRange.from || dateRange.to 
                        ? "Recent Activity (Filtered)" 
                        : "Recent Activity"}
                  </h4>
                </div>
                <div className="card-body">
                  {recentActivities?.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-centered table-nowrap mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Task Title</th>
                            <th>Task Type</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Last Updated</th>
                            <th>Due Date</th>
                            
                          </tr>
                        </thead>
                        <tbody>
                          {recentActivities.map((task, index) => (
                            <tr key={index}>
                              <td>
                                <h6 
                                  className="mb-0" 
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => handleTaskClick(task)}
                                  onMouseEnter={(e) => {
                                    e.target.style.transform = 'scale(1.01)';
                                    e.target.style.boxShadow = '0 3px 5px rgba(13, 110, 253, 0.4)';
                                    e.target.style.borderRadius = '3px';
                                    e.target.style.transition = 'all 0.2s ease';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.transform = 'scale(1)';
                                    e.target.style.boxShadow = 'none';
                                  }}
                                >
                                  {task.title?.substring(0,50) || 'No title'}
                                </h6>
                              </td>
                              <td>
                                <span>
                                  {task.task_type === 'SUBTASK' ? 'Subtask' : 
                                   task.task_type === 'DAILY_ROUTINE' ? 'Daily Routine Task' : 'Main Task'}
                                </span>
                              </td>
                              <td>
                                  <span className={`badge rounded-pill ${
                                  task.priority === 'URGENT' ? 'bg-danger' :
                                  task.priority === 'HIGH' ? 'bg-warning' :
                                  task.priority === 'MEDIUM' ? 'bg-info' : 'bg-secondary'
                                }`}>
                                  {task.priority}
                                </span>
                              </td>
                              <td>
                                <span className={`badge rounded-pill ${
                                  task.status === 'COMPLETED' ? 'bg-success' : 
                                  task.status === 'IN_PROGRESS' ? 'bg-info' : 
                                  task.status === 'SUBMITTED' ? 'bg-primary' : 
                                  task.status === 'CANCELLED' ? 'bg-danger' :
                                  'bg-secondary'
                                }`}>
                                  {task.status.replace('_', ' ')}
                                </span>
                              </td>
                              <td>{task.updated_at ? new Date(task.updated_at).toLocaleDateString() : 'N/A'}</td>
                              <td>{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</td>
                              
                            
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <div className="avatar-md mx-auto mb-3">
                        <div className="avatar-title bg-light text-muted rounded-circle">
                          <i className="ri-history-line ri-2x"></i>
                        </div>
                      </div>
                      <h5 className="mt-3">No recent activity</h5>
                      <p className="text-muted">
                        {dateRange.from && dateRange.to && dateRange.from === dateRange.to 
                          ? `No recent activity for ${new Date(dateRange.from).toLocaleDateString()}` 
                          : dateRange.from || dateRange.to 
                            ? "No recent activity found for the selected date range" 
                            : "No recent task activities found."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

       
        </div>
      </div>

      {/* Task Details Modal */}
      <TaskDetailsModal
        task={selectedTask}
        isOpen={isTaskModalOpen}
        onClose={handleCloseTaskModal}
      />
    </div>
  );
};

export default EmployeeDashboard;
