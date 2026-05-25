import React, { useState, useEffect, useContext } from 'react';
import { buildApiUrl, getAuthHeaders } from '../../config/api';
import { toast } from 'react-toastify';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ConfigContext } from '../../Context/ConfigContext';
import * as XLSX from 'xlsx';

const EmployeeTaskManagement = () => {
  const { staticFilesBaseURL } = useContext(ConfigContext) || {};
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedEmployeeData, setSelectedEmployeeData] = useState(null); // Store full employee object
  const [selectedEmployeeUserId, setSelectedEmployeeUserId] = useState(''); // Store the actual user ID
  const [loading, setLoading] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [taskFilter, setTaskFilter] = useState('ALL'); // ALL, MAIN_TASK, SUBTASK, DAILY_ROUTINE, DUE
  const [allTasks, setAllTasks] = useState([]); // Store all tasks for filtering
  const [allEmployeeTasks, setAllEmployeeTasks] = useState([]); // Store all employee tasks for accurate statistics
  const [showActivityModal, setShowActivityModal] = useState(false); // For activity modal
  const [activityCalendarData, setActivityCalendarData] = useState({}); // For calendar activity data
  const [currentActivityMonth, setCurrentActivityMonth] = useState(new Date()); // For month navigation
  const [loadingActivity, setLoadingActivity] = useState(false); // For loading state
  const [activeFilter, setActiveFilter] = useState(null); // For heatmap filtering
  const tasksPerPage = 20;

  // Fetch departments on component mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Fetch employee activity data when modal opens or month changes
  useEffect(() => {
    if (showActivityModal && selectedEmployeeUserId) {
      fetchEmployeeActivityData(selectedEmployeeUserId, currentActivityMonth);
    }
  }, [showActivityModal, selectedEmployeeUserId, currentActivityMonth]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch(buildApiUrl('/departments'), {
        credentials: 'include',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDepartments(data.data);
          
          // Check for URL parameters after departments are loaded
          const deptId = searchParams.get('departmentId');
          const empId = searchParams.get('employeeId');
          const userId = searchParams.get('userId');
          
          if (deptId) {
            setSelectedDepartment(deptId);
            // Fetch employees for this department
            fetchEmployeesForPreselection(deptId, empId, userId);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to fetch departments');
    }
  };

  // Fetch employees and auto-select if coming from URL params
  const fetchEmployeesForPreselection = async (departmentId, employeeId, userId) => {
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl(`/departments/${departmentId}/manager/employees`), {
        credentials: 'include',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setEmployees(data.data);
          
          // Auto-select employee if provided in URL
          // Note: employeeId from URL is the user_id, not employee_profile id
          if ((employeeId || userId) && data.data.length > 0) {
            // The employeeId/userId from URL is the user_id (from users table)
            // We need to find the employee by user_id field
            const userIdToFind = userId || employeeId;
            
            const employee = data.data.find(emp => 
              emp.user_id?.toString() === userIdToFind?.toString()
            );
            
            if (employee) {
              // Set selectedEmployee to the employee_profile id (for dropdown)
              setSelectedEmployee(employee.id.toString());
              setSelectedEmployeeData(employee); // Set employee data for display
              
              // Use user_id for fetching tasks
              setSelectedEmployeeUserId(employee.user_id);
              
              // Fetch tasks for this employee
              setTimeout(() => {
                fetchFilteredEmployeeTasks(employee.user_id, 1, 'ALL');
                // Also fetch all tasks for statistics
                fetchAllEmployeeTasks(employee.user_id);
              }, 100);
            } else {
              toast.info('Employee not found in this department. Please select manually.');
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async (departmentId) => {
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl(`/departments/${departmentId}/manager/employees`), {
        credentials: 'include',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEmployees(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeTasks = async (userId, page = 1) => { // Use userId instead of employeeId
    setLoading(true);
    try {
      // Fetch all tasks assigned to the user with pagination, including cancelled tasks
      const response = await fetch(buildApiUrl(`/tasks/user/${userId}?page=${page}&limit=${tasksPerPage}&include_cancelled=true`), {
        credentials: 'include',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Check if data.data is an array or has a tasks property
          let tasksData = [];
          let paginationData = null;
          
          if (Array.isArray(data.data)) {
            tasksData = data.data;
          } else if (data.data.tasks && Array.isArray(data.data.tasks)) {
            tasksData = data.data.tasks;
            paginationData = data.data.pagination;
          } else {
            console.error('Unexpected data structure:', data.data);
            toast.error('Unexpected data structure received');
            return;
          }
          
          // Use pagination data if available
          if (paginationData) {
            setTotalPages(paginationData.total_pages || 1);
            setTotalTasks(paginationData.total || tasksData.length);
          } else {
            setTotalPages(Math.ceil(tasksData.length / tasksPerPage));
            setTotalTasks(tasksData.length);
          }
          
          // Fetch additional details for each task
          const tasksWithDetails = await Promise.all(tasksData.map(async (task) => {
            // Fetch subtasks if this is a main task
            if (task.task_type === 'MAIN_TASK') {
              try {
                const subtasksResponse = await fetch(buildApiUrl(`/tasks/${task.id}/subtasks?include_cancelled=true`), {
                  credentials: 'include',
                  headers: getAuthHeaders()
                });
                
                if (subtasksResponse.ok) {
                  const subtasksData = await subtasksResponse.json();
                  if (subtasksData.success) {
                    task.subtasks = subtasksData.data.subtasks || subtasksData.data.tasks || [];
                  }
                }
              } catch (error) {
                console.error('Error fetching subtasks:', error);
              }
            }
            return task;
          }));
          
          setAllTasks(tasksWithDetails); // Store all tasks
          applyTaskFilter(tasksWithDetails, taskFilter); // Apply current filter
          setCurrentPage(page);
        }
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all tasks for an employee to get accurate statistics
  const fetchAllEmployeeTasks = async (userId) => {
    try {
      // Fetch all tasks assigned to the user without pagination by setting a high limit
      const response = await fetch(buildApiUrl(`/tasks/user/${userId}?limit=10000&include_cancelled=true`), {
        credentials: 'include',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Check if data.data is an array or has a tasks property
          let tasksData = [];
          
          if (Array.isArray(data.data)) {
            tasksData = data.data;
          } else if (data.data.tasks && Array.isArray(data.data.tasks)) {
            tasksData = data.data.tasks;
          }
          
          // Fetch subtasks for main tasks to get accurate counts
          const tasksWithSubtasks = await Promise.all(tasksData.map(async (task) => {
            // Fetch subtasks if this is a main task
            if (task.task_type === 'MAIN_TASK') {
              try {
                const subtasksResponse = await fetch(buildApiUrl(`/tasks/${task.id}/subtasks?include_cancelled=true`), {
                  credentials: 'include',
                  headers: getAuthHeaders()
                });
                
                if (subtasksResponse.ok) {
                  const subtasksData = await subtasksResponse.json();
                  if (subtasksData.success) {
                    task.subtasks = subtasksData.data.subtasks || subtasksData.data.tasks || [];
                  }
                }
              } catch (error) {
                console.error('Error fetching subtasks:', error);
              }
            }
            return task;
          }));
          
          setAllEmployeeTasks(tasksWithSubtasks);
        }
      }
    } catch (error) {
      console.error('Error fetching all employee tasks:', error);
      // Don't show toast error here as it's a background operation
    }
  };

  const handleDepartmentChange = (e) => {
    const departmentId = e.target.value;
    setSelectedDepartment(departmentId);
    setSelectedEmployee('');
    setSelectedEmployeeData(null);
    setSelectedEmployeeUserId(''); // Reset user ID
    setEmployees([]);
    setTasks([]);
    setAllTasks([]);
    setTotalPages(0);
    setTotalTasks(0);
    setCurrentPage(1);
    setTaskFilter('ALL');
    
    if (departmentId) {
      fetchEmployees(departmentId);
    }
  };

  const handleEmployeeChange = (e) => {
    const employeeId = e.target.value;
    const selectedEmp = employees.find(emp => emp.id && emp.id.toString() === employeeId);
    
    setSelectedEmployee(employeeId);
    setSelectedEmployeeData(selectedEmp || null);
    setImageLoadError(false); // Reset image error state when employee changes
    setTasks([]);
    setAllTasks([]);
    setTotalPages(0);
    setTotalTasks(0);
    setCurrentPage(1);
    setTaskFilter('ALL'); // Reset filter when employee changes
    
    // Store the actual user ID for fetching tasks
    if (selectedEmp && selectedEmp.user_id) {
      setSelectedEmployeeUserId(selectedEmp.user_id);
      fetchFilteredEmployeeTasks(selectedEmp.user_id, 1, 'ALL');
      // Also fetch all tasks for statistics
      fetchAllEmployeeTasks(selectedEmp.user_id);
    } else {
      setSelectedEmployeeUserId('');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && selectedEmployeeUserId) {
      fetchFilteredEmployeeTasks(selectedEmployeeUserId, newPage, taskFilter);
    }
  };

  // Apply task filter
  const applyTaskFilter = (tasksToFilter, filter) => {
    if (!tasksToFilter || tasksToFilter.length === 0) {
      return [];
    }

    let filteredTasks = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (filter) {
      case 'MAIN_TASK':
        filteredTasks = tasksToFilter.filter(task => task.task_type === 'MAIN_TASK');
        break;
      case 'SUBTASK':
        // Include subtasks from nested structures and standalone subtasks
        // First, collect all subtasks (both standalone and nested)
        const allSubtasks = tasksToFilter.flatMap(task => {
          if (task.task_type === 'SUBTASK') {
            return [task];
          } else if (task.task_type === 'MAIN_TASK' && task.subtasks) {
            return task.subtasks;
          }
          return [];
        });
        
        // Deduplicate subtasks by ID to avoid showing the same subtask twice
        // (a subtask can appear both as standalone and in a main task's subtasks array)
        const subtaskMap = new Map();
        allSubtasks.forEach(subtask => {
          if (subtask.id && !subtaskMap.has(subtask.id)) {
            subtaskMap.set(subtask.id, subtask);
          }
        });
        
        filteredTasks = Array.from(subtaskMap.values());
        break;
      case 'DAILY_ROUTINE':
        filteredTasks = tasksToFilter.filter(task => task.task_type === 'DAILY_ROUTINE');
        break;
      case 'DUE':
        filteredTasks = tasksToFilter.filter(task => {
          if (!task.due_date) return false;
          const dueDate = new Date(task.due_date);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate <= today && task.status !== 'COMPLETED' && task.status !== 'APPROVED' && task.status !== 'CANCELLED';
        });
        // Also include subtasks that are due
        tasksToFilter.forEach(task => {
          if (task.subtasks) {
            task.subtasks.forEach(subtask => {
              if (subtask.due_date) {
                const subtaskDueDate = new Date(subtask.due_date);
                subtaskDueDate.setHours(0, 0, 0, 0);
                if (subtaskDueDate <= today && subtask.status !== 'COMPLETED' && subtask.status !== 'APPROVED' && subtask.status !== 'CANCELLED') {
                  filteredTasks.push(subtask);
                }
              }
            });
          }
        });
        break;
      case 'ALL':
      default:
        filteredTasks = tasksToFilter;
        break;
    }

    return filteredTasks;
  };

  // Fetch filtered tasks with proper pagination
  const fetchFilteredEmployeeTasks = async (userId, page = 1, filter = 'ALL') => {
    setLoading(true);
    try {
      // Fetch all tasks for the user
      const allResponse = await fetch(buildApiUrl(`/tasks/user/${userId}?limit=10000&include_cancelled=true`), {
        credentials: 'include',
        headers: getAuthHeaders()
      });
      
      if (allResponse.ok) {
        const allData = await allResponse.json();
        if (allData.success) {
          let allTasksData = [];
          
          if (Array.isArray(allData.data)) {
            allTasksData = allData.data;
          } else if (allData.data.tasks && Array.isArray(allData.data.tasks)) {
            allTasksData = allData.data.tasks;
          }
          
          // Fetch subtasks for main tasks
          const tasksWithSubtasks = await Promise.all(allTasksData.map(async (task) => {
            if (task.task_type === 'MAIN_TASK') {
              try {
                const subtasksResponse = await fetch(buildApiUrl(`/tasks/${task.id}/subtasks?include_cancelled=true`), {
                  credentials: 'include',
                  headers: getAuthHeaders()
                });
                
                if (subtasksResponse.ok) {
                  const subtasksData = await subtasksResponse.json();
                  if (subtasksData.success) {
                    let allSubtasks = subtasksData.data.subtasks || subtasksData.data.tasks || [];
                    // Filter subtasks to only include those assigned to the selected employee
                    // Only show subtasks that are directly assigned to the selected employee
                    task.subtasks = allSubtasks.filter(subtask => {
                      // Check if subtask is assigned to the selected employee
                      const subtaskAssignedTo = subtask.assigned_to || subtask.assigned_to_id || subtask.user_id;
                      return subtaskAssignedTo && subtaskAssignedTo.toString() === userId.toString();
                    });
                  }
                }
              } catch (error) {
                console.error('Error fetching subtasks:', error);
              }
            }
            return task;
          }));
          
          // Apply filter to all tasks
          const filteredTasks = applyTaskFilter(tasksWithSubtasks, filter);
          
          // Store all tasks for future filtering
          setAllEmployeeTasks(tasksWithSubtasks);
          
          // Calculate pagination for filtered tasks
          const totalFilteredTasks = filteredTasks.length;
          const totalPagesFiltered = Math.ceil(totalFilteredTasks / tasksPerPage);
          
          // Get tasks for current page
          const startIndex = (page - 1) * tasksPerPage;
          const endIndex = startIndex + tasksPerPage;
          const tasksForCurrentPage = filteredTasks.slice(startIndex, endIndex);
          
          // Update state
          setAllTasks(tasksWithSubtasks);
          setTasks(tasksForCurrentPage);
          setTotalPages(totalPagesFiltered);
          setTotalTasks(totalFilteredTasks);
          setCurrentPage(page);
          setTaskFilter(filter);
        }
      }
    } catch (error) {
      console.error('Error fetching filtered tasks:', error);
      toast.error('Failed to fetch filtered tasks');
    } finally {
      setLoading(false);
    }
  };

  // Handle task filter card click
  const handleTaskFilterClick = (filter) => {
    // Fetch filtered tasks from server when filter changes
    if (selectedEmployeeUserId) {
      fetchFilteredEmployeeTasks(selectedEmployeeUserId, 1, filter);
    }
  };

  // Fetch employee activity calendar data
  const fetchEmployeeActivityData = async (userId, targetDate) => {
    if (!userId) return;
    
    setLoadingActivity(true);
    try {
      // Fetch all tasks for the employee (including daily routine tasks)
      const tasksResponse = await fetch(buildApiUrl(`/tasks/user/${userId}`), {
        credentials: 'include',
        headers: getAuthHeaders()
      });
      
      // Fetch all logs for the employee
      const logsResponse = await fetch(buildApiUrl(`/tasks/logs/user/${userId}`), {
        credentials: 'include',
        headers: getAuthHeaders()
      });
      
      if (tasksResponse.ok && logsResponse.ok) {
        const tasksData = await tasksResponse.json();
        const logsData = await logsResponse.json();
        
        if (tasksData.success && logsData.success) {
          // Process data to create calendar structure
          const processedData = processEmployeeCalendarData(
            tasksData.data.tasks || tasksData.data,
            logsData.data.logs || logsData.data,
            targetDate.getMonth(),
            targetDate.getFullYear()
          );
          setActivityCalendarData(processedData);
        } else {
          toast.error('Failed to load employee activity data');
        }
      } else {
        toast.error('Error loading employee activity data');
      }
    } catch (error) {
      console.error('Error fetching employee activity data:', error);
      toast.error('Failed to fetch employee activity data');
    } finally {
      setLoadingActivity(false);
    }
  };

  // Process employee calendar data to determine day colors
  const processEmployeeCalendarData = (tasks, logs, month, year) => {
    const data = {};
    const today = new Date();
    
    // Get all days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Create a map of logs by date for quick lookup
    const logsByDate = {};
    if (logs && Array.isArray(logs)) {
      logs.forEach(log => {
        if (log.created_at) {
          const logDate = new Date(log.created_at);
          const dateStr = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}-${String(logDate.getDate()).padStart(2, '0')}`;
          if (!logsByDate[dateStr]) {
            logsByDate[dateStr] = [];
          }
          logsByDate[dateStr].push(log);
        }
      });
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const currentDate = new Date(year, month, day);
      
      // Check if this is a future date
      const isFutureDate = currentDate > today;
      
      // Check if this is a Sunday (day of week = 0)
      const dayOfWeek = currentDate.getDay();
      const isSunday = dayOfWeek === 0;
      
      if (isFutureDate) {
        // Gray color for future dates
        data[dateStr] = { color: 'gray', tasks: [], logs: logsByDate[dateStr] || [] };
      } else if (isSunday) {
        // Check if Sunday has any activity (tasks or logs)
        const logsForDate = logsByDate[dateStr] || [];
        const taskIdsWithLogs = new Set(logsForDate.map(log => log.task_id));
        
        // Filter tasks that are active on this date OR have logs
        const relevantTasks = tasks.filter(task => {
          if (!task.created_at) return false;
          
          const taskCreatedDate = new Date(task.created_at);
          taskCreatedDate.setHours(0, 0, 0, 0);
          const taskCompletedDate = task.completed_at ? new Date(task.completed_at) : null;
          if (taskCompletedDate) {
            taskCompletedDate.setHours(0, 0, 0, 0);
          }
          
          // Check if task is active or has logs
          // const isActiveStatus = ['ASSIGNED', 'IN_PROGRESS', 'SUBMITTED'].includes(task.status);
            const isActiveStatus = task.status === 'IN_PROGRESS';
          const isCreatedBeforeOrOnDate = taskCreatedDate <= currentDate;
          const isNotCompletedOrCompletedAfterDate = !taskCompletedDate || taskCompletedDate >= currentDate;
          const isActiveTask = isActiveStatus && isCreatedBeforeOrOnDate && isNotCompletedOrCompletedAfterDate;
          const hasLogs = taskIdsWithLogs.has(task.id);
          
          return isActiveTask || hasLogs;
        });
        
        const hasActivityOnSunday = relevantTasks.length > 0 || logsForDate.length > 0;
        
        // If Sunday has no activity, show as gray (holiday/idle)
        if (!hasActivityOnSunday) {
          data[dateStr] = { color: 'gray', tasks: [], logs: [] };
        } else {
          // If Sunday has activity, still show as gray for holiday indication but show the activity
          data[dateStr] = { color: 'gray', tasks: relevantTasks, logs: logsForDate };
        }
      } else {
        // Filter tasks that are active on this date OR tasks that have logs on this date
        // Include daily routine tasks specifically
        const relevantTasks = tasks.filter(task => {
          if (!task.created_at) return false;
          
          const taskCreatedDate = new Date(task.created_at);
          taskCreatedDate.setHours(0, 0, 0, 0); // Set to start of day for comparison
          const taskCompletedDate = task.completed_at ? new Date(task.completed_at) : null;
          if (taskCompletedDate) {
            taskCompletedDate.setHours(0, 0, 0, 0); // Set to start of day for comparison
          }
          
          // For daily routine tasks, they should only be active on their creation date
          if (task.task_type === 'DAILY_ROUTINE') {
            // Reset time part for comparison
            const createdDate = new Date(taskCreatedDate);
            createdDate.setHours(0, 0, 0, 0);
            const currentCompareDate = new Date(currentDate);
            currentCompareDate.setHours(0, 0, 0, 0);
            
            // Daily routine task is only active on its creation date
            const isCreatedOnThisDate = createdDate.getTime() === currentCompareDate.getTime();
            const isNotCompleted = !taskCompletedDate || new Date(taskCompletedDate) >= currentDate;
            
            // Check if task has logs on this specific date
            const logsForDate = logsByDate[dateStr] || [];
            const taskHasLogsOnThisDate = logsForDate.some(log => log.task_id === task.id);
            
            // Include daily routine task if:
            // 1. It was created on this date AND is not completed, OR
            // 2. It has logs on this specific date
            return (isCreatedOnThisDate && isNotCompleted) || taskHasLogsOnThisDate;
          }
          
          // For regular tasks, check if they were active on this date
          // const isActiveStatus = ['ASSIGNED', 'IN_PROGRESS', 'SUBMITTED'].includes(task.status);
            const isActiveStatus = task.status === 'IN_PROGRESS';
          const isCreatedBeforeOrOnDate = taskCreatedDate <= currentDate;
          const isNotCompletedOrCompletedAfterDate = !taskCompletedDate || taskCompletedDate >= currentDate;
          const isActiveTask = isActiveStatus && isCreatedBeforeOrOnDate && isNotCompletedOrCompletedAfterDate;
          
          // Check if task has logs on this specific date (this includes completed tasks)
          const logsForDate = logsByDate[dateStr] || [];
          const taskHasLogsOnThisDate = logsForDate.some(log => log.task_id === task.id);
          
          // Include task if:
          // 1. It's currently active (ASSIGNED, IN_PROGRESS, SUBMITTED) OR
          // 2. It has logs on this specific date (even if completed)
          return isActiveTask || taskHasLogsOnThisDate;
        });
        
        // Get logs for this date
        const logsForDate = logsByDate[dateStr] || [];
        
        // Always show all relevant tasks
        const finalTasksToShow = relevantTasks;
        
        // Determine color based on log status for all relevant tasks
        if (finalTasksToShow.length > 0) {
          // Check if logs exist for any of the relevant tasks on this date
          const taskIdsWithLogs = new Set(logsForDate.map(log => log.task_id));
          
          // Check if ALL tasks have logs written
          const allTasksHaveLogs = finalTasksToShow.length > 0 && 
            finalTasksToShow.every(task => taskIdsWithLogs.has(task.id));
          
          if (allTasksHaveLogs) {
            // Green: All tasks have logs written
            data[dateStr] = { color: 'green', tasks: finalTasksToShow, logs: logsForDate };
          } else {
            // Red: Not all tasks have logs written (some or none)
            data[dateStr] = { color: 'red', tasks: finalTasksToShow, logs: logsForDate };
          }
        } else {
          // Yellow: No relevant tasks for this date
          // But check if there are logs for this date (which might be from completed tasks)
          if (logsForDate.length > 0) {
            // Show logs even if no active tasks
            data[dateStr] = { color: 'yellow', tasks: [], logs: logsForDate };
          } else {
            // No tasks and no logs
            data[dateStr] = { color: 'yellow', tasks: [], logs: logsForDate };
          }
        }
      }
    }
    
    return data;
  };

  // Calculate task counts
  const getTaskCounts = () => {
    // Use allEmployeeTasks for accurate statistics instead of just the current page
    const tasksToCount = allEmployeeTasks && allEmployeeTasks.length > 0 ? allEmployeeTasks : allTasks;
    
    if (!tasksToCount || tasksToCount.length === 0) {
      return {
        total: 0,
        main: 0,
        subtask: 0,
        dailyRoutine: 0,
        due: 0
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let mainCount = 0;
    let subtaskCount = 0;
    let dailyRoutineCount = 0;
    let dueCount = 0;

    tasksToCount.forEach(task => {
      // Count main tasks
      if (task.task_type === 'MAIN_TASK') {
        mainCount++;
      }
      // Count subtasks (only count tasks that are actually subtasks in the main array)
      // Don't count nested subtasks from task.subtasks array as they're already in tasksToCount
      if (task.task_type === 'SUBTASK') {
        subtaskCount++;
      }
      // Count daily routine
      if (task.task_type === 'DAILY_ROUTINE') {
        dailyRoutineCount++;
      }
      // Count due tasks (excluding completed/approved/cancelled)
      if (task.due_date) {
        const dueDate = new Date(task.due_date);
        dueDate.setHours(0, 0, 0, 0);
        if (dueDate <= today && task.status !== 'COMPLETED' && task.status !== 'APPROVED' && task.status !== 'CANCELLED') {
          dueCount++;
        }
      }
      // Note: We don't count nested subtasks from task.subtasks here because
      // they are already included in tasksToCount array as separate tasks
      // Counting them again would cause double-counting
    });

    // Total count is just the length of tasksToCount since all tasks (including subtasks) are already in the array
    // Nested subtasks in task.subtasks arrays are duplicates of tasks already in tasksToCount
    const totalCount = tasksToCount.length;

    return {
      total: totalCount,
      main: mainCount,
      subtask: subtaskCount,
      dailyRoutine: dailyRoutineCount,
      due: dueCount
    };
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task and all related data?')) {
      return;
    }

    setDeletingTaskId(taskId);
    try {
      const response = await fetch(buildApiUrl(`/tasks/${taskId}`), {
        method: 'DELETE',
        credentials: 'include',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Task deleted successfully');
          // Remove the deleted task from the list
          setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
          // Close modal if the deleted task was selected
          if (selectedTask && selectedTask.id === taskId) {
            handleCloseModal();
          }
        } else {
          toast.error(data.message || 'Failed to delete task');
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Error deleting task');
    } finally {
      setDeletingTaskId(null);
    }
  };

  const handleTaskClick = (task, parentTask = null) => {
    // If parent task is provided, add its info to the task object
    if (parentTask) {
      task.parentTaskTitle = parentTask.title;
      task.parentTaskId = parentTask.id;
    }
    setSelectedTask(task);
    setIsModalOpen(true);
    setIsClosing(false);
  };

  // Helper function to get parent task name for subtasks
  const getParentTaskName = (task) => {
    if (!task || task.task_type !== 'SUBTASK') return null;
    
    // Check if parent task info is already in the task object
    if (task.parentTaskTitle) {
      return task.parentTaskTitle;
    }
    
    // Try to find parent task from tasks list
    for (const mainTask of tasks) {
      if (mainTask.subtasks && mainTask.subtasks.some(st => st.id === task.id)) {
        return mainTask.title;
      }
    }
    
    return null;
  };

  const handleCloseModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setSelectedTask(null);
      setIsClosing(false);
    }, 300);
  };

  const handleViewTaskDetails = () => {
    if (selectedTask && selectedTask.id) {
      const url = `/admin/task_approvel/${selectedTask.id}`;
      window.open(url, '_blank');
      handleCloseModal();
    }
  };

  // Format date for timeline
  const formatTimelineDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Calculate timeline events
  const getTimelineEvents = (task) => {
    if (!task) return [];
    const events = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const today = new Date();

    // Task Assigned Date
    const assignedDate = task.assigned_at || task.created_at;
    if (assignedDate) {
      const date = new Date(assignedDate);
      events.push({
        title: 'Task Assigned',
        date: formatTimelineDate(assignedDate),
        dateObj: date,
        icon: 'ri-user-add-line',
        color: 'info',
        assignedBy: task.created_by_name || 'Unknown'
      });
    }

    // Task Started (only show if started_at exists and is different from assigned date, or if status is IN_PROGRESS)
    if (task.status === 'IN_PROGRESS' && task.started_at) {
      const startedDate = task.started_at;
      const assigned = task.assigned_at || task.created_at;
      // Only add if started date is different from assigned date
      if (new Date(startedDate).getTime() !== new Date(assigned).getTime()) {
        const date = new Date(startedDate);
        events.push({
          title: 'Task Started',
          date: formatTimelineDate(startedDate),
          dateObj: date,
          icon: 'ri-play-circle-line',
          color: 'warning'
        });
      }
    } else if (task.started_at && task.status !== 'ASSIGNED') {
      const date = new Date(task.started_at);
      events.push({
        title: 'Task Started',
        date: formatTimelineDate(task.started_at),
        dateObj: date,
        icon: 'ri-play-circle-line',
        color: 'warning'
      });
    }

    // Task Submitted - always show if task was submitted (status indicates submission)
    // For completed/approved tasks, they must have been submitted first
    if (task.status === 'SUBMITTED' || task.status === 'IN_REVIEW' || task.status === 'COMPLETED' || task.status === 'APPROVED') {
      // Use submitted_at if available, otherwise use updated_at as proxy
      const submittedDate = task.submitted_at || task.updated_at;
      if (submittedDate) {
        const date = new Date(submittedDate);
        const assigned = task.assigned_at || task.created_at;
        const started = task.started_at;
        const assignedTime = assigned ? new Date(assigned).getTime() : 0;
        const startedTime = started ? new Date(started).getTime() : 0;
        const submittedTime = date.getTime();
        
        // Only add if it's different from assigned and started dates to avoid duplicates
        if (submittedTime !== assignedTime && submittedTime !== startedTime) {
          events.push({
            title: 'Task Submitted',
            date: formatTimelineDate(submittedDate),
            dateObj: date,
            icon: 'ri-upload-cloud-line',
            color: 'primary'
          });
        }
      }
    }

    // Task Completed - always show if completed_at exists
    if (task.completed_at) {
      const date = new Date(task.completed_at);
      events.push({
        title: 'Task Completed',
        date: formatTimelineDate(task.completed_at),
        dateObj: date,
        icon: 'ri-checkbox-circle-line',
        color: 'success'
      });
    }

    // Sort events by date chronologically
    return events.sort((a, b) => {
      return a.dateObj - b.dateObj;
    });
  };

  // Calculate time spent in days
  // Time should be calculated from assigned/created date to submitted date
  // If task is not yet submitted, calculate to current date
  const getTimeSpent = (task) => {
    if (!task) return null;
    
    const startDate = task.assigned_at || task.created_at;
    if (!startDate) return null;

    let endDate = null;
    
    // Determine end date based on status
    // If task is submitted (SUBMITTED, IN_REVIEW, COMPLETED, APPROVED), use submitted date
    if (task.status === 'SUBMITTED' || task.status === 'IN_REVIEW' || task.status === 'COMPLETED' || task.status === 'APPROVED') {
      // Use submitted_at if available, otherwise use updated_at as proxy for submission date
      endDate = task.submitted_at || task.updated_at;
    } else if (task.status === 'IN_PROGRESS' || task.status === 'ASSIGNED') {
      // If still in progress or assigned, use current date
      endDate = new Date();
    }

    if (!endDate) return null;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end - start;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const getTaskTypeLabel = (taskType) => {
    switch (taskType) {
      case 'MAIN_TASK': return 'Main Task';
      case 'SUBTASK': return 'Subtask';
      case 'DAILY_ROUTINE': return 'Daily Routine';
      default: return taskType;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'CREATED': return 'bg-secondary';
      case 'ASSIGNED': return 'bg-secondary';
      case 'IN_PROGRESS': return 'bg-info';
      case 'SUBMITTED': return 'bg-primary';
      case 'IN_REVIEW': return 'bg-warning';
      case 'RETURNED': return 'bg-danger';
      case 'APPROVED': return 'bg-success';
      case 'COMPLETED': return 'bg-success';
      case 'CANCELLED': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = date.getDate();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Format date for Excel (YYYY-MM-DD format)
  const formatDateForExcel = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
  };

  // Generate Excel report for selected employee's tasks
  const generateExcelReport = async () => {
    if (!selectedEmployeeUserId || !selectedEmployeeData) {
      toast.error('Please select an employee first');
      return;
    }

    try {
      toast.info('Generating report...');
      
      // Fetch all tasks for the selected employee
      const response = await fetch(buildApiUrl(`/tasks/user/${selectedEmployeeUserId}?limit=10000&include_cancelled=true`), {
        credentials: 'include',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        toast.error('Failed to fetch tasks for report');
        return;
      }

      const data = await response.json();
      if (!data.success) {
        toast.error('Failed to fetch tasks for report');
        return;
      }

      let tasksData = [];
      if (Array.isArray(data.data)) {
        tasksData = data.data;
      } else if (data.data.tasks && Array.isArray(data.data.tasks)) {
        tasksData = data.data.tasks;
      }

      // Fetch subtasks for main tasks if needed
      const tasksWithSubtasks = await Promise.all(tasksData.map(async (task) => {
        // If this is a main task, fetch its subtasks
        if (task.task_type === 'MAIN_TASK') {
          try {
            const subtasksResponse = await fetch(buildApiUrl(`/tasks/${task.id}/subtasks?include_cancelled=true`), {
              credentials: 'include',
              headers: getAuthHeaders()
            });
            if (subtasksResponse.ok) {
              const subtasksData = await subtasksResponse.json();
              if (subtasksData.success) {
                task.subtasks = subtasksData.data.subtasks || subtasksData.data.tasks || subtasksData.data || [];
              }
            }
          } catch (error) {
            console.error(`Error fetching subtasks for task ${task.id}:`, error);
          }
        }
        return task;
      }));

      // Create a map of task IDs to task titles for quick lookup of parent task titles
      const taskIdToTitleMap = new Map(tasksWithSubtasks.map(t => [t.id, t.title]));

      // Flatten tasks and subtasks into a single array
      // Only include tasks from the main tasksData array, not nested subtasks from task.subtasks
      // because nested subtasks are duplicates of tasks already in tasksData
      const flattenedTasks = [];
      tasksWithSubtasks.forEach(task => {
        // Add all tasks from the main array (main tasks, daily routines, and subtasks)
        // All tasks in tasksData are already separate entities, so we include them all
        flattenedTasks.push({
          ...task,
          isSubtask: task.task_type === 'SUBTASK' ? true : false,
          parentTaskTitle: task.parent_task_id ? (taskIdToTitleMap.get(task.parent_task_id) || null) : null
        });

        // Don't add nested subtasks from task.subtasks array because they're already
        // in the tasksData array as separate tasks. Adding them again would cause duplicates.
        // The nested subtasks in task.subtasks are just references to tasks already in tasksData
      });

      // Prepare data for Excel
      const excelData = flattenedTasks.map(task => {
        const timeSpent = getTimeSpent(task);
        const assignedDate = task.assigned_at || task.created_at;
        
        return {
          'Task ID': task.id || 'N/A',
          'Type': task.isSubtask ? 'Subtask (from Main)' : getTaskTypeLabel(task.task_type) || 'N/A',
          'Parent Task': task.parentTaskTitle || 'N/A',
          'Title': task.title || 'N/A',
          'Description': task.description ? (task.description.length > 100 ? task.description.substring(0, 100) + '...' : task.description) : 'N/A',
          'Assigned Date': assignedDate ? formatDateForExcel(assignedDate) : 'N/A',
          'Started Date': task.started_at ? formatDateForExcel(task.started_at) : 'N/A',
          'Submitted Date': task.submitted_at || task.updated_at ? formatDateForExcel(task.submitted_at || task.updated_at) : 'N/A',
          'Completed Date': task.completed_at ? formatDateForExcel(task.completed_at) : 'N/A',
          'Due Date': task.due_date ? formatDateForExcel(task.due_date) : 'N/A',
          'Priority': task.priority || 'N/A',
          'Status': task.status ? task.status.replace(/_/g, ' ') : 'N/A',
          'Assigned By': task.created_by_name || task.assigned_by_name || 'N/A',
          'Time Spent (Days)': timeSpent !== null ? timeSpent : 'N/A',
          'Created At': task.created_at ? formatDateForExcel(task.created_at) : 'N/A',
          'Updated At': task.updated_at ? formatDateForExcel(task.updated_at) : 'N/A'
        };
      });

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 10 }, // Task ID
        { wch: 20 }, // Type
        { wch: 30 }, // Parent Task
        { wch: 40 }, // Title
        { wch: 50 }, // Description
        { wch: 15 }, // Assigned Date
        { wch: 15 }, // Started Date
        { wch: 15 }, // Submitted Date
        { wch: 15 }, // Completed Date
        { wch: 15 }, // Due Date
        { wch: 12 }, // Priority
        { wch: 15 }, // Status
        { wch: 20 }, // Assigned By
        { wch: 18 }, // Time Spent
        { wch: 15 }, // Created At
        { wch: 15 }  // Updated At
      ];
      ws['!cols'] = colWidths;

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Employee Tasks');

      // Generate filename
      const employeeName = selectedEmployeeData.name || 'Employee';
      const fileName = `${employeeName}_Tasks_Report_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Download file
      XLSX.writeFile(wb, fileName);
      toast.success('Excel report generated successfully');
    } catch (error) {
      console.error('Error generating Excel report:', error);
      toast.error('Failed to generate Excel report');
    }
  };

  return (
    <>
      {/* Vertical Overlay*/}
      <div className="vertical-overlay" />
      {/* ============================================================== */}
      {/* Start right Content here */}
      {/* ============================================================== */}
      <div className="main-content">
        <div className="page-content">
          <div className="container-fluid">
            <div className="row">
              <div className="col-12">
                <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                  <h4 className="mb-sm-0">Employee Task Management</h4>
                  <div className="page-title-right">
                    <ol className="breadcrumb m-0">
                      <li className="breadcrumb-item">
                        <Link to="/admin/dashboard">Admin</Link>
                      </li>
                      <li className="breadcrumb-item active">Task Management</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-lg-12">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">Task Management</h5>
                  </div>
                  <div className="card-body">
                    <div className="row mb-4">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Select Department</label>
                          <select 
                            className="form-select"
                            value={selectedDepartment}
                            onChange={handleDepartmentChange}
                            disabled={loading}
                          >
                            <option value="">Choose Department</option>
                            {departments.map(department => (
                              <option key={department.id} value={department.id}>
                                {department.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Select Employee</label>
                          <select 
                            className="form-select"
                            value={selectedEmployee}
                            onChange={handleEmployeeChange}
                            disabled={!selectedDepartment || loading}
                          >
                            <option value="">Choose Employee</option>
                            {employees.map(employee => (
                              <option key={employee.id} value={employee.id}>
                                {employee.name} {employee.employee_code ? `(${employee.employee_code})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    {/* Employee Information and Task Count Cards */}
                    {selectedEmployeeData && (
                      <div className="row mb-4">
                        {/* Employee Info Card */}
                        <div className="col-12 mb-3">
                          <div className="card border-0 shadow-sm">
                            <div className="card-body">
                              <div className="d-flex align-items-center">
                                <div className="me-3">
                                  {(() => {
                                    const profileImage = selectedEmployeeData.profile_image;
                                    // If there's a profile image and no error, show the image
                                    if (profileImage && !imageLoadError) {
                                      const imagePath = profileImage.split('?')[0];
                                      const imageUrl = staticFilesBaseURL 
                                        ? `${staticFilesBaseURL}/${imagePath}?t=${new Date().getTime()}`
                                        : (profileImage.startsWith('http') ? profileImage : `${process.env.REACT_APP_SERVER_URL || 'https://task.ipshopy.com'}${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`);
                                      return (
                                        <img 
                                          src={imageUrl} 
                                          alt={selectedEmployeeData.name || 'Employee'}
                                          className="rounded-circle border border-2 border-primary"
                                          style={{ width: '130px', height: '130px', objectFit: 'cover' }}
                                          onError={() => {
                                            setImageLoadError(true);
                                          }}
                                        />
                                      );
                                    }
                                    // Show placeholder if no image or image failed to load
                                    return (
                                      <div 
                                        className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center border border-2 border-primary" 
                                        style={{ 
                                          width: '130px', 
                                          height: '130px'
                                        }}
                                      >
                                        <i className="ri-user-line fs-3"></i>
                                      </div>
                                    );
                                  })()}
                                </div>
                                <div className="flex-grow-1">
                                  <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                      <h5 className="mb-1">{selectedEmployeeData.name}</h5>
                                      <p className="text-muted mb-0">
                                        <i className="ri-building-line me-1"></i>
                                        {departments.find(d => d.id.toString() === selectedDepartment)?.name || 'N/A'}
                                      </p>
                                      {(selectedEmployeeData.employee_code || selectedEmployeeData.employeeCode) && (
                                        <small className="text-muted">
                                          <i className="ri-id-card-line me-1"></i>
                                          Code: {selectedEmployeeData.employee_id || selectedEmployeeData.employee_id}
                                        </small>
                                      )}
                                          <div className="d-flex justify-content-end mt-2">
                                            <button 
                                              className="btn btn-sm btn-outline-primary ms-2"
                                              onClick={() => setShowActivityModal(true)}
                                            >
                                              <i className="ri-bar-chart-line me-1"></i>
                                              View Activity
                                            </button>
                                            <button 
                                              className="btn btn-sm btn-outline-success ms-2"
                                              onClick={generateExcelReport}
                                              disabled={!selectedEmployeeUserId || loading}
                                            >
                                              <i className="ri-file-excel-2-line me-1"></i>
                                              Generate Report
                                            </button>
                                          </div>                                    </div>
                                   
                                  </div>
                               
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Task Count Cards - All in one row */}
                        <div className="col-12">
                          <div className="row g-2  p-3 rounded">
                            {(() => {
                              const counts = getTaskCounts();
                              return (
                                <>
                                  {/* Total Tasks */}
                                  <div className="col">
                                    <div 
                                      className={`card border-0 shadow-sm ${taskFilter === 'ALL' ? 'border-primary border-2' : ''}`}
                                      style={{ cursor: 'pointer', transition: 'all 0.3s', }}
                                      onClick={() => handleTaskFilterClick('ALL')}
                                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                      <div className="card-body text-center p-2" style={{ opacity: 1, backgroundColor: taskFilter === 'ALL' ? 'rgba(13, 110, 253, 0.2)' : 'rgba(13, 110, 253, 0.1)', border: taskFilter === 'ALL' ? '1.7px solid #0d6efd' : 'none', borderRadius: '10px' }}>
                                        <i className="ri-task-line fs-4 text-primary d-block mb-1"></i>
                                        <h5 className="mb-0 fw-bold">{counts.total}</h5>
                                        <small className="text-muted">Total</small>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Main Tasks */}
                                  <div className="col">
                                    <div 
                                      className={`card border-0 shadow-sm ${taskFilter === 'MAIN_TASK' ? 'border-primary border-4' : ''}`}
                                      style={{ cursor: 'pointer', transition: 'all 0.3s', }}
                                      onClick={() => handleTaskFilterClick('MAIN_TASK')}
                                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                      <div className="card-body text-center p-2" style={{ opacity: 1, backgroundColor: taskFilter === 'MAIN_TASK' ? 'rgba(13, 202, 240, 0.2)' : 'rgba(13, 202, 240, 0.1)', border: taskFilter === 'MAIN_TASK' ? '1.7px solid #0dcaf0' : 'none', borderRadius: '10px' }}>
                                        <i className="ri-file-list-3-line fs-4 text-info d-block mb-1"></i>
                                        <h5 className="mb-0 fw-bold">{counts.main}</h5>
                                        <small className="text-muted">Main</small>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Subtasks */}
                                  <div className="col">
                                    <div 
                                      className={`card border-0 shadow-sm ${taskFilter === 'SUBTASK' ? 'border-primary border-2' : ''}`}
                                      style={{ cursor: 'pointer', transition: 'all 0.3s', }}
                                      onClick={() => handleTaskFilterClick('SUBTASK')}
                                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                      <div className="card-body text-center p-2" style={{ opacity: 1, backgroundColor: taskFilter === 'SUBTASK' ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255, 193, 7, 0.1)', border: taskFilter === 'SUBTASK' ? '1.7px solid #ffc107' : 'none', borderRadius: '10px' }}>
                                        <i className="ri-file-list-3-line fs-4 text-warning d-block mb-1"></i>
                                        <h5 className="mb-0 fw-bold">{counts.subtask}</h5>
                                        <small className="text-muted">Subtask</small>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Daily Routine Tasks */}
                                  <div className="col">
                                    <div 
                                      className={`card border-0 shadow-sm ${taskFilter === 'DAILY_ROUTINE' ? 'border-primary border-2' : ''}`}
                                      style={{ cursor: 'pointer', transition: 'all 0.3s', }}
                                      onClick={() => handleTaskFilterClick('DAILY_ROUTINE')}
                                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                      <div className="card-body text-center p-2" style={{ opacity: 1, backgroundColor: taskFilter === 'DAILY_ROUTINE' ? 'rgba(25, 135, 84, 0.2)' : 'rgba(25, 135, 84, 0.1)', border: taskFilter === 'DAILY_ROUTINE' ? '1.7px solid #198754' : 'none', borderRadius: '10px' }}>
                                        <i className="ri-calendar-check-line fs-4 text-success d-block mb-1"></i>
                                        <h5 className="mb-0 fw-bold">{counts.dailyRoutine}</h5>
                                        <small className="text-muted">Daily Routine</small>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Due Tasks */}
                                  <div className="col">
                                    <div 
                                      className={`card border-0 shadow-sm ${taskFilter === 'DUE' ? 'border-danger border-2' : ''}`}
                                      style={{ cursor: 'pointer', transition: 'all 0.3s', }}
                                      onClick={() => handleTaskFilterClick('DUE')}
                                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                      <div className="card-body text-center p-2" style={{ opacity: 1, backgroundColor: taskFilter === 'DUE' ? 'rgba(220, 53, 69, 0.2)' : 'rgba(220, 53, 69, 0.1)', border: taskFilter === 'DUE' ? '1.7px solid #dc3545' : 'none', borderRadius: '10px' }}>
                                        <i className="ri-alarm-warning-line fs-4 text-danger d-block mb-1"></i>
                                        <h5 className="mb-0 fw-bold">{counts.due}</h5>
                                        <small className="text-muted">Due</small>
                                      </div>
                                    </div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    )}












                    {loading && (
                      <div className="text-center">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    )}

                    {!loading && tasks.length > 0 && (
                      <>
                        <div className="table-responsive">
                          <table className="table table-striped table-hover">
                            <thead>
                              <tr>
                                <th>Type</th>
                                <th>Title</th>
                                <th>Assigned Date</th>
                                <th>Due Date</th>
                                <th>Priority</th>
                                <th>Status</th>
                                
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                // Create a set of main task IDs that are in the current tasks list
                                // This helps us identify which subtasks should only be shown nested under their parent
                                const mainTaskIds = new Set(
                                  tasks
                                    .filter(t => t.task_type === 'MAIN_TASK')
                                    .map(t => t.id)
                                );
                                
                                // Filter tasks to exclude subtasks that have a parent task in the current list
                                // These subtasks will only be shown nested under their parent main task
                                // Exception: When SUBTASK filter is active, show all subtasks as standalone rows
                                const tasksToDisplay = tasks.filter(task => {
                                  // When SUBTASK filter is active, show all subtasks (they're already filtered and deduplicated)
                                  if (taskFilter === 'SUBTASK') {
                                    return true;
                                  }
                                  
                                  // If it's a subtask with a parent_task_id, check if that parent is in the list
                                  if (task.task_type === 'SUBTASK' && task.parent_task_id) {
                                    const parentId = task.parent_task_id;
                                    // If parent is in the list, don't show this subtask as a separate row
                                    // It will be shown nested under the parent
                                    return !mainTaskIds.has(parentId);
                                  }
                                  // Show all other tasks (main tasks, daily routines, standalone subtasks)
                                  return true;
                                });
                                
                                return tasksToDisplay.map(task => (
                                  <React.Fragment key={task.id}>
                                    <tr 
                                      style={{ cursor: 'pointer' }}
                                      onClick={() => handleTaskClick(task)}
                                    >
                                      
                                      <td>
                                        
                                        {task.task_type === 'MAIN_TASK' ? (
                                  <span className="badge bg-primary">Main Task</span>
                                ) : task.task_type === 'SUBTASK' ? (
                                  <span className="badge bg-info">Subtask</span>
                                ) : task.task_type === 'DAILY_ROUTINE' ? (
                                  <span className="badge bg-success">Daily Routine</span>
                                ) : (
                                  <span className="badge bg-secondary">{task.task_type || 'N/A'}</span>
                                )}
                                      </td>
                                      <td>{task.title}</td>
                                      <td>{formatDate(task.created_at)}</td>
                                      <td>{formatDate(task.due_date)}</td>
                                      <td>
                                        <span className={`badge ${
                                          task.priority === 'HIGH' || task.priority === 'URGENT' 
                                            ? 'bg-danger' 
                                            : task.priority === 'MEDIUM' 
                                              ? 'bg-warning' 
                                              : 'bg-info'
                                        }`}>
                                          {task.priority}
                                        </span>
                                      </td>
                                      <td>
                                        <span className={`badge ${getStatusBadgeClass(task.status)}`}>
                                          {task.status.replace('_', ' ')}
                                        </span>
                                      </td>
                                    
                                      
                                    </tr>
                                    {/* Only show nested subtasks when NOT filtering by SUBTASK (when SUBTASK filter is active, subtasks are shown as standalone rows) */}
                                    {taskFilter !== 'SUBTASK' && task.subtasks && task.subtasks.length > 0 && (
                                      task.subtasks
                                        .filter(subtask => {
                                          // Only show subtasks that are directly assigned to the selected employee
                                          const subtaskAssignedTo = subtask.assigned_to || subtask.assigned_to_id || subtask.user_id;
                                          return subtaskAssignedTo && subtaskAssignedTo.toString() === selectedEmployeeUserId.toString();
                                        })
                                        .map(subtask => (
                                      <tr 
                                        key={subtask.id} 
                                        className="table-light"
                                        style={{ cursor: 'pointer' }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleTaskClick(subtask, task);
                                        }}
                                      >
                                        <td>
                                          <span className="badge bg-secondary">
                                            Subtask (from Main)
                                          </span>
                                        </td>
                                        
                                        <td>
                                          <i className="ri-subtask-line me-2"></i>
                                          {subtask.title}
                                        </td>
                                        <td>{formatDate(subtask.created_at)}</td>
                                        <td>{formatDate(subtask.due_date)}</td>
                                        <td>
                                          <span className={`badge ${
                                            subtask.priority === 'HIGH' || subtask.priority === 'URGENT' 
                                              ? 'bg-danger' 
                                              : subtask.priority === 'MEDIUM' 
                                                ? 'bg-warning' 
                                                : 'bg-info'
                                          }`}>
                                            {subtask.priority}
                                          </span>
                                        </td>
                                        <td>
                                          <span className={`badge ${getStatusBadgeClass(subtask.status)}`}>
                                            {subtask.status.replace('_', ' ')}
                                          </span>
                                        </td>
                                    
                                      </tr>
                                    ))
                                  )}
                                </React.Fragment>
                              ));
                              })()}
                            </tbody>
                          </table>
                        </div>
                        
                        {/* Pagination */}
                        {totalPages > 1 && (
                          <div className="row">
                            <div className="col-sm-12 col-md-5 d-flex align-items-center justify-content-start">
                              <div className="dataTables_info">
                                Showing page {currentPage} of {totalPages} of {totalTasks} tasks
                              </div>
                            </div>
                            <div className="col-sm-12 col-md-7 d-flex align-items-center justify-content-end">
                              <div className="dataTables_paginate paging_simple_numbers">
                                <ul className="pagination">
                                  <li className={`paginate_button page-item previous ${currentPage === 1 ? 'disabled' : ''}`}>
                                    <button 
                                      className="page-link" 
                                      onClick={() => handlePageChange(currentPage - 1)}
                                      disabled={currentPage === 1}
                                    >
                                      Previous
                                    </button>
                                  </li>
                               
                             
                                  
                                  {[...Array(totalPages)].map((_, index) => {
                                    const page = index + 1;
                                    // Show first, last, current, and nearby pages
                                    if (page === 1 || page === totalPages || 
                                        (page >= currentPage - 2 && page <= currentPage + 2)) {
                                      return (
                                        <li 
                                          key={page} 
                                          className={`paginate_button page-item ${currentPage === page ? 'active' : ''}`}
                                        >
                                          <button 
                                            className="page-link" 
                                            onClick={() => handlePageChange(page)}
                                          >
                                            {page}
                                          </button>
                                        </li>
                                      );
                                    } else if (page === currentPage - 3 || page === currentPage + 3) {
                                      return <li key={page} className="paginate_button page-item disabled"><span className="page-link">...</span></li>;
                                    }
                                    return null;
                                  })}
                                  
                                  
                                  <li className={`paginate_button page-item next ${currentPage === totalPages ? 'disabled' : ''}`}>
                                    <button 
                                      className="page-link" 
                                      onClick={() => handlePageChange(currentPage + 1)}
                                      disabled={currentPage === totalPages}
                                    >
                                      Next
                                    </button>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {!loading && selectedEmployee && tasks.length === 0 && (
                      <div className="text-center py-5">
                        <i className="ri-task-line ri-2x text-muted mb-3"></i>
                        <h5>No tasks found for this employee</h5>
                        <p className="text-muted">This employee doesn't have any assigned tasks yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Modal */}
      {isModalOpen && selectedTask && (
        <>
          {/* Backdrop */}
          <div 
            onClick={handleCloseModal}
            style={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1040,
              opacity: isClosing ? 0 : 1,
              transition: 'opacity 0.3s ease-in'
            }}
          ></div>
          
          {/* Modal Container */}
          <div 
            className="modal fade show"
            style={{ 
              display: 'block', 
              zIndex: 1050,
              position: 'fixed',
              top: 0,
              right: 0,
              left: 'auto',
              height: '100vh',
              width: '500px',
              maxWidth: '90vw',
              margin: 0,
              padding: 0,
              animation: isClosing ? 'slideOutRight 0.3s ease-in' : 'slideInRight 0.3s ease-out',
              transform: isClosing ? 'translateX(100%)' : 'translateX(0)',
              transition: isClosing ? 'transform 0.3s ease-in, opacity 0.3s ease-in' : 'none'
            }}
            tabIndex="-1"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCloseModal();
              }
            }}
          >
            <div 
              className="modal-dialog modal-dialog-scrollable h-100 m-0"
              style={{ 
                maxWidth: '100%', 
                width: '100%',
                margin: 0
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content h-100 border-0 rounded-0 shadow-lg">
                {/* Modal Header */}
                <div className="modal-header text border-0">
                  <h5 className="modal-title mb-0">
                    <i className="ri-task-line me-2"></i>
                    Task Details
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close btn-close-danger" 
                    onClick={handleCloseModal}
                    aria-label="Close"
                  ></button>
                </div>

                {/* Modal Body */}
                <div className="modal-body p-4" style={{ paddingBottom: '100px' }}>
                  {/* Task Title */}
                  <div className="text-center mb-4 pb-3 border-bottom">
                    <h4 className="mb-2 fw-bold">{selectedTask.title || 'Untitled Task'}</h4>
                    <div className="d-flex justify-content-center gap-2 flex-wrap mb-3">
                      {selectedTask.task_type && (
                        <span className={`badge rounded-pill ${
                          selectedTask.task_type === 'MAIN_TASK' ? 'bg-primary' :
                          selectedTask.task_type === 'SUBTASK' ? 'bg-info' :
                          selectedTask.task_type === 'DAILY_ROUTINE' ? 'bg-success' : 'bg-secondary'
                        }`}>
                          {selectedTask.task_type.replace('_', ' ')}
                        </span>
                      )}
                      {selectedTask.status && (
                        <span className={`badge rounded-pill ${getStatusBadgeClass(selectedTask.status)}`}>
                          {selectedTask.status.replace('_', ' ')}
                        </span>
                      )}
                      {selectedTask.priority && (
                        <span className={`badge rounded-pill ${
                          selectedTask.priority === 'HIGH' || selectedTask.priority === 'URGENT' ? 'bg-danger' :
                          selectedTask.priority === 'MEDIUM' ? 'bg-warning' : 'bg-info'
                        }`}>
                          {selectedTask.priority}
                        </span>
                      )}
                    </div>
                    {/* Parent Task Name for Subtasks */}
                    {selectedTask.task_type === 'SUBTASK' && getParentTaskName(selectedTask) && (
                      <div className="mt-2">
                        <small className="text-muted">
                          <i className="ri-subtask-line me-1"></i>
                          Parent Task: <span className="fw-semibold text-primary">{getParentTaskName(selectedTask)}</span>
                        </small>
                      </div>
                    )}
                  </div>

                  {/* Timeline Section */}
                  {/* <div className="card border-0 shadow-sm mb-3">
                    <div className="card-body">
                      <h6 className="mb-3 text-primary">
                        <i className="ri-time-line me-2"></i>
                        Timeline
                      </h6>
                      <div className="timeline">
                        {getTimelineEvents(selectedTask).map((event, index) => (
                          <div key={index} className="d-flex mb-3">
                            <div className={`flex-shrink-0 me-3 text-${event.color}`}>
                              <i className={`${event.icon} fs-4`}></i>
                            </div>
                            <div className="flex-grow-1">
                              <h6 className={`mb-1 ${event.isCurrent ? 'text-info fw-bold' : ''}`}>
                                {event.title}
                              </h6>
                              <p className={`mb-0 small ${event.color === 'danger' ? 'text-danger' : 'text-muted'}`}>
                                {event.date}
                              </p>
                              {event.assignedBy && (
                                <p className="text-muted mb-0 small">Assigned by: {event.assignedBy}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div> */}

                  {/* Task Information */}
                  <div className="card border-0 shadow-sm mb-3">
                    <div className="card-body">
                      <h6 className="mb-3 text-primary">
                        <i className="ri-information-line me-2"></i>
                        Task Information
                      </h6>
                      
                      {/* Parent Task Name for Subtasks */}
                      {selectedTask.task_type === 'SUBTASK' && getParentTaskName(selectedTask) && (
                        <div className="mb-3 pb-3 border-bottom">
                          <div className="d-flex align-items-center">
                            <div className="avatar-sm bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                              <i className="ri-task-line text-primary fs-5"></i>
                            </div>
                            <div className="flex-grow-1">
                              <p className="text-muted mb-0 fs-12 text-uppercase fw-semibold">Parent Task</p>
                              <p className="mb-0 fw-bold text-primary">{getParentTaskName(selectedTask)}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Assigned By */}
                      {selectedTask.created_by_name && (
                        <div className="mb-3 pb-3 border-bottom">
                          <div className="d-flex align-items-center">
                            <div className="avatar-sm bg-info bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                              <i className="ri-user-add-line text-info fs-5"></i>
                            </div>
                            <div className="flex-grow-1">
                              <p className="text-muted mb-0 fs-12 text-uppercase fw-semibold">Assigned By</p>
                              <p className="mb-0 fw-bold">{selectedTask.created_by_name}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Time Spent */}
                      {(() => {
                        const timeSpent = getTimeSpent(selectedTask);
                        if (timeSpent !== null) {
                          return (
                            <div className="mb-3 pb-3 border-bottom">
                              <div className="d-flex align-items-center">
                                <div className="avatar-sm bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                                  <i className="ri-timer-line text-success fs-5"></i>
                                </div>
                                <div className="flex-grow-1">
                                  <p className="text-muted mb-0 fs-12 text-uppercase fw-semibold">
                                    {selectedTask.status === 'COMPLETED' || selectedTask.status === 'APPROVED' 
                                      ? 'Time Spent Till Submitted' 
                                      : selectedTask.status === 'SUBMITTED' || selectedTask.status === 'IN_REVIEW'
                                        ? 'Time Spent Till Submitted'
                                        : 'Time Spent (In Progress)'}
                                  </p>
                                  <p className="mb-0 fw-bold text-success">
                                    {timeSpent} {timeSpent === 1 ? 'day' : 'days'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* Due Date */}
                      {selectedTask.due_date && (
                        <div className="mb-3">
                          <div className="d-flex align-items-center">
                            <div className={`avatar-sm rounded-circle d-flex align-items-center justify-content-center me-3 ${new Date(selectedTask.due_date) < new Date() && selectedTask.status !== 'COMPLETED' && selectedTask.status !== 'CANCELLED' ? 'bg-danger bg-opacity-10' : 'bg-warning bg-opacity-10'}`} style={{ width: '40px', height: '40px' }}>
                              <i className={`ri-calendar-todo-line fs-5 ${new Date(selectedTask.due_date) < new Date() && selectedTask.status !== 'COMPLETED' && selectedTask.status !== 'CANCELLED' ? 'text-danger' : 'text-warning'}`}></i>
                            </div>
                            <div className="flex-grow-1">
                              <p className="text-muted mb-0 fs-12 text-uppercase fw-semibold">Due Date</p>
                              <p className={`mb-0 fw-bold ${new Date(selectedTask.due_date) < new Date() && selectedTask.status !== 'COMPLETED' && selectedTask.status !== 'CANCELLED' ? 'text-danger' : ''}`}>
                                {formatDate(selectedTask.due_date)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="modal-footer border-top bg-light" style={{ position: 'sticky', bottom: 0, zIndex: 10 }}>
                  <div className="d-flex gap-2 w-100">
                    <button
                      className="btn btn-outline-primary"
                      onClick={handleViewTaskDetails}
                    >
                      <i className="ri-eye-line me-2"></i>
                      View Details
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteTask(selectedTask.id)}
                      disabled={deletingTaskId === selectedTask.id}
                    >
                      {deletingTaskId === selectedTask.id ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <i className="ri-delete-bin-line me-1"></i>
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CSS Animations */}
          <style>{`
            @keyframes slideInRight {
              from {
                transform: translateX(100%);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
            @keyframes slideOutRight {
              from {
                transform: translateX(0);
                opacity: 1;
              }
              to {
                transform: translateX(100%);
                opacity: 0;
              }
            }
            @media (max-width: 576px) {
              .modal[style*="width: 500px"] {
                width: 90vw !important;
                max-width: 90vw !important;
              }
            }
          `}</style>
        </>
      )}
      
      {/* Employee Activity Modal */}
      {showActivityModal && (
        <>
          {/* Backdrop */}
          <div 
            onClick={() => setShowActivityModal(false)}
            style={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1040,
              opacity: 1,
              transition: 'opacity 0.3s ease-in'
            }}
          ></div>
          
          {/* Modal Container */}
          <div 
            className="modal fade show"
            style={{ 
              display: 'block', 
              zIndex: 1050,
              position: 'fixed',
              top: 0,
              right: 0,
              left: 'auto',
              height: '100vh',
              width: '600px',
              maxWidth: '90vw',
              margin: 0,
              padding: 0,
              animation: 'slideInRight 0.3s ease-out',
              transform: 'translateX(0)',
              transition: 'transform 0.3s ease-out, opacity 0.3s ease-out'
            }}
            tabIndex="-1"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowActivityModal(false);
              }
            }}
          >
            <div 
              className="modal-dialog modal-dialog-scrollable h-100 m-0"
              style={{ 
                maxWidth: '100%', 
                width: '100%',
                margin: 0
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content h-100 border-0 rounded-0 shadow-lg">
                {/* Modal Header */}
                <div className="modal-header text border-0">
                  <div>
                    <h5 className="modal-title mb-0">
                      <i className="ri-bar-chart-line me-2"></i>
                      Employee Activity
                    </h5>
                    <p className="text-muted mb-0">
                      {selectedEmployeeData?.name || 'Employee'} - {currentActivityMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <button 
                    type="button" 
                    className="btn-close btn-close-danger" 
                    onClick={() => setShowActivityModal(false)}
                    aria-label="Close"
                  ></button>
                </div>

                {/* Modal Body */}
                <div className="modal-body p-4" style={{ paddingBottom: '100px' }}>
                  {/* Month Navigation */}
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <button 
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => {
                        const prevMonth = new Date(currentActivityMonth);
                        prevMonth.setMonth(prevMonth.getMonth() - 1);
                        setCurrentActivityMonth(prevMonth);
                      }}
                    >
                      <i className="ri-arrow-left-line"></i> Previous
                    </button>
                    
                    {/* View Detailed Activity Button */}
                    <button 
                      className="btn btn-sm btn-outline-primary mx-2"
                      onClick={() => {
                        // Open EmployeeCalendar page in a new window with the selected employee and department
                        const url = `/admin/employee-calendar?employeeId=${selectedEmployeeData?.user_id || selectedEmployeeData?.id}&departmentId=${selectedDepartment}&month=${currentActivityMonth.getMonth() + 1}&year=${currentActivityMonth.getFullYear()}`;
                        window.open(url, '_blank');
                      }}
                      title="View Detailed Activity"
                    >
                      <i className="ri-calendar-line"></i> View Detailed Activity
                    </button>
                    
                    <button 
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => {
                        const nextMonth = new Date(currentActivityMonth);
                        nextMonth.setMonth(nextMonth.getMonth() + 1);
                        setCurrentActivityMonth(nextMonth);
                      }}
                    >
                      Next <i className="ri-arrow-right-line"></i>
                    </button>
                  </div>
                  
                  {/* Activity Heatmap */}
                  <div className="card border-0 shadow-sm rounded-3 mb-3">
                    <div className="card-body">
                      {loadingActivity ? (
                        <div className="text-center py-5">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <p className="mt-2">Loading activity data...</p>
                        </div>
                      ) : Object.keys(activityCalendarData).length > 0 ? (
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
                              <span className="text-muted small">Upcoming</span>
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
                              <div className="monthly-heatmap-header">
                                <div className="monthly-heatmap-cell monthly-heatmap-day-header">Sun</div>
                                <div className="monthly-heatmap-cell monthly-heatmap-day-header">Mon</div>
                                <div className="monthly-heatmap-cell monthly-heatmap-day-header">Tue</div>
                                <div className="monthly-heatmap-cell monthly-heatmap-day-header">Wed</div>
                                <div className="monthly-heatmap-cell monthly-heatmap-day-header">Thu</div>
                                <div className="monthly-heatmap-cell monthly-heatmap-day-header">Fri</div>
                                <div className="monthly-heatmap-cell monthly-heatmap-day-header">Sat</div>
                              </div>
                              
                              {/* Calendar body with days */}
                              <div className="monthly-heatmap-body">
                                {/* Week rows - Calendar format */}
                                {(() => {
                                  const year = currentActivityMonth.getFullYear();
                                  const month = currentActivityMonth.getMonth();
                                  const daysInMonth = new Date(year, month + 1, 0).getDate();
                                  const firstDay = new Date(year, month, 1).getDay();
                                  
                                  // Create calendar grid similar to EmployeeCalendarTracker
                                  const calendarDays = [];
                                  
                                  // Add empty cells for days before the first day of the month
                                  for (let i = 0; i < firstDay; i++) {
                                    calendarDays.push(
                                      <div 
                                        key={`empty-${i}`} 
                                        className="monthly-heatmap-cell monthly-heatmap-empty"
                                      ></div>
                                    );
                                  }
                                  
                                  // Add cells for each day of the month
                                  for (let day = 1; day <= daysInMonth; day++) {
                                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                    const dayData = activityCalendarData[dateStr];
                                    const color = dayData?.color || 'yellow';
                                    
                                    // Apply filter: if activeFilter is set, only show matching colors, fade others
                                    const shouldShow = !activeFilter || activeFilter === color;
                                    const opacity = shouldShow ? 1 : 0.2;
                                    
                                    calendarDays.push(
                                      <div
                                        key={day}
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
                                  }
                                  
                                  return calendarDays;
                                })()}
                              </div>
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
                          <h5 className="mt-3">No activity data</h5>
                          <p className="text-muted">
                            No activity recorded for this period.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* CSS Styles */}
          <style>{`
            @keyframes slideInRight {
              from {
                transform: translateX(100%);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
            @keyframes slideOutRight {
              from {
                transform: translateX(0);
                opacity: 1;
              }
              to {
                transform: translateX(100%);
                opacity: 0;
              }
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
              grid-template-rows: auto 1fr;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
            }
            
            .monthly-heatmap-header {
              display: grid;
              grid-template-columns: repeat(7, 1fr);
              text-align: center;
              font-weight: bold;
              padding: 15px 0;
              background-color: #f8f9fa;
              border-bottom: 1px solid #e9ecef;
              color: #212529;
            }
            
            [data-bs-theme="dark"] .monthly-heatmap-header {
              background-color: #2b3035;
              border-bottom: 1px solid #495057;
              color: #f8f9fa;
            }
            
            .monthly-heatmap-body {
              display: grid;
              grid-template-columns: repeat(7, 1fr);
              gap: 8px;
              padding: 8px;
              background-color: transparent;
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
            
            @media (max-width: 576px) {
              .modal[style*="width: 500px"] {
                width: 90vw !important;
                max-width: 90vw !important;
              }
            }
          `}</style>
        </>
      )}
    </>
  );
};

export default EmployeeTaskManagement;